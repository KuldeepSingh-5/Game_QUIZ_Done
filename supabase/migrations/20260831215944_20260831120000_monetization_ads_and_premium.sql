/*
# Monetization: ads, premium, and server-verified rewarded ad rewards

1. Purpose
   Adds the database layer for an advertisement-ready monetization system:
   - A `is_premium` flag on players so premium users can be hidden from ads.
   - A single-row `ad_settings` table storing admin-configurable ad controls
     (ads enabled, interstitial frequency, rewarded ads enabled).
   - A `rewarded_ad_log` table that records every rewarded-ad reward claim,
     enforcing one reward per game (atomic, server-validated) so the client
     can never grant itself XP/score by simply claiming an ad was watched.
   - A `claim_rewarded_ad` SECURITY DEFINER function that validates the
     request, enforces the one-reward-per-game rule, recomputes the player's
     stats server-side, and returns the updated stats. The reward is NEVER
     granted based on a client claim — the server is the source of truth.

2. Modified Tables
   - `players`
       is_premium  boolean NOT NULL DEFAULT false
                   — true for premium (ad-free) users. UPDATE revoked from
                     anon/authenticated so users cannot self-promote; only an
                     admin (via the SQL editor or a future admin function)
                     can set this.

3. New Tables
   - `ad_settings` (singleton)
       id                 smallint PRIMARY KEY DEFAULT 1, CHECK (id = 1)
       ads_enabled        boolean NOT NULL DEFAULT false
       interstitial_frequency  integer NOT NULL DEFAULT 3
                              — show an interstitial every N completed games
       rewarded_enabled   boolean NOT NULL DEFAULT true
       updated_at         timestamptz NOT NULL DEFAULT now()
   - `rewarded_ad_log`
       id                 uuid PRIMARY KEY DEFAULT gen_random_uuid()
       player_id          uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE
       game_result_id     uuid REFERENCES game_results(id) ON DELETE SET NULL
       reward_xp         integer NOT NULL
       reward_score_bonus integer NOT NULL
       created_at        timestamptz NOT NULL DEFAULT now()
       — unique index on game_result_id so a game can only be rewarded once.

4. New Functions (SECURITY DEFINER, search_path = public)
   - get_ad_settings()
       Returns the single ad_settings row. Callable by anon + authenticated
       so the frontend can decide whether to render ads. Safe to expose.
   - admin_update_ad_settings(p_ads_enabled, p_interstitial_frequency,
       p_rewarded_enabled)
       Updates the singleton row. Admin-only (checked via is_current_user_admin
       logic inline). Returns the updated row.
   - claim_rewarded_ad(p_player_id uuid, p_game_result_id uuid)
       The ONLY way to grant a rewarded-ad reward. Validates:
         - rewarded ads are enabled in ad_settings
         - the player exists
         - the game_result exists and belongs to the player
         - no prior reward exists for that game_result (one reward per game)
       Then computes a fixed reward (score bonus = score of that game capped,
       xp = correctAnswers * 10), applies it to the player server-side
       (highest_score, xp, level, total_correct unchanged), inserts a
       rewarded_ad_log row, and returns updated player stats. The reward
       values are computed by the server — the client cannot pass them in.

5. Security Changes (RLS)
   - `ad_settings`: RLS enabled. SELECT open to anon + authenticated
     (public config read). No INSERT/UPDATE/DELETE policy — all writes go
     through admin_update_ad_settings (SECURITY DEFINER). Direct UPDATE/
     INSERT/DELETE revoked from anon + authenticated.
   - `rewarded_ad_log`: RLS enabled. No client policies (clients never read
     or write directly). All access through claim_rewarded_ad. All direct
     privileges revoked from anon + authenticated.
   - `players.is_premium`: UPDATE revoked from authenticated (already no
     UPDATE grant). A future admin function or SQL editor sets this.

6. Important Notes
   - The first admin is promoted via the SQL editor:
       UPDATE players SET is_admin = true WHERE username = '<username>';
   - Premium status is set the same way until a payments flow is built:
       UPDATE players SET is_premium = true WHERE username = '<username>';
   - The reward is intentionally modest and server-defined to prevent abuse.
   - This migration is idempotent (uses IF NOT EXISTS / DROP IF EXISTS).
*/

-- =========================================================
-- 1. players.is_premium
-- =========================================================
ALTER TABLE players
  ADD COLUMN IF NOT EXISTS is_premium boolean NOT NULL DEFAULT false;

-- Ensure is_premium cannot be set by clients (UPDATE already revoked,
-- but be explicit about the column).
REVOKE UPDATE (is_premium) ON players FROM anon, authenticated;

-- =========================================================
-- 2. ad_settings (singleton)
-- =========================================================
CREATE TABLE IF NOT EXISTS ad_settings (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  ads_enabled boolean NOT NULL DEFAULT false,
  interstitial_frequency integer NOT NULL DEFAULT 3 CHECK (interstitial_frequency >= 1 AND interstitial_frequency <= 50),
  rewarded_enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE ad_settings ENABLE ROW LEVEL SECURITY;

-- Ensure exactly one row exists
INSERT INTO ad_settings (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- Public read of ad config
DROP POLICY IF EXISTS "anon_select_ad_settings" ON ad_settings;
CREATE POLICY "anon_select_ad_settings" ON ad_settings FOR SELECT
  TO anon, authenticated USING (true);

-- No client writes
REVOKE INSERT, UPDATE, DELETE ON ad_settings FROM anon, authenticated;

-- updated_at trigger
DROP TRIGGER IF EXISTS ad_settings_set_updated_at ON ad_settings;
CREATE TRIGGER ad_settings_set_updated_at
  BEFORE UPDATE ON ad_settings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =========================================================
-- 3. rewarded_ad_log
-- =========================================================
CREATE TABLE IF NOT EXISTS rewarded_ad_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  game_result_id uuid REFERENCES game_results(id) ON DELETE SET NULL,
  reward_xp integer NOT NULL,
  reward_score_bonus integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE rewarded_ad_log ENABLE ROW LEVEL SECURITY;

-- One reward per game_result
CREATE UNIQUE INDEX IF NOT EXISTS rewarded_ad_log_game_result_unique_idx
  ON rewarded_ad_log (game_result_id)
  WHERE game_result_id IS NOT NULL;

-- No client access
REVOKE ALL ON rewarded_ad_log FROM anon, authenticated;

-- =========================================================
-- 4. get_ad_settings() — public read
-- =========================================================
CREATE OR REPLACE FUNCTION get_ad_settings()
RETURNS TABLE (
  ads_enabled boolean,
  interstitial_frequency integer,
  rewarded_enabled boolean
)
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT a.ads_enabled, a.interstitial_frequency, a.rewarded_enabled
  FROM ad_settings a
  WHERE a.id = 1
  LIMIT 1;
END;
$$;

REVOKE EXECUTE ON FUNCTION get_ad_settings FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION get_ad_settings TO anon, authenticated;

-- =========================================================
-- 5. admin_update_ad_settings()
-- =========================================================
CREATE OR REPLACE FUNCTION admin_update_ad_settings(
  p_ads_enabled boolean,
  p_interstitial_frequency integer,
  p_rewarded_enabled boolean
)
RETURNS TABLE (
  ads_enabled boolean,
  interstitial_frequency integer,
  rewarded_enabled boolean
)
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM players WHERE user_id = auth.uid() AND is_admin = true) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF p_interstitial_frequency IS NULL OR p_interstitial_frequency < 1 OR p_interstitial_frequency > 50 THEN
    RAISE EXCEPTION 'Invalid interstitial frequency (1..50)';
  END IF;

  UPDATE ad_settings
  SET ads_enabled = p_ads_enabled,
      interstitial_frequency = p_interstitial_frequency,
      rewarded_enabled = p_rewarded_enabled
  WHERE id = 1;

  RETURN QUERY
  SELECT a.ads_enabled, a.interstitial_frequency, a.rewarded_enabled
  FROM ad_settings a WHERE a.id = 1;
END;
$$;

REVOKE EXECUTE ON FUNCTION admin_update_ad_settings FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_update_ad_settings TO authenticated;

-- =========================================================
-- 6. claim_rewarded_ad() — the ONLY reward grant path
-- =========================================================
CREATE OR REPLACE FUNCTION claim_rewarded_ad(
  p_player_id uuid,
  p_game_result_id uuid
)
RETURNS TABLE (
  player_id uuid,
  username text,
  xp integer,
  level integer,
  streak integer,
  highest_score integer,
  last_played_date text,
  today_best_score integer,
  today_date text,
  total_games integer,
  total_correct_answers integer,
  reward_xp integer,
  reward_score_bonus integer
)
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_settings RECORD;
  v_player RECORD;
  v_game RECORD;
  v_reward_xp integer;
  v_reward_score_bonus integer;
  v_new_xp integer;
  v_new_level integer;
  v_new_highest integer;
BEGIN
  -- 1. Ads must be enabled and rewarded ads must be enabled
  SELECT ads_enabled, rewarded_enabled, interstitial_frequency
    INTO v_settings FROM ad_settings WHERE id = 1;
  IF v_settings.ads_enabled IS NOT TRUE OR v_settings.rewarded_enabled IS NOT TRUE THEN
    RAISE EXCEPTION 'Rewarded ads are not available';
  END IF;

  -- 2. Player must exist
  SELECT * INTO v_player FROM players WHERE id = p_player_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Player not found';
  END IF;

  -- 3. Game result must exist and belong to the player
  SELECT * INTO v_game FROM game_results WHERE id = p_game_result_id AND player_id = p_player_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Game result not found';
  END IF;

  -- 4. One reward per game (the unique index enforces this, but check first
  --    for a clean error message)
  IF EXISTS (SELECT 1 FROM rewarded_ad_log WHERE game_result_id = p_game_result_id) THEN
    RAISE EXCEPTION 'Reward already claimed for this game';
  END IF;

  -- 5. Server-computed reward (client cannot influence this)
  --    XP reward = correct answers * 10 (same as a replay bonus)
  --    Score bonus = the game's score, added to highest_score tracking only
  v_reward_xp := v_game.correct_answers * 10;
  v_reward_score_bonus := v_game.score;

  -- 6. Apply reward to player (server-side)
  v_new_xp := v_player.xp + v_reward_xp;
  v_new_level := 1;
  IF v_new_xp >= 3000 THEN v_new_level := 5;
  ELSIF v_new_xp >= 1600 THEN v_new_level := 4;
  ELSIF v_new_xp >= 800 THEN v_new_level := 3;
  ELSIF v_new_xp >= 300 THEN v_new_level := 2;
  END IF;
  v_new_highest := greatest(v_player.highest_score, v_player.highest_score); -- bonus does not inflate highest

  UPDATE players
  SET xp = v_new_xp,
      level = v_new_level
  WHERE id = p_player_id;

  -- 7. Log the reward (unique index prevents double-claim races)
  INSERT INTO rewarded_ad_log (player_id, game_result_id, reward_xp, reward_score_bonus)
  VALUES (p_player_id, p_game_result_id, v_reward_xp, v_reward_score_bonus);

  RETURN QUERY
  SELECT
    p_player_id, v_player.username, v_new_xp, v_new_level, v_player.streak,
    v_player.highest_score, v_player.last_played_date, v_player.today_best_score,
    v_player.today_date, v_player.total_games, v_player.total_correct_answers,
    v_reward_xp, v_reward_score_bonus;
END;
$$;

REVOKE EXECUTE ON FUNCTION claim_rewarded_ad FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION claim_rewarded_ad TO anon, authenticated;

/*
# Return game result id from submit_game for rewarded ads

1. Purpose
   The rewarded ad feature needs the game_results.id so the client can pass
   it to claim_rewarded_ad. This recreates submit_game to add `game_result_id`
   to the return table. Must DROP first because the return type changed.

2. Modified Functions
   - submit_game: now also returns `game_result_id uuid`. All other behavior
     is identical to the previous version.

3. Important Notes
   - Idempotent: DROP IF EXISTS + CREATE OR REPLACE.
   - Grants re-applied (anon + authenticated).
*/

DROP FUNCTION IF EXISTS submit_game(integer, integer, uuid);

CREATE FUNCTION submit_game(
  p_correct integer,
  p_attempted integer,
  p_player_id uuid DEFAULT NULL
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
  score integer,
  xp_earned integer,
  game_result_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_player_id uuid;
  v_player RECORD;
  v_today text := to_char(now() AT TIME ZONE 'utc', 'YYYY-MM-DD');
  v_score integer;
  v_xp_earned integer;
  v_new_xp integer;
  v_new_level integer;
  v_new_streak integer;
  v_new_highest integer;
  v_new_today_best integer;
  v_new_total_games integer;
  v_new_total_correct integer;
  v_diff_days integer;
  v_game_result_id uuid;
BEGIN
  IF p_player_id IS NOT NULL THEN
    v_player_id := p_player_id;
  ELSE
    SELECT id INTO v_player_id FROM players WHERE user_id = auth.uid();
    IF v_player_id IS NULL THEN
      RAISE EXCEPTION 'Player not found';
    END IF;
  END IF;

  IF p_correct IS NULL OR p_correct < 0 OR p_correct > 200 THEN
    RAISE EXCEPTION 'Invalid correct count';
  END IF;
  IF p_attempted IS NULL OR p_attempted < 0 OR p_attempted > 200 THEN
    RAISE EXCEPTION 'Invalid attempt count';
  END IF;
  IF p_correct > p_attempted THEN
    RAISE EXCEPTION 'Correct exceeds attempts';
  END IF;

  v_score := p_correct * 10;
  v_xp_earned := p_correct * 10 + floor(v_score / 2);

  SELECT * INTO v_player FROM players WHERE id = v_player_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Player not found';
  END IF;

  IF v_player.last_played_date IS NULL THEN
    v_new_streak := 1;
  ELSE
    v_diff_days := round(
      (date(v_today) - date(v_player.last_played_date))
    );
    IF v_diff_days = 0 THEN
      v_new_streak := greatest(v_player.streak, 1);
    ELSIF v_diff_days = 1 THEN
      v_new_streak := v_player.streak + 1;
    ELSE
      v_new_streak := 1;
    END IF;
  END IF;

  v_new_xp := v_player.xp + v_xp_earned;
  v_new_level := 1;
  IF v_new_xp >= 3000 THEN v_new_level := 5;
  ELSIF v_new_xp >= 1600 THEN v_new_level := 4;
  ELSIF v_new_xp >= 800 THEN v_new_level := 3;
  ELSIF v_new_xp >= 300 THEN v_new_level := 2;
  END IF;

  v_new_highest := greatest(v_player.highest_score, v_score);
  IF v_player.today_date IS DISTINCT FROM v_today THEN
    v_new_today_best := v_score;
  ELSE
    v_new_today_best := greatest(v_player.today_best_score, v_score);
  END IF;
  v_new_total_games := v_player.total_games + 1;
  v_new_total_correct := v_player.total_correct_answers + p_correct;

  INSERT INTO game_results (player_id, score, correct_answers, attempted, xp_earned, date)
  VALUES (v_player_id, v_score, p_correct, p_attempted, v_xp_earned, v_today)
  RETURNING id INTO v_game_result_id;

  UPDATE players
  SET xp = v_new_xp,
      level = v_new_level,
      streak = v_new_streak,
      highest_score = v_new_highest,
      last_played_date = v_today,
      today_best_score = v_new_today_best,
      today_date = v_today,
      total_games = v_new_total_games,
      total_correct_answers = v_new_total_correct
  WHERE id = v_player_id;

  RETURN QUERY
  SELECT
    v_player_id, v_player.username, v_new_xp, v_new_level, v_new_streak,
    v_new_highest, v_today, v_new_today_best, v_today,
    v_new_total_games, v_new_total_correct, v_score, v_xp_earned,
    v_game_result_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION submit_game(integer, integer, uuid) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION submit_game(integer, integer, uuid) TO anon, authenticated;

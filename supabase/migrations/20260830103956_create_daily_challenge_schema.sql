/*
# Daily Challenge — core schema

1. Purpose
   Creates the real database backend for the Daily Challenge 60-second brain game:
   player profiles, the question bank, and per-game results, plus a real
   leaderboard sorted by highest score.

2. New Tables
   - `players`
       id, username, xp, level, streak, highest_score, last_played_date,
       today_best_score, today_date, total_games, created_at
   - `questions`
       id, question, options[4], correct_answer, category, difficulty, created_at
   - `game_results`
       id, player_id FK, score, correct_answers, attempted, xp_earned, date, created_at

3. Indexes
   - players: highest_score desc, xp desc (leaderboard)
   - game_results: player_id+date desc, score desc, date desc

4. Security (RLS)
   No-auth (guest-mode) app: browser uses anon key, so every policy lists
   `anon, authenticated`. Data is intentionally shared (public leaderboard),
   so SELECT is open. Writes are open to anon so guests can create/update
   their profile and submit scores without signing in.
*/

-- Players
CREATE TABLE IF NOT EXISTS players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL,
  xp integer NOT NULL DEFAULT 0,
  level integer NOT NULL DEFAULT 1,
  streak integer NOT NULL DEFAULT 0,
  highest_score integer NOT NULL DEFAULT 0,
  last_played_date text,
  today_best_score integer NOT NULL DEFAULT 0,
  today_date text,
  total_games integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE players ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_players" ON players;
CREATE POLICY "anon_select_players" ON players FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_players" ON players;
CREATE POLICY "anon_insert_players" ON players FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_players" ON players;
CREATE POLICY "anon_update_players" ON players FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS players_highest_score_idx ON players (highest_score DESC);
CREATE INDEX IF NOT EXISTS players_xp_idx ON players (xp DESC);

-- Questions
CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  options text[] NOT NULL DEFAULT '{}',
  correct_answer smallint NOT NULL,
  category text NOT NULL,
  difficulty text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_questions" ON questions;
CREATE POLICY "anon_select_questions" ON questions FOR SELECT
  TO anon, authenticated USING (true);

-- Game results
CREATE TABLE IF NOT EXISTS game_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  score integer NOT NULL,
  correct_answers integer NOT NULL,
  attempted integer NOT NULL,
  xp_earned integer NOT NULL,
  date text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE game_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_game_results" ON game_results;
CREATE POLICY "anon_select_game_results" ON game_results FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_game_results" ON game_results;
CREATE POLICY "anon_insert_game_results" ON game_results FOR INSERT
  TO anon, authenticated WITH CHECK (true);

CREATE INDEX IF NOT EXISTS game_results_player_date_idx ON game_results (player_id, date DESC);
CREATE INDEX IF NOT EXISTS game_results_score_idx ON game_results (score DESC);
CREATE INDEX IF NOT EXISTS game_results_date_idx ON game_results (date DESC);
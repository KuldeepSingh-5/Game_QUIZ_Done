/*
# Daily Challenge — core schema

1. Purpose
   Creates the real database backend for the Daily Challenge 60-second brain game:
   player profiles, the question bank, and per-game results, plus a real
   leaderboard sorted by highest score.

2. New Tables
   - `players`
       id              uuid PK
       username        text, not null (guest display name)
       xp              int, default 0
       level           int, default 1 (1..5)
       streak          int, default 0 (consecutive days)
       highest_score   int, default 0
       last_played_date text (YYYY-MM-DD UTC) or null
       today_best_score int, default 0
       today_date       text (YYYY-MM-DD UTC) or null
       total_games      int, default 0
       created_at      timestamptz, default now()
   - `questions`
       id              uuid PK
       question        text, not null
       options         text[], length 4
       correct_answer  smallint (0..3)
       category        text (Math, Logic, Words, Science, Trivia, Patterns)
       difficulty      text (easy, medium, hard)
       created_at      timestamptz, default now()
   - `game_results`
       id              uuid PK
       player_id       uuid FK -> players.id ON DELETE CASCADE
       score           int, not null
       correct_answers int, not null
       attempted       int, not null
       xp_earned       int, not null
       date            text (YYYY-MM-DD UTC), not null
       created_at      timestamptz, default now()

3. Indexes
   - players: highest_score desc, xp desc (leaderboard)
   - game_results: player_id + date desc, score desc, date desc

4. Security (RLS)
   This is a no-auth (guest-mode) app: the browser uses the anon key, so every
   policy lists `anon, authenticated`. Data is intentionally shared (public
   leaderboard), so SELECT is open. Writes are open to anon so guests can
   create/update their profile and submit scores without signing in.
   - players:     anon+authenticated SELECT/INSERT/UPDATE
   - questions:   anon+authenticated SELECT only (seeded via migration)
   - game_results: anon+authenticated SELECT/INSERT
*/
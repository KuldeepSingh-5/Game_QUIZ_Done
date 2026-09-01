/*
# Tighten player and game-result write permissions

1. Purpose
   Prevent browser clients from assigning privileged player fields or deleting
   shared leaderboard data. Legitimate guest creation and authenticated profile
   creation remain supported.

2. Modified Tables
   - `players`
     - Clients may insert only username, email, and user_id.
     - `is_admin` and `is_premium` cannot be inserted by browser roles.
     - Direct deletes are disabled; profile/stat changes continue through the
       existing server-side functions.
   - `game_results`
     - Direct deletes are disabled; results remain managed by submit_game.

3. Security Changes
   - Replace broad INSERT privileges with explicit column grants.
   - Add an INSERT policy requiring user_id to be null for guests or equal to
     the authenticated session user.
   - Remove anonymous and authenticated DELETE policies and privileges.

4. Important Notes
   - Guest mode still inserts a username with no user_id.
   - Registered profiles still insert username, email, and their own user_id.
   - Existing rows are not changed or removed.
*/

DROP POLICY IF EXISTS "anon_insert_players" ON players;
CREATE POLICY "safe_insert_players" ON players FOR INSERT
  TO anon, authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

REVOKE INSERT ON players FROM anon, authenticated;
GRANT INSERT (username, email, user_id) ON players TO anon, authenticated;

DROP POLICY IF EXISTS "anon_delete_players" ON players;
REVOKE DELETE ON players FROM anon, authenticated;

DROP POLICY IF EXISTS "anon_delete_game_results" ON game_results;
REVOKE DELETE ON game_results FROM anon, authenticated;

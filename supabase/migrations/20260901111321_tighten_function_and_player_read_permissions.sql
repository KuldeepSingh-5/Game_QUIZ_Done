/*
# Tighten remote function and player read permissions

1. Purpose
   Reduce the public attack surface of the Daily Challenge database without
   changing the gameplay, profile, or leaderboard experience.

2. Modified Functions
   - Administrative question, dashboard, and ad-setting functions are callable
     only by authenticated sessions. Each function already verifies that the
     authenticated player is an administrator.
   - Public gameplay functions remain available to guests because guest mode
     depends on them.

3. Modified Tables
   - `players`
     - Browser reads expose only public identity and gameplay statistics.
     - Email, authentication linkage, administrator status, and premium status
       are no longer directly readable through the Data API.
   - `game_results`
     - Direct browser updates are removed because results are written by the
       server-side submit function.

4. Security Changes
   - Revoke anonymous EXECUTE permission from every administrative function.
   - Restrict player SELECT privileges to fields needed by the application.
   - Revoke direct UPDATE permission on game results.

5. Important Notes
   - Authenticated administrators continue using the same admin RPCs.
   - Guest gameplay and public leaderboard queries continue using their existing
     read and gameplay function paths.
   - Existing rows and data are not deleted or changed.
*/

REVOKE EXECUTE ON FUNCTION admin_create_question(text, text[], smallint, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION admin_update_question(uuid, text, text[], smallint, text, text, boolean) FROM anon;
REVOKE EXECUTE ON FUNCTION admin_delete_question(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION admin_toggle_question(uuid, boolean) FROM anon;
REVOKE EXECUTE ON FUNCTION admin_stats() FROM anon;
REVOKE EXECUTE ON FUNCTION admin_list_questions(integer, integer, text, text, text, boolean) FROM anon;
REVOKE EXECUTE ON FUNCTION admin_update_ad_settings(boolean, integer, boolean) FROM anon;
REVOKE EXECUTE ON FUNCTION is_current_user_admin() FROM anon;

REVOKE SELECT ON players FROM anon, authenticated;
GRANT SELECT (
  id,
  username,
  xp,
  level,
  streak,
  highest_score,
  last_played_date,
  today_best_score,
  today_date,
  total_games,
  total_correct_answers
) ON players TO anon, authenticated;

REVOKE UPDATE ON game_results FROM anon, authenticated;

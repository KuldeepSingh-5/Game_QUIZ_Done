/*
# Correct public function and player column grants

1. Purpose
   Correct the privilege scope from the previous hardening migration while
   preserving all existing gameplay and leaderboard behavior.

2. Modified Functions
   - Administrative RPCs no longer inherit EXECUTE permission from PUBLIC.
   - Authenticated callers retain EXECUTE permission and the functions keep
     their internal administrator checks.

3. Modified Tables
   - `players`
     - Public SELECT remains available for profile and leaderboard data.
     - Sensitive columns `email`, `user_id`, `is_admin`, and `is_premium` are
       excluded from browser reads.

4. Security Changes
   - Explicitly revoke administrative function execution from PUBLIC and anon.
   - Revoke SELECT only for sensitive player columns from browser roles.

5. Important Notes
   - No rows are deleted or modified.
   - Public gameplay functions are unchanged.
   - Existing profile and leaderboard fields remain readable.
*/

REVOKE EXECUTE ON FUNCTION admin_create_question(text, text[], smallint, text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION admin_update_question(uuid, text, text[], smallint, text, text, boolean) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION admin_delete_question(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION admin_toggle_question(uuid, boolean) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION admin_stats() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION admin_list_questions(integer, integer, text, text, text, boolean) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION admin_update_ad_settings(boolean, integer, boolean) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION is_current_user_admin() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION admin_create_question(text, text[], smallint, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_update_question(uuid, text, text[], smallint, text, text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_delete_question(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_toggle_question(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION admin_list_questions(integer, integer, text, text, text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_update_ad_settings(boolean, integer, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION is_current_user_admin() TO authenticated;

GRANT SELECT ON players TO anon, authenticated;
REVOKE SELECT (email, user_id, is_admin, is_premium) ON players FROM anon, authenticated;

-- Promote an existing user to ROLE_PLATFORM_ADMIN
-- Idempotent: safe to re-run.
--
-- Usage:
--   psql -U salesmanager -d salesmanager -v username='alice' -f promote-platform-admin.sql
--
-- Notes:
-- - Works on Postgres.
-- - Will error if user not found.

DO $$
DECLARE
  v_username text := nullif(current_setting('psql.username', true), '');
  v_user_id bigint;
BEGIN
  -- psql exposes -v vars as :"var" only; we re-read via current_setting fallback if set,
  -- otherwise use the psql substitution directly (below) when running from psql.
  -- If you run from a GUI, replace :'username' manually.
  IF v_username IS NULL THEN
    v_username := :'username';
  END IF;

  SELECT id INTO v_user_id
  FROM users
  WHERE username = v_username;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found: %', v_username;
  END IF;

  INSERT INTO user_roles(user_id, roles)
  VALUES (v_user_id, 'ROLE_PLATFORM_ADMIN')
  ON CONFLICT (user_id, roles) DO NOTHING;
END $$;


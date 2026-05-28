-- Seed: users de test (MANAGER / USER)
-- Idempotent: peut être relancé sans dupliquer.
--
-- Password commun (BCrypt) : "password"
-- NB: en prod, ne jamais commiter de seeds de users réels.

WITH upsert AS (
  INSERT INTO users (username, email, password, first_name, last_name, preferred_language, preferred_currency, created_at, updated_at, enabled)
  VALUES
    ('manager1', 'manager1@test.local', '$2a$10$7EqJtq98hPqEX7fNZaFWoOhi5yFzZP8w7FQz7y8mZz7lZ2fYq6m5a', 'Manager', 'One', 'fr', 'EUR', now(), now(), true),
    ('manager2', 'manager2@test.local', '$2a$10$7EqJtq98hPqEX7fNZaFWoOhi5yFzZP8w7FQz7y8mZz7lZ2fYq6m5a', 'Manager', 'Two', 'fr', 'EUR', now(), now(), true),
    ('user1',    'user1@test.local',    '$2a$10$7EqJtq98hPqEX7fNZaFWoOhi5yFzZP8w7FQz7y8mZz7lZ2fYq6m5a', 'User',    'One', 'fr', 'EUR', now(), now(), true),
    ('user2',    'user2@test.local',    '$2a$10$7EqJtq98hPqEX7fNZaFWoOhi5yFzZP8w7FQz7y8mZz7lZ2fYq6m5a', 'User',    'Two', 'fr', 'EUR', now(), now(), true),
    ('user3',    'user3@test.local',    '$2a$10$7EqJtq98hPqEX7fNZaFWoOhi5yFzZP8w7FQz7y8mZz7lZ2fYq6m5a', 'User',    'Three', 'fr', 'EUR', now(), now(), true)
  ON CONFLICT (username) DO UPDATE
    SET email = EXCLUDED.email,
        password = EXCLUDED.password,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        preferred_language = EXCLUDED.preferred_language,
        preferred_currency = EXCLUDED.preferred_currency,
        updated_at = now(),
        enabled = EXCLUDED.enabled
  RETURNING id, username
)
-- Roles: Spring attend "ROLE_*" (voir User.getAuthorities()).
INSERT INTO user_roles (user_id, roles)
SELECT u.id,
       CASE
         WHEN u.username LIKE 'manager%' THEN 'ROLE_MANAGER'
         ELSE 'ROLE_USER'
       END AS roles
FROM users u
WHERE u.username IN ('manager1','manager2','user1','user2','user3')
ON CONFLICT (user_id, roles) DO NOTHING;


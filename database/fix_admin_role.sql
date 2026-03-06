-- Allow ADMIN role in users table (run once if you get users_role_check violation).
-- Usage: cat database/fix_admin_role.sql | docker compose exec -T postgres psql -U postgres -d grantdb

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('APPLICANT', 'REVIEWER', 'ADMIN'));

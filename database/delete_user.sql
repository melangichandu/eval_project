-- Delete user 72dc0a6e-f677-48d9-9d4e-ec50d754029d
-- Clears FK references first so the delete succeeds.

BEGIN;

-- Applications where this user is reviewer: clear reviewer_id
UPDATE applications
SET reviewer_id = NULL
WHERE reviewer_id = '72dc0a6e-f677-48d9-9d4e-ec50d754029d';

-- Status history rows where this user changed status (must remove before deleting user)
DELETE FROM status_history
WHERE changed_by_id = '72dc0a6e-f677-48d9-9d4e-ec50d754029d';

-- Delete the user (applications where they are applicant_id will CASCADE via schema)
DELETE FROM users
WHERE id = '72dc0a6e-f677-48d9-9d4e-ec50d754029d';

COMMIT;

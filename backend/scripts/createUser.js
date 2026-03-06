/**
 * Create a new ADMIN or REVIEWER user (no UI for these roles).
 * Usage:
 *   EMAIL=admin2@example.com PASSWORD=SecurePass123 ROLE=ADMIN node scripts/createUser.js
 *   EMAIL=reviewer@example.com PASSWORD=SecurePass123 ROLE=REVIEWER FULL_NAME="Jane Doe" node scripts/createUser.js
 *
 * With Docker:
 *   docker compose run --rm -e EMAIL=admin2@example.com -e PASSWORD=SecurePass123 -e ROLE=ADMIN backend node scripts/createUser.js
 *
 * Env:
 *   EMAIL    (required)
 *   PASSWORD (required, min 8 chars)
 *   ROLE     (required) ADMIN or REVIEWER
 *   FULL_NAME, PHONE, ORGANIZATION_NAME (optional; defaults shown below)
 */
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const EMAIL = process.env.EMAIL?.trim()?.toLowerCase();
const PASSWORD = process.env.PASSWORD;
const ROLE = (process.env.ROLE || '').toUpperCase();
const FULL_NAME = process.env.FULL_NAME?.trim() || 'User';
const PHONE = process.env.PHONE?.trim() || '';
const ORGANIZATION_NAME = process.env.ORGANIZATION_NAME?.trim() || '';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/grantdb';

const VALID_ROLES = ['ADMIN', 'REVIEWER'];

async function run() {
  if (!EMAIL) {
    console.error('Missing EMAIL. Example: EMAIL=admin@example.com PASSWORD=Secret123 ROLE=ADMIN node scripts/createUser.js');
    process.exit(1);
  }
  if (!PASSWORD || PASSWORD.length < 8) {
    console.error('PASSWORD is required and must be at least 8 characters.');
    process.exit(1);
  }
  if (!VALID_ROLES.includes(ROLE)) {
    console.error(`ROLE must be one of: ${VALID_ROLES.join(', ')}`);
    process.exit(1);
  }

  const pool = new Pool({ connectionString: DATABASE_URL });
  const cost = 10;
  try {
    const password_hash = await bcrypt.hash(PASSWORD, cost);
    await pool.query(
      `INSERT INTO users (email, password_hash, full_name, phone, organization_name, role)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (email) DO UPDATE SET
         password_hash = EXCLUDED.password_hash,
         full_name = EXCLUDED.full_name,
         phone = EXCLUDED.phone,
         organization_name = EXCLUDED.organization_name,
         role = EXCLUDED.role`,
      [EMAIL, password_hash, FULL_NAME, PHONE || '(unset)', ORGANIZATION_NAME || '(unset)', ROLE]
    );
    console.log(`Created/updated ${ROLE}: ${EMAIL}`);
  } finally {
    await pool.end();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

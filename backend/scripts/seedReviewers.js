/**
 * Seed reviewer accounts. Run after schema is applied.
 * Usage: DATABASE_URL=postgresql://user:pass@host:5432/db node scripts/seedReviewers.js
 */
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const REVIEWERS = [
  { email: 'marcus.johnson@maplewood.gov', password: 'Reviewer123', full_name: 'Marcus Johnson', phone: '(410) 555-0100', organization_name: 'Maplewood County Government' },
  { email: 'sarah.mitchell@maplewood.gov', password: 'Reviewer123', full_name: 'Sarah Mitchell', phone: '(410) 555-0101', organization_name: 'Maplewood County Government' },
];

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/grantdb';

async function seed() {
  const pool = new Pool({ connectionString: DATABASE_URL });
  const cost = 10;
  try {
    for (const r of REVIEWERS) {
      const password_hash = await bcrypt.hash(r.password, cost);
      await pool.query(
        `INSERT INTO users (email, password_hash, full_name, phone, organization_name, role)
         VALUES ($1, $2, $3, $4, $5, 'REVIEWER')
         ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
        [r.email, password_hash, r.full_name, r.phone, r.organization_name]
      );
      console.log('Seeded reviewer:', r.email);
    }
    console.log('Reviewer seed complete.');
  } finally {
    await pool.end();
  }
}

seed().catch((err) => { console.error(err); process.exit(1); });

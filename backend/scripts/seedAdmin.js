/**
 * Seed one admin account. Run after schema is applied.
 * Usage: DATABASE_URL=postgresql://user:pass@host:5432/db node scripts/seedAdmin.js
 */
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const ADMIN = {
  email: 'admin@maplewood.gov',
  password: 'Admin123',
  full_name: 'System Admin',
  phone: '(410) 555-0000',
  organization_name: 'Maplewood County',
};

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/grantdb';

async function seed() {
  const pool = new Pool({ connectionString: DATABASE_URL });
  const cost = 10;
  try {
    const password_hash = await bcrypt.hash(ADMIN.password, cost);
    await pool.query(
      `INSERT INTO users (email, password_hash, full_name, phone, organization_name, role)
       VALUES ($1, $2, $3, $4, $5, 'ADMIN')
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = 'ADMIN'`,
      [ADMIN.email, password_hash, ADMIN.full_name, ADMIN.phone, ADMIN.organization_name]
    );
    console.log('Seeded admin:', ADMIN.email);
    console.log('Admin seed complete.');
  } finally {
    await pool.end();
  }
}

seed().catch((err) => { console.error(err); process.exit(1); });

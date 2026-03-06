const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
const { JWT_SECRET } = require('../middleware/auth');

const SALT_ROUNDS = 10;
const TOKEN_EXPIRY = '30m';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateRegisterBody(body) {
  const { email, password, fullName, phone, organizationName } = body;
  if (!email || typeof email !== 'string') return 'Email is required';
  if (!password || typeof password !== 'string') return 'Password is required';
  if (!fullName || typeof fullName !== 'string') return 'Full name is required';
  if (!phone || typeof phone !== 'string') return 'Phone is required';
  if (!organizationName || typeof organizationName !== 'string') return 'Organization name is required';

  const trimmedFullName = fullName.trim();
  if (trimmedFullName.length < 2) return 'Full name must be at least 2 characters';
  if (trimmedFullName.length > 100) return 'Full name must be at most 100 characters';

  const trimmedEmail = email.trim().toLowerCase();
  if (!EMAIL_REGEX.test(trimmedEmail)) return 'Email format is invalid';

  if (password.length < 8) return 'Password must be at least 8 characters';

  return null;
}

async function register(req, res, next) {
  try {
    const validationError = validateRegisterBody(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }
    const { email, password, fullName, phone, organizationName } = req.body;
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, full_name, phone, organization_name, role)
       VALUES ($1, $2, $3, $4, $5, 'APPLICANT')
       RETURNING id, email, full_name, phone, organization_name, role, created_at`,
      [normalizedEmail, password_hash, fullName.trim(), phone.trim(), organizationName.trim()]
    );
    const user = result.rows[0];
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );
    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        phone: user.phone,
        organizationName: user.organization_name,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    const normalizedEmail = email.trim().toLowerCase();
    const result = await pool.query(
      'SELECT id, email, password_hash, full_name, phone, organization_name, role FROM users WHERE email = $1',
      [normalizedEmail]
    );
    if (result.rows.length === 0) {
      console.warn('[auth] Login failed: no user for email', normalizedEmail);
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      console.warn('[auth] Login failed: wrong password for', user.email);
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        phone: user.phone,
        organizationName: user.organization_name,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login };

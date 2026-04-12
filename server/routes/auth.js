const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../db/database');
const { requireAuth } = require('../middleware/auth');
const { getTier } = require('../lib/tiers');

const router = express.Router();

function makeToken(user) {
  const payload = { id: user.id, email: user.email, first_name: user.first_name };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '30d' });
}

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  const { first_name, email, phone, password, date_of_birth } = req.body;

  if (!first_name || !email || !phone || !password || !date_of_birth) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  // Age validation — must be 18+
  const dob = new Date(date_of_birth);
  const now = new Date();
  const age = now.getFullYear() - dob.getFullYear() -
    (now < new Date(now.getFullYear(), dob.getMonth(), dob.getDate()) ? 1 : 0);
  if (age < 18) {
    return res.status(400).json({ error: 'You must be 18 or older to sign up.' });
  }

  const existingRes = await db.query(
    'SELECT id FROM users WHERE email = $1 OR phone = $2',
    [email.toLowerCase().trim(), phone.trim()]
  );
  if (existingRes.rows.length > 0) {
    return res.status(409).json({ error: 'An account with this email or phone number already exists.' });
  }

  const password_hash = await bcrypt.hash(password, 12);

  const result = await db.query(
    `INSERT INTO users (first_name, email, phone, password_hash, date_of_birth)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [first_name.trim(), email.toLowerCase().trim(), phone.trim(), password_hash, date_of_birth]
  );

  const user = { id: result.rows[0].id, email: email.toLowerCase().trim(), first_name: first_name.trim() };
  const token = makeToken(user);
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'none',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });
  res.status(201).json({ user: { id: user.id, first_name: user.first_name, email: user.email } });
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });

  const userRes = await db.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
  const user = userRes.rows[0];
  if (!user) return res.status(401).json({ error: 'Invalid email or password.' });

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) return res.status(401).json({ error: 'Invalid email or password.' });

  const token = makeToken(user);
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'none',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });
  res.json({ user: { id: user.id, first_name: user.first_name, email: user.email } });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'none',
  });
  res.json({ ok: true });
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
  const userRes = await db.query(
    `SELECT id, first_name, email
     FROM users WHERE id = $1`,
    [req.user.id]
  );
  const user = userRes.rows[0];
  if (!user) return res.status(404).json({ error: 'User not found.' });

  const countRes = await db.query(
    `SELECT COUNT(*) AS count FROM tickets WHERE lister_id = $1 AND status != 'cancelled'`,
    [req.user.id]
  );
  const listing_count = parseInt(countRes.rows[0].count, 10);
  const tier = getTier(listing_count);

  res.json({ user: { ...user, listing_count, tier } });
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required.' });

  const userRes = await db.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
  const user = userRes.rows[0];
  if (user) {
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expires = new Date(Date.now() + 3600000).toISOString(); // 1 hour
    await db.query(
      'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
      [tokenHash, expires, user.id]
    );
    console.log('Reset link:', `https://rallybro.com/reset-password?token=${token}`);
  }

  // Always return success to prevent email enumeration
  res.json({ message: "If an account exists with that email, you'll receive reset instructions shortly." });
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) return res.status(400).json({ error: 'Token and new password are required.' });
  if (newPassword.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' });

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const userRes = await db.query(
    'SELECT id FROM users WHERE reset_token = $1 AND reset_token_expires > $2',
    [tokenHash, new Date().toISOString()]
  );
  const user = userRes.rows[0];

  if (!user) return res.status(400).json({ error: 'This reset link is invalid or has expired.' });

  const password_hash = await bcrypt.hash(newPassword, 12);
  await db.query(
    'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2',
    [password_hash, user.id]
  );

  res.json({ message: 'Password updated successfully.' });
});

module.exports = router;

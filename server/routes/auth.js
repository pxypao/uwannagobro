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
router.post('/signup', (req, res) => {
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

  const existing = db.prepare(
    'SELECT id FROM users WHERE email = ? OR phone = ?'
  ).get(email.toLowerCase().trim(), phone.trim());
  if (existing) {
    return res.status(409).json({ error: 'An account with this email or phone number already exists.' });
  }

  const password_hash = bcrypt.hashSync(password, 12);

  const result = db.prepare(`
    INSERT INTO users (first_name, email, phone, password_hash, date_of_birth)
    VALUES (?, ?, ?, ?, ?)
  `).run(first_name.trim(), email.toLowerCase().trim(), phone.trim(), password_hash, date_of_birth);

  const user = { id: result.lastInsertRowid, email: email.toLowerCase().trim(), first_name: first_name.trim() };
  const token = makeToken(user);
  res.status(201).json({ user: { id: user.id, first_name: user.first_name, email: user.email }, token });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (!user) return res.status(401).json({ error: 'Invalid email or password.' });

  const match = bcrypt.compareSync(password, user.password_hash);
  if (!match) return res.status(401).json({ error: 'Invalid email or password.' });

  const token = makeToken(user);
  res.json({ user: { id: user.id, first_name: user.first_name, email: user.email }, token });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  // Token is stored client-side; nothing to invalidate server-side
  res.json({ ok: true });
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare(`
    SELECT id, first_name, email, is_verified_sth, sth_verification_submitted, sth_team
    FROM users WHERE id = ?
  `).get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found.' });

  const { count: listing_count } = db.prepare(`
    SELECT COUNT(*) AS count FROM tickets WHERE lister_id = ? AND status != 'cancelled'
  `).get(req.user.id);

  const tier = getTier(listing_count);

  res.json({ user: { ...user, listing_count, tier } });
});

// POST /api/auth/forgot-password
router.post('/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required.' });

  const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (user) {
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expires = new Date(Date.now() + 3600000).toISOString(); // 1 hour
    db.prepare('UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?')
      .run(tokenHash, expires, user.id);
    console.log('Reset link:', `https://uwannagobro.com/reset-password?token=${token}`);
  }

  // Always return success to prevent email enumeration
  res.json({ message: "If an account exists with that email, you'll receive reset instructions shortly." });
});

// POST /api/auth/reset-password
router.post('/reset-password', (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) return res.status(400).json({ error: 'Token and new password are required.' });
  if (newPassword.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' });

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const user = db.prepare(
    'SELECT id FROM users WHERE reset_token = ? AND reset_token_expires > ?'
  ).get(tokenHash, new Date().toISOString());

  if (!user) return res.status(400).json({ error: 'This reset link is invalid or has expired.' });

  const password_hash = bcrypt.hashSync(newPassword, 12);
  db.prepare('UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?')
    .run(password_hash, user.id);

  res.json({ message: 'Password updated successfully.' });
});

module.exports = router;

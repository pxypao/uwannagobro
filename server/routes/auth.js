const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/database');
const { requireAuth } = require('../middleware/auth');
const { getTier } = require('../lib/tiers');

const router = express.Router();

function issueToken(res, user) {
  const payload = { id: user.id, email: user.email, first_name: user.first_name };
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
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
  issueToken(res, user);
  res.status(201).json({ user: { id: user.id, first_name: user.first_name, email: user.email } });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (!user) return res.status(401).json({ error: 'Invalid email or password.' });

  const match = bcrypt.compareSync(password, user.password_hash);
  if (!match) return res.status(401).json({ error: 'Invalid email or password.' });

  issueToken(res, user);
  res.json({ user: { id: user.id, first_name: user.first_name, email: user.email } });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  });
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

module.exports = router;

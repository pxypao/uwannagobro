const express = require('express');
const path    = require('path');
const multer  = require('multer');
const db      = require('../db/database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Multer — store in /uploads, limit 10 MB, only images + PDF
const storage = multer.diskStorage({
  destination: path.join(__dirname, '../uploads'),
  filename: (_req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase();
    const safe = `sth_${Date.now()}${ext}`;
    cb(null, safe);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = /^(image\/(jpeg|png|webp|gif)|application\/pdf)$/.test(file.mimetype);
    ok ? cb(null, true) : cb(new Error('Only images and PDFs are allowed.'));
  },
});

// POST /api/sth/apply  — submit verification request
router.post('/apply', requireAuth, upload.single('proof'), async (req, res) => {
  const { team } = req.body;
  if (!team || !team.trim()) {
    return res.status(400).json({ error: 'Team name is required.' });
  }
  if (!req.file) {
    return res.status(400).json({ error: 'Proof of season ticket is required.' });
  }

  const userRes = await db.query(
    'SELECT is_verified_sth, sth_verification_submitted FROM users WHERE id = $1',
    [req.user.id]
  );
  const user = userRes.rows[0];
  if (user.is_verified_sth) {
    return res.status(409).json({ error: 'You are already verified.' });
  }

  await db.query(
    `UPDATE users SET sth_verification_submitted = TRUE, sth_team = $1 WHERE id = $2`,
    [team.trim().slice(0, 100), req.user.id]
  );

  res.json({ ok: true, pending: true });
});

// GET /api/admin/users — list all registered users (requires ADMIN_SECRET)
router.get('/users', async (req, res) => {
  const secret = process.env.ADMIN_SECRET;
  if (!secret || req.query.secret !== secret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const result = await db.query(`
    SELECT id, first_name, email, phone, created_at,
           is_verified_sth, sth_team, sth_verification_submitted
    FROM users ORDER BY created_at DESC
  `);
  res.json({ count: result.rows.length, users: result.rows });
});

// POST /api/admin/verify-sth/:user_id  — admin toggle
router.post('/verify-sth/:user_id', async (req, res) => {
  const userRes = await db.query('SELECT id FROM users WHERE id = $1', [req.params.user_id]);
  const user = userRes.rows[0];
  if (!user) return res.status(404).json({ error: 'User not found.' });

  await db.query(
    `UPDATE users SET is_verified_sth = TRUE, sth_verification_submitted = TRUE WHERE id = $1`,
    [user.id]
  );

  res.json({ ok: true, user_id: user.id });
});

module.exports = router;

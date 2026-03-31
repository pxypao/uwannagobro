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
router.post('/apply', requireAuth, upload.single('proof'), (req, res) => {
  const { team } = req.body;
  if (!team || !team.trim()) {
    return res.status(400).json({ error: 'Team name is required.' });
  }
  if (!req.file) {
    return res.status(400).json({ error: 'Proof of season ticket is required.' });
  }

  const user = db.prepare('SELECT is_verified_sth, sth_verification_submitted FROM users WHERE id = ?').get(req.user.id);
  if (user.is_verified_sth) {
    return res.status(409).json({ error: 'You are already verified.' });
  }

  db.prepare(`
    UPDATE users
    SET sth_verification_submitted = 1,
        sth_team = ?
    WHERE id = ?
  `).run(team.trim().slice(0, 100), req.user.id);

  res.json({ ok: true, pending: true });
});

// GET /api/admin/users — list all registered users (requires ADMIN_SECRET)
router.get('/users', (req, res) => {
  const secret = process.env.ADMIN_SECRET;
  if (!secret || req.query.secret !== secret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const users = db.prepare(`
    SELECT id, first_name, email, phone, created_at,
           is_verified_sth, sth_team, sth_verification_submitted
    FROM users ORDER BY created_at DESC
  `).all();
  res.json({ count: users.length, users });
});

// POST /api/admin/verify-sth/:user_id  — admin toggle (no auth guard in dev)
// mounted at /api/admin → route is /verify-sth/:user_id
router.post('/verify-sth/:user_id', (req, res) => {
  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(req.params.user_id);
  if (!user) return res.status(404).json({ error: 'User not found.' });

  db.prepare(`
    UPDATE users SET is_verified_sth = 1, sth_verification_submitted = 1 WHERE id = ?
  `).run(user.id);

  res.json({ ok: true, user_id: user.id });
});

module.exports = router;

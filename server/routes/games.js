const express = require('express');
const db = require('../db/database');
const { syncAllTeams } = require('../lib/scheduleSync');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'jadenmarting@gmail.com';

// GET /api/games?q=hops — search upcoming games for autofill
router.get('/', async (req, res) => {
  const q = (req.query.q || '').trim().toLowerCase();
  const today = new Date().toISOString().split('T')[0];

  const result = await db.query(`
    SELECT title, sport, date, time, venue, zip
    FROM games
    WHERE date >= $1
      AND ($2 = '' OR LOWER(title) LIKE $3 OR LOWER(venue) LIKE $3 OR LOWER(team) LIKE $3)
    ORDER BY date ASC
    LIMIT 20
  `, [today, q, `%${q}%`]);

  res.json({ games: result.rows });
});

// POST /api/games/sync — manually trigger a sync (admin only)
router.post('/sync', requireAuth, async (req, res) => {
  if (req.user.email !== ADMIN_EMAIL) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  syncAllTeams().catch(e => console.error('[sync]', e.message));
  res.json({ ok: true, message: 'Sync started in background' });
});

module.exports = router;

const express = require('express');
const db = require('../db/database');
const { requireAuth } = require('../middleware/auth');
const { getRatingInfo } = require('./ratings');
const { getTier, getTierProgress } = require('../lib/tiers');

const router = express.Router();

// GET /api/my/tickets — my listings + tier progress
router.get('/tickets', requireAuth, async (req, res) => {
  const ticketsRes = await db.query(`
    SELECT
      t.*,
      c.id                AS claim_id,
      c.status            AS claim_status,
      u.first_name        AS seeker_name,
      u.seeker_fan_level  AS seeker_fan_level,
      u.seeker_age_range  AS seeker_age_range
    FROM tickets t
    LEFT JOIN claims c ON c.ticket_id = t.id AND c.status = 'active'
    LEFT JOIN users  u ON u.id = c.seeker_id
    WHERE t.lister_id = $1 AND t.status != 'cancelled'
    ORDER BY t.date ASC
  `, [req.user.id]);

  const countRes = await db.query(
    `SELECT COUNT(*) AS count FROM tickets WHERE lister_id = $1 AND status != 'cancelled'`,
    [req.user.id]
  );
  const listing_count = parseInt(countRes.rows[0].count, 10);
  const tierProgress = getTierProgress(listing_count);

  res.json({ tickets: ticketsRes.rows, listing_count, tierProgress });
});

// GET /api/my/claim — my active claimed ticket (as seeker)
router.get('/claim', requireAuth, async (req, res) => {
  const claimRes = await db.query(`
    SELECT
      c.*,
      t.title, t.sport, t.date, t.time, t.venue, t.zip,
      t.preferred_age_range, t.fan_level, t.notes_to_seeker,
      u.first_name AS lister_name
    FROM claims c
    JOIN tickets t ON t.id = c.ticket_id
    JOIN users   u ON u.id = t.lister_id
    WHERE c.seeker_id = $1 AND c.status = 'active'
      AND t.date >= TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD')
    ORDER BY t.date ASC
    LIMIT 1
  `, [req.user.id]);

  res.json({ claim: claimRes.rows[0] || null });
});

// GET /api/my/pending-ratings — past meets the seeker hasn't rated yet
router.get('/pending-ratings', requireAuth, async (req, res) => {
  const pendingRes = await db.query(`
    SELECT
      c.id        AS claim_id,
      c.status    AS claim_status,
      t.date      AS ticket_date,
      t.title,
      t.lister_id,
      u.first_name AS lister_name
    FROM claims c
    JOIN tickets t ON t.id = c.ticket_id
    JOIN users   u ON u.id = t.lister_id
    WHERE c.seeker_id = $1
      AND (t.date < TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD') OR c.status = 'cancelled')
      AND NOT EXISTS (
        SELECT 1 FROM ratings r
        WHERE r.claim_id = c.id AND r.rater_id = $2
      )
    ORDER BY t.date DESC
    LIMIT 5
  `, [req.user.id, req.user.id]);

  res.json({ pending: pendingRes.rows });
});

module.exports = router;

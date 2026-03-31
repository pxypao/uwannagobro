const express = require('express');
const db = require('../db/database');
const { requireAuth } = require('../middleware/auth');
const { getRatingInfo } = require('./ratings');
const { getTier, getTierProgress } = require('../lib/tiers');

const router = express.Router();

// GET /api/my/tickets — my listings + tier progress
router.get('/tickets', requireAuth, (req, res) => {
  const tickets = db.prepare(`
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
    WHERE t.lister_id = ? AND t.status != 'cancelled'
    ORDER BY t.date ASC
  `).all(req.user.id);

  const { count: listing_count } = db.prepare(`
    SELECT COUNT(*) AS count FROM tickets WHERE lister_id = ? AND status != 'cancelled'
  `).get(req.user.id);

  const tierProgress = getTierProgress(listing_count);

  res.json({ tickets, listing_count, tierProgress });
});

// GET /api/my/claim — my active claimed ticket (as seeker)
router.get('/claim', requireAuth, (req, res) => {
  const claim = db.prepare(`
    SELECT
      c.*,
      t.title, t.sport, t.date, t.time, t.venue, t.zip,
      t.preferred_age_range, t.fan_level, t.notes_to_seeker,
      u.first_name AS lister_name
    FROM claims c
    JOIN tickets t ON t.id = c.ticket_id
    JOIN users   u ON u.id = t.lister_id
    WHERE c.seeker_id = ? AND c.status = 'active' AND t.date >= date('now')
    ORDER BY t.date ASC
    LIMIT 1
  `).get(req.user.id);

  res.json({ claim: claim || null });
});

// GET /api/my/pending-ratings — past meets the seeker hasn't rated yet
router.get('/pending-ratings', requireAuth, (req, res) => {
  const pending = db.prepare(`
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
    WHERE c.seeker_id = ?
      AND (t.date < date('now') OR c.status = 'cancelled')
      AND NOT EXISTS (
        SELECT 1 FROM ratings r
        WHERE r.claim_id = c.id AND r.rater_id = ?
      )
    ORDER BY t.date DESC
    LIMIT 5
  `).all(req.user.id, req.user.id);

  res.json({ pending });
});

module.exports = router;

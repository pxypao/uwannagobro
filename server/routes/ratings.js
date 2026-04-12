const express = require('express');
const db = require('../db/database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Helper: compute Good Host status for a user
async function getRatingInfo(userId) {
  const result = await db.query(`
    SELECT
      COUNT(*)     AS total,
      AVG(r.stars) AS avg_stars
    FROM ratings r
    WHERE r.ratee_id = $1
  `, [userId]);

  const row      = result.rows[0];
  const total    = parseInt(row.total, 10) || 0;
  const avg_stars = row.avg_stars ? Math.round(parseFloat(row.avg_stars) * 10) / 10 : null;
  const good_host = total >= 3 && avg_stars >= 4.0;

  return { total, avg_stars, good_host };
}

// POST /api/ratings/:claim_id  — seeker submits a rating
router.post('/:claim_id', requireAuth, async (req, res) => {
  const { stars } = req.body;
  if (!stars || stars < 1 || stars > 5) {
    return res.status(400).json({ error: 'stars must be between 1 and 5.' });
  }

  // Load the claim + ticket to verify permissions
  const claimRes = await db.query(`
    SELECT c.*, t.lister_id, t.date AS ticket_date
    FROM claims c
    JOIN tickets t ON t.id = c.ticket_id
    WHERE c.id = $1
  `, [req.params.claim_id]);
  const claim = claimRes.rows[0];

  if (!claim) return res.status(404).json({ error: 'Claim not found.' });

  // Only the seeker can rate
  if (claim.seeker_id !== req.user.id) {
    return res.status(403).json({ error: 'Only the seeker can submit a rating.' });
  }

  // Seeker must have actually engaged (responded to the lister)
  if (!claim.seeker_responded) {
    return res.status(400).json({ error: 'You can only rate after you\'ve engaged with the lister.' });
  }

  // Can't rate a claim you abandoned (cancelled before the event)
  const today = new Date().toISOString().split('T')[0];
  const eventPassed = claim.ticket_date < today;
  if (claim.status === 'cancelled' && !eventPassed) {
    return res.status(400).json({ error: 'You can\'t rate a meet that was cancelled before the event.' });
  }

  // Event must have passed
  if (!eventPassed) {
    return res.status(400).json({ error: 'You can only rate after the event date has passed.' });
  }

  // Rating window: 7 days after the event
  const eventDate = new Date(claim.ticket_date + 'T00:00:00');
  const daysSince = (Date.now() - eventDate.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSince > 7) {
    return res.status(400).json({ error: 'The rating window for this event has closed (7 days after the event).' });
  }

  // Must have exchanged at least 1 real message in the chat
  const msgRes = await db.query(
    `SELECT COUNT(*) FROM messages WHERE claim_id = $1 AND sender_id IS NOT NULL`,
    [claim.id]
  );
  const messageCount = parseInt(msgRes.rows[0].count, 10);
  if (messageCount < 1) {
    return res.status(400).json({ error: 'You must have chatted with the lister before leaving a rating.' });
  }

  // Prevent the same seeker from rating the same lister more than once per 30 days
  const recentRes = await db.query(`
    SELECT COUNT(*) FROM ratings
    WHERE rater_id = $1 AND ratee_id = $2
      AND created_at > NOW() - INTERVAL '30 days'
  `, [req.user.id, claim.lister_id]);
  const recentCount = parseInt(recentRes.rows[0].count, 10);
  if (recentCount >= 1) {
    return res.status(400).json({ error: 'You can only rate the same person once every 30 days.' });
  }

  try {
    await db.query(
      `INSERT INTO ratings (claim_id, rater_id, ratee_id, stars) VALUES ($1, $2, $3, $4)`,
      [claim.id, req.user.id, claim.lister_id, parseInt(stars, 10)]
    );
  } catch (e) {
    if (e.code === '23505') {
      return res.status(409).json({ error: 'You have already rated this meet.' });
    }
    throw e;
  }

  const info = await getRatingInfo(claim.lister_id);
  res.status(201).json({ ok: true, ...info });
});

module.exports = { router, getRatingInfo };

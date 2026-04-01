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

  // Event must have passed (or claim cancelled)
  const eventPassed = claim.ticket_date < new Date().toISOString().split('T')[0];
  const wasCancelled = claim.status === 'cancelled';
  if (!eventPassed && !wasCancelled) {
    return res.status(400).json({ error: 'You can only rate after the event date has passed.' });
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

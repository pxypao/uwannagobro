const express = require('express');
const db = require('../db/database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// POST /api/claims/:id/cancel
router.post('/:id/cancel', requireAuth, async (req, res) => {
  const claimRes = await db.query(`
    SELECT c.*, t.lister_id, t.date AS ticket_date
    FROM claims c
    JOIN tickets t ON t.id = c.ticket_id
    WHERE c.id = $1
  `, [req.params.id]);
  const claim = claimRes.rows[0];

  if (!claim) return res.status(404).json({ error: 'Claim not found.' });
  if (claim.status === 'cancelled') return res.status(400).json({ error: 'Meet already cancelled.' });

  // Only the lister or the seeker can cancel
  if (claim.seeker_id !== req.user.id && claim.lister_id !== req.user.id) {
    return res.status(403).json({ error: 'Not authorized.' });
  }

  const systemBody = `${req.user.first_name} cancelled the meet. This ticket is back in the pool.`;

  const client = await db.connect();
  try {
    await client.query('BEGIN');
    await client.query("UPDATE claims SET status = 'cancelled' WHERE id = $1", [claim.id]);
    await client.query("UPDATE tickets SET status = 'open' WHERE id = $1", [claim.ticket_id]);
    await client.query(
      `INSERT INTO messages (claim_id, sender_id, body, is_read) VALUES ($1, NULL, $2, TRUE)`,
      [claim.id, systemBody]
    );
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }

  res.json({ ok: true });
});

// POST /api/claims/:id/confirm-transfer — lister only (Fix 3)
router.post('/:id/confirm-transfer', requireAuth, async (req, res) => {
  const claimRes = await db.query(`
    SELECT c.*, t.lister_id FROM claims c JOIN tickets t ON t.id = c.ticket_id WHERE c.id = $1
  `, [req.params.id]);
  const claim = claimRes.rows[0];

  if (!claim) return res.status(404).json({ error: 'Claim not found.' });
  if (claim.lister_id !== req.user.id) return res.status(403).json({ error: 'Only the lister can confirm transfer.' });
  if (claim.status === 'cancelled') return res.status(400).json({ error: 'This meet has been cancelled.' });

  await db.query('UPDATE claims SET transfer_confirmed = TRUE WHERE id = $1', [claim.id]);
  res.json({ ok: true });
});

// GET /api/claims/:id/transfer-status (Fix 3 & 4)
router.get('/:id/transfer-status', requireAuth, async (req, res) => {
  const claimRes = await db.query(`
    SELECT c.*, t.lister_id FROM claims c JOIN tickets t ON t.id = c.ticket_id WHERE c.id = $1
  `, [req.params.id]);
  const claim = claimRes.rows[0];

  if (!claim) return res.status(404).json({ error: 'Claim not found.' });
  if (claim.seeker_id !== req.user.id && claim.lister_id !== req.user.id) {
    return res.status(403).json({ error: 'Access denied.' });
  }

  const now = Date.now();

  let hoursRemaining = null;
  if (claim.transfer_deadline) {
    const dl = new Date(claim.transfer_deadline);
    hoursRemaining = Math.max(0, (dl - now) / 3600000);
  }

  let responseHoursRemaining = null;
  if (claim.response_deadline) {
    const dl = new Date(claim.response_deadline);
    responseHoursRemaining = Math.max(0, (dl - now) / 3600000);
  }

  res.json({
    claim_status:             claim.status,
    transfer_confirmed:       !!claim.transfer_confirmed,
    transfer_deadline:        claim.transfer_deadline,
    hours_remaining:          hoursRemaining,
    seeker_responded:         !!claim.seeker_responded,
    response_deadline:        claim.response_deadline,
    response_hours_remaining: responseHoursRemaining,
  });
});

module.exports = router;

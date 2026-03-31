const express = require('express');
const db = require('../db/database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// POST /api/claims/:id/cancel
router.post('/:id/cancel', requireAuth, (req, res) => {
  const claim = db.prepare(`
    SELECT c.*, t.lister_id, t.date AS ticket_date
    FROM claims c
    JOIN tickets t ON t.id = c.ticket_id
    WHERE c.id = ?
  `).get(req.params.id);

  if (!claim) return res.status(404).json({ error: 'Claim not found.' });
  if (claim.status === 'cancelled') return res.status(400).json({ error: 'Meet already cancelled.' });

  // Only the lister or the seeker can cancel
  if (claim.seeker_id !== req.user.id && claim.lister_id !== req.user.id) {
    return res.status(403).json({ error: 'Not authorized.' });
  }

  const cancelMeet = db.transaction(() => {
    db.prepare("UPDATE claims SET status = 'cancelled' WHERE id = ?").run(claim.id);
    db.prepare("UPDATE tickets SET status = 'open' WHERE id = ?").run(claim.ticket_id);

    // Insert system message into thread (sender_id NULL = system)
    const systemBody = `${req.user.first_name} cancelled the meet. This ticket is back in the pool.`;
    db.prepare(`
      INSERT INTO messages (claim_id, sender_id, body, is_read)
      VALUES (?, NULL, ?, 1)
    `).run(claim.id, systemBody);
  });

  cancelMeet();
  res.json({ ok: true });
});

// POST /api/claims/:id/confirm-transfer — lister only (Fix 3)
router.post('/:id/confirm-transfer', requireAuth, (req, res) => {
  const claim = db.prepare(`
    SELECT c.*, t.lister_id FROM claims c JOIN tickets t ON t.id = c.ticket_id WHERE c.id = ?
  `).get(req.params.id);

  if (!claim) return res.status(404).json({ error: 'Claim not found.' });
  if (claim.lister_id !== req.user.id) return res.status(403).json({ error: 'Only the lister can confirm transfer.' });
  if (claim.status === 'cancelled') return res.status(400).json({ error: 'This meet has been cancelled.' });

  db.prepare('UPDATE claims SET transfer_confirmed = 1 WHERE id = ?').run(claim.id);
  res.json({ ok: true });
});

// GET /api/claims/:id/transfer-status (Fix 3 & 4)
router.get('/:id/transfer-status', requireAuth, (req, res) => {
  const claim = db.prepare(`
    SELECT c.*, t.lister_id FROM claims c JOIN tickets t ON t.id = c.ticket_id WHERE c.id = ?
  `).get(req.params.id);

  if (!claim) return res.status(404).json({ error: 'Claim not found.' });
  if (claim.seeker_id !== req.user.id && claim.lister_id !== req.user.id) {
    return res.status(403).json({ error: 'Access denied.' });
  }

  const now = Date.now();

  let hoursRemaining = null;
  if (claim.transfer_deadline) {
    const dl = new Date(claim.transfer_deadline.replace(' ', 'T'));
    hoursRemaining = Math.max(0, (dl - now) / 3600000);
  }

  let responseHoursRemaining = null;
  if (claim.response_deadline) {
    const dl = new Date(claim.response_deadline.replace(' ', 'T'));
    responseHoursRemaining = Math.max(0, (dl - now) / 3600000);
  }

  res.json({
    claim_status:              claim.status,
    transfer_confirmed:        !!claim.transfer_confirmed,
    transfer_deadline:         claim.transfer_deadline,
    hours_remaining:           hoursRemaining,
    seeker_responded:          !!claim.seeker_responded,
    response_deadline:         claim.response_deadline,
    response_hours_remaining:  responseHoursRemaining,
  });
});

module.exports = router;

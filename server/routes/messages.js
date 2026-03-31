const express = require('express');
const db = require('../db/database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function assertClaimAccess(claimId, userId) {
  const claim = db.prepare(`
    SELECT c.*, t.lister_id
    FROM claims c
    JOIN tickets t ON t.id = c.ticket_id
    WHERE c.id = ?
  `).get(claimId);

  if (!claim) return null;
  if (claim.seeker_id !== userId && claim.lister_id !== userId) return null;
  return claim;
}

// GET /api/messages/:claim_id
router.get('/:claim_id', requireAuth, (req, res) => {
  const claim = assertClaimAccess(req.params.claim_id, req.user.id);
  if (!claim) return res.status(403).json({ error: 'Access denied.' });

  const messages = db.prepare(`
    SELECT m.*, u.first_name AS sender_name
    FROM messages m
    LEFT JOIN users u ON u.id = m.sender_id
    WHERE m.claim_id = ?
    ORDER BY m.created_at ASC
  `).all(req.params.claim_id);

  // Mark incoming messages as read
  db.prepare(`
    UPDATE messages SET is_read = 1
    WHERE claim_id = ? AND sender_id != ? AND is_read = 0
  `).run(req.params.claim_id, req.user.id);

  res.json({ messages });
});

// POST /api/messages/:claim_id
router.post('/:claim_id', requireAuth, (req, res) => {
  const { body } = req.body;
  if (!body || !body.trim()) return res.status(400).json({ error: 'Message body is required.' });

  const claim = assertClaimAccess(req.params.claim_id, req.user.id);
  if (!claim) return res.status(403).json({ error: 'Access denied.' });
  if (claim.status === 'cancelled') return res.status(400).json({ error: 'This meet has been cancelled.' });

  const result = db.prepare(`
    INSERT INTO messages (claim_id, sender_id, body, is_read)
    VALUES (?, ?, ?, 0)
  `).run(req.params.claim_id, req.user.id, body.trim());

  // Fix 4: mark seeker as responded on their first message
  if (claim.seeker_id === req.user.id && !claim.seeker_responded) {
    db.prepare('UPDATE claims SET seeker_responded = 1 WHERE id = ?').run(claim.id);
  }

  const message = db.prepare('SELECT * FROM messages WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ message });
});

// GET /api/messages/unread-count — how many unread messages across all claims
router.get('/unread/count', requireAuth, (req, res) => {
  const row = db.prepare(`
    SELECT COUNT(*) AS cnt
    FROM messages m
    JOIN claims c ON c.id = m.claim_id
    JOIN tickets t ON t.id = c.ticket_id
    WHERE m.is_read = 0
      AND m.sender_id != ?
      AND (c.seeker_id = ? OR t.lister_id = ?)
  `).get(req.user.id, req.user.id, req.user.id);

  res.json({ count: row.cnt });
});

module.exports = router;

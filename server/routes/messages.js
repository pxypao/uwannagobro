const express = require('express');
const db = require('../db/database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

async function assertClaimAccess(claimId, userId) {
  const claimRes = await db.query(`
    SELECT c.*, t.lister_id
    FROM claims c
    JOIN tickets t ON t.id = c.ticket_id
    WHERE c.id = $1
  `, [claimId]);

  const claim = claimRes.rows[0];
  if (!claim) return null;
  if (claim.seeker_id !== userId && claim.lister_id !== userId) return null;
  return claim;
}

// GET /api/messages/:claim_id
router.get('/:claim_id', requireAuth, async (req, res) => {
  const claim = await assertClaimAccess(req.params.claim_id, req.user.id);
  if (!claim) return res.status(403).json({ error: 'Access denied.' });

  const messagesRes = await db.query(`
    SELECT m.*, u.first_name AS sender_name
    FROM messages m
    LEFT JOIN users u ON u.id = m.sender_id
    WHERE m.claim_id = $1
    ORDER BY m.created_at ASC
  `, [req.params.claim_id]);

  // Mark incoming messages as read
  await db.query(`
    UPDATE messages SET is_read = TRUE
    WHERE claim_id = $1 AND sender_id != $2 AND is_read = FALSE
  `, [req.params.claim_id, req.user.id]);

  res.json({ messages: messagesRes.rows });
});

// POST /api/messages/:claim_id
router.post('/:claim_id', requireAuth, async (req, res) => {
  const { body } = req.body;
  if (!body || !body.trim()) return res.status(400).json({ error: 'Message body is required.' });

  const claim = await assertClaimAccess(req.params.claim_id, req.user.id);
  if (!claim) return res.status(403).json({ error: 'Access denied.' });
  if (claim.status === 'cancelled') return res.status(400).json({ error: 'This meet has been cancelled.' });

  const result = await db.query(`
    INSERT INTO messages (claim_id, sender_id, body, is_read)
    VALUES ($1, $2, $3, FALSE) RETURNING id
  `, [req.params.claim_id, req.user.id, body.trim()]);

  // Fix 4: mark seeker as responded on their first message
  if (claim.seeker_id === req.user.id && !claim.seeker_responded) {
    await db.query('UPDATE claims SET seeker_responded = TRUE WHERE id = $1', [claim.id]);
  }

  const messageRes = await db.query('SELECT * FROM messages WHERE id = $1', [result.rows[0].id]);
  res.status(201).json({ message: messageRes.rows[0] });
});

// GET /api/messages/unread/count — how many unread messages across all claims
router.get('/unread/count', requireAuth, async (req, res) => {
  const result = await db.query(`
    SELECT COUNT(*) AS cnt
    FROM messages m
    JOIN claims c ON c.id = m.claim_id
    JOIN tickets t ON t.id = c.ticket_id
    WHERE m.is_read = FALSE
      AND m.sender_id != $1
      AND (c.seeker_id = $2 OR t.lister_id = $3)
  `, [req.user.id, req.user.id, req.user.id]);

  res.json({ count: parseInt(result.rows[0].cnt, 10) });
});

// GET /api/messages/unread/detail — unread count + ticket title of latest unread conversation
router.get('/unread/detail', requireAuth, async (req, res) => {
  const result = await db.query(`
    SELECT COUNT(*) AS cnt, t.title AS ticket_title
    FROM messages m
    JOIN claims c ON c.id = m.claim_id
    JOIN tickets t ON t.id = c.ticket_id
    WHERE m.is_read = FALSE
      AND m.sender_id != $1
      AND (c.seeker_id = $2 OR t.lister_id = $3)
    GROUP BY t.title
    ORDER BY MAX(m.created_at) DESC
    LIMIT 1
  `, [req.user.id, req.user.id, req.user.id]);

  if (result.rows.length === 0) return res.json({ count: 0, ticket_title: null });

  // total count across all conversations
  const total = await db.query(`
    SELECT COUNT(*) AS cnt
    FROM messages m
    JOIN claims c ON c.id = m.claim_id
    JOIN tickets t ON t.id = c.ticket_id
    WHERE m.is_read = FALSE
      AND m.sender_id != $1
      AND (c.seeker_id = $2 OR t.lister_id = $3)
  `, [req.user.id, req.user.id, req.user.id]);

  res.json({
    count: parseInt(total.rows[0].cnt, 10),
    ticket_title: result.rows[0].ticket_title,
  });
});

module.exports = router;

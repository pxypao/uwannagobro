const express = require('express');
const db = require('../db/database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'jadenmarting@gmail.com';

function requireAdmin(req, res, next) {
  if (req.user.email !== ADMIN_EMAIL) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
}

// GET /api/admin/stats
router.get('/stats', requireAuth, requireAdmin, async (req, res) => {
  const [
    usersTotal,
    usersWeek,
    usersMonth,
    ticketsTotal,
    ticketsOpen,
    ticketsClaimed,
    ticketsCancelled,
    claimsActive,
    claimsCancelled,
    messagesTotal,
    recentListings,
    recentClaims,
    topSports,
  ] = await Promise.all([
    db.query(`SELECT COUNT(*) FROM users`),
    db.query(`SELECT COUNT(*) FROM users WHERE created_at > NOW() - INTERVAL '7 days'`),
    db.query(`SELECT COUNT(*) FROM users WHERE created_at > NOW() - INTERVAL '30 days'`),
    db.query(`SELECT COUNT(*) FROM tickets`),
    db.query(`SELECT COUNT(*) FROM tickets WHERE status = 'open'`),
    db.query(`SELECT COUNT(*) FROM tickets WHERE status = 'claimed'`),
    db.query(`SELECT COUNT(*) FROM tickets WHERE status = 'cancelled'`),
    db.query(`SELECT COUNT(*) FROM claims WHERE status = 'active'`),
    db.query(`SELECT COUNT(*) FROM claims WHERE status = 'cancelled'`),
    db.query(`SELECT COUNT(*) FROM messages WHERE sender_id IS NOT NULL`),
    db.query(`
      SELECT t.id, t.title, t.sport, t.date, t.status, u.first_name AS lister
      FROM tickets t
      JOIN users u ON u.id = t.lister_id
      ORDER BY t.created_at DESC
      LIMIT 8
    `),
    db.query(`
      SELECT c.id, c.status, c.created_at, t.title, t.sport,
             ul.first_name AS lister, us.first_name AS seeker
      FROM claims c
      JOIN tickets t ON t.id = c.ticket_id
      JOIN users ul ON ul.id = t.lister_id
      JOIN users us ON us.id = c.seeker_id
      ORDER BY c.created_at DESC
      LIMIT 8
    `),
    db.query(`
      SELECT sport, COUNT(*) AS count
      FROM tickets
      GROUP BY sport
      ORDER BY count DESC
      LIMIT 5
    `),
  ]);

  res.json({
    users: {
      total:   parseInt(usersTotal.rows[0].count),
      thisWeek:  parseInt(usersWeek.rows[0].count),
      thisMonth: parseInt(usersMonth.rows[0].count),
    },
    tickets: {
      total:     parseInt(ticketsTotal.rows[0].count),
      open:      parseInt(ticketsOpen.rows[0].count),
      claimed:   parseInt(ticketsClaimed.rows[0].count),
      cancelled: parseInt(ticketsCancelled.rows[0].count),
    },
    claims: {
      active:    parseInt(claimsActive.rows[0].count),
      cancelled: parseInt(claimsCancelled.rows[0].count),
    },
    messages: {
      total: parseInt(messagesTotal.rows[0].count),
    },
    recentListings: recentListings.rows,
    recentClaims:   recentClaims.rows,
    topSports:      topSports.rows,
  });
});

module.exports = router;

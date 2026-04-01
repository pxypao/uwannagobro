const express = require('express');
const db = require('../db/database');
const { requireAuth } = require('../middleware/auth');
const { getRatingInfo } = require('./ratings');
const { getTier } = require('../lib/tiers');

const router = express.Router();

// GET /api/tickets?zip=&sport=
router.get('/', async (req, res) => {
  const { zip, sport } = req.query;
  let query = `
    SELECT t.*, u.first_name AS lister_name,
           u.is_verified_sth AS lister_is_verified_sth,
           u.sth_team        AS lister_sth_team
    FROM tickets t
    JOIN users u ON u.id = t.lister_id
    WHERE t.status = 'open'
  `;
  const params = [];
  let paramCount = 0;

  if (zip && zip.trim()) {
    paramCount++;
    query += ` AND t.zip = $${paramCount}`;
    params.push(zip.trim());
  }
  if (sport && sport.trim() && sport.trim().toLowerCase() !== 'all') {
    paramCount++;
    query += ` AND LOWER(t.sport) = LOWER($${paramCount})`;
    params.push(sport.trim());
  }

  query += ' ORDER BY t.date ASC, t.created_at DESC';

  const { rows } = await db.query(query, params);
  const tickets = await Promise.all(rows.map(async t => {
    const { good_host, avg_stars } = await getRatingInfo(t.lister_id);
    const countRes = await db.query(
      `SELECT COUNT(*) AS count FROM tickets WHERE lister_id = $1 AND status != 'cancelled'`,
      [t.lister_id]
    );
    const lister_listing_count = parseInt(countRes.rows[0].count, 10);
    const lister_tier = getTier(lister_listing_count);
    return { ...t, lister_good_host: good_host, lister_avg_stars: avg_stars, lister_tier, lister_listing_count };
  }));
  res.json({ tickets });
});

// POST /api/tickets — create listing (auth required)
router.post('/', requireAuth, async (req, res) => {
  const { title, sport, date, time, venue, zip,
          preferred_age_range, fan_level, notes_to_seeker } = req.body;

  if (!title || !sport || !date || !time || !venue || !zip) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  const ALLOWED_SPORTS = ['Baseball', 'Soccer', 'Basketball', 'Football', 'Hockey'];
  if (!ALLOWED_SPORTS.includes(sport)) {
    return res.status(400).json({ error: 'Invalid sport.' });
  }

  const ALLOWED_AGES   = ['Any', '18-25', '26-35', '36-50', '50+'];
  const ALLOWED_LEVELS = ['Casual', 'Die-Hard', 'Either'];
  const age_range = ALLOWED_AGES.includes(preferred_age_range)  ? preferred_age_range : 'Any';
  const fan_lvl   = ALLOWED_LEVELS.includes(fan_level)          ? fan_level           : 'Either';
  const note      = notes_to_seeker ? String(notes_to_seeker).trim().slice(0, 200) : '';

  const result = await db.query(
    `INSERT INTO tickets (lister_id, title, sport, date, time, venue, zip, status,
                          preferred_age_range, fan_level, notes_to_seeker)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'open', $8, $9, $10) RETURNING id`,
    [req.user.id, title.trim(), sport, date, time, venue.trim(), zip.trim(), age_range, fan_lvl, note]
  );

  const ticketRes = await db.query('SELECT * FROM tickets WHERE id = $1', [result.rows[0].id]);
  res.status(201).json({ ticket: ticketRes.rows[0] });
});

// DELETE /api/tickets/:id — cancel own listing (auth required)
router.delete('/:id', requireAuth, async (req, res) => {
  const ticketRes = await db.query('SELECT * FROM tickets WHERE id = $1', [req.params.id]);
  const ticket = ticketRes.rows[0];
  if (!ticket) return res.status(404).json({ error: 'Ticket not found.' });
  if (ticket.lister_id !== req.user.id) return res.status(403).json({ error: 'Not your ticket.' });
  if (ticket.status === 'cancelled') return res.status(400).json({ error: 'Ticket already cancelled.' });

  await db.query("UPDATE tickets SET status = 'cancelled' WHERE id = $1", [ticket.id]);
  res.json({ ok: true });
});

// POST /api/tickets/:id/claim — claim a ticket (auth required)
router.post('/:id/claim', requireAuth, async (req, res) => {
  const ticketRes = await db.query('SELECT * FROM tickets WHERE id = $1', [req.params.id]);
  const ticket = ticketRes.rows[0];
  if (!ticket) return res.status(404).json({ error: 'Ticket not found.' });
  if (ticket.status !== 'open') return res.status(409).json({ error: 'This ticket is no longer available.' });
  if (ticket.lister_id === req.user.id) return res.status(403).json({ error: 'You cannot claim your own ticket listing.' });

  // Cross-account same-person check (Fix 2)
  const [listerRes, seekerRes] = await Promise.all([
    db.query('SELECT email, phone FROM users WHERE id = $1', [ticket.lister_id]),
    db.query('SELECT email, phone FROM users WHERE id = $1', [req.user.id]),
  ]);
  const lister = listerRes.rows[0];
  const seeker = seekerRes.rows[0];
  if (lister.email === seeker.email || lister.phone === seeker.phone) {
    return res.status(403).json({ error: 'You cannot claim a ticket listed by yourself, even from a different account.' });
  }

  // Check if seeker already has an active claim whose event hasn't passed yet
  const activeClaimRes = await db.query(`
    SELECT c.id, t.date
    FROM claims c
    JOIN tickets t ON t.id = c.ticket_id
    WHERE c.seeker_id = $1 AND c.status = 'active'
      AND t.date >= TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD')
  `, [req.user.id]);

  if (activeClaimRes.rows.length > 0) {
    return res.status(409).json({ error: 'You already have an active claimed ticket. You can claim another after your event date passes.' });
  }

  // Transaction to prevent race conditions
  const client = await db.connect();
  let claimId;
  try {
    await client.query('BEGIN');

    // Re-check status inside transaction
    const freshRes = await client.query('SELECT status FROM tickets WHERE id = $1', [ticket.id]);
    if (freshRes.rows[0].status !== 'open') throw new Error('GONE');

    await client.query("UPDATE tickets SET status = 'claimed' WHERE id = $1", [ticket.id]);

    // Fix 3: transfer deadline = event datetime - 24 hours
    const eventDt = new Date(`${ticket.date}T${ticket.time}`);
    eventDt.setHours(eventDt.getHours() - 24);
    const transferDeadline = eventDt.toISOString();

    // Fix 4: response deadline = now + 2 hours
    const responseDeadline = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

    const claimRes = await client.query(
      `INSERT INTO claims (ticket_id, seeker_id, status, transfer_deadline, response_deadline)
       VALUES ($1, $2, 'active', $3, $4) RETURNING id`,
      [ticket.id, req.user.id, transferDeadline, responseDeadline]
    );
    claimId = claimRes.rows[0].id;

    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    if (e.message === 'GONE') return res.status(409).json({ error: 'Someone else just claimed this ticket.' });
    throw e;
  } finally {
    client.release();
  }

  const claimRes = await db.query('SELECT * FROM claims WHERE id = $1', [claimId]);
  res.status(201).json({ claim: claimRes.rows[0] });
});

module.exports = router;

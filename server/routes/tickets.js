const express = require('express');
const db = require('../db/database');
const { requireAuth } = require('../middleware/auth');
const { getRatingInfo } = require('./ratings');
const { getTier } = require('../lib/tiers');

const router = express.Router();

// GET /api/tickets?zip=&sport=
router.get('/', (req, res) => {
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

  if (zip && zip.trim()) {
    query += ' AND t.zip = ?';
    params.push(zip.trim());
  }
  if (sport && sport.trim() && sport.trim().toLowerCase() !== 'all') {
    query += ' AND LOWER(t.sport) = LOWER(?)';
    params.push(sport.trim());
  }

  query += ' ORDER BY t.date ASC, t.created_at DESC';

  const rows = db.prepare(query).all(...params);
  const tickets = rows.map(t => {
    const { good_host, avg_stars } = getRatingInfo(t.lister_id);
    const { count: lister_listing_count } = db.prepare(`
      SELECT COUNT(*) AS count FROM tickets WHERE lister_id = ? AND status != 'cancelled'
    `).get(t.lister_id);
    const lister_tier = getTier(lister_listing_count);
    return { ...t, lister_good_host: good_host, lister_avg_stars: avg_stars, lister_tier, lister_listing_count };
  });
  res.json({ tickets });
});

// POST /api/tickets — create listing (auth required)
router.post('/', requireAuth, (req, res) => {
  const { title, sport, date, time, venue, zip,
          preferred_age_range, fan_level, notes_to_seeker } = req.body;

  if (!title || !sport || !date || !time || !venue || !zip) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  const ALLOWED_SPORTS = ['Baseball', 'Soccer', 'Basketball', 'Football', 'Hockey'];
  if (!ALLOWED_SPORTS.includes(sport)) {
    return res.status(400).json({ error: 'Invalid sport.' });
  }

  const ALLOWED_AGES    = ['Any', '18-25', '26-35', '36-50', '50+'];
  const ALLOWED_LEVELS  = ['Casual', 'Die-Hard', 'Either'];
  const age_range = ALLOWED_AGES.includes(preferred_age_range)   ? preferred_age_range  : 'Any';
  const fan_lvl   = ALLOWED_LEVELS.includes(fan_level)           ? fan_level            : 'Either';
  const note      = notes_to_seeker ? String(notes_to_seeker).trim().slice(0, 200) : '';

  const result = db.prepare(`
    INSERT INTO tickets (lister_id, title, sport, date, time, venue, zip, status,
                         preferred_age_range, fan_level, notes_to_seeker)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'open', ?, ?, ?)
  `).run(req.user.id, title.trim(), sport, date, time, venue.trim(), zip.trim(),
         age_range, fan_lvl, note);

  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ ticket });
});

// DELETE /api/tickets/:id — cancel own listing (auth required)
router.delete('/:id', requireAuth, (req, res) => {
  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found.' });
  if (ticket.lister_id !== req.user.id) return res.status(403).json({ error: 'Not your ticket.' });
  if (ticket.status === 'cancelled') return res.status(400).json({ error: 'Ticket already cancelled.' });

  db.prepare("UPDATE tickets SET status = 'cancelled' WHERE id = ?").run(ticket.id);
  res.json({ ok: true });
});

// POST /api/tickets/:id/claim — claim a ticket (auth required)
router.post('/:id/claim', requireAuth, (req, res) => {
  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found.' });
  if (ticket.status !== 'open') return res.status(409).json({ error: 'This ticket is no longer available.' });
  if (ticket.lister_id === req.user.id) return res.status(403).json({ error: 'You cannot claim your own ticket listing.' });

  // Cross-account same-person check (Fix 2)
  const lister = db.prepare('SELECT email, phone FROM users WHERE id = ?').get(ticket.lister_id);
  const seeker = db.prepare('SELECT email, phone FROM users WHERE id = ?').get(req.user.id);
  if (lister.email === seeker.email || lister.phone === seeker.phone) {
    return res.status(403).json({ error: 'You cannot claim a ticket listed by yourself, even from a different account.' });
  }

  // Check if seeker already has an active claim whose event hasn't passed yet
  const activeClaim = db.prepare(`
    SELECT c.id, t.date
    FROM claims c
    JOIN tickets t ON t.id = c.ticket_id
    WHERE c.seeker_id = ? AND c.status = 'active' AND t.date >= date('now')
  `).get(req.user.id);

  if (activeClaim) {
    return res.status(409).json({ error: 'You already have an active claimed ticket. You can claim another after your event date passes.' });
  }

  // Use a transaction to prevent race conditions
  const claimTicket = db.transaction(() => {
    // Re-check status inside transaction
    const fresh = db.prepare("SELECT status FROM tickets WHERE id = ?").get(ticket.id);
    if (fresh.status !== 'open') throw new Error('GONE');

    db.prepare("UPDATE tickets SET status = 'claimed' WHERE id = ?").run(ticket.id);

    // Fix 3: transfer deadline = event datetime - 24 hours
    const eventDt = new Date(`${ticket.date}T${ticket.time}`);
    eventDt.setHours(eventDt.getHours() - 24);
    const transferDeadline = eventDt.toISOString().slice(0, 19).replace('T', ' ');

    // Fix 4: response deadline = now + 2 hours
    const responseDt = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const responseDeadline = responseDt.toISOString().slice(0, 19).replace('T', ' ');

    const result = db.prepare(`
      INSERT INTO claims (ticket_id, seeker_id, status, transfer_deadline, response_deadline)
      VALUES (?, ?, 'active', ?, ?)
    `).run(ticket.id, req.user.id, transferDeadline, responseDeadline);
    return result.lastInsertRowid;
  });

  let claimId;
  try {
    claimId = claimTicket();
  } catch (e) {
    if (e.message === 'GONE') return res.status(409).json({ error: 'Someone else just claimed this ticket.' });
    throw e;
  }

  const claim = db.prepare('SELECT * FROM claims WHERE id = ?').get(claimId);
  res.status(201).json({ claim });
});

module.exports = router;

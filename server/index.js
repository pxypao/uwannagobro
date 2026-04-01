require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const db = require('./db/database');

// Auto-seed on every startup (idempotent — skips existing records)
try {
  require('./db/seed');
  console.log('[startup] Seed completed');
} catch (err) {
  console.error('[startup] Seed failed:', err.message);
}

const authRoutes     = require('./routes/auth');
const ticketRoutes   = require('./routes/tickets');
const claimRoutes    = require('./routes/claims');
const myRoutes       = require('./routes/my');
const messageRoutes  = require('./routes/messages');
const { router: ratingRoutes } = require('./routes/ratings');
const usersRoutes    = require('./routes/users');
const profileRoutes  = require('./routes/profile');
const sthRoutes      = require('./routes/sth');

const app = express();

app.use(cors({
  origin: [
    'https://rallybro.com',
    'https://www.rallybro.com',
    'https://rallybro.vercel.app',
    'http://localhost:5173',
    'http://localhost:4173',
    ...(process.env.CLIENT_URL ? [process.env.CLIENT_URL] : []),
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(require('path').join(__dirname, 'uploads')));

app.use('/api/auth',     authRoutes);
app.use('/api/tickets',  ticketRoutes);
app.use('/api/claims',   claimRoutes);
app.use('/api/my',       myRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/ratings',  ratingRoutes);
app.use('/api/users',    usersRoutes);
app.use('/api/profile',  profileRoutes);
app.use('/api/sth',      sthRoutes);
app.use('/api/admin',    sthRoutes); // POST /api/admin/verify-sth/:user_id

// Health check
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Generic error handler — include message in dev AND production for now
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error', detail: err.message });
});

// ─── Background job: auto-cancel expired claims (Fix 3 & 4) ───
function runAutoCancel() {
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

  // Fix 3: transfer deadline expired but event hasn't happened yet
  const transferExpired = db.prepare(`
    SELECT c.id, c.ticket_id, t.title
    FROM claims c
    JOIN tickets t ON t.id = c.ticket_id
    WHERE c.status = 'active'
      AND c.transfer_confirmed = 0
      AND c.transfer_deadline IS NOT NULL
      AND c.transfer_deadline < ?
      AND t.date >= date('now')
  `).all(now);

  for (const claim of transferExpired) {
    db.transaction(() => {
      db.prepare("UPDATE claims  SET status = 'cancelled' WHERE id = ?").run(claim.id);
      db.prepare("UPDATE tickets SET status = 'open'      WHERE id = ?").run(claim.ticket_id);
      db.prepare("INSERT INTO messages (claim_id, sender_id, body, is_read) VALUES (?, NULL, ?, 1)")
        .run(claim.id, 'This meet was automatically cancelled because the ticket was not confirmed transferred before the deadline. The ticket is now available again.');
    })();
    console.log(`[auto-cancel] Transfer deadline expired — claim ${claim.id} (${claim.title})`);
  }

  // Fix 4: seeker never responded within 2 hours
  const seekerExpired = db.prepare(`
    SELECT c.id, c.ticket_id, t.title
    FROM claims c
    JOIN tickets t ON t.id = c.ticket_id
    WHERE c.status = 'active'
      AND c.seeker_responded = 0
      AND c.response_deadline IS NOT NULL
      AND c.response_deadline < ?
  `).all(now);

  for (const claim of seekerExpired) {
    db.transaction(() => {
      db.prepare("UPDATE claims  SET status = 'cancelled' WHERE id = ?").run(claim.id);
      db.prepare("UPDATE tickets SET status = 'open'      WHERE id = ?").run(claim.ticket_id);
      db.prepare("INSERT INTO messages (claim_id, sender_id, body, is_read) VALUES (?, NULL, ?, 1)")
        .run(claim.id, 'This meet was automatically cancelled because the seeker did not respond within 2 hours. The ticket has been re-listed.');
    })();
    console.log(`[auto-cancel] Seeker no-show — claim ${claim.id} (${claim.title})`);
  }
}

// 1-minute initial delay, then every 60 minutes
setTimeout(() => {
  runAutoCancel();
  setInterval(runAutoCancel, 60 * 60 * 1000);
}, 60 * 1000);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`RallyBro API running on port ${PORT}`));

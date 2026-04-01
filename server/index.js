require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const https = require('https');
const helmet = require('helmet');
const db = require('./db/database');

const corsOptions = {
  origin: [
    'https://rallybro.com',
    'https://www.rallybro.com',
    'https://rallybro.vercel.app',
    'https://uwannagobro.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

const app = express();

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.googleapis.com", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://rallybro-api.onrender.com", "https://rallybro.com"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginOpenerPolicy: { policy: "same-origin" },
  crossOriginResourcePolicy: { policy: "cross-origin" },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  xFrameOptions: { action: "deny" },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));

// BUG 1: explicit preflight handler — must be before any other routes
app.options('*', cors(corsOptions));
app.use(cors(corsOptions));

app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(require('path').join(__dirname, 'uploads')));

const authRoutes     = require('./routes/auth');
const ticketRoutes   = require('./routes/tickets');
const claimRoutes    = require('./routes/claims');
const myRoutes       = require('./routes/my');
const messageRoutes  = require('./routes/messages');
const { router: ratingRoutes } = require('./routes/ratings');
const usersRoutes    = require('./routes/users');
const profileRoutes  = require('./routes/profile');
const sthRoutes      = require('./routes/sth');

app.use('/api/auth',     authRoutes);
app.use('/api/tickets',  ticketRoutes);
app.use('/api/claims',   claimRoutes);
app.use('/api/my',       myRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/ratings',  ratingRoutes);
app.use('/api/users',    usersRoutes);
app.use('/api/profile',  profileRoutes);
app.use('/api/sth',      sthRoutes);
app.use('/api/admin',    sthRoutes);

// Health checks — root and /api prefix both work
app.get('/',            (_req, res) => res.json({ ok: true }));
app.get('/health',      (_req, res) => res.json({ ok: true }));
app.get('/api/health',  (_req, res) => res.json({ ok: true }));

// Generic error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error', detail: err.message });
});

// ─── Background job: auto-cancel expired claims ───────────────────────────────
async function runAutoCancel() {
  try {
    // Fix 3: transfer deadline expired but event hasn't happened yet
    const { rows: transferExpired } = await db.query(`
      SELECT c.id, c.ticket_id, t.title
      FROM claims c
      JOIN tickets t ON t.id = c.ticket_id
      WHERE c.status = 'active'
        AND c.transfer_confirmed = FALSE
        AND c.transfer_deadline IS NOT NULL
        AND c.transfer_deadline < NOW()
        AND t.date >= TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD')
    `);

    for (const claim of transferExpired) {
      const client = await db.connect();
      try {
        await client.query('BEGIN');
        await client.query("UPDATE claims  SET status = 'cancelled' WHERE id = $1", [claim.id]);
        await client.query("UPDATE tickets SET status = 'open'      WHERE id = $1", [claim.ticket_id]);
        await client.query(
          `INSERT INTO messages (claim_id, sender_id, body, is_read) VALUES ($1, NULL, $2, TRUE)`,
          [claim.id, 'This meet was automatically cancelled because the ticket was not confirmed transferred before the deadline. The ticket is now available again.']
        );
        await client.query('COMMIT');
      } catch (e) {
        await client.query('ROLLBACK');
        console.error('[auto-cancel] Transaction failed:', e.message);
      } finally {
        client.release();
      }
      console.log(`[auto-cancel] Transfer deadline expired — claim ${claim.id} (${claim.title})`);
    }

    // Fix 4: seeker never responded within 2 hours
    const { rows: seekerExpired } = await db.query(`
      SELECT c.id, c.ticket_id, t.title
      FROM claims c
      JOIN tickets t ON t.id = c.ticket_id
      WHERE c.status = 'active'
        AND c.seeker_responded = FALSE
        AND c.response_deadline IS NOT NULL
        AND c.response_deadline < NOW()
    `);

    for (const claim of seekerExpired) {
      const client = await db.connect();
      try {
        await client.query('BEGIN');
        await client.query("UPDATE claims  SET status = 'cancelled' WHERE id = $1", [claim.id]);
        await client.query("UPDATE tickets SET status = 'open'      WHERE id = $1", [claim.ticket_id]);
        await client.query(
          `INSERT INTO messages (claim_id, sender_id, body, is_read) VALUES ($1, NULL, $2, TRUE)`,
          [claim.id, 'This meet was automatically cancelled because the seeker did not respond within 2 hours. The ticket has been re-listed.']
        );
        await client.query('COMMIT');
      } catch (e) {
        await client.query('ROLLBACK');
        console.error('[auto-cancel] Transaction failed:', e.message);
      } finally {
        client.release();
      }
      console.log(`[auto-cancel] Seeker no-show — claim ${claim.id} (${claim.title})`);
    }
  } catch (e) {
    console.error('[auto-cancel] Error:', e.message);
  }
}

// BUG 2: keep-alive ping every 14 minutes to prevent Render free tier sleeping
function keepAlive() {
  https.get('https://rallybro-api.onrender.com/api/tickets', (res) => {
    console.log('[keep-alive] ping', res.statusCode);
    res.resume();
  }).on('error', (err) => {
    console.error('[keep-alive] error:', err.message);
  });
}

async function start() {
  const PORT = process.env.PORT || 3001;

  // Listen first — server is always reachable even if DB init is slow or fails
  app.listen(PORT, () => console.log(`RallyBro API running on port ${PORT}`));

  try {
    await db.initDb();
    console.log('[startup] DB initialized');

    const seed = require('./db/seed');
    await seed();
    console.log('[startup] Seed completed');
  } catch (err) {
    console.error('[startup] DB init failed (routes still active):', err.message);
    // Don't exit — keep the server running so health checks pass
    return;
  }

  // 1-minute initial delay, then every 60 minutes
  setTimeout(() => {
    runAutoCancel();
    setInterval(runAutoCancel, 60 * 60 * 1000);
  }, 60 * 1000);

  // Keep-alive starts after 1 minute, then every 14 minutes
  setTimeout(() => {
    keepAlive();
    setInterval(keepAlive, 14 * 60 * 1000);
  }, 60 * 1000);
}

start();

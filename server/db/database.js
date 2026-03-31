const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DB_PATH
  || (process.env.NODE_ENV === 'production' ? '/tmp/uwannagobro.db' : path.join(__dirname, '../../data.db'));

console.log(`[db] Opening database at: ${DB_PATH}`);
const db = new Database(DB_PATH);
console.log('[db] Database opened successfully');

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name  TEXT    NOT NULL,
    email       TEXT    NOT NULL UNIQUE,
    phone       TEXT    NOT NULL,
    password_hash TEXT  NOT NULL,
    date_of_birth TEXT  NOT NULL,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS tickets (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    lister_id  INTEGER NOT NULL REFERENCES users(id),
    title      TEXT    NOT NULL,
    sport      TEXT    NOT NULL,
    date       TEXT    NOT NULL,
    time       TEXT    NOT NULL,
    venue      TEXT    NOT NULL,
    zip        TEXT    NOT NULL,
    status     TEXT    NOT NULL DEFAULT 'open'
                       CHECK(status IN ('open','claimed','cancelled')),
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS claims (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id  INTEGER NOT NULL REFERENCES tickets(id),
    seeker_id  INTEGER NOT NULL REFERENCES users(id),
    status     TEXT    NOT NULL DEFAULT 'active'
                       CHECK(status IN ('active','cancelled')),
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS messages (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    claim_id   INTEGER NOT NULL REFERENCES claims(id),
    sender_id  INTEGER REFERENCES users(id),
    body       TEXT    NOT NULL,
    is_read    INTEGER NOT NULL DEFAULT 0,
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS ratings (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    claim_id   INTEGER NOT NULL REFERENCES claims(id),
    rater_id   INTEGER NOT NULL REFERENCES users(id),
    ratee_id   INTEGER NOT NULL REFERENCES users(id),
    stars      INTEGER NOT NULL CHECK(stars BETWEEN 1 AND 5),
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
  );
`);

// Unique index — one rating per claim per rater (safe to run repeatedly)
db.exec(`
  CREATE UNIQUE INDEX IF NOT EXISTS ratings_one_per_claim
    ON ratings(claim_id, rater_id);
`);

// Unique phone constraint (email already unique in schema)
db.exec(`
  CREATE UNIQUE INDEX IF NOT EXISTS users_unique_phone ON users(phone);
`);

// Safe column migrations — ALTER TABLE is a no-op if the column already exists
const migrations = [
  // claims — Fix 3 & 4
  'ALTER TABLE claims ADD COLUMN transfer_confirmed INTEGER NOT NULL DEFAULT 0',
  'ALTER TABLE claims ADD COLUMN transfer_deadline   TEXT',
  'ALTER TABLE claims ADD COLUMN seeker_responded    INTEGER NOT NULL DEFAULT 0',
  'ALTER TABLE claims ADD COLUMN response_deadline   TEXT',

  // users — profile fields
  'ALTER TABLE users ADD COLUMN favorite_team          TEXT    NOT NULL DEFAULT ""',
  'ALTER TABLE users ADD COLUMN sports_interests       TEXT    NOT NULL DEFAULT ""',
  'ALTER TABLE users ADD COLUMN fan_since_year         INTEGER',
  'ALTER TABLE users ADD COLUMN bio                    TEXT    NOT NULL DEFAULT ""',
  'ALTER TABLE users ADD COLUMN seeker_fan_level       TEXT    NOT NULL DEFAULT ""',
  'ALTER TABLE users ADD COLUMN seeker_age_range       TEXT    NOT NULL DEFAULT ""',

  // users — STH verification
  'ALTER TABLE users ADD COLUMN is_verified_sth          INTEGER NOT NULL DEFAULT 0',
  'ALTER TABLE users ADD COLUMN sth_team                 TEXT',
  'ALTER TABLE users ADD COLUMN sth_verification_submitted INTEGER NOT NULL DEFAULT 0',

  // tickets — lister preferences
  'ALTER TABLE tickets ADD COLUMN preferred_age_range TEXT NOT NULL DEFAULT "Any"',
  'ALTER TABLE tickets ADD COLUMN fan_level           TEXT NOT NULL DEFAULT "Either"',
  'ALTER TABLE tickets ADD COLUMN notes_to_seeker     TEXT NOT NULL DEFAULT ""',

  // users — password reset
  'ALTER TABLE users ADD COLUMN reset_token         TEXT',
  'ALTER TABLE users ADD COLUMN reset_token_expires TEXT',
];

let migrationsRun = 0;
for (const sql of migrations) {
  try { db.exec(sql); migrationsRun++; } catch (_) {}
}
console.log(`[db] Migrations attempted: ${migrations.length}, new columns added: ${migrationsRun}`);

module.exports = db;

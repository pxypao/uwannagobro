const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id            SERIAL PRIMARY KEY,
      first_name    TEXT        NOT NULL,
      email         TEXT        NOT NULL UNIQUE,
      phone         TEXT        NOT NULL,
      password_hash TEXT        NOT NULL,
      date_of_birth TEXT        NOT NULL,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS tickets (
      id         SERIAL PRIMARY KEY,
      lister_id  INTEGER     NOT NULL REFERENCES users(id),
      title      TEXT        NOT NULL,
      sport      TEXT        NOT NULL,
      date       TEXT        NOT NULL,
      time       TEXT        NOT NULL,
      venue      TEXT        NOT NULL,
      zip        TEXT        NOT NULL,
      status     TEXT        NOT NULL DEFAULT 'open'
                             CHECK(status IN ('open','claimed','cancelled')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS claims (
      id         SERIAL PRIMARY KEY,
      ticket_id  INTEGER     NOT NULL REFERENCES tickets(id),
      seeker_id  INTEGER     NOT NULL REFERENCES users(id),
      status     TEXT        NOT NULL DEFAULT 'active'
                             CHECK(status IN ('active','cancelled')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS messages (
      id         SERIAL PRIMARY KEY,
      claim_id   INTEGER     NOT NULL REFERENCES claims(id),
      sender_id  INTEGER     REFERENCES users(id),
      body       TEXT        NOT NULL,
      is_read    BOOLEAN     NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS ratings (
      id         SERIAL PRIMARY KEY,
      claim_id   INTEGER NOT NULL REFERENCES claims(id),
      rater_id   INTEGER NOT NULL REFERENCES users(id),
      ratee_id   INTEGER NOT NULL REFERENCES users(id),
      stars      INTEGER NOT NULL CHECK(stars BETWEEN 1 AND 5),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE UNIQUE INDEX IF NOT EXISTS ratings_one_per_claim ON ratings(claim_id, rater_id);
    CREATE UNIQUE INDEX IF NOT EXISTS users_unique_phone ON users(phone);
  `);

  // Safe column migrations
  const migrations = [
    `DO $$ BEGIN ALTER TABLE claims ADD COLUMN transfer_confirmed BOOLEAN NOT NULL DEFAULT FALSE; EXCEPTION WHEN duplicate_column THEN NULL; END $$`,
    `DO $$ BEGIN ALTER TABLE claims ADD COLUMN transfer_deadline TIMESTAMPTZ; EXCEPTION WHEN duplicate_column THEN NULL; END $$`,
    `DO $$ BEGIN ALTER TABLE claims ADD COLUMN seeker_responded BOOLEAN NOT NULL DEFAULT FALSE; EXCEPTION WHEN duplicate_column THEN NULL; END $$`,
    `DO $$ BEGIN ALTER TABLE claims ADD COLUMN response_deadline TIMESTAMPTZ; EXCEPTION WHEN duplicate_column THEN NULL; END $$`,
    `DO $$ BEGIN ALTER TABLE users ADD COLUMN favorite_team TEXT NOT NULL DEFAULT ''; EXCEPTION WHEN duplicate_column THEN NULL; END $$`,
    `DO $$ BEGIN ALTER TABLE users ADD COLUMN sports_interests TEXT NOT NULL DEFAULT ''; EXCEPTION WHEN duplicate_column THEN NULL; END $$`,
    `DO $$ BEGIN ALTER TABLE users ADD COLUMN fan_since_year INTEGER; EXCEPTION WHEN duplicate_column THEN NULL; END $$`,
    `DO $$ BEGIN ALTER TABLE users ADD COLUMN bio TEXT NOT NULL DEFAULT ''; EXCEPTION WHEN duplicate_column THEN NULL; END $$`,
    `DO $$ BEGIN ALTER TABLE users ADD COLUMN seeker_fan_level TEXT NOT NULL DEFAULT ''; EXCEPTION WHEN duplicate_column THEN NULL; END $$`,
    `DO $$ BEGIN ALTER TABLE users ADD COLUMN seeker_age_range TEXT NOT NULL DEFAULT ''; EXCEPTION WHEN duplicate_column THEN NULL; END $$`,
    `DO $$ BEGIN ALTER TABLE users ADD COLUMN is_verified_sth BOOLEAN NOT NULL DEFAULT FALSE; EXCEPTION WHEN duplicate_column THEN NULL; END $$`,
    `DO $$ BEGIN ALTER TABLE users ADD COLUMN sth_team TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END $$`,
    `DO $$ BEGIN ALTER TABLE users ADD COLUMN sth_verification_submitted BOOLEAN NOT NULL DEFAULT FALSE; EXCEPTION WHEN duplicate_column THEN NULL; END $$`,
    `DO $$ BEGIN ALTER TABLE tickets ADD COLUMN preferred_age_range TEXT NOT NULL DEFAULT 'Any'; EXCEPTION WHEN duplicate_column THEN NULL; END $$`,
    `DO $$ BEGIN ALTER TABLE tickets ADD COLUMN fan_level TEXT NOT NULL DEFAULT 'Either'; EXCEPTION WHEN duplicate_column THEN NULL; END $$`,
    `DO $$ BEGIN ALTER TABLE tickets ADD COLUMN notes_to_seeker TEXT NOT NULL DEFAULT ''; EXCEPTION WHEN duplicate_column THEN NULL; END $$`,
    `DO $$ BEGIN ALTER TABLE users ADD COLUMN reset_token TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END $$`,
    `DO $$ BEGIN ALTER TABLE users ADD COLUMN reset_token_expires TIMESTAMPTZ; EXCEPTION WHEN duplicate_column THEN NULL; END $$`,
    `CREATE TABLE IF NOT EXISTS games (
      id         SERIAL PRIMARY KEY,
      title      TEXT NOT NULL,
      sport      TEXT NOT NULL,
      date       TEXT NOT NULL,
      time       TEXT NOT NULL,
      venue      TEXT NOT NULL,
      zip        TEXT NOT NULL,
      team       TEXT NOT NULL,
      source     TEXT NOT NULL DEFAULT 'manual',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(title, date)
    )`,
  ];

  for (const sql of migrations) {
    await pool.query(sql);
  }
  console.log('[db] Schema initialized');
}

pool.initDb = initDb;

module.exports = pool;

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const db = require('./database');

const seeds = [
  {
    title: 'Portland Pickles vs Walla Walla Sweets',
    sport: 'Baseball',
    date: '2026-04-05',
    time: '18:05',
    venue: 'Walker Stadium',
    zip: '97201',
  },
  {
    title: 'Portland Timbers vs LA Galaxy',
    sport: 'Soccer',
    date: '2026-04-08',
    time: '19:30',
    venue: 'Providence Park',
    zip: '97201',
  },
  {
    title: 'Trail Blazers vs Golden State Warriors',
    sport: 'Basketball',
    date: '2026-04-12',
    time: '20:00',
    venue: 'Moda Center',
    zip: '97227',
  },
  {
    title: 'Oregon Ducks Spring Game',
    sport: 'Football',
    date: '2026-04-20',
    time: '14:00',
    venue: 'Autzen Stadium',
    zip: '97401',
  },
];

async function seed() {
  const existingRes = await db.query('SELECT id FROM users WHERE email = $1', ['seed@rallybro.com']);
  let listerId;

  if (existingRes.rows.length === 0) {
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash('SeedPass123!', 10);
    const result = await db.query(
      `INSERT INTO users (first_name, email, phone, password_hash, date_of_birth)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      ['Community', 'seed@rallybro.com', '5035550000', hash, '1990-01-01']
    );
    listerId = result.rows[0].id;
    console.log('Created seed user id:', listerId);
  } else {
    listerId = existingRes.rows[0].id;
    console.log('Seed user already exists, id:', listerId);
  }

  let added = 0;
  for (const seedItem of seeds) {
    const exists = await db.query(
      'SELECT id FROM tickets WHERE title = $1 AND lister_id = $2',
      [seedItem.title, listerId]
    );
    if (exists.rows.length === 0) {
      await db.query(
        `INSERT INTO tickets (lister_id, title, sport, date, time, venue, zip, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'open')`,
        [listerId, seedItem.title, seedItem.sport, seedItem.date, seedItem.time, seedItem.venue, seedItem.zip]
      );
      added++;
    }
  }

  console.log(`Seeded ${added} ticket(s). (${seeds.length - added} already existed)`);
}

module.exports = seed;

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const db = require('./database');

// Seed a system lister account if it doesn't exist
const existing = db.prepare('SELECT id FROM users WHERE email = ?').get('seed@rallybro.com');
let listerId;

if (!existing) {
  const bcrypt = require('bcryptjs');
  const hash = bcrypt.hashSync('SeedPass123!', 10);
  const result = db.prepare(`
    INSERT INTO users (first_name, email, phone, password_hash, date_of_birth)
    VALUES ('Community', 'seed@rallybro.com', '5035550000', ?, '1990-01-01')
  `).run(hash);
  listerId = result.lastInsertRowid;
  console.log('Created seed user id:', listerId);
} else {
  listerId = existing.id;
  console.log('Seed user already exists, id:', listerId);
}

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

const insert = db.prepare(`
  INSERT INTO tickets (lister_id, title, sport, date, time, venue, zip, status)
  VALUES (@lister_id, @title, @sport, @date, @time, @venue, @zip, 'open')
`);

let added = 0;
for (const seed of seeds) {
  const exists = db.prepare('SELECT id FROM tickets WHERE title = ? AND lister_id = ?').get(seed.title, listerId);
  if (!exists) {
    insert.run({ lister_id: listerId, ...seed });
    added++;
  }
}

console.log(`Seeded ${added} ticket(s). (${seeds.length - added} already existed)`);

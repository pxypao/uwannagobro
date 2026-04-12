const https = require('https');
const db = require('../db/database');

// MLB Stats API team IDs
const TEAMS = [
  { teamId: 559, name: 'Hillsboro Hops', sport: 'Baseball', venue: 'Ron Tonkin Field', zip: '97123' },
];

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'RallyBro/1.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error('Failed to parse JSON: ' + e.message)); }
      });
    }).on('error', reject);
  });
}

function pad(n) { return String(n).padStart(2, '0'); }

function formatTime(dateTimeStr) {
  if (!dateTimeStr) return '19:00';
  const d = new Date(dateTimeStr);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

async function syncTeam({ teamId, name, sport, venue, zip }) {
  const year = new Date().getFullYear();
  const url = `https://statsapi.mlb.com/api/v1/schedule?sportId=14&teamId=${teamId}&season=${year}&gameType=R&hydrate=venue`;

  let data;
  try {
    data = await fetchJSON(url);
  } catch (e) {
    console.error(`[scheduleSync] Failed to fetch ${name}:`, e.message);
    return 0;
  }

  const dates = data.dates || [];
  let upserted = 0;

  for (const day of dates) {
    for (const game of day.games) {
      // Only home games
      const isHome = game.teams?.home?.team?.id === teamId;
      if (!isHome) continue;

      const away = game.teams?.away?.team?.name || 'TBD';
      const title = `${name} vs ${away}`;
      const date = day.date; // YYYY-MM-DD
      const time = formatTime(game.gameDate);

      try {
        await db.query(`
          INSERT INTO games (title, sport, date, time, venue, zip, team, source, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, 'mlb_api', NOW())
          ON CONFLICT (title, date) DO UPDATE
            SET time = EXCLUDED.time, updated_at = NOW()
        `, [title, sport, date, time, venue, zip, name]);
        upserted++;
      } catch (e) {
        console.error(`[scheduleSync] DB error for ${title}:`, e.message);
      }
    }
  }

  console.log(`[scheduleSync] ${name}: ${upserted} games synced`);
  return upserted;
}

async function syncAllTeams() {
  console.log('[scheduleSync] Starting schedule sync…');
  for (const team of TEAMS) {
    await syncTeam(team);
  }
  console.log('[scheduleSync] Done.');
}

module.exports = { syncAllTeams };

const express = require('express');
const db = require('../db/database');
const { getRatingInfo } = require('./ratings');
const { getTier } = require('../lib/tiers');

const router = express.Router();

// GET /api/users/:id/profile — public profile of any user
router.get('/:id/profile', (req, res) => {
  const user = db.prepare(`
    SELECT id, first_name, favorite_team, sports_interests, fan_since_year, bio,
           is_verified_sth, sth_team
    FROM users WHERE id = ?
  `).get(req.params.id);

  if (!user) return res.status(404).json({ error: 'User not found.' });

  const { count: listing_count } = db.prepare(`
    SELECT COUNT(*) AS count FROM tickets WHERE lister_id = ? AND status != 'cancelled'
  `).get(user.id);

  const tier     = getTier(listing_count);
  const rating   = getRatingInfo(user.id);

  res.json({
    profile: {
      ...user,
      sports_interests: user.sports_interests
        ? user.sports_interests.split(',').map(s => s.trim()).filter(Boolean)
        : [],
      listing_count,
      tier,
      ...rating,
    }
  });
});

// GET /api/users/:id/rating  (kept here, removed dual-mount from index.js)
router.get('/:id/rating', (req, res) => {
  res.json(getRatingInfo(parseInt(req.params.id, 10)));
});

module.exports = router;

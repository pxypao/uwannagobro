const express = require('express');
const db = require('../db/database');
const { getRatingInfo } = require('./ratings');
const { getTier } = require('../lib/tiers');

const router = express.Router();

// GET /api/users/:id/profile — public profile of any user
router.get('/:id/profile', async (req, res) => {
  const userRes = await db.query(`
    SELECT id, first_name, favorite_team, sports_interests, fan_since_year, bio,
           is_verified_sth, sth_team
    FROM users WHERE id = $1
  `, [req.params.id]);
  const user = userRes.rows[0];

  if (!user) return res.status(404).json({ error: 'User not found.' });

  const countRes = await db.query(
    `SELECT COUNT(*) AS count FROM tickets WHERE lister_id = $1 AND status != 'cancelled'`,
    [user.id]
  );
  const listing_count = parseInt(countRes.rows[0].count, 10);

  const tier   = getTier(listing_count);
  const rating = await getRatingInfo(user.id);

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

// GET /api/users/:id/rating
router.get('/:id/rating', async (req, res) => {
  const info = await getRatingInfo(parseInt(req.params.id, 10));
  res.json(info);
});

module.exports = router;

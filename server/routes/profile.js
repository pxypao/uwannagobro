const express = require('express');
const db = require('../db/database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const ALLOWED_SPORTS      = ['Baseball', 'Soccer', 'Basketball', 'Football', 'Hockey'];
const ALLOWED_FAN_LEVELS  = ['Casual', 'Die-Hard', ''];
const ALLOWED_AGE_RANGES  = ['Any', '18-25', '26-35', '36-50', '50+', ''];

// PUT /api/profile
router.put('/', requireAuth, async (req, res) => {
  let { favorite_team, sports_interests, fan_since_year, bio,
        seeker_fan_level, seeker_age_range } = req.body;

  // Validate bio length
  if (bio && bio.length > 160) {
    return res.status(400).json({ error: 'Bio must be 160 characters or fewer.' });
  }

  // Normalise sports_interests — accept array or comma string
  if (Array.isArray(sports_interests)) {
    sports_interests = sports_interests
      .filter(s => ALLOWED_SPORTS.includes(s))
      .join(', ');
  } else if (typeof sports_interests === 'string') {
    sports_interests = sports_interests
      .split(',')
      .map(s => s.trim())
      .filter(s => ALLOWED_SPORTS.includes(s))
      .join(', ');
  } else {
    sports_interests = '';
  }

  // fan_since_year must be a plausible year or null
  if (fan_since_year !== undefined && fan_since_year !== null && fan_since_year !== '') {
    const yr = parseInt(fan_since_year, 10);
    if (isNaN(yr) || yr < 1900 || yr > new Date().getFullYear()) {
      return res.status(400).json({ error: 'Invalid fan since year.' });
    }
    fan_since_year = yr;
  } else {
    fan_since_year = null;
  }

  const s_fan = ALLOWED_FAN_LEVELS.includes(seeker_fan_level) ? (seeker_fan_level || '') : '';
  const s_age = ALLOWED_AGE_RANGES.includes(seeker_age_range) ? (seeker_age_range || '') : '';

  await db.query(`
    UPDATE users
    SET favorite_team    = $1,
        sports_interests = $2,
        fan_since_year   = $3,
        bio              = $4,
        seeker_fan_level = $5,
        seeker_age_range = $6
    WHERE id = $7
  `, [
    (favorite_team || '').trim().slice(0, 100),
    sports_interests,
    fan_since_year,
    (bio || '').trim().slice(0, 160),
    s_fan,
    s_age,
    req.user.id,
  ]);

  const updatedRes = await db.query(`
    SELECT id, first_name, email, favorite_team, sports_interests, fan_since_year, bio,
           seeker_fan_level, seeker_age_range
    FROM users WHERE id = $1
  `, [req.user.id]);

  res.json({ profile: updatedRes.rows[0] });
});

// GET /api/profile — own profile (auth required)
router.get('/', requireAuth, async (req, res) => {
  const profileRes = await db.query(`
    SELECT id, first_name, email, favorite_team, sports_interests, fan_since_year, bio,
           seeker_fan_level, seeker_age_range
    FROM users WHERE id = $1
  `, [req.user.id]);
  const profile = profileRes.rows[0];

  res.json({
    profile: {
      ...profile,
      sports_interests: profile.sports_interests
        ? profile.sports_interests.split(',').map(s => s.trim()).filter(Boolean)
        : [],
    }
  });
});

module.exports = router;

const TIERS = [
  { name: 'Legend',  emoji: '👑', min: 25, max: Infinity, description: '25+ tickets listed' },
  { name: 'MVP',     emoji: '🔥', min: 10, max: 24,       description: '10+ tickets listed' },
  { name: 'Regular', emoji: '⭐', min: 3,  max: 9,        description: '3+ tickets listed'  },
  { name: 'Rookie',  emoji: '🎟️', min: 1,  max: 2,        description: '1–2 tickets listed' },
];

/**
 * Given a lifetime listing count, return the tier object.
 * Returns null if the user has never listed.
 */
function getTier(listingCount) {
  if (!listingCount || listingCount < 1) return null;
  return TIERS.find(t => listingCount >= t.min) || TIERS[TIERS.length - 1];
}

/**
 * Given a listing count, return progress info toward the next tier.
 * { current, next, needed, progress (0-1) }
 */
function getTierProgress(listingCount) {
  const count = listingCount || 0;
  const current = getTier(count);

  // Find the next tier above current
  const currentIdx = current ? TIERS.indexOf(current) : TIERS.length;
  const nextTier   = TIERS[currentIdx - 1]; // array is sorted desc

  if (!nextTier) return { current, next: null, needed: 0, progress: 1 };

  const needed   = nextTier.min - count;
  const rangeMin = current ? current.min : 0;
  const progress = Math.min((count - rangeMin) / (nextTier.min - rangeMin), 1);

  return { current, next: nextTier, needed, progress };
}

module.exports = { getTier, getTierProgress, TIERS };

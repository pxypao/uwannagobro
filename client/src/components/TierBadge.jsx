import React from 'react';

/**
 * tier: { name, emoji, description } — shape returned by server getTier()
 * size: 'sm' | 'md'
 */
export default function TierBadge({ tier, size = 'sm' }) {
  if (!tier) return null;

  const isLegend = tier.name === 'Legend';
  const fontSize  = size === 'md' ? '0.82rem' : '0.7rem';
  const padding   = size === 'md' ? '0.2rem 0.7rem' : '0.12rem 0.5rem';

  return (
    <span
      className="tier-badge"
      data-tier={tier.name.toLowerCase()}
      title={tier.description}
      aria-label={`Tier: ${tier.name}. ${tier.description}`}
      style={{ fontSize, padding }}
    >
      {tier.emoji}
    </span>
  );
}

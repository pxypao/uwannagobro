import React from 'react';

/**
 * Blue "✓ Season Ticket Holder" badge.
 * size: 'sm' | 'md'
 */
export default function STHBadge({ team, size = 'sm' }) {
  const label = team ? `✓ Season Ticket Holder — ${team}` : '✓ Season Ticket Holder';
  const fontSize = size === 'md' ? '0.82rem' : '0.7rem';
  const padding  = size === 'md' ? '0.2rem 0.7rem' : '0.12rem 0.55rem';

  return (
    <span
      className="sth-badge"
      title={label}
      aria-label={label}
      style={{ fontSize, padding }}
    >
      ✓ Season Ticket Holder
    </span>
  );
}

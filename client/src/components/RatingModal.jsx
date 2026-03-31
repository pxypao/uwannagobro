import React, { useState } from 'react';
import { API_BASE } from '../lib/api';

export default function RatingModal({ claimId, listerName, onDone, onDismiss }) {
  const [hovered, setHovered]   = useState(0);
  const [selected, setSelected] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]       = useState('');

  async function handleSubmit() {
    if (!selected) { setError('Please choose a star rating.'); return; }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/ratings/${claimId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ stars: selected }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to submit rating.'); return; }
      onDone();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const active = hovered || selected;

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Rate your experience"
      onClick={e => { if (e.target === e.currentTarget) onDismiss(); }}
    >
      <div className="modal" style={{ textAlign: 'center', maxWidth: '380px' }}>
        <button className="modal-close" onClick={onDismiss} aria-label="Close">×</button>

        <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }} aria-hidden="true">🏟️</div>
        <h2 className="modal-title" style={{ fontSize: '1.6rem', marginBottom: '0.4rem' }}>
          Rate Your Experience
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          How was your meet-up with <strong>{listerName}</strong>?
        </p>

        {/* Star picker */}
        <div
          style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}
          role="group"
          aria-label="Star rating"
        >
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              aria-label={`${n} star${n > 1 ? 's' : ''}`}
              aria-pressed={selected === n}
              onClick={() => setSelected(n)}
              onMouseEnter={() => setHovered(n)}
              onMouseLeave={() => setHovered(0)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '2.2rem',
                cursor: 'pointer',
                color: n <= active ? 'var(--gold)' : '#d1d5db',
                transition: 'color 0.1s, transform 0.1s',
                transform: n <= active ? 'scale(1.15)' : 'scale(1)',
                padding: '0.1rem',
              }}
            >
              ★
            </button>
          ))}
        </div>

        {selected > 0 && (
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
            {['', 'Rough night 😬', 'It was okay 🙂', 'Pretty good! 👍', 'Great time! 😄', 'Absolutely amazing! 🏆'][selected]}
          </p>
        )}

        {error && (
          <div className="banner banner-warn" role="alert" style={{ marginBottom: '0.75rem', textAlign: 'left' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={submitting || !selected}
            style={{ minWidth: '120px' }}
          >
            {submitting ? 'Submitting…' : 'Submit Rating'}
          </button>
          <button className="btn btn-outline" onClick={onDismiss}>
            Skip for Now
          </button>
        </div>
      </div>
    </div>
  );
}

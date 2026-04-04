import React from 'react';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

function formatTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${m} ${ampm}`;
}

export default function ClaimConfirmModal({ ticket, onConfirm, onCancel, loading }) {
  if (!ticket) return null;

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Confirm ticket claim"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="modal claim-confirm-modal">
        <button className="modal-close" onClick={onCancel} aria-label="Close">×</button>

        <div className="claim-confirm-sport-bar">
          <span className="claim-confirm-sport-label">{ticket.sport}</span>
        </div>

        <h2 className="modal-title" style={{ fontSize: '1.7rem', marginBottom: '0.25rem' }}>
          {ticket.title}
        </h2>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
          Listed by <strong style={{ color: 'var(--text)' }}>{ticket.lister_name}</strong>
        </p>

        <div className="claim-confirm-details">
          <div className="claim-confirm-row">
            <span className="claim-confirm-icon" aria-hidden="true">📅</span>
            <div>
              <div className="claim-confirm-row-label">Date</div>
              <div className="claim-confirm-row-value">{formatDate(ticket.date)}</div>
            </div>
          </div>
          <div className="claim-confirm-row">
            <span className="claim-confirm-icon" aria-hidden="true">🕐</span>
            <div>
              <div className="claim-confirm-row-label">Time</div>
              <div className="claim-confirm-row-value">{formatTime(ticket.time)}</div>
            </div>
          </div>
          <div className="claim-confirm-row">
            <span className="claim-confirm-icon" aria-hidden="true">📍</span>
            <div>
              <div className="claim-confirm-row-label">Venue</div>
              <div className="claim-confirm-row-value">{ticket.venue}</div>
            </div>
          </div>
        </div>

        {ticket.notes_to_seeker && (
          <div className="claim-confirm-note">
            <div className="claim-confirm-note-label">Note from lister</div>
            <p>{ticket.notes_to_seeker}</p>
          </div>
        )}

        <p className="claim-confirm-fine-print">
          By claiming this ticket you agree to show up or cancel at least 24 hours before the event. No-shows affect your standing in the community.
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
          <button
            className="btn btn-primary"
            style={{ flex: 1, padding: '0.75rem' }}
            onClick={onConfirm}
            disabled={loading}
            aria-label="Confirm and claim this ticket"
          >
            {loading ? 'Claiming…' : "I'm In — Claim Ticket"}
          </button>
          <button
            className="btn btn-outline"
            style={{ padding: '0.75rem 1rem' }}
            onClick={onCancel}
            disabled={loading}
            aria-label="Cancel"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

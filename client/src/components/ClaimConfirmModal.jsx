import React from 'react';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  return `${hour % 12 || 12}:${m} ${ampm}`;
}

function CalendarIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  );
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

        {/* Sport + Title */}
        <div style={{ marginBottom: '0.4rem' }}>
          <span className="badge badge-green" style={{ marginBottom: '0.65rem', display: 'inline-block' }}>
            {ticket.sport}
          </span>
        </div>
        <h2 className="modal-title" style={{ fontSize: '1.65rem', marginBottom: '0.3rem', lineHeight: 1.1 }}>
          {ticket.title}
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '1.25rem' }}>
          Listed by <strong style={{ color: 'var(--text)' }}>{ticket.lister_name}</strong>
        </p>

        {/* Detail bubbles */}
        <div className="claim-detail-bubbles">
          <div className="claim-detail-bubble">
            <span className="claim-detail-bubble-icon" style={{ color: 'var(--green)' }}><CalendarIcon /></span>
            <div>
              <div className="claim-detail-bubble-label">Date</div>
              <div className="claim-detail-bubble-value">{formatDate(ticket.date)}</div>
            </div>
          </div>
          <div className="claim-detail-bubble">
            <span className="claim-detail-bubble-icon" style={{ color: 'var(--green)' }}><ClockIcon /></span>
            <div>
              <div className="claim-detail-bubble-label">Time</div>
              <div className="claim-detail-bubble-value">{formatTime(ticket.time)}</div>
            </div>
          </div>
          <div className="claim-detail-bubble">
            <span className="claim-detail-bubble-icon" style={{ color: 'var(--green)' }}><PinIcon /></span>
            <div>
              <div className="claim-detail-bubble-label">Venue</div>
              <div className="claim-detail-bubble-value">{ticket.venue}</div>
            </div>
          </div>
        </div>

        {/* Lister note */}
        {ticket.notes_to_seeker && (
          <div className="ticket-card-note" style={{ marginTop: '1rem' }}>
            "{ticket.notes_to_seeker}"
          </div>
        )}

        {/* Fine print */}
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.55, marginTop: '1rem', padding: '0.65rem 0.75rem', background: 'var(--surface-2)', borderRadius: 'var(--radius-xs)' }}>
          By claiming this ticket you agree to show up or cancel at least 24 hours before the event. No-shows affect your standing in the community.
        </p>

        {/* Actions */}
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

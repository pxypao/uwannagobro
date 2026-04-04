import React, { useState } from 'react';
import HostProfileModal from './HostProfileModal';

function initials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
}

export default function TicketCard({ ticket, onClaim, claimDisabled, user }) {
  const isLegend = ticket.lister_tier?.name === 'Legend';
  const [showProfile, setShowProfile] = useState(false);

  return (
    <article
      className="card"
      aria-label={`${ticket.title} ticket`}
      style={isLegend ? { borderColor: 'var(--gold)', boxShadow: '0 0 0 1px var(--gold), var(--shadow)' } : undefined}
    >
      <div className="ticket-card-body">
        <div className="ticket-card-badges">
          <span className="badge badge-green" aria-label={`Sport: ${ticket.sport}`}>
            {ticket.sport}
          </span>
          <span className="badge badge-gold" aria-label="Free ticket">FREE</span>
        </div>

        <h3 className="ticket-card-title">{ticket.title}</h3>

        <div className="ticket-card-meta">
          <span>{formatDate(ticket.date)} · {formatTime(ticket.time)}</span>
          <span>{ticket.venue}</span>
        </div>

        {ticket.notes_to_seeker && (
          <p className="ticket-card-note" aria-label="Note from lister">
            "{ticket.notes_to_seeker}"
          </p>
        )}

        <div className="ticket-card-footer">
          <button
            className="ticket-card-lister ticket-card-lister-btn"
            onClick={() => setShowProfile(true)}
            aria-label={`View ${ticket.lister_name}'s profile`}
          >
            <span className="avatar" aria-hidden="true">{initials(ticket.lister_name)}</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', textAlign: 'left' }}>
              <span style={{ fontWeight: 600 }}>{ticket.lister_name}</span>
              <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', alignItems: 'center' }}>
                {ticket.lister_good_host && (
                  <span className="badge-good-host" aria-label="Good Host">Good Host</span>
                )}
              </div>
            </div>
          </button>

          {claimDisabled ? (
            <span
              className="btn btn-sm"
              style={{ background: '#e5e7eb', color: 'var(--text-muted)', border: '2px solid var(--border)', cursor: 'default' }}
              aria-label="Unavailable: you already have an active claimed ticket"
              title="You already have an active claimed ticket"
            >
              Unavailable
            </span>
          ) : user && ticket.lister_id === user.id ? (
            <span
              className="btn btn-sm"
              style={{ background: '#e5e7eb', color: 'var(--text-muted)', border: '2px solid var(--border)', cursor: 'default' }}
              aria-label="This is your own listing"
            >
              Your Listing
            </span>
          ) : (
            <button
              className="btn btn-gold btn-sm"
              onClick={() => onClaim(ticket.id)}
              aria-label={`Claim ticket for ${ticket.title}`}
            >
              Claim Ticket
            </button>
          )}
        </div>
      </div>

      {showProfile && (
        <HostProfileModal
          listerId={ticket.lister_id}
          listerName={ticket.lister_name}
          ticket={ticket}
          onClose={() => setShowProfile(false)}
        />
      )}
    </article>
  );
}

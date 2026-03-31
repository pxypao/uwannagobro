import React, { useState, useEffect } from 'react';
import STHBadge from './STHBadge';
import { API_BASE } from '../lib/api';

function initials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function StarDisplay({ avg, total }) {
  if (!avg || total === 0) return null;
  const full  = Math.floor(avg);
  const half  = avg - full >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
      <span aria-hidden="true" style={{ color: 'var(--gold)', fontSize: '1rem', letterSpacing: '1px' }}>
        {'★'.repeat(full)}{'½'.repeat(half)}{'☆'.repeat(empty)}
      </span>
      <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
        {avg.toFixed(1)} ({total} rating{total !== 1 ? 's' : ''})
      </span>
    </div>
  );
}

export default function HostProfileModal({ listerId, listerName, onClose, ticket }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    if (!listerId) return;
    fetch(`${API_BASE}/api/users/${listerId}/profile`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        if (d.profile) setProfile(d.profile);
        else setError('Could not load profile.');
      })
      .catch(() => setError('Network error.'))
      .finally(() => setLoading(false));
  }, [listerId]);

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={`${listerName}'s profile`}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal" style={{ maxWidth: '400px' }}>
        <button className="modal-close" onClick={onClose} aria-label="Close">×</button>

        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0' }}>Loading…</p>
        ) : error ? (
          <p style={{ textAlign: 'center', color: '#c0392b', padding: '2rem 0' }}>{error}</p>
        ) : profile ? (
          <>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
              <div
                className="avatar"
                style={{ width: 56, height: 56, fontSize: '1.3rem', border: '2px solid var(--gold-dark)' }}
                aria-hidden="true"
              >
                {initials(profile.first_name)}
              </div>
              <div>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', color: 'var(--green)', letterSpacing: '0.04em', marginBottom: '0.25rem' }}>
                  {profile.first_name}
                </h2>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  {profile.good_host && (
                    <span className="badge-good-host">⭐ Good Host</span>
                  )}
                  {profile.is_verified_sth ? (
                    <STHBadge team={profile.sth_team} size="md" />
                  ) : null}
                </div>
              </div>
            </div>

            {/* Star rating */}
            {profile.total > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <StarDisplay avg={profile.avg_stars} total={profile.total} />
              </div>
            )}

            {/* Profile fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {profile.favorite_team && (
                <div className="host-profile-row">
                  <span className="host-profile-label">Favorite Team</span>
                  <span className="host-profile-value">🏆 {profile.favorite_team}</span>
                </div>
              )}

              {profile.sports_interests?.length > 0 && (
                <div className="host-profile-row">
                  <span className="host-profile-label">Sports They Follow</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.25rem' }}>
                    {profile.sports_interests.map(s => (
                      <span key={s} className="badge badge-green" style={{ fontSize: '0.72rem' }}>{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {profile.fan_since_year && (
                <div className="host-profile-row">
                  <span className="host-profile-label">Fan Since</span>
                  <span className="host-profile-value">📅 {profile.fan_since_year}</span>
                </div>
              )}

              {profile.bio && (
                <div className="host-profile-row">
                  <span className="host-profile-label">About</span>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text)', fontStyle: 'italic', margin: '0.2rem 0 0' }}>
                    "{profile.bio}"
                  </p>
                </div>
              )}

              {/* Matching preferences from the specific listing */}
              {ticket && (ticket.preferred_age_range !== 'Any' || ticket.fan_level !== 'Either' || ticket.notes_to_seeker) && (
                <div className="host-profile-row">
                  <span className="host-profile-label">Looking For</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.2rem' }}>
                    {ticket.preferred_age_range && ticket.preferred_age_range !== 'Any' && (
                      <span style={{ fontSize: '0.85rem' }}>🎂 Age range: <strong>{ticket.preferred_age_range}</strong></span>
                    )}
                    {ticket.fan_level && ticket.fan_level !== 'Either' && (
                      <span style={{ fontSize: '0.85rem' }}>🔥 Fan level: <strong>{ticket.fan_level}</strong></span>
                    )}
                    {ticket.notes_to_seeker && (
                      <p style={{ fontSize: '0.88rem', fontStyle: 'italic', color: 'var(--text)', margin: '0.15rem 0 0' }}>
                        "{ticket.notes_to_seeker}"
                      </p>
                    )}
                  </div>
                </div>
              )}

              {!profile.favorite_team && !profile.bio && (!profile.sports_interests || profile.sports_interests.length === 0) && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', textAlign: 'center', padding: '0.5rem 0' }}>
                  This host hasn't filled out their profile yet.
                </p>
              )}
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center' }}>
              <button className="btn btn-primary" onClick={onClose} style={{ minWidth: '120px' }}>
                Close
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

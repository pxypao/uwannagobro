import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import RatingModal from '../components/RatingModal';
import STHBadge from '../components/STHBadge';
import STHVerifyModal from '../components/STHVerifyModal';
import { apiFetch } from '../lib/api';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function StatusPill({ status }) {
  const map = {
    open:      { label: 'Open',    cls: 'badge-open'    },
    claimed:   { label: 'Claimed', cls: 'badge-claimed' },
    active:    { label: 'Active',  cls: 'badge-open'    },
    cancelled: { label: 'Cancelled', cls: 'badge-gray'  },
  };
  const { label, cls } = map[status] || { label: status, cls: 'badge-gray' };
  return <span className={`badge ${cls}`} aria-label={`Status: ${label}`}>{label}</span>;
}

export default function MyTickets() {
  const { user, loading, refetch } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [activeClaim, setActiveClaim] = useState(null);
  const [fetching, setFetching] = useState(true);
  const [cancelling, setCancelling] = useState(null);
  const [error, setError] = useState('');
  const [pendingRating, setPendingRating] = useState(null); // { claim_id, lister_name }
  const [tierProgress, setTierProgress] = useState(null);
  const [listingCount, setListingCount] = useState(0);
  const [sthModal, setSthModal] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate('/');
  }, [loading, user, navigate]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setFetching(true);
    try {
      const [lRes, cRes, rRes] = await Promise.all([
        apiFetch(`/api/my/tickets`),
        apiFetch(`/api/my/claim`),
        apiFetch(`/api/my/pending-ratings`),
      ]);
      if (lRes.ok) {
        const d = await lRes.json();
        setListings(d.tickets);
        if (d.tierProgress) setTierProgress(d.tierProgress);
        if (d.listing_count !== undefined) setListingCount(d.listing_count);
      }
      if (cRes.ok) { const d = await cRes.json(); setActiveClaim(d.claim); }
      if (rRes.ok) {
        const d = await rRes.json();
        if (d.pending && d.pending.length > 0) {
          setPendingRating(d.pending[0]); // prompt for the most recent one
        }
      }
    } finally {
      setFetching(false);
    }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function cancelListing(ticketId) {
    if (!window.confirm('Remove this listing from the public feed?')) return;
    setCancelling(ticketId);
    try {
      const res = await apiFetch(`/api/tickets/${ticketId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setListings(l => l.filter(t => t.id !== ticketId));
      } else {
        const d = await res.json();
        setError(d.error || 'Failed to cancel listing.');
      }
    } catch {
      setError('Network error.');
    } finally {
      setCancelling(null);
    }
  }

  async function cancelMeet(claimId) {
    if (!window.confirm('Cancel this meet? The ticket will go back to the pool.')) return;
    setCancelling('meet');
    try {
      const res = await apiFetch(`/api/claims/${claimId}/cancel`, {
        method: 'POST',
      });
      if (res.ok) {
        await fetchData();
        navigate('/messages');
      } else {
        const d = await res.json();
        setError(d.error || 'Failed to cancel meet.');
      }
    } catch {
      setError('Network error.');
    } finally {
      setCancelling(null);
    }
  }

  if (loading || fetching) return null;
  if (!user) return null;

  return (
    <main className="container" id="main-content" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.2rem', color: 'var(--green)', letterSpacing: '0.04em', margin: 0 }}>
            My Tickets
          </h1>
        </div>

        {/* Tier progress bar */}
        {tierProgress && tierProgress.next && (
          <div style={{ maxWidth: '360px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
              <span>{tierProgress.current ? `${tierProgress.current.emoji} ${tierProgress.current.name}` : 'No tier yet'}</span>
              <span>{tierProgress.next.emoji} {tierProgress.next.name}</span>
            </div>
            <div
              role="progressbar"
              aria-valuenow={listingCount}
              aria-valuemin={tierProgress.current?.min || 0}
              aria-valuemax={tierProgress.next.min}
              aria-label={`${tierProgress.needed} more listing${tierProgress.needed !== 1 ? 's' : ''} to reach ${tierProgress.next.name}`}
              style={{ background: '#e5e7eb', borderRadius: '999px', height: '8px', overflow: 'hidden' }}
            >
              <div style={{
                width: `${Math.round(tierProgress.progress * 100)}%`,
                background: 'var(--gold)',
                height: '100%',
                borderRadius: '999px',
                transition: 'width 0.4s ease',
              }} />
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
              {tierProgress.needed} more listing{tierProgress.needed !== 1 ? 's' : ''} to reach{' '}
              <strong>{tierProgress.next.emoji} {tierProgress.next.name}</strong>
            </p>
          </div>
        )}
        {tierProgress?.current?.name === 'Legend' && (
          <p style={{ fontSize: '0.82rem', color: 'var(--gold-dark)', fontWeight: 600, marginTop: '0.25rem' }}>
            👑 You've reached the top — Legend status!
          </p>
        )}

        {/* STH badge / verify button */}
        <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {user?.is_verified_sth ? (
            <STHBadge team={user.sth_team} size="md" />
          ) : (
            <button
              className="btn btn-sm"
              style={{ color: '#1e6bb8', borderColor: '#1e6bb8', background: 'transparent' }}
              onClick={() => setSthModal(true)}
              aria-label="Apply for Season Ticket Holder verification"
            >
              {user?.sth_verification_submitted ? '🕐 Verification Pending' : '✓ Verify Season Tickets'}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="banner banner-warn mb-1" role="alert">
          {error}
          <button className="banner-dismiss" onClick={() => setError('')} aria-label="Dismiss">×</button>
        </div>
      )}

      {/* ─── Section A: My Listings ─── */}
      <section className="my-tickets-section" aria-label="Tickets I'm listing">
        <h2>Tickets I'm Listing</h2>

        {listings.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon" aria-hidden="true">🎟️</div>
            <h3>No listings yet</h3>
            <p>Got a spare ticket? <Link to="/list">List it for free →</Link></p>
          </div>
        ) : (
          <div role="list" aria-label="My ticket listings">
            {listings.map(ticket => (
              <div
                key={ticket.id}
                className="my-ticket-card"
                role="listitem"
                aria-label={ticket.title}
              >
                <div className="my-ticket-card-header">
                  <div>
                    <div className="my-ticket-title">{ticket.title}</div>
                    <div className="my-ticket-meta">
                      {formatDate(ticket.date)} · {ticket.venue}
                      {ticket.seeker_name && (
                        <> · Claimed by <strong>{ticket.seeker_name}</strong></>
                      )}
                    </div>
                  </div>
                  <StatusPill status={ticket.status} />
                </div>

                <div className="my-ticket-actions">
                  {ticket.status === 'claimed' && ticket.claim_id && (
                    <Link
                      to="/messages"
                      className="btn btn-primary btn-sm"
                      aria-label={`Chat about ${ticket.title}`}
                    >
                      💬 Chat
                    </Link>
                  )}
                  {ticket.status === 'open' && (
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => cancelListing(ticket.id)}
                      disabled={cancelling === ticket.id}
                      aria-label={`Cancel listing for ${ticket.title}`}
                    >
                      {cancelling === ticket.id ? 'Cancelling…' : 'Cancel Listing'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ─── STH Verify Modal ─── */}
      {sthModal && (
        <STHVerifyModal
          user={user}
          onClose={() => setSthModal(false)}
          onSubmitted={() => { setSthModal(false); refetch(); }}
        />
      )}

      {/* ─── Rating Modal ─── */}
      {pendingRating && (
        <RatingModal
          claimId={pendingRating.claim_id}
          listerName={pendingRating.lister_name}
          onDone={() => { setPendingRating(null); fetchData(); }}
          onDismiss={() => setPendingRating(null)}
        />
      )}

      {/* ─── Section B: Meets I've Joined ─── */}
      <section className="my-tickets-section" aria-label="Meets I've joined">
        <h2>Meets I've Joined</h2>

        {!activeClaim ? (
          <div className="empty-state">
            <div className="empty-state-icon" aria-hidden="true">🤝</div>
            <h3>No active meet</h3>
            <p>Claim a free ticket to join a game day meet. <Link to="/">Browse tickets →</Link></p>
          </div>
        ) : (
          <div role="list" aria-label="My claimed tickets">
            <div
              className="my-ticket-card"
              role="listitem"
              aria-label={activeClaim.title}
            >
              <div className="my-ticket-card-header">
                <div>
                  <div className="my-ticket-title">{activeClaim.title}</div>
                  <div className="my-ticket-meta">
                    {formatDate(activeClaim.date)} · {activeClaim.venue} · Listed by <strong>{activeClaim.lister_name}</strong>
                  </div>
                </div>
                <StatusPill status="active" />
              </div>

              <div className="my-ticket-actions">
                <Link
                  to="/messages"
                  className="btn btn-primary btn-sm"
                  aria-label={`Chat about ${activeClaim.title}`}
                >
                  💬 Chat
                </Link>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => cancelMeet(activeClaim.id)}
                  disabled={cancelling === 'meet'}
                  aria-label="Cancel this meet"
                >
                  {cancelling === 'meet' ? 'Cancelling…' : 'Cancel Meet'}
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

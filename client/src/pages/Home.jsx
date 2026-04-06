import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../context/AuthContext';
import TicketCard from '../components/TicketCard';
import ClaimConfirmModal from '../components/ClaimConfirmModal';
import { apiFetch } from '../lib/api';

const SPORTS = ['All Sports', 'Baseball', 'Soccer', 'Basketball', 'Football', 'Hockey'];

export default function Home({ openAuth }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [sport, setSport] = useState('All Sports');
  const [zip, setZip] = useState('');
  const [zipInput, setZipInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [claimBanner, setClaimBanner] = useState('');
  const [activeClaim, setActiveClaim] = useState(null);
  const [pendingTicket, setPendingTicket] = useState(null); // ticket awaiting claim confirmation
  const [claimLoading, setClaimLoading] = useState(false);
  const [alreadyClaimedModal, setAlreadyClaimedModal] = useState(false);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (zip) params.set('zip', zip);
      if (sport !== 'All Sports') params.set('sport', sport);
      const res = await apiFetch(`/api/tickets?${params}`, {});
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets);
      }
    } finally {
      setLoading(false);
    }
  }, [zip, sport]);

  // Fetch active claim so we know if user can claim more tickets
  useEffect(() => {
    if (!user) { setActiveClaim(null); return; }
    apiFetch(`/api/my/claim`, {})
      .then(r => r.json())
      .then(d => setActiveClaim(d.claim))
      .catch(() => {});
  }, [user]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  function handleClaim(ticketId) {
    if (!user) { openAuth('signup'); return; }
    if (activeClaim) {
      setAlreadyClaimedModal(true);
      return;
    }
    // Find the ticket details to show in the confirmation modal
    const ticket = tickets.find(t => t.id === ticketId);
    if (ticket) setPendingTicket(ticket);
  }

  async function confirmClaim() {
    if (!pendingTicket) return;
    setClaimLoading(true);
    try {
      const res = await apiFetch(`/api/tickets/${pendingTicket.id}/claim`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.status === 403) {
        setPendingTicket(null);
        setClaimBanner("You can't claim your own ticket. List it for someone else to enjoy!");
        setTimeout(() => setClaimBanner(''), 5000);
        return;
      }
      if (!res.ok) {
        setPendingTicket(null);
        setClaimBanner(data.error || 'Unable to claim this ticket.');
        return;
      }
      setPendingTicket(null);
      setActiveClaim(data.claim);
      fetchTickets();
      navigate('/messages');
    } catch {
      setPendingTicket(null);
      setClaimBanner('Network error. Please try again.');
    } finally {
      setClaimLoading(false);
    }
  }

  function handleSearch(e) {
    e.preventDefault();
    setZip(zipInput.trim());
  }

  const title = 'RallyBro - Free Sports Tickets. Real Fans. Game Day.';
  const description = 'RallyBro connects sports fans with extra tickets to fans who want to attend games for free. List your ticket or claim one near you. Portland, OR.';

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content="https://rallybro.com/" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://rallybro.com/og-image.png" />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'RallyBro',
          url: 'https://rallybro.com',
          description: 'Free sports ticket sharing platform connecting fans with extra tickets to fans who want to attend games.',
          applicationCategory: 'SportsApplication',
          operatingSystem: 'Web',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        })}</script>
      </Helmet>
      {/* ─── Hero ─── */}
      <section className="hero" aria-label="Hero">
        <div className="container">
          {/* ── Jumbotron Big Screen ── */}
          <div className="jumbotron" aria-label="Hero display">

            {/* Scoreboard header bar */}
            <div className="jumbotron-header">
              <div className="jumbotron-stat">
                <span className="jumbotron-stat-val">PDX</span>
                <span className="jumbotron-stat-label">City</span>
              </div>
              <div className="jumbotron-divider" />
              <div className="jumbotron-stat">
                <span className="jumbotron-stat-val">FREE</span>
                <span className="jumbotron-stat-label">Always</span>
              </div>
              <div className="jumbotron-divider" />
              <div className="jumbotron-center">
                <span className="jumbotron-logo-text">Rally<span>Bro</span></span>
                <span className="jumbotron-tagline">Portland's Ticket Community</span>
              </div>
              <div className="jumbotron-divider" />
              <div className="jumbotron-stat">
                <span className="jumbotron-stat-val">$0</span>
                <span className="jumbotron-stat-label">Cost</span>
              </div>
              <div className="jumbotron-divider" />
              <div className="jumbotron-stat">
                <span className="jumbotron-stat-val">PDX</span>
                <span className="jumbotron-stat-label">Fans</span>
              </div>
            </div>

            {/* Main screen */}
            <div className="jumbotron-screen">
              <h1 className="hero-headline" aria-label="Got an extra ticket? Find your rally bro.">
                Got an <span className="gold">extra ticket?</span><br />Find your rally bro.
              </h1>
            </div>

            {/* LED ticker strip at bottom */}
            <div className="led-marquee-wrap" aria-label="Tagline ticker">
              <div className="led-marquee-track">
                {[0, 1].map(i => (
                  <span key={i} className="led-marquee-text">
                    FREE TICKETS <span className="led-sep">◆</span> REAL FRIENDS <span className="led-sep">◆</span> GAME DAY <span className="led-sep">◆</span> PORTLAND'S HOME FOR EXTRA TICKETS <span className="led-sep">◆</span> LIST IT. CLAIM IT. RALLY. <span className="led-sep">◆</span>&nbsp;
                  </span>
                ))}
              </div>
            </div>

          </div>

          <form className="hero-search" onSubmit={handleSearch} aria-label="Search by zip code">
            <label htmlFor="zip-search" className="sr-only">Zip code</label>
            <input
              id="zip-search"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{5}"
              maxLength={5}
              placeholder="Enter zip code…"
              value={zipInput}
              onChange={e => setZipInput(e.target.value)}
              aria-label="Zip code filter"
            />
            <button type="submit" aria-label="Find events">Find Events</button>
          </form>

          {zip && (
            <button
              onClick={() => { setZip(''); setZipInput(''); }}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.75)', fontSize: '0.8rem', cursor: 'pointer', marginTop: '-0.5rem' }}
              aria-label="Clear zip filter"
            >
              ✕ Clear zip filter
            </button>
          )}

          <div className="hero-list-link">
            <Link to="/list" className="btn btn-ghost btn-sm" aria-label="List my extra ticket">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              List My Ticket
            </Link>
          </div>

          <div className="hero-trust" aria-label="Trust indicators">
            <span className="hero-trust-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
              100% Free, Always
            </span>
            <span className="hero-trust-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
              Verified Fans Only
            </span>
            <span className="hero-trust-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
              18+ &amp; ID Verified
            </span>
            <span className="hero-trust-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
              Portland Born
            </span>
          </div>
        </div>
      </section>

      {/* ─── Main content ─── */}
      <main className="container" id="main-content">
        {/* Claim banner */}
        {claimBanner && (
          <div className="banner banner-warn mt-2" role="alert" aria-live="polite">
            <span>{claimBanner}</span>
            <button className="banner-dismiss" onClick={() => setClaimBanner('')} aria-label="Dismiss">×</button>
          </div>
        )}

        {/* Active claim reminder */}
        {user && activeClaim && (
          <div className="banner banner-success mt-2" role="status">
            <span>
              You have an active meet for <strong>{activeClaim.title}</strong> on {activeClaim.date}.{' '}
              <Link to="/messages" style={{ color: 'inherit', fontWeight: 700, textDecoration: 'underline' }}>
                Open chat →
              </Link>
            </span>
          </div>
        )}

        {/* Sport filters */}
        <div
          className="sport-filters"
          role="group"
          aria-label="Filter by sport"
        >
          {SPORTS.map(s => (
            <button
              key={s}
              className={`sport-chip${sport === s ? ' active' : ''}`}
              onClick={() => setSport(s)}
              aria-pressed={sport === s}
              aria-label={`Filter by ${s}`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Ticket grid */}
        {loading ? (
          <div className="text-center" style={{ padding: '3rem', color: 'var(--text-muted)' }} aria-live="polite" aria-busy="true">
            Loading tickets…
          </div>
        ) : tickets.length === 0 ? (
          <div className="empty-state" aria-live="polite">
            <h3>No tickets found</h3>
            <p>
              {zip ? `No open tickets near ${zip}. ` : ''}
              {sport !== 'All Sports' ? `No ${sport} tickets right now. ` : ''}
              <Link to="/list">Be the first to list one!</Link>
            </p>
          </div>
        ) : (
          <div
            className="ticket-grid"
            role="list"
            aria-label="Available tickets"
            aria-live="polite"
          >
            {tickets.map(t => (
              <div key={t.id} role="listitem">
                <TicketCard
                  ticket={t}
                  onClaim={handleClaim}
                  claimDisabled={!!activeClaim && activeClaim.ticket_id !== t.id}
                  user={user}
                />
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Claim confirmation modal */}
      {pendingTicket && (
        <ClaimConfirmModal
          ticket={pendingTicket}
          onConfirm={confirmClaim}
          onCancel={() => setPendingTicket(null)}
          loading={claimLoading}
        />
      )}

      {/* Already claimed modal */}
      {alreadyClaimedModal && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="You already have an active ticket"
          onClick={(e) => { if (e.target === e.currentTarget) setAlreadyClaimedModal(false); }}
        >
          <div className="modal" style={{ textAlign: 'center', maxWidth: '380px' }}>
            <button className="modal-close" onClick={() => setAlreadyClaimedModal(false)} aria-label="Close">×</button>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }} aria-hidden="true">🎟</div>
            <h2 className="modal-title" style={{ fontSize: '1.6rem' }}>You're Already In!</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '0.5rem' }}>
              RallyBro is one ticket at a time — so everyone gets a fair shot.
            </p>
            {activeClaim && (
              <p style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '1.25rem' }}>
                You have an active meet for <span style={{ color: 'var(--green)' }}>{activeClaim.title}</span>.
              </p>
            )}
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Once your event date passes, you'll be free to claim another ticket.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <Link to="/messages" className="btn btn-primary" onClick={() => setAlreadyClaimedModal(false)}>
                View My Chat
              </Link>
              <button className="btn btn-outline" onClick={() => setAlreadyClaimedModal(false)}>
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

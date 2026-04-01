import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../context/AuthContext';
import TicketCard from '../components/TicketCard';
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

  async function handleClaim(ticketId) {
    if (!user) { openAuth('signup'); return; }
    if (activeClaim) {
      setClaimBanner('You already have an active claimed ticket. Once your event date passes, you can claim another!');
      return;
    }
    try {
      const res = await apiFetch(`/api/tickets/${ticketId}/claim`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.status === 403) {
        setClaimBanner("You can't claim your own ticket. List it for someone else to enjoy!");
        setTimeout(() => setClaimBanner(''), 5000);
        return;
      }
      if (!res.ok) {
        setClaimBanner(data.error || 'Unable to claim this ticket.');
        return;
      }
      // Refresh everything
      setActiveClaim(data.claim);
      fetchTickets();
      navigate('/messages');
    } catch {
      setClaimBanner('Network error. Please try again.');
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
          <h1 className="hero-headline">
            Got an <span className="gold">extra ticket?</span><br />Find your rally bro.
          </h1>
          <div className="hero-tagline-badge" aria-label="Tagline">
            Free tickets. Real friends. Game day.
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
              ＋ List My Ticket
            </Link>
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
    </>
  );
}

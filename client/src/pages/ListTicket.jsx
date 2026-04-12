import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/api';

const SPORTS    = ['Baseball', 'Soccer', 'Basketball', 'Football', 'Hockey'];
const AGE_OPTS  = ['Any', '18-25', '26-35', '36-50', '50+'];
const FAN_OPTS  = ['Either', 'Casual', 'Die-Hard'];
const MAX_NOTE  = 200;

const EMPTY = {
  title: '', sport: '', date: '', time: '', venue: '', zip: '',
  preferred_age_range: 'Any', fan_level: 'Either', notes_to_seeker: '',
};

// ── Portland sports game database ──
const GAME_DB = [
  // Portland Timbers (MLS Soccer) — Providence Park
  { title: 'Portland Timbers vs Seattle Sounders', sport: 'Soccer', date: '2026-04-12', time: '19:30', venue: 'Providence Park', zip: '97201' },
  { title: 'Portland Timbers vs LA Galaxy', sport: 'Soccer', date: '2026-04-19', time: '18:00', venue: 'Providence Park', zip: '97201' },
  { title: 'Portland Timbers vs LAFC', sport: 'Soccer', date: '2026-04-26', time: '20:00', venue: 'Providence Park', zip: '97201' },
  { title: 'Portland Timbers vs San Jose Earthquakes', sport: 'Soccer', date: '2026-05-03', time: '19:30', venue: 'Providence Park', zip: '97201' },
  { title: 'Portland Timbers vs Vancouver Whitecaps', sport: 'Soccer', date: '2026-05-17', time: '19:00', venue: 'Providence Park', zip: '97201' },
  { title: 'Portland Timbers vs Colorado Rapids', sport: 'Soccer', date: '2026-05-24', time: '18:30', venue: 'Providence Park', zip: '97201' },
  { title: 'Portland Timbers vs Real Salt Lake', sport: 'Soccer', date: '2026-06-07', time: '19:30', venue: 'Providence Park', zip: '97201' },
  { title: 'Portland Timbers vs Minnesota United', sport: 'Soccer', date: '2026-06-21', time: '19:00', venue: 'Providence Park', zip: '97201' },
  { title: 'Portland Timbers vs Sporting KC', sport: 'Soccer', date: '2026-07-05', time: '19:30', venue: 'Providence Park', zip: '97201' },
  { title: 'Portland Timbers vs FC Dallas', sport: 'Soccer', date: '2026-07-19', time: '18:00', venue: 'Providence Park', zip: '97201' },
  { title: 'Portland Timbers vs Austin FC', sport: 'Soccer', date: '2026-08-02', time: '19:00', venue: 'Providence Park', zip: '97201' },
  { title: 'Portland Timbers vs Houston Dynamo', sport: 'Soccer', date: '2026-08-16', time: '18:30', venue: 'Providence Park', zip: '97201' },

  // Portland Trail Blazers (NBA Basketball) — Moda Center
  { title: 'Portland Trail Blazers vs Golden State Warriors', sport: 'Basketball', date: '2026-04-05', time: '19:00', venue: 'Moda Center', zip: '97227' },
  { title: 'Portland Trail Blazers vs Los Angeles Lakers', sport: 'Basketball', date: '2026-04-09', time: '20:00', venue: 'Moda Center', zip: '97227' },
  { title: 'Portland Trail Blazers vs Sacramento Kings', sport: 'Basketball', date: '2026-04-13', time: '19:00', venue: 'Moda Center', zip: '97227' },
  { title: 'Portland Trail Blazers vs Phoenix Suns', sport: 'Basketball', date: '2026-10-22', time: '19:00', venue: 'Moda Center', zip: '97227' },
  { title: 'Portland Trail Blazers vs Utah Jazz', sport: 'Basketball', date: '2026-10-29', time: '19:30', venue: 'Moda Center', zip: '97227' },
  { title: 'Portland Trail Blazers vs Denver Nuggets', sport: 'Basketball', date: '2026-11-07', time: '19:00', venue: 'Moda Center', zip: '97227' },
  { title: 'Portland Trail Blazers vs Dallas Mavericks', sport: 'Basketball', date: '2026-11-14', time: '19:00', venue: 'Moda Center', zip: '97227' },
  { title: 'Portland Trail Blazers vs Memphis Grizzlies', sport: 'Basketball', date: '2026-11-21', time: '19:00', venue: 'Moda Center', zip: '97227' },

  // Portland Pickles (Collegiate Baseball) — Walker Stadium
  { title: 'Portland Pickles vs Corvallis Knights', sport: 'Baseball', date: '2026-06-05', time: '18:35', venue: 'Walker Stadium', zip: '97201' },
  { title: 'Portland Pickles vs Bend Elks', sport: 'Baseball', date: '2026-06-10', time: '18:35', venue: 'Walker Stadium', zip: '97201' },
  { title: 'Portland Pickles vs Cowlitz Black Bears', sport: 'Baseball', date: '2026-06-17', time: '18:35', venue: 'Walker Stadium', zip: '97201' },
  { title: 'Portland Pickles vs Bellingham Bells', sport: 'Baseball', date: '2026-06-24', time: '18:35', venue: 'Walker Stadium', zip: '97201' },
  { title: 'Portland Pickles vs Victoria HarbourCats', sport: 'Baseball', date: '2026-07-01', time: '18:35', venue: 'Walker Stadium', zip: '97201' },
  { title: 'Portland Pickles vs Kelowna Falcons', sport: 'Baseball', date: '2026-07-10', time: '18:35', venue: 'Walker Stadium', zip: '97201' },
  { title: 'Portland Pickles vs Medford Rogues', sport: 'Baseball', date: '2026-07-18', time: '18:35', venue: 'Walker Stadium', zip: '97201' },
  { title: 'Portland Pickles vs Walla Walla Sweets', sport: 'Baseball', date: '2026-07-25', time: '18:35', venue: 'Walker Stadium', zip: '97201' },
  { title: 'Portland Pickles vs Port Angeles Lefties', sport: 'Baseball', date: '2026-08-01', time: '18:35', venue: 'Walker Stadium', zip: '97201' },

  // Hillsboro Hops (High-A Baseball) — Ron Tonkin Field
  { title: 'Hillsboro Hops vs Tri-City Dust Devils', sport: 'Baseball', date: '2026-04-15', time: '18:35', venue: 'Ron Tonkin Field', zip: '97123' },
  { title: 'Hillsboro Hops vs Spokane Indians', sport: 'Baseball', date: '2026-04-22', time: '18:35', venue: 'Ron Tonkin Field', zip: '97123' },
  { title: 'Hillsboro Hops vs Everett AquaSox', sport: 'Baseball', date: '2026-04-29', time: '18:35', venue: 'Ron Tonkin Field', zip: '97123' },
  { title: 'Hillsboro Hops vs Vancouver Canadians', sport: 'Baseball', date: '2026-05-06', time: '18:35', venue: 'Ron Tonkin Field', zip: '97123' },
  { title: 'Hillsboro Hops vs Eugene Emeralds', sport: 'Baseball', date: '2026-05-13', time: '18:35', venue: 'Ron Tonkin Field', zip: '97123' },
  { title: 'Hillsboro Hops vs Tri-City Dust Devils', sport: 'Baseball', date: '2026-05-20', time: '18:35', venue: 'Ron Tonkin Field', zip: '97123' },
  { title: 'Hillsboro Hops vs Spokane Indians', sport: 'Baseball', date: '2026-05-27', time: '18:35', venue: 'Ron Tonkin Field', zip: '97123' },
  { title: 'Hillsboro Hops vs Everett AquaSox', sport: 'Baseball', date: '2026-06-03', time: '18:35', venue: 'Ron Tonkin Field', zip: '97123' },
  { title: 'Hillsboro Hops vs Vancouver Canadians', sport: 'Baseball', date: '2026-06-10', time: '18:35', venue: 'Ron Tonkin Field', zip: '97123' },
  { title: 'Hillsboro Hops vs Eugene Emeralds', sport: 'Baseball', date: '2026-06-17', time: '18:35', venue: 'Ron Tonkin Field', zip: '97123' },
  { title: 'Hillsboro Hops vs Tri-City Dust Devils', sport: 'Baseball', date: '2026-06-24', time: '18:35', venue: 'Ron Tonkin Field', zip: '97123' },
  { title: 'Hillsboro Hops vs Spokane Indians', sport: 'Baseball', date: '2026-07-08', time: '18:35', venue: 'Ron Tonkin Field', zip: '97123' },
  { title: 'Hillsboro Hops vs Everett AquaSox', sport: 'Baseball', date: '2026-07-15', time: '18:35', venue: 'Ron Tonkin Field', zip: '97123' },
  { title: 'Hillsboro Hops vs Vancouver Canadians', sport: 'Baseball', date: '2026-07-22', time: '18:35', venue: 'Ron Tonkin Field', zip: '97123' },
  { title: 'Hillsboro Hops vs Eugene Emeralds', sport: 'Baseball', date: '2026-07-29', time: '18:35', venue: 'Ron Tonkin Field', zip: '97123' },
  { title: 'Hillsboro Hops vs Tri-City Dust Devils', sport: 'Baseball', date: '2026-08-05', time: '18:35', venue: 'Ron Tonkin Field', zip: '97123' },
  { title: 'Hillsboro Hops vs Spokane Indians', sport: 'Baseball', date: '2026-08-12', time: '18:35', venue: 'Ron Tonkin Field', zip: '97123' },
  { title: 'Hillsboro Hops vs Everett AquaSox', sport: 'Baseball', date: '2026-08-19', time: '18:35', venue: 'Ron Tonkin Field', zip: '97123' },
  { title: 'Hillsboro Hops vs Vancouver Canadians', sport: 'Baseball', date: '2026-08-26', time: '18:35', venue: 'Ron Tonkin Field', zip: '97123' },
];

// Games are now fetched live from /api/games — see useGameSearch hook below

function formatSuggestionDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function ListTicket({ openAuth }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [autoFilled, setAutoFilled] = useState(false);
  const titleRef = useRef(null);
  const suggestionsRef = useRef(null);

  // If not logged in, show auth modal and redirect home
  useEffect(() => {
    if (!loading && !user) {
      openAuth('signup');
      navigate('/');
    }
  }, [loading, user, openAuth, navigate]);

  function set(k) {
    return (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  }

  async function handleTitleChange(e) {
    const val = e.target.value;
    setForm(f => ({ ...f, title: val }));
    setAutoFilled(false);
    if (val.length >= 2) {
      try {
        const res = await apiFetch(`/api/games?q=${encodeURIComponent(val)}`);
        if (res.ok) {
          const data = await res.json();
          // Fall back to hardcoded GAME_DB if API returns nothing
          const results = data.games.length > 0 ? data.games : searchGames(val);
          setSuggestions(results.slice(0, 6));
          setShowSuggestions(results.length > 0);
        }
      } catch {
        const results = searchGames(val);
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }

  function searchGames(query) {
    if (!query || query.length < 2) return [];
    const normalized = query.toLowerCase().trim();
    const today = new Date().toISOString().split('T')[0];
    return GAME_DB.filter(game => {
      if (game.date < today) return false;
      return (
        game.title.toLowerCase().includes(normalized) ||
        game.venue.toLowerCase().includes(normalized) ||
        game.sport.toLowerCase().includes(normalized)
      );
    }).slice(0, 6);
  }

  function selectGame(game) {
    setForm(f => ({
      ...f,
      title: game.title,
      sport: game.sport,
      date: game.date,
      time: game.time,
      venue: game.venue,
      zip: game.zip,
    }));
    setShowSuggestions(false);
    setSuggestions([]);
    setAutoFilled(true);
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (
        titleRef.current && !titleRef.current.contains(e.target) &&
        suggestionsRef.current && !suggestionsRef.current.contains(e.target)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await apiFetch(`/api/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to list ticket.'); return; }
      setSuccess(true);
      setForm(EMPTY);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return null;
  if (!user) return null;

  // Min date = today
  const today = new Date().toISOString().split('T')[0];

  return (
    <main className="list-page" id="main-content">
      <h1>List a Ticket</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
        Share your extra ticket and bring a fan along for the game. No cost to them.
      </p>

      {success && (
        <div className="banner banner-success mb-1" role="status" aria-live="polite">
          <span>
            Ticket listed! It's now live in the public feed.{' '}
            <button
              style={{ background: 'none', border: 'none', color: 'inherit', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
              onClick={() => { setSuccess(false); }}
            >
              List another
            </button>{' '}
            or{' '}
            <button
              style={{ background: 'none', border: 'none', color: 'inherit', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
              onClick={() => navigate('/my-tickets')}
            >
              view My Tickets.
            </button>
          </span>
        </div>
      )}

      {error && (
        <div className="banner banner-warn mb-1" role="alert">
          {error}
        </div>
      )}

      <form className="list-form" onSubmit={handleSubmit} noValidate>
        <div className="form-group" style={{ position: 'relative' }}>
          <label htmlFor="lt-title">Event Name</label>
          <input
            id="lt-title"
            ref={titleRef}
            className={`form-control${autoFilled ? ' input-autofilled' : ''}`}
            type="text"
            value={form.title}
            onChange={handleTitleChange}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            required
            placeholder="e.g. Timbers, Blazers, Hops…"
            autoComplete="off"
            aria-autocomplete="list"
            aria-controls="game-suggestions"
            aria-expanded={showSuggestions}
          />
          {autoFilled && (
            <div className="autofill-badge" aria-live="polite">
              Details auto-filled — review and adjust if needed
            </div>
          )}
          {showSuggestions && suggestions.length > 0 && (
            <ul
              id="game-suggestions"
              ref={suggestionsRef}
              className="game-suggestions"
              role="listbox"
              aria-label="Game suggestions"
            >
              {suggestions.map((game, i) => (
                <li
                  key={i}
                  role="option"
                  className="game-suggestion-item"
                  onMouseDown={() => selectGame(game)}
                >
                  <div className="game-suggestion-title">{game.title}</div>
                  <div className="game-suggestion-meta">
                    <span className="game-suggestion-sport">{game.sport}</span>
                    <span>{formatSuggestionDate(game.date)}</span>
                    <span>{game.venue}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="lt-sport">Sport</label>
          <select
            id="lt-sport"
            className="form-control"
            value={form.sport}
            onChange={set('sport')}
            required
          >
            <option value="" disabled>Select a sport…</option>
            {SPORTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="lt-date">Date</label>
            <input
              id="lt-date"
              className="form-control"
              type="date"
              value={form.date}
              onChange={set('date')}
              min={today}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="lt-time">Time</label>
            <input
              id="lt-time"
              className="form-control"
              type="time"
              value={form.time}
              onChange={set('time')}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="lt-venue">Venue / Stadium</label>
          <input
            id="lt-venue"
            className="form-control"
            type="text"
            value={form.venue}
            onChange={set('venue')}
            required
            placeholder="e.g. Moda Center"
          />
        </div>

        <div className="form-group">
          <label htmlFor="lt-zip">Zip Code</label>
          <input
            id="lt-zip"
            className="form-control"
            type="text"
            inputMode="numeric"
            pattern="[0-9]{5}"
            maxLength={5}
            value={form.zip}
            onChange={set('zip')}
            required
            placeholder="97201"
          />
        </div>

        {/* ── Collapsible Preferences ── */}
        <div className="prefs-section">
          <button
            type="button"
            className="prefs-toggle"
            onClick={() => setPrefsOpen(o => !o)}
            aria-expanded={prefsOpen}
            aria-controls="prefs-panel"
          >
            <span>Optional: Tell seekers what you're looking for</span>
            <span aria-hidden="true">{prefsOpen ? '▲' : '▼'}</span>
          </button>

          {prefsOpen && (
            <div id="prefs-panel" className="prefs-panel">
              <div className="form-group">
                <label htmlFor="lt-age">Preferred Age Range</label>
                <select
                  id="lt-age"
                  className="form-control"
                  value={form.preferred_age_range}
                  onChange={set('preferred_age_range')}
                >
                  {AGE_OPTS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>

              <fieldset style={{ border: 'none', padding: 0 }}>
                <legend style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                  Fan Level Preferred
                </legend>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  {FAN_OPTS.map(opt => (
                    <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontWeight: 500, fontSize: '0.9rem' }}>
                      <input
                        type="radio"
                        name="fan_level"
                        value={opt}
                        checked={form.fan_level === opt}
                        onChange={set('fan_level')}
                        style={{ accentColor: 'var(--green)' }}
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="form-group">
                <label htmlFor="lt-note">
                  Note to Seeker{' '}
                  <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>
                    ({MAX_NOTE - form.notes_to_seeker.length} chars left)
                  </span>
                </label>
                <textarea
                  id="lt-note"
                  className="form-control"
                  rows={3}
                  maxLength={MAX_NOTE}
                  placeholder='e.g. "Looking for a Timbers fan who knows the game!"'
                  value={form.notes_to_seeker}
                  onChange={set('notes_to_seeker')}
                  style={{ resize: 'vertical' }}
                />
              </div>
            </div>
          )}
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={submitting}
          style={{ padding: '0.75rem' }}
          aria-label="Submit ticket listing"
        >
          {submitting ? 'Listing…' : 'List My Ticket'}
        </button>
      </form>
    </main>
  );
}

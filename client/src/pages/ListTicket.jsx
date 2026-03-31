import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SPORTS    = ['Baseball', 'Soccer', 'Basketball', 'Football', 'Hockey'];
const AGE_OPTS  = ['Any', '18-25', '26-35', '36-50', '50+'];
const FAN_OPTS  = ['Either', 'Casual', 'Die-Hard'];
const MAX_NOTE  = 200;

const EMPTY = {
  title: '', sport: '', date: '', time: '', venue: '', zip: '',
  preferred_age_range: 'Any', fan_level: 'Either', notes_to_seeker: '',
};

export default function ListTicket({ openAuth }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [prefsOpen, setPrefsOpen] = useState(false);

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

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
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
        Share your extra ticket and bring a fan along for the game — no cost to them.
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
        <div className="form-group">
          <label htmlFor="lt-title">Event Name</label>
          <input
            id="lt-title"
            className="form-control"
            type="text"
            value={form.title}
            onChange={set('title')}
            required
            placeholder="e.g. Trail Blazers vs Lakers"
          />
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
          {submitting ? 'Listing…' : '🎫 List My Ticket'}
        </button>
      </form>
    </main>
  );
}

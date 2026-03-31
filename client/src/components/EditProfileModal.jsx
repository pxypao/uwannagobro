import React, { useState, useEffect, useRef } from 'react';
import { API_BASE } from '../lib/api';

const ALL_SPORTS    = ['Baseball', 'Soccer', 'Basketball', 'Football', 'Hockey'];
const FAN_LEVELS    = ['', 'Casual', 'Die-Hard'];
const AGE_RANGES    = ['', 'Any', '18-25', '26-35', '36-50', '50+'];
const MAX_BIO       = 160;
const CURRENT_YEAR  = new Date().getFullYear();

export default function EditProfileModal({ onClose, onSaved }) {
  const [form, setForm] = useState({
    favorite_team: '',
    sports_interests: [],
    fan_since_year: '',
    bio: '',
    seeker_fan_level: '',
    seeker_age_range: '',
  });
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState(false);
  const firstRef = useRef(null);

  useEffect(() => {
    firstRef.current?.focus();
    fetch(`${API_BASE}/api/profile`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        if (d.profile) {
          setForm({
            favorite_team:    d.profile.favorite_team   || '',
            sports_interests: Array.isArray(d.profile.sports_interests)
              ? d.profile.sports_interests
              : [],
            fan_since_year:   d.profile.fan_since_year  ? String(d.profile.fan_since_year) : '',
            bio:              d.profile.bio             || '',
            seeker_fan_level: d.profile.seeker_fan_level || '',
            seeker_age_range: d.profile.seeker_age_range || '',
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  function toggleSport(sport) {
    setForm(f => ({
      ...f,
      sports_interests: f.sports_interests.includes(sport)
        ? f.sports_interests.filter(s => s !== sport)
        : [...f.sports_interests, sport],
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to save profile.'); return; }
      setSuccess(true);
      setTimeout(() => { onSaved?.(); onClose(); }, 800);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  const bioLeft = MAX_BIO - form.bio.length;

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Edit your profile"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal" style={{ maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto' }}>
        <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        <h2 className="modal-title">Edit Profile</h2>

        {loading ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>Loading…</p>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              {/* Favorite team */}
              <div className="form-group">
                <label htmlFor="ep-team">Favorite Team</label>
                <input
                  ref={firstRef}
                  id="ep-team"
                  className="form-control"
                  type="text"
                  maxLength={100}
                  placeholder="e.g. Portland Timbers"
                  value={form.favorite_team}
                  onChange={e => setForm(f => ({ ...f, favorite_team: e.target.value }))}
                />
              </div>

              {/* Sports I follow */}
              <fieldset style={{ border: 'none', padding: 0 }}>
                <legend style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                  Sports I Follow
                </legend>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {ALL_SPORTS.map(sport => {
                    const checked = form.sports_interests.includes(sport);
                    return (
                      <label
                        key={sport}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.35rem 0.85rem',
                          borderRadius: '999px',
                          border: `2px solid ${checked ? 'var(--green)' : 'var(--border)'}`,
                          background: checked ? 'var(--green)' : 'var(--white)',
                          color: checked ? 'var(--white)' : 'var(--text)',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          transition: 'all 0.15s',
                          userSelect: 'none',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleSport(sport)}
                          className="sr-only"
                          aria-label={sport}
                        />
                        {sport}
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              {/* Fan since */}
              <div className="form-group">
                <label htmlFor="ep-year">Fan Since <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
                <input
                  id="ep-year"
                  className="form-control"
                  type="number"
                  min={1900}
                  max={CURRENT_YEAR}
                  placeholder={`e.g. ${CURRENT_YEAR - 10}`}
                  value={form.fan_since_year}
                  onChange={e => setForm(f => ({ ...f, fan_since_year: e.target.value }))}
                />
              </div>

              {/* Bio */}
              <div className="form-group">
                <label htmlFor="ep-bio">
                  Bio <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span>
                </label>
                <textarea
                  id="ep-bio"
                  className="form-control"
                  rows={3}
                  maxLength={MAX_BIO}
                  placeholder="Tell seekers a little about yourself…"
                  value={form.bio}
                  onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                  style={{ resize: 'vertical' }}
                />
                <div
                  style={{
                    fontSize: '0.75rem',
                    textAlign: 'right',
                    color: bioLeft < 20 ? '#c0392b' : 'var(--text-muted)',
                    marginTop: '0.2rem',
                  }}
                  aria-live="polite"
                  aria-label={`${bioLeft} characters remaining`}
                >
                  {bioLeft} characters remaining
                </div>
              </div>

              {/* ── Seeker Profile ── */}
              <div style={{ borderTop: '2px solid var(--border)', paddingTop: '1rem', marginTop: '0.25rem' }}>
                <p style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.75rem', color: 'var(--green)' }}>
                  My Seeker Profile
                </p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                  Shown to listers in chat after you claim their ticket.
                </p>

                <div className="form-row" style={{ gap: '1rem' }}>
                  <div className="form-group">
                    <label htmlFor="ep-fan-level">My Fan Level</label>
                    <select
                      id="ep-fan-level"
                      className="form-control"
                      value={form.seeker_fan_level}
                      onChange={e => setForm(f => ({ ...f, seeker_fan_level: e.target.value }))}
                    >
                      <option value="">Select…</option>
                      <option value="Casual">Casual</option>
                      <option value="Die-Hard">Die-Hard</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="ep-age-range">My Age Range</label>
                    <select
                      id="ep-age-range"
                      className="form-control"
                      value={form.seeker_age_range}
                      onChange={e => setForm(f => ({ ...f, seeker_age_range: e.target.value }))}
                    >
                      <option value="">Select…</option>
                      <option value="18-25">18–25</option>
                      <option value="26-35">26–35</option>
                      <option value="36-50">36–50</option>
                      <option value="50+">50+</option>
                    </select>
                  </div>
                </div>
              </div>

              {error && (
                <div className="banner banner-warn" role="alert">{error}</div>
              )}
              {success && (
                <div className="banner banner-success" role="status">Profile saved! ✓</div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : 'Save Profile'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

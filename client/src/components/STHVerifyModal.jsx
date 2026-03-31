import React, { useState, useEffect, useRef } from 'react';

export default function STHVerifyModal({ user, onClose, onSubmitted }) {
  const [team, setTeam]       = useState('');
  const [file, setFile]       = useState(null);
  const [error, setError]     = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone]       = useState(false);
  const firstRef = useRef(null);

  // If already pending, jump straight to pending state
  useEffect(() => {
    if (user?.sth_verification_submitted && !user?.is_verified_sth) setDone(true);
  }, [user]);

  useEffect(() => {
    firstRef.current?.focus();
    const handler = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!team.trim())  { setError('Please enter your team name.'); return; }
    if (!file)         { setError('Please upload proof of your season tickets.'); return; }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('team',  team.trim());
      fd.append('proof', file);

      const res = await fetch('/api/sth/apply', {
        method: 'POST',
        credentials: 'include',
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Submission failed.'); return; }
      setDone(true);
      onSubmitted?.();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Verify Season Ticket Holder status"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal" style={{ maxWidth: '440px' }}>
        <button className="modal-close" onClick={onClose} aria-label="Close">×</button>

        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.4rem' }} aria-hidden="true">🎟️</div>
          <h2 className="modal-title" style={{ fontSize: '1.6rem', marginBottom: '0.3rem' }}>
            Verify Season Tickets
          </h2>
        </div>

        {done ? (
          /* ── Pending state ── */
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }} aria-hidden="true">🕐</div>
            <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Verification Pending</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>
              We've received your submission and will review it within <strong>24 hours</strong>.
              Your badge will appear automatically once approved.
            </p>
            <button
              className="btn btn-primary"
              onClick={onClose}
              style={{ marginTop: '1.5rem', minWidth: '120px' }}
            >
              Got It
            </button>
          </div>
        ) : (
          /* ── Submission form ── */
          <>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
              To get your <strong style={{ color: '#1e6bb8' }}>✓ Season Ticket Holder</strong> badge,
              tell us which team you hold season tickets for. Our team will review and approve within 24 hours.
            </p>

            <form onSubmit={handleSubmit} noValidate>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label htmlFor="sth-team">Team Name</label>
                  <input
                    ref={firstRef}
                    id="sth-team"
                    className="form-control"
                    type="text"
                    placeholder="e.g. Portland Timbers"
                    value={team}
                    onChange={e => setTeam(e.target.value)}
                    maxLength={100}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="sth-proof">
                    Upload Proof{' '}
                    <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>
                      (photo or PDF of ticket plan / confirmation)
                    </span>
                  </label>
                  <input
                    id="sth-proof"
                    type="file"
                    accept="image/*,.pdf"
                    className="form-control"
                    style={{ padding: '0.45rem 0.85rem', cursor: 'pointer' }}
                    onChange={e => setFile(e.target.files[0] || null)}
                    required
                  />
                  {file && (
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      Selected: {file.name}
                    </p>
                  )}
                </div>

                {error && (
                  <div className="banner banner-warn" role="alert">{error}</div>
                )}

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitting}
                    style={{ minWidth: '120px' }}
                  >
                    {submitting ? 'Submitting…' : 'Submit'}
                  </button>
                </div>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

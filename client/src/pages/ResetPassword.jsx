import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiFetch } from '../lib/api';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('token');
    if (!t) setError('No reset token found. Please request a new password reset link.');
    else setToken(t);
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (newPassword.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }

    setSubmitting(true);
    try {
      const res = await apiFetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Something went wrong.'); return; }
      setSuccess(true);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="container" id="main-content" style={{ maxWidth: 480, paddingTop: '4rem', paddingBottom: '4rem' }}>
      <div className="modal" style={{ position: 'static', boxShadow: 'var(--shadow)', borderRadius: 14, padding: '2rem' }}>
        <h1 className="modal-title" style={{ marginBottom: '0.5rem' }}>Reset Password</h1>

        {success ? (
          <div>
            <div className="banner banner-success" role="status" style={{ marginBottom: '1.5rem' }}>
              Password updated! You can now log in with your new password.
            </div>
            <Link to="/" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              Back to Home
            </Link>
          </div>
        ) : (
          <>
            {error && (
              <div className="banner banner-warn" role="alert" style={{ marginBottom: '1rem' }}>
                {error}
              </div>
            )}

            {token && (
              <form onSubmit={handleSubmit} noValidate>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="form-group">
                    <label htmlFor="rp-new-password">New Password</label>
                    <input
                      id="rp-new-password"
                      className="form-control"
                      type="password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      required
                      minLength={8}
                      placeholder="At least 8 characters"
                      autoComplete="new-password"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="rp-confirm-password">Confirm Password</label>
                    <input
                      id="rp-confirm-password"
                      className="form-control"
                      type="password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      required
                      placeholder="Repeat your new password"
                      autoComplete="new-password"
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitting}
                    style={{ padding: '0.7rem' }}
                  >
                    {submitting ? 'Updating…' : 'Update Password'}
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </main>
  );
}

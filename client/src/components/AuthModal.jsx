import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

function calcAge(dob) {
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

export default function AuthModal({ mode, onClose, switchMode }) {
  const { login } = useAuth();
  const [form, setForm] = useState({
    first_name: '', email: '', phone: '', password: '', date_of_birth: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const firstRef = useRef(null);

  useEffect(() => {
    firstRef.current?.focus();
    setError('');
  }, [mode]);

  // Trap focus inside modal
  useEffect(() => {
    function handler(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  function set(k) {
    return (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (mode === 'signup') {
      if (!form.date_of_birth) { setError('Date of birth is required.'); return; }
      if (calcAge(form.date_of_birth) < 18) {
        setError('You must be 18 or older to create an account.');
        return;
      }
    }

    setLoading(true);
    try {
      const endpoint = mode === 'signup' ? '/api/auth/signup' : '/api/auth/login';
      const body = mode === 'signup' ? form : { email: form.email, password: form.password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Something went wrong.'); return; }
      login(data.user);
      onClose();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const isSignup = mode === 'signup';

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={isSignup ? 'Sign up' : 'Log in'}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal">
        <button className="modal-close" onClick={onClose} aria-label="Close modal">×</button>
        <h2 className="modal-title">{isSignup ? 'Join the Crew' : 'Welcome Back'}</h2>

        {error && (
          <div className="banner banner-warn" role="alert" style={{ marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {isSignup && (
              <div className="form-group">
                <label htmlFor="auth-first-name">First Name</label>
                <input
                  ref={firstRef}
                  id="auth-first-name"
                  className="form-control"
                  type="text"
                  value={form.first_name}
                  onChange={set('first_name')}
                  autoComplete="given-name"
                  required
                  placeholder="Your first name"
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="auth-email">Email</label>
              <input
                ref={isSignup ? undefined : firstRef}
                id="auth-email"
                className="form-control"
                type="email"
                value={form.email}
                onChange={set('email')}
                autoComplete="email"
                required
                placeholder="you@example.com"
              />
            </div>

            {isSignup && (
              <>
                <div className="form-group">
                  <label htmlFor="auth-phone">Phone Number</label>
                  <input
                    id="auth-phone"
                    className="form-control"
                    type="tel"
                    value={form.phone}
                    onChange={set('phone')}
                    autoComplete="tel"
                    required
                    placeholder="503-555-0100"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="auth-dob">Date of Birth <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(must be 18+)</span></label>
                  <input
                    id="auth-dob"
                    className="form-control"
                    type="date"
                    value={form.date_of_birth}
                    onChange={set('date_of_birth')}
                    required
                    max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                  />
                </div>
              </>
            )}

            <div className="form-group">
              <label htmlFor="auth-password">Password</label>
              <input
                id="auth-password"
                className="form-control"
                type="password"
                value={form.password}
                onChange={set('password')}
                autoComplete={isSignup ? 'new-password' : 'current-password'}
                required
                placeholder={isSignup ? 'At least 8 characters' : '••••••••'}
                minLength={isSignup ? 8 : undefined}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ marginTop: '0.25rem', padding: '0.7rem' }}
            >
              {loading ? 'Please wait…' : isSignup ? 'Create Account' : 'Log In'}
            </button>
          </div>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          {isSignup ? 'Already have an account? ' : "Don't have an account? "}
          <button
            style={{ background: 'none', border: 'none', color: 'var(--green)', fontWeight: 700, cursor: 'pointer', fontSize: 'inherit' }}
            onClick={() => switchMode(isSignup ? 'login' : 'signup')}
          >
            {isSignup ? 'Log in' : 'Sign up'}
          </button>
        </p>
      </div>
    </div>
  );
}

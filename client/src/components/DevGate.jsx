import React, { useState, useEffect, useRef } from 'react';

// ─── TO REMOVE: delete this import from App.jsx and remove <DevGate> wrapper ───
const GATE_ENABLED = true;
const PASSWORD = 'RALLYBROJADENDAD';
const STORAGE_KEY = 'rb_dev_unlocked';

export default function DevGate({ children }) {
  const [unlocked, setUnlocked] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [input, setInput] = useState('');
  const [shake, setShake] = useState(false);
  const [wrong, setWrong] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!GATE_ENABLED || sessionStorage.getItem(STORAGE_KEY) === '1') {
      setUnlocked(true);
    }
  }, []);

  useEffect(() => {
    if (!unlocked) setTimeout(() => inputRef.current?.focus(), 100);
  }, [unlocked]);

  function handleSubmit(e) {
    e.preventDefault();
    if (input.trim().toUpperCase() === PASSWORD) {
      sessionStorage.setItem(STORAGE_KEY, '1');
      setExiting(true);
      setTimeout(() => setUnlocked(true), 750);
    } else {
      setWrong(true);
      setShake(true);
      setInput('');
      setTimeout(() => setShake(false), 600);
      setTimeout(() => setWrong(false), 1800);
    }
  }

  if (unlocked) return children;

  return (
    <>
      {children}
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: exiting ? 'gateSlideUp 0.75s cubic-bezier(0.77,0,0.18,1) forwards' : 'none',
      }}>

        {/* ── Subtle dark tint — gaps are see-through ── */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.45)',
          pointerEvents: 'none',
        }} />

        {/* ── Cage SVG overlay — gaps are transparent ── */}
        <svg
          aria-hidden="true"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
        >
          <defs>
            <linearGradient id="metalV" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="#6e6e6e" />
              <stop offset="20%"  stopColor="#d4d4d4" />
              <stop offset="45%"  stopColor="#f0f0f0" />
              <stop offset="60%"  stopColor="#c8c8c8" />
              <stop offset="80%"  stopColor="#8a8a8a" />
              <stop offset="100%" stopColor="#b0b0b0" />
            </linearGradient>
            <linearGradient id="metalD" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%"   stopColor="#5a5a5a" />
              <stop offset="25%"  stopColor="#c8c8c8" />
              <stop offset="50%"  stopColor="#efefef" />
              <stop offset="75%"  stopColor="#aaaaaa" />
              <stop offset="100%" stopColor="#888888" />
            </linearGradient>
            <filter id="barShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="1" dy="1" stdDeviation="1.5" floodColor="rgba(0,0,0,0.7)" />
            </filter>
            <pattern id="cageDiamond" x="0" y="0" width="64" height="64" patternUnits="userSpaceOnUse">
              <path
                d="M 32 2 L 62 32 L 32 62 L 2 32 Z"
                fill="none"
                stroke="url(#metalD)"
                strokeWidth="7"
                strokeLinejoin="round"
                filter="url(#barShadow)"
              />
              <path d="M 32 2 L 2 32"  fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2"   strokeLinecap="round" />
              <path d="M 32 2 L 62 32" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="32" cy="2"  r="4" fill="url(#metalV)" filter="url(#barShadow)" />
              <circle cx="62" cy="32" r="4" fill="url(#metalV)" filter="url(#barShadow)" />
              <circle cx="32" cy="62" r="4" fill="url(#metalV)" filter="url(#barShadow)" />
              <circle cx="2"  cy="32" r="4" fill="url(#metalV)" filter="url(#barShadow)" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#cageDiamond)" />
        </svg>

        {/* ── Password form — RallyBro themed ── */}
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            background: 'var(--white)',
            border: '2px solid var(--green-dark)',
            borderRadius: '14px',
            padding: '2.25rem 2rem',
            width: '100%',
            maxWidth: '340px',
            boxShadow: '0 12px 48px rgba(0,0,0,0.55)',
            textAlign: 'center',
            animation: shake ? 'gateShake 0.55s ease' : 'none',
          }}
        >
          {/* RallyBro logo */}
          <div style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '2.4rem',
            letterSpacing: '0.06em',
            color: 'var(--green)',
            marginBottom: '0.1rem',
            lineHeight: 1,
          }}>
            Rally<span style={{ color: 'var(--gold)' }}>Bro</span>
          </div>

          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: '1.75rem',
            marginTop: '0.25rem',
          }}>
            Private Preview
          </p>

          <form onSubmit={handleSubmit} noValidate>
            <input
              ref={inputRef}
              type="password"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Password"
              autoComplete="off"
              aria-label="Enter password"
              style={{
                width: '100%',
                padding: '0.7rem 1rem',
                background: wrong ? '#fff5f5' : 'var(--bg)',
                border: `2px solid ${wrong ? '#c0392b' : 'var(--border)'}`,
                borderRadius: 'var(--radius)',
                color: 'var(--text)',
                fontSize: '1rem',
                fontFamily: 'var(--font-body)',
                letterSpacing: '0.15em',
                textAlign: 'center',
                outline: 'none',
                marginBottom: '0.85rem',
                transition: 'border-color 0.2s, background 0.2s',
              }}
              onFocus={e => { if (!wrong) e.target.style.borderColor = 'var(--green)'; }}
              onBlur={e => { if (!wrong) e.target.style.borderColor = 'var(--border)'; }}
            />
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.75rem', fontSize: '0.9rem' }}
            >
              Enter
            </button>
          </form>
        </div>

        <style>{`
          @keyframes gateShake {
            0%   { transform: translateX(0); }
            15%  { transform: translateX(-10px); }
            30%  { transform: translateX(10px); }
            45%  { transform: translateX(-8px); }
            60%  { transform: translateX(8px); }
            75%  { transform: translateX(-4px); }
            90%  { transform: translateX(4px); }
            100% { transform: translateX(0); }
          }
          @keyframes gateSlideUp {
            0%   { transform: translateY(0);      opacity: 1; }
            100% { transform: translateY(-100vh); opacity: 0; }
          }
        `}</style>
      </div>
    </>
  );
}

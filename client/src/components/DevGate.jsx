import React, { useState, useEffect, useRef } from 'react';

// ─── TO REMOVE: delete this import from App.jsx and remove <DevGate> wrapper ───
const GATE_ENABLED = true;
const PASSWORD = 'RALLYBROJADENDAD';
const STORAGE_KEY = 'rb_dev_unlocked';

export default function DevGate({ children }) {
  const [unlocked, setUnlocked] = useState(false);
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
      setUnlocked(true);
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
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 99999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(10, 10, 10, 0.82)',
      backdropFilter: 'blur(1px)',
    }}>

      {/* ── Cage SVG overlay ── */}
      <svg
        aria-hidden="true"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      >
        <defs>
          {/* Metallic silver gradient for vertical bars */}
          <linearGradient id="metalV" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#6e6e6e" />
            <stop offset="20%"  stopColor="#d4d4d4" />
            <stop offset="45%"  stopColor="#f0f0f0" />
            <stop offset="60%"  stopColor="#c8c8c8" />
            <stop offset="80%"  stopColor="#8a8a8a" />
            <stop offset="100%" stopColor="#b0b0b0" />
          </linearGradient>

          {/* Metallic silver gradient for diagonal bars */}
          <linearGradient id="metalD" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#5a5a5a" />
            <stop offset="25%"  stopColor="#c8c8c8" />
            <stop offset="50%"  stopColor="#efefef" />
            <stop offset="75%"  stopColor="#aaaaaa" />
            <stop offset="100%" stopColor="#888888" />
          </linearGradient>

          {/* Drop shadow filter for depth */}
          <filter id="barShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="1" dy="1" stdDeviation="1.5" floodColor="rgba(0,0,0,0.7)" />
          </filter>

          {/* Single diamond cell */}
          <pattern id="cageDiamond" x="0" y="0" width="64" height="64" patternUnits="userSpaceOnUse">
            {/* Diamond outline — thick metallic bars */}
            <path
              d="M 32 2 L 62 32 L 32 62 L 2 32 Z"
              fill="none"
              stroke="url(#metalD)"
              strokeWidth="7"
              strokeLinejoin="round"
              filter="url(#barShadow)"
            />
            {/* Inner highlight line on top-left edges */}
            <path
              d="M 32 2 L 2 32"
              fill="none"
              stroke="rgba(255,255,255,0.25)"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M 32 2 L 62 32"
              fill="none"
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            {/* Rivet/node at intersections */}
            <circle cx="32" cy="2"  r="4" fill="url(#metalV)" filter="url(#barShadow)" />
            <circle cx="62" cy="32" r="4" fill="url(#metalV)" filter="url(#barShadow)" />
            <circle cx="32" cy="62" r="4" fill="url(#metalV)" filter="url(#barShadow)" />
            <circle cx="2"  cy="32" r="4" fill="url(#metalV)" filter="url(#barShadow)" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#cageDiamond)" />
      </svg>

      {/* ── Lock plate / password form ── */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          background: 'linear-gradient(160deg, #2a2a2a 0%, #1a1a1a 50%, #222 100%)',
          border: '3px solid #555',
          borderRadius: '6px',
          padding: '2.5rem 2.25rem',
          width: '100%',
          maxWidth: '340px',
          boxShadow: '0 0 0 1px #333, 0 8px 40px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.07)',
          textAlign: 'center',
          animation: shake ? 'gateShake 0.55s ease' : 'none',
        }}
      >
        {/* Bolt decorations */}
        {[['8px','8px'],['calc(100% - 8px)','8px'],['8px','calc(100% - 8px)'],['calc(100% - 8px)','calc(100% - 8px)']].map(([l, t], i) => (
          <div key={i} style={{
            position: 'absolute',
            left: l, top: t,
            width: 10, height: 10,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 35%, #ccc, #555)',
            transform: 'translate(-50%, -50%)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.8)',
          }} />
        ))}

        {/* Lock icon */}
        <div style={{ marginBottom: '1.25rem' }}>
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true" style={{ margin: '0 auto' }}>
            <rect x="7" y="18" width="26" height="18" rx="3" fill="#444" stroke="#777" strokeWidth="1.5" />
            <path d="M 13 18 V 13 a 7 7 0 0 1 14 0 V 18" fill="none" stroke="#777" strokeWidth="3" strokeLinecap="round" />
            <circle cx="20" cy="27" r="3" fill="#888" />
            <rect x="18.5" y="27" width="3" height="5" rx="1" fill="#777" />
          </svg>
        </div>

        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '0.78rem',
          color: '#888',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          marginBottom: '1.5rem',
        }}>
          Private Access Only
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
              background: wrong ? 'rgba(180,30,30,0.15)' : 'rgba(255,255,255,0.05)',
              border: `1.5px solid ${wrong ? '#c0392b' : '#555'}`,
              borderRadius: '4px',
              color: '#e0e0e0',
              fontSize: '1rem',
              fontFamily: 'monospace',
              letterSpacing: '0.2em',
              textAlign: 'center',
              outline: 'none',
              marginBottom: '1rem',
              transition: 'border-color 0.2s, background 0.2s',
            }}
          />
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '0.65rem',
              background: 'linear-gradient(180deg, #555 0%, #3a3a3a 100%)',
              border: '1px solid #666',
              borderRadius: '4px',
              color: '#d0d0d0',
              fontSize: '0.82rem',
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'linear-gradient(180deg, #666 0%, #444 100%)'}
            onMouseLeave={e => e.currentTarget.style.background = 'linear-gradient(180deg, #555 0%, #3a3a3a 100%)'}
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
      `}</style>
    </div>
  );
}

import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import STHBadge from './STHBadge';
import EditProfileModal from './EditProfileModal';
import STHVerifyModal from './STHVerifyModal';

function initials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

export default function Nav({ openAuth }) {
  const { user, logout, refetch } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [dropOpen, setDropOpen] = useState(false);
  const [editProfile, setEditProfile] = useState(false);
  const [sthModal, setSthModal] = useState(false);
  const dropRef = useRef(null);
  const isHome = location.pathname === '/';

  // Close dropdown when clicking outside
  useEffect(() => {
    function handler(e) {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <nav className="nav" aria-label="Main navigation">
      <div className="nav-inner">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {!isHome && (
            <button
              className="nav-back-btn"
              onClick={() => navigate(-1)}
              aria-label="Go back"
            >
              ←
            </button>
          )}
          <Link to="/" className="nav-logo" aria-label="RallyBro home">
            Rally<span>Bro</span>
          </Link>
        </div>

        {/* Desktop-only nav links */}
        <div className="nav-desktop-links" aria-label="Site links">
          <Link to="/how-it-works" className="nav-text-link">How It Works</Link>
          <Link to="/our-story" className="nav-text-link">Our Story</Link>
        </div>

        <div className="nav-right">
          {user ? (
            <>
              <Link to="/my-tickets" className="my-tickets-pill btn">
                My Tickets
              </Link>
              <div className="profile-wrap" ref={dropRef}>
                <button
                  className="avatar avatar-lg"
                  onClick={() => setDropOpen(o => !o)}
                  aria-haspopup="true"
                  aria-expanded={dropOpen}
                  aria-label={`Profile menu for ${user.first_name}`}
                  style={{ border: '2px solid var(--gold-dark)', cursor: 'pointer' }}
                >
                  {initials(user.first_name)}
                </button>
                {dropOpen && (
                  <div
                    className="profile-dropdown"
                    role="menu"
                    aria-label="Profile options"
                  >
                    <div className="profile-dropdown-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span className="profile-dropdown-name">{user.first_name}</span>
                      </div>
                      {user.is_verified_sth ? (
                        <div style={{ marginTop: '0.3rem' }}>
                          <STHBadge team={user.sth_team} size="sm" />
                        </div>
                      ) : null}
                      <div className="profile-dropdown-email" style={{ marginTop: '0.2rem' }}>{user.email}</div>
                    </div>
                    <button
                      className="profile-dropdown-btn"
                      role="menuitem"
                      style={{ color: 'var(--green)' }}
                      onClick={() => { setDropOpen(false); setEditProfile(true); }}
                    >
                      Edit Profile
                    </button>
                    {!user.is_verified_sth && (
                      <button
                        className="profile-dropdown-btn"
                        role="menuitem"
                        style={{ color: '#1e6bb8' }}
                        onClick={() => { setDropOpen(false); setSthModal(true); }}
                      >
                        {user.sth_verification_submitted ? '🕐 Verification Pending' : '✓ Verify Season Tickets'}
                      </button>
                    )}
                    <button
                      className="profile-dropdown-btn"
                      role="menuitem"
                      onClick={() => { setDropOpen(false); logout(); navigate('/'); }}
                    >
                      Log Out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <button className="btn btn-ghost btn-sm" onClick={() => openAuth('login')}>
                Log In
              </button>
              <button className="btn btn-gold btn-sm" onClick={() => openAuth('signup')}>
                Sign Up
              </button>
            </>
          )}
        </div>
      </div>
      {editProfile && (
        <EditProfileModal
          onClose={() => setEditProfile(false)}
          onSaved={() => refetch()}
        />
      )}
      {sthModal && (
        <STHVerifyModal
          user={user}
          onClose={() => setSthModal(false)}
          onSubmitted={() => refetch()}
        />
      )}
    </nav>
  );
}

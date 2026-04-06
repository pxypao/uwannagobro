import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/api';

function BrowseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
      <line x1="12" y1="12" x2="12" y2="16"/>
      <line x1="10" y1="14" x2="14" y2="14"/>
    </svg>
  );
}

function ListIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="16"/>
      <line x1="8" y1="12" x2="16" y2="12"/>
    </svg>
  );
}

function MessagesIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  );
}

export default function BottomNav() {
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) { setUnread(0); return; }
    let active = true;

    async function poll() {
      try {
        const res = await apiFetch(`/api/messages/unread/count`);
        if (res.ok) {
          const data = await res.json();
          if (active) setUnread(data.count);
        }
      } catch {}
    }

    poll();
    const id = setInterval(poll, 5000);
    return () => { active = false; clearInterval(id); };
  }, [user]);

  return (
    <nav className="bottom-nav" aria-label="Bottom navigation">
      <NavLink
        to="/"
        end
        className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}
        aria-label="Browse tickets"
      >
        <BrowseIcon />
        <span>Browse</span>
      </NavLink>

      <NavLink
        to="/list"
        className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}
        aria-label="List a ticket"
      >
        <ListIcon />
        <span>List Ticket</span>
      </NavLink>

      <NavLink
        to="/messages"
        className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}
        aria-label={`Messages${unread > 0 ? `, ${unread} unread` : ''}`}
      >
        {unread > 0 && <span className="bottom-nav-dot" aria-hidden="true" />}
        <MessagesIcon />
        <span>Messages</span>
      </NavLink>
    </nav>
  );
}

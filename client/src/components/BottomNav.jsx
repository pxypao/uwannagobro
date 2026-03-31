import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function BottomNav() {
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) { setUnread(0); return; }
    let active = true;

    async function poll() {
      try {
        const res = await fetch('/api/messages/unread/count', { credentials: 'include' });
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
        <span className="bottom-nav-icon" aria-hidden="true">🏟️</span>
        <span>Browse</span>
      </NavLink>

      <NavLink
        to="/list"
        className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}
        aria-label="List a ticket"
      >
        <span className="bottom-nav-icon" aria-hidden="true">＋</span>
        <span>List Ticket</span>
      </NavLink>

      <NavLink
        to="/messages"
        className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}
        aria-label={`Messages${unread > 0 ? `, ${unread} unread` : ''}`}
      >
        <span className="bottom-nav-icon" aria-hidden="true">💬</span>
        {unread > 0 && <span className="bottom-nav-dot" aria-hidden="true" />}
        <span>Messages</span>
      </NavLink>
    </nav>
  );
}

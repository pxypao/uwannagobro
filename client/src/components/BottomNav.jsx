import React, { useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
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

function MyTicketsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/>
    </svg>
  );
}

export default function BottomNav() {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const prevUnreadRef = useRef(null);

  // Keep polling for message notifications even without a Messages tab
  useEffect(() => {
    if (!user) { prevUnreadRef.current = null; return; }
    let active = true;

    async function poll() {
      try {
        const res = await apiFetch(`/api/messages/unread/detail`);
        if (res.ok) {
          const data = await res.json();
          const count = data.count;
          if (active && prevUnreadRef.current !== null && count > prevUnreadRef.current) {
            addNotification({
              type: 'message',
              title: 'New Message',
              message: data.ticket_title
                ? `New message about ${data.ticket_title}`
                : `You have ${count} unread message${count !== 1 ? 's' : ''}`,
            });
          }
          if (active) prevUnreadRef.current = count;
        }
      } catch {}
    }

    poll();
    const id = setInterval(poll, 5000);
    return () => { active = false; clearInterval(id); };
  }, [user, addNotification]);

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
        to="/my-tickets"
        className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}
        aria-label="My tickets"
      >
        <MyTicketsIcon />
        <span>My Tickets</span>
      </NavLink>
    </nav>
  );
}

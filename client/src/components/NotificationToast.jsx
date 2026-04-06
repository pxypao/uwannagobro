import React, { useEffect, useState } from 'react';
import { useNotifications } from '../context/NotificationContext';

function MessageIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  );
}

function TicketIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/>
    </svg>
  );
}

function CancelIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/>
      <line x1="15" y1="9" x2="9" y2="15"/>
      <line x1="9" y1="9" x2="15" y2="15"/>
    </svg>
  );
}

const TYPE_CONFIG = {
  message:  { icon: <MessageIcon />, accent: 'var(--green)',   bg: 'var(--green-subtle)' },
  claimed:  { icon: <TicketIcon />,  accent: 'var(--gold)',    bg: 'var(--gold-light)'   },
  canceled: { icon: <CancelIcon />,  accent: '#dc2626',        bg: '#fef2f2'             },
};

function Toast({ id, type, title, message }) {
  const { removeNotification } = useNotifications();
  const [exiting, setExiting] = useState(false);
  const config = TYPE_CONFIG[type] || TYPE_CONFIG.message;

  function dismiss() {
    setExiting(true);
    setTimeout(() => removeNotification(id), 250);
  }

  // Start exit animation just before auto-dismiss fires
  useEffect(() => {
    const t = setTimeout(() => setExiting(true), 4200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className={`toast${exiting ? ' toast-exit' : ''}`}
      role="alert"
      aria-live="polite"
      style={{ '--toast-accent': config.accent, '--toast-bg': config.bg }}
    >
      <span className="toast-icon" style={{ color: config.accent }}>
        {config.icon}
      </span>
      <div className="toast-body">
        <div className="toast-title">{title}</div>
        {message && <div className="toast-message">{message}</div>}
      </div>
      <button
        className="toast-close"
        onClick={dismiss}
        aria-label="Dismiss notification"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  );
}

export default function NotificationToast() {
  const { notifications } = useNotifications();

  return (
    <div className="toast-stack" aria-label="Notifications" aria-live="polite">
      {notifications.map(n => (
        <Toast key={n.id} {...n} />
      ))}
    </div>
  );
}

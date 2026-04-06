import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Analytics } from '@vercel/analytics/react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider, useNotifications } from './context/NotificationContext';
import Nav from './components/Nav';
import BottomNav from './components/BottomNav';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import NotificationToast from './components/NotificationToast';
import DevGate from './components/DevGate';
import Home from './pages/Home';
import ListTicket from './pages/ListTicket';
import Messages from './pages/Messages';
import MyTickets from './pages/MyTickets';
import HowItWorks from './pages/HowItWorks';
import OurStory from './pages/OurStory';
import Terms from './pages/Terms';
import FAQ from './pages/FAQ';
import ResetPassword from './pages/ResetPassword';

// Polls ticket + claim statuses and fires notifications on changes
function TicketEventPoller() {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const prevTicketsRef = useRef(null); // map of id → status
  const prevClaimRef   = useRef(undefined); // undefined = not yet loaded

  useEffect(() => {
    if (!user) {
      prevTicketsRef.current = null;
      prevClaimRef.current   = undefined;
      return;
    }

    async function poll() {
      try {
        const [tRes, cRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/my/tickets`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          }),
          fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/my/claim`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          }),
        ]);

        // ── Ticket listings: detect claimed + re-opened (canceled by seeker) ──
        if (tRes.ok) {
          const { tickets } = await tRes.json();
          const prev = prevTicketsRef.current;
          const next = {};
          tickets.forEach(t => { next[t.id] = { status: t.status, seeker: t.seeker_name }; });

          if (prev !== null) {
            tickets.forEach(t => {
              const p = prev[t.id];
              if (!p) return;
              // open → claimed: someone accepted your listing
              if (p.status === 'open' && t.status === 'claimed') {
                addNotification({
                  type: 'claimed',
                  title: 'Ticket Claimed!',
                  message: `${t.seeker_name || 'Someone'} accepted your listing for ${t.title}`,
                });
              }
              // claimed → open: seeker canceled the meet
              if (p.status === 'claimed' && t.status === 'open') {
                addNotification({
                  type: 'canceled',
                  title: 'Meet Canceled',
                  message: `The meet for ${t.title} was canceled`,
                });
              }
            });
          }
          prevTicketsRef.current = next;
        }

        // ── Active claim: detect when lister cancels on the seeker ──
        if (cRes.ok) {
          const { claim } = await cRes.json();
          const prev = prevClaimRef.current;

          // Had a claim before, now it's gone → lister canceled
          if (prev !== undefined && prev !== null && claim === null) {
            addNotification({
              type: 'canceled',
              title: 'Listing Canceled',
              message: `Your meet for "${prev.title}" was canceled by the lister`,
            });
          }

          if (prev !== undefined) { // skip on first load
            prevClaimRef.current = claim;
          } else {
            prevClaimRef.current = claim; // initialise silently
          }
        }
      } catch {
        // network error — silently skip
      }
    }

    poll();
    const id = setInterval(poll, 8000);
    return () => clearInterval(id);
  }, [user, addNotification]);

  return null;
}

function AppInner() {
  const [authModal, setAuthModal] = useState(null);
  const location = useLocation();
  const isMessages = location.pathname === '/messages';

  return (
    <>
      <TicketEventPoller />
      <Nav openAuth={setAuthModal} />
      {isMessages ? (
        // Messages is a full-screen chat — no page-wrapper, no footer
        <div style={{ paddingTop: 'var(--nav-h)' }}>
          <Messages />
        </div>
      ) : (
        <div className="page-wrapper">
          <Routes>
            <Route path="/"                element={<Home openAuth={setAuthModal} />} />
            <Route path="/list"            element={<ListTicket openAuth={setAuthModal} />} />
            <Route path="/my-tickets"      element={<MyTickets />} />
            <Route path="/how-it-works"    element={<HowItWorks openAuth={setAuthModal} />} />
            <Route path="/our-story"       element={<OurStory openAuth={setAuthModal} />} />
            <Route path="/terms"           element={<Terms />} />
            <Route path="/faq"             element={<FAQ />} />
            <Route path="/reset-password"  element={<ResetPassword />} />
          </Routes>
          <Footer />
        </div>
      )}
      <BottomNav />
      <NotificationToast />
      {authModal && (
        <AuthModal
          mode={authModal}
          onClose={() => setAuthModal(null)}
          switchMode={(m) => setAuthModal(m)}
        />
      )}
    </>
  );
}

export default function App() {
  return (
    <HelmetProvider>
      <DevGate>
        <NotificationProvider>
          <AuthProvider>
            <AppInner />
          </AuthProvider>
        </NotificationProvider>
      </DevGate>
      <Analytics />
    </HelmetProvider>
  );
}

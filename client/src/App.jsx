import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Analytics } from '@vercel/analytics/react';
import { AuthProvider } from './context/AuthContext';
import Nav from './components/Nav';
import BottomNav from './components/BottomNav';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
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

function getInitialTheme() {
  try {
    const saved = localStorage.getItem('rb-theme');
    if (saved === 'dark' || saved === 'light') return saved;
  } catch {}
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export default function App() {
  const [authModal, setAuthModal] = useState(null); // null | 'login' | 'signup'
  const [theme, setTheme] = useState(getInitialTheme);
  const location = useLocation();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('rb-theme', theme); } catch {}
  }, [theme]);

  function toggleTheme() {
    setTheme(t => t === 'dark' ? 'light' : 'dark');
  }

  return (
    <HelmetProvider>
    <DevGate>
    <AuthProvider>
      <Nav openAuth={setAuthModal} theme={theme} toggleTheme={toggleTheme} />
      <div className="page-wrapper">
        <Routes>
          <Route path="/"                element={<Home openAuth={setAuthModal} />} />
          <Route path="/list"            element={<ListTicket openAuth={setAuthModal} />} />
          <Route path="/messages"        element={<Messages />} />
          <Route path="/my-tickets"      element={<MyTickets />} />
          <Route path="/how-it-works"    element={<HowItWorks openAuth={setAuthModal} />} />
          <Route path="/our-story"       element={<OurStory openAuth={setAuthModal} />} />
          <Route path="/terms"           element={<Terms />} />
          <Route path="/faq"             element={<FAQ />} />
          <Route path="/reset-password"  element={<ResetPassword />} />
        </Routes>
        <Footer />
      </div>
      <BottomNav />
      {authModal && (
        <AuthModal
          mode={authModal}
          onClose={() => setAuthModal(null)}
          switchMode={(m) => setAuthModal(m)}
        />
      )}
    </AuthProvider>
    </DevGate>
    <Analytics />
    </HelmetProvider>
  );
}

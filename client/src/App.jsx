import React, { useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Nav from './components/Nav';
import BottomNav from './components/BottomNav';
import AuthModal from './components/AuthModal';
import Home from './pages/Home';
import ListTicket from './pages/ListTicket';
import Messages from './pages/Messages';
import MyTickets from './pages/MyTickets';

export default function App() {
  const [authModal, setAuthModal] = useState(null); // null | 'login' | 'signup'
  const location = useLocation();

  return (
    <AuthProvider>
      <Nav openAuth={setAuthModal} />
      <div className="page-wrapper">
        <Routes>
          <Route path="/"           element={<Home openAuth={setAuthModal} />} />
          <Route path="/list"       element={<ListTicket openAuth={setAuthModal} />} />
          <Route path="/messages"   element={<Messages />} />
          <Route path="/my-tickets" element={<MyTickets />} />
        </Routes>
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
  );
}

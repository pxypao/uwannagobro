import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/api';

function initials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatDeadline(s) {
  if (!s) return '';
  const d = new Date(s.includes('T') ? s : s.replace(' ', 'T'));
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function timeRemaining(s) {
  if (!s) return '';
  const ms = new Date(s.includes('T') ? s : s.replace(' ', 'T')) - Date.now();
  if (ms <= 0) return 'expired';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function Messages() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [claim, setClaim] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState('');
  const [transferStatus, setTransferStatus] = useState(null);
  const [toast, setToast] = useState('');
  const [confirmingTransfer, setConfirmingTransfer] = useState(false);
  const threadRef = useRef(null);
  const manualCancelledRef = useRef(false);
  const wasActiveRef = useRef(false);

  const [claimId, setClaimId] = useState(null);
  const [otherName, setOtherName] = useState('');
  const [eventTitle, setEventTitle] = useState('');
  const [iAmLister, setIAmLister] = useState(false);
  const [seekerInfo, setSeekerInfo] = useState(null);

  useEffect(() => {
    if (!loading && !user) navigate('/');
  }, [loading, user, navigate]);

  const fetchClaim = useCallback(async () => {
    if (!user) return;
    try {
      // Try seeker side first
      const seekerRes = await apiFetch(`/api/my/claim`);
      if (seekerRes.ok) {
        const data = await seekerRes.json();
        if (data.claim) {
          setClaim(data.claim);
          const id = data.claim.id;
          setClaimId(id);
          setIAmLister(false);
          // Fetch authoritative claim details to guarantee correct event title
          const detailRes = await apiFetch(`/api/claims/${id}`);
          if (detailRes.ok) {
            const detail = await detailRes.json();
            setOtherName(detail.claim.lister_name);
            setEventTitle(detail.claim.title);
          } else {
            setOtherName(data.claim.lister_name);
            setEventTitle(data.claim.title);
          }
          return;
        }
      }

      // Try lister side — find the most recently claimed active ticket
      const myRes = await apiFetch(`/api/my/tickets`);
      if (myRes.ok) {
        const data = await myRes.json();
        const claimedTickets = data.tickets.filter(t => t.status === 'claimed' && t.claim_id);
        const claimed = claimedTickets[0]; // most recent first from server
        if (claimed) {
          setClaim(claimed);
          const id = claimed.claim_id;
          setClaimId(id);
          setIAmLister(true);
          if (claimed.seeker_fan_level || claimed.seeker_age_range) {
            setSeekerInfo({ fan_level: claimed.seeker_fan_level, age_range: claimed.seeker_age_range });
          }
          // Fetch authoritative claim details to guarantee correct event title
          const detailRes = await apiFetch(`/api/claims/${id}`);
          if (detailRes.ok) {
            const detail = await detailRes.json();
            setOtherName(detail.claim.seeker_name || 'Fan');
            setEventTitle(detail.claim.title);
          } else {
            setOtherName(claimed.seeker_name || 'Fan');
            setEventTitle(claimed.title);
          }
          return;
        }
      }

      setClaim(null);
      setClaimId(null);
    } catch {}
  }, [user]);

  useEffect(() => { fetchClaim(); }, [fetchClaim]);

  const fetchMessages = useCallback(async () => {
    if (!claimId) return;
    try {
      const res = await apiFetch(`/api/messages/${claimId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages);
      }
    } catch {}
  }, [claimId]);

  useEffect(() => {
    fetchMessages();
    const id = setInterval(fetchMessages, 5000);
    return () => clearInterval(id);
  }, [fetchMessages]);

  const fetchTransferStatus = useCallback(async () => {
    if (!claimId) return;
    try {
      const res = await apiFetch(`/api/claims/${claimId}/transfer-status`);
      if (res.ok) {
        const data = await res.json();
        setTransferStatus(data);
      }
    } catch {}
  }, [claimId]);

  useEffect(() => {
    fetchTransferStatus();
    const id = setInterval(fetchTransferStatus, 30000);
    return () => clearInterval(id);
  }, [fetchTransferStatus]);

  // Detect auto-cancellation and redirect to home
  useEffect(() => {
    if (!transferStatus) return;
    if (transferStatus.claim_status === 'active') {
      wasActiveRef.current = true;
    } else if (transferStatus.claim_status === 'cancelled' && wasActiveRef.current && !manualCancelledRef.current) {
      setToast('This meet was cancelled automatically. The ticket has been re-listed.');
      setTimeout(() => navigate('/'), 3000);
    }
  }, [transferStatus?.claim_status, navigate]);

  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [messages]);

  async function sendMessage(e) {
    e.preventDefault();
    if (!input.trim() || !claimId) return;
    setSending(true);
    try {
      const res = await apiFetch(`/api/messages/${claimId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: input.trim() }),
      });
      if (res.ok) {
        setInput('');
        fetchMessages();
        fetchTransferStatus(); // pick up seeker_responded change
      }
    } catch {
      setError('Failed to send message.');
    } finally {
      setSending(false);
    }
  }

  async function cancelMeet() {
    if (!claimId) return;
    if (!window.confirm('Are you sure you want to cancel this meet? The ticket will go back to the pool.')) return;
    manualCancelledRef.current = true;
    setCancelling(true);
    try {
      const res = await apiFetch(`/api/claims/${claimId}/cancel`, {
        method: 'POST',
      });
      if (res.ok) {
        await fetchMessages();
        setTimeout(() => navigate('/my-tickets'), 1500);
      } else {
        const data = await res.json();
        manualCancelledRef.current = false;
        setError(data.error || 'Failed to cancel meet.');
      }
    } catch {
      manualCancelledRef.current = false;
      setError('Network error.');
    } finally {
      setCancelling(false);
    }
  }

  async function confirmTransfer() {
    setConfirmingTransfer(true);
    try {
      const res = await apiFetch(`/api/claims/${claimId}/confirm-transfer`, {
        method: 'POST',
      });
      if (res.ok) {
        fetchTransferStatus();
      } else {
        setError('Failed to confirm transfer.');
      }
    } catch {
      setError('Failed to confirm transfer.');
    } finally {
      setConfirmingTransfer(false);
    }
  }

  if (loading) return null;
  if (!user) return null;

  if (!claim && !claimId) {
    return (
      <main className="container" id="main-content" style={{ paddingTop: '2rem' }}>
        <div className="empty-state">
          <h3>No active conversations</h3>
          <p>
            Claim a ticket or have someone claim yours to start a chat.{' '}
            <Link to="/">Browse tickets →</Link>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="messages-page" id="main-content" aria-label="Messages">
      {/* Toast for auto-cancel */}
      {toast && (
        <div
          role="alert"
          style={{
            position: 'fixed',
            bottom: '1.5rem',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#1a1a1a',
            color: '#fff',
            padding: '0.75rem 1.5rem',
            borderRadius: '8px',
            zIndex: 999,
            fontSize: '0.9rem',
            maxWidth: '90vw',
            textAlign: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
        >
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="messages-header" aria-label="Chat header">
        <span className="avatar" aria-hidden="true">{initials(otherName)}</span>
        <div className="messages-header-info">
          <div className="messages-header-name">{otherName}</div>
          <div className="messages-header-event">
            {eventTitle}
            {iAmLister && seekerInfo && (seekerInfo.fan_level || seekerInfo.age_range) && (
              <span style={{ marginLeft: '0.5rem', opacity: 0.85 }}>
                ·
                {seekerInfo.fan_level && ` ${seekerInfo.fan_level} fan`}
                {seekerInfo.age_range && `, ${seekerInfo.age_range}`}
              </span>
            )}
          </div>
        </div>
        <button
          className="btn btn-danger btn-sm"
          onClick={cancelMeet}
          disabled={cancelling}
          aria-label="Cancel this meet"
        >
          {cancelling ? 'Cancelling…' : 'Cancel Meet'}
        </button>
      </div>

      {/* Claim banner */}
      <div className="messages-claim-banner" role="status">
        {iAmLister
          ? `${otherName} claimed your ticket! Say hey and make a plan.`
          : `You claimed ${otherName}'s ticket! Say hey and make a plan.`
        }
        {' '}· <strong>{eventTitle}</strong> · {claim?.date ? formatDate(claim.date) : ''}
      </div>

      {/* Fix 4 — Seeker response countdown */}
      {transferStatus && !transferStatus.seeker_responded && transferStatus.claim_status === 'active' && (
        iAmLister ? (
          <div
            role="status"
            aria-label="Waiting for seeker to respond"
            style={{
              background: '#f3f4f6',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              margin: '0.5rem 1rem',
              fontSize: '0.85rem',
              color: 'var(--text-muted)',
            }}
          >
            ⏳ Waiting for {otherName} to respond. If they don't reply within 2 hours of claiming, the ticket will be automatically re-listed.
            {transferStatus.response_deadline && (
              <> Time remaining: <strong>{timeRemaining(transferStatus.response_deadline)}</strong>.</>
            )}
          </div>
        ) : (
          <div
            role="alert"
            aria-live="assertive"
            aria-label="You must respond soon"
            style={{
              background: '#fef3c7',
              border: '2px solid #f0a500',
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              margin: '0.5rem 1rem',
              fontSize: '0.85rem',
              color: '#78350f',
              fontWeight: 500,
            }}
          >
            Say hello to {otherName}! You must respond within{' '}
            <strong>{timeRemaining(transferStatus.response_deadline)}</strong> or this ticket will be released.
          </div>
        )
      )}

      {/* Fix 3 — Transfer confirmation */}
      {transferStatus && transferStatus.claim_status === 'active' && transferStatus.seeker_responded && (
        transferStatus.transfer_confirmed ? (
          <div
            role="status"
            aria-label="Ticket transfer confirmed"
            style={{
              background: '#d1fae5',
              border: '1px solid var(--green)',
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              margin: '0.5rem 1rem',
              fontSize: '0.85rem',
              color: '#065f46',
              fontWeight: 500,
            }}
          >
            Ticket transfer confirmed! Enjoy the game.
          </div>
        ) : iAmLister ? (
          <div
            role="alert"
            aria-live="assertive"
            aria-label="Transfer confirmation required"
            style={{
              background: '#fef3c7',
              border: '1px solid #f0a500',
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              margin: '0.5rem 1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}
          >
            <strong style={{ color: '#92400e', fontSize: '0.88rem' }}>⚠️ Action required: confirm ticket transfer</strong>
            <span style={{ fontSize: '0.85rem', color: '#78350f' }}>
              Please confirm you've sent the ticket to {otherName} before{' '}
              <strong>{formatDeadline(transferStatus.transfer_deadline)}</strong>.
              {transferStatus.hours_remaining !== null && (
                <> Time remaining: <strong>{timeRemaining(transferStatus.transfer_deadline)}</strong>.</>
              )}
            </span>
            <button
              className="btn btn-sm"
              style={{ background: '#f0a500', color: '#fff', border: 'none', alignSelf: 'flex-start', fontWeight: 600 }}
              onClick={confirmTransfer}
              disabled={confirmingTransfer}
              aria-label="Confirm you have sent the ticket"
            >
              {confirmingTransfer ? 'Confirming…' : 'Confirm Ticket Sent ✓'}
            </button>
          </div>
        ) : (
          <div
            role="status"
            aria-label="Waiting for ticket transfer confirmation"
            style={{
              background: '#fef3c7',
              border: '1px solid #f0a500',
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              margin: '0.5rem 1rem',
              fontSize: '0.85rem',
              color: '#78350f',
            }}
          >
            ⏳ Waiting for {otherName} to confirm they've sent the ticket. Deadline:{' '}
            <strong>{formatDeadline(transferStatus.transfer_deadline)}</strong>.
            {' '}If not confirmed in time, this meet will be automatically cancelled and the ticket re-listed.
          </div>
        )
      )}

      {error && (
        <div className="banner banner-warn" role="alert" style={{ margin: '0.5rem 1rem' }}>
          {error}
          <button className="banner-dismiss" onClick={() => setError('')} aria-label="Dismiss">×</button>
        </div>
      )}

      {/* Thread */}
      <div
        className="messages-thread"
        ref={threadRef}
        role="log"
        aria-label="Message thread"
        aria-live="polite"
      >
        {messages.length === 0 && (
          <div className="no-messages">No messages yet. Say hi!</div>
        )}
        {messages.map(msg => {
          const isSystem = msg.sender_id === 0 || msg.sender_id === null;
          const isMine   = msg.sender_id === user.id;

          if (isSystem) {
            return (
              <div key={msg.id} className="bubble-wrap" style={{ justifyContent: 'center' }}>
                <div className="bubble system" role="status" aria-label="System message">
                  {msg.body}
                </div>
              </div>
            );
          }

          return (
            <div
              key={msg.id}
              className={`bubble-wrap${isMine ? ' mine' : ''}`}
              aria-label={isMine ? 'You' : msg.sender_name || otherName}
            >
              {!isMine && (
                <span className="avatar" style={{ alignSelf: 'flex-end' }} aria-hidden="true">
                  {initials(msg.sender_name || otherName)}
                </span>
              )}
              <div>
                <div className={`bubble${isMine ? ' mine' : ' theirs'}`}>
                  {msg.body}
                </div>
                <div className="bubble-time" style={{ textAlign: isMine ? 'right' : 'left' }}>
                  {formatTime(msg.created_at)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input */}
      <form
        className="messages-input-bar"
        onSubmit={sendMessage}
        aria-label="Send a message"
      >
        <label htmlFor="msg-input" className="sr-only">Message</label>
        <input
          id="msg-input"
          type="text"
          placeholder="Type a message…"
          value={input}
          onChange={e => setInput(e.target.value)}
          autoComplete="off"
          aria-label="Message input"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          aria-label="Send message"
        >
          Send
        </button>
      </form>
    </main>
  );
}

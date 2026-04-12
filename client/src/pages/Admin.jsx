import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const ADMIN_EMAIL = 'jadenmarting@gmail.com';

function StatCard({ label, value, sub, color }) {
  return (
    <div style={{
      background: '#111',
      border: `1px solid ${color || '#2ecc71'}33`,
      borderRadius: 12,
      padding: '20px 24px',
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
    }}>
      <span style={{ color: '#888', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</span>
      <span style={{ color: color || '#2ecc71', fontSize: 36, fontWeight: 700, lineHeight: 1.1 }}>{value ?? '—'}</span>
      {sub && <span style={{ color: '#555', fontSize: 12 }}>{sub}</span>}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginTop: 32 }}>
      <h2 style={{ color: '#aaa', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12, fontWeight: 600 }}>{title}</h2>
      {children}
    </div>
  );
}

function Table({ cols, rows, render }) {
  return (
    <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid #222' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: '#0c0c0c' }}>
            {cols.map(c => (
              <th key={c} style={{ padding: '10px 14px', textAlign: 'left', color: '#555', fontWeight: 600, whiteSpace: 'nowrap' }}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={cols.length} style={{ padding: 20, color: '#444', textAlign: 'center' }}>No data yet</td></tr>
          ) : rows.map((row, i) => (
            <tr key={i} style={{ borderTop: '1px solid #1a1a1a', background: i % 2 === 0 ? '#0d0d0d' : 'transparent' }}>
              {render(row)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Badge({ status }) {
  const colors = {
    open:      { bg: '#0f2a18', color: '#2ecc71' },
    claimed:   { bg: '#1a1a0a', color: '#f0a500' },
    cancelled: { bg: '#2a0f0f', color: '#e74c3c' },
    active:    { bg: '#0f2a18', color: '#2ecc71' },
  };
  const c = colors[status] || { bg: '#1a1a1a', color: '#888' };
  return (
    <span style={{ background: c.bg, color: c.color, borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>
      {status}
    </span>
  );
}

export default function Admin() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [refreshed, setRefreshed] = useState(null);

  const load = async () => {
    try {
      const res = await apiFetch('/api/admin/stats');
      if (res.status === 403) { setError('Access denied.'); return; }
      if (!res.ok) { setError('Failed to load stats.'); return; }
      setStats(await res.json());
      setRefreshed(new Date().toLocaleTimeString());
    } catch {
      setError('Network error.');
    }
  };

  useEffect(() => {
    if (loading) return;
    if (user && user.email === ADMIN_EMAIL) load();
  }, [user, loading]);

  // Still checking auth
  if (loading) return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#444' }}>
      Loading…
    </div>
  );

  // Not logged in
  if (!user) return (
    <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      <p style={{ color: '#e74c3c', fontSize: 16 }}>You need to be logged in to view this page.</p>
    </div>
  );

  // Logged in but wrong account
  if (user.email !== ADMIN_EMAIL) return (
    <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      <p style={{ color: '#e74c3c', fontSize: 16 }}>Access denied.</p>
      <p style={{ color: '#555', fontSize: 13 }}>Logged in as: <strong style={{ color: '#aaa' }}>{user.email}</strong></p>
      <p style={{ color: '#444', fontSize: 12 }}>Expected: <strong style={{ color: '#aaa' }}>{ADMIN_EMAIL}</strong></p>
    </div>
  );

  // Logged in, correct account, waiting for stats
  if (!stats) return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#444' }}>
      {error || 'Loading stats…'}
    </div>
  );

  const claimRate = stats.tickets.total > 0
    ? Math.round((stats.tickets.claimed / stats.tickets.total) * 100)
    : 0;

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '40px 20px 80px', fontFamily: 'inherit', color: '#fff' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>
          <span style={{ color: '#2ecc71' }}>Rally</span>Bro Dashboard
        </h1>
        <button
          onClick={load}
          style={{ background: '#1a1a1a', border: '1px solid #2ecc7133', color: '#2ecc71', borderRadius: 8, padding: '6px 14px', fontSize: 12, cursor: 'pointer' }}
        >
          ↻ Refresh
        </button>
      </div>
      {refreshed && <p style={{ color: '#444', fontSize: 12, marginBottom: 28 }}>Last updated {refreshed}</p>}

      {/* Top stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
        <StatCard label="Total Users"    value={stats.users.total}    sub={`+${stats.users.thisWeek} this week`} />
        <StatCard label="Tickets Listed" value={stats.tickets.total}  sub={`${stats.tickets.open} open now`} />
        <StatCard label="Tickets Claimed" value={stats.tickets.claimed} sub={`${claimRate}% claim rate`} color="#f0a500" />
        <StatCard label="Active Meets"   value={stats.claims.active}  color="#f0a500" />
        <StatCard label="Total Chats"    value={stats.messages.total} color="#3498db" />
        <StatCard label="New Users (30d)" value={stats.users.thisMonth} color="#9b59b6" />
      </div>

      {/* Top sports */}
      {stats.topSports.length > 0 && (
        <Section title="Tickets by Sport">
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {stats.topSports.map(s => (
              <div key={s.sport} style={{ background: '#111', border: '1px solid #222', borderRadius: 10, padding: '12px 18px', minWidth: 110, textAlign: 'center' }}>
                <div style={{ color: '#2ecc71', fontSize: 22, fontWeight: 700 }}>{s.count}</div>
                <div style={{ color: '#666', fontSize: 12, marginTop: 4 }}>{s.sport}</div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Recent listings */}
      <Section title="Recent Listings">
        <Table
          cols={['Title', 'Sport', 'Date', 'Lister', 'Status']}
          rows={stats.recentListings}
          render={row => (<>
            <td style={{ padding: '10px 14px', color: '#ddd', maxWidth: 200 }}>{row.title}</td>
            <td style={{ padding: '10px 14px', color: '#888' }}>{row.sport}</td>
            <td style={{ padding: '10px 14px', color: '#888', whiteSpace: 'nowrap' }}>{row.date}</td>
            <td style={{ padding: '10px 14px', color: '#aaa' }}>{row.lister}</td>
            <td style={{ padding: '10px 14px' }}><Badge status={row.status} /></td>
          </>)}
        />
      </Section>

      {/* Recent claims */}
      <Section title="Recent Claims">
        <Table
          cols={['Ticket', 'Sport', 'Lister', 'Seeker', 'Status', 'Date']}
          rows={stats.recentClaims}
          render={row => (<>
            <td style={{ padding: '10px 14px', color: '#ddd', maxWidth: 180 }}>{row.title}</td>
            <td style={{ padding: '10px 14px', color: '#888' }}>{row.sport}</td>
            <td style={{ padding: '10px 14px', color: '#aaa' }}>{row.lister}</td>
            <td style={{ padding: '10px 14px', color: '#aaa' }}>{row.seeker}</td>
            <td style={{ padding: '10px 14px' }}><Badge status={row.status} /></td>
            <td style={{ padding: '10px 14px', color: '#555', whiteSpace: 'nowrap' }}>{new Date(row.created_at).toLocaleDateString()}</td>
          </>)}
        />
      </Section>
    </div>
  );
}

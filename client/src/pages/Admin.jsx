import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const ADMIN_EMAIL = 'jadenmarting@gmail.com';

export default function Admin() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [refreshed, setRefreshed] = useState(null);
  const [activeTab, setActiveTab] = useState('listings');

  const load = async () => {
    try {
      const res = await apiFetch('/api/admin/stats');
      if (!res.ok) {
        const body = await res.text();
        setError(`Error ${res.status}: ${body}`);
        return;
      }
      setStats(await res.json());
      setRefreshed(new Date().toLocaleTimeString());
    } catch (e) {
      setError(`Network error: ${e.message}`);
    }
  };

  useEffect(() => {
    if (loading) return;
    if (user && user.email === ADMIN_EMAIL) load();
  }, [user, loading]);

  if (loading) return <Centered>Loading…</Centered>;
  if (!user) return <Centered>You need to be logged in.</Centered>;
  if (user.email !== ADMIN_EMAIL) return (
    <Centered>
      <p style={{ color: '#e74c3c', marginBottom: 8 }}>Access denied.</p>
      <p style={{ color: '#999', fontSize: 13 }}>Logged in as: {user.email}</p>
    </Centered>
  );
  if (error) return <Centered style={{ color: '#e74c3c', fontSize: 13 }}>{error}</Centered>;
  if (!stats) return <Centered>Loading stats…</Centered>;

  const claimRate = stats.tickets.total > 0
    ? Math.round((stats.tickets.claimed / stats.tickets.total) * 100) : 0;

  const tabs = [
    { key: 'listings', label: 'Listings', count: stats.recentListings.length },
    { key: 'claims',   label: 'Claims',   count: stats.recentClaims.length },
    { key: 'sports',   label: 'By Sport',  count: null },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f4f6f9', fontFamily: 'inherit' }}>

      {/* Sidebar */}
      <aside style={{
        width: 220, background: '#fff', borderRight: '1px solid #e8eaed',
        padding: '32px 0', display: 'flex', flexDirection: 'column', gap: 4,
        position: 'sticky', top: 0, height: '100vh',
      }}>
        <div style={{ padding: '0 24px 24px', borderBottom: '1px solid #f0f0f0' }}>
          <span style={{ fontWeight: 800, fontSize: 18, color: '#1a1a1a' }}>
            Rally<span style={{ color: '#27ae60' }}>Bro</span>
          </span>
          <div style={{ fontSize: 11, color: '#aaa', marginTop: 2, textTransform: 'uppercase', letterSpacing: 1 }}>Admin</div>
        </div>
        <div style={{ padding: '16px 0' }}>
          {[
            { label: 'Dashboard', icon: '◈', active: true },
            { label: 'Listings',  icon: '◉' },
            { label: 'Claims',    icon: '◎' },
            { label: 'Users',     icon: '○' },
          ].map(item => (
            <div key={item.label} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 24px', cursor: 'pointer', fontSize: 14,
              color: item.active ? '#27ae60' : '#666',
              background: item.active ? '#f0faf4' : 'transparent',
              borderRight: item.active ? '3px solid #27ae60' : '3px solid transparent',
              fontWeight: item.active ? 600 : 400,
            }}>
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              {item.label}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 'auto', padding: '16px 24px', borderTop: '1px solid #f0f0f0' }}>
          <div style={{ fontSize: 13, color: '#999' }}>Signed in as</div>
          <div style={{ fontSize: 13, color: '#333', fontWeight: 500, marginTop: 2, wordBreak: 'break-all' }}>{user.first_name}</div>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>Dashboard</h1>
            {refreshed && <p style={{ fontSize: 12, color: '#aaa', margin: '4px 0 0' }}>Last updated {refreshed}</p>}
          </div>
          <button onClick={load} style={{
            background: '#27ae60', color: '#fff', border: 'none',
            borderRadius: 8, padding: '8px 18px', fontSize: 13,
            fontWeight: 600, cursor: 'pointer',
          }}>↻ Refresh</button>
        </div>

        {/* Stat strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16, marginBottom: 28 }}>
          {[
            { label: 'Total Users',     value: stats.users.total,          sub: `+${stats.users.thisWeek} this week`,  color: '#27ae60' },
            { label: 'Tickets Listed',  value: stats.tickets.total,         sub: `${stats.tickets.open} open now`,      color: '#2980b9' },
            { label: 'Tickets Claimed', value: stats.tickets.claimed,       sub: `${claimRate}% claim rate`,            color: '#8e44ad' },
            { label: 'Active Meets',    value: stats.claims.active,         sub: 'in progress',                         color: '#e67e22' },
            { label: 'Total Chats',     value: stats.messages.total,        sub: 'messages sent',                       color: '#16a085' },
            { label: 'New (30 days)',   value: stats.users.thisMonth,       sub: 'new signups',                         color: '#c0392b' },
          ].map(s => (
            <div key={s.label} style={{
              background: '#fff', borderRadius: 12, padding: '20px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #eee',
            }}>
              <div style={{ fontSize: 11, color: '#aaa', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value ?? '—'}</div>
              <div style={{ fontSize: 11, color: '#bbb', marginTop: 6 }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Tabbed content */}
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #eee' }}>

          {/* Tab bar */}
          <div style={{ display: 'flex', borderBottom: '1px solid #f0f0f0', padding: '0 24px' }}>
            {tabs.map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
                background: 'none', border: 'none', padding: '16px 20px 14px', cursor: 'pointer',
                fontSize: 13, fontWeight: activeTab === t.key ? 700 : 500,
                color: activeTab === t.key ? '#27ae60' : '#888',
                borderBottom: activeTab === t.key ? '2px solid #27ae60' : '2px solid transparent',
                marginBottom: -1, display: 'flex', alignItems: 'center', gap: 6,
              }}>
                {t.label}
                {t.count !== null && (
                  <span style={{
                    background: activeTab === t.key ? '#e8f8ef' : '#f4f4f4',
                    color: activeTab === t.key ? '#27ae60' : '#aaa',
                    borderRadius: 10, padding: '1px 7px', fontSize: 11, fontWeight: 600,
                  }}>{t.count}</span>
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ padding: '8px 0' }}>
            {activeTab === 'listings' && (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#fafafa' }}>
                    {['Title', 'Sport', 'Date', 'Listed By', 'Status'].map(h => (
                      <th key={h} style={{ padding: '10px 24px', textAlign: 'left', color: '#aaa', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stats.recentListings.length === 0 ? (
                    <tr><td colSpan={5} style={{ padding: 32, textAlign: 'center', color: '#ccc' }}>No listings yet</td></tr>
                  ) : stats.recentListings.map((row, i) => (
                    <tr key={i} style={{ borderTop: '1px solid #f6f6f6' }}>
                      <td style={{ padding: '12px 24px', color: '#333', fontWeight: 500 }}>{row.title}</td>
                      <td style={{ padding: '12px 24px', color: '#888' }}>{row.sport}</td>
                      <td style={{ padding: '12px 24px', color: '#888' }}>{row.date}</td>
                      <td style={{ padding: '12px 24px', color: '#555' }}>{row.lister}</td>
                      <td style={{ padding: '12px 24px' }}><StatusBadge status={row.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'claims' && (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#fafafa' }}>
                    {['Ticket', 'Sport', 'Lister', 'Seeker', 'Status', 'Date'].map(h => (
                      <th key={h} style={{ padding: '10px 24px', textAlign: 'left', color: '#aaa', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stats.recentClaims.length === 0 ? (
                    <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: '#ccc' }}>No claims yet</td></tr>
                  ) : stats.recentClaims.map((row, i) => (
                    <tr key={i} style={{ borderTop: '1px solid #f6f6f6' }}>
                      <td style={{ padding: '12px 24px', color: '#333', fontWeight: 500 }}>{row.title}</td>
                      <td style={{ padding: '12px 24px', color: '#888' }}>{row.sport}</td>
                      <td style={{ padding: '12px 24px', color: '#555' }}>{row.lister}</td>
                      <td style={{ padding: '12px 24px', color: '#555' }}>{row.seeker}</td>
                      <td style={{ padding: '12px 24px' }}><StatusBadge status={row.status} /></td>
                      <td style={{ padding: '12px 24px', color: '#aaa' }}>{new Date(row.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'sports' && (
              <div style={{ padding: '24px', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {stats.topSports.length === 0 ? (
                  <p style={{ color: '#ccc' }}>No data yet</p>
                ) : stats.topSports.map((s, i) => (
                  <div key={s.sport} style={{
                    background: '#f8fdf9', border: '1px solid #d5f0e0',
                    borderRadius: 12, padding: '20px 28px', textAlign: 'center', minWidth: 120,
                  }}>
                    <div style={{ fontSize: 28, fontWeight: 700, color: '#27ae60' }}>{s.count}</div>
                    <div style={{ fontSize: 13, color: '#555', marginTop: 4 }}>{s.sport}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  );
}

function Centered({ children, style }) {
  return (
    <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, ...style }}>
      {children}
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    open:      { bg: '#e8f8ef', color: '#27ae60' },
    claimed:   { bg: '#fef9e7', color: '#e67e22' },
    cancelled: { bg: '#fdecea', color: '#e74c3c' },
    active:    { bg: '#e8f8ef', color: '#27ae60' },
  };
  const c = map[status] || { bg: '#f4f4f4', color: '#aaa' };
  return (
    <span style={{
      background: c.bg, color: c.color,
      borderRadius: 6, padding: '3px 10px',
      fontSize: 11, fontWeight: 700, textTransform: 'capitalize',
    }}>{status}</span>
  );
}

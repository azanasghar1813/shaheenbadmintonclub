import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Trophy, Calendar, Activity, ChevronRight } from 'lucide-react';
import api from '../../api/axios';
import { format } from 'date-fns';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ players: 0, tournaments: 0, activeTournaments: 0, todayMatches: 0 });
  const [recentMatches, setRecentMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/players'),
      api.get('/tournaments'),
      api.get('/tournaments?status=active'),
      api.get('/matches?today=true'),
    ]).then(([p, t, at, m]) => {
      setStats({
        players: p.data.length,
        tournaments: t.data.length,
        activeTournaments: at.data.length,
        todayMatches: m.data.length,
      });
      setRecentMatches(m.data.slice(0, 5));
    }).finally(() => setLoading(false));
  }, []);

  const statCards = [
    { label: 'Total Players', value: stats.players, icon: Users, color: 'var(--color-primary)', to: '/admin/players' },
    { label: 'Tournaments', value: stats.tournaments, icon: Trophy, color: 'var(--color-gold)', to: '/admin/tournaments' },
    { label: 'Active Now', value: stats.activeTournaments, icon: Activity, color: '#4ade80', to: '/admin/tournaments' },
    { label: "Today's Matches", value: stats.todayMatches, icon: Calendar, color: '#60a5fa', to: '/admin/matches' },
  ];

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Overview of the club's current activity</p>
      </div>

      {loading ? (
        <div className="loading-page"><div className="spinner" /></div>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid-4" style={{ marginBottom: '2.5rem' }}>
            {statCards.map(({ label, value, icon: Icon, color, to }) => (
              <Link key={label} to={to} className="stat-card card card-glow" style={{ textDecoration: 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span className="stat-value" style={{ color }}>{value}</span>
                    <span className="stat-label">{label}</span>
                  </div>
                  <div style={{ padding: '0.6rem', borderRadius: 'var(--radius-md)', background: `${color}18` }}>
                    <Icon size={20} style={{ color }} />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Today's Matches */}
          <h2 className="section-title"><Calendar size={20} /> Today's Matches</h2>
          {recentMatches.length === 0 ? (
            <div className="card empty-state" style={{ padding: '2rem' }}>
              <div className="empty-icon">📅</div>
              <h3>No matches today</h3>
              <Link to="/admin/matches" className="btn btn-primary" style={{ marginTop: '1rem' }}>View All Matches</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {recentMatches.map((m) => (
                <div key={m._id} className="card flex-between" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                      {m.team1?.name || 'TBD'} <span style={{ color: 'var(--text-muted)' }}>vs</span> {m.team2?.name || 'TBD'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      {m.tournamentId?.name} · {m.court ? `Court ${m.court}` : 'No court assigned'}
                    </div>
                  </div>
                  <div className="flex-gap">
                    {m.status === 'completed' ? (
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1rem', color: 'var(--color-primary)' }}>
                        {m.scores.team1} – {m.scores.team2}
                      </span>
                    ) : (
                      <span className="badge badge-blue">{m.status}</span>
                    )}
                    <Link to="/admin/matches" className="btn btn-ghost btn-sm"><ChevronRight size={15} /></Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quick Links */}
          <h2 className="section-title" style={{ marginTop: '2rem' }}>Quick Actions</h2>
          <div className="grid-3">
            {[
              { to: '/admin/players', label: 'Add Player', desc: 'Register a new club member' },
              { to: '/admin/tournaments', label: 'Create Tournament', desc: 'Start a new competition' },
              { to: '/admin/announcements', label: 'Post Announcement', desc: 'Publish club news' },
            ].map(({ to, label, desc }) => (
              <Link key={to} to={to} className="card card-glow" style={{ textDecoration: 'none' }}>
                <div style={{ fontWeight: 700, marginBottom: '0.35rem' }}>{label}</div>
                <p style={{ fontSize: '0.85rem' }}>{desc}</p>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

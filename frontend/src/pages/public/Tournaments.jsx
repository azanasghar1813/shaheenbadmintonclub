import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Calendar, ChevronRight, Filter } from 'lucide-react';
import api from '../../api/axios';
import { format } from 'date-fns';
import './Tournaments.css';

const STATUS_MAP = {
  upcoming:  { label: 'Upcoming',  cls: 'badge-blue' },
  active:    { label: 'Live',      cls: 'badge-green' },
  completed: { label: 'Completed', cls: 'badge-gray' },
};

export default function Tournaments() {
  const [tournaments, setTournaments] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const url = filter ? `/tournaments?status=${filter}` : '/tournaments';
    api.get(url).then(({ data }) => setTournaments(data)).finally(() => setLoading(false));
  }, [filter]);

  return (
    <div className="container page">
      <div className="page-header flex-between">
        <div>
          <h1><span className="gradient-text">Tournaments</span></h1>
          <p>All club competitions, past and present</p>
        </div>
        <div className="flex-gap">
          {['', 'upcoming', 'active', 'completed'].map((s) => (
            <button
              key={s}
              className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setFilter(s)}
            >
              {s === '' ? 'All' : STATUS_MAP[s].label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="loading-page"><div className="spinner" /></div>
      ) : tournaments.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🏆</div>
          <h3>No tournaments found</h3>
        </div>
      ) : (
        <div className="tournaments-list">
          {tournaments.map((t) => {
            const { label, cls } = STATUS_MAP[t.status] || { label: t.status, cls: 'badge-gray' };
            return (
              <Link key={t._id} to={`/tournaments/${t._id}`} className="tournament-row card card-glow">
                <div className="tournament-icon">
                  <Trophy size={22} />
                </div>
                <div className="tournament-info">
                  <h3>{t.name}</h3>
                  <div className="flex-gap" style={{ marginTop: '0.3rem' }}>
                    <span className={`badge ${cls}`}>{label}</span>
                    <span className="badge badge-gray">{t.format}</span>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      <Calendar size={12} style={{ display: 'inline', marginRight: '3px' }} />
                      {format(new Date(t.date), 'MMM d, yyyy')}
                    </span>
                    {t.venue && <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>· {t.venue}</span>}
                  </div>
                </div>
                <ChevronRight size={20} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

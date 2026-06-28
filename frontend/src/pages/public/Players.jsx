import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, User } from 'lucide-react';
import api from '../../api/axios';
import './Players.css';

const SKILL_LEVELS = ['', 'Beginner', 'Intermediate', 'Advanced', 'Professional'];
const SORT_OPTIONS = [
  { value: 'name', label: 'Name A–Z' },
  { value: 'wins', label: 'Most Wins' },
  { value: 'joined', label: 'Newest' },
];

export default function Players() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [skill, setSkill] = useState('');
  const [sort, setSort] = useState('name');

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ sort });
    if (search) params.set('search', search);
    if (skill) params.set('skill', skill);
    api.get(`/players?${params}`).then(({ data }) => setPlayers(data)).finally(() => setLoading(false));
  }, [search, skill, sort]);

  return (
    <div className="container page">
      <div className="page-header">
        <h1>Player <span className="gradient-text">Roster</span></h1>
        <p>Meet the athletes of Shaheen Badminton Club</p>
      </div>

      {/* Filters */}
      <div className="players-filters">
        <div className="search-bar">
          <Search size={16} />
          <input
            className="form-input"
            placeholder="Search players..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="form-input filter-select" value={skill} onChange={(e) => setSkill(e.target.value)}>
          <option value="">All Levels</option>
          {SKILL_LEVELS.slice(1).map((s) => <option key={s}>{s}</option>)}
        </select>
        <select className="form-input filter-select" value={sort} onChange={(e) => setSort(e.target.value)}>
          {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="loading-page"><div className="spinner" /></div>
      ) : players.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🏸</div>
          <h3>No players found</h3>
          <p>Try adjusting your search filters</p>
        </div>
      ) : (
        <div className="players-grid">
          {players.map((p) => (
            <Link key={p._id} to={`/players/${p._id}`} className="player-card card card-glow">
              <div className="player-photo">
                {p.photo?.url ? (
                  <img src={p.photo.url} alt={p.name} />
                ) : (
                  <div className="player-avatar"><User size={32} /></div>
                )}
              </div>
              <div className="player-info">
                <h3 className="player-name">{p.name}</h3>
                <div className={`badge badge-teal skill-badge`} style={{ marginBottom: '0.75rem' }}>
                  {p.skillLevel}
                </div>
                <div className="player-stats-row">
                  <div className="player-mini-stat">
                    <span className="player-mini-value">{p.stats.wins}</span>
                    <span className="player-mini-label">Wins</span>
                  </div>
                  <div className="player-mini-stat">
                    <span className="player-mini-value">{p.stats.losses}</span>
                    <span className="player-mini-label">Losses</span>
                  </div>
                  <div className="player-mini-stat">
                    <span className="player-mini-value" style={{ color: 'var(--color-primary)' }}>{p.winRate}%</span>
                    <span className="player-mini-label">Win Rate</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

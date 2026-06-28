import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, User, Trophy, Target, Calendar, TrendingUp } from 'lucide-react';
import api from '../../api/axios';
import { format } from 'date-fns';
import './PlayerProfile.css';

export default function PlayerProfile() {
  const { id } = useParams();
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/players/${id}`).then(({ data }) => setPlayer(data)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;
  if (!player) return <div className="container page"><p>Player not found.</p></div>;

  const winRate = player.stats.gamesPlayed > 0
    ? ((player.stats.wins / player.stats.gamesPlayed) * 100).toFixed(1)
    : 0;

  const skillColors = { Beginner: '#4ade80', Intermediate: '#60a5fa', Advanced: '#f5c518', Professional: '#00d4aa' };

  return (
    <div className="container page">
      <Link to="/players" className="back-link">
        <ArrowLeft size={16} /> Back to Roster
      </Link>

      <div className="profile-layout">
        {/* ── Left Panel ── */}
        <div className="profile-left">
          <div className="profile-photo-wrap card">
            {player.photo?.url ? (
              <img src={player.photo.url} alt={player.name} className="profile-photo" />
            ) : (
              <div className="profile-avatar"><User size={60} /></div>
            )}
            <h1 className="profile-name">{player.name}</h1>
            <div style={{ marginBottom: '0.5rem' }}>
              <span className="badge badge-teal">{player.skillLevel}</span>
            </div>
            {player.position && <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{player.position}</p>}
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              <Calendar size={13} style={{ display: 'inline', marginRight: '4px' }} />
              Joined {format(new Date(player.joinedDate), 'MMMM yyyy')}
            </p>
          </div>

          {/* Win Rate Bar */}
          <div className="card" style={{ marginTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Win Rate</span>
              <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>{winRate}%</span>
            </div>
            <div className="win-rate-bar">
              <div className="win-rate-fill" style={{ width: `${winRate}%` }} />
            </div>
          </div>
        </div>

        {/* ── Right Panel ── */}
        <div className="profile-right">
          <h2 className="section-title"><TrendingUp size={20} /> Career Stats</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-value" style={{ color: '#4ade80' }}>{player.stats.wins}</span>
              <span className="stat-label">Wins</span>
            </div>
            <div className="stat-card">
              <span className="stat-value" style={{ color: 'var(--color-red)' }}>{player.stats.losses}</span>
              <span className="stat-label">Losses</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{player.stats.gamesPlayed}</span>
              <span className="stat-label">Games Played</span>
            </div>
            <div className="stat-card">
              <span className="stat-value" style={{ color: 'var(--color-gold)' }}>{player.stats.tournamentsWon}</span>
              <span className="stat-label">Trophies</span>
            </div>
          </div>

          <div className="card" style={{ marginTop: '1.5rem' }}>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              {player.name} has played <strong>{player.stats.gamesPlayed}</strong> competitive games
              with a record of <strong style={{ color: '#4ade80' }}>{player.stats.wins}</strong> wins
              and <strong style={{ color: 'var(--color-red)' }}>{player.stats.losses}</strong> losses,
              achieving a <strong style={{ color: 'var(--color-primary)' }}>{winRate}% win rate</strong>.
              {player.stats.tournamentsWon > 0 && ` Tournament champion ${player.stats.tournamentsWon} time${player.stats.tournamentsWon > 1 ? 's' : ''}.`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

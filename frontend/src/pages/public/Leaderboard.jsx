import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Crown, Medal, User, TrendingUp } from 'lucide-react';
import api from '../../api/axios';
import './Leaderboard.css';

export default function Leaderboard() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/leaderboard').then(({ data }) => setPlayers(data)).finally(() => setLoading(false));
  }, []);

  const rankIcon = (rank) => {
    if (rank === 1) return <Crown size={18} style={{ color: '#f5c518' }} />;
    if (rank === 2) return <Medal size={18} style={{ color: '#94a3b8' }} />;
    if (rank === 3) return <Medal size={18} style={{ color: '#cd7f32' }} />;
    return <span className="rank-num">{rank}</span>;
  };

  return (
    <div className="container page">
      <div className="page-header">
        <h1>🏆 <span className="gradient-text">Leaderboard</span></h1>
        <p>Top players ranked by wins and performance</p>
      </div>

      {loading ? (
        <div className="loading-page"><div className="spinner" /></div>
      ) : players.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🏅</div>
          <h3>No players yet</h3>
        </div>
      ) : (
        <div className="leaderboard-table card">
          {/* Top 3 podium */}
          {players.length >= 3 && (
            <div className="podium">
              {[players[1], players[0], players[2]].map((p, i) => (
                <Link key={p._id} to={`/players/${p._id}`} className={`podium-slot pos-${i}`}>
                  <div className="podium-photo">
                    {p.photo?.url ? <img src={p.photo.url} alt={p.name} /> : <User size={24} />}
                  </div>
                  <div className="podium-rank">{rankIcon(p.rank)}</div>
                  <div className="podium-name">{p.name}</div>
                  <div className="podium-wins">{p.wins}W</div>
                  <div className={`podium-block pos-block-${i}`} />
                </Link>
              ))}
            </div>
          )}

          <div className="table-wrapper" style={{ marginTop: '1.5rem' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Player</th>
                  <th>Level</th>
                  <th>Wins</th>
                  <th>Losses</th>
                  <th>Games</th>
                  <th>Win Rate</th>
                  <th>🏆</th>
                </tr>
              </thead>
              <tbody>
                {players.map((p) => (
                  <tr key={p._id} className={p.rank <= 3 ? 'top-row' : ''}>
                    <td><div className="rank-cell">{rankIcon(p.rank)}</div></td>
                    <td>
                      <Link to={`/players/${p._id}`} className="player-row-link">
                        <div className="player-thumb">
                          {p.photo?.url ? <img src={p.photo.url} alt={p.name} /> : <User size={14} />}
                        </div>
                        {p.name}
                      </Link>
                    </td>
                    <td><span className={`badge badge-teal`}>{p.skillLevel}</span></td>
                    <td><strong style={{ color: '#4ade80' }}>{p.wins}</strong></td>
                    <td style={{ color: 'var(--color-red)' }}>{p.losses}</td>
                    <td>{p.gamesPlayed}</td>
                    <td>
                      <div className="wr-bar-wrap">
                        <div className="wr-bar" style={{ width: `${p.winRate}%` }} />
                        <span>{p.winRate}%</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--color-gold)' }}>{p.tournamentsWon || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

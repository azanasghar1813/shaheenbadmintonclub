import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Trophy, Calendar, Clock, Users, RefreshCw } from 'lucide-react';
import api from '../../api/axios';
import { format } from 'date-fns';
import './TournamentDetail.css';

const STATUS_BADGE = { scheduled: 'badge-blue', in_progress: 'badge-yellow', completed: 'badge-gray', walkover: 'badge-gray' };

function BracketView({ rounds }) {
  const roundNumbers = Object.keys(rounds).sort((a, b) => Number(a) - Number(b));
  const totalRounds = roundNumbers.length;
  const roundLabels = (idx) => {
    const fromEnd = totalRounds - idx;
    if (fromEnd === 1) return 'Final';
    if (fromEnd === 2) return 'Semi-Final';
    if (fromEnd === 3) return 'Quarter-Final';
    return `Round ${idx + 1}`;
  };

  return (
    <div className="bracket-container">
      {roundNumbers.map((r, idx) => (
        <div key={r} className="bracket-round">
          <div className="bracket-round-label">{roundLabels(idx)}</div>
          <div className="bracket-matches">
            {rounds[r].map((match) => (
              <div key={match._id} className={`bracket-match ${match.status === 'completed' ? 'completed' : ''}`}>
                <div className={`bracket-team ${match.winner?._id === match.team1?._id ? 'winner' : ''}`}>
                  <span className="bracket-team-name">{match.team1?.name || 'TBD'}</span>
                  <span className="bracket-score">{match.scores?.team1 ?? ''}</span>
                </div>
                <div className="bracket-divider" />
                <div className={`bracket-team ${match.winner?._id === match.team2?._id ? 'winner' : ''}`}>
                  <span className="bracket-team-name">{match.team2?.name || 'TBD'}</span>
                  <span className="bracket-score">{match.scores?.team2 ?? ''}</span>
                </div>
                {match.status !== 'scheduled' && (
                  <div className="bracket-status">
                    <span className={`badge ${STATUS_BADGE[match.status] || 'badge-gray'}`}>{match.status.replace('_', ' ')}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function RoundRobinView({ schedule }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {schedule.map((match) => (
        <div key={match._id} className="rr-match card">
          <div className="rr-teams">
            <span className={`rr-team ${match.winner?._id === match.team1?._id ? 'rr-winner' : ''}`}>
              {match.team1?.name || 'TBD'}
            </span>
            <div className="rr-score">
              {match.status === 'completed'
                ? `${match.scores.team1} – ${match.scores.team2}`
                : 'VS'}
            </div>
            <span className={`rr-team ${match.winner?._id === match.team2?._id ? 'rr-winner' : ''}`}>
              {match.team2?.name || 'TBD'}
            </span>
          </div>
          <div className="rr-meta">
            {match.court && <span><Clock size={12} /> Court {match.court}</span>}
            {match.scheduledTime && <span><Calendar size={12} /> {format(new Date(match.scheduledTime), 'MMM d, h:mm a')}</span>}
            <span className={`badge ${STATUS_BADGE[match.status] || 'badge-gray'}`}>{match.status.replace('_', ' ')}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function TournamentDetail() {
  const { id } = useParams();
  const [tournament, setTournament] = useState(null);
  const [bracket, setBracket] = useState({});
  const [schedule, setSchedule] = useState([]);
  const [teams, setTeams] = useState([]);
  const [tab, setTab] = useState('bracket');
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    Promise.all([
      api.get(`/tournaments/${id}`),
      api.get(`/tournaments/${id}/bracket`),
      api.get(`/tournaments/${id}/schedule`),
      api.get(`/tournaments/${id}/teams`),
    ]).then(([t, b, s, tm]) => {
      setTournament(t.data);
      setBracket(b.data);
      setSchedule(s.data);
      setTeams(tm.data);
    }).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    load();
    // Auto-refresh every 15s if tournament is active
    const interval = setInterval(() => {
      if (tournament?.status === 'active') load();
    }, 15000);
    return () => clearInterval(interval);
  }, [load, tournament?.status]);

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;
  if (!tournament) return <div className="container page"><p>Tournament not found.</p></div>;

  const hasBracket = Object.keys(bracket).length > 0;
  const isRoundRobin = tournament.format === 'round-robin';

  return (
    <div className="container page">
      <Link to="/tournaments" className="back-link"><ArrowLeft size={16} /> All Tournaments</Link>

      {/* Header */}
      <div className="tournament-header card" style={{ marginBottom: '2rem' }}>
        <div className="flex-between flex-wrap" style={{ gap: '1rem' }}>
          <div>
            <div className="flex-gap" style={{ marginBottom: '0.5rem' }}>
              <span className={`badge ${tournament.status === 'active' ? 'badge-green' : tournament.status === 'upcoming' ? 'badge-blue' : 'badge-gray'}`}>
                {tournament.status === 'active' ? '● Live' : tournament.status}
              </span>
              <span className="badge badge-teal">{tournament.format}</span>
            </div>
            <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', marginBottom: '0.35rem' }}>{tournament.name}</h1>
            {tournament.description && <p>{tournament.description}</p>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              <Calendar size={13} style={{ display: 'inline', marginRight: '4px' }} />
              {format(new Date(tournament.date), 'MMMM d, yyyy')}
            </div>
            {tournament.venue && <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{tournament.venue}</div>}
            {tournament.status === 'active' && (
              <button onClick={load} className="btn btn-ghost btn-sm" style={{ marginTop: '0.5rem' }}>
                <RefreshCw size={14} /> Refresh
              </button>
            )}
          </div>
        </div>
        {tournament.winner && (
          <div className="winner-banner">
            <Trophy size={20} style={{ color: 'var(--color-gold)' }} />
            <span>Champion: <strong>{tournament.winner.name}</strong></span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="detail-tabs">
        {['bracket', 'schedule', 'teams'].map((t) => (
          <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ marginTop: '1.5rem' }}>
        {tab === 'bracket' && (
          !hasBracket ? (
            <div className="empty-state"><div className="empty-icon">📊</div><h3>Bracket not generated yet</h3></div>
          ) : isRoundRobin ? (
            <RoundRobinView schedule={schedule} />
          ) : (
            <BracketView rounds={bracket} />
          )
        )}

        {tab === 'schedule' && (
          schedule.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">📅</div><h3>No matches scheduled yet</h3></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {schedule.map((m) => (
                <div key={m._id} className="card schedule-match">
                  <div className="flex-between">
                    <span className="schedule-teams">
                      <strong>{m.team1?.name || 'TBD'}</strong>
                      <span style={{ color: 'var(--text-muted)', padding: '0 0.5rem' }}>vs</span>
                      <strong>{m.team2?.name || 'TBD'}</strong>
                    </span>
                    {m.status === 'completed' && (
                      <span className="schedule-result">{m.scores.team1} – {m.scores.team2}</span>
                    )}
                  </div>
                  <div className="flex-gap" style={{ marginTop: '0.4rem', flexWrap: 'wrap' }}>
                    {m.court && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Court: {m.court}</span>}
                    {m.scheduledTime && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{format(new Date(m.scheduledTime), 'MMM d, h:mm a')}</span>}
                    <span className={`badge ${STATUS_BADGE[m.status]}`}>{m.status.replace('_', ' ')}</span>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {tab === 'teams' && (
          teams.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">👥</div><h3>No teams yet</h3></div>
          ) : (
            <div className="grid-3">
              {teams.map((team) => (
                <div key={team._id} className="card">
                  <div className="flex-gap" style={{ marginBottom: '0.75rem' }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: team.color || '#3b82f6' }} />
                    <h3 style={{ fontSize: '1rem' }}>{team.name}</h3>
                  </div>
                  {team.players?.map((p) => (
                    <Link key={p._id} to={`/players/${p._id}`} className="team-player">
                      {p.photo?.url ? <img src={p.photo.url} alt={p.name} /> : <div className="team-player-avatar" />}
                      <span>{p.name}</span>
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}

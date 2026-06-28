import { useEffect, useState } from 'react';
import { CalendarCheck, Clock, CheckCircle, Filter } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function AdminMatches() {
  const [matches, setMatches] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [filterTid, setFilterTid] = useState('');
  const [loading, setLoading] = useState(true);
  const [scoreModal, setScoreModal] = useState(null); // match object
  const [schedModal, setSchedModal] = useState(null);
  const [scores, setScores] = useState({ score1: '', score2: '' });
  const [sched, setSched] = useState({ court: '', scheduledTime: '' });
  const [saving, setSaving] = useState(false);

  const load = () => {
    const url = filterTid ? `/matches?tournamentId=${filterTid}` : '/matches';
    Promise.all([api.get(url), api.get('/tournaments')])
      .then(([m, t]) => { setMatches(m.data); setTournaments(t.data); })
      .finally(() => setLoading(false));
  };
  useEffect(load, [filterTid]);

  const handleScore = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await api.put(`/matches/${scoreModal._id}/score`, { score1: Number(scores.score1), score2: Number(scores.score2) });
      toast.success('Score saved! Bracket updated.');
      setScoreModal(null); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const handleSched = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await api.put(`/matches/${schedModal._id}/schedule`, sched);
      toast.success('Schedule updated');
      setSchedModal(null); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const statusColor = { scheduled: 'badge-blue', in_progress: 'badge-yellow', completed: 'badge-gray', walkover: 'badge-gray' };

  return (
    <div>
      <div className="page-header flex-between flex-wrap" style={{ gap: '1rem' }}>
        <div><h1>Matches</h1><p>Enter scores and manage the schedule</p></div>
        <div className="flex-gap">
          <Filter size={16} style={{ color: 'var(--text-muted)' }} />
          <select className="form-input" style={{ width: 'auto' }} value={filterTid} onChange={(e) => setFilterTid(e.target.value)}>
            <option value="">All Tournaments</option>
            {tournaments.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
          </select>
        </div>
      </div>

      {loading ? <div className="loading-page"><div className="spinner" /></div> : matches.length === 0 ? (
        <div className="empty-state card"><div className="empty-icon">🏸</div><h3>No matches found</h3></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {matches.map((m) => (
            <div key={m._id} className="card">
              <div className="flex-between flex-wrap" style={{ gap: '0.75rem' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                    {m.tournamentId?.name} · Round {m.round}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>
                    <span>{m.team1?.name || 'TBD'}</span>
                    {m.status === 'completed' ? (
                      <span style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary)', margin: '0 0.75rem', fontSize: '1.1rem' }}>
                        {m.scores.team1} – {m.scores.team2}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', margin: '0 0.75rem' }}>vs</span>
                    )}
                    <span>{m.team2?.name || 'TBD'}</span>
                  </div>
                  {(m.court || m.scheduledTime) && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      {m.court && `Court: ${m.court}`}
                      {m.court && m.scheduledTime && ' · '}
                      {m.scheduledTime && format(new Date(m.scheduledTime), 'MMM d, h:mm a')}
                    </div>
                  )}
                  {m.winner && (
                    <div style={{ fontSize: '0.8rem', color: '#4ade80', marginTop: '0.2rem' }}>
                      ✓ Winner: {m.winner.name}
                    </div>
                  )}
                </div>
                <div className="flex-gap" style={{ flexShrink: 0 }}>
                  <span className={`badge ${statusColor[m.status] || 'badge-gray'}`}>{m.status.replace('_', ' ')}</span>
                  {m.status !== 'completed' && m.team1 && m.team2 && (
                    <>
                      <button className="btn btn-primary btn-sm" onClick={() => { setScoreModal(m); setScores({ score1: '', score2: '' }); }}>
                        <CheckCircle size={14} /> Enter Score
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => { setSchedModal(m); setSched({ court: m.court || '', scheduledTime: m.scheduledTime ? format(new Date(m.scheduledTime), "yyyy-MM-dd'T'HH:mm") : '' }); }}>
                        <Clock size={14} /> Schedule
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Score Modal */}
      {scoreModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setScoreModal(null)}>
          <div className="modal" style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h2>Enter Score</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setScoreModal(null)}>✕</button>
            </div>
            <form onSubmit={handleScore} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                <strong style={{ color: 'var(--text-primary)' }}>{scoreModal.team1?.name}</strong> vs <strong style={{ color: 'var(--text-primary)' }}>{scoreModal.team2?.name}</strong>
              </p>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">{scoreModal.team1?.name}</label>
                  <input className="form-input" type="number" min={0} value={scores.score1} onChange={(e) => setScores({ ...scores, score1: e.target.value })} required style={{ textAlign: 'center', fontSize: '1.5rem', fontWeight: 800 }} />
                </div>
                <div className="form-group">
                  <label className="form-label">{scoreModal.team2?.name}</label>
                  <input className="form-input" type="number" min={0} value={scores.score2} onChange={(e) => setScores({ ...scores, score2: e.target.value })} required style={{ textAlign: 'center', fontSize: '1.5rem', fontWeight: 800 }} />
                </div>
              </div>
              <div className="modal-footer" style={{ margin: 0, padding: 0 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setScoreModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving || scores.score1 === scores.score2}>
                  {saving ? <span className="spinner" style={{ width: 16, height: 16 }} /> : null}
                  {saving ? 'Saving...' : 'Save Score'}
                </button>
              </div>
              {scores.score1 !== '' && scores.score2 !== '' && scores.score1 === scores.score2 && (
                <p style={{ color: 'var(--color-red)', fontSize: '0.82rem', textAlign: 'center' }}>Scores cannot be tied — there must be a winner.</p>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {schedModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setSchedModal(null)}>
          <div className="modal" style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h2>Set Schedule</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setSchedModal(null)}>✕</button>
            </div>
            <form onSubmit={handleSched} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Court</label>
                <input className="form-input" placeholder="e.g. Court 1" value={sched.court} onChange={(e) => setSched({ ...sched, court: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Date & Time</label>
                <input className="form-input" type="datetime-local" value={sched.scheduledTime} onChange={(e) => setSched({ ...sched, scheduledTime: e.target.value })} />
              </div>
              <div className="modal-footer" style={{ margin: 0, padding: 0 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setSchedModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Update Schedule'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

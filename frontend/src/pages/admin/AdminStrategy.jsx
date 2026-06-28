import { useEffect, useState } from 'react';
import { BookOpen, Save, Search } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function AdminStrategy() {
  const [matches, setMatches] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [filterTid, setFilterTid] = useState('');
  const [notes, setNotes] = useState({});
  const [saving, setSaving] = useState({});
  const [loading, setLoading] = useState(true);

  const load = () => {
    const url = filterTid ? `/matches?tournamentId=${filterTid}` : '/matches';
    Promise.all([api.get(url), api.get('/tournaments')])
      .then(([m, t]) => {
        setMatches(m.data);
        setTournaments(t.data);
        const initial = {};
        m.data.forEach((match) => { initial[match._id] = match.strategyNotes || ''; });
        setNotes(initial);
      }).finally(() => setLoading(false));
  };
  useEffect(load, [filterTid]);

  const saveNote = async (matchId) => {
    setSaving((prev) => ({ ...prev, [matchId]: true }));
    try {
      await api.put(`/matches/${matchId}/strategy`, { strategyNotes: notes[matchId] });
      toast.success('Strategy notes saved');
    } catch { toast.error('Failed to save'); }
    finally { setSaving((prev) => ({ ...prev, [matchId]: false })); }
  };

  return (
    <div>
      <div className="page-header flex-between flex-wrap" style={{ gap: '1rem' }}>
        <div>
          <h1><BookOpen size={24} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />Strategy Board</h1>
          <p>Per-match notes and tactics</p>
        </div>
        <select className="form-input" style={{ width: 'auto' }} value={filterTid} onChange={(e) => setFilterTid(e.target.value)}>
          <option value="">All Tournaments</option>
          {tournaments.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
        </select>
      </div>

      {loading ? <div className="loading-page"><div className="spinner" /></div> : matches.length === 0 ? (
        <div className="empty-state card"><div className="empty-icon">📓</div><h3>No matches to add notes for</h3></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {matches.map((m) => (
            <div key={m._id} className="card">
              <div className="flex-between" style={{ marginBottom: '0.75rem' }}>
                <div>
                  <div style={{ fontWeight: 700 }}>
                    {m.team1?.name || 'TBD'} <span style={{ color: 'var(--text-muted)' }}>vs</span> {m.team2?.name || 'TBD'}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                    {m.tournamentId?.name} · Round {m.round} · Match {m.matchNumber}
                  </div>
                </div>
                <span className={`badge ${m.status === 'completed' ? 'badge-gray' : 'badge-blue'}`}>{m.status}</span>
              </div>
              <textarea
                className="form-input"
                rows={3}
                placeholder="Add strategy notes, tactics, observations for this match..."
                value={notes[m._id] || ''}
                onChange={(e) => setNotes((prev) => ({ ...prev, [m._id]: e.target.value }))}
                style={{ resize: 'vertical', marginBottom: '0.75rem' }}
              />
              <button
                className="btn btn-primary btn-sm"
                onClick={() => saveNote(m._id)}
                disabled={saving[m._id]}
              >
                {saving[m._id] ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Save size={14} />}
                {saving[m._id] ? 'Saving...' : 'Save Notes'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

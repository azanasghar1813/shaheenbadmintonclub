import { useEffect, useState } from 'react';
import { Plus, Trash2, Users, Trophy, Settings, Play, X, ChevronDown, ChevronRight } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const EMPTY_TOURNAMENT = { name: '', description: '', date: '', format: 'knockout', venue: '', maxTeams: 8 };

export default function AdminTournaments() {
  const [tournaments, setTournaments] = useState([]);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY_TOURNAMENT);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(null); // tournament id for team builder
  const [teams, setTeams] = useState({});          // { tournamentId: [...teams] }
  const [teamForm, setTeamForm] = useState({ name: '', players: [], color: '#3b82f6' });
  const [addingTeam, setAddingTeam] = useState(null); // tournament id

  const load = () => {
    Promise.all([api.get('/tournaments'), api.get('/players')])
      .then(([t, p]) => { setTournaments(t.data); setPlayers(p.data); })
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const loadTeams = (tid) => {
    api.get(`/tournaments/${tid}/teams`).then(({ data }) => setTeams((prev) => ({ ...prev, [tid]: data })));
  };

  const toggleExpand = (tid) => {
    if (expanded === tid) { setExpanded(null); return; }
    setExpanded(tid);
    loadTeams(tid);
  };

  const handleCreate = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await api.post('/tournaments', form);
      toast.success('Tournament created');
      setModal(false); setForm(EMPTY_TOURNAMENT); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete tournament and all its data?')) return;
    await api.delete(`/tournaments/${id}`);
    toast.success('Tournament deleted'); load();
  };

  const handleAddTeam = async (tid) => {
    if (!teamForm.name) return toast.error('Team name required');
    try {
      await api.post(`/tournaments/${tid}/teams`, teamForm);
      toast.success('Team added');
      setAddingTeam(null); setTeamForm({ name: '', players: [], color: '#3b82f6' });
      loadTeams(tid);
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const handleDeleteTeam = async (tid, teamId) => {
    await api.delete(`/tournaments/${tid}/teams/${teamId}`);
    toast.success('Team removed'); loadTeams(tid);
  };

  const handleGenerate = async (tid) => {
    if (!confirm('Generate bracket/schedule? This cannot be undone.')) return;
    try {
      const { data } = await api.post(`/tournaments/${tid}/generate`);
      toast.success(`${data.matchCount} matches generated!`);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const togglePlayerInTeam = (pid) => {
    setTeamForm((f) => ({
      ...f,
      players: f.players.includes(pid) ? f.players.filter((p) => p !== pid) : [...f.players, pid],
    }));
  };

  return (
    <div>
      <div className="page-header flex-between">
        <div><h1>Tournaments</h1><p>Create and manage competitions</p></div>
        <button className="btn btn-primary" onClick={() => setModal(true)}><Plus size={18} /> New Tournament</button>
      </div>

      {loading ? <div className="loading-page"><div className="spinner" /></div> : tournaments.length === 0 ? (
        <div className="empty-state card"><div className="empty-icon">🏆</div><h3>No tournaments yet</h3></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {tournaments.map((t) => (
            <div key={t._id} className="card">
              {/* Tournament Header */}
              <div className="flex-between" style={{ cursor: 'pointer' }} onClick={() => toggleExpand(t._id)}>
                <div className="flex-gap">
                  <Trophy size={18} style={{ color: 'var(--color-gold)' }} />
                  <div>
                    <div style={{ fontWeight: 700 }}>{t.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {format(new Date(t.date), 'MMM d, yyyy')} · {t.format}
                    </div>
                  </div>
                </div>
                <div className="flex-gap">
                  <span className={`badge ${t.status === 'active' ? 'badge-green' : t.status === 'upcoming' ? 'badge-blue' : 'badge-gray'}`}>{t.status}</span>
                  {!t.bracketGenerated && (
                    <button className="btn btn-primary btn-sm" onClick={(e) => { e.stopPropagation(); handleGenerate(t._id); }}>
                      <Play size={13} /> Generate
                    </button>
                  )}
                  <button className="btn btn-danger btn-icon btn-sm" onClick={(e) => { e.stopPropagation(); handleDelete(t._id); }}><Trash2 size={14} /></button>
                  {expanded === t._id ? <ChevronDown size={18} style={{ color: 'var(--text-muted)' }} /> : <ChevronRight size={18} style={{ color: 'var(--text-muted)' }} />}
                </div>
              </div>

              {/* Team Builder */}
              {expanded === t._id && (
                <div style={{ marginTop: '1.25rem', borderTop: '1px solid var(--color-border)', paddingTop: '1.25rem' }}>
                  <div className="flex-between" style={{ marginBottom: '0.75rem' }}>
                    <h3 style={{ fontSize: '0.95rem' }}><Users size={16} style={{ display: 'inline', marginRight: '6px' }} />Teams</h3>
                    <button className="btn btn-ghost btn-sm" onClick={() => setAddingTeam(addingTeam === t._id ? null : t._id)}>
                      <Plus size={14} /> Add Team
                    </button>
                  </div>

                  {/* Add Team Form */}
                  {addingTeam === t._id && (
                    <div className="card" style={{ background: 'var(--color-surface-2)', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                        <input className="form-input" placeholder="Team name" value={teamForm.name} onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })} style={{ flex: 1, minWidth: 160 }} />
                        <div className="flex-gap">
                          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Color:</label>
                          <input type="color" value={teamForm.color} onChange={(e) => setTeamForm({ ...teamForm, color: e.target.value })} style={{ width: 36, height: 36, border: 'none', background: 'none', cursor: 'pointer' }} />
                        </div>
                      </div>
                      <div style={{ marginBottom: '0.75rem' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Select Players:</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', maxHeight: 120, overflowY: 'auto' }}>
                          {players.map((p) => (
                            <button key={p._id} type="button" className={`btn btn-sm ${teamForm.players.includes(p._id) ? 'btn-primary' : 'btn-ghost'}`} onClick={() => togglePlayerInTeam(p._id)}>
                              {p.name}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex-gap">
                        <button className="btn btn-primary btn-sm" onClick={() => handleAddTeam(t._id)}>Add Team</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setAddingTeam(null)}>Cancel</button>
                      </div>
                    </div>
                  )}

                  {/* Teams List */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                    {(teams[t._id] || []).length === 0 ? (
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No teams yet. Add teams before generating the bracket.</p>
                    ) : (
                      (teams[t._id] || []).map((team) => (
                        <div key={team._id} className="card" style={{ padding: '0.75rem 1rem', minWidth: 140 }}>
                          <div className="flex-between" style={{ marginBottom: '0.35rem' }}>
                            <div className="flex-gap">
                              <div style={{ width: 10, height: 10, borderRadius: '50%', background: team.color || '#3b82f6', flexShrink: 0 }} />
                              <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{team.name}</span>
                            </div>
                            <button className="btn btn-danger btn-icon" style={{ padding: '0.2rem' }} onClick={() => handleDeleteTeam(t._id, team._id)}><X size={12} /></button>
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            {team.players?.map((p) => p.name).join(', ') || 'No players'}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Tournament Modal */}
      {modal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2>New Tournament</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Tournament Name *</label>
                <input className="form-input" placeholder="e.g. Summer Open 2024" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input" rows={2} placeholder="Brief description..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ resize: 'vertical' }} />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Date *</label>
                  <input className="form-input" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Format</label>
                  <select className="form-input" value={form.format} onChange={(e) => setForm({ ...form, format: e.target.value })}>
                    <option value="knockout">Knockout</option>
                    <option value="round-robin">Round Robin</option>
                  </select>
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Venue</label>
                  <input className="form-input" placeholder="Court name..." value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Max Teams</label>
                  <input className="form-input" type="number" min={2} max={64} value={form.maxTeams} onChange={(e) => setForm({ ...form, maxTeams: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer" style={{ margin: 0, padding: 0 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <span className="spinner" style={{ width: 16, height: 16 }} /> : <Trophy size={16} />}
                  {saving ? 'Creating...' : 'Create Tournament'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

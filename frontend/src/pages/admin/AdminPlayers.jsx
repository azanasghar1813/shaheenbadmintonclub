import { useEffect, useState, useRef } from 'react';
import { Plus, Edit2, Trash2, User, X, Upload, CheckCircle, Ban, ArrowLeftRight, BarChart2 } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const SKILLS = ['Beginner', 'Intermediate', 'Advanced', 'Professional'];
const EMPTY_FORM = { name: '', skillLevel: 'Intermediate', position: '', phone: '' };

export default function AdminPlayers() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editPlayer, setEditPlayer] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [statsModal, setStatsModal] = useState(false);
  const [statsPlayer, setStatsPlayer] = useState(null);
  const [statsForm, setStatsForm] = useState({ wins: 0, losses: 0, gamesPlayed: 0, tournamentsPlayed: 0, tournamentsWon: 0 });
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('approved'); // 'approved', 'pending', 'restricted'
  const fileRef = useRef();
  const { admin } = useAuth();

  const load = () => {
    api.get('/players?status=all').then(({ data }) => setPlayers(data)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const filteredPlayers = players.filter(p => p.status === tab);

  const openAdd = () => { setEditPlayer(null); setForm(EMPTY_FORM); setPhoto(null); setPhotoPreview(''); setModal(true); };
  const openEdit = (p) => { setEditPlayer(p); setForm({ name: p.name, skillLevel: p.skillLevel, position: p.position || '', phone: p.phone || '' }); setPhotoPreview(p.photo?.url || ''); setPhoto(null); setModal(true); };
  const closeModal = () => { setModal(false); setEditPlayer(null); };

  const openStats = (p) => {
    setStatsPlayer(p);
    setStatsForm({
      wins: p.stats.wins,
      losses: p.stats.losses,
      gamesPlayed: p.stats.gamesPlayed,
      tournamentsPlayed: p.stats.tournamentsPlayed,
      tournamentsWon: p.stats.tournamentsWon,
    });
    setStatsModal(true);
  };
  const closeStats = () => { setStatsModal(false); setStatsPlayer(null); };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (photo) fd.append('photo', photo);

      if (editPlayer) {
        await api.put(`/players/${editPlayer._id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Player updated');
      } else {
        await api.post('/players', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Player added');
      }
      closeModal();
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving player');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this player? This cannot be undone.')) return;
    try {
      await api.delete(`/players/${id}`);
      toast.success('Player deleted');
      load();
    } catch {
      toast.error('Failed to delete player');
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.put(`/players/${id}/status`, { status: newStatus });
      toast.success(`Player moved to ${newStatus}`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleStatsSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch(`/players/${statsPlayer._id}/stats`, statsForm);
      toast.success('Stats updated');
      closeStats();
      load();
    } catch (err) {
      toast.error('Failed to update stats');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="page-header flex-between">
        <div>
          <h1>Players</h1>
          <p>Manage club members</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={18} /> Add Player</button>
      </div>

      <div className="tabs" style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', borderBottom: '1px solid var(--color-border)' }}>
        {['approved', 'pending', 'restricted'].map(t => (
          <button 
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '0.5rem 1rem',
              background: 'none',
              border: 'none',
              borderBottom: tab === t ? '2px solid var(--color-primary)' : '2px solid transparent',
              color: tab === t ? 'var(--text-primary)' : 'var(--text-muted)',
              cursor: 'pointer',
              fontWeight: tab === t ? 600 : 400,
              textTransform: 'capitalize'
            }}
          >
            {t} ({players.filter(p => p.status === t).length})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-page"><div className="spinner" /></div>
      ) : filteredPlayers.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-icon">🏸</div>
          <h3>No {tab} players</h3>
        </div>
      ) : (
        <div className="card table-wrapper">
          <table className="table">
            <thead><tr><th>Player</th><th>Level</th><th>Position</th><th>Wins</th><th>Losses</th><th>Win Rate</th><th>Actions</th></tr></thead>
            <tbody>
              {filteredPlayers.map((p) => (
                <tr key={p._id}>
                  <td>
                    <div className="flex-gap">
                      <div className="player-thumb">
                        {p.photo?.url ? <img src={p.photo.url} alt={p.name} /> : <User size={14} />}
                      </div>
                      {p.name}
                    </div>
                  </td>
                  <td><span className="badge badge-teal">{p.skillLevel}</span></td>
                  <td style={{ color: 'var(--text-muted)' }}>{p.position || '—'}</td>
                  <td style={{ color: '#4ade80', fontWeight: 600 }}>{p.stats.wins}</td>
                  <td style={{ color: 'var(--color-red)' }}>{p.stats.losses}</td>
                  <td style={{ color: 'var(--color-primary)' }}>{p.winRate}%</td>
                  <td>
                    <div className="flex-gap">
                      {tab === 'pending' && (
                        <>
                          <button className="btn btn-primary btn-sm" onClick={() => handleStatusChange(p._id, 'approved')}><CheckCircle size={14} /> Approve</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p._id)}><X size={14} /> Reject</button>
                        </>
                      )}
                      
                      {tab === 'approved' && (
                        <>
                          <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openStats(p)} title="Edit Stats"><BarChart2 size={15} /></button>
                          <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(p)} title="Edit"><Edit2 size={15} /></button>
                          {admin?.isGeneral && (
                            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleStatusChange(p._id, 'restricted')} title="Restrict" style={{ color: 'var(--color-red)' }}><Ban size={15} /></button>
                          )}
                          <button className="btn btn-danger btn-icon btn-sm" onClick={() => handleDelete(p._id)} title="Delete"><Trash2 size={15} /></button>
                        </>
                      )}

                      {tab === 'restricted' && (
                        <>
                          {admin?.isGeneral && (
                            <button className="btn btn-primary btn-sm" onClick={() => handleStatusChange(p._id, 'approved')}><ArrowLeftRight size={14} /> Unrestrict</button>
                          )}
                          <button className="btn btn-danger btn-icon btn-sm" onClick={() => handleDelete(p._id)} title="Delete"><Trash2 size={15} /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="modal">
            <div className="modal-header">
              <h2>{editPlayer ? 'Edit Player' : 'Add Player'}</h2>
              <button className="btn btn-ghost btn-icon" onClick={closeModal}><X size={18} /></button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Photo Upload */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                <div className="player-photo-upload" onClick={() => fileRef.current.click()}>
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' }}>
                      <Upload size={24} style={{ color: 'var(--text-muted)' }} />
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Upload Photo</span>
                    </div>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoChange} />
                {photoPreview && <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setPhoto(null); setPhotoPreview(''); }}>Remove Photo</button>}
              </div>

              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input className="form-input" placeholder="e.g. Ahmed Khan" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Skill Level</label>
                  <select className="form-input" value={form.skillLevel} onChange={(e) => setForm({ ...form, skillLevel: e.target.value })}>
                    {SKILLS.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Position</label>
                  <input className="form-input" placeholder="e.g. Singles" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Phone (optional)</label>
                <input className="form-input" placeholder="+92..." value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>

              <div className="modal-footer" style={{ margin: 0, padding: 0 }}>
                <button type="button" className="btn btn-ghost" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <span className="spinner" style={{ width: 16, height: 16 }} /> : null}
                  {saving ? 'Saving...' : editPlayer ? 'Update Player' : 'Add Player'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stats Modal */}
      {statsModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && closeStats()}>
          <div className="modal">
            <div className="modal-header">
              <h2>Edit Stats - {statsPlayer?.name}</h2>
              <button className="btn btn-ghost btn-icon" onClick={closeStats}><X size={18} /></button>
            </div>

            <form onSubmit={handleStatsSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Wins</label>
                  <input type="number" className="form-input" value={statsForm.wins} onChange={(e) => setStatsForm({ ...statsForm, wins: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Losses</label>
                  <input type="number" className="form-input" value={statsForm.losses} onChange={(e) => setStatsForm({ ...statsForm, losses: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Games Played</label>
                  <input type="number" className="form-input" value={statsForm.gamesPlayed} onChange={(e) => setStatsForm({ ...statsForm, gamesPlayed: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Tournaments Played</label>
                  <input type="number" className="form-input" value={statsForm.tournamentsPlayed} onChange={(e) => setStatsForm({ ...statsForm, tournamentsPlayed: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Tournaments Won</label>
                  <input type="number" className="form-input" value={statsForm.tournamentsWon} onChange={(e) => setStatsForm({ ...statsForm, tournamentsWon: e.target.value })} required />
                </div>
              </div>

              <div className="modal-footer" style={{ margin: 0, padding: 0 }}>
                <button type="button" className="btn btn-ghost" onClick={closeStats}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <span className="spinner" style={{ width: 16, height: 16 }} /> : null}
                  {saving ? 'Saving...' : 'Update Stats'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .player-thumb { width: 30px; height: 30px; border-radius: 50%; overflow: hidden; background: var(--color-surface-2); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .player-thumb img { width: 100%; height: 100%; object-fit: cover; }
        .player-photo-upload { width: 90px; height: 90px; border-radius: 50%; border: 2px dashed var(--color-border-2); cursor: pointer; display: flex; align-items: center; justify-content: center; overflow: hidden; transition: border-color var(--transition); }
        .player-photo-upload:hover { border-color: var(--color-primary); }
      `}</style>
    </div>
  );
}

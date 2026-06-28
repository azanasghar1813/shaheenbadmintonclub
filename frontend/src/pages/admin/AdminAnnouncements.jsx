import { useEffect, useState } from 'react';
import { Plus, Trash2, Pin, X, Edit2 } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const safeFormat = (dateStr, fmt) => {
  if (!dateStr) return 'Date Unknown';
  const d = new Date(dateStr);
  if (isNaN(d)) return 'Date Unknown';
  try { return format(d, fmt); } catch { return 'Date Unknown'; }
};

const CATEGORIES = ['general', 'tournament', 'result', 'schedule', 'urgent'];
const EMPTY = { title: '', body: '', pinned: false, category: 'general' };

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = () => {
    api.get('/announcements?limit=50')
      .then(({ data }) => setAnnouncements(data))
      .catch(err => toast.error('Failed to load announcements'))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditItem(null); setForm(EMPTY); setModal(true); };
  const openEdit = (a) => { setEditItem(a); setForm({ title: a.title, body: a.body, pinned: a.pinned, category: a.category }); setModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editItem) {
        await api.put(`/announcements/${editItem._id}`, form);
        toast.success('Announcement updated');
      } else {
        await api.post('/announcements', form);
        toast.success('Announcement published');
      }
      setModal(false); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this announcement?')) return;
    await api.delete(`/announcements/${id}`);
    toast.success('Deleted'); load();
  };

  const togglePin = async (a) => {
    await api.put(`/announcements/${a._id}`, { pinned: !a.pinned });
    load();
  };

  const catColor = { general:'badge-gray', tournament:'badge-teal', result:'badge-green', schedule:'badge-blue', urgent:'badge-red' };

  return (
    <div>
      <div className="page-header flex-between">
        <div><h1>Announcements</h1><p>Publish and manage club news</p></div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={18} /> New Announcement</button>
      </div>

      {loading ? <div className="loading-page"><div className="spinner" /></div> : announcements.length === 0 ? (
        <div className="empty-state card"><div className="empty-icon">📢</div><h3>No announcements yet</h3></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {announcements.map((a) => (
            <div key={a._id} className={`card ${a.pinned ? 'pinned-card' : ''}`}>
              <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
                <div className="flex-gap">
                  {a.pinned && <Pin size={14} style={{ color: 'var(--color-primary)' }} />}
                  <span className={`badge ${catColor[a.category] || 'badge-gray'}`}>{a.category}</span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {safeFormat(a.createdAt, 'MMM d, yyyy')}
                  </span>
                </div>
                <div className="flex-gap">
                  <button className={`btn btn-icon btn-sm ${a.pinned ? 'btn-primary' : 'btn-ghost'}`} onClick={() => togglePin(a)} title={a.pinned ? 'Unpin' : 'Pin'}>
                    <Pin size={14} />
                  </button>
                  <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(a)}><Edit2 size={14} /></button>
                  <button className="btn btn-danger btn-icon btn-sm" onClick={() => handleDelete(a._id)}><Trash2 size={14} /></button>
                </div>
              </div>
              <h3 style={{ fontSize: '1rem', marginBottom: '0.3rem' }}>{a.title}</h3>
              <p style={{ fontSize: '0.875rem', whiteSpace: 'pre-wrap' }}>{a.body}</p>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2>{editItem ? 'Edit Announcement' : 'New Announcement'}</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input className="form-input" placeholder="Announcement title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ justifyContent: 'flex-end' }}>
                  <label className="form-label">Pin to Top</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.pinned} onChange={(e) => setForm({ ...form, pinned: e.target.checked })} style={{ width: 16, height: 16, accentColor: 'var(--color-primary)' }} />
                    <span style={{ fontSize: '0.9rem' }}>Pin this announcement</span>
                  </label>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Body *</label>
                <textarea className="form-input" rows={5} placeholder="Write your announcement here..." value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} required style={{ resize: 'vertical' }} />
              </div>
              <div className="modal-footer" style={{ margin: 0, padding: 0 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : editItem ? 'Update' : 'Publish'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <style>{`.pinned-card { border-color: rgba(0,212,170,0.25) !important; background: rgba(0,212,170,0.03); }`}</style>
    </div>
  );
}

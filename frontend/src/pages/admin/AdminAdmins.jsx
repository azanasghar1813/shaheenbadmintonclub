import { useEffect, useState } from 'react';
import { Plus, UserX, UserCheck, ShieldAlert, Shield, X, Save } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const EMPTY_FORM = { username: '', password: '', contactName: '', contactNumber: '' };

export default function AdminAdmins() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = () => {
    api.get('/admins').then(({ data }) => setAdmins(data)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/admins', form);
      toast.success('Admin added successfully');
      setModal(false);
      setForm(EMPTY_FORM);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error adding admin');
    } finally {
      setSaving(false);
    }
  };

  const toggleRestrict = async (id, currentStatus) => {
    if (!confirm(`Are you sure you want to ${currentStatus ? 'restrict' : 'unrestrict'} this admin?`)) return;
    try {
      await api.put(`/admins/${id}/restrict`);
      toast.success(`Admin ${currentStatus ? 'restricted' : 'unrestricted'}`);
      load();
    } catch (err) {
      toast.error('Failed to update admin status');
    }
  };

  return (
    <div>
      <div className="page-header flex-between">
        <div>
          <h1>Manage Admins</h1>
          <p>Add and manage Club Admins</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal(true)}>
          <Plus size={18} /> Add Club Admin
        </button>
      </div>

      {loading ? (
        <div className="loading-page"><div className="spinner" /></div>
      ) : admins.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-icon">🛡️</div>
          <h3>No Club Admins yet</h3>
          <button className="btn btn-primary" onClick={() => setModal(true)} style={{ marginTop: '1rem' }}>
            <Plus size={16} /> Add First Club Admin
          </button>
        </div>
      ) : (
        <div className="card table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Contact Name</th>
                <th>Contact Number</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((a) => (
                <tr key={a._id}>
                  <td style={{ fontWeight: 600 }}>{a.username}</td>
                  <td>{a.contactName || '—'}</td>
                  <td>{a.contactNumber || '—'}</td>
                  <td>
                    {a.isActive ? (
                      <span className="badge badge-teal">Active</span>
                    ) : (
                      <span className="badge badge-red">Restricted</span>
                    )}
                  </td>
                  <td>
                    <button 
                      className={`btn btn-sm ${a.isActive ? 'btn-danger' : 'btn-primary'}`} 
                      onClick={() => toggleRestrict(a._id, a.isActive)}
                    >
                      {a.isActive ? <><UserX size={14} /> Restrict</> : <><UserCheck size={14} /> Unrestrict</>}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2>Add Club Admin</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Username (Login ID) *</label>
                <input 
                  className="form-input" 
                  value={form.username} 
                  onChange={(e) => setForm({ ...form, username: e.target.value })} 
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Password *</label>
                <input 
                  type="password"
                  className="form-input" 
                  value={form.password} 
                  onChange={(e) => setForm({ ...form, password: e.target.value })} 
                  required 
                />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Contact Name *</label>
                  <input 
                    className="form-input" 
                    placeholder="E.g. Ahmed Ali"
                    value={form.contactName} 
                    onChange={(e) => setForm({ ...form, contactName: e.target.value })} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Contact Number *</label>
                  <input 
                    className="form-input" 
                    placeholder="E.g. +92 300..."
                    value={form.contactNumber} 
                    onChange={(e) => setForm({ ...form, contactNumber: e.target.value })} 
                    required 
                  />
                </div>
              </div>
              <div className="modal-footer" style={{ margin: 0, padding: 0 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Adding...' : 'Add Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

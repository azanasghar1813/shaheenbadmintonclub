import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Users, Calendar, ChevronRight, Pin, Zap } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const safeFormat = (dateStr, fmt) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return '';
  try { return format(d, fmt); } catch { return ''; }
};

import './Home.css';

export default function Home() {
  const [announcements, setAnnouncements] = useState([]);
  const [activeTournament, setActiveTournament] = useState(null);
  const [stats, setStats] = useState({ players: 0, tournaments: 0 });
  const [loading, setLoading] = useState(true);
  
  const [admins, setAdmins] = useState([]);
  const [joinModal, setJoinModal] = useState(false);
  const [joinForm, setJoinForm] = useState({ name: '', phone: '', skillLevel: 'Beginner', position: '' });
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [joining, setJoining] = useState(false);
  const fileRef = useRef();

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  useEffect(() => {
    Promise.all([
      api.get('/announcements?limit=5'),
      api.get('/tournaments?status=active'),
      api.get('/players'),
      api.get('/tournaments'),
      api.get('/admins/public').catch(() => ({ data: [] })),
    ]).then(([ann, active, players, tours, adms]) => {
      setAnnouncements(ann.data);
      setActiveTournament(active.data[0] || null);
      setStats({ players: players.data.length, tournaments: tours.data.length });
      setAdmins(adms.data);
    }).finally(() => setLoading(false));
  }, []);

  const handleJoin = async (e) => {
    e.preventDefault();
    setJoining(true);
    try {
      const fd = new FormData();
      Object.entries(joinForm).forEach(([k, v]) => fd.append(k, v));
      if (photo) fd.append('photo', photo);

      await api.post('/players/join', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Request submitted! Wait for an admin to approve.');
      setJoinModal(false);
      setJoinForm({ name: '', phone: '', skillLevel: 'Beginner', position: '' });
      setPhoto(null);
      setPhotoPreview('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error submitting request');
    } finally {
      setJoining(false);
    }
  };

  const categoryColors = { general:'badge-gray', tournament:'badge-teal', result:'badge-green', schedule:'badge-blue', urgent:'badge-red' };

  return (
    <div>
      {/* ── Hero ── */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="container hero-content">

          <h1 className="hero-title">
            Shaheen <br />
            <span className="gradient-text">Badminton Club</span>
          </h1>
          <p className="hero-subtitle">
            Track tournaments, players, and live brackets — all in one place.
            The official digital home of Shaheen Club.
          </p>
          <div className="hero-actions">
            <Link to="/tournaments" className="btn btn-primary btn-lg">
              <Trophy size={18} /> View Tournaments
            </Link>
            <button className="btn btn-ghost btn-lg" onClick={() => setJoinModal(true)}>
              <Zap size={18} /> Join Club
            </button>
          </div>

          {/* Quick Stats */}
          <div className="hero-stats">
            <div className="hero-stat">
              <span className="hero-stat-value">{stats.players}</span>
              <span className="hero-stat-label">Players</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="hero-stat-value">{stats.tournaments}</span>
              <span className="hero-stat-label">Tournaments</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="hero-stat-value">{activeTournament ? '1' : '0'}</span>
              <span className="hero-stat-label">Live Now</span>
            </div>
          </div>
        </div>
      </section>

      <div className="container page">
        <div className="home-grid">
          {/* ── Active Tournament Card ── */}
          {activeTournament && (
            <section className="home-featured">
              <h2 className="section-title"><Trophy size={20} /> Live Tournament</h2>
              <Link to={`/tournaments/${activeTournament._id}`} className="featured-card card card-glow">
                <div className="flex-between">
                  <span className="badge badge-green">● Active</span>
                  <span className="badge badge-teal">{activeTournament.format}</span>
                </div>
                <h3 style={{ fontSize: '1.5rem', margin: '0.75rem 0 0.35rem' }}>
                  {activeTournament.name}
                </h3>
                <p style={{ marginBottom: '1rem' }}>
                  {activeTournament.venue && `${activeTournament.venue} · `}
                  {format(new Date(activeTournament.date), 'MMM d, yyyy')}
                </p>
                <div className="btn btn-primary">
                  View Bracket <ChevronRight size={16} />
                </div>
              </Link>
            </section>
          )}

          {/* ── Announcements ── */}
          <section className="home-announcements">
            <h2 className="section-title"><Pin size={20} /> Announcements</h2>
            {loading ? (
              <div className="loading-page"><div className="spinner" /></div>
            ) : announcements.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📢</div>
                <h3>No announcements yet</h3>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {announcements.map((a) => (
                  <div key={a._id} className={`announcement-item ${a.pinned ? 'pinned' : ''}`}>
                    <div className="announcement-header">
                      <span className={`badge ${categoryColors[a.category] || 'badge-gray'}`}>
                        {a.category}
                      </span>
                      {a.pinned && <Pin size={13} className="pin-icon" />}
                      <span className="announcement-date">
                        {safeFormat(a.createdAt, 'MMM d')}
                      </span>
                    </div>
                    <h4 className="announcement-title">{a.title}</h4>
                    <p className="announcement-body">{a.body}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* ── Contact Admins ── */}
        {!loading && admins.length > 0 && (
          <section className="home-admins" style={{ marginTop: '3rem', paddingBottom: '3rem' }}>
            <h2 className="section-title"><Users size={20} /> Contact Club Admins</h2>
            <div className="grid-2" style={{ marginTop: '1rem' }}>
              {admins.map((adm, idx) => (
                <div key={idx} className="card flex-gap">
                  <div className="player-thumb" style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--color-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}>
                    {adm.contactName ? adm.contactName[0].toUpperCase() : 'A'}
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{adm.contactName || adm.username}</h4>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>{adm.contactNumber || 'No number provided'}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Join Modal */}
      {joinModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setJoinModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2>Join Shaheen Club</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setJoinModal(false)}>✕</button>
            </div>
            <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                <div onClick={() => fileRef.current.click()} style={{ width: 90, height: 90, borderRadius: '50%', border: '2px dashed var(--color-border-2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: 'var(--color-surface-2)' }}>
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}>
                      <span style={{ fontSize: '1.5rem' }}>📸</span>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Optional Pic</span>
                    </div>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoChange} />
                {photoPreview && <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setPhoto(null); setPhotoPreview(''); }}>Remove Photo</button>}
              </div>

              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input className="form-input" value={joinForm.name} onChange={e => setJoinForm({...joinForm, name: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number *</label>
                <input className="form-input" value={joinForm.phone} onChange={e => setJoinForm({...joinForm, phone: e.target.value})} required />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Skill Level</label>
                  <select className="form-input" value={joinForm.skillLevel} onChange={e => setJoinForm({...joinForm, skillLevel: e.target.value})}>
                    {['Beginner', 'Intermediate', 'Advanced', 'Professional'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Position</label>
                  <input className="form-input" placeholder="e.g. Singles" value={joinForm.position} onChange={e => setJoinForm({...joinForm, position: e.target.value})} />
                </div>
              </div>
              <div className="modal-footer" style={{ margin: 0, padding: 0 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setJoinModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={joining}>
                  {joining ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

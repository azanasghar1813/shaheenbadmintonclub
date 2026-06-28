import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { ArrowLeft, Feather, Lock, User, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import './AdminLogin.css';

export default function AdminLogin() {
  const { login } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(username, password);
      toast.success('Welcome back, Admin!');
      navigate('/admin/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg" />
      <button className="btn btn-ghost" onClick={() => navigate('/')} style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', zIndex: 10 }}>
        <ArrowLeft size={18} /> Back to Website
      </button>
      <div className="login-card">
        <div className="login-logo">
          <div className="brand-icon" style={{ width: '100%', maxWidth: '140px', height: 'auto', margin: '0 auto', overflow: 'hidden' }}>
            <img src={theme === 'dark' ? '/logo_darkmode.png' : '/logo_lightmode.png'} alt="Logo" style={{ width: '100%', height: 'auto', objectFit: 'contain' }} />
          </div>
        </div>
        <h1 className="login-title">Admin Login</h1>
        <p className="login-sub">Shaheen Badminton Club Management</p>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label className="form-label">Username</label>
            <div className="input-icon-wrap">
              <User size={16} className="input-icon" />
              <input
                id="admin-username"
                className="form-input"
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-icon-wrap">
              <Lock size={16} className="input-icon" />
              <input
                id="admin-password"
                className="form-input"
                type={showPw ? 'text' : 'password'}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ paddingRight: '2.75rem' }}
              />
              <button type="button" className="pw-toggle" onClick={() => setShowPw(!showPw)}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button className="btn btn-primary btn-lg" type="submit" disabled={loading} style={{ width: '100%', marginTop: '0.5rem' }}>
            {loading ? <span className="spinner" style={{ width: 18, height: 18 }} /> : <Lock size={16} />}
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { LayoutDashboard, Users, Trophy, Swords, Megaphone, BookOpen, LogOut, Menu, X, Sun, Moon, UserCog } from 'lucide-react';
import { useState } from 'react';
import './AdminLayout.css';

const NAV_ITEMS = [
  { to: '/admin/dashboard',      icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/players',        icon: Users,           label: 'Players' },
  { to: '/admin/tournaments',    icon: Trophy,          label: 'Tournaments' },
  { to: '/admin/matches',        icon: Swords,          label: 'Matches' },
  { to: '/admin/announcements',  icon: Megaphone,       label: 'Announcements' },
  { to: '/admin/strategy',       icon: BookOpen,        label: 'Strategy' },
  { to: '/admin/team-maker',     icon: Users,           label: 'Team Maker' },
];

const GENERAL_ADMIN_ITEMS = [
  { to: '/admin/admins',         icon: UserCog,         label: 'Manage Admins' },
];

export default function AdminLayout({ children }) {
  const { admin, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/admin/login'); };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <Link to="/" className="sidebar-brand">
            <div className="brand-icon" style={{ width: 48, height: 48, overflow: 'hidden' }}>
              <img src={theme === 'dark' ? '/logo_darkmode.png' : '/logo_lightmode.png'} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <span>Shaheen Admin</span>
          </Link>
          <button className="sidebar-close" onClick={() => setSidebarOpen(false)}><X size={18} /></button>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to} to={to}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
          {admin?.isGeneral && GENERAL_ADMIN_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to} to={to}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="user-avatar" style={{ flexShrink: 0 }}>{admin?.username?.[0]?.toUpperCase()}</div>
            <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{admin?.username}</div>
              {admin?.isGeneral ? (
                <div style={{ fontSize: '0.7rem', color: 'var(--color-primary)' }}>General Admin</div>
              ) : (
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Club Admin</div>
              )}
            </div>
            <button className="btn btn-ghost btn-icon" onClick={toggleTheme} aria-label="Toggle theme" style={{ padding: '0.4rem', marginRight: '0.25rem' }}>
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button className="btn btn-ghost btn-icon" onClick={handleLogout} title="Logout" style={{ padding: '0.4rem', color: 'var(--color-red)' }}>
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <div className="admin-main">
        <header className="admin-topbar">
          <button className="sidebar-toggle" onClick={() => setSidebarOpen(true)}>
            <Menu size={22} />
          </button>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Admin Panel</div>
        </header>
        <main className="admin-content">{children}</main>
      </div>
    </div>
  );
}

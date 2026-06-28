import { Link, NavLink, useLocation } from 'react-router-dom';
import { Feather, Menu, X, Moon, Sun } from 'lucide-react';
import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import './Navbar.css';

const links = [
  { to: '/',             label: 'Home' },
  { to: '/players',      label: 'Players' },
  { to: '/tournaments',  label: 'Tournaments' },
  { to: '/leaderboard',  label: 'Leaderboard' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="navbar-brand">
          <div className="brand-icon" style={{ overflow: 'hidden' }}>
            <img src={theme === 'dark' ? '/logo_darkmode.png' : '/logo_lightmode.png'} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <span>Shaheen <span className="brand-accent">Club</span></span>
        </Link>

        <div className={`navbar-links ${open ? 'open' : ''}`}>
          {links.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setOpen(false)}
            >
              {label}
            </NavLink>
          ))}
          <button className="btn btn-ghost btn-icon" onClick={toggleTheme} aria-label="Toggle theme" style={{ padding: '0.4rem' }}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <Link to="/admin/login" className="btn btn-primary btn-sm" onClick={() => setOpen(false)}>
            Admin
          </Link>
        </div>

        <button className="navbar-toggle" onClick={() => setOpen(!open)} aria-label="Toggle menu">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
    </nav>
  );
}

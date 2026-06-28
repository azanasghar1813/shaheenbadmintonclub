import { Link } from 'react-router-dom';
import { Feather } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import './Footer.css';

export default function Footer() {
  const { theme } = useTheme();
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-brand">
          <div className="flex-gap">
            <div className="brand-icon" style={{ width: 40, height: 40, overflow: 'hidden' }}>
              <img src={theme === 'dark' ? '/logo_darkmode.png' : '/logo_lightmode.png'} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>
              Shaheen Badminton Club
            </span>
          </div>
          <p style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
            Smashing records, one rally at a time.
          </p>
        </div>

        <div className="footer-links">
          <Link to="/">Home</Link>
          <Link to="/players">Players</Link>
          <Link to="/tournaments">Tournaments</Link>
          <Link to="/leaderboard">Leaderboard</Link>
        </div>

        <div className="footer-copy">
          © {new Date().getFullYear()} Shaheen Badminton Club. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

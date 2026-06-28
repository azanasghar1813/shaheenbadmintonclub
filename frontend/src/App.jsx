import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Public pages
import Home from './pages/public/Home';
import Players from './pages/public/Players';
import PlayerProfile from './pages/public/PlayerProfile';
import Tournaments from './pages/public/Tournaments';
import TournamentDetail from './pages/public/TournamentDetail';
import Leaderboard from './pages/public/Leaderboard';

// Admin pages
import AdminLogin from './pages/admin/AdminLogin';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminPlayers from './pages/admin/AdminPlayers';
import AdminTournaments from './pages/admin/AdminTournaments';
import AdminMatches from './pages/admin/AdminMatches';
import AdminAnnouncements from './pages/admin/AdminAnnouncements';
import AdminStrategy from './pages/admin/AdminStrategy';
import AdminAdmins from './pages/admin/AdminAdmins';
import AdminTeamMaker from './pages/admin/AdminTeamMaker';

import './index.css';

function PublicLayout({ children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ flex: 1 }}>{children}</main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: 'var(--color-surface)',
                color: 'var(--text-primary)',
                border: '1px solid var(--color-border-2)',
                borderRadius: '10px',
              },
              success: { iconTheme: { primary: '#00d4aa', secondary: '#000' } },
            }}
          />
          <Routes>
            {/* ── Public ── */}
            <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
            <Route path="/players" element={<PublicLayout><Players /></PublicLayout>} />
            <Route path="/players/:id" element={<PublicLayout><PlayerProfile /></PublicLayout>} />
            <Route path="/tournaments" element={<PublicLayout><Tournaments /></PublicLayout>} />
            <Route path="/tournaments/:id" element={<PublicLayout><TournamentDetail /></PublicLayout>} />
            <Route path="/leaderboard" element={<PublicLayout><Leaderboard /></PublicLayout>} />

            {/* ── Admin ── */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

            <Route path="/admin/dashboard" element={
              <ProtectedRoute><AdminLayout><AdminDashboard /></AdminLayout></ProtectedRoute>
            } />
            <Route path="/admin/players" element={
              <ProtectedRoute><AdminLayout><AdminPlayers /></AdminLayout></ProtectedRoute>
            } />
            <Route path="/admin/tournaments" element={
              <ProtectedRoute><AdminLayout><AdminTournaments /></AdminLayout></ProtectedRoute>
            } />
            <Route path="/admin/matches" element={
              <ProtectedRoute><AdminLayout><AdminMatches /></AdminLayout></ProtectedRoute>
            } />
            <Route path="/admin/announcements" element={
              <ProtectedRoute><AdminLayout><AdminAnnouncements /></AdminLayout></ProtectedRoute>
            } />
            <Route path="/admin/strategy" element={
              <ProtectedRoute><AdminLayout><AdminStrategy /></AdminLayout></ProtectedRoute>
            } />
            <Route path="/admin/team-maker" element={
              <ProtectedRoute><AdminLayout><AdminTeamMaker /></AdminLayout></ProtectedRoute>
            } />
            <Route path="/admin/admins" element={
              <ProtectedRoute><AdminLayout><AdminAdmins /></AdminLayout></ProtectedRoute>
            } />

            {/* 404 */}
            <Route path="*" element={
              <PublicLayout>
                <div className="container page" style={{ textAlign: 'center', paddingTop: '6rem' }}>
                  <div style={{ fontSize: '6rem', marginBottom: '1rem' }}>🏸</div>
                  <h1>404 — Page Not Found</h1>
                  <p style={{ marginTop: '0.5rem' }}>The shuttle went out of bounds.</p>
                </div>
              </PublicLayout>
            } />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useEffect, useRef, useState, useCallback } from 'react';
import HomePage       from './pages/HomePage';
import FamilyDirectory from './pages/FamilyDirectory';
import FamilyTree     from './pages/FamilyTree';
import Gallery        from './pages/Gallery';
import Complaints     from './pages/Complaints';
import Chat           from './pages/Chat';
import Education      from './pages/Education';
import Login          from './pages/Login';
import Register       from './pages/Register';
import Profile        from './pages/Profile';
import Admin          from './pages/Admin';
import Documents      from './pages/Documents';
import Videos        from './pages/Videos';
import Health        from './pages/Health';
import Farming       from './pages/Farming';
import Calendar      from './pages/Calendar';
import './App.css';

/* ── Idle timeout: 5 minutes → auto logout ── */
const IDLE_MS      = 5 * 60 * 1000;  // 5 minutes
const WARN_MS      = 30 * 1000;       // warn 30 sec before
const ACTIVITY_EVT = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

function IdleGuard() {
  const { user, logout } = useAuth();
  const navigate          = useNavigate();
  const [warning,   setWarning]   = useState(false);
  const [countdown, setCountdown] = useState(30);

  const warnTimer     = useRef(null);
  const logoutTimer   = useRef(null);
  const countdownInt  = useRef(null);

  const clearAll = useCallback(() => {
    clearTimeout(warnTimer.current);
    clearTimeout(logoutTimer.current);
    clearInterval(countdownInt.current);
  }, []);

  const doLogout = useCallback(async () => {
    clearAll();
    setWarning(false);
    try { await logout(); } catch (_) {}
    navigate('/');
  }, [logout, navigate, clearAll]);

  const resetTimer = useCallback(() => {
    if (!user) return;
    clearAll();
    setWarning(false);
    setCountdown(30);

    warnTimer.current = setTimeout(() => {
      setWarning(true);
      setCountdown(30);
      countdownInt.current = setInterval(() => {
        setCountdown(c => {
          if (c <= 1) { clearInterval(countdownInt.current); return 0; }
          return c - 1;
        });
      }, 1000);
    }, IDLE_MS - WARN_MS);

    logoutTimer.current = setTimeout(doLogout, IDLE_MS);
  }, [user, clearAll, doLogout]);

  /* Auto-logout when countdown hits 0 */
  useEffect(() => {
    if (warning && countdown === 0) doLogout();
  }, [warning, countdown, doLogout]);

  /* Attach activity listeners */
  useEffect(() => {
    if (!user) { clearAll(); setWarning(false); return; }
    ACTIVITY_EVT.forEach(e => window.addEventListener(e, resetTimer, { passive: true }));
    resetTimer();
    return () => {
      ACTIVITY_EVT.forEach(e => window.removeEventListener(e, resetTimer));
      clearAll();
    };
  }, [user, resetTimer, clearAll]);

  if (!warning || !user) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: '#fff', borderRadius: 20, padding: '32px 28px',
        maxWidth: 380, width: '90%', textAlign: 'center',
        boxShadow: '0 24px 60px rgba(0,0,0,0.35)',
        animation: 'modalSlideIn 0.25s cubic-bezier(.34,1.56,.64,1)',
      }}>
        <div style={{ fontSize: '3rem', marginBottom: 10 }}>⏰</div>
        <h2 style={{ color: '#1a6b3c', margin: '0 0 8px', fontSize: '1.2rem', fontWeight: 800 }}>
          Session Timeout Warning
        </h2>
        <p style={{ color: '#555', fontSize: '0.9rem', lineHeight: 1.6, margin: '0 0 16px' }}>
          You've been inactive for a while.<br />
          You will be automatically logged out in:
        </p>
        <div style={{
          fontSize: '3.5rem', fontWeight: 900, color: countdown <= 10 ? '#dc2626' : '#e8891a',
          lineHeight: 1, margin: '0 0 20px',
          transition: 'color 0.3s',
        }}>
          {countdown}s
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={doLogout} style={{
            flex: 1, padding: '11px', border: '1.5px solid #e5e7eb', borderRadius: 10,
            background: '#fff', color: '#555', fontWeight: 600, cursor: 'pointer', fontSize: '0.88rem',
          }}>
            Logout Now
          </button>
          <button onClick={resetTimer} style={{
            flex: 2, padding: '11px', border: 'none', borderRadius: 10,
            background: 'linear-gradient(135deg, #1a6b3c, #155c32)', color: '#fff',
            fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem',
            boxShadow: '0 4px 14px rgba(26,107,60,0.35)',
          }}>
            ✅ Stay Logged In
          </button>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <IdleGuard />
        <Routes>
          <Route path="/"           element={<HomePage />} />
          <Route path="/families"   element={<FamilyDirectory />} />
          <Route path="/family-tree"element={<FamilyTree />} />
          <Route path="/gallery"    element={<Gallery />} />
          <Route path="/complaints" element={<Complaints />} />
          <Route path="/chat"       element={<Chat />} />
          <Route path="/education"  element={<Education />} />
          <Route path="/login"      element={<Login />} />
          <Route path="/register"   element={<Register />} />
          <Route path="/profile"    element={<Profile />} />
          <Route path="/admin"      element={<Admin />} />
          <Route path="/documents"  element={<Documents />} />
          <Route path="/videos"     element={<Videos />} />
          <Route path="/health"     element={<Health />} />
          <Route path="/farming"    element={<Farming />} />
          <Route path="/calendar"   element={<Calendar />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;

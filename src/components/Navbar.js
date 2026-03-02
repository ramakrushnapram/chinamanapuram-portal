import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';

const NAV_LINKS = [
  { to: '/',            label: 'Home',        icon: '🏠', end: true },
  { to: '/families',   label: 'Families',    icon: '👨‍👩‍👧‍👦' },
  { to: '/family-tree',label: 'Family Tree', icon: '🌳' },
  { to: '/gallery',    label: 'Gallery',     icon: '🖼️' },
  { to: '/complaints', label: 'Complaints',  icon: '📣' },
  { to: '/chat',       label: 'Chat',        icon: '💬' },
  { to: '/education',  label: 'Education',   icon: '📚' },
  { to: '/documents',  label: 'Documents',   icon: '📂' },
];

const DEFAULT_TICKER = [
  '🎉 Ugadi Festival on March 10 – All families invited!',
  '🚧 Road repair work started on Main Street',
  '💧 Water supply restored in South Colony',
  '📚 Scholarship applications open for Class 10 students',
  '🏥 Free Health Camp on Sunday at Panchayat Office',
  '🏆 Chinamanapuram shortlisted for Swachh Gram Award 2026!',
];

function initials(name) {
  if (!name) return '?';
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

export default function Navbar() {
  const [open, setOpen]               = useState(false);
  const [tickerItems, setTickerItems] = useState(DEFAULT_TICKER);
  const [spPhoto, setSpPhoto]         = useState('');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const unsubTicker = onSnapshot(
      doc(db, 'settings', 'ticker'),
      snap => { if (snap.exists() && snap.data().items?.length) setTickerItems(snap.data().items); },
      () => {} // ignore permission errors — use default ticker
    );
    const unsubSp = onSnapshot(
      doc(db, 'settings', 'sarpanch'),
      snap => { if (snap.exists() && snap.data().photoURL) setSpPhoto(snap.data().photoURL); },
      () => {} // ignore permission errors — use default avatar
    );
    return () => { unsubTicker(); unsubSp(); };
  }, []);

  const tickerContent = [...tickerItems, ...tickerItems];

  async function handleLogout() {
    try {
      await logout();
      navigate('/');
    } catch (_) {}
    setOpen(false);
  }

  return (
    <div className="navbar-wrapper">

      {/* ── Government top bar ── */}
      <div className="gov-topbar">
        <div className="gov-topbar-inner">
          <div className="gov-topbar-left">
            <span className="gov-flag">🇮🇳</span>
            <span className="gov-topbar-text">
              Chinamanapuram Gram Panchayat &nbsp;·&nbsp; Gantyada Mandal &nbsp;·&nbsp; Vizianagaram District &nbsp;·&nbsp; Andhra Pradesh
            </span>
          </div>
          <div className="gov-topbar-right">
            <div className="gov-sp-pill">
              <div className="gov-sp-av">
                {spPhoto
                  ? <img src={spPhoto} alt="Sarpanch" className="gov-sp-img" />
                  : <span className="gov-sp-initials">PVP</span>
                }
              </div>
              <div className="gov-sp-info">
                <span className="gov-sp-name">Pasala Venkata Parvathi</span>
                <span className="gov-sp-label">సర్పంచ్ · Sarpanch</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <nav className="navbar">
        <div className="navbar-inner">

          {/* Brand */}
          <Link to="/" className="navbar-brand" onClick={() => setOpen(false)}>
            <span className="navbar-brand-icon">🏘️</span>
            <span className="navbar-brand-text">Chinamanapuram</span>
          </Link>

          {/* Desktop nav links */}
          <ul className={`navbar-links${open ? ' open' : ''}`}>
            {NAV_LINKS.map(l => (
              <li key={l.to}>
                <NavLink to={l.to} end={l.end || false} onClick={() => setOpen(false)}>
                  {l.icon} {l.label}
                </NavLink>
              </li>
            ))}

            {/* Mobile-only auth section (shown inside hamburger menu) */}
            <li className="navbar-mobile-auth">
              {user ? (
                <div className="navbar-mobile-user">
                  <div className="navbar-mobile-av"
                    style={{ background: 'var(--accent)', color: '#fff' }}>
                    {user.photoURL
                      ? <img src={user.photoURL} alt="" referrerPolicy="no-referrer" />
                      : initials(user.displayName || user.email)
                    }
                  </div>
                  <div>
                    <div className="navbar-mobile-name">{user.displayName || user.email}</div>
                    <div className="navbar-mobile-links">
                      <Link to="/profile" onClick={() => setOpen(false)}>👤 My Profile</Link>
                      <button onClick={handleLogout}>🚪 Logout</button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="navbar-mobile-login">
                  <Link to="/login"    className="navbar-mobile-login-btn" onClick={() => setOpen(false)}>🔐 Sign In</Link>
                  <Link to="/register" className="navbar-mobile-reg-btn"   onClick={() => setOpen(false)}>✨ Register</Link>
                </div>
              )}
            </li>
          </ul>

          {/* Desktop user area */}
          <div className="navbar-user-area">
            {user ? (
              <div className="navbar-user-pill">
                <Link to="/profile" className="navbar-user-inner" title="My Profile">
                  <div className="navbar-user-av">
                    {user.photoURL
                      ? <img src={user.photoURL} alt="" referrerPolicy="no-referrer" />
                      : <span>{initials(user.displayName || user.email)}</span>
                    }
                  </div>
                  <span className="navbar-user-name">
                    {user.displayName?.split(' ')[0] || user.email?.split('@')[0]}
                  </span>
                </Link>
                <button className="navbar-logout-btn" onClick={handleLogout} title="Sign out">
                  🚪
                </button>
              </div>
            ) : (
              <div className="navbar-auth-btns">
                <Link to="/login"    className="navbar-login-btn">🔐 Login</Link>
                <Link to="/register" className="navbar-reg-btn">✨ Register</Link>
              </div>
            )}
          </div>

          {/* Hamburger */}
          <button
            className={`hamburger${open ? ' hamburger-open' : ''}`}
            onClick={() => setOpen(o => !o)}
            aria-label="Toggle menu"
          >
            <span /><span /><span />
          </button>
        </div>
      </nav>

      {/* ── Ticker bar ── */}
      <div className="ticker-bar">
        <div className="ticker-label">
          <span className="ticker-label-dot" />
          LIVE
        </div>
        <div className="ticker-viewport">
          <div className="ticker-track">
            {tickerContent.map((item, i) => (
              <span key={i} className="ticker-item">
                {item}
                <span className="ticker-sep" aria-hidden="true">◆</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

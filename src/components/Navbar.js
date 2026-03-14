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
  { to: '/videos',     label: 'Videos',      icon: '🎬' },
  { to: '/health',     label: 'Health',      icon: '🏥' },
  { to: '/farming',   label: 'Farming',     icon: '🌾' },
  { to: '/calendar',  label: 'Calendar',    icon: '📅' },
];

const DEFAULT_TICKER = [
  '🎉 Ugadi (Vishwavasu) on March 19 – All families invited to Panchayat grounds!',
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
      navigate('/login', { state: { loggedOut: true } });
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

          {/* Brand / Logo */}
          <Link to="/" className="navbar-brand" onClick={() => setOpen(false)}>
            <div className="navbar-brand-logo">
              <svg viewBox="0 0 46 46" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Sky */}
                <rect width="46" height="46" rx="10" fill="#0f3320"/>
                {/* Sun */}
                <circle cx="23" cy="14" r="5" fill="#f5d06a" opacity="0.95"/>
                <circle cx="23" cy="14" r="7" fill="none" stroke="#f5d06a" strokeWidth="1" opacity="0.4"/>
                {/* Mountains / Hills */}
                <path d="M0 34 L10 22 L18 30 L23 24 L30 33 L38 20 L46 30 L46 46 L0 46Z" fill="#1a6b3c"/>
                <path d="M0 38 L8 30 L15 36 L22 28 L29 36 L36 28 L46 36 L46 46 L0 46Z" fill="#2d9959"/>
                {/* House */}
                <path d="M18 38 L18 32 L23 28 L28 32 L28 38Z" fill="#e8891a"/>
                <path d="M16 32 L23 26 L30 32Z" fill="#c46e0e"/>
                <rect x="21" y="34" width="4" height="4" rx="1" fill="#071a0e"/>
                {/* Trees */}
                <ellipse cx="12" cy="35" rx="3" ry="4" fill="#1a4a28"/>
                <rect x="11.5" y="38" width="1" height="2" fill="#8B5E3C"/>
                <ellipse cx="34" cy="35" rx="3" ry="4" fill="#1a4a28"/>
                <rect x="33.5" y="38" width="1" height="2" fill="#8B5E3C"/>
                {/* Stars */}
                <circle cx="8" cy="10" r="1" fill="#f5d06a" opacity="0.7"/>
                <circle cx="38" cy="8" r="1" fill="#f5d06a" opacity="0.6"/>
                <circle cx="32" cy="13" r="0.7" fill="#f5d06a" opacity="0.5"/>
              </svg>
            </div>
            <div className="navbar-brand-text-wrap">
              <span className="navbar-brand-text">Chinamanapuram</span>
              <span className="navbar-brand-sub">Gram Panchayat</span>
            </div>
          </Link>

          {/* Nav links dropdown */}
          <ul className={`navbar-links${open ? ' open' : ''}`}>
            <div className="navbar-links-grid">
            {NAV_LINKS.map(l => (
              <li key={l.to}>
                <NavLink to={l.to} end={l.end || false} onClick={() => setOpen(false)}>
                  {l.icon} {l.label}
                </NavLink>
              </li>
            ))}</div>

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

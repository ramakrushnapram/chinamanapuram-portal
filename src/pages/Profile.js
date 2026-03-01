import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth, loadProfile } from '../context/AuthContext';

function initials(name) {
  if (!name) return '?';
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

export default function Profile() {
  const { user, logout, updateDisplayName, saveProfile } = useAuth();
  const navigate = useNavigate();

  /* load extended profile from localStorage */
  const ext = user ? loadProfile(user.uid) : {};

  const [editing,  setEditing]  = useState(false);
  const [name,     setName]     = useState(user?.displayName || '');
  const [mobile,   setMobile]   = useState(ext.mobile   || '');
  const [ward,     setWard]     = useState(ext.ward      || '');
  const [family,   setFamily]   = useState(ext.familyName|| '');
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);

  if (!user) {
    return (
      <div>
        <Navbar />
        <div className="auth-gate">
          <div className="auth-gate-icon">🔐</div>
          <h2 className="auth-gate-title">Please Sign In</h2>
          <p className="auth-gate-desc">You need to be logged in to view your profile.</p>
          <Link to="/login" className="auth-gate-btn">🔐 Sign In</Link>
        </div>
      </div>
    );
  }

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (name.trim()) await updateDisplayName(name.trim());
      saveProfile(user.uid, {
        displayName: name.trim(),
        familyName:  family.trim(),
        ward,
        mobile:      mobile.trim(),
      });
      setSaved(true);
      setEditing(false);
      setTimeout(() => setSaved(false), 3000);
    } catch (_) {}
    finally { setSaving(false); }
  }

  const joinDate = user.metadata?.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
    : '—';

  const provider = user.providerData?.[0]?.providerId === 'google.com' ? 'Google' : 'Email & Password';

  return (
    <div>
      <Navbar />

      <div className="pr-page">
        {/* ── Hero banner ── */}
        <div className="pr-hero">
          <div className="pr-hero-content">
            <div className="pr-avatar-ring">
              <div className="pr-avatar">
                {user.photoURL
                  ? <img src={user.photoURL} alt={user.displayName} className="pr-avatar-img" referrerPolicy="no-referrer" />
                  : <span>{initials(user.displayName || user.email)}</span>
                }
              </div>
            </div>
            <h1 className="pr-name">{user.displayName || 'Village Member'}</h1>
            <p className="pr-email">{user.email}</p>
            <span className="pr-badge">🌿 Chinamanapuram Resident</span>
          </div>
        </div>

        <div className="pr-container">

          {/* ── Saved notice ── */}
          {saved && (
            <div className="pr-saved-notice">✅ Profile updated successfully!</div>
          )}

          {/* ── Info card ── */}
          {!editing ? (
            <div className="pr-info-card">
              <div className="pr-info-header">
                <h2 className="pr-info-title">👤 Profile Details</h2>
                <button className="pr-edit-btn" onClick={() => setEditing(true)}>✏️ Edit Profile</button>
              </div>

              <div className="pr-info-grid">
                <div className="pr-info-row">
                  <span className="pr-info-label">Full Name</span>
                  <span className="pr-info-val">{user.displayName || '—'}</span>
                </div>
                <div className="pr-info-row">
                  <span className="pr-info-label">Family / Surname</span>
                  <span className="pr-info-val">{ext.familyName || '—'}</span>
                </div>
                <div className="pr-info-row">
                  <span className="pr-info-label">Email</span>
                  <span className="pr-info-val">{user.email}</span>
                </div>
                <div className="pr-info-row">
                  <span className="pr-info-label">Mobile</span>
                  <span className="pr-info-val">{ext.mobile || '—'}</span>
                </div>
                <div className="pr-info-row">
                  <span className="pr-info-label">Village Ward</span>
                  <span className="pr-info-val">{ext.ward || '—'}</span>
                </div>
                <div className="pr-info-row">
                  <span className="pr-info-label">Sign-in Method</span>
                  <span className="pr-info-val">{provider}</span>
                </div>
                <div className="pr-info-row">
                  <span className="pr-info-label">Member Since</span>
                  <span className="pr-info-val">{joinDate}</span>
                </div>
              </div>
            </div>
          ) : (
            /* ── Edit form ── */
            <div className="pr-info-card">
              <div className="pr-info-header">
                <h2 className="pr-info-title">✏️ Edit Profile</h2>
              </div>
              <form onSubmit={handleSave} className="pr-edit-form">
                <div className="auth-form-grid">
                  <div className="auth-field auth-field-full">
                    <label className="auth-label">Full Name</label>
                    <input className="auth-input" value={name} onChange={e => setName(e.target.value)} />
                  </div>
                  <div className="auth-field">
                    <label className="auth-label">Family / Surname</label>
                    <input className="auth-input" value={family} onChange={e => setFamily(e.target.value)} />
                  </div>
                  <div className="auth-field">
                    <label className="auth-label">Mobile Number</label>
                    <input className="auth-input" type="tel" value={mobile} onChange={e => setMobile(e.target.value)} />
                  </div>
                  <div className="auth-field auth-field-full">
                    <label className="auth-label">Village Ward</label>
                    <input className="auth-input" value={ward} onChange={e => setWard(e.target.value)} />
                  </div>
                </div>
                <div className="pr-edit-actions">
                  <button type="button" className="btn-cancel" onClick={() => setEditing(false)}>Cancel</button>
                  <button type="submit" className="btn-save" disabled={saving}>
                    {saving ? 'Saving…' : '💾 Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ── Quick links ── */}
          <div className="pr-links-card">
            <h2 className="pr-info-title" style={{ marginBottom: 16 }}>🔗 Quick Access</h2>
            <div className="pr-quick-grid">
              <Link to="/families"    className="pr-quick-item">👨‍👩‍👧‍👦 My Family Directory</Link>
              <Link to="/complaints"  className="pr-quick-item">📣 My Complaints</Link>
              <Link to="/chat"        className="pr-quick-item">💬 Village Chat</Link>
              <Link to="/gallery"     className="pr-quick-item">🖼️ Photo Gallery</Link>
            </div>
          </div>

          {/* ── Logout ── */}
          <div className="pr-logout-section">
            <button className="pr-logout-btn" onClick={handleLogout}>
              🚪 Sign Out
            </button>
          </div>

        </div>
      </div>

      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-logo">🏘️</div>
          <div className="footer-village">Chinamanapuram Village Portal</div>
          <div className="footer-tagline">Gantyada Mandal · Vizianagaram District · Andhra Pradesh · India</div>
          <div className="footer-links">
            <Link to="/">Home</Link>
            <Link to="/families">Families</Link>
            <Link to="/gallery">Gallery</Link>
            <Link to="/complaints">Complaints</Link>
            <Link to="/chat">Chat</Link>
            <Link to="/education">Education</Link>
          </div>
          <div className="footer-copy">© 2026 Chinamanapuram Village Portal · Built with care for our community</div>
        </div>
      </footer>
    </div>
  );
}

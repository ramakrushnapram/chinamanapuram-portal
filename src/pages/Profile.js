import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth, loadProfile } from '../context/AuthContext';
import { cloudinaryUpload, isCloudinaryConfigured } from '../utils/cloudinaryUpload';
import { updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';

const ADMIN_EMAILS = ['admin@chinamanapuram.com'];

function initials(name) {
  if (!name) return '?';
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

export default function Profile() {
  const { user, logout, updateDisplayName, saveProfile } = useAuth();
  const navigate = useNavigate();

  const ext = user ? loadProfile(user.uid) : {};
  const isAdmin = ADMIN_EMAILS.includes(user?.email);

  /* Edit profile state */
  const [editing, setEditing] = useState(false);
  const [name,    setName]    = useState(user?.displayName || '');
  const [mobile,  setMobile]  = useState(ext.mobile    || '');
  const [ward,    setWard]    = useState(ext.ward       || '');
  const [family,  setFamily]  = useState(ext.familyName || '');
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);

  /* Photo upload state */
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoProgress,  setPhotoProgress]  = useState(0);
  const [photoMsg,       setPhotoMsg]       = useState('');
  const [currentPhoto,   setCurrentPhoto]   = useState(user?.photoURL || '');
  const galleryRef  = useRef();
  const cameraRef   = useRef();
  const uploadTask  = useRef(null);

  /* Change password state */
  const [showPwForm, setShowPwForm] = useState(false);
  const [pwForm,     setPwForm]     = useState({ old:'', new:'', confirm:'' });
  const [pwSaving,   setPwSaving]   = useState(false);
  const [pwMsg,      setPwMsg]      = useState('');
  const [pwErr,      setPwErr]      = useState('');

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

  const displayName = isAdmin
    ? (user.displayName || 'Administrator')
    : (user.displayName || 'Village Member');

  const joinDate = user.metadata?.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString('en-IN', { year:'numeric', month:'long', day:'numeric' })
    : '—';

  const isEmailProvider = user.providerData?.[0]?.providerId !== 'google.com';

  /* ── Save profile ── */
  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (name.trim()) await updateDisplayName(name.trim());
      saveProfile(user.uid, { displayName:name.trim(), familyName:family.trim(), ward, mobile:mobile.trim() });
      setSaved(true); setEditing(false);
      setTimeout(() => setSaved(false), 3000);
    } catch (_) {}
    finally { setSaving(false); }
  }

  /* ── Upload photo ── */
  function handlePhotoFile(file) {
    if (!file || !file.type.startsWith('image/')) {
      setPhotoMsg('Please select a valid image file.'); return;
    }
    if (!isCloudinaryConfigured()) {
      setPhotoMsg('❌ Photo upload not configured yet. Contact admin.');
      return;
    }
    setPhotoUploading(true); setPhotoMsg(''); setPhotoProgress(0);
    const upload = cloudinaryUpload(file, `profiles/${user.uid}`, pct => setPhotoProgress(pct));
    uploadTask.current = upload;
    upload.promise.then(async url => {
      await updateProfile(user, { photoURL: url });
      setCurrentPhoto(url);
      setPhotoUploading(false);
      uploadTask.current = null;
      setPhotoMsg('✅ Photo updated successfully!');
      setTimeout(() => setPhotoMsg(''), 4000);
    }).catch(err => {
      if (err.message !== 'canceled') setPhotoMsg('❌ Upload failed: ' + err.message);
      setPhotoUploading(false);
      uploadTask.current = null;
      if (galleryRef.current) galleryRef.current.value = '';
      if (cameraRef.current)  cameraRef.current.value  = '';
    });
  }

  function cancelUpload() {
    uploadTask.current?.cancel();
    uploadTask.current = null;
    setPhotoUploading(false);
    setPhotoProgress(0);
    setPhotoMsg('');
    if (galleryRef.current) galleryRef.current.value = '';
    if (cameraRef.current)  cameraRef.current.value  = '';
  }

  /* ── Change password ── */
  async function handlePwSubmit(e) {
    e.preventDefault(); setPwMsg(''); setPwErr('');
    if (pwForm.new !== pwForm.confirm) { setPwErr('New passwords do not match.'); return; }
    if (pwForm.new.length < 6) { setPwErr('Password must be at least 6 characters.'); return; }
    setPwSaving(true);
    try {
      const cred = EmailAuthProvider.credential(user.email, pwForm.old);
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, pwForm.new);
      setPwMsg('✅ Password changed successfully!');
      setPwForm({ old:'', new:'', confirm:'' });
      setShowPwForm(false);
    } catch (err) {
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setPwErr('Current password is incorrect.');
      } else {
        setPwErr('Failed to update. Please try again.');
      }
    }
    setPwSaving(false);
  }

  return (
    <div>
      <Navbar />
      <div className="pr-page">

        {/* ── Hero ── */}
        <div className={`pr-hero ${isAdmin ? 'pr-hero-admin' : ''}`}>
          <div className="pr-hero-content">

            {/* Avatar with upload overlay */}
            <div className="pr-avatar-ring">
              <div className={`pr-avatar ${isAdmin ? 'pr-avatar-admin' : ''}`}>
                {(currentPhoto || user.photoURL)
                  ? <img src={currentPhoto || user.photoURL} alt={displayName} className="pr-avatar-img" referrerPolicy="no-referrer" />
                  : <span>{initials(displayName)}</span>
                }
                {photoUploading && (
                  <div className="pr-avatar-uploading">
                    <span className="pr-upload-pct">{photoProgress}%</span>
                  </div>
                )}
              </div>

              {/* Photo buttons below avatar */}
              <div className="pr-photo-btns">
                {photoUploading ? (
                  <button className="pr-photo-btn pr-photo-cancel" onClick={cancelUpload}>
                    ✕ Cancel Upload
                  </button>
                ) : (
                  <>
                    <button
                      className="pr-photo-btn"
                      title="Take photo with camera"
                      onClick={() => cameraRef.current?.click()}
                    >
                      📷 Camera
                    </button>
                    <button
                      className="pr-photo-btn"
                      title="Choose from gallery"
                      onClick={() => galleryRef.current?.click()}
                    >
                      🖼️ Gallery
                    </button>
                  </>
                )}
              </div>

              {/* Hidden file inputs */}
              <input
                ref={cameraRef}
                type="file"
                accept="image/*"
                capture="user"
                style={{ display:'none' }}
                onChange={e => handlePhotoFile(e.target.files[0])}
              />
              <input
                ref={galleryRef}
                type="file"
                accept="image/*"
                style={{ display:'none' }}
                onChange={e => handlePhotoFile(e.target.files[0])}
              />
            </div>

            {photoUploading && (
              <div className="pr-progress-bar-wrap">
                <div className="pr-progress-bar">
                  <div className="pr-progress-fill" style={{ width:`${photoProgress}%` }} />
                </div>
                <span className="pr-progress-txt">Uploading {photoProgress}%…</span>
              </div>
            )}
            {photoMsg && <div className="pr-photo-msg">{photoMsg}</div>}

            <h1 className="pr-name">{displayName}</h1>
            <p className="pr-email">{user.email}</p>

            {isAdmin ? (
              <div className="pr-admin-badges">
                <span className="pr-badge pr-badge-sarpanch">🏛️ సర్పంచ్ · Sarpanch</span>
                <span className="pr-badge pr-badge-admin">⚙️ Admin</span>
              </div>
            ) : (
              <span className="pr-badge">🌿 Chinamanapuram Resident</span>
            )}
          </div>
        </div>

        <div className="pr-container">

          {saved && <div className="pr-saved-notice">✅ Profile updated successfully!</div>}
          {pwMsg  && <div className="pr-saved-notice">{pwMsg}</div>}

          {/* ── Profile Info / Edit ── */}
          {!editing ? (
            <div className="pr-info-card">
              <div className="pr-info-header">
                <h2 className="pr-info-title">👤 Profile Details</h2>
                <button className="pr-edit-btn" onClick={() => setEditing(true)}>✏️ Edit</button>
              </div>
              <div className="pr-info-grid">
                <div className="pr-info-row">
                  <span className="pr-info-label">Full Name</span>
                  <span className="pr-info-val">{displayName}</span>
                </div>
                {isAdmin && (
                  <div className="pr-info-row">
                    <span className="pr-info-label">Role</span>
                    <span className="pr-info-val" style={{ color:'#1a6b3c', fontWeight:700 }}>🏛️ Sarpanch · Admin</span>
                  </div>
                )}
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
                  <span className="pr-info-label">Member Since</span>
                  <span className="pr-info-val">{joinDate}</span>
                </div>
              </div>
            </div>
          ) : (
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

          {/* ── Change Password (email users only) ── */}
          {isEmailProvider && (
            <div className="pr-info-card">
              <div className="pr-info-header">
                <h2 className="pr-info-title">🔐 Change Password</h2>
                <button className="pr-edit-btn" onClick={() => { setShowPwForm(v=>!v); setPwErr(''); setPwMsg(''); }}>
                  {showPwForm ? 'Cancel' : 'Change'}
                </button>
              </div>
              {pwErr && <div className="pr-pw-err">⚠️ {pwErr}</div>}
              {showPwForm && (
                <form onSubmit={handlePwSubmit} className="pr-pw-form">
                  <div className="pr-pw-fields">
                    <div className="auth-field">
                      <label className="auth-label">Current Password</label>
                      <input
                        className="auth-input"
                        type="password"
                        value={pwForm.old}
                        onChange={e => setPwForm(f=>({...f, old:e.target.value}))}
                        placeholder="Enter current password"
                        required
                      />
                    </div>
                    <div className="auth-field">
                      <label className="auth-label">New Password</label>
                      <input
                        className="auth-input"
                        type="password"
                        value={pwForm.new}
                        onChange={e => setPwForm(f=>({...f, new:e.target.value}))}
                        placeholder="Min. 6 characters"
                        required
                      />
                    </div>
                    <div className="auth-field">
                      <label className="auth-label">Confirm New Password</label>
                      <input
                        className="auth-input"
                        type="password"
                        value={pwForm.confirm}
                        onChange={e => setPwForm(f=>({...f, confirm:e.target.value}))}
                        placeholder="Repeat new password"
                        required
                      />
                    </div>
                  </div>
                  <button type="submit" className="btn-save" disabled={pwSaving} style={{ marginTop:16 }}>
                    {pwSaving ? 'Updating…' : '🔐 Update Password'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* ── Quick links ── */}
          <div className="pr-links-card">
            <h2 className="pr-info-title" style={{ marginBottom:16 }}>🔗 Quick Access</h2>
            <div className="pr-quick-grid">
              {isAdmin && (
                <Link to="/admin" className="pr-quick-item pr-quick-admin">⚙️ Admin Panel</Link>
              )}
              <Link to="/families"   className="pr-quick-item">👨‍👩‍👧‍👦 Family Directory</Link>
              <Link to="/complaints" className="pr-quick-item">📣 Complaints</Link>
              <Link to="/chat"       className="pr-quick-item">💬 Village Chat</Link>
              <Link to="/gallery"    className="pr-quick-item">🖼️ Photo Gallery</Link>
            </div>
          </div>

          {/* ── Logout ── */}
          <div className="pr-logout-section">
            <button className="pr-logout-btn" onClick={async () => { await logout(); navigate('/login', { state: { loggedOut: true } }); }}>
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

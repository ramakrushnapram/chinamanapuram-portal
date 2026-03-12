import { useState, useMemo, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import {
  collection, addDoc, setDoc, doc,
  onSnapshot, query, writeBatch, serverTimestamp,
} from 'firebase/firestore';
import { cloudinaryUpload, isCloudinaryConfigured } from '../utils/cloudinaryUpload';

/* ── Avatar color palette ── */
const PALETTE = [
  { bg: '#d1fae5', fg: '#065f46' },
  { bg: '#ffedd5', fg: '#7c2d12' },
  { bg: '#dbeafe', fg: '#1e3a8a' },
  { bg: '#ede9fe', fg: '#4c1d95' },
  { bg: '#fee2e2', fg: '#7f1d1d' },
  { bg: '#cffafe', fg: '#164e63' },
  { bg: '#fef3c7', fg: '#78350f' },
  { bg: '#fce7f3', fg: '#831843' },
  { bg: '#dcfce7', fg: '#14532d' },
  { bg: '#fef9c3', fg: '#713f12' },
];

function palette(id, idx = 0) {
  // Support numeric fam.id (seed data) or fall back to index
  const n = typeof id === 'number' && isFinite(id) ? id : idx + 1;
  return PALETTE[((n - 1) % PALETTE.length + PALETTE.length) % PALETTE.length];
}
function initials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map(w => w[0] || '').join('').toUpperCase() || '?';
}
function maskPhone(phone) {
  if (!phone) return '';
  const d = phone.replace(/\D/g, '');
  if (d.length < 6) return phone;
  return d.slice(0, 5) + ' ' + d[5] + '••••';
}

/* ── Sample data ── */
const SEED_FAMILIES = [
  { id: 1,  head: 'Venkata Raju',    spouse: 'Sarada Devi',    address: 'D.No. 1-23, Main Road, Chinamanapuram',            phone: '94405 12345', members: 5, since: 1978, photo: '' },
  { id: 2,  head: 'Srinivasa Rao',   spouse: 'Kamala Devi',    address: 'D.No. 2-7, Near Temple, Chinamanapuram',           phone: '98480 23456', members: 4, since: 1985, photo: '' },
  { id: 3,  head: 'Appala Naidu',    spouse: 'Vijaya Lakshmi', address: 'D.No. 3-45, East Street, Chinamanapuram',          phone: '97052 34567', members: 6, since: 1972, photo: '' },
  { id: 4,  head: 'Ramesh Babu',     spouse: 'Padmavathi',     address: 'D.No. 4-12, North Colony, Chinamanapuram',         phone: '90003 45678', members: 3, since: 1995, photo: '' },
  { id: 5,  head: 'Suresh Kumar',    spouse: 'Anitha',         address: 'D.No. 5-67, School Road, Chinamanapuram',          phone: '99890 56789', members: 4, since: 1990, photo: '' },
  { id: 6,  head: 'Nageswara Rao',   spouse: 'Bharathi',       address: 'D.No. 6-3, South End, Chinamanapuram',             phone: '96765 67890', members: 5, since: 1982, photo: '' },
  { id: 7,  head: 'Durga Prasad',    spouse: 'Sulochana',      address: 'D.No. 7-89, West Street, Chinamanapuram',          phone: '88975 78901', members: 7, since: 1968, photo: '' },
  { id: 8,  head: 'Krishna Murthy',  spouse: 'Radha',          address: 'D.No. 8-34, Tank Bund Road, Chinamanapuram',       phone: '94405 89012', members: 4, since: 1988, photo: '' },
  { id: 9,  head: 'Satyanarayana',   spouse: 'Mallika',        address: 'D.No. 9-56, Panchayat Office St., Chinamanapuram', phone: '97012 90123', members: 6, since: 1975, photo: '' },
  { id: 10, head: 'Hanumantha Rao',  spouse: 'Vasantha',       address: 'D.No. 10-21, Village Center, Chinamanapuram',      phone: '98765 01234', members: 5, since: 1980, photo: '' },
  { id: 11, head: 'Gopal Rao',       spouse: 'Rajeswari',      address: 'D.No. 11-8, Backside Road, Chinamanapuram',        phone: '96543 12345', members: 3, since: 2000, photo: '' },
  { id: 12, head: 'Bhaskar Rao',     spouse: 'Kavitha',        address: 'D.No. 12-44, Near Borewell, Chinamanapuram',       phone: '91234 23456', members: 4, since: 1993, photo: '' },
];

/* ── Empty form template ── */
const EMPTY = { head: '', spouse: '', address: '', phone: '', members: '', since: '', photo: '' };

/* ─────────────────────────────────────────
   FamilyModal – Add / Edit
───────────────────────────────────────── */
function FamilyModal({ family, onSave, onClose }) {
  const [form, setForm] = useState(
    family
      ? { head: family.head, spouse: family.spouse, address: family.address,
          phone: family.phone, members: family.members, since: family.since, photo: family.photo || '' }
      : { ...EMPTY }
  );
  const [errors, setErrors] = useState({});

  function set(field, val) {
    setForm(f => ({ ...f, [field]: val }));
    if (errors[field]) setErrors(e => ({ ...e, [field]: '' }));
  }

  function validate() {
    const e = {};
    if (!form.head.trim())    e.head    = 'Family head name is required';
    if (!form.phone.trim())   e.phone   = 'Phone number is required';
    if (!form.address.trim()) e.address = 'Address is required';
    return e;
  }

  function handleSubmit(ev) {
    ev.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSave({
      ...form,
      members: parseInt(form.members) || 1,
      since:   parseInt(form.since)   || new Date().getFullYear(),
    });
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{family ? '✏️ Edit Family' : '➕ Add New Family'}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form className="modal-body" onSubmit={handleSubmit}>
          <div className="form-grid">
            {/* Row 1: Head name (full width) */}
            <div className="form-group form-span-2">
              <label className="form-label">Family Head Name <span className="form-req">*</span></label>
              <input
                className={`form-input${errors.head ? ' input-error' : ''}`}
                value={form.head}
                onChange={e => set('head', e.target.value)}
                placeholder="e.g. Venkata Raju"
                autoFocus
              />
              {errors.head && <span className="form-error">{errors.head}</span>}
            </div>

            {/* Row 2: Spouse | Phone */}
            <div className="form-group">
              <label className="form-label">Spouse / Partner Name</label>
              <input
                className="form-input"
                value={form.spouse}
                onChange={e => set('spouse', e.target.value)}
                placeholder="e.g. Sarada Devi"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number <span className="form-req">*</span></label>
              <input
                className={`form-input${errors.phone ? ' input-error' : ''}`}
                value={form.phone}
                onChange={e => set('phone', e.target.value)}
                placeholder="e.g. 94405 12345"
              />
              {errors.phone && <span className="form-error">{errors.phone}</span>}
            </div>

            {/* Row 3: Address (full width) */}
            <div className="form-group form-span-2">
              <label className="form-label">Address <span className="form-req">*</span></label>
              <input
                className={`form-input${errors.address ? ' input-error' : ''}`}
                value={form.address}
                onChange={e => set('address', e.target.value)}
                placeholder="e.g. D.No. 1-23, Main Road, Chinamanapuram"
              />
              {errors.address && <span className="form-error">{errors.address}</span>}
            </div>

            {/* Row 4: Members | Since */}
            <div className="form-group">
              <label className="form-label">No. of Members</label>
              <input
                className="form-input"
                type="number" min="1" max="30"
                value={form.members}
                onChange={e => set('members', e.target.value)}
                placeholder="e.g. 4"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Residing Since (Year)</label>
              <input
                className="form-input"
                type="number" min="1900" max={new Date().getFullYear()}
                value={form.since}
                onChange={e => set('since', e.target.value)}
                placeholder="e.g. 1985"
              />
            </div>

            {/* Row 5: Photo URL (full width) */}
            <div className="form-group form-span-2">
              <label className="form-label">Photo URL <span className="form-optional">(optional)</span></label>
              <input
                className="form-input"
                value={form.photo}
                onChange={e => set('photo', e.target.value)}
                placeholder="Paste an image URL, or leave blank for initials avatar"
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-save">
              {family ? '💾 Save Changes' : '➕ Add Family'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Family Photo Upload ── */
function FamilyPhotoUpload({ fam }) {
  const [uploading, setUploading] = useState(false);
  const [progress,  setProgress]  = useState(0);
  const fileRef = useRef();

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith('image/')) return;
    if (!isCloudinaryConfigured()) return;
    setUploading(true); setProgress(0);
    const upload = cloudinaryUpload(file, `families/${fam.firestoreId}`, pct => setProgress(pct));
    upload.promise.then(async url => {
      await setDoc(doc(db, 'families', fam.firestoreId), { photo: url }, { merge: true });
      setUploading(false);
    }).catch(() => setUploading(false));
  }

  return (
    <>
      <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleFile} />
      <button
        className="fc-photo-btn"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        title="Upload family photo"
      >
        {uploading ? `📤 ${progress}%` : '📷'}
      </button>
    </>
  );
}

/* LoginModal removed – app uses global Firebase auth via /login route */

/* ─────────────────────────────────────────
   FamilyDirectory – Main Page
───────────────────────────────────────── */
const ADMIN_EMAILS = ['admin@chinamanapuram.com'];

export default function FamilyDirectory() {
  const { user } = useAuth();
  const isLoggedIn = !!user;
  const isAdmin = user && ADMIN_EMAILS.includes(user.email);

  const [families,      setFamilies]      = useState([]);
  const [loading,       setLoading]       = useState(true); // eslint-disable-line no-unused-vars
  const [search,        setSearch]        = useState('');
  const [showAddModal,  setShowAddModal]  = useState(false);
  const [editingFamily, setEditingFamily] = useState(null);
  const [loginPrompt,   setLoginPrompt]   = useState(false);

  /* Load families from Firestore; seed sample data if empty */
  useEffect(() => {
    const q = query(collection(db, 'families'));
    const unsub = onSnapshot(q, async snap => {
      if (snap.empty) {
        try {
          const batch = writeBatch(db);
          SEED_FAMILIES.forEach(f => {
            const ref = doc(collection(db, 'families'));
            batch.set(ref, { ...f, createdAt: serverTimestamp() });
          });
          await batch.commit();
        } catch (_) {
          setFamilies(SEED_FAMILIES);
          setLoading(false);
        }
      } else {
        const sorted = snap.docs
          .map(d => ({ firestoreId: d.id, ...d.data() }))
          .sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
        setFamilies(sorted);
        setLoading(false);
      }
    }, () => { setLoading(false); });
    return () => unsub();
  }, []);

  /* filtered list */
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return families;
    return families.filter(f =>
      f.head.toLowerCase().includes(q)    ||
      f.spouse.toLowerCase().includes(q)  ||
      f.address.toLowerCase().includes(q) ||
      f.phone.includes(q)
    );
  }, [families, search]);

  /* handlers */
  function handleAddClick() {
    if (!isLoggedIn) { setLoginPrompt(true); return; }
    setEditingFamily(null);
    setShowAddModal(true);
  }

  function handleEditClick(fam) {
    setEditingFamily(fam);
    setShowAddModal(true);
  }

  async function handleSave(data) {
    try {
      if (editingFamily?.firestoreId) {
        await setDoc(doc(db, 'families', editingFamily.firestoreId), data, { merge: true });
      } else {
        await addDoc(collection(db, 'families'), {
          ...data,
          id: Date.now(),
          createdAt: serverTimestamp(),
        });
      }
    } catch (e) {
      console.error('Failed to save family:', e);
    }
    setShowAddModal(false);
    setEditingFamily(null);
  }

  return (
    <div>
      <Navbar />

      {/* ── Hero ── */}
      <div className="fd-hero">
        {/* Animated background orbs */}
        {[
          { w:180, h:180, top:'10%', left:'5%',  delay:'0s',   dur:'8s',  color:'rgba(45,153,89,0.5)'   },
          { w:120, h:120, top:'60%', left:'80%', delay:'2s',   dur:'10s', color:'rgba(232,137,26,0.4)'  },
          { w:90,  h:90,  top:'30%', left:'70%', delay:'1s',   dur:'7s',  color:'rgba(255,255,255,0.15)' },
          { w:200, h:200, top:'70%', left:'10%', delay:'3s',   dur:'12s', color:'rgba(26,107,60,0.6)'   },
          { w:60,  h:60,  top:'20%', left:'50%', delay:'0.5s', dur:'6s',  color:'rgba(255,215,0,0.2)'   },
        ].map((o, i) => (
          <div key={i} className="fd-hero-orb" style={{ width:o.w, height:o.h, top:o.top, left:o.left, background:o.color, animationDuration:o.dur, animationDelay:o.delay }} />
        ))}
        <div className="fd-hero-content">
          <div className="fd-hero-icon">👨‍👩‍👧‍👦</div>
          <h1 className="fd-hero-title">Family Directory</h1>
          <p className="fd-hero-sub">
            Chinamanapuram &nbsp;·&nbsp; Gantyada Mandal &nbsp;·&nbsp; Vizianagaram District &nbsp;·&nbsp; Andhra Pradesh
          </p>
        </div>
      </div>

      {/* ── Controls bar ── */}
      <div className="fd-controls">
        <div className="fd-controls-inner">

          {/* Count badge */}
          <div className="fd-count-badge">
            <span className="fd-count-num">{families.length}</span>
            <span className="fd-count-label">Registered Families</span>
          </div>

          {/* Search */}
          <div className="fd-search-wrap">
            <span className="fd-search-icon">🔍</span>
            <input
              className="fd-search-input"
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, address or phone…"
            />
            {search && (
              <button className="fd-search-clear" onClick={() => setSearch('')} aria-label="Clear">✕</button>
            )}
          </div>

          {/* Actions */}
          <div className="fd-top-actions">
            {isLoggedIn ? (
              <div className="fd-user-pill">
                <span>👤 {user.displayName?.split(' ')[0] || user.email?.split('@')[0]}</span>
                <Link to="/profile" className="fd-logout-btn">Profile</Link>
              </div>
            ) : (
              <Link to="/login" className="fd-login-btn">🔐 Login</Link>
            )}
            <button className="fd-add-btn" onClick={handleAddClick}>＋ Add Family</button>
          </div>
        </div>
      </div>

      {/* ── Search results info ── */}
      {search && (
        <div className="fd-results-info">
          Showing <strong>{filtered.length}</strong> of <strong>{families.length}</strong> families
          for "<em>{search}</em>"
        </div>
      )}

      {/* ── Card grid ── */}
      <div className="fd-grid-wrapper">
        {filtered.length === 0 ? (
          <div className="fd-empty">
            <div className="fd-empty-icon">🔍</div>
            <h3>No families found</h3>
            <p>Try a different name, address, or phone number.</p>
            <button className="fd-clear-btn" onClick={() => setSearch('')}>Clear Search</button>
          </div>
        ) : (
          <div className="fd-grid">
            {filtered.map((fam, idx) => {
              const pal = palette(fam.id, idx);
              return (
                <div className="family-card" key={fam.firestoreId || fam.id || idx} style={{ '--card-i': idx }}>
                  {/* top color strip */}
                  <div className="fc-strip" style={{ background: pal.fg }} />

                  {/* avatar */}
                  <div className="fc-avatar-wrap">
                    {fam.photo ? (
                      <img
                        src={fam.photo}
                        alt={fam.head}
                        className="fc-avatar-img"
                        onError={e => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="fc-avatar" style={{ background: pal.bg, color: pal.fg }}>
                        {initials(fam.head)}
                      </div>
                    )}
                  </div>

                  <div className="fc-body">
                    <div className="fc-name">{fam.head}</div>
                    {fam.spouse && <div className="fc-spouse">w/ {fam.spouse}</div>}

                    <div className="fc-divider" />

                    <div className="fc-detail">
                      <span className="fc-detail-icon">📍</span>
                      <span className="fc-detail-text">{fam.address}</span>
                    </div>
                    <div className="fc-detail">
                      <span className="fc-detail-icon">📞</span>
                      <span className="fc-detail-text">{maskPhone(fam.phone)}</span>
                    </div>

                    <div className="fc-footer">
                      <div className="fc-badges">
                        <span className="fc-badge fc-badge-green">👥 {fam.members} members</span>
                        <span className="fc-badge fc-badge-orange">📅 Since {fam.since}</span>
                      </div>
                      {/* Only the family owner or admin can edit/upload photo */}
                      {isLoggedIn && (isAdmin || user.uid === fam.userId) && (
                        <div className="fc-actions">
                          <button className="fc-edit-btn" onClick={() => handleEditClick(fam)}>✏️ Edit</button>
                          <FamilyPhotoUpload fam={fam} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-logo">🏘️</div>
          <div className="footer-village">Chinamanapuram Village Portal</div>
          <div className="footer-tagline">
            Gantyada Mandal · Vizianagaram District · Andhra Pradesh · India
          </div>
          <div className="footer-links">
            <Link to="/">Home</Link>
            <Link to="/families">Families</Link>
            <Link to="/family-tree">Family Tree</Link>
            <Link to="/gallery">Gallery</Link>
            <Link to="/complaints">Complaints</Link>
            <Link to="/chat">Chat</Link>
            <Link to="/education">Education</Link>
          </div>
          <div className="footer-copy">
            © 2026 Chinamanapuram Village Portal · Built with care for our community
          </div>
        </div>
      </footer>

      {/* ── Add / Edit Modal ── */}
      {showAddModal && (
        <FamilyModal
          family={editingFamily}
          onSave={handleSave}
          onClose={() => { setShowAddModal(false); setEditingFamily(null); }}
        />
      )}

      {/* ── Login Prompt Modal ── */}
      {loginPrompt && (
        <div className="modal-overlay" onClick={() => setLoginPrompt(false)}>
          <div className="modal-box modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">🔐 Login Required</h2>
              <button className="modal-close" onClick={() => setLoginPrompt(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center', padding: '32px 24px' }}>
              <div style={{ fontSize: '3rem', marginBottom: 12 }}>🔐</div>
              <p style={{ color: 'var(--text-mid)', marginBottom: 24, lineHeight: 1.6 }}>
                Please sign in to add or edit family records.
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link to="/login"    className="btn-save"   onClick={() => setLoginPrompt(false)}>🔐 Sign In</Link>
                <Link to="/register" className="btn-cancel" onClick={() => setLoginPrompt(false)}>✨ Register</Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

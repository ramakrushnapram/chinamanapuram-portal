import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import {
  collection, doc, getDoc, setDoc, onSnapshot,
  addDoc, deleteDoc, serverTimestamp,
} from 'firebase/firestore';
import { cloudinaryUpload, isCloudinaryConfigured } from '../utils/cloudinaryUpload';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { useAuth } from '../context/AuthContext';

/* ── Admin emails — add any email here to grant admin access ── */
const ADMIN_EMAILS = [
  'admin@chinamanapuram.com',
  /* Add your personal email below to also get admin access:
  'yourname@gmail.com',
  */
];

/* ── WhatsApp helper ── */
function openWhatsApp(phone, message) {
  const clean = phone.replace(/\D/g, '');
  const number = clean.startsWith('91') ? clean : '91' + clean;
  window.open(`https://wa.me/${number}?text=${encodeURIComponent(message)}`, '_blank');
}

/* ── Tabs ── */
const TABS = [
  { id: 'overview',   icon: '📊', label: 'Overview'      },
  { id: 'members',    icon: '👥', label: 'Members'       },
  { id: 'complaints', icon: '📋', label: 'Complaints'    },
  { id: 'families',   icon: '👨‍👩‍👧‍👦', label: 'Families'     },
  { id: 'ticker',     icon: '📢', label: 'Ticker News'   },
  { id: 'announce',   icon: '📣', label: 'Announcements' },
  { id: 'events',     icon: '📅', label: 'Events'        },
  { id: 'settings',   icon: '⚙️', label: 'Settings'      },
];

/* ── Root ── */
export default function Admin() {
  const { user, loading, logout } = useAuth();

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f4f6f9' }}>
      <div style={{ fontSize:'2rem' }}>⏳ Loading…</div>
    </div>
  );

  /* Not logged in at all → show login instructions */
  if (!user) return <AdminNotLoggedIn />;

  /* Logged in but not admin → show access denied */
  if (!ADMIN_EMAILS.includes(user.email)) return <AdminNotAuthorized user={user} onLogout={logout} />;

  /* Admin — show dashboard */
  return <AdminDashboard onLogout={logout} />;
}

/* ── Not logged in screen ── */
function AdminNotLoggedIn() {
  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <div className="admin-login-logo">🔐</div>
        <h1 className="admin-login-title">Admin Portal</h1>
        <p className="admin-login-sub">You need to sign in with your admin account to access this page.</p>
        <Link to="/login" className="admin-login-btn" style={{ display:'block', textAlign:'center', textDecoration:'none', marginTop:8 }}>
          🔐 Sign In
        </Link>
        <Link to="/" className="admin-login-back">← Back to Village Portal</Link>
      </div>
    </div>
  );
}

/* ── Not authorized screen ── */
function AdminNotAuthorized({ user, onLogout }) {
  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <div className="admin-login-logo">🚫</div>
        <h1 className="admin-login-title">Access Denied</h1>
        <p className="admin-login-sub">
          <strong>{user.email}</strong> does not have admin access.
        </p>
        <button className="admin-login-btn" onClick={onLogout} style={{ marginTop:8 }}>
          🚪 Sign Out
        </button>
        <Link to="/" className="admin-login-back">← Back to Village Portal</Link>
      </div>
    </div>
  );
}

/* ── Dashboard ── */
function AdminDashboard({ onLogout }) {
  const [tab, setTab]         = useState('overview');
  const [sideOpen, setSide]   = useState(false);
  const [complaints, setComplaints] = useState([]);
  const [families,   setFamilies]   = useState([]);
  const [ticker,     setTicker]     = useState([]);
  const [announces,  setAnnounces]  = useState([]);
  const [events,     setEvents]     = useState([]);
  const [members,    setMembers]    = useState([]);

  useEffect(() => {
    const subs = [];
    subs.push(onSnapshot(collection(db, 'complaints'),
      s => setComplaints(s.docs.map(d => ({ ...d.data(), id: d.id }))), () => {}));
    subs.push(onSnapshot(collection(db, 'families'),
      s => setFamilies(s.docs.map(d => ({ ...d.data(), id: d.id }))), () => {}));
    subs.push(onSnapshot(doc(db, 'settings', 'ticker'),
      s => s.exists() && setTicker(s.data().items || []), () => {}));
    subs.push(onSnapshot(collection(db, 'announcements'),
      s => setAnnounces(s.docs.map(d => ({ ...d.data(), id: d.id }))), () => {}));
    subs.push(onSnapshot(collection(db, 'events'),
      s => setEvents(s.docs.map(d => ({ ...d.data(), id: d.id }))), () => {}));
    subs.push(onSnapshot(collection(db, 'users'),
      s => setMembers(s.docs.map(d => ({ ...d.data(), id: d.id }))), () => {}));
    return () => subs.forEach(u => u());
  }, []);

  const pendingComplaints = complaints.filter(c => c.status === 'pending' || c.status === 'Pending').length;
  const pendingMembers    = members.filter(m => m.status === 'pending').length;

  return (
    <div className="admin-shell">
      {/* Sidebar */}
      <aside className={`admin-sidebar ${sideOpen ? 'admin-sidebar-open' : ''}`}>
        <div className="admin-sidebar-brand">
          <img src="/sarpanch.svg" alt="" className="admin-brand-av" />
          <div>
            <div className="admin-brand-name">Admin Panel</div>
            <div className="admin-brand-sub">Chinamanapuram</div>
          </div>
        </div>
        <nav className="admin-nav">
          {TABS.map(t => (
            <button
              key={t.id}
              className={`admin-nav-btn ${tab === t.id ? 'admin-nav-active' : ''}`}
              onClick={() => { setTab(t.id); setSide(false); }}
            >
              <span className="admin-nav-icon">{t.icon}</span>
              <span>{t.label}</span>
              {t.id === 'complaints' && pendingComplaints > 0 && (
                <span className="admin-nav-badge">{pendingComplaints}</span>
              )}
              {t.id === 'members' && pendingMembers > 0 && (
                <span className="admin-nav-badge">{pendingMembers}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="admin-sidebar-foot">
          <Link to="/" className="admin-portal-link">🏠 View Portal</Link>
          <button className="admin-logout" onClick={onLogout}>🚪 Logout</button>
        </div>
      </aside>

      {/* Main */}
      <div className="admin-main">
        <div className="admin-topbar">
          <button className="admin-ham" onClick={() => setSide(o => !o)}>☰</button>
          <h1 className="admin-topbar-title">
            {TABS.find(t => t.id === tab)?.icon} {TABS.find(t => t.id === tab)?.label}
          </h1>
          <span className="admin-topbar-user">👤 admin</span>
        </div>

        <div className="admin-content">
          {tab === 'overview'   && <OverviewTab c={complaints} f={families} a={announces} e={events} m={members} />}
          {tab === 'members'    && <MembersTab members={members} />}
          {tab === 'complaints' && <ComplaintsTab complaints={complaints} />}
          {tab === 'families'   && <FamiliesTab families={families} />}
          {tab === 'ticker'     && <TickerTab items={ticker} />}
          {tab === 'announce'   && <AnnounceTab items={announces} />}
          {tab === 'events'     && <EventsTab items={events} />}
          {tab === 'settings'   && <SettingsTab />}
        </div>
      </div>

      {sideOpen && <div className="admin-overlay" onClick={() => setSide(false)} />}
    </div>
  );
}

/* ── Overview ── */
function OverviewTab({ c, f, a, e, m }) {
  const pendingMembers = m.filter(x => x.status === 'pending').length;
  const approvedMembers = m.filter(x => x.status === 'approved').length;

  const stats = [
    { icon: '👨‍👩‍👧‍👦', label: 'Families',       value: f.length,        color: 'green'  },
    { icon: '👥',      label: 'Members',        value: m.length,        color: 'blue'   },
    { icon: '⏳',      label: 'Pending Users',  value: pendingMembers,  color: 'orange' },
    { icon: '✅',      label: 'Approved Users', value: approvedMembers, color: 'teal'   },
    { icon: '📋',      label: 'Complaints',     value: c.length,        color: 'purple' },
    { icon: '📣',      label: 'Announcements',  value: a.length,        color: 'red'    },
  ];

  const [spPhoto, setSpPhoto]     = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress]   = useState(0);
  const [upMsg, setUpMsg]         = useState('');
  const fileRef    = useRef();
  const uploadTask = useRef(null);

  useEffect(() => {
    getDoc(doc(db, 'settings', 'sarpanch')).then(s => {
      if (s.exists() && s.data().photoURL) setSpPhoto(s.data().photoURL);
    }).catch(() => {});
  }, []);

  function handlePhotoSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setUpMsg('Please select an image file.'); return; }
    if (!isCloudinaryConfigured()) {
      setUpMsg('❌ Cloudinary not configured. Please add REACT_APP_CLOUDINARY_CLOUD_NAME and REACT_APP_CLOUDINARY_UPLOAD_PRESET to your .env file.');
      return;
    }
    setUploading(true); setUpMsg(''); setProgress(0);
    const upload = cloudinaryUpload(file, 'sarpanch', pct => setProgress(pct));
    uploadTask.current = upload;
    upload.promise.then(async url => {
      await setDoc(doc(db, 'settings', 'sarpanch'), { photoURL: url }, { merge: true });
      setSpPhoto(url);
      setUploading(false);
      uploadTask.current = null;
      setUpMsg('✅ Sarpanch photo updated! Visible on all pages.');
    }).catch(err => {
      if (err.message !== 'canceled') setUpMsg('❌ Upload failed: ' + err.message);
      setUploading(false);
      uploadTask.current = null;
      if (fileRef.current) fileRef.current.value = '';
    });
  }

  function cancelSpUpload() {
    uploadTask.current?.cancel();
    uploadTask.current = null;
    setUploading(false);
    setProgress(0);
    setUpMsg('');
    if (fileRef.current) fileRef.current.value = '';
  }

  return (
    <div>
      <div className="admin-welcome">
        Welcome back, <strong>Admin</strong>! Here's a quick overview of the portal.
      </div>

      {pendingMembers > 0 && (
        <div className="admin-pending-alert">
          ⚠️ <strong>{pendingMembers} new registration request{pendingMembers > 1 ? 's' : ''}</strong> waiting for your approval.
          {' '}<button className="admin-pending-alert-link" onClick={() => {}}>Go to Members tab →</button>
        </div>
      )}

      {/* Sarpanch Photo Upload */}
      <div className="admin-sp-upload-card">
        <div className="admin-sp-av-wrap">
          <img
            src={spPhoto || '/sarpanch.svg'}
            alt="Sarpanch"
            className="admin-sp-av-img"
          />
        </div>
        <div className="admin-sp-info">
          <h3 className="admin-sp-name">Pasala Venkata Parvathi</h3>
          <p className="admin-sp-label">సర్పంచ్ · Sarpanch, Chinamanapuram</p>
          {uploading ? (
            <div className="admin-upload-progress">
              <div className="admin-progress-bar">
                <div className="admin-progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <span className="admin-progress-pct">Uploading {progress}%…</span>
              <button className="admin-cancel-upload-btn" onClick={cancelSpUpload}>✕ Cancel</button>
            </div>
          ) : (
            <button className="admin-upload-btn" onClick={() => fileRef.current?.click()}>
              📷 Upload Sarpanch Photo
            </button>
          )}
          {upMsg && <p className="admin-up-msg">{upMsg}</p>}
          <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handlePhotoSelect} />
        </div>
      </div>

      <div className="admin-stats-grid">
        {stats.map(s => (
          <div key={s.label} className={`admin-stat-card asc-${s.color}`}>
            <div className="admin-stat-icon">{s.icon}</div>
            <div className="admin-stat-value">{s.value}</div>
            <div className="admin-stat-label">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Members Tab ── */
function MembersTab({ members }) {
  const [filter, setFilter] = useState('pending');

  const sorted = [...members].sort((a, b) => {
    // Pending first, then by date
    const order = { pending: 0, approved: 1, rejected: 2 };
    if ((order[a.status] || 1) !== (order[b.status] || 1)) return (order[a.status] || 1) - (order[b.status] || 1);
    return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
  });

  const filtered = filter === 'all' ? sorted : sorted.filter(m => m.status === filter);

  const counts = {
    all:      members.length,
    pending:  members.filter(m => m.status === 'pending').length,
    approved: members.filter(m => m.status === 'approved').length,
    rejected: members.filter(m => m.status === 'rejected').length,
  };

  async function approve(m) {
    try {
      await setDoc(doc(db, 'users', m.id), { status: 'approved' }, { merge: true });
      if (m.mobile) {
        const msg = `✅ Congratulations ${m.name || ''}!\n\nYour Chinamanapuram Village Portal account has been APPROVED by the Sarpanch.\n\nYou can now login at:\nhttps://chinamanapuram-portal.vercel.app/login\n\n- Chinamanapuram Village Portal`;
        openWhatsApp(m.mobile, msg);
      }
    } catch (_) {}
  }

  async function reject(m) {
    if (!window.confirm(`Reject ${m.name || m.email}'s registration?`)) return;
    try {
      await setDoc(doc(db, 'users', m.id), { status: 'rejected' }, { merge: true });
      if (m.mobile) {
        const msg = `❌ Dear ${m.name || ''},\n\nYour Chinamanapuram Village Portal registration request has not been approved at this time.\n\nPlease visit the Panchayat office for more information.\n\n- Chinamanapuram Village Portal`;
        openWhatsApp(m.mobile, msg);
      }
    } catch (_) {}
  }

  function formatDate(ts) {
    if (!ts) return '—';
    try { return new Date(ts.seconds * 1000).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }); }
    catch { return '—'; }
  }

  return (
    <div>
      <div className="admin-section-hdr">
        <h2 className="admin-section-title">👥 Member Registrations</h2>
      </div>
      <p className="admin-hint">Review and approve/reject new registration requests from villagers.</p>

      {/* Filter tabs */}
      <div className="admin-member-filters">
        {[
          { key: 'pending',  label: '⏳ Pending',  color: 'orange' },
          { key: 'approved', label: '✅ Approved', color: 'green'  },
          { key: 'rejected', label: '❌ Rejected', color: 'red'    },
          { key: 'all',      label: '📋 All',      color: 'blue'   },
        ].map(f => (
          <button
            key={f.key}
            className={`admin-mf-btn admin-mf-${f.color}${filter === f.key ? ' admin-mf-active' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
            <span className="admin-mf-count">{counts[f.key]}</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="admin-empty">
          {filter === 'pending' ? '🎉 No pending requests. All registrations reviewed!' : 'No members in this category.'}
        </div>
      )}

      <div className="admin-member-list">
        {filtered.map(m => (
          <div key={m.id} className={`admin-member-card admin-mc-${m.status || 'pending'}`}>
            <div className="admin-mc-avatar">
              {(m.name || m.email || '?')[0].toUpperCase()}
            </div>
            <div className="admin-mc-body">
              <div className="admin-mc-name">{m.name || '—'}</div>
              <div className="admin-mc-email">{m.email}</div>
              <div className="admin-mc-details">
                {m.mobile && <span>📞 {m.mobile}</span>}
                {m.ward   && <span>📍 {m.ward}</span>}
                {m.familyName && <span>👨‍👩‍👧‍👦 {m.familyName}</span>}
                <span>📅 {formatDate(m.createdAt)}</span>
              </div>
            </div>
            <div className="admin-mc-actions">
              <span className={`admin-mc-status admin-mcs-${m.status || 'pending'}`}>
                {m.status === 'approved' ? '✅ Approved' : m.status === 'rejected' ? '❌ Rejected' : '⏳ Pending'}
              </span>
              {m.status !== 'approved' && (
                <button className="admin-mc-approve-btn" onClick={() => approve(m)}>
                  ✅ Approve
                </button>
              )}
              {m.status !== 'rejected' && (
                <button className="admin-mc-reject-btn" onClick={() => reject(m)}>
                  ❌ Reject
                </button>
              )}
              {m.mobile && (
                <button
                  className="admin-mc-wa-btn"
                  onClick={() => openWhatsApp(m.mobile, `Hello ${m.name || ''}, this is a message from Chinamanapuram Village Panchayat.`)}
                  title="Open WhatsApp"
                >
                  📲 WhatsApp
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Complaints Tab ── */
function ComplaintsTab({ complaints }) {
  const STATUS_LABEL = { pending: 'Pending', in_progress: 'In Progress', resolved: 'Resolved', Pending: 'Pending', 'In Progress': 'In Progress', Resolved: 'Resolved' };
  const STATUS_COLOR = {
    pending: '#fef3c7', in_progress: '#dbeafe', resolved: '#d1fae5',
    Pending: '#fef3c7', 'In Progress': '#dbeafe', Resolved: '#d1fae5'
  };
  const sorted = [...complaints].sort((a, b) => (b.createdAt?.seconds||0) - (a.createdAt?.seconds||0));

  async function updateStatus(id, next) {
    try { await setDoc(doc(db, 'complaints', id), { status: next }, { merge: true }); } catch (_) {}
  }

  return (
    <div>
      <div className="admin-section-hdr">
        <h2 className="admin-section-title">📋 All Complaints ({complaints.length})</h2>
      </div>
      {complaints.length === 0 && <div className="admin-empty">No complaints yet.</div>}
      <div className="admin-complaint-list">
        {sorted.map(c => (
          <div key={c.id} className="admin-complaint-card">
            <div className="admin-cc-top">
              <div className="admin-cc-meta">
                <strong className="admin-cc-title">{c.title || 'Complaint'}</strong>
                <span className="admin-cc-sub">{c.name || 'Anonymous'} · {c.phone || '—'} · {c.date || '—'}</span>
              </div>
              <span className="admin-status-pill" style={{ background: STATUS_COLOR[c.status] || '#f3f4f6' }}>
                {STATUS_LABEL[c.status] || 'Pending'}
              </span>
            </div>
            {c.desc && <p className="admin-cc-desc">{c.desc}</p>}
            <div className="admin-cc-actions">
              <select
                className="admin-status-sel"
                value={c.status || 'pending'}
                onChange={e => updateStatus(c.id, e.target.value)}
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
              <button className="admin-del-btn" onClick={() => window.confirm('Delete complaint?') && deleteDoc(doc(db,'complaints',c.id)).catch(()=>{})}>
                🗑️ Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Families Tab ── */
function FamiliesTab({ families }) {
  const [showForm, setShowForm] = useState(false);
  const [editing,  setEditing]  = useState(null);
  const [form, setForm] = useState({ head:'', spouse:'', address:'', phone:'', members:'', since:'' });
  const [saving, setSaving] = useState(false);

  function openAdd()  { setForm({ head:'', spouse:'', address:'', phone:'', members:'', since:'' }); setEditing(null); setShowForm(true); }
  function openEdit(f){ setForm({ head:f.head, spouse:f.spouse||'', address:f.address, phone:f.phone, members:f.members, since:f.since }); setEditing(f); setShowForm(true); }

  async function handleSave(e) {
    e.preventDefault(); setSaving(true);
    const data = { ...form, members: parseInt(form.members)||1, since: parseInt(form.since)||2024 };
    try {
      if (editing) { await setDoc(doc(db,'families',editing.id), data, { merge: true }); }
      else { await addDoc(collection(db,'families'), { ...data, id: Date.now(), createdAt: serverTimestamp() }); }
      setShowForm(false);
    } catch(err) { console.error(err); }
    setSaving(false);
  }

  return (
    <div>
      <div className="admin-section-hdr">
        <h2 className="admin-section-title">👨‍👩‍👧‍👦 Families ({families.length})</h2>
        <button className="admin-add-btn" onClick={openAdd}>＋ Add Family</button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editing ? '✏️ Edit Family' : '➕ Add Family'}</h2>
              <button className="modal-close" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <form className="modal-body" onSubmit={handleSave}>
              <div className="form-grid">
                <div className="form-group form-span-2">
                  <label className="form-label">Head Name *</label>
                  <input className="form-input" value={form.head} onChange={e => setForm(f=>({...f,head:e.target.value}))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Spouse</label>
                  <input className="form-input" value={form.spouse} onChange={e => setForm(f=>({...f,spouse:e.target.value}))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone *</label>
                  <input className="form-input" value={form.phone} onChange={e => setForm(f=>({...f,phone:e.target.value}))} required />
                </div>
                <div className="form-group form-span-2">
                  <label className="form-label">Address *</label>
                  <input className="form-input" value={form.address} onChange={e => setForm(f=>({...f,address:e.target.value}))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Members</label>
                  <input className="form-input" type="number" value={form.members} onChange={e => setForm(f=>({...f,members:e.target.value}))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Since (Year)</label>
                  <input className="form-input" type="number" value={form.since} onChange={e => setForm(f=>({...f,since:e.target.value}))} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn-save" disabled={saving}>{saving ? 'Saving…' : '💾 Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="admin-family-grid">
        {families.map(f => (
          <div key={f.id} className="admin-family-card">
            <div className="admin-fc-name">{f.head}</div>
            <div className="admin-fc-detail">👩 {f.spouse || '—'}</div>
            <div className="admin-fc-detail">📍 {f.address}</div>
            <div className="admin-fc-detail">📞 {f.phone}</div>
            <div className="admin-fc-detail">👥 {f.members} members · 📅 Since {f.since}</div>
            <div className="admin-fc-actions">
              <button className="admin-edit-btn" onClick={() => openEdit(f)}>✏️ Edit</button>
              <button className="admin-del-btn" onClick={() => window.confirm('Delete family?') && deleteDoc(doc(db,'families',f.id)).catch(()=>{})}>🗑️ Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Ticker Tab ── */
function TickerTab({ items }) {
  const [list, setList]     = useState(items);
  const [newItem, setNewItem] = useState('');
  const [saving, setSaving]   = useState(false);

  useEffect(() => setList(items), [items]);

  async function save(updated) {
    setSaving(true);
    try {
      await setDoc(doc(db,'settings','ticker'), { items: updated });
    } catch (_) {}
    setSaving(false);
  }

  function addItem() {
    if (!newItem.trim()) return;
    const updated = [...list, newItem.trim()];
    setList(updated); setNewItem(''); save(updated);
  }

  function remove(i) {
    const updated = list.filter((_,idx) => idx !== i);
    setList(updated); save(updated);
  }

  return (
    <div>
      <div className="admin-section-hdr">
        <h2 className="admin-section-title">📢 Ticker News {saving && <span className="admin-saving">· Saving…</span>}</h2>
      </div>
      <p className="admin-hint">These items scroll in the live news ticker on every page.</p>
      <div className="admin-ticker-add">
        <input
          className="admin-ticker-input"
          value={newItem}
          onChange={e => setNewItem(e.target.value)}
          placeholder="e.g. 🎉 Ugadi festival on March 10 – All invited!"
          onKeyDown={e => e.key === 'Enter' && addItem()}
        />
        <button className="admin-add-btn" onClick={addItem}>＋ Add</button>
      </div>
      <div className="admin-ticker-list">
        {list.map((item, i) => (
          <div key={i} className="admin-ticker-item">
            <span className="admin-ticker-text">{item}</span>
            <button className="admin-del-btn" onClick={() => remove(i)}>🗑️</button>
          </div>
        ))}
        {list.length === 0 && <div className="admin-empty">No ticker items. Add one above.</div>}
      </div>
    </div>
  );
}

/* ── Announcements Tab ── */
function AnnounceTab({ items }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ icon:'📋', tag:'Notice', title:'', desc:'', date:'' });
  const [saving, setSaving] = useState(false);

  async function handleSave(e) {
    e.preventDefault(); setSaving(true);
    try {
      await addDoc(collection(db,'announcements'), { ...form, createdAt: serverTimestamp() });
      setShowForm(false);
      setForm({ icon:'📋', tag:'Notice', title:'', desc:'', date:'' });
    } catch (_) {}
    setSaving(false);
  }

  return (
    <div>
      <div className="admin-section-hdr">
        <h2 className="admin-section-title">📣 Announcements ({items.length})</h2>
        <button className="admin-add-btn" onClick={() => setShowForm(true)}>＋ Add</button>
      </div>
      <p className="admin-hint">Announcements appear on the Home page for all villagers.</p>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">📣 Add Announcement</h2>
              <button className="modal-close" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <form className="modal-body" onSubmit={handleSave}>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Icon (emoji)</label>
                  <input className="form-input" value={form.icon} onChange={e => setForm(f=>({...f,icon:e.target.value}))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Tag</label>
                  <select className="form-input" value={form.tag} onChange={e => setForm(f=>({...f,tag:e.target.value}))}>
                    <option>Notice</option><option>Event</option><option>Urgent</option>
                    <option>Education</option><option>Environment</option><option>Health</option>
                  </select>
                </div>
                <div className="form-group form-span-2">
                  <label className="form-label">Title *</label>
                  <input className="form-input" value={form.title} onChange={e => setForm(f=>({...f,title:e.target.value}))} required />
                </div>
                <div className="form-group form-span-2">
                  <label className="form-label">Description</label>
                  <textarea className="form-input" rows={3} value={form.desc} onChange={e => setForm(f=>({...f,desc:e.target.value}))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input className="form-input" value={form.date} onChange={e => setForm(f=>({...f,date:e.target.value}))} placeholder="e.g. Mar 15, 2026" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn-save" disabled={saving}>{saving ? 'Saving…' : '💾 Add'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="admin-announce-list">
        {items.map(item => (
          <div key={item.id} className="admin-announce-card">
            <span className="admin-ann-icon">{item.icon}</span>
            <div className="admin-ann-body">
              <strong>{item.title}</strong>
              <p>{item.desc}</p>
              <small>{item.date}</small>
            </div>
            <button className="admin-del-btn" onClick={() => window.confirm('Delete?') && deleteDoc(doc(db,'announcements',item.id)).catch(()=>{})}>🗑️</button>
          </div>
        ))}
        {items.length === 0 && <div className="admin-empty">No announcements. Add one above.</div>}
      </div>
    </div>
  );
}

/* ── Events Tab ── */
function EventsTab({ items }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ icon:'🎊', title:'', date:'', desc:'', color:'orange' });
  const [saving, setSaving] = useState(false);

  async function handleSave(e) {
    e.preventDefault(); setSaving(true);
    try {
      await addDoc(collection(db,'events'), { ...form, createdAt: serverTimestamp() });
      setShowForm(false);
      setForm({ icon:'🎊', title:'', date:'', desc:'', color:'orange' });
    } catch (_) {}
    setSaving(false);
  }

  return (
    <div>
      <div className="admin-section-hdr">
        <h2 className="admin-section-title">📅 Upcoming Events ({items.length})</h2>
        <button className="admin-add-btn" onClick={() => setShowForm(true)}>＋ Add Event</button>
      </div>
      <p className="admin-hint">Events appear in the Upcoming Events section on the Home page.</p>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">📅 Add Event</h2>
              <button className="modal-close" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <form className="modal-body" onSubmit={handleSave}>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Icon</label>
                  <input className="form-input" value={form.icon} onChange={e => setForm(f=>({...f,icon:e.target.value}))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Color</label>
                  <select className="form-input" value={form.color} onChange={e => setForm(f=>({...f,color:e.target.value}))}>
                    <option>orange</option><option>green</option><option>blue</option>
                    <option>red</option><option>purple</option>
                  </select>
                </div>
                <div className="form-group form-span-2">
                  <label className="form-label">Title *</label>
                  <input className="form-input" value={form.title} onChange={e => setForm(f=>({...f,title:e.target.value}))} required />
                </div>
                <div className="form-group form-span-2">
                  <label className="form-label">Date</label>
                  <input className="form-input" value={form.date} onChange={e => setForm(f=>({...f,date:e.target.value}))} placeholder="e.g. Mar 10–12, 2026" />
                </div>
                <div className="form-group form-span-2">
                  <label className="form-label">Description</label>
                  <textarea className="form-input" rows={3} value={form.desc} onChange={e => setForm(f=>({...f,desc:e.target.value}))} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn-save" disabled={saving}>{saving ? 'Saving…' : '💾 Add'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="admin-events-list">
        {items.map(item => (
          <div key={item.id} className="admin-event-card">
            <span className="admin-ev-icon">{item.icon}</span>
            <div className="admin-ev-body">
              <strong>{item.title}</strong>
              <p>{item.desc}</p>
              <small>{item.date}</small>
            </div>
            <button className="admin-del-btn" onClick={() => window.confirm('Delete?') && deleteDoc(doc(db,'events',item.id)).catch(()=>{})}>🗑️</button>
          </div>
        ))}
        {items.length === 0 && <div className="admin-empty">No events. Add one above.</div>}
      </div>
    </div>
  );
}

/* ── Settings Tab ── */
function SettingsTab() {
  const { user } = useAuth();
  const [form, setForm]  = useState({ oldPass:'', newPass:'', confirm:'' });
  const [msg,   setMsg]  = useState('');
  const [error, setError]= useState('');
  const [saving, setSaving] = useState(false);

  const [waNumber, setWaNumber] = useState('');
  const [waMsg, setWaMsg] = useState('');
  const [waSaving, setWaSaving] = useState(false);

  useEffect(() => {
    getDoc(doc(db, 'settings', 'admin')).then(s => {
      if (s.exists() && s.data().whatsappNumber) setWaNumber(s.data().whatsappNumber);
    }).catch(() => {});
  }, []);

  async function saveWhatsApp(e) {
    e.preventDefault();
    setWaSaving(true); setWaMsg('');
    try {
      await setDoc(doc(db, 'settings', 'admin'), { whatsappNumber: waNumber.trim() }, { merge: true });
      setWaMsg('✅ WhatsApp number saved! New registration notifications will be sent here.');
    } catch (err) {
      setWaMsg('❌ Failed to save: ' + err.message);
    }
    setWaSaving(false);
  }

  async function handleSubmit(e) {
    e.preventDefault(); setMsg(''); setError('');
    if (form.newPass !== form.confirm) { setError('New passwords do not match.'); return; }
    if (form.newPass.length < 6)      { setError('Password must be at least 6 characters.'); return; }
    setSaving(true);
    try {
      const cred = EmailAuthProvider.credential(user.email, form.oldPass);
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, form.newPass);
      setMsg('✅ Password updated successfully!');
      setForm({ oldPass:'', newPass:'', confirm:'' });
    } catch (err) {
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Current password is incorrect.');
      } else {
        setError('Failed to update password. Please try again.');
      }
    }
    setSaving(false);
  }

  return (
    <div className="admin-settings-wrap">

      {/* WhatsApp Number */}
      <div className="admin-settings-section">
        <h2 className="admin-section-title">📲 Admin WhatsApp Number</h2>
        <p className="admin-hint">
          When a new user registers, a WhatsApp notification button appears for them to notify you.
          Set your WhatsApp number here so they can reach you directly.
        </p>
        {waMsg && <div className={waMsg.startsWith('✅') ? 'admin-msg-ok' : 'admin-msg-err'}>{waMsg}</div>}
        <form className="admin-settings-form" onSubmit={saveWhatsApp}>
          <div className="form-group">
            <label className="form-label">WhatsApp Number (with country code)</label>
            <input
              className="form-input"
              type="tel"
              value={waNumber}
              onChange={e => setWaNumber(e.target.value)}
              placeholder="e.g. 919440512345 or 9440512345"
            />
            <small style={{ color:'var(--text-mid)', fontSize:'0.8rem' }}>
              Enter 10-digit number. Country code 91 is added automatically if missing.
            </small>
          </div>
          <button className="btn-save" type="submit" disabled={waSaving}>
            {waSaving ? 'Saving…' : '💾 Save WhatsApp Number'}
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div className="admin-settings-section" style={{ marginTop: 32 }}>
        <h2 className="admin-section-title">🔐 Change Password</h2>
        <p className="admin-hint">Logged in as: <strong>{user?.email}</strong></p>
        {msg   && <div className="admin-msg-ok">{msg}</div>}
        {error && <div className="admin-msg-err">⚠️ {error}</div>}
        <form className="admin-settings-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Current Password</label>
            <input className="form-input" type="password" value={form.oldPass} onChange={e => setForm(f=>({...f,oldPass:e.target.value}))} required />
          </div>
          <div className="form-group">
            <label className="form-label">New Password</label>
            <input className="form-input" type="password" value={form.newPass} onChange={e => setForm(f=>({...f,newPass:e.target.value}))} required />
          </div>
          <div className="form-group">
            <label className="form-label">Confirm New Password</label>
            <input className="form-input" type="password" value={form.confirm} onChange={e => setForm(f=>({...f,confirm:e.target.value}))} required />
          </div>
          <button className="btn-save" type="submit" disabled={saving}>
            {saving ? 'Saving…' : '🔐 Update Password'}
          </button>
        </form>
      </div>

    </div>
  );
}

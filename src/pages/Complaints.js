import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import {
  collection, addDoc, onSnapshot,
  query, serverTimestamp, writeBatch, doc,
} from 'firebase/firestore';

/* ─── Config ─── */
const CATEGORIES = [
  { value: 'water',       label: 'Water Supply',   icon: '💧', color: '#2563eb', bg: '#dbeafe' },
  { value: 'roads',       label: 'Roads & Paths',  icon: '🚧', color: '#92400e', bg: '#fef3c7' },
  { value: 'electricity', label: 'Electricity',    icon: '⚡', color: '#d97706', bg: '#fef9c3' },
  { value: 'sanitation',  label: 'Sanitation',     icon: '🗑️', color: '#065f46', bg: '#d1fae5' },
  { value: 'education',   label: 'Education',      icon: '📚', color: '#4c1d95', bg: '#ede9fe' },
  { value: 'other',       label: 'Other',          icon: '📋', color: '#4b5563', bg: '#f3f4f6' },
];

const STATUS_CONFIG = {
  pending:     { label: 'Pending',     dot: '#f59e0b', bg: '#fffbeb', text: '#92400e' },
  in_progress: { label: 'In Progress', dot: '#3b82f6', bg: '#eff6ff', text: '#1e3a8a' },
  resolved:    { label: 'Resolved',    dot: '#10b981', bg: '#ecfdf5', text: '#064e3b' },
};

function catInfo(value) { return CATEGORIES.find(c => c.value === value) || CATEGORIES[5]; }
function maskPhone(phone) {
  if (!phone) return '';
  const d = phone.replace(/\D/g, '');
  if (d.length < 6) return phone;
  return d.slice(0, 5) + ' ' + d[5] + '••••';
}

/* ─── Sample data ─── */
const SEED = [
  {
    id: 'CMP-001', cat: 'water',
    title: 'No water supply for 3 days – South Colony',
    desc: 'The borewell near the Shiva temple has been non-functional since 18 Feb. Around 15 families in South Colony are walking long distances for drinking water. Urgent repair needed.',
    name: 'Venkata Raju', phone: '94405 12345',
    date: '2026-02-20', status: 'resolved',
    response: 'Borewell motor burnt out due to voltage fluctuation. Replaced on Feb 22. Water supply fully restored.',
  },
  {
    id: 'CMP-002', cat: 'roads',
    title: 'Dangerous pothole near ZP High School entrance',
    desc: 'A large pothole has formed on Main Road directly in front of the school gate. School children are at serious risk, especially during morning and afternoon hours when traffic is heavy.',
    name: 'Suresh Rao', phone: '98480 22222',
    date: '2026-02-24', status: 'in_progress',
    response: 'PWD inspection done on Feb 26. Repair work allocated. Expected completion by March 3, 2026.',
  },
  {
    id: 'CMP-003', cat: 'electricity',
    title: 'Street light dead for 2 weeks – North Colony',
    desc: 'The street light pole near house No. 6-23 in North Colony has had a burnt bulb for over 2 weeks. The area is completely dark at night making it unsafe for women and children.',
    name: 'Anonymous', phone: '',
    date: '2026-02-25', status: 'pending',
    response: '',
  },
  {
    id: 'CMP-004', cat: 'sanitation',
    title: 'Garbage not collected near old bus stop',
    desc: 'Garbage has been piling up near the old bus stop for more than a week. The stench is unbearable and stray dogs are spreading the waste. Requesting immediate collection and sanitisation.',
    name: 'Ramesh Babu', phone: '90003 45678',
    date: '2026-02-26', status: 'pending',
    response: '',
  },
  {
    id: 'CMP-005', cat: 'water',
    title: 'Pipeline leak wasting water on School Road',
    desc: 'The main drinking water supply pipeline on School Road has a visible crack leaking continuously. Precious drinking water is being wasted and the road has become muddy and slippery.',
    name: 'Nageswara Rao', phone: '96765 67890',
    date: '2026-02-27', status: 'in_progress',
    response: 'Complaint forwarded to RWSS Vizianagaram. Plumber inspection scheduled for March 2.',
  },
  {
    id: 'CMP-006', cat: 'roads',
    title: 'Bridge over drainage near temple cracking',
    desc: 'The small footbridge over the open drain near Hanuman temple has visible cracks on both sides. Given the upcoming monsoon season this is an urgent safety concern for daily commuters.',
    name: 'Durga Prasad', phone: '88975 78901',
    date: '2026-02-28', status: 'pending',
    response: '',
  },
];

/* ─── Sub-components ─── */

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className="cp-status" style={{ background: cfg.bg, color: cfg.text }}>
      <span className="cp-status-dot" style={{ background: cfg.dot }} />
      {cfg.label}
    </span>
  );
}

function CategoryPill({ cat }) {
  const c = catInfo(cat);
  return (
    <span className="cp-cat-pill" style={{ background: c.bg, color: c.color }}>
      {c.icon} {c.label}
    </span>
  );
}

function ComplaintCard({ complaint, expanded, onToggle }) {
  const cat = catInfo(complaint.cat);
  const isOpen = expanded === complaint.id;

  return (
    <div className={`cp-card ${isOpen ? 'cp-card-open' : ''}`}>
      <div className="cp-card-head" onClick={() => onToggle(complaint.id)}>
        <div className="cp-card-icon" style={{ background: cat.bg, color: cat.color }}>
          {cat.icon}
        </div>
        <div className="cp-card-meta">
          <div className="cp-card-title">{complaint.title}</div>
          <div className="cp-card-sub">
            <span className="cp-card-id">{complaint.id}</span>
            <span className="cp-dot-sep">·</span>
            <span>{complaint.name}</span>
            <span className="cp-dot-sep">·</span>
            <span>{complaint.date}</span>
          </div>
        </div>
        <div className="cp-card-right">
          <StatusBadge status={complaint.status} />
          <span className="cp-chevron">{isOpen ? '▲' : '▼'}</span>
        </div>
      </div>

      {isOpen && (
        <div className="cp-card-body">
          <CategoryPill cat={complaint.cat} />
          <p className="cp-card-desc">{complaint.desc}</p>

          {complaint.phone && (
            <div className="cp-card-info">📞 {maskPhone(complaint.phone)}</div>
          )}

          {complaint.response ? (
            <div className="cp-response">
              <div className="cp-response-label">🏛️ Official Response</div>
              <p>{complaint.response}</p>
            </div>
          ) : (
            <div className="cp-no-response">⏳ Awaiting official response from Panchayat</div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Main Page ─── */
const EMPTY_FORM = { name: '', phone: '', cat: '', title: '', desc: '' };


export default function Complaints() {
  const { user } = useAuth();
  const [tab,        setTab]        = useState('submit');
  const [complaints, setComplaints] = useState([]);
  const [loading,    setLoading]    = useState(true); // eslint-disable-line no-unused-vars
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [errors,     setErrors]     = useState({});
  const [submitted,  setSubmitted]  = useState(null);
  const [filterSt,   setFilterSt]   = useState('all');
  const [search,     setSearch]     = useState('');
  const [expanded,   setExpanded]   = useState(null);

  /* Load complaints from Firestore; seed sample data if empty */
  useEffect(() => {
    const q = query(collection(db, 'complaints'));
    const unsub = onSnapshot(q, async snap => {
      if (snap.empty) {
        try {
          const batch = writeBatch(db);
          SEED.forEach(c => {
            const ref = doc(collection(db, 'complaints'));
            batch.set(ref, { ...c, createdAt: serverTimestamp() });
          });
          await batch.commit();
        } catch (_) {
          setComplaints(SEED);
          setLoading(false);
        }
      } else {
        const sorted = snap.docs
          .map(d => ({ firestoreId: d.id, ...d.data() }))
          .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setComplaints(sorted);
        setLoading(false);
      }
    }, () => { setLoading(false); });
    return () => unsub();
  }, []);

  /* stats */
  const stats = useMemo(() => ({
    total:       complaints.length,
    pending:     complaints.filter(c => c.status === 'pending').length,
    in_progress: complaints.filter(c => c.status === 'in_progress').length,
    resolved:    complaints.filter(c => c.status === 'resolved').length,
  }), [complaints]);

  /* filtered list */
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return complaints.filter(c => {
      const matchSt = filterSt === 'all' || c.status === filterSt;
      const matchQ  = !q || c.title.toLowerCase().includes(q)
                        || c.name.toLowerCase().includes(q)
                        || c.id.toLowerCase().includes(q);
      return matchSt && matchQ;
    });
  }, [complaints, filterSt, search]);

  /* form helpers */
  function setField(k, v) {
    setForm(f => ({ ...f, [k]: v }));
    if (errors[k]) setErrors(e => ({ ...e, [k]: '' }));
  }

  function validate() {
    const e = {};
    if (!form.cat)          e.cat   = 'Please select a category';
    if (!form.title.trim()) e.title = 'Please enter a brief title';
    if (!form.desc.trim())  e.desc  = 'Please describe the issue';
    return e;
  }

  async function handleSubmit(ev) {
    ev.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const newId = `CMP-${String(complaints.length + 1).padStart(3, '0')}`;
    const newComplaint = {
      id: newId, cat: form.cat, title: form.title, desc: form.desc,
      name: form.name.trim() || 'Anonymous', phone: form.phone,
      date: new Date().toISOString().slice(0, 10),
      status: 'pending', response: '',
      createdAt: serverTimestamp(),
    };
    try {
      await addDoc(collection(db, 'complaints'), newComplaint);
      setSubmitted(newId);
      setForm(EMPTY_FORM);
      setErrors({});
    } catch (e) {
      console.error('Failed to save complaint:', e);
    }
  }

  function toggleExpand(id) { setExpanded(e => e === id ? null : id); }

  function switchToTrack(id) {
    setSubmitted(null);
    setTab('track');
    setSearch(id);
  }

  return (
    <div>
      <Navbar />

      {/* ── Hero ── */}
      <div className="cp-hero">
        <div className="cp-hero-icon">📣</div>
        <h1 className="cp-hero-title">Complaints &amp; Grievances</h1>
        <p className="cp-hero-sub">
          Chinamanapuram · Gantyada Mandal · Vizianagaram District
        </p>
      </div>

      {/* ── Stats strip ── */}
      <div className="cp-stats-bar">
        <div className="cp-stats-inner">
          {[
            { label: 'Total',       value: stats.total,       dot: '#6b7280' },
            { label: 'Pending',     value: stats.pending,     dot: '#f59e0b' },
            { label: 'In Progress', value: stats.in_progress, dot: '#3b82f6' },
            { label: 'Resolved',    value: stats.resolved,    dot: '#10b981' },
          ].map(s => (
            <div className="cp-stat" key={s.label}>
              <span className="cp-stat-dot" style={{ background: s.dot }} />
              <span className="cp-stat-num">{s.value}</span>
              <span className="cp-stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="cp-tabs-wrap">
        <div className="cp-tabs">
          <button
            className={`cp-tab ${tab === 'submit' ? 'cp-tab-active' : ''}`}
            onClick={() => setTab('submit')}
          >
            📝 Submit Complaint
          </button>
          <button
            className={`cp-tab ${tab === 'track' ? 'cp-tab-active' : ''}`}
            onClick={() => setTab('track')}
          >
            🔍 Track Complaints
            <span className="cp-tab-badge">{stats.total}</span>
          </button>
        </div>
      </div>

      {/* ══════════════════════════════
           TAB 1 – SUBMIT FORM
      ═══════════════════════════════ */}
      {tab === 'submit' && (
        <div className="cp-panel">
          {!user && (
            <div className="auth-gate auth-gate-inline">
              <div className="auth-gate-icon">📣</div>
              <h2 className="auth-gate-title">Please Sign In to Submit</h2>
              <p className="auth-gate-desc">
                Login to lodge a complaint to the Panchayat. You can still track existing complaints without logging in.
              </p>
              <div className="auth-gate-actions">
                <Link to="/login"    className="auth-gate-btn">🔐 Sign In</Link>
                <Link to="/register" className="auth-gate-btn-outline">✨ Register Free</Link>
              </div>
            </div>
          )}
          {user && submitted ? (
            /* Success state */
            <div className="cp-success-card">
              <div className="cp-success-icon">✅</div>
              <h2>Complaint Submitted!</h2>
              <p>Your complaint has been registered with ID:</p>
              <div className="cp-success-id">{submitted}</div>
              <p className="cp-success-note">
                The Panchayat will review and respond within 7 working days.
                You can track your complaint status in the Track tab.
              </p>
              <div className="cp-success-actions">
                <button className="btn-save" onClick={() => switchToTrack(submitted)}>
                  🔍 Track {submitted}
                </button>
                <button className="btn-cancel" onClick={() => setSubmitted(null)}>
                  Submit Another
                </button>
              </div>
            </div>
          ) : user ? (
            /* Form */
            <div className="cp-form-card">
              <h2 className="cp-form-title">Lodge a New Complaint</h2>
              <p className="cp-form-sub">
                All complaints are reviewed by the Gram Panchayat. You may submit anonymously.
              </p>

              <form onSubmit={handleSubmit}>
                {/* Category */}
                <div className="cp-field-full" style={{ marginBottom: 20 }}>
                  <label className="form-label">
                    Category <span className="form-req">*</span>
                  </label>
                  <div className="cp-cat-grid">
                    {CATEGORIES.map(c => (
                      <button
                        key={c.value}
                        type="button"
                        className={`cp-cat-btn ${form.cat === c.value ? 'cp-cat-selected' : ''}`}
                        style={form.cat === c.value ? { borderColor: c.color, background: c.bg, color: c.color } : {}}
                        onClick={() => setField('cat', c.value)}
                      >
                        <span>{c.icon}</span>
                        <span>{c.label}</span>
                      </button>
                    ))}
                  </div>
                  {errors.cat && <span className="form-error" style={{ marginTop: 6 }}>{errors.cat}</span>}
                </div>

                {/* Title */}
                <div className="cp-field-full" style={{ marginBottom: 16 }}>
                  <label className="form-label">
                    Complaint Title <span className="form-req">*</span>
                  </label>
                  <input
                    className={`form-input${errors.title ? ' input-error' : ''}`}
                    value={form.title}
                    onChange={e => setField('title', e.target.value)}
                    placeholder="Brief description of the issue (e.g. No water supply near temple)"
                  />
                  {errors.title && <span className="form-error">{errors.title}</span>}
                </div>

                {/* Description */}
                <div className="cp-field-full" style={{ marginBottom: 16 }}>
                  <label className="form-label">
                    Full Description <span className="form-req">*</span>
                  </label>
                  <textarea
                    className={`form-input cp-textarea${errors.desc ? ' input-error' : ''}`}
                    value={form.desc}
                    onChange={e => setField('desc', e.target.value)}
                    placeholder="Describe the issue in detail — location, how long it has been happening, who is affected…"
                    rows={4}
                  />
                  {errors.desc && <span className="form-error">{errors.desc}</span>}
                </div>

                {/* Name + Phone (optional) */}
                <div className="form-grid" style={{ marginBottom: 24 }}>
                  <div className="form-group">
                    <label className="form-label">
                      Your Name <span className="form-optional">(optional)</span>
                    </label>
                    <input
                      className="form-input"
                      value={form.name}
                      onChange={e => setField('name', e.target.value)}
                      placeholder="Leave blank to submit anonymously"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">
                      Phone Number <span className="form-optional">(optional)</span>
                    </label>
                    <input
                      className="form-input"
                      value={form.phone}
                      onChange={e => setField('phone', e.target.value)}
                      placeholder="For follow-up contact"
                    />
                  </div>
                </div>

                <div className="cp-form-footer">
                  <p className="cp-privacy-note">
                    🔒 Your information is kept confidential and only shared with Panchayat officials.
                  </p>
                  <button type="submit" className="btn-save cp-submit-btn">
                    📤 Submit Complaint
                  </button>
                </div>
              </form>
            </div>
          ) : null}
        </div>
      )}

      {/* ══════════════════════════════
           TAB 2 – TRACK COMPLAINTS
      ═══════════════════════════════ */}
      {tab === 'track' && (
        <div className="cp-panel">
          {/* Filter + Search bar */}
          <div className="cp-track-controls">
            <div className="cp-filter-group">
              {['all', 'pending', 'in_progress', 'resolved'].map(st => (
                <button
                  key={st}
                  className={`cp-filter-btn ${filterSt === st ? 'cp-filter-active' : ''}`}
                  onClick={() => setFilterSt(st)}
                >
                  {st === 'all'         && `All (${stats.total})`}
                  {st === 'pending'     && `⏳ Pending (${stats.pending})`}
                  {st === 'in_progress' && `🔄 In Progress (${stats.in_progress})`}
                  {st === 'resolved'    && `✅ Resolved (${stats.resolved})`}
                </button>
              ))}
            </div>

            <div className="fd-search-wrap" style={{ minWidth: 240 }}>
              <span className="fd-search-icon">🔍</span>
              <input
                className="fd-search-input"
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by ID, title or name…"
              />
              {search && (
                <button className="fd-search-clear" onClick={() => setSearch('')}>✕</button>
              )}
            </div>
          </div>

          {/* Results info */}
          {(search || filterSt !== 'all') && (
            <div className="fd-results-info" style={{ paddingLeft: 0 }}>
              Showing <strong>{filtered.length}</strong> of <strong>{complaints.length}</strong> complaints
              {filterSt !== 'all' && <> · Filter: <em>{STATUS_CONFIG[filterSt]?.label ?? 'All'}</em></>}
            </div>
          )}

          {/* Complaint list */}
          {filtered.length === 0 ? (
            <div className="fd-empty">
              <div className="fd-empty-icon">🔍</div>
              <h3>No complaints found</h3>
              <p>Try a different filter or search term.</p>
              <button className="fd-clear-btn" onClick={() => { setSearch(''); setFilterSt('all'); }}>
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="cp-list">
              {filtered.map(c => (
                <ComplaintCard
                  key={c.id}
                  complaint={c}
                  expanded={expanded}
                  onToggle={toggleExpand}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Footer */}
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
            <Link to="/chat">Chat</Link>
            <Link to="/education">Education</Link>
          </div>
          <div className="footer-copy">
            © 2026 Chinamanapuram Village Portal · Built with care for our community
          </div>
        </div>
      </footer>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import {
  collection, onSnapshot, query, addDoc, deleteDoc, doc, serverTimestamp,
} from 'firebase/firestore';
import { cloudinaryUpload, isCloudinaryConfigured } from '../utils/cloudinaryUpload';

const ADMIN_EMAILS = ['admin@chinamanapuram.com'];

const CATEGORIES = [
  { id: 'all',         label: 'All Documents', icon: '📁' },
  { id: 'government',  label: 'Government',    icon: '🏛️' },
  { id: 'panchayat',   label: 'Panchayat',     icon: '🏘️' },
  { id: 'education',   label: 'Education',     icon: '📚' },
  { id: 'health',      label: 'Health',        icon: '🏥' },
  { id: 'agriculture', label: 'Agriculture',   icon: '🌾' },
];

const DEFAULT_DOCS = [
  { id:'d1', title:'Aadhaar Enrollment Form',         category:'government',  desc:'Official UIDAI Aadhaar enrollment/correction form for residents.',      size:'245 KB', icon:'🪪', ext:'PDF', url:'https://uidai.gov.in/images/CombiForm_POI_POA_DOB_Mob.pdf',            downloads:142 },
  { id:'d2', title:'Ration Card Application',         category:'government',  desc:'AP government ration card new/correction application form. Visit Panchayat office for the form.',             size:'180 KB', icon:'🍚', ext:'PDF', url:'#',                                                                     downloads:98  },
  { id:'d3', title:'Income Certificate Form',         category:'government',  desc:'Application for income certificate from Tahsildar office.',              size:'120 KB', icon:'📋', ext:'PDF', url:'https://meeseva.ap.gov.in/',                                            downloads:76  },
  { id:'d4', title:'Caste Certificate Application',   category:'government',  desc:'SC/ST/BC caste certificate application for AP residents.',               size:'95 KB',  icon:'📄', ext:'PDF', url:'https://meeseva.ap.gov.in/',                                            downloads:54  },
  { id:'d5', title:'Village Panchayat Budget 2025-26',category:'panchayat',   desc:'Annual budget report of Chinamanapuram Gram Panchayat for FY 2025-26.', size:'420 KB', icon:'💰', ext:'PDF', url:'#',                                                                     downloads:31  },
  { id:'d6', title:'Panchayat Meeting Minutes – Feb', category:'panchayat',   desc:'Official minutes of the February 2026 gram sabha meeting.',              size:'210 KB', icon:'📝', ext:'PDF', url:'#',                                                                     downloads:28  },
  { id:'d7', title:'Water Supply Schedule',           category:'panchayat',   desc:'Water supply timings and maintenance schedule for all wards.',           size:'85 KB',  icon:'💧', ext:'PDF', url:'#',                                                                     downloads:89  },
  { id:'d8', title:'Scholarship Application Form',    category:'education',   desc:'State government scholarship application for Classes 1–12 students.',    size:'155 KB', icon:'🎓', ext:'PDF', url:'https://scholarship.ap.gov.in/',                                       downloads:203 },
  { id:'d9', title:'Mid-Day Meal Programme Details',  category:'education',   desc:'Nutrition and meal schedule for government school students.',             size:'70 KB',  icon:'🍱', ext:'PDF', url:'#',                                                                     downloads:45  },
  { id:'d10',title:'Free Health Camp Details',        category:'health',      desc:'Details of upcoming free health camp — doctors, timings, location.',     size:'65 KB',  icon:'🏥', ext:'PDF', url:'#',                                                                     downloads:67  },
  { id:'d11',title:'PM Kisan Samman Nidhi Form',      category:'agriculture', desc:'Application form for PM-KISAN scheme — ₹6000/year for farmers.',         size:'190 KB', icon:'🌾', ext:'PDF', url:'https://pmkisan.gov.in/',                                              downloads:118 },
  { id:'d12',title:'Crop Insurance (PMFBY) Form',     category:'agriculture', desc:'Pradhan Mantri Fasal Bima Yojana application for crop insurance.',        size:'210 KB', icon:'🌱', ext:'PDF', url:'https://pmfby.gov.in/',                                                downloads:87  },
];

function formatDate(ts) {
  if (!ts) return '';
  try {
    return new Date(ts.seconds * 1000).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
  } catch { return ''; }
}

export default function Documents() {
  const { user } = useAuth();
  const isAdmin   = ADMIN_EMAILS.includes(user?.email);

  const [firestoreDocs, setFirestoreDocs] = useState([]);
  const [activeCat,   setActiveCat]   = useState('all');
  const [search,      setSearch]      = useState('');
  const [showUpload,  setShowUpload]  = useState(false);

  /* Upload form state */
  const [uTitle,    setUTitle]    = useState('');
  const [uDesc,     setUDesc]     = useState('');
  const [uCat,      setUCat]      = useState('government');
  const [uFile,     setUFile]     = useState(null);
  const [uProgress, setUProgress] = useState(0);
  const [uUploading,setUUploading]= useState(false);
  const [uMsg,      setUMsg]      = useState('');

  /* Load docs from Firestore */
  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'documents')),
      snap => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data(), fromFirestore: true }));
        setFirestoreDocs(data);
      },
      () => {}
    );
    return unsub;
  }, []);

  /* Merge default + firestore docs */
  const allDocs = [...firestoreDocs, ...DEFAULT_DOCS];

  /* Filter */
  const filtered = allDocs.filter(d => {
    const matchCat = activeCat === 'all' || d.category === activeCat;
    const matchSearch = !search || [d.title, d.desc, d.category]
      .join(' ').toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  /* Delete (admin only) */
  async function handleDelete(d) {
    if (!d.fromFirestore) { alert('Default documents cannot be deleted.'); return; }
    if (!window.confirm('Delete this document?')) return;
    await deleteDoc(doc(db, 'documents', d.id));
  }

  /* Upload */
  async function handleUpload(e) {
    e.preventDefault();
    if (!uTitle.trim()) { setUMsg('Please enter a title.'); return; }
    if (!uFile)          { setUMsg('Please select a file.'); return; }
    if (!isCloudinaryConfigured()) { setUMsg('❌ Upload not configured. Contact admin.'); return; }
    setUUploading(true); setUMsg(''); setUProgress(0);

    const upload = cloudinaryUpload(uFile, 'documents', pct => setUProgress(pct));
    upload.promise.then(async url => {
      await addDoc(collection(db, 'documents'), {
        title: uTitle.trim(),
        desc:  uDesc.trim(),
        category: uCat,
        url,
        ext:  uFile.name.split('.').pop().toUpperCase(),
        size: (uFile.size / 1024).toFixed(0) + ' KB',
        icon: getCatIcon(uCat),
        downloads: 0,
        createdAt: serverTimestamp(),
        uploadedBy: user.email,
      });
      setUTitle(''); setUDesc(''); setUFile(null); setUCat('government');
      setUUploading(false); setUProgress(0);
      setUMsg('✅ Document uploaded successfully!');
      setShowUpload(false);
      setTimeout(() => setUMsg(''), 4000);
    }).catch(err => {
      setUMsg('❌ Upload failed: ' + err.message);
      setUUploading(false);
    });
  }

  function getCatIcon(cat) {
    const found = CATEGORIES.find(c => c.id === cat);
    return found ? found.icon : '📄';
  }

  function handleDownload(d) {
    if (d.url === '#') {
      alert('This document is not yet available online. Please visit the Panchayat office.');
      return;
    }
    window.open(d.url, '_blank');
  }

  return (
    <div style={{ background: 'var(--cream)', minHeight: '100vh' }}>
      <Navbar />

      {/* Hero */}
      <div className="doc-hero">
        <div className="doc-hero-inner">
          <div className="doc-hero-icon">📂</div>
          <h1 className="doc-hero-title">Documents & Downloads</h1>
          <p className="doc-hero-sub">
            Government forms, panchayat records, education & agriculture documents
            — all in one place for Chinamanapuram residents.
          </p>
          <div className="doc-hero-stats">
            <span className="doc-hero-stat"><strong>{allDocs.length}</strong> Documents</span>
            <span className="doc-hero-divider">·</span>
            <span className="doc-hero-stat"><strong>6</strong> Categories</span>
            <span className="doc-hero-divider">·</span>
            <span className="doc-hero-stat"><strong>Free</strong> Downloads</span>
          </div>
        </div>
      </div>

      <div className="doc-page">

        {/* Controls */}
        <div className="doc-controls">
          {/* Search */}
          <div className="doc-search-wrap">
            <span className="doc-search-icon">🔍</span>
            <input
              className="doc-search-input"
              placeholder="Search documents..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button className="doc-search-clear" onClick={() => setSearch('')}>✕</button>
            )}
          </div>

          {/* Admin upload button */}
          {isAdmin && (
            <button className="doc-upload-btn" onClick={() => setShowUpload(v => !v)}>
              {showUpload ? '✕ Cancel' : '⬆️ Upload Document'}
            </button>
          )}
        </div>

        {/* Upload success msg */}
        {uMsg && !showUpload && <div className="doc-msg-ok">{uMsg}</div>}

        {/* Upload form (admin only) */}
        {isAdmin && showUpload && (
          <div className="doc-upload-card">
            <h3 className="doc-upload-title">⬆️ Upload New Document</h3>
            {uMsg && <div className="doc-msg-ok">{uMsg}</div>}
            <form onSubmit={handleUpload} className="doc-upload-form">
              <div className="doc-form-row">
                <div className="doc-field">
                  <label>Document Title *</label>
                  <input value={uTitle} onChange={e => setUTitle(e.target.value)} placeholder="e.g. Ration Card Form" />
                </div>
                <div className="doc-field">
                  <label>Category *</label>
                  <select value={uCat} onChange={e => setUCat(e.target.value)}>
                    {CATEGORIES.filter(c => c.id !== 'all').map(c => (
                      <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="doc-field">
                <label>Description</label>
                <input value={uDesc} onChange={e => setUDesc(e.target.value)} placeholder="Brief description of the document" />
              </div>
              <div className="doc-field">
                <label>File (PDF, DOC, Image) *</label>
                <input type="file" accept=".pdf,.doc,.docx,.jpg,.png,.jpeg" onChange={e => setUFile(e.target.files[0])} />
              </div>
              {uUploading && (
                <div className="doc-progress-wrap">
                  <div className="doc-progress-bar">
                    <div className="doc-progress-fill" style={{ width: `${uProgress}%` }} />
                  </div>
                  <span className="doc-progress-txt">Uploading {uProgress}%…</span>
                </div>
              )}
              <div className="doc-upload-actions">
                <button type="button" className="doc-btn-cancel" onClick={() => setShowUpload(false)}>Cancel</button>
                <button type="submit" className="doc-btn-upload" disabled={uUploading}>
                  {uUploading ? `Uploading ${uProgress}%…` : '⬆️ Upload'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Category tabs */}
        <div className="doc-cats">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              className={`doc-cat-btn${activeCat === cat.id ? ' doc-cat-active' : ''}`}
              onClick={() => setActiveCat(cat.id)}
            >
              {cat.icon} {cat.label}
              <span className="doc-cat-count">
                {cat.id === 'all' ? allDocs.length : allDocs.filter(d => d.category === cat.id).length}
              </span>
            </button>
          ))}
        </div>

        {/* Results count */}
        {search && (
          <div className="doc-results-info">
            Showing {filtered.length} of {allDocs.length} documents for "{search}"
          </div>
        )}

        {/* Documents grid */}
        {filtered.length === 0 ? (
          <div className="doc-empty">
            <div style={{ fontSize: '3rem' }}>📭</div>
            <div>No documents found</div>
          </div>
        ) : (
          <div className="doc-grid">
            {filtered.map(d => (
              <div key={d.id} className="doc-card">
                <div className="doc-card-top">
                  <div className="doc-card-icon">{d.icon || '📄'}</div>
                  <div className="doc-card-meta">
                    <span className={`doc-ext-badge doc-ext-${(d.ext || 'PDF').toLowerCase()}`}>
                      {d.ext || 'PDF'}
                    </span>
                    <span className="doc-size">{d.size || ''}</span>
                  </div>
                </div>

                <div className="doc-card-body">
                  <h3 className="doc-card-title">{d.title}</h3>
                  <p className="doc-card-desc">{d.desc}</p>
                  {d.createdAt && (
                    <div className="doc-card-date">📅 {formatDate(d.createdAt)}</div>
                  )}
                </div>

                <div className="doc-card-footer">
                  <span className="doc-card-cat">
                    {CATEGORIES.find(c => c.id === d.category)?.icon} {d.category}
                  </span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {isAdmin && d.fromFirestore && (
                      <button className="doc-delete-btn" onClick={() => handleDelete(d)}>🗑️</button>
                    )}
                    <button className="doc-download-btn" onClick={() => handleDownload(d)}>
                      ⬇️ Download
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Auth gate for non-logged-in users */}
        {!user && (
          <div className="auth-gate-inline" style={{ marginTop: 32 }}>
            <div style={{ fontSize: '2rem' }}>🔐</div>
            <p>Sign in to upload and manage documents</p>
            <Link to="/login" className="auth-gate-btn">Sign In</Link>
          </div>
        )}
      </div>

      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-logo">🏘️</div>
          <div className="footer-village">Chinamanapuram Village Portal</div>
          <div className="footer-tagline">Gantyada Mandal · Vizianagaram District · Andhra Pradesh · India</div>
          <div className="footer-links">
            <Link to="/">Home</Link><Link to="/families">Families</Link>
            <Link to="/gallery">Gallery</Link><Link to="/complaints">Complaints</Link>
            <Link to="/chat">Chat</Link><Link to="/education">Education</Link>
          </div>
          <div className="footer-copy">© 2026 Chinamanapuram Village Portal · Built with care for our community</div>
        </div>
      </footer>
    </div>
  );
}

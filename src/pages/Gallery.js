import { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

/* ─── Categories ─── */
const CATEGORIES = [
  'All',
  'Village Photos',
  'Festival Photos',
  'Development Work',
  'School & Education',
  'Family Events',
];

/* ─── Album Data ─── */
const ALBUMS = [
  {
    id: 1,
    category: 'Festival Photos',
    name: 'Pongal Celebrations 2026',
    cover: '🎑',
    coverBg: '#fef3c7',
    coverFg: '#92400e',
    date: 'Jan 14, 2026',
    addedBy: 'Sarpanch Naidu',
    photos: [
      { id: 1, emoji: '🫕', caption: 'Pongal pots boiling near the temple' },
      { id: 2, emoji: '🌸', caption: 'Rangoli at village entrance by village women' },
      { id: 3, emoji: '🐄', caption: 'Mattu Pongal — cattle decorated with flowers' },
      { id: 4, emoji: '👗', caption: 'Women in traditional pavadai sarees' },
      { id: 5, emoji: '🥁', caption: 'Dholak music performance at Main Road' },
      { id: 6, emoji: '🍬', caption: 'Sweet pongal distribution by Panchayat' },
    ],
  },
  {
    id: 2,
    category: 'Festival Photos',
    name: 'Ugadi Festival 2025',
    cover: '🌺',
    coverBg: '#dcfce7',
    coverFg: '#065f46',
    date: 'Mar 30, 2025',
    addedBy: 'Meena Rao',
    photos: [
      { id: 1, emoji: '🍃', caption: 'Ugadi pachadi preparation at temple kitchen' },
      { id: 2, emoji: '🌄', caption: 'Sunrise prayer at Hanuman temple' },
      { id: 3, emoji: '🌿', caption: 'Mango leaf torana at every door' },
      { id: 4, emoji: '📿', caption: 'Women at temple with flower offerings' },
      { id: 5, emoji: '🎭', caption: 'Cultural programme at Panchayat hall' },
    ],
  },
  {
    id: 3,
    category: 'Festival Photos',
    name: 'Diwali Night 2025',
    cover: '🪔',
    coverBg: '#fce7f3',
    coverFg: '#831843',
    date: 'Oct 20, 2025',
    addedBy: 'Ramesh Babu',
    photos: [
      { id: 1, emoji: '🕯️', caption: 'Diya lighting at village square' },
      { id: 2, emoji: '🎆', caption: 'Fireworks over the village' },
      { id: 3, emoji: '👦', caption: 'Children with sparklers' },
      { id: 4, emoji: '🍡', caption: 'Sweets and snacks distributed by families' },
      { id: 5, emoji: '🏠', caption: 'Houses decorated with clay diyas' },
      { id: 6, emoji: '👨‍👩‍👧', caption: 'Family celebration together at village square' },
    ],
  },
  {
    id: 4,
    category: 'Village Photos',
    name: 'Temple Festival 2025',
    cover: '🛕',
    coverBg: '#ede9fe',
    coverFg: '#4c1d95',
    date: 'Nov 5, 2025',
    addedBy: 'Durga Prasad',
    photos: [
      { id: 1, emoji: '🛕', caption: 'Decorated Hanuman temple entrance' },
      { id: 2, emoji: '🪷', caption: 'Flower offerings at the main altar' },
      { id: 3, emoji: '🥁', caption: 'Traditional drumming procession' },
      { id: 4, emoji: '🚶', caption: 'Village procession through Main Road' },
      { id: 5, emoji: '🔥', caption: 'Sacred havan ceremony at the temple' },
      { id: 6, emoji: '🙏', caption: 'Devotees gathered for evening aarti' },
      { id: 7, emoji: '🍛', caption: 'Community feast (prasadam) for all villagers' },
    ],
  },
  {
    id: 5,
    category: 'Development Work',
    name: 'Main Road Repair 2025',
    cover: '🚧',
    coverBg: '#ffedd5',
    coverFg: '#7c2d12',
    date: 'Dec 10, 2025',
    addedBy: 'Sarpanch Naidu',
    photos: [
      { id: 1, emoji: '🚧', caption: 'Road work in progress on Main Street' },
      { id: 2, emoji: '🛣️', caption: 'Freshly laid tar road surface' },
      { id: 3, emoji: '👷', caption: 'PWD workers laying the road' },
      { id: 4, emoji: '🚜', caption: 'Heavy road-roller machinery at work' },
      { id: 5, emoji: '✅', caption: 'Completed road — before and after comparison' },
    ],
  },
  {
    id: 6,
    category: 'Development Work',
    name: 'New Borewell Inauguration',
    cover: '💧',
    coverBg: '#cffafe',
    coverFg: '#164e63',
    date: 'Jan 20, 2026',
    addedBy: 'Nageswara Rao',
    photos: [
      { id: 1, emoji: '⚙️', caption: 'Borewell drilling equipment setup near South Colony' },
      { id: 2, emoji: '💧', caption: 'First water from the new borewell' },
      { id: 3, emoji: '👨‍👩‍👧‍👦', caption: 'Village families cheering at inauguration' },
      { id: 4, emoji: '🎉', caption: 'Sarpanch cutting the ribbon at inauguration ceremony' },
    ],
  },
  {
    id: 7,
    category: 'School & Education',
    name: 'Annual School Day 2025',
    cover: '🎓',
    coverBg: '#d1fae5',
    coverFg: '#065f46',
    date: 'Nov 15, 2025',
    addedBy: 'Suresh Rao',
    photos: [
      { id: 1, emoji: '🎭', caption: 'Students performing a classical dance' },
      { id: 2, emoji: '🎤', caption: 'Speech by a class 10 student' },
      { id: 3, emoji: '🏅', caption: 'Prize distribution by Sarpanch' },
      { id: 4, emoji: '👨‍🏫', caption: 'Teachers honoured on school day' },
      { id: 5, emoji: '📸', caption: 'Class group photo — students and teachers' },
      { id: 6, emoji: '🌺', caption: 'Parents attending the annual function' },
    ],
  },
  {
    id: 8,
    category: 'Family Events',
    name: 'Village Sports Day 2026',
    cover: '🏏',
    coverBg: '#dbeafe',
    coverFg: '#1e3a8a',
    date: 'Jan 26, 2026',
    addedBy: 'Ramesh Babu',
    photos: [
      { id: 1, emoji: '🏏', caption: 'Cricket match on the village ground' },
      { id: 2, emoji: '🤼', caption: 'Kabaddi tournament final' },
      { id: 3, emoji: '🏃', caption: "Women's 100m race" },
      { id: 4, emoji: '🎯', caption: 'Tug of war between two colonies' },
      { id: 5, emoji: '🏆', caption: 'Winners receiving trophies from Sarpanch' },
      { id: 6, emoji: '🍛', caption: 'Community lunch after all events' },
    ],
  },
];

const totalPhotos = ALBUMS.reduce((acc, a) => acc + a.photos.length, 0);

/* LoginModal removed – app uses global Firebase auth via /login route */

/* ─── Upload Modal ─── */
function UploadModal({ onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box modal-sm" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">📤 Upload Photo</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body" style={{ textAlign: 'center', padding: '40px 24px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🚧</div>
          <p style={{ color: 'var(--text-light)', marginBottom: '24px', lineHeight: 1.6 }}>
            Photo upload is coming soon! You will be able to upload photos from your phone
            or computer and add them to any album.
          </p>
          <button className="btn-save" onClick={onClose}>Got it</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Gallery Page ─── */
export default function Gallery() {
  const { user } = useAuth();
  const isLoggedIn = !!user;

  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedAlbum,  setSelectedAlbum]  = useState(null);
  const [lightboxIdx,    setLightboxIdx]    = useState(null);
  const [showUpload,     setShowUpload]     = useState(false);
  const [loginPrompt,    setLoginPrompt]    = useState(false);

  const filtered = activeCategory === 'All'
    ? ALBUMS
    : ALBUMS.filter(a => a.category === activeCategory);

  function handleUploadClick() {
    if (!isLoggedIn) { setLoginPrompt(true); }
    else { setShowUpload(true); }
  }

  const album  = selectedAlbum;
  const photos = album ? album.photos : [];

  function lbNext() { setLightboxIdx(i => (i + 1) % photos.length); }
  function lbPrev() { setLightboxIdx(i => (i - 1 + photos.length) % photos.length); }

  return (
    <div>
      <Navbar />

      {/* ── Hero ── */}
      <div className="gl-hero">
        <div className="gl-hero-inner">
          <div className="gl-hero-icon">🖼️</div>
          <h1 className="gl-hero-title">Village Gallery</h1>
          <p className="gl-hero-sub">Chinamanapuram · Gantyada Mandal · Vizianagaram District</p>
          <div className="gl-hero-pills">
            <span className="gl-hero-pill">📁 {ALBUMS.length} Albums</span>
            <span className="gl-hero-pill">🖼️ {totalPhotos} Photos</span>
            <span className="gl-hero-pill">🎉 Festivals, Events &amp; Development</span>
          </div>
        </div>
      </div>

      {/* ── Controls ── */}
      <div className="gl-controls">
        <div className="gl-controls-inner">
          <div className="gl-filters">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                className={`gl-filter-btn ${activeCategory === cat ? 'gl-filter-active' : ''}`}
                onClick={() => { setActiveCategory(cat); setSelectedAlbum(null); }}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="gl-right-actions">
            {isLoggedIn ? (
              <div className="gl-user-pill">
                <span>👤 {user.displayName?.split(' ')[0] || user.email?.split('@')[0]}</span>
                <Link to="/profile" className="gl-logout-btn">Profile</Link>
              </div>
            ) : (
              <Link to="/login" className="gl-login-btn">🔐 Login</Link>
            )}
            <button className="gl-upload-btn" onClick={handleUploadClick}>📤 Upload Photo</button>
          </div>
        </div>
      </div>

      {/* ── Main area ── */}
      <div className="gl-main">
        {!selectedAlbum ? (
          /* Album grid */
          <>
            <div className="gl-album-meta">
              Showing <strong>{filtered.length}</strong> album{filtered.length !== 1 ? 's' : ''}
              {activeCategory !== 'All' && <> in <strong>{activeCategory}</strong></>}
            </div>

            {filtered.length === 0 ? (
              <div className="gl-empty">
                <div className="gl-empty-icon">📂</div>
                <h3>No albums in this category yet</h3>
                <p>Be the first to add photos!</p>
              </div>
            ) : (
              <div className="gl-albums-grid">
                {filtered.map(alb => (
                  <div key={alb.id} className="album-card" onClick={() => setSelectedAlbum(alb)}>
                    <div className="album-cover" style={{ background: alb.coverBg, color: alb.coverFg }}>
                      <span className="album-cover-emoji">{alb.cover}</span>
                      <span className="album-photo-count">{alb.photos.length} photos</span>
                    </div>
                    <div className="album-info">
                      <div className="album-cat-badge">{alb.category}</div>
                      <div className="album-name">{alb.name}</div>
                      <div className="album-meta">
                        <span>📅 {alb.date}</span>
                        <span>👤 {alb.addedBy}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          /* Album detail view */
          <div className="gl-album-detail">
            <div className="gl-breadcrumb">
              <button
                className="gl-back-btn"
                onClick={() => { setSelectedAlbum(null); setLightboxIdx(null); }}
              >
                ← Back to Albums
              </button>
              <span className="gl-breadcrumb-sep">›</span>
              <span className="gl-breadcrumb-cur">{album.name}</span>
            </div>

            <div className="gl-album-detail-head">
              <div
                className="gl-album-detail-icon"
                style={{ background: album.coverBg, color: album.coverFg }}
              >
                {album.cover}
              </div>
              <div>
                <h2 className="gl-album-detail-name">{album.name}</h2>
                <div className="gl-album-detail-meta">
                  <span>📁 {album.category}</span>
                  <span>📅 {album.date}</span>
                  <span>👤 Added by {album.addedBy}</span>
                  <span>🖼️ {album.photos.length} photos</span>
                </div>
              </div>
            </div>

            <div className="gl-photo-grid">
              {album.photos.map((photo, idx) => (
                <div key={photo.id} className="photo-thumb" onClick={() => setLightboxIdx(idx)}>
                  <div className="photo-emoji">{photo.emoji}</div>
                  <div className="photo-caption">{photo.caption}</div>
                  <div className="photo-zoom">🔍</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-logo">🏘️</div>
          <div className="footer-village">Chinamanapuram Village Portal</div>
          <div className="footer-tagline">Gantyada Mandal · Vizianagaram District · Andhra Pradesh · India</div>
          <div className="footer-links">
            <Link to="/">Home</Link>
            <Link to="/families">Families</Link>
            <Link to="/family-tree">Family Tree</Link>
            <Link to="/complaints">Complaints</Link>
            <Link to="/chat">Chat</Link>
            <Link to="/education">Education</Link>
          </div>
          <div className="footer-copy">© 2026 Chinamanapuram Village Portal · Built with care for our community</div>
        </div>
      </footer>

      {/* ── Lightbox ── */}
      {lightboxIdx !== null && (
        <div className="gl-lightbox" onClick={() => setLightboxIdx(null)}>
          <div className="gl-lightbox-inner" onClick={e => e.stopPropagation()}>
            <button className="gl-lb-close" onClick={() => setLightboxIdx(null)}>✕</button>
            <div className="gl-lb-counter">{lightboxIdx + 1} / {photos.length}</div>
            <div className="gl-lb-emoji">{photos[lightboxIdx].emoji}</div>
            <div className="gl-lb-caption">{photos[lightboxIdx].caption}</div>
            <div className="gl-lb-nav">
              <button className="gl-lb-btn" onClick={lbPrev}>‹</button>
              <button className="gl-lb-btn" onClick={lbNext}>›</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      {showUpload && <UploadModal onClose={() => setShowUpload(false)} />}

      {/* ── Login Prompt ── */}
      {loginPrompt && (
        <div className="modal-overlay" onClick={() => setLoginPrompt(false)}>
          <div className="modal-box modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">🔐 Login Required</h2>
              <button className="modal-close" onClick={() => setLoginPrompt(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center', padding: '32px 24px' }}>
              <div style={{ fontSize: '3rem', marginBottom: 12 }}>📸</div>
              <p style={{ color: 'var(--text-mid)', marginBottom: 24, lineHeight: 1.6 }}>
                Please sign in to upload photos to the village gallery.
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

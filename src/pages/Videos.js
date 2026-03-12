import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { db, storage } from '../firebase';
import {
  collection, addDoc, onSnapshot, orderBy, query, serverTimestamp,
} from 'firebase/firestore';
import {
  ref, uploadBytesResumable, getDownloadURL,
} from 'firebase/storage';

const CATEGORIES = ['All', 'Village Events', 'Festivals', 'Development Work', 'School & Education', 'Family Events'];

/* ─── YouTube ID extractor ─── */
function extractYouTubeId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/.*[?&]v=([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

/* ─── Add YouTube Modal ─── */
function YouTubeModal({ user, onClose, onAdded }) {
  const [url,      setUrl]      = useState('');
  const [title,    setTitle]    = useState('');
  const [category, setCategory] = useState('Village Events');
  const [desc,     setDesc]     = useState('');
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');

  const previewId = extractYouTubeId(url);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!url.trim())   { setError('Please paste a YouTube link.'); return; }
    if (!previewId)    { setError('Could not read a valid YouTube video ID from this link.'); return; }
    if (!title.trim()) { setError('Please enter a title.'); return; }

    setSaving(true);
    setError('');
    try {
      await addDoc(collection(db, 'videos'), {
        type:           'youtube',
        youtubeId:      previewId,
        title:          title.trim(),
        category,
        description:    desc.trim(),
        uploadedBy:     user.uid,
        uploadedByName: user.displayName || user.email?.split('@')[0] || 'Villager',
        createdAt:      serverTimestamp(),
      });
      setSaving(false);
      onAdded();
      onClose();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">▶️ Add YouTube Video</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form className="modal-body" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label className="form-label">YouTube Link *</label>
            <input
              className="form-input"
              placeholder="https://www.youtube.com/watch?v=..."
              value={url}
              onChange={e => setUrl(e.target.value)}
              disabled={saving}
            />
          </div>

          {/* Live preview thumbnail */}
          {previewId && (
            <div className="yt-modal-preview">
              <img
                src={`https://img.youtube.com/vi/${previewId}/hqdefault.jpg`}
                alt="YouTube thumbnail"
                className="yt-modal-thumb"
              />
              <div className="yt-modal-preview-label">✅ Valid YouTube video detected</div>
            </div>
          )}

          <div>
            <label className="form-label">Title *</label>
            <input
              className="form-input"
              placeholder="E.g. Ugadi Celebrations 2026"
              value={title}
              onChange={e => setTitle(e.target.value)}
              disabled={saving}
            />
          </div>
          <div>
            <label className="form-label">Category</label>
            <select className="form-input" value={category} onChange={e => setCategory(e.target.value)} disabled={saving}>
              {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Description</label>
            <textarea
              className="form-input"
              rows={3}
              placeholder="Brief description..."
              value={desc}
              onChange={e => setDesc(e.target.value)}
              disabled={saving}
              style={{ resize: 'vertical' }}
            />
          </div>

          {error && <div className="form-error">{error}</div>}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" className="btn-cancel" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className="btn-save" disabled={saving}>
              {saving ? 'Saving…' : '▶️ Add Video'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Upload Modal (own video file) ─── */
function UploadModal({ user, onClose, onUploaded }) {
  const [title,    setTitle]    = useState('');
  const [category, setCategory] = useState('Village Events');
  const [desc,     setDesc]     = useState('');
  const [file,     setFile]     = useState(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error,    setError]    = useState('');

  function handleFile(e) {
    const f = e.target.files[0];
    if (!f) return;
    if (!f.type.startsWith('video/')) { setError('Please select a video file.'); return; }
    if (f.size > 200 * 1024 * 1024)  { setError('File must be under 200 MB.'); return; }
    setError('');
    setFile(f);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file)         { setError('Please select a video file.'); return; }
    if (!title.trim()) { setError('Please enter a title.'); return; }

    setUploading(true);
    setError('');

    try {
      const storageRef = ref(storage, `videos/${user.uid}/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed',
        snap => setProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
        err  => { setError(err.message); setUploading(false); },
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          await addDoc(collection(db, 'videos'), {
            type:           'uploaded',
            title:          title.trim(),
            category,
            description:    desc.trim(),
            url,
            fileName:       file.name,
            size:           file.size,
            uploadedBy:     user.uid,
            uploadedByName: user.displayName || user.email?.split('@')[0] || 'Villager',
            createdAt:      serverTimestamp(),
          });
          setUploading(false);
          onUploaded();
          onClose();
        }
      );
    } catch (err) {
      setError(err.message);
      setUploading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">📤 Upload Your Video</h2>
          <button className="modal-close" onClick={onClose} disabled={uploading}>✕</button>
        </div>
        <form className="modal-body" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label className="form-label">Title *</label>
            <input
              className="form-input"
              placeholder="E.g. Ugadi Celebrations 2026"
              value={title}
              onChange={e => setTitle(e.target.value)}
              disabled={uploading}
            />
          </div>
          <div>
            <label className="form-label">Category</label>
            <select className="form-input" value={category} onChange={e => setCategory(e.target.value)} disabled={uploading}>
              {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Description</label>
            <textarea
              className="form-input"
              rows={3}
              placeholder="Brief description of the video..."
              value={desc}
              onChange={e => setDesc(e.target.value)}
              disabled={uploading}
              style={{ resize: 'vertical' }}
            />
          </div>
          <div>
            <label className="form-label">Video File * (MP4, MOV, etc. – max 200 MB)</label>
            <input
              type="file"
              accept="video/*"
              onChange={handleFile}
              disabled={uploading}
              style={{ display: 'block', width: '100%', padding: '8px 0' }}
            />
            {file && <div style={{ fontSize: 13, color: 'var(--text-light)', marginTop: 4 }}>Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(1)} MB)</div>}
          </div>

          {uploading && (
            <div>
              <div className="vid-progress-bar">
                <div className="vid-progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-light)', marginTop: 4, textAlign: 'center' }}>Uploading… {progress}%</div>
            </div>
          )}

          {error && <div className="form-error">{error}</div>}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" className="btn-cancel" onClick={onClose} disabled={uploading}>Cancel</button>
            <button type="submit" className="btn-save" disabled={uploading}>
              {uploading ? `Uploading ${progress}%` : '📤 Upload Video'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── YouTube Player Modal ─── */
function YouTubePlayerModal({ video, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="vid-player-modal" onClick={e => e.stopPropagation()}>
        <div className="vid-player-header">
          <div>
            <div className="vid-player-title">{video.title}</div>
            <div className="vid-player-meta">
              <span className="yt-badge">▶ YouTube</span>
              <span>📁 {video.category}</span>
              <span>👤 {video.uploadedByName}</span>
              {video.createdAt?.seconds && (
                <span>📅 {new Date(video.createdAt.seconds * 1000).toLocaleDateString('en-IN')}</span>
              )}
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="yt-iframe-wrap">
          <iframe
            src={`https://www.youtube.com/embed/${video.youtubeId}?autoplay=1`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="yt-iframe"
          />
        </div>

        {video.description && (
          <div className="vid-player-desc">{video.description}</div>
        )}

        <div className="vid-player-actions">
          <a
            href={`https://www.ssyoutube.com/watch?v=${video.youtubeId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="vid-download-btn"
          >
            ⬇️ Download Video
          </a>
          <a
            href={`https://www.youtube.com/watch?v=${video.youtubeId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-cancel"
            style={{ textDecoration: 'none' }}
          >
            ▶ Open on YouTube
          </a>
          <button className="btn-cancel" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Uploaded Video Player Modal ─── */
function PlayerModal({ video, onClose }) {
  async function handleDownload() {
    try {
      const res  = await fetch(video.url);
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = video.fileName || `${video.title}.mp4`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      window.open(video.url, '_blank');
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="vid-player-modal" onClick={e => e.stopPropagation()}>
        <div className="vid-player-header">
          <div>
            <div className="vid-player-title">{video.title}</div>
            <div className="vid-player-meta">
              <span>📁 {video.category}</span>
              <span>👤 {video.uploadedByName}</span>
              {video.createdAt?.seconds && (
                <span>📅 {new Date(video.createdAt.seconds * 1000).toLocaleDateString('en-IN')}</span>
              )}
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <video src={video.url} controls autoPlay className="vid-player-video" />

        {video.description && (
          <div className="vid-player-desc">{video.description}</div>
        )}

        <div className="vid-player-actions">
          <button className="vid-download-btn" onClick={handleDownload}>⬇️ Download Video</button>
          <button className="btn-cancel" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Videos Page ─── */
export default function Videos() {
  const { user } = useAuth();
  const isLoggedIn = !!user;

  const [videos,         setVideos]         = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeTab,      setActiveTab]      = useState('all'); // 'all' | 'youtube' | 'uploaded'
  const [showUpload,     setShowUpload]     = useState(false);
  const [showYouTube,    setShowYouTube]    = useState(false);
  const [loginPrompt,    setLoginPrompt]    = useState(false);
  const [playingVideo,   setPlayingVideo]   = useState(null);

  useEffect(() => {
    const q = query(collection(db, 'videos'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setVideos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, () => setLoading(false));
    return unsub;
  }, []);

  // Apply category + tab filters
  let filtered = activeCategory === 'All' ? videos : videos.filter(v => v.category === activeCategory);
  if (activeTab === 'youtube')  filtered = filtered.filter(v => v.type === 'youtube');
  if (activeTab === 'uploaded') filtered = filtered.filter(v => v.type === 'uploaded');

  const youtubeCount  = videos.filter(v => v.type === 'youtube').length;
  const uploadedCount = videos.filter(v => v.type === 'uploaded').length;

  function requireLogin(cb) {
    if (!isLoggedIn) { setLoginPrompt(true); }
    else             { cb(); }
  }

  function formatSize(bytes) {
    if (!bytes) return '';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  async function handleQuickDownload(e, video) {
    e.stopPropagation();
    try {
      const res  = await fetch(video.url);
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = video.fileName || `${video.title}.mp4`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      window.open(video.url, '_blank');
    }
  }

  return (
    <div>
      <Navbar />

      {/* ── Hero ── */}
      <div className="vid-hero">
        <div className="vid-hero-inner">
          <div className="vid-hero-icon">🎬</div>
          <h1 className="vid-hero-title">Village Videos</h1>
          <p className="vid-hero-sub">Chinamanapuram · Gantyada Mandal · Vizianagaram District</p>
          <div className="vid-hero-pills">
            <span className="vid-hero-pill">🎬 {videos.length} Total Videos</span>
            <span className="vid-hero-pill">▶️ {youtubeCount} YouTube</span>
            <span className="vid-hero-pill">📤 {uploadedCount} Uploaded</span>
          </div>
        </div>
      </div>

      {/* ── Tab + Controls ── */}
      <div className="vid-controls">
        <div className="vid-controls-inner">
          {/* Source tabs */}
          <div className="vid-tabs">
            <button className={`vid-tab${activeTab === 'all'      ? ' vid-tab-active' : ''}`} onClick={() => setActiveTab('all')}>All Videos</button>
            <button className={`vid-tab${activeTab === 'youtube'  ? ' vid-tab-active' : ''}`} onClick={() => setActiveTab('youtube')}>▶ YouTube</button>
            <button className={`vid-tab${activeTab === 'uploaded' ? ' vid-tab-active' : ''}`} onClick={() => setActiveTab('uploaded')}>📤 Uploaded</button>
          </div>

          {/* Action buttons */}
          <div className="vid-action-btns">
            <button className="vid-yt-btn"     onClick={() => requireLogin(() => setShowYouTube(true))}>▶ Add YouTube Video</button>
            <button className="vid-upload-btn" onClick={() => requireLogin(() => setShowUpload(true))}>📤 Upload Video</button>
          </div>
        </div>

        {/* Category filters */}
        <div className="vid-filters-row">
          <div className="vid-filters">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                className={`vid-filter-btn${activeCategory === cat ? ' vid-filter-active' : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main ── */}
      <div className="vid-main">
        {loading ? (
          <div className="vid-empty">
            <div className="vid-empty-icon">⏳</div>
            <h3>Loading videos…</h3>
          </div>
        ) : filtered.length === 0 ? (
          <div className="vid-empty">
            <div className="vid-empty-icon">🎬</div>
            <h3>No videos yet</h3>
            <p>Add a YouTube link or upload your own village video!</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 16, flexWrap: 'wrap' }}>
              <button className="vid-yt-btn"     onClick={() => requireLogin(() => setShowYouTube(true))}>▶ Add YouTube Video</button>
              <button className="vid-upload-btn" onClick={() => requireLogin(() => setShowUpload(true))}>📤 Upload Video</button>
            </div>
          </div>
        ) : (
          <>
            <div className="vid-count">
              Showing <strong>{filtered.length}</strong> video{filtered.length !== 1 ? 's' : ''}
              {activeCategory !== 'All' && <> in <strong>{activeCategory}</strong></>}
            </div>
            <div className="vid-grid">
              {filtered.map(video => (
                <div key={video.id} className="vid-card" onClick={() => setPlayingVideo(video)}>

                  {/* Thumbnail */}
                  <div className="vid-thumb">
                    {video.type === 'youtube' ? (
                      <>
                        <img
                          src={`https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`}
                          alt={video.title}
                          className="vid-thumb-img"
                        />
                        <div className="vid-play-overlay yt-play-overlay">▶</div>
                        <div className="yt-logo-badge">YouTube</div>
                      </>
                    ) : (
                      <>
                        <video src={video.url} preload="metadata" className="vid-thumb-video" />
                        <div className="vid-play-overlay">▶</div>
                      </>
                    )}
                  </div>

                  {/* Body */}
                  <div className="vid-card-body">
                    <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                      <div className="vid-cat-badge">{video.category}</div>
                      {video.type === 'youtube' && <div className="yt-type-badge">▶ YouTube</div>}
                    </div>
                    <div className="vid-card-title">{video.title}</div>
                    {video.description && <div className="vid-card-desc">{video.description}</div>}
                    <div className="vid-card-meta">
                      <span>👤 {video.uploadedByName}</span>
                      {video.createdAt?.seconds && (
                        <span>📅 {new Date(video.createdAt.seconds * 1000).toLocaleDateString('en-IN')}</span>
                      )}
                      {video.size && <span>📦 {formatSize(video.size)}</span>}
                    </div>
                    <div className="vid-card-actions">
                      <button className="vid-play-btn" onClick={() => setPlayingVideo(video)}>▶ Play</button>
                      {video.type === 'youtube' ? (
                        <a
                          href={`https://www.ssyoutube.com/watch?v=${video.youtubeId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="vid-dl-btn"
                          onClick={e => e.stopPropagation()}
                        >
                          ⬇️ Download
                        </a>
                      ) : (
                        <button className="vid-dl-btn" onClick={e => handleQuickDownload(e, video)}>⬇️ Download</button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
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
            <Link to="/gallery">Gallery</Link>
            <Link to="/videos">Videos</Link>
            <Link to="/complaints">Complaints</Link>
            <Link to="/chat">Chat</Link>
            <Link to="/education">Education</Link>
          </div>
          <div className="footer-copy">© 2026 Chinamanapuram Village Portal · Built with care for our community</div>
        </div>
      </footer>

      {/* ── Modals ── */}
      {showYouTube && (
        <YouTubeModal
          user={user}
          onClose={() => setShowYouTube(false)}
          onAdded={() => {}}
        />
      )}

      {showUpload && (
        <UploadModal
          user={user}
          onClose={() => setShowUpload(false)}
          onUploaded={() => {}}
        />
      )}

      {playingVideo && (
        playingVideo.type === 'youtube'
          ? <YouTubePlayerModal video={playingVideo} onClose={() => setPlayingVideo(null)} />
          : <PlayerModal        video={playingVideo} onClose={() => setPlayingVideo(null)} />
      )}

      {loginPrompt && (
        <div className="modal-overlay" onClick={() => setLoginPrompt(false)}>
          <div className="modal-box modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">🔐 Login Required</h2>
              <button className="modal-close" onClick={() => setLoginPrompt(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center', padding: '32px 24px' }}>
              <div style={{ fontSize: '3rem', marginBottom: 12 }}>🎬</div>
              <p style={{ color: 'var(--text-mid)', marginBottom: 24, lineHeight: 1.6 }}>
                Please sign in to add videos to the village portal.
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

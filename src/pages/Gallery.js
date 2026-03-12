import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { db, storage } from '../firebase';
import {
  collection, addDoc, onSnapshot, deleteDoc, doc, query, orderBy, serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';

const ADMIN_EMAILS = ['admin@chinamanapuram.com', 'ramakrushna.pram@gmail.com'];

const CATEGORIES = ['All', 'Village Photos', 'Festival Photos', 'Development Work', 'School & Education', 'Family Events'];

/* ── Default albums shown before any are added to Firestore ── */
const DEFAULT_ALBUMS = [
  { id: 'default-1', name: 'Pongal Celebrations 2026', category: 'Festival Photos', date: 'Jan 14, 2026', cover: '🎑', isDefault: true },
  { id: 'default-2', name: 'Ugadi Festival 2025',       category: 'Festival Photos', date: 'Mar 30, 2025', cover: '🌺', isDefault: true },
  { id: 'default-3', name: 'Main Road Repair 2025',     category: 'Development Work', date: 'Dec 10, 2025', cover: '🚧', isDefault: true },
  { id: 'default-4', name: 'Annual School Day 2025',    category: 'School & Education', date: 'Nov 15, 2025', cover: '🎓', isDefault: true },
];

/* ── Upload Modal ── */
function UploadModal({ user, albums, onClose }) {
  const [albumId,   setAlbumId]   = useState(albums[0]?.id || '');
  const [caption,   setCaption]   = useState('');
  const [file,      setFile]      = useState(null);
  const [preview,   setPreview]   = useState('');
  const [progress,  setProgress]  = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error,     setError]     = useState('');
  const [done,      setDone]      = useState(false);
  const taskRef = useRef(null);

  function handleFile(e) {
    const f = e.target.files[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) { setError('Please select an image file.'); return; }
    if (f.size > 10 * 1024 * 1024) { setError('File too large (max 10 MB).'); return; }
    setFile(f);
    setError('');
    const reader = new FileReader();
    reader.onload = ev => setPreview(ev.target.result);
    reader.readAsDataURL(f);
  }

  async function handleUpload(e) {
    e.preventDefault();
    if (!file) { setError('Please choose a photo.'); return; }
    if (!albumId) { setError('Please select an album.'); return; }
    setUploading(true); setError(''); setProgress(0);
    try {
      const ext = file.name.split('.').pop();
      const path = `gallery/${albumId}/${user.uid}_${Date.now()}.${ext}`;
      const storageRef = ref(storage, path);
      const task = uploadBytesResumable(storageRef, file);
      taskRef.current = task;
      task.on('state_changed',
        snap => setProgress(Math.round(snap.bytesTransferred / snap.totalBytes * 100)),
        err => { setError(err.message); setUploading(false); },
        async () => {
          const url = await getDownloadURL(task.snapshot.ref);
          await addDoc(collection(db, 'galleryPhotos'), {
            albumId, url, storagePath: path,
            caption: caption.trim(),
            addedBy: user.uid,
            addedByName: user.displayName || user.email?.split('@')[0] || 'Villager',
            createdAt: serverTimestamp(),
          });
          setUploading(false);
          setDone(true);
        }
      );
    } catch (err) {
      setError(err.message);
      setUploading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={!uploading ? onClose : undefined}>
      <div className="modal-box" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">📤 Upload Photo</h2>
          <button className="modal-close" onClick={!uploading ? onClose : undefined}>✕</button>
        </div>
        {done ? (
          <div className="modal-body" style={{ textAlign: 'center', padding: '40px 24px' }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>✅</div>
            <p style={{ fontWeight: 700, color: '#1a6b3c', marginBottom: 16 }}>Photo uploaded successfully!</p>
            <button className="btn-save" onClick={onClose}>Close</button>
          </div>
        ) : (
          <form className="modal-body" onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Album picker */}
            <div>
              <label className="form-label">Album *</label>
              <select className="form-input" value={albumId} onChange={e => setAlbumId(e.target.value)} required>
                {albums.length === 0 && <option value="">No albums yet</option>}
                {albums.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>

            {/* Photo picker */}
            <div>
              <label className="form-label">Photo *</label>
              {preview && (
                <img src={preview} alt="preview" style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 10, marginBottom: 8 }} />
              )}
              <input type="file" accept="image/*" onChange={handleFile} style={{ width: '100%' }} required={!file} />
            </div>

            {/* Caption */}
            <div>
              <label className="form-label">Caption (optional)</label>
              <input className="form-input" value={caption} onChange={e => setCaption(e.target.value)} placeholder="e.g. Pongal celebrations at the temple" />
            </div>

            {/* Progress */}
            {uploading && (
              <div>
                <div style={{ background: '#e5e7eb', borderRadius: 99, height: 8, overflow: 'hidden' }}>
                  <div style={{ background: '#1a6b3c', height: '100%', width: `${progress}%`, transition: 'width 0.3s' }} />
                </div>
                <div style={{ fontSize: '0.8rem', color: '#555', marginTop: 4 }}>Uploading {progress}%…</div>
              </div>
            )}

            {error && <div style={{ background: '#fee2e2', color: '#dc2626', padding: '8px 12px', borderRadius: 8, fontSize: '0.83rem' }}>{error}</div>}

            <div className="modal-footer">
              <button type="button" className="btn-cancel" onClick={onClose} disabled={uploading}>Cancel</button>
              <button type="submit" className="btn-save" disabled={uploading || albums.length === 0}>
                {uploading ? `Uploading ${progress}%…` : '📤 Upload'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

/* ── Add Album Modal ── */
function AddAlbumModal({ onClose }) {
  const [form, setForm] = useState({ name: '', category: 'Village Photos', date: '', cover: '🖼️' });
  const [saving, setSaving] = useState(false);
  async function handleSave(e) {
    e.preventDefault(); setSaving(true);
    try {
      await addDoc(collection(db, 'galleryAlbums'), { ...form, createdAt: serverTimestamp() });
      onClose();
    } catch (_) {}
    setSaving(false);
  }
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">📁 Create Album</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form className="modal-body" onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label className="form-label">Album Name *</label>
            <input className="form-input" value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} required placeholder="e.g. Ugadi 2026" />
          </div>
          <div>
            <label className="form-label">Category</label>
            <select className="form-input" value={form.category} onChange={e => setForm(f=>({...f,category:e.target.value}))}>
              {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="form-label">Date</label>
              <input className="form-input" value={form.date} onChange={e => setForm(f=>({...f,date:e.target.value}))} placeholder="e.g. Mar 19, 2026" />
            </div>
            <div>
              <label className="form-label">Cover Emoji</label>
              <input className="form-input" value={form.cover} onChange={e => setForm(f=>({...f,cover:e.target.value}))} placeholder="🖼️" />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-save" disabled={saving}>{saving ? 'Creating…' : '📁 Create Album'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Main Gallery Page ── */
export default function Gallery() {
  const { user } = useAuth();
  const isAdmin  = user && ADMIN_EMAILS.includes(user.email);

  const [albums,   setAlbums]   = useState([]);
  const [photos,   setPhotos]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedAlbum,  setSelectedAlbum]  = useState(null);
  const [lightboxIdx,    setLightboxIdx]    = useState(null);
  const [showUpload,     setShowUpload]     = useState(false);
  const [showAddAlbum,   setShowAddAlbum]   = useState(false);
  const [loginPrompt,    setLoginPrompt]    = useState(false);

  /* Load albums from Firestore */
  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'galleryAlbums'), orderBy('createdAt', 'desc')),
      snap => {
        const fetched = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setAlbums(fetched.length > 0 ? fetched : DEFAULT_ALBUMS);
        setLoading(false);
      },
      () => { setAlbums(DEFAULT_ALBUMS); setLoading(false); }
    );
    return unsub;
  }, []);

  /* Load photos from Firestore */
  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'galleryPhotos'), orderBy('createdAt', 'desc')),
      snap => setPhotos(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      () => {}
    );
    return unsub;
  }, []);

  const allAlbums = albums;
  const filtered  = activeCategory === 'All' ? allAlbums : allAlbums.filter(a => a.category === activeCategory);
  const albumPhotos = selectedAlbum ? photos.filter(p => p.albumId === selectedAlbum.id) : [];
  const totalPhotos = photos.length;

  async function deletePhoto(photo) {
    if (!window.confirm('Delete this photo?')) return;
    try {
      if (photo.storagePath) await deleteObject(ref(storage, photo.storagePath)).catch(()=>{});
      await deleteDoc(doc(db, 'galleryPhotos', photo.id));
    } catch (_) {}
  }

  async function deleteAlbum(album) {
    if (!window.confirm(`Delete album "${album.name}" and all its photos?`)) return;
    try {
      const albumPics = photos.filter(p => p.albumId === album.id);
      for (const p of albumPics) {
        if (p.storagePath) await deleteObject(ref(storage, p.storagePath)).catch(()=>{});
        await deleteDoc(doc(db, 'galleryPhotos', p.id)).catch(()=>{});
      }
      if (!album.isDefault) await deleteDoc(doc(db, 'galleryAlbums', album.id));
      if (selectedAlbum?.id === album.id) setSelectedAlbum(null);
    } catch (_) {}
  }

  return (
    <div>
      <Navbar />

      {/* Hero */}
      <div className="gl-hero">
        <div className="gl-hero-inner">
          <div className="gl-hero-icon">🖼️</div>
          <h1 className="gl-hero-title">Village Gallery</h1>
          <p className="gl-hero-sub">Chinamanapuram · Gantyada Mandal · Vizianagaram District</p>
          <div className="gl-hero-pills">
            <span className="gl-hero-pill">📁 {allAlbums.length} Albums</span>
            <span className="gl-hero-pill">🖼️ {totalPhotos} Photos</span>
            <span className="gl-hero-pill">🎉 Festivals, Events &amp; Development</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="gl-controls">
        <div className="gl-controls-inner">
          <div className="gl-filters">
            {CATEGORIES.map(cat => (
              <button key={cat}
                className={`gl-filter-btn ${activeCategory === cat ? 'gl-filter-active' : ''}`}
                onClick={() => { setActiveCategory(cat); setSelectedAlbum(null); }}>
                {cat}
              </button>
            ))}
          </div>
          <div className="gl-right-actions">
            {user ? (
              <div className="gl-user-pill">
                <span>👤 {user.displayName?.split(' ')[0] || user.email?.split('@')[0]}</span>
                <Link to="/profile" className="gl-logout-btn">Profile</Link>
              </div>
            ) : (
              <Link to="/login" className="gl-login-btn">🔐 Login</Link>
            )}
            {isAdmin && (
              <button className="gl-upload-btn" style={{ background: '#1a3c2a', marginRight: 6 }} onClick={() => setShowAddAlbum(true)}>
                📁 New Album
              </button>
            )}
            <button className="gl-upload-btn" onClick={() => user ? setShowUpload(true) : setLoginPrompt(true)}>
              📤 Upload Photo
            </button>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="gl-main">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#888' }}>Loading gallery…</div>
        ) : !selectedAlbum ? (
          /* Album Grid */
          <div className="gl-album-grid">
            {filtered.map(album => {
              const count = photos.filter(p => p.albumId === album.id).length;
              const firstPhoto = photos.find(p => p.albumId === album.id);
              return (
                <div key={album.id} className="gl-album-card" onClick={() => setSelectedAlbum(album)}>
                  {/* Cover */}
                  <div className="gl-album-cover" style={{ position: 'relative' }}>
                    {firstPhoto ? (
                      <img src={firstPhoto.url} alt={album.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div className="gl-album-emoji-cover" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3.5rem', background: '#f0fdf4' }}>
                        {album.cover || '🖼️'}
                      </div>
                    )}
                    {count > 0 && (
                      <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.6)', color: '#fff', borderRadius: 99, padding: '3px 10px', fontSize: '0.72rem', fontWeight: 700 }}>
                        {count} 📷
                      </div>
                    )}
                    {isAdmin && (
                      <button onClick={e => { e.stopPropagation(); deleteAlbum(album); }}
                        style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(220,38,38,0.85)', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 8px', fontSize: '0.7rem', cursor: 'pointer' }}>
                        🗑️
                      </button>
                    )}
                  </div>
                  <div className="gl-album-info">
                    <div className="gl-album-name">{album.name}</div>
                    <div className="gl-album-meta">
                      <span className="gl-album-category">{album.category}</span>
                      <span>{album.date}</span>
                    </div>
                    <div style={{ marginTop: 6, fontSize: '0.78rem', color: count > 0 ? '#1a6b3c' : '#aaa', fontWeight: 600 }}>
                      {count > 0 ? `${count} photo${count > 1 ? 's' : ''}` : 'No photos yet — be the first!'}
                    </div>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 0', color: '#888' }}>
                <div style={{ fontSize: '3rem', marginBottom: 12 }}>📭</div>
                <div>No albums in this category yet.</div>
              </div>
            )}
          </div>
        ) : (
          /* Photo Grid inside album */
          <div>
            <div className="gl-back-bar">
              <button className="gl-back-btn" onClick={() => setSelectedAlbum(null)}>← Back to Albums</button>
              <div className="gl-album-breadcrumb">
                <span className="gl-album-breadcrumb-cat">{selectedAlbum.category}</span>
                <span style={{ color: '#aaa', margin: '0 6px' }}>›</span>
                <strong>{selectedAlbum.name}</strong>
                <span style={{ color: '#888', marginLeft: 8, fontSize: '0.8rem' }}>({albumPhotos.length} photos)</span>
              </div>
            </div>

            {albumPhotos.length === 0 ? (
              <div className="gl-album-empty">
                <div className="gl-album-empty-icon">📷</div>
                <p>No photos in this album yet.</p>
                {user
                  ? <button className="btn-save" onClick={() => setShowUpload(true)}>📤 Upload First Photo</button>
                  : <Link to="/login" className="btn-save" style={{ display: 'inline-block', textDecoration: 'none' }}>🔐 Login to Upload</Link>
                }
              </div>
            ) : (
              <div className="gl-photo-grid">
                {albumPhotos.map((photo, idx) => (
                  <div key={photo.id} className="gl-photo-card" onClick={() => setLightboxIdx(idx)}>
                    <div className="gl-photo-thumb">
                      <img src={photo.url} alt={photo.caption || 'Village photo'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    {photo.caption && <div className="gl-photo-caption">{photo.caption}</div>}
                    {(isAdmin || photo.addedBy === user?.uid) && (
                      <button onClick={e => { e.stopPropagation(); deletePhoto(photo); }}
                        style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(220,38,38,0.85)', color: '#fff', border: 'none', borderRadius: 6, padding: '3px 7px', fontSize: '0.7rem', cursor: 'pointer' }}>
                        🗑️
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxIdx !== null && albumPhotos[lightboxIdx] && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setLightboxIdx(null)}>
          <button onClick={e => { e.stopPropagation(); setLightboxIdx(i => (i - 1 + albumPhotos.length) % albumPhotos.length); }}
            style={{ position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: 48, height: 48, color: '#fff', fontSize: '1.4rem', cursor: 'pointer' }}>‹</button>
          <div style={{ maxWidth: '90vw', maxHeight: '90vh', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <img src={albumPhotos[lightboxIdx].url} alt="" style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: 12, objectFit: 'contain' }} />
            {albumPhotos[lightboxIdx].caption && (
              <p style={{ color: '#fff', marginTop: 12, fontSize: '0.9rem' }}>{albumPhotos[lightboxIdx].caption}</p>
            )}
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.78rem', marginTop: 4 }}>
              {lightboxIdx + 1} / {albumPhotos.length} · Added by {albumPhotos[lightboxIdx].addedByName}
            </p>
          </div>
          <button onClick={e => { e.stopPropagation(); setLightboxIdx(i => (i + 1) % albumPhotos.length); }}
            style={{ position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: 48, height: 48, color: '#fff', fontSize: '1.4rem', cursor: 'pointer' }}>›</button>
          <button onClick={() => setLightboxIdx(null)}
            style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: 40, height: 40, color: '#fff', fontSize: '1.1rem', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {/* Login prompt */}
      {loginPrompt && (
        <div className="modal-overlay" onClick={() => setLoginPrompt(false)}>
          <div className="modal-box modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">🔐 Login Required</h2>
              <button className="modal-close" onClick={() => setLoginPrompt(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center', padding: '32px 24px' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📷</div>
              <p style={{ color: '#555', marginBottom: 20 }}>Please login to upload photos to the village gallery.</p>
              <Link to="/login" className="btn-save" style={{ textDecoration: 'none', display: 'inline-block' }}>🔐 Login</Link>
            </div>
          </div>
        </div>
      )}

      {/* Upload modal */}
      {showUpload && <UploadModal user={user} albums={allAlbums} onClose={() => setShowUpload(false)} />}

      {/* Add album modal */}
      {showAddAlbum && <AddAlbumModal onClose={() => setShowAddAlbum(false)} />}
    </div>
  );
}

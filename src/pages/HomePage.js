import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { db } from '../firebase';
import { collection, onSnapshot, query, limit } from 'firebase/firestore';

const QUICK_LINKS = [
  { to: '/families',    icon: '👨‍👩‍👧‍👦', label: 'Families',    color: 'teal'   },
  { to: '/family-tree', icon: '🌳',       label: 'Family Tree', color: 'green'  },
  { to: '/gallery',     icon: '🖼️',       label: 'Gallery',     color: 'orange' },
  { to: '/complaints',  icon: '📣',       label: 'Complaints',  color: 'red'    },
  { to: '/chat',        icon: '💬',       label: 'Village Chat',color: 'blue'   },
  { to: '/education',   icon: '📚',       label: 'Education',   color: 'purple' },
];

const PARTICLES = [
  { size:6,  top:'12%', left:'8%',  delay:'0s',   dur:'7s'  },
  { size:10, top:'25%', left:'88%', delay:'1.2s', dur:'9s'  },
  { size:4,  top:'60%', left:'5%',  delay:'2.5s', dur:'6s'  },
  { size:8,  top:'75%', left:'92%', delay:'0.8s', dur:'8s'  },
  { size:5,  top:'40%', left:'50%', delay:'3s',   dur:'11s' },
  { size:7,  top:'85%', left:'30%', delay:'1.8s', dur:'7.5s'},
  { size:4,  top:'18%', left:'65%', delay:'4s',   dur:'9.5s'},
  { size:9,  top:'50%', left:'78%', delay:'0.4s', dur:'8.5s'},
];

const DEFAULT_ANNOUNCEMENTS = [
  { id:1, tag:'urgent', badge:'urgent', icon:'🚨', title:'Road Repair Work – Main Street',    desc:'Road repair work is ongoing on Main Street near the temple. Please use alternate routes. Expected completion: 5 days.', date:'Today'     },
  { id:2, tag:'event',  badge:'event',  icon:'🎉', title:'Ugadi Festival Celebrations',       desc:'Ugadi festival will be celebrated at Panchayat grounds on March 10. All families are invited. Cultural programs from 5 PM.', date:'Mar 10'  },
  { id:3, tag:'info',   badge:'info',   icon:'💧', title:'Water Supply Restoration',          desc:'Water supply has been fully restored in South Colony after pipeline repair. Regular timings resumed from 6 AM – 8 AM.',       date:'Yesterday'},
  { id:4, tag:'notice', badge:'notice', icon:'📚', title:'Scholarship Applications Open',     desc:'Scholarship applications are open for Class 10 students. Visit Panchayat office with mark sheets and Aadhaar card.',          date:'Feb 28'  },
];

const DEFAULT_EVENTS = [
  { id:1, color:'purple', icon:'🥁', date:'Apr 14, 2026', title:'Chinamanapuram Jatara Festival', desc:'Annual Jatara festival with traditional rituals, folk dances, community feast, and cultural performances. All villagers and guests are welcome!' },
  { id:2, color:'green',  icon:'🏥', date:'Mar 5, 2026',  title:'Free Health Camp',    desc:'Free check-up for all villagers at Panchayat Office. Specialists from Vizianagaram hospital attending.' },
  { id:3, color:'orange', icon:'🎉', date:'Mar 10, 2026', title:'Ugadi Festival',       desc:'Grand Ugadi celebrations with cultural programs, traditional food, and prize distribution for students.'   },
  { id:4, color:'blue',   icon:'🌱', date:'Mar 20, 2026', title:'Plantation Drive',     desc:'Village-wide tree plantation drive. Join us to plant 500 saplings along the main road and school grounds.'},
  
];

export default function HomePage() {
  const [announcements, setAnnouncements] = useState(DEFAULT_ANNOUNCEMENTS);
  const [events,        setEvents]        = useState(DEFAULT_EVENTS);

  useEffect(() => {
    try {
      const q = query(collection(db, 'announcements'), limit(10));
      const unsub = onSnapshot(q,
        snap => { if (!snap.empty) setAnnouncements(snap.docs.map(d => ({ id: d.id, ...d.data() }))); },
        () => {}
      );
      return unsub;
    } catch (_) {}
  }, []);

  useEffect(() => {
    try {
      const q = query(collection(db, 'events'), limit(6));
      const unsub = onSnapshot(q,
        snap => { if (!snap.empty) setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() }))); },
        () => {}
      );
      return unsub;
    } catch (_) {}
  }, []);

  return (
    <div className="homepage">
      <Navbar />

      {/* ══════════════════════════════════════
          3D PREMIUM HERO
      ══════════════════════════════════════ */}
      <section className="hp-hero">

        {/* Grid overlay */}
        <div className="hp-grid-overlay" />

        {/* Floating particles */}
        <div className="hp-particles">
          {PARTICLES.map((p, i) => (
            <div key={i} className="hp-particle" style={{
              width: p.size, height: p.size,
              top: p.top, left: p.left,
              animationDelay: p.delay,
              animationDuration: p.dur,
            }} />
          ))}
        </div>

        {/* Glow orbs */}
        <div className="hp-orb hp-orb-1" />
        <div className="hp-orb hp-orb-2" />
        <div className="hp-orb hp-orb-3" />

        {/* Content */}
        <div className="hp-hero-inner">

          {/* Location badge */}
          <div className="hp-location-badge">
            <span className="hp-badge-dot" />
            Gantyada Mandal · Vizianagaram District · Andhra Pradesh
          </div>

          {/* Telugu title */}
          <div className="hp-telugu">చినమనపురం గ్రామ పంచాయతీ</div>

          {/* 3D Main title */}
          <h1 className="hp-title">
            <span className="hp-title-glow" aria-hidden="true">Chinamanapuram</span>
            Chinamanapuram
          </h1>

          {/* Subtitle */}
          <p className="hp-sub">
            Official digital portal for Chinamanapuram village — connecting families,
            sharing news, and building a stronger community together.
          </p>

          {/* CTA buttons */}
          <div className="hp-actions">
            <Link to="/families"   className="hp-btn-primary">👨‍👩‍👧‍👦 Family Directory</Link>
            <Link to="/complaints" className="hp-btn-ghost">📣 Submit Complaint</Link>
          </div>

          {/* Hero bottom tags */}
          <div className="hp-hero-badges">
            <span className="hp-hero-tag">🏘️ 342 Families</span>
            <span className="hp-hero-tag">👥 1,480 Population</span>
            <span className="hp-hero-tag">📚 218 Students</span>
            <span className="hp-hero-tag">🌾 1,240 Acres</span>
          </div>
        </div>

        {/* Wave */}
        <div className="hp-wave">
          <svg viewBox="0 0 1440 90" preserveAspectRatio="none">
            <path d="M0,45 C360,90 1080,0 1440,45 L1440,90 L0,90 Z" fill="var(--cream)" />
          </svg>
        </div>
      </section>

      {/* ══════════════════════════════════════
          ANIMATED STATS BAR
      ══════════════════════════════════════ */}
      <div className="hp-stats">
        <div className="hp-stats-inner">
          <div className="hp-stat">
            <div className="hp-stat-icon green">🏠</div>
            <div className="hp-stat-num">342</div>
            <div className="hp-stat-label">Registered Families</div>
          </div>
          <div className="hp-stat-divider" />
          <div className="hp-stat">
            <div className="hp-stat-icon orange">👥</div>
            <div className="hp-stat-num">1,480</div>
            <div className="hp-stat-label">Total Population</div>
          </div>
          <div className="hp-stat-divider" />
          <div className="hp-stat">
            <div className="hp-stat-icon blue">📚</div>
            <div className="hp-stat-num">218</div>
            <div className="hp-stat-label">Students Enrolled</div>
          </div>
          <div className="hp-stat-divider" />
          <div className="hp-stat">
            <div className="hp-stat-icon purple">🌾</div>
            <div className="hp-stat-num">1,240</div>
            <div className="hp-stat-label">Acres Agri Land</div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════
          MAIN CONTENT (2 col)
      ══════════════════════════════════════ */}
      <div className="main-content">

        {/* Left: Announcements */}
        <div>
          <div className="section-header">
            <h2 className="section-title">📢 Announcements</h2>
            <Link to="/complaints" className="section-link">View all →</Link>
          </div>
          <div className="announcements-list">
            {announcements.slice(0, 4).map(ann => (
              <div key={ann.id} className="announcement-card">
                <div className={`ann-badge ann-badge-${ann.badge || 'info'}`}>{ann.icon || '📌'}</div>
                <div className="ann-content">
                  <div className="ann-top">
                    <span className={`ann-tag ann-tag-${ann.tag || 'info'}`}>{ann.tag || 'info'}</span>
                    <span className="ann-date">{ann.date || ''}</span>
                  </div>
                  <div className="ann-title">{ann.title}</div>
                  <div className="ann-desc">{ann.desc || ann.description || ''}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Sidebar */}
        <div className="sidebar">

          {/* Weather Widget */}
          <div className="sidebar-card weather-widget">
            <div className="weather-header">🌤️ Today's Weather</div>
            <div className="weather-main">
              <span className="weather-emoji">⛅</span>
              <div>
                <div className="weather-temp">32°C</div>
                <div className="weather-condition">Partly Cloudy</div>
                <div className="weather-location">Chinamanapuram, AP</div>
              </div>
            </div>
            <div className="weather-details">
              <div className="weather-detail"><span>💧</span><span>Humidity: 68%</span></div>
              <div className="weather-detail"><span>🌬️</span><span>Wind: 12 km/h</span></div>
              <div className="weather-detail"><span>🌅</span><span>Sunrise: 6:14 AM</span></div>
              <div className="weather-detail"><span>🌇</span><span>Sunset: 6:28 PM</span></div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="sidebar-card">
            <div className="section-header" style={{ marginBottom:12 }}>
              <h3 className="section-title" style={{ fontSize:'1rem' }}>🔗 Quick Access</h3>
            </div>
            <div className="quick-links-grid">
              {QUICK_LINKS.map(link => (
                <Link key={link.to} to={link.to} className="quick-link-card">
                  <div className={`ql-icon ${link.color}`}>{link.icon}</div>
                  <span className="ql-label">{link.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Notice Board */}
          <div className="sidebar-card">
            <div className="section-header" style={{ marginBottom:12 }}>
              <h3 className="section-title" style={{ fontSize:'1rem' }}>📋 Notice Board</h3>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <div style={{ fontSize:'0.85rem', color:'var(--text-dark)', padding:'10px 12px', background:'#f0fdf4', borderRadius:8, borderLeft:'3px solid var(--primary)' }}>
                🏆 Chinamanapuram shortlisted for <strong>Swachh Gram Award 2026</strong>!
              </div>
              <div style={{ fontSize:'0.85rem', color:'var(--text-dark)', padding:'10px 12px', background:'#fff7ed', borderRadius:8, borderLeft:'3px solid var(--accent)' }}>
                🏛️ Sarpanch: <strong>Pasala Venkata Parvathi</strong> &nbsp;·&nbsp; 📞 94405 00001
              </div>
              <div style={{ fontSize:'0.85rem', color:'var(--text-dark)', padding:'10px 12px', background:'#eff6ff', borderRadius:8, borderLeft:'3px solid #3b82f6' }}>
                📱 Village helpline: <strong>1800-XXX-XXXX</strong> (Mon–Sat, 9AM–5PM)
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ══════════════════════════════════════
          UPCOMING EVENTS
      ══════════════════════════════════════ */}
      <section className="events-section">
        <div className="section-header" style={{ marginBottom:20 }}>
          <h2 className="section-title">📅 Upcoming Events</h2>
          <Link to="/chat" className="section-link">Discuss →</Link>
        </div>
        <div className="events-grid">
          {events.slice(0, 3).map(ev => (
            <div key={ev.id} className="event-card">
              <div className={`event-banner ${ev.color || 'green'}`}>
                <span style={{ fontSize:'2rem' }}>{ev.icon || '📅'}</span>
              </div>
              <div className="event-body">
                <div className="event-date-badge">{ev.date}</div>
                <h3 className="event-title">{ev.title}</h3>
                <p className="event-desc">{ev.desc || ev.description || ''}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════
          FOOTER
      ══════════════════════════════════════ */}
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

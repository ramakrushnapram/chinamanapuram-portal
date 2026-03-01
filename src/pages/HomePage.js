import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

/* ── Announcements ── */
const announcements = [
  { id: 1, type: 'urgent', icon: '🚨', tag: 'Urgent',      title: 'Drinking Water Supply Disruption – March 1',       desc: 'Borewell maintenance scheduled. Water supply will be unavailable from 9 AM to 2 PM on Saturday.',             date: 'Feb 28, 2026' },
  { id: 2, type: 'event',  icon: '🎉', tag: 'Event',       title: 'Ugadi Celebrations – Village Ground',              desc: 'Annual Ugadi festival with cultural programs, folk dances & community feast. All families are invited!',     date: 'Mar 10, 2026' },
  { id: 3, type: 'info',   icon: '📋', tag: 'Notice',      title: 'Gram Sabha Meeting – Monthly Review',              desc: 'Monthly Gram Sabha to discuss infrastructure proposals and village budget allocation for Q1 2026.',          date: 'Mar 5, 2026'  },
  { id: 4, type: 'notice', icon: '🏫', tag: 'Education',   title: 'Scholarship Applications Open – Zilla Parishad',  desc: 'Students of classes 6–10 can apply for the state merit scholarship. Last date: March 15, 2026.',             date: 'Feb 26, 2026' },
  { id: 5, type: 'info',   icon: '🌿', tag: 'Environment', title: 'Tree Plantation Drive – 500 Saplings Goal',        desc: 'Join the Green Chinamanapuram initiative. Volunteers needed this Sunday at 7 AM near the temple.',           date: 'Feb 25, 2026' },
];

const upcomingEvents = [
  { color: 'orange', date: 'Mar 10–12, 2026', icon: '🎊', title: 'Ugadi Festival',        desc: 'Three-day celebration with traditional rituals, rangoli competitions, and cultural performances.' },
  { color: 'green',  date: 'Mar 20, 2026',    icon: '🩺', title: 'Free Health Camp',      desc: 'Eye check-up, blood sugar & BP screening by PHC in collaboration with district hospital.' },
  { color: 'blue',   date: 'Apr 1, 2026',     icon: '📚', title: 'Annual Education Fair', desc: 'Career guidance, scholarship info stalls & talent competitions for students of all ages.' },
];

const quickLinks = [
  { to: '/families',    icon: '👨‍👩‍👧‍👦', label: 'Families',    color: 'teal'   },
  { to: '/family-tree', icon: '🌳',       label: 'Family Tree', color: 'green'  },
  { to: '/gallery',     icon: '🖼️',       label: 'Gallery',     color: 'orange' },
  { to: '/complaints',  icon: '📣',       label: 'Complaints',  color: 'red'    },
  { to: '/chat',        icon: '💬',       label: 'Chat',        color: 'blue'   },
  { to: '/education',   icon: '📚',       label: 'Education',   color: 'purple' },
];

/* ── Stable particle positions ── */
const PARTICLES = [
  { id: 0,  x: 5,  y: 10, s: 4, d: 0.0, dur: 9  },
  { id: 1,  x: 12, y: 82, s: 2, d: 1.3, dur: 7  },
  { id: 2,  x: 22, y: 28, s: 3, d: 2.5, dur: 8  },
  { id: 3,  x: 30, y: 68, s: 2, d: 0.7, dur: 6  },
  { id: 4,  x: 38, y: 12, s: 5, d: 3.2, dur: 11 },
  { id: 5,  x: 45, y: 88, s: 2, d: 1.8, dur: 7  },
  { id: 6,  x: 55, y: 38, s: 3, d: 4.0, dur: 9  },
  { id: 7,  x: 63, y: 74, s: 4, d: 0.5, dur: 8  },
  { id: 8,  x: 70, y: 18, s: 2, d: 2.1, dur: 6  },
  { id: 9,  x: 78, y: 55, s: 3, d: 3.5, dur: 7  },
  { id: 10, x: 85, y: 83, s: 2, d: 1.0, dur: 9  },
  { id: 11, x: 92, y: 32, s: 5, d: 4.5, dur: 8  },
  { id: 12, x: 3,  y: 50, s: 2, d: 2.8, dur: 6  },
  { id: 13, x: 17, y: 42, s: 3, d: 0.3, dur: 10 },
  { id: 14, x: 26, y: 93, s: 2, d: 3.7, dur: 7  },
  { id: 15, x: 48, y: 60, s: 6, d: 1.5, dur: 9  },
  { id: 16, x: 58, y: 7,  s: 3, d: 2.2, dur: 8  },
  { id: 17, x: 68, y: 86, s: 2, d: 4.2, dur: 6  },
  { id: 18, x: 82, y: 44, s: 4, d: 0.8, dur: 9  },
  { id: 19, x: 95, y: 68, s: 2, d: 3.0, dur: 7  },
  { id: 20, x: 10, y: 24, s: 3, d: 1.7, dur: 8  },
  { id: 21, x: 35, y: 52, s: 2, d: 4.8, dur: 6  },
  { id: 22, x: 50, y: 76, s: 4, d: 2.4, dur: 10 },
  { id: 23, x: 75, y: 14, s: 3, d: 0.2, dur: 7  },
  { id: 24, x: 90, y: 58, s: 2, d: 3.8, dur: 9  },
  { id: 25, x: 42, y: 35, s: 3, d: 1.1, dur: 8  },
  { id: 26, x: 18, y: 60, s: 2, d: 2.9, dur: 6  },
  { id: 27, x: 65, y: 50, s: 4, d: 0.6, dur: 9  },
  { id: 28, x: 88, y: 20, s: 2, d: 3.3, dur: 7  },
  { id: 29, x: 32, y: 78, s: 3, d: 4.6, dur: 8  },
];

/* ── Animated counter ── */
function AnimatedNumber({ target }) {
  const [count, setCount] = useState(0);
  const ref     = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const steps    = 70;
          const stepTime = 1600 / steps;
          const inc      = target / steps;
          let cur        = 0;
          const timer    = setInterval(() => {
            cur += inc;
            if (cur >= target) { setCount(target); clearInterval(timer); }
            else               { setCount(Math.round(cur)); }
          }, stepTime);
        }
      },
      { threshold: 0.4 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return <span ref={ref}>{count.toLocaleString('en-IN')}</span>;
}

/* ════════════════════════════════════════════ */
export default function HomePage() {
  return (
    <div className="homepage">
      <Navbar />

      {/* ══════════════════════════════════════════
           HERO – 3D Premium Design
         ══════════════════════════════════════════ */}
      <section className="hp-hero">

        {/* Grid overlay pattern */}
        <div className="hp-grid-overlay" aria-hidden="true" />

        {/* Floating particles */}
        <div className="hp-particles" aria-hidden="true">
          {PARTICLES.map(p => (
            <span
              key={p.id}
              className="hp-particle"
              style={{
                left:              `${p.x}%`,
                top:               `${p.y}%`,
                width:             `${p.s}px`,
                height:            `${p.s}px`,
                animationDelay:    `${p.d}s`,
                animationDuration: `${p.dur}s`,
              }}
            />
          ))}
        </div>

        {/* Glowing orbs */}
        <div className="hp-orb hp-orb-1" aria-hidden="true" />
        <div className="hp-orb hp-orb-2" aria-hidden="true" />
        <div className="hp-orb hp-orb-3" aria-hidden="true" />

        {/* Hero content */}
        <div className="hp-hero-inner">
          <div className="hp-location-badge">
            <span className="hp-badge-dot" />
            🌾 Gantyada Mandal &nbsp;·&nbsp; Vizianagaram District &nbsp;·&nbsp; Andhra Pradesh
          </div>

          <div className="hp-telugu">చినమానపురం గ్రామ పోర్టల్</div>

          <h1 className="hp-title">
            Chinamanapuram
            <span className="hp-title-glow" aria-hidden="true">Chinamanapuram</span>
          </h1>

          <p className="hp-sub">
            Your digital gateway to our beloved village — stay informed, stay connected,
            and celebrate our community together.
          </p>

          <div className="hp-actions">
            <Link to="/families"   className="hp-btn-primary">👨‍👩‍👧‍👦 Explore Families</Link>
            <Link to="/complaints" className="hp-btn-ghost">📣 Submit Complaint</Link>
            <Link to="/chat"       className="hp-btn-ghost">💬 Community Chat</Link>
          </div>

          <div className="hp-hero-badges">
            <span className="hp-hero-tag">🏆 Swachh Gram 2026 Finalist</span>
            <span className="hp-hero-tag">🏘️ 342 Families</span>
            <span className="hp-hero-tag">🌿 Est. 1920</span>
          </div>
        </div>

        {/* Wave bottom */}
        <div className="hp-wave" aria-hidden="true">
          <svg viewBox="0 0 1440 80" fill="none" preserveAspectRatio="none">
            <path d="M0 80 L0 55 Q180 10 360 42 Q540 74 720 38 Q900 4 1080 35 Q1260 65 1440 28 L1440 80 Z" fill="#fdf8f0"/>
          </svg>
        </div>
      </section>

      {/* ══════════════════════════════════════════
           STATS BAR – animated counting numbers
         ══════════════════════════════════════════ */}
      <section className="hp-stats">
        <div className="hp-stats-inner">
          <div className="hp-stat">
            <div className="hp-stat-icon green">👨‍👩‍👧‍👦</div>
            <div className="hp-stat-num"><AnimatedNumber target={342} /></div>
            <div className="hp-stat-label">Registered Families</div>
          </div>
          <div className="hp-stat-divider" />
          <div className="hp-stat">
            <div className="hp-stat-icon orange">👥</div>
            <div className="hp-stat-num"><AnimatedNumber target={1480} /></div>
            <div className="hp-stat-label">Total Population</div>
          </div>
          <div className="hp-stat-divider" />
          <div className="hp-stat">
            <div className="hp-stat-icon blue">🎓</div>
            <div className="hp-stat-num"><AnimatedNumber target={218} /></div>
            <div className="hp-stat-label">Students Enrolled</div>
          </div>
          <div className="hp-stat-divider" />
          <div className="hp-stat">
            <div className="hp-stat-icon purple">🌾</div>
            <div className="hp-stat-num"><AnimatedNumber target={1240} /></div>
            <div className="hp-stat-label">Acres Cultivated</div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
           MAIN CONTENT (Announcements + Sidebar)
         ══════════════════════════════════════════ */}
      <div className="main-content">
        <main>
          <div className="section-header">
            <h2 className="section-title">Announcements</h2>
            <a href="#announcements" className="section-link">View All →</a>
          </div>
          <div className="announcements-list" id="announcements">
            {announcements.map(ann => (
              <div className="announcement-card" key={ann.id}>
                <div className={`ann-badge ${ann.type}`}>{ann.icon}</div>
                <div className="ann-content">
                  <div className="ann-top">
                    <span className={`ann-tag ${ann.type}`}>{ann.tag}</span>
                    <span className="ann-date">{ann.date}</span>
                  </div>
                  <div className="ann-title">{ann.title}</div>
                  <div className="ann-desc">{ann.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </main>

        <aside className="sidebar">
          {/* Weather */}
          <div className="weather-widget">
            <div className="weather-header">🌤 Current Weather</div>
            <div className="weather-main">
              <div className="weather-emoji">☀️</div>
              <div>
                <div className="weather-temp">31°C</div>
                <div className="weather-condition">Sunny &amp; Clear</div>
                <div className="weather-location">Chinamanapuram, Vizianagaram</div>
              </div>
            </div>
            <div className="weather-details">
              <div className="weather-detail">💧 42% Humidity</div>
              <div className="weather-detail">🌬 12 km/h Wind</div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="sidebar-card">
            <div className="section-header" style={{ marginBottom: '16px' }}>
              <h2 className="section-title">Quick Access</h2>
            </div>
            <div className="quick-links-grid">
              {quickLinks.map(q => (
                <Link to={q.to} className="quick-link-card" key={q.to}>
                  <div className={`ql-icon ${q.color}`}>{q.icon}</div>
                  <span className="ql-label">{q.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Notice Board */}
          <div className="sidebar-card">
            <div className="section-header" style={{ marginBottom: '14px' }}>
              <h2 className="section-title">Notice Board</h2>
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { icon: '🚰', text: 'Borewell maintenance – Mar 1 (9AM–2PM)' },
                { icon: '🗳️', text: 'Ward Committee election – March 25' },
                { icon: '🏥', text: 'PHC open every Tuesday & Friday 10–4 PM' },
                { icon: '📜', text: 'Ration card corrections due by March 10' },
              ].map((item, i) => (
                <li key={i} style={{ display:'flex', gap:'10px', fontSize:'0.84rem', color:'var(--text-mid)', alignItems:'flex-start', paddingBottom:'12px', borderBottom: i < 3 ? '1px solid var(--border)' : 'none' }}>
                  <span style={{ fontSize:'1rem', flexShrink:0 }}>{item.icon}</span>
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>

      {/* ══════════════════════════════════════════
           UPCOMING EVENTS
         ══════════════════════════════════════════ */}
      <section className="events-section">
        <div className="section-header">
          <h2 className="section-title">Upcoming Events</h2>
          <a href="#events" className="section-link">See Calendar →</a>
        </div>
        <div className="events-grid" id="events">
          {upcomingEvents.map((ev, i) => (
            <div className="event-card" key={i}>
              <div className={`event-banner ${ev.color}`} />
              <div className="event-body">
                <div className="event-date-badge">📅 {ev.date}</div>
                <div className="event-title">{ev.icon} {ev.title}</div>
                <div className="event-desc">{ev.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════
           FOOTER
         ══════════════════════════════════════════ */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-logo">🏘️</div>
          <div className="footer-village">Chinamanapuram Village Portal</div>
          <div className="footer-tagline">Gantyada Mandal · Vizianagaram District · Andhra Pradesh · India</div>
          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', marginBottom: '12px' }}>
            🏛️ Sarpanch: Pasala Sivanarayanamurthy &nbsp;·&nbsp; 📞 94405 00001
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
          <div className="footer-copy">© 2026 Chinamanapuram Village Portal · Built with care for our community</div>
        </div>
      </footer>
    </div>
  );
}

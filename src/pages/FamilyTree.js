import { useState } from 'react';
import Navbar from '../components/Navbar';
import { Link } from 'react-router-dom';

/* ─────────────────────────────────────────
   Family Data – Ramu Rao family
───────────────────────────────────────── */
const FAMILY = {
  grandpa: {
    id: 1, name: 'Ramu Rao', born: 1942, gender: 'm',
    occupation: 'Farmer', relation: 'Grandfather',
    phone: '94405 11111', address: 'D.No. 1-1, Main Road, Chinamanapuram',
    about: 'Elder statesman of the family. Served as Sarpanch for 12 years.',
  },
  grandma: {
    id: 2, name: 'Sita Devi', born: 1948, gender: 'f',
    occupation: 'Homemaker', relation: 'Grandmother',
    phone: '94405 11111', address: 'D.No. 1-1, Main Road, Chinamanapuram',
    about: 'Beloved grandmother, known for her traditional cooking and storytelling.',
  },
  sons: [
    {
      person: {
        id: 3, name: 'Suresh Rao', born: 1970, gender: 'm',
        occupation: 'School Teacher', relation: 'Elder Son',
        phone: '98480 22222', address: 'D.No. 2-15, Near Temple, Chinamanapuram',
        about: 'Teaches Mathematics at ZP High School, Chinamanapuram for 20+ years.',
      },
      spouse: {
        id: 4, name: 'Meena Rao', born: 1973, gender: 'f',
        occupation: 'Staff Nurse', relation: 'Daughter-in-law',
        phone: '98480 33333', address: 'D.No. 2-15, Near Temple, Chinamanapuram',
        about: 'Works at Area Hospital, Gantyada. Active in village health camps.',
      },
      children: [
        {
          id: 7, name: 'Kiran Rao', born: 1998, gender: 'm',
          occupation: 'Software Engineer', relation: 'Grandson',
          phone: '96765 44444', address: 'Hyderabad (working)',
          about: 'Works at a software firm in Hyderabad. First engineer in the family.',
        },
        {
          id: 8, name: 'Priya Rao', born: 2001, gender: 'f',
          occupation: 'MBBS Student', relation: 'Granddaughter',
          phone: '96765 55555', address: 'Visakhapatnam (studying)',
          about: 'Studying MBBS at Andhra Medical College. Aspires to serve the village.',
        },
      ],
    },
    {
      person: {
        id: 5, name: 'Ramesh Rao', born: 1975, gender: 'm',
        occupation: 'Businessman', relation: 'Younger Son',
        phone: '99890 66666', address: 'D.No. 3-8, East Street, Chinamanapuram',
        about: 'Runs a rice trading business in Gantyada town market.',
      },
      spouse: {
        id: 6, name: 'Geetha Rao', born: 1978, gender: 'f',
        occupation: 'School Teacher', relation: 'Daughter-in-law',
        phone: '99890 77777', address: 'D.No. 3-8, East Street, Chinamanapuram',
        about: 'Telugu language teacher at ZP High School. Loves classical music.',
      },
      children: [
        {
          id: 9, name: 'Arun Rao', born: 2003, gender: 'm',
          occupation: 'B.Tech Student', relation: 'Grandson',
          phone: '97052 88888', address: 'Vizianagaram (studying)',
          about: 'Pursuing B.Tech in Civil Engineering at GVPCOE, Vizianagaram.',
        },
      ],
    },
  ],
};

const ALL_PERSONS = [
  FAMILY.grandpa, FAMILY.grandma,
  ...FAMILY.sons.flatMap(s => [s.person, s.spouse, ...s.children]),
];

function initials(name) {
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

/* ── Person Node ── */
function PersonNode({ person, selected, onSelect, size = 'md' }) {
  const active = selected?.id === person.id;
  return (
    <div
      className={`ft-node ft-node-${size} ${person.gender === 'f' ? 'ft-node-f' : 'ft-node-m'} ${active ? 'ft-node-active' : ''}`}
      onClick={() => onSelect(person)}
      title={person.name}
    >
      <div className="ft-avatar">{initials(person.name)}</div>
      <div className="ft-name">{person.name}</div>
      <div className="ft-year">b. {person.born}</div>
      {size === 'lg' && <div className="ft-occ">{person.occupation}</div>}
    </div>
  );
}

/* ── Heart marriage link ── */
function HeartLink() {
  return <div className="ft-heart">♥</div>;
}

/* ── Detail modal ── */
function DetailModal({ person, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="ft-detail-card" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} style={{ position: 'absolute', top: 16, right: 16 }}>✕</button>
        <div className={`ft-detail-avatar ${person.gender === 'f' ? 'ft-node-f' : 'ft-node-m'}`}>
          {initials(person.name)}
        </div>
        <h2 className="ft-detail-name">{person.name}</h2>
        <div className="ft-detail-rel">{person.relation}</div>
        <div className="ft-detail-fields">
          <div className="ft-detail-row"><span>🎂</span><span>Born {person.born}</span></div>
          <div className="ft-detail-row"><span>💼</span><span>{person.occupation}</span></div>
          <div className="ft-detail-row"><span>📞</span><span>{person.phone}</span></div>
          <div className="ft-detail-row"><span>📍</span><span>{person.address}</span></div>
          {person.about && (
            <div className="ft-detail-row ft-detail-about">
              <span>📝</span><span>{person.about}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ── */
export default function FamilyTree() {
  const [selected,     setSelected]     = useState(null);
  const [search,       setSearch]       = useState('');
  const [showAdd,      setShowAdd]      = useState(false);

  const searchResults = search.trim()
    ? ALL_PERSONS.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    : [];

  function handleSelect(person) {
    setSelected(s => s?.id === person.id ? null : person);
  }

  return (
    <div>
      <Navbar />

      {/* ── Hero ── */}
      <div className="ft-hero">
        <div className="ft-hero-icon">🌳</div>
        <h1 className="ft-hero-title">Family Tree</h1>
        <p className="ft-hero-sub">Ramu Rao Family · Chinamanapuram · Vizianagaram District</p>
      </div>

      {/* ── Top bar ── */}
      <div className="ft-topbar">
        <div className="ft-topbar-inner">
          <div className="ft-search-wrap" style={{ position: 'relative' }}>
            <span className="fd-search-icon">🔍</span>
            <input
              className="fd-search-input"
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search family member…"
              style={{ paddingLeft: 38 }}
            />
            {search && (
              <button className="fd-search-clear" onClick={() => setSearch('')}>✕</button>
            )}
            {searchResults.length > 0 && (
              <div className="ft-search-drop">
                {searchResults.map(p => (
                  <div
                    key={p.id}
                    className="ft-search-item"
                    onClick={() => { handleSelect(p); setSearch(''); }}
                  >
                    <span className={`ft-si-avatar ${p.gender === 'f' ? 'ft-node-f' : 'ft-node-m'}`}>
                      {initials(p.name)}
                    </span>
                    <div>
                      <div className="ft-si-name">{p.name}</div>
                      <div className="ft-si-sub">{p.relation} · b. {p.born}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="ft-topbar-stats">
            <span className="ft-stat-pill">👥 {ALL_PERSONS.length} members</span>
            <span className="ft-stat-pill">🧬 3 generations</span>
          </div>

          <button className="fd-add-btn" onClick={() => setShowAdd(true)}>＋ Add Member</button>
        </div>
      </div>

      {/* ═══════════════════════════════════
           TREE CANVAS
      ══════════════════════════════════════ */}
      <div className="ft-canvas">

        {/* ── Generation I ── */}
        <div className="ft-gen-label">Generation I &nbsp;·&nbsp; Grandparents</div>
        <div className="ft-gen1-row">
          <PersonNode person={FAMILY.grandpa} selected={selected} onSelect={handleSelect} size="lg" />
          <HeartLink />
          <PersonNode person={FAMILY.grandma} selected={selected} onSelect={handleSelect} size="lg" />
        </div>

        {/* Gen1 → Gen2 connector */}
        <div className="ft-conn ft-conn-1to2">
          <div className="ftc-stem" />
          <div className="ftc-hbar" />
          <div className="ftc-drop ftc-drop-l" />
          <div className="ftc-drop ftc-drop-r" />
        </div>

        {/* ── Generation II ── */}
        <div className="ft-gen-label">Generation II &nbsp;·&nbsp; Children &amp; Spouses</div>
        <div className="ft-gen2-row">
          {FAMILY.sons.map(s => (
            <div className="ft-family-unit" key={s.person.id}>
              <PersonNode person={s.person} selected={selected} onSelect={handleSelect} />
              <HeartLink />
              <PersonNode person={s.spouse} selected={selected} onSelect={handleSelect} />
            </div>
          ))}
        </div>

        {/* Gen2 → Gen3 connector */}
        <div className="ft-conn ft-conn-2to3">
          {/* Son 1: splits to 2 grandchildren */}
          <div className="ft-cb ft-cb-left">
            <div className="ftc-stem" />
            <div className="ftc-hbar" />
            <div className="ftc-drop ftc-drop-l" />
            <div className="ftc-drop ftc-drop-r" />
          </div>
          {/* Son 2: straight line to 1 grandchild */}
          <div className="ft-cb ft-cb-right">
            <div className="ftc-stem-full" />
          </div>
        </div>

        {/* ── Generation III ── */}
        <div className="ft-gen-label">Generation III &nbsp;·&nbsp; Grandchildren</div>
        <div className="ft-gen3-row">
          <div className="ft-gc-group">
            {FAMILY.sons[0].children.map(gc => (
              <PersonNode key={gc.id} person={gc} selected={selected} onSelect={handleSelect} />
            ))}
          </div>
          <div className="ft-gc-group">
            {FAMILY.sons[1].children.map(gc => (
              <PersonNode key={gc.id} person={gc} selected={selected} onSelect={handleSelect} />
            ))}
          </div>
        </div>

      </div>
      {/* end tree canvas */}

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
            <Link to="/complaints">Complaints</Link>
            <Link to="/chat">Chat</Link>
            <Link to="/education">Education</Link>
          </div>
          <div className="footer-copy">© 2026 Chinamanapuram Village Portal · Built with care for our community</div>
        </div>
      </footer>

      {/* ── Detail Modal ── */}
      {selected && <DetailModal person={selected} onClose={() => setSelected(null)} />}

      {/* ── Add Member Modal ── */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal-box modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">➕ Add Family Member</h2>
              <button className="modal-close" onClick={() => setShowAdd(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center', padding: '40px 24px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🚧</div>
              <p style={{ color: 'var(--text-light)', marginBottom: '24px', lineHeight: 1.6 }}>
                Member registration is coming soon. You'll be able to add new members and connect them to the family tree.
              </p>
              <button className="btn-save" onClick={() => setShowAdd(false)}>Got it</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

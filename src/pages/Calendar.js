import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { db } from '../firebase';
import { collection, onSnapshot, addDoc, deleteDoc, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

const ADMIN_EMAILS = ['admin@chinamanapuram.com', 'ramakrushna.pram@gmail.com'];

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const TYPE_OPTIONS = [
  { value: 'meeting',  label: 'Panchayat Meeting', color: '#fff', bg: 'linear-gradient(135deg,#1a6b3c,#2d9959)',   dot: '#1a6b3c' },
  { value: 'event',    label: 'Village Event',      color: '#fff', bg: 'linear-gradient(135deg,#2563eb,#60a5fa)',   dot: '#2563eb' },
  { value: 'holiday',  label: 'Holiday',            color: '#fff', bg: 'linear-gradient(135deg,#d97706,#fbbf24)',   dot: '#d97706' },
  { value: 'health',   label: 'Health Camp',        color: '#fff', bg: 'linear-gradient(135deg,#dc2626,#f87171)',   dot: '#dc2626' },
  { value: 'notice',   label: 'Notice / Deadline',  color: '#fff', bg: 'linear-gradient(135deg,#7c3aed,#a78bfa)',   dot: '#7c3aed' },
];

const TYPE_BADGE = {
  meeting: { bg: '#d1fae5', color: '#065f46', border: '#6ee7b7' },
  event:   { bg: '#dbeafe', color: '#1e40af', border: '#93c5fd' },
  holiday: { bg: '#fef3c7', color: '#92400e', border: '#fcd34d' },
  health:  { bg: '#fee2e2', color: '#991b1b', border: '#fca5a5' },
  notice:  { bg: '#ede9fe', color: '#5b21b6', border: '#c4b5fd' },
};

function typeStyle(type) {
  return TYPE_OPTIONS.find(t => t.value === type) || TYPE_OPTIONS[0];
}
function typeBadge(type) {
  return TYPE_BADGE[type] || TYPE_BADGE.meeting;
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDay(year, month) {
  return new Date(year, month, 1).getDay();
}

export default function CalendarPage() {
  const { user } = useAuth();
  const isAdmin = user && ADMIN_EMAILS.includes(user.email);

  const now = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [meetings, setMeetings] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ title: '', type: 'meeting', time: '', desc: '' });
  const [saving, setSaving] = useState(false);
  const [detailDay, setDetailDay] = useState(null);

  useEffect(() => {
    let active = true;
    let unsub = () => {};
    try {
      unsub = onSnapshot(collection(db, 'meetings'), snap => {
        if (active) setMeetings(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }, () => {});
    } catch (_) {}
    return () => { active = false; try { unsub(); } catch (_) {} };
  }, []);

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }

  function dateKey(y, m, d) {
    return `${y}-${String(m + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  }

  function meetingsForDate(dateStr) {
    return meetings.filter(m => m.date === dateStr);
  }

  function handleDayClick(d) {
    const key = dateKey(year, month, d);
    setDetailDay(key);
    setSelected(key);
  }

  function openAdd(dateStr) {
    setEditItem(null);
    setForm({ title: '', type: 'meeting', time: '', desc: '' });
    setSelected(dateStr);
    setShowForm(true);
  }

  function openEdit(item) {
    setEditItem(item);
    setForm({ title: item.title, type: item.type, time: item.time || '', desc: item.desc || '' });
    setSelected(item.date);
    setShowForm(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const data = { ...form, date: selected, createdAt: serverTimestamp() };
      if (editItem) {
        await setDoc(doc(db, 'meetings', editItem.id), data, { merge: true });
      } else {
        await addDoc(collection(db, 'meetings'), data);
      }
      setShowForm(false);
    } catch (_) {}
    setSaving(false);
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this event?')) return;
    try { await deleteDoc(doc(db, 'meetings', id)); } catch (_) {}
  }

  const daysInMonth  = getDaysInMonth(year, month);
  const firstDay     = getFirstDay(year, month);
  const todayStr     = dateKey(now.getFullYear(), now.getMonth(), now.getDate());
  const detailEvents = detailDay ? meetingsForDate(detailDay) : [];

  const upcoming = meetings
    .filter(m => m.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 6);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #f0fdf4 0%, #fef9f0 50%, #f0f4ff 100%)' }}>
      <Navbar />

      {/* Hero Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0f3d22 0%, #1a6b3c 40%, #16a34a 70%, #e8891a 100%)',
        padding: '36px 24px 80px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* decorative circles */}
        <div style={{ position:'absolute', top:-40, right:-40, width:200, height:200, borderRadius:'50%', background:'rgba(255,255,255,0.05)' }} />
        <div style={{ position:'absolute', bottom:-60, left:60, width:150, height:150, borderRadius:'50%', background:'rgba(255,255,255,0.04)' }} />
        <div style={{ maxWidth: 1100, margin: '0 auto', position:'relative', zIndex:1 }}>
          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.55)', marginBottom: 8 }}>
            <Link to="/" style={{ color: 'rgba(255,255,255,0.55)', textDecoration: 'none' }}>Home</Link> › Calendar
          </div>
          <h1 style={{ margin: 0, fontSize: 'clamp(1.6rem,3.5vw,2.4rem)', fontWeight: 900, color: '#fff', letterSpacing: '-0.5px' }}>
            📅 Panchayat Calendar
          </h1>
          <p style={{ margin: '8px 0 0', color: 'rgba(255,255,255,0.72)', fontSize: '1rem' }}>
            Meetings, events &amp; important dates for Chinamanapuram Village
          </p>
          {/* Stats row */}
          <div style={{ display:'flex', gap:16, marginTop:20, flexWrap:'wrap' }}>
            {[
              { label:'Total Events', value: meetings.length, icon:'🗓️' },
              { label:'Upcoming',     value: upcoming.length, icon:'⏰' },
              { label:'This Month',   value: meetings.filter(m=>m.date?.startsWith(`${year}-${String(month+1).padStart(2,'0')}`)).length, icon:'📆' },
            ].map(s => (
              <div key={s.label} style={{ background:'rgba(255,255,255,0.12)', backdropFilter:'blur(8px)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:12, padding:'10px 18px', minWidth:100 }}>
                <div style={{ fontSize:'1.3rem' }}>{s.icon}</div>
                <div style={{ fontSize:'1.4rem', fontWeight:800, color:'#fff' }}>{s.value}</div>
                <div style={{ fontSize:'0.72rem', color:'rgba(255,255,255,0.65)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="cal-layout" style={{ marginTop: -44, position: 'relative', zIndex: 2 }}>

        {/* ── Calendar ── */}
        <div>
          <div style={{ background: '#fff', borderRadius: 20, boxShadow: '0 8px 40px rgba(0,0,0,0.12)', overflow: 'hidden', border: '1px solid #e8f5e9' }}>

            {/* Month Nav */}
            <div style={{
              background: 'linear-gradient(135deg, #1a6b3c, #2d9959)',
              padding: '18px 24px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <button onClick={prevMonth} style={{
                background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: 10, padding: '8px 16px', cursor: 'pointer', fontSize: '1.1rem', color: '#fff',
                transition: 'background 0.2s',
              }}>‹</button>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 900, fontSize: '1.4rem', color: '#fff', letterSpacing: '-0.3px' }}>
                  {MONTHS[month]} {year}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>
                  Chinamanapuram Panchayat · Gantyada Mandal
                </div>
              </div>
              <button onClick={nextMonth} style={{
                background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: 10, padding: '8px 16px', cursor: 'pointer', fontSize: '1.1rem', color: '#fff',
              }}>›</button>
            </div>

            {/* Day headers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: '#f8fffe', borderBottom: '2px solid #e8f5e9' }}>
              {DAYS.map((d, i) => (
                <div key={d} style={{
                  textAlign: 'center', padding: '10px 0',
                  fontSize: '0.72rem', fontWeight: 800,
                  color: i === 0 ? '#dc2626' : '#1a6b3c',
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                }}>{d}</div>
              ))}
            </div>

            {/* Calendar grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`e${i}`} style={{ minHeight: 96, borderRight: '1px solid #f0fdf4', borderBottom: '1px solid #f0fdf4', background: '#fafdfb' }} />
              ))}

              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => {
                const key = dateKey(year, month, d);
                const evs = meetingsForDate(key);
                const isToday    = key === todayStr;
                const isSelected = key === selected;
                const isSun      = new Date(year, month, d).getDay() === 0;
                const hasEvents  = evs.length > 0;

                return (
                  <div
                    key={d}
                    onClick={() => handleDayClick(d)}
                    style={{
                      minHeight: 96, padding: '6px 5px', cursor: 'pointer',
                      borderRight: '1px solid #f0fdf4', borderBottom: '1px solid #f0fdf4',
                      background: isSelected ? '#f0fdf4' : isToday ? '#fffbeb' : hasEvents ? '#fafffe' : '#fff',
                      transition: 'background 0.15s, transform 0.1s',
                      outline: isSelected ? '2px solid #1a6b3c' : isToday ? '2px solid #f59e0b' : 'none',
                      outlineOffset: '-2px',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#f0fdf4'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = isSelected ? '#f0fdf4' : isToday ? '#fffbeb' : hasEvents ? '#fafffe' : '#fff'; }}
                  >
                    <div style={{
                      width: 30, height: 30, borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: isToday ? 900 : 500, fontSize: '0.88rem',
                      background: isToday ? 'linear-gradient(135deg,#1a6b3c,#16a34a)' : 'none',
                      color: isToday ? '#fff' : isSun ? '#dc2626' : '#1a3c2a',
                      boxShadow: isToday ? '0 2px 8px rgba(26,107,60,0.4)' : 'none',
                      marginBottom: 4,
                    }}>{d}</div>
                    {evs.slice(0, 2).map(ev => {
                      const tb = typeBadge(ev.type);
                      return (
                        <div key={ev.id} style={{
                          fontSize: '0.62rem', fontWeight: 700, padding: '2px 5px', borderRadius: 5,
                          background: tb.bg, color: tb.color,
                          border: `1px solid ${tb.border}`,
                          marginBottom: 2,
                          overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                        }}>
                          {ev.title}
                        </div>
                      );
                    })}
                    {evs.length > 2 && (
                      <div style={{ fontSize: '0.58rem', color: '#1a6b3c', fontWeight: 700 }}>+{evs.length - 2} more</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected day detail */}
          {detailDay && (
            <div style={{
              background: '#fff', borderRadius: 18,
              boxShadow: '0 4px 24px rgba(0,0,0,0.09)',
              border: '1px solid #e8f5e9',
              padding: 22, marginTop: 20,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <h3 style={{ margin: 0, fontWeight: 800, color: '#1a3c2a', fontSize: '1rem' }}>
                    {new Date(detailDay + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </h3>
                  <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: '#888' }}>
                    {detailEvents.length === 0 ? 'No events scheduled' : `${detailEvents.length} event${detailEvents.length > 1 ? 's' : ''} scheduled`}
                  </p>
                </div>
                {isAdmin && (
                  <button onClick={() => openAdd(detailDay)} style={{
                    background: 'linear-gradient(135deg,#1a6b3c,#16a34a)',
                    color: '#fff', border: 'none', borderRadius: 10,
                    padding: '9px 18px', fontSize: '0.83rem', cursor: 'pointer',
                    fontWeight: 700, boxShadow: '0 2px 8px rgba(26,107,60,0.3)',
                  }}>
                    + Add Event
                  </button>
                )}
              </div>
              {detailEvents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 0' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>📭</div>
                  <div style={{ color: '#aaa', fontSize: '0.88rem' }}>No events on this day.</div>
                  {isAdmin && <div style={{ color: '#1a6b3c', fontSize: '0.82rem', marginTop: 6 }}>Click "+ Add Event" to schedule one.</div>}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {detailEvents.map(ev => {
                    const ts = typeStyle(ev.type);
                    const tb = typeBadge(ev.type);
                    return (
                      <div key={ev.id} style={{
                        display: 'flex', gap: 14, alignItems: 'flex-start',
                        padding: '14px 16px', borderRadius: 14,
                        background: tb.bg,
                        border: `1.5px solid ${tb.border}`,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                      }}>
                        <div style={{
                          width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                          background: ts.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '1.1rem', boxShadow: `0 2px 8px ${ts.dot}40`,
                        }}>
                          {ev.type === 'meeting' ? '🏛️' : ev.type === 'event' ? '🎉' : ev.type === 'holiday' ? '🌸' : ev.type === 'health' ? '🏥' : '📢'}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 800, color: tb.color, fontSize: '0.95rem' }}>{ev.title}</div>
                          {ev.time && <div style={{ fontSize: '0.8rem', color: '#666', marginTop: 3 }}>🕐 {ev.time}</div>}
                          {ev.desc && <div style={{ fontSize: '0.82rem', color: '#555', marginTop: 5, lineHeight: 1.5 }}>{ev.desc}</div>}
                          <span style={{
                            display: 'inline-block', marginTop: 6,
                            fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px',
                            borderRadius: 99, background: ts.dot + '20', color: ts.dot,
                            border: `1px solid ${ts.dot}40`,
                          }}>{TYPE_OPTIONS.find(t=>t.value===ev.type)?.label}</span>
                        </div>
                        {isAdmin && (
                          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                            <button onClick={() => openEdit(ev)} style={{ background:'#fff', border:'1px solid #d1d5db', borderRadius:8, padding:'6px 10px', fontSize:'0.8rem', cursor:'pointer', color:'#555' }}>✏️</button>
                            <button onClick={() => handleDelete(ev.id)} style={{ background:'#fff', border:'1px solid #fca5a5', borderRadius:8, padding:'6px 10px', fontSize:'0.8rem', cursor:'pointer', color:'#dc2626' }}>🗑️</button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Sidebar ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Legend */}
          <div style={{ background: '#fff', borderRadius: 18, padding: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: '1px solid #e8f5e9' }}>
            <h3 style={{ margin: '0 0 14px', fontWeight: 800, color: '#1a3c2a', fontSize: '0.92rem', letterSpacing: '-0.2px' }}>🏷️ Event Types</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {TYPE_OPTIONS.map(t => (
                <div key={t.value} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 28, height: 20, borderRadius: 6, background: t.bg, flexShrink: 0, boxShadow: `0 2px 6px ${t.dot}30` }} />
                  <span style={{ fontSize: '0.82rem', color: '#444', fontWeight: 500 }}>{t.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming events */}
          <div style={{ background: '#fff', borderRadius: 18, padding: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: '1px solid #e8f5e9' }}>
            <h3 style={{ margin: '0 0 16px', fontWeight: 800, color: '#1a3c2a', fontSize: '0.92rem' }}>⏰ Upcoming Events</h3>
            {upcoming.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: '2rem', marginBottom: 8 }}>🗓️</div>
                <div style={{ color: '#aaa', fontSize: '0.82rem' }}>No upcoming events.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {upcoming.map(ev => {
                  const ts = typeStyle(ev.type);
                  const tb = typeBadge(ev.type);
                  const evDate = new Date(ev.date + 'T00:00:00');
                  const diffDays = Math.round((evDate - new Date(todayStr + 'T00:00:00')) / 86400000);
                  return (
                    <div key={ev.id}
                      onClick={() => { setDetailDay(ev.date); setSelected(ev.date); setYear(evDate.getFullYear()); setMonth(evDate.getMonth()); }}
                      style={{
                        padding: '12px 14px', borderRadius: 12,
                        background: tb.bg, cursor: 'pointer',
                        border: `1.5px solid ${tb.border}`,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                        transition: 'transform 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.84rem', color: tb.color, flex: 1 }}>{ev.title}</div>
                        <span style={{
                          flexShrink: 0, fontSize: '0.68rem', fontWeight: 800,
                          background: ts.dot, color: '#fff',
                          borderRadius: 99, padding: '2px 8px',
                          boxShadow: `0 2px 6px ${ts.dot}40`,
                        }}>
                          {diffDays === 0 ? 'Today' : diffDays === 1 ? 'Tomorrow' : `${diffDays}d`}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#666', marginTop: 4 }}>
                        📅 {evDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        {ev.time && ` · 🕐 ${ev.time}`}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Admin panel */}
          {isAdmin && (
            <div style={{
              background: 'linear-gradient(135deg, #0f3d22 0%, #1a6b3c 60%, #16a34a 100%)',
              borderRadius: 18, padding: 20, color: '#fff',
              boxShadow: '0 4px 20px rgba(26,107,60,0.3)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}>
              <h3 style={{ margin: '0 0 8px', fontWeight: 800, fontSize: '0.92rem' }}>⚡ Admin Controls</h3>
              <p style={{ margin: '0 0 14px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>
                Click any date, then "+ Add Event" to schedule.
              </p>
              <Link to="/admin" style={{
                display: 'block', textAlign: 'center',
                background: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: 10, padding: '9px', color: '#fff',
                textDecoration: 'none', fontSize: '0.83rem', fontWeight: 700,
              }}>
                Go to Admin Panel →
              </Link>
            </div>
          )}

          {/* Login prompt */}
          {!user && (
            <div style={{
              background: 'linear-gradient(135deg, #fffbeb, #fef3c7)',
              borderRadius: 18, padding: 20,
              border: '1.5px solid #fde68a',
              textAlign: 'center',
              boxShadow: '0 4px 16px rgba(251,191,36,0.15)',
            }}>
              <div style={{ fontSize: '2rem', marginBottom: 8 }}>🔔</div>
              <p style={{ margin: '0 0 14px', fontSize: '0.83rem', color: '#92400e', fontWeight: 600 }}>
                Login to get notified about upcoming meetings &amp; events.
              </p>
              <Link to="/login" style={{
                display: 'inline-block',
                background: 'linear-gradient(135deg,#1a6b3c,#16a34a)',
                color: '#fff', textDecoration: 'none',
                borderRadius: 10, padding: '9px 24px',
                fontSize: '0.83rem', fontWeight: 700,
                boxShadow: '0 2px 8px rgba(26,107,60,0.3)',
              }}>Login Now</Link>
            </div>
          )}
        </div>
      </div>

      {/* ── Add/Edit Modal ── */}
      {showForm && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        }} onClick={() => setShowForm(false)}>
          <div style={{
            background: '#fff', borderRadius: 22, padding: 30, width: '100%', maxWidth: 500,
            boxShadow: '0 24px 80px rgba(0,0,0,0.3)',
            border: '1px solid #e8f5e9',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontWeight: 900, color: '#1a3c2a', fontSize: '1.15rem' }}>
                {editItem ? '✏️ Edit Event' : '➕ Add New Event'}
              </h2>
              <button onClick={() => setShowForm(false)} style={{ background: '#f3f4f6', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', color: '#666', fontSize: '1rem' }}>✕</button>
            </div>
            <div style={{ marginBottom: 16, padding: '10px 14px', background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)', borderRadius: 10, fontSize: '0.83rem', color: '#1a6b3c', fontWeight: 700, border: '1px solid #86efac' }}>
              📅 {selected && new Date(selected + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: '#374151', marginBottom: 6 }}>Event Title *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required
                  placeholder="e.g. Monthly Panchayat Meeting"
                  style={{ width: '100%', border: '2px solid #e5e7eb', borderRadius: 10, padding: '10px 14px', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                  onFocus={e => e.target.style.borderColor='#1a6b3c'}
                  onBlur={e => e.target.style.borderColor='#e5e7eb'}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: '#374151', marginBottom: 6 }}>Event Type</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  style={{ width: '100%', border: '2px solid #e5e7eb', borderRadius: 10, padding: '10px 14px', fontSize: '0.9rem', outline: 'none', background: '#fff', boxSizing: 'border-box' }}>
                  {TYPE_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: '#374151', marginBottom: 6 }}>Time (optional)</label>
                <input value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                  placeholder="e.g. 10:00 AM – 12:00 PM"
                  style={{ width: '100%', border: '2px solid #e5e7eb', borderRadius: 10, padding: '10px 14px', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor='#1a6b3c'}
                  onBlur={e => e.target.style.borderColor='#e5e7eb'}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: '#374151', marginBottom: 6 }}>Description (optional)</label>
                <textarea value={form.desc} onChange={e => setForm(f => ({ ...f, desc: e.target.value }))} rows={3}
                  placeholder="e.g. Agenda: Water supply, road repair discussion..."
                  style={{ width: '100%', border: '2px solid #e5e7eb', borderRadius: 10, padding: '10px 14px', fontSize: '0.9rem', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor='#1a6b3c'}
                  onBlur={e => e.target.style.borderColor='#e5e7eb'}
                />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
                <button type="button" onClick={() => setShowForm(false)} style={{ background: '#f3f4f6', border: 'none', borderRadius: 10, padding: '11px 22px', fontWeight: 600, cursor: 'pointer', color: '#555', fontSize: '0.9rem' }}>Cancel</button>
                <button type="submit" disabled={saving} style={{
                  background: 'linear-gradient(135deg,#1a6b3c,#16a34a)',
                  color: '#fff', border: 'none', borderRadius: 10,
                  padding: '11px 26px', fontWeight: 800, cursor: 'pointer',
                  fontSize: '0.9rem', boxShadow: '0 2px 10px rgba(26,107,60,0.3)',
                }}>
                  {saving ? 'Saving…' : editItem ? '💾 Update' : '➕ Add Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

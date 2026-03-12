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
  { value: 'meeting',  label: 'Panchayat Meeting', color: '#1a6b3c', bg: '#d1fae5' },
  { value: 'event',    label: 'Village Event',      color: '#2563eb', bg: '#dbeafe' },
  { value: 'holiday',  label: 'Holiday',            color: '#d97706', bg: '#fef3c7' },
  { value: 'health',   label: 'Health Camp',        color: '#dc2626', bg: '#fee2e2' },
  { value: 'notice',   label: 'Notice / Deadline',  color: '#7c3aed', bg: '#ede9fe' },
];

function typeStyle(type) {
  return TYPE_OPTIONS.find(t => t.value === type) || TYPE_OPTIONS[0];
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
  const [selected, setSelected] = useState(null); // selected date string YYYY-MM-DD
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

  // Upcoming meetings (next 30 days)
  const upcoming = meetings
    .filter(m => m.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 6);

  return (
    <div style={{ minHeight: '100vh', background: '#f4f6f9' }}>
      <Navbar />

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1a6b3c 0%, #0f3d22 100%)', padding: '32px 24px 24px', color: '#fff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>
            <Link to="/" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>Home</Link> › Calendar
          </div>
          <h1 style={{ margin: 0, fontSize: 'clamp(1.4rem,3vw,2rem)', fontWeight: 800 }}>
            📅 Panchayat Calendar
          </h1>
          <p style={{ margin: '6px 0 0', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
            Meetings, events & important dates for Chinamanapuram Village
          </p>
        </div>
      </div>

      <div className="cal-layout">

        {/* Calendar */}
        <div>
          <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', overflow: 'hidden' }}>

            {/* Month Nav */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '1px solid #f0ebe0', background: '#fafaf8' }}>
              <button onClick={prevMonth} style={{ background: 'none', border: '1px solid #ddd', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: '1rem', color: '#555' }}>‹</button>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#1a3c2a' }}>{MONTHS[month]} {year}</div>
                <div style={{ fontSize: '0.75rem', color: '#888', marginTop: 2 }}>Chinamanapuram Panchayat · Gantyada Mandal</div>
              </div>
              <button onClick={nextMonth} style={{ background: 'none', border: '1px solid #ddd', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: '1rem', color: '#555' }}>›</button>
            </div>

            {/* Day headers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid #f0ebe0' }}>
              {DAYS.map(d => (
                <div key={d} style={{ textAlign: 'center', padding: '10px 0', fontSize: '0.75rem', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{d}</div>
              ))}
            </div>

            {/* Calendar grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
              {/* Empty cells before month starts */}
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`e${i}`} style={{ minHeight: 90, borderRight: '1px solid #f5f0e8', borderBottom: '1px solid #f5f0e8', background: '#fafaf8' }} />
              ))}

              {/* Days */}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => {
                const key = dateKey(year, month, d);
                const evs = meetingsForDate(key);
                const isToday = key === todayStr;
                const isSelected = key === selected;
                const isSun = new Date(year, month, d).getDay() === 0;

                return (
                  <div
                    key={d}
                    onClick={() => handleDayClick(d)}
                    style={{
                      minHeight: 90, padding: 6, cursor: 'pointer',
                      borderRight: '1px solid #f5f0e8', borderBottom: '1px solid #f5f0e8',
                      background: isSelected ? '#f0fdf4' : isToday ? '#fffbeb' : '#fff',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#f9fafb'; }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = isToday ? '#fffbeb' : '#fff'; }}
                  >
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: isToday ? 800 : 500, fontSize: '0.85rem',
                      background: isToday ? '#1a6b3c' : 'none',
                      color: isToday ? '#fff' : isSun ? '#dc2626' : '#333',
                      marginBottom: 4,
                    }}>{d}</div>
                    {evs.slice(0, 2).map(ev => {
                      const ts = typeStyle(ev.type);
                      return (
                        <div key={ev.id} style={{
                          fontSize: '0.65rem', fontWeight: 600, padding: '2px 5px', borderRadius: 4,
                          background: ts.bg, color: ts.color, marginBottom: 2,
                          overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                        }}>
                          {ev.title}
                        </div>
                      );
                    })}
                    {evs.length > 2 && (
                      <div style={{ fontSize: '0.6rem', color: '#888' }}>+{evs.length - 2} more</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected day events */}
          {detailDay && (
            <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 10px rgba(0,0,0,0.07)', padding: 20, marginTop: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <h3 style={{ margin: 0, fontWeight: 700, color: '#1a3c2a', fontSize: '1rem' }}>
                  📅 {new Date(detailDay + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </h3>
                {isAdmin && (
                  <button onClick={() => openAdd(detailDay)} style={{ background: '#1a6b3c', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: '0.82rem', cursor: 'pointer', fontWeight: 600 }}>
                    + Add Event
                  </button>
                )}
              </div>
              {detailEvents.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#aaa', padding: '20px 0', fontSize: '0.88rem' }}>
                  No events on this day.
                  {isAdmin && <span> Click "+ Add Event" to schedule one.</span>}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {detailEvents.map(ev => {
                    const ts = typeStyle(ev.type);
                    return (
                      <div key={ev.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '12px 14px', borderRadius: 10, background: ts.bg, border: `1px solid ${ts.color}30` }}>
                        <div style={{ width: 4, minHeight: 40, borderRadius: 4, background: ts.color, flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, color: ts.color, fontSize: '0.9rem' }}>{ev.title}</div>
                          {ev.time && <div style={{ fontSize: '0.78rem', color: '#666', marginTop: 2 }}>🕐 {ev.time}</div>}
                          {ev.desc && <div style={{ fontSize: '0.8rem', color: '#555', marginTop: 4 }}>{ev.desc}</div>}
                          <div style={{ fontSize: '0.72rem', color: '#999', marginTop: 4 }}>{ts.label}</div>
                        </div>
                        {isAdmin && (
                          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                            <button onClick={() => openEdit(ev)} style={{ background: '#fff', border: '1px solid #ddd', borderRadius: 6, padding: '4px 8px', fontSize: '0.75rem', cursor: 'pointer', color: '#555' }}>✏️</button>
                            <button onClick={() => handleDelete(ev.id)} style={{ background: '#fff', border: '1px solid #fca5a5', borderRadius: 6, padding: '4px 8px', fontSize: '0.75rem', cursor: 'pointer', color: '#dc2626' }}>🗑️</button>
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

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Legend */}
          <div style={{ background: '#fff', borderRadius: 14, padding: 18, boxShadow: '0 2px 10px rgba(0,0,0,0.07)' }}>
            <h3 style={{ margin: '0 0 12px', fontWeight: 700, color: '#1a3c2a', fontSize: '0.9rem' }}>🏷️ Event Types</h3>
            {TYPE_OPTIONS.map(t => (
              <div key={t.value} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ width: 12, height: 12, borderRadius: 3, background: t.color, flexShrink: 0 }} />
                <span style={{ fontSize: '0.82rem', color: '#555' }}>{t.label}</span>
              </div>
            ))}
          </div>

          {/* Upcoming events */}
          <div style={{ background: '#fff', borderRadius: 14, padding: 18, boxShadow: '0 2px 10px rgba(0,0,0,0.07)' }}>
            <h3 style={{ margin: '0 0 14px', fontWeight: 700, color: '#1a3c2a', fontSize: '0.9rem' }}>📋 Upcoming Events</h3>
            {upcoming.length === 0 ? (
              <div style={{ color: '#aaa', fontSize: '0.82rem', textAlign: 'center', padding: '16px 0' }}>No upcoming events.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {upcoming.map(ev => {
                  const ts = typeStyle(ev.type);
                  const evDate = new Date(ev.date + 'T00:00:00');
                  const diffDays = Math.round((evDate - new Date(todayStr + 'T00:00:00')) / 86400000);
                  return (
                    <div key={ev.id} onClick={() => { setDetailDay(ev.date); setSelected(ev.date); setYear(evDate.getFullYear()); setMonth(evDate.getMonth()); }}
                      style={{ padding: '10px 12px', borderRadius: 10, background: ts.bg, cursor: 'pointer', border: `1px solid ${ts.color}20` }}>
                      <div style={{ fontWeight: 700, fontSize: '0.83rem', color: ts.color }}>{ev.title}</div>
                      <div style={{ fontSize: '0.74rem', color: '#666', marginTop: 3 }}>
                        📅 {evDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        {ev.time && ` · 🕐 ${ev.time}`}
                        <span style={{ marginLeft: 6, background: '#fff', borderRadius: 99, padding: '1px 6px', color: ts.color, fontWeight: 600, fontSize: '0.68rem', border: `1px solid ${ts.color}40` }}>
                          {diffDays === 0 ? 'Today' : diffDays === 1 ? 'Tomorrow' : `${diffDays}d`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Admin quick add */}
          {isAdmin && (
            <div style={{ background: 'linear-gradient(135deg,#1a6b3c,#0f3d22)', borderRadius: 14, padding: 18, color: '#fff', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
              <h3 style={{ margin: '0 0 8px', fontWeight: 700, fontSize: '0.9rem' }}>⚡ Admin</h3>
              <p style={{ margin: '0 0 12px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>Click any date on the calendar, then click "+ Add Event" to schedule a meeting.</p>
              <Link to="/admin" style={{ display: 'block', textAlign: 'center', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 8, padding: '8px', color: '#fff', textDecoration: 'none', fontSize: '0.82rem', fontWeight: 600 }}>
                Go to Admin Panel →
              </Link>
            </div>
          )}

          {!user && (
            <div style={{ background: '#fffbeb', borderRadius: 14, padding: 18, border: '1px solid #fde68a', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>🔒</div>
              <p style={{ margin: '0 0 12px', fontSize: '0.82rem', color: '#92400e' }}>Login to get notified about upcoming meetings.</p>
              <Link to="/login" style={{ display: 'inline-block', background: '#1a6b3c', color: '#fff', textDecoration: 'none', borderRadius: 8, padding: '8px 20px', fontSize: '0.82rem', fontWeight: 600 }}>Login</Link>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={() => setShowForm(false)}>
          <div style={{ background: '#fff', borderRadius: 18, padding: 28, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontWeight: 800, color: '#1a3c2a', fontSize: '1.1rem' }}>
                {editItem ? '✏️ Edit Event' : '➕ Add Event'}
              </h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#888' }}>✕</button>
            </div>
            <div style={{ marginBottom: 14, padding: '8px 12px', background: '#f0fdf4', borderRadius: 8, fontSize: '0.82rem', color: '#1a6b3c', fontWeight: 600 }}>
              📅 {selected && new Date(selected + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#374151', marginBottom: 5 }}>Event Title *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required
                  placeholder="e.g. Monthly Panchayat Meeting"
                  style={{ width: '100%', border: '1.5px solid #e5e7eb', borderRadius: 9, padding: '9px 12px', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#374151', marginBottom: 5 }}>Event Type</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  style={{ width: '100%', border: '1.5px solid #e5e7eb', borderRadius: 9, padding: '9px 12px', fontSize: '0.9rem', outline: 'none', background: '#fff', boxSizing: 'border-box' }}>
                  {TYPE_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#374151', marginBottom: 5 }}>Time (optional)</label>
                <input value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                  placeholder="e.g. 10:00 AM – 12:00 PM"
                  style={{ width: '100%', border: '1.5px solid #e5e7eb', borderRadius: 9, padding: '9px 12px', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#374151', marginBottom: 5 }}>Description (optional)</label>
                <textarea value={form.desc} onChange={e => setForm(f => ({ ...f, desc: e.target.value }))} rows={3}
                  placeholder="e.g. Agenda: Water supply, road repair discussion..."
                  style={{ width: '100%', border: '1.5px solid #e5e7eb', borderRadius: 9, padding: '9px 12px', fontSize: '0.9rem', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
                <button type="button" onClick={() => setShowForm(false)} style={{ background: '#f3f4f6', border: 'none', borderRadius: 9, padding: '10px 20px', fontWeight: 600, cursor: 'pointer', color: '#555' }}>Cancel</button>
                <button type="submit" disabled={saving} style={{ background: '#1a6b3c', color: '#fff', border: 'none', borderRadius: 9, padding: '10px 24px', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>
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

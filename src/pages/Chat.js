import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import {
  collection, addDoc, query, where,
  orderBy, onSnapshot, serverTimestamp, limit,
} from 'firebase/firestore';

/* ─── Channels ─── */
const CHANNELS = [
  { id: 'general',   icon: '💬', label: 'General',      desc: 'Village community chat',    members: 48 },
  { id: 'news',      icon: '📢', label: 'Village News',  desc: 'Announcements & updates',   members: 48 },
  { id: 'emergency', icon: '🚨', label: 'Emergency',     desc: 'Urgent help & alerts',      members: 48 },
  { id: 'farming',   icon: '🌾', label: 'Farming',       desc: 'Crops, weather & market',   members: 31 },
];


/* ─── Helpers ─── */
const COLORS = [
  { bg: '#d1fae5', fg: '#065f46' }, { bg: '#dbeafe', fg: '#1e3a8a' },
  { bg: '#ede9fe', fg: '#4c1d95' }, { bg: '#fce7f3', fg: '#831843' },
  { bg: '#ffedd5', fg: '#7c2d12' }, { bg: '#cffafe', fg: '#164e63' },
  { bg: '#fef3c7', fg: '#78350f' }, { bg: '#dcfce7', fg: '#14532d' },
];

function userColor(name) {
  const n = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return COLORS[n % COLORS.length];
}

function initials(name) {
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
}


/* ─── Single message bubble ─── */
function MsgBubble({ msg, isMine }) {
  const col = userColor(msg.user);
  return (
    <div className={`msg-row ${isMine ? 'msg-row-mine' : ''}`}>
      {!isMine && (
        <div className="msg-av" style={{ background: col.bg, color: col.fg }}>
          {msg.av || initials(msg.user)}
        </div>
      )}
      <div className="msg-col">
        {!isMine && <div className="msg-sender">{msg.user}</div>}
        <div className={`msg-bubble ${isMine ? 'msg-bubble-mine' : ''}`}>
          {msg.text}
        </div>
        <div className={`msg-time ${isMine ? 'msg-time-mine' : ''}`}>{msg.time}</div>
      </div>
      {isMine && (
        <div className="msg-av msg-av-mine">
          {initials(msg.user)}
        </div>
      )}
    </div>
  );
}

/* ─── Date separator ─── */
function DateSep({ label }) {
  return (
    <div className="msg-date-sep">
      <span>{label}</span>
    </div>
  );
}

/* ─── Auth gate for Chat ─── */
function ChatAuthGate() {
  return (
    <div>
      <Navbar />
      <div className="auth-gate">
        <div className="auth-gate-icon">💬</div>
        <h2 className="auth-gate-title">Login to Join the Chat</h2>
        <p className="auth-gate-desc">
          Sign in to participate in the Chinamanapuram community chat — general, news, farming & emergency channels.
        </p>
        <div className="auth-gate-actions">
          <Link to="/login"    className="auth-gate-btn">🔐 Sign In</Link>
          <Link to="/register" className="auth-gate-btn-outline">✨ Register Free</Link>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Chat Page ─── */
export default function Chat() {
  const { user } = useAuth();
  if (!user) return <ChatAuthGate />;

  const displayName = user.displayName || user.email?.split('@')[0] || 'Villager';

  return <ChatInner displayName={displayName} />;
}

function ChatInner({ displayName }) {
  const [activeChannel, setActiveChannel] = useState('general');
  const [messages,      setMessages]      = useState({ general: [], news: [], emergency: [], farming: [] });
  const [input,         setInput]         = useState('');
  const [sidebarOpen,   setSidebarOpen]   = useState(false);
  const [sending,       setSending]       = useState(false);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  /* Real-time Firestore listener per channel */
  useEffect(() => {
    const q = query(
      collection(db, 'chatMessages'),
      where('channelId', '==', activeChannel),
      orderBy('createdAt', 'asc'),
      limit(100)
    );
    const unsub = onSnapshot(q, snap => {
      const msgs = snap.docs.map(d => {
        const data = d.data();
        return {
          id:   d.id,
          user: data.user,
          av:   data.av,
          text: data.text,
          time: data.createdAt?.toDate().toLocaleTimeString('en-IN', {
            hour: '2-digit', minute: '2-digit', hour12: true,
          }) || 'Now',
        };
      });
      setMessages(prev => ({ ...prev, [activeChannel]: msgs }));
    });
    return () => unsub();
  }, [activeChannel]);

  /* Auto-scroll */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeChannel]);

  const currentMsgs = messages[activeChannel] || [];
  const channel     = CHANNELS.find(c => c.id === activeChannel);

  async function sendMessage() {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setInput('');
    try {
      await addDoc(collection(db, 'chatMessages'), {
        channelId: activeChannel,
        user:      displayName,
        av:        initials(displayName),
        text,
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      console.error('Send failed:', e);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  function switchChannel(id) {
    setActiveChannel(id);
    setSidebarOpen(false);
  }

  return (
    <div className="chat-page">
      <Navbar />

      <div className="chat-shell">
        {/* ── Sidebar ── */}
        <aside className={`chat-sidebar ${sidebarOpen ? 'chat-sidebar-open' : ''}`}>
          <div className="chat-sidebar-head">
            <div className="chat-sidebar-title">Chinamanapuram</div>
            <div className="chat-sidebar-sub">Community Chat</div>
          </div>

          <div className="chat-channels">
            <div className="chat-ch-label">CHANNELS</div>
            {CHANNELS.map(ch => {
              const last = messages[ch.id]?.slice(-1)[0];
              return (
                <button
                  key={ch.id}
                  className={`chat-ch-btn ${activeChannel === ch.id ? 'chat-ch-active' : ''}`}
                  onClick={() => switchChannel(ch.id)}
                >
                  <span className="chat-ch-icon">{ch.icon}</span>
                  <div className="chat-ch-info">
                    <div className="chat-ch-name">{ch.label}</div>
                    {last && <div className="chat-ch-preview">{last.user}: {last.text}</div>}
                  </div>
                  {messages[ch.id]?.length > 0 && (
                    <span className="chat-ch-count">{messages[ch.id].length}</span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="chat-user-pill">
            <div className="chat-user-av" style={{ background: userColor(displayName).bg, color: userColor(displayName).fg }}>
              {initials(displayName)}
            </div>
            <div className="chat-user-name">{displayName}</div>
            <Link to="/profile" className="chat-change-name" title="My Profile">👤</Link>
          </div>
        </aside>

        {/* ── Main chat area ── */}
        <div className="chat-main">
          {/* Channel header */}
          <div className="chat-header">
            <button className="chat-sidebar-toggle" onClick={() => setSidebarOpen(o => !o)}>
              ☰
            </button>
            <div className="chat-header-icon">{channel.icon}</div>
            <div>
              <div className="chat-header-name">{channel.label}</div>
              <div className="chat-header-sub">{channel.desc} · {channel.members} members</div>
            </div>
            <div className="chat-online-dot-wrap">
              <span className="chat-online-dot" />
              <span className="chat-online-text">Live</span>
            </div>
          </div>

          {/* Messages */}
          <div className="chat-messages">
            <DateSep label="Today" />
            {currentMsgs.map(msg => (
              <MsgBubble
                key={msg.id}
                msg={msg}
                isMine={msg.user === displayName}
              />
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input bar */}
          <div className="chat-input-bar">
            <div className="chat-input-wrap">
              <textarea
                ref={inputRef}
                className="chat-input"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder={`Message #${channel.label.toLowerCase()}… (Enter to send)`}
                rows={1}
              />
            </div>
            <button
              className="chat-send-btn"
              onClick={sendMessage}
              disabled={!input.trim()}
              title="Send (Enter)"
            >
              ➤
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

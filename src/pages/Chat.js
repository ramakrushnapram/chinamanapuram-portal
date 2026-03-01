import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

/* ─── Channels ─── */
const CHANNELS = [
  { id: 'general',   icon: '💬', label: 'General',      desc: 'Village community chat',    members: 48 },
  { id: 'news',      icon: '📢', label: 'Village News',  desc: 'Announcements & updates',   members: 48 },
  { id: 'emergency', icon: '🚨', label: 'Emergency',     desc: 'Urgent help & alerts',      members: 48 },
  { id: 'farming',   icon: '🌾', label: 'Farming',       desc: 'Crops, weather & market',   members: 31 },
];

/* ─── Seed messages ─── */
const SEED = {
  general: [
    { id: 1, user: 'Sarpanch Naidu',  av: 'SN', time: '9:10 AM',  text: 'Good morning everyone! 🙏 Gram Sabha meeting is confirmed for March 5 at 10 AM, Panchayat Office.' },
    { id: 2, user: 'Venkata Raju',    av: 'VR', time: '9:18 AM',  text: 'Thank you Sarpanch garu. Will the water pipeline issue be on the agenda?' },
    { id: 3, user: 'Sarpanch Naidu',  av: 'SN', time: '9:25 AM',  text: 'Yes! Water supply, road repair on Main Street, and the new school classroom proposal are all included.' },
    { id: 4, user: 'Meena Rao',       av: 'MR', time: '9:42 AM',  text: 'Please also discuss the street lights in North Colony. Very unsafe at night especially for women. 🙏' },
    { id: 5, user: 'Ramesh Babu',     av: 'RB', time: '10:05 AM', text: 'Agreed with Meena garu. I already submitted a complaint on the portal for the same issue.' },
    { id: 6, user: 'Nageswara Rao',   av: 'NR', time: '11:30 AM', text: '💧 Great news! The borewell near the temple has been repaired. Water supply restored in South Colony.' },
    { id: 7, user: 'Suresh Rao',      av: 'SR', time: '11:45 AM', text: 'Wonderful! Thank you to the Panchayat and the PWD team for quick action. 👏' },
    { id: 8, user: 'Durga Prasad',    av: 'DP', time: '2:00 PM',  text: 'Reminder: Ugadi celebrations planning committee meets this Sunday at 4 PM near the temple. All welcome!' },
  ],
  news: [
    { id: 1, user: 'Sarpanch Naidu', av: 'SN', time: 'Feb 25', text: '🏆 Proud moment! Chinamanapuram has been shortlisted for the Swachh Gram Award 2026. Let us keep our village clean!' },
    { id: 2, user: 'Suresh Rao',     av: 'SR', time: 'Feb 27', text: '📚 Scholarship application forms for Class 10 students are available. Come to my house before March 10. Last date is strict.' },
    { id: 3, user: 'Meena Rao',      av: 'MR', time: 'Feb 28', text: '🩺 FREE Health Camp this Sunday 10 AM – 2 PM at Panchayat Office. Eye check-up, BP, blood sugar screening. Bring Aadhaar card.' },
    { id: 4, user: 'Sarpanch Naidu', av: 'SN', time: 'Feb 28', text: '🌾 Rythu Bandhu payments for Kharif season have been released. Check your linked bank accounts.' },
  ],
  emergency: [
    { id: 1, user: 'Durga Prasad',   av: 'DP', time: '3 days ago', text: '⚠️ ALERT: The footbridge near the Hanuman temple has visible cracks on both sides. Please avoid it and use the alternate road via the school.' },
    { id: 2, user: 'Sarpanch Naidu', av: 'SN', time: '3 days ago', text: 'Thank you for the alert Durga Prasad garu. PWD has been informed. Barricades being arranged. Please share this message.' },
    { id: 3, user: 'Hanumantha Rao', av: 'HR', time: '2 days ago', text: 'Stray dog pack near East Street becomes aggressive after dark. Please do not walk alone at night in that area until the issue is resolved.' },
    { id: 4, user: 'Venkata Raju',   av: 'VR', time: '1 day ago',  text: '🔥 Small fire reported near the old storage shed behind the market. It has been controlled. No injuries. Be careful with electrical wiring during summer.' },
  ],
  farming: [
    { id: 1, user: 'Ramesh Babu',   av: 'RB', time: 'Feb 26', text: 'Paddy prices at Gantyada market today: ₹2,183/quintal for fine variety, ₹2,050 for common. Better to hold for a few more days.' },
    { id: 2, user: 'Venkata Raju',  av: 'VR', time: 'Feb 26', text: 'Thanks for the update. What about chilli prices? I have 5 bags ready to sell.' },
    { id: 3, user: 'Ramesh Babu',   av: 'RB', time: 'Feb 27', text: 'Chilli at ₹9,200/quintal. If you can wait until March, rates usually go up before summer.' },
    { id: 4, user: 'Durga Prasad',  av: 'DP', time: 'Feb 27', text: '🌧️ IMD forecast: light rain expected March 2-3. Good for late rabi crop. Hold off on harvesting groundnut until March 4.' },
    { id: 5, user: 'Nageswara Rao', av: 'NR', time: 'Feb 28', text: 'Anyone have surplus urea? Need 2 bags for the mango orchard. Happy to buy or exchange with rice.' },
  ],
};

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

function now() {
  return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
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
  const [activeChannel,setActiveChannel]= useState('general');
  const [messages,     setMessages]     = useState(SEED);
  const [input,        setInput]        = useState('');
  const [sidebarOpen,  setSidebarOpen]  = useState(false);
  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);

  /* Auto-scroll when messages change */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeChannel]);

  const currentMsgs = messages[activeChannel] || [];
  const channel     = CHANNELS.find(c => c.id === activeChannel);

  function sendMessage() {
    const text = input.trim();
    if (!text) return;
    const newMsg = {
      id:   Date.now(),
      user: displayName,
      av:   initials(displayName),
      time: now(),
      text,
    };
    setMessages(prev => ({
      ...prev,
      [activeChannel]: [...prev[activeChannel], newMsg],
    }));
    setInput('');
    inputRef.current?.focus();
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

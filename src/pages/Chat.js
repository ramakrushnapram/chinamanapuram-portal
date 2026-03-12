import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import {
  collection, addDoc, query, where,
  onSnapshot, serverTimestamp, limit,
} from 'firebase/firestore';

/* ─── Village Helper Bot ─── */
const BOT_NAME = 'Village Helper Bot';
const BOT_AV   = '🤖';

const BOT_RULES = [
  {
    keys: ['hello','hi','hey','నమస్కారం','నమస్కారమ్','namaste','helo','హలో'],
    reply: '🙏 నమస్కారం! Hello!\n\nNenu Chinamanapuram Village Helper Bot. Meeru adagavachhu:\n• 🏥 Health / ఆరోగ్యం\n• 🌾 Farming / వ్యవసాయం\n• 🏘️ Village info / గ్రామ సమాచారం\n• 🚨 Emergency numbers\n• 🎉 Festival info\n\nType your question in Telugu or English!',
  },
  {
    keys: ['జ్వరం','fever','సెగ','temperature','temp'],
    reply: '🌡️ జ్వరం / Fever:\n\n🏠 ఇంటి చికిత్స / Home Remedy:\nచల్లని నీటి గుడ్డ నుదిటిపై పెట్టండి. కొబ్బరి నీళ్ళు తాగండి.\nCold wet cloth on forehead. Drink coconut water.\n\n💊 మాత్ర / Tablet: Paracetamol 500mg\n⏱ రోజు 3 సార్లు / 3 times a day\n\n⚠️ 2 రోజులు తగ్గకపోతే డాక్టర్ దగ్గరకు వెళ్ళండి.\nIf no relief in 2 days, see a doctor.\n\n👉 Full details: /health\n📞 108 Ambulance (Free)',
  },
  {
    keys: ['దగ్గు','cough','జలుబు','cold','జలుబుతో','కోల్డ్'],
    reply: '🤧 జలుబు / దగ్గు — Cold & Cough:\n\n🏠 ఇంటి చికిత్స / Home Remedy:\nతులసి + అల్లం + మిరియాలు కషాయం తాగండి.\nBoil tulsi + ginger + pepper, drink warm twice a day.\n\n💊 మాత్ర / Tablet:\nCetirizine 10mg (జలుబుకు / for cold)\nDextromethorphan (దగ్గుకు / for cough)\n\n⚠️ 5 రోజులు తగ్గకపోతే డాక్టర్ దగ్గరకు వెళ్ళండి.\n👉 Full details: /health',
  },
  {
    keys: ['కడుపు నొప్పి','కడుపు','stomach','belly','vomit','వాంతి','diarrhea','loose motion','loose'],
    reply: '🤢 కడుపు నొప్పి / Stomach Ache:\n\n🏠 ఇంటి చికిత్స / Home Remedy:\nORS నీళ్ళు తాగండి. అన్నం + పెరుగు తినండి. నూనె పదార్థాలు తినకండి.\nDrink ORS. Eat plain rice + curd. Avoid oily food.\n\n💊 మాత్ర / Tablet: Ondansetron (వాంతికి) / ORS\n\n⚠️ రక్తం వస్తే వెంటనే 108 call చేయండి.\nIf blood in stool → Call 108 immediately.\n👉 /health',
  },
  {
    keys: ['తలనొప్పి','headache','head ache'],
    reply: '🤕 తలనొప్పి / Headache:\n\n🏠 ఇంటి చికిత్స / Home Remedy:\nచీకటి గదిలో విశ్రాంతి తీసుకోండి. నీళ్ళు ఎక్కువ తాగండి.\nRest in dark room. Drink more water.\n\n💊 మాత్ర / Tablet: Paracetamol 500mg లేదా/or Ibuprofen 400mg\n\n⚠️ తీవ్రమైన తలనొప్పి + వాంతి → 108 call చేయండి వెంటనే.\nSevere headache + vomiting → Call 108 immediately.\n👉 /health',
  },
  {
    keys: ['అసిడిటీ','acidity','heart burn','heartburn','గ్యాస్','gas','burp'],
    reply: '🔥 అసిడిటీ / Acidity:\n\n🏠 ఇంటి చికిత్స / Home Remedy:\nచల్లని పాలు తాగండి. అరటి పండు తినండి. మసాలా తినకండి.\nDrink cold milk. Eat banana. Avoid spicy food.\n\n💊 మాత్ర / Tablet: Pantoprazole 40mg (భోజనానికి ముందు / before meals)\n\n⚠️ రోజూ వస్తే డాక్టర్ దగ్గరకు వెళ్ళండి.\nIf daily, see a doctor.\n👉 /health',
  },
  {
    keys: ['bp','blood pressure','రక్తపోటు','బ్లడ్ ప్రెషర్'],
    reply: '❤️ రక్తపోటు / Blood Pressure:\n\n⚠️ BP రోగులు డాక్టర్ సలహా లేకుండా మాత్రలు ఆపకండి!\nNever stop BP medicines without doctor advice!\n\n🏠 ఇంటి చికిత్స / Home Remedy:\nఉప్పు తగ్గించండి. ప్రతిరోజూ నడవండి 30 నిమిషాలు.\nReduce salt. Walk 30 minutes daily.\n\n💊 మాత్ర / Tablet: Amlodipine 5mg (డాక్టర్ ప్రిస్క్రిప్షన్ తప్పనిసరి / doctor prescription required)\n\n👉 /health · 📞 108',
  },
  {
    keys: ['diabetes','మధుమేహం','sugar','షుగర్','diabetic'],
    reply: '🩸 మధుమేహం / Diabetes:\n\n⚠️ డాక్టర్ సలహా తప్పనిసరి! Doctor supervision required!\n\n🏠 జాగ్రత్తలు / Precautions:\nబియ్యం/మైదా తగ్గించండి. కూరగాయలు ఎక్కువ తినండి. నడవండి.\nReduce rice/maida. Eat more vegetables. Walk daily.\n\n💊 మాత్ర / Tablet: Metformin 500mg (డాక్టర్ ప్రిస్క్రిప్షన్ / prescription only)\n\n👉 /health · 📞 PHC Gantyada: 0894-2XXXXXX',
  },
  {
    keys: ['health','ఆరోగ్యం','doctor','డాక్టర్','medicine','మాత్ర','hospital','హాస్పిటల్'],
    reply: '🏥 ఆరోగ్య సమాచారం / Health Info:\n\nమన గ్రామ ఆరోగ్య మార్గదర్శకం — Village Health Guide:\n• 🌡️ జ్వరం (Fever)\n• 🤧 జలుబు/దగ్గు (Cold/Cough)\n• 🤢 కడుపు నొప్పి (Stomach)\n• 🤕 తలనొప్పి (Headache)\n• 🔥 అసిడిటీ (Acidity)\n• ❤️ రక్తపోటు (BP)\n• 🩸 మధుమేహం (Diabetes)\n\n👉 Full guide with tablets & side effects: /health\n📞 108 Ambulance · 104 Mobile Van',
  },
  {
    keys: ['వ్యవసాయం','farming','crop','పంట','రైతు','farmer','agriculture','వ్యవసాయ'],
    reply: '🌾 సేంద్రీయ వ్యవసాయం / Organic Farming:\n\nChinamanapuram రైతులకు ప్రత్యేక చిట్కాలు:\n• 🌱 జీవామృతం (Jeevamrutham)\n• 🐄 పంచగవ్య (Panchagavya)\n• 🍃 వేప పిచికారీ (Neem Spray)\n• 🌿 పచ్చి ఎరువు (Green Manure)\n• 🪱 వెర్మి కంపోస్ట్ (Earthworm Compost)\n• 🌾 పంట మార్పు (Crop Rotation)\n\nరసాయనాలు లేకుండా అధిక దిగుబడి! Grow more without chemicals!\n\n👉 Full tips: /farming\n📞 Gantyada Mandal Agriculture Dept',
  },
  {
    keys: ['పురుగు','pest','insect','bug','పురుగులు'],
    reply: '🐛 పురుగుల నివారణ / Pest Control (Organic):\n\nరసాయనాలు వాడకండి! Use natural methods!\n\n🍃 వేప పిచికారీ / Neem Spray:\n2 కేజీ వేపాకులు 10 లీ నీటిలో కాచి, చల్లార్చి, 15 లీ నీటిలో కలిపి పిచికారీ చేయండి.\n\nBoil 2kg neem leaves in 10L water. Cool. Dilute in 15L and spray.\n\n👉 More organic tips: /farming',
  },
  {
    keys: ['ఎరువు','fertilizer','compost','jeevamrutham','జీవామృతం','manure'],
    reply: '🌿 సేంద్రీయ ఎరువు / Organic Fertilizer:\n\nజీవామృతం రెసిపీ:\n10kg పేడ + 10L మూత్రం + 1kg బెల్లం + 1kg శనగపిండి + మట్టి → 200L నీటిలో కలపండి. 48 గంటలు ferment చేసి పొలంలో పోయండి.\n\nJeevamrutham: Mix cow dung (10kg), urine (10L), jaggery, gram flour in 200L water. Ferment 48hrs. Apply to field.\n\n👉 All 6 tips: /farming',
  },
  {
    keys: ['సర్పంచ్','sarpanch','leader','panchayat head','పంచాయతీ'],
    reply: '🏘️ గ్రామ సర్పంచ్ / Village Sarpanch:\n\n👤 శ్రీమతి పాసల వెంకట పార్వతి\n   Smt. Pasala Venkata Parvathi\n\n🏢 పంచాయతీ కార్యాలయం:\n   Chinamanapuram, Gantyada Mandal\n   Vizianagaram District, AP\n\n⏰ కార్యాలయ వేళలు / Office Hours:\n   Monday – Saturday: 10 AM – 5 PM',
  },
  {
    keys: ['నీళ్ళు','water','supply','నీటి సరఫరా','నీటి'],
    reply: '💧 నీటి సరఫరా / Water Supply:\n\nSouth Colony లో నీళ్ళు restore అయ్యాయి.\nWater supply restored in South Colony.\n\n⏰ సరఫరా వేళలు / Supply Timings:\n🌅 ఉదయం: 6 AM – 8 AM\n🌇 సాయంత్రం: 6 PM – 7 PM\n\nసమస్య ఉంటే Complaints page లో report చేయండి.\nReport issues at /complaints',
  },
  {
    keys: ['scholarship','స్కాలర్షిప్','fee','scholarships','విద్యార్థి'],
    reply: '📚 Scholarship సమాచారం / Scholarship Info:\n\nClass 10 విద్యార్థులు apply చేసుకోవచ్చు!\n\n📋 కావలసిన పత్రాలు / Documents needed:\n• మార్క్ లిస్ట్ / Mark sheet\n• ఆధార్ కార్డ్ / Aadhaar card\n• Bank Passbook\n\n📅 Last date: 31 March 2026\n🏢 పంచాయతీ కార్యాలయంలో apply చేయండి.\n\n👉 More info: /education',
  },
  {
    keys: ['108','ambulance','అంబులెన్స్'],
    reply: '🚑 108 Ambulance — ఉచిత సేవ / FREE 24×7:\n\n📞 108 — వెంటనే call చేయండి / Call immediately\n📞 104 — Mobile Health Van\n🏥 PHC Gantyada: 0894-2XXXXXX\n🏥 Dist. Hospital Vizianagaram: 0892-2XXXXXX\n\nఉచితం! Free! అందరికీ అందుబాటులో ఉంటుంది.',
  },
  {
    keys: ['emergency','అత్యవసరం','urgent','help','సహాయం'],
    reply: '🚨 అత్యవసర నంబర్లు / Emergency Numbers:\n\n🚑 108 — Ambulance (Free)\n🚒 101 — Fire / అగ్ని\n👮 100 — Police / పోలీస్\n📞 104 — Mobile Health Van\n🏥 PHC Gantyada: 0894-2XXXXXX\n🏥 Dist. Hospital Vizianagaram: 0892-2XXXXXX\n\nఅత్యవసర పరిస్థితిలో తక్షణమే call చేయండి!\nIn any emergency, call immediately!',
  },
  {
    keys: ['ugadi','ఉగాది','festival','పండుగ','celebration','vishwavasu','విశ్వావసు'],
    reply: '🎉 ఉగాది పండుగ / Ugadi Festival:\n\n📅 March 19, 2026 — Vishwavasu Samvatsara\n📍 Panchayat Grounds, Chinamanapuram\n\n⏰ కార్యక్రమం / Program:\n• 6 AM — ఉగాది పచ్చడి / Ugadi Pachadi\n• 5 PM — సాంస్కృతిక కార్యక్రమాలు & బహుమతులు\n\n🥣 పచ్చడి = 6 రుచులు = జీవితంలో అన్ని అనుభవాలను స్వీకరించు!\n6 tastes = Accept all experiences of life!\n\nఅందరికీ ఆహ్వానం! All families welcome!',
  },
  {
    keys: ['road','రోడ్డు','road repair','రోడ్డు మరమ్మత్తు'],
    reply: '🚧 రోడ్డు మరమ్మత్తు / Road Repair:\n\nMain Street దగ్గర Hanuman Temple junction వద్ద రోడ్డు పని జరుగుతోంది.\nWork ongoing near Main Street / Hanuman temple junction.\n\nదయచేసి alternate routes వాడండి / Please use alternate routes.\n\n👉 Complaints & issues: /complaints',
  },
  {
    keys: ['thanks','thank you','ధన్యవాదాలు','thanks bot','ok bot','thank'],
    reply: '🙏 ధన్యవాదాలు! Thank you!\n\nమీకు సహాయపడినందుకు సంతోషం!\nHappy to help the Chinamanapuram community!\n\nఇంకేమైనా అడగాలంటే type చేయండి.\nFeel free to ask anything else anytime!\n\n🏘️ Chinamanapuram Village Portal',
  },
];

function getBotReply(text) {
  const lower = text.toLowerCase();
  for (const rule of BOT_RULES) {
    if (rule.keys.some(k => lower.includes(k))) return rule.reply;
  }
  // fallback for unknown questions
  if (text.trim().endsWith('?') || text.length > 5) {
    return '🤔 అర్థం కాలేదు / I could not understand that.\n\nదయచేసి ఈ విషయాల గురించి అడగండి:\nPlease ask about:\n• Health — type "fever" or "జ్వరం"\n• Farming — type "farming" or "వ్యవసాయం"\n• Emergency — type "108" or "emergency"\n• Sarpanch — type "sarpanch"\n• Ugadi — type "ugadi"\n• Scholarship — type "scholarship"';
  }
  return null;
}

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
  if (msg.isBot) {
    function speak() {
      if (!window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(msg.text);
      const voices = window.speechSynthesis.getVoices();
      const teVoice = voices.find(v => v.lang.startsWith('te'));
      if (teVoice) utter.voice = teVoice;
      utter.rate = 0.85;
      utter.lang = teVoice ? 'te-IN' : 'en-IN';
      window.speechSynthesis.speak(utter);
    }
    return (
      <div className="msg-row msg-row-bot">
        <div className="msg-av msg-av-bot" style={{ padding:0, overflow:'hidden', background:'transparent' }}>
          <svg viewBox="0 0 80 80" style={{ width:'100%', height:'100%', borderRadius:'50%' }}>
            <circle cx="40" cy="40" r="40" fill="#1a6b3c"/>
            <rect x="37" y="6" width="6" height="10" rx="3" fill="#fff" opacity="0.9"/>
            <circle cx="40" cy="5" r="4" fill="#e8891a"/>
            <rect x="16" y="16" width="48" height="36" rx="10" fill="#fff" opacity="0.95"/>
            <rect x="24" y="26" width="12" height="10" rx="3" fill="#1a6b3c"/>
            <rect x="44" y="26" width="12" height="10" rx="3" fill="#1a6b3c"/>
            <circle cx="28" cy="29" r="2" fill="#fff" opacity="0.8"/>
            <circle cx="48" cy="29" r="2" fill="#fff" opacity="0.8"/>
            <rect x="26" y="40" width="28" height="6" rx="3" fill="#e8891a" opacity="0.9"/>
            <rect x="28" y="40" width="6" height="4" rx="1" fill="#fff" opacity="0.7"/>
            <rect x="37" y="40" width="6" height="4" rx="1" fill="#fff" opacity="0.7"/>
            <rect x="46" y="40" width="6" height="4" rx="1" fill="#fff" opacity="0.7"/>
            <rect x="22" y="55" width="36" height="18" rx="8" fill="#fff" opacity="0.9"/>
            <circle cx="32" cy="64" r="3" fill="#1a6b3c" opacity="0.6"/>
            <circle cx="40" cy="64" r="3" fill="#e8891a" opacity="0.8"/>
            <circle cx="48" cy="64" r="3" fill="#1a6b3c" opacity="0.6"/>
            <rect x="8" y="56" width="12" height="6" rx="3" fill="#fff" opacity="0.8"/>
            <rect x="60" y="56" width="12" height="6" rx="3" fill="#fff" opacity="0.8"/>
          </svg>
        </div>
        <div className="msg-col">
          <div className="msg-sender msg-sender-bot">{msg.user}</div>
          <div className="msg-bubble msg-bubble-bot">{msg.text}</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
            <div className="msg-time">{msg.time}</div>
            {window.speechSynthesis && (
              <button className="bot-speak-btn" onClick={speak} title="Speak out loud">🔊</button>
            )}
          </div>
        </div>
      </div>
    );
  }
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

  /* Subscribe to ALL channels at once — history persists when switching tabs */
  useEffect(() => {
    const subs = CHANNELS.map(ch => {
      const q = query(
        collection(db, 'chatMessages'),
        where('channelId', '==', ch.id),
        limit(200)
      );
      return onSnapshot(q, snap => {
        const msgs = snap.docs
          .map(d => {
            const data = d.data();
            return {
              id:      d.id,
              user:    data.user,
              av:      data.av,
              text:    data.text,
              sortKey: data.createdAt?.seconds || Date.now() / 1000,
              time:    data.createdAt
                ? data.createdAt.toDate().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
                : 'Just now',
            };
          })
          .sort((a, b) => a.sortKey - b.sortKey);
        setMessages(prev => ({ ...prev, [ch.id]: msgs }));
      }, () => {});
    });
    return () => subs.forEach(u => u());
  }, []); // mount once — all channels always live

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
      // Bot reply — local only, no Firestore write needed
      const botReply = getBotReply(text);
      if (botReply) {
        setTimeout(() => {
          const now = new Date();
          setMessages(prev => ({
            ...prev,
            [activeChannel]: [
              ...prev[activeChannel],
              {
                id:      `bot-${Date.now()}`,
                user:    BOT_NAME,
                av:      BOT_AV,
                text:    botReply,
                isBot:   true,
                sortKey: Date.now() / 1000 + 1,
                time:    now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
              },
            ],
          }));
        }, 700);
      }
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

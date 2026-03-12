import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { db } from '../firebase';
import { collection, onSnapshot, query, limit } from 'firebase/firestore';

/* ── Map-style SVG icon components ── */
const IconPin      = () => <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>;
const IconHouse    = () => <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>;
const IconTree     = () => <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M17 8C8 10 5.9 16.17 3.82 21c.19.04.39.07.6.07h15.16c.21 0 .41-.03.6-.07C18.5 16.5 18 11 17 8zM12 3C8.58 3 6 5.58 6 9c0 .09.01.18.01.27C7.41 8.12 9.45 8 12 8s4.59.12 5.99 1.27c0-.09.01-.18.01-.27C18 5.58 15.42 3 12 3z"/></svg>;
const IconCamera   = () => <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M20 5h-3.17L15 3H9L7.17 5H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-8 13c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.65 0-3 1.35-3 3s1.35 3 3 3 3-1.35 3-3-1.35-3-3-3z"/></svg>;
const IconAlert    = () => <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>;
const IconChat     = () => <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>;
const IconSchool   = () => <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z"/></svg>;
const IconPeople   = () => <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>;
const IconMap      = () => <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z"/></svg>;
const IconVideo    = () => <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/></svg>;

const QUICK_LINKS = [
  { to: '/families',    Icon: IconHouse,  label: 'Families',    color: 'teal'   },
  { to: '/family-tree', Icon: IconTree,   label: 'Family Tree', color: 'green'  },
  { to: '/gallery',     Icon: IconCamera, label: 'Gallery',     color: 'orange' },
  { to: '/videos',      Icon: IconVideo,  label: 'Videos',      color: 'red'    },
  { to: '/complaints',  Icon: IconAlert,  label: 'Complaints',  color: 'purple' },
  { to: '/chat',        Icon: IconChat,   label: 'Village Chat',color: 'blue'   },
  { to: '/education',   Icon: IconSchool, label: 'Education',   color: 'teal'   },
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
  { id:1, tag:'urgent', badge:'urgent', icon:'🚨', title:'Road Repair Work – Main Street',    desc:'Road repair work is ongoing on Main Street near the temple. Please use alternate routes. Work in progress near Hanuman temple junction.', date:'8 Mar 2026' },
  { id:2, tag:'event',  badge:'event',  icon:'🎉', title:'Ugadi Festival – 19 March 2026',     desc:'Ugadi (Vishwavasu Samvatsara) celebrations at Panchayat grounds. Ugadi pachadi at 6 AM, cultural programs & prize distribution from 5 PM.', date:'19 Mar 2026' },
  { id:3, tag:'info',   badge:'info',   icon:'💧', title:'Water Supply Restored – South Colony', desc:'Water supply fully restored in South Colony after pipeline repair. Regular supply timings: 6 AM – 8 AM and 6 PM – 7 PM daily.', date:'7 Mar 2026' },
  { id:4, tag:'notice', badge:'notice', icon:'📚', title:'Scholarship Applications Open',     desc:'Class 10 students can apply for scholarships at Panchayat office. Bring mark sheets, Aadhaar card and passbook. Last date: 31 March 2026.', date:'1 Mar 2026' },
  { id:5, tag:'info',   badge:'info',   icon:'🏥', title:'Free Health Camp – 15 March 2026',  desc:'Free medical check-up for all villagers at Panchayat Office. Specialists from Vizianagaram hospital. Timing: 9 AM – 2 PM.', date:'15 Mar 2026' },
  { id:6, tag:'notice', badge:'notice', icon:'🏆', title:'Swachh Gram Award 2026',            desc:'Chinamanapuram has been shortlisted for Swachh Gram Award 2026! Let us keep our village clean and win this honour for all of us.', date:'5 Mar 2026' },
];

/* Telugu & National festival calendar 2026-2027 — verified Google dates */
const FESTIVAL_CALENDAR = [
  {
    id:1, iso:'2026-03-19', color:'orange', icon:'🎉',
    img:'https://img.freepik.com/premium-photo/ugadi-feast-togetherness-familys-traditional-celebration_1189075-193.jpg?w=600',
    title:'Ugadi – Vishwavasu Telugu New Year',
    desc:'Grand Ugadi (Vishwavasu Samvatsara) celebrations at Panchayat grounds. Ugadi pachadi, cultural programs & prize distribution from 5 PM. All families invited!',
    detail: {
      what_te: '🌟 ఉగాది అంటే తెలుగు హిందువుల కొత్త సంవత్సరం. "యుగ + ఆది" అంటే కొత్త యుగం యొక్క ప్రారంభం అని అర్థం. 2026లో విశ్వావసు నామ సంవత్సరం మొదలవుతుంది. ఈ రోజు సూర్యోదయం ముందే లేచి, నువ్వుల నూనెతో తల స్నానం చేసి, కొత్త బట్టలు ధరించాలి.',
      what_en: '🌟 Ugadi is the Telugu Hindu New Year. "Yuga + Aadi" means the beginning of a new era. In 2026, Vishwavasu Nama Samvatsara begins. Wake before sunrise, bathe with sesame oil, wear new clothes.',
      pachadi_title: '🥣 ఉగాది పచ్చడి — షడ్రుచుల రహస్యం',
      pachadi_items: [
        { emoji:'🌿', taste:'చేదు · Bitter',    ingredient:'వేప పువ్వు (Neem flowers)',   meaning:'దుఃఖాన్ని స్వీకరించు · Accept sorrow' },
        { emoji:'🍯', taste:'తీపి · Sweet',     ingredient:'బెల్లం (Jaggery)',              meaning:'ఆనందాన్ని పంచుకో · Share joy' },
        { emoji:'🍋', taste:'పులుపు · Sour',    ingredient:'చింతపండు (Tamarind)',          meaning:'సవాళ్ళను ఎదుర్కో · Face challenges' },
        { emoji:'🌶️', taste:'కారం · Spicy',   ingredient:'మిరప (Green chilli)',           meaning:'ఆశ్చర్యానికి సిద్ధంగా ఉండు · Expect surprises' },
        { emoji:'🧂', taste:'ఉప్పు · Salty',   ingredient:'ఉప్పు (Salt)',                  meaning:'జీవితంలో భయాన్ని అధిగమించు · Overcome fear' },
        { emoji:'🥭', taste:'వగరు · Tangy',    ingredient:'పచ్చి మామిడి (Raw mango)',     meaning:'ధైర్యంగా ముందుకు వెళ్ళు · Move forward bravely' },
      ],
    },
  },
  { id:2,  iso:'2026-03-26', color:'green',  icon:'🙏', img:'https://images.unsplash.com/photo-1598091383021-15ddea10925d?auto=format&fit=crop&w=600&h=200&q=80', title:'Sri Rama Navami',               desc:'Procession from Hanuman temple at 6 AM. Bhajans, Ramayana recitation and prasadam distribution for all villagers.' },
  { id:3,  iso:'2026-04-29', color:'yellow', icon:'🌺', img:'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&h=200&q=80', title:'Akshaya Tritiya',               desc:'Auspicious day for new beginnings. Puja at temple at 8 AM followed by community feast and blessings.' },
  { id:4,  iso:'2026-07-19', color:'red',    icon:'🥁', img:'https://images.unsplash.com/photo-1596550016568-e6a0fc9a8cf5?auto=format&fit=crop&w=600&h=200&q=80', title:'Bonalu Festival – Ashada Masam', desc:'4-week Bonalu festival begins. Women carry bonalu pots to Mahakali temple. Grand procession every Sunday till Aug 9.' },
  { id:5,  iso:'2026-08-03', color:'purple', icon:'🪢', img:'https://images.unsplash.com/photo-1567889946-60bbb16a3ccb?auto=format&fit=crop&w=600&h=200&q=80', title:'Raksha Bandhan',                desc:'Sisters tie rakhi to brothers. Panchayat arranges a rakhi-tying event for village children at 10 AM.' },
  { id:6,  iso:'2026-08-13', color:'blue',   icon:'🦚', img:'https://images.unsplash.com/photo-1609763975499-ed7de3ee38a4?auto=format&fit=crop&w=600&h=200&q=80', title:'Krishna Janmashtami',           desc:'Midnight puja and dahi-handi at the Hanuman temple. Cultural programmes from 8 PM onwards. All welcome!' },
  { id:7,  iso:'2026-09-22', color:'orange', icon:'🐘', img:'https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&w=600&h=200&q=80', title:'Ganesh Chaturthi',              desc:'10-day festival begins. Ganesh idol installed at village square. Daily aarti at 8 AM and 8 PM. Visarjan on Oct 2.' },
  { id:8,  iso:'2026-10-11', color:'red',    icon:'⚔️', img:'https://images.unsplash.com/photo-1563288370-efb5cf8df2a5?auto=format&fit=crop&w=600&h=200&q=80', title:'Navratri Begins',               desc:'9 nights of Goddess puja at the village temple. Cultural programs every evening. Vijayadashami (Dussehra) on Oct 20.' },
  { id:9,  iso:'2026-11-08', color:'yellow', icon:'🪔', img:'https://images.unsplash.com/photo-1603484477859-abe6a73f9366?auto=format&fit=crop&w=600&h=200&q=80', title:'Diwali – Festival of Lights',   desc:'Diya lighting at village entrance at 7 PM. Fireworks at the main ground. Sweets & gifts distributed by Panchayat.' },
  { id:10, iso:'2026-11-15', color:'green',  icon:'💡', img:'https://images.unsplash.com/photo-1544532911-9c6a9c5f7fdb?auto=format&fit=crop&w=600&h=200&q=80', title:'Karthika Deepotsavam',          desc:'Lighting of 1000 diyas at Karthika Vanam near the temple. Karthika Purnima night celebrations for all villagers.' },
  { id:11, iso:'2027-01-14', color:'orange', icon:'🎑', img:'https://images.unsplash.com/photo-1516912481808-3406841bd33c?auto=format&fit=crop&w=600&h=200&q=80', title:'Makar Sankranti / Pongal 2027', desc:'Pongal cooking at village square, kite flying competition, and Mattu Pongal cattle decoration on Jan 15.' },
];

/* Village Life Showcase cards */
const VILLAGE_SHOWCASE = [
  {
    label:'Ugadi Celebrations', sub:'Grand feast & family togetherness', emoji:'🎉', tag:'Festival',
    img:'https://img.freepik.com/premium-photo/ugadi-feast-togetherness-familys-traditional-celebration_1189075-193.jpg?w=800',
    fallback:'linear-gradient(135deg,#b45309,#f59e0b)',
    info_te:'ఉగాది మన తెలుగు కొత్త సంవత్సరం. పంచాయతీ మైదానంలో పెద్ద వేడుక జరుగుతుంది. ఉగాది పచ్చడి, పోటీలు, బహుమతులు, సాంస్కృతిక కార్యక్రమాలు ఉంటాయి. అందరూ కొత్త బట్టలు వేసుకొని వస్తారు.',
    info_en:'Ugadi is our Telugu New Year! Grand celebrations at Panchayat grounds — Ugadi pachadi, competitions, cultural shows, prize distribution. Everyone comes in new clothes. A day of joy and community togetherness.',
  },
  {
    label:'Volleyball Court', sub:'Village sports ground — kids & youth', emoji:'🏐', tag:'Sports',
    img:'https://heatstrokewear.com/wp-content/uploads/2025/05/Heat-Stroke-Prevention-for-Beach-Volleyball-P01.webp',
    fallback:'linear-gradient(135deg,#1d4ed8,#60a5fa)',
    info_te:'మన ఊరిలో వాలీబాల్ మైదానం ఉంది. యువకులు ప్రతిరోజూ సాయంత్రం ఆడతారు. మండల స్థాయి పోటీలలో మన జట్టు మంచి పేరు తెచ్చుకుంది. పిల్లలు, పెద్దలు అందరూ ఆడవచ్చు.',
    info_en:'Chinamanapuram has a volleyball court where youth play every evening. Our team has won mandal-level tournaments. Open for children and adults — come and join the fun!',
  },
  {
    label:'Village School', sub:'Students on benches · Teacher\'s class', emoji:'🏫', tag:'Education',
    img:'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=600&h=360&q=80',
    fallback:'linear-gradient(135deg,#065f46,#10b981)',
    info_te:'మన ఊరి పాఠశాలలో 218 మంది విద్యార్థులు చదువుతున్నారు. తెలుగు మాధ్యమంలో 1-10 తరగతులు ఉన్నాయి. మంచి ఉపాధ్యాయులు ఉన్నారు. స్కాలర్‌షిప్ దరఖాస్తులు తెరిచి ఉన్నాయి — పాఠశాలలో వివరాలు అడగండి.',
    info_en:'Our village school has 218 students from classes 1–10. Telugu medium with dedicated teachers. Scholarship applications are open for Class 10 students — visit the Panchayat office for details.',
  },
  {
    label:'Hanuman Temple', sub:'Daily puja · Karthika deepotsavam', emoji:'🛕', tag:'Temple',
    img:'https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&w=600&h=360&q=80',
    fallback:'linear-gradient(135deg,#7c2d12,#dc2626)',
    info_te:'ఊరి మధ్యలో హనుమాన్ గుడి ఉంది. ప్రతిరోజూ ఉదయం 6 గంటలకు, సాయంత్రం 7 గంటలకు పూజ జరుగుతుంది. కార్తీక మాసంలో 1000 దీపాలు వెలిగిస్తారు. మంగళవారం ప్రత్యేక పూజ జరుగుతుంది.',
    info_en:'Hanuman temple in the heart of the village. Daily puja at 6 AM and 7 PM. 1000 lamps lit during Karthika month. Special puja every Tuesday. Everyone is welcome for darshan.',
  },
  {
    label:'Paddy Fields', sub:'Lush green agriculture · Village life', emoji:'🌾', tag:'Farming',
    img:'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&h=360&q=80',
    fallback:'linear-gradient(135deg,#064e3b,#059669)',
    info_te:'మన ఊరిలో 1,240 ఎకరాల వ్యవసాయ భూమి ఉంది. వరి, మొక్కజొన్న, పప్పుధాన్యాలు పండిస్తారు. జీవామృతం, వేప పిచికారీ వంటి సహజ పద్ధతులు వాడుతున్న రైతులు ఎక్కువ దిగుబడి పొందుతున్నారు. రసాయనాలు వద్దు!',
    info_en:'1,240 acres of agricultural land in Chinamanapuram. Paddy, maize, and pulses are grown. Farmers using natural methods like Jeevamrutham and neem spray are getting better yields. No chemicals needed!',
  },
  {
    label:'Diwali Festival', sub:'Diyas · Fireworks · Community joy', emoji:'🪔', tag:'Festival',
    img:'https://images.unsplash.com/photo-1603484477859-abe6a73f9366?auto=format&fit=crop&w=600&h=360&q=80',
    fallback:'linear-gradient(135deg,#78350f,#f59e0b)',
    info_te:'దీపావళి రాత్రి మన ఊరు వెలుతురుతో మెరిసిపోతుంది. పంచాయతీ ద్వారం దగ్గర 1000 దీపాలు వెలిగిస్తారు. మైదానంలో బాణాసంచా కాలుస్తారు. మిఠాయిలు, బహుమతులు పంచుతారు. అందరూ కలిసి సంతోషంగా జరుపుకుంటారు.',
    info_en:'Diwali night Chinamanapuram glows with light! 1000 diyas at the village entrance, fireworks at the main ground, sweets and gifts distributed by Panchayat. A night of joy and togetherness for all families.',
  },
];

const today = new Date(); today.setHours(0,0,0,0);

function daysFromNow(iso) {
  const d = new Date(iso); d.setHours(0,0,0,0);
  return Math.round((d - today) / 86400000);
}


/* ── Count-up animation hook ── */
function useCountUp(target, duration = 1600, active = true) {
  const [count, setCount] = useState(0);
  const raf = useRef(null);
  useEffect(() => {
    if (!active || target === 0) { setCount(target); return; }
    let start = null;
    const step = ts => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
      setCount(Math.round(eased * target));
      if (p < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => raf.current && cancelAnimationFrame(raf.current);
  }, [target, duration, active]);
  return count;
}

/* ── Village Location Map (Leaflet satellite, +/- zoom) ── */
function VillageMap() {
  const mapDivRef  = useRef(null);
  const mapInstRef = useRef(null);

  useEffect(() => {
    if (mapInstRef.current) return;

    /* Load Leaflet CSS once */
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id   = 'leaflet-css';
      link.rel  = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    function initMap() {
      if (!mapDivRef.current || mapInstRef.current) return;
      const L   = window.L;
      const lat = 18.2769, lng = 83.4444; /* Gantyada Mandal, Vizianagaram */

      const map = L.map(mapDivRef.current, {
        center: [lat, lng],
        zoom: 14,
        zoomControl: true,   /* built-in +/- buttons */
      });

      /* ESRI World Imagery — free satellite tiles, no API key */
      L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { attribution: '© Esri', maxZoom: 19 }
      ).addTo(map);

      /* Labels overlay so village names appear over satellite */
      L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 19, opacity: 0.7 }
      ).addTo(map);

      /* Custom green pulse marker */
      const icon = L.divIcon({
        html: `<div style="width:16px;height:16px;border-radius:50%;background:#16a34a;border:3px solid #fff;box-shadow:0 0 0 4px rgba(22,163,74,0.4);"></div>`,
        className: '',
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });
      L.marker([lat, lng], { icon })
        .addTo(map)
        .bindPopup(`<div style="font-family:system-ui;min-width:160px"><b>Chinamanapuram</b><br><small style="color:#555">Gantyada Mandal, Vizianagaram<br>Andhra Pradesh, India</small></div>`)
        .openPopup();

      mapInstRef.current = map;
    }

    if (window.L) {
      initMap();
    } else if (!document.getElementById('leaflet-js')) {
      const script  = document.createElement('script');
      script.id     = 'leaflet-js';
      script.src    = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = initMap;
      document.head.appendChild(script);
    } else {
      /* Script tag exists, wait for window.L */
      const t = setInterval(() => { if (window.L) { clearInterval(t); initMap(); } }, 80);
    }

    return () => {
      if (mapInstRef.current) { mapInstRef.current.remove(); mapInstRef.current = null; }
    };
  }, []);

  return (
    <section style={{ overflow:'hidden' }}>
      <div style={{ background:'linear-gradient(135deg,#071a0e 0%,#0f3320 100%)', padding:'40px 24px 0', textAlign:'center' }}>
        <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(232,137,26,0.12)', border:'1px solid rgba(232,137,26,0.3)', borderRadius:99, padding:'4px 16px', marginBottom:12 }}>
          <IconPin />
          <span style={{ color:'#f5a93c', fontSize:'0.82rem', fontWeight:600 }}>LIVE SATELLITE MAP</span>
        </div>
        <h2 style={{ color:'#fff', fontSize:'clamp(1.4rem,3vw,2rem)', fontWeight:800, margin:'0 0 6px' }}>
          Village on the Map
        </h2>
        <p style={{ color:'rgba(255,255,255,0.5)', fontSize:'0.87rem', marginBottom:20 }}>
          Chinamanapuram · Gantyada Mandal · Vizianagaram District · Andhra Pradesh
        </p>
      </div>
      <div style={{ position:'relative', height:420 }}>
        {/* Leaflet map container */}
        <div ref={mapDivRef} style={{ width:'100%', height:'100%' }} />

        {/* Overlay info card (above map, pointer-events:none) */}
        <div style={{ position:'absolute', top:12, left:12, zIndex:1000, background:'rgba(10,40,20,0.92)', borderRadius:10, padding:'10px 14px', backdropFilter:'blur(4px)', border:'1px solid rgba(45,153,89,0.4)', pointerEvents:'none' }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, color:'#4ade80', fontWeight:700, fontSize:'0.85rem' }}>
            <span style={{ width:8, height:8, borderRadius:'50%', background:'#4ade80', display:'inline-block', boxShadow:'0 0 8px #4ade80', animation:'pulse-dot 1.4s ease-out infinite' }} />
            Chinamanapuram
          </div>
          <div style={{ color:'rgba(255,255,255,0.6)', fontSize:'0.72rem', marginTop:2 }}>Gantyada Mandal, Vizianagaram</div>
        </div>

        {/* Zoom hint */}
        <div style={{ position:'absolute', bottom:10, right:10, zIndex:1000, background:'rgba(10,40,20,0.85)', borderRadius:8, padding:'5px 10px', pointerEvents:'none', fontSize:'0.68rem', color:'rgba(255,255,255,0.6)' }}>
          Use + / − to zoom · Drag to explore
        </div>
      </div>
    </section>
  );
}

/* ── Village Statistics Graph ── */
function VillageGraph({ liveFamilies = 0, livePopulation = 0 }) {
  const [animated, setAnimated] = useState(false);
  const graphData = [
    { label:'Families',   value: liveFamilies  || 342,  max:500,  color:'#1a6b3c', Icon: IconHouse  },
    { label:'Population', value: livePopulation|| 1480, max:2000, color:'#2563eb', Icon: IconPeople },
    { label:'Students',   value:218,  max:400,  color:'#7c3aed', Icon: IconSchool },
    { label:'Agri Acres', value:1240, max:2000, color:'#d97706', Icon: IconMap    },
    { label:'Voters',     value:876,  max:1200, color:'#dc2626', Icon: IconPin    },
  ];

  useEffect(() => {
    const el = document.getElementById('vg-section');
    if (!el || typeof IntersectionObserver === 'undefined') { setAnimated(true); return; }
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) { setAnimated(true); obs.disconnect(); }
    }, { threshold: 0.2 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section id="vg-section" style={{ background:'linear-gradient(135deg,#0f2d1a 0%,#1a4a2e 100%)', padding:'48px 24px', marginTop:0 }}>
      <div style={{ maxWidth:900, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <h2 style={{ color:'#fff', fontSize:'clamp(1.4rem,3vw,2rem)', fontWeight:800, marginBottom:6 }}>📊 Village at a Glance</h2>
          <p style={{ color:'rgba(255,255,255,0.55)', fontSize:'0.88rem' }}>Chinamanapuram Village Statistics · 2026</p>
        </div>
        <div style={{ display:'grid', gap:18 }}>
          {graphData.map((d, i) => {
            const pct = animated ? Math.round((d.value / d.max) * 100) : 0;
            return (
              <div key={d.label}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                  <span style={{ color:'rgba(255,255,255,0.85)', fontWeight:600, fontSize:'0.9rem', display:'flex', alignItems:'center', gap:6 }}>
                    <span style={{ color:d.color }}><d.Icon /></span> {d.label}
                  </span>
                  <span style={{ color:d.color, fontWeight:700, fontSize:'0.95rem' }}>
                    {d.value.toLocaleString('en-IN')}
                  </span>
                </div>
                <div style={{ background:'rgba(255,255,255,0.1)', borderRadius:99, height:10, overflow:'hidden' }}>
                  <div style={{
                    height:'100%', borderRadius:99,
                    background:`linear-gradient(90deg,${d.color},${d.color}cc)`,
                    width: `${pct}%`,
                    transition: animated ? `width 1.2s cubic-bezier(0.22,1,0.36,1) ${i * 0.12}s` : 'none',
                    boxShadow:`0 0 10px ${d.color}66`,
                  }} />
                </div>
                <div style={{ textAlign:'right', fontSize:'0.72rem', color:'rgba(255,255,255,0.35)', marginTop:2 }}>
                  {pct}% of target ({d.max.toLocaleString('en-IN')})
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ── Weather code → icon + label ── */
function weatherInfo(code) {
  if (code === 0)                    return { icon:'☀️',  label:'Clear Sky'       };
  if (code <= 3)                     return { icon:'⛅',  label:'Partly Cloudy'   };
  if (code <= 48)                    return { icon:'🌫️', label:'Foggy'            };
  if (code <= 55)                    return { icon:'🌦️', label:'Drizzle'          };
  if (code <= 65)                    return { icon:'🌧️', label:'Rainy'            };
  if (code <= 75)                    return { icon:'🌨️', label:'Snowy'            };
  if (code <= 82)                    return { icon:'🌦️', label:'Rain Showers'     };
  if (code <= 99)                    return { icon:'⛈️', label:'Thunderstorm'     };
  return                                    { icon:'🌤️', label:'Partly Cloudy'   };
}

export default function HomePage() {
  const [announcements,  setAnnouncements]  = useState(DEFAULT_ANNOUNCEMENTS);
  const [festivalModal,  setFestivalModal]  = useState(null);
  const [showcaseModal,  setShowcaseModal]  = useState(null);
  const [weather,        setWeather]        = useState(null);
  const [weatherLoading,setWeatherLoading]= useState(true);
  const [statsReady,    setStatsReady]    = useState(false);
  const [liveFamilies,  setLiveFamilies]  = useState(0);
  const [livePopulation,setLivePopulation]= useState(0);
  const [liveMembers,   setLiveMembers]   = useState(0);

  // Animated count-up values (trigger after data loads)
  const famCount = useCountUp(liveFamilies,  1800, statsReady);
  const popCount = useCountUp(livePopulation,2000, statsReady);
  useCountUp(liveMembers, 1600, statsReady); /* keeps hook in sync; value unused in UI */

  // Live weather from Open-Meteo (free, no API key) — Vizianagaram coordinates
  useEffect(() => {
    const url = 'https://api.open-meteo.com/v1/forecast?latitude=18.1066&longitude=83.3956&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code,apparent_temperature&wind_speed_unit=kmh&timezone=Asia%2FKolkata';
    fetch(url)
      .then(r => r.json())
      .then(data => {
        const c = data.current;
        setWeather({
          temp:      Math.round(c.temperature_2m),
          feelsLike: Math.round(c.apparent_temperature),
          humidity:  c.relative_humidity_2m,
          wind:      Math.round(c.wind_speed_10m),
          code:      c.weather_code,
          updatedAt: new Date().toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' }),
        });
      })
      .catch(() => {})
      .finally(() => setWeatherLoading(false));
  }, []);

  // Live stats — families count + population sum from Firestore
  useEffect(() => {
    try {
      const unsub = onSnapshot(collection(db, 'families'), snap => {
        const docs = snap.docs.map(d => d.data());
        const fCount = docs.length;
        const pop    = docs.reduce((s, d) => s + (parseInt(d.members) || 0), 0);
        setLiveFamilies(fCount);
        setLivePopulation(pop || fCount * 4); // fallback: avg 4 per family
        setStatsReady(true);
      }, () => { setStatsReady(true); });
      return unsub;
    } catch (_) { setStatsReady(true); }
  }, []);

  // Live users/members count
  useEffect(() => {
    try {
      const unsub = onSnapshot(collection(db, 'users'), snap => {
        setLiveMembers(snap.docs.filter(d => d.data().status === 'approved').length);
      }, () => {});
      return unsub;
    } catch (_) {}
  }, []);

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

          {/* Hero bottom tags — live from Firestore */}
          <div className="hp-hero-badges">
            <span className="hp-hero-tag">
              <IconHouse /> {famCount > 0 ? famCount.toLocaleString('en-IN') : '—'} Families
            </span>
            <span className="hp-hero-tag">
              <IconPeople /> {popCount > 0 ? popCount.toLocaleString('en-IN') : '—'} Population
            </span>
            <span className="hp-hero-tag"><IconSchool /> 218 Students</span>
            <span className="hp-hero-tag"><IconMap /> 1,240 Acres</span>
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
            <div className="hp-stat-icon green"><IconHouse /></div>
            <div className="hp-stat-num">{famCount > 0 ? famCount.toLocaleString('en-IN') : <span style={{fontSize:'1.2rem'}}>⟳</span>}</div>
            <div className="hp-stat-label">Registered Families</div>
          </div>
          <div className="hp-stat-divider" />
          <div className="hp-stat">
            <div className="hp-stat-icon orange"><IconPeople /></div>
            <div className="hp-stat-num">{popCount > 0 ? popCount.toLocaleString('en-IN') : <span style={{fontSize:'1.2rem'}}>⟳</span>}</div>
            <div className="hp-stat-label">Total Population</div>
          </div>
          <div className="hp-stat-divider" />
          <div className="hp-stat">
            <div className="hp-stat-icon blue"><IconSchool /></div>
            <div className="hp-stat-num">218</div>
            <div className="hp-stat-label">Students Enrolled</div>
          </div>
          <div className="hp-stat-divider" />
          <div className="hp-stat">
            <div className="hp-stat-icon purple"><IconMap /></div>
            <div className="hp-stat-num">1,240</div>
            <div className="hp-stat-label">Acres Agri Land</div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════
          VILLAGE LIFE SHOWCASE
      ══════════════════════════════════════ */}
      <section className="showcase-section">
        <div className="showcase-header">
          <h2 className="showcase-title">🏘️ Life in Chinamanapuram</h2>
          <p className="showcase-sub">Festivals · Sports · Education · Culture — Our village, our pride</p>
        </div>
        <div className="showcase-grid">
          {VILLAGE_SHOWCASE.map((card, i) => (
            <div key={i} className="showcase-card" style={{ animationDelay: `${i * 0.1}s` }}
              onClick={() => setShowcaseModal(card)}>
              <div className="showcase-img-wrap">
                <div className="showcase-img-bg" style={{ background: card.fallback }} />
                <img
                  src={card.img}
                  alt={card.label}
                  className="showcase-img"
                  onError={e => { e.target.style.display = 'none'; }}
                />
                <div className="showcase-overlay" />
              </div>
              <div className="showcase-village-tag">🏘️ Chinamanapuram</div>
              <div className="showcase-cat-tag">{card.tag}</div>
              <div className="showcase-content">
                <div className="showcase-emoji">{card.emoji}</div>
                <div className="showcase-label">{card.label}</div>
                <div className="showcase-sublabel">{card.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

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
                <div className={`ann-accent ${ann.tag || 'info'}`} />
                <div className="ann-inner">
                  <div className={`ann-badge ${ann.badge || ann.tag || 'info'}`}>{ann.icon || '📌'}</div>
                  <div className="ann-content">
                    <div className="ann-top">
                      <span className={`ann-tag ${ann.tag || 'info'}`}>{ann.tag || 'info'}</span>
                      <span className="ann-date">{ann.date || ''}</span>
                    </div>
                    <div className="ann-title">{ann.title}</div>
                    <div className="ann-desc">{ann.desc || ann.description || ''}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Sidebar */}
        <div className="sidebar">

          {/* Live Weather Widget */}
          <div className="sidebar-card weather-widget">
            <div className="weather-header">
              🌤️ Live Weather
              {weather && <span style={{ fontSize:'0.7rem', color:'rgba(255,255,255,0.6)', marginLeft:6 }}>· {weather.updatedAt}</span>}
            </div>
            {weatherLoading ? (
              <div style={{ padding:'16px 0', textAlign:'center', color:'rgba(255,255,255,0.7)', fontSize:'0.85rem' }}>
                ⏳ Loading live weather…
              </div>
            ) : weather ? (
              <>
                <div className="weather-main">
                  <span className="weather-emoji">{weatherInfo(weather.code).icon}</span>
                  <div>
                    <div className="weather-temp">{weather.temp}°C</div>
                    <div className="weather-condition">{weatherInfo(weather.code).label}</div>
                    <div className="weather-location">Chinamanapuram, AP</div>
                  </div>
                </div>
                <div className="weather-details">
                  <div className="weather-detail"><span>💧</span><span>Humidity: {weather.humidity}%</span></div>
                  <div className="weather-detail"><span>🌬️</span><span>Wind: {weather.wind} km/h</span></div>
                  <div className="weather-detail"><span>🌡️</span><span>Feels like: {weather.feelsLike}°C</span></div>
                  <div className="weather-detail"><span>📍</span><span>Vizianagaram District</span></div>
                </div>
              </>
            ) : (
              <div style={{ padding:'16px 0', textAlign:'center', color:'rgba(255,255,255,0.7)', fontSize:'0.85rem' }}>
                ⛅ Weather data unavailable
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div className="sidebar-card">
            <div className="section-header" style={{ marginBottom:12 }}>
              <h3 className="section-title" style={{ fontSize:'1rem' }}>🔗 Quick Access</h3>
            </div>
            <div className="quick-links-grid">
              {QUICK_LINKS.map(link => (
                <Link key={link.to} to={link.to} className="quick-link-card">
                  <div className={`ql-icon ${link.color}`}><link.Icon /></div>
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
          LIVE FESTIVAL CALENDAR  (auto-advances)
      ══════════════════════════════════════ */}
      {(() => {
        /* Only show today + future festivals */
        const upcoming = FESTIVAL_CALENDAR.filter(e => daysFromNow(e.iso) >= 0);
        const next     = upcoming[0];   /* the very next / current festival */
        const rest     = upcoming.slice(1, 5); /* next 4 after that */
        if (!next) return null;
        const nextDays = daysFromNow(next.iso);
        const isLive   = nextDays === 0;
        const nextLabel = isLive ? 'TODAY — CELEBRATING NOW!'
          : nextDays === 1 ? 'Tomorrow!'
          : `In ${nextDays} days`;
        return (
          <section className="events-section">
            <div className="section-header" style={{ marginBottom: 24 }}>
              <h2 className="section-title">🎊 Upcoming Festivals 2026</h2>
              <Link to="/chat" className="section-link">Discuss →</Link>
            </div>

            {/* ── Featured next festival ── */}
            <div className={`ev-featured${isLive ? ' ev-featured-live' : ''}`}
              style={next.img ? { backgroundImage: `url(${next.img})`, cursor:'pointer' } : { cursor:'pointer' }}
              onClick={() => setFestivalModal(next)}>
              <div className="ev-featured-overlay" />
              <div className="ev-featured-village">🏘️ Chinamanapuram</div>
              {isLive && <div className="ev-featured-live-badge">🔴 LIVE TODAY</div>}
              <div className="ev-featured-body">
                <div className="ev-featured-countdown">{nextLabel}</div>
                <div className="ev-featured-emoji">{next.icon}</div>
                <h2 className="ev-featured-title">{next.title}</h2>
                <p className="ev-featured-desc">{next.desc}</p>
                <div className="ev-featured-date">
                  📅 {new Date(next.iso).toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
                </div>
              </div>
            </div>

            {/* ── Remaining upcoming festivals ── */}
            {rest.length > 0 && (
              <div className="events-grid" style={{ marginTop: 24 }}>
                {rest.map(ev => {
                  const days = daysFromNow(ev.iso);
                  const isSoon = days <= 7;
                  const dateLabel = days === 0 ? 'TODAY' : days === 1 ? 'TOMORROW'
                    : new Date(ev.iso).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
                  return (
                    <div key={ev.id} className="event-card" onClick={() => setFestivalModal(ev)} style={{ cursor:'pointer' }}>
                      <div className={`event-banner ${ev.color || 'green'} ev-banner-img`}
                        style={ev.img ? { backgroundImage:`url(${ev.img})`, backgroundSize:'cover', backgroundPosition:'center' } : {}}>
                        <div className="ev-banner-overlay" />
                        <span className="ev-banner-emoji">{ev.icon || '📅'}</span>
                        <div className="ev-banner-village">🏘️ Chinamanapuram</div>
                        {isSoon && days > 0 && <span className="ev-soon-badge">📅 {days} days</span>}
                      </div>
                      <div className="event-body">
                        <div className="event-date-badge">{dateLabel}</div>
                        <h3 className="event-title">{ev.title}</h3>
                        <p className="event-desc">{ev.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        );
      })()}

      {/* ══════════════════════════════════════
          VILLAGE MAP
      ══════════════════════════════════════ */}
      <VillageMap />

      {/* ══════════════════════════════════════
          FESTIVAL DETAIL MODAL
      ══════════════════════════════════════ */}
      {festivalModal && (
        <div className="fest-modal-backdrop" onClick={() => setFestivalModal(null)}>
          <div className="fest-modal" onClick={e => e.stopPropagation()}>
            <button className="fest-modal-close" onClick={() => setFestivalModal(null)}>✕</button>
            {festivalModal.img && (
              <div className="fest-modal-banner" style={{ backgroundImage: `url(${festivalModal.img})` }} />
            )}
            <div className="fest-modal-body">
              <div className="fest-modal-icon">{festivalModal.icon}</div>
              <h2 className="fest-modal-title">{festivalModal.title}</h2>
              <div className="fest-modal-date">
                📅 {new Date(festivalModal.iso).toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
              </div>
              <p className="fest-modal-desc">{festivalModal.desc}</p>

              {/* Rich detail section (Ugadi pachadi etc.) */}
              {festivalModal.detail && (
                <div className="fest-modal-detail">
                  {festivalModal.detail.what_te && (
                    <div className="fest-modal-what">
                      <p className="fest-modal-what-te">{festivalModal.detail.what_te}</p>
                      <p className="fest-modal-what-en">{festivalModal.detail.what_en}</p>
                    </div>
                  )}
                  {festivalModal.detail.pachadi_title && (
                    <div className="fest-modal-pachadi">
                      <div className="fest-modal-pachadi-title">{festivalModal.detail.pachadi_title}</div>
                      <div className="fest-modal-pachadi-grid">
                        {festivalModal.detail.pachadi_items.map((item, i) => (
                          <div key={i} className="fest-pachadi-item">
                            <span className="fest-pachadi-emoji">{item.emoji}</span>
                            <div>
                              <div className="fest-pachadi-taste">{item.taste}</div>
                              <div className="fest-pachadi-ing">{item.ingredient}</div>
                              <div className="fest-pachadi-meaning">{item.meaning}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="fest-modal-village">🏘️ Chinamanapuram · Gantyada Mandal · Vizianagaram District · AP</div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          SHOWCASE MODAL  (Life in Chinamanapuram)
      ══════════════════════════════════════ */}
      {showcaseModal && (
        <div className="fest-modal-backdrop" onClick={() => setShowcaseModal(null)}>
          <div className="fest-modal" onClick={e => e.stopPropagation()}>
            <button className="fest-modal-close" onClick={() => setShowcaseModal(null)}>✕</button>
            <div className="showcase-modal-banner"
              style={{ background: showcaseModal.fallback, backgroundImage: `url(${showcaseModal.img})`, backgroundSize:'cover', backgroundPosition:'center' }}>
              <span className="showcase-modal-emoji">{showcaseModal.emoji}</span>
              <span className="showcase-modal-cat">{showcaseModal.tag}</span>
            </div>
            <div className="fest-modal-body">
              <div style={{ fontSize:'0.72rem', color:'#888', marginBottom:4 }}>🏘️ Chinamanapuram · Life in our Village</div>
              <h2 className="fest-modal-title">{showcaseModal.label}</h2>
              <p style={{ fontSize:'0.85rem', color:'#666', marginBottom:14 }}>{showcaseModal.sub}</p>
              {showcaseModal.info_te && (
                <div className="showcase-modal-info">
                  <p className="showcase-modal-info-te">{showcaseModal.info_te}</p>
                  <p className="showcase-modal-info-en">{showcaseModal.info_en}</p>
                </div>
              )}
              <div className="fest-modal-village">🏘️ Chinamanapuram · Gantyada Mandal · Vizianagaram District · AP</div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          VILLAGE STATISTICS GRAPH
      ══════════════════════════════════════ */}
      <VillageGraph liveFamilies={liveFamilies} livePopulation={livePopulation} />

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

import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { db } from '../firebase';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';

const DEFAULT_FARMING_TIPS = [
  {
    icon: '🌱',
    title: 'జీవామృతం / Jeevamrutham',
    te: '10 కేజీ పేడ + 10 లీ మూత్రం + 1 కేజీ బెల్లం + 1 కేజీ శనగపిండి + మట్టి — 200 లీ నీటిలో కలపండి. 48 గంటలు ఉంచి పొలంలో పోయండి. పంట బాగా పెరుగుతుంది.',
    en: 'Mix cow dung (10 kg) + urine (10 L) + jaggery (1 kg) + gram flour (1 kg) + soil in 200 L water. Ferment 48 hrs. Pour into field — crops grow strong without chemicals.',
  },
  {
    icon: '🐄',
    title: 'పంచగవ్య / Panchagavya',
    te: 'పేడ 5 కేజీ, నెయ్యి 500గ్రా, పాలు 2 లీ, పెరుగు 2 లీ, మూత్రం 3 లీ కలిపి 30 రోజులు ప్రతిరోజూ కదుపుతూ ఉంచండి. 3% కలిపి పంటపై పిచికారీ చేయండి.',
    en: 'Mix cow dung (5 kg), ghee (500g), milk (2 L), curd (2 L), urine (3 L). Stir daily for 30 days. Dilute 3% in water and spray on crops for excellent natural growth.',
  },
  {
    icon: '🍃',
    title: 'వేప పిచికారీ / Neem Spray',
    te: '2 కేజీ వేపాకులు 10 లీ నీటిలో కాచి, వడబోసి చల్లారనివ్వండి. 15 లీ నీటిలో 2 లీ కలిపి పంటకు పిచికారీ చేయండి. రసాయనాలు లేకుండా పురుగులు పోతాయి.',
    en: 'Boil 2 kg neem leaves in 10 L water. Filter and cool. Mix 2 L in 15 L water and spray on crops. Kills all pests naturally — no chemicals needed.',
  },
  {
    icon: '🌿',
    title: 'పచ్చి ఎరువు / Green Manure',
    te: '45 రోజులు జనుము లేదా ధైంచా పెంచి నేలలో దున్నండి. నేలకు సహజంగా నత్రజని అందుతుంది — యూరియా అవసరం లేదు! ఖర్చు తగ్గుతుంది.',
    en: 'Grow Dhaincha or Sunn Hemp for 45 days then plough into soil. Adds nitrogen naturally — no urea needed! Save money, improve soil health.',
  },
  {
    icon: '🪱',
    title: 'వెర్మి కంపోస్ట్ / Earthworm Compost',
    te: 'కూరగాయ తొక్కలు + ఎండు ఆకులు పెట్టెలో వేసి వానపాముల కలపండి. 45 రోజులకు మంచి ఎరువు తయారవుతుంది. 1 కేజీ = 5 కేజీ రసాయన ఎరువుకు సమానం.',
    en: 'Put vegetable peels + dry leaves in a box and add earthworms. After 45 days you get rich natural fertilizer. 1 kg equals 5 kg chemical fertilizer.',
  },
  {
    icon: '🌾',
    title: 'పంట మార్పు / Crop Rotation',
    te: 'ఒకే పంట వేయకండి. వరి → పప్పుధాన్యాలు → కూరగాయలు మార్చి వేయండి. నేల ఆరోగ్యంగా ఉంటుంది, పురుగులు పెరగవు. దిగుబడి పెరుగుతుంది.',
    en: 'Never grow the same crop every season. Alternate: paddy → pulses → vegetables. Soil stays healthy, pests cannot build up, and yield increases naturally.',
  },
];

export default function Farming() {
  const [tips, setTips] = useState(DEFAULT_FARMING_TIPS);

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'farmingTips'), orderBy('order', 'asc')),
      snap => {
        if (snap.docs.length > 0) setTips(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      },
      () => {} // fallback to defaults on error
    );
    return unsub;
  }, []);

  return (
    <div>
      <Navbar />
      <div className="farming-page">
        <div className="farming-page-hero">
          <div className="farming-page-hero-icon">🌾</div>
          <h1 className="farming-page-hero-title">సేంద్రీయ వ్యవసాయం</h1>
          <p className="farming-page-hero-sub">Organic Farming Tips for Chinamanapuram Farmers</p>
          <p className="farming-page-hero-desc">
            రసాయనాలు లేకుండా సహజ పద్ధతులతో అధిక దిగుబడి పొందండి. మన పూర్వీకుల వ్యవసాయ రహస్యాలు!<br/>
            <span style={{ color: '#86efac', fontSize: '0.82rem' }}>
              Grow more with nature — ancient farming secrets from our ancestors.
            </span>
          </p>
        </div>

        <div className="farming-page-grid">
          {tips.map((tip, i) => (
            <div key={tip.id || i} className="farming-card">
              <div className="farming-card-icon">{tip.icon}</div>
              <div className="farming-card-title">{tip.title}</div>
              <div className="farming-card-te">{tip.te}</div>
              <div className="farming-card-en">{tip.en}</div>
            </div>
          ))}
        </div>

        <div className="farming-footer">
          <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>🌿</div>
          <div style={{ fontWeight: 700, color: '#4ade80', marginBottom: 4 }}>
            సహజ వ్యవసాయం — ప్రకృతితో జీవించండి
          </div>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.82rem' }}>
            Natural Farming · Live with Nature · No Chemicals · Healthy Food
          </div>
          <div style={{ marginTop: 16, fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)' }}>
            సందేహాలకు: పంచాయతీ కార్యాలయం · Gantyada Mandal Agriculture Dept
          </div>
        </div>
      </div>
    </div>
  );
}

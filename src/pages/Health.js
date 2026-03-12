import Navbar from '../components/Navbar';

const HEALTH_GUIDE = [
  {
    icon:'🌡️', color:'#ef4444',
    title:'జ్వరం / Fever',
    symptoms_te:'వొళ్ళు వేడిగా ఉంటుంది, తలనొప్పి, ఒళ్ళు నొప్పులు',
    symptoms_en:'Body feels hot, headache, body ache',
    home_te:'చల్లని నీటి పట్టు నుదుటిపై పెట్టండి. కొబ్బరి నీళ్ళు తాగండి. తులసి + అల్లం + మిరియాలు కషాయం తాగండి.',
    home_en:'Apply cold wet cloth on forehead. Drink coconut water. Boil tulsi + ginger + pepper in water and drink.',
    tablet:'Paracetamol 500mg (Crocin / Dolo 650)',
    dose_te:'పెద్దలు: రోజుకు 3 సార్లు 1 మాత్ర. పిల్లలు: డాక్టర్ సలహా తీసుకోండి.',
    dose_en:'Adults: 1 tablet 3 times a day. Children: consult a doctor.',
    side_te:'జ్వరం 3 రోజులు తగ్గకపోతే వెంటనే డాక్టర్‌ని చూడండి. పొట్టలో నొప్పి వస్తే వాడకండి.',
    side_en:'If fever does not reduce in 3 days, see a doctor immediately. Avoid if you have stomach pain or liver issues.',
    danger:'102°F పైన జ్వరం వస్తే వెంటనే ఆసుపత్రికి వెళ్ళండి · Go to hospital if fever is above 102°F',
  },
  {
    icon:'🤧', color:'#3b82f6',
    title:'జలుబు దగ్గు / Cold & Cough',
    symptoms_te:'ముక్కు కారడం, గొంతు నొప్పి, దగ్గు, తుమ్ములు',
    symptoms_en:'Runny nose, sore throat, cough, sneezing',
    home_te:'వేడి నీళ్ళతో ఆవిరి పట్టండి. తేనె + అల్లం రసం తాగండి. పసుపు పాలు రాత్రి తాగండి.',
    home_en:'Steam inhalation with hot water. Drink honey + ginger juice. Drink turmeric milk at night.',
    tablet:'Cetirizine 10mg (Cetcip / Okacet) + Paracetamol 500mg',
    dose_te:'1 cetirizine రాత్రి పడుకోబోయే ముందు. Paracetamol జ్వరం ఉంటే మాత్రమే.',
    dose_en:'1 cetirizine tablet at bedtime. Paracetamol only if fever is present.',
    side_te:'Cetirizine వేస్తే నిద్ర వస్తుంది — వాహనం నడపకండి. పిల్లలకు డాక్టర్ సలహా తీసుకోండి.',
    side_en:'Cetirizine causes drowsiness — do not drive. For children, consult a doctor.',
    danger:'1 వారం తగ్గకపోతే లేదా రక్తం వస్తే వెంటనే డాక్టర్ దగ్గరికి వెళ్ళండి · See doctor if not better in 1 week',
  },
  {
    icon:'🤢', color:'#f59e0b',
    title:'పొట్ట నొప్పి / Stomach Ache',
    symptoms_te:'పొట్ట మెలితిరిగినట్టు నొప్పి, వికారం, వాంతులు',
    symptoms_en:'Cramping stomach pain, nausea, vomiting',
    home_te:'జీరా నీళ్ళు తాగండి (1 చెంచా జీరా నీటిలో కాచి). మజ్జిగ తాగండి. నువ్వు నూనెతో పొట్ట మీద మర్దన చేయండి.',
    home_en:'Drink cumin water (boil 1 tsp cumin). Drink buttermilk. Gently massage stomach with sesame oil.',
    tablet:'Drotin DS (Drotaverine) / ORS for dehydration / Buscopan',
    dose_te:'1 Drotin DS మాత్ర నొప్పి వచ్చినప్పుడు. వాంతులు వస్తే ORS పొడి నీటిలో కలిపి తాగండి.',
    dose_en:'1 Drotin DS when pain occurs. If vomiting, mix ORS powder in water and sip slowly.',
    side_te:'నొప్పి 3 గంటల తర్వాత తగ్గకపోతే డాక్టర్‌కు చూపించండి. పిల్లలకు ఈ మాత్ర ఇవ్వకండి.',
    side_en:'If pain does not reduce after 3 hours, see a doctor. Do not give to children without advice.',
    danger:'నల్లని మలం లేదా రక్తపు వాంతులు వస్తే వెంటనే ఆసుపత్రి · Black stool or blood in vomit = emergency',
  },
  {
    icon:'🤕', color:'#8b5cf6',
    title:'తలనొప్పి / Headache',
    symptoms_te:'తల మొద్దుగా లేదా దిట్టంగా నొప్పి, కళ్ళు మంటగా ఉంటాయి',
    symptoms_en:'Dull or throbbing pain in head, eyes feel heavy',
    home_te:'చల్లని నీళ్ళతో మెడ, నుదుటి మీద పట్టు పెట్టండి. నిమ్మకాయ రసం + ఉప్పు తాగండి. చీకటి గదిలో విశ్రాంతి తీసుకోండి.',
    home_en:'Apply cold compress on neck and forehead. Drink lemon juice with salt. Rest in a dark quiet room.',
    tablet:'Paracetamol 500mg (Crocin) · తీవ్రంగా ఉంటే: Combiflam (Ibuprofen+Paracetamol)',
    dose_te:'1 Crocin మాత్ర. నొప్పి తీవ్రంగా ఉంటే 1 Combiflam — పొట్ట నిండగా తిన్న తర్వాత మాత్రమే.',
    dose_en:'1 Paracetamol. For severe pain: 1 Combiflam — always take after food to protect stomach.',
    side_te:'Combiflam పస్తు ఉన్నప్పుడు వాడకండి. రోజూ తలనొప్పి వస్తే డాక్టర్‌కు చెప్పండి.',
    side_en:'Never take Combiflam on empty stomach. Daily headaches need a doctor check-up.',
    danger:'హఠాత్తు తీవ్రమైన తలనొప్పి, కళ్ళు మసకగా అవ్వడం వస్తే వెంటనే ఆసుపత్రి · Sudden severe headache = emergency',
  },
  {
    icon:'💊', color:'#16a34a',
    title:'అసిడిటీ / Acidity',
    symptoms_te:'గుండె దగ్గర మంట, వేగం, నోటిలో పుల్లగా రావడం',
    symptoms_en:'Burning in chest, belching, sour taste in mouth',
    home_te:'చల్లని పాలు తాగండి. అరటిపండు తినండి. అల్లం ముక్క నమలండి. నూనె, కారం తగ్గించండి.',
    home_en:'Drink cold milk. Eat a banana. Chew ginger. Avoid spicy and oily food.',
    tablet:'Pantoprazole 40mg (Pan-D / Pantocid) · తక్షణ ఉపశమనానికి: Gelusil syrup',
    dose_te:'1 Pantoprazole ఉదయం తినే 30 నిమిషాల ముందు. Gelusil 2 చెంచాలు భోజనం తర్వాత.',
    dose_en:'1 Pantoprazole 30 min before breakfast. Gelusil 2 tablespoons after meals for quick relief.',
    side_te:'Pantoprazole 2 వారాలకు మించి వాడకండి — తర్వాత డాక్టర్‌ని చూడండి.',
    side_en:'Do not use Pantoprazole for more than 2 weeks without a doctor.',
    danger:'గుండె నొప్పిలా మంట + చేయి నొప్పి వస్తే వెంటనే ఆసుపత్రి — గుండె సమస్య కావచ్చు · Possible heart issue',
  },
  {
    icon:'🩹', color:'#dc2626',
    title:'గాయాలు / Cuts & Wounds',
    symptoms_te:'రక్తం కారడం, గాయం మంటగా ఉండడం',
    symptoms_en:'Bleeding, burning sensation at the wound',
    home_te:'మొదట స్వచ్ఛమైన నీళ్ళతో కడగండి. పసుపు పొడి వేయండి. శుభ్రమైన గుడ్డతో కట్టండి.',
    home_en:'First wash with clean water. Apply turmeric powder. Cover with a clean cloth or bandage.',
    tablet:'Betadine (Povidone Iodine) · Neosporin ointment · Crocin for pain',
    dose_te:'Betadine solution శుభ్రమైన దూదితో గాయం మీద పూయండి. రోజుకు 2 సార్లు.',
    dose_en:'Apply Betadine solution with clean cotton on the wound, twice a day.',
    side_te:'గాయం ఎర్రగా అవ్వడం, పుష్పు రావడం మొదలైతే వెంటనే డాక్టర్ దగ్గరికి వెళ్ళండి.',
    side_en:'If wound turns red, swells, or produces pus — see a doctor immediately.',
    danger:'చాలా రక్తం కారితే లేదా లోతైన గాయం అయితే వెంటనే PHC కి వెళ్ళండి · Deep wounds need hospital',
  },
  {
    icon:'💉', color:'#0891b2',
    title:'రక్తపోటు / Blood Pressure',
    symptoms_te:'తల తిరగడం, తలనొప్పి, కళ్ళు మసకగా కనిపించడం, గుండె వేగంగా కొట్టుకోవడం',
    symptoms_en:'Dizziness, headache, blurred vision, rapid heartbeat',
    home_te:'ఉప్పు తక్కువగా తినండి. నిమ్మకాయ రసం తాగండి. రోజూ నడవండి. ఒత్తిడి తగ్గించుకోండి. పొగతాగడం మానండి.',
    home_en:'Reduce salt intake. Drink lemon juice. Walk daily. Reduce stress. Stop smoking.',
    tablet:'డాక్టర్ చెప్పిన మాత్రలు మాత్రమే వాడండి — స్వయంగా మాత్రలు వాడకండి',
    dose_te:'BP మాత్రలు డాక్టర్ సలహా లేకుండా ఆపకండి. ప్రతిరోజూ నిర్ణీత సమయానికి తీసుకోండి.',
    dose_en:'Never stop BP tablets without doctor advice. Take them at the same time every day.',
    side_te:'నిమ్మళంగా కూర్చోండి. అకస్మాత్తుగా లేవకండి — తల తిరుగుతుంది. ఒత్తిడి ప్రమాదకరం.',
    side_en:'Sit or stand up slowly — sudden movements cause dizziness. Stress is dangerous.',
    danger:'180/120 కంటే ఎక్కువ BP వస్తే వెంటనే ఆసుపత్రికి వెళ్ళండి · BP above 180/120 = emergency',
  },
  {
    icon:'🍬', color:'#d97706',
    title:'మధుమేహం / Diabetes',
    symptoms_te:'ఎక్కువ దాహం, తరచుగా మూత్రం, అలసట, గాయాలు మెల్లగా తగ్గడం',
    symptoms_en:'Excessive thirst, frequent urination, fatigue, slow healing wounds',
    home_te:'తీపి తినవద్దు. చక్కెర, బెల్లం మానండి. ఆకుకూరలు, పప్పు తినండి. రోజూ నడవండి. వేపాకులు నమలండి.',
    home_en:'Avoid sweets and jaggery. Eat greens and pulses. Walk 30 minutes daily. Chew neem leaves.',
    tablet:'డాక్టర్ చెప్పిన మాత్రలు మాత్రమే (Metformin సాధారణంగా ఉపయోగిస్తారు)',
    dose_te:'Metformin భోజనం తర్వాత తీసుకోండి — పస్తు ఉన్నప్పుడు వాడకండి. డాక్టర్ పర్యవేక్షణలో ఉండండి.',
    dose_en:'Take Metformin after food — never on empty stomach. Stay under doctor supervision.',
    side_te:'చక్కెర చాలా తగ్గితే (hypoglycemia) వెంటనే మిఠాయి తినండి లేదా పంచదార నీళ్ళు తాగండి.',
    side_en:'If sugar drops too low, eat sweets or drink sugar water immediately.',
    danger:'తెలివి తప్పినట్టు అనిపిస్తే లేదా స్పృహ తప్పితే వెంటనే 108 కి call చేయండి · Loss of consciousness = call 108',
  },
];

export default function Health() {
  return (
    <div>
      <Navbar />
      <div className="health-page">

        {/* Hero */}
        <div className="health-page-hero">
          <div className="health-page-hero-inner">
            <div className="health-badge">🏥 గ్రామ ఆరోగ్య మార్గదర్శకం · Village Health Guide</div>
            <h1 className="health-page-title">సాధారణ జబ్బులు — ఇంటి చికిత్స &amp; మాత్రలు</h1>
            <p className="health-page-sub">Common Illnesses · Home Remedies · Tablet Names · Side Effects · When to see a Doctor</p>
            <div className="health-disclaimer">
              ⚠️ <strong>గమనిక / Note:</strong> ఇది సాధారణ సమాచారం మాత్రమే. తీవ్రమైన లక్షణాలు వస్తే వెంటనే డాక్టర్‌ను సంప్రదించండి.<br />
              This is general information only — always consult a doctor for serious symptoms.
            </div>
          </div>
        </div>

        {/* Emergency numbers */}
        <div className="health-emergency-bar">
          <a href="tel:108" className="health-emg-btn red">🚑 108 · Ambulance (Free)</a>
          <a href="tel:104" className="health-emg-btn blue">🏥 104 · Mobile Health Van</a>
          <span className="health-emg-btn green">🏥 PHC Gantyada · 0894-2XXXXXX</span>
          <span className="health-emg-btn orange">🏨 Dist. Hospital Vizianagaram · 0892-2XXXXXX</span>
        </div>

        {/* Cards grid */}
        <div className="health-page-grid">
          {HEALTH_GUIDE.map((item, i) => (
            <div key={i} className="health-card" style={{ '--hc': item.color }}>
              <div className="hc-top">
                <span className="hc-icon">{item.icon}</span>
                <h3 className="hc-title">{item.title}</h3>
              </div>
              <div className="hc-block hc-symptoms">
                <div className="hc-block-label">🔍 లక్షణాలు / Symptoms</div>
                <div className="hc-block-te">{item.symptoms_te}</div>
                <div className="hc-block-en">{item.symptoms_en}</div>
              </div>
              <div className="hc-block hc-home">
                <div className="hc-block-label">🌿 ఇంటి చికిత్స / Home Remedy</div>
                <div className="hc-block-te">{item.home_te}</div>
                <div className="hc-block-en">{item.home_en}</div>
              </div>
              <div className="hc-block hc-tablet">
                <div className="hc-block-label">💊 మాత్రలు / Tablets</div>
                <div className="hc-tablet-name">{item.tablet}</div>
                <div className="hc-block-te">{item.dose_te}</div>
                <div className="hc-block-en">{item.dose_en}</div>
              </div>
              <div className="hc-block hc-side">
                <div className="hc-block-label">⚠️ జాగ్రత్తలు / Caution</div>
                <div className="hc-block-te">{item.side_te}</div>
                <div className="hc-block-en">{item.side_en}</div>
              </div>
              <div className="hc-danger">{item.danger}</div>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <div className="health-page-footer">
          <p>🙏 <strong>మన చినమనపురం వారికి:</strong> ఈ సమాచారం మీకు సహాయపడాలని ఇచ్చాం. ఎప్పుడూ తీవ్రమైన అనారోగ్యానికి డాక్టర్‌ను చూపించండి.</p>
          <p style={{marginTop:6, opacity:0.7}}>This information is for general awareness only. For serious illness, always visit a qualified doctor or PHC.</p>
        </div>
      </div>
    </div>
  );
}

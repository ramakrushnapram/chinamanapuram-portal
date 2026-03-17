import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { auth, db } from '../firebase';
import { signInWithCustomToken } from 'firebase/auth';
import { doc, setDoc, getDoc, addDoc, collection, serverTimestamp, query, where, getDocs } from 'firebase/firestore';

const WARDS = [
  'Ward 1 – Main Road Area',
  'Ward 2 – Near Temple',
  'Ward 3 – East Street',
  'Ward 4 – North Colony',
  'Ward 5 – South End',
  'Ward 6 – West Street',
  'Ward 7 – School Road',
  'Ward 8 – Village Center',
];

function openWhatsApp(phone, message) {
  const clean  = phone.replace(/\D/g, '');
  const number = clean.startsWith('91') ? clean : '91' + clean;
  window.open(`https://wa.me/${number}?text=${encodeURIComponent(message)}`, '_blank');
}

/* ───────────── Mobile OTP Registration ───────────── */
function MobileRegister({ onSuccess, prefillPhone }) {
  const { logout } = useAuth();

  /* Step 1: form fields  |  Step 2: OTP entry */
  const [step,       setStep]       = useState(1);
  const [form,       setForm]       = useState({
    fullName: '', familyName: '', ward: '',
    mobile: prefillPhone || '',
  });
  const [errors,     setErrors]     = useState({});
  const [error,      setError]      = useState('');
  const [otpSending, setOtpSending] = useState(false);
  const [otp,        setOtp]        = useState('');
  const [otpVerify,  setOtpVerify]  = useState(false);
  const [sessionId,  setSessionId]  = useState('');

  function set(field, val) {
    setForm(f => ({ ...f, [field]: val }));
    if (errors[field]) setErrors(e => ({ ...e, [field]: '' }));
    setError('');
  }

  function validate() {
    const e = {};
    if (!form.fullName.trim())  e.fullName = 'Full name is required';
    if (!form.mobile.trim())    e.mobile   = 'Mobile number is required';
    else if (!/^\d{10}$/.test(form.mobile.replace(/\s/g,''))) e.mobile = 'Enter a valid 10-digit mobile number';
    return e;
  }

  /* Step 1 → 2: Validate form then send OTP via Netlify function */
  async function handleSendOtp(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const mobileClean = form.mobile.replace(/\s/g,'');
    setError(''); setOtpSending(true);

    try {
      /* Check if mobile already registered */
      const q = await getDocs(query(collection(db,'users'), where('mobile','==', mobileClean)));
      if (!q.empty) {
        setError('This mobile number is already registered. Please sign in instead.');
        setOtpSending(false);
        return;
      }

      const res  = await fetch('/.netlify/functions/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: mobileClean }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to send OTP. Try again.'); setOtpSending(false); return; }
      setSessionId(data.sessionId);
      setStep(2);
    } catch (_) {
      setError('Network error. Please check your connection and try again.');
    }
    setOtpSending(false);
  }

  /* Step 2: Verify OTP → Firebase custom token → save profile */
  async function handleVerifyOtp(e) {
    e.preventDefault();
    if (otp.length !== 6) { setError('Enter the 6-digit OTP.'); return; }
    setError(''); setOtpVerify(true);

    const mobileClean = form.mobile.replace(/\s/g,'');
    try {
      const res  = await fetch('/.netlify/functions/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: mobileClean, otp, sessionId }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Invalid OTP. Please try again.'); setOtpVerify(false); return; }

      /* Sign in with Firebase custom token */
      const cred = await signInWithCustomToken(auth, data.token);
      const uid  = cred.user.uid;

      /* Save to Firestore — pending until admin approves */
      await setDoc(doc(db,'users', uid), {
        name:       form.fullName.trim(),
        familyName: form.familyName.trim(),
        ward:       form.ward,
        mobile:     mobileClean,
        email:      '',
        loginType:  'phone',
        status:     'pending',
        createdAt:  serverTimestamp(),
      });

      /* Auto-add to Family Directory */
      try {
        await addDoc(collection(db,'families'), {
          head:      form.fullName.trim(),
          spouse:    '',
          address:   form.ward ? `${form.ward}, Chinamanapuram` : 'Chinamanapuram',
          phone:     mobileClean,
          members:   1,
          since:     new Date().getFullYear(),
          photo:     '',
          userId:    uid,
          createdAt: serverTimestamp(),
        });
      } catch (_) {}

      /* Sign out — user must login manually so they go through proper flow */
      await logout();

      /* Get admin WhatsApp number */
      let adminPhone = '918187038358';
      try {
        const adminSnap = await getDoc(doc(db,'settings','admin'));
        if (adminSnap.exists() && adminSnap.data().whatsappNumber) {
          adminPhone = adminSnap.data().whatsappNumber.replace(/\D/g,'');
          if (!adminPhone.startsWith('91')) adminPhone = '91' + adminPhone;
        }
      } catch (_) {}

      const adminMsg = `New registration from ${form.fullName.trim()} - ${mobileClean} - Ward: ${form.ward || 'Not specified'}\n\nPortal: https://chinamanapuram-portal.netlify.app`;
      onSuccess({ name: form.fullName.trim(), mobile: mobileClean, adminPhone, adminMsg, hasAdminPhone: adminPhone !== '911234567890' });

    } catch (err) {
      if (err.code === 'auth/invalid-verification-code') {
        setError('Incorrect OTP. Please check and try again.');
      } else if (err.code === 'auth/code-expired') {
        setError('OTP has expired. Please go back and request a new one.');
      } else {
        setError('Verification failed. Please try again.');
      }
    }
    setOtpVerify(false);
  }

  function handleResend() {
    setOtp(''); setError(''); setStep(1); setSessionId('');
  }

  /* ── Step 1: Form ── */
  if (step === 1) {
    return (
      <form className="auth-form" onSubmit={handleSendOtp} noValidate>
        <div className="auth-form-grid">

          <div className="auth-field auth-field-full">
            <label className="auth-label">Full Name <span className="auth-req">*</span></label>
            <input className={`auth-input${errors.fullName ? ' auth-input-err' : ''}`} type="text"
              value={form.fullName} onChange={e => set('fullName', e.target.value)}
              placeholder="e.g. Venkata Raju" autoFocus disabled={otpSending} />
            {errors.fullName && <span className="auth-field-err">{errors.fullName}</span>}
          </div>

          <div className="auth-field">
            <label className="auth-label">Family / Surname <span className="auth-opt">(optional)</span></label>
            <input className="auth-input" type="text" value={form.familyName}
              onChange={e => set('familyName', e.target.value)} placeholder="e.g. Rao" disabled={otpSending} />
          </div>

          <div className="auth-field">
            <label className="auth-label">Village Ward <span className="auth-opt">(optional)</span></label>
            <select className="auth-input auth-select" value={form.ward}
              onChange={e => set('ward', e.target.value)} disabled={otpSending}>
              <option value="">Select your ward…</option>
              {WARDS.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>

          <div className="auth-field auth-field-full">
            <label className="auth-label">Mobile Number <span className="auth-req">*</span></label>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              <div style={{ background:'#f3f4f6', border:'1.5px solid #e5e7eb', borderRadius:9, padding:'10px 12px', fontWeight:700, color:'#555', fontSize:'0.9rem', flexShrink:0 }}>
                🇮🇳 +91
              </div>
              <input className={`auth-input${errors.mobile ? ' auth-input-err' : ''}`} type="tel"
                value={form.mobile} onChange={e => set('mobile', e.target.value.replace(/\D/g,''))}
                placeholder="10-digit mobile" maxLength={10} disabled={otpSending} style={{ flex:1 }} />
            </div>
            {errors.mobile && <span className="auth-field-err">{errors.mobile}</span>}
            <span className="auth-field-hint">You will receive an SMS with "CM Village OTP: XXXXXX" 💬</span>
          </div>

        </div>

        {error && <div className="auth-error" style={{ marginTop:8 }}>⚠️ {error}</div>}

        <button type="submit" className="auth-btn-primary" disabled={otpSending} style={{ marginTop:16 }}>
          {otpSending ? <><span className="auth-spinner" /> Sending OTP…</> : '📨 Send OTP'}
        </button>
      </form>
    );
  }

  /* ── Step 2: OTP ── */
  return (
    <form className="auth-form" onSubmit={handleVerifyOtp} noValidate>
      <div style={{ background:'#f0fdf4', border:'1px solid #86efac', borderRadius:10, padding:'10px 14px', marginBottom:16, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <span style={{ fontSize:'0.85rem', color:'#166534', fontWeight:600 }}>
          📱 OTP sent to +91 {form.mobile}
        </span>
        <button type="button" onClick={handleResend}
          style={{ background:'none', border:'none', color:'#1a6b3c', fontSize:'0.8rem', cursor:'pointer', fontWeight:700, textDecoration:'underline' }}>
          Change
        </button>
      </div>

      <div className="auth-field">
        <label className="auth-label">Enter 6-Digit OTP <span className="auth-req">*</span></label>
        <input
          className="auth-input"
          type="text"
          inputMode="numeric"
          value={otp}
          onChange={e => { if (/^\d{0,6}$/.test(e.target.value)) { setOtp(e.target.value); setError(''); } }}
          placeholder="• • • • • •"
          maxLength={6}
          autoFocus
          disabled={otpVerify}
          style={{ fontSize:'1.6rem', letterSpacing:'0.5em', textAlign:'center', fontWeight:800 }}
        />
        <span className="auth-field-hint">Check your SMS for "CM Village OTP: XXXXXX" 💬</span>
      </div>

      {error && <div className="auth-error" style={{ marginTop:8 }}>⚠️ {error}</div>}

      <button type="submit" className="auth-btn-primary" disabled={otpVerify || otp.length !== 6} style={{ marginTop:16 }}>
        {otpVerify ? <><span className="auth-spinner" /> Creating account…</> : '✅ Verify & Create Account'}
      </button>

      <div style={{ marginTop:12, textAlign:'center' }}>
        <button type="button" onClick={handleResend}
          style={{ background:'none', border:'none', color:'#1a6b3c', fontSize:'0.83rem', cursor:'pointer', textDecoration:'underline', fontWeight:600 }}>
          Didn't receive OTP? Resend
        </button>
      </div>
    </form>
  );
}

/* ───────────── Email Registration ───────────── */
function EmailRegister({ onSuccess }) {
  const { signUp, signInWithGoogle, logout } = useAuth();
  const navigate = useNavigate();

  const [form,     setForm]     = useState({ fullName: '', familyName: '', ward: '', mobile: '', email: '', password: '', confirm: '' });
  const [showPw,   setShowPw]   = useState(false);
  const [error,    setError]    = useState('');
  const [errors,   setErrors]   = useState({});
  const [loading,  setLoading]  = useState(false);
  const [gLoading, setGLoading] = useState(false);

  function set(field, val) {
    setForm(f => ({ ...f, [field]: val }));
    if (errors[field]) setErrors(e => ({ ...e, [field]: '' }));
    setError('');
  }

  function validate() {
    const e = {};
    if (!form.fullName.trim()) e.fullName = 'Full name is required';
    if (!form.mobile.trim())   e.mobile   = 'Mobile number is required';
    else if (!/^\d{10}$/.test(form.mobile.replace(/\s/g,''))) e.mobile = 'Enter a valid 10-digit mobile number';
    if (!form.email.trim())    e.email    = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.password)        e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'Password must be at least 6 characters';
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match';
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setError(''); setLoading(true);
    let cred = null;
    try {
      const mobileClean = form.mobile.trim();
      const q = await getDocs(query(collection(db,'users'), where('mobile','==', mobileClean)));
      if (!q.empty) {
        setError('This mobile number is already registered. Please use a different number or sign in.');
        setLoading(false);
        return;
      }

      cred = await signUp(form.email.trim(), form.password, form.fullName.trim(), {
        familyName: form.familyName.trim(),
        ward:       form.ward,
        mobile:     mobileClean,
      });

      const uid = cred.user.uid;
      await setDoc(doc(db,'users', uid), {
        name:       form.fullName.trim(),
        familyName: form.familyName.trim(),
        ward:       form.ward,
        mobile:     mobileClean,
        email:      form.email.trim(),
        loginType:  'email',
        status:     'approved',
        createdAt:  serverTimestamp(),
      });

      try {
        await addDoc(collection(db,'families'), {
          head:      form.fullName.trim(),
          spouse:    '',
          address:   form.ward ? `${form.ward}, Chinamanapuram` : 'Chinamanapuram',
          phone:     mobileClean,
          members:   1,
          since:     new Date().getFullYear(),
          photo:     '',
          userId:    uid,
          createdAt: serverTimestamp(),
        });
      } catch (_) {}

      navigate('/');

    } catch (err) {
      if (cred) { try { await logout(); } catch (_) {} }
      switch (err.code) {
        case 'auth/email-already-in-use':   setError('This email is already registered. Please sign in instead.'); break;
        case 'auth/invalid-email':          setError('Please enter a valid email address.'); break;
        case 'auth/weak-password':          setError('Password should be at least 6 characters.'); break;
        case 'auth/too-many-requests':      setError('Too many attempts. Please wait and try again.'); break;
        case 'auth/network-request-failed': setError('Network error. Please check your connection.'); break;
        default:                            setError('Registration failed. Please try again.');
      }
    }
    setLoading(false);
  }

  async function handleGoogle() {
    setError(''); setGLoading(true);
    try {
      const cred = await signInWithGoogle();
      const uid  = cred.user.uid;
      const snap = await getDoc(doc(db,'users', uid));
      if (!snap.exists()) {
        await setDoc(doc(db,'users', uid), {
          name:      cred.user.displayName || '',
          email:     cred.user.email || '',
          mobile:    '',
          loginType: 'google',
          status:    'approved',
          createdAt: serverTimestamp(),
        });
        try {
          await addDoc(collection(db,'families'), {
            head:      cred.user.displayName || cred.user.email?.split('@')[0] || 'Villager',
            spouse:    '',
            address:   'Chinamanapuram',
            phone:     '',
            members:   1,
            since:     new Date().getFullYear(),
            photo:     cred.user.photoURL || '',
            userId:    uid,
            createdAt: serverTimestamp(),
          });
        } catch (_) {}
      }
      navigate('/');
    } catch (err) {
      switch (err.code) {
        case 'auth/popup-closed-by-user':
        case 'auth/cancelled-popup-request': break;
        case 'auth/popup-blocked':           setError('Popup was blocked. Please allow popups and try again.'); break;
        case 'auth/unauthorized-domain':     setError('Google sign-in is not configured for this domain. Please use Mobile OTP.'); break;
        default:                             setError('Google sign-up failed. Please use Mobile OTP instead.');
      }
    }
    setGLoading(false);
  }

  return (
    <div>
      <button className="auth-btn-google" onClick={handleGoogle} disabled={gLoading || loading} type="button">
        {gLoading ? <span className="auth-spinner" /> : (
          <svg className="auth-google-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
        )}
        {gLoading ? 'Signing up…' : 'Sign up with Google'}
      </button>

      <div className="auth-divider"><span>or register with email</span></div>
      {error && <div className="auth-error">⚠️ {error}</div>}

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <div className="auth-form-grid">

          <div className="auth-field auth-field-full">
            <label className="auth-label">Full Name <span className="auth-req">*</span></label>
            <input className={`auth-input${errors.fullName ? ' auth-input-err' : ''}`} type="text"
              value={form.fullName} onChange={e => set('fullName', e.target.value)}
              placeholder="e.g. Venkata Raju" autoFocus disabled={loading} />
            {errors.fullName && <span className="auth-field-err">{errors.fullName}</span>}
          </div>

          <div className="auth-field">
            <label className="auth-label">Family / Surname <span className="auth-opt">(optional)</span></label>
            <input className="auth-input" type="text" value={form.familyName}
              onChange={e => set('familyName', e.target.value)} placeholder="e.g. Rao" disabled={loading} />
          </div>

          <div className="auth-field">
            <label className="auth-label">Village Ward <span className="auth-opt">(optional)</span></label>
            <select className="auth-input auth-select" value={form.ward}
              onChange={e => set('ward', e.target.value)} disabled={loading}>
              <option value="">Select your ward…</option>
              {WARDS.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>

          <div className="auth-field">
            <label className="auth-label">Mobile Number <span className="auth-req">*</span></label>
            <input className={`auth-input${errors.mobile ? ' auth-input-err' : ''}`} type="tel"
              value={form.mobile} onChange={e => set('mobile', e.target.value)}
              placeholder="e.g. 9440512345" disabled={loading} />
            {errors.mobile && <span className="auth-field-err">{errors.mobile}</span>}
          </div>

          <div className="auth-field auth-field-full">
            <label className="auth-label">Email Address <span className="auth-req">*</span></label>
            <input className={`auth-input${errors.email ? ' auth-input-err' : ''}`} type="email"
              value={form.email} onChange={e => set('email', e.target.value)}
              placeholder="you@example.com" autoComplete="email" disabled={loading} />
            {errors.email && <span className="auth-field-err">{errors.email}</span>}
          </div>

          <div className="auth-field">
            <label className="auth-label">Password <span className="auth-req">*</span></label>
            <div className="auth-pw-wrap">
              <input className={`auth-input auth-pw-input${errors.password ? ' auth-input-err' : ''}`}
                type={showPw ? 'text' : 'password'} value={form.password}
                onChange={e => set('password', e.target.value)}
                placeholder="Min. 6 characters" autoComplete="new-password" disabled={loading} />
              <button type="button" className="auth-pw-toggle" onClick={() => setShowPw(v => !v)} tabIndex={-1}>
                {showPw ? '🙈' : '👁️'}
              </button>
            </div>
            {errors.password && <span className="auth-field-err">{errors.password}</span>}
          </div>

          <div className="auth-field">
            <label className="auth-label">Confirm Password <span className="auth-req">*</span></label>
            <input className={`auth-input${errors.confirm ? ' auth-input-err' : ''}`}
              type={showPw ? 'text' : 'password'} value={form.confirm}
              onChange={e => set('confirm', e.target.value)}
              placeholder="Repeat your password" autoComplete="new-password" disabled={loading} />
            {errors.confirm && <span className="auth-field-err">{errors.confirm}</span>}
          </div>

        </div>

        <button type="submit" className="auth-btn-primary" disabled={loading || gLoading}>
          {loading ? <><span className="auth-spinner" /> Creating account…</> : '🚀 Create Account'}
        </button>
      </form>
    </div>
  );
}

/* ───────────── Main Register Page ───────────── */
export default function Register() {
  const location  = useLocation();
  const [regTab,    setRegTab]    = useState('mobile');
  const [submitted, setSubmitted] = useState(false);
  const [userData,  setUserData]  = useState(null);

  /* Pre-fill phone if redirected from Login after OTP (new user) */
  const prefillPhone = location.state?.phone || '';
  const prefillUid   = location.state?.uid   || null;

  function handleSuccess(data) {
    setUserData(data);
    setSubmitted(true);
  }

  /* ── Success screen ── */
  if (submitted && userData) {
    return (
      <div className="auth-page">
        <Navbar />
        <div className="auth-container">
          <div className="auth-card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: 12 }}>⏳</div>
            <h2 style={{ color: 'var(--primary)', marginBottom: 8 }}>Request Submitted!</h2>
            <p style={{ color: 'var(--text-mid)', marginBottom: 20, lineHeight: 1.7 }}>
              Hi <strong>{userData.name}</strong>, your registration is submitted!
              You can login once the Sarpanch / Admin approves your account.
            </p>

            <div className="reg-pending-box">
              <div className="reg-pending-step">
                <span className="reg-step-num">1</span>
                <span>Registration submitted ✅</span>
              </div>
              <div className="reg-pending-step">
                <span className="reg-step-num">2</span>
                <span>Admin reviews and approves ⏳</span>
              </div>
              <div className="reg-pending-step">
                <span className="reg-step-num">3</span>
                <span>You get WhatsApp notification ✅</span>
              </div>
              <div className="reg-pending-step">
                <span className="reg-step-num">4</span>
                <span>Login with Mobile OTP 🎉</span>
              </div>
            </div>

            {userData.hasAdminPhone && (
              <>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-mid)', margin: '16px 0 8px' }}>
                  Notify the Admin on WhatsApp:
                </p>
                <button className="reg-whatsapp-btn"
                  onClick={() => openWhatsApp(userData.adminPhone, userData.adminMsg)}>
                  📲 Notify Admin on WhatsApp
                </button>
              </>
            )}

            <div style={{ marginTop: 20 }}>
              <Link to="/login" className="auth-btn-primary" style={{ display:'inline-block', textDecoration:'none', padding:'12px 32px', borderRadius:12 }}>
                Go to Login →
              </Link>
            </div>
          </div>
          <div className="auth-village-badge">
            🌾 Chinamanapuram · Gantyada Mandal · Vizianagaram District
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <Navbar />
      <div className="auth-container">
        <div className="auth-card auth-card-lg">
          <div className="auth-header">
            <div className="auth-logo">🏘️</div>
            <h1 className="auth-title">Join the Portal</h1>
            <p className="auth-sub">Create your Chinamanapuram Village account</p>
          </div>

          {/* Registration type tabs */}
          <div style={{ display:'flex', gap:0, marginBottom:24, border:'1.5px solid #e5e7eb', borderRadius:12, overflow:'hidden' }}>
            <button type="button"
              onClick={() => setRegTab('mobile')}
              style={{ flex:1, padding:'10px 0', border:'none', fontWeight:700, fontSize:'0.88rem', cursor:'pointer', transition:'all 0.2s',
                background: regTab==='mobile' ? '#1a6b3c' : '#fff',
                color: regTab==='mobile' ? '#fff' : '#555',
              }}>
              📱 Mobile OTP
            </button>
            <button type="button"
              onClick={() => setRegTab('email')}
              style={{ flex:1, padding:'10px 0', border:'none', fontWeight:700, fontSize:'0.88rem', cursor:'pointer', transition:'all 0.2s',
                background: regTab==='email' ? '#1a6b3c' : '#fff',
                color: regTab==='email' ? '#fff' : '#555',
                borderLeft:'1px solid #e5e7eb',
              }}>
              📧 Email
            </button>
          </div>

          {regTab === 'mobile' && (
            <div>
              <div style={{ background:'#fffbeb', border:'1px solid #fde68a', borderRadius:10, padding:'10px 14px', marginBottom:18, fontSize:'0.83rem', color:'#92400e' }}>
                💬 <strong>Quick SMS OTP:</strong> Enter your mobile number to receive "CM Village OTP: XXXXXX" via SMS. No PIN needed!
              </div>
              <MobileRegister onSuccess={handleSuccess} prefillPhone={prefillPhone} prefillUid={prefillUid} />
            </div>
          )}

          {regTab === 'email' && (
            <EmailRegister onSuccess={handleSuccess} />
          )}

          <div className="auth-card-footer">
            <p>Already have an account? <Link to="/login" className="auth-link">Sign in here</Link></p>
          </div>
        </div>
        <div className="auth-village-badge">
          🌾 Chinamanapuram · Gantyada Mandal · Vizianagaram District
        </div>
      </div>
    </div>
  );
}

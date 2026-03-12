import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { auth, db } from '../firebase';
import { signInWithPhoneNumber, RecaptchaVerifier } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

const ADMIN_EMAILS  = ['admin@chinamanapuram.com'];
const ADMIN_PHONES  = ['8187038358'];

export default function Login() {
  const { signIn, signInWithGoogle, logout } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const from      = location.state?.from || '/';
  const justLoggedOut = location.state?.loggedOut === true;

  /* Tab: 'email' | 'otp' */
  const [tab, setTab] = useState('otp');

  /* ── Email/Password state ── */
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [gLoading, setGLoading] = useState(false);

  /* ── OTP state ── */
  const [phone,     setPhone]     = useState('');
  const [otp,       setOtp]       = useState('');
  const [otpSent,   setOtpSent]   = useState(false);
  const [otpLoading,setOtpLoading]= useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resendSecs,setResendSecs]= useState(0);
  const confirmRef  = useRef(null);
  const recaptchaRef= useRef(null);
  const timerRef    = useRef(null);

  /* ── Shared error ── */
  const [error, setError] = useState('');

  /* Cleanup reCAPTCHA on unmount */
  useEffect(() => {
    return () => {
      timerRef.current && clearInterval(timerRef.current);
      if (recaptchaRef.current) {
        try { recaptchaRef.current.clear(); } catch(_) {}
        recaptchaRef.current = null;
      }
    };
  }, []);

  /* ── Helpers ── */
  async function checkUserStatus(uid) {
    try {
      const snap = await getDoc(doc(db, 'users', uid));
      if (snap.exists()) return snap.data().status || 'approved';
    } catch (_) {}
    return 'approved';
  }

  function startResendTimer() {
    setResendSecs(60);
    timerRef.current = setInterval(() => {
      setResendSecs(s => {
        if (s <= 1) { clearInterval(timerRef.current); return 0; }
        return s - 1;
      });
    }, 1000);
  }

  function friendlyPhoneError(code) {
    switch (code) {
      case 'auth/invalid-phone-number':   return 'Invalid phone number. Enter a valid 10-digit number.';
      case 'auth/too-many-requests':      return 'Too many OTP requests. Please wait and try again.';
      case 'auth/invalid-verification-code': return 'Wrong OTP. Please check and try again.';
      case 'auth/code-expired':           return 'OTP has expired. Please request a new one.';
      case 'auth/missing-phone-number':   return 'Please enter your mobile number.';
      case 'auth/quota-exceeded':         return 'SMS quota exceeded. Please try again later.';
      case 'auth/operation-not-allowed':  return 'Phone login is not enabled. Please contact admin.';
      default: return 'OTP failed. Please try again.';
    }
  }

  function friendlyEmailError(code) {
    switch (code) {
      case 'auth/user-not-found':      return 'No account found with this email.';
      case 'auth/wrong-password':      return 'Incorrect password. Please try again.';
      case 'auth/invalid-email':       return 'Please enter a valid email address.';
      case 'auth/too-many-requests':   return 'Too many attempts. Please try again later.';
      case 'auth/invalid-credential':  return 'Invalid email or password.';
      default:                         return 'Login failed. Please try again.';
    }
  }

  function friendlyGoogleError(code) {
    switch (code) {
      case 'auth/popup-closed-by-user':    return '';
      case 'auth/popup-blocked':           return 'Popup was blocked. Please allow popups and try again.';
      case 'auth/unauthorized-domain':     return 'Google sign-in not enabled for this domain. Use Mobile OTP instead.';
      case 'auth/cancelled-popup-request': return '';
      default: return 'Google sign-in failed. Please use Mobile OTP instead.';
    }
  }

  /* ── Send OTP ── */
  async function handleSendOtp(e) {
    e.preventDefault();
    const cleaned = phone.replace(/\s/g, '');
    if (!/^\d{10}$/.test(cleaned)) {
      setError('Enter a valid 10-digit mobile number.');
      return;
    }
    setError('');
    setOtpLoading(true);

    try {
      /* Init invisible reCAPTCHA */
      if (!recaptchaRef.current) {
        recaptchaRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
          callback: () => {},
          'expired-callback': () => { recaptchaRef.current = null; },
        });
        await recaptchaRef.current.render();
      }

      const fullPhone = '+91' + cleaned;
      const result = await signInWithPhoneNumber(auth, fullPhone, recaptchaRef.current);
      confirmRef.current = result;
      setOtpSent(true);
      startResendTimer();
    } catch (err) {
      setError(friendlyPhoneError(err.code));
      /* Reset reCAPTCHA on error */
      if (recaptchaRef.current) {
        try { recaptchaRef.current.clear(); } catch(_) {}
        recaptchaRef.current = null;
      }
    }
    setOtpLoading(false);
  }

  /* ── Resend OTP ── */
  async function handleResend() {
    if (recaptchaRef.current) {
      try { recaptchaRef.current.clear(); } catch(_) {}
      recaptchaRef.current = null;
    }
    setOtpSent(false);
    setOtp('');
    setError('');
  }

  /* ── Verify OTP ── */
  async function handleVerifyOtp(e) {
    e.preventDefault();
    if (otp.length !== 6) { setError('Enter the 6-digit OTP.'); return; }
    setError('');
    setVerifying(true);
    try {
      const cred = await confirmRef.current.confirm(otp);
      const user = cred.user;

      /* Admin phone bypasses status check */
      if (!ADMIN_PHONES.includes(phone.replace(/\s/g, ''))) {
        const status = await checkUserStatus(user.uid);
        if (status === 'pending') {
          await logout();
          setError('⏳ Your account is pending admin approval. You will be notified via WhatsApp once approved.');
          setVerifying(false);
          return;
        }
        if (status === 'rejected') {
          await logout();
          setError('❌ Your registration was not approved. Please contact the Panchayat office.');
          setVerifying(false);
          return;
        }
        /* New phone user — check if registered in village portal */
        if (status === 'approved') {
          /* Check users collection by phone */
          const q = query(collection(db,'users'), where('mobile','==', phone.replace(/\s/g,'')));
          const snap = await getDocs(q);
          if (snap.empty) {
            /* Not registered — send to register */
            await logout();
            navigate('/register', { state: { phonePreFill: phone.replace(/\s/g,'') } });
            return;
          }
        }
      }

      navigate(from, { replace: true });
    } catch (err) {
      setError(friendlyPhoneError(err.code));
    }
    setVerifying(false);
  }

  /* ── Email submit ── */
  async function handleEmailSubmit(e) {
    e.preventDefault();
    if (!email.trim() || !password) { setError('Please fill in all fields.'); return; }
    setError('');
    setLoading(true);
    try {
      const cred = await signIn(email.trim(), password);
      if (!ADMIN_EMAILS.includes(email.trim())) {
        const status = await checkUserStatus(cred.user.uid);
        if (status === 'pending') {
          await logout();
          setError('⏳ Your account is pending admin approval.');
          return;
        }
        if (status === 'rejected') {
          await logout();
          setError('❌ Your registration was not approved. Contact the Panchayat office.');
          return;
        }
      }
      navigate(from, { replace: true });
    } catch (err) {
      setError(friendlyEmailError(err.code));
    }
    setLoading(false);
  }

  /* ── Google ── */
  async function handleGoogle() {
    setError('');
    setGLoading(true);
    try {
      const cred = await signInWithGoogle();
      if (!ADMIN_EMAILS.includes(cred.user.email)) {
        const status = await checkUserStatus(cred.user.uid);
        if (status === 'pending') { await logout(); setError('⏳ Pending admin approval.'); return; }
        if (status === 'rejected') { await logout(); setError('❌ Registration not approved.'); return; }
      }
      navigate(from, { replace: true });
    } catch (err) {
      const msg = friendlyGoogleError(err.code);
      if (msg) setError(msg);
    }
    setGLoading(false);
  }

  /* ── OTP input auto-advance ── */
  function handleOtpChange(val) {
    if (/^\d{0,6}$/.test(val)) setOtp(val);
  }

  return (
    <div className="auth-page">
      <Navbar />
      {/* Invisible reCAPTCHA container */}
      <div id="recaptcha-container" style={{ position: 'absolute', bottom: 0, left: 0, zIndex: -1 }} />

      <div className="auth-container">
        <div className="auth-card">

          {/* Signed-out notice */}
          {justLoggedOut && (
            <div style={{ background:'#f0fdf4', border:'1px solid #86efac', borderRadius:10, padding:'10px 16px', marginBottom:16, color:'#166534', fontSize:'0.88rem', textAlign:'center' }}>
              ✅ You have been signed out successfully.
            </div>
          )}

          {/* Header */}
          <div className="auth-header">
            <div className="auth-logo">🏘️</div>
            <h1 className="auth-title">Welcome Back</h1>
            <p className="auth-sub">Sign in to Chinamanapuram Village Portal</p>
          </div>

          {/* Tab switcher */}
          <div style={{ display:'flex', gap:0, marginBottom:20, border:'1.5px solid #e5e7eb', borderRadius:12, overflow:'hidden' }}>
            <button type="button"
              onClick={() => { setTab('otp'); setError(''); }}
              style={{ flex:1, padding:'10px 0', border:'none', fontWeight:700, fontSize:'0.88rem', cursor:'pointer', transition:'all 0.2s',
                background: tab==='otp' ? '#1a6b3c' : '#fff',
                color: tab==='otp' ? '#fff' : '#555',
              }}>
              📱 Mobile OTP
            </button>
            <button type="button"
              onClick={() => { setTab('email'); setError(''); }}
              style={{ flex:1, padding:'10px 0', border:'none', fontWeight:700, fontSize:'0.88rem', cursor:'pointer', transition:'all 0.2s',
                background: tab==='email' ? '#1a6b3c' : '#fff',
                color: tab==='email' ? '#fff' : '#555',
                borderLeft:'1px solid #e5e7eb',
              }}>
              📧 Email
            </button>
          </div>

          {/* Error */}
          {error && <div className="auth-error" style={{ marginBottom:14 }}>⚠️ {error}</div>}

          {/* ── OTP TAB ── */}
          {tab === 'otp' && (
            <div>
              {!otpSent ? (
                /* Step 1: Enter phone */
                <form onSubmit={handleSendOtp}>
                  <div className="auth-field">
                    <label className="auth-label">Mobile Number</label>
                    <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                      <div style={{ background:'#f3f4f6', border:'1.5px solid #e5e7eb', borderRadius:9, padding:'10px 12px', fontWeight:700, color:'#555', fontSize:'0.9rem', flexShrink:0 }}>
                        🇮🇳 +91
                      </div>
                      <input
                        className="auth-input"
                        type="tel"
                        value={phone}
                        onChange={e => { setPhone(e.target.value.replace(/\D/g,'')); setError(''); }}
                        placeholder="10-digit mobile number"
                        maxLength={10}
                        autoFocus
                        disabled={otpLoading}
                        style={{ flex:1 }}
                      />
                    </div>
                    <span className="auth-field-hint">Enter your 10-digit mobile number (e.g. 9876543210)</span>
                  </div>
                  <button type="submit" className="auth-btn-primary" disabled={otpLoading || phone.length !== 10}>
                    {otpLoading ? <><span className="auth-spinner" /> Sending OTP…</> : '📨 Send OTP'}
                  </button>
                </form>
              ) : (
                /* Step 2: Enter OTP */
                <form onSubmit={handleVerifyOtp}>
                  {/* Phone display */}
                  <div style={{ background:'#f0fdf4', border:'1px solid #86efac', borderRadius:10, padding:'10px 14px', marginBottom:16, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <span style={{ fontSize:'0.85rem', color:'#166534', fontWeight:600 }}>
                      📱 OTP sent to +91 {phone}
                    </span>
                    <button type="button" onClick={handleResend}
                      style={{ background:'none', border:'none', color:'#1a6b3c', fontSize:'0.8rem', cursor:'pointer', fontWeight:700, textDecoration:'underline' }}>
                      Change
                    </button>
                  </div>

                  <div className="auth-field">
                    <label className="auth-label">Enter 6-Digit OTP</label>
                    <input
                      className="auth-input"
                      type="text"
                      inputMode="numeric"
                      value={otp}
                      onChange={e => handleOtpChange(e.target.value)}
                      placeholder="• • • • • •"
                      maxLength={6}
                      autoFocus
                      disabled={verifying}
                      style={{ fontSize:'1.4rem', letterSpacing:'0.4em', textAlign:'center', fontWeight:800 }}
                    />
                    <span className="auth-field-hint">
                      {resendSecs > 0
                        ? `Resend OTP in ${resendSecs}s`
                        : <button type="button" onClick={handleResend} style={{ background:'none', border:'none', color:'#1a6b3c', cursor:'pointer', fontWeight:700, fontSize:'0.82rem', padding:0 }}>Resend OTP</button>
                      }
                    </span>
                  </div>

                  <button type="submit" className="auth-btn-primary" disabled={verifying || otp.length !== 6}>
                    {verifying ? <><span className="auth-spinner" /> Verifying…</> : '✅ Verify & Login'}
                  </button>
                </form>
              )}

              {/* Divider */}
              <div className="auth-divider" style={{ margin:'20px 0 16px' }}><span>or continue with</span></div>

              {/* Google */}
              <button className="auth-btn-google" onClick={handleGoogle} disabled={gLoading} type="button">
                {gLoading ? <span className="auth-spinner" /> : (
                  <svg className="auth-google-icon" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
                {gLoading ? 'Signing in…' : 'Continue with Google'}
              </button>
            </div>
          )}

          {/* ── EMAIL TAB ── */}
          {tab === 'email' && (
            <div>
              {/* Google button */}
              <button className="auth-btn-google" onClick={handleGoogle} disabled={gLoading || loading} type="button">
                {gLoading ? <span className="auth-spinner" /> : (
                  <svg className="auth-google-icon" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
                {gLoading ? 'Signing in…' : 'Continue with Google'}
              </button>

              <div className="auth-divider"><span>or sign in with email</span></div>

              <form className="auth-form" onSubmit={handleEmailSubmit} noValidate>
                <div className="auth-field">
                  <label className="auth-label">Email Address</label>
                  <input className="auth-input" type="email" value={email}
                    onChange={e => { setEmail(e.target.value); setError(''); }}
                    placeholder="yourname@gmail.com" autoComplete="email" disabled={loading} />
                </div>
                <div className="auth-field">
                  <label className="auth-label">Password</label>
                  <div className="auth-pw-wrap">
                    <input className="auth-input auth-pw-input"
                      type={showPw ? 'text' : 'password'}
                      value={password}
                      onChange={e => { setPassword(e.target.value); setError(''); }}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      disabled={loading} />
                    <button type="button" className="auth-pw-toggle" onClick={() => setShowPw(v => !v)} tabIndex={-1}>
                      {showPw ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>
                <button type="submit" className="auth-btn-primary" disabled={loading || gLoading}>
                  {loading ? <><span className="auth-spinner" /> Signing in…</> : '🔐 Sign In'}
                </button>
              </form>
            </div>
          )}

          {/* Footer */}
          <div className="auth-card-footer">
            <p>Don't have an account?{' '}<Link to="/register" className="auth-link">Create one free</Link></p>
          </div>
        </div>

        <div className="auth-village-badge">
          🌾 Chinamanapuram · Gantyada Mandal · Vizianagaram District
        </div>
      </div>
    </div>
  );
}

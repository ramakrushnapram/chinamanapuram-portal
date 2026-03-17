 vcgfbcv 
pleplo
 

import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { auth, db } from '../firebase';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const ADMIN_EMAILS = ['admin@chinamanapuram.com'];

export default function Login() {
  const { signIn, signInWithGoogle, logout } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const from      = location.state?.from || '/';
  const justLoggedOut = location.state?.loggedOut === true;

  /* Tab: 'otp' | 'email' */
  const [tab, setTab] = useState('otp');

  /* ── Mobile OTP state ── */
  const [phone,       setPhone]       = useState('');
  const [otp,         setOtp]         = useState('');
  const [otpStep,     setOtpStep]     = useState(1); // 1: enter phone, 2: enter OTP
  const [otpSending,  setOtpSending]  = useState(false);
  const [otpVerify,   setOtpVerify]   = useState(false);
  const [confirmRes,  setConfirmRes]  = useState(null);
  const recaptchaRef = useRef(null);

  /* ── Email state ── */
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [gLoading, setGLoading] = useState(false);

  /* ── Shared error ── */
  const [error, setError] = useState('');

  /* Cleanup recaptcha on unmount */
  useEffect(() => {
    return () => {
      if (recaptchaRef.current) {
        try { recaptchaRef.current.clear(); } catch (_) {}
        recaptchaRef.current = null;
      }
    };
  }, []);

  function getRecaptcha() {
    if (recaptchaRef.current) return recaptchaRef.current;
    const v = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' });
    recaptchaRef.current = v;
    return v;
  }

  function clearRecaptcha() {
    if (recaptchaRef.current) {
      try { recaptchaRef.current.clear(); } catch (_) {}
      recaptchaRef.current = null;
    }
  }

  function friendlyOtpError(code) {
    switch (code) {
      case 'auth/invalid-phone-number':    return 'Invalid phone number. Please check and try again.';
      case 'auth/too-many-requests':       return 'Too many requests. Please wait and try again later.';
      case 'auth/quota-exceeded':          return 'SMS limit reached for today. Please try again tomorrow or use Email login.';
      case 'auth/captcha-check-failed':    return 'Security check failed. Please refresh the page and try again.';
      case 'auth/missing-phone-number':    return 'Please enter a valid mobile number.';
      case 'auth/operation-not-allowed':   return 'Phone login is not enabled. Please contact admin.';
      default:                             return 'Failed to send OTP. Please try again.';
    }
  }

  /* ── Send OTP ── */
  async function handleSendOtp(e) {
    e.preventDefault();
    const cleaned = phone.replace(/\s/g, '');
    if (!/^\d{10}$/.test(cleaned)) { setError('Enter a valid 10-digit mobile number.'); return; }
    setError('');
    setOtpSending(true);
    try {
      const verifier = getRecaptcha();
      const result = await signInWithPhoneNumber(auth, '+91' + cleaned, verifier);
      setConfirmRes(result);
      setOtpStep(2);
    } catch (err) {
      clearRecaptcha();
      setError(friendlyOtpError(err.code));
    }
    setOtpSending(false);
  }

  /* ── Verify OTP ── */
  async function handleVerifyOtp(e) {
    e.preventDefault();
    if (otp.length !== 6) { setError('Enter the 6-digit OTP sent to your mobile.'); return; }
    setError('');
    setOtpVerify(true);
    try {
      const cred = await confirmRes.confirm(otp);
      /* If user has no Firestore profile, redirect to register to complete it */
      const snap = await getDoc(doc(db, 'users', cred.user.uid));
      if (!snap.exists()) {
        navigate('/register', { state: { fromOtp: true, phone: phone.replace(/\s/g,''), uid: cred.user.uid } });
        return;
      }
      const status = snap.data().status || 'approved';
      if (status === 'rejected') {
        await logout();
        setError('Your registration was not approved. Please contact the Panchayat office.');
        setOtpVerify(false);
        return;
      }
      navigate(from, { replace: true });
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

  /* ── Resend OTP ── */
  async function handleResend() {
    setOtp('');
    setOtpStep(1);
    setError('');
    clearRecaptcha();
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
        const snap = await getDoc(doc(db, 'users', cred.user.uid));
        if (snap.exists() && snap.data().status === 'rejected') {
          await logout();
          setError('Your registration was not approved. Contact the Panchayat office.');
          setLoading(false);
          return;
        }
      }
      navigate(from, { replace: true });
    } catch (err) {
      switch (err.code) {
        case 'auth/user-not-found':
        case 'auth/invalid-credential': setError('No account found with this email.'); break;
        case 'auth/wrong-password':     setError('Incorrect password.'); break;
        case 'auth/invalid-email':      setError('Enter a valid email address.'); break;
        case 'auth/too-many-requests':  setError('Too many attempts. Please try again later.'); break;
        default:                        setError('Login failed. Please try again.');
      }
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
        const snap = await getDoc(doc(db, 'users', cred.user.uid));
        if (snap.exists()) {
          const status = snap.data().status;
          if (status === 'pending')  { await logout(); setError('⏳ Pending admin approval.'); setGLoading(false); return; }
          if (status === 'rejected') { await logout(); setError('Registration not approved.'); setGLoading(false); return; }
        }
      }
      navigate(from, { replace: true });
    } catch (err) {
      switch (err.code) {
        case 'auth/popup-closed-by-user':
        case 'auth/cancelled-popup-request': break;
        case 'auth/popup-blocked':           setError('Popup was blocked. Please allow popups and try again.'); break;
        case 'auth/unauthorized-domain':     setError('Google sign-in is not configured for this domain. Please use Mobile OTP.'); break;
        default:                             setError('Google sign-in failed. Please use Mobile OTP instead.');
      }
    }
    setGLoading(false);
  }

  return (
    <div className="auth-page">
      <Navbar />
      {/* Invisible recaptcha container */}
      <div id="recaptcha-container" />

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
              onClick={() => { setTab('otp'); setError(''); setOtpStep(1); setOtp(''); }}
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

          {/* ── MOBILE OTP TAB ── */}
          {tab === 'otp' && (
            <div>
              {otpStep === 1 ? (
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
                        style={{ flex:1 }}
                        disabled={otpSending}
                      />
                    </div>
                    <span className="auth-field-hint">You will receive a 6-digit OTP via SMS</span>
                  </div>
                  <button type="submit" className="auth-btn-primary" disabled={otpSending || phone.replace(/\s/g,'').length !== 10}>
                    {otpSending ? <><span className="auth-spinner" /> Sending OTP…</> : '📨 Send OTP'}
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
                      onChange={e => { if (/^\d{0,6}$/.test(e.target.value)) { setOtp(e.target.value); setError(''); } }}
                      placeholder="• • • • • •"
                      maxLength={6}
                      autoFocus
                      disabled={otpVerify}
                      style={{ fontSize:'1.6rem', letterSpacing:'0.5em', textAlign:'center', fontWeight:800 }}
                    />
                    <span className="auth-field-hint">Check your SMS inbox for the OTP</span>
                  </div>

                  <button type="submit" className="auth-btn-primary" disabled={otpVerify || otp.length !== 6}>
                    {otpVerify ? <><span className="auth-spinner" /> Verifying…</> : '🔐 Verify & Login'}
                  </button>

                  <div style={{ marginTop:12, textAlign:'center' }}>
                    <button type="button" onClick={handleResend}
                      style={{ background:'none', border:'none', color:'#1a6b3c', fontSize:'0.83rem', cursor:'pointer', textDecoration:'underline', fontWeight:600 }}>
                      Didn't receive OTP? Resend
                    </button>
                  </div>
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

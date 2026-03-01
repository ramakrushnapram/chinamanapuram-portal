import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

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

export default function Register() {
  const { signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName:   '',
    familyName: '',
    ward:       '',
    mobile:     '',
    email:      '',
    password:   '',
    confirm:    '',
  });
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
    if (!form.fullName.trim())    e.fullName = 'Full name is required';
    if (!form.email.trim())       e.email    = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.password)           e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'Password must be at least 6 characters';
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match';
    return e;
  }

  function friendlyError(code) {
    switch (code) {
      case 'auth/email-already-in-use': return 'This email is already registered. Please sign in.';
      case 'auth/invalid-email':        return 'Please enter a valid email address.';
      case 'auth/weak-password':        return 'Password should be at least 6 characters.';
      default:                          return 'Registration failed. Please try again.';
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setError('');
    setLoading(true);
    try {
      await signUp(form.email.trim(), form.password, form.fullName.trim(), {
        familyName: form.familyName.trim(),
        ward:       form.ward,
        mobile:     form.mobile.trim(),
      });
      navigate('/');
    } catch (err) {
      setError(friendlyError(err.code));
    } finally {
      setLoading(false);
    }
  }

  function friendlyGoogleError(code) {
    switch (code) {
      case 'auth/popup-closed-by-user':    return '';
      case 'auth/popup-blocked':           return 'Popup was blocked — please allow popups for this site in your browser settings, then try again.';
      case 'auth/unauthorized-domain':     return 'Domain not authorized in Firebase. Add chinamanapuram-portal.vercel.app to Firebase → Authentication → Settings → Authorized Domains.';
      case 'auth/operation-not-allowed':   return 'Google sign-in is not enabled in Firebase Console yet.';
      case 'auth/cancelled-popup-request': return '';
      default: return `Google sign-up failed (${code || 'unknown error'}). Please try again.`;
    }
  }

  async function handleGoogle() {
    setError('');
    setGLoading(true);
    try {
      await signInWithGoogle();
      navigate('/');
    } catch (err) {
      const msg = friendlyGoogleError(err.code);
      if (msg) setError(msg);
    } finally {
      setGLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <Navbar />

      <div className="auth-container">
        <div className="auth-card auth-card-lg">
          {/* Header */}
          <div className="auth-header">
            <div className="auth-logo">🏘️</div>
            <h1 className="auth-title">Join the Portal</h1>
            <p className="auth-sub">Create your Chinamanapuram Village account</p>
          </div>

          {/* Google button */}
          <button
            className="auth-btn-google"
            onClick={handleGoogle}
            disabled={gLoading || loading}
            type="button"
          >
            {gLoading ? (
              <span className="auth-spinner" />
            ) : (
              <svg className="auth-google-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            {gLoading ? 'Signing up…' : 'Sign up with Google'}
          </button>

          {/* Divider */}
          <div className="auth-divider"><span>or register with email</span></div>

          {/* Error */}
          {error && <div className="auth-error">⚠️ {error}</div>}

          {/* Form */}
          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="auth-form-grid">

              {/* Full Name */}
              <div className="auth-field auth-field-full">
                <label className="auth-label">Full Name <span className="auth-req">*</span></label>
                <input
                  className={`auth-input${errors.fullName ? ' auth-input-err' : ''}`}
                  type="text"
                  value={form.fullName}
                  onChange={e => set('fullName', e.target.value)}
                  placeholder="e.g. Venkata Raju"
                  autoFocus
                  disabled={loading}
                />
                {errors.fullName && <span className="auth-field-err">{errors.fullName}</span>}
              </div>

              {/* Family Name */}
              <div className="auth-field">
                <label className="auth-label">Family / Surname <span className="auth-opt">(optional)</span></label>
                <input
                  className="auth-input"
                  type="text"
                  value={form.familyName}
                  onChange={e => set('familyName', e.target.value)}
                  placeholder="e.g. Rao"
                  disabled={loading}
                />
              </div>

              {/* Ward */}
              <div className="auth-field">
                <label className="auth-label">Village Ward <span className="auth-opt">(optional)</span></label>
                <select
                  className="auth-input auth-select"
                  value={form.ward}
                  onChange={e => set('ward', e.target.value)}
                  disabled={loading}
                >
                  <option value="">Select your ward…</option>
                  {WARDS.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
              </div>

              {/* Mobile */}
              <div className="auth-field">
                <label className="auth-label">Mobile Number <span className="auth-opt">(optional)</span></label>
                <input
                  className="auth-input"
                  type="tel"
                  value={form.mobile}
                  onChange={e => set('mobile', e.target.value)}
                  placeholder="e.g. 94405 12345"
                  disabled={loading}
                />
              </div>

              {/* Email */}
              <div className="auth-field auth-field-full">
                <label className="auth-label">Email Address <span className="auth-req">*</span></label>
                <input
                  className={`auth-input${errors.email ? ' auth-input-err' : ''}`}
                  type="email"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  disabled={loading}
                />
                {errors.email && <span className="auth-field-err">{errors.email}</span>}
              </div>

              {/* Password */}
              <div className="auth-field">
                <label className="auth-label">Password <span className="auth-req">*</span></label>
                <div className="auth-pw-wrap">
                  <input
                    className={`auth-input auth-pw-input${errors.password ? ' auth-input-err' : ''}`}
                    type={showPw ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => set('password', e.target.value)}
                    placeholder="Min. 6 characters"
                    autoComplete="new-password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="auth-pw-toggle"
                    onClick={() => setShowPw(v => !v)}
                    tabIndex={-1}
                  >{showPw ? '🙈' : '👁️'}</button>
                </div>
                {errors.password && <span className="auth-field-err">{errors.password}</span>}
              </div>

              {/* Confirm Password */}
              <div className="auth-field">
                <label className="auth-label">Confirm Password <span className="auth-req">*</span></label>
                <input
                  className={`auth-input${errors.confirm ? ' auth-input-err' : ''}`}
                  type={showPw ? 'text' : 'password'}
                  value={form.confirm}
                  onChange={e => set('confirm', e.target.value)}
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                  disabled={loading}
                />
                {errors.confirm && <span className="auth-field-err">{errors.confirm}</span>}
              </div>

            </div>

            <button
              type="submit"
              className="auth-btn-primary"
              disabled={loading || gLoading}
            >
              {loading ? <><span className="auth-spinner" /> Creating account…</> : '🚀 Create Account'}
            </button>
          </form>

          {/* Footer */}
          <div className="auth-card-footer">
            <p>
              Already have an account?{' '}
              <Link to="/login" className="auth-link">Sign in here</Link>
            </p>
          </div>
        </div>

        <div className="auth-village-badge">
          🌾 Chinamanapuram · Gantyada Mandal · Vizianagaram District
        </div>
      </div>
    </div>
  );
}

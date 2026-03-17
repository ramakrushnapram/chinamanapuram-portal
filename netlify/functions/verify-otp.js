/* ── Verify OTP → Return Firebase custom token ── */
const crypto = require('crypto');
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

function getAdminApp() {
  if (getApps().length) return getApps()[0];
  const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
  return initializeApp({ credential: cert(sa) });
}

/* Verify a signed session token created by send-otp.js (Fast2SMS path) */
function verifySignedSession(sessionId, otp, phone, secret) {
  const parts = sessionId.split('.');
  if (parts.length !== 2) return { ok: false };

  const [payload, sig] = parts;
  const expectedSig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  if (sig !== expectedSig) return { ok: false, error: 'Invalid session' };

  let data;
  try { data = JSON.parse(Buffer.from(payload, 'base64url').toString()); } catch (_) {
    return { ok: false, error: 'Malformed session' };
  }

  if (data.phone !== phone)       return { ok: false, error: 'Phone mismatch' };
  if (Date.now() > data.exp)      return { ok: false, error: 'OTP expired. Please request a new one.' };
  if (data.otp !== String(otp))   return { ok: false, error: 'Invalid OTP. Please try again.' };

  return { ok: true };
}

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST')    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  let phone, otp, sessionId;
  try { ({ phone, otp, sessionId } = JSON.parse(event.body || '{}')); } catch (_) {}

  if (!phone || !otp || !sessionId) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing fields' }) };
  }

  const otpSecret = process.env.OTP_SECRET || 'cm-village-otp-secret-2024';

  try {
    /* ── Path A: Signed session (Fast2SMS) — sessionId contains a "." ── */
    if (sessionId.includes('.')) {
      const result = verifySignedSession(sessionId, otp, phone, otpSecret);
      if (!result.ok) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: result.error || 'Invalid OTP' }) };
      }
    } else {
      /* ── Path B: 2Factor.in Voice OTP ── */
      const apiKey = process.env.TWOFACTOR_API_KEY;
      if (!apiKey) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'SMS service not configured' }) };
      }

      const res  = await fetch(`https://2factor.in/API/V1/${apiKey}/SMS/VERIFY/${sessionId}/${otp}`);
      const data = await res.json();

      if (data.Status !== 'Success') {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid OTP. Please try again.' }) };
      }
    }

    /* ── Create Firebase custom token ── */
    const app   = getAdminApp();
    const auth  = getAuth(app);
    const uid   = `phone_91${phone}`;
    const token = await auth.createCustomToken(uid, { phone: `+91${phone}` });

    return { statusCode: 200, headers, body: JSON.stringify({ token, uid }) };
  } catch (err) {
    console.error('verify-otp error:', err.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Verification error: ' + err.message }) };
  }
};

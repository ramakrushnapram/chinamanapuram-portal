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

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

  const { phone, otp, sessionId } = req.body || {};

  if (!phone || !otp || !sessionId) {
    res.status(400).json({ error: 'Missing fields' });
    return;
  }

  const otpSecret = process.env.OTP_SECRET || 'cm-village-otp-secret-2024';

  try {
    /* ── Path A: Signed session (Fast2SMS) — sessionId contains a "." ── */
    if (sessionId.includes('.')) {
      const result = verifySignedSession(sessionId, otp, phone, otpSecret);
      if (!result.ok) {
        res.status(400).json({ error: result.error || 'Invalid OTP' });
        return;
      }
    } else {
      /* ── Path B: 2Factor.in Voice OTP ── */
      const apiKey = process.env.TWOFACTOR_API_KEY;
      if (!apiKey) {
        res.status(500).json({ error: 'SMS service not configured' });
        return;
      }

      const tfRes  = await fetch(`https://2factor.in/API/V1/${apiKey}/SMS/VERIFY/${sessionId}/${otp}`);
      const data   = await tfRes.json();

      if (data.Status !== 'Success') {
        res.status(400).json({ error: 'Invalid OTP. Please try again.' });
        return;
      }
    }

    /* ── Create Firebase custom token ── */
    const app   = getAdminApp();
    const auth  = getAuth(app);
    const uid   = `phone_91${phone}`;
    const token = await auth.createCustomToken(uid, { phone: `+91${phone}` });

    res.status(200).json({ token, uid });
  } catch (err) {
    console.error('verify-otp error:', err.message);
    res.status(500).json({ error: 'Verification error: ' + err.message });
  }
};

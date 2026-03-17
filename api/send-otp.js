/* ── Send OTP: Fast2SMS (branded SMS, no DLT) OR 2Factor Voice fallback ── */
const crypto = require('crypto');

function generateOTP() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/* Sign an OTP session so verify-otp.js can check it without a database */
function signSession(phone, otp, secret) {
  const payload = Buffer.from(JSON.stringify({
    phone,
    otp,
    exp: Date.now() + 10 * 60 * 1000,   // valid 10 minutes
  })).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return `${payload}.${sig}`;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

  const { phone } = req.body || {};

  if (!phone || !/^\d{10}$/.test(phone)) {
    res.status(400).json({ error: 'Invalid phone number' });
    return;
  }

  const fast2smsKey = process.env.FAST2SMS_API_KEY;
  const otpSecret   = process.env.OTP_SECRET || 'cm-village-otp-secret-2024';

  /* ── Option 1: Fast2SMS Quick SMS (custom message, no DLT required) ── */
  if (fast2smsKey) {
    try {
      const otp = generateOTP();
      const message = `CM Village OTP: ${otp}. Valid 10 mins. Do not share.`;

      const smsRes = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorization: fast2smsKey,
          message,
          language: 'english',
          route: 'q',
          numbers: phone,
        }),
      });
      const data = await smsRes.json();
      console.log('Fast2SMS response:', JSON.stringify(data));

      if (data.return === true || data.return === 'true') {
        const sessionId = signSession(phone, otp, otpSecret);
        res.status(200).json({ sessionId, method: 'sms' });
        return;
      }
      console.warn('Fast2SMS failed:', data.message || JSON.stringify(data));
      /* fall through to voice */
    } catch (err) {
      console.warn('Fast2SMS error:', err.message);
    }
  }

  /* ── Option 2: 2Factor.in Voice OTP (no DLT, always works) ── */
  const twoFactorKey = process.env.TWOFACTOR_API_KEY;
  if (!twoFactorKey) {
    res.status(500).json({ error: 'OTP service not configured. Contact admin.' });
    return;
  }

  try {
    const voiceRes  = await fetch(`https://2factor.in/API/V1/${twoFactorKey}/VOICE/+91${phone}/AUTOGEN`);
    const voiceData = await voiceRes.json();

    console.log('2Factor response:', JSON.stringify(voiceData));

    if (voiceData.Status === 'Success') {
      res.status(200).json({ sessionId: voiceData.Details, method: 'voice' });
      return;
    }

    const voiceErr = voiceData.Details || voiceData.Message || 'Voice OTP failed';
    res.status(400).json({ error: `OTP failed: ${voiceErr}` });
  } catch (err) {
    res.status(500).json({ error: 'Network error sending OTP' });
  }
};

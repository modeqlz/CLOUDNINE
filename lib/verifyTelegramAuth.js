
import crypto from 'crypto';

export function parseInitData(initDataString) {
  const params = new URLSearchParams(initDataString);
  const data = {};
  for (const [key, value] of params.entries()) data[key] = value;
  return data;
}

export function buildDataCheckString(data) {
  return Object.keys(data).filter(k => k !== 'hash').sort().map(k => `${k}=${data[k]}`).join('\n');
}

export function validateInitData(initDataString, botToken, maxAgeSeconds = 86400) {
  if (!initDataString) return { ok: false, reason: 'No initData provided' };
  if (!botToken) return { ok: false, reason: 'Missing BOT_TOKEN on server' };

  const data = parseInitData(initDataString);
  const receivedHash = (data.hash || '').toLowerCase();
  if (!receivedHash) return { ok: false, reason: 'Missing hash in initData' };

  if (data.auth_date) {
    const now = Math.floor(Date.now() / 1000);
    const age = now - Number(data.auth_date);
    if (Number.isFinite(age) && age > maxAgeSeconds) return { ok: false, reason: 'initData is too old' };
  }

  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const str = buildDataCheckString(data);
  const computed = crypto.createHmac('sha256', secretKey).update(str).digest('hex');

  const ok = crypto.timingSafeEqual(Buffer.from(computed, 'hex'), Buffer.from(receivedHash, 'hex'));
  return ok ? { ok: true } : { ok: false, reason: 'Hash mismatch' };
}
const crypto = require('crypto');

function getSecret() {
  return process.env.LOCKDROP_SECRET || process.env.CLOUDINARY_API_SECRET;
}

function passwordLookup(password) {
  const secret = getSecret();
  if (!secret) throw new Error('LOCKDROP_SECRET is required.');
  return crypto.createHmac('sha256', secret).update(password, 'utf8').digest('hex');
}

function createDownloadToken(id, expiresAt) {
  const secret = getSecret();
  if (!secret) throw new Error('LOCKDROP_SECRET is required.');
  const exp = Math.min(Date.now() + 10 * 60 * 1000, new Date(expiresAt).getTime());
  const payload = `${id}.${exp}`;
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return { token: `${exp}.${sig}`, tokenExpiresAt: new Date(exp) };
}

function verifyDownloadToken(id, token) {
  const secret = getSecret();
  if (!secret || typeof token !== 'string') return false;
  const dot = token.indexOf('.');
  if (dot < 1) return false;
  const expText = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const exp = Number(expText);
  if (!Number.isFinite(exp) || exp <= Date.now()) return false;
  const expected = crypto.createHmac('sha256', secret).update(`${id}.${exp}`).digest('hex');
  if (sig.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}

module.exports = { passwordLookup, createDownloadToken, verifyDownloadToken };

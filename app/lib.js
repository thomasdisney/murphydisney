import crypto from 'crypto';

function cleanHeaderValue(value, maxLength = 80) {
  if (!value || typeof value !== 'string') return null;

  let decoded = value;

  try {
    decoded = decodeURIComponent(value);
  } catch {
    decoded = value;
  }

  const cleaned = decoded.replace(/\s+/g, ' ').trim();
  if (!cleaned) return null;

  return cleaned.slice(0, maxLength);
}

export function getClientIp(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }

  return 'unknown';
}

export function getClientLocation(request) {
  const city = cleanHeaderValue(request.headers.get('x-vercel-ip-city'));
  const state = cleanHeaderValue(request.headers.get('x-vercel-ip-country-region'));

  return { city, state };
}

export function makeAuthorToken(ip) {
  return crypto.createHash('sha256').update(`${ip}:${process.env.IP_SALT || 'murphy-disney'}`).digest('hex').slice(0, 20);
}

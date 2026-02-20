import crypto from 'crypto';

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

export function makeAuthorToken(ip) {
  return crypto.createHash('sha256').update(`${ip}:${process.env.IP_SALT || 'murphy-disney'}`).digest('hex').slice(0, 20);
}

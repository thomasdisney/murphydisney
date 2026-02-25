function cleanHeaderValue(value) {
  if (!value || typeof value !== 'string') return '';

  let decoded = value;

  try {
    decoded = decodeURIComponent(value);
  } catch {
    decoded = value;
  }

  return decoded.replace(/\s+/g, ' ').trim();
}

export function geolocation(request) {
  return {
    city: cleanHeaderValue(request?.headers?.get?.('x-vercel-ip-city')),
    region: cleanHeaderValue(request?.headers?.get?.('x-vercel-ip-country-region'))
  };
}

let rawApiUrl = (
  process.env.NEXT_PUBLIC_API_URL ||
  '/api/proxy'
).trim().replace(/\/+$/, '');

if (
  rawApiUrl &&
  !rawApiUrl.startsWith('http://') &&
  !rawApiUrl.startsWith('https://') &&
  !rawApiUrl.startsWith('/')
) {
  rawApiUrl = `https://${rawApiUrl}`;
}

// Automatically append NestJS global prefix /api/v1 if pointing directly to a host without proxy
if (!rawApiUrl.startsWith('/api/proxy') && !rawApiUrl.includes('/api/v1')) {
  if (rawApiUrl.endsWith('/api')) {
    rawApiUrl = `${rawApiUrl}/v1`;
  } else {
    rawApiUrl = `${rawApiUrl}/api/v1`;
  }
}

export const config = {
  apiUrl: rawApiUrl,
};


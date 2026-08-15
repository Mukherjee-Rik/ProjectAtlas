let rawApiUrl = (
  process.env.NEXT_PUBLIC_API_URL ||
  'https://projectatlas-production-0c80.up.railway.app/api/v1'
).trim().replace(/\/+$/, '');

if (
  rawApiUrl &&
  !rawApiUrl.startsWith('http://') &&
  !rawApiUrl.startsWith('https://') &&
  !rawApiUrl.startsWith('/')
) {
  rawApiUrl = `https://${rawApiUrl}`;
}

// Automatically append NestJS global prefix /api/v1 if omitted
if (!rawApiUrl.includes('/api/v1')) {
  if (rawApiUrl.endsWith('/api')) {
    rawApiUrl = `${rawApiUrl}/v1`;
  } else if (!rawApiUrl.startsWith('/api/proxy')) {
    rawApiUrl = `${rawApiUrl}/api/v1`;
  }
}

export const config = {
  apiUrl: rawApiUrl,
};


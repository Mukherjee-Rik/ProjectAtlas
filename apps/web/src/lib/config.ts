let rawApiUrl =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://projectatlas-production-0c80.up.railway.app/api/v1';

if (
  rawApiUrl &&
  !rawApiUrl.startsWith('http://') &&
  !rawApiUrl.startsWith('https://') &&
  !rawApiUrl.startsWith('/')
) {
  rawApiUrl = `https://${rawApiUrl}`;
}

export const config = {
  apiUrl: rawApiUrl.replace(/\/+$/, ''),
};


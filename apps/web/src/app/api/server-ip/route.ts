import { NextResponse } from 'next/server';
import os from 'os';

function getLocalNetworkIp(): string | null {
  const interfaces = os.networkInterfaces();

  for (const name of Object.keys(interfaces)) {
    const iface = interfaces[name];
    if (!iface) continue;

    for (const info of iface) {
      // Skip loopback (127.x.x.x), IPv6, and internal adapters
      if (info.family !== 'IPv4' || info.internal || info.address.startsWith('127.')) {
        continue;
      }
      // Prefer 192.168.x.x, 10.x.x.x, 172.16-31.x.x (private LAN ranges)
      const isPrivate =
        info.address.startsWith('192.168.') ||
        info.address.startsWith('10.') ||
        /^172\.(1[6-9]|2\d|3[01])\./.test(info.address);

      if (isPrivate) {
        return info.address;
      }
    }
  }

  // Fallback: return any non-loopback IPv4 if no private range found
  for (const name of Object.keys(interfaces)) {
    const iface = interfaces[name];
    if (!iface) continue;
    for (const info of iface) {
      if (info.family === 'IPv4' && !info.internal) {
        return info.address;
      }
    }
  }

  return null;
}

export async function GET(request: Request) {
  const ip = getLocalNetworkIp();
  const port = new URL(request.url).searchParams.get('port') ?? '3001';
  const baseUrl = ip ? `http://${ip}:${port}` : null;

  return NextResponse.json({
    ip,
    baseUrl,
    fallback: !ip,
  });
}

import type { NextConfig } from "next";
import os from "os";

function getLocalNetworkIps(): string[] {
  const ips: string[] = [];
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    const iface = interfaces[name];
    if (!iface) continue;
    for (const info of iface) {
      if (info.family === 'IPv4' && !info.internal) {
        ips.push(info.address);
        ips.push(`${info.address}:3001`);
      }
    }
  }
  return ips;
}

const nextConfig: NextConfig = {
  allowedDevOrigins: getLocalNetworkIps(),

};

export default nextConfig;

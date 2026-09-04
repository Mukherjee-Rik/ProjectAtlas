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
  // Defaults to .next. Set NEXT_DIST_DIR to build into a separate directory —
  // lets a production build run without clobbering a dev server's .next.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  allowedDevOrigins: getLocalNetworkIps(),
  env: {
    NEXT_PUBLIC_GOOGLE_CLIENT_ID:
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
      process.env.GOOGLE_CLIENT_ID ||
      '176583562252-7mos3rsvao2elm9obl55hmknphipgqq8.apps.googleusercontent.com',
  },
  // Every legal document has exactly one canonical URL. Everything that ever
  // pointed at a policy — old top-level aliases and the retired /legal/<slug>
  // duplicates — redirects here, so search engines and Google's OAuth reviewer
  // only ever see one copy of each policy.
  async redirects() {
    const canonical: Record<string, string> = {
      'privacy-policy': '/privacy',
      'terms-of-service': '/terms',
      'acceptable-use-policy': '/acceptable-use',
      'ai-usage-policy': '/ai-policy',
      'cookie-policy': '/cookies',
      'security-policy': '/security',
      'dpa-policy': '/dpa',
      'data-processing-addendum': '/dpa',
      'sub-processors': '/subprocessors',
      copyright: '/dmca',
      'copyright-dmca-policy': '/dmca',
      'refund-policy': '/refunds',
      'refund-cancellation-policy': '/refunds',
      'cancellation-policy': '/refunds',
      'delete-account': '/data-deletion',
    };

    return [
      // Top-level aliases, e.g. /privacy-policy -> /privacy
      ...Object.entries(canonical).map(([from, destination]) => ({
        source: `/${from}`,
        destination,
        permanent: true,
      })),
      // The retired /legal/<slug> duplicates, e.g. /legal/privacy-policy
      ...Object.entries(canonical).map(([from, destination]) => ({
        source: `/legal/${from}`,
        destination,
        permanent: true,
      })),
      // /legal/<canonical-name> for the routes that never had a long alias
      ...['privacy', 'terms', 'acceptable-use', 'ai-policy', 'cookies', 'dmca', 'dpa', 'security', 'refunds', 'subprocessors', 'data-deletion'].map(
        (slug) => ({
          source: `/legal/${slug}`,
          destination: `/${slug}`,
          permanent: true,
        }),
      ),
    ];
  },
};

export default nextConfig;

import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'https://antoant.com'
  ).replace(/\/+$/, '');

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/docs',
          '/contact',
          '/support',
          '/talk-to-us',
          '/signup',
          '/login',
          '/forgot-password',
          '/legal',
          '/privacy',
          '/terms',
          '/ai-policy',
          '/acceptable-use',
          '/cookies',
          '/dmca',
          '/dpa',
          '/refund-policy',
          '/security',
          '/sitemap',
        ],
        disallow: [
          '/api/',
          '/dashboard',
          '/orders',
          '/cashier',
          '/kitchen',
          '/inventory',
          '/analytics',
          '/forecasts',
          '/menus',
          '/branches',
          '/tables',
          '/users',
          '/settings',
          '/reports',
          '/dining-areas',
          '/table-qrs',
          '/platform-admin',
          '/onboarding',
          '/select-restaurant',
          '/profile',
          '/subscriptions',
          '/waiter',
          '/t/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

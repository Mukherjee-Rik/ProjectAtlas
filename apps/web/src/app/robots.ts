import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'https://kafei.in'
  ).replace(/\/+$/, '');

  const publicAllowed = [
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
    '/data-deletion',
    '/refund-policy',
    '/security',
    '/sitemap',
  ];

  const privateDisallowed = [
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
  ];

  // AI bots and search engines to explicitly configure for optimal AEO & SEO indexing
  const targetCrawlers = [
    '*',
    'Googlebot',
    'Google-Extended',
    'GPTBot',
    'ChatGPT-User',
    'PerplexityBot',
    'ClaudeBot',
    'anthropic-ai',
    'Bingbot',
    'Applebot',
    'Applebot-Extended',
  ];

  return {
    rules: targetCrawlers.map((crawler) => ({
      userAgent: crawler,
      allow: publicAllowed,
      disallow: privateDisallowed,
    })),
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}


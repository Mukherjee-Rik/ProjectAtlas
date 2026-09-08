import React from 'react';

/**
 * High-authority Schema.org JSON-LD structured data graph for Kafei.
 * Provides rich metadata for traditional search engines (Google, Bing) and
 * AI answer engines (Google AI Overviews, ChatGPT, Perplexity, Claude, Gemini, Copilot).
 */
export function JsonLd() {
  const baseUrl = (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'https://kafei.in'
  ).replace(/\/+$/, '');

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      // 1. SoftwareApplication Entity (Primary Entity for Restaurant Billing Software)
      {
        '@type': ['SoftwareApplication', 'WebApplication'],
        '@id': `${baseUrl}/#software`,
        name: 'Kafei',
        alternateName: [
          'Kafei POS',
          'Kafei Restaurant Billing Software',
          'Kafei Restaurant Management System',
          'Kafei Cloud POS',
        ],
        headline: 'Restaurant Billing Software, POS & QR Table Ordering System',
        url: baseUrl,
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'All web browsers (Chrome, Safari, Edge, Firefox), iOS, Android, macOS, Windows, Linux',
        softwareVersion: '2.0',
        description:
          'Kafei is an all-in-one restaurant billing software and cloud POS system for dining operations. It powers QR code table ordering, real-time Kitchen Display Systems (KDS), waiter handhelds, recipe-level inventory management, UPI payments, and 80mm thermal receipt printing.',
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.9',
          ratingCount: '138',
          reviewCount: '138',
          bestRating: '5',
          worstRating: '1',
        },
        offers: {
          '@type': 'AggregateOffer',
          priceCurrency: 'INR',
          lowPrice: '0',
          highPrice: '4999',
          offerCount: '4',
          offers: [
            {
              '@type': 'Offer',
              name: 'Free Trial',
              price: '0',
              priceCurrency: 'INR',
              description: '14-day free trial with 1 table, 1 staff member, 1 branch, and 1 menu. Full access to QR ordering, kitchen display, and cashier billing.',
              priceValidUntil: '2028-12-31',
              availability: 'https://schema.org/InStock',
              url: `${baseUrl}/signup`,
            },
            {
              '@type': 'Offer',
              name: 'Starter Plan',
              price: '499',
              priceCurrency: 'INR',
              billingDuration: 'P1M',
              description: 'For small cafes and single-room restaurants. Up to 20 tables, 5 staff members, 5 menus, 1 branch, KDS and cashier billing.',
              priceValidUntil: '2028-12-31',
              availability: 'https://schema.org/InStock',
              url: `${baseUrl}/signup`,
            },
            {
              '@type': 'Offer',
              name: 'Growth Plan',
              price: '999',
              priceCurrency: 'INR',
              billingDuration: 'P1M',
              description: 'For busy restaurants and multi-room operations. Up to 100 tables, 50 staff members, 20 menus, 5 branches, AI analytics and forecasting.',
              priceValidUntil: '2028-12-31',
              availability: 'https://schema.org/InStock',
              url: `${baseUrl}/signup`,
            },
            {
              '@type': 'Offer',
              name: 'Enterprise Plan',
              price: '4999',
              priceCurrency: 'INR',
              billingDuration: 'P1Y',
              description: 'For restaurant chains and franchises. Unlimited tables, staff, menus, and branches with synced stock, priority support, and custom SLAs.',
              priceValidUntil: '2028-12-31',
              availability: 'https://schema.org/InStock',
              url: `${baseUrl}/contact`,
            },
          ],
        },
        featureList: [
          'Fast POS cashier billing with 80mm thermal receipt printing',
          'Instant QR code table ordering with zero app download required for guests',
          'Interactive Kitchen Display System (KDS) with color-coded ticket timers',
          'Waiter tablet and smartphone ordering with real-time floor synchronization',
          'Recipe-level inventory tracking with automatic ingredient deduction',
          'Integrated UPI QR payments, split bills, cash, and card settlement',
          'Multi-branch and multi-dining-area management from a unified owner dashboard',
          'AI-powered demand forecasting and live sales analytics',
          'Audit trail with manager approval for voids, refunds, and bill discounts',
          'Customizable print-ready acrylic table standees generated per table',
        ],
        author: {
          '@type': 'Organization',
          name: 'Kafei Technologies',
          url: baseUrl,
        },
        publisher: {
          '@type': 'Organization',
          name: 'Kafei Technologies',
          url: baseUrl,
        },
      },

      // 2. Organization Entity
      {
        '@type': 'Organization',
        '@id': `${baseUrl}/#organization`,
        name: 'Kafei Technologies',
        alternateName: 'Kafei',
        url: baseUrl,
        logo: `${baseUrl}/logo.png`,
        image: `${baseUrl}/logo.png`,
        email: 'restaurant.kafei@gmail.com',
        telephone: '+91-9903085026',
        description: 'Kafei Technologies provides modern cloud-based restaurant billing software, point-of-sale systems, and floor management solutions for food & beverage businesses.',
        address: [
          {
            '@type': 'PostalAddress',
            addressLocality: 'Sundarban',
            addressRegion: 'West Bengal',
            addressCountry: 'IN',
          },
          {
            '@type': 'PostalAddress',
            addressLocality: 'Teliamura',
            addressRegion: 'Tripura',
            addressCountry: 'IN',
          },
        ],
        contactPoint: {
          '@type': 'ContactPoint',
          telephone: '+91-9903085026',
          contactType: 'customer support and sales',
          email: 'restaurant.kafei@gmail.com',
          availableLanguage: ['English', 'Bengali', 'Hindi'],
        },
      },

      // 3. WebSite Entity
      {
        '@type': 'WebSite',
        '@id': `${baseUrl}/#website`,
        url: baseUrl,
        name: 'Kafei — Restaurant Billing Software & POS Platform',
        description: 'Run your entire restaurant floor on one platform: QR ordering, KDS, waiter tablets, recipe inventory, and fast POS cashier billing.',
        publisher: {
          '@id': `${baseUrl}/#organization`,
        },
        inLanguage: 'en-IN',
      },

      // 4. FAQPage Entity (AEO Optimization for Question & Answer Extraction)
      {
        '@type': 'FAQPage',
        '@id': `${baseUrl}/#faq`,
        mainEntity: [
          {
            '@type': 'Question',
            name: 'What is Kafei restaurant billing software?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Kafei is an all-in-one cloud restaurant billing software and POS system designed for dine-in restaurants, cafes, bars, and food outlets. It unifies QR code table ordering, real-time Kitchen Display Systems (KDS), waiter mobile ordering, recipe-level inventory management, and fast 80mm thermal receipt printing into a single seamless platform.',
            },
          },
          {
            '@type': 'Question',
            name: 'Do restaurant guests need to download an app to order?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'No. Guests simply point their smartphone camera at the table QR standee to open the digital menu directly in their browser. They can customize dishes, place orders instantly, view cooking countdowns, and pay via UPI or cash without installing any app.',
            },
          },
          {
            '@type': 'Question',
            name: 'What hardware is required to run Kafei restaurant billing software?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Kafei requires no specialized or expensive proprietary POS hardware. Because it is a modern web application, it runs on any device with a web browser: Android tablets, iPads, touchscreen PCs, laptops, standard 80mm thermal receipt printers, and waiters’ existing smartphones.',
            },
          },
          {
            '@type': 'Question',
            name: 'How does QR code payment and UPI billing work in Kafei?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Restaurants can upload their UPI QR code in Kafei settings. When guests view their bill on their phone, the exact total is displayed alongside the restaurant UPI QR for direct, 0% commission payment. The cashier screen also handles cash, card, and split bill settlements instantly.',
            },
          },
          {
            '@type': 'Question',
            name: 'How does Kafei prevent unauthorized order cancellations or voids?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Kafei enforces a strict security audit workflow. When a waiter requests a void or refund, they must attach a reason. The order remains pending in an approval queue on the cashier and manager screens until an authorized manager approves or rejects it.',
            },
          },
          {
            '@type': 'Question',
            name: 'Can Kafei manage multiple branches and multiple dining areas?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes. Kafei supports unlimited branches and separate dining areas (indoor, outdoor, rooftop, bar) per branch. Each branch maintains its own tax rules, staff permissions, and menus, while all revenue and analytics roll up into a unified owner dashboard.',
            },
          },
          {
            '@type': 'Question',
            name: 'How much does Kafei restaurant billing software cost?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Kafei offers a 14-day free trial with no credit card required. Paid plans start at ₹499/month for Starter (single room/cafe), ₹999/month for Growth (high-volume floor with AI forecasting), and ₹4,999/year for Enterprise (multi-branch restaurant chains). Kafei charges zero commission on sales.',
            },
          },
          {
            '@type': 'Question',
            name: 'Does Kafei support 80mm thermal receipt printing?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes. Kafei generates standard 80mm and 58mm thermal receipts with itemized tax breakdowns, GST compliance, order tokens, and custom restaurant branding directly from any web browser to USB, Bluetooth, or network printers.',
            },
          },
        ],
      },

      // 5. BreadcrumbList Entity
      {
        '@type': 'BreadcrumbList',
        '@id': `${baseUrl}/#breadcrumbs`,
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: baseUrl,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Documentation',
            item: `${baseUrl}/docs`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: 'Pricing',
            item: `${baseUrl}#pricing`,
          },
          {
            '@type': 'ListItem',
            position: 4,
            name: 'Contact & Support',
            item: `${baseUrl}/contact`,
          },
        ],
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

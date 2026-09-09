import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Real-Time Kitchen Display System (KDS) | Digital KOT for Restaurants',
  description:
    'Eliminate paper kitchen tickets and reduce cooking errors with Kafei Kitchen Display System (KDS). Live color-coded order cards, cooking timers, course pacing, and instant status bumps.',
  keywords: [
    'kitchen display system',
    'kds software for restaurants',
    'restaurant kot system',
    'digital kitchen order ticket',
    'chef display system',
    'kafei kds',
  ],
  alternates: {
    canonical: 'https://kafei.in/kitchen-display-system',
  },
  openGraph: {
    title: 'Kafei — Real-Time Kitchen Display System (KDS) for Restaurants',
    description:
      'Paperless kitchen order ticketing with cooking countdowns and multi-station routing on any screen.',
    url: 'https://kafei.in/kitchen-display-system',
  },
};

export default function KitchenDisplaySystemLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Modern Cloud Restaurant POS System | Kafei POS for Cafes & Restaurants',
  description:
    'Scale your hospitality business with Kafei, the leading cloud restaurant POS system. Seamless table management, instant mobile waiter ordering, integrated kitchen display systems (KDS), and real-time revenue analytics.',
  keywords: [
    'restaurant pos system',
    'cloud restaurant pos',
    'best pos system for restaurants',
    'cafe pos system',
    'restaurant point of sale',
    'bar pos software',
    'multi branch restaurant pos',
    'kafei pos',
  ],
  alternates: {
    canonical: 'https://kafei.in/restaurant-pos-system',
  },
  openGraph: {
    title: 'Kafei — Cloud Restaurant POS System & Table Management',
    description:
      'Turn any tablet, laptop, or phone into a high-performance restaurant POS terminal with zero hardware fees.',
    url: 'https://kafei.in/restaurant-pos-system',
  },
};

export default function RestaurantPosSystemLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

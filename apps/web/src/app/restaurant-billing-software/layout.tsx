import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Best Restaurant Billing Software in India | Fast 80mm POS & QR Ordering',
  description:
    'Discover Kafei, the top-rated restaurant billing software in India. Enjoy ultra-fast 80mm thermal receipt printing, GST tax itemization, table QR code ordering, live KDS kitchen screens, and 0% commission on sales. Start your 14-day free trial today.',
  keywords: [
    'restaurant billing software',
    'restaurant billing software india',
    'best restaurant billing app',
    'gst restaurant billing software',
    '80mm thermal receipt billing software',
    'cafe billing software',
    'fast restaurant billing pos',
    'restaurant pos software',
    'cloud restaurant billing',
    'kafei restaurant billing',
  ],
  alternates: {
    canonical: 'https://kafei.in/restaurant-billing-software',
  },
  openGraph: {
    title: 'Kafei — Best Restaurant Billing Software & Cloud POS System',
    description:
      'Fast 80mm thermal receipt printing, GST calculation, QR table ordering, and live kitchen display screens on any web browser.',
    url: 'https://kafei.in/restaurant-billing-software',
  },
};

export default function RestaurantBillingSoftwareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

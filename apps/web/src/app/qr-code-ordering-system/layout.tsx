import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Table QR Code Ordering System for Restaurants | Zero App Downloads',
  description:
    'Boost table turnover and guest satisfaction with Kafei contactless table QR code ordering. High-res photo menus, instant kitchen routing, live cooking countdowns, and direct UPI bill payment.',
  keywords: [
    'qr code ordering system for restaurants',
    'table qr ordering',
    'contactless restaurant ordering',
    'digital qr menu for restaurants',
    'qr code billing system',
    'kafei qr ordering',
  ],
  alternates: {
    canonical: 'https://kafei.in/qr-code-ordering-system',
  },
  openGraph: {
    title: 'Kafei — Contactless Table QR Code Ordering for Restaurants',
    description:
      'Guests scan, browse photo menus, place orders, and pay with 0 app downloads required.',
    url: 'https://kafei.in/qr-code-ordering-system',
  },
};

export default function QrCodeOrderingSystemLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

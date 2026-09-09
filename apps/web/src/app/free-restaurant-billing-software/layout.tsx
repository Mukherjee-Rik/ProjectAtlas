import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Free Restaurant Billing Software | 14-Day Full Access Trial | Kafei',
  description:
    'Start using Kafei free restaurant billing software today with zero upfront cost. 14 days of full POS access, QR table ordering, live kitchen display, and 80mm thermal receipt printing. No credit card required.',
  keywords: [
    'free restaurant billing software',
    'restaurant billing software free trial',
    'free restaurant pos app',
    'restaurant billing app free download',
    'free cafe billing software',
    'kafei free trial',
  ],
  alternates: {
    canonical: 'https://kafei.in/free-restaurant-billing-software',
  },
  openGraph: {
    title: 'Kafei — Free Restaurant Billing Software & POS Free Trial',
    description:
      'Set up your restaurant in 5 minutes and take live orders for 14 days free with no credit card required.',
    url: 'https://kafei.in/free-restaurant-billing-software',
  },
};

export default function FreeRestaurantBillingSoftwareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

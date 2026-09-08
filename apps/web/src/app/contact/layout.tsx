import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact & Sales Support',
  description:
    'Get in touch with the Kafei restaurant billing software team. Request a live product demo, enterprise onboarding consultation, or technical support.',
  openGraph: {
    title: 'Contact Kafei — Restaurant Billing Software & POS Solutions',
    description:
      'Schedule a live demo or contact Kafei support for restaurant POS, QR table ordering, and floor operations setup.',
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

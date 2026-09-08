import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Legal Hub & Compliance Center',
  description:
    'Legal policies, terms of service, privacy practices, and compliance documentation for Kafei restaurant billing software and cloud POS platform.',
};

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

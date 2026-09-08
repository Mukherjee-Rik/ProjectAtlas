import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Documentation & Operations Guide',
  description:
    'Comprehensive user guide and documentation for Kafei restaurant billing software, Kitchen Display Systems (KDS), waiter mobile terminals, table QR code setup, and recipe inventory.',
  openGraph: {
    title: 'Kafei Documentation & Restaurant Operations Guide',
    description:
      'Learn how to configure table QR ordering, kitchen display screens, cashier POS billing, and multi-branch restaurant operations with Kafei.',
  },
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

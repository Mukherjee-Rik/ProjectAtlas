import type { ReactNode } from 'react';
import { CartProvider } from '@/hooks/use-cart';

export default async function CustomerTableLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  // One cart context for every screen the customer visits under this QR token.
  return <CartProvider token={token}>{children}</CartProvider>;
}

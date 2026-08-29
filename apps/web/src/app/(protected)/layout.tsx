import { ProtectedRoute } from '@/components/auth/protected-route';
import { AppShell } from '@/components/layout/app-shell';
import { SubscriptionGate } from '@/components/auth/subscription-gate';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <AppShell>
        <SubscriptionGate>{children}</SubscriptionGate>
      </AppShell>
    </ProtectedRoute>
  );
}

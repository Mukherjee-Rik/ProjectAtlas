'use client';

import { useAuth } from '@/hooks/use-auth';
import { PlatformSubscriptionsView } from '@/components/subscriptions/platform-view';
import { RestaurantSubscriptionView } from '@/components/subscriptions/restaurant-view';

export default function SubscriptionsPage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="space-y-6">
      {user.role === 'PLATFORM_ADMIN' ? (
        <PlatformSubscriptionsView />
      ) : (
        <RestaurantSubscriptionView />
      )}
    </div>
  );
}

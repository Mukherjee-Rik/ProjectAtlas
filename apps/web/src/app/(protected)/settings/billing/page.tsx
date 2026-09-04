'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import SubscriptionsPage from '../../subscriptions/page';

export default function SettingsBillingPage() {
  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center gap-2">
        <Link
          href="/settings"
          className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Settings
        </Link>
      </div>
      <SubscriptionsPage />
    </div>
  );
}

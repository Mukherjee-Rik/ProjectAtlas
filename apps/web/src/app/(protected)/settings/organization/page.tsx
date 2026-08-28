'use client';

import { useAuth } from '@/hooks/use-auth';
import { useTenant } from '@/hooks/use-tenant';

export default function OrganizationSettingsPage() {
  const { user } = useAuth();
  const { currentTenant } = useTenant();

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-[-0.02em] text-foreground">
          Organization
        </h1>
        <p className="mt-2 text-muted-foreground">
          View your current restaurant group organization and membership.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border p-6 bg-secondary/40">
          <h2 className="text-xl font-bold text-foreground">
            Current Organization
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Tenant organization context for your active session
          </p>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Organization Name
              </p>
              <p className="mt-1.5 text-base font-semibold text-foreground">
                {currentTenant?.name ?? 'Mukherjee Restaurant Group'}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Tenant Slug
              </p>
              <p className="mt-1.5 text-sm font-mono text-primary">
                {currentTenant?.slug ?? 'mukherjee-restaurants'}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Your Role
              </p>
              <div className="mt-1.5 flex items-center gap-2">
                <span className="inline-block rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary border border-primary/30">
                  {user?.role ?? 'ADMIN'}
                </span>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Organization Status
              </p>
              <div className="mt-1.5 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-atlas-success" />
                <span className="text-sm font-semibold text-foreground">
                  {currentTenant?.status ?? 'ACTIVE'}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-border text-xs text-muted-foreground">
            <p>• Multi-tenant security enforces tenant boundaries on all database queries.</p>
            <p className="mt-1">• Organization switching and membership management CRUD will be available in future sprints.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

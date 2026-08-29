'use client';

import { useAuth } from '@/hooks/use-auth';
import { useTenant } from '@/hooks/use-tenant';
import { useRestaurant } from '@/hooks/use-restaurant';
import { useBranch } from '@/hooks/use-branch';

export function ContextSelectors() {
  const { user } = useAuth();
  const { currentTenant, memberships, setCurrentTenant } = useTenant();
  const { restaurants, currentRestaurant, setCurrentRestaurant } = useRestaurant();
  const { branches, currentBranch, setCurrentBranch } = useBranch();

  const isOwnerOrPlatformAdmin = user?.role === 'OWNER' || user?.role === 'PLATFORM_ADMIN';

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Tenant Selector */}
      {memberships.length > 1 && isOwnerOrPlatformAdmin ? (
        <select
          value={currentTenant?.id ?? ''}
          onChange={(e) => {
            const selectedId = e.target.value;
            const membership = memberships.find(
              (m) => m.tenantId === selectedId || m.tenant?.id === selectedId,
            );
            if (membership?.tenant) {
              setCurrentTenant(membership.tenant);
            }
          }}
          className="appearance-none rounded-lg border border-border bg-secondary py-1 px-2.5 text-xs font-semibold text-foreground hover:border-primary focus:border-primary focus:outline-none"
        >
          {memberships.map((m) => {
            const tenant = m.tenant;
            if (!tenant) return null;
            return (
              <option key={tenant.id} value={tenant.id}>
                🏢 {tenant.name}
              </option>
            );
          })}
        </select>
      ) : (
        <span className="text-xs font-medium text-muted-foreground">
          🏢 {currentTenant?.name ?? 'My Workspace'}
        </span>
      )}

      {/* Breadcrumb Separator */}
      <span className="text-xs text-muted-foreground">/</span>

      {/* Restaurant Selector */}
      {restaurants.length > 1 && isOwnerOrPlatformAdmin ? (
        <select
          value={currentRestaurant?.id ?? ''}
          onChange={(e) => {
            const selectedId = e.target.value;
            const target = restaurants.find((r) => r.id === selectedId);
            setCurrentRestaurant(target ?? null);
          }}
          className="appearance-none rounded-lg border border-border bg-secondary py-1 px-2.5 text-xs font-semibold text-primary hover:border-primary focus:border-primary focus:outline-none"
        >
          {restaurants.map((r) => (
            <option key={r.id} value={r.id}>
              🍽️ {r.name}
            </option>
          ))}
        </select>
      ) : (
        <span className="text-xs font-medium text-foreground">
          🍽️ {currentRestaurant?.name ?? 'Restaurant'}
        </span>
      )}

      {/* Breadcrumb Separator */}
      <span className="text-xs text-muted-foreground">/</span>

      {/* Branch Selector: Full switcher for Owner, Locked branch badge for Waiter/Cashier/Manager/Staff */}
      {isOwnerOrPlatformAdmin && branches.length > 1 ? (
        <select
          value={currentBranch?.id ?? ''}
          onChange={(e) => {
            const selectedId = e.target.value;
            const target = branches.find((b) => b.id === selectedId);
            setCurrentBranch(target ?? null);
          }}
          className="appearance-none rounded-lg border border-primary/40 bg-secondary py-1 px-2.5 text-xs font-semibold text-foreground hover:border-primary focus:border-primary focus:outline-none cursor-pointer"
        >
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              📍 {b.name} ({b.code})
            </option>
          ))}
        </select>
      ) : currentBranch ? (
        <span className="inline-flex items-center gap-1 rounded-lg border border-border bg-secondary/80 py-1 px-2.5 text-xs font-semibold text-foreground shadow-sm">
          📍 {currentBranch.name} ({currentBranch.code})
        </span>
      ) : (
        <span className="text-xs text-muted-foreground">No Branch</span>
      )}
    </div>
  );
}

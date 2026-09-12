'use client';

import { Building2, MapPin, UtensilsCrossed } from 'lucide-react';

import { useAuth } from '@/hooks/use-auth';
import { useTenant } from '@/hooks/use-tenant';
import { useRestaurant } from '@/hooks/use-restaurant';
import { useBranch } from '@/hooks/use-branch';

/**
 * The tenant / restaurant / branch breadcrumb.
 *
 * It lives in a fixed 4rem header row and, on a phone, in a 224px drawer
 * column, so nothing in here is allowed to size to its content: a real group
 * plus branch name ("Mukherjee Restaurant Group / Salt Lake Sector V (SLK-01)")
 * used to wrap onto a third line and spill out past the header's bottom border.
 * Everything is capped and clipped instead; the separators are the one thing
 * that never collapses, because losing them turns the path into a run-on name.
 */
export function ContextSelectors() {
  const { user } = useAuth();
  const { currentTenant, memberships, setCurrentTenant } = useTenant();
  const { restaurants, currentRestaurant, setCurrentRestaurant } = useRestaurant();
  const { branches, currentBranch, setCurrentBranch } = useBranch();

  const isOwnerOrPlatformAdmin = user?.role === 'OWNER' || user?.role === 'PLATFORM_ADMIN';

  return (
    <div className="flex min-w-0 flex-nowrap items-center gap-2 overflow-hidden">
      {/* Tenant Selector */}
      {memberships.length > 1 && isOwnerOrPlatformAdmin ? (
        <span className="flex min-w-0 items-center gap-1.5">
          <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <select
            aria-label="Switch workspace"
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
            className="min-w-0 max-w-[140px] truncate appearance-none rounded-lg border border-border bg-secondary py-1 px-2.5 text-xs font-semibold text-foreground hover:border-primary focus:border-primary focus:outline-none"
          >
            {memberships.map((m) => {
              const tenant = m.tenant;
              if (!tenant) return null;
              return (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name}
                </option>
              );
            })}
          </select>
        </span>
      ) : (
        <span className="flex min-w-0 items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Building2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="max-w-[140px] truncate">
            {currentTenant?.name ?? 'My Workspace'}
          </span>
        </span>
      )}

      {/* Breadcrumb Separator */}
      <span className="shrink-0 text-xs text-muted-foreground" aria-hidden="true">
        /
      </span>

      {/* Restaurant Selector */}
      {restaurants.length > 1 && isOwnerOrPlatformAdmin ? (
        <span className="flex min-w-0 items-center gap-1.5">
          <UtensilsCrossed className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <select
            aria-label="Switch restaurant"
            value={currentRestaurant?.id ?? ''}
            onChange={(e) => {
              const selectedId = e.target.value;
              const target = restaurants.find((r) => r.id === selectedId);
              setCurrentRestaurant(target ?? null);
            }}
            className="min-w-0 max-w-[140px] truncate appearance-none rounded-lg border border-border bg-secondary py-1 px-2.5 text-xs font-semibold text-primary hover:border-primary focus:border-primary focus:outline-none"
          >
            {restaurants.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </span>
      ) : (
        <span className="flex min-w-0 items-center gap-1.5 text-xs font-medium text-foreground">
          <UtensilsCrossed className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span className="max-w-[140px] truncate">
            {currentRestaurant?.name ?? 'Restaurant'}
          </span>
        </span>
      )}

      {/* Breadcrumb Separator */}
      <span className="shrink-0 text-xs text-muted-foreground" aria-hidden="true">
        /
      </span>

      {/* Branch Selector: Full switcher for Owner, Locked branch badge for Waiter/Cashier/Manager/Staff */}
      {isOwnerOrPlatformAdmin && branches.length > 1 ? (
        <span className="flex min-w-0 items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <select
            aria-label="Switch branch"
            value={currentBranch?.id ?? ''}
            onChange={(e) => {
              const selectedId = e.target.value;
              const target = branches.find((b) => b.id === selectedId);
              setCurrentBranch(target ?? null);
            }}
            className="min-w-0 max-w-[140px] truncate appearance-none rounded-lg border border-primary/40 bg-secondary py-1 px-2.5 text-xs font-semibold text-foreground hover:border-primary focus:border-primary focus:outline-none cursor-pointer"
          >
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.code})
              </option>
            ))}
          </select>
        </span>
      ) : currentBranch ? (
        <span className="inline-flex min-w-0 items-center gap-1.5 rounded-lg border border-border bg-secondary/80 py-1 px-2.5 text-xs font-semibold text-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span className="max-w-[140px] truncate">
            {currentBranch.name} ({currentBranch.code})
          </span>
        </span>
      ) : (
        <span className="shrink-0 text-xs text-muted-foreground">No Branch</span>
      )}
    </div>
  );
}

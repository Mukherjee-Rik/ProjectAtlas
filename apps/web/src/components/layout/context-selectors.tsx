'use client';

import { useTenant } from '@/hooks/use-tenant';
import { useRestaurant } from '@/hooks/use-restaurant';
import { useBranch } from '@/hooks/use-branch';

export function ContextSelectors() {
  const { currentTenant, memberships, setCurrentTenant } = useTenant();
  const { restaurants, currentRestaurant, setCurrentRestaurant } = useRestaurant();
  const { branches, currentBranch, setCurrentBranch } = useBranch();

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Tenant Selector */}
      {memberships.length > 0 ? (
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
          className="appearance-none rounded-lg border border-[#26313C] bg-[#18212B] py-1 px-2.5 text-xs font-semibold text-[#F5F7FA] hover:border-[#2AFEB7] focus:border-[#2AFEB7] focus:outline-none"
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
        <span className="text-xs text-[#9AA6B2]">
          {currentTenant?.name ?? 'Mukherjee Restaurants'}
        </span>
      )}

      {/* Breadcrumb Separator */}
      <span className="text-xs text-[#9AA6B2]">/</span>

      {/* Restaurant Selector */}
      {restaurants.length > 0 ? (
        <select
          value={currentRestaurant?.id ?? ''}
          onChange={(e) => {
            const selectedId = e.target.value;
            const target = restaurants.find((r) => r.id === selectedId);
            setCurrentRestaurant(target ?? null);
          }}
          className="appearance-none rounded-lg border border-[#26313C] bg-[#18212B] py-1 px-2.5 text-xs font-semibold text-[#2AFEB7] hover:border-[#2AFEB7] focus:border-[#2AFEB7] focus:outline-none"
        >
          {restaurants.map((r) => (
            <option key={r.id} value={r.id}>
              🍽️ {r.name}
            </option>
          ))}
        </select>
      ) : (
        <span className="text-xs text-[#9AA6B2]">No Restaurant</span>
      )}

      {/* Breadcrumb Separator */}
      <span className="text-xs text-[#9AA6B2]">/</span>

      {/* Branch Selector */}
      {branches.length > 0 ? (
        <select
          value={currentBranch?.id ?? ''}
          onChange={(e) => {
            const selectedId = e.target.value;
            const target = branches.find((b) => b.id === selectedId);
            setCurrentBranch(target ?? null);
          }}
          className="appearance-none rounded-lg border border-[#26313C] bg-[#18212B] py-1 px-2.5 text-xs font-semibold text-[#F5F7FA] hover:border-[#2AFEB7] focus:border-[#2AFEB7] focus:outline-none"
        >
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              📍 {b.name} ({b.code})
            </option>
          ))}
        </select>
      ) : (
        <span className="text-xs text-[#9AA6B2]">No Branch</span>
      )}
    </div>
  );
}

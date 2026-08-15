'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getMemberships } from '@/services/auth.service';
import type { RestaurantMembershipInfo } from '@/types/auth';
import { setCurrentTenant } from '@/lib/tenant-storage';
import { setCurrentRestaurant } from '@/lib/restaurant-storage';
import { setCurrentBranch } from '@/lib/branch-storage';

export default function SelectRestaurantPage() {
  const router = useRouter();

  const [memberships, setMemberships] = useState<RestaurantMembershipInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadMemberships = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await getMemberships();
      const list = response.data ?? [];
      setMemberships(list);

      // Auto-select if user only has 1 restaurant
      const allRestaurants = list.flatMap((m) =>
        m.tenant.restaurants.map((r) => ({ tenantId: m.tenant.id, tenantSlug: m.tenant.slug, restaurant: r, role: m.role })),
      );

      if (allRestaurants.length === 1) {
        const item = allRestaurants[0];
        setCurrentTenant({ id: item.tenantId, name: item.restaurant.name, slug: item.tenantSlug, status: 'ACTIVE', createdAt: '', updatedAt: '' });
        setCurrentRestaurant({ id: item.restaurant.id, tenantId: item.tenantId, name: item.restaurant.name, slug: item.restaurant.slug, status: 'ACTIVE', createdAt: '', updatedAt: '' });
        if (item.restaurant.branches?.[0]?.id) {
          const b = item.restaurant.branches[0];
          setCurrentBranch({ id: b.id, restaurantId: item.restaurant.id, name: b.name, code: b.code, status: 'ACTIVE', createdAt: '', updatedAt: '' });
        }
        router.push('/dashboard');
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? 'Failed to load restaurant memberships');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadMemberships();
  }, [loadMemberships]);

  const selectRestaurant = (
    tenantId: string,
    tenantSlug: string,
    restaurant: RestaurantMembershipInfo['tenant']['restaurants'][number],
    branch?: { id: string; name: string; code: string },
  ) => {
    setCurrentTenant({ id: tenantId, name: restaurant.name, slug: tenantSlug, status: 'ACTIVE', createdAt: '', updatedAt: '' });
    setCurrentRestaurant({ id: restaurant.id, tenantId, name: restaurant.name, slug: restaurant.slug, status: 'ACTIVE', createdAt: '', updatedAt: '' });
    if (branch) {
      setCurrentBranch({ id: branch.id, restaurantId: restaurant.id, name: branch.name, code: branch.code, status: 'ACTIVE', createdAt: '', updatedAt: '' });
    }
    router.push('/dashboard');
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-sm font-semibold text-[#9AA6B2]">Loading your restaurants...</div>
      </div>
    );
  }

  const allRestaurants = memberships.flatMap((m) =>
    m.tenant.restaurants.map((r) => ({
      tenantId: m.tenant.id,
      tenantName: m.tenant.name,
      tenantSlug: m.tenant.slug,
      restaurant: r,
      role: m.role,
    })),
  );

  return (
    <div className="mx-auto max-w-4xl space-y-8 py-4">
      <div>
        <h1 className="text-3xl font-bold text-[#F5F7FA]">Choose Restaurant</h1>
        <p className="mt-2 text-sm text-[#9AA6B2]">
          Select the restaurant workspace you want to manage.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 p-4 text-xs text-[#EF4444]">
          {error}
        </div>
      )}

      {allRestaurants.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-[#26313C] bg-[#111820] p-12 text-center space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#18212B] text-2xl">
            🍽️
          </div>
          <h2 className="text-lg font-bold text-[#F5F7FA]">No Restaurants Found</h2>
          <p className="text-xs text-[#9AA6B2]">
            You do not have active memberships in any restaurant yet.
          </p>
          <button
            type="button"
            onClick={() => router.push('/signup')}
            className="rounded-xl bg-[#2AFEB7] px-4 py-2.5 text-xs font-bold text-[#0B0F14]"
          >
            + Create a Restaurant
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {allRestaurants.map(({ tenantId, tenantName, tenantSlug, restaurant, role }) => (
          <div
            key={restaurant.id}
            className="group flex flex-col justify-between rounded-2xl border border-[#26313C] bg-[#111820] p-6 shadow-xl transition-all hover:border-[#2AFEB7]/50 hover:shadow-2xl"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#18212B] text-xl">
                  🍴
                </div>
                <span className="rounded-full border border-[#2AFEB7]/30 bg-[#2AFEB7]/10 px-2.5 py-0.5 text-[10px] font-bold text-[#2AFEB7]">
                  {role}
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-[#F5F7FA] group-hover:text-[#2AFEB7]">
                  {restaurant.name}
                </h3>
                <p className="text-xs text-[#9AA6B2]">{tenantName}</p>
              </div>

              <div className="text-xs text-[#9AA6B2] pt-1">
                📍 {restaurant.branches?.length ?? 0}{' '}
                {restaurant.branches?.length === 1 ? 'branch' : 'branches'}
              </div>
            </div>

            <div className="pt-6">
              <button
                type="button"
                onClick={() =>
                  selectRestaurant(tenantId, tenantSlug, restaurant, restaurant.branches?.[0])
                }
                className="w-full rounded-xl bg-[#2AFEB7] py-2.5 text-xs font-bold text-[#0B0F14] transition-all hover:bg-[#22E5A4]"
              >
                Open Workspace →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

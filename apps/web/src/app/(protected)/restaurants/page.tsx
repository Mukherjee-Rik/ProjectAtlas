'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTenant } from '@/hooks/use-tenant';
import { apiClient } from '@/services/api-client';
import type { Restaurant } from '@/types/restaurant';

export default function RestaurantsPage() {
  const { currentTenant } = useTenant();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadRestaurants = useCallback(async () => {
    if (!currentTenant) {
      setRestaurants([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await apiClient.get<{ success: boolean; data: Restaurant[] }>(
        '/restaurants',
      );
      setRestaurants(response.data ?? []);
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? 'Unable to load restaurants for this organization.');
    } finally {
      setIsLoading(false);
    }
  }, [currentTenant]);

  useEffect(() => {
    void loadRestaurants();
  }, [loadRestaurants]);

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold text-[#F5F7FA]">
          Restaurants
        </h1>
        <p className="mt-2 text-[#9AA6B2]">
          Manage restaurants and branches under <span className="font-semibold text-[#F5F7FA]">{currentTenant?.name ?? 'your organization'}</span>.
        </p>
      </div>

      {isLoading ? (
        <div className="rounded-xl border border-[#26313C] bg-[#111820] p-8 text-center text-[#9AA6B2]">
          Loading organization restaurants...
        </div>
      ) : error ? (
        <div className="rounded-xl border border-[#EF4444]/40 bg-[#EF4444]/10 p-6 text-center text-[#EF4444]">
          <p className="font-semibold">{error}</p>
          <button
            type="button"
            onClick={loadRestaurants}
            className="mt-3 rounded-lg border border-[#EF4444]/40 px-3.5 py-1.5 text-xs text-[#F5F7FA] hover:bg-[#EF4444]/20"
          >
            Retry
          </button>
        </div>
      ) : restaurants.length === 0 ? (
        <div className="rounded-xl border border-[#26313C] bg-[#111820] p-8 shadow-xl text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#18212B] text-2xl text-[#2AFEB7]">
            🍽️
          </div>
          
          <h2 className="text-xl font-bold text-[#F5F7FA]">
            No Restaurants Registered
          </h2>

          <p className="max-w-md mx-auto text-sm text-[#9AA6B2]">
            No restaurants are currently registered under <span className="text-[#F5F7FA] font-medium">{currentTenant?.name ?? 'this organization'}</span>.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[#26313C] bg-[#111820] shadow-xl">
          <table className="w-full text-left">
            <thead className="border-b border-[#26313C] bg-[#18212B]">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[#9AA6B2]">
                  Restaurant Name
                </th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[#9AA6B2]">
                  Slug
                </th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[#9AA6B2]">
                  Status
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#26313C]">
              {restaurants.map((r) => (
                <tr key={r.id} className="transition-colors hover:bg-[#18212B]">
                  <td className="px-6 py-4 text-sm font-semibold text-[#F5F7FA]">
                    {r.name}
                  </td>
                  <td className="px-6 py-4 text-sm font-mono text-[#2AFEB7]">
                    {r.slug}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#22C55E]/15 px-3 py-1 text-xs font-semibold text-[#22C55E] border border-[#22C55E]/30">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E]" />
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

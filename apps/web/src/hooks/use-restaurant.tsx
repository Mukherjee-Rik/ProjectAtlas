'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Restaurant } from '@/types/restaurant';
import {
  getCurrentRestaurant,
  setCurrentRestaurant as saveCurrentRestaurant,
  clearCurrentRestaurant,
} from '@/lib/restaurant-storage';
import { getCurrentTenantId } from '@/lib/tenant-storage';
import { useTenant } from './use-tenant';
import { apiClient } from '@/services/api-client';

interface RestaurantContextValue {
  restaurants: Restaurant[];
  currentRestaurant: Restaurant | null;
  currentRestaurantId: string | null;
  isLoadingRestaurants: boolean;
  setCurrentRestaurant: (restaurant: Restaurant | null) => void;
  clearRestaurant: () => void;
  reloadRestaurants: () => Promise<void>;
}

const RestaurantContext = createContext<RestaurantContextValue | undefined>(
  undefined,
);

export function RestaurantProvider({ children }: { children: ReactNode }) {
  const { currentTenant } = useTenant();

  // Seeded from storage rather than in an effect, so a returning user's
  // restaurant-scoped requests — branches, the subscription check, the page's
  // own queries — all fire on the first render instead of waiting a commit for
  // this to arrive. The tenant guard is applied here too: a stored restaurant
  // belonging to another tenant is never adopted, even for one render.
  const [currentRestaurant, setCurrentRestaurantState] = useState<Restaurant | null>(() => {
    const stored = getCurrentRestaurant();
    if (!stored) return null;
    const tenantId = getCurrentTenantId();
    return tenantId && stored.tenantId !== tenantId ? null : stored;
  });
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoadingRestaurants, setIsLoadingRestaurants] = useState(false);

  // The seed above covers first render, so this only has to catch a tenant
  // switch afterwards: holding on to the previous tenant's restaurant would
  // leave it selected in the UI while the new tenant's list loads.
  useEffect(() => {
    if (!currentTenant || !currentRestaurant) return;
    if (currentRestaurant.tenantId === currentTenant.id) return;
    clearCurrentRestaurant();
    setCurrentRestaurantState(null);
  }, [currentTenant?.id, currentRestaurant]);

  const clearRestaurant = useCallback(() => {
    setCurrentRestaurantState(null);
    setRestaurants([]);
    clearCurrentRestaurant();
  }, []);

  const setCurrentRestaurant = useCallback((restaurant: Restaurant | null) => {
    setCurrentRestaurantState(restaurant);
    if (restaurant) {
      saveCurrentRestaurant(restaurant);
    } else {
      clearCurrentRestaurant();
    }
  }, []);

  const reloadRestaurants = useCallback(async () => {
    if (!currentTenant) {
      clearRestaurant();
      return;
    }

    setIsLoadingRestaurants(true);
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: Restaurant[];
      }>('/restaurants');

      const loadedRestaurants = response.data ?? [];
      setRestaurants(loadedRestaurants);

      // Use functional update to avoid capturing currentRestaurant as a dep (causes infinite loop)
      setCurrentRestaurantState((prevRestaurant) => {
        if (loadedRestaurants.length === 0) {
          clearCurrentRestaurant();
          return null;
        }

        if (!prevRestaurant || prevRestaurant.tenantId !== currentTenant.id) {
          saveCurrentRestaurant(loadedRestaurants[0]!);
          return loadedRestaurants[0]!;
        } else if (!loadedRestaurants.some((r) => r.id === prevRestaurant.id)) {
          const fallback = loadedRestaurants[0] ?? null;
          if (fallback) saveCurrentRestaurant(fallback);
          else clearCurrentRestaurant();
          return fallback;
        }
        return prevRestaurant;
      });
    } catch {
      // Ignore load error
    } finally {
      setIsLoadingRestaurants(false);
    }
    // ✅ currentRestaurant removed from deps - use functional setState instead
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTenant?.id, clearRestaurant]);

  useEffect(() => {
    if (currentTenant) {
      void reloadRestaurants();
    } else {
      clearRestaurant();
    }
  }, [currentTenant?.id, reloadRestaurants, clearRestaurant]);

  // Memoised because this provider wraps the whole app: without it every
  // consumer, and every effect keyed on the context value, re-runs on any
  // unrelated state change in a parent.
  const value = useMemo<RestaurantContextValue>(
    () => ({
      restaurants,
      currentRestaurant,
      currentRestaurantId: currentRestaurant?.id ?? null,
      isLoadingRestaurants,
      setCurrentRestaurant,
      clearRestaurant,
      reloadRestaurants,
    }),
    [
      restaurants,
      currentRestaurant,
      isLoadingRestaurants,
      setCurrentRestaurant,
      clearRestaurant,
      reloadRestaurants,
    ],
  );

  return (
    <RestaurantContext.Provider value={value}>
      {children}
    </RestaurantContext.Provider>
  );
}

export function useRestaurant() {
  const context = useContext(RestaurantContext);
  if (!context) {
    throw new Error('useRestaurant must be used within a RestaurantProvider');
  }
  return context;
}

'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { Restaurant } from '@/types/restaurant';
import {
  getCurrentRestaurant,
  setCurrentRestaurant as saveCurrentRestaurant,
  clearCurrentRestaurant,
} from '@/lib/restaurant-storage';
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
  const [currentRestaurant, setCurrentRestaurantState] = useState<Restaurant | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoadingRestaurants, setIsLoadingRestaurants] = useState(false);

  useEffect(() => {
    const stored = getCurrentRestaurant();
    if (stored) {
      if (currentTenant && stored.tenantId !== currentTenant.id) {
        clearCurrentRestaurant();
        setCurrentRestaurantState(null);
      } else {
        setCurrentRestaurantState(stored);
      }
    }
  }, [currentTenant?.id]);

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

  return (
    <RestaurantContext.Provider
      value={{
        restaurants,
        currentRestaurant,
        currentRestaurantId: currentRestaurant?.id ?? null,
        isLoadingRestaurants,
        setCurrentRestaurant,
        clearRestaurant,
        reloadRestaurants,
      }}
    >
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

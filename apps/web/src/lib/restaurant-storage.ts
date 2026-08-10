import type { Restaurant } from '@/types/restaurant';

const RESTAURANT_STORAGE_KEY = 'atlas_current_restaurant';

export function getCurrentRestaurantId(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const stored = localStorage.getItem(RESTAURANT_STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    return parsed?.id ?? null;
  } catch {
    return null;
  }
}

export function getCurrentRestaurant(): Restaurant | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const stored = localStorage.getItem(RESTAURANT_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function setCurrentRestaurant(restaurant: Restaurant): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(RESTAURANT_STORAGE_KEY, JSON.stringify(restaurant));
  }
}

export function clearCurrentRestaurant(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(RESTAURANT_STORAGE_KEY);
  }
}

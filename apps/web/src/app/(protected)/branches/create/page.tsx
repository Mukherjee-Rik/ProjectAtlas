'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/services/api-client';
import { useRestaurant } from '@/hooks/use-restaurant';
import { createBranch, type CreateBranchPayload } from '@/services/branches.service';
import { BranchForm } from '@/components/branches/branch-form';
import type { Restaurant } from '@/types/restaurant';

export default function CreateBranchPage() {
  const router = useRouter();
  const { currentRestaurant } = useRestaurant();

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoadingRestaurants, setIsLoadingRestaurants] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadRestaurants() {
      try {
        const response = await apiClient.get<{ success: boolean; data: Restaurant[] }>(
          '/restaurants',
        );
        setRestaurants(response.data ?? []);
      } catch (err: any) {
        setError(err?.message ?? 'Failed to load organization restaurants.');
      } finally {
        setIsLoadingRestaurants(false);
      }
    }

    void loadRestaurants();
  }, []);

  const handleSubmit = async (data: CreateBranchPayload) => {
    setIsSubmitting(true);
    setError('');

    // Scoping check
    const finalRestaurantId = currentRestaurant?.id ?? data.restaurantId;
    if (!finalRestaurantId) {
      setError('No restaurant selected.');
      setIsSubmitting(false);
      return;
    }

    try {
      await createBranch({
        ...data,
        restaurantId: finalRestaurantId,
      });
      router.push('/branches');
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? 'Failed to create branch.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingRestaurants) {
    return (
      <div className="space-y-6 max-w-3xl">
        <h1 className="font-display text-3xl font-semibold tracking-[-0.02em] text-foreground">Create Branch</h1>
        <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
          Loading available restaurants...
        </div>
      </div>
    );
  }

  if (restaurants.length === 0) {
    return (
      <div className="space-y-6 max-w-3xl">
        <h1 className="font-display text-3xl font-semibold tracking-[-0.02em] text-foreground">Create Branch</h1>
        <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground space-y-4">
          <p>You must register at least one restaurant before creating branches.</p>
          <button
            type="button"
            onClick={() => router.push('/restaurants')}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-background"
          >
            Go to Restaurants
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-[-0.02em] text-foreground">Create Branch</h1>
        <p className="mt-2 text-muted-foreground">Add a new operating branch location.</p>
      </div>

      {error && (
        <div className="rounded-lg border border-atlas-error/40 bg-atlas-error/10 p-4 text-sm text-atlas-error">
          {error}
        </div>
      )}

      <BranchForm
        initialValues={{ restaurantId: currentRestaurant?.id }}
        restaurants={restaurants}
        isLoading={isSubmitting}
        onSubmit={handleSubmit}
        onCancel={() => router.push('/branches')}
      />
    </div>
  );
}

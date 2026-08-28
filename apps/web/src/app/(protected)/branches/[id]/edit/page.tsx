'use client';

import { use, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getBranchById, updateBranch } from '@/services/branches.service';
import { BranchForm, type BranchFormData } from '@/components/branches/branch-form';
import type { Branch } from '@/types/branch';

export default function EditBranchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [branch, setBranch] = useState<Branch | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadBranch = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await getBranchById(id);
      setBranch(response.data);
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? 'Branch not found.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadBranch();
  }, [loadBranch]);

  const handleSubmit = async (data: BranchFormData) => {
    setIsSubmitting(true);
    setError('');

    try {
      await updateBranch(id, {
        name: data.name,
        code: data.code,
        address: data.address,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        phone: data.phone,
        status: data.status,
      });
      router.push(`/branches/${id}`);
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? 'Failed to update branch.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-3xl">
        <h1 className="font-display text-3xl font-semibold tracking-[-0.02em] text-foreground">Edit Branch</h1>
        <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
          Loading branch information...
        </div>
      </div>
    );
  }

  if (error || !branch) {
    return (
      <div className="space-y-6 max-w-3xl">
        <h1 className="font-display text-3xl font-semibold tracking-[-0.02em] text-foreground">Edit Branch</h1>
        <div className="rounded-xl border border-atlas-error/40 bg-atlas-error/10 p-8 text-center text-atlas-error">
          <p>{error || 'Branch not found.'}</p>
          <button
            type="button"
            onClick={() => router.push('/branches')}
            className="mt-4 rounded-lg border border-border bg-secondary px-4 py-2 text-sm text-foreground"
          >
            Back to Branches
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-[-0.02em] text-foreground">Edit Branch</h1>
        <p className="mt-2 text-muted-foreground">
          Updating <span className="font-semibold text-foreground">{branch.name}</span> ({branch.code}).
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-atlas-error/40 bg-atlas-error/10 p-4 text-sm text-atlas-error">
          {error}
        </div>
      )}

      <BranchForm
        isEdit
        initialValues={{
          restaurantId: branch.restaurantId,
          name: branch.name,
          code: branch.code,
          address: branch.address ?? undefined,
          city: branch.city ?? undefined,
          state: branch.state ?? undefined,
          postalCode: branch.postalCode ?? undefined,
          phone: branch.phone ?? undefined,
          status: branch.status,
        }}
        restaurants={[]}
        isLoading={isSubmitting}
        onSubmit={handleSubmit}
        onCancel={() => router.push(`/branches/${id}`)}
      />
    </div>
  );
}

'use client';

import { use, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getBranchById, deleteBranch } from '@/services/branches.service';
import type { Branch } from '@/types/branch';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

export default function BranchDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [branch, setBranch] = useState<Branch | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteBranch(id);
      router.push('/branches');
    } catch (err: any) {
      console.error(err);
      alert(err?.message ?? 'Failed to delete branch');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-3xl">
        <h1 className="font-display text-3xl font-semibold tracking-[-0.02em] text-foreground">Branch Details</h1>
        <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
          Loading branch information...
        </div>
      </div>
    );
  }

  if (error || !branch) {
    return (
      <div className="space-y-6 max-w-3xl">
        <h1 className="font-display text-3xl font-semibold tracking-[-0.02em] text-foreground">Branch Details</h1>
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
    <div className="space-y-8 max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-[-0.02em] text-foreground">
            {branch.name}
          </h1>
          <p className="mt-1 text-sm font-mono text-primary">
            Code: {branch.code}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.push(`/branches/${branch.id}/edit`)}
            className="rounded-lg border border-border bg-secondary px-4 py-2 text-sm font-semibold text-foreground hover:border-primary"
          >
            Edit
          </button>

          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="rounded-lg border border-atlas-error/40 bg-atlas-error/10 px-4 py-2 text-sm font-semibold text-atlas-error hover:bg-atlas-error/20"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border p-6 bg-secondary/40">
          <h2 className="text-xl font-bold text-foreground">Branch Overview</h2>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Restaurant
              </p>
              <p className="mt-1.5 text-base font-semibold text-foreground">
                {branch.restaurant?.name ?? '—'}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Status
              </p>
              <div className="mt-1.5">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-atlas-success/15 px-3 py-1 text-xs font-semibold text-atlas-success border border-atlas-success/30">
                  <span className="h-1.5 w-1.5 rounded-full bg-atlas-success" />
                  {branch.status}
                </span>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                City / State
              </p>
              <p className="mt-1.5 text-sm text-foreground">
                {branch.city ?? '—'}{branch.state ? `, ${branch.state}` : ''}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Postal Code
              </p>
              <p className="mt-1.5 text-sm text-foreground">
                {branch.postalCode ?? '—'}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Address
              </p>
              <p className="mt-1.5 text-sm text-foreground">
                {branch.address ?? '—'}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Phone
              </p>
              <p className="mt-1.5 text-sm text-foreground">
                {branch.phone ?? '—'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete Branch?"
        description={`Are you sure you want to delete "${branch.name}"? This action cannot be undone.`}
        confirmText={isDeleting ? 'Deleting...' : 'Delete'}
        cancelText="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}

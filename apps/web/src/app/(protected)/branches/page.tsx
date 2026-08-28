'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTenant } from '@/hooks/use-tenant';
import { useRestaurant } from '@/hooks/use-restaurant';
import { getBranches, deleteBranch } from '@/services/branches.service';
import type { Branch, BranchStatus } from '@/types/branch';
import { BranchesTableSkeleton } from '@/components/branches/branches-table-skeleton';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

export default function BranchesPage() {
  const router = useRouter();
  const { currentTenant } = useTenant();
  const { currentRestaurant } = useRestaurant();

  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | BranchStatus>('ALL');

  // Delete modal state
  const [deletingBranch, setDeletingBranch] = useState<Branch | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadBranches = useCallback(async () => {
    if (!currentTenant || !currentRestaurant) {
      setBranches([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await getBranches(currentRestaurant.id);
      setBranches(response.data ?? []);
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? 'Failed to load branches');
    } finally {
      setIsLoading(false);
    }
  }, [currentTenant, currentRestaurant?.id]);

  useEffect(() => {
    void loadBranches();
  }, [loadBranches]);

  const handleDeleteConfirm = async () => {
    if (!deletingBranch) return;
    setIsDeleting(true);

    try {
      await deleteBranch(deletingBranch.id);
      setDeletingBranch(null);
      await loadBranches();
    } catch (err: any) {
      console.error(err);
      alert(err?.message ?? 'Failed to delete branch');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredBranches = branches.filter((b) => {
    const matchesSearch =
      !search ||
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.code.toLowerCase().includes(search.toLowerCase()) ||
      (b.city && b.city.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus =
      statusFilter === 'ALL' || b.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-[-0.02em] text-foreground">Branches</h1>
          <p className="mt-2 text-muted-foreground">Manage operating branch locations.</p>
        </div>
        <BranchesTableSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header & Add Button */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-[-0.02em] text-foreground">
            Branches
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Branches under <span className="font-semibold text-foreground">{currentTenant?.name ?? 'your organization'}</span>.
          </p>
        </div>

        <button
          type="button"
          onClick={() => router.push('/branches/create')}
          className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-background transition-all hover:bg-primary-hover active:scale-[0.99]"
        >
          + Add Branch
        </button>
      </div>

      {/* Toolbar / Filters */}
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-md sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="search"
            placeholder="Search by name, code, city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-secondary px-3.5 py-2 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-primary sm:max-w-xs"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'ALL' | BranchStatus)}
            className="rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
          >
            <option value="ALL">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>
      </div>

      {/* Branches Table */}
      {error ? (
        <div className="rounded-xl border border-atlas-error/40 bg-atlas-error/10 p-6 text-center text-atlas-error">
          <p className="font-semibold">{error}</p>
          <button
            type="button"
            onClick={loadBranches}
            className="mt-3 rounded-lg border border-atlas-error/40 px-3.5 py-1.5 text-xs text-foreground hover:bg-atlas-error/20"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="table-responsive rounded-xl border border-border bg-card">
          <table className="w-full min-w-[700px] text-left">
            <thead className="border-b border-border bg-secondary">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Branch Name
                </th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Code
                </th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Restaurant
                </th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  City
                </th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Status
                </th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {filteredBranches.map((branch) => (
                <tr
                  key={branch.id}
                  onClick={() => router.push(`/branches/${branch.id}`)}
                  className="cursor-pointer transition-colors hover:bg-secondary"
                >
                  <td className="px-6 py-4 text-sm font-medium text-foreground">
                    {branch.name}
                  </td>

                  <td className="px-6 py-4 text-sm font-mono text-primary">
                    {branch.code}
                  </td>

                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {branch.restaurant?.name ?? '—'}
                  </td>

                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {branch.city ?? '—'}
                  </td>

                  <td className="px-6 py-4 text-sm">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-atlas-success/15 px-3 py-1 text-xs font-semibold text-atlas-success border border-atlas-success/30">
                      <span className="h-1.5 w-1.5 rounded-full bg-atlas-success" />
                      {branch.status}
                    </span>
                  </td>

                  <td
                    className="px-6 py-4 text-sm"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => router.push(`/branches/${branch.id}/edit`)}
                        className="rounded-lg border border-border bg-secondary px-2.5 py-1 text-xs text-foreground hover:border-primary"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingBranch(branch)}
                        className="rounded-lg border border-atlas-error/40 bg-atlas-error/10 px-2.5 py-1 text-xs text-atlas-error hover:bg-atlas-error/20"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredBranches.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              No branches found.
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        open={Boolean(deletingBranch)}
        title="Delete Branch?"
        description={`Are you sure you want to delete "${deletingBranch?.name}"? This action cannot be undone.`}
        confirmText={isDeleting ? 'Deleting...' : 'Delete'}
        cancelText="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingBranch(null)}
      />
    </div>
  );
}

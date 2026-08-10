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
        <h1 className="text-3xl font-bold text-[#F5F7FA]">Branch Details</h1>
        <div className="rounded-xl border border-[#26313C] bg-[#111820] p-8 text-center text-[#9AA6B2]">
          Loading branch information...
        </div>
      </div>
    );
  }

  if (error || !branch) {
    return (
      <div className="space-y-6 max-w-3xl">
        <h1 className="text-3xl font-bold text-[#F5F7FA]">Branch Details</h1>
        <div className="rounded-xl border border-[#EF4444]/40 bg-[#EF4444]/10 p-8 text-center text-[#EF4444]">
          <p>{error || 'Branch not found.'}</p>
          <button
            type="button"
            onClick={() => router.push('/branches')}
            className="mt-4 rounded-lg border border-[#26313C] bg-[#18212B] px-4 py-2 text-sm text-[#F5F7FA]"
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
          <h1 className="text-3xl font-bold text-[#F5F7FA]">
            {branch.name}
          </h1>
          <p className="mt-1 text-sm font-mono text-[#2AFEB7]">
            Code: {branch.code}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.push(`/branches/${branch.id}/edit`)}
            className="rounded-lg border border-[#26313C] bg-[#18212B] px-4 py-2 text-sm font-semibold text-[#F5F7FA] hover:border-[#2AFEB7]"
          >
            Edit
          </button>

          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="rounded-lg border border-[#EF4444]/40 bg-[#EF4444]/10 px-4 py-2 text-sm font-semibold text-[#EF4444] hover:bg-[#EF4444]/20"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#26313C] bg-[#111820] shadow-xl">
        <div className="border-b border-[#26313C] p-6 bg-[#18212B]/40">
          <h2 className="text-xl font-bold text-[#F5F7FA]">Branch Overview</h2>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#9AA6B2]">
                Restaurant
              </p>
              <p className="mt-1.5 text-base font-semibold text-[#F5F7FA]">
                {branch.restaurant?.name ?? '—'}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#9AA6B2]">
                Status
              </p>
              <div className="mt-1.5">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#22C55E]/15 px-3 py-1 text-xs font-semibold text-[#22C55E] border border-[#22C55E]/30">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E]" />
                  {branch.status}
                </span>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#9AA6B2]">
                City / State
              </p>
              <p className="mt-1.5 text-sm text-[#F5F7FA]">
                {branch.city ?? '—'}{branch.state ? `, ${branch.state}` : ''}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#9AA6B2]">
                Postal Code
              </p>
              <p className="mt-1.5 text-sm text-[#F5F7FA]">
                {branch.postalCode ?? '—'}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#9AA6B2]">
                Address
              </p>
              <p className="mt-1.5 text-sm text-[#F5F7FA]">
                {branch.address ?? '—'}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#9AA6B2]">
                Phone
              </p>
              <p className="mt-1.5 text-sm text-[#F5F7FA]">
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

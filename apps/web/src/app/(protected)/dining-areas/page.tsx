'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useBranch } from '@/hooks/use-branch';
import {
  getDiningAreas,
  createDiningArea,
  deleteDiningArea,
} from '@/services/dining-areas.service';
import type { DiningArea } from '@/types/dining-area';
import { DiningAreaForm, type DiningAreaFormData } from '@/components/dining-areas/dining-area-form';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

export default function DiningAreasPage() {
  const router = useRouter();
  const { currentBranch } = useBranch();

  const [diningAreas, setDiningAreas] = useState<DiningArea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal / Form state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete modal state
  const [deletingArea, setDeletingArea] = useState<DiningArea | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadDiningAreas = useCallback(async () => {
    if (!currentBranch) {
      setDiningAreas([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await getDiningAreas();
      setDiningAreas(response.data ?? []);
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? 'Failed to load dining areas');
    } finally {
      setIsLoading(false);
    }
  }, [currentBranch]);

  useEffect(() => {
    void loadDiningAreas();
  }, [loadDiningAreas]);

  const handleCreate = async (data: DiningAreaFormData) => {
    setIsSubmitting(true);
    setError('');

    try {
      await createDiningArea(data);
      setShowCreateModal(false);
      await loadDiningAreas();
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? 'Failed to create dining area');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingArea) return;
    setIsDeleting(true);

    try {
      await deleteDiningArea(deletingArea.id);
      setDeletingArea(null);
      await loadDiningAreas();
    } catch (err: any) {
      console.error(err);
      alert(err?.message ?? 'Failed to delete dining area');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!currentBranch) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-[#26313C] bg-[#111820] p-12 text-center shadow-xl space-y-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#18212B] text-2xl">
          📍
        </div>
        <h2 className="text-xl font-bold text-[#F5F7FA]">
          Select a branch to continue
        </h2>
        <p className="text-sm text-[#9AA6B2]">
          Choose the physical branch location you are currently operating in from the header selector.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header & Create CTA */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#F5F7FA]">
            Dining Areas
          </h1>
          <p className="mt-2 text-sm text-[#9AA6B2]">
            Seating areas for <span className="font-semibold text-[#F5F7FA]">{currentBranch.name}</span> ({currentBranch.code}).
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="rounded-lg bg-[#2AFEB7] px-4 py-2.5 text-sm font-semibold text-[#0B0F14] transition-all hover:bg-[#22E5A4] active:scale-[0.99]"
        >
          + Add Dining Area
        </button>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B0F14]/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-[#26313C] bg-[#111820] p-6 shadow-2xl space-y-6">
            <h2 className="text-xl font-bold text-[#F5F7FA]">Create Dining Area</h2>
            <DiningAreaForm
              isLoading={isSubmitting}
              onSubmit={handleCreate}
              onCancel={() => setShowCreateModal(false)}
            />
          </div>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="rounded-xl border border-[#26313C] bg-[#111820] p-8 text-center text-[#9AA6B2]">
          Loading dining areas...
        </div>
      ) : error ? (
        <div className="rounded-xl border border-[#EF4444]/40 bg-[#EF4444]/10 p-6 text-center text-[#EF4444]">
          <p>{error}</p>
        </div>
      ) : (
        <div className="table-responsive rounded-xl border border-[#26313C] bg-[#111820] shadow-xl">
          <table className="w-full min-w-[600px] text-left">
            <thead className="border-b border-[#26313C] bg-[#18212B]">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[#9AA6B2]">
                  Dining Area
                </th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[#9AA6B2]">
                  Code
                </th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[#9AA6B2]">
                  Tables
                </th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[#9AA6B2]">
                  Status
                </th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[#9AA6B2]">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#26313C]">
              {diningAreas.map((area) => (
                <tr key={area.id} className="transition-colors hover:bg-[#18212B]">
                  <td className="px-6 py-4 text-sm font-semibold text-[#F5F7FA]">
                    {area.name}
                  </td>

                  <td className="px-6 py-4 text-sm font-mono text-[#2AFEB7]">
                    {area.code}
                  </td>

                  <td className="px-6 py-4 text-sm text-[#9AA6B2]">
                    {area._count?.tables ?? 0} tables
                  </td>

                  <td className="px-6 py-4 text-sm">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#22C55E]/15 px-3 py-1 text-xs font-semibold text-[#22C55E] border border-[#22C55E]/30">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E]" />
                      {area.status}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-sm">
                    <button
                      type="button"
                      onClick={() => setDeletingArea(area)}
                      className="rounded-lg border border-[#EF4444]/40 bg-[#EF4444]/10 px-2.5 py-1 text-xs text-[#EF4444] hover:bg-[#EF4444]/20"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {diningAreas.length === 0 && (
            <div className="p-8 text-center text-[#9AA6B2]">
              No dining areas found. Create your first dining area to start adding tables.
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        open={Boolean(deletingArea)}
        title="Delete Dining Area?"
        description={`Are you sure you want to delete "${deletingArea?.name}"? All tables inside this area will also be removed.`}
        confirmText={isDeleting ? 'Deleting...' : 'Delete'}
        cancelText="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingArea(null)}
      />
    </div>
  );
}

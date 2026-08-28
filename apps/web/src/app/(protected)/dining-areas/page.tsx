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
      <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card p-12 text-center space-y-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-2xl">
          📍
        </div>
        <h2 className="text-xl font-bold text-foreground">
          Select a branch to continue
        </h2>
        <p className="text-sm text-muted-foreground">
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
          <h1 className="font-display text-3xl font-semibold tracking-[-0.02em] text-foreground">
            Dining Areas
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Seating areas for <span className="font-semibold text-foreground">{currentBranch.name}</span> ({currentBranch.code}).
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-background transition-all hover:bg-primary-hover active:scale-[0.99]"
        >
          + Add Dining Area
        </button>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 space-y-6">
            <h2 className="text-xl font-bold text-foreground">Create Dining Area</h2>
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
        <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
          Loading dining areas...
        </div>
      ) : error ? (
        <div className="rounded-xl border border-atlas-error/40 bg-atlas-error/10 p-6 text-center text-atlas-error">
          <p>{error}</p>
        </div>
      ) : (
        <div className="table-responsive rounded-xl border border-border bg-card">
          <table className="w-full min-w-[600px] text-left">
            <thead className="border-b border-border bg-secondary">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Dining Area
                </th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Code
                </th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Tables
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
              {diningAreas.map((area) => (
                <tr key={area.id} className="transition-colors hover:bg-secondary">
                  <td className="px-6 py-4 text-sm font-semibold text-foreground">
                    {area.name}
                  </td>

                  <td className="px-6 py-4 text-sm font-mono text-primary">
                    {area.code}
                  </td>

                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {area._count?.tables ?? 0} tables
                  </td>

                  <td className="px-6 py-4 text-sm">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-atlas-success/15 px-3 py-1 text-xs font-semibold text-atlas-success border border-atlas-success/30">
                      <span className="h-1.5 w-1.5 rounded-full bg-atlas-success" />
                      {area.status}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-sm">
                    <button
                      type="button"
                      onClick={() => setDeletingArea(area)}
                      className="rounded-lg border border-atlas-error/40 bg-atlas-error/10 px-2.5 py-1 text-xs text-atlas-error hover:bg-atlas-error/20"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {diningAreas.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
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

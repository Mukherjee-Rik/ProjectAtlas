'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useBranch } from '@/hooks/use-branch';
import { getTables, deleteTable } from '@/services/tables.service';
import { getDiningAreas } from '@/services/dining-areas.service';
import type { RestaurantTable, TableStatus } from '@/types/table';
import type { DiningArea } from '@/types/dining-area';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DataCache } from '@/lib/data-cache';

export default function TablesPage() {
  const router = useRouter();
  const { currentBranch } = useBranch();

  const cacheKeyTables = currentBranch ? `tables_${currentBranch.id}` : null;
  const cacheKeyAreas = currentBranch ? `areas_${currentBranch.id}` : null;

  const cachedTables = cacheKeyTables ? DataCache.get<RestaurantTable[]>(cacheKeyTables) : null;
  const cachedAreas = cacheKeyAreas ? DataCache.get<DiningArea[]>(cacheKeyAreas) : null;

  const [tables, setTables] = useState<RestaurantTable[]>(cachedTables || []);
  const [diningAreas, setDiningAreas] = useState<DiningArea[]>(cachedAreas || []);
  const [isLoading, setIsLoading] = useState(!cachedTables && !cachedAreas);
  const [error, setError] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [diningAreaFilter, setDiningAreaFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | TableStatus>('ALL');

  // Delete modal state
  const [deletingTable, setDeletingTable] = useState<RestaurantTable | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = useCallback(async () => {
    if (!currentBranch) {
      setTables([]);
      setDiningAreas([]);
      setIsLoading(false);
      return;
    }

    if (!DataCache.get(`tables_${currentBranch.id}`)) {
      setIsLoading(true);
    }
    setError('');

    try {
      const [tablesRes, areasRes] = await Promise.all([
        getTables(),
        getDiningAreas(),
      ]);

      const fetchedTables = tablesRes.data ?? [];
      const fetchedAreas = areasRes.data ?? [];

      setTables(fetchedTables);
      setDiningAreas(fetchedAreas);

      DataCache.set(`tables_${currentBranch.id}`, fetchedTables);
      DataCache.set(`areas_${currentBranch.id}`, fetchedAreas);
    } catch (err: any) {
      console.error(err);
      if (!cachedTables) {
        setError(err?.message ?? 'Failed to load tables data');
      }
    } finally {
      setIsLoading(false);
    }
  }, [currentBranch, cachedTables]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleDeleteConfirm = async () => {
    if (!deletingTable) return;
    setIsDeleting(true);

    try {
      await deleteTable(deletingTable.id);
      setDeletingTable(null);
      await loadData();
    } catch (err: any) {
      console.error(err);
      alert(err?.message ?? 'Failed to delete table');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredTables = (tables || []).filter((t) => {
    if (!t) return false;
    const tableName = (t.name || '').toLowerCase();
    const tableCode = (t.code || '').toLowerCase();
    const searchTerm = (search || '').toLowerCase();

    const matchesSearch =
      !search ||
      tableName.includes(searchTerm) ||
      tableCode.includes(searchTerm);

    const matchesArea =
      diningAreaFilter === 'ALL' || t.diningAreaId === diningAreaFilter;

    const matchesStatus =
      statusFilter === 'ALL' || t.status === statusFilter;

    return matchesSearch && matchesArea && matchesStatus;
  });

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
      {/* Header & Add CTA */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#F5F7FA]">
            Tables
          </h1>
          <p className="mt-2 text-sm text-[#9AA6B2]">
            Dining tables in <span className="font-semibold text-[#F5F7FA]">{currentBranch.name}</span> ({currentBranch.code}).
          </p>
        </div>

        <button
          type="button"
          onClick={() => router.push('/tables/create')}
          className="rounded-lg bg-[#2AFEB7] px-4 py-2.5 text-sm font-semibold text-[#0B0F14] transition-all hover:bg-[#22E5A4] active:scale-[0.99]"
        >
          + Add Table
        </button>
      </div>

      {/* Toolbar / Filters */}
      <div className="flex flex-col gap-4 rounded-xl border border-[#26313C] bg-[#111820] p-4 shadow-md sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="search"
            placeholder="Search by name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-[#26313C] bg-[#18212B] px-3.5 py-2 text-sm text-[#F5F7FA] placeholder-[#9AA6B2] outline-none focus:border-[#2AFEB7] sm:max-w-xs"
          />

          <select
            value={diningAreaFilter}
            onChange={(e) => setDiningAreaFilter(e.target.value)}
            className="rounded-lg border border-[#26313C] bg-[#18212B] px-3 py-2 text-sm text-[#F5F7FA] outline-none focus:border-[#2AFEB7]"
          >
            <option value="ALL">All Dining Areas</option>
            {diningAreas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.code})
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'ALL' | TableStatus)}
            className="rounded-lg border border-[#26313C] bg-[#18212B] px-3 py-2 text-sm text-[#F5F7FA] outline-none focus:border-[#2AFEB7]"
          >
            <option value="ALL">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>

      {/* Tables Table */}
      {isLoading ? (
        <div className="rounded-xl border border-[#26313C] bg-[#111820] p-8 text-center text-[#9AA6B2]">
          Loading tables...
        </div>
      ) : error ? (
        <div className="rounded-xl border border-[#EF4444]/40 bg-[#EF4444]/10 p-6 text-center text-[#EF4444]">
          <p>{error}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[#26313C] bg-[#111820] shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left">
              <thead className="border-b border-[#26313C] bg-[#18212B]">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[#9AA6B2]">
                    Table Name
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[#9AA6B2]">
                    Code
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[#9AA6B2]">
                    Dining Area
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[#9AA6B2]">
                    Capacity
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
                {filteredTables.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => router.push(`/tables/${t.id}`)}
                    className="cursor-pointer transition-colors hover:bg-[#18212B]"
                  >
                    <td className="px-6 py-4 text-sm font-semibold text-[#F5F7FA]">
                      {t.name}
                    </td>

                    <td className="px-6 py-4 text-sm font-mono text-[#2AFEB7]">
                      {t.code}
                    </td>

                    <td className="px-6 py-4 text-sm text-[#9AA6B2]">
                      {t.diningArea?.name ?? '—'}
                    </td>

                    <td className="px-6 py-4 text-sm text-[#F5F7FA]">
                      👥 {t.capacity} seats
                    </td>

                    <td className="px-6 py-4 text-sm">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#22C55E]/15 px-3 py-1 text-xs font-semibold text-[#22C55E] border border-[#22C55E]/30">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E]" />
                        {t.status}
                      </span>
                    </td>

                    <td
                      className="px-6 py-4 text-sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => router.push(`/tables/${t.id}/edit`)}
                          className="rounded-lg border border-[#26313C] bg-[#18212B] px-2.5 py-1 text-xs text-[#F5F7FA] hover:border-[#2AFEB7]"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingTable(t)}
                          className="rounded-lg border border-[#EF4444]/40 bg-[#EF4444]/10 px-2.5 py-1 text-xs text-[#EF4444] hover:bg-[#EF4444]/20"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredTables.length === 0 && (
            <div className="p-8 text-center text-[#9AA6B2]">
              No tables found.
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        open={Boolean(deletingTable)}
        title="Delete Table?"
        description={`Are you sure you want to delete "${deletingTable?.name}" (${deletingTable?.code})? This action cannot be undone.`}
        confirmText={isDeleting ? 'Deleting...' : 'Delete'}
        cancelText="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingTable(null)}
      />
    </div>
  );
}

'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useBranch } from '@/hooks/use-branch';
import { getTables, deleteTable } from '@/services/tables.service';
import { getDiningAreas } from '@/services/dining-areas.service';
import type { RestaurantTable, TableStatus } from '@/types/table';
import type { DiningArea } from '@/types/dining-area';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Pagination } from '@/components/ui/pagination';
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

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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

  const totalPages = Math.ceil(filteredTables.length / pageSize) || 1;
  const paginatedTables = filteredTables.slice((page - 1) * pageSize, page * pageSize);

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
      {/* Header & Add CTA */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-[-0.02em] text-foreground">
            Tables
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Dining tables in <span className="font-semibold text-foreground">{currentBranch.name}</span> ({currentBranch.code}).
          </p>
        </div>

        <button
          type="button"
          onClick={() => router.push('/tables/create')}
          className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-background transition-all hover:bg-primary-hover active:scale-[0.99]"
        >
          + Add Table
        </button>
      </div>

      {/* Toolbar / Filters */}
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-md sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        {/* flex-wrap + min-w-0: at tablet width the sidebar appears and this
            row had no room for the search box plus both selects, pushing the
            whole page wider than the viewport. */}
        <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <input
            type="search"
            placeholder="Search by name or code..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-border bg-secondary px-3.5 py-2 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-primary sm:max-w-xs"
          />

          <select
            value={diningAreaFilter}
            onChange={(e) => {
              setDiningAreaFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
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
            onChange={(e) => {
              setStatusFilter(e.target.value as 'ALL' | TableStatus);
              setPage(1);
            }}
            className="rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
          >
            <option value="ALL">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>

      {/* Tables Table */}
      {isLoading ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
          Loading tables...
        </div>
      ) : error ? (
        <div className="rounded-xl border border-atlas-error/40 bg-atlas-error/10 p-6 text-center text-atlas-error">
          <p>{error}</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="table-responsive rounded-xl border border-border bg-card">
            <table className="w-full min-w-[700px] text-left">
            <thead className="border-b border-border bg-secondary">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Table Name
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Code
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Dining Area
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Capacity
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
                {paginatedTables.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => router.push(`/tables/${t.id}`)}
                    className="cursor-pointer transition-colors hover:bg-secondary"
                  >
                    <td className="px-6 py-4 text-sm font-semibold text-foreground">
                      {t.name}
                    </td>

                    <td className="px-6 py-4 text-sm font-mono text-primary">
                      {t.code}
                    </td>

                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {t.diningArea?.name ?? '—'}
                    </td>

                    <td className="px-6 py-4 text-sm text-foreground">
                      👥 {t.capacity} seats
                    </td>

                    <td className="px-6 py-4 text-sm">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-atlas-success/15 px-3 py-1 text-xs font-semibold text-atlas-success border border-atlas-success/30">
                        <span className="h-1.5 w-1.5 rounded-full bg-atlas-success" />
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
                          className="rounded-lg border border-border bg-secondary px-2.5 py-1 text-xs text-foreground hover:border-primary"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingTable(t)}
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

            {filteredTables.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                No tables found.
              </div>
            )}
          </div>

          {filteredTables.length > 0 && (
            <div className="pt-2">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
                totalItems={filteredTables.length}
                pageSize={pageSize}
                pageSizeOptions={[10, 25, 50]}
                onPageSizeChange={(newSize) => {
                  setPageSize(newSize);
                  setPage(1);
                }}
              />
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

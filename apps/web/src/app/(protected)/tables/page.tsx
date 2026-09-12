'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MapPin, Users } from 'lucide-react';

import { useBranch } from '@/hooks/use-branch';
import { useDiningAreas } from '@/hooks/use-dining-areas';
import { useDeleteTable, useTables } from '@/hooks/use-tables';
import type { RestaurantTable, TableStatus } from '@/types/table';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DataTable, type Column } from '@/components/ui/data-table';
import {
  Badge,
  EmptyState,
  ErrorPanel,
  PageHeader,
  SkeletonTable,
  type BadgeTone,
} from '@/components/ui/primitives';
import { useToast } from '@/components/ui/toast';

/**
 * The pill used to be a hardcoded green regardless of the value it rendered,
 * so an inactive table looked as healthy as a live one. Colour is the fastest
 * signal in an operations table, so it has to follow the data.
 */
const STATUS_TONE: Record<TableStatus, BadgeTone> = {
  ACTIVE: 'success',
  INACTIVE: 'neutral',
};

export default function TablesPage() {
  const router = useRouter();
  const { currentBranch } = useBranch();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [diningAreaFilter, setDiningAreaFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | TableStatus>('ALL');

  const [deletingTable, setDeletingTable] = useState<RestaurantTable | null>(null);

  const { data: tables = [], isPending, isError, error, refetch } = useTables();
  const { data: diningAreas = [] } = useDiningAreas();
  const deleteTable = useDeleteTable();

  const handleDeleteConfirm = () => {
    if (!deletingTable) return;

    deleteTable.mutate(deletingTable.id, {
      onSuccess: () => {
        toast.success(`${deletingTable.name} was deleted.`);
        setDeletingTable(null);
      },
      onError: (err: unknown) => {
        setDeletingTable(null);
        toast.error(err instanceof Error ? err.message : 'Could not delete the table.');
      },
    });
  };

  // Filtering the whole branch's tables on every keystroke is cheap, but doing
  // it inside JSX would redo it for each of the two DataTable layouts as well.
  const filteredTables = useMemo(() => {
    const term = search.trim().toLowerCase();

    return tables.filter((t) => {
      const matchesSearch =
        !term ||
        (t.name ?? '').toLowerCase().includes(term) ||
        (t.code ?? '').toLowerCase().includes(term);

      const matchesArea = diningAreaFilter === 'ALL' || t.diningAreaId === diningAreaFilter;
      const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;

      return matchesSearch && matchesArea && matchesStatus;
    });
  }, [tables, search, diningAreaFilter, statusFilter]);

  const columns: Column<RestaurantTable>[] = useMemo(
    () => [
      {
        key: 'name',
        header: 'Table Name',
        primary: true,
        render: (t) => (
          <div className="min-w-0">
            {/* The link carries navigation so the row is reachable by keyboard;
                the row's own onClick stays a pointer convenience. */}
            <Link
              href={`/tables/${t.id}`}
              onClick={(e) => e.stopPropagation()}
              className="font-semibold text-foreground transition-colors hover:text-primary"
            >
              {t.name}
            </Link>
            <div className="font-mono text-xs text-primary md:hidden">{t.code}</div>
          </div>
        ),
      },
      {
        key: 'code',
        header: 'Code',
        hideOnMobile: true,
        cellClassName: 'font-mono text-primary',
        render: (t) => t.code,
      },
      {
        key: 'diningArea',
        header: 'Dining Area',
        cellClassName: 'text-muted-foreground',
        render: (t) => t.diningArea?.name ?? '—',
      },
      {
        key: 'capacity',
        header: 'Capacity',
        render: (t) => (
          <span className="inline-flex items-center gap-1.5 text-foreground">
            <Users className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
            {t.capacity} seats
          </span>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        render: (t) => (
          <Badge tone={STATUS_TONE[t.status] ?? 'neutral'} withDot>
            {t.status}
          </Badge>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        unlabelledOnMobile: true,
        render: (t) => (
          <div
            className="flex flex-wrap items-center gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            <Button size="sm" onClick={() => router.push(`/tables/${t.id}/edit`)}>
              Edit
            </Button>
            <Button variant="danger" size="sm" onClick={() => setDeletingTable(t)}>
              Delete
            </Button>
          </div>
        ),
      },
    ],
    [router],
  );

  if (!currentBranch) {
    return (
      <EmptyState
        icon={<MapPin className="h-6 w-6" aria-hidden="true" />}
        title="Select a branch to continue"
        description="Choose the physical branch location you are currently operating in from the header selector."
      />
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Tables"
        description={
          <>
            Dining tables in{' '}
            <span className="font-semibold text-foreground">{currentBranch.name}</span> (
            {currentBranch.code}).
          </>
        }
        actions={
          <Button variant="primary" onClick={() => router.push('/tables/create')}>
            Add Table
          </Button>
        }
      />

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:flex-wrap sm:items-center">
        <label className="sr-only" htmlFor="table-search">
          Search tables
        </label>
        <input
          id="table-search"
          type="search"
          placeholder="Search by name or code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full min-w-0 rounded-lg border border-border bg-secondary px-3.5 py-2 text-sm text-foreground placeholder-muted-foreground outline-none transition-colors focus:border-primary sm:max-w-xs"
        />

        <label className="sr-only" htmlFor="table-area-filter">
          Filter by dining area
        </label>
        <select
          id="table-area-filter"
          value={diningAreaFilter}
          onChange={(e) => setDiningAreaFilter(e.target.value)}
          className="min-w-0 rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
        >
          <option value="ALL">All Dining Areas</option>
          {diningAreas.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name} ({a.code})
            </option>
          ))}
        </select>

        <label className="sr-only" htmlFor="table-status-filter">
          Filter by status
        </label>
        <select
          id="table-status-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'ALL' | TableStatus)}
          className="min-w-0 rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
        >
          <option value="ALL">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      {isPending ? (
        <SkeletonTable rows={10} columns={6} />
      ) : isError ? (
        <ErrorPanel
          message={error instanceof Error ? error.message : 'Failed to load tables data'}
          onRetry={() => void refetch()}
        />
      ) : (
        <DataTable
          caption="Dining tables"
          columns={columns}
          rows={filteredTables}
          rowKey={(t) => t.id}
          onRowClick={(t) => router.push(`/tables/${t.id}`)}
          emptyState={
            <EmptyState
              icon={<Users className="h-6 w-6" aria-hidden="true" />}
              title="No tables found"
              description={
                tables.length === 0
                  ? 'Add the first table in this branch to start taking orders.'
                  : 'No table matches the current filters.'
              }
              action={
                tables.length === 0 ? (
                  <Button variant="primary" onClick={() => router.push('/tables/create')}>
                    Add Table
                  </Button>
                ) : undefined
              }
            />
          }
        />
      )}

      <ConfirmDialog
        open={Boolean(deletingTable)}
        title="Delete Table?"
        description={`Are you sure you want to delete "${deletingTable?.name}" (${deletingTable?.code})? This action cannot be undone.`}
        confirmText="Delete"
        confirmLoadingText="Deleting…"
        cancelText="Cancel"
        isLoading={deleteTable.isPending}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingTable(null)}
      />
    </div>
  );
}

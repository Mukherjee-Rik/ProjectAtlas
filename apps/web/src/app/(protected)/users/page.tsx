'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Users } from 'lucide-react';

import { useRestaurant } from '@/hooks/use-restaurant';
import { useUsers } from '@/hooks/use-users';
import type { User, UserRole, UserStatus } from '@/types/user';

import { Button } from '@/components/ui/button';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Pagination } from '@/components/ui/pagination';
import {
  EmptyState,
  ErrorPanel,
  PageHeader,
  SkeletonTable,
} from '@/components/ui/primitives';
import { UserRoleBadge } from '@/components/users/user-role-badge';
import { UserStatusBadge } from '@/components/users/user-status-badge';

const PAGE_SIZE_OPTIONS = [10, 25, 50];

export default function UsersPage() {
  const router = useRouter();
  const { currentRestaurant } = useRestaurant();

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | UserRole>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | UserStatus>('ALL');

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Only the settled value reaches the query key. Sending every keystroke cost
  // a round trip per character and, with the old blocking spinner, threw the
  // search field away mid-word.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setCurrentPage(1);
    }, 250);

    return () => clearTimeout(timer);
  }, [search]);

  const { data, isPending, isError, error, refetch } = useUsers({
    search: debouncedSearch || undefined,
    role: roleFilter === 'ALL' ? undefined : roleFilter,
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    page: currentPage,
    limit: pageSize,
  });

  const users = data?.users ?? [];
  const totalUsers = data?.meta.total ?? users.length;
  const totalPages = data?.meta.totalPages ?? 1;

  const hasFilters = Boolean(search) || roleFilter !== 'ALL' || statusFilter !== 'ALL';

  function handleClearFilters() {
    setSearch('');
    setRoleFilter('ALL');
    setStatusFilter('ALL');
    setCurrentPage(1);
  }

  const columns: Column<User>[] = useMemo(
    () => [
      {
        key: 'name',
        header: 'Staff Name',
        primary: true,
        render: (user) => (
          // The link, not the row, is what carries navigation: a bare `<tr
          // onClick>` is unreachable by keyboard and silent to screen readers.
          <Link
            href={`/users/${user.id}`}
            onClick={(e) => e.stopPropagation()}
            className="font-semibold text-foreground transition-colors hover:text-primary"
          >
            {user.name}
          </Link>
        ),
      },
      {
        key: 'email',
        header: 'Email',
        cellClassName: 'text-muted-foreground',
        // An address has no break opportunity, so without this the cell sets
        // the column's min-content width and the table stops shrinking.
        render: (user) => <span className="break-all">{user.email}</span>,
      },
      {
        key: 'phone',
        header: 'Phone',
        hideOnMobile: true,
        cellClassName: 'text-muted-foreground',
        render: (user) => user.phone ?? '—',
      },
      {
        key: 'role',
        header: 'Role',
        render: (user) => <UserRoleBadge role={user.role} />,
      },
      {
        key: 'status',
        header: 'Status',
        render: (user) => <UserStatusBadge status={user.status} />,
      },
    ],
    [],
  );

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Restaurant Team"
        description={
          <>
            Managers, waiters, kitchen staff and cashiers working at{' '}
            <span className="font-semibold text-foreground">
              {currentRestaurant?.name ?? 'your restaurant'}
            </span>
            .
          </>
        }
        actions={
          <Button variant="primary" onClick={() => router.push('/users/create')}>
            Add Staff Member
          </Button>
        }
      />

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <label className="sr-only" htmlFor="staff-search">
            Search staff
          </label>
          <input
            id="staff-search"
            type="search"
            placeholder="Search by name, email, phone..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full min-w-0 rounded-lg border border-border bg-secondary px-3.5 py-2 text-sm text-foreground placeholder-muted-foreground outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary sm:max-w-xs"
          />

          <label className="sr-only" htmlFor="staff-role-filter">
            Filter by role
          </label>
          <select
            id="staff-role-filter"
            value={roleFilter}
            onChange={(event) => {
              setRoleFilter(event.target.value as 'ALL' | UserRole);
              setCurrentPage(1);
            }}
            className="min-w-0 rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          >
            <option value="ALL">All Roles</option>
            <option value="OWNER">Owner</option>
            <option value="MANAGER">Manager</option>
            <option value="CASHIER">Cashier</option>
            <option value="WAITER">Waiter</option>
            <option value="KITCHEN">Kitchen Staff</option>
            <option value="STAFF">General Staff</option>
          </select>

          <label className="sr-only" htmlFor="staff-status-filter">
            Filter by status
          </label>
          <select
            id="staff-status-filter"
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value as 'ALL' | UserStatus);
              setCurrentPage(1);
            }}
            className="min-w-0 rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          >
            <option value="ALL">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>

        {hasFilters && (
          <Button className="shrink-0" onClick={handleClearFilters}>
            Clear filters
          </Button>
        )}
      </div>

      {isPending ? (
        <SkeletonTable rows={10} columns={5} />
      ) : isError ? (
        <ErrorPanel
          message={error instanceof Error ? error.message : 'Unable to load restaurant staff.'}
          onRetry={() => void refetch()}
        />
      ) : (
        <>
          <DataTable
            caption="Restaurant staff"
            columns={columns}
            rows={users}
            rowKey={(user) => user.id}
            onRowClick={(user) => router.push(`/users/${user.id}`)}
            // The list is paginated server-side, so DataTable must not slice
            // the page it was handed — and the page-size control has to write
            // back into the request, which only this component can do.
            enablePagination={false}
            emptyState={
              <EmptyState
                icon={<Users className="h-6 w-6" aria-hidden="true" />}
                title="No staff members found"
                description={
                  hasFilters
                    ? 'No team member matches the current filters.'
                    : 'Add your first team member to start assigning shifts and roles.'
                }
                action={
                  hasFilters ? (
                    <Button onClick={handleClearFilters}>Clear filters</Button>
                  ) : (
                    <Button variant="primary" onClick={() => router.push('/users/create')}>
                      Add Staff Member
                    </Button>
                  )
                }
              />
            }
          />

          <Pagination
            className="rounded-xl border border-border"
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={totalUsers}
            pageSize={pageSize}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
          />
        </>
      )}
    </div>
  );
}

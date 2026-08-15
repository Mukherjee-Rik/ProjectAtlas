'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { getUsers } from '@/services/users.service';
import { useRestaurant } from '@/hooks/use-restaurant';
import type { User, UserRole, UserStatus } from '@/types/user';

import { PageError } from '@/components/ui/page-error';
import { UsersTableSkeleton } from '@/components/users/users-table-skeleton';
import { UserRoleBadge } from '@/components/users/user-role-badge';
import { UserStatusBadge } from '@/components/users/user-status-badge';

export default function UsersPage() {
  const router = useRouter();
  const { currentRestaurant } = useRestaurant();

  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Filtering & Search state
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | UserRole>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | UserStatus>('ALL');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await getUsers({
        search: search.trim() || undefined,
        role: roleFilter === 'ALL' ? undefined : roleFilter,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        page: currentPage,
        limit: pageSize,
      });

      const usersList = Array.isArray(response?.data)
        ? response.data
        : (response?.data as any)?.data ?? [];

      const meta = response?.meta ?? (response?.data as any)?.meta ?? {
        total: usersList.length,
        totalPages: 1,
      };

      setUsers(usersList);
      setTotalUsers(meta.total ?? usersList.length);
      setTotalPages(meta.totalPages ?? 1);
    } catch (err) {
      console.error(err);
      setError('Unable to load restaurant staff.');
    } finally {
      setIsLoading(false);
    }
  }, [search, roleFilter, statusFilter, currentPage]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  function handleClearFilters() {
    setSearch('');
    setRoleFilter('ALL');
    setStatusFilter('ALL');
    setCurrentPage(1);
  }

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#F5F7FA]">Restaurant Team</h1>
            <p className="mt-2 text-sm text-[#9AA6B2]">Manage employees and staff members.</p>
          </div>
        </div>
        <UsersTableSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <PageError
        message={error}
        onRetry={loadUsers}
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Header & Add Employee Button */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#F5F7FA]">
            Restaurant Team & Staff
          </h1>

          <p className="mt-2 text-sm text-[#9AA6B2]">
            Manage employees working at <span className="font-semibold text-[#2AFEB7]">{currentRestaurant?.name ?? 'your restaurant'}</span> (Managers, Waiters, Kitchen Staff, Cashiers).
          </p>

          <p className="mt-1 text-xs font-medium text-[#9AA6B2]">
            Showing {users.length} of {totalUsers} team members
          </p>
        </div>

        <button
          type="button"
          onClick={() => router.push('/users/create')}
          className="rounded-xl bg-[#2AFEB7] px-4 py-2.5 text-sm font-bold text-[#0B0F14] transition-all hover:bg-[#22E5A4] active:scale-[0.99]"
        >
          + Add Staff Member
        </button>
      </div>

      {/* Toolbar / Filters */}
      <div className="flex flex-col gap-4 rounded-xl border border-[#26313C] bg-[#111820] p-4 shadow-md md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="search"
            placeholder="Search by name, email, phone..."
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-lg border border-[#26313C] bg-[#18212B] px-3.5 py-2 text-sm text-[#F5F7FA] placeholder-[#9AA6B2] transition-colors outline-none focus:border-[#2AFEB7] focus:ring-1 focus:ring-[#2AFEB7] sm:max-w-xs"
          />

          <select
            value={roleFilter}
            onChange={(event) => {
              setRoleFilter(event.target.value as 'ALL' | UserRole);
              setCurrentPage(1);
            }}
            className="rounded-lg border border-[#26313C] bg-[#18212B] px-3 py-2 text-sm text-[#F5F7FA] outline-none focus:border-[#2AFEB7] focus:ring-1 focus:ring-[#2AFEB7]"
          >
            <option value="ALL">All Roles</option>
            <option value="OWNER">Owner</option>
            <option value="MANAGER">Manager</option>
            <option value="WAITER">Waiter</option>
            <option value="KITCHEN">Kitchen Staff</option>
            <option value="STAFF">General Staff</option>
          </select>

          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value as 'ALL' | UserStatus);
              setCurrentPage(1);
            }}
            className="rounded-lg border border-[#26313C] bg-[#18212B] px-3 py-2 text-sm text-[#F5F7FA] outline-none focus:border-[#2AFEB7] focus:ring-1 focus:ring-[#2AFEB7]"
          >
            <option value="ALL">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>

        {(search || roleFilter !== 'ALL' || statusFilter !== 'ALL') && (
          <button
            type="button"
            onClick={handleClearFilters}
            className="rounded-lg border border-[#26313C] bg-[#18212B] px-3 py-2 text-xs font-medium text-[#F5F7FA] transition-colors hover:border-[#2AFEB7] hover:text-[#2AFEB7]"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Table Container */}
      <div className="overflow-hidden rounded-xl border border-[#26313C] bg-[#111820] shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left">
            <thead className="border-b border-[#26313C] bg-[#18212B]">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#9AA6B2]">
                  Staff Name
                </th>

                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#9AA6B2]">
                  Email
                </th>

                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#9AA6B2]">
                  Phone
                </th>

                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#9AA6B2]">
                  Role
                </th>

                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#9AA6B2]">
                  Status
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#26313C]">
              {users.map((user) => (
                <tr
                  key={user.id}
                  onClick={() => router.push(`/users/${user.id}`)}
                  className="cursor-pointer transition-colors hover:bg-[#18212B]"
                >
                  <td className="px-4 py-4 text-sm font-medium text-[#F5F7FA]">
                    {user.name}
                  </td>

                  <td className="px-4 py-4 text-sm text-[#9AA6B2]">
                    {user.email}
                  </td>

                  <td className="px-4 py-4 text-sm text-[#9AA6B2]">
                    {user.phone ?? '—'}
                  </td>

                  <td className="px-4 py-4 text-sm">
                    <UserRoleBadge role={user.role} />
                  </td>

                  <td className="px-4 py-4 text-sm">
                    <UserStatusBadge status={user.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {users.length === 0 && (
          <div className="p-10 text-center">
            <p className="text-[#F5F7FA] font-medium">
              No staff members found for this restaurant.
            </p>

            {(search || roleFilter !== 'ALL' || statusFilter !== 'ALL') && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="mt-4 rounded-lg border border-[#26313C] bg-[#18212B] px-4 py-2 text-sm text-[#F5F7FA] transition-colors hover:border-[#2AFEB7]"
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[#26313C] px-4 py-4 bg-[#18212B]/40">
            <p className="text-sm text-[#9AA6B2]">
              Page {currentPage} of {totalPages}
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((page) => page - 1)}
                className="rounded-lg border border-[#26313C] bg-[#18212B] px-3 py-1.5 text-sm text-[#F5F7FA] transition-colors hover:border-[#2AFEB7] disabled:opacity-40"
              >
                Previous
              </button>

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((page) => page + 1)}
                className="rounded-lg border border-[#26313C] bg-[#18212B] px-3 py-1.5 text-sm text-[#F5F7FA] transition-colors hover:border-[#2AFEB7] disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

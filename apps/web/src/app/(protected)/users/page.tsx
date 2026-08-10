'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { getUsers } from '@/services/users.service';
import type { User, UserRole, UserStatus } from '@/types/user';

import { PageError } from '@/components/ui/page-error';
import { UsersTableSkeleton } from '@/components/users/users-table-skeleton';
import { UserRoleBadge } from '@/components/users/user-role-badge';
import { UserStatusBadge } from '@/components/users/user-status-badge';

export default function UsersPage() {
  const router = useRouter();

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

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await getUsers();

      setUsers(response.data);
    } catch (err) {
      console.error(err);

      setError('Unable to load users.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  // Derived filtered users list
  const filteredUsers = users.filter((user) => {
    const query = search.toLowerCase().trim();

    const matchesSearch =
      !query ||
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      (user.phone ? user.phone.toLowerCase().includes(query) : false);

    const matchesRole =
      roleFilter === 'ALL' || user.role === roleFilter;

    const matchesStatus =
      statusFilter === 'ALL' || user.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Pagination math
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

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
            <h1 className="text-3xl font-bold text-[#F5F7FA]">Users</h1>
            <p className="mt-2 text-sm text-[#9AA6B2]">Manage Atlas users.</p>
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
      {/* Header & Add Button */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#F5F7FA]">
            Users
          </h1>

          <p className="mt-2 text-sm text-[#9AA6B2]">
            Manage Atlas users.
          </p>

          <p className="mt-1 text-xs font-medium text-[#9AA6B2]">
            Showing {paginatedUsers.length} of {filteredUsers.length} users
            {users.length !== filteredUsers.length && ` (filtered from ${users.length} total)`}
          </p>
        </div>

        <button
          type="button"
          onClick={() => router.push('/users/create')}
          className="rounded-lg bg-[#2AFEB7] px-4 py-2.5 text-sm font-semibold text-[#0B0F14] transition-all hover:bg-[#22E5A4] active:scale-[0.99]"
        >
          Add User
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
            <option value="ALL">All roles</option>
            <option value="USER">Users</option>
            <option value="ADMIN">Admins</option>
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
                  Name
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
              {paginatedUsers.map((user) => (
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
        {filteredUsers.length === 0 && (
          <div className="p-10 text-center">
            <p className="text-[#F5F7FA] font-medium">
              {users.length === 0
                ? 'No users found.'
                : 'No users match your filters.'}
            </p>

            {users.length > 0 && (
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

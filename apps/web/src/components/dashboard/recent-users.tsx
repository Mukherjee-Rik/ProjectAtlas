'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import type { User } from '@/types/user';
import { UserRoleBadge } from '@/components/users/user-role-badge';
import { UserStatusBadge } from '@/components/users/user-status-badge';

interface RecentUsersProps {
  users: User[];
}

export function RecentUsers({ users }: RecentUsersProps) {
  const router = useRouter();

  return (
    <div className="overflow-hidden rounded-xl border border-[#26313C] bg-[#111820] shadow-xl">
      <div className="flex items-center justify-between border-b border-[#26313C] p-6 bg-[#18212B]/40">
        <div>
          <h2 className="text-lg font-semibold text-[#F5F7FA]">
            Recent Users
          </h2>
          <p className="mt-1 text-sm text-[#9AA6B2]">
            Recently created Atlas users
          </p>
        </div>

        <Link
          href="/users"
          className="text-xs font-semibold text-[#2AFEB7] transition-colors hover:text-[#22E5A4]"
        >
          View all →
        </Link>
      </div>

      {users.length === 0 ? (
        <div className="p-8 text-center text-sm text-[#9AA6B2]">
          No users yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left">
            <thead>
              <tr className="border-b border-[#26313C] text-xs font-semibold uppercase tracking-wider text-[#9AA6B2] bg-[#18212B]">
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Created</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#26313C]">
              {users.map((user) => (
                <tr
                  key={user.id}
                  onClick={() => router.push(`/users/${user.id}`)}
                  className="cursor-pointer transition-colors hover:bg-[#18212B]"
                >
                  <td className="px-6 py-4 text-sm font-medium text-[#F5F7FA]">
                    {user.name}
                  </td>

                  <td className="px-6 py-4 text-sm text-[#9AA6B2]">
                    {user.email}
                  </td>

                  <td className="px-6 py-4 text-sm">
                    <UserRoleBadge role={user.role} />
                  </td>

                  <td className="px-6 py-4 text-sm">
                    <UserStatusBadge status={user.status} />
                  </td>

                  <td className="px-6 py-4 text-sm text-[#9AA6B2]">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

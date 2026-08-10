'use client';

import Link from 'next/link';
import type { User } from '@/types/user';
import { UserRoleBadge } from '@/components/users/user-role-badge';
import { UserStatusBadge } from '@/components/users/user-status-badge';

interface ProfileCardProps {
  user: User;
}

export function ProfileCard({ user }: ProfileCardProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#26313C] bg-[#111820] shadow-xl">
      <div className="border-b border-[#26313C] p-6 bg-[#18212B]/40">
        <h2 className="text-xl font-bold text-[#F5F7FA]">
          Personal Information
        </h2>
        <p className="mt-1 text-sm text-[#9AA6B2]">
          Your account details and status
        </p>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-[#9AA6B2]">
              Name
            </p>
            <p className="mt-1.5 text-base font-semibold text-[#F5F7FA]">
              {user.name}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-[#9AA6B2]">
              Email Address
            </p>
            <p className="mt-1.5 text-base font-semibold text-[#F5F7FA]">
              {user.email}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-[#9AA6B2]">
              Phone Number
            </p>
            <p className="mt-1.5 text-base font-semibold text-[#F5F7FA]">
              {user.phone ?? 'Not provided'}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-[#9AA6B2]">
              Account Created
            </p>
            <p className="mt-1.5 text-base font-semibold text-[#F5F7FA]">
              {new Date(user.createdAt).toLocaleDateString()}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-[#9AA6B2]">
              Role
            </p>
            <div className="mt-1.5">
              <UserRoleBadge role={user.role} />
            </div>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-[#9AA6B2]">
              Status
            </p>
            <div className="mt-1.5">
              <UserStatusBadge status={user.status} />
            </div>
          </div>
        </div>

        <div className="flex justify-end border-t border-[#26313C] pt-6">
          <Link
            href="/profile/edit"
            className="rounded-lg bg-[#2AFEB7] px-4 py-2 text-sm font-semibold text-[#0B0F14] transition-all hover:bg-[#22E5A4] active:scale-[0.99]"
          >
            Edit Profile
          </Link>
        </div>
      </div>
    </div>
  );
}

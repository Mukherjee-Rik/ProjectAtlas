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
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="border-b border-border p-6 bg-secondary/40">
        <h2 className="text-xl font-bold text-foreground">
          Personal Information
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your account details and status
        </p>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Name
            </p>
            <p className="mt-1.5 text-base font-semibold text-foreground">
              {user.name}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Email Address
            </p>
            <p className="mt-1.5 text-base font-semibold text-foreground">
              {user.email}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Phone Number
            </p>
            <p className="mt-1.5 text-base font-semibold text-foreground">
              {user.phone ?? 'Not provided'}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Account Created
            </p>
            <p className="mt-1.5 text-base font-semibold text-foreground">
              {new Date(user.createdAt).toLocaleDateString()}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Role
            </p>
            <div className="mt-1.5">
              <UserRoleBadge role={user.role} />
            </div>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Status
            </p>
            <div className="mt-1.5">
              <UserStatusBadge status={user.status} />
            </div>
          </div>
        </div>

        <div className="flex justify-end border-t border-border pt-6">
          <Link
            href="/profile/edit"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-background transition-all hover:bg-primary-hover active:scale-[0.99]"
          >
            Edit Profile
          </Link>
        </div>
      </div>
    </div>
  );
}

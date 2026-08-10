'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { getUserById, deleteUser } from '@/services/users.service';
import type { User } from '@/types/user';
import { useAuth } from '@/hooks/use-auth';

import { PageError } from '@/components/ui/page-error';
import { PageLoading } from '@/components/ui/page-loading';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { UserRoleBadge } from '@/components/users/user-role-badge';
import { UserStatusBadge } from '@/components/users/user-status-badge';

export default function UserDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser } = useAuth();

  const id = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  const isCurrentUser = currentUser?.id === user?.id;

  useEffect(() => {
    async function loadUser() {
      try {
        const response = await getUserById(id);

        setUser(response.data);
      } catch (err) {
        console.error(err);

        setError('Unable to load user.');
      } finally {
        setIsLoading(false);
      }
    }

    void loadUser();
  }, [id]);

  function openDeleteDialog() {
    setShowDeleteDialog(true);
  }

  function closeDeleteDialog() {
    if (!isDeleting) {
      setShowDeleteDialog(false);
    }
  }

  async function handleDelete() {
    setIsDeleting(true);

    try {
      await deleteUser(id);

      router.push('/users');
    } catch (err) {
      console.error(err);

      setError('Unable to delete user.');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  }

  if (isLoading) {
    return <PageLoading />;
  }

  if (error || !user) {
    return (
      <PageError
        message={error || 'User not found.'}
      />
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#F5F7FA]">
            {user.name}
          </h1>

          <p className="mt-2 text-sm text-[#9AA6B2]">
            User details
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => router.push(`/users/${user.id}/edit`)}
            className="rounded-lg bg-[#2AFEB7] px-4 py-2 text-sm font-semibold text-[#0B0F14] transition-all hover:bg-[#22E5A4] active:scale-[0.99]"
          >
            Edit
          </button>

          <button
            type="button"
            onClick={openDeleteDialog}
            disabled={isDeleting || isCurrentUser}
            className="rounded-lg border border-[#EF4444]/40 bg-[#EF4444]/10 px-4 py-2 text-sm font-medium text-[#EF4444] transition-all hover:bg-[#EF4444]/20 disabled:opacity-40"
          >
            Delete
          </button>

          <button
            type="button"
            onClick={() => router.push('/users')}
            className="rounded-lg border border-[#26313C] bg-[#18212B] px-4 py-2 text-sm font-medium text-[#F5F7FA] transition-colors hover:border-[#2AFEB7]"
          >
            Back
          </button>
        </div>
      </div>

      {isCurrentUser && (
        <div className="rounded-lg border border-[#F59E0B]/30 bg-[#F59E0B]/10 p-3 text-xs text-[#F59E0B]">
          You cannot delete your own account.
        </div>
      )}

      <div className="rounded-2xl border border-[#26313C] bg-[#111820] shadow-xl">
        <div className="grid gap-6 p-8 md:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wider text-[#9AA6B2]">
              Name
            </p>

            <p className="mt-1 text-base font-medium text-[#F5F7FA]">
              {user.name}
            </p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wider text-[#9AA6B2]">
              Email
            </p>

            <p className="mt-1 text-base font-medium text-[#F5F7FA]">
              {user.email}
            </p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wider text-[#9AA6B2]">
              Phone
            </p>

            <p className="mt-1 text-base font-medium text-[#F5F7FA]">
              {user.phone ?? '—'}
            </p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wider text-[#9AA6B2]">
              Role
            </p>

            <div className="mt-1">
              <UserRoleBadge role={user.role} />
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wider text-[#9AA6B2]">
              Status
            </p>

            <div className="mt-1">
              <UserStatusBadge status={user.status} />
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wider text-[#9AA6B2]">
              Created
            </p>

            <p className="mt-1 text-base font-medium text-[#F5F7FA]">
              {new Date(user.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={showDeleteDialog}
        title="Delete user?"
        description={`Are you sure you want to delete ${user.name}? This action cannot be undone.`}
        confirmText="Delete user"
        cancelText="Cancel"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={closeDeleteDialog}
      />
    </div>
  );
}

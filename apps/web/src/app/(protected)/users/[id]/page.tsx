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
          <h1 className="font-display text-3xl font-semibold tracking-[-0.02em] text-foreground">
            {user.name}
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            User details
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => router.push(`/users/${user.id}/edit`)}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-background transition-all hover:bg-primary-hover active:scale-[0.99]"
          >
            Edit
          </button>

          <button
            type="button"
            onClick={openDeleteDialog}
            disabled={isDeleting || isCurrentUser}
            className="rounded-lg border border-atlas-error/40 bg-atlas-error/10 px-4 py-2 text-sm font-medium text-atlas-error transition-all hover:bg-atlas-error/20 disabled:opacity-40"
          >
            Delete
          </button>

          <button
            type="button"
            onClick={() => router.push('/users')}
            className="rounded-lg border border-border bg-secondary px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary"
          >
            Back
          </button>
        </div>
      </div>

      {isCurrentUser && (
        <div className="rounded-lg border border-atlas-warning/30 bg-atlas-warning/10 p-3 text-xs text-atlas-warning">
          You cannot delete your own account.
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card">
        <div className="grid gap-6 p-8 md:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Name
            </p>

            <p className="mt-1 text-base font-medium text-foreground">
              {user.name}
            </p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Email
            </p>

            <p className="mt-1 text-base font-medium text-foreground">
              {user.email}
            </p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Phone
            </p>

            <p className="mt-1 text-base font-medium text-foreground">
              {user.phone ?? '—'}
            </p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Role
            </p>

            <div className="mt-1">
              <UserRoleBadge role={user.role} />
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Status
            </p>

            <div className="mt-1">
              <UserStatusBadge status={user.status} />
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Created
            </p>

            <p className="mt-1 text-base font-medium text-foreground">
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

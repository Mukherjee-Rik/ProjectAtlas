'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { useUser, useDeleteUser } from '@/hooks/use-users';
import { useAuth } from '@/hooks/use-auth';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { PageLoading } from '@/components/ui/page-loading';
import { ErrorPanel, PageHeader } from '@/components/ui/primitives';
import { useToast } from '@/components/ui/toast';
import { UserRoleBadge } from '@/components/users/user-role-badge';
import { UserStatusBadge } from '@/components/users/user-status-badge';

/**
 * A label over its value. `min-w-0` is the load-bearing part: grid and flex
 * items default to `min-width: auto`, so a cell holding an unbreakable email
 * refuses to shrink below that address and pushes the whole document into
 * horizontal scroll on a phone.
 */
function DetailField({
  label,
  children,
  breakAll = false,
}: {
  label: string;
  children: ReactNode;
  breakAll?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <div
        className={`mt-1 text-base font-medium text-foreground ${breakAll ? 'break-all' : 'break-words'}`}
      >
        {children}
      </div>
    </div>
  );
}

export default function UserDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const { user: currentUser } = useAuth();

  const id = params.id as string;

  const { data: user, isPending, isError, error, refetch } = useUser(id);
  const deleteUser = useDeleteUser();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const isCurrentUser = currentUser?.id === user?.id;

  function closeDeleteDialog() {
    if (!deleteUser.isPending) {
      setShowDeleteDialog(false);
    }
  }

  function handleDelete() {
    deleteUser.mutate(id, {
      onSuccess: () => {
        toast.success('Team member removed.');
        router.push('/users');
      },
      onError: (err: unknown) => {
        setShowDeleteDialog(false);
        toast.error(err instanceof Error ? err.message : 'Unable to delete user.');
      },
    });
  }

  if (isPending) {
    return <PageLoading />;
  }

  if (isError || !user) {
    return (
      <ErrorPanel
        message={error instanceof Error ? error.message : 'User not found.'}
        onRetry={() => void refetch()}
      />
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 sm:space-y-8">
      <PageHeader
        title={user.name}
        description="User details"
        actions={
          <>
            <Button variant="primary" onClick={() => router.push(`/users/${user.id}/edit`)}>
              Edit
            </Button>
            <Button
              variant="danger"
              disabled={deleteUser.isPending || isCurrentUser}
              onClick={() => setShowDeleteDialog(true)}
            >
              Delete
            </Button>
            <Button onClick={() => router.push('/users')}>Back</Button>
          </>
        }
      />

      {isCurrentUser && (
        <div className="rounded-lg border border-atlas-warning/30 bg-atlas-warning/10 p-3 text-xs text-atlas-warning">
          You cannot delete your own account.
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card">
        <div className="grid gap-5 p-5 sm:gap-6 sm:p-6 md:grid-cols-2 lg:p-8">
          <DetailField label="Name">{user.name}</DetailField>

          <DetailField label="Email" breakAll>
            {user.email}
          </DetailField>

          <DetailField label="Phone" breakAll>
            {user.phone ?? '—'}
          </DetailField>

          <DetailField label="Role">
            <UserRoleBadge role={user.role} />
          </DetailField>

          <DetailField label="Status">
            <UserStatusBadge status={user.status} />
          </DetailField>

          <DetailField label="Created">
            {new Date(user.createdAt).toLocaleDateString()}
          </DetailField>
        </div>
      </div>

      <ConfirmDialog
        open={showDeleteDialog}
        title="Delete user?"
        description={`Are you sure you want to delete ${user.name}? This action cannot be undone.`}
        confirmText="Delete user"
        cancelText="Cancel"
        isLoading={deleteUser.isPending}
        onConfirm={handleDelete}
        onCancel={closeDeleteDialog}
      />
    </div>
  );
}

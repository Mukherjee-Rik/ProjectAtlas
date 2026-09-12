'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import type { CreateUserPayload, UpdateUserPayload } from '@/services/users.service';
import { useUpdateUser, useUser } from '@/hooks/use-users';

import { UserForm } from '@/components/users/user-form';
import { PageLoading } from '@/components/ui/page-loading';
import { Card, ErrorPanel, PageHeader } from '@/components/ui/primitives';

export default function EditUserPage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;

  const { data: user, isPending, isError, error: loadError, refetch } = useUser(id);
  const updateUser = useUpdateUser();

  const [error, setError] = useState('');

  async function handleSubmit(data: CreateUserPayload | UpdateUserPayload) {
    setError('');

    try {
      await updateUser.mutateAsync({ id, data: data as UpdateUserPayload });
      router.push(`/users/${id}`);
    } catch (err) {
      console.error(err);

      setError(err instanceof Error ? err.message : 'Unable to update user.');
    }
  }

  if (isPending) {
    return <PageLoading />;
  }

  if (isError || !user) {
    return (
      <ErrorPanel
        message={loadError instanceof Error ? loadError.message : 'User not found.'}
        onRetry={() => void refetch()}
      />
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 sm:space-y-8">
      <PageHeader title="Edit User" description="Update user information." />

      <Card>
        {error && (
          <div
            role="alert"
            className="mb-5 rounded-lg border border-atlas-error/30 bg-atlas-error/10 p-3 text-sm font-medium text-atlas-error"
          >
            {error}
          </div>
        )}

        <UserForm
          user={user}
          onSubmit={handleSubmit}
          onCancel={() => router.push(`/users/${id}`)}
          isSubmitting={updateUser.isPending}
        />
      </Card>
    </div>
  );
}

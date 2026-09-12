'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import type { CreateUserPayload, UpdateUserPayload } from '@/services/users.service';
import { useCreateUser } from '@/hooks/use-users';
import { UserForm } from '@/components/users/user-form';
import { Card, PageHeader } from '@/components/ui/primitives';

export default function CreateUserPage() {
  const router = useRouter();
  const createUser = useCreateUser();

  const [error, setError] = useState('');

  async function handleSubmit(data: CreateUserPayload | UpdateUserPayload) {
    setError('');

    try {
      await createUser.mutateAsync(data as CreateUserPayload);
      router.push('/users');
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to create user. Please check the entered information.',
      );
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 sm:space-y-8">
      <PageHeader title="Create User" description="Create a new Kafei user." />

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
          onSubmit={handleSubmit}
          onCancel={() => router.push('/users')}
          isSubmitting={createUser.isPending}
        />
      </Card>
    </div>
  );
}

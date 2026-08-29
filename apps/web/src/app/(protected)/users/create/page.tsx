'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { createUser, type CreateUserPayload, type UpdateUserPayload } from '@/services/users.service';
import { UserForm } from '@/components/users/user-form';

export default function CreateUserPage() {
  const router = useRouter();

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(
    data: CreateUserPayload | UpdateUserPayload,
  ) {
    setIsSubmitting(true);
    setError('');

    try {
      await createUser(data as CreateUserPayload);

      router.push('/users');
    } catch (err: any) {
      console.error(err);

      setError(
        err?.message || err?.error || 'Unable to create user. Please check the entered information.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-[-0.02em] text-foreground">
          Create User
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Create a new Kafei user.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-8">
        {error && (
          <div className="mb-5 rounded-lg border border-atlas-error/30 bg-atlas-error/10 p-3 text-sm font-medium text-atlas-error">
            {error}
          </div>
        )}

        <UserForm
          onSubmit={handleSubmit}
          onCancel={() => router.push('/users')}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
}

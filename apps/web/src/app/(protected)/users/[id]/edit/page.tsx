'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import {
  getUserById,
  updateUser,
  type CreateUserPayload,
  type UpdateUserPayload,
} from '@/services/users.service';

import type { User } from '@/types/user';
import { UserForm } from '@/components/users/user-form';
import { PageError } from '@/components/ui/page-error';
import { PageLoading } from '@/components/ui/page-loading';

export default function EditUserPage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

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

  async function handleSubmit(
    data: CreateUserPayload | UpdateUserPayload,
  ) {
    setIsSubmitting(true);
    setError('');

    try {
      await updateUser(id, data as UpdateUserPayload);

      router.push(`/users/${id}`);
    } catch (err: any) {
      console.error(err);

      setError(err?.message || err?.error || 'Unable to update user.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <PageLoading />;
  }

  if (!user) {
    return (
      <PageError
        message={error || 'User not found.'}
      />
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-[-0.02em] text-foreground">
          Edit User
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Update user information.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-8">
        {error && (
          <div className="mb-5 rounded-lg border border-atlas-error/30 bg-atlas-error/10 p-3 text-sm font-medium text-atlas-error">
            {error}
          </div>
        )}

        <UserForm
          user={user}
          onSubmit={handleSubmit}
          onCancel={() => router.push(`/users/${id}`)}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
}

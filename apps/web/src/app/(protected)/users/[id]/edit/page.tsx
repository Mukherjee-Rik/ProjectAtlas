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
        <h1 className="text-3xl font-bold text-[#F5F7FA]">
          Edit User
        </h1>

        <p className="mt-2 text-sm text-[#9AA6B2]">
          Update user information.
        </p>
      </div>

      <div className="rounded-2xl border border-[#26313C] bg-[#111820] p-8 shadow-xl">
        {error && (
          <div className="mb-5 rounded-lg border border-[#EF4444]/30 bg-[#EF4444]/10 p-3 text-sm font-medium text-[#EF4444]">
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

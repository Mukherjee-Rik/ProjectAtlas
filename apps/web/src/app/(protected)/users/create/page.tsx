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
        <h1 className="text-3xl font-bold text-[#F5F7FA]">
          Create User
        </h1>

        <p className="mt-2 text-sm text-[#9AA6B2]">
          Create a new Atlas user.
        </p>
      </div>

      <div className="rounded-2xl border border-[#26313C] bg-[#111820] p-8 shadow-xl">
        {error && (
          <div className="mb-5 rounded-lg border border-[#EF4444]/30 bg-[#EF4444]/10 p-3 text-sm font-medium text-[#EF4444]">
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

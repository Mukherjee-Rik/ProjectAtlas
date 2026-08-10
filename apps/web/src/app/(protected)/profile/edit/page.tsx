'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { getCurrentUser, updateMyProfile } from '@/services/users.service';
import type { User } from '@/types/user';

import { UserRoleBadge } from '@/components/users/user-role-badge';
import { UserStatusBadge } from '@/components/users/user-status-badge';
import { PageLoading } from '@/components/ui/page-loading';
import { PageError } from '@/components/ui/page-error';

export default function EditProfilePage() {
  const router = useRouter();

  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await getCurrentUser();
      setUserProfile(response.data);
      setName(response.data.name);
      setPhone(response.data.phone ?? '');
    } catch (err) {
      console.error(err);
      setError('Unable to load profile.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      await updateMyProfile({
        name,
        phone: phone || null,
      });

      router.push('/profile');
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to update profile.');
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <PageLoading />;
  }

  if (error && !userProfile) {
    return (
      <PageError
        message={error}
        onRetry={loadProfile}
      />
    );
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold text-[#F5F7FA]">
          Edit Profile
        </h1>
        <p className="mt-2 text-[#9AA6B2]">
          Update your personal account details.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-[#EF4444]/30 bg-[#EF4444]/10 p-4 text-sm text-[#EF4444]">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-[#26313C] bg-[#111820] p-6 shadow-xl space-y-6"
      >
        <div>
          <label
            htmlFor="name"
            className="mb-2 block text-sm font-medium text-[#F5F7FA]"
          >
            Full Name
          </label>
          <input
            id="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            minLength={2}
            maxLength={100}
            className="w-full rounded-lg border border-[#26313C] bg-[#18212B] px-4 py-2.5 text-[#F5F7FA] placeholder-[#9AA6B2] transition-colors outline-none focus:border-[#2AFEB7] focus:ring-1 focus:ring-[#2AFEB7]"
          />
        </div>

        <div>
          <label
            htmlFor="phone"
            className="mb-2 block text-sm font-medium text-[#F5F7FA]"
          >
            Phone Number
          </label>
          <input
            id="phone"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            maxLength={30}
            placeholder="+1 234 567 8900"
            className="w-full rounded-lg border border-[#26313C] bg-[#18212B] px-4 py-2.5 text-[#F5F7FA] placeholder-[#9AA6B2] transition-colors outline-none focus:border-[#2AFEB7] focus:ring-1 focus:ring-[#2AFEB7]"
          />
        </div>

        {/* Read-only security fields */}
        <div className="pt-2 border-t border-[#26313C] space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-[#9AA6B2]">
              Email Address
            </label>
            <input
              disabled
              value={userProfile?.email ?? ''}
              className="w-full rounded-lg border border-[#26313C]/50 bg-[#18212B]/50 px-4 py-2.5 text-[#9AA6B2] cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-[#9AA6B2]">
              Email address cannot be changed directly for security reasons.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-[#9AA6B2]">
                Role
              </label>
              <div className="pt-1">
                {userProfile && <UserRoleBadge role={userProfile.role} />}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-[#9AA6B2]">
                Status
              </label>
              <div className="pt-1">
                {userProfile && <UserStatusBadge status={userProfile.status} />}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-[#26313C]">
          <button
            type="button"
            onClick={() => router.push('/profile')}
            disabled={isSubmitting}
            className="rounded-lg border border-[#26313C] bg-[#18212B] px-4 py-2 text-sm font-medium text-[#F5F7FA] transition-colors hover:border-[#2AFEB7]"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-[#2AFEB7] px-4 py-2 text-sm font-semibold text-[#0B0F14] transition-all hover:bg-[#22E5A4] active:scale-[0.99] disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </form>
    </div>
  );
}

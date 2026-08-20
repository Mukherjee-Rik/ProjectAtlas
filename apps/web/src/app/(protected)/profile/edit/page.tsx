'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { getCurrentUser, updateMyProfile } from '@/services/users.service';
import type { User } from '@/types/user';

import { UserRoleBadge } from '@/components/users/user-role-badge';
import { UserStatusBadge } from '@/components/users/user-status-badge';
import { PageLoading } from '@/components/ui/page-loading';
import { PageError } from '@/components/ui/page-error';
import { ValidatedInput } from '@/components/ui/validated-input';
import { validateText, validatePhone } from '@/lib/validation';

export default function EditProfilePage() {
  const router = useRouter();

  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [errors, setErrors] = useState<{
    name?: string;
    phone?: string;
  }>({});

  const validateField = (field: string, val: any) => {
    const nextErrors = { ...errors };

    switch (field) {
      case 'name': {
        const res = validateText(val, 'Full name', 2, 100);
        if (!res.isValid) nextErrors.name = res.error;
        else delete nextErrors.name;
        break;
      }

      case 'phone': {
        const res = validatePhone(val, false);
        if (!res.isValid) nextErrors.phone = res.error;
        else delete nextErrors.phone;
        break;
      }
    }

    setErrors(nextErrors);
    return nextErrors;
  };

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

    const nameRes = validateText(name, 'Full name', 2, 100);
    const phoneRes = validatePhone(phone, false);

    const validationErrors: typeof errors = {};
    if (!nameRes.isValid) validationErrors.name = nameRes.error;
    if (!phoneRes.isValid) validationErrors.phone = phoneRes.error;

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setError('Please resolve the highlighted errors before saving.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setErrors({});

    try {
      await updateMyProfile({
        name: name.trim(),
        phone: phone.trim() || null,
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
        <div className="rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 p-4 text-sm text-[#EF4444] animate-in fade-in">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-[#26313C] bg-[#111820] p-6 shadow-xl space-y-6"
        noValidate
      >
        <ValidatedInput
          label="Full Name"
          required
          maxLength={100}
          showCount
          placeholder="e.g. Rahul Sharma"
          value={name}
          error={errors.name}
          onChange={(e) => {
            setName(e.target.value);
            validateField('name', e.target.value);
          }}
          onBlur={(e) => validateField('name', e.target.value)}
        />

        <ValidatedInput
          label="Phone Number"
          type="tel"
          maxLength={15}
          placeholder="+91 9876543210"
          value={phone}
          error={errors.phone}
          helperText="7 to 15 digits with optional country code"
          onChange={(e) => {
            setPhone(e.target.value);
            validateField('phone', e.target.value);
          }}
          onBlur={(e) => validateField('phone', e.target.value)}
        />

        {/* Read-only security fields */}
        <div className="pt-2 border-t border-[#26313C] space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#9AA6B2]">
              Email Address
            </label>
            <input
              disabled
              value={userProfile?.email ?? ''}
              className="w-full rounded-lg border border-[#26313C]/50 bg-[#18212B]/50 px-4 py-2.5 text-[#9AA6B2] cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-[#9AA6B2]/70">
              Email address cannot be changed directly for security reasons.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#9AA6B2]">
                Account Role
              </span>
              {userProfile && (
                <UserRoleBadge role={userProfile.role} />
              )}
            </div>

            <div>
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#9AA6B2]">
                Account Status
              </span>
              {userProfile && (
                <UserStatusBadge status={userProfile.status} />
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-[#26313C]">
          <button
            type="button"
            onClick={() => router.push('/profile')}
            disabled={isSubmitting}
            className="rounded-lg border border-[#26313C] bg-[#18212B] px-4 py-2 text-sm font-semibold text-[#F5F7FA] transition-colors hover:border-[#2AFEB7] disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-[#2AFEB7] px-6 py-2.5 text-sm font-bold text-[#0B0F14] transition-all hover:bg-[#22E5A4] active:scale-[0.99] disabled:opacity-50 shadow"
          >
            {isSubmitting ? 'Saving changes...' : 'Save Profile'}
          </button>
        </div>
      </form>
    </div>
  );
}

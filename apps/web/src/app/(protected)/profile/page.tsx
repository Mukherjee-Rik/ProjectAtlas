'use client';

import { useCallback, useEffect, useState } from 'react';

import { getCurrentUser } from '@/services/users.service';
import type { User } from '@/types/user';

import { ProfileCard } from '@/components/profile/profile-card';
import { PageLoading } from '@/components/ui/page-loading';
import { PageError } from '@/components/ui/page-error';

export default function ProfilePage() {
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await getCurrentUser();
      setUserProfile(response.data);
    } catch (err) {
      console.error(err);
      setError('Unable to load profile data.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  if (isLoading) {
    return <PageLoading />;
  }

  if (error || !userProfile) {
    return (
      <PageError
        message={error || 'Unable to load profile.'}
        onRetry={loadProfile}
      />
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-[#F5F7FA]">
          Profile
        </h1>
        <p className="mt-2 text-[#9AA6B2]">
          Manage your Atlas account information.
        </p>
      </div>

      <ProfileCard user={userProfile} />
    </div>
  );
}

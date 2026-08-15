'use client';

import { FormEvent, useState, useId } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { login } from '@/services/auth.service';
import { useAuth } from '@/hooks/use-auth';
import { PublicOnlyRoute } from '@/components/auth/public-only-route';
import { setCurrentTenant } from '@/lib/tenant-storage';
import { setCurrentRestaurant } from '@/lib/restaurant-storage';
import { setCurrentBranch } from '@/lib/branch-storage';

export default function LoginPage() {
  return <LoginForm />;
}

function LoginForm() {
  const router = useRouter();
  const { loginUser } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError('');
    setLoading(true);

    try {
      const response = await login({
        email: email.trim().toLowerCase(),
        password,
      });

      const { accessToken, user, memberships } = response.data;

      loginUser(accessToken, user);

      // 1. Platform Admin -> Platform Dashboard
      if (user.role === 'PLATFORM_ADMIN') {
        window.location.href = '/dashboard';
        return;
      }

      // 2. Restaurant Owner / Staff -> Restaurant Dashboard or Workspace Selection
      const allRestaurants = (memberships ?? []).flatMap((m) =>
        m.tenant.restaurants.map((r) => ({
          tenantId: m.tenant.id,
          tenantSlug: m.tenant.slug,
          restaurant: r,
          role: m.role,
        })),
      );

      if (allRestaurants.length === 1) {
        const item = allRestaurants[0];
        setCurrentTenant({ id: item.tenantId, name: item.restaurant.name, slug: item.tenantSlug, status: 'ACTIVE', createdAt: '', updatedAt: '' });
        setCurrentRestaurant({ id: item.restaurant.id, tenantId: item.tenantId, name: item.restaurant.name, slug: item.restaurant.slug, status: 'ACTIVE', createdAt: '', updatedAt: '' });
        if (item.restaurant.branches?.[0]?.id) {
          const b = item.restaurant.branches[0];
          setCurrentBranch({ id: b.id, restaurantId: item.restaurant.id, name: b.name, code: b.code, status: 'ACTIVE', createdAt: '', updatedAt: '' });
        }
        const targetPath = (user.role === 'WAITER' || user.role === 'STAFF') ? '/waiter' : (user.role === 'KITCHEN' ? '/kitchen' : '/dashboard');
        window.location.href = targetPath;
      } else if (allRestaurants.length > 1) {
        window.location.href = '/select-restaurant';
      } else {
        const targetPath = (user.role === 'WAITER' || user.role === 'STAFF') ? '/waiter' : (user.role === 'KITCHEN' ? '/kitchen' : '/dashboard');
        window.location.href = targetPath;
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.error ?? err?.message ?? 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0B0F14] px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header Branding */}
        <div className="mb-8 text-center space-y-2">
          <div className="inline-flex items-center justify-center gap-2">
            <div className="h-3 w-3 rounded-full bg-[#2AFEB7] shadow-[0_0_12px_#2AFEB7]" />
            <h1 className="text-4xl font-bold tracking-tight text-[#F5F7FA]">
              Atlas
            </h1>
          </div>
          <p className="text-xs uppercase tracking-widest text-[#2AFEB7] font-semibold">
            Restaurant Operations Platform
          </p>
          <p className="text-xs text-[#9AA6B2]">
            Sign in to your restaurant workspace or platform panel
          </p>
        </div>

        {/* Login Form Container */}
        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-2xl border border-[#26313C] bg-[#111820] p-8 shadow-xl transition-all"
        >
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-[#F5F7FA]"
            >
              Email Address
            </label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@restaurant.com"
              required
              autoComplete="email"
              className="w-full rounded-lg border border-[#26313C] bg-[#18212B] px-4 py-2.5 text-[#F5F7FA] placeholder-[#9AA6B2] transition-colors outline-none focus:border-[#2AFEB7] focus:ring-1 focus:ring-[#2AFEB7]"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-[#F5F7FA]"
            >
              Password
            </label>

            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
                autoComplete="current-password"
                className="w-full rounded-lg border border-[#26313C] bg-[#18212B] px-4 py-2.5 pr-12 text-[#F5F7FA] placeholder-[#9AA6B2] transition-colors outline-none focus:border-[#2AFEB7] focus:ring-1 focus:ring-[#2AFEB7]"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9AA6B2] hover:text-[#2AFEB7] transition-colors p-1"
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  // Eye-off icon
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  // Eye icon
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-[#EF4444]/30 bg-[#EF4444]/10 p-3 text-sm font-medium text-[#EF4444]">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#2AFEB7] px-4 py-3 font-semibold text-[#0B0F14] transition-all hover:bg-[#22E5A4] active:scale-[0.99] disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>

          <p className="text-center text-xs text-[#9AA6B2] pt-2">
            New restaurant?{' '}
            <Link href="/signup" className="font-semibold text-[#2AFEB7] hover:underline">
              Start free trial
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}

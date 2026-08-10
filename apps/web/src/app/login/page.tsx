'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/services/auth.service';
import { useAuth } from '@/hooks/use-auth';
import { PublicOnlyRoute } from '@/components/auth/public-only-route';

export default function LoginPage() {
  return (
    <PublicOnlyRoute>
      <LoginForm />
    </PublicOnlyRoute>
  );
}

function LoginForm() {
  const router = useRouter();
  const { loginUser } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError('');
    setLoading(true);

    try {
      const response = await login({
        email,
        password,
      });

      const { accessToken, user } = response.data;

      loginUser(accessToken, user);

      router.push('/dashboard');
    } catch (err) {
      console.error(err);
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0B0F14] px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header Branding */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center gap-2">
            <div className="h-3 w-3 rounded-full bg-[#2AFEB7] shadow-[0_0_12px_#2AFEB7]" />
            <h1 className="text-4xl font-bold tracking-tight text-[#F5F7FA]">
              Atlas
            </h1>
          </div>
          <p className="mt-2 text-sm text-[#9AA6B2]">
            Sign in to your account
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
              Email
            </label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
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

            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
              autoComplete="current-password"
              className="w-full rounded-lg border border-[#26313C] bg-[#18212B] px-4 py-2.5 text-[#F5F7FA] placeholder-[#9AA6B2] transition-colors outline-none focus:border-[#2AFEB7] focus:ring-1 focus:ring-[#2AFEB7]"
            />
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
        </form>
      </div>
    </main>
  );
}

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { registerRestaurant } from '@/services/auth.service';
import { setAccessToken } from '@/lib/auth-storage';
import { setCurrentTenant } from '@/lib/tenant-storage';
import { setCurrentRestaurant } from '@/lib/restaurant-storage';
import { setCurrentBranch } from '@/lib/branch-storage';

export default function SignupPage() {
  const router = useRouter();

  const [restaurantName, setRestaurantName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!restaurantName.trim()) { setError('Restaurant name is required'); return; }
    if (!ownerName.trim()) { setError('Owner name is required'); return; }
    if (!email.trim()) { setError('Email address is required'); return; }
    if (!password) { setError('Password is required'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    if (!agreeTerms) { setError('Please agree to the Terms of Service to continue'); return; }

    setIsLoading(true);

    try {
      const response = await registerRestaurant({
        restaurantName: restaurantName.trim(),
        ownerName: ownerName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        password,
      });

      const { accessToken, tenant, restaurant, branch } = response.data;

      // Store authentication & context
      setAccessToken(accessToken);
      if (tenant?.id) setCurrentTenant({ id: tenant.id, name: tenant.name, slug: tenant.slug, status: 'ACTIVE', createdAt: '', updatedAt: '' });
      if (restaurant?.id) setCurrentRestaurant({ id: restaurant.id, tenantId: tenant.id, name: restaurant.name, slug: restaurant.slug, status: 'ACTIVE', createdAt: '', updatedAt: '' });
      if (branch?.id) setCurrentBranch({ id: branch.id, restaurantId: restaurant.id, name: branch.name, code: branch.code, status: 'ACTIVE', createdAt: '', updatedAt: '' });

      // Redirect to Admin Dashboard
      router.push('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? 'Failed to register restaurant');
    } finally {
      setIsLoading(false);
    }
  };

  const inputCls =
    'w-full rounded-xl border border-[#26313C] bg-[#18212B] px-4 py-3 text-sm text-[#F5F7FA] placeholder-[#9AA6B2]/50 outline-none transition-colors focus:border-[#2AFEB7]';
  const labelCls = 'block text-xs font-semibold uppercase tracking-wider text-[#9AA6B2] mb-1.5';

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0B0F14] p-4 text-[#F5F7FA]">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Logo & Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-[#2AFEB7] shadow-[0_0_12px_#2AFEB7]" />
            <span className="text-2xl font-black tracking-wider text-[#F5F7FA]">ATLAS</span>
          </div>
          <p className="text-xs uppercase tracking-widest text-[#2AFEB7] font-semibold">
            Restaurant Operations Platform
          </p>
          <h1 className="text-xl font-bold text-[#F5F7FA] pt-2">Start Your Free Trial</h1>
          <p className="text-xs text-[#9AA6B2]">
            Create your restaurant account and manage menus, orders, and branches.
          </p>
        </div>

        {/* Signup Card */}
        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-[#26313C] bg-[#111820] p-6 shadow-2xl">
          {error && (
            <div className="rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 p-3 text-xs text-[#EF4444]">
              {error}
            </div>
          )}

          <div>
            <label className={labelCls}>Restaurant Name *</label>
            <input
              type="text"
              placeholder="e.g. The Spice Garden"
              value={restaurantName}
              onChange={(e) => setRestaurantName(e.target.value)}
              className={inputCls}
              required
            />
          </div>

          <div>
            <label className={labelCls}>Owner Full Name *</label>
            <input
              type="text"
              placeholder="e.g. Rik Mukherjee"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              className={inputCls}
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Email Address *</label>
              <input
                type="email"
                placeholder="owner@spicegarden.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputCls}
                required
              />
            </div>
            <div>
              <label className={labelCls}>Phone (Optional)</label>
              <input
                type="tel"
                placeholder="9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Password *</label>
              <input
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputCls}
                required
              />
            </div>
            <div>
              <label className={labelCls}>Confirm Password *</label>
              <input
                type="password"
                placeholder="••••••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={inputCls}
                required
              />
            </div>
          </div>

          <div className="flex items-start gap-2 pt-1">
            <input
              type="checkbox"
              id="terms"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="mt-0.5 rounded border-[#26313C] bg-[#18212B] text-[#2AFEB7] focus:ring-[#2AFEB7]"
            />
            <label htmlFor="terms" className="text-xs text-[#9AA6B2] leading-relaxed cursor-pointer">
              I agree to Atlas's <span className="text-[#2AFEB7] underline">Terms & Conditions</span> and Privacy Policy.
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl bg-[#2AFEB7] py-3.5 text-sm font-bold text-[#0B0F14] shadow-lg transition-all hover:bg-[#22E5A4] active:scale-[0.99] disabled:opacity-50"
          >
            {isLoading ? 'Creating Restaurant...' : 'Create Restaurant'}
          </button>

          <p className="text-center text-xs text-[#9AA6B2] pt-2">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-[#2AFEB7] hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}

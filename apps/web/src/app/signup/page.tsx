'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { registerRestaurant } from '@/services/auth.service';
import { setAccessToken } from '@/lib/auth-storage';
import { setCurrentTenant } from '@/lib/tenant-storage';
import { setCurrentRestaurant } from '@/lib/restaurant-storage';
import { setCurrentBranch } from '@/lib/branch-storage';
import { ValidatedInput } from '@/components/ui/validated-input';
import { validateText, validateEmail, validatePhone, validatePassword } from '@/lib/validation';

export default function SignupPage() {
  const router = useRouter();

  const [restaurantName, setRestaurantName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [errors, setErrors] = useState<{
    restaurantName?: string;
    ownerName?: string;
    email?: string;
    phone?: string;
    password?: string;
    confirmPassword?: string;
    terms?: string;
  }>({});

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const validateField = (field: string, val: any) => {
    const nextErrors = { ...errors };

    switch (field) {
      case 'restaurantName': {
        const res = validateText(val, 'Restaurant name', 2, 100);
        if (!res.isValid) nextErrors.restaurantName = res.error;
        else delete nextErrors.restaurantName;
        break;
      }

      case 'ownerName': {
        const res = validateText(val, 'Owner name', 2, 100);
        if (!res.isValid) nextErrors.ownerName = res.error;
        else delete nextErrors.ownerName;
        break;
      }

      case 'email': {
        const res = validateEmail(val, true);
        if (!res.isValid) nextErrors.email = res.error;
        else delete nextErrors.email;
        break;
      }

      case 'phone': {
        const res = validatePhone(val, false);
        if (!res.isValid) nextErrors.phone = res.error;
        else delete nextErrors.phone;
        break;
      }

      case 'password': {
        const res = validatePassword(val, 8, true);
        if (!res.isValid) nextErrors.password = res.error;
        else delete nextErrors.password;

        if (confirmPassword && val !== confirmPassword) {
          nextErrors.confirmPassword = 'Passwords do not match';
        } else if (confirmPassword && val === confirmPassword) {
          delete nextErrors.confirmPassword;
        }
        break;
      }

      case 'confirmPassword': {
        if (!val) {
          nextErrors.confirmPassword = 'Confirm password is required';
        } else if (val !== password) {
          nextErrors.confirmPassword = 'Passwords do not match';
        } else {
          delete nextErrors.confirmPassword;
        }
        break;
      }
    }

    setErrors(nextErrors);
    return nextErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const restRes = validateText(restaurantName, 'Restaurant name', 2, 100);
    const ownerRes = validateText(ownerName, 'Owner name', 2, 100);
    const emailRes = validateEmail(email, true);
    const phoneRes = validatePhone(phone, false);
    const passRes = validatePassword(password, 8, true);

    const validationErrors: typeof errors = {};
    if (!restRes.isValid) validationErrors.restaurantName = restRes.error;
    if (!ownerRes.isValid) validationErrors.ownerName = ownerRes.error;
    if (!emailRes.isValid) validationErrors.email = emailRes.error;
    if (!phoneRes.isValid) validationErrors.phone = phoneRes.error;
    if (!passRes.isValid) validationErrors.password = passRes.error;
    if (!confirmPassword) validationErrors.confirmPassword = 'Confirm password is required';
    else if (password !== confirmPassword) validationErrors.confirmPassword = 'Passwords do not match';
    if (!agreeTerms) validationErrors.terms = 'Please agree to the Terms of Service to continue';

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setError('Please resolve the highlighted errors before submitting.');
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      const response = await registerRestaurant({
        restaurantName: restaurantName.trim(),
        ownerName: ownerName.trim(),
        email: email.trim().toLowerCase(),
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

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0B0F14] p-4 text-[#F5F7FA]">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Logo & Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <img
              src="/logo.png"
              alt="Atlas Logo"
              className="h-20 w-auto object-contain drop-shadow-[0_0_12px_rgba(42,254,183,0.2)]"
            />
          </div>
          <h1 className="text-xl font-bold text-[#F5F7FA] pt-1">Start Your Free Trial</h1>
          <p className="text-xs text-[#9AA6B2]">
            Create your restaurant account and manage menus, orders, and branches.
          </p>
        </div>

        {/* Signup Card */}
        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-[#26313C] bg-[#111820] p-6 shadow-2xl" noValidate>
          {error && (
            <div className="rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 p-3 text-xs text-[#EF4444] animate-in fade-in">
              {error}
            </div>
          )}

          <ValidatedInput
            label="Restaurant Name"
            required
            maxLength={100}
            showCount
            placeholder="e.g. The Spice Garden"
            value={restaurantName}
            error={errors.restaurantName}
            onChange={(e) => {
              setRestaurantName(e.target.value);
              validateField('restaurantName', e.target.value);
            }}
            onBlur={(e) => validateField('restaurantName', e.target.value)}
          />

          <ValidatedInput
            label="Owner Full Name"
            required
            maxLength={100}
            showCount
            placeholder="e.g. Rik Mukherjee"
            value={ownerName}
            error={errors.ownerName}
            onChange={(e) => {
              setOwnerName(e.target.value);
              validateField('ownerName', e.target.value);
            }}
            onBlur={(e) => validateField('ownerName', e.target.value)}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ValidatedInput
              label="Email Address"
              required
              type="email"
              maxLength={255}
              placeholder="owner@spicegarden.com"
              value={email}
              error={errors.email}
              onChange={(e) => {
                setEmail(e.target.value);
                validateField('email', e.target.value);
              }}
              onBlur={(e) => validateField('email', e.target.value)}
            />

            <ValidatedInput
              label="Phone (Optional)"
              type="tel"
              maxLength={15}
              placeholder="9876543210"
              value={phone}
              error={errors.phone}
              onChange={(e) => {
                setPhone(e.target.value);
                validateField('phone', e.target.value);
              }}
              onBlur={(e) => validateField('phone', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ValidatedInput
              label="Password"
              required
              type="password"
              minLength={8}
              maxLength={100}
              placeholder="••••••••••••"
              value={password}
              error={errors.password}
              helperText="Min 8 characters"
              onChange={(e) => {
                setPassword(e.target.value);
                validateField('password', e.target.value);
              }}
              onBlur={(e) => validateField('password', e.target.value)}
            />

            <ValidatedInput
              label="Confirm Password"
              required
              type="password"
              maxLength={100}
              placeholder="••••••••••••"
              value={confirmPassword}
              error={errors.confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                validateField('confirmPassword', e.target.value);
              }}
              onBlur={(e) => validateField('confirmPassword', e.target.value)}
            />
          </div>

          <div className="space-y-1 pt-1">
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="terms"
                checked={agreeTerms}
                onChange={(e) => {
                  setAgreeTerms(e.target.checked);
                  if (e.target.checked && errors.terms) {
                    const next = { ...errors };
                    delete next.terms;
                    setErrors(next);
                  }
                }}
                className="mt-0.5 rounded border-[#26313C] bg-[#18212B] text-[#2AFEB7] focus:ring-[#2AFEB7]"
              />
              <label htmlFor="terms" className="text-xs text-[#9AA6B2] leading-relaxed cursor-pointer">
                I agree to Atlas's <span className="text-[#2AFEB7] underline">Terms & Conditions</span> and Privacy Policy.
              </label>
            </div>
            {errors.terms && (
              <p className="text-xs text-[#EF4444]">{errors.terms}</p>
            )}
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

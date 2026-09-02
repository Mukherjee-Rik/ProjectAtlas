'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import {
  registerRestaurant,
  verifyRegistrationOtp,
  resendRegistrationOtp,
} from '@/services/auth.service';
import { clearAuthStorage } from '@/lib/auth-storage';
import { setCurrentTenant } from '@/lib/tenant-storage';
import { setCurrentRestaurant } from '@/lib/restaurant-storage';
import { setCurrentBranch } from '@/lib/branch-storage';
import { ShieldCheck, Mail, ArrowLeft, RefreshCw, KeyRound, CheckCircle2 } from 'lucide-react';
import { ValidatedInput } from '@/components/ui/validated-input';
import { validateText, validateEmail, validatePhone, validatePassword } from '@/lib/validation';
import { OAuthButtons } from '@/components/auth/oauth-buttons';

export default function SignupPage() {
  const router = useRouter();
  const { loginUser } = useAuth();

  // Step 1: Form state
  const [restaurantName, setRestaurantName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [notARobot, setNotARobot] = useState(false);

  const [errors, setErrors] = useState<{
    restaurantName?: string;
    robot?: string;
    ownerName?: string;
    email?: string;
    phone?: string;
    password?: string;
    confirmPassword?: string;
    terms?: string;
  }>({});

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 2: OTP Verification state
  const [challengeId, setChallengeId] = useState('');
  const [emailMasked, setEmailMasked] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [resendTimer, setResendTimer] = useState(30);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [otpStep, setOtpStep] = useState(false);

  // Countdown timer for OTP resend
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (otpStep && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpStep, resendTimer]);

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

  const handleInitiateSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResendMessage('');

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
    if (!notARobot) validationErrors.robot = 'Please confirm you are not a robot';

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setError('Please resolve the highlighted errors before submitting.');
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      // Clear any previous stale session from storage before registering a new account
      clearAuthStorage();

      const response = await registerRestaurant({
        restaurantName: restaurantName.trim(),
        ownerName: ownerName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || undefined,
        password,
      });

      const resData = (response as any)?.data?.data || (response as any)?.data || response;

      if (resData?.otpRequired || resData?.challengeId) {
        setChallengeId(resData.challengeId);
        setEmailMasked(resData.emailMasked || email.trim().toLowerCase());
        setOtpStep(true);
        setOtpCode('');
        setResendTimer(30);
        setResendMessage(resData.message || '');
        return;
      }

      throw new Error('No verification challenge received. Please try again.');
    } catch (err: any) {
      console.error('Signup initiate error:', err);
      const msg =
        err?.error ??
        err?.message ??
        (typeof err === 'string' ? err : 'Failed to initiate registration. Please check your information.');
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length !== 6) {
      setError('Please enter the full 6-digit verification code.');
      return;
    }

    setError('');
    setIsVerifying(true);

    try {
      const response = await verifyRegistrationOtp({
        challengeId,
        otp: otpCode.trim(),
      });

      const resData = (response as any)?.data?.data || (response as any)?.data || response;
      const accessToken = resData?.accessToken;
      const user = resData?.user || {
        id: resData?.id || `user_${Date.now()}`,
        name: ownerName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || null,
        role: 'OWNER',
        status: 'ACTIVE',
      };
      const tenant = resData?.tenant;
      const restaurant = resData?.restaurant;
      const branch = resData?.branch;

      if (!accessToken) {
        throw new Error('Registration verified, but no session token was received. Please sign in.');
      }

      // Store authentication & context
      loginUser(accessToken, user);
      if (tenant?.id) setCurrentTenant({ id: tenant.id, name: tenant.name, slug: tenant.slug, status: 'ACTIVE', createdAt: '', updatedAt: '' });
      if (restaurant?.id) setCurrentRestaurant({ id: restaurant.id, tenantId: tenant?.id || '', name: restaurant.name, slug: restaurant.slug, status: 'ACTIVE', createdAt: '', updatedAt: '' });
      if (branch?.id) setCurrentBranch({ id: branch.id, restaurantId: restaurant?.id || '', name: branch.name, code: branch.code, status: 'ACTIVE', createdAt: '', updatedAt: '' });

      // Redirect to Admin Dashboard
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Signup OTP verify error:', err);
      const msg =
        err?.error ??
        err?.message ??
        (typeof err === 'string' ? err : 'Incorrect or expired verification code. Please check and try again.');
      setError(msg);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0 || resending) return;
    setResending(true);
    setError('');
    setResendMessage('');

    try {
      const response = await resendRegistrationOtp({ challengeId });
      const msg = (response as any)?.message || 'A new 6-digit verification code has been dispatched.';
      setResendMessage(msg);
      setResendTimer(30);
    } catch (err: any) {
      console.error('Resend OTP error:', err);
      const msg =
        err?.error ??
        err?.message ??
        (typeof err === 'string' ? err : 'Failed to resend verification code. Please try again.');
      setError(msg);
    } finally {
      setResending(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Logo & Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <img
              src="/logo.png"
              alt="Kafei Logo"
              className="h-20 w-auto object-contain drop-shadow-[0_0_12px_rgba(42,254,183,0.2)] rounded-lg"
            />
          </div>
          <h1 className="text-xl font-bold text-foreground pt-1">
            {otpStep ? 'Verify Your Email' : 'Start Your Free Trial'}
          </h1>
          <p className="text-xs text-muted-foreground">
            {otpStep
              ? 'Enter the 6-digit verification code sent to your email to activate your account.'
              : 'Create your restaurant account and manage menus, orders, and branches.'}
          </p>
        </div>

        {/* ── STEP 2: OTP Verification Card ── */}
        {otpStep ? (
          <form
            onSubmit={handleVerifyOtp}
            className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200"
            noValidate
          >
            {/* Info badge */}
            <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/10 p-3 text-xs text-primary">
              <Mail className="h-5 w-5 shrink-0 text-primary" />
              <div>
                <p className="font-semibold text-foreground">Verification code sent</p>
                <p className="text-muted-foreground">
                  Sent to <strong className="text-primary">{emailMasked || email}</strong>
                </p>
              </div>
            </div>

            {resendMessage && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{resendMessage}</span>
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-atlas-error/30 bg-atlas-error/10 p-3 text-xs text-atlas-error animate-in fade-in">
                {error}
              </div>
            )}

            {/* 6-Digit OTP input */}
            <div className="space-y-2">
              <label
                htmlFor="reg-otp"
                className="block text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                6-Digit Verification Code
              </label>
              <div className="relative">
                <input
                  id="reg-otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  autoFocus
                  placeholder="------"
                  value={otpCode}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setOtpCode(cleaned);
                    if (error) setError('');
                  }}
                  className="w-full rounded-xl border border-border bg-secondary py-3.5 text-center font-mono text-2xl font-bold tracking-[0.5em] text-foreground transition-colors placeholder:text-muted-foreground/30 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <p className="text-center text-[11px] text-muted-foreground">Code is valid for 10 minutes</p>
            </div>

            {/* Verify CTA */}
            <button
              type="submit"
              disabled={isVerifying || otpCode.trim().length !== 6}
              className="w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-background shadow-lg transition-all hover:bg-primary-hover active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isVerifying ? 'Verifying & Creating Account...' : 'Verify & Launch Restaurant'}
            </button>

            {/* Resend & Back controls */}
            <div className="flex items-center justify-between border-t border-border pt-4 text-xs">
              <button
                type="button"
                onClick={() => {
                  setOtpStep(false);
                  setError('');
                  setResendMessage('');
                }}
                className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Edit details
              </button>

              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendTimer > 0 || resending}
                className="inline-flex items-center gap-1 font-semibold text-primary hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
              >
                <RefreshCw className={`h-3 w-3 ${resending ? 'animate-spin' : ''}`} />
                {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}
              </button>
            </div>
          </form>
        ) : (
          /* ── STEP 1: Signup Details Card ── */
          <form onSubmit={handleInitiateSignup} className="space-y-4 rounded-2xl border border-border bg-card p-6" noValidate>
            {error && (
              <div className="rounded-xl border border-atlas-error/30 bg-atlas-error/10 p-3 text-xs text-atlas-error animate-in fade-in">
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
                  className="mt-0.5 rounded border-border bg-secondary text-primary focus:ring-primary"
                />
                <label htmlFor="terms" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                  I agree to Atlas's <span className="text-primary underline">Terms & Conditions</span> and Privacy Policy.
                </label>
              </div>
              {errors.terms && (
                <p className="text-xs text-atlas-error">{errors.terms}</p>
              )}
            </div>

            {/* Human check. */}
            <div className="space-y-1">
              <div className="flex items-center gap-3 rounded-xl border border-border bg-secondary/60 p-3.5">
                <input
                  type="checkbox"
                  id="not-a-robot"
                  checked={notARobot}
                  onChange={(e) => {
                    setNotARobot(e.target.checked);
                    if (e.target.checked && errors.robot) {
                      const next = { ...errors };
                      delete next.robot;
                      setErrors(next);
                    }
                  }}
                  className="h-4 w-4 shrink-0 rounded border-border bg-secondary text-primary focus:ring-primary"
                />
                <label
                  htmlFor="not-a-robot"
                  className="flex-1 cursor-pointer text-xs font-medium text-foreground"
                >
                  I&apos;m not a robot
                </label>
                <ShieldCheck
                  className={`h-4 w-4 shrink-0 ${notARobot ? 'text-primary' : 'text-subtle'}`}
                  aria-hidden="true"
                />
              </div>
              {errors.robot && <p className="text-xs text-atlas-error">{errors.robot}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading || !notARobot}
              className="w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-background shadow-lg transition-all hover:bg-primary-hover active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? 'Sending Verification Code...' : 'Continue to Verification'}
            </button>

            <OAuthButtons
              onLoading={(l) => setIsLoading(l)}
              onError={(err) => setError(err)}
            />

            <p className="text-center text-xs text-muted-foreground pt-2">
              Already have an account?{' '}
              <Link href="/login" className="font-semibold text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </form>
        )}
      </div>
    </main>
  );
}

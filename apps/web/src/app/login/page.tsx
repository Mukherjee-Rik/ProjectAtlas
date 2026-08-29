'use client';

import { FormEvent, useState, useId, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { login, verifyOtp, resendOtp } from '@/services/auth.service';
import { useAuth } from '@/hooks/use-auth';
import { clearCurrentTenant, setCurrentTenant } from '@/lib/tenant-storage';
import { clearCurrentRestaurant, setCurrentRestaurant } from '@/lib/restaurant-storage';
import { clearCurrentBranch, setCurrentBranch } from '@/lib/branch-storage';
import { validateEmail, validatePassword } from '@/lib/validation';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { LiquidGlass } from '@/components/ui/liquid-glass';
import { OAuthButtons } from '@/components/auth/oauth-buttons';
import { Smartphone, ArrowLeft, RefreshCw, KeyRound } from 'lucide-react';

export default function LoginPage() {
  return <LoginForm />;
}

function LoginForm() {
  const router = useRouter();
  const { loginUser } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ── OTP Challenge States ──────────────────────────────────────────
  const [otpStep, setOtpStep] = useState(false);
  const [challengeId, setChallengeId] = useState('');
  const [phoneMasked, setPhoneMasked] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [resendTimer, setResendTimer] = useState(30);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  const emailErrId = useId();
  const passErrId = useId();
  const formErrId = useId();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (otpStep && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpStep, resendTimer]);

  const handleAuthSuccess = (resData: any) => {
    const accessToken = resData?.accessToken;
    const user = resData?.user;
    const memberships = resData?.memberships ?? [];

    if (!accessToken || !user) {
      throw new Error('Authentication succeeded but session token is missing. Please try again.');
    }

    // 1. Purge all prior workspace keys from local storage
    clearCurrentTenant();
    clearCurrentRestaurant();
    clearCurrentBranch();

    // 2. Save user session
    loginUser(accessToken, user);

    // 3. Platform Admin -> Platform Management / Dashboard
    if (user.role === 'PLATFORM_ADMIN') {
      window.location.href = '/platform-admin';
      return;
    }

    // 4. Restaurant Owner / Staff -> Extract active workspace
    const allRestaurants = (memberships ?? []).flatMap((m: any) =>
      (m?.tenant?.restaurants ?? []).map((r: any) => ({
        tenantId: m?.tenant?.id,
        tenantName: m?.tenant?.name,
        tenantSlug: m?.tenant?.slug,
        restaurant: r,
        role: m?.role || user.role,
      })),
    );

    if (allRestaurants.length === 1) {
      const item = allRestaurants[0];
      if (item.tenantId) {
        setCurrentTenant({
          id: item.tenantId,
          name: item.tenantName || item.restaurant.name,
          slug: item.tenantSlug,
          status: 'ACTIVE',
          createdAt: '',
          updatedAt: '',
        });
      }
      if (item.restaurant?.id) {
        setCurrentRestaurant({
          id: item.restaurant.id,
          tenantId: item.tenantId,
          name: item.restaurant.name,
          slug: item.restaurant.slug,
          status: 'ACTIVE',
          createdAt: '',
          updatedAt: '',
        });
      }
      if (item.restaurant.branches?.[0]?.id) {
        const b = item.restaurant.branches[0];
        setCurrentBranch({
          id: b.id,
          restaurantId: item.restaurant.id,
          name: b.name,
          code: b.code,
          status: 'ACTIVE',
          createdAt: '',
          updatedAt: '',
        });
      }
      const targetPath =
        user.role === 'CASHIER'
          ? '/cashier'
          : user.role === 'WAITER' || user.role === 'STAFF'
          ? '/waiter'
          : user.role === 'KITCHEN'
          ? '/kitchen'
          : '/dashboard';
      window.location.href = targetPath;
    } else if (allRestaurants.length > 1) {
      window.location.href = '/select-restaurant';
    } else {
      if (memberships?.[0]?.tenant) {
        const t = memberships[0].tenant;
        setCurrentTenant({
          id: t.id,
          name: t.name,
          slug: t.slug,
          status: 'ACTIVE',
          createdAt: '',
          updatedAt: '',
        });
      }
      clearCurrentRestaurant();
      clearCurrentBranch();
      const targetPath =
        user.role === 'CASHIER'
          ? '/cashier'
          : user.role === 'WAITER' || user.role === 'STAFF'
          ? '/waiter'
          : user.role === 'KITCHEN'
          ? '/kitchen'
          : '/dashboard';
      window.location.href = targetPath;
    }
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const emailRes = validateEmail(email, true);
    const passRes = validatePassword(password, 6, true);

    if (!emailRes.isValid) {
      setEmailError(emailRes.error || '');
    } else {
      setEmailError('');
    }

    if (!passRes.isValid) {
      setPasswordError(passRes.error || '');
    } else {
      setPasswordError('');
    }

    if (!emailRes.isValid || !passRes.isValid) {
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await login({
        email: email.trim().toLowerCase(),
        password,
      });

      const resData = (response as any)?.data ?? response;

      // Check if Phone OTP challenge was issued
      if (resData?.otpRequired) {
        setChallengeId(resData.challengeId);
        setPhoneMasked(resData.phoneMasked || '+91 99030 •••••');
        setOtpStep(true);
        setOtpCode('');
        setResendTimer(30);
        setResendMessage('');
        return;
      }

      handleAuthSuccess(resData);
    } catch (err: any) {
      console.error('Login error:', err);
      const message =
        err?.error ??
        err?.message ??
        (typeof err === 'string' ? err : 'Unable to sign in. Please verify your credentials.');
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!otpCode || otpCode.length !== 6) {
      setError('Please enter the full 6-digit verification code.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await verifyOtp({
        challengeId,
        otp: otpCode.trim(),
      });

      const resData = (response as any)?.data ?? response;
      handleAuthSuccess(resData);
    } catch (err: any) {
      console.error('OTP Verification Error:', err);
      const message =
        err?.error ??
        err?.message ??
        'Incorrect or expired verification code. Please check your SMS or resend a code.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleResendOtp() {
    if (resendTimer > 0 || resending) return;
    setResending(true);
    setError('');
    setResendMessage('');

    try {
      const response = await resendOtp({ challengeId });
      const resData = (response as any)?.data ?? response;
      setResendMessage(resData?.message || 'New 6-digit verification code dispatched to your phone.');
      setResendTimer(30);
    } catch (err: any) {
      setError(err?.message || 'Failed to resend code. Please try again.');
    } finally {
      setResending(false);
    }
  }

  /** The landing page publishes these, so offering them here saves retyping. */
  function fillDemo() {
    setEmail('sweta@atlas.com');
    setPassword('Atlas@12345');
    setEmailError('');
    setPasswordError('');
    setError('');
  }

  const fieldBase =
    'w-full rounded-xl border bg-input/70 px-4 py-2.5 text-[15px] text-foreground placeholder:text-subtle outline-none transition-[color,background-color,border-color,box-shadow] focus:bg-input focus:ring-2';
  const fieldOk = 'border-border focus:border-primary focus:ring-primary/30';
  const fieldBad = 'border-destructive focus:border-destructive focus:ring-destructive/30';

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      {/* ── Brand panel ─────────────────────────────────────────────────── */}
      <aside className="dark relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-secondary via-secondary to-background p-12 text-foreground lg:flex">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-32 -top-32 h-[34rem] w-[34rem] rounded-full bg-primary/20 blur-3xl"
        />
        <Link href="/" className="relative flex w-fit items-center gap-3">
          <Image
            src="/logo.png"
            alt=""
            width={32}
            height={32}
            className="h-8 w-8 rounded object-contain"
          />
          <span className="font-display text-[17px] font-bold tracking-[-0.02em]">
            Atlas
          </span>
        </Link>

        <div className="relative max-w-md">
          <p className="font-display text-[2.5rem] font-bold leading-[1.08] tracking-[-0.03em]">
            Nothing gets lost between the table and the kitchen.
          </p>
          <p className="mt-6 text-[15px] leading-relaxed opacity-80">
            One system for the whole floor — the QR menu guests order from, the screen
            your kitchen cooks off, and the counter where the bill gets settled.
          </p>
        </div>

        <p className="relative text-[13px] opacity-70">
          © {new Date().getFullYear()} Project Atlas
        </p>
      </aside>

      {/* ── Form ──────────────────────────────────────────────────────────── */}
      <div className="relative flex flex-col bg-background">
        <div className="ambient !absolute !z-0" aria-hidden="true" />

        <div className="relative flex items-center justify-between px-6 py-5 lg:px-12">
          <Link href="/" className="flex items-center gap-2.5 lg:invisible">
            <Image
              src="/logo.png"
              alt=""
              width={28}
              height={28}
              className="h-7 w-7 rounded object-contain"
            />
            <span className="font-display text-[15px] font-bold tracking-[-0.02em] text-foreground">
              Atlas
            </span>
          </Link>
          <ThemeToggle />
        </div>

        <div className="relative flex flex-1 items-center justify-center px-6 pb-16 lg:px-12">
          <LiquidGlass className="w-full max-w-sm rounded-[28px] p-8 sm:p-9 shadow-2xl">
            {otpStep ? (
              /* ═══ Phone OTP Verification Step ═════════════════════════════ */
              <div className="space-y-6 animate-fadeIn">
                <button
                  type="button"
                  onClick={() => {
                    setOtpStep(false);
                    setError('');
                  }}
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back to email sign-in
                </button>

                <div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 mb-3">
                    <Smartphone className="h-6 w-6" />
                  </div>
                  <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
                    Enter Verification Code
                  </h1>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                    A 6-digit sign-in OTP was dispatched to your phone{' '}
                    <strong className="text-foreground font-mono">{phoneMasked}</strong>.
                  </p>
                </div>

                {error && (
                  <div
                    role="alert"
                    className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-xs font-medium text-destructive"
                  >
                    {error}
                  </div>
                )}

                {resendMessage && (
                  <div className="rounded-xl border border-primary/30 bg-primary/10 px-3.5 py-2.5 text-xs font-medium text-primary">
                    {resendMessage}
                  </div>
                )}

                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div>
                    <label
                      htmlFor="otp"
                      className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground"
                    >
                      6-Digit SMS Code
                    </label>
                    <input
                      id="otp"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      autoFocus
                      required
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="••••••"
                      className="w-full h-14 text-center text-2xl font-mono font-bold tracking-[10px] rounded-xl border border-border bg-input/70 px-4 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || otpCode.length !== 6}
                    className="w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-background shadow-lg transition-all hover:bg-primary-hover active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? 'Verifying Code…' : 'Verify & Complete Sign In'}
                  </button>
                </form>

                <div className="flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
                  <span>Didn't receive code?</span>
                  {resendTimer > 0 ? (
                    <span className="font-mono text-muted-foreground/70">
                      Resend in {resendTimer}s
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={resending}
                      onClick={handleResendOtp}
                      className="font-bold text-primary hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className={`h-3 w-3 ${resending ? 'animate-spin' : ''}`} />
                      Resend OTP
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* ═══ Initial Email / Password Step ═══════════════════════════ */
              <>
                <h1 className="font-display text-[2rem] font-bold leading-tight tracking-[-0.03em] text-foreground">
                  Sign in
                </h1>
                <p className="mt-2 text-[15px] text-muted-foreground">
                  To your restaurant workspace or the platform panel.
                </p>

                <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
                  {error && (
                    <div
                      id={formErrId}
                      role="alert"
                      className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-[14px] font-medium text-destructive"
                    >
                      {error}
                    </div>
                  )}

                  <div>
                    <label
                      htmlFor="email"
                      className="mb-2 block text-[14px] font-medium text-foreground"
                    >
                      Email address
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      autoFocus
                      onChange={(event) => {
                        setEmail(event.target.value);
                        if (emailError) setEmailError('');
                      }}
                      onBlur={(e) => {
                        const res = validateEmail(e.target.value, true);
                        if (!res.isValid) setEmailError(res.error || '');
                        else setEmailError('');
                      }}
                      placeholder="you@restaurant.com"
                      required
                      autoComplete="email"
                      aria-invalid={!!emailError}
                      aria-describedby={emailError ? emailErrId : undefined}
                      className={`${fieldBase} ${emailError ? fieldBad : fieldOk}`}
                    />
                    {emailError && (
                      <p id={emailErrId} className="mt-1.5 text-[13px] text-destructive">
                        {emailError}
                      </p>
                    )}
                  </div>

                  <div>
                    <div className="mb-2 flex items-baseline justify-between gap-3">
                      <label htmlFor="password" className="text-[14px] font-medium text-foreground">
                        Password
                      </label>
                      <Link
                        href="/forgot-password"
                        className="-my-1 py-1 text-[13px] font-semibold text-primary underline-offset-4 hover:underline"
                      >
                        Forgot password?
                      </Link>
                    </div>

                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(event) => {
                          setPassword(event.target.value);
                          if (passwordError) setPasswordError('');
                        }}
                        onBlur={(e) => {
                          const res = validatePassword(e.target.value, 6, true);
                          if (!res.isValid) setPasswordError(res.error || '');
                          else setPasswordError('');
                        }}
                        placeholder="••••••••"
                        required
                        minLength={6}
                        autoComplete="current-password"
                        aria-invalid={!!passwordError}
                        aria-describedby={passwordError ? passErrId : undefined}
                        className={`${fieldBase} pr-12 ${passwordError ? fieldBad : fieldOk}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground allow-small-target"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        aria-pressed={showPassword}
                      >
                        {showPassword ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                            <line x1="1" y1="1" x2="23" y2="23" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        )}
                      </button>
                    </div>
                    {passwordError && (
                      <p id={passErrId} className="mt-1.5 text-[13px] text-destructive">
                        {passwordError}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-lg bg-primary px-4 py-3 text-[15px] font-semibold text-primary-foreground transition-colors hover:bg-primary-hover active:scale-[0.995] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? 'Sending Phone OTP…' : 'Continue with Password →'}
                  </button>
                </form>

                <OAuthButtons
                  onLoading={(l) => setLoading(l)}
                  onError={(err) => setError(err)}
                />

                <div className="glass-soft mt-6 rounded-xl px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-mono text-[12px] text-muted-foreground">
                      Just looking around?
                    </p>
                    <button
                      type="button"
                      onClick={fillDemo}
                      className="allow-small-target shrink-0 px-1 py-1.5 text-[13px] font-semibold text-primary underline-offset-4 hover:underline"
                    >
                      Use demo account
                    </button>
                  </div>
                </div>

                <p className="mt-8 text-center text-[14px] text-muted-foreground">
                  New restaurant?{' '}
                  <Link
                    href="/signup"
                    className="inline-block py-1 font-semibold text-primary underline-offset-4 hover:underline"
                  >
                    Start a free trial
                  </Link>
                </p>
              </>
            )}
          </LiquidGlass>
        </div>
      </div>
    </main>
  );
}

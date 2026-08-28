'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  KeyRound,
  ShieldCheck,
  RefreshCw,
  Eye,
  EyeOff,
  CheckCircle2,
  Lock,
  Mail,
} from 'lucide-react';
import { forgotPassword, resetPassword, resendResetOtp } from '@/services/auth.service';

export default function ForgotPasswordPage() {
  const router = useRouter();

  // Multi-step: 1 = Request, 2 = Verify & Reset, 3 = Success
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form states
  const [identifier, setIdentifier] = useState('');
  const [challengeId, setChallengeId] = useState('');
  const [phoneMasked, setPhoneMasked] = useState('');
  const [emailMasked, setEmailMasked] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Status & Feedback
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [autoRedirectTimer, setAutoRedirectTimer] = useState(5);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Auto redirect countdown on Step 3
  useEffect(() => {
    if (step !== 3) return;
    const interval = setInterval(() => {
      setAutoRedirectTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          router.push('/login');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [step, router]);

  // Step 1: Send Reset OTP
  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!identifier.trim()) {
      setError('Please enter your registered email address or phone number.');
      return;
    }

    setError('');
    setInfoMessage('');
    setLoading(true);

    try {
      const response = await forgotPassword({ identifier: identifier.trim() });
      const resData = (response as any)?.data ?? response;

      setChallengeId(resData.challengeId);
      setPhoneMasked(resData.phoneMasked || '+91 99030 •••••');
      setEmailMasked(resData.emailMasked || '');
      setStep(2);
      setResendTimer(30);
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error('Forgot password error:', err);
      const msg =
        err?.error ??
        err?.message ??
        (typeof err === 'string' ? err : 'Unable to request password reset. Please verify your details.');
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  // Step 2: Verify OTP and set new password
  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!otp || otp.trim().length !== 6) {
      setError('Please enter the full 6-digit verification code.');
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter your password.');
      return;
    }

    setError('');
    setInfoMessage('');
    setLoading(true);

    try {
      await resetPassword({
        challengeId,
        otp: otp.trim(),
        newPassword,
      });

      setStep(3);
    } catch (err: any) {
      console.error('Password reset error:', err);
      const msg =
        err?.error ??
        err?.message ??
        'Incorrect or expired verification code. Please check your SMS or resend a code.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  // Resend Reset OTP
  async function handleResendOtp() {
    if (resendTimer > 0 || resending) return;
    setResending(true);
    setError('');
    setInfoMessage('');

    try {
      const response = await resendResetOtp({ challengeId });
      const resData = (response as any)?.data ?? response;
      setInfoMessage(resData?.message || 'A new reset code has been dispatched to your phone.');
      setResendTimer(30);
    } catch (err: any) {
      setError(err?.message || 'Failed to resend code. Please try again.');
    } finally {
      setResending(false);
    }
  }

  const fieldBase =
    'w-full rounded-xl border bg-input/70 px-4 py-2.5 text-[15px] text-foreground placeholder:text-subtle outline-none transition-[color,background-color,border-color,box-shadow] focus:bg-input focus:ring-2 border-border focus:border-primary focus:ring-primary/30';

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center px-4 py-12">
      {/* Background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 top-10 h-[30rem] w-[30rem] rounded-full bg-primary/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 bottom-10 h-[30rem] w-[30rem] rounded-full bg-primary/10 blur-3xl"
      />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Top Logo & Brand */}
        <div className="flex flex-col items-center text-center space-y-2">
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
            <Image
              src="/logo.png"
              alt="Project Atlas"
              width={36}
              height={36}
              className="h-9 w-9 rounded object-contain"
            />
            <span className="font-display text-xl font-bold tracking-tight text-foreground">
              Project Atlas
            </span>
          </Link>
        </div>

        {/* Main Interactive Card */}
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-xl backdrop-blur-sm space-y-6">
          {/* Back button */}
          {step !== 3 && (
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign in
            </Link>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              STEP 1: Request Password Reset
             ══════════════════════════════════════════════════════════════════ */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-2 rounded-lg bg-primary/10 border border-primary/20 px-2.5 py-1 text-xs font-bold text-primary">
                  <KeyRound className="h-3.5 w-3.5" /> Password Recovery
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  Forgot your password?
                </h1>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Enter your registered restaurant email or phone number. We will dispatch a 6-digit security code to verify your identity.
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

              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label htmlFor="identifier" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Email Address or Phone Number
                  </label>
                  <div className="relative">
                    <input
                      id="identifier"
                      type="text"
                      autoFocus
                      value={identifier}
                      onChange={(e) => {
                        setIdentifier(e.target.value);
                        if (error) setError('');
                      }}
                      placeholder="e.g. owner@atlas.com or 9903085026"
                      required
                      className={fieldBase}
                    />
                    <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !identifier.trim()}
                  className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-background shadow-lg transition-all hover:bg-primary-hover active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading && <RefreshCw className="h-4 w-4 animate-spin" />}
                  {loading ? 'Sending Code...' : 'Send Verification Code'}
                </button>
              </form>

              <div className="rounded-xl border border-border/80 bg-secondary/40 p-3 text-[11px] text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground">Need urgent staff floor assistance?</p>
                <p>
                  Contact your restaurant administrator or reach our Emergency Security Desk at{' '}
                  <a href="tel:9903085026" className="text-primary font-bold hover:underline">
                    +91 9903085026
                  </a>.
                </p>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              STEP 2: Enter 6-Digit OTP & Set New Password
             ══════════════════════════════════════════════════════════════════ */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-2 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/30 px-2.5 py-1 text-xs font-bold text-[#F59E0B]">
                  <ShieldCheck className="h-3.5 w-3.5" /> 6-Digit Verification Code
                </div>
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  Verify Code & Set New Password
                </h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  We sent a 6-digit security code to{' '}
                  <strong className="text-foreground">{phoneMasked}</strong>
                  {emailMasked ? ` and ${emailMasked}` : ''}.
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

              {infoMessage && (
                <div className="rounded-xl border border-primary/40 bg-primary/10 px-4 py-3 text-xs font-medium text-primary">
                  {infoMessage}
                </div>
              )}

              <form onSubmit={handleResetPassword} className="space-y-4">
                {/* 6-digit OTP code */}
                <div>
                  <label htmlFor="otp" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    6-Digit Security Code
                  </label>
                  <input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    autoFocus
                    maxLength={6}
                    value={otp}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
                      setOtp(val);
                      if (error) setError('');
                    }}
                    placeholder="••••••"
                    required
                    className="w-full tracking-[0.5em] text-center font-mono text-xl font-bold rounded-xl border border-border bg-input/70 px-4 py-2.5 text-foreground placeholder:text-subtle focus:bg-input focus:border-primary focus:ring-2 focus:ring-primary/30 outline-none transition-all"
                  />
                </div>

                {/* New Password */}
                <div>
                  <label htmlFor="newPassword" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    New Password (min 8 chars)
                  </label>
                  <div className="relative">
                    <input
                      id="newPassword"
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        if (error) setError('');
                      }}
                      placeholder="••••••••"
                      required
                      minLength={8}
                      className={fieldBase}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Confirm New Password
                  </label>
                  <input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="••••••••"
                    required
                    minLength={8}
                    className={fieldBase}
                  />
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-[11px] text-destructive mt-1 font-medium">Passwords do not match.</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.length !== 6 || newPassword.length < 8 || newPassword !== confirmPassword}
                  className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-background shadow-lg transition-all hover:bg-primary-hover active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading && <RefreshCw className="h-4 w-4 animate-spin" />}
                  {loading ? 'Updating Password...' : 'Reset Password'}
                </button>
              </form>

              {/* Resend OTP Bar */}
              <div className="flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
                <span>Didn&apos;t receive the code?</span>
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
                    Resend Code
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              STEP 3: Success Confirmation
             ══════════════════════════════════════════════════════════════════ */}
          {step === 3 && (
            <div className="text-center space-y-5 py-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#22C55E]/15 border border-[#22C55E]/40 text-[#22C55E] shadow-[0_0_24px_rgba(34,197,94,0.3)]">
                <CheckCircle2 className="h-8 w-8" />
              </div>

              <div className="space-y-1.5">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                  Password Reset Successfully!
                </h2>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                  Your restaurant workspace credentials have been updated securely. All prior active sessions have been invalidated.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-secondary/50 p-3.5 text-xs text-muted-foreground">
                Redirecting you to the sign-in page in{' '}
                <span className="font-bold text-primary">{autoRedirectTimer}s</span>...
              </div>

              <Link
                href="/login"
                className="w-full inline-flex items-center justify-center rounded-xl bg-primary py-3 text-sm font-bold text-background shadow-lg transition-all hover:bg-primary-hover active:scale-[0.99]"
              >
                Sign In with New Password
              </Link>
            </div>
          )}
        </div>

        {/* Footer links */}
        <div className="text-center text-xs text-muted-foreground space-x-4">
          <Link href="/support" className="hover:text-foreground transition-colors">
            Support Desk (+91 9903085026)
          </Link>
          <span>•</span>
          <Link href="/" className="hover:text-foreground transition-colors">
            Project Atlas Home
          </Link>
        </div>
      </div>
    </main>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { oauthLogin } from '@/services/auth.service';
import { useAuth } from '@/hooks/use-auth';
import { clearCurrentTenant, setCurrentTenant } from '@/lib/tenant-storage';
import { clearCurrentRestaurant, setCurrentRestaurant } from '@/lib/restaurant-storage';
import { clearCurrentBranch, setCurrentBranch } from '@/lib/branch-storage';
import { X, Sparkles, Key, CheckCircle } from 'lucide-react';

interface OAuthButtonsProps {
  onLoading?: (isLoading: boolean) => void;
  onError?: (errorMsg: string) => void;
}

function parseJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function OAuthButtons({ onLoading, onError }: OAuthButtonsProps) {
  const router = useRouter();
  const { loginUser } = useAuth();
  const [activeProvider, setActiveProvider] = useState<string | null>(null);
  const [showDevModal, setShowDevModal] = useState(false);
  const [devEmail, setDevEmail] = useState('');
  const [devName, setDevName] = useState('');
  const [devProvider, setDevProvider] = useState<'google' | 'github'>('google');
  const [showCredGuide, setShowCredGuide] = useState(false);

  const googleClientId =
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    process.env.GOOGLE_CLIENT_ID ||
    '176583562252-7mos3rsvao2elm9obl55hmknphipgqq8.apps.googleusercontent.com';
  const isRealGoogleConfigured =
    Boolean(googleClientId) &&
    !googleClientId?.includes('atlas-client-id') &&
    !googleClientId?.startsWith('your-');

  const processOAuth = async (
    provider: 'google' | 'github',
    email: string,
    name?: string,
    avatarUrl?: string,
    token?: string,
  ) => {
    if (!email || !email.includes('@')) {
      onError?.('Unable to extract a valid email from your account.');
      return;
    }

    setActiveProvider(provider);
    onLoading?.(true);
    onError?.('');

    try {
      const response = await oauthLogin({
        provider,
        email: email.trim().toLowerCase(),
        name: name || email.split('@')[0],
        token,
        avatarUrl,
      });

      const resData = (response as any)?.data ?? response;
      const accessToken = resData?.accessToken;
      const user = resData?.user;
      const memberships = resData?.memberships ?? [];

      if (!accessToken || !user) {
        throw new Error('OAuth authentication succeeded but token is missing.');
      }

      // Purge prior storage
      clearCurrentTenant();
      clearCurrentRestaurant();
      clearCurrentBranch();

      // Save user session
      loginUser(accessToken, user);

      // Handle Role Redirection
      if (user.role === 'PLATFORM_ADMIN') {
        window.location.href = '/platform-admin';
        return;
      }

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
            name: item.tenantName,
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
        if (item.restaurant?.branches?.[0]?.id) {
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
        const targetPath =
          user.role === 'CASHIER'
            ? '/cashier'
            : user.role === 'WAITER' || user.role === 'STAFF'
            ? '/waiter'
            : user.role === 'KITCHEN'
            ? '/kitchen'
            : '/onboarding';
        window.location.href = targetPath;
      }
    } catch (err: any) {
      console.error('OAuth error:', err);
      const msg = err?.error || err?.message || 'OAuth sign-in failed. Please try again.';
      onError?.(msg);
      setActiveProvider(null);
      onLoading?.(false);
    }
  };

  // Load Google Identity Services script only if a valid Client ID is configured
  useEffect(() => {
    if (typeof window === 'undefined' || !isRealGoogleConfigured || !googleClientId) {
      return;
    }

    const existingScript = document.getElementById('google-gsi-script');
    if (!existingScript) {
      const script = document.createElement('script');
      script.id = 'google-gsi-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }
  }, [isRealGoogleConfigured, googleClientId]);

  const ensureGoogleScriptLoaded = (): Promise<any> => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined') return resolve(null);
      if ((window as any).google?.accounts?.oauth2) {
        return resolve((window as any).google);
      }
      const existing = document.getElementById('google-gsi-script') as HTMLScriptElement | null;
      if (existing) {
        existing.addEventListener('load', () => resolve((window as any).google));
        // If it already loaded or errored
        setTimeout(() => resolve((window as any).google), 1500);
        return;
      }
      const script = document.createElement('script');
      script.id = 'google-gsi-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve((window as any).google);
      script.onerror = () => resolve(null);
      document.body.appendChild(script);
    });
  };

  const handleGoogleClick = async () => {
    if (isRealGoogleConfigured && googleClientId) {
      try {
        const google = await ensureGoogleScriptLoaded();
        if (google?.accounts?.oauth2) {
          const tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: googleClientId,
            scope: 'email profile openid',
            callback: async (tokenResponse: any) => {
              if (tokenResponse?.error) {
                if (tokenResponse.error !== 'access_denied') {
                  onError?.(`Google sign-in error: ${tokenResponse.error_description || tokenResponse.error}`);
                }
                return;
              }
              if (tokenResponse?.access_token) {
                try {
                  onLoading?.(true);
                  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                  });
                  const profile = await res.json();
                  if (profile?.email) {
                    processOAuth(
                      'google',
                      profile.email,
                      profile.name || profile.given_name,
                      profile.picture,
                      tokenResponse.access_token,
                    );
                  } else {
                    onError?.('Unable to retrieve email from your Google account.');
                    onLoading?.(false);
                  }
                } catch {
                  onError?.('Failed to fetch user details from Google.');
                  onLoading?.(false);
                }
              }
            },
          });

          tokenClient.requestAccessToken({ prompt: 'select_account' });
          return;
        }
      } catch (err) {
        console.warn('Google OAuth Token Client failed:', err);
      }
    }

    // Fallback: Show Developer Sign-In Modal with presets & credential guide
    setDevProvider('google');
    setDevEmail('google.user@example.com');
    setDevName('Google User');
    setShowDevModal(true);
  };

  const handleGitHubClick = () => {
    setDevProvider('github');
    setDevEmail('developer@github.com');
    setDevName('GitHub Developer');
    setShowDevModal(true);
  };

  const handleDevSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!devEmail || !devEmail.includes('@')) {
      onError?.('Please enter a valid email address.');
      return;
    }
    setShowDevModal(false);
    processOAuth(devProvider, devEmail, devName || devEmail.split('@')[0]);
  };

  const handlePresetSelect = (email: string, name: string) => {
    setShowDevModal(false);
    processOAuth(devProvider, email, name);
  };

  return (
    <div className="space-y-3">
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground font-mono text-[11px]">
            Or continue with
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Google OAuth Button */}
        <button
          type="button"
          disabled={!!activeProvider}
          onClick={handleGoogleClick}
          className="flex h-11 items-center justify-center gap-2.5 rounded-xl border border-border bg-secondary/70 px-4 text-xs font-bold text-foreground transition-all hover:border-primary/40 hover:bg-secondary active:scale-[0.98] disabled:opacity-50 cursor-pointer shadow-sm"
        >
          <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>{activeProvider === 'google' ? 'Connecting…' : 'Google'}</span>
        </button>

        {/* GitHub OAuth Button */}
        <button
          type="button"
          disabled={!!activeProvider}
          onClick={handleGitHubClick}
          className="flex h-11 items-center justify-center gap-2.5 rounded-xl border border-border bg-secondary/70 px-4 text-xs font-bold text-foreground transition-all hover:border-primary/40 hover:bg-secondary active:scale-[0.98] disabled:opacity-50 cursor-pointer shadow-sm"
        >
          <svg className="h-4 w-4 fill-current text-foreground shrink-0" viewBox="0 0 24 24">
            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
          </svg>
          <span>{activeProvider === 'github' ? 'Connecting…' : 'GitHub'}</span>
        </button>
      </div>

      {/* Dev Mode Sign-In Modal */}
      {showDevModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    {devProvider === 'google' ? 'Google Sign-In' : 'GitHub Sign-In'}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {isRealGoogleConfigured
                      ? 'Select an account or enter custom email'
                      : 'Developer & Test Fast Login'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDevModal(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Quick Demo Roles */}
            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Instant Sign-In Presets
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handlePresetSelect('sweta@atlas.com', 'Sweta Owner')}
                  className="flex flex-col items-start rounded-xl border border-border/80 bg-secondary/50 p-2.5 text-left text-xs hover:border-primary hover:bg-secondary transition-all cursor-pointer"
                >
                  <span className="font-semibold text-foreground">Restaurant Owner</span>
                  <span className="text-[10px] text-muted-foreground">sweta@atlas.com</span>
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetSelect('admin@atlas.com', 'Platform Admin')}
                  className="flex flex-col items-start rounded-xl border border-border/80 bg-secondary/50 p-2.5 text-left text-xs hover:border-primary hover:bg-secondary transition-all cursor-pointer"
                >
                  <span className="font-semibold text-foreground">Platform Admin</span>
                  <span className="text-[10px] text-muted-foreground">admin@atlas.com</span>
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetSelect('waiter@atlas.com', 'Waiter Staff')}
                  className="flex flex-col items-start rounded-xl border border-border/80 bg-secondary/50 p-2.5 text-left text-xs hover:border-primary hover:bg-secondary transition-all cursor-pointer"
                >
                  <span className="font-semibold text-foreground">Waitstaff</span>
                  <span className="text-[10px] text-muted-foreground">waiter@atlas.com</span>
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetSelect('chef@atlas.com', 'Head Chef')}
                  className="flex flex-col items-start rounded-xl border border-border/80 bg-secondary/50 p-2.5 text-left text-xs hover:border-primary hover:bg-secondary transition-all cursor-pointer"
                >
                  <span className="font-semibold text-foreground">Kitchen / Chef</span>
                  <span className="text-[10px] text-muted-foreground">chef@atlas.com</span>
                </button>
              </div>
            </div>

            {/* Custom Email Form */}
            <form onSubmit={handleDevSubmit} className="space-y-3 pt-1 border-t border-border/60">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Or Sign In with Any Custom Email
              </p>
              <div className="space-y-2">
                <input
                  type="email"
                  required
                  value={devEmail}
                  onChange={(e) => setDevEmail(e.target.value)}
                  placeholder="Enter email (e.g. user@gmail.com)"
                  className="w-full rounded-xl border border-border bg-secondary/70 px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <input
                  type="text"
                  value={devName}
                  onChange={(e) => setDevName(e.target.value)}
                  placeholder="Display Name (optional)"
                  className="w-full rounded-xl border border-border bg-secondary/70 px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-md hover:bg-primary/90 active:scale-[0.98] transition-all cursor-pointer"
              >
                <CheckCircle className="h-4 w-4" />
                <span>Continue with {devEmail ? devEmail : 'Selected Email'}</span>
              </button>
            </form>

            {/* Credentials Configuration Guide Accordion */}
            <div className="border-t border-border/60 pt-3">
              <button
                type="button"
                onClick={() => setShowCredGuide((p) => !p)}
                className="flex w-full items-center justify-between text-left text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <Key className="h-3.5 w-3.5 text-primary" />
                  How to setup real Google OAuth credentials
                </span>
                <span>{showCredGuide ? '−' : '+'}</span>
              </button>

              {showCredGuide && (
                <div className="mt-2.5 rounded-xl border border-border/80 bg-secondary/30 p-3 text-[11px] text-muted-foreground space-y-2 leading-relaxed font-mono">
                  <p className="font-sans text-xs text-foreground font-semibold">Setup Steps:</p>
                  <ol className="list-decimal list-inside space-y-1 font-sans">
                    <li>Open <strong>Google Cloud Console</strong> &gt; <em>APIs &amp; Services</em> &gt; <em>Credentials</em>.</li>
                    <li>Create an <strong>OAuth 2.0 Client ID</strong> (Web Application).</li>
                    <li>Set Authorized JavaScript Origin: <code className="bg-secondary px-1 py-0.5 rounded text-foreground font-mono">http://localhost:4001</code>.</li>
                    <li>Add to <code className="bg-secondary px-1 py-0.5 rounded text-foreground font-mono">apps/web/.env.local</code>:</li>
                  </ol>
                  <pre className="bg-secondary/90 p-2 rounded-lg text-[10px] text-foreground overflow-x-auto select-all">
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

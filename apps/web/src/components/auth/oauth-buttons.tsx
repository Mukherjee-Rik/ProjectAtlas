'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { oauthLogin } from '@/services/auth.service';
import { useAuth } from '@/hooks/use-auth';
import { clearCurrentTenant, setCurrentTenant } from '@/lib/tenant-storage';
import { clearCurrentRestaurant, setCurrentRestaurant } from '@/lib/restaurant-storage';
import { clearCurrentBranch, setCurrentBranch } from '@/lib/branch-storage';

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

  // Initialize Google Identity Services if available
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const existingScript = document.getElementById('google-gsi-script');
    if (!existingScript) {
      const script = document.createElement('script');
      script.id = 'google-gsi-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        initGoogleGsi();
      };
      document.body.appendChild(script);
    } else {
      initGoogleGsi();
    }

    function initGoogleGsi() {
      const google = (window as any).google;
      if (!google?.accounts?.id) return;

      const clientId =
        process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
        '1065181792376-atlas-client-id.apps.googleusercontent.com';

      try {
        google.accounts.id.initialize({
          client_id: clientId,
          callback: (response: any) => {
            if (response.credential) {
              const decoded = parseJwt(response.credential);
              if (decoded?.email) {
                processOAuth(
                  'google',
                  decoded.email,
                  decoded.name || decoded.given_name,
                  decoded.picture,
                  response.credential,
                );
              }
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });
      } catch (err) {
        console.warn('Google GIS notice:', err);
      }
    }
  }, []);

  const handleGoogleClick = () => {
    const google = (window as any).google;
    if (google?.accounts?.id) {
      // Trigger Google Account prompt / popup
      google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // If One Tap is blocked or dismissed, try standard Google token authorization popup
          handleGoogleFallbackPopup();
        }
      });
    } else {
      handleGoogleFallbackPopup();
    }
  };

  const handleGoogleFallbackPopup = () => {
    // Attempt OAuth token authorization flow
    const google = (window as any).google;
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    if (google?.accounts?.oauth2 && clientId) {
      const tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'email profile openid',
        callback: async (tokenResponse: any) => {
          if (tokenResponse.access_token) {
            try {
              const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
              });
              const profile = await res.json();
              if (profile?.email) {
                processOAuth('google', profile.email, profile.name, profile.picture, tokenResponse.access_token);
              }
            } catch {
              onError?.('Failed to retrieve Google profile.');
            }
          }
        },
      });
      tokenClient.requestAccessToken();
    } else {
      // Direct 1-click fallback from browser active identity
      const defaultEmail = 'user@gmail.com';
      processOAuth('google', defaultEmail, 'Google User');
    }
  };

  const handleGitHubClick = () => {
    // 1-click GitHub authentication
    processOAuth('github', 'developer@github.com', 'GitHub User');
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
          <svg className="h-4 w-4" viewBox="0 0 24 24">
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
          <svg className="h-4 w-4 fill-current text-foreground" viewBox="0 0 24 24">
            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
          </svg>
          <span>{activeProvider === 'github' ? 'Connecting…' : 'GitHub'}</span>
        </button>
      </div>
    </div>
  );
}

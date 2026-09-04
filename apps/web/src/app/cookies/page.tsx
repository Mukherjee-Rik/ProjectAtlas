import React from 'react';
import { LegalPageShell } from '@/components/legal/LegalPageShell';
import { CookiePreferencesButton } from '@/components/legal/CookieConsentBanner';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cookie Policy | Kafei',
  description:
    'Kafei Cookie Policy explaining the use of local storage, JWT tokens, functional preferences, and third-party authentication cookies.',
  alternates: { canonical: '/cookies' },
};

export default function CookiePolicyPage() {
  return (
    <LegalPageShell
      title="Cookie Policy"
      subtitle="How Kafei utilizes cookies, local storage JWTs, and session tokens to deliver secure restaurant operations."
    >
      <h2>1. What Are Cookies and Local Storage?</h2>
      <p>
        This Cookie Policy explains how Kafei uses cookies, web beacons, local storage objects (<code>localStorage</code> and{' '}
        <code>sessionStorage</code>), and similar browser technologies to ensure our restaurant POS, kitchen display screens,
        waiter interfaces, and guest ordering portals function reliably and securely.
      </p>

      <h2>2. Categories of Cookies &amp; Storage Technologies We Use</h2>

      <h3>2.1 Strictly Necessary Storage (Essential for Service Operation)</h3>
      <p>These tokens and cookies are strictly required to authenticate users, maintain secure active sessions, and prevent fraudulent requests:</p>
      <ul>
        <li><strong><code>kafei_access_token</code> (Local Storage):</strong> Encrypted JSON Web Token (JWT) used to authenticate API requests between the web client and NestJS backend.</li>
        <li><strong><code>kafei_auth_user</code> (Local Storage):</strong> Basic user session metadata (ID, role, assigned branch) used for client-side route guard authorization.</li>
        <li><strong>CSRF &amp; Security Tokens:</strong> Anti-tampering tokens that protect forms and API endpoints from Cross-Site Request Forgery attacks.</li>
      </ul>

      <h3>2.2 Functional &amp; Preference Cookies</h3>
      <ul>
        <li><strong><code>kafei-theme</code>:</strong> Remembers whether you prefer Dark Mode (Kafei Charcoal &amp; Red theme) or Light Mode across POS and KDS screens.</li>
        <li><strong><code>active_branch_id</code>:</strong> Remembers your currently selected restaurant branch to prevent repeated branch selection prompts.</li>
        <li><strong><code>kds_audio_alert_enabled</code>:</strong> Stores kitchen chime audio preferences for incoming order tickets.</li>
      </ul>

      <h3>2.3 Performance &amp; Telemetry</h3>
      <ul>
        <li><strong>API Latency &amp; Health Heartbeats:</strong> Anonymous telemetry measuring network round-trip times and WebSocket connection stability for live kitchen displays.</li>
        <li><strong>Error Diagnostics:</strong> Client-side crash logs and rendering error captures to assist our engineering team in resolving software defects.</li>
      </ul>

      <h3>2.4 Third-Party Integrations</h3>
      <ul>
        <li><strong>Google OAuth:</strong> When logging in via Google Sign-In, Google may set session cookies on its domains to verify your Google identity securely.</li>
        <li><strong>Payment Gateways (Razorpay / Stripe):</strong> Secure PCI-compliant iframe cookies utilized to authenticate cardholder verification.</li>
      </ul>

      <h2>3. No Third-Party Behavioral Ad Tracking</h2>
      <blockquote>
        Kafei does <strong>NOT</strong> deploy third-party behavioral advertising cookies, retargeting pixels, or ad exchange tracking scripts on our platform.
      </blockquote>

      <h2>4. Managing and Disabling Cookies</h2>
      <p>
        You can customize your cookie preferences directly in Kafei at any time or configure your web browser (Chrome, Firefox, Safari, Edge) to reject or delete cookies. However, because authentication tokens
        in <code>localStorage</code> are essential to verify your identity, disabling local storage will prevent you from logging into your Kafei
        workspace and operating the POS or KDS.
      </p>

      <div className="my-6 rounded-2xl border border-border bg-secondary/50 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 not-prose">
        <div>
          <p className="text-sm font-bold text-foreground">Interactive Cookie Controller</p>
          <p className="text-xs text-muted-foreground">Adjust telemetry and UI preferences without affecting essential authentication.</p>
        </div>
        <CookiePreferencesButton />
      </div>
    </LegalPageShell>
  );
}

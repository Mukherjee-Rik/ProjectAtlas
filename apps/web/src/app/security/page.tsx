import React from 'react';
import { LegalPageShell } from '@/components/legal/LegalPageShell';
import { Lock, Shield, Server } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Security Policy | Kafei',
  description:
    'Kafei Security Policy detailing TLS 1.3 encryption, AES-256 at rest, OAuth token isolation, multi-tenant boundaries, and vulnerability disclosure.',
  alternates: { canonical: '/security' },
};

export default function SecurityPolicyPage() {
  return (
    <LegalPageShell
      title="Security Policy"
      subtitle="Zero-trust architecture, cryptographic safeguards, and how to report a vulnerability to us."
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-secondary/40 p-4 space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-foreground text-xs">
            <Lock className="h-4 w-4 text-primary" />
            TLS 1.3 &amp; AES-256
          </div>
          <p className="text-[11px] text-muted-foreground">
            End-to-end encryption in transit and at rest across all database clusters.
          </p>
        </div>
        <div className="rounded-xl border border-border bg-secondary/40 p-4 space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-foreground text-xs">
            <Shield className="h-4 w-4 text-primary" />
            Multi-Tenant Isolation
          </div>
          <p className="text-[11px] text-muted-foreground">
            Logical database partitioning preventing cross-account data leakage.
          </p>
        </div>
        <div className="rounded-xl border border-border bg-secondary/40 p-4 space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-foreground text-xs">
            <Server className="h-4 w-4 text-primary" />
            Certified hosting
          </div>
          <p className="text-[11px] text-muted-foreground">
            Runs on cloud providers holding SOC 2 Type II and ISO 27001 certification.
          </p>
        </div>
      </div>

      <h2>1. Information Security Architecture</h2>
      <p>
        Security is built into the core of the Kafei architecture. As an enterprise restaurant operating system managing
        live point-of-sale terminals, kitchen displays, payment transactions, and confidential business metrics, we implement a{' '}
        <strong>Zero-Trust</strong> security model and defense-in-depth engineering principles.
      </p>

      <h2>2. Encryption Standards &amp; Data Protection</h2>
      <h3>2.1 Encryption in Transit</h3>
      <ul>
        <li>All communications between clients (browsers, tablets, POS terminals, mobile devices) and Kafei servers are encrypted using <strong>Transport Layer Security (TLS 1.3 / HTTPS)</strong>.</li>
        <li>HTTP Strict Transport Security (HSTS) is strictly enforced with preloading enabled.</li>
      </ul>

      <h3>2.2 Encryption at Rest</h3>
      <ul>
        <li>Sensitive user data, database volumes, and automated backups are encrypted at rest using <strong>AES-256</strong>.</li>
        <li>Database passwords and authentication secrets are hashed using strong, salted algorithms (Argon2 / bcrypt).</li>
      </ul>

      <h2>3. Google OAuth 2.0 &amp; Token Security</h2>
      <ul>
        <li><strong>Minimal Scopes:</strong> We request only essential identity scopes (<code>openid</code>, <code>email</code>, <code>profile</code>).</li>
        <li><strong>No long-lived Google tokens:</strong> We do not request offline access and we do not store Google refresh tokens. The short-lived access token returned at sign-in is used once, server-side, to read your email and profile, and is never logged or persisted.</li>
        <li><strong>Revocation:</strong> Disconnecting Google in Kafei, or revoking access from your Google account, takes effect immediately. Account deletion purges the stored identity link. See the <a href="/privacy">Privacy Policy</a>.</li>
      </ul>

      <h2>4. Infrastructure &amp; Cloud Security</h2>
      <ul>
        <li><strong>Enterprise cloud hosting:</strong> Infrastructure runs on providers that hold ISO 27001, SOC 2 Type II, and PCI-DSS Level 1 certifications for their own facilities. Kafei does not itself hold these certifications and does not claim to.</li>
        <li><strong>DDoS Mitigation &amp; WAF:</strong> Real-time protection against distributed denial-of-service (DDoS) attacks via Cloudflare edge routing.</li>
        <li><strong>Automated Backups:</strong> Point-in-time database snapshots are taken daily, encrypted, and replicated across geographically redundant storage regions.</li>
      </ul>

      <h2>5. Vulnerability Management &amp; Responsible Disclosure</h2>
      <p>
        We welcome security researchers to report potential vulnerabilities. Please email reports to{' '}
        <a href="mailto:security@kafei.in" className="text-primary underline font-bold">security@kafei.in</a>.
      </p>
      <ul>
        <li><strong>Acknowledgment:</strong> Within 24 hours.</li>
        <li><strong>Triage &amp; Assessment:</strong> Within 72 hours.</li>
        <li><strong>Resolution:</strong> Remediations prioritized by CVSS severity score.</li>
      </ul>
    </LegalPageShell>
  );
}

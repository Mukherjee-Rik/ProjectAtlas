import React from 'react';
import Link from 'next/link';
import { LegalPageShell } from '@/components/legal/LegalPageShell';
import { LEGAL_ENTITY } from '@/lib/legal-docs-data';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sub-processors | Kafei',
  description:
    'The third-party service providers Kafei uses to process customer and personal data, what each one does, and where they are located.',
  alternates: { canonical: '/subprocessors' },
};

const SUBPROCESSORS: Array<{
  name: string;
  purpose: string;
  data: string;
  region: string;
}> = [
  {
    name: 'Supabase (PostgreSQL)',
    purpose: 'Primary application database and file storage',
    data: 'Account, restaurant, order, and guest data',
    region: 'India / Singapore',
  },
  {
    name: 'Vercel',
    purpose: 'Web application hosting and CDN',
    data: 'Request metadata, IP addresses, access logs',
    region: 'Global edge',
  },
  {
    name: 'Railway',
    purpose: 'API and background worker hosting',
    data: 'Application data in transit, server logs',
    region: 'Singapore / EU',
  },
  {
    name: 'Cloudflare',
    purpose: 'DNS, TLS termination, DDoS protection',
    data: 'IP addresses, request metadata',
    region: 'Global edge',
  },
  {
    name: 'Google LLC',
    purpose: 'Google Sign-In (OAuth 2.0) identity verification',
    data: 'Email address, name, profile picture',
    region: 'Global',
  },
  {
    name: 'Google (Gemini API)',
    purpose: 'AI forecasting and copilot responses',
    data: 'Prompt content for the requested feature only',
    region: 'Global',
  },
  {
    name: 'Razorpay',
    purpose: 'Subscription and in-restaurant payment processing (India)',
    data: 'Billing contact, payment instrument, transaction records',
    region: 'India',
  },
  {
    name: 'Stripe',
    purpose: 'Subscription payment processing (international)',
    data: 'Billing contact, payment instrument, transaction records',
    region: 'US / EU',
  },
  {
    name: 'Email and SMS delivery providers',
    purpose: 'Transactional email, OTP, and order status messages',
    data: 'Email address, phone number, message content',
    region: 'India / US',
  },
];

export default function SubprocessorsPage() {
  return (
    <LegalPageShell
      title="Sub-processors"
      subtitle="The third parties that process personal data on our behalf, as required by Article 28(4) of the GDPR."
    >
      <h2>1. How to read this page</h2>
      <p>
        Under our <Link href="/dpa">Data Processing Addendum</Link>, we act as a processor
        for the data you and your guests put into Kafei. The companies below are our
        sub-processors: each one is bound by a written agreement no less protective than
        the DPA, and each only receives the data it needs for the purpose listed.
      </p>

      <h2>2. Current sub-processors</h2>
      <div className="-mx-2 overflow-x-auto sm:mx-0">
        <table className="w-full min-w-[560px] border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-border">
              {['Provider', 'Purpose', 'Data processed', 'Region'].map((h) => (
                <th
                  key={h}
                  className="px-2 pb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SUBPROCESSORS.map((s) => (
              <tr key={s.name} className="border-b border-border/60 align-top">
                <td className="px-2 py-3 font-semibold text-foreground">{s.name}</td>
                <td className="px-2 py-3 text-muted-foreground">{s.purpose}</td>
                <td className="px-2 py-3 text-muted-foreground">{s.data}</td>
                <td className="px-2 py-3 text-muted-foreground">{s.region}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>3. Data obtained through Google Sign-In</h2>
      <p>
        The email address, name and profile picture we receive when you sign in with Google
        are stored only in our own database (Supabase) and are used for authentication and
        for showing you in your workspace. They are not passed to any advertising provider,
        data broker, or AI model provider, and they are not part of any prompt sent to the
        Gemini API. See the <Link href="/privacy">Privacy Policy</Link> for the full Limited
        Use commitment.
      </p>

      <h2>4. Changes and objections</h2>
      <p>
        We will post any new or replacement sub-processor on this page at least{' '}
        <strong>30 days</strong> before it starts processing customer data. To be notified
        by email when this page changes, write to{' '}
        <a href={`mailto:${LEGAL_ENTITY.privacyEmail}`}>{LEGAL_ENTITY.privacyEmail}</a> and
        ask to be added to the sub-processor notification list.
      </p>
      <p>
        If you have a reasonable, documented objection to a new sub-processor on data
        protection grounds, tell us within those 30 days. We will work with you on a
        commercially reasonable alternative, and if none exists you may terminate the
        affected subscription with a pro-rated refund of the unused prepaid term.
      </p>

      <h2>5. International transfers</h2>
      <p>
        Where a sub-processor stores or accesses personal data outside the country it was
        collected in, the transfer is covered by the European Commission&apos;s Standard
        Contractual Clauses (and the UK Addendum where applicable), together with the
        technical measures described in our <Link href="/security">Security Policy</Link>.
      </p>
    </LegalPageShell>
  );
}

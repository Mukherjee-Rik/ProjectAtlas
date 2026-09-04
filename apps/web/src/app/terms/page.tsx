import React from 'react';
import { LegalPageShell } from '@/components/legal/LegalPageShell';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | Kafei',
  description:
    'Kafei Terms of Service governing multi-tenant restaurant management, POS, kitchen display, table QR ordering, AI copilot, and subscription billing.',
  alternates: { canonical: '/terms' },
};

export default function TermsOfServicePage() {
  return (
    <LegalPageShell
      title="Terms of Service"
      subtitle="Master Services Agreement governing the use of Kafei and the Kafei Restaurant Operating System."
    >
      <h2>1. Acceptance of Terms</h2>
      <p>
        These Terms of Service (the &quot;Terms&quot; or &quot;Agreement&quot;) constitute a legally binding agreement between
        Antigravity (&quot;Kafei&quot;, &quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) and the individual or legal entity
        (&quot;Customer&quot;, &quot;Subscriber&quot;, &quot;you&quot;, or &quot;your&quot;) accessing or using our cloud restaurant operating system,
        point-of-sale (POS) terminals, Kitchen Display Systems (KDS), waiter portals, table QR ordering, inventory modules,
        demand forecasting, and artificial intelligence copilots (collectively, the &quot;Services&quot;).
      </p>
      <p>
        By registering an account, integrating via Google OAuth or third-party sign-in, configuring a restaurant branch,
        or accessing the Services, you acknowledge that you have read, understood, and agreed to be bound by these Terms,
        our <Link href="/privacy" className="text-primary underline">Privacy Policy</Link>, and our{' '}
        <Link href="/acceptable-use" className="text-primary underline">Acceptable Use Policy</Link>.
      </p>

      <h2>2. Description of Services &amp; Platform Architecture</h2>
      <p>
        Kafei delivers a multi-tenant cloud platform engineered for modern hospitality venues, cafes, multi-outlet dining
        chains, and quick-service restaurants. Key capabilities include:
      </p>
      <ul>
        <li>Multi-Branch &amp; Floor Management with dynamic table state synchronization.</li>
        <li>Interactive Kitchen Display System (KDS) and Cashier billing terminals.</li>
        <li>Contactless Table QR dynamic ordering and real-time cooking countdowns.</li>
        <li>Recipe-level inventory deduction and ingredient variance tracking.</li>
        <li>AI-driven operational demand forecasting and business intelligence copilot.</li>
        <li>Role-based access control (RBAC) supporting Owner, Manager, Cashier, Waiter, and Kitchen staff roles.</li>
      </ul>

      <h2>3. Account Registration, Security &amp; OAuth Integrations</h2>
      <h3>3.1 Eligibility &amp; Account Creation</h3>
      <p>
        You must be at least 18 years of age and legally capable of entering into binding contracts. You agree to provide
        accurate, current, and complete registration details and maintain updated information.
      </p>

      <h3>3.2 Google OAuth Authentication</h3>
      <p>Kafei supports Google OAuth 2.0 for streamlined authentication. By authenticating through Google:</p>
      <ul>
        <li>You authorize Kafei to verify your identity and link your verified email address and basic profile info.</li>
        <li>Google user data received is strictly protected under our <Link href="/privacy" className="text-primary underline">Privacy Policy</Link> and complies with the Google API Services User Data Policy.</li>
        <li>You remain solely responsible for safeguarding your credentials and any actions taken under your account.</li>
      </ul>

      <h3>3.3 Multi-Tenant Workspace Security</h3>
      <p>
        Each subscriber account is logically isolated within our database architecture. Subscribers are strictly prohibited
        from attempting to bypass tenant boundaries or access unauthorized restaurant workspace data.
      </p>

      <h2>4. Free Trial, Subscriptions, Billing &amp; Cancellation</h2>
      <h3>4.1 14-Day Free Trial</h3>
      <p>
        Kafei offers a 14-day risk-free trial for new accounts without requiring upfront credit card details. At the conclusion
        of the trial period, continuous access requires selecting an active paid subscription plan.
      </p>

      <h3>4.2 Subscription Plans &amp; Pricing Tiers</h3>
      <ul>
        <li><strong>Starter Plan:</strong> Designed for single cafes/rooms with up to 20 tables and 5 staff members.</li>
        <li><strong>Growth Plan:</strong> Multi-branch operations with up to 100 tables, 50 staff members, analytics, and AI copilot.</li>
        <li><strong>Enterprise Plan:</strong> Unlimited tables, multi-branch cross-outlet inventory rollups, dedicated SLA, and priority engineering support.</li>
      </ul>

      <h3>4.3 Billing Cycles &amp; Payments</h3>
      <p>
        Subscription fees are billed in advance on a recurring monthly or annual basis via authorized payment gateways (e.g., Razorpay, Stripe).
        All fees are exclusive of applicable taxes (e.g., GST/VAT), which will be itemized on your invoices.
      </p>

      <h3>4.4 Cancellation &amp; Refunds</h3>
      <p>
        You may cancel your subscription at any time by contacting our billing desk, as described in the Refund &amp; Cancellation Policy. Cancellation takes effect at the end of the current
        paid billing period. Refund terms, SLA downtime remedies, and billing dispute processes are governed by our{' '}
        <Link href="/refunds" className="text-primary underline">Refund &amp; Cancellation Policy</Link>.
      </p>

      <h2>5. Intellectual Property &amp; Customer Data Ownership</h2>
      <h3>5.1 Customer Data Ownership</h3>
      <p>
        The Customer retains 100% ownership, title, and intellectual property rights in and to all proprietary data uploaded or
        processed through the Services, including restaurant menus, custom recipes, item photographs, pricing, sales records,
        staff details, and diner transactions (&quot;Customer Data&quot;).
      </p>

      <h3>5.2 Kafei Intellectual Property</h3>
      <p>
        Kafei and its licensors retain all right, title, and interest in and to the Services, including all software code, APIs,
        user interface designs, logos, trademarks, documentation, and predictive algorithms.
      </p>

      <h2>6. Artificial Intelligence &amp; Predictive Features</h2>
      <p>
        Kafei incorporates machine learning and artificial intelligence capabilities (including integrations with Google Gemini models)
        for sales forecasting, stock level optimization, and natural language copilot interactions.
      </p>
      <ul>
        <li><strong>Advisory Nature:</strong> AI predictions, menu engineering insights, and automated forecasts are advisory tools designed to assist human decision-makers. Kafei does not guarantee 100% predictive accuracy.</li>
        <li><strong>Customer Oversight:</strong> The Subscriber is solely responsible for validating critical business decisions, menu prices, and inventory procurement orders.</li>
        <li><strong>No Training on Customer Data:</strong> As outlined in our <Link href="/ai-policy" className="text-primary underline">AI Usage &amp; Responsible Use Policy</Link>, Kafei does not use your proprietary Customer Data or confidential menu recipes to train generalized foundation models.</li>
      </ul>

      <h2>7. Service Availability &amp; Support</h2>
      <p>
        Kafei targets a monthly uptime availability of <strong>99.9%</strong> for primary ordering, KDS, and POS services,
        excluding scheduled maintenance windows. For active service emergencies impacting live floor operations, subscribers have
        access to 24/7 emergency escalation.
      </p>

      <h2>8. Limitation of Liability</h2>
      <p className="font-mono text-xs uppercase text-muted-foreground">
        TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL KAFEI, ITS DIRECTORS, OFFICERS, EMPLOYEES,
        OR AFFILIATES BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES. KAFEI&apos;S AGGREGATE
        LIABILITY SHALL NOT EXCEED THE TOTAL FEES PAID BY CUSTOMER IN THE TWELVE (12) MONTHS PRECEDING THE INCIDENT.
      </p>

      <h2>9. Governing Law &amp; Dispute Resolution</h2>
      <p>
        This Agreement shall be governed by and construed in accordance with the laws of India. Any dispute arising out of or
        relating to this Agreement shall be resolved through binding arbitration in Kolkata / Bangalore, India, under the
        Arbitration and Conciliation Act, 1996.
      </p>
    </LegalPageShell>
  );
}

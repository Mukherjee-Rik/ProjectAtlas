import React from 'react';
import Link from 'next/link';
import { LegalPageShell } from '@/components/legal/LegalPageShell';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Refund & Cancellation Policy | Kafei',
  description:
    'Kafei refund and cancellation terms: 14-day free trial, self-serve cancellation, the 7-day refund window on annual plans, and service credits for outages.',
  alternates: { canonical: '/refunds' },
};

export default function RefundsPage() {
  return (
    <LegalPageShell
      title="Refund & Cancellation Policy"
      subtitle="How the free trial works, how to cancel, and when you are entitled to a refund or a service credit."
    >
      <h2>1. Free trial</h2>
      <ul>
        <li>
          <strong>No card required.</strong> New accounts get a 14-day trial of the full
          platform. We do not ask for payment details to start it.
        </li>
        <li>
          <strong>What happens at the end.</strong> If you do not choose a paid plan, the
          workspace moves to read-only. Your data stays intact and nothing is charged.
        </li>
      </ul>

      <h2>2. Cancelling a subscription</h2>
      <ul>
        <li>
          <strong>Any time, no retention queue.</strong> Email{' '}
          <a href="mailto:billing@kafei.in">billing@kafei.in</a> from the address on the
          account. We action it within 2 business days — we will not ask you to sit through
          a call first.
        </li>
        <li>
          <strong>No cancellation fee.</strong> We do not charge early termination penalties.
        </li>
        <li>
          <strong>Access until the period ends.</strong> Your workspace keeps running until
          the end of the billing period you have already paid for.
        </li>
      </ul>

      <h2>3. When you get a refund</h2>

      <h3>3.1 Annual plans — 7-day refund window</h3>
      <p>
        Annual subscriptions are refundable in full if you request it within{' '}
        <strong>7 calendar days</strong> of the initial purchase. After that window the
        annual term is non-refundable, though you can still cancel to prevent renewal.
      </p>

      <h3>3.2 Monthly plans</h3>
      <p>
        Monthly fees are billed in advance and are non-refundable once the cycle has begun.
        The exceptions are billing errors and qualifying downtime, both covered below.
      </p>

      <h3>3.3 Downtime credits</h3>
      <p>
        We target <strong>99.9% monthly uptime</strong> for ordering, KDS and POS. If
        unscheduled downtime of those core services takes us below that in a calendar
        month, you can request a pro-rated service credit for the affected period. Credits
        are applied to your next invoice, or refunded to your original payment method if
        you are cancelling.
      </p>
      <p>
        Scheduled maintenance announced in advance, and outages caused by your own network,
        hardware or payment provider, do not count toward the target.
      </p>

      <h3>3.4 Billing errors</h3>
      <p>
        Tell us within <strong>30 days</strong> of an incorrect charge. Confirmed billing
        errors are refunded in full, in the same billing cycle we confirm them.
      </p>

      <h2>4. What is not refundable</h2>
      <ul>
        <li>Partial or unused time on a monthly plan, or on an annual plan past the 7-day window.</li>
        <li>Printed QR table standees and other physical goods once they have been produced.</li>
        <li>Custom engineering, data migration, and paid onboarding once the work has been delivered.</li>
        <li>Third-party charges (payment gateway fees, SMS/WhatsApp message costs) already incurred.</li>
      </ul>

      <h2>5. How refunds are paid out</h2>
      <p>
        Approved refunds go back to the original payment method — card, UPI or net banking.
        Banks typically post them within <strong>5 to 7 business days</strong> of us issuing
        the refund; the exact timing is set by your bank, not by us.
      </p>

      <h2>6. Requesting a refund</h2>
      <p>
        Email <a href="mailto:billing@kafei.in">billing@kafei.in</a> from the address on the
        account, with the invoice number and the reason. We acknowledge within 2 business
        days and decide within 5. Nothing here limits rights you have under the consumer
        protection laws of your country — see the{' '}
        <Link href="/terms">Terms of Service</Link> for the governing law.
      </p>
    </LegalPageShell>
  );
}

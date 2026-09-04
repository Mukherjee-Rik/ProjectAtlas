import React from 'react';
import Link from 'next/link';
import { ShieldCheck, ExternalLink } from 'lucide-react';
import { LegalPageShell } from '@/components/legal/LegalPageShell';
import { LEGAL_ENTITY } from '@/lib/legal-docs-data';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | Kafei',
  description:
    'How Kafei collects, uses, shares, retains and deletes personal data — including data received through Google Sign-In, which is handled under the Google API Services User Data Policy Limited Use requirements.',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPageShell
      title="Privacy Policy"
      subtitle="What we collect, why we collect it, who we share it with, and how to get it deleted."
      badge="Google Limited Use"
    >
      {/* ── Limited Use disclosure ──────────────────────────────────────
          Google's OAuth reviewers look for this affirmation verbatim and in a
          prominent position. Do not bury it or paraphrase it away. */}
      <div className="rounded-xl border border-primary/25 bg-primary/[0.07] p-5">
        <p className="flex items-center gap-2 text-[13px] font-bold text-primary">
          <ShieldCheck className="h-4 w-4 shrink-0" />
          Google API Services — Limited Use disclosure
        </p>
        <p className="mt-2.5 text-[13px] leading-relaxed text-foreground">
          Kafei&apos;s use and transfer of information received from Google APIs to any
          other app will adhere to the{' '}
          <a
            href="https://developers.google.com/terms/api-services-user-data-policy"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-semibold text-primary underline underline-offset-[3px]"
          >
            Google API Services User Data Policy
            <ExternalLink className="h-3 w-3" />
          </a>
          , including the Limited Use requirements.
        </p>
      </div>

      <h2>1. Who we are</h2>
      <p>
        {LEGAL_ENTITY.name} (&quot;we&quot;, &quot;us&quot;) operates Kafei, a restaurant
        operations platform covering point-of-sale billing, kitchen display screens, menu
        management, table QR ordering, inventory, and AI-assisted forecasting (the
        &quot;Services&quot;). This policy covers {LEGAL_ENTITY.homepage}, the Kafei web
        application, and our APIs.
      </p>
      <p>
        <strong>Data controller:</strong> {LEGAL_ENTITY.name}, {LEGAL_ENTITY.address}.
        Contact: <a href={`mailto:${LEGAL_ENTITY.privacyEmail}`}>{LEGAL_ENTITY.privacyEmail}</a>{' '}
        or {LEGAL_ENTITY.phone}.
      </p>
      <p>
        For data that restaurants put into Kafei about their own guests and staff, the
        restaurant is the controller and we are the processor. Those terms are in our{' '}
        <Link href="/dpa">Data Processing Addendum</Link>.
      </p>

      <h2>2. Google Sign-In and Google user data</h2>

      <h3>2.1 The scopes we request</h3>
      <p>
        Signing in with Google is optional — you can use an email and password instead. If
        you do use it, we request only these non-sensitive scopes, and nothing else:
      </p>
      <ul>
        <li>
          <code>openid</code> — confirms that the sign-in came from Google and identifies
          the account.
        </li>
        <li>
          <code>.../auth/userinfo.email</code> — your Google account email address. This is
          the identifier for your Kafei account and the address we send account and billing
          notices to.
        </li>
        <li>
          <code>.../auth/userinfo.profile</code> — your name and profile picture, shown on
          your profile and next to your actions inside your restaurant workspace.
        </li>
      </ul>
      <p>
        We do not request access to Gmail, Drive, Calendar, Contacts, or any other Google
        service, and the Services do not read, write, or store content from them.
      </p>

      <h3>2.2 What we do with it</h3>
      <ul>
        <li>Create your account and sign you in.</li>
        <li>
          Apply your role and branch permissions (owner, manager, cashier, waiter, kitchen).
        </li>
        <li>
          Send transactional messages: security alerts, billing notices, and account
          recovery.
        </li>
      </ul>
      <p>
        Google Sign-In returns a short-lived access token that we use once, server-side, to
        read the email and profile fields above. We do not request offline access and we do
        not store Google refresh tokens.
      </p>

      <h3>2.3 What we never do with it</h3>
      <ul>
        <li>
          <strong>Never sold.</strong> We do not sell, rent, or license Google user data.
        </li>
        <li>
          <strong>Never used for advertising.</strong> We do not share it with advertisers,
          ad networks, or data brokers, and we do not use it for retargeting or profiling.
        </li>
        <li>
          <strong>Never used to train AI models.</strong> Google user data is not used to
          develop, train, retrain, or fine-tune generalized or foundation AI/ML models,
          ours or anyone else&apos;s. See the <Link href="/ai-policy">AI Usage Policy</Link>.
        </li>
        <li>
          <strong>Not read by humans.</strong> Google user data is processed by automated
          systems. A human at {LEGAL_ENTITY.name} reads it only with your explicit consent,
          when it is necessary for security purposes such as investigating abuse, or where
          the law requires it.
        </li>
      </ul>
      <p>
        We transfer Google user data to others only when it is necessary to provide or
        improve a feature you are using, to comply with applicable law, or as part of a
        merger or acquisition in which the receiving party is bound by this policy — the
        exceptions permitted by the Limited Use requirements, and nothing beyond them.
      </p>

      <h3>2.4 Disconnecting Google</h3>
      <ol>
        <li>
          In Kafei: <em>Settings → Privacy → Google Account Connection</em>, which links straight to your Google permissions page.
        </li>
        <li>
          At Google: revoke Kafei&apos;s access at{' '}
          <a
            href="https://myaccount.google.com/permissions"
            target="_blank"
            rel="noreferrer"
          >
            myaccount.google.com/permissions
          </a>
          .
        </li>
        <li>
          Either action stops Google sign-in immediately. Your restaurant records stay
          intact and you can keep signing in with an email and password. To remove the data
          as well, see <a href="#deletion">section 7</a>.
        </li>
      </ol>

      <h2>3. What else we collect</h2>

      <h3>3.1 Information you give us</h3>
      <ul>
        <li>
          <strong>Account:</strong> name, email, phone number, password hash, restaurant and
          branch names, business tax identifiers (GSTIN/VAT).
        </li>
        <li>
          <strong>Billing:</strong> billing address and transaction records. Card details go
          directly to our PCI-DSS compliant payment providers — raw card numbers never reach
          our servers.
        </li>
        <li>
          <strong>Operational content:</strong> menus, recipes, ingredients, pricing, floor
          and table layouts, staff profiles and roles.
        </li>
        <li>
          <strong>Support:</strong> tickets, contact form messages, and their attachments.
        </li>
      </ul>

      <h3>3.2 Guest data, collected for the restaurant</h3>
      <ul>
        <li>
          <strong>Orders:</strong> table number, items, dietary notes, timestamps, and bill
          settlement details.
        </li>
        <li>
          <strong>Optional contact:</strong> a phone number or email, only if the guest
          gives one for a receipt or an order status update.
        </li>
      </ul>

      <h3>3.3 Collected automatically</h3>
      <ul>
        <li>
          <strong>Logs:</strong> IP address, browser and OS, device identifiers, pages
          visited, and error telemetry.
        </li>
        <li>
          <strong>Local storage and cookies:</strong> session tokens, theme and branch
          preferences. Detailed in the <Link href="/cookies">Cookie Policy</Link>. We do not
          run third-party advertising or cross-site tracking pixels.
        </li>
      </ul>

      <h2>4. Why we are allowed to process it</h2>
      <p>
        If you are in the EEA, the UK, or another region with comparable law, our legal
        bases are:
      </p>
      <ul>
        <li>
          <strong>Contract:</strong> running the Services under the{' '}
          <Link href="/terms">Terms of Service</Link>.
        </li>
        <li>
          <strong>Legitimate interests:</strong> keeping the platform secure, preventing
          fraud and abuse, and supporting customers.
        </li>
        <li>
          <strong>Consent:</strong> optional marketing, non-essential cookies, and optional
          integrations. You can withdraw it at any time.
        </li>
        <li>
          <strong>Legal obligation:</strong> tax, accounting, and statutory record-keeping.
        </li>
      </ul>

      <h2>5. Who we share it with</h2>
      <ul>
        <li>
          <strong>Sub-processors:</strong> the hosting, database, payment and messaging
          providers listed on our <Link href="/subprocessors">Sub-processors</Link> page,
          each under a written data protection agreement.
        </li>
        <li>
          <strong>Payment processors:</strong> to take subscription payments and, where the
          restaurant enables it, guest payments.
        </li>
        <li>
          <strong>Legal:</strong> in response to a valid court order, subpoena, or lawful
          request, after reviewing it for validity and scope.
        </li>
        <li>
          <strong>Business transfer:</strong> in a merger or acquisition, with this policy
          continuing to apply until the successor gives notice of a change.
        </li>
      </ul>
      <p>We do not sell personal data, and we do not share it for cross-context behavioural advertising.</p>

      <h2>6. International transfers</h2>
      <p>
        We are based in India and our sub-processors operate globally, so your data may be
        processed outside your country. Where that involves personal data leaving the EEA or
        the UK, the transfer is covered by the European Commission&apos;s Standard
        Contractual Clauses together with the UK International Data Transfer Addendum, plus
        the technical measures in our <Link href="/security">Security Policy</Link>.
      </p>

      <h2 id="deletion">7. Retention and deletion</h2>
      <ul>
        <li>
          <strong>While your account is active:</strong> we keep your account and restaurant
          records so the Services work.
        </li>
        <li>
          <strong>Deleting your account:</strong> go to{" "}
          <em>Settings → Privacy → Delete Account &amp; Scrub Data</em>, or email{" "}
          <a href={`mailto:${LEGAL_ENTITY.privacyEmail}`}>{LEGAL_ENTITY.privacyEmail}</a>{' '}
          from your account address. We confirm within 5 business days.
        </li>
        <li>
          <strong>What happens then:</strong> your personal data, any data obtained through
          Google Sign-In, and your restaurant&apos;s operational records are permanently
          deleted or irreversibly anonymised within <strong>30 days</strong>. Encrypted
          backups are purged on their normal rotation, within <strong>90 days</strong>.
        </li>
        <li>
          <strong>What we must keep:</strong> invoices and transaction records that tax and
          accounting law requires us to retain, for the statutory period, and nothing more.
        </li>
        <li>
          <strong>Inactive accounts:</strong> trial workspaces with no activity for 12
          months are deleted after we give 30 days&apos; notice by email.
        </li>
      </ul>

      <h2>8. Security</h2>
      <ul>
        <li>TLS 1.3 for all traffic between your devices and our servers.</li>
        <li>AES-256 encryption at rest for databases and stored credentials.</li>
        <li>
          Tenant isolation: every query and cache key is scoped to a tenant ID so one
          restaurant cannot reach another&apos;s data.
        </li>
        <li>Role-based access control and least privilege for staff and infrastructure.</li>
      </ul>
      <p>
        No system is perfectly secure. If we discover a personal data breach affecting you,
        we will notify you and the relevant supervisory authority within the time limits the
        law sets. Report a suspected vulnerability to{' '}
        <a href={`mailto:${LEGAL_ENTITY.securityEmail}`}>{LEGAL_ENTITY.securityEmail}</a> —
        see the <Link href="/security">Security Policy</Link>.
      </p>

      <h2>9. Your rights</h2>
      <p>
        Depending on where you live — the GDPR, UK GDPR, CCPA/CPRA, and India&apos;s DPDP Act
        all apply here — you can ask us to:
      </p>
      <ul>
        <li>
          Give you a copy of your data in a portable, machine-readable format — you can do
          this yourself, right now, from <em>Settings → Privacy → Export My Data</em>.
        </li>
        <li>Correct anything inaccurate or incomplete.</li>
        <li>Delete your data (see section 7).</li>
        <li>Restrict or object to a particular kind of processing.</li>
        <li>Withdraw consent where consent is the basis we rely on.</li>
      </ul>
      <p>
        Email <a href={`mailto:${LEGAL_ENTITY.privacyEmail}`}>{LEGAL_ENTITY.privacyEmail}</a>{' '}
        and we will respond within 30 days. Exercising these rights never costs you service
        or a worse price. If you are unhappy with our response you can complain to your
        local data protection authority.
      </p>

      <h2>10. Children</h2>
      <p>
        Kafei is a business tool and is not directed at anyone under 18. We do not knowingly
        collect data from children. If we learn we have, we delete it.
      </p>

      <h2>11. Changes</h2>
      <p>
        We will update this policy as the product and the law change. Material changes are
        announced by email and by an in-app notice before they take effect, and the
        effective date at the top of this page always reflects the current version.
      </p>
    </LegalPageShell>
  );
}

import React from 'react';
import Link from 'next/link';
import { LegalPageShell } from '@/components/legal/LegalPageShell';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Data Processing Addendum | Kafei',
  description:
    'Kafei Data Processing Addendum (DPA) governing the processing of personal data under GDPR Article 28, UK GDPR, and international data transfer frameworks.',
  alternates: { canonical: '/dpa' },
};

export default function DpaPage() {
  return (
    <LegalPageShell
      title="Data Processing Addendum (DPA)"
      subtitle="GDPR Article 28 compliant data processing terms, security commitments, and standard contractual clauses."
      badge="GDPR Article 28"
    >
      <h2>1. Scope, Purpose &amp; Relationship of the Parties</h2>
      <p>
        This Data Processing Addendum (&quot;DPA&quot;) supplements the Kafei Terms of Service and applies to the processing
        of Personal Data under European Data Protection Laws (including EU GDPR 2016/679, UK GDPR, and Swiss Data Protection Acts).
      </p>
      <ul>
        <li><strong>Customer is the Data Controller:</strong> Determines the purposes and means of processing diner and restaurant employee Personal Data.</li>
        <li><strong>Kafei is the Data Processor:</strong> Processes Personal Data strictly on behalf of and under the documented instructions of the Customer.</li>
      </ul>

      <h2>2. Subject Matter &amp; Categories of Data</h2>
      <ul>
        <li><strong>Subject Matter:</strong> Provision of cloud restaurant POS, KDS, table QR ordering, inventory, and demand forecasting.</li>
        <li><strong>Categories of Data Subjects:</strong> Restaurant diners, guests, staff, cashiers, managers, and administrators.</li>
        <li><strong>Types of Personal Data:</strong> Names, emails, phone numbers, dining timestamps, table numbers, ordered items, billing references, and device IP logs.</li>
      </ul>

      <h2>3. Obligations of the Processor (Kafei)</h2>
      <h3>3.1 Documented Instructions</h3>
      <p>
        Kafei shall process Personal Data exclusively in accordance with Customer’s documented instructions, unless required to do so by applicable law.
      </p>

      <h3>3.2 Technical and Organizational Measures (TOMs)</h3>
      <ul>
        <li>TLS 1.3 / HTTPS encryption for all data in transit.</li>
        <li>AES-256 encryption for data at rest and database volumes.</li>
        <li>Multi-tenant logical isolation preventing cross-account access.</li>
        <li>Role-Based Access Control (RBAC) and least privilege principles.</li>
      </ul>

      <h2>4. Sub-processors</h2>
      <p>
        Customer grants general authorization for Kafei to engage sub-processors. The
        current list, including what each one processes and where, is published at{' '}
        <Link href="/subprocessors">kafei.in/subprocessors</Link>. Kafei imposes
        contractual data protection obligations on each sub-processor no less protective
        than those in this DPA and remains liable for their performance.
      </p>
      <p>
        Kafei will post any new or replacement sub-processor on that page at least{' '}
        <strong>30 days</strong> before it begins processing Customer Personal Data.
        Customer may object on reasonable, documented data protection grounds within that
        period, in which case the parties will work in good faith toward an alternative;
        if none is available, Customer may terminate the affected subscription with a
        pro-rated refund of the unused prepaid term.
      </p>

      <h2>5. International Transfers</h2>
      <p>
        Where processing involves transferring Personal Data out of the EEA, the UK, or
        Switzerland to a country without an adequacy decision, the transfer is governed by
        the European Commission&apos;s Standard Contractual Clauses (Decision 2021/914),
        Module Two (Controller to Processor), together with the UK International Data
        Transfer Addendum where the UK GDPR applies. Those clauses are incorporated into
        this DPA by reference and prevail over any conflicting term. The technical measures
        in Section 3.2 and in our <Link href="/security">Security Policy</Link> constitute
        the supplementary measures accompanying those transfers.
      </p>

      <h2>6. Personal Data Breach Notification</h2>
      <p>
        In the event of a confirmed Personal Data Breach impacting Customer’s data, Kafei will notify Customer without undue delay
        (and in any event within <strong>48 hours</strong> of becoming aware of the breach) and provide relevant details.
      </p>

      <h2>7. Data Subject Requests &amp; Assistance</h2>
      <p>
        Kafei will promptly forward any request it receives directly from a Data Subject
        relating to Customer&apos;s data, without responding to it itself except to confirm
        the request was received. Taking account of the nature of the processing, Kafei will
        provide reasonable assistance to Customer in fulfilling requests to access, correct,
        delete, or port Personal Data, and in carrying out data protection impact
        assessments and prior consultations under Articles 35 and 36 of the GDPR.
      </p>

      <h2>8. Audit Rights</h2>
      <p>
        On reasonable written notice and no more than once per year (or following a
        confirmed breach), Kafei will make available the information necessary to
        demonstrate compliance with Article 28 and will contribute to an audit conducted by
        Customer or an independent auditor Customer mandates, subject to confidentiality
        obligations and to Customer bearing the auditor&apos;s costs.
      </p>

      <h2>9. Data Deletion and Return</h2>
      <p>
        Upon termination of the Services, Kafei shall, at Customer&apos;s election, delete or return all Personal Data within <strong>30 days</strong>,
        unless statutory retention laws require continued storage. Encrypted backups are
        purged on their normal rotation within <strong>90 days</strong>.
      </p>
    </LegalPageShell>
  );
}

import React from 'react';
import { LegalPageShell } from '@/components/legal/LegalPageShell';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Acceptable Use Policy | Kafei',
  description:
    'Kafei Acceptable Use Policy establishing security boundaries, prohibited conduct, anti-abuse rules, and QR code physical security.',
  alternates: { canonical: '/acceptable-use' },
};

export default function AcceptableUsePolicyPage() {
  return (
    <LegalPageShell
      title="Acceptable Use Policy"
      subtitle="Security boundaries, system integrity standards, and acceptable rules of conduct for all users and integrations."
    >
      <h2>1. Overview &amp; Purpose</h2>
      <p>
        This Acceptable Use Policy (&quot;AUP&quot;) governs the acceptable use of Kafei’s restaurant operating systems,
        POS terminals, Kitchen Display Systems (KDS), waiter portals, table QR ordering pages, APIs, AI copilots, and
        related services (collectively, the &quot;Services&quot;).
      </p>

      <h2>2. Prohibited System Interference &amp; Security Violations</h2>
      <p>You may not engage in any activity that compromises the security, stability, or integrity of the Kafei platform, including:</p>
      <ul>
        <li><strong>Unauthorized Access &amp; Tenant Probing:</strong> Attempting to access, modify, or extract data belonging to other restaurant tenants, branches, or accounts.</li>
        <li><strong>Penetration Testing &amp; Scanning:</strong> Conducting vulnerability scans, penetration testing, fuzzing, or port scans against Kafei infrastructure without prior written authorization from our security team.</li>
        <li><strong>Denial of Service (DoS/DDoS):</strong> Launching or facilitating attacks that degrade or disrupt service availability.</li>
        <li><strong>Rate Limit Circumvention:</strong> Bypassing API rate limits, brute-force protections, or authentication safeguards.</li>
        <li><strong>Reverse Engineering:</strong> Decompiling, reverse engineering, disassembling, or copying source code, internal APIs, or database schemas.</li>
      </ul>

      <h2>3. Prohibited Content &amp; Business Practices</h2>
      <ul>
        <li><strong>Infringe Intellectual Property:</strong> Violate trademarks, copyrights, trade secrets, or proprietary rights of any party.</li>
        <li><strong>Deceptive or Fraudulent Information:</strong> Publish false pricing, deceptive dish descriptions, or fraudulent allergen or dietary warnings.</li>
        <li><strong>Unlawful Goods or Services:</strong> Utilize the Services to sell illegal substances, counterfeit items, or illicit products.</li>
        <li><strong>Harassment &amp; Defamation:</strong> Transmit defamatory, abusive, threatening, obscene, or discriminatory content.</li>
        <li><strong>Malicious Code:</strong> Distribute viruses, trojans, worms, ransomware, keyloggers, or other malicious software.</li>
      </ul>

      <h2>4. Dine-In QR &amp; Table Ordering Integrity</h2>
      <ul>
        <li><strong>QR Code Physical Security:</strong> Restaurants must ensure that tabletop QR standees are authentic and tamper-free. Replacing or overlaying Kafei QR standees with malicious external URLs is strictly prohibited.</li>
        <li><strong>Order Tampering:</strong> Diners and external users must not inject fraudulent, unauthorized, or automated mock orders into restaurant kitchen display queues.</li>
      </ul>

      <h2>5. Communications &amp; Anti-Spam Rules</h2>
      <ul>
        <li><strong>SMS &amp; WhatsApp Order Notifications:</strong> Automated SMS/WhatsApp notifications must be sent exclusively to diners who have explicitly opted in or initiated orders at your venue.</li>
        <li><strong>No Unsolicited Marketing:</strong> Subscribers may not use guest phone numbers collected during table ordering for mass unsolicited commercial spam without explicit prior consent.</li>
      </ul>

      <h2>6. Investigation, Enforcement &amp; Suspension</h2>
      <p>
        Kafei reserves the right to investigate any suspected breach of this AUP. Upon identifying a violation, Kafei may take immediate
        enforcement action, including formal warnings, temporary feature suspension, or permanent account termination without refund for severe breaches.
      </p>
    </LegalPageShell>
  );
}

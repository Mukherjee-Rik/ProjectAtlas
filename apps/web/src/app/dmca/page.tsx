import React from 'react';
import { LegalPageShell } from '@/components/legal/LegalPageShell';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Copyright & DMCA Policy | Kafei',
  description:
    'Kafei Copyright and DMCA Policy detailing designated copyright agent, takedown notice procedures, counter-notifications, and repeat infringer rules.',
  alternates: { canonical: '/dmca' },
};

export default function DmcaPolicyPage() {
  return (
    <LegalPageShell
      title="Copyright & DMCA Policy"
      subtitle="Procedures for copyright infringement notifications, takedowns, and counter-notices under the DMCA."
    >
      <h2>1. Compliance with Copyright Laws &amp; DMCA</h2>
      <p>
        Kafei respects the intellectual property rights of creators, restaurateurs, photographers, and developers. In accordance
        with the Digital Millennium Copyright Act (17 U.S.C. § 512) (the &quot;DMCA&quot;) and international copyright treaties, Kafei
        maintains a formal process for responding to notices of alleged copyright infringement.
      </p>

      <h2>2. Designated DMCA Copyright Agent</h2>
      <div className="rounded-xl border border-border bg-secondary/40 p-4 space-y-1 text-xs sm:text-sm">
        <p><strong>Attn:</strong> Designated DMCA Copyright Agent</p>
        <p><strong>Entity:</strong> Antigravity</p>
        <p><strong>Email:</strong> <a href="mailto:dmca@kafei.in" className="text-primary underline">dmca@kafei.in</a> / <a href="mailto:legal@kafei.in" className="text-primary underline">legal@kafei.in</a></p>
        <p><strong>Phone:</strong> +91 9903085026</p>
        <p><strong>Address:</strong> Legal Department, Antigravity, Kolkata, WB / Bangalore, KA, India</p>
      </div>

      <h2>3. Filing a DMCA Notice of Infringement</h2>
      <p>
        If you believe that copyrighted material (such as menu imagery, brand graphics, culinary photography, or written descriptions)
        hosted on the Kafei platform infringes your copyright, please provide our Copyright Agent with a written notice containing:
      </p>
      <ol>
        <li><strong>Signature:</strong> Physical or electronic signature of the copyright owner or authorized representative.</li>
        <li><strong>Identification of Work:</strong> Description of the copyrighted work claimed to have been infringed.</li>
        <li><strong>Identification of Infringing URL:</strong> Exact URL or identifier of where the material is located on Kafei.</li>
        <li><strong>Contact Info:</strong> Your full name, mailing address, telephone number, and email.</li>
        <li><strong>Good Faith Statement:</strong> A statement that you have a good faith belief that the use is unauthorized.</li>
        <li><strong>Perjury Statement:</strong> A statement made under penalty of perjury that the notice is accurate.</li>
      </ol>

      <h2>4. Counter-Notification &amp; Restitution</h2>
      <p>
        If an affected subscriber believes that material was removed erroneously, they may file a Counter-Notice. Upon receipt of a valid
        counter-notice, Kafei may restore the material within 10 to 14 business days unless legal action is initiated.
      </p>

      <h2>5. Repeat Infringer Policy</h2>
      <p>
        Kafei enforces a strict repeat infringer policy. Subscribers whose accounts are subject to repeated valid infringement notices
        will face progressive penalties, culminating in permanent account termination.
      </p>
    </LegalPageShell>
  );
}

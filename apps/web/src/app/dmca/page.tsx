import React from 'react';
import { LegalPageShell } from '@/components/legal/LegalPageShell';
import { LEGAL_ENTITY } from '@/lib/legal-docs-data';
import { ShieldCheck, Copyright } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Copyright & DMCA Policy | Kafei',
  description:
    'Kafei Copyright and DMCA Policy detailing intellectual property ownership, copyright claim from September 3, 2026 (03-09-2026), designated DMCA agent, and notice procedures.',
  alternates: { canonical: '/dmca' },
};

export default function DmcaPolicyPage() {
  return (
    <LegalPageShell
      title="Copyright & DMCA Policy"
      subtitle="Intellectual property ownership, copyright claim effective from September 3, 2026 (03-09-2026), and DMCA takedown procedures."
      lastUpdated="September 3, 2026"
    >
      {/* ═══ Copyright Claim Banner ══════════════════════════════════════ */}
      <div className="rounded-2xl border border-primary/30 bg-primary/10 p-5 sm:p-6 space-y-3">
        <div className="flex items-center gap-2.5 text-primary font-black text-sm sm:text-base">
          <Copyright className="h-5 w-5 shrink-0" />
          Official Copyright Ownership &amp; Protection Claim
        </div>
        <p className="text-xs sm:text-sm text-foreground/90 font-medium leading-relaxed">
          <strong>© 2026 {LEGAL_ENTITY.name}. All rights reserved.</strong> All software architecture, user interfaces,
          design tokens, database models, algorithms, documentation, and digital assets of Kafei and Project Atlas are
          protected under statutory copyright law.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px] text-muted-foreground font-mono">
          <div>
            <strong className="text-foreground">Effective Copyright Claim:</strong> September 3, 2026 (03-09-2026)
          </div>
          <div>
            <strong className="text-foreground">International Protection:</strong> Berne Convention &amp; UCC
          </div>
        </div>
      </div>

      <h2>1. Copyright Ownership &amp; Claim</h2>
      <p>
        All proprietary materials published on or accessible through the {LEGAL_ENTITY.product} platform—including but not limited
        to source code, user interfaces, interactive POS terminals, kitchen display screen designs, graphic icons, documentation,
        and audio-visual components—are the exclusive intellectual property of <strong>{LEGAL_ENTITY.name}</strong>, with all rights
        reserved worldwide under copyright claim established from <strong>September 3, 2026 (03-09-2026)</strong>.
      </p>

      <h2>2. Compliance with Copyright Laws &amp; DMCA</h2>
      <p>
        {LEGAL_ENTITY.product} respects the intellectual property rights of creators, restaurateurs, photographers, and developers.
        In accordance with the Digital Millennium Copyright Act (17 U.S.C. § 512) (the &quot;DMCA&quot;), the Indian Copyright Act 1957,
        and international copyright treaties, {LEGAL_ENTITY.product} maintains a formal process for responding to notices of alleged
        copyright infringement.
      </p>

      <h2>3. Designated DMCA Copyright Agent</h2>
      <div className="rounded-xl border border-border bg-secondary/40 p-4 space-y-1.5 text-xs sm:text-sm">
        <p><strong>Attn:</strong> Designated DMCA Copyright Agent</p>
        <p><strong>Entity:</strong> {LEGAL_ENTITY.name}</p>
        <p><strong>Email:</strong> <a href={`mailto:${LEGAL_ENTITY.dmcaEmail}`} className="text-primary underline font-semibold">{LEGAL_ENTITY.dmcaEmail}</a></p>
        <p><strong>Phone:</strong> {LEGAL_ENTITY.phone}</p>
        <p><strong>Address:</strong> Legal Department, {LEGAL_ENTITY.name}, {LEGAL_ENTITY.address}</p>
      </div>

      <h2>4. Filing a DMCA Notice of Infringement</h2>
      <p>
        If you believe that copyrighted material (such as menu imagery, brand graphics, culinary photography, or written descriptions)
        hosted on the {LEGAL_ENTITY.product} platform infringes your copyright, please provide our Copyright Agent with a written notice containing:
      </p>
      <ol>
        <li><strong>Signature:</strong> Physical or electronic signature of the copyright owner or authorized representative.</li>
        <li><strong>Identification of Work:</strong> Description of the copyrighted work claimed to have been infringed.</li>
        <li><strong>Identification of Infringing URL:</strong> Exact URL or identifier of where the material is located on {LEGAL_ENTITY.product}.</li>
        <li><strong>Contact Info:</strong> Your full name, mailing address, telephone number, and email.</li>
        <li><strong>Good Faith Statement:</strong> A statement that you have a good faith belief that the use is unauthorized.</li>
        <li><strong>Perjury Statement:</strong> A statement made under penalty of perjury that the notice is accurate.</li>
      </ol>

      <h2>5. Counter-Notification &amp; Restitution</h2>
      <p>
        If an affected subscriber believes that material was removed erroneously, they may file a Counter-Notice. Upon receipt of a valid
        counter-notice, {LEGAL_ENTITY.product} may restore the material within 10 to 14 business days unless legal action is initiated.
      </p>

      <h2>6. Repeat Infringer Policy</h2>
      <p>
        {LEGAL_ENTITY.product} enforces a strict repeat infringer policy. Subscribers whose accounts are subject to repeated valid infringement notices
        will face progressive penalties, culminating in permanent account termination.
      </p>
    </LegalPageShell>
  );
}

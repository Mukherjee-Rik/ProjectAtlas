import React from 'react';
import {
  Shield,
  FileText,
  Lock,
  Cpu,
  Cookie,
  RefreshCw,
  Copyright,
  Database,
  ServerCog,
  Trash2,
} from 'lucide-react';

/**
 * Single source of truth for the identity that appears on every legal page.
 *
 * Google's OAuth brand review cross-checks the entity name, support email and
 * homepage on these pages against the OAuth consent screen configuration, so
 * these values must stay in sync with the Google Cloud project — change them
 * in both places or not at all.
 */
export const LEGAL_ENTITY = {
  name: 'Antigravity',
  product: 'Kafei',
  domain: 'kafei.in',
  homepage: 'https://kafei.in',
  jurisdiction: 'India',
  address: 'Kolkata, West Bengal, India',
  effectiveDate: 'September 4, 2026',
  privacyEmail: 'privacy@kafei.in',
  legalEmail: 'legal@kafei.in',
  securityEmail: 'security@kafei.in',
  dmcaEmail: 'dmca@kafei.in',
  supportEmail: 'support@kafei.in',
  phone: '+91 99030 85026',
} as const;

export type LegalDocGroup = 'terms' | 'privacy' | 'trust';

export interface LegalNavDoc {
  title: string;
  href: string;
  shortDesc: string;
  icon: React.ElementType;
  group: LegalDocGroup;
  badge?: string;
}

export const LEGAL_DOCS: LegalNavDoc[] = [
  {
    title: 'Privacy Policy',
    href: '/privacy',
    shortDesc:
      'What we collect, how Google account data is used, retention, deletion, and your rights under GDPR, CCPA and India’s DPDP Act.',
    icon: Lock,
    group: 'privacy',
    badge: 'Google Limited Use',
  },
  {
    title: 'Terms of Service',
    href: '/terms',
    shortDesc:
      'The agreement covering your subscription, the workspace, data ownership, and liability.',
    icon: FileText,
    group: 'terms',
  },
  {
    title: 'Acceptable Use Policy',
    href: '/acceptable-use',
    shortDesc:
      'What you may and may not do with the platform, its APIs, and table QR ordering.',
    icon: Shield,
    group: 'terms',
  },
  {
    title: 'Refund & Cancellation',
    href: '/refunds',
    shortDesc:
      'Free trial terms, self-serve cancellation, refund windows and outage credits.',
    icon: RefreshCw,
    group: 'terms',
  },
  {
    title: 'Cookie Policy',
    href: '/cookies',
    shortDesc:
      'Session tokens, local storage and preference cookies. No advertising trackers.',
    icon: Cookie,
    group: 'privacy',
  },
  {
    title: 'Data Processing Addendum',
    href: '/dpa',
    shortDesc:
      'GDPR Article 28 processor terms, sub-processors and international transfer safeguards.',
    icon: Database,
    group: 'privacy',
  },
  {
    title: 'Data Deletion',
    href: '/data-deletion',
    shortDesc:
      'How to have your account, your Google sign-in data, and your restaurant records erased.',
    icon: Trash2,
    group: 'privacy',
  },
  {
    title: 'Sub-processors',
    href: '/subprocessors',
    shortDesc:
      'The third parties that process customer data on our behalf, and what each one does.',
    icon: ServerCog,
    group: 'privacy',
  },
  {
    title: 'Security Policy',
    href: '/security',
    shortDesc:
      'Encryption, tenant isolation, access control and how to report a vulnerability.',
    icon: Lock,
    group: 'trust',
  },
  {
    title: 'AI Usage Policy',
    href: '/ai-policy',
    shortDesc:
      'How AI features work, human oversight, and our guarantee that your data never trains foundation models.',
    icon: Cpu,
    group: 'trust',
    badge: 'No model training',
  },
  {
    title: 'Copyright & DMCA',
    href: '/dmca',
    shortDesc: 'Notice-and-takedown procedure and our designated copyright agent.',
    icon: Copyright,
    group: 'trust',
  },
];

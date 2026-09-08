import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Map,
  Compass,
  FileText,
  ShieldCheck,
  LifeBuoy,
  BookOpen,
  ArrowRight,
  ChevronRight,
  ExternalLink,
  Code2,
  Lock,
  UserCheck,
  Sparkles,
} from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { LEGAL_DOCS } from '@/lib/legal-docs-data';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Antoant Site Map | Directory of Pages & Public Services',
  description:
    'Comprehensive site map and navigation directory for Antoant, Project Atlas, and Kafei Restaurant Operating System.',
};

interface SiteSection {
  category: string;
  description: string;
  icon: React.ElementType;
  links: {
    title: string;
    href: string;
    description: string;
    badge?: string;
  }[];
}

const SITE_SECTIONS: SiteSection[] = [
  {
    category: 'Product & Public Portals',
    description: 'Main product presentation, registration, and onboarding flows.',
    icon: Compass,
    links: [
      {
        title: 'Home & Floor Terminal Overview',
        href: '/',
        description: 'Landing page, interactive POS terminal demo, and pricing plans.',
      },
      {
        title: 'Create Account (14-Day Free Trial)',
        href: '/signup',
        description: 'Get started with zero upfront payment and no credit card required.',
        badge: 'Free Trial',
      },
      {
        title: 'Account Sign In',
        href: '/login',
        description: 'Secure sign-in via email password or Google OAuth 2.0.',
      },
      {
        title: 'Password Recovery',
        href: '/forgot-password',
        description: 'Self-serve password reset and verification code service.',
      },
    ],
  },
  {
    category: 'Help, Support & Documentation',
    description: 'Guides, API documentation, customer support, and sales advisory.',
    icon: LifeBuoy,
    links: [
      {
        title: 'Engineering & User Documentation',
        href: '/docs',
        description: 'API design, architecture specs, database models, and operations guide.',
        badge: 'Docs',
      },
      {
        title: 'Support Desk & Live Assistance',
        href: '/support',
        description: '24/7 technical hotline, ticket escalation, and knowledgebase.',
      },
      {
        title: 'Contact & Sales Inquiries',
        href: '/contact',
        description: 'Direct communication desk for custom proposals and enterprise floor layouts.',
      },
      {
        title: 'Talk to Us / Schedule a Live Demo',
        href: '/talk-to-us',
        description: 'Book a hands-on floor walk-through with our operations specialists.',
      },
    ],
  },
  {
    category: 'Legal, Trust & Compliance Center',
    description: 'Official policies, Google OAuth disclosures, GDPR/CCPA terms, and security standards.',
    icon: ShieldCheck,
    links: [
      {
        title: 'Legal & Trust Center Hub',
        href: '/legal',
        description: 'Centralized directory for all 9 compliance documents and DPO contact desk.',
        badge: 'Hub',
      },
      ...LEGAL_DOCS.map((doc) => ({
        title: doc.title,
        href: doc.href,
        description: doc.shortDesc,
        badge: doc.badge,
      })),
    ],
  },
];

export default function SitemapPage() {
  return (
    <div className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary">
      {/* ═══ Header / Navbar ════════════════════════════════════════════ */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/logo.png"
              alt="Kafei Logo"
              width={30}
              height={30}
              className="h-7 w-auto object-contain rounded-md"
            />
            <span className="font-display text-[16px] font-extrabold tracking-tight text-foreground">
              Kafei
            </span>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 hidden sm:inline-block">
              Site Map
            </span>
          </Link>

          <nav className="flex items-center gap-3 sm:gap-4 text-xs font-semibold">
            <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
              Home
            </Link>
            <Link href="/docs" className="text-muted-foreground hover:text-foreground transition-colors hidden sm:inline-block">
              Docs
            </Link>
            <Link href="/legal" className="text-muted-foreground hover:text-foreground transition-colors">
              Legal Hub
            </Link>
            <Link
              href="/login"
              className="px-3.5 py-1.5 rounded-xl border border-border bg-card text-foreground hover:border-primary/50 transition-colors"
            >
              Sign In
            </Link>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      {/* ═══ Hero Header ═════════════════════════════════════════════════ */}
      <section className="border-b border-border bg-card/40 py-12 sm:py-16">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8 space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-bold text-primary">
            <Map className="h-4 w-4" />
            Platform Directory &amp; Navigation Index
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
            Antoant Platform Site Map
          </h1>

          <p className="mx-auto max-w-2xl text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Direct navigation links to all public sections, product information, technical documentation,
            and legal compliance policies.
          </p>

          <div className="pt-2 flex items-center justify-center gap-3 text-xs text-muted-foreground">
            <a
              href="/sitemap.xml"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline font-mono text-[11px] bg-secondary/80 px-2.5 py-1 rounded-lg border border-border"
            >
              <Code2 className="h-3.5 w-3.5" /> View XML Machine Sitemap (sitemap.xml) <ExternalLink className="h-3 w-3" />
            </a>
            <a
              href="/robots.txt"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline font-mono text-[11px] bg-secondary/80 px-2.5 py-1 rounded-lg border border-border"
            >
              <Lock className="h-3.5 w-3.5" /> robots.txt <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </section>

      {/* ═══ Content Sections ════════════════════════════════════════════ */}
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-12">
        {SITE_SECTIONS.map((section) => {
          const Icon = section.icon;
          return (
            <div key={section.category} className="space-y-5">
              <div className="flex items-center gap-3 border-b border-border pb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">
                    {section.category}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {section.description}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {section.links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="group rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5 flex flex-col justify-between"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                          {link.title}
                        </h3>
                        {link.badge && (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/25 shrink-0">
                            {link.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {link.description}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center gap-1 text-[11px] font-bold text-primary group-hover:gap-2 transition-all">
                      Visit Page <ArrowRight className="h-3 w-3" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </main>
    </div>
  );
}

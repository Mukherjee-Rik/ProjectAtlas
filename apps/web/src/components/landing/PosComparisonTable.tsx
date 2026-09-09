'use client';

import React from 'react';
import { Check, X, Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface ComparisonFeature {
  feature: string;
  kafei: string | boolean;
  legacyPos: string | boolean;
  genericTools: string | boolean;
}

const COMPARISON_DATA: ComparisonFeature[] = [
  {
    feature: 'Proprietary Hardware Requirement',
    kafei: 'Zero (Runs on any browser/tablet)',
    legacyPos: 'Expensive POS machines required',
    genericTools: 'Computer & local install required',
  },
  {
    feature: 'Table QR Ordering (Guest Appless)',
    kafei: true,
    legacyPos: false,
    genericTools: false,
  },
  {
    feature: 'Live Kitchen Display System (KDS)',
    kafei: true,
    legacyPos: 'Extra cost per screen',
    genericTools: false,
  },
  {
    feature: 'Commission on Sales & Orders',
    kafei: '0% Flat (No hidden cut)',
    legacyPos: 'Transaction fees & setup cuts',
    genericTools: 'Variable payment gateway fee',
  },
  {
    feature: '80mm & 58mm Thermal Browser Printing',
    kafei: true,
    legacyPos: 'Requires specialized drivers',
    genericTools: 'PDF downloads only',
  },
  {
    feature: 'Waiter Smartphone / Tablet Terminal',
    kafei: true,
    legacyPos: 'Requires dedicated handhelds',
    genericTools: false,
  },
  {
    feature: 'Real-time Multi-Branch Cloud Sync',
    kafei: true,
    legacyPos: 'Offline sync delays',
    genericTools: 'Manual export/import',
  },
  {
    feature: 'Live Cooking Timers & Customer Alerts',
    kafei: true,
    legacyPos: false,
    genericTools: false,
  },
  {
    feature: 'Instant 14-Day Free Setup (No Sales Call)',
    kafei: true,
    legacyPos: 'Requires scheduled sales demos',
    genericTools: false,
  },
];

export function PosComparisonTable() {
  return (
    <section className="border-t border-border px-6 py-24 sm:py-32 lg:px-8 bg-card/20">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary flex items-center justify-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            Comparison Matrix
          </p>
          <h2 className="mt-4 font-display text-[2rem] font-bold leading-[1.05] tracking-[-0.03em] text-foreground sm:text-[2.75rem]">
            Why Modern Restaurants Choose Kafei over Legacy POS
          </h2>
          <p className="mt-5 text-[15px] leading-relaxed text-muted-foreground">
            Compare Kafei’s cloud-native architecture against legacy hardware systems and generic billing software.
          </p>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto rounded-xl border border-border bg-background shadow-lg">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-secondary/40">
                <th className="p-5 font-display text-sm font-semibold text-foreground w-2/5">
                  Capability / Feature
                </th>
                <th className="p-5 font-display text-sm font-bold text-primary bg-primary/5 border-x border-primary/20 w-1/5 text-center">
                  Kafei 2.0
                  <span className="block text-[11px] font-normal text-muted-foreground mt-0.5">
                    Cloud & QR Native
                  </span>
                </th>
                <th className="p-5 font-display text-sm font-semibold text-muted-foreground w-1/5 text-center">
                  Legacy POS Hardware
                  <span className="block text-[11px] font-normal text-muted-foreground/70 mt-0.5">
                    Petpooja / Posist / Offline
                  </span>
                </th>
                <th className="p-5 font-display text-sm font-semibold text-muted-foreground w-1/5 text-center">
                  Generic Billing Tools
                  <span className="block text-[11px] font-normal text-muted-foreground/70 mt-0.5">
                    Desktop Excel / PDF Apps
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-[13px] sm:text-[14px]">
              {COMPARISON_DATA.map((row) => (
                <tr key={row.feature} className="hover:bg-secondary/30 transition-colors">
                  <td className="p-4 sm:p-5 font-medium text-foreground">
                    {row.feature}
                  </td>
                  <td className="p-4 sm:p-5 text-center bg-primary/5 border-x border-primary/20 font-semibold text-primary">
                    {typeof row.kafei === 'boolean' ? (
                      row.kafei ? (
                        <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-primary/20 text-primary">
                          <Check className="h-4 w-4" />
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-red-500/20 text-red-400">
                          <X className="h-4 w-4" />
                        </span>
                      )
                    ) : (
                      <span>{row.kafei}</span>
                    )}
                  </td>
                  <td className="p-4 sm:p-5 text-center text-muted-foreground">
                    {typeof row.legacyPos === 'boolean' ? (
                      row.legacyPos ? (
                        <Check className="h-4 w-4 mx-auto text-muted-foreground" />
                      ) : (
                        <X className="h-4 w-4 mx-auto text-muted-foreground/50" />
                      )
                    ) : (
                      <span>{row.legacyPos}</span>
                    )}
                  </td>
                  <td className="p-4 sm:p-5 text-center text-muted-foreground">
                    {typeof row.genericTools === 'boolean' ? (
                      row.genericTools ? (
                        <Check className="h-4 w-4 mx-auto text-muted-foreground" />
                      ) : (
                        <X className="h-4 w-4 mx-auto text-muted-foreground/50" />
                      )
                    ) : (
                      <span>{row.genericTools}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* CTA Footer */}
        <div className="mt-12 text-center">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-7 py-3.5 text-[14px] font-semibold text-background transition-colors hover:bg-primary-hover shadow-md"
          >
            Start Your Free 14-Day Trial Today
            <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="mt-3 text-[12px] text-muted-foreground">
            No credit card required • Instant room setup in 5 minutes
          </p>
        </div>
      </div>
    </section>
  );
}

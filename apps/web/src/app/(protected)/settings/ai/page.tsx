'use client';

import { useEffect, useId, useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  BrainCircuit,
  TrendingUp,
  UtensilsCrossed,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  type LucideIcon,
} from 'lucide-react';

import { PageHeader } from '@/components/ui/primitives';

/**
 * The switch is drawn by the track div; the real checkbox is `sr-only`, so the
 * global :focus-visible outline lands on a clipped element and cannot be seen.
 * The track has to carry the ring itself, and the input has to carry the name —
 * the feature title lives outside the label.
 */
function GovernanceToggle({
  icon: Icon,
  title,
  tag,
  description,
  checked,
  onChange,
}: {
  icon: LucideIcon;
  title: string;
  tag: string;
  description: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  const titleId = useId();

  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-border bg-secondary/40 p-4">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 id={titleId} className="text-sm font-bold text-foreground">
              {title}
            </h3>
            <span className="rounded-full border border-primary/30 bg-primary/15 px-2 py-0.5 text-[9px] font-bold text-primary">
              {tag}
            </span>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
        </div>
      </div>

      <label className="relative mt-1 inline-flex shrink-0 cursor-pointer items-center">
        <input
          type="checkbox"
          checked={checked}
          aria-labelledby={titleId}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <div className="peer h-5 w-9 rounded-full bg-secondary after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-border after:bg-card after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-transparent peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary" />
      </label>
    </div>
  );
}

export default function AISettingsPage() {
  const [copilot, setCopilot] = useState(true);
  const [forecast, setForecast] = useState(true);
  const [upsell, setUpsell] = useState(true);
  const [savedMessage, setSavedMessage] = useState('');

  // Reading localStorage on the first client tick reconciles the stored values
  // onto the defaults already in state; the page itself never waits for it.
  useEffect(() => {
    try {
      const storedCopilot = localStorage.getItem('kafei_ai_copilot_enabled');
      const storedForecast = localStorage.getItem('kafei_ai_forecast_enabled');
      const storedUpsell = localStorage.getItem('kafei_ai_upsell_enabled');

      if (storedCopilot !== null) setCopilot(storedCopilot === 'true');
      if (storedForecast !== null) setForecast(storedForecast === 'true');
      if (storedUpsell !== null) setUpsell(storedUpsell === 'true');
    } catch (e) {
      console.warn(e);
    }
  }, []);

  const handleSave = (nextCopilot: boolean, nextForecast: boolean, nextUpsell: boolean) => {
    setCopilot(nextCopilot);
    setForecast(nextForecast);
    setUpsell(nextUpsell);
    try {
      localStorage.setItem('kafei_ai_copilot_enabled', String(nextCopilot));
      localStorage.setItem('kafei_ai_forecast_enabled', String(nextForecast));
      localStorage.setItem('kafei_ai_upsell_enabled', String(nextUpsell));
      window.dispatchEvent(new CustomEvent('kafei:ai-settings-updated'));
      setSavedMessage('AI governance preferences updated successfully.');
      setTimeout(() => setSavedMessage(''), 3000);
    } catch (e) {
      console.warn(e);
    }
  };

  const handleDisableAll = () => {
    handleSave(false, false, false);
  };

  const handleEnableAll = () => {
    handleSave(true, true, true);
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="AI & Automation Governance"
        description="Configure assistive AI models, opt-out of predictive analytics, and review data protections."
        actions={
          <Link
            href="/ai-policy"
            target="_blank"
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            <span>AI Policy</span>
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </Link>
        }
      />

      {savedMessage && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-xl border border-atlas-success/30 bg-atlas-success/10 p-4 text-xs font-semibold text-atlas-success"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{savedMessage}</span>
        </div>
      )}

      {/* ── Section 1: AI Features Toggle Controls ──────────────────── */}
      <div className="space-y-6 overflow-hidden rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-col justify-between gap-4 border-b border-border/60 pb-5 sm:flex-row sm:items-center">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-foreground">
              Feature-Level Opt-In / Opt-Out Controls
            </h2>
            <p className="text-xs text-muted-foreground">
              Enable or disable specific machine learning assistants for your restaurant floor.
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            <button
              type="button"
              onClick={handleDisableAll}
              className="cursor-pointer rounded-xl border border-border bg-secondary px-3.5 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              Disable All AI
            </button>
            <button
              type="button"
              onClick={handleEnableAll}
              className="cursor-pointer rounded-xl bg-primary px-3.5 py-1.5 text-xs font-bold text-background shadow transition-all hover:bg-primary-hover"
            >
              Enable All
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <GovernanceToggle
            icon={BrainCircuit}
            title="AI Natural Language Copilot"
            tag="Assistive"
            description="Allows floor managers to ask conversational queries about sales margin, peak table occupancy, and shift metrics."
            checked={copilot}
            onChange={(next) => handleSave(next, forecast, upsell)}
          />

          <GovernanceToggle
            icon={TrendingUp}
            title="Predictive Demand & Prep Forecasting"
            tag="Advisory"
            description="Estimates ingredient batch sizes and kitchen preparation quantities based on historical dining room rush patterns."
            checked={forecast}
            onChange={(next) => handleSave(copilot, next, upsell)}
          />

          <GovernanceToggle
            icon={UtensilsCrossed}
            title="Smart Menu Pairing & Combo Suggestions"
            tag="Recommendation"
            description="Identifies item cross-order tendencies to suggest high-conversion combos during waiter table ordering."
            checked={upsell}
            onChange={(next) => handleSave(copilot, forecast, next)}
          />
        </div>
      </div>

      {/* ── Section 2: Privacy Commitments Banner ───────────────────── */}
      <div className="space-y-4 rounded-2xl border border-border/80 bg-secondary/30 p-6 text-xs leading-relaxed text-muted-foreground">
        <div className="flex items-center gap-2 text-sm font-bold text-foreground">
          <ShieldCheck className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
          <span>Responsible AI & Zero Model Training Guarantees</span>
        </div>
        <ul className="list-inside list-disc space-y-1.5 pl-1">
          <li>
            <strong>Zero Training on Private Records:</strong> Your sales revenues, customer order histories, and recipe databases are strictly excluded from AI model training datasets.
          </li>
          <li>
            <strong>Human Confirmation Required:</strong> AI recommendations are purely assistive. No price modifications or invoice voids occur without human authorization.
          </li>
          <li>
            <strong>Enterprise Commercial Terms:</strong> External inference queries use enterprise-tier APIs with zero data retention for generalized model training.
          </li>
        </ul>
        <div className="border-t border-border/60 pt-2">
          <Link
            href="/ai-policy"
            className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
          >
            Read Full AI Usage & Responsible Use Policy
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
}

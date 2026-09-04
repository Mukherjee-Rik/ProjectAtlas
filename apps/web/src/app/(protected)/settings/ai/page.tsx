'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ShieldCheck,
  BrainCircuit,
  TrendingUp,
  UtensilsCrossed,
  ArrowLeft,
  ExternalLink,
  CheckCircle2,
  Lock,
} from 'lucide-react';

export default function AISettingsPage() {
  const [mounted, setMounted] = useState(false);
  const [copilot, setCopilot] = useState(true);
  const [forecast, setForecast] = useState(true);
  const [upsell, setUpsell] = useState(true);
  const [savedMessage, setSavedMessage] = useState('');

  useEffect(() => {
    setMounted(true);
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

  if (!mounted) return null;

  return (
    <div className="space-y-8 max-w-4xl">
      {/* ── Page Header ────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/settings"
              className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Settings
            </Link>
          </div>
          <h1 className="font-display text-3xl font-semibold tracking-[-0.02em] text-foreground mt-1">
            AI & Automation Governance
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure assistive AI models, opt-out of predictive analytics, and review data protections.
          </p>
        </div>

        <Link
          href="/ai-policy"
          target="_blank"
          className="text-xs font-semibold text-primary hover:underline hidden sm:inline-flex items-center gap-1"
        >
          <span>AI Policy</span>
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      {savedMessage && (
        <div className="flex items-center gap-2 rounded-xl border border-atlas-success/30 bg-atlas-success/10 p-4 text-xs font-semibold text-atlas-success animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{savedMessage}</span>
        </div>
      )}

      {/* ── Section 1: AI Features Toggle Controls ──────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm space-y-6 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
          <div>
            <h2 className="text-base font-bold text-foreground">
              Feature-Level Opt-In / Opt-Out Controls
            </h2>
            <p className="text-xs text-muted-foreground">
              Enable or disable specific machine learning assistants for your restaurant floor.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleDisableAll}
              className="rounded-xl border border-border bg-secondary px-3.5 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              Disable All AI
            </button>
            <button
              type="button"
              onClick={handleEnableAll}
              className="rounded-xl bg-primary px-3.5 py-1.5 text-xs font-bold text-background shadow transition-all hover:bg-primary-hover cursor-pointer"
            >
              Enable All
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {/* Toggle 1: Copilot */}
          <div className="flex items-start justify-between gap-4 rounded-xl border border-border bg-secondary/40 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <BrainCircuit className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-foreground">AI Natural Language Copilot</h3>
                  <span className="rounded-full bg-primary/15 border border-primary/30 px-2 py-0.5 text-[9px] font-bold text-primary">
                    Assistive
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  Allows floor managers to ask conversational queries about sales margin, peak table occupancy, and shift metrics.
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
              <input
                type="checkbox"
                checked={copilot}
                onChange={(e) => handleSave(e.target.checked, forecast, upsell)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          {/* Toggle 2: Demand Forecasting */}
          <div className="flex items-start justify-between gap-4 rounded-xl border border-border bg-secondary/40 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-foreground">Predictive Demand & Prep Forecasting</h3>
                  <span className="rounded-full bg-primary/15 border border-primary/30 px-2 py-0.5 text-[9px] font-bold text-primary">
                    Advisory
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  Estimates ingredient batch sizes and kitchen preparation quantities based on historical dining room rush patterns.
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
              <input
                type="checkbox"
                checked={forecast}
                onChange={(e) => handleSave(copilot, e.target.checked, upsell)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          {/* Toggle 3: Smart Menu Recommendations */}
          <div className="flex items-start justify-between gap-4 rounded-xl border border-border bg-secondary/40 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <UtensilsCrossed className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-foreground">Smart Menu Pairing & Combo Suggestions</h3>
                  <span className="rounded-full bg-primary/15 border border-primary/30 px-2 py-0.5 text-[9px] font-bold text-primary">
                    Recommendation
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  Identifies item cross-order tendencies to suggest high-conversion combos during waiter table ordering.
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
              <input
                type="checkbox"
                checked={upsell}
                onChange={(e) => handleSave(copilot, forecast, e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>
      </div>

      {/* ── Section 2: Privacy Commitments Banner ───────────────────── */}
      <div className="rounded-2xl border border-border/80 bg-secondary/30 p-6 space-y-4 text-xs text-muted-foreground leading-relaxed">
        <div className="flex items-center gap-2 text-foreground font-bold text-sm">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <span>Responsible AI & Zero Model Training Guarantees</span>
        </div>
        <ul className="list-disc list-inside space-y-1.5 pl-1">
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
        <div className="pt-2 border-t border-border/60">
          <Link href="/ai-policy" className="text-primary font-semibold hover:underline">
            Read Full AI Usage & Responsible Use Policy →
          </Link>
        </div>
      </div>
    </div>
  );
}

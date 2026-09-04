import React from 'react';
import { LegalPageShell } from '@/components/legal/LegalPageShell';
import { Sparkles } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Usage Policy | Kafei',
  description:
    'Kafei AI Usage & Responsible Use Policy detailing ethical AI principles, Google Gemini integrations, and zero-training guarantees on customer data.',
  alternates: { canonical: '/ai-policy' },
};

export default function AiPolicyPage() {
  return (
    <LegalPageShell
      title="AI Usage & Responsible Use Policy"
      subtitle="Ethical standards, customer data isolation, and responsible AI guardrails governing our restaurant intelligence platform."
      badge="No model training"
    >
      <div className="rounded-2xl border border-primary/30 bg-primary/10 p-5 space-y-2">
        <div className="flex items-center gap-2 text-primary font-bold text-sm">
          <Sparkles className="h-4 w-4" />
          Strict Zero-Training Guarantee on Customer Proprietary Data
        </div>
        <p className="text-xs sm:text-sm text-foreground/90 font-medium">
          Kafei <strong>NEVER</strong> uses your confidential recipes, proprietary dish ingredients, business financials,
          customer records, or Google OAuth account data to train, retrain, fine-tune, or improve publicly accessible or
          foundational AI models.
        </p>
      </div>

      <h2>1. Purpose and Scope</h2>
      <p>
        Kafei integrates cutting-edge Artificial Intelligence (AI) and Machine Learning (ML) technologies—including
        integrations with Google Gemini models, time-series forecasting algorithms, and natural language copilot assistants—to
        optimize restaurant kitchen workflows, predict inventory exhaustion, streamline menu engineering, and enhance
        operational decision-making.
      </p>

      <h2>2. Core Ethical Principles</h2>
      <h3>2.1 Transparency &amp; Explainability</h3>
      <p>
        We believe hospitality operators must understand how AI recommendations are formed. Kafei provides contextual
        rationale for inventory restock alerts, demand surge forecasts, and menu modifier recommendations.
      </p>

      <h3>2.2 Human-in-the-Loop Oversight</h3>
      <p>
        AI in Kafei is strictly designed as an <strong>intelligence amplifier</strong>, not an autonomous replacement for
        human judgment. Critical operational decisions—including automated purchasing orders, price overrides, staff shifts,
        and refund authorizations—require explicit human confirmation.
      </p>

      <h3>2.3 Fairness &amp; Non-Discrimination</h3>
      <p>
        Our algorithmic models are engineered to prevent discriminatory outputs based on protected attributes, ensuring
        equitable service recommendations and fair pricing models.
      </p>

      <h2>3. Enterprise API Privacy &amp; Data Segregation</h2>
      <ul>
        <li>
          <strong>Enterprise Zero-Data-Retention:</strong> When Kafei connects with foundation model providers (such as Google Gemini APIs),
          all API interactions occur over secure, enterprise-grade endpoints subject to strict zero-data-retention terms where prompts and
          completions are not logged or used for model training by the provider.
        </li>
        <li>
          <strong>Tenant Isolation in AI Memory:</strong> Contextual memory and embeddings used by the Kafei AI Copilot are logically
          segregated per tenant ID. No restaurant’s data is ever exposed to or accessible by another subscriber.
        </li>
      </ul>

      <h2>4. Specific AI Capabilities &amp; Guidelines</h2>
      <h3>4.1 Demand &amp; Sales Forecasting</h3>
      <p>
        Evaluates historical POS velocity, seasonal trends, day-of-week patterns, and table turn rates to project daily
        ingredient demand. Chefs and kitchen managers should adjust predictions based on local weather, private events, or sudden
        market shifts.
      </p>

      <h3>4.2 Recipe &amp; Menu Engineering Copilot</h3>
      <p>
        Analyzes margin percentages, ingredient wastage, and dish popularity (Stars, Plowhorses, Puzzles, Dogs) to recommend
        menu optimizations. Recommendations are advisory; subscribers retain complete discretion over dish formulations and retail pricing.
      </p>

      <h3>4.3 Kitchen Load Balancer &amp; Prep Time Predictions</h3>
      <p>
        Computes dynamic prep times based on active KDS ticket volume and station workload. Dynamic cooking countdowns visible to
        diners on table QR screens reflect real-time kitchen state to set accurate guest expectations.
      </p>

      <h2>5. Prohibited AI Uses</h2>
      <p>Subscribers, operators, and staff are strictly prohibited from using Kafei AI tools to:</p>
      <ul>
        <li>Generate misleading, fraudulent, or deceptive food descriptions or allergen disclosures.</li>
        <li>Implement predatory surge pricing models that violate local consumer protection statutes.</li>
        <li>Automate adverse employment termination decisions without human review.</li>
        <li>Attempt prompt injection attacks, jailbreaks, or extraction of internal system prompts or other tenant data.</li>
      </ul>
    </LegalPageShell>
  );
}

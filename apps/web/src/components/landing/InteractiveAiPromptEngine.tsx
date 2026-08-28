'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { BorderBeam } from './BorderBeam';

interface WorkflowResult {
  step1: string;
  step2: string;
  step3: string;
  step4: string;
  outputSummary: string;
  badge: string;
  metric: string;
}

const samplePrompts = [
  'Table 4 orders 2x Truffle Alfredo Pasta and 1x Peach Sparkler Iced Tea',
  'Split Table 2 bill of ₹2,400 into 3 equal UPI QR codes and print receipt',
  'Predict Saturday dinner rush inventory demand for Rooftop & Patio branches',
  'Review and approve waiter order cancellation of ₹840 with manager PIN',
  'Transfer Table 3 guests to VIP Lounge Table 8 without resetting tokens',
];

const presetResults: Record<number, WorkflowResult> = {
  0: {
    badge: 'QR Dine-In ➔ KDS Dispatch',
    step1: 'Token #AT-0048 generated for Table 04 (AC Hall)',
    step2: 'Modifiers parsed: [Extra Truffle, Less Ice, High Priority]',
    step3: 'KDS station audio chime triggered in 8ms (Chef Station 1)',
    step4: 'Inventory automated stock reserve: -400g Fettuccine, -180ml Cream',
    outputSummary: '✅ Order #AT-0048 active. Table status changed to Cooking (06:00 min timer).',
    metric: '< 15ms Total Latency',
  },
  1: {
    badge: 'Cashier POS ➔ Multi-UPI Split',
    step1: 'Calculated split: ₹800.00 × 3 diners from ₹2,400.00 total',
    step2: 'Generated 3 unique UPI dynamic QR payloads with GST breakdown',
    step3: 'Sent print job to 80mm thermal receipt printer via ESC/POS protocol',
    step4: 'Ledger recorded 3 pending split reconciliation tokens',
    outputSummary: '✅ 3 UPI QRs ready for seat scan. Thermal print receipt generated.',
    metric: '100% Audit Reconciliation',
  },
  2: {
    badge: 'AI Demand Forecast ➔ Supply Chain',
    step1: 'Analyzed previous 6 weeks of Saturday evening rush-hour velocity',
    step2: 'Machine Learning predicted +140% surge in Cold Brew & Pasta between 6-9 PM',
    step3: 'Calculated minimum safety stock threshold: 14.5 kg Coffee Beans, 18 kg Cheese',
    step4: 'Triggered automated procurement replenishment warning to General Manager',
    outputSummary: '✅ Weekend predictive stock plan synthesized. Supplier notification sent.',
    metric: '-24% Stockout Prevention',
  },
  3: {
    badge: 'Two-Tier Fraud Guard ➔ Ledger',
    step1: 'Verified waiter cancellation request with timestamp & reason notes',
    step2: 'Validated Manager PIN credential and authorization token',
    step3: 'KDS docket automatically revoked & chef notified to stop preparation',
    step4: 'Appended immutable cancellation entry to financial audit ledger',
    outputSummary: '✅ Cancellation approved. Financial ledger reconciled with manager signature.',
    metric: 'Zero Fraud Vulnerability',
  },
  4: {
    badge: 'Floor Management ➔ Live Re-route',
    step1: 'Locked source Table 03 and destination VIP Lounge Table 08',
    step2: 'Migrated active Token #AT-0039 and live bill balance (₹3,450.00)',
    step3: 'Notified waiter handheld terminal of guest relocation',
    step4: 'Reset Table 03 status to Available (Green) with ghost-session guard',
    outputSummary: '✅ Table transfer executed instantly without resetting active diner tabs.',
    metric: 'Zero Downtime',
  },
};

export function InteractiveAiPromptEngine() {
  const [promptIndex, setPromptIndex] = useState(0);
  const [inputValue, setInputValue] = useState(samplePrompts[0]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<WorkflowResult | null>(presetResults[0]);
  const [activeStep, setActiveStep] = useState(4);

  // Typewriter prompt selection
  const handleSelectPreset = (index: number) => {
    setPromptIndex(index);
    setInputValue(samplePrompts[index]);
    setExecutionResult(null);
  };

  const handleExecute = () => {
    if (isExecuting) return;
    setIsExecuting(true);
    setExecutionResult(null);
    setActiveStep(0);

    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#34D399', '#38BDF8', '#A855F7'],
      });
    } catch {
      // ignore
    }

    const res = presetResults[promptIndex] || presetResults[0];

    setTimeout(() => setActiveStep(1), 400);
    setTimeout(() => setActiveStep(2), 900);
    setTimeout(() => setActiveStep(3), 1400);
    setTimeout(() => {
      setActiveStep(4);
      setExecutionResult(res);
      setIsExecuting(false);
    }, 1900);
  };

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-[#0B0F15]/80 border-t border-border/60">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[30vw] rounded-full bg-gradient-to-r from-primary/10 via-[#38BDF8]/10 to-[#A855F7]/10 blur-[150px] pointer-events-none -z-10" />

      <div className="mx-auto max-w-5xl space-y-10">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1 text-xs font-black uppercase text-primary">
            <span>✨ Generative Restaurant AI Engine</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight">
            Describe Any Restaurant Action <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-[#38BDF8] to-[#A855F7]">
              Watch Atlas Orchestrate It In Seconds
            </span>
          </h2>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            Test natural language command orchestration. Pick a real-world scenario below or trigger the live system workflow engine.
          </p>
        </div>

        {/* Interactive Prompt Command Input Bar */}
        <div className="relative rounded-3xl border border-border bg-card/95 p-3 sm:p-4 shadow-2xl backdrop-blur-2xl">
          <BorderBeam size={220} duration={10} colorFrom="#34D399" colorTo="#A855F7" />

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg text-primary">
                ⚡
              </span>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="e.g. Table 4 orders 2x Truffle Pasta with extra cheese..."
                className="w-full rounded-2xl border border-border bg-[#070A0E] pl-12 pr-4 py-3.5 text-xs sm:text-sm font-medium text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none transition-all font-mono"
              />
            </div>

            <button
              type="button"
              onClick={handleExecute}
              disabled={isExecuting}
              className="w-full sm:w-auto shrink-0 rounded-2xl bg-gradient-to-r from-primary via-primary-hover to-primary px-6 py-3.5 text-xs sm:text-sm font-black uppercase tracking-wider text-[#070A0E] shadow-[0_0_25px_rgba(42,254,183,0.35)] hover:shadow-[0_0_35px_rgba(42,254,183,0.6)] hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {isExecuting ? 'Synthesizing...' : '⚡ Execute Flow'}
            </button>
          </div>

          {/* Quick Preset Buttons */}
          <div className="pt-3 flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-muted-foreground font-semibold pl-1">Preset Scenarios:</span>
            {samplePrompts.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectPreset(idx)}
                className={`rounded-xl px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer truncate max-w-[200px] sm:max-w-xs ${
                  promptIndex === idx
                    ? 'bg-primary/20 border border-primary/50 text-primary'
                    : 'border border-border bg-secondary text-muted-foreground hover:text-foreground'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Live Step-By-Step Workflow Visualizer */}
        <div className="rounded-3xl border border-border bg-card/90 p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-primary animate-ping" />
              <span className="text-xs font-mono font-bold text-foreground">
                LIVE ORCHESTRATION PIPELINE
              </span>
            </div>
            {executionResult && (
              <span className="rounded-full bg-primary/15 border border-primary/30 px-3 py-1 text-[10px] font-black uppercase text-primary">
                {executionResult.badge}
              </span>
            )}
          </div>

          {/* 4 Pipeline Stages */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: '1. Natural Language Intent', desc: presetResults[promptIndex].step1, icon: '🧠' },
              { title: '2. WebSocket Routing', desc: presetResults[promptIndex].step2, icon: '⚡' },
              { title: '3. Terminal Synchronization', desc: presetResults[promptIndex].step3, icon: '👨‍🍳' },
              { title: '4. Ledger & Recipe Depletion', desc: presetResults[promptIndex].step4, icon: '📊' },
            ].map((stage, idx) => {
              const isPassed = activeStep > idx;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0.4 }}
                  animate={{
                    opacity: isPassed ? 1 : 0.4,
                    scale: isPassed ? 1 : 0.98,
                  }}
                  className={`rounded-2xl border p-4 space-y-2 transition-all duration-300 ${
                    isPassed
                      ? 'border-primary/50 bg-gradient-to-b from-secondary to-card shadow-[0_0_20px_rgba(42,254,183,0.15)]'
                      : 'border-border bg-background'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-lg">{stage.icon}</span>
                    <span
                      className={`text-[10px] font-black uppercase font-mono ${
                        isPassed ? 'text-primary' : 'text-muted-foreground'
                      }`}
                    >
                      {isPassed ? '✓ EXECUTED' : 'PENDING'}
                    </span>
                  </div>
                  <p className="text-xs font-black text-foreground">{stage.title}</p>
                  <p className="text-[11px] text-muted-foreground leading-snug">{stage.desc}</p>
                </motion.div>
              );
            })}
          </div>

          {/* Final Output Summary Terminal */}
          {executionResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-primary/30 bg-[#070A0E] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-mono text-xs"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">🚀</span>
                <span className="text-foreground font-medium">{executionResult.outputSummary}</span>
              </div>
              <span className="shrink-0 font-bold text-primary bg-primary/10 px-3 py-1 rounded-xl border border-primary/30">
                {executionResult.metric}
              </span>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}

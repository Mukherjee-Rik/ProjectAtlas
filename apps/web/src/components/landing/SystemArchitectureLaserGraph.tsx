'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BorderBeam } from './BorderBeam';

interface NodeInfo {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  borderColor: string;
  metrics: string;
  description: string;
  packetData: {
    event: string;
    payload: string;
    speed: string;
    security: string;
  };
}

const architectureNodes: Record<string, NodeInfo> = {
  diner: {
    id: 'diner',
    title: 'Diner QR Phone',
    subtitle: 'Table 04 • Standee Scan',
    icon: '📱',
    color: 'from-teal-500/20 to-emerald-500/10',
    borderColor: 'border-primary/40',
    metrics: '0 App Downloads • Instant Browser',
    description: 'Customer scans dynamic table QR code, selects items with modifiers, and submits multi-round tokens.',
    packetData: {
      event: 'ORDER_SUBMITTED',
      payload: '{ token: "#AT-0042", items: 3, total: "₹1,450", table: 4 }',
      speed: '< 12ms WebSocket',
      security: 'End-to-End Encrypted',
    },
  },
  cloud: {
    id: 'cloud',
    title: 'Atlas Real-Time Core',
    subtitle: 'Multi-Tenant Cloud Mesh',
    icon: '⚡',
    color: 'from-cyan-500/20 to-blue-500/10',
    borderColor: 'border-[#38BDF8]/40',
    metrics: 'Sub-100ms Global Sync',
    description: 'Central event broker that handles atomic order distribution, table locks, and ghost-session prevention.',
    packetData: {
      event: 'STATE_BROADCAST',
      payload: '{ syncTargets: ["KDS_1", "WAITER_3", "POS_01"], lock: "ACQUIRED" }',
      speed: '8ms Internal Bus',
      security: 'Role-Based ACL Check Passed',
    },
  },
  kds: {
    id: 'kds',
    title: 'Kitchen KDS Display',
    subtitle: 'Chef Station 1',
    icon: '👨‍🍳',
    color: 'from-amber-500/20 to-orange-500/10',
    borderColor: 'border-amber-500/40',
    metrics: 'Zero Lost Paper Dockets',
    description: 'Interactive touch docket with audio chime alerts, priority cooking timers, and allergy warnings.',
    packetData: {
      event: 'CHIME_TRIGGERED',
      payload: '{ station: "Hot Line", cookingTimer: "06:00", allergy: "Nut-Free" }',
      speed: 'Instant Audio Dispatch',
      security: 'Station Verified',
    },
  },
  waiter: {
    id: 'waiter',
    title: 'Waiter Handheld Floor',
    subtitle: 'Floor Tablet #2',
    icon: '🤵',
    color: 'from-purple-500/20 to-indigo-500/10',
    borderColor: 'border-[#A855F7]/40',
    metrics: '3x Faster Table Turns',
    description: 'Handheld terminal for live seat assignment, one-tap food serving, and manager-approved cancellations.',
    packetData: {
      event: 'TABLE_STATUS_UPDATE',
      payload: '{ table: 4, status: "READY_TO_SERVE", serverId: "WTR_08" }',
      speed: 'Real-time Handshake',
      security: 'Two-Tier PIN Auth',
    },
  },
  pos: {
    id: 'pos',
    title: 'Cashier & Split Billing',
    subtitle: 'Counter POS Terminal',
    icon: '💵',
    color: 'from-emerald-500/20 to-green-500/10',
    borderColor: 'border-primary/40',
    metrics: 'GST Compliant • 80mm Print',
    description: 'Performs multi-seat bill splitting, instant UPI QR generation, and permanent ledger reconciliation.',
    packetData: {
      event: 'SETTLEMENT_RECORDED',
      payload: '{ split: 3, upiRef: "UPI-982183", taxGst: "₹72.50", status: "CLEARED" }',
      speed: 'Instant Ledger Append',
      security: 'Immutable Audit Log',
    },
  },
  ai: {
    id: 'ai',
    title: 'AI Inventory & Demand',
    subtitle: 'Recipe Depletion Engine',
    icon: '📦',
    color: 'from-pink-500/20 to-rose-500/10',
    borderColor: 'border-pink-500/40',
    metrics: '-24% Food Waste Reduction',
    description: 'Gram-level raw ingredient deduction per recipe dish, automatic low-stock alerts, and predictive weekend forecasts.',
    packetData: {
      event: 'STOCK_DEPLETED',
      payload: '{ chicken: "-350g", cream: "-120g", predictedRush: "+140% Sat" }',
      speed: 'Background Async AI',
      security: 'Automated Stock Guard',
    },
  },
};

export function SystemArchitectureLaserGraph() {
  const [selectedNode, setSelectedNode] = useState<string>('cloud');

  const active = architectureNodes[selectedNode] || architectureNodes.cloud;

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden border-t border-border/60 bg-[#070A0E]">
      {/* Background Starfield Particles */}
      <div className="absolute inset-0 bg-[radial-gradient(#1F1F26_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

      <div className="mx-auto max-w-7xl space-y-12 relative z-10">
        {/* Section Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1 text-xs font-black uppercase text-primary"
          >
            <span>⚡ Live Data Flow Circuit</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-5xl font-black text-foreground tracking-tight"
          >
            How Data Streams Through <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-[#38BDF8] to-[#A855F7]">
              The Atlas Connected Mesh
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-sm sm:text-base text-muted-foreground leading-relaxed"
          >
            Click on any node in the architecture below to inspect the live telemetry, encryption handshake, and data packets flowing across the restaurant network.
          </motion.p>
        </div>

        {/* Laser Graph Diagram Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Visual Interactive Flow Canvas (Left 7 cols) */}
          <div className="lg:col-span-7 relative rounded-3xl border border-border bg-background/90 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
            <BorderBeam size={240} duration={10} colorFrom="#34D399" colorTo="#38BDF8" />

            {/* SVG Connecting Circuit Laser Wires */}
            <svg
              className="absolute inset-0 h-full w-full pointer-events-none"
              style={{ zIndex: 0 }}
              viewBox="0 0 600 400"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Background Path Wires */}
              <path d="M 120 80 Q 300 80 300 200" stroke="#1F1F26" strokeWidth="2" strokeDasharray="4 4" />
              <path d="M 120 320 Q 300 320 300 200" stroke="#1F1F26" strokeWidth="2" strokeDasharray="4 4" />
              <path d="M 300 200 Q 300 80 480 80" stroke="#1F1F26" strokeWidth="2" strokeDasharray="4 4" />
              <path d="M 300 200 Q 300 200 480 200" stroke="#1F1F26" strokeWidth="2" strokeDasharray="4 4" />
              <path d="M 300 200 Q 300 320 480 320" stroke="#1F1F26" strokeWidth="2" strokeDasharray="4 4" />

              {/* Glowing Animated Laser Pulses */}
              <motion.path
                d="M 120 80 Q 300 80 300 200"
                stroke="url(#gradientMint)"
                strokeWidth="3"
                initial={{ pathLength: 0, pathOffset: 0 }}
                animate={{ pathLength: [0.15, 0.3, 0.15], pathOffset: [0, 1] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
              />
              <motion.path
                d="M 120 320 Q 300 320 300 200"
                stroke="url(#gradientPurple)"
                strokeWidth="3"
                initial={{ pathLength: 0, pathOffset: 0 }}
                animate={{ pathLength: [0.15, 0.3, 0.15], pathOffset: [0, 1] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
              />
              <motion.path
                d="M 300 200 Q 300 80 480 80"
                stroke="url(#gradientCyan)"
                strokeWidth="3"
                initial={{ pathLength: 0, pathOffset: 0 }}
                animate={{ pathLength: [0.15, 0.3, 0.15], pathOffset: [0, 1] }}
                transition={{ duration: 2.0, repeat: Infinity, ease: 'linear' }}
              />
              <motion.path
                d="M 300 200 Q 300 200 480 200"
                stroke="url(#gradientPurple)"
                strokeWidth="3"
                initial={{ pathLength: 0, pathOffset: 0 }}
                animate={{ pathLength: [0.15, 0.3, 0.15], pathOffset: [0, 1] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: 'linear' }}
              />
              <motion.path
                d="M 300 200 Q 300 320 480 320"
                stroke="url(#gradientMint)"
                strokeWidth="3"
                initial={{ pathLength: 0, pathOffset: 0 }}
                animate={{ pathLength: [0.15, 0.3, 0.15], pathOffset: [0, 1] }}
                transition={{ duration: 2.7, repeat: Infinity, ease: 'linear' }}
              />

              {/* Gradients */}
              <defs>
                <linearGradient id="gradientMint" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#34D399" stopOpacity="0" />
                  <stop offset="50%" stopColor="#34D399" stopOpacity="1" />
                  <stop offset="100%" stopColor="#34D399" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="gradientPurple" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#A855F7" stopOpacity="0" />
                  <stop offset="50%" stopColor="#A855F7" stopOpacity="1" />
                  <stop offset="100%" stopColor="#A855F7" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="gradientCyan" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#38BDF8" stopOpacity="0" />
                  <stop offset="50%" stopColor="#38BDF8" stopOpacity="1" />
                  <stop offset="100%" stopColor="#38BDF8" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>

            {/* Interactive Node Cards */}
            <div className="relative z-10 grid grid-cols-3 gap-6 items-center">
              {/* Left Column Nodes (Diner & Cashier) */}
              <div className="space-y-12">
                {['diner', 'pos'].map((key) => {
                  const node = architectureNodes[key];
                  const isSelected = selectedNode === key;
                  return (
                    <motion.div
                      key={key}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedNode(key)}
                      className={`cursor-pointer rounded-2xl border p-3.5 transition-all duration-300 bg-gradient-to-b ${node.color} ${
                        isSelected
                          ? 'border-primary shadow-[0_0_25px_rgba(42,254,183,0.35)] scale-105'
                          : `${node.borderColor} hover:border-primary/60`
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{node.icon}</span>
                        <div>
                          <p className="text-xs font-black text-foreground">{node.title}</p>
                          <p className="text-[9px] text-muted-foreground">{node.subtitle}</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Center Column: Central Cloud Core */}
              <div className="flex justify-center">
                {(() => {
                  const node = architectureNodes.cloud;
                  const isSelected = selectedNode === 'cloud';
                  return (
                    <motion.div
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedNode('cloud')}
                      className={`cursor-pointer rounded-3xl border p-5 text-center transition-all duration-300 bg-gradient-to-b ${node.color} ${
                        isSelected
                          ? 'border-[#38BDF8] shadow-[0_0_35px_rgba(56,189,248,0.4)] scale-105'
                          : `${node.borderColor} hover:border-[#38BDF8]/60`
                      }`}
                    >
                      <div className="h-12 w-12 mx-auto rounded-2xl bg-[#38BDF8]/20 flex items-center justify-center text-2xl shadow-[0_0_20px_rgba(56,189,248,0.3)] animate-pulse">
                        ⚡
                      </div>
                      <p className="mt-2 text-xs font-black text-foreground">{node.title}</p>
                      <p className="text-[10px] text-[#38BDF8] font-mono font-bold">Sub-100ms Sync</p>
                    </motion.div>
                  );
                })()}
              </div>

              {/* Right Column Nodes (KDS, Waiter, AI) */}
              <div className="space-y-4">
                {['kds', 'waiter', 'ai'].map((key) => {
                  const node = architectureNodes[key];
                  const isSelected = selectedNode === key;
                  return (
                    <motion.div
                      key={key}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedNode(key)}
                      className={`cursor-pointer rounded-2xl border p-3.5 transition-all duration-300 bg-gradient-to-b ${node.color} ${
                        isSelected
                          ? 'border-primary shadow-[0_0_25px_rgba(42,254,183,0.35)] scale-105'
                          : `${node.borderColor} hover:border-primary/60`
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{node.icon}</span>
                        <div>
                          <p className="text-xs font-black text-foreground">{node.title}</p>
                          <p className="text-[9px] text-muted-foreground">{node.subtitle}</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Node Live Telemetry Inspector (Right 5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={active.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="rounded-3xl border border-border bg-card/95 p-6 sm:p-8 space-y-6 shadow-2xl relative"
              >
                <BorderBeam size={180} duration={8} colorFrom="#A855F7" colorTo="#34D399" />

                <div className="flex items-center justify-between border-b border-border pb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-secondary border border-border flex items-center justify-center text-xl">
                      {active.icon}
                    </div>
                    <div>
                      <h3 className="text-base font-black text-foreground">{active.title}</h3>
                      <p className="text-xs text-muted-foreground">{active.subtitle}</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-primary/15 border border-primary/30 px-3 py-0.5 text-[10px] font-black uppercase text-primary">
                    ACTIVE NODE
                  </span>
                </div>

                <p className="text-xs text-foreground leading-relaxed">{active.description}</p>

                {/* Packet Telemetry Terminal */}
                <div className="rounded-2xl border border-border bg-[#070A0E] p-4 space-y-3 font-mono">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground border-b border-border pb-2">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-primary animate-ping" />
                      LIVE DATA PACKET
                    </span>
                    <span className="text-primary">{active.packetData.speed}</span>
                  </div>

                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Event:</span>
                      <span className="text-amber-400 font-bold">{active.packetData.event}</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-muted-foreground">Payload:</span>
                      <p className="rounded-lg bg-card p-2 text-[10px] text-primary break-all">
                        {active.packetData.payload}
                      </p>
                    </div>
                    <div className="flex justify-between pt-1">
                      <span className="text-muted-foreground">Security:</span>
                      <span className="text-cyan-400">{active.packetData.security}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground flex items-center justify-between">
                  <span>Throughput Metric:</span>
                  <span className="font-bold text-primary font-mono">{active.metrics}</span>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

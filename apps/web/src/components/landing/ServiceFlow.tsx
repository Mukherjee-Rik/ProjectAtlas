'use client';

import React, { useRef } from 'react';
import { motion, useScroll, useSpring, useTransform } from 'framer-motion';

interface Stage {
  num: string;
  surface: string;
  title: string;
  body: string;
  /** The thing this stage takes off the floor. Kept short on purpose. */
  replaces: string;
}

const stages: Stage[] = [
  {
    num: '01',
    surface: "Guest's phone",
    title: 'They scan the standee and order',
    body: "No app, no download, no account. The menu opens in the browser they already have — photos, variants, and only the items your kitchen can actually make right now. Another round later goes on the same table under a second token.",
    replaces: 'Replaces the printed menu and the flag-down wait',
  },
  {
    num: '02',
    surface: 'Kitchen screen',
    title: 'The kitchen sees it before the waiter turns around',
    body: 'Tickets arrive in the order they were placed, with modifiers and allergy notes in the same spot every time. Chefs mark dishes off as they leave the pass. Nothing to print, nothing to shout across the line, no docket on the floor.',
    replaces: 'Replaces the printer, the spike, and the lost docket',
  },
  {
    num: '03',
    surface: "Waiter's tablet",
    title: 'Floor staff stop walking to the kitchen to check',
    body: "The tablet shows what's ready and whose table it belongs to. Waiters add a round from the aisle instead of the terminal, and pull up the payment QR at the table when someone asks to settle.",
    replaces: 'Replaces the trip to the pass to ask "is 14 up yet?"',
  },
  {
    num: '04',
    surface: 'Cashier counter',
    title: 'Split it, print it, table goes green',
    body: 'Cash, card, or UPI. Split by person or by item, print an 80mm receipt with the tax broken out and the token on it, and the table resets to Available. Recipe ingredients come off inventory on the way out.',
    replaces: 'Replaces the end-of-night reconciliation',
  },
];

export function ServiceFlow() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 65%', 'end 60%'],
  });
  // Spring keeps the rule from twitching on trackpad scroll.
  const smooth = useSpring(scrollYProgress, { stiffness: 90, damping: 26 });
  const ruleHeight = useTransform(smooth, [0, 1], ['0%', '100%']);

  return (
    <section
      ref={containerRef}
      id="workflow"
      className="border-t border-border px-6 py-24 sm:py-32 lg:px-8"
    >
      <div className="mx-auto max-w-6xl">
        {/* Section head. Left-aligned; the eyebrow states where you are, the
            paragraph sits in the second column rather than centred underneath. */}
        <div className="grid gap-6 md:grid-cols-12 md:items-end">
          <div className="md:col-span-7">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              One service, start to finish
            </p>
            <h2 className="mt-5 font-display text-[2rem] font-bold leading-[1.05] tracking-[-0.03em] text-foreground sm:text-[2.75rem]">
              Four screens, one order.
            </h2>
          </div>
          <p className="text-[15px] leading-relaxed text-muted-foreground md:col-span-5">
            An order placed at the table is the same record the kitchen cooks from, the
            waiter serves from, and the cashier settles. It is never re-typed.
          </p>
        </div>

        {/* Numbered stages. The rule in the gutter fills as you read down it. */}
        <div className="relative mt-16 sm:mt-20">
          <div className="absolute bottom-2 left-[11px] top-2 hidden w-px bg-secondary sm:block">
            <motion.div
              style={{ height: ruleHeight }}
              className="w-full bg-primary/60"
            />
          </div>

          <ol className="sm:pl-16">
            {stages.map((stage) => (
              <motion.li
                key={stage.num}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.5, ease: [0.22, 0.61, 0.36, 1] }}
                className="relative grid gap-x-10 gap-y-4 border-t border-border py-10 first:border-t-0 sm:py-12 md:grid-cols-12"
              >
                {/* Tick on the gutter rule, level with the stage number.
                    Every row carries identical padding so one offset fits all. */}
                <span
                  aria-hidden
                  className="absolute -left-[55px] top-[71px] hidden h-[5px] w-[5px] rounded-full bg-primary sm:block"
                />

                <div className="md:col-span-4">
                  <div className="flex items-baseline gap-4">
                    <span className="font-display text-[2.5rem] font-medium leading-none tracking-[-0.04em] text-foreground/[0.16] sm:text-[3.25rem]">
                      {stage.num}
                    </span>
                    <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                      {stage.surface}
                    </span>
                  </div>
                </div>

                <div className="md:col-span-8">
                  <h3 className="font-display text-xl font-semibold tracking-[-0.02em] text-foreground sm:text-2xl">
                    {stage.title}
                  </h3>
                  <p className="mt-3 max-w-2xl text-[15px] leading-[1.7] text-muted-foreground">
                    {stage.body}
                  </p>
                  <p className="mt-5 text-[13px] text-subtle">{stage.replaces}</p>
                </div>
              </motion.li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

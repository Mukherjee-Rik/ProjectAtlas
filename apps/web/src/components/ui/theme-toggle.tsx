'use client';

import React, { useId } from 'react';
import { useTheme } from '@/hooks/use-theme';

/**
 * Light/dark toggle.
 *
 * Two animations doing different jobs:
 *
 *  1. The icon morphs sun <-> moon. The crescent isn't a second glyph faded
 *     in — it's the same disc with a mask circle sliding across it, so the
 *     shape genuinely transforms. The rays retract into the disc as it goes.
 *  2. The page wipes to the new theme as a circle expanding from this button
 *     (View Transitions API, in use-theme). That's why the handler passes its
 *     own centre up.
 *
 * The morph is driven by CSS off `<html class="dark">`, not React state, for
 * one specific reason: the server can't know the visitor's theme, so state
 * would render a sun on the server and a moon on the client and blow up
 * hydration. Identical markup + CSS sidesteps that, and the pre-paint script
 * has already set the class before anything is visible.
 *
 * Both animations degrade — no View Transitions, or prefers-reduced-motion,
 * and the theme simply switches.
 */

const RAYS = [
  { x1: 12, y1: 1.6, x2: 12, y2: 4.0 },
  { x1: 12, y1: 20.0, x2: 12, y2: 22.4 },
  { x1: 1.6, y1: 12, x2: 4.0, y2: 12 },
  { x1: 20.0, y1: 12, x2: 22.4, y2: 12 },
  { x1: 4.4, y1: 4.4, x2: 6.1, y2: 6.1 },
  { x1: 17.9, y1: 17.9, x2: 19.6, y2: 19.6 },
  { x1: 4.4, y1: 19.6, x2: 6.1, y2: 17.9 },
  { x1: 17.9, y1: 6.1, x2: 19.6, y2: 4.4 },
];

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { toggle } = useTheme();
  const maskId = useId();

  return (
    <button
      type="button"
      onClick={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        toggle({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
      }}
      // Static label: a theme-dependent string would mismatch on hydration.
      aria-label="Toggle light or dark mode"
      title="Toggle light or dark mode"
      className={`atlas-theme-toggle liquid-glass liquid-glass-sm group relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-foreground transition-colors hover:bg-secondary/70 ${className}`}
    >
      <svg viewBox="0 0 24 24" className="atlas-theme-icon h-[18px] w-[18px]">
        <mask id={maskId}>
          {/* White keeps, black cuts. */}
          <rect x="0" y="0" width="24" height="24" fill="white" />
          {/* Parked over the disc's top-right; CSS slides it away in light. */}
          <circle className="atlas-theme-cut" cx="17.5" cy="6.5" r="8.5" fill="black" />
        </mask>

        {/* r is the moon size; CSS scales it down to the sun's core. */}
        <circle
          className="atlas-theme-disc"
          cx="12"
          cy="12"
          r="9"
          fill="currentColor"
          mask={`url(#${maskId})`}
        />

        <g
          className="atlas-theme-rays"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        >
          {RAYS.map((r, i) => (
            <line key={i} x1={r.x1} y1={r.y1} x2={r.x2} y2={r.y2} />
          ))}
        </g>
      </svg>
    </button>
  );
}

'use client';

import React, { useCallback, useRef } from 'react';

/**
 * A liquid-glass pane.
 *
 * The material itself is CSS (`.liquid-glass` in globals.css) — refraction via
 * an SVG displacement map, a specular sheen, and a lit rim. This component adds
 * the one thing CSS can't do alone: moving the light source.
 *
 * `--lg-x` / `--lg-y` are registered with @property as <percentage>, so they
 * interpolate. Writing them on pointermove makes the highlight glide across
 * the pane instead of snapping, which is what sells "liquid" over "frosted".
 * The variables are written straight to the node — going through React state
 * would re-render the subtree on every mouse move.
 */

interface LiquidGlassProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /** Gentler lens + blur. Use for small controls, where a big bend swamps the shape. */
  small?: boolean;
  /** Follow the pointer. Off for things like a sticky nav, where it's noise. */
  interactive?: boolean;
  className?: string;
}

export function LiquidGlass({
  children,
  small = false,
  interactive = true,
  className = '',
  ...rest
}: LiquidGlassProps) {
  const ref = useRef<HTMLDivElement>(null);

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!interactive) return;
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty('--lg-x', `${((e.clientX - r.left) / r.width) * 100}%`);
      el.style.setProperty('--lg-y', `${((e.clientY - r.top) / r.height) * 100}%`);
    },
    [interactive]
  );

  const onPointerLeave = useCallback(() => {
    if (!interactive) return;
    const el = ref.current;
    if (!el) return;
    // Back to a light source above and slightly left — the resting state.
    el.style.setProperty('--lg-x', '50%');
    el.style.setProperty('--lg-y', '0%');
  }, [interactive]);

  return (
    <div
      ref={ref}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      className={`liquid-glass ${small ? 'liquid-glass-sm' : ''} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

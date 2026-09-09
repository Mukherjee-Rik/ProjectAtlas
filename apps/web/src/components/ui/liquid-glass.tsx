'use client';

import React, { useCallback, useEffect, useRef } from 'react';

/**
 * A liquid-glass pane.
 *
 * The material itself is CSS (`.liquid-glass` in globals.css) — a blurred,
 * saturated backdrop, a specular sheen, and a lit rim. This component adds the
 * one thing CSS can't do alone: moving the light source.
 *
 * `--lg-x` / `--lg-y` are registered with @property as <percentage>, so they
 * interpolate. Writing them on pointermove makes the highlight glide across
 * the pane instead of snapping, which is what sells "liquid" over "frosted".
 * The variables are written straight to the node — going through React state
 * would re-render the subtree on every mouse move.
 *
 * Three things keep that cheap, because each write restarts two 400ms
 * transitions on a layer that also carries a backdrop-filter:
 *   - the pane's rect is measured on enter and cached, not re-read per event
 *     (getBoundingClientRect forces layout);
 *   - writes are coalesced into one frame;
 *   - nothing runs on a coarse pointer at all, where globals.css switches the
 *     sheen and rim layers off anyway.
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
  const rectRef = useRef<DOMRect | null>(null);
  const frameRef = useRef<number | null>(null);
  const pointRef = useRef({ x: 0, y: 0 });
  const finePointerRef = useRef(false);

  useEffect(() => {
    if (!interactive) return;

    const query = window.matchMedia('(pointer: fine)');
    const syncPointer = () => {
      finePointerRef.current = query.matches;
    };
    syncPointer();

    // The cached rect is viewport-relative, so anything that can move the
    // pane invalidates it; the next pointermove re-measures once.
    const invalidateRect = () => {
      rectRef.current = null;
    };

    query.addEventListener('change', syncPointer);
    window.addEventListener('resize', invalidateRect, { passive: true });
    window.addEventListener('scroll', invalidateRect, { passive: true });

    return () => {
      query.removeEventListener('change', syncPointer);
      window.removeEventListener('resize', invalidateRect);
      window.removeEventListener('scroll', invalidateRect);
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [interactive]);

  const onPointerEnter = useCallback(() => {
    if (!interactive || !finePointerRef.current) return;
    rectRef.current = ref.current?.getBoundingClientRect() ?? null;
  }, [interactive]);

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!interactive || !finePointerRef.current) return;

      pointRef.current = { x: e.clientX, y: e.clientY };
      if (frameRef.current !== null) return;

      frameRef.current = requestAnimationFrame(() => {
        frameRef.current = null;

        const el = ref.current;
        if (!el) return;

        if (!rectRef.current) {
          rectRef.current = el.getBoundingClientRect();
        }
        const r = rectRef.current;
        if (!r.width || !r.height) return;

        const { x, y } = pointRef.current;
        el.style.setProperty('--lg-x', `${((x - r.left) / r.width) * 100}%`);
        el.style.setProperty('--lg-y', `${((y - r.top) / r.height) * 100}%`);
      });
    },
    [interactive]
  );

  const onPointerLeave = useCallback(() => {
    if (!interactive) return;

    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    rectRef.current = null;

    const el = ref.current;
    if (!el) return;
    // Back to a light source above and slightly left — the resting state.
    el.style.setProperty('--lg-x', '50%');
    el.style.setProperty('--lg-y', '0%');
  }, [interactive]);

  return (
    <div
      ref={ref}
      onPointerEnter={onPointerEnter}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      className={`liquid-glass ${small ? 'liquid-glass-sm' : ''} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

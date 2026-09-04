'use client';

import React from 'react';

/**
 * The SVG filters behind `.liquid-glass`.
 *
 * Frosted glass is just blur. What makes Apple's Liquid Glass read as a
 * physical pane is REFRACTION — the backdrop bends near the edges, the way it
 * does through the rim of real glass, while the middle stays optically clear.
 *
 * That needs feDisplacementMap, and a displacement map shaped like a lens:
 *
 *   - The red channel drives horizontal displacement, green drives vertical.
 *   - 128 is neutral (no shift). 0 pushes one way, 255 the other.
 *   - So the map is a flat plateau of rgb(128,128,·) across the middle that
 *     ramps to the extremes only near the borders. Result: the centre is
 *     undistorted and readable, the edges lens.
 *
 * The two gradients are composited with `mix-blend-mode: screen` so the
 * horizontal ramp lands in R and the vertical ramp in G without either
 * clobbering the other — screen of (128,0,0) and (0,128,0) is (128,128,0).
 *
 * Mounted once in the root layout; the filters are referenced by id from CSS.
 */

const LENS_MAP = [
  "data:image/svg+xml,",
  "%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E",
  "%3Cdefs%3E",
  // Horizontal ramp -> red channel. Plateau between 32% and 68%.
  "%3ClinearGradient id='x' x1='0' y1='0' x2='1' y2='0'%3E",
  "%3Cstop offset='0' stop-color='rgb(0,0,0)'/%3E",
  "%3Cstop offset='0.32' stop-color='rgb(128,0,0)'/%3E",
  "%3Cstop offset='0.68' stop-color='rgb(128,0,0)'/%3E",
  "%3Cstop offset='1' stop-color='rgb(255,0,0)'/%3E",
  "%3C/linearGradient%3E",
  // Vertical ramp -> green channel.
  "%3ClinearGradient id='y' x1='0' y1='0' x2='0' y2='1'%3E",
  "%3Cstop offset='0' stop-color='rgb(0,0,0)'/%3E",
  "%3Cstop offset='0.32' stop-color='rgb(0,128,0)'/%3E",
  "%3Cstop offset='0.68' stop-color='rgb(0,128,0)'/%3E",
  "%3Cstop offset='1' stop-color='rgb(0,255,0)'/%3E",
  "%3C/linearGradient%3E",
  "%3C/defs%3E",
  "%3Crect width='240' height='240' fill='url(%23x)'/%3E",
  "%3Crect width='240' height='240' fill='url(%23y)' style='mix-blend-mode:screen'/%3E",
  "%3C/svg%3E",
].join('');

export function LiquidGlassDefs() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      // Kept out of layout and out of the a11y tree; this is a filter library.
      style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
    >
      <defs>
        {/* Panels: a generous bend, since the pane is large. */}
        <filter id="kafei-lens" x="0%" y="0%" width="100%" height="100%">
          <feImage href={LENS_MAP} result="map" preserveAspectRatio="none" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="map"
            scale="52"
            xChannelSelector="R"
            yChannelSelector="G"
          />
          {/* Softens the seam the displacement leaves at the very edge. */}
          <feGaussianBlur stdDeviation="0.35" />
        </filter>
        <filter id="atlas-lens" x="0%" y="0%" width="100%" height="100%">
          <feImage href={LENS_MAP} result="map" preserveAspectRatio="none" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="map"
            scale="52"
            xChannelSelector="R"
            yChannelSelector="G"
          />
          {/* Softens the seam the displacement leaves at the very edge. */}
          <feGaussianBlur stdDeviation="0.35" />
        </filter>

        {/* Small controls: same lens, gentler, or the bend swamps the shape. */}
        <filter id="kafei-lens-sm" x="0%" y="0%" width="100%" height="100%">
          <feImage href={LENS_MAP} result="map" preserveAspectRatio="none" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="map"
            scale="20"
            xChannelSelector="R"
            yChannelSelector="G"
          />
          <feGaussianBlur stdDeviation="0.3" />
        </filter>
        <filter id="atlas-lens-sm" x="0%" y="0%" width="100%" height="100%">
          <feImage href={LENS_MAP} result="map" preserveAspectRatio="none" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="map"
            scale="20"
            xChannelSelector="R"
            yChannelSelector="G"
          />
          <feGaussianBlur stdDeviation="0.3" />
        </filter>
      </defs>
    </svg>
  );
}

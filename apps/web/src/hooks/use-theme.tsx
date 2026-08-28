'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useSyncExternalStore,
} from 'react';

/**
 * Theme state.
 *
 * The source of truth is the DOM: `<html class="dark">`, set before first
 * paint by `themeInitScript`. Everything here reads from that rather than
 * keeping a parallel copy in React state, which is why this uses
 * useSyncExternalStore — localStorage and matchMedia are external stores, and
 * mirroring them into state via an effect causes a cascading render.
 *
 * `preference` is what the user picked and may be 'system'; `resolved` is what
 * is actually painted.
 */

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'atlas-theme';
/** Dispatched after a same-tab commit so subscribers re-read the DOM. */
const THEME_EVENT = 'atlas:themechange';

/**
 * Runs before first paint to stop a flash of the wrong theme. Kept in sync
 * with `resolve()` below — if the two disagree the page repaints on hydration,
 * which is the exact thing this exists to prevent.
 */
export const themeInitScript = `
(function(){
  try {
    var stored = localStorage.getItem('${THEME_STORAGE_KEY}');
    var isDark = stored === 'dark' ||
      ((!stored || stored === 'system') &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
  } catch (e) {
    document.documentElement.classList.add('dark');
  }
})();
`;

function systemPrefersDark() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function readPreference(): ThemePreference {
  try {
    const s = localStorage.getItem(THEME_STORAGE_KEY);
    if (s === 'light' || s === 'dark' || s === 'system') return s;
  } catch {
    // Private mode can throw.
  }
  return 'system';
}

function resolve(pref: ThemePreference): ResolvedTheme {
  if (pref === 'system') return systemPrefersDark() ? 'dark' : 'light';
  return pref;
}

function apply(next: ResolvedTheme) {
  const root = document.documentElement;
  root.classList.toggle('dark', next === 'dark');
  // Themes the UA's scrollbars and form controls to match.
  root.style.colorScheme = next;
}

/* ── External store plumbing ─────────────────────────────────────────────── */

function subscribe(onChange: () => void) {
  const mq = window.matchMedia('(prefers-color-scheme: dark)');

  // OS flipped. Only repaint if we're actually following the OS.
  const onMedia = () => {
    if (readPreference() === 'system') apply(systemPrefersDark() ? 'dark' : 'light');
    onChange();
  };
  // Another tab changed the preference — mirror it here.
  const onStorage = (e: StorageEvent) => {
    if (e.key && e.key !== THEME_STORAGE_KEY) return;
    apply(resolve(readPreference()));
    onChange();
  };

  mq.addEventListener('change', onMedia);
  window.addEventListener('storage', onStorage);
  window.addEventListener(THEME_EVENT, onChange);
  return () => {
    mq.removeEventListener('change', onMedia);
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(THEME_EVENT, onChange);
  };
}

const getResolved = (): ResolvedTheme =>
  document.documentElement.classList.contains('dark') ? 'dark' : 'light';

// Server has no DOM or storage. Dark is the design default, and the pre-paint
// script corrects it before the user sees anything.
const serverResolved = (): ResolvedTheme => 'dark';
const serverPreference = (): ThemePreference => 'system';

/* ── Context ─────────────────────────────────────────────────────────────── */

interface ThemeContextValue {
  preference: ThemePreference;
  resolved: ResolvedTheme;
  /** Flip light<->dark. Pass a point to wipe outward from it. */
  toggle: (origin?: { x: number; y: number }) => void;
  setPreference: (p: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const resolved = useSyncExternalStore(subscribe, getResolved, serverResolved);
  const preference = useSyncExternalStore(
    subscribe,
    readPreference,
    serverPreference
  );

  const commit = useCallback((pref: ThemePreference) => {
    apply(resolve(pref));
    try {
      localStorage.setItem(THEME_STORAGE_KEY, pref);
    } catch {
      // ignore
    }
    window.dispatchEvent(new Event(THEME_EVENT));
  }, []);

  const toggle = useCallback(
    (origin?: { x: number; y: number }) => {
      const nextPref: ThemePreference = resolved === 'dark' ? 'light' : 'dark';

      const reduceMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches;

      const startViewTransition = (
        document as Document & {
          startViewTransition?: (cb: () => void) => { ready: Promise<void> };
        }
      ).startViewTransition;

      if (!startViewTransition || reduceMotion || !origin) {
        commit(nextPref);
        return;
      }

      // The incoming theme is revealed by a circle growing from the button.
      // Radius reaches the furthest corner so it always covers the viewport.
      const { x, y } = origin;
      const radius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      );

      const transition = startViewTransition.call(document, () => {
        commit(nextPref);
      });

      transition.ready
        .then(() => {
          document.documentElement.animate(
            {
              clipPath: [
                `circle(0px at ${x}px ${y}px)`,
                `circle(${radius}px at ${x}px ${y}px)`,
              ],
            },
            {
              duration: 620,
              easing: 'cubic-bezier(0.32, 0.72, 0, 1)',
              pseudoElement: '::view-transition-new(root)',
            }
          );
        })
        .catch(() => {
          // A transition can be skipped if another starts. The theme is
          // already committed, so there is nothing to recover.
        });
    },
    [resolved, commit]
  );

  return (
    <ThemeContext.Provider
      value={{ preference, resolved, toggle, setPreference: commit }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}

'use client';

import { useEffect, useState } from 'react';

export const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Map v from [a, b] to [0, 1], clamped. */
export const range = (v: number, a: number, b: number) => clamp((v - a) / (b - a));

export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

/** Small deterministic PRNG so server and client agree on "random" layouts. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** True on macOS / iOS, where the display stack resolves to SF Pro. */
export function isApplePlatform() {
  if (typeof navigator === 'undefined') return false;
  return /Mac|iPhone|iPad|iPod/i.test(navigator.platform || '') || /Macintosh|iPhone|iPad/i.test(navigator.userAgent);
}

/**
 * Font family string for <canvas> text that matches what the DOM renders for
 * the display stack: SF (system-ui) on Apple devices, Inter everywhere else.
 */
export function canvasDisplayFamily() {
  if (typeof window === 'undefined') return 'sans-serif';
  if (isApplePlatform()) return 'system-ui, -apple-system, sans-serif';
  const inter = getComputedStyle(document.body).getPropertyValue('--font-inter').trim();
  return inter ? `${inter}, sans-serif` : 'Inter, Arial, sans-serif';
}

/** Tracks a media query (false during SSR). */
export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const update = () => setMatches(mql.matches);
    update();
    mql.addEventListener('change', update);
    return () => mql.removeEventListener('change', update);
  }, [query]);
  return matches;
}

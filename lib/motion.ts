/* ==========================================================================
   Environment checks — call these inside effects / event handlers only
   (they read window.matchMedia, which doesn't exist during SSR).
   ========================================================================== */

export const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const hasFinePointer = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/** True when the <head> failsafe gave up waiting for the app (see app/layout.tsx). */
export const isStaticMode = (): boolean =>
  typeof document !== 'undefined' && document.documentElement.classList.contains('no-gsap');

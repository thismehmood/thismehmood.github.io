'use client';

/* ==========================================================================
   AppProvider — app-wide motion state shared by every section:
   - Lenis smooth scroll driven by GSAP's ticker, synced with ScrollTrigger
   - `revealed`: flips true when the preloader hands off to the hero
   - scrollTo(): Lenis-aware programmatic scrolling
   - In-page anchor navigation (smooth scroll + focus management)
   - Mobile-menu registry so anchors can close the menu synchronously
   - Global magnetic hover + button fills
   ========================================================================== */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import Lenis from 'lenis';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { hasFinePointer, isStaticMode, prefersReducedMotion } from '@/lib/motion';
import { initButtonFills, initMagnetic } from '@/lib/interactions';

export type ScrollTarget = number | string | HTMLElement;

export type MenuController = {
  isOpen: () => boolean;
  /** Must un-inert the page synchronously so focus can move right after. */
  close: (opts?: { returnFocus?: boolean }) => void;
};

type AppContextValue = {
  /** True once the preloader has handed off to the hero intro. */
  revealed: boolean;
  markRevealed: () => void;
  scrollTo: (target: ScrollTarget, opts?: { immediate?: boolean }) => void;
  getLenis: () => Lenis | null;
  registerMenu: (controller: MenuController | null) => void;
};

const AppContext = createContext<AppContextValue | null>(null);

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}

declare global {
  interface Window {
    __appStarted?: boolean;
    __pf?: ReturnType<typeof setTimeout>;
  }
}

/** Page regions made inert while the preloader covers them. */
function setLoadingInert(state: boolean) {
  ['#main', '.footer', '.skip-link', '.nav'].forEach((sel) => {
    const el = document.querySelector<HTMLElement>(sel);
    if (el) el.inert = state;
  });
}

/** '#id' → element, '#top' → 0, anything else → null */
function resolveHash(hash: string | null): number | HTMLElement | null {
  if (!hash || hash === '#') return null;
  if (hash === '#top') return 0;
  try { return document.querySelector<HTMLElement>(hash); } catch { return null; }
}

export default function AppProvider({ children }: { children: ReactNode }) {
  const [revealed, setRevealed] = useState(false);
  const lenisRef = useRef<Lenis | null>(null);
  const menuRef = useRef<MenuController | null>(null);

  const markRevealed = useCallback(() => setRevealed(true), []);
  const getLenis = useCallback(() => lenisRef.current, []);
  const registerMenu = useCallback((c: MenuController | null) => { menuRef.current = c; }, []);

  const scrollTo = useCallback((target: ScrollTarget, { immediate = false } = {}) => {
    const el = typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target;
    const lenis = lenisRef.current;
    if (lenis) {
      // Resolve elements to a position here rather than passing them to Lenis: Lenis ≥ 1.2
      // subtracts the root's scroll-padding-top (globals.css sets it for native focus scrolling),
      // which would stop every section — and deep links into the Work pin — 92px short of the
      // top, unlike the original build (Lenis 1.1).
      const top = typeof el === 'number' ? el : el ? el.getBoundingClientRect().top + lenis.animatedScroll : null;
      if (top === null) return;
      lenis.scrollTo(top, { immediate, duration: 1.6, easing: (t: number) => 1 - Math.pow(1 - t, 4) });
      return;
    }
    const top = typeof el === 'number' ? el : el ? el.getBoundingClientRect().top + window.scrollY : 0;
    window.scrollTo({ top, behavior: immediate || prefersReducedMotion() ? 'auto' : 'smooth' });
  }, []);

  /* --- Tell the <head> failsafe the app has started ---
     A layout effect runs in the same synchronous commit as the sections' useGSAP
     layout effects (children first), so the failsafe can't fire in between and
     switch to the static page after they've already hidden their reveal targets. */
  useLayoutEffect(() => {
    window.__appStarted = true;
    clearTimeout(window.__pf);

    // Keep keyboard focus out of the page while the preloader covers it
    // (JS-only, so no-JS visitors and the static fallback are never inert)
    if (!isStaticMode() && document.body.classList.contains('is-loading')) setLoadingInert(true);
  }, []);

  /* --- Boot: runs after every child effect, so all sections are mounted --- */
  useEffect(() => {
    // Routes without a preloader (404, future pages) must not stay scroll-locked
    if (!document.querySelector('.preloader')) markRevealed();

    // Static fallback (the failsafe already showed the page): leave the reader's
    // scroll position alone and skip smooth scroll / magnetic, like the original
    if (isStaticMode()) return initButtonFills();

    // Always start at the top so the intro plays from a known state
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);

    // Smooth scroll (skipped for reduced motion / static fallback)
    let removeRaf: (() => void) | null = null;
    if (!prefersReducedMotion() && !isStaticMode()) {
      const lenis = new Lenis({ lerp: 0.09, smoothWheel: true, wheelMultiplier: 1, autoRaf: false });
      lenis.on('scroll', ScrollTrigger.update);
      const raf = (time: number) => lenis.raf(time * 1000);
      gsap.ticker.add(raf);
      gsap.ticker.lagSmoothing(0);
      lenis.stop(); // locked until the preloader finishes
      lenisRef.current = lenis;
      removeRaf = () => gsap.ticker.remove(raf);
    }

    // Keep the reader's place in the content across width changes. Crossing the 1024px
    // breakpoint (window resize, tablet rotation) adds or removes the Work pin spacer, and
    // ScrollTrigger.refresh() restores the old raw scrollY — which then points at a
    // different section. So record a content anchor while the reader scrolls (the first
    // block whose bottom is below the viewport top + how far through it they are) and,
    // after a refresh at a new width, scroll back to it.
    const blocks = Array.from(document.querySelectorAll<HTMLElement>('#main > *, .footer'));
    /** `w`: width it was recorded at; `restored`: re-applied since (reader hasn't scrolled). */
    type Anchor = { i: number; frac: number; w: number; restored: boolean };
    let anchor: Anchor | null = null;
    let measuredW = window.innerWidth; // width of the layout ScrollTrigger last measured
    let jumpY = NaN; // where our own restore scrolled to (its scroll event isn't the reader's)
    let recRaf = 0;
    let settleRaf = 0;
    const isRefreshing = () => (ScrollTrigger as unknown as { isRefreshing?: boolean }).isRefreshing === true;
    const recordAnchor = () => {
      recRaf = 0;
      // Skip mid-refresh, between a resize and its refresh (stale layout), and the scroll
      // our own restore (or ScrollTrigger re-applying it) caused
      if (isRefreshing() || window.innerWidth !== measuredW || Math.abs(window.scrollY - jumpY) < 2) return;
      jumpY = NaN;
      for (let i = 0; i < blocks.length; i++) {
        const r = blocks[i].getBoundingClientRect();
        if (r.bottom > 0) {
          anchor = { i, frac: -r.top / Math.max(1, r.height), w: measuredW, restored: false };
          break;
        }
      }
    };
    const onAnchorScroll = () => { if (!recRaf) recRaf = requestAnimationFrame(recordAnchor); };
    const jumpToAnchor = (a: Anchor) => {
      const block = blocks[a.i];
      if (!block?.isConnected) return;
      const r = block.getBoundingClientRect();
      const y = Math.round(r.top + window.scrollY + a.frac * r.height);
      if (Math.abs(y - window.scrollY) < 1) return;
      jumpY = y;
      window.scrollTo(0, y);
      const l = lenisRef.current;
      if (l) {
        l.resize();
        l.scrollTo(y, { immediate: true, force: true });
      }
    };
    const onAnchorRefresh = () => {
      measuredW = window.innerWidth;
      // Restore after a width change — and keep restoring on every later refresh (the
      // breakpoint's, the debounced resize's, a round trip back) until the reader scrolls
      if (!anchor || (anchor.w === measuredW && !anchor.restored)) return;
      const a = anchor;
      a.restored = true;
      jumpToAnchor(a);
      // Late layout (pin re-wrap, scrub) can settle a frame or two after the refresh
      cancelAnimationFrame(settleRaf);
      settleRaf = requestAnimationFrame(() => { settleRaf = requestAnimationFrame(() => jumpToAnchor(a)); });
    };
    // Layout can still settle after the last refresh of a resize (reflow, fonts): keep the
    // anchor applied until the reader scrolls. No-op otherwise.
    const anchorRO = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => {
      if (anchor?.restored && window.innerWidth === measuredW && !isRefreshing()) jumpToAnchor(anchor);
    });
    anchorRO?.observe(document.body);
    window.addEventListener('scroll', onAnchorScroll, { passive: true });
    ScrollTrigger.addEventListener('refresh', onAnchorRefresh);

    // Magnetic hover + direction-aware button fills (desktop only)
    const cleanupMagnetic = hasFinePointer() && !prefersReducedMotion() ? initMagnetic() : () => {};
    const cleanupFills = initButtonFills();

    // Fonts & late assets change layout → recalculate trigger positions
    const refresh = () => ScrollTrigger.refresh();
    document.fonts?.ready.then(refresh);
    window.addEventListener('load', refresh);

    return () => {
      anchorRO?.disconnect();
      window.removeEventListener('scroll', onAnchorScroll);
      ScrollTrigger.removeEventListener('refresh', onAnchorRefresh);
      cancelAnimationFrame(recRaf);
      cancelAnimationFrame(settleRaf);
      window.removeEventListener('load', refresh);
      cleanupMagnetic();
      cleanupFills();
      removeRaf?.();
      lenisRef.current?.destroy();
      lenisRef.current = null;
    };
  }, [markRevealed]);

  /* --- In-page anchors: smooth scroll + move focus to the destination --- */
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const link = (e.target as Element | null)?.closest?.('a[href^="#"]');
      if (!link) return;
      const target = resolveHash(link.getAttribute('href'));
      if (target === null) return;

      const menu = menuRef.current;

      // Static fallback: native fragment jump (respects scroll-padding, updates the hash)
      if (isStaticMode()) {
        if (menu?.isOpen()) menu.close({ returnFocus: false });
        return;
      }
      e.preventDefault();
      if (document.body.classList.contains('is-loading')) return; // preloader still running

      if (menu?.isOpen()) menu.close({ returnFocus: false }); // un-inerts <main> synchronously
      scrollTo(target);

      // Move focus so the next Tab continues from the destination
      const el = typeof target === 'number' ? document.getElementById('main') : target;
      if (el) {
        if (!el.matches('a, button, input, textarea, select, [tabindex]')) el.setAttribute('tabindex', '-1');
        el.focus({ preventScroll: true });
      }
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [scrollTo]);

  /* --- Preloader handed off: unlock scrolling and honour deep links --- */
  useEffect(() => {
    if (!revealed) return;
    document.body.classList.remove('is-loading');
    setLoadingInert(false);
    if (isStaticMode()) return; // the browser already handled any #hash natively

    lenisRef.current?.start();
    ScrollTrigger.refresh();

    const target = resolveHash(window.location.hash);
    if (target !== null) requestAnimationFrame(() => scrollTo(target, { immediate: true }));
  }, [revealed, scrollTo]);

  const value = useMemo<AppContextValue>(
    () => ({ revealed, markRevealed, scrollTo, getLenis, registerMenu }),
    [revealed, markRevealed, scrollTo, getLenis, registerMenu],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

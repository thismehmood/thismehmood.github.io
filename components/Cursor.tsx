'use client';

/* ==========================================================================
   Custom cursor — a crosshair reticle.
   The dot follows tightly, the ring (with four ticks) trails with inertia
   (gsap.quickTo). States: is-hover (interactive — ring grows, ticks rotate
   45° and everything turns green), is-text (inputs — the reticle collapses
   into an I-beam), is-down (pressed). Fine pointer + motion allowed only
   (and not in the static fallback).
   Classes are toggled imperatively, so the JSX here stays constant.
   ========================================================================== */

import { useRef } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import { hasFinePointer, isStaticMode, prefersReducedMotion } from '@/lib/motion';

const INTERACTIVE = 'a, button, [data-magnetic], [role="button"], label, summary, select';
const TEXT = 'input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="submit"]):not([type="button"]), textarea, [contenteditable="true"]';
const STATE_CLASSES = ['is-visible', 'is-hover', 'is-text', 'is-down'];

export default function Cursor() {
  const rootRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const cursor = rootRef.current;
    const ring = ringRef.current;
    const dot = dotRef.current;
    if (!cursor || !ring || !dot) return;
    // Static fallback (page already revealed without the app) keeps the native cursor
    if (!hasFinePointer() || prefersReducedMotion() || isStaticMode()) return;

    const html = document.documentElement;
    html.classList.add('has-cursor');
    gsap.set([dot, ring], { xPercent: -50, yPercent: -50 });

    const dotX = gsap.quickTo(dot, 'x', { duration: 0.1, ease: 'power3' });
    const dotY = gsap.quickTo(dot, 'y', { duration: 0.1, ease: 'power3' });
    const ringX = gsap.quickTo(ring, 'x', { duration: 0.5, ease: 'power3' });
    const ringY = gsap.quickTo(ring, 'y', { duration: 0.5, ease: 'power3' });

    let visible = false;

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      if (!visible) {
        // Jump into place on first move so the ring doesn't fly in from (0,0)
        gsap.set([dot, ring], { x: e.clientX, y: e.clientY });
        cursor.classList.add('is-visible');
        visible = true;
      }
      dotX(e.clientX);
      dotY(e.clientY);
      ringX(e.clientX);
      ringY(e.clientY);
    };

    const onLeave = () => {
      cursor.classList.remove('is-visible');
      visible = false;
    };

    const onDown = () => cursor.classList.add('is-down');
    const onUp = () => cursor.classList.remove('is-down');

    const onOver = (e: PointerEvent) => {
      const t = e.target;
      if (!(t instanceof Element)) return;
      const isText = !!t.closest(TEXT);
      const isInteractive = !!t.closest(INTERACTIVE);

      cursor.classList.toggle('is-hover', isInteractive && !isText);
      cursor.classList.toggle('is-text', isText);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    html.addEventListener('mouseleave', onLeave);
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    document.addEventListener('pointerover', onOver);

    // Runs on context revert (unmount / Strict Mode re-mount); tweens & sets are reverted by useGSAP
    return () => {
      window.removeEventListener('pointermove', onMove);
      html.removeEventListener('mouseleave', onLeave);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      document.removeEventListener('pointerover', onOver);
      html.classList.remove('has-cursor');
      cursor.classList.remove(...STATE_CLASSES);
    };
  }, { scope: rootRef });

  return (
    <div className="cursor" aria-hidden="true" ref={rootRef}>
      <div className="cursor__ring" ref={ringRef}>
        <span className="cursor__ring-inner" />
        <span className="cursor__ticks">
          <span className="cursor__tick" />
          <span className="cursor__tick" />
          <span className="cursor__tick" />
          <span className="cursor__tick" />
        </span>
      </div>
      <div className="cursor__dot" ref={dotRef}>
        <span className="cursor__beam" />
      </div>
    </div>
  );
}

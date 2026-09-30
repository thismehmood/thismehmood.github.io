/* ==========================================================================
   Reusable scroll animations. Call these inside a useGSAP() callback so the
   tweens / ScrollTriggers they create are reverted on unmount.
   ========================================================================== */
import { gsap, ScrollTrigger } from './gsap';

/** Fade-up for `[data-reveal]` elements, batched for a natural stagger. */
export function revealOnScroll(targets: Element[]) {
  if (!targets.length) return;
  gsap.set(targets, { opacity: 0, y: 50 });
  ScrollTrigger.batch(targets, {
    start: 'top 90%',
    once: true,
    onEnter: (batch) =>
      gsap.to(batch, { opacity: 1, y: 0, duration: 1.1, ease: 'expo.out', stagger: 0.08, overwrite: true }),
  });
}

/** Masked word slide-up for a `<SplitText type="words" mask />` heading. */
export function revealWords(el: Element | null) {
  if (!el) return;
  gsap.fromTo(el.querySelectorAll('.word__inner'), { yPercent: 110 }, {
    yPercent: 0,
    duration: 1.2,
    ease: 'expo.out',
    stagger: 0.08,
    scrollTrigger: { trigger: el, start: 'top 88%', once: true },
  });
}

/** Masked character slide-up for a `<SplitText type="chars" />` line (line wrapper masks). */
export function revealChars(el: Element | null, { stagger = 0.025, start = 'top 90%' } = {}) {
  if (!el) return;
  gsap.fromTo(el.querySelectorAll('.char'), { yPercent: 120 }, {
    yPercent: 0,
    duration: 1.3,
    ease: 'expo.out',
    stagger,
    scrollTrigger: { trigger: el, start, once: true },
  });
}

/** Count a number up from 0 when it scrolls into view. */
export function countUp(el: HTMLElement, end: number) {
  const obj = { v: 0 };
  el.textContent = '0';
  ScrollTrigger.create({
    trigger: el,
    start: 'top 88%',
    once: true,
    onEnter: () =>
      gsap.to(obj, {
        v: end,
        duration: 2,
        ease: 'power3.out',
        onUpdate: () => { el.textContent = String(Math.round(obj.v)); },
      }),
  });
}

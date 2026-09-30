/* ==========================================================================
   Global pointer interactions (desktop / fine pointer only).
   Each init function returns a cleanup function.
   ========================================================================== */
import { gsap } from './gsap';

/**
 * Magnetic hover for every `[data-magnetic="<strength>"]` element.
 * An optional `[data-magnetic-inner]` child moves a little further for depth.
 */
export function initMagnetic(root: ParentNode = document): () => void {
  const cleanups: Array<() => void> = [];

  root.querySelectorAll<HTMLElement>('[data-magnetic]').forEach((el) => {
    const strength = parseFloat(el.dataset.magnetic || '') || 0.35;
    const inner = el.querySelector<HTMLElement>('[data-magnetic-inner]');
    const ease = 'elastic.out(1, 0.35)';

    const xTo = gsap.quickTo(el, 'x', { duration: 1, ease });
    const yTo = gsap.quickTo(el, 'y', { duration: 1, ease });
    const ixTo = inner ? gsap.quickTo(inner, 'x', { duration: 1, ease }) : null;
    const iyTo = inner ? gsap.quickTo(inner, 'y', { duration: 1, ease }) : null;

    let rect: DOMRect | null = null;
    const onEnter = () => { rect = el.getBoundingClientRect(); };
    const onMove = (e: PointerEvent) => {
      if (!rect) rect = el.getBoundingClientRect();
      const x = e.clientX - (rect.left + rect.width / 2);
      const y = e.clientY - (rect.top + rect.height / 2);
      xTo(x * strength);
      yTo(y * strength);
      ixTo?.(x * strength * 0.45);
      iyTo?.(y * strength * 0.45);
    };
    const onLeave = () => {
      rect = null;
      xTo(0); yTo(0);
      ixTo?.(0); iyTo?.(0);
    };

    el.addEventListener('pointerenter', onEnter);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    cleanups.push(() => {
      el.removeEventListener('pointerenter', onEnter);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
      [xTo, yTo, ixTo, iyTo].forEach((fn) => fn?.tween.kill());
      gsap.set(inner ? [el, inner] : el, { clearProps: 'transform' });
    });
  });

  return () => cleanups.forEach((fn) => fn());
}

/** `.btn` circular fill grows from the point where the pointer enters / leaves. */
export function initButtonFills(root: ParentNode = document): () => void {
  const cleanups: Array<() => void> = [];

  root.querySelectorAll<HTMLElement>('.btn').forEach((btn) => {
    const setOrigin = (e: PointerEvent) => {
      const r = btn.getBoundingClientRect();
      btn.style.setProperty('--fx', `${e.clientX - r.left}px`);
      btn.style.setProperty('--fy', `${e.clientY - r.top}px`);
    };
    btn.addEventListener('pointerenter', setOrigin);
    btn.addEventListener('pointerleave', setOrigin);
    cleanups.push(() => {
      btn.removeEventListener('pointerenter', setOrigin);
      btn.removeEventListener('pointerleave', setOrigin);
    });
  });

  return () => cleanups.forEach((fn) => fn());
}

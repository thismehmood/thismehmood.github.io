'use client';

/* ==========================================================================
   Preloader (main.js §06 runPreloader)
   Counter 0 → 100 with the progress bar, a word cycle, then the exit:
   content rides up with the dark layer, revealing the lime layer, which
   wipes too. markRevealed() fires mid-exit so the hero intro overlaps it.
   The component unmounts its DOM when the timeline completes.
   ========================================================================== */

import { useRef, useState } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import { isStaticMode, prefersReducedMotion } from '@/lib/motion';
import { useApp } from '@/components/AppProvider';
import { site } from '@/lib/data';

/* UI copy (not resume content) */
const WORDS = ['Design', 'Build', 'Scale'] as const;
const CAPTION = ['Booting services', site.locationShort] as const;

/** Cap on how long we wait for web fonts before starting the count. */
const FONT_TIMEOUT = 2500;

export default function Preloader() {
  const { revealed, markRevealed } = useApp();
  const [done, setDone] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const numRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);

  useGSAP(() => {
    const pre = rootRef.current;
    const num = numRef.current;
    const bar = barRef.current;

    // Static fallback (CSS already hides the preloader) or remounted after the
    // hand-off (e.g. Fast Refresh): reveal straight away and render nothing.
    if (isStaticMode() || revealed || !pre || !num || !bar) {
      markRevealed();
      setDone(true);
      return;
    }

    const REDUCED = prefersReducedMotion();
    const words = gsap.utils.toArray<HTMLElement>('.preloader__word', pre);
    const counter = { v: 0 };
    const LOAD = REDUCED ? 0.4 : 2.6;

    // Built paused — it starts once the fonts are ready (see below)
    const tl = gsap.timeline({ paused: true, onComplete: () => setDone(true) });

    // Count 0 → 100 with the progress bar
    tl.to(counter, {
      v: 100,
      duration: LOAD,
      ease: 'power3.inOut',
      onUpdate: () => { num.textContent = String(Math.round(counter.v)); },
    }, 0)
      .to(bar, { scaleX: 1, duration: LOAD, ease: 'power3.inOut' }, 0);

    if (REDUCED) {
      // Reduced motion: show the last word, then a short fade — no full-screen wipes
      gsap.set(words.slice(0, -1), { opacity: 0 });
      gsap.set(words[words.length - 1], { opacity: 1, yPercent: 0 });
      tl.to(pre, { autoAlpha: 0, duration: 0.3 }, '+=0.1').add(markRevealed);
    } else {
      // Cycle the words: Design. → Build. → Scale.
      gsap.set(words, { yPercent: 105, opacity: 1 });
      const step = LOAD / words.length;
      words.forEach((w, i) => {
        tl.to(w, { yPercent: 0, duration: 0.45, ease: 'expo.out' }, i * step);
        if (i < words.length - 1) {
          tl.to(w, { yPercent: -105, duration: 0.35, ease: 'expo.in' }, (i + 1) * step - 0.35);
        }
      });

      // Exit: content rides up with the dark layer, revealing the lime layer, which wipes too
      tl.addLabel('exit', '+=0.15')
        .to('.preloader__inner', { yPercent: -30, opacity: 0, duration: 0.9, ease: 'expo.inOut' }, 'exit')
        .to('.preloader__layer--main', { yPercent: -100, duration: 1.1, ease: 'expo.inOut' }, 'exit')
        .to('.preloader__layer--accent', { yPercent: -100, duration: 1.1, ease: 'expo.inOut' }, 'exit+=0.18')
        .add(markRevealed, 'exit+=0.55');
    }

    // Start once the fonts are ready (no mid-count font swap), capped so a slow
    // font can't stall the page. next/font hashes family names, so wait on
    // document.fonts.ready rather than fonts.load('… Syne').
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const fontsReady = document.fonts?.ready
      ? Promise.race([
        document.fonts.ready.catch(() => undefined),
        new Promise<void>((resolve) => { timer = setTimeout(resolve, FONT_TIMEOUT); }),
      ])
      : Promise.resolve();
    fontsReady.then(() => {
      clearTimeout(timer);
      if (alive) tl.play(); // a reverted (killed) timeline would restart if played
    });

    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, { scope: rootRef });

  if (done) return null;

  return (
    <div className="preloader" aria-hidden="true" ref={rootRef}>
      <div className="preloader__layer preloader__layer--accent" />
      <div className="preloader__layer preloader__layer--main">
        <div className="preloader__inner">
          <div className="preloader__row">
            <span>{site.name}</span>
            <span>Portfolio &copy;{site.year}</span>
          </div>

          <div className="preloader__words">
            {WORDS.map((word) => (
              <span className="preloader__word" key={word}>{word}<em>.</em></span>
            ))}
          </div>

          <div className="preloader__bottom">
            <span className="preloader__caption">{CAPTION[0]}<br />{CAPTION[1]}</span>
            <div className="preloader__count">
              <span className="preloader__num" ref={numRef}>0</span>
              <span className="preloader__pct">%</span>
            </div>
          </div>
        </div>
        <span className="preloader__bar" ref={barRef} />
      </div>
    </div>
  );
}

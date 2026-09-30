'use client';

/* ==========================================================================
   Preloader — a terminal-style boot sequence.
   Mono log lines tick in (each gets a green "ok" once the next one starts),
   the MH monogram draws itself, and a large tabular counter runs 0 → 100%
   over a green progress hairline. Exit: the dark layer wipes up — a green
   hairline riding its leading edge — revealing a deep-green trail layer
   that wipes too (no bright flash). markRevealed() fires mid-exit so
   the hero intro overlaps it. Returning visitors (booted in this browser in
   the last 24h, stamped in localStorage) get a 0.9s count instead of 2.4s.
   Reduced motion: final state, quick count, short fade. The component
   unmounts its DOM when the timeline completes.
   ========================================================================== */

import { useRef, useState } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import { isStaticMode, prefersReducedMotion } from '@/lib/motion';
import { useApp } from '@/components/AppProvider';
import Monogram from '@/components/Monogram';
import { site } from '@/lib/data';

/* Boot log — generic UI copy (deliberately free of résumé facts) */
type LogLine = { cmd: string; total?: number };
const LOG: readonly LogLine[] = [
  { cmd: 'init runtime' },
  { cmd: 'loading agents', total: 8 },
  { cmd: 'connecting services' },
  { cmd: 'mounting interface' },
];

/** Cap on how long we wait for web fonts before starting the count. */
const FONT_TIMEOUT = 2500;

/** Count length: first visit / returning visitor (booted within BOOT_TTL, any tab) / reduced motion. */
const LOAD_FULL = 2.4;
const LOAD_RETURN = 0.9;
const LOAD_REDUCED = 0.4;
const BOOT_KEY = 'mh-boot';
const BOOT_TTL = 24 * 60 * 60 * 1000;

/** True when this browser finished the boot sequence in the last BOOT_TTL (storage may be blocked). */
function bootedRecently(): boolean {
  try {
    const at = Number(window.localStorage.getItem(BOOT_KEY)) || 0;
    return Date.now() - at < BOOT_TTL;
  } catch {
    return false;
  }
}
function rememberBoot() {
  try { window.localStorage.setItem(BOOT_KEY, String(Date.now())); } catch { /* storage blocked: full boot next time */ }
}

/** dmesg-style timestamp: [0.588] */
const stamp = (t: number) => `[${t.toFixed(3)}]`;

/** Length of the longest subpath of a path whose subpaths each start with an absolute "M". */
function longestSubpath(path: SVGPathElement): number {
  const svg = path.ownerSVGElement;
  const d = path.getAttribute('d') ?? '';
  if (!svg || !d) return 0;
  const probe = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  svg.appendChild(probe);
  let max = 0;
  try {
    d.split(/(?=M)/).forEach((sub) => {
      probe.setAttribute('d', sub);
      max = Math.max(max, probe.getTotalLength());
    });
  } catch {
    max = 0;
  } finally {
    probe.remove();
  }
  return Math.ceil(max) + 1;
}

export default function Preloader() {
  const { revealed, markRevealed } = useApp();
  const [done, setDone] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const numRef = useRef<HTMLSpanElement>(null);
  const padRef = useRef<HTMLSpanElement>(null);
  const fillRef = useRef<HTMLSpanElement>(null);

  useGSAP(() => {
    const pre = rootRef.current;
    const num = numRef.current;
    const pad = padRef.current;
    const fill = fillRef.current;

    // Static fallback (CSS already hides the preloader) or remounted after the
    // hand-off (e.g. Fast Refresh): reveal straight away and render nothing.
    if (isStaticMode() || revealed || !pre || !num || !pad || !fill) {
      markRevealed();
      setDone(true);
      return;
    }

    const REDUCED = prefersReducedMotion();
    const q = gsap.utils.selector(pre);
    const lines = q('.preloader__line') as HTMLElement[];
    const counter = { v: 0 };
    const LOAD = REDUCED ? LOAD_REDUCED : bootedRecently() ? LOAD_RETURN : LOAD_FULL;

    // Big counter: the number plus dim leading zeros ("007", "042", "100")
    let last = -1;
    const renderCount = () => {
      const v = Math.round(counter.v);
      if (v === last) return;
      last = v;
      const s = String(v);
      num.textContent = s;
      pad.textContent = '000'.slice(s.length);
    };

    // Built paused — it starts once the fonts are ready (see below)
    const tl = gsap.timeline({ paused: true, onComplete: () => { rememberBoot(); setDone(true); } });

    // Count 0 → 100 with the progress hairline — linear, in step with the line schedule
    tl.to(counter, { v: 100, duration: LOAD, ease: 'none', onUpdate: renderCount }, 0)
      .to(fill, { scaleX: 1, duration: LOAD, ease: 'none' }, 0);

    // Line schedule: the last line ("ready") lands as the count reaches 100
    const step = lines.length > 1 ? (LOAD - 0.05) / (lines.length - 1) : 0;
    // The per-line beats below are tuned for the full boot; the short returning-visitor boot
    // scales them down so each line still types, fills, counts and gets its "ok" in order.
    const beat = Math.min(1, (LOAD - 0.05) / (LOAD_FULL - 0.05));
    lines.forEach((line, i) => {
      const ts = line.querySelector('.preloader__ts');
      if (ts) ts.textContent = stamp(REDUCED ? 0 : i * step);
    });

    const mark = pre.querySelector<SVGSVGElement>('.preloader__mark');
    const edge = pre.querySelector<SVGPathElement>('.monogram__edge');
    const nodes = Array.from(pre.querySelectorAll<SVGElement>('.monogram__node'));
    const hot = pre.querySelector<SVGElement>('.monogram__node--hot');
    // Hidden by CSS until now so the server-rendered mark can't flash before its draw-in
    if (mark) gsap.set(mark, { visibility: 'visible' });

    if (REDUCED) {
      // Final state straight away — then a short fade, no full-screen wipes
      gsap.set(lines, { opacity: 1 });
      gsap.set(q('.preloader__ok'), { opacity: 1 });
      gsap.set(q('.preloader__leader'), { scaleX: 1 });
      q('.preloader__n').forEach((el) => { el.textContent = el.dataset.total ?? ''; });
      tl.to(pre, { autoAlpha: 0, duration: 0.3 }, '+=0.1').add(markRevealed);
    } else {
      /* --- Monogram draws itself over the load --- */
      if (edge) {
        // Dashes restart on every subpath (the M, the two H stems, the bar), so dash by the
        // longest one: every stroke draws from its own start and the last lands on 100%.
        const len = longestSubpath(edge);
        if (len > 0) {
          tl.fromTo(edge,
            { strokeDasharray: len, strokeDashoffset: len },
            { strokeDashoffset: 0, duration: LOAD * 0.85, ease: 'power2.inOut' }, 0.05);
        }
      }
      const plain = nodes.filter((n) => n !== hot);
      tl.fromTo(plain,
        { scale: 0, transformOrigin: '50% 50%' },
        { scale: 1, duration: 0.5, ease: 'back.out(2)', stagger: (LOAD * 0.7) / Math.max(plain.length, 1) }, 0.15);
      if (hot) {
        tl.fromTo(hot,
          { scale: 0, transformOrigin: '50% 50%' },
          { scale: 1, duration: 0.6, ease: 'back.out(3)' }, LOAD - 0.15);
      }

      /* --- Log lines tick in; each "ok" lands just before the next line --- */
      lines.forEach((line, i) => {
        const t = i * step;
        const cmd = line.querySelector('.preloader__cmd');
        const leader = line.querySelector('.preloader__leader');
        const ok = line.querySelector('.preloader__ok');
        const n = line.querySelector<HTMLElement>('.preloader__n');
        const next = (i + 1) * step;

        tl.set(line, { opacity: 1 }, t);
        if (cmd) {
          // Typed in: a stepped left-to-right reveal
          tl.fromTo(cmd,
            { clipPath: 'inset(0% 100% 0% 0%)' },
            { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.3 * beat, ease: 'steps(12)' }, t);
        }
        if (leader && i < lines.length - 1) {
          tl.fromTo(leader,
            { scaleX: 0 },
            { scaleX: 1, duration: Math.max(next - t - 0.4 * beat, 0.1 * beat), ease: 'power1.inOut' }, t + 0.25 * beat);
        }
        if (n) {
          const total = Number(n.dataset.total) || 0;
          const agents = { v: 0 };
          tl.to(agents, {
            v: total,
            duration: Math.max(next - t - 0.45 * beat, 0.1 * beat),
            ease: 'none',
            onUpdate: () => { n.textContent = String(Math.round(agents.v)); },
          }, t + 0.3 * beat);
        }
        if (ok) {
          tl.fromTo(ok,
            { opacity: 0, x: -4 },
            { opacity: 1, x: 0, duration: 0.25 * beat, ease: 'power2.out' }, next - 0.12 * beat);
        }
      });

      /* --- Exit: the dark layer wipes up (green hairline on its edge), the deep-green trail follows --- */
      tl.addLabel('exit', LOAD + 0.35)
        .to(q('.preloader__inner'), { yPercent: -6, opacity: 0, duration: 0.7, ease: 'power3.in' }, 'exit')
        .to(q('.preloader__edge'), { opacity: 1, duration: 0.25, ease: 'none' }, 'exit')
        .to(q('.preloader__layer--main'), { yPercent: -100, duration: 1.1, ease: 'expo.inOut' }, 'exit')
        .to(q('.preloader__layer--accent'), { yPercent: -100, duration: 1.1, ease: 'expo.inOut' }, 'exit+=0.1')
        .add(markRevealed, 'exit+=0.55');
    }

    // Start once the fonts are ready (no mid-count font swap), capped so a slow
    // font can't stall the page. next/font hashes family names, so wait on
    // document.fonts.ready rather than fonts.load('… Bricolage').
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
        <div className="gridlines" />

        <div className="preloader__inner">
          <div className="preloader__row">
            <span>{site.name}</span>
            <span>Portfolio &copy;{site.year}</span>
          </div>

          <div className="preloader__boot">
            <Monogram className="preloader__mark" />
            <ol className="preloader__log">
              {LOG.map((line) => (
                <li className="preloader__line" key={line.cmd}>
                  <span className="preloader__ts">{stamp(0)}</span>
                  <span className="preloader__cmd">
                    <span className="preloader__caret">&rsaquo;</span>
                    {line.cmd}
                    {line.total ? (
                      <> <span className="preloader__n" data-total={line.total}>0</span>/{line.total}</>
                    ) : null}
                  </span>
                  <span className="preloader__leader" />
                  <span className="preloader__ok">ok</span>
                </li>
              ))}
              <li className="preloader__line preloader__line--ready">
                <span className="preloader__ts">{stamp(0)}</span>
                <span className="preloader__cmd">
                  <span className="preloader__caret">&rsaquo;</span>ready
                </span>
                <span className="preloader__cursor" />
              </li>
            </ol>
          </div>

          <div className="preloader__foot">
            <div className="preloader__bottom">
              <span className="preloader__caption">
                <span className="preloader__caption-dot" />Boot sequence<br />{site.locationShort}
              </span>
              <div className="preloader__count">
                <span className="preloader__pad" ref={padRef}>00</span>
                <span className="preloader__num" ref={numRef}>0</span>
                <span className="preloader__pct">%</span>
              </div>
            </div>
            <span className="preloader__bar"><span className="preloader__fill" ref={fillRef} /></span>
          </div>
        </div>

        <span className="preloader__edge" />
      </div>
    </div>
  );
}

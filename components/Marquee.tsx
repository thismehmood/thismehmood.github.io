'use client';

/* ==========================================================================
   Marquee — a slim schematic run-log between hairlines: one mono row of
   capability terms, uppercase, separated by ring nodes (the hero mesh's
   agent nodes). The loop's direction & speed follow scroll direction /
   velocity. Each track renders its group twice (the copy is aria-hidden) so
   wrapping at -50% is seamless, and each group repeats its items so one
   group is always wider than the viewport. Runs on gsap.ticker only while
   the marquee is in view; nothing moves for reduced motion / static mode.
   ========================================================================== */

import { Fragment, useRef } from 'react';
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { isStaticMode, prefersReducedMotion } from '@/lib/motion';
import { marqueeRows } from '@/lib/data';

/** Passes of the item list per group: small mono items need several to span wide screens. */
const REPEAT = 3;

function MarqueeGroup({ items, copy = false }: { items: readonly string[]; copy?: boolean }) {
  return (
    <div className="marquee__group" aria-hidden={copy ? 'true' : undefined}>
      {Array.from({ length: REPEAT }, (_, pass) => (
        <Fragment key={pass}>
          {items.map((item) => (
            <Fragment key={item}>
              {/* only the first pass of the first group is read out */}
              <span className="marquee__item" aria-hidden={pass > 0 && !copy ? 'true' : undefined}>{item}</span>
              <span className="marquee__sep marquee__sep--node" aria-hidden="true" />
            </Fragment>
          ))}
        </Fragment>
      ))}
    </div>
  );
}

export default function Marquee() {
  const rootRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const root = rootRef.current;
    if (!root || isStaticMode() || prefersReducedMotion()) return;

    const tracks = Array.from(root.querySelectorAll<HTMLElement>('[data-marquee]'));
    if (!tracks.length) return;

    const rows = tracks.map((track) => ({
      set: gsap.quickSetter(track, 'xPercent') as (value: number) => void,
      dir: parseFloat(track.dataset.marquee ?? '') || -1,
      x: -25,
    }));
    // Start mid-loop so the first frame doesn't jump from 0 to -25%
    rows.forEach((r) => r.set(r.x));

    const wrap = gsap.utils.wrap(-50, 0);
    const BASE = 0.022; // % of track per frame @60fps
    let boost = 0;
    let scrollDir = 1;
    let active = false;

    ScrollTrigger.create({
      trigger: root,
      start: 'top bottom',
      end: 'bottom top',
      onToggle: (self) => { active = self.isActive; },
      onUpdate: (self) => {
        scrollDir = self.direction;
        boost = Math.min(Math.abs(self.getVelocity()) / 9000, 0.4);
      },
    });

    const tick = () => {
      if (!active) return;
      const dt = gsap.ticker.deltaRatio(60);
      rows.forEach((r) => {
        r.x = wrap(r.x + (BASE + boost) * r.dir * scrollDir * dt);
        r.set(r.x);
      });
      boost *= Math.pow(0.93, dt);
    };
    gsap.ticker.add(tick);

    return () => {
      gsap.ticker.remove(tick);
      // quickSetter writes aren't tweens, so the context can't revert them
      gsap.set(tracks, { clearProps: 'transform' });
    };
  }, { scope: rootRef });

  return (
    <div className="marquee" ref={rootRef}>
      <div className="marquee__frame">
        {marqueeRows.map((row, i) => (
          <div className="marquee__band" key={i}>
            <div className="marquee__track" data-marquee={row.dir}>
              <MarqueeGroup items={row.items} />
              <MarqueeGroup items={row.items} copy />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

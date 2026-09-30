'use client';

/* ==========================================================================
   Footer — the name in outline type with a green fill that wipes in on
   scroll (GSAP scrubs --clip), the monogram above Lahore's coordinates, a
   tick ruler and the meta row.
   Reduced motion / static fallback: skipped, the CSS shows the fill complete.
   ========================================================================== */

import { useEffect, useRef, useState } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import { isStaticMode, prefersReducedMotion } from '@/lib/motion';
import { site } from '@/lib/data';
import Monogram from '@/components/Monogram';

const bigLines = [site.firstName, site.lastName.join(' ')] as const;

/** Lahore, Pakistan */
const COORDS = '31.5204° N, 74.3587° E';

export default function Footer() {
  const rootRef = useRef<HTMLElement>(null);
  // Prerendered with site.year; corrected to the visitor's year after mount
  const [year, setYear] = useState<number>(site.year);
  useEffect(() => setYear(new Date().getFullYear()), []);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root || prefersReducedMotion() || isStaticMode()) return;

      gsap.utils.toArray<HTMLElement>('.footer__line', root).forEach((line, i) => {
        gsap.fromTo(line, { '--clip': '100%' }, {
          '--clip': '0%',
          ease: 'none',
          scrollTrigger: {
            trigger: root,
            start: `top ${85 - i * 10}%`,
            end: 'bottom bottom',
            scrub: true,
          },
        });
      });
    },
    { scope: rootRef },
  );

  return (
    <footer className="footer" ref={rootRef}>
      <div className="container">
        <div className="footer__lockup">
          {/* The name is repeated as text in the row below, so the display lines are decorative */}
          <span className="footer__line footer__line--1" data-text={bigLines[0]} aria-hidden="true">
            {bigLines[0]}
          </span>
          <div className="footer__meta">
            <Monogram className="footer__mark" />
            <div className="footer__meta-text">
              <p className="footer__coords">{COORDS}</p>
              <p className="footer__role">{site.title}</p>
            </div>
          </div>
          <span className="footer__line footer__line--2" data-text={bigLines[1]} aria-hidden="true">
            {bigLines[1]}
          </span>
        </div>

        <div className="footer__ruler" aria-hidden="true" />

        <div className="footer__row">
          <span className="footer__copy">
            &copy; {year} · {site.name} · {site.location}
          </span>
          <span className="footer__built">Built with Next.js, GSAP &amp; Lenis</span>
          <a href="#top" className="to-top" data-magnetic="0.4">
            <span className="to-top__inner" data-magnetic-inner>
              Back to top
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 19V5M6 11l6-6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </a>
        </div>
      </div>
    </footer>
  );
}

'use client';

/* ==========================================================================
   Footer — outline name with a lime fill that wipes in on scroll
   Port of index.html footer + main.js §13 (footer --clip scrub).
   Reduced motion / static fallback: skipped, the CSS shows the fill complete.
   ========================================================================== */

import { useEffect, useRef, useState } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import { isStaticMode, prefersReducedMotion } from '@/lib/motion';
import { site } from '@/lib/data';

const bigLines = [site.firstName, site.lastName.join(' ')];

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
      <div className="footer__big" aria-hidden="true">
        {bigLines.map((text) => (
          <span className="footer__line" data-text={text} key={text}>
            {text}
          </span>
        ))}
      </div>
      <div className="container footer__row">
        <span>
          &copy; {year} {site.name} · {site.location}
        </span>
        <span className="footer__built">Built with GSAP, ScrollTrigger &amp; Lenis</span>
        <a href="#top" className="to-top" data-magnetic="0.4">
          <span data-magnetic-inner>Back to top ↑</span>
        </a>
      </div>
    </footer>
  );
}

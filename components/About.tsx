'use client';

/* ==========================================================================
   01 — ABOUT
   Scroll-lit statement (words go from --dim to --text; the emphasised phrase
   lights up green), profile copy, and the stats as a framed readout whose
   numbers count up.

   The statement is lit through a `--lit` custom property (0 → 1) that the CSS
   mixes between two tokens, so no colour values live in JS. Without it
   (reduced motion, static fallback, no JS) `--lit` falls back to 1: fully lit.
   ========================================================================== */

import { useRef } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import { isStaticMode, prefersReducedMotion } from '@/lib/motion';
import { countUp, revealOnScroll } from '@/lib/animations';
import { about, sections, stats } from '@/lib/data';
import SplitText from '@/components/SplitText';
import Corners from '@/components/Corners';

const pad = (n: number) => String(n).padStart(2, '0');

export default function About() {
  const rootRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    const root = rootRef.current;
    // Reduced motion / static fallback: nothing hidden, counters keep their final values (rendered in JSX)
    if (!root || isStaticMode() || prefersReducedMotion()) return;

    // Fade-up for [data-reveal]
    revealOnScroll(Array.from(root.querySelectorAll('[data-reveal]')));

    // Statement: each word is lit in reading order as you scroll. Unlit words sit at --dim
    // (≥3:1 for this large text), lit words at --text, the <em> phrase at the accent.
    const statement = root.querySelector('.about__text');
    if (statement) {
      gsap.fromTo(statement.querySelectorAll('.word'), { '--lit': 0 }, {
        '--lit': 1,
        stagger: 0.05,
        ease: 'none',
        scrollTrigger: { trigger: statement, start: 'top 80%', end: 'bottom 45%', scrub: true },
      });
    }

    // Stat counters (countUp writes textContent imperatively — put the final value back on revert)
    const counters = Array.from(root.querySelectorAll<HTMLElement>('.js-count'));
    counters.forEach((el) => countUp(el, parseFloat(el.dataset.count || '') || 0));

    return () => {
      counters.forEach((el) => { el.textContent = el.dataset.count ?? ''; });
    };
  }, { scope: rootRef });

  return (
    <section className="about section" id="about" ref={rootRef}>
      <div className="container">
        <h2 className="section-label" data-reveal=""><span className="num">{sections.about.num}</span> {sections.about.label}</h2>

        <div className="about__statement">
          <span className="about__lead" aria-hidden="true" />
          <SplitText as="p" type="words" parts={about.statement} className="about__text" />
        </div>

        <div className="about__grid">
          <p className="about__note mono" data-reveal="" aria-hidden="true">
            <span className="about__note-node" />Profile
          </p>

          <div className="about__copy">
            {about.paragraphs.map((text, i) => (
              <p data-reveal="" key={i}>{text}</p>
            ))}
            <a href="#experience" className="link-arrow" data-reveal="">
              <span>{sections.about.link}</span>
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M7 17 17 7M8 7h9v9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </div>

          <div className="about__readout">
            <div className="readout__head mono" data-reveal="" aria-hidden="true">
              <span className="readout__title"><span className="readout__node" />Readout</span>
              <span className="readout__meta">{`${pad(stats.length)} / metrics`}</span>
            </div>
            <ul className="stats">
              {stats.map((stat, i) => (
                <li className="stat" data-reveal="" key={stat.label}>
                  <Corners />
                  <span className="stat__index mono" aria-hidden="true">{pad(i + 1)}</span>
                  <span className="stat__num" aria-hidden="true">
                    {stat.prefix && <span className="accent stat__approx">{stat.prefix}</span>}
                    <span className="js-count" data-count={stat.value}>{stat.value}</span>
                    {stat.suffix && <span className="accent stat__suffix">{stat.suffix}</span>}
                  </span>
                  <span className="sr-only">{stat.srText}</span>
                  <span className="stat__label">{stat.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

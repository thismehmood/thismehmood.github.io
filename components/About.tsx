'use client';

/* ==========================================================================
   01 — ABOUT
   Statement words light up on scroll, copy fades up, stats count up.
   (main.js §09 — the parts that apply to this section)
   ========================================================================== */

import { useRef } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import { isStaticMode, prefersReducedMotion } from '@/lib/motion';
import { countUp, revealOnScroll } from '@/lib/animations';
import { about, sections, stats } from '@/lib/data';
import SplitText from '@/components/SplitText';

/** Opacity of the statement's not-yet-lit words. */
const UNLIT_OPACITY = 0.45;

export default function About() {
  const rootRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    const root = rootRef.current;
    // Reduced motion / static fallback: nothing hidden, counters keep their final values (rendered in JSX)
    if (!root || isStaticMode() || prefersReducedMotion()) return;

    // Fade-up for [data-reveal]
    revealOnScroll(Array.from(root.querySelectorAll('[data-reveal]')));

    // Statement: words brighten as you scroll. Unlit words stay readable (≥3:1 for this
    // large text in both themes) — at the original 0.12 they vanished on the dark background.
    // The emphasised phrase (<em>) is always fully lit.
    const statement = root.querySelector('.about__text');
    if (statement) {
      const words = Array.from(statement.querySelectorAll('.word')).filter((w) => !w.closest('em'));
      gsap.fromTo(words, { opacity: UNLIT_OPACITY }, {
        opacity: 1,
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

        <SplitText as="p" type="words" parts={about.statement} className="about__text" />

        <div className="about__grid">
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

          <ul className="stats">
            {stats.map((stat) => (
              <li className="stat" data-reveal="" key={stat.label}>
                <span className="stat__num" aria-hidden="true">
                  {stat.prefix && <span className="accent stat__approx">{stat.prefix}</span>}
                  <span className="js-count" data-count={stat.value}>{stat.value}</span>
                  {stat.suffix && <span className="accent">{stat.suffix}</span>}
                </span>
                <span className="sr-only">{stat.srText}</span>
                <span className="stat__label">{stat.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

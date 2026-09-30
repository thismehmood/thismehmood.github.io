'use client';

/* ==========================================================================
   02 — SKILLS / STACK
   Staggered 3D card reveal + chip stagger, cursor spotlight (--mx / --my).
   (main.js §09 heading/reveals + §10 initSkills)
   ========================================================================== */

import { useRef, type PointerEvent, type ReactNode } from 'react';
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { isStaticMode, prefersReducedMotion } from '@/lib/motion';
import { revealOnScroll, revealWords } from '@/lib/animations';
import { featuredCert, sections, skillGroups, type SkillIcon } from '@/lib/data';
import SplitText from '@/components/SplitText';

/* Icon artwork, exactly as in the static site (48×48, stroke = currentColor) */
const ICONS: Record<SkillIcon, ReactNode> = {
  code: (
    <path d="M17 14 7 24l10 10M31 14l10 10-10 10M27 10l-6 28" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  ),
  server: (
    <>
      <rect x="7" y="8" width="34" height="12" rx="3" stroke="currentColor" strokeWidth="2.5" />
      <rect x="7" y="28" width="34" height="12" rx="3" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="14" cy="14" r="2" fill="currentColor" />
      <circle cx="14" cy="34" r="2" fill="currentColor" />
    </>
  ),
  database: (
    <>
      <ellipse cx="24" cy="11" rx="15" ry="5" stroke="currentColor" strokeWidth="2.5" />
      <path d="M9 11v13c0 2.8 6.7 5 15 5s15-2.2 15-5V11M9 24v13c0 2.8 6.7 5 15 5s15-2.2 15-5V24" stroke="currentColor" strokeWidth="2.5" />
    </>
  ),
  network: (
    <>
      <circle cx="10" cy="24" r="4" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="38" cy="10" r="4" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="38" cy="38" r="4" stroke="currentColor" strokeWidth="2.5" />
      <path d="M14 22 34 12M14 26l20 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </>
  ),
  cloud: (
    <path d="M14 36h21a8 8 0 0 0 1.4-15.9A11 11 0 0 0 15.1 18 9 9 0 0 0 14 36Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
  ),
  pipeline: (
    <>
      <circle cx="9" cy="24" r="4" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="24" cy="24" r="4" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="39" cy="24" r="4" stroke="currentColor" strokeWidth="2.5" />
      <path d="M13 24h7M28 24h7" stroke="currentColor" strokeWidth="2.5" />
    </>
  ),
  sparkle: (
    <>
      <path d="M24 6c1.4 9.6 5 13.2 14.6 14.6C29 22 25.4 25.6 24 35.2 22.6 25.6 19 22 9.4 20.6 19 19.2 22.6 15.6 24 6Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M37 32c.5 3.3 1.7 4.5 5 5-3.3.5-4.5 1.7-5 5-.5-3.3-1.7-4.5-5-5 3.3-.5 4.5-1.7 5-5Z" fill="currentColor" />
    </>
  ),
};

/* Spotlight follows the pointer (CSS reads --mx / --my). Inline custom properties only —
   the card's JSX has no `style` prop, so React never overwrites them. */
function onCardPointerMove(e: PointerEvent<HTMLElement>) {
  const card = e.currentTarget;
  const r = card.getBoundingClientRect();
  card.style.setProperty('--mx', `${e.clientX - r.left}px`);
  card.style.setProperty('--my', `${e.clientY - r.top}px`);
}

export default function Skills() {
  const rootRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    const root = rootRef.current;
    if (!root || isStaticMode() || prefersReducedMotion()) return;

    revealOnScroll(Array.from(root.querySelectorAll('[data-reveal]')));
    revealWords(root.querySelector('.section-title'));

    const cards = Array.from(root.querySelectorAll<HTMLElement>('.skill-card'));
    if (!cards.length) return;

    gsap.set(cards, { opacity: 0, y: 90, rotateX: -18, transformOrigin: '50% 100%' });
    ScrollTrigger.batch(cards, {
      start: 'top 90%',
      once: true,
      onEnter: (batch) => {
        gsap.to(batch, {
          opacity: 1, y: 0, rotateX: 0, duration: 1.2, ease: 'expo.out', stagger: 0.1, overwrite: true,
        });
        gsap.from(batch.flatMap((c) => Array.from(c.querySelectorAll('.chip'))), {
          opacity: 0, y: 14, duration: 0.6, ease: 'power3.out', stagger: 0.02, delay: 0.3,
        });
      },
    });
  }, { scope: rootRef });

  return (
    <section className="skills section" id="skills" ref={rootRef}>
      <div className="container">
        <div className="skills__head">
          <div>
            <p className="section-label" data-reveal=""><span className="num">{sections.skills.num}</span> {sections.skills.label}</p>
            <SplitText as="h2" type="words" mask text={sections.skills.title} className="section-title" />
          </div>
          <p className="skills__intro" data-reveal="">{sections.skills.intro}</p>
        </div>

        <div className="skills__grid">
          {skillGroups.map((group, i) => (
            <article className="skill-card" key={group.title} onPointerMove={onCardPointerMove}>
              <div className="skill-card__head">
                <span className="skill-card__index">{String(i + 1).padStart(2, '0')}</span>
                <svg className="skill-card__icon" viewBox="0 0 48 48" fill="none" aria-hidden="true">
                  {ICONS[group.icon]}
                </svg>
              </div>
              <h3 className="skill-card__title">{group.title}</h3>
              <ul className="chips">
                {group.items.map((item, j) => <li className="chip" key={j}>{item}</li>)}
              </ul>
            </article>
          ))}

          <article className="skill-card skill-card--feature" onPointerMove={onCardPointerMove}>
            <div className="skill-card__head">
              <span className="skill-card__index">✦</span>
              <span className="skill-card__stamp">{featuredCert.date}</span>
            </div>
            <h3 className="skill-card__title">{featuredCert.title}</h3>
            <p className="skill-card__text">{featuredCert.text}</p>
            <ul className="chips">
              {featuredCert.items.map((item, j) => <li className="chip" key={j}>{item}</li>)}
            </ul>
          </article>
        </div>
      </div>
    </section>
  );
}

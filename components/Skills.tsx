'use client';

/* ==========================================================================
   02 — SKILLS / STACK
   3 × 3 grid of bracketed cards: eight skill groups (AI & Automation first,
   marked as the current focus) + the CKAD card. Staggered 3D batch reveal +
   chip stagger, cursor spotlight (--mx / --my).
   ========================================================================== */

import { useRef, type PointerEvent, type ReactNode } from 'react';
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { isStaticMode, prefersReducedMotion } from '@/lib/motion';
import { revealOnScroll, revealWords } from '@/lib/animations';
import { featuredCert, sections, skillGroups, type SkillIcon } from '@/lib/data';
import SplitText from '@/components/SplitText';
import Corners from '@/components/Corners';

/* Line icons (48×48). Stroke / fill use currentColor (green via .skill-card__icon);
   stroke width, caps and joins come from the CSS. `.icon-hot` marks the one live node. */
const ICONS: Record<SkillIcon, ReactNode> = {
  // Orchestrator core with four agents
  agent: (
    <>
      <circle cx="24" cy="24" r="6.5" />
      <circle className="icon-hot" cx="24" cy="24" r="2.25" />
      <circle cx="9" cy="10" r="3.5" />
      <circle cx="39" cy="10" r="3.5" />
      <circle cx="9" cy="38" r="3.5" />
      <circle cx="39" cy="38" r="3.5" />
      <path d="M19.2 19.6 11.6 12.4M28.8 19.6l7.6-7.2M19.2 28.4l-7.6 7.2M28.8 28.4l7.6 7.2" />
    </>
  ),
  code: (
    <>
      <path d="M16 15 7 24l9 9M32 15l9 9-9 9" />
      <path d="M27 11l-6 26" />
    </>
  ),
  server: (
    <>
      <rect x="7" y="8" width="34" height="13" rx="2" />
      <rect x="7" y="27" width="34" height="13" rx="2" />
      <circle className="icon-hot" cx="14" cy="14.5" r="2" />
      <circle className="icon-fill" cx="14" cy="33.5" r="2" />
      <path d="M22 14.5h13M22 33.5h13" />
    </>
  ),
  database: (
    <>
      <ellipse cx="24" cy="11" rx="15" ry="5" />
      <path d="M9 11v13c0 2.8 6.7 5 15 5s15-2.2 15-5V11M9 24v13c0 2.8 6.7 5 15 5s15-2.2 15-5V24" />
    </>
  ),
  // Two opposing message streams
  network: (
    <>
      <path d="M7 17h30M31 11l6 6-6 6" />
      <path d="M41 31H11M17 25l-6 6 6 6" />
      <circle className="icon-hot" cx="24" cy="17" r="2" />
    </>
  ),
  cloud: (
    <path d="M14 36h21a8 8 0 0 0 1.4-15.9A11 11 0 0 0 15.1 18 9 9 0 0 0 14 36Z" />
  ),
  pipeline: (
    <>
      <circle cx="9" cy="24" r="4" />
      <circle cx="24" cy="24" r="4" />
      <circle cx="39" cy="24" r="4" />
      <circle className="icon-hot" cx="24" cy="24" r="1.6" />
      <path d="M13 24h7M28 24h7" />
    </>
  ),
  // Browser window: toolbar with one live light, a component block and text lines
  frontend: (
    <>
      <rect x="6" y="8" width="36" height="32" rx="2" />
      <path d="M6 16h36" />
      <circle className="icon-hot" cx="11" cy="12" r="1.6" />
      <circle className="icon-fill" cx="16" cy="12" r="1.6" />
      <circle className="icon-fill" cx="21" cy="12" r="1.6" />
      <rect x="12" y="22" width="11" height="12" rx="1" />
      <path d="M29 24h7M29 29h7M29 34h4" className="icon-dim" />
    </>
  ),
  // Blueprint: a layout frame split into modules
  blueprint: (
    <>
      <rect x="8" y="8" width="32" height="32" rx="1.5" />
      <path d="M8 20h32M20 20v20" />
      <path d="M26 27h8M26 33h5" className="icon-dim" />
      <circle className="icon-hot" cx="20" cy="20" r="2.25" />
    </>
  ),
};

/* Seal for the certification card */
const SEAL: ReactNode = (
  <>
    <circle cx="24" cy="19" r="12" />
    <path d="m18.5 19 3.8 3.8 7.2-7.6" />
    <path d="M17 29.5 14 42l10-5 10 5-3-12.5" />
  </>
);

const pad = (n: number) => String(n).padStart(2, '0');

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
          <div className="skills__heading">
            <p className="section-label" data-reveal=""><span className="num">{sections.skills.num}</span> {sections.skills.label}</p>
            <SplitText as="h2" type="words" mask text={sections.skills.title} className="section-title" />
          </div>
          <p className="skills__intro" data-reveal="">{sections.skills.intro}</p>
        </div>

        <div className="skills__grid">
          {skillGroups.map((group, i) => {
            const primary = i === 0; // AI & Automation — the current focus
            return (
              <article
                className={primary ? 'skill-card skill-card--primary' : 'skill-card'}
                key={group.title}
                onPointerMove={onCardPointerMove}
              >
                <Corners accent={primary} />
                <div className="skill-card__head">
                  <span className="skill-card__index">{pad(i + 1)}</span>
                  {primary ? (
                    <span className="status skill-card__status"><span className="pulse-dot" aria-hidden="true" />Current focus</span>
                  ) : (
                    <span className="skill-card__rule" aria-hidden="true" />
                  )}
                  <svg className="skill-card__icon" viewBox="0 0 48 48" fill="none" stroke="currentColor" aria-hidden="true">
                    {ICONS[group.icon]}
                  </svg>
                </div>
                <h3 className="skill-card__title">{group.title}</h3>
                <ul className="chips">
                  {group.items.map((item, j) => <li className="chip" key={j}>{item}</li>)}
                </ul>
              </article>
            );
          })}

          <article className="skill-card skill-card--feature" onPointerMove={onCardPointerMove}>
            <Corners />
            <div className="skill-card__head">
              <span className="skill-card__index">{pad(skillGroups.length + 1)}</span>
              <span className="skill-card__stamp">{featuredCert.date}</span>
              <svg className="skill-card__icon" viewBox="0 0 48 48" fill="none" stroke="currentColor" aria-hidden="true">{SEAL}</svg>
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

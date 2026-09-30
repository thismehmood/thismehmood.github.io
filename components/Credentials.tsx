'use client';

/* ==========================================================================
   05 — Credentials & interests
   Port of index.html §05 + main.js §09 (reveals) and §13 (football spin).
   ========================================================================== */

import { useRef } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import { isStaticMode, prefersReducedMotion } from '@/lib/motion';
import { revealOnScroll, revealWords } from '@/lib/animations';
import { credentials, interest, sections, type Credential } from '@/lib/data';
import SplitText from '@/components/SplitText';
import RichText from '@/components/RichText';

const pad = (n: number) => String(n).padStart(2, '0');

function CredArrow() {
  return (
    <svg className="cred__arrow" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 17 17 7M8 7h9v9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/*
 * The `{' '}` separators mirror the whitespace in the original markup: they are
 * not rendered inside the grid row, but keep the link's accessible name readable
 * ("… Certification — View certificate …" rather than "…Certification— View…").
 */
function CredRow({ cred, index }: { cred: Credential; index: number }) {
  const inner = (
    <>
      <span className="cred__num">{pad(index + 1)}</span>{' '}
      <div className="cred__main">
        <h3 className="cred__title">{cred.title}</h3>{' '}
        <p className="cred__issuer">{cred.issuer}</p>
      </div>{' '}
      <span className="cred__tag">{cred.tag}</span>{' '}
    </>
  );

  if (cred.href) {
    return (
      <a className="cred" href={cred.href} target="_blank" rel="noopener noreferrer">
        {inner}
        <CredArrow />{' '}
        <span className="sr-only">— {cred.linkLabel ?? 'View credential'} (opens in a new tab)</span>
      </a>
    );
  }

  return (
    <div className="cred">
      {inner}
      <span className="cred__arrow" aria-hidden="true" />
    </div>
  );
}

export default function Credentials() {
  const rootRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const root = rootRef.current;
      // Reveals are skipped for reduced motion (content stays visible) and in the static fallback
      if (!root || prefersReducedMotion() || isStaticMode()) return;

      revealOnScroll(Array.from(root.querySelectorAll('[data-reveal]')));
      revealWords(root.querySelector('.section-title'));

      // Football spins with scroll
      gsap.to('.interest__ball', {
        rotate: 360,
        ease: 'none',
        scrollTrigger: { trigger: root, start: 'top bottom', end: 'bottom top', scrub: 1 },
      });
    },
    { scope: rootRef },
  );

  return (
    <section className="creds section" id="credentials" ref={rootRef}>
      <div className="container">
        <p className="section-label" data-reveal>
          <span className="num">{sections.credentials.num}</span> {sections.credentials.label}
        </p>
        <SplitText as="h2" type="words" mask className="section-title" text={sections.credentials.title} />

        <div className="creds__grid">
          <ul className="creds__list">
            {credentials.map((cred, i) => (
              <li data-reveal key={cred.title}>
                <CredRow cred={cred} index={i} />
              </li>
            ))}
          </ul>

          <aside className="interest" data-reveal>
            <svg className="interest__ball" viewBox="0 0 100 100" fill="none" aria-hidden="true">
              <circle cx="50" cy="50" r="46" stroke="currentColor" strokeWidth="3" />
              <path d="M50 30 62 39 57.5 53h-15L38 39Z" fill="currentColor" />
              <path
                d="M50 30V8M62 39l20-7M57.5 53l12 17M42.5 53l-12 17M38 39l-20-7M69.5 70 64 92M30.5 70 36 92M82 32l12 18M18 32 6 50"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
            <p className="interest__label">{interest.label}</p>
            <h3 className="interest__title">{interest.title}</h3>
            <p className="interest__text">
              <RichText parts={interest.text} />
            </p>
          </aside>
        </div>
      </div>
    </section>
  );
}

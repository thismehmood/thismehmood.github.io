'use client';

/* ==========================================================================
   03 — EXPERIENCE (sticky side + scroll timeline)
   Progress line scrub, active entry, sticky counter + company swap.
   (main.js §09 heading/reveals + §11 initExperience)

   Imperative DOM owned here (JSX kept constant so React never fights it):
   - `.entry` gets `is-active` via classList (className is always "entry")
   - `.experience__current` / `.experience__company` text is swapped by GSAP
   Both are reset in the useGSAP cleanup.
   ========================================================================== */

import { useRef } from 'react';
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { isStaticMode, prefersReducedMotion } from '@/lib/motion';
import { revealOnScroll, revealWords } from '@/lib/animations';
import { experience, sections } from '@/lib/data';
import SplitText from '@/components/SplitText';

const pad = (n: number) => String(n).padStart(2, '0');
const labelAt = (i: number) => experience[i]?.counterLabel ?? '';

export default function Experience() {
  const rootRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    const root = rootRef.current;
    if (!root || isStaticMode()) return;

    const reduced = prefersReducedMotion();

    if (!reduced) {
      revealOnScroll(Array.from(root.querySelectorAll('[data-reveal]')));
      revealWords(root.querySelector('.section-title'));
    }

    const entries = Array.from(root.querySelectorAll<HTMLElement>('.entry'));
    if (!entries.length) return;

    const current = root.querySelector<HTMLElement>('.experience__current');
    const company = root.querySelector<HTMLElement>('.experience__company');
    let activeIndex = 0;
    let swapTl: gsap.core.Timeline | null = null;

    const writeCounter = (i: number) => {
      if (current) current.textContent = pad(i + 1);
      if (company) company.textContent = labelAt(i);
    };

    const setActive = (i: number) => {
      if (i === activeIndex || !current || !company) return;
      const dir = i > activeIndex ? 1 : -1;
      activeIndex = i;
      if (reduced) {
        writeCounter(i);
        return;
      }
      swapTl?.kill();
      swapTl = gsap.timeline()
        .to([current, company], { yPercent: -100 * dir, opacity: 0, duration: 0.25, ease: 'power2.in' })
        .add(() => writeCounter(i))
        .fromTo([current, company], { yPercent: 100 * dir, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.5, ease: 'expo.out' });
    };

    // Timeline progress line
    const timeline = root.querySelector('.timeline');
    const progress = root.querySelector('.timeline__progress');
    if (timeline && progress) {
      gsap.fromTo(progress, { scaleY: 0 }, {
        scaleY: 1,
        ease: 'none',
        scrollTrigger: { trigger: timeline, start: 'top 55%', end: 'bottom 55%', scrub: true },
      });
    }

    entries.forEach((entry, i) => {
      if (!reduced) {
        gsap.from(entry.querySelectorAll('.entry__head, .entry__role, .entry__company, .entry__points li, .chips'), {
          y: 40,
          opacity: 0,
          duration: 1,
          ease: 'expo.out',
          stagger: 0.06,
          scrollTrigger: { trigger: entry, start: 'top 85%', once: true },
        });
      }

      ScrollTrigger.create({
        trigger: entry,
        start: 'top 55%',
        end: 'bottom 55%',
        onToggle: (self) => {
          entry.classList.toggle('is-active', self.isActive);
          if (self.isActive) setActive(i);
        },
      });
    });

    // Runs after the context has reverted its tweens/triggers: undo the imperative DOM writes
    return () => {
      swapTl = null;
      entries.forEach((entry) => entry.classList.remove('is-active'));
      writeCounter(0);
    };
  }, { scope: rootRef });

  return (
    <section className="experience section" id="experience" ref={rootRef}>
      <div className="container experience__grid">
        <aside className="experience__aside">
          <div className="experience__sticky">
            <p className="section-label" data-reveal=""><span className="num">{sections.experience.num}</span> {sections.experience.label}</p>
            <SplitText as="h2" type="words" mask text={sections.experience.title} className="section-title" />
            <p className="experience__intro" data-reveal="">{sections.experience.intro}</p>
            <div className="experience__counter" data-reveal="" aria-hidden="true">
              <span className="experience__current-wrap"><span className="experience__current">{pad(1)}</span></span>
              <span className="experience__total">{`/ ${pad(experience.length)}`}</span>
            </div>
            <div className="experience__company-wrap" aria-hidden="true">
              <span className="experience__company">{labelAt(0)}</span>
            </div>
          </div>
        </aside>

        <div className="timeline">
          <div className="timeline__track" aria-hidden="true"><span className="timeline__progress" /></div>
          <ol className="timeline__list">
            {experience.map((role) => (
              <li className="entry" key={`${role.company}-${role.dates}`}>
                <span className="entry__dot" aria-hidden="true" />
                <div className="entry__head">
                  <span className="entry__date">{role.dates}</span>
                  <span>{role.location}</span>
                </div>
                <h3 className="entry__role">{role.role}</h3>
                <p className="entry__company">{role.company}</p>
                <ul className="entry__points">
                  {role.points.map((point, j) => <li key={j}>{point}</li>)}
                </ul>
                <ul className="chips chips--sm">
                  {role.stack.map((item, j) => <li className="chip" key={j}>{item}</li>)}
                </ul>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

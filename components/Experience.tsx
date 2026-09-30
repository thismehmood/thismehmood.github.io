'use client';

/* ==========================================================================
   03 — EXPERIENCE (sticky side + scroll timeline drawn as a pipeline)
   Progress line + packet scrub, reached / active nodes, sticky counter +
   company swap + stage ticks.

   Imperative DOM owned here (JSX kept constant so React never fights it):
   - `.entry` gets `is-active` / `is-reached` via classList (className is always "entry")
   - `.experience__current` / `.experience__company` text is swapped by GSAP
   - `.experience__tick` gets `is-on` via classList (the first one starts on)
   All are reset in the useGSAP cleanup.
   ========================================================================== */

import { useRef } from 'react';
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { isStaticMode, prefersReducedMotion } from '@/lib/motion';
import { revealOnScroll, revealWords } from '@/lib/animations';
import { experience, sections } from '@/lib/data';
import SplitText from '@/components/SplitText';
import Corners from '@/components/Corners';

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
    const ticks = Array.from(root.querySelectorAll<HTMLElement>('.experience__tick'));
    let activeIndex = 0;
    let swapTl: gsap.core.Timeline | null = null;

    const writeCounter = (i: number) => {
      if (current) current.textContent = pad(i + 1);
      if (company) company.textContent = labelAt(i);
    };
    const writeTicks = (i: number) => ticks.forEach((t, j) => t.classList.toggle('is-on', j === i));

    const setActive = (i: number) => {
      if (i === activeIndex || !current || !company) return;
      const dir = i > activeIndex ? 1 : -1;
      activeIndex = i;
      writeTicks(i);
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

    // Pipeline progress: the gradient line is revealed top-down (clip-path keeps the
    // gradient fixed to the whole track, so the tail colour only shows near the end)
    // and a packet rides its leading edge. The line is a scroll-linked progress indicator,
    // so it also runs under reduced motion; the travelling packet does not (CSS hides it).
    const timeline = root.querySelector('.timeline');
    const track = root.querySelector<HTMLElement>('.timeline__track');
    const progress = root.querySelector('.timeline__progress');
    const packet = root.querySelector('.timeline__packet');
    if (timeline && progress) {
      const tl = gsap.timeline({
        scrollTrigger: { trigger: timeline, start: 'top 55%', end: 'bottom 55%', scrub: true, invalidateOnRefresh: true },
      });
      tl.fromTo(progress, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1, ease: 'none' }, 0);
      if (packet && track && !reduced) {
        // Function-based end value: measured on refresh only (no per-frame layout reads).
        // The packet fades in as it leaves the first node and out as it reaches the last.
        tl.fromTo(packet, { y: 0 }, { y: () => track.offsetHeight, duration: 1, ease: 'none' }, 0)
          .fromTo(packet, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.03, ease: 'none' }, 0)
          .to(packet, { autoAlpha: 0, duration: 0.03, ease: 'none' }, 0.97);
      }
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

      // Active stage: the entry under the 55% line. "Reached" stays on once that line has
      // passed the entry's top (onEnter / onLeaveBack also fire when a jump skips both edges).
      ScrollTrigger.create({
        trigger: entry,
        start: 'top 55%',
        end: 'bottom 55%',
        onToggle: (self) => {
          entry.classList.toggle('is-active', self.isActive);
          if (self.isActive) setActive(i);
        },
        onEnter: () => entry.classList.add('is-reached'),
        onLeaveBack: () => entry.classList.remove('is-reached'),
      });
    });

    // Runs after the context has reverted its tweens/triggers: undo the imperative DOM writes
    return () => {
      swapTl = null;
      entries.forEach((entry) => entry.classList.remove('is-active', 'is-reached'));
      writeCounter(0);
      writeTicks(0);
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

            <div className="experience__panel" data-reveal="" aria-hidden="true">
              <Corners />
              <div className="experience__panel-head mono">
                <span>Role</span>
                <span className="experience__ticks">
                  {experience.map((role, i) => (
                    <span className={i === 0 ? 'experience__tick is-on' : 'experience__tick'} key={`${role.company}-${role.dates}`} />
                  ))}
                </span>
              </div>
              <div className="experience__counter">
                <span className="experience__current-wrap"><span className="experience__current">{pad(1)}</span></span>
                <span className="experience__total">{`/ ${pad(experience.length)}`}</span>
              </div>
              <div className="experience__company-wrap">
                <span className="experience__company">{labelAt(0)}</span>
              </div>
            </div>
          </div>
        </aside>

        <div className="timeline">
          <div className="timeline__track" aria-hidden="true"><span className="timeline__progress" /></div>
          <span className="timeline__packet" aria-hidden="true" />
          <ol className="timeline__list">
            {experience.map((role) => (
              <li className="entry" key={`${role.company}-${role.dates}`}>
                <span className="entry__dot" aria-hidden="true" />
                <div className="entry__head">
                  <span className="entry__date">{role.dates}</span>
                  <span className="entry__sep" aria-hidden="true" />
                  <span className="entry__location">{role.location}</span>
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

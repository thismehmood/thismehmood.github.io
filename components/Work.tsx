'use client';

/* ==========================================================================
   04 — SELECTED WORK
   Desktop (≥1024px, motion OK): the section gets `.is-horizontal` and the
   track is pinned + translated sideways as you scroll (progress bar, per-card
   art parallax, keyboard-focus follow). Tablet / mobile / reduced motion:
   vertical stack with simple batched reveals. Fine pointers get 3D tilt cards.
   The featured project (Octopus) is the first, wider card with accent brackets.
   Each card reads index → artwork → meta / title / description → highlights (the
   highlights come last in the DOM; on desktop CSS overlays them on the artwork).
   ========================================================================== */

import { useRef } from 'react';
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { isStaticMode, prefersReducedMotion } from '@/lib/motion';
import { revealWords } from '@/lib/animations';
import { projects, sections, workIntro } from '@/lib/data';
import { useApp } from '@/components/AppProvider';
import SplitText from '@/components/SplitText';
import ProjectArt from '@/components/ProjectArt';
import RichText from '@/components/RichText';
import Corners from '@/components/Corners';

const MQ_HORIZONTAL = '(min-width: 1024px) and (prefers-reduced-motion: no-preference)';
const MQ_STACKED = '(max-width: 1023px), (prefers-reduced-motion: reduce)';
const MQ_TILT = '(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)';

const ART_SHIFT = 9; // max xPercent of the inner-art parallax
const TILT_MAX = 9; // degrees

type Setter = (value: number) => void;

const pad = (n: number) => String(n).padStart(2, '0');

/** "2021 — 2026": the span of years covered by the projects (derived from lib/data). */
const projectYears = projects.flatMap((p) => p.years.match(/\d{4}/g) ?? []).map(Number);
const yearSpan = projectYears.length ? `${Math.min(...projectYears)} — ${Math.max(...projectYears)}` : '';
const isExternal = (href: string) => /^https?:\/\//.test(href);

export default function Work() {
  const rootRef = useRef<HTMLElement>(null);
  const { scrollTo } = useApp();

  useGSAP(
    () => {
      const section = rootRef.current;
      if (!section || isStaticMode()) return;

      const pin = section.querySelector<HTMLElement>('.work__pin');
      const track = section.querySelector<HTMLElement>('.work__track');
      const progressBar = section.querySelector<HTMLElement>('.work__progress-bar');
      if (!pin || !track || !progressBar) return;

      const cards = Array.from(track.querySelectorAll<HTMLElement>('.card'));
      const arts = Array.from(track.querySelectorAll<HTMLElement>('.card__art'));
      const countNow = section.querySelector<HTMLElement>('.work__count-now');

      const mm = gsap.matchMedia();

      /* --- Desktop: pin + translate the track horizontally --- */
      mm.add(MQ_HORIZONTAL, () => {
        section.classList.add('is-horizontal');

        const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);
        const setProgress = gsap.quickSetter(progressBar, 'scaleX') as Setter;

        // Inner-art parallax + the "01 / 06" readout: card centres are cached and
        // re-measured on every refresh (no layout reads per frame)
        const cardData = cards.map((card) => {
          const art = card.querySelector<HTMLElement>('.card__art');
          return { card, set: art ? (gsap.quickSetter(art, 'xPercent') as Setter) : null, center: 0 };
        });
        const measure = () => {
          cardData.forEach((d) => { d.center = d.card.offsetLeft + d.card.offsetWidth / 2; });
        };
        measure();

        let current = 0;
        const updateArt = () => {
          const x = Number(gsap.getProperty(track, 'x')) || 0;
          const vw = window.innerWidth;
          let nearest = 0;
          let best = Infinity;
          cardData.forEach((d, i) => {
            const offset = d.center + x - vw / 2;
            if (Math.abs(offset) < best) { best = Math.abs(offset); nearest = i; }
            d.set?.(gsap.utils.clamp(-1.2, 1.2, offset / vw) * -ART_SHIFT);
          });
          if (countNow && nearest !== current) {
            current = nearest;
            countNow.textContent = pad(nearest + 1);
          }
        };

        const hTween = gsap.to(track, {
          x: () => -distance(),
          ease: 'none',
          onUpdate(this: gsap.core.Tween) {
            setProgress(this.progress());
            updateArt();
          },
          scrollTrigger: {
            trigger: section,
            pin,
            start: 'top top',
            end: () => `+=${distance()}`,
            scrub: 1,
            invalidateOnRefresh: true,
            anticipatePin: 1,
            refreshPriority: 1, // pin before triggers further down the page
          },
        });

        // A refresh re-wraps the pin (moves .work__pin in the DOM), which blurs a focused
        // card — remember it on refreshInit and restore it afterwards
        let focused: HTMLElement | null = null;
        const onRefreshInit = () => {
          const active = document.activeElement;
          focused = active instanceof HTMLElement && pin.contains(active) ? active : null;
        };
        const onRefresh = () => {
          measure();
          updateArt();
          if (focused && document.activeElement !== focused) focused.focus({ preventScroll: true });
          focused = null;
        };
        ScrollTrigger.addEventListener('refreshInit', onRefreshInit);
        ScrollTrigger.addEventListener('refresh', onRefresh);
        updateArt();

        // Keyboard focus: bring the focused card into view by moving the page scroll
        // (the pin is overflow:clip, so the browser can't scroll it sideways itself)
        const onFocus = (e: FocusEvent) => {
          const target = e.target;
          if (!(target instanceof Element)) return;
          const item = target.closest<HTMLElement>('.card, .work__outro');
          if (!item || !target.matches(':focus-visible')) return;
          pin.scrollLeft = 0; // only matters where the overflow:hidden fallback applies
          const st = hTween.scrollTrigger;
          const d = distance();
          if (!st || !d) return;
          const tx = gsap.utils.clamp(0, d, item.offsetLeft - (window.innerWidth - item.offsetWidth) / 2);
          scrollTo(st.start + (tx / d) * (st.end - st.start), { immediate: true });
        };
        track.addEventListener('focusin', onFocus);

        // Cards rise in as the section arrives
        gsap.from(cards, {
          y: 120,
          rotate: 4,
          opacity: 0,
          duration: 1.3,
          ease: 'expo.out',
          stagger: 0.1,
          scrollTrigger: { trigger: section, start: 'top 70%', once: true },
        });

        return () => {
          ScrollTrigger.removeEventListener('refreshInit', onRefreshInit);
          ScrollTrigger.removeEventListener('refresh', onRefresh);
          track.removeEventListener('focusin', onFocus);
          section.classList.remove('is-horizontal');
          hTween.scrollTrigger?.kill();
          // quickSetter writes aren't recorded by matchMedia — clear them by hand
          gsap.set(arts, { clearProps: 'transform' });
          gsap.set(progressBar, { clearProps: 'transform' });
          if (countNow) countNow.textContent = pad(1);
        };
      });

      /* --- Tablet / mobile / reduced motion: vertical stack with simple reveals --- */
      mm.add(MQ_STACKED, (_self, contextSafe) => {
        if (prefersReducedMotion() || !cards.length) return;
        gsap.set(cards, { opacity: 0, y: 70 });
        // Record the later reveal tweens in this branch's context so a breakpoint
        // change (or unmount) mid-reveal reverts them too
        const reveal: ScrollTrigger.BatchCallback = (batch) =>
          gsap.to(batch, { opacity: 1, y: 0, duration: 1.1, ease: 'expo.out', stagger: 0.1, overwrite: true });
        ScrollTrigger.batch(cards, {
          start: 'top 90%',
          once: true,
          onEnter: contextSafe ? (contextSafe(reveal) as ScrollTrigger.BatchCallback) : reveal,
        });
      });

      /* --- Tablet / mobile: highlights are always visible, so the card tab stops do nothing.
         (Kept at ≥1024px, where focusing a card is the keyboard way to reveal its highlights.) --- */
      mm.add('(max-width: 1023px)', () => {
        cards.forEach((c) => c.removeAttribute('tabindex'));
        return () => cards.forEach((c) => { c.tabIndex = 0; });
      });

      /* --- 3D tilt + glare follow (fine pointer, motion OK) --- */
      mm.add(MQ_TILT, () => {
        const cleanups = cards.map((card) => {
          const inner = card.querySelector<HTMLElement>('.card__inner');
          if (!inner) return () => {};

          gsap.set(inner, { transformPerspective: 1000 });
          const rx = gsap.quickTo(inner, 'rotationX', { duration: 0.7, ease: 'power3' });
          const ry = gsap.quickTo(inner, 'rotationY', { duration: 0.7, ease: 'power3' });

          const onMove = (e: PointerEvent) => {
            const r = card.getBoundingClientRect();
            const px = (e.clientX - r.left) / r.width;
            const py = (e.clientY - r.top) / r.height;
            ry((px - 0.5) * TILT_MAX * 2);
            rx(-(py - 0.5) * TILT_MAX * 2);
            card.style.setProperty('--gx', `${px * 100}%`);
            card.style.setProperty('--gy', `${py * 100}%`);
          };
          const onLeave = () => { rx(0); ry(0); };

          card.addEventListener('pointermove', onMove);
          card.addEventListener('pointerleave', onLeave);
          return () => {
            card.removeEventListener('pointermove', onMove);
            card.removeEventListener('pointerleave', onLeave);
            card.style.removeProperty('--gx');
            card.style.removeProperty('--gy');
            gsap.set(inner, { clearProps: 'transform' });
          };
        });
        return () => cleanups.forEach((fn) => fn());
      });

      /* --- Section heading: masked word slide-up --- */
      if (!prefersReducedMotion()) revealWords(section.querySelector('.work__title'));

      // The section's .is-inview gates its own small loops (scroll hint, badge ping)
      ScrollTrigger.create({
        trigger: section,
        start: 'top bottom',
        end: 'bottom top',
        toggleClass: { targets: section, className: 'is-inview' },
      });

      // Each card's SVG art only animates while that card is on screen (CSS reads the card's
      // .is-inview). An IntersectionObserver sees the track's transform and the pin's clip, so
      // off-screen cards of the pinned gallery pause too.
      let io: IntersectionObserver | null = null;
      if (typeof IntersectionObserver === 'function') {
        io = new IntersectionObserver((entries) => {
          entries.forEach((e) => e.target.classList.toggle('is-inview', e.isIntersecting));
        });
        cards.forEach((c) => io?.observe(c));
      } else {
        cards.forEach((c) => c.classList.add('is-inview'));
      }

      // Runs after everything above has been reverted
      return () => {
        io?.disconnect();
        cards.forEach((c) => c.classList.remove('is-inview'));
        section.classList.remove('is-inview', 'is-horizontal');
      };
    },
    { scope: rootRef, dependencies: [scrollTo], revertOnUpdate: true },
  );

  return (
    <section className="work" id="work" ref={rootRef}>
      <div className="work__pin">
        <div className="work__header">
          <p className="section-label"><span className="num">{sections.work.num}</span> {sections.work.label}</p>
          <p className="work__count" aria-hidden="true">
            <span className="work__count-now">{pad(1)}</span> / {pad(projects.length)}
          </p>
          <div className="work__progress" aria-hidden="true"><span className="work__progress-bar" /></div>
          <p className="work__hint" aria-hidden="true">Scroll <span>→</span></p>
        </div>

        <div className="work__track">
          <div className="work__intro">
            <SplitText as="h2" className="work__title" type="words" mask parts={workIntro.title} />
            <p className="work__lead">{workIntro.lead}</p>
            <p className="work__meta mono">
              {pad(projects.length)} projects{yearSpan && ` · ${yearSpan}`}
            </p>
          </div>

          {projects.map((project) => (
            <article
              className={project.featured ? 'card card--featured' : 'card'}
              tabIndex={0}
              aria-labelledby={`work-${project.num}`}
              key={project.num}
            >
              <Corners accent={project.featured} />
              <div className="card__inner">
                <span className="card__glare" aria-hidden="true" />
                <div className="card__top">
                  <span className="card__num">{project.num}</span>
                  <span className="card__rule" aria-hidden="true" />
                  <span className="card__years">{project.years}</span>
                </div>
                <div className="card__visual">
                  {project.badge && (
                    <p className="status card__status"><span className="pulse-dot" aria-hidden="true" />{project.badge}</p>
                  )}
                  <div className="card__art" aria-hidden="true">
                    <ProjectArt id={project.art} />
                  </div>
                </div>
                <div className="card__body">
                  <div className="card__heading">
                    <p className="card__meta">{project.meta}</p>
                    <h3 className="card__title" id={`work-${project.num}`}>
                      {project.href ? (
                        <a
                          className="card__link"
                          href={project.href}
                          {...(isExternal(project.href) ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                        >
                          {project.title}
                          {isExternal(project.href) && <span className="sr-only"> (opens in a new tab)</span>}
                          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path d="M7 17 17 7M9 7h8v8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </a>
                      ) : project.title}
                    </h3>
                  </div>
                  <div className="card__detail">
                    <p className="card__desc">{project.desc}</p>
                    <ul className="chips chips--sm">
                      {project.tags.map((tag) => <li className="chip" key={tag}>{tag}</li>)}
                    </ul>
                  </div>
                </div>
                {/* after the body, so the title comes first; desktop CSS lays it over .card__visual */}
                <ul className="card__highlights">
                  {project.highlights.map((point) => <li key={point}>{point}</li>)}
                </ul>
              </div>
            </article>
          ))}

          <div className="work__outro">
            <p className="work__outro-top mono" aria-hidden="true">
              <span>{pad(projects.length + 1)}</span>
              <span>Next</span>
            </p>
            <span className="work__outro-mark" aria-hidden="true" />
            <p className="work__outro-text"><RichText parts={workIntro.outro} /></p>
            <a href="#contact" className="btn btn--primary" data-magnetic="0.35">
              <span className="btn__label" data-magnetic-inner="">
                Start a conversation
                <svg className="btn__arrow" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

'use client';

/* ==========================================================================
   Hero — the name (masked character intro), role line, lede, CTAs and a mono
   spec sheet, beside the Agent mesh canvas (components/HeroAgentMesh.tsx).
   - Intro timeline is built paused on mount, so its "from" states hide the
     hero behind the preloader; it plays when useApp().revealed flips true.
     The mesh boots (edges grow out of the core) on the same hand-off.
     (The nav's part of the intro lives in Nav.tsx.)
   - Scroll parallax (data-speed) + title drift, skipped for reduced motion.
   - Static mode (the <head> failsafe fired): nothing is hidden or animated;
     the mesh draws a single static frame.
   ========================================================================== */

import { Fragment, useEffect, useId, useRef } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import { isStaticMode, prefersReducedMotion } from '@/lib/motion';
import { featuredCert, hero, site } from '@/lib/data';
import SplitText from '@/components/SplitText';
import RichText from '@/components/RichText';
import Corners from '@/components/Corners';
import HeroAgentMesh, { HeroMeshFallback } from '@/components/HeroAgentMesh';
import { useApp } from '@/components/AppProvider';

/* "AI Automations · AI Agents · Cloud-Native" → "AI Automations & AI Agents" */
const FOCUS = site.tagline.split(' · ').slice(0, 2).join(' & ');

const SPEC: { key: string; value: string }[] = [
  { key: 'Role', value: site.title },
  { key: 'Focus', value: site.tagline },
  { key: 'Base', value: `${site.location} · ${site.tzLabel}` },
  { key: 'Cert', value: `${featuredCert.title} · ${featuredCert.date}` },
];

export default function Hero() {
  const rootRef = useRef<HTMLElement>(null);
  const introRef = useRef<gsap.core.Timeline | null>(null);
  const { revealed } = useApp();
  // Unique, URL-safe id for the no-JS figure's gradient (stable across SSR + hydration)
  const glowId = `hero-mesh-glow-${useId().replace(/[^A-Za-z0-9_-]/g, '')}`;

  useGSAP(() => {
    const root = rootRef.current;
    if (!root || isStaticMode()) return;

    const reduced = prefersReducedMotion();
    const title = root.querySelector<HTMLElement>('.hero__title');
    const mesh = root.querySelector<HTMLElement>('.hero__mesh');
    const dot = root.querySelector<HTMLElement>('.hero__dot');
    const chars = Array.from(root.querySelectorAll<HTMLElement>('.hero__title .char'));
    const fades = Array.from(root.querySelectorAll<HTMLElement>('[data-hero-fade]'));
    const rows = Array.from(root.querySelectorAll<HTMLElement>('.hero__spec-row'));

    /* --- 06. Hero intro (paused until the preloader hands off) --- */
    const tl = gsap.timeline({ paused: true, defaults: { ease: 'expo.out' } });

    if (reduced) {
      const targets: HTMLElement[] = [...(title ? [title] : []), ...(mesh ? [mesh] : []), ...fades];
      tl.fromTo(targets, { opacity: 0 }, { opacity: 1, duration: 0.6, clearProps: 'opacity' });
    } else {
      tl.fromTo(chars,
        { yPercent: 120, rotate: 6 },
        { yPercent: 0, rotate: 0, duration: 1.5, stagger: 0.045 }, 0);
      if (dot) {
        tl.fromTo(dot, { scale: 0 }, { scale: 1, duration: 1, ease: 'back.out(2.4)' }, 0.85);
      }
      if (mesh) {
        tl.fromTo(mesh, { opacity: 0 }, { opacity: 1, duration: 1.6, ease: 'power2.out' }, 0.1);
      }
      tl.fromTo(fades,
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.2, stagger: 0.1 }, 0.35);
      if (rows.length) {
        tl.fromTo(rows,
          { opacity: 0, x: -12 },
          { opacity: 1, x: 0, duration: 0.9, stagger: 0.07 }, 0.95);
      }
    }
    introRef.current = tl;

    const cleanups: Array<() => void> = [() => { introRef.current = null; }];
    const cleanup = () => cleanups.forEach((fn) => fn());

    if (reduced) return cleanup;

    /* --- 07. Scroll parallax: higher data-speed = moves faster --- */
    root.querySelectorAll<HTMLElement>('[data-speed]').forEach((el) => {
      const speed = parseFloat(el.dataset.speed ?? '') || 0.5;
      const section = el.closest('section') ?? el;
      gsap.to(el, {
        y: () => -window.innerHeight * speed * 0.6,
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
          invalidateOnRefresh: true,
        },
      });
    });

    // Title drifts and fades as the hero leaves
    if (title) {
      gsap.to(title, {
        yPercent: 22,
        opacity: 0.15,
        ease: 'none',
        scrollTrigger: { trigger: root, start: 'top top', end: 'bottom top', scrub: true },
      });
    }

    return cleanup;
  }, { scope: rootRef });

  // Preloader handed off → play the intro (runs after the layout-effect build above)
  useEffect(() => {
    if (revealed) introRef.current?.play();
  }, [revealed]);

  return (
    <section className="hero" id="top" ref={rootRef}>
      {/* Signature figure: orchestrator + agents (decorative) */}
      <div className="hero__mesh" data-speed="0.16" aria-hidden="true">
        <HeroAgentMesh active={revealed} />
        <HeroMeshFallback gradientId={glowId} />
      </div>

      <div className="hero__meta" data-hero-fade="">
        <span>{hero.meta}</span>
        <span className="hero__fig" aria-hidden="true">
          <span className="hero__fig-num">Fig. 01</span> Agent mesh
          <span className="hero__fig-sub">1 orchestrator · 8 agents</span>
        </span>
      </div>

      <div className="hero__body">
        <h1 className="hero__title">
          <span className="line">
            <SplitText text={site.firstName} className="js-split-chars" />
          </span>
          <span className="line">
            <SplitText text={site.lastName[0]} className="js-split-chars hero__title-soft" />{' '}
            <SplitText text={site.lastName[1]} className="js-split-chars" />
            <span className="hero__dot" aria-hidden="true" />
          </span>
        </h1>

        <p className="hero__role" data-hero-fade="">
          <span className="hero__role-title">{site.title}</span>
          <span className="hero__role-sep"> — </span>
          <span className="hero__role-focus">{FOCUS}</span>
        </p>

        <p className="hero__lede" data-hero-fade="">
          <RichText parts={hero.lede} />
        </p>

        <div className="hero__cta" data-hero-fade="">
          <a href="#work" className="btn btn--primary" data-magnetic="0.35">
            <span className="btn__label" data-magnetic-inner="">
              View selected work
              <svg className="btn__arrow" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </a>
          <a href={site.resume} className="btn btn--ghost" data-magnetic="0.35" download>
            <span className="btn__label" data-magnetic-inner="">Download CV</span>
          </a>
        </div>

        {/* Mono spec sheet */}
        <div className="hero__spec" data-hero-fade="">
          <Corners />
          <p className="hero__spec-head" aria-hidden="true">
            <span>Spec sheet</span>
            <span>{site.cityCode} / {site.year}</span>
          </p>
          <dl className="hero__spec-list">
            {SPEC.map((row, i) => (
              <div className="hero__spec-row" key={row.key}>
                <dt><span className="hero__spec-idx" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>{row.key}</dt>
                <dd>
                  {/* keep each "·"-separated chunk whole; a wrap can only fall after a dot */}
                  {row.value.split(' · ').map((chunk, j) => (
                    <Fragment key={j}>
                      {j > 0 && '\u00A0· '}
                      <span className="hero__spec-chunk">{chunk}</span>
                    </Fragment>
                  ))}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <div className="hero__footer" data-hero-fade="">
        <span>Based in {site.location}</span>
        <span className="hero__scroll">
          <span className="hero__scroll-line" aria-hidden="true" />
          Scroll to explore
        </span>
      </div>
    </section>
  );
}

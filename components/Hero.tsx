'use client';

/* ==========================================================================
   Hero — name split into masked characters, lede, CTAs, rotating CKAD badge
   and floating decorative shapes.
   - Intro timeline is built paused on mount, so its "from" states hide the
     hero behind the preloader; it plays when useApp().revealed flips true.
     (The nav's part of the intro lives in Nav.tsx.)
   - Scroll parallax (data-speed) + title drift, skipped for reduced motion.
   - Mouse parallax on the shapes (data-depth), fine pointer only.
   ========================================================================== */

import { useEffect, useId, useRef } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import { hasFinePointer, isStaticMode, prefersReducedMotion } from '@/lib/motion';
import { featuredCert, hero, site } from '@/lib/data';
import SplitText from '@/components/SplitText';
import RichText from '@/components/RichText';
import { useApp } from '@/components/AppProvider';

export default function Hero() {
  const rootRef = useRef<HTMLElement>(null);
  const introRef = useRef<gsap.core.Timeline | null>(null);
  const { revealed } = useApp();

  // Unique, selector/URL-safe id for the badge's <textPath> (stable across SSR + hydration)
  const badgePathId = `badge-circle-${useId().replace(/[^A-Za-z0-9_-]/g, '')}`;

  useGSAP(() => {
    const root = rootRef.current;
    if (!root || isStaticMode()) return;

    const reduced = prefersReducedMotion();
    const title = root.querySelector<HTMLElement>('.hero__title');
    const star = root.querySelector<HTMLElement>('.hero__star');
    const chars = Array.from(root.querySelectorAll<HTMLElement>('.hero__title .char'));
    const fades = Array.from(root.querySelectorAll<HTMLElement>('[data-hero-fade]'));
    const inners = Array.from(root.querySelectorAll<HTMLElement>('.hero__shape-inner'));

    /* --- 06. Hero intro (paused until the preloader hands off) --- */
    const tl = gsap.timeline({ paused: true, defaults: { ease: 'expo.out' } });

    if (reduced) {
      const targets: HTMLElement[] = title ? [title, ...fades] : fades;
      tl.fromTo(targets, { opacity: 0 }, { opacity: 1, duration: 0.6, clearProps: 'opacity' });
    } else {
      tl.fromTo(chars,
        { yPercent: 120, rotate: 6 },
        { yPercent: 0, rotate: 0, duration: 1.5, stagger: 0.045 }, 0);
      if (star) {
        tl.fromTo(star,
          { scale: 0, rotate: -180 },
          { scale: 1, rotate: 0, duration: 1.4, ease: 'back.out(1.8)' }, 0.75);
      }
      tl.fromTo(fades,
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.2, stagger: 0.1 }, 0.35)
        .fromTo(inners,
          { scale: 0.4, opacity: 0 },
          { scale: 1, opacity: 1, duration: 1.8, stagger: 0.08 }, 0.1);
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

    /* --- Mouse parallax on the floating shapes (desktop only) --- */
    if (hasFinePointer()) {
      const shapes = inners.map((el) => ({
        x: gsap.quickTo(el, 'x', { duration: 1.4, ease: 'power3' }),
        y: gsap.quickTo(el, 'y', { duration: 1.4, ease: 'power3' }),
        depth: parseFloat(el.dataset.depth ?? '') || 20,
      }));
      const onMove = (e: PointerEvent) => {
        const nx = e.clientX / window.innerWidth - 0.5;
        const ny = e.clientY / window.innerHeight - 0.5;
        shapes.forEach((s) => { s.x(nx * s.depth); s.y(ny * s.depth); });
      };
      root.addEventListener('pointermove', onMove);
      cleanups.push(() => root.removeEventListener('pointermove', onMove));
    }

    return cleanup;
  }, { scope: rootRef });

  // Preloader handed off → play the intro (runs after the layout-effect build above)
  useEffect(() => {
    if (revealed) introRef.current?.play();
  }, [revealed]);

  return (
    <section className="hero" id="top" ref={rootRef}>
      {/* Parallax / floating decorative shapes */}
      <div className="hero__shapes" aria-hidden="true">
        <div className="hero__shape hero__shape--blob" data-speed="0.25">
          <div className="hero__shape-inner" data-depth="30"><div className="fx fx--blob" /></div>
        </div>
        <div className="hero__shape hero__shape--glow" data-speed="0.5">
          <div className="hero__shape-inner" data-depth="-40"><div className="fx fx--glow" /></div>
        </div>
        <div className="hero__shape hero__shape--ring" data-speed="0.6">
          <div className="hero__shape-inner" data-depth="-25">
            <svg className="spin-slow" viewBox="0 0 200 200" fill="none">
              <circle cx="100" cy="100" r="98" style={{ stroke: 'rgba(var(--text-rgb), 0.12)' }} />
              <circle cx="100" cy="100" r="74" style={{ stroke: 'rgba(var(--text-rgb), 0.08)' }} strokeDasharray="2 6" />
              <circle cx="100" cy="2" r="4" style={{ fill: 'var(--accent-fg)' }} />
              <circle cx="26" cy="100" r="2.5" style={{ fill: 'var(--text)' }} />
            </svg>
          </div>
        </div>
        <div className="hero__shape hero__shape--grid" data-speed="0.9">
          <div className="hero__shape-inner" data-depth="18"><div className="fx fx--grid float" /></div>
        </div>
        <div className="hero__shape hero__shape--plus" data-speed="1.2">
          <div className="hero__shape-inner" data-depth="50">
            <svg className="float float--delay" viewBox="0 0 40 40">
              <path d="M20 4v32M4 20h32" style={{ stroke: 'var(--accent-fg)' }} strokeWidth="3" strokeLinecap="round" />
            </svg>
          </div>
        </div>
        <div className="hero__shape hero__shape--cube" data-speed="0.8">
          <div className="hero__shape-inner" data-depth="-35">
            <svg className="float" viewBox="0 0 60 60" fill="none">
              <path d="M30 4 54 17v26L30 56 6 43V17L30 4Z" style={{ stroke: 'rgba(var(--text-rgb), 0.35)' }} />
              <path d="M6 17l24 13 24-13M30 30v26" style={{ stroke: 'rgba(var(--text-rgb), 0.35)' }} />
            </svg>
          </div>
        </div>
      </div>

      <div className="hero__meta" data-hero-fade="">
        <span>{hero.meta}</span>
        <span className="hero__meta-right">
          {site.title}
          <br />
          <span className="muted">{site.tagline}</span>
        </span>
      </div>

      <h1 className="hero__title">
        <span className="line">
          <SplitText text={site.firstName} className="js-split-chars" />
        </span>
        <span className="line line--right">
          <SplitText text={site.lastName[0]} className="js-split-chars outline" />{' '}
          <SplitText text={site.lastName[1]} className="js-split-chars" />
          <span className="hero__star" aria-hidden="true">
            <svg viewBox="0 0 100 100">
              <path d="M50 0 C53 35 65 47 100 50 C65 53 53 65 50 100 C47 65 35 53 0 50 C35 47 47 35 50 0Z" fill="currentColor" />
            </svg>
          </span>
        </span>
      </h1>

      <div className="hero__bottom">
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

        {/* Rotating CKAD badge */}
        <div className="hero__badge" data-hero-fade="" role="img" aria-label={featuredCert.title}>
          <svg className="hero__badge-text" viewBox="0 0 200 200" aria-hidden="true">
            <defs>
              <path id={badgePathId} d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0" />
            </defs>
            <text>
              <textPath href={`#${badgePathId}`} textLength="488" lengthAdjust="spacing">{hero.badge}</textPath>
            </text>
          </svg>
          <svg className="hero__badge-core" viewBox="0 0 60 60" aria-hidden="true">
            <circle cx="30" cy="30" r="29" fill="#CCFF00" />
            <g stroke="#0B0C10" strokeWidth="2.5" strokeLinecap="round" fill="none">
              <circle cx="30" cy="30" r="11" />
              <circle cx="30" cy="30" r="3" fill="#0B0C10" />
              <path d="M30 19V11M30 41v8M40.5 25.5l7-4M12.5 38.5l7-4M40.5 34.5l7 4M12.5 21.5l7 4" />
            </g>
          </svg>
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

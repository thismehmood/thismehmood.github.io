'use client';

/* ==========================================================================
   Navigation
   - Intro: hidden while the preloader runs, slides in 0.5s after the reveal
   - is-scrolled background, hide on scroll down / show on scroll up
   - Active link per `main section[id]` (bracketed + aria-current)
   - Scroll pipeline along the bottom edge: a hairline with one node per
     section, placed at that section's scroll position (recomputed on every
     ScrollTrigger refresh), filled green up to the current scroll progress
   - Fullscreen mobile menu: circle wipe from the toggle, page inert while open
   Everything here is toggled imperatively (classes, aria-*, inert, styles),
   so the JSX classNames / attributes below are constants React never rewrites.
   ========================================================================== */

import { useRef } from 'react';
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { isStaticMode, prefersReducedMotion } from '@/lib/motion';
import { useApp } from '@/components/AppProvider';
import LocalTime from '@/components/LocalTime';
import Monogram from '@/components/Monogram';
import Corners from '@/components/Corners';
import { navLinks, site } from '@/lib/data';

/** Documented runtime flag (true while ScrollTrigger.refresh() runs) that its typings omit. */
const isRefreshing = () => (ScrollTrigger as unknown as { isRefreshing?: boolean }).isRefreshing === true;

/** Line arrow: "right" (rotates to ↗ on .btn hover via base.css) or "up-right". */
function Arrow({ className, dir = 'up-right' }: { className?: string; dir?: 'right' | 'up-right' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d={dir === 'right' ? 'M5 12h14M13 6l6 6-6 6' : 'M7 17 17 7M9 7h8v8'}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Nav() {
  const { revealed, getLenis, registerMenu } = useApp();
  const navRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const menuOpenRef = useRef(false);

  /* --- Intro: hidden on mount, plays 0.5s after the preloader hands off --- */
  useGSAP(() => {
    const nav = navRef.current;
    if (!nav) return;
    if (revealed) nav.classList.remove('is-hidden');
    if (isStaticMode()) return;

    // fromTo renders its "from" state immediately, so the nav is hidden from mount.
    // Each run is self-contained (revertOnUpdate): the previous run is reverted first.
    const tl = gsap.timeline({ paused: true, defaults: { ease: 'expo.out' } });
    if (prefersReducedMotion()) {
      tl.fromTo(nav, { opacity: 0 }, { opacity: 1, duration: 0.6, clearProps: 'opacity' }, 0);
    } else {
      tl.fromTo(nav,
        // Explicit y: 0 — a revert (Strict Mode / the revealed flip) clears the inline
        // transform and .nav's CSS transform transition starts, so GSAP would otherwise
        // parse the mid-transition translateY(-nav-h) as the base y and stack it.
        { y: 0, yPercent: -100, opacity: 0 },
        {
          y: 0,
          yPercent: 0,
          opacity: 1,
          duration: 1.2,
          clearProps: 'transform,opacity',
          // GSAP owns the transform during the intro: pause the CSS transition,
          // then hand back a visible nav (not one CSS would slide out again)
          onStart: () => { nav.style.transition = 'none'; },
          onComplete: () => { nav.classList.remove('is-hidden'); nav.style.transition = ''; },
        }, 0.5);
      // The pipeline draws in from the left once the nav has landed, nodes popping on in turn
      const track = nav.querySelector('.nav__pipe-track');
      const nodes = nav.querySelectorAll('.nav__pipe-node');
      if (track) {
        tl.fromTo(track,
          { scaleX: 0, transformOrigin: '0% 50%' },
          { scaleX: 1, duration: 1.4, ease: 'expo.inOut', clearProps: 'transform' }, 0.8);
      }
      if (nodes.length) {
        tl.fromTo(nodes,
          { scale: 0 },
          { scale: 1, duration: 0.6, ease: 'back.out(3)', stagger: 0.07, clearProps: 'transform' }, 1.1);
      }
    }
    if (revealed) tl.play();

    return () => { nav.style.transition = ''; };
  }, { dependencies: [revealed], revertOnUpdate: true });

  /* --- Scroll state, active link + scroll pipeline --- */
  useGSAP(() => {
    const nav = navRef.current;
    if (!nav) return;

    const pipe = nav.querySelector<HTMLElement>('.nav__pipeline');
    const fill = nav.querySelector<HTMLElement>('.nav__pipe-fill');
    const nodes = Array.from(nav.querySelectorAll<HTMLElement>('.nav__pipe-node'));
    const sectionTriggers = new Map<string, ScrollTrigger>();
    let progress = -1;

    // Paint only writes (a transform + class flips when a node changes state):
    // no layout reads, safe to run on every scroll update.
    const pipeState = nodes.map((node) => ({ node, id: node.dataset.target ?? '', pos: 2, passed: false }));
    const paintPipeline = (p: number) => {
      if (!fill || p === progress) return;
      progress = p;
      fill.style.transform = `translate3d(${((p - 1) * 100).toFixed(3)}%, 0, 0)`;
      pipeState.forEach((d) => {
        const on = p >= d.pos - 0.0005;
        if (on !== d.passed) {
          d.passed = on;
          d.node.classList.toggle('is-passed', on);
        }
      });
    };

    // Background after scrolling a bit; hide on scroll down, show on scroll up.
    // refreshPriority -1: refresh after every section (incl. the Work pin) so 'max' is final.
    const master = ScrollTrigger.create({
      start: 0,
      end: 'max',
      refreshPriority: -1,
      // A refresh (resize, fonts, load) momentarily scrolls to 0 to measure, which would strip
      // is-scrolled / is-hidden mid-page; skip those updates and resync once positions are final.
      onRefresh: (self) => { nav.classList.toggle('is-scrolled', self.scroll() > 40); },
      onUpdate: (self) => {
        if (isRefreshing()) return;
        paintPipeline(self.progress);
        const y = self.scroll();
        nav.classList.toggle('is-scrolled', y > 40);
        // Ignore the preloader phase (e.g. a deep-link jump) and never hide under keyboard focus
        if (menuOpenRef.current || document.body.classList.contains('is-loading')) return;
        if (self.direction === 1 && y > window.innerHeight * 0.6 && !nav.querySelector(':focus-visible')) {
          nav.classList.add('is-hidden');
        } else if (self.direction === -1) {
          nav.classList.remove('is-hidden');
        }
      },
    });

    // Highlight the link (desktop + mobile menu) and the pipeline node for the section in view
    const links = [
      ...Array.from(nav.querySelectorAll<HTMLAnchorElement>('.nav__link')),
      ...Array.from(menuRef.current?.querySelectorAll<HTMLAnchorElement>('.menu__link') ?? []),
    ];
    document.querySelectorAll<HTMLElement>('main section[id]').forEach((sec) => {
      const st = ScrollTrigger.create({
        trigger: sec,
        start: 'top 50%',
        end: 'bottom 50%',
        refreshPriority: -1,
        onToggle: (self) => {
          if (!self.isActive) return;
          const href = `#${sec.id}`;
          links.forEach((l) => {
            const on = l.getAttribute('href') === href;
            l.classList.toggle('is-active', on);
            if (on) l.setAttribute('aria-current', 'location');
            else l.removeAttribute('aria-current');
          });
          pipeState.forEach((d) => d.node.classList.toggle('is-current', d.id === href));
        },
      });
      sectionTriggers.set(`#${sec.id}`, st);
    });

    // Place each node where its section starts (the same point its link turns active).
    // Runs on every ScrollTrigger refresh, after all triggers (incl. the Work pin) are measured.
    const layoutPipeline = () => {
      if (!pipe) return;
      const max = ScrollTrigger.maxScroll(window);
      if (max <= 0) return;
      pipeState.forEach((d) => {
        const st = sectionTriggers.get(d.id);
        d.pos = st ? gsap.utils.clamp(0, 1, st.start / max) : 2;
        d.node.style.left = `${(Math.min(d.pos, 1) * 100).toFixed(3)}%`;
        d.node.hidden = !st;
      });
      pipe.classList.add('is-ready');
      progress = -1; // force a repaint against the new positions
      paintPipeline(gsap.utils.clamp(0, 1, master.scroll() / max));
    };
    ScrollTrigger.addEventListener('refresh', layoutPipeline);
    layoutPipeline();

    return () => {
      ScrollTrigger.removeEventListener('refresh', layoutPipeline);
      nav.classList.remove('is-scrolled', 'is-hidden');
      links.forEach((l) => { l.classList.remove('is-active'); l.removeAttribute('aria-current'); });
      pipe?.classList.remove('is-ready');
      if (fill) fill.style.transform = '';
      pipeState.forEach((d) => {
        d.node.classList.remove('is-passed', 'is-current');
        d.node.style.left = '';
        d.node.hidden = false;
      });
    };
  }, []);

  /* --- Mobile menu --- */
  useGSAP((_context, contextSafe) => {
    const nav = navRef.current;
    const menu = menuRef.current;
    const toggle = toggleRef.current;
    if (!nav || !menu || !toggle || !contextSafe) return;

    const STATIC = isStaticMode();
    const REDUCED = prefersReducedMotion();
    const html = document.documentElement;
    let menuTl: gsap.core.Timeline | null = null;

    // Circle centred on the toggle, with a radius that reaches the farthest viewport corner
    const menuGeometry = () => {
      const r = toggle.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const full = Math.hypot(Math.max(cx, window.innerWidth - cx), Math.max(cy, window.innerHeight - cy)) + 2;
      return { at: `${cx}px ${cy}px`, full };
    };

    // Everything outside the nav + menu is inert while the menu is open
    const setPageInert = (state: boolean) => {
      [document.getElementById('main'), document.querySelector('.footer'), document.querySelector('.skip-link')]
        .forEach((el) => { if (el instanceof HTMLElement) el.inert = state; });
    };

    const openMenu = contextSafe(() => {
      if (menuOpenRef.current) return;
      menuOpenRef.current = true;

      // Reveal a hidden nav instantly so the toggle is measured where it will actually be
      nav.style.transition = 'none';
      nav.classList.remove('is-hidden');
      void nav.offsetHeight;
      nav.style.transition = '';

      menu.classList.add('is-open');
      menu.setAttribute('aria-hidden', 'false');
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', 'Close menu');
      nav.classList.add('menu-open');
      setPageInert(true);
      getLenis()?.stop();
      html.style.overflow = 'hidden';

      menuTl?.kill();
      menuTl = null;
      if (STATIC) {
        // Static fallback: no wipe, just show it
        menu.style.clipPath = 'none';
      } else if (REDUCED) {
        menuTl = gsap.timeline().fromTo(menu, { clipPath: 'none', opacity: 0 }, { opacity: 1, duration: 0.3 });
      } else {
        const { at, full } = menuGeometry();
        // Once fully open, drop the circle: it was sized for this viewport, so a rotation or
        // resize while open would otherwise let the page show through past its edge.
        menuTl = gsap.timeline({ onComplete: () => { gsap.set(menu, { clipPath: 'none' }); } })
          .fromTo(menu,
            { clipPath: `circle(0px at ${at})` },
            { clipPath: `circle(${full}px at ${at})`, duration: 0.9, ease: 'expo.inOut' })
          .fromTo(menu.querySelectorAll('.menu__rule'),
            { scaleX: 0 },
            { scaleX: 1, duration: 1, ease: 'expo.inOut', stagger: 0.05 }, 0.2)
          .fromTo(menu.querySelectorAll('.menu__link-inner'),
            { yPercent: 110 },
            { yPercent: 0, duration: 0.9, ease: 'expo.out', stagger: 0.06 }, 0.3)
          .fromTo(menu.querySelectorAll('.menu__label, .menu__footer'), { opacity: 0 }, { opacity: 1, duration: 0.6 }, 0.6);
      }

      const first = menu.querySelector<HTMLElement>('.menu__link');
      first?.focus({ preventScroll: true });
      // The reduced-motion CSS gives every element a .01ms transition (property `all`), which
      // delays the inherited visibility flip by a frame or two, so that focus() is a no-op.
      // Retry for a few frames while the menu is still open and focus hasn't moved elsewhere.
      if (first && document.activeElement !== first) {
        let tries = 0;
        const retry = () => {
          const active = document.activeElement;
          if (!menuOpenRef.current || (active !== toggle && active !== document.body)) return;
          first.focus({ preventScroll: true });
          if (document.activeElement !== first && ++tries < 10) requestAnimationFrame(retry);
        };
        requestAnimationFrame(retry);
      }
    });

    // Un-inerts the page, restores scrolling and unlocks Lenis synchronously —
    // AppProvider's anchor handler moves focus right after calling this.
    const closeMenu = contextSafe(({ returnFocus = true }: { returnFocus?: boolean } = {}) => {
      if (!menuOpenRef.current) return;
      menuOpenRef.current = false;
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open menu');
      menu.setAttribute('aria-hidden', 'true');
      nav.classList.remove('menu-open');
      setPageInert(false);
      html.style.overflow = '';
      getLenis()?.start();

      menuTl?.kill();
      menuTl = null;
      const done = () => { menu.classList.remove('is-open'); gsap.set(menu, { clearProps: 'opacity' }); };
      if (STATIC) {
        menu.classList.remove('is-open');
        menu.style.clipPath = '';
      } else if (REDUCED) {
        menuTl = gsap.timeline({ onComplete: done }).to(menu, { opacity: 0, duration: 0.25 });
      } else {
        // Fully open (clip-path 'none'): start from a full circle measured for the current
        // viewport. Mid-open: .to() carries on from the partial circle, so nothing snaps.
        const { at, full } = menuGeometry();
        if (menu.style.clipPath === 'none') gsap.set(menu, { clipPath: `circle(${full}px at ${at})` });
        menuTl = gsap.timeline({ onComplete: done })
          .to(menu, { clipPath: `circle(0px at ${at})`, duration: 0.7, ease: 'expo.inOut' });
      }

      if (returnFocus) toggle.focus({ preventScroll: true });
    });

    const onToggle = () => (menuOpenRef.current ? closeMenu() : openMenu());
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && menuOpenRef.current) closeMenu(); };
    const mq = window.matchMedia('(min-width: 1024px)');
    const onBreakpoint = (e: MediaQueryListEvent) => { if (e.matches && menuOpenRef.current) closeMenu({ returnFocus: false }); };

    toggle.addEventListener('click', onToggle);
    document.addEventListener('keydown', onKey);
    mq.addEventListener('change', onBreakpoint);
    registerMenu({ isOpen: () => menuOpenRef.current, close: (opts) => closeMenu(opts) });

    return () => {
      toggle.removeEventListener('click', onToggle);
      document.removeEventListener('keydown', onKey);
      mq.removeEventListener('change', onBreakpoint);
      registerMenu(null);

      // Unmounted while open: give the page back
      if (menuOpenRef.current) {
        menuOpenRef.current = false;
        setPageInert(false);
        html.style.overflow = '';
        getLenis()?.start();
      }
      menuTl?.kill();
      menu.classList.remove('is-open');
      menu.setAttribute('aria-hidden', 'true');
      menu.style.clipPath = '';
      nav.classList.remove('menu-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open menu');
    };
  }, []);

  return (
    <>
      <header className="nav" ref={navRef}>
        <a href="#top" className="nav__logo" data-magnetic="0.2" aria-label={`${site.name} — back to top`}>
          <span className="nav__logo-inner" data-magnetic-inner="">
            <Monogram className="nav__mark" />
            <span className="nav__wordmark">
              <span className="nav__name">{site.name}</span>
              <span className="nav__role">{site.title}</span>
            </span>
          </span>
        </a>

        <nav className="nav__links" aria-label="Primary">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className="nav__link">
              <span className="nav__link-num" aria-hidden="true">{link.num}</span>
              <span className="nav__link-text">{link.label}</span>
              <Corners />
            </a>
          ))}
        </nav>

        <div className="nav__right">
          <span className="nav__clock status">
            <span className="pulse-dot" aria-hidden="true" />
            <span className="sr-only">Local time in {site.location}: </span>
            <span aria-hidden="true">{site.cityCode}</span> <LocalTime />
          </span>
          <a href="#contact" className="btn btn--ghost btn--sm nav__cta" data-magnetic="0.35">
            <span className="btn__label" data-magnetic-inner="">
              Let’s talk<Arrow className="btn__arrow" dir="right" />
            </span>
          </a>
          <button
            ref={toggleRef}
            className="nav__toggle"
            type="button"
            aria-expanded="false"
            aria-controls="menu"
            aria-label="Open menu"
          >
            <span className="nav__toggle-label" aria-hidden="true" />
            <span className="nav__toggle-lines" aria-hidden="true"><span /><span /></span>
          </button>
        </div>

        {/* Scroll pipeline: one node per section, filled green up to the scroll position */}
        <div className="nav__pipeline" aria-hidden="true">
          <span className="nav__pipe-track"><span className="nav__pipe-fill" /></span>
          {navLinks.map((link) => (
            <span key={link.href} className="nav__pipe-node" data-target={link.href} />
          ))}
        </div>
      </header>

      {/* Mobile fullscreen menu */}
      <div className="menu" id="menu" aria-hidden="true" data-lenis-prevent="" ref={menuRef}>
        <p className="menu__label section-label" aria-hidden="true"><span className="num">00</span>Index</p>
        <nav className="menu__nav" aria-label="Mobile">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className="menu__link">
              <span className="menu__link-inner">
                <span className="menu__num" aria-hidden="true">{link.num}</span>
                <span className="menu__text">{link.label}</span>
                <Arrow className="menu__arrow" />
              </span>
              <span className="menu__rule" aria-hidden="true" />
            </a>
          ))}
        </nav>
        <div className="menu__footer">
          <a className="menu__email" href={`mailto:${site.email}`}>{site.email}</a>
          <span className="menu__meta">
            <span className="pulse-dot" aria-hidden="true" />{site.location}
          </span>
        </div>
      </div>
    </>
  );
}

'use client';

/* ==========================================================================
   Navigation (main.js §14 + the nav part of §06 buildHeroIntro)
   - Intro: hidden while the preloader runs, slides in 0.5s after the reveal
   - is-scrolled background, hide on scroll down / show on scroll up
   - Active link per `main section[id]`
   - Fullscreen mobile menu: circle wipe from the toggle, page inert while open
   Everything here is toggled imperatively (classes, aria-*, inert) exactly like
   the vanilla build, so the JSX classNames / attributes below are constants
   that React never rewrites.
   ========================================================================== */

import { useRef } from 'react';
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { isStaticMode, prefersReducedMotion } from '@/lib/motion';
import { useApp } from '@/components/AppProvider';
import LocalTime from '@/components/LocalTime';
import ThemeToggle from '@/components/ThemeToggle';
import { navLinks, site } from '@/lib/data';

/** Documented runtime flag (true while ScrollTrigger.refresh() runs) that its typings omit. */
const isRefreshing = () => (ScrollTrigger as unknown as { isRefreshing?: boolean }).isRefreshing === true;

/** "MH" from "Mehmood Ul Hassan" */
const INITIALS = `${site.firstName[0]}${site.lastName[site.lastName.length - 1][0]}`;

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
    }
    if (revealed) tl.play();

    return () => { nav.style.transition = ''; };
  }, { dependencies: [revealed], revertOnUpdate: true });

  /* --- Scroll state + active link --- */
  useGSAP(() => {
    const nav = navRef.current;
    if (!nav) return;

    // Background after scrolling a bit; hide on scroll down, show on scroll up.
    // refreshPriority -1: refresh after every section (incl. the Work pin) so 'max' is final.
    ScrollTrigger.create({
      start: 0,
      end: 'max',
      refreshPriority: -1,
      // A refresh (resize, fonts, load) momentarily scrolls to 0 to measure, which would strip
      // is-scrolled / is-hidden mid-page; skip those updates and resync once positions are final.
      onRefresh: (self) => { nav.classList.toggle('is-scrolled', self.scroll() > 40); },
      onUpdate: (self) => {
        if (isRefreshing()) return;
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

    // Highlight the link for the section in view
    const links = Array.from(nav.querySelectorAll<HTMLAnchorElement>('.nav__link'));
    document.querySelectorAll<HTMLElement>('main section[id]').forEach((sec) => {
      ScrollTrigger.create({
        trigger: sec,
        start: 'top 50%',
        end: 'bottom 50%',
        refreshPriority: -1,
        onToggle: (self) => {
          if (!self.isActive) return;
          links.forEach((l) => l.classList.toggle('is-active', l.getAttribute('href') === `#${sec.id}`));
        },
      });
    });

    return () => {
      nav.classList.remove('is-scrolled', 'is-hidden');
      links.forEach((l) => l.classList.remove('is-active'));
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
        menuTl = gsap.timeline()
          .fromTo(menu,
            { clipPath: `circle(0px at ${at})` },
            { clipPath: `circle(${full}px at ${at})`, duration: 0.9, ease: 'expo.inOut' })
          .fromTo(menu.querySelectorAll('.menu__link > span'),
            { yPercent: 110 },
            { yPercent: 0, duration: 0.9, ease: 'expo.out', stagger: 0.06 }, 0.3)
          .fromTo(menu.querySelector('.menu__footer'), { opacity: 0 }, { opacity: 1, duration: 0.6 }, 0.6);
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
        menuTl = gsap.timeline({ onComplete: done })
          .to(menu, { clipPath: `circle(0px at ${menuGeometry().at})`, duration: 0.7, ease: 'expo.inOut' });
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
        <a href="#top" className="nav__logo" data-magnetic="0.3" aria-label={`${site.name} — back to top`}>
          <span data-magnetic-inner="">{INITIALS}<span className="accent">.</span></span>
        </a>

        <nav className="nav__links" aria-label="Primary">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className="nav__link">
              <sup>{link.num}</sup><span className="nav__link-text">{link.label}</span>
            </a>
          ))}
        </nav>

        <div className="nav__right">
          <span className="nav__clock">
            <span className="pulse-dot" aria-hidden="true" />{site.cityCode} <LocalTime />
          </span>
          <ThemeToggle />
          <a href="#contact" className="btn btn--ghost btn--sm" data-magnetic="0.35">
            <span className="btn__label" data-magnetic-inner="">Let&apos;s talk</span>
          </a>
          <button
            ref={toggleRef}
            className="nav__toggle"
            type="button"
            aria-expanded="false"
            aria-controls="menu"
            aria-label="Open menu"
          >
            <span /><span />
          </button>
        </div>
      </header>

      {/* Mobile fullscreen menu */}
      <div className="menu" id="menu" aria-hidden="true" data-lenis-prevent="" ref={menuRef}>
        <nav className="menu__nav" aria-label="Mobile">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className="menu__link">
              <span><sup>{link.num}</sup>{link.label}</span>
            </a>
          ))}
        </nav>
        <div className="menu__footer">
          <a href={`mailto:${site.email}`}>{site.email}</a>
          <span>{site.location}</span>
        </div>
      </div>
    </>
  );
}

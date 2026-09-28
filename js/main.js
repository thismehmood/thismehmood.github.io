/* ==========================================================================
   Mehmood Ul Hassan — Portfolio
   main.js — GSAP 3 + ScrollTrigger + Lenis
   --------------------------------------------------------------------------
   01. Setup & helpers
   02. Split text utility
   03. Smooth scroll (Lenis) & anchor navigation
   04. Custom cursor
   05. Magnetic elements & button fills
   06. Preloader & hero intro
   07. Hero parallax (scroll + mouse)
   08. Marquee (scroll-velocity driven)
   09. Generic reveals, split headings, word scrub, counters
   10. Skills cards
   11. Experience timeline
   12. Work — pinned horizontal scroll + 3D tilt
   13. Credentials, footer & misc scroll effects
   14. Navigation (hide/show, active link, mobile menu)
   15. Contact form, copy-to-clipboard, clock
   16. Init
   ========================================================================== */

(() => {
  'use strict';

  // Tell the <head> failsafe that the app has started
  window.__appStarted = true;
  clearTimeout(window.__pf);

  /* ------------------------------------------------------------------------
     01. SETUP & HELPERS
     ------------------------------------------------------------------------ */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FINE_POINTER = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const EMAIL = 'this.mehmood@gmail.com';

  // Static fallback: GSAP didn't load, or the failsafe already revealed the page.
  // Keep everything that doesn't need GSAP working, then stop.
  if (!window.gsap || !window.ScrollTrigger || document.documentElement.classList.contains('no-gsap')) {
    document.documentElement.classList.add('no-gsap');
    document.body.classList.remove('is-loading');
    initClock();
    initCopy();
    initForm();
    initStaticMenu();
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });

  // Always start at the top so the intro plays from a known state.
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);

  let lenis = null;
  let menuOpen = false;


  /* ------------------------------------------------------------------------
     02. SPLIT TEXT UTILITY
     Wraps words (and optionally chars) in spans while keeping nested markup
     (<em>, <strong>…). Adds a visually-hidden copy for screen readers.
     ------------------------------------------------------------------------ */
  function splitText(el, { type = 'chars', mask = false } = {}) {
    const original = el.textContent.replace(/\s+/g, ' ').trim();
    const words = [];
    const chars = [];
    const inners = [];

    const processTextNode = (textNode) => {
      const frag = document.createDocumentFragment();

      textNode.textContent.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) {
          frag.appendChild(document.createTextNode(' '));
          return;
        }

        const word = document.createElement('span');
        word.className = mask ? 'word word--mask' : 'word';
        word.setAttribute('aria-hidden', 'true');

        let target = word;
        if (mask) {
          const inner = document.createElement('span');
          inner.className = 'word__inner';
          word.appendChild(inner);
          inners.push(inner);
          target = inner;
        }

        if (type === 'chars') {
          for (const c of part) {
            const ch = document.createElement('span');
            ch.className = 'char';
            ch.textContent = c;
            target.appendChild(ch);
            chars.push(ch);
          }
        } else {
          target.textContent = part;
        }

        words.push(word);
        frag.appendChild(word);
      });

      textNode.replaceWith(frag);
    };

    const walk = (node) => {
      Array.from(node.childNodes).forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) processTextNode(child);
        else if (child.nodeType === Node.ELEMENT_NODE && !child.matches('svg, .sr-only')) walk(child);
      });
    };

    walk(el);

    const sr = document.createElement('span');
    sr.className = 'sr-only';
    sr.textContent = original;
    el.prepend(sr);

    return { words, chars, inners };
  }


  /* ------------------------------------------------------------------------
     03. SMOOTH SCROLL (LENIS) & ANCHOR NAVIGATION
     ------------------------------------------------------------------------ */
  function initSmoothScroll() {
    if (REDUCED || typeof window.Lenis !== 'function') return;

    lenis = new Lenis({ lerp: 0.09, smoothWheel: true, wheelMultiplier: 1 });

    // Keep ScrollTrigger in sync with Lenis and drive Lenis from GSAP's ticker
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);

    lenis.stop(); // locked until the preloader finishes
  }

  function scrollToTarget(target, { immediate = false } = {}) {
    if (lenis) {
      lenis.scrollTo(target, {
        immediate,
        duration: 1.6,
        easing: (t) => 1 - Math.pow(1 - t, 4),
      });
      return;
    }
    const top = typeof target === 'number'
      ? target
      : target.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top, behavior: immediate || REDUCED ? 'auto' : 'smooth' });
  }

  function resolveHash(hash) {
    if (!hash || hash === '#') return null;
    if (hash === '#top') return 0;
    try { return document.querySelector(hash); } catch (e) { return null; }
  }

  function initAnchors() {
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href^="#"]');
      if (!link) return;

      const hash = link.getAttribute('href');
      const target = resolveHash(hash);
      if (target === null) return;

      e.preventDefault();
      if (menuOpen) closeMenu({ returnFocus: false }); // un-inerts <main> synchronously
      scrollToTarget(target);

      // Move focus to the destination so the next Tab continues from there
      const el = target === 0 ? mainEl : target;
      if (el) {
        if (!el.matches('a, button, input, textarea, select, [tabindex]')) el.setAttribute('tabindex', '-1');
        el.focus({ preventScroll: true });
      }
    });
  }


  /* ------------------------------------------------------------------------
     04. CUSTOM CURSOR
     Dot follows tightly, ring trails with inertia (gsap.quickTo).
     States: hover (interactive), label (data-cursor-label), text (inputs).
     ------------------------------------------------------------------------ */
  function initCursor() {
    if (!FINE_POINTER || REDUCED) return;

    const cursor = $('.cursor');
    if (!cursor) return;
    const dot = $('.cursor__dot', cursor);
    const ring = $('.cursor__ring', cursor);
    const label = $('.cursor__label', cursor);

    document.documentElement.classList.add('has-cursor');
    gsap.set([dot, ring], { xPercent: -50, yPercent: -50 });

    const dotX = gsap.quickTo(dot, 'x', { duration: 0.12, ease: 'power3' });
    const dotY = gsap.quickTo(dot, 'y', { duration: 0.12, ease: 'power3' });
    const ringX = gsap.quickTo(ring, 'x', { duration: 0.55, ease: 'power3' });
    const ringY = gsap.quickTo(ring, 'y', { duration: 0.55, ease: 'power3' });

    let visible = false;
    window.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      if (!visible) {
        // Jump into place on first move so the ring doesn't fly in from (0,0)
        gsap.set([dot, ring], { x: e.clientX, y: e.clientY });
        cursor.classList.add('is-visible');
        visible = true;
      }
      dotX(e.clientX); dotY(e.clientY);
      ringX(e.clientX); ringY(e.clientY);
    }, { passive: true });

    document.documentElement.addEventListener('mouseleave', () => {
      cursor.classList.remove('is-visible');
      visible = false;
    });

    window.addEventListener('pointerdown', () => cursor.classList.add('is-down'));
    window.addEventListener('pointerup', () => cursor.classList.remove('is-down'));

    const INTERACTIVE = 'a, button, [data-magnetic], [role="button"], label';
    document.addEventListener('pointerover', (e) => {
      const t = e.target;
      if (!(t instanceof Element)) return;
      const labelEl = t.closest('[data-cursor-label]');
      const isText = !!t.closest('input, textarea');
      const isInteractive = !!t.closest(INTERACTIVE);

      cursor.classList.toggle('is-label', !!labelEl && !isInteractive);
      cursor.classList.toggle('is-hover', isInteractive && !isText);
      cursor.classList.toggle('is-text', isText);
      label.textContent = labelEl && !isInteractive ? labelEl.dataset.cursorLabel : '';
    });
  }


  /* ------------------------------------------------------------------------
     05. MAGNETIC ELEMENTS & BUTTON FILLS
     ------------------------------------------------------------------------ */
  function initMagnetic() {
    if (!FINE_POINTER || REDUCED) return;

    $$('[data-magnetic]').forEach((el) => {
      const strength = parseFloat(el.dataset.magnetic) || 0.35;
      const inner = $('[data-magnetic-inner]', el);
      const ease = 'elastic.out(1, 0.35)';

      const xTo = gsap.quickTo(el, 'x', { duration: 1, ease });
      const yTo = gsap.quickTo(el, 'y', { duration: 1, ease });
      const ixTo = inner ? gsap.quickTo(inner, 'x', { duration: 1, ease }) : null;
      const iyTo = inner ? gsap.quickTo(inner, 'y', { duration: 1, ease }) : null;

      let rect = null;
      el.addEventListener('pointerenter', () => { rect = el.getBoundingClientRect(); });
      el.addEventListener('pointermove', (e) => {
        if (!rect) rect = el.getBoundingClientRect();
        const x = e.clientX - (rect.left + rect.width / 2);
        const y = e.clientY - (rect.top + rect.height / 2);
        xTo(x * strength); yTo(y * strength);
        if (ixTo) { ixTo(x * strength * 0.45); iyTo(y * strength * 0.45); }
      });
      el.addEventListener('pointerleave', () => {
        rect = null;
        xTo(0); yTo(0);
        if (ixTo) { ixTo(0); iyTo(0); }
      });
    });
  }

  // Circular fill grows from the point where the pointer enters / leaves
  function initButtonFills() {
    $$('.btn').forEach((btn) => {
      const setOrigin = (e) => {
        const r = btn.getBoundingClientRect();
        btn.style.setProperty('--fx', `${e.clientX - r.left}px`);
        btn.style.setProperty('--fy', `${e.clientY - r.top}px`);
      };
      btn.addEventListener('pointerenter', setOrigin);
      btn.addEventListener('pointerleave', setOrigin);
    });
  }


  /* ------------------------------------------------------------------------
     06. PRELOADER & HERO INTRO
     ------------------------------------------------------------------------ */
  function buildHeroIntro() {
    const tl = gsap.timeline({ paused: true, defaults: { ease: 'expo.out' } });

    // Split the name into characters (each .line masks its chars)
    const chars = $$('.hero__title .js-split-chars').flatMap((el) => splitText(el).chars);

    if (REDUCED) {
      tl.fromTo(['.hero__title', '.hero [data-hero-fade]', '.nav'],
        { opacity: 0 }, { opacity: 1, duration: 0.6, clearProps: 'opacity' });
      return tl;
    }

    tl.fromTo(chars,
        { yPercent: 120, rotate: 6 },
        { yPercent: 0, rotate: 0, duration: 1.5, stagger: 0.045 }, 0)
      .fromTo('.hero__star',
        { scale: 0, rotate: -180 },
        { scale: 1, rotate: 0, duration: 1.4, ease: 'back.out(1.8)' }, 0.75)
      .fromTo('.hero [data-hero-fade]',
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.2, stagger: 0.1 }, 0.35)
      .fromTo('.hero__shape-inner',
        { scale: 0.4, opacity: 0 },
        { scale: 1, opacity: 1, duration: 1.8, stagger: 0.08 }, 0.1)
      .fromTo('.nav',
        { yPercent: -100, opacity: 0 },
        {
          yPercent: 0,
          opacity: 1,
          duration: 1.2,
          clearProps: 'transform,opacity',
          // GSAP owns the transform during the intro: pause the CSS transition,
          // then hand back a visible nav (not one CSS would slide out again)
          onStart: () => { nav.style.transition = 'none'; },
          onComplete: () => { nav.classList.remove('is-hidden'); nav.style.transition = ''; },
        }, 0.5);

    return tl;
  }

  function runPreloader(onReveal) {
    const pre = $('.preloader');
    if (!pre) { onReveal(); return; }

    const num = $('.preloader__num', pre);
    const bar = $('.preloader__bar', pre);
    const words = $$('.preloader__word', pre);
    const counter = { v: 0 };
    const LOAD = REDUCED ? 0.4 : 2.6;

    // Built paused — it starts once the display font is ready (see bottom)
    const tl = gsap.timeline({ paused: true, onComplete: () => pre.remove() });

    // Count 0 → 100 with the progress bar
    tl.to(counter, {
      v: 100,
      duration: LOAD,
      ease: 'power3.inOut',
      onUpdate: () => { num.textContent = Math.round(counter.v); },
    }, 0)
      .to(bar, { scaleX: 1, duration: LOAD, ease: 'power3.inOut' }, 0);

    if (REDUCED) {
      // Reduced motion: show the last word, then a short fade — no full-screen wipes
      gsap.set(words.slice(0, -1), { opacity: 0 });
      gsap.set(words[words.length - 1], { opacity: 1, yPercent: 0 });
      tl.to(pre, { autoAlpha: 0, duration: 0.3 }, '+=0.1').add(onReveal);
    } else {
      // Cycle the words: Design. → Build. → Scale.
      gsap.set(words, { yPercent: 105, opacity: 1 });
      const step = LOAD / words.length;
      words.forEach((w, i) => {
        tl.to(w, { yPercent: 0, duration: 0.45, ease: 'expo.out' }, i * step);
        if (i < words.length - 1) {
          tl.to(w, { yPercent: -105, duration: 0.35, ease: 'expo.in' }, (i + 1) * step - 0.35);
        }
      });

      // Exit: content rides up with the dark layer, revealing the lime layer, which wipes too
      tl.addLabel('exit', '+=0.15')
        .to('.preloader__inner', { yPercent: -30, opacity: 0, duration: 0.9, ease: 'expo.inOut' }, 'exit')
        .to('.preloader__layer--main', { yPercent: -100, duration: 1.1, ease: 'expo.inOut' }, 'exit')
        .to('.preloader__layer--accent', { yPercent: -100, duration: 1.1, ease: 'expo.inOut' }, 'exit+=0.18')
        .add(onReveal, 'exit+=0.55');
    }

    // Start once Syne is ready (no mid-count font swap), capped so a slow font can't stall the page
    const fontsReady = document.fonts && document.fonts.load
      ? Promise.race([
        document.fonts.load('800 1em Syne').catch(() => {}),
        new Promise((resolve) => setTimeout(resolve, 2500)),
      ])
      : Promise.resolve();
    fontsReady.then(() => tl.play());
  }


  /* ------------------------------------------------------------------------
     07. HERO PARALLAX (scroll + mouse)
     ------------------------------------------------------------------------ */
  function initParallax() {
    // Scroll parallax: higher data-speed = moves faster
    $$('[data-speed]').forEach((el) => {
      const speed = parseFloat(el.dataset.speed) || 0.5;
      const section = el.closest('section') || el;
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
    gsap.to('.hero__title', {
      yPercent: 22,
      opacity: 0.15,
      ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
    });

    // Mouse parallax on the floating shapes (desktop only)
    if (!FINE_POINTER) return;
    const hero = $('.hero');
    const shapes = $$('.hero__shape-inner').map((el) => ({
      x: gsap.quickTo(el, 'x', { duration: 1.4, ease: 'power3' }),
      y: gsap.quickTo(el, 'y', { duration: 1.4, ease: 'power3' }),
      depth: parseFloat(el.dataset.depth) || 20,
    }));
    hero.addEventListener('pointermove', (e) => {
      const nx = e.clientX / window.innerWidth - 0.5;
      const ny = e.clientY / window.innerHeight - 0.5;
      shapes.forEach((s) => { s.x(nx * s.depth); s.y(ny * s.depth); });
    });
  }


  /* ------------------------------------------------------------------------
     08. MARQUEE — infinite, direction & speed follow scroll velocity
     ------------------------------------------------------------------------ */
  function initMarquee() {
    const tracks = $$('[data-marquee]');
    if (!tracks.length) return;

    const rows = tracks.map((track) => {
      const group = $('.marquee__group', track);
      const clone = group.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      track.appendChild(clone); // two identical groups → wrap at -50%
      return {
        set: gsap.quickSetter(track, 'xPercent'),
        dir: parseFloat(track.dataset.marquee) || -1,
        x: -25,
      };
    });

    if (REDUCED) return;

    const wrap = gsap.utils.wrap(-50, 0);
    const BASE = 0.03; // % of track per frame @60fps
    let boost = 0;
    let scrollDir = 1;
    let active = false;

    ScrollTrigger.create({
      trigger: '.marquee',
      start: 'top bottom',
      end: 'bottom top',
      onToggle: (self) => { active = self.isActive; },
      onUpdate: (self) => {
        scrollDir = self.direction;
        boost = Math.min(Math.abs(self.getVelocity()) / 9000, 0.45);
      },
    });

    gsap.ticker.add(() => {
      if (!active) return;
      const dt = gsap.ticker.deltaRatio(60);
      rows.forEach((r) => {
        r.x = wrap(r.x + (BASE + boost) * r.dir * scrollDir * dt);
        r.set(r.x);
      });
      boost *= Math.pow(0.93, dt);
    });
  }


  /* ------------------------------------------------------------------------
     09. GENERIC REVEALS, SPLIT HEADINGS, WORD SCRUB, COUNTERS
     ------------------------------------------------------------------------ */
  function initReveals() {
    // Fade-up for anything tagged data-reveal (batched for natural stagger)
    gsap.set('[data-reveal]', { opacity: 0, y: 50 });
    ScrollTrigger.batch('[data-reveal]', {
      start: 'top 90%',
      once: true,
      onEnter: (batch) => gsap.to(batch, {
        opacity: 1, y: 0, duration: 1.1, ease: 'expo.out', stagger: 0.08, overwrite: true,
      }),
    });

    // Section headings: masked word slide-up
    $$('.js-split-words').forEach((el) => {
      const { inners } = splitText(el, { type: 'words', mask: true });
      gsap.fromTo(inners, { yPercent: 110 }, {
        yPercent: 0,
        duration: 1.2,
        ease: 'expo.out',
        stagger: 0.08,
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      });
    });

    // Contact title: masked chars per line (same treatment as the hero)
    $$('.contact__title .js-split-chars').forEach((el) => {
      const { chars } = splitText(el);
      gsap.fromTo(chars, { yPercent: 120 }, {
        yPercent: 0,
        duration: 1.3,
        ease: 'expo.out',
        stagger: 0.025,
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      });
    });

    // About statement: words light up as you scroll
    $$('.js-scrub-words').forEach((el) => {
      const { words } = splitText(el, { type: 'words' });
      gsap.fromTo(words, { opacity: 0.12 }, {
        opacity: 1,
        stagger: 0.05,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 45%', scrub: true },
      });
    });

    // Stat counters
    $$('.js-count').forEach((el) => {
      const end = parseFloat(el.dataset.count) || 0;
      const obj = { v: 0 };
      el.textContent = '0';
      ScrollTrigger.create({
        trigger: el,
        start: 'top 88%',
        once: true,
        onEnter: () => gsap.to(obj, {
          v: end,
          duration: 2,
          ease: 'power3.out',
          onUpdate: () => { el.textContent = Math.round(obj.v); },
        }),
      });
    });
  }


  /* ------------------------------------------------------------------------
     10. SKILLS CARDS — staggered 3D reveal + cursor spotlight
     ------------------------------------------------------------------------ */
  function initSkills() {
    const cards = $$('.skill-card');
    if (!cards.length) return;

    // Spotlight follows the pointer (CSS reads --mx / --my)
    cards.forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${e.clientX - r.left}px`);
        card.style.setProperty('--my', `${e.clientY - r.top}px`);
      });
    });

    if (REDUCED) return;

    gsap.set(cards, { opacity: 0, y: 90, rotateX: -18, transformOrigin: '50% 100%' });
    ScrollTrigger.batch(cards, {
      start: 'top 90%',
      once: true,
      onEnter: (batch) => {
        gsap.to(batch, {
          opacity: 1, y: 0, rotateX: 0, duration: 1.2, ease: 'expo.out', stagger: 0.1, overwrite: true,
        });
        gsap.from(batch.flatMap((c) => $$('.chip', c)), {
          opacity: 0, y: 14, duration: 0.6, ease: 'power3.out', stagger: 0.02, delay: 0.3,
        });
      },
    });
  }


  /* ------------------------------------------------------------------------
     11. EXPERIENCE — progress line, active entry, sticky counter
     ------------------------------------------------------------------------ */
  function initExperience() {
    const entries = $$('.entry');
    if (!entries.length) return;

    const current = $('.experience__current');
    const company = $('.experience__company');
    let activeIndex = 0;
    let swapTl = null;

    const setActive = (i) => {
      if (i === activeIndex || !current) return;
      const dir = i > activeIndex ? 1 : -1;
      activeIndex = i;
      if (REDUCED) {
        current.textContent = String(i + 1).padStart(2, '0');
        company.textContent = entries[i].dataset.company || '';
        return;
      }
      swapTl?.kill();
      swapTl = gsap.timeline()
        .to([current, company], { yPercent: -100 * dir, opacity: 0, duration: 0.25, ease: 'power2.in' })
        .add(() => {
          current.textContent = String(i + 1).padStart(2, '0');
          company.textContent = entries[i].dataset.company || '';
        })
        .fromTo([current, company], { yPercent: 100 * dir, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.5, ease: 'expo.out' });
    };

    // Timeline progress line
    gsap.fromTo('.timeline__progress', { scaleY: 0 }, {
      scaleY: 1,
      ease: 'none',
      scrollTrigger: { trigger: '.timeline', start: 'top 55%', end: 'bottom 55%', scrub: true },
    });

    entries.forEach((entry, i) => {
      if (!REDUCED) {
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
  }


  /* ------------------------------------------------------------------------
     12. WORK — pinned horizontal scroll (desktop) + 3D tilt cards
     ------------------------------------------------------------------------ */
  function initWork() {
    const section = $('.work');
    if (!section) return;

    const pin = $('.work__pin', section);
    const track = $('.work__track', section);
    const cards = $$('.card', track);
    const progressBar = $('.work__progress-bar', section);

    const mm = gsap.matchMedia();

    // Desktop: pin + translate the track horizontally
    mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
      section.classList.add('is-horizontal');

      const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);
      const setProgress = gsap.quickSetter(progressBar, 'scaleX');

      // Cache card centres for the inner-art parallax (recomputed on refresh)
      let cardData = [];
      const measure = () => {
        cardData = cards.map((card) => ({
          set: gsap.quickSetter($('.card__art', card), 'xPercent'),
          center: card.offsetLeft + card.offsetWidth / 2,
        }));
      };
      measure();

      const updateArt = () => {
        const x = gsap.getProperty(track, 'x');
        const vw = window.innerWidth;
        cardData.forEach((d) => {
          const rel = gsap.utils.clamp(-1.2, 1.2, (d.center + x - vw / 2) / vw);
          d.set(rel * -9);
        });
      };

      const hTween = gsap.to(track, {
        x: () => -distance(),
        ease: 'none',
        onUpdate() {
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

      const onRefresh = () => { measure(); updateArt(); };
      ScrollTrigger.addEventListener('refresh', onRefresh);
      updateArt();

      // Keyboard focus: bring the focused card into view by moving the page scroll
      // (the pin is overflow:clip, so the browser can't scroll it sideways itself)
      const onFocus = (e) => {
        const item = e.target.closest('.card, .work__outro');
        if (!item || !e.target.matches(':focus-visible')) return;
        pin.scrollLeft = 0; // only matters where the overflow:hidden fallback applies
        const st = hTween.scrollTrigger;
        const d = distance();
        if (!d) return;
        const tx = gsap.utils.clamp(0, d, item.offsetLeft - (window.innerWidth - item.offsetWidth) / 2);
        scrollToTarget(st.start + (tx / d) * (st.end - st.start), { immediate: true });
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
        ScrollTrigger.removeEventListener('refresh', onRefresh);
        track.removeEventListener('focusin', onFocus);
        section.classList.remove('is-horizontal');
        hTween.scrollTrigger?.kill();
        // quickSetter writes aren't recorded by matchMedia — clear them by hand
        gsap.set(cards.map((c) => $('.card__art', c)), { clearProps: 'transform' });
        gsap.set(progressBar, { clearProps: 'transform' });
      };
    });

    // Tablet / mobile / reduced motion: vertical stack with simple reveals
    mm.add('(max-width: 1023px), (prefers-reduced-motion: reduce)', () => {
      if (REDUCED) return;
      gsap.set(cards, { opacity: 0, y: 70 });
      ScrollTrigger.batch(cards, {
        start: 'top 90%',
        once: true,
        onEnter: (batch) => gsap.to(batch, {
          opacity: 1, y: 0, duration: 1.1, ease: 'expo.out', stagger: 0.1, overwrite: true,
        }),
      });
    });

    // Only run the SVG art micro-animations while the section is on screen (CSS reads .is-inview)
    ScrollTrigger.create({
      trigger: section,
      start: 'top bottom',
      end: 'bottom top',
      toggleClass: { targets: section, className: 'is-inview' },
    });
  }

  function initTilt() {
    if (!FINE_POINTER || REDUCED) return;

    $$('[data-tilt]').forEach((card) => {
      const inner = $('.card__inner', card);
      if (!inner) return;

      gsap.set(inner, { transformPerspective: 1000 });
      const rx = gsap.quickTo(inner, 'rotationX', { duration: 0.7, ease: 'power3' });
      const ry = gsap.quickTo(inner, 'rotationY', { duration: 0.7, ease: 'power3' });
      const MAX = 9; // degrees

      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        ry((px - 0.5) * MAX * 2);
        rx(-(py - 0.5) * MAX * 2);
        card.style.setProperty('--gx', `${px * 100}%`);
        card.style.setProperty('--gy', `${py * 100}%`);
      });
      card.addEventListener('pointerleave', () => { rx(0); ry(0); });
    });
  }


  /* ------------------------------------------------------------------------
     13. CREDENTIALS, FOOTER & MISC SCROLL EFFECTS
     ------------------------------------------------------------------------ */
  function initMisc() {
    if (REDUCED) return;

    // Football spins with scroll
    gsap.to('.interest__ball', {
      rotate: 360,
      ease: 'none',
      scrollTrigger: { trigger: '.creds', start: 'top bottom', end: 'bottom top', scrub: 1 },
    });

    // Footer name: lime fill wipes across the outline text
    $$('.footer__line').forEach((line, i) => {
      gsap.fromTo(line, { '--clip': '100%' }, {
        '--clip': '0%',
        ease: 'none',
        scrollTrigger: {
          trigger: '.footer',
          start: `top ${85 - i * 10}%`,
          end: 'bottom bottom',
          scrub: true,
        },
      });
    });
  }


  /* ------------------------------------------------------------------------
     14. NAVIGATION
     ------------------------------------------------------------------------ */
  const nav = $('#nav');
  const menu = $('#menu');
  const toggle = $('.nav__toggle');
  const mainEl = $('#main');
  let menuTl = null;

  function initNav() {
    // Background after scrolling a bit; hide on scroll down, show on scroll up
    ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => {
        const y = self.scroll();
        nav.classList.toggle('is-scrolled', y > 40);
        // Ignore the preloader phase (e.g. a deep-link jump) and never hide under keyboard focus
        if (menuOpen || document.body.classList.contains('is-loading')) return;
        if (self.direction === 1 && y > window.innerHeight * 0.6 && !nav.querySelector(':focus-visible')) {
          nav.classList.add('is-hidden');
        } else if (self.direction === -1) {
          nav.classList.remove('is-hidden');
        }
      },
    });

    // Highlight the link for the section in view
    const links = $$('.nav__link');
    $$('main section[id]').forEach((sec) => {
      ScrollTrigger.create({
        trigger: sec,
        start: 'top 50%',
        end: 'bottom 50%',
        onToggle: (self) => {
          if (!self.isActive) return;
          links.forEach((l) => l.classList.toggle('is-active', l.getAttribute('href') === `#${sec.id}`));
        },
      });
    });

    // Mobile menu
    toggle.addEventListener('click', () => (menuOpen ? closeMenu() : openMenu()));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && menuOpen) closeMenu(); });
    window.matchMedia('(min-width: 1024px)').addEventListener('change', (e) => {
      if (e.matches && menuOpen) closeMenu({ returnFocus: false });
    });
  }

  // Circle centred on the toggle, with a radius that reaches the farthest viewport corner
  function menuGeometry() {
    const r = toggle.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const full = Math.hypot(Math.max(cx, window.innerWidth - cx), Math.max(cy, window.innerHeight - cy)) + 2;
    return { at: `${cx}px ${cy}px`, full };
  }

  // Everything outside the nav + menu is inert while the menu is open
  function setPageInert(state) {
    [mainEl, $('.footer'), $('.skip-link')].forEach((el) => { if (el) el.inert = state; });
  }

  function openMenu() {
    menuOpen = true;

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
    lenis?.stop();
    document.documentElement.style.overflow = 'hidden';

    menuTl?.kill();
    if (REDUCED) {
      menuTl = gsap.timeline().fromTo(menu, { clipPath: 'none', opacity: 0 }, { opacity: 1, duration: 0.3 });
    } else {
      const { at, full } = menuGeometry();
      menuTl = gsap.timeline()
        .fromTo(menu, { clipPath: `circle(0px at ${at})` }, { clipPath: `circle(${full}px at ${at})`, duration: 0.9, ease: 'expo.inOut' })
        .fromTo('.menu__link > span', { yPercent: 110 }, { yPercent: 0, duration: 0.9, ease: 'expo.out', stagger: 0.06 }, 0.3)
        .fromTo('.menu__footer', { opacity: 0 }, { opacity: 1, duration: 0.6 }, 0.6);
    }

    $('.menu__link')?.focus({ preventScroll: true });
  }

  function closeMenu({ returnFocus = true } = {}) {
    if (!menuOpen) return;
    menuOpen = false;
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open menu');
    menu.setAttribute('aria-hidden', 'true');
    nav.classList.remove('menu-open');
    setPageInert(false);
    document.documentElement.style.overflow = '';
    lenis?.start();

    menuTl?.kill();
    const done = () => { menu.classList.remove('is-open'); gsap.set(menu, { clearProps: 'opacity' }); };
    menuTl = REDUCED
      ? gsap.timeline({ onComplete: done }).to(menu, { opacity: 0, duration: 0.25 })
      : gsap.timeline({ onComplete: done }).to(menu, { clipPath: `circle(0px at ${menuGeometry().at})`, duration: 0.7, ease: 'expo.inOut' });

    if (returnFocus) toggle.focus({ preventScroll: true });
  }

  // Minimal class-based menu for the static (no-GSAP) fallback
  function initStaticMenu() {
    const tgl = $('.nav__toggle');
    const mnu = $('#menu');
    if (!tgl || !mnu) return;
    const setMenu = (open) => {
      mnu.classList.toggle('is-open', open);
      mnu.style.clipPath = open ? 'none' : '';
      mnu.setAttribute('aria-hidden', String(!open));
      tgl.setAttribute('aria-expanded', String(open));
      tgl.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    };
    tgl.addEventListener('click', () => setMenu(!mnu.classList.contains('is-open')));
    mnu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
  }


  /* ------------------------------------------------------------------------
     15. CONTACT FORM, COPY-TO-CLIPBOARD, CLOCK
     ------------------------------------------------------------------------ */
  function initForm() {
    const form = $('#contactForm');
    if (!form) return;

    const status = $('.form__status', form);
    const required = $$('[required]', form);

    const setStatus = (msg, type) => {
      status.textContent = msg;
      status.classList.toggle('is-success', type === 'success');
      status.classList.toggle('is-error', type === 'error');
    };

    const validate = (input) => {
      const ok = input.value.trim() !== '' && input.checkValidity();
      const field = input.closest('.field');
      const error = $('.field__error', field);
      field.classList.toggle('is-invalid', !ok);
      input.setAttribute('aria-invalid', String(!ok));
      if (error) {
        if (ok) input.removeAttribute('aria-describedby');
        else input.setAttribute('aria-describedby', error.id);
      }
      return ok;
    };

    required.forEach((input) => {
      input.addEventListener('blur', () => { if (input.value) validate(input); });
      input.addEventListener('input', () => {
        if (input.closest('.field').classList.contains('is-invalid')) validate(input);
      });
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const invalid = required.filter((input) => !validate(input));
      if (invalid.length) {
        setStatus('Please fill in the highlighted fields.', 'error');
        if (!REDUCED && window.gsap) {
          gsap.fromTo(invalid.map((i) => i.closest('.field')), { x: -10 }, {
            x: 0, duration: 0.7, ease: 'elastic.out(1, 0.3)', clearProps: 'x',
          });
        }
        invalid[0].focus();
        return;
      }

      const data = Object.fromEntries(new FormData(form));
      const endpoint = form.dataset.endpoint;

      // Optional: POST to a form service if data-endpoint is set on <form>
      if (endpoint) {
        try {
          setStatus('Sending…');
          const res = await fetch(endpoint, {
            method: 'POST',
            headers: { Accept: 'application/json' },
            body: new FormData(form),
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          setStatus('Thanks — your message is on its way. I\'ll reply soon.', 'success');
          form.reset();
        } catch (err) {
          setStatus(`Something went wrong. Please email me directly at ${EMAIL}.`, 'error');
        }
        return;
      }

      // Default: open the visitor's mail client with everything pre-filled
      const subject = (data.subject || '').trim() || `Portfolio enquiry from ${data.name.trim()}`;
      const body = `${data.message.trim()}\n\n— ${data.name.trim()}\n${data.email.trim()}`;
      window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      setStatus(`Opening your email app… If nothing happens, email ${EMAIL} directly.`, 'success');
    });
  }

  function initCopy() {
    const status = $('.js-copy-status');

    $$('[data-copy]').forEach((btn) => {
      const label = $('.copy-btn__text', btn) || btn;
      const original = label.textContent;
      let timer = null;

      btn.addEventListener('click', async () => {
        const text = btn.dataset.copy;
        let ok = false;
        try {
          await navigator.clipboard.writeText(text);
          ok = true;
        } catch (e) {
          // Fallback for non-secure contexts / denied clipboard permission
          const prev = document.activeElement;
          const ta = document.createElement('textarea');
          ta.value = text;
          ta.setAttribute('readonly', '');
          ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
          document.body.appendChild(ta);
          ta.select();
          try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
          ta.remove();
          prev?.focus?.({ preventScroll: true }); // don't drop keyboard focus to <body>
          if (!ok) {
            // Select the visible address so the "press ⌘C" hint actually works
            const addr = $('.contact__email');
            if (addr) window.getSelection().selectAllChildren(addr);
          }
        }
        label.textContent = ok ? 'Copied!' : 'Press ⌘/Ctrl+C';
        if (status) {
          status.textContent = ok
            ? 'Email address copied to the clipboard.'
            : 'Could not copy automatically. The email address is selected; press Command or Control plus C.';
        }
        btn.classList.toggle('is-copied', ok);
        clearTimeout(timer);
        timer = setTimeout(() => {
          label.textContent = original;
          btn.classList.remove('is-copied');
          if (status) status.textContent = '';
        }, 1800);
      });
    });
  }

  function initClock() {
    const els = $$('.js-local-time');
    if (els.length) {
      const fmt = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Karachi', hour: '2-digit', minute: '2-digit', hour12: false,
      });
      const tick = () => {
        const t = fmt.format(new Date());
        els.forEach((el) => { el.textContent = t; });
      };
      tick();
      setInterval(tick, 10000);
    }
    $$('.js-year').forEach((el) => { el.textContent = new Date().getFullYear(); });
  }


  /* ------------------------------------------------------------------------
     16. INIT
     ------------------------------------------------------------------------ */
  function init() {
    initSmoothScroll();
    initAnchors();
    initCursor();
    initMagnetic();
    initButtonFills();
    initClock();
    initCopy();
    initForm();

    // Hero intro is built first so its "from" states hide the hero behind the preloader
    const heroTl = buildHeroIntro();

    // Pinned section first so every trigger below it accounts for the pin spacing
    initWork();
    initTilt();
    if (!REDUCED) initParallax();
    initMarquee();
    if (!REDUCED) initReveals();
    else $$('.js-count').forEach((el) => { el.textContent = el.dataset.count; });
    initSkills();
    initExperience();
    initMisc();
    initNav();

    runPreloader(() => {
      document.body.classList.remove('is-loading');
      lenis?.start();
      nav.classList.remove('is-hidden');
      heroTl.play();
      ScrollTrigger.refresh();

      // Honour deep links like index.html#work once layout is final
      const target = resolveHash(window.location.hash);
      if (target !== null) {
        requestAnimationFrame(() => scrollToTarget(target, { immediate: true }));
      }
    });

    // Fonts & late assets change layout → recalculate trigger positions
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => ScrollTrigger.refresh());
    }
    window.addEventListener('load', () => ScrollTrigger.refresh());
  }

  init();
})();

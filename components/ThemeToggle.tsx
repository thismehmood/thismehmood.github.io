'use client';

/* ==========================================================================
   Theme toggle — sun / moon button in the nav.
   - The icon is driven by CSS from html[data-theme], so server and client
     markup always match (no hydration mismatch, no flash).
   - Switching uses the View Transitions API: the new theme is revealed in a
     circle growing from the button. Reduced motion / unsupported browsers
     switch instantly.
   ========================================================================== */

import { useEffect, useId, useRef, useState } from 'react';
import { prefersReducedMotion } from '@/lib/motion';
import { applyTheme, getTheme, type Theme } from '@/lib/theme';

export default function ThemeToggle() {
  const buttonRef = useRef<HTMLButtonElement>(null);
  // Unknown until mount (the server can't know the visitor's saved theme)
  const [theme, setTheme] = useState<Theme | null>(null);
  // The running view transition, if any — a second one can't start until it finishes
  const transitionRef = useRef<ViewTransition | null>(null);
  const maskId = `theme-moon-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;

  useEffect(() => { setTheme(getTheme()); }, []);

  const toggle = () => {
    // Ignore presses during the reveal: overlapping transitions flash the page and,
    // with a text selection, can crash Chrome's renderer
    if (transitionRef.current) return;
    const next: Theme = getTheme() === 'dark' ? 'light' : 'dark';
    const commit = () => applyTheme(next);

    if (typeof document.startViewTransition !== 'function' || prefersReducedMotion()) {
      commit();
      setTheme(next);
      return;
    }

    // Circle reveal from the button's centre out to the farthest viewport corner
    const r = buttonRef.current?.getBoundingClientRect();
    const x = r ? r.left + r.width / 2 : window.innerWidth / 2;
    const y = r ? r.top + r.height / 2 : 0;
    const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));

    const transition = document.startViewTransition(commit);
    transitionRef.current = transition;

    // During the transition every pointer hit lands on <html>: stop presses from
    // selecting page text or stealing focus from the toggle
    const blockPress = (e: MouseEvent) => e.preventDefault();
    document.addEventListener('mousedown', blockPress, true);
    transition.finished.finally(() => {
      document.removeEventListener('mousedown', blockPress, true);
      if (transitionRef.current === transition) transitionRef.current = null;
    });

    transition.ready
      .then(() => {
        document.documentElement.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
          { duration: 750, easing: 'cubic-bezier(0.65, 0, 0.35, 1)', pseudoElement: '::view-transition-new(root)' },
        );
      })
      .catch(() => { /* transition skipped — the theme is already applied */ });
    setTheme(next);
  };

  const label = theme === null ? 'Toggle colour theme' : `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`;

  return (
    <button
      ref={buttonRef}
      type="button"
      className="theme-toggle"
      onClick={toggle}
      // Holding Enter/Space would otherwise flip the theme on every key repeat
      onKeyDown={(e) => { if (e.repeat && (e.key === 'Enter' || e.key === ' ')) e.preventDefault(); }}
      aria-label={label}
      title={label}
      data-magnetic="0.35"
    >
      <svg className="theme-toggle__icon" viewBox="0 0 24 24" aria-hidden="true" data-magnetic-inner="">
        <mask id={maskId}>
          <rect x="0" y="0" width="24" height="24" fill="#fff" />
          {/* Slides over the disc in dark mode to carve the crescent moon */}
          <circle className="theme-toggle__cut" cx="17" cy="7" r="6" fill="#000" />
        </mask>
        <circle className="theme-toggle__core" cx="12" cy="12" r="5" fill="currentColor" mask={`url(#${maskId})`} />
        <g className="theme-toggle__rays" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M12 1.5v2M12 20.5v2M1.5 12h2M20.5 12h2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M4.6 19.4 6 18M18 6l1.4-1.4" />
        </g>
      </svg>
    </button>
  );
}

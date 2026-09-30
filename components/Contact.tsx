'use client';

/* ==========================================================================
   06 — Contact
   Port of index.html §06 + main.js §09 (reveals, masked title chars) and
   §15 (copy-to-clipboard, clock, form — see CopyButton / LocalTime / ContactForm).
   ========================================================================== */

import { useRef } from 'react';
import { useGSAP } from '@/lib/gsap';
import { isStaticMode, prefersReducedMotion } from '@/lib/motion';
import { revealChars, revealOnScroll } from '@/lib/animations';
import { contact, sections, site } from '@/lib/data';
import SplitText from '@/components/SplitText';
import LocalTime from '@/components/LocalTime';
import CopyButton from '@/components/CopyButton';
import ContactForm from '@/components/ContactForm';

export default function Contact() {
  const rootRef = useRef<HTMLElement>(null);
  const emailRef = useRef<HTMLAnchorElement>(null);

  useGSAP(
    () => {
      const root = rootRef.current;
      // Reveals are skipped for reduced motion (content stays visible) and in the static fallback
      if (!root || prefersReducedMotion() || isStaticMode()) return;

      revealOnScroll(Array.from(root.querySelectorAll('[data-reveal]')));

      // Title: masked chars per line (each line has its own trigger, like the hero)
      root.querySelectorAll('.contact__title .js-split-chars').forEach((el) => revealChars(el));
    },
    { scope: rootRef },
  );

  const lastLine = contact.titleLines.length - 1;

  return (
    <section className="contact section" id="contact" ref={rootRef}>
      <div className="container">
        <p className="section-label" data-reveal>
          <span className="num">{sections.contact.num}</span> {sections.contact.label}
        </p>

        {/* The ' ' between the block-level lines keeps the heading's accessible name spaced */}
        <h2 className="contact__title">
          {contact.titleLines.map((line, i) => (
            <span className="line" key={line}>
              {i > 0 && ' '}
              <SplitText text={line} as={i === lastLine ? 'em' : 'span'} className="js-split-chars" />
            </span>
          ))}
        </h2>

        <div className="contact__grid">
          <div className="contact__info">
            <p className="contact__kicker" data-reveal>{contact.kicker}</p>

            <div className="contact__email-row" data-reveal>
              <a className="contact__email" href={`mailto:${site.email}`} ref={emailRef}>
                {site.email}
              </a>
              <CopyButton text={site.email} selectOnFail={emailRef} />
            </div>

            <dl className="contact__details" data-reveal>
              <div>
                <dt>Phone</dt>
                <dd><a href={site.phone.href}>{site.phone.display}</a></dd>
              </div>
              <div>
                <dt>Location</dt>
                <dd>{site.location}</dd>
              </div>
              <div>
                <dt>Local time</dt>
                <dd><LocalTime /> {site.tzLabel}</dd>
              </div>
            </dl>

            {/* Magnetic social icons */}
            <ul className="socials" data-reveal>
              <li>
                <a className="social" href={`mailto:${site.email}`} aria-label="Email" data-magnetic="0.5">
                  <span data-magnetic-inner>
                    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
                      <path d="m3.5 6.5 8.5 6.5 8.5-6.5" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                    </svg>
                  </span>
                </a>
              </li>
              <li>
                <a
                  className="social"
                  href={site.links.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn (opens in a new tab)"
                  data-magnetic="0.5"
                >
                  <span data-magnetic-inner>
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        fill="currentColor"
                        d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z"
                      />
                    </svg>
                  </span>
                </a>
              </li>
              <li>
                <a
                  className="social"
                  href={site.links.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub (opens in a new tab)"
                  data-magnetic="0.5"
                >
                  <span data-magnetic-inner>
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        fill="currentColor"
                        d="M12 .3a12 12 0 0 0-3.8 23.38c.6.12.82-.26.82-.58l-.02-2.04c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.74.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5 1 .1-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.14-.3-.54-1.52.1-3.18 0 0 1-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.28-1.55 3.29-1.23 3.29-1.23.64 1.66.24 2.88.12 3.18a4.65 4.65 0 0 1 1.23 3.22c0 4.61-2.8 5.63-5.48 5.92.42.36.81 1.1.81 2.22l-.01 3.29c0 .32.21.7.82.58A12 12 0 0 0 12 .3Z"
                      />
                    </svg>
                  </span>
                </a>
              </li>
              <li>
                <a className="social" href={site.phone.href} aria-label="Phone" data-magnetic="0.5">
                  <span data-magnetic-inner>
                    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path
                        d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </a>
              </li>
            </ul>
          </div>

          <ContactForm email={site.email} />
        </div>
      </div>
    </section>
  );
}

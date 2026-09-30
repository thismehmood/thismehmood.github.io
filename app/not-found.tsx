import type { Metadata } from 'next';
import { site } from '@/lib/data';

export const metadata: Metadata = {
  title: `Page not found — ${site.name}`,
};

/* Branded 404. AppProvider unlocks scrolling on routes without a preloader. */
export default function NotFound() {
  return (
    <main id="main" className="section not-found">
      <div className="container">
        <p className="section-label"><span className="num">404</span> Not found</p>
        <h1 className="section-title">
          This route isn&apos;t <em className="accent">deployed</em>.
        </h1>
        <p className="not-found__text">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
        {/* Full page load so the home page runs its preloader + intro from a clean state */}
        <a href="/" className="btn btn--primary" data-magnetic="0.35">
          <span className="btn__label" data-magnetic-inner>
            Back to home
            <svg className="btn__arrow" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </a>
      </div>
    </main>
  );
}

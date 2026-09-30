import type { Metadata } from 'next';
import { site } from '@/lib/data';
import Corners from '@/components/Corners';
import Monogram from '@/components/Monogram';

export const metadata: Metadata = {
  title: `Page not found — ${site.name}`,
};

/* Branded 404 (styles: .nf in app/styles/footer.css). AppProvider unlocks scrolling on
   routes without a preloader. Links are full page loads so the home page runs its
   preloader + intro from a clean state. */
export default function NotFound() {
  return (
    <>
      <div className="gridlines" aria-hidden="true" />
      <main id="main" className="section not-found nf">
        <div className="nf__brand">
          <div className="container">
            <a href="/" className="nf__brand-link">
              <Monogram />
              {site.name}
            </a>
          </div>
        </div>

        <div className="container nf__grid">
          <div>
            <p className="section-label"><span className="num">404</span> Not found</p>
            <h1 className="section-title">
              This route isn’t <em className="accent">deployed</em>.
            </h1>
            <p className="not-found__text">The page you’re looking for doesn’t exist or has moved.</p>
            <a href="/" className="btn btn--primary" data-magnetic="0.35">
              <span className="btn__label" data-magnetic-inner>
                Back to home
                <svg className="btn__arrow" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </a>
          </div>

          {/* Decorative request trace */}
          <div className="nf__panel" aria-hidden="true">
            <Corners />
            <div className="nf__bar">
              <span>Request trace</span>
              <span className="nf__status">Not found</span>
            </div>
            <span className="nf__code">404</span>
            <ol className="nf__log">
              <li className="is-ok"><span>› resolve host</span><span>ok</span></li>
              <li className="is-ok"><span>› boot runtime</span><span>ok</span></li>
              <li><span>› match route</span><span>miss</span></li>
              <li className="is-err"><span>× respond</span><span>404</span></li>
            </ol>
          </div>
        </div>
      </main>
    </>
  );
}

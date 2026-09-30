import Cursor from '@/components/Cursor';
import Preloader from '@/components/Preloader';
import Nav from '@/components/Nav';
import Hero from '@/components/Hero';
import Marquee from '@/components/Marquee';
import About from '@/components/About';
import Skills from '@/components/Skills';
import Experience from '@/components/Experience';
import Work from '@/components/Work';
import Credentials from '@/components/Credentials';
import Contact from '@/components/Contact';
import Footer from '@/components/Footer';

/*
 * Section order matters: each section creates its ScrollTriggers on mount in
 * this order, and the pinned Work section uses refreshPriority so triggers
 * further down always account for its pin spacing.
 */
export default function Home() {
  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <Cursor />
      <div className="grain" aria-hidden="true" />
      <Preloader />
      <Nav />

      <main id="main">
        <Hero />
        <Marquee />
        <About />
        <Skills />
        <Experience />
        <Work />
        <Credentials />
        <Contact />
      </main>

      <Footer />
    </>
  );
}

/* ==========================================================================
   GSAP setup — import gsap / ScrollTrigger / useGSAP from here so plugins are
   always registered exactly once (client-side only).
   ========================================================================== */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
  ScrollTrigger.config({ ignoreMobileResize: true });
}

export { gsap, ScrollTrigger, useGSAP };

import type { CSSProperties } from 'react';
import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import localFont from 'next/font/local';
import AppProvider from '@/components/AppProvider';
import { site } from '@/lib/data';
import './globals.css';

/* Self-hosted variable fonts.
 * Display: Bricolage Grotesque's latin subset, instanced to the weights the site uses
 * (wght 500–600; optical sizing kept — the hero, marquee, menu and preloader use
 * font-optical-sizing: auto). 62 KB instead of the 77 KB full-axis file the preloader
 * waits for. The weight descriptor must match the file, or browsers fake the bold.
 * Regenerated with fontTools from the Google Fonts latin woff2:
 *   font = instancer.instantiateVariableFont(TTFont(src), {'wght': (500, 600)})
 *   font.flavor = 'woff2'; font.save('app/fonts/bricolage-500-600.woff2')
 */
const bricolage = localFont({ src: './fonts/bricolage-500-600.woff2', weight: '500 600', style: 'normal', display: 'swap' }); // display
const geist = Geist({ subsets: ['latin'], display: 'swap' }); // body
const geistMono = Geist_Mono({ subsets: ['latin'], display: 'swap' }); // labels / annotations

/*
 * Font CSS variables used by globals.css (--font-display / --font-body / --font-mono).
 * Only the self-hosted face is exposed — not next/font's metric-matched local(Arial)
 * "… Fallback" face. That face would sit in front of the CSS fallback stack and supply
 * glyphs the latin subsets lack (e.g. the "→" in the experience bullets, chips and the
 * Work hint) from Arial instead of system-ui, unlike the original. The preloader waits
 * for the fonts before it starts, so the metric matching isn't needed to avoid shifts.
 */
const face = (font: { style: { fontFamily: string } }) => font.style.fontFamily.split(',')[0].trim();
const fontVars = {
  '--font-bricolage': face(bricolage),
  '--font-geist': face(geist),
  '--font-geist-mono': face(geistMono),
} as CSSProperties;

export const metadata: Metadata = {
  title: `${site.name} — ${site.title}`,
  description: site.description,
  openGraph: {
    type: 'website',
    title: `${site.name} — ${site.title}`,
    description: 'AI automations, AI agents and the cloud-native systems that run them.',
  },
  // The site ships its own dark theme: ask Dark Reader not to recolour it
  other: { 'darkreader-lock': 'true' },
};

export const viewport: Viewport = {
  themeColor: '#0E100F',
};

/*
 * Runs before first paint:
 * 1. flags JS as available ('no-js' → 'js') to gate animation-only styles;
 *    and turns off scroll restoration so a reload can't pre-fire the scroll reveals
 *    behind the preloader (the app starts every visit at the top);
 * 2. failsafe — if the app hasn't started within 7s, drop the preloader and show the static page.
 */
const bootScript = `
document.documentElement.classList.replace('no-js','js');
try{history.scrollRestoration='manual'}catch(e){}
window.__pf=setTimeout(function(){
  if(window.__appStarted)return;
  document.documentElement.classList.add('no-gsap');
  if(document.body)document.body.classList.remove('is-loading');
},7000);`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="no-js" style={fontVars} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body className="is-loading" suppressHydrationWarning>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}

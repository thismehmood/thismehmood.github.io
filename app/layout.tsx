import type { CSSProperties } from 'react';
import type { Metadata, Viewport } from 'next';
import { JetBrains_Mono, Space_Grotesk, Syne } from 'next/font/google';
import AppProvider from '@/components/AppProvider';
import { site } from '@/lib/data';
import { DEFAULT_THEME, themeBootScript } from '@/lib/theme';
import './globals.css';

/* Self-hosted Google fonts (variable) */
const syne = Syne({ subsets: ['latin'], display: 'swap' });
const grotesk = Space_Grotesk({ subsets: ['latin'], display: 'swap' });
const jetbrains = JetBrains_Mono({ subsets: ['latin'], display: 'swap' });

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
  '--font-syne': face(syne),
  '--font-grotesk': face(grotesk),
  '--font-jetbrains': face(jetbrains),
} as CSSProperties;

export const metadata: Metadata = {
  title: `${site.name} — ${site.title}`,
  description: site.description,
  openGraph: {
    type: 'website',
    title: `${site.name} — ${site.title}`,
    description: 'Distributed systems, Python & cloud-native infrastructure.',
  },
  // The site ships its own dark theme: ask Dark Reader not to recolour it
  other: { 'darkreader-lock': 'true' },
};

export const viewport: Viewport = {
  themeColor: '#0B0C10',
};

/*
 * Runs before first paint:
 * 1. flags JS as available ('no-js' → 'js') to gate animation-only styles;
 *    and turns off scroll restoration so a reload can't pre-fire the scroll reveals
 *    behind the preloader (the app starts every visit at the top);
 * 2. applies the saved light/dark theme (lib/theme.ts) so there's no flash;
 * 3. failsafe — if the app hasn't started within 7s, drop the preloader and show the static page.
 */
const bootScript = `
document.documentElement.classList.replace('no-js','js');
try{history.scrollRestoration='manual'}catch(e){}
${themeBootScript}
window.__pf=setTimeout(function(){
  if(window.__appStarted)return;
  document.documentElement.classList.add('no-gsap');
  if(document.body)document.body.classList.remove('is-loading');
},7000);`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="no-js" data-theme={DEFAULT_THEME} style={fontVars} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body className="is-loading" suppressHydrationWarning>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}

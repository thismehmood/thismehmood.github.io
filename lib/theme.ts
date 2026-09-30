/* ==========================================================================
   Light / dark theme.
   The theme lives on <html data-theme="…">; every colour in app/globals.css
   derives from it. The <head> boot script (app/layout.tsx) applies the saved
   choice before first paint, so there is no flash.
   ========================================================================== */

export type Theme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'theme';
/** The site is designed dark-first; visitors can switch and the choice is remembered. */
export const DEFAULT_THEME: Theme = 'dark';
/** Browser UI colour (address bar etc.) per theme — matches --bg in globals.css. */
export const THEME_COLOR: Record<Theme, string> = { dark: '#0B0C10', light: '#F3F3EE' };

/**
 * Inline, dependency-free version for the <head> boot script (runs before React):
 * applies the saved theme and the matching browser UI colour before first paint.
 */
export const themeBootScript = `
(function(){
  var t;try{t=localStorage.getItem('${THEME_STORAGE_KEY}');}catch(e){}
  if(t!=='light'&&t!=='dark')t='${DEFAULT_THEME}';
  document.documentElement.dataset.theme=t;
  var m=document.querySelector('meta[name="theme-color"]');
  if(m)m.content=t==='light'?'${THEME_COLOR.light}':'${THEME_COLOR.dark}';
})();`;

export function getTheme(): Theme {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

/** Apply a theme to the document (and the browser UI colour) and remember it. */
export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  syncThemeColor(theme);
  try { localStorage.setItem(THEME_STORAGE_KEY, theme); } catch { /* private mode etc. */ }
}

export function syncThemeColor(theme: Theme = getTheme()) {
  document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((meta) => {
    meta.content = THEME_COLOR[theme];
  });
}

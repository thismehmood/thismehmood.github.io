# Mehmood Ul Hassan — Portfolio

Animated personal portfolio built with **Next.js 16 (App Router)**, **React 19**, **TypeScript**,
**GSAP 3 + ScrollTrigger** and **Lenis** smooth scrolling.

Preloader with a 0–100% counter, split-text hero reveal, custom cursor, magnetic buttons,
scroll-velocity marquee, pinned horizontal project gallery with 3D tilt cards, sticky
experience timeline, floating-label contact form, light/dark theme toggle — fully responsive,
keyboard accessible, and respectful of `prefers-reduced-motion`.

## Requirements

- Node.js **20.9+**
- npm

## Scripts

```bash
npm install          # install dependencies
npm run dev          # dev server on http://localhost:3000
npm run build        # production build (the page is prerendered as static HTML)
npm start            # serve the production build
npm run typecheck    # TypeScript only
```

## Deploy

The site is fully static, so it deploys anywhere Next.js runs:

- **Vercel** — import the repo; no configuration needed.
- **Any Node host** — `npm run build && npm start`.

## Customise

| What | Where |
|---|---|
| All text content (bio, skills, experience, projects, credentials, section titles) | `lib/data.ts` |
| Résumé PDF behind "Download CV" | replace `public/Mehmood_Ul_Hassan_Resume.pdf` (path in `site.resume`) |
| Colours, spacing, type scale | CSS custom properties at the top of `app/globals.css` — dark tokens in `:root`, light overrides in `:root[data-theme="light"]` |
| Default theme / theme colours | `lib/theme.ts` (`DEFAULT_THEME` is `'dark'`; set it to `'light'` to flip the default) |
| Fonts | `app/layout.tsx` (`next/font/google`) |
| Contact form backend | By default the form opens the visitor's mail app. To POST to a form service (Formspree, Getform…), copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_FORM_ENDPOINT` **before `npm run build`** — it is inlined at build time. |

## How it's put together

```
app/
  layout.tsx        fonts, metadata, <head> boot script, <AppProvider>
  page.tsx          section order
  not-found.tsx     branded 404
  globals.css       the whole design system (class names shared by all components)
components/
  AppProvider.tsx   Lenis ↔ ScrollTrigger, preloader→hero "revealed" state,
                    in-page anchor scrolling + focus, mobile-menu registry,
                    global magnetic hover / button fills
  ThemeToggle.tsx   light/dark switch (View Transitions reveal)
  Preloader, Cursor, Nav, Hero, Marquee, About, Skills, Experience,
  Work (+ ProjectArt), Credentials, Contact (+ ContactForm, CopyButton), Footer
  SplitText.tsx     server-rendered word/char splitting for text reveals
lib/
  data.ts           content
  gsap.ts           GSAP + plugin registration (import gsap from here)
  animations.ts     shared scroll reveals (fade-up, word/char reveals, count-up)
  interactions.ts   magnetic hover + button fills
  motion.ts         reduced-motion / fine-pointer / static-mode checks
  theme.ts          light/dark theme: default, storage, boot script, browser UI colour
```

- Each section owns its animations inside `useGSAP`, so everything is reverted on unmount
  (safe under React Strict Mode and Fast Refresh).
- **Theme:** `<html data-theme>` drives every colour. A `<head>` script applies the saved choice
  (`localStorage`) before first paint, so there is no flash. `--accent` is the lime *fill* in both
  themes; `--accent-fg` is the accent used as text/lines (lime in dark, purple in light, for contrast).
  Switching uses a View Transition circle reveal from the toggle (instant with reduced motion).
- The Work section pins with `refreshPriority: 1` so every ScrollTrigger below it accounts
  for the pin spacing.
- **Reduced motion:** no smooth scroll, pinning or parallax; content is shown directly and the
  preloader simply fades.
- **Fallbacks:** without JavaScript the page renders statically (the preloader is hidden by
  CSS and the form falls back to `mailto:`). If the app hasn't started within 7 seconds (e.g. a
  very slow connection), a tiny script in `<head>` hides the preloader and shows the static page.
- GSAP is pinned to **3.13.0**: 3.14+ resets the scroll position to the top when the viewport
  crosses the 1024px breakpoint (rotation / window resize) with this `matchMedia` setup.

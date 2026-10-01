# Mehmood Ul Hassan — Portfolio

Animated personal portfolio built with **Next.js 16 (App Router)**, **React 19**, **TypeScript**,
**GSAP 3 + ScrollTrigger** and **Lenis** smooth scrolling.

Positioned for a Senior Full Stack Engineer building AI automations and AI agents, with a
"systems schematic" look: a terminal boot-sequence preloader, a crosshair cursor, a nav with
a scroll pipeline, an interactive **Agent mesh** canvas in the hero, a slim scroll-velocity
"run log" marquee, a scroll-lit statement, a Stack grid led by the AI & Automation focus card,
a pinned horizontal project gallery (with **Octopus** as the featured project) and 3D tilt
cards, an experience timeline drawn as a pipeline, and a floating-label contact form. Fully
responsive, keyboard accessible, and respectful of `prefers-reduced-motion`.

## Requirements

- Node.js **20.9+**
- npm

## Scripts

```bash
npm install          # install dependencies
npm run dev          # dev server on http://localhost:3000
npm run build        # static export to out/ (next.config.ts: output 'export')
npx serve out        # preview the exported site locally
npm run typecheck    # TypeScript only
```

## Deploy

Pushing to `main` runs `.github/workflows/deploy.yml`: `npm ci` → `next build` (static export to
`out/`) → GitHub Pages. The repo's Pages source must be **Settings → Pages → Build and deployment →
Source: GitHub Actions**. `out/` is plain static HTML, so any static host works too.

## Customise

| What | Where |
|---|---|
| All text content (bio, skills, experience, projects, credentials, section titles, marquee terms) | `lib/data.ts` (see **Content notes** below) |
| Résumé PDF behind "Download CV" | Edit `docs/resume/resume.html`, print it to PDF (Chrome → Save as PDF, A4, no headers), and replace `public/Mehmood_Ul_Hassan_Resume.pdf` (+ the `public/assets/` copy kept for old links) |
| Colours, spacing, type scale | Design tokens in `app/styles/tokens.css` (see **Design** below) |
| A section's look | Its partial in `app/styles/` (e.g. `hero.css`, `work.css`) |
| Hero Agent mesh layout | `--mesh-*` knobs on `.hero__mesh` in `app/styles/hero.css` (per breakpoint) |
| Fonts | `app/layout.tsx`: Geist / Geist Mono via `next/font/google`; Bricolage Grotesque via `next/font/local` from `app/fonts/bricolage-500-600.woff2` (latin subset instanced to weights 500–600 with fontTools, optical sizing kept; regenerate it if a design needs another weight). Licensed under the SIL OFL 1.1 — see `app/fonts/OFL.txt` |
| Contact form backend | By default the form opens the visitor's mail app. To POST to a form service (Formspree, Getform…), copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_FORM_ENDPOINT` **before `npm run build`** — it is inlined at build time. |

## Content notes

- **Octopus is a team project.** Its card credits only Mehmood's part (meta "Team project · AI
  document layer & Bill of Lading module"; *built* for his modules, *contributed* for the shared
  workflow). Keep that scoping when editing it.
- **Bill of Lading Generator (card 02) is the Octopus Bill of Lading module**, delivered as an
  Upwork contract and presented as a carrier-agnostic BL generation engine (meta "Logistics · BL
  generation · Octopus (Upwork)"). The two cards cross-reference ("see 02" /
  "Octopus (01)"), so the same work is never shown as two separate projects. The Upwork role in
  Experience stays as the résumé has it.
- **Project ↔ employer:** BlockMed Pro (healthcare, 20+ microservices) is the Code Encoders
  project; Charmy (dating app) is the Consforc project; Otobucks is its own role; Lightning New
  York sits with L’Oréal Paris Japan under Aiva Creative. Each card's meta names the employer.
- **Stack:** eight groups plus the CKAD card fill the 3 × 3 grid: AI & Automation (the single lit
  "Current focus" card), Frontend, Backend, Languages, Data & Caching, APIs & Messaging, DevOps &
  Cloud, Architecture. To add a group, merge two existing ones, or the grid gets a ragged row.
- **Marquee:** one mono run-log row of capability terms (`marqueeRows`), not a tool list; the
  Stack grid lists the tools.
- **Typography in strings:** use ’ (not `'`) for apostrophes, and `\u00A0` / `\u2011` escapes
  to keep a number with its unit ("5+\u00A0years") or a short hyphenated code together ("U\u201119").

## Design

The look is a live systems diagram: a near-black canvas, hairline blueprint structure, mono
annotations, and **one green signal colour** that marks what is *active* (the running agent, the
current section, the thing under the cursor). The palette is inspired by GSAP's brand. There is
no yellow or lime. The full design language is in `docs/DESIGN.md`.

| Token (`app/styles/tokens.css`) | Value | Use |
|---|---|---|
| `--bg` / `--bg-2` | `#0E100F` / `#111412` | canvas / the Work band |
| `--surface` / `--surface-2` / `--screen` | `#161917` / `#1E221F` / `#0B0D0C` | cards / hover / artwork screens |
| `--text` / `--muted` / `--dim` | `#ECEEE9` / `#9CA39E` / `#7C837E` | ink: 16.3 / 7.4 / 4.9 : 1 on `--bg` |
| `--accent` / `--accent-deep` | `#0AE448` / `#0C7A2B` | GSAP green (signal) / dark green (fills behind light text) |
| `--accent-ink` | `#0E100F` | text on `--accent` (11.1 : 1) |
| `--violet` / `--danger` | `#9D95FF` / `#FF6B5E` | rare secondary detail / form errors |
| `--line` / `--line-strong` | 9% / 18% of `--text` | hairlines |

- **Type:** Bricolage Grotesque 600 for display (mixed case), Geist for body, Geist Mono
  (uppercase, tracked) for labels and data. The sizes are `--fs-h2`, `--fs-h3`, `--fs-body`,
  `--fs-small` and `--fs-label`. Hero and section titles size themselves in their partials.
- **Shapes:** boxes are square (hairline border + corner brackets); controls are full pills.
- **Signature primitives (`app/styles/base.css`):** `.gridlines` (a fixed six-column
  blueprint grid on the container edge, `--page-inline`), `<Corners />` (schematic brackets that
  turn green on hover/focus via `--bracket-color`), `.section-label` (`01 / ABOUT ———`), `.mono`,
  `.status` + `.pulse-dot` chips, `<Monogram />` (the MH mark as a node graph), and `.btn--primary`
  / `.btn--ghost` pills.
- **Green is a signal:** use it for one or two things per viewport (the active nav index, the
  current timeline role, the focus card, primary buttons), not as decoration.
- **Colours never live in components:** SVGs use token classes (`.art .fill-accent`,
  `.hmf-*`, `.icon-hot`) or `currentColor`, and the hero canvas reads the tokens at runtime.

## How it's put together

```
app/
  layout.tsx        fonts, metadata, <head> boot script, <AppProvider>
  fonts/            self-hosted Bricolage Grotesque instance (wght 500–600, opsz)
  page.tsx          section order
  not-found.tsx     branded 404
  globals.css       imports the stylesheets below, in order
  styles/           tokens.css (design tokens) → base.css (reset, primitives, buttons)
                    → one partial per section (nav, hero, marquee, about, skills, …)
components/
  AppProvider.tsx   Lenis ↔ ScrollTrigger, preloader→hero "revealed" state,
                    in-page anchor scrolling + focus, mobile-menu registry,
                    reading-position restore across width changes,
                    global magnetic hover / button fills
  Preloader, Cursor, Nav, Hero (+ HeroAgentMesh), Marquee, About, Skills, Experience,
  Work (+ ProjectArt), Credentials, Contact (+ ContactForm, CopyButton), Footer
  blGlobeGeometry.ts  generated geometry of the Bill of Lading globe artwork (do not edit)
  Corners, Monogram  shared schematic primitives (corner brackets, MH mark)
  SplitText.tsx     server-rendered word/char splitting for text reveals
lib/
  data.ts           content
  gsap.ts           GSAP + plugin registration (import gsap from here)
  animations.ts     shared scroll reveals (fade-up, word/char reveals, count-up)
  interactions.ts   magnetic hover + button fills
  motion.ts         reduced-motion / fine-pointer / static-mode checks
scripts/
  gen-bl-globe.mjs  bakes components/blGlobeGeometry.ts (node scripts/gen-bl-globe.mjs)
```

- Each section owns its animations inside `useGSAP`, so everything is reverted on unmount
  (safe under React Strict Mode and Fast Refresh).
- The Work section pins with `refreshPriority: 1` so every ScrollTrigger below it accounts
  for the pin spacing.
- **Reduced motion:** no smooth scroll, pinning, parallax or ambient animation; the Agent mesh
  draws a single still frame, content is shown directly and the preloader simply fades.
- **Performance:** the Agent mesh and the marquee only run while on screen (and the tab is
  visible); the canvas caps its pixel ratio at 2 and does no per-frame layout reads.
- **Fallbacks:** without JavaScript the page renders statically (the preloader is hidden by
  CSS and the form falls back to `mailto:`). If the app hasn't started within 7 seconds (e.g. a
  very slow connection), a tiny script in `<head>` hides the preloader and shows the static page.
- GSAP is pinned to **3.13.0**: 3.14+ resets the scroll position to the top when the viewport
  crosses the 1024px breakpoint (rotation / window resize) with this `matchMedia` setup.
- **Reading position across the breakpoint:** crossing 1024px adds or removes the Work pin
  spacer, so the raw `scrollY` that ScrollTrigger restores would land in another section.
  `AppProvider` records a content anchor while the reader scrolls (the section at the top of the
  viewport and how far through it they are). After a refresh at a new width, it scrolls back to
  that anchor, and keeps it applied until the reader scrolls again.

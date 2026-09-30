# Design language — "Systems schematic"

A portfolio for a full stack engineer who builds **AI automations and AI agents**. The look is a
live systems diagram: a near-black canvas, hairline blueprint structure, mono annotations, and one
green signal colour that marks what is *active* — the running agent, the current section, the
thing under your cursor. Palette inspired by GSAP's brand. **No yellow or lime anywhere.**

## Palette (app/styles/tokens.css)

| Token | Value | Use |
|---|---|---|
| `--bg` | `#0E100F` | canvas (GSAP near-black) |
| `--bg-2` | `#111412` | alternate band (Work) |
| `--surface` / `--surface-2` | `#161917` / `#1E221F` | cards / raised, hover |
| `--screen` | `#0B0D0C` | dark screens behind project artwork |
| `--text` | `#ECEEE9` | neutral off-white (no cream cast) |
| `--muted` | `#9CA39E` | secondary text (7.4:1) |
| `--dim` | `#7C837E` | tertiary: indices, grid labels, separators (4.9:1 on `--bg`, 4.6:1 on `--surface`) — not for body copy |
| `--line` / `--line-strong` | 9% / 18% text | hairlines |
| `--accent` | `#0AE448` | **GSAP green** — the single signal colour (text on it: `--accent-ink`) |
| `--accent-deep` | `#0C7A2B` | GSAP dark green — fills behind light text, glows, depth |
| `--violet` | `#9D95FF` | rare secondary detail (return packets, timeline tail) |
| `--danger` | `#FF6B5E` | form errors |

Rules: green means *active / primary / live*. Use it for one or two things per viewport, not as
decoration everywhere. Never hard-code hex values in components or SVG — use classes that read the
tokens (`fill: var(--accent)`), or `currentColor`.

## Type

- **Display:** Bricolage Grotesque (600, optical sizing), mixed case, `--tracking-display`. No
  all-caps display headlines (that was the old template look). The self-hosted file
  (`app/fonts/bricolage-500-600.woff2`, loaded with `next/font/local` in `app/layout.tsx`) is the
  latin subset instanced to **wght 500–600** with the `opsz` axis kept: 600 everywhere, 500 only
  for `.hero__role`. Any other weight would be faked by the browser, so regenerate the file first
  if a design needs one.
- **Body:** Geist. **Labels / annotations / data:** Geist Mono, uppercase, `.08–.14em` tracking.
- Sizes: `--fs-h2`, `--fs-h3`, `--fs-body`, `--fs-small`, `--fs-label` (the hero name and the big
  section titles are sized in their partials). Headlines must never clip or overflow at 320–1920px
  (measure; don't guess widths).
- Shapes: boxes are square (hairline + `<Corners />`); controls are full pills. Content aligns to
  `--page-inline` (the container edge), like `.gridlines`. From 1024px the section layouts sit on
  the same six columns: right-hand blocks (hero spec sheet, Stack intro, interest card, contact
  aside, the last from 1100px) start on gridline 5, and the About readout, the contact form and
  the Experience rail on gridline 4.

## Signature primitives (app/styles/base.css)

- **`.gridlines`** — fixed six-column blueprint grid aligned to the container (rendered once in
  `app/page.tsx`).
- **`<Corners />`** (`components/Corners.tsx`) — schematic corner brackets for any positioned box.
  They turn green on hover/focus by setting `--bracket-color: var(--accent)` (it animates:
  registered `@property`). `<Corners accent />` for featured items.
- **`.section-label`** — `01 / ABOUT ———`: green index, mono name, hairline running out.
- **`.mono`** — mono annotation text. **`.status`** + `.pulse-dot` — `● LABEL` chips.
- **`<Monogram />`** — the MH mark drawn as a node graph with one live green node.
- Buttons: GSAP-style pills — `.btn--primary` green with dark ink, `.btn--ghost` hairline.

## Section direction

- **Preloader** — a terminal-style boot sequence: mono log lines tick in (`› init runtime`,
  `› loading agents 8/8`, `› connecting services`, `› ready`) while a large counter runs 0→100%
  (linear, in step with the log) over a green progress hairline; exits with a dark wipe. A visitor
  who has seen it in the last 24 hours gets the short version (0.9s load instead of 2.4s).
- **Cursor** — a crosshair reticle (dot + ring with four ticks); ring grows and turns green on
  interactive elements, narrows to an I-beam on text fields.
- **Nav** — monogram + wordmark; mono links whose index lights green (with corner brackets) on the current section; local-time chip; "Let’s talk" pill.
  A **scroll pipeline** runs along the nav's bottom edge: a hairline with one node per section that
  fills green as you scroll past.
- **Hero** — the name set large in Bricolage, the role ("Senior Full Stack Engineer — AI
  Automations & AI Agents") and the lede, beside the **Agent mesh**: an interactive canvas of an
  orchestrator core and eight agent nodes connected by gently swaying edges, with packets flowing
  out (green) and back (violet); the cursor attracts nearby nodes. A small mono "spec sheet"
  (role / focus / base / cert) replaces generic decorations.
- **Marquee** — a slim schematic **run log** (~110px band between hairlines): one row of mono,
  uppercase capability terms (AI Agents · AI Automation · Full Stack · LLMs · Distributed
  Systems · Kubernetes · System Design · Microservices · Cloud-Native) separated by ring nodes
  (`.marquee__sep--node`), looping with a speed that follows scroll velocity. It names
  capabilities, not tools: the Stack grid lists those. Content: `marqueeRows` in `lib/data.ts`.
- **About** — scroll-lit statement (the emphasised phrase lights up green); stats as a framed
  readout.
- **Stack** — 3 × 3 grid: eight skill groups + the CKAD card, bracketed cards with line icons
  that idle in ink with one live green node (any card under the cursor / focus lights fully
  green). Groups: AI & Automation, Languages, Backend, Data & Caching, APIs & Messaging,
  Cloud & CI/CD, **Frontend** (React, TypeScript, Tailwind, React Query, SFCC storefronts, so the
  full-stack claim has something behind it) and Architecture.
  The **AI & Automation "Current focus" card is the single lit card**: deep-green gradient,
  accent brackets, fully green icon. The CKAD card is toned down to the surface with a subtle
  green gradient and brackets (the cert also appears in the hero spec sheet, About and
  Credentials). Text on both keeps ≥ 4.5:1.
- **Experience** — sticky counter; the timeline is a pipeline: hairline, node dots, the active node
  lit green (its date and bullet branches light with it; the other roles rest in muted ink).
- **Work** — pinned horizontal gallery on desktop. **Octopus** is the featured first card (wider,
  accent brackets, its own workflow artwork with the platform's modules, the two Mehmood built
  lit). Octopus is a **team project**, so the card credits only his part: meta "Team project · AI
  document layer & Bill of Lading module", and highlights that say *built* for his modules and
  *contributed* for the shared workflow. Card 02 (Bill of Lading) is the same engagement,
  delivered as an Upwork contract: its meta reads "Octopus · Bill of Lading module · Upwork
  contract" and the two cards cross-reference ("see 02" / "Octopus (01)"), so the feature is
  never presented as two separate projects. All artwork uses the palette tokens.
- **Credentials / Contact / Footer** — hairline rows, mono spec tables, green focus states; the
  footer name fills green on scroll above Lahore's coordinates.

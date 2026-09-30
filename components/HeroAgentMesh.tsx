'use client';

/* ==========================================================================
   HeroAgentMesh — the hero's signature canvas: an orchestrator core with a
   soft green glow, eight agent nodes on a slowly rotating, tilted ellipse,
   each tied to the core by a tapered, gently swaying edge. Packets travel
   out (green) and back (violet) on staggered cycles; the agent that is
   "working" lights green. A faint outer ring of small nodes turns the other
   way. On a fine pointer, nodes near the cursor brighten and drift toward it.

   - Boots (edges grow out of the core) once `active` flips true — the hero
     passes useApp().revealed, so nothing runs behind the preloader.
   - The rAF loop only runs while the canvas is on screen and the tab is
     visible; reduced motion / static mode draw a single static frame.
   - DPR capped at 2; resize-aware (ResizeObserver); no per-frame layout reads.
   - All colours come from the design tokens (read once from CSS), and the
     layout knobs (--mesh-cx/cy/r/tilt/rot/labels/outer) from the stylesheet,
     so each breakpoint tunes the figure in app/styles/hero.css.
   ========================================================================== */

import { useEffect, useRef } from 'react';
import { hasFinePointer, isStaticMode, prefersReducedMotion } from '@/lib/motion';

/* Decorative UI copy: generic agent verbs (not claims). null = unlabelled node. */
const LABELS: (string | null)[] = ['extract', 'classify', null, 'route', 'verify', null, 'notify', 'sync'];
const AGENTS = LABELS.length;
const OUTER = 46;          // small nodes on the outer ring
const SAMPLES = 26;        // points sampled along each edge
const BOOT = 2.6;          // s — boot sequence length
const STATIC_T = 13.4;     // sim time shown in the static frame (a few packets mid-flight)
const ROT_SPEED = 0.045;   // rad/s — agent ellipse rotation
const PULL_RADIUS = 180;   // px — pointer influence radius

/* Packet cycle (seconds within one cycle) */
const OUT_DUR = 1.25;
const WORK_START = 1.05;
const WORK_DUR = 0.95;
const BACK_START = 1.8;
const BACK_DUR = 1.45;
const PULSE_DUR = 0.85;

type Agent = {
  base: number; radius: number; phase: number;
  period: number; offset: number;
  label: string | null; index: string;
  x: number; y: number; z: number;
  ox: number; oy: number; near: number;
  pts: Float32Array; nrm: Float32Array;
};
type Dot = { base: number; r: number; size: number; phase: number; near: number };

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const easeOutCubic = (v: number) => 1 - Math.pow(1 - v, 3);
const easeInOut = (v: number) => 0.5 - 0.5 * Math.cos(Math.PI * v);
const easeOutBack = (v: number) => { const c = 1.7; const u = v - 1; return 1 + (c + 1) * u * u * u + c * u * u; };
/** Deterministic hash in [0, 1) — skips some packet cycles so the traffic isn't mechanical. */
const hash = (a: number, b: number) => { const h = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return h - Math.floor(h); };

/** "r, g, b" from an `rgb(...)` / `rgba(...)` colour string. */
const rgbOf = (color: string) => (color.match(/[\d.]+/g) ?? []).slice(0, 3).join(', ');

export default function HeroAgentMesh({ active, className = '' }: { active: boolean; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activateRef = useRef<((on: boolean) => void) | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const animate = !prefersReducedMotion() && !isStaticMode();

    /* --- Tokens & knobs (re-read on resize) --- */
    let C = { accent: '', deep: '', violet: '', ink: '', bg: '' };
    let font = 'monospace';
    let knob = { cx: 0.5, cy: 0.5, r: 0.36, tilt: 0.5, rot: -0.2, labels: 1, outer: 1, fit: 1 };

    const readStyles = () => {
      const root = getComputedStyle(document.documentElement);
      const own = getComputedStyle(canvas);
      const ink = rgbOf(own.color);
      const tok = (name: string) => root.getPropertyValue(name).trim() || ink;
      C = { accent: tok('--accent-rgb'), deep: tok('--accent-deep-rgb'), violet: tok('--violet-rgb'), ink: tok('--text-rgb'), bg: tok('--bg-rgb') };
      font = own.fontFamily || 'monospace';
      const num = (name: string, fallback: number) => {
        const v = parseFloat(own.getPropertyValue(name));
        return Number.isFinite(v) ? v : fallback;
      };
      knob = {
        cx: num('--mesh-cx', 0.5), cy: num('--mesh-cy', 0.5), r: num('--mesh-r', 0.36),
        tilt: num('--mesh-tilt', 0.5), rot: (num('--mesh-rot', -12) * Math.PI) / 180,
        labels: num('--mesh-labels', 1), outer: num('--mesh-outer', 1), fit: num('--mesh-fit', 1),
      };
    };
    const rgba = (rgb: string, a: number) => `rgba(${rgb}, ${a < 0 ? 0 : a > 1 ? 1 : a.toFixed(3)})`;

    /* --- Geometry state --- */
    let W = 0, H = 0, dpr = 1;
    let cx = 0, cy = 0, rx = 0, ry = 0, cosR = 1, sinR = 0;

    const agents: Agent[] = LABELS.map((label, i) => ({
      base: (i / AGENTS) * Math.PI * 2 + (hash(i, 1) - 0.5) * 0.28,
      radius: 0.9 + hash(i, 2) * 0.18,
      phase: hash(i, 3) * Math.PI * 2,
      period: 4.3 + hash(i, 4) * 1.9,
      offset: i * 0.63 + hash(i, 5) * 0.4,
      label: label ? label.toUpperCase() : null,
      index: String(i + 1).padStart(2, '0'),
      x: 0, y: 0, z: 0, ox: 0, oy: 0, near: 0,
      pts: new Float32Array(SAMPLES * 2), nrm: new Float32Array(SAMPLES * 2),
    }));
    const dots: Dot[] = Array.from({ length: OUTER }, (_, i) => ({
      base: (i / OUTER) * Math.PI * 2 + (hash(i, 7) - 0.5) * 0.12,
      r: 1.34 + (hash(i, 8) - 0.5) * 0.16,
      size: 0.8 + hash(i, 9) * 1.1,
      phase: hash(i, 10) * Math.PI * 2,
      near: 0,
    }));
    let coreNear = 0;

    /** Point on the rotated agent ellipse (scaled by m). */
    const onEllipse = (theta: number, m: number, out: { x: number; y: number; z: number }) => {
      const ex = Math.cos(theta) * rx * m;
      const ey = Math.sin(theta) * ry * m;
      out.x = cx + ex * cosR - ey * sinR;
      out.y = cy + ex * sinR + ey * cosR;
      out.z = Math.sin(theta); // +1 = front (lower on screen)
    };
    const tmp = { x: 0, y: 0, z: 0 };

    /* --- Glow sprites (pre-rendered radial gradients; rebuilt on resize) --- */
    const sprite = (size: number, stops: [number, string][]) => {
      const c = document.createElement('canvas');
      const px = Math.max(2, Math.ceil(size * dpr));
      c.width = c.height = px;
      const g = c.getContext('2d');
      if (g) {
        const grad = g.createRadialGradient(px / 2, px / 2, 0, px / 2, px / 2, px / 2);
        stops.forEach(([o, col]) => grad.addColorStop(o, col));
        g.fillStyle = grad;
        g.fillRect(0, 0, px, px);
      }
      return { c, size };
    };
    let glowCore = sprite(2, []), glowGreen = glowCore, glowViolet = glowCore;
    const buildSprites = () => {
      const coreSize = Math.max(rx, ry * 2) * 1.9;
      glowCore = sprite(coreSize, [[0, rgba(C.accent, 0.42)], [0.14, rgba(C.accent, 0.17)], [0.45, rgba(C.deep, 0.14)], [1, rgba(C.deep, 0)]]);
      glowGreen = sprite(30, [[0, rgba(C.accent, 0.95)], [0.22, rgba(C.accent, 0.35)], [1, rgba(C.accent, 0)]]);
      glowViolet = sprite(30, [[0, rgba(C.violet, 0.95)], [0.22, rgba(C.violet, 0.35)], [1, rgba(C.violet, 0)]]);
    };
    const drawSprite = (s: { c: HTMLCanvasElement; size: number }, x: number, y: number, alpha: number, scale = 1) => {
      if (alpha <= 0.002) return;
      const d = s.size * scale;
      ctx.globalAlpha = alpha > 1 ? 1 : alpha;
      ctx.drawImage(s.c, x - d / 2, y - d / 2, d, d);
      ctx.globalAlpha = 1;
    };

    /* --- Label measurements (cached; redone on resize / font load) --- */
    const LABEL_PX = 10;
    const widths = new Map<string, number>();
    const setLabelFont = () => {
      ctx.font = `500 ${LABEL_PX}px ${font}`;
      if ('letterSpacing' in ctx) ctx.letterSpacing = '1.4px';
    };
    const measure = () => {
      widths.clear();
      setLabelFont();
      agents.forEach((a) => {
        widths.set(a.index + '  ', ctx.measureText(a.index + '  ').width);
        if (a.label) widths.set(a.label, ctx.measureText(a.label).width);
      });
      widths.set('ORCHESTRATOR', ctx.measureText('ORCHESTRATOR').width);
      if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
    };

    /* --- Pointer (fine pointer + motion only) --- */
    const pointer = { x: -9999, y: -9999, on: false };
    let rect: DOMRect | null = null;
    const markRect = () => { rect = null; };

    /* --- Layout --- */
    const layout = (w: number, h: number) => {
      W = w; H = h;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(W * dpr));
      canvas.height = Math.max(1, Math.round(H * dpr));
      readStyles();
      cx = W * knob.cx;
      cy = H * knob.cy;
      // Radius: fraction of the smaller side; with --mesh-fit it stays clear of the
      // canvas edges (labels need room), otherwise the figure may bleed off them
      const pad = knob.labels ? 112 : 24;
      const want = Math.min(W, H * 1.7) * knob.r;
      rx = Math.max(40, knob.fit ? Math.min(want, cx - pad, W - cx - pad) : want);
      ry = rx * knob.tilt;
      cosR = Math.cos(knob.rot);
      sinR = Math.sin(knob.rot);
      buildSprites();
      measure();
      markRect();
    };

    /* --- Timeline state --- */
    let t = 0;              // sim time since boot started (only advances while running)
    let started = !animate; // static frames draw straight away
    let raf = 0;
    let last = 0;
    let inView = true;

    /** Packet state for agent i at packet-time tp. */
    const cycle = (a: Agent, i: number, tp: number) => {
      const local = tp - a.offset;
      if (local < 0) return -1;
      const k = Math.floor(local / a.period);
      if (k > 0 && hash(i + 11, k) < 0.2) return -1; // skipped cycle
      return local - k * a.period;
    };

    const update = (dt: number) => {
      const k1 = 1 - Math.exp(-dt * 5);
      const k2 = 1 - Math.exp(-dt * 7);
      const live = pointer.on && rect !== null;
      agents.forEach((a) => {
        let f = 0, tx = 0, ty = 0;
        if (live) {
          const dx = pointer.x - a.x, dy = pointer.y - a.y;
          const d = Math.hypot(dx, dy);
          f = clamp01(1 - d / PULL_RADIUS);
          f *= f;
          const pull = Math.min(0.24 * f, 28 / Math.max(d, 1));
          tx = dx * pull; ty = dy * pull;
        }
        a.ox += (tx - a.ox) * k1;
        a.oy += (ty - a.oy) * k1;
        a.near += (f - a.near) * k2;
      });
      const cd = live ? Math.hypot(pointer.x - cx, pointer.y - cy) : 1e9;
      coreNear += (clamp01(1 - cd / (PULL_RADIUS * 0.9)) - coreNear) * k2;
      if (knob.outer > 0) {
        dots.forEach((d) => {
          let f = 0;
          if (live) {
            onEllipse(d.base - t * 0.018, d.r, tmp);
            f = clamp01(1 - Math.hypot(pointer.x - tmp.x, pointer.y - tmp.y) / (PULL_RADIUS * 0.8));
          }
          d.near += (f - d.near) * k2;
        });
      }
    };

    /* --- Draw --- */
    const draw = (time: number, bp: number) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      if (bp <= 0 || W === 0) return;

      const tp = animate ? time - BOOT * 0.75 : time; // packets start near the end of the boot
      const rot = (animate ? time : STATIC_T) * ROT_SPEED;
      const orbitIn = clamp01(bp / 0.6);
      const outerIn = clamp01((bp - 0.35) / 0.5);
      const labelIn = clamp01((bp - 0.7) / 0.3);
      const coreIn = easeOutBack(clamp01(bp / 0.3));

      /* Orbits: agent ellipse (hairline) + outer ring (dashed) */
      ctx.lineWidth = 1;
      ctx.strokeStyle = rgba(C.ink, 0.075 * orbitIn);
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, knob.rot, 0, Math.PI * 2);
      ctx.stroke();
      if (knob.outer > 0) {
        ctx.setLineDash([2, 7]);
        ctx.lineDashOffset = -time * 4;
        ctx.strokeStyle = rgba(C.ink, 0.06 * outerIn);
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx * 1.34, ry * 1.34, knob.rot, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        /* Outer ring nodes */
        ctx.fillStyle = `rgb(${C.ink})`;
        const step = knob.outer >= 1 ? 1 : Math.max(1, Math.round(1 / knob.outer));
        for (let i = 0; i < OUTER; i += step) {
          const d = dots[i];
          onEllipse(d.base - (animate ? time : STATIC_T) * 0.018, d.r, tmp);
          const depth = 0.55 + 0.45 * (tmp.z + 1) / 2;
          const tw = 0.5 + 0.5 * Math.sin(time * 0.9 + d.phase);
          ctx.globalAlpha = clamp01((0.1 + 0.16 * tw) * depth * outerIn + d.near * 0.55);
          ctx.beginPath();
          ctx.arc(tmp.x, tmp.y, d.size * (0.8 + 0.4 * depth) + d.near * 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }

      /* Agent positions */
      const coreX = cx + Math.sin(time * 0.35) * 3;
      const coreY = cy + Math.cos(time * 0.3) * 3;
      agents.forEach((a) => {
        const breathe = 1 + 0.035 * Math.sin(time * 0.5 + a.phase);
        onEllipse(a.base + rot, a.radius * breathe, tmp);
        a.x = tmp.x + Math.sin(time * 0.7 + a.phase) * 3 + a.ox;
        a.y = tmp.y + Math.cos(time * 0.6 + a.phase) * 3 + a.oy;
        a.z = tmp.z;
      });

      /* Core glow (under everything bright) */
      let pulseSum = 0;
      if (bp >= 1) agents.forEach((a, i) => {
        const c = cycle(a, i, tp);
        const p = c < 0 ? -1 : (c - (BACK_START + BACK_DUR)) / PULSE_DUR;
        if (p >= 0 && p <= 1) pulseSum += 1 - p;
      });
      const breath = 0.5 + 0.5 * Math.sin(time * 1.2);
      drawSprite(glowCore, coreX, coreY, (0.62 + 0.18 * breath + coreNear * 0.3 + pulseSum * 0.18) * clamp01(bp / 0.4), 0.92 + 0.08 * breath);

      /* Edges: tapered, swaying cubic curves core → agent */
      agents.forEach((a, i) => {
        const grow = easeOutCubic(clamp01((bp - 0.16 - i * 0.035) / 0.42));
        if (grow <= 0) return;
        const dx = a.x - coreX, dy = a.y - coreY;
        const len = Math.hypot(dx, dy) || 1;
        const ux = dx / len, uy = dy / len;
        const px = -uy, py = ux;
        const curl = len * 0.07; // constant drag against the rotation → tentacle-like trail
        const s1 = len * 0.13 * Math.sin(time * 0.85 + a.phase) - curl;
        const s2 = len * 0.1 * Math.sin(time * 0.85 + a.phase - 1.35) - curl * 0.5;
        const x0 = coreX + ux * 14, y0 = coreY + uy * 14;
        const x1 = coreX + dx * 0.34 + px * s1, y1 = coreY + dy * 0.34 + py * s1;
        const x2 = coreX + dx * 0.68 + px * s2, y2 = coreY + dy * 0.68 + py * s2;
        const x3 = a.x, y3 = a.y;
        const pts = a.pts;
        for (let j = 0; j < SAMPLES; j++) {
          const u = j / (SAMPLES - 1), v = 1 - u;
          const b0 = v * v * v, b1 = 3 * v * v * u, b2 = 3 * v * u * u, b3 = u * u * u;
          pts[j * 2] = b0 * x0 + b1 * x1 + b2 * x2 + b3 * x3;
          pts[j * 2 + 1] = b0 * y0 + b1 * y1 + b2 * y2 + b3 * y3;
        }
        const nrm = a.nrm;
        for (let j = 0; j < SAMPLES; j++) {
          const jp = j > 0 ? j - 1 : 0, jn = j < SAMPLES - 1 ? j + 1 : SAMPLES - 1;
          const tx = pts[jn * 2] - pts[jp * 2], ty = pts[jn * 2 + 1] - pts[jp * 2 + 1];
          const tl = Math.hypot(tx, ty) || 1;
          nrm[j * 2] = -ty / tl;
          nrm[j * 2 + 1] = tx / tl;
        }

        const c = bp >= 1 ? cycle(a, i, tp) : -1;
        const work = c >= WORK_START && c <= WORK_START + WORK_DUR ? Math.sin(Math.PI * (c - WORK_START) / WORK_DUR) : 0;
        const depth = 0.6 + 0.4 * (a.z + 1) / 2;
        const lit = Math.max(a.near, work * 0.8);
        const n = Math.max(2, Math.ceil(grow * (SAMPLES - 1)) + 1);
        const w0 = 1.5 * depth, w1 = 0.4 + 0.35 * lit;

        const grad = ctx.createLinearGradient(x0, y0, x3, y3);
        grad.addColorStop(0, rgba(C.accent, (0.34 + 0.3 * lit) * depth));
        grad.addColorStop(0.55, rgba(C.ink, (0.12 + 0.2 * lit) * depth));
        grad.addColorStop(1, rgba(C.ink, (0.2 + 0.5 * lit) * depth));
        ctx.fillStyle = grad;
        ctx.beginPath();
        for (let j = 0; j < n; j++) {
          const w = (w0 + (w1 - w0) * (j / (SAMPLES - 1))) / 2;
          const X = pts[j * 2] + nrm[j * 2] * w, Y = pts[j * 2 + 1] + nrm[j * 2 + 1] * w;
          if (j === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
        }
        for (let j = n - 1; j >= 0; j--) {
          const w = (w0 + (w1 - w0) * (j / (SAMPLES - 1))) / 2;
          ctx.lineTo(pts[j * 2] - nrm[j * 2] * w, pts[j * 2 + 1] - nrm[j * 2 + 1] * w);
        }
        ctx.closePath();
        ctx.fill();
      });

      /* Packets: out (green) and back (violet), with short trails */
      const at = (a: Agent, u: number) => {
        const f = clamp01(u) * (SAMPLES - 1);
        const j = Math.min(SAMPLES - 2, Math.floor(f));
        const r = f - j;
        tmp.x = a.pts[j * 2] + (a.pts[j * 2 + 2] - a.pts[j * 2]) * r;
        tmp.y = a.pts[j * 2 + 1] + (a.pts[j * 2 + 3] - a.pts[j * 2 + 1]) * r;
        return tmp;
      };
      const packet = (a: Agent, u: number, back: boolean, alpha: number) => {
        const rgb = back ? C.violet : C.accent;
        ctx.fillStyle = `rgb(${rgb})`;
        for (let k = 5; k >= 1; k--) {
          const q = at(a, back ? u + k * 0.028 : u - k * 0.028);
          ctx.globalAlpha = alpha * 0.55 * (1 - k / 6);
          ctx.beginPath();
          ctx.arc(q.x, q.y, 1.9 * (1 - k / 7), 0, Math.PI * 2);
          ctx.fill();
        }
        const h = at(a, u);
        const hx = h.x, hy = h.y;
        drawSprite(back ? glowViolet : glowGreen, hx, hy, alpha * 0.9);
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(hx, hy, 2.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      };
      if (bp >= 1) agents.forEach((a, i) => {
        const c = cycle(a, i, tp);
        if (c < 0) return;
        if (c <= OUT_DUR) packet(a, easeInOut(c / OUT_DUR), false, clamp01(c / 0.15));
        if (c >= BACK_START && c <= BACK_START + BACK_DUR) {
          const u = 1 - easeInOut((c - BACK_START) / BACK_DUR);
          packet(a, u, true, clamp01((BACK_START + BACK_DUR - c) / 0.12) * 0.95);
        }
      });

      /* Core: glow ring, rotating tick gauge, dashed ring, solid centre, arrival pulses */
      if (coreIn > 0) {
        ctx.save();
        ctx.translate(coreX, coreY);
        ctx.scale(coreIn, coreIn);
        // arrival pulses
        if (bp >= 1) agents.forEach((a, i) => {
          const c = cycle(a, i, tp);
          const p = c < 0 ? -1 : (c - (BACK_START + BACK_DUR)) / PULSE_DUR;
          if (p < 0 || p > 1) return;
          ctx.strokeStyle = rgba(C.accent, (1 - p) * 0.55);
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(0, 0, 12 + easeOutCubic(p) * 44, 0, Math.PI * 2);
          ctx.stroke();
        });
        // tick gauge
        ctx.rotate(time * 0.12);
        ctx.strokeStyle = rgba(C.ink, 0.26 + coreNear * 0.2);
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let k = 0; k < 36; k++) {
          const ang = (k / 36) * Math.PI * 2;
          const r0 = k % 3 === 0 ? 29 : 31;
          ctx.moveTo(Math.cos(ang) * r0, Math.sin(ang) * r0);
          ctx.lineTo(Math.cos(ang) * 34, Math.sin(ang) * 34);
        }
        ctx.stroke();
        ctx.rotate(-time * 0.12);
        // dashed ring
        ctx.setLineDash([1.5, 3.5]);
        ctx.lineDashOffset = -time * 6;
        ctx.strokeStyle = rgba(C.accent, 0.5 + coreNear * 0.3);
        ctx.beginPath();
        ctx.arc(0, 0, 21, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        // inner ring + centre
        ctx.fillStyle = `rgb(${C.bg})`;
        ctx.strokeStyle = rgba(C.accent, 0.9);
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.arc(0, 0, 12.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = `rgb(${C.accent})`;
        ctx.beginPath();
        ctx.arc(0, 0, 6 + pulseSum * 1.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      /* Agent nodes */
      agents.forEach((a, i) => {
        const pop = easeOutBack(clamp01((bp - 0.42 - i * 0.035) / 0.26));
        if (pop <= 0) return;
        const c = bp >= 1 ? cycle(a, i, tp) : -1;
        const work = c >= WORK_START && c <= WORK_START + WORK_DUR ? Math.sin(Math.PI * (c - WORK_START) / WORK_DUR) : 0;
        const depth = 0.84 + 0.3 * (a.z + 1) / 2;
        const lit = Math.max(a.near, work);
        const r = 4.6 * depth * pop;
        drawSprite(glowGreen, a.x, a.y, lit * 0.75, 1 + lit * 0.6);
        ctx.lineWidth = 1.25;
        ctx.fillStyle = work > 0.5 ? `rgb(${C.accent})` : `rgb(${C.bg})`;
        ctx.strokeStyle = work > 0.35 ? rgba(C.accent, 1) : rgba(C.ink, (0.5 + 0.5 * lit) * (0.7 + 0.3 * depth));
        ctx.beginPath();
        ctx.arc(a.x, a.y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        if (work <= 0.5) {
          ctx.fillStyle = a.near > 0.3 ? rgba(C.accent, a.near) : rgba(C.ink, 0.75);
          ctx.beginPath();
          ctx.arc(a.x, a.y, 1.5 * pop, 0, Math.PI * 2);
          ctx.fill();
        }
        // schematic brackets around the node nearest the cursor
        if (a.near > 0.2) {
          const b = 10 + 3 * (1 - a.near), l = 3.5;
          ctx.strokeStyle = rgba(C.accent, (a.near - 0.2) * 1.25);
          ctx.lineWidth = 1;
          ctx.beginPath();
          for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]] as const) {
            ctx.moveTo(a.x + sx * b, a.y + sy * (b - l));
            ctx.lineTo(a.x + sx * b, a.y + sy * b);
            ctx.lineTo(a.x + sx * (b - l), a.y + sy * b);
          }
          ctx.stroke();
        }
      });

      /* Labels */
      if (knob.labels && labelIn > 0) {
        setLabelFont();
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'left';
        agents.forEach((a, i) => {
          if (!a.label) return;
          const c = bp >= 1 ? cycle(a, i, tp) : -1;
          const work = c >= WORK_START && c <= WORK_START + WORK_DUR ? Math.sin(Math.PI * (c - WORK_START) / WORK_DUR) : 0;
          const depth = 0.5 + 0.5 * (a.z + 1) / 2;
          const dx = a.x - cx, dy = a.y - cy;
          const len = Math.hypot(dx, dy) || 1;
          const ux = dx / len, uy = dy / len;
          const idx = a.index + '  ';
          const wi = widths.get(idx) ?? 0, wl = widths.get(a.label) ?? 0;
          const total = wi + wl;
          const ax = a.x + ux * 15, ay = a.y + uy * 15;
          const x0 = ux > 0.3 ? ax : ux < -0.3 ? ax - total : ax - total / 2;
          const y0 = Math.abs(ux) <= 0.3 ? ay + uy * 4 : ay;
          const lit = Math.max(a.near, work);
          ctx.fillStyle = rgba(C.ink, (0.3 + 0.2 * lit) * depth * labelIn);
          ctx.fillText(a.index, x0, y0);
          ctx.fillStyle = lit > 0.25 ? rgba(C.accent, (0.55 + 0.45 * lit) * labelIn) : rgba(C.ink, 0.62 * depth * labelIn);
          ctx.fillText(a.label, x0 + wi, y0);
        });
        // core label on a small plate so the edges never run through it
        const wo = widths.get('ORCHESTRATOR') ?? 0;
        ctx.fillStyle = rgba(C.bg, 0.86 * labelIn);
        ctx.fillRect(coreX - wo / 2 - 6, coreY + 50 - 8, wo + 12, 16);
        ctx.fillStyle = rgba(C.ink, (0.5 + coreNear * 0.3) * labelIn);
        ctx.fillText('ORCHESTRATOR', coreX - wo / 2, coreY + 50);
        if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
      }
    };

    /* --- Loop control --- */
    const bootProgress = () => (animate ? clamp01(t / BOOT) : 1);
    const drawStatic = () => draw(STATIC_T, 1);
    const running = () => animate && started && inView && !document.hidden;

    const frame = (now: number) => {
      raf = 0;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      t += dt;
      update(dt);
      draw(t, bootProgress());
      if (running()) raf = requestAnimationFrame(frame);
    };
    const sync = () => {
      if (running()) {
        if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); }
      } else if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };
    const redraw = () => {
      if (!animate) drawStatic();
      else if (started && !raf) draw(t, bootProgress());
    };

    activateRef.current = (on: boolean) => {
      if (!animate || !on || started) return;
      started = true;
      sync();
    };

    /* --- Observers & listeners --- */
    const ro = new ResizeObserver((entries) => {
      const box = entries[entries.length - 1].contentRect;
      if (box.width === W && box.height === H) return;
      layout(box.width, box.height);
      redraw();
    });
    ro.observe(canvas);

    const io = new IntersectionObserver((entries) => {
      inView = entries[entries.length - 1].isIntersecting;
      sync();
    });
    io.observe(canvas);

    const onVisibility = () => sync();
    document.addEventListener('visibilitychange', onVisibility);

    let fontsAlive = true;
    document.fonts?.ready.then(() => {
      if (!fontsAlive) return;
      readStyles();
      measure();
      redraw();
    });

    const target: HTMLElement = canvas.closest('section') ?? canvas.parentElement ?? canvas;
    const cleanups: Array<() => void> = [];
    if (animate && hasFinePointer()) {
      const onMove = (e: PointerEvent) => {
        if (!rect) rect = canvas.getBoundingClientRect();
        pointer.x = e.clientX - rect.left;
        pointer.y = e.clientY - rect.top;
        pointer.on = true;
      };
      const onLeave = () => { pointer.on = false; };
      target.addEventListener('pointermove', onMove, { passive: true });
      target.addEventListener('pointerleave', onLeave);
      window.addEventListener('scroll', markRect, { passive: true });
      window.addEventListener('resize', markRect);
      cleanups.push(() => {
        target.removeEventListener('pointermove', onMove);
        target.removeEventListener('pointerleave', onLeave);
        window.removeEventListener('scroll', markRect);
        window.removeEventListener('resize', markRect);
      });
    }

    return () => {
      fontsAlive = false;
      activateRef.current = null;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      cleanups.forEach((fn) => fn());
    };
  }, []);

  // Boot once the preloader hands off (runs after the engine above is built)
  useEffect(() => {
    activateRef.current?.(active);
  }, [active]);

  return <canvas ref={canvasRef} className={`hero-mesh ${className}`.trim()} aria-hidden="true" />;
}

/* --------------------------------------------------------------------------
   No-JS / static fallback: the same figure as a static SVG (styles:
   .hero-mesh-fallback in app/styles/hero.css — displayed under html.no-js and
   html.no-gsap, where the canvas is hidden). Geometry is
   computed once at module load from the same seeds as the canvas.
   -------------------------------------------------------------------------- */
const FB = (() => {
  const W = 720, H = 420, cx = 360, cy = 210, rx = 230, ry = 106;
  const rot = (9 * Math.PI) / 180, cosR = Math.cos(rot), sinR = Math.sin(rot);
  const r1 = (v: number) => Math.round(v * 10) / 10;
  const pt = (theta: number, m: number) => {
    const ex = Math.cos(theta) * rx * m, ey = Math.sin(theta) * ry * m;
    return { x: cx + ex * cosR - ey * sinR, y: cy + ex * sinR + ey * cosR, z: Math.sin(theta) };
  };
  const spin = STATIC_T * ROT_SPEED;
  const agents = LABELS.map((label, i) => {
    const p = pt((i / AGENTS) * Math.PI * 2 + (hash(i, 1) - 0.5) * 0.28 + spin, 0.9 + hash(i, 2) * 0.18);
    const dx = p.x - cx, dy = p.y - cy, len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len, curl = -len * 0.07;
    const qx = cx + dx * 0.5 - uy * curl, qy = cy + dy * 0.5 + ux * curl;
    const lx = p.x + ux * 15, ly = p.y + uy * 15;
    return {
      x: r1(p.x), y: r1(p.y),
      edge: `M${r1(cx + ux * 14)} ${r1(cy + uy * 14)}Q${r1(qx)} ${r1(qy)} ${r1(p.x)} ${r1(p.y)}`,
      label: label ? `${String(i + 1).padStart(2, '0')}  ${label.toUpperCase()}` : null,
      lx: r1(lx), ly: r1(Math.abs(ux) <= 0.3 ? ly + uy * 4 : ly),
      anchor: (ux > 0.3 ? 'start' : ux < -0.3 ? 'end' : 'middle') as 'start' | 'end' | 'middle',
    };
  });
  const dots = Array.from({ length: OUTER / 2 }, (_, k) => {
    const i = k * 2;
    const p = pt((i / OUTER) * Math.PI * 2 + (hash(i, 7) - 0.5) * 0.12 - STATIC_T * 0.018, 1.34 + (hash(i, 8) - 0.5) * 0.16);
    return { x: r1(p.x), y: r1(p.y), r: r1(0.8 + hash(i, 9) * 1.1) };
  });
  return { W, H, cx, cy, rx, ry, deg: 9, agents, dots };
})();

export function HeroMeshFallback({ gradientId }: { gradientId: string }) {
  const { W, H, cx, cy, rx, ry, deg, agents, dots } = FB;
  return (
    <svg className="hero-mesh-fallback" viewBox={`0 0 ${W} ${H}`} aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id={gradientId}>
          <stop offset="0" className="hmf-glow-0" />
          <stop offset=".5" className="hmf-glow-1" />
          <stop offset="1" className="hmf-glow-2" />
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r={rx * 0.95} fill={`url(#${gradientId})`} />
      <ellipse className="hmf-orbit" cx={cx} cy={cy} rx={rx} ry={ry} transform={`rotate(${deg} ${cx} ${cy})`} />
      <ellipse className="hmf-orbit hmf-orbit--outer" cx={cx} cy={cy} rx={rx * 1.34} ry={ry * 1.34} transform={`rotate(${deg} ${cx} ${cy})`} />
      {dots.map((d, i) => <circle key={i} className="hmf-dot" cx={d.x} cy={d.y} r={d.r} />)}
      {agents.map((a, i) => <path key={i} className="hmf-edge" d={a.edge} />)}
      <circle className="hmf-ring hmf-ring--dash" cx={cx} cy={cy} r={21} />
      <circle className="hmf-ring" cx={cx} cy={cy} r={12.5} />
      <circle className="hmf-core" cx={cx} cy={cy} r={6} />
      {agents.map((a, i) => <circle key={i} className="hmf-node" cx={a.x} cy={a.y} r={4.6} />)}
      {agents.map((a, i) => a.label && (
        <text key={i} className="hmf-label" x={a.lx} y={a.ly} textAnchor={a.anchor} dominantBaseline="middle">{a.label}</text>
      ))}
      <rect className="hmf-plate" x={cx - 52} y={cy + 42} width={104} height={16} />
      <text className="hmf-label hmf-label--core" x={cx} y={cy + 50} textAnchor="middle" dominantBaseline="middle">ORCHESTRATOR</text>
    </svg>
  );
}

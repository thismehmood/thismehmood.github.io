import type { CSSProperties } from 'react';
import type { ProjectArtId } from '@/lib/data';
import { BL_AT, BL_DOTS, BL_GLOBE, BL_LANES, BL_MERIDIANS, BL_PARALLELS, BL_RIM, type BlLaneGeo } from '@/components/blGlobeGeometry';

/*
 * Decorative SVG illustrations for the Work cards (one per project).
 *
 * Colour comes only from the palette tokens, through classes styled in
 * app/styles/work.css — `.fill-*` / `.stroke-*` (e.g. `.art .fill-accent { fill: var(--accent) }`).
 * Transparency is expressed with fill-/stroke-opacity, never with hard-coded colours.
 *
 * Motion classes (also in work.css): .flow (dash), .stream (dots), .pulse / .pulse--delay /
 * .pulse--delay-2 (breathe), .spin-view (orbit), .oct-packet (travelling packets), and the Bill of
 * Lading set: .bl-vessel / .bl-vessel--horizon / .bl-sail (vessels sailing their lanes), .bl-feed (the
 * invoice's data running into the bill), .bl-write (fields written on), .bl-doc (the sheet clearing
 * between bills), .bl-reveal, .bl-issue / .bl-draft (DRAFT → ISSUED) and .bl-carrier /
 * .bl-carrier--b / .bl-carrier--c (the active carrier template). They animate paint-only
 * properties (stroke-dashoffset, opacity), never transforms, so they don't force SVG layout. Each card's art is paused while that card is off-screen (the card's `.is-inview`
 * class, set by an IntersectionObserver in Work.tsx) and collapses to a static frame under
 * reduced motion.
 *
 * The wrapping `.card__art` is aria-hidden; each SVG is hidden too so it stays decorative
 * wherever it is rendered.
 */

const svgProps = { fill: 'none', 'aria-hidden': true, focusable: 'false' } as const;

/* ---------------------------------------------------------------------------
   01 — Octopus: the workflow platform as a "head" with eight tentacles to its modules.
   The two modules Mehmood built (AI checks, bill of lading) are the lit ones.
   --------------------------------------------------------------------------- */

type Pt = { x: number; y: number };
type OctoNode = Pt & { label: string; w: number; side: 'top' | 'left' | 'right' };
type OctoLayout = {
  variant: 'wide' | 'compact';
  w: number;
  h: number;
  head: { cx: number; base: number; halfW: number; h: number };
  nodes: OctoNode[]; // in attachment order, left → right along the head's base
  font: number; // module label size (the compact layout renders smaller, so its type is larger)
  pillH: number;
  legend: Pt;
  guide?: { rx: number; ry: number; cy: number };
};

const MONO_ADVANCE = 0.605; // Geist Mono advance width, in em
const pillWidth = (label: string, font: number) => Math.round(label.length * font * MONO_ADVANCE + font * 2.1);
const r1 = (n: number) => Math.round(n * 10) / 10;

/** Wide composition (featured card on desktop and tablet): modules fanned out on an arc. */
function wideLayout(): OctoLayout {
  const font = 10.5;
  const cx = 300;
  const cy = 66; // arc centre
  const rx = 236;
  const ry = 196;
  // The platform's module areas, left → right.
  // The pipeline (compliance → editing → QA → bank execution) climbs the right side.
  const labels = ['bill of lading', 'documents', 'AI checks', 'audit', 'compliance', 'editing', 'QA', 'bank execution'];
  const nodes = labels.map((label, i) => {
    const a = ((168 - i * (156 / 7)) * Math.PI) / 180;
    return { label, w: pillWidth(label, font), x: r1(cx + rx * Math.cos(a)), y: r1(cy + ry * Math.sin(a)), side: 'top' as const };
  });
  return {
    variant: 'wide',
    w: 600,
    h: 300,
    head: { cx, base: 110, halfW: 52, h: 92 },
    nodes,
    font,
    pillH: 22,
    legend: { x: cx, y: 291 },
    guide: { rx, ry, cy },
  };
}

/** Compact composition (phones): the head on top, tentacles hanging to two columns. */
function compactLayout(): OctoLayout {
  const font = 12.5;
  const left = 80;
  const right = 320;
  const rows = [158, 212, 266, 320];
  const leftLabels = ['bill of lading', 'documents', 'AI checks', 'audit']; // top → bottom
  const rightLabels = ['compliance', 'editing', 'QA', 'bank execution']; // top → bottom (pipeline order)
  const nodes: OctoNode[] = [
    ...leftLabels.map((label, i) => ({ label, w: pillWidth(label, font), x: left, y: rows[i], side: 'left' as const })),
    // attachment order runs left → right, so the right column is listed bottom → top
    ...rightLabels.map((label, i) => ({ label, w: pillWidth(label, font), x: right, y: rows[i], side: 'right' as const })).reverse(),
  ];
  return {
    variant: 'compact',
    w: 400,
    h: 370,
    head: { cx: 200, base: 110, halfW: 54, h: 96 },
    nodes,
    font,
    pillH: 27,
    legend: { x: 200, y: 360 },
  };
}

const WIDE = wideLayout();
const COMPACT = compactLayout();

/** Dome-shaped head outline (a rounded "mantle"). */
function domePath(cx: number, base: number, halfW: number, h: number) {
  const top = base - h;
  const l = cx - halfW;
  const r = cx + halfW;
  return `M${l} ${base - 8}V${top + halfW}A${halfW} ${halfW} 0 0 1 ${r} ${top + halfW}V${base - 8}Q${r} ${base} ${r - 8} ${base}H${l + 8}Q${l} ${base} ${l} ${base - 8}Z`;
}

/** Tentacle from the head's base to a module pill (cubic Bézier with a gentle curl). */
function tentaclePath(layout: OctoLayout, node: OctoNode, i: number) {
  const { head, nodes } = layout;
  const n = nodes.length;
  const span = head.halfW * 1.46;
  const ax = r1(head.cx - span / 2 + (span * i) / (n - 1));
  const ay = head.base;

  if (node.side === 'top') {
    const ex = node.x;
    const ey = node.y - layout.pillH / 2;
    const out = Math.abs(ex - head.cx) / (layout.w / 2); // 0 (centre) … 1 (edge)
    const c1x = r1(ax + (ex - ax) * 0.22);
    const c1y = r1(ay + 74 - 46 * out);
    const c2x = r1(ex);
    const c2y = r1(ey - 30 - 26 * out);
    return `M${ax} ${ay}C${c1x} ${c1y} ${c2x} ${c2y} ${ex} ${ey}`;
  }

  // Side columns: drop down from the head, then reach sideways into the pill's inner edge
  const dir = node.side === 'left' ? 1 : -1;
  const ex = r1(node.x + (dir * node.w) / 2);
  const ey = node.y;
  const c1y = r1(ay + (ey - ay) * 0.62);
  const c2x = r1(ex + dir * 46);
  return `M${ax} ${ay}C${ax} ${c1y} ${c2x} ${ey} ${ex} ${ey}`;
}

// Packet timing per tentacle (seconds): varied so the flow never looks mechanical
const OUT_DUR = [3.4, 2.9, 3.1, 2.6, 2.7, 3.2, 2.8, 3.6];
const OUT_DELAY = [-0.4, -1.9, -1.1, -2.3, -0.2, -1.6, -2.7, -0.9];
const BACK = new Set([1, 2, 5, 7]); // tentacles that also carry a status back to the head

/** Animation vars; `--rest` is where the packet sits when motion is reduced (same frame as t = 0). */
const timing = (dur: number, delay: number, dir: 1 | -1) => {
  const progress = ((-delay % dur) + dur) % dur / dur;
  return { '--dur': `${dur}s`, '--delay': `${delay}s`, '--rest': r1(-dir * progress * 100) } as CSSProperties;
};

function OctopusArt({ layout }: { layout: OctoLayout }) {
  const { head, nodes, w, h, legend, guide } = layout;
  const arms = nodes.map((node, i) => tentaclePath(layout, node, i));
  const halo = domePath(head.cx, head.base + 6, head.halfW + 8, head.h + 14);
  const k = layout.font / 10.5; // type scale relative to the wide layout

  return (
    <svg className={`art art--octopus art--${layout.variant}`} viewBox={`0 0 ${w} ${h}`} {...svgProps}>
      {/* blueprint guide: the arc the modules sit on */}
      {guide && (
        <path
          d={`M${head.cx - guide.rx} ${guide.cy}A${guide.rx} ${guide.ry} 0 0 0 ${head.cx + guide.rx} ${guide.cy}`}
          className="stroke-text"
          strokeOpacity=".08"
          strokeDasharray="2 6"
        />
      )}

      {/* tentacles: a soft "arm" under a hairline */}
      <g strokeLinecap="round">
        {arms.map((d, i) => <path key={`g${i}`} d={d} className="stroke-deep" strokeOpacity=".32" strokeWidth="5" />)}
        {arms.map((d, i) => <path key={`l${i}`} d={d} className="stroke-text" strokeOpacity=".22" strokeWidth="1.2" />)}
      </g>

      {/* packets: orders out to the modules (green), status back to the head (violet) */}
      <g strokeLinecap="round" strokeWidth="3.4">
        {arms.map((d, i) => (
          <path key={`o${i}`} d={d} pathLength={100} className="oct-packet stroke-accent" style={timing(OUT_DUR[i], OUT_DELAY[i], 1)} />
        ))}
        {arms.map((d, i) => BACK.has(i) && (
          <path key={`b${i}`} d={d} pathLength={100} className="oct-packet oct-packet--back stroke-violet" style={timing(OUT_DUR[i] + 0.8, OUT_DELAY[i] - 1.3, -1)} />
        ))}
      </g>

      {/* platform head */}
      <path d={halo} className="stroke-accent pulse" strokeOpacity=".35" />
      <path d={domePath(head.cx, head.base, head.halfW, head.h)} className="fill-deep stroke-accent" strokeOpacity=".9" />
      <circle cx={head.cx} cy={head.base - head.h + 20} r="3.2" className="fill-accent pulse pulse--delay" />
      <text x={head.cx} y={r1(head.base - 22 - 14 * k)} textAnchor="middle" className="art-display fill-text" fontSize={r1(19 * k)}>Octopus</text>
      <text x={head.cx} y={head.base - 19} textAnchor="middle" className="art-mono fill-text" fillOpacity=".72" fontSize={r1(7.5 * k)} letterSpacing=".9">WORKFLOW</text>
      {nodes.map((_, i) => {
        const span = head.halfW * 1.46;
        return <circle key={`p${i}`} cx={r1(head.cx - span / 2 + (span * i) / (nodes.length - 1))} cy={head.base} r="1.9" className="fill-accent" />;
      })}

      {/* modules */}
      <g className="art-mono" fontSize={layout.font}>
        {nodes.map((node) => {
          const hot = node.label === 'AI checks' || node.label === 'bill of lading';
          return (
            <g key={node.label}>
              <rect
                x={r1(node.x - node.w / 2)}
                y={r1(node.y - layout.pillH / 2)}
                width={node.w}
                height={layout.pillH}
                rx={layout.pillH / 2}
                className={hot ? 'fill-surface stroke-accent' : 'fill-surface stroke-text'}
                strokeOpacity={hot ? 0.85 : 0.2}
              />
              <text x={node.x} y={r1(node.y + layout.font * 0.35)} textAnchor="middle" className={hot ? 'fill-accent' : 'fill-text'} fillOpacity={hot ? 1 : 0.82}>
                {node.label}
              </text>
            </g>
          );
        })}
      </g>

      {/* legend */}
      <g className="art-mono" fontSize={r1(8 * k)} letterSpacing=".8">
        <circle cx={r1(legend.x - 58 * k)} cy={r1(legend.y - 2.8 * k)} r={r1(2.6 * k)} className="fill-accent" />
        <text x={r1(legend.x - 51 * k)} y={legend.y} className="fill-text" fillOpacity=".55">ORDER</text>
        <circle cx={r1(legend.x + 8 * k)} cy={r1(legend.y - 2.8 * k)} r={r1(2.6 * k)} className="fill-violet" />
        <text x={r1(legend.x + 15 * k)} y={legend.y} className="fill-text" fillOpacity=".55">STATUS</text>
      </g>
    </svg>
  );
}

/** Both compositions are rendered; CSS shows the one that fits the viewport. */
function Octopus() {
  return (
    <>
      <OctopusArt layout={WIDE} />
      <OctopusArt layout={COMPACT} />
    </>
  );
}

/* ---------------------------------------------------------------------------
   02 — Bill of Lading: shipments moving round the world, and a generic engine that turns a
   commercial invoice into any carrier's B/L.
   Left, a dot-matrix globe (centred on the Arabian Sea) under live sea lanes: vessels are short
   dashes sailing their routes. The lit KHI → RTM lane is the shipment on the bill, with a hull
   sailing each way; the other lanes run on over the horizon.
   Right, the engine: invoice → AI extraction → B/L, written field by field into one shipping
   line's template (carrier A → B → C, one bill per 8s cycle) and issued as a checksummed PDF.
   The geography is hand-drawn and stylised; it is baked into plain path data by
   scripts/gen-bl-globe.mjs (components/blGlobeGeometry.ts), so nothing is projected in the
   browser. Motion is paint-only: the .bl-* rules in work.css animate stroke-dashoffset and
   opacity.
   --------------------------------------------------------------------------- */

/** Vessel timing: `--rest` is where it sits when motion is reduced (a stroke-dashoffset on pathLength 100). */
const blVoyage = (dur: number, delay: number, rest: number) =>
  ({ '--dur': `${dur}s`, '--delay': `${delay}s`, '--rest': -rest } as CSSProperties);

type BlVesselProps = {
  lane: BlLaneGeo;
  tone: 'accent' | 'violet' | 'text';
  dur: number;
  delay: number;
  rest: number;
  /** sails on over the horizon (no easing into port) */
  horizon?: boolean;
  /** the shipment on the bill: a bigger hull with a soft glow and a long wake */
  hero?: boolean;
};

/**
 * A vessel: a round-capped hull with a short wake behind it, both dashes sailing its lane
 * (.bl-sail, pathLength 100). The group carries the timing and fades the vessel in at departure
 * and out on arrival (.bl-vessel), so each vessel runs one opacity animation, not one per path.
 * The hero is longer, set off the lit lane by a dark casing, with a soft glow and a long wake.
 */
function BlVessel({ lane, tone, dur, delay, rest, horizon, hero }: BlVesselProps) {
  const u = (n: number) => r1((n * 1000) / lane.len) / 10; // viewBox units → path units
  const hull = `${u(hero ? 4.4 : 3)} ${r1(200 - u(hero ? 4.4 : 3))}`;
  // wakes: butt-capped dashes that end right behind the hull ("0 gap length 0": the zero-length dash draws nothing)
  const wake = (n: number) => `0 ${r1(200 - u(n))} ${u(n)} 0`;
  const props = { d: lane.d, pathLength: 100, className: `bl-sail stroke-${tone}` };
  return (
    <g className={`bl-vessel${horizon ? ' bl-vessel--horizon' : ''}`} style={blVoyage(dur, delay, rest)}>
      {hero && <path {...props} strokeOpacity=".13" strokeWidth="1.3" strokeDasharray={wake(44)} />}
      <path {...props} strokeOpacity=".4" strokeWidth="2.2" strokeDasharray={wake(14)} />
      {hero && <path {...props} strokeOpacity=".16" strokeWidth="11" strokeLinecap="round" strokeDasharray={hull} />}
      {hero && <path {...props} className="bl-sail stroke-ink" strokeWidth="7" strokeLinecap="round" strokeDasharray={hull} />}
      <path {...props} strokeWidth={hero ? 4.6 : 3.8} strokeLinecap="round" strokeDasharray={hull} />
    </g>
  );
}

/* The B/L document */
const BL_DOC = { x: 258, y: 66, w: 128, h: 190 } as const;
const BL_CYCLE = 8; // seconds per generated document (the 8s .bl-* rules in work.css)
const BL_INK = 2000; // dash length of the write-on trick (see blInk)

/**
 * Dash pattern for a value written into the B/L. Every field shares one keyframe (bl-ink:
 * stroke-dashoffset 2000 → 0 over the cycle); each pattern is rotated so its field starts
 * drawing `at` seconds into the cycle and stays drawn until the sheet clears. With no animation
 * (reduced motion) the offset rests at 0 and every field stands fully written.
 */
function blInk(at: number) {
  const k = r1((at / BL_CYCLE) * BL_INK);
  return `${r1(BL_INK - k)} ${BL_INK} ${k} 0`;
}

/**
 * The engine's caption under the sheet, INVOICE → [✦ AI] → B/L · ANY CARRIER, set right to left
 * from the sheet's right edge in Geist Mono (8 units, letter-spacing .3). It sits below the sheet,
 * not above it: the card's status chip covers the top of the artwork on short desktop cards.
 */
const BL_PIPE = (() => {
  const adv = 8 * MONO_ADVANCE + 0.3;
  const out = r1(BL_DOC.x + BL_DOC.w - 'B/L · ANY CARRIER'.length * adv); // output label starts
  const tip2 = r1(out - 2.5); // arrow into the B/L
  const chipR = r1(tip2 - 7);
  const ai = r1(chipR - 3); // "AI" ends
  const star = r1(ai - 2 * adv - 5.6); // sparkle centre
  const chipL = r1(star - 6.6);
  const tip1 = r1(chipL - 1); // arrow into the AI step
  const inv = r1(tip1 - 9.5); // "INVOICE" ends
  return { y: 276, mid: 273.3, tip1, tip2, chipL, chipR, ai, star, inv, from: r1(inv + 2.5) };
})();

function BillOfLading() {
  const { cx, cy, r } = BL_GLOBE;
  const { x, y, w, h } = BL_DOC;
  const pipe = BL_PIPE;
  const mid = x + w / 2;
  const c1 = x + 8; // cell insets
  const c2 = mid + 6;
  const rows = [y + 32, y + 58, y + 84, y + 114, y + 140]; // the form's rules
  const label = (lx: number, ly: number, text: string) => <text x={lx} y={ly} className="fill-text" fillOpacity=".45">{text}</text>;
  const value = (vx: number, vy: number, vw: number, at: number, faint?: boolean) => (
    <path d={`M${vx + 2} ${vy}h${vw}`} pathLength={100} className="bl-write stroke-text" strokeOpacity={faint ? 0.2 : 0.5} strokeWidth={faint ? 2.6 : 3.6} strokeLinecap="round" strokeDasharray={blInk(at)} />
  );
  const arrowHead = (tx: number, ty: number) => `M${r1(tx - 2.5)} ${r1(ty - 2.5)}l2.5 2.5-2.5 2.5`;

  return (
    <svg className="art art--bl" viewBox="0 0 400 300" {...svgProps}>
      {/* ---- globe ---- */}
      <circle cx={cx} cy={cy} r={r + 18} className="fill-deep" fillOpacity=".08" />
      <circle cx={cx} cy={cy} r={r} className="fill-screen" />
      <circle cx={cx} cy={cy} r={r} className="fill-deep" fillOpacity=".12" />
      {/* graticule */}
      <g className="stroke-text" strokeOpacity=".07" strokeWidth=".7">
        {BL_MERIDIANS.map((d, i) => <path key={i} d={d} />)}
      </g>
      <g className="stroke-text" strokeOpacity=".16" strokeWidth=".8" strokeDasharray="1.2 1.8">
        {BL_PARALLELS.map((d, i) => <path key={i} d={d} pathLength={100} />)}
      </g>
      {/* land, in four depth bands that fade towards the limb */}
      <g className="stroke-text" strokeLinecap="round">
        <path d={BL_DOTS[0]} strokeOpacity=".4" strokeWidth="1.8" />
        <path d={BL_DOTS[1]} strokeOpacity=".3" strokeWidth="1.7" />
        <path d={BL_DOTS[2]} strokeOpacity=".19" strokeWidth="1.5" />
        <path d={BL_DOTS[3]} strokeOpacity=".09" strokeWidth="1.3" />
      </g>
      {/* night side, rim light, atmosphere, outline */}
      <path d={`M${cx} ${cy - r}A${r} ${r} 0 0 1 ${cx} ${cy + r}A${r * 0.42} ${r} 0 0 0 ${cx} ${cy - r}Z`} className="fill-screen" fillOpacity=".5" transform={`rotate(34 ${cx} ${cy})`} />
      <path d={BL_RIM} className="stroke-text" strokeOpacity=".14" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={r + 1.5} className="stroke-deep" strokeOpacity=".45" strokeWidth="3" />
      <circle cx={cx} cy={cy} r={r} className="stroke-text" strokeOpacity=".26" />
      {/* bezel: a tick every 10° */}
      <path d={`M${cx + r + 7} ${cy}a${r + 7} ${r + 7} 0 0 1 ${-2 * (r + 7)} 0a${r + 7} ${r + 7} 0 0 1 ${2 * (r + 7)} 0`} pathLength={360} className="stroke-text" strokeOpacity=".22" strokeWidth="3" strokeDasharray=".35 9.65" />

      {/* sea lanes: the shipment's lane lit, the rest dotted */}
      <g strokeLinecap="round" strokeLinejoin="round">
        <g className="stroke-text" strokeOpacity=".28" strokeDasharray="1.5 3">
          <path d={BL_LANES.shaJea.d} />
          <path d={BL_LANES.rtmNyc.d} />
          <path d={BL_LANES.sinCape.d} />
          <path d={BL_LANES.shaPac.d} />
        </g>
        <path d={BL_LANES.khiRtm.d} className="stroke-deep" strokeOpacity=".6" strokeWidth="4" />
        <path d={BL_LANES.khiRtm.d} className="stroke-accent" strokeOpacity=".4" strokeWidth="1.1" />
      </g>
      {/* vessels under way */}
      <BlVessel lane={BL_LANES.khiRtmBack} tone="text" dur={14} delay={-10.5} rest={42} />
      <BlVessel lane={BL_LANES.shaJea} tone="violet" dur={13} delay={-6.5} rest={46} />
      <BlVessel lane={BL_LANES.shaJea} tone="text" dur={13} delay={-12.4} rest={78} />
      <BlVessel lane={BL_LANES.rtmNyc} tone="text" dur={6.5} delay={-1.2} rest={55} horizon />
      <BlVessel lane={BL_LANES.sinCape} tone="text" dur={16} delay={-9} rest={56} horizon />
      <BlVessel lane={BL_LANES.shaPac} tone="text" dur={5.5} delay={-3.4} rest={58} horizon />
      <BlVessel lane={BL_LANES.khiRtm} tone="accent" dur={12} delay={-3} rest={40} hero />

      {/* ports: the shipment's two are lit */}
      {(['SHA', 'SIN', 'JEA'] as const).map((code) => <circle key={code} cx={BL_AT[code].x} cy={BL_AT[code].y} r="2.3" className="fill-text" />)}
      {(['KHI', 'RTM'] as const).map((code, i) => (
        <g key={code}>
          <circle cx={BL_AT[code].x} cy={BL_AT[code].y} r="6.5" className={`stroke-accent pulse${i ? ' pulse--delay' : ''}`} strokeOpacity=".65" />
          <circle cx={BL_AT[code].x} cy={BL_AT[code].y} r="2.8" className="fill-accent" />
        </g>
      ))}
      <g className="art-mono fill-text stroke-ink" fontSize="8" letterSpacing=".6" strokeWidth="3" strokeLinejoin="round" paintOrder="stroke">
        <text x={BL_AT.KHI.x + 9} y={BL_AT.KHI.y - 5}>KHI</text>
        <text x={BL_AT.RTM.x + 9} y={BL_AT.RTM.y - 5}>RTM</text>
        <g fillOpacity=".7" textAnchor="end">
          <text x={BL_AT.JEA.x - 5} y={BL_AT.JEA.y - 5}>JEA</text>
          <text x={BL_AT.SHA.x - 6} y={BL_AT.SHA.y - 6}>SHA</text>
          <text x={BL_AT.SIN.x - 6} y={BL_AT.SIN.y + 12}>SIN</text>
        </g>
      </g>

      {/* ---- the B/L engine: a stack of carrier templates, the bill on top ---- */}
      <rect x={x + 16} y={y - 18} width={w - 32} height={h} rx="5" className="fill-surface stroke-text" strokeOpacity=".12" />
      <rect x={x + 8} y={y - 9} width={w - 16} height={h} rx="5" className="fill-raised stroke-text" strokeOpacity=".16" />
      <rect x={x} y={y} width={w} height={h} rx="5" className="fill-surface stroke-text" strokeOpacity=".3" />

      {/* the form */}
      <g className="stroke-text" strokeOpacity=".14">
        {rows.map((ry) => <path key={ry} d={`M${x} ${ry}h${w}`} />)}
        <path d={`M${mid} ${rows[0]}V${rows[4]}`} />
      </g>
      <text x={c1} y={y + 14} className="art-mono fill-text" fontSize="9" letterSpacing=".7">BILL OF LADING</text>
      <g className="art-mono" fontSize="8" letterSpacing=".4">
        {label(c1, y + 25.5, 'CARRIER')}
        {label(c1, rows[0] + 10, 'SHIPPER')}
        {label(c2, rows[0] + 10, 'B/L NO.')}
        {label(c1, rows[1] + 10, 'CONSIGNEE')}
        {label(c2, rows[1] + 10, 'VESSEL/VOY')}
        {label(c1, rows[2] + 10, 'LOADING')}
        {label(c2, rows[2] + 10, 'DISCHARGE')}
        {label(c1, rows[3] + 10, 'CONTAINER')}
        {label(c2, rows[3] + 10, 'GROSS WT')}
      </g>
      {/* any shipping line's template: one carrier per bill, A → B → C */}
      <g className="art-mono" fontSize="7.5" textAnchor="middle">
        {(['A', 'B', 'C'] as const).map((c, i) => (
          <g key={c}>
            <rect x={c1 + 40 + i * 19} y={y + 17.5} width="16" height="11" rx="5.5" className="stroke-text" strokeOpacity=".22" />
            <text x={c1 + 48 + i * 19} y={y + 25.5} className="fill-text" fillOpacity=".5">{c}</text>
          </g>
        ))}
        <g className="bl-doc">
          {(['A', 'B', 'C'] as const).map((c, i) => (
            <g key={c} className={`bl-carrier${i ? ` bl-carrier--${c.toLowerCase()}` : ''}`}>
              <rect x={c1 + 40 + i * 19} y={y + 17.5} width="16" height="11" rx="5.5" className="fill-violet" />
              <text x={c1 + 48 + i * 19} y={y + 25.5} className="fill-ink">{c}</text>
            </g>
          ))}
        </g>
      </g>

      {/* the values, written on in order; the sheet clears at the end of each cycle */}
      <g className="bl-doc">
        {value(c1, rows[0] + 17, 40, 0.3)}
        {value(c1, rows[0] + 22, 26, 0.5, true)}
        {value(c2, rows[0] + 17, 30, 0.75)}
        {value(c1, rows[1] + 17, 44, 0.95)}
        {value(c1, rows[1] + 22, 30, 1.15, true)}
        {value(c2, rows[1] + 17, 38, 1.35)}
        <g className="bl-reveal">
          <g className="art-mono fill-text" fontSize="10.5" letterSpacing=".9">
            <text x={c1} y={rows[2] + 24}>KHI</text>
            <text x={c2} y={rows[2] + 24}>RTM</text>
          </g>
          <path d={`M${c1 + 27} ${rows[2] + 20.5}h${mid - c1 - 31}m-3.5 -3l3.5 3l-3.5 3`} className="stroke-text" strokeOpacity=".55" strokeLinecap="round" strokeLinejoin="round" />
        </g>
        {value(c1, rows[3] + 17, 34, 2)}
        {value(c2, rows[3] + 17, 26, 2.25)}
        {/* progress down the margin */}
        <path d={`M${x + 3} ${rows[0] + 4}V${rows[4] - 4}`} pathLength={800} className="bl-write stroke-text" strokeOpacity=".4" strokeWidth="1.4" strokeLinecap="round" strokeDasharray={blInk(0.15)} />
      </g>

      {/* output: a checksummed PDF, issued */}
      <rect x={c1} y={rows[4] + 12} width="30" height="15" rx="7.5" className="stroke-text" strokeOpacity=".35" />
      <g className="art-mono fill-text" fontSize="7.5">
        <text x={c1 + 15} y={rows[4] + 22.5} textAnchor="middle" fillOpacity=".8" letterSpacing=".5">PDF</text>
        <text x={c1} y={rows[4] + 41} fillOpacity=".38" letterSpacing=".3">SHA256 · V3</text>
      </g>
      {/* until it's issued: a draft, and an empty seal */}
      <text x={x + w - 37} y={rows[4] + 22.5} textAnchor="end" className="bl-draft art-mono fill-text" fontSize="8.5" fillOpacity=".4" letterSpacing="1.2">DRAFT</text>
      <circle cx={x + w - 18} cy={rows[4] + 19} r="11" className="stroke-text" strokeOpacity=".28" strokeDasharray="2 2.6" />
      <g className="bl-doc">
        <g className="bl-issue">
          <text x={x + w - 37} y={rows[4] + 22.5} textAnchor="end" className="art-mono fill-accent" fontSize="8.5" letterSpacing="1.2">ISSUED</text>
          <circle cx={x + w - 18} cy={rows[4] + 19} r="17" className="pulse fill-accent" fillOpacity=".15" />
          <circle cx={x + w - 18} cy={rows[4] + 19} r="11" className="fill-accent" />
          <path d={`M${x + w - 23} ${rows[4] + 19}l3.4 3.4l6.8 -6.8`} className="stroke-ink" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </g>
      {/* the pipeline under the sheet: invoice in → AI extraction → B/L out; the invoice's data
          runs through the AI step and reaches the bill as its first field starts writing */}
      <path d={`M${pipe.from} ${pipe.mid}H${pipe.tip2}`} className="stroke-text" strokeOpacity=".4" />
      <path d={`${arrowHead(pipe.tip1, pipe.mid)}${arrowHead(pipe.tip2, pipe.mid)}`} className="stroke-text" strokeOpacity=".45" strokeLinecap="round" strokeLinejoin="round" />
      <path d={`M${pipe.from} ${pipe.mid}H${pipe.tip2}`} pathLength={100} className="bl-feed stroke-violet" strokeWidth="2.6" strokeLinecap="round" strokeDasharray="5 300" />
      <rect x={pipe.chipL} y={pipe.mid - 5.5} width={r1(pipe.chipR - pipe.chipL)} height="11" rx="5.5" className="fill-raised stroke-violet" strokeOpacity=".55" />
      <path d={`M${pipe.star} ${r1(pipe.mid - 4.1)}c.5 2.5 1.6 3.6 4.1 4.1-2.5.5-3.6 1.6-4.1 4.1-.5-2.5-1.6-3.6-4.1-4.1 2.5-.5 3.6-1.6 4.1-4.1Z`} className="fill-violet" />
      <g className="art-mono fill-text" fontSize="8" letterSpacing=".3" textAnchor="end">
        <text x={x + w} y={pipe.y} fillOpacity=".6">B/L · ANY CARRIER</text>
        <text x={pipe.ai} y={pipe.y} fillOpacity=".8">AI</text>
        <text x={pipe.inv} y={pipe.y} fillOpacity=".4">INVOICE</text>
      </g>
    </svg>
  );
}

/* ---------------------------------------------------------------------------
   03 — BlockMed Pro: read / write gateways over the healthcare modules, a database per
   service (the patient store carries the CSFLE lock), RabbitMQ events underneath and the
   Terraform-managed environments along the bottom.
   --------------------------------------------------------------------------- */
function BlockMed() {
  const modules = [
    { x: 18, label: 'patient', hot: true },
    { x: 94, label: 'pharmacy' },
    { x: 170, label: 'pharma' },
    { x: 246, label: 'clinic' },
    { x: 322, label: 'admin' },
  ];
  const envs = ['dev', 'qa', 'uat', 'stage', 'prod'];
  return (
    <svg className="art" viewBox="0 0 400 300" {...svgProps}>
      {/* drawn 20 units down so the card's status chip never covers the gateways */}
      <g transform="translate(0 20)">
      {/* gateways */}
      <rect x="56" y="22" width="128" height="26" rx="13" className="fill-surface stroke-accent" strokeOpacity=".7" />
      <text x="120" y="39" textAnchor="middle" className="art-mono fill-accent" fontSize="9">GET · read gateway</text>
      <rect x="216" y="22" width="128" height="26" rx="13" className="fill-surface stroke-violet" strokeOpacity=".8" />
      <text x="280" y="39" textAnchor="middle" className="art-mono fill-text" fontSize="9" fillOpacity=".8">POST · write gateway</text>
      {/* gateway → module links */}
      <g className="flow stroke-accent" strokeOpacity=".4">
        {modules.map((m) => <path key={`r-${m.label}`} d={`M120 48 C120 70 ${m.x + 30} 70 ${m.x + 30} 92`} />)}
      </g>
      <g className="stroke-violet" strokeOpacity=".3" strokeDasharray="2 4">
        {modules.map((m) => <path key={`w-${m.label}`} d={`M280 48 C280 70 ${m.x + 30} 70 ${m.x + 30} 92`} />)}
      </g>
      {/* modules + their own databases */}
      {modules.map((m) => (
        <g key={m.label}>
          <rect x={m.x} y="92" width="60" height="26" rx="6" className={m.hot ? 'fill-deep stroke-accent' : 'fill-raised stroke-text'} strokeOpacity={m.hot ? 0.9 : 0.18} />
          <text x={m.x + 30} y="109" textAnchor="middle" className="art-mono fill-text" fontSize="8.5">{m.label}</text>
          <path d={`M${m.x + 30} 118v14`} className="stroke-text" strokeOpacity=".2" />
          <ellipse cx={m.x + 30} cy="138" rx="16" ry="5" className={m.hot ? 'fill-screen stroke-accent' : 'fill-screen stroke-text'} strokeOpacity={m.hot ? 0.9 : 0.3} />
          <path d={`M${m.x + 14} 138v18c0 2.8 7.2 5 16 5s16-2.2 16-5v-18`} className={m.hot ? 'stroke-accent' : 'stroke-text'} strokeOpacity={m.hot ? 0.9 : 0.3} />
          <path d={`M${m.x + 30} 161v29`} className="stroke-text" strokeOpacity=".16" />
        </g>
      ))}
      {/* CSFLE lock on the patient store */}
      <g className="pulse">
        <rect x="56" y="140" width="14" height="11" rx="2" className="fill-accent" />
        <path d="M59 140v-3a4 4 0 0 1 8 0v3" className="stroke-accent" strokeWidth="1.6" />
      </g>
      <text x="74" y="150" className="art-mono fill-accent" fontSize="7.5">CSFLE</text>
      {/* RabbitMQ event bus */}
      <rect x="18" y="190" width="364" height="18" rx="9" className="fill-raised" />
      <text x="30" y="203" className="art-mono fill-text" fontSize="8.5" fillOpacity=".55">rabbitmq · events</text>
      <line className="stream stroke-violet" x1="160" y1="199" x2="372" y2="199" strokeWidth="7" strokeLinecap="round" strokeDasharray="0 36" />
      {/* Terraform-managed environments */}
      <text x="18" y="236" className="art-mono fill-text" fontSize="8" fillOpacity=".5">terraform · gke · vpc peering</text>
      {envs.map((e, i) => (
        <g key={e}>
          <rect x={18 + i * 58} y="246" width="50" height="22" rx="11" className={e === 'prod' ? 'fill-accent' : 'fill-surface stroke-text'} strokeOpacity={e === 'prod' ? undefined : 0.22} />
          <text x={43 + i * 58} y="261" textAnchor="middle" className={`art-mono ${e === 'prod' ? 'fill-ink' : 'fill-text'}`} fontSize="8.5">{e}</text>
        </g>
      ))}
      <rect x="312" y="246" width="70" height="22" rx="11" className="fill-deep" />
      <text x="347" y="261" textAnchor="middle" className="art-mono fill-text" fontSize="8.5">20+ svc</text>
      </g>
    </svg>
  );
}

/* ---------------------------------------------------------------------------
   04 — Charmy: the app talks to an Ambassador / GraphQL gateway that fans out to the
   NestJS microservices, each with its own Postgres; Kafka carries events between them.
   --------------------------------------------------------------------------- */
function Charmy() {
  const services = ['auth', 'account', 'profile', 'chat', 'order', 'charities', 'notify'];
  return (
    <svg className="art" viewBox="0 0 400 300" {...svgProps}>
      {/* phone */}
      <rect x="28" y="52" width="92" height="176" rx="16" className="fill-screen stroke-text" strokeOpacity=".3" />
      <rect x="60" y="60" width="28" height="5" rx="2.5" className="fill-text" fillOpacity=".2" />
      <path d="M74 94c-6-8-17-3-13 6 2 4 13 12 13 12s11-8 13-12c4-9-7-14-13-6Z" className="fill-accent pulse" />
      <rect x="40" y="128" width="54" height="18" rx="9" className="fill-raised" />
      <rect x="56" y="152" width="54" height="18" rx="9" className="fill-deep" />
      <rect x="40" y="176" width="44" height="18" rx="9" className="fill-raised" />
      {/* app → gateway */}
      <path d="M120 140 H164" className="flow stroke-accent" strokeOpacity=".6" strokeWidth="1.5" />
      <rect x="164" y="112" width="92" height="56" rx="12" className="fill-accent" />
      <text x="210" y="136" textAnchor="middle" className="art-mono fill-ink" fontSize="9">ambassador</text>
      <text x="210" y="152" textAnchor="middle" className="art-mono fill-ink" fontSize="9">graphql gw</text>
      {/* services */}
      <g className="flow stroke-accent" strokeOpacity=".4">
        {services.map((sv, i) => <path key={`l-${sv}`} d={`M256 140 C276 140 276 ${46 + i * 30} 294 ${46 + i * 30}`} />)}
      </g>
      {services.map((sv, i) => (
        <g key={sv}>
          <rect x="294" y={34 + i * 30} width="84" height="24" rx="6" className={sv === 'chat' ? 'fill-deep stroke-accent' : 'fill-surface stroke-text'} strokeOpacity={sv === 'chat' ? 0.8 : 0.2} />
          <text x="306" y={50 + i * 30} className="art-mono fill-text" fontSize="8.5" fillOpacity=".8">{sv}</text>
          <circle cx="366" cy={46 + i * 30} r="4" className="stroke-text" strokeOpacity=".35" />
        </g>
      ))}
      {/* Kafka bus */}
      <rect x="164" y="252" width="214" height="18" rx="9" className="fill-raised" />
      <text x="176" y="265" className="art-mono fill-text" fontSize="8.5" fillOpacity=".55">kafka · events</text>
      <line className="stream stroke-violet" x1="252" y1="261" x2="370" y2="261" strokeWidth="7" strokeLinecap="round" strokeDasharray="0 36" />
      <path d="M210 168v84" className="stroke-text" strokeOpacity=".16" strokeDasharray="2 4" />
      <text x="28" y="252" className="art-mono fill-text" fontSize="8.5" fillOpacity=".5">nestjs monorepo</text>
      <text x="28" y="266" className="art-mono fill-text" fontSize="8.5" fillOpacity=".5">azure kubernetes</text>
    </svg>
  );
}

/* ---------------------------------------------------------------------------
   05 — Otobucks: web + mobile apps and the provider / admin panels on one API,
   serving car services in Dubai.
   --------------------------------------------------------------------------- */
function Otobucks() {
  const clients = [
    { x: 24, w: 78, label: 'web app' },
    { x: 112, w: 86, label: 'android app' },
    { x: 208, w: 92, label: 'provider panel' },
    { x: 310, w: 70, label: 'admin' },
  ];
  return (
    <svg className="art" viewBox="0 0 400 300" {...svgProps}>
      {/* drawn 18 units down so the card's status chip never covers the client row */}
      <g transform="translate(0 18)">
      {clients.map((c) => (
        <g key={c.label}>
          <rect x={c.x} y="28" width={c.w} height="24" rx="12" className="fill-surface stroke-text" strokeOpacity=".22" />
          <text x={c.x + c.w / 2} y="44" textAnchor="middle" className="art-mono fill-text" fontSize="8.5" fillOpacity=".8">{c.label}</text>
        </g>
      ))}
      <g className="flow stroke-accent" strokeOpacity=".45">
        {clients.map((c) => <path key={`f-${c.label}`} d={`M${c.x + c.w / 2} 52 C${c.x + c.w / 2} 74 200 70 200 92`} />)}
      </g>
      <rect x="138" y="92" width="124" height="30" rx="15" className="fill-accent" />
      <text x="200" y="111" textAnchor="middle" className="art-mono fill-ink" fontSize="9">fastapi · node api</text>
      <path d="M200 122v22" className="stroke-text" strokeOpacity=".2" />
      {/* car */}
      <path
        d="M96 226 L104 206 Q112 192 130 190 L160 188 L188 168 Q197 162 210 162 L250 162 Q264 162 273 173 L288 190 Q302 192 305 206 L307 226 Z"
        className="fill-raised stroke-text" strokeOpacity=".3"
      />
      <path d="M170 188 L192 172 Q198 168 206 168 L226 168 L226 188 Z M234 188 L234 168 L248 168 Q258 168 265 176 L276 188 Z" className="fill-screen stroke-accent" strokeOpacity=".5" />
      <circle cx="140" cy="228" r="17" className="fill-screen stroke-accent" strokeWidth="2" />
      <circle cx="140" cy="228" r="6" className="fill-accent" />
      <circle cx="264" cy="228" r="17" className="fill-screen stroke-accent" strokeWidth="2" />
      <circle cx="264" cy="228" r="6" className="fill-accent" />
      <path d="M60 246 H344" className="stroke-text" strokeOpacity=".14" />
      {/* Dubai pin */}
      <g className="pulse">
        <path d="M336 158 C324 143 322 136 322 129 A14 14 0 1 1 350 129 C350 136 348 143 336 158Z" className="fill-deep stroke-accent" strokeOpacity=".8" />
        <circle cx="336" cy="129" r="5" className="fill-accent" />
      </g>
      <text x="336" y="176" textAnchor="middle" className="art-mono fill-accent" fontSize="8.5">DUBAI</text>
      <text x="24" y="276" className="art-mono fill-text" fontSize="8.5" fillOpacity=".5">car services · web + mobile</text>
      </g>
    </svg>
  );
}

/* ---------------------------------------------------------------------------
   06 — Headless commerce
   --------------------------------------------------------------------------- */
function Headless() {
  const tiles = [
    { x: 86, y: 78, cls: 'fill-raised' },
    { x: 165, y: 78, cls: 'fill-accent', opacity: 0.9 },
    { x: 244, y: 78, cls: 'fill-raised' },
    { x: 86, y: 170, cls: 'fill-raised' },
    { x: 165, y: 170, cls: 'fill-raised' },
    { x: 244, y: 170, cls: 'fill-violet', opacity: 0.55 },
  ];
  return (
    <svg className="art" viewBox="0 0 400 300" {...svgProps}>
      <rect x="70" y="40" width="260" height="210" rx="12" className="fill-screen stroke-text" strokeOpacity=".2" />
      <path d="M70 64h260" className="stroke-text" strokeOpacity=".14" />
      <circle cx="86" cy="52" r="4" className="fill-text" fillOpacity=".3" />
      <circle cx="100" cy="52" r="4" className="fill-text" fillOpacity=".3" />
      <circle cx="114" cy="52" r="4" className="fill-accent" />
      <text x="250" y="56" className="art-mono fill-text" fontSize="8" fillOpacity=".45">PLP · SFRA</text>
      {tiles.map((t) => (
        <g key={`${t.x}-${t.y}`}>
          <rect x={t.x} y={t.y} width="70" height="58" rx="6" className={t.cls} fillOpacity={t.opacity} />
          {t.y === 78 && (
            <>
              <rect x={t.x} y="142" width="50" height="5" rx="2.5" className="fill-text" fillOpacity=".3" />
              <rect x={t.x} y="152" width="30" height="5" rx="2.5" className="fill-accent" fillOpacity=".85" />
            </>
          )}
        </g>
      ))}
      <path d="M330 150 C360 150 360 100 380 100" className="flow stroke-accent" />
      <rect x="340" y="84" width="48" height="22" rx="11" className="fill-surface stroke-accent" />
      <text x="364" y="99" textAnchor="middle" className="art-mono fill-accent" fontSize="9">API</text>
    </svg>
  );
}

/* ---------------------------------------------------------------------------
   07 — Payments & integrations
   --------------------------------------------------------------------------- */
function Payments() {
  const pills = [
    { x: 60, y: 62, w: 84, label: 'Braintree' },
    { x: 270, y: 70, w: 70, label: 'PayPal' },
    { x: 54, y: 206, w: 64, label: 'Yotpo' },
    { x: 282, y: 200, w: 56, label: 'GTM', hot: true },
  ];
  return (
    <svg className="art" viewBox="0 0 400 300" {...svgProps}>
      <ellipse cx="200" cy="150" rx="150" ry="100" className="stroke-text" strokeOpacity=".12" />
      {/* the dashed orbit (rx 104, ry 68, drawn clockwise from 3 o'clock): its dashes travel round
          via stroke-dashoffset. pathLength 100 → 60 even dash periods (≈ the old 3 / 6 user-unit
          dash), so the loop has no seam. A <path>, not an <ellipse>: pathLength on basic shapes
          isn't supported everywhere. */}
      <path
        d="M304 150A104 68 0 0 1 96 150A104 68 0 0 1 304 150Z"
        pathLength={100}
        className="spin-view stroke-text"
        strokeOpacity=".16"
        strokeDasharray="0.5556 1.1111"
      />
      <circle cx="200" cy="150" r="38" className="fill-accent" />
      <text x="200" y="146" textAnchor="middle" className="art-display fill-ink" fontSize="11">{"L'Oréal"}</text>
      <text x="200" y="162" textAnchor="middle" className="art-mono fill-ink" fontSize="9">JAPAN</text>
      <g className="art-mono" fontSize="10">
        {pills.map((p) => (
          <g key={p.label}>
            <rect x={p.x} y={p.y} width={p.w} height="26" rx="13" className={p.hot ? 'fill-deep' : 'fill-surface stroke-text'} strokeOpacity={p.hot ? undefined : 0.25} />
            <text x={p.x + p.w / 2} y={p.y + 17} textAnchor="middle" className="fill-text">{p.label}</text>
          </g>
        ))}
      </g>
      <g className="flow stroke-accent" strokeOpacity=".45" strokeDasharray="2 4">
        <path d="M144 80 170 125" />
        <path d="M270 88 232 128" />
        <path d="M118 214 168 170" />
        <path d="M282 208 234 172" />
      </g>
    </svg>
  );
}

export default function ProjectArt({ id }: { id: ProjectArtId }) {
  switch (id) {
    case 'octopus': return <Octopus />;
    case 'bill-of-lading': return <BillOfLading />;
    case 'blockmed': return <BlockMed />;
    case 'charmy': return <Charmy />;
    case 'otobucks': return <Otobucks />;
    case 'headless': return <Headless />;
    case 'payments': return <Payments />;
  }
}

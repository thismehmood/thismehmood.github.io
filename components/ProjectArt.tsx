import { useId, type CSSProperties } from 'react';
import type { ProjectArtId } from '@/lib/data';

/*
 * Decorative SVG illustrations for the Work cards (one per project).
 *
 * Colour comes only from the palette tokens, through classes styled in
 * app/styles/work.css — `.fill-*` / `.stroke-*` (e.g. `.art .fill-accent { fill: var(--accent) }`).
 * Transparency is expressed with fill-/stroke-opacity, never with hard-coded colours.
 *
 * Motion classes (also in work.css): .flow (dash), .stream (dots), .pulse / .pulse--delay /
 * .pulse--delay-2 (breathe), .spin-view (orbit), .oct-packet (travelling packets). They animate
 * paint-only properties (stroke-dashoffset, opacity), never transforms, so they don't force SVG
 * layout. Each card's art is paused while that card is off-screen (the card's `.is-inview`
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
   02 — Bill of Lading
   --------------------------------------------------------------------------- */
function BillOfLading() {
  return (
    <svg className="art" viewBox="0 0 400 300" {...svgProps}>
      <rect x="112" y="52" width="176" height="212" rx="10" className="fill-surface stroke-text" strokeOpacity=".12" transform="rotate(-9 200 158)" />
      <rect x="112" y="46" width="176" height="212" rx="10" className="fill-raised stroke-text" strokeOpacity=".18" transform="rotate(5 200 152)" />
      <g transform="rotate(-2 200 150)">
        <rect x="110" y="40" width="180" height="220" rx="10" className="fill-screen stroke-accent" strokeOpacity=".55" />
        <text x="126" y="68" className="art-mono fill-accent" fontSize="10" letterSpacing=".6">BILL OF LADING</text>
        <rect x="126" y="82" width="104" height="6" rx="3" className="fill-text" fillOpacity=".28" />
        <rect x="126" y="96" width="148" height="6" rx="3" className="fill-text" fillOpacity=".12" />
        <rect x="126" y="118" width="66" height="36" rx="4" className="stroke-text" strokeOpacity=".18" />
        <rect x="200" y="118" width="74" height="36" rx="4" className="stroke-text" strokeOpacity=".18" />
        <rect x="126" y="164" width="148" height="5" rx="2.5" className="fill-text" fillOpacity=".1" />
        <rect x="126" y="176" width="120" height="5" rx="2.5" className="fill-text" fillOpacity=".1" />
        <rect x="126" y="188" width="136" height="5" rx="2.5" className="fill-text" fillOpacity=".1" />
        <text x="138" y="200" className="art-display stroke-danger" fontSize="40" strokeOpacity=".8" strokeWidth="1.5" transform="rotate(-16 200 185)">DRAFT</text>
        <text x="126" y="244" className="art-mono fill-text" fontSize="8" fillOpacity=".5">sha256 · 9f2c…e41a · v3</text>
      </g>
      <circle className="pulse fill-accent" cx="296" cy="232" r="34" opacity=".15" />
      <circle cx="296" cy="232" r="24" className="fill-accent" />
      <path d="M285 232l7.5 7.5L308 224" className="stroke-ink" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ---------------------------------------------------------------------------
   03 — Cloud-native microservices on GKE
   --------------------------------------------------------------------------- */
function Gke({ hexId }: { hexId: string }) {
  const hex = `#${hexId}`;
  const idle = 'fill-surface stroke-text';
  return (
    <svg className="art" viewBox="0 0 400 300" {...svgProps}>
      <defs><polygon id={hexId} points="0,-30 26,-15 26,15 0,30 -26,15 -26,-15" /></defs>
      <text x="40" y="44" className="art-mono fill-text" fontSize="10" fillOpacity=".5">gke-autopilot · private-vpc</text>
      <g className="stroke-text" strokeOpacity=".14" strokeWidth="1">
        <path d="M146 108 200 108 254 108M119 155 173 155 227 155 281 155M146 202 200 202 254 202M146 108 119 155 146 202M200 108 173 155 200 202M254 108 227 155 254 202M254 108 281 155 254 202M146 108 173 155M200 108 227 155M146 202 173 155M200 202 227 155" />
      </g>
      <use href={hex} x="146" y="108" className={idle} strokeOpacity=".25" />
      <use href={hex} x="200" y="108" className="fill-accent pulse" />
      <use href={hex} x="254" y="108" className={idle} strokeOpacity=".25" />
      <use href={hex} x="119" y="155" className={idle} strokeOpacity=".25" />
      <use href={hex} x="173" y="155" className="fill-raised stroke-accent" strokeOpacity=".7" />
      <use href={hex} x="227" y="155" className="fill-accent pulse pulse--delay" />
      <use href={hex} x="281" y="155" className={idle} strokeOpacity=".25" />
      <use href={hex} x="146" y="202" className="fill-raised stroke-violet" strokeOpacity=".8" />
      <use href={hex} x="200" y="202" className={idle} strokeOpacity=".25" />
      <use href={hex} x="254" y="202" className="fill-deep pulse pulse--delay-2" />
      <rect x="256" y="236" width="118" height="26" rx="13" className="fill-accent" />
      <text x="315" y="253" textAnchor="middle" className="art-mono fill-ink" fontSize="10">response ↓ ~40%</text>
    </svg>
  );
}

/* ---------------------------------------------------------------------------
   04 — GraphQL gateway over gRPC & Kafka
   --------------------------------------------------------------------------- */
function Gateway() {
  return (
    <svg className="art" viewBox="0 0 400 300" {...svgProps}>
      <g className="flow stroke-accent" strokeOpacity=".55" strokeWidth="1.5">
        <path d="M150 140 C210 140 220 60 280 60" />
        <path d="M150 140 C210 140 220 100 280 100" />
        <path d="M150 140 C210 140 220 140 280 140" />
        <path d="M150 140 C210 140 220 180 280 180" />
        <path d="M150 140 C210 140 220 220 280 220" />
      </g>
      <rect x="60" y="112" width="92" height="56" rx="12" className="fill-accent" />
      <text x="75" y="136" className="art-mono fill-ink" fontSize="10">GraphQL</text>
      <text x="75" y="152" className="art-mono fill-ink" fontSize="10">gateway</text>
      <g className="art-mono" fontSize="9">
        {[48, 88, 128, 168, 208].map((y, i) => (
          <g key={y}>
            <rect x="280" y={y} width="70" height="24" rx="6" className="fill-surface stroke-text" strokeOpacity=".2" />
            <text x="292" y={y + 16} className="fill-text" fillOpacity=".75">{`svc · 0${i + 1}`}</text>
          </g>
        ))}
      </g>
      <rect x="60" y="250" width="290" height="18" rx="9" className="fill-raised" />
      <text x="72" y="263" className="art-mono fill-text" fontSize="9" fillOpacity=".55">kafka · async events</text>
      {/* event dots: zero-length round-capped dashes, one every 36 units, flowing left
          (stroke-dashoffset is paint-only; a transform here would re-lay out the SVG each frame) */}
      <line className="stream stroke-violet" x1="200" y1="259" x2="344" y2="259" strokeWidth="8" strokeLinecap="round" strokeDasharray="0 36" />
    </svg>
  );
}

/* ---------------------------------------------------------------------------
   05 — Headless commerce
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
   06 — Payments & integrations
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
  // Unique, selector/URL-safe id for the hex <defs> (stable across SSR + hydration)
  const hexId = `art-hex-${useId().replace(/[^A-Za-z0-9_-]/g, '')}`;

  switch (id) {
    case 'octopus': return <Octopus />;
    case 'bill-of-lading': return <BillOfLading />;
    case 'gke': return <Gke hexId={hexId} />;
    case 'gateway': return <Gateway />;
    case 'headless': return <Headless />;
    case 'payments': return <Payments />;
  }
}

#!/usr/bin/env node
/*
 * Bakes the geometry of the Bill of Lading card artwork (card 02, BillOfLading() in
 * components/ProjectArt.tsx) into components/blGlobeGeometry.ts.
 *
 * The globe is an orthographic projection centred on the Arabian Sea. Simplified, hand-drawn
 * coastlines (stylised, not survey data) are sampled into a dot matrix; sea lanes are
 * great-circle legs between waypoints, cut at the horizon and smoothed. All of that trig and
 * point-in-polygon work runs here, once, instead of in the client bundle during hydration, and
 * the output is plain path strings, so the server and every browser render the same markup.
 *
 * Run after changing anything below:  node scripts/gen-bl-globe.mjs
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const OUT = fileURLToPath(new URL('../components/blGlobeGeometry.ts', import.meta.url));

const r1 = (n) => Math.round(n * 10) / 10;

export const BL_GLOBE = { cx: 144, cy: 176, r: 106, lon0: 52, lat0: 16 }; // view centre: the Arabian Sea
const DOT_STEP = 2.6; // degrees between land dots
const RAD = Math.PI / 180;
const S0 = Math.sin(BL_GLOBE.lat0 * RAD);
const C0 = Math.cos(BL_GLOBE.lat0 * RAD);

/** Orthographic projection. z = cos(angular distance from the view centre): visible when z > 0. */
function project(lon, lat) {
  const l = (lon - BL_GLOBE.lon0) * RAD;
  const p = lat * RAD;
  const cp = Math.cos(p);
  return {
    x: BL_GLOBE.cx + BL_GLOBE.r * cp * Math.sin(l),
    y: BL_GLOBE.cy - BL_GLOBE.r * (C0 * Math.sin(p) - S0 * cp * Math.cos(l)),
    z: S0 * Math.sin(p) + C0 * cp * Math.cos(l),
  };
}

/* Compact path data: one decimal, no leading zeros, a separator only where the parser needs one. */
const num = (n) => String(r1(n)).replace(/^(-?)0\./, '$1.');
const nums = (ns) => ns.map(num).reduce((s, n, i) => s + (i && !n.startsWith('-') ? ' ' : '') + n, '');
const round = (p) => ({ x: r1(p.x), y: r1(p.y) });

/* Simplified coastlines [lon, lat] — stylised and hand-drawn, not survey data. */
const LAND = [
  // Eurasia (Gibraltar → Mediterranean → Arabia → India → SE Asia → China → Far East → Arctic → Scandinavia → Atlantic)
  [[-9.5, 37], [-6, 36.2], [-2, 36.7], [0, 38.7], [0.3, 40.4], [3.2, 42], [3.1, 43.2], [6, 43.1], [8.7, 44.4], [10.3, 43.5], [12.2, 41.6], [15.6, 40], [15.7, 38.2], [17, 39], [18.5, 40.2], [16.2, 41.4], [13.6, 43.6], [12.3, 45.3], [13.8, 45.6], [15.2, 44.3], [17.5, 43], [19.5, 41.8], [19.4, 40.2], [21, 38.2], [22.5, 36.5], [23.2, 38], [22.8, 40.5], [24, 40.8], [26.2, 40.6], [26.5, 39.5], [27, 37.6], [28.2, 36.7], [30.6, 36.7], [32.6, 36.1], [34.6, 36.8], [36.1, 36.6], [35.8, 34.6], [35, 33], [34.3, 31.3], [34.9, 29.5], [36.6, 26], [38.2, 23.8], [39.2, 21.5], [40.8, 19], [42.6, 15.5], [43.4, 12.7], [45, 12.9], [48.5, 14], [52.2, 15.6], [55.5, 17.4], [57.8, 19], [59.8, 22.4], [58.6, 23.6], [57, 24], [56.4, 24.9], [56.3, 26.3], [55.5, 25.6], [54.2, 24.2], [51.6, 24.3], [51.6, 25.9], [50.6, 25], [49.8, 26.9], [48.6, 28], [48, 29.9], [49.2, 30.1], [50.3, 29.3], [51.4, 27.9], [53.7, 26.7], [55.4, 26.6], [56.4, 27.1], [57.2, 25.8], [61.6, 25.2], [66.6, 25.4], [67.3, 24.4], [68.4, 23.6], [69, 22.5], [70.4, 20.9], [72.6, 21.2], [72.8, 19.1], [73.4, 16.2], [74.5, 13.2], [75.9, 10.6], [77.5, 8.1], [78.2, 8.9], [79.9, 10.4], [80.3, 13.4], [80.1, 15.5], [82.3, 17], [84.2, 18.4], [86.4, 20], [87, 21.5], [89.6, 22], [91.8, 22.4], [92.3, 21], [93.6, 19.5], [94.4, 18], [94.3, 16.1], [95.3, 15.8], [97.6, 16.4], [97.8, 14.8], [98.6, 13], [98.3, 8.2], [99.6, 6.8], [100.3, 5.4], [101.3, 2.8], [103.4, 1.3], [104.2, 1.4], [103.4, 4.2], [102.6, 5.8], [100.4, 7.6], [99.9, 9.2], [99.2, 10.4], [100, 13.4], [100.9, 12.2], [102.3, 12.2], [104.4, 10.4], [104.9, 8.8], [106.7, 9.9], [109.1, 11.4], [109.3, 13.4], [108.8, 15.4], [107, 17], [105.7, 18.9], [106.7, 20.7], [109.6, 21.6], [111.6, 21.6], [113.6, 22.2], [116.5, 22.9], [117.9, 24.4], [119.4, 25.6], [120.5, 28], [121.9, 29.9], [121.9, 31.1], [120.9, 32.7], [120.3, 34.3], [119.3, 35.1], [120.7, 36.4], [122.5, 37], [120.3, 37.6], [119, 37.2], [117.7, 38.6], [119.2, 39.4], [121.2, 40.9], [122.3, 39.4], [124.2, 39.8], [125.2, 38], [126.5, 37.6], [126.4, 34.6], [129.2, 35.2], [129.4, 37.1], [128.5, 38.6], [127.6, 39.8], [129.7, 40.9], [130.7, 42.3], [133.2, 42.8], [135.4, 43.8], [138.6, 47.2], [140.5, 50.2], [141.2, 53.3], [137.2, 53.9], [137.7, 56.1], [142.2, 59], [148.6, 59.4], [154.2, 59.2], [156.8, 61.5], [156.5, 57.8], [155.8, 55], [156.7, 51.1], [160.1, 53], [162.1, 56.1], [163.5, 59.9], [170.5, 60], [177.4, 62.5], [182, 65], [190.3, 66], [185, 67.5], [180, 68.9], [170, 70], [160, 70.6], [152, 70.9], [146, 72.3], [140, 72.4], [133, 71.4], [126, 73.5], [113, 73.7], [107, 76.8], [104, 77.7], [96, 76], [87, 73.8], [80.5, 73.6], [75, 72.8], [72.8, 70.4], [68.5, 68.4], [66, 69.2], [60.8, 69.9], [54.5, 68.3], [44, 68.5], [41, 66.6], [40, 67.8], [33, 69.4], [28.5, 70.9], [21, 70.2], [15.5, 68.5], [12.2, 65.9], [8.5, 63.4], [5, 61], [5.6, 58.6], [8.2, 58.1], [10.6, 59.3], [11.8, 57.7], [12.9, 55.5], [14.3, 55.6], [16.5, 57.4], [18.2, 59.3], [17.3, 61.8], [20.6, 63.8], [22.3, 65.5], [25.4, 65.1], [21.3, 62.5], [21.4, 60.6], [25.5, 60.3], [30.3, 59.9], [26, 59.6], [23.5, 59.2], [24.3, 57.2], [21.6, 57.5], [21.1, 55.7], [19.9, 54.4], [16, 54.3], [12.5, 54.4], [10, 54.8], [10.5, 57.5], [8.6, 57.1], [8.1, 55.5], [8.2, 53.6], [4.9, 52.9], [3.6, 51.5], [1.6, 50.9], [0.2, 49.7], [-1.9, 49.7], [-4.7, 48.4], [-2.2, 47.2], [-1.2, 46.2], [-1.6, 43.4], [-8.2, 43.6], [-9.3, 43], [-8.8, 40.4], [-9.5, 38.7], [-8.9, 37.2]],
  // Africa
  [[-17, 21], [-17.2, 14.7], [-15, 11], [-12, 7.5], [-7.5, 4.4], [-2, 4.8], [2, 6.3], [5.5, 4.4], [8.8, 4], [9.6, 1], [11.8, -3], [12.3, -6], [13.4, -11], [11.8, -16.5], [14.5, -23], [15.2, -27], [17, -30], [18.4, -34], [20, -34.8], [25.6, -34], [30, -31.2], [32.6, -28], [32.9, -26], [35.4, -24], [35.5, -21], [37, -18], [40.5, -15], [40.4, -10.5], [39.3, -7], [39.6, -4], [41.6, -1.6], [43.5, 0.6], [46, 2.4], [48, 4.6], [49.8, 8], [51.2, 11.6], [48.5, 11.2], [45, 10.5], [43.3, 11.6], [42.6, 13.2], [40.8, 15], [39.4, 16.5], [37.4, 18.8], [37, 21.5], [35.6, 23.5], [34.8, 25.5], [33.6, 27.6], [32.4, 29.9], [32.3, 31.3], [30.2, 31.4], [25.2, 31.6], [21.6, 32.9], [20, 31], [15.6, 31.6], [11.2, 33.2], [10.2, 36.8], [7.8, 36.9], [3, 36.8], [-1, 35.3], [-5.9, 35.8], [-6.8, 34], [-9.6, 30.6], [-9.8, 29.5], [-13.2, 27.6], [-14.5, 26], [-16.1, 23.8]],
  [[44, -25], [47.1, -25.1], [49.4, -17], [50.4, -15.4], [49.3, -12], [46.5, -15.6], [44, -17.5], [43.4, -22]], // Madagascar
  [[79.8, 6], [81.8, 7.4], [80.1, 9.8]], // Sri Lanka
  [[95.2, 5.6], [97.5, 5.2], [100.3, 2.2], [104, -1], [106, -3], [105.8, -5.8], [104.5, -5.9], [101, -2.5], [98.7, 1.7]], // Sumatra
  [[105.2, -6.8], [106, -5.9], [111, -6.4], [114.5, -7.7], [114.3, -8.7], [108, -7.8]], // Java
  [[109.5, 1.8], [114, 4.5], [116.8, 7], [119.2, 5.2], [118, 1], [116.5, -2.5], [114.5, -4], [111, -3], [110, -1]], // Borneo
  [[119.4, -5.5], [120.6, -5.5], [121, -2.6], [123.2, -0.9], [124.9, 1.6], [120.8, 0.8], [119.6, -0.4]], // Sulawesi
  [[131, -1.4], [134, -0.8], [141, -2.6], [145.7, -5.3], [147.6, -6], [150, -10.5], [143, -9], [141, -9.2], [137.8, -5], [132.5, -4]], // New Guinea
  [[120.5, 18.5], [122.3, 18.5], [122.2, 14], [124, 12.5], [120.6, 13.8], [119.8, 16.2]], // Luzon
  [[122, 7], [126.5, 6.6], [126.2, 9.5], [123.5, 8.6]], // Mindanao
  [[120.1, 23], [121, 25.2], [122, 25], [120.8, 21.9]], // Taiwan
  [[108.6, 19.2], [110.5, 20.1], [111, 19.6], [110.2, 18.4], [108.6, 18.5]], // Hainan
  [[130, 31.3], [131.5, 31.5], [132, 33.8], [135, 33.5], [137, 34.6], [140, 35], [141, 38.3], [141.5, 41.4], [139.7, 38], [136.7, 37.3], [133, 35.6], [129.8, 33.2]], // Japan
  [[140, 41.5], [141.5, 45.4], [145.5, 43.3], [143.5, 42]], // Hokkaido
  [[141.8, 46], [143.5, 46.5], [143, 54.3], [142.2, 54.3], [142, 49]], // Sakhalin
  [[113.5, -22], [114, -26.5], [115, -34.3], [118, -35], [124, -33.8], [131, -31.5], [135.6, -34.8], [140, -38], [146.5, -39], [150, -37.5], [153.4, -28], [149, -21], [146, -19], [145.4, -15], [142.5, -10.7], [141.6, -12.5], [140.8, -17.4], [136, -12], [132.5, -11.5], [129, -15], [126, -14], [122.2, -17.3], [121, -19.5], [117, -20.7]], // Australia
  [[-5.7, 50.1], [1.4, 51.2], [1.7, 52.7], [0, 53.5], [-1.6, 55.6], [-2, 57.6], [-3, 58.6], [-5, 58.6], [-6.2, 57], [-5.6, 55.4], [-3.4, 53.4], [-4.7, 52.8], [-5.2, 51.7]], // Great Britain
  [[-6, 52.2], [-6, 54], [-7.5, 55.2], [-10, 54.2], [-10.2, 51.6]], // Ireland
  [[-24, 64.9], [-22.4, 63.8], [-18.7, 63.4], [-15, 64.3], [-13.6, 65.1], [-14.6, 66.2], [-18.5, 66.2], [-22.7, 65.8], [-24.5, 65.5]], // Iceland
  [[-73, 78], [-60, 82], [-32, 83.5], [-12, 81.3], [-18, 77], [-22, 71], [-26, 68.5], [-37, 65.8], [-42.5, 62], [-44, 60], [-50.5, 63], [-53.5, 67.5], [-54, 69.5], [-55.5, 73.6], [-61, 76.2], [-71, 77]], // Greenland
  [[11, 78.5], [16, 76.5], [22, 77.5], [27, 80], [18, 80.5], [11, 79.8]], // Svalbard
  [[52, 71.5], [56, 71], [57, 73.2], [60, 75.2], [68, 76.8], [58, 75.9], [54.5, 73.8], [51.5, 72]], // Novaya Zemlya
  // North America (coarse) and the Arctic archipelago — they only show along the far limb
  [[-168, 65.6], [-166, 68.9], [-156, 71.3], [-141, 69.6], [-129, 70], [-108, 68.3], [-95, 68.5], [-82, 69.5], [-87, 64], [-95, 60], [-87, 55.3], [-82, 52.9], [-77, 59.5], [-73, 62], [-65, 60.3], [-61.5, 56], [-56, 52], [-60, 50.2], [-67, 49.3], [-61, 46], [-66, 43.5], [-70, 42], [-74, 40.5], [-76, 37], [-75.5, 35.3], [-81, 31.5], [-80.2, 27], [-80.4, 25.2], [-82.8, 28.5], [-84, 30], [-90, 29.1], [-97.4, 27.5], [-97.6, 22], [-95, 18.6], [-90.5, 19.5], [-87, 21.5], [-88, 16], [-83.4, 15], [-83.8, 11], [-77.5, 8.5], [-82, 8.3], [-87.5, 13.2], [-96, 15.7], [-105.5, 19.8], [-110, 23.5], [-117.1, 32.5], [-120.6, 34.6], [-124.3, 40.4], [-124.7, 48.4], [-130.3, 54.6], [-137.8, 58.6], [-145, 60.3], [-154, 57.6], [-163, 55], [-157.6, 58.7], [-164.8, 62.6], [-165.6, 64.5]],
  [[-120, 70], [-125, 72], [-120, 76], [-105, 78], [-90, 81], [-70, 83], [-62, 82], [-72, 78], [-79, 74], [-62, 67], [-64, 63.3], [-78, 64.4], [-82, 69], [-90, 73], [-110, 70]],
];
/* Inland seas carved back out of the land */
const WATER = [
  [[28, 41.2], [28.5, 43.5], [30, 45.5], [31.5, 46.6], [33.5, 44.5], [36.5, 45.3], [39.5, 47], [37.8, 44.7], [41.5, 41.6], [36, 41.7], [31, 41.1]], // Black Sea
  [[47, 44], [49, 46.5], [52, 46.8], [53, 45], [51.5, 43], [53, 40.5], [54, 37.4], [51, 36.7], [49, 37.5], [49.6, 40.4], [47.5, 42.5]], // Caspian
];

/** Ray-casting point-in-polygon, behind a bounding-box check. */
const rings = (rs) =>
  rs.map((ring) => ({
    ring,
    box: ring.reduce((b, [x, y]) => [Math.min(b[0], x), Math.min(b[1], y), Math.max(b[2], x), Math.max(b[3], y)], [Infinity, Infinity, -Infinity, -Infinity]),
  }));
const LAND_RINGS = rings(LAND);
const WATER_RINGS = rings(WATER);
function hitRings(lon, lat, rs) {
  return rs.some(({ ring, box }) => {
    if (lon < box[0] || lon > box[2] || lat < box[1] || lat > box[3]) return false;
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i];
      const [xj, yj] = ring[j];
      if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  });
}
function isLand(lon, lat) {
  const l = ((((lon + 180) % 360) + 360) % 360) - 180; // [-180, 180); Chukotka's ring runs past 180°E
  const hit = (rs) => hitRings(l, lat, rs) || hitRings(l + 360, lat, rs);
  return hit(LAND_RINGS) && !hit(WATER_RINGS);
}

/**
 * Land as a dot matrix: rows along the parallels, evenly spaced on the sphere, each dot a tiny
 * round-capped segment. Four depth bands, so the dots fade towards the limb. Dots within `gap`
 * of the `clear` points (the lanes, the ports) are left out, so the lanes run in clean water.
 */
function landDots(clear, gap) {
  const bands = [[], [], [], []];
  for (let row = 0, lat = -78; lat <= 84; row++, lat += DOT_STEP) {
    const n = Math.round((360 * Math.cos(lat * RAD)) / DOT_STEP);
    for (let i = 0; i < n; i++) {
      const lon = -180 + ((i + (row % 2) / 2) * 360) / n;
      const p = project(lon, lat);
      if (p.z < 0.05 || !isLand(lon, lat) || clear.some((c) => Math.hypot(c.x - p.x, c.y - p.y) < gap)) continue;
      bands[p.z > 0.62 ? 0 : p.z > 0.38 ? 1 : p.z > 0.18 ? 2 : 3].push(round(p));
    }
  }
  // "h.1": a hair of length so every engine draws the round cap; the next move starts from its end
  return bands.map((dots) => dots.map((p, i) => (i ? `m${nums([p.x - dots[i - 1].x - 0.1, p.y - dots[i - 1].y])}h.1` : `M${nums([p.x, p.y])}h.1`)).join(''));
}

/** A polyline as compact relative path data. */
function polyline(pts) {
  const q = pts.map(round);
  return `M${nums([q[0].x, q[0].y])}l${nums(q.slice(1).flatMap((p, i) => [p.x - q[i].x, p.y - q[i].y]))}`;
}
/** Visible arc of a parallel, drawn west → east. */
function parallel(lat) {
  const k = -Math.tan(BL_GLOBE.lat0 * RAD) * Math.tan(lat * RAD);
  const half = k <= -1 ? 180 : Math.acos(Math.min(1, k)) / RAD;
  return polyline(Array.from({ length: 33 }, (_, i) => project(BL_GLOBE.lon0 - half + (half * i) / 16, lat)));
}
/** Visible arc of a meridian, from the limb up to the north pole. */
function meridian(lon) {
  const from = Math.atan((-C0 * Math.cos((lon - BL_GLOBE.lon0) * RAD)) / S0) / RAD;
  return polyline(Array.from({ length: 25 }, (_, i) => project(lon, from + ((90 - from) * i) / 24)));
}

const vec = ([lon, lat]) => [Math.cos(lat * RAD) * Math.cos(lon * RAD), Math.cos(lat * RAD) * Math.sin(lon * RAD), Math.sin(lat * RAD)];
/** Point at t along the great circle a → b. */
function slerp(a, b, t) {
  const va = vec(a);
  const vb = vec(b);
  const w = Math.acos(Math.min(1, va[0] * vb[0] + va[1] * vb[1] + va[2] * vb[2]));
  if (w < 1e-6) return a;
  const v = va.map((c, i) => (Math.sin((1 - t) * w) * c + Math.sin(t * w) * vb[i]) / Math.sin(w));
  return [Math.atan2(v[1], v[0]) / RAD, Math.asin(v[2]) / RAD];
}

/** Catmull-Rom spline through `pts` as compact relative cubic path data, plus its polyline length. */
function smooth(pts) {
  let len = 0;
  const ns = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const [p0, p1, p2, p3] = [pts[Math.max(0, i - 1)], pts[i], pts[i + 1], pts[Math.min(pts.length - 1, i + 2)]];
    const o = round(p1);
    const c1 = round({ x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 });
    const c2 = round({ x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 });
    const e = round(p2);
    ns.push(c1.x - o.x, c1.y - o.y, c2.x - o.x, c2.y - o.y, e.x - o.x, e.y - o.y);
    len += Math.hypot(p2.x - p1.x, p2.y - p1.y);
  }
  return { d: `M${nums([r1(pts[0].x), r1(pts[0].y)])}c${nums(ns)}`, len };
}

/**
 * A sea lane: great-circle legs between waypoints, projected, cut at the horizon and smoothed
 * (Catmull-Rom through a point every ~5°). `trace` samples it every ~1° to clear the dots off it.
 */
function lane(way) {
  let prev = project(way[0][0], way[0][1]);
  const trace = [prev];
  const pts = [prev];
  legs: for (let i = 0; i < way.length - 1; i++) {
    const steps = Math.ceil(Math.hypot(way[i + 1][0] - way[i][0], way[i + 1][1] - way[i][1]));
    for (let s = 1; s <= steps; s++) {
      const [lon, lat] = slerp(way[i], way[i + 1], s / steps);
      const p = project(lon, lat);
      if (p.z <= 0) {
        const t = prev.z / (prev.z - p.z); // over the horizon: end on the limb
        pts.push({ x: prev.x + (p.x - prev.x) * t, y: prev.y + (p.y - prev.y) * t });
        break legs;
      }
      trace.push(p);
      if (s === steps || s % 5 === 0) pts.push(p);
      prev = p;
    }
  }
  return { ...smooth(pts), trace, pts };
}

const PORTS = {
  SHA: [121.5, 31.2],
  SIN: [103.8, 1.3],
  KHI: [67, 24.8],
  JEA: [55.1, 25],
  RTM: [4.1, 51.95],
};
const AT = Object.fromEntries(Object.entries(PORTS).map(([code, [lon, lat]]) => [code, round(project(lon, lat))]));

const LANES = {
  // the illustrative shipment: Karachi → Bab-el-Mandeb → Suez → Gibraltar → Rotterdam
  khiRtm: lane([PORTS.KHI, [64, 22.5], [59, 18.5], [54, 14.5], [49, 12.3], [43.6, 12.5], [41, 15.5], [38.5, 20], [35.8, 25], [33.8, 27.7], [32.6, 29.9], [32.4, 31.6], [28, 33.4], [22, 34.4], [15, 36.6], [11.3, 37.6], [8, 37.9], [2, 37.4], [-2, 36.4], [-5.6, 35.95], [-9.4, 36.6], [-9.9, 40], [-9.8, 43.4], [-6, 48.2], [-3, 49.7], [0.5, 50.5], [2.6, 51.4], PORTS.RTM]),
  // Shanghai → Singapore → Jebel Ali
  shaJea: lane([PORTS.SHA, [122.8, 29.5], [121, 26.5], [119.8, 24.6], [118, 22.6], [114.5, 20.5], [111, 16.5], [109.8, 12.5], [107.8, 8.5], [105.5, 5], [104.5, 2], PORTS.SIN, [101.8, 2.6], [99.5, 4.3], [97.5, 5.9], [94, 6.2], [88, 5.9], [81.8, 5.4], [79, 6.6], [75.5, 9.5], [70, 15], [63, 21.5], [59.5, 23.4], [57.3, 25.4], [56.5, 26.5], [55.8, 26.2], PORTS.JEA]),
  // Rotterdam → New York, over the western horizon
  rtmNyc: lane([PORTS.RTM, [2.2, 51.6], [0, 50.4], [-4, 49.8], [-8, 49.4], [-14, 48.6], [-25, 46.8], [-40, 44.2], [-55, 42], [-70, 40.6]]),
  // Singapore → round the Cape → the Atlantic
  sinCape: lane([PORTS.SIN, [101.5, 2.2], [98, 5.4], [94, 5.6], [86, 4], [76, -2], [62, -12], [50, -22], [40, -30], [31, -35], [22, -36.6], [17, -34.6], [13, -30], [9, -22], [5, -12], [0, -4], [-10, 4], [-22, 12]]),
  // Shanghai → the Pacific, over the eastern horizon
  shaPac: lane([PORTS.SHA, [126, 31.8], [131, 32.6], [138, 34.6], [146, 37.5], [158, 41], [175, 44]]),
};
// the return leg of the documented lane, RTM → KHI: the same spline run backwards, so a hull on it
// sits exactly on the lit lane
const khiRtmBack = smooth([...LANES.khiRtm.pts].reverse());

const DOTS = landDots([...Object.values(LANES).flatMap((l) => l.trace), ...Object.values(AT)], 3.4);
const MERIDIANS = [-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150, 180].map(meridian);
const PARALLELS = [-40, -20, 0, 20, 40, 60].map(parallel);

const { cx, cy, r } = BL_GLOBE;
const rim = (deg) => `${r1(cx + (r - 2) * Math.cos(deg * RAD))} ${r1(cy + (r - 2) * Math.sin(deg * RAD))}`;
const RIM = `M${rim(192)}A${r - 2} ${r - 2} 0 0 1 ${rim(258)}`; // rim light, upper left

const laneOut = (l) => ({ d: l.d, len: l.len });
const q = (v) => JSON.stringify(v);
const src = `/* GENERATED by scripts/gen-bl-globe.mjs — do not edit by hand; change the script and re-run it.
   Geometry of the Bill of Lading card artwork (BillOfLading() in ProjectArt.tsx): an orthographic
   dot-matrix globe centred on the Arabian Sea, its graticule, ports and sea lanes, in the
   artwork's 400 × 300 viewBox. Baked so no projection or sampling runs in the browser. */

export const BL_GLOBE = ${q({ cx, cy, r })} as const;

/** Land dots in four depth bands, nearest first (round-capped hairline segments). */
export const BL_DOTS = ${q(DOTS)} as const;

export const BL_MERIDIANS = ${q(MERIDIANS)} as const;
/** Visible arcs of the parallels, drawn west → east. */
export const BL_PARALLELS = ${q(PARALLELS)} as const;
/** Rim light along the upper-left limb. */
export const BL_RIM = ${q(RIM)};

/** Port positions (viewBox units). */
export const BL_AT = ${q(AT)} as const;

export type BlLaneGeo = { readonly d: string; readonly len: number };
/** Sea lanes: smoothed path data and length (viewBox units). */
export const BL_LANES = {
  /** the illustrative shipment, KHI → RTM (via Suez and Gibraltar) */
  khiRtm: ${q(laneOut(LANES.khiRtm))},
  /** the same lane run backwards, RTM → KHI */
  khiRtmBack: ${q(laneOut(khiRtmBack))},
  /** SHA → SIN → JEA */
  shaJea: ${q(laneOut(LANES.shaJea))},
  /** RTM → over the western horizon (to NYC) */
  rtmNyc: ${q(laneOut(LANES.rtmNyc))},
  /** SIN → round the Cape → the Atlantic */
  sinCape: ${q(laneOut(LANES.sinCape))},
  /** SHA → over the eastern horizon (the Pacific) */
  shaPac: ${q(laneOut(LANES.shaPac))},
} as const satisfies Record<string, BlLaneGeo>;
`;
writeFileSync(OUT, src);
console.log(`wrote ${OUT} (${src.length} chars; ${DOTS.reduce((n, b) => n + (b.match(/h\.1/g) || []).length, 0)} dots)`);

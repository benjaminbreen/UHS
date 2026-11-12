export { shoreDistance } from "../core/water-field";
import { trimCache } from "../core/cache";
import { raisedFieldEdge } from "./field-raster";
import type { TopographyCell, TopographySample } from "../core/topography";
import { waterNoise, waterHash, waterStyle, waterBand } from "./water-style";
import { groundStyle } from "./ground-style";

export function paintedGround(c: TopographyCell) {
  // A dry channel is ground, but the canal raster draws its bed and berms.
  return (
    !!c.habitat &&
    !c.ramp &&
    !c.bridge &&
    !c.dryChannel &&
    c.surface !== "water"
  );
}
export function shoreOnTier(sample: TopographySample, x: number, y: number, height = sample(x, y)?.height) {
  const cell = sample(x, y);
  if (!cell) return false;
  const shore = (c: TopographyCell) =>
    c.surface === "sand" || c.surface === "gravel" || c.surface === "water";
  if (height === 0 || (cell.height === height && shore(cell))) return true;
  for (let dy = -1; dy <= 1; dy++)
    for (let dx = -1; dx <= 1; dx++) {
      const n = sample(x + dx, y + dy);
      if (
        n &&
        n.height === height &&
        !n.bridge &&
        !n.ramp &&
        n.feature !== "paving" &&
        shore(n)
      )
        return true;
    }
  return false;
}
export const rgb = (c: string) => [
  parseInt(c.slice(1, 3), 16),
  parseInt(c.slice(3, 5), 16),
  parseInt(c.slice(5, 7), 16),
];
/** Bilinear beach width keeps the outer bank as continuous as the water edge. */
export function shoreWidth(sample: TopographySample, x: number, y: number) {
  const ix = Math.floor(x - 0.5),
    iy = Math.floor(y - 0.5),
    u = x - 0.5 - ix,
    v = y - 0.5 - iy;
  const value = (a: number, b: number) =>
    sample(a, b)?.waterVisual?.shoreWidth ?? 3;
  return (
    (value(ix, iy) * (1 - u) + value(ix + 1, iy) * u) * (1 - v) +
    (value(ix, iy + 1) * (1 - u) + value(ix + 1, iy + 1) * u) * v
  );
}
/** Reconstruct scalar material membership from four cell centers. Different
 * height tiers, bridge decks and paving never donate their material across an edge. */
export function materialCoverage(
  sample: TopographySample,
  x: number,
  y: number,
  height: number,
  predicate: (c: TopographyCell) => boolean | number,
  paving = 0,
) {
  const ix = Math.floor(x - 0.5),
    iy = Math.floor(y - 0.5),
    u = x - 0.5 - ix,
    v = y - 0.5 - iy;
  const value = (a: number, b: number) => {
    const c = sample(a, b);
    if (!c || c.height !== height || c.bridge || c.ramp ||
      (c.field ? raisedFieldEdge(c) && !(c.field.yard && c.surface === "soil") : c.feature === "field")) return 0;
    if (c.feature === "paving") return paving;
    return Number(predicate(c));
  };
  return (
    (value(ix, iy) * (1 - u) + value(ix + 1, iy) * u) * (1 - v) +
    (value(ix, iy + 1) * (1 - u) + value(ix + 1, iy + 1) * u) * v
  );
}
/** Crisp, irregular pixel steps instead of full-cell corner staircases. */
type PathSegment = readonly [number, number, number, number];
const routeCaches = new WeakMap<TopographySample, Map<string, PathSegment[]>>();
export type PathField = {
  /** Wear bands. 0.48 is the material boundary the raster thresholds against. */
  coverage: number;
  /** Distance from the corridor center over its local radius; 0 is the center. */
  cross: number;
  /** Local half-width in cells, after breathing. */
  radius: number;
  ruts?: false;
  dung?: false;
  paved?: "yellow" | "white" | "none" | "gravel";
  /** Signed distance from the centre line and distance along it, in native
   * pixels, for a paved road's paint. */
  side?: number;
  along?: number;
};
const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
/** A worn road is not a constant-width ribbon. One slow wave sampled on the
 * center line rather than at the pixel widens and narrows the whole corridor
 * along its length, so both margins move together instead of fraying. */
function breathe(cx: number, cy: number, ox: number, oy: number) {
  const wx = (cx + ox) * 16,
    wy = (cy + oy) * 16;
  return (
    1 +
    (waterNoise(wx, wy, 112, 517) - 0.5) * 0.3 +
    (waterNoise(wx, wy, 37, 519) - 0.5) * 0.13
  );
}
/** Lateral drift of the corridor itself, sampled on the center line so the
 * whole road snakes and both margins move together. Width variation alone
 * still left a ruled line; a route follows the ground it was worn into. */
function wander(cx: number, cy: number, ox: number, oy: number) {
  return (waterNoise((cx + ox) * 16, (cy + oy) * 16, 74, 523) - 0.5) * 0.84;
}
/** Two octaves of margin nibble. One octave left the edge straight enough to
 * expose the route's underlying 45-degree staircase. */
function margin(x: number, y: number, ox: number, oy: number) {
  const wx = (x + ox) * 16,
    wy = (y + oy) * 16;
  return (
    (waterNoise(wx, wy, 27, 421) - 0.5) * 0.085 +
    (waterNoise(wx, wy, 9, 431) - 0.5) * 0.05
  );
}
/** Connect neighboring route centers before rasterization. A diagonal is a
 * continuous corridor, never a sequence of independently rounded tile caps. */
export function pathField(
  sample: TopographySample,
  x: number,
  y: number,
  ox: number,
  oy: number,
): PathField {
  const ix = Math.floor(x),
    iy = Math.floor(y),
    cell = sample(ix, iy)!;
  if (["garden", "park", "verge"].includes(cell.pavement ?? ""))
    return { coverage: 0, cross: 1.5, radius: 0 };
  // An earth court is an area, not a network reconstructed from soil cell centers.
  // So is an earth street and its footway, the trodden ground up to the fronts.
  const areaGround = (c: TopographyCell) => c.surface === "soil" &&
    ["court", "yard", "square", "vacant", "footway", "lane"].includes(c.pavement ?? "");
  // Trodden ground runs right up to paving it meets, with no turf between.
  const self = areaGround(cell) || (cell.feature === "paving" && !cell.streetGeometry &&
    [[0, -1], [-1, 0], [1, 0], [0, 1]].some(([dx, dy]) => { const n = sample(ix + dx, iy + dy); return !!n && areaGround(n); }));
  const area = materialCoverage(sample, x, y, cell.height, (c) => {
    if (!areaGround(c)) return 0;
    const patch = waterNoise((x + ox) * 16, (y + oy) * 16, 58, 619);
    // Kept ground is whole; vacant ground is trodden earth with weeds in it.
    return c.earth ? 1 : c.pavement === "vacant" ? 0.55 + patch * 0.45
      : c.pavement === "yard" ? 0.65 + patch * 0.35 : 1;
  }, self ? 1 : 0);
  const areaField: PathField = { coverage: clamp01((area - 0.2) * 1.25), cross: 0.5,
    radius: 1.2, ruts: false, dung: false };
  if (area === 1) return areaField;
  if (cell.pathArt?.length && !cell.feature && !cell.bridge) {
    let best: PathField = { coverage: 0, cross: 1.5, radius: 0 };
    const tuning = groundStyle()?.composition;
    const edgeBreakup = tuning?.pathEdgeBreakup ?? 1;
    const width = tuning?.pathWidth ?? 1;
    const pathWobble = tuning?.pathWobble ?? 1;
    const wobble = margin(x, y, ox, oy) * edgeBreakup;
    let top = -Infinity,
      ux = 0,
      uy = 0;
    const strokes: [number, number, number][] = [];
    for (const s of cell.pathArt) {
      const ax = ix + s.a[0],
        ay = iy + s.a[1],
        dx = s.b[0] - s.a[0],
        dy = s.b[1] - s.a[1];
      const t = Math.max(
        0,
        Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1)),
      );
      const cx = ax + t * dx,
        cy = ay + t * dy,
        len = Math.hypot(dx, dy) || 1;
      // Blacktop is graded to a line: it neither breathes nor wanders.
      const paved = s.paved;
      const radius = paved ? s.radius : s.radius * width * breathe(cx, cy, ox, oy);
      const drift = paved
        ? 0
        : wander(cx, cy, ox, oy) * Math.min(1.2, s.radius) * pathWobble;
      const distance = Math.hypot(
        x - cx + (drift * dy) / len,
        y - cy - (drift * dx) / len,
      );
      const raw =
        0.48 +
        (0.6 * (radius - distance + (paved ? wobble * 0.3 : wobble))) /
          Math.min(1.4, radius);
      strokes.push([raw, dx / len, dy / len]);
      if (raw > top) {
        top = raw;
        ux = dx / len;
        uy = dy / len;
        best = {
          coverage: clamp01(raw),
          cross: distance / (radius || 1),
          radius,
          ...(s.ruts === false && { ruts: s.ruts }),
          ...(s.dung === false && { dung: s.dung }),
          ...(paved && {
            paved,
            side: (((x - ax) * dy - (y - ay) * dx) / len) * 16,
            along: (((x + ox) * dx + (y + oy) * dy) / len) * 16,
          }),
        };
      }
    }
    // Where roads meet at an angle, a smooth union fills the inside corner
    // with a curve. Pieces of one road meet nearly in line and are left as
    // they are, or every bend would bulge.
    let fillet = 0;
    for (const [raw, vx, vy] of strokes) {
      const k = 0.45 * clamp01((Math.abs(ux * vy - uy * vx) - 0.4) / 0.4);
      const h = k && Math.max(0, k - (top - raw)) / k;
      fillet = Math.max(fillet, (h * h * k) / 4);
    }
    best.coverage = clamp01(top + fillet);
    return areaField.coverage > best.coverage ? areaField : best;
  }

  const eligible = (a: number, b: number) => {
    const n = sample(a, b);
    return (
      n?.surface === "soil" &&
      !areaGround(n) &&
      !n.pathArt?.length &&
      n.height === cell.height &&
      !n.bridge &&
      !n.ramp &&
      !n.feature
    );
  };
  if (
    cell.surface === "soil" &&
    [
      [0, -1],
      [1, 0],
      [0, 1],
      [-1, 0],
    ].some(([dx, dy]) => {
      const n = sample(ix + dx, iy + dy);
      return n?.bridge || n?.ramp;
    })
  )
    return { coverage: 1, cross: 0, radius: 1 };
  let cache = routeCaches.get(sample);
  if (!cache) {
    cache = new Map();
    routeCaches.set(sample, cache);
  }
  const key = `${ix},${iy}`;
  let segments = cache.get(key);
  if (!segments) {
    segments = [];
    for (let yy = iy - 1; yy <= iy + 1; yy++)
      for (let xx = ix - 1; xx <= ix + 1; xx++)
        if (eligible(xx, yy)) {
          segments.push([xx + 0.5, yy + 0.5, xx + 0.5, yy + 0.5]);
          for (const [dx, dy] of [
            [1, 0],
            [0, 1],
            [1, 1],
            [-1, 1],
          ])
            if (eligible(xx + dx, yy + dy))
              segments.push([xx + 0.5, yy + 0.5, xx + dx + 0.5, yy + dy + 0.5]);
        }
    trimCache(cache, 1024);
    cache.set(key, segments);
  }
  let distance = Infinity,
    nx = x,
    ny = y;
  for (const [ax, ay, bx, by] of segments) {
    const dx = bx - ax,
      dy = by - ay,
      t = Math.max(
        0,
        Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1)),
      );
    const d = Math.hypot(x - ax - t * dx, y - ay - t * dy);
    if (d < distance) {
      distance = d;
      nx = ax + t * dx;
      ny = ay + t * dy;
    }
  }
  if (!Number.isFinite(distance)) return areaField;
  // Half breathing on the legacy reconstruction: it has no authored center
  // line, so a full-amplitude wave would swell isolated cells into blobs.
  const radius =
    (0.51 + margin(x, y, ox, oy) * 0.55) *
    (1 + (breathe(nx, ny, ox, oy) - 1) * 0.3);
  const coverage = clamp01(0.48 + (radius - distance) / 0.65);
  if (areaField.coverage > coverage) return areaField;
  return {
    coverage,
    cross: distance / (radius || 1),
    radius,
  };
}
export const pathCoverage = (
  sample: TopographySample,
  x: number,
  y: number,
  ox: number,
  oy: number,
) => pathField(sample, x, y, ox, oy).coverage;
const hexes = (...c: string[]) => c.map((h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]);
// Standing wet, damp, drying, dry crest, sunlit crest edge.
const MUD = hexes("#5f4636", "#6f5240", "#82624a", "#977556", "#b08c64");
// Dry coasts have sand flats, not mud: the beach's own sand, wet.
const SAND_FLAT = hexes("#8c7353", "#a08460", "#b4966d", "#c6a87b", "#dcc091");
const MANGROVE_MUD = hexes("#43362b", "#514133", "#5f4d3b", "#6f5c46", "#857258");
// The sky lying on wet mud, and on standing water: film, pool, pool glint.
const SHEEN = hexes("#7d7f92", "#7f8fb2", "#9fb6d6", "#e4eef6");
// Creek water from its lit middle to its shaded edge.
const CREEK = hexes("#a6e6e0", "#62c3c6", "#439aa6", "#2f7384");
const MARSH = hexes("#5f7449", "#6f8452", "#80955f", "#4b5a38");
const FLAT_TUFT = hexes("#c3b552", "#8f9440", "#5d6a34");
const FLAT_STONE = hexes("#a59c8c", "#6f675c");
/** The intertidal shelf at the present tide: mud in drying lobes, standing
 * pools that show the sky, and creeks that gather and widen toward low water.
 * Undefined is open water. `d` is the pixel's water distance in cells. */
export function tidalFlat(cell: TopographyCell, d: number, wx: number, wy: number): number[] | undefined {
  const v = cell.waterVisual;
  if (v?.shelf === undefined) return;
  // The mud and the beach above it interlock along a wandering line.
  if (d >= Math.max(0, (waterNoise(wx, wy, 19, 627) - 0.35) * 0.9 + (waterNoise(wx, wy, 6, 628) - 0.5) * 0.2)) return;
  const t = 1 + d / v.shelf;
  // Low water wanders: a ruled tide line is the first thing the eye finds.
  const low = (v.tide ?? 0) + (waterNoise(wx, wy, 34, 629) - 0.5) * 0.12 + (waterNoise(wx, wy, 11, 630) - 0.5) * 0.05;
  if (t < low) return;
  const tropical = v.ecology === "tropical-woodland" || cell.habitat?.colorway === "mangrove";
  const mud = tropical ? MANGROVE_MUD : v.ecology === "desert" || v.ecology === "dry-scrub" ? SAND_FLAT : MUD;
  // Salt marsh above mid-tide on temperate shores, a small cliff at its foot.
  const edge = 0.6 + (waterNoise(wx, wy, 16, 635) - 0.5) * 0.25;
  if (!tropical && v.ecology !== "desert" && t > edge) {
    const pan = waterNoise(wx, wy, 11, 637);
    if (pan > 0.7) return pan > 0.74 ? SHEEN[1] : MARSH[3];
    if (t < edge + 0.03) return MARSH[3];
    const tuft = waterHash(Math.floor(wx / 3), Math.floor(wy / 2), 639);
    return tuft > 0.8 ? MARSH[2] : tuft < 0.15 ? MARSH[0] : MARSH[1];
  }
  const dash = (salt: number, len: number, rows: number) =>
    ((wy % rows) + rows) % rows === 0 && waterHash(Math.floor(wx / len), wy, salt);
  // A sheet of water still draining off the lowest mud.
  if (t < low + 0.035) return (dash(651, 5, 2) || 0) > 0.6 ? SHEEN[2] : SHEEN[1];
  // Creeks: the trunk is one winding contour, its feeders a finer one that
  // joins from the landward side only, and both widen toward low water.
  const warp = (waterNoise(wx, wy, 23, 655) - 0.5) * 26;
  const trunk = waterNoise(wx + warp, wy - warp, 88, 633) - 0.5;
  const feeder = waterNoise(wx - warp, wy + warp, 41, 634) - 0.5;
  const reach = 0.011 + (1 - t) * 0.024;
  const a = trunk / reach,
    b = trunk > 0 && t < 0.92 ? feeder / (reach * 0.8) : 9;
  const s = Math.abs(a) < Math.abs(b) ? a : b;
  const across = Math.abs(s);
  if (across < 1) {
    if (across < 0.32) return (dash(657, 4, 2) || 0) > 0.45 ? CREEK[0] : CREEK[1];
    // Lit on the side the sun reaches, deep under the other bank.
    return across < 0.72 ? CREEK[s < 0 ? 1 : 2] : CREEK[s < 0 || reach < 0.02 ? 2 : 3];
  }
  if (across < 1.55) return mud[0];
  // The flat's own small relief: hollows hold water, crests dry pale.
  const lift =
    waterNoise(wx + warp * 0.6, wy, 52, 643) * 0.5 +
    waterNoise(wx, wy + warp * 0.4, 21, 644) * 0.32 +
    waterNoise(wx, wy, 8, 645) * 0.18 +
    (t - 0.5) * 0.16;
  if (lift < 0.34) {
    if (lift > 0.318) return mud[0];
    if (lift < 0.28 && (dash(659, 3, 3) || 0) > 0.7) return SHEEN[3];
    return lift < 0.28 ? SHEEN[2] : SHEEN[1];
  }
  const bx = Math.floor(wx / 13),
    by = Math.floor(wy / 11);
  const ux = ((wx % 13) + 13) % 13,
    uy = ((wy % 11) + 11) % 11;
  const mark = waterHash(bx, by, 661);
  if (lift > 0.5 && mark > 0.93) {
    // A tuft of cord grass: three blades off one root.
    const gx = ux - 3 - Math.floor(waterHash(bx, by, 662) * 5),
      gy = uy - 3 - Math.floor(waterHash(bx, by, 663) * 3);
    if (gy === 3 && gx >= 0 && gx <= 4) return FLAT_TUFT[2];
    if (gy >= 0 && gy < 3 && (gx === 0 || gx === 2 || gx === 4) && gy >= (gx === 2 ? 0 : 1))
      return FLAT_TUFT[gy === (gx === 2 ? 0 : 1) ? 0 : 1];
  } else if (mark < 0.1) {
    const gx = ux - 2 - Math.floor(waterHash(bx, by, 664) * 8),
      gy = uy - 2 - Math.floor(waterHash(bx, by, 665) * 6);
    if (gy === 0 && (gx === 0 || gx === 1)) return FLAT_STONE[0];
    if (gy === 1 && gx >= 0 && gx <= 2) return FLAT_STONE[1];
  }
  if (lift < 0.42) return (dash(667, 6, 2) || 0) > 0.82 ? SHEEN[0] : mud[0];
  if (lift < 0.53) return mud[1];
  if (lift < 0.64) return mud[2];
  // A crest's seaward edge catches the light.
  const above = waterNoise(wx + warp * 0.6, wy - 1, 52, 643) * 0.5 + waterNoise(wx, wy - 1 + warp * 0.4, 21, 644) * 0.32 + waterNoise(wx, wy - 1, 8, 645) * 0.18 + (t - 0.5) * 0.16;
  return above < 0.64 ? mud[4] : mud[3];
}
export function shorePixel(
  cell: TopographyCell,
  distance: number,
  wx: number,
  wy: number,
) {
  const p = waterStyle(cell);
  const creek = (cell.waterVisual?.shoreWidth ?? 3) < 1.2;
  // A creek or its pond: one wet dark line, the turf runs to it.
  if (creek) return rgb(p.bank[0]);
  const pool =
    cell.waterVisual?.kind === "lake" && (cell.waterVisual.shoreWidth ?? 3) < 1;
  if (pool) {
    if (distance < -0.15)
      return distance < -0.8 ? [99, 145, 144] : [121, 163, 154];
    return distance < 0.15 ? [112, 126, 94] : [131, 140, 101];
  }

  const flat = distance < 0.8 ? tidalFlat(cell, distance, wx, wy) : undefined;
  if (flat) return flat;
  if (distance < 0) {
    const i = waterBand(
      distance,
      cell.waterVisual?.kind ?? "river",
      cell.waterVisual?.shoreWidth ?? 3,
      wx,
      wy,
    );
    return rgb(distance > -0.1 ? p.bank[0] : p.depths[i]);
  }
  const gravel =
    cell.surface === "gravel" ||
    cell.waterVisual?.kind === "river" ||
    ["tundra", "boreal-woodland"].includes(cell.habitat?.ecology ?? "");
  const bx = Math.floor(wx / 8),
    by = Math.floor(wy / 7);
  const px = ((wx % 8) + 8) % 8,
    py = ((wy % 7) + 7) % 7;
  const sx = 1 + Math.floor(waterHash(bx, by, 329) * 4),
    sy = 1 + Math.floor(waterHash(bx, by, 330) * 3);
  const stone = gravel && waterHash(bx, by, 325) > 0.58;
  const wide = waterHash(bx, by, 326) > 0.6 ? 3 : 2;
  if (stone && px >= sx && px < sx + wide && py >= sy && py <= sy + 1)
    return rgb(p.stone[py === sy ? 2 : 0]);
  if (distance < 0.16 && cell.waterVisual?.kind !== "sea") return rgb(p.bank[0]);
  if (cell.waterVisual?.kind === "sea") {
    // Wet sand the last tide left, glinting in short runs, then a broken
    // line of wrack at its limit, then the dry beach.
    const wet = 0.9 + (waterNoise(wx, wy, 23, 331) - 0.5) * 0.8;
    const dark = rgb(p.bank[1]), dry = rgb(p.bank[2]);
    if (distance < wet)
      return (wy & 1) === 0 && waterHash(Math.floor(wx / 5), wy, 333) > 0.86
        ? dark.map((v, k) => Math.round((v + dry[k]) / 2))
        : dark;
    if (distance < wet + 0.14 && waterHash(Math.floor(wx / 2), Math.floor(wy / 2), 335) > 0.6)
      return dark.map((v) => Math.round(v * 0.74));
    return dry.map((v) => v + (waterHash(Math.floor(wx / 3), Math.floor(wy / 2), 327) > 0.84 ? 5 : 0));
  }
  return rgb(p.bank[1]).map(
    (v) =>
      v +
      (waterHash(Math.floor(wx / 3), Math.floor(wy / 2), 327) > 0.84 ? 5 : 0),
  );
}

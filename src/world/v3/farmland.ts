import type { Pack, Point } from "../../core/types";
import { random } from "../../core/random";
import { noise } from "../geography/noise";
import type { Sample } from "./roads";
import { cellKey, type Rect, type Road, type Site } from "./types";
import type {
  Boundary,
  CropId,
  FarmSystem,
  FarmZone,
} from "../../content/agriculture/types";
import { cropsFor, farmSystem } from "../../content/agriculture";
import { crops } from "../../content/agriculture/crops";
import { waterscape } from "../../content/geography/waterscapes";

/** One cell of farmland, as the renderer reads it. */
export type FieldCell = {
  parcel: number;
  crop: CropId;
  /** Furrow direction. */
  axis: "x" | "y";
  /** Edges on which the parcel ends: north 1, east 2, south 4, west 8. */
  edges: number;
  /** Edges of the enclosure the parcel belongs to, same bits: a furlong of
   * strips shares one fence, a hedged field is its own. */
  fence: number;
  boundary: Boundary;
  /** What stands on the fence edges when the system has no documented
   * boundary of its own: the era's enclosure, drawn in broken runs. */
  enclosure?: Boundary;
  /** Standing water between bunds. */
  wet: boolean;
  /** Under the river's flood; absent outside a flood-basin system. The world
   * sets it from the live season. */
  flood?: boolean;
  /** Edges, same bits, where the ground drops to the bench below. */
  riser?: number;
  /** Corners cut off on the diagonal: north-east 1, south-east 2, south-west
   * 4, north-west 8. A bench's outline follows a slanting hillside. */
  cut?: number;
  /** A kitchen garden bed: planted close, cropped in succession, and drawn
   * right up to its fence. */
  garden?: boolean;
  /** Inside a house's or church's yard, not the town's farmland. */
  yard?: boolean;
  /** Whose ground this is, where anybody holds it: the parcel's tenant, or
   * the household whose yard or kitchen garden it belongs to. Absent is
   * common ground, which nobody minds you picking from. */
  owner?: string;
};

/** Enclosure by era where the farm system documents none: boulders before
 * 3500 BCE, open ground in the early historical world, post and rail from
 * classical to industrial, wire after 1900. */
export function eraEnclosure(year: number): Boundary {
  if (year < -3500) return "stones";
  if (year < -800) return "none";
  if (year < 1900) return "fence";
  return "wire";
}
export type Parcel = {
  id: number;
  /** Stable beyond a planner run; numeric id remains the compact field-cell key. */
  stableId?: string;
  rect: Rect;
  crop: CropId;
  cells: number;
  /** Where a worker steps off the lane into the parcel. */
  access: Point;
  owner?: string;
  baselineYear?: number;
  state?: "used" | "fallow" | "abandoned";
};
/** A place beside a lane out of town kept free for a site the hinterland
 * layer may put there: a mill, a shrine, a dairy. */
export type Slot = {
  at: Point;
  rect: Rect;
  /** The lane cell the site's own path should join. */
  road: Point;
  bearing: number;
  taken?: string;
};
export type Spoke = { gate: Point; bearing: number; points: Point[] };
export type Territory = {
  center: Point;
  /** Chebyshev radius where the fields begin. */
  inner: number;
  /** Chebyshev radius where the territory ends. */
  outer: number;
  spokes: Spoke[];
  slots: Slot[];
};
export type Farmland = {
  system: FarmSystem;
  territory: Territory;
  fields: Map<string, FieldCell>;
  /** Irrigation channels: one cell wide, fed from the river or lake. */
  canals: Set<string>;
  /** The network stands empty: no source reached it, or the season has
   * drained it. The cut and its berms are still there. */
  canalsDry: boolean;
  /** Where a track crosses a canal on a culvert. */
  culverts: Set<string>;
  /** Wells where the system waters from the ground. */
  wells: Point[];
  parcels: Parcel[];
};

/** How far past the built radius a settlement's fields reach. Capped so a
 * metropolis does not plan a province. */
export function territoryReach(radius: number, pack: Pack): number {
  const s = pack.setting;
  if (!s) return 0;
  const system = farmSystem(s);
  return Math.min(90, Math.max(40, Math.round(radius * (system.reach - 1))));
}

type Frame = { dx: number; dy: number };
/** Four wedges of the square annulus, each looking outward along an axis.
 * `u` is outward, `v` across, so parcels stay axis-aligned for the raster. */
const FRAMES: Frame[] = [
  { dx: 1, dy: 0 },
  { dx: 0, dy: 1 },
  { dx: -1, dy: 0 },
  { dx: 0, dy: -1 },
];
const at = (c: Point, f: Frame, u: number, v: number): Point => ({
  x: c.x + f.dx * u - f.dy * v,
  y: c.y + f.dy * u + f.dx * v,
});
const IRRIGATED = new Set(["canal", "flood", "river"]);

export function planFarmland(input: {
  site: Site;
  pack: Pack;
  seed: string;
  sample: Sample;
  urban: boolean;
  /** Regional roads through the area, whose runs out of town become spokes. */
  connections: Road[];
  /** Tracks are graded roads for motor traffic: wider, and the spokes straight. */
  motor?: boolean;
  /** Ground the plan has already given to something else. */
  taken: (x: number, y: number) => boolean;
  /** Buildings and walls, which a parcel keeps a clear cell away from. */
  solid: (x: number, y: number) => boolean;
  /** Ground inside another settlement's claim. */
  foreign: (x: number, y: number) => boolean;
  /** Most parcels to cut: a town gets a ring or two, a village a handful. */
  cap: number;
  /** What an owner grows on whatever they hold, where their trade names it. */
  grows?: Record<string, CropId>;
  /** Lays a straight earth track from `a` to `b`; returns the cells it took. */
  lane: (a: Point, b: Point, label: string) => Point[] | undefined;
  /** Routes from a track's inner end onto the town's streets. */
  join: (a: Point, label: string) => Point[] | undefined;
  /** A street already laid, which a field track can start from. */
  street?: (x: number, y: number) => boolean;
  /** Households that farm, nearest parcels first. */
  owners: string[];
  /** Where each farming household lives, so its fields lie out of its own gate. */
  homeOf: (owner: string) => Point | undefined;
  /** How many parcels the household's standing supports it working. */
  holding: (owner: string) => number;
  /** Whether the household can actually walk there. The gate estimate misses
   * a wall's detour, so a parcel that fails this goes to somebody else. */
  reachable: (home: Point, access: Point) => boolean;
}): Farmland | undefined {
  const {
    site,
    pack,
    seed,
    sample,
    urban,
    taken,
    solid,
    foreign,
    lane,
    join,
    owners,
    homeOf,
    holding,
    reachable,
    cap,
  } = input;
  const setting = pack.setting;
  if (!setting) return;
  const system = farmSystem(setting);
  const c = site.center,
    r = site.profile.radius;
  const rand = (...k: (string | number)[]) =>
    random(seed, "farmland", site.id, ...k);
  // The town is round and the wedges are square: bands start where the
  // square's diagonal clears the built edge, and each parcel is tested
  // against the edge itself so the corners fill in.
  const edge = urban ? r + 2 : Math.max(24, Math.round(r * 0.55));
  const inner = Math.round(edge * 0.72);
  const outer = r + territoryReach(r, pack);
  if (outer - inner < 16) return;
  const [along, back] = system.module;
  const strips = ["strip", "ribbon"].includes(system.geometry);
  const wet = system.geometry === "basin";
  // Flood basins stand under the inundation until it drains.
  const flooded = system.irrigation === "flood" && waterscape(setting).flood >= 0.6;
  // Two clear cells between enclosures: a trodden headland, a bank and the
  // fence on each side, with ground between.
  const boundaryWidth = 2;
  const systemIrrigates = IRRIGATED.has(system.irrigation);
  const landUse = (zone: FarmZone) => {
    const mix = cropsFor(zone, setting.climate);
    /** Crops in a fixed rotation, each repeated by its share, so successive
     * furlongs alternate the way a three-course rotation does rather than
     * rolling dice per field. */
    const rotation: CropId[] = [];
    for (const m of mix)
      for (let i = 0; i < Math.max(1, Math.round(m.share * 6)); i++)
        rotation.push(m.id);
    return {
      rotation,
      pastoral: mix.every((m) => m.id === "pasture" || m.id === "fallow"),
      orchardKinds: mix.filter((m) =>
        ["tree", "vine", "vegetable"].includes(crops[m.id].kind),
      ),
    };
  };
  const slopeZone: FarmZone = system.slope ?? system;
  const uplandZone: FarmZone = system.upland ?? slopeZone;
  const lands = {
    floor: landUse(system),
    slope: landUse(slopeZone),
    upland: landUse(uplandZone),
  };
  // The valley floor is the lowest tier with real ground on it, the upland
  // the highest, where the land climbs far enough to have one.
  const tierArea = new Map<number, number>();
  let landCells = 0;
  for (let y = c.y - outer; y <= c.y + outer; y += 4)
    for (let x = c.x - outer; x <= c.x + outer; x += 4) {
      const f = sample(x, y);
      if (f.water < 4) continue;
      const t = Math.round(f.elevation / 14);
      tierArea.set(t, (tierArea.get(t) ?? 0) + 1);
      landCells++;
    }
  const broad = [...tierArea].filter(([, n]) => n >= landCells * 0.06).map(([t]) => t);
  const floorTier = Math.min(...broad),
    topTier = Math.max(...broad);
  const zoneOfTier = (t: number) =>
    t <= floorTier ? "floor" : t >= topTier && topTier - floorTier >= 2 ? "upland" : "slope";
  const terraceOfTier = (t: number) => {
    const zone = zoneOfTier(t);
    return zone === "floor" ? undefined : (zone === "upland" ? uplandZone : slopeZone).terrace;
  };

  // --- Ground -----------------------------------------------------------------
  /** Elevation bands crossed over eight cells: the slope a system can farm. */
  const slope = (x: number, y: number) => {
    const e = sample(x, y).elevation;
    return (
      Math.max(
        Math.abs(sample(x + 8, y).elevation - e),
        Math.abs(sample(x, y + 8).elevation - e),
      ) / 14
    );
  };
  // Sampling is the cost here, and a parcel is judged by nine samples
  // rather than every cell; the per-cell test only keeps fields off water
  // and off ground the town already holds.
  const groundCache = new Map<string, boolean>();
  const ground = (x: number, y: number) => {
    const k = cellKey(x, y);
    const old = groundCache.get(k);
    if (old !== undefined) return old;
    const f = sample(x, y);
    const ok =
      f.water >= (wet ? 3 : 4) &&
      !f.snow &&
      f.moisture > 0.12 &&
      slope(x, y) <= system.slopeLimit;
    groundCache.set(k, ok);
    return ok;
  };
  const arable = (x: number, y: number) =>
    sample(x, y).water >= (wet ? 3 : 4) && !taken(x, y);
  const parcelGround = (rect: Rect) => {
    let ok = 0;
    for (const fy of [0, 0.5, 1])
      for (const fx of [0, 0.5, 1])
        if (
          ground(
            rect.x + Math.round((rect.w - 1) * fx),
            rect.y + Math.round((rect.h - 1) * fy),
          )
        )
          ok++;
    return ok >= 8;
  };
  const nearWater = (x: number, y: number) => sample(x, y).water < 34;
  const cheb = (p: Point) => Math.max(Math.abs(p.x - c.x), Math.abs(p.y - c.y));
  const dist = (p: Point) => Math.hypot(p.x - c.x, p.y - c.y);

  // --- Tracks -----------------------------------------------------------------
  // A regional road leaving the town is a spoke; a wedge with none gets a
  // track out from its gate. Tracks jog a cell or three every dozen cells,
  // the way a cart track wanders round a stone or a wet patch; a surveyed
  // system's roads run true. Each leg is laid so it ends on ground already
  // on the network.
  const spokes: Spoke[] = [];
  const angleGap = (a: number, b: number) =>
    Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
  for (const road of input.connections) {
    const crossing = road.points.find((p) => Math.abs(dist(p) - edge) <= 3);
    if (!crossing) continue;
    const bearing = Math.atan2(crossing.y - c.y, crossing.x - c.x);
    if (spokes.some((s) => angleGap(s.bearing, bearing) < 0.6)) continue;
    spokes.push({
      gate: crossing,
      bearing,
      points: road.points.filter(
        (p) => dist(p) >= edge - 2 && cheb(p) <= outer,
      ),
    });
  }
  const laneCells = new Set<string>();
  /** Cells a track passes and the cell either side: parcels keep off them. */
  const laneMargin = new Set<string>();
  const remember = (points: Point[]) => {
    for (const p of points) {
      laneCells.add(cellKey(p.x, p.y));
      const m = input.motor ? 2 : 1;
      for (let dy = -m; dy <= m; dy++)
        for (let dx = -m; dx <= m; dx++)
          laneMargin.add(cellKey(p.x + dx, p.y + dy));
    }
  };
  const wander = 2 + Math.round(2 * (1 - system.regularity));
  /** A wandering track through wedge-frame nodes, from the last node (on the
   * network) back out to the first, two straight legs per node. */
  const polyline = (
    f: Frame,
    nodes: { u: number; v: number }[],
    label: string,
  ) => {
    const laid: Point[] = [];
    for (let i = nodes.length - 1; i > 0; i--) {
      const near = nodes[i],
        far = nodes[i - 1];
      const corner = { u: near.u, v: far.v };
      for (const [a, b] of [
        [corner, near],
        [far, corner],
      ] as const) {
        if (a.u === b.u && a.v === b.v) continue;
        const cells = lane(
          at(c, f, a.u, a.v),
          at(c, f, b.u, b.v),
          `${label}-${i}`,
        );
        if (cells) {
          remember(cells);
          laid.push(...cells);
        }
      }
    }
    return laid;
  };
  /** Nodes from `from` to `to` along one axis, jogging on the other. */
  const jogged = (key: string, from: number, to: number, fixed: number) => {
    const nodes = [{ a: from, b: fixed }];
    let b = fixed;
    const step = Math.sign(to - from);
    for (
      let a = from + step * (10 + Math.floor(rand(key, "run") * 6));
      (to - a) * step > 8;
      a += step * (10 + Math.floor(rand(key, "run", a) * 6))
    ) {
      const shift = Math.round((rand(key, "jog", a) - 0.5) * 2 * wander);
      b = Math.max(fixed - wander, Math.min(fixed + wander, b + shift));
      nodes.push({ a, b });
    }
    nodes.push({ a: to, b: fixed });
    return nodes;
  };
  /** Wedges whose spoke is a track on the axis, and so can carry a canal
   * beside it. */
  const axisSpokes = new Set<number>();
  for (const [k, f] of FRAMES.entries()) {
    const bearing = Math.atan2(f.dy, f.dx);
    if (spokes.some((s) => angleGap(s.bearing, bearing) < Math.PI / 4))
      continue;
    // Start from the outermost street on this bearing, as a real field track
    // leaves the end of a village lane; only without one route a gate in.
    let gu = edge,
      gv = 0,
      onStreet = false;
    search: for (let u = edge + 6; u >= 4; u--)
      for (const v of [0, 1, -1, 2, -2, 3, -3]) {
        const p = at(c, f, u, v);
        if (input.street?.(p.x, p.y)) {
          [gu, gv, onStreet] = [u, v, true];
          break search;
        }
      }
    const gate = at(c, f, gu, gv);
    if (!onStreet) {
      const joined = join(gate, `spoke-${k}-join`);
      if (!joined) continue;
      remember(joined);
    }
    const points = polyline(
      f,
      input.motor
        ? [{ u: outer, v: gv }, { u: gu, v: gv }]
        : jogged(`spoke-${k}`, outer, gu, gv).map(({ a, b }) => ({ u: a, v: b })),
      `spoke-${k}`,
    );
    if (!points.length) continue;
    spokes.push({ gate, bearing, points });
    axisSpokes.add(k);
  }

  // --- Slots ------------------------------------------------------------------
  const slots: Slot[] = [];
  for (const [i, s] of spokes.entries())
    for (const d of [24, 52, 84]) {
      const p = s.points.find((q) => Math.abs(dist(q) - (edge + d)) <= 1);
      if (!p || edge + d > outer - 12) continue;
      const side = rand("slot-side", i, d) < 0.5 ? 1 : -1;
      const nx = -Math.sin(s.bearing) * side,
        ny = Math.cos(s.bearing) * side;
      const rect = {
        x: Math.round(p.x + nx * 9) - 6,
        y: Math.round(p.y + ny * 8) - 5,
        w: 12,
        h: 10,
      };
      let ok = true;
      for (let y = rect.y; y < rect.y + rect.h && ok; y++)
        for (let x = rect.x; x < rect.x + rect.w && ok; x++)
          ok =
            ground(x, y) &&
            arable(x, y) &&
            !laneMargin.has(cellKey(x, y)) &&
            !foreign(x, y);
      if (!ok) continue;
      slots.push({
        at: { x: rect.x + 6, y: rect.y + 5 },
        rect,
        road: p,
        bearing: s.bearing,
      });
    }
  const slotCells = new Set<string>();
  for (const s of slots)
    for (let y = s.rect.y - 1; y <= s.rect.y + s.rect.h; y++)
      for (let x = s.rect.x - 1; x <= s.rect.x + s.rect.w; x++)
        slotCells.add(cellKey(x, y));

  // --- Canals -----------------------------------------------------------------
  // A trunk facing the water source, laterals beside its headlands, and a
  // feeder from open water. A channel shifts across to hold its level and
  // steps down only where the ground makes it.
  const canals = new Set<string>();
  const culverts = new Set<string>();
  const channel = (p: Point) => {
    const k = cellKey(p.x, p.y);
    if (laneCells.has(k)) culverts.add(k);
    else canals.add(k);
  };
  // The nearest fresh water worth digging to. Found before anything is laid:
  // whether there is a source at all decides both who irrigates and whether
  // the channels have water in them.
  /** Every river, lake, creek and rivulet in reach, sampled every third cell. */
  const fresh: Point[] = [];
  /** Those at the water's edge, leaving out the middle of a lake. */
  const shore: Point[] = [];
  const source = (() => {
    let best = Infinity,
      found: Point | undefined;
    for (let y = c.y - outer - 24; y <= c.y + outer + 24; y += 3)
      for (let x = c.x - outer - 24; x <= c.x + outer + 24; x += 3) {
        const f = sample(x, y);
        // Real fresh water only: a beach cell at the shore is not a source.
        // A rivulet is under a cell across, so its centre is barely wet.
        if (f.water >= 1 || f.kind === "sea") continue;
        fresh.push({ x, y });
        if (f.water > -3) shore.push({ x, y });
        const d = Math.hypot(x - c.x, y - c.y);
        if (d > edge + 4 && d < best) {
          best = d;
          found = { x, y };
        }
      }
    return found;
  })();
  // A system that documents irrigation digs wherever it settles; anywhere
  // dry enough to need it digs too, so long as there is water to divert.
  const thirsty = ["arid", "mediterranean"].includes(setting.climate);
  const freshDist = (p: Point) => {
    let best = Infinity;
    for (const q of fresh) best = Math.min(best, Math.abs(q.x - p.x) + Math.abs(q.y - p.y));
    return best;
  };
  // How far from a stream a field may lie: a system that lives by its water,
  // and any system in dry country, keeps to the banks; one that farms on
  // rain spreads where it likes. No stream in reach, no rule.
  const pull = Math.min(1, system.riverside + (thirsty ? 0.4 : 0));
  const dryLimit = fresh.length && pull > 0 ? 24 + (1 - pull) * 110 : Infinity;
  const irrigated = systemIrrigates || (thirsty && !!source);
  // Empty channels: a flood system outside its flood, high summer in a dry
  // country, when the head is spent upstream, or a dry country with no
  // source at all. Where the rain is reliable an unfed channel still runs.
  const canalsDry =
    irrigated &&
    ((system.irrigation === "flood" && setting.season !== "autumn") ||
      (thirsty && (setting.season === "summer" || !source)));
  const tierAt = (x: number, y: number) =>
    Math.round(sample(x, y).elevation / 14);
  const diggable = (p: Point) =>
    arable(p.x, p.y) || laneCells.has(cellKey(p.x, p.y));
  /** Digs a run. `point(along, across)` places a cell; the run holds the tier
   * it starts on, drifting up to two cells across to stay level, and takes a
   * step down only where the ground offers nothing on its own tier. */
  const dig = (
    point: (along: number, across: number) => Point,
    from: number,
    to: number,
    across: number,
  ) => {
    let b = across;
    const first = point(from, b);
    let level = tierAt(first.x, first.y);
    for (let a = from; a <= to; a++) {
      const here = point(a, b);
      // Dug by eye, not to a line: it gives a cell or two, away from the track.
      const want = across + Math.round(noise(seed, a, across * 31, 16, "canal-drift") * 2.4);
      const side = point(a, b + Math.sign(want - b));
      if (b !== want && diggable(here) && diggable(side) && tierAt(side.x, side.y) === level) {
        channel(here);
        b += Math.sign(want - b);
      } else if (diggable(here) && tierAt(here.x, here.y) !== level) {
        // One cell across at a time, and never more than two off the line.
        for (const d of [1, -1]) {
          if (b + d < across || b + d - across > 2) continue;
          const q = point(a, b + d);
          if (!diggable(q) || tierAt(q.x, q.y) !== level) continue;
          channel(here);
          b += d;
          break;
        }
      }
      const p = point(a, b);
      if (diggable(p)) {
        channel(p);
        level = tierAt(p.x, p.y);
      } else if (b !== across && diggable(point(a, across))) {
        // Lost the contour: back to the line the field was laid to.
        b = across;
        const q = point(a, b);
        channel(q);
        level = tierAt(q.x, q.y);
      }
    }
  };
  const trunkV = wander + 2;
  const canalWedge = [...axisSpokes].sort((a, b) => {
    if (!source) return a - b;
    const da = at(c, FRAMES[a], inner, trunkV);
    const db = at(c, FRAMES[b], inner, trunkV);
    return (
      Math.hypot(da.x - source.x, da.y - source.y) -
      Math.hypot(db.x - source.x, db.y - source.y)
    );
  })[0];
  if (irrigated && canalWedge !== undefined) {
    const f = FRAMES[canalWedge];
    dig((u, v) => at(c, f, u, v), inner, outer, trunkV);
  }

  // --- Hillsides -------------------------------------------------------------
  // A terrace system farms the ground near a step on benches that follow the
  // step's line: each bench a band at a set share of the way from the lip
  // below to the foot of the rise above, so a bench narrows where the ledge
  // does and bends with it. The grid leaves this ground alone.
  const benched = !!(slopeZone.terrace || uplandZone.terrace);
  // Benches near the town only: further out the grid's fields stop at steps.
  const hillReach = Math.min(outer, edge + 48);
  const side = hillReach * 2 + 1,
    bx0 = c.x - hillReach,
    by0 = c.y - hillReach;
  const boxed = (x: number, y: number) =>
    x >= bx0 && y >= by0 && x < bx0 + side && y < by0 + side;
  const slot = (x: number, y: number) => (y - by0) * side + (x - bx0);
  /** Bench number up from the lip, -1 off the hillside. */
  const benchAt = new Int16Array(benched ? side * side : 0).fill(-1);
  const level = new Int16Array(benchAt.length);
  const betweenSteps = new Uint8Array(benchAt.length);
  /** Distance up from the lip, in cells. */
  const rise = new Float32Array(benchAt.length).fill(Infinity);
  const hill = (x: number, y: number) =>
    benched && boxed(x, y) && benchAt[slot(x, y)] >= 0;
  const N4 = [
    [0, -1],
    [1, 0],
    [0, 1],
    [-1, 0],
  ] as const;
  /** Chamfer distance (5 straight, 7 diagonal) over cells `pass` allows,
   * spreading only on one tier, out to `limit` cells. Each cell also takes
   * the label of the source that reached it first. */
  const spread = (
    sources: number[],
    labels: number[],
    pass: (i: number) => boolean,
    limit: number,
  ) => {
    const dist = new Int32Array(benchAt.length).fill(-1);
    const label = new Int32Array(benchAt.length).fill(-1);
    const buckets: number[][] = [];
    for (const [k, i] of sources.entries()) {
      dist[i] = 0;
      label[i] = labels[k];
      (buckets[0] ??= []).push(i);
    }
    for (let d = 0; d < buckets.length && d <= limit * 5; d++)
      for (const i of buckets[d] ?? []) {
        if (dist[i] !== d) continue;
        const x = i % side,
          y = (i / side) | 0;
        for (let dy = -1; dy <= 1; dy++)
          for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy) continue;
            const nx = x + dx,
              ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= side || ny >= side) continue;
            const j = ny * side + nx;
            if (!pass(j) || level[j] !== level[i]) continue;
            const nd = d + (dx && dy ? 7 : 5);
            if (dist[j] >= 0 && dist[j] <= nd) continue;
            dist[j] = nd;
            label[j] = label[i];
            (buckets[nd] ??= []).push(j);
          }
      }
    return { dist, label };
  };
  /** Bench cells grouped into plots: slices grown from seeds along the lip,
   * so the cuts between plots run up the slope, cut again by bench. */
  const plots: { cells: number[]; bench: number; tier: number; slice: number }[] =
    [];
  /** Cells left unsown between slices: a path up the terraces. */
  const stairs = new Set<number>();
  if (benched) {
    const open = new Uint8Array(benchAt.length);
    for (let y = 0; y < side; y++)
      for (let x = 0; x < side; x++) {
        const wx = bx0 + x,
          wy = by0 + y,
          i = y * side + x;
        // The town itself is never terraced; its rim is only a neighbour.
        const d = Math.hypot(wx - c.x, wy - c.y);
        if (d < edge - 1) continue;
        const f = sample(wx, wy);
        level[i] = Math.round(f.elevation / 14);
        const terrace = terraceOfTier(level[i]);
        open[i] = +(
          !!terrace &&
          d >= edge &&
          f.water >= (terrace.wet ? 3 : 4) &&
          !f.snow &&
          f.moisture > 0.12 &&
          !taken(wx, wy) &&
          !foreign(wx, wy)
        );
      }
    const tierOf = (x: number, y: number) =>
      boxed(x, y) ? level[slot(x, y)] : tierAt(x, y);
    const lips: number[] = [],
      feet: number[] = [];
    for (let i = 0; i < open.length; i++) {
      if (!open[i]) continue;
      const x = bx0 + (i % side),
        y = by0 + ((i / side) | 0);
      for (const [dx, dy] of N4) {
        const t = tierOf(x + dx, y + dy);
        if (t < level[i]) lips.push(i);
        else if (t > level[i]) feet.push(i);
        else continue;
        break;
      }
    }
    // A broad ledge is terraced only near its lip; a narrow one, all across.
    const narrow = 40;
    const down = spread(lips, lips, (j) => !!open[j], narrow).dist;
    const up = spread(feet, feet, (j) => !!open[j], narrow).dist;
    for (let i = 0; i < open.length; i++) {
      if (down[i] < 0) continue;
      const terrace = terraceOfTier(level[i])!;
      const d = down[i] / 5;
      const u = up[i] < 0 ? Infinity : up[i] / 5;
      // The cell at the lip and at the foot stays a grass bank.
      if (d < 1 || u < 1) continue;
      // A bench swells and pinches as it follows the hill.
      const drift =
        (noise(seed, bx0 + (i % side), by0 + ((i / side) | 0), 12, "bench") - 0.5) *
        terrace.sinuous *
        terrace.depth *
        1.6;
      const span = d + u;
      let b: number;
      if (span <= terrace.reach) {
        betweenSteps[i] = 1;
        const n = Math.max(1, Math.round(span / terrace.depth));
        b = Math.max(0, Math.min(n - 1, Math.floor(((d + drift) / span) * n)));
      } else if (d <= terrace.reach)
        b = Math.max(0, Math.floor((d - 1 + drift) / terrace.depth));
      else continue;
      benchAt[i] = b;
      rise[i] = d;
    }
    // Seeds a plot's length apart along the first bench.
    const seeds: number[] = [];
    const reach2: number[] = [];
    for (let i = 0; i < benchAt.length; i++) {
      if (benchAt[i] < 0 || rise[i] >= 2) continue;
      const x = i % side,
        y = (i / side) | 0;
      if (
        seeds.some((s, k) => {
          const sx = s % side,
            sy = (s / side) | 0;
          return (sx - x) ** 2 + (sy - y) ** 2 < reach2[k];
        })
      )
        continue;
      const len = terraceOfTier(level[i])!.plot * (0.7 + rand("plot", bx0 + x, by0 + y) * 0.6);
      seeds.push(i);
      reach2.push(len * len);
    }
    const { label } = spread(
      seeds,
      seeds.map((_, k) => k),
      (j) => benchAt[j] >= 0,
      narrow * 2,
    );
    // Every other cut or so is left as a path rather than a wall.
    const stairCut = (a: number, b: number) =>
      rand("stair", Math.min(a, b), Math.max(a, b)) < 0.45;
    const byPlot = new Map<string, (typeof plots)[number]>();
    for (let i = 0; i < benchAt.length; i++) {
      if (benchAt[i] < 0 || label[i] < 0) continue;
      const x = i % side,
        y = (i / side) | 0;
      let stair = false;
      for (const [dx, dy] of N4) {
        const nx = x + dx,
          ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= side || ny >= side) continue;
        const l = label[ny * side + nx];
        if (l >= 0 && l < label[i] && stairCut(l, label[i])) stair = true;
      }
      if (stair) {
        stairs.add(i);
        continue;
      }
      const k = `${label[i]}:${benchAt[i]}`;
      let plot = byPlot.get(k);
      if (!plot)
        byPlot.set(
          k,
          (plot = {
            cells: [],
            bench: benchAt[i],
            tier: level[i],
            slice: label[i],
          }),
        );
      plot.cells.push(i);
    }
    plots.push(...byPlot.values());
  }

  // --- Parcels ----------------------------------------------------------------
  // A town's fields are a ring or two of big parcels, a village's a handful
  // by its houses; the count is capped, and bands go round all four wedges
  // before the next ring starts, so the cap leaves a ring, not a wedge.
  const fields = new Map<string, FieldCell>();
  const parcels: Parcel[] = [];
  const groupOf = new Map<number, number>();
  const reach = outer - inner;
  const rows = strips ? 1 : 2;
  // Fields in one enclosure share their boundaries: a furlong of six strips,
  // four blocks to a hedged close. Only a clearing stands alone.
  const per = system.geometry === "clearing" ? 1 : strips ? 6 : 2;
  const rowGap = per === 1 ? boundaryWidth : 0;
  const alongCells = strips ? Math.round(along * 1.5) : along;
  const backCells = strips ? Math.round(back * 1.25) : back;
  const bandDepth = backCells * rows + rowGap * (rows - 1);
  const pitch = bandDepth + 1;
  const loose = per === 2 ? (1 - system.regularity) * 0.5 : 0;
  const use = (u: number, group: number, band: number, k: number, pastoral: boolean) => {
    if (pastoral) return "pasture";
    const t = (u - inner) / reach;
    if (system.geometry === "clearing")
      return (k + band + group) % 4 === 3
        ? "none"
        : (k + band * 2 + group) % 3 === 2
          ? "fallow"
          : "crop";
    if (t < 0.55) return "crop";
    if (t < 0.8) return (group + band) % 2 === 0 ? "crop" : "pasture";
    return group % 3 === 0 ? "pasture" : "none";
  };
  const furlongCrop = (
    land: (typeof lands)["floor"],
    k: number,
    band: number,
    group: number,
    orchard: boolean,
  ): CropId => {
    if (orchard && land.orchardKinds.length)
      return land.orchardKinds[(k + band + group) % land.orchardKinds.length].id;
    return land.rotation[(band * 2 + group + k) % land.rotation.length];
  };
  let nextParcel = 1,
    nextGroup = 1;
  // --- Benches ----------------------------------------------------------------
  // Cut before the grid, which takes what level ground is left. Nearest
  // first, a plot to each slice of each bench. Furrows run along the bench,
  // across the way the ground falls. Bench plots are a quarter the size of a
  // field, so a hillside gets several to each field the cap allows.
  const benchParcels = new Set<number>();
  /** Lots along a stream: like benches, they follow a line that slants. */
  const bankParcels = new Set<number>();
  /** How far from the water the first row of them ends. */
  let bankRow = 0;
  const benchCap = cap * 3;
  const gridCount = () => parcels.length - benchParcels.size;
  const centreOf = (cells: number[]) => {
    let sx = 0,
      sy = 0;
    for (const i of cells) {
      sx += i % side;
      sy += (i / side) | 0;
    }
    return { x: bx0 + sx / cells.length, y: by0 + sy / cells.length };
  };
  const ordered = plots
    .map((p) => ({ ...p, d: dist(centreOf(p.cells)) }))
    .sort((a, b) => a.d - b.d);
  const riseAt = (x: number, y: number, i: number) =>
    hill(x, y) && level[slot(x, y)] === level[i] ? rise[slot(x, y)] : rise[i];
  for (const plot of ordered) {
    if (benchParcels.size >= benchCap) break;
    const keys: string[] = [];
    for (const i of plot.cells) {
      const x = bx0 + (i % side),
        y = by0 + ((i / side) | 0);
      const key = cellKey(x, y);
      if (
        fields.has(key) ||
        !arable(x, y) ||
        laneMargin.has(key) ||
        slotCells.has(key) ||
        canals.has(key) ||
        culverts.has(key)
      )
        continue;
      keys.push(key);
    }
    if (keys.length < 6) continue;
    const mine = new Set(keys);
    let access: Point | undefined,
      best = Infinity;
    for (const key of keys) {
      const [x, y] = key.split(",").map(Number);
      for (const [dx, dy] of N4) {
        const q = { x: x + dx, y: y + dy };
        const qk = cellKey(q.x, q.y);
        if (mine.has(qk) || fields.has(qk) || !arable(q.x, q.y)) continue;
        if (N4.filter(([ex, ey]) => !taken(q.x + ex, q.y + ey)).length < 3)
          continue;
        // A path up the slope is the way in, where the plot has one.
        const score =
          dist(q) - (boxed(q.x, q.y) && stairs.has(slot(q.x, q.y)) ? 40 : 0);
        if (score < best) [best, access] = [score, q];
      }
    }
    if (!access) continue;
    const id = nextParcel++;
    benchParcels.add(id);
    groupOf.set(id, 200000 + plot.tier * 1000 + plot.bench);
    const terrace = terraceOfTier(plot.tier)!;
    const land = lands[zoneOfTier(plot.tier)];
    // One crop to a bench for most of its length, as a hillside is planted.
    const crop: CropId = land.pastoral
      ? "pasture"
      : land.rotation[
          (plot.bench + plot.tier * 2 + (rand("bench-crop", plot.slice, plot.bench) < 0.3 ? 1 : 0)) %
            land.rotation.length
        ];
    const boundary: Boundary =
      terrace.riser === "wall" ? "wall" : terrace.riser === "bund" ? "bund" : "baulk";
    let x0 = Infinity,
      y0 = Infinity,
      x1 = -Infinity,
      y1 = -Infinity;
    // One furrow direction to a plot: across the way most of it falls.
    let fall = 0;
    for (const key of keys) {
      const [x, y] = key.split(",").map(Number);
      const i = slot(x, y);
      fall +=
        Math.abs(riseAt(x + 2, y, i) - riseAt(x - 2, y, i)) -
        Math.abs(riseAt(x, y + 2, i) - riseAt(x, y - 2, i));
    }
    const axis = fall > 0 ? "y" : "x";
    for (const key of keys) {
      const [x, y] = key.split(",").map(Number);
      fields.set(key, {
        parcel: id,
        crop,
        axis,
        edges: 0,
        fence: 0,
        boundary,
        wet: flooded || (!!terrace.wet && crops[crop].wet === true),
        ...(system.irrigation === "flood" && { flood: flooded }),
      });
      x0 = Math.min(x0, x);
      y0 = Math.min(y0, y);
      x1 = Math.max(x1, x);
      y1 = Math.max(y1, y);
    }
    parcels.push({
      id,
      rect: { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 },
      crop,
      cells: keys.length,
      access,
    });
  }

  // --- Banks ------------------------------------------------------------------
  // A system that lives by its water lays its first lots along the stream:
  // rows of plots that follow the bank, cut across at a plot's length. They
  // are ordinary fields after that, and come out of the same cap.
  if (pull >= 0.5 && shore.length && !lands.floor.pastoral) {
    const nearest = wet ? 3 : 4;
    const depth = Math.max(3, Math.min(back, 6));
    const deep = nearest + (pull >= 0.9 ? 3 : 2) * depth;
    const len = Math.max(6, along);
    bankRow = nearest + depth;
    const reachCells = Math.ceil(deep) + 1;
    // Eight-cell blocks within reach of a shore point, each scanned once: a
    // marsh has thousands of shore points and their neighbourhoods overlap.
    const blocks = new Set<number>();
    const span = Math.ceil(reachCells / 8);
    for (const q of shore)
      for (let by = (q.y >> 3) - span; by <= (q.y >> 3) + span; by++)
        for (let bx = (q.x >> 3) - span; bx <= (q.x >> 3) + span; bx++)
          blocks.add(bx * 65536 + by + 32768);
    const bank = new Map<string, { x: number; y: number; row: number; near: boolean }>();
    for (const b of blocks) {
      const bx = Math.floor(b / 65536),
        by = b - bx * 65536 - 32768;
      for (let y = by * 8; y < by * 8 + 8; y++)
        for (let x = bx * 8; x < bx * 8 + 8; x++) {
          const key = cellKey(x, y);
          const p = { x, y };
          if (cheb(p) > outer || dist(p) < edge) continue;
          const f = sample(x, y);
          if (f.kind === "sea" || f.water < nearest || f.water >= deep) continue;
          if (
            !ground(x, y) ||
            !arable(x, y) ||
            foreign(x, y) ||
            fields.has(key) ||
            laneMargin.has(key) ||
            slotCells.has(key) ||
            canals.has(key) ||
            culverts.has(key)
          )
            continue;
          bank.set(key, {
            x,
            y,
            row: Math.floor((f.water - nearest) / depth),
            near: f.water < nearest + 1.5,
          });
        }
    }
    const seeds: Point[] = [];
    for (const b of [...bank.values()].filter((b) => b.near).sort((a, b) => dist(a) - dist(b)))
      if (!seeds.some((q) => Math.hypot(q.x - b.x, q.y - b.y) < len)) seeds.push(b);
    const lots = new Map<string, { seed: number; row: number; keys: string[] }>();
    for (const [key, b] of bank) {
      let best = -1,
        bd = len * 2;
      for (const [i, q] of seeds.entries()) {
        const d = Math.hypot(q.x - b.x, q.y - b.y);
        // A lot keeps to its own bank.
        if (d >= bd || sample((q.x + b.x) >> 1, (q.y + b.y) >> 1).water < 1) continue;
        best = i;
        bd = d;
      }
      if (best < 0) continue;
      const id = `${best}:${b.row}`;
      const lot = lots.get(id) ?? { seed: best, row: b.row, keys: [] };
      lot.keys.push(key);
      lots.set(id, lot);
    }
    let cut = 0;
    for (const lot of [...lots.values()].sort((a, b) => a.seed - b.seed || a.row - b.row)) {
      if (cut >= cap * 0.7) break;
      if (lot.keys.length < 8) continue;
      const mine = new Set(lot.keys);
      let access: Point | undefined,
        best = Infinity;
      for (const key of lot.keys) {
        const [x, y] = key.split(",").map(Number);
        for (const [dx, dy] of N4) {
          const q = { x: x + dx, y: y + dy };
          if (mine.has(cellKey(q.x, q.y)) || bank.has(cellKey(q.x, q.y)) || !arable(q.x, q.y)) continue;
          if (N4.filter(([ex, ey]) => !taken(q.x + ex, q.y + ey)).length < 3) continue;
          if (dist(q) < best) [best, access] = [dist(q), q];
        }
      }
      if (!access) continue;
      const at0 = seeds[lot.seed];
      const land = lands[zoneOfTier(tierAt(at0.x, at0.y))];
      if (land.pastoral) continue;
      // The wet crop takes the row at the water.
      const crop =
        (lot.row === 0 && land.rotation.find((c) => crops[c].wet)) ||
        land.rotation[(lot.seed * 2 + lot.row) % land.rotation.length];
      const id = nextParcel++;
      groupOf.set(id, 300000);
      bankParcels.add(id);
      let x0 = Infinity,
        y0 = Infinity,
        x1 = -Infinity,
        y1 = -Infinity;
      for (const key of lot.keys) {
        const [x, y] = key.split(",").map(Number);
        const gx = sample(x + 2, y).water - sample(x - 2, y).water;
        const gy = sample(x, y + 2).water - sample(x, y - 2).water;
        fields.set(key, {
          parcel: id,
          crop,
          axis: Math.abs(gx) > Math.abs(gy) ? "y" : "x",
          edges: 0,
          fence: 0,
          boundary: system.boundary,
          wet: flooded || (wet && crops[crop].wet === true),
          ...(system.irrigation === "flood" && { flood: flooded }),
        });
        x0 = Math.min(x0, x);
        y0 = Math.min(y0, y);
        x1 = Math.max(x1, x);
        y1 = Math.max(y1, y);
      }
      parcels.push({
        id,
        rect: { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 },
        crop,
        cells: lot.keys.length,
        access,
      });
      cut++;
    }
  }

  const wedge = FRAMES.map((f, k) => ({
    f,
    k,
    axis: (strips ? (f.dx ? "x" : "y") : f.dx ? "y" : "x") as "x" | "y",
    u:
      inner +
      2 +
      Math.abs(
        Math.round(
          (rand("drift", k) - 0.5) * (1 - system.regularity) * pitch * 0.4,
        ),
      ),
    band: 0,
  }));
  let ring = 0;
  while (gridCount() < cap && wedge.some((w) => w.u + bandDepth <= outer)) {
    for (const w of wedge) {
      const { f, k, axis } = w;
      const u = w.u;
      if (u + bandDepth > outer || gridCount() >= cap) continue;
      const band = w.band;
      const uEnd = u + bandDepth;
      const half = uEnd;
      const laneU = u - 1;
      // A headland every other ring: enough lanes to reach the fields, not
      // a grid of them. It wanders like the spokes and ends on the spoke.
      if ((band % 2 === 1 || (!urban && band === 0)) && laneU > edge) {
        const clear = (v: number) => Math.hypot(laneU, v) >= edge + 1;
        let lo = -half + 1,
          hi = half - 1;
        while (lo < 0 && !clear(lo)) lo++;
        while (hi > 0 && !clear(hi)) hi--;
        const spoke = spokes.find(
          (s) => angleGap(s.bearing, Math.atan2(f.dy, f.dx)) < Math.PI / 4,
        );
        const nominal = at(c, f, laneU, 0);
        const meet = spoke?.points.reduce(
          (best, p) =>
            Math.hypot(p.x - nominal.x, p.y - nominal.y) <
            Math.hypot(best.x - nominal.x, best.y - nominal.y)
              ? p
              : best,
          spoke.points[0],
        );
        // The spoke cell in wedge terms, so the headland joins it exactly.
        const meetV = meet ? -f.dy * (meet.x - c.x) + f.dx * (meet.y - c.y) : 0;
        const meetU = meet
          ? f.dx * (meet.x - c.x) + f.dy * (meet.y - c.y)
          : laneU;
        const laid = [
          polyline(
            f,
            jogged(`headland-${k}-${band}-w`, lo, meetV, laneU)
              .map(({ a, b }) => ({ u: b, v: a }))
              .map((n, i, all) =>
                i === all.length - 1 ? { u: meetU, v: meetV } : n,
              ),
            `headland-${k}-${band}-w`,
          ),
          polyline(
            f,
            jogged(`headland-${k}-${band}-e`, hi, meetV, laneU)
              .map(({ a, b }) => ({ u: b, v: a }))
              .map((n, i, all) =>
                i === all.length - 1 ? { u: meetU, v: meetV } : n,
              ),
            `headland-${k}-${band}-e`,
          ),
        ].filter((l) => l.length);
        // Branches follow headlands in the trunk's wedge.
        if (laid.length && irrigated && k === canalWedge)
          dig((v, u) => at(c, f, u, v), lo, hi, laneU + 1);
      }
      const orchard = band === 0 && system.orchard > 0;
      let v = -half + 2;
      let index = 0;
      while (v + alongCells <= half - 1 && gridCount() < cap) {
        const groupIndex = Math.floor(index / per);
        const groupId = nextGroup + groupIndex;
        // A close is not cut in equal quarters: the pair lean one way, and
        // each column's cross-boundary falls where its own holders set it.
        const lean = Math.round((rand("lean", k, band, groupIndex) - 0.5) * loose * alongCells);
        const wide = alongCells + (index % per ? -lean : lean);
        const split = Math.round((rand("split", k, band, index) - 0.5) * loose * backCells);
        const here = at(c, f, u + (bandDepth >> 1), v + (wide >> 1));
        const zone = zoneOfTier(tierAt(here.x, here.y));
        const land = use(u, groupIndex, band, k, lands[zone].pastoral);
        for (let row = 0; row < rows && land !== "none"; row++) {
          const sown: CropId =
            land === "pasture"
              ? "pasture"
              : land === "fallow"
                ? "fallow"
                : furlongCrop(
                    lands[zone],
                    k,
                    band,
                    strips ? groupIndex : index + row,
                    orchard && groupIndex % 3 === 0,
                  );
          const u0 = row ? u + backCells + split + rowGap : u;
          const deep = rows === 1 ? backCells : row ? backCells - split : backCells + split;
          const corner = at(c, f, u0, v),
            far = at(c, f, u0 + deep - 1, v + wide - 1);
          const rect = {
            x: Math.min(corner.x, far.x),
            y: Math.min(corner.y, far.y),
            w: Math.abs(far.x - corner.x) + 1,
            h: Math.abs(far.y - corner.y) + 1,
          };
          const mid = { x: rect.x + (rect.w >> 1), y: rect.y + (rect.h >> 1) };
          if (foreign(mid.x, mid.y)) continue;
          if (freshDist(mid) > dryLimit) continue;
          // Paddy needs water to hand; the same farmers sow the dry ground
          // beyond it with whatever else they grow.
          let crop = sown;
          if (wet && crops[crop].wet && !nearWater(mid.x, mid.y)) {
            const dry = lands[zone].rotation.filter((id) => !crops[id].wet);
            if (!dry.length) continue;
            crop = dry[(index + row + band) % dry.length];
          }
          if (
            Math.hypot(rect.x - c.x, rect.y - c.y) < edge ||
            Math.hypot(rect.x + rect.w - c.x, rect.y - c.y) < edge ||
            Math.hypot(rect.x - c.x, rect.y + rect.h - c.y) < edge ||
            Math.hypot(rect.x + rect.w - c.x, rect.y + rect.h - c.y) < edge
          )
            continue;
          if (!parcelGround(rect)) continue;
          if (benched) {
            let sloped = 0;
            for (let y = rect.y; y < rect.y + rect.h; y += 2)
              for (let x = rect.x; x < rect.x + rect.w; x += 2)
                if (hill(x, y)) sloped++;
            if (sloped * 4 > rect.w * rect.h * 0.2) continue;
          }
          // A cell of clear ground all round, against buildings and walls:
          // a parcel hard against the stair-stepped ring left its access
          // in a pocket of it.
          let ringed = true;
          for (let x = rect.x - 1; x <= rect.x + rect.w && ringed; x++)
            ringed = !solid(x, rect.y - 1) && !solid(x, rect.y + rect.h);
          for (let y = rect.y; y < rect.y + rect.h && ringed; y++)
            ringed = !solid(rect.x - 1, y) && !solid(rect.x + rect.w, y);
          if (!ringed) continue;
          const free = (x: number, y: number) => {
            const key = cellKey(x, y);
            return (
              arable(x, y) &&
              !fields.has(key) &&
              !laneMargin.has(key) &&
              !slotCells.has(key) &&
              !canals.has(key) &&
              !culverts.has(key)
            );
          };
          let good = 0,
            total = 0;
          for (let y = rect.y; y < rect.y + rect.h; y++)
            for (let x = rect.x; x < rect.x + rect.w; x++) {
              total++;
              if (free(x, y)) good++;
            }
          if (good < total * 0.8) continue;
          const id = nextParcel++;
          groupOf.set(id, groupId);
          const ragged = system.geometry === "clearing" ? 0.45 : 0;
          let cells = 0;
          for (let y = rect.y; y < rect.y + rect.h; y++)
            for (let x = rect.x; x < rect.x + rect.w; x++) {
              if (!free(x, y)) continue;
              const onEdge =
                x === rect.x ||
                y === rect.y ||
                x === rect.x + rect.w - 1 ||
                y === rect.y + rect.h - 1;
              if (
                onEdge &&
                ragged &&
                noise(seed, x, y, 9, "field-edge") < ragged
              )
                continue;
              fields.set(cellKey(x, y), {
                parcel: id,
                crop,
                axis,
                edges: 0,
                fence: 0,
                boundary: system.boundary,
                wet: flooded || (wet && crops[crop].wet === true),
                ...(system.irrigation === "flood" && { flood: flooded }),
              });
              cells++;
            }
          if (!cells) continue;
          // The worker steps in from the lane on the town side, or from the
          // far side where the near one is wall, water or someone's yard.
          const access = [
            at(c, f, u0 - 1, v + (wide >> 1)),
            at(c, f, u0 + deep, v + (wide >> 1)),
            at(c, f, u0 + (deep >> 1), v - 1),
            at(c, f, u0 + (deep >> 1), v + wide),
          ].find(
            (q) =>
              arable(q.x, q.y) &&
              !fields.has(cellKey(q.x, q.y)) &&
              [
                [1, 0],
                [-1, 0],
                [0, 1],
                [0, -1],
              ].filter(([dx, dy]) => !taken(q.x + dx, q.y + dy)).length >= 3,
          );
          if (!access) continue;
          parcels.push({ id, rect, crop, cells, access });
        }
        v += wide + (index % per === per - 1 ? boundaryWidth + (strips ? 1 : 0) : 0);
        index++;
      }
      nextGroup += Math.ceil(index / per) + 1;
      w.u = uEnd + 1;
      w.band++;
    }
    ring++;
  }

  // --- Feeder -----------------------------------------------------------------
  // A channel nobody farms beside was never dug.
  for (const set of [canals, culverts])
    for (const k of [...set]) {
      const [x, y] = k.split(",").map(Number);
      let farmed = false;
      for (let dy = -4; dy <= 4 && !farmed; dy++)
        for (let dx = -4; dx <= 4 && !farmed; dx++)
          farmed = fields.has(cellKey(x + dx, y + dy));
      if (!farmed) set.delete(k);
    }
  /** The cheapest way, cell to cell, from `starts` to a cell `goal` accepts.
   * Built ground and the sea are closed, a step in the ground is dear, and
   * `cost` adds to each cell entered. Empty if there is none within reach. */
  const route = (
    starts: Point[],
    goal: (x: number, y: number, k: string) => boolean,
    cost: (x: number, y: number, k: string, water: number) => number,
    turn: number,
  ): Point[] => {
    const R = outer + 24,
      W = R * 2 + 1;
    const best = new Int32Array(W * W * 4).fill(1 << 30);
    const prev = new Int32Array(best.length).fill(-1);
    const buckets: number[][] = [];
    const cellOf = (st: number) => ({ x: c.x - R + ((st >> 2) % W), y: c.y - R + (((st >> 2) / W) | 0) });
    for (const p of starts) {
      if (Math.abs(p.x - c.x) > R || Math.abs(p.y - c.y) > R) continue;
      const i = ((p.y - c.y + R) * W + (p.x - c.x + R)) * 4;
      for (let d = 0; d < 4; d++) {
        best[i + d] = 0;
        (buckets[0] ??= []).push(i + d);
      }
    }
    for (let c0 = 0; c0 < Math.min(buckets.length, 3000); c0++)
      for (const st of buckets[c0] ?? []) {
        if (best[st] !== c0) continue;
        const { x, y } = cellOf(st),
          dir = st & 3;
        if (c0 && goal(x, y, cellKey(x, y))) {
          const out: Point[] = [];
          for (let at = st; at >= 0; at = prev[at]) out.push(cellOf(at));
          return out.reverse();
        }
        const tier = tierAt(x, y),
          onLane = laneCells.has(cellKey(x, y));
        for (let nd = 0; nd < 4; nd++) {
          if (c0 && nd === (dir + 2) % 4) continue;
          const qx = x + N4[nd][0],
            qy = y + N4[nd][1];
          if (Math.abs(qx - c.x) > R || Math.abs(qy - c.y) > R) continue;
          const k = cellKey(qx, qy);
          const f = sample(qx, qy);
          if (f.kind === "sea" && f.water < 0) continue;
          if (f.water >= 0 && taken(qx, qy) && !laneCells.has(k) && !canals.has(k)) continue;
          const step =
            c0 +
            4 +
            cost(qx, qy, k, f.water) +
            // Straight over a track, never along it.
            (laneCells.has(k) ? (onLane ? 80 : 10) : 0) +
            (c0 && nd !== dir ? turn : 0) +
            (c0 && f.water >= 0 && tierAt(qx, qy) !== tier ? 40 : 0);
          const next = ((qy - c.y + R) * W + (qx - c.x + R)) * 4 + nd;
          if (step >= best[next]) continue;
          best[next] = step;
          prev[next] = st;
          (buckets[step] ??= []).push(next);
        }
      }
    return [];
  };
  /** Channels led from the water, which the wedge trim below leaves alone. */
  const led = new Set<string>();
  const lay = (path: Point[]) => {
    for (const p of path) {
      // The cut runs through the shallows to the stream's own water.
      if (sample(p.x, p.y).water < -0.9) continue;
      const k = cellKey(p.x, p.y);
      fields.delete(k);
      channel(p);
      led.add(k);
    }
  };
  const open = fresh.filter((p) => sample(p.x, p.y).water < 0);
  // Lots along a stream are watered by a channel that leaves it above them
  // and runs behind the first row, bending as the stream bends.
  if (irrigated && open.length && bankParcels.size) {
    const todo = new Map<string, Point>();
    for (const [k, cell] of fields)
      if (bankParcels.has(cell.parcel)) {
        const [x, y] = k.split(",").map(Number);
        todo.set(k, { x, y });
      }
    const stretches: Point[][] = [];
    while (todo.size) {
      const [k0, p0] = todo.entries().next().value!;
      todo.delete(k0);
      const group = [p0];
      for (const p of group)
        for (let dy = -2; dy <= 2; dy++)
          for (let dx = -2; dx <= 2; dx++) {
            const k = cellKey(p.x + dx, p.y + dy);
            const q = todo.get(k);
            if (!q) continue;
            todo.delete(k);
            group.push(q);
          }
      stretches.push(group);
    }
    for (const group of stretches.sort((a, b) => b.length - a.length).slice(0, 3)) {
      if (group.length < 40) continue;
      const far = (from: Point) =>
        group.reduce((m, p) => (Math.hypot(p.x - from.x, p.y - from.y) > Math.hypot(m.x - from.x, m.y - from.y) ? p : m));
      const a = far(far(group[0])),
        b = far(a);
      // The head is the end further from the town.
      const [head, tail] = dist(a) > dist(b) ? [a, b] : [b, a];
      const span = Math.hypot(head.x - tail.x, head.y - tail.y);
      const intake = open.reduce((m, p) => (Math.hypot(p.x - head.x, p.y - head.y) < Math.hypot(m.x - head.x, m.y - head.y) ? p : m));
      lay(
        route(
          [intake],
          (x, y) =>
            Math.hypot(x - tail.x, y - tail.y) < Math.max(6, span * 0.3) &&
            Math.abs(sample(x, y).water - bankRow) < 1,
          (x, y, _k, water) =>
            Math.round(Math.abs(water - bankRow) * 6 + noise(seed, x, y, 11, "bank-canal") * 3),
          0,
        ),
      );
    }
  }
  // Whatever else was dug is fed from the nearest open water by the easiest
  // way over the ground, giving a little to the lie of the land.
  if (irrigated && open.length && [...canals].some((k) => !led.has(k)))
    lay(
      route(
        open,
        (_x, _y, k) => canals.has(k),
        (x, y, k) =>
          Math.round(noise(seed, x, y, 14, "feeder") * 6) +
          (fields.has(k) ? 12 : 0),
        6,
      ),
    );
  // A channel no water reaches carries nothing and is not kept.
  if (led.size) {
    const fed = [...led];
    const reached = new Set(fed);
    for (const k of fed) {
      const [x, y] = k.split(",").map(Number);
      for (const [dx, dy] of N4) {
        const n = cellKey(x + dx, y + dy);
        if (reached.has(n) || (!canals.has(n) && !culverts.has(n))) continue;
        reached.add(n);
        fed.push(n);
      }
    }
    for (const set of [canals, culverts]) for (const k of [...set]) if (!reached.has(k)) set.delete(k);
  }
  // A spur that waters nothing is not dug: each loose end is cut back to the
  // last field it passes or the channel it left.
  for (let ends = [...canals]; ends.length; ) {
    const next: string[] = [];
    for (const k of ends) {
      if (!canals.has(k)) continue;
      const [x, y] = k.split(",").map(Number);
      const joined = N4.filter(([dx, dy]) => {
        const n = cellKey(x + dx, y + dy);
        return canals.has(n) || culverts.has(n) || sample(x + dx, y + dy).water < 0;
      });
      let beside = false;
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) beside ||= fields.has(cellKey(x + dx, y + dy));
      if (joined.length > 1 || beside) continue;
      canals.delete(k);
      for (const [dx, dy] of joined) next.push(cellKey(x + dx, y + dy));
    }
    ends = next;
  }

  // --- Wells ------------------------------------------------------------------
  const wells: Point[] = [];
  if (system.irrigation === "well")
    for (const [i, p] of parcels.entries())
      if (i % 6 === 2) {
        const w = { x: p.access.x + 1, y: p.access.y };
        const k = cellKey(w.x, w.y);
        if (!fields.has(k) && !laneCells.has(k) && arable(w.x, w.y))
          wells.push(w);
      }

  // --- Steps ------------------------------------------------------------------
  // A field ends at a step in the ground rather than running over it: the
  // cell either side is left as a grass bank, a parcel keeps the tier most of
  // it lies on, and a part on another tier stays only if it would make a
  // field on its own.
  {
    const bounds = (keys: string[]): Rect => {
      let x0 = Infinity,
        y0 = Infinity,
        x1 = -Infinity,
        y1 = -Infinity;
      for (const k of keys) {
        const [x, y] = k.split(",").map(Number);
        x0 = Math.min(x0, x);
        y0 = Math.min(y0, y);
        x1 = Math.max(x1, x);
        y1 = Math.max(y1, y);
      }
      return { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
    };
    const byParcel = new Map<number, Map<number, string[]>>();
    for (const [k, cell] of [...fields]) {
      if (benchParcels.has(cell.parcel)) continue;
      const [x, y] = k.split(",").map(Number);
      const t = tierAt(x, y);
      if (N4.some(([dx, dy]) => tierAt(x + dx, y + dy) !== t)) {
        fields.delete(k);
        continue;
      }
      const tiers = byParcel.get(cell.parcel) ?? new Map<number, string[]>();
      tiers.set(t, [...(tiers.get(t) ?? []), k]);
      byParcel.set(cell.parcel, tiers);
    }
    for (const parent of [...parcels]) {
      if (benchParcels.has(parent.id)) continue;
      const ranked = [...(byParcel.get(parent.id)?.values() ?? [])].sort(
        (a, b) => b.length - a.length,
      );
      const total = ranked.reduce((n, keys) => n + keys.length, 0);
      parent.cells = ranked[0]?.length ?? 0;
      if (ranked[0]) parent.rect = bounds(ranked[0]);
      for (const keys of ranked.slice(1)) {
        if (keys.length < Math.max(12, total * 0.35)) {
          for (const k of keys) fields.delete(k);
          continue;
        }
        const id = nextParcel++;
        // Its own enclosure, so the headland and fence fall on the bank.
        groupOf.set(id, id + 100000);
        for (const k of keys) fields.get(k)!.parcel = id;
        parcels.push({
          id,
          rect: bounds(keys),
          crop: parent.crop,
          cells: keys.length,
          access: parent.access,
        });
      }
    }
    for (let i = parcels.length - 1; i >= 0; i--)
      if (!parcels[i].cells) parcels.splice(i, 1);
  }

  // --- Edges and fences -------------------------------------------------------
  for (const [k, cell] of fields) {
    const [x, y] = k.split(",").map(Number);
    let edges = 0,
      fence = 0,
      riser = 0,
      open = 0;
    const group = groupOf.get(cell.parcel);
    const terraced = benchParcels.has(cell.parcel);
    for (const [bit, dx, dy] of [
      [1, 0, -1],
      [2, 1, 0],
      [4, 0, 1],
      [8, -1, 0],
    ]) {
      const n = fields.get(cellKey(x + dx, y + dy));
      // Bench against bench is the terrace wall, not a fence: drawn on the
      // upper side, where the drop is.
      if (terraced && n && benchParcels.has(n.parcel)) {
        const here = slot(x, y), there = slot(x + dx, y + dy);
        // A lone brink supports one half-step; an actual tier change draws its own face.
        if (
          level[here] === level[there] &&
          benchAt[here] > benchAt[there] &&
          (benchAt[there] === 0 || (betweenSteps[here] && betweenSteps[there]))
        ) riser |= bit;
        // Plots along one bench are parted by a marker stone, not a wall.
        continue;
      }
      if (!n || n.parcel !== cell.parcel) edges |= bit;
      // A terrace has its risers and the brink below it, and no wall round it;
      // nor do lots along a bank.
      if (terraced || bankParcels.has(cell.parcel)) {
        if (!n) open |= bit;
      } else if (!n || groupOf.get(n.parcel) !== group) fence |= bit;
    }
    cell.edges = edges;
    cell.fence = fence;
    if (riser) cell.riser = riser;
    const cut = [3, 6, 12, 9].reduce((m, pair, k) => m | ((open & pair) === pair ? 1 << k : 0), 0);
    if (cut) cell.cut = cut;
    if (["none", "ditch", "baulk"].includes(cell.boundary)) {
      const era = eraEnclosure(setting.year);
      if (era !== "none") cell.enclosure = era;
    }
  }
  // A gap in the fence where the parcel is entered.
  for (const p of parcels)
    for (const [bit, dx, dy] of [
      [4, 0, -1],
      [8, 1, 0],
      [1, 0, 1],
      [2, -1, 0],
    ]) {
      const cell = fields.get(cellKey(p.access.x + dx, p.access.y + dy));
      if (cell && cell.parcel === p.id) cell.fence &= ~bit;
    }
  // A canal reaches the last field in its wedge and no further.
  for (const k of [...canals]) {
    const [x, y] = k.split(",").map(Number);
    const d = cheb({ x, y });
    const farthest = wedge.reduce((m, w) => Math.max(m, w.u), inner);
    if (d > farthest + 1 && !led.has(k)) canals.delete(k);
  }
  // Each farming household takes the fields it can walk to: out of the
  // nearest gate and along the track, not across the town and round the
  // wall. Round by round, so nobody takes a second field before everyone who
  // farms has one.
  const gates = spokes.map((sp) => sp.gate);
  const walk = (home: Point, access: Point) =>
    Math.min(
      ...gates.map(
        (g) =>
          Math.hypot(g.x - home.x, g.y - home.y) +
          Math.abs(g.x - access.x) +
          Math.abs(g.y - access.y),
      ),
      Infinity,
    );
  const workable = parcels.filter(
    (p) => !["pasture", "fallow"].includes(p.crop),
  );
  const rounds = owners.reduce((m, o) => Math.max(m, holding(o)), 0);
  for (let round = 0; round < rounds; round++)
    for (const owner of owners) {
      if (holding(owner) <= round) continue;
      const home = homeOf(owner) ?? c;
      const near = workable
        .filter((p) => !p.owner && walk(home, p.access) < 140)
        .sort((a, b) => walk(home, a.access) - walk(home, b.access));
      // A route search costs more than the whole cut did, so only the
      // closest few are ever put to it.
      for (const p of near.slice(0, 3))
        if (reachable(home, p.access)) {
          p.owner = owner;
          break;
        }
    }
  const sown = new Map<number, CropId>();
  for (const p of parcels) {
    const crop = p.owner && input.grows?.[p.owner];
    if (crop && p.crop !== "pasture" && p.crop !== "fallow") sown.set(p.id, (p.crop = crop));
  }
  for (const parcel of parcels) {
    parcel.stableId ??= `${site.id}-field-${parcel.id}`;
    parcel.baselineYear ??= setting.year;
    parcel.state ??= parcel.crop === "fallow" ? "fallow" : "used";
  }
  // Tenancy down onto the cells, so anything standing on a cell knows whose
  // ground it is without a search through the parcel list.
  const held = new Map(parcels.filter((p) => p.owner).map((p) => [p.id, p.owner!]));
  if (held.size)
    for (const cell of fields.values()) {
      const owner = held.get(cell.parcel);
      if (owner) cell.owner = owner;
      const crop = sown.get(cell.parcel);
      // Rice is sown into flooded basins whatever the land round about grows.
      if (crop) Object.assign(cell, { crop, wet: cell.flood || crops[crop].wet === true });
    }
  return {
    system,
    territory: { center: { ...c }, inner, outer, spokes, slots },
    fields,
    canals,
    canalsDry,
    culverts,
    wells,
    parcels,
  };
}

/** Sprite for a crop's tended plants: the ripe frame of the field art. */
export function cropSprite(crop: CropId): string {
  const kind = crops[crop].kind;
  return kind === "pasture" || kind === "fallow"
    ? "wheat"
    : `crop-${crop}-ripe-0`;
}

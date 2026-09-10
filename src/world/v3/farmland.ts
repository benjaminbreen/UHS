import type { Pack, Point } from "../../core/types";
import { random } from "../../core/random";
import { noise } from "../geography/noise";
import type { Sample } from "./roads";
import { cellKey, type Rect, type Road, type Site } from "./types";
import type {
  Boundary,
  CropId,
  FarmSystem,
} from "../../content/agriculture/types";
import { cropsFor, farmSystem } from "../../content/agriculture";
import { crops } from "../../content/agriculture/crops";

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
  /** Standing water between bunds. */
  wet: boolean;
};
export type Parcel = {
  id: number;
  rect: Rect;
  crop: CropId;
  cells: number;
  /** Where a worker steps off the lane into the parcel. */
  access: Point;
  owner?: string;
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
  /** Irrigation channels: water one cell wide, fed from the river or lake. */
  canals: Set<string>;
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
  /** Ground the plan has already given to something else. */
  taken: (x: number, y: number) => boolean;
  /** Buildings and walls, which a parcel keeps a clear cell away from. */
  solid: (x: number, y: number) => boolean;
  /** Ground inside another settlement's claim. */
  foreign: (x: number, y: number) => boolean;
  /** Most parcels to cut: a town gets a ring or two, a village a handful. */
  cap: number;
  /** Lays a straight earth track from `a` to `b`; returns the cells it took. */
  lane: (a: Point, b: Point, label: string) => Point[] | undefined;
  /** Routes from a track's inner end onto the town's streets. */
  join: (a: Point, label: string) => Point[] | undefined;
  /** Households that farm, nearest parcels first. */
  owners: string[];
  /** Where each farming household lives, so its fields lie out of its own gate. */
  homeOf: (owner: string) => Point | undefined;
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
  const strips = ["strip", "ribbon", "terrace"].includes(system.geometry);
  const wet = system.geometry === "basin";
  const boundaryWidth = system.boundary === "none" ? 0 : 1;
  const irrigated = IRRIGATED.has(system.irrigation);
  const mix = cropsFor(system, setting.climate);
  const pastoral = mix.every((m) => m.id === "pasture" || m.id === "fallow");
  const orchardKinds = mix.filter((m) =>
    ["tree", "vine", "vegetable"].includes(crops[m.id].kind),
  );
  /** Crops in a fixed rotation, each repeated by its share, so successive
   * furlongs alternate the way a three-course rotation does rather than
   * rolling dice per field. */
  const rotation: CropId[] = [];
  for (const m of mix)
    for (let i = 0; i < Math.max(1, Math.round(m.share * 6)); i++)
      rotation.push(m.id);

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
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++)
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
    const gate = at(c, f, edge, 0);
    const joined = join(gate, `spoke-${k}-join`);
    if (joined) remember(joined);
    const points = polyline(
      f,
      jogged(`spoke-${k}`, outer, edge, 0).map(({ a, b }) => ({ u: a, v: b })),
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
  // A trunk along each axis spoke, a lateral along every headland, and a
  // feeder from the nearest open water to the nearest trunk. All straight:
  // a channel is dug by the rod, not wandered.
  const canals = new Set<string>();
  const culverts = new Set<string>();
  const channel = (p: Point) => {
    const k = cellKey(p.x, p.y);
    if (laneCells.has(k)) culverts.add(k);
    else canals.add(k);
  };
  const trunkV = wander + 2;
  if (irrigated)
    for (const k of axisSpokes) {
      const f = FRAMES[k];
      for (let u = inner; u <= outer; u++) {
        const p = at(c, f, u, trunkV);
        if (arable(p.x, p.y) || laneCells.has(cellKey(p.x, p.y))) channel(p);
      }
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
  const alongCells = strips ? along * 2 : along;
  const backCells = strips ? Math.round(back * 1.25) : back;
  const bandDepth = backCells * rows + boundaryWidth * (rows - 1);
  const pitch = bandDepth + 1;
  const crossPitch = alongCells + boundaryWidth;
  const use = (u: number, group: number, band: number, k: number) => {
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
    k: number,
    band: number,
    group: number,
    orchard: boolean,
  ): CropId => {
    if (orchard && orchardKinds.length)
      return orchardKinds[(k + band + group) % orchardKinds.length].id;
    return rotation[(band * 2 + group + k) % rotation.length];
  };
  let nextParcel = 1,
    nextGroup = 1;
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
  while (parcels.length < cap && wedge.some((w) => w.u + bandDepth <= outer)) {
    for (const w of wedge) {
      const { f, k, axis } = w;
      const u = w.u;
      if (u + bandDepth > outer || parcels.length >= cap) continue;
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
        if (laid.length && irrigated && axisSpokes.has(k))
          for (let v = lo; v <= hi; v++) {
            const p = at(c, f, laneU + 1, v);
            if (arable(p.x, p.y) || laneCells.has(cellKey(p.x, p.y)))
              channel(p);
          }
      }
      const orchard = band === 0 && system.orchard > 0;
      let v = -half + 2;
      let index = 0;
      while (v + alongCells <= half - 1 && parcels.length < cap) {
        const groupIndex = strips ? Math.floor(index / 6) : index;
        const groupId = nextGroup + groupIndex;
        const land = use(u, groupIndex, band, k);
        const crop: CropId =
          land === "pasture"
            ? "pasture"
            : land === "fallow"
              ? "fallow"
              : furlongCrop(
                  k,
                  band,
                  groupIndex,
                  orchard && groupIndex % 2 === 0,
                );
        for (let row = 0; row < rows && land !== "none"; row++) {
          const u0 = u + row * (backCells + boundaryWidth);
          const corner = at(c, f, u0, v),
            far = at(c, f, u0 + backCells - 1, v + alongCells - 1);
          const rect = {
            x: Math.min(corner.x, far.x),
            y: Math.min(corner.y, far.y),
            w: Math.abs(far.x - corner.x) + 1,
            h: Math.abs(far.y - corner.y) + 1,
          };
          const mid = { x: rect.x + (rect.w >> 1), y: rect.y + (rect.h >> 1) };
          if (foreign(mid.x, mid.y)) continue;
          if (wet && !nearWater(mid.x, mid.y)) continue;
          if (
            Math.hypot(rect.x - c.x, rect.y - c.y) < edge ||
            Math.hypot(rect.x + rect.w - c.x, rect.y - c.y) < edge ||
            Math.hypot(rect.x - c.x, rect.y + rect.h - c.y) < edge ||
            Math.hypot(rect.x + rect.w - c.x, rect.y + rect.h - c.y) < edge
          )
            continue;
          if (!parcelGround(rect)) continue;
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
                wet: wet && crops[crop].wet === true,
              });
              cells++;
            }
          if (!cells) continue;
          // The worker steps in from the lane on the town side, or from the
          // far side where the near one is wall, water or someone's yard.
          const access = [
            at(c, f, u0 - 1, v + (alongCells >> 1)),
            at(c, f, u0 + backCells, v + (alongCells >> 1)),
            at(c, f, u0 + (backCells >> 1), v - 1),
            at(c, f, u0 + (backCells >> 1), v + alongCells),
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
        v += crossPitch + (strips && index % 6 === 5 ? 1 : 0);
        index++;
      }
      nextGroup += strips ? Math.ceil(index / 6) + 1 : index + 1;
      w.u = uEnd + 1;
      w.band++;
    }
    ring++;
  }

  // --- Feeder -----------------------------------------------------------------
  // From the nearest open water to the nearest trunk, two straight legs.
  if (irrigated && canals.size) {
    let source: Point | undefined,
      best = Infinity;
    for (let y = c.y - outer - 24; y <= c.y + outer + 24; y += 3)
      for (let x = c.x - outer - 24; x <= c.x + outer + 24; x += 3) {
        const f = sample(x, y);
        if (f.water >= 1 || f.kind === "sea") continue;
        const d = Math.hypot(x - c.x, y - c.y);
        if (d > edge + 4 && d < best) {
          best = d;
          source = { x, y };
        }
      }
    if (source) {
      let target: Point | undefined,
        near = Infinity;
      for (const k of canals) {
        const [x, y] = k.split(",").map(Number);
        const d = Math.hypot(x - source.x, y - source.y);
        if (d < near) {
          near = d;
          target = { x, y };
        }
      }
      if (target && near < 90) {
        const legs: Point[] = [];
        const corner = { x: target.x, y: source.y };
        for (const [a, b] of [
          [source, corner],
          [corner, target],
        ] as const) {
          const n = Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y));
          for (let i = 0; i <= n; i++)
            legs.push({
              x: a.x + Math.sign(b.x - a.x) * i,
              y: a.y + Math.sign(b.y - a.y) * i,
            });
        }
        for (const p of legs) {
          const k = cellKey(p.x, p.y);
          if (sample(p.x, p.y).water < 1 || taken(p.x, p.y)) continue;
          fields.delete(k);
          channel(p);
        }
      }
    }
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

  // --- Edges and fences -------------------------------------------------------
  for (const [k, cell] of fields) {
    const [x, y] = k.split(",").map(Number);
    let edges = 0,
      fence = 0;
    const group = groupOf.get(cell.parcel);
    for (const [bit, dx, dy] of [
      [1, 0, -1],
      [2, 1, 0],
      [4, 0, 1],
      [8, -1, 0],
    ]) {
      const n = fields.get(cellKey(x + dx, y + dy));
      if (!n || n.parcel !== cell.parcel) edges |= bit;
      if (!n || groupOf.get(n.parcel) !== group) fence |= bit;
    }
    cell.edges = edges;
    cell.fence = fence;
  }
  // A canal reaches the last field in its wedge and no further.
  for (const k of [...canals]) {
    const [x, y] = k.split(",").map(Number);
    const d = cheb({ x, y });
    const farthest = wedge.reduce((m, w) => Math.max(m, w.u), inner);
    if (d > farthest + 1) canals.delete(k);
  }
  // Each farming household takes the fields it can walk to: out of the
  // nearest gate and along the track, not across the town and round the
  // wall. Three rounds, so nobody gets a second field before everyone has one.
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
  for (let round = 0; round < 3; round++)
    for (const owner of owners) {
      const home = homeOf(owner) ?? c;
      let best: Parcel | undefined,
        cost = Infinity;
      for (const p of workable) {
        if (p.owner) continue;
        const d = walk(home, p.access);
        if (d < cost) {
          cost = d;
          best = p;
        }
      }
      if (best && cost < 140) best.owner = owner;
    }
  return {
    system,
    territory: { center: { ...c }, inner, outer, spokes, slots },
    fields,
    canals,
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

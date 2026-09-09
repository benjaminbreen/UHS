import { random } from "../../core/random";
import type { Point } from "../../core/types";
import type {
  DistrictSpec,
  StreetFurniture,
  UrbanForm,
  UrbanPlan,
} from "../../content/settlements/urban-form/types";
import { urbanFootprint } from "../../content/settlements/scale";
import { line, spanOffsets } from "./roads";
import { cellKey, type Rect } from "./types";

export type Gate = { point: Point; nx: number; ny: number; axis: "x" | "y" };
export type Tier = 0 | 1 | 2;
export type Segment = { a: Point; b: Point; tier: Tier };
export type Block = Rect & {
  /** Subdivision depth; 0 is a whole quarter between arterials. */
  depth: number;
  court: boolean;
  /** Distance from the plaza as a share of the built half-extent. */
  reach: number;
  /** A private lane into the interior, for fabrics with blind alleys. */
  lane?: Segment;
};
/** The defensive circuit, as a ring of cells with the gate openings removed. */
export type Wall = {
  material: "earth" | "masonry";
  rect: Rect;
  /** Cells the circuit stands on, in perimeter order. */
  cells: Point[];
  /** Cells left open for a road, keyed as "x,y". */
  openings: Set<string>;
};
export type Furniture = { kind: StreetFurniture; x: number; y: number };
export type UrbanLayout = {
  gates: Gate[];
  streets: Segment[];
  /** Diagonal avenues, laid as staircases; never part of the block reading. */
  diagonals: Segment[];
  blocks: Block[];
  plaza: Rect;
  /** Further squares at crossings, each painted like the main one. */
  squares: Rect[];
  /** Planted strips beside the arterials. */
  verges: Rect[];
  furniture: Furniture[];
  half: number;
  /** Street widths in cells by tier, after the arterial is narrowed for a
   * small town. */
  tiers: readonly [number, number, number];
  wall?: Wall;
  /** Distance from the centre to the built edge on this bearing, in radians. */
  edge(angle: number): number;
  /** Whether a point lies inside the built edge, less an optional margin. */
  holds(x: number, y: number, margin?: number): boolean;
};

/** Outward normals in a fixed order. Which ones are used depends on the gate
 * count and, for a spine plan, on the spine's own axis. */
const sides: Gate[] = [
  { point: { x: 0, y: 0 }, nx: 1, ny: 0, axis: "x" },
  { point: { x: 0, y: 0 }, nx: -1, ny: 0, axis: "x" },
  { point: { x: 0, y: 0 }, nx: 0, ny: 1, axis: "y" },
  { point: { x: 0, y: 0 }, nx: 0, ny: -1, axis: "y" },
];

const even = (n: number) => Math.round(n / 2) * 2;

/** A circuit belongs to a whole settlement. A large place is planned as several
 * neighbourhoods sharing one identity, and walling each of them would put a
 * rampart between one quarter of a city and the next. */
export const hasCircuit = (form: UrbanForm, radius: number) =>
  form.wall !== "none" && radius >= 30;

/** Where through routes should meet the built edge. Pure in the site's own
 * identity so the regional road layer and the local planner agree without
 * either of them building the other's geometry. */
export function urbanGates(
  siteId: string,
  center: Point,
  radius: number,
  form: UrbanForm,
): Gate[] {
  const half = urbanFootprint(radius, form);
  const spine: "x" | "y" =
    random(siteId, "spine") < 0.5 && form.plan === "linear" ? "y" : "x";
  const order =
    form.plan === "linear"
      ? [...sides].sort(
          (a, b) => Number(a.axis !== spine) - Number(b.axis !== spine),
        )
      : sides;
  return order.slice(0, Math.max(2, Math.min(4, form.gates))).map((s, i) => {
    const drift =
      form.plan === "orthogonal" || form.plan === "linear"
        ? 0
        : even(
            (random(siteId, "gate", i) - 0.5) *
              half *
              0.8 *
              (1 - form.regularity),
          );
    // A walled gate has to stand on the circuit itself, so drifting it along
    // the wall shortens its distance from the centre rather than leaving the ring.
    const along = !hasCircuit(form, radius)
      ? half
      : Math.round(Math.sqrt(Math.max(1, half * half - drift * drift)));
    return {
      nx: s.nx,
      ny: s.ny,
      axis: s.axis,
      point: {
        x: center.x + (s.nx ? s.nx * along : drift),
        y: center.y + (s.ny ? s.ny * along : drift),
      },
    };
  });
}

/** The gate a route coming from `from` should aim at. Distance alone would send
 * a route round a corner, so the outward normal has to agree with the bearing. */
export function nearestGate(gates: Gate[], center: Point, from: Point) {
  const dx = from.x - center.x,
    dy = from.y - center.y,
    length = Math.hypot(dx, dy) || 1;
  return gates
    .map((g) => ({
      g,
      score:
        -((dx / length) * g.nx + (dy / length) * g.ny) * 40 +
        Math.hypot(from.x - g.point.x, from.y - g.point.y) * 0.05,
    }))
    .sort((a, b) => a.score - b.score)[0]?.g;
}

/** Street network and block partition for one settlement.
 *
 * A city is composed from districts: a core around the square and, where the
 * fabric says so, extensions on other sides with their own pattern and module.
 * Gridded districts take streets at their module; grown districts branch
 * lanes off the routes through them until the ground is used. Blocks are then
 * read off the ground between the streets as rectangles, so any mix of the
 * two gives the same kind of parcel to build on. Every street is a straight
 * axis-aligned segment; the only diagonals are the avenues a modern fabric
 * asks for, and they are carried separately. */
export function composeUrban(
  siteId: string,
  center: Point,
  radius: number,
  form: UrbanForm,
  /** World seed. Gates stay keyed on the site alone, so the regional road layer
   * can find them without knowing which world it is in; everything inside the
   * built edge varies with the world. */
  seed: string,
  plazaBias?: Point,
  /** Whether a cell can be built on. Omitted, the boundary is the fabric's own
   * ideal shape; supplied, terrain pulls that shape inward wherever it fails. */
  usable?: (x: number, y: number) => boolean,
  /** How central a cell is, 0 at the edge to 1 at a core. Omitted, distance
   * from the square stands in for it. */
  density?: (x: number, y: number) => number,
  /** Width over height of the built extent, where the place dictates it. */
  aspect?: number,
): UrbanLayout {
  const half = urbanFootprint(radius, form);
  const rand = (...keys: (string | number)[]) =>
    random(seed, siteId, "compose", ...keys);
  const gates = urbanGates(siteId, center, radius, form);

  // Widths are whole cells. A fabric's avenue is for its large cities; a
  // small town of the same fabric gets a three-cell main street.
  const cap = radius < 40 ? 3 : radius < 60 ? 4 : 6;
  const arterial = Math.max(1, Math.min(form.tiers[0], cap)),
    street = Math.max(1, Math.min(form.tiers[1], arterial)),
    lane = Math.max(1, Math.min(form.tiers[2], street));
  const tiers: [number, number, number] = [arterial, street, lane];
  const span = (tier: Tier) => tiers[tier];
  const [loA, hiA] = spanOffsets(arterial);
  const verge = Math.max(0, form.verge ?? 0);
  const grown = (p: UrbanPlan) => p === "organic" || p === "radial";
  /** Ground kept clear beside a street of this tier: a footway, plus the
   * planted verge along an arterial. */
  const margin = (tier: Tier) =>
    tier === 0 ? 2 + verge : tier === 1 && !grown(form.plan) ? 2 : 1;

  // --- Districts -------------------------------------------------------------
  /** `rect` is where the district's own streets go; `shape` is what it adds
   * to the outline, and reaches back to the centre so an extension always
   * joins the core whatever the core's own edge does. */
  type District = {
    spec: DistrictSpec;
    rect: Rect;
    shape: Rect;
    core: boolean;
  };
  const specs: readonly DistrictSpec[] = form.districts?.length
    ? form.districts
    : [{ plan: form.plan, block: form.block, regularity: form.regularity }];
  const core = specs[0];
  const single = specs.length === 1;
  const coreHalf = single ? half : Math.max(14, Math.round(half * 0.6));
  // A grid was laid out as a rectangle, and not a square one.
  const stretch = aspect
    ? Math.max(aspect, 1 / aspect)
    : core.plan === "linear"
      ? 1.75
      : grown(core.plan)
        ? 1
        : 1 + rand("aspect") * 0.34;
  const turned = aspect
    ? aspect < 1
    : core.plan === "linear"
      ? gates[0].axis === "y"
      : rand("turn") < 0.5;
  const coreA = turned ? Math.round(coreHalf / stretch) : coreHalf,
    coreB = turned ? coreHalf : Math.round(coreHalf / stretch);
  const coreRect = {
    x: center.x - coreA,
    y: center.y - coreB,
    w: coreA * 2 + 1,
    h: coreB * 2 + 1,
  };
  const districts: District[] = [
    { spec: core, rect: coreRect, shape: coreRect, core: true },
  ];
  const order = [0, 1, 2, 3].sort((a, b) => rand("side", a) - rand("side", b));
  specs.slice(1, 5).forEach((spec, i) => {
    const s = sides[order[i]];
    const breadth = Math.round(coreHalf * (0.7 + rand("breadth", i) * 0.5));
    const shift = even((rand("shift", i) - 0.5) * coreHalf * 0.4);
    const reach = half - (s.nx ? coreA : coreB);
    if (reach < 12) return;
    const rect = s.nx
      ? {
          x: s.nx > 0 ? center.x + coreA + 1 : center.x - half,
          y: center.y + shift - breadth,
          w: reach,
          h: breadth * 2 + 1,
        }
      : {
          x: center.x + shift - breadth,
          y: s.ny > 0 ? center.y + coreB + 1 : center.y - half,
          w: breadth * 2 + 1,
          h: reach,
        };
    const shape = s.nx
      ? { ...rect, x: s.nx > 0 ? center.x : rect.x, w: reach + coreA + 1 }
      : { ...rect, y: s.ny > 0 ? center.y : rect.y, h: reach + coreB + 1 };
    districts.push({ spec, core: false, rect, shape });
  });
  const inRect = (x: number, y: number, r: Rect) =>
    x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;

  // --- The built edge --------------------------------------------------------
  // The shape a fabric would take on open ground, before terrain has a say. A
  // grown core wanders; three harmonics keep it smooth and closed. Extensions
  // are laid out, so they are rectangles, and the outline is the union.
  const BEARINGS = 72;
  const swing =
    core.plan === "radial" ? 0.1 : 0.14 + 0.12 * (1 - core.regularity);
  const phase = [0, 1, 2].map((k) => rand("shape", k) * Math.PI * 2);
  const blob = (angle: number) =>
    coreHalf *
    (1 +
      swing *
        (0.6 * Math.sin(2 * angle + phase[0]) +
          0.28 * Math.sin(3 * angle + phase[1]) +
          0.16 * Math.sin(5 * angle + phase[2])));
  const insideIdeal = (x: number, y: number) => {
    const dx = x - center.x,
      dy = y - center.y;
    for (const d of districts) {
      if (d.core && grown(d.spec.plan)) {
        if (Math.hypot(dx, dy) <= blob(Math.atan2(dy, dx))) return true;
      } else if (inRect(x, y, d.shape)) return true;
    }
    return false;
  };
  const ideal = (angle: number) => {
    const c = Math.cos(angle),
      s = Math.sin(angle);
    let t = 0;
    while (
      t < half * 1.5 &&
      insideIdeal(center.x + c * (t + 1), center.y + s * (t + 1))
    )
      t += 1;
    return t;
  };
  const bearing = (i: number) =>
    ((i + BEARINGS) % BEARINGS) * ((Math.PI * 2) / BEARINGS);
  // Cast outward on each bearing and stop at the last cell that holds. Terrain
  // decides where a wall can actually stand; the ideal shape only says where it
  // would like to.
  const radii = Array.from({ length: BEARINGS }, (_, i) => {
    const angle = bearing(i);
    const want = ideal(angle);
    if (!usable) return want;
    const floor = half * 0.42;
    let r = want;
    while (
      r > floor &&
      !usable(
        Math.round(center.x + Math.cos(angle) * r),
        Math.round(center.y + Math.sin(angle) * r),
      )
    )
      r -= 1;
    return r;
  });
  // A single refused cell should dent the outline, not gouge it. What gets
  // smoothed is how much the ground took away, not the outline itself:
  // averaging the outline would round the corners off every rectangle.
  const wanted = radii.map((_, i) => ideal(bearing(i)));
  const smoothed = radii.map((_, i) => {
    const trim =
      [-2, -1, 0, 1, 2]
        .map((d) => {
          const j = (i + d + BEARINGS) % BEARINGS;
          return wanted[j] - radii[j];
        })
        .reduce((a, b) => a + b) / 5;
    return Math.max(radii[i], wanted[i] - trim);
  });
  // A wall has to reach its own gates, whatever the bearings either side say.
  for (const gate of gates) {
    const angle = Math.atan2(gate.point.y - center.y, gate.point.x - center.x);
    const reachTo = Math.hypot(
      gate.point.x - center.x,
      gate.point.y - center.y,
    );
    const i = Math.round((angle / (Math.PI * 2)) * BEARINGS);
    for (const d of [-1, 0, 1])
      smoothed[(i + d + BEARINGS) % BEARINGS] = Math.max(
        smoothed[(i + d + BEARINGS) % BEARINGS],
        reachTo,
      );
  }
  const edge = (angle: number) => {
    const t = (angle / (Math.PI * 2)) * BEARINGS;
    const i = Math.floor(t),
      f = t - i;
    const a = smoothed[((i % BEARINGS) + BEARINGS) % BEARINGS],
      b = smoothed[(((i + 1) % BEARINGS) + BEARINGS) % BEARINGS];
    return a + (b - a) * f;
  };
  const holds = (x: number, y: number, margin = 0) => {
    const dx = x - center.x,
      dy = y - center.y;
    return Math.hypot(dx, dy) <= edge(Math.atan2(dy, dx)) - margin;
  };
  const walled = hasCircuit(form, radius);
  const wallMargin = walled ? hiA + 1 : 0;
  /** Pull `v` back along `axis` until it lies inside the built edge. */
  const inside = (v: number, axis: "x" | "y", fixed: number) => {
    const origin = axis === "x" ? center.x : center.y;
    const step = v >= origin ? -1 : 1;
    let out = v;
    while (
      out !== origin &&
      !holds(axis === "x" ? out : fixed, axis === "x" ? fixed : out, wallMargin)
    )
      out += step;
    return out;
  };
  const bounds = {
    x: center.x - half - 2,
    y: center.y - half - 2,
    w: half * 2 + 5,
    h: half * 2 + 5,
  };

  // --- The square ------------------------------------------------------------
  // Placed before the arterials so they can terminate on it. Its scale is read
  // against the radius, not the width: against the width a fifth put a third
  // of the town under one square.
  const size = Math.max(7, even(half * form.plazaScale) + 1);
  if (plazaBias) {
    const length = Math.hypot(plazaBias.x, plazaBias.y) || 1;
    plazaBias = { x: plazaBias.x / length, y: plazaBias.y / length };
  }
  const bias =
    (form.plaza === "waterfront" || form.plaza === "offset") && plazaBias
      ? plazaBias
      : form.plaza === "offset"
        ? (() => {
            const angle = rand("plaza-angle") * Math.PI * 2;
            return { x: Math.cos(angle), y: Math.sin(angle) };
          })()
        : form.plaza === "gate"
          ? { x: gates[0].nx, y: gates[0].ny }
          : { x: 0, y: 0 };
  const offset =
    form.plaza === "crossing"
      ? 0
      : coreHalf *
        (form.plaza === "gate"
          ? 0.72
          : form.plaza === "waterfront"
            ? 0.55
            : 0.3);
  const focus = {
    x: center.x + even(bias.x * offset),
    y: center.y + even(bias.y * offset),
  };
  function squareUsable(at: Point, size: number) {
    for (let y = at.y - (size >> 1) - 2; y <= at.y + (size >> 1) + 2; y++)
      for (let x = at.x - (size >> 1) - 2; x <= at.x + (size >> 1) + 2; x++)
        if (!usable!(x, y)) return false;
    return true;
  }
  // A square pulled toward water or a bridge stops short of the bank.
  if (usable)
    while (
      (focus.x !== center.x || focus.y !== center.y) &&
      !squareUsable(focus, size)
    ) {
      focus.x -= Math.sign(focus.x - center.x) * 2;
      focus.y -= Math.sign(focus.y - center.y) * 2;
    }
  const plaza = {
    x: focus.x - (size >> 1),
    y: focus.y - (size >> 1),
    w: size,
    h: size,
  };

  // --- Arterials -------------------------------------------------------------
  // One axis-aligned run per gate, bent where the fabric is irregular so the
  // network does not collapse into a single central crossing.
  const streets: Segment[] = [];
  const cuts = { x: new Set<number>(), y: new Set<number>() };
  for (const [i, gate] of gates.entries()) {
    const along = gate.axis;
    const across = along === "x" ? "y" : "x";
    const target = along === "x" ? focus.y : focus.x;
    const startAcross = along === "x" ? gate.point.y : gate.point.x;
    const legs = grown(core.plan)
      ? 2 + Math.round(rand("bend-count", i))
      : startAcross === target
        ? 0
        : 1;
    let cursor = gate.point;
    for (let leg = 0; leg < legs; leg++) {
      const t = (leg + 1) / (legs + 1);
      const turn =
        along === "x"
          ? center.x + Math.round((gate.point.x - center.x) * (1 - t))
          : center.y + Math.round((gate.point.y - center.y) * (1 - t));
      const next =
        along === "x" ? { x: turn, y: cursor.y } : { x: cursor.x, y: turn };
      streets.push({ a: cursor, b: next, tier: 0 });
      cuts[along].add(turn);
      const bendTarget =
        grown(core.plan) && leg < legs - 1
          ? Math.round(
              startAcross +
                (target - startAcross) * t +
                even(
                  (rand("bend", i, leg) - 0.5) *
                    coreHalf *
                    0.4 *
                    (1 - core.regularity),
                ),
            )
          : target;
      const turnedTo =
        along === "x" ? { x: turn, y: bendTarget } : { x: bendTarget, y: turn };
      streets.push({ a: next, b: turnedTo, tier: 0 });
      cuts[across].add(bendTarget);
      cursor = turnedTo;
    }
    // A public square interrupts its arterials rather than being cut by them,
    // which is what leaves all four of its sides available to build on.
    const lateral = along === "x" ? cursor.y : cursor.x;
    const facing =
      along === "x"
        ? lateral >= plaza.y - 1 && lateral <= plaza.y + plaza.h
        : lateral >= plaza.x - 1 && lateral <= plaza.x + plaza.w;
    const stop = facing
      ? along === "x"
        ? gate.nx > 0
          ? plaza.x + plaza.w
          : plaza.x - 1
        : gate.ny > 0
          ? plaza.y + plaza.h
          : plaza.y - 1
      : along === "x"
        ? focus.x
        : focus.y;
    const end =
      along === "x" ? { x: stop, y: cursor.y } : { x: cursor.x, y: stop };
    streets.push({ a: cursor, b: end, tier: 0 });
    cuts[across].add(lateral);
  }
  // Further arterials so a quarter is never many blocks deep. How many follows
  // from the block module, not from the settlement's size alone.
  for (const axis of ["x", "y"] as const) {
    if (core.plan === "linear" && axis !== gates[0].axis) continue;
    const module = (axis === "x" ? core.block[0] : core.block[1]) + arterial;
    const count = Math.min(4, Math.floor((coreHalf * 2) / (module * 2.5)));
    for (let i = 1; i <= count; i++) {
      const at =
        (axis === "x" ? center.x : center.y) +
        even(
          -coreHalf +
            (coreHalf * 2 * i) / (count + 1) +
            (rand("avenue", axis, i) - 0.5) * module * (1 - core.regularity),
        );
      if ([...cuts[axis]].some((v) => Math.abs(v - at) < module * 0.7))
        continue;
      cuts[axis].add(at);
      // A circuit is only breached at its gates, so an avenue stops short of it.
      const lo = inside(
        (axis === "x" ? center.y : center.x) - half,
        axis === "x" ? "y" : "x",
        at,
      );
      const hi = inside(
        (axis === "x" ? center.y : center.x) + half,
        axis === "x" ? "y" : "x",
        at,
      );
      if (hi - lo < 12) continue;
      streets.push(
        axis === "x"
          ? { a: { x: at, y: lo }, b: { x: at, y: hi }, tier: 0 }
          : { a: { x: lo, y: at }, b: { x: hi, y: at }, tier: 0 },
      );
    }
  }

  // --- Street cells ----------------------------------------------------------
  const axisOf = (s: Segment) => (s.a.y === s.b.y ? "x" : "y");
  const along = (s: Segment, p: Point) => (axisOf(s) === "x" ? p.x : p.y);
  const across = (s: Segment) => (axisOf(s) === "x" ? s.a.y : s.a.x);
  const lo = (s: Segment) => Math.min(along(s, s.a), along(s, s.b));
  const hi = (s: Segment) => Math.max(along(s, s.a), along(s, s.b));
  const point = (s: Segment, v: number) =>
    axisOf(s) === "x" ? { x: v, y: across(s) } : { x: across(s), y: v };
  /** Tier of the street whose centreline runs through a cell. */
  const lines = new Map<string, Tier>();
  const mark = (s: Segment) => {
    for (let v = lo(s); v <= hi(s); v++) {
      const p = point(s, v),
        k = cellKey(p.x, p.y);
      if ((lines.get(k) ?? 9) > s.tier) lines.set(k, s.tier);
    }
  };
  for (const s of streets) mark(s);
  const push = (s: Segment) => {
    streets.push(s);
    mark(s);
  };
  const overlaps = (s: Segment, r: Rect) => {
    const level = across(s);
    return axisOf(s) === "x"
      ? level >= r.y && level < r.y + r.h && hi(s) >= r.x && lo(s) < r.x + r.w
      : level >= r.x && level < r.x + r.w && hi(s) >= r.y && lo(s) < r.y + r.h;
  };

  // --- District streets ------------------------------------------------------
  for (const [i, d] of districts.entries())
    if (grown(d.spec.plan)) grow(d, i);
    else grid(d, i);

  /** Lines between the arterials at the module: each gap between two
   * anchors (an arterial, or the district's edge) is divided evenly, jittered
   * as the fabric is irregular. A spine plan takes its cross streets as lanes. */
  function grid(d: District, i: number) {
    const [bw, bh] = d.spec.block;
    for (const axis of ["x", "y"] as const) {
      const tier: Tier =
        d.spec.plan === "linear" && axis !== gates[0].axis ? 2 : 1;
      const module = (axis === "x" ? bw : bh) + span(tier) + margin(tier) * 2;
      const lo = axis === "x" ? d.rect.x : d.rect.y,
        hi = lo + (axis === "x" ? d.rect.w : d.rect.h) - 1;
      const from = axis === "x" ? d.rect.y : d.rect.x,
        to = from + (axis === "x" ? d.rect.h : d.rect.w) - 1;
      const anchors = [
        lo - margin(1),
        hi + margin(1),
        ...streets
          .filter(
            (s) => axisOf(s) === axis && s.tier === 0 && overlaps(s, d.rect),
          )
          .map(across),
      ].sort((a, b) => a - b);
      for (let k = 1; k < anchors.length; k++) {
        const a = anchors[k - 1],
          b = anchors[k],
          n = Math.round((b - a) / module);
        if (n < 2) continue;
        for (let j = 1; j < n; j++) {
          const v = Math.round(
            a +
              ((b - a) * j) / n +
              (rand("jitter", i, axis, a, j) - 0.5) *
                (1 - d.spec.regularity) *
                module *
                0.4,
          );
          if (v - lo < 4 || hi - v < 4) continue;
          const p = inside(from, axis === "x" ? "y" : "x", v),
            q = inside(to, axis === "x" ? "y" : "x", v);
          if (q - p < 8) continue;
          push(
            axis === "x"
              ? { a: { x: v, y: p }, b: { x: v, y: q }, tier }
              : { a: { x: p, y: v }, b: { x: q, y: v }, tier },
          );
        }
      }
    }
  }

  /** Lanes branch off the routes through a district and off each other,
   * spaced by the block module, until the ground is used. A branch ends
   * where it meets another street, at the edge, or blind. Where the fabric
   * is irregular a lane kinks sideways as it goes, so nothing lines up. */
  function grow(d: District, i: number) {
    const [bw, bh] = d.spec.block;
    const reg = d.spec.regularity;
    const want = Math.round(((d.rect.w * d.rect.h) / (bw * bh)) * 1.3);
    let made = 0;
    for (let n = 0; n < want * 10 && made < want; n++) {
      const pool = streets.filter(
        (s) => overlaps(s, d.rect) && hi(s) - lo(s) >= 8,
      );
      if (!pool.length) break;
      const parent = pool[Math.floor(rand("parent", i, n) * pool.length)];
      const axis = axisOf(parent);
      const other = axis === "x" ? "y" : "x";
      const pos =
        lo(parent) +
        4 +
        Math.floor(rand("pos", i, n) * (hi(parent) - lo(parent) - 8));
      const dir: -1 | 1 = rand("dir", i, n) < 0.5 ? -1 : 1;
      const tier: Tier = parent.tier === 0 ? 1 : 2;
      // Pitch along the parent between branches of this orientation.
      const pitch = (axis === "x" ? bw : bh) + span(tier) + margin(tier) * 2;
      const [plo, phi] = spanOffsets(span(parent.tier));
      const start = across(parent) + (dir > 0 ? phi + 1 : -plo - 1);
      const at = (u: number, v: number) =>
        other === "x" ? { x: v, y: u } : { x: u, y: v }; // u along parent axis? no: u is the parent-axis coordinate, v the branch coordinate
      // A branch too near a parallel one leaves no block between them.
      const gap = Math.max(8, Math.floor(pitch * 0.6));
      const crowdedAt = (u: number, v: number) => {
        for (let k = 1; k <= gap; k++)
          for (const off of [-k, k]) {
            const p = at(u + off, v);
            if (lines.has(cellKey(p.x, p.y))) return true;
          }
        return false;
      };
      if (crowdedAt(pos, start + dir * 3)) continue;
      const target = Math.round(
        (other === "x" ? bw : bh) * (0.8 + rand("len", i, n) * 0.9),
      );
      let u = pos,
        v = start,
        len = 0,
        ended = false;
      const pieces: Point[] = [at(u, v)];
      let done = false;
      while (!done) {
        const q = at(u, v + dir);
        if (!holds(q.x, q.y, wallMargin + 1) || !inRect(q.x, q.y, d.rect))
          break;
        const k = cellKey(q.x, q.y);
        if (lines.has(k)) {
          pieces.push(q);
          ended = true;
          break;
        }
        // Beside another street: join it rather than run alongside.
        const side = [at(u - 1, v + dir), at(u + 1, v + dir)];
        if (side.some((p) => lines.has(cellKey(p.x, p.y)))) {
          pieces.push(q);
          ended = true;
          break;
        }
        v += dir;
        len++;
        // Closing on a parallel street: stop here rather than run beside it.
        if (len >= 4 && crowdedAt(u, v + dir * 2)) {
          pieces.push(at(u, v));
          ended = true;
          break;
        }
        if (len >= target) {
          const blind =
            rand("blind", i, n) < form.deadEnds || len >= target * 2;
          if (blind) {
            pieces.push(at(u, v));
            ended = true;
            done = true;
            break;
          }
        }
        if (
          reg < 0.85 &&
          len % 6 === 0 &&
          rand("kink", i, n, len) < (1 - reg) * 0.7
        ) {
          const shift = rand("kink-side", i, n, len) < 0.5 ? -1 : 1;
          const p = at(u + shift, v);
          if (
            !lines.has(cellKey(p.x, p.y)) &&
            !lines.has(
              cellKey(at(u + shift, v + dir).x, at(u + shift, v + dir).y),
            )
          ) {
            pieces.push(at(u, v), p);
            u += shift;
          }
        }
      }
      if (!ended) pieces.push(at(u, v));
      if (len < 6) continue;
      let prev = pieces[0];
      for (const p of pieces.slice(1)) {
        if (p.x !== prev.x || p.y !== prev.y) push({ a: prev, b: p, tier });
        prev = p;
      }
      made++;
    }
  }

  // --- Further squares and diagonals ----------------------------------------
  const squares: Rect[] = [];
  if (form.squares) {
    const size2 = Math.max(7, even(size * 0.6) + 1);
    const crossings: Point[] = [];
    for (const s of streets)
      if (s.tier === 0)
        for (const o of streets) {
          if (o === s || axisOf(o) === axisOf(s) || o.tier > 1) continue;
          const p =
            axisOf(s) === "x"
              ? { x: across(o), y: across(s) }
              : { x: across(s), y: across(o) };
          if (
            along(s, p) < lo(s) ||
            along(s, p) > hi(s) ||
            along(o, p) < lo(o) ||
            along(o, p) > hi(o)
          )
            continue;
          crossings.push(p);
        }
    const scored = crossings
      .map((p) => ({ p, d: Math.hypot(p.x - focus.x, p.y - focus.y) }))
      .filter(({ d }) => d > half * 0.4)
      .sort(
        (a, b) =>
          b.d +
          rand("square", a.p.x, a.p.y) * 10 -
          (a.d + rand("square", b.p.x, b.p.y) * 10),
      );
    for (const { p } of scored) {
      if (squares.length >= form.squares) break;
      const r = {
        x: p.x - (size2 >> 1),
        y: p.y - (size2 >> 1),
        w: size2,
        h: size2,
      };
      if (squares.some((q) => Math.hypot(q.x - r.x, q.y - r.y) < size2 * 2))
        continue;
      let ok = true;
      for (let y = r.y - 2; y < r.y + r.h + 2 && ok; y++)
        for (let x = r.x - 2; x < r.x + r.w + 2 && ok; x++)
          ok = holds(x, y, wallMargin + 1) && (!usable || usable(x, y));
      if (!ok) continue;
      squares.push(r);
    }
    // A street opens onto a square rather than crossing it.
    for (const r of squares) {
      const cut: Segment[] = [];
      for (const s of streets.splice(0)) {
        const level = across(s);
        const [c0, c1, d0, d1] =
          axisOf(s) === "x"
            ? [r.y - 1, r.y + r.h, r.x - 1, r.x + r.w]
            : [r.x - 1, r.x + r.w, r.y - 1, r.y + r.h];
        if (level < c0 || level > c1 || hi(s) < d0 || lo(s) > d1) {
          cut.push(s);
          continue;
        }
        if (lo(s) < d0)
          cut.push({ a: point(s, lo(s)), b: point(s, d0), tier: s.tier });
        if (hi(s) > d1)
          cut.push({ a: point(s, d1), b: point(s, hi(s)), tier: s.tier });
      }
      streets.push(...cut);
    }
    lines.clear();
    for (const s of streets) mark(s);
  }
  const diagonals: Segment[] = [];
  if (form.diagonals) {
    const corners = [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
    ].sort((a, b) => rand("diag", a[0], a[1]) - rand("diag", b[0], b[1]));
    for (const [sx, sy] of corners.slice(0, form.diagonals)) {
      const a = {
        x: sx < 0 ? plaza.x - 1 : plaza.x + plaza.w,
        y: sy < 0 ? plaza.y - 1 : plaza.y + plaza.h,
      };
      let b = a;
      while (holds(b.x + sx, b.y + sy, wallMargin + 1))
        b = { x: b.x + sx, y: b.y + sy };
      if (Math.abs(b.x - a.x) < 12) continue;
      diagonals.push({ a, b, tier: 0 });
    }
  }

  // --- Blocks read off the ground -------------------------------------------
  const W = bounds.w,
    H = bounds.h;
  const open = new Uint8Array(W * H);
  const idx = (x: number, y: number) => (y - bounds.y) * W + (x - bounds.x);
  const inBounds = (x: number, y: number) =>
    x >= bounds.x && y >= bounds.y && x < bounds.x + W && y < bounds.y + H;
  const clear = (x: number, y: number) => {
    if (inBounds(x, y)) open[idx(x, y)] = 0;
  };
  const clearAround = (x: number, y: number, m: number) => {
    for (let dy = -m; dy <= m; dy++)
      for (let dx = -m; dx <= m; dx++) clear(x + dx, y + dy);
  };
  const clearRect = (r: Rect, m: number) => {
    for (let y = r.y - m; y < r.y + r.h + m; y++)
      for (let x = r.x - m; x < r.x + r.w + m; x++) clear(x, y);
  };
  function rasterize() {
    for (let y = bounds.y; y < bounds.y + H; y++)
      for (let x = bounds.x; x < bounds.x + W; x++)
        open[idx(x, y)] =
          holds(x, y, wallMargin + 1) && (!usable || usable(x, y)) ? 1 : 0;
    for (const s of streets) {
      const [slo, shi] = spanOffsets(span(s.tier)),
        m = margin(s.tier);
      for (let v = lo(s); v <= hi(s); v++) {
        const p = point(s, v);
        for (let dy = -slo - m; dy <= shi + m; dy++)
          for (let dx = -slo - m; dx <= shi + m; dx++)
            clear(p.x + dx, p.y + dy);
      }
    }
    for (const s of diagonals)
      for (const p of line(s.a, s.b)) clearAround(p.x, p.y, hiA + 2);
    clearRect(plaza, Math.max(loA, hiA) + 1);
    for (const r of squares) clearRect(r, Math.max(loA, hiA) + 1);
  }
  /** The largest open rectangle at least 8 cells each way, by the histogram
   * method over the open grid. */
  function largest(): Rect | undefined {
    const heights = new Int16Array(W);
    let best: Rect | undefined,
      bestArea = 0;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++)
        heights[x] = open[y * W + x] ? heights[x] + 1 : 0;
      const stack: number[] = [];
      for (let x = 0; x <= W; x++) {
        const h = x < W ? heights[x] : 0;
        while (stack.length && heights[stack[stack.length - 1]] >= h) {
          const top = stack.pop()!;
          const height = heights[top];
          const left = stack.length ? stack[stack.length - 1] + 1 : 0;
          const width = x - left;
          if (height >= 8 && width >= 8 && width * height > bestArea) {
            bestArea = width * height;
            best = {
              x: bounds.x + left,
              y: bounds.y + y - height + 1,
              w: width,
              h: height,
            };
          }
        }
        stack.push(x);
      }
    }
    return best;
  }
  let blocks: Block[] = [];
  function readBlocks() {
    rasterize();
    blocks = [];
    for (;;) {
      const r = largest();
      if (!r) break;
      clearRect(r, 0);
      blocks.push({
        ...r,
        depth: 0,
        court: false,
        reach: density
          ? 1 - density(r.x + r.w / 2, r.y + r.h / 2)
          : Math.max(
              Math.abs(r.x + r.w / 2 - focus.x),
              Math.abs(r.y + r.h / 2 - focus.y),
            ) / half,
      });
    }
  }
  readBlocks();
  // A block left far over its district's module gets a lane through it and the
  // ground is read again; a grown district in particular leaves such gaps.
  for (let pass = 0; pass < 3; pass++) {
    let split = 0;
    for (const b of blocks) {
      const d =
        districts.find((d) =>
          inRect(b.x + (b.w >> 1), b.y + (b.h >> 1), d.rect),
        ) ?? districts[0];
      const [bw, bh] = d.spec.block;
      const wide = b.w >= bw * 1.5 && b.w >= 16,
        tall = b.h >= bh * 1.5 && b.h >= 16;
      if (!wide && !tall) continue;
      const tier: Tier = 2;
      const m = margin(tier);
      if (wide && (b.w / bw >= b.h / bh || !tall)) {
        const x =
          b.x +
          (b.w >> 1) +
          Math.round(
            (rand("split", b.x, b.y) - 0.5) *
              (1 - d.spec.regularity) *
              b.w *
              0.4,
          );
        push({ a: { x, y: b.y - m - 1 }, b: { x, y: b.y + b.h + m }, tier });
      } else {
        const y =
          b.y +
          (b.h >> 1) +
          Math.round(
            (rand("split", b.x, b.y) - 0.5) *
              (1 - d.spec.regularity) *
              b.h *
              0.4,
          );
        push({ a: { x: b.x - m - 1, y }, b: { x: b.x + b.w + m, y }, tier });
      }
      split++;
    }
    if (!split) break;
    readBlocks();
  }
  tidy();
  readBlocks();
  for (const b of blocks) {
    const key = `${b.x},${b.y}`;
    b.court = b.w >= 13 && b.h >= 11 && rand(key, "court") < form.courts;
    // A blind alley is the only way into a courted compound.
    if (b.court && rand(key, "dead") < form.deadEnds) {
      const mid = b.x + (b.w >> 1);
      b.lane = {
        a: { x: mid, y: b.y + b.h + 2 },
        b: { x: mid, y: b.y + b.h - 3 },
        tier: 2,
      };
    }
  }

  // --- Verges and furniture --------------------------------------------------
  const verges: Rect[] = [];
  const furniture: Furniture[] = [];
  const wants = (k: StreetFurniture) => !!form.furniture?.includes(k);
  const junctionNear = (x: number, y: number, r: number) => {
    for (let dy = -r; dy <= r; dy++)
      for (let dx = -r; dx <= r; dx++)
        if (lines.has(cellKey(x + dx, y + dy))) return true;
    return false;
  };
  if (verge)
    for (const s of streets) {
      if (s.tier !== 0) continue;
      const [slo, shi] = spanOffsets(arterial);
      for (const side of [-1, 1] as const) {
        const off = side < 0 ? -slo - verge : shi + 1;
        const r =
          axisOf(s) === "x"
            ? { x: lo(s), y: across(s) + off, w: hi(s) - lo(s) + 1, h: verge }
            : { x: across(s) + off, y: lo(s), w: verge, h: hi(s) - lo(s) + 1 };
        verges.push(r);
        if (!wants("tree")) continue;
        const phase = 2 + Math.floor(rand("trees", s.a.x, s.a.y, side) * 4);
        for (let v = lo(s) + phase; v <= hi(s) - 2; v += 6) {
          const p = axisOf(s) === "x" ? { x: v, y: r.y } : { x: r.x, y: v };
          // Not at a crossing, where the perpendicular street takes the cell.
          if (
            junctionNear(p.x, p.y, verge + 1) &&
            lines.get(
              cellKey(
                ...((axisOf(s) === "x" ? [v, across(s)] : [across(s), v]) as [
                  number,
                  number,
                ]),
              ),
            ) === undefined
          )
            continue;
          if (
            streets.some(
              (o) =>
                o !== s &&
                axisOf(o) !== axisOf(s) &&
                Math.abs(across(o) - v) <= hiA + 1 &&
                along(o, p) >= lo(o) - 2 &&
                along(o, p) <= hi(o) + 2,
            )
          )
            continue;
          if (holds(p.x, p.y, 1))
            furniture.push({ kind: "tree", x: p.x, y: p.y });
        }
      }
    }
  if (wants("lamp")) {
    const lampAt = (x: number, y: number) => {
      if (!holds(x, y, 1) || lines.has(cellKey(x, y))) return;
      if (
        furniture.some((f) => Math.abs(f.x - x) <= 1 && Math.abs(f.y - y) <= 1)
      )
        return;
      furniture.push({ kind: "lamp", x, y });
    };
    for (const r of [plaza, ...squares])
      for (const [x, y] of [
        [r.x - 1, r.y - 1],
        [r.x + r.w, r.y - 1],
        [r.x - 1, r.y + r.h],
        [r.x + r.w, r.y + r.h],
      ])
        lampAt(x, y);
    for (const b of blocks) {
      // Corners of blocks that front an arterial, on the footway.
      const fronts = streets.some(
        (s) =>
          s.tier === 0 &&
          (axisOf(s) === "x"
            ? (Math.abs(across(s) - (b.y - 1)) <= hiA + margin(0) + 1 ||
                Math.abs(across(s) - (b.y + b.h)) <= hiA + margin(0) + 1) &&
              hi(s) >= b.x &&
              lo(s) <= b.x + b.w
            : (Math.abs(across(s) - (b.x - 1)) <= hiA + margin(0) + 1 ||
                Math.abs(across(s) - (b.x + b.w)) <= hiA + margin(0) + 1) &&
              hi(s) >= b.y &&
              lo(s) <= b.y + b.h),
      );
      if (!fronts) continue;
      lampAt(b.x - 1, b.y - 1);
      lampAt(b.x + b.w, b.y + b.h);
    }
  }

  return {
    gates,
    streets,
    diagonals,
    blocks,
    plaza,
    squares,
    verges,
    furniture,
    half,
    tiers,
    edge,
    holds,
    wall: circuit(),
  };

  /** No street ends in the open. Every end is carried on to the next street
   * it can reach, the square or the built edge; an interior street is cut back
   * to the blocks it serves, and dropped if it serves none. */
  function tidy() {
    const tol = hiA + 1;
    const frontTol = hiA + margin(0) + 1;
    const px = plaza.x - 1,
      py = plaza.y - 1,
      qx = plaza.x + plaza.w,
      qy = plaza.y + plaza.h;
    const edges: Segment[] = [plaza, ...squares].flatMap((r) => {
      const px = r.x - 1,
        py = r.y - 1,
        qx = r.x + r.w,
        qy = r.y + r.h;
      return [
        { a: { x: px, y: py }, b: { x: qx, y: py }, tier: 0 as Tier },
        { a: { x: px, y: qy }, b: { x: qx, y: qy }, tier: 0 as Tier },
        { a: { x: px, y: py }, b: { x: px, y: qy }, tier: 0 as Tier },
        { a: { x: qx, y: py }, b: { x: qx, y: qy }, tier: 0 as Tier },
      ];
    });
    (void px, py, qx, qy);
    const all = [...streets, ...edges];
    /** Positions along the whole line of `s` where another street or the
     * square crosses or touches it, with how far that street's own cells
     * reach either side of the position. */
    type Crossing = { at: number; reach: number };
    const crossings = (s: Segment) => {
      const out: Crossing[] = [];
      const level = across(s);
      for (const o of all) {
        if (o === s) continue;
        if (axisOf(o) === axisOf(s)) {
          if (Math.abs(across(o) - level) > tol) continue;
          out.push({ at: lo(o), reach: 1 }, { at: hi(o), reach: 1 });
          continue;
        }
        if (level < lo(o) - tol || level > hi(o) + tol) continue;
        const [olo, ohi] = spanOffsets(span(o.tier));
        out.push({ at: across(o), reach: Math.max(olo, ohi) + 1 });
      }
      return out;
    };
    /** Extents along `s` of the blocks that front onto it. */
    const frontages = (s: Segment) => {
      const out: number[] = [];
      const level = across(s);
      for (const b of blocks) {
        const [b0, b1, c0, c1] =
          axisOf(s) === "x"
            ? [b.x - 1, b.x + b.w, b.y - 1, b.y + b.h]
            : [b.y - 1, b.y + b.h, b.x - 1, b.x + b.w];
        if (Math.abs(level - c0) > frontTol && Math.abs(level - c1) > frontTol)
          continue;
        if (b1 < lo(s) || b0 > hi(s)) continue;
        out.push(b0, b1);
      }
      return out;
    };
    const insideAt = (s: Segment, v: number) => {
      const p = point(s, v);
      return holds(p.x, p.y, wallMargin + 1);
    };
    /** Carry an end outward to the nearest crossing it can reach on built
     * ground. An arterial with nothing to meet runs on to the edge. */
    const met = (xs: Crossing[], v: number) =>
      xs.some((c) => Math.abs(c.at - v) <= c.reach);
    const carry = (s: Segment, end: number, dir: -1 | 1, xs: Crossing[]) => {
      if (met(xs, end)) return end;
      const ahead = xs
        .filter((c) => (c.at - end) * dir > 0)
        .sort((a, b) => Math.abs(a.at - end) - Math.abs(b.at - end));
      for (const { at } of ahead) {
        let ok = true;
        for (let u = end; u !== at && ok; u += dir) ok = insideAt(s, u + dir);
        if (ok) return at;
        break;
      }
      if (s.tier !== 0) return end;
      while (insideAt(s, end + dir)) end += dir;
      return end;
    };
    const next: Segment[] = [];
    for (const s of streets) {
      const xs = crossings(s);
      let from = lo(s),
        to = hi(s);
      if (s.tier !== 0) {
        // A lane joining two streets is kept whole: a kinked lane is a chain
        // of short pieces, and a lane between gardens still leads somewhere.
        const through = met(xs, from) && met(xs, to);
        const fronts = frontages(s);
        if (!fronts.length && !through) continue;
        if (fronts.length && !through) {
          from = Math.max(from, Math.min(...fronts));
          to = Math.min(to, Math.max(...fronts));
          if (to - from < 3) continue;
        }
      }
      if (insideAt(s, from)) from = carry(s, from, -1, xs);
      if (insideAt(s, to)) to = carry(s, to, 1, xs);
      next.push({ a: point(s, from), b: point(s, to), tier: s.tier });
    }
    // Two lanes side by side are one lane: the later, narrower one goes.
    const kept: Segment[] = [];
    for (const s of next) {
      const twin = kept.some(
        (o) =>
          axisOf(o) === axisOf(s) &&
          o.tier <= s.tier &&
          Math.abs(across(o) - across(s)) <= 2 &&
          Math.min(hi(o), hi(s)) - Math.max(lo(o), lo(s)) >
            (hi(s) - lo(s)) * 0.6,
      );
      if (!twin || s.tier === 0) kept.push(s);
    }
    streets.length = 0;
    lines.clear();
    for (const s of kept) push(s);
  }

  /** The circuit follows the built edge, which is the fabric's own outline
   * pulled in wherever the ground refused it. Consecutive boundary points are
   * joined with cardinal steps, so the ring is closed and cannot be walked
   * through diagonally. Each gate is opened wide enough for its arterial. */
  function circuit(): Wall | undefined {
    if (!walled || form.wall === "none") return;
    const openings = new Set<string>();
    for (const gate of gates)
      for (let d = -loA - 1; d <= hiA + 1; d++)
        openings.add(
          gate.axis === "x"
            ? cellKey(gate.point.x, gate.point.y + d)
            : cellKey(gate.point.x + d, gate.point.y),
        );
    const at = (i: number) => {
      const angle = bearing(i);
      const r = smoothed[((i % BEARINGS) + BEARINGS) % BEARINGS];
      return {
        x: Math.round(center.x + Math.cos(angle) * r),
        y: Math.round(center.y + Math.sin(angle) * r),
      };
    };
    const seen = new Set<string>();
    const cells: Point[] = [];
    let lo = { x: Infinity, y: Infinity },
      hi = { x: -Infinity, y: -Infinity };
    for (let i = 0; i < BEARINGS; i++)
      for (const q of line(at(i), at(i + 1))) {
        const key = cellKey(q.x, q.y);
        if (seen.has(key)) continue;
        seen.add(key);
        lo = { x: Math.min(lo.x, q.x), y: Math.min(lo.y, q.y) };
        hi = { x: Math.max(hi.x, q.x), y: Math.max(hi.y, q.y) };
        if (!openings.has(key)) cells.push(q);
      }
    if (!cells.length) return;
    return {
      material: form.wall,
      rect: { ...lo, w: hi.x - lo.x + 1, h: hi.y - lo.y + 1 },
      cells,
      openings,
    };
  }
}

/** Site radius at which this fabric offers about `target` street-facing
 * parcels, found by composing it on open ground. The fixed costs of arterials,
 * square and insets make the count far from proportional to area at small
 * extents, so no closed form is trusted. */
export function urbanRadiusFor(
  target: number,
  form: UrbanForm,
  siteId: string,
  seed: string,
): number {
  const offered = (r: number) => {
    const layout = composeUrban(siteId, { x: 0, y: 0 }, r, form, seed);
    let slots = 0;
    for (const b of layout.blocks)
      slots += Math.floor(b.w / 8) * Math.max(1, Math.floor((b.h + 1) / 7));
    // Ground and the circuit refuse a share of what open ground offers.
    return slots * 0.7;
  };
  let lo = 30,
    hi = 140;
  while (hi - lo > 2) {
    const mid = Math.round((lo + hi) / 2);
    if (offered(mid) >= target) hi = mid;
    else lo = mid;
  }
  return hi;
}

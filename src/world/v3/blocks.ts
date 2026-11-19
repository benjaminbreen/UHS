import { random } from "../../core/random";
import type { Point, TownGateway } from "../../core/types";
import type {
  CircuitMaterial,
  DistrictSpec,
  StreetFurniture,
  UrbanForm,
  UrbanPlan,
} from "../../content/settlements/urban-form/types";
import type { PrecinctSiting } from "../../content/settlements/precincts";
import { urbanFootprint } from "../../content/settlements/scale";
import { directLine, distanceToSegment, line, simplifyPath, spanOffsets } from "./roads";
import { cellKey, type Rect } from "./types";
import { connectStreetComponents, streetComponents } from "./street-network";

export type Gate = { point: Point; nx: number; ny: number; axis: "x" | "y" };
export type PrecinctRequest = PrecinctSiting & { sizes: readonly (readonly [number, number])[]; near?: Point; divertLane?: boolean };
export type PrecinctGround = Rect & { entry: Point; street: Point; approach: Rect };
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
  /** Index of the district it lies in; 0 is the core, later ones were laid
   * out later. */
  district: number;
  /** One row of houses facing the street along its south side. */
  row?: true;
  /** A row on an alley: mews, workshops and back houses. */
  low?: true;
  /** Ground among the rows kept clear of houses: the station's block against
   * the railway, and the yards either side of it. */
  open?: true;
};
/** The defensive circuit, as a ring of cells with the gate openings removed. */
export type Wall = {
  material: CircuitMaterial;
  precinct?: string;
  rect: Rect;
  /** Cells the circuit stands on, in perimeter order. */
  cells: Point[];
  /** Cells left open for a road, keyed as "x,y". */
  openings: Set<string>;
  /** The road openings, ordered across the road from north or west. */
  gates: TownGateway[];
  /** Every cell of the ring, gates included, in perimeter order. */
  ring: Point[];
  bends: Point[];
};
export function wardCircuit(ground: PrecinctGround, material: CircuitMaterial, precinct: string, offset: boolean, moat: boolean): Wall {
  const outward = { x: Math.sign(ground.street.x - ground.entry.x), y: Math.sign(ground.street.y - ground.entry.y) };
  const margins = (space: number, minimum: number, dir: number) => {
    const both = Math.max(0, Math.min(moat ? 3 : 1, (space - minimum) >> 1, dir ? space - minimum - 2 : space));
    const front = Math.min(5, space - minimum - both);
    return [dir < 0 ? front : both, dir > 0 ? front : both];
  };
  const [left, right] = margins(ground.w, 14, outward.x);
  const [back, front] = margins(ground.h, ground.h >= 15 ? 13 : 11, outward.y);
  const x = ground.x + left, y = ground.y + back, w = ground.w - left - right, h = ground.h - front - back;
  const east = x + w - 1, south = y + h - 1;
  const entry = { x: outward.x < 0 ? x : outward.x > 0 ? east : ground.entry.x,
    y: outward.y > 0 ? south : ground.entry.y };
  const bends: Point[] = [{ x, y }, ...(offset && w >= 21
    ? [{ x: east - 3, y }, { x: east, y: y + 3 }]
    : [{ x: east, y }]), { x: east, y: south }, { x, y: south }];
  const ring = bends.flatMap((a, i) => line(a, bends[(i + 1) % bends.length]).slice(0, -1));
  const across = (v: number) => ({ x: entry.x + Math.abs(outward.y) * v, y: entry.y + Math.abs(outward.x) * v });
  const half = (outward.x ? h >= 16 : w >= 25) ? 2 : 1;
  const opening = Array.from({ length: half * 2 + 1 }, (_, i) => across(i - half));
  const openings = new Set(opening.map(p => cellKey(p.x, p.y)));
  return { material, precinct, rect: { x, y, w, h }, ring, bends, openings,
    cells: ring.filter(p => !openings.has(cellKey(p.x, p.y))),
    gates: [{ opening, outward, jambs: [across(-half - 1), across(half + 1)], covered: false }] };
}

export type Furniture = { kind: StreetFurniture; x: number; y: number };
export type Verge = Rect & { axis: "x" | "y"; side: -1 | 1 };
/** A double-track line straight through the town and out past its edge:
 * `level` is its first row or column, `lo` to `hi` its run along `axis`. */
export type Rail = {
  axis: "x" | "y";
  level: number;
  lo: number;
  hi: number;
  span: number;
};
export const RAIL_SPAN = 4;
/** Shortest street front a row block is cut to, in cells: six or seven houses. */
const FRONT = 32;
export type UrbanLayout = {
  gates: Gate[];
  streets: Segment[];
  /** Diagonal avenues, laid as staircases; never part of the block reading. */
  diagonals: Segment[];
  blocks: Block[];
  plaza: Rect;
  /** Where the streets framing the plaza end and building may begin, when a
   * gridded or motor-age town runs its streets round the square. */
  plazaFront?: Rect;
  /** The square paved out to the inner kerb of that frame. */
  plazaCourt?: Rect;
  /** Further squares at crossings, each painted like the main one. */
  squares: Rect[];
  /** Ground cut out for each precinct requested, in order; undefined where
   * none of its sizes would fit. */
  grounds: (PrecinctGround | undefined)[];
  /** Planted strips beside the arterials. */
  verges: Verge[];
  furniture: Furniture[];
  half: number;
  /** Street widths in cells by tier, after the arterial is narrowed for a
   * small town. */
  tiers: readonly [number, number, number];
  wall?: Wall;
  rail?: Rail;
  /** Inside the ring round an old core the city grew round rather than
   * through: its lanes are the old ones, narrow, unkerbed and without cars. */
  oldCore?: Rect;
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

function wallOutline(center: Point, samples: Point[], gates: Gate[], frontage: number, half: number) {
  const turn = Math.PI * 2;
  const angle = (p: Point) => Math.atan2(p.y - center.y, p.x - center.x);
  const sweep = (a: number, b: number) => (b - a + turn) % turn;
  const fronts = gates.map(({ point, nx, ny }) => ({
    point,
    start: { x: point.x + ny * frontage, y: point.y - nx * frontage },
    end: { x: point.x - ny * frontage, y: point.y + nx * frontage },
    angle: angle(point),
  })).sort((a, b) => a.angle - b.angle);
  const bends = fronts.flatMap((front, i) => {
    const next = fronts[(i + 1) % fronts.length], from = angle(front.end);
    const span = sweep(from, angle(next.start));
    const between = samples.map(p => ({ p, t: sweep(from, angle(p)) }))
      .filter(({ t }) => t > .20 && t < span - .20).sort((a, b) => a.t - b.t);
    return [front.point, ...simplifyPath([front.end, ...between.map(s => s.p), next.start],
      Math.max(2, Math.min(4, half / 24)))];
  });
  const corners = bends.flatMap((a, i) => {
    const b = bends[(i + 1) % bends.length], dx = b.x - a.x, dy = b.y - a.y;
    const wide = Math.abs(dx) >= Math.abs(dy);
    const major = Math.max(Math.abs(dx), Math.abs(dy)), minor = Math.min(Math.abs(dx), Math.abs(dy));
    if (!minor || minor === major) return [a];
    // Keep a shallow curtain within three cells of the surveyed line, using
    // stretches the tile art can draw straight between its 45-degree turns.
    const count = Math.ceil(minor * (major - minor) / (6 * major));
    const parts: Point[] = [a];
    const from = angle(a), span = sweep(from, angle(b));
    for (let j = 0; j < count; j++) {
      const x = a.x + Math.round(dx * j / count), y = a.y + Math.round(dy * j / count);
      const w = a.x + Math.round(dx * (j + 1) / count) - x;
      const h = a.y + Math.round(dy * (j + 1) / count) - y;
      const lead = Math.floor(Math.abs(Math.abs(w) - Math.abs(h)) / 2);
      const p = { x: x + (wide ? Math.sign(w) * lead : 0), y: y + (wide ? 0 : Math.sign(h) * lead) };
      const diagonal = Math.min(Math.abs(w), Math.abs(h));
      for (const q of [p, { x: p.x + diagonal * Math.sign(w), y: p.y + diagonal * Math.sign(h) }]) {
        const prev = parts.at(-1)!;
        if ((q.x === prev.x && q.y === prev.y) || (q.x === b.x && q.y === b.y)) continue;
        const t = sweep(from, angle(q));
        if (t <= sweep(from, angle(prev)) || t >= span) return [a];
        parts.push(q);
      }
    }
    return parts;
  });
  const faces = corners.map((a, i) => {
    const b = corners[(i + 1) % corners.length];
    const nx = b.y - a.y, ny = a.x - b.x;
    return { a, b, angle: angle(a), nx, ny, offset: (a.x - center.x) * nx + (a.y - center.y) * ny };
  }).sort((a, b) => a.angle - b.angle);
  const strips = new Map<number, typeof faces>();
  for (const f of faces) {
    for (let row = Math.floor(Math.min(f.a.y, f.b.y) / 16); row <= Math.floor(Math.max(f.a.y, f.b.y) / 16); row++) {
      let strip = strips.get(row);
      if (!strip) strips.set(row, strip = []);
      strip.push(f);
    }
  }
  const faceAt = (theta: number) => {
    let lo = 0, hi = faces.length;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (faces[mid].angle <= theta) lo = mid + 1;
      else hi = mid;
    }
    return faces[lo ? lo - 1 : faces.length - 1];
  };
  const holds = (x: number, y: number, margin: number) => {
    const dx = x - center.x, dy = y - center.y, f = faceAt(Math.atan2(dy, dx));
    if (dx * f.nx + dy * f.ny > f.offset) return false;
    if (margin > 0) {
      // At a sharp bend the nearest curtain can lie on the next bearing.
      for (let row = Math.floor((y - margin) / 16); row <= Math.floor((y + margin) / 16); row++)
        for (const { a, b } of strips.get(row) ?? [])
          if (x + margin > Math.min(a.x, b.x) && x - margin < Math.max(a.x, b.x) &&
              distanceToSegment({ x, y }, a, b) < margin) return false;
    }
    return true;
  };
  return { corners, bends, faceAt, holds };
}

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
  /** The settlement's date. A fabric's furniture list says what this kind of
   * place has; the date says whether its streets were lit at all. */
  year?: number,
  /** Courts, arenas and markets, each as its sizes largest first. */
  precincts?: PrecinctRequest[],
  /** An industrial-age town has a railway through it; a trunk line that
   * reaches the town says exactly where. */
  railway: boolean | Rail = false,
  /** Whether the place and date lit its streets, not only its square. */
  lit = (year ?? 0) >= 1700,
  /** River water, which a motor-age street bridges where it would stop. */
  river?: (x: number, y: number) => boolean,
  /** Depth a block needs to hold two rows of the town's own houses back to
   * back, the front row's drawn roof included. */
  rows = 0,
  /** In a street-wall city, how deep a row of houses is drawn this far from
   * the centre: its block is exactly that deep. */
  rowDepth?: (near: number, far: number, low?: boolean) => number,
  /** Footprint of the station a street-wall city keeps a block for against
   * its railway, the forecourt its cabs turn in included. */
  station?: readonly [number, number],
  elevation?: (x: number, y: number) => number,
): UrbanLayout {
  const stationDepth = station ? station[1] + 9 : 0;
  const half = urbanFootprint(radius, form);
  const rand = (...keys: (string | number)[]) =>
    random(seed, siteId, "compose", ...keys);
  const approaches = urbanGates(siteId, center, radius, form);
  const walled = hasCircuit(form, radius);

  // Widths are whole cells. A fabric's avenue is for its large cities; a
  // small town of the same fabric gets a three-cell main street.
  const cap = form.motor ? Infinity : radius < 40 ? 3 : radius < 60 ? 4 : 6;
  // A core laid out for cars, as against an old one the cars went round.
  const motorCore = !!form.motor && !form.oldCore;
  /** The square is a block at the main crossing, the two main streets passing
   * two of its sides: a town laid out for cars, and any built in rows, whose
   * houses then face it from the north across their own street. */
  const cornerSquare = motorCore || (!!form.streetWall && !form.oldCore);
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
  // A town laid out for cars is one grid: quarters each with their own
  // module left streets that stopped at every seam.
  // A block shallower than its houses and their roofs is built on one side or
  // left empty, so the module never falls below what the houses need.
  const specs: readonly DistrictSpec[] = (form.districts?.length && !motorCore
    ? form.districts
    : [{ plan: form.plan, block: form.block, regularity: form.regularity }]
  ).map((d) => ({ ...d, block: [d.block[0], Math.max(d.block[1], rows)] as const }));
  const core = specs[0];
  const single = specs.length === 1;
  const coreHalf = single
    ? half
    : form.oldCore
      ? Math.max(26, Math.round(half * 0.5))
      : Math.max(14, Math.round(half * (form.motor ? 0.42 : 0.6)));
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
      ? approaches[0].axis === "y"
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
  // A city of cars or of street walls is built out on every side, corners
  // and all; an older town grows an extension or two where its fabric says.
  const allRound = (form.motor || form.streetWall) && !single;
  const extensions =
    allRound
      ? [0, 1, 2, 3].map((i) => specs[Math.min(i + 1, specs.length - 1)])
      : specs.slice(1, 5);
  extensions.forEach((spec, i) => {
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
  if (allRound) {
    const spec = specs[specs.length - 1];
    for (const [sx, sy] of [
      [1, 1],
      [-1, 1],
      [1, -1],
      [-1, -1],
    ]) {
      const w = half - coreA,
        h = half - coreB;
      if (w < 12 || h < 12) continue;
      const rect = {
        x: sx > 0 ? center.x + coreA + 1 : center.x - half,
        y: sy > 0 ? center.y + coreB + 1 : center.y - half,
        w,
        h,
      };
      // Reaching back to the centre, so a round core leaves no gap on the
      // diagonal between it and the corner.
      const shape = {
        x: Math.min(rect.x, center.x),
        y: Math.min(rect.y, center.y),
        w: w + coreA + 1,
        h: h + coreB + 1,
      };
      districts.push({ spec, core: false, rect, shape });
    }
  }
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
    return walled ? Math.min(radii[i] + 1, wanted[i] - trim) : Math.max(radii[i], wanted[i] - trim);
  });
  const gates = walled ? approaches.map(gate => {
    const { nx, ny } = gate;
    const reach = (gate.point.x - center.x) * nx + (gate.point.y - center.y) * ny;
    for (let inset = 0; reach - inset >= half * .42; inset++) {
      const x = gate.point.x - inset * nx, y = gate.point.y - inset * ny;
      if (!insideIdeal(x, y)) continue;
      let dry = true;
      for (let d = -loA - 2; usable && dry && d <= hiA + 2; d++)
        dry = usable(x + ny * d, y + nx * d) && usable(x + ny * d - nx, y + nx * d - ny);
      if (dry) return { ...gate, point: { x, y } };
    }
    return gate;
  }) : approaches;
  const outline = walled ? wallOutline(center, smoothed.map((r, i) => ({
    x: center.x + Math.round(Math.cos(bearing(i)) * r),
    y: center.y + Math.round(Math.sin(bearing(i)) * r),
  })), gates, Math.max(hiA + 3, Math.round(half * (core.plan === "orthogonal" ? .32 : .16))), half) : undefined;
  for (const gate of outline ? [] : gates) {
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
    if (outline) {
      const c = Math.cos(angle), s = Math.sin(angle);
      const f = outline.faceAt(Math.atan2(s, c));
      return f.offset / (f.nx * c + f.ny * s);
    }
    const t = (angle / (Math.PI * 2)) * BEARINGS;
    const i = Math.floor(t),
      f = t - i;
    const a = smoothed[((i % BEARINGS) + BEARINGS) % BEARINGS],
      b = smoothed[(((i + 1) % BEARINGS) + BEARINGS) % BEARINGS];
    return a + (b - a) * f;
  };
  const holds = (x: number, y: number, margin = 0) => {
    if (outline) return outline.holds(x, y, margin);
    const dx = x - center.x,
      dy = y - center.y;
    return Math.hypot(dx, dy) <= edge(Math.atan2(dy, dx)) - margin;
  };
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
  const size = cornerSquare
    ? Math.max(15, Math.min(21, even(half * form.plazaScale) + 1))
    : // A boulevard-age square was a place framed by its buildings, not
      // the open ground of a market town.
      Math.max(7, Math.min((year ?? 0) >= 1850 ? 13 : Infinity, even(half * form.plazaScale) + 1));
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
  // A motor-age square is the corner block at the main crossing: both main
  // roads run straight past it.
  const plaza = cornerSquare
    ? { x: focus.x + hiA + margin(0) + 1, y: focus.y - loA - margin(0) - size, w: size, h: size }
    : { x: focus.x - (size >> 1), y: focus.y - (size >> 1), w: size, h: size };

  // A street-wall city's rows bring their own streets to the square's sides.
  const framed = !motorCore && core.plan === "orthogonal" && !form.streetWall;

  // --- Arterials -------------------------------------------------------------
  // One axis-aligned run per gate, bent where the fabric is irregular so the
  // network does not collapse into a single central crossing.
  const streets: Segment[] = [];
  const cuts = { x: new Set<number>(), y: new Set<number>() };
  for (const [i, gate] of gates.entries()) {
    const along = gate.axis;
    const across = along === "x" ? "y" : "x";
    const approach = approaches[i].point;
    if (approach.x !== gate.point.x || approach.y !== gate.point.y)
      streets.push({ a: approach, b: gate.point, tier: 0 });
    // An old town's streets come into its square at the corners, each along a
    // different side, as Sitte drew them turning like a pinwheel: the view
    // down a street closes on a building, and the middle of every side is
    // left to the buildings that front the square.
    const pinwheel = grown(core.plan) && !framed;
    const target = !pinwheel
      ? along === "x" ? focus.y : focus.x
      : along === "x"
        ? gate.nx < 0 ? plaza.y + hiA : plaza.y + plaza.h - 1 - loA
        : gate.ny < 0 ? plaza.x + plaza.w - 1 - loA : plaza.x + hiA;
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
  const gateRuns = streets.length;
  let oldCore: Rect | undefined;
  // A boulevard on the line of the old core's demolished walls.
  if (form.ring && grown(core.plan) && !single) {
    // On the line of the walls; round a core that stood, just outside it, so
    // its kerb and not its carriageway meets the old houses.
    const inset = form.oldCore ? -(loA + margin(0) + 1) : hiA + margin(0);
    const [x0, x1] = [coreRect.x + inset, coreRect.x + coreRect.w - 1 - inset],
      [y0, y1] = [coreRect.y + inset, coreRect.y + coreRect.h - 1 - inset];
    const corners = [
      { x: x0, y: y0 },
      { x: x1, y: y0 },
      { x: x1, y: y1 },
      { x: x0, y: y1 },
    ];
    for (const [k, a] of corners.entries()) {
      const b = corners[(k + 1) % 4];
      if (
        line(a, b).every(
          (p) => holds(p.x, p.y, wallMargin) && (!usable || usable(p.x, p.y)),
        )
      )
        streets.push({ a, b, tier: 0 });
    }
    cuts.x.add(x0).add(x1);
    cuts.y.add(y0).add(y1);
    if (form.oldCore) oldCore = coreRect;
  }
  const ringRuns = streets.length;
  // Further arterials so a quarter is never many blocks deep. How many follows
  // from the block module, not from the settlement's size alone.
  for (const axis of ["x", "y"] as const) {
    if (core.plan === "linear" && axis !== gates[0].axis) continue;
    // A row of houses wants a long front: its avenues stand further apart.
    // and enough depth between them for a street of its own and an alley.
    const module = (form.streetWall && rowDepth
      ? axis === "x" ? Math.max(core.block[0], FRONT) : 2 * (rowDepth(0.4, 0.4) + span(1) + margin(1) * 2)
      : axis === "x" ? core.block[0] : core.block[1]) + arterial;
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
          ? { a: { x: at, y: lo }, b: { x: at, y: hi }, tier: motorCore ? 1 : 0 }
          : { a: { x: lo, y: at }, b: { x: hi, y: at }, tier: motorCore ? 1 : 0 },
      );
    }
  }
  // The ring takes the traffic round an old core: an avenue stops at it, and
  // a route in from a gate goes on inside as an ordinary street.
  if (oldCore) {
    const r = oldCore;
    const kept = streets.splice(0).flatMap((s, i) => {
      if (i >= gateRuns && i < ringRuns) return [s];
      const x = s.a.y === s.b.y;
      const level = x ? s.a.y : s.a.x;
      if (x ? level < r.y || level >= r.y + r.h : level < r.x || level >= r.x + r.w) return [s];
      const [lo, hi] = x
        ? [Math.min(s.a.x, s.b.x), Math.max(s.a.x, s.b.x)]
        : [Math.min(s.a.y, s.b.y), Math.max(s.a.y, s.b.y)];
      const [in0, in1] = x ? [r.x, r.x + r.w - 1] : [r.y, r.y + r.h - 1];
      const at = (v: number) => (x ? { x: v, y: level } : { x: level, y: v });
      const parts: Segment[] = [];
      if (lo < in0) parts.push({ a: at(lo), b: at(Math.min(hi, in0 - 1)), tier: 0 });
      if (hi > in1) parts.push({ a: at(Math.max(lo, in1 + 1)), b: at(hi), tier: 0 });
      if (i < gateRuns && hi >= in0 && lo <= in1)
        parts.push({ a: at(Math.max(lo, in0 - 1)), b: at(Math.min(hi, in1 + 1)), tier: 1 });
      return parts.filter((p) => p.a.x !== p.b.x || p.a.y !== p.b.y);
    });
    streets.push(...kept);
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
  /** Laid out as rows once the squares and the railway have taken their
   * ground; an old core the city grew round keeps its lanes. */
  const inRows = (d: District) => !!form.streetWall && !!rowDepth && !(form.oldCore && d.core);
  for (const [i, d] of districts.entries())
    if (inRows(d)) continue;
    else if (grown(d.spec.plan)) grow(d, i);
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
    // A boulevard-age city kept its old lanes' pattern but not their scraps:
    // its blocks had to hold ranges of five storeys round a court, so the
    // lanes that survived are fewer, straighter and rarely blind.
    const kept = !!form.oldCore && d.core;
    const renewed = (year ?? 0) >= 1850 && !kept;
    // A kept core's lanes still bend and end blind, but they now front
    // houses of three and four storeys round a court, not one-room cells.
    const [bw, bh] = renewed || kept
      ? [Math.round(d.spec.block[0] * 1.5), Math.round(d.spec.block[1] * 1.5)]
      : d.spec.block;
    // Motor-age rebuilding straightened what it kept of the old lanes.
    const reg = form.motor && !kept
      ? Math.max(0.85, d.spec.regularity)
      : d.spec.regularity;
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
      // An old core kept its lanes when the cars came; only its arterials widened.
      const tier: Tier = parent.tier === 0 && !form.motor ? 1 : 2;
      // Pitch along the parent between branches of this orientation.
      const pitch = (axis === "x" ? bw : bh) + span(tier) + margin(tier) * 2;
      const [plo, phi] = spanOffsets(span(parent.tier));
      const start = across(parent) + (dir > 0 ? phi + 1 : -plo - 1);
      const at = (u: number, v: number) =>
        other === "x" ? { x: v, y: u } : { x: u, y: v }; // u along parent axis? no: u is the parent-axis coordinate, v the branch coordinate
      // A branch too near a parallel one leaves no block between them.
      const gap = Math.max(renewed || kept ? 12 : 8, Math.floor(pitch * 0.6));
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
            rand("blind", i, n) < form.deadEnds * (renewed ? 0.3 : 1) || len >= target * 2;
          if (blind) {
            pieces.push(at(u, v));
            ended = true;
            done = true;
            break;
          }
        }
        if (
          reg < 0.85 &&
          !renewed &&
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

  /** Streets that met this rectangle stop at its edge instead of crossing. */
  function cutStreets(r: Rect) {
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

  if (motorCore) {
    cutStreets(plaza);
    // No street runs close alongside a wider one: the sliver between them
    // holds nothing, and their junctions run together.
    const kept: Segment[] = [];
    for (const s of [...streets].sort((a, b) => a.tier - b.tier)) {
      let runs: [number, number][] = [[lo(s), hi(s)]];
      for (const o of kept) {
        const gap = Math.abs(across(o) - across(s));
        if (axisOf(o) !== axisOf(s) || !gap || gap >= (span(o.tier) + span(s.tier)) / 2 + 8) continue;
        runs = runs
          .flatMap(([a, b]): [number, number][] => [[a, Math.min(b, lo(o) - 1)], [Math.max(a, hi(o) + 1), b]])
          .filter(([a, b]) => b - a >= 12);
      }
      for (const [a, b] of runs) kept.push({ a: point(s, a), b: point(s, b), tier: s.tier });
    }
    streets.splice(0, streets.length, ...kept);
    lines.clear();
    for (const s of streets) mark(s);
  }

  // --- The square's frame ---------------------------------------------------
  // In a gridded or motor-age town the square is a block the streets run
  // round, the missing block of the grid as the Laws of the Indies laid it out
  // and every courthouse square copies. Roads meet the frame; none ends at
  // the square itself, and the buildings face it across the street. A big
  // city's civic block is its own frame.
  // The frame carries the arterials' traffic round the square, so it is laid
  // as one: their width, their surface, their verges.
  const frameGap = hiA + margin(0) + 2;
  const frame = framed
    ? {
        w: plaza.x - frameGap,
        e: plaza.x + plaza.w - 1 + frameGap,
        n: plaza.y - frameGap,
        s: plaza.y + plaza.h - 1 + frameGap,
      }
    : undefined;
  const frameInterior = frame && { x: frame.w + 1, y: frame.n + 1, w: frame.e - frame.w - 1, h: frame.s - frame.n - 1 };
  const frameSides: Segment[] = [];
  if (frame) {
    // A street that would pass the frame too close to leave a block between
    // them is brought up against it instead, and the frame reaches out to meet it.
    const near = arterial + margin(0) + 4;
    const reach = { w: [frame.n, frame.s], e: [frame.n, frame.s], n: [frame.w, frame.e], s: [frame.w, frame.e] };
    for (const s of [...streets]) {
      const level = across(s);
      const [f0, f1, g0, g1] = axisOf(s) === "x"
        ? [frame.n, frame.s, frame.w, frame.e]
        : [frame.w, frame.e, frame.n, frame.s];
      if (hi(s) < g0 || lo(s) > g1 || (level >= f0 && level <= f1)) continue;
      if (level < f0 - near || level > f1 + near) continue;
      streets.splice(streets.indexOf(s), 1);
      const [before, after] = axisOf(s) === "x" ? (["w", "e"] as const) : (["n", "s"] as const);
      if (lo(s) < g0) {
        streets.push({ a: point(s, lo(s)), b: point(s, g0), tier: s.tier });
        reach[before] = [Math.min(reach[before][0], level), Math.max(reach[before][1], level)];
      }
      if (hi(s) > g1) {
        streets.push({ a: point(s, g1), b: point(s, hi(s)), tier: s.tier });
        reach[after] = [Math.min(reach[after][0], level), Math.max(reach[after][1], level)];
      }
    }
    cutStreets(frameInterior!);
    frameSides.push(
      { a: { x: frame.w, y: reach.w[0] }, b: { x: frame.w, y: reach.w[1] }, tier: 0 },
      { a: { x: frame.e, y: reach.e[0] }, b: { x: frame.e, y: reach.e[1] }, tier: 0 },
      { a: { x: reach.n[0], y: frame.n }, b: { x: reach.n[1], y: frame.n }, tier: 0 },
      { a: { x: reach.s[0], y: frame.s }, b: { x: reach.s[1], y: frame.s }, tier: 0 },
    );
    streets.push(...frameSides);
    lines.clear();
    for (const s of streets) mark(s);
  }
  const plazaCourt = frame && {
    x: frame.w + hiA + 1,
    y: frame.n + hiA + 1,
    w: frame.e - frame.w - loA - hiA - 1,
    h: frame.s - frame.n - loA - hiA - 1,
  };
  const plazaFront = frame && {
    x: frame.w - loA - margin(0),
    y: frame.n - loA - margin(0),
    w: frame.e - frame.w + loA + hiA + margin(0) * 2 + 1,
    h: frame.s - frame.n + loA + hiA + margin(0) * 2 + 1,
  };

  // --- Further squares and diagonals ----------------------------------------
  const squares: Rect[] = [];
  if (form.squares && !motorCore) {
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
    for (const r of squares) cutStreets(r);
    lines.clear();
    for (const s of streets) mark(s);
  }

  // The railway skirts the old centre, as the lines did that reached towns
  // already built, and runs on past the edge. No street runs along it.
  const rail: Rail | undefined = typeof railway === "object" ? railway : railway
    ? (() => {
        const axis = rand("rail-axis") < 0.5 ? "x" : "y";
        const side = rand("rail-side") < 0.5 ? -1 : 1;
        const origin = axis === "x" ? center.x : center.y;
        return {
          axis,
          level:
            (axis === "x" ? focus.y : focus.x) +
            side * Math.round(half * (0.3 + rand("rail-at") * 0.2)),
          lo: origin - half - 40,
          hi: origin + half + 40,
          span: RAIL_SPAN,
        };
      })()
    : undefined;
  const grounds: (PrecinctGround | undefined)[] = [];
  const diagonals: Segment[] = [];
  // Not through a city of rows: its blocks are rectangles, and an avenue cut
  // across them ran into the square and left scraps on both sides.
  if (form.diagonals && !form.streetWall) {
    const corners = [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
    ].sort((a, b) => rand("diag", a[0], a[1]) - rand("diag", b[0], b[1]));
    for (const [sx, sy] of corners) {
      if (diagonals.length >= form.diagonals) break;
      const a = frame
          ? { x: sx < 0 ? frame.w : frame.e, y: sy < 0 ? frame.n : frame.s }
          : { x: sx < 0 ? plaza.x - 1 : plaza.x + plaza.w, y: sy < 0 ? plaza.y - 1 : plaza.y + plaza.h };
      let b = a;
      while (holds(b.x + sx, b.y + sy, wallMargin + 1))
        b = { x: b.x + sx, y: b.y + sy };
      if (Math.abs(b.x - a.x) < 12) continue;
      if (form.motor) {
        const meets = streets.flatMap((s) => {
          const d = axisOf(s) === "x" ? (s.a.y - a.y) / sy : (s.a.x - a.x) / sx;
          const q = { x: a.x + sx * d, y: a.y + sy * d };
          const v = axisOf(s) === "x" ? q.x : q.y;
          return d >= 12 && d <= Math.abs(b.x - a.x) && v >= lo(s) && v <= hi(s) ? [{ q, d }] : [];
        }).sort((p, q) => q.d - p.d);
        if (!meets.length) continue;
        b = meets[0].q;
      }
      diagonals.push({ a, b, tier: form.motor ? 1 : 0 });
    }
  }

  if (rail)
    for (let i = streets.length - 1; i >= 0; i--) {
      const s = streets[i];
      if (
        axisOf(s) === rail.axis &&
        across(s) >= rail.level - 4 &&
        across(s) <= rail.level + rail.span + 3
      )
        streets.splice(i, 1);
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
    clearRect(plaza, cornerSquare ? 1 : form.oldCore ? 2 : Math.max(loA, hiA) + 1);
    for (const r of squares) clearRect(r, Math.max(loA, hiA) + 1);
    for (const r of grounds) if (r) { clearRect(r, 1); clearRect(r.approach, 0); }
    if (rail)
      clearRect(
        rail.axis === "x"
          ? { x: bounds.x, y: rail.level, w: W, h: rail.span }
          : { x: rail.level, y: bounds.y, w: rail.span, h: H },
        1,
      );
    for (const q of quarters) clearRect(q, 0);
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
  /** How far out a point lies, 0 at the centre to 1 at the edge. */
  const reachAt = (x: number, y: number) => density
    ? 1 - density(x, y)
    : Math.max(Math.abs(x - focus.x), Math.abs(y - focus.y)) / half;
  const blockOn = (r: Rect): Block => {
    const mid = { x: r.x + (r.w >> 1), y: r.y + (r.h >> 1) };
    return {
      ...r,
      depth: 0,
      court: false,
      district: Math.max(
        0,
        districts.findIndex((d) => inRect(mid.x, mid.y, d.rect)),
      ),
      reach: reachAt(r.x + r.w / 2, r.y + r.h / 2),
    };
  };
  /** Ground between the main streets that was cut into rows, and the rows. */
  const quarters: Rect[] = [];
  const rowBlocks: Block[] = [];
  function readBlocks() {
    rasterize();
    blocks = [];
    for (;;) {
      const r = largest();
      if (!r) break;
      clearRect(r, 0);
      blocks.push(blockOn(r));
    }
    blocks.push(...settledRows());
  }
  /** The rows less whatever a street joined up later has since cut through. */
  function settledRows(): Block[] {
    let out = rowBlocks;
    for (const s of streets) {
      const [slo, shi] = spanOffsets(span(s.tier)), m = margin(s.tier);
      const x = axisOf(s) === "x";
      const a0 = across(s) - slo - m, a1 = across(s) + shi + m, l0 = lo(s) - slo - m, l1 = hi(s) + shi + m;
      out = out.flatMap((b) => {
        const [b0, b1, c0, c1] = x ? [b.y, b.y + b.h - 1, b.x, b.x + b.w - 1] : [b.x, b.x + b.w - 1, b.y, b.y + b.h - 1];
        if (a1 < b0 || a0 > b1 || l1 < c0 || l0 > c1) return [b];
        const least = x ? 6 : 10;
        return [[b0, a0 - 1], [a1 + 1, b1]].filter(([from, to]) => to - from + 1 >= least)
          .map(([from, to]) => (x ? { ...b, y: from, h: to - from + 1 } : { ...b, x: from, w: to - from + 1 }));
      });
    }
    return out;
  }
  if (form.streetWall && rowDepth) layRows(rowDepth);
  readBlocks();

  /** A street-wall city, block first. Each piece of open ground between the
   * main streets is cut into rows one house deep, each with a street along
   * its south side, and lanes join one row street to the next. A new street
   * is laid only where both its ends meet another, so none ends blind; ground
   * that cannot be reached that way is left open. */
  function layRows(depthAt: (near: number, far: number, low?: boolean) => number) {
    rasterize();
    for (const d of districts) if (!inRows(d)) clearRect(d.rect, 0);
    const [lo1, hi1] = spanOffsets(span(1)), m1 = margin(1), s1 = span(1) + m1 * 2;
    const [lo2, hi2] = spanOffsets(span(2)), m2 = margin(2), s2 = span(2) + m2 * 2;
    const probe = Math.max(loA, hiA) + margin(0) + 2;
    let depot = false;
    if (form.lattice) {
      const ok = (x: number, y: number) => inRect(x, y, bounds) && holds(x, y, wallMargin + 1) && (!usable || usable(x, y));
      const mA = margin(0), depth = Math.max(6, depthAt(0, 0.6));
      const stepX = Math.max(core.block[0], FRONT) + loA + hiA + 1 + mA * 2, stepY = depth + lo1 + hi1 + 1 + m1 * 2;
      // The two main streets are the lattice's own lines.
      const ax = streets.find((s) => s.tier === 0 && s.a.x === s.b.x)?.a.x ?? focus.x,
        ay = streets.find((s) => s.tier === 0 && s.a.y === s.b.y)?.a.y ?? focus.y;
      const from = (o: number, step: number, lo: number, hi: number) => {
        const out: number[] = [];
        for (let v = o - Math.ceil((o - lo) / step) * step; v <= hi; v += step) out.push(v);
        return out;
      };
      const xs = from(ax, stepX, bounds.x, bounds.x + W), ys = from(ay, stepY, bounds.y, bounds.y + H);
      // A street runs wherever its line is on buildable ground, and stops at the shore.
      const runs = (fixed: number, upright: boolean, tier: Tier) => {
        const len = upright ? H : W, o = upright ? bounds.y : bounds.x;
        for (let v = 0, start = -1; v <= len; v++) {
          const on = v < len && (upright ? ok(fixed, o + v) : ok(o + v, fixed));
          if (on && start < 0) start = v;
          if (!on && start >= 0) {
            if (v - start >= 10) push(upright ? { a: { x: fixed, y: o + start }, b: { x: fixed, y: o + v - 1 }, tier } : { a: { x: o + start, y: fixed }, b: { x: o + v - 1, y: fixed }, tier });
            start = -1;
          }
        }
      };
      for (const x of xs) if (x !== ax) runs(x, true, 0);
      for (const y of ys) if (y !== ay) runs(y, false, 1);
      rasterize();
      for (const [j, x] of xs.entries())
        for (const [k, y] of ys.entries()) {
          const x0 = x + hiA + mA + 1, x1 = (xs[j + 1] ?? x + stepX) - loA - mA - 1;
          const top = y + hi1 + m1 + 1;
          // The row stands on the street to its south: the widest run of
          // ground that is open from there back, as deep as it stays open.
          let best: Rect | undefined;
          for (let bottom = (ys[k + 1] ?? y + stepY) - lo1 - m1 - 1, tries = 0; tries < 5 && !best; bottom--, tries++)
            for (let h = bottom - top + 1; h >= 6; h--)
              for (let x2 = x0, start = -1; x2 <= x1 + 1; x2++) {
                let clear = x2 <= x1;
                for (let yy = bottom - h + 1; clear && yy <= bottom; yy++) clear = inRect(x2, yy, bounds) && !!open[idx(x2, yy)];
                if (clear && start < 0) start = x2;
                if (!clear && start >= 0) {
                  if (x2 - start >= 8 && (x2 - start) * h > (best ? best.w * best.h : 0)) best = { x: start, y: bottom - h + 1, w: x2 - start, h };
                  start = -1;
                }
              }
          if (!best) continue;
          clearRect(best, 0);
          quarters.push(best);
          rowBlocks.push({ ...blockOn(best), row: true });
        }
    }
    /** Centre line of the street passing just outside a cell, if one does. */
    const beside = (x: number, y: number, dx: number, dy: number) => {
      for (let k = 1; k <= probe; k++) if (lines.has(cellKey(x + dx * k, y + dy * k))) return dx ? x + dx * k : y + dy * k;
      return undefined;
    };
    for (; !form.lattice; ) {
      const q = largest();
      if (!q) break;
      clearRect(q, 0);
      quarters.push(q);
      const base = blockOn(q);
      const spec = districts[base.district]?.spec ?? core;
      // A quarter is cut for the deepest houses of the rings it spans; each
      // row then builds what its own distance out calls for.
      const span: [number, number] = [
        reachAt(Math.max(q.x, Math.min(q.x + q.w, focus.x)), Math.max(q.y, Math.min(q.y + q.h, focus.y))),
        Math.max(...[q.x, q.x + q.w].flatMap((x) => [q.y, q.y + q.h].map((y) => reachAt(x, y)))),
      ];
      const depth = Math.max(6, depthAt(...span));
      const right = q.x + q.w - 1, bottom = q.y + q.h - 1;
      const westAt = (y: number) => beside(q.x, y, -1, 0),
        eastAt = (y: number) => beside(right, y, 1, 0),
        northAt = (x: number) => beside(x, q.y, 0, -1);
      // The street the bottom row fronts: the one already there, or a new one.
      const under: number[] = [];
      for (let x = q.x; x <= right; x++) {
        const at = beside(x, bottom, 0, 1);
        if (at !== undefined) under.push(at);
      }
      const fronted = under.length >= q.w * 0.7;
      const south = fronted ? under.sort((a, b) => a - b)[under.length >> 1] : bottom - hi1;
      const y1 = fronted ? bottom : south - lo1 - m1 - 1;
      // The station takes the top of one quarter that lies under the railway,
      // with a street of its own between its forecourt and the rows.
      const halt = !depot && !!stationDepth && rail?.axis === "x" && q.y - rail.level - rail.span >= 0 &&
        q.y - rail.level - rail.span <= 3 && q.w >= 30 && y1 - q.y + 1 >= stationDepth + s1 + depth
        ? q.y + stationDepth + m1 + lo1 : undefined;
      if (halt !== undefined) depot = true;
      const first = halt === undefined ? q.y : halt + hi1 + m1 + 1;
      const height = y1 - first + 1;
      if (q.w < 10 || height < 6) continue;
      // Counted up from the street the bottom row fronts: a main row, then
      // either a street and another main row, or an alley and the low row of
      // mews and workshops that fronts it. Whatever is over deepens the yards.
      const lowDepth = Math.min(depth, Math.max(7, depthAt(...span, true)));
      const kinds: { h: number; tier: Tier }[] = [{ h: depth, tier: 1 }];
      for (let left = height - depth, n = 0; ; n++) {
        const alley = !!form.alleys && kinds.at(-1)!.h === depth && rand("alley", q.x, q.y, n) < form.alleys;
        const gap = alley ? s2 : s1, h = alley ? lowDepth : depth;
        if (left < gap + h) {
          // Not room for a full row: a low one behind an alley, if that fits.
          if (!alley && left >= s2 + 7) kinds.push({ h: Math.min(lowDepth, left - s2), tier: 2 });
          break;
        }
        kinds.push({ h, tier: alley ? 2 : 1 });
        left -= gap + h;
      }
      const used = kinds.reduce((n, k, i) => n + k.h + (i ? (k.tier === 2 ? s2 : s1) : 0), 0);
      // A little over deepens the yards; more is left at the top as open
      // ground on the street behind, for whatever the quarter does with it.
      const mains = kinds.filter((k) => k.h === depth);
      const over = height - used, slack = over <= mains.length * 2 ? over : over >= 4 ? 0 : over;
      mains.forEach((k, i) => (k.h += Math.floor(slack / mains.length) + (i < slack % mains.length ? 1 : 0)));
      // Top down: each band, the street below it and that street's tier.
      const bands: { y: number; h: number; below: number; tier: Tier; low: boolean }[] = [];
      for (let i = kinds.length - 1, top = first + over - slack; i >= 0; i--) {
        const k = kinds[i], [lo, hi, m] = k.tier === 2 ? [lo2, hi2, m2] : [lo1, hi1, m1];
        bands.push({ y: top, h: k.h, below: i === 0 ? south : top + k.h + m + lo, tier: i === 0 ? 1 : k.tier, low: i > 0 && k.tier === 2 });
        top += k.h + m * 2 + lo + hi + 1;
      }
      const fresh = [...(halt === undefined ? [] : [halt]), ...bands.map((b) => b.below).filter((y) => y !== south || !fronted)];
      // A side with no street to end on gets a lane, if the lane can join two
      // streets itself; otherwise nothing new can be laid here.
      const lane = (at: (y: number) => number | undefined, x: number) => {
        if (fresh.every((y) => at(y) !== undefined)) return { x: undefined as number | undefined, ok: true };
        const head = northAt(x);
        const ends = [...(head === undefined ? [] : [head]), ...fresh, ...(fronted ? [south] : [])];
        return { x, ok: new Set(ends).size >= 2, from: Math.min(...ends), to: Math.max(...ends) };
      };
      let west = lane(westAt, q.x + lo2), east = lane(eastAt, right - hi2);
      // A street that meets another at one end and stops at its last house
      // is a close, not a road to nowhere: allowed where the other end joins.
      if (!west.ok && east.ok && q.w <= 48) west = { x: undefined, ok: true };
      else if (!east.ok && west.ok && q.w <= 48) east = { x: undefined, ok: true };
      // Ground against a shore or the town's edge has no street to end on at
      // one side, and often no room for a lane: its streets stop at the last
      // house, so long as they start from a street on the other side.
      const met = (at: (y: number) => number | undefined) => fresh.length > 0 && fresh.every((y) => at(y) !== undefined);
      const tight = (west.x !== undefined || east.x !== undefined) && q.w - (west.x === undefined ? 0 : s2) - (east.x === undefined ? 0 : s2) < FRONT * 0.75;
      if ((!west.ok || !east.ok || tight) && (met(westAt) || met(eastAt))) {
        west = { x: undefined, ok: true };
        east = { x: undefined, ok: true };
      }
      // A lane round a block too short for a street front is a ring road.
      const ringed = (west.x !== undefined || east.x !== undefined) && q.w - (west.x === undefined ? 0 : s2) - (east.x === undefined ? 0 : s2) < FRONT * 0.75;
      if (!west.ok || !east.ok || ringed) {
        // Only the row the old street already fronts can be built.
        if (fronted) rowBlocks.push({ ...blockOn({ x: q.x, y: Math.max(q.y, bottom - depth - Math.min(4, Math.max(0, q.h - depth)) + 1), w: q.w, h: Math.min(q.h, depth + 4) }), row: true });
        continue;
      }
      const laid: Segment[] = [];
      for (const side of [west, east])
        if (side.x !== undefined) laid.push({ a: { x: side.x, y: side.from! }, b: { x: side.x, y: side.to! }, tier: 2 });
      const x0 = west.x === undefined ? q.x : west.x + hi2 + m2 + 1,
        x1 = east.x === undefined ? right : east.x - lo2 - m2 - 1;
      const width = x1 - x0 + 1;
      const module = Math.max(spec.block[0], FRONT) + s2;
      const pieces = Math.max(1, Math.round(width / module));
      let above: number | undefined = halt;
      if (halt !== undefined) {
        laid.push({ a: { x: west.x ?? westAt(halt) ?? q.x, y: halt }, b: { x: east.x ?? eastAt(halt) ?? right, y: halt }, tier: 1 });
        // The station's own block in the middle, yards either side.
        const wide = Math.min(width, station![0] + 14), from = x0 + ((width - wide) >> 1);
        for (const [x, w] of [[x0, from - x0 - 1], [from, wide], [from + wide + 1, x1 - from - wide]])
          if (w >= 8) rowBlocks.push({ ...blockOn({ x, y: q.y, w, h: stationDepth }), open: true });
      }
      for (const [i, band] of bands.entries()) {
        if (band.below !== south || !fronted)
          laid.push({ a: { x: west.x ?? westAt(band.below) ?? q.x, y: band.below }, b: { x: east.x ?? eastAt(band.below) ?? right, y: band.below }, tier: band.tier });
        let left = x0;
        for (let j = 1; j <= pieces; j++) {
          const cut = j === pieces
            ? undefined
            : x0 + Math.round((width * j) / pieces + (rand("lane", q.x, q.y, i, j) - 0.5) * (1 - spec.regularity) * module * 0.6);
          // A lane runs from the street behind this row to the one in front.
          const head = cut === undefined ? undefined : (above ?? northAt(cut));
          const end = cut === undefined || head === undefined ? x1 : cut - lo2 - m2 - 1;
          if (end !== x1 && (end - left + 1 < 12 || x1 - (cut! + hi2 + m2) < 12)) continue;
          rowBlocks.push({ ...blockOn({ x: left, y: band.y, w: end - left + 1, h: band.h }), row: true, ...(band.low ? { low: true as const } : {}) });
          if (end === x1) break;
          laid.push({ a: { x: cut!, y: head! }, b: { x: cut!, y: band.below }, tier: 2 });
          left = cut! + hi2 + m2 + 1;
        }
        above = band.below;
      }
      for (const s of laid) push(s);
    }

  }
  // A block left far over its district's module gets a lane through it and the
  // ground is read again; a grown district in particular leaves such gaps.
  for (let pass = 0; pass < 3; pass++) {
    let split = 0;
    for (const b of blocks) {
      if (b.row) continue;
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
  // A local street that only cuts off a strip too narrow for a house is
  // dropped, so the plan keeps its shape but not its slivers; from the
  // boulevard age, when buildings outgrew the old plots, small scraps go too.
  // Only a through street goes; one another street stops against would leave
  // that street blind.
    for (let pass = 0; pass < 3; pass++) {
      const tol = hiA + margin(2) + 1;
      const small = (b: Block) => !b.row && (b.w < 10 || b.h < 10 || ((year ?? 0) >= 1850 && b.w * b.h < 120));
      let merged = 0;
      for (const s of [...streets]) {
        if (s.tier !== 2) continue;
        const level = across(s);
        const beside = blocks.filter((b) => {
          const [b0, b1, c0, c1] = axisOf(s) === "x"
            ? [b.x, b.x + b.w, b.y - 1, b.y + b.h]
            : [b.y, b.y + b.h, b.x - 1, b.x + b.w];
          return b1 > lo(s) && b0 < hi(s) &&
            (Math.abs(level - c0) <= tol || Math.abs(level - c1) <= tol);
        });
        if (beside.length < 2 || !beside.some(small)) continue;
        const stops = (o: Segment) => axisOf(o) !== axisOf(s) &&
          [o.a, o.b].some((p) => {
            const v = axisOf(s) === "x" ? p.x : p.y, c = axisOf(s) === "x" ? p.y : p.x;
            return Math.abs(c - level) <= tol && v > lo(s) + 1 && v < hi(s) - 1;
          });
        if (streets.some((o) => o !== s && stops(o))) continue;
        streets.splice(streets.indexOf(s), 1);
        merged++;
      }
      if (!merged) break;
      lines.clear();
      for (const s of streets) mark(s);
      readBlocks();
    }
  tidy();
  if (frame) {
    // Tidying carries street ends on to what they meet; none may cross in.
    const onFrame = (s: Segment) => axisOf(s) === "x"
      ? across(s) === frame.n || across(s) === frame.s
      : across(s) === frame.w || across(s) === frame.e;
    const sides = streets.filter(onFrame);
    for (const s of sides) streets.splice(streets.indexOf(s), 1);
    cutStreets(frameInterior!);
    streets.push(...sides);
    lines.clear();
    for (const s of streets) mark(s);
  }
  const free = (p: Point, reach: number) => {
    if (!usable) return true;
    for (let dy = -reach; dy <= reach; dy++)
      for (let dx = -reach; dx <= reach; dx++) if (!usable(p.x + dx, p.y + dy)) return false;
    return true;
  };
  // A framed town's streets all reach each other without crossing a square.
  if (form.motor || framed) {
    if (motorCore && usable)
      for (const s of streets.splice(0)) {
        let from: number | undefined;
        const reach = Math.ceil(span(s.tier) / 2) + 1;
        const clear: boolean[] = [];
        for (let v = lo(s); v <= hi(s); v++) clear[v - lo(s)] = free(point(s, v), reach);
        // A main street bridges a river: a short break that is all river
        // bank stays in the street, and the deck is laid with it.
        if (river && s.tier < 2)
          for (let i = 1; i < clear.length; i++) {
            if (clear[i] || !clear[i - 1]) continue;
            let j = i;
            const wet = (k: number) => {
              const p = point(s, lo(s) + k);
              for (let d = -reach - 1; d <= reach + 1; d++)
                for (let e = -reach - 1; e <= reach + 1; e++) if (river(p.x + d, p.y + e)) return true;
              return false;
            };
            while (j < clear.length && !clear[j] && wet(j)) j++;
            if (j < clear.length && clear[j] && j - i <= 40) clear.fill(true, i, j);
          }
        for (let v = lo(s); v <= hi(s) + 1; v++) {
          const ok = v <= hi(s) && clear[v - lo(s)];
          if (ok) from ??= v;
          else if (from !== undefined) {
            if (v - from >= 6) streets.push({ a: point(s, from), b: point(s, v - 1), tier: s.tier });
            from = undefined;
          }
        }
      }
    connectStreetComponents(streets, (p) => {
      if (!holds(p.x, p.y, 2) || (motorCore && usable && !free(p, 3))) return false;
      const spaces = [frameInterior ?? plaza, ...squares];
      if (spaces.some((r) => p.x >= r.x - 2 && p.x < r.x + r.w + 2 && p.y >= r.y - 2 && p.y < r.y + r.h + 2)) return false;
      return true;
    });
    if (motorCore) {
      // A piece nothing could reach is not a street.
      const groups = streetComponents(streets), size = new Map<number, number>();
      for (const [i, g] of groups.entries()) size.set(g, (size.get(g) ?? 0) + hi(streets[i]) - lo(streets[i]));
      const main = [...size].sort((a, b) => b[1] - a[1])[0]?.[0];
      for (let i = streets.length - 1; i >= 0; i--) if (groups[i] !== main) streets.splice(i, 1);
      // The last street: where side streets run out at the town's edge, a
      // street across their ends closes the block instead of leaving stubs.
      const meets = (s: Segment, v: number, w: number) => streets.some((o) => o !== s &&
        (axisOf(o) === axisOf(s)
          ? across(o) === w && v >= lo(o) - 1 && v <= hi(o) + 1
          : Math.abs(across(o) - v) <= 1 && w >= lo(o) - 1 && w <= hi(o) + 1));
      for (const s of [...streets])
        for (const v of [lo(s), hi(s)]) {
          if (!s.tier || meets(s, v, across(s))) continue;
          const at = (w: number) => (axisOf(s) === "x" ? { x: v, y: w } : { x: w, y: v });
          const home = axisOf(s) === "x" ? focus.y : focus.x;
          for (const dir of [Math.sign(home - across(s)) || 1, -Math.sign(home - across(s)) || -1]) {
            let w = across(s) + dir;
            while (Math.abs(w - across(s)) <= 60 && holds(at(w).x, at(w).y, -2) && (!usable || free(at(w), 3)) &&
              !streets.some((o) => o !== s && axisOf(o) === axisOf(s) && across(o) === w && v >= lo(o) - 1 && v <= hi(o) + 1)) w += dir;
            if (Math.abs(w - across(s)) > 60 || !holds(at(w).x, at(w).y, -2) || (usable && !free(at(w), 3))) continue;
            streets.push({ a: at(across(s)), b: at(w), tier: 1 });
            break;
          }
        }
    }
    lines.clear();
    for (const s of streets) mark(s);
  }
  for (const request of precincts ?? []) {
    const space = (r: Rect, q: Rect, m = 0) => r.x >= q.x + q.w + m || q.x >= r.x + r.w + m ||
      r.y >= q.y + q.h + m || q.y >= r.y + r.h + m;
    let chosen: PrecinctGround | undefined;
    for (const [w, h] of request.sizes) {
      const candidates: { ground: PrecinctGround; street: Segment; score: number }[] = [];
      for (const s of streets) {
        const horizontal = axisOf(s) === "x";
        const step = Math.max(4, Math.floor((horizontal ? w : h) / 3));
        for (let v = lo(s) + 1; v < hi(s); v += step) for (const sign of [-1, 1]) {
          const side = horizontal ? (sign > 0 ? "north" : "south") : (sign > 0 ? "west" : "east");
          if (!request.entries.includes(side)) continue;
          const street = point(s, v), dx = horizontal ? 0 : sign, dy = horizontal ? sign : 0;
          const kerb = spanOffsets(span(s.tier))[sign > 0 ? 1 : 0] + 1;
          const reach = kerb + Math.max(2, margin(s.tier));
          const entry = { x: street.x + reach * dx, y: street.y + reach * dy };
          const x = entry.x - (dx > 0 ? 0 : dx < 0 ? w - 1 : w >> 1);
          const y = entry.y - (dy > 0 ? 0 : dy < 0 ? h - 1 : h >> 1);
          const approach = { x: Math.min(entry.x, street.x + kerb * dx) - Math.abs(dy),
            y: Math.min(entry.y, street.y + kerb * dy) - Math.abs(dx),
            w: dx ? reach - kerb + 1 : 3, h: dy ? reach - kerb + 1 : 3 };
          const ground = { x, y, w, h, entry, street, approach };
          const mx = x + (w >> 1), my = y + (h >> 1);
          if (!holds(mx, my, wallMargin + 1) || !space(ground, frameInterior ?? plaza, 2) ||
              squares.some(q => !space(ground, q, 2)) ||
              grounds.some(q => q && (!space(ground, q, 2) || !space(ground, q.approach, 1) ||
                !space(approach, q, 1) || !space(approach, q.approach)))) continue;
          if (rail && [ground, approach].some(r => rail.axis === "x"
            ? r.y + r.h + 2 > rail.level && r.y - 2 < rail.level + rail.span
            : r.x + r.w + 2 > rail.level && r.x - 2 < rail.level + rail.span)) continue;
          const distance = Math.hypot(street.x - focus.x, street.y - focus.y);
          const behind = Math.max(0, (focus.x - entry.x) * dx + (focus.y - entry.y) * dy);
          const altitude = elevation?.(mx, my) ?? 0;
          const slope = elevation ? Math.max(
            Math.abs(elevation(x, y) - elevation(x + w - 1, y + h - 1)),
            Math.abs(elevation(x + w - 1, y) - elevation(x, y + h - 1))) : 0;
          const target = request.position === "outer" ? half * .58 :
            request.position === "garden" ? half * .48 : 0;
          const boundary = request.position === "wall" || request.position === "rise"
            ? Math.abs(edge(Math.atan2(my - center.y, mx - center.x)) - Math.hypot(mx - center.x, my - center.y) - Math.min(w, h) / 2 - wallMargin - 2)
            : Math.abs(distance - target);
          const score = boundary + slope * .4 + s.tier * 4 +
            (request.near ? Math.hypot(mx - request.near.x, my - request.near.y) * .38 : 0) +
            (request.position === "square" ? behind : 0) - (request.position === "rise" ? altitude * .8 : 0);
          candidates.push({ ground, street: s, score });
        }
      }
      for (const { ground: r, street } of candidates.sort((a, b) => a.score - b.score)) {
        // Keep road widths, including the shoulders of diagonal avenues.
        let crossing: Segment | undefined;
        const blocked = streets.some(s => {
          const pad = Math.ceil((span(s.tier) - 1) / 2);
          if (!overlaps(s, { x: r.x - pad, y: r.y - pad, w: w + 2 * pad, h: h + 2 * pad })) return false;
          if (!request.divertLane || crossing || s === street || s.tier === 0) return true;
          crossing = s;
          return false;
        });
        if (blocked ||
          diagonals.some(s => line(s.a, s.b).some(p => !space(r, { ...p, w: 1, h: 1 }, hiA))) ||
          rowBlocks.some(b => b.open && (!space(r, b, 1) || !space(r.approach, b)))) continue;
        let low = Infinity, high = -Infinity, ok = true;
        for (const rect of [r, r.approach]) {
          for (let y = rect.y; y < rect.y + rect.h && ok; y++) for (let x = rect.x; x < rect.x + rect.w; x++) {
            const z = elevation?.(x, y) ?? 0;
            low = Math.min(low, z); high = Math.max(high, z);
            if (!holds(x, y, wallMargin + 1) || (usable && !usable(x, y)) || high - low > 14) { ok = false; break; }
          }
        }
        if (usable && ok) {
          const [lo, hi] = spanOffsets(span(street.tier));
          for (let y = r.street.y - lo; y <= r.street.y + hi && ok; y++)
            for (let x = r.street.x - lo; x <= r.street.x + hi; x++)
              if (!usable(x, y)) { ok = false; break; }
        }
        if (!ok) continue;
        const lane = crossing;
        if (lane) {
          const horizontal = axisOf(lane) === "x", pad = Math.ceil(span(lane.tier) / 2) + 1;
          const u = (horizontal ? r.x : r.y) - pad, v = u + (horizontal ? w : h) - 1 + pad * 2;
          const sides = [(horizontal ? r.y : r.x) - pad, (horizontal ? r.y + h : r.x + w) - 1 + pad]
            .sort((a, b) => Math.abs(a - across(lane)) - Math.abs(b - across(lane)));
          // Keep both ends of a through street connected around the new precinct.
          if (lo(lane) >= u || hi(lane) <= v) continue;
          const at = (a: number, b: number) => horizontal ? { x: a, y: b } : { x: b, y: a };
          const route = sides.map(side => [point(lane, u), at(u, side), at(v, side), point(lane, v)])
            .find(points => points.slice(1).every((q, i) => line(points[i], q).every(p => {
              const shoulder = { x: p.x - pad + 1, y: p.y - pad + 1, w: pad * 2 - 1, h: pad * 2 - 1 };
              return holds(p.x, p.y, wallMargin + pad) && free(p, pad) &&
                space(shoulder, plaza, 1) && squares.every(s => space(shoulder, s, 1)) &&
                rowBlocks.every(b => !b.open || space(shoulder, b, 1)) &&
                grounds.every(g => !g || space(shoulder, g, 1) && space(shoulder, g.approach)) &&
                (!rail || (rail.axis === "x" ? Math.abs(p.y - rail.level) : Math.abs(p.x - rail.level)) > rail.span + pad);
            })));
          if (!route) continue;
          const points = [point(lane, lo(lane)), ...route, point(lane, hi(lane))];
          streets.splice(streets.indexOf(lane), 1, ...points.slice(1).map((b, i) => ({ a: points[i], b, tier: lane.tier })));
          lines.clear();
          for (const s of streets) mark(s);
        }
        chosen = r;
        break;
      }
      if (chosen) break;
    }
    grounds.push(chosen);
    if (chosen) {
      const r = chosen;
      for (const b of [...rowBlocks]) {
        if (space(r, b) && space(r.approach, b)) continue;
        const left = Math.min(r.x, r.approach.x), right = Math.max(r.x + r.w, r.approach.x + r.approach.w);
        const sides = [{ ...b, w: left - 1 - b.x }, { ...b, x: right + 1, w: b.x + b.w - right - 1 }];
        rowBlocks.splice(rowBlocks.indexOf(b), 1, ...sides.filter(q => q.w >= 10));
      }
    }
  }
  readBlocks();
  for (const b of blocks) {
    const key = `${b.x},${b.y}`;
    b.court = !b.row && b.w >= 13 && b.h >= 11 && rand(key, "court") < form.courts;
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
  const verges: Verge[] = [];
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
        verges.push({ ...r, axis: axisOf(s), side });
        if (!wants("tree") || motorCore) continue;
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
  // A motor-age street keeps its furniture in the strip at the kerb, on a beat.
  if (motorCore)
    for (const s of streets) {
      if (s.tier > 1) continue;
      const [slo, shi] = spanOffsets(span(s.tier));
      for (const side of [-1, 1]) {
        const row = across(s) + (side < 0 ? -slo - 1 : shi + 1);
        for (let v = lo(s) + 2; v <= hi(s) - 2; v++) {
          // A lamp every twenty-four cells a side, the sides staggered; on
          // a main street a tree at each quarter between.
          const beat = (((v + (side < 0 ? 0 : 12)) % 24) + 24) % 24;
          if (beat % 6 || (beat && (beat === 12 || s.tier || !wants("tree")))) continue;
          const [x, y] = axisOf(s) === "x" ? [v, row] : [row, v];
          if (!holds(x, y, 1) || lines.has(cellKey(x, y))) continue;
          if (streets.some((o) => axisOf(o) !== axisOf(s) && Math.abs(across(o) - v) <= span(o.tier) / 2 + 3 &&
            row >= lo(o) - 4 && row <= hi(o) + 4)) continue;
          furniture.push({ kind: beat ? "tree" : "lamp", x, y });
        }
      }
    }
  else if (wants("lamp") || lit) {
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
    plazaFront,
    plazaCourt,
    squares,
    grounds,
    verges,
    furniture,
    half,
    tiers,
    edge,
    holds,
    wall: circuit(),
    rail,
    oldCore,
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
    const edges: Segment[] = [...(cornerSquare || frame ? [] : [plaza]), ...squares].flatMap((r) => {
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
          if (across(o) !== level) continue;
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
      const touching = xs.filter((c) => Math.abs(c.at - end) <= c.reach)
        .sort((a, b) => Math.abs(a.at - end) - Math.abs(b.at - end))[0];
      if (touching) return touching.at;
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
    if (!outline || form.wall === "none") return;
    const openings = new Set<string>();
    const gateOf = new Map<string, number>();
    for (const [g, gate] of gates.entries())
      for (let d = -loA - 1; d <= hiA + 1; d++) {
        const k =
          gate.axis === "x"
            ? cellKey(gate.point.x, gate.point.y + d)
            : cellKey(gate.point.x + d, gate.point.y);
        openings.add(k);
        gateOf.set(k, g);
      }
    const gaps: Point[][] = gates.map(() => []);
    const { corners } = outline;
    const visited = new Map<string, number>();
    const cells: Point[] = [];
    const ring: Point[] = [];
    let lo = { x: Infinity, y: Infinity },
      hi = { x: -Infinity, y: -Infinity };
    for (const [i, a] of corners.entries())
      for (const q of directLine(a, corners[(i + 1) % corners.length]).slice(0, -1)) {
        const key = cellKey(q.x, q.y);
        let keep = visited.get(key) ?? ring.length;
        // Clip tiny loops where the two rasterized sides of a sharp bend touch.
        // The seam at index zero is midway across a straight gate frontage.
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const j = visited.get(cellKey(q.x + dx, q.y + dy));
          if (j !== undefined && j > 0) keep = Math.min(keep, j + 1);
        }
        while (ring.length > keep) {
          const p = ring.pop()!;
          visited.delete(cellKey(p.x, p.y));
        }
        visited.set(key, ring.length);
        ring.push(q);
      }
    // Start on standing wall so a gate that crosses the seam keeps both jambs in order.
    const first = ring.findIndex(p => !openings.has(cellKey(p.x, p.y)));
    if (first < 0) return;
    ring.push(...ring.splice(0, first));
    for (const q of ring) {
      const key = cellKey(q.x, q.y);
      lo = { x: Math.min(lo.x, q.x), y: Math.min(lo.y, q.y) };
      hi = { x: Math.max(hi.x, q.x), y: Math.max(hi.y, q.y) };
      if (!openings.has(key)) cells.push(q);
      else gaps[gateOf.get(key)!].push(q);
    }
    if (!cells.length) return;
    return {
      // Ming builders faced the old rammed-earth circuits in brick.
      material: form.wall === "brick" && (year ?? 0) < 1368 ? "earth" : form.wall,
      rect: { ...lo, w: hi.x - lo.x + 1, h: hi.y - lo.y + 1 },
      cells,
      openings,
      gates: gaps.flatMap((opening, i) => {
        if (!opening.length) return [];
        const { nx, ny } = gates[i];
        opening.sort((a, b) => a.y - b.y || a.x - b.x);
        const first = opening[0], last = opening[opening.length - 1];
        const dx = Math.abs(ny), dy = Math.abs(nx);
        return [{ opening, outward: { x: nx, y: ny }, covered: false,
          jambs: [{ x: first.x - dx, y: first.y - dy }, { x: last.x + dx, y: last.y + dy }] }];
      }),
      ring,
      bends: outline.bends,
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

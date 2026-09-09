import { random } from "../../core/random";
import type { Point } from "../../core/types";
import type { UrbanForm } from "../../content/settlements/urban-form/types";
import { urbanFootprint } from "../../content/settlements/scale";
import { line } from "./roads";
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
export type UrbanLayout = {
  gates: Gate[];
  streets: Segment[];
  blocks: Block[];
  plaza: Rect;
  half: number;
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

/** Axis-aligned street network and block partition for one settlement.
 * Cheap by construction: every street is a straight segment and every block is
 * a rectangle, so no graph search runs here and the whole pass is linear in the
 * number of blocks. Terrain is not consulted; the caller drops what will not
 * fit, which leaves open ground rather than a building across a real road. */
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
): UrbanLayout {
  const half = urbanFootprint(radius, form);
  const rand = (...keys: (string | number)[]) =>
    random(seed, siteId, "compose", ...keys);
  const gates = urbanGates(siteId, center, radius, form);

  // --- The built edge -------------------------------------------------------
  // The shape a fabric would take on open ground, before terrain has a say. A
  // grid was laid out as a rectangle and a grown town was not, so the two do
  // not get the same outline. Nothing here is a circle.
  const BEARINGS = 72;
  const ideal = (() => {
    if (form.plan === "orthogonal" || form.plan === "linear") {
      const stretch = form.plan === "linear" ? 1.75 : 1 + rand("aspect") * 0.34;
      const turned =
        form.plan === "linear" ? gates[0].axis === "y" : rand("turn") < 0.5;
      const along = half,
        across = half / stretch;
      const a = turned ? across : along,
        b = turned ? along : across;
      return (angle: number) =>
        Math.min(
          Math.abs(a / Math.cos(angle)) || Infinity,
          Math.abs(b / Math.sin(angle)) || Infinity,
        );
    }
    // A grown circuit wanders. Three harmonics keep it smooth and closed.
    const swing =
      form.plan === "radial" ? 0.1 : 0.14 + 0.12 * (1 - form.regularity);
    const phase = [0, 1, 2].map((k) => rand("shape", k) * Math.PI * 2);
    return (angle: number) =>
      half *
      (1 +
        swing *
          (0.6 * Math.sin(2 * angle + phase[0]) +
            0.28 * Math.sin(3 * angle + phase[1]) +
            0.16 * Math.sin(5 * angle + phase[2])));
  })();

  const bearing = (i: number) =>
    ((i + BEARINGS) % BEARINGS) * ((Math.PI * 2) / BEARINGS);
  // Cast outward on each bearing and stop at the last cell that holds. Terrain
  // decides where a wall can actually stand; the ideal shape only says where it
  // would like to.
  const radii = Array.from({ length: BEARINGS }, (_, i) => {
    const angle = bearing(i);
    // Not clamped to the footprint radius: that radius is the half-extent of a
    // rectangle, and clamping its diagonal to it is exactly what turns every
    // outline back into a disc.
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
  const streets: Segment[] = [];
  const [arterial, street, lane] = form.tiers;
  const width = (tier: Tier) => [arterial, street, lane][tier];
  const bounds = {
    x: center.x - half,
    y: center.y - half,
    w: half * 2 + 1,
    h: half * 2 + 1,
  };

  const walled = hasCircuit(form, radius);
  const margin = walled ? arterial + 1 : 0;
  /** Pull `v` back along `axis` until it lies inside the built edge. The edge is
   * not a circle, so there is no closed form for it; walking in from the far end
   * is exact and costs at most the length of the street. */
  const inside = (v: number, axis: "x" | "y", fixed: number) => {
    const origin = axis === "x" ? center.x : center.y;
    const step = v >= origin ? -1 : 1;
    let out = v;
    while (
      out !== origin &&
      !holds(axis === "x" ? out : fixed, axis === "x" ? fixed : out, margin)
    )
      out += step;
    return out;
  };

  // The plaza is placed before the arterials so they can terminate on it. Its
  // scale is read against the radius, not the width: against the width a fifth
  // put a third of the town under one square, which is a parade ground rather
  // than a market place.
  const size = Math.max(7, even(half * form.plazaScale) + 1);
  // A direction, whatever length the caller's vector had.
  if (plazaBias) {
    const length = Math.hypot(plazaBias.x, plazaBias.y) || 1;
    plazaBias = { x: plazaBias.x / length, y: plazaBias.y / length };
  }
  const bias =
    form.plaza === "waterfront" && plazaBias
      ? plazaBias
      : form.plaza === "offset" && plazaBias
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
    form.plaza === "crossing" ? 0 : half * (form.plaza === "gate" ? 0.72 : 0.3);
  const focus = {
    x: center.x + even(bias.x * offset),
    y: center.y + even(bias.y * offset),
  };
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
  function squareUsable(at: Point, size: number) {
    for (let y = at.y - (size >> 1) - 2; y <= at.y + (size >> 1) + 2; y++)
      for (let x = at.x - (size >> 1) - 2; x <= at.x + (size >> 1) + 2; x++)
        if (!usable!(x, y)) return false;
    return true;
  }

  // Arterials: one axis-aligned run per gate, bent where the fabric is irregular
  // so the network does not collapse into a single central crossing.
  const cuts = { x: new Set<number>(), y: new Set<number>() };
  for (const [i, gate] of gates.entries()) {
    const along = gate.axis;
    const across = along === "x" ? "y" : "x";
    // Straight to the plaza's own centreline when the plan allows it.
    const target = along === "x" ? focus.y : focus.x;
    const startAcross = along === "x" ? gate.point.y : gate.point.x;
    const legs =
      form.plan === "organic"
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
        form.plan === "organic" && leg < legs - 1
          ? Math.round(
              startAcross +
                (target - startAcross) * t +
                even(
                  (rand("bend", i, leg) - 0.5) *
                    half *
                    0.4 *
                    (1 - form.regularity),
                ),
            )
          : target;
      const turned =
        along === "x" ? { x: turn, y: bendTarget } : { x: bendTarget, y: turn };
      streets.push({ a: next, b: turned, tier: 0 });
      cuts[across].add(bendTarget);
      cursor = turned;
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
  // from the block module, not from the settlement's size alone: a large-ward
  // fabric gets few wide avenues where a lane fabric gets several.
  for (const axis of ["x", "y"] as const) {
    if (form.plan === "linear" && axis !== gates[0].axis) continue;
    const module =
      (axis === "x" ? form.block[0] : form.block[1]) + arterial * 2;
    const count = Math.min(4, Math.floor((half * 2) / (module * 2.5)));
    for (let i = 1; i <= count; i++) {
      const at =
        (axis === "x" ? center.x : center.y) +
        even(
          -half +
            (half * 2 * i) / (count + 1) +
            (rand("avenue", axis, i) - 0.5) * module * (1 - form.regularity),
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

  // Quarters between the arterials, then blocks inside each quarter.
  // Every bend in an arterial contributes a cut, so on an irregular fabric the
  // raw set is dense enough that almost every quarter came out under the
  // eight-cell minimum and was dropped: a medina turned a fifth of its extent
  // into block. Cuts closer together than a block are merged.
  const edges = (axis: "x" | "y") => {
    const lo = axis === "x" ? bounds.x : bounds.y;
    const hi = lo + (axis === "x" ? bounds.w : bounds.h) - 1;
    const least = (axis === "x" ? form.block[0] : form.block[1]) * 0.7;
    const kept: number[] = [lo];
    for (const v of [...cuts[axis]].sort((a, b) => a - b))
      if (v > lo + 6 && v < hi - 6 && v - kept[kept.length - 1] >= least)
        kept.push(v);
    if (hi - kept[kept.length - 1] < least && kept.length > 1) kept.pop();
    return [...kept, hi];
  };
  const xs = edges("x"),
    ys = edges("y");
  const inset = arterial + 1;
  const blocks: Block[] = [];
  const quarters: Rect[] = [];
  for (let j = 1; j < ys.length; j++)
    for (let i = 1; i < xs.length; i++) {
      const rect = {
        x: xs[i - 1] + inset,
        y: ys[j - 1] + inset,
        w: xs[i] - xs[i - 1] - inset * 2,
        h: ys[j] - ys[j - 1] - inset * 2,
      };
      if (rect.w < 8 || rect.h < 8) continue;
      quarters.push(...subtract(rect, plaza, arterial + 1));
    }

  // A settlement is built up to its edge and not past it. The test is on the
  // block's middle, not its corners: a block that overhangs still holds ranges
  // on its inner sides, and each parcel is put to the ground individually.
  const enclosed = (r: Rect) => holds(r.x + r.w / 2, r.y + r.h / 2, margin);

  for (const [q, quarter] of quarters.entries()) subdivide(quarter, 0, `q${q}`);

  function subdivide(rect: Rect, depth: number, key: string) {
    const [bw, bh] = form.block;
    const horizontal = rect.w / bw >= rect.h / bh;
    const size = horizontal ? rect.w : rect.h;
    const target = horizontal ? bw : bh;
    const tier: Tier = depth === 0 ? 1 : 2;
    const gap = width(tier) * 2 + 1;
    // Split only while splitting brings the parts closer to the target than
    // leaving the block whole would; otherwise blocks drift to twice the module.
    const parts = Math.max(1, Math.round(size / target));
    if (parts < 2 || depth >= 5) return accept(rect, depth, key);
    const positions =
      form.regularity > 0.8
        ? Array.from({ length: parts - 1 }, (_, i) =>
            Math.round((size * (i + 1)) / parts),
          )
        : [
            Math.round(
              size *
                (0.5 + (rand(key, "cut") - 0.5) * (1 - form.regularity) * 0.66),
            ),
          ];
    const lo = horizontal ? rect.x : rect.y;
    let start = 0;
    for (const [i, at] of [...positions, size].entries()) {
      const child = horizontal
        ? {
            x: lo + start,
            y: rect.y,
            w: at - start - (i < positions.length ? gap : 0),
            h: rect.h,
          }
        : {
            x: rect.x,
            y: lo + start,
            w: rect.w,
            h: at - start - (i < positions.length ? gap : 0),
          };
      if (child.w >= 8 && child.h >= 8)
        subdivide(child, depth + 1, `${key}.${i}`);
      if (i < positions.length) {
        // The gap is [at - gap, at); the street sits in the middle of it.
        // Centred on `at - width` it overran the next block's first row.
        const line = lo + at - width(tier) - 1;
        // Overrun by the inset so the split meets the streets bounding the
        // quarter, but never past the circuit: only a gate breaches that.
        streets.push(
          horizontal
            ? {
                a: { x: line, y: inside(rect.y - inset, "y", line) },
                b: { x: line, y: inside(rect.y + rect.h + inset, "y", line) },
                tier,
              }
            : {
                a: { x: inside(rect.x - inset, "x", line), y: line },
                b: { x: inside(rect.x + rect.w + inset, "x", line), y: line },
                tier,
              },
        );
      }
      start = at;
    }
  }

  function accept(rect: Rect, depth: number, key: string) {
    const court =
      rect.w >= 13 && rect.h >= 11 && rand(key, "court") < form.courts;
    // A blind alley is the only way into a courted compound. Depth is not the
    // test: what matters is whether this interior opens onto the street or only
    // onto its own residents' passage.
    const alley = court && rand(key, "dead") < form.deadEnds;
    const mid = rect.x + (rect.w >> 1);
    if (!enclosed(rect)) return;
    blocks.push({
      ...rect,
      depth,
      reach:
        Math.max(
          Math.abs(rect.x + rect.w / 2 - focus.x),
          Math.abs(rect.y + rect.h / 2 - focus.y),
        ) / half,
      court,
      lane: alley
        ? {
            a: { x: mid, y: rect.y + rect.h + inset },
            b: { x: mid, y: rect.y + rect.h - 3 },
            tier: 2,
          }
        : undefined,
    });
  }

  return { gates, streets, blocks, plaza, half, edge, holds, wall: circuit() };

  /** The circuit follows the built edge, which is the fabric's own outline
   * pulled in wherever the ground refused it. Consecutive boundary points are
   * joined with cardinal steps, so the ring is closed and cannot be walked
   * through diagonally. Each gate is opened wide enough for its arterial. */
  function circuit(): Wall | undefined {
    if (!walled || form.wall === "none") return;
    const openings = new Set<string>();
    for (const gate of gates)
      for (let d = -arterial - 1; d <= arterial + 1; d++)
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
    hi = 110;
  while (hi - lo > 2) {
    const mid = Math.round((lo + hi) / 2);
    if (offered(mid) >= target) hi = mid;
    else lo = mid;
  }
  return hi;
}

/** `rect` with `hole` and its street margin removed, as up to four disjoint
 * rectangles. Keeping only the two largest strips, as this once did, silently
 * discarded most of every quarter the public square touched: a medina turned
 * barely a fifth of its extent into block. */
function subtract(rect: Rect, hole: Rect, margin: number): Rect[] {
  const h = {
    x: hole.x - margin,
    y: hole.y - margin,
    w: hole.w + margin * 2,
    h: hole.h + margin * 2,
  };
  const right = rect.x + rect.w,
    bottom = rect.y + rect.h;
  if (
    h.x >= right ||
    h.y >= bottom ||
    h.x + h.w <= rect.x ||
    h.y + h.h <= rect.y
  )
    return [rect];
  // Two full-height side strips, then the band between them split above and
  // below the hole. Guillotine cuts, so nothing overlaps and nothing is lost.
  const bandX = Math.max(rect.x, h.x),
    bandRight = Math.min(right, h.x + h.w);
  return [
    { x: rect.x, y: rect.y, w: h.x - rect.x, h: rect.h },
    { x: h.x + h.w, y: rect.y, w: right - (h.x + h.w), h: rect.h },
    { x: bandX, y: rect.y, w: bandRight - bandX, h: h.y - rect.y },
    {
      x: bandX,
      y: h.y + h.h,
      w: bandRight - bandX,
      h: bottom - (h.y + h.h),
    },
  ].filter((r) => r.w >= 8 && r.h >= 8);
}

import { random } from "../../core/random";
import type { Point } from "../../core/types";
import type { UrbanForm } from "../../content/settlements/urban-form/types";
import { urbanFootprint } from "../../content/settlements/scale";
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

/** Where through routes should meet the built edge. Pure in the site's own
 * identity so the regional road layer and the local planner agree without
 * either of them building the other's geometry. */
export function urbanGates(
  siteId: string,
  center: Point,
  radius: number,
  form: UrbanForm,
): Gate[] {
  const half = urbanFootprint(radius);
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
    const along =
      form.wall === "none"
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
): UrbanLayout {
  const half = urbanFootprint(radius);
  const rand = (...keys: (string | number)[]) =>
    random(seed, siteId, "compose", ...keys);
  const gates = urbanGates(siteId, center, radius, form);
  const streets: Segment[] = [];
  const [arterial, street, lane] = form.tiers;
  const width = (tier: Tier) => [arterial, street, lane][tier];
  const bounds = {
    x: center.x - half,
    y: center.y - half,
    w: half * 2 + 1,
    h: half * 2 + 1,
  };

  // The plaza is placed before the arterials so they can terminate on it.
  const size = Math.max(7, even(half * 2 * form.plazaScale) + 1);
  const bias =
    form.plaza === "waterfront" && plazaBias
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
  const plaza = {
    x: focus.x - (size >> 1),
    y: focus.y - (size >> 1),
    w: size,
    h: size,
  };

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
      const edge = form.wall === "none" ? 0 : arterial + 1;
      streets.push(
        axis === "x"
          ? {
              a: { x: at, y: bounds.y + edge },
              b: { x: at, y: bounds.y + bounds.h - 1 - edge },
              tier: 0,
            }
          : {
              a: { x: bounds.x + edge, y: at },
              b: { x: bounds.x + bounds.w - 1 - edge, y: at },
              tier: 0,
            },
      );
    }
  }

  /** Clamped clear of the circuit, which has no opening here. */
  const margin = form.wall === "none" ? 0 : arterial + 1;
  const inside = (v: number, axis: "x" | "y") =>
    Math.min(
      Math.max(v, (axis === "x" ? bounds.x : bounds.y) + margin),
      (axis === "x" ? bounds.x + bounds.w : bounds.y + bounds.h) - 1 - margin,
    );

  // Quarters between the arterials, then blocks inside each quarter.
  const edges = (axis: "x" | "y") => {
    const lo = axis === "x" ? bounds.x : bounds.y;
    const hi = lo + (axis === "x" ? bounds.w : bounds.h) - 1;
    return [
      lo,
      ...[...cuts[axis]].filter((v) => v > lo + 6 && v < hi - 6),
      hi,
    ].sort((a, b) => a - b);
  };
  const xs = edges("x"),
    ys = edges("y");
  const inset = arterial + 2;
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

  // A walled settlement is built up to its wall and not past it.
  const walled = form.wall !== "none";
  const enclosed = (r: Rect) =>
    !walled ||
    [
      [r.x, r.y],
      [r.x + r.w - 1, r.y],
      [r.x, r.y + r.h - 1],
      [r.x + r.w - 1, r.y + r.h - 1],
    ].every(
      ([x, y]) => Math.hypot(x - center.x, y - center.y) <= half - arterial - 1,
    );

  for (const [q, quarter] of quarters.entries()) subdivide(quarter, 0, `q${q}`);

  function subdivide(rect: Rect, depth: number, key: string) {
    const [bw, bh] = form.block;
    const horizontal = rect.w / bw >= rect.h / bh;
    const size = horizontal ? rect.w : rect.h;
    const target = horizontal ? bw : bh;
    const tier: Tier = depth === 0 ? 1 : 2;
    const gap = width(tier) * 2 + 2;
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
        const line = lo + at - Math.floor(gap / 2);
        // Overrun by the inset so the split meets the streets bounding the
        // quarter, but never past the circuit: only a gate breaches that.
        streets.push(
          horizontal
            ? {
                a: { x: line, y: inside(rect.y - inset, "y") },
                b: { x: line, y: inside(rect.y + rect.h + inset, "y") },
                tier,
              }
            : {
                a: { x: inside(rect.x - inset, "x"), y: line },
                b: { x: inside(rect.x + rect.w + inset, "x"), y: line },
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

  return { gates, streets, blocks, plaza, half, wall: circuit() };

  /** The circuit runs at the edge of the built extent. It is a ring rather than
   * a rectangle because the ground a settlement is allowed to occupy is bounded
   * by its distance from the centre: a square circuit of the same half-extent
   * puts its corners outside the site altogether, and only its four mid-edge
   * arcs would ever be built. Each gate is opened wide enough for its arterial. */
  function circuit(): Wall | undefined {
    if (form.wall === "none") return;
    const openings = new Set<string>();
    for (const gate of gates)
      for (let d = -arterial - 1; d <= arterial + 1; d++)
        openings.add(
          gate.axis === "x"
            ? cellKey(gate.point.x, gate.point.y + d)
            : cellKey(gate.point.x + d, gate.point.y),
        );
    // One cell per column and per row, so the ring is closed under cardinal
    // steps and cannot be walked through diagonally.
    const seen = new Set<string>();
    const cells: Point[] = [];
    const put = (x: number, y: number) => {
      const key = cellKey(x, y);
      if (seen.has(key)) return;
      seen.add(key);
      if (!openings.has(key)) cells.push({ x, y });
    };
    for (let d = -half; d <= half; d++) {
      const across = Math.round(Math.sqrt(Math.max(0, half * half - d * d)));
      put(center.x + d, center.y + across);
      put(center.x + d, center.y - across);
      put(center.x + across, center.y + d);
      put(center.x - across, center.y + d);
    }
    return {
      material: form.wall,
      rect: {
        x: center.x - half,
        y: center.y - half,
        w: half * 2 + 1,
        h: half * 2 + 1,
      },
      cells,
      openings,
    };
  }
}

/** Largest parts of `rect` left once `hole` and its street margin are removed.
 * Keeps the two widest strips rather than a full rectangle decomposition; the
 * discarded slivers would be too shallow to hold a building anyway. */
function subtract(rect: Rect, hole: Rect, margin: number): Rect[] {
  const h = {
    x: hole.x - margin,
    y: hole.y - margin,
    w: hole.w + margin * 2,
    h: hole.h + margin * 2,
  };
  if (
    h.x >= rect.x + rect.w ||
    h.y >= rect.y + rect.h ||
    h.x + h.w <= rect.x ||
    h.y + h.h <= rect.y
  )
    return [rect];
  const strips: Rect[] = [
    { x: rect.x, y: rect.y, w: h.x - rect.x, h: rect.h },
    {
      x: h.x + h.w,
      y: rect.y,
      w: rect.x + rect.w - (h.x + h.w),
      h: rect.h,
    },
    { x: rect.x, y: rect.y, w: rect.w, h: h.y - rect.y },
    {
      x: rect.x,
      y: h.y + h.h,
      w: rect.w,
      h: rect.y + rect.h - (h.y + h.h),
    },
  ].filter((r) => r.w >= 8 && r.h >= 8);
  strips.sort((a, b) => b.w * b.h - a.w * a.h);
  // The best strip plus the best perpendicular one; together they never overlap
  // each other's short side by more than the plaza margin already removed.
  const first = strips[0];
  if (!first) return [];
  const second = strips.find(
    (r) => r !== first && (r.w === rect.w) !== (first.w === rect.w),
  );
  return second
    ? [first, clip(second, first)].filter((r) => r.w >= 8 && r.h >= 8)
    : [first];
}

/** Trim `r` clear of `keep` along whichever axis costs least area. */
function clip(r: Rect, keep: Rect): Rect {
  const ox = Math.min(r.x + r.w, keep.x + keep.w) - Math.max(r.x, keep.x);
  const oy = Math.min(r.y + r.h, keep.y + keep.h) - Math.max(r.y, keep.y);
  if (ox <= 0 || oy <= 0) return r;
  if (r.w > r.h) {
    return r.x < keep.x
      ? { ...r, w: keep.x - r.x }
      : { ...r, x: keep.x + keep.w, w: r.x + r.w - (keep.x + keep.w) };
  }
  return r.y < keep.y
    ? { ...r, h: keep.y - r.y }
    : { ...r, y: keep.y + keep.h, h: r.y + r.h - (keep.y + keep.h) };
}

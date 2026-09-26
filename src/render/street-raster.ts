import { pavingGrade, pavingStonePixel } from "./paving-stones";
import { carriagewayPixel } from "./carriageway";
import { kerbed, paved, pavingMask, roadwayMaterial, wornEdge } from "./paving-edge";
import type { TopographySample } from "../core/topography";
import type { StreetMaterial } from "../content/settlements/streets";
import type { GroundTileData } from "./habitat-raster";
import { waterHash as hash } from "./water-style";
const mod = (n: number, d: number) => ((n % d) + d) % d;
type RGB = readonly number[];
const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
/** A hue-shifted value step: light warms toward straw, shade cools toward
 * slate, so an edge reads as lit stone rather than a lighter grey. */
const lit = (c: RGB, v: number): RGB => {
  const k = v * 13;
  return [clamp(c[0] + k + v * 3), clamp(c[1] + k + v), clamp(c[2] + k - v * 4)];
};
const mix = (a: RGB, b: RGB, t: number): RGB => a.map((v, i) => v + (b[i] - v) * t);
const GRIT: RGB = [150, 136, 106];
/** Each material's dressed edge course: the mean of its own face, so an edge
 * is the same stone cut long, not a pale band laid round everything. */
const COURSE: Record<StreetMaterial, RGB> = {
  slab: [176, 171, 150],
  basalt: [132, 141, 139],
  cobble: [154, 151, 139],
  sett: [146, 153, 155],
  brick: [150, 100, 70],
  asphalt: [150, 152, 148],
  concrete: [170, 172, 164],
  plank: [120, 90, 60],
};
// Brick and asphalt streets were kerbed in stone, not in themselves.
const kerbStone = (m: StreetMaterial) =>
  m === "brick" ? COURSE.slab : m === "asphalt" ? COURSE.sett : COURSE[m];

type Side = "n" | "s" | "w" | "e";
/** Where paving simply ends: an outline, a lit lip on the sides that face the
 * light, and on the south side the slab's own thickness. */
function cutEdge(side: Side, d: number, course: RGB, face: RGB): RGB {
  if (side === "s")
    return d === 0 ? lit(course, -4) : d === 1 ? lit(course, -2) : lit(face, 1);
  if (d === 0) return lit(course, -3);
  if (d === 1) return lit(course, side === "e" ? -1 : 2);
  return side === "e" ? face : lit(face, 1);
}

/** A raised kerb of long dressed stones (or a timber sill), `d` pixels in from
 * the footway it retains. The oblique view shows the south-facing kerb's
 * front: lit top, bright arris, shaded face, a contact line and a soft
 * occlusion shadow on the road. Elsewhere only the top shows, creased where
 * it meets the road, and the west kerb casts its shadow east. */
function kerbTone(
  side: Side,
  d: number,
  along: number,
  diagonal: number,
  stone: RGB,
  road: RGB,
  timber: boolean,
): RGB | undefined {
  const span = timber ? 31 : 13;
  const at = mod(along + Math.floor(courseOffset(side) * span), span);
  const joint = at === 0;
  const pit = hash(along, d, 953);
  const texture = timber
    ? hash(Math.floor(along / 3), d, 955) > 0.75 ? -1 : 0
    : pit > 0.9 ? -1 : pit < 0.06 ? 1 : 0;
  const block = (v: number) =>
    joint ? lit(stone, Math.min(v, 0) - 2) : lit(stone, v + texture);
  // A timber sill is pegged to its posts where each length meets the next.
  const peg = timber && (at === 3 || at === span - 3);
  const profile: Record<Side, (RGB | undefined)[]> = {
    n: [
      lit(stone, -3),
      block(2),
      joint ? lit(stone, -2) : lit(stone, 3),
      block(-1),
      block(-2),
      lit(mix(stone, road, 0.5), -4),
      lit(road, -2),
      diagonal % 2 ? lit(road, -1) : undefined,
    ],
    s: [block(1), block(2), block(1), lit(stone, -3), diagonal % 2 ? lit(road, -1) : undefined],
    w: [block(0), block(1), block(0), lit(stone, -3), lit(road, -2), diagonal % 2 ? lit(road, -1) : undefined],
    e: [block(0), block(0), joint ? lit(stone, -1) : lit(stone, 2), lit(stone, -3)],
  };
  const tone = profile[side][d];
  return peg && tone && d === 1 ? lit(stone, -4) : tone;
}
const courseOffset = (side: Side) => ({ n: 0.1, s: 0.55, w: 0.3, e: 0.8 })[side];
export { wornEdge };
/** Shared native-pixel paving materials. Place/date selection happens in content. */
export function rasterStreetTile(
  sample: TopographySample,
  x: number,
  y: number,
  ox: number,
  oy: number,
): GroundTileData {
  const c = sample(x, y)!,
    kerb = kerbed(sample, x, y),
    material =
      (c.pavement === "footway" && !kerb
        ? roadwayMaterial(sample, x, y)
        : undefined) ??
      c.streetMaterial ??
      "slab",
    grade = pavingGrade(c.pavement),
    pixels = new Uint8ClampedArray(1024);
  const dais = c.pavement === "dais";
  const at = (dx: number, dy: number) => sample(x + dx, y + dy);
  const edge = (dx: number, dy: number) => !paved(at(dx, dy));
  // A dais edge is a step down to ordinary paving; the platform itself is
  // continuous across its cells.
  const step = (dx: number, dy: number) =>
    dais && at(dx, dy)?.pavement !== "dais";
  // A kerb stone sits on the roadway where it meets a raised footway or a
  // planted verge; a footway meeting a verge gets one too.
  const kerbTo = (dx: number, dy: number) => {
    const n = at(dx, dy);
    return (
      !dais &&
      !!n &&
      n.pavement !== "dais" &&
      n.height === c.height &&
      (n.pavement === "verge" ||
        (c.pavement !== "footway" && kerbed(sample, x + dx, y + dy)))
    );
  };
  const kerbN = kerbTo(0, -1),
    kerbS = kerbTo(0, 1),
    kerbW = kerbTo(-1, 0),
    kerbE = kerbTo(1, 0);
  // A raised footway keeps a cut kerb; every other street edge wears into the
  // ground beside it, along the mask's contour rather than the cell's.
  const mask = kerb || dais ? undefined : pavingMask(sample, x, y, ox, oy);
  const worn = (dx: number, dy: number) => !kerb && wornEdge(at(dx, dy));
  const cut = (dx: number, dy: number) =>
    edge(dx, dy) && !(mask && worn(dx, dy));
  const north = cut(0, -1) && !kerbN,
    south = cut(0, 1) && !kerbS,
    west = cut(-1, 0) && !kerbW,
    east = cut(1, 0) && !kerbE;
  const stepN = step(0, -1),
    stepS = step(0, 1),
    stepW = step(-1, 0),
    stepE = step(1, 0);
  const lane =
    !c.pavement && (material === "asphalt" || material === "concrete")
      ? c.lane
      : undefined;
  const shadowed = !dais && at(0, -1)?.pavement === "dais",
    shadowedE = !dais && at(-1, 0)?.pavement === "dais";
  for (let py = 0; py < 16; py++)
    for (let px = 0; px < 16; px++) {
      const wx = (x + ox) * 16 + px,
        wy = (y + oy) * 16 + py;
      const straight = Math.min(
        north ? py : 99,
        south ? 15 - py : 99,
        west ? px : 99,
        east ? 15 - px : 99,
      );
      const inside = mask ? mask(px, py) : 99;
      // Outside the contour the ground shows through.
      if (inside < 0) continue;
      const border = Math.min(straight, Math.floor(inside));
      let tone: readonly number[];
      const nearest =
        inside < straight
          ? true
          : border === (north ? py : 99)
          ? worn(0, -1)
          : border === (south ? 15 - py : 99)
            ? worn(0, 1)
            : border === (west ? px : 99)
              ? worn(-1, 0)
              : worn(1, 0);
      if (material === "brick") {
        const w = 8,
          h = 4,
          row = Math.floor(wy / h);
        const a = mod(wx + (row % 2) * Math.floor(w / 2), w),
          b = mod(wy, h);
        const v = hash(Math.floor((wx + ((row % 2) * w) / 2) / w), row, 391);
        const base = [156, 98, 65];
        const light =
          a === 1 || b === 1
            ? 7
            : a === w - 1 || b === h - 1
              ? -7
              : Math.floor(v * 12) - 6;
        tone =
          a === 0 || b === 0 ? [132, 130, 112] : base.map((n) => n + light);
      } else {
        tone = pavingStonePixel(
          wx,
          wy,
          material,
          grade,
          (north || south) && !(west || east),
        );
      }
      if (lane) {
        const alongX = lane.axis === "x";
        tone = carriagewayPixel(
          tone,
          lane,
          lane.at * 16 + (alongX ? py : px),
          alongX ? wx : wy,
          alongX ? wy : wx,
          {
            low: lane.at === 0 && (alongX ? kerbN : kerbW),
            high: lane.at === lane.span - 1 && (alongX ? kerbS : kerbE),
          },
        );
      }
      const course = COURSE[material];
      if (border < 3 && !nearest)
        tone = cutEdge(
          border === (north ? py : 99)
            ? "n"
            : border === (south ? 15 - py : 99)
              ? "s"
              : border === (west ? px : 99)
                ? "w"
                : "e",
          border,
          course,
          tone,
        );
      // Where two pavings meet, each is finished with a dressed course of its
      // own stone behind a shared joint, rather than one cut into the other.
      const seam = (
        [
          [at(0, -1), "n", py],
          [at(0, 1), "s", 15 - py],
          [at(-1, 0), "w", px],
          [at(1, 0), "e", 15 - px],
        ] as const
      ).find(
        ([n, , d]) =>
          d < 2 &&
          !dais &&
          n?.feature === "paving" &&
          n.pavement !== "dais" &&
          (n.streetMaterial ?? "slab") !== (c.streetMaterial ?? "slab"),
      );
      if (seam)
        tone =
          seam[2] === 0
            ? lit(course, -3)
            : lit(course, seam[1] === "s" || seam[1] === "e" ? -1 : 2);
      const kerbSide = (
        [
          [kerbN, "n", py, wx],
          [kerbS, "s", 15 - py, wx],
          [kerbW, "w", px, wy],
          [kerbE, "e", 15 - px, wy],
        ] as const
      )
        .filter(([on]) => on)
        .sort((a, b) => a[2] - b[2])[0];
      if (kerbSide) {
        const edged = kerbTone(
          kerbSide[1],
          kerbSide[2],
          kerbSide[3],
          wx + wy,
          material === "plank" ? COURSE.plank : kerbStone(material),
          tone,
          material === "plank",
        );
        if (edged) tone = edged;
      }
      // A worn edge: the outermost stones are broken and sunk, and grit from
      // the ground beside creeps over the last pixel or two.
      if (border < 2 && nearest) {
        const grit = hash(Math.floor(wx / 2), Math.floor(wy / 2), 523);
        // Sunk and broken stones, with the ground's grit washed over them.
        if (border === 0 && grit < 0.55) tone = lit(mix(tone, GRIT, 0.7), -1);
        else if (grit < 0.22) tone = mix(tone, GRIT, 0.5);
        else if (border === 0) tone = lit(tone, -1);
      }
      if (dais) {
        // A cut-stone platform with an outlined edge. Each open side carries
        // a six-pixel kerb: outline, lit rim, kerb face with joints, groove.
        // Corners take a solid cap. The south side shows its wall: kerb, a
        // lit front edge, then the riser, which continues into the cell
        // below with a lower step and the platform's cast shadow.
        const K = {
          ol: lit(course, -4),
          lit: lit(course, 3),
          kerb: lit(course, 1),
          cap: lit(course, 0),
          capLit: lit(course, 2),
          joint: lit(course, -2),
          groove: lit(course, -3),
          riser: lit(course, -1),
          riserJoint: lit(course, -3),
          side: lit(course, -1),
        };
        const bx = stepW ? px : stepE ? 15 - px : 99,
          by = stepN ? py : 99,
          r = stepS ? 15 - py : 99;
        const b = Math.min(bx, by);
        const vertical = bx < 99 && bx <= by && bx < 7;
        const along = vertical ? wy : wx;
        const joint = mod(along, 10) < 2;
        const cap = bx < 7 && (by < 7 || r < 10);
        // Corner caps are square blocks: outlined all round, lit top-left.
        const capRing = cap && (bx === 6 || by === 6 || r === 9);
        const capLit = cap && (bx === 1 || by === 1 || r === 8);
        if (r < 10) {
          tone =
            r === 9
              ? K.groove
              : r === 8
                ? K.lit
                : r >= 5
                  ? cap
                    ? K.cap
                    : joint
                      ? K.joint
                      : K.kerb
                  : r === 4
                    ? K.lit
                    : mod(wx + 4, 8) < 2 && !cap
                      ? K.riserJoint
                      : r === 0
                        ? [124, 118, 100]
                        : K.riser;
          if (cap && r >= 5)
            tone = capRing ? K.ol : capLit && stepW ? K.capLit : K.cap;
          if (bx === 0) tone = K.ol;
        } else if (b < 7) {
          if (b === 0) tone = K.ol;
          else if (b === 1) tone = vertical && stepE ? K.side : K.lit;
          else if (b === 6) tone = K.groove;
          else tone = joint ? K.joint : K.kerb;
          if (cap)
            tone =
              b === 0
                ? K.ol
                : capRing
                  ? K.ol
                  : capLit && !(vertical && stepE)
                    ? K.capLit
                    : K.cap;
        }
      } else if (shadowed || shadowedE) {
        // Below the wall: the riser's lower course and foot, a lower step
        // with its own edge, then cast shadow across the slabs. The east
        // side only casts.
        if (shadowed && py < 2)
          tone = lit(course, mod(wx + 4, 8) < 2 ? -3 : -1);
        else if (shadowed && py === 2) tone = lit(course, -4);
        else if (shadowed && py < 5) tone = lit(course, py === 3 ? 3 : 1);
        else if (shadowed && py === 5) tone = lit(course, -3);
        else {
          const d = Math.min(shadowed ? py - 6 : 9, shadowedE ? px : 9);
          if (d < 3) tone = lit(tone, [-3, -2, -1][d]);
        }
      }
      // Chamfer exposed outer corners in native pixels. Connected road cells
      // retain full coverage, so intersections never acquire internal curbs.
      const corner = Math.min(
        north && west ? px + py : 99,
        north && east ? 15 - px + py : 99,
        south && west ? px + 15 - py : 99,
        south && east ? 30 - px - py : 99,
      );
      if (corner < 3) tone = corner === 0 ? lit(course, -3) : lit(course, corner === 1 ? 2 : 0);
      const i = (py * 16 + px) * 4;
      pixels.set([...tone, 255], i);
    }
  return { x, y, pixels };
}

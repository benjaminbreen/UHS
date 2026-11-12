import { asphaltPixel, dustOf, pavingGrade, pavingStonePixel, sandBank, sunAndSand } from "./paving-stones";
import { carriagewayPixel, concreteRoadPixel, levelCrossing, railPixel } from "./carriageway";
import { kerbCorner, kerbed, paved, pavingMask, roadwayMaterial, wornEdge } from "./paving-edge";
import type { TopographySample } from "../core/topography";
import type { StreetMaterial } from "../content/settlements/streets";
import type { GroundTileData } from "./habitat-raster";
import { waterHash as hash } from "./water-style";
import { streetDistance, streetUnionDistance, strokeFrame, throughStroke } from "../world/v3/street-geometry";
const mod = (n: number, d: number) => ((n % d) + d) % d;
/** World-space value noise at stone scale, so a seam wanders by whole stones. */
const jitter = (wx: number, wy: number) => {
  const fx = wx / 6, fy = wy / 6, ix = Math.floor(fx), iy = Math.floor(fy), tx = fx - ix, ty = fy - iy;
  const a = hash(ix, iy, 611), b = hash(ix + 1, iy, 611), c = hash(ix, iy + 1, 611), d = hash(ix + 1, iy + 1, 611);
  return (a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty) * 0.8 + hash(wx >> 2, wy >> 2, 612) * 0.2;
};
type RGB = readonly number[];
type Color = readonly [number, number, number];
const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
/** A hue-shifted value step: light warms toward straw, shade cools toward
 * slate, so an edge reads as lit stone rather than a lighter grey. */
const lit = (c: RGB, v: number): RGB => {
  const k = v * 5;
  return [clamp(c[0] + k + v), clamp(c[1] + k), clamp(c[2] + k - v)];
};
const mix = (a: RGB, b: RGB, t: number): RGB => a.map((v, i) => v + (b[i] - v) * t);
const GRIT: RGB = [150, 136, 106];
const GRIME: RGB = [96, 86, 70];
const TRAFFIC = new Set<StreetMaterial>(["cobble", "sett", "slab", "basalt", "brick", "macadam"]);
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
  macadam: [168, 156, 132],
};
/** Radius of a kerb rounded at a street corner, in native pixels. */
const CURB_R = 14;
const TACTILE: Record<string, RGB> = {
  yellow: [214, 178, 58],
  buff: [190, 158, 116],
  grey: [150, 152, 148],
};
/** Dressed granite, paler and warmer than the setts it retains, so the kerb
 * reads as the one crisp line in the street. */
const KERB: RGB = [182, 178, 166];
// Made streets were kerbed in dressed granite, whatever they were paved in.
const kerbStone = (m: StreetMaterial) =>
  m === "brick" || m === "asphalt" || m === "sett" || m === "concrete" ? KERB : COURSE[m];

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
  stone: RGB,
  road: RGB,
  timber: boolean,
): RGB | undefined {
  const span = timber ? 31 : 13;
  const at = mod(along + Math.floor(courseOffset(side) * span), span);
  const joint = at === 0;
  const texture = timber
    ? hash(Math.floor(along / 3), d, 955) > 0.75 ? -1 : 0
    : 0;
  const block = (v: number) =>
    joint ? lit(stone, Math.min(v, 0) - 2) : lit(stone, v + texture);
  // A timber sill is pegged to its posts where each length meets the next.
  const peg = timber && (at === 3 || at === span - 3);
  const profile: Record<Side, (RGB | undefined)[]> = {
    n: [block(2), block(0), lit(stone, -2), lit(road, -2)],
    s: [block(1), block(2), lit(stone, -2)],
    w: [block(1), lit(stone, -2), lit(road, -1)],
    e: [block(0), lit(stone, -2)],
  };
  const tone = profile[side][d];
  return peg && tone && d === 1 ? lit(stone, -4) : tone;
}
/** Pixels of kerb and cast shadow `kerbTone` draws on the road, past which sand banks. */
const KERB_REACH: Record<Side, number> = { n: 4, s: 3, w: 3, e: 2 };
const SQUARE_LIP: Record<Side, number[]> = { n: [1], s: [-2, 1], w: [1], e: [-1] };
const PLATFORM_WALL: RGB = [166, 160, 146];
const PLATFORM_FOOT: RGB = [62, 58, 52];
const SAFETY_LINE: RGB = [222, 196, 92];
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
    dust = dustOf(c.biome),
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
      // A paved verge is the footway's own tree strip: kerbed to the road only.
      ((n.pavement === "verge" && (!!c.lane || n.feature !== "paving")) ||
        // A carriageway is kerbed where it meets a square, as at a footway.
        (!!c.lane && !c.pavement && n.pavement === "square") ||
        ((!!c.lane || !c.pavement || c.pavement === "lane" || c.pavement === "square") && kerbed(sample, x + dx, y + dy)))
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
  // A footway corner at a junction is rounded; the straight kerbs of the road
  // cells beside it stop where its arc takes over.
  const bend = c.pavement === "footway" ? kerbCorner(sample, x, y) : undefined;
  const bends = [
    [0, -1],
    [0, 1],
    [-1, 0],
    [1, 0],
  ].map(([dx, dy]) => {
    const b = kerbCorner(sample, x + dx, y + dy);
    return b && (dx ? b[0] === -dx : b[1] === -dy) ? b : undefined;
  });
  const rounded = (dx: number, dy: number, px: number, py: number) => {
    const b = bends[dy < 0 ? 0 : dy > 0 ? 1 : dx < 0 ? 2 : 3];
    if (!b) return false;
    return dx
      ? b[1] < 0 ? py < CURB_R : py > 15 - CURB_R
      : b[0] < 0 ? px < CURB_R : px > 15 - CURB_R;
  };
  // A square stands a step above the carriageway: a lit arris, and on its
  // south face the riser in shadow.
  const lip = c.pavement === "square"
    ? ([[0, -1, "n"], [0, 1, "s"], [-1, 0, "w"], [1, 0, "e"]] as const).filter(([dx, dy]) => {
        const n = at(dx, dy);
        return !!n?.lane && !n.pavement && n.height === c.height;
      })
    : [];
  const beside =
    c.pavement === "footway" ? roadwayMaterial(sample, x, y) ?? "asphalt" : undefined;
  // Tactile paving on the kerb where a marked crossing lands.
  const tactile = c.pavement === "footway"
    ? ([
        [0, -1],
        [0, 1],
        [-1, 0],
        [1, 0],
      ] as const).flatMap(([dx, dy]) => {
        const l = at(dx, dy)?.lane;
        return l &&
          l.crossing !== false &&
          l.marks.tactile !== "none" &&
          Math.abs(l.toJunction ?? 9) <= 2 &&
          (l.axis === "x") === (dy !== 0)
          ? [{ dx, dy, colour: l.marks.tactile }]
          : [];
      })
    : [];
  const lane =
    !c.pavement &&
    (material === "asphalt" ||
      material === "concrete" ||
      material === "sett" ||
      material === "brick")
      ? c.lane
      : undefined;
  const shadowed = !dais && at(0, -1)?.pavement === "dais",
    shadowedE = !dais && at(-1, 0)?.pavement === "dais";
  const track = c.track;
  // A platform's edge is the side that drops to the rails.
  const sides = [
    [0, -1],
    [0, 1],
    [-1, 0],
    [1, 0],
  ] as const;
  const drop =
    c.pavement === "platform"
      ? sides.find(([dx, dy]) => at(dx, dy)?.track)
      : undefined;
  // Beside the rails, the platform's north face shows as a wall.
  const face = track && at(0, -1)?.pavement === "platform";
  const lee = track
    ? sides.find(([dx, dy]) => dy >= 0 && at(dx, dy)?.pavement === "platform")
    : undefined;
  const trafficked = !!c.lane && !c.pavement && (c.lane.marks?.centre ?? "none") === "none" && TRAFFIC.has(material);
  const key = `${material}/${grade}`;
  const meets = dais || kerb || lane || track || c.pavement === "platform" ? [] : sides.flatMap(([dx, dy]) => {
    const n = at(dx, dy);
    if (n?.feature !== "paving" || n.height !== c.height || n.track || n.pavement === "dais" || n.pavement === "platform") return [];
    if (kerbed(sample, x + dx, y + dy) || lip.some(([lx, ly]) => lx === dx && ly === dy)) return [];
    const m = (n.pavement === "footway" ? roadwayMaterial(sample, x + dx, y + dy) : undefined) ?? n.streetMaterial ?? "slab";
    const g = pavingGrade(n.pavement), other = `${m}/${g}`;
    return other === key ? [] : [{ dx, dy, material: m, grade: g, first: key < other }];
  });
  for (let py = 0; py < 16; py++)
    for (let px = 0; px < 16; px++) {
      const wx = (x + ox) * 16 + px,
        wy = (y + oy) * 16 + py;
      if (track && c.pavement === "rail") {
        const alongX = track.axis === "x";
        pixels.set(
          [...railPixel(track.at * 16 + (alongX ? py : px), alongX ? wx : wy, wx, wy), 255],
          (py * 16 + px) * 4,
        );
        const wall = face && py < 5;
        const d = lee ? (lee[0] < 0 ? px : lee[0] > 0 ? 15 - px : 15 - py) : 99;
        if (wall || d < 2)
          pixels.set(
            [
              ...(wall
                ? py === 4
                  ? PLATFORM_FOOT
                  : lit(PLATFORM_WALL, mod(wx, 12) === 0 ? -3 : py === 0 ? 1 : 0)
                : lit(railPixel(track.at * 16 + (alongX ? py : px), alongX ? wx : wy, wx, wy), d ? -2 : -4)),
              255,
            ],
            (py * 16 + px) * 4,
          );
        continue;
      }
      if (c.loadingBay && !track) {
        const bay = c.loadingBay, bx = wx - bay.x * 16, by = wy - bay.y * 16;
        const edge = bx < 2 || bx >= bay.w * 16 - 2 || by < 2;
        const colour = edge && hash(wx, wy, 793) > 0.07
          ? [222, 211, 161] : pavingStonePixel(wx, wy, "concrete", "broad");
        pixels.set([...colour, 255], (py * 16 + px) * 4);
        continue;
      }
      if (c.streetGeometry && !track) {
        const { strokes, infill } = c.streetGeometry;
        const ax = (wx + 0.5) / 16, ay = (wy + 0.5) / 16;
        const closest = throughStroke(strokes, ax, ay);
        const union = (qx: number, qy: number) => streetUnionDistance(strokes, qx, qy) * 16;
        const d = union(ax, ay);
        // Past every street's own footway the ground shows.
        if (d > 0 && !infill && !strokes.some((o) => streetDistance(o, ax, ay) <= (o.walk ?? 2))) continue;
        const road = closest.material ?? material, walk = closest.footway ?? "concrete";
        let colour: RGB = pavingStonePixel(wx, wy, d < 0 ? road : walk, "street");
        const made = road === "asphalt" || road === "concrete" || road === "sett" || road === "brick";
        // Paint belongs on a made road, never on flags or cobbles.
        if (d < 0 && made) {
          const smooth = road === "asphalt" || road === "concrete";
          // A real kerb is near; inside a junction's mouth there is none to gutter.
          const kerbs = { low: d > -18, high: d > -18 };
          if (c.lane)
            colour = carriagewayPixel(colour, c.lane, c.lane.at * 16 + (c.lane.axis === "x" ? py : px),
              c.lane.axis === "x" ? wx : wy, c.lane.axis === "x" ? wy : wx, kerbs, smooth);
          else if (closest.marks) {
            // Off the grid a street carries the same section in its own frame.
            const f = strokeFrame(closest, ax, ay), span = Math.round(closest.radius * 2);
            const crossed = strokes.some((o) => o !== closest && streetDistance(o, ax, ay) < 0 &&
              Math.abs((o.b[0] - o.a[0]) * (closest.b[1] - closest.a[1]) - (o.b[1] - o.a[1]) * (closest.b[0] - closest.a[0])) > 0.01);
            colour = carriagewayPixel(colour,
              { axis: f.xlike ? "x" : "y", at: 0, span, marks: closest.marks, junction: crossed },
              Math.floor((f.across + closest.radius) * 16), Math.floor(f.along * 16), Math.round((f.along - f.across) * 16), kerbs, smooth);
          }
        }
        if (road !== "cobble" && road !== "slab") {
          if (d < 0 && d > -4) {
            // The kerb faces whichever way the road's edge does here.
            const gx = union(ax + 0.25, ay) - union(ax - 0.25, ay), gy = union(ax, ay + 0.25) - union(ax, ay - 0.25);
            const side: Side = Math.abs(gy) >= Math.abs(gx) ? (gy < 0 ? "n" : "s") : gx < 0 ? "w" : "e";
            const dropped = c.lane?.crossing && Math.abs(c.lane.toJunction ?? 9) <= 2;
            const tone = dropped
              ? d > -2 ? lit(kerbStone(road), -1) : undefined
              : kerbTone(side, Math.floor(-d), side === "n" || side === "s" ? wx : wy, kerbStone(road), colour, false);
            if (tone) colour = tone;
          }
        } else if (road !== walk && d >= -4 && d < 0) {
          // Cobbles stop at a row of long edge stones and a joint, not a cut.
          const along = closest.a[1] === closest.b[1] ? wx : wy;
          colour = d >= -1 ? lit(COURSE[road], -3) : mod(along, 7) === 0 ? lit(COURSE[road], -2) : lit(COURSE[road], d >= -2 ? 2 : 0);
        }
        // Where the footway ends against open ground it is cut, not kerbed.
        if (d >= 0) {
          const out = Math.min(north ? py : 99, south ? 15 - py : 99, west ? px : 99, east ? 15 - px : 99);
          if (out < 3)
            colour = cutEdge(out === (north ? py : 99) ? "n" : out === (south ? 15 - py : 99) ? "s" : out === (west ? px : 99) ? "w" : "e",
              out, COURSE[walk], colour);
        }
        if (dust) colour = sunAndSand(colour as Color, dust, wx, wy, road === "asphalt" && d < -2);
        pixels.set([...colour, 255], (py * 16 + px) * 4);
        continue;
      }
      /** Pixels out from the kerb or edge, along the street, and a key constant along it. */
      let bank: [number, number, number] | undefined;
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
      tone = pavingStonePixel(
        wx, wy, material, grade, (north || south) && !(west || east),
      );
      if (lane) {
        const alongX = lane.axis === "x";
        tone = carriagewayPixel(
          material === "concrete"
            ? concreteRoadPixel(lane, lane.at * 16 + (alongX ? py : px), alongX ? wx : wy, alongX ? wy : wx)
            : tone,
          lane,
          lane.at * 16 + (alongX ? py : px),
          alongX ? wx : wy,
          alongX ? wy : wx,
          {
            low: lane.at === 0 && (alongX ? kerbN && !rounded(0, -1, px, py) : kerbW && !rounded(-1, 0, px, py)),
            high: lane.at === lane.span - 1 && (alongX ? kerbS && !rounded(0, 1, px, py) : kerbE && !rounded(1, 0, px, py)),
          },
          material === "asphalt" || material === "concrete",
        );
      }
      // Horse traffic wears the crown of a stone street dark, with a pair of
      // wheel ruts; a motor road's paint and binder carry their own wear.
      if (trafficked) {
        const l = c.lane!, alongX = l.axis === "x";
        const width = l.span * 16, u = (l.at * 16 + (alongX ? py : px) + 0.5) / width;
        const along = alongX ? wx : wy;
        const fleck = jitter(alongX ? along / 3 : wx * 2, alongX ? wy * 2 : along / 3);
        let k = l.junction ? 0.1 : 0.22 * (1 - Math.abs(2 * u - 1));
        if (!l.junction && width >= 32)
          for (const r of [0.32, 0.68]) {
            const off = (u - r) * width;
            k += 0.3 * Math.exp(-off * off / 3) * (fleck > 0.35 ? 1 : 0.3);
          }
        tone = mix(tone, GRIME, k * (0.6 + fleck * 0.8));
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
      // Where two pavings meet they interlock along a wandering line, stone
      // into stone, instead of each stopping at the cell's straight edge.
      for (const m of meets) {
        const d = (m.dx ? (m.dx < 0 ? px : 15 - px) : m.dy < 0 ? py : 15 - py) + 0.5;
        const jag = (jitter(wx, wy) - 0.5) * 9;
        if (d < (m.first ? jag : -jag)) {
          tone = pavingStonePixel(wx, wy, m.material, m.grade, (north || south) && !(west || east));
          break;
        }
      }
      const kerbSide = (
        [
          [kerbN && !rounded(0, -1, px, py), "n", py, wx],
          [kerbS && !rounded(0, 1, px, py), "s", 15 - py, wx],
          [kerbW && !rounded(-1, 0, px, py), "w", px, wy],
          [kerbE && !rounded(1, 0, px, py), "e", 15 - px, wy],
        ] as const
      )
        .filter(([on]) => on)
        .sort((a, b) => a[2] - b[2])[0];
      if (kerbSide) {
        const crossing = lane && lane.crossing && Math.abs(lane.toJunction ?? 9) <= 2 &&
          (lane.axis === "x" ? kerbSide[1] === "n" || kerbSide[1] === "s" : kerbSide[1] === "w" || kerbSide[1] === "e");
        const edged = crossing
          ? kerbSide[2] < 2 ? lit(kerbStone(material), -1) : undefined
          : kerbTone(
          kerbSide[1],
          kerbSide[2],
          kerbSide[3],
          material === "plank" ? COURSE.plank : kerbStone(material),
          tone,
          material === "plank",
        );
        if (edged) tone = edged;
        else if (dust && !crossing) {
          const side = kerbSide[1];
          bank = [kerbSide[2] - KERB_REACH[side], kerbSide[3], side === "n" || side === "s" ? y * 4 + (side === "n" ? 0 : 1) : x * 4 + 2];
        }
      }
      for (const [dx, dy, side] of lip) {
        const d = dx ? (dx < 0 ? px : 15 - px) : dy < 0 ? py : 15 - py;
        const v = SQUARE_LIP[side][d];
        if (v !== undefined) tone = lit(tone, v);
      }
      for (const t of tactile) {
        const d = t.dx ? (t.dx < 0 ? px : 15 - px) : t.dy < 0 ? py : 15 - py;
        if (d > 4) continue;
        const face = TACTILE[t.colour];
        tone =
          mod(wx, 3) === 1 && mod(wy, 3) === 1
            ? lit(face, 3)
            : mod(wx, 3) === 2 && mod(wy, 3) === 2
              ? lit(face, -2)
              : face;
      }
      if (bend) {
        const [sx, sy] = bend;
        const cx = sx < 0 ? CURB_R : 15 - CURB_R,
          cy = sy < 0 ? CURB_R : 15 - CURB_R;
        if ((sx < 0 ? px < cx : px > cx) && (sy < 0 ? py < cy : py > cy)) {
          const dx = px - cx,
            dy = py - cy,
            d = Math.hypot(dx, dy);
          const stone = kerbStone(beside!);
          if (d > CURB_R + 0.5)
            tone =
              beside === "asphalt"
                ? asphaltPixel(wx, wy)
                : pavingStonePixel(wx, wy, beside!, "street");
          else if (d > CURB_R - 0.5) tone = lit(stone, -4);
          else if (d > CURB_R - 3)
            // The kerb's top, lit where the arc turns toward the light.
            tone = lit(stone, (dx + dy) / d < -0.3 ? 3 : (dx + dy) / d > 0.5 ? -2 : 1);
        }
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
      if (drop) {
        const [dx, dy] = drop;
        const d = dx ? (dx < 0 ? px : 15 - px) : dy < 0 ? py : 15 - py;
        const along = dx ? wy : wx;
        // Coping stone over the edge, then the painted line to stand behind.
        if (d === 0) tone = lit(course, -4);
        else if (d < 3) tone = lit(PLATFORM_WALL, d === 1 ? 3 : 1);
        else if (d === 3) tone = lit(course, -2);
        else if ((d === 5 || d === 6) && mod(along, 8) < 6) tone = SAFETY_LINE;
      }
      if (track)
        tone = levelCrossing(
          tone,
          track.at * 16 + (track.axis === "x" ? py : px),
          track.axis === "x" ? wx : wy,
          !!lane && lane.axis !== track.axis,
        );
      if (dust) {
        // Sand banks against the kerbs and creeps in over a worn edge.
        if (!bank && border < 6 && nearest && !dais) {
          const across = border === (north ? py : 99) || border === (south ? 15 - py : 99);
          bank = [border - 1, across ? wx : wy, across ? y * 4 + 3 : x * 4 + 3];
        }
        tone = sunAndSand(tone as Color, dust, wx, wy, material === "asphalt");
        if (bank) tone = sandBank(tone as Color, dust, bank[0], bank[1], bank[2]);
      }
      const i = (py * 16 + px) * 4;
      pixels.set([...tone, 255], i);
    }
  return { x, y, pixels };
}

import { pavingGrade, pavingStonePixel } from "./paving-stones";
import type { TopographyCell, TopographySample } from "../core/topography";
import type { GroundTileData } from "./habitat-raster";
import { waterHash as hash } from "./water-style";
const mod = (n: number, d: number) => ((n % d) + d) % d;
const paved = (n?: TopographyCell) => n?.feature === "paving" || !!n?.bridge;
/** A cell that reads as ground beside paving, so the edge wears rather than
 * stops. Water and the field edge keep their own outlines. */
export const wornEdge = (n?: TopographyCell) =>
  !!n && !paved(n) && n.surface !== "water" && n.feature !== "field";
/** Shared native-pixel paving materials. Place/date selection happens in content. */
export function rasterStreetTile(
  sample: TopographySample,
  x: number,
  y: number,
  ox: number,
  oy: number,
): GroundTileData {
  const c = sample(x, y)!,
    material = c.streetMaterial ?? "slab",
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
        (n.pavement === "footway" && c.pavement !== "footway"))
    );
  };
  const kerbN = kerbTo(0, -1),
    kerbS = kerbTo(0, 1),
    kerbW = kerbTo(-1, 0),
    kerbE = kerbTo(1, 0);
  const north = edge(0, -1) && !kerbN,
    south = edge(0, 1) && !kerbS,
    west = edge(-1, 0) && !kerbW,
    east = edge(1, 0) && !kerbE;
  // A raised footway keeps a cut kerb; every other street edge wears into the
  // ground beside it.
  const kerb = c.pavement === "footway";
  const worn = (dx: number, dy: number) => !kerb && wornEdge(at(dx, dy));
  const stepN = step(0, -1),
    stepS = step(0, 1),
    stepW = step(-1, 0),
    stepE = step(1, 0);
  const shadowed = !dais && at(0, -1)?.pavement === "dais",
    shadowedE = !dais && at(-1, 0)?.pavement === "dais";
  for (let py = 0; py < 16; py++)
    for (let px = 0; px < 16; px++) {
      const wx = (x + ox) * 16 + px,
        wy = (y + oy) * 16 + py;
      const border = Math.min(
        north ? py : 99,
        south ? 15 - py : 99,
        west ? px : 99,
        east ? 15 - px : 99,
      );
      let tone: readonly number[];
      const nearest =
        border === (north ? py : 99)
          ? worn(0, -1)
          : border === (south ? 15 - py : 99)
            ? worn(0, 1)
            : border === (west ? px : 99)
              ? worn(-1, 0)
              : worn(1, 0);
      if (border < 3 && !nearest) {
        // Use the nearest edge's tangent, including corners and T-junctions.
        const horizontal =
          Math.min(north ? py : 99, south ? 15 - py : 99) <=
          Math.min(west ? px : 99, east ? 15 - px : 99);
        const joint = mod(horizontal ? wx : wy, 9) === 0;
        tone =
          border === 2
            ? [112, 113, 96]
            : joint
              ? [137, 134, 112]
              : border === 0
                ? [202, 192, 157]
                : [175, 166, 138];
      } else if (material === "brick") {
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
        tone = pavingStonePixel(wx, wy, material, grade);
      }
      // Kerb: a light stone line on the outermost pixel, jointed every eight
      // world pixels, with its shadow on the roadway beside it.
      const kerbBorder = Math.min(
        kerbN ? py : 99,
        kerbS ? 15 - py : 99,
        kerbW ? px : 99,
        kerbE ? 15 - px : 99,
      );
      if (kerbBorder < 2) {
        const vertical =
          Math.min(kerbW ? px : 99, kerbE ? 15 - px : 99) <
          Math.min(kerbN ? py : 99, kerbS ? 15 - py : 99);
        const joint = mod(vertical ? wy : wx, 8) === 0;
        const dark = material === "basalt" || material === "sett";
        tone =
          kerbBorder === 0
            ? joint
              ? dark
                ? [150, 158, 154]
                : [178, 170, 146]
              : dark
                ? [206, 212, 206]
                : [226, 218, 194]
            : dark
              ? [96, 106, 104]
              : [122, 116, 96];
      }
      // A worn edge: the outermost stones are broken and sunk, and grit from
      // the ground beside creeps over the last pixel or two.
      if (border < 2 && nearest) {
        const grit = hash(Math.floor(wx / 2), Math.floor(wy / 2), 523);
        if (border === 0 && grit < 0.55) tone = [169, 156, 121];
        else if (grit < 0.22) tone = [160, 152, 124];
        else if (border === 0) tone = tone.map((n) => n - 8);
      }
      if (dais) {
        // A cut-stone platform with an outlined edge. Each open side carries
        // a six-pixel kerb: outline, lit rim, kerb face with joints, groove.
        // Corners take a solid cap. The south side shows its wall: kerb, a
        // lit front edge, then the riser, which continues into the cell
        // below with a lower step and the platform's cast shadow.
        const K =
          material === "basalt" || material === "sett"
            ? {
                ol: [58, 62, 60],
                lit: [214, 220, 214],
                kerb: [186, 194, 190],
                cap: [166, 174, 170],
                capLit: [200, 208, 204],
                joint: [118, 128, 126],
                groove: [96, 106, 104],
                riser: [112, 122, 120],
                riserJoint: [78, 86, 84],
                side: [120, 130, 128],
              }
            : {
                ol: [74, 69, 58],
                lit: [244, 238, 218],
                kerb: [226, 218, 194],
                cap: [204, 194, 166],
                capLit: [232, 224, 200],
                joint: [148, 142, 122],
                groove: [122, 118, 100],
                riser: [138, 132, 112],
                riserJoint: [98, 92, 76],
                side: [146, 140, 120],
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
          tone = mod(wx + 4, 8) < 2 ? [98, 92, 76] : [116, 110, 92];
        else if (shadowed && py === 2) tone = [74, 69, 58];
        else if (shadowed && py < 5)
          tone = py === 3 ? [236, 230, 210] : [216, 210, 188];
        else if (shadowed && py === 5) tone = [104, 100, 84];
        else {
          const d = Math.min(shadowed ? py - 6 : 9, shadowedE ? px : 9);
          if (d < 3) tone = tone.map((n) => n - [36, 22, 10][d]);
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
      if (corner < 3) tone = kerb ? [174, 157, 112] : [169, 156, 121];
      const i = (py * 16 + px) * 4;
      pixels.set([...tone, 255], i);
    }
  return { x, y, pixels };
}

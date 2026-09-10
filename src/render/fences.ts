import type { Boundary } from "../content/agriculture/types";
import type { GroundMotifOverrides } from "./ground-motifs";
import { turfTick } from "./ground-motifs";
import { waterHash as hash } from "./water-style";

const mod = (n: number, d: number) => ((n % d) + d) % d;
type Rgb = number[];
const mix = (a: Rgb, b: Rgb, t: number): Rgb =>
  a.map((v, k) => Math.round(v * (1 - t) + b[k] * t));
const shade = (c: Rgb, v: number): Rgb => c.map((n) => n + v);

export type Enclosure = {
  /** Enclosure edges, bits n1 e2 s4 w8: the bold fence, hedge or wall. */
  fence: number;
  /** Parcel edges, same bits. Those not also in `fence` get a thin line. */
  edges: number;
  boundary: Boundary;
  wet: boolean;
  /** World pixel origin of the cell. */
  gx: number;
  gy: number;
  /** Grass palette: 0 base, 5 blade shadow, 6 blade light. */
  palette: Rgb[];
  /** Tilled soil ramp: trough, side, ridge, ridge top. */
  soil: Rgb[];
  motifs?: GroundMotifOverrides;
};

const wood = {
  post: [72, 48, 28],
  postLit: [112, 78, 46],
  railTop: [178, 134, 82],
  railLow: [138, 98, 56],
};
const hedge = {
  dark: [44, 82, 40],
  mid: [64, 108, 48],
  lit: [108, 156, 72],
};
const stone = {
  cap: [200, 194, 170],
  capJoint: [160, 154, 132],
  face: [156, 150, 128],
  faceJoint: [110, 104, 88],
  foot: [120, 114, 96],
};
const trough = { lip: [124, 110, 84], water: [46, 68, 74], deep: [38, 58, 66] };

/** Posts sit on a world lattice so a run lines up across cells. */
const POST_PITCH = 8;

/** How many outer pixels a boundary claims, shadow row included. */
function width(boundary: Boundary) {
  switch (boundary) {
    case "hedge":
      return 5;
    case "fence":
    case "wall":
      return 4;
    case "bund":
    case "ditch":
    case "baulk":
      return 3;
    default:
      return 0;
  }
}

/** Colour of the boundary pixel at (px, py) over the given ground, or
 * undefined where the ground shows through. Enclosure bits get the full
 * treatment; bare parcel edges inside an enclosure get one ridge line. */
export function enclosurePixel(
  e: Enclosure,
  px: number,
  py: number,
  ground: Rgb,
): Rgb | undefined {
  if (e.boundary === "none") return undefined;
  const wx = e.gx + px,
    wy = e.gy + py;
  const w = width(e.boundary);
  const dn = e.fence & 1 ? py : 99,
    de = e.fence & 2 ? 15 - px : 99,
    ds = e.fence & 4 ? 15 - py : 99,
    dw = e.fence & 8 ? px : 99;
  const dh = Math.min(dn, ds),
    dv = Math.min(de, dw);
  const d = Math.min(dh, dv);
  if (d < w) {
    const horizontal = dh <= dv;
    const along = horizontal ? wx : wy;
    // A corner is where both a horizontal and a vertical run are within
    // the boundary's body.
    const body = w - 1;
    const corner = dh < body && dv < body;
    return bold(e, horizontal ? dh : dv, along, corner, dh, dv, ground, wx, wy);
  }
  // Thin parcel line on edges that are not enclosure edges.
  const inner = e.edges & ~e.fence;
  const on =
    (inner & 1 && py === 0) ||
    (inner & 2 && px === 15) ||
    (inner & 4 && py === 15) ||
    (inner & 8 && px === 0);
  if (!on) return undefined;
  switch (e.boundary) {
    case "bund":
      return shade(e.soil[3], 14);
    case "ditch":
      return e.wet ? trough.water : shade(e.soil[0], -6);
    default:
      // Strips inside one enclosure are parted by a grass baulk.
      return shade(e.palette[0], turfTick(wx, wy, e.motifs) ? 6 : -4);
  }
}

function bold(
  e: Enclosure,
  d: number,
  along: number,
  corner: boolean,
  dh: number,
  dv: number,
  ground: Rgb,
  wx: number,
  wy: number,
): Rgb | undefined {
  const b = e.boundary;
  if (b === "fence") {
    // Rows: top rail, gap, lower rail, shadow. Posts stand through all
    // three rail rows and a corner always gets one.
    if (d === 3) return shade(ground, -22);
    // Posts are two pixels wide with a lit top-left pixel.
    const at = mod(along, POST_PITCH);
    const post = corner ? dh < 2 && dv < 2 : at < 2;
    if (post) {
      const lit = corner ? dh === 0 && dv === 0 : d === 0 && at === 0;
      return lit ? wood.postLit : wood.post;
    }
    if (corner) return shade(ground, -12);
    if (d === 0) return wood.railTop;
    if (d === 2) return wood.railLow;
    return shade(ground, -12);
  }
  if (b === "hedge") {
    if (d === 4) return shade(ground, -20);
    // Rounded corner: the outermost corner pixel is ground.
    if (corner && dh === 0 && dv === 0) return ground;
    const bob = hash(Math.floor(along / 2), Math.floor((wx + wy - along) / 2), 841);
    if (d === 0) return corner ? hedge.mid : bob > 0.5 ? hedge.lit : hedge.mid;
    if (d === 1) return bob > 0.7 ? hedge.mid : hedge.dark;
    if (d === 3) return bob > 0.85 ? hedge.mid : hedge.dark;
    return hedge.dark;
  }
  if (b === "wall") {
    if (d === 3) return shade(ground, -20);
    const joint = !corner && mod(along + 3, 6) === 0;
    if (d === 0) return joint ? stone.capJoint : stone.cap;
    if (d === 1) return joint ? stone.faceJoint : stone.face;
    return joint ? stone.faceJoint : stone.foot;
  }
  if (b === "bund") {
    if (d === 0) return shade(e.soil[3], 18);
    if (d === 1) return shade(e.soil[3], 6);
    return e.wet ? trough.deep : shade(e.soil[1], -8);
  }
  if (b === "ditch") {
    if (d === 0) return trough.lip;
    if (d === 1) return trough.deep;
    return hash(Math.floor(along / 4), 0, 843) > 0.85 ? mix(trough.water, [138, 168, 176], 0.5) : trough.water;
  }
  if (b === "baulk") {
    const turf = shade(e.palette[0], turfTick(wx, wy, e.motifs) ? 8 : 0);
    return d === 2 ? shade(turf, -8) : turf;
  }
  return undefined;
}

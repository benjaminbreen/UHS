import type { TopographyCell, TopographySample } from "../core/topography";
import { fencePalette, fenceTiles, fenceInk } from "../content/graphics/fence-art";
import { fenceStands } from "./headland";
import { waterHash as hash } from "./water-style";

type Rgb = number[];
type Field = NonNullable<TopographyCell["field"]>;
const rgb = fencePalette.map((c) => [
  parseInt(c.slice(1, 3), 16),
  parseInt(c.slice(3, 5), 16),
  parseInt(c.slice(5, 7), 16),
]);

/** How far outside a field cell the fence line runs, in pixels. Under
 * half a cell, so a one-cell stair in the enclosure draws as a diagonal
 * rather than a knot. */
export const FENCE_OUT = 9;

/** The post, ten wide and sixteen tall: the sheet's head over a plain
 * body. Row 15 is the foot. */
const head = fenceTiles[1][0].slice(1, 8).map((r) => r.slice(3, 13));
const body = "0144222441";
const POST = [
  "0000000000",
  ...head,
  body,
  body,
  body,
  body,
  body,
  body,
  body,
  "0011111110",
];

type Post = { x: number; y: number };
type Rail = { a: Post; b: Post };

const tone = (c: Rgb, v: number) =>
  v ? c.map((n) => Math.max(0, Math.min(255, n + v))) : c;

/** A post's own character: which way it leans, whether it has settled into
 * the ground, and how weathered its timber is. Every value comes from the
 * post's world position, so the same post is drawn identically from each of
 * the tiles that reach it and no seam appears between them. */
function character(p: Post) {
  const tilt = hash(p.x, p.y, 971);
  // Most posts stand; a minority have been shoved out of true by stock or
  // frost. More than a pixel of lean at this height reads as a broken fence.
  const lean = tilt > 0.84 ? 1 : tilt < 0.16 ? -1 : 0;
  const sink = hash(p.x, p.y, 973) > 0.8 ? 1 : 0;
  // Weathering moves in stretches, not post by post: a length of fence put
  // up or repaired at one time greys together.
  const age = hash(Math.floor(p.x / 96), Math.floor(p.y / 96), 977);
  return { lean, sink, weather: Math.round((age - 0.5) * 16) };
}

/** Rails rot out in stretches. The run is still read as a fence by the posts
 * left standing, so a gap tells of neglect rather than of a way through. */
function railGone(a: Post, b: Post) {
  const mx = Math.floor((a.x + b.x) / 128),
    my = Math.floor((a.y + b.y) / 128);
  return hash(mx, my, 979) > 0.88;
}

/** Foot of the post on a fence edge: mid-edge, pushed out by FENCE_OUT. */
function mid(cx: number, cy: number, bit: number): Post {
  const X = cx * 16,
    Y = cy * 16;
  const j = Math.floor(hash(cx, cy, 931 + bit) * 3) - 1;
  switch (bit) {
    case 1:
      return { x: X + 8 + j, y: Y - FENCE_OUT };
    case 4:
      return { x: X + 8 + j, y: Y + 16 + FENCE_OUT };
    case 2:
      return { x: X + 16 + FENCE_OUT, y: Y + 8 + j };
    default:
      return { x: X - FENCE_OUT, y: Y + 8 + j };
  }
}

const fenced = (f: Field | undefined) =>
  !!f && !f.ditch && ["fence", "wire"].includes(f.enclosure ?? f.boundary);

/** The height a post stands above its foot, in pixels: what it shadows with. */
export const POST_HEIGHT = 15;

/** Feet of every standing fence post in a cell range, in world pixels. Shares
 * `mid`, `fenced` and the shared-edge rule with the drawing pass, so a post
 * that casts a shadow is always a post that was drawn. */
export function fencePostFeet(
  field: (cx: number, cy: number) => Field | undefined,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): Post[] {
  const stands = (cx: number, cy: number, bit: number) => {
    const f = field(cx, cy);
    return fenced(f) && fenceStands(f!, bit, cx, cy);
  };
  const out: Post[] = [];
  for (let cy = y0; cy < y1; cy++)
    for (let cx = x0; cx < x1; cx++)
      for (const bit of [1, 2, 4, 8]) {
        if (!stands(cx, cy, bit)) continue;
        // Two fields facing across a gap share one fence, as in `gather`.
        if (bit === 1 && stands(cx, cy - 3, 4)) continue;
        if (bit === 8 && stands(cx - 3, cy, 2)) continue;
        out.push(mid(cx, cy, bit));
      }
  return out;
}

/** Posts and rails of every standing fence edge within two cells of the
 * tile. Rails join a post to the next along the outline: the straight
 * neighbour, the same cell's perpendicular edge at a convex corner, or
 * the diagonal cell's perpendicular edge at a concave one. */
function gather(sample: TopographySample, x: number, y: number, ox: number, oy: number) {
  const posts: Post[] = [];
  const rails: Rail[] = [];
  const at = (dx: number, dy: number) => sample(x + dx, y + dy)?.field;
  const stands = (dx: number, dy: number, bit: number) => {
    const f = at(dx, dy);
    return fenced(f) && fenceStands(f!, bit, x + ox + dx, y + oy + dy);
  };
  // Two fields facing across the gap share one fence: the northern or
  // western field's. A north or west edge yields to a standing south or
  // east edge three cells over.
  const standing = (dx: number, dy: number, bit: number) => {
    if (!stands(dx, dy, bit)) return false;
    if (bit === 1 && stands(dx, dy - 3, 4)) return false;
    if (bit === 8 && stands(dx - 3, dy, 2)) return false;
    return true;
  };
  // For each edge bit: the along axis step, and the perpendicular bits at
  // the two ends with the diagonal cell that carries the concave edge.
  const ends: Record<number, [number, number, number, number][]> = {
    // [step dx, step dy, perpendicular bit at that end, bit on the diagonal cell]
    1: [
      [-1, 0, 8, 2],
      [1, 0, 2, 8],
    ],
    4: [
      [-1, 0, 8, 2],
      [1, 0, 2, 8],
    ],
    2: [
      [0, -1, 1, 4],
      [0, 1, 4, 1],
    ],
    8: [
      [0, -1, 1, 4],
      [0, 1, 4, 1],
    ],
  };
  for (let dy = -2; dy <= 2; dy++)
    for (let dx = -2; dx <= 2; dx++)
      for (const bit of [1, 2, 4, 8]) {
        if (!standing(dx, dy, bit)) continue;
        const cx = x + ox + dx,
          cy = y + oy + dy;
        const m = mid(cx, cy, bit);
        posts.push(m);
        for (const [sx, sy, perp, diag] of ends[bit]) {
          const outX = bit === 2 ? 1 : bit === 8 ? -1 : 0;
          const outY = bit === 4 ? 1 : bit === 1 ? -1 : 0;
          let next: Post | undefined;
          if (standing(dx + sx, dy + sy, bit))
            next = mid(cx + sx, cy + sy, bit);
          else if (standing(dx, dy, perp)) next = mid(cx, cy, perp);
          else if (standing(dx + sx + outX, dy + sy + outY, diag))
            next = mid(cx + sx + outX, cy + sy + outY, diag);
          if (next) rails.push({ a: m, b: next });
        }
      }
  return { posts, rails };
}

/** Draw the fences round the tile at (x, y). Rails first, then posts from
 * north to south so a nearer post stands in front. */
export function paintFences(
  sample: TopographySample,
  x: number,
  y: number,
  ox: number,
  oy: number,
  put: (px: number, py: number, c: Rgb) => void,
  shadow: (px: number, py: number) => void,
) {
  const { posts, rails } = gather(sample, x, y, ox, oy);
  if (!posts.length) return;
  const gx = (x + ox) * 16,
    gy = (y + oy) * 16;
  const wire = (dx: number, dy: number) => {
    const f = sample(x + dx, y + dy)?.field;
    return !!f && (f.enclosure ?? f.boundary) === "wire";
  };
  const isWire = wire(0, 0) || wire(0, -1) || wire(-1, 0) || wire(1, 0) || wire(0, 1);
  const set = (wx: number, wy: number, c: Rgb) => {
    const px = wx - gx,
      py = wy - gy;
    if (px >= 0 && py >= 0 && px < 16 && py < 16) put(px, py, c);
  };
  for (const { a, b } of rails) {
    const dx = b.x - a.x,
      dy = b.y - a.y;
    const n = Math.max(Math.abs(dx), Math.abs(dy));
    if (!n) continue;
    const grey = character(a).weather;
    const bare = !isWire && railGone(a, b);
    if (Math.abs(dx) >= Math.abs(dy)) {
      // Two rails across, at set heights above the interpolated foot.
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        const wx = Math.round(a.x + dx * t),
          wy = Math.round(a.y + dy * t);
        if (isWire) {
          set(wx, wy - 7, [78, 72, 64]);
          continue;
        }
        if (!bare) {
          set(wx, wy - 9, tone(rgb[2], grey));
          set(wx, wy - 8, tone(rgb[1], grey));
        }
        set(wx, wy - 5, tone(rgb[1], grey));
        set(wx, wy - 4, tone(rgb[0], grey));
      }
    } else {
      // A single rail along, three wide, at top-rail height.
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        const wx = Math.round(a.x + dx * t),
          wy = Math.round(a.y + dy * t) - 9;
        if (isWire) {
          set(wx, wy + 2, [78, 72, 64]);
          continue;
        }
        if (bare) continue;
        set(wx - 1, wy, tone(rgb[0], grey));
        set(wx, wy, tone(rgb[2], grey));
        set(wx + 1, wy, tone(rgb[3], grey));
      }
    }
  }
  posts.sort((p, q) => p.y - q.y);
  for (const p of posts) {
    const { lean, sink, weather } = character(p);
    for (let r = 0; r < 16; r++)
      for (let c = 0; c < 10; c++) {
        const ink = fenceInk(POST[r][c]);
        // Shear about the foot, so a leaning post keeps its footing and
        // only its head moves.
        if (ink >= 0)
          set(
            p.x - 5 + c + Math.round((lean * (15 - r)) / 15),
            p.y - 15 + r + sink,
            tone(rgb[ink], weather),
          );
      }
    for (let c = 1; c < 9; c++) {
      const px = p.x - 5 + c - gx,
        py = p.y + 1 + sink - gy;
      if (px >= 0 && py >= 0 && px < 16 && py < 16) shadow(px, py);
    }
  }
}

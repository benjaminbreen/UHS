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
        set(wx, wy - 9, rgb[2]);
        set(wx, wy - 8, rgb[1]);
        set(wx, wy - 5, rgb[1]);
        set(wx, wy - 4, rgb[0]);
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
        set(wx - 1, wy, rgb[0]);
        set(wx, wy, rgb[2]);
        set(wx + 1, wy, rgb[3]);
      }
    }
  }
  posts.sort((p, q) => p.y - q.y);
  for (const p of posts) {
    for (let r = 0; r < 16; r++)
      for (let c = 0; c < 10; c++) {
        const ink = fenceInk(POST[r][c]);
        if (ink >= 0) set(p.x - 5 + c, p.y - 15 + r, rgb[ink]);
      }
    for (let c = 1; c < 9; c++) {
      const px = p.x - 5 + c - gx,
        py = p.y + 1 - gy;
      if (px >= 0 && py >= 0 && px < 16 && py < 16) shadow(px, py);
    }
  }
}

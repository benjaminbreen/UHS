import type { TopographyCell, TopographySample } from "../core/topography";
import type { Boundary } from "../content/agriculture/types";
import { boundaryStyles, type BoundaryStyle } from "../content/settlements/boundaries";
import { fenceStands } from "./headland";
import {
  bodied,
  castEw,
  castNs,
  castPost,
  drawEw,
  drawNs,
  drawPost,
  footShadow,
  postAt,
  postHalf,
  type Emit,
  type PostRole,
  type Put,
  type Rgb,
} from "./boundary-forms";

type Field = NonNullable<TopographyCell["field"]>;
export type FieldAt = (cx: number, cy: number) => Field | undefined;

/** Standing boundaries run through the middle of the cell outside a field's
 * edge: a yard's solid ring, or the gap between two fields. Each such cell
 * is a node; `links` (n1 e2 s4 w8) joins it to the next node along the run.
 * Corners are square, and a run that stops short (a gate, a house wall, a
 * broken stretch) carries on to the edge of its cell and ends in a post. */
type Node = { cx: number; cy: number; links: number; kind: Boundary };

const DIRS = [
  [1, 0, -1],
  [2, 1, 0],
  [4, 0, 1],
  [8, -1, 0],
] as const;
const opposite = (bit: number) => ((bit << 2) & 15) || bit >> 2;
const key = (x: number, y: number) => (x + 1e5) * 2e5 + (y + 1e5);

/** The standing boundary on `bit` of the field cell at (cx, cy), if any. */
function standingOn(field: FieldAt, cx: number, cy: number, bit: number) {
  const f = field(cx, cy);
  if (!f || f.ditch || !(f.fence & bit)) return;
  const kind = f.enclosure ?? f.boundary;
  if (!boundaryStyles[kind] || !fenceStands(f, bit, cx, cy)) return;
  return kind;
}

/** Cells out from the edge the run stands in. Two fields facing across a
 * two-cell lane share one run, the northern or western field's, so the
 * southern or eastern one reaches two cells out to meet it. */
function reach(field: FieldAt, cx: number, cy: number, bit: number) {
  if (bit === 1 && standingOn(field, cx, cy - 3, 4)) return 2;
  if (bit === 8 && standingOn(field, cx - 3, cy, 2)) return 2;
  return 1;
}

/** Every node whose links can be settled from the fields in range. */
export function boundaryGraph(
  field: FieldAt,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
) {
  const nodes = new Map<number, Node>();
  const node = (x: number, y: number, kind: Boundary) => {
    const k = key(x, y);
    let n = nodes.get(k);
    if (!n) nodes.set(k, (n = { cx: x, cy: y, links: 0, kind }));
    return n;
  };
  const link = (ax: number, ay: number, bx: number, by: number, kind: Boundary) => {
    const bit = bx > ax ? 2 : bx < ax ? 8 : by > ay ? 4 : 1;
    node(ax, ay, kind).links |= bit;
    node(bx, by, kind).links |= opposite(bit);
  };
  const path = (ax: number, ay: number, bx: number, by: number, kind: Boundary) => {
    const sx = Math.sign(bx - ax),
      sy = Math.sign(by - ay);
    while (ax !== bx || ay !== by) {
      link(ax, ay, ax + sx, ay + sy, kind);
      ax += sx;
      ay += sy;
    }
  };
  for (let cy = y0 - 3; cy < y1 + 3; cy++)
    for (let cx = x0 - 3; cx < x1 + 3; cx++) {
      const f = field(cx, cy);
      if (!f || !f.fence || f.ditch) continue;
      for (const [bit, dx, dy] of DIRS) {
        const kind = standingOn(field, cx, cy, bit);
        if (!kind) continue;
        const k = reach(field, cx, cy, bit);
        const fx = cx + dx * k,
          fy = cy + dy * k;
        // The run's two ends, each with the bit that turns the corner there.
        const ends = dx
          ? ([
              [0, -1, 1],
              [0, 1, 4],
            ] as const)
          : ([
              [-1, 0, 8],
              [1, 0, 2],
            ] as const);
        for (const [ex, ey, perp] of ends) {
          if (standingOn(field, cx, cy, perp)) {
            // Outside corner: out to where the perpendicular run stands.
            const kp = reach(field, cx, cy, perp);
            path(fx, fy, fx + ex * kp, fy + ey * kp, kind);
          } else if (standingOn(field, cx + ex, cy + ey, bit)) {
            // Straight on. Where the next edge stands nearer the field, the
            // deeper run steps back in to it.
            const k2 = reach(field, cx + ex, cy + ey, bit);
            if (k2 > k) continue;
            link(fx, fy, fx + ex, fy + ey, kind);
            if (k2 < k)
              path(fx + ex, fy + ey, cx + ex + dx * k2, cy + ey + dy * k2, kind);
          }
          // Inside corners need nothing: the other edge's run ends here too.
        }
      }
    }
  return nodes;
}

const popcount = (n: number) => (n & 1) + ((n >> 1) & 1) + ((n >> 2) & 1) + ((n >> 3) & 1);

/** Pieces keep their node's cell, which sets the ground height they stand on. */
type Piece = { s: BoundaryStyle; depth: number; cx: number; cy: number } & (
  | { kind: "ew" | "ns"; a: number; b: number; at: number; capA: boolean; capB: boolean }
  | { kind: "post"; x: number; y: number; role: PostRole }
);

/** The half-runs and posts of each node, in drawing order: back to front,
 * and at one ground row east-west runs, then north-south, then posts, so a
 * post stands in front of the rails it carries. */
function pieces(nodes: Map<number, Node>, inRange: (n: Node) => boolean) {
  const out: Piece[] = [];
  for (const n of nodes.values()) {
    if (!inRange(n) || !n.links) continue;
    const s = boundaryStyles[n.kind]!;
    const X = n.cx * 16 + 8,
      Y = n.cy * 16 + 8,
      L = n.links,
      end = popcount(L) === 1,
      turns = !!(L & 5) && !!(L & 10),
      body = bodied(s),
      spread = body && (turns || popcount(L) > 2) ? (s.depth + 1) >> 1 : 0;
    // East-west: the node's two halves, a free end carried to the cell edge,
    // and a body spread over the corner it turns.
    const west = L & 8 || (end && L === 2) ? X - 8 : X - (L & 5 ? spread : 0);
    const east = L & 2 || (end && L === 8) ? X + 8 : X + (L & 5 ? spread : 0);
    if (L & 10)
      out.push({
        kind: "ew", s, a: west, b: east, at: Y,
        capA: !(L & 8), capB: !(L & 2), depth: Y, cx: n.cx, cy: n.cy,
      });
    if (L & 5) {
      // Each half is drawn with the run it belongs to: the north half just
      // after the node above, the south half just after this one.
      const north = L & 1 || (end && L === 4) ? Y - 8 : Y;
      const south = L & 4 || (end && L === 1) ? Y + 8 : Y;
      if (north < Y)
        out.push({
          kind: "ns", s, a: north, b: Y, at: X, capA: !(L & 1), capB: false,
          depth: (L & 1 ? Y - 16 : Y - 8) + 0.5, cx: n.cx, cy: n.cy,
        });
      if (south > Y)
        out.push({
          kind: "ns", s, a: Y, b: south, at: X, capA: false, capB: !(L & 4),
          depth: Y + 0.5, cx: n.cx, cy: n.cy,
        });
    }
    // Posts: at every corner and run end, and along straight runs as the
    // style spaces them. A free end's post stands at the cell edge.
    const role: PostRole = end ? "end" : turns || popcount(L) > 2 ? "corner" : "mid";
    const along = L & 10 ? n.cx : n.cy;
    if (!postAt(s, role, along)) continue;
    let px = X,
      py = Y;
    if (end) {
      const inset = 8 - postHalf(s);
      if (L === 2) px = X - inset;
      else if (L === 8) px = X + inset;
      else if (L === 4) py = Y - inset;
      else py = Y + inset;
    }
    out.push({ kind: "post", s, x: px, y: py, role, depth: py + 0.75, cx: n.cx, cy: n.cy });
  }
  return out.sort((a, b) => a.depth - b.depth);
}

function drawPieces(list: Piece[], put: Put) {
  for (const p of list)
    if (p.kind === "post") drawPost(p.s, p.x, p.y, p.role, put);
    else if (p.kind === "ew") drawEw(p.s, p.a, p.b, p.at, p.capA, p.capB, put);
    else drawNs(p.s, p.at, p.a, p.b, p.capA, p.capB, put);
}

/** Every standing boundary round the tile at (x, y): contact shadow first,
 * onto the ground, then the boundaries themselves back to front. */
export function paintFences(
  sample: TopographySample,
  x: number,
  y: number,
  ox: number,
  oy: number,
  put: (px: number, py: number, c: Rgb) => void,
  darken: (px: number, py: number, v: number) => void,
) {
  const R = 3;
  const cache = new Map<number, Field | undefined>();
  const field: FieldAt = (cx, cy) => {
    const k = key(cx, cy);
    if (!cache.has(k)) cache.set(k, sample(cx - ox, cy - oy)?.field);
    return cache.get(k);
  };
  const cx = x + ox,
    cy = y + oy;
  let any = false;
  for (let dy = -R - 3; dy <= R + 3 && !any; dy++)
    for (let dx = -R - 3; dx <= R + 3 && !any; dx++) any = !!field(cx + dx, cy + dy)?.fence;
  if (!any) return;
  const nodes = boundaryGraph(field, cx - R, cy - R, cx + R + 1, cy + R + 1);
  const list = pieces(
    nodes,
    (n) => Math.abs(n.cx - cx) <= R && Math.abs(n.cy - cy) <= R,
  );
  if (!list.length) return;
  const gx = cx * 16,
    gy = cy * 16;
  const inTile = (wx: number, wy: number) =>
    wx >= gx && wy >= gy && wx < gx + 16 && wy < gy + 16;
  for (const p of list)
    if (p.kind === "post") footShadow(p.s, "post", p.x, p.y, 0, dark);
    else if (p.kind === "ew") footShadow(p.s, "ew", p.a, p.at, p.b, dark);
    else footShadow(p.s, "ns", p.at, p.a, p.b, dark);
  drawPieces(list, (wx, wy, c) => {
    if (inTile(wx, wy)) put(wx - gx, wy - gy, c);
  });
  function dark(wx: number, wy: number, v: number) {
    if (inTile(wx, wy)) darken(wx - gx, wy - gy, v);
  }
}

/** The boundaries of a cell range, for the sun-cast shadow pass: what they
 * cast, and which pixels they cover so no shadow falls on the boundary
 * itself. Coordinates are world pixels on flat ground. */
export function boundaryCasts(
  field: FieldAt,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  /** Undefined for a node that should not cast from this pass. */
  emit: (cx: number, cy: number) => Emit | undefined,
  cover: (cx: number, cy: number) => Put,
) {
  const nodes = boundaryGraph(field, x0, y0, x1, y1);
  const list = pieces(
    nodes,
    (n) => n.cx >= x0 && n.cy >= y0 && n.cx < x1 && n.cy < y1,
  );
  for (const p of list) {
    const e = emit(p.cx, p.cy),
      c = cover(p.cx, p.cy);
    if (p.kind === "post") {
      if (e) castPost(p.s, p.x, p.y, p.role, e);
      drawPost(p.s, p.x, p.y, p.role, c);
    } else if (p.kind === "ew") {
      if (e) castEw(p.s, p.a, p.b, p.at, e);
      drawEw(p.s, p.a, p.b, p.at, p.capA, p.capB, c);
    } else {
      if (e) castNs(p.s, p.at, p.a, p.b, e);
      drawNs(p.s, p.at, p.a, p.b, p.capA, p.capB, c);
    }
  }
}

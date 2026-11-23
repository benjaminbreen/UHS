import type { Point } from "../core/types";
import { rngOf } from "../core/random";
import type { AreaDecor } from "./complex";
import { blank, count, DEEP, FLOOR, keepJoined, WALL, WATER, type Draft, type SewerRoom, type SewerSite } from "./sewer";

/** One level of catacombs, or undefined to try again. Roman levels are a
 * maze of narrow galleries with family rooms off them; the Paris ossuary is
 * broader galleries lined with bones over a quarry of pillars. */
export function catacombDraft(seed: string, site: SewerSite, depth: number, attempt: number): Draft | undefined {
  const rng = rngOf(seed, "catacomb", site.id, depth, attempt);
  const d = site.kind === "roman" ? galleries(site, depth, rng, 2, depth === 2) : depth === 1 ? galleries(site, depth, rng, 3, false) : quarry(site, depth, rng);
  if (!keepJoined(d) || count(d) < 160) return undefined;
  return d;
}

// Nodes far enough apart that a gallery's back wall (two and a half cells) fits between rows, with a room above and below.
const SX = 8, SY = 10, W = 76, H = 54;

/** A maze of galleries dug from the stair: a spanning tree over a grid of
 * crossings, a few loops where two diggers met, and rooms cut off them. */
function galleries(site: SewerSite, depth: number, rng: () => number, wide: number, martyr: boolean): Draft {
  const d = blank(site, depth, W, H, 0, 0);
  const cols = Math.floor((W - 8) / SX) + 1, rows = Math.floor((H - 12) / SY) + 1;
  const node = (i: number, j: number): Point => ({ x: 4 + i * SX, y: 6 + j * SY });
  const set = (x: number, y: number, v: number) => {
    if (x > 1 && y > 3 && x < W - 2 && y < H - 2) d.cells[y * W + x] = v;
  };
  const box = (x0: number, y0: number, x1: number, y1: number) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, FLOOR);
  };
  const join = (a: Point, b: Point) => box(Math.min(a.x, b.x), Math.min(a.y, b.y), Math.max(a.x, b.x) + wide - 1, Math.max(a.y, b.y) + wide - 1);
  const seen = new Set<number>(), start = { i: 0, j: Math.floor(rows / 2) };
  const stack = [start];
  seen.add(start.j * cols + start.i);
  while (stack.length) {
    const cur = stack[stack.length - 1];
    const next = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([di, dj]) => ({ i: cur.i + di, j: cur.j + dj }))
      .filter((n) => n.i >= 0 && n.j >= 0 && n.i < cols && n.j < rows && !seen.has(n.j * cols + n.i));
    if (!next.length) {
      stack.pop();
      continue;
    }
    const n = next[Math.floor(rng() * next.length)];
    seen.add(n.j * cols + n.i);
    join(node(cur.i, cur.j), node(n.i, n.j));
    stack.push(n);
  }
  for (let k = Math.floor(cols * rows * 0.15); k > 0; k--) {
    const i = Math.floor(rng() * (cols - 1)), j = Math.floor(rng() * rows);
    if (rng() < 0.5) join(node(i, j), node(i + 1, j));
    else if (j + 1 < rows) join(node(i, j), node(i, j + 1));
  }
  // Rooms off the galleries: family rooms in Rome, chambers of bones in Paris; one larger room on the martyrs' level.
  const taken = new Set<string>([`${start.i},${start.j}`]);
  const room = (i: number, j: number, hw: number, up: number, down: number, use: SewerRoom["use"]) => {
    const c = node(i, j), x0 = c.x - hw + 1, y0 = c.y - up, x1 = c.x + hw, y1 = c.y + wide - 1 + down;
    if (x0 < 3 || y0 < 5 || x1 > W - 4 || y1 > H - 3) return;
    box(x0, y0, x1, y1);
    d.rooms.push({ x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1, use });
    taken.add(`${i},${j}`);
  };
  if (martyr) room(Math.floor(cols / 2) + Math.floor(rng() * 3) - 1, Math.floor(rng() * rows), 5, 3, 3, "crypt");
  for (let k = 4 + Math.floor(rng() * 4); k > 0; k--) {
    const i = 1 + Math.floor(rng() * (cols - 1)), j = Math.floor(rng() * rows);
    if (!taken.has(`${i},${j}`)) room(i, j, 3, 2, 2, site.kind === "roman" ? "cubiculum" : "bones");
  }
  const e = node(start.i, start.j);
  d.entry = { x: e.x, y: e.y };
  d.shafts.push({ ...d.entry, to: depth === 1 ? "street" : "up", ...(depth === 1 ? { world: worldOf(site) } : {}) });
  return d;
}

/** The quarry under the ossuary: stone taken out in a grid of galleries round
 * pillars left to hold the city up, flooded at the bottom. */
function quarry(site: SewerSite, depth: number, rng: () => number): Draft {
  const d = blank(site, depth, W, H, 0, 0);
  const set = (x: number, y: number, v: number) => {
    if (x > 1 && y > 3 && x < W - 2 && y < H - 2) d.cells[y * W + x] = v;
  };
  for (let y = 5; y < H - 3; y++) for (let x = 3; x < W - 3; x++) if ((x - 3) % 8 < 3 || (y - 5) % 7 < 3) set(x, y, FLOOR);
  // Falls of roof, and pillars the quarrymen built where the rock was taken.
  for (let n = 0; n < 14; n++) {
    const x = 4 + Math.floor(rng() * (W - 8)), y = 6 + Math.floor(rng() * (H - 10));
    for (let dy = 0; dy < 3; dy++) for (let dx = 0; dx < 3; dx++) if (rng() < 0.7) set(x + dx, y + dy, WALL);
  }
  if (depth === 3) {
    const line = Math.floor(H * 0.5);
    for (let y = line; y < H; y++) for (let x = 0; x < W; x++) if (d.cells[y * W + x] === FLOOR) d.cells[y * W + x] = y > line + 8 && rng() < 0.5 ? DEEP : WATER;
  }
  d.entry = { x: 4, y: 6 };
  set(4, 6, FLOOR);
  d.shafts.push({ ...d.entry, to: "up" });
  return d;
}

const worldOf = (site: SewerSite): Point => {
  const [x, y] = site.id.split(",").map(Number);
  return { x, y };
};

/** Dust and broken pottery underfoot, bones where graves were broken, and the quarrymen's pillars. */
export function catacombDecor(site: SewerSite, d: Draft, decor: AreaDecor[], rng: () => number, k: { at(x: number, y: number): number; free(x: number, y: number): boolean; safe(x: number, y: number): boolean; block(x: number, y: number): void }) {
  const { w, h, cells } = d, roman = site.kind === "roman";
  for (let y = 5; y < h - 2; y++)
    for (let x = 2; x < w - 2; x++) {
      const c = cells[y * w + x], r = rng();
      if (c !== FLOOR || !k.free(x, y)) continue;
      if (!roman && d.depth > 1 && r < 0.01 && k.safe(x, y)) decor.push({ type: "quarry-pillar", x, y, solid: true, v: rng() }), k.block(x, y);
      else if (r < 0.07) decor.push({ type: roman ? (rng() < 0.6 ? "tuff-dust" : rng() < 0.6 ? "sherds" : "bone-bits") : rng() < 0.7 ? "lime-dust" : "bone-bits", x, y, solid: false, v: rng() });
    }
}

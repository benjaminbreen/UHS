import type { Point } from "../core/types";
import { blank, count, DEEP, FLOOR, keepJoined, LEDGE, rngOf, SILT, WALL, WATER, type Draft, type SewerDecor, type SewerRoom, type SewerSite } from "./sewer";

/** In a mine, LEDGE is a road laid with rails, FLOOR is worked ground,
 * WATER is a drainage gutter or flooded floor, DEEP the sump, SILT fallen rock. */
export const MINE_NAMES = {
  coal: { level: ["the pit bottom", "the main haulage road"], workings: ["the coal face", "the bord-and-pillar district"], old: ["the old workings", "the drowned seam", "the goaf"] },
  metal: { level: ["the main level", "the adit level"], workings: ["the stopes", "the lode"], old: ["the old men's workings", "the drowned levels"] },
  salt: { level: ["the main gallery"], workings: ["the salt chambers"], old: ["the old salt workings", "the brine lake"] },
} as const;

function grid(d: Draft) {
  const { w, h, cells } = d;
  const set = (x: number, y: number, v: number) => {
    if (x > 1 && y > 4 && x < w - 2 && y < h - 2) cells[y * w + x] = v;
  };
  const box = (x: number, y: number, bw: number, bh: number, v: number) => {
    for (let yy = y; yy < y + bh; yy++) for (let xx = x; xx < x + bw; xx++) set(xx, yy, v);
  };
  const get = (x: number, y: number) => (x < 0 || y < 0 || x >= w || y >= h ? WALL : cells[y * w + x]);
  return { set, box, get };
}

/** One level of a mine, or undefined to try again. */
export function mineDraft(seed: string, site: SewerSite, depth: number, attempt: number): Draft | undefined {
  const rng = rngOf(seed, "mine", site.id, depth, attempt);
  const d = depth === 1 ? level(site, rng) : workings(site, depth, rng);
  if (depth === 3) decay(d, rng);
  if (!keepJoined(d) || count(d) < 150) return undefined;
  return d;
}

/** The pit bottom or adit mouth, and the main road in with its rails and
 * gutter, district roads off it to stables, cabins and the first faces. */
function level(site: SewerSite, rng: () => number): Draft {
  const w = 84, h = 52, d = blank(site, 1, w, h, 0, 0);
  const { set, box } = grid(d);
  const [ex, ey] = site.id.split(",").map(Number);
  const cy = 22 + Math.floor(rng() * 8);
  const shaft = d.mouth === "cage";
  d.decor = [];
  // The road: a walkway, the rails, and the gutter that drains to the sump.
  const start = shaft ? 12 : 3, end = w - 6 - Math.floor(rng() * 8);
  for (let x = start; x < end; x++) set(x, cy - 1, FLOOR), set(x, cy, LEDGE), set(x, cy + 1, WATER);
  if (shaft) {
    box(4, cy - 4, 8, 6, FLOOR);
    for (let x = 4; x < 12; x++) set(x, cy, LEDGE);
    for (let x = 7; x < 12; x++) set(x, cy + 1, WATER);
    box(4, cy + 1, 3, 2, DEEP);
    d.rooms.push({ x: 4, y: cy - 4, w: 8, h: 6, use: "eye" });
    d.entry = { x: 8, y: cy - 4 };
    d.decor.push({ type: "pump", x: 5, y: cy - 2, solid: true, v: rng() });
  } else {
    box(3, cy - 2, 3, 4, FLOOR);
    box(3, cy + 1, 2, 2, DEEP);
    d.entry = { x: 4, y: cy - 2 };
  }
  d.shafts.push({ ...d.entry, to: "street", world: { x: ex, y: ey } });
  if (site.place.year >= 1910) for (let x = start + 4; x < end; x += 11) d.lamps.push({ x, y: cy - 1 });
  // District roads, north and south, each to a room at its end.
  const coal = site.kind === "coal", ponies = (coal || site.kind === "salt") && site.place.year >= 1750 && site.place.year < 1995;
  const uses: SewerRoom["use"][] = [...(ponies ? (["stable"] as const) : []), "cabin", "face", "face", "plain", ...(coal ? [] : (["stope"] as const))];
  let k = 0;
  for (let x = start + 6 + Math.floor(rng() * 4); x < end - 4; x += 9 + Math.floor(rng() * 6), k++) {
    const north = rng() < 0.5, len = 5 + Math.floor(rng() * 9);
    for (let s = 1; s <= len; s++) {
      const y = north ? cy - 1 - s : cy + 1 + s;
      set(x, y, LEDGE), set(x + 1, y, FLOOR);
    }
    // A ventilation door where the district leaves the main road, to keep the air on its course.
    if (coal && site.place.year >= 1750) d.decor.push({ type: "airdoor", x, y: north ? cy - 3 : cy + 3, solid: false, v: rng() });
    const use = uses[k % uses.length];
    const rw = use === "stable" ? 10 : 6 + Math.floor(rng() * 4), rh = 4 + Math.floor(rng() * 3);
    const rx = x - Math.floor(rw / 2), ry = north ? cy - 1 - len - rh : cy + 2 + len;
    if (ry < 6 || ry + rh > h - 3) continue;
    box(rx, ry, rw, rh, FLOOR);
    d.rooms.push({ x: rx, y: ry, w: rw, h: rh, use });
  }
  return d;
}

/** The workings: coal in bords round pillars left to hold the roof, metal in
 * stopes cut up along the lode between two levels, salt in great chambers. */
function workings(site: SewerSite, depth: number, rng: () => number): Draft {
  const w = 80, h = 52, d = blank(site, depth, w, h, 0, 0);
  const { set, box, get } = grid(d);
  d.decor = [];
  if (site.kind === "coal") {
    const cy = 20 + Math.floor(rng() * 10);
    // Bords six cells apart, headings five apart, the coal between left as pillars.
    for (let y = 7; y < h - 3; y++) for (let x = 20; x < w - 4; x++) if ((x - 20) % 6 < 2 || (y - 7) % 5 < 2) set(x, y, FLOOR);
    for (let x = 3; x < w - 4; x++) set(x, cy - 1, FLOOR), set(x, cy, LEDGE);
    box(3, cy + 1, 2, 2, DEEP);
    // Pillars robbed on the way back out leave the goaf: fallen roof, a few stooks standing.
    const gx = 44 + Math.floor(rng() * 16);
    for (let y = 7; y < h - 3; y++) for (let x = gx; x < w - 4; x++) if (get(x, y) === WALL ? rng() < 0.55 : rng() < 0.25) set(x, y, SILT);
    // The live faces along the far edges of the district.
    for (let y = 7; y < h - 8; y += 10) d.rooms.push({ x: 20 + Math.floor(rng() * 3) * 6, y, w: 8, h: 2, use: "face" });
    for (let x = 20; x < gx - 6; x += 12) d.rooms.push({ x, y: h - 9, w: 8, h: 2, use: "face" });
    d.entry = { x: 4, y: cy - 1 };
    for (let n = 0; n < 6; n++) {
      const x = 22 + Math.floor(rng() * 40), y = 8 + Math.floor(rng() * (h - 14));
      if (get(x, y) === FLOOR) set(x, y, WATER);
    }
  } else if (site.kind === "metal") {
    const y1 = 12 + Math.floor(rng() * 4), y2 = 34 + Math.floor(rng() * 6);
    for (let x = 3; x < w - 4; x++) set(x, y1, LEDGE), set(x, y1 + 1, FLOOR);
    for (let x = 8; x < w - 6; x++) set(x, y2, FLOOR), set(x, y2 + 1, LEDGE);
    // The lode dips east: each stope leans with it from the lower level to the upper.
    for (let x = 10 + Math.floor(rng() * 4); x < w - 14; x += 8 + Math.floor(rng() * 6)) {
      const sw = 3 + Math.floor(rng() * 4), whole = rng() < 0.75;
      let x0 = x, x1 = x;
      for (let y = y1 + 2; y < y2; y++) {
        const lean = Math.floor((y - y1) / 4), top = whole || y > y1 + (y2 - y1) / 2;
        if (!top) continue;
        for (let s = 0; s < sw; s++) set(x + lean + s, y, FLOOR);
        x0 = Math.min(x0, x + lean), x1 = Math.max(x1, x + lean + sw);
        if ((y - y1) % 4 === 0) d.decor.push({ type: "stull", x: x + lean, y, solid: false, v: sw });
      }
      d.rooms.push({ x: x0, y: y1 + 2, w: x1 - x0, h: y2 - y1 - 2, use: "stope" });
    }
    // A winze: a ladderway between the levels, for the air and the men.
    const wx = w - 10;
    for (let y = y1 + 2; y < y2; y++) set(wx, y, FLOOR);
    // Crosscuts north off the upper level, driving for the next lode.
    for (let n = 0; n < 3; n++) {
      const x = 12 + Math.floor(rng() * (w - 24)), len = 3 + Math.floor(rng() * 4);
      for (let s = 1; s <= len; s++) set(x, y1 - s, FLOOR);
      box(x - 2, y1 - len - 2, 5, 2, FLOOR);
      d.rooms.push({ x: x - 2, y: y1 - len - 2, w: 5, h: 2, use: "face" });
    }
    box(8, y2 + 2, 3, 2, DEEP);
    for (let x = 9; x < 30; x++) if (rng() < 0.3) set(x, y2, WATER);
    d.entry = { x: 4, y: y1 };
  } else {
    // Salt: chambers on a loose grid, joined by broad galleries.
    const cols = 4, rows = 2, cw = (w - 12) / cols, ch = (h - 14) / rows;
    const rooms: SewerRoom[] = [];
    for (let j = 0; j < rows; j++)
      for (let i = 0; i < cols; i++) {
        const rw = 8 + Math.floor(rng() * (cw - 10)), rh = 6 + Math.floor(rng() * (ch - 9));
        const rx = Math.floor(8 + i * cw + rng() * (cw - rw - 2)), ry = Math.floor(8 + j * ch + rng() * (ch - rh - 2));
        box(rx, ry, rw, rh, FLOOR);
        rooms.push({ x: rx, y: ry, w: rw, h: rh, use: "chamber" });
      }
    const mid = (r: SewerRoom): Point => ({ x: r.x + Math.floor(r.w / 2), y: r.y + Math.floor(r.h / 2) });
    const gallery = (a: Point, b: Point) => {
      for (let x = Math.min(a.x, b.x); x <= Math.max(a.x, b.x); x++) set(x, a.y - 1, FLOOR), set(x, a.y, LEDGE), set(x, a.y + 1, FLOOR);
      for (let y = Math.min(a.y, b.y); y <= Math.max(a.y, b.y); y++) set(b.x, y, FLOOR), set(b.x + 1, y, FLOOR);
    };
    for (let j = 0; j < rows; j++) for (let i = 0; i + 1 < cols; i++) gallery(mid(rooms[j * cols + i]), mid(rooms[j * cols + i + 1]));
    for (let i = 0; i < cols; i += 2) gallery(mid(rooms[i]), mid(rooms[cols + i]));
    const first = mid(rooms[0]);
    for (let x = 3; x < first.x; x++) set(x, first.y - 1, FLOOR), set(x, first.y, LEDGE);
    // The biggest chamber is the chapel; one other holds a brine lake.
    const chapel = rooms.reduce((a, b) => (b.w * b.h > a.w * a.h ? b : a));
    chapel.use = "chapel";
    const lake = rooms.find((r) => r !== chapel && r !== rooms[0] && r.w >= 9)!;
    if (lake) {
      box(lake.x + 2, lake.y + 2, lake.w - 4, lake.h - 3, WATER);
      box(lake.x + 3, lake.y + 3, lake.w - 6, lake.h - 5, DEEP);
    } else box(3, first.y + 1, 2, 2, DEEP);
    d.rooms.push(...rooms);
    d.entry = { x: 4, y: first.y - 1 };
  }
  d.shafts.push({ ...d.entry, to: "up" });
  return d;
}

/** Abandoned: the rails taken up, the roof come down in places, the dip full of water. */
function decay(d: Draft, rng: () => number) {
  const { w, h, cells } = d;
  const { set, get } = grid(d);
  for (let i = 0; i < w * h; i++) if (cells[i] === LEDGE && rng() < 0.7) cells[i] = FLOOR;
  const line = Math.floor(h * (0.55 + rng() * 0.15));
  for (let y = line; y < h; y++) for (let x = 0; x < w; x++) if (get(x, y) === FLOOR || get(x, y) === LEDGE) set(x, y, y > line + 6 && rng() < 0.4 ? DEEP : WATER);
  for (let n = 0; n < 9; n++) {
    const fx = 8 + Math.floor(rng() * (w - 16)), fy = 7 + Math.floor(rng() * (h - 12)), r = 1 + rng() * 2.5;
    for (let y = Math.floor(fy - r); y <= fy + r; y++)
      for (let x = Math.floor(fx - r); x <= fx + r; x++) {
        const c = get(x, y);
        if (c !== WALL && Math.hypot(x - fx, y - fy) <= r) set(x, y, rng() < 0.15 ? WALL : c === WATER || c === DEEP ? c : SILT);
      }
  }
  d.decor = (d.decor ?? []).filter((o) => o.type !== "airdoor");
}

type Helpers = {
  at(x: number, y: number): number;
  free(x: number, y: number): boolean;
  safe(x: number, y: number): boolean;
  block(x: number, y: number): void;
  taken: Set<number>;
  dist: Int32Array;
};

/** A mine's furniture: tubs on the rails, stacked props, ponies in their
 * stalls, brattice on the walls, dust and spoil underfoot. */
export function mineDecor(site: SewerSite, d: Draft, decor: SewerDecor[], lamps: Point[], rng: () => number, k: Helpers) {
  const { w, h, cells } = d;
  const { at, free, safe, block, taken } = k;
  const coal = site.kind === "coal", live = d.depth < 3;
  for (const room of d.rooms) {
    const cx = room.x + Math.floor(room.w / 2);
    if (room.use === "stable")
      for (let x = room.x; x < room.x + room.w; x += 2)
        if (free(x, room.y) && safe(x, room.y)) decor.push({ type: live ? "stall" : "stall-empty", x, y: room.y, solid: true, v: rng() }), block(x, room.y);
    if (room.use === "cabin") for (const [type, x] of [["crate", room.x + 1], ["barrel", room.x + room.w - 2]] as const) if (free(x, room.y) && safe(x, room.y)) decor.push({ type, x, y: room.y, solid: true, v: rng() }), block(x, room.y);
    if ((room.use === "chapel" || room.use === "eye") && site.place.year >= 1900) lamps.push({ x: cx, y: room.y });
    if (room.use === "chapel") for (const x of [room.x + 2, room.x + room.w - 3]) if (free(x, room.y + 1) && safe(x, room.y + 1)) decor.push({ type: "salt-pillar", x, y: room.y + 1, solid: true, v: rng() }), block(x, room.y + 1);
  }
  if (d.mouth === "cage") decor.push({ type: "pitcage", x: d.entry.x, y: d.entry.y - 1, solid: false, v: 0 });
  for (let y = 5; y < h - 2; y++)
    for (let x = 2; x < w - 2; x++) {
      const i = y * w + x, c = cells[i], r = rng();
      if (c === WALL && at(x, y - 1) === WALL && at(x, y + 1) !== WALL && at(x, y + 1) !== DEEP) {
        if (r < 0.06 && coal && live) decor.push({ type: "brattice", x, y, solid: false, v: rng() });
        else if (r < 0.1 && site.place.year >= 1880 && live) decor.push({ type: "airpipe", x, y, solid: false, v: rng() });
        else if (r < 0.14) decor.push({ type: site.kind === "salt" ? "salt-bloom" : "drip-stain", x, y, solid: false, v: rng() });
      } else if (c === LEDGE && !taken.has(i)) {
        if (r < 0.03 && live && safe(x, y)) decor.push({ type: "tub", x, y, solid: true, v: rng() }), block(x, y);
        else if (r < 0.06 && !live) decor.push({ type: "sleeper", x, y, solid: false, v: rng() });
      } else if ((c === FLOOR || c === SILT) && !taken.has(i)) {
        if (r < 0.012 && k.dist[i] > 4 && safe(x, y)) decor.push({ type: live ? "props" : "fall", x, y, solid: true, v: rng() }), block(x, y);
        else if (r < 0.1) decor.push({ type: c === SILT ? "spoil" : coal ? "dust" : ["spoil", "puddle", "grit"][Math.floor(rng() * 3)], x, y, solid: false, v: rng() });
      }
    }
}

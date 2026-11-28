import { mineFinds, oreItems } from "../content/mines";
import { findFits, personFits, sewerFinds, type SewerFind, type SewerKind, type SewerPerson, type SewerPlace, type SewerDepth, type TunnelDepth, type TunnelKind } from "../content/sewers";
import { hash, pickWeighted as pick, rngOf } from "../core/random";
import type { Inventory, Point } from "../core/types";
import { N4, type Area, type AreaDecor, type AreaFolk, type AreaThing } from "./complex";
import type { Lane } from "./v3/types";
import { mineDraft, mineDecor, MINE_NAMES } from "./mine";
import { catacombDraft, catacombDecor } from "./catacomb";
import { CATACOMB_NAMES, catacombFinds } from "../content/catacombs";
import type { CatacombDepth, CatacombKind } from "../content/sewers/types";

export const WALL = 0, LEDGE = 1, WATER = 2, DEEP = 3, GRATE = 4, FLOOR = 5, BRIDGE = 6, SILT = 7;
/** Feet can go here. */
export const walkable = (c: number) => c === LEDGE || c === WATER || c === FLOOR || c === BRIDGE || c === SILT;

export type TunnelNetwork = "sewer" | "mine" | "catacomb";
export type SewerSite = {
  /** The cell in the street the first ladder comes down from, or the door of
   * the mine's headframe or adit, as "x,y". */
  id: string;
  network: TunnelNetwork;
  kind: TunnelKind;
  /** What a mine works: "coal", "tin", "salt". */
  ore?: string;
  /** A mine wound by a shaft rather than walked into by an adit. */
  shaft?: boolean;
  place: SewerPlace;
  /** Who works or lives down here at this place and date. */
  people: SewerPerson[];
};
/** A way up: a ladder under a lid in the street, or back to the level above. */
export type SewerShaft = { x: number; y: number; to: "street" | "up"; world?: Point; lid?: { cx: number; cy: number } };
export type SewerRoom = {
  x: number; y: number; w: number; h: number;
  use: "overflow" | "depot" | "camp" | "pump" | "silt" | "hall" | "plain" | "eye" | "stable" | "cabin" | "face" | "stope" | "chamber" | "chapel" | "cubiculum" | "crypt" | "bones";
  foul?: boolean;
  /** A mine's bad air: firedamp burns, blackdamp smothers. Sewer gas when unset. */
  damp?: "fire" | "black";
};
export type SewerLevel = Area & {
  site: string;
  network: TunnelNetwork;
  layer: TunnelDepth;
  kind: TunnelKind;
  /** World cell of this level's cell 0,0; only the street level lies under the world. */
  ox: number;
  oy: number;
  shafts: SewerShaft[];
  rooms: SewerRoom[];
  /** Fixed electric lamps, by cell. */
  lamps: Point[];
  rats: Point[];
  /** How a mine's first level meets the surface: the cage at the shaft bottom, or an adit's mouth. */
  mouth?: "cage" | "adit";
};

export const sewerSpace = (site: string, depth: number, network: TunnelNetwork = "sewer") => `${network}:${site}:${depth}`;
export function parseSewerSpace(space: string) {
  const m = /^(sewer|mine|catacomb):(-?\d+,-?\d+):(\d+)$/.exec(space);
  return m ? { network: m[1] as TunnelNetwork, site: m[2], depth: Number(m[3]) } : undefined;
}
export const sewerLayer = (depth: number, network: TunnelNetwork = "sewer"): TunnelDepth =>
  network === "mine" ? (depth <= 1 ? "level" : depth === 2 ? "workings" : "old") : network === "catacomb" ? (depth <= 1 ? "upper" : depth === 2 ? "lower" : "deep") : depth <= 1 ? "street" : depth === 2 ? "trunk" : "old";


/** What the generator may ask of the streets overhead. */
export type StreetProbe = {
  lane(x: number, y: number): Lane | undefined;
  lids(x: number, y: number): { cx: number; cy: number }[];
};

const NAMES: Record<SewerKind, Record<SewerDepth, string[]>> = {
  brick: { street: ["the brick sewers"], trunk: ["the low-level interceptor", "a main outfall sewer", "a storm-relief sewer"], old: ["a buried river", "the old culvert", "a forgotten brick drain"] },
  gallery: { street: ["the sewer galleries"], trunk: ["a main collector", "the great collector"], old: ["the old quarries", "a walled-up gallery"] },
  concrete: { street: ["the storm drains"], trunk: ["a trunk sewer", "a storm reservoir"], old: ["a buried creek", "a sealed shelter"] },
  tropical: { street: ["the storm channels"], trunk: ["the box culvert to the sea"], old: ["an old stone conduit"] },
  collector: { street: ["the service collectors"], trunk: ["the heating-main collector"], old: ["a sealed shelter", "a buried stream"] },
};

/** One level of a sewer: always the same for the same world, site and depth. */
export function sewerLevel(seed: string, site: SewerSite, depth: number, probe?: StreetProbe): SewerLevel {
  const [ex, ey] = site.id.split(",").map(Number);
  for (let attempt = 0; ; attempt++) {
    const level = site.network === "mine" ? mineDraft(seed, site, depth, attempt) : site.network === "catacomb" ? catacombDraft(seed, site, depth, attempt) : depth === 1 && probe && attempt < 2 ? streets(seed, site, ex, ey, probe) : depth === 1 ? warren(seed, site, ex, ey, attempt) : depth === 2 ? trunk(seed, site, attempt) : old(seed, site, attempt);
    if (level) return furnish(seed, site, level);
  }
}

export type Draft = Omit<SewerLevel, "things" | "decor" | "folk" | "flow" | "rats" | "name"> & { name?: string; decor?: AreaDecor[] };

export function blank(site: SewerSite, depth: number, w: number, h: number, ox: number, oy: number): Draft {
  return { space: sewerSpace(site.id, depth, site.network), site: site.id, network: site.network, depth, layer: sewerLayer(depth, site.network), kind: site.kind, w, h, ox, oy, cells: new Uint8Array(w * h), entry: { x: 0, y: 0 }, shafts: [], rooms: [], lamps: [],
    mouth: site.network === "mine" && depth === 1 ? (site.shaft ? "cage" : "adit") : undefined };
}

/** The street level, laid under the streets themselves: a sewer down the
 * middle of every carriageway, a chamber at every junction, and a ladder up
 * to every lid in the road. */
function streets(seed: string, site: SewerSite, ex: number, ey: number, probe: StreetProbe): Draft | undefined {
  const w = 72, h = 56, ox = ex - 36, oy = ey - 28;
  const d = blank(site, 1, w, h, ox, oy);
  const { cells } = d;
  const set = (x: number, y: number, v: number) => {
    if (x > 0 && y > 3 && x < w - 1 && y < h - 1) cells[y * w + x] = v;
  };
  const junctions = new Uint8Array(w * h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const lane = probe.lane(ox + x, oy + y);
      if (!lane) continue;
      if (lane.junction) {
        junctions[y * w + x] = 1;
        continue;
      }
      // Two cells of channel on the street's centre line, a walkway either side,
      // whether or not the street is that wide.
      const c0 = Math.floor(lane.span / 2);
      if (lane.at !== c0) continue;
      for (let o = -2; o <= 1; o++) {
        const px = lane.axis === "x" ? x : x + o, py = lane.axis === "x" ? y + o : y;
        if (cells[py * w + px] !== WATER) set(px, py, o === -1 || o === 0 ? WATER : LEDGE);
      }
    }
  // Each junction is a chamber where the channels cross.
  const seen = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    if (!junctions[i] || seen[i]) continue;
    let x0 = w, y0 = h, x1 = -1, y1 = -1;
    const stack = [i];
    seen[i] = 1;
    while (stack.length) {
      const c = stack.pop()!, cx = c % w, cy = (c - cx) / w;
      x0 = Math.min(x0, cx), x1 = Math.max(x1, cx), y0 = Math.min(y0, cy), y1 = Math.max(y1, cy);
      for (const [dx, dy] of N4) {
        const nx = cx + dx, ny = cy + dy, n = ny * w + nx;
        if (nx >= 0 && ny >= 0 && nx < w && ny < h && junctions[n] && !seen[n]) (seen[n] = 1), stack.push(n);
      }
    }
    const mx = x0 + Math.floor((x1 - x0 + 1) / 2), my = y0 + Math.floor((y1 - y0 + 1) / 2);
    for (let y = y0 - 1; y <= y1 + 1; y++)
      for (let x = x0 - 1; x <= x1 + 1; x++) {
        const outside = x < x0 || x > x1 || y < y0 || y > y1;
        if (outside && cells[y * w + x] === WALL && !(x - mx >= -3 && x - mx <= 2 && y - my >= -3 && y - my <= 2)) continue;
        const room = x - mx >= -3 && x - mx <= 2 && y - my >= -3 && y - my <= 2;
        const arm = (x - mx >= -2 && x - mx <= 1) || (y - my >= -2 && y - my <= 1);
        if (x === mx || x === mx - 1 || y === my || y === my - 1) set(x, y, WATER);
        else if (room || arm) set(x, y, LEDGE);
      }
  }
  // A ladder under every lid, with a short side passage where the lid is off the sewer's line.
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      for (const lid of probe.lids(ox + x, oy + y)) {
        if (x < 2 || y < 5 || x > w - 3 || y > h - 3) continue;
        const lane = probe.lane(ox + x, oy + y)!;
        if (cells[y * w + x] === WALL) {
          const c0 = Math.floor(lane.span / 2), step = lane.at < c0 ? 1 : -1;
          for (let k = 0; k < lane.span; k++) {
            const px = lane.axis === "x" ? x : x + step * k, py = lane.axis === "x" ? y + step * k : y;
            if (k > 0 && cells[py * w + px] !== WALL) break;
            set(px, py, LEDGE);
          }
        }
        d.shafts.push({ x, y, to: "street", world: { x: ox + x, y: oy + y }, lid });
      }
  const entry = d.shafts.find((s) => s.world!.x === ex && s.world!.y === ey);
  if (!entry) return undefined;
  d.entry = { x: entry.x, y: entry.y };
  if (!keepJoined(d) || count(d) < 70) return undefined;
  d.shafts = d.shafts.filter((s) => cells[s.y * w + s.x] !== WALL);
  // Where a sewer runs off the edge of what is drawn, a grating closes it.
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const c = cells[y * w + x];
      if (c === WALL) continue;
      if (x <= 1 || x >= w - 2 || y <= 4 || y >= h - 2) cells[y * w + x] = x === 0 || x === w - 1 || y <= 3 || y === h - 1 ? WALL : GRATE;
    }
  sideRooms(site, d, rngOf(seed, "sewer-rooms", site.id), 0.55);
  return d;
}

/** A street level with no marked streets to follow: a main sewer through the
 * ladder, laterals off it at intervals. */
function warren(seed: string, site: SewerSite, ex: number, ey: number, attempt: number): Draft | undefined {
  const rng = rngOf(seed, "sewer-warren", site.id, attempt);
  const w = 60, h = 48, d = blank(site, 1, w, h, ex - 30, ey - 24);
  const { cells } = d;
  const run = (x: number, y: number, horizontal: boolean, len: number) => {
    for (let k = 0; k < len; k++) {
      const px = horizontal ? x + k : x, py = horizontal ? y : y + k;
      for (const o of [-1, 0, 1]) {
        const qx = horizontal ? px : px + o, qy = horizontal ? py + o : py;
        if (qx < 2 || qy < 5 || qx > w - 3 || qy > h - 3) continue;
        const i = qy * w + qx;
        if (o === 0) cells[i] = WATER;
        else if (cells[i] === WALL) cells[i] = LEDGE;
      }
    }
  };
  const horizontal = rng() < 0.5;
  if (horizontal) run(2, 24, true, w - 4);
  else run(30, 5, false, h - 8);
  for (let at = 6 + Math.floor(rng() * 6); at < (horizontal ? w : h) - 6; at += 9 + Math.floor(rng() * 8)) {
    const len = 8 + Math.floor(rng() * 14);
    if (horizontal) run(at, rng() < 0.5 ? 24 - len : 24, false, len);
    else run(rng() < 0.5 ? 30 - len : 30, at, true, len);
  }
  d.entry = horizontal ? { x: 30, y: 24 } : { x: 30, y: 24 };
  d.shafts.push({ x: 30, y: 24, to: "street", world: { x: ex, y: ey } });
  if (!keepJoined(d)) return undefined;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (cells[y * w + x] !== WALL && (x <= 2 || x >= w - 3 || y <= 5 || y >= h - 3)) cells[y * w + x] = GRATE;
  sideRooms(site, d, rng, 0.7);
  return d;
}

/** The big sewer the street sewers fall into: a deep channel between two
 * walkways, crossed by footbridges, with the incoming sewers dropping in
 * over weirs and a hall that takes the storm water. */
function trunk(seed: string, site: SewerSite, attempt: number): Draft | undefined {
  const rng = rngOf(seed, "sewer-trunk", site.id, attempt);
  const w = 84, h = 54, d = blank(site, 2, w, h, 0, 0);
  const { cells } = d;
  const set = (x: number, y: number, v: number) => {
    if (x > 1 && y > 3 && x < w - 2 && y < h - 2) cells[y * w + x] = v;
  };
  const cy = 20 + Math.floor(rng() * 14);
  const wide = site.kind === "gallery" || site.kind === "collector" ? 4 : 3;
  for (let x = 2; x < w - 2; x++)
    for (let y = cy - wide; y <= cy + wide; y++) set(x, y, Math.abs(y - cy) <= wide - 2 ? DEEP : LEDGE);
  for (let x = 6 + Math.floor(rng() * 6); x < w - 6; x += 13 + Math.floor(rng() * 9))
    for (let y = cy - wide + 2; y <= cy + wide - 2; y++) set(x, y, BRIDGE);
  // Incoming sewers, north and south, each over a weir into the channel.
  const branches: Point[] = [];
  for (let x = 8 + Math.floor(rng() * 5); x < w - 8; x += 10 + Math.floor(rng() * 9)) {
    const north = rng() < 0.5, len = 6 + Math.floor(rng() * 10);
    for (let k = 1; k <= len; k++) {
      const y = north ? cy - wide - k : cy + wide + k;
      set(x - 1, y, LEDGE), set(x, y, WATER), set(x + 1, y, LEDGE);
    }
    const end = { x, y: north ? cy - wide - len : cy + wide + len };
    branches.push(end);
    if (rng() < 0.4) for (let y = end.y - 1; y <= end.y + 1; y++) for (let x2 = x - 2; x2 <= x + 2; x2++) if (cells[y * w + x2] === WALL) set(x2, y, LEDGE);
  }
  // The storm hall: piers in rows on a dry floor, or a pumping station.
  const south = cy < h / 2;
  const hw = 18 + Math.floor(rng() * 10), hh = 11 + Math.floor(rng() * 5);
  const hx = 4 + Math.floor(rng() * (w - hw - 8)), hy = south ? cy + wide + 4 : cy - wide - 3 - hh;
  if (hy > 4 && hy + hh < h - 2) {
    for (let y = hy; y < hy + hh; y++) for (let x = hx; x < hx + hw; x++) set(x, y, FLOOR);
    const door = hx + Math.floor(hw / 2);
    for (let y = Math.min(hy, cy) ; y <= Math.max(hy + hh - 1, cy); y++) if (cells[y * w + door] === WALL) set(door, y, LEDGE), set(door + 1, y, LEDGE);
    d.rooms.push({ x: hx, y: hy, w: hw, h: hh, use: "hall" });
  }
  d.entry = { x: 3 + Math.floor(rng() * 6), y: cy - wide };
  d.shafts.push({ x: d.entry.x, y: d.entry.y, to: "up" });
  if (!keepJoined(d)) return undefined;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) if (cells[y * w + x] !== WALL && (x <= 2 || x >= w - 3)) cells[y * w + x] = GRATE;
  sideRooms(site, d, rng, 0.6);
  return d;
}

/** Below the trunk: what the town was built over. Galleries quarried for
 * stone, or a stream that was walled in and roofed over. */
function old(seed: string, site: SewerSite, attempt: number): Draft | undefined {
  const rng = rngOf(seed, "sewer-old", site.id, attempt);
  const w = 64, h = 48, d = blank(site, 3, w, h, 0, 0);
  const { cells } = d;
  const at = (x: number, y: number) => (x < 0 || y < 0 || x >= w || y >= h ? WALL : cells[y * w + x]);
  const set = (x: number, y: number, v: number) => {
    if (x > 1 && y > 3 && x < w - 2 && y < h - 2) cells[y * w + x] = v;
  };
  if (site.kind === "gallery" || site.kind === "collector" && rng() < 0.3) {
    // Quarry galleries: a grid of cut passages round pillars left standing.
    for (let y = 5; y < h - 3; y++) for (let x = 3; x < w - 3; x++) {
      const gx = (x + 1) % 7, gy = (y + 1) % 6;
      if ((gx <= 2 || gy <= 2) && rng() < 0.97) set(x, y, FLOOR);
    }
    for (let i = 0; i < 40; i++) {
      const x = 4 + Math.floor(rng() * (w - 8)), y = 6 + Math.floor(rng() * (h - 10));
      for (let dy = 0; dy < 3; dy++) for (let dx = 0; dx < 4; dx++) if (rng() < 0.8) set(x + dx, y + dy, WALL);
    }
  } else {
    // A stream walled in and roofed over: straight runs and square bends, as
    // the masons followed the old bed.
    const band = (x: number, y: number, along: "x" | "y") => {
      for (let o = -2; o <= 1; o++) {
        const px = along === "x" ? x : x + o, py = along === "x" ? y + o : y;
        if (at(px, py) !== WATER) set(px, py, o === -1 || o === 0 ? WATER : LEDGE);
      }
    };
    const path: Point[] = [];
    let y = 12 + Math.floor(rng() * (h - 24));
    for (let x = 3; x < w - 3; ) {
      const run = 5 + Math.floor(rng() * 9);
      for (let k = 0; k < run && x < w - 3; k++, x++) band(x, y, "x"), path.push({ x, y });
      const to = Math.max(10, Math.min(h - 8, y + (rng() < 0.5 ? -1 : 1) * (3 + Math.floor(rng() * 6))));
      for (let yy = Math.min(y, to); yy <= Math.max(y, to); yy++) band(x, yy, "y");
      y = to;
    }
    // Old side cuts and cellars off the stream.
    for (let n = 0; n < 7; n++) {
      const p = path[Math.floor(rng() * path.length)], up = rng() < 0.5, len = 4 + Math.floor(rng() * 7);
      for (let k = up ? 3 : 2; k < 3 + len; k++) set(p.x, up ? p.y - k : p.y + k, FLOOR), set(p.x + 1, up ? p.y - k : p.y + k, FLOOR);
      const ry = up ? p.y - 3 - len - 3 : p.y + 3 + len;
      for (let yy = ry; yy < ry + 4; yy++) for (let xx = p.x - 2; xx < p.x + 4; xx++) set(xx, yy, FLOOR);
      d.rooms.push({ x: p.x - 2, y: ry, w: 6, h: 4, use: "plain" });
    }
  }
  // An entry somewhere along the west, under a ladder.
  let entry: Point | undefined;
  for (let x = 3; x < w / 3 && !entry; x++) for (let y = 6; y < h - 3 && !entry; y++) if (walkable(at(x, y)) && at(x, y - 1) === WALL && at(x, y) !== WATER) entry = { x, y };
  if (!entry) return undefined;
  d.entry = entry;
  d.shafts.push({ ...entry, to: "up" });
  if (!keepJoined(d) || count(d) < 120) return undefined;
  return d;
}

export const count = (d: Draft) => d.cells.reduce((n, c) => n + (c === WALL ? 0 : 1), 0);

/** Wall up whatever cannot be reached from the entry. False when the entry is shut in. */
export function keepJoined(d: Draft) {
  const { w, h, cells } = d;
  const reach = new Uint8Array(w * h);
  const start = d.entry.y * w + d.entry.x;
  if (cells[start] === WALL) cells[start] = LEDGE;
  const queue = [start];
  reach[start] = 1;
  for (let q = 0; q < queue.length; q++) {
    const c = queue[q];
    for (const n of [c - 1, c + 1, c - w, c + w]) if (n >= 0 && n < w * h && !reach[n] && cells[n] !== WALL && (walkable(cells[n]) || cells[n] === DEEP)) (reach[n] = 1), queue.push(n);
  }
  for (let i = 0; i < w * h; i++) if (!reach[i] && cells[i] !== GRATE) cells[i] = WALL;
  return queue.length > 20;
}

/** Rooms off the tunnels: a storm overflow, a crew's depot, a corner someone lives in. */
function sideRooms(site: SewerSite, d: Draft, rng: () => number, odds: number) {
  const { w, h, cells } = d;
  const open = (x: number, y: number) => x >= 0 && y >= 0 && x < w && y < h && cells[y * w + x] !== WALL;
  const campers = site.people.some((p) => p.manner === "camp");
  const uses: SewerRoom["use"][] = ["overflow", "depot", "silt", "pump", "plain", ...(campers ? (["camp", "camp"] as const) : [])];
  const ledges: Point[] = [];
  for (let y = 5; y < h - 3; y++) for (let x = 3; x < w - 3; x++) if (cells[y * w + x] === LEDGE) ledges.push({ x, y });
  const want = Math.round((w * h) / 700 * odds) + 1;
  for (let n = 0, tries = 0; n < want && tries < 120 && ledges.length; tries++) {
    const from = ledges[Math.floor(rng() * ledges.length)];
    const dir = N4.find(([dx, dy]) => !open(from.x + dx, from.y + dy) && !open(from.x + dx * 2, from.y + dy * 2) && open(from.x - dx, from.y - dy))!;
    if (!dir) continue;
    const [dx, dy] = dir;
    const rw = 5 + Math.floor(rng() * 5), rh = 4 + Math.floor(rng() * 4), neck = 2 + Math.floor(rng() * 3);
    const rx = dx ? (dx > 0 ? from.x + neck + 1 : from.x - neck - rw) : from.x - Math.floor(rw / 2);
    const ry = dy ? (dy > 0 ? from.y + neck + 1 : from.y - neck - rh) : from.y - Math.floor(rh / 2);
    if (rx < 3 || ry < 6 || rx + rw > w - 3 || ry + rh > h - 3) continue;
    // Clear of everything, with rock above for the back wall.
    let clear = true;
    for (let y = ry - 4; y < ry + rh + 2 && clear; y++) for (let x = rx - 2; x < rx + rw + 2 && clear; x++) if (open(x, y)) clear = false;
    if (!clear) continue;
    for (let k = 1; k <= neck; k++) cells[(from.y + dy * k) * w + from.x + dx * k] = LEDGE;
    const use = uses[Math.floor(rng() * uses.length)];
    for (let y = ry; y < ry + rh; y++) for (let x = rx; x < rx + rw; x++) cells[y * w + x] = use === "silt" ? SILT : FLOOR;
    if (use === "overflow") for (let y = ry + 1; y < ry + rh - 1; y++) cells[y * w + rx + Math.floor(rw / 2)] = WATER;
    d.rooms.push({ x: rx, y: ry, w: rw, h: rh, use });
    n++;
  }
}

/** Distances over walkable cells from one cell. */
function distances(d: Draft, from: Point) {
  const { w, h, cells } = d;
  const dist = new Int32Array(w * h).fill(-1);
  const queue = [from.y * w + from.x];
  dist[queue[0]] = 0;
  for (let q = 0; q < queue.length; q++) {
    const c = queue[q];
    for (const n of [c - 1, c + 1, c - w, c + w]) if (n >= 0 && n < w * h && dist[n] < 0 && walkable(cells[n])) (dist[n] = dist[c] + 1), queue.push(n);
  }
  return dist;
}

/** The water's way: downhill toward the lowest grating or the way down, so the
 * channels all run one way and meet where they should. */
function flows(d: Draft, sinks: Point[]) {
  const { w, h, cells } = d;
  const wet = (i: number) => cells[i] === WATER || cells[i] === DEEP;
  const dist = new Int32Array(w * h).fill(-1);
  const queue: number[] = [];
  for (const s of sinks) {
    const i = s.y * w + s.x;
    if (dist[i] < 0) (dist[i] = 0), queue.push(i);
  }
  for (let q = 0; q < queue.length; q++) {
    const c = queue[q];
    for (const n of [c - 1, c + 1, c - w, c + w]) if (n >= 0 && n < w * h && dist[n] < 0 && (wet(n) || cells[n] === GRATE || cells[n] === BRIDGE)) (dist[n] = dist[c] + 1), queue.push(n);
  }
  const flow = new Int8Array(w * h).fill(-1);
  for (let i = 0; i < w * h; i++) {
    if (!wet(i) || dist[i] <= 0) continue;
    const x = i % w;
    let best = -1, bd = dist[i];
    N4.forEach(([dx, dy], k) => {
      const n = i + dy * w + dx;
      if (x + dx < 0 || x + dx >= w || n < 0 || n >= w * h) return;
      if (dist[n] >= 0 && dist[n] < bd) (bd = dist[n]), (best = k);
    });
    flow[i] = best;
  }
  return flow;
}

/** Everything but the tunnels: the way down, finds, decor, people, rats, lamps. */
function furnish(seed: string, site: SewerSite, d: Draft): SewerLevel {
  const { w, h, cells } = d;
  const rng = rngOf(seed, "sewer-furnish", site.id, d.depth);
  const at = (x: number, y: number) => (x < 0 || y < 0 || x >= w || y >= h ? WALL : cells[y * w + x]);
  const dist = distances(d, d.entry);
  let far = 0;
  for (let i = 0; i < w * h; i++) far = Math.max(far, dist[i]);
  const taken = new Set<number>();
  const solid = new Set<number>();
  for (const s of d.shafts) taken.add(s.y * w + s.x);
  const free = (x: number, y: number) => {
    const c = at(x, y);
    return (c === LEDGE || c === FLOOR || c === SILT) && !taken.has(y * w + x) && dist[y * w + x] > 2;
  };
  const reachable = (x: number, y: number) => walkable(at(x, y)) && !solid.has(y * w + x);
  /** Blocking this cell leaves its neighbours joined. */
  const safe = (x: number, y: number) => {
    const ring = [[-1, -1], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0]].map(([dx, dy]) => reachable(x + dx, y + dy));
    let turns = 0;
    for (let i = 0; i < 8; i++) if (ring[i] !== ring[(i + 1) % 8]) turns++;
    return turns <= 2 && ring.filter(Boolean).length >= 3;
  };
  const block = (x: number, y: number) => (taken.add(y * w + x), solid.add(y * w + x));

  // The way down: in a room or chamber far from the ladder.
  let down: Point | undefined;
  if (d.depth < 3) {
    const spots: Point[] = [];
    for (let y = 6; y < h - 3; y++) for (let x = 3; x < w - 3; x++) if (free(x, y) && dist[y * w + x] >= far * 0.55 && safe(x, y) && at(x, y - 1) !== WALL) spots.push({ x, y });
    down = spots[Math.floor(rng() * spots.length)];
    if (down) block(down.x, down.y);
  }
  const sinks: Point[] = [];
  const mine = site.network === "mine", sewer = site.network === "sewer";
  // A mine's water all runs to the sump, where the pumps lift it.
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (cells[y * w + x] === (sewer ? GRATE : DEEP)) sinks.push({ x, y });
  if (down) sinks.push(down);
  if (!sinks.length) {
    // Water runs away from the ladder, toward the far end of the channel.
    let best = -1;
    for (let i = 0; i < w * h; i++) if (cells[i] === WATER && (best < 0 || Math.abs((i % w) - d.entry.x) > Math.abs((best % w) - d.entry.x))) best = i;
    if (best >= 0) sinks.push({ x: best % w, y: Math.floor(best / w) });
  }
  const flow = flows(d, sinks);

  const faces: Point[] = [];
  for (let y = 5; y < h - 3; y++) for (let x = 2; x < w - 2; x++) if (at(x, y) === WALL && at(x, y - 1) === WALL && (at(x, y + 1) === LEDGE || at(x, y + 1) === FLOOR || at(x, y + 1) === SILT)) faces.push({ x, y });
  const floors: Point[] = [];
  for (let y = 5; y < h - 3; y++) for (let x = 2; x < w - 2; x++) if (free(x, y) && dist[y * w + x] >= 4) floors.push({ x, y });

  // Pockets of dead air in the tunnels, away from the ladders, more of them deeper down.
  for (let n = site.network !== "catacomb" && rng() < [0.35, 0.6, 0.8][d.depth - 1] ? 1 + Math.floor(rng() * d.depth) : 0; n > 0; n--) {
    const spot = floors[Math.floor(rng() * floors.length)];
    if (spot && dist[spot.y * w + spot.x] >= far * 0.4 && (!down || Math.abs(spot.x - down.x) + Math.abs(spot.y - down.y) > 5))
      d.rooms.push({ x: spot.x - 2, y: spot.y - 1, w: 5, h: 3, use: "plain", foul: true, damp: mine ? (site.kind === "coal" && rng() < 0.6 ? "fire" : "black") : undefined });
  }

  // Finds, from what fits this place, date, kind and depth.
  const things: AreaThing[] = [];
  const fits = (mine ? mineFinds : sewer ? sewerFinds : catacombFinds).filter((f) => findFits(f, site.place, site.kind, d.layer, site.ore));
  const wt = (f: SewerFind) => f.weight ?? 1;
  const plan: { f: SewerFind; room?: SewerRoom }[] = [];
  const used = new Set<string>();
  const take = (pool: SewerFind[], unique: boolean) => {
    const f = pick(rng, pool.filter((p) => !unique || !used.has(p.id)), wt);
    if (f) plan.push({ f }), used.add(f.id);
  };
  const common = fits.filter((f) => f.tier === "common"), notable = fits.filter((f) => f.tier === "notable"), prize = fits.filter((f) => f.tier === "prize");
  const size = floors.length;
  for (let i = 4 + Math.floor(size / 90) + Math.floor(rng() * 3); i > 0; i--) take(common, false);
  for (let i = 1 + Math.floor(rng() * 2) + (d.depth > 1 ? 1 : 0); i > 0; i--) take(notable, true);
  if (rng() < (d.depth === 1 ? 0.25 : d.depth === 2 ? 0.6 : 0.9)) take(prize.length ? prize : notable, true);
  for (const room of d.rooms) {
    // Rotting silt and dead air give off hydrogen sulphide; nobody camps in it.
    if (mine) {
      // Coal gives off firedamp at the face and in old workings; any old working fills with blackdamp.
      if (site.kind === "coal" && (room.use === "face" ? rng() < 0.3 : d.depth === 3 && rng() < 0.35)) (room.foul = true), (room.damp = "fire");
      else if (d.depth === 3 && room.use !== "chapel" && rng() < 0.35) (room.foul = true), (room.damp = "black");
    } else if (sewer) room.foul ||= room.use === "silt" || (d.depth === 3 && room.use !== "camp" && rng() < 0.4);
    if (room.foul && mine) room.damp ??= site.kind === "coal" ? "fire" : "black";
    const want = room.use === "depot" ? ["locker", "toolbag"] : room.use === "camp" ? ["bedroll", "camp", "shrine"] : room.use === "silt" ? ["silt-heap", "glint"]
      : room.use === "stable" ? ["harness"] : room.use === "cabin" ? ["snap", "powder"] : room.use === "face" || room.use === "stope" ? ["ore", "tools"] : room.use === "chapel" ? ["relief", "barbara"]
      : room.use === "cubiculum" ? ["arcosolium", "amphora", "epitaph"] : room.use === "crypt" ? ["martyr-arch", "sarcophagus", "scratchings", "lamp-niche"] : room.use === "bones" ? ["tablet", "skulls"] : [];
    for (const art of want) {
      const f = pick(rng, fits.filter((f) => f.art === art), wt);
      if (f) plan.push({ f, room });
    }
  }
  plan.forEach(({ f, room }, i) => {
    let spot: Point | undefined;
    if (f.on === "wall") {
      const options = faces.filter((p) => !taken.has(p.y * w + p.x) && free(p.x, p.y + 1) && (!room || (p.x >= room.x && p.x < room.x + room.w && p.y === room.y - 1)));
      spot = options[Math.floor(rng() * options.length)];
      if (spot) for (const dx of [-1, 0, 1]) taken.add(spot.y * w + spot.x + dx), taken.add((spot.y + 1) * w + spot.x + dx);
    } else {
      let score = -1;
      const pool = room ? floors.filter((p) => p.x >= room.x && p.x < room.x + room.w && p.y >= room.y && p.y < room.y + room.h) : floors;
      for (let n = 0; n < 24; n++) {
        const p = pool[Math.floor(rng() * pool.length)];
        if (!p || !free(p.x, p.y) || (!f.flat && !safe(p.x, p.y))) continue;
        const s = f.tier === "prize" ? dist[p.y * w + p.x] / far + rng() * 0.2 : rng();
        if (s > score) (score = s), (spot = p);
      }
      if (spot) f.flat ? taken.add(spot.y * w + spot.x) : block(spot.x, spot.y);
    }
    if (!spot) return;
    const loot: Inventory = {};
    const ores = oreItems(site.ore ?? "coal");
    for (const [key, n] of Object.entries(f.loot ?? {})) {
      const item = key === "ore" ? ores.ore : key === "ore-rich" ? ores.rich : key;
      const count = typeof n === "number" ? n : n[0] + Math.floor(rng() * (n[1] - n[0] + 1));
      if (count > 0) loot[item] = (loot[item] ?? 0) + count;
    }
    // Street finds are keyed to the world, so the same lid's ring is found once.
    const key = d.layer === "street" ? `${d.ox + spot.x},${d.oy + spot.y}` : `${d.depth}-${i}`;
    things.push({ id: `${key}-${f.id}`, find: f.id, x: spot.x, y: spot.y, wall: f.on === "wall", solid: f.on === "floor" && !f.flat, art: f.art, name: f.name, loot });
  });

  // The tunnel's own furniture.
  const decor: AreaDecor[] = [...(d.decor ?? [])];
  for (const o of decor) if (o.solid) block(o.x, o.y);
  const lamps: Point[] = [...d.lamps];
  const electric = site.place.year >= 1910;
  if (mine) mineDecor(site, d, decor, lamps, rng, { at, free, safe, block, taken, dist });
  else if (!sewer) catacombDecor(site, d, decor, rng, { at, free, safe, block });
  else for (const room of d.rooms) {
    const cx = room.x + Math.floor(room.w / 2), cy = room.y + Math.floor(room.h / 2);
    if (room.use === "hall") {
      for (let y = room.y + 2; y < room.y + room.h - 2; y += 4)
        for (let x = room.x + 2; x < room.x + room.w - 2; x += 5) if (free(x, y) && safe(x, y)) decor.push({ type: "pier", x, y, solid: true, v: rng() }), block(x, y);
      if (electric) for (let x = room.x + 1; x < room.x + room.w; x += 6) if (at(x, room.y - 1) === WALL) lamps.push({ x, y: room.y });
    }
    if (room.use === "pump" && free(cx, cy) && safe(cx, cy)) decor.push({ type: "pump", x: cx, y: cy, solid: true, v: rng() }), block(cx, cy);
    if (room.use === "overflow") for (let y = room.y; y < room.y + room.h; y++) if (at(room.x + Math.floor(room.w / 2), y) === WATER) decor.push({ type: "weir", x: room.x + Math.floor(room.w / 2), y, solid: false, v: rng() });
    if ((room.use === "depot" || room.use === "pump") && electric && at(cx, room.y - 1) === WALL) lamps.push({ x: cx, y: room.y });
  }
  if (sewer && d.layer === "trunk" && electric) for (let x = 4; x < w - 4; x += 9) for (let y = 5; y < h - 3; y++) if (at(x, y) === LEDGE && at(x, y - 1) === WALL) {
    lamps.push({ x, y });
    break;
  }
  if (sewer) for (let y = 5; y < h - 2; y++)
    for (let x = 2; x < w - 2; x++) {
      const i = y * w + x, c = cells[i], r = rng();
      if (c === WALL && at(x, y - 1) === WALL && walkable(at(x, y + 1))) {
        if (r < 0.12) decor.push({ type: "outfall", x, y, solid: false, v: rng() });
        else if (r < 0.2) decor.push({ type: site.kind === "tropical" ? "roots" : "stain", x, y, solid: false, v: rng() });
        else if (r < 0.24) decor.push({ type: "rungs", x, y, solid: false, v: rng() });
      } else if ((c === LEDGE || c === FLOOR || c === SILT) && !taken.has(i)) {
        if (r < 0.012 && dist[i] > 4 && safe(x, y) && d.layer !== "street") decor.push({ type: "rubble", x, y, solid: true, v: rng() }), block(x, y);
        else if (r < 0.1) decor.push({ type: site.kind === "tropical" && rng() < 0.5 ? "leaves" : c === SILT ? "sludge" : ["litter", "puddle", "grit", "droppings"][Math.floor(rng() * 4)], x, y, solid: false, v: rng() });
      } else if (c === WATER && r < 0.05) decor.push({ type: "flotsam", x, y, solid: false, v: rng() });
    }

  // People, by what kind of people they are.
  const folk: AreaFolk[] = [];
  const prng = rngOf(seed, "sewer-folk", site.id, d.depth);
  const here = site.people.filter((p) => personFits(p, site.place, site.kind, d.layer, site.ore));
  // A working mine is full of people; a sewer has a crew or two.
  const groups = !here.length ? 0 : mine && d.depth < 3 ? 2 + Math.floor(prng() * 3) : (prng() < (d.depth === 1 ? 0.75 : 0.55) ? 1 : 0) + (prng() < 0.35 ? 1 : 0);
  const spots = floors.filter((p) => !taken.has(p.y * w + p.x) && dist[p.y * w + p.x] > 7);
  for (let g = 0; g < groups && spots.length; g++) {
    const who = pick(prng, here, (p) => p.weight);
    if (!who) break;
    const camp = d.rooms.find((r) => r.use === "camp");
    const face = who.manner === "work" ? d.rooms.filter((r) => r.use === "face" || r.use === "stope" || r.use === "chamber" || r.use === "stable" || r.use === "eye")[Math.floor(prng() * 6)] : undefined;
    const inRoom = (r: SewerRoom) => floors.find((p) => p.x >= r.x && p.x < r.x + r.w && p.y >= r.y && p.y < r.y + r.h && !taken.has(p.y * w + p.x));
    const home = (who.manner === "camp" && camp ? inRoom(camp) : face && inRoom(face)) || spots[Math.floor(prng() * spots.length)];
    if (!home) continue;
    const roll = prng(), n = roll < who.party[0] ? 1 : roll < who.party[0] + who.party[1] ? 2 : 3;
    for (let k = 0; k < n; k++) {
      const p = [home, ...N4.map(([dx, dy]) => ({ x: home.x + dx, y: home.y + dy }))].find((q) => free(q.x, q.y) && !folk.some((f) => f.x === q.x && f.y === q.y));
      if (!p) break;
      const [lo, hi] = who.ages ?? [18, 55];
      folk.push({ id: `folk-${site.network}-${site.id}-${d.depth}-${g}-${k}`, person: who.id, x: p.x, y: p.y, sex: prng() < who.women ? "female" : "male", age: lo + Math.floor(prng() * (hi - lo + 1)) });
      taken.add(p.y * w + p.x);
    }
  }
  const rats: Point[] = [];
  for (let n = mine ? 1 + Math.floor(rng() * 3) : sewer ? 3 + Math.floor(rng() * 6) : Math.floor(rng() * 3); n > 0 && floors.length; n--) rats.push(floors[Math.floor(rng() * floors.length)]);

  const props = things.map((t) => {
    t.prop = true;
    return {
      key: `${site.network}-${t.find}`,
      sprite: `made:sewer:${site.network}:${site.kind}:${d.layer}:5:${t.art}`,
      x: t.x,
      y: t.y,
      name: t.name,
      ...(Object.keys(t.loot).length ? { loot: t.loot } : {}),
    };
  });
  const names = mine ? MINE_NAMES[site.kind as keyof typeof MINE_NAMES][d.layer as keyof (typeof MINE_NAMES)["coal"]] : sewer ? NAMES[site.kind as SewerKind][d.layer as SewerDepth] : CATACOMB_NAMES[site.kind as CatacombKind][d.layer as CatacombDepth];
  const name = d.name ?? names[hash(`${seed}|${site.id}|${d.depth}|name`) % names.length];
  return { ...d, name, flow, down, things, props, decor, folk, lamps, rats };
}

/** Cells that stop feet whatever is taken: piers, rubble, non-prop big finds, the way down. */
export function sewerSolid(level: SewerLevel) {
  const solid = new Set<number>();
  if (level.down) solid.add(level.down.y * level.w + level.down.x);
  for (const d of level.decor) if (d.solid) solid.add(d.y * level.w + d.x);
  for (const t of level.things) if (t.solid && !t.prop) solid.add(t.y * level.w + t.x);
  return solid;
}

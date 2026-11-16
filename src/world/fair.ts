import { fairFind, fairFinds, fairPeople, type Fair, type FairArea, type FairBuilding, type FairFind } from "../content/fairs";
import { pickWeighted as pick, rngOf } from "../core/random";
import type { Point } from "../core/types";
import { N4, type Area, type AreaDecor, type AreaExit, type AreaFolk, type AreaThing } from "./complex";

export const WALL = 0, GRAVEL = 1, LAWN = 2, WATER = 3, PAVING = 4, BED = 5, FLOOR = 6, BUILDING = 7, BRIDGE = 8, HEDGE = 9, DECK = 10;
/** Feet can go here. */
export const fairWalkable = (c: number) => c === GRAVEL || c === LAWN || c === PAVING || c === FLOOR || c === BRIDGE || c === DECK;

/** The row a building's front wall stands on, in grounds. */
export const FRONT = 12;

export type PlacedBuilding = FairBuilding & { y: number; door: Point };
/** A lift or stair to another area of the same tower, used with the action key. */
export type FairLift = { x: number; y: number; to: string; up: boolean };

export type FairLevel = Area & {
  fair: string;
  area: string;
  kind: FairArea["kind"];
  floor?: FairArea["floor"];
  exits: AreaExit[];
  buildings: PlacedBuilding[];
  lifts: FairLift[];
  fountain?: { x: number; y: number; w: number; h: number; kind: "coutan" | "basin" };
  /** Rows the river runs between, inclusive. */
  river?: [number, number];
  tower?: boolean;
};

export const fairSpace = (fair: string, area: string) => `fair:${fair}:${area}`;
export function parseFairSpace(space: string) {
  const m = /^fair:([a-z0-9-]+):([a-z0-9-]+)$/.exec(space);
  return m ? { fair: m[1], area: m[2] } : undefined;
}

const SIZE: Record<FairArea["kind"], [number, number]> = {
  grounds: [56, 40], bridge: [56, 40], hall: [64, 28], pavilion: [26, 18], machines: [72, 34], platform: [48, 32],
};

/** One area of a fair: always the same for the same world, fair and area. */
export function fairLevel(seed: string, fair: Fair, id: string): FairLevel | undefined {
  const plan = fair.areas.find((a) => a.id === id);
  if (!plan) return undefined;
  const [w, h] = SIZE[plan.kind];
  const rng = rngOf(seed, "fair", fair.id, id);
  const L: FairLevel = {
    space: fairSpace(fair.id, id), fair: fair.id, area: id, kind: plan.kind, floor: plan.floor, depth: 1, name: plan.name, w, h,
    cells: new Uint8Array(w * h), entry: { x: w >> 1, y: h - 2 }, things: [], decor: [], folk: [], flow: new Int8Array(w * h).fill(-1),
    exits: [], buildings: [], lifts: [],
  };
  const set = (x: number, y: number, c: number) => { if (x >= 0 && y >= 0 && x < w && y < h) L.cells[y * w + x] = c; };
  const fill = (x0: number, y0: number, x1: number, y1: number, c: number) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, c); };
  const at = (x: number, y: number) => (x >= 0 && y >= 0 && x < w && y < h ? L.cells[y * w + x] : WALL);
  const space = (area: string) => fairSpace(fair.id, area);
  const edge = (dir: "n" | "e" | "s" | "w", to: string, name: string, span: [number, number]) => {
    const [a, b] = span;
    L.exits.push(dir === "n" ? { x: a, y: 0, w: b - a + 1, h: 1, to, name, inward: 2 } : dir === "s" ? { x: a, y: h - 1, w: b - a + 1, h: 1, to, name, inward: 0 }
      : dir === "w" ? { x: 0, y: a, w: 1, h: b - a + 1, to, name, inward: 1 } : { x: w - 1, y: a, w: 1, h: b - a + 1, to, name, inward: 3 });
  };
  const areaName = (aid: string) => fair.areas.find((a) => a.id === aid)?.name ?? aid;
  // The ground of the kind.
  if (plan.kind === "grounds" || plan.kind === "bridge") grounds(L, plan, rng, fill, set, at, edge, space, areaName);
  else if (plan.kind === "platform") platform(L, fill, set);
  else interior(L, plan, fair.areas.find((a) => a.buildings?.some((b) => b.interior === id))?.id, fill, edge, space, areaName);
  // Lifts: one at each foot of the tower, or at each corner of a platform.
  for (const [i, to] of (plan.lifts ?? []).entries()) {
    const up = (fair.areas.findIndex((a) => a.id === to) > fair.areas.findIndex((a) => a.id === id));
    const spots = L.tower ? [[10, 34], [45, 34], [10, 12], [45, 12]] : [[8, 6], [w - 9, 6], [8, h - 7], [w - 9, h - 7]];
    for (const [k, [x, y]] of spots.entries()) if (k % (plan.lifts!.length) === i) L.lifts.push({ x, y, to: space(to), up });
  }
  // Doors into the buildings.
  for (const b of L.buildings) if (b.interior) L.exits.push({ x: b.door.x, y: b.door.y, w: 1, h: 1, to: space(b.interior), name: b.name, inward: 2 });
  // Where someone arrives who did not come through an exit: the gate, or the first lift.
  const gate = L.exits.find((e) => e.to === "outside") ?? L.exits[0];
  if (gate) L.entry = { x: gate.x + (gate.w >> 1) + N4[gate.inward][0], y: gate.y + (gate.h >> 1) + N4[gate.inward][1] };
  else if (L.lifts[0]) L.entry = { x: L.lifts[0].x, y: L.lifts[0].y + 1 };
  furnish(L, plan, rng, seed, fair.id);
  return L;
}

type Fill = (x0: number, y0: number, x1: number, y1: number, c: number) => void;
type Set = (x: number, y: number, c: number) => void;
type Edge = (dir: "n" | "e" | "s" | "w", to: string, name: string, span: [number, number]) => void;

function grounds(L: FairLevel, plan: FairArea, rng: () => number, fill: Fill, set: Set, at: (x: number, y: number) => number, edge: Edge, space: (a: string) => string, areaName: (a: string) => string) {
  const { w, h } = L, links = plan.links ?? {}, cx = w >> 1, tower = plan.id === "tower", mid = tower ? 19 : 26;
  fill(0, 0, w - 1, h - 1, LAWN);
  if (plan.kind === "bridge") {
    // The Seine across the middle, quays either side, and the bridge over it.
    L.river = [15, 26];
    fill(0, 0, w - 1, 9, LAWN);
    fill(0, 10, w - 1, 14, PAVING);
    fill(0, 15, w - 1, 26, WATER);
    fill(0, 27, w - 1, 31, PAVING);
    fill(0, 32, w - 1, h - 1, LAWN);
    fill(cx - 5, 0, cx + 4, h - 1, BRIDGE);
    for (let y = 15; y <= 26; y++) for (let x = 0; x < w; x++) if (L.cells[y * w + x] === WATER) L.flow[y * w + x] = 3;
    if (links.n) edge("n", space(links.n), areaName(links.n), [cx - 5, cx + 4]);
    if (links.s) edge("s", space(links.s), areaName(links.s), [cx - 5, cx + 4]);
    if (links.e) edge("e", space(links.e), areaName(links.e), [10, 14]);
    if (links.w) edge("w", space(links.w), areaName(links.w), [10, 14]);
    // Plane trees along both quays.
    for (let x = 3; x < w - 2; x += 6) if (Math.abs(x - cx) > 7) for (const y of [9, 32]) L.decor.push({ type: "tree", x, y, solid: true, v: rng() });
    return;
  }
  // Behind the fronts: a hedge, which the buildings stand against.
  L.tower = tower;
  if (!tower) fill(0, 0, w - 1, 5, HEDGE);
  // The promenade along the fronts, and the avenues.
  if (!tower) fill(1, FRONT + 1, w - 2, FRONT + 3, GRAVEL);
  if (links.n || tower) fill(cx - 3, 0, cx + 2, h - 1, PAVING);
  if (links.s || plan.gate === "s") fill(cx - 3, FRONT + 1, cx + 2, h - 1, PAVING);
  if (links.e || links.w) fill(links.w ? 0 : cx, mid - 2, links.e ? w - 1 : cx, mid + 2, PAVING);
  // Gravel walks round the lawns.
  for (const y of [FRONT + 4, h - 3]) fill(2, y, w - 3, y + 1, GRAVEL);
  for (const x of [2, 13, w - 15, w - 4]) fill(x, FRONT + 4, x + 1, h - 2, GRAVEL);
  if (tower) {
    // The four legs, the garden under them, and the paths between.
    fill(0, 0, w - 1, h - 1, GRAVEL);
    for (const [x0, y0] of [[6, 4], [41, 4], [6, 26], [41, 26]]) fill(x0, y0, x0 + 8, y0 + 7, BUILDING);
    fill(17, 13, 38, 26, LAWN);
    fill(cx - 3, 0, cx + 2, h - 1, PAVING);
    fill(0, mid - 2, w - 1, mid + 2, PAVING);
  }
  if (plan.fountain) {
    const fw = plan.fountain === "coutan" ? 14 : 8, fh = plan.fountain === "coutan" ? 9 : 6;
    const fx = cx - (fw >> 1), fy = mid - (fh >> 1);
    fill(fx - 1, fy - 1, fx + fw, fy + fh, PAVING);
    fill(fx, fy, fx + fw - 1, fy + fh - 1, WATER);
    L.fountain = { x: fx, y: fy, w: fw, h: fh, kind: plan.fountain };
  }
  // Show beds in the lawns.
  for (let y = FRONT + 7; y < h - 5; y += 7)
    for (const x0 of [5, w - 11]) if (at(x0, y) === LAWN && at(x0 + 5, y + 2) === LAWN) {
      fill(x0, y, x0 + 5, y + 2, BED);
      L.decor.push({ type: "bed", x: x0, y, solid: false, v: rng() });
    }
  // Trees down the avenues, lamps at the crossings, benches on the walks.
  if (!tower) {
    for (let y = FRONT + 6; y < h - 3; y += 5) for (const x of [cx - 5, cx + 4]) if (at(x, y) === LAWN) L.decor.push({ type: "tree", x, y, solid: true, v: rng() });
    for (const [x, y] of [[cx - 4, FRONT + 4], [cx + 3, FRONT + 4], [cx - 4, h - 4], [cx + 3, h - 4]]) if (fairWalkable(at(x, y))) L.decor.push({ type: "lamp", x, y, solid: true, v: rng() });
    for (const x of [7, 20, w - 21, w - 8]) if (at(x, h - 3) === GRAVEL) L.decor.push({ type: "bench", x, y: h - 4, solid: true, v: rng() });
  }
  for (const b of plan.buildings ?? []) {
    const y = FRONT - b.h + 1;
    fill(b.x, y, b.x + b.w - 1, FRONT, BUILDING);
    const door = { x: b.x + (b.w >> 1), y: FRONT };
    set(door.x, door.y, GRAVEL);
    L.buildings.push({ ...b, y, door });
  }
  if (links.n) edge("n", space(links.n), areaName(links.n), [cx - 3, cx + 2]);
  if (links.s) edge("s", space(links.s), areaName(links.s), [cx - 3, cx + 2]);
  if (plan.gate === "s") edge("s", "outside", "the street", [cx - 3, cx + 2]);
  if (links.e) edge("e", space(links.e), areaName(links.e), [mid - 2, mid + 2]);
  if (links.w) edge("w", space(links.w), areaName(links.w), [mid - 2, mid + 2]);
}

function platform(L: FairLevel, fill: Fill, set: Set) {
  const { w, h } = L;
  // A railed deck round the open middle of the tower.
  fill(1, 1, w - 2, h - 2, DECK);
  fill(12, 10, w - 13, h - 11, WALL);
  for (let x = 0; x < w; x++) set(x, 0, WALL), set(x, h - 1, WALL);
  for (let y = 0; y < h; y++) set(0, y, WALL), set(w - 1, y, WALL);
}

function interior(L: FairLevel, plan: FairArea, back: string | undefined, fill: Fill, edge: Edge, space: (a: string) => string, areaName: (a: string) => string) {
  const { w, h } = L, door = (w >> 1) - 1;
  fill(1, 3, w - 2, h - 2, FLOOR);
  fill(door, h - 1, door + 1, h - 1, FLOOR);
  // Out by the door to the building's own grounds, or through to the next hall.
  const out = plan.links?.s ?? back;
  if (out) edge("s", space(out), areaName(out), [door, door + 1]);
  if (plan.links?.n) {
    fill(door - 1, 0, door + 2, 2, FLOOR);
    edge("n", space(plan.links.n), areaName(plan.links.n), [door - 1, door + 2]);
  }
  if (plan.kind !== "pavilion")
    for (let x = 6; x < w - 4; x += 8) for (const y of [7, h - 7]) if (Math.abs(x - (w >> 1)) > 2) L.decor.push({ type: "column", x, y, solid: true, v: 0 });
}

/** Exhibits, filler stands, decor and people. */
function furnish(L: FairLevel, plan: FairArea, rng: () => number, seed: string, fair: string) {
  const { w, h } = L;
  const taken = new Uint8Array(w * h);
  for (const d of L.decor) if (d.solid) taken[d.y * w + d.x] = 1;
  for (const e of L.exits) for (let y = e.y - 1; y <= e.y + e.h; y++) for (let x = e.x - 1; x <= e.x + e.w; x++) if (x >= 0 && y >= 0 && x < w && y < h) taken[y * w + x] = 1;
  for (const l of L.lifts) for (let y = l.y - 1; y <= l.y + 2; y++) for (let x = l.x - 1; x <= l.x + 1; x++) taken[y * w + x] = 1;
  const free = (x: number, y: number, fw = 1, fh = 1) => {
    for (let yy = y - 1; yy <= y + fh; yy++) for (let xx = x - 1; xx <= x + fw; xx++) {
      if (xx < 0 || yy < 0 || xx >= w || yy >= h) return false;
      if (taken[yy * w + xx] || !fairWalkable(L.cells[yy * w + xx])) return false;
    }
    return true;
  };
  const wallFree = (x: number, fw = 1) => {
    for (let xx = x - 1; xx <= x + fw; xx++) if (xx < 1 || xx >= w - 1 || taken[2 * w + xx] || L.cells[3 * w + xx] !== FLOOR) return false;
    return true;
  };
  const indoor = plan.kind === "hall" || plan.kind === "pavilion" || plan.kind === "machines";
  const spots: Point[] = [];
  if (indoor) for (let y = 6; y < h - 3; y += 4) for (let x = 3; x < w - 3; x += 5) spots.push({ x, y });
  else if (plan.kind === "platform") for (let x = 4; x < w - 6; x += 6) for (const y of [3, h - 6]) spots.push({ x, y });
  else for (let y = FRONT + 5; y < h - 3; y += 3) for (let x = 4; x < w - 4; x += 4) if (Math.abs(x - (w >> 1)) > 5 && L.cells[y * w + x] !== PAVING) spots.push({ x, y });
  // Anchored exhibits nearest the middle, filler further out.
  const cx = w >> 1, cy = indoor ? h >> 1 : FRONT + 10;
  spots.sort((a, b) => Math.hypot(a.x - cx, a.y - cy) - Math.hypot(b.x - cx, b.y - cy));
  const wallX: number[] = [];
  if (indoor) for (let x = 3; x < w - 4; x += 4) wallX.push(x);
  const place = (f: FairFind, n: number) => {
    const fw = f.w ?? 1, fh = f.h ?? 1;
    if (f.on === "wall" && indoor) {
      const i = wallX.findIndex((x) => wallFree(x, fw));
      if (i < 0) return false;
      const x = wallX.splice(i, 1)[0];
      for (let xx = x; xx < x + fw; xx++) taken[2 * w + xx] = 1;
      L.things.push(thing(L, f, n, x, 2, true));
      return true;
    }
    const spot = spots.find((s) => free(s.x, s.y, fw, fh + (f.art === "kiosk" ? 1 : 0)));
    if (!spot) return false;
    spots.splice(spots.indexOf(spot), 1);
    for (let y = spot.y; y < spot.y + fh; y++) for (let x = spot.x; x < spot.x + fw; x++) taken[y * w + x] = 1;
    L.things.push(thing(L, f, n, spot.x, spot.y, false));
    return true;
  };
  let n = 0;
  for (const id of plan.exhibits ?? []) {
    const f = fairFind(id);
    if (f && place(f, n)) n++;
  }
  const tags = new Set([plan.id, plan.kind, ...(plan.stands?.tags ?? [])]);
  const pool = fairFinds.filter((f) => f.tags.some((t) => tags.has(t)) && !plan.exhibits?.includes(f.id));
  const used = new Map<string, number>();
  for (let k = 0; k < (plan.stands?.n ?? 0); k++) {
    const f = pick(rng, pool.filter((p) => (used.get(p.id) ?? 0) < (p.tier === "common" ? 2 : 1)), (p) => (p.weight ?? 1) * (p.tier === "common" ? 3 : 1));
    if (!f) break;
    used.set(f.id, (used.get(f.id) ?? 0) + 1);
    if (place(f, n)) n++;
  }
  // People.
  const who = (plan.people ?? []).map((id) => fairPeople.find((p) => p.id === id)).filter((p) => !!p);
  const count = { grounds: 10, bridge: 8, hall: 7, pavilion: 3, machines: 7, platform: 5 }[plan.kind];
  const frng = rngOf(seed, "fair-folk", fair, plan.id);
  for (let i = 0; i < count && who.length; i++) {
    const p = who[Math.floor(frng() * who.length)];
    for (let tries = 0; tries < 30; tries++) {
      const x = 2 + Math.floor(frng() * (w - 4)), y = (indoor ? 4 : plan.kind === "grounds" ? FRONT + 2 : 2) + Math.floor(frng() * (h - (indoor ? 6 : plan.kind === "grounds" ? FRONT + 4 : 4)));
      if (!free(x, y) && !(fairWalkable(L.cells[y * w + x]) && !taken[y * w + x])) continue;
      if (L.folk.some((f) => f.x === x && f.y === y)) continue;
      const [lo, hi] = p.ages ?? [16, 70];
      L.folk.push({ id: `${L.space}:folk${i}`, person: p.id, x, y, sex: frng() < p.women ? "female" : "male", age: lo + Math.floor(frng() * (hi - lo + 1)) } satisfies AreaFolk);
      taken[y * w + x] = 1;
      break;
    }
  }
}

function thing(L: FairLevel, f: FairFind, n: number, x: number, y: number, wall: boolean): AreaThing {
  return { id: `${L.area}-${n}`, find: f.id, x, y, wall, solid: !wall, art: f.art, name: f.name, loot: {}, w: f.w, h: f.h };
}

/** Cells no one can stand in: every cell of a big exhibit, and the solid decor. */
export function fairSolid(L: FairLevel) {
  const solid = new Set<number>();
  for (const t of L.things) if (t.solid) for (let y = t.y; y < t.y + (t.h ?? 1); y++) for (let x = t.x; x < t.x + (t.w ?? 1); x++) solid.add(y * L.w + x);
  for (const d of L.decor as AreaDecor[]) if (d.solid) solid.add(d.y * L.w + d.x);
  for (const l of L.lifts) solid.add(l.y * L.w + l.x);
  return solid;
}

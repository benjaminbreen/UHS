import { fairFind, fairFinds, fairPeople, type Fair, type FairArea, type FairBuilding, type FairFind } from "../content/fairs";
import { pickWeighted as pick, rngOf } from "../core/random";
import type { Point } from "../core/types";
import { N4, type Area, type AreaDecor, type AreaExit, type AreaFolk, type AreaLift, type AreaThing } from "./complex";

export const WALL = 0, GRAVEL = 1, LAWN = 2, WATER = 3, PAVING = 4, BED = 5, FLOOR = 6, BUILDING = 7, BRIDGE = 8, HEDGE = 9, DECK = 10, BOX = 11, FENCE = 12;
/** Feet can go here. */
export const fairWalkable = (c: number) => c === GRAVEL || c === LAWN || c === PAVING || c === FLOOR || c === BRIDGE || c === DECK;

/** The row a building's front wall stands on, in grounds. */
export const FRONT = 12;

export type PlacedBuilding = FairBuilding & { y: number; door: Point };
export type FairLevel = Area & {
  fair: string;
  area: string;
  kind: FairArea["kind"];
  floor?: FairArea["floor"];
  exits: AreaExit[];
  buildings: PlacedBuilding[];
  lifts: AreaLift[];
  fountain?: { x: number; y: number; w: number; h: number; kind: "coutan" | "basin" };
  /** Rows the river runs between, inclusive. */
  river?: [number, number];
  tower?: boolean;
  /** Railed gardens, their inner lawn and plan, for the painter to draw curved walks and round beds. */
  gardens: { x0: number; y0: number; x1: number; y1: number; style: string; gx: number[]; gy: number[] }[];
  /** Plots of floor set apart for exhibits, drawn darker. */
  plots: Rect[];
};

export type Rect = { x0: number; y0: number; x1: number; y1: number };
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
    cells: new Uint8Array(w * h), entry: { x: w >> 1, y: h - 2 }, things: [], decor: [], folk: [], gardens: [], plots: [], flow: new Int8Array(w * h).fill(-1),
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
  for (const x of [2, w - 4]) fill(x, FRONT + 4, x + 1, h - 2, GRAVEL);
  if (tower) {
    // The four legs, the garden under them, and the paths between.
    fill(0, 0, w - 1, h - 1, GRAVEL);
    for (const [x0, y0] of [[6, 4], [41, 4], [6, 26], [41, 26]]) fill(x0, y0, x0 + 8, y0 + 7, BUILDING);
    fill(17, 13, 38, 26, LAWN);
    for (const [y0, y1] of [[1, 11], [28, h - 2]]) fill(17, y0, cx - 5, y1, LAWN), fill(cx + 4, y0, 38, y1, LAWN);
    fill(1, 1, 4, h - 2, LAWN); fill(w - 5, 1, w - 2, h - 2, LAWN);
    fill(cx - 3, 0, cx + 2, h - 1, PAVING);
    fill(0, mid - 2, w - 1, mid + 2, PAVING);
  }
  if (plan.fountain) {
    const fw = plan.fountain === "coutan" ? 14 : 8, fh = plan.fountain === "coutan" ? 9 : 6;
    const fx = cx - (fw >> 1), fy = mid - (fh >> 1);
    fill(fx - 1, fy - 1, fx + fw, fy + fh, PAVING);
    fill(fx, fy, fx + fw - 1, fy + fh - 1, WATER);
    L.fountain = { x: fx, y: fy, w: fw, h: fh, kind: plan.fountain };
    L.decor.push({ type: "tazza", x: cx - 1, y: fy + (fh >> 1), solid: true, v: plan.fountain === "coutan" ? 1 : 0 });
  }
  for (const b of plan.buildings ?? []) {
    const y = FRONT - b.h + 1;
    fill(b.x, y, b.x + b.w - 1, FRONT, BUILDING);
    const door = { x: b.x + (b.w >> 1), y: FRONT };
    set(door.x, door.y, GRAVEL);
    L.buildings.push({ ...b, y, door });
  }
  gardens(L, rng, fill, set, at);
  // Open turf left over gets a few trees, never next to a walk; the wood behind the pavilions is dense.
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const c = at(x, y);
    if (c === HEDGE && (x + (y % 3 ? 0 : 1) * 2) % 3 === 0 && y % 2 === 1) L.decor.push({ type: "tree", x, y, solid: true, v: rng() });
    if (c !== LAWN || (x * 3 + y * 5) % 7 !== 0 || L.gardens.some((g) => x >= g.x0 - 1 && x <= g.x1 + 1 && y >= g.y0 - 1 && y <= g.y1 + 1)) continue;
    let open = true;
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) if (at(x + i, y + j) !== LAWN) open = false;
    if (open && !L.decor.some((d) => Math.abs(d.x - x) < 3 && Math.abs(d.y - y) < 3)) L.decor.push({ type: rng() < 0.75 ? "tree" : "shrub", x, y, solid: true, v: rng() });
  }
  // Lamps down the avenue's edges.
  const fo = L.fountain, nearFountain = (y: number) => !!fo && y >= fo.y - 2 && y <= fo.y + fo.h + 1;
  const avenue = (x: number, y: number) => at(x, y) === PAVING && (at(x - 1, y) !== PAVING || at(x + 1, y) !== PAVING) && !nearFountain(y);
  for (let y = FRONT + 2; y < h - 1; y += 8) for (const x of [cx - 3, cx + 2]) if (avenue(x, y)) L.decor.push({ type: "lamp", x, y, solid: true, v: rng() });
  // Benches between the lamps, backs to the railings, facing across the walk.
  for (let y = FRONT + 5; y < h - 2; y += 8) for (const x of [cx - 3, cx + 2]) if (avenue(x, y) && avenue(x, y + 1)) L.decor.push({ type: x < cx ? "bench-e" : "bench-w", x, y, solid: true, v: rng() });
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
  // The feet of two of the Machines' great arched ribs stand out on the floor.
  if (plan.kind === "machines") for (const x of [12, w - 15]) for (let i = 0; i < 3; i++) L.decor.push({ type: i ? "solid" : "rib", x: x + i, y: 9, solid: true, v: 0 });
  else if (plan.kind !== "pavilion")
    for (let x = 6; x < w - 4; x += 8) for (const y of [7, h - 7]) if (Math.abs(x - (w >> 1)) > 2) L.decor.push({ type: "column", x, y, solid: true, v: 0 });
}

/** The Machines' exhibit islands, each on its own plot of darker floor: x0, y0, x1, y1. */
const isles = (w: number): Rect[] => {
  const cx = w >> 1;
  return [[2, 4, 10, 9], [39, 4, 55, 9], [2, 13, 14, 20], [w - 15, 13, w - 3, 20], [2, 24, 30, 29], [41, 24, w - 3, 29], [16, 4, 31, 9], [w - 11, 4, w - 3, 9], [cx - 8, 13, cx + 7, 20]]
    .map(([x0, y0, x1, y1]) => ({ x0, y0, x1, y1 }));
};
/** Machines that fill the islands round the exhibits: the art, and its footprint. */
export const MACHINES: [string, number, number][] = [["engine", 3, 2], ["dynamo", 2, 2], ["pump", 3, 2], ["loom", 2, 1], ["press", 2, 1], ["dynamo", 2, 2], ["engine", 3, 2]];

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
  const cx = w >> 1;
  // Indoors, bays either side of an aisle from the door to the back wall, filled from the back;
  // outdoors, along the promenade in front of the buildings and the walk at the bottom.
  const inside = (r: Rect) => {
    const out: Point[] = [];
    for (let y = r.y0 + 1; y < r.y1; y++) for (let x = r.x0 + 1; x < r.x1; x++) out.push({ x, y });
    return out;
  };
  const isle = plan.kind === "machines" ? isles(w) : [];
  if (plan.kind === "machines") {
    L.plots.push(...isle);
    for (const r of isle.slice(0, 6)) spots.push(...inside(r));
    // The demonstration line shaft, belted to the machines on its platform.
    const d = isle[6];
    for (let y = d.y0 + 2; y <= d.y0 + 4; y++) for (let x = d.x0 + 1; x <= d.x0 + 13; x++) {
      taken[y * w + x] = 1;
      L.decor.push({ type: x === d.x0 + 1 && y === d.y0 + 4 ? "demo" : "solid", x, y, solid: true, v: 0 });
    }
  } else if (indoor) {
    for (let y = 0; y < h; y++) for (const x of [cx - 1, cx]) taken[y * w + x] = 1;
    for (let y = 5; y < h - 3; y += 3) for (let x = 2; x < w - 2; x++) spots.push({ x, y });
    const score = (p: Point) => Math.abs(p.x - cx + 0.5) + (p.y - 5) * 1.2;
    spots.sort((a, b) => score(a) - score(b));
  } else if (plan.kind === "platform") for (let x = 4; x < w - 6; x += 3) for (const y of [3, h - 6]) spots.push({ x, y });
  else {
    for (const y of [FRONT + 2, h - 2]) for (let x = 3; x < w - 3; x++) if (Math.abs(x - cx) > 4) spots.push({ x, y });
    spots.sort((a, b) => Math.abs(a.x - cx) - Math.abs(b.x - cx) || a.y - b.y);
  }
  const wallX: number[] = [];
  if (indoor) for (let x = 3; x < w - 4; x += 4) wallX.push(x);
  const place = (f: FairFind, n: number) => {
    const [fw, fh] = footprint(f);
    // The Machines' locomotive has its own length of track, the great engine the middle of the hall.
    const at = f.art === "locomotive" && isle.length ? inside(isle[7]) : fw >= 6 && isle.length ? inside(isle[8]) : spots;
    if (f.on === "wall" && indoor) {
      const i = wallX.findIndex((x) => wallFree(x, fw));
      if (i < 0) return false;
      const x = wallX.splice(i, 1)[0];
      for (let xx = x; xx < x + fw; xx++) taken[2 * w + xx] = 1;
      L.things.push(thing(L, f, n, x, 2, true));
      return true;
    }
    const spot = at.find((s) => free(s.x, s.y, fw, fh + (f.art === "kiosk" ? 1 : 0)));
    if (!spot) return false;
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
  // The rest of the floor: more machines down the rows, or exhibitors' stands either side of a cross aisle.
  const block = (x: number, y: number, fw: number, fh: number) => {
    for (let yy = y; yy < y + fh; yy++) for (let xx = x; xx < x + fw; xx++) {
      taken[yy * w + xx] = 1;
      if (xx !== x || yy !== y + fh - 1) L.decor.push({ type: "solid", x: xx, y: yy, solid: true, v: 0 });
    }
  };
  if (plan.kind === "machines") {
    let k = Math.floor(rng() * MACHINES.length);
    for (const r of isle.slice(0, 6)) {
      // One row of machines along the plot's foot, a second behind it on a deep plot, room between.
      for (let foot = r.y1 - 1; foot - 1 > r.y0; foot -= 4) for (let x = r.x0 + 1; x < r.x1; x++) {
        const [, fw, fh] = MACHINES[k % MACHINES.length], y = foot - fh + 1;
        if (x + fw > r.x1 || y <= r.y0 || !free(x, y, fw, fh)) continue;
        block(x, y, fw, fh);
        L.decor.push({ type: "machine", x, y: foot, solid: true, v: (k % MACHINES.length) + rng() * 0.9 });
        k++, x += fw + 1;
      }
      // Packing crates at the plot's edge, and a lamp at its corner.
      for (let c = 0, tries = 0; c < 3 && tries < 20; tries++) {
        const x = r.x0 + Math.floor(rng() * (r.x1 - r.x0 + 1)), y = rng() < 0.5 ? r.y0 : r.y1;
        if (taken[y * w + x] || L.cells[y * w + x] !== FLOOR) continue;
        taken[y * w + x] = 1, c++;
        L.decor.push({ type: "crate", x, y, solid: true, v: rng() });
      }
      if (!taken[r.y0 * w + r.x1]) taken[r.y0 * w + r.x1] = 1, L.decor.push({ type: "lamp", x: r.x1, y: r.y0, solid: true, v: 0 });
    }
  } else if (plan.kind === "hall") {
    for (const s of spots) {
      if ((s.y - 5) % 6 || (s.x - 3) % 4 || (s.x - 3) % 12 === 8 || Math.abs(s.y - (h >> 1)) < 2 || s.x < 3 || s.x > w - 6 || !free(s.x, s.y, 3, 1)) continue;
      block(s.x, s.y, 3, 1);
      L.decor.push({ type: "stall", x: s.x, y: s.y, solid: true, v: rng() });
    }
  }
  // Glazed cases down the side walls; palms in tubs in the back corners and either side of the door.
  if (indoor && plan.kind !== "machines") {
    const furnish = (type: string, x: number, y: number) => {
      if (L.cells[y * w + x] !== FLOOR || taken[y * w + x]) return;
      L.decor.push({ type, x, y, solid: true, v: rng() });
      taken[y * w + x] = 1;
    };
    for (let y = 5; y < h - 4; y += 2) furnish("case", 1, y), furnish("case", w - 2, y);
    for (const [x, y] of [[2, 3], [w - 3, 3], [cx - 3, h - 2], [cx + 2, h - 2]]) furnish("palm", x, y);
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
  const [fw, fh] = footprint(f);
  return { id: `${L.area}-${n}`, find: f.id, x, y, wall, solid: !wall, art: f.art, name: f.name, loot: {}, w: fw, h: fh };
}

/** Cells an exhibit takes when its find does not say: room-sized cases and machines. */
const SIZES: Partial<Record<FairFind["art"], [number, number]>> = {
  vitrine: [3, 1], counter: [3, 1], bales: [2, 1], barrels: [2, 1], sacks: [2, 1], ingots: [2, 1], engine: [3, 2], dynamo: [2, 2],
  locomotive: [4, 2], piano: [2, 1], model: [2, 2], loom: [2, 1], press: [2, 1], pyramid: [2, 2], kiosk: [2, 2],
  painting: [2, 1], tapestry: [2, 1], carpet: [2, 1], map: [2, 1], panel: [2, 1],
};
const footprint = (f: FairFind): [number, number] => [f.w ?? SIZES[f.art]?.[0] ?? 1, f.h ?? SIZES[f.art]?.[1] ?? 1];

/** Each closed lawn of the grounds becomes a railed garden: a parterre round a
 * basin, an oval walk round a long bed, or a single bed, with gaps in the
 * railing where the walks come in. */
function gardens(L: FairLevel, rng: () => number, fill: Fill, set: Set, at: (x: number, y: number) => number) {
  const { w, h } = L, seen = new Uint8Array(w * h);
  const shrub = (x: number, y: number) => L.decor.push({ type: "shrub", x, y, solid: true, v: rng() });
  const tree = (x: number, y: number) => L.decor.push({ type: "tree", x, y, solid: true, v: rng() });
  for (let sy = 0; sy < h; sy++) for (let sx = 0; sx < w; sx++) {
    if (seen[sy * w + sx] || at(sx, sy) !== LAWN) continue;
    const todo = [[sx, sy]];
    let x0 = sx, x1 = sx, y0 = sy, y1 = sy, n = 0;
    seen[sy * w + sx] = 1;
    while (todo.length) {
      const [x, y] = todo.pop()!;
      n++;
      x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
      for (const [dx, dy] of N4) {
        const nx = x + dx, ny = y + dy;
        if (at(nx, ny) === LAWN && !seen[ny * w + nx]) seen[ny * w + nx] = 1, todo.push([nx, ny]);
      }
    }
    if (x0 === 0 || y0 === 0 || x1 === w - 1 || y1 === h - 1) continue;
    // A lawn bitten into (by a fountain's apron, say) is trimmed back to a clean rectangle.
    const bad = (ax: number, ay: number, bx: number, by: number) => {
      let k = 0;
      for (let y = ay; y <= by; y++) for (let x = ax; x <= bx; x++) if (at(x, y) !== LAWN) k++;
      return k;
    };
    while (x1 - x0 >= 4 && y1 - y0 >= 4 && bad(x0, y0, x1, y1)) {
      const edges = [bad(x0, y0, x0, y1), bad(x1, y0, x1, y1), bad(x0, y0, x1, y0), bad(x0, y1, x1, y1)], worst = edges.indexOf(Math.max(...edges));
      if (worst === 0) x0++; else if (worst === 1) x1--; else if (worst === 2) y0++; else y1--;
    }
    const bw = x1 - x0 + 1, bh = y1 - y0 + 1;
    if (bad(x0, y0, x1, y1) || bw < 5 || bh < 5) continue;
    void n;
    // The railing, open where a walk meets the middle of a side.
    for (let x = x0; x <= x1; x++) set(x, y0, FENCE), set(x, y1, FENCE);
    for (let y = y0; y <= y1; y++) set(x0, y, FENCE), set(x1, y, FENCE);
    const mx = x0 + (bw >> 1), my = y0 + (bh >> 1), even = bw % 2 === 0;
    const gx = even ? [mx - 1, mx] : [mx], gy = bh % 2 === 0 ? [my - 1, my] : [my];
    const open = (x: number, y: number) => fairWalkable(at(x, y));
    if (gx.every((x) => open(x, y0 - 1))) for (const x of gx) set(x, y0, GRAVEL);
    if (gx.every((x) => open(x, y1 + 1))) for (const x of gx) set(x, y1, GRAVEL);
    if (gy.every((y) => open(x0 - 1, y))) for (const y of gy) set(x0, y, GRAVEL);
    if (gy.every((y) => open(x1 + 1, y))) for (const y of gy) set(x1, y, GRAVEL);
    // Urns on the railing where it runs beside the avenue.
    for (const x of [x0, x1]) if (at(x + (x === x0 ? -1 : 1), y0 + 1) === PAVING) for (const y of [y0 + 1, y1 - 1]) L.decor.push({ type: "urn", x, y, solid: true, v: rng() });
    const ix0 = x0 + 1, ix1 = x1 - 1, iy0 = y0 + 1, iy1 = y1 - 1, iw = ix1 - ix0 + 1, ih = iy1 - iy0 + 1;
    const bed = (a: number, b: number, c: number, d: number) => {
      // Too narrow for a box edge: a strip of bloom (the painter still edges it), or one shrub.
      if (c - a < 2 || d - b < 2) return void (c - a >= 2 || d - b >= 2 ? fill(a, b, c, d, BED) : shrub(a + ((c - a) >> 1), b + ((d - b) >> 1)));
      fill(a, b, c, d, BOX);
      fill(a + 1, b + 1, c - 1, d - 1, BED);
    };
    // Mirrored across the avenue: gardens at the same distance from the middle get the same plan.
    const k = Math.sin(Math.abs(x0 + x1 - w + 1) * 12.9898 + y0 * 78.233) * 43758.5453, pick = k - Math.floor(k);
    const style = iw >= 10 && ih >= 9 ? (pick < 0.5 ? "oval" : "parterre") : iw >= 7 && ih >= 6 && pick < 0.45 ? "parterre" : iw >= 5 && ih >= 7 && pick < 0.8 ? "lawn" : iw >= 4 && ih >= 3 ? "bed" : iw >= 6 ? "ribbon" : "grove";
    L.gardens.push({ x0: ix0, y0: iy0, x1: ix1, y1: iy1, style, gx, gy });
    if (style === "parterre") {
      // Cross walks from the gaps, a basin where they meet, a hedged bed in each quarter.
      for (const x of gx) fill(x, iy0, x, iy1, GRAVEL);
      for (const y of gy) fill(ix0, y, ix1, y, GRAVEL);
      const big = iw >= 10 && ih >= 9, m = big ? (iw >= 14 && ih >= 12 ? 2 : 1) : 0;
      if (big) {
        if (gy.length === 1) gy.unshift(gy[0] - 1);
        fill(gx[0] - m, gy[0] - m, gx[gx.length - 1] + m, gy[gy.length - 1] + m, GRAVEL);
        fill(gx[0] - m + 1, gy[0] - m + 1, gx[gx.length - 1] + m - 1, gy[gy.length - 1] + m - 1, WATER);
        L.decor.push({ type: "jet", x: gx[0], y: gy[0], solid: false, v: gx.length });
      }
      const lx = gx[0] - m - 1, rx = gx[gx.length - 1] + m + 1, ty = gy[0] - m - 1, by = gy[gy.length - 1] + m + 1;
      // Each quarter is turf with a hedged bed set in it, or all bed when the quarter is small.
      for (const [a, b, c, d] of [[ix0, iy0, lx, ty], [rx, iy0, ix1, ty], [ix0, by, lx, iy1], [rx, by, ix1, iy1]]) {
        if (c - a >= 4 && d - b >= 4) {
          bed(a + 1, b + 1, c - 1, d - 1);
          for (const [x, y] of [[a, b], [c, b], [a, d], [c, d]]) L.decor.push({ type: "shrub", x, y, solid: true, v: 0.9 });
        }
        else bed(a, b, c, d);
      }
    } else if (style === "oval") {
      // A walk round the lawn with its corners cut, turf inside it, and a long bed down the middle.
      const a = ix0 + 1, b = iy0 + 1, c = ix1 - 1, d = iy1 - 1;
      if (c - a >= 9) { bed(a + 4, b + 4, c - 4, d - 4); L.decor.push({ type: "urn", x: (a + c) >> 1, y: (b + d) >> 1, solid: true, v: rng() }); } else if (c - a >= 6) bed(a + 2, b + 3, c - 2, d - 3);
      else fill(a + 2, b + 3, c - 2, d - 3, BED);
      for (const x of gx) { set(x, iy0, GRAVEL); set(x, iy1, GRAVEL); }
      for (const y of gy) { set(ix0, y, GRAVEL); set(ix1, y, GRAVEL); }
      for (const [x, y] of [[ix0, iy0], [ix1, iy0], [ix0, iy1], [ix1, iy1]]) tree(x, y);
      for (const y of [b + 2, d - 2]) shrub(a + 2 + (c - a > 5 ? 1 : 0), y), shrub(c - 2 - (c - a > 5 ? 1 : 0), y);
    } else if (style === "lawn") {
      // Open turf: a round bed in the middle, standards either side, a tree at each end.
      const mx = ix0 + ((iw - 1) >> 1), my = iy0 + ((ih - 1) >> 1);
      fill(mx - 1 + (iw % 2 ? 1 : 0), my - 1, mx + 1, my + 1 + (ih % 2 ? 0 : 1), BED);
      tree(ix0 + (iw >> 1), iy0 + 1); tree(ix0 + ((iw - 1) >> 1), iy1 - 1);
      for (const y of [my - 3, my + 4]) if (y > iy0 + 1 && y < iy1 - 1) shrub(ix0, y), shrub(ix1, y);
    } else if (style === "ribbon") {
      // A narrow lawn: one long ribbon of bloom down it, a clipped ball at each end.
      fill(ix0 + 2, iy1, ix1 - 2, iy1, BED);
      for (const x of gx) set(x, iy1, LAWN);
      shrub(ix0, iy1); shrub(ix1, iy1);
    } else if (style === "bed") {
      bed(ix0 + 1, iy0 + (ih > 3 ? 1 : 0), ix1 - 1, iy1 - (ih > 3 ? 1 : 0));
      // A walk straight through, where the railing opens.
      for (const x of gx) for (let y = iy0; y <= iy1; y++) if (at(x, y) === BED || at(x, y) === BOX) set(x, y, LAWN);
      if (ih > 3) for (const [x, y] of [[ix0, iy0], [ix1, iy1]]) tree(x, y);
    } else {
      tree(ix0 + (iw >> 1), iy0 + (ih >> 1));
    }
  }
}

/** Cells no one can stand in: every cell of a big exhibit, and the solid decor. */
export function fairSolid(L: FairLevel) {
  const solid = new Set<number>();
  for (const t of L.things) if (t.solid) for (let y = t.y; y < t.y + (t.h ?? 1); y++) for (let x = t.x; x < t.x + (t.w ?? 1); x++) solid.add(y * L.w + x);
  for (const d of L.decor as AreaDecor[]) if (d.solid) solid.add(d.y * L.w + d.x);
  for (const l of L.lifts) solid.add(l.y * L.w + l.x);
  return solid;
}

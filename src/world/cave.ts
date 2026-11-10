import { caveFind, caveFinds, findFits, type CaveFind, type CaveKind, type CavePlace } from "../content/caves";
import { oreAt } from "../content/ecology/metals";
import { hash } from "../core/random";
import type { Inventory, Point } from "../core/types";

export const WALL = 0, FLOOR = 1, SHALLOW = 2, DEEP = 3, MOUTH = 4;

export type CaveSite = {
  /** The cell outside at the foot of the mouth, as "x,y". */
  id: string;
  kind: CaveKind;
  levels: number;
  place: CavePlace;
  /** Species that might den here, with weights; empty where none range. */
  denners: [string, number][];
  snakes: boolean;
};
export type CaveThing = {
  id: string;
  find: string;
  x: number;
  y: number;
  /** On a north face: used from the cell below. */
  wall: boolean;
  solid: boolean;
  /** Art key, with any variant the generator chose. */
  art: string;
  name: string;
  loot: Inventory;
};
export type CaveDecor = { type: string; x: number; y: number; solid: boolean; v: number };
export type CaveDweller = { id: string; species: string; x: number; y: number };
export type CaveLevel = {
  space: string;
  cave: string;
  depth: number;
  last: boolean;
  kind: CaveKind;
  name: string;
  w: number;
  h: number;
  cells: Uint8Array;
  entry: Point;
  /** The wall cell the rope up hangs on; absent on the first level, which is walked out of. */
  up?: Point;
  /** The hole down, a cell of its own. */
  down?: Point;
  things: CaveThing[];
  decor: CaveDecor[];
  dwellers: CaveDweller[];
};

export const caveSpace = (cave: string, depth: number) => `cave:${cave}:${depth}`;
export function parseCaveSpace(space: string) {
  const m = /^cave:(-?\d+,-?\d+):(\d+)$/.exec(space);
  return m ? { cave: m[1], depth: Number(m[2]) } : undefined;
}

function rngOf(...keys: (string | number)[]) {
  let a = hash(keys.join("|"));
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = <T>(rng: () => number, list: readonly T[], weight: (t: T) => number): T | undefined => {
  let total = 0;
  for (const t of list) total += weight(t);
  let roll = rng() * total;
  for (const t of list) if ((roll -= weight(t)) < 0) return t;
  return list.at(-1);
};

/** How far down a cave goes: shelters are shallow, limestone runs deep. */
export function caveLevels(seed: string, id: string, kind: CaveKind) {
  const r = rngOf(seed, "cave-levels", id)();
  const [lo, hi] = { karst: [3, 6], fissure: [2, 5], lava: [2, 4], ice: [2, 3], sea: [1, 3], sandstone: [1, 3] }[kind];
  return lo + Math.floor(r * (hi - lo + 1));
}

/** Which finds lie on which level, settled once for the whole cave so the
 * best thing in it is found once and at the bottom. */
export function cavePlan(seed: string, site: CaveSite): string[][] {
  const rng = rngOf(seed, "cave-plan", site.id);
  const used = new Set<string>();
  const plan: string[][] = [];
  const w = (f: CaveFind) => f.weight ?? 1;
  for (let d = 1; d <= site.levels; d++) {
    const fits = caveFinds.filter((f) => findFits(f, site.place, site.kind, d));
    const level: string[] = [];
    const take = (pool: CaveFind[], unique: boolean) => {
      const f = pick(rng, pool.filter((p) => !(unique ? used : new Set(level)).has(p.id)), w);
      if (!f) return;
      level.push(f.id);
      if (unique) used.add(f.id);
    };
    const nodes = fits.filter((f) => f.tier === "node");
    for (let i = 3 + Math.floor(rng() * 3) + Math.min(d, 3); i > 0; i--) {
      const f = pick(rng, nodes.filter((n) => level.filter((id) => id === n.id).length < 2), w);
      if (f) level.push(f.id);
    }
    const common = fits.filter((f) => f.tier === "common"), notable = fits.filter((f) => f.tier === "notable");
    for (let i = (d === 1 ? 2 : 1) + (rng() < 0.5 ? 1 : 0); i > 0; i--) take(common, true);
    if (rng() < (d === 1 ? 0.7 : 0.5)) take(notable, true);
    const last = d === site.levels;
    if (rng() < (last ? (site.levels === 1 ? 0.5 : 1) : 0.12)) {
      const prizes = fits.filter((f) => f.tier === "prize");
      take(prizes.some((p) => !used.has(p.id)) ? prizes : notable, true);
    }
    plan.push(level);
  }
  return plan;
}

// Descriptions, not names: nobody has mapped these, so nothing here has a name yet.
const NAMES: Record<CaveKind, string[]> = {
  karst: ["a dripping chamber", "a long gallery", "a chamber of hanging stone", "a chamber with a still pool", "a bone-strewn passage", "a high-roofed chamber", "a chamber of white flowstone", "a low crawl"],
  fissure: ["a narrow cleft", "a tight squeeze", "a rock chimney", "a deep rift", "a chamber of glinting crystal", "a passage along a fault"],
  lava: ["a lava tube", "a black-walled tunnel", "a scorched chamber", "a passage of ropy rock", "a passage of glassy rock", "a passage where air moves"],
  ice: ["a blue ice hall", "a frozen waterfall", "an icy stair", "a cold chamber"],
  sea: ["a tidal chamber", "a sea cave big enough for a boat", "a seal beach", "a chamber full of washed-up seaweed"],
  sandstone: ["a rock shelter", "a red-walled chamber", "a sandstone ledge", "a chamber with swallows' nests"],
};

/** One level of a cave: always the same for the same world, cave and depth. */
export function caveLevel(seed: string, site: CaveSite, depth: number): CaveLevel {
  for (let attempt = 0; ; attempt++) {
    const level = build(seed, site, depth, attempt);
    if (level) return level;
  }
}

function build(seed: string, site: CaveSite, depth: number, attempt: number): CaveLevel | undefined {
  const rng = rngOf(seed, "cave", site.id, depth, attempt);
  const { kind } = site;
  const small = kind === "sandstone" || (kind === "sea" && depth === 1);
  const w = Math.min(50, (small ? 26 : 30) + depth * 3 + Math.floor(rng() * 6));
  const h = Math.min(36, (small ? 20 : 24) + depth * 2 + Math.floor(rng() * 4));
  const cells = new Uint8Array(w * h);
  const at = (x: number, y: number) => (x < 0 || y < 0 || x >= w || y >= h ? WALL : cells[y * w + x]);
  const set = (x: number, y: number, v: number) => {
    if (x > 1 && y > 2 && x < w - 2 && y < h - 2) cells[y * w + x] = v;
  };
  const open = (x: number, y: number) => at(x, y) !== WALL && at(x, y) !== DEEP;

  if (kind === "lava") {
    // Tubes: a few worms that wander and fork, wide enough for two abreast.
    const worms = [{ x: w / 2, y: h - 5, a: -Math.PI / 2, n: w + h }];
    while (worms.length) {
      const worm = worms.pop()!;
      const r = 1.1 + rng() * 0.9;
      for (let i = 0; i < worm.n; i++) {
        for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (dx * dx + dy * dy <= r * r + 0.6) set(Math.round(worm.x + dx), Math.round(worm.y + dy), FLOOR);
        worm.a += (rng() - 0.5) * 0.7;
        worm.x += Math.cos(worm.a) * 0.9;
        worm.y += Math.sin(worm.a) * 0.9;
        if (worm.x < 4 || worm.x > w - 5) worm.a = Math.PI - worm.a;
        if (worm.y < 5 || worm.y > h - 5) worm.a = -worm.a;
        worm.x = Math.max(4, Math.min(w - 5, worm.x));
        worm.y = Math.max(5, Math.min(h - 5, worm.y));
        if (rng() < 0.03 && worm.n - i > 14) worms.push({ x: worm.x, y: worm.y, a: worm.a + (rng() < 0.5 ? 1.3 : -1.3), n: (worm.n - i) * 0.6 });
      }
    }
  } else {
    const fill = { karst: 0.45, fissure: 0.46, ice: 0.41, sea: 0.42, sandstone: 0.4 }[kind];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) set(x, y, rng() < fill ? WALL : FLOOR);
    // A fissure follows the grain of the rock: its neighbourhood is wider than tall.
    const rx = kind === "fissure" ? 2 : 1;
    for (let pass = 0; pass < 5; pass++) {
      const next = cells.slice();
      for (let y = 3; y < h - 2; y++)
        for (let x = 2; x < w - 2; x++) {
          let n = 0;
          for (let dy = -1; dy <= 1; dy++) for (let dx = -rx; dx <= rx; dx++) if ((dx || dy) && at(x + dx, y + dy) === WALL) n++;
          next[y * w + x] = n * 8 >= (rx * 2 + 1) * 3 * 4.4 ? WALL : n * 8 <= (rx * 2 + 1) * 3 * 3.2 ? FLOOR : cells[y * w + x];
        }
      cells.set(next);
    }
  }

  // A back wall is drawn three cells tall, so rock thinner than that between
  // one chamber and the next one up is broken through.
  for (let x = 0; x < w; x++)
    for (let y = h - 3; y > 3; y--) {
      if (at(x, y) === WALL || at(x, y - 1) !== WALL) continue;
      let top = y - 1;
      while (top > 0 && at(x, top - 1) === WALL) top--;
      if (y - top < 3 && top > 0) for (let k = top; k < y; k++) set(x, k, FLOOR);
    }

  // Keep the largest chamber system and wall up the rest.
  const region = new Int32Array(w * h).fill(-1);
  let best = -1, bestSize = 0;
  for (let i = 0, id = 0; i < w * h; i++) {
    if (cells[i] === WALL || region[i] >= 0) continue;
    const stack = [i];
    region[i] = id;
    let size = 0;
    while (stack.length) {
      const c = stack.pop()!;
      size++;
      for (const n of [c - 1, c + 1, c - w, c + w]) if (cells[n] !== WALL && region[n] < 0) (region[n] = id), stack.push(n);
    }
    if (size > bestSize) (bestSize = size), (best = id);
    id++;
  }
  if (bestSize < w * h * 0.2) return undefined;
  for (let i = 0; i < w * h; i++) if (region[i] !== best) cells[i] = WALL;

  let entry: Point, up: Point | undefined;
  if (depth === 1) {
    // Walked into from the south: a passage cut from the foot of the map to the nearest floor.
    let cx = Math.floor(w / 2), cy = -1;
    for (let r = 0; r < w && cy < 0; r++)
      for (const x of [Math.floor(w / 2) - r, Math.floor(w / 2) + r]) {
        for (let y = h - 4; y > h - 12 && cy < 0; y--) if (at(x, y) === FLOOR && x > 3 && x < w - 4) (cx = x), (cy = y);
        if (cy >= 0) break;
      }
    if (cy < 0) return undefined;
    for (let y = cy; y < h; y++) for (const dx of [-1, 0, 1]) cells[y * w + cx + dx] = y >= h - 2 ? MOUTH : FLOOR;
    entry = { x: cx, y: h - 3 };
  } else {
    const faces: Point[] = [];
    for (let y = 4; y < h - 3; y++) for (let x = 3; x < w - 3; x++)
      if (at(x, y) === WALL && at(x, y - 1) === WALL && at(x, y + 1) === FLOOR && at(x - 1, y + 1) === FLOOR && at(x + 1, y + 1) === FLOOR) faces.push({ x, y });
    if (!faces.length) return undefined;
    up = faces[Math.floor(rng() * faces.length)];
    entry = { x: up.x, y: up.y + 1 };
  }

  // Pools gather in the low places; deep water is ringed by shallows.
  const wet = { karst: 0.63, fissure: 0.7, ice: 0.7, sea: 0.52, sandstone: 0.8, lava: 2 }[kind];
  const noise = (x: number, y: number) => {
    const g = (gx: number, gy: number) => (hash(`${seed}|${site.id}|${depth}|w|${gx}|${gy}`) % 1000) / 1000;
    const fx = x / 5, fy = y / 5, x0 = Math.floor(fx), y0 = Math.floor(fy);
    const tx = fx - x0, ty = fy - y0, sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
    return (g(x0, y0) * (1 - sx) + g(x0 + 1, y0) * sx) * (1 - sy) + (g(x0, y0 + 1) * (1 - sx) + g(x0 + 1, y0 + 1) * sx) * sy;
  };
  for (let y = 3; y < h - 3; y++) for (let x = 2; x < w - 2; x++) {
    if (at(x, y) !== FLOOR || Math.hypot(x - entry.x, y - entry.y) < 4) continue;
    const tide = kind === "sea" && depth === 1 ? (y / h - 0.5) * 0.5 : 0;
    if (noise(x, y) + tide > wet) cells[y * w + x] = SHALLOW;
  }
  const shallow = cells.slice();
  for (let y = 3; y < h - 3; y++) for (let x = 2; x < w - 2; x++)
    if (shallow[y * w + x] === SHALLOW && [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]].every(([dx, dy]) => shallow[(y + dy) * w + x + dx] === SHALLOW)) cells[y * w + x] = DEEP;

  const flood = () => {
    const dist = new Int32Array(w * h).fill(-1);
    const queue = [entry.y * w + entry.x];
    dist[queue[0]] = 0;
    for (let q = 0; q < queue.length; q++) {
      const c = queue[q];
      for (const n of [c - 1, c + 1, c - w, c + w]) if (dist[n] < 0 && cells[n] !== WALL && cells[n] !== DEEP) (dist[n] = dist[c] + 1), queue.push(n);
    }
    return dist;
  };
  let dist = flood();
  // Deep water that cuts a chamber off is waded instead.
  if (cells.some((c, i) => c !== WALL && c !== DEEP && dist[i] < 0)) {
    for (let i = 0; i < w * h; i++) if (cells[i] === DEEP) cells[i] = SHALLOW;
    dist = flood();
  }
  let far = 0;
  for (let i = 0; i < w * h; i++) far = Math.max(far, dist[i]);
  if (far < 14) return undefined;

  const taken = new Set<number>();
  const solid = new Set<number>();
  const walkable = (x: number, y: number) => open(x, y) && !solid.has(y * w + x);
  /** Blocking this cell leaves its neighbours joined: they form one arc around it. */
  const safe = (x: number, y: number) => {
    const ring = [[-1, -1], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0]].map(([dx, dy]) => walkable(x + dx, y + dy));
    let turns = 0;
    for (let i = 0; i < 8; i++) if (ring[i] !== ring[(i + 1) % 8]) turns++;
    return turns <= 2 && ring.filter(Boolean).length >= 3;
  };
  const free = (x: number, y: number) => at(x, y) === FLOOR && !taken.has(y * w + x) && dist[y * w + x] > 2;
  const block = (x: number, y: number) => (taken.add(y * w + x), solid.add(y * w + x));

  const last = depth >= site.levels;
  let down: Point | undefined;
  if (!last) {
    const spots: Point[] = [];
    for (let y = 4; y < h - 3; y++) for (let x = 3; x < w - 3; x++) if (free(x, y) && dist[y * w + x] >= far * 0.75 && safe(x, y)) spots.push({ x, y });
    if (!spots.length) return undefined;
    down = spots[Math.floor(rng() * spots.length)];
    block(down.x, down.y);
  }
  taken.add(entry.y * w + entry.x);

  const things: CaveThing[] = [];
  const faces: Point[] = [];
  for (let y = 4; y < h - 3; y++) for (let x = 3; x < w - 3; x++)
    if (at(x, y) === WALL && at(x, y - 1) === WALL && at(x, y + 1) === FLOOR && !(up && Math.abs(up.x - x) < 2 && up.y === y)) faces.push({ x, y });
  const floors: Point[] = [];
  for (let y = 4; y < h - 3; y++) for (let x = 3; x < w - 3; x++) if (free(x, y) && dist[y * w + x] >= 4) floors.push({ x, y });
  const walls4 = (x: number, y: number) => [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => at(x + dx, y + dy) === WALL).length;
  const walls8 = (x: number, y: number) => {
    let n = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (at(x + dx, y + dy) === WALL) n++;
    return n;
  };
  const plan = cavePlan(seed, site)[depth - 1] ?? [];
  plan.forEach((id, i) => {
    const f = caveFind(id)!;
    let spot: Point | undefined;
    if (f.on === "wall") {
      const options = faces.filter((p) => !taken.has(p.y * w + p.x) && free(p.x, p.y + 1));
      // A painting wants a wall wide enough to hold it.
      const broad = options.filter((p) => at(p.x - 1, p.y) === WALL && at(p.x + 1, p.y) === WALL && at(p.x - 1, p.y + 1) !== WALL && at(p.x + 1, p.y + 1) !== WALL);
      const from = broad.length ? broad : options;
      spot = from[Math.floor(rng() * from.length)];
      if (spot) for (const dx of [-1, 0, 1]) taken.add(spot.y * w + spot.x + dx), taken.add((spot.y + 1) * w + spot.x + dx);
    } else {
      let score = -1;
      for (let n = 0; n < 24; n++) {
        const p = floors[Math.floor(rng() * floors.length)];
        if (!p || !free(p.x, p.y) || (!f.flat && !safe(p.x, p.y))) continue;
        const near = walls4(p.x, p.y) > 0 ? 0.35 : 0;
        const s = f.tier === "prize" ? dist[p.y * w + p.x] / far + walls8(p.x, p.y) * 0.08 + rng() * 0.2 : near + rng() * 0.6;
        if (s > score) (score = s), (spot = p);
      }
      if (spot) f.flat ? taken.add(spot.y * w + spot.x) : block(spot.x, spot.y);
    }
    if (!spot) return;
    const loot: Inventory = {};
    for (const [item, n] of Object.entries(f.loot ?? {})) {
      const count = typeof n === "number" ? n : n[0] + Math.floor(rng() * (n[1] - n[0] + 1));
      if (count > 0) loot[item] = count;
    }
    let art = f.art, name = f.name;
    if (f.id === "ore-vein") {
      let ore: ReturnType<typeof oreAt>;
      for (let t = 0; t < 40 && !ore; t++) ore = oreAt(seed, spot.x * 131 + t, spot.y * 17 + depth, site.place.year);
      if (ore) {
        delete loot.ore;
        loot[ore.item] = ore.yield;
        art = `seam:${ore.metal}`;
        name = `${ore.metal[0].toUpperCase()}${ore.metal.slice(1)} vein`;
      }
    }
    things.push({ id: `${depth}-${i}-${id}`, find: id, x: spot.x, y: spot.y, wall: f.on === "wall", solid: f.on === "floor" && !f.flat, art, name, loot });
  });

  // What the rock grows on its own: columns to walk round, litter to walk over.
  const decor: CaveDecor[] = [];
  const tall = { karst: ["stalagmite", "stalagmite", "column"], fissure: ["boulder", "boulder", "stalagmite"], lava: ["lavarock"], ice: ["icecolumn", "icecolumn", "boulder"], sea: ["searock"], sandstone: ["boulder"] }[kind];
  const litter = { karst: ["pebbles", "puddle", "crack", "straws"], fissure: ["pebbles", "crack", "scree"], lava: ["ropes", "crack", "cinders"], ice: ["snow", "frost", "crack"], sea: ["weed", "pebbles", "sandripple", "puddle"], sandstone: ["sandripple", "pebbles", "dust"] }[kind];
  for (let y = 4; y < h - 3; y++) for (let x = 3; x < w - 3; x++) {
    const i = y * w + x;
    if (cells[i] === FLOOR && !taken.has(i)) {
      const r = rng();
      const clear = walls8(x, y) === 0 && [[1, 0], [-1, 0], [0, 1], [0, -1]].every(([dx, dy]) => !solid.has((y + dy) * w + x + dx));
      if (r < (clear ? 0.045 : 0.01) && dist[i] > 3 && safe(x, y)) {
        decor.push({ type: tall[Math.floor(rng() * tall.length)], x, y, solid: true, v: rng() });
        block(x, y);
      } else if (r < 0.2) decor.push({ type: depth === 1 && dist[i] < 9 && rng() < 0.6 && kind !== "ice" ? "moss" : litter[Math.floor(rng() * litter.length)], x, y, solid: false, v: rng() });
    } else if (cells[i] === WALL && at(x, y + 1) !== WALL && at(x, y - 1) === WALL && !taken.has(i)) {
      const r = rng();
      const type = kind === "ice" ? "icicles" : kind === "karst" ? "flowstone" : kind === "sea" ? "barnacles" : kind === "lava" ? "lavadrip" : depth === 1 ? "roots" : "stain";
      if (r < 0.16) decor.push({ type, x, y, solid: false, v: rng() });
      else if (r < 0.2 && cells[i + w] === FLOOR) decor.push({ type: "drip", x, y: y + 1, solid: false, v: rng() });
    }
  }

  // Who lives here. A den is in a far corner; snakes lie up near the warmth of the mouth.
  const dwellers: CaveDweller[] = [];
  const roam = floors.filter((p) => walkable(p.x, p.y) && !taken.has(p.y * w + p.x));
  const drng = rngOf(seed, "cave-dwellers", site.id, depth);
  if (roam.length) {
    for (let n = kind === "ice" ? 0 : 1 + Math.floor(drng() * 2); n > 0; n--) {
      const p = roam[Math.floor(drng() * roam.length)];
      dwellers.push({ id: `${depth}-bats-${n}`, species: "bats", ...p });
    }
    const den = site.denners.length && depth >= Math.min(2, site.levels) && drng() < 0.45 ? pick(drng, site.denners, ([, weight]) => weight) : undefined;
    if (den) {
      const deep = roam.filter((p) => dist[p.y * w + p.x] > far * 0.5 && walls8(p.x, p.y) === 0);
      const p = deep[Math.floor(drng() * deep.length)];
      if (p) dwellers.push({ id: `${depth}-den`, species: den[0], ...p });
    }
    if (site.snakes && depth <= 2)
      for (let n = Math.floor(drng() * 2.3); n > 0; n--) {
        const p = roam[Math.floor(drng() * roam.length)];
        if (dist[p.y * w + p.x] > 6) dwellers.push({ id: `${depth}-snake-${n}`, species: "snake", ...p });
      }
  }

  const names = NAMES[kind];
  const name = depth === 1 ? "the cave mouth" : names[hash(`${seed}|${site.id}|${depth}|name`) % names.length];
  return { space: caveSpace(site.id, depth), cave: site.id, depth, last, kind, name, w, h, cells, entry, up, down, things, decor, dwellers };
}

/** Cells that stop feet whatever is taken or killed: rock, deep water, columns and big finds. */
export function caveSolid(level: CaveLevel) {
  const solid = new Set<number>();
  if (level.down) solid.add(level.down.y * level.w + level.down.x);
  for (const d of level.decor) if (d.solid) solid.add(d.y * level.w + d.x);
  for (const t of level.things) if (t.solid) solid.add(t.y * level.w + t.x);
  return solid;
}

import { tombFind, type TombFind, type TombRole, type TombStyle } from "../content/tombs";
import { pickWeighted as pick, rngOf } from "../core/random";
import type { Inventory, Point } from "../core/types";
import { arrivalFrom, N4, type Area, type AreaDecor, type AreaExit, type AreaLift } from "./complex";

export const WALL = 0, FLOOR = 1, PIT = 2, STAIR = 3;
/** Feet can go here. */
export const tombWalkable = (c: number) => c === FLOOR || c === STAIR;

type Dir = "n" | "e" | "s" | "w";
const OPP: Record<Dir, Dir> = { n: "s", s: "n", e: "w", w: "e" };
export type Rect = { x0: number; y0: number; x1: number; y1: number };

/** One area of a tomb's plan: what it is, and which areas its ways lead to. */
export type TombArea = {
  id: number;
  role: TombRole;
  name: string;
  depth: number;
  links: Partial<Record<Dir, number>>;
  /** A shaft in the floor to this area, and the climb back. */
  down?: number;
  up?: number;
  /** The passage on this side is walled up. */
  sealed?: Dir;
  finds: string[];
};

export type TombLevel = Area & {
  /** "<style>.<n>": which tomb of its kind in this world. */
  site: string;
  style: string;
  area: number;
  role: TombRole;
  exits: AreaExit[];
  lifts: AreaLift[];
  /** The main room first, then the small rooms off it. */
  rooms: Rect[];
  pit?: Rect;
};

export const tombSpace = (site: string, area: number) => `tomb:${site}:${area}`;
export function parseTombSpace(space: string) {
  const m = /^tomb:(([a-z-]+)\.[-\d,]+):(\d+)$/.exec(space);
  return m ? { site: m[1], style: m[2], area: Number(m[3]) } : undefined;
}

/** The whole tomb, settled once from the seed: a run of areas on one axis from
 * the stair to the burial chamber, shafts where a well room breaks it, side
 * rooms off it, and what lies in each. */
export function tombPlan(seed: string, style: TombStyle, site: string): TombArea[] {
  const rng = rngOf(seed, "tomb-plan", site);
  const areas: TombArea[] = [], named = new Map<TombRole, number>();
  const add = (role: TombRole, depth: number) => {
    const k = named.get(role) ?? 0, pool = style.names[role];
    named.set(role, k + 1);
    const a: TombArea = { id: areas.length, role, name: pool[Math.min(k, pool.length - 1)], depth, links: {}, finds: [] };
    areas.push(a);
    return a;
  };
  const join = (a: TombArea, dir: Dir, b: TombArea) => void ((a.links[dir] = b.id), (b.links[OPP[dir]] = a.id));
  const axis: TombRole[] = ["entrance", "corridor"];
  const [few, more] = style.plan.axis ?? [1, 2];
  for (let n = few + Math.floor(rng() * (more + 1)); n > 0; n--) {
    const r = rng(), last = axis.at(-1)!;
    axis.push(style.plan.shafts && r < 0.3 && last !== "well" && !axis.includes("well") ? "well" : r < 0.55 && last !== "hall" ? "hall" : "corridor");
  }
  if (axis.at(-1) !== "hall") axis.push("hall");
  axis.push("burial");
  let prev = add("entrance", 1);
  for (const role of axis.slice(1)) {
    const cur = add(role, prev.depth + (prev.role === "well" ? 1 : 0));
    if (prev.role === "well") (prev.down = cur.id), (cur.up = prev.id);
    else join(prev, "n", cur);
    prev = cur;
  }
  if (prev.links.s !== undefined) prev.sealed = "s";
  // Side rooms off the axis, more of them the further in.
  const odds: Record<TombRole, number> = { entrance: 0, corridor: 0.3, well: 0.15, hall: 0.5, burial: 0.75, store: 0, cutting: 0, ...style.plan.side };
  for (const a of areas.slice()) for (const dir of ["w", "e"] as const) {
    if (rng() >= odds[a.role] && !(a.role === "burial" && dir === "e" && a.links.w === undefined)) continue;
    const side = add(a.role !== "burial" && rng() < 0.25 ? "cutting" : "store", a.depth);
    join(a, dir, side);
    if (side.role === "store" && rng() < 0.5) side.sealed = OPP[dir];
    if (side.role === "store" && rng() < 0.2) join(side, dir, add("store", a.depth));
  }
  // What lies where: the prizes with the dead, each good thing once in the tomb.
  const used = new Set<string>();
  const take = (a: TombArea, tier: TombFind["tier"], n: number) => {
    for (; n > 0; n--) {
      const f = pick(rng, style.finds.filter((f) => f.tier === tier && (!f.roles || f.roles.includes(a.role)) && !(tier === "common" ? a.finds : [...used]).includes(f.id)), (f) => f.weight ?? 1);
      if (!f) return;
      a.finds.push(f.id);
      used.add(f.id);
    }
  };
  const some = (n: number, p: number) => n + (rng() < p ? 1 : 0);
  const burial = areas.find((a) => a.role === "burial")!;
  take(burial, "prize", 2);
  take(burial, "notable", 2);
  take(burial, "common", 2);
  for (const a of areas) {
    if (a.role === "store") take(a, "notable", some(1, 0.5)), take(a, "common", some(2, 0.5));
    else if (a.role === "hall") take(a, "notable", some(1, 0.5)), take(a, "common", 2);
    else if (a.role === "corridor") take(a, "notable", some(0, 0.4)), take(a, "common", some(1, 0.5));
    else if (a.role !== "burial") take(a, "common", some(1, a.role === "cutting" ? 0.5 : 0));
  }
  return areas;
}

/** Cells wide, cells deep, and the main room's width and depth. */
const SIZE: Record<TombRole, [number, number, number, number]> = {
  entrance: [22, 22, 5, 7], corridor: [24, 30, 5, 20], well: [24, 24, 11, 9], hall: [38, 30, 19, 14], store: [26, 22, 9, 8], cutting: [22, 20, 7, 6], burial: [40, 32, 19, 15],
};
/** How likely a free stretch of the main room's side is to have a small room off it. */
const ANNEX: Record<TombRole, number> = { entrance: 0, corridor: 0.35, well: 0.3, hall: 0.5, store: 1, cutting: 0, burial: 0.85 };

/** One area of a tomb: always the same for the same world, tomb and area. */
export function tombLevel(seed: string, style: TombStyle, site: string, id: number): TombLevel | undefined {
  const plan = tombPlan(seed, style, site);
  if (!plan[id]) return undefined;
  for (let attempt = 0; ; attempt++) {
    const level = build(seed, style, site, plan, plan[id], attempt);
    if (level) return level;
  }
}

function build(seed: string, style: TombStyle, site: string, plan: TombArea[], a: TombArea, attempt: number): TombLevel | undefined {
  const rng = rngOf(seed, "tomb", site, a.id, attempt);
  const [w, h, rw0, rh0] = SIZE[a.role];
  const rw = rw0 + 2 * Math.floor(rng() * 2), rh = rh0 + Math.floor(rng() * 3);
  const cells = new Uint8Array(w * h), cx = w >> 1;
  const R: Rect = { x0: cx - (rw >> 1), y0: Math.max(5, (h - rh) >> 1), x1: cx + (rw >> 1), y1: Math.max(5, (h - rh) >> 1) + rh - 1 };
  const my = R.y0 + ((rh - 2) >> 1);
  const at = (x: number, y: number) => (x < 0 || y < 0 || x >= w || y >= h ? WALL : cells[y * w + x]);
  const fill = (x0: number, y0: number, x1: number, y1: number, c: number) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) cells[y * w + x] = c; };
  const taken = new Uint8Array(w * h);
  /** Kept clear: the cell and the four beside it. */
  const reserve = (x: number, y: number) => { for (const [dx, dy] of [[0, 0], ...N4]) if (x + dx >= 0 && y + dy >= 0 && x + dx < w && y + dy < h) taken[(y + dy) * w + x + dx] = 1; };
  const space = (area: number) => tombSpace(site, area);
  const L: TombLevel = {
    space: space(a.id), site, style: style.id, area: a.id, role: a.role, depth: a.depth, name: a.name, w, h, cells, entry: { x: cx, y: R.y1 },
    things: [], decor: [], folk: [], flow: new Int8Array(w * h).fill(-1), exits: [], lifts: [], rooms: [R],
  };

  fill(R.x0, R.y0, R.x1, R.y1, FLOOR);
  if (a.role === "cutting") {
    // Left as the cutters dropped their tools: the corners and a few bites of the sides still rock.
    for (let y = R.y0; y <= R.y1; y++) for (let x = R.x0; x <= R.x1; x++) {
      const edge = x === R.x0 || x === R.x1 || y === R.y0 || y === R.y1, corner = (x === R.x0 || x === R.x1) && (y === R.y0 || y === R.y1);
      if (edge && Math.abs(x - cx) > 2 && Math.abs(y - my) > 2 && (corner || rng() < 0.3)) cells[y * w + x] = WALL;
    }
  }
  // Passages to the neighbouring areas, three cells wide on the axis and two to the sides.
  const ways: [Dir, number | "outside"][] = Object.entries(a.links) as [Dir, number][];
  if (a.role === "entrance") ways.push(["s", "outside"]);
  for (const [dir, to] of ways) {
    const name = to === "outside" ? style.surface : plan[to].name, target = to === "outside" ? "outside" : space(to);
    const floor = to === "outside" ? STAIR : FLOOR;
    if (dir === "n") fill(cx - 1, 0, cx + 1, R.y0 - 1, floor), L.exits.push({ x: cx - 1, y: 0, w: 3, h: 1, to: target, name, inward: 2 });
    if (dir === "s") fill(cx - 1, R.y1 + 1, cx + 1, h - 1, floor), L.exits.push({ x: cx - 1, y: h - 1, w: 3, h: 1, to: target, name, inward: 0 });
    if (dir === "w") fill(0, my, R.x0 - 1, my + 1, floor), L.exits.push({ x: 0, y: my, w: 1, h: 2, to: target, name, inward: 1 });
    if (dir === "e") fill(R.x1 + 1, my, w - 1, my + 1, floor), L.exits.push({ x: w - 1, y: my, w: 1, h: 2, to: target, name, inward: 3 });
    if (dir === "n" || dir === "s") for (const dx of [-1, 0, 1]) reserve(cx + dx, dir === "n" ? R.y0 : R.y1);
    else for (const dy of [0, 1]) reserve(dir === "w" ? R.x0 : R.x1, my + dy);
  }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (cells[y * w + x] !== WALL && (x < R.x0 || x > R.x1 || y < R.y0 || y > R.y1)) taken[y * w + x] = 1;

  // Small rooms off the sides of the main one, each through a doorway one cell wide.
  for (const dir of ["w", "e"] as const) {
    const slots: [number, number][] = [];
    if (a.links[dir] !== undefined) {
      // A wall's face stands three cells tall, so that much rock is left under one room and over the next.
      if (my - 4 - R.y0 >= 2) slots.push([R.y0, my - 4]);
      if (R.y1 - my - 5 >= 2) slots.push([my + 5, R.y1]);
    } else if (rh >= 11) slots.push([R.y0, R.y0 + 3], [R.y1 - 3, R.y1]);
    else slots.push([R.y0 + 1, Math.min(R.y1 - 1, R.y0 + 5)]);
    for (const [s0, s1] of slots) {
      if (rng() >= ANNEX[a.role]) continue;
      const deep = Math.min(s1 - s0 + 1, 3 + Math.floor(rng() * 3)), y0 = s0 + Math.floor(rng() * (s1 - s0 + 2 - deep)), wide = 3 + Math.floor(rng() * 3);
      const room: Rect = dir === "w" ? { x0: Math.max(2, R.x0 - 1 - wide), y0, x1: R.x0 - 2, y1: y0 + deep - 1 } : { x0: R.x1 + 2, y0, x1: Math.min(w - 3, R.x1 + 1 + wide), y1: y0 + deep - 1 };
      if (room.x1 - room.x0 < 2) continue;
      fill(room.x0, room.y0, room.x1, room.y1, FLOOR);
      const door = { x: dir === "w" ? R.x0 - 1 : R.x1 + 1, y: y0 + (deep >> 1) };
      cells[door.y * w + door.x] = FLOOR;
      reserve(door.x, door.y);
      L.rooms.push(room);
    }
  }

  const solid = new Set<number>();
  const block = (x: number, y: number, fw = 1, fh = 1) => { for (let j = y; j < y + fh; j++) for (let i = x; i < x + fw; i++) (taken[j * w + i] = 1), solid.add(j * w + i); };
  // The shaft down, in a well room; the rope back up, where this area was reached by one.
  if (a.down !== undefined) {
    L.pit = { x0: cx - 2, y0: R.y0 + 2, x1: cx + 1, y1: R.y0 + 4 };
    fill(L.pit.x0, L.pit.y0, L.pit.x1, L.pit.y1, PIT);
    for (let y = L.pit.y0 - 1; y <= L.pit.y1 + 1; y++) for (let x = L.pit.x0 - 1; x <= L.pit.x1 + 1; x++) taken[y * w + x] = 1;
    L.lifts.push({ x: cx, y: L.pit.y1, to: space(a.down), up: false });
  }
  if (a.up !== undefined) {
    L.lifts.push({ x: R.x0 + 1, y: R.y0, to: space(a.up), up: true });
    block(R.x0 + 1, R.y0);
    reserve(R.x0 + 1, R.y0 + 1);
  }
  // Square pillars left standing in the rock, two rows of them clear of the axis.
  if (style.plan.pillars && (a.role === "hall" || a.role === "burial")) for (const y of [R.y0 + 2, R.y1 - 2]) for (let d = 4; cx + d <= R.x1 - 1; d += 4) for (const x of [cx - d, cx + d]) {
    if (taken[y * w + x]) continue;
    L.decor.push({ type: "pillar", x, y, solid: true, v: rng() });
    block(x, y);
  }

  const loot = (f: TombFind) => {
    const out: Inventory = {};
    for (const [item, n] of Object.entries(f.loot ?? {})) {
      const count = typeof n === "number" ? n : n[0] + Math.floor(rng() * (n[1] - n[0] + 1));
      if (count > 0) out[item] = count;
    }
    return out;
  };
  const put = (f: TombFind, x: number, y: number, fw: number, fh: number) =>
    void L.things.push({ id: `${a.id}-${L.things.length}-${f.id}`, find: f.id, x, y, wall: f.on === "wall", solid: f.on === "floor" && !f.flat, art: f.art, name: f.name, loot: loot(f), w: fw, h: fh });
  // The walled-up doorway, two cells back from the room it guards.
  const seal = a.sealed && style.finds.find((f) => f.tier === "seal");
  if (seal && a.sealed) {
    const [x, y, fw, fh] = a.sealed === "s" ? [cx - 1, R.y1 + 2, 3, 1] : a.sealed === "n" ? [cx - 1, R.y0 - 2, 3, 1] : a.sealed === "w" ? [R.x0 - 2, my, 1, 2] : [R.x1 + 2, my, 1, 2];
    put(seal, x, y, fw, fh);
    block(x, y, fw, fh);
  }
  const shuffled = <T>(list: T[]) => {
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  };
  const free = (x: number, y: number, fw: number, fh: number) => {
    for (let j = y; j < y + fh; j++) for (let i = x; i < x + fw; i++) if (at(i, j) !== FLOOR || taken[j * w + i]) return false;
    return true;
  };
  const finds = a.finds.map((id) => tombFind(style, id)!).sort((p, q) => +(q.on === "wall") - +(p.on === "wall") || (q.w ?? 1) * (q.h ?? 1) - (p.w ?? 1) * (p.h ?? 1));
  for (const f of finds) {
    const fw = f.w ?? 1, fh = f.h ?? 1;
    // Good things are in the small rooms when there are any; the rest anywhere.
    const rooms = f.tier === "common" || L.rooms.length < 2 ? shuffled(L.rooms.slice()) : [...shuffled(L.rooms.slice(1)), R];
    if (f.on === "wall") {
      const spot = rooms.flatMap((r) => {
        const out: Point[] = [];
        for (let x = r.x0; x + fw - 1 <= r.x1; x++) {
          let ok = true;
          for (let i = x - 1; i <= x + fw; i++) if (at(i, r.y0 - 1) !== WALL || taken[(r.y0 - 1) * w + i] || (i >= x && i < x + fw && (at(i, r.y0) !== FLOOR || solid.has(r.y0 * w + i)))) ok = false;
          if (ok) out.push({ x, y: r.y0 - 1 });
        }
        return shuffled(out).slice(0, 1);
      })[0];
      if (!spot) continue;
      for (let i = spot.x; i < spot.x + fw; i++) (taken[spot.y * w + i] = 1), (taken[(spot.y + 1) * w + i] = 1);
      put(f, spot.x, spot.y, fw, fh);
      continue;
    }
    let spot: Point | undefined;
    if (f.tier === "prize" && fw >= 3) spot = { x: cx - (fw >> 1), y: R.y0 + ((rh - fh) >> 1) };
    else for (const r of rooms) {
      const out: Point[] = [];
      for (let y = r.y0; y + fh - 1 <= r.y1; y++) for (let x = r.x0; x + fw - 1 <= r.x1; x++)
        if ((f.flat || x === r.x0 || x + fw - 1 === r.x1 || y + fh - 1 === r.y1) && free(x, y, fw, fh)) out.push({ x, y });
      if ((spot = shuffled(out)[0])) break;
    }
    if (!spot || !free(spot.x, spot.y, fw, fh)) continue;
    put(f, spot.x, spot.y, fw, fh);
    if (f.flat) taken[spot.y * w + spot.x] = 1;
    else block(spot.x, spot.y, fw, fh);
  }

  // Fallen rock in an unfinished room; chips, dust and broken pots underfoot everywhere.
  if (a.role === "cutting") for (let n = 2 + Math.floor(rng() * 3), tries = 0; n > 0 && tries < 40; tries++) {
    const x = R.x0 + Math.floor(rng() * rw), y = R.y0 + Math.floor(rng() * rh);
    if (!free(x, y, 1, 1) || N4.every(([dx, dy]) => at(x + dx, y + dy) !== WALL)) continue;
    L.decor.push({ type: "rubble", x, y, solid: true, v: rng() });
    block(x, y);
    n--;
  }
  const litter = a.role === "cutting" ? ["chips", "chips", "dust"] : style.plan.litter;
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++)
    if (at(x, y) === FLOOR && !solid.has(y * w + x) && rng() < (a.role === "cutting" ? 0.14 : 0.05)) L.decor.push({ type: litter[Math.floor(rng() * litter.length)], x, y, solid: false, v: rng() });

  const out = L.exits.find((e) => e.to === "outside"), rope = L.lifts.find((l) => l.up);
  L.entry = out ? { x: cx, y: h - 2 } : rope ? { x: rope.x, y: rope.y + 1 } : arrivalFrom(L, L.exits[0]?.to) ?? L.entry;

  // Everything must be reachable on foot once the walled-up doorways are down.
  const reach = new Uint8Array(w * h), queue = [L.entry.y * w + L.entry.x];
  const sealed = new Set(L.things.filter((t) => tombFind(style, t.find)?.tier === "seal").flatMap((t) => Array.from({ length: (t.w ?? 1) * (t.h ?? 1) }, (_, k) => (t.y + Math.floor(k / (t.w ?? 1))) * w + t.x + (k % (t.w ?? 1)))));
  reach[queue[0]] = 1;
  for (let q = 0; q < queue.length; q++) for (const n of [queue[q] - 1, queue[q] + 1, queue[q] - w, queue[q] + w])
    if (n >= 0 && n < w * h && !reach[n] && tombWalkable(cells[n]) && (!solid.has(n) || sealed.has(n))) (reach[n] = 1), queue.push(n);
  const beside = (x: number, y: number, fw = 1, fh = 1) => {
    for (let j = y - 1; j <= y + fh; j++) for (let i = x - 1; i <= x + fw; i++) if (i >= 0 && j >= 0 && i < w && j < h && reach[j * w + i]) return true;
    return false;
  };
  if (L.exits.some((e) => !beside(e.x, e.y, e.w, e.h)) || L.lifts.some((l) => !beside(l.x, l.y))) return undefined;
  if (L.things.some((t) => (t.wall ? !reach[(t.y + 1) * w + t.x] : !beside(t.x, t.y, t.w, t.h)))) return undefined;
  L.props = L.things.map((t) => {
    t.prop = true;
    const fw = t.w ?? 1, fh = t.h ?? 1;
    return {
      key: `tomb-${t.find}`,
      sprite: `made:tomb:${style.look}:${t.art}:${t.find}:${fw}x${fh}:${(t.x * 7 + t.y * 3) % 10}${t.wall ? ":wall" : ""}`,
      x: t.x,
      y: t.y,
      name: t.name,
      ...(Object.keys(t.loot).length ? { loot: t.loot } : {}),
      ...(fw * fh > 1 ? { size: [fw, fh] as [number, number] } : {}),
    };
  });
  return L;
}

/** Cells no one can stand in: every cell of a non-prop standing find, the pillars and rubble, the foot of a rope. */
export function tombSolid(L: TombLevel) {
  const solid = new Set<number>();
  for (const t of L.things) if (t.solid && !t.prop) for (let y = t.y; y < t.y + (t.h ?? 1); y++) for (let x = t.x; x < t.x + (t.w ?? 1); x++) solid.add(y * L.w + x);
  for (const d of L.decor as AreaDecor[]) if (d.solid) solid.add(d.y * L.w + d.x);
  for (const l of L.lifts) solid.add(l.y * L.w + l.x);
  return solid;
}

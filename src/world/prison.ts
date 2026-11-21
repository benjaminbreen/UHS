import { prisonFind, type PrisonStyle } from "../content/prisons";
import { rngOf } from "../core/random";
import type { Area, AreaExit, AreaFolk, AreaThing } from "./complex";
import { BARS, FLOOR, prisonPlan, WALL, YARD, type PlanRoom, type PrisonLayout, type PrisonPlan } from "./prison-plan";

export { BARS, FLOOR, WALL, YARD, type PrisonLayout, type PrisonPlan };
export const prisonWalkable = (c: number) => c === FLOOR || c === YARD;

export type PrisonLevel = Area & {
  prison: string;
  style: string;
  layout: PrisonLayout;
  plan: PrisonPlan;
  /** Bounds of the player's starting cell on the continuous map. */
  cellBounds: PlanRoom;
};

export function layoutOf(styleId: string): PrisonLayout {
  if (styleId === "debtors-gaol") return "wards";
  if (styleId === "yamen-jail") return "yamen";
  if (styleId === "cellular-penitentiary") return "cellblock";
  return "keep";
}

export const prisonSpace = (site: string) => `prison:${site}:main`;

export function parsePrisonSpace(space: string) {
  const m = /^prison:(([a-z-]+)\.[-\d,]+):(main|cell|corridor|yard|gatehouse)$/.exec(space);
  return m ? { site: m[1], style: m[2] } : undefined;
}

export function prisonSolid(level: Pick<PrisonLevel, "things" | "w">) {
  const solid = new Set<number>();
  for (const t of level.things) {
    if (!t.solid) continue;
    for (let y = t.y; y < t.y + (t.h ?? 1); y++)
      for (let x = t.x; x < t.x + (t.w ?? 1); x++) solid.add(y * level.w + x);
  }
  return solid;
}

function makeThing(style: PrisonStyle, findId: string, id: string, x: number, y: number, w = 1, h = 1, wall?: boolean): AreaThing {
  const f = prisonFind(style, findId)!;
  return {
    id,
    find: f.id,
    x,
    y,
    w,
    h,
    wall: wall ?? !!f.wall,
    solid: !!f.solid,
    art: f.art,
    name: f.name,
    loot: { ...(f.loot ?? {}) },
  };
}

/** One continuous procedural prison dungeon built from `prisonPlan`, wired with interactive fixtures and folk. */
export function prisonLevel(seed: string, style: PrisonStyle, site: string): PrisonLevel {
  const layout = layoutOf(style.id);
  const plan = prisonPlan(`${seed}:${site}`, layout);
  const rng = rngOf(seed, "prison-pop", site);
  const space = prisonSpace(site);
  const { w, h } = plan;

  // Walkable copy of plan.cells: keep plan.cells untouched so tiles.ts draws every bar & gate,
  // while opening the player's cell gate tile so they can slip out into the gallery.
  const cells = new Uint8Array(plan.cells);

  const cellRooms = plan.rooms.filter((r) => r.kind === "cell" && plan.cells[r.y * w + r.x] === FLOOR);
  const home = cellRooms[0] ?? plan.rooms.find((r) => r.kind === "ward") ?? plan.rooms[0];

  const homeDoor = plan.features.find(
    (f) => f.type === "cell-door" && f.x >= home.x && f.x < home.x + home.w && (f.y === home.y + home.h || f.y === home.y - 1),
  );
  if (homeDoor) cells[homeDoor.y * w + homeDoor.x] = FLOOR;

  // Guarantee at least one drain grate exists (in the yard if present, otherwise a gallery) for the sewer escape.
  let drain = plan.features.find((f) => f.type === "drain");
  if (!drain) {
    const yard = plan.rooms.find((r) => r.kind === "yard") ?? plan.rooms.find((r) => r.kind === "gallery") ?? plan.rooms[0];
    drain = { type: "drain", x: yard.x + yard.w - 2, y: yard.y + yard.h - 2 };
    plan.features.push(drain);
  }

  const things: AreaThing[] = [];
  const used = new Set<string>();
  const add = (t: AreaThing) => {
    if (used.has(t.id)) return;
    used.add(t.id);
    things.push(t);
  };

  // Player's starting cell: bed, wall-crack on West wall, hidden spoon, and bucket.
  const bedId = style.order === "iron-cellblock" ? "cot" : "pallet";
  const homeBed = plan.features.find(
    (f) => (f.type === "pallet" || f.type === "cot" || f.type === "mat") && f.x >= home.x && f.x < home.x + home.w && f.y >= home.y && f.y < home.y + home.h,
  );
  if (homeBed) add(makeThing(style, bedId, "bed", homeBed.x, homeBed.y, Math.min(2, home.w), 1));
  add(makeThing(style, "loose-stone", "loose-stone", home.x, Math.min(home.y + 1, home.y + home.h - 1), 1, 1, false));
  const spoonX = home.x + home.w - 1, spoonY = home.y + home.h - 1;
  add(makeThing(style, "spoon", "spoon", spoonX, spoonY, 1, 1, false));

  // Gatehouse keys & ledger desk (guarantee keys exist on a solid north wall in gate or guardroom)
  let keys = plan.features.find((f) => f.type === "keys");
  if (!keys) {
    const host = plan.rooms.find((r) => r.kind === "gate") ?? plan.rooms.find((r) => r.kind === "guard") ?? plan.rooms[0];
    let kx = host.x + host.w - 2;
    for (let x = host.x + 1; x < host.x + host.w - 1; x++) {
      if (plan.cells[(host.y - 1) * w + x] === WALL && plan.cells[host.y * w + x] !== WALL) { kx = x; break; }
    }
    keys = { type: "keys", x: kx, y: host.y - 1, side: 0 };
    plan.features.push(keys);
  }
  add(makeThing(style, "key-rack", "key-rack", keys.x, keys.y, 1, 1, true));
  const desk = plan.features.find((f) => f.type === "desk");
  if (desk) add(makeThing(style, "ledger", "ledger", desk.x, desk.y, 2, 1));

  // Drain grate (links into the local underground sewer!)
  add(makeThing(style, "grate", "grate", drain.x, drain.y, 1, 1, false));

  // Work & rations/taproom fixtures in yard or guardroom
  const bench = plan.features.find((f) => f.type === "bench" || f.type === "stocks" || f.type === "cangue");
  if (bench) add(makeThing(style, "work-bench", "work-bench", bench.x, bench.y, 2, 1));
  const table = plan.features.find((f) => f.type === "table");
  if (table) add(makeThing(style, style.feePaying ? "taproom" : "rations", "rations", table.x, table.y, 2, 1));

  // Outer gate exit at the foot of the gatehouse
  const exits: AreaExit[] = [];
  const gateDoor = plan.features.find((f) => f.type === "door");
  if (gateDoor) {
    exits.push({ x: gateDoor.x, y: gateDoor.y - 1, w: 2, h: 1, to: "outside", name: "the outer gate", inward: 0 });
  }

  // Living folk: patrolling warders in galleries, guardroom & gatehouse; inmates in yard, wards & other cells.
  const folk: AreaFolk[] = [];
  let wn = 0, inn = 0;
  const solid = prisonSolid({ things, w });
  const spotIn = (r: PlanRoom, preferFar?: { x: number; y: number }) => {
    let best: { x: number; y: number; d: number } | undefined;
    for (let y = r.y; y < r.y + r.h; y++) {
      for (let x = r.x; x < r.x + r.w; x++) {
        if (!prisonWalkable(cells[y * w + x]) || solid.has(y * w + x)) continue;
        const d = preferFar ? Math.hypot(x - preferFar.x, y - preferFar.y) : 0;
        if (!best || d > best.d) best = { x, y, d };
      }
    }
    return best ?? { x: r.x + (r.w >> 1), y: r.y + (r.h >> 1) };
  };

  for (const r of plan.rooms) {
    if (r.kind === "gallery" || r.kind === "guard" || r.kind === "gate") {
      const p = spotIn(r, homeDoor ?? home);
      folk.push({ id: `${space}:warder-${wn++}`, person: "prison-warder", x: p.x, y: p.y, sex: "male", age: 30 + Math.floor(rng() * 18) });
    } else if (r.kind === "yard" || r.kind === "ward") {
      const p = spotIn(r);
      folk.push({
        id: `${space}:inmate-${inn++}`,
        person: inn === 1 ? "prison-veteran" : "prison-inmate",
        x: p.x,
        y: p.y,
        sex: rng() < 0.35 ? "female" : "male",
        age: 24 + Math.floor(rng() * 28),
      });
    }
  }

  // Pick a walkable entry inside the player's starting cell (clear of bed/solid props).
  let entry = { x: home.x + (home.w >> 1), y: home.y + (home.h >> 1) };
  if (solid.has(entry.y * w + entry.x) || !prisonWalkable(cells[entry.y * w + entry.x])) {
    entry = spotIn(home);
  }

  return {
    space,
    name: style.name,
    prison: site,
    style: style.id,
    layout,
    plan,
    cellBounds: home,
    depth: 0,
    w,
    h,
    cells,
    flow: new Int8Array(w * h).fill(-1),
    entry,
    exits,
    lifts: [],
    things,
    decor: [],
    folk,
  };
}

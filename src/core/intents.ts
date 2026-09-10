import type { Engine } from "./engine";
import { statsOf } from "./stats";
import {
  forageByCover,
  forageByTerrain,
  lookSprites,
} from "../content/ecology/forage";
import { distance, type Intent, type ItemDef, type ItemId } from "./types";
const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));
export const MAX_INTENTS = 6;
export const LEDGER_SIZE = 12;
export const TRAVEL_LIMIT = 1500;
export const TIRED = 80;
/** Rejections that must be known before anything mutates. */
export function validateIntents(engine: Engine, intents: Intent[]) {
  if (intents.length > MAX_INTENTS) return "Too many things at once.";
  const p = engine.state.player;
  for (const i of intents)
    if (i.type === "invent")
      for (const c of i.consumes ?? [])
        if ((p.inventory[c.item] ?? 0) < c.quantity)
          return `You do not have ${engine.item(c.item)?.name.toLowerCase() ?? c.item}.`;
}
/** Runs every intent in order and returns one outcome line per intent, so
 * the caller can tell the narrator what actually happened. */
export function resolveIntents(engine: Engine, intents: Intent[]): string[] {
  return intents.map((i) => {
    switch (i.type) {
      case "attempt":
        return attempt(engine, i);
      case "forage":
        return forage(engine, i.item);
      case "invent":
        return invent(engine, i);
      case "pass": {
        const minutes = clamp(Math.round(i.minutes), 1, 1440);
        engine.advance(minutes * 60);
        return `${minutes} minutes pass.`;
      }
      case "travel":
        return travel(engine, i.direction);
      case "regard":
        return regard(engine, clamp(Math.round(i.delta), -3, 3), i.reason);
      case "fact": {
        const s = engine.state;
        s.ledger = [...(s.ledger ?? []), i.text.slice(0, 160)].slice(
          -LEDGER_SIZE,
        );
        return "Noted.";
      }
    }
  });
}
function attempt(engine: Engine, i: Extract<Intent, { type: "attempt" }>) {
  const p = engine.state.player,
    stat = statsOf(engine.state.manifest.seed, p)[i.check],
    difficulty = clamp(Math.round(i.difficulty), 1, 5);
  const chance = clamp(
    0.5 + (stat - 50) / 100 - p.fatigue / 250 - (difficulty - 3) * 0.15,
    0.05,
    0.95,
  );
  const ok = engine.rng("attempt") < chance;
  p.fatigue = Math.min(100, p.fatigue + (ok ? 3 : 6));
  engine.advance(clamp(Math.round(i.minutes ?? 2), 1, 120) * 60);
  engine.event(ok ? i.success : i.failure);
  return `${i.check} check (${difficulty}/5): ${ok ? "success" : "failure"}.`;
}
function forage(engine: Engine, wanted?: ItemId) {
  const p = engine.state.player;
  const table = new Map<ItemId, number>();
  const add = (rows: [ItemId, number][]) =>
    rows.forEach(([id, w]) => table.set(id, (table.get(id) ?? 0) + w));
  if (p.pos.space === "outside") {
    const cover: string[] = [];
    for (let dy = -2; dy <= 2; dy++)
      for (let dx = -2; dx <= 2; dx++) {
        const x = p.pos.x + dx,
          y = p.pos.y + dy;
        // Underfoot counts double; the ring around counts once; the outer
        // ring only for water, which is reachable from the bank.
        const ring = Math.max(Math.abs(dx), Math.abs(dy)),
          terrain = engine.world.terrain(x, y),
          rows = forageByTerrain[terrain] ?? [];
        if (ring === 0) add(rows.map(([id, w]) => [id, w * 2]));
        else if (ring === 1 || terrain === "water") add(rows);
        const d = engine.world.decoration(x, y);
        if (d) cover.push(d.sprite);
      }
    for (const o of engine.state.objects)
      if (o.kind === "tree" && distance(o.pos, p.pos) <= 2.5)
        cover.push(o.sprite);
    for (const [pattern, rows] of forageByCover)
      if (cover.some((s) => pattern.test(s))) add(rows);
  }
  if (!table.size) {
    engine.event("There is nothing to gather here.");
    return "Nothing to forage here.";
  }
  let found = wanted && table.has(wanted) ? wanted : undefined;
  if (!found) {
    let roll =
      engine.rng("forage") * [...table.values()].reduce((a, b) => a + b, 0);
    for (const [id, w] of table) {
      roll -= w;
      if (roll <= 0) {
        found = id;
        break;
      }
    }
  }
  const id = found!;
  p.inventory[id] = (p.inventory[id] ?? 0) + 1;
  p.fatigue = Math.min(100, p.fatigue + 1);
  engine.advance(300);
  const name = engine.item(id)!.name.toLowerCase();
  engine.event(`You gather ${name}.`);
  return `Found ${name}.`;
}
const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 30);
function invent(engine: Engine, i: Extract<Intent, { type: "invent" }>) {
  const s = engine.state,
    p = s.player;
  const consumes = i.consumes ?? [];
  const ceiling =
    Math.max(0, ...consumes.map((c) => engine.item(c.item)?.value ?? 0)) + 2;
  for (const c of consumes)
    p.inventory[c.item] = (p.inventory[c.item] ?? 0) - c.quantity;
  const id = "x-" + (slug(i.item.name) || "thing");
  s.catalog ??= {};
  const def: ItemDef = s.catalog[id] ?? {
    id,
    name: i.item.name.slice(0, 40),
    description: i.item.description.slice(0, 160),
    sprite: lookSprites[i.item.look] ?? "rock",
    value: clamp(Math.round(i.item.value), 0, ceiling),
    ...(i.item.edible
      ? { edible: clamp(Math.round(i.item.edible), 0, 30) }
      : {}),
    ...(i.item.health
      ? { health: clamp(Math.round(i.item.health), -40, 20) }
      : {}),
    ...(i.item.flammable ? { flammable: true } : {}),
    ...(i.item.floats ? { floats: true } : {}),
  };
  s.catalog[id] = def;
  p.inventory[id] = (p.inventory[id] ?? 0) + 1;
  engine.advance(120);
  engine.event(`You now have ${def.name.toLowerCase()}.`);
  return `Made ${def.name.toLowerCase()} (value ${def.value}).`;
}
function travel(
  engine: Engine,
  direction: "north" | "south" | "east" | "west",
) {
  const p = engine.state.player;
  const [dx, dy] = {
    north: [0, -1],
    south: [0, 1],
    east: [1, 0],
    west: [-1, 0],
  }[direction];
  let steps = 0,
    why = "you can go no further";
  while (steps < TRAVEL_LIMIT) {
    if (p.fatigue >= TIRED) {
      why = "you are too tired to go on";
      break;
    }
    const command = { type: "move" as const, dx, dy };
    if (engine.validate(command)) {
      why = "the way is blocked";
      break;
    }
    engine.execute(command);
    p.fatigue = Math.min(100, p.fatigue + 0.03);
    steps++;
  }
  engine.event(
    steps
      ? `You walk ${steps} paces ${direction} until ${why}.`
      : `You cannot go ${direction}: ${why}.`,
  );
  return `Walked ${steps} paces ${direction}; stopped because ${why}.`;
}
function regard(engine: Engine, delta: number, reason: string) {
  const s = engine.state,
    p = s.player;
  const witnesses = s.actors.filter(
    (a) =>
      a.kind === "human" &&
      distance(a.pos, p.pos) < 7 &&
      engine.visibleFrom(a.pos, p.pos),
  );
  for (const w of witnesses) {
    w.trust += delta;
    w.memories.push(
      `regard:${delta > 0 ? "+" : ""}${delta}:${reason.slice(0, 80)}`,
    );
    if (w.memories.length > 40) w.memories.shift();
  }
  if (witnesses.length && delta)
    engine.event(
      `${witnesses.map((w) => w.name).join(", ")} ${witnesses.length > 1 ? "take" : "takes"} note.`,
      "social",
    );
  return `${witnesses.length} witnesses, regard ${delta > 0 ? "+" : ""}${delta}.`;
}

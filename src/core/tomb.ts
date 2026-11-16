import { caveLight, caveLightFor } from "../content/caves";
import { tombFind, tombStyle, type TombStyle } from "../content/tombs";
import { exitAt } from "../world/complex";
import { parseTombSpace, tombLevel, tombSolid, tombSpace, tombWalkable, type TombLevel } from "../world/tomb";
import { areaTarget, arriveIn, burnLight, cachedArea, complexRecord, takeFind, type ComplexHost } from "./complex";
import { folkDeal, folkTime } from "./tunnel-folk";
import type { Inspection, Inventory, Point } from "./types";

/** A trip into a tomb: which one, its first area, the cell outside to come back to, and the light carried. */
export type TombRun = {
  kind: "tomb";
  site: string;
  name: string;
  entry: string;
  out: Point;
  light: string;
  /** Game seconds of light left. */
  left: number;
  low?: boolean;
  took?: { at: Point; items: Inventory; clock: number };
};

const runOf = (h: ComplexHost) => (h.state.complex?.kind === "tomb" ? h.state.complex : undefined);
const record = (h: ComplexHost, site: string) => complexRecord(h.state, `tomb:${site}`);

export function tombLevelOf(h: ComplexHost, space: string) {
  const at = parseTombSpace(space), style = at && tombStyle(at.style);
  if (!style) return undefined;
  return cachedArea(h, space, () => tombLevel(h.state.manifest.seed, style, at.site, at.area), (level) => {
    const solid = tombSolid(level), done = new Set(h.state.complexes?.[`tomb:${at.site}`]?.done);
    // What was carried off or pulled down no longer stands in the way.
    for (const t of level.things) if (t.solid && done.has(t.id) && !tombFind(style, t.find)?.keeps)
      for (let y = t.y; y < t.y + (t.h ?? 1); y++) for (let x = t.x; x < t.x + (t.w ?? 1); x++) solid.delete(y * level.w + x);
    return solid;
  });
}

export function tombGround(h: ComplexHost, space: string, x: number, y: number) {
  const c = tombLevelOf(h, space);
  if (!c) return undefined;
  const { level, solid } = c;
  if (x < 0 || y < 0 || x >= level.w || y >= level.h) return true;
  return !tombWalkable(level.cells[y * level.w + x]) || solid.has(y * level.w + x);
}

function arrive(h: ComplexHost, space: string, from?: string) {
  const level = tombLevelOf(h, space)?.level;
  if (!level) return undefined;
  const rec = record(h, level.site), first = !rec.seen?.includes(space);
  arriveIn(h, level, `tomb:${level.site}`, from);
  rec.deepest = Math.max(rec.deepest, level.depth);
  return { level, first };
}

/** In by the stair, lamp lit. `n` picks which tomb of its kind in this world. */
export function tombEnter(h: ComplexHost, style: TombStyle, n = 0) {
  const p = h.state.player, site = `${style.id}.${n}`;
  const light = caveLightFor(h.world.pack.setting?.year ?? 0);
  h.state.complex = { kind: "tomb", site, name: style.name, entry: tombSpace(site, 0), out: { x: p.pos.x, y: p.pos.y }, light: light.id, left: light.burns };
  if (!arrive(h, tombSpace(site, 0))) return void delete h.state.complex;
  p.direction = 0;
  h.advance(60);
  h.event(`${light.lit} ${style.enter}`, "world");
}

function leave(h: ComplexHost) {
  const run = runOf(h)!, p = h.state.player;
  for (const a of [...h.state.actors]) if (a.underground) h.folk.part(a.id);
  p.pos = { ...run.out, space: "outside" };
  p.direction = 2;
  delete h.state.complex;
  h.event("You climb the stair into the heat and the light.");
}

const here = (h: ComplexHost) => (runOf(h) ? tombLevelOf(h, h.state.player.pos.space) : undefined);
const styleOf = (level: TombLevel) => tombStyle(level.style)!;

export function tombInspect(h: ComplexHost, id: string): Inspection | undefined {
  const c = here(h), run = runOf(h);
  if (!c || !run) return undefined;
  const { level } = c;
  const act = (label: string, enabled = true, reason?: string) => ({ label, enabled, reason, command: { type: "interact" as const, target: id, action: "complex" as const } });
  const lift = /^tomb-lift:(\d+)$/.exec(id), l = lift && level.lifts[Number(lift[1])];
  if (lift)
    return l ? {
      id, name: l.up ? "Rope up" : "Shaft", kind: "place", pos: { x: l.x, y: l.y, space: level.space },
      description: l.up ? "The rope you came down, hanging against the rock." : "A square shaft cut straight down through the floor, deeper than your light reaches. It was dug to stop robbers and to catch flood water.",
      affordances: [act(l.up ? "Climb the rope" : "Climb down the shaft", l.up || run.left > 0, "Not without a light")],
    } : undefined;
  const thing = level.things.find((t) => `tomb-thing:${t.id}` === id), f = thing && tombFind(styleOf(level), thing.find);
  if (!thing || !f) return undefined;
  const done = record(h, level.site).done.includes(thing.id);
  return {
    id, name: thing.name, kind: "object", pos: { x: thing.x, y: thing.wall ? thing.y + 1 : thing.y, space: level.space },
    description: done && (f.loot || f.fuel) ? "You have already been through this." : f.look,
    affordances: done && (f.loot || f.fuel || f.tier === "seal") ? [] : [act(f.verb)],
  };
}

export function tombVerb(h: ComplexHost) {
  const c = here(h);
  if (!c) return undefined;
  const done = new Set(record(h, c.level.site).done), style = styleOf(c.level);
  const id = areaTarget(h.state.player, c.level, "tomb", (t) => done.has(t.id) && !tombFind(style, t.find)?.keeps);
  const offer = id ? tombInspect(h, id)?.affordances[0] : undefined;
  return offer?.enabled ? { label: offer.label, target: id! } : undefined;
}

export function tombAct(h: ComplexHost, id: string) {
  const c = here(h), run = runOf(h);
  if (!c || !run) return;
  if (id.startsWith("folk-")) return void folkDeal(h.folk, id);
  const { level } = c;
  const lift = /^tomb-lift:(\d+)$/.exec(id), l = lift && level.lifts[Number(lift[1])];
  if (l) {
    if (!l.up && run.left <= 0) return void h.event("You will not go down that in the dark.");
    h.advance(l.up ? 240 : 180);
    const next = arrive(h, l.to, level.space);
    if (next) h.event(l.up ? `You haul yourself up the rope to ${next.level.name}.` : next.first ? `You tie off your rope and go down hand over hand into ${next.level.name}.` : `You go down the rope to ${next.level.name}.`);
    return;
  }
  const thing = level.things.find((t) => `tomb-thing:${t.id}` === id), f = thing && tombFind(styleOf(level), thing.find);
  if (!thing || !f) return;
  takeFind(h, run, c, thing, f, record(h, level.site).done, {
    refuel: (fuel) => void ((run.left = Math.min(caveLight(run.light).burns * 1.5, run.left + fuel)), (run.low = false)),
  });
}

/** Walking through a doorway into the next area; the lamp burning down. */
export function tombTime(h: ComplexHost, elapsed: number) {
  const run = runOf(h), p = h.state.player;
  if (!run) return;
  const c = tombLevelOf(h, p.pos.space);
  if (!c) {
    if (p.pos.space === "outside" || !parseTombSpace(p.pos.space)) delete h.state.complex;
    return;
  }
  const exit = exitAt(c.level, p.pos.x, p.pos.y);
  if (exit?.to === "outside") return leave(h);
  if (exit) {
    const next = arrive(h, exit.to, c.level.space);
    if (next) h.event(next.first ? `${next.level.name[0].toUpperCase()}${next.level.name.slice(1)}. Yours is the first light in here for a long time.` : `${next.level.name[0].toUpperCase()}${next.level.name.slice(1)}.`, "action");
    return;
  }
  burnLight(h, run, elapsed, c.level.role === "entrance" ? "" : "The dark is complete. You will have to feel your way back to the stair.", (flame) => (flame ? "Your lamp is burning low. It is time to think about the way back." : "Your light is going yellow. The batteries will not last much longer."));
  folkTime(h.folk, c.level.space, (x, y) => !tombGround(h, c.level.space, x, y));
}

import { caveDenners, caveLight, caveLightFor, caveSnakes, type CaveKind } from "../content/caves";
import { faunaCombat, faunaProfile } from "../content/fauna";
import { rockAt, type Rock } from "../content/geography/rock";
import { caveAt } from "../render/edge-faces";
import { caveLevel, caveLevels, caveSolid, caveSpace, parseCaveSpace, DEEP, MOUTH, WALL, type CaveLevel, type CaveSite } from "../world/cave";
import { cavePeople } from "../content/caves/people";
import { personFits } from "../content/sewers";
import { folkArrive, folkDeal, folkTime } from "./tunnel-folk";
import { burnLight, complexRecord, nearest, stockArea, type ComplexHost } from "./complex";
import type { Snapshot as GameState, Inspection, Inventory, Point, WorldModel } from "./types";
import { landing } from "../world/complex";

export type CaveBeast = {
  id: string;
  species: string;
  x: number;
  y: number;
  hp: number;
  mood: "asleep" | "wary" | "hunting" | "fled";
  home: Point;
  /** Clock at which it next acts. */
  next: number;
  /** 0 N, 1 E, 2 S, 3 W. */
  dir: number;
  /** Clock of the last blow it took or gave, for the renderer's flash. */
  hit?: number;
  bit?: number;
};
/** The trip underground the player is on. */
export type CaveRun = {
  kind: "cave";
  cave: string;
  /** The cell outside to come back out on. */
  mouth: Point;
  light: string;
  /** Game seconds of light left. */
  left: number;
  beasts: CaveBeast[];
  /** Roosts already put up on this level. */
  roused: string[];
  low?: boolean;
  /** What was last taken, and where, for the scene's loot burst. */
  took?: { at: Point; items: Inventory; clock: number };
};
const rockOf = (world: WorldModel, x: number, y: number): Rock | "earth" => {
  const cell = world.topography?.(x, y);
  const eco = cell?.habitat?.ecology;
  return eco === "wetland" ? "earth" : (cell?.rock ?? rockAt(undefined, undefined, eco ?? "grassland", cell?.habitat?.colorway));
};

function caveFoot(rock: Rock | "earth", x: number, y: number) {
  const spot = caveAt(rock, x * 16 + 8, y * 16 - 1);
  return spot && Math.floor(spot.cx / 16) === x ? spot : undefined;
}

/** The cave mouth whose foot is this cell, if the cliff above it has one.
 * Mirrors the face painter in `terrain-contours`, cell by cell. */
export function caveMouthAt(world: WorldModel, x: number, y: number) {
  const topo = world.topography;
  if (!topo) return undefined;
  const up = topo(x, y - 1), low = topo(x, y);
  if (!up || !low || up.height <= low.height || up.ramp || low.ramp) return undefined;
  if (up.edge || up.feature === "paving" || up.surface === "sand" || up.surface === "snow" || up.surface === "water" || low.surface === "water") return undefined;
  const rock = rockOf(world, x, y - 1);
  const spot = caveFoot(rock, x, y);
  if (!spot) return undefined;
  for (const px of [spot.cx - spot.hw - 3, spot.cx + spot.hw + 3]) {
    const tx = Math.floor(px / 16);
    if (topo(tx, y - 1)?.height !== up.height || topo(tx, y)?.height !== low.height) return undefined;
  }
  return { x, y, rock: rock as Rock };
}

/** Mouths within `r` cells, nearest first. */
export function* caveMouthsNear(world: WorldModel, at: Point, r: number) {
  if (!world.topography) return;
  const half = (world.pack.setting?.playableMap?.size ?? Infinity) / 2;
  const candidates: Point[] = [];
  for (let y = Math.max(at.y - r, -half); y <= Math.min(at.y + r, half - 1); y++)
    for (let x = Math.max(at.x - r, -half); x <= Math.min(at.x + r, half - 1); x++)
      // Limestone has the highest odds, so its candidates cover all rock types.
      if (caveFoot("limestone", x, y)) candidates.push({ x, y });
  candidates.sort((a, b) => Math.hypot(a.x - at.x, a.y - at.y) - Math.hypot(b.x - at.x, b.y - at.y));
  for (const { x, y } of candidates) {
    const m = caveMouthAt(world, x, y);
    if (m) yield m;
  }
}

function siteOf(h: ComplexHost, id: string): CaveSite | undefined {
  const known = h.caveSites.get(id);
  if (known !== undefined) return known ?? undefined;
  const [x, y] = id.split(",").map(Number);
  const mouth = caveMouthAt(h.world, x, y);
  const setting = h.world.geography?.packAt(x, y)?.setting ?? h.world.pack.setting;
  if (!mouth || !setting) {
    h.caveSites.set(id, null);
    return undefined;
  }
  const eco = h.world.topography?.(x, y - 1)?.habitat;
  let sea = false;
  // Only a mouth the tide can reach.
  for (let dy = 0; dy <= 4 && !sea; dy++) for (let dx = -3; dx <= 3 && !sea; dx++) {
    const c = h.world.topography?.(x + dx, y + dy);
    sea = c?.surface === "water" && c.waterVisual?.kind === "sea";
  }
  const kind: CaveKind =
    eco?.ecology === "tundra" || eco?.colorway === "polar" || eco?.colorway === "alpine" ? "ice"
    : sea ? "sea"
    : mouth.rock === "limestone" || mouth.rock === "chalk" ? "karst"
    : mouth.rock === "basalt" ? "lava"
    : mouth.rock === "granite" || mouth.rock === "shale" ? "fissure"
    : "sandstone";
  const seed = h.state.manifest.seed;
  const site: CaveSite = {
    id, kind, levels: caveLevels(seed, id, kind),
    place: { lon: setting.lon, lat: setting.lat, year: setting.year },
    denners: caveDenners(setting),
    snakes: caveSnakes(setting, kind),
    people: cavePeople.filter((p) => personFits(p, setting, kind)),
  };
  h.caveSites.set(id, site);
  return site;
}

export function caveLevelOf(h: ComplexHost, space: string) {
  const known = h.caveLevels.get(space);
  if (known) return known;
  const at = parseCaveSpace(space);
  const site = at && siteOf(h, at.cave);
  if (!at || !site || at.depth < 1 || at.depth > site.levels) return undefined;
  const level = caveLevel(h.state.manifest.seed, site, at.depth);
  const entry = { level, solid: caveSolid(level) };
  h.caveLevels.set(space, entry);
  return entry;
}

/** Rock, deep water, columns and whatever big thing still lies there. */
export function caveGround(h: ComplexHost, space: string, x: number, y: number) {
  const c = caveLevelOf(h, space);
  if (!c) return undefined;
  const { level, solid } = c;
  if (x < 0 || y < 0 || x >= level.w || y >= level.h) return true;
  const cell = level.cells[y * level.w + x];
  return cell === WALL || cell === DEEP || solid.has(y * level.w + x);
}

export const caveBeastAt = (state: GameState, space: string, x: number, y: number) =>
  runOf(state) && state.player.pos.space === space ? runOf(state)!.beasts.find((b) => b.x === x && b.y === y && b.mood !== "fled" && b.species !== "bats") : undefined;

const beastName = (species: string) => (species === "snake" ? "snake" : (faunaProfile(species)?.label ?? species).toLowerCase());

function populate(h: ComplexHost, level: CaveLevel) {
  folkArrive(h.folk, level.space, level.folk);
  const run = runOf(h.state)!;
  const slain = new Set(h.state.complexes?.[`cave:${run.cave}`]?.slain);
  run.roused = [];
  run.beasts = level.dwellers.filter((d) => !slain.has(d.id)).map((d) => {
    const profile = faunaProfile(d.species);
    return {
      id: d.id, species: d.species, x: d.x, y: d.y, home: { x: d.x, y: d.y }, next: 0, dir: 2,
      hp: profile ? faunaCombat(profile).hp : d.species === "snake" ? 3 : 1,
      mood: "asleep" as const,
    };
  });
}

const record = (h: ComplexHost, cave: string) => complexRecord(h.state, `cave:${cave}`);
const runOf = (s: GameState) => (s.complex?.kind === "cave" ? s.complex : undefined);

function arrive(h: ComplexHost, depth: number, at: "entry" | "down") {
  const run = runOf(h.state)!, p = h.state.player;
  const c = caveLevelOf(h, caveSpace(run.cave, depth));
  if (!c) return false;
  const { level } = c;
  let spot: Point = level.entry;
  if (at === "down" && level.down) {
    spot = landing(level.down, (x, y) => caveGround(h, level.space, x, y), level.entry);
  }
  p.pos = { ...spot, space: level.space };
  p.direction = at === "entry" && depth === 1 ? 0 : 2;
  const rec = record(h, run.cave);
  const first = depth > rec.deepest;
  rec.deepest = Math.max(rec.deepest, depth);
  stockArea(h, level, `cave:${run.cave}`);
  populate(h, level);
  return first;
}

function leave(h: ComplexHost) {
  const run = runOf(h.state);
  if (!run) return;
  const p = h.state.player;
  p.pos = { ...run.mouth, space: "outside" };
  p.direction = 2;
  delete h.state.complex;
  for (const a of [...h.state.actors]) if (a.underground) h.folk.part(a.id);
  h.event("You come out into the open air, blinking.");
}

/** What the player could use right now: the nearest way in/up/down in reach, facing first. */
export function caveTargetNear(h: ComplexHost): string | undefined {
  const p = h.state.player;
  if (p.pos.space === "outside") {
    const m = caveMouthAt(h.world, p.pos.x, p.pos.y);
    return m ? `cave-mouth:${m.x},${m.y}` : undefined;
  }
  const c = runOf(h.state) && caveLevelOf(h, p.pos.space);
  if (!c) return undefined;
  const { level } = c;
  const reach = (q: Point) => Math.max(Math.abs(q.x - p.pos.x), Math.abs(q.y - p.pos.y)) <= 1;
  const options: [Point, string, number?][] = [];
  if (level.down && reach(level.down)) options.push([level.down, "cave-down"]);
  if (level.up && reach({ x: level.up.x, y: level.up.y + 1 })) options.push([level.up, "cave-up"]);
  return nearest(p, options);
}

export function caveInspect(h: ComplexHost, id: string): Inspection | undefined {
  const p = h.state.player;
  const act = (label: string, enabled = true, reason?: string) => [{ label, enabled, reason, command: { type: "interact" as const, target: id, action: "complex" as const } }];
  const mouth = /^cave-mouth:(-?\d+),(-?\d+)$/.exec(id);
  if (mouth) {
    const x = Number(mouth[1]), y = Number(mouth[2]);
    const site = siteOf(h, `${x},${y}`);
    if (!site) return undefined;
    const rec = h.state.complexes?.[`cave:${site.id}`];
    const here = p.pos.space === "outside" && p.pos.x === x && p.pos.y === y;
    return {
      id, name: "Cave mouth", kind: "place", pos: { x, y, space: "outside" },
      description: rec ? `A cave you have been into. You got ${rec.deepest > 1 ? `${rec.deepest} levels down` : "no further than the mouth"}.` : "A dark opening in the rock, with a worn floor. Cold air comes out of it.",
      affordances: act("Enter the cave", here, "Stand in the mouth"),
    };
  }
  const c = runOf(h.state) && caveLevelOf(h, p.pos.space);
  if (!c) return undefined;
  const { level } = c;
  const lit = runOf(h.state)!.left > 0;
  if (id === "cave-down" && level.down)
    return {
      id, name: "Way down", kind: "place", pos: { ...level.down, space: level.space },
      description: "A hole dropping into the dark. Cold air rises from it.",
      affordances: act("Climb down", lit, "Not without a light"),
    };
  if (id === "cave-up" && level.up)
    return {
      id, name: "Way up", kind: "place", pos: { x: level.up.x, y: level.up.y + 1, space: level.space },
      description: "The climb back to the level above.",
      affordances: act("Climb up"),
    };
  return undefined;
}

/** The label for the key, without building a whole inspection. */
export function caveVerb(h: ComplexHost) {
  const id = caveTargetNear(h);
  const offer = id ? caveInspect(h, id)?.affordances[0] : undefined;
  return offer?.enabled ? { label: offer.label, target: id! } : undefined;
}

export function caveAct(h: ComplexHost, id: string) {
  const p = h.state.player;
  const mouth = /^cave-mouth:(-?\d+),(-?\d+)$/.exec(id);
  if (mouth) {
    const cave = `${mouth[1]},${mouth[2]}`;
    const site = siteOf(h, cave);
    if (!site) return;
    const light = caveLightFor(site.place.year);
    h.state.complex = { kind: "cave", cave, mouth: { x: Number(mouth[1]), y: Number(mouth[2]) }, light: light.id, left: light.burns, beasts: [], roused: [] };
    arrive(h, 1, "entry");
    h.advance(30);
    h.event(`${light.lit} The cave takes you in.`);
    return;
  }
  const run = runOf(h.state), c = run && caveLevelOf(h, p.pos.space);
  if (!run || !c) return;
  const { level } = c;
  if (id.startsWith("folk-")) return void folkDeal(h.folk, id);
  if (id === "cave-down") {
    const first = arrive(h, level.depth + 1, "entry");
    h.advance(90);
    const next = caveLevelOf(h, p.pos.space)?.level;
    h.event(first ? `You climb down into ${next?.name ?? "the dark"}. Nobody has been here in a long time.` : `You climb down to ${next?.name ?? "the next level"}.`);
    return;
  }
  if (id === "cave-up") {
    arrive(h, level.depth - 1, "down");
    h.advance(90);
    h.event("You haul yourself back up to the level above.");
  }
}

/** A blow landing on a cave cell. True when something was there to take it. */
export function caveStrike(h: ComplexHost, at: Point, damage: number) {
  const run = runOf(h.state), p = h.state.player;
  const b = run && caveBeastAt(h.state, p.pos.space, at.x, at.y);
  if (!run || !b) return false;
  b.hp -= damage;
  b.hit = h.state.clock;
  const name = beastName(b.species);
  if (b.hp <= 0) {
    run.beasts = run.beasts.filter((o) => o !== b);
    record(h, run.cave).slain.push(b.id);
    const profile = faunaProfile(b.species);
    const yields = profile ? faunaCombat(profile).yields : {};
    for (const [item, n] of Object.entries(yields)) p.inventory[item] = (p.inventory[item] ?? 0) + n;
    if (Object.keys(yields).length) run.took = { at: { x: b.x, y: b.y }, items: { ...yields }, clock: h.state.clock };
    h.event(profile ? `The ${name} goes down and does not get up. You butcher what you can carry.` : `You kill the ${name}.`);
  } else if (b.species !== "snake") {
    const profile = faunaProfile(b.species);
    const full = profile ? faunaCombat(profile).hp : 1;
    if (b.hp < full * 0.3 && b.mood !== "fled") {
      b.mood = "fled";
      h.event(`The ${name} has had enough. It breaks past you and is gone.`);
    } else if (b.mood !== "hunting") {
      b.mood = "hunting";
      h.event(`The ${name} wakes with a roar.`);
    }
  }
  return true;
}

const cheb = (a: Point, b: Point) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));

/** One step along the shortest way from a beast to a goal, over open floor. */
function stepToward(h: ComplexHost, level: CaveLevel, from: Point, goal: Point, away = false): Point | undefined {
  const { w, h: hh } = level;
  const dist = new Int16Array(w * hh).fill(-1);
  const queue = [goal.y * w + goal.x];
  dist[queue[0]] = 0;
  for (let q = 0; q < queue.length && queue.length < 1600; q++) {
    const cur = queue[q], cx = cur % w, cy = (cur - cx) / w;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const x = cx + dx, y = cy + dy, i = y * w + x;
      if (dist[i] >= 0 || caveGround(h, level.space, x, y)) continue;
      dist[i] = dist[cur] + 1;
      queue.push(i);
    }
  }
  let best: Point | undefined, score = away ? -1 : 1e9;
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const x = from.x + dx, y = from.y + dy, d = dist[y * w + x];
    if (d < 0 || caveBeastAt(h.state, level.space, x, y)) continue;
    if (x === h.state.player.pos.x && y === h.state.player.pos.y) continue;
    if (away ? d > score : d < score) (score = d), (best = { x, y });
  }
  return best;
}

/** Time passing underground: the light burns, and whatever lives here acts. */
export function caveTime(h: ComplexHost, elapsed: number) {
  const run = runOf(h.state), p = h.state.player;
  if (!run) return;
  const c = caveLevelOf(h, p.pos.space);
  if (!c) {
    // Carried out some other way: asleep, rescued, dead.
    if (p.pos.space === "outside" || !parseCaveSpace(p.pos.space)) {
      for (const a of [...h.state.actors]) if (a.underground) h.folk.part(a.id);
      delete h.state.complex;
    }
    return;
  }
  const { level } = c;
  if (level.cells[p.pos.y * level.w + p.pos.x] === MOUTH && p.pos.y >= level.h - 1) return leave(h);
  const light = caveLight(run.light);
  const daylight = level.depth === 1 && Math.hypot(p.pos.x - level.entry.x, p.pos.y - level.entry.y) < 5;
  burnLight(h, run, elapsed, daylight ? "" : "The dark is complete. You will have to feel your way back.", (flame) => (flame ? "Your light is burning low. It is time to think about the way back." : "Your light is going yellow. The batteries will not last much longer."));
  const clock = h.state.clock;
  const me = { x: p.pos.x, y: p.pos.y };
  for (const b of [...run.beasts]) {
    const d = cheb(b, me), name = beastName(b.species);
    if (b.species === "bats") {
      if (d <= 2 && !run.roused.includes(b.id)) {
        run.roused.push(b.id);
        const gutter = light.flame && run.left > 0;
        if (gutter) run.left = Math.max(1, run.left - 150);
        h.event(gutter ? "Bats pour off the roof and round your head. Your flame streams sideways and nearly goes out." : "Bats pour off the roof and round your head, and are gone.");
      }
      continue;
    }
    if (clock < b.next) continue;
    if (b.species === "snake") {
      b.next = clock + 2;
      if (d <= 1 && clock - (b.bit ?? -99) > 30) {
        b.bit = clock;
        h.hurt(12, "a snakebite", "bite");
        h.event(run.left > 0 ? "A snake lying along the wall strikes your leg before you see it move." : "Something strikes your leg in the dark. A snake.");
        b.mood = "fled";
      }
      continue;
    }
    const profile = faunaProfile(b.species);
    const combat = profile && faunaCombat(profile);
    const timid = !combat?.damage;
    if (b.mood === "asleep") {
      b.next = clock + 2;
      if (d <= (run.left > 0 ? 3 : 2)) {
        b.mood = timid ? "fled" : "wary";
        b.next = clock + 6;
        h.event(timid ? `A ${name} bolts out of its bed and away into the dark.` : `Something big shifts ahead of you. A ${name} is lying up here, and it has lifted its head.`);
      }
    } else if (b.mood === "wary") {
      if (d > 6) (b.mood = "asleep"), (b.next = clock + 2);
      else {
        b.mood = "hunting";
        b.next = clock + 1;
        h.event(`The ${name} comes at you.`);
      }
    } else if (b.mood === "fled") {
      const to = stepToward(h, level, b, me, true);
      if (to) (b.dir = to.x > b.x ? 1 : to.x < b.x ? 3 : to.y > b.y ? 2 : 0), (b.x = to.x), (b.y = to.y);
      b.next = clock + 1;
      if (d > 9) run.beasts = run.beasts.filter((o) => o !== b);
    } else {
      b.next = clock + 1.5;
      if (d > 13) {
        b.mood = "asleep";
        b.x = b.home.x;
        b.y = b.home.y;
        continue;
      }
      if (Math.abs(b.x - me.x) + Math.abs(b.y - me.y) <= 1) {
        if (clock - (b.bit ?? -99) >= 4) {
          b.bit = clock;
          b.dir = me.x > b.x ? 1 : me.x < b.x ? 3 : me.y > b.y ? 2 : 0;
          h.hurt(combat?.damage ?? 8, `a ${name}`, "bite");
          h.event(`The ${name} gets hold of you.`);
        }
        continue;
      }
      // Fire holds an animal off for a while; it will not hold it off for ever.
      if (light.flame && run.left > 0 && d === 2 && (clock * 7 + b.x) % 5 < 3) continue;
      const to = stepToward(h, level, b, me);
      if (to) (b.dir = to.x > b.x ? 1 : to.x < b.x ? 3 : to.y > b.y ? 2 : 0), (b.x = to.x), (b.y = to.y);
    }
  }
  folkTime(h.folk, level.space, (x, y) => !caveGround(h, level.space, x, y));
}

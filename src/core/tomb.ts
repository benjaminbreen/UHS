import { caveLightFor } from "../content/caves";
import { catacombKindAt } from "../content/catacombs";
import { tombAt, tombStyle, type TombStyle } from "../content/tombs";
import { exitAt } from "../world/complex";
import { parseTombSpace, tombLevel, tombSolid, tombSpace, tombWalkable } from "../world/tomb";
import { caveMouthAt, caveMouthsNear } from "./cave";
import { areaTarget, arriveIn, burnLight, cachedArea, complexRecord, nearest, type ComplexHost } from "./complex";
import { catacombEnter } from "./sewer";
import { folkDeal, folkTime } from "./tunnel-folk";
import type { Inspection, Inventory, Point, Position, WorldModel } from "./types";

/** A trip into a tomb: which one, its first area, the cell outside to come back to, and the light carried. */
export type TombRun = {
  kind: "tomb";
  site: string;
  name: string;
  entry: string;
  /** Where the player comes back up: the cell outside a cliff tomb, or the stair in a church. */
  out: Point & { space?: string };
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
  return cachedArea(h, space, () => tombLevel(h.state.manifest.seed, style, at.site, at.area), tombSolid);
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

/** A rock-cut tomb entrance on a cliff face, where and when tombs are built. */
export function tombMouthAt(world: WorldModel, x: number, y: number) {
  const s = world.geography?.packAt(x, y)?.setting ?? world.pack.setting;
  const style = s && tombAt(s.lon, s.lat, s.year);
  if (!style?.cliff) return undefined;
  const mouth = caveMouthAt(world, x, y);
  if (!mouth) return undefined;
  // Split cliff openings between natural caves and rock-cut tombs.
  if ((((x * 73856093) ^ (y * 19349663)) & 1) !== 0) return undefined;
  return { x, y, style };
}

export function* tombMouthsNear(world: WorldModel, at: Point, r: number) {
  for (const m of caveMouthsNear(world, at, r)) {
    const t = tombMouthAt(world, m.x, m.y);
    if (t) yield t;
  }
}

const CHURCH = /^religious-(?:gothic|parish-church|romanesque-church|byzantine-church|orthodox-monastery|rus-church|muscovite-church|caucasian-church|coptic-church|mission-church)-/;

/** What lies under a church, and the cell of its stair down at the far end
 * from the door: the crypt, or under Rome the catacombs. */
export function churchBelow(h: ComplexHost, space: string): { kind: "crypt" | "catacomb"; at: Point; door: Point } | undefined {
  const place = h.world.place(space);
  if (!place || !CHURCH.test(place.claim)) return undefined;
  const s = h.world.geography?.packAt(place.entrance.x, place.entrance.y)?.setting ?? h.world.pack.setting;
  const kind = !s ? undefined : catacombKindAt(s.lon, s.lat, s.year) === "roman" ? "catacomb" : tombAt(s.lon, s.lat, s.year)?.id === "crypt" ? "crypt" : undefined;
  const L = kind && h.interior(space);
  if (!kind || !L) return undefined;
  const used = new Set(L.furniture.flatMap((f) => Array.from({ length: f.size[0] * f.size[1] }, (_, i) => `${f.pos.x + (i % f.size[0])},${f.pos.y + Math.floor(i / f.size[0])}`)));
  let at: Point | undefined, far = -1;
  for (const k of [...L.floor].sort()) {
    if (used.has(k) || !L.walk.has(k)) continue;
    const [x, y] = k.split(",").map(Number), d = Math.abs(x - L.entry.x) + Math.abs(y - L.entry.y);
    if (d > far) (far = d), (at = { x, y });
  }
  return at && { kind, at, door: place.entrance };
}

function churchVerb(h: ComplexHost) {
  const p = h.state.player, b = churchBelow(h, p.pos.space);
  return b && Math.max(Math.abs(b.at.x - p.pos.x), Math.abs(b.at.y - p.pos.y)) <= 1 ? { label: b.kind === "crypt" ? "Go down to the crypt" : "Go down to the catacombs", target: `tomb-church:${p.pos.space}` } : undefined;
}

/** In by the stair, lamp lit. `n` picks which tomb of its kind in this world. */
export function tombEnter(h: ComplexHost, style: TombStyle, n: number | string = 0, out: Position = h.state.player.pos) {
  const p = h.state.player, site = `${style.id}.${n}`;
  const light = caveLightFor(h.world.pack.setting?.year ?? 0);
  h.state.complex = { kind: "tomb", site, name: style.name, entry: tombSpace(site, 0), out: { x: out.x, y: out.y, ...(out.space !== "outside" ? { space: out.space } : {}) }, light: light.id, left: light.burns };
  if (!arrive(h, tombSpace(site, 0))) return void delete h.state.complex;
  p.direction = 0;
  h.advance(60);
  h.event(`${light.lit} ${style.enter}`, "world");
}

function leave(h: ComplexHost) {
  const run = runOf(h)!, p = h.state.player;
  for (const a of [...h.state.actors]) if (a.underground) h.folk.part(a.id);
  p.pos = { space: "outside", ...run.out };
  p.direction = 2;
  delete h.state.complex;
  h.event(tombStyle(run.site.split(".")[0])?.leave ?? "You climb back out.");
}

const here = (h: ComplexHost) => (runOf(h) ? tombLevelOf(h, h.state.player.pos.space) : undefined);

export function tombInspect(h: ComplexHost, id: string): Inspection | undefined {
  const church = /^tomb-church:(.+)$/.exec(id), below = church && churchBelow(h, church[1]);
  if (below)
    return {
      id, name: below.kind === "crypt" ? "Crypt stair" : "Stair to the catacombs", kind: "place", pos: { ...below.at, space: church![1] },
      description: below.kind === "crypt"
        ? "Worn steps going down under the choir, behind a low iron gate. Cold air comes up, smelling of wax and old stone."
        : "Steps cut down into the soft brown rock under the church, to the galleries where the martyrs and the city's Christians are buried.",
      affordances: [{ label: below.kind === "crypt" ? "Go down to the crypt" : "Go down to the catacombs", enabled: true, command: { type: "interact", target: id, action: "complex" } }],
    };
  const mouth = /^tomb-mouth:(-?\d+),(-?\d+)$/.exec(id);
  if (mouth) {
    const x = Number(mouth[1]), y = Number(mouth[2]), m = tombMouthAt(h.world, x, y);
    if (!m) return undefined;
    return {
      id, name: "Rock-cut tomb", kind: "place", pos: { x, y, space: "outside" },
      description: `A squared doorway cut into the cliff, with rock-cut steps dropping into ${m.style.name}.`,
      affordances: [{ label: "Enter the tomb", enabled: true, command: { type: "interact", target: id, action: "complex" } }],
    };
  }
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
  return undefined;
}

export function tombVerb(h: ComplexHost) {
  const p = h.state.player;
  if (!h.state.complex && p.pos.space !== "outside") return churchVerb(h);
  if (p.pos.space === "outside") {
    const near: [Point, string][] = [];
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const m = tombMouthAt(h.world, p.pos.x + dx, p.pos.y + dy);
      if (m) near.push([m, `tomb-mouth:${m.x},${m.y}`]);
    }
    const id = nearest(p, near);
    return id ? { label: "Enter the tomb", target: id } : undefined;
  }
  const c = here(h);
  if (!c) return undefined;
  const id = areaTarget(p, c.level, "tomb", (t) => !!t.prop);
  const offer = id ? tombInspect(h, id)?.affordances[0] : undefined;
  return offer?.enabled ? { label: offer.label, target: id! } : undefined;
}

export function tombAct(h: ComplexHost, id: string) {
  const church = /^tomb-church:(.+)$/.exec(id), below = church && churchBelow(h, church[1]);
  if (below) {
    if (below.kind === "catacomb") return void catacombEnter(h, below.door);
    return void tombEnter(h, tombStyle("crypt")!, `${below.door.x},${below.door.y}`, { ...below.at, space: church![1] });
  }
  const mouth = /^tomb-mouth:(-?\d+),(-?\d+)$/.exec(id);
  if (mouth) {
    const x = Number(mouth[1]), y = Number(mouth[2]), m = tombMouthAt(h.world, x, y);
    if (!m) return;
    tombEnter(h, m.style, `${x},${y}`);
    return;
  }
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
  }
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

import { caveLight } from "../content/caves";
import { tunnelPerson, type SewerPerson } from "../content/sewers";
import type { AreaFolk } from "../world/complex";
import { person } from "../world/v3/wayfarers";
import { random } from "./random";
import type { Actor, GameEvent, Point, Position, Snapshot as GameState, WorldModel } from "./types";


export type FolkHost = {
  state: GameState;
  world: WorldModel;
  event(text: string, kind?: GameEvent["kind"], at?: Position): void;
  advance(seconds: number): void;
  hurt(damage: number, cause: string, injury?: import("../content/health/injuries").InjuryId): void;
  join(a: Actor): void;
  part(id: string): void;
  itemName(id: string): string;
  value(id: string): number;
  edible(id: string): boolean;
  /** Whether money here is coin, or food stands in for it. */
  coined(): boolean;
  /** Sets them on the player, or running from them. */
  provoke(a: Actor, fight: boolean): void;
  remember(line: string): void;
};

const cheb = (a: Point, b: Point) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
const facing = (from: Point, to: Point) => (Math.abs(to.x - from.x) > Math.abs(to.y - from.y) ? (to.x > from.x ? 1 : 3) : to.y > from.y ? 2 : 0);
function hashCode(s: string) {
  let n = 0;
  for (let i = 0; i < s.length; i++) n = (Math.imul(n, 31) + s.charCodeAt(i)) | 0;
  return n;
}

/** Bring in whoever is on this level, and see off whoever was on the last. */
export function folkArrive(h: FolkHost, space: string, folk: readonly AreaFolk[]) {
  for (const a of h.state.actors) if (a.underground && a.pos.space !== space) h.part(a.id);
  const setting = h.world.pack.setting;
  if (!setting) return;
  const seed = h.state.manifest.seed;
  for (const f of folk) {
    if (h.state.actors.some((a) => a.id === f.id)) continue;
    const who = tunnelPerson(f.person);
    if (!who) continue;
    const a = person(seed, setting, f.id, who.dress, who.label, f.sex, f.age, { x: f.x, y: f.y }, Number.MAX_SAFE_INTEGER);
    a.pos = { x: f.x, y: f.y, space };
    a.home = { ...a.pos };
    a.work = { ...a.pos };
    a.activity = who.doing;
    delete a.wayfarer;
    a.offRoutine = false;
    a.underground = { person: who.id, home: { x: f.x, y: f.y }, next: 0 };
    if (who.lit) a.heldItem = "torch";
    h.join(a);
  }
}

const foe = (h: FolkHost, who: SewerPerson) => !!who.foes?.test(h.state.player.role ?? "");
const party = (h: FolkHost, a: Actor) => {
  const group = a.id.replace(/-\d+$/, "-");
  return h.state.actors.filter((o) => o.underground && o.pos.space === a.pos.space && o.id.startsWith(group) && !o.dead);
};

/** The people on this level go about it: they notice the player, wander or
 * keep their spot, and turn on an enemy. `open` says where feet can go. */
export function folkTime(h: FolkHost, space: string, open: (x: number, y: number) => boolean) {
  const p = h.state.player, clock = h.state.clock;
  for (const a of h.state.actors) {
    const u = a.underground;
    if (!u || a.pos.space !== space || clock < u.next || a.terror || a.dead) continue;
    const who = tunnelPerson(u.person);
    if (!who) continue;
    meet(h, a, who);
    if (a.terror) continue;
    u.next = clock + (who.manner === "explore" ? 6 : 12);
    const roam = who.manner === "explore" ? 10 : who.manner === "crew" ? 6 : who.manner === "scavenge" ? 3 : 0;
    if (!roam || cheb(a.pos, p.pos) <= 2) {
      if (cheb(a.pos, p.pos) <= 4) a.direction = facing(a.pos, p.pos);
      continue;
    }
    if (!u.goal || (a.pos.x === u.goal.x && a.pos.y === u.goal.y)) {
      const r = (k: number) => (Math.sin(clock * 12.9898 + k * 78.233 + a.id.length) * 43758.5453) % 1;
      const gx = u.home.x + Math.round(Math.abs(r(1)) * roam * 2 - roam), gy = u.home.y + Math.round(Math.abs(r(2)) * roam * 2 - roam);
      if (open(gx, gy)) u.goal = { x: gx, y: gy };
      continue;
    }
    const to = step(h, space, open, a.pos, u.goal);
    if (to) {
      a.direction = facing(a.pos, to);
      a.pos = { ...to, space };
      h.join(a);
    } else delete u.goal;
  }
}

/** Someone notices the player: once, with a line of their own, or a warning
 * and worse for someone they take for an enemy. */
function meet(h: FolkHost, a: Actor, who: SewerPerson) {
  const u = a.underground!;
  if (u.met || cheb(a.pos, h.state.player.pos) > (who.foes ? 6 : 4)) return;
  u.met = true;
  if (who.quiet && Math.abs(hashCode(a.id)) % 4) return;
  if (who.threat && foe(h, who)) {
    for (const o of party(h, a)) o.underground!.met = true;
    h.event(`${a.name}, ${who.label.toLowerCase()}: “${who.threat}”`, "social", a.pos);
    for (const o of party(h, a)) h.provoke(o, !who.flee);
    return;
  }
  const line = who.lines[Math.abs(hashCode(a.id)) % who.lines.length];
  h.event(`${a.name}, ${who.label.toLowerCase()}: “${line}”`, "social", a.pos);
}

function step(h: FolkHost, space: string, open: (x: number, y: number) => boolean, from: Point, to: Point): Point | undefined {
  const p = h.state.player.pos;
  const taken = (x: number, y: number) => (p.x === x && p.y === y) || h.state.actors.some((a) => a.pos.space === space && a.pos.x === x && a.pos.y === y);
  const seen = new Map<number, number>([[to.y * 4096 + to.x, 0]]);
  const queue: Point[] = [to];
  for (let q = 0; q < queue.length && queue.length < 900; q++) {
    const cur = queue[q], d = seen.get(cur.y * 4096 + cur.x)!;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const x = cur.x + dx, y = cur.y + dy, k = y * 4096 + x;
      if (seen.has(k) || !open(x, y)) continue;
      seen.set(k, d + 1);
      queue.push({ x, y });
    }
  }
  let best: Point | undefined, score = 1e9;
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const x = from.x + dx, y = from.y + dy, d = seen.get(y * 4096 + x);
    if (d === undefined || taken(x, y)) continue;
    if (d < score) (score = d), (best = { x, y });
  }
  return best;
}

/** Someone took what a group down here keeps: they come for the player. */
export function folkRobbed(h: FolkHost, space: string, find: string) {
  const keepers = h.state.actors.filter((a) => a.underground && a.pos.space === space && !a.dead && !a.terror && tunnelPerson(a.underground.person)?.keeps === find);
  if (!keepers.length) return;
  const who = tunnelPerson(keepers[0].underground!.person)!;
  h.event(`${keepers[0].name}, ${who.label.toLowerCase()}: “${who.flee ? "Leave that! That's all we have!" : "Put that down. Now."}”`, "social", keepers[0].pos);
  for (const a of keepers) h.provoke(a, !who.flee);
}

type Offer = { label: string; enabled: boolean; reason?: string };

const dealt = (h: FolkHost, a: Actor) => h.state.folkDealt?.includes(a.id);
const wanted = (h: FolkHost, who: SewerPerson) => {
  const deal = who.deal!, inv = h.state.player.inventory;
  const have = (id: string) => (inv[id] ?? 0) > 0;
  if (!deal.wants) return [];
  if (Array.isArray(deal.wants)) return deal.wants.filter(have);
  if (deal.wants === "coin" && h.coined()) return have("coin") && (inv.coin ?? 0) >= (deal.price ?? 1) ? ["coin"] : [];
  return Object.keys(inv).filter((id) => have(id) && h.edible(id)).sort((x, y) => h.value(x) - h.value(y));
};

/** What the player can do with this person besides talk, if anything. */
export function folkOffer(h: FolkHost, a: Actor): Offer | undefined {
  const who = a.underground && tunnelPerson(a.underground.person), deal = who && who.deal;
  if (!who || !deal || a.terror) return undefined;
  if (dealt(h, a) && !deal.again) return { label: deal.verb, enabled: false, reason: "You have done that with them already" };
  if (deal.buys) {
    const goods = deal.buys.filter((id) => (h.state.player.inventory[id] ?? 0) > 0);
    return { label: deal.verb, enabled: goods.length > 0, reason: `You have nothing they want: they buy ${deal.buys.map((id) => h.itemName(id).toLowerCase()).slice(0, 3).join(", ")}` };
  }
  if (deal.wants && !wanted(h, who).length)
    return { label: deal.verb, enabled: false, reason: deal.wants === "food" || (deal.wants === "coin" && !h.coined()) ? "You have no food to give" : deal.wants === "coin" ? `It costs ${deal.price ?? 1} coin` : `They want ${(deal.wants as readonly string[]).map((id) => h.itemName(id).toLowerCase()).join(" or ")}` };
  return { label: deal.verb, enabled: true };
}

/** Doing it: the work, the trade or the offering. */
export function folkDeal(h: FolkHost, id: string) {
  const a = h.state.actors.find((o) => o.id === id);
  const who = a?.underground && tunnelPerson(a.underground.person);
  if (!a || !who?.deal || !folkOffer(h, a)?.enabled) return false;
  const deal = who.deal, p = h.state.player, inv = p.inventory, seed = h.state.manifest.seed;
  const add = (item: string, n: number) => n > 0 && (inv[item] = (inv[item] ?? 0) + n);
  const take = (item: string, n: number) => (inv[item] = Math.max(0, (inv[item] ?? 0) - n));
  const parts: string[] = [];
  h.advance(deal.time);
  if (deal.buys) {
    let paid = 0;
    const sold: string[] = [];
    for (const item of deal.buys) {
      const n = inv[item] ?? 0;
      if (!n) continue;
      paid += Math.max(1, Math.round(h.value(item) * n * 0.6));
      sold.push(`${n} ${h.itemName(item).toLowerCase()}`);
      take(item, n);
    }
    if (h.coined()) add("coin", paid);
    parts.push(`They take ${sold.join(" and ")}${h.coined() ? ` and count out ${paid} coin${paid === 1 ? "" : "s"}.` : "."}`);
  } else if (deal.wants) {
    const what = wanted(h, who)[0];
    const n = what === "coin" ? deal.price ?? 1 : Math.min(deal.price ?? 1, inv[what] ?? 0);
    take(what, n);
    parts.push(`You hand over ${what === "coin" ? `${n} coin${n === 1 ? "" : "s"}` : `${n === 1 ? "some" : n} ${h.itemName(what).toLowerCase()}`}.`);
  }
  const got: string[] = [];
  for (const [item, n] of Object.entries(deal.gives ?? {})) {
    const k = typeof n === "number" ? n : n[0] + Math.floor(random(seed, "folk", a.id, item, h.state.clock) * (n[1] - n[0] + 1));
    if (add(item, k)) got.push(`${k} ${h.itemName(item).toLowerCase()}`);
  }
  if (deal.wage && h.coined()) add("coin", deal.wage), got.push(`${deal.wage} coin${deal.wage === 1 ? "" : "s"} for the work`);
  if (deal.heal) p.health = Math.min(100, (p.health ?? 100) + deal.heal);
  const run = h.state.complex;
  if (deal.fuel && run && "left" in run && run.left > 0) run.left = Math.min(caveLight(run.light).burns * 1.5, run.left + deal.fuel);
  const line = `${parts.join(" ")} ${deal.text}${got.length ? ` You come away with ${got.join(" and ")}.` : ""}`.trim();
  h.event(line, "social", a.pos);
  if (deal.risk && random(seed, "folk-risk", a.id, h.state.clock) < deal.risk[2]) h.hurt(deal.risk[0], deal.risk[1]);
  (h.state.folkDealt ??= []).push(a.id);
  a.trust = Math.max(a.trust, 2);
  h.remember(`${a.name}, ${who.label.toLowerCase()}: ${deal.verb.toLowerCase()}.`);
  return true;
}

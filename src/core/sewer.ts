import { caveLight, caveLightFor, mineLightFor } from "../content/caves";
import { mineKindOf, minePeople } from "../content/mines";
import { anyMine } from "../content/settlements/worksites/mines";
import { worksiteProfiles } from "../content/settlements/worksites";
import { personFits, sewerFind, sewerKindFor, sewerPeople } from "../content/sewers";
import { folkArrive, folkDeal, folkTime } from "./tunnel-folk";
import { laneLids } from "../render/carriageway";
import { rngOf } from "./random";
import { complexRecord, nearest, takeFind, type ComplexHost } from "./complex";
import { landing } from "../world/complex";
import { parseSewerSpace, sewerLevel, sewerSolid, sewerSpace, walkable, WATER, type SewerSite, type TunnelNetwork } from "../world/sewer";
import { doorApproach } from "./doors";
import { knock, perilStart, perilTime, type Peril, type PerilKind, type Trapped } from "./mine-peril";
import type { Snapshot as GameState, Inspection, Inventory, Place, Point, WorldModel } from "./types";

/** The trip below the street the player is on. */
export type SewerRun = {
  kind: TunnelNetwork;
  site: string;
  light: string;
  /** Game seconds of light left. */
  left: number;
  low?: boolean;
  /** Storm water over the usual flow, 0 to 1, from the rain above. */
  surge: number;
  warned?: number;
  /** When the flood last knocked the player about. */
  soaked?: number;
  gassed?: number;
  /** When firedamp last went off round the player, and when the canary last warned. */
  fired?: number;
  canary?: number;
  /** Something going wrong down the mine; shut in behind a fall; no trouble before `calm`; the last two-minute slot rolled for it. */
  peril?: Peril;
  trapped?: Trapped;
  calm?: number;
  rolled?: number;
  took?: { at: Point; items: Inventory; clock: number };
};

/** The tunnel run in progress, if the player is down a sewer or a mine. */
export const tunnelRun = (s: GameState) => (s.complex && s.complex.kind !== "cave" ? s.complex : undefined);
/** What has been taken on this level's network. */
const doneOn = (state: GameState, level: { network: TunnelNetwork; site: string }) => state.complexes?.[`${level.network}:${level.site}`]?.done;

const lidKey = (p: Point) => `${p.x},${p.y}`;
const cheb = (a: Point, b: Point) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));

/** The lid painted in this street cell, if there is one. */
export function lidAt(world: WorldModel, x: number, y: number) {
  const lane = world.topography?.(x, y)?.lane;
  return lane ? laneLids(lane, x, y)[0] : undefined;
}

/** Lids within a cell of the player, standing on one first. */
function lidNear(world: WorldModel, at: Point) {
  let best: Point | undefined, score = 9;
  for (let dy = -1; dy <= 1; dy++)
    for (let dx = -1; dx <= 1; dx++)
      if (lidAt(world, at.x + dx, at.y + dy)) {
        const s = Math.abs(dx) + Math.abs(dy);
        if (s < score) (score = s), (best = { x: at.x + dx, y: at.y + dy });
      }
  return best;
}

const doorKey = (b: Place) => {
  const d = doorApproach(b);
  return `${d.x},${d.y}`;
};
/** The mine building whose door is at this street cell. */
const mineAt = (world: WorldModel, id: string) => world.places.find((b) => b.institution === "mine" && doorKey(b) === id);

function siteOf(h: ComplexHost, id: string, network: TunnelNetwork = "sewer"): SewerSite | undefined {
  const known = h.sewerSites.get(`${network}:${id}`);
  if (known) return known;
  const [x, y] = id.split(",").map(Number);
  const setting = h.world.geography?.packAt(x, y)?.setting ?? h.world.pack.setting;
  if (!setting) return undefined;
  const place = { lon: setting.lon, lat: setting.lat, year: setting.year };
  let site: SewerSite;
  if (network === "mine") {
    const b = mineAt(h.world, id);
    if (!b) return undefined;
    const pid = b.id.slice(b.id.indexOf("-worksite-") + 10);
    const profile = worksiteProfiles.find((p) => p.id === pid) ?? anyMine(setting.year, pid === "coal-pit");
    const ore = profile.ore ?? "copper", kind = mineKindOf(ore);
    site = { id, network, kind, ore, shaft: profile.frame === "worksite-engine-mine", place, people: minePeople.filter((p) => personFits(p, place, kind, undefined, ore)) };
  } else {
    const kind = sewerKindFor(place);
    site = { id, network, kind, place, people: sewerPeople.filter((p) => personFits(p, place, kind)) };
  }
  h.sewerSites.set(`${network}:${id}`, site);
  return site;
}

export function sewerLevelOf(h: ComplexHost, space: string) {
  const known = h.sewerLevels.get(space);
  if (known) return known;
  const at = parseSewerSpace(space);
  const site = at && siteOf(h, at.site, at.network);
  if (!at || !site || at.depth < 1 || at.depth > 3) return undefined;
  const topo = h.world.topography;
  const probe = topo && { lane: (x: number, y: number) => topo(x, y)?.lane, lids: (x: number, y: number) => {
    const lane = topo(x, y)?.lane;
    return lane ? laneLids(lane, x, y) : [];
  } };
  const level = sewerLevel(h.state.manifest.seed, site, at.depth, probe);
  const solid = sewerSolid(level);
  const done = new Set(doneOn(h.state, level));
  for (const t of level.things) if (t.solid && done.has(t.id) && !sewerFind(t.find)?.keeps) solid.delete(t.y * level.w + t.x);
  for (const i of h.state.mineFalls?.[space] ?? []) solid.add(i);
  const entry = { level, solid };
  h.sewerLevels.set(space, entry);
  return entry;
}

export function sewerGround(h: ComplexHost, space: string, x: number, y: number) {
  const c = sewerLevelOf(h, space);
  if (!c) return undefined;
  const { level, solid } = c;
  if (x < 0 || y < 0 || x >= level.w || y >= level.h) return true;
  return !walkable(level.cells[y * level.w + x]) || solid.has(y * level.w + x);
}

function arrive(h: ComplexHost, depth: number, at: "entry" | "down" | Point) {
  const run = tunnelRun(h.state)!, p = h.state.player;
  const c = sewerLevelOf(h, sewerSpace(run.site, depth, run.kind));
  if (!c) return undefined;
  const { level } = c;
  let spot: Point = typeof at === "object" ? at : level.entry;
  if (at === "down" && level.down) {
    spot = landing(level.down, (x, y) => sewerGround(h, level.space, x, y), level.entry);
  }
  p.pos = { ...spot, space: level.space };
  p.direction = 2;
  run.calm = Math.max(run.calm ?? 0, h.state.clock + 300);
  folkArrive(h.folk, level.space, level.folk);
  return level;
}

/** Back up into the street under one of the lids, which is left open, or out of the mine's door. */
function surface(h: ComplexHost, world: Point) {
  const p = h.state.player;
  for (const a of [...h.state.actors]) if (a.underground) h.folk.part(a.id);
  p.pos = { ...world, space: "outside" };
  p.direction = 2;
  if (tunnelRun(h.state)?.kind === "sewer") (h.state.lids ??= {})[lidKey(world)] = h.state.clock;
  delete h.state.complex;
}

/** Down a mine from its headframe or adit. False when this building is no way in. */
export function mineEnter(h: ComplexHost, b: Place) {
  if (b.institution !== "mine") return false;
  const key = doorKey(b), site = siteOf(h, key, "mine");
  if (!site) return false;
  const light = mineLightFor(site.place.year, site.kind === "coal");
  h.state.complex = { kind: "mine", site: key, light: light.id, left: light.burns, surge: 0 };
  const level = arrive(h, 1, "entry");
  if (!level) {
    delete h.state.complex;
    return false;
  }
  h.advance(site.shaft ? 120 : 60);
  // Issued at the lamp cabin from the 1950s: a filter mask good for an hour of afterdamp.
  const kit = site.place.year >= 1950 && !h.state.player.inventory["self-rescuer"] ? " You clip a self-rescuer to your belt." : "";
  if (kit) h.state.player.inventory["self-rescuer"] = 1;
  h.event(site.shaft
    ? `${light.lit}${kit} The banksman shuts the cage gate and rings the bell. The cage drops away under you, faster than seems right, wet rock streaming past the bars, until it slows and bumps to a stop at ${level.name}.`
    : `${light.lit}${kit} You stoop in at the adit mouth. Daylight goes grey behind you, and the air turns cool and still and smells of wet rock and lamp smoke. You walk in to ${level.name}.`);
  return true;
}

const thingAt = (h: ComplexHost, id: string) => {
  const c = tunnelRun(h.state) && sewerLevelOf(h, h.state.player.pos.space);
  const thing = c?.level.things.find((t) => `sewer-thing:${t.id}` === id);
  return c && thing ? { ...c, thing } : undefined;
};
const useCell = (t: { x: number; y: number; wall: boolean }) => ({ x: t.x, y: t.wall ? t.y + 1 : t.y });

/** What the player could use right now: the nearest thing in reach, facing first. */
export function sewerTargetNear(h: ComplexHost): string | undefined {
  const p = h.state.player;
  if (p.pos.space === "outside") {
    const lid = lidNear(h.world, p.pos);
    return lid ? `sewer-lid:${lid.x},${lid.y}` : undefined;
  }
  const c = tunnelRun(h.state) && sewerLevelOf(h, p.pos.space);
  if (!c) return undefined;
  const { level } = c;
  const done = new Set(doneOn(h.state, level));
  if (tunnelRun(h.state)?.trapped) return "sewer-knock";
  const options: [Point, string, number?][] = [];
  if (level.down && cheb(level.down, p.pos) <= 1) options.push([level.down, "sewer-down"]);
  level.shafts.forEach((s, i) => {
    if (cheb(s, p.pos) <= 1) options.push([s, `sewer-shaft:${i}`, -0.2]);
  });
  for (const t of level.things) {
    if (done.has(t.id) && !sewerFind(t.find)?.keeps) continue;
    const near = t.wall ? p.pos.y === t.y + 1 && Math.abs(p.pos.x - t.x) <= 1 : cheb(t, p.pos) <= 1;
    if (near) options.push([t, `sewer-thing:${t.id}`, done.has(t.id) ? 0.4 : 0]);
  }
  return nearest(p, options);
}

export function sewerInspect(h: ComplexHost, id: string): Inspection | undefined {
  const p = h.state.player;
  const act = (label: string, target = id, enabled = true, reason?: string) => ({ label, enabled, reason, command: { type: "interact" as const, target, action: "complex" as const } });
  const lid = /^sewer-lid:(-?\d+),(-?\d+)$/.exec(id);
  if (lid) {
    const at = { x: Number(lid[1]), y: Number(lid[2]) };
    if (!lidAt(h.world, at.x, at.y)) return undefined;
    const open = h.state.lids?.[lidKey(at)] !== undefined;
    const year = h.world.pack.setting?.year ?? 1950;
    return {
      id, name: open ? "Open manhole" : "Manhole cover", kind: "place", pos: { ...at, space: "outside" },
      description: open
        ? "The cover lies on the road beside a round black hole. Iron rungs go down into the dark, and a cold, wet smell comes up."
        : year < 1950
          ? "A round cast-iron cover, its face cast with the maker's name and a grip pattern worn smooth by wheels."
          : "A round cast-iron cover set flush with the road, with two pick holes for the lifting key.",
      affordances: open ? [act("Climb down"), act("Put the cover back", `sewer-close:${at.x},${at.y}`)] : [act("Lift the cover")],
    };
  }
  const c = tunnelRun(h.state) && sewerLevelOf(h, p.pos.space);
  if (!c) return undefined;
  const { level } = c;
  const lit = tunnelRun(h.state)!.left > 0;
  const mine = level.network === "mine";
  if (id === "sewer-knock" && tunnelRun(h.state)!.trapped)
    return {
      id, name: "The rails", kind: "place", pos: { ...p.pos },
      description: "The rails run into the fallen stone and on, under it, to where the rescuers will be. Iron carries a knock a long way.",
      affordances: [act("Knock on the rails and listen")],
    };
  if (id === "sewer-down" && level.down)
    return {
      id, name: mine ? (level.depth === 1 ? (level.kind === "coal" ? "Staple shaft" : "Winze") : "Old ladderway") : level.depth === 1 ? "Drop shaft" : "Way down", kind: "place", pos: { ...level.down, space: level.space },
      description: mine
        ? level.depth === 1 ? "A ladderway going down through the rock to the workings. The ladders are wet and the rungs worn hollow in the middle." : "Rotten ladders going down into old workings nobody has worked in years. The air coming up is still and stale."
        : level.depth === 1 ? "A shaft with iron rungs going down to a bigger sewer. You can hear a lot of water moving down there." : "A ladder bolted into older stone, going down.",
      affordances: [act("Climb down", id, lit, "Not without a light")],
    };
  const shaft = /^sewer-shaft:(\d+)$/.exec(id);
  if (shaft) {
    const s = level.shafts[Number(shaft[1])];
    if (!s) return undefined;
    const cage = level.mouth === "cage", adit = level.mouth === "adit";
    return {
      id, name: s.to === "street" ? (cage ? "The cage" : adit ? "Way out to daylight" : "Ladder to the street") : "Ladder up", kind: "place", pos: { x: s.x, y: s.y, space: level.space },
      description: s.to === "street"
        ? cage ? "The iron cage that winds men and tubs up the shaft. The onsetter will ring you up." : adit ? "The adit runs back out to the hillside. A grey smudge of daylight shows at the end of it." : "Iron rungs up to a lid in the road. Daylight shows through its pick holes."
        : "The ladder back up to the level above.",
      affordances: [act(s.to === "street" ? (cage ? "Ring for the surface" : adit ? "Walk out" : "Climb up to the street") : "Climb up")],
    };
  }
  const found = thingAt(h, id);
  if (!found) return undefined;
  const { thing } = found, f = sewerFind(thing.find)!;
  const done = doneOn(h.state, level)?.includes(thing.id);
  return {
    id, name: thing.name, kind: "object", pos: { ...useCell(thing), space: level.space },
    description: done && !f.keeps ? "You have already been through this." : f.look,
    affordances: done && (f.loot || f.fuel) && !f.heal ? [] : [act(f.verb)],
  };
}

/** The label for the key, without building a whole inspection. */
export function sewerVerb(h: ComplexHost) {
  const id = sewerTargetNear(h);
  const offer = id ? sewerInspect(h, id)?.affordances[0] : undefined;
  return offer?.enabled && offer.command.type === "interact" ? { label: offer.label, target: offer.command.target } : undefined;
}

export function sewerAct(h: ComplexHost, id: string) {
  const p = h.state.player;
  if (id.startsWith("folk-")) return void folkDeal(h.folk, id);
  const close = /^sewer-close:(-?\d+),(-?\d+)$/.exec(id);
  if (close) {
    delete h.state.lids?.[`${close[1]},${close[2]}`];
    h.advance(15);
    h.event("You drag the cover back over the hole. It drops into its seat with a clank.");
    return;
  }
  const lid = /^sewer-lid:(-?\d+),(-?\d+)$/.exec(id);
  if (lid) {
    const at = { x: Number(lid[1]), y: Number(lid[2]) };
    const key = lidKey(at);
    if (h.state.lids?.[key] === undefined) {
      (h.state.lids ??= {})[key] = h.state.clock;
      const tool = (p.inventory.tool ?? 0) > 0;
      h.advance(tool ? 20 : 45);
      h.event(tool
        ? "You hook the cover with a tool through its pick hole and drag it aside. Iron grinds on iron. Cold air comes up, smelling of wet stone and worse."
        : "You work your fingers into the pick holes and heave. The cover is heavier than it looks, and it grinds aside. Cold air comes up, smelling of wet stone and worse.");
      return;
    }
    const site = siteOf(h, key);
    if (!site) return;
    const year = site.place.year;
    const light = caveLightFor(Math.max(year, 1950));
    h.state.complex = { kind: "sewer", site: key, light: light.id, left: light.burns, surge: 0 };
    const level = arrive(h, 1, "entry");
    if (!level) {
      delete h.state.complex;
      h.event("The shaft is choked with silt a few rungs down. There is no way through.");
      return;
    }
    h.advance(30);
    h.event(`${light.lit} You climb down the iron rungs into ${level.name}. The noise of the street goes thin above you, and water is running somewhere close.`);
    return;
  }
  const run = tunnelRun(h.state), c = run && sewerLevelOf(h, p.pos.space);
  if (!run || !c) return;
  const { level } = c;
  if (id === "sewer-knock") return knock(h);
  if (id === "sewer-down") {
    const next = arrive(h, level.depth + 1, "entry");
    h.advance(90);
    if (next) h.event(
      next.layer === "trunk" ? `You climb down a long shaft into ${next.name}. The roar of water fills everything.`
        : next.layer === "workings" ? `You climb down the ladders to ${next.name}. It is hot down here, and you can hear picks somewhere ahead.`
          : `You climb down into ${next.name}. The air is still and very old.`, "world");
    return;
  }
  const shaft = /^sewer-shaft:(\d+)$/.exec(id);
  if (shaft) {
    const s = level.shafts[Number(shaft[1])];
    if (!s) return;
    if (s.to === "street" && s.world) {
      const how = level.mouth;
      h.advance(how === "cage" ? 120 : how === "adit" ? 60 : 40);
      surface(h, s.world);
      h.event(how === "cage" ? "The onsetter rings you away. The cage climbs and climbs, and then daylight, wind and noise, and the banksman swinging the gate open."
        : how === "adit" ? "You walk out of the adit into daylight, blinking, the warm air smelling of grass."
          : "You push the cover up with your shoulder, shove it aside, and climb out into the street, blinking.");
      return;
    }
    const above = level.depth - 1;
    const back = sewerLevelOf(h, sewerSpace(run.site, above, run.kind))?.level;
    arrive(h, above, back?.down ? "down" : "entry");
    h.advance(90);
    h.event("You climb back up to the level above.");
    return;
  }
  const found = thingAt(h, id);
  if (!found) return;
  const { thing } = found, f = sewerFind(thing.find)!;
  takeFind(h, run, c, thing, f, complexRecord(h.state, `${run.kind}:${run.site}`).done, {
    refuel: (fuel) => void (run.left >= 0 && ((run.left = Math.min(caveLight(run.light).burns * 1.5, run.left + fuel)), (run.low = false))),
  });
}

/** Time passing below: the light burns, the water rises with rain, and the people down here go about it. */
/** Game seconds between breaths of gas: about five seconds of play, standing or walking. */
const GAS_EVERY = 60;

export function sewerTime(h: ComplexHost, elapsed: number) {
  const run = tunnelRun(h.state), p = h.state.player;
  if (!run) return;
  const c = sewerLevelOf(h, p.pos.space);
  if (!c) {
    if (p.pos.space === "outside" || !parseSewerSpace(p.pos.space)) {
      for (const a of [...h.state.actors]) if (a.underground) h.folk.part(a.id);
      delete h.state.complex;
    }
    return;
  }
  const { level } = c;
  const light = caveLight(run.light);
  // A miner's shift is lit from their own supply of candles or oil.
  if (run.left > 0 && !h.busy()) {
    run.left -= elapsed;
    if (run.left <= 0) {
      run.left = 0;
      h.event(`${light.out} ${run.kind === "mine" ? "It is completely dark." : "Only the daylight through the lids is left to see by."}`);
    } else if (!run.low && run.left < light.burns * 0.2) {
      run.low = true;
      h.event(light.flame ? "Your lamp is burning low." : "Your torch is going yellow. The batteries will not last much longer.");
    }
  }
  const rain = run.kind === "mine" ? 0 : h.rain();
  const want = rain > 0.2 ? Math.min(1, (rain - 0.2) * 1.6) : 0;
  const was = run.surge;
  run.surge += (want - run.surge) * Math.min(1, elapsed / 240);
  const clock = h.state.clock;
  if (was < 0.35 && run.surge >= 0.35 && clock - (run.warned ?? -1e9) > 1800) {
    run.warned = clock;
    h.event("It must be raining hard up in the street. The water in the channel is rising fast and turning brown.", "world");
  }
  const cell = level.cells[p.pos.y * level.w + p.pos.x];
  if (run.surge > 0.6 && (cell === WATER) && clock - (run.soaked ?? -1e9) > 30) {
    run.soaked = clock;
    h.hurt(4, "storm water in a sewer");
    h.event("The flood shoves at your legs and nearly takes your feet. Get up on the ledge.");
  }
  if (level.network === "mine") perilTime(h, level, c.solid);
  if (!tunnelRun(h.state) || h.state.player.dead) return;
  const near = (r: { x: number; y: number; w: number; h: number }, m: number) => p.pos.x >= r.x - m && p.pos.x <= r.x + r.w - 1 + m && p.pos.y >= r.y - m && p.pos.y <= r.y + r.h - 1 + m;
  const foul = level.rooms.find((r) => r.foul && near(r, 1));
  const flame = light.flame && run.left > 0;
  if ((p.inventory.canary ?? 0) > 0 && !foul && level.rooms.some((r) => r.foul && near(r, 6)) && clock - (run.canary ?? -1e9) > 600) {
    run.canary = clock;
    h.event("The canary stops singing and clings to the bottom of its cage. There is bad air close by.", "world");
  }
  if (foul?.damp === "fire") {
    if (flame && !light.safe) {
      if (clock - (run.fired ?? -1e9) > 1800) {
        run.fired = clock;
        run.left = 0;
        foul.foul = false;
        h.hurt(45, "a firedamp explosion");
        h.event("Your naked flame touches the gas. The air itself catches: a sheet of blue fire rolls along the roof with a thump that throws you down. Your light is gone.", "world");
      }
    } else if (clock - (run.gassed ?? -1e9) > 600) {
      run.gassed = clock;
      h.event(flame ? "The flame in your safety lamp stretches up and a pale blue cap forms over it. Firedamp. The gauze is all that keeps it in." : "Your head feels light and the air smells faintly sweet. Firedamp. One spark here and it would all go up.", "world");
    }
  } else if (foul?.damp === "black") {
    if (clock - (run.gassed ?? -1e9) > GAS_EVERY) {
      if (clock - (run.gassed ?? -1e9) > 600) h.event(flame ? "Your flame shrinks to a blue bead and nearly dies. The air here is dead: blackdamp. Your chest heaves for breath." : "You can't get your breath. The air here is dead: blackdamp. Get out of it.", "world");
      else h.hurt(8, "blackdamp");
      run.gassed = clock;
    }
  } else if (foul && clock - (run.gassed ?? -1e9) > GAS_EVERY) {
    const masked = (p.inventory["gas-mask"] ?? 0) > 0;
    if (clock - (run.gassed ?? -1e9) > 600)
      h.event(masked ? "Green gas hangs here. You pull the mask on and breathe rubber." : light.flame && run.left > 0 ? "Your flame shrinks and burns blue. The green air stings your eyes and throat. Get out of it." : "The air is green and tastes of rotten eggs. Your head pounds. Get out of it.", "world");
    else if (!masked) h.hurt(10, "sewer gas");
    run.gassed = clock;
  }
  folkTime(h.folk, level.space, (x, y) => !sewerGround(h, level.space, x, y));
}

const nearestMine = (h: ComplexHost, from: Point) =>
  h.world.places.filter((b) => b.institution === "mine").sort((a, b) => cheb(doorApproach(a), from) - cheb(doorApproach(b), from))[0];

/** Where a miner's day is worked: the pit bottom, or a stall at a face in the
 * workings, a different one most days. Null where there is no mine. */
export function minePlace(h: ComplexHost, from: Point, role: "pit" | "face", day: number) {
  const b = nearestMine(h, from), site = b && siteOf(h, doorKey(b), "mine");
  const c = site && sewerLevelOf(h, sewerSpace(site.id, role === "pit" ? 1 : 2, "mine"));
  if (!c) return null;
  const { level, solid } = c;
  const open = (x: number, y: number) => !sewerGround(h, level.space, x, y) && !solid.has(y * level.w + x);
  if (role === "pit") {
    const e = level.entry, spot = [[2, 1], [1, 1], [2, 0], [0, 1], [1, 0]].map(([dx, dy]) => ({ x: e.x + dx, y: e.y + dy })).find((q) => open(q.x, q.y)) ?? e;
    return { pos: { ...spot, space: level.space }, label: level.name };
  }
  const rooms = level.rooms.filter((r) => r.use === "face" || r.use === "stope" || r.use === "chamber");
  const room = rooms[Math.floor(rngOf(h.state.manifest.seed, "stall", day)() * rooms.length)];
  if (!room) return null;
  let spot: Point | undefined;
  for (let y = room.y; y < room.y + room.h && !spot; y++) for (let x = room.x; x < room.x + room.w; x++) if (open(x, y)) { spot = { x, y }; break; }
  if (!spot) return null;
  const label = level.kind === "coal" ? "your stall at the coal face" : level.kind === "salt" ? "your bench in the salt chamber" : "your place in the stope";
  return { pos: { ...spot, space: level.space }, label };
}

/** Up and out at the end of a shift, the way the player came in. */
export function mineLeave(h: ComplexHost) {
  const run = tunnelRun(h.state), c = run?.kind === "mine" ? sewerLevelOf(h, h.state.player.pos.space) : undefined;
  const out = c && c.level.shafts.find((s) => s.to === "street");
  if (!c || !out?.world) return false;
  surface(h, out.world);
  h.event(c.level.mouth === "cage" ? "You ride the cage up with the rest of the shift, black to the eyes, into the wind and the grey light at the pit top."
    : "You walk out of the adit with the rest of the shift, blinking at the daylight.");
  return true;
}

/** Something going wrong where the player stands down a mine, a fall of roof
 * where the kind asked for cannot happen here. */
export function minePeril(h: ComplexHost, kind: PerilKind) {
  const c = tunnelRun(h.state)?.kind === "mine" && sewerLevelOf(h, h.state.player.pos.space);
  if (c) perilStart(h, kind, c.level, c.solid) || perilStart(h, "fall", c.level, c.solid);
}

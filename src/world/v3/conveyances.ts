import type { Actor, Pack, Point } from "../../core/types";
import { crops } from "../../content/agriculture/crops";
import type { CropId } from "../../content/agriculture/types";
import { cropStage, farmSystem } from "../../content/agriculture";
import { random } from "../../core/random";
import { route } from "../../core/routing";
import { characterSex, generateCharacter } from "../../content/characters/generate";
import { resolveCharacterContext } from "../../content/characters/resolve";
import { requirementMet } from "../../content/characters/requirements";
import { localLabel } from "../../content/characters/officiant";
import { proceduralName } from "../../content/geography/character";
import { conveyancesFor, type Conveyance } from "../../content/conveyances";
import { cellKey, type Rect, type SettlementPlan } from "./types";

/** A vehicle working a settlement, and who is in it. Where it is comes from
 * the clock alone, as a train's does: out along its path, a wait, back (or
 * on round, for a loop), a wait. */
export type Vehicle = {
  id: string;
  conveyance: string;
  model: string;
  label: string;
  doing: string;
  gait: "walk" | "trot";
  path: Point[];
  loop: boolean;
  speed: number;
  waits: [number, number];
  phase: number;
  crew: string[];
  team?: string;
  rowLength?: number;
  seedCrop?: CropId;
  farmOwner?: string;
  /** The warded ground its crew keep watch over. */
  ward?: string;
};

/** Holy or royal ground a stranger may not walk onto, and its gate. */
export type Ward = { id: string; label: string; rect: Rect; gate: Point; placeId: string };

export type VehicleAt = { x: number; y: number; facing: number; heading: number; moving: boolean; along: number };

/** The carter or farmer walks at the animal’s shoulder when the player takes over. */
export function besideTeam(at: VehicleAt) {
  const dx = Math.sin(at.heading), dy = -Math.cos(at.heading);
  return { x: at.x + dx - 1.25 * dy, y: at.y + dy + 1.25 * dx };
}

type TimedRoute = Pick<Vehicle, "path" | "loop" | "speed" | "waits" | "phase">;

export function vehicleSchedule(v: TimedRoute, clock: number) {
  const drive = (v.path.length - 1) / v.speed;
  const cycle = (v.loop ? 1 : 2) * drive + v.waits[0] + v.waits[1];
  return { drive, cycle, phase: ((clock + v.phase * cycle) % cycle + cycle) % cycle };
}

/** Where a vehicle is at `clock`, which way it faces (the eight facings, 0
 * north and clockwise) and how far it has come, for its wheels and gait. */
export function vehicleAt(
  v: TimedRoute,
  clock: number,
  step?: number,
): VehicleAt {
  const L = v.path.length - 1;
  if (step !== undefined) {
    const along = Math.max(0, Math.min(L, step)), i = Math.min(L - 1, Math.floor(along));
    const a = v.path[i], b = v.path[i + 1], dx = b.x - a.x, dy = b.y - a.y;
    return { x: a.x + dx * (along - i), y: a.y + dy * (along - i),
      facing: dy < 0 ? 0 : dx > 0 ? 2 : dy > 0 ? 4 : 6, heading: Math.atan2(dx, -dy), moving: along % 1 > 0, along };
  }
  const { drive, phase } = vehicleSchedule(v, clock);
  let t = phase;
  let along: number,
    back = false,
    moving = true;
  if (t < drive) along = t * v.speed;
  else if ((t -= drive) < v.waits[0]) (along = L), (moving = false);
  else if (v.loop) (along = L), (moving = false);
  else if ((t -= v.waits[0]) < drive) (along = L - t * v.speed), (back = true);
  else (along = 0), (moving = false), (back = true);
  const i = Math.max(0, Math.min(L - 1, Math.floor(along))),
    f = along - i;
  const a = v.path[i],
    b = v.path[i + 1] ?? a;
  // Heading from a few cells on, so a staircase reads as a diagonal road.
  const tangent = (index: number) => {
    const head = v.path[Math.min(L, index + 2)], tail = v.path[Math.max(0, index - 2)];
    return Math.atan2(head.x - tail.x, tail.y - head.y);
  };
  const start = tangent(i), change = tangent(i + 1) - start;
  const heading = start + f * Math.atan2(Math.sin(change), Math.cos(change)) + (back ? Math.PI : 0);
  return {
    x: a.x + (b.x - a.x) * f,
    y: a.y + (b.y - a.y) * f,
    heading,
    facing: ((Math.round(heading / (Math.PI / 4)) % 8) + 8) % 8,
    moving,
    along: back ? 2 * L - along : along,
  };
}

/** The settlement's vehicles and their crews, from what its time and place
 * drove. A patrol goes round the warded ground; a haul runs from the road out
 * of town to the square and back. */
export function planConveyances(plan: SettlementPlan, seed: string, pack: Pack) {
  const setting = pack.setting;
  if (!setting) return;
  const open = (p: Point) => !plan.solid.has(cellKey(p.x, p.y));
  const cost = (p: Point) =>
    plan.solid.has(cellKey(p.x, p.y)) ? Infinity : plan.traffic.has(cellKey(p.x, p.y)) ? 1 : 3;
  const leg = (a: Point, b: Point) => {
    const r = route(a, b, cost, { diagonal: true, maxNodes: 20000 });
    return r.status === "found" ? r.path : undefined;
  };
  const vehicles: Vehicle[] = (plan.vehicles ??= []);
  const grain = plan.parcels?.find(p => p.owner && crops[p.crop].kind === "grain" && p.state !== "abandoned");
  for (const c of conveyancesFor(setting)) {
    const n = c.work === "haul" && grain ? Math.max(1, c.count(plan.site.profile.radius)) : c.count(plan.site.profile.radius);
    for (let k = 0; k < n; k++) {
      const id = `${plan.site.id}-vehicle-${c.id}-${k}`;
      const roll = (key: string) => random(seed, id, key);
      const ward = c.work === "patrol" ? plan.wards?.[k % Math.max(1, plan.wards.length)] : undefined;
      const market = plan.gatherings?.[0];
      const farmLane = c.work === "haul" && grain && market && leg(market, grain.access);
      const workingLane = farmLane && farmLane.length >= 7;
      const path = workingLane ? [market!, ...farmLane] : c.work === "patrol" ? patrol(ward, open, leg) : haul(plan, roll, leg);
      if (!path || path.length < 8) continue;
      const crew = c.crew.map((member, i) => crewMember(seed, pack, id, c, member, i, path[0]));
      for (const a of crew) plan.actors.push(a);
      vehicles.push({
        id,
        conveyance: c.id,
        model: c.model,
        label: c.label,
        doing: c.doing,
        gait: c.gait,
        path,
        loop: c.work === "patrol",
        speed: c.speed,
        waits: c.work === "patrol" ? [90 + roll("wait") * 120, 0] : [300 + roll("out") * 600, 600 + roll("in") * 900],
        phase: roll("phase"),
        crew: crew.map((a) => a.id),
        ward: ward?.id,
        farmOwner: workingLane ? grain!.owner : undefined,
      });
      if (ward)
        for (const a of crew) a.guard = { ward: ward.id };
    }
  }
  const system = farmSystem(setting);
  const from = system.oxPloughFrom;
  if (from !== undefined && setting.year >= from) planPlough(plan, vehicles, false);
  if (system.id === "southeast-asian-paddy-basins" && setting.year >= 1200 && conveyancesFor(setting).some(v => v.model === "buffalo-cart"))
    planPlough(plan, vehicles, true);
  for (const v of vehicles) {
    const count = v.rowLength && v.seedCrop !== "rice" ? 2 : 1;
    const species = v.seedCrop === "rice" ? "water-buffalo" : v.rowLength ? "cattle" : v.model === "buffalo-cart" ? "water-buffalo" : v.model === "farm-cart-pony" ? "horse" : undefined;
    if (!species) continue;
    v.team = v.id + "-team";
    const home = { ...v.path[0], space: "outside" as const };
    const parked = v.seedCrop === "rice" && cropStage("rice", setting.season, setting.lat) !== "sown";
    if (parked) {
      const farmer = plan.actors.find(a => a.id === v.crew[0])!;
      delete farmer.mount;
      farmer.pos = { ...farmer.home };
    }
    (plan.fauna ??= []).push({ id: v.team, speciesId: species, draft: true, hitch: parked ? undefined : v.id, owner: v.crew[0],
      home, pos: { ...home }, homeRadius: 4, members: Array.from({ length: count }, (_, i) => ({ ...home, x: home.x + i, direction: 2 })),
      state: "idle", nextDecisionAt: 0, stride: 0, since: 0 });
  }
}

function planPlough(plan: SettlementPlan, vehicles: Vehicle[], paddy: boolean) {
  const fields = plan.fields;
  if (!fields) return;
  const holders = new Set(plan.parcels?.map(p => p.owner));
  const farmers = plan.actors.filter(a => holders.has(a.id) && !a.mount && !a.tends);
  const cereals = plan.parcels?.filter(p => crops[p.crop].kind === "grain" && (paddy ? p.crop === "rice" : !crops[p.crop].wet) && p.state !== "abandoned");
  if (!cereals?.length) return;
  let crews = 0;
  const centre = plan.site.center;
  const parcels = paddy ? [...cereals].sort((a, b) =>
    Math.hypot(a.access.x - centre.x, a.access.y - centre.y) - Math.hypot(b.access.x - centre.x, b.access.y - centre.y)) : plan.parcels ?? [];
  parcels: for (const parcel of parcels) {
    if (parcel.crop !== (paddy ? "rice" : "fallow") || parcel.state === "abandoned") continue;
    const farmer = farmers.filter(a => !a.mount).reduce<Actor | undefined>((best, a) => !best ||
      Math.hypot(a.work.x - parcel.access.x, a.work.y - parcel.access.y) < Math.hypot(best.work.x - parcel.access.x, best.work.y - parcel.access.y) ? a : best, undefined);
    if (!farmer) continue;
    const r = parcel.rect;
    for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) {
      const first = fields.get(cellKey(x, y));
      if (first?.parcel !== parcel.id) continue;
      const across = first.axis === "x";
      const point = (i: number, j: number) => ({ x: x + (across ? i : j), y: y + (across ? j : i) });
      let length = 0;
      while (length < 28 && [0, 1, 2, 3].every(j => {
        const q = point(length, j), key = cellKey(q.x, q.y), f = fields.get(key);
        return f?.parcel === parcel.id && f.wet === paddy && !f.riser && !plan.solid.has(key);
      })) length++;
      if (length < (paddy ? 7 : 8)) continue;
      const headland = paddy ? 1 : 2;
      const row = Array.from({ length: length - 2 * headland }, (_, i) => point(i + headland, 1));
      const path = [...row, ...row.map((_, i) => point(length - headland - 1 - i, 2))];
      const implement = paddy ? "buffalo-plough" : "ox-plough";
      const id = plan.site.id + "-vehicle-" + implement + (crews ? "-" + crews : "");
      const cereal = cereals.find(p => p.owner === farmer.id) ?? cereals[0];
      if (paddy) for (const q of path) {
        const bed = fields.get(cellKey(q.x, q.y))!;
        bed.crop = "fallow";
        delete bed.flood;
      }
      farmer.plough = { step: 0, at: 0, vehicle: id };
      farmer.mount = { vehicle: id, place: 0 };
      farmer.pos = { ...row[0], space: "outside" };
      vehicles.push({ id, conveyance: implement, model: "ox-plough", label: paddy ? "Buffalo plough" : "Ox plough",
        doing: paddy ? "Puddling the flooded rice bed" : "Working the fallow strip", seedCrop: cereal.crop, gait: "walk", path, rowLength: row.length,
        loop: false, speed: 1 / 24, waits: [0, 0], phase: 0, crew: [farmer.id] });
      if (++crews >= (paddy ? 1 : 3)) return;
      continue parcels;
    }
  }
}

/** A loop round the ward, a little off its walls, starting at its gate. */
function patrol(ward: Ward | undefined, open: (p: Point) => boolean,
  leg: (a: Point, b: Point) => Point[] | undefined) {
  if (!ward) return undefined;
  const { x, y, w, h } = ward.rect;
  const m = 3;
  const corners = [
    { x: ward.gate.x, y: y + h + m },
    { x: x + w + m, y: y + h + m },
    { x: x + w + m, y: y - m },
    { x: x - m - 1, y: y - m },
    { x: x - m - 1, y: y + h + m },
    { x: ward.gate.x, y: y + h + m },
  ].map((p) => nearestOpen(p, open));
  const path: Point[] = [corners[0]];
  for (let i = 1; i < corners.length; i++) {
    const part = leg(path[path.length - 1], corners[i]);
    if (!part) return undefined;
    path.push(...part);
  }
  return path;
}

/** From the square out along the road to the edge of town. */
function haul(plan: SettlementPlan, roll: (k: string) => number, leg: (a: Point, b: Point) => Point[] | undefined) {
  const square = plan.gatherings?.[0];
  if (!square) return undefined;
  const c = plan.site.center;
  const r = plan.site.profile.radius;
  const ends = [...plan.traffic]
    .map((k) => {
      const [x, y] = k.split(",").map(Number);
      return { x, y };
    })
    .filter((p) => {
      const d = Math.hypot(p.x - c.x, p.y - c.y);
      return d > r * 0.6 && d < r * 0.95;
    });
  if (!ends.length) return undefined;
  const end = ends[Math.floor(roll("end") * ends.length)];
  const path = leg(square, end);
  return path && [square, ...path];
}

function nearestOpen(p: Point, open: (p: Point) => boolean) {
  for (let r = 0; r < 6; r++)
    for (let dy = -r; dy <= r; dy++)
      for (let dx = -r; dx <= r; dx++) {
        const q = { x: Math.round(p.x) + dx, y: Math.round(p.y) + dy };
        if (open(q)) return q;
      }
  return p;
}

function crewMember(seed: string, pack: Pack, vehicle: string, c: Conveyance,
  member: Conveyance["crew"][number], place: number, at: Point): Actor {
  const setting = pack.setting!;
  const id = `${vehicle}-crew-${place}`;
  const roll = (k: string) => random(seed, id, k);
  const age = member.age[0] + Math.floor(roll("age") * (member.age[1] - member.age[0] + 1));
  const pos = { x: at.x, y: at.y, space: "outside" as const };
  const actor: Actor = {
    id,
    name: proceduralName(setting, seed, id),
    role: member.role,
    kind: "human",
    pos: { ...pos },
    home: { ...pos },
    work: { ...pos },
    sprite: `human-${place % 3}-${Math.floor(roll("sprite") * 6)}`,
    inventory: { water: 1 },
    activity: c.doing,
    fatigue: 0,
    hunger: 5,
    trust: 1,
    memories: [],
    direction: 2,
    age,
    mount: { vehicle, place },
  };
  if (setting.characterRevision) {
    Object.assign(actor, generateCharacter(setting, seed, id, age, member.livelihood, undefined, undefined,
      member.sex ?? characterSex(seed, id)));
    actor.role = member.role;
    actor.age = age;
  }
  return actor;
}

/** A watchman walking a beat on the town wall, out and back, with a pause at
 * each end to look out; or, with `gate`, a guard standing at a gate. */
export function watchman(seed: string, pack: Pack, id: string, beat: Point[], post?: Actor["post"], captain = false, soldier = false): Actor {
  const gate = !!post && !post.round;
  const setting = pack.setting!;
  const roll = (k: string) => random(seed, id, k);
  const age = 20 + Math.floor(roll("age") * 30);
  const pos = { x: beat[0].x, y: beat[0].y, space: "outside" as const };
  const livelihood = soldier ? "soldier" : setting.year < -1000 ? "warrior" : gate ? "gate-keeper" : "town-watchman";
  const doing = post?.doing ?? (gate ? "Keeping the gate" : post ? "Walking the night round" : "Keeping watch from the wall");
  const actor: Actor = {
    id,
    name: proceduralName(setting, seed, id),
    role: "Watchman",
    kind: "human",
    pos: { ...pos },
    home: { ...pos },
    work: { ...pos },
    sprite: `human-0-${Math.floor(roll("sprite") * 6)}`,
    inventory: { water: 1 },
    activity: doing,
    fatigue: 0,
    hunger: 5,
    trust: 1,
    memories: [],
    direction: 2,
    age,
    // A gate guard stands on the ground at the post; only the wall watch is aloft.
    ...(post ? { post } : { watch: {
      path: beat,
      loop: false,
      // An unhurried pace, about half a walk.
      speed: 0.6,
      waits: [40 + roll("wait-out") * 60, 40 + roll("wait-back") * 60],
      phase: roll("phase"),
    } }),
  };
  if (setting.characterRevision) {
    Object.assign(actor, generateCharacter(setting, seed, id, age, livelihood, undefined, undefined,
      characterSex(seed, id)));
    // The local title where one is authored: halberdier, janissary, ashigaru.
    actor.role = actor.origin?.roleLabel && actor.origin.livelihood === livelihood ? actor.origin.roleLabel : soldier ? "Soldier" : gate ? "Gate Keeper" : "Watchman";
    actor.activity = doing;
    // The captain of a town's watch: a plume, a cloak and a sword at the hip.
    if (captain && actor.appearance) {
      const w = actor.appearance.wearing;
      actor.role = setting.year < -1000 ? "War Leader" : "Captain of the Watch";
      actor.appearance = { ...actor.appearance, wearing: { ...w, hatTrim: w.headwear === "none" ? w.hatTrim : "feather", mantle: true,
        sidearm: w.sidearm && w.sidearm !== "none" ? w.sidearm : w.headwear === "kabuto" ? "katana" : "sword" } };
    }
    actor.age = age;
  }
  return actor;
}

/** Soldiers in a town that keeps them: a patrol or two walking a round of the
 * squares and the great buildings by day, and a pair of sentries at the seat
 * of government. A town at war has more of both. */
export function planSoldiers(plan: SettlementPlan, seed: string, pack: Pack) {
  const setting = pack.setting;
  if (!setting?.characterRevision || (setting.settlement !== "city" && setting.settlement !== "port")) return;
  const soldier = resolveCharacterContext(setting).livelihoods.find((l) => l.id === "soldier");
  if (!soldier) return;
  // Asked for by name, the work keeps its plain name; a patrol wants the army's.
  const named = (a: Actor) => Object.assign(a, { role: localLabel(soldier, setting, seed, a.id) });
  const war = requirementMet("war", setting);
  const r = plan.site.profile.radius;
  const open = (p: Point) => !plan.solid.has(cellKey(p.x, p.y));
  const seat = plan.places.find((p) => p.institution === "administration");
  const stops = [...(plan.gatherings ?? []), ...(seat ? [seat.entrance] : []),
    ...plan.places.filter((p) => p.institution === "worship" || p.institution === "caravanserai").map((p) => p.entrance)]
    .map((p) => nearestOpen(p, open));
  const patrols = (r >= 28 ? 1 : 0) + (r >= 45 ? 1 : 0) + (war ? 1 : 0);
  for (let k = 0; k < patrols && stops.length > 1; k++) {
    const id = `${plan.site.id}-patrol-${k}`;
    const roll = (key: string) => random(seed, id, key);
    // Three or four stops, taken from a rotated list so two patrols differ.
    const from = Math.floor(roll("from") * stops.length);
    const round = Array.from({ length: Math.min(stops.length, 3 + (roll("n") < 0.5 ? 1 : 0)) }, (_, i) => stops[(from + i * (k + 1)) % stops.length]);
    const size = roll("size") < 0.6 ? 2 : 3;
    // The first walks the round; the others keep abreast of him.
    for (let i = 0; i < size; i++) {
      const at = nearestOpen({ x: round[0].x + i, y: round[0].y }, open);
      plan.actors.push(named(watchman(seed, pack, `${id}-${i}`, [at, at],
        { at, rest: at, doing: "On patrol", ...(i ? { with: `${id}-0`, beside: i } : { round, leg: 0 }) }, false, true)));
    }
  }
  const post = seat?.entrance ?? (war ? plan.gatherings?.[0] : undefined);
  if (!post) return;
  for (const [i, dx] of [-1, 1].entries()) {
    const at = nearestOpen({ x: post.x + dx, y: post.y + 1 }, open);
    plan.actors.push(named(watchman(seed, pack, `${plan.site.id}-sentry-${i}`, [at, at], { at, rest: at, face: 2, doing: "On sentry duty" }, false, true)));
  }
}

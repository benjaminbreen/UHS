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
import type { Sample } from "./roads";
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
  delivery?: { good?:"steel-coil"; store: string; customer: string; place: string; walks: [Point[], Point[]]; tails: [number, number] };
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

export function truckOffset(p: Point, facing: number, forward: number, side: number): Point {
  const a = (facing * Math.PI) / 4;
  return {
    x: Math.round(p.x + forward * Math.sin(a) + side * Math.cos(a)),
    y: Math.round(p.y - forward * Math.cos(a) + side * Math.sin(a)),
  };
}

export function truckBody(p: Point, facing: number, long: boolean) {
  const cells: Point[] = [],
    length = long ? 3 : 2;
  for (let i = -length; i <= length; i++) for (let j = -1; j <= 1; j++) cells.push(truckOffset(p, facing, i, j));
  return cells;
}

/** The cells a motor vehicle stands on: a lorry's block, or a car's single file. */
export function motorBody(p: Point, m: { facing: number; long: boolean; slim?: number }) {
  if (m.slim === undefined) return truckBody(p, m.facing, m.long);
  return Array.from({ length: m.slim * 2 + 1 }, (_, i) => truckOffset(p, m.facing, i - m.slim!, 0));
}

export function deliveryAt(v: Vehicle, clock: number) {
  const truck = vehicleAt(v, clock),
    { phase, cycle, drive } = vehicleSchedule(v, clock);
  const depot = phase >= 2 * drive + v.waits[0],
    stop = depot ? 0 : 1;
  const time = phase - (depot ? 2 * drive + v.waits[0] : drive);
  const wait = v.waits[depot ? 1 : 0],
    path = v.delivery!.walks[stop];
  const service = 50,
    pace = 2;
  const workAt = v.delivery!.tails[stop] * pace;
  const workTime = Math.max(0, Math.min(service, time - workAt));
  const steps = Math.max(0, Math.min(time - workTime, wait - time));
  const index = Math.min(path.length - 1, Math.floor(steps / pace));
  const cab = truck.moving || time < 1 || wait - time < 1;
  const inOffice = !depot && !cab && steps >= path.length * pace;
  const a = path[index],
    b = path[Math.min(index + 1, path.length - 1)];
  const fraction = steps / pace - Math.floor(steps / pace);
  const walking = !cab && !inOffice && index < path.length - 1 && (time < workAt || time >= workAt + service);
  return {
    truck,
    depot,
    cab,
    inOffice,
    person: a,
    walking,
    x: a.x + (b.x - a.x) * fraction,
    y: a.y + (b.y - a.y) * fraction,
    working: !cab && time >= workAt && time < workAt + service,
    handled: cab ? 0 : workTime / service,
    call: 2 * Math.floor((clock + v.phase * cycle) / cycle) + (depot ? 1 : 0),
  };
}

function planDelivery(plan: SettlementPlan, seed: string, pack: Pack, sample: Sample) {
  const truck = plan.objects.find((o) => o.motor);
  if (!truck) return;
  const start = truck.pos,
    motor = truck.motor!;
  const blocked = new Set(plan.solid);
  for (const o of plan.objects) if (o !== truck && o.pos.space === "outside") blocked.add(cellKey(o.pos.x, o.pos.y));
  const dry = new Map<string, boolean>();
  const open = (p: Point) => {
    const key = cellKey(p.x, p.y);
    if (!dry.has(key)) dry.set(key, !blocked.has(key) && sample(p.x, p.y).water > 0);
    return dry.get(key)!;
  };
  const bounds = { x: start.x - 65, y: start.y - 65, w: 131, h: 131 };
  const lane = (p: Point, from: Point) => {
    const facing = p.y < from.y ? 0 : p.y > from.y ? 4 : 2;
    if (!truckBody(p, facing, motor.long).every(open)) return Infinity;
    const k = cellKey(p.x, p.y);
    return plan.lanes?.has(k) ? 1 : plan.traffic.has(k) ? 2 : plan.surface.has(k) ? 3 : 7;
  };
  const gap = (p: Point) => Math.hypot(p.x - start.x, p.y - start.y);
  const commercial = (claim: string) =>
    /warehouse|shop|market|merchant|grocer|bakery|factory|workshop/i.test(claim) ? 0 : 1;
  const places = plan.places
    .filter((p) => gap(p.entrance) > 9 && gap(p.entrance) < 55)
    .sort((a, b) => commercial(a.claim) - commercial(b.claim) || gap(a.entrance) - gap(b.entrance));
  for (const place of places.slice(0, 16)) {
    const door = place.entrance;
    const path = route(start, door, lane, {
      bounds,
      maxNodes: 4500,
      isGoal: (p) =>
        gap(p) > 7 && Math.hypot(p.x - door.x, p.y - door.y) <= 5 && Math.hypot(p.x - door.x, p.y - door.y) >= 2,
    });
    if (path.status !== "found" || path.path.length < 6) continue;
    const road = [{ x: start.x, y: start.y }, ...path.path];
    const v: Vehicle = {
      id: truck.id,
      model: truck.sprite,
      conveyance: "delivery-truck",
      label: truck.name,
      doing: "Driving the delivery truck",
      gait: "trot",
      path: road,
      loop: false,
      speed: 0.35,
      waits: [3850, 240],
      phase: 0,
      crew: [],
    };
    // Start each town's first morning with its lorry at the loading bay.
    const cycle = vehicleSchedule(v, 0).cycle;
    v.phase = ((((cycle - 180 - 9 * 3600) % cycle) + cycle) % cycle) / cycle;
    const walks: Point[][] = [],
      tails: number[] = [];
    for (const [i, at] of [
      vehicleAt(v, cycle - 120 - v.phase * cycle),
      vehicleAt(v, (road.length - 1) / v.speed + 1 - v.phase * cycle),
    ].entries()) {
      const body = new Set(truckBody(at, at.facing, motor.long).map((p) => cellKey(p.x, p.y)));
      const pass = (p: Point) => (open(p) && !body.has(cellKey(p.x, p.y)) ? 1 : Infinity);
      for (const side of Math.sin(at.heading) < 0 ? [-2, 2] : [2, -2]) {
        const cab = truckOffset(at, at.facing, 2, side),
          tail = truckOffset(at, at.facing, -(motor.long ? 4 : 3), side / 2);
        if (!Number.isFinite(pass(cab)) || !Number.isFinite(pass(tail))) continue;
        const rear = route(cab, tail, pass, { bounds, maxNodes: 150 });
        if (rear.status !== "found") continue;
        // The building entrance itself may have a door object.
        const office = i
          ? route(tail, door, (p) => (p.x === door.x && p.y === door.y ? 1 : pass(p)), { bounds, maxNodes: 350 })
          : undefined;
        if (office && office.status !== "found") continue;
        walks.push([cab, ...rear.path, ...(office?.path ?? [])]);
        tails.push(rear.path.length);
        break;
      }
      if (walks.length !== i + 1) break;
    }
    if (walks.length !== 2) continue;
    const driver = crewMember(
      seed,
      pack,
      v.id,
      v.doing,
      { role: "Truck Driver", livelihood: "lorry-driver", age: [21, 60] },
      0,
      start,
    );
    driver.role = driver.origin?.livelihood === "lorry-driver" ? (driver.origin.roleLabel ?? driver.role) : driver.role;
    const store = v.id + "-dispatch",
      customer = v.id + "-receiving";
    v.delivery = { ...(plan.terminal?.steel && {good:"steel-coil"}), store, customer, place: place.id, walks: walks as [Point[], Point[]], tails: tails as [number, number] };
    v.crew.push(driver.id);
    driver.pos = { ...walks[0][tails[0]], space: "outside" };
    plan.actors.push(driver);
    plan.vehicles!.push(v);
    const footway = new Set(walks.flat().map((p) => cellKey(p.x, p.y)));
    const roadway = new Set(road.map((p) => cellKey(p.x, p.y)));
    for (const [id, name, stop, grain] of [
      [store, "Road freight awaiting collection", walks[0][tails[0]], plan.terminal || plan.harbor ? 0 : 18],
      [customer, "Delivered freight", door, 0],
    ] as const) {
      const neighbours = [1, 2, 3].flatMap((n) =>
        [
          [1, 0],
          [-1, 0],
          [0, -1],
          [0, 1],
          [1, 1],
          [-1, 1],
        ].map(([dx, dy]) => ({ x: stop.x + n * dx, y: stop.y + n * dy })),
      );
      const pos =
        neighbours.find((p) => open(p) && !footway.has(cellKey(p.x, p.y)) && !roadway.has(cellKey(p.x, p.y))) ?? stop;
      plan.objects.push({
        id,
        name,
        pos: { ...pos, space: "outside" },
        kind: "container",
        sprite: "harbor-case",
        inventory: { [v.delivery.good ?? "grain"]:grain },
      });
    }
    motor.facing = vehicleAt(v, 9 * 3600).facing;
    truck.sprite = truck.sprite.replace(/-\d$/, "-" + motor.facing);
    return;
  }
}

/** The settlement's vehicles and their crews, from what its time and place
 * drove. A patrol goes round the warded ground; a haul runs from the road out
 * of town to the square and back. */
export function planConveyances(plan: SettlementPlan, seed: string, pack: Pack, sample: Sample) {
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
  planDelivery(plan,seed,pack,sample);
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
      const crew = c.crew.map((member, i) => crewMember(seed, pack, id, c.doing, member, i, path[0]));
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

function crewMember(seed: string, pack: Pack, vehicle: string, doing: string,
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
    activity: doing,
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

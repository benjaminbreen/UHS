import type { Actor, Pack, Point } from "../../core/types";
import { random } from "../../core/random";
import { route } from "../../core/routing";
import { characterSex, generateCharacter } from "../../content/characters/generate";
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
  /** The warded ground its crew keep watch over. */
  ward?: string;
};

/** Holy or royal ground a stranger may not walk onto, and its gate. */
export type Ward = { id: string; label: string; rect: Rect; gate: Point; placeId: string };

export type VehicleAt = { x: number; y: number; facing: number; moving: boolean; along: number };

/** Where a vehicle is at `clock`, which way it faces (the eight facings, 0
 * north and clockwise) and how far it has come, for its wheels and gait. */
export function vehicleAt(v: Vehicle, clock: number): VehicleAt {
  const L = v.path.length - 1;
  const drive = L / v.speed;
  const cycle = (v.loop ? 1 : 2) * drive + v.waits[0] + v.waits[1];
  let t = (((clock + v.phase * cycle) % cycle) + cycle) % cycle;
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
  const ahead = v.path[Math.min(L, i + 3)],
    behind = v.path[Math.max(0, i - 2)];
  const [dx, dy] = back ? [behind.x - a.x, behind.y - a.y] : [ahead.x - a.x, ahead.y - a.y];
  return {
    x: a.x + (b.x - a.x) * f,
    y: a.y + (b.y - a.y) * f,
    facing: dx || dy ? ((Math.round(Math.atan2(dx, -dy) / (Math.PI / 4)) % 8) + 8) % 8 : 4,
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
  for (const c of conveyancesFor(setting)) {
    const n = c.count(plan.site.profile.radius);
    for (let k = 0; k < n; k++) {
      const id = `${plan.site.id}-vehicle-${c.id}-${k}`;
      const roll = (key: string) => random(seed, id, key);
      const ward = c.work === "patrol" ? plan.wards?.[k % Math.max(1, plan.wards.length)] : undefined;
      const path = c.work === "patrol" ? patrol(ward, open, leg) : haul(plan, roll, leg);
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
      });
      if (ward)
        for (const a of crew) a.guard = { ward: ward.id };
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

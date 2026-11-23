import type { Battle, Order, Terrain, TerrainKind } from "../content/arms/battles";
import { kitById } from "../content/arms/kits";
import { armFor, armourOf, armours, shieldCover, type Arm, type Armour, type Hurt, type Special } from "../content/arms/weapons";
import { random } from "./random";

/** A fight in real time: people with weapons, in tiles and seconds, stepped at
 * a fixed rate. It knows nothing of the world map or the renderer. The player
 * and every other fighter act through the same `Input`, so anything the
 * player can do an opponent can do and the reverse. */
export const STEP = 1 / 60;
const PARRY = 0.2;
const RADIUS = 0.42;
const HORSE_RADIUS = 0.62;
const FOOT_PACE = 3.3;
const HORSE_PACE = 7.4;
/** Every blow is scaled by this: fights should last long enough to read. */
const HARM = 0.8;
const COST = { light: 9, heavy: 20, special: 30, jump: 12, plunge: 10 };
/** Seconds in the air, and how much of that nothing can land. */
const AIR = 0.38, CLEAR = 0.28, LEAP = 0.5;
/** Seconds F is held after a blow before the wide swing is a half circle, and a whole one. The game's own. */
const HALF = 0.55, FULL = 1.1;

export type Input = {
  /** Where to go, each -1 to 1. */
  mx: number;
  my: number;
  /** Radians, east 0, south a quarter turn. */
  aim: number;
  /** Tiles to the point aimed at, for a lobbed shot. */
  aimDist?: number;
  /** A press is a blow. Kept held after it, the wide swing winds up: let go
   * past the half mark for a half circle, past the full for a whole one. */
  attack: boolean;
  /** Held. Raised just before a blow lands it is a parry. */
  guard: boolean;
  /** A jump the way you are going. Most of it clears a blow, and an attack
   * pressed in the air comes down with the landing. */
  jump?: boolean;
  /** False walks. Everyone but the player always runs. */
  run?: boolean;
  special?: boolean;
  swap?: boolean;
};
export type FighterSpec = {
  id: string;
  side: 0 | 1;
  unit: string;
  x: number;
  y: number;
  main: string;
  sideArm?: string;
  pack?: readonly string[];
  armour: Armour;
  shield: string;
  mounted?: boolean;
  skill: number;
  player?: boolean;
};
export type MoveKind = "light" | "heavy" | "plunge" | Special;
export type Move = {
  kind: MoveKind;
  windup: number;
  recover: number;
  damage: number;
  reach: number;
  /** Radians to each side. */
  arc: number;
  knock: number;
  poise: number;
  hurt: Hurt;
  punch: number;
  unblockable?: boolean;
  /** Tiles the blow carries the body forward. */
  lunge?: number;
  /** A wound-up swing: 1 a half circle, 2 a whole one. */
  power?: 1 | 2;
  /** Blows still to come in a flurry. */
  more?: number;
  floors?: boolean;
};
type Act = "ready" | "charge" | "windup" | "strike" | "recover" | "stagger" | "jump" | "down" | "dead" | "fled";
export type Fighter = FighterSpec & {
  arm: Arm;
  other?: Arm;
  /** What else is carried, in the order the player comes to it. */
  rest: Arm[];
  ammo: Record<string, number>;
  vx: number;
  vy: number;
  face: number;
  /** Where the horse is pointed and how fast it is going. */
  heading: number;
  speed: number;
  hp: number;
  horse: number;
  stamina: number;
  poise: number;
  act: Act;
  t: number;
  until: number;
  move?: Move;
  swing: number;
  guard: boolean;
  guardT: number;
  braced: boolean;
  prone: boolean;
  loaded: boolean;
  reloadT: number;
  drawT: number;
  burst: number;
  aimed: boolean;
  /** An attack asked for in the air, to land with the feet. */
  plunge: boolean;
  /** Seconds a leaping horse still has off the ground. */
  air: number;
  /** The attack has been held since the last blow went out. */
  swingHeld: boolean;
  /** What got through and hurt, for whoever reckons up afterwards. */
  wounds: Hurt[];
  /** A brittle edge wears from 1 toward a half. */
  edge: number;
  suppress: number;
  spent: number;
  struck: number;
  cooldown: number;
  braceAt: number;
  hooked: number;
  /** Tiles to whatever is being aimed at. */
  far: number;
  riposte?: { on: string; until: number };
  /** Who a lance or a trample has already met on this pass. */
  met: Map<string, number>;
  slot: { x: number; y: number };
  ai: { foe?: string; look: number; next: number; plan?: { swing: string; what: "parry" | "block" | "dodge" | "none" }; heavy?: boolean; hold: number; through: number; rest: boolean; leap?: boolean; strafe: number; lieUntil: number };
};
export type Unit = {
  id: string;
  side: 0 | 1;
  name: string;
  order: Order;
  then: [number, Order][];
  morale: number;
  size: number;
  routed: boolean;
  volleyAt: number;
  /** How far the formation has walked from where it formed up. */
  offset: number;
  /** Close enough to the enemy that the line stops walking. */
  contact: boolean;
  /** Missiles taken while standing still. */
  stung: number;
  /** Under the player's orders, so the fight does not overrule them. */
  manual?: boolean;
  steady: number;
};
export type ShotKind = "arrow" | "bolt" | "ball" | "stone" | "javelin" | "grenade";
export type Missile = {
  n: number;
  by: string;
  side: 0 | 1 | 2;
  kind: ShotKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  left: number;
  damage: number;
  hurt: Hurt;
  punch: number;
  /** A lobbed shot: where it comes down, and how far through its flight it is. */
  lob?: { sx: number; sy: number; tx: number; ty: number; t: number; T: number };
  blast?: number;
  passed: Set<string>;
};
export type SkirmishEvent =
  | { kind: "swing"; id: string; move: MoveKind; hurt: Hurt; reach: number; arc: number; x: number; y: number; face: number }
  | { kind: "telegraph"; id: string; heavy: boolean; unblockable: boolean }
  | { kind: "hit"; id: string; by: string; x: number; y: number; damage: number; hurt: Hurt; crit: boolean; killed: boolean; horse: boolean; dir: number }
  | { kind: "parry" | "block" | "guardbreak" | "dodge" | "shield" | "brace" | "down" | "unhorse" | "death" | "trample"; id: string; by: string; x: number; y: number }
  | { kind: "shot"; id: string; arm: string; x: number; y: number; face: number; smoke: boolean }
  | { kind: "land"; x: number; y: number; what: ShotKind; dir: number }
  | { kind: "warn"; x: number; y: number; radius: number; fuse: number }
  | { kind: "blast"; x: number; y: number; radius: number }
  | { kind: "rout"; unit: string; side: 0 | 1; name: string }
  | { kind: "order"; unit: string; side: 0 | 1; name: string; order: Order };

export type Setup = {
  seed: string;
  width: number;
  height: number;
  terrain?: readonly Terrain[];
  fighters: readonly FighterSpec[];
  units: readonly { id: string; side: 0 | 1; name: string; order: Order; then?: [number, Order][] }[];
  barrage?: { from: number; every: number; until: number; zone: [number, number, number, number] };
  /** What stands in the way besides the terrain: the walls of a real place. */
  blocked?: (x: number, y: number) => boolean;
};

const turnTo = (from: number, to: number, by: number) => {
  const d = wrap(to - from);
  return Math.abs(d) <= by ? to : from + Math.sign(d) * by;
};
export const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
const deg = (d: number) => (d * Math.PI) / 180;
const melee = (a: Arm) => !a.shot || a.family === "gun" || a.family === "javelin";
const shootKind = (a: Arm): ShotKind =>
  a.family === "bow" ? "arrow" : a.family === "crossbow" ? "bolt" : a.family === "sling" ? "stone" : a.family === "javelin" ? "javelin" : "ball";

export class Skirmish {
  time = 0;
  fighters: Fighter[] = [];
  units = new Map<string, Unit>();
  missiles: Missile[] = [];
  /** What happened since the renderer last looked. It empties this itself. */
  events: SkirmishEvent[] = [];
  readonly width: number;
  readonly height: number;
  readonly terrain: readonly Terrain[];
  private byId = new Map<string, Fighter>();
  private draws = 0;
  private serial = 0;
  private shellAt: number;
  private lastHit = 0;
  /** How each side's blows tell today. Some days nothing goes right. */
  private luck: [number, number];
  private shells: { x: number; y: number; at: number }[] = [];

  constructor(private setup: Setup) {
    this.width = setup.width;
    this.height = setup.height;
    this.terrain = setup.terrain ?? [];
    this.shellAt = setup.barrage?.from ?? Infinity;
    this.luck = [0.85 + this.rng() * 0.3, 0.85 + this.rng() * 0.3];
    for (const u of setup.units) {
      const men = setup.fighters.filter((f) => f.unit === u.id);
      const skill = men.reduce((sum, f) => sum + f.skill, 0) / Math.max(1, men.length);
      // No two days go the same: orders come a little early or late, and a unit's nerve is not known until it is tried.
      const late = 0.75 + this.rng() * 0.5, nerve = Math.max(0.1, Math.min(1, skill + (this.rng() - 0.5) * 0.3));
      this.units.set(u.id, { id: u.id, side: u.side, name: u.name, order: u.order, then: (u.then ?? []).map(([at, order]) => [at * late, order]), morale: 100, size: men.length, routed: false, volleyAt: 1.2, offset: 0, contact: false, stung: 0, steady: nerve });
    }
    for (const s of setup.fighters) {
      const arm = armFor(s.main), other = s.sideArm ? armFor(s.sideArm) : undefined;
      const face = s.side ? Math.PI : 0;
      const f: Fighter = {
        ...s, skill: Math.max(0.05, Math.min(1, s.skill + (this.rng() - 0.5) * 0.2)), arm, other, rest: (s.pack ?? []).map(armFor), ammo: {}, vx: 0, vy: 0, face, heading: face, speed: 0, hp: 100, horse: s.mounted ? 70 : 0,
        stamina: 100, poise: armours[s.armour].poise, act: "ready", t: 0, until: 0, swing: 0, guard: false, guardT: 0, braced: false, prone: false,
        loaded: true, reloadT: 0, drawT: 0, burst: 0, aimed: false, plunge: false, air: 0, swingHeld: false, wounds: [], edge: 1, suppress: 0, spent: -9, struck: -9, cooldown: 0, braceAt: 0, hooked: 0, far: 6,
        met: new Map(), slot: { x: s.x, y: s.y },
        ai: { hold: 0, look: 0, next: 0.4 + this.rng() * 0.8, through: 0, rest: false, strafe: this.rng() < 0.5 ? 1 : -1, lieUntil: 0 },
      };
      for (const a of [arm, other, ...f.rest]) if (a?.shot) f.ammo[a.id] = a.shot.thrown ? a.shot.carried ?? 2 : a.id === "pistol" ? 2 : a.family === "gun" || a.family === "machine-gun" ? 60 : 24;
      this.fighters.push(f);
      this.byId.set(f.id, f);
    }
  }

  private rng() {
    return random(this.setup.seed, "skirmish", this.draws++);
  }
  get(id: string) {
    return this.byId.get(id);
  }
  alive(f: Fighter) {
    return f.act !== "dead" && f.act !== "fled";
  }
  radius(f: Fighter) {
    return f.horse > 0 ? HORSE_RADIUS : RADIUS;
  }
  /** Off the ground for now, on foot or in the saddle: nothing lands. */
  private clear(f: Fighter) {
    return (f.act === "jump" && f.t < CLEAR) || f.air > 0.1;
  }
  private solid(x: number, y: number) {
    return this.ground(x, y, "wall") || !!this.setup.blocked?.(x, y);
  }
  ground(x: number, y: number, kind: TerrainKind) {
    return this.terrain.some((t) => t.kind === kind && x >= t.x && x < t.x + t.w && y >= t.y && y < t.y + t.h);
  }
  /** Men still in the fight on a side, and whether one side has it. */
  standing(side: 0 | 1) {
    return this.fighters.filter((f) => f.side === side && this.alive(f) && !this.units.get(f.unit)!.routed).length;
  }
  winner(): 0 | 1 | undefined {
    const a = this.standing(0), b = this.standing(1);
    return a && b ? undefined : a ? 0 : b ? 1 : undefined;
  }
  order(side: 0 | 1, order: Order, unit?: string) {
    for (const u of this.units.values())
      if (u.side === side && !u.routed && (!unit || u.id === unit)) {
        u.order = order;
        u.then = [];
        u.manual = true;
        this.events.push({ kind: "order", unit: u.id, side, name: u.name, order });
      }
  }

  step(input?: Input) {
    this.time += STEP;
    for (const u of this.units.values()) {
      while (u.then.length && u.then[0][0] <= this.time && !u.routed) {
        u.order = u.then.shift()![1];
        this.events.push({ kind: "order", unit: u.id, side: u.side, name: u.name, order: u.order });
      }
      if (u.order === "advance" && !u.routed && !u.contact) u.offset += STEP * 1.7;
      u.contact = false;
      if (this.time > u.volleyAt + 0.25) u.volleyAt = this.time + 2.2;
      if (!u.routed && u.morale < 100) u.morale = Math.min(100, u.morale + STEP * 1.2);
    }
    // Two lines that will not close: whoever came to attack loses patience
    // first. Orders the player gave stand.
    if (this.events.some((e) => e.kind === "hit")) this.lastHit = this.time;
    else if (this.time - this.lastHit > 12) {
      this.lastHit = this.time - 6;
      const waiting = [...this.units.values()].filter((u) => !u.routed && !u.manual && !u.then.length && u.order !== "charge");
      const side = waiting.some((u) => u.side === 1) ? 1 : 0;
      for (const u of waiting) if (u.side === side) {
        u.order = "charge";
        this.events.push({ kind: "order", unit: u.id, side: u.side, name: u.name, order: "charge" });
      }
    }
    this.barrage();
    for (const f of this.fighters) {
      if (!this.alive(f)) continue;
      this.act(f, f.player && input ? input : this.think(f));
    }
    this.move();
    this.fly();
  }

  // ------------------------------------------------------------- one fighter

  private act(f: Fighter, input: Input) {
    const now = this.time, wear = armours[f.armour];
    if (now - f.spent > 0.7 && f.act !== "windup" && f.act !== "charge") f.stamina = Math.min(100, f.stamina + STEP * 24 * wear.wind * (f.guard ? 0.4 : 1));
    if (now - f.struck > 2.2) f.poise = wear.poise + (f.horse > 0 ? 30 : 0);
    f.suppress = Math.max(0, f.suppress - STEP * 0.45);
    f.t += STEP;
    f.far = input.aimDist ?? f.far;
    if (!input.attack) f.swingHeld = false;
    if (f.air > 0) {
      f.air -= STEP;
      if (input.attack && !f.plunge && melee(f.arm) && f.act === "ready") f.plunge = true;
      if (f.air <= 0 && f.plunge && f.act === "ready") {
        f.plunge = false;
        f.move = this.plungeMove(f);
        f.swing++;
        return this.strike(f);
      }
    }
    const gun = f.arm.family === "gun" || f.arm.family === "machine-gun";

    if (f.act === "jump") {
      f.guard = false;
      if (input.attack && !f.plunge && melee(f.arm) && f.stamina >= COST.plunge) {
        f.plunge = true;
        this.spend(f, COST.plunge);
        this.events.push({ kind: "telegraph", id: f.id, heavy: true, unblockable: false });
      }
      if (f.t < f.until) return;
      f.vx *= 0.3;
      f.vy *= 0.3;
      if (f.plunge) {
        f.plunge = false;
        f.move = this.plungeMove(f);
        f.swing++;
        return this.strike(f);
      }
      this.set(f, "ready", 0);
    }
    if (f.act === "charge") {
      f.guard = false;
      const level = f.t >= FULL ? 2 : f.t >= HALF ? 1 : 0;
      if (level && f.t - STEP < (level === 2 ? FULL : HALF)) this.events.push({ kind: "telegraph", id: f.id, heavy: true, unblockable: false });
      if (input.attack && !input.jump) return this.steer(f, input, 0.45, 8);
      this.set(f, "ready", 0);
      if (level && f.stamina >= COST.heavy && !input.jump) {
        this.spend(f, COST.heavy);
        f.move = this.heavy(f, level);
        f.swing++;
        return this.set(f, "windup", 0);
      }
    }
    if (f.act === "stagger" || f.act === "down" || f.act === "recover" || f.act === "strike") {
      f.guard = false;
      if (f.t < f.until) return this.steer(f, input, f.act === "recover" ? 0.4 : 0, 3);
      if (f.act === "strike") {
        const m = f.move!;
        if (m.more) {
          f.move = { ...m, more: m.more - 1, windup: 0.13 };
          return this.set(f, "windup", 0);
        }
        return this.set(f, "recover", m.recover);
      }
      this.set(f, "ready", 0);
    }
    if (f.act === "windup") {
      const m = f.move!;
      if (f.t >= m.windup) return this.strike(f);
      return this.steer(f, input, 0.3, f.arm.family === "pike" ? 2 : 5);
    }

    // Ready.
    if (input.swap && f.other) {
      const old = f.arm;
      // The player goes round everything carried; the others keep to their first two.
      if (f.player && f.rest.length) {
        f.arm = f.other;
        f.other = f.rest.shift();
        f.rest.push(old);
      } else [f.arm, f.other] = [f.other, old];
      f.drawT = 0;
      f.braced = false;
      f.loaded = !f.arm.shot || (f.ammo[f.arm.id] ?? 0) > 0;
      f.reloadT = 0;
      return this.set(f, "recover", 0.22);
    }
    const shot = f.arm.shot;
    const threatened = gun && this.fighters.some((e) => e.side !== f.side && this.alive(e) && Math.hypot(e.x - f.x, e.y - f.y) < 2.6);
    f.prone = gun && input.guard && !threatened && !f.horse;
    const guarding = input.guard && !f.prone && f.drawT === 0;
    f.guardT = guarding && f.guard ? f.guardT + STEP : 0;
    f.guard = guarding;
    if (f.braced && (input.mx || input.my || f.arm.special !== "brace")) f.braced = false;

    if (input.jump && f.horse > 0 && f.air <= 0 && f.speed > 1.5 && f.stamina >= COST.jump) {
      // The horse is put at it: over stakes, wire and whoever is on the ground.
      this.spend(f, COST.jump);
      f.air = LEAP;
      f.plunge = false;
    }
    if (f.air > 0) return this.steer(f, input, 1, 9);
    if (input.jump && f.stamina >= COST.jump && !f.horse) {
      this.spend(f, COST.jump);
      // Up on the spot with nowhere to go; a running jump carries further.
      const go = Math.atan2(input.my, input.mx), pace = input.mx || input.my ? (input.run === false ? 4.4 : 6.2) * armours[f.armour].pace : 0;
      f.vx = Math.cos(go) * pace;
      f.vy = Math.sin(go) * pace;
      f.drawT = 0;
      f.plunge = false;
      return this.set(f, "jump", AIR);
    }
    if (input.attack && f.swingHeld && melee(f.arm) && !f.drawT) return this.set(f, "charge", 0);
    if (input.special && now >= f.cooldown && (f.stamina >= COST.special || f.arm.special === "brace")) return this.special(f);

    if (shot && !f.loaded) {
      const still = Math.hypot(f.vx, f.vy) < 1 || f.horse > 0 || !!shot.draw;
      if ((f.ammo[f.arm.id] ?? 0) > 0) f.reloadT += STEP * (still ? 1 : 0.35);
      if (f.reloadT >= shot.reload) {
        f.loaded = true;
        f.reloadT = 0;
      }
    }
    if (f.burst > 0 && shot) {
      f.reloadT += STEP;
      if (f.reloadT >= 0.075) {
        f.reloadT = 0;
        f.burst--;
        this.loose(f, 1, input);
      }
    } else if (shot && f.loaded && shot.draw) {
      if (input.attack) f.drawT += STEP;
      else if (f.drawT > 0.12) {
        this.loose(f, Math.min(1, f.drawT / shot.draw), input);
        f.drawT = 0;
      } else f.drawT = 0;
    } else if (input.attack && shot && f.loaded && !(f.arm.family === "javelin" && (input.aimDist ?? 9) < 2)) {
      this.loose(f, 1, input);
    } else if (input.attack && f.stamina >= COST.light && (!shot || melee(f.arm) || (f.ammo[f.arm.id] ?? 0) <= 0)) {
      this.spend(f, COST.light);
      f.move = this.light(f);
      f.swingHeld = true;
      f.swing++;
      this.events.push({ kind: "telegraph", id: f.id, heavy: false, unblockable: false });
      return this.set(f, "windup", 0);
    }
    const slow = f.prone ? 0.3 : f.guard ? (f.shield === "none" ? 0.5 : 0.8) : f.drawT ? 0.55 : f.braced ? 0 : 1;
    this.steer(f, input, slow, f.braced ? 2.5 : f.arm.family === "pike" ? 5 : 14);
  }

  private set(f: Fighter, act: Act, until: number) {
    f.act = act;
    f.t = 0;
    f.until = until;
  }
  private spend(f: Fighter, n: number) {
    f.stamina = Math.max(0, f.stamina - n);
    f.spent = this.time;
  }

  /** Turn and move as asked. A horse turns slowly and keeps its speed. */
  private steer(f: Fighter, input: Input, pace: number, turn: number) {
    const wear = armours[f.armour], mag = Math.min(1, Math.hypot(input.mx, input.my));
    let drag = f.air > 0 ? 1 : this.ground(f.x, f.y, "wire") ? 0.25 : this.ground(f.x, f.y, "mud") ? (f.horse > 0 ? 0.5 : 0.78 * wear.pace * wear.pace) : 1;
    if (this.ground(f.x, f.y, "stakes") && !f.horse) drag *= 0.6;
    if (f.horse > 0) {
      const top = HORSE_PACE * wear.pace * drag * (input.run === false ? 0.5 : 1) * (f.stamina < 8 ? 0.6 : 1);
      if (f.air > 0) f.speed = Math.max(f.speed, 4);
      else if (mag > 0.05 && f.act !== "stagger") {
        f.heading = turnTo(f.heading, Math.atan2(input.my, input.mx), STEP * (5 - 2.2 * Math.min(1, f.speed / HORSE_PACE)));
        f.speed = Math.min(top * mag, f.speed + STEP * 5.5);
      } else f.speed = Math.max(0, f.speed - STEP * 7);
      f.speed = Math.min(f.speed, Math.max(top, f.speed - STEP * 12));
      f.vx = Math.cos(f.heading) * f.speed;
      f.vy = Math.sin(f.heading) * f.speed;
      f.face = turnTo(f.face, input.aim, STEP * 9);
      return;
    }
    if (f.act === "stagger" || f.act === "down") {
      f.vx *= 0.9;
      f.vy *= 0.9;
      return;
    }
    const back = mag && Math.cos(Math.atan2(input.my, input.mx) - f.face) < -0.3 ? 0.65 : 1;
    const top = FOOT_PACE * wear.pace * drag * pace * back * (input.run === false ? 0.55 : 1) * (f.stamina < 8 ? 0.6 : 1);
    const tx = mag ? (input.mx / Math.max(mag, 1e-6)) * top * mag : 0, ty = mag ? (input.my / Math.max(mag, 1e-6)) * top * mag : 0;
    f.vx += (tx - f.vx) * 0.25;
    f.vy += (ty - f.vy) * 0.25;
    if (f.act !== "strike") f.face = turnTo(f.face, input.aim, STEP * turn);
  }

  private light(f: Fighter): Move {
    const a = f.arm;
    return { kind: "light", windup: a.windup, recover: a.recover, damage: a.damage * f.edge, reach: a.reach, arc: deg(a.arc), knock: a.knock, poise: a.poise, hurt: a.hurt, punch: a.punch ?? 0 };
  }
  /** The wound-up swing: an edge or a club goes round, half way or all the
   * way; a point goes further and harder down its one line. */
  private heavy(f: Fighter, power: 1 | 2): Move {
    const m = { ...this.light(f), kind: "heavy" as const, power, windup: 0.14, damage: f.arm.damage * f.edge * (power === 2 ? 2 : 1.5) };
    if (m.hurt === "thrust") return { ...m, recover: m.recover * 1.3, reach: m.reach + power * 0.5, lunge: power * 0.6, poise: m.poise * 2, punch: m.punch + 0.1 * power };
    return { ...m, recover: m.recover * (power === 2 ? 1.6 : 1.3), arc: power === 2 ? Math.PI : Math.PI / 2, knock: m.knock * 1.6, poise: m.poise * (power + 1) };
  }

  /** The blow that comes down out of a jump, as the weapon would do it: a
   * point is driven in, an edge is brought over the head, a club hits the
   * ground hard enough to floor whoever is round it, a bare foot kicks. */
  private plungeMove(f: Fighter): Move {
    const m = { ...this.light(f), kind: "plunge" as const, recover: f.arm.recover * 1.5 };
    if (f.arm.family === "fist") return { ...m, damage: m.damage * 2, knock: 2.2, poise: 99, floors: true, lunge: 0.4 };
    if (m.hurt === "thrust") return { ...m, damage: m.damage * 1.6, reach: m.reach + 0.3, punch: m.punch + 0.2, poise: m.poise * 2, lunge: 0.5 };
    if (m.hurt === "crush") return { ...m, damage: m.damage * 1.5, arc: Math.PI, reach: Math.max(1.3, m.reach * 0.9), poise: 99, knock: m.knock * 1.5, floors: true };
    return { ...m, damage: m.damage * 1.7, arc: deg(32), reach: m.reach * 1.05, poise: m.poise * 2.2, knock: m.knock * 1.4, punch: m.punch + 0.1 };
  }

  private special(f: Fighter) {
    const m = this.light(f), s = f.arm.special;
    let move: Move | undefined;
    let wait = 2.5;
    if (s === "brace") {
      if (f.horse > 0) return;
      f.braced = !f.braced;
      f.cooldown = this.time + 0.4;
      return;
    }
    if (s === "throw") move = { ...m, kind: s, windup: 0.3, damage: 8, knock: 2.4, poise: 99, unblockable: true, floors: true };
    else if (s === "lunge") move = { ...m, kind: s, windup: m.windup + 0.1, damage: m.damage * 1.5, reach: m.reach + 0.4, lunge: 1.6, arc: deg(20) };
    else if (s === "smash") move = { ...m, kind: s, windup: m.windup * 1.9, recover: m.recover * 1.4, damage: m.damage * 2, poise: 99, unblockable: true, floors: true, arc: deg(35) };
    else if (s === "hook") move = { ...m, kind: s, windup: m.windup * 0.9, damage: m.damage * 0.5, poise: 10 };
    else if (s === "bash") move = { ...m, kind: s, windup: 0.16, recover: 0.3, damage: 5, hurt: "crush", reach: 1, arc: deg(50), knock: 1.6, poise: 99, unblockable: true, lunge: 0.5 };
    else if (s === "sweep") move = { ...m, kind: s, windup: m.windup * 1.3, damage: m.damage * 1.1, arc: Math.PI, knock: m.knock * 1.5, poise: m.poise * 1.5 };
    else if (s === "flurry") move = { ...m, kind: s, windup: m.windup * 0.8, damage: m.damage * 0.7, more: 2, lunge: 0.3 };
    else if (s === "unhorse") move = { ...m, kind: s, windup: m.windup * 1.1, damage: m.damage * 0.8, reach: m.reach + 0.3, floors: true };
    else if (s === "bayonet") move = { ...m, kind: s, windup: 0.3, damage: m.damage * 1.6, lunge: 2.2, reach: m.reach + 0.3 };
    else if (s === "couch") {
      if (f.horse > 0) {
        // The spur: a burst of speed for the last strides.
        f.speed = Math.min(HORSE_PACE * 1.3, f.speed + 3);
        this.spend(f, COST.special);
        f.cooldown = this.time + 4;
        return;
      }
      move = { ...m, kind: "lunge", windup: m.windup + 0.1, damage: m.damage * 1.5, lunge: 1.6 };
    } else if (s === "aimed") {
      if (!f.arm.shot || !f.loaded) return;
      f.aimed = true;
      move = { ...m, kind: s, windup: 0.5, recover: 0.2 };
    } else if (s === "burst") {
      if (!f.loaded) return;
      f.burst = 14;
      wait = 4;
    }
    this.spend(f, COST.special);
    f.cooldown = this.time + wait;
    f.drawT = 0;
    if (!move) return;
    f.move = move;
    f.swing++;
    this.events.push({ kind: "telegraph", id: f.id, heavy: true, unblockable: !!move.unblockable });
    this.set(f, "windup", 0);
  }

  private strike(f: Fighter) {
    const m = f.move!;
    this.set(f, "strike", 0.1);
    if (m.kind === "aimed") {
      this.loose(f, 1, { mx: 0, my: 0, aim: f.face, attack: false, guard: false, aimDist: f.far });
      f.aimed = false;
      return;
    }
    if (m.lunge) {
      f.vx += Math.cos(f.face) * m.lunge * 12;
      f.vy += Math.sin(f.face) * m.lunge * 12;
    }
    this.events.push({ kind: "swing", id: f.id, move: m.kind, hurt: m.hurt, reach: m.reach, arc: m.arc, x: f.x, y: f.y, face: f.face });
    const reach = m.reach + (m.lunge ?? 0) * 0.6;
    const hit = this.fighters
      .filter((e) => e.side !== f.side && this.alive(e))
      .map((e) => ({ e, d: Math.hypot(e.x - f.x, e.y - f.y) - this.radius(e) }))
      .filter(({ e, d }) => d <= reach && (d < 0.35 || Math.abs(wrap(Math.atan2(e.y - f.y, e.x - f.x) - f.face)) <= m.arc + 0.12))
      .sort((a, b) => a.d - b.d);
    // A point finds one body; an edge finds everyone in its path.
    const most = m.hurt === "thrust" && m.kind !== "sweep" ? (f.arm.family === "pike" ? 2 : 1) : 9;
    for (const { e, d } of hit.slice(0, most)) {
      const closing = f.arm.momentum ? Math.max(0, f.speed - 2) * f.arm.momentum : 0;
      const cramped = f.arm.family === "pike" && d < 1.2 ? 0.4 : 1;
      this.resolve(f, e, { ...m, damage: m.damage * (1 + closing) * cramped * (f.horse > 0 && !e.horse ? 1.15 : 1) });
    }
    if (hit.length && f.arm.brittle) f.edge = Math.max(0.5, f.edge - 0.04);
  }

  /** One blow against one body: dodged, parried, blocked or landed. */
  private resolve(by: Fighter, e: Fighter, m: Move, missile = false) {
    const from = Math.atan2(by.y - e.y, by.x - e.x);
    const facing = Math.abs(wrap(from - e.face)) < deg(80);
    const at = { id: e.id, by: by.id, x: e.x, y: e.y };
    if (this.clear(e)) return void this.events.push({ kind: "dodge", ...at });
    if (m.kind === "hook" && e.guard && facing) {
      e.hooked = this.time + 3;
      this.stagger(e, 1.1);
      return void this.events.push({ kind: "guardbreak", ...at });
    }
    if (e.guard && facing && !m.unblockable && !missile) {
      const q = Math.min(0.95, e.arm.guard + (e.shield !== "none" && this.time > e.hooked ? 0.22 : 0));
      if (e.guardT <= PARRY) {
        e.riposte = { on: by.id, until: this.time + 1.5 };
        e.stamina = Math.min(100, e.stamina + 12);
        if (by.horse > 0) by.speed *= 0.4;
        else this.stagger(by, 0.95);
        return void this.events.push({ kind: "parry", ...at });
      }
      const heavy = m.kind !== "light" && m.kind !== "flurry";
      this.spend(e, m.damage * (heavy ? 1.2 : 0.65) * (1.25 - q));
      if (e.shield === "none") this.push(e, from + Math.PI, 0.4 + m.knock * 0.3);
      if (e.stamina <= 0) {
        this.stagger(e, 1.1);
        return void this.events.push({ kind: "guardbreak", ...at });
      }
      this.events.push({ kind: "block", ...at });
      if (!heavy) return;
      m = { ...m, damage: m.damage * (1 - q), poise: 0, knock: 0, floors: false };
    }
    const riposte = by.riposte?.on === e.id && by.riposte.until >= this.time;
    if (riposte) by.riposte = undefined;
    const open = e.act === "stagger" || e.act === "down";
    const behind = Math.abs(wrap(from - e.face)) > deg(120);
    const horse = e.horse > 0 && m.kind !== "unhorse" && this.rng() < (missile ? 0.6 : by.horse > 0 ? 0.15 : 0.4);
    const through = horse ? 1 : armours[e.armour].through[m.hurt];
    const damage = Math.max(1, Math.round(m.damage * HARM * this.luck[by.side] * (through + (1 - through) * m.punch) * (riposte ? 2 : 1) * (open ? 1.25 : 1) * (behind ? (by.arm.family === "dagger" ? 1.8 : 1.3) : 1) * (0.9 + this.rng() * 0.2)));
    e.struck = this.time;
    const u = this.units.get(e.unit)!;
    if (behind && !missile) this.shake(u, 2);
    // Nobody stands to be shot at for long with nothing to shoot back.
    if (missile && (u.order === "hold" || u.order === "loose") && !u.manual && !u.routed && ++u.stung >= (e.shield === "none" ? 4 : 16) && !e.arm.shot && !e.other?.shot) {
      u.order = "charge";
      u.then = [];
      this.events.push({ kind: "order", unit: u.id, side: u.side, name: u.name, order: "charge" });
    }
    if (horse) {
      e.horse -= damage;
      this.events.push({ kind: "hit", ...at, damage, hurt: m.hurt, crit: false, killed: false, horse: true, dir: from + Math.PI });
      if (e.horse <= 0) this.unhorse(e, by);
      else e.speed *= 0.6;
      return;
    }
    e.hp -= damage;
    e.poise -= m.poise;
    if (damage >= 12) e.wounds.push(m.hurt);
    const killed = e.hp <= 0;
    this.events.push({ kind: "hit", ...at, damage, hurt: m.hurt, crit: riposte || (open && !missile), killed, horse: false, dir: from + Math.PI });
    if (killed) return this.kill(e, by);
    if (m.kind === "unhorse" && e.horse > 0) return this.unhorse(e, by);
    this.push(e, from + Math.PI, m.knock);
    if (m.floors && !e.horse) {
      this.set(e, "down", 1);
      e.drawT = 0;
      this.events.push({ kind: "down", ...at });
    } else if (e.poise <= 0 && !e.horse) this.stagger(e, 0.5);
    else if (e.horse > 0 && e.poise <= 0) e.speed *= 0.5;
  }

  private stagger(f: Fighter, seconds: number) {
    f.poise = armours[f.armour].poise;
    f.struck = this.time;
    f.drawT = 0;
    f.braced = false;
    f.swingHeld = false;
    if (f.act !== "down") this.set(f, "stagger", seconds);
  }
  private push(f: Fighter, dir: number, tiles: number) {
    if (f.horse > 0 || f.braced) return;
    f.vx += Math.cos(dir) * tiles * 6;
    f.vy += Math.sin(dir) * tiles * 6;
  }
  private unhorse(f: Fighter, by: Fighter) {
    f.horse = 0;
    f.speed = 0;
    f.hp -= 12;
    this.events.push({ kind: "unhorse", id: f.id, by: by.id, x: f.x, y: f.y });
    this.shake(this.units.get(f.unit)!, 4);
    if (f.hp <= 0) return this.kill(f, by);
    // A lance is no use on foot.
    if (f.arm.family === "lance" && f.other) [f.arm, f.other] = [f.other, f.rest.shift()];
    this.set(f, "down", 1.4);
  }
  private kill(f: Fighter, by: Fighter) {
    this.set(f, "dead", 0);
    f.vx = f.vy = f.speed = 0;
    f.guard = f.braced = false;
    this.events.push({ kind: "death", id: f.id, by: by.id, x: f.x, y: f.y });
    const u = this.units.get(f.unit)!;
    // Green troops break at about four in ten down, the best at three in four.
    this.shake(u, 100 / u.size / (0.2 + 0.65 * u.steady) / (1.45 - u.steady));
    const theirs = this.units.get(by.unit);
    if (theirs && !theirs.routed) theirs.morale = Math.min(100, theirs.morale + 3);
  }
  /** Take from a unit's nerve; at nothing it breaks and runs. A pair or a
   * handful fight it out: there is nobody to run with. */
  private shake(u: Unit, by: number) {
    if (u.routed || u.size <= 8) return;
    u.morale -= by * (1.45 - u.steady);
    if (u.morale > 0) return;
    u.routed = true;
    this.events.push({ kind: "rout", unit: u.id, side: u.side, name: u.name });
    for (const other of this.units.values()) if (other.side === u.side && other !== u) this.shake(other, 14);
  }

  // ------------------------------------------------------------- missiles

  private loose(f: Fighter, power: number, input: Input) {
    const shot = f.arm.shot!;
    const aimed = f.aimed ? 0.2 : 1;
    const error = (this.rng() - this.rng()) * shot.spread * aimed * (1.5 - f.skill) * (1 + f.suppress * 1.5) * (f.horse > 0 && f.speed > 2 ? 1.5 : 1);
    const dir = f.face + error;
    const damage = shot.damage * (0.45 + 0.55 * power) * (f.aimed ? 1.4 : 1);
    const range = shot.range * (0.5 + 0.5 * power);
    const kind = shootKind(f.arm);
    this.events.push({ kind: "shot", id: f.id, arm: f.arm.id, x: f.x, y: f.y, face: dir, smoke: !!shot.smoke });
    const far = input.aimDist ?? range;
    if (shot.blast) {
      const d = Math.max(2.5, Math.min(range, far));
      this.lob(f, "grenade", f.x + Math.cos(dir) * d, f.y + Math.sin(dir) * d, damage, shot.hurt, shot.speed, shot.blast);
    } else if (shot.lob && far > 5) {
      const d = Math.min(range, far) * (1 + (this.rng() - this.rng()) * 0.16 * (1.5 - f.skill));
      this.lob(f, kind, f.x + Math.cos(dir) * d, f.y + Math.sin(dir) * d, damage, shot.hurt, shot.speed);
    } else
      this.missiles.push({ n: this.serial++, by: f.id, side: f.side, kind, x: f.x + Math.cos(dir) * 0.5, y: f.y + Math.sin(dir) * 0.5, vx: Math.cos(dir) * shot.speed, vy: Math.sin(dir) * shot.speed, left: range, damage, hurt: shot.hurt, punch: f.arm.punch ?? 0, passed: new Set() });
    f.ammo[f.arm.id]--;
    f.loaded = false;
    f.reloadT = 0;
    if (shot.burst && f.burst === 0 && !f.aimed) f.burst = shot.burst - 1;
    if (f.burst > 0) f.loaded = true;
    if (shot.thrown && f.ammo[f.arm.id] <= 0 && f.other) [f.arm, f.other] = [f.other, f.rest.shift()];
  }
  private lob(f: Fighter, kind: ShotKind, tx: number, ty: number, damage: number, hurt: Hurt, speed: number, blast?: number) {
    const d = Math.hypot(tx - f.x, ty - f.y);
    this.missiles.push({ n: this.serial++, by: f.id, side: f.side, kind, x: f.x, y: f.y, vx: 0, vy: 0, left: 0, damage, hurt, punch: f.arm.punch ?? 0, blast, lob: { sx: f.x, sy: f.y, tx, ty, t: 0, T: Math.max(0.35, (d / speed) * 1.3) }, passed: new Set() });
  }

  private barrage() {
    const b = this.setup.barrage;
    if (b && this.time >= this.shellAt && this.time < b.until) {
      this.shellAt += b.every * (0.6 + this.rng() * 0.8);
      const x = b.zone[0] + this.rng() * (b.zone[2] - b.zone[0]), y = b.zone[1] + this.rng() * (b.zone[3] - b.zone[1]);
      this.shells.push({ x, y, at: this.time + 1.5 });
      this.events.push({ kind: "warn", x, y, radius: 2, fuse: 1.5 });
    }
    this.shells = this.shells.filter((s) => {
      if (s.at > this.time) return true;
      this.explode(s.x, s.y, 2, 85);
      return false;
    });
  }
  private explode(x: number, y: number, radius: number, damage: number, by?: Fighter) {
    this.events.push({ kind: "blast", x, y, radius });
    for (const e of this.fighters) {
      if (!this.alive(e)) continue;
      const d = Math.hypot(e.x - x, e.y - y);
      if (d > radius + 2) continue;
      e.suppress = 1;
      if (d > radius || this.clear(e)) continue;
      const cover = (e.prone ? 0.45 : 1) * (this.ground(e.x, e.y, "trench") ? 0.3 : 1);
      const hurt = Math.round(damage * (1 - (d / radius) * 0.7) * cover);
      e.hp -= hurt;
      e.struck = this.time;
      this.events.push({ kind: "hit", id: e.id, by: by?.id ?? "", x: e.x, y: e.y, damage: hurt, hurt: "crush", crit: false, killed: e.hp <= 0, horse: false, dir: Math.atan2(e.y - y, e.x - x) });
      if (e.hp <= 0) this.kill(e, by ?? e);
      else if (!e.horse) {
        this.push(e, Math.atan2(e.y - y, e.x - x), 1.5);
        this.set(e, "down", 1.1);
      }
      this.shake(this.units.get(e.unit)!, 2);
    }
  }

  private fly() {
    this.missiles = this.missiles.filter((s) => {
      const by = this.byId.get(s.by)!;
      if (s.lob) {
        const l = s.lob;
        l.t += STEP;
        const k = Math.min(1, l.t / l.T);
        s.x = l.sx + (l.tx - l.sx) * k;
        s.y = l.sy + (l.ty - l.sy) * k;
        if (k < 1) return true;
        const dir = Math.atan2(l.ty - l.sy, l.tx - l.sx);
        if (s.blast) return this.explode(s.x, s.y, s.blast, s.damage, by), false;
        const e = this.fighters.filter((x) => x.side !== s.side && this.alive(x) && Math.hypot(x.x - s.x, x.y - s.y) < this.radius(x) + 0.12)[0];
        if (!e || this.clear(e)) return this.events.push({ kind: "land", x: s.x, y: s.y, what: s.kind, dir }), false;
        // A shield over the head stops what falls on it; one at the side, less.
        const cover = this.time > e.hooked ? (shieldCover[e.shield] ?? 0) * (e.guard ? 1.35 : 0.5) : 0;
        if (this.rng() < cover) return this.events.push({ kind: "shield", id: e.id, by: s.by, x: e.x, y: e.y }), false;
        this.resolve(by, e, this.missileMove(s), true);
        return false;
      }
      for (let i = 0; i < 3; i++) {
        s.x += (s.vx * STEP) / 3;
        s.y += (s.vy * STEP) / 3;
        s.left -= (Math.hypot(s.vx, s.vy) * STEP) / 3;
        const dir = Math.atan2(s.vy, s.vx);
        if (s.left <= 0 || s.x < 0 || s.y < 0 || s.x > this.width || s.y > this.height || this.solid(s.x, s.y))
          return this.events.push({ kind: "land", x: s.x, y: s.y, what: s.kind, dir }), false;
        for (const e of this.fighters) {
          if (e.side === s.side || !this.alive(e) || s.passed.has(e.id)) continue;
          const d = Math.hypot(e.x - s.x, e.y - s.y);
          if (s.hurt === "ball" && d < 1.3) e.suppress = Math.min(1, e.suppress + 0.3);
          if (d > this.radius(e) + 0.08) continue;
          s.passed.add(e.id);
          const far = Math.hypot(by.x - e.x, by.y - e.y) > 2.5;
          if (this.clear(e) || (e.prone && far && this.rng() < 0.65) || (e.act === "down" && this.rng() < 0.6) || (far && this.ground(e.x, e.y, "trench") && this.rng() < 0.7)) continue;
          const facing = Math.abs(wrap(dir + Math.PI - e.face)) < deg(75);
          const cover = s.hurt !== "ball" && facing && this.time > e.hooked && e.act !== "windup" && e.act !== "strike" ? (shieldCover[e.shield] ?? 0) + (e.shield !== "none" && (e.guard || this.locked(e)) ? 0.25 : 0) : 0;
          if (this.rng() < cover) return this.events.push({ kind: "shield", id: e.id, by: s.by, x: e.x, y: e.y }), false;
          this.resolve(by, e, this.missileMove(s), true);
          return false;
        }
      }
      return true;
    });
  }
  /** Standing in line with shields together, as a unit told to hold does. */
  private locked(f: Fighter) {
    const u = this.units.get(f.unit)!;
    return f.act === "ready" && (u.order === "hold" || u.order === "loose") && Math.hypot(f.x - f.slot.x, f.y - f.slot.y) < 1;
  }
  private missileMove(s: Missile): Move {
    return { kind: "light", windup: 0, recover: 0, damage: s.damage, reach: 0, arc: 0, knock: s.hurt === "ball" ? 0.8 : 0.3, poise: s.hurt === "ball" ? 60 : 22, hurt: s.hurt, punch: s.punch };
  }

  // ------------------------------------------------------------- bodies

  private move() {
    const all = this.fighters.filter((f) => this.alive(f));
    for (const f of all) {
      const nx = f.x + f.vx * STEP, ny = f.y + f.vy * STEP;
      if (!this.solid(nx, f.y)) f.x = nx;
      else f.speed = 0;
      if (!this.solid(f.x, ny)) f.y = ny;
      const u = this.units.get(f.unit)!;
      if (u.routed && (f.x < 0.4 || f.x > this.width - 0.4)) this.set(f, "fled", 0);
      f.x = Math.max(0.3, Math.min(this.width - 0.3, f.x));
      f.y = Math.max(0.3, Math.min(this.height - 0.3, f.y));
      // Sharpened stakes stop a horse that a man walks between.
      if (f.horse > 0 && f.speed > 3 && f.air <= 0 && this.ground(f.x, f.y, "stakes")) {
        f.horse -= 70;
        f.speed = 0;
        this.events.push({ kind: "brace", id: f.id, by: "", x: f.x, y: f.y });
        if (f.horse <= 0) this.unhorse(f, f);
      }
      for (const [id, until] of f.met) if (until < this.time) f.met.delete(id);
    }
    for (let i = 0; i < all.length; i++)
      for (let j = i + 1; j < all.length; j++) {
        const a = all[i], b = all[j];
        const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 0.01;
        if (a.side !== b.side) {
          this.meet(a, b, d);
          this.meet(b, a, d);
        }
        const gap = this.radius(a) + this.radius(b) - d;
        if (gap <= 0 || a.act === "dead" || b.act === "dead") continue;
        // A horse shoulders men aside; men give way to each other equally.
        const wa = a.horse > 0 && !b.horse ? 0.15 : b.horse > 0 && !a.horse ? 0.85 : 0.5;
        const k = a.side === b.side ? 0.5 : 1;
        a.x -= (dx / d) * gap * wa * k;
        a.y -= (dy / d) * gap * wa * k;
        b.x += (dx / d) * gap * (1 - wa) * k;
        b.y += (dy / d) * gap * (1 - wa) * k;
      }
  }

  /** What happens as `a` comes at `b`: the braced point, the couched lance,
   * the horse's chest. */
  private meet(a: Fighter, b: Fighter, d: number) {
    if (a.act === "dead" || b.act === "dead") return;
    const toB = Math.atan2(b.y - a.y, b.x - a.x);
    const closing = (a.vx - b.vx) * Math.cos(toB) + (a.vy - b.vy) * Math.sin(toB);
    // b's braced point takes a's charge.
    if (b.braced && b.act === "ready" && this.time >= b.braceAt && closing > 2.4 && d - this.radius(a) <= b.arm.reach + 0.3 && Math.abs(wrap(toB + Math.PI - b.face)) < deg(40)) {
      b.braceAt = this.time + 0.9;
      this.spend(b, 6);
      this.events.push({ kind: "brace", id: a.id, by: b.id, x: a.x, y: a.y });
      const damage = b.arm.damage * (1 + closing * 0.5);
      if (a.horse > 0) {
        a.horse -= damage * 1.6;
        a.speed = 0;
        this.events.push({ kind: "hit", id: a.id, by: b.id, x: a.x, y: a.y, damage: Math.round(damage * 1.6), hurt: "thrust", crit: true, killed: false, horse: true, dir: toB + Math.PI });
        this.shake(this.units.get(a.unit)!, 5);
        if (a.horse <= 0) this.unhorse(a, b);
        else this.set(a, "stagger", 0.6);
      } else {
        this.resolve(b, a, { ...this.light(b), kind: "brace", damage, punch: 0.3, poise: 60 });
        a.vx = a.vy = 0;
      }
      return;
    }
    if (!(a.horse > 0) || a.speed < 3.6 || a.met.has(b.id) || a.act === "stagger") return;
    const ahead = Math.abs(wrap(toB - a.heading));
    if (a.arm.family === "lance" && a.act === "ready" && !a.met.has("lance") && ahead < deg(18) && d - this.radius(b) <= a.arm.reach) {
      a.met.set(b.id, this.time + 1.6);
      a.met.set("lance", this.time + 1.2);
      this.events.push({ kind: "swing", id: a.id, move: "couch", hurt: "thrust", reach: a.arm.reach, arc: 0.15, x: a.x, y: a.y, face: a.heading });
      this.resolve(a, b, { ...this.light(a), kind: "couch", damage: a.arm.damage * (1 + a.speed * a.arm.momentum!), floors: true, poise: 80 });
      this.shake(this.units.get(b.unit)!, b.braced ? 0 : 3);
    } else if (!b.horse && b.act !== "down" && ahead < deg(50) && d < HORSE_RADIUS + RADIUS + 0.05) {
      a.met.set(b.id, this.time + 1.2);
      a.speed *= 0.8;
      this.events.push({ kind: "trample", id: b.id, by: a.id, x: b.x, y: b.y });
      this.resolve(a, b, { kind: "light", windup: 0, recover: 0, damage: 5 + a.speed * 2.2, reach: 0, arc: 0, knock: 1.8, poise: 99, hurt: "crush", punch: 0.2, unblockable: true, floors: true });
      this.shake(this.units.get(b.unit)!, 3);
    }
  }

  // ------------------------------------------------------------- minds

  private nearest(f: Fighter) {
    let best: Fighter | undefined, at = Infinity;
    for (const e of this.fighters) {
      if (e.side === f.side || !this.alive(e)) continue;
      const d = Math.hypot(e.x - f.x, e.y - f.y) * (e.id === f.ai.foe ? 0.8 : 1) * (this.units.get(e.unit)!.routed ? 1.6 : 1);
      if (d < at) [best, at] = [e, d];
    }
    return best;
  }

  /** Whether there is an opening on `foe`: a crowd takes turns, as crowds do,
   * and it is what lets one good fighter hold off three. */
  private room(f: Fighter, foe: Fighter) {
    let busy = 0;
    for (const e of this.fighters) if (e !== f && e.side === f.side && e.ai.foe === foe.id && (e.act === "windup" || e.act === "strike")) busy++;
    return busy < (foe.riposte || foe.act === "stagger" ? 3 : 2);
  }

  /** What a fighter who is not the player does this instant. */
  private think(f: Fighter): Input {
    const out: Input = { mx: 0, my: 0, aim: f.face, attack: false, guard: false };
    const u = this.units.get(f.unit)!, now = this.time;
    const home = f.side ? 1 : -1;
    if (f.act === "jump") return { ...out, attack: !!f.ai.leap };
    f.ai.leap = false;
    if (u.routed) return { ...out, mx: home, my: 0, aim: home > 0 ? 0 : Math.PI };
    if (now >= f.ai.look || !f.ai.foe || !this.alive(this.byId.get(f.ai.foe)!)) {
      f.ai.foe = this.nearest(f)?.id;
      f.ai.look = now + 0.3 + this.rng() * 0.2;
    }
    const foe = f.ai.foe ? this.byId.get(f.ai.foe) : undefined;
    const slot = { x: f.slot.x - home * u.offset, y: f.slot.y };
    const go = (x: number, y: number, pace = 1) => {
      const dx = x - f.x, dy = y - f.y, d = Math.hypot(dx, dy);
      if (d < 0.15) return;
      out.mx = (dx / d) * pace * Math.min(1, d);
      out.my = (dy / d) * pace * Math.min(1, d);
    };
    if (!foe) return go(slot.x, slot.y, 0.6), out;
    const dx = foe.x - f.x, dy = foe.y - f.y, far = Math.hypot(dx, dy), d = far - this.radius(foe), dir = Math.atan2(dy, dx);
    out.aim = dir;
    out.aimDist = far;
    if (d < 3) u.contact = true;
    const held = u.order === "hold" || u.order === "loose";
    if (u.order === "fallback") return go(f.slot.x + home * 8, f.slot.y), { ...out, guard: d < 3 };

    // Which weapon suits the distance. A charge closes without stopping to
    // shoot, except to throw what is meant to be thrown on the way in.
    const ranged = (a: Arm) => !!a.shot && a.family !== "gun" && a.family !== "machine-gun" && (f.ammo[a.id] ?? 0) > 0;
    if (f.other && f.act === "ready" && !f.drawT) {
      const mine = ranged(f.arm), alt = ranged(f.other);
      const empty = !!f.arm.shot && !mine && f.arm.family !== "gun" && f.arm.family !== "machine-gun" && !f.other.shot;
      const tooClose = mine && !alt && d <= 2.8;
      const farEnough = !mine && alt && d > 4 && (f.other.shot!.thrown ? d < 8 : u.order !== "charge" || f.horse > 0);
      if (empty || tooClose || farEnough) return { ...out, swap: true };
    }
    const shot = f.arm.shot && (f.ammo[f.arm.id] ?? 0) > 0 ? f.arm.shot : undefined;

    // Answer a blow that is coming.
    const coming = (e: Fighter) =>
      e.act === "windup" ? { m: e.move!, left: e.move!.windup - e.t } : e.act === "jump" && e.plunge ? { m: this.plungeMove(e), left: e.until - e.t } : undefined;
    const threat = f.act === "ready" && !f.horse ? this.fighters.find((e) => {
      const c = e.side !== f.side ? coming(e) : undefined;
      return !!c && Math.hypot(e.x - f.x, e.y - f.y) - RADIUS <= c.m.reach + (c.m.lunge ?? 0) + (e.act === "jump" ? 1.5 : 0.3) && Math.abs(wrap(Math.atan2(f.y - e.y, f.x - e.x) - e.face)) <= c.m.arc + 0.3;
    }) : undefined;
    if (threat) {
      const { m, left } = coming(threat)!, key = `${threat.id}:${threat.swing}:${m.kind}`;
      if (f.ai.plan?.swing !== key) {
        const r = this.rng(), s = f.skill * (f.stamina < 25 ? 0.5 : 1) * (f.drawT ? 0.4 : 1);
        const what = m.unblockable ? (r < s * 0.75 ? "dodge" : "none") : r < s * 0.4 ? "parry" : r < s * 0.4 + 0.2 + s * 0.3 ? "block" : r < s + 0.25 ? (m.kind === "light" ? "none" : "dodge") : "none";
        f.ai.plan = { swing: key, what };
      }
      const plan = f.ai.plan.what;
      out.aim = Math.atan2(threat.y - f.y, threat.x - f.x);
      if (left <= 0.3) f.ai.foe = threat.id;
      if ((plan === "block" && left <= 0.3) || (plan === "parry" && left <= PARRY * 0.7)) return { ...out, guard: true };
      if (plan === "dodge" && left <= 0.17) return { ...out, jump: true, mx: Math.cos(out.aim + Math.PI * 0.6 * f.ai.strafe), my: Math.sin(out.aim + Math.PI * 0.6 * f.ai.strafe) };
    }
    // A parry leaves them open: hit back at once, and hard.
    if (f.riposte && f.riposte.until >= now && f.act === "ready") {
      f.ai.next = now;
      f.ai.heavy = false;
    }
    // Arrows coming down: get under the shield.
    if (f.shield !== "none" && f.act === "ready" && d > f.arm.reach + 1 && this.missiles.some((s) => s.lob && !s.blast && s.side !== f.side && s.lob.T - s.lob.t < 0.45 && Math.hypot(s.lob.tx - f.x, s.lob.ty - f.y) < 1.6))
      return { ...out, guard: true };

    if (f.arm.family === "machine-gun") {
      const front = f.side ? Math.PI : 0;
      out.attack = !!shot && far <= shot.range && Math.abs(wrap(dir - front)) < 1 && f.burst === 0;
      return out;
    }
    // Under fire in the open: get down, then up and on.
    const exposed = (f.arm.family === "gun" && f.suppress > 0.55 && d > 3 && !this.ground(f.x, f.y, "trench")) || now < f.ai.lieUntil;
    if (exposed) {
      if (now >= f.ai.lieUntil) f.ai.lieUntil = now + 0.8 + this.rng() * 1.2;
      out.guard = true;
    }

    if (shot && (!melee(f.arm) || d > 2.4 || f.arm.family === "gun")) {
      const R = shot.range * (shot.draw ? 0.95 : 1);
      const lead = shot.lob && far > 5 ? (far / shot.speed) * 1.3 : far / shot.speed;
      const ax = foe.x + foe.vx * lead * 0.8, ay = foe.y + foe.vy * lead * 0.8;
      out.aim = Math.atan2(ay - f.y, ax - f.x);
      // A fast target is shot at flat: an arrow lobbed at a horse lands behind it.
      out.aimDist = Math.hypot(foe.vx, foe.vy) > 3 ? 0 : Math.hypot(ax - f.x, ay - f.y);
      if (f.horse > 0 && !held) {
        // Ride round them at bowshot: in when far, away when near, and along
        // the edge of the field instead of into it.
        let ring = dir + f.ai.strafe * (far < R * 0.75 ? Math.PI - 0.5 : far > R * 0.95 ? 0.9 : Math.PI / 2);
        const ahead = (a: number) => { const x = f.x + Math.cos(a) * 5, y = f.y + Math.sin(a) * 5; return x > 1 && y > 1 && x < this.width - 1 && y < this.height - 1; };
        if (!ahead(ring)) ring = ahead(dir + (Math.PI / 2) * f.ai.strafe) ? dir + (Math.PI / 2) * f.ai.strafe : dir - (Math.PI / 2) * f.ai.strafe;
        out.mx = Math.cos(ring);
        out.my = Math.sin(ring);
      } else if (held) go(slot.x, slot.y, 0.7);
      else if (u.order === "skirmish") {
        if (far < R * 0.45) go(f.x - dx, f.y - dy);
        else if (far > R * 0.8) go(foe.x, foe.y, 0.8);
      } else if (far > R * (u.order === "charge" && f.arm.family === "gun" ? 0.3 : 0.75)) go(u.order === "advance" ? slot.x : foe.x, u.order === "advance" ? slot.y : foe.y, 0.8);
      if (far <= R && f.loaded && !exposed) {
        const volley = held && u.size > 3 && !shot.burst;
        if (shot.draw) out.attack = f.drawT < shot.draw * (0.7 + 0.3 * f.skill) && (!volley || f.drawT > 0 || now >= u.volleyAt - shot.draw);
        else out.attack = (!volley || now >= u.volleyAt) && Math.abs(wrap(out.aim - f.face)) < 0.12 && Math.hypot(f.vx, f.vy) < 1.5;
      }
      // A gun that is empty, with them this close, is a spear.
      if (f.arm.family === "gun" && !f.loaded && d < f.arm.reach && now >= f.ai.next) {
        out.attack = true;
        f.ai.next = now + 0.7;
      }
      if (f.arm.family === "gun" && !f.loaded && u.order === "charge") go(foe.x, foe.y);
      return out;
    }

    const reach = f.arm.reach, long = f.arm.family === "spear" || f.arm.family === "pike" || f.arm.family === "polearm";
    if (f.horse > 0) {
      if (held) return go(slot.x, slot.y, 0.6), out;
      // Ride through, carry on, come round again.
      if (now < f.ai.through) {
        out.mx = Math.cos(f.heading);
        out.my = Math.sin(f.heading);
      } else if (f.speed > 3 && far < 1.3) f.ai.through = now + 0.9 + this.rng() * 0.5;
      else go(foe.x + foe.vx * 0.3, foe.y + foe.vy * 0.3);
      if (d <= reach && now >= f.ai.next && (f.arm.family !== "lance" || f.speed < 3)) {
        out.attack = true;
        f.ai.next = now + 0.6 + this.rng() * 0.5;
      }
      if (f.arm.special === "couch" && far < 7 && far > 3 && f.speed > 4 && now >= f.cooldown && f.stamina > 50) out.special = true;
      return out;
    }

    // Winded: give ground behind a guard until the breath is back.
    if (f.stamina < 14) f.ai.rest = true;
    else if (f.stamina > 50) f.ai.rest = false;
    if (f.ai.rest && d < reach + 1.5) return go(f.x - dx, f.y - dy, 0.7), { ...out, guard: d < reach + 0.8 };

    const rider = this.fighters.some((e) => e.side !== f.side && e.horse > 0 && this.alive(e) && e.speed > 2.5 && Math.hypot(e.x - f.x, e.y - f.y) < 8);
    if (f.arm.special === "brace" && held && f.act === "ready" && now >= f.cooldown && f.braced !== (rider && Math.hypot(slot.x - f.x, slot.y - f.y) < 0.6)) out.special = true;
    if (f.braced) return out;

    const stay = held && Math.hypot(slot.x - foe.x, slot.y - foe.y) > reach + 2.5;
    if (stay) go(slot.x, slot.y, 0.7);
    else if (u.order === "advance" && d > 4) go(slot.x, slot.y, 0.75);
    else if (d > reach * 0.85) go(foe.x, foe.y);
    else if (long && d < reach * 0.45) go(f.x - dx, f.y - dy, 0.8);
    else {
      out.mx = Math.cos(dir + Math.PI / 2) * 0.25 * f.ai.strafe;
      out.my = Math.sin(dir + Math.PI / 2) * 0.25 * f.ai.strafe;
      if (this.rng() < 0.005) f.ai.strafe *= -1;
    }
    // Now and then, the gap is closed in the air.
    if (!held && !long && f.act === "ready" && d > reach + 0.5 && d < reach + 2 && f.stamina > 55 && now >= f.ai.next && this.rng() < 0.01 * f.skill) {
      f.ai.leap = true;
      f.ai.next = now + 1.5;
      return { ...out, jump: true, mx: Math.cos(dir), my: Math.sin(dir), attack: true };
    }
    // A wide swing is a blow and then the attack kept held until it is wound up.
    if (f.ai.heavy && (f.act !== "ready" || f.swingHeld)) {
      if (f.act === "charge" && f.t >= f.ai.hold) f.ai.heavy = false;
      else return { ...out, attack: true };
    }
    else if (d <= reach * 0.97 && now >= f.ai.next && f.act === "ready" && this.room(f, foe) && Math.abs(wrap(dir - f.face)) < Math.max(0.25, deg(f.arm.arc) * 0.6) && f.stamina > 22) {
      const r = this.rng(), s = f.arm.special;
      const crowd = this.fighters.filter((e) => e.side !== f.side && this.alive(e) && Math.hypot(e.x - f.x, e.y - f.y) < reach + 0.4).length;
      const fits = now >= f.cooldown && f.stamina >= COST.special + 10 && (
        s === "bash" || s === "hook" ? foe.guard || r < 0.12
        : s === "smash" || s === "throw" ? foe.guard || foe.act === "stagger" || r < 0.1
        : s === "sweep" ? crowd > 1 || r < 0.1
        : s === "unhorse" ? foe.horse > 0 || r < 0.1
        : s === "flurry" || s === "bayonet" ? r < 0.22
        : s === "lunge" ? r < 0.25
        : false);
      f.ai.next = now + 0.5 + (1 - f.skill) * 0.9 + this.rng() * 0.8;
      if (fits) return { ...out, special: true };
      f.ai.heavy = this.rng() < (crowd > 1 ? 0.35 : foe.guard ? 0.3 : 0.12);
      f.ai.hold = this.rng() < 0.3 + f.skill * 0.3 ? FULL + 0.05 : HALF + 0.05;
      out.attack = true;
    } else if ((f.arm.special === "lunge" || f.arm.special === "bayonet") && d > reach && d < reach + 1.3 && now >= f.cooldown && now >= f.ai.next && f.stamina > 60 && this.rng() < 0.03) out.special = true;
    return out;
  }
}

/** Draw a battle up: each unit in ranks at its place, facing the other side.
 * `player` puts the player in the front rank of one unit, or nowhere. */
export function muster(battle: Battle, seed: string, player: [0 | 1, number] | undefined = battle.player): Setup {
  const fighters: FighterSpec[] = [], units: Setup["units"][number][] = [];
  battle.sides.forEach((side, s) =>
    side.forEach((spec, n) => {
      const kit = kitById.get(spec.kit)!, id = `${s}-${n}`;
      const gap = spec.gap ?? (kit.mounted ? 1.6 : 1.3), files = Math.ceil(spec.count / spec.ranks), front = s ? -1 : 1;
      units.push({ id, side: s as 0 | 1, name: spec.name, order: spec.order, then: spec.then });
      for (let i = 0; i < spec.count; i++) {
        const rank = Math.floor(i / files), file = i % files;
        fighters.push({
          id: `${id}-${i}`, side: s as 0 | 1, unit: id, main: kit.main, sideArm: kit.side, mounted: kit.mounted, skill: kit.skill,
          pack: kit.more, armour: armourOf(kit.wear?.armour), shield: kit.wear?.shield ?? "none",
          x: spec.at[0] - front * rank * gap, y: spec.at[1] + (file - (Math.min(files, spec.count - rank * files) - 1) / 2) * gap,
          player: player?.[0] === s && player[1] === n && i === Math.floor((files - 1) / 2),
        });
      }
    }),
  );
  return { seed, width: battle.size[0], height: battle.size[1], terrain: battle.terrain, barrage: battle.barrage, fighters, units };
}

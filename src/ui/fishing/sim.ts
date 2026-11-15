import { biting, feedingAt, type FishKind, type FishingMethod, type FishingWater, type Hull } from "../../content/economy/fishing";
import type { SeasonId } from "../../core/season";

/** The fishing game's world, in its own native pixels. */
export const W = 320, H = 180;

export type Setup = {
  seed: string;
  method: FishingMethod;
  water: FishingWater;
  hull?: Hull;
  afloat: boolean;
  kinds: FishKind[];
  /** Hour of day the spell starts, 0-24. */
  hour: number;
  /** The season's run against an ordinary one; see seasonRun. */
  run: number;
  season: SeasonId;
  rain: number;
  wind: number;
  snow: boolean;
  mist: boolean;
  /** What a line can snag or a pot bring up besides fish, as item ids and names. */
  finds: { id: string; name: string; kg: number; weight: number }[];
  /** How many traps can be set, and whether a weir or a set net can. */
  sets: { pot: number; weir: boolean; net: boolean };
};

export type Gear = "line" | "net" | "seine" | "spear";
export const gearOf = (m: FishingMethod): Gear => m === "trap" ? "line" : m;

export type Fish = {
  id: number; kind: FishKind; kg: number;
  x: number; y: number; vx: number; vy: number;
  shoal: number; slot: [number, number]; phase: number;
  spooked: number; gone?: boolean; find?: string;
  /** 0 at the surface, 1 as deep as it goes here: how faint its shadow is. */
  depth: number;
};
export type Shoal = { id: number; x: number; y: number; tx: number; ty: number; appetite: number; leaving?: boolean; fade: number; retarget: number };
export type Ring = { x: number; y: number; r: number; max: number; life: number; age: number; light?: boolean };
export type Drop = { x: number; y: number; z: number; vx: number; vy: number; vz: number; life: number; color: number };
export type Leap = { fish: FishKind; x0: number; y0: number; x1: number; y1: number; age: number; dur: number; h: number };
export type Bird = { kind: "gull" | "tern" | "heron" | "egret"; x: number; y: number; vx: number; vy: number; z: number; phase: number; dive?: number; target?: number; standing?: boolean; strike?: number };
export type Landed = { kind: FishKind; kg: number; x: number; y: number; age: number; dur: number; spin: number; find?: string; stars?: number };
/** `stars` 2 for a perfect cast played clean, 1 for a tidy fight. `find` is an item, not a fish. */
export type Catch = { kind: FishKind; kg: number; best?: boolean; stars?: number; find?: string };
export type SetKind = "pot" | "weir" | "net";
export type Held = { kind: FishKind; kg: number; find?: string; dx: number; dy: number; ph: number };
export type SetGear = { id: number; kind: SetKind; x: number; y: number; holds: Held[]; twitch: number; haul?: number };
export type Cat = { x: number; y: number; mode: "walk" | "sit" | "eat" | "sleep" | "run"; t: number; tx: number; patience: number; nextMeow: number; dir: number };

/** What a snag on the line is drawn as until it comes out. */
const SNAG: FishKind = { name: "Snag", kg: [0.2, 2], fight: 0, back: 0x5a4a34, belly: 0x7a6a4a, fin: 0x3a2e20, shape: "long", style: "steady", note: "" };
export const SET_MAX: Record<SetKind, number> = { pot: 4, weir: 10, net: 8 };

export type GameEvent =
  | { type: "cast" | "plop" | "nibble" | "bite" | "strike" | "early" | "escape" | "snap" | "run" | "reel" | "net-throw" | "net-splash" | "haul" | "empty" | "spear" | "spear-miss" | "jump" | "gull" | "dive" | "perfect" | "tired" | "heron" | "set" | "haul-set" | "full" | "leap" | "snag" | "meow" | "purr" | "steal"; x?: number; y?: number; big?: boolean }
  | { type: "land"; catch: Catch };

type Phase =
  | { kind: "aim"; charging?: number }
  | { kind: "fly"; t: number; dur: number; x0: number; y0: number; x1: number; y1: number; perfect: boolean }
  | { kind: "wait"; x: number; y: number; since: number; curious?: number; nibbles: number; nextNibble: number; bite?: number; window: number; dip: number; perfect: boolean; stripped?: boolean; snag?: number }
  | { kind: "fight"; fish: Fish; d: number; angle: number; tension: number; stamina: number; run: number; rest: number; slack: number; x: number; y: number; thrash: number; perfect: boolean; peak: number; air?: number }
  | { kind: "reel"; t: number; x: number; y: number }
  | { kind: "net"; x: number; y: number; r: number; age: number; caught: Fish[]; hauling?: number; perfect: boolean }
  | { kind: "thrust"; t: number; x: number; y: number; hit?: Fish; done?: boolean; close?: boolean }
  | { kind: "recover"; t: number };

function mulberry(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
};
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const RANGE: Record<Gear, number> = { line: 132, net: 92, seine: 76, spear: 78 };
const NET_R: Record<Gear, number> = { line: 0, net: 20, seine: 36, spear: 0 };
/** Real seconds per minute on the water. */
export const MINUTE = 1;
export const MAX_MINUTES = 360;

export class FishingSim {
  readonly gear: Gear;
  readonly shoreY: number;
  readonly farY: number;
  readonly px = 160;
  readonly py: number;
  rand: () => number;
  t = 0;
  minutes = 0;
  aim = 0;
  /** Where the pointer is, in game pixels, while it is over the water. */
  pointer?: { x: number; y: number };
  holding = false;
  fish: Fish[] = [];
  shoals: Shoal[] = [];
  rings: Ring[] = [];
  drops: Drop[] = [];
  leaps: Leap[] = [];
  birds: Bird[] = [];
  landed: Landed[] = [];
  caught: Catch[] = [];
  sets: SetGear[] = [];
  /** A set gear waiting for a click on the water. */
  placing?: SetKind;
  cat?: Cat;
  private catAway = 0;
  private warnedLeap = false;
  events: GameEvent[] = [];
  phase: Phase = { kind: "aim" };
  pose: { name: "idle" | "cast" | "tug" | "spear-thrust" | "lift"; at: number } = { name: "idle", at: 0 };
  /** Shown over the player for a beat: a bite, a perfect cast, a snapped line. */
  shout?: { text: string; at: number; tone: "bite" | "good" | "bad" };
  hint = "";
  shake = 0;
  private nextId = 1;
  private nextShoal = 0;
  private luck: number;
  private refracted = false;

  constructor(readonly setup: Setup) {
    this.gear = gearOf(setup.method);
    this.rand = mulberry(hash(setup.seed));
    this.luck = this.rand();
    this.shoreY = setup.afloat ? H + 20 : 140;
    this.farY = setup.water === "sea" ? -12 : 16;
    this.py = setup.afloat ? 158 : 150;
    const n = this.gear === "spear" ? 3 : setup.water === "sea" ? 4 : 3;
    for (let i = 0; i < n; i++) this.spawnShoal(true);
    const sea = setup.water === "sea";
    for (let i = 0; i < (sea ? 2 : 1); i++)
      this.birds.push({ kind: sea ? "tern" : "tern", x: this.rand() * W, y: 30 + this.rand() * 40, vx: 0, vy: 0, z: 26, phase: this.rand() * 6 });
    if (!sea && !setup.afloat) this.birds.push({ kind: setup.water === "lake" || this.rand() < 0.5 ? "heron" : "egret", x: this.rand() < 0.5 ? 22 : 298, y: this.shoreY - 6, vx: 0, vy: 0, z: 0, phase: 0, standing: true });
  }

  get hand() {
    return { x: this.px + 6, y: this.py - 24 };
  }
  get hour() {
    return (this.setup.hour + this.minutes / 60) % 24;
  }
  /** How keen the fish are right now, around 1 on an ordinary hour. */
  get feeding() {
    const s = this.setup;
    const weather = s.rain > 0.75 ? 0.8 : s.rain > 0 || s.mist ? 1.12 : 1;
    return feedingAt(this.hour) * s.run * weather * (0.85 + this.luck * 0.3);
  }
  get count() {
    return this.caught.filter((c) => !c.find).length;
  }
  get kg() {
    return this.caught.reduce((n, c) => n + (c.find ? 0 : c.kg), 0);
  }

  /** Water from here to the far side, 0 at the near edge. */
  depthAt(y: number) {
    const near = this.setup.afloat ? H - 30 : this.shoreY;
    const span = near - Math.max(0, this.farY);
    const t = clamp((near - y) / span, 0, 1);
    return this.setup.water === "sea" ? Math.pow(t, 0.7) : Math.sin(t * Math.PI) * 0.85 + t * 0.15;
  }
  wet(x: number, y: number) {
    return x > -8 && x < W + 8 && y > this.farY + 4 && y < this.shoreY - 3;
  }

  /** Where shoals keep to: out of reach of a line is fine, but a net or a spear has to get to them. */
  private band() {
    const near = Math.min(this.shoreY - 12, this.hand.y + 4);
    if (this.gear === "spear") return { x0: 60, x1: W - 60, y0: near - 52, y1: near - 6 };
    if (this.gear === "line") return { x0: 24, x1: W - 24, y0: Math.max(this.farY + 14, 12), y1: near - 22 };
    return { x0: 40, x1: W - 40, y0: Math.max(this.farY + 14, near - RANGE[this.gear] * 0.8), y1: near - 22 };
  }
  private spawnShoal(initial = false) {
    const s = this.setup, r = this.rand;
    const spear = this.gear === "spear";
    const { x0, x1, y0: yLo, y1: yHi } = this.band();
    const id = this.nextShoal++;
    const x = initial ? lerp(x0, x1, r()) : r() < 0.5 ? -20 : W + 20;
    const y = lerp(yLo, yHi, r());
    const shoal: Shoal = { id, x, y, tx: lerp(x0, x1, r()), ty: lerp(yLo, yHi, r()), appetite: 0.5 + r() * 0.7, fade: initial ? 1 : 0, retarget: 4 + r() * 6 };
    this.shoals.push(shoal);
    // A shoal is one kind of fish; a rare big one keeps to itself in deep water.
    const about = this.about(false);
    const common = about.filter((k) => !k.rare).length ? about.filter((k) => !k.rare) : s.kinds.filter((k) => !k.rare && !k.trap);
    const rare = about.filter((k) => k.rare);
    const deep = this.depthAt(y) > 0.55;
    const lone = rare.length && deep && !spear && r() < 0.22;
    const kind = lone ? rare[Math.floor(r() * rare.length)] : common[Math.floor(r() * common.length)] ?? s.kinds[0];
    const big = kind.kg[0] >= 3;
    const n = lone ? 1 : big ? 2 + Math.floor(r() * 3) : 4 + Math.floor(r() * 6);
    for (let i = 0; i < n; i++) {
      const a = r() * Math.PI * 2, rr = lone ? 0 : 3 + r() * (big ? 10 : 14);
      const depth = this.depthAt(y);
      const kg = +lerp(kind.kg[0], kind.kg[1], Math.pow(r(), 2.2 - depth)).toFixed(2);
      this.fish.push({
        id: this.nextId++, kind, kg, x: x + Math.cos(a) * rr, y: y + Math.sin(a) * rr * 0.6, vx: 0, vy: 0,
        shoal: id, slot: [Math.cos(a) * rr, Math.sin(a) * rr * 0.6], phase: r() * 6, spooked: 0,
        depth: clamp(depth * (spear ? 0.5 : 1) + (r() - 0.5) * 0.2, 0.05, 1),
      });
    }
  }

  /** Kinds about at this hour, season and weather: those a line takes, or those a trap does. */
  about(trap: boolean) {
    const s = this.setup;
    return s.kinds.filter((k) => !!k.trap === trap && biting(k, this.hour, s.season, s.rain));
  }
  private ring(x: number, y: number, max: number, life = 0.9, light = false) {
    this.rings.push({ x, y, r: 1, max, life, age: 0, light });
  }
  private splash(x: number, y: number, n: number, power = 1, color = 0xe8f4f2) {
    for (let i = 0; i < n; i++) {
      const a = this.rand() * Math.PI * 2;
      this.drops.push({ x, y, z: 0, vx: Math.cos(a) * 18 * power * this.rand(), vy: Math.sin(a) * 9 * power * this.rand(), vz: (30 + this.rand() * 40) * power, life: 1, color });
    }
  }
  private spook(x: number, y: number, radius: number, except?: Set<Fish>) {
    for (const f of this.fish) {
      if (f.gone || except?.has(f)) continue;
      const d = Math.hypot(f.x - x, f.y - y);
      if (d > radius) continue;
      f.spooked = 1.4 + this.rand() * 0.8;
      const k = 90 / Math.max(4, d);
      f.vx = ((f.x - x) / Math.max(1, d)) * k * 4;
      f.vy = ((f.y - y) / Math.max(1, d)) * k * 2;
      const sh = this.shoals.find((s) => s.id === f.shoal);
      if (sh && !sh.leaving) {
        const b = this.band();
        sh.tx = clamp(sh.x + (sh.x - x) * 2.5, b.x0, b.x1);
        sh.ty = clamp(sh.y + (sh.y - y) * 1.2, b.y0, b.y1);
        sh.appetite *= 0.75;
      }
    }
  }
  private say(text: string, tone: "bite" | "good" | "bad") {
    this.shout = { text, at: this.t, tone };
  }
  private setPose(name: FishingSim["pose"]["name"]) {
    this.pose = { name, at: this.t };
  }

  /** Where a cast at this power would land. */
  target(power: number) {
    const range = RANGE[this.gear];
    const d = 26 + power * (range - 26);
    const h = this.hand;
    const x = clamp(h.x + Math.sin(this.aim) * d, 6, W - 6);
    const y = clamp(h.y - Math.cos(this.aim) * d * 0.85, this.farY + 8, this.shoreY - 10);
    return { x, y };
  }
  /** 0 to 1 and back while the button is held. */
  power() {
    const p = this.phase;
    if (p.kind !== "aim" || p.charging === undefined) return 0;
    const u = ((this.t - p.charging) / 1.15) % 2;
    return u < 1 ? u : 2 - u;
  }
  spearPoint() {
    const h = { x: this.px, y: this.py - 12 };
    const want = this.pointer ?? { x: h.x + Math.sin(this.aim) * 40, y: h.y - Math.cos(this.aim) * 40 };
    const dx = want.x - h.x, dy = want.y - h.y, d = Math.hypot(dx, dy);
    const k = d > RANGE.spear ? RANGE.spear / d : 1;
    return { x: h.x + dx * k, y: clamp(h.y + dy * k, this.farY + 8, this.shoreY - 4) };
  }

  /** `at` is where a click landed; the keyboard presses without one. */
  press(at?: { x: number; y: number }) {
    this.holding = true;
    const p = this.phase;
    if (p.kind === "aim") {
      if (this.placing) {
        if (at) this.place(this.placing, at.x, at.y);
        this.holding = false;
        return;
      }
      const cat = this.cat;
      if (at && cat && cat.mode === "sit" && Math.hypot(at.x - cat.x, at.y - cat.y + 4) < 10) {
        this.holding = false;
        return this.feedCat();
      }
      const set = at && this.sets.find((g) => g.haul === undefined && Math.hypot(at.x - g.x, at.y - g.y) < (g.kind === "net" ? 24 : 11));
      if (set) {
        this.holding = false;
        return this.haul(set);
      }
      if (this.gear === "spear") return this.thrust();
      p.charging = this.t;
      return;
    }
    if (p.kind === "wait") {
      if (p.bite !== undefined && this.t - p.bite <= p.window && p.snag !== undefined) {
        const find = this.setup.finds[p.snag];
        const fish: Fish = { id: -1, kind: SNAG, kg: find.kg, x: p.x, y: p.y, vx: 0, vy: 0, shoal: -1, slot: [0, 0], phase: 0, spooked: 0, depth: 0.5, find: find.id };
        this.events.push({ type: "snag", x: p.x, y: p.y });
        this.say("Snagged something…", "good");
        this.setPose("tug");
        const d = Math.hypot(p.x - this.hand.x, p.y - this.hand.y);
        this.phase = { kind: "fight", fish, d, angle: Math.atan2(p.x - this.hand.x, this.hand.y - p.y), tension: 0.1, stamina: 0, run: 0, rest: 99, slack: 0, x: p.x, y: p.y, thrash: 0, perfect: false, peak: 0 };
        return;
      }
      if (p.bite !== undefined && this.t - p.bite <= p.window && p.curious !== undefined) {
        const fish = this.fish.find((f) => f.id === p.curious);
        if (fish) {
          this.events.push({ type: "strike", x: p.x, y: p.y, big: fish.kg > 3 });
          this.say("Hooked!", "good");
          this.setPose("tug");
          const d = Math.hypot(p.x - this.hand.x, p.y - this.hand.y);
          const stamina = 0.6 + fish.kind.fight * 3.2 + Math.log(fish.kg + 1) * 1.1;
          this.phase = { kind: "fight", fish, d, angle: Math.atan2(p.x - this.hand.x, this.hand.y - p.y), tension: 0.15, stamina, run: 0.6, rest: 0, slack: 0, x: p.x, y: p.y, thrash: 0, perfect: p.perfect, peak: 0 };
          this.shake = 0.25;
          return;
        }
      }
      if (p.curious !== undefined && !p.stripped) {
        const fish = this.fish.find((f) => f.id === p.curious);
        if (fish) {
          fish.spooked = 1.5;
          this.events.push({ type: "early", x: p.x, y: p.y });
          this.say(this.rand() < 0.5 ? "Too soon" : "Bait stolen", "bad");
        }
      }
      this.phase = { kind: "reel", t: 0, x: p.x, y: p.y };
      this.events.push({ type: "reel" });
      return;
    }
    if (p.kind === "net" && p.age > 0.9 && p.hauling === undefined) {
      p.hauling = 0;
      this.setPose("tug");
      this.events.push({ type: "haul" });
    }
  }
  release() {
    this.holding = false;
    const p = this.phase;
    if (p.kind !== "aim" || p.charging === undefined) return;
    const power = this.power();
    const perfect = power > 0.92;
    const to = this.target(power);
    const h = this.hand;
    const dist = Math.hypot(to.x - h.x, to.y - h.y);
    this.phase = { kind: "fly", t: 0, dur: 0.32 + dist / 380, x0: h.x, y0: h.y, x1: to.x, y1: to.y, perfect };
    this.setPose("cast");
    this.events.push({ type: this.gear === "line" ? "cast" : "net-throw" });
    if (perfect) {
      this.events.push({ type: "perfect" });
      this.say("Perfect cast!", "good");
    }
  }
  private thrust() {
    const at = this.spearPoint();
    this.phase = { kind: "thrust", t: 0, x: at.x, y: at.y };
    this.setPose("spear-thrust");
    this.events.push({ type: "spear", x: at.x, y: at.y });
  }

  update(dt: number) {
    dt = Math.min(dt, 0.05);
    this.t += dt;
    this.minutes += dt / MINUTE;
    this.shake = Math.max(0, this.shake - dt);
    this.updateShoals(dt);
    this.updateFish(dt);
    this.updatePhase(dt);
    this.updateLife(dt);
    this.updateSets(dt);
    this.updateCat(dt);
    this.updateFx(dt);
    this.hint = this.hintNow();
  }

  private updateShoals(dt: number) {
    const r = this.rand;
    for (const s of this.shoals) {
      s.fade = clamp(s.fade + dt * (s.leaving ? -0.5 : 0.6), 0, 1);
      s.retarget -= dt;
      const members = this.fish.filter((f) => f.shoal === s.id && !f.gone);
      if (!members.length && !s.leaving) s.leaving = true;
      if (s.retarget <= 0 && !s.leaving) {
        const b = this.band();
        s.tx = clamp(s.x + (r() - 0.5) * 140, b.x0, b.x1);
        s.ty = clamp(s.y + (r() - 0.5) * 50, b.y0, b.y1);
        s.retarget = 5 + r() * 8;
        s.appetite = clamp(s.appetite + (r() - 0.45) * 0.3, 0.2, 1.3);
      }
      if (s.leaving) s.tx = s.x < W / 2 ? -60 : W + 60;
      const dx = s.tx - s.x, dy = s.ty - s.y, d = Math.hypot(dx, dy);
      const speed = s.leaving ? 22 : 7;
      if (d > 1) {
        s.x += (dx / d) * Math.min(d, speed * dt);
        s.y += (dy / d) * Math.min(d, speed * dt * 0.7);
      }
    }
    for (const s of this.shoals.filter((s) => s.leaving && (s.x < -50 || s.x > W + 50)))
      for (const f of this.fish) if (f.shoal === s.id) f.gone = true;
    this.shoals = this.shoals.filter((s) => !(s.leaving && (s.x < -50 || s.x > W + 50)));
    this.fish = this.fish.filter((f) => !f.gone);
    // Fewer shoals in a slack hour; more come in on the feed.
    const want = Math.round((this.gear === "spear" ? 2.6 : this.setup.water === "sea" ? 3.6 : 2.8) * clamp(this.feeding, 0.6, 1.4));
    if (this.shoals.filter((s) => !s.leaving).length < want && r() < dt * 0.12) this.spawnShoal();
  }

  private updateFish(dt: number) {
    const ph = this.phase;
    const lure = ph.kind === "wait" && !ph.stripped ? ph : undefined;
    for (const f of this.fish) {
      if (ph.kind === "fight" && ph.fish === f) continue;
      if (ph.kind === "net" && ph.caught.includes(f)) continue;
      if (ph.kind === "thrust" && ph.hit === f) continue;
      f.phase += dt * (6 + Math.hypot(f.vx, f.vy) * 0.2);
      const s = this.shoals.find((x) => x.id === f.shoal);
      let ax = 0, ay = 0;
      if (lure && lure.curious === f.id) {
        // Nose up to the bait, then hang there.
        const tx = lure.x + Math.cos(f.phase * 0.2) * 2, ty = lure.y + 2;
        ax = (tx - f.x) * 3 - f.vx * 2.5;
        ay = (ty - f.y) * 3 - f.vy * 2.5;
      } else if (f.spooked > 0) {
        f.spooked -= dt;
        ax = -f.vx * 0.6;
        ay = -f.vy * 0.6;
      } else if (s) {
        const wob = Math.sin(this.t * 0.7 + f.id) * 3;
        const tx = s.x + f.slot[0] + wob, ty = s.y + f.slot[1] + Math.cos(this.t * 0.5 + f.id) * 2;
        ax = (tx - f.x) * 1.4 - f.vx * 1.6;
        ay = (ty - f.y) * 1.4 - f.vy * 1.6;
      }
      f.vx += ax * dt;
      f.vy += ay * dt;
      const sp = Math.hypot(f.vx, f.vy), max = f.spooked > 0 ? 90 : 28;
      if (sp > max) { f.vx *= max / sp; f.vy *= max / sp; }
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      if (f.y > this.shoreY - 6) { f.y = this.shoreY - 6; f.vy = -Math.abs(f.vy); }
      if (f.y < this.farY + 6) { f.y = this.farY + 6; f.vy = Math.abs(f.vy); }
    }
  }

  private updatePhase(dt: number) {
    const p = this.phase;
    if (p.kind === "fly") {
      p.t += dt;
      if (p.t >= p.dur) this.landGear(p);
      return;
    }
    if (p.kind === "wait") return this.updateWait(p, dt);
    if (p.kind === "fight") return this.updateFight(p, dt);
    if (p.kind === "reel") {
      p.t += dt;
      const h = this.hand, k = Math.min(1, dt * 5);
      p.x = lerp(p.x, h.x, k);
      p.y = lerp(p.y, h.y + 4, k);
      if (p.t > 0.45) this.phase = { kind: "aim" };
      return;
    }
    if (p.kind === "net") return this.updateNet(p, dt);
    if (p.kind === "thrust") {
      p.t += dt;
      if (p.t >= 0.1 && !p.done) {
        p.done = true;
        const best = this.fish
          .map((f) => ({ f, d: Math.hypot(f.x - p.x, f.y + 3 + f.depth * 5 - p.y) }))
          .filter(({ f, d }) => d < 5 + Math.min(2, f.kg / 3))
          .sort((a, b) => a.d - b.d)[0];
        const hit = best?.f;
        p.close = !!best && best.d < 2.2;
        this.splash(p.x, p.y, hit ? 10 : 7, hit ? 1.1 : 0.8);
        this.ring(p.x, p.y, 12);
        if (hit) {
          p.hit = hit;
          this.events.push({ type: "strike", x: p.x, y: p.y, big: hit.kg > 3 });
          this.say("Got one!", "good");
          this.spook(p.x, p.y, 26, new Set([hit]));
        } else {
          this.events.push({ type: "spear-miss", x: p.x, y: p.y });
          this.spook(p.x, p.y, 24);
          const near = this.fish.some((f) => Math.hypot(f.x - p.x, f.y - p.y) < 8);
          if (near && !this.refracted) {
            this.refracted = true;
            this.say("Strike below it", "bad");
          }
        }
      }
      if (p.t > 0.55) {
        if (p.hit) this.land(p.hit, p.x, p.y, 0, p.close ? 1 : 0);
        this.phase = { kind: "recover", t: 0 };
      }
      return;
    }
    if (p.kind === "recover") {
      p.t += dt;
      if (p.t > 0.25) this.phase = { kind: "aim" };
    }
  }

  private landGear(p: Extract<Phase, { kind: "fly" }>) {
    if (this.gear === "line") {
      this.splash(p.x1, p.y1, p.perfect ? 3 : 6, 0.5);
      this.ring(p.x1, p.y1, p.perfect ? 7 : 11);
      this.events.push({ type: "plop", x: p.x1, y: p.y1 });
      // A heavy landing right on top of them sends them off.
      if (!p.perfect) this.spook(p.x1, p.y1, 9);
      const snag = this.setup.finds.length && this.rand() < 0.04 ? this.pickFind() : undefined;
      this.phase = { kind: "wait", x: p.x1, y: p.y1, since: this.t, nibbles: 0, nextNibble: 0, window: 0.7, dip: 0, perfect: p.perfect, ...(snag !== undefined ? { snag } : {}) };
      this.setPose("idle");
      return;
    }
    const r = NET_R[this.gear];
    this.splash(p.x1, p.y1, 16, 1.1);
    this.ring(p.x1, p.y1, r + 6, 1.1);
    this.ring(p.x1, p.y1, r - 2, 0.8, true);
    this.events.push({ type: "net-splash", x: p.x1, y: p.y1, big: this.gear === "seine" });
    const inside = new Set(this.fish.filter((f) => Math.hypot(f.x - p.x1, (f.y - p.y1) / 0.6) < r && f.spooked <= 0));
    const caught = [...inside].filter(() => this.rand() < (this.gear === "seine" ? 0.9 : 0.78) + (p.perfect ? 0.1 : 0));
    this.spook(p.x1, p.y1, r + 30, new Set(caught));
    this.phase = { kind: "net", x: p.x1, y: p.y1, r, age: 0, caught, perfect: p.perfect };
    this.setPose("idle");
  }

  private updateWait(p: Extract<Phase, { kind: "wait" }>, dt: number) {
    p.dip = Math.max(0, p.dip - dt * 6);
    if (p.stripped) return;
    if (p.snag !== undefined) {
      // Not a fish: the float just goes under and stays there.
      if (p.bite === undefined && this.t - p.since > 2.5) {
        p.bite = this.t;
        p.window = 2.5;
        p.dip = 1;
        this.ring(p.x, p.y, 6, 0.6);
        this.events.push({ type: "bite", x: p.x, y: p.y });
        this.say("!", "bite");
      } else if (p.bite !== undefined && this.t - p.bite > p.window) {
        p.snag = undefined;
        p.bite = undefined;
        p.since = this.t;
      }
      if (p.bite !== undefined) p.dip = 1;
      return;
    }
    const feeding = this.feeding;
    if (p.curious === undefined) {
      // A fish nearby, hungry enough, comes to look.
      const near = this.fish.filter((f) => f.spooked <= 0 && Math.hypot(f.x - p.x, f.y - p.y) < 34);
      const keen = near.reduce((n, f) => n + (this.shoals.find((s) => s.id === f.shoal)?.appetite ?? 0.5), 0);
      if (near.length && this.rand() < dt * (0.25 + 0.12 * keen) * feeding * (p.perfect ? 1.3 : 1)) {
        const f = near[Math.floor(this.rand() * near.length)];
        p.curious = f.id;
        p.nibbles = f.kg > 4 ? Math.floor(this.rand() * 2) : 1 + Math.floor(this.rand() * 3);
        p.nextNibble = this.t + 1.2 + this.rand() * 1.4;
        p.window = 0.78 - f.kind.fight * 0.22 + (p.perfect ? 0.12 : 0);
      }
      return;
    }
    const f = this.fish.find((x) => x.id === p.curious);
    if (!f || f.spooked > 0) {
      p.curious = undefined;
      p.bite = undefined;
      return;
    }
    if (p.bite !== undefined) {
      if (this.t - p.bite > p.window) {
        this.events.push({ type: "escape" });
        this.say("It took the bait", "bad");
        f.spooked = 1.2;
        p.stripped = true;
        p.curious = undefined;
        p.bite = undefined;
      }
      return;
    }
    if (this.t < p.nextNibble || Math.hypot(f.x - p.x, f.y - p.y - 2) > 5) return;
    if (p.nibbles > 0) {
      p.nibbles--;
      p.dip = 0.5;
      this.ring(p.x, p.y, 4, 0.5, true);
      this.events.push({ type: "nibble", x: p.x, y: p.y });
      p.nextNibble = this.t + 0.45 + this.rand() * 0.9;
      return;
    }
    p.bite = this.t;
    p.dip = 1;
    this.splash(p.x, p.y, 5, 0.6);
    this.ring(p.x, p.y, 10, 0.7);
    this.events.push({ type: "bite", x: p.x, y: p.y, big: f.kg > 3 });
    this.say("!", "bite");
  }

  private updateFight(p: Extract<Phase, { kind: "fight" }>, dt: number) {
    const f = p.fish, fight = f.kind.fight, heavy = Math.log(f.kg + 1), style = f.kind.style;
    const tired = p.stamina <= 0;
    // Darters make short, sharp, frequent runs; sinkers bore off slow and long.
    const runFor = style === "dart" ? 0.25 + this.rand() * 0.4 : style === "sink" ? 0.8 + this.rand() * (0.8 + fight) : 0.4 + this.rand() * (0.6 + fight);
    const restFor = style === "dart" ? 0.3 + this.rand() * 0.5 : 0.6 + this.rand() * 1.1;
    if (p.run > 0) {
      p.run -= dt;
      if (p.run <= 0) p.rest = restFor * (tired ? 3 : 1);
      // A leaper comes clear of the water mid-run: hauling then snaps the line.
      if (style === "leap" && p.air === undefined && !tired && this.rand() < dt * 1.3) {
        p.air = 0;
        const dir = Math.sin(p.angle) > 0 ? 1 : -1;
        this.leaps.push({ fish: f.kind, x0: p.x, y0: p.y, x1: p.x + dir * (8 + this.rand() * 6), y1: p.y, age: 0, dur: 0.6, h: 12 + Math.min(10, f.kg) });
        this.splash(p.x, p.y, 8, 1);
        this.events.push({ type: "leap", x: p.x, y: p.y, big: f.kg > 3 });
        if (!this.warnedLeap) {
          this.warnedLeap = true;
          this.say("It's jumping! Let go!", "bite");
        }
      }
    } else {
      p.rest -= dt;
      if (p.rest <= 0 && !tired) {
        p.run = runFor;
        p.angle += (this.rand() - 0.5) * (style === "dart" ? 2.2 : style === "sink" ? 0.5 : 1.4);
        this.events.push({ type: "run", x: p.x, y: p.y, big: f.kg > 3 });
        if (f.kg > 2) this.shake = Math.max(this.shake, 0.18);
      }
    }
    if (p.air !== undefined) {
      p.air += dt;
      if (p.air > 0.6) p.air = undefined;
    }
    p.angle = clamp(p.angle, -1.2, 1.2);
    const running = p.run > 0;
    const pull = (26 + fight * 46 + heavy * 6) * (tired ? 0.2 : 1) * (style === "sink" ? 1.25 : 1);
    if (this.holding) {
      p.d -= (running ? 6 : 34 + (tired ? 14 : 0)) * dt;
      p.tension += (running ? (0.55 + fight * 0.9 + heavy * 0.12) * (style === "sink" ? 1.2 : 1) : 0.06) * dt * 0.85;
      if (p.air !== undefined) p.tension += dt * 2.4;
      p.stamina -= dt * 1.35;
      p.slack = 0;
    } else {
      if (running) p.d += pull * dt * 0.55;
      p.tension -= dt * (running ? 0.35 : 0.9);
      p.stamina -= dt * 0.55;
      p.slack += dt;
    }
    p.tension = clamp(p.tension, 0, 1.05);
    p.peak = Math.max(p.peak, p.tension);
    p.d = clamp(p.d, 0, 150);
    const h = this.hand;
    p.x = h.x + Math.sin(p.angle) * p.d;
    p.y = Math.max(this.farY + 8, h.y - Math.cos(p.angle) * p.d * 0.85);
    if (p.y > this.shoreY - 8) p.y = this.shoreY - 8;
    f.x = p.x;
    f.y = p.y;
    p.thrash -= dt;
    if (running && p.thrash <= 0) {
      p.thrash = 0.12;
      this.splash(p.x, p.y, 2, 0.6);
      this.ring(p.x, p.y, 5 + Math.min(6, f.kg), 0.5);
    }
    if (p.stamina <= 0 && p.stamina > -dt * 1.4) this.events.push({ type: "tired" });
    if (p.tension >= 1) {
      this.events.push({ type: "snap", x: p.x, y: p.y });
      this.say("Snapped!", "bad");
      this.shake = 0.3;
      f.spooked = 2;
      this.phase = { kind: "recover", t: -0.6 };
      this.setPose("idle");
      return;
    }
    if (p.slack > 2.4 && !tired && this.rand() < dt * 1.2) {
      this.events.push({ type: "escape" });
      this.say("Thrown the hook", "bad");
      f.spooked = 2;
      this.phase = { kind: "reel", t: 0, x: p.x, y: p.y };
      return;
    }
    if (p.d <= 12) {
      this.land(f, p.x, p.y, 0, f.find ? 0 : p.perfect && p.peak < 0.7 ? 2 : p.peak < 0.82 ? 1 : 0);
      this.phase = { kind: "recover", t: 0 };
    }
  }

  private updateNet(p: Extract<Phase, { kind: "net" }>, dt: number) {
    p.age += dt;
    if (p.hauling === undefined) {
      // While it sinks, fish that blunder in are trapped too.
      if (p.age < 1.2)
        for (const f of this.fish)
          if (!p.caught.includes(f) && f.spooked <= 0 && Math.hypot(f.x - p.x, (f.y - p.y) / 0.6) < p.r && this.rand() < dt * 0.6)
            p.caught.push(f);
      for (const [i, f] of p.caught.entries()) {
        const a = this.t * 3 + i * 2.1;
        f.x = p.x + Math.cos(a) * p.r * 0.45 * ((i % 3) + 1) / 3;
        f.y = p.y + Math.sin(a) * p.r * 0.25;
      }
      return;
    }
    p.hauling += dt;
    const dur = this.gear === "seine" ? 1.5 : 0.9;
    const k = Math.min(1, p.hauling / dur), h = this.hand;
    const x = lerp(p.x, h.x, k * k), y = lerp(p.y, h.y + 8, k * k);
    for (const [i, f] of p.caught.entries()) {
      f.x = x + Math.cos(this.t * 9 + i) * p.r * 0.3 * (1 - k);
      f.y = y + Math.sin(this.t * 7 + i) * p.r * 0.2 * (1 - k);
    }
    if (this.rand() < dt * 8) this.ring(x, y, p.r * (1 - k * 0.7), 0.5, true);
    if (k < 1) return;
    if (!p.caught.length) {
      this.events.push({ type: "empty" });
      this.say("Empty net", "bad");
    }
    for (const [i, f] of p.caught.entries()) this.land(f, h.x + (i % 5) * 3 - 6, h.y + 6, i * 0.09, p.perfect ? 1 : 0);
    this.phase = { kind: "recover", t: -0.35 };
  }

  /** Gear of this kind still to set, of what the place allows. */
  left(kind: SetKind) {
    const n = this.sets.filter((g) => g.kind === kind).length, a = this.setup.sets;
    return Math.max(0, (kind === "pot" ? a.pot : kind === "weir" ? +a.weir : +a.net) - n);
  }
  /** Where a set would go if dropped at x, y: a weir stands in the shallows off the bank. */
  spot(kind: SetKind, x: number, y: number) {
    const h = this.hand;
    if (kind === "weir") return { x: clamp(x, 40, W - 40), y: this.shoreY - 12, ok: true };
    const d = Math.hypot(x - h.x, y - h.y), reach = kind === "net" ? 110 : 96;
    const at = d > reach ? { x: h.x + ((x - h.x) * reach) / d, y: h.y + ((y - h.y) * reach) / d } : { x, y };
    at.x = clamp(at.x, kind === "net" ? 30 : 10, W - (kind === "net" ? 30 : 10));
    at.y = clamp(at.y, this.farY + 14, this.shoreY - 12);
    return { ...at, ok: !this.sets.some((g) => Math.hypot(g.x - at.x, g.y - at.y) < (g.kind === "net" || kind === "net" ? 30 : 14)) };
  }
  place(kind: SetKind, x: number, y: number) {
    const at = this.spot(kind, x, y);
    if (!at.ok || !this.left(kind)) return false;
    this.sets.push({ id: this.nextId++, kind, x: at.x, y: at.y, holds: [], twitch: 0 });
    this.splash(at.x, at.y, kind === "pot" ? 7 : 12, 0.8);
    this.ring(at.x, at.y, kind === "net" ? 26 : 10, 0.9);
    this.spook(at.x, at.y, 22);
    this.events.push({ type: "set", x: at.x, y: at.y });
    this.minutes += 3;
    if (!this.left(kind)) this.placing = undefined;
    return true;
  }
  private haul(g: SetGear) {
    g.haul = 0;
    this.setPose("tug");
    this.events.push({ type: "haul-set", x: g.x, y: g.y });
  }
  private hold(g: SetGear, kind: FishKind, kg: number, find?: string) {
    const spread = g.kind === "net" ? 20 : g.kind === "weir" ? 6 : 3;
    g.holds.push({ kind, kg, ...(find ? { find } : {}), dx: (this.rand() - 0.5) * 2 * spread, dy: (this.rand() - 0.5) * 3, ph: this.rand() * 6 });
    g.twitch = 1;
    this.ring(g.x, g.y, 5, 0.6, true);
    this.events.push({ type: "full", x: g.x, y: g.y });
  }
  private pickFind() {
    const f = this.setup.finds, total = f.reduce((n, x) => n + x.weight, 0);
    let r = this.rand() * total;
    return Math.max(0, f.findIndex((x) => (r -= x.weight) < 0));
  }
  /** A trap's haul: mostly what lives in traps, else a small fish, now and then something else. */
  private trapped(g: SetGear) {
    const r = this.rand(), traps = this.about(true), small = this.about(false).filter((k) => k.kg[0] < 1 && !k.rare);
    if (this.setup.finds.length && r < 0.08) {
      const f = this.setup.finds[this.pickFind()];
      return this.hold(g, SNAG, f.kg, f.id);
    }
    const pool = traps.length && (r < 0.75 || !small.length) ? traps : small.length ? small : this.setup.kinds.filter((k) => !k.rare);
    const kind = pool[Math.floor(this.rand() * pool.length)];
    if (kind) this.hold(g, kind, +lerp(kind.kg[0], kind.kg[1], Math.pow(this.rand(), 2)).toFixed(2));
  }
  private updateSets(dt: number) {
    const mins = dt / MINUTE, feeding = this.feeding;
    for (const g of this.sets) {
      g.twitch = Math.max(0, g.twitch - dt * 1.5);
      if (g.haul !== undefined) {
        g.haul += dt;
        if (g.haul >= 1.1) {
          const h = this.hand;
          if (!g.holds.length) {
            this.events.push({ type: "empty" });
            this.say(g.kind === "pot" ? "Nothing in the trap yet" : "Nothing yet", "bad");
          }
          for (const [i, x] of g.holds.entries()) this.land({ kind: x.kind, kg: x.kg, find: x.find }, h.x + (i % 5) * 3 - 6, h.y + 6, i * 0.08);
          g.holds = [];
          g.haul = undefined;
          this.minutes += 4;
        }
        continue;
      }
      if (g.holds.length >= SET_MAX[g.kind]) continue;
      if (g.kind === "pot") {
        if (this.rand() < mins * 0.035 * feeding) this.trapped(g);
        continue;
      }
      // A weir and a net take what swims into them, and a trickle of what passes unseen.
      for (const f of this.fish) {
        if (f.spooked > 0 || g.holds.length >= SET_MAX[g.kind]) continue;
        const inside = g.kind === "net" ? Math.abs(f.y - g.y) < 2.5 && Math.abs(f.x - g.x) < 22 : Math.abs(f.x - g.x) < 11 && f.y > g.y - 10;
        if (!inside || this.rand() > dt * 1.5) continue;
        if (g.kind === "net" && f.kg > 8 && this.rand() < 0.5) {
          this.splash(f.x, f.y, 8, 1);
          this.spook(f.x, f.y, 20);
          this.say("Tore through the net", "bad");
          continue;
        }
        f.gone = true;
        this.hold(g, f.kind, f.kg);
      }
      this.fish = this.fish.filter((f) => !f.gone);
      if (this.rand() < mins * (g.kind === "weir" ? 0.05 * this.setup.run : 0.02) * feeding) {
        const pool = g.kind === "weir" && this.about(true).length && this.rand() < 0.4 ? this.about(true) : this.about(false).filter((k) => !k.rare);
        const kind = pool[Math.floor(this.rand() * pool.length)];
        if (kind) this.hold(g, kind, +lerp(kind.kg[0], kind.kg[1], Math.pow(this.rand(), 2)).toFixed(2));
      }
    }
  }

  /** A cat comes to the bank once there are fish in the creel. Feed it, or it helps itself. */
  private updateCat(dt: number) {
    const s = this.setup, r = this.rand, creel = { x: this.px + 38, y: this.py + 6 };
    this.catAway = Math.max(0, this.catAway - dt);
    let c = this.cat;
    if (!c) {
      if (!s.afloat && !this.catAway && this.count >= 2 && r() < dt * 0.02) {
        const dir = r() < 0.5 ? -1 : 1;
        this.cat = { x: dir < 0 ? W + 10 : -10, y: creel.y, mode: "walk", t: 0, tx: creel.x, patience: 35 + r() * 25, nextMeow: 2, dir: -dir };
      }
      return;
    }
    c.t += dt;
    if (c.mode === "walk" || c.mode === "run") {
      const speed = c.mode === "run" ? 60 : 20, tx = c.mode === "run" ? (c.dir > 0 ? W + 20 : -20) : c.tx;
      c.dir = Math.sign(tx - c.x) || c.dir;
      c.x += c.dir * Math.min(Math.abs(tx - c.x), speed * dt);
      if (c.mode === "walk" && Math.abs(c.x - c.tx) < 0.5) Object.assign(c, { mode: "sit", t: 0 });
      if (c.mode === "run" && (c.x < -15 || c.x > W + 15)) {
        this.cat = undefined;
        this.catAway = 90;
      }
      return;
    }
    if (c.mode === "eat" && c.t > 2.6) Object.assign(c, { mode: "sleep", t: 0 });
    if (c.mode !== "sit") return;
    c.nextMeow -= dt;
    c.patience -= dt;
    if (c.nextMeow <= 0) {
      c.nextMeow = 6 + r() * 6;
      this.events.push({ type: "meow", x: c.x });
    }
    const snack = this.snack();
    if (c.patience <= 0 && snack) {
      this.caught.splice(this.caught.indexOf(snack), 1);
      Object.assign(c, { mode: "run", t: 0, dir: c.x < W / 2 ? -1 : 1 });
      this.events.push({ type: "steal", x: c.x });
      this.say(`The cat took a ${snack.kind.name.toLowerCase()}!`, "bad");
    }
  }
  /** The smallest fish in the creel. */
  snack() {
    return this.caught.filter((c) => !c.find && c.kind.shape !== "crab" && c.kind.shape !== "claw").sort((a, b) => a.kg - b.kg)[0];
  }
  feedCat() {
    const c = this.cat, snack = this.snack();
    if (!c || c.mode !== "sit" || !snack) return;
    this.caught.splice(this.caught.indexOf(snack), 1);
    Object.assign(c, { mode: "eat", t: 0 });
    this.events.push({ type: "purr", x: c.x });
    this.say("Purr…", "good");
  }

  private land(f: { kind: FishKind; kg: number; find?: string; gone?: boolean }, x: number, y: number, delay = 0, stars = 0) {
    f.gone = true;
    this.fish = this.fish.filter((x) => x !== f);
    this.splash(x, y, 8, 0.9);
    this.landed.push({ kind: f.kind, kg: f.kg, x, y, age: -delay, dur: 0.7, spin: this.rand() < 0.5 ? -1 : 1, ...(f.find ? { find: f.find } : {}), ...(stars ? { stars } : {}) });
    this.setPose("lift");
  }

  private updateLife(dt: number) {
    const r = this.rand, feeding = this.feeding;
    // Fish jump on the feed.
    for (const s of this.shoals) {
      if (s.leaving || r() > dt * 0.06 * feeding * s.appetite) continue;
      const f = this.fish.find((x) => x.shoal === s.id && x.spooked <= 0 && x.kg < 6);
      if (!f) continue;
      const dir = r() < 0.5 ? -1 : 1, len = 8 + r() * 10;
      this.leaps.push({ fish: f.kind, x0: f.x, y0: f.y, x1: f.x + dir * len, y1: f.y + (r() - 0.5) * 4, age: 0, dur: 0.5 + r() * 0.2, h: 8 + r() * 8 });
      this.ring(f.x, f.y, 6, 0.6);
      this.splash(f.x, f.y, 3, 0.5);
      this.events.push({ type: "jump", x: f.x, y: f.y });
    }
    for (const l of this.leaps) {
      const before = l.age;
      l.age += dt;
      if (before < l.dur && l.age >= l.dur) {
        this.ring(l.x1, l.y1, 7, 0.7);
        this.splash(l.x1, l.y1, 4, 0.6);
      }
    }
    this.leaps = this.leaps.filter((l) => l.age < l.dur + 0.05);
    // Terns work over the keenest shoal: watch where they dive.
    const best = this.shoals.filter((s) => !s.leaving && s.fade > 0.5).sort((a, b) => b.appetite - a.appetite)[0];
    for (const b of this.birds) {
      b.phase += dt * (b.dive !== undefined ? 2 : 9);
      if (b.standing) {
        if (b.strike !== undefined) {
          b.strike += dt;
          if (b.strike > 0.5) b.strike = undefined;
        } else if (r() < dt * 0.05) {
          b.strike = 0;
          this.ring(b.x + (b.x < W / 2 ? 6 : -6), b.y - 4, 5, 0.5);
          this.events.push({ type: "heron" });
        }
        continue;
      }
      if (b.dive !== undefined) {
        b.dive += dt;
        b.z = Math.max(0, 26 * (1 - b.dive / 0.35));
        if (b.dive > 0.35 && b.dive - dt <= 0.35) {
          this.ring(b.x, b.y, 8, 0.7);
          this.splash(b.x, b.y, 6, 0.8);
          this.events.push({ type: "dive", x: b.x, y: b.y });
        }
        if (b.dive > 0.9) b.dive = undefined;
        continue;
      }
      b.z = lerp(b.z, 26, dt * 2);
      const tx = best ? best.x + Math.cos(this.t * 0.9 + b.phase * 0.02) * 22 : W / 2 + Math.cos(this.t * 0.2) * 120;
      const ty = best ? best.y - 4 + Math.sin(this.t * 0.9) * 8 : 40;
      b.vx = lerp(b.vx, (tx - b.x) * 0.9, dt * 2);
      b.vy = lerp(b.vy, (ty - b.y) * 0.9, dt * 2);
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (best && Math.hypot(b.x - best.x, b.y - best.y) < 18 && r() < dt * 0.07 * best.appetite * feeding) {
        b.dive = 0;
        b.x = best.x + (r() - 0.5) * 8;
        b.y = best.y + (r() - 0.5) * 4;
      }
    }
    if (this.setup.water === "sea" && r() < dt * 0.04) this.events.push({ type: "gull" });
    if (this.setup.rain > 0 && r() < dt * this.setup.rain * 40) {
      const x = r() * W, y = this.farY + r() * (this.shoreY - this.farY);
      if (this.wet(x, y)) this.ring(x, y, 2 + r() * 2, 0.5, true);
    }
  }

  private updateFx(dt: number) {
    for (const rg of this.rings) {
      rg.age += dt;
      rg.r = rg.max * Math.sqrt(Math.min(1, rg.age / rg.life));
    }
    this.rings = this.rings.filter((r) => r.age < r.life);
    for (const d of this.drops) {
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.vz -= 220 * dt;
      d.z += d.vz * dt;
      if (d.z < 0) d.life = 0;
    }
    this.drops = this.drops.filter((d) => d.life > 0);
    for (const l of this.landed) {
      const before = l.age;
      l.age += dt;
      if (before < l.dur && l.age >= l.dur) {
        const fish = this.caught.filter((c) => !c.find);
        const best = !l.find && fish.length > 0 && l.kg > Math.max(...fish.map((c) => c.kg));
        const c: Catch = { kind: l.kind, kg: l.kg, ...(best ? { best } : {}), ...(l.stars ? { stars: l.stars } : {}), ...(l.find ? { find: l.find } : {}) };
        this.caught.push(c);
        this.events.push({ type: "land", catch: c });
      }
    }
    this.landed = this.landed.filter((l) => l.age < l.dur);
  }

  private hintNow() {
    const p = this.phase, g = this.gear;
    if (this.placing) return this.placing === "weir" ? "Click along the bank to build the weir" : "Click the water to set it";
    const full = this.sets.find((x) => x.holds.length >= SET_MAX[x.kind] && x.haul === undefined);
    if (p.kind === "aim" && full) return "Something's full: click it to haul it in";
    if (p.kind === "aim") {
      if (g === "spear") return "Click a fish to strike";
      return p.charging === undefined ? (g === "line" ? "Aim, then hold to cast" : "Aim, then hold to throw the net") : "Release to cast";
    }
    if (p.kind === "wait") return p.stripped ? "Click to reel in and bait again" : p.bite !== undefined ? "Strike!" : p.curious !== undefined ? "Something's nibbling… wait for the pull" : "Wait for a bite · click to reel in";
    if (p.kind === "fight") return p.air !== undefined ? "It's in the air: let go!" : p.tension > 0.75 ? "Ease off!" : p.run > 0 ? "It's running: let it" : "Hold to haul in";
    if (p.kind === "net") return p.hauling !== undefined ? "Hauling…" : p.age > 0.9 ? "Click to haul the net" : "Let it sink…";
    return "";
  }

  /** Drain what happened this frame, for sounds and the HUD. */
  take() {
    const e = this.events;
    this.events = [];
    return e;
  }
}

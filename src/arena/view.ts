import { noise, playSound, ring, tone, type Sound } from "../audio/sfx";
import type { Ground } from "../content/arms/battles";
import type { Kit } from "../content/arms/kits";
import { random } from "../core/random";
import type { Fighter, Skirmish } from "../core/skirmish";
import type { CharacterPose } from "../render/characters/poses";
import { armArt, dress, facingOf, figure, horseFrame, horses } from "./sprites";

const T = 16;
const SIDE = ["#4f86c6", "#c8574e"];
const GROUNDS: Record<Ground, [string, string, string]> = {
  grass: ["#7fa650", "#6c9444", "#95b862"],
  dirt: ["#b89b6c", "#a3875b", "#c9ae80"],
  sand: ["#d8c48c", "#c8b27a", "#e4d4a2"],
  mud: ["#8a7a58", "#7a6a4c", "#9a8a66"],
  snow: ["#e6ebee", "#d3dbe0", "#f4f7f8"],
};
const BLOOD = ["#9c2f2a", "#7a1f1f", "#c24a3a"];
const DUST = ["#e6d5c0", "#c9b199", "#ffffff"];
const SPARK = ["#fff4b8", "#ffe06a", "#ffffff"];

const GLYPHS: Record<string, string> = {
  A: "010101111101101", B: "110101110101110", C: "011100100100011", D: "110101101101110", E: "111100110100111",
  F: "111100110100100", G: "011100101101011", H: "101101111101101", I: "111010010010111", J: "001001001101010",
  K: "101101110101101", L: "100100100100111", M: "101111111101101", N: "110101101101101", O: "010101101101010",
  P: "110101110100100", Q: "010101101110011", R: "110101110101101", S: "011100010001110", T: "111010010010010",
  U: "101101101101111", V: "101101101101010", W: "101101111111101", X: "101101010101101", Y: "101101010010010",
  Z: "111001010100111", "0": "111101101101111", "1": "010110010010111", "2": "110001010100111", "3": "110001010001110",
  "4": "101101111001001", "5": "111100110001110", "6": "011100110101010", "7": "111001010010010", "8": "010101010101010",
  "9": "010101011001110", "!": "010010010000010",
};

type Bit = { x: number; y: number; vx: number; vy: number; z: number; vz: number; life: number; color: string; size: number; stain?: boolean };
type Effect =
  | { kind: "arc"; x: number; y: number; face: number; reach: number; arc: number; point: boolean; heavy: boolean; t: number }
  | { kind: "text"; x: number; y: number; text: string; color: string; t: number }
  | { kind: "ring"; x: number; y: number; r: number; color: string; t: number; life: number }
  | { kind: "smoke"; x: number; y: number; r: number; t: number; life: number }
  | { kind: "warn"; x: number; y: number; r: number; t: number; life: number }
  | { kind: "glint"; id: string; color: string; t: number };
/** Poses the legs matter to; a rider in one of these just rides. */
const MOVING = new Set<CharacterPose>(["idle", "walk", "run", "jump", "land", "hurt", "stumble", "halt-hand"]);
type Seen = { walk: number; flash: number; throwing: number; fell: number; corpse?: boolean; kit: Kit; key: string; n: number };

export type Feedback = { freeze: number; log: string[] };

export class ArenaView {
  zoom = 3;
  mute = false;
  /** The world pixel at the top left of the screen, for turning a click into a place. */
  origin = { x: 0, y: 0 };
  private ground: HTMLCanvasElement;
  private stains: CanvasRenderingContext2D;
  private bits: Bit[] = [];
  private effects: Effect[] = [];
  private seen = new Map<string, Seen>();
  private cam = { x: 0, y: 0 };
  private shake = 0;
  private scratch = document.createElement("canvas");
  private riders = new Map<string, HTMLCanvasElement>();
  private seats = new Map<string, number>();
  private audio?: AudioContext;
  private lastSound = new Map<string, number>();
  private clock = 0;

  constructor(private canvas: HTMLCanvasElement, private sim: Skirmish, ground: Ground, kits: Map<string, Kit>) {
    this.scratch.width = this.scratch.height = 80;
    sim.fighters.forEach((f, n) => {
      const kit = kits.get(f.id)!;
      this.seen.set(f.id, { walk: 0, flash: 0, throwing: 0, fell: 0, kit, key: dress(kit, n).key, n });
    });
    this.ground = this.paintGround(ground);
    const stains = document.createElement("canvas");
    stains.width = this.ground.width;
    stains.height = this.ground.height;
    this.stains = stains.getContext("2d")!;
    const p = sim.fighters.find((f) => f.player) ?? sim.fighters[0];
    this.cam = { x: p.x * T, y: p.y * T };
  }

  private paintGround(kind: Ground) {
    const { width, height, terrain } = this.sim;
    const c = document.createElement("canvas");
    c.width = width * T;
    c.height = height * T;
    const g = c.getContext("2d")!;
    const [base, dark, light] = GROUNDS[kind];
    g.fillStyle = base;
    g.fillRect(0, 0, c.width, c.height);
    const r = (...k: (string | number)[]) => random("arena-ground", ...k);
    for (let i = 0; i < width * height * 0.9; i++) {
      const x = Math.floor(r(i, "x") * c.width), y = Math.floor(r(i, "y") * c.height);
      g.fillStyle = r(i, "c") < 0.5 ? dark : light;
      if (kind === "grass") g.fillRect(x, y, 1, 2), g.fillRect(x + 2, y + 1, 1, 2);
      else g.fillRect(x, y, 2 + Math.floor(r(i, "w") * 2), 1);
    }
    for (const t of terrain) {
      const x = t.x * T, y = t.y * T, w = t.w * T, h = t.h * T;
      if (t.kind === "mud") {
        g.fillStyle = "#6b5a40";
        g.fillRect(x + 3, y, w - 6, h);
        g.fillRect(x, y + 3, w, h - 6);
        for (let i = 0; i < t.w * t.h * 0.5; i++) {
          const px = x + 4 + Math.floor(r(t.x, i, "mx") * (w - 12)), py = y + 4 + Math.floor(r(t.y, i, "my") * (h - 10));
          g.fillStyle = r(i, "mc") < 0.6 ? "#5c4d36" : "#84735a";
          g.fillRect(px, py, 4 + Math.floor(r(i, "mw") * 5), 1);
          if (r(i, "mp") < 0.12) g.fillStyle = "#7d8c93", g.fillRect(px, py + 2, 5, 2);
        }
      } else if (t.kind === "trench") {
        g.fillStyle = "#b8a37c";
        g.fillRect(x - 3, y, w + 6, h);
        g.fillStyle = "#4a3b2a";
        g.fillRect(x, y, w, h);
        g.fillStyle = "#6b5639";
        for (let py = y + 3; py < y + h; py += 6) g.fillRect(x + 4, py, w - 8, 2);
        g.fillStyle = "#93805c";
        for (let py = y; py < y + h; py += 8) g.fillRect(x - 3, py + 7, 3, 1), g.fillRect(x + w, py + 3, 3, 1);
      } else if (t.kind === "wire") {
        for (let py = y + 4; py < y + h; py += 12) {
          g.fillStyle = "#3d3830";
          for (let px = x; px < x + w; px += 2) g.fillRect(px, py + ((px >> 1) & 1 ? 2 : 0), 1, 1), g.fillRect(px, py + 5 - ((px >> 1) & 1 ? 2 : 0), 1, 1);
          g.fillStyle = "#6b4628";
          g.fillRect(x, py - 3, 2, 10);
          g.fillRect(x + w - 2, py - 3, 2, 10);
        }
      } else if (t.kind === "stakes") {
        const lean = t.x < width / 2 ? 1 : -1;
        for (let py = y + 6; py < y + h; py += 7) {
          g.fillStyle = "#6b4628";
          for (let i = 0; i < 9; i++) g.fillRect(x + 8 + lean * i - (lean > 0 ? 4 : -3), py - i, 2, 1);
          g.fillStyle = "#e6dccb";
          g.fillRect(x + 8 + lean * 9 - (lean > 0 ? 4 : -3), py - 9, 1, 1);
          g.fillStyle = "#00000033";
          g.fillRect(x + 4, py + 1, 8, 1);
        }
      } else {
        g.fillStyle = "#6f6a62";
        g.fillRect(x, y, w, h);
        g.fillStyle = "#8d877c";
        g.fillRect(x, y, w, 3);
        g.fillStyle = "#57534d";
        g.fillRect(x, y + h - 4, w, 4);
        for (let i = 0; i < t.w * t.h; i++) {
          g.fillStyle = r(i, "wc") < 0.5 ? "#625d56" : "#7c766c";
          g.fillRect(x + Math.floor(r(t.y, i, "wx") * (w - 6)), y + 4 + Math.floor(r(t.x, i, "wy") * (h - 10)), 5, 2);
        }
      }
    }
    return c;
  }

  // ------------------------------------------------------------- sound

  private sound(kind: string, make: () => Sound, x: number, y: number, gain = 1) {
    if (this.mute) return;
    const now = performance.now();
    if (now - (this.lastSound.get(kind) ?? 0) < 45) return;
    const far = Math.hypot(x * T - this.cam.x, y * T - this.cam.y) / T;
    if (far > 22) return;
    this.lastSound.set(kind, now);
    try {
      const ctx = (this.audio ??= new AudioContext());
      void ctx.resume();
      const out = ctx.createGain();
      out.gain.value = 0.5 * gain * Math.max(0.15, 1 - far / 24);
      out.connect(ctx.destination);
      playSound(ctx, out, make(), ctx.currentTime + 0.005);
    } catch {
      /* Sound is optional. */
    }
  }

  // ------------------------------------------------------------- events

  private spray(x: number, y: number, dir: number, n: number, colors: string[], speed: number, stain = false) {
    for (let i = 0; i < n; i++) {
      const a = dir + (Math.random() - 0.5) * 1.6, v = speed * (0.4 + Math.random());
      this.bits.push({ x: x * T, y: y * T, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.7, z: 8 + Math.random() * 6, vz: 20 + Math.random() * 50, life: 0.5 + Math.random() * 0.4, color: colors[i % colors.length], size: Math.random() < 0.3 ? 2 : 1, stain });
    }
  }
  say(x: number, y: number, text: string, color = "#ffffff") {
    this.effects.push({ kind: "text", x: x * T, y: y * T - 30, text, color, t: 0 });
  }

  /** Turn what the fight reported into things to see and hear. */
  consume(): Feedback {
    const out: Feedback = { freeze: 0, log: [] };
    const me = this.sim.fighters.find((f) => f.player);
    for (const e of this.sim.events) {
      const mine = "id" in e && (e.id === me?.id || ("by" in e && e.by === me?.id));
      if (e.kind === "swing") {
        this.effects.push({ kind: "arc", x: e.x * T, y: e.y * T, face: e.face, reach: e.reach * T, arc: e.arc, point: e.hurt === "thrust", heavy: e.move !== "light", t: 0 });
        if (e.move === "plunge") {
          this.spray(e.x + Math.cos(e.face) * 0.6, e.y + Math.sin(e.face) * 0.6, -Math.PI / 2, 9, DUST, 70);
          if (e.arc > 3) this.effects.push({ kind: "ring", x: e.x * T, y: e.y * T, r: e.reach * T, color: "#e6d5c0", t: 0, life: 0.28 });
          if (e.id === me?.id) this.shake = Math.max(this.shake, 3);
        }
        this.sound("swing", () => [noise(0, e.move === "light" ? 0.08 : 0.14, 0.1, 900, { to: 2600, q: 1.4 })], e.x, e.y, e.move === "light" ? 0.6 : 1);
      } else if (e.kind === "telegraph") {
        this.effects.push({ kind: "glint", id: e.id, color: e.unblockable ? "#ff5a4a" : e.heavy ? "#ffb347" : "#ffffff", t: 0 });
      } else if (e.kind === "hit") {
        const s = this.seen.get(e.id)!;
        s.flash = 0.12;
        const soft = e.hurt === "crush";
        this.spray(e.x, e.y, e.dir, Math.min(14, 3 + Math.round(e.damage / 4)), soft && !e.killed ? DUST : BLOOD, 60 + e.damage, !soft || e.killed);
        if (e.crit) this.spray(e.x, e.y, e.dir, 5, SPARK, 90);
        this.say(e.x + (Math.random() - 0.5) * 0.4, e.y, `${e.damage}`, e.crit ? "#ffe06a" : e.horse ? "#d8c9b0" : e.id === me?.id ? "#ff8a7a" : "#ffffff");
        this.sound(soft ? "thud" : "cut", () => soft
          ? [tone(0, 0.1, 0.3, 120, { to: 55 }), noise(0, 0.05, 0.2, 600, { filter: "lowpass" })]
          : [noise(0, 0.06, 0.22, 3200, { filter: "highpass" }), tone(0, 0.07, 0.18, 190, { to: 90 })], e.x, e.y, e.hurt === "ball" ? 0.5 : 1);
        if (mine) {
          out.freeze = Math.max(out.freeze, e.killed || e.crit ? 0.12 : 0.06);
          this.shake = Math.max(this.shake, e.id === me?.id ? 4 : e.killed ? 3 : 1.5);
        }
      } else if (e.kind === "parry") {
        this.spray(e.x, e.y, 0, 10, SPARK, 110);
        this.effects.push({ kind: "ring", x: e.x * T, y: e.y * T - 12, r: 14, color: "#fff4b8", t: 0, life: 0.25 });
        this.say(e.x, e.y, "PARRY!", "#ffe06a");
        this.sound("clang", () => [...ring(0, 1900, 0.32, 0.14), noise(0, 0.02, 0.2, 5200)], e.x, e.y);
        if (mine) out.freeze = Math.max(out.freeze, 0.14), (this.shake = Math.max(this.shake, 2));
      } else if (e.kind === "block" || e.kind === "shield") {
        this.spray(e.x, e.y, 0, 3, SPARK, 60);
        this.sound("block", () => [tone(0, 0.06, 0.2, 310, { to: 200, wave: "triangle" }), noise(0, 0.03, 0.16, 1500)], e.x, e.y, 0.8);
      } else if (e.kind === "guardbreak") {
        this.say(e.x, e.y, "GUARD BROKEN", "#ffb347");
        this.spray(e.x, e.y, 0, 8, DUST, 80);
        this.sound("thud", () => [tone(0, 0.14, 0.3, 150, { to: 60 })], e.x, e.y);
      } else if (e.kind === "dodge") {
        if (mine) this.say(e.x, e.y, "DODGED", "#bfe3ff");
      } else if (e.kind === "brace") {
        this.say(e.x, e.y, "BRACED!", "#ffe06a");
        this.spray(e.x, e.y, 0, 12, SPARK, 120);
        this.shake = Math.max(this.shake, 2.5);
        this.sound("thud", () => [tone(0, 0.16, 0.35, 110, { to: 45 }), noise(0, 0.08, 0.25, 500, { filter: "lowpass" })], e.x, e.y);
      } else if (e.kind === "down" || e.kind === "trample" || e.kind === "unhorse") {
        this.spray(e.x, e.y, 0, 8, DUST, 50);
        if (e.kind === "unhorse") this.say(e.x, e.y, "UNHORSED", "#ffffff");
      } else if (e.kind === "death") {
        this.seen.get(e.id)!.fell = this.clock;
      } else if (e.kind === "shot") {
        const gun = e.smoke || e.arm === "rifle" || e.arm === "machine-gun" || e.arm === "pistol";
        if (gun) {
          const mx = e.x + Math.cos(e.face) * 0.9, my = e.y + Math.sin(e.face) * 0.9;
          this.effects.push({ kind: "ring", x: mx * T, y: my * T - 12, r: 5, color: "#fff4b8", t: 0, life: 0.07 });
          if (e.smoke) for (let i = 0; i < 4; i++) this.effects.push({ kind: "smoke", x: (mx + Math.cos(e.face) * i * 0.3) * T, y: my * T - 12 - i, r: 3 + i, t: -i * 0.03, life: 2.2 + Math.random() });
          this.sound("gun", () => [noise(0, 0.2, 0.55, 900, { filter: "lowpass", to: 180 }), tone(0, 0.12, 0.3, 140, { to: 50 })], e.x, e.y, e.arm === "machine-gun" ? 0.6 : 1);
          if (e.id === me?.id) this.shake = Math.max(this.shake, 2);
        } else {
          this.sound("bow", () => [noise(0, 0.05, 0.1, 1300, { to: 300 }), tone(0, 0.09, 0.08, 220, { to: 150, wave: "triangle" })], e.x, e.y, 0.7);
          const s = this.seen.get(e.id);
          if (s && e.arm !== "bow" && !e.arm.endsWith("bow") && e.arm !== "yumi" && e.arm !== "sling") s.throwing = 0.25;
        }
      } else if (e.kind === "land") {
        const g = this.stains;
        if (e.what === "arrow" || e.what === "bolt" || e.what === "javelin") {
          const n = e.what === "javelin" ? 7 : 4;
          g.fillStyle = "#5a3d2a";
          for (let i = 0; i < n; i++) g.fillRect(Math.round(e.x * T - Math.cos(e.dir) * i * 0.6), Math.round(e.y * T - 1 - i), 1, 1);
          g.fillStyle = "#e6dccb";
          g.fillRect(Math.round(e.x * T - Math.cos(e.dir) * n * 0.6), Math.round(e.y * T - 1 - n), 1, 1);
          this.sound("stick", () => [noise(0, 0.03, 0.07, 2600)], e.x, e.y, 0.5);
        } else this.spray(e.x, e.y, e.dir + Math.PI, 3, DUST, 40);
      } else if (e.kind === "warn") {
        this.effects.push({ kind: "warn", x: e.x * T, y: e.y * T, r: e.radius * T, t: 0, life: e.fuse });
        this.sound("whistle", () => [tone(0, e.fuse, 0.07, 1700, { to: 500 })], e.x, e.y);
      } else if (e.kind === "blast") {
        this.effects.push({ kind: "ring", x: e.x * T, y: e.y * T, r: e.radius * T, color: "#fff4b8", t: 0, life: 0.3 });
        for (let i = 0; i < 6; i++) this.effects.push({ kind: "smoke", x: e.x * T + (Math.random() - 0.5) * 20, y: e.y * T - Math.random() * 10, r: 6 + Math.random() * 6, t: 0, life: 1.6 + Math.random() });
        this.spray(e.x, e.y, -Math.PI / 2, 26, ["#4a3b2a", "#6b5639", "#2b2a33"], 160);
        const g = this.stains;
        g.fillStyle = "#4a3b2a";
        g.beginPath();
        g.ellipse(e.x * T, e.y * T, e.radius * T * 0.6, e.radius * T * 0.4, 0, 0, 7);
        g.fill();
        g.fillStyle = "#33291d";
        g.beginPath();
        g.ellipse(e.x * T, e.y * T + 1, e.radius * T * 0.35, e.radius * T * 0.22, 0, 0, 7);
        g.fill();
        this.shake = Math.max(this.shake, 7 - Math.min(5, Math.hypot(e.x * T - this.cam.x, e.y * T - this.cam.y) / 60));
        this.sound("blast", () => [noise(0, 0.7, 0.8, 320, { filter: "lowpass", to: 60 }), tone(0, 0.45, 0.5, 70, { to: 30 })], e.x, e.y, 1.4);
      } else if (e.kind === "rout") {
        out.log.push(`${e.name} break and run`);
        for (const f of this.sim.fighters) if (f.unit === e.unit && this.sim.alive(f) && Math.random() < 0.4) this.say(f.x, f.y, "RUN!", SIDE[e.side]);
      } else if (e.kind === "order") {
        out.log.push(`${e.name}: ${e.order}`);
      }
    }
    this.sim.events.length = 0;
    return out;
  }

  // ------------------------------------------------------------- drawing

  /** What the body is doing, as on foot. A rider keeps the top half of it. */
  private pose(f: Fighter, s: Seen): [CharacterPose, number, number?] {
    const a = f.arm.family, m = f.move;
    const strike: CharacterPose =
      m?.kind === "sweep" ? "spin" : m?.kind === "smash" ? "axe-chop" : m?.kind === "bash" || m?.kind === "throw" ? "thrust"
      : a === "fist" ? "thrust" : a === "dagger" ? "knife-thrust" : a === "club" || a === "axe" ? "chop"
      : a === "spear" || a === "pike" || a === "lance" || a === "gun" || a === "javelin" || f.arm.hurt === "thrust" ? "spear-thrust"
      : a === "polearm" ? "scythe-sweep" : "slash";
    // Out of a jump the weapon comes down from over the head, or the foot goes out.
    const drop: CharacterPose = a === "fist" ? "kick" : f.arm.hurt === "thrust" ? "spear-thrust" : "axe-chop";
    if (m?.kind === "plunge" && (f.act === "strike" || (f.act === "recover" && f.t < 0.15))) return [drop, f.act === "strike" ? 2 : 3];
    if (f.act === "down") return ["stumble", 3];
    if (f.act === "stagger") return ["hurt", Math.min(3, Math.floor(f.t * 8))];
    if (f.act === "jump") return f.plunge ? [drop, 1] : [f.t < f.until * 0.7 ? "jump" : "land", Math.min(3, Math.floor((f.t / f.until) * 4))];
    if (s.throwing > 0) return ["spear-throw", 2];
    // Drawn back, then held; let go, it goes round a facing at a time, as in the game.
    if (f.act === "charge") return f.t < 0.17 ? ["swing", 0] : ["spin", 0];
    if (m?.kind === "heavy" && m.hurt !== "thrust" && (f.act === "windup" || f.act === "strike" || f.act === "recover")) {
      const steps = m.power === 2 ? 8 : 4, start = facingOf(f.face) - (m.power === 2 ? 0 : 2) + 8;
      const k = f.act === "windup" ? 0 : Math.floor((f.act === "strike" ? f.t : 0.1 + f.t) / 0.036);
      if (k <= steps + 2) return ["spin", k === 0 ? 1 : k < steps ? 2 : 3, (start + Math.min(k, steps)) % 8];
    }
    if (f.act === "windup") return m?.kind === "aimed" ? ["draw", 2] : [strike, f.t / m!.windup < 0.5 ? 0 : 1];
    if (f.act === "strike") return m?.kind === "aimed" ? ["draw", 3] : [strike, 2];
    if (f.act === "recover" && f.t < 0.12 && m) return [strike, 3];
    if (f.drawT > 0) return a === "sling" ? ["whirl", Math.floor(this.clock * 12) & 3] : ["draw", Math.min(2, Math.floor((f.drawT / (f.arm.shot!.draw ?? 0.5)) * 3))];
    if (f.braced) return ["spear-thrust", 1];
    if (f.guard) return ["halt-hand", 2];
    const speed = Math.hypot(f.vx, f.vy);
    if (speed > 0.5) return [speed > 2.6 ? "run" : "walk", Math.floor(s.walk) & 7];
    if ((a === "gun" || a === "machine-gun" || a === "crossbow") && f.loaded && f.far < f.arm.shot!.range && f.ai.foe) return ["draw", 1];
    return ["idle", 0];
  }

  private text(g: CanvasRenderingContext2D, x: number, y: number, text: string, color: string, alpha = 1) {
    const cx = Math.round(x - (text.length * 4 - 1) / 2);
    const put = (ox: number, oy: number, fill: string) => {
      g.fillStyle = fill;
      let px = cx + ox;
      for (const ch of text) {
        const bits = GLYPHS[ch];
        if (bits) for (let i = 0; i < 15; i++) if (bits[i] === "1") g.fillRect(px + (i % 3), Math.round(y) + oy + Math.floor(i / 3), 1, 1);
        px += 4;
      }
    };
    g.globalAlpha = alpha;
    for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) put(ox, oy, "#1c1a22");
    put(0, 0, color);
    g.globalAlpha = 1;
  }

  draw(dt: number) {
    const { canvas, sim } = this;
    this.clock += dt;
    const vw = Math.ceil(canvas.clientWidth / this.zoom), vh = Math.ceil(canvas.clientHeight / this.zoom);
    if (canvas.width !== vw || canvas.height !== vh) {
      canvas.width = vw;
      canvas.height = vh;
    }
    const g = canvas.getContext("2d")!;
    g.imageSmoothingEnabled = false;
    const me = sim.fighters.find((f) => f.player && sim.alive(f));
    const live = sim.fighters.filter((f) => sim.alive(f));
    const tx = me ? me.x * T + Math.cos(me.face) * 24 : (live.reduce((a, f) => a + f.x, 0) / Math.max(1, live.length)) * T;
    const ty = me ? me.y * T + Math.sin(me.face) * 16 - 10 : (live.reduce((a, f) => a + f.y, 0) / Math.max(1, live.length)) * T;
    this.cam.x += (tx - this.cam.x) * Math.min(1, dt * 5);
    this.cam.y += (ty - this.cam.y) * Math.min(1, dt * 5);
    const fit = (c: number, view: number, world: number) => (world <= view ? world / 2 : Math.max(view / 2, Math.min(world - view / 2, c)));
    this.shake = Math.max(0, this.shake - dt * 22);
    const ox = Math.round(fit(this.cam.x, vw, this.ground.width) - vw / 2 + (Math.random() - 0.5) * this.shake);
    const oy = Math.round(fit(this.cam.y, vh, this.ground.height) - vh / 2 + (Math.random() - 0.5) * this.shake);

    this.origin = { x: ox, y: oy };
    g.fillStyle = "#1c1a22";
    g.fillRect(0, 0, vw, vh);
    g.drawImage(this.ground, -ox, -oy);
    g.drawImage(this.stains.canvas, -ox, -oy);

    // Bodies, back to front.
    const order = [...sim.fighters].filter((f) => f.act !== "fled").sort((a, b) => a.y - b.y);
    const sheet = horses();
    for (const f of order) {
      const s = this.seen.get(f.id)!;
      if (s.corpse) continue;
      const x = Math.round(f.x * T) - ox, y = Math.round(f.y * T) - oy;
      if (x < -50 || y < -20 || x > vw + 50 || y > vh + 90) {
        if (f.act === "dead" && this.clock - s.fell > 0.5) this.bury(f, s);
        continue;
      }
      s.walk += dt * Math.hypot(f.vx, f.vy) * 3.2;
      s.flash = Math.max(0, s.flash - dt);
      s.throwing = Math.max(0, s.throwing - dt);
      const { look } = dress(s.kit, s.n);
      if (f.act === "dead") {
        const k = Math.min(1, (this.clock - s.fell) / 0.35);
        this.lay(g, figure(s.key, look, facingOf(f.face), "stumble", 3), x, y, k);
        if (k >= 1) this.bury(f, s);
        continue;
      }
      g.fillStyle = "#00000030";
      g.fillRect(x - (f.horse > 0 ? 12 : 5), y - 1, f.horse > 0 ? 24 : 10, 3);
      g.fillStyle = SIDE[f.side];
      g.fillRect(x - 4, y + 2, 8, 1);
      if (f.player) g.fillStyle = "#ffffff", g.fillRect(x - 5, y + 2, 1, 1), g.fillRect(x + 4, y + 2, 1, 1), g.fillRect(x - 1, y + 4, 2, 1);
      const [pose, frame, turned] = this.pose(f, s);
      const facing = turned ?? facingOf(f.face), art = armArt(f.arm);
      let img = figure(s.key, look, facing, pose, frame, art);
      if (f.horse > 0) {
        const ride = figure(s.key, look, facing, f.speed > 4 ? "ride-gallop" : "ride", Math.floor(this.clock * (f.speed > 4 ? 11 : f.speed > 0.3 ? 7 : 1)) & 3, art);
        img = MOVING.has(pose) ? ride : this.astride(`${s.key}|${facing}|${pose}|${frame}|${art?.sprite}`, img, ride, this.seat(s.key, look, facing));
      } else if (f.prone) img = figure(s.key, look, Math.cos(f.face) >= 0 ? 2 : 6, Math.hypot(f.vx, f.vy) > 0.3 ? "walk" : "idle", Math.floor(s.walk) & 7, art);
      if (s.flash > 0) {
        const c = this.scratch.getContext("2d")!;
        c.globalCompositeOperation = "source-over";
        c.clearRect(0, 0, 80, 80);
        c.drawImage(img, 0, 0);
        c.globalCompositeOperation = "source-atop";
        c.fillStyle = "#ffffffcc";
        c.fillRect(0, 0, 80, 80);
        img = this.scratch;
      }
      let top = y - 34;
      if (f.horse > 0) {
        const hf = facingOf(f.heading), bob = f.speed > 0.3 ? Math.round(Math.sin(this.clock * (f.speed > 4 ? 24 : 15))) : 0;
        // Off the ground the whole pair rises and comes down.
        const up = f.air > 0 ? Math.round(Math.sin(Math.PI * (1 - f.air / 0.5)) * 13) : 0;
        const fr = horseFrame(f.speed > 4 || up ? "flee" : f.speed > 0.3 ? "trot" : "idle", hf, up ? 2 : Math.floor(this.clock * (f.speed > 4 ? 14 : 9)));
        const behind = hf === 0 || hf === 1 || hf === 7;
        const rider = () => g.drawImage(img, x - 40 + (hf === 2 || hf === 6 ? (hf === 2 ? -2 : 2) : 0), y - 77 - 17 + bob - up);
        if (behind) rider();
        if (sheet && fr) g.drawImage(sheet, fr.x, fr.y, fr.w, fr.h, x - fr.w / 2, y - fr.h + 3 - up, fr.w, fr.h);
        if (!behind) rider();
        top = y - 52;
      } else if (f.act === "down") this.lay(g, img, x, y, 1);
      else if (f.prone) this.lay(g, img, x - (Math.cos(f.face) >= 0 ? 12 : -12), y + 3, 0.94, Math.cos(f.face) >= 0 ? 1 : -1), (top = y - 16);
      else g.drawImage(img, x - 40, y - 77 - (f.act === "jump" ? Math.round(Math.sin((Math.PI * f.t) / f.until) * 11) : 0));

      // Over the head: health once hurt, wind when short of it, a mark for a stance.
      if (f.hp < 100 || f.player) this.bar(g, x, top, f.hp / 100, f.player ? "#7ed36f" : SIDE[f.side]);
      if (f.player || f.stamina < 60) this.bar(g, x, top + 3, f.stamina / 100, "#e8c45a");
      if (f.horse > 0 && f.horse < 70) this.bar(g, x, top + 6, f.horse / 70, "#b08a5a");
      if (f.act === "charge" && f.t >= 0.55 && (f.t < 1.1 || Math.floor(this.clock * 9) % 2)) {
        g.fillStyle = f.t >= 1.1 ? "#fff4b8" : "#ffb347";
        g.fillRect(x - 1, top - 7, 3, 3);
        g.fillRect(x, top - 8, 1, 5);
        g.fillRect(x - 2, top - 6, 5, 1);
      }
      if (f.braced) g.fillStyle = "#ffe06a", g.fillRect(x - 2, top - 4, 5, 1), g.fillRect(x - 1, top - 5, 3, 1), g.fillRect(x, top - 6, 1, 1);
      if (f.riposte && f.riposte.until >= sim.time && f.player) this.text(g, x, top - 8, "STRIKE!", "#ffe06a");
      if (f.arm.shot && !f.loaded && !f.arm.shot.draw && (f.ammo[f.arm.id] ?? 0) > 0 && f.player) this.bar(g, x, top + 6, f.reloadT / f.arm.shot.reload, "#bfe3ff");
    }

    // Missiles.
    for (const m of sim.missiles) {
      const x = m.x * T - ox, y = m.y * T - oy;
      if (m.lob) {
        const k = m.lob.t / m.lob.T, h = Math.sin(Math.PI * k) * Math.min(70, m.lob.T * 46);
        const dir = Math.atan2(m.lob.ty - m.lob.sy, m.lob.tx - m.lob.sx), pitch = Math.cos(Math.PI * k);
        g.fillStyle = "#00000030";
        g.fillRect(Math.round(x) - 1, Math.round(y), 3, 1);
        if (m.blast) g.fillStyle = "#2b2a33", g.fillRect(Math.round(x) - 1, Math.round(y - h - 10) - 1, 3, 3);
        else this.shaft(g, x, y - h - 10, Math.cos(dir) * 5, Math.sin(dir) * 3 - pitch * 4, m.kind === "stone" ? 1 : 5);
      } else if (m.hurt === "ball") {
        g.fillStyle = "#fff4b8";
        const n = Math.hypot(m.vx, m.vy);
        for (let i = 0; i < 7; i++) g.fillRect(Math.round(x - (m.vx / n) * i), Math.round(y - 12 - (m.vy / n) * i), 1, 1);
      } else {
        const n = Math.hypot(m.vx, m.vy);
        this.shaft(g, x, y - 12, (m.vx / n) * 5, (m.vy / n) * 5, m.kind === "stone" ? 1 : m.kind === "javelin" ? 8 : 5);
      }
    }

    // Flying bits, and where the wet ones land.
    this.bits = this.bits.filter((b) => {
      b.life -= dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.z += b.vz * dt;
      b.vz -= 260 * dt;
      if (b.z <= 0 || b.life <= 0) {
        if (b.stain) this.stains.fillStyle = b.color, this.stains.fillRect(Math.round(b.x), Math.round(b.y), b.size + 1, b.size);
        return false;
      }
      g.fillStyle = b.color;
      g.fillRect(Math.round(b.x) - ox, Math.round(b.y - b.z) - oy, b.size, b.size);
      return true;
    });

    this.effects = this.effects.filter((e) => {
      e.t += dt;
      if (e.kind === "arc") {
        const k = e.t / 0.14;
        if (k >= 1) return false;
        g.fillStyle = e.heavy ? "#fff4b8" : "#ffffff";
        g.globalAlpha = 1 - k * 0.7;
        const cx = e.x - ox, cy = e.y - oy - 12;
        if (e.point) for (let r = e.reach * 0.35; r <= e.reach; r += 1) g.fillRect(Math.round(cx + Math.cos(e.face) * r), Math.round(cy + Math.sin(e.face) * r * 0.8), e.heavy ? 2 : 1, e.heavy ? 2 : 1);
        else {
          const sweep = -e.arc + 2 * e.arc * Math.min(1, k * 2.2);
          for (let a = -e.arc; a <= sweep; a += 0.06)
            for (let w = 0; w < (e.heavy ? 3 : 2); w++) g.fillRect(Math.round(cx + Math.cos(e.face + a) * (e.reach - w)), Math.round(cy + Math.sin(e.face + a) * (e.reach - w) * 0.8), 1, 1);
        }
        g.globalAlpha = 1;
        return true;
      }
      if (e.kind === "text") {
        if (e.t > 0.8) return false;
        this.text(g, e.x - ox, e.y - oy - e.t * 22, e.text, e.color, e.t > 0.55 ? 1 - (e.t - 0.55) / 0.25 : 1);
        return true;
      }
      if (e.kind === "ring" || e.kind === "warn") {
        if (e.t > e.life) return false;
        const k = e.t / e.life, warn = e.kind === "warn";
        g.strokeStyle = warn ? "#ff5a4a" : e.color;
        g.globalAlpha = warn ? 0.35 + 0.4 * Math.abs(Math.sin(e.t * 10)) : 1 - k;
        g.lineWidth = 1;
        g.beginPath();
        g.ellipse(e.x - ox, e.y - oy, e.r * (warn ? 1 : 0.3 + k * 0.7), e.r * (warn ? 0.7 : 0.3 + k * 0.7) * (warn ? 1 : 0.8), 0, 0, 7);
        g.stroke();
        if (warn) g.fillStyle = "#ff5a4a", (g.globalAlpha = 0.12 + k * 0.2), g.fill();
        g.globalAlpha = 1;
        return true;
      }
      if (e.kind === "smoke") {
        if (e.t > e.life) return false;
        if (e.t < 0) return true;
        const k = e.t / e.life, r = Math.round(e.r * (0.6 + k * 1.2));
        g.globalAlpha = 0.5 * (1 - k);
        g.fillStyle = "#e9e4da";
        const cx = Math.round(e.x - ox - k * 10), cy = Math.round(e.y - oy - k * 14);
        g.fillRect(cx - r, cy - r + 1, r * 2, r * 2 - 2);
        g.fillRect(cx - r + 1, cy - r, r * 2 - 2, r * 2);
        g.globalAlpha = 1;
        return true;
      }
      const f = sim.get(e.id);
      if (!f || e.t > 0.22 || !sim.alive(f)) return false;
      const x = Math.round(f.x * T) - ox + 5, y = Math.round(f.y * T) - oy - (f.horse > 0 ? 56 : 38), r = e.t < 0.11 ? 3 : 2;
      g.fillStyle = e.color;
      g.fillRect(x - r, y, r * 2 + 1, 1);
      g.fillRect(x, y - r, 1, r * 2 + 1);
      g.fillRect(x - 1, y - 1, 3, 3);
      return true;
    });
  }

  private bar(g: CanvasRenderingContext2D, x: number, y: number, k: number, color: string) {
    g.fillStyle = "#1c1a22";
    g.fillRect(x - 7, y - 1, 14, 3);
    g.fillStyle = color;
    g.fillRect(x - 6, y, Math.max(0, Math.round(12 * Math.min(1, k))), 1);
  }
  private shaft(g: CanvasRenderingContext2D, x: number, y: number, dx: number, dy: number, n: number) {
    g.fillStyle = "#5a3d2a";
    for (let i = 0; i < n; i++) g.fillRect(Math.round(x - (dx * i) / 5), Math.round(y - (dy * i) / 5), 1, 1);
    g.fillStyle = "#e6dccb";
    g.fillRect(Math.round(x), Math.round(y), 1, 1);
  }
  /** A figure tipping over onto its side, `k` of the way down. */
  /** A rider striking: the blow's top half on the seat's bottom half, moved to
   * where the seated shoulders are. Kept, since it is two reads of pixels. */
  private astride(key: string, top: HTMLCanvasElement, ride: HTMLCanvasElement, dy: number) {
    let c = this.riders.get(key);
    if (c) return c;
    const waist = 61;
    c = document.createElement("canvas");
    c.width = c.height = 80;
    const g = c.getContext("2d")!;
    g.drawImage(ride, 0, waist, 80, 80 - waist, 0, waist, 80, 80 - waist);
    g.drawImage(top, 0, 0, 80, waist - dy, 0, dy, 80, waist - dy);
    if (this.riders.size > 1500) this.riders.clear();
    this.riders.set(key, c);
    return c;
  }
  /** How far a seated head is below a standing one, measured with empty hands
   * so that a lance held upright is not taken for the head. */
  private seat(key: string, look: Parameters<typeof figure>[1], facing: number) {
    const id = `${key}|${facing}`;
    let dy = this.seats.get(id);
    if (dy === undefined) {
      const crown = (img: HTMLCanvasElement) => {
        const d = img.getContext("2d")!.getImageData(0, 0, 80, 80).data;
        for (let i = 3; i < d.length; i += 4) if (d[i]) return Math.floor(i / 4 / 80);
        return 0;
      };
      dy = crown(figure(key, look, facing, "ride", 0)) - crown(figure(key, look, facing, "idle", 0));
      this.seats.set(id, dy);
    }
    return dy;
  }
  private lay(g: CanvasRenderingContext2D, img: HTMLCanvasElement, x: number, y: number, k: number, way = 1) {
    g.save();
    g.translate(x, y - 2);
    g.rotate((Math.PI / 2) * k * way);
    g.drawImage(img, -40, -77 + 2);
    g.restore();
  }
  /** The dead stay where they fell, painted into the ground with the blood. */
  private bury(f: Fighter, s: Seen) {
    s.corpse = true;
    const g = this.stains, x = Math.round(f.x * T), y = Math.round(f.y * T);
    g.fillStyle = BLOOD[1];
    g.fillRect(x - 6, y - 3, 12, 5);
    g.fillRect(x - 4, y - 5, 9, 8);
    this.lay(g, figure(s.key, dress(s.kit, s.n).look, facingOf(f.face), "stumble", 3), x, y, 1);
  }
}

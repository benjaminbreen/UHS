import Phaser from "phaser";
import type { CaveLight } from "../../content/caves";
import { sewerFind } from "../../content/sewers";
import type { SewerRun } from "../../core/sewer";
import { DEEP, GRATE, walkable, WALL, WATER, type SewerLevel } from "../../world/sewer";
import { paintSewerObject } from "./art";
import { mineFloats, sewerFloats } from "./flotsam";
import { Gas } from "./gas";
import { PerilView } from "./peril";
import { paintSewerTerrain, paletteOf } from "./terrain";
import { Flotsam, WaterSurface } from "../flowing-water";
import { sewerTile } from "./water";
import { LampHud, Lamplight } from "../lamplight";

const CELL = 48, TALL = 64, RISE = 56, PAD = 16;
const DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]] as const;

export type SewerSound = "drip" | "rats" | "take" | "splash" | "knock" | "car" | "steam" | "rush" | "rumble" | "pick" | "tub" | "creak" | "shot" | "crack" | "fall" | "runaway" | "blast";

export type SewerFrame = {
  x: number;
  y: number;
  facing: number;
  run: SewerRun;
  done: readonly string[];
  light: CaveLight;
  hour: number;
  time: number;
  delta: number;
  /** Street cells whose lids are off, as "x,y". */
  open: ReadonlySet<string>;
  /** Lamps carried by the people down here, in world pixels. */
  carried: readonly { x: number; y: number }[];
  /** The game clock as drawn, for a mine accident in motion. */
  clock: number;
  /** Cells no one can stand in, and the roof come down, as y * w + x. */
  solid: ReadonlySet<number>;
  falls: readonly number[];
};

type Rat = { im: Phaser.GameObjects.Rectangle; tail: Phaser.GameObjects.Rectangle; x: number; y: number; tx: number; ty: number; wait: number; fled: boolean };

/** One sewer level on screen: the painted tunnels, running water, the light
 * of a lamp that falls off and stops at walls, and daylight through the lids. */
export class SewerView {
  readonly space: string;
  static daylit = false;
  private base: Phaser.Textures.CanvasTexture;
  private sheet: Phaser.Textures.CanvasTexture;
  private lamp: Lamplight;
  private stillKey = "";
  private objects: Phaser.GameObjects.GameObject[] = [];
  private tall = new Map<string, Phaser.GameObjects.Image>();
  private live = new Set<Phaser.GameObjects.GameObject>();
  private water: Phaser.GameObjects.Graphics;
  private beams: Phaser.GameObjects.Graphics;
  private hud: LampHud;
  private rats: Rat[] = [];
  private flotsam: Flotsam;
  private surface: WaterSurface;
  private top: Phaser.Textures.CanvasTexture;
  private shade: HTMLCanvasElement;
  readonly gas: Gas;
  private stamp = "?";
  private born = 0;
  private took = 0;
  private next = { drip: 0, knock: 0, car: 0, steam: 0, trickle: 0, splash: 0, pick: 0 };
  private lastCell = -1;
  private surged = 0;
  private wet: number[] = [];

  constructor(private scene: Phaser.Scene, readonly level: SewerLevel, year: number) {
    this.space = level.space;
    const { w, h } = level, W = w * 16, H = h * 16;
    const key = `sewer-${level.space}`;
    for (const k of [key, `${key}-sheet`, `${key}-light`, `${key}-top`]) if (scene.textures.exists(k)) scene.textures.remove(k);
    this.base = scene.textures.createCanvas(key, W, H)!;
    this.top = scene.textures.createCanvas(`${key}-top`, W, H)!;
    this.shade = document.createElement("canvas");
    this.shade.width = W;
    this.shade.height = H;
    paintSewerTerrain(this.base.context, level, this.shade.getContext("2d")!);
    const rock = document.createElement("canvas");
    rock.width = W;
    rock.height = H;
    rock.getContext("2d")!.drawImage(this.base.canvas, 0, 0);
    this.rock = rock;
    const tallCount = level.decor.filter((d) => d.solid).length + level.things.filter((t) => t.solid && !t.prop).length + level.shafts.length + 2;
    this.sheet = scene.textures.createCanvas(`${key}-sheet`, CELL * 16, TALL * Math.ceil(tallCount / 16 + 1))!;
    for (let i = 0; i < w * h; i++) if (level.cells[i] === WATER || level.cells[i] === DEEP) this.wet.push(i);
    this.objects.push(scene.add.image(0, 0, key).setOrigin(0, 0).setDepth(-99990));
    const pal = paletteOf(level), name = level.network === "sewer" ? (level.layer === "old" ? "old" : level.kind) : `${level.network}-${level.kind}`;
    this.surface = new WaterSurface(scene, level, (i) => (level.cells[i] === WATER ? 1 : level.cells[i] === DEEP ? 2 : 0), (deep, across) => sewerTile(scene, pal, name, deep, across), -99986);
    this.objects.push(scene.add.image(0, 0, `${key}-top`).setOrigin(0, 0).setDepth(-99985));
    this.water = scene.add.graphics().setDepth(-99980);
    this.objects.push(this.water);
    this.flotsam = new Flotsam(scene, level, (i) => level.cells[i] === WATER || level.cells[i] === DEEP, level.network === "mine" ? mineFloats : sewerFloats, level.network === "mine" ? "mine-flotsam" : "sewer-flotsam", year, -99979);
    this.lamp = new Lamplight(scene, key, level, [0.2, 0.05], 0.5);
    this.gas = new Gas(scene, level);
    this.mine = level.network === "mine";
    this.peril = new PerilView(scene, level);
    this.peril.sound = (what, volume) => this.sound?.(what, volume);
    this.beams = scene.add.graphics().setDepth(3001).setBlendMode(Phaser.BlendModes.ADD);
    this.objects.push(this.beams);
    this.hud = new LampHud(scene, level.name, { text: "#e6f0d8", stroke: "#0e120c" });
    for (const p of level.rats) {
      const im = scene.add.rectangle(p.x * 16 + 8, p.y * 16 + 12, 4, 2, 0x3a3030).setDepth(p.y * 16 + 10);
      const tail = scene.add.rectangle(p.x * 16 + 5, p.y * 16 + 13, 3, 1, 0x7a5a58).setDepth(p.y * 16 + 10);
      this.rats.push({ im, tail, x: p.x * 16 + 8, y: p.y * 16 + 12, tx: p.x * 16 + 8, ty: p.y * 16 + 12, wait: Math.random() * 3000, fled: false });
      this.objects.push(im, tail);
    }
  }
  private rock: HTMLCanvasElement;
  private mine: boolean;
  private peril: PerilView;

  /** How deep someone at these world pixels stands in the channel, and which way it pulls. */
  wading(x: number, y: number, space?: string): { depth: number; flow: [number, number] } | undefined {
    const { level } = this;
    if (space !== this.space) return;
    const i = Math.floor((y - 1) / 16) * level.w + Math.floor(x / 16), c = level.cells[i], dir = level.flow[i];
    if (c !== WATER && c !== DEEP) return;
    const pull = 1 + this.surged * 2;
    return { depth: (c === DEEP ? 0.55 : 0.38) + this.surged * 0.2, flow: dir >= 0 ? [DIRS[dir][0] * pull, DIRS[dir][1] * pull] : [0, 0] };
  }

  private repaint(done: Set<string>, falls: readonly number[]) {
    const { level } = this, pal = paletteOf(level);
    const g = this.base.context;
    g.drawImage(this.rock, 0, 0);
    for (const i of falls) paintSewerObject(g, "fall", (i % level.w) * 16, Math.floor(i / level.w) * 16, pal, ((i * 37) % 100) / 100);
    const t2 = this.top.context;
    t2.clearRect(0, 0, this.top.width, this.top.height);
    t2.drawImage(this.shade, 0, 0);
    for (const d of level.decor) if (!d.solid) paintSewerObject(this.wetAt(d.x, d.y) ? t2 : g, d.type, d.x * 16, d.y * 16, pal, d.v);
    for (const s of level.shafts) if (s.to === "up" && level.cells[(s.y - 1) * level.w + s.x] === WALL) paintSewerObject(g, "up", s.x * 16, (s.y - 1) * 16, pal);
    for (const t of level.things) if (!t.solid && !t.prop) paintSewerObject(g, t.art, t.x * 16, t.y * 16, pal, 0.5, done.has(t.id) && !sewerFind(t.find)?.keeps);
    this.base.refresh();
    this.top.refresh();
    const s = this.sheet.context;
    s.clearRect(0, 0, this.sheet.width, this.sheet.height);
    let n = 0;
    const stand = (id: string, art: string, x: number, y: number, v: number, emptied: boolean, depth = y * 16 + 12) => {
      const fx = (n % 16) * CELL, fy = Math.floor(n / 16) * TALL;
      n++;
      paintSewerObject(s, art, fx + PAD, fy + RISE - 16, pal, v, emptied);
      if (!this.tall.has(id)) {
        this.sheet.add(id, 0, fx, fy, CELL, TALL);
        this.tall.set(id, this.scene.add.image(x * 16 - PAD, y * 16 - (RISE - 16), `sewer-${level.space}-sheet`, id).setOrigin(0, 0).setDepth(depth));
      }
    };
    for (const [i, d] of level.decor.entries()) if (d.solid) stand(`d${i}`, d.type, d.x, d.y, d.v, false);
    for (const t of level.things) if (t.solid && !t.prop) stand(t.id, t.art, t.x, t.y, 0.5, done.has(t.id) && !sewerFind(t.find)?.keeps);
    if (level.down) stand("down", "down", level.down.x, level.down.y, 0, false);
    level.shafts.forEach((sh, i) => {
      if (sh.to === "street" && level.mouth) return;
      if (sh.to === "street" || level.cells[(sh.y - 1) * level.w + sh.x] !== WALL) stand(`shaft${i}`, "ladder", sh.x, sh.y, 0, false, sh.y * 16 - 4);
    });
    this.sheet.refresh();
  }

  /** Light that does not move: wall lamps, and daylight down the shafts. */
  private bake(f: SewerFrame) {
    const { level } = this;
    const day = Math.max(0, Math.min(1, 1.25 - Math.abs(f.hour - 12.5) / 6));
    const key = `${[...f.open].join(";")}|${Math.round(day * 10)}`;
    if (key === this.stillKey) return;
    this.stillKey = key;
    this.lamp.still.fill(0);
    const add = (cx: number, cy: number, radius: number, rgb: readonly number[], power: number) => this.lamp.addStill(cx, cy, radius, rgb, power);
    const night = day < 0.15;
    for (const l of level.lamps) add(l.x + 0.5, l.y + 0.3, 5.5, [1, 0.78, 0.45], 0.75);
    for (const t of level.things) {
      const glow = sewerFind(t.find)?.glow;
      if (glow) add(t.x + 0.5, t.y + (t.wall ? 0.8 : 0.5), 3.5, [1, 0.62, 0.3].map((v, i) => (parseInt(glow.slice(1 + i * 2, 3 + i * 2), 16) / 255 + v) / 2), 0.7);
    }
    for (const s of level.shafts) {
      if (s.to !== "street" || !s.world) continue;
      // The onsetter's lamps at the shaft bottom; daylight down an adit.
      if (level.mouth === "cage") {
        add(s.x + 0.5, s.y + 1, 6, [1, 0.8, 0.5], 0.8);
        continue;
      }
      if (level.mouth === "adit") {
        add(s.x + 0.5, s.y + 0.5, 6.5, night ? [0.4, 0.45, 0.7] : [1, 0.97, 0.88], night ? 0.25 : 0.4 + day * 0.7);
        continue;
      }
      const open = f.open.has(`${s.world.x},${s.world.y}`);
      // An open lid lets a pool of daylight down; a shut one a few points through its holes.
      const sky = night ? [0.9, 0.62, 0.32] : [1, 0.97, 0.88];
      add(s.x + 0.5, s.y + 0.5, open ? 4.5 : 2.2, sky, (open ? 1.1 : 0.35) * (night ? 0.35 : 0.3 + day * 0.7));
    }
  }

  update(f: SewerFrame) {
    if (!this.born) this.born = f.time;
    const stamp = `${f.done.join("|")}#${f.falls.length}`;
    if (stamp !== this.stamp) {
      this.stamp = stamp;
      this.repaint(new Set(f.done), f.falls);
    }
    this.bake(f);
    const lit = f.run.left > 0;
    const low = lit ? Math.min(1, f.run.left / (f.light.burns * 0.2)) : 0;
    const t = f.time / 1000;
    const flick = !lit ? 1 : f.light.flame ? 0.9 + 0.06 * Math.sin(t * 9.1) + 0.04 * Math.sin(t * 23.7 + 1.3) : 1 - (1 - low) * 0.15 * (Math.sin(t * 13) > 0.7 ? 1 : 0);
    // Afterdamp starves a flame down to a bead.
    const reach = lit ? f.light.reach * (0.6 + 0.4 * low) * (f.light.flame && this.peril.choke(f) ? 0.45 : 1) : 0;
    const hue = parseInt(f.light.color.slice(1), 16);
    const color = [16, 8, 0].map((s) => 0.5 + (((hue >> s) & 255) / 255) * 0.5);
    this.lamp.look(f.x, f.y, Math.ceil(Math.max(reach, 6)) + 2);
    this.lamp.update({ x: f.x, y: f.y, facing: f.facing, delta: f.delta, reach: lit ? reach : 0, flick, color, beam: lit && !f.light.flame, carried: f.carried, daylit: SewerView.daylit });
    const cam = this.scene.cameras.main.worldView;
    this.lamp.halo.setPosition(f.x, f.y - 10).setScale((Math.max(reach, 1) * 16 * 1.5) / 64).setTint(hue).setAlpha(lit ? (f.light.flame ? 0.18 : 0.08) * flick : 0);
    this.drawWater(f, cam);
    this.surface.update(f.time, 14 + f.run.surge * 40);
    this.flotsam.update(f.time, f.delta, f.run.surge, cam);
    this.gas.update(f.time, f.delta, (x, y) => SewerView.daylit || this.lamp.seen[y * this.level.w + x] === 1, f);
    this.drawBeams(f);
    this.moveRats(f);
    this.effects(f, reach);
    this.peril.update(f);
    this.drawHud(f, lit);
  }

  /** The current: pale streaks sliding downstream, faster when it rains. */
  private drawWater(f: SewerFrame, cam: Phaser.Geom.Rectangle) {
    const { level } = this, { w } = level, g = this.water, pal = paletteOf(level);
    g.clear();
    const surge = f.run.surge;
    const speed = 14 + surge * 40;
    const foam = Phaser.Display.Color.GetColor(pal.water[3][0], pal.water[3][1], pal.water[3][2]);
    const brown = Phaser.Display.Color.GetColor(96, 74, 44);
    if (surge > 0.05) {
      g.fillStyle(brown, surge * 0.45);
      for (const i of this.wet) {
        const x = (i % w) * 16, y = Math.floor(i / w) * 16;
        if (x > cam.x - 16 && x < cam.right && y > cam.y - 16 && y < cam.bottom) g.fillRect(x, y + 3, 16, 13);
      }
    }
    const t = f.time / 1000;
    for (const i of this.wet) {
      const x = (i % w) * 16, y = Math.floor(i / w) * 16;
      if (x < cam.x - 16 || x > cam.right || y < cam.y - 16 || y > cam.bottom) continue;
      const dir = level.flow[i];
      const deep = level.cells[i] === DEEP;
      if (dir < 0) {
        g.fillStyle(foam, 0.25 + 0.2 * Math.sin(t * 1.7 + i));
        g.fillRect(x + 4 + (i % 7), y + 6 + Math.round(Math.sin(t + i) * 2), 3, 1);
        continue;
      }
      const [dx, dy] = DIRS[dir];
      const s = dx || dy, along = dx ? x : y, side = dx ? y : x;
      const q0 = s > 0 ? along : -(along + 16);
      const cx = i % w, cy = Math.floor(i / w);
      // Foam lapping at the banks, carried along with the water.
      for (const [nx, ny] of DIRS) {
        if (this.wetAt(cx + nx, cy + ny) || level.cells[(cy + ny) * w + cx + nx] === GRATE) continue;
        const runs = (nx === 0) === (dx !== 0);
        for (let b = 0; b < 2; b++) {
          const hsh = ((i * 37 + b * 101 + nx * 7 + ny * 3) * 2654435761) >>> 0;
          if (b && hsh % 3 === 0) continue;
          const o = (hsh % 16) + (runs ? t * speed * (0.5 + (hsh % 5) * 0.08) * s : Math.sin(t * 2 + b + i) * 1.5);
          const at = Math.floor(((o % 16) + 16) % 16), n = 1 + (hsh % 3);
          g.fillStyle(foam, 0.3 + (hsh % 4) * 0.1);
          if (nx) g.fillRect(nx > 0 ? x + 14 : x + 1, y + at, 1, n);
          else g.fillRect(x + at, ny > 0 ? y + 14 : y + (deep ? 9 : 6), n, 1);
        }
      }
      // The lamp catching the surface.
      if (Math.abs(x + 8 - f.x) < 72 && Math.abs(y + 8 - f.y) < 56) {
        const slot = Math.floor(t * 4 + (i % 5) * 0.2);
        const r = (((i * 2654435761) ^ (slot * 40503)) >>> 0) / 4294967296;
        if (r < 0.12) {
          g.fillStyle(0xffffff, 0.85);
          g.fillRect(x + Math.floor(r * 100) % 14 + 1, y + Math.floor(r * 1000) % 10 + 4, 1, 1);
        }
      }
      // Wavelets down the middle: a V whose point runs downstream.
      const lo = this.wetAt(cx - (dy ? 1 : 0), cy - (dx ? 1 : 0)), hi = this.wetAt(cx + (dy ? 1 : 0), cy + (dx ? 1 : 0));
      if (lo && hi) continue;
      const mid = side + (lo ? 0 : hi ? 16 : 8);
      const v = speed * (deep ? 1.5 : 1) * 0.9, period = 56;
      const start = (((t * v) % period) + period) % period;
      g.fillStyle(foam, 0.32 + surge * 0.25);
      for (let k = Math.floor((q0 - start) / period); start + k * period < q0 + 16 + 9; k++) {
        const apex = start + k * period;
        for (let a = 0; a <= 5; a++) {
          const q = Math.round(apex - a * 1.6);
          if (q < q0 || q >= q0 + 16) continue;
          const u = s > 0 ? q : -q - 1;
          for (const arm of [-1, 1]) {
            if ((arm < 0 && lo) || (arm > 0 && hi)) continue;
            if (!lo && !hi && a === 0 && arm > 0) continue;
            const off = mid + arm * a;
            if (dx) g.fillRect(u, off, 2, 1);
            else g.fillRect(off, u, 1, 2);
          }
        }
      }
    }
  }

  private wetAt(x: number, y: number) {
    const { w, h, cells } = this.level;
    return x >= 0 && y >= 0 && x < w && y < h && (cells[y * w + x] === WATER || cells[y * w + x] === DEEP);
  }

  /** Daylight falling down the shafts under open lids. */
  private drawBeams(f: SewerFrame) {
    const g = this.beams;
    g.clear();
    const day = Math.max(0, Math.min(1, 1.25 - Math.abs(f.hour - 12.5) / 6));
    if (day < 0.1) return;
    for (const s of this.level.shafts) {
      if (s.to !== "street" || !s.world || this.level.mouth === "cage" || (!this.level.mouth && !f.open.has(`${s.world.x},${s.world.y}`))) continue;
      const mx = s.x * 16 + 8, my = s.y * 16 + 12;
      for (let i = 0; i < 7; i++) {
        g.fillStyle(0xfff4d8, 0.03 * day);
        g.fillTriangle(mx - 9 + i, my - 60, mx + 9 - i, my - 60, mx + (i - 3) * 2, my);
      }
      g.fillStyle(0xfff4d8, 0.08 * day);
      g.fillEllipse(mx, my + 1, 18 - (f.time / 400) % 1, 7);
    }
  }

  private moveRats(f: SewerFrame) {
    const { level } = this, { w } = level;
    const ok = (x: number, y: number) => {
      const c = level.cells[Math.floor(y / 16) * w + Math.floor(x / 16)];
      return c !== undefined && walkable(c) && c !== WATER;
    };
    let fright = false;
    for (const r of this.rats) {
      const near = Math.hypot(r.x - f.x, r.y - f.y) < 40;
      if (near && !r.fled) (r.fled = true), (r.wait = 0), (fright = true);
      if (r.wait > 0) r.wait -= f.delta;
      else if (Math.hypot(r.tx - r.x, r.ty - r.y) < 1) {
        r.wait = r.fled ? 0 : 800 + Math.random() * 4000;
        for (let n = 0; n < 8; n++) {
          const a = r.fled ? Math.atan2(r.y - f.y, r.x - f.x) + (Math.random() - 0.5) : Math.random() * Math.PI * 2;
          const d = r.fled ? 30 + Math.random() * 30 : 10 + Math.random() * 30;
          const tx = r.x + Math.cos(a) * d, ty = r.y + Math.sin(a) * d * 0.6;
          if (ok(tx, ty)) {
            r.tx = tx;
            r.ty = ty;
            break;
          }
        }
        if (r.fled && Math.hypot(r.x - f.x, r.y - f.y) > 90) r.fled = false;
      } else {
        const sp = (r.fled ? 0.12 : 0.05) * f.delta, d = Math.hypot(r.tx - r.x, r.ty - r.y);
        r.x += ((r.tx - r.x) / d) * Math.min(sp, d);
        r.y += ((r.ty - r.y) / d) * Math.min(sp, d);
      }
      const left = r.tx < r.x;
      r.im.setPosition(Math.round(r.x), Math.round(r.y)).setDepth(r.y);
      r.tail.setPosition(Math.round(r.x + (left ? 3 : -3)), Math.round(r.y) + 1).setDepth(r.y);
    }
    if (fright) this.sound?.("rats", 0.8);
  }

  private spark(x: number, y: number, color: number, life: number, vy = 0, size = 1, depth = 3002) {
    const r = this.scene.add.rectangle(x, y, size, size, color).setDepth(depth);
    if (depth >= 3000) r.setBlendMode(Phaser.BlendModes.ADD);
    this.live.add(r);
    this.scene.tweens.add({ targets: r, alpha: 0, y: y + vy, duration: life, onComplete: () => (this.live.delete(r), r.destroy()) });
  }

  private effects(f: SewerFrame, reach: number) {
    const { level, scene } = this, { w } = level;
    const near = (x: number, y: number, r = Math.max(reach, 5) * 16) => Math.hypot(x - f.x, y - f.y) < r;
    const nearness = (x: number, y: number) => Math.max(0, 1 - Math.hypot(x - f.x, y - f.y) / 260);
    const now = f.time;
    if (now > this.next.drip) {
      this.next.drip = now + 900 + Math.random() * 2600;
      const gx = Math.floor(f.x / 16 + (Math.random() - 0.5) * 10), gy = Math.floor(f.y / 16 + (Math.random() - 0.5) * 8);
      const c = level.cells[gy * w + gx];
      if (c !== undefined && c !== WALL && near(gx * 16, gy * 16)) {
        const dx = gx * 16 + 2 + Math.random() * 12, dy = gy * 16 + 4 + Math.random() * 10;
        const drop = scene.add.rectangle(dx, dy - 30, 1, 3, 0xcfe0d8).setDepth(2999).setAlpha(0.85);
        this.live.add(drop);
        scene.tweens.add({
          targets: drop, y: dy, duration: 300, ease: "Quad.easeIn",
          onComplete: () => {
            this.live.delete(drop);
            drop.destroy();
            const ring = scene.add.ellipse(dx, dy, 2, 1).setStrokeStyle(1, 0xcfe0d8, 0.7).setDepth(-99970);
            this.live.add(ring);
            scene.tweens.add({ targets: ring, width: 10, height: 4, alpha: 0, duration: 480, onComplete: () => (this.live.delete(ring), ring.destroy()) });
            this.sound?.("drip", nearness(dx, dy));
          },
        });
      }
    }
    // A thin stream out of a house drain now and then.
    if (now > this.next.trickle) {
      this.next.trickle = now + 300 + Math.random() * 500;
      const pipes = level.decor.filter((d) => d.type === "outfall" && near(d.x * 16, d.y * 16, 200));
      const d = pipes[Math.floor(Math.random() * pipes.length)];
      if (d && d.v > 0.3) {
        const ox = d.x * 16 + 5 + Math.floor(d.v * 8), oy = d.y * 16 + 6;
        for (let k = 0; k < 3; k++) this.spark(ox + Math.random(), oy + k * 2, 0xa8b890, 380, 16, 1, oy + 30);
      }
    }
    if (level.kind === "collector" && now > this.next.steam) {
      this.next.steam = now + 2500 + Math.random() * 4000;
      const sx = f.x + (Math.random() - 0.5) * 200, sy = f.y - 30 - Math.random() * 40;
      for (let k = 0; k < 14; k++) {
        const puff = scene.add.ellipse(sx + Math.random() * 8, sy, 5, 4, 0xe8ecf0, 0.18).setDepth(2995);
        this.live.add(puff);
        scene.tweens.add({ targets: puff, y: sy - 20 - Math.random() * 20, x: `+=${(Math.random() - 0.5) * 16}`, scale: 3, alpha: 0, delay: k * 60, duration: 1600, onComplete: () => (this.live.delete(puff), puff.destroy()) });
      }
      this.sound?.("steam", nearness(sx, sy));
    }
    if (now > this.next.knock) {
      this.next.knock = now + 9000 + Math.random() * 16000;
      if (this.born < now - 3000)
        this.sound?.(this.mine
          ? level.depth < 3 && Math.random() < 0.3 ? "shot" : level.depth < 3 && Math.random() < 0.5 ? "tub" : "creak"
          : level.layer === "street" && Math.random() < 0.5 ? "car" : level.layer === "trunk" && Math.random() < 0.4 ? "rumble" : "knock", 0.6);
    }
    // Someone hewing at a face: the knock of the pick and a spit of chips.
    if (this.mine && level.depth < 3 && now > this.next.pick) {
      this.next.pick = now + 700 + Math.random() * 900;
      const faces = level.rooms.filter((r) => r.use === "face" || r.use === "stope" || r.use === "chamber");
      const r = faces[Math.floor((now / 9000) % Math.max(1, faces.length))];
      const o = paletteOf(level).ore![3], chip = Phaser.Display.Color.GetColor(o[0], o[1], o[2]);
      if (r) {
        const fx = (r.x + 1 + ((now / 4000) % Math.max(1, r.w - 2))) * 16, fy = r.y * 16 + 2;
        if (near(fx, fy, 160)) for (let k = 0; k < 3; k++) this.spark(fx + Math.random() * 6, fy + Math.random() * 3, chip, 260, 8 + Math.random() * 6, 1, fy + 20);
        this.sound?.("pick", nearness(fx, fy) * 0.9);
      }
    }
    // Boots in the channel.
    const cell = Math.floor((f.y - 1) / 16) * w + Math.floor(f.x / 16);
    if (cell !== this.lastCell) {
      this.lastCell = cell;
      if (level.cells[cell] === WATER && now > this.next.splash) {
        this.next.splash = now + 250;
        this.sound?.("splash", 0.8);
      }
    }
    if (f.run.surge > 0.35 && this.surged < 0.35) this.sound?.("rush", 1);
    this.surged = f.run.surge;
    const took = f.run.took;
    if (took && took.clock !== this.took) {
      this.took = took.clock;
      const tx = took.at.x * 16 + 8, ty = took.at.y * 16 + 6;
      for (let i = 0; i < 10; i++) this.spark(tx - 6 + Math.random() * 12, ty - 4 + Math.random() * 8, 0xffe8a0, 500 + Math.random() * 300, -10 - Math.random() * 14, 1 + (i % 2));
      this.sound?.("take", 1);
    }
    // Grates glint where the lamp catches the bars.
    if (Math.random() < 0.02) {
      const gx = Math.floor(f.x / 16 + (Math.random() - 0.5) * reach * 2), gy = Math.floor(f.y / 16 + (Math.random() - 0.5) * reach * 2);
      if (level.cells[gy * w + gx] === GRATE && this.lamp.vis[gy * w + gx]) this.spark(gx * 16 + 1 + Math.floor(Math.random() * 4) * 4, gy * 16 + 4 + Math.random() * 8, 0xffffff, 300);
    }
  }

  sound?: (what: SewerSound, volume: number) => void;

  private drawHud(f: SewerFrame, lit: boolean) {
    const frac = Math.max(0, Math.min(1, f.run.left / f.light.burns));
    const where = {
      street: "UNDER THE STREET", trunk: "TRUNK SEWER", old: this.mine ? "OLD WORKINGS" : "BELOW THE SEWERS",
      level: this.level.mouth === "cage" ? "PIT BOTTOM" : "ADIT LEVEL", workings: "IN THE WORKINGS",
      upper: this.level.kind === "ossuary" ? "THE OSSUARY" : "UPPER GALLERIES", lower: this.level.kind === "ossuary" ? "THE OLD QUARRIES" : "LOWER GALLERIES", deep: "THE FLOODED QUARRY",
    }[this.level.layer];
    this.hud.update(f.time, (g, x, y) => {
      g.fillStyle(0x0e120c, 0.85).fillRect(x - 2, y - 5, 62, 10);
      g.fillStyle(lit ? 0xfff0b0 : 0x5a5650).fillRect(x + 1, y - 2, 3, 4);
      g.fillStyle(0x2a302a).fillRect(x + 7, y - 2, 50, 4);
      g.fillStyle(frac < 0.2 ? (Math.floor(f.time / 300) % 2 ? 0xe04a2a : 0xff8a4a) : 0xd8e8a0).fillRect(x + 7, y - 2, Math.round(50 * frac), 4);
      if (f.run.surge > 0.05) g.fillStyle(0x8a6a3a).fillRect(x + 7, y + 3, Math.round(50 * f.run.surge), 1);
      return `${f.light.name.toUpperCase()}  ·  ${where}`;
    });
  }

  destroy() {
    for (const o of [...this.objects, ...this.tall.values(), ...this.live]) o.destroy();
    this.flotsam.destroy();
    this.surface.destroy();
    this.gas.destroy();
    this.peril.destroy();
    this.lamp.destroy();
    this.hud.destroy();
    const key = `sewer-${this.level.space}`;
    for (const k of [key, `${key}-sheet`, `${key}-top`]) if (this.scene.textures.exists(k)) this.scene.textures.remove(k);
  }
}

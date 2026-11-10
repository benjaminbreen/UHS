import Phaser from "phaser";
import { caveFind, type CaveLight } from "../../content/caves";
import type { CaveBeast, CaveRun } from "../../core/cave";
import { DEEP, SHALLOW, WALL, type CaveLevel } from "../../world/cave";
import { paintCaveObject, paintSnake } from "./art";
import { cavePalettes } from "./palette";
import { paintCaveTerrain } from "./terrain";

const CELL = 48, RISE = 40, PAD = 16;
/** Lightmap samples per cell edge. */
const SUB = 2;

export type CaveFrame = {
  /** The player's feet, in world pixels. */
  x: number;
  y: number;
  facing: number;
  run: CaveRun;
  done: readonly string[];
  light: CaveLight;
  /** Local hour, for the daylight in the mouth. */
  hour: number;
  time: number;
  delta: number;
  /** A drawn frame for an animal, from the scene's own fauna sheets. */
  beast(species: string, state: "idle" | "wander" | "chase", dir: number, stride: number): { texture: string; frame: string } | undefined;
};

/** One cave level on screen: the painted rock, the things standing in it,
 * and a light that falls off, flickers and stops at walls. */
export class CaveView {
  readonly space: string;
  /** Review switch: every cell fully lit, to look at the painting itself. */
  static daylit = false;
  private rock: HTMLCanvasElement;
  private base: Phaser.Textures.CanvasTexture;
  private sheet: Phaser.Textures.CanvasTexture;
  private map: Phaser.Textures.CanvasTexture;
  private small: CanvasRenderingContext2D;
  private mapData: ImageData;
  private cur: Float32Array;
  private vis: Uint8Array;
  private seen: Uint8Array;
  private day: Float32Array;
  private objects: Phaser.GameObjects.GameObject[] = [];
  private tall = new Map<string, Phaser.GameObjects.Image>();
  private beasts = new Map<string, { im: Phaser.GameObjects.Image; stride: number }>();
  private live = new Set<Phaser.GameObjects.GameObject>();
  private halo: Phaser.GameObjects.Image;
  private motes: { im: Phaser.GameObjects.Rectangle; ox: number; oy: number; phase: number }[] = [];
  private hud: Phaser.GameObjects.Graphics;
  private label: Phaser.GameObjects.Text;
  private banner: Phaser.GameObjects.Text;
  private stamp = "?";
  private at = -1;
  private aim = 0;
  private born = 0;
  private roused = 0;
  private nextDrip = 0;
  private nextBat = 0;
  private nextGlint = 0;
  private nextEmber = 0;
  private took = 0;
  private drips: { x: number; y: number }[];
  private glints: { x: number; y: number; id: string; color: number }[];

  constructor(private scene: Phaser.Scene, readonly level: CaveLevel) {
    this.space = level.space;
    const { w, h } = level, W = w * 16, H = h * 16;
    const key = `cave-${level.space}`;
    for (const k of [key, `${key}-sheet`, `${key}-light`]) if (scene.textures.exists(k)) scene.textures.remove(k);
    this.rock = document.createElement("canvas");
    this.rock.width = W;
    this.rock.height = H;
    paintCaveTerrain(this.rock.getContext("2d")!, level);
    this.base = scene.textures.createCanvas(key, W, H)!;
    const tallCount = level.decor.filter((d) => d.solid).length + level.things.filter((t) => t.solid).length + 2;
    this.sheet = scene.textures.createCanvas(`${key}-sheet`, CELL * 16, CELL * Math.ceil(tallCount / 16 + 1) + 8)!;
    // The game samples textures nearest-neighbour, so the light is smoothed
    // here, on the way from two samples a cell to eight pixels a cell.
    const small = document.createElement("canvas");
    small.width = w * SUB;
    small.height = h * SUB;
    this.small = small.getContext("2d")!;
    this.map = scene.textures.createCanvas(`${key}-light`, w * 8, h * 8)!;
    this.map.context.imageSmoothingEnabled = true;
    this.map.context.imageSmoothingQuality = "high";
    this.mapData = this.small.createImageData(w * SUB, h * SUB);
    this.cur = new Float32Array(w * SUB * h * SUB * 3);
    this.vis = new Uint8Array(w * h);
    this.seen = new Uint8Array(w * h);
    this.day = new Float32Array(w * h);
    if (level.depth === 1) {
      const lit = new Uint8Array(w * h);
      fov(level, level.entry.x, h - 2, 14, lit);
      for (let i = 0; i < w * h; i++) {
        const d = Math.hypot((i % w) - level.entry.x, Math.floor(i / w) - (h - 1));
        this.day[i] = lit[i] ? Math.max(0, 1 - d / 13) ** 1.4 : 0;
      }
    }
    this.objects.push(scene.add.image(0, 0, key).setOrigin(0, 0).setDepth(-99990));
    this.objects.push(
      scene.add.image(0, 0, `${key}-light`).setOrigin(0, 0).setScale(2).setDepth(3000).setBlendMode(Phaser.BlendModes.MULTIPLY),
    );
    if (!scene.textures.exists("cave-halo")) {
      const t = scene.textures.createCanvas("cave-halo", 128, 128)!;
      const g = t.context.createRadialGradient(64, 64, 0, 64, 64, 64);
      g.addColorStop(0, "rgba(255,255,255,0.55)");
      g.addColorStop(0.35, "rgba(255,255,255,0.2)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      t.context.fillStyle = g;
      t.context.fillRect(0, 0, 128, 128);
      t.refresh();
      const bat = scene.textures.createCanvas("cave-bat", 18, 5)!;
      bat.context.fillStyle = "#0c0a10";
      // Wings up, then wings down.
      for (const [x, y, wd, ht] of [[0, 0, 3, 1], [6, 0, 3, 1], [2, 1, 5, 2], [4, 3, 1, 1], [9, 2, 3, 1], [15, 2, 3, 1], [11, 1, 5, 2], [13, 0, 1, 1]]) bat.context.fillRect(x, y, wd, ht);
      bat.add("0", 0, 0, 0, 9, 5);
      bat.add("1", 0, 9, 0, 9, 5);
      bat.refresh();
      const snake = scene.textures.createCanvas("cave-snake", 16, 16)!;
      paintSnake(snake.context, 0, 0);
      snake.refresh();
    }
    this.halo = scene.add.image(0, 0, "cave-halo").setBlendMode(Phaser.BlendModes.ADD).setDepth(3001).setAlpha(0);
    this.objects.push(this.halo);
    for (let i = 0; i < 16; i++) {
      const im = scene.add.rectangle(0, 0, 1, 1, 0xfff0d0).setBlendMode(Phaser.BlendModes.ADD).setDepth(3002).setAlpha(0);
      this.motes.push({ im, ox: (Math.random() - 0.5) * 120, oy: (Math.random() - 0.5) * 90, phase: Math.random() * 6 });
      this.objects.push(im);
    }
    if (level.depth === 1) {
      // Daylight slanting in through the mouth.
      const shaft = scene.add.graphics().setDepth(3001).setBlendMode(Phaser.BlendModes.ADD);
      const mx = level.entry.x * 16 + 8;
      for (let i = 0; i < 9; i++) {
        shaft.fillStyle(0xfff2c8, 0.035);
        shaft.fillTriangle(mx - 22 + i * 2, H, mx + 22 - i * 2, H, mx + (i - 4) * 9, H - 70 - i * 11);
      }
      this.objects.push(shaft);
    }
    this.hud = scene.add.graphics().setDepth(1e7);
    const font = { fontFamily: "Silkscreen, monospace", fontSize: "8px", color: "#ffe6c0", stroke: "#120e0c", strokeThickness: 3 };
    this.label = scene.add.text(0, 0, "", font).setDepth(1e7).setOrigin(0, 0.5);
    this.banner = scene.add.text(0, 0, level.name[0].toUpperCase() + level.name.slice(1), { ...font, fontSize: "16px", strokeThickness: 4 }).setDepth(1e7).setOrigin(0.5, 0.5).setAlpha(0);
    this.objects.push(this.hud, this.label, this.banner);
    this.drips = level.decor.filter((d) => d.type === "drip").map((d) => ({ x: d.x * 16 + 3 + d.v * 10, y: d.y * 16 + 4 + d.v * 8 }));
    this.glints = level.things.flatMap((t) => {
      const glow = caveFind(t.find)?.glow;
      return glow ? [{ x: t.x * 16 + 8, y: t.y * 16 + (t.wall ? 2 : 4), id: t.id, color: parseInt(glow.slice(1), 16) }] : [];
    });
  }

  private repaint(done: Set<string>) {
    const { level } = this, pal = cavePalettes[level.kind];
    const g = this.base.context;
    g.drawImage(this.rock, 0, 0);
    for (const d of level.decor) if (!d.solid && d.type !== "drip") paintCaveObject(g, d.type, d.x * 16, d.y * 16, pal, d.v);
    for (const b of level.dwellers) if (b.species === "bats") paintCaveObject(g, "droppings", b.x * 16, b.y * 16, pal, 0.3);
    if (level.up) paintCaveObject(g, "up", level.up.x * 16, level.up.y * 16, pal);
    for (const t of level.things) if (!t.solid) paintCaveObject(g, t.art, t.x * 16, t.y * 16, pal, 0.5, done.has(t.id) && !caveFind(t.find)?.keeps);
    this.base.refresh();
    const s = this.sheet.context;
    s.clearRect(0, 0, this.sheet.width, this.sheet.height);
    let n = 0;
    const stand = (id: string, art: string, x: number, y: number, v: number, emptied: boolean) => {
      const fx = (n % 16) * CELL, fy = Math.floor(n / 16) * CELL;
      n++;
      paintCaveObject(s, art, fx + PAD, fy + RISE - 16, pal, v, emptied);
      if (!this.tall.has(id)) {
        this.sheet.add(id, 0, fx, fy, CELL, CELL);
        const im = this.scene.add.image(x * 16 - PAD, y * 16 - (RISE - 16), `${`cave-${level.space}`}-sheet`, id).setOrigin(0, 0).setDepth(y * 16 + 12);
        this.tall.set(id, im);
      }
    };
    for (const [i, d] of level.decor.entries()) if (d.solid) stand(`d${i}`, d.type, d.x, d.y, d.v, false);
    for (const t of level.things) if (t.solid) stand(t.id, t.art, t.x, t.y, 0.5, done.has(t.id) && !caveFind(t.find)?.keeps);
    if (level.down) stand("down", "down", level.down.x, level.down.y, 0, false);
    this.tall.get("down")?.setDepth(level.down ? level.down.y * 16 - 2 : 0);
    this.sheet.refresh();
  }

  update(f: CaveFrame) {
    const { level } = this, { w, h } = level;
    if (!this.born) this.born = f.time;
    const stamp = f.done.join("|");
    if (stamp !== this.stamp) {
      this.stamp = stamp;
      this.repaint(new Set(f.done));
    }
    const lit = f.run.left > 0;
    const low = lit ? Math.min(1, f.run.left / (f.light.burns * 0.2)) : 0;
    const t = f.time / 1000;
    const flick = !lit ? 1 : f.light.flame ? 0.9 + 0.06 * Math.sin(t * 9.1) + 0.04 * Math.sin(t * 23.7 + 1.3) - (1 - low) * 0.12 * (0.5 + 0.5 * Math.sin(t * 31)) : 1;
    const reach = lit ? f.light.reach * (0.6 + 0.4 * low) * (f.light.flame ? 0.97 + 0.03 * Math.sin(t * 6.3) : 1) : 1.7;
    const hue = parseInt(f.light.color.slice(1), 16);
    // Half way to white: firelight warms the rock without turning water green.
    const color = lit ? [16, 8, 0].map((s) => 0.5 + (((hue >> s) & 255) / 255) * 0.5) : [0.3, 0.36, 0.5];
    const px = f.x / 16, py = (f.y - 7) / 16;
    const cx = Math.max(0, Math.min(w - 1, Math.floor(f.x / 16))), cy = Math.max(0, Math.min(h - 1, Math.floor((f.y - 1) / 16)));
    if (cy * w + cx !== this.at) {
      this.at = cy * w + cx;
      fov(level, cx, cy, Math.ceil(f.light.reach) + 2, this.vis);
      // A back wall stands three cells tall over the floor it is seen from.
      for (let y = 3; y < h - 1; y++) for (let x = 0; x < w; x++)
        if (this.vis[y * w + x] && level.cells[y * w + x] === WALL && level.cells[(y + 1) * w + x] !== WALL) this.vis[(y - 1) * w + x] = this.vis[(y - 2) * w + x] = 1;
    }
    // A beam looks where you look; a flame lights all round.
    const want = [-Math.PI / 2, 0, Math.PI / 2, Math.PI][f.facing] ?? 0;
    let turn = want - this.aim;
    while (turn > Math.PI) turn -= Math.PI * 2;
    while (turn < -Math.PI) turn += Math.PI * 2;
    this.aim += turn * Math.min(1, f.delta / 140);
    const beam = lit && !f.light.flame;
    const noon = Math.max(0.12, Math.min(1, 1.25 - Math.abs(f.hour - 12.5) / 6));
    const k = 1 - Math.exp(-f.delta / 80);
    const gw = w * SUB, out = this.mapData.data, cur = this.cur;
    for (let gy = 0; gy < h * SUB; gy++)
      for (let gx = 0; gx < gw; gx++) {
        const cell = (gy >> 1) * w + (gx >> 1);
        const dx = (gx + 0.5) / SUB - px, dy = (gy + 0.5) / SUB - py;
        const d = Math.hypot(dx, dy);
        let L = 0;
        if (CaveView.daylit) L = 1;
        else if (this.vis[cell]) {
          let r = reach;
          if (beam && d > 1.2) {
            let off = Math.abs(Math.atan2(dy, dx) - this.aim);
            if (off > Math.PI) off = Math.PI * 2 - off;
            r *= off < 0.55 ? 1 : off < 1.1 ? 1 - ((off - 0.55) / 0.55) * 0.62 : 0.38;
          }
          const u = d / r;
          L = u >= 1 ? 0 : (1 - u * u) ** 0.8 * flick;
          if (L > 0.06) this.seen[cell] = 1;
        }
        const sun = this.day[cell] * noon;
        if (sun > 0.1) this.seen[cell] = 1;
        const mem = this.seen[cell] ? 0.17 : 0;
        const i = (gy * gw + gx) * 3, o = (gy * gw + gx) * 4;
        cur[i] += (Math.min(1, L * color[0] * 1.08 + sun + mem * 0.62) - cur[i]) * k;
        cur[i + 1] += (Math.min(1, L * color[1] * 1.04 + sun * 0.97 + mem * 0.72) - cur[i + 1]) * k;
        cur[i + 2] += (Math.min(1, L * color[2] + sun * 0.9 + mem) - cur[i + 2]) * k;
        out[o] = cur[i] * 255;
        out[o + 1] = cur[i + 1] * 255;
        out[o + 2] = cur[i + 2] * 255;
        out[o + 3] = 255;
      }
    this.small.putImageData(this.mapData, 0, 0);
    this.map.context.drawImage(this.small.canvas, 0, 0, w * 8, h * 8);
    this.map.refresh();

    const tint = parseInt(f.light.color.slice(1), 16);
    this.halo.setPosition(f.x, f.y - 10).setScale((reach * 16 * 1.5) / 64).setTint(tint).setAlpha(lit ? (f.light.flame ? 0.2 : 0.1) * flick : 0);
    for (const m of this.motes) {
      m.phase += f.delta / 2600;
      const mx = f.x + m.ox + Math.sin(m.phase * 1.7 + m.oy) * 9, my = f.y - 12 + m.oy + Math.cos(m.phase + m.ox) * 6 - ((m.phase * 5) % 30);
      const near = 1 - Math.hypot(mx - f.x, my - f.y + 10) / (reach * 16);
      m.im.setPosition(mx, my).setAlpha(lit && near > 0 ? near * 0.55 * (0.5 + 0.5 * Math.sin(m.phase * 3)) : 0).setFillStyle(tint);
    }
    if (lit && f.light.flame && f.time > this.nextEmber) {
      // The flame itself, carried at the shoulder, and what it sheds.
      this.nextEmber = f.time + 70;
      const hx = f.x + (f.facing === 3 ? -6 : 6), hy = f.y - 19;
      this.spark(hx + Math.random() * 2 - 1, hy, 0xffd070, 240, -5, 2);
      this.spark(hx, hy + 1, 0xff7a20, 200, -3, 2);
      if (Math.random() < 0.15) this.spark(hx, hy - 2, 0xffb040, 700, -16 - Math.random() * 10, 1);
    }
    this.syncBeasts(f);
    this.effects(f, lit, reach);
    this.drawHud(f, lit);
  }

  private syncBeasts(f: CaveFrame) {
    const here = new Set<string>();
    for (const b of f.run.beasts) {
      if (b.species === "bats") continue;
      here.add(b.id);
      const tx = b.x * 16 + 8, ty = b.y * 16 + 16;
      let v = this.beasts.get(b.id);
      const moving = !!v && (Math.abs(v.im.x - tx) > 0.6 || Math.abs(v.im.y - ty) > 0.6);
      const state = b.mood === "hunting" || b.mood === "fled" ? (moving ? "chase" : "idle") : "idle";
      const art = b.species === "snake" ? { texture: "cave-snake", frame: "__BASE" } : f.beast(b.species, state, b.dir, v?.stride ?? 0);
      if (!art) continue;
      if (!v) {
        v = { im: this.scene.add.image(tx, ty, art.texture, art.frame), stride: 0 };
        this.beasts.set(b.id, v);
      }
      v.im.setTexture(art.texture, art.frame);
      if (v.im.frame.customPivot) v.im.setOriginFromFrame();
      else v.im.setOrigin(0.5, 1);
      const step = Math.min(1, f.delta / 160);
      v.im.x += (tx - v.im.x) * step;
      v.im.y += (ty - v.im.y) * step;
      if (moving) v.stride += f.delta / 95;
      v.im.setDepth(v.im.y - 2);
      // Asleep, it breathes.
      v.im.setScale(1, b.mood === "asleep" && b.species !== "snake" ? 0.94 + 0.03 * Math.sin(f.time / 700) : 1);
      const struck = b.hit !== undefined && f.run.left >= 0 && this.flashUntil(b) > f.time;
      if (struck) v.im.setTintFill(0xffffff);
      else v.im.clearTint();
    }
    for (const [id, v] of this.beasts) if (!here.has(id)) (v.im.destroy(), this.beasts.delete(id));
  }
  private flashes = new Map<string, { hit: number; until: number }>();
  private flashUntil(b: CaveBeast) {
    const known = this.flashes.get(b.id);
    if (known && known.hit === b.hit) return known.until;
    const until = this.scene.time.now + 110;
    this.flashes.set(b.id, { hit: b.hit!, until });
    return until;
  }

  private spark(x: number, y: number, color: number, life: number, vy = 0, size = 1) {
    const r = this.scene.add.rectangle(x, y, size, size, color).setBlendMode(Phaser.BlendModes.ADD).setDepth(3002);
    this.live.add(r);
    this.scene.tweens.add({ targets: r, alpha: 0, y: y + vy, duration: life, onComplete: () => (this.live.delete(r), r.destroy()) });
  }

  private effects(f: CaveFrame, lit: boolean, reach: number) {
    const { level, scene } = this, { w } = level;
    const near = (x: number, y: number) => Math.hypot(x - f.x, y - f.y) < reach * 16;
    if (f.time > this.nextDrip && this.drips.length) {
      this.nextDrip = f.time + 2200 + Math.random() * 3800;
      const d = this.drips[Math.floor(Math.random() * this.drips.length)];
      if (near(d.x, d.y)) {
        const drop = scene.add.rectangle(d.x, d.y - 26, 1, 3, 0xcfeaf2).setDepth(3002).setAlpha(0.9);
        this.live.add(drop);
        scene.tweens.add({
          targets: drop, y: d.y, duration: 260, ease: "Quad.easeIn",
          onComplete: () => {
            this.live.delete(drop);
            drop.destroy();
            const ring = scene.add.ellipse(d.x, d.y, 2, 1).setStrokeStyle(1, 0xcfeaf2, 0.8).setDepth(d.y - 20);
            this.live.add(ring);
            scene.tweens.add({ targets: ring, width: 12, height: 5, alpha: 0, duration: 520, onComplete: () => (this.live.delete(ring), ring.destroy()) });
            this.sound?.("drip", Math.min(1, 1 - Math.hypot(d.x - f.x, d.y - f.y) / (reach * 16)));
          },
        });
      }
    }
    if (lit && f.time > this.nextGlint) {
      this.nextGlint = f.time + 90 + Math.random() * 160;
      // Water and crystal throw the light back in points.
      const gx = Math.floor(f.x / 16 + (Math.random() - 0.5) * reach * 2), gy = Math.floor(f.y / 16 + (Math.random() - 0.5) * reach * 2);
      const c = gx >= 0 && gy >= 0 && gx < w && gy < level.h ? level.cells[gy * w + gx] : WALL;
      if ((c === SHALLOW || c === DEEP) && this.vis[gy * w + gx]) {
        const sx = gx * 16 + Math.random() * 16, sy = gy * 16 + Math.random() * 16;
        const dash = scene.add.rectangle(sx, sy, 3, 1, 0xd8f4f4).setBlendMode(Phaser.BlendModes.ADD).setDepth(-99000).setAlpha(0);
        this.live.add(dash);
        scene.tweens.add({ targets: dash, alpha: 0.75, x: sx + 3, duration: 380, yoyo: true, onComplete: () => (this.live.delete(dash), dash.destroy()) });
      }
      const done = new Set(f.done);
      const g = this.glints[Math.floor(Math.random() * (this.glints.length + 2))];
      if (g && !done.has(g.id) && near(g.x, g.y)) {
        const sx = g.x - 6 + Math.random() * 12, sy = g.y - 6 + Math.random() * 10;
        this.spark(sx, sy, 0xffffff, 320, 0, 1);
        this.spark(sx - 1, sy, g.color, 260, 0, 3);
        this.spark(sx, sy - 1, g.color, 260, 0, 1);
        this.spark(sx, sy + 1, g.color, 260, 0, 1);
      }
    }
    const rousedNow = f.run.roused.length;
    if (rousedNow > this.roused) {
      const id = f.run.roused[rousedNow - 1];
      const roost = level.dwellers.find((b) => b.id === id);
      if (roost) this.flight(roost.x * 16 + 8, roost.y * 16, 22, f);
      this.sound?.("bats", 1);
    }
    this.roused = rousedNow;
    if (f.time > this.nextBat) {
      this.nextBat = f.time + 9000 + Math.random() * 14000;
      if (level.kind !== "ice" && this.born !== f.time) this.flight(f.x + (Math.random() < 0.5 ? -110 : 110), f.y - 30 - Math.random() * 40, 1, f, true);
    }
    const took = f.run.took;
    if (took && took.clock !== this.took) {
      this.took = took.clock;
      const tx = took.at.x * 16 + 8, ty = took.at.y * 16 + 6;
      for (let i = 0; i < 10; i++) this.spark(tx - 6 + Math.random() * 12, ty - 4 + Math.random() * 8, 0xffe8a0, 500 + Math.random() * 300, -10 - Math.random() * 14, 1 + (i % 2));
      this.sound?.("take", 1);
    }
  }

  /** Bats leaving a roost, or one passing through the light. */
  private flight(x: number, y: number, n: number, f: CaveFrame, across = false) {
    const { scene } = this;
    for (let i = 0; i < n; i++) {
      const bat = scene.add.image(x + (Math.random() - 0.5) * 10, y + (Math.random() - 0.5) * 8, "cave-bat", "0").setDepth(2990);
      this.live.add(bat);
      const a = Math.random() * Math.PI * 2, far = 150 + Math.random() * 120;
      const tx = across ? f.x * 2 - x + (Math.random() - 0.5) * 30 : x + Math.cos(a) * far;
      const ty = across ? y + (Math.random() - 0.5) * 50 : y + Math.sin(a) * far * 0.7 - 30;
      const life = across ? 1500 : 900 + Math.random() * 900;
      const flap = scene.time.addEvent({ delay: 70 + Math.random() * 30, loop: true, callback: () => bat.setFrame(bat.frame.name === "0" ? "1" : "0") });
      scene.tweens.add({
        targets: bat, x: tx, duration: life, delay: across ? 0 : i * 25, ease: "Sine.easeIn",
        onComplete: () => (flap.remove(), this.live.delete(bat), bat.destroy()),
      });
      scene.tweens.add({ targets: bat, y: ty, duration: life, delay: across ? 0 : i * 25, ease: "Sine.easeInOut" });
      // First they mill about your head.
      if (!across) scene.tweens.add({ targets: bat, y: `+=${(Math.random() - 0.5) * 30}`, duration: 180, yoyo: true, repeat: 1 });
    }
  }

  /** Set by the scene: one-shot sounds the view's own effects ask for. */
  sound?: (what: "drip" | "bats" | "take", volume: number) => void;

  private drawHud(f: CaveFrame, lit: boolean) {
    const cam = this.scene.cameras.main, v = cam.worldView;
    const x = v.x + 10, y = v.bottom - 62 / cam.zoom;
    const frac = Math.max(0, Math.min(1, f.run.left / f.light.burns));
    const g = this.hud;
    g.clear();
    g.fillStyle(0x120e0c, 0.85).fillRect(x - 2, y - 5, 62, 10);
    // The flame, or the dead wick.
    g.fillStyle(lit ? 0xffb040 : 0x5a5650).fillRect(x + 1, y - 2, 3, 4);
    if (lit) g.fillStyle(0xfff0a0).fillRect(x + 2, y - 3 - (Math.floor(f.time / 120) % 2), 1, 3);
    g.fillStyle(0x3a302a).fillRect(x + 7, y - 2, 50, 4);
    g.fillStyle(frac < 0.2 ? (Math.floor(f.time / 300) % 2 ? 0xe04a2a : 0xff8a4a) : 0xffc060).fillRect(x + 7, y - 2, Math.round(50 * frac), 4);
    g.fillStyle(0xfff0c0, 0.5).fillRect(x + 7, y - 2, Math.round(50 * frac), 1);
    this.label.setPosition(x + 64, y).setText(`${f.light.name.toUpperCase()}  ·  LEVEL ${this.level.depth}`);
    const age = f.time - this.born;
    this.banner.setPosition(v.centerX, v.y + v.height * 0.2).setAlpha(age < 600 ? age / 600 : age < 2600 ? 1 : Math.max(0, 1 - (age - 2600) / 900));
  }

  destroy() {
    for (const o of [...this.objects, ...this.tall.values(), ...this.live]) o.destroy();
    for (const v of this.beasts.values()) v.im.destroy();
    const key = `cave-${this.level.space}`;
    for (const k of [key, `${key}-sheet`, `${key}-light`]) if (this.scene.textures.exists(k)) this.scene.textures.remove(k);
  }
}

/** Recursive shadowcasting: the cells seen from one cell, walls included. */
function fov(level: CaveLevel, ox: number, oy: number, radius: number, out: Uint8Array) {
  const { w, h, cells } = level;
  out.fill(0);
  if (ox < 0 || oy < 0 || ox >= w || oy >= h) return;
  out[oy * w + ox] = 1;
  const opaque = (x: number, y: number) => x < 0 || y < 0 || x >= w || y >= h || cells[y * w + x] === WALL;
  const cast = (row: number, start: number, end: number, xx: number, xy: number, yx: number, yy: number) => {
    if (start < end) return;
    let next = 0, blocked = false;
    for (let dist = row; dist <= radius && !blocked; dist++) {
      const dy = -dist;
      for (let dx = -dist; dx <= 0; dx++) {
        const x = ox + dx * xx + dy * xy, y = oy + dx * yx + dy * yy;
        const l = (dx - 0.5) / (dy + 0.5), r = (dx + 0.5) / (dy - 0.5);
        if (start < r) continue;
        if (end > l) break;
        if (dx * dx + dy * dy <= radius * radius && x >= 0 && y >= 0 && x < w && y < h) out[y * w + x] = 1;
        if (blocked) {
          if (opaque(x, y)) next = r;
          else (blocked = false), (start = next);
        } else if (opaque(x, y) && dist < radius) {
          blocked = true;
          cast(dist + 1, start, l, xx, xy, yx, yy);
          next = r;
        }
      }
    }
  };
  const m = [[1, 0, 0, -1, -1, 0, 0, 1], [0, 1, -1, 0, 0, -1, 1, 0], [0, 1, 1, 0, 0, -1, -1, 0], [1, 0, 0, 1, -1, 0, 0, -1]];
  for (let o = 0; o < 8; o++) cast(1, 1, 0, m[0][o], m[1][o], m[2][o], m[3][o]);
}

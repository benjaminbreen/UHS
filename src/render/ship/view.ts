import Phaser from "phaser";
import type { Hull } from "../../content/ships";
import type { ShipLevel } from "../../world/ship";
import { washAt } from "../lighting";
import { hullGeom, paintBelow, paintWeatherDeck, type HullGeom } from "./hull";
import { seaRamp, shipPalette } from "./palette";
import type { Raster } from "./raster";
import { paintRig, type Nation, type Rig } from "./rig";
import { paintThing } from "./things";

export type ShipLook = { hull: Hull; nation: Nation; name: string; lands: number; landed: boolean };
export type ShipFrame = { x: number; y: number; clock: number; time: number; delta: number };

/** One deck of the ship on screen: the sea going by, the hull, what stands on
 * deck, the rig over it all, and the day's light or the lanterns below. */
export class ShipView {
  readonly space: string;
  private keys: string[] = [];
  private objects: Phaser.GameObjects.GameObject[] = [];
  private live = new Set<Phaser.GameObjects.GameObject>();
  private sea?: Phaser.GameObjects.TileSprite;
  private swell?: Phaser.GameObjects.TileSprite;
  private foam?: Phaser.GameObjects.Graphics;
  private sails?: Phaser.GameObjects.Image;
  private flags: { im: Phaser.GameObjects.Image; n: number }[] = [];
  private shade: Phaser.GameObjects.Rectangle;
  private glows: { im: Phaser.GameObjects.Image; x: number; y: number; swing: number; below: boolean }[] = [];
  private smoke: { x: number; y: number; kind: "funnel" | "fire" | "incense"; next: number }[] = [];
  private label: Phaser.GameObjects.Text;
  private banner: Phaser.GameObjects.Text;
  private g?: HullGeom;
  private rig?: Rig;
  private lat: number;
  private born = 0;
  private next = { dolphin: 0, fish: 0, bird: 0, spout: 0, glint: 0 };

  constructor(private scene: Phaser.Scene, readonly level: ShipLevel, private look: ShipLook, year: number, lat: number) {
    this.space = level.space;
    this.lat = lat;
    const W = level.w * 16, H = level.h * 16;
    const pal = shipPalette(level.hull, year), weather = level.deck === 0;
    const tex = (key: string, r: Raster) => {
      const k = `ship-${level.space}-${key}`;
      if (scene.textures.exists(k)) scene.textures.remove(k);
      scene.textures.addCanvas(k, r.canvas());
      this.keys.push(k);
      return k;
    };
    ensureSprites(scene);
    if (weather) {
      const sea = seaRamp(lat);
      const k = `ship-sea-${sea[1]}`;
      if (!scene.textures.exists(k)) paintSea(scene, k, sea);
      this.sea = scene.add.tileSprite(-800, -600, W + 1600, H + 1200, k).setOrigin(0, 0).setDepth(-99993);
      this.swell = scene.add.tileSprite(-800, -600, W + 1600, H + 1200, `${k}-swell`).setOrigin(0, 0).setDepth(-99992).setAlpha(0.7);
      this.objects.push(this.sea, this.swell);
      this.g = hullGeom(level);
      this.foam = scene.add.graphics().setDepth(-99989);
      this.objects.push(this.foam);
    } else {
      this.objects.push(scene.add.rectangle(-800, -600, W + 1600, H + 1200, 0x07060a).setOrigin(0, 0).setDepth(-99993));
    }
    this.objects.push(scene.add.image(0, 0, tex("base", weather ? paintWeatherDeck(level, pal, year) : paintBelow(level, pal))).setOrigin(0, 0).setDepth(-99990));
    for (const t of level.things) {
      const s = paintThing(t.art, t.w, t.h, pal, t.v, year);
      if (!s) continue;
      const depth = (t.y + t.h - 1) * 16 + (t.solid ? 13 : 2);
      this.objects.push(scene.add.image(t.x * 16 - s.ox, t.y * 16 - s.oy, tex(t.id, s.r)).setOrigin(0, 0).setDepth(depth));
      const at = (p: { x: number; y: number }) => ({ x: t.x * 16 - s.ox + p.x, y: t.y * 16 - s.oy + p.y });
      for (const p of s.smoke ?? []) this.smoke.push({ ...at(p), kind: t.art === "house" ? "funnel" : t.art === "shrine" ? "incense" : "fire", next: 0 });
      for (const p of s.glow ?? []) this.glow(at(p).x, at(p).y, p.color, 0.7, false, !weather);
    }
    for (const l of level.lights) {
      const x = l.x * 16 + 8, y = l.y * 16 + (weather ? -6 : 0);
      this.glow(x, y, l.kind === "furnace" ? 0xff6a20 : l.kind === "hatch" ? 0xdfeeff : 0xffc070, l.kind === "hatch" ? 1.6 : 1.2, l.kind === "lantern" && !weather, !weather);
    }
    if (weather) {
      this.rig = paintRig(level, this.g!, pal, year, look.nation);
      this.sails = scene.add.image(0, 0, tex("rig", this.rig.sails)).setOrigin(0, 0).setDepth(2400);
      this.objects.push(this.sails);
      this.rig.flags.forEach((f, i) => {
        const keys = f.frames.map((fr, k) => tex(`flag-${i}-${k}`, fr));
        const im = scene.add.image(f.x, f.y, keys[0]).setOrigin(0, 0).setDepth(2401);
        this.objects.push(im);
        this.flags.push({ im, n: i * 3 });
        im.setData("keys", keys);
      });
    }
    this.shade = scene.add.rectangle(-800, -600, W + 1600, H + 1200, 0xffffff).setOrigin(0, 0).setDepth(3000).setBlendMode(Phaser.BlendModes.MULTIPLY);
    this.objects.push(this.shade);
    const font = { fontFamily: "Silkscreen, monospace", fontSize: "8px", color: "#fff2d8", stroke: "#10141c", strokeThickness: 3 };
    this.label = scene.add.text(0, 0, "", font).setDepth(1e7).setOrigin(0, 0.5);
    const title = weather ? look.name : level.name[0].toUpperCase() + level.name.slice(1);
    this.banner = scene.add.text(0, 0, title, { ...font, fontSize: "16px", strokeThickness: 4 }).setDepth(1e7).setOrigin(0.5, 0.5).setAlpha(0);
    this.objects.push(this.label, this.banner);
  }

  private glow(x: number, y: number, color: number, size: number, swing: boolean, below: boolean) {
    const im = this.scene.add.image(x, y, "ship-halo").setBlendMode(Phaser.BlendModes.ADD).setDepth(3001).setTint(color).setScale(size).setAlpha(0);
    this.glows.push({ im, x, y, swing: swing ? Math.random() * 6 : -1, below });
    this.objects.push(im);
  }

  update(f: ShipFrame) {
    if (!this.born) this.born = f.time;
    const t = f.time / 1000, weather = this.level.deck === 0;
    const wash = washAt(f.clock);
    const dark = weather ? wash.lamps : 1;
    if (weather) {
      const c = Phaser.Display.Color.IntegerToColor(wash.color), a = wash.alpha;
      this.shade.setFillStyle(Phaser.Display.Color.GetColor(255 - (255 - c.red) * a, 255 - (255 - c.green) * a, 255 - (255 - c.blue) * a));
    } else this.shade.setFillStyle(0x6e5c58);
    for (const gl of this.glows) {
      const sway = gl.swing >= 0 ? Math.sin(t * 1.1 + gl.swing) * 3 : 0;
      const flick = 0.92 + 0.08 * Math.sin(t * 7 + gl.x);
      gl.im.setPosition(gl.x + sway, gl.y).setAlpha((gl.below ? 0.55 : 0.6 * dark) * flick);
    }
    if (weather) this.sailing(f, t, wash.lamps);
    this.puffs(f);
    this.hud(f);
  }

  private sailing(f: ShipFrame, t: number, night: number) {
    const g = this.g!, kind = this.level.hull.kind;
    const speed = this.look.landed ? 0 : kind === "steamer" ? 34 : 22;
    // The sea runs aft past the hull, and the ship lifts on the swell.
    this.sea!.tilePositionX += (speed * f.delta) / 1000;
    this.swell!.tilePositionX += (speed * 0.6 * f.delta) / 1000;
    this.swell!.tilePositionY = Math.sin(t * 0.7) * 3;
    this.sea!.y = -600 + Math.round(Math.sin(t * 0.9) * 1.5);
    const fg = this.foam!.clear();
    const glowing = night > 0.5 && Math.abs(this.lat) < 32;
    const foam = glowing ? 0x9affd8 : 0xf4fbfa;
    for (let x = Math.ceil(g.wx0); x < g.wx1; x++) {
      const y = g.keel(x), lap = Math.sin(t * 2.4 - x * 0.13) + Math.sin(t * 1.3 + x * 0.05);
      if (lap > 0.4) fg.fillStyle(foam, 0.85).fillRect(x, y, 1, 1);
      if (lap > 1.2) fg.fillStyle(foam, 0.5).fillRect(x, y + 1, 1, 1);
    }
    if (speed) {
      // The bow wave folding back along the side.
      const sx = g.wx1, sy = g.keel(g.wx1);
      for (let k = 0; k < 3; k++) {
        const ph = (t * 1.6 + k / 3) % 1;
        for (let i = 0; i < 40; i++) {
          const x = sx + 6 - i * 1.6 - ph * 6, y = sy + 2 + Math.sqrt(i) * 1.8 * (0.6 + ph);
          if ((i + k * 5) % 3) fg.fillStyle(foam, 0.75 * (1 - i / 40) * (1 - ph * 0.5)).fillRect(x, y, 2, 1);
        }
      }
      // The wake: two arms opening astern and a seam of churned water between.
      const wx = g.wx0, wy = g.keel(g.wx0) - 4;
      for (let i = 0; i < 160; i++) {
        const x = wx - i * 2, spread = i * 0.22;
        const on = Math.sin(i * 0.9 - t * 6) > -0.2;
        if (on) fg.fillStyle(foam, 0.6 * (1 - i / 160)).fillRect(x, wy + spread + Math.sin(i * 0.4 + t * 2), 2, 1);
        if (on && i % 2) fg.fillStyle(foam, 0.4 * (1 - i / 160)).fillRect(x, wy - spread * 0.5 - 2, 2, 1);
        const churn = kind === "steamer" ? 0.8 : 0.35;
        if (Math.sin(i * 2.7 + t * 9) > 1 - churn && i < 90) fg.fillStyle(foam, 0.7 * (1 - i / 90)).fillRect(x + Math.sin(i * 7.1) * 3, wy + Math.sin(i * 3.3 + t) * 3, 2, 1);
      }
    }
    // The rig fades while someone stands behind the sails.
    const behind = f.y < this.rig!.bottom + 26;
    this.sails!.setAlpha(Phaser.Math.Linear(this.sails!.alpha, behind ? 0.42 : 1, Math.min(1, f.delta / 160)));
    for (const fl of this.flags) {
      fl.n += f.delta / 150;
      const keys = fl.im.getData("keys") as string[];
      fl.im.setTexture(keys[Math.floor(fl.n) % keys.length]).setAlpha(this.sails!.alpha);
    }
    this.wildlife(f, night);
  }

  private wildlife(f: ShipFrame, night: number) {
    const { scene, g } = this, n = this.next, cam = scene.cameras.main.worldView, lat = Math.abs(this.lat);
    const day = night < 0.5, water = (x: number) => g!.keel(Math.max(g!.wx0, Math.min(g!.wx1, x)));
    if (f.time > n.glint && day) {
      n.glint = f.time + 60 + Math.random() * 120;
      const x = cam.x + Math.random() * cam.width, y = cam.y + Math.random() * cam.height;
      if (y > water(x) + 4 || y < g!.north(Math.max(g!.X0, Math.min(g!.X1, x))) - 140) this.spark(x, y, 0xffffff, 3, 1, 420);
    }
    if (f.time > n.glint - 30 && !day && Math.random() < 0.08) {
      // The moon's track on the water, broken into glitter.
      const x = cam.centerX + (Math.random() - 0.5) * 60, y = cam.y + Math.random() * cam.height * 0.4;
      if (y < g!.north(Math.max(g!.X0, Math.min(g!.X1, x))) - 30) this.spark(x, y, 0xdfe8ff, 2, 1, 600);
    }
    if (this.look.landed) {
      if (f.time > n.bird) {
        n.bird = f.time + 2500 + Math.random() * 4000;
        this.bird(f, "gull");
      }
      return;
    }
    if (f.time > n.dolphin && day && lat < 50) {
      n.dolphin = f.time + 14000 + Math.random() * 22000;
      const pod = 2 + Math.floor(Math.random() * 3);
      for (let i = 0; i < pod; i++) scene.time.delayedCall(i * 260 + Math.random() * 200, () => this.dolphin(g!.wx1 - 40 - Math.random() * 120 - i * 20, water(g!.wx1) + 22 + Math.random() * 40));
    }
    if (lat < 28 && day && f.time > n.fish) {
      n.fish = f.time + 5000 + Math.random() * 9000;
      const x0 = g!.wx1 - 30 - Math.random() * 80, y0 = water(g!.wx1) + 12 + Math.random() * 30;
      for (let i = 0; i < 4 + Math.random() * 5; i++) scene.time.delayedCall(i * 70, () => this.flyingFish(x0 + i * 6, y0 + (Math.random() - 0.5) * 12));
    }
    if (f.time > n.bird && day && (this.lat < -35 || f.clock > this.look.lands - 86400)) {
      n.bird = f.time + 9000 + Math.random() * 12000;
      this.bird(f, this.lat < -35 ? "albatross" : "gull");
    }
    if (f.time > n.spout && day && lat > 30) {
      n.spout = f.time + 40000 + Math.random() * 60000;
      if (n.spout - f.time > 0 && this.born < f.time - 4000) this.spout(cam.x + 40 + Math.random() * (cam.width - 80), g!.north(g!.X0 + 1) - 120 - Math.random() * 100);
    }
  }

  private dolphin(x: number, y: number) {
    const im = this.scene.add.image(x, y, "ship-dolphin").setDepth(-99988).setAlpha(0);
    this.live.add(im);
    const arc = { p: 0 };
    this.scene.tweens.add({
      targets: arc, p: 1, duration: 1100, ease: "Linear",
      onUpdate: () => {
        const p = arc.p, lift = Math.sin(p * Math.PI) * 18;
        im.setPosition(x - p * 70, y - lift).setRotation(Phaser.Math.Linear(0.6, -0.6, p) * -1).setAlpha(p < 0.08 || p > 0.92 ? 0.4 : 1);
      },
      onComplete: () => {
        for (let i = 0; i < 5; i++) this.spark(x - 70 + (Math.random() - 0.5) * 8, y, 0xf4fbfa, 2, -8 - Math.random() * 6, 380);
        this.live.delete(im);
        im.destroy();
      },
    });
    for (let i = 0; i < 4; i++) this.spark(x + (Math.random() - 0.5) * 6, y, 0xf4fbfa, 2, -6 - Math.random() * 6, 320);
  }

  private flyingFish(x: number, y: number) {
    const im = this.scene.add.rectangle(x, y, 4, 1, 0xd8e8f0).setDepth(-99988);
    this.live.add(im);
    this.scene.tweens.add({ targets: im, x: x + 90 + Math.random() * 60, duration: 900 + Math.random() * 400, ease: "Sine.easeOut" });
    this.scene.tweens.add({ targets: im, y: y - 5, duration: 450, yoyo: true, ease: "Sine.easeOut", onComplete: () => (this.live.delete(im), im.destroy()) });
  }

  private bird(f: ShipFrame, kind: "gull" | "albatross") {
    const cam = this.scene.cameras.main.worldView, left = Math.random() < 0.5;
    const y = cam.y + 20 + Math.random() * cam.height * 0.45;
    const im = this.scene.add.image(left ? cam.x - 20 : cam.right + 20, y, `ship-${kind}`, kind === "gull" ? "0" : "1").setDepth(2500).setFlipX(left);
    this.live.add(im);
    const flap = kind === "gull" ? this.scene.time.addEvent({ delay: 140, loop: true, callback: () => im.setFrame(im.frame.name === "0" ? "1" : "0") }) : undefined;
    this.scene.tweens.add({ targets: im, x: left ? cam.right + 30 : cam.x - 30, duration: kind === "gull" ? 5200 : 9000, ease: "Linear", onComplete: () => (flap?.remove(), this.live.delete(im), im.destroy()) });
    this.scene.tweens.add({ targets: im, y: y + (Math.random() - 0.5) * 50, duration: 2400, yoyo: true, repeat: 1, ease: "Sine.easeInOut" });
    void f;
  }

  private spout(x: number, y: number) {
    for (let i = 0; i < 18; i++) this.spark(x + (Math.random() - 0.5) * 4, y, 0xf4fbfa, 2, -16 - Math.random() * 14, 900 + Math.random() * 400, (Math.random() - 0.5) * 12);
    // The back, rolling, and the flukes.
    const back = this.scene.add.ellipse(x + 6, y + 3, 22, 4, 0x26323c).setDepth(-99988).setAlpha(0);
    this.live.add(back);
    this.scene.tweens.add({ targets: back, alpha: 0.9, x: x - 10, duration: 1600, yoyo: true, onComplete: () => (this.live.delete(back), back.destroy()) });
  }

  private spark(x: number, y: number, color: number, w: number, vy: number, life: number, vx = 0) {
    const r = this.scene.add.rectangle(x, y, w, 1, color).setBlendMode(Phaser.BlendModes.ADD).setDepth(-99987).setAlpha(0.9);
    this.live.add(r);
    this.scene.tweens.add({ targets: r, alpha: 0, y: y + vy, x: x + vx, duration: life, onComplete: () => (this.live.delete(r), r.destroy()) });
  }

  private puffs(f: ShipFrame) {
    for (const s of this.smoke) {
      if (f.time < s.next) continue;
      const funnel = s.kind === "funnel";
      s.next = f.time + (funnel ? 120 : s.kind === "incense" ? 420 : 520) + Math.random() * 200;
      const size = funnel ? 4 + Math.random() * 3 : s.kind === "incense" ? 1.5 : 3;
      const puff = this.scene.add.circle(s.x + (Math.random() - 0.5) * 4, s.y, size, funnel ? 0x6a6870 : s.kind === "incense" ? 0xe8e4f0 : 0xc8c4c0)
        .setDepth(funnel ? 2390 : s.y + 30).setAlpha(funnel ? 0.5 : 0.45);
      this.live.add(puff);
      const drift = this.level.deck === 0 && !this.look.landed ? -1 : -0.3;
      this.scene.tweens.add({
        targets: puff, x: puff.x + drift * (funnel ? 200 : 50), y: s.y - (funnel ? 40 : 36) - Math.random() * 20, scale: funnel ? 3.6 : 2.4, alpha: 0,
        duration: funnel ? 3200 : 2600, ease: "Sine.easeOut",
        onComplete: () => (this.live.delete(puff), puff.destroy()),
      });
    }
  }

  private hud(f: ShipFrame) {
    const cam = this.scene.cameras.main, v = cam.worldView;
    const days = Math.ceil((this.look.lands - f.clock) / 86400);
    const where = this.look.landed ? "IN PORT · YOU CAN GO ASHORE" : days <= 1 ? "LANDFALL TOMORROW" : `${days} DAYS TO LANDFALL`;
    this.label.setPosition(v.x + 10, v.bottom - 62 / cam.zoom).setText(`${this.look.name.toUpperCase()}  ·  ${where}`);
    const age = f.time - this.born;
    this.banner.setPosition(v.centerX, v.y + v.height * 0.2).setAlpha(age < 600 ? age / 600 : age < 2600 ? 1 : Math.max(0, 1 - (age - 2600) / 900));
  }

  destroy() {
    for (const o of [...this.objects, ...this.live]) o.destroy();
    for (const k of this.keys) if (this.scene.textures.exists(k)) this.scene.textures.remove(k);
  }
}

/** The open sea in two layers: the ground swell and the wavelets riding it. */
function paintSea(scene: Phaser.Scene, key: string, sea: readonly string[]) {
  const W = 256, H = 128;
  const base = scene.textures.createCanvas(key, W, H)!, c = base.context;
  c.fillStyle = sea[1];
  c.fillRect(0, 0, W, H);
  let s = 7;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 70; i++) {
    const x = Math.floor(rnd() * W), y = Math.floor(rnd() * H), w = 4 + Math.floor(rnd() * 9);
    c.fillStyle = sea[0];
    c.fillRect(x, y + 1, w, 1);
    c.fillStyle = sea[2];
    c.fillRect(x + 1, y, w - 2, 1);
    if (x + w > W) {
      c.fillStyle = sea[0];
      c.fillRect(x - W, y + 1, w, 1);
      c.fillStyle = sea[2];
      c.fillRect(x - W + 1, y, w - 2, 1);
    }
  }
  base.refresh();
  const swell = scene.textures.createCanvas(`${key}-swell`, W, H)!, d = swell.context;
  for (let i = 0; i < 26; i++) {
    const x = Math.floor(rnd() * W), y = Math.floor(rnd() * H), w = 3 + Math.floor(rnd() * 6);
    d.fillStyle = sea[3];
    for (let k = 0; k < w; k++) d.fillRect((x + k) % W, y - Math.round(Math.sin((k / w) * Math.PI) * 1.4), 1, 1);
  }
  swell.refresh();
}

function ensureSprites(scene: Phaser.Scene) {
  if (scene.textures.exists("ship-halo")) return;
  const t = scene.textures.createCanvas("ship-halo", 96, 96)!;
  const gr = t.context.createRadialGradient(48, 48, 0, 48, 48, 48);
  gr.addColorStop(0, "rgba(255,255,255,0.6)");
  gr.addColorStop(0.3, "rgba(255,255,255,0.22)");
  gr.addColorStop(1, "rgba(255,255,255,0)");
  t.context.fillStyle = gr;
  t.context.fillRect(0, 0, 96, 96);
  t.refresh();
  const dol = scene.textures.createCanvas("ship-dolphin", 16, 7)!, d = dol.context;
  for (const [x, y, w, h, col] of [[2, 2, 11, 3, "#4a5a6a"], [1, 3, 2, 1, "#4a5a6a"], [13, 3, 2, 1, "#4a5a6a"], [3, 4, 9, 1, "#c8d4dc"], [6, 0, 3, 2, "#3a4858"], [0, 1, 2, 1, "#3a4858"], [0, 5, 2, 1, "#3a4858"], [12, 2, 1, 1, "#1a2028"]] as const) {
    d.fillStyle = col;
    d.fillRect(x, y, w, h);
  }
  dol.refresh();
  const bird = (key: string, wing: number, body: string, tip: string) => {
    const b = scene.textures.createCanvas(key, (wing * 2 + 3) * 2, 6)!, c = b.context;
    for (const [f, up] of [[0, true], [1, false]] as const) {
      const ox = f * (wing * 2 + 3);
      c.fillStyle = body;
      c.fillRect(ox + wing, 3, 3, 1);
      for (let i = 0; i < wing; i++) {
        const dy = up ? Math.round(3 - (i / wing) * 3 * (i < wing / 2 ? 1.4 : 1)) : 3 + Math.round(i / wing);
        c.fillStyle = i > wing - 3 ? tip : body;
        c.fillRect(ox + wing - 1 - i, dy, 1, 1);
        c.fillRect(ox + wing + 3 + i, dy, 1, 1);
      }
      b.add(String(f), 0, ox, 0, wing * 2 + 3, 6);
    }
    b.refresh();
  };
  bird("ship-gull", 5, "#f4f4f0", "#3a3a40");
  bird("ship-albatross", 12, "#f8f8f4", "#2a2a30");
}

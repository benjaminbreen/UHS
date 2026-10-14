import Phaser from "phaser";
import { gameAudio } from "../audio/director";
import { events, landing, tone, type Sound } from "../audio/sfx";
import type { TreeFind } from "../core/engine";
import { flushBirds } from "./ambient-life";

type Image = Phaser.GameObjects.Image;
type Effect = { x: number; y: number; kind: TreeFind; loot: { item: string; n: number }[] };
type View = {
  treeFind: (x: number, y: number) => TreeFind | undefined;
  player: () => Image | undefined;
  brush: (cell: { x: number; y: number }, dx: number, dy: number, force: number) => void;
  spill: (at: { x: number; y: number }, loot: { item: string; n: number }[]) => void;
};

const INK: Record<string, string> = {
  k: "#3a2414", b: "#7a5230", l: "#b08450",
  e: "#bfe0d6", E: "#f2fbf6", s: "#56685e",
  a: "#e2a32e", H: "#fbe08a", h: "#f2c24e", d: "#4a3010",
  g: "#4f8a34", G: "#79b04c", r: "#cc4430", R: "#f49270", D: "#7e2216",
  c: "#7e5028", C: "#b98a4c", w: "#ffffff",
};
// A crown's worth, hung where the leaves part: what you spot before you bump it.
const ART: Record<TreeFind | "fruit-1" | "cones-1", string[]> = {
  nest: [
    "....eE.eE...",
    "...eeeeseee.",
    "lbbeseeeesbl",
    "kblblblblblk",
    ".kbllbblbbk.",
    "..kkbbbbkk..",
    "....kkkk....",
  ],
  hive: [
    "...kk...",
    "..kaak..",
    ".kaHhak.",
    ".kahaak.",
    "kahaaaak",
    "kddddddk",
    "kaHaaaak",
    "kaaaaaak",
    ".kddddk.",
    ".kaaaak.",
    "..kaak..",
    "...kk...",
  ],
  fruit: [
    "....b....",
    "..gGbGg..",
    ".gGkbkGg.",
    ".krRk.kk.",
    "krRrrkrRk",
    "krrrDkrrk",
    ".kDDk.kDk",
    "..kk...k.",
  ],
  cones: [
    "..b...b.",
    ".kCk.kCk",
    "kcCck.kc",
    "kCcCkcCc",
    "kcCck.kc",
    ".kck..k.",
  ],
  "fruit-1": [".kk.", "krRk", "krrk", ".kk."],
  "cones-1": [".k.", "kCk", "kck", "kCk", ".k."],
};
const BEE = [0x2a1e08, 0xf0c838];

function texture(scene: Phaser.Scene, name: keyof typeof ART) {
  const key = `tree-find-${name}`;
  if (scene.textures.exists(key)) return key;
  const rows = ART[name];
  const canvas = scene.textures.createCanvas(key, rows[0].length, rows.length)!;
  const ctx = canvas.getContext();
  rows.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      if (!INK[ch]) return;
      ctx.fillStyle = INK[ch];
      ctx.fillRect(x, y, 1, 1);
    }),
  );
  canvas.refresh();
  return key;
}

type Marker = {
  image: Image;
  canopy: Image;
  dx: number;
  dy: number;
  kind: TreeFind;
  bees: Phaser.GameObjects.Rectangle[];
  glintAt: number;
};
type Swarm = { bee: Phaser.GameObjects.Rectangle; until: number; seed: number };

/** What a tree keeps in its crown, drawn on the canopy and swaying with it,
 * and the show when it comes down: the tumble, the bounce, the birds or the
 * bees, then the loot popping out to the player. */
export class TreeFinds {
  private markers = new Map<string, Marker>();
  private swarm: Swarm[] = [];
  private live = new Set<Phaser.GameObjects.GameObject>();

  constructor(
    private scene: Phaser.Scene,
    private view: View,
  ) {}

  /** Hangs a find on every tree that still holds one. */
  sync(plants: Map<string, Image[]>) {
    for (const [key, m] of this.markers)
      if (!m.canopy.active || !plants.get(key)?.includes(m.canopy)) this.remove(key);
    for (const [key, images] of plants) {
      if (this.markers.has(key) || !images.length) continue;
      const [x, y] = key.split(",").map(Number);
      const kind = this.view.treeFind(x, y);
      if (!kind) continue;
      const canopy = images.reduce((a, b) => (b.displayHeight > a.displayHeight ? b : a));
      const h = canopy.displayHeight, w = canopy.displayWidth;
      const jitter = Math.sin(x * 12.9898 + y * 78.233) * 0.5;
      const image = this.scene.add.image(0, 0, texture(this.scene, kind)).setOrigin(0.5, kind === "hive" ? 0 : 0.5);
      const bees =
        kind === "hive"
          ? Array.from({ length: 3 }, (_, i) => this.scene.add.rectangle(0, 0, 1, 1, BEE[i % 2]))
          : [];
      this.markers.set(key, {
        image,
        canopy,
        dx: Math.round(w * 0.2 * (jitter >= 0 ? 1 : -1) * (0.6 + Math.abs(jitter))),
        dy: -Math.round(h * (kind === "hive" ? 0.5 : 0.58) + jitter * 4),
        kind,
        bees,
        glintAt: Math.abs(jitter) * 4000,
      });
    }
  }

  update(time: number) {
    for (const m of this.markers.values()) {
      const c = m.canopy;
      const r = c.rotation;
      const x = Math.round(c.x + m.dx * Math.cos(r) - m.dy * Math.sin(r));
      const y = Math.round(c.y + m.dx * Math.sin(r) + m.dy * Math.cos(r));
      m.image.setPosition(x, y).setDepth(c.depth + 0.1).setVisible(c.visible).setTint(c.tintTopLeft);
      m.bees.forEach((bee, i) => {
        const t = time / 260 + i * 2.1;
        bee
          .setPosition(Math.round(x + Math.sin(t * 1.3) * 6), Math.round(y + 6 + Math.sin(t * 2.1) * 4))
          .setDepth(c.depth + 0.2)
          .setVisible(c.visible);
      });
      // Now and then the light catches it: the hint to go and look.
      if (m.kind !== "hive" && c.visible && time > m.glintAt) {
        m.glintAt = time + 3200 + Math.random() * 2600;
        this.glint(x + (Math.random() - 0.5) * 6, y - 2, c.depth + 0.3);
      }
    }
    if (this.swarm.length) this.chase(time);
  }

  drop(effect: Effect) {
    const key = `${effect.x},${effect.y}`;
    const m = this.markers.get(key);
    const player = this.view.player();
    if (!m) {
      if (player) this.view.spill({ x: player.x, y: player.y - 8 }, effect.loot);
      return;
    }
    this.markers.delete(key);
    const from = { x: m.image.x, y: m.image.y };
    const base = { x: m.canopy.x, y: m.canopy.y };
    const side = player ? Math.sign(player.x - base.x) || 1 : 1;
    this.view.brush(effect, -side, 0, 1.4);
    const ground = {
      x: Math.round(base.x + (player ? (player.x - base.x) * 0.45 : side * 8)),
      y: Math.round(base.y + (player ? (player.y - base.y) * 0.45 : 2)),
    };
    const depth = m.canopy.depth + 1;
    if (effect.kind === "nest") {
      flushBirds(this.scene, from.x, from.y - 4, -side);
      for (let i = 0; i < 3; i++) this.feather(from.x, from.y, depth + 1, i);
    }
    if (effect.kind === "fruit" || effect.kind === "cones") {
      m.image.destroy();
      this.hail(effect, from, ground, depth);
      return;
    }
    const image = m.image.setDepth(depth);
    this.live.add(image);
    // Anticipation: it shudders on its branch before it lets go.
    this.scene.tweens.add({
      targets: image,
      x: from.x + 1,
      duration: 40,
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        if (effect.kind === "hive") this.drip(image, depth);
        this.scene.tweens.add({
          targets: image,
          x: ground.x,
          y: ground.y - (effect.kind === "hive" ? image.height : image.height / 2),
          rotation: side * 0.35,
          duration: 300 + Math.max(0, ground.y - from.y) * 2,
          ease: "Quad.easeIn",
          onComplete: () => this.land(image, effect, ground, depth, m.bees),
        });
      },
    });
  }

  private land(image: Image, effect: Effect, ground: { x: number; y: number }, depth: number, bees: Phaser.GameObjects.Rectangle[]) {
    image.setRotation(0).setOrigin(0.5, 1).setPosition(ground.x, ground.y);
    gameAudio()?.sound(landing("brush", 0.7), "find");
    this.scene.cameras.main.shake(70, 0.0014);
    this.dust(ground.x, ground.y, depth);
    this.scene.tweens.chain({
      targets: image,
      tweens: [
        { scaleX: 1.45, scaleY: 0.6, duration: 60, ease: "Quad.easeOut" },
        { scaleX: 0.85, scaleY: 1.2, y: ground.y - 6, duration: 130, ease: "Quad.easeOut" },
        { scaleX: 1.2, scaleY: 0.85, y: ground.y, duration: 110, ease: "Quad.easeIn" },
        { scaleX: 1, scaleY: 1, duration: 140, ease: "Back.easeOut" },
      ],
    });
    this.scene.time.delayedCall(260, () => {
      gameAudio()?.sound(events.gather(), "find-jingle");
      this.burst(ground.x, ground.y - 8, depth + 2);
      this.view.spill({ x: ground.x, y: ground.y - 4 }, effect.loot);
      if (effect.kind === "hive") this.release(bees, ground);
    });
    this.scene.tweens.add({
      targets: image,
      alpha: 0,
      scaleX: 0.4,
      scaleY: 0.4,
      delay: 1100,
      duration: 260,
      onComplete: () => this.kill(image),
    });
    if (effect.kind !== "hive") for (const bee of bees) bee.destroy();
  }

  /** Fruit and cones come down one by one, each with its own bounce. */
  private hail(effect: Effect, from: { x: number; y: number }, ground: { x: number; y: number }, depth: number) {
    const piece = texture(this.scene, effect.kind === "fruit" ? "fruit-1" : "cones-1");
    const count = 5;
    for (let i = 0; i < count; i++) {
      const sx = from.x + (Math.random() - 0.5) * 18;
      const sy = from.y + (Math.random() - 0.5) * 10;
      const lx = ground.x + (i - (count - 1) / 2) * 5 + (Math.random() - 0.5) * 3;
      const ly = ground.y + (Math.random() - 0.5) * 4;
      const image = this.scene.add.image(sx, sy, piece).setOrigin(0.5, 1).setDepth(depth);
      this.live.add(image);
      this.scene.tweens.chain({
        targets: image,
        delay: 120 + i * 110,
        tweens: [
          { x: lx, y: ly, duration: 260 + Math.max(0, ly - sy) * 2, ease: "Quad.easeIn",
            onComplete: () => {
              // Each one lands a step higher: the patter becomes a little tune.
              gameAudio()?.sound(plip(i, effect.kind === "fruit"), `find-${i}`);
              this.dust(lx, ly, depth, 2);
            } },
          { y: ly - 5 + i % 2, scaleY: 1.2, duration: 110, ease: "Quad.easeOut" },
          { y: ly, scaleY: 1, duration: 110, ease: "Quad.easeIn" },
          { y: ly - 2, duration: 70, ease: "Quad.easeOut" },
          { y: ly, duration: 70, ease: "Quad.easeIn" },
          { alpha: 0, delay: 500, duration: 200 },
        ],
        onComplete: () => this.kill(image),
      });
    }
    this.scene.time.delayedCall(120 + count * 110 + 320, () => {
      gameAudio()?.sound(events.gather(), "find-jingle");
      this.burst(ground.x, ground.y - 8, depth + 2);
      this.view.spill({ x: ground.x, y: ground.y - 4 }, effect.loot);
    });
  }

  /** The hive's bees come out angry and chase you a little way, then give up. */
  private release(bees: Phaser.GameObjects.Rectangle[], at: { x: number; y: number }) {
    const now = this.scene.time.now;
    for (const bee of bees) bee.destroy();
    for (let i = 0; i < 12; i++) {
      const bee = this.scene.add
        .rectangle(at.x + (Math.random() - 0.5) * 6, at.y - 4 - Math.random() * 4, 1, 1, BEE[i % 2])
        .setDepth(at.y + 6000);
      this.live.add(bee);
      this.swarm.push({ bee, until: now + 2200 + Math.random() * 900, seed: Math.random() * 100 });
    }
    gameAudio()?.sound(buzz(), "bees");
  }
  private chase(time: number) {
    const player = this.view.player();
    this.swarm = this.swarm.filter((s) => {
      if (!s.bee.active) return false;
      if (time > s.until) {
        this.scene.tweens.add({
          targets: s.bee,
          x: s.bee.x + (Math.random() - 0.5) * 60,
          y: s.bee.y - 30 - Math.random() * 20,
          alpha: 0,
          duration: 700,
          onComplete: () => this.kill(s.bee),
        });
        return false;
      }
      const tx = (player?.x ?? s.bee.x) + Math.sin(time / 90 + s.seed) * 9;
      const ty = (player?.y ?? s.bee.y) - 14 + Math.cos(time / 70 + s.seed * 1.7) * 7;
      s.bee.setPosition(s.bee.x + (tx - s.bee.x) * 0.12, s.bee.y + (ty - s.bee.y) * 0.12);
      s.bee.setFillStyle(BEE[Math.floor(time / 60 + s.seed) % 2]);
      return true;
    });
  }

  private feather(x: number, y: number, depth: number, i: number) {
    const f = this.scene.add.rectangle(x, y, 2, 1, 0xf4efe2).setDepth(depth);
    this.live.add(f);
    const drift = (i - 1) * 10;
    this.scene.tweens.add({ targets: f, y: y + 26 + i * 6, alpha: 0, duration: 1800 + i * 300, ease: "Sine.easeIn", onComplete: () => this.kill(f) });
    this.scene.tweens.add({ targets: f, x: x + drift + 6, duration: 420, yoyo: true, repeat: 2, ease: "Sine.easeInOut" });
  }
  private drip(image: Image, depth: number) {
    for (let i = 0; i < 3; i++) {
      const d = this.scene.add.rectangle(image.x, image.y + image.height, 1, 2, 0xe8a52a).setDepth(depth);
      this.live.add(d);
      this.scene.tweens.add({
        targets: d,
        y: d.y + 20 + i * 4,
        alpha: 0,
        delay: i * 90,
        duration: 380,
        ease: "Quad.easeIn",
        onComplete: () => this.kill(d),
      });
    }
  }
  private dust(x: number, y: number, depth: number, count = 6) {
    for (let i = 0; i < count; i++) {
      const p = this.scene.add.rectangle(x + (Math.random() - 0.5) * 6, y - 1, 2, 2, i % 2 ? 0xbcae8c : 0x9c8c6a).setDepth(depth);
      this.live.add(p);
      this.scene.tweens.add({
        targets: p,
        x: p.x + (Math.random() - 0.5) * 20,
        y: p.y - 3 - Math.random() * 4,
        alpha: 0,
        duration: 300 + Math.random() * 120,
        ease: "Quad.easeOut",
        onComplete: () => this.kill(p),
      });
    }
  }
  /** A ring of sparks: the find is yours. */
  private burst(x: number, y: number, depth: number) {
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const s = this.scene.add.rectangle(x, y, i % 2 ? 1 : 2, i % 2 ? 1 : 2, i % 2 ? 0xffffff : 0xfff0a0).setDepth(depth);
      this.live.add(s);
      this.scene.tweens.add({
        targets: s,
        x: x + Math.cos(a) * 14,
        y: y + Math.sin(a) * 10,
        alpha: 0,
        duration: 420,
        ease: "Cubic.easeOut",
        onComplete: () => this.kill(s),
      });
    }
  }
  private glint(x: number, y: number, depth: number) {
    const arms = [
      this.scene.add.rectangle(Math.round(x), Math.round(y), 1, 3, 0xffffff),
      this.scene.add.rectangle(Math.round(x), Math.round(y), 3, 1, 0xffffff),
    ];
    for (const arm of arms) {
      arm.setDepth(depth).setAlpha(0);
      this.live.add(arm);
      this.scene.tweens.add({
        targets: arm,
        alpha: 0.95,
        duration: 140,
        yoyo: true,
        hold: 80,
        onComplete: () => this.kill(arm),
      });
    }
  }
  private kill(o: Phaser.GameObjects.GameObject) {
    this.live.delete(o);
    o.destroy();
  }
  private remove(key: string) {
    const m = this.markers.get(key);
    if (!m) return;
    m.image.destroy();
    for (const bee of m.bees) bee.destroy();
    this.markers.delete(key);
  }
  dispose() {
    for (const key of [...this.markers.keys()]) this.remove(key);
    for (const o of this.live) o.destroy();
    this.live.clear();
    this.swarm = [];
  }
}

function plip(i: number, soft: boolean): Sound {
  const f = 520 * 2 ** ([0, 2, 4, 7, 9][i % 5] / 12);
  return [
    tone(0, 0.08, soft ? 0.12 : 0.09, f, { to: f * 1.5, attack: 0.004 }),
    tone(0.01, 0.05, 0.05, soft ? 180 : 900, { wave: soft ? "sine" : "triangle", attack: 0.002 }),
  ];
}
function buzz(): Sound {
  return Array.from({ length: 16 }, (_, i) =>
    tone(i * 0.06, 0.08, 0.035 * (1 - i / 20), 210 + (i % 3) * 22, { wave: "sawtooth", to: 230 + (i % 2) * 30, attack: 0.01 }),
  );
}

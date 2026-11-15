import Phaser from "phaser";
import type { Medium } from "../../content/ships";

/** The painted layers in public/backdrops, and for a globe where its disc sits in the image. */
const ART = {
  earth: { file: "orbit/globe-a.png", cx: 512, cy: 511.5, r: 505 },
  moon: { file: "lunar/globe-b.png", cx: 509.5, cy: 512, r: 504 },
  stars: { file: "stars/field-b.png" },
  bright: { file: "stars/bright-a.png" },
  water: { file: "deep/plate-a.png" },
  specks: { file: "deep/specks-a.png" },
  ground: { file: "sky/ground-a.png" },
  clouds: { file: "sky/clouds-a.png" },
  fog: { file: "mist/far-a.png" },
  billows: { file: "mist/near-a.png" },
} as const;
type Art = keyof typeof ART;
const NEEDS: Record<Medium, Art[]> = {
  orbit: ["stars", "bright", "earth"],
  lunar: ["stars", "bright", "moon", "earth"],
  stars: ["stars", "bright"],
  deep: ["water", "specks"],
  sky: ["ground", "clouds"],
  mist: ["fog", "billows"],
};
const key = (name: Art) => `backdrop-${name}`;

/** What does not turn with the globe: the air along the limb, the haze inside it, the sun on the water, the night side. Half size. */
function paintLimb(scene: Phaser.Scene, name: string, R: number, deep: number, air: boolean) {
  if (scene.textures.exists(name)) return;
  const pad = 10, S = (R + pad) * 2, t = scene.textures.createCanvas(name, S, S)!, im = t.context.createImageData(S, S), d = im.data;
  const put = (i: number, c: readonly number[], a: number) => {
    d[i] = c[0];
    d[i + 1] = c[1];
    d[i + 2] = c[2];
    d[i + 3] = a;
  };
  const GLOW = [[223, 244, 255], [143, 208, 255], [74, 156, 240], [36, 96, 200]], NIGHT = [4, 6, 15], SUN = [255, 246, 216], DUSK = [240, 138, 74];
  for (let py = 0; py < S; py++) for (let px = 0; px < S; px++) {
    const dx = px + 0.5 - S / 2, dy = py + 0.5 - S / 2, r = Math.hypot(dx, dy), i = (py * S + px) * 4;
    if (r > R + pad || r < R - deep) continue;
    if (r > R) {
      if (air) put(i, GLOW[r - R < 1 ? 0 : r - R < 3 ? 1 : r - R < 6 ? 2 : 3], r - R < 3 ? 255 : r - R < 6 ? 170 : 80);
      continue;
    }
    const x = dx / R, y = dy / R, z = Math.sqrt(Math.max(0, 1 - x * x - y * y));
    // The sun stands up and to the left; the night side comes round from the right.
    const lit = x * -0.72 + y * -0.6 + z * 0.35, edge = R - r;
    if (lit < -0.02) put(i, NIGHT, lit < -0.16 ? 235 : lit < -0.09 ? 190 : 120);
    else if (lit < 0.05) put(i, air ? DUSK : NIGHT, air ? 70 : 90);
    else if (air && edge < 12) put(i, GLOW[edge < 3 ? 1 : 2], edge < 3 ? 150 : edge < 7 ? 95 : 50);
    else if (air) {
      const hl = Math.hypot(-0.72, -0.6, 1.35), glint = (x * -0.72 + y * -0.6 + z * 1.35) / hl;
      if (glint > 0.9988) put(i, SUN, glint > 0.9996 ? 90 : 40);
    }
  }
  t.context.putImageData(im, 0, 0);
  t.refresh();
}

/** A painting that does not meet itself at the edges, laid beside its own reflections so it tiles. */
function mirrored(scene: Phaser.Scene, name: Art) {
  const out = `${key(name)}-mirrored`;
  if (scene.textures.exists(out)) return out;
  const src = scene.textures.get(key(name)).getSourceImage() as HTMLImageElement, w = src.width, h = src.height;
  const canvas = scene.textures.createCanvas(out, w * 2, h * 2)!, c = canvas.context;
  for (const [fx, fy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
    c.setTransform(fx ? -1 : 1, 0, 0, fy ? -1 : 1, fx ? w * 2 : 0, fy ? h * 2 : 0);
    c.drawImage(src, 0, 0);
  }
  c.setTransform(1, 0, 0, 1, 0, 0);
  canvas.refresh();
  return out;
}

/** Whatever lies round a vessel that is not on the sea, behind and below it. */
export class MediumView {
  private objects: Phaser.GameObjects.GameObject[] = [];
  private globe?: Phaser.GameObjects.Image;
  private drift: { sprite: Phaser.GameObjects.TileSprite; vx: number; vy: number }[] = [];
  private twinkle?: Phaser.GameObjects.TileSprite;
  private next = 0;
  private gone = false;

  constructor(private scene: Phaser.Scene, readonly medium: Medium, private W: number, private H: number) {
    // Something the right colour while the paintings load.
    const ground = { orbit: 0x05060d, lunar: 0x05060d, stars: 0x05060d, deep: 0x03101a, sky: 0x6f9a6a, mist: 0xc6c3d4 }[medium];
    this.objects.push(scene.add.rectangle(-800, -600, W + 1600, H + 1200, ground).setOrigin(0, 0).setDepth(-99993.9));
    const missing = NEEDS[medium].filter((name) => !scene.textures.exists(key(name)));
    if (!missing.length) this.build();
    else {
      for (const name of missing) scene.load.image(key(name), `/backdrops/${ART[name].file}`);
      scene.load.once("complete", () => !this.gone && this.build());
      scene.load.start();
    }
  }

  private build() {
    const { scene, medium, W, H } = this, x0 = -800, y0 = -600, w = W + 1600, h = H + 1200;
    const layer = (texture: string, depth: number, vx: number, vy: number, alpha = 1) => {
      // The paintings are twice the game's pixel size, so they are laid at half scale.
      const sprite = scene.add.tileSprite(x0, y0, w, h, texture).setOrigin(0, 0).setTileScale(0.5).setDepth(depth).setAlpha(alpha);
      this.objects.push(sprite);
      this.drift.push({ sprite, vx, vy });
      return sprite;
    };
    const stars = () => {
      layer(key("stars"), -99993.8, 0.8, 0);
      this.twinkle = layer(key("bright"), -99993.6, 0.8, 0);
    };
    if (medium === "orbit" || medium === "lunar") {
      stars();
      // The globe's centre lies far below the vessel, so its limb arcs across the top of the view.
      const R = 800, art = ART[medium === "orbit" ? "earth" : "moon"], cx = W / 2, cy = H / 2 - 130 + R;
      const limb = `backdrop-limb-${medium}`;
      paintLimb(scene, limb, R / 2, 300, medium === "orbit");
      this.globe = scene.add.image(cx, cy, key(medium === "orbit" ? "earth" : "moon")).setOrigin(art.cx / 1024, art.cy / 1024).setScale(R / art.r).setDepth(-99993.4);
      this.objects.push(this.globe, scene.add.image(cx, cy, limb).setScale(2).setDepth(-99993.2));
      // The Earth from the Moon: small, blue, above the horizon.
      if (medium === "lunar") this.objects.push(scene.add.image(cx + 170, H / 2 - 200, key("earth")).setScale(0.045).setDepth(-99993.5));
    } else if (medium === "stars") stars();
    else if (medium === "deep") {
      // The surface is a screen's height above the boat; the plate does not tile, so its neighbours are its reflections.
      for (const i of [-1, 0, 1])
        this.objects.push(scene.add.image(W / 2 + i * 512, H / 2 - 290, key("water")).setOrigin(0.5, 0).setScale(0.5).setFlipX(i !== 0).setDepth(-99993.8));
      layer(key("specks"), -99993.6, -14, 4, 0.8);
    } else if (medium === "sky") {
      layer(key("ground"), -99993.8, -10, 0);
      const shadow = layer(key("clouds"), -99993.6, -28, 0, 0.28).setTint(0x0a1830);
      shadow.tilePositionX = -70;
      shadow.tilePositionY = -100;
      layer(key("clouds"), -99993.4, -28, 0);
    } else {
      layer(mirrored(scene, "fog"), -99993.8, 6, 1.2);
      layer(mirrored(scene, "billows"), -99993.6, -12, -1, 0.9);
    }
  }

  update(time: number, delta: number) {
    const t = time / 1000;
    for (const l of this.drift) {
      l.sprite.tilePositionX -= (l.vx * delta) / 1000;
      l.sprite.tilePositionY -= (l.vy * delta) / 1000;
    }
    // One turn of the globe in about fifteen minutes: the ground sliding under the limb.
    if (this.globe) this.globe.rotation -= (delta / 1000) * ((Math.PI * 2) / 900);
    this.twinkle?.setAlpha(0.55 + 0.45 * Math.sin(t * 1.7));
    if (time < this.next) return;
    const cam = this.scene.cameras.main.worldView;
    if (this.medium === "deep") {
      this.next = time + 5000 + Math.random() * 9000;
      // A school crossing in the dark, or a jellyfish going up.
      const y = cam.y + Math.random() * cam.height, far = Math.random() < 0.5;
      if (Math.random() < 0.7) for (let i = 0; i < 5 + Math.random() * 8; i++)
        this.pass(this.scene.add.rectangle(cam.right + 10 + Math.random() * 60, y + (Math.random() - 0.5) * 30, far ? 3 : 5, far ? 1 : 2, far ? 0x1d4a66 : 0x3d7896), cam.x - 80, undefined, 9000 + Math.random() * 3000);
      else this.pass(this.scene.add.ellipse(cam.x + Math.random() * cam.width, cam.bottom + 10, 9, 6, 0x9fd8e8, 0.5), undefined, cam.y - 20, 26000);
    } else if (this.medium === "sky") {
      this.next = time + 12000 + Math.random() * 20000;
      const y = cam.y + 20 + Math.random() * (cam.height - 40);
      for (let i = 0; i < 5; i++) this.pass(this.scene.add.rectangle(cam.right + 10 + i * 9, y + Math.abs(i - 2) * 5, 4, 1, 0x26323c), cam.x - 40, undefined, 14000);
    } else if (this.medium === "mist") this.next = time + 60000;
    else {
      this.next = time + 20000 + Math.random() * 40000;
      const x = cam.x + Math.random() * cam.width, y = cam.y + Math.random() * cam.height * 0.25;
      const meteor = this.scene.add.rectangle(x, y, 10, 1, 0xffffff).setRotation(0.5).setBlendMode(Phaser.BlendModes.ADD).setDepth(-99993.5);
      this.scene.tweens.add({ targets: meteor, x: x + 60, y: y + 32, alpha: 0, duration: 500, onComplete: () => meteor.destroy() });
    }
  }

  private pass(o: Phaser.GameObjects.Shape, x?: number, y?: number, duration = 9000) {
    o.setDepth(-99993.3);
    this.objects.push(o);
    this.scene.tweens.add({ targets: o, ...(x === undefined ? {} : { x }), ...(y === undefined ? {} : { y }), duration, onComplete: () => {
      this.objects.splice(this.objects.indexOf(o), 1);
      o.destroy();
    } });
  }

  destroy() {
    this.gone = true;
    for (const o of this.objects) o.destroy();
  }
}

import Phaser from "phaser";
import { gameAudio } from "../audio/director";
import { GARMENT_ICON } from "./garment-art";
import { drawGarmentIcon, itemIconFor, itemPalette } from "./garment-icons";
import { DIGITS } from "./combat-effects";

/** World size of a loot icon, in pixels. A tile is 16. */
const SIZE = 12;
const FLY_MS = 520;
const REST_MS = 380;
const PULL_MS = 240;
/** Glyphs past the ten digits: a plus. */
const PLUS = 0b000010111010000;

type View = {
  entityAt: (id: string) => Phaser.GameObjects.Image | undefined;
};

/**
 * What a smashed pot or a cut bush gives up: each piece pops out in an arc,
 * bounces twice, glints, then flies to the player with a chime and a count.
 * The inventory already holds it; this is the show.
 */
export class LootEffects {
  private live = new Set<Phaser.GameObjects.GameObject>();
  /** Pieces collected in quick succession, so a pile chimes only now and then. */
  private chain = 0;
  private chainUntil = 0;
  constructor(
    private scene: Phaser.Scene,
    private view: View,
  ) {}

  spill(at: { x: number; y: number }, loot: { item: string; n: number }[]) {
    // One icon per unit up to three, so five berries read as a handful
    // without burying the ground.
    const pieces = loot.flatMap(({ item, n }) =>
      Array.from({ length: Math.min(3, n) }, (_, i) => ({
        item,
        label: i === 0 ? n : 0,
      })),
    );
    const shown = pieces.slice(0, 9);
    shown.forEach((piece, i) => {
      const angle =
        -Math.PI / 2 +
        (shown.length === 1 ? 0 : (i / (shown.length - 1) - 0.5) * 2.4) +
        (Math.random() - 0.5) * 0.4;
      this.piece(at, piece.item, piece.label, angle, i);
    });
    if (shown.length) this.sparkle(at.x, at.y - 10, 0xfff4b8, 6, 10);
  }

  private texture(item: string) {
    const key = `loot:${item}`;
    if (this.scene.textures.exists(key)) return key;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = GARMENT_ICON;
    const ctx = canvas.getContext("2d")!;
    const icon = itemIconFor(item);
    if (icon) drawGarmentIcon(ctx, icon, 0, 0);
    else {
      // No drawing: a round bead in the item's own colours.
      const p = itemPalette(item);
      const c = GARMENT_ICON / 2;
      const disc = (r: number, fill: string, ox = 0, oy = 0) => {
        ctx.fillStyle = fill;
        ctx.beginPath();
        ctx.arc(c + ox, c + oy, r, 0, Math.PI * 2);
        ctx.fill();
      };
      disc(8, p.outline);
      disc(7, p.shade);
      disc(5.5, p.base, -1, -1);
      disc(2, p.light, -3, -3);
    }
    this.scene.textures.addCanvas(key, canvas);
    return key;
  }

  private piece(
    at: { x: number; y: number },
    item: string,
    count: number,
    angle: number,
    i: number,
  ) {
    const scale = SIZE / GARMENT_ICON;
    const reach = 12 + Math.random() * 10;
    const rest = {
      x: at.x + Math.cos(angle) * reach * 1.2,
      y: at.y + 2 + Math.abs(Math.sin(angle)) * 3 + (Math.random() - 0.5) * 6,
    };
    const start = { x: at.x, y: at.y - 8 };
    const depth = rest.y + 4300;
    const shadow = this.scene.add
      .ellipse(start.x, rest.y, 9, 3, 0x000000, 0.3)
      .setDepth(depth - 1);
    // A dark rim behind the icon keeps it legible on any ground.
    const rim = this.scene.add
      .image(start.x, start.y, this.texture(item))
      .setScale(scale * 1.25)
      .setTintFill(0x1a1410)
      .setAlpha(0.55)
      .setDepth(depth);
    const icon = this.scene.add
      .image(start.x, start.y, this.texture(item))
      .setScale(scale)
      .setDepth(depth + 1);
    for (const o of [shadow, rim, icon]) this.live.add(o);
    const peak = 22 + Math.random() * 8;
    const flight = { t: 0 };
    const place = (x: number, ground: number, lift: number, sy = 1) => {
      icon.setPosition(x, ground - lift).setScale(scale, scale * sy);
      rim.setPosition(x, ground - lift);
      shadow
        .setPosition(x, ground + 1)
        .setScale(1 - Math.min(0.6, lift / 40))
        .setAlpha(0.3 - Math.min(0.2, lift / 120));
    };
    this.scene.tweens.add({
      targets: flight,
      t: 1,
      delay: i * 35,
      duration: FLY_MS,
      onUpdate: () => {
        const t = flight.t;
        const x = start.x + (rest.x - start.x) * Math.min(1, t * 1.15);
        const ground = start.y + 8 + (rest.y - start.y - 8) * t;
        // Up and down, then two smaller bounces.
        const lift =
          t < 0.6
            ? peak * Math.sin((t / 0.6) * Math.PI) + 8 * (1 - t / 0.6)
            : t < 0.85
              ? peak * 0.28 * Math.sin(((t - 0.6) / 0.25) * Math.PI)
              : peak * 0.08 * Math.sin(((t - 0.85) / 0.15) * Math.PI);
        const landing = lift < 1.5 && t > 0.55;
        place(x, ground, lift, landing ? 0.75 : 1);
      },
      onComplete: () => {
        place(rest.x, rest.y, 0);
        this.glint(icon.x + 3, icon.y - SIZE + 2, i * 50);
        const bob = { t: 0 };
        this.scene.tweens.add({
          targets: bob,
          t: 1,
          duration: REST_MS,
          delay: i * 25,
          onUpdate: () => place(rest.x, rest.y, Math.sin(bob.t * Math.PI) * 2),
          onComplete: () => this.pull(icon, rim, shadow, item, count),
        });
      },
    });
  }

  /** Homes on the player wherever they have got to. */
  private pull(
    icon: Phaser.GameObjects.Image,
    rim: Phaser.GameObjects.Image,
    shadow: Phaser.GameObjects.Ellipse,
    item: string,
    count: number,
  ) {
    const from = { x: icon.x, y: icon.y };
    const base = icon.scaleX;
    const pull = { t: 0 };
    this.scene.tweens.add({
      targets: shadow,
      alpha: 0,
      duration: 120,
    });
    this.scene.tweens.add({
      targets: pull,
      t: 1,
      duration: PULL_MS,
      ease: "Back.easeIn",
      onUpdate: () => {
        const player = this.view.entityAt("player");
        if (!player) return;
        const to = { x: player.x, y: player.y - 14 };
        const t = pull.t;
        const x = from.x + (to.x - from.x) * t;
        const y = from.y + (to.y - from.y) * t - Math.sin(t * Math.PI) * 10;
        const s = base * (1 - 0.35 * Math.max(0, t));
        icon
          .setPosition(x, y)
          .setScale(s)
          .setDepth(to.y + 4700);
        rim
          .setPosition(x, y)
          .setScale(s * 1.25)
          .setDepth(to.y + 4699);
      },
      onComplete: () => {
        const player = this.view.entityAt("player");
        const x = player?.x ?? icon.x,
          y = (player?.y ?? icon.y) - 14;
        for (const o of [icon, rim, shadow]) {
          this.live.delete(o);
          o.destroy();
        }
        this.collected(x, y, item, count);
      },
    });
  }

  private collected(x: number, y: number, item: string, count: number) {
    const now = this.scene.time.now;
    this.chain = now < this.chainUntil ? this.chain + 1 : 0;
    this.chainUntil = now + 400;
    const color = Phaser.Display.Color.RGBStringToColor(
      itemPalette(item).light,
    ).color;
    this.sparkle(x, y, color, 5, 7);
    // Every third piece chimes, so a pile does not become a buzz.
    if (this.chain % 3 === 0) void gameAudio()?.event("pickup");
    if (count) this.label(x, y - 6, count, item);
  }

  /** "+N" beside a small copy of the icon, rising off the player. */
  private label(x: number, y: number, n: number, item: string) {
    const px = 1;
    const text = `+${n}`;
    const g = this.scene.add.graphics().setDepth(y + 4800);
    const glyph = (ch: string) =>
      ch === "+" ? PLUS : (DIGITS[Number(ch)] ?? 0);
    const width = text.length * 4 - 1;
    const icon = this.scene.add
      .image(-width / 2 - 5, 2, this.texture(item))
      .setScale(8 / GARMENT_ICON);
    for (const [pass, color] of [
      [1, 0x1a1410],
      [0, 0xfff4d0],
    ] as const)
      [...text].forEach((ch, i) => {
        const bits = glyph(ch);
        for (let r = 0; r < 5; r++)
          for (let c = 0; c < 3; c++)
            if (bits & (1 << (14 - (r * 3 + c)))) {
              const gx = -width / 2 + 1 + (i * 4 + c) * px;
              const gy = r * px;
              g.fillStyle(color, 1);
              if (pass) g.fillRect(gx - 1, gy - 1, px + 2, px + 2);
              else g.fillRect(gx, gy, px, px);
            }
      });
    const box = this.scene.add.container(x, y, [icon, g]).setDepth(y + 4800);
    this.live.add(box);
    this.scene.tweens.add({
      targets: box,
      y: y - 12,
      duration: 700,
      ease: "Cubic.easeOut",
    });
    this.scene.tweens.add({
      targets: box,
      alpha: 0,
      delay: 450,
      duration: 250,
      onComplete: () => {
        this.live.delete(box);
        box.destroy();
      },
    });
  }

  /** A four-point twinkle on a piece at rest. */
  private glint(x: number, y: number, delay: number) {
    const g = this.scene.add
      .graphics()
      .setDepth(y + 4900)
      .setAlpha(0);
    g.fillStyle(0xffffff, 1);
    g.fillRect(-0.5, -3, 1, 6);
    g.fillRect(-3, -0.5, 6, 1);
    g.fillRect(-1, -1, 2, 2);
    g.setPosition(x, y).setScale(0.3);
    this.live.add(g);
    this.scene.tweens.add({
      targets: g,
      alpha: 1,
      scale: 1,
      delay,
      duration: 110,
      yoyo: true,
      hold: 60,
      ease: "Quad.easeOut",
      onComplete: () => {
        this.live.delete(g);
        g.destroy();
      },
    });
  }

  private sparkle(
    x: number,
    y: number,
    color: number,
    count: number,
    radius: number,
  ) {
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + Math.random() * 0.5;
      const p = this.scene.add
        .rectangle(x, y, 2, 2, i % 2 ? 0xffffff : color)
        .setDepth(y + 4900);
      this.live.add(p);
      this.scene.tweens.add({
        targets: p,
        x: x + Math.cos(a) * radius,
        y: y + Math.sin(a) * radius * 0.7,
        alpha: 0,
        scale: 0.4,
        duration: 260,
        ease: "Quad.easeOut",
        onComplete: () => {
          this.live.delete(p);
          p.destroy();
        },
      });
    }
  }

  clear() {
    for (const o of this.live) o.destroy();
    this.live.clear();
  }
}

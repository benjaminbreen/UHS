import type Phaser from "phaser";
import type { LightingId } from "./lighting";
import { gustAt, windVector, wind } from "./wind";

export type CritterKind = "bird" | "butterfly" | "firefly" | "midge";
type Spec = {
  /** How many are in the air per million world pixels of view. */
  density: number;
  depth: number;
  colors: string[];
  additive?: boolean;
};

const specs: Record<CritterKind, Spec> = {
  bird: { density: 20, depth: 18700, colors: ["#2b3242", "#39414f"] },
  butterfly: {
    density: 30,
    depth: 18450,
    colors: ["#f4e7a8", "#f7f3e6", "#e9c4d2"],
  },
  firefly: {
    density: 70,
    // Above the night wash: a firefly the darkness dims is not a firefly.
    depth: 19100,
    colors: ["#ffe9a0", "#d8f0a0"],
    additive: true,
  },
  midge: { density: 110, depth: 18450, colors: ["#3b3d33", "#4a4c40"] },
};

// Two frames each: wings up and wings down, or a bright and a dim mote.
const shapes: Record<CritterKind, string[][]> = {
  bird: [
    ["X...X", ".X.X.", "..X..", ".....", "....."],
    [".....", "XX.XX", "..X..", ".....", "....."],
  ],
  butterfly: [
    ["X.X..", ".X...", ".....", ".....", "....."],
    ["XXX..", ".X...", ".....", ".....", "....."],
  ],
  firefly: [
    ["..X..", ".XXX.", "XXXXX", ".XXX.", "..X.."],
    [".....", "..X..", ".XXX.", "..X..", "....."],
  ],
  midge: [
    ["X....", ".....", ".....", ".....", "....."],
    [".X...", ".....", ".....", ".....", "....."],
  ],
};
const W = 5,
  H = 5;

function ensureAtlas(scene: Phaser.Scene, kind: CritterKind) {
  const key = `critter-${kind}`;
  if (scene.textures.exists(key)) return key;
  const spec = specs[kind];
  const canvas = scene.textures.createCanvas(key, 2 * W, spec.colors.length * H)!;
  const ctx = canvas.getContext();
  ctx.clearRect(0, 0, 2 * W, spec.colors.length * H);
  spec.colors.forEach((color, row) => {
    ctx.fillStyle = color;
    shapes[kind].forEach((shape, frame) => {
      shape.forEach((line, y) =>
        [...line].forEach((pixel, x) => {
          if (pixel === "X") ctx.fillRect(frame * W + x, row * H + y, 1, 1);
        }),
      );
      canvas.add(`${row}-${frame}`, 0, frame * W, row * H, W, H);
    });
  });
  canvas.refresh();
  return key;
}

const BIRD_SHADOW = "critter-bird-shadow";
/** Height a bird flies above the ground it shadows. */
const ALTITUDE = 34;
function ensureBirdShadow(scene: Phaser.Scene) {
  if (scene.textures.exists(BIRD_SHADOW)) return;
  const canvas = scene.textures.createCanvas(BIRD_SHADOW, 4, 2)!;
  const ctx = canvas.getContext();
  ctx.clearRect(0, 0, 4, 2);
  ctx.fillStyle = "#1d2230";
  ctx.fillRect(1, 0, 2, 1);
  ctx.fillRect(0, 1, 4, 1);
  canvas.refresh();
}

/** What is alive and visible here. Each answer is a whole scene's worth of
 * small movement, so only one kind is ever in the air at a time. */
export function critterFor(
  season: string,
  ecology: string,
  climate: string,
  light: LightingId,
  condition: string,
  tempC: number,
  wetness: number,
): CritterKind | undefined {
  const night = light === "night";
  const dusk = light === "dusk";
  const wet = condition === "rain";
  if (climate === "tundra" && season !== "summer") return undefined;
  // Nothing much flies in the rain or the cold.
  if (wet || tempC < 6) return undefined;
  if (night)
    return tempC > 14 &&
      ["temperate", "mediterranean", "tropical", "monsoon"].includes(climate) &&
      season !== "winter"
      ? "firefly"
      : undefined;
  if (dusk && (wetness > 0.15 || ecology === "wetland") && tempC > 10)
    return "midge";
  if (
    (season === "spring" || season === "summer") &&
    tempC > 13 &&
    condition !== "overcast" &&
    !["desert", "tundra"].includes(ecology)
  )
    return "butterfly";
  return light === "early-morning" || dusk ? "bird" : undefined;
}

type Critter = {
  x: number;
  y: number;
  phase: number;
  row: number;
  /** Swarm or flock anchor, as an offset from the leader. */
  ox: number;
  oy: number;
  lead: number;
};

/** Small ambient life: a skein of birds at first light, butterflies over the
 * meadow, midges above damp ground at dusk, fireflies on a warm night. One
 * pooled sprite per creature, recycled around the camera like the drift. */
export class AmbientLife {
  private layer?: Phaser.GameObjects.Container;
  private sprites: Phaser.GameObjects.Image[] = [];
  private critters: Critter[] = [];
  private shadows: Phaser.GameObjects.Image[] = [];
  private kind?: CritterKind;
  private area = 0;
  private seed = 0;

  constructor(private scene: Phaser.Scene) {}

  set(kind: CritterKind | undefined, seed: number) {
    if (!kind) return this.clear();
    if (kind === this.kind) return;
    this.clear();
    this.kind = kind;
    this.seed = seed;
    this.fill();
  }

  private fill() {
    const kind = this.kind!;
    const spec = specs[kind];
    const view = this.scene.cameras.main.worldView;
    this.area = Math.max(3e5, view.width * view.height);
    const count = Math.min(220, Math.round((spec.density * this.area) / 1e6));
    const key = ensureAtlas(this.scene, kind);
    this.layer = this.scene.add.container(0, 0).setDepth(spec.depth);
    const rnd = (n: number) => {
      const v = Math.sin(this.seed * 45.11 + n * 78.233) * 43758.5453;
      return v - Math.floor(v);
    };
    // Birds and midges keep company; butterflies and fireflies do not.
    const group = kind === "bird" ? 4 : kind === "midge" ? 9 : 1;
    for (let i = 0; i < count; i++) {
      const lead = Math.floor(i / group);
      this.critters.push({
        x: view.x + rnd(lead) * (view.width || 1200),
        y: view.y + rnd(lead + 0.5) * (view.height || 900),
        phase: rnd(i + 2.5) * 6.28,
        row: Math.floor(rnd(i + 3.5) * spec.colors.length),
        ox: (rnd(i + 4.5) - 0.5) * (kind === "bird" ? 34 : 26),
        oy: (rnd(i + 5.5) - 0.5) * (kind === "bird" ? 16 : 22),
        lead,
      });
      const image = this.scene.add
        .image(0, 0, key, `${this.critters[i].row}-0`)
        .setOrigin(0);
      if (spec.additive) image.setBlendMode("ADD");
      this.layer.add(image);
      this.sprites.push(image);
      // A silhouette at ground level is a beetle; the shadow underneath is
      // what makes it a bird in the air.
      if (kind === "bird") {
        ensureBirdShadow(this.scene);
        const shadow = this.scene.add
          .image(0, 0, BIRD_SHADOW)
          .setOrigin(0)
          .setAlpha(0.3)
          .setDepth(spec.depth - 1);
        this.layer.add(shadow);
        this.shadows.push(shadow);
      }
    }
    this.scene.game.canvas.dataset.critters = `${kind}:${count}`;
  }

  clear() {
    this.layer?.destroy(true);
    this.layer = undefined;
    this.sprites = [];
    this.shadows = [];
    this.critters = [];
    this.kind = undefined;
    this.area = 0;
    if (this.scene.game?.canvas) this.scene.game.canvas.dataset.critters = "none";
  }

  update(time: number, frozen = false) {
    if (!this.layer || !this.kind) return;
    const view = this.scene.cameras.main.worldView;
    if (!view.width) return;
    if (
      this.area &&
      Math.abs(view.width * view.height - this.area) > this.area * 0.4
    ) {
      const kind = this.kind;
      this.layer.destroy(true);
      this.sprites = [];
      this.shadows = [];
      this.critters = [];
      this.kind = kind;
      this.fill();
      return;
    }
    const kind = this.kind;
    const t = frozen ? 0 : time / 1000;
    const w = view.width + 40,
      h = view.height + 40;
    const v = windVector();
    for (let i = 0; i < this.critters.length; i++) {
      const c = this.critters[i];
      const sprite = this.sprites[i];
      const seat = this.path(kind, c, t, v);
      const x = view.x - 20 + ((((seat.x - view.x) % w) + w) % w);
      const y = view.y - 20 + ((((seat.y - view.y) % h) + h) % h);
      sprite.setPosition(Math.round(x), Math.round(y) - (kind === "bird" ? ALTITUDE : 0));
      sprite.setFrame(`${c.row}-${seat.frame}`);
      if (seat.alpha !== undefined) sprite.setAlpha(seat.alpha);
      this.shadows[i]?.setPosition(Math.round(x), Math.round(y));
    }
  }

  /** Where one creature is now, and which frame it is showing. */
  private path(
    kind: CritterKind,
    c: Critter,
    t: number,
    v: { x: number; y: number },
  ) {
    const flock = c.lead * 1.7;
    if (kind === "bird") {
      // A skein holds its heading and crosses the view; the wind hurries it.
      const speed = 48 + wind().strength * 40;
      const head = c.phase * 0.12 + 0.6;
      return {
        x: c.x + c.ox + (Math.cos(head) + v.x * 0.4) * speed * t,
        y: c.y + c.oy + (Math.sin(head) * 0.35 + v.y * 0.4) * speed * t,
        frame: Math.floor(t * 7 + c.phase) % 2,
      };
    }
    if (kind === "midge") {
      // A swarm hangs over one spot, bobbing, and edges downwind.
      return {
        x:
          c.x +
          v.x * 5 * t +
          c.ox * Math.sin(t * 1.6 + c.phase) +
          Math.sin(t * 5 + c.phase * 3) * 3,
        y:
          c.y +
          v.y * 5 * t +
          c.oy * 0.5 * Math.cos(t * 2.1 + c.phase) +
          Math.cos(t * 6 + c.phase * 2) * 2,
        frame: Math.floor(t * 9 + c.phase) % 2,
      };
    }
    if (kind === "firefly") {
      // A slow wander and a long blink, so the field pulses rather than glows.
      const blink = Math.sin(t * 1.1 + c.phase * 4);
      return {
        x: c.x + Math.sin(t * 0.5 + c.phase) * 22 + v.x * 7 * t,
        y: c.y + Math.cos(t * 0.37 + c.phase * 1.3) * 14 - t * 2,
        frame: blink > 0.55 ? 0 : 1,
        alpha: Math.max(0, Math.min(0.78, (blink - 0.1) * 1.1)),
      };
    }
    // Butterflies: an aimless flutter that still drifts with the wind.
    const gust = gustAt(t * 1000, c.x, c.y, c.phase);
    return {
      x: c.x + Math.sin(t * 0.8 + c.phase) * 26 + gust * 10 + v.x * 12 * t,
      y:
        c.y +
        Math.cos(t * 0.6 + c.phase * 1.7 + flock) * 18 +
        Math.sin(t * 3.4 + c.phase) * 3,
      frame: Math.floor(t * 6 + c.phase) % 2,
    };
  }
}

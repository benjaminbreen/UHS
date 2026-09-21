import type Phaser from "phaser";
import type { TopographyCell, TopographySample } from "../core/topography";
import type { Ecology } from "../content/ecology/profiles";
import { waterHash as hash } from "./water-style";
import { gustAt } from "./wind";
import { canvasStat } from "./canvas-stat";

export const FLOWER_ATLAS = "flowers-2";
const kinds = [
  "daisy",
  "buttercup",
  "bluet",
  "clover",
  "poppy",
  "heather",
  "umbel",
  "cornflower",
  "primrose",
] as const;
type FlowerKind = (typeof kinds)[number];
/** How the plant carries its flowers: one head on a stem, a spike of small
 * ones, a flat cluster on a tall stem, or a low mat of several heads. */
type Habit = "head" | "spike" | "umbel" | "mat";
// Petal, centre, habit.
const species: Record<FlowerKind, [string, string, Habit]> = {
  daisy: ["#f6f3e8", "#fbe27a", "head"],
  buttercup: ["#f3cf3e", "#fbeea0", "mat"],
  bluet: ["#bcc6e4", "#f6f3e8", "mat"],
  clover: ["#e6a6c8", "#f8dcec", "head"],
  poppy: ["#e2533f", "#3a2a22", "head"],
  heather: ["#a86cb4", "#d6a6dc", "spike"],
  umbel: ["#f4f1e2", "#d9d6bf", "umbel"],
  cornflower: ["#4f6fd0", "#9db2ee", "head"],
  primrose: ["#f4e9a0", "#e8b83a", "mat"],
};
const meadow: Record<Ecology, FlowerKind[]> = {
  grassland: ["daisy", "buttercup", "bluet", "clover", "cornflower", "umbel"],
  "temperate-woodland": ["daisy", "bluet", "clover", "primrose", "umbel"],
  "boreal-woodland": ["bluet", "daisy", "heather"],
  "tropical-woodland": ["poppy", "clover", "primrose"],
  wetland: ["buttercup", "bluet", "umbel"],
  "dry-scrub": ["poppy", "buttercup", "heather"],
  savanna: ["buttercup", "poppy", "cornflower"],
  tundra: ["bluet", "heather"],
  desert: [],
};
const W = 7,
  H = 10;
const STEM = "#3f7a33",
  LEAF = "#5a9a3e",
  shadow = "#2f6b33";
/** A plant, not a dot: stem, a leaf or two, and its flowers in the habit of
 * its kind, over a row of shadow. Three sway frames lean the top a pixel. */
function flowerPixels(kind: FlowerKind, frame: number) {
  const out = new Uint8ClampedArray(W * H * 4);
  const rgb = (c: string) => [
    parseInt(c.slice(1, 3), 16),
    parseInt(c.slice(3, 5), 16),
    parseInt(c.slice(5, 7), 16),
    255,
  ];
  const put = (x: number, y: number, c: string) => {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    out.set(rgb(c), (y * W + x) * 4);
  };
  const lean = frame === 1 ? 1 : frame === 2 ? -1 : 0;
  const [petal, centre, habit] = species[kind];
  for (let x = 2; x <= 4; x++) put(x, H - 1, shadow);
  const head = (cx: number, cy: number) => {
    put(cx, cy - 1, petal);
    put(cx - 1, cy, petal);
    put(cx + 1, cy, petal);
    put(cx, cy + 1, petal);
    put(cx, cy, centre);
  };
  if (habit === "mat") {
    // Low and spreading: leaves on the ground, three heads just above them.
    for (const x of [1, 2, 4, 5]) put(x, H - 2, LEAF);
    put(3, H - 2, STEM);
    head(1 + lean, H - 4);
    head(5 + lean, H - 5);
    put(3 + lean, H - 6, petal);
    put(3 + lean, H - 5, centre);
    return out;
  }
  const top = habit === "umbel" ? 2 : habit === "spike" ? 1 : 3;
  for (let y = H - 2; y > top; y--)
    put(3 + (y < (H + top) / 2 ? lean : 0), y, STEM);
  put(2, H - 3, LEAF);
  put(4, H - 4, LEAF);
  if (habit === "head") head(3 + lean, top);
  else if (habit === "spike")
    for (let y = top; y < top + 5; y++) {
      put(3 + lean, y, y % 2 ? petal : centre);
      if (y > top) put(3 + lean + (y % 2 ? -1 : 1), y, petal);
    }
  else {
    for (let x = 1; x <= 5; x++) put(x + lean, top, x % 2 ? petal : centre);
    for (const x of [2, 4]) put(x + lean, top + 1, STEM);
    put(3 + lean, top - 1, petal);
  }
  return out;
}
export function ensureFlowerAtlas(scene: Phaser.Scene) {
  if (scene.textures.exists(FLOWER_ATLAS)) return;
  const w = 3 * W,
    h = kinds.length * H;
  const atlas = scene.textures.createCanvas(FLOWER_ATLAS, w, h)!;
  const ctx = atlas.getContext();
  const image = ctx.createImageData(w, h);
  kinds.forEach((kind, row) => {
    for (let frame = 0; frame < 3; frame++) {
      const p = flowerPixels(kind, frame);
      for (let y = 0; y < H; y++)
        image.data.set(
          p.subarray(y * W * 4, (y + 1) * W * 4),
          ((row * H + y) * w + frame * W) * 4,
        );
      atlas.add(`${kind}-${frame}`, 0, frame * W, row * H, W, H);
    }
  });
  ctx.putImageData(image, 0, 0);
  atlas.refresh();
}

export type FlowerSpot = {
  x: number;
  y: number;
  wx: number;
  wy: number;
  kind: FlowerKind;
  phase: number;
};
const seasonal: Record<string, number> = {
  spring: 1,
  summer: 0.75,
  autumn: 0.2,
  winter: 0,
};
/** Blooms grow in colonies on open turf, away from worn ground and water. */
export function flowersAt(
  sample: TopographySample,
  x: number,
  y: number,
  ox: number,
  oy: number,
  top: number,
): FlowerSpot[] {
  const c = sample(x, y);
  const h = c?.habitat;
  if (!c || !h || !turf(c)) return [];
  const choices = meadow[h.ecology];
  const season = seasonal[h.season] ?? 0.5;
  if (!choices.length || !season) return [];
  for (let dy = -1; dy <= 1; dy++)
    for (let dx = -1; dx <= 1; dx++) {
      const n = sample(x + dx, y + dy);
      if (!n || n.surface === "soil" || n.feature || n.height !== c.height)
        return [];
    }
  const wx = x + ox,
    wy = y + oy;
  const colony = hash(Math.floor(wx / 5), Math.floor(wy / 5), 601);
  const dense = h.kind === "meadow" ? 1.6 : h.kind === "open" ? 1 : 0.5;
  // A colony is thick with its one flower; the odd stray grows anywhere.
  const chance = (colony > 0.62 ? 0.34 : 0.025) * season * dense;
  if (hash(wx, wy, 603) > chance) return [];
  const count = 1 + Math.floor(hash(wx, wy, 605) * (colony > 0.62 ? 3 : 1.4));
  const spots: FlowerSpot[] = [];
  const kind =
    choices[
      Math.floor(
        hash(Math.floor(wx / 5), Math.floor(wy / 5), 607) * choices.length,
      )
    ];
  for (let i = 0; i < count; i++) {
    // Blooms cluster a clear gap apart, so heads never overlap.
    const gap = (seed: number) =>
      (hash(wx, wy, seed) < 0.5 ? -1 : 1) *
      (4 + Math.floor(hash(wx, wy, seed + 2) * 2));
    const px =
      i === 0
        ? 3 + Math.floor(hash(wx, wy, 609) * 8)
        : spots[0].x - x * 16 + gap(619 + i * 7);
    const py =
      i === 0
        ? 3 + Math.floor(hash(wx, wy, 613) * 8)
        : spots[0].y - top + gap(641 + i * 7);
    spots.push({
      x: x * 16 + px,
      y: top + py,
      wx: wx * 16 + px,
      wy: wy * 16 + py,
      kind,
      phase: hash(wx, wy, 617 + i) * 6.28,
    });
  }
  return spots;
}
function turf(c: TopographyCell) {
  const h = c.habitat!;
  return (
    !c.ramp &&
    !c.bridge &&
    !c.feature &&
    !c.solid &&
    ["grass", "damp", "dry"].includes(c.surface) &&
    h.exposed < 0.4 &&
    h.wet < 0.61 &&
    (h.kind !== "woodland" || h.cover < 0.5) &&
    h.kind !== "exposed" &&
    (!c.waterVisual || c.waterVisual.distance > c.waterVisual.shoreWidth + 1)
  );
}

type Patch = {
  container: Phaser.GameObjects.Container;
  sprites: { spot: FlowerSpot; image: Phaser.GameObjects.Image }[];
  frame: number;
  bounds: { x: number; y: number; right: number; bottom: number };
};
const managers = new WeakMap<
  Phaser.Scene,
  { patches: Set<Patch>; frame: number }
>();
/** One container per chunk; the scene's gust rolls across the field so
 * neighbours sway together rather than each flower keeping its own clock. */
export function addFlowers(scene: Phaser.Scene, spots: FlowerSpot[]) {
  if (!spots.length) return;
  ensureFlowerAtlas(scene);
  let manager = managers.get(scene);
  if (!manager) {
    manager = { patches: new Set(), frame: -1 };
    managers.set(scene, manager);
    const m = manager;
    const update = (time: number) => {
      const options = (scene as unknown as { options?: { freeze?: boolean } })
        .options;
      const frame = options?.freeze ? 0 : Math.floor(time / 120);
      if (frame === m.frame) return;
      m.frame = frame;
      const view = scene.cameras.main.worldView;
      let visible = 0;
      for (const patch of m.patches) {
        const g = patch.container;
        const inView =
          !view.width ||
          (g.x + patch.bounds.x < view.right + 16 &&
            g.x + patch.bounds.right > view.x - 16 &&
            g.y + patch.bounds.y < view.bottom + 48 &&
            g.y + patch.bounds.bottom > view.y - 48);
        g.setVisible(inView);
        if (!inView) continue;
        visible++;
        sway(patch, frame);
      }
      canvasStat(scene.game.canvas, "flowerPatches", visible);
    };
    scene.events.on("update", update);
    scene.events.once("shutdown", () => {
      scene.events.off("update", update);
      m.patches.clear();
      managers.delete(scene);
    });
  }
  const container = scene.add.container(0, 0).setDepth(-9998);
  const sprites = spots.map((spot) => {
    const image = scene.add
      .image(spot.x - 3, spot.y - 8, FLOWER_ATLAS, `${spot.kind}-0`)
      .setOrigin(0);
    container.add(image);
    return { spot, image };
  });
  const patch: Patch = {
    container,
    sprites,
    frame: -1,
    bounds: {
      x: Math.min(...spots.map((s) => s.x)) - 4,
      y: Math.min(...spots.map((s) => s.y)) - 12,
      right: Math.max(...spots.map((s) => s.x)) + 4,
      bottom: Math.max(...spots.map((s) => s.y)) + 4,
    },
  };
  manager.patches.add(patch);
  container.once("destroy", () => manager!.patches.delete(patch));
  sway(patch, Math.max(0, manager.frame));
  scene.game.canvas.dataset.flowerCount = String(
    Number(scene.game.canvas.dataset.flowerCount ?? 0) + spots.length,
  );
  return container;
}
function sway(patch: Patch, frame: number) {
  if (patch.frame === frame) return;
  patch.frame = frame;
  for (const { spot, image } of patch.sprites) {
    const gust = gustAt(frame * 120, spot.wx, spot.wy, spot.phase);
    const f = gust > 0.6 ? 1 : gust < -0.6 ? 2 : 0;
    image.setFrame(`${spot.kind}-${f}`);
  }
}

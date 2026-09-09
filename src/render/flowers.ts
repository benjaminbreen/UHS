import type Phaser from "phaser";
import type { TopographyCell, TopographySample } from "../core/topography";
import type { Ecology } from "../content/ecology/profiles";
import { waterHash as hash } from "./water-style";

export const FLOWER_ATLAS = "flowers-1";
const kinds = ["daisy", "buttercup", "bluet", "clover", "poppy"] as const;
type FlowerKind = (typeof kinds)[number];
// Petal, centre.
const petals: Record<FlowerKind, [string, string]> = {
  daisy: ["#f6f3e8", "#fbe27a"],
  buttercup: ["#f3cf3e", "#fbeea0"],
  bluet: ["#bcc6e4", "#f6f3e8"],
  clover: ["#e6a6c8", "#f8dcec"],
  poppy: ["#e2533f", "#f8b9a6"],
};
const meadow: Record<Ecology, FlowerKind[]> = {
  grassland: ["daisy", "buttercup", "bluet", "clover"],
  "temperate-woodland": ["daisy", "bluet", "clover"],
  "boreal-woodland": ["bluet", "daisy"],
  "tropical-woodland": ["poppy", "clover"],
  wetland: ["buttercup", "bluet"],
  "dry-scrub": ["poppy", "buttercup"],
  tundra: ["bluet"],
  desert: [],
};
const SIZE = 5;
const shadow = "#2f6b33";
/** A centre pixel and four petals over a row of shadow, no stem. Three sway
 * frames shift the head a pixel either way. */
function flowerPixels(kind: FlowerKind, frame: number) {
  const out = new Uint8ClampedArray(SIZE * SIZE * 4);
  const rgb = (c: string) => [
    parseInt(c.slice(1, 3), 16),
    parseInt(c.slice(3, 5), 16),
    parseInt(c.slice(5, 7), 16),
    255,
  ];
  const put = (x: number, y: number, c: string) => {
    if (x < 0 || y < 0 || x >= SIZE || y >= SIZE) return;
    out.set(rgb(c), (y * SIZE + x) * 4);
  };
  const lean = frame === 1 ? 1 : frame === 2 ? -1 : 0;
  const cx = 2 + lean,
    cy = 1;
  for (let x = 1; x <= 3; x++) put(x, 3, shadow);
  const [petal, centre] = petals[kind];
  put(cx, cy - 1, petal);
  put(cx - 1, cy, petal);
  put(cx + 1, cy, petal);
  put(cx, cy + 1, petal);
  put(cx, cy, centre);
  return out;
}
export function ensureFlowerAtlas(scene: Phaser.Scene) {
  if (scene.textures.exists(FLOWER_ATLAS)) return;
  const w = 3 * SIZE,
    h = kinds.length * SIZE;
  const atlas = scene.textures.createCanvas(FLOWER_ATLAS, w, h)!;
  const ctx = atlas.getContext();
  const image = ctx.createImageData(w, h);
  kinds.forEach((kind, row) => {
    for (let frame = 0; frame < 3; frame++) {
      const p = flowerPixels(kind, frame);
      for (let y = 0; y < SIZE; y++)
        image.data.set(
          p.subarray(y * SIZE * 4, (y + 1) * SIZE * 4),
          ((row * SIZE + y) * w + frame * SIZE) * 4,
        );
      atlas.add(`${kind}-${frame}`, 0, frame * SIZE, row * SIZE, SIZE, SIZE);
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
  const chance = (colony > 0.7 ? 0.22 : 0.01) * season * dense;
  if (hash(wx, wy, 603) > chance) return [];
  const count = hash(wx, wy, 605) < 0.5 ? 2 : 1;
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
/** One container per chunk; a slow gust rolls across the field so neighbours
 * sway together rather than each flower flickering on its own clock. */
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
      scene.game.canvas.dataset.flowerPatches = String(visible);
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
      .image(spot.x - 2, spot.y - 2, FLOWER_ATLAS, `${spot.kind}-0`)
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
      y: Math.min(...spots.map((s) => s.y)) - 6,
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
    const gust = Math.sin(
      frame * 0.18 - spot.wx * 0.045 - spot.wy * 0.02 + spot.phase,
    );
    const f = gust > 0.6 ? 1 : gust < -0.6 ? 2 : 0;
    image.setFrame(`${spot.kind}-${f}`);
  }
}

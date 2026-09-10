import type Phaser from "phaser";
import { crops } from "../content/agriculture/crops";
import type { Crop, CropId, CropStage } from "../content/agriculture/types";
import type { TopographySample } from "../core/topography";
import { own, type RenderResources } from "./resources";
import { waterHash as hash } from "./water-style";

/** Atlas holding authored `crop-<id>-<stage>-<frame>` sprites. */
export const CROP_ATLAS = "atlas";
/** Procedural stand-ins, generated when the atlas has no frame for a crop. */
export const CROP_FALLBACK_ATLAS = "crops-1";

export type CropSpot = {
  x: number;
  y: number;
  wx: number;
  wy: number;
  crop: CropId;
  stage: "green" | "ripe";
  phase: number;
};

const standing = (crop: Crop) =>
  crop.kind === "tree" ||
  crop.kind === "vine" ||
  crop.height === "mid" ||
  crop.height === "tall";

/** Standing-crop sprites on a lattice along the furrow axis. Only crops tall
 * enough to show over the ground raster, only while there is something to
 * see; trees stand all year. Never on an enclosure edge cell. */
export function cropsAt(
  sample: TopographySample,
  x: number,
  y: number,
  ox: number,
  oy: number,
  top: number,
): CropSpot[] {
  const c = sample(x, y);
  const f = c?.field;
  // Enclosure edge cells stay clear so the fence reads.
  if (!c || !f || f.ditch || f.fence || c.solid) return [];
  const crop = (crops as Partial<typeof crops>)[f.crop];
  if (!crop || crop.kind === "fallow" || crop.kind === "pasture") return [];
  if (!standing(crop)) return [];
  const tree = crop.kind === "tree";
  const stage: CropStage = f.stage;
  if (stage === "stubble") return [];
  if (stage !== "green" && stage !== "ripe" && !tree) return [];
  const drawn: "green" | "ripe" = stage === "ripe" ? "ripe" : "green";
  const wx = x + ox,
    wy = y + oy;
  const along = f.axis === "x" ? wx : wy,
    across = f.axis === "x" ? wy : wx;
  // Lattice by habit: grains and canes every second cell along the row,
  // staggered; trees every fourth on a staggered grid; vines in rows.
  let on: boolean;
  if (tree) on = mod(across, 4) === 0 && mod(along + (mod(across, 8) ? 2 : 0), 4) === 0;
  else if (crop.kind === "vine") on = mod(across, 3) === 0 && mod(along, 2) === 0;
  else on = mod(along + mod(across, 2), 2) === 0;
  if (!on) return [];
  // Keep the base clear of a boundary on the cell's outer rows.
  const jx = Math.floor(hash(wx, wy, 651) * 5) - 2,
    jy = Math.floor(hash(wx, wy, 653) * 5) - 2;
  let px = 8 + jx,
    py = 10 + jy;
  if (f.edges & 8) px = Math.max(px, 5);
  if (f.edges & 2) px = Math.min(px, 10);
  if (f.edges & 1) py = Math.max(py, 6);
  if (f.edges & 4) py = Math.min(py, 12);
  return [
    {
      x: x * 16 + px,
      y: top + py,
      wx: wx * 16 + px,
      wy: wy * 16 + py,
      crop: f.crop,
      stage: drawn,
      phase: hash(wx, wy, 655) * 6.28,
    },
  ];
}
const mod = (n: number, d: number) => ((n % d) + d) % d;

const frameName = (crop: CropId, stage: "green" | "ripe", f: number) =>
  `crop-${crop}-${stage}-${f}`;

/** Texture and frame for a spot: the authored frame, else the authored
 * wheat, else a procedural stand-in for the crop itself. */
function resolve(
  scene: Phaser.Scene,
  spot: CropSpot,
): { texture: string; crop: CropId } {
  const has = (key: string, crop: CropId) => {
    if (!scene.textures.exists(key)) return false;
    const t = scene.textures.get(key);
    return t.has(frameName(crop, spot.stage, 0)) && t.has(frameName(crop, spot.stage, 1));
  };
  if (has(CROP_ATLAS, spot.crop)) return { texture: CROP_ATLAS, crop: spot.crop };
  if (has(CROP_ATLAS, "wheat")) return { texture: CROP_ATLAS, crop: "wheat" };
  ensureFallbackAtlas(scene);
  if (has(CROP_FALLBACK_ATLAS, spot.crop))
    return { texture: CROP_FALLBACK_ATLAS, crop: spot.crop };
  return { texture: CROP_FALLBACK_ATLAS, crop: "wheat" };
}

const W = 16,
  H = 24;
const rgb = (c: string) => [
  parseInt(c.slice(1, 3), 16),
  parseInt(c.slice(3, 5), 16),
  parseInt(c.slice(5, 7), 16),
];
const mix = (a: number[], b: number[], t: number) =>
  a.map((v, k) => Math.round(v * (1 - t) + b[k] * t));
/** Small procedural silhouettes by habit, coloured from the crop's hue, so a
 * crop with no authored art still stands in its own colour. */
function fallbackPixels(crop: Crop, stage: "green" | "ripe", frame: number) {
  const out = new Uint8ClampedArray(W * H * 4);
  const hue = rgb(crop.hue);
  const leaf = mix(hue, [92, 132, 58], 0.72).map((v) => v - 8);
  const body = stage === "ripe" ? hue : leaf;
  const lit = body.map((v) => Math.min(255, v + 22));
  const dark = body.map((v) => Math.max(0, v - 26));
  const trunk = [92, 66, 40];
  const put = (x: number, y: number, c: number[]) => {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    out.set([c[0], c[1], c[2], 255], (y * W + x) * 4);
  };
  const lean = frame ? 1 : 0;
  const base = H - 1,
    cx = 8;
  if (crop.kind === "tree") {
    for (let y = base; y > base - 8; y--) put(cx, y, trunk);
    const palm = crop.id === "date";
    if (palm) {
      for (const [dx, dy] of [
        [-4, -2], [-3, -1], [-2, 0], [-1, 0], [1, 0], [2, 0], [3, -1], [4, -2],
        [-2, -2], [-1, -3], [1, -3], [2, -2], [0, -4],
      ])
        put(cx + dx + lean, base - 8 + dy, dy < -1 ? lit : body);
    } else {
      const r = 5;
      for (let dy = -r; dy <= r; dy++)
        for (let dx = -r; dx <= r; dx++)
          if (dx * dx + dy * dy <= r * r) {
            const c = dy < -2 ? lit : dy > 2 ? dark : body;
            put(cx + dx + lean, base - 10 + dy, c);
          }
      if (stage === "ripe")
        for (const [dx, dy] of [[-2, -1], [2, 1], [0, 2], [3, -2]])
          put(cx + dx + lean, base - 10 + dy, hue.map((v) => v + 30));
    }
  } else if (crop.kind === "vine") {
    for (let y = base; y > base - 6; y--) put(cx, y, trunk);
    for (const [dx, dy] of [
      [-2, 0], [-1, 0], [0, 0], [1, 0], [2, 0], [-1, -1], [0, -1], [1, -1],
      [-2, -1], [2, -1], [0, -2],
    ])
      put(cx + dx + lean, base - 7 + dy, dy < -1 ? lit : body);
  } else if (crop.height === "tall") {
    // Two canes with leaves, taller than a person.
    for (const sx of [cx - 3, cx + 2]) {
      for (let y = base; y > base - 18; y--) put(sx + (y < base - 9 ? lean : 0), y, dark);
      for (const [dx, dy] of [[-1, -4], [1, -7], [-1, -10], [1, -13], [-1, -15]])
        put(sx + dx + (dy < -9 ? lean : 0), base + dy, body);
      put(sx + lean, base - 18, lit);
    }
  } else {
    // Three waist-high stalks with a head.
    for (const [sx, h] of [[cx - 3, 9], [cx, 11], [cx + 3, 9]]) {
      for (let y = base; y > base - h; y--) put(sx + (y < base - 5 ? lean : 0), y, dark);
      put(sx + lean, base - h, lit);
      put(sx + lean, base - h + 1, body);
      put(sx + lean, base - h + 2, body);
      put(sx - 1 + lean, base - h + 2, body);
    }
  }
  return out;
}

const drawnCrops = (Object.values(crops) as Crop[]).filter(standing);
function ensureFallbackAtlas(scene: Phaser.Scene) {
  if (scene.textures.exists(CROP_FALLBACK_ATLAS)) return;
  const cols = 4,
    rows = drawnCrops.length;
  const atlas = scene.textures.createCanvas(CROP_FALLBACK_ATLAS, cols * W, rows * H)!;
  const ctx = atlas.getContext();
  const image = ctx.createImageData(cols * W, rows * H);
  drawnCrops.forEach((crop, row) => {
    (["green", "ripe"] as const).forEach((stage, s) => {
      for (let frame = 0; frame < 2; frame++) {
        const col = s * 2 + frame;
        const p = fallbackPixels(crop, stage, frame);
        for (let y = 0; y < H; y++)
          image.data.set(
            p.subarray(y * W * 4, (y + 1) * W * 4),
            ((row * H + y) * cols * W + col * W) * 4,
          );
        atlas.add(frameName(crop.id, stage, frame), 0, col * W, row * H, W, H);
      }
    });
  });
  ctx.putImageData(image, 0, 0);
  atlas.refresh();
}

type Patch = {
  sprites: { spot: CropSpot; image: Phaser.GameObjects.Image; crop: CropId }[];
  frame: number;
  bounds: { x: number; y: number; right: number; bottom: number };
};
const managers = new WeakMap<Phaser.Scene, { patches: Set<Patch>; frame: number }>();
/** Loose images, one per plant, depth-sorted by their base like every other
 * standing sprite; a per-chunk patch record culls and sways them together. */
export function addCrops(
  scene: Phaser.Scene,
  spots: CropSpot[],
  resources: RenderResources,
) {
  if (!spots.length) return;
  let manager = managers.get(scene);
  if (!manager) {
    manager = { patches: new Set(), frame: -1 };
    managers.set(scene, manager);
    const m = manager;
    const update = (time: number) => {
      const options = (scene as unknown as { options?: { freeze?: boolean } }).options;
      const frame = options?.freeze ? 0 : Math.floor(time / 160);
      if (frame === m.frame) return;
      m.frame = frame;
      const view = scene.cameras.main.worldView;
      for (const patch of m.patches) {
        const first = patch.sprites[0]?.image;
        if (!first) continue;
        // Bounds were recorded before the chunk offset; the first sprite
        // carries the offset the stream applied.
        const dx = first.x - patch.sprites[0].spot.x,
          dy = first.y - patch.sprites[0].spot.y;
        const inView =
          !view.width ||
          (dx + patch.bounds.x < view.right + 16 &&
            dx + patch.bounds.right > view.x - 16 &&
            dy + patch.bounds.y < view.bottom + 48 &&
            dy + patch.bounds.bottom > view.y - 48);
        for (const s of patch.sprites) if (s.image.visible !== inView) s.image.setVisible(inView);
        if (inView) sway(patch, frame);
      }
    };
    scene.events.on("update", update);
    scene.events.once("shutdown", () => {
      scene.events.off("update", update);
      m.patches.clear();
      managers.delete(scene);
    });
  }
  const sprites = spots.map((spot) => {
    const { texture, crop } = resolve(scene, spot);
    const image = own(
      resources,
      scene.add
        .image(spot.x, spot.y, texture, frameName(crop, spot.stage, 0))
        .setOrigin(0.5, 1)
        .setDepth(spot.y),
    );
    return { spot, image, crop };
  });
  const patch: Patch = {
    sprites,
    frame: -1,
    bounds: {
      x: Math.min(...spots.map((s) => s.x)) - 8,
      y: Math.min(...spots.map((s) => s.y)) - H,
      right: Math.max(...spots.map((s) => s.x)) + 8,
      bottom: Math.max(...spots.map((s) => s.y)) + 4,
    },
  };
  manager.patches.add(patch);
  const m = manager;
  sprites[0].image.once("destroy", () => m.patches.delete(patch));
  sway(patch, Math.max(0, manager.frame));
  scene.game.canvas.dataset.cropCount = String(
    Number(scene.game.canvas.dataset.cropCount ?? 0) + spots.length,
  );
}
function sway(patch: Patch, frame: number) {
  if (patch.frame === frame) return;
  patch.frame = frame;
  for (const { spot, image, crop } of patch.sprites) {
    const gust = Math.sin(frame * 0.16 - spot.wx * 0.04 - spot.wy * 0.02 + spot.phase);
    const f = gust > 0.5 ? 1 : 0;
    const name = frameName(crop, spot.stage, f);
    if (image.frame.name !== name) image.setFrame(name);
  }
}

import type Phaser from "phaser";
import type { TopographySample } from "../core/topography";
import { bloomSpecies, speciesById, type BloomHabit } from "../content/ecology/flora";
import { bloomsAt, type BloomSpot } from "../content/ecology/blooms";
import { gustAt } from "./wind";
import { canvasStat } from "./canvas-stat";

export const FLOWER_ATLAS = "flowers-4";
const W = 9,
  H = 13;
const tones = {
  t: "#3a762e",
  l: "#62a83e",
  d: "#2c682c",
  x: "#28682c",
};
// Whole plants by habit, low to tall. p petal, s petal in shade, h lit petal,
// c centre, t stem, l leaf, d leaf in shade, x ground shadow.
const forms: Record<BloomHabit, string[][]> = {
  head: [
    ["..p......", ".pcs..p..", "..s..pcs.", "..t...s..", ".ltl..t..", "..tdlltl.", "..xxxxx.."],
    ["...php...", "..ppcps..", "...sss...", "....t....", "..l.t....", "..dlt.l..", "....tld..", "....t....", "...xxx..."],
    ["...php...", "..phpps..", "..pccps..", "..pssss..", "...sss...", "....t....", "....t.l..", "..l.tld..", "..dlt....", "...dt....", "....t....", "...xxx..."],
  ],
  spike: [
    ["....h....", "...hp....", "....ps...", "...pcs...", "....t....", "..l.t.l..", "...ltl...", "...xxx..."],
    ["....h....", "...hp....", "....ps...", "...pcs...", "...pps...", "...cps...", "....t....", ".l..t..l.", "..lltll..", "...dtd...", "...xxx..."],
    ["...h.....", "...p.....", "..hps....", "..pcs..h.", "..pps..p.", "..cps.hs.", "..pps.pc.", "...t..ps.", "...t...t.", ".l.t.l.t.", "..ltlltl.", "..dtd.td.", "..xxxxxx."],
  ],
  umbel: [
    ["..pp.pp..", ".pcpppcs.", "..t.t.t..", "...ttt...", "..l.t.l..", "...ltd...", "...xxx..."],
    ["..pp.pp..", ".pcpppcs.", "..sp.ps..", "..t.t.t..", "...ttt...", "....t....", "....t.l..", "..l.tld..", "..dlt....", "....t....", "...xxx..."],
    [".hp.pp.ps", "pcpppcpps", ".sp.ps.s.", "..t.t.t..", "...ttt...", "....t....", "....t....", "....t.l..", "..l.tld..", "..dlt....", "....t....", "....t....", "...xxx..."],
  ],
  mat: [
    ["..p...p..", ".pcs.pcs.", "..sldls..", ".ldlldld.", "..xxxxx.."],
    ["...p.....", "..pcs.p..", ".p.s.pcs.", "pcs.l.s..", ".sldlldl.", ".ldldldd.", "..xxxxx.."],
    ["...p.....", "..pcs.p..", ".p.s.pcs.", "pcs.p.s..", ".s.pcsl.p", "ldl.sldpc", "dldlldlds", ".xxxxxxx."],
  ],
  bell: [
    ["..tt.....", ".t..t....", "pp..t....", "pps.t.l..", "s.s.tl...", "...xxx..."],
    ["...tt....", "..t..t...", ".pp..t...", ".pps.tpp.", ".s.s.tpps", ".....ts.s", "....t....", "..l.t.l..", "...ltl...", "...xxx..."],
    ["...ttt...", "..t...t..", ".hp...t..", ".pps..t..", ".s.s.tt..", "....pt...", "...ppst..", "...s.st..", "......t..", "..l...t.l", "...l.tl..", "....ltd..", "....xxx.."],
  ],
};
const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
/** Three sway frames lean the upper half of the plant a pixel. */
function flowerPixels(kind: string, frame: number) {
  const out = new Uint8ClampedArray(W * H * 4);
  const lean = frame === 1 ? 1 : frame === 2 ? -1 : 0;
  const { petal, centre, habit, size } = speciesById.get(kind)!.look!;
  const p = hex(petal);
  const ink: Record<string, number[]> = {
    p,
    s: p.map((v) => Math.round(v * 0.74)),
    h: p.map((v) => Math.round(v + (255 - v) * 0.45)),
    c: hex(centre),
    t: hex(tones.t),
    l: hex(tones.l),
    d: hex(tones.d),
    x: hex(tones.x),
  };
  const glyph = forms[habit][size + 1];
  const top = H - glyph.length;
  glyph.forEach((row, gy) => {
    const shift = habit !== "mat" && gy < glyph.length / 2 ? lean : 0;
    for (let gx = 0; gx < row.length; gx++) {
      const x = gx + shift;
      if (row[gx] === "." || x < 0 || x >= W) continue;
      out.set([...ink[row[gx]], 255], ((top + gy) * W + x) * 4);
    }
  });
  return out;
}
export function ensureFlowerAtlas(scene: Phaser.Scene) {
  if (scene.textures.exists(FLOWER_ATLAS)) return;
  const w = 3 * W,
    h = bloomSpecies.length * H;
  const atlas = scene.textures.createCanvas(FLOWER_ATLAS, w, h)!;
  const ctx = atlas.getContext();
  const image = ctx.createImageData(w, h);
  bloomSpecies.forEach(({ id: kind }, row) => {
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

export type FlowerSpot = BloomSpot;
export function flowersAt(
  sample: TopographySample,
  x: number,
  y: number,
  ox: number,
  oy: number,
  top: number,
): FlowerSpot[] {
  return bloomsAt(sample, x, y, ox, oy, top);
}

type Patch = {
  container: Phaser.GameObjects.Container;
  sprites: { spot: FlowerSpot; image: Phaser.GameObjects.Image }[];
  frame: number;
  bounds: { x: number; y: number; right: number; bottom: number };
};
type Manager = {
  patches: Set<Patch>;
  frame: number;
  /** Cells whose blooms have been cut, and a key that changes with them. */
  cut?: (tx: number, ty: number) => boolean;
  cutKey?: unknown;
};
const managers = new WeakMap<Phaser.Scene, Manager>();
/** Hides blooms on cut cells. Cheap to call every frame: it only walks the
 * blooms when `key` changes. */
export function setBloomCut(
  scene: Phaser.Scene,
  key: unknown,
  cut: (tx: number, ty: number) => boolean,
) {
  const m = managers.get(scene);
  if (!m || m.cutKey === key) return;
  m.cut = cut;
  m.cutKey = key;
  for (const patch of m.patches) prune(patch, cut);
}
function prune(patch: Patch, cut: Manager["cut"]) {
  if (!cut) return;
  for (const { spot, image } of patch.sprites)
    image.setVisible(!cut(spot.tx, spot.ty));
}
/** The bloom drawn under a world point, if any. */
export function bloomAt(scene: Phaser.Scene, x: number, y: number) {
  const m = managers.get(scene);
  if (!m) return undefined;
  for (const patch of m.patches) {
    if (!patch.container.visible) continue;
    const b = patch.bounds;
    if (x < b.x || x > b.right || y < b.y || y > b.bottom) continue;
    for (const { spot, image } of patch.sprites)
      if (
        image.visible &&
        Math.abs(x - spot.x) <= 4 &&
        y <= spot.y + 1 &&
        y >= spot.y - 12
      )
        return spot;
  }
  return undefined;
}
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
      .image(spot.x - 4, spot.y - 11, FLOWER_ATLAS, `${spot.kind}-0`)
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
      y: Math.min(...spots.map((s) => s.y)) - 14,
      right: Math.max(...spots.map((s) => s.x)) + 4,
      bottom: Math.max(...spots.map((s) => s.y)) + 4,
    },
  };
  manager.patches.add(patch);
  prune(patch, manager.cut);
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

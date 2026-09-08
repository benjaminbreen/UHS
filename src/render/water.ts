import {
  WATER_ATLAS,
  ensureWaterAtlas,
  waterMotif,
  motifState,
  type WaterMotif,
} from "./water-motifs";
import type Phaser from "phaser";
import type { TopographyCell } from "../core/topography";
import { waterHash, waterStyle } from "./water-style";
import type { WaterEffect, WaterTileData } from "./water-raster";
export type { WaterEffect } from "./water-raster";

export function waterCanvas(tile: WaterTileData, scratch?: HTMLCanvasElement) {
  const canvas = scratch ?? document.createElement("canvas");
  if (!scratch) canvas.width = canvas.height = 16;
  const ctx = canvas.getContext("2d")!;
  const pixels = ctx.createImageData(16, 16);
  pixels.data.set(tile.pixels);
  ctx.putImageData(pixels, 0, 0);
  return canvas;
}

/** Recolor authored gravel and sand pixels; retain the existing shapes and texture. */
export function shoreTile(
  source: CanvasImageSource,
  sx: number,
  sy: number,
  cell: TopographyCell,
) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 16;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(source, sx, sy, 16, 16, 0, 0, 16, 16);
  const p = waterStyle(cell),
    pixels = ctx.getImageData(0, 0, 16, 16);
  const mapping: Record<string, string> = {
    d0ab6b: p.bank[1],
    c3b678: p.bank[0],
    e6c384: p.bank[2],
    ebd8a5: p.bank[2],
    b38b53: p.bank[0],
    "858875": p.stone[1],
    "624735": p.stone[0],
  };
  for (let i = 0; i < pixels.data.length; i += 4) {
    const key = (
      (pixels.data[i] << 16) |
      (pixels.data[i + 1] << 8) |
      pixels.data[i + 2]
    )
      .toString(16)
      .padStart(6, "0");
    const color = mapping[key];
    if (color) {
      const n = parseInt(color.slice(1), 16);
      pixels.data[i] = n >> 16;
      pixels.data[i + 1] = (n >> 8) & 255;
      pixels.data[i + 2] = n & 255;
    }
  }
  ctx.putImageData(pixels, 0, 0);
  return canvas;
}

type Patch = {
  container: Phaser.GameObjects.Container;
  graphics: Phaser.GameObjects.Graphics;
  sprites: {
    effect: WaterEffect;
    kind: WaterMotif;
    image: Phaser.GameObjects.Image;
  }[];
  effects: WaterEffect[];
  frame: number;
  active: number;
  shores: WaterEffect[];
  bounds: { x: number; y: number; right: number; bottom: number };
};
const managers = new WeakMap<
  Phaser.Scene,
  { patches: Set<Patch>; frame: number }
>();
const color = (s: string) => parseInt(s.slice(1), 16);
export function addWaterEffects(scene: Phaser.Scene, effects: WaterEffect[]) {
  if (!effects.length) return;
  ensureWaterAtlas(scene);
  let manager = managers.get(scene);
  if (!manager) {
    manager = { patches: new Set(), frame: -1 };
    managers.set(scene, manager);
    const m = manager;
    const update = (time: number) => {
      const options = (
        scene as unknown as {
          options?: { freeze?: boolean; waterAnimation?: boolean };
        }
      ).options;
      const frozen =
        options?.waterAnimation === false ||
        (options?.freeze && options.waterAnimation !== true);
      const frame = frozen ? 0 : Math.floor(time / 100);
      m.frame = frame;
      const view = scene.cameras.main.worldView;
      let visible = 0,
        count = 0,
        motifs = 0;
      const start = performance.now();
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
        count += patch.effects.length;
        drawEffects(patch, frame);
        motifs += patch.active;
      }
      scene.game.canvas.dataset.waterPatches = String(visible);
      scene.game.canvas.dataset.waterTiles = String(count);
      scene.game.canvas.dataset.waterFrame = String(frame);
      scene.game.canvas.dataset.waterMotifs = String(motifs);
      const cost = performance.now() - start;
      scene.game.canvas.dataset.waterUpdateMs = cost.toFixed(2);
      scene.game.canvas.dataset.waterUpdateMaxMs = Math.max(
        cost,
        Number(scene.game.canvas.dataset.waterUpdateMaxMs ?? 0),
      ).toFixed(2);
    };
    scene.events.on("update", update);
    scene.events.once("shutdown", () => {
      scene.events.off("update", update);
      m.patches.clear();
      managers.delete(scene);
    });
  }
  const container = scene.add.container(0, 0).setDepth(-9999);
  const graphics = scene.add.graphics();
  container.add(graphics);
  const sprites = effects.flatMap((effect) => {
    const kind = waterMotif(effect);
    if (!kind) return [];
    const tint =
      kind === "plant"
        ? effect.palette.submerged[1]
        : kind === "leaf"
          ? effect.palette.bank[1]
          : effect.palette.glint;
    const image = scene.add
      .image(effect.x, effect.y, WATER_ATLAS, `${kind}-0`)
      .setOrigin(0)
      .setTint(color(tint));
    container.add(image);
    return [{ effect, kind, image }];
  });
  const patch: Patch = {
    container,
    graphics,
    sprites,
    effects,
    frame: -1,
    active: 0,
    shores: effects.filter(
      (e) =>
        (e.shoreline ? e.shoreline.length : e.edges.length) && !e.cell.bridge,
    ),
    bounds: {
      x: Math.min(...effects.map((e) => e.x)),
      y: Math.min(...effects.map((e) => e.y)),
      right: Math.max(...effects.map((e) => e.x)) + 16,
      bottom: Math.max(...effects.map((e) => e.y)) + 16,
    },
  };
  manager.patches.add(patch);
  container.once("destroy", () => manager!.patches.delete(patch));
  drawEffects(patch, manager.frame < 0 ? 0 : manager.frame);
  return container;
}
function drawEffects(patch: Patch, frame: number) {
  if (patch.frame === frame) return;
  patch.frame = frame;
  const g = patch.graphics;
  g.clear();
  patch.active = 0;
  for (const { effect, kind, image } of patch.sprites) {
    const state = motifState(effect, kind, frame);
    if (state.alpha > 0) patch.active++;
    image
      .setVisible(state.alpha > 0)
      .setAlpha(state.alpha)
      .setPosition(effect.x + state.dx, effect.y + state.dy)
      .setFrame(`${kind}-${state.frame}`);
  }
  for (const e of patch.shores) {
    const { x, y, gx, gy, cell, palette, edges } = e;
    // Suppress the entire crossing tile so foam/current never paint over the deck.
    if (cell.bridge) continue;
    const kind = cell.waterVisual?.kind ?? "river";
    if (e.shoreline) {
      // March a sparse broken wash through a precomputed distance band. The
      // bank pixel and the moving water use exactly the same native-pixel contour.
      for (const p of e.shoreline) {
        const wx = gx + p.x,
          wy = gy + p.y;
        const group = waterHash(Math.floor(wx / 12), Math.floor(wy / 12), 383);
        const sea = kind === "sea";
        if (group < (sea ? 0.43 : 0.79)) continue;
        const phase = ((frame + Math.floor(group * 60)) % 80) / 80;
        if (phase > 0.68) continue;
        const life = Math.sin((phase / 0.68) * Math.PI);
        const target = -0.1 - (1 - life) * (sea ? 0.26 : 0.08);
        if (Math.abs(p.distance - target) > 0.045) continue;
        g.fillStyle(
          color(
            cell.waterVisual?.frozenMargin
              ? "#d8e7e4"
              : sea
                ? palette.foam
                : palette.glint,
          ),
          life * (sea ? 0.65 : 0.25),
        );
        g.fillRect(x + p.x, y + p.y, 1, 1);
      }
      continue;
    }
    // Two long broken wavelets with substantial quiet gaps; no flashing outline.
    for (const { dx, dy, rocky } of edges) {
      for (let segment = 0; segment < 2; segment++) {
        const u = segment * 8;
        const wx = gx + (dx ? (dx > 0 ? 15 : 0) : u),
          wy = gy + (dy ? (dy > 0 ? 15 : 0) : u);
        const noise = waterHash(Math.floor(wx / 24), Math.floor(wy / 24), 83);
        const sea = kind === "sea";
        if (noise < (sea ? 0.36 : 0.72)) continue;
        const phase =
          (((frame + Math.floor(noise * 24) + Math.floor((wx + wy) / 48)) %
            80) +
            80) %
          80;
        if (phase >= 56) continue;
        const life = phase / 56,
          wash = Math.sin(life * Math.PI);
        const inset = sea ? 2 + Math.round((1 - wash) * (rocky ? 2 : 4)) : 2;
        const alpha = wash * wash * (sea ? (rocky ? 0.86 : 0.67) : 0.22);
        const mark = (
          along: number,
          offset: number,
          width: number,
          tone: number,
        ) => {
          const px = dx === 1 ? 15 - offset : dx === -1 ? offset : along;
          const py = dy === 1 ? 15 - offset : dy === -1 ? offset : along;
          g.fillStyle(color(sea ? palette.foam : palette.glint), alpha * tone);
          g.fillRect(x + px, y + py, dx ? 1 : width, dy ? 1 : width);
        };
        mark(u + 1, inset, 3, 1);
        mark(u + 4, inset + 1, 2, 0.7);
        if (sea && wash > 0.75 && noise > 0.7) mark(u + 5, inset + 2, 1, 0.6);
      }
    }
    if (cell.waterVisual?.frozenMargin && edges.length) {
      g.fillStyle(0xd8e7e4, 0.7);
      for (const { dx, dy } of edges) {
        const px = dx === 1 ? 14 : dx === -1 ? 1 : 5;
        const py = dy === 1 ? 14 : dy === -1 ? 1 : 5;
        g.fillRect(x + px, y + py, dx ? 1 : 6, dy ? 1 : 6);
      }
    }
  }
}

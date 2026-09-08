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
  graphics: Phaser.GameObjects.Graphics;
  effects: WaterEffect[];
  frame: number;
  bounds: { x: number; y: number; right: number; bottom: number };
};
const managers = new WeakMap<
  Phaser.Scene,
  { patches: Set<Patch>; frame: number }
>();
const color = (s: string) => parseInt(s.slice(1), 16);
export function addWaterEffects(scene: Phaser.Scene, effects: WaterEffect[]) {
  if (!effects.length) return;
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
        count = 0;
      const start = performance.now();
      for (const patch of m.patches) {
        const g = patch.graphics;
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
      }
      scene.game.canvas.dataset.waterPatches = String(visible);
      scene.game.canvas.dataset.waterTiles = String(count);
      scene.game.canvas.dataset.waterFrame = String(frame);
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
  const graphics = scene.add.graphics().setDepth(-9999);
  const patch: Patch = {
    graphics,
    effects,
    frame: -1,
    bounds: {
      x: Math.min(...effects.map((e) => e.x)),
      y: Math.min(...effects.map((e) => e.y)),
      right: Math.max(...effects.map((e) => e.x)) + 16,
      bottom: Math.max(...effects.map((e) => e.y)) + 16,
    },
  };
  manager.patches.add(patch);
  graphics.once("destroy", () => manager!.patches.delete(patch));
  drawEffects(patch, manager.frame < 0 ? 0 : manager.frame);
}
function drawEffects(patch: Patch, frame: number) {
  if (patch.frame === frame) return;
  patch.frame = frame;
  const g = patch.graphics;
  g.clear();
  for (const e of patch.effects) {
    const { x, y, gx, gy, cell, palette, edges } = e;
    // Suppress the entire crossing tile so foam/current never paint over the deck.
    if (cell.bridge) continue;
    const kind = cell.waterVisual?.kind ?? "river";
    const seed = waterHash(gx, gy, 71),
      phase = (frame + Math.floor(waterHash(gx, gy, 74) * 56)) % 56;
    // Surface accents drift within their owning water tile, fading before reset.
    if (seed > (kind === "sea" ? 0.8 : 0.55) && phase < 40) {
      const life = phase / 40,
        strength = Math.sin(life * Math.PI);
      const flow = cell.waterVisual?.flow ?? [0, 1];
      const len = Math.hypot(...flow) || 1;
      const speed = cell.waterDepth === "shallow" ? 4 : 7;
      const dx =
        kind === "river" ? (flow[0] / len) * speed : kind === "sea" ? 2 : 0.6;
      const dy =
        kind === "river" ? (flow[1] / len) * speed : kind === "sea" ? 4 : 0.5;
      const px = Math.round(3 + waterHash(gx, gy, 72) * 3 + (life - 0.5) * dx);
      const py = Math.round(5 + waterHash(gx, gy, 73) * 4 + (life - 0.5) * dy);
      g.fillStyle(color(palette.glint), strength * (seed > 0.94 ? 0.95 : 0.58));
      g.fillRect(x + px, y + py, kind === "sea" ? 8 : 4, 1);
      if (seed > 0.83) g.fillRect(x + px - 2, y + py + 2, 3, 1);
    }
    // Shore-following broken wavelets: gradual approach, bright crest, then retreat.
    for (const { dx, dy, rocky } of edges) {
      for (let segment = 0; segment < 4; segment++) {
        const u = segment * 4;
        const wx = gx + (dx ? (dx > 0 ? 15 : 0) : u);
        const wy = gy + (dy ? (dy > 0 ? 15 : 0) : u);
        const noise = waterHash(Math.floor(wx / 12), Math.floor(wy / 12), 83);
        const cycle =
          ((((frame + Math.floor(noise * 15) + Math.floor((wx + wy) / 32)) %
            48) +
            48) %
            48) /
          48;
        const wash = Math.sin(cycle * Math.PI);
        const sea = kind === "sea";
        if (noise < (sea ? 0.13 : 0.35)) continue;
        const inset = sea ? 2 + Math.round((1 - wash) * (rocky ? 2 : 5)) : 2;
        const alpha = sea
          ? 0.18 + Math.pow(wash, 3) * (rocky ? 0.8 : 0.63)
          : 0.12 + wash * 0.19;
        g.fillStyle(color(sea ? palette.foam : palette.glint), alpha);
        const px = dx === 1 ? 15 - inset : dx === -1 ? inset : u;
        const py = dy === 1 ? 15 - inset : dy === -1 ? inset : u;
        g.fillRect(x + px, y + py, dx ? 1 : 3, dy ? 1 : 3);
        if (sea && wash > 0.78)
          g.fillRect(x + px - dx, y + py - dy, dx ? 1 : 2, dy ? 1 : 2);
      }
    }
    const depth = -(cell.waterVisual?.distance ?? -3);
    if (
      kind === "river" &&
      depth > 0.4 &&
      depth < 3.8 &&
      waterHash(gx, gy, 44) > 0.8
    ) {
      const sx = 4 + Math.floor(waterHash(gx, gy, 45) * 7),
        sy = 4 + Math.floor(waterHash(gx, gy, 46) * 7);
      const flow = cell.waterVisual?.flow ?? [0, 1],
        length = Math.hypot(...flow) || 1;
      const angle = frame * 0.14 + seed * Math.PI * 2;
      const ex = Math.round(
        Math.max(
          1,
          Math.min(13, sx + (flow[0] / length) * 3 + Math.cos(angle) * 2),
        ),
      );
      const ey = Math.round(
        Math.max(
          1,
          Math.min(14, sy + (flow[1] / length) * 3 + Math.sin(angle) * 1.5),
        ),
      );
      g.fillStyle(color(palette.glint), 0.26);
      g.fillRect(x + ex, y + ey, 2, 1);
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

import type Phaser from "phaser";
import type { TopographySample } from "../core/topography";
import style from "./generated/topography-style.json";
const R = style.rise,
  B = 6;
const colors = style.palette.map((c) => [
  parseInt(c.slice(1, 3), 16),
  parseInt(c.slice(3, 5), 16),
  parseInt(c.slice(5, 7), 16),
  255,
]);
export type ContourLayer = {
  row: number;
  tier: number;
  x: number;
  y: number;
  width: number;
  height: number;
  pixels: Uint8ClampedArray;
};
/** Rasterize the UNION of elevated ground, swept down to the lower surface.
 * No tile owns a decorative end cap: touching faces share the same silhouette,
 * bevel and world-coordinate earth texture, including concave/convex turns. */
export function rasterTerrainContours(
  sample: TopographySample,
  width: number,
  height: number,
): ContourLayer[] {
  const layers = new Map<string, ContourLayer>(),
    w = width * 16 + B * 2,
    lh = 16 + R * 3 + B * 2;
  const high = (x: number, y: number, tier: number) => {
    const c = sample(Math.max(0, Math.min(width - 1, x)), y);
    return !!c && c.height >= tier && !c.bridge;
  };
  // Extend the upper surface outward only: the original ground remains fully
  // covered. One mask owns the lip and face, including their corner joins.
  const inside = (px: number, py: number, tier: number) => {
    const x = Math.floor(px / 16),
      y = Math.floor((py + tier * R) / 16);
    if (high(x, y, tier)) return true;
    const spread = 1 + Math.round((Math.sin(px * 0.19 + py * 0.13) + 1) * 0.5);
    return [
      [spread, 0],
      [-spread, 0],
      [0, spread],
      [0, -spread],
    ].some(([dx, dy]) =>
      high(
        Math.floor((px + dx) / 16),
        Math.floor((py + dy + tier * R) / 16),
        tier,
      ),
    );
  };
  const offsets = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
    [0.7, 0.7],
    [-0.7, 0.7],
    [0.7, -0.7],
    [-0.7, -0.7],
  ];
  const paint = (
    row: number,
    tier: number,
    px: number,
    py: number,
    color: number,
  ) => {
    const key = `${row}:${tier}`;
    let layer = layers.get(key);
    if (!layer) {
      layer = {
        row,
        tier,
        x: -B,
        y: row * 16 - R * 3 - B,
        width: w,
        height: lh,
        pixels: new Uint8ClampedArray(w * lh * 4),
      };
      layers.set(key, layer);
    }
    const ix = px + B,
      iy = py - layer.y;
    if (ix < 0 || iy < 0 || ix >= w || iy >= lh) return;
    layer.pixels.set(colors[color], (iy * w + ix) * 4);
  };
  for (let tier = 1; tier <= 3; tier++)
    for (let py = -48 - R * 3; py < (height + 4) * 16; py++)
      for (let px = -B; px < width * 16 + B; px++) {
        const xx = px + 0.5,
          yy = py + 0.5;
        const onTop = inside(xx, yy, tier);
        let row = Math.floor((yy + tier * R) / 16),
          ownerX = Math.floor(xx / 16);
        let near = 99;
        // One shared rounded bevel, with a subtle 0–1px change in thickness.
        const bevel =
          5 + ((Math.floor(px / 5) + Math.floor(py / 7)) % 5 === 0 ? 1 : 0);
        if (onTop) {
          if (sample(ownerX, row)?.height !== tier) {
            let owner: [number, number] | undefined;
            for (const [dx, dy] of [
              [0, -1],
              [-1, 0],
              [1, 0],
              [0, 1],
            ])
              if (sample(ownerX + dx, row + dy)?.height === tier)
                owner = [ownerX + dx, row + dy];
            if (!owner) continue;
            [ownerX, row] = owner;
          }
          for (let d = 1; d <= B; d++)
            if (
              offsets.some(
                ([dx, dy]) => !inside(xx + dx * d, yy + dy * d, tier),
              )
            ) {
              near = d;
              break;
            }
          if (near > 3) continue;
        } else {
          let found = false;
          row = -Infinity;
          for (
            let cy = Math.floor((yy + (tier - 1) * R - B) / 16);
            cy <= Math.floor((yy + tier * R + B) / 16);
            cy++
          )
            for (
              let cx = Math.floor((xx - B) / 16);
              cx <= Math.floor((xx + B) / 16);
              cx++
            ) {
              if (!high(cx, cy, tier)) continue;
              const dx = Math.max(cx * 16 - xx, 0, xx - (cx + 1) * 16);
              const dy = Math.max(
                cy * 16 - tier * R - yy,
                0,
                yy - ((cy + 1) * 16 - (tier - 1) * R),
              );
              if (dx * dx + dy * dy <= bevel * bevel) {
                found = true;
                if (cy > row) {
                  row = cy;
                  ownerX = cx;
                }
              }
            }
          if (!found) continue;
          for (let d = 1; d <= B; d++)
            if (
              offsets.some(([dx, dy]) => inside(xx + dx * d, yy + dy * d, tier))
            ) {
              near = d;
              break;
            }
        }
        const dry = sample(ownerX, row)?.surface === "dry";
        // A continuous turf cap over vertically sculpted earth. The short
        // repeating strata are anchored in world space, not individual tiles.
        const mod = (n: number, m: number) => ((n % m) + m) % m;
        const column = Math.floor(px / 9);
        const faceY = py - ((row + 1) * 16 - tier * R);
        const seam = mod(
          px + Math.floor(Math.sin(py * 0.23 + column) * 1.3),
          9,
        );
        let color: number;
        if (onTop) color = near === 1 ? (dry ? 10 : 6) : dry ? 9 : 4;
        else if (near === 1) color = dry ? 10 : 7;
        else if (near === 2) color = dry ? 9 : 5;
        else {
          color = seam < 3 ? 15 : 16;
          // Recesses taper; warm shadows stay beneath the cap and at the foot.
          if (seam === 0 && faceY > 3) color = 14;
          if (faceY > R - 3 && seam < 5) color = 15;
          if (near === 3) color = 15;
          if (faceY > R - 2) color = seam < 4 ? 14 : 15;
          if (seam >= 3 && seam <= 5 && mod(py + column * 3, 13) < 2)
            color = 17;
        }
        paint(row, tier, px, py, color);
      }
  return [...layers.values()];
}
export function drawTerrainContours(
  scene: Phaser.Scene,
  sample: TopographySample,
  width: number,
  height: number,
) {
  for (const layer of rasterTerrainContours(sample, width, height)) {
    const key = `contour-${layer.row}-${layer.tier}`;
    const texture = scene.textures.createCanvas(
      key,
      layer.width,
      layer.height,
    )!;
    const context = texture.getContext();
    const data = context.createImageData(layer.width, layer.height);
    data.data.set(layer.pixels);
    context.putImageData(data, 0, 0);
    texture.refresh();
    scene.add
      .image(layer.x, layer.y, key)
      .setOrigin(0)
      .setDepth(layer.row * 16 + 1.5 + layer.tier * 0.01);
  }
}

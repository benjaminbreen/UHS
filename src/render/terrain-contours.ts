import { own, renderResources, type RenderResources } from "./resources";
import type Phaser from "phaser";
import type { TopographySample } from "../core/topography";
import type { TerrainRegion } from "./terrain-region";
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
type Cover = { x: number; y: number; width: number; height: number };
/** Rasterize the UNION of elevated ground, swept down to the lower surface.
 * No tile owns a decorative end cap: touching faces share the same silhouette,
 * bevel and world-coordinate earth texture, including concave/convex turns. */
export function rasterTerrainContours(
  sample: TopographySample,
  width: number,
  height: number,
  covers: readonly Cover[] = [],
  region?: TerrainRegion,
): ContourLayer[] {
  const layers = new Map<string, ContourLayer>(),
    w = width * 16 + B * 2,
    lh = 16 + R * 3 + B * 2;
  const pad = 8,
    stride = width + pad * 2;
  const grid = new Int8Array(stride * (height + pad * 2));
  grid.fill(-1);
  for (let y = -pad; y < height + pad; y++)
    for (let x = -pad; x < width + pad; x++) {
      const c = sample(region ? x : Math.max(0, Math.min(width - 1, x)), y);
      grid[(y + pad) * stride + x + pad] = c && !c.bridge ? c.height : -1;
    }
  const high = (x: number, y: number, tier: number) =>
    x >= -pad &&
    x < width + pad &&
    y >= -pad &&
    y < height + pad &&
    grid[(y + pad) * stride + x + pad] >= tier;
  // Raster work is restricted to exposed edges. Interior plateau pixels need
  // no distance queries or earth texture, regardless of viewport size.
  const spans = new Map<number, Map<number, [number, number][]>>();
  for (let tier = 1; tier <= 3; tier++) {
    const rows = new Map<number, [number, number][]>();
    spans.set(tier, rows);
    for (let y = -4; y < height + 4; y++)
      for (let x = region ? -1 : 0; x < width + (region ? 1 : 0); x++) {
        if (
          !high(x, y, tier) ||
          [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1],
          ].every(([dx, dy]) => high(x + dx, y + dy, tier))
        )
          continue;
        const left = Math.max(-B, x * 16 - B),
          right = Math.min(width * 16 + B, (x + 1) * 16 + B);
        for (
          let py = y * 16 - tier * R - B;
          py < (y + 1) * 16 - (tier - 1) * R + B;
          py++
        ) {
          const row = rows.get(py) ?? [];
          row.push([left, right]);
          rows.set(py, row);
        }
      }
    for (const [py, row] of rows) {
      row.sort((a, b) => a[0] - b[0]);
      const merged: [number, number][] = [];
      for (const pair of row) {
        const last = merged.at(-1);
        if (last && pair[0] <= last[1]) last[1] = Math.max(last[1], pair[1]);
        else merged.push([...pair]);
      }
      rows.set(py, merged);
    }
  }
  // Extend the upper surface outward only: the original ground remains fully
  // covered. One mask owns the lip and face, including their corner joins.
  const inside = (px: number, py: number, tier: number) => {
    const x = Math.floor(px / 16),
      y = Math.floor((py + tier * R) / 16);
    if (high(x, y, tier)) return true;
    const spread =
      1 +
      Math.round(
        (Math.sin(
          (px + (region?.x ?? 0) * 16) * 0.19 +
            (py + (region?.y ?? 0) * 16) * 0.13,
        ) +
          1) *
          0.5,
      );
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
    if (region && (row < 0 || row >= height || px < 0 || px >= width * 16))
      return;
    // Suspended decks cover bank bevels at their abutments. Clip the complete
    // span, including the small overlap onto dry ground, before depth sorting.
    if (
      covers.some(
        (c) =>
          px >= c.x && px < c.x + c.width && py >= c.y && py < c.y + c.height,
      )
    )
      return;
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
    for (const [py, intervals] of spans.get(tier)!)
      for (const [left, right] of intervals)
        for (let px = left; px < right; px++) {
          const worldX = px + (region?.x ?? 0) * 16,
            worldY = py + (region?.y ?? 0) * 16;
          const xx = px + 0.5,
            yy = py + 0.5;
          const onTop = inside(xx, yy, tier);
          let row = Math.floor((yy + tier * R) / 16),
            ownerX = Math.floor(xx / 16);
          let near = 99;
          // One shared rounded bevel, with a subtle 0–1px change in thickness.
          const bevel =
            5 +
            ((Math.floor(worldX / 5) + Math.floor(worldY / 7)) % 5 === 0
              ? 1
              : 0);
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
                offsets.some(([dx, dy]) =>
                  inside(xx + dx * d, yy + dy * d, tier),
                )
              ) {
                near = d;
                break;
              }
          }
          const surface = sample(ownerX, row)?.surface;
          const dry = surface === "dry" || surface === "sand";
          const snow = surface === "snow";
          // A continuous turf cap over vertically sculpted earth. The short
          // repeating strata are anchored in world space, not individual tiles.
          const mod = (n: number, m: number) => ((n % m) + m) % m;
          const column = Math.floor(worldX / 9);
          const faceY = py - ((row + 1) * 16 - tier * R);
          const seam = mod(
            worldX + Math.floor(Math.sin(worldY * 0.23 + column) * 1.3),
            9,
          );
          let color: number;
          if (onTop)
            color = snow
              ? near === 1
                ? 26
                : 25
              : surface === "sand"
                ? near === 1
                  ? 19
                  : 18
                : near === 1
                  ? dry
                    ? 10
                    : 6
                  : dry
                    ? 9
                    : 4;
          else if (near === 1) color = snow ? 26 : dry ? 10 : 7;
          else if (near === 2) color = snow ? 24 : dry ? 9 : 5;
          else {
            color = faceY > 6 ? (seam < 3 ? 14 : 15) : seam < 3 ? 15 : 16;
            // Recesses taper; warm shadows stay beneath the cap and at the foot.
            if (seam === 0 && faceY > 3) color = 14;
            if (faceY > R - 3 && seam < 5) color = 15;
            if (near === 3) color = 15;
            if (faceY > R - 2) color = seam < 4 ? 14 : 15;
            if (seam >= 3 && seam <= 5 && mod(worldY + column * 3, 13) < 2)
              color = 17;
          }
          paint(row, tier, px, py, color);
        }
  // Tight textures avoid uploading a map-wide transparent rectangle for each
  // short contour row. Retain the same world origin and painter depth.
  return [...layers.values()].map((layer) => {
    let left = layer.width,
      right = 0,
      top = layer.height,
      bottom = 0;
    for (let y = 0; y < layer.height; y++)
      for (let x = 0; x < layer.width; x++)
        if (layer.pixels[(y * layer.width + x) * 4 + 3]) {
          left = Math.min(left, x);
          right = Math.max(right, x);
          top = Math.min(top, y);
          bottom = Math.max(bottom, y);
        }
    const width = right - left + 1,
      height = bottom - top + 1,
      pixels = new Uint8ClampedArray(width * height * 4);
    for (let y = 0; y < height; y++)
      pixels.set(
        layer.pixels.subarray(
          ((y + top) * layer.width + left) * 4,
          ((y + top) * layer.width + right + 1) * 4,
        ),
        y * width * 4,
      );
    return {
      ...layer,
      x: layer.x + left,
      y: layer.y + top,
      width,
      height,
      pixels,
    };
  });
}
export function drawTerrainContours(
  scene: Phaser.Scene,
  sample: TopographySample,
  width: number,
  height: number,
  covers: readonly Cover[] = [],
) {
  drawContourLayers(
    scene,
    rasterTerrainContours(sample, width, height, covers),
  );
}
export function drawContourLayers(
  scene: Phaser.Scene,
  layers: ContourLayer[],
  prefix = "contour",
  resources: RenderResources = renderResources(),
) {
  for (const layer of layers) {
    const key = `${prefix}-${layer.row}-${layer.tier}`;
    resources.textures.push(key);
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
    own(
      resources,
      scene.add
        .image(layer.x + 3, layer.y + 4, key)
        .setOrigin(0)
        .setTint(0x30452b)
        .setAlpha(0.25)
        .setDepth(layer.row * 16 + 0.8),
    );
    own(
      resources,
      scene.add
        .image(layer.x, layer.y, key)
        .setOrigin(0)
        .setDepth(layer.row * 16 + 1.5 + layer.tier * 0.01),
    );
  }
}

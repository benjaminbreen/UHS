import { snowCover, snowPixel } from "./snow-cover";
import {
  addPixelTexture,
  own,
  renderResources,
  type RenderResources,
} from "./resources";
import type Phaser from "phaser";
import type { TopographyCell, TopographySample } from "../core/topography";
import type { TerrainRegion } from "./terrain-region";
import type { GroundTileData } from "./habitat-raster";
import type { WaterTileData } from "./water-raster";
import { paintedGround } from "./material-edges";
import { contourSurfaces } from "./contour-surfaces";
import {
  bankFor,
  contourNoise,
  groundStyle,
  styledBankPixel,
  toneBank,
  type BankStyle,
  type GroundStyle,
} from "./ground-style";
import { banks, soils } from "./habitat-raster";
import { defaultGrassArt } from "../content/graphics/grass-art";
import { kitPalette, kitSoil, pickKit } from "./ground-kit";
import {
  paletteKey,
  type Colorway,
  type Ecology,
} from "../content/ecology/profiles";
import { TERRAIN_RISE } from "./terrain-projection";
import { caveAt, cliffPixel, rockRamp, talusPixel, copingColor, hasParapet, tuftHeight, tuftPixel, wallPixel, type Stain } from "./edge-faces";
import { rockAt } from "../content/geography/rock";
import { pavingGrade, pavingStonePixel } from "./paving-stones";
import style from "./generated/topography-style.json" with { type: "json" };
const B = 6;
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
  /** Plain ground rather than a bank: no drop shadow copy. */
  flat?: boolean;
};
export type TerrainReceivers = {
  x: number;
  y: number;
  width: number;
  height: number;
  tiers: Int8Array;
  rows: Int16Array;
  /** Smoothed heights before projection, indexed in world pixels. */
  surfaceTiers: Int8Array;
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
  groundTiles?: readonly GroundTileData[],
  rims?: number[],
  receivers?: Partial<TerrainReceivers>,
  waterTiles?: readonly WaterTileData[],
): ContourLayer[] {
  const R = TERRAIN_RISE;
  const styled = groundStyle();
  if (styled)
    return rasterWallContours(
      sample,
      width,
      height,
      covers,
      region,
      styled,
      groundTiles,
      rims,
      receivers,
      waterTiles,
    );
  const layers = new Map<string, ContourLayer>(),
    w = width * 16 + B * 2;
  // Sized per tier: a map ten steps deep would otherwise allocate the tallest
  // possible strip for every row, most of it empty.
  const layerHeight = (tier: number) => 16 + tier * R + B * 2;
  const pad = 8,
    stride = width + pad * 2;
  const grid = new Int8Array(stride * (height + pad * 2));
  grid.fill(-1);
  for (let y = -pad; y < height + pad; y++)
    for (let x = -pad; x < width + pad; x++) {
      const c = sample(region ? x : Math.max(0, Math.min(width - 1, x)), y);
      grid[(y + pad) * stride + x + pad] = c && !c.bridge ? c.height : -1;
    }
  let maxTier = 0;
  for (let i = 0; i < grid.length; i++)
    if (grid[i] > maxTier) maxTier = grid[i];
  const high = (x: number, y: number, tier: number) =>
    x >= -pad &&
    x < width + pad &&
    y >= -pad &&
    y < height + pad &&
    grid[(y + pad) * stride + x + pad] >= tier;
  // Raster work is restricted to exposed edges. Interior plateau pixels need
  // no distance queries or earth texture, regardless of viewport size.
  const spans = new Map<number, Map<number, [number, number][]>>();
  for (let tier = 1; tier <= maxTier; tier++) {
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
      const lh = layerHeight(tier);
      layer = {
        row,
        tier,
        x: -B,
        y: row * 16 - tier * R - B,
        width: w,
        height: lh,
        pixels: new Uint8ClampedArray(w * lh * 4),
      };
      layers.set(key, layer);
    }
    const ix = px + B,
      iy = py - layer.y;
    if (ix < 0 || iy < 0 || ix >= w || iy >= layer.height) return;
    layer.pixels.set(colors[color], (iy * w + ix) * 4);
  };
  for (let tier = 1; tier <= maxTier; tier++)
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
  return cropLayers([...layers.values()].map((layer) => ({ layer })));
}

/** Tight textures avoid uploading a map-wide transparent rectangle for each
 * short contour row. Retain the same world origin and painter depth. */
function cropLayers(
  all: { layer: ContourLayer; box?: [number, number, number, number] }[],
): ContourLayer[] {
  const cropped: ContourLayer[] = [];
  for (const { layer, box } of all) {
    let [left, right, top, bottom] = box ?? [layer.width, 0, layer.height, 0];
    // Without a recorded box the layer has to be scanned, which is what the
    // legacy rasteriser still needs.
    if (!box)
      for (let y = 0; y < layer.height; y++)
        for (let x = 0; x < layer.width; x++)
          if (layer.pixels[(y * layer.width + x) * 4 + 3]) {
            left = Math.min(left, x);
            right = Math.max(right, x);
            top = Math.min(top, y);
            bottom = Math.max(bottom, y);
          }
    if (right < left || bottom < top) continue;
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
    cropped.push({
      ...layer,
      x: layer.x + left,
      y: layer.y + top,
      width,
      height,
      pixels,
    });
  }
  return cropped;
}

export function wallOwnsCell(sample: TopographySample, x: number, y: number) {
  const c = sample(x, y);
  // Only cells with a rasterised habitat tile can be redrawn here: there is
  // nothing to copy the surface texture from otherwise.
  // Water above the valley floor (a creek on its terrace) is drawn here too,
  // from its own rasterised tile.
  // Raised water still needs a height change nearby: away from one the wall
  // pass paints nothing, and claiming the cell only suppressed its water tile.
  const raisedWater = !!c && c.surface === "water" && c.height > 0;
  if (
    !c ||
    (!raisedWater && (!paintedGround(c) || c.feature === "paving" || c.field))
  )
    return false;
  for (let dy = -1; dy <= 1; dy++)
    for (let dx = -1; dx <= 1; dx++) {
      const n = sample(x + dx, y + dy);
      if (n && n.height !== c.height) return true;
    }
  return false;
}

function rasterWallContours(
  sample: TopographySample,
  width: number,
  height: number,
  covers: readonly Cover[],
  region: TerrainRegion | undefined,
  style: GroundStyle,
  groundTiles: readonly GroundTileData[] = [],
  rims?: number[],
  receivers?: Partial<TerrainReceivers>,
  waterTiles?: readonly WaterTileData[],
): ContourLayer[] {
  const { bank, contour } = style;
  const PX = receivers ? 128 : 16,
    PY = receivers ? 128 : 64;
  const FW = width * 16 + PX * 2,
    FH = height * 16 + PY * 2;

  // Cell tiers first: the interpolation below reads each of them four times.
  const cpad = receivers ? 10 : 4,
    cstride = width + cpad * 2;
  const tiers = new Int8Array(cstride * (height + cpad * 2));
  for (let y = -cpad; y < height + cpad; y++)
    for (let x = -cpad; x < width + cpad; x++) {
      const c = sample(region ? x : Math.max(0, Math.min(width - 1, x)), y);
      tiers[(y + cpad) * cstride + x + cpad] = c && !c.bridge ? c.height : 0;
    }
  const owns = new Uint8Array(cstride * (height + cpad * 2));
  for (let y = -cpad; y < height + cpad; y++)
    for (let x = -cpad; x < width + cpad; x++)
      owns[(y + cpad) * cstride + x + cpad] = wallOwnsCell(
        (a, b) => sample(region ? a : Math.max(0, Math.min(width - 1, a)), b),
        x,
        y,
      )
        ? 1
        : 0;
  const rampNear = new Uint8Array(cstride * (height + cpad * 2));
  for (let y = -cpad; y < height + cpad; y++)
    for (let x = -cpad; x < width + cpad; x++)
      if (sample(region ? x : Math.max(0, Math.min(width - 1, x)), y)?.ramp)
        for (let dy = -1; dy <= 1; dy++)
          for (let dx = -1; dx <= 1; dx++) {
            const i = (y + dy + cpad) * cstride + x + dx + cpad;
            if (i >= 0 && i < rampNear.length) rampNear[i] = 1;
          }
  const ownsAt = (x: number, y: number) =>
    owns[
      Math.max(0, Math.min(height + cpad * 2 - 1, y + cpad)) * cstride +
        Math.max(0, Math.min(cstride - 1, x + cpad))
    ] === 1;
  const tierAt = (x: number, y: number) =>
    tiers[
      Math.max(0, Math.min(height + cpad * 2 - 1, y + cpad)) * cstride +
        Math.max(0, Math.min(cstride - 1, x + cpad))
    ];

  let maxTier = 0;
  for (let i = 0; i < tiers.length; i++)
    if (tiers[i] > maxTier) maxTier = tiers[i];
  const R = TERRAIN_RISE;
  const ox = (region?.x ?? 0) * 16,
    oy = (region?.y ?? 0) * 16;
  const ease = (t: number) => t * t * (3 - 2 * t);
  const levels = new Int8Array(FW * FH);
  // Only the edge zone the wall pass owns leaves its tier, so the noise and
  // interpolation below are spent there alone; everywhere else the level is
  // the cell's own, and a flat chunk costs nothing.
  for (let i = 0; i < FH; i++)
    for (let j = 0; j < FW; j++) {
      const px = j - PX,
        py = i - PY;
      const cx = Math.floor(px / 16),
        cy = Math.floor(py / 16);
      if (!ownsAt(cx, cy)) {
        levels[i * FW + j] = tierAt(cx, cy);
        continue;
      }
      // A ramp is a square cell joined flush to its neighbours; bending the
      // rim beside it opens gaps at the joint.
      const warp = rampNear[
        Math.max(0, Math.min(height + cpad * 2 - 1, cy + cpad)) * cstride +
          Math.max(0, Math.min(cstride - 1, cx + cpad))
      ]
        ? 0
        : (contour.warp ?? 0);
      const u =
          (px + (contourNoise(px + ox, py + oy, 23, 131) - 0.5) * 2 * warp - 8) /
          16,
        v =
          (py + (contourNoise(px + ox, py + oy, 23, 137) - 0.5) * 2 * warp - 8) /
          16;
      const x0 = Math.floor(u),
        y0 = Math.floor(v);
      const a = tierAt(x0, y0),
        b = tierAt(x0 + 1, y0),
        c = tierAt(x0, y0 + 1),
        d = tierAt(x0 + 1, y0 + 1);
      const fx = ease(u - x0),
        fy = ease(v - y0);
      const h =
        (a + (b - a) * fx) * (1 - fy) +
        (c + (d - c) * fx) * fy +
        (contourNoise(px + ox, py + oy, contour.scale) - 0.5) * contour.wobble;
      // The nearest corner's tier, not the nearest tier: a drop of several
      // tiers is one cliff on one curved line, where rounding would fan its
      // steps out into a stack of ledges a few pixels apart.
      let near = a;
      for (const t of [b, c, d]) if (Math.abs(t - h) < Math.abs(near - h)) near = t;
      levels[i * FW + j] = Math.max(0, Math.min(maxTier, near));
    }

  // Wobble on its own throws off single-pixel islands that read as artefacts.
  if (contour.smoothing) {
    const src = levels.slice();
    const counts = new Int32Array(maxTier + 1);
    const r = contour.smoothing;
    for (let i = 0; i < FH; i++)
      for (let j = 0; j < FW; j++) {
        const cx = Math.floor((j - PX) / 16),
          cy = Math.floor((i - PY) / 16);
        if (!ownsAt(cx, cy)) {
          levels[i * FW + j] = tierAt(cx, cy);
          continue;
        }
        counts.fill(0);
        for (let dy = -r; dy <= r; dy++)
          for (let dx = -r; dx <= r; dx++)
            counts[
              src[
                Math.max(0, Math.min(FH - 1, i + dy)) * FW +
                  Math.max(0, Math.min(FW - 1, j + dx))
              ]
            ]++;
        let best = 0;
        for (let t = 1; t <= maxTier; t++)
          if (counts[t] > counts[best]) best = t;
        levels[i * FW + j] = best;
      }
  }
  const lvl = (px: number, py: number) =>
    levels[
      Math.max(0, Math.min(FH - 1, py + PY)) * FW +
        Math.max(0, Math.min(FW - 1, px + PX))
    ];

  if (receivers) {
    const top = -PY - maxTier * R;
    const height = FH + maxTier * R;
    const tiers = new Int8Array(FW * height).fill(-1);
    const rows = new Int16Array(FW * height).fill(-32768);
    const surfaceTiers = new Int8Array(FW * height);
    for (let py = -PY; py < FH - PY; py++)
      for (let px = -PX; px < FW - PX; px++) {
        const L = lvl(px, py);
        const row = Math.floor(py / 16);
        const cell = sample(Math.floor(px / 16), row);
        const sy = py - L * R;
        const i = (sy - top) * FW + px + PX;
        surfaceTiers[(py - top) * FW + px + PX] = L;
        const covered =
          cell?.ramp ||
          cell?.bridge ||
          covers.some(
            (c) =>
              px >= c.x &&
              px < c.x + c.width &&
              sy >= c.y &&
              sy < c.y + c.height,
          );
        if (row > rows[i] || (row === rows[i] && tiers[i] !== -2)) {
          tiers[i] = covered || !cell || cell.surface === "water" ? -1 : L;
          rows[i] = row;
        }
        const below = lvl(px, py + 1);
        for (let k = 1; k <= (L - below) * R; k++) {
          tiers[i + k * FW] = -2;
          rows[i + k * FW] = row;
        }
      }
    Object.assign(receivers, {
      x: -PX,
      y: top,
      width: FW,
      height,
      tiers,
      rows,
      surfaceTiers,
    });
  }

  // Bank tone is applied to the palette once, not per pixel.
  const toned = colors.map((c) =>
    c.map((v, k) =>
      k === 3
        ? v
        : Math.max(
            0,
            Math.min(255, (128 + (v - 128) * bank.contrast) * bank.brightness),
          ),
    ),
  );

  // One strip per row, not per row and tier: the tier only ever contributed a
  // hundredth of the draw depth, and a layer for every combination meant
  // thousands of canvas textures per restyle.
  const layers = new Map<string, ContourLayer>();
  const bounds = new Map<string, [number, number, number, number]>();
  const w = width * 16 + PX * 2;
  const lh = 16 + maxTier * R + PX * 2;
  const strip = (row: number, tier: number, flat: boolean) => {
    const key = flat ? `${row}:flat` : `${row}`;
    let layer = layers.get(key);
    if (!layer) {
      layer = {
        row,
        tier,
        x: -PX,
        y: row * 16 - maxTier * R - PX,
        width: w,
        height: lh,
        pixels: new Uint8ClampedArray(w * lh * 4),
        flat,
      };
      layers.set(key, layer);
      bounds.set(key, [w, 0, lh, 0]);
    }
    return { key, layer };
  };
  /** Record what a strip covers, so cropping never rescans it. */
  const mark = (key: string, ix: number, iy: number) => {
    const b = bounds.get(key)!;
    if (ix < b[0]) b[0] = ix;
    if (ix > b[1]) b[1] = ix;
    if (iy < b[2]) b[2] = iy;
    if (iy > b[3]) b[3] = iy;
  };
  const clipped = (row: number, px: number, sy: number) =>
    (region && (row < 0 || row >= height || px < 0 || px >= width * 16)) ||
    covers.some(
      (c) =>
        px >= c.x && px < c.x + c.width && sy >= c.y && sy < c.y + c.height,
    );
  const at = (
    row: number,
    px: number,
    sy: number,
    flat: boolean,
    tier: number,
  ) => {
    if (clipped(row, px, sy)) return undefined;
    const { key, layer } = strip(row, tier, flat);
    const ix = px + PX,
      iy = sy - layer.y;
    if (ix < 0 || iy < 0 || ix >= w || iy >= lh) return undefined;
    mark(key, ix, iy);
    return { layer, i: (iy * w + ix) * 4 };
  };
  const paint = (
    row: number,
    tier: number,
    px: number,
    sy: number,
    color: number,
  ) => {
    const spot = at(row, px, sy, false, tier);
    if (spot) spot.layer.pixels.set(toned[color], spot.i);
  };
  const paintFlat = (
    row: number,
    tier: number,
    px: number,
    sy: number,
    rgb: readonly number[],
  ) => {
    const spot = at(row, px, sy, true, tier);
    if (!spot) return;
    spot.layer.pixels[spot.i] = rgb[0];
    spot.layer.pixels[spot.i + 1] = rgb[1];
    spot.layer.pixels[spot.i + 2] = rgb[2];
    spot.layer.pixels[spot.i + 3] = 255;
  };
  // Face pixels go into both strips: the camera scrolls at sub-pixel
  // offsets, and a seam between two images would otherwise show the scene
  // background along every lip.
  const paintRgb = (
    row: number,
    tier: number,
    px: number,
    sy: number,
    rgb: readonly number[],
  ) => {
    paintFlat(row, tier, px, sy, rgb);
    const spot = at(row, px, sy, false, tier);
    if (!spot) return;
    spot.layer.pixels[spot.i] = rgb[0];
    spot.layer.pixels[spot.i + 1] = rgb[1];
    spot.layer.pixels[spot.i + 2] = rgb[2];
    spot.layer.pixels[spot.i + 3] = 255;
  };
  /** A translucent black pixel in the face strip, where nothing is drawn. */
  const occlude = (
    row: number,
    tier: number,
    px: number,
    sy: number,
    alpha: number,
  ) => {
    const spot = at(row, px, sy, false, tier);
    if (spot && !spot.layer.pixels[spot.i + 3])
      spot.layer.pixels[spot.i + 3] = alpha;
  };
  const shade = (row: number, px: number, sy: number, amount: number) => {
    const layer = layers.get(`${row}:flat`);
    if (!layer) return;
    const ix = px + PX,
      iy = sy - layer.y;
    if (ix < 0 || iy < 0 || ix >= w || iy >= lh) return;
    const i = (iy * w + ix) * 4;
    if (!layer.pixels[i + 3]) return;
    layer.pixels[i] *= 1 - amount;
    layer.pixels[i + 1] *= 1 - amount;
    layer.pixels[i + 2] *= 1 - amount;
  };

  // Bank earth is the ecology's own cut-bank ramp, and the lip, lit edge and
  // shaded sides come from its turf palette, so a desert never wears a green
  // lip. Cached per ecology and surface: the tone adjustment is the same for
  // every pixel of a face.
  type Trim = {
    earth: [number, number, number][];
    lip: readonly number[];
    edge: readonly number[];
    sides: readonly number[];
    crease: readonly number[];
  };
  const trims = new Map<string, Trim>();
  const rimKeep = bank.rim ?? 1;
  const mix = (a: readonly number[], b: readonly number[], t: number) =>
    [0, 1, 2].map((k) => Math.round(a[k] + (b[k] - a[k]) * t));
  // The pixel loop asks once per pixel and a cell spans hundreds of them, so
  // the answer is kept by cell object ahead of the string key.
  const trimByCell = new WeakMap<TopographyCell, Trim>();
  const trimOf = (cell: TopographyCell | undefined): Trim => {
    if (!cell)
      return trimFor(undefined, undefined, undefined);
    let trim = trimByCell.get(cell);
    if (!trim) {
      trim = trimFor(cell.habitat?.ecology, cell.surface, cell.habitat?.colorway);
      trimByCell.set(cell, trim);
    }
    return trim;
  };
  const trimFor = (
    ecology: string | undefined,
    surface: string | undefined,
    colorway?: Colorway,
  ): Trim => {
    const eco = paletteKey((ecology ?? "grassland") as Ecology, colorway);
    const key = `${eco}:${surface}`;
    let trim = trims.get(key);
    if (trim) return trim;
    if (surface === "snow") {
      const earth = [
        [120, 128, 132],
        [150, 160, 164],
        [186, 203, 208],
        [213, 220, 208],
        [168, 172, 170],
      ].map((c) => toneBank(c, bank));
      trim = {
        earth,
        lip: colors[25],
        edge: colors[26],
        sides: colors[24],
        crease: colors[23],
      };
    } else {
      const earth = (banks[eco] ?? banks.grassland).map((c) =>
        toneBank(c, bank),
      );
      const kit = pickKit(groundStyle()?.kits, ecology, colorway);
      const turf = kit
        ? kitPalette(kit)
        : defaultGrassArt.palettes[eco] ?? defaultGrassArt.palettes.grassland;
      trim =
        surface === "sand"
          ? {
              earth,
              lip: earth[3],
              edge: mix(earth[3], turf[6], 0.3),
              sides: earth[1],
              crease: earth[0],
            }
          : {
              earth,
              // Full strength the lip is far brighter than the toned ground
              // beside it; `rim` sets how much of that survives.
              lip: mix(mix(turf[0], turf[1], 0.3), turf[1], rimKeep),
              edge: mix(
                mix(turf[0], turf[1], 0.45),
                mix(turf[1], turf[6], 0.2),
                rimKeep,
              ),
              sides: turf[2],
              crease: earth[0],
            };
      // Lying snow buries the turf lip; a green line round every snowy
      // terrace read as an outline drawn on top of the ground.
      const k = Math.min(1, snowCover() * 3);
      if (k)
        trim = {
          ...trim,
          lip: mix(trim.lip, colors[25], k),
          edge: mix(trim.edge, colors[26], k),
          sides: mix(trim.sides, colors[24], k),
        };
    }
    trims.set(key, trim);
    return trim;
  };

  const surfaces = contourSurfaces(
    (x, y) => sample(region ? x : Math.max(0, Math.min(width - 1, x)), y),
    groundTiles,
    region?.x ?? 0,
    region?.y ?? 0,
    waterTiles,
  );

  const drop_ = (hi: number, lo: number) => (hi - lo) * R;
  const stains: Record<Ecology, Stain | undefined> = {
    grassland: undefined,
    savanna: "varnish",
    "temperate-woodland": "moss",
    "boreal-woodland": "lichen",
    "tropical-woodland": "moss",
    wetland: "moss",
    "dry-scrub": "varnish",
    desert: "varnish",
    tundra: "lichen",
  };
  // Grass tufts along a brink and at its foot: how many, how tall.
  const tufts: Record<Ecology, readonly [number, number]> = {
    grassland: [0.6, 9],
    savanna: [0.55, 10],
    "temperate-woodland": [0.5, 8],
    "boreal-woodland": [0.4, 6],
    "tropical-woodland": [0.65, 9],
    wetland: [0.65, 9],
    "dry-scrub": [0.4, 7],
    desert: [0.08, 5],
    tundra: [0.25, 4],
  };
  const rockOf = (cell: TopographyCell | undefined) => {
    const eco = cell?.habitat?.ecology;
    return eco === "wetland" ? "earth" : (cell?.rock ?? rockAt(undefined, undefined, eco ?? "grassland", cell?.habitat?.colorway));
  };
  // Cold, high and dry ground: the rock runs to a bare brink of cleared earth
  // and stones rather than under a cushion of turf.
  const capped = (cell: TopographyCell) => {
    const eco = cell.habitat?.ecology,
      way = cell.habitat?.colorway;
    return eco === "tundra" || eco === "boreal-woodland" || eco === "desert" ||
      way === "alpine" || way === "polar" || way === "highland" || cell.height >= 5;
  };
  const natural = (cell: TopographyCell | undefined) =>
    !!cell && !cell.edge && cell.feature !== "paving" && cell.surface !== "sand" && cell.surface !== "snow" && cell.surface !== "water";
  const tuftsFor = (cell: TopographyCell | undefined) =>
    cell && !cell.edge && cell.feature !== "paving" && cell.surface !== "sand" && cell.surface !== "snow" && cell.surface !== "water"
      ? tufts[cell.habitat?.ecology ?? "grassland"]
      : undefined;
  const ecoBanks = new Map<string | undefined, BankStyle>();
  /** One face pixel below a rim: a settlement's wall, bare rock on a tall
   * natural drop, or the earth bank. */
  const facePixel = (
    upper: TopographyCell | undefined,
    trim: Trim,
    r: number,
    drop: number,
    wx: number,
    wy: number,
    /** The ground at the top of the face: its lip is that ground, not turf. */
    ground?: ArrayLike<number> | false,
    /** Depth below the rim on an east or west return, whose `r` runs across
     * the sliver: the face follows the rim, or its beds stand up as planks. */
    belowRim?: number,
    cave?: { dx: number; hw: number },
  ): readonly number[] => {
    if (upper?.edge) return wallPixel(upper.edge, r, drop, wx, trim.earth[4]);
    const eco = upper?.habitat?.ecology;
    let style = ecoBanks.get(eco);
    if (!style) ecoBanks.set(eco, (style = bankFor(bank, eco)));
    if (belowRim !== undefined) r = belowRim;
    if (upper?.surface !== "sand" && upper?.surface !== "snow") {
      const bare = !upper || upper.surface === "gravel" || capped(upper);
      return cliffPixel(rockOf(upper), r, drop, wx, wy, bare ? undefined : ground || trim.lip, stains[eco ?? "grassland"], cave);
    }
    const pixel = styledBankPixel(style, r, drop, wx, wy);
    return pixel.kind === "earth"
      ? trim.earth[pixel.tone]
      : pixel.kind === "crease"
        ? trim.crease
        : pixel.kind === "stone"
          ? trim.earth[4]
          : ground
            ? r === 0
              ? lit(ground)
              : scale(ground, 0.92)
            : r === 0
              ? trim.edge
              : trim.lip;
  };
  /** The sunlit pixel along a rim, from whatever ground is there. */
  const lit = (g: ArrayLike<number>) =>
    [0, 1, 2].map((k) => Math.min(255, g[k] * 1.12 + 14));
  const scale = (g: ArrayLike<number>, f: number) =>
    [0, 1, 2].map((k) => g[k] * f);
  const toward = (g: ArrayLike<number>, to: number, t: number) =>
    [0, 1, 2].map((k) => g[k] + (to - g[k]) * t);
  const FALL_WATER = [92, 168, 214];
  const foamOf = (g: ArrayLike<number>, bright: boolean) =>
    toward(g, 248, bright ? 0.85 : 0.6);
  /** One pixel of falling water, `r` rows below the lip of a `drop`-row fall.
   * Streaks are two pixels wide and wander in width along the face. */
  const fallPixel = (g: ArrayLike<number>, wx: number, r: number, drop: number) => {
    if (r === 0) return toward(g, 250, 0.8);
    if (r >= drop - 2) return foamOf(g, r === drop - 1);
    const streak =
      (Math.floor(wx / 2) + Math.floor(contourNoise(Math.floor(wx / 5), 0, 1, 107) * 3)) % 4;
    return streak === 0
      ? toward(g, 250, 0.55)
      : streak === 2
        ? scale(g, 0.82)
        : toward(g, 250, 0.2);
  };
  // Painted after the ground, which would otherwise overwrite them.
  // Dry strata vary down a return, so those slivers carry a colour per row.
  const returns: [
    number,
    number,
    number,
    number,
    readonly number[] | ((y: number) => readonly number[]),
  ][] = [];
  const feet: [number, number, number, TopographyCell | undefined, Trim][] = [];
  const sideFace = contour.sideFace ?? 0;
  const hillshade = contour.hillshade ?? 0;
  const sampleAt = (x: number, y: number) =>
    sample(region ? x : Math.max(0, Math.min(width - 1, x)), y);
  /** The cell at (x, y) is a ramp whose high end faces `dir`. */
  // Asked three times per pixel; a cell answers once.
  const rampDir = new Map<number, string | undefined>();
  const rampInto = (x: number, y: number, dir: "n" | "e" | "s" | "w") => {
    const key = x * 4096 + y + 2048;
    let r = rampDir.get(key);
    if (r === undefined && !rampDir.has(key))
      rampDir.set(key, (r = sampleAt(x, y)?.ramp));
    return r === dir;
  };
  /** The surface height of a ramp at a world pixel, in tiers. */
  const rampHeight = (px: number, py: number) => {
    const x = Math.floor(px / 16),
      y = Math.floor(py / 16);
    const c = sampleAt(x, y);
    if (!c?.ramp) return undefined;
    const u = px - x * 16,
      v = py - y * 16;
    return (
      c.height +
      { n: 1 - v / 16, s: (v + 1) / 16, e: (u + 1) / 16, w: 1 - u / 16 }[c.ramp]
    );
  };
  // A bank beside a ramp stands only as high as the ramp is low there, so a
  // cut's walls shrink to nothing at its top instead of ending square.
  const besideRamp = (L: number, x: number, py: number, n: number) => {
    if (n >= L) return L;
    const r = rampHeight(x, py);
    return r === undefined ? n : r > L - 0.25 ? L : r;
  };
  const CUE_SHADE = [0, 0.16, 0.1, 0.05];
  const HILL_DIRS: [number, number][] = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];
  const lo = region ? -1 : 0,
    hi = region ? height * 16 + 1 : height * 16;
  for (let px = -PX; px < width * 16 + PX; px++)
    for (let py = lo - 16; py < hi + 16; py++) {
      const L = lvl(px, py);
      const row = Math.floor(py / 16);
      const cell = sample(Math.floor(px / 16), row);
      const owner = surfaces.owner(px, py, L);
      const material = owner?.cell ?? cell;
      const dry = material?.surface === "dry" || material?.surface === "sand";
      const snow = material?.surface === "snow";
      const sy = py - L * R;
      const cx = Math.floor(px / 16);
      // A ramp joins its plateau flush: no rim line, strip or face there.
      const west =
          lvl(px - 1, py) < L && !rampInto(cx - 1, row, "e")
            ? besideRamp(L, px - 1, py, lvl(px - 1, py))
            : L,
        east =
          lvl(px + 1, py) < L && !rampInto(cx + 1, row, "w")
            ? besideRamp(L, px + 1, py, lvl(px + 1, py))
            : L,
        north =
          lvl(px, py - 1) < L && !rampInto(cx, row - 1, "s")
            ? lvl(px, py - 1)
            : L;
      const rim = west < L || east < L || north < L;
      if (cell?.ramp) continue;
      const cap = snow ? 25 : dry ? 9 : 4;
      const trim = trimOf(material);
      const rgba = owner && surfaces.pixel(owner, px, py, L, lvl);
      // Living water has no baked tile, so its rims take a stock water tone.
      const wet = material?.surface === "water";
      const tone = rgba || (wet ? FALL_WATER : undefined);
      // A north rim with water below it is the lip of a fall seen from behind.
      const pour =
        wet && north < L && sample(cx, Math.floor((py - 1) / 16))?.surface === "water";
      // Water is the living-water layer's to draw; a baked copy here sat
      // over it as a flat, contact-shaded rectangle beside every drop.
      if (material?.surface !== "water" && ownsAt(Math.floor(px / 16), row) && !clipped(row, px, sy)) {
        if (rgba) {
          const spot = at(row, px, sy, true, L);
          if (spot) spot.layer.pixels.set(rgba, spot.i);
        } else if (snowCover() && !snow)
          // Snowed like the ground beside it, or a light fall leaves this
          // strip as a green bar along the rim.
          paintFlat(row, L, px, sy, snowPixel(toned[cap], px + ox, py + oy));
        else paint(row, L, px, sy, cap);
        // A fixed contour cue stays on its own terrace, independent of sunlight.
        for (let k = 1; k <= 3; k++) {
          if (lvl(px, py - k) >= L) continue;
          if (rampHeight(px, py - k) !== undefined) break;
          shade(row, px, sy, CUE_SHADE[k]);
          break;
        }
        // Contact shade thrown forward by whatever rises immediately behind.
        // Darkening the ground it falls on reads as a shadow; a tinted copy
        // of the bank reads as a smudge.
        for (let k = 1; k <= bank.shadow; k++) {
          if (lvl(px, py - k) <= L) continue;
          // Two flat steps: a smooth ramp reads as blur at pixel scale.
          shade(row, px, sy, k <= bank.shadow / 2 ? 0.26 : 0.13);
          break;
        }
        // Lighter toward a drop, darker under a rise, so a plateau reads
        // before its edge does. Two bands, not a ramp, which reads as blur.
        if (hillshade)
          search: for (let d = 2; d <= 12; d += 2)
            for (const [ux, uy] of HILL_DIRS) {
              const n = lvl(px + ux * d, py + uy * d);
              if (n === L || rampHeight(px + ux * d, py + uy * d) !== undefined)
                continue;
              shade(
                row,
                px,
                sy,
                (n < L ? -0.1 : 0.1) * hillshade * (d <= 4 ? 0.8 : 0.35),
              );
              break search;
            }
      }
      // A lit pixel along every rim, with a shaded strip just inside the
      // west and east ones: the outline that makes a step read as a step.
      // A paved step is a stone nosing, not a turf lip.
      const stone = material?.feature === "paving";
      if (rim && L)
        paintRgb(
          row,
          L,
          px,
          sy,
          material?.edge
            ? copingColor(material.edge, trim.earth[4])
            : stone
              ? [198, 194, 178]
              : pour
                ? foamOf(tone!, true)
                : tone
                  ? lit(tone)
                  : trim.edge,
        );
      else if (
        contour.sides &&
        (lvl(px - contour.sides, py) < L || lvl(px + contour.sides, py) < L)
      )
        paintRgb(
          row,
          L,
          px,
          sy,
          stone ? [122, 120, 110] : tone ? scale(tone, 0.78) : trim.sides,
        );
      const below = rampInto(cx, row + 1, "n") ? L : lvl(px, py + 1);
      const bareBrink = below < L && natural(material) && capped(material!);
      const tuft = below < L && rim && !bareBrink ? tuftsFor(material) : undefined;
      if (bareBrink) {
        // Cleared earth back from the brink, ragged into the ground behind,
        // with stones of the cliff's own rock bedded in it.
        const k = 3 + Math.floor(contourNoise(px + ox, py + oy, 7, 141) * 7);
        for (let j = 1; j <= k; j++) {
          const n = contourNoise(px + ox, py + oy - j, 1, 143);
          paintRgb(row, L, px, sy - j, j === k ? trim.earth[2] : n > 0.9 ? trim.earth[4] : n < 0.15 ? trim.earth[1] : n < 0.5 ? trim.earth[2] : trim.earth[3]);
        }
        const rock = rockOf(material);
        if (rock !== "earth")
          for (let j = 1; j <= 9; j++) {
            const stone = talusPixel(rock, px + ox, py + oy + 3, -j + 4, 0.55);
            if (stone === "shadow") shade(row, px, sy - j, 0.3);
            else if (stone) paintRgb(row, L, px, sy - j, stone);
          }
      }
      if (tuft) {
        const h = tuftHeight(px + ox, py + oy, tuft[0], tuft[1]);
        for (let j = 0; j < h; j++) paintRgb(row, L, px, sy - j, tuftPixel(trim.lip, j, h, px + ox));
      }
      // Rim feet for the sun-cast shadow drawn on the main thread: screen
      // point on the lower ground, wall height, lower tier, which way it faces.
      if (
        rims &&
        L &&
        px >= 0 &&
        px < width * 16 &&
        py >= 0 &&
        py < height * 16
      ) {
        if (below < L)
          rims.push(px, py + 1 - below * R, drop_(L, below), below, 1);
        if (west < L) rims.push(px - 1, py - west * R, drop_(L, west), west, 2);
        if (east < L) rims.push(px + 1, py - east * R, drop_(L, east), east, 4);
      }
      // Ground behind a north rim is hidden by the plateau standing in front
      // of it; a soft band along the silhouette says which is in front.
      if (pour)
        // Spray thrown up off the pool below, ragged and thinning upward.
        for (let k = 1; k <= 3; k++) {
          if (contourNoise(px + ox, k + (py + oy) * 3, 1, 119) < k / 4) continue;
          paintRgb(row, L, px, sy - k, foamOf(tone!, k === 1));
        }
      else if (north < L && L) {
        occlude(row, L, px, sy - 1, 64);
      }
      // East and west drops show a sliver of the same face, so they read as
      // one object with the south wall rather than as a stray line.
      if (sideFace && L && (west < L || east < L))
        for (let s = 0; s < 2; s++) {
          const n = s ? east : west,
            side = s ? 1 : -1,
            tone = s ? 0.68 : 0.86;
          if (n >= L) continue;
          // Follow the edge south. Ending in a south face, it is the side of
          // a front-facing corner and earns its sliver; ending where the low
          // side rises, it faces away from the camera and shows only a rim.
          let j = 1;
          while (j < 48 && lvl(px, py + j) === L && lvl(px + side, py + j) < L)
            j++;
          // A run longer than the search is a straight wall: keep its sliver.
          // One that faces away keeps a narrower, darker sliver, so a side
          // step still reads as a bank and not as a ruled line.
          const away = j < 48 && lvl(px, py + j) >= L;
          // Water stepping down sideways pours over the edge: each sliver
          // column is one streak of the fall, wider than an earth bank's.
          const pours =
            material?.surface === "water" &&
            sample(Math.floor((px + side) / 16), row)?.surface === "water";
          // Bare rock shows more of its side than a bank or a wall does: at a
          // sliver's width a cliff facing east or west read as a crack.
          const rocky = !material?.edge && material?.feature !== "paving" && material?.surface !== "sand";
          const width = pours ? sideFace + 3 : away ? Math.max(1, sideFace - 1) : sideFace + (rocky ? 3 : 0);
          for (let k = 1; k <= width; k++) {
            const r = Math.round(((k - 1) / sideFace) * (R - 1));
            const shade = tone * (away ? 0.82 : 1);
            const at = (y: number) => {
              const c = material?.edge
                ? facePixel(material, trim, r, R, sy + oy, px + ox)
                : facePixel(material, trim, r, (L - n) * R, px + side * k + ox, y + oy, undefined, y - sy);
              return [c[0] * shade, c[1] * shade, c[2] * shade];
            };
            returns.push([
              row,
              L,
              px + side * k,
              sy,
              pours
                ? fallPixel(rgba ?? FALL_WATER, px + side * k + ox, 1 + (k % 2), 6)
                : material?.edge
                  ? at(sy)
                  : at,
            ]);
            // Higher ground further south stands in front of this wall and
            // hides its lower part. Unclipped, a north-east facing edge hung
            // a strip over every step of the plateau below it.
            let bottom = sy + Math.round((L - n) * R);
            for (let j = 1; j <= (L - n) * R; j++) {
              const front = lvl(px + side * k, py + j);
              if (front > n) bottom = Math.min(bottom, py + j - front * R - 1);
            }
            returns.push([row, L, px + side * k, bottom, []]);
            if (pours && contourNoise(px + side * k + ox, py + oy, 1, 121) > 0.3)
              paintFlat(row, n, px + side * k, bottom + 1, foamOf(rgba ?? FALL_WATER, true));
          }
        }
      if (below >= L) continue;
      const drop = (L - below) * R;
      // Water above water: the face is a fall, not a cut bank. A pale pour
      // line at the lip, streaks down it and foam at the foot, in the tones
      // of the water above, so a bog pours brown and a glacier stream pale.
      const lower = sample(cx, row + 1);
      if (cell?.surface === "water" && lower?.surface === "water") {
        // Living water has no baked tile to take its tone from.
        const src = rgba ?? FALL_WATER;
        for (let r = 0; r < drop; r++)
          paintRgb(row, L, px, sy + 1 + r, fallPixel(src, px + ox, r, drop));
        // Foam spreads a few ragged pixels onto the pool below.
        const reach = 2 + Math.floor(contourNoise(Math.floor((px + ox) / 3), row + oy, 1, 115) * 3);
        for (let r = 0; r < reach; r++)
          if (contourNoise(px + ox, r + (py + oy) * 5, 1, 117) > r / reach)
            paintFlat(row + 1, below, px, sy + 1 + drop + r, foamOf(src, r === 0));
        continue;
      }
      const spot = natural(material) && drop >= R ? caveAt(rockOf(material), px + ox, py + oy) : undefined;
      // A mouth only where the face runs on unbroken either side of it.
      const cave =
        spot &&
        [spot.cx - spot.hw - 3, spot.cx + spot.hw + 3].every((x) => {
          for (let dy = -3; dy <= 3; dy++) if (lvl(x - ox, py + dy) === L && lvl(x - ox, py + dy + 1) === below) return true;
          return false;
        })
          ? spot
          : undefined;
      for (let r = 0; r < drop; r++)
        paintRgb(
          row,
          L,
          px,
          sy + 1 + r,
          facePixel(material, trim, r, drop, px + ox, py + oy, rgba, undefined, cave),
        );
      if (cave && Math.abs(cave.dx) <= cave.hw + 1) {
        // Ground worn bare in front of the mouth.
        const reach = Math.round(6 * Math.sqrt(Math.max(0, 1 - (cave.dx / (cave.hw + 2)) ** 2)));
        for (let j = 1; j <= reach; j++)
          paintRgb(Math.max(row + 1, Math.floor((py + j) / 16)), below, px, sy + drop + j, contourNoise(px + ox, j, 1, 145) > 0.85 ? trim.earth[4] : j === reach ? trim.earth[2] : trim.earth[3]);
      } else if (tuft) {
        const h = tuftHeight(px + ox, py + oy + 1, tuft[0] * 1.2, tuft[1] + 1);
        for (let j = 0; j < h; j++) paintRgb(row, L, px, sy + drop - j, tuftPixel(trim.lip, j, h, px + ox));
      }
      const rock = !cave && natural(material) && drop >= R ? rockOf(material) : "earth";
      if (rock !== "earth") {
        const density = lower?.waterVisual?.kind === "sea" || capped(material!) ? 0.75 : 0.3;
        for (let j = -6; j <= 6; j++) {
          const stone = talusPixel(rock, px + ox, py + oy, j, density);
          // In the lower ground's face strip, which draws over both this face
          // and the ground of the rows beneath.
          const at = Math.max(row + 1, Math.floor((py + j) / 16));
          if (stone === "shadow") occlude(at, below, px, sy + drop + j, 70);
          else if (stone) paintRgb(at, below, px, sy + drop + j, stone);
        }
      }
      if (material?.edge && hasParapet(material.edge) && drop >= R) {
        const cap = copingColor(material.edge, trim.earth[4]);
        paintRgb(row, L, px, sy - 3, cap);
        paintRgb(row, L, px, sy - 2, [
          cap[0] * 0.9,
          cap[1] * 0.9,
          cap[2] * 0.9,
        ]);
        paintRgb(
          row,
          L,
          px,
          sy - 1,
          wallPixel(material.edge, 4, 12, px + ox, trim.earth[4]),
        );
        paintRgb(row, L, px, sy, [cap[0] * 0.5, cap[1] * 0.5, cap[2] * 0.5]);
      }
      feet.push([px, py + 1, below, material, trim]);
    }
  for (let i = 0; i < returns.length; i += 2) {
    const [row, tier, x, top, rgb] = returns[i];
    const bottom = returns[i + 1][3];
    for (let y = top; y <= bottom; y++)
      paintRgb(row, tier, x, y, typeof rgb === "function" ? rgb(y) : rgb);
  }
  // The foot of a face: weeds or scree on earth, a gutter on paving, and a
  // contact shadow where the ground page, not this pass, owns the ground.
  for (const [px, py, tier, upper, trim] of feet) {
    const lower = sample(Math.floor(px / 16), Math.floor(py / 16));
    if (!lower || lower.surface === "water" || lower.ramp) continue;
    const paved = lower.feature === "paving";
    const owned = ownsAt(Math.floor(px / 16), Math.floor(py / 16));
    const sy = py - tier * R;
    if (!owned)
      for (let k = 0; k < bank.shadow; k++) {
        const row = Math.floor((py + k) / 16);
        const spot = at(row, px, sy + k, true, tier);
        if (spot && !spot.layer.pixels[spot.i + 3])
          spot.layer.pixels[spot.i + 3] = k < bank.shadow / 2 ? 72 : 36;
      }
    if (!(bank.foot ?? false)) continue;
    const row = Math.floor(py / 16);
    const roll = contourNoise(px + ox, py + oy, 1, 113);
    if (paved && upper?.edge) {
      paintFlat(row, tier, px, sy, [70, 70, 68]);
    } else if (!paved && !upper?.edge && roll > 0.7) {
      paintFlat(row, tier, px, sy, roll > 0.9 ? trim.earth[4] : trim.sides);
      if (roll > 0.85) paintFlat(row, tier, px, sy + 1, trim.sides);
    }
  }
  // Ramps: a trodden-earth slope lifted continuously from its own tier to
  // the plateau it climbs, in place of the old atlas slope sprite. Rows and
  // columns are walked in screen space so a stretched slope has no gaps.
  const kits = groundStyle()?.kits;
  const kitFor = (ecology: string | undefined, colorway?: Colorway) => pickKit(kits, ecology, colorway);
  const soilFor = (ecology: string | undefined, colorway?: Colorway) =>
    kitFor(ecology, colorway)
      ? kitSoil(kitFor(ecology, colorway)!)
      : soils[paletteKey((ecology ?? "grassland") as Ecology, colorway)] ??
        soils.grassland;
  const noise = (x: number, y: number, salt: number) =>
    contourNoise(x, y, 1, salt);
  for (let cy = 0; cy < height; cy++)
    for (let cx = 0; cx < width; cx++) {
      const cell = sampleAt(cx, cy);
      const dir = cell?.ramp;
      if (!cell || !dir) continue;
      const t = cell.height;
      const soil = soilFor(cell.habitat?.ecology, cell.habitat?.colorway);
      const style = cell.rampStyle ?? "cut";
      const rampKit = kitFor(cell.habitat?.ecology, cell.habitat?.colorway);
      const turf = rampKit
        ? kitPalette(rampKit)
        : defaultGrassArt.palettes[
          paletteKey(
            (cell.habitat?.ecology ?? "grassland") as Ecology,
            cell.habitat?.colorway,
          )
        ] ?? defaultGrassArt.palettes.grassland;
      const stone = [156, 156, 146],
        stoneDark = [104, 106, 100],
        stoneLight = [196, 196, 184];
      const timber = [92, 60, 38],
        timberLight = [134, 94, 56];
      // Rails, stones and the top edge take a per-ramp phase so no two
      // crossings share the same breaks.
      const phase = Math.floor(noise(cx + ox, cy + oy, 97) * 16);
      const trim = trimFor(
        cell.habitat?.ecology,
        cell.surface,
        cell.habitat?.colorway,
      );
      const southTier = rampInto(cx, cy + 1, dir)
        ? undefined
        : tierAt(cx, cy + 1);
      // Edge-anchored: the high end reaches the plateau's full lift and the
      // low end sits on the ground, so neither joint leaves a gap.
      const h = (px: number, py: number) => {
        const u = px - cx * 16,
          v = py - cy * 16;
        return (
          t +
          { n: 1 - v / 16, s: (v + 1) / 16, e: (u + 1) / 16, w: 1 - u / 16 }[
            dir
          ]
        );
      };
      const along = dir === "n" || dir === "s";
      // A slope is drawn across its whole run of ramp cells, not per tile:
      // one trail, shoulders only at the two ends.
      let before = 0,
        after = 0;
      while (
        before < 12 &&
        rampInto(
          cx - (along ? before + 1 : 0),
          cy - (along ? 0 : before + 1),
          dir,
        )
      )
        before++;
      while (
        after < 12 &&
        rampInto(
          cx + (along ? after + 1 : 0),
          cy + (along ? 0 : after + 1),
          dir,
        )
      )
        after++;
      const runPx = (before + after + 1) * 16;
      const runKey = along ? cx - before + ox / 16 : cy - before + oy / 16;
      const own = { x: cx, y: cy, cell };
      const [sx, sy0] = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0] }[dir];
      const donor = (x: number, y: number) => {
        const c = sampleAt(x, y);
        return c && c.habitat && !c.ramp && c.surface !== "water"
          ? { x, y, cell: c }
          : own;
      };
      // Ground from the plateau above and the ground below, so a grassy
      // slope onto a beach ends in sand rather than a square of turf.
      const upper = donor(cx + sx, cy + sy0),
        lower = donor(cx - sx, cy - sy0);
      // A road cut carries the ground page's own path up the incline, so the
      // path does not change colour and width where it climbs.
      const bed =
        style === "cut" || (style === "slope" && cell.pathArt?.length)
          ? { x: cx, y: cy, cell: { ...cell, ramp: undefined } }
          : undefined;
      // How a natural slope is made: turf carried down, steps cut in the
      // rock, or a scree track. Rolled per run so one coast mixes them.
      const roll = noise(runKey, t * 7 + (along ? cy : cx), 131);
      const runPhase = Math.floor(noise(runKey, t, 97) * 16);
      const rock = natural(upper.cell) ? rockOf(upper.cell) : "earth";
      const look =
        style !== "slope" || bed
          ? undefined
          : rock === "earth"
            ? roll < 0.5 ? "grass" : "earth"
            : capped(upper.cell)
              ? roll < 0.6 ? "scree" : "stairs"
              : roll < 0.65 ? "grass" : "stairs";
      const stones = rock === "earth" ? undefined : rockRamp(rock);
      const worn = (cell.groundWear ?? 0) > 0.3;
      const scale = (c: readonly number[], f: number) => [c[0] * f, c[1] * f, c[2] * f];
      /** One pixel of a natural slope, `down` 0 at the crest to 1 at the foot;
       * `U` runs across the whole run, or is negative off it on a flank. The
       * flag says the colour came from the ground page, snow and all. */
      const slopePixel = (px: number, py: number, U: number, down: number, rise: number): [readonly number[], boolean] => {
        const wx = px + ox, wy = py + oy;
        // Three hard bands: a lit crest, the face of the slope, a darker foot.
        const band = down < 0.1 ? 1.06 : down > 0.86 ? 0.86 : 0.97;

        // Each look is a feature down the middle of a turf slope: stairs
        // nearly its full width, or a scree or earth track.
        if (U >= 0 && look === "stairs" && stones) {
          // Six rows a step: a lit tread with its nose catching the light,
          // then the riser, shadowed under the nose. Steps are slabs of
          // uneven length, so the flight's sides stagger into the turf, and
          // each riser is two blocks.
          const r6 = rise + runPhase;
          const k = Math.floor(r6 / 6), row = ((r6 % 6) + 6) % 6;
          const x = U - runPx / 2;
          const span = runPx / 2 - 3;
          const west = -span + Math.floor(noise(k, runKey, 137) * 3),
            east = span - Math.floor(noise(k, runKey, 139) * 3);
          if (x >= west && x < east) {
            if (row >= 3 && x === Math.round(west + (east - west) * (0.35 + noise(k, runKey, 141) * 0.3)))
              return [stones[1], false];
            const grain = noise(wx, wy, 143) < 0.07 ? -1 : 0;
            const tone = row < 2 ? 5 + grain : row === 2 ? 6 : row === 3 ? 2 : 3 + grain;
            return [scale(stones[tone], band), false];
          }
          if (x === east && row >= 2) {
            const g = surfaces.pixel(upper, px, py, t, lvl) ?? turf[0];
            return [[g[0] * 0.7, g[1] * 0.7, g[2] * 0.7], true];
          }
        }
        // Tracks keep one width the whole way down, wandering a little, with
        // edges that waver a pixel either side rather than ruled lines.
        const track = (hw: number) => {
          const x = U - runPx / 2 - Math.sin(rise / 11 + runKey * 1.7) * Math.min(3, runPx * 0.12);
          const wl = hw + (noise(Math.floor(rise / 2), runKey, 145) - 0.5) * 1.6,
            wr = hw + (noise(Math.floor(rise / 2), runKey, 147) - 0.5) * 1.6;
          return U < 0 ? Infinity : x < 0 ? -x - wl : x - wr;
        };
        if (look === "scree" && stones) {
          const d = track(runPx > 16 ? 5 : 4);
          // Pebbles two pixels across, lit on top, a few strayed into the turf.
          const pebble = noise(wx >> 1, wy >> 1, 135) < (d < 0 ? 0.16 : d < 3 ? 0.06 : 0);
          if (pebble) return [scale(stones[wy & 1 ? 1 : 5], band), false];
          if (d < 0) return [scale(d > -1 ? mix(stones[2], soil[1], 0.5) : mix(stones[3], soil[2], 0.45), band), false];
        }
        if (look === "earth" || worn) {
          const d = track(look === "earth" ? 3 : 2);
          const n = noise(wx, wy, 91);
          if (d < 0) return [scale(d > -1 ? soil[1] : n < 0.06 ? soil[1] : n > 0.9 ? soil[3] : soil[2], band), false];
        }
        const g = surfaces.pixel(upper, px, py, t, lvl) ?? turf[0];
        return [[g[0] * band, g[1] * band, g[2] * band], true];
      };
      for (let px = cx * 16; px < cx * 16 + 16; px++) {
        const wx = px + ox;
        // Screen span of this column, then each screen row finds the world
        // row whose lifted extent covers it.
        const top = Math.round(cy * 16 - h(px, cy * 16) * R),
          bottom = Math.round(
            cy * 16 + 15 - (dir === "n" ? t : h(px, cy * 16 + 15)) * R,
          );
        const first = Math.min(top, bottom),
          last = Math.max(top, bottom);
        for (let sy = first; sy <= last; sy++) {
          let py = cy * 16;
          if (along) {
            const lifted = (y: number) => y - h(px, y) * R;
            py = cy * 16 + 15;
            for (let y = cy * 16; y < cy * 16 + 16; y++)
              if (lifted(y) > sy) {
                py = Math.max(cy * 16, y - 1);
                break;
              }
          } else py = sy + Math.round(h(px, cy * 16) * R);
          // A north or south ramp stretches 16 world rows over its whole
          // screen height; texture and grain are read one row per screen row
          // so the slope keeps the ground's own resolution.
          const ty = along ? sy + t * R : py;
          const wy = ty + oy;
          // Across the ramp: two pixels of cut earth where the side is open,
          // trodden soil between, with erosion lines across the slope and a
          // darker foot where it meets the lower ground.
          const u = along ? px - cx * 16 : py - cy * 16;
          const openLow = along
            ? !rampInto(cx - 1, cy, dir)
            : !rampInto(cx, cy - 1, dir);
          const openHigh = along
            ? !rampInto(cx + 1, cy, dir)
            : !rampInto(cx, cy + 1, dir);
          const rise = along ? sy : px;
          const runPos = along ? px : sy;
          // Rail depth wanders 0–2 px along the run, so the side is a broken
          // edge rather than two ruled lines; slopes have no rail at all.
          const railDepth =
            style === "slope" || bed
              ? 0
              : Math.floor(noise(Math.floor((rise + phase) / 3), 0, 99) * 3);
          const side =
            openLow && u < railDepth
              ? u
              : openHigh && u > 15 - railDepth
                ? 15 - u
                : -1;
          const cut =
            side < 0
              ? undefined
              : style === "timber"
                ? (rise + phase) % 4 === 0
                  ? timber
                  : timberLight
                : style === "steps"
                  ? side === 0
                    ? stoneDark
                    : stone
                  : side === 0
                    ? trim.earth[0]
                    : trim.earth[1];
          const n = noise(wx, wy, 91);
          const line =
            (rise + Math.floor(noise(Math.floor(runPos / 6), 0, 93) * 5)) %
              5 ===
              0 && noise(wx, wy, 95) < 0.6;
          const foot = along
            ? sy >= last - 1
            : southTier !== undefined && py >= cy * 16 + 14;
          // The plateau's turf hangs a pixel or two over the top of the cut.
          const lip =
            (style === "sand" || style === "timber") &&
            // Distance from the high end: rows for a north ramp, columns
            // for one that climbs east or west.
            (along
              ? sy - first
              : dir === "w"
                ? px - cx * 16
                : 15 - (px - cx * 16)) <
              (noise(Math.floor((runPos + phase) / 2), 1, 101) < 0.5 ? 1 : 2);
          let rgb: readonly number[];
          // Ground borrowed from the tiles either side already has its snow.
          let snowed = false;
          if (style === "graded") {
            // The street's own surface carried up the grade, a little darker.
            const c = cell.streetMaterial
              ? pavingStonePixel(
                  wx,
                  wy,
                  cell.streetMaterial,
                  pavingGrade(cell.pavement),
                )
              : soil[2];
            const f = rise % 4 === 0 ? 0.84 : 0.92;
            rgb = [c[0] * f, c[1] * f, c[2] * f];
          } else if (cut) rgb = cut;
          else if (bed) {
            const g = surfaces.pixel(bed, px, py, t, lvl) ?? soil[2];
            const down = along
              ? (sy - first) / Math.max(1, last - first)
              : 1 - (h(px, cy * 16) - t);
            const f = 0.9 + (1 - down) * 0.08;
            rgb = [g[0] * f, g[1] * f, g[2] * f];
            snowed = true;
          }
          else if (lip)
            rgb = n < 0.5 ? turf[0] : turf[5];
          else if (style === "slope") {
            const U = before * 16 + u;
            const down = along
              ? (sy - first) / Math.max(1, last - first)
              : 1 - (h(px, cy * 16) - t);
            const edge = Math.min(U, runPx - 1 - U);
            const shoulder =
              1 +
              Math.floor(
                noise(
                  Math.floor((rise + phase) / 3),
                  runKey + (U < runPx / 2 ? 0 : 7),
                  99,
                ) * 3.4,
              );
            [rgb, snowed] = slopePixel(px, ty, U, down, rise);
            // The bank to the west shades the ramp's west edge.
            if (dir === "n" && U < 2 && openLow) rgb = scale(rgb, U === 0 ? 0.72 : 0.84);
            // A side-climbing slope's ends fall away as broken shoulders.
            if (dir !== "n" && look !== "stairs" && (edge < shoulder - 1 || (edge < shoulder && n < 0.5)))
              rgb = scale(rgb, 0.74);
          } else if (style === "steps") {
            // Risers every three rows, treads between; a lit tread edge.
            const step = (rise + phase) % 3;
            rgb = step === 0 ? stoneDark : step === 1 ? stoneLight : stone;
            if (n > 0.9) rgb = stoneDark;
          } else if (style === "sand") {
            // A slumped sand face: soft ripples, no rails, darker foot.
            const ripple =
              (rise + Math.floor(noise(Math.floor(runPos / 4), 2, 103) * 3)) %
                3 ===
              0;
            rgb = foot
              ? soil[1]
              : ripple
                ? soil[3]
                : n < 0.15
                  ? soil[1]
                  : soil[2];
          } else
            rgb = foot
              ? soil[0]
              : line
                ? mix(soil[2], soil[1], 0.5)
                : n < 0.1
                  ? soil[1]
                  : n > 0.85
                    ? soil[3]
                    : soil[2];
          if (style !== "steps" && style !== "timber" && !snowed)
            rgb = snowPixel(
              rgb,
              wx,
              wy,
              style === "graded" || !!cell.pathArt?.length,
            );
          paintFlat(cy, t, px, sy, rgb);
        }
        // The low end of a side-climbing slope fans onto the ground too.
        if (
          style === "slope" &&
          !along &&
          px === (dir === "w" ? cx * 16 + 15 : cx * 16)
        ) {
          const ground =
            surfaces.pixel(lower, px, cy * 16 + 8, t, lvl) ?? turf[0];
          for (let v = 0; v < 16; v++) {
            const U = before * 16 + v;
            const taper = Math.min(1, Math.min(U, runPx - 1 - U) / 8);
            const reach = Math.round(
              (2 + noise(Math.floor((cy * 16 + v + oy) / 4), runKey, 121) * 4) *
                taper,
            );
            for (let k = 1; k <= reach; k++) {
              const x = dir === "w" ? px + k : px - k,
                sy = cy * 16 + v - t * R;
              if (noise(x + ox, sy + oy, 123) < (k - 1) / reach) continue;
              paintFlat(cy, t, x, sy, [
                ground[0] * 0.86,
                ground[1] * 0.86,
                ground[2] * 0.86,
              ]);
            }
          }
        }
        if (style === "cut" && dir === "n") {
          for (let r = 1; r <= 2; r++) {
            const sy = last + r;
            const roll = noise(px + ox, sy + oy, 105);
            if (roll > 0.82)
              paintFlat(
                cy,
                t,
                px,
                sy,
                roll > 0.93 ? trim.earth[4] : trim.earth[1],
              );
          }
        }
        // Across-slope ramps rise along x, so each column shows a wedge of
        // cut earth down to the ground in front of it.
        if (southTier === undefined) continue;
        const foot = cy * 16 + 16 - southTier * R;
        const drop = foot - (last + 1);
        if (style === "slope" || style === "sand" || bed) {
          // The near flank of an earthen ramp is a battered grass slope, not
          // a cut: darker turf, falling a little past the cell, no lip.
          const ground =
            surfaces.pixel(lower, px, cy * 16 + 15, t, lvl) ?? turf[0];
          const spill = Math.round(drop * 0.3);
          for (let r = 0; r < drop + spill; r++) {
            if (
              r >= drop &&
              noise(wx, r + oy, 119) < (r - drop + 1) / (spill + 1)
            )
              continue;
            const g =
              r === 0 ? 0.9 : 0.74 - (r / Math.max(1, drop + spill)) * 0.14;
            const rgb = [ground[0] * g, ground[1] * g, ground[2] * g];
            if (r < drop) paintRgb(cy, t, px, last + 1 + r, rgb);
            else paintFlat(cy + 1, t, px, last + 1 + r, rgb);
          }
          continue;
        }
        for (let r = 0; r < drop; r++)
          paintRgb(
            cy,
            t,
            px,
            last + 1 + r,
            facePixel(cell, trim, r, drop, wx, cy * 16 + 16 + oy),
          );
      }
    }
  return cropLayers(
    [...layers].map(([key, layer]) => ({ layer, box: bounds.get(key)! })),
  );
}

export function drawTerrainContours(
  scene: Phaser.Scene,
  sample: TopographySample,
  width: number,
  height: number,
  covers: readonly Cover[] = [],
  resources: RenderResources = renderResources(),
  groundTiles?: readonly GroundTileData[],
) {
  drawContourLayers(
    scene,
    rasterTerrainContours(
      sample,
      width,
      height,
      covers,
      undefined,
      groundTiles,
    ),
    "contour",
    resources,
  );
}
export function drawContourLayers(
  scene: Phaser.Scene,
  layers: ContourLayer[],
  prefix = "contour",
  resources: RenderResources = renderResources(),
) {
  for (const layer of layers) {
    const key = `${prefix}-${layer.row}-${layer.tier}${layer.flat ? "-f" : ""}`;
    resources.textures.push(key);
    addPixelTexture(scene, key, layer.width, layer.height, layer.pixels);
    own(
      resources,
      scene.add
        .image(layer.x, layer.y, key)
        .setOrigin(0)
        // Ground strips sit below any figure whose feet can reach them: a
        // walker between rows r-1 and r has depth from (r-1)*16+10 upward.
        // Faces stay above the ground page but below figures on the plateau.
        .setDepth(layer.row * 16 + (layer.flat ? -7 : 1.5) + layer.tier * 0.01),
    );
  }
}

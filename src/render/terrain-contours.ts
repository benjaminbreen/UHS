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
  contourNoise,
  groundStyle,
  styledBankPixel,
  toneBank,
  type GroundStyle,
} from "./ground-style";
import { banks, soils } from "./habitat-raster";
import { defaultGrassArt } from "../content/graphics/grass-art";
import {
  paletteKey,
  type Colorway,
  type Ecology,
} from "../content/ecology/profiles";
import { TERRAIN_RISE } from "./terrain-projection";
import { copingColor, cragPixel, hasParapet, wallPixel } from "./edge-faces";
import { pavingGrade, pavingStonePixel } from "./paving-stones";
import style from "./generated/topography-style.json";
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
  for (let i = 0; i < FH; i++)
    for (let j = 0; j < FW; j++) {
      const px = j - PX,
        py = i - PY;
      const u = (px - 8) / 16,
        v = (py - 8) / 16;
      const x0 = Math.floor(u),
        y0 = Math.floor(v);
      const fx = ease(u - x0),
        fy = ease(v - y0);
      const a = tierAt(x0, y0),
        b = tierAt(x0 + 1, y0),
        c = tierAt(x0, y0 + 1),
        d = tierAt(x0 + 1, y0 + 1);
      const h =
        (a + (b - a) * fx) * (1 - fy) +
        (c + (d - c) * fx) * fy +
        (contourNoise(px + ox, py + oy, contour.scale) - 0.5) * contour.wobble;
      const cx = Math.floor(px / 16),
        cy = Math.floor(py / 16);
      const own = tierAt(cx, cy);
      // Interior ground is still blitted a whole tile at a time by the ground
      // page, so only the edge zone the wall pass owns may leave its tier.
      levels[i * FW + j] = ownsAt(cx, cy)
        ? Math.max(0, Math.min(maxTier, Math.round(h)))
        : own;
    }

  // Wobble on its own throws off single-pixel islands that read as artefacts.
  if (contour.smoothing) {
    const src = levels.slice();
    const counts = new Int32Array(maxTier + 1);
    const r = contour.smoothing;
    for (let i = 0; i < FH; i++)
      for (let j = 0; j < FW; j++) {
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
        const cx = Math.floor((j - PX) / 16),
          cy = Math.floor((i - PY) / 16);
        levels[i * FW + j] = ownsAt(cx, cy) ? best : tierAt(cx, cy);
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
    for (let py = -PY; py < FH - PY; py++)
      for (let px = -PX; px < FW - PX; px++) {
        const L = lvl(px, py);
        const row = Math.floor(py / 16);
        const cell = sample(Math.floor(px / 16), row);
        const sy = py - L * R;
        const i = (sy - top) * FW + px + PX;
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
      const turf =
        defaultGrassArt.palettes[eco] ?? defaultGrassArt.palettes.grassland;
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
  /** One face pixel below a rim: a settlement's wall, bare rock on a tall
   * natural drop, or the earth bank. */
  const facePixel = (
    upper: TopographyCell | undefined,
    trim: Trim,
    r: number,
    drop: number,
    wx: number,
    wy: number,
  ): readonly number[] => {
    if (upper?.edge) return wallPixel(upper.edge, r, drop, wx, trim.earth[4]);
    if (drop >= R * 2 && upper?.surface !== "sand" && upper?.surface !== "snow")
      return cragPixel(trim.earth[4], r, drop, wx, wy);
    const pixel = styledBankPixel(bank, r, drop, wx, wy);
    return pixel.kind === "earth"
      ? trim.earth[pixel.tone]
      : pixel.kind === "crease"
        ? trim.crease
        : pixel.kind === "stone"
          ? trim.earth[4]
          : r === 0
            ? trim.edge
            : trim.lip;
  };
  // Painted after the ground, which would otherwise overwrite them.
  const returns: [number, number, number, number, readonly number[]][] = [];
  const feet: [number, number, number, TopographyCell | undefined, Trim][] = [];
  const sideFace = contour.sideFace ?? 0;
  const hillshade = contour.hillshade ?? 0;
  const sampleAt = (x: number, y: number) =>
    sample(region ? x : Math.max(0, Math.min(width - 1, x)), y);
  /** The cell at (x, y) is a ramp whose high end faces `dir`. */
  const rampInto = (x: number, y: number, dir: "n" | "e" | "s" | "w") =>
    sampleAt(x, y)?.ramp === dir;
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
            ? lvl(px - 1, py)
            : L,
        east =
          lvl(px + 1, py) < L && !rampInto(cx + 1, row, "w")
            ? lvl(px + 1, py)
            : L,
        north =
          lvl(px, py - 1) < L && !rampInto(cx, row - 1, "s")
            ? lvl(px, py - 1)
            : L;
      const rim = west < L || east < L || north < L;
      if (cell?.ramp) continue;
      const cap = snow ? 25 : dry ? 9 : 4;
      const trim = trimFor(
        material?.habitat?.ecology,
        material?.surface,
        material?.habitat?.colorway,
      );
      if (ownsAt(Math.floor(px / 16), row) && !clipped(row, px, sy)) {
        const rgba = owner && surfaces.pixel(owner, px, py, L, lvl);
        if (rgba) {
          const spot = at(row, px, sy, true, L);
          if (spot) spot.layer.pixels.set(rgba, spot.i);
        } else paint(row, L, px, sy, cap);
        // A fixed contour cue stays on its own terrace, independent of sunlight.
        for (let k = 1; k <= 3; k++) {
          if (lvl(px, py - k) >= L) continue;
          shade(row, px, sy, [0, 0.16, 0.1, 0.05][k]);
          break;
        }
        // Contact shade thrown forward by whatever rises immediately behind.
        // Darkening the ground it falls on reads as a shadow; a tinted copy
        // of the bank reads as a smudge.
        for (let k = 1; k <= bank.shadow; k++) {
          if (lvl(px, py - k) <= L) continue;
          shade(row, px, sy, 0.32 * (1 - (k - 1) / Math.max(1, bank.shadow)));
          break;
        }
        // Lighter toward a drop, darker under a rise, so a plateau reads
        // before its edge does.
        if (hillshade)
          search: for (let d = 2; d <= 12; d += 2)
            for (const [dx, dy] of [
              [d, 0],
              [-d, 0],
              [0, d],
              [0, -d],
            ]) {
              const n = lvl(px + dx, py + dy);
              if (n === L) continue;
              shade(
                row,
                px,
                sy,
                (n < L ? -0.1 : 0.1) * hillshade * (1 - d / 14),
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
              : trim.edge,
        );
      else if (
        contour.sides &&
        (lvl(px - contour.sides, py) < L || lvl(px + contour.sides, py) < L)
      )
        paintRgb(row, L, px, sy, stone ? [122, 120, 110] : trim.sides);
      const below = rampInto(cx, row + 1, "n") ? L : lvl(px, py + 1);
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
      if (north < L && L) {
        occlude(row, L, px, sy - 1, 70);
        occlude(row, L, px, sy - 2, 45);
        occlude(row, L, px, sy - 3, 20);
      }
      // East and west drops show a sliver of the same face, so they read as
      // one object with the south wall rather than as a stray line.
      if (sideFace && L)
        for (const [n, side, tone] of [
          [west, -1, 0.86],
          [east, 1, 0.68],
        ]) {
          if (n >= L) continue;
          // Follow the edge south. Ending in a south face, it is the side of
          // a front-facing corner and earns its sliver; ending where the low
          // side rises, it faces away from the camera and shows only a rim.
          let j = 1;
          while (j < 48 && lvl(px, py + j) === L && lvl(px + side, py + j) < L)
            j++;
          // A run longer than the search is a straight wall: keep its sliver.
          if (j < 48 && lvl(px, py + j) >= L) {
            occlude(row, L, px + side, sy, 70);
            occlude(row, L, px + side * 2, sy, 35);
            continue;
          }
          for (let k = 1; k <= sideFace; k++) {
            const r = Math.round(((k - 1) / sideFace) * (R - 1));
            const c = facePixel(material, trim, r, R, sy + oy, px + ox);
            returns.push([
              row,
              L,
              px + side * k,
              sy,
              [c[0] * tone, c[1] * tone, c[2] * tone],
            ]);
            // Higher ground further south stands in front of this wall and
            // hides its lower part. Unclipped, a north-east facing edge hung
            // a strip over every step of the plateau below it.
            let bottom = sy + (L - n) * R;
            for (let j = 1; j <= (L - n) * R; j++) {
              const front = lvl(px + side * k, py + j);
              if (front > n) bottom = Math.min(bottom, py + j - front * R - 1);
            }
            returns.push([row, L, px + side * k, bottom, []]);
          }
        }
      if (below >= L) continue;
      const drop = (L - below) * R;
      // Water above water: the face is a fall, not a cut bank. Streaks run
      // down it, the lip is dark, and foam spreads at the foot.
      const lower = sample(cx, row + 1);
      if (cell?.surface === "water" && lower?.surface === "water") {
        const pale = [214, 240, 250],
          light = [150, 205, 232],
          mid = [96, 160, 208],
          deep = [56, 112, 168];
        const streak =
          ((px + ox) * 7 +
            Math.floor(
              contourNoise(Math.floor((px + ox) / 2), row + oy, 1, 107) * 3,
            )) %
          4;
        for (let r = 0; r < drop; r++) {
          const n = contourNoise(px + ox, r + (py + oy) * 3, 1, 109);
          const rgb =
            r === 0
              ? deep
              : r >= drop - 2
                ? n < 0.6
                  ? pale
                  : light
                : streak === 0
                  ? pale
                  : streak === 2
                    ? mid
                    : n > 0.8
                      ? pale
                      : light;
          paintRgb(row, L, px, sy + 1 + r, rgb);
        }
        continue;
      }
      for (let r = 0; r < drop; r++)
        paintRgb(
          row,
          L,
          px,
          sy + 1 + r,
          facePixel(material, trim, r, drop, px + ox, py + oy),
        );
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
    for (let y = top; y <= bottom; y++) paintRgb(row, tier, x, y, rgb);
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
          spot.layer.pixels[spot.i + 3] = 82 * (1 - k / bank.shadow);
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
  const soilFor = (ecology: string | undefined, colorway?: Colorway) =>
    soils[paletteKey((ecology ?? "grassland") as Ecology, colorway)] ??
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
      const turf =
        defaultGrassArt.palettes[
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
          const wy = py + oy;
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
            style === "slope"
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
            style !== "steps" &&
            // Distance from the high end: rows for a north ramp, columns
            // for one that climbs east or west.
            (along
              ? sy - first
              : dir === "w"
                ? px - cx * 16
                : 15 - (px - cx * 16)) <
              (noise(Math.floor((runPos + phase) / 2), 1, 101) < 0.5 ? 1 : 2);
          let rgb: readonly number[];
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
          else if (lip)
            rgb = style === "slope" ? trim.edge : n < 0.5 ? turf[0] : turf[5];
          else if (style === "slope") {
            // The ground's own turf carried down the incline, shaded toward
            // the foot, with one wandering trail and broken earth shoulders.
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
            const trail =
              runPx / 2 +
              (noise(Math.floor(rise / 7), runKey, 93) - 0.5) *
                Math.min(18, runPx * 0.35);
            const half = (runPx > 16 ? 3 : 2) + down * 2.5;
            const off = Math.abs(U - trail);
            const ground = surfaces.pixel(own, px, py, t, lvl) ?? turf[0];
            const tone =
              (0.84 + (1 - down) * 0.12) *
              (rise % 4 === 0 && n < 0.35 ? 0.9 : 1);
            if (edge < shoulder - 1 || (edge < shoulder && n < 0.5))
              rgb = [ground[0] * 0.72, ground[1] * 0.72, ground[2] * 0.72];
            else if (
              off < half &&
              noise(wx, wy, 107) > (off > half - 2 ? 0.55 : 0.2) &&
              noise(Math.floor(rise / 5), runKey, 109) > 0.2
            )
              rgb = n > 0.9 ? soil[3] : soil[2];
            else rgb = [ground[0] * tone, ground[1] * tone, ground[2] * tone];
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
          paintFlat(cy, t, px, sy, rgb);
        }
        // Scree: a few stones tumble off a cut or slope onto the ground at
        // its foot, so the ramp does not end on a ruled line.
        // Flanks: an earthen ramp falls away to either side as well, so each
        // open end widens toward the foot. A mound, not a rectangle.
        if (
          style === "slope" &&
          dir === "n" &&
          (px === cx * 16 || px === cx * 16 + 15)
        ) {
          const west = px === cx * 16;
          if (west ? before === 0 : after === 0) {
            const ground =
              surfaces.pixel(own, px, cy * 16 + 8, t, lvl) ?? turf[0];
            const f = west ? 0.8 : 0.64;
            for (let sy = first; sy <= last + 3; sy++) {
              const downRow = Math.min(
                1,
                (sy - first) / Math.max(1, last - first),
              );
              const reach = Math.round(
                downRow * 7 + noise(Math.floor(sy / 2), runKey, 115) * 1.5,
              );
              for (let k = 1; k <= reach; k++) {
                if (k === reach && noise(px + k, sy + oy, 117) < 0.5) continue;
                const g = f * (1 - (k / Math.max(1, reach)) * 0.12);
                paintRgb(
                  sy > last ? cy + 1 : cy,
                  t,
                  west ? px - k : px + k,
                  sy,
                  [ground[0] * g, ground[1] * g, ground[2] * g],
                );
              }
            }
          }
        }
        // The low end of a side-climbing slope fans onto the ground too.
        if (
          style === "slope" &&
          !along &&
          px === (dir === "w" ? cx * 16 + 15 : cx * 16)
        ) {
          const ground =
            surfaces.pixel(own, px, cy * 16 + 8, t, lvl) ?? turf[0];
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
        if (style === "slope" && dir === "n") {
          // An apron: the slope spills onto the lower ground in a ragged fan,
          // deepest mid-run and gone by the ends, fading by dither.
          const U = before * 16 + (px - cx * 16);
          const taper = Math.min(1, Math.min(U, runPx - 1 - U) / 10);
          const reach = Math.round(
            (2 + noise(Math.floor(wx / 5), runKey, 111) * 5) * taper,
          );
          for (let r = 1; r <= reach; r++) {
            const sy = last + r;
            if (noise(wx, sy + oy, 113) < (r - 1) / reach) continue;
            const ground =
              surfaces.pixel(own, px, cy * 16 + 15, t, lvl) ?? turf[0];
            paintFlat(cy + 1, t, px, sy, [
              ground[0] * 0.86,
              ground[1] * 0.86,
              ground[2] * 0.86,
            ]);
          }
        } else if (style === "cut" && along) {
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
        if (style === "slope" || style === "sand") {
          // The near flank of an earthen ramp is a battered grass slope, not
          // a cut: darker turf, falling a little past the cell, no lip.
          const ground =
            surfaces.pixel(own, px, cy * 16 + 15, t, lvl) ?? turf[0];
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

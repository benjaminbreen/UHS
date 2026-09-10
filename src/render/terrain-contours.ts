import { own, renderResources, type RenderResources } from "./resources";
import type Phaser from "phaser";
import type { TopographySample } from "../core/topography";
import type { TerrainRegion } from "./terrain-region";
import type { GroundTileData } from "./habitat-raster";
import { paintedGround } from "./material-edges";
import {
  contourNoise,
  groundStyle,
  styledBankPixel,
  toneBank,
  type GroundStyle,
} from "./ground-style";
import { soils } from "./habitat-raster";
import { TERRAIN_RISE } from "./terrain-projection";
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
  if (!c || !paintedGround(c) || c.feature === "paving" || c.field)
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
): ContourLayer[] {
  const { bank, contour } = style;
  const PX = 16,
    PY = 64;
  const FW = width * 16 + PX * 2,
    FH = height * 16 + PY * 2;

  // Cell tiers first: the interpolation below reads each of them four times.
  const cpad = 4,
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
  const paintRgb = (
    row: number,
    tier: number,
    px: number,
    sy: number,
    rgb: readonly number[],
  ) => {
    const spot = at(row, px, sy, false, tier);
    if (!spot) return;
    spot.layer.pixels[spot.i] = rgb[0];
    spot.layer.pixels[spot.i + 1] = rgb[1];
    spot.layer.pixels[spot.i + 2] = rgb[2];
    spot.layer.pixels[spot.i + 3] = 255;
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

  // Bank earth is the ecology's own soil, so temperate loam, desert sand and
  // tundra grey never share one brown. Cached per ecology: the tone adjustment
  // is the same for every pixel of a face.
  const earthRamps = new Map<string, [number, number, number][]>();
  const earthFor = (ecology: string | undefined, snow: boolean) => {
    const key = `${ecology ?? "grassland"}:${snow}`;
    let ramp = earthRamps.get(key);
    if (!ramp) {
      const base = snow
        ? [
            [120, 128, 132],
            [150, 160, 164],
            [186, 203, 208],
            [213, 220, 208],
          ]
        : (soils[(ecology ?? "grassland") as keyof typeof soils] ??
          soils.grassland);
      ramp = [0, 1, 2, 3].map((i) => toneBank(base[i], bank));
      earthRamps.set(key, ramp);
    }
    return ramp;
  };

  // Owned cells are skipped by the ground page, so their surface is copied
  // here from the tile the worker already rasterised, at each pixel's own
  // lifted row. That is what lets the edge cut inward without exposing the
  // tile-aligned ground underneath.
  const tiles = new Map(groundTiles.map((t) => [`${t.x},${t.y}`, t.pixels]));
  const wrap = (n: number) => ((n % 16) + 16) % 16;
  const surface = (
    row: number,
    tier: number,
    px: number,
    py: number,
    sy: number,
    fallback: number,
  ) => {
    const pixels = tiles.get(`${Math.floor(px / 16)},${row}`);
    if (!pixels) return paint(row, tier, px, sy, fallback);
    const spot = at(row, px, sy, true, tier);
    if (!spot) return;
    const src = (wrap(py) * 16 + wrap(px)) * 4;
    spot.layer.pixels.set(pixels.subarray(src, src + 4), spot.i);
  };

  const lo = region ? -1 : 0,
    hi = region ? height * 16 + 1 : height * 16;
  for (let px = -PX; px < width * 16 + PX; px++)
    for (let py = lo - 16; py < hi + 16; py++) {
      const L = lvl(px, py);
      const row = Math.floor(py / 16);
      const cell = sample(Math.floor(px / 16), row);
      const dry = cell?.surface === "dry" || cell?.surface === "sand";
      const snow = cell?.surface === "snow";
      const sy = py - L * R;
      const west = lvl(px - 1, py),
        east = lvl(px + 1, py),
        north = lvl(px, py - 1);
      const rim = west < L || east < L || north < L;
      const cap = snow ? 25 : dry ? 9 : 4;
      if (ownsAt(Math.floor(px / 16), row)) {
        surface(row, L, px, py, sy, cap);
        // Shade thrown forward by whatever rises immediately behind. A tinted
        // copy of the bank reads as a smudge; darkening the ground it actually
        // falls on reads as a shadow.
        for (let k = 1; k <= bank.shadow; k++) {
          if (lvl(px, py - k) <= L) continue;
          shade(row, px, sy, 0.42 * (1 - (k - 1) / Math.max(1, bank.shadow)));
          break;
        }
      }
      if (rim && L) paint(row, L, px, sy, snow ? 26 : dry ? 10 : 6);
      else if (
        contour.sides &&
        (lvl(px - contour.sides, py) < L || lvl(px + contour.sides, py) < L)
      )
        paint(row, L, px, sy, cap);
      const below = lvl(px, py + 1);
      if (below >= L) continue;
      const drop = (L - below) * R;
      const earth = earthFor(cell?.habitat?.ecology, snow);
      for (let r = 0; r < drop; r++) {
        const pixel = styledBankPixel(bank, r, drop, px + ox, py + oy);
        if (pixel.kind === "earth")
          paintRgb(row, L, px, sy + 1 + r, earth[pixel.tone]);
        else
          paint(
            row,
            L,
            px,
            sy + 1 + r,
            pixel.kind === "crease" ? (snow ? 23 : 14) : cap,
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
  const shadow = groundStyle()?.bank.shadow ?? 4;
  for (const layer of layers) {
    const key = `${prefix}-${layer.row}-${layer.tier}${layer.flat ? "-f" : ""}`;
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
    if (!layer.flat)
      own(
        resources,
        scene.add
          .image(layer.x + shadow * 0.5, layer.y + shadow, key)
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
        .setDepth(
          layer.row * 16 + (layer.flat ? 1.2 : 1.5) + layer.tier * 0.01,
        ),
    );
  }
}

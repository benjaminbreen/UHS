import { rasterHabitatTile } from "./habitat-raster";
import { shoreDistance, shorePixel } from "./material-edges";
import type { TopographyCell, TopographySample } from "../core/topography";
import { TERRAIN_RISE } from "./terrain-projection";
import {
  waterBand,
  waterDistance,
  waterHash,
  waterNoise,
  waterStyle,
  type WaterPalette,
} from "./water-style";

export type WaterEffect = {
  x: number;
  y: number;
  gx: number;
  gy: number;
  cell: TopographyCell;
  palette: WaterPalette;
  edges: { dx: number; dy: number; rocky: boolean }[];
  shoreline?: { x: number; y: number; distance: number }[];
};
export type WaterTileData = {
  x: number;
  y: number;
  pixels: Uint8ClampedArray;
  effect: WaterEffect;
};
const cardinal = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
] as const;
const mod = (n: number, d: number) => ((n % d) + d) % d;

/** A dug channel one cell wide, so the shoreline machinery does not apply.
 * Covers a dry one: the bed is empty but the cut and its berms are the same. */
export const isCanal = (c?: TopographyCell) =>
  !!c &&
  !c.bridge &&
  (c.dryChannel ||
    (c.surface === "water" && c.waterVisual?.kind === "canal"));

/** A cut channel seen from above and a little in front: a raised earth berm
 * outside each lip, a lit far (south/east) bank face, a shadow thrown by the
 * near bank onto the water, saturated river water with lane ripples, and the
 * channel a step below the ground. Water runs to the edge wherever the
 * neighbour is water or a culvert deck; elsewhere the end closes with a
 * berm. A perpendicular canal opens the berm over the middle for a junction. */
function rasterCanalTile(
  sample: TopographySample,
  x: number,
  y: number,
  gx: number,
  gy: number,
  cell: TopographyCell,
  palette: WaterPalette,
): WaterTileData {
  const rgb = (c: string) => [
    parseInt(c.slice(1, 3), 16),
    parseInt(c.slice(3, 5), 16),
    parseInt(c.slice(5, 7), 16),
  ];
  const mix = (a: number[], b: number[], t: number) =>
    a.map((v, k) => Math.round(v * (1 - t) + b[k] * t));
  const shade = (a: number[], v: number) => a.map((c) => Math.max(0, Math.min(255, c + v)));
  const open = (dx: number, dy: number) => {
    const n = sample(x + dx, y + dy);
    return !!n && (n.surface === "water" || isCanal(n) || !!n.bridge);
  };
  const openN = open(0, -1),
    openE = open(1, 0),
    openS = open(0, 1),
    openW = open(-1, 0);
  // Centreline through the cell, joining the midpoints of the open sides.
  // Two adjacent sides are joined directly rather than through the centre,
  // which is what lets a staircase of cells cut one straight diagonal instead
  // of stacking boxes. Neighbours always meet at an edge midpoint, so the
  // channel stays continuous. A junction routes through the centre; a dead
  // end stops twelve pixels in, where the closing berm used to fall.
  const mids: number[][] = [];
  if (openN) mids.push([8, 0]);
  if (openE) mids.push([16, 8]);
  if (openS) mids.push([8, 16]);
  if (openW) mids.push([0, 8]);
  const segments: number[][] =
    mids.length === 2
      ? [[...mids[0], ...mids[1]]]
      : mids.length === 1
        ? [[...mids[0], mids[0][0] + (8 - mids[0][0]) * 1.5, mids[0][1] + (8 - mids[0][1]) * 1.5]]
        : mids.length === 0
          ? [[4, 8, 12, 8]]
          : mids.map((m) => [...m, 8, 8]);
  // Nearest point on the centreline, as a signed offset across the channel.
  // Positive is the far (lit) bank: the normal pointing most to the south,
  // then most to the east, so a straight run keeps exactly its old shading.
  const nearest = (px: number, py: number) => {
    let best = Infinity,
      cross = 0,
      run = 0;
    for (const [ax, ay, bx, by] of segments) {
      const dx = bx - ax,
        dy = by - ay,
        len = Math.hypot(dx, dy) || 1;
      const ux = dx / len,
        uy = dy / len;
      const rx = px + 0.5 - ax,
        ry = py + 0.5 - ay;
      const t = Math.max(0, Math.min(len, rx * ux + ry * uy));
      const d = Math.hypot(rx - t * ux, ry - t * uy);
      if (d >= best) continue;
      const n = ux < 0 || (ux === 0 && uy > 0) ? [uy, -ux] : [-uy, ux];
      best = d;
      cross = rx * n[0] + ry * n[1] >= 0 ? d : -d;
      run = Math.round((gx + px) * ux + (gy + py) * uy);
    }
    return { cross, run };
  };
  // Profile across the channel, in pixels from the near edge:
  // 0-1 berm, 2 lip, 3-12 water, 13 lip, 14-15 berm.
  const crosses = new Float32Array(256);
  const runs = new Int32Array(256);
  const water = new Uint8Array(256);
  for (let py = 0; py < 16; py++)
    for (let px = 0; px < 16; px++) {
      const { cross, run } = nearest(px, py);
      crosses[py * 16 + px] = cross;
      runs[py * 16 + px] = run;
      water[py * 16 + px] = Math.abs(cross) <= 4.5 ? 1 : 0;
    }
  const at = (px: number, py: number) =>
    px < 0 || py < 0 || px > 15 || py > 15 ? undefined : water[py * 16 + px];
  // Water: the river's mid and deep tones, so a canal is the same water as
  // the river that feeds it, not a grey wash.
  const dry = !!cell.dryChannel;
  const still = rgb(palette.depths[3]),
    deep = rgb(palette.depths[4]),
    light = rgb(palette.depths[2]),
    glint = mix(still, rgb(palette.glint), 0.45),
    bermTop = rgb(palette.bank[2]),
    bermSide = rgb(palette.bank[1]),
    bermFoot = rgb(palette.bank[0]),
    faceLit = mix(rgb(palette.bank[1]), rgb(palette.bank[2]), 0.35),
    faceDark = shade(rgb(palette.bank[0]), -18);
  // Spoil reaches exactly as far as a straight run's tile, so a straight canal
  // is unchanged and a diagonal's berm follows the cut instead of filling the
  // tile's corners. The last pixels of it dither into the ground, which is
  // what stops the outer edge reading as a ruled line against the turf.
  const BERM = 7.5,
    FRINGE = 6.2;
  const ground = cell.habitat
    ? rasterHabitatTile(sample, x, y, gx / 16 - x, gy / 16 - y, undefined, {
        ...cell,
        surface: "grass",
        waterVisual: undefined,
        waterDepth: undefined,
      }).pixels
    : undefined;
  const pixels = new Uint8ClampedArray(1024);
  for (let py = 0; py < 16; py++)
    for (let px = 0; px < 16; px++) {
      const spread = Math.abs(crosses[py * 16 + px]);
      if (
        ground &&
        (spread > BERM ||
          (spread > FRINGE &&
            waterHash(gx + px, gy + py, 917) <
              (spread - FRINGE) / (BERM - FRINGE)))
      ) {
        const i = (py * 16 + px) * 4;
        pixels.set(ground.subarray(i, i + 4), i);
        continue;
      }
      // Cross-channel position on the old 0-15 profile, and distance along the
      // run, so every tone below is unchanged on a straight stretch.
      const c = Math.max(
        0,
        Math.min(15, Math.round(7.5 + crosses[py * 16 + px])),
      );
      const along = runs[py * 16 + px];
      let tone: number[];
      if (at(px, py) && dry) {
        // An empty bed: silt on the floor, cracked into plates, darker in the
        // lee of the near bank where the last water stood.
        const damp = at(px, py - 1) === 0 || at(px - 1, py) === 0;
        const plate = waterHash(Math.floor(along / 5), Math.floor(c / 2), 915);
        tone = mix(bermFoot, bermSide, plate * 0.5);
        if (damp) tone = shade(tone, -14);
        if (mod(along + Math.floor(plate * 5), 7) === 0 && c >= 5 && c <= 11)
          tone = shade(tone, -12);
      } else if (at(px, py)) {
        // Near (north/west) bank throws a two-pixel shadow onto the water;
        // ripples drift along the channel as short dashes in lanes.
        const shadow2 = at(px, py - 1) === 0 || at(px - 1, py) === 0;
        const shadow1 = !shadow2 && (at(px, py - 2) === 0 || at(px - 2, py) === 0);
        // Deep under the near bank, lighter toward the far, sunlit side.
        tone = shadow2 ? deep : shadow1 ? mix(deep, still, 0.5) : c >= 10 ? mix(still, light, 0.5) : still;
        const lane = Math.floor((c - 3) / 3);
        const phase = Math.floor(waterHash(lane, Math.floor(along / 14), 903) * 6);
        const dash = mod(along + lane * 5 + phase, 14);
        // Ripples: a two-pixel-high crest with a one-pixel tail, in lanes.
        if (!shadow2 && !shadow1 && c >= 5 && c <= 11) {
          if (dash < 3) tone = mix(tone, glint, dash === 1 ? 1 : 0.6);
          else if (dash === 3 && mod(c, 3) === 1) tone = mix(tone, glint, 0.35);
        }
        // The far bank's foot catches light along the water's edge.
        if (c === 12 && mod(along + phase, 5) !== 2) tone = mix(tone, glint, 0.35);
      } else {
        const inner =
          at(px + 1, py) === 1 ||
          at(px - 1, py) === 1 ||
          at(px, py + 1) === 1 ||
          at(px, py - 1) === 1;
        const near = c <= 2;
        if (inner) {
          // The lip: the near bank shows its shadowed face, the far bank
          // its lit face, and an end wall reads as the dark face too.
          tone = c >= 13 ? faceLit : faceDark;
          if (waterHash(Math.floor(along / 4), c, 905) > 0.7) tone = mix(tone, bermSide, 0.4);
        } else {
          // Berm: a ridge of piled earth. The near berm shows its lit crest
          // and shaded outer slope; the far berm its shaded crest toward us
          // and lit slope away. Grass creeps over the outer foot in tufts.
          const outer = near ? c === 0 : c === 15;
          const crest = near ? c === 1 : c === 14;
          tone = near
            ? outer ? bermSide : crest ? shade(bermTop, 6) : bermTop
            : outer ? shade(bermTop, 4) : crest ? bermSide : bermFoot;
          if (outer && waterHash(Math.floor(along / 3), c, 907) > 0.5) tone = mix(tone, bermFoot, 0.5);
          if (crest && waterHash(Math.floor(along / 4), c, 909) > 0.78) tone = mix(tone, bermSide, 0.6);
          // A trodden line runs along the far berm.
          if (!near && crest && mod(along + Math.floor(waterHash(Math.floor(along / 9), 0, 911) * 3), 7) === 0)
            tone = shade(tone, -10);
        }
      }
      pixels.set([...tone, 255], (py * 16 + px) * 4);
    }
  return {
    x,
    y,
    pixels,
    effect: {
      x: x * 16,
      y: y * 16 - cell.height * TERRAIN_RISE,
      gx,
      gy,
      cell,
      palette,
      edges: [],
    },
  };
}
export function rasterWaterTile(
  sample: TopographySample,
  x: number,
  y: number,
  ox: number,
  oy: number,
) {
  const cell = sample(x, y)!;
  const palette = waterStyle(cell),
    kind = cell.waterVisual?.kind ?? "river";
  const gx = (x + ox) * 16,
    gy = (y + oy) * 16;
  if (isCanal(cell)) return rasterCanalTile(sample, x, y, gx, gy, cell, palette);
  const edges = cardinal.flatMap(([dx, dy]) => {
    const n = sample(x + dx, y + dy);
    return n && n.surface !== "water" && !n.bridge
      ? [{ dx, dy, rocky: n.height > 0 }]
      : [];
  });
  // Decode colors once per tile rather than doing string parsing per pixel.
  const rgba = (c: string) => [
    parseInt(c.slice(1, 3), 16),
    parseInt(c.slice(3, 5), 16),
    parseInt(c.slice(5, 7), 16),
    255,
  ];
  const colors = [
    ...palette.depths,
    ...palette.texture,
    ...palette.bank,
    ...palette.stone,
  ].map(rgba);
  const pixels = new Uint8ClampedArray(16 * 16 * 4);
  const shoreline: { x: number; y: number; distance: number }[] = [];
  for (let py = 0; py < 16; py++)
    for (let px = 0; px < 16; px++) {
      const wx = gx + px,
        wy = gy + py;
      const distance = waterDistance(
        sample,
        x + (px + 0.5) / 16,
        y + (py + 0.5) / 16,
      );
      let index = waterBand(
        distance,
        kind,
        cell.waterVisual?.shoreWidth ?? 3,
        wx,
        wy,
      );
      // Quiet horizontal clusters, with long areas of uninterrupted base color.
      if (
        waterHash(Math.floor(wx / 8), Math.floor(wy / 4), 9) > 0.94 &&
        (wx & 7) > 1 &&
        (wx & 7) < 6 &&
        (wy & 3) === ((wx & 7) > 3 ? 1 : 2)
      )
        index += 5;
      const surfaceIndex = index;
      const edge = Math.min(
        99,
        ...edges.map(({ dx, dy }) =>
          dx === 1 ? 15 - px : dx === -1 ? px : dy === 1 ? 15 - py : py,
        ),
      );
      const lip = 1 + Math.floor(waterNoise(wx, wy, 12, 2) * 2);
      // A creek has no cut lip inside its water; its edge is on the turf.
      const creekTile = (cell.waterVisual?.shoreWidth ?? 3) < 1.2;
      if (!cell.bridge && !creekTile && edge < lip) index = 10 + (edge === 0 ? 1 : 0);
      if (
        !cell.bridge &&
        !creekTile &&
        edge === 0 &&
        waterHash(Math.floor(wx / 4), Math.floor(wy / 4), 17) > 0.66
      )
        index = 12;
      // Interrupted contact shade at the wet lip, leaving most banks softly lit.
      if (
        !cell.bridge &&
        !creekTile &&
        edge === lip &&
        waterHash(Math.floor(wx / 8), Math.floor(wy / 8), 18) > 0.56
      )
        index = edges.some((e) => e.rocky) ? 13 : 10;
      if (cell.habitat && !cell.bridge) {
        const d =
          distance < -1.2
            ? distance
            : shoreDistance(
                sample,
                x + (px + 0.5) / 16,
                y + (py + 0.5) / 16,
                ox,
                oy,
              );
        if (d > -0.5 && d < 0) shoreline.push({ x: px, y: py, distance: d });
        // Original grid-aligned lips are superseded by the shared shoreline.
        index = surfaceIndex;
        if (
          d > -0.12 ||
          (kind === "lake" && (cell.waterVisual?.shoreWidth ?? 3) < 1)
        ) {
          pixels.set([...shorePixel(cell, d, wx, wy), 255], (py * 16 + px) * 4);
          continue;
        }
      }
      pixels.set(colors[index], (py * 16 + px) * 4);
    }
  // Submerged stones are deliberately sparse, tinted by the water column.
  const depth = -(cell.waterVisual?.distance ?? -3);
  if (
    !cell.bridge &&
    cell.habitat?.colorway !== "swamp" &&
    depth > 0.4 &&
    depth < (kind === "sea" ? 8 : 3.8) &&
    waterHash(gx, gy, 44) > 0.86 &&
    waterHash(gx, gy, 44) < 0.94
  ) {
    const sx = 4 + Math.floor(waterHash(gx, gy, 45) * 7),
      sy = 4 + Math.floor(waterHash(gx, gy, 46) * 7);
    const rect = (
      x: number,
      y: number,
      w: number,
      h: number,
      color: string,
    ) => {
      const pixel = rgba(color);
      for (let py = y; py < y + h; py++)
        for (let px = x; px < x + w; px++)
          pixels.set(pixel, (py * 16 + px) * 4);
    };
    const wide = waterHash(gx, gy, 47) > 0.5;
    rect(sx - 2, sy, wide ? 5 : 4, 2, palette.submerged[0]);
    rect(sx - 1, sy - 1, wide ? 3 : 2, 4, palette.submerged[0]);
    rect(sx - 1, sy - 1, 2, 1, palette.submerged[1]);
    if (wide) {
      rect(sx + 3, sy + 3, 2, 1, palette.submerged[0]);
      rect(sx + 3, sy + 2, 1, 1, palette.submerged[1]);
    }
  }
  return {
    x,
    y,
    pixels,
    effect: {
      x: x * 16,
      y: y * 16 - (cell.bridge ? 0 : cell.height * TERRAIN_RISE),
      gx,
      gy,
      cell,
      palette,
      edges,
      shoreline: cell.habitat && !cell.bridge ? shoreline : undefined,
    } satisfies WaterEffect,
  };
}

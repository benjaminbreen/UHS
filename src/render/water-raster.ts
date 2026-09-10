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

/** Water one cell wide, so the shoreline machinery does not apply. */
export const isCanal = (c?: TopographyCell) =>
  !!c && c.surface === "water" && c.waterVisual?.kind === "canal" && !c.bridge;

/** A cut channel: straight two-pixel lips either side, still water between,
 * one highlight line along the flow. Water runs to the edge wherever the
 * neighbour is water or a culvert deck; elsewhere the lip closes the end. A
 * perpendicular canal opens the lip over the middle columns for a junction. */
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
  const axis = (cell.waterVisual?.flow[0] ?? 0) !== 0 ? "x" : "y";
  const open = (dx: number, dy: number) => {
    const n = sample(x + dx, y + dy);
    return !!n && (n.surface === "water" || !!n.bridge);
  };
  const openN = open(0, -1),
    openE = open(1, 0),
    openS = open(0, 1),
    openW = open(-1, 0);
  const [startOpen, endOpen, sideAOpen, sideBOpen] =
    axis === "x"
      ? [openW, openE, openN, openS]
      : [openN, openS, openW, openE];
  const water = new Uint8Array(256);
  for (let py = 0; py < 16; py++)
    for (let px = 0; px < 16; px++) {
      const a = axis === "x" ? px : py,
        c = axis === "x" ? py : px;
      let w = c >= 2 && c <= 13;
      if (w && !startOpen && a < 2) w = false;
      if (w && !endOpen && a > 13) w = false;
      if (a >= 2 && a <= 13) {
        if (sideAOpen && c < 2) w = true;
        if (sideBOpen && c > 13) w = true;
      }
      water[py * 16 + px] = w ? 1 : 0;
    }
  const at = (px: number, py: number) =>
    px < 0 || py < 0 || px > 15 || py > 15 ? undefined : water[py * 16 + px];
  const still = rgb(palette.depths[2]),
    shadow = rgb(palette.depths[3]),
    glint = mix(still, rgb(palette.glint), 0.45),
    lipOuter = rgb(palette.bank[2]),
    lipInner = rgb(palette.bank[1]),
    lipJoint = rgb(palette.bank[0]);
  const pixels = new Uint8ClampedArray(1024);
  for (let py = 0; py < 16; py++)
    for (let px = 0; px < 16; px++) {
      const wx = gx + px,
        wy = gy + py;
      const c = axis === "x" ? py : px;
      const along = axis === "x" ? wx : wy;
      let tone: number[];
      if (at(px, py)) {
        // The north and west lips cast a one-pixel shade onto the water.
        const shaded = at(px, py - 1) === 0 || at(px - 1, py) === 0;
        tone = shaded ? shadow : still;
        if (!shaded && c === 9 && waterHash(Math.floor(along / 6), 0, 901) > 0.25)
          tone = glint;
      } else {
        const inner =
          at(px + 1, py) === 1 ||
          at(px - 1, py) === 1 ||
          at(px, py + 1) === 1 ||
          at(px, py - 1) === 1;
        tone = inner ? lipInner : lipOuter;
        if (!inner && mod(along, 8) === 0 && (c === 0 || c === 15)) tone = lipJoint;
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
  if (kind === "canal" && !cell.bridge)
    return rasterCanalTile(sample, x, y, gx, gy, cell, palette);
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
      if (!cell.bridge && edge < lip) index = 10 + (edge === 0 ? 1 : 0);
      if (
        !cell.bridge &&
        edge === 0 &&
        waterHash(Math.floor(wx / 4), Math.floor(wy / 4), 17) > 0.66
      )
        index = 12;
      // Interrupted contact shade at the wet lip, leaving most banks softly lit.
      if (
        !cell.bridge &&
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

import { rasterHabitatTile } from "./habitat-raster";
import { shoreDistance, shorePixel } from "./material-edges";
import type { TopographyCell, TopographySample } from "../core/topography";
import { bareShelf } from "../core/water-field";
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
        ? [[...mids[0], 8, 8]]
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
const hex = (c: string) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
const ramp = (...c: string[]) => c.map(hex);
const ICE = ramp("#f1f5f4", "#dde9ec", "#c6dce3", "#a9c6d2", "#86a9ba", "#6f93a8");
const BERG = ramp("#f6fafb", "#dcedf3", "#b9d9e7", "#8fbdd4", "#5f93ad");
// Wet, flat, raised, sunlit rim, dark speck.
const MUD = ramp("#6c5140", "#7c5e49", "#8b6b52", "#a3825f", "#5a4436");
const MANGROVE_MUD = ramp("#4a3c2f", "#574735", "#64523d", "#7a6a52", "#3b3026");
// Light edge, water, shaded edge.
const CREEK = ramp("#b4e6dc", "#68c0c0", "#4e9fa6");
// Water, sky glint.
const POOL = ramp("#7393b0", "#c4d8e6");
const MARSH = ramp("#5f7449", "#6f8452", "#80955f", "#4b5a38");
const LAGOON = ramp("#d6f0d9", "#ace5d3", "#7fd6cb", "#5bc3c5", "#3f9fb4");
const CORAL = ramp("#8f7a5f", "#b99a72", "#cfb48a", "#d9cfb3");
const GRASS = ramp("#4f8a6b", "#629c79");
const FOAM = hex("#f3f6ee");
/** Ice, pack floes, icebergs, tidal mud, salt marsh and reefs. Undefined is
 * ordinary open water. `d` is the pixel's water distance in cells. */
export function specialWater(cell: TopographyCell, palette: WaterPalette, d: number, wx: number, wy: number, index: number, living = false): number[] | undefined {
  const v = cell.waterVisual;
  if (!v) return;
  if (v.icebergs && d < -4) {
    // One berg at most per six-cell block: a white top and its south face.
    const bx = Math.floor(wx / 96),
      by = Math.floor(wy / 96);
    if (waterHash(bx, by, 619) < 0.12) {
      const cx = bx * 96 + 24 + waterHash(bx, by, 620) * 48,
        cy = by * 96 + 24 + waterHash(bx, by, 622) * 40;
      const r = 12 + waterHash(bx, by, 624) * 14,
        tall = 5 + Math.floor(r / 3);
      const top = (px: number, py: number) =>
        Math.hypot(px - cx, (py - cy) * 1.5) < r + (waterNoise(px, py, 9, 621) - 0.5) * 12;
      if (top(wx, wy)) return top(wx, wy - 1) ? (waterHash(Math.floor(wx / 3), wy, 625) > 0.93 ? BERG[1] : BERG[0]) : BERG[1];
      for (let k = 1; k <= tall; k++)
        if (top(wx, wy - k))
          return k === tall || k === tall - 1 ? BERG[4] : wx < cx - r * 0.2 ? BERG[2] : BERG[3];
    }
  }
  if (v.ice === "solid" && !(v.kind === "sea" && d < -7 + (waterNoise(wx, wy, 14, 615) - 0.5) * 1.4)) {
    const drift = waterNoise(wx, wy, 22, 601) + (waterNoise(wx, wy, 7, 602) - 0.5) * 0.12;
    let rgb = drift > 0.6 ? ICE[0] : drift > 0.56 ? ICE[1] : d > -0.5 ? ICE[3] : ICE[2];
    if (drift <= 0.56 && d < -2 && waterNoise(wx, wy, 31, 603) < 0.3) rgb = ICE[3];
    if (
      drift <= 0.58 &&
      Math.abs(waterNoise(wx, wy, 44, 605) - 0.5) < 0.006
    )
      rgb = ICE[4];
    if (v.kind === "sea" && d < -6.4) rgb = waterHash(Math.floor(wx / 2), Math.floor(wy / 2), 609) > 0.5 ? ICE[0] : ICE[3];
    return rgb;
  }
  if (v.ice) {
    const floe = (px: number, py: number) => waterNoise(px, py, 40, 611) + (waterNoise(px, py, 11, 613) - 0.5) * 0.16 > 0.5;
    if (!floe(wx, wy)) return;
    if (!floe(wx, wy + 1)) return ICE[5];
    if (!floe(wx, wy + 2)) return ICE[4];
    if (!floe(wx, wy - 1)) return ICE[0];
    return waterNoise(wx, wy, 9, 617) > 0.62 ? ICE[0] : ICE[1];
  }
  if (v.shelf !== undefined) {
    const t = 1 + d / v.shelf;
    // Only water tiles are rastered: stay 3/4 tile (a pixel's farthest reach
    // from its centre) off the shore, or the flat ends on the grid.
    if (d > -0.75 - waterNoise(wx, wy, 10, 629) * 0.6 || t < (v.tide ?? 0)) return;
    const tropical = v.ecology === "tropical-woodland" || cell.habitat?.colorway === "mangrove";
    const mud = tropical ? MANGROVE_MUD : MUD;
    // Salt marsh above mid-tide on temperate shores, a small cliff at its foot.
    const edge = 0.6 + (waterNoise(wx, wy, 16, 635) - 0.5) * 0.25;
    if (!tropical && v.ecology !== "desert" && t > edge) {
      if (waterNoise(wx, wy, 11, 637) > 0.7) return waterNoise(wx, wy, 11, 637) > 0.74 ? hex(palette.depths[0]) : MARSH[3];
      if (t < edge + 0.03) return MARSH[3];
      const tuft = waterHash(Math.floor(wx / 3), Math.floor(wy / 2), 639);
      return tuft > 0.8 ? MARSH[2] : tuft < 0.15 ? MARSH[0] : MARSH[1];
    }
    // Creeks widen as they drain to the low-water line.
    const creek = Math.abs(waterNoise(wx, wy, 48, 633) - 0.5) / (0.012 + (1 - t) * 0.03);
    if (creek < 1) return creek < 0.6 ? CREEK[1] : creek < 0.85 ? CREEK[(wy & 1) && creek > 0.7 ? 2 : 0] : mud[0];
    // Pools lie on the low flats, the far lip lit, the water showing the sky.
    const pool = (x: number, y: number) => waterNoise(x, y, 22, 631) * 0.75 + waterNoise(x, y, 7, 632) * 0.25;
    if (t < 0.5 && pool(wx, wy) > 0.66) {
      if (pool(wx, wy - 1) <= 0.66) return mud[0];
      return (wy % 3) === 0 && waterHash(Math.floor(wx / 4), wy, 641) > 0.75 ? POOL[1] : POOL[0];
    }
    // Low lobes of drying mud stand out of the wet, sunlit along their top edge.
    const lobe = (x: number, y: number) =>
      waterNoise(x + (waterNoise(x, y, 17, 645) - 0.5) * 20, y, 30, 643) * 0.7 + waterNoise(x, y, 11, 644) * 0.3 + (t - 0.5) * 0.3;
    const here = lobe(wx, wy), speck = waterHash(wx, wy, 647);
    if (here < 0.4) return speck > 0.985 ? POOL[1] : mud[0];
    if (here > 0.58) return lobe(wx, wy - 1) <= 0.58 || speck > 0.97 ? mud[3] : mud[2];
    return speck > 0.975 ? mud[3] : speck < 0.02 ? mud[4] : mud[1];
  }
  if (v.reef) {
    const crest = 5.5 + (waterNoise(wx, wy, 60, 645) - 0.5) * 3;
    if (v.reef === "outer" && d < -crest - 0.5) return living ? undefined : hex(palette.depths[Math.min(4, index + 2)]);
    if (v.reef === "outer" && d < -crest + 0.5) {
      const foam = waterHash(Math.floor(wx / 3), Math.floor(wy / 2), 647);
      return d < -crest - 0.1 && foam > 0.35 ? FOAM : foam > 0.7 ? CORAL[3] : CORAL[2];
    }
    if (d < -1.2 && d > -5 && waterNoise(wx, wy, 30, 649) > 0.7)
      return GRASS[(waterHash(Math.floor(wx / 2), wy, 651) > 0.7 ? 1 : 0)];
    if (v.reef === "outer" && d < -1.2 && waterHash(Math.floor(wx / 5), Math.floor(wy / 4), 653) > 0.96 && (wx % 5) && (wy % 4))
      return CORAL[(wy % 4) === 1 ? 2 : 1];
    if (living) return;
    const depth = Math.min(4, Math.floor(-d / (v.reef === "lagoon" ? 2.2 : 1.6) + (waterNoise(wx, wy, 30, 655) - 0.5) * 1.2));
    return LAGOON[Math.max(0, depth)];
  }
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
      const special = cell.bridge ? undefined : specialWater(cell, palette, distance, wx, wy, index);
      pixels.set(special ? [...special, 255] : colors[index], (py * 16 + px) * 4);
    }
  // Submerged stones are deliberately sparse, tinted by the water column.
  const depth = -(cell.waterVisual?.distance ?? -3);
  if (
    !cell.bridge &&
    cell.habitat?.colorway !== "swamp" &&
    !cell.waterVisual?.ice &&
    !cell.waterVisual?.reef &&
    !bareShelf(cell.waterVisual) &&
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

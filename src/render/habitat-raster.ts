import { edgeTufts, groundMotif, materialGrain } from "./ground-motifs";
import { rasterStreetTile } from "./street-raster";
import { transitionPixel, fringePixel, groundClumps } from "./terrain-tiles";
import {
  paintedGround,
  pathField,
  shoreDistance,
  shoreWidth,
  shorePixel,
} from "./material-edges";
import type { Ecology } from "../content/ecology/profiles";
import type { TopographyCell, TopographySample } from "../core/topography";
import { waterHash as hash, waterNoise as noise } from "./water-style";

export type GroundTileData = {
  x: number;
  y: number;
  pixels: Uint8ClampedArray;
};
// Turf, dry turf, damp hollow, mineral, litter, blade shadow, blade light.
// Close values keep the ground subordinate to actors; hue carries material identity.
const ramps: Record<Ecology, string[]> = {
  grassland: [
    "#819c42",
    "#b9b45f",
    "#64883b",
    "#c9b981",
    "#827d4d",
    "#3f6335",
    "#d2cd71",
  ],
  tundra: [
    "#9ba25d",
    "#b8b47a",
    "#899754",
    "#bdbb99",
    "#92936a",
    "#5c704b",
    "#d0ca88",
  ],
  "boreal-woodland": [
    "#859855",
    "#aaa674",
    "#7e925e",
    "#a9ae98",
    "#777b57",
    "#365b47",
    "#c1c97c",
  ],
  "temperate-woodland": [
    "#7e9b4c",
    "#a8a269",
    "#658645",
    "#aaa789",
    "#807750",
    "#355d39",
    "#c5cf70",
  ],
  "tropical-woodland": [
    "#719647",
    "#a29e60",
    "#548340",
    "#a59e7c",
    "#78764b",
    "#295c39",
    "#b8d167",
  ],
  wetland: [
    "#7c924a",
    "#a1a36b",
    "#607f46",
    "#9c9b70",
    "#777b58",
    "#365d41",
    "#bec570",
  ],
  "dry-scrub": [
    "#a1aa50",
    "#bcb56b",
    "#879749",
    "#bdb18f",
    "#9e9065",
    "#506e35",
    "#ddd179",
  ],
  desert: [
    "#d1b77a",
    "#e0c58e",
    "#b4ae77",
    "#b8a78b",
    "#b09b73",
    "#85834e",
    "#e1cfa1",
  ],
};
// Trodden earth: contact shadow, shoulder, body, worn center. Kept close in
// value to that ecology's turf and always less saturated than it, so a road
// reads as bare ground rather than as a line drawn over the ground.
const soilRamps: Record<Ecology, string[]> = {
  grassland: ["#8d7a4d", "#a99263", "#c0a97b", "#d0ba8e", "#948c75"],
  tundra: ["#7d7359", "#958b71", "#a99f85", "#b8af95", "#87857a"],
  "boreal-woodland": ["#75694c", "#8e8063", "#a4957a", "#b4a68b", "#7f8071"],
  "temperate-woodland": ["#7e6a4a", "#98815d", "#b09774", "#c1a988", "#8b8371"],
  "tropical-woodland": ["#875e3c", "#a17651", "#b78c64", "#c69a73", "#8b7d68"],
  wetland: ["#6b6449", "#847c5e", "#998f72", "#a89e81", "#7a7b6c"],
  "dry-scrub": ["#977f52", "#b09769", "#c4ac80", "#d3bc92", "#9a927c"],
  desert: ["#b39868", "#c9b083", "#dac298", "#e7d3ab", "#b3a68c"],
};
const decode = (s: string) => [
  parseInt(s.slice(1, 3), 16),
  parseInt(s.slice(3, 5), 16),
  parseInt(s.slice(5, 7), 16),
];
const colors = Object.fromEntries(
  Object.entries(ramps).map(([k, v]) => [k, v.map(decode)]),
) as Record<Ecology, number[][]>;
const soils = Object.fromEntries(
  Object.entries(soilRamps).map(([k, v]) => [k, v.map(decode)]),
) as Record<Ecology, number[][]>;
export function naturalGround(c: TopographyCell) {
  return (
    !!c.habitat &&
    !c.bridge &&
    !c.ramp &&
    !c.feature &&
    ["grass", "dry", "damp", "sand", "snow", "gravel"].includes(c.surface) &&
    (!c.waterVisual || c.waterVisual.distance >= c.waterVisual.shoreWidth + 1)
  );
}
/** Original native-pixel materials; sampled in the worker and baked into chunk pages.
 * No tile-shaped color patches, per-frame noise or additional ground GameObjects. */
export function rasterHabitatTile(
  sample: TopographySample,
  x: number,
  y: number,
  ox: number,
  oy: number,
): GroundTileData {
  const cell = sample(x, y)!;
  if (cell.feature === "paving") return rasterStreetTile(sample, x, y, ox, oy);
  const h = cell.habitat!;
  const palette = colors[h.ecology];
  const pixels = new Uint8ClampedArray(16 * 16 * 4);
  const gx = (x + ox) * 16,
    gy = (y + oy) * 16;
  const frozen = cell.surface === "snow";
  const bandOf = (a: typeof h) =>
    a.exposed > 0.65
      ? 3
      : a.exposed > 0.4
        ? 1
        : a.wet > 0.61
          ? 2
          : a.ecology.includes("woodland") &&
              a.cover > (a.layeredForest ? 0.42 : 0.6)
            ? 4
            : 0;
  // Remove unsupported one-cell islands before choosing transition tiles.
  const stableBand = (xx: number, yy: number) => {
    const c = sample(xx, yy),
      own = bandOf(c?.habitat ?? h);
    const neighbors = [
      [0, -1],
      [1, 0],
      [0, 1],
      [-1, 0],
    ].map(([dx, dy]) => bandOf(sample(xx + dx, yy + dy)?.habitat ?? h));
    return neighbors.filter((b) => b === own).length === 0
      ? neighbors.sort(
          (a, b) =>
            neighbors.filter((n) => n === b).length -
            neighbors.filter((n) => n === a).length,
        )[0]
      : own;
  };
  const bands = Array.from({ length: 9 }, (_, i) =>
    stableBand(x + (i % 3) - 1, y + Math.floor(i / 3) - 1),
  );
  const put = (px: number, py: number, rgb: number[], shade = 0) => {
    if (px < 0 || py < 0 || px >= 16 || py >= 16) return;
    const i = (py * 16 + px) * 4;
    for (let k = 0; k < 3; k++) pixels[i + k] = rgb[k] + shade;
    pixels[i + 3] = 255;
  };
  for (let py = 0; py < 16; py++)
    for (let px = 0; px < 16; px++) {
      const wx = gx + px,
        wy = gy + py;
      const ax = px < 8 ? 0 : 1,
        ay = py < 8 ? 0 : 1;
      const tx = (px + 8) % 16,
        ty = (py + 8) % 16;
      const corners = [
        bands[ay * 3 + ax],
        bands[ay * 3 + ax + 1],
        bands[(ay + 1) * 3 + ax],
        bands[(ay + 1) * 3 + ax + 1],
      ];
      const bandAt = (u: number, v: number) => {
        let result = 0;
        for (const candidate of [1, 2, 3, 4]) {
          const mask = corners.reduce(
            (m, b, i) => m | (b === candidate ? 1 << i : 0),
            0,
          );
          if (
            transitionPixel(
              mask,
              Math.max(0, Math.min(15, u)),
              Math.max(0, Math.min(15, v)),
            )
          )
            result = candidate;
        }
        return result;
      };
      // Small authored edge offsets break a ruler-straight seam without
      // moving the underlying habitat footprint by more than two pixels.
      const steps = [0, 0, 1, 1, 0, -1, -1, 0];
      const jx =
        steps[
          (Math.floor(wy / 3) +
            Math.floor(hash(Math.floor(wx / 32), 0, 381) * 8)) &
            7
        ];
      const jy =
        steps[
          (Math.floor(wx / 3) +
            Math.floor(hash(0, Math.floor(wy / 32), 383) * 8)) &
            7
        ];
      const band = bandAt(tx + jx, ty + jy);
      let rgb = palette[band];
      // Interlocking clusters only within four native pixels of a real seam.
      // The interiors of transition tiles remain solid habitat colors.
      const other = [
        [-4, 0],
        [4, 0],
        [0, -4],
        [0, 4],
      ]
        .map(([dx, dy]) => bandAt(tx + jx + dx, ty + jy + dy))
        .find((b) => b !== band);
      if (
        other !== undefined &&
        fringePixel(
          wx,
          wy,
          Math.floor(hash(Math.floor(wx / 9), Math.floor(wy / 11), 351) * 4),
        )
      ) {
        rgb = palette[band].map((v, k) =>
          Math.round((v + palette[other][k]) / 2),
        );
      }
      if (
        h.season === "autumn" &&
        !["desert", "tropical-woodland"].includes(h.ecology)
      )
        rgb = rgb.map((v, k) => Math.round(v * 0.88 + palette[1][k] * 0.12));
      if (frozen)
        rgb =
          band === 3
            ? [181, 194, 191]
            : band === 2
              ? [195, 208, 204]
              : [215, 223, 207];
      const grain = materialGrain(wx, wy);
      const grainShade = band === 3 ? [0, -9, 7][grain] : [0, -7, 8][grain];
      put(px, py, rgb, frozen ? grainShade * 0.3 : grainShade);
      // Texture describes the material: little faceted stones or composed turf.
      // No blanket of independently varied pixels behind these marks.
      const ink = groundMotif(
        band === 3
          ? "stone"
          : h.ecology === "desert" || frozen || (h.layeredForest && band === 4)
            ? "earth"
            : "turf",
        wx,
        wy,
      );
      if (
        h.layeredForest &&
        band === 4 &&
        !frozen &&
        hash(Math.floor(wx / 9), Math.floor(wy / 9), 917) > 0.7
      ) {
        const lx = ((wx % 9) + 9) % 9,
          ly = ((wy % 9) + 9) % 9;
        if (
          (ly === 3 && lx >= 3 && lx <= 5) ||
          (ly === 4 && lx >= 2 && lx <= 4)
        )
          put(px, py, palette[4], ly === 3 ? 14 : -9);
      }
      if (ink) {
        const mineral = band === 3;
        const shade = mineral ? [0, -29, -6, 22][ink] : [0, -6, 4, 11][ink];
        put(px, py, rgb, frozen ? Math.round(shade * 0.4) : shade);
      }
    }
  // Compose material boundaries over the same habitat underpainting. Only natural
  // edges are reconstructed; raised terrain and paving keep their own outlines.
  const hasPath =
    !!cell.pathArt?.length ||
    Array.from({ length: 9 }, (_, i) =>
      sample(x + (i % 3) - 1, y + Math.floor(i / 3) - 1),
    ).some((n) => n?.surface === "soil" && n.height === cell.height);
  const nearShore =
    !!cell.waterVisual &&
    cell.waterVisual.distance < cell.waterVisual.shoreWidth + 1.5;
  if (paintedGround(cell) && (hasPath || nearShore)) {
    const soil = soils[h.ecology];
    for (let py = 0; py < 16; py++)
      for (let px = 0; px < 16; px++) {
        const xx = x + (px + 0.5) / 16,
          yy = y + (py + 0.5) / 16,
          wx = gx + px,
          wy = gy + py;
        const field = hasPath ? pathField(sample, xx, yy, ox, oy) : undefined;
        const path = field?.coverage ?? 0;
        // Two grouped hashes sum to a tapered offset of every wear threshold,
        // so turf survives a few pixels inside the road, grit strays a few
        // pixels out of it, and the interior bands interlock as well. Single
        // thresholds gave one clean contour and three ruled stripes.
        const interlock =
          (hash(Math.floor(wx / 2), Math.floor(wy / 2), 437) +
            hash(Math.floor(wx / 3), Math.floor(wy / 3), 439) -
            1) *
            0.08 +
          (noise(wx, wy, 21, 463) - 0.5) * 0.06;
        // Wear is not even along a road: whole stretches sit a band lighter or
        // darker than their neighbours.
        const worn = path + interlock + (noise(wx, wy, 96, 467) - 0.5) * 0.08;
        if (field && worn > 0.48) {
          const shoulder = 0.68 + (noise(wx, wy, 23, 377) - 0.5) * 0.055;
          // One broken native pixel of contact shadow. A continuous dark rim,
          // however wide, is what made the corridor read as an outlined shape.
          const contact =
            worn < 0.515 &&
            hash(Math.floor(wx / 3), Math.floor(wy / 3), 441) > 0.5;
          const wide = field.radius > 0.62;
          const band = contact
            ? 0
            : worn < shoulder
              ? 1
              : worn > 0.87 && wide
                ? 3
                : 2;
          let tone = soil[wide ? band : Math.max(1, band)];
          const ink = groundMotif("earth", wx, wy);
          // A slow wash keeps the treadway from reading as one flat fill.
          let shade =
            Math.round((noise(wx, wy, 44, 461) - 0.5) * 11) +
            (ink ? [0, -9, 4, 13][ink] : [0, -5, 6][materialGrain(wx, wy)]);
          // Cart ruts either side of the crown on wagon-width roads, dashed so
          // they never read as two ruled lines.
          if (
            field.radius > 0.95 &&
            field.cross > 0.4 &&
            field.cross < 0.55 &&
            hash(Math.floor(wx / 4), Math.floor(wy / 5), 443) > 0.58
          )
            shade -= 6;
          // Grit collects off the treadway, not on it.
          if (field.cross > 0.46) {
            const bx = Math.floor(wx / 7),
              by = Math.floor(wy / 6);
            if (hash(bx, by, 447) > 0.82) {
              const sx = bx * 7 + 1 + Math.floor(hash(bx, by, 449) * 4),
                sy = by * 6 + 1 + Math.floor(hash(bx, by, 451) * 3);
              if (wx >= sx && wx <= sx + 1 && wy >= sy && wy <= sy + 1) {
                tone = soil[4];
                shade = wy === sy ? 11 : -14;
              }
            }
          }
          if (frozen)
            tone = tone.map((v, k) =>
              Math.round(v * 0.45 + [196, 204, 202][k] * 0.55),
            );
          put(px, py, tone, contact ? 0 : shade);
        } else if (nearShore && cell.surface !== "soil") {
          const distance = shoreDistance(sample, xx, yy, ox, oy);
          const jitter = (noise(wx, wy, 5, 333) - 0.5) * 0.32;
          const width = shoreWidth(sample, xx, yy);
          if (distance < width + jitter)
            put(px, py, shorePixel(cell, distance, wx, wy));
          // Intermittent grass teeth and stones, not a continuous pale border.
          else if (
            distance < width + 0.18 &&
            hash(Math.floor(wx / 3), Math.floor(wy / 3), 335) > 0.72
          )
            put(px, py, palette[5], 12);
        } else if (path > 0.3) {
          // Trampled verge. Turf loses color as it approaches the road instead
          // of meeting the worn ground at full strength.
          const w = ((path - 0.3) / 0.18) * 0.34;
          const i = (py * 16 + px) * 4;
          for (let k = 0; k < 3; k++)
            pixels[i + k] = Math.round(
              pixels[i + k] * (1 - w) + soil[1][k] * w,
            );
        }
      }
  }
  // Tufts lining a path margin are what make it read as worn ground rather
  // than as a filled shape. They root on the verge and lean out over the worn
  // edge, so the silhouette of the road is broken by grass, not by dithering
  // alone. Several per tile where the margin crosses it, none where it does not.
  const tufted = ["desert", "tundra"].includes(h.ecology)
    ? 0
    : ["dry-scrub", "wetland"].includes(h.ecology)
      ? 0.42
      : 0.68;
  // Colonies, not a continuous fringe: whole stretches of margin stay bare.
  const colony = hash(Math.floor(gx / 26), Math.floor(gy / 26), 431) > 0.34;
  if (hasPath && !frozen && tufted && colony && h.exposed < 0.65) {
    let placed = 0;
    for (const [px, py] of [
      [2, 5],
      [8, 4],
      [13, 6],
      [5, 9],
      [11, 10],
      [1, 13],
      [7, 14],
      [14, 12],
    ]) {
      if (placed > 1) break;
      const coverage = pathField(
        sample,
        x + (px + 0.5) / 16,
        y + (py + 0.5) / 16,
        ox,
        oy,
      ).coverage;
      // A window straddling the boundary: the base may sit just inside the
      // worn ground, which is where an overlapping tuft comes from.
      if (
        coverage < 0.33 ||
        coverage > 0.6 ||
        hash(gx + px, gy + py, 425) > tufted
      )
        continue;
      const glyph =
        edgeTufts[Math.floor(hash(gx + px, gy + py, 427) * edgeTufts.length)];
      const flip = hash(gx + px, gy + py, 429) > 0.5;
      // Blade body is fresher turf than the surrounding sward; the lit tip
      // stays short of the full highlight or the tufts read as straw.
      const tones = [
        palette[5],
        palette[5],
        palette[2],
        palette[0].map((v, k) => Math.round((v + palette[6][k]) / 2)),
      ];
      for (let yy = 0; yy < glyph.length; yy++)
        for (let xx = 0; xx < glyph[yy].length; xx++) {
          const ink = Number(glyph[yy][xx]);
          if (ink)
            put(
              px + (flip ? glyph[yy].length - 1 - xx : xx) - 2,
              py + yy - 4,
              tones[ink],
            );
        }
      placed++;
    }
  }
  // Sparse authored 2–6 pixel silhouettes, leaving the majority of tiles unmarked.
  const chance = hash(x + ox, y + oy, 167);
  const accent = frozen
    ? 0.025
    : h.kind === "exposed"
      ? 0.13
      : h.kind === "hollow"
        ? 0.24
        : 0.18;
  const safeAccent =
    cell.surface !== "soil" &&
    (!cell.waterVisual ||
      cell.waterVisual.distance > cell.waterVisual.shoreWidth + 0.5);
  if (
    chance < accent &&
    safeAccent &&
    (!hasPath || pathField(sample, x + 0.5, y + 0.6, ox, oy).coverage < 0.3)
  ) {
    const px = 4 + Math.floor(hash(x + ox, y + oy, 18) * 6),
      py = 7 + Math.floor(hash(x + ox, y + oy, 19) * 5);
    const dark = palette[5],
      light = palette[6];
    const mineral = h.kind === "exposed" || h.ecology === "desert" || frozen;
    if (
      h.kind === "hollow" &&
      h.wet > 0.85 &&
      h.ecology !== "desert" &&
      !frozen &&
      chance < 0.045
    ) {
      // Authored walkable wet patch; larger standing pools belong to terrain.
      const pool = ["00111100", "01111110", "11111111", "01111110", "00111000"];
      for (let yy = 0; yy < 5; yy++)
        for (let xx = 0; xx < 8; xx++)
          if (pool[yy][xx] === "1")
            put(
              px + xx - 3,
              py + yy - 3,
              yy === 0
                ? [146, 168, 157]
                : yy === 4
                  ? [102, 120, 99]
                  : [109, 148, 146],
            );
      put(px - 1, py - 2, [174, 191, 173]);
      put(px, py - 2, [174, 191, 173]);
    } else if (h.ecology === "desert" && h.kind !== "exposed") {
      for (const [dx, dy] of [
        [0, 0],
        [1, 0],
        [2, 0],
        [3, -1],
        [4, -1],
      ])
        put(px + dx, py + dy, palette[1], -4);
    } else if (mineral) {
      // The base pass already places readable stones inside mineral bands.
    } else if (h.kind === "woodland") {
      for (const [dx, dy] of [
        [0, 0],
        [1, 0],
        [3, -2],
        [4, -2],
      ])
        put(px + dx, py + dy, palette[1], -6);
    } else {
      const glyph =
        groundClumps[
          Math.floor(hash(x + ox, y + oy, 359) * groundClumps.length)
        ];
      const tones = [
        dark,
        dark,
        palette[2].map((v, k) => v + (k === 1 ? 8 : 0)),
        light,
      ];
      for (let yy = 0; yy < glyph.length; yy++)
        for (let xx = 0; xx < glyph[yy].length; xx++) {
          const ink = Number(glyph[yy][xx]);
          if (ink) put(px + xx - 3, py + yy - 6, tones[ink]);
        }
    }
  }
  return { x, y, pixels };
}

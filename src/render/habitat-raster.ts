import {
  edgeTufts,
  earthSpeckle,
  groundMotif,
  materialGrain,
  turfTick,
} from "./ground-motifs";
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
const mod = (n: number, d: number) => ((n % d) + d) % d;

export type GroundTileData = {
  x: number;
  y: number;
  pixels: Uint8ClampedArray;
};
// Turf, dry turf, damp hollow, mineral, litter, blade shadow, blade light.
// Close values keep the ground subordinate to actors; hue carries material identity.
const ramps: Record<Ecology, string[]> = {
  grassland: [
    "#63a64b",
    "#7fbf58",
    "#52963f",
    "#b38a5b",
    "#a97c50",
    "#3a7a34",
    "#a3d86a",
  ],
  tundra: [
    "#8fa45c",
    "#a9b26f",
    "#7d9552",
    "#a89a7a",
    "#8c8d64",
    "#587047",
    "#c9cc82",
  ],
  "boreal-woodland": [
    "#699b52",
    "#83b060",
    "#568a48",
    "#9a7a55",
    "#8f7050",
    "#3d6b3c",
    "#a3c96e",
  ],
  "temperate-woodland": [
    "#5c9f48",
    "#78b856",
    "#4a8d3d",
    "#a98159",
    "#9d7449",
    "#376f33",
    "#9cd166",
  ],
  "tropical-woodland": [
    "#4f9e42",
    "#6bb64f",
    "#3f8a38",
    "#9a6a45",
    "#8d6642",
    "#2f6c31",
    "#8ecd5e",
  ],
  wetland: [
    "#5e9d4a",
    "#7cb45b",
    "#4a8842",
    "#8f7a52",
    "#8a7450",
    "#356a37",
    "#9fcf6c",
  ],
  "dry-scrub": [
    "#8fad4f",
    "#aabf62",
    "#7a9c47",
    "#b48f5c",
    "#ad8a5a",
    "#557a36",
    "#cfdc78",
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
  grassland: ["#8f6c46", "#ab8759", "#bf9b6c", "#cca97a", "#9d8f72"],
  tundra: ["#7d7359", "#958b71", "#a99f85", "#b8af95", "#87857a"],
  "boreal-woodland": ["#75694c", "#8e8063", "#a4957a", "#b4a68b", "#7f8071"],
  "temperate-woodland": ["#7d6242", "#977b55", "#ae916b", "#bea27e", "#8a826e"],
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
  // Grassy ecologies expose brown earth; dry and cold ones expose stone.
  const mineralGround = ["desert", "tundra"].includes(h.ecology);
  // Band 5 is tilled ground: earth in any ecology, never stone.
  const bandOf = (a: typeof h, c?: TopographyCell) =>
    c?.feature === "field"
      ? 5
      : a.exposed > 0.65
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
      own = bandOf(c?.habitat ?? h, c);
    const neighbors = [
      [0, -1],
      [1, 0],
      [0, 1],
      [-1, 0],
    ].map(([dx, dy]) => {
      const n = sample(xx + dx, yy + dy);
      return bandOf(n?.habitat ?? h, n);
    });
    return neighbors.filter((b) => b === own).length === 0
      ? neighbors.sort(
          (a, b) =>
            neighbors.filter((n) => n === b).length -
            neighbors.filter((n) => n === a).length,
        )[0]
      : own;
  };
  const bandCache = new Map<number, number>();
  const bandTile = (xx: number, yy: number) => {
    const key = (xx - x + 8) * 32 + (yy - y + 8);
    let b = bandCache.get(key);
    if (b === undefined) bandCache.set(key, (b = stableBand(xx, yy)));
    return b;
  };
  // Band of any native pixel near this tile, including a two-pixel apron into
  // the neighbours, so edges can be traced without seams at tile borders.
  const bandAt = (u: number, v: number) => {
    const cx = Math.floor((u + 8) / 16),
      cy = Math.floor((v + 8) / 16);
    const tx = mod(u + 8, 16),
      ty = mod(v + 8, 16);
    const corners = [
      bandTile(x + cx - 1, y + cy - 1),
      bandTile(x + cx, y + cy - 1),
      bandTile(x + cx - 1, y + cy),
      bandTile(x + cx, y + cy),
    ];
    let result = 0;
    for (const candidate of [1, 2, 3, 4, 5]) {
      const mask = corners.reduce(
        (m, b, i) => m | (b === candidate ? 1 << i : 0),
        0,
      );
      if (transitionPixel(mask, tx, ty)) result = candidate;
    }
    return result;
  };
  // Small authored edge offsets break a ruler-straight seam without
  // moving the underlying habitat footprint by more than two pixels.
  const steps = [0, 0, 1, 1, 0, -1, -1, 0];
  const jitteredBand = (px: number, py: number) => {
    const wx = gx + px,
      wy = gy + py;
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
    return bandAt(px + jx, py + jy);
  };
  const grassy = !mineralGround && !frozen;
  // 18x18 apron: band per pixel, and 1 = bare earth band, 2 = trodden soil.
  const apron = new Uint8Array(18 * 18);
  const earth = new Uint8Array(18 * 18);
  const at = (px: number, py: number) => (py + 1) * 18 + px + 1;
  for (let py = -1; py <= 16; py++)
    for (let px = -1; px <= 16; px++) {
      const b = jitteredBand(px, py);
      apron[at(px, py)] = b;
      // Exposed ground, litter and tilled plots are all bare earth here.
      if (grassy && b >= 3) earth[at(px, py)] = 1;
    }
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
      const band = apron[at(px, py)];
      const tilled = band === 5;
      const tone = (b: number) =>
        b === 5 ? (grassy ? palette[3] : soils[h.ecology][2]) : palette[b];
      let rgb = tone(band);
      // Interlocking clusters only within four native pixels of a real seam.
      // The interiors of transition tiles remain solid habitat colors.
      const other = [
        [-4, 0],
        [4, 0],
        [0, -4],
        [0, 4],
      ]
        .map(([dx, dy]) => bandAt(px + dx, py + dy))
        .find((b) => b !== band);
      // Grassy ground keeps solid bands: seams are drawn as outlines below.
      if (
        other !== undefined &&
        !grassy &&
        fringePixel(
          wx,
          wy,
          Math.floor(hash(Math.floor(wx / 9), Math.floor(wy / 11), 351) * 4),
        )
      ) {
        // Turf meets earth in a hard interlock; other seams blend.
        rgb =
          (band >= 3 || other >= 3) && !mineralGround
            ? tone(other)
            : tone(band).map((v, k) => Math.round((v + tone(other)[k]) / 2));
      }
      if (
        h.season === "autumn" &&
        !["desert", "tropical-woodland"].includes(h.ecology)
      )
        rgb = rgb.map((v, k) => Math.round(v * 0.88 + palette[1][k] * 0.12));
      if (frozen)
        rgb =
          band === 3 || tilled
            ? [181, 194, 191]
            : band === 2
              ? [195, 208, 204]
              : [215, 223, 207];
      if (grassy && band <= 2) {
        // Regular light ticks are the whole base texture; no pixel noise.
        put(px, py, rgb, turfTick(wx, wy) ? (band === 1 ? 6 : 8) : 0);
      } else if (grassy || tilled) {
        const wash = Math.round((noise(wx, wy, 14, 469) - 0.5) * 12);
        put(px, py, rgb, wash + (earthSpeckle(wx, wy) ? -10 : 0));
      } else {
        const grain = materialGrain(wx, wy);
        const grainShade = band === 3 ? [0, -9, 7][grain] : [0, -7, 8][grain];
        put(px, py, rgb, frozen ? grainShade * 0.3 : grainShade);
      }
      // Texture describes the material: little faceted stones or composed turf.
      // No blanket of independently varied pixels behind these marks.
      const ink = groundMotif(
        tilled || (grassy && band >= 3)
          ? "pebble"
          : band === 3
            ? "stone"
            : h.ecology === "desert" ||
                frozen ||
                (h.layeredForest && band === 4)
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
        if (grassy && band <= 2) {
          // Solid dark tufts on the light sward; on darker turf the inner
          // blades catch a highlight.
          const dark = palette[5],
            deep = dark.map((v) => Math.max(0, v - 10)),
            lit = palette[0].map((v, k) => Math.round((v + palette[6][k]) / 2));
          const tones = band === 1 ? [deep, dark, dark] : [deep, dark, lit];
          put(px, py, tones[ink - 1]);
          continue;
        }
        if (tilled || (grassy && band >= 3)) {
          put(px, py, rgb, frozen ? 0 : [0, -34, -18, 8][ink]);
          continue;
        }
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
    // The apron rows exist only to mark trodden ground for the edge pass.
    for (let py = -1; py <= 16; py++)
      for (let px = -1; px <= 16; px++) {
        const inside = px >= 0 && py >= 0 && px < 16 && py < 16;
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
          if (grassy) earth[at(px, py)] = 2;
          if (!inside) continue;
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
          // Wide trodden ground in a meadow gets pebbles and speckle like any
          // bare earth; a footpath keeps its finer grit.
          const pebbled = grassy && wide;
          const ink = groundMotif(pebbled ? "pebble" : "earth", wx, wy);
          // A slow wash keeps the treadway from reading as one flat fill.
          let shade =
            Math.round((noise(wx, wy, 44, 461) - 0.5) * 11) +
            (ink
              ? pebbled
                ? [0, -34, -18, 8][ink]
                : [0, -9, 4, 13][ink]
              : pebbled
                ? earthSpeckle(wx, wy)
                  ? -10
                  : 0
                : [0, -5, 6][materialGrain(wx, wy)]);
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
        } else if (!inside) {
          continue;
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
        } else if (path > 0.3 && !grassy) {
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
  // Grass ends in a dark serrated border: an outline on the turf side, blades
  // of one or two pixels leaning out over the earth. A lighter patch gets the
  // outline alone, so it reads as a separate sward rather than a stain.
  if (grassy) {
    const dark = palette[5];
    const dirs = [
      [0, -1],
      [1, 0],
      [0, 1],
      [-1, 0],
    ];
    for (let py = 0; py < 16; py++)
      for (let px = 0; px < 16; px++) {
        const wx = gx + px,
          wy = gy + py;
        const here = earth[at(px, py)],
          band = apron[at(px, py)];
        if (!here) {
          if (band > 2) continue;
          const rim = dirs.some(([dx, dy]) => earth[at(px + dx, py + dy)]);
          const patch =
            band === 1 &&
            dirs.some(([dx, dy]) => {
              const b = apron[at(px + dx, py + dy)];
              return b !== 1 && b <= 2 && !earth[at(px + dx, py + dy)];
            });
          if (rim || patch) put(px, py, dark);
          continue;
        }
        // One-pixel teeth on straight runs only: the single direction with
        // turf behind it, both along-neighbours still earth, every third
        // pixel with a slowly drifting phase. Corners never grow teeth.
        const tooth = (qx: number, qy: number) => {
          const back = dirs.filter(
            ([dx, dy]) =>
              !earth[at(qx - dx, qy - dy)] && apron[at(qx - dx, qy - dy)] <= 2,
          );
          if (back.length !== 1) return undefined;
          const [dx, dy] = back[0];
          if (!earth[at(qx + dy, qy + dx)] || !earth[at(qx - dy, qy - dx)])
            return undefined;
          const along = dx ? gy + qy : gx + qx;
          const across = dx ? gx + qx : gy + qy;
          const phase = Math.floor(
            hash(Math.floor(along / 16), Math.floor(across / 8), 453) * 3,
          );
          return mod(along + phase, 3) === 0 ? back[0] : undefined;
        };
        const d = tooth(px, py);
        if (d) {
          put(px, py, dark);
          continue;
        }
        // A second pixel of depth now and then, straight behind a tooth.
        for (const [dx, dy] of dirs) {
          const bx = px - dx,
            by = py - dy;
          if (bx < -1 || by < -1 || bx > 16 || by > 16) continue;
          const root = earth[at(bx, by)] ? tooth(bx, by) : undefined;
          if (
            root &&
            root[0] === dx &&
            root[1] === dy &&
            hash(
              Math.floor((dx ? wy : wx) / 3),
              Math.floor((dx ? wx : wy) / 6),
              457,
            ) < 0.35
          ) {
            put(px, py, dark);
            break;
          }
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
  if (hasPath && !grassy && tufted && colony && h.exposed < 0.65) {
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
    } else if (grassy) {
      // The tuft lattice is the whole turf texture; no stray clumps.
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
  // Ground beside paving: dust along the seam and a few stones come loose from
  // it, so a street ends in wear rather than a ruled line. A footway keeps
  // its kerb and gets neither.
  const pavedSide = [
    [0, -1],
    [1, 0],
    [0, 1],
    [-1, 0],
  ].map(([dx, dy]) => {
    const n = sample(x + dx, y + dy);
    return (
      !!n &&
      n.feature === "paving" &&
      !n.bridge &&
      n.pavement !== "footway" &&
      n.height === cell.height
    );
  });
  if (pavedSide.some(Boolean) && cell.surface !== "water" && !frozen) {
    const dust = [176, 164, 132],
      stone = [181, 175, 152];
    for (let py = 0; py < 16; py++)
      for (let px = 0; px < 16; px++) {
        const d = Math.min(
          pavedSide[0] ? py : 99,
          pavedSide[2] ? 15 - py : 99,
          pavedSide[3] ? px : 99,
          pavedSide[1] ? 15 - px : 99,
        );
        if (d > 4) continue;
        const wx = gx + px,
          wy = gy + py,
          i = (py * 16 + px) * 4;
        const chip = hash(Math.floor(wx / 3), Math.floor(wy / 2), 541);
        if (chip < 0.16 - d * 0.03) {
          const top = mod(wy, 2) === 0;
          put(px, py, stone, top ? 8 : -10);
        } else if (d === 0 && hash(wx, wy, 543) < 0.6) {
          for (let k = 0; k < 3; k++)
            pixels[i + k] = Math.round((pixels[i + k] + dust[k]) / 2);
        }
      }
  }
  return { x, y, pixels };
}

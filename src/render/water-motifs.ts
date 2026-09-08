import type Phaser from "phaser";
import type { WaterEffect } from "./water-raster";
import { waterHash } from "./water-style";

export const WATER_ATLAS = "water-motifs-1";
export const motifKinds = [
  "ripple",
  "curl",
  "crest",
  "plant",
  "leaf",
  "ring",
] as const;
export type WaterMotif = (typeof motifKinds)[number];
// Original pixel drawings. Each run is x, y, width; negative widths are dim tails.
// Eight silhouettes form, widen, curl and split. No scaled/rotated blurry sprites.
type Run = readonly [number, number, number];
const ripple: readonly (readonly Run[])[] = [
  [[6, 7, -3]],
  [
    [5, 7, 4],
    [9, 8, -2],
  ],
  [
    [4, 7, 5],
    [9, 8, 2],
    [6, 10, -3],
  ],
  [
    [3, 7, 5],
    [8, 6, 3],
    [11, 7, -1],
    [5, 10, 4],
  ],
  [
    [3, 7, -3],
    [6, 6, 4],
    [10, 7, 2],
    [4, 10, 3],
    [7, 11, -2],
  ],
  [
    [3, 6, -3],
    [7, 6, 2],
    [10, 7, -2],
    [4, 10, 2],
    [8, 11, 2],
  ],
  [
    [3, 6, -2],
    [8, 5, 2],
    [5, 11, -2],
    [10, 10, -1],
  ],
  [
    [4, 5, -2],
    [9, 11, -2],
  ],
];
const curl: readonly (readonly Run[])[] = [
  [[6, 7, -3]],
  [
    [5, 6, 4],
    [9, 7, -1],
  ],
  [
    [4, 6, 5],
    [9, 7, 2],
    [10, 8, -1],
  ],
  [
    [3, 6, 5],
    [8, 7, 3],
    [10, 8, 1],
    [8, 9, 2],
    [5, 11, -2],
  ],
  [
    [3, 6, -4],
    [8, 7, 2],
    [10, 8, 1],
    [8, 9, 2],
    [7, 8, -1],
    [4, 11, 3],
  ],
  [
    [3, 5, -3],
    [9, 7, 2],
    [8, 9, 2],
    [4, 11, -2],
    [7, 12, -2],
  ],
  [
    [3, 5, -2],
    [10, 7, -1],
    [8, 10, 2],
    [5, 12, -2],
  ],
  [
    [4, 5, -1],
    [9, 10, -2],
  ],
];
const crest: readonly (readonly Run[])[] = [
  [[5, 8, -5]],
  [
    [4, 8, 4],
    [8, 7, -3],
  ],
  [
    [3, 8, 4],
    [7, 7, 5],
    [5, 10, -3],
  ],
  [
    [2, 8, -2],
    [4, 7, 4],
    [8, 6, 3],
    [11, 7, 2],
    [4, 10, -5],
  ],
  [
    [2, 7, -2],
    [5, 7, 3],
    [8, 6, 3],
    [11, 7, 2],
    [3, 10, 3],
    [7, 11, -3],
  ],
  [
    [3, 7, -2],
    [6, 6, 2],
    [9, 6, 2],
    [12, 7, -1],
    [4, 11, 2],
    [8, 12, -2],
  ],
  [
    [3, 6, -2],
    [7, 6, -2],
    [11, 7, 1],
    [5, 12, -2],
  ],
  [
    [4, 6, -2],
    [10, 7, -2],
    [7, 12, -1],
  ],
];
/** Palette-indexed source pixels: 0 transparent, 1 shadow/tail, 2 lit edge. */
export function motifPixels(kind: WaterMotif, frame: number) {
  const pixels = new Uint8Array(256);
  const run = (x: number, y: number, width: number, tone = 2) => {
    for (let i = 0; i < Math.abs(width); i++) {
      if (x + i >= 0 && x + i < 16 && y >= 0 && y < 16)
        pixels[y * 16 + x + i] = width < 0 ? 1 : tone;
    }
  };
  if (kind === "ripple" || kind === "curl" || kind === "crest") {
    for (const r of { ripple, curl, crest }[kind][frame]) run(...r);
  } else if (kind === "plant") {
    const sway = [0, 0, 1, 1, 0, 0, -1, -1][frame];
    run(7, 12, 2, 1);
    run(7, 11, 1);
    run(7, 10, 1);
    run(6 + sway, 9, 1);
    run(6 + sway, 8, 1);
    run(5 + sway, 7, 1);
    run(5 + sway, 6, 1);
    run(8, 11, 1, 1);
    run(9, 10, 1, 1);
    run(9 + sway, 9, 1);
    run(10 + sway, 8, 1);
  } else if (kind === "leaf") {
    const leaves: readonly (readonly Run[])[] = [
      [
        [6, 7, 2],
        [5, 8, 3],
        [6, 9, -2],
        [8, 10, -1],
      ],
      [
        [6, 7, 3],
        [5, 8, 4],
        [8, 9, -1],
      ],
      [
        [7, 6, 1],
        [6, 7, 2],
        [6, 8, 2],
        [7, 9, -1],
      ],
      [
        [6, 7, 2],
        [7, 8, 3],
        [7, 9, -2],
        [6, 10, -1],
      ],
      [
        [6, 7, 2],
        [7, 8, 3],
        [7, 9, -2],
        [6, 10, -1],
      ],
      [
        [7, 6, 1],
        [6, 7, 2],
        [6, 8, 2],
        [7, 9, -1],
      ],
      [
        [6, 7, 3],
        [5, 8, 4],
        [8, 9, -1],
      ],
      [
        [6, 7, 2],
        [5, 8, 3],
        [6, 9, -2],
        [8, 10, -1],
      ],
    ];
    for (const r of leaves[frame]) run(...r);
  } else {
    const radius = [1, 2, 3, 4, 4, 5, 5, 5][frame];
    run(
      8 - radius + 1,
      8 - Math.ceil(radius / 2),
      radius * 2 - 1,
      frame > 4 ? 1 : 2,
    );
    run(8 - radius, 8, 1, 1);
    run(8 + radius, 8, 1, 1);
    if (frame < 6)
      run(
        8 - radius + 2,
        8 + Math.ceil(radius / 2),
        Math.max(1, radius * 2 - 3),
        1,
      );
    if (frame > 5) {
      pixels[8 * 16 + 8 - radius] = 0;
      pixels[(8 - Math.ceil(radius / 2)) * 16 + 8] = 0;
    }
  }
  return pixels;
}
/** One shared GPU atlas per game, allocated before chunk texture ownership begins. */
export function ensureWaterAtlas(scene: Phaser.Scene) {
  if (scene.textures.exists(WATER_ATLAS)) return;
  const atlas = scene.textures.createCanvas(
    WATER_ATLAS,
    128,
    motifKinds.length * 16,
  )!;
  const ctx = atlas.getContext();
  const image = ctx.createImageData(128, motifKinds.length * 16);
  for (let row = 0; row < motifKinds.length; row++)
    for (let frame = 0; frame < 8; frame++) {
      const pixels = motifPixels(motifKinds[row], frame);
      for (let y = 0; y < 16; y++)
        for (let x = 0; x < 16; x++) {
          const p = pixels[y * 16 + x];
          if (!p) continue;
          const i = ((row * 16 + y) * 128 + frame * 16 + x) * 4;
          image.data.set([255, 255, 255, p === 1 ? 100 : 255], i);
        }
      atlas.add(`${motifKinds[row]}-${frame}`, 0, frame * 16, row * 16, 16, 16);
    }
  ctx.putImageData(image, 0, 0);
  atlas.refresh();
}
/** Mutually exclusive, sparse habitat details. Never show foliage in desert/icy/ocean water. */
export function waterCharm(e: WaterEffect): WaterMotif | undefined {
  const v = e.cell.waterVisual;
  if (
    !v ||
    e.cell.bridge ||
    v.frozenMargin ||
    v.kind === "sea" ||
    v.distance > -0.45 ||
    v.distance < -2.8
  )
    return;
  if (
    !["temperate-woodland", "tropical-woodland", "wetland"].includes(v.ecology)
  )
    return;
  const pick = waterHash(e.gx, e.gy, 44);
  if (pick > 0.99) return "leaf";
  if (pick > 0.965 && pick < 0.985) return "plant";
  if (e.edges.length && pick > 0.94 && pick < 0.95) return "ring";
}
/** At most one surface motif per 2×2 cell block, with additional empty blocks. */
export function waterMotif(e: WaterEffect): WaterMotif | undefined {
  if (e.cell.bridge) return;
  const charm = waterCharm(e);
  if (charm) return charm;
  const bx = Math.floor(e.gx / 32),
    by = Math.floor(e.gy / 32);
  const slot = Math.floor(waterHash(bx, by, 110) * 4);
  if (
    ((e.gx >> 4) & 1) + ((e.gy >> 4) & 1) * 2 !== slot ||
    waterHash(bx, by, 111) < 0.24
  )
    return;
  const kind = e.cell.waterVisual?.kind ?? "river";
  if (kind === "sea") return "crest";
  return waterHash(e.gx, e.gy, 112) > 0.58 ? "curl" : "ripple";
}
export function motifState(e: WaterEffect, kind: WaterMotif, tick: number) {
  const phase = (tick + Math.floor(waterHash(e.gx, e.gy, 74) * 80)) % 80;
  if (kind === "plant")
    return {
      frame:
        Math.floor((tick + Math.floor(waterHash(e.gx, e.gy) * 64)) / 8) % 8,
      alpha: 0.43,
      dx: 0,
      dy: 0,
    };
  const duration = kind === "leaf" ? 64 : 32;
  const life = Math.min(1, phase / duration);
  const alpha =
    phase >= duration
      ? 0
      : Math.sin(life * Math.PI) *
        (kind === "leaf" ? 0.72 : kind === "ring" ? 0.36 : 0.73);
  const flow = e.cell.waterVisual?.flow ?? [0, 1],
    length = Math.hypot(...flow) || 1;
  const speed = e.cell.waterDepth === "shallow" ? 2 : 4;
  const river = e.cell.waterVisual?.kind !== "sea";
  return {
    frame: Math.min(7, Math.floor(life * 8)),
    alpha,
    dx:
      kind === "leaf"
        ? Math.round(Math.sin(life * Math.PI * 2))
        : Math.round((life - 0.5) * (river ? (flow[0] / length) * speed : 1)),
    dy:
      kind === "leaf"
        ? Math.round(Math.cos(life * Math.PI * 2))
        : Math.round((life - 0.5) * (river ? (flow[1] / length) * speed : 3)),
  };
}

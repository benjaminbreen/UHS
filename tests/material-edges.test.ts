import { expect, it } from "vitest";
import type { TopographySample, TopographyCell } from "../src/core/topography";
import {
  pathCoverage,
  pathField,
  paintedGround,
  shoreDistance,
} from "../src/render/material-edges";
import { rasterHabitatTile } from "../src/render/habitat-raster";
import { rasterWaterTile } from "../src/render/water-raster";
const cell: TopographyCell = {
  height: 0,
  surface: "grass",
  habitat: {
    ecology: "grassland",
    kind: "open",
    wet: 0.2,
    cover: 0.2,
    exposed: 0.1,
    season: "summer",
  },
};
const path: TopographySample = (x, y) => ({
  ...cell,
  surface: Math.abs(x - y) < 1 ? "soil" : "grass",
});
it("cuts diagonal path corners into native pixel steps while preserving tile centers", () => {
  expect(pathCoverage(path, 0.5, 0.5, 0, 0)).toBeGreaterThan(0.48);
  expect(pathCoverage(path, 0.03, 0.97, 0, 0)).toBeLessThan(0.48);
  let count = 0;
  for (let y = 0; y < 16; y++)
    for (let x = 0; x < 16; x++)
      if (pathCoverage(path, (x + 0.5) / 16, (y + 0.5) / 16, 0, 0) > 0.48)
        count++;
  expect(count).toBeGreaterThan(100);
  expect(count).toBeLessThan(240);
});
it("retains full bridge approaches and excludes paving and raised neighbors", () => {
  const approach: TopographySample = (x, y) => ({
    ...cell,
    surface: y === 0 ? "soil" : "grass",
    bridge: x === 1 && y === 0,
  });
  expect(pathCoverage(approach, 0.03, 0.03, 0, 0)).toBeGreaterThan(0.9);
  const raised: TopographySample = (x) => ({
    ...cell,
    height: x < 0 ? 1 : 0,
    surface: x < 0 ? "soil" : "grass",
  });
  expect(pathCoverage(raised, 0.01, 0.5, 0, 0)).toBeLessThan(0.1);
  expect(paintedGround({ ...cell, feature: "paving" })).toBe(true);
  expect(
    pathCoverage(
      () => ({ ...cell, surface: "soil", feature: "paving" }),
      0.5,
      0.5,
      0,
      0,
    ),
  ).toBeLessThan(0.48);
  expect(paintedGround({ ...cell, ramp: "n" })).toBe(false);
});
it("keeps path material pixels identical across signed chunk offsets", () => {
  for (const [ox, oy] of [
    [16, 16],
    [-16, -16],
  ]) {
    const local: TopographySample = (x, y) => path(x + ox, y + oy);
    expect(rasterHabitatTile(local, 0, 0, ox, oy).pixels).toEqual(
      rasterHabitatTile(path, ox, oy, 0, 0).pixels,
    );
  }
});
it("anchors wash pixels to the same signed shore contour and preserves inputs", () => {
  const shore: TopographySample = (x, y) => ({
    ...cell,
    surface: x + y < 0 ? "water" : "sand",
    waterVisual: {
      ecology: "grassland",
      distance: x + y + 0.1,
      shoreWidth: 3,
      kind: "sea",
      flow: [0, 0],
      frozenMargin: false,
    },
  });
  const original = JSON.stringify(shore(-1, 0));
  const result = rasterWaterTile(shore, -1, 0, 0, 0);
  expect(result.effect.shoreline!.length).toBeGreaterThan(0);
  for (const p of result.effect.shoreline!) {
    expect(p.distance).toBeCloseTo(
      shoreDistance(shore, -1 + (p.x + 0.5) / 16, (p.y + 0.5) / 16, 0, 0),
    );
    expect(p.distance).toBeLessThan(0);
  }
  expect(JSON.stringify(shore(-1, 0))).toBe(original);
});

it("does not redraw tile-shaped dirt fragments beyond an authored diagonal", () => {
  const sample: TopographySample = (x, y) => ({
    ...cell,
    surface: x === 0 && y === 0 ? "soil" : "grass",
    ...(x === 0 && y === 0
      ? {
          pathArt: [
            { a: [0.5, 0.5] as const, b: [3.5, 3.5] as const, radius: 0.5 },
          ],
        }
      : {}),
  });
  expect(pathCoverage(sample, 1.01, 0.5, 0, 0)).toBe(0);
  expect(pathCoverage(sample, 0.5, 0.5, 0, 0)).toBeGreaterThan(0.8);
});

it("keeps four wear bands across a broad path and a worn crown on a narrow one", () => {
  const broad: TopographySample = () => ({
    ...cell,
    pathArt: [{ a: [1.5, -10], b: [1.5, 10], radius: 1.5 }],
  });
  // The corridor drifts and breathes, so bands are checked by crossing
  // position rather than at fixed distances from the authored center line.
  const bands = new Set<number>();
  for (let i = 0; i <= 60; i++) {
    const f = pathField(broad, (i * 3) / 60, 0.5, 0, 0);
    if (f.coverage <= 0.48) continue;
    bands.add(
      f.coverage < 0.56 ? 0 : f.coverage < 0.7 ? 1 : f.coverage < 0.84 ? 2 : 3,
    );
    expect(f.cross).toBeLessThan(1.06);
  }
  expect([...bands].sort()).toEqual([0, 1, 2, 3]);
  const narrow: TopographySample = () => ({
    ...cell,
    pathArt: [{ a: [0.5, -10], b: [0.5, 10], radius: 0.5 }],
  });
  const crown = Array.from({ length: 33 }, (_, i) =>
    pathField(narrow, i / 32, 0.5, 0, 0).coverage,
  );
  expect(Math.max(...crown)).toBeGreaterThan(0.95);
});

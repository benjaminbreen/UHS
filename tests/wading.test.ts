import { expect, it } from "vitest";
import { terrainStep, type TopographySample } from "../src/core/topography";
import {
  waterDepthAt,
  waterContactDistance,
  MAX_WADING_DEPTH,
} from "../src/core/water-field";
const river: TopographySample = (x) => ({
  height: 0,
  surface: x >= 0 ? "water" : "sand",
  waterVisual: {
    distance: -x - 0.5,
    kind: "river",
    ecology: "grassland",
    shoreWidth: 3,
    flow: [0, 1],
    frozenMargin: false,
  },
});
it("admits two water tiles, rejects the deep channel, and allows retreat", () => {
  expect(waterDepthAt(river, 0.5, 0.5)).toBeGreaterThan(0);
  expect(waterDepthAt(river, 1.5, 0.5)).toBeLessThan(MAX_WADING_DEPTH);
  expect(terrainStep(river, { x: -1, y: 0 }, { x: 0, y: 0 }).allowed).toBe(
    true,
  );
  expect(terrainStep(river, { x: 0, y: 0 }, { x: 1, y: 0 }).allowed).toBe(true);
  expect(terrainStep(river, { x: 1, y: 0 }, { x: 2, y: 0 }).allowed).toBe(
    false,
  );
  expect(terrainStep(river, { x: 0, y: 0 }, { x: -1, y: 0 }).allowed).toBe(
    true,
  );
});
it("keeps bridges dry, canals blocked, and solid rocks impassable", () => {
  const bridge: TopographySample = (x, y) => ({
    ...river(x, y)!,
    bridge: true,
  });
  expect(waterDepthAt(bridge, 20.5, 0.5)).toBe(0);
  const canal: TopographySample = (x, y) => ({
    ...river(x, y)!,
    waterVisual: { ...river(x, y)!.waterVisual!, kind: "canal" },
  });
  expect(waterDepthAt(canal, 0.5, 0.5)).toBe(Infinity);
  const rock: TopographySample = (x, y) => ({
    ...river(x, y)!,
    solid: x === 0,
  });
  expect(terrainStep(rock, { x: -1, y: 0 }, { x: 0, y: 0 }).allowed).toBe(
    false,
  );
});
it("does not allow diagonal corner cutting or climbing a high bank from water", () => {
  const wall: TopographySample = (x, y) => ({
    ...river(x, y)!,
    solid: x === 0 && y === 0,
  });
  expect(terrainStep(wall, { x: -1, y: 0 }, { x: 0, y: 1 }).allowed).toBe(
    false,
  );
  const cliff: TopographySample = (x, y) => ({
    ...river(x, y)!,
    height: x < 0 ? 3 : 0,
  });
  expect(terrainStep(cliff, { x: 0, y: 0 }, { x: -1, y: 0 }).allowed).toBe(
    false,
  );
});
it("samples the same coast across chunk coordinate systems", () => {
  const coast: TopographySample = (x, y) => ({
    ...river(x, y)!,
    waterVisual: { ...river(x, y)!.waterVisual!, kind: "sea" },
  });
  const local: TopographySample = (x, y) => coast(x + 32, y + 64);
  expect(
    waterContactDistance(local, -31.2, 0.4, 32, 64, { enabled: true }),
  ).toBeCloseTo(
    waterContactDistance(coast, 0.8, 64.4, 0, 0, { enabled: true }),
    10,
  );
});

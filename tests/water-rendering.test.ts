import { expect, it } from "vitest";
import { rasterWaterTile } from "../src/render/water-raster";
import { waterDistance, waterPalette } from "../src/render/water-style";
import type { TopographySample } from "../src/core/topography";
import { regionalLandforms } from "../src/world/v3/landforms";
import { createSettingSession } from "../src/runtime/session";
import { settingFor } from "../src/content/geography/resolve";
import { places } from "../src/content/geography/places";
import type { WorldSetting } from "../src/content/geography/types";
const setting = (
  ecology: "desert" | "tropical-woodland" | "tundra",
  water: WorldSetting["water"],
): WorldSetting => ({
  ...settingFor(places.find((p) => p.id === "konya")!, -6499),
  terrainRevision: 2,
  water,
  environment: {
    ecology,
    landform: "plain",
    population: "none",
    start: "wanderer",
    household: "mixed",
  },
});
const sample: TopographySample = (x, y) => ({
  height: 0,
  surface: x + Math.sin(y / 11) < 0 ? "water" : "sand",
  waterVisual: {
    distance: x + Math.sin(y / 11),
    ecology: "tropical-woodland",
    kind: "sea",
    shoreWidth: 5,
    flow: [0, 0],
    frozenMargin: false,
  },
});
it("water pixels and animation anchors match across positive and negative chunk origins", () => {
  for (const [ox, oy] of [
    [-32, -16],
    [16, 32],
    [-16, 0],
  ]) {
    const local: TopographySample = (x, y) => sample(x + ox, y + oy);
    for (const [x, y] of [
      [0, 0],
      [15, 15],
      [0, 15],
      [15, 0],
    ]) {
      const a = rasterWaterTile(local, x, y, ox, oy);
      const b = rasterWaterTile(sample, x + ox, y + oy, 0, 0);
      expect(a.pixels).toEqual(b.pixels);
      expect([a.effect.gx, a.effect.gy]).toEqual([b.effect.gx, b.effect.gy]);
      expect(a.effect.edges).toEqual(b.effect.edges);
    }
  }
});
it("reconstructs a continuous bed without a discontinuity at tile boundaries", () => {
  for (let y = -18; y <= 18; y++) {
    expect(
      Math.abs(
        waterDistance(sample, -16 - 1e-7, y) -
          waterDistance(sample, -16 + 1e-7, y),
      ),
    ).toBeLessThan(1e-5);
  }
});
it("retains base ecology on wet banks and exports river tangents without changing downstream direction", () => {
  for (const ecology of ["desert", "tropical-woodland", "tundra"] as const) {
    const s = setting(ecology, "river-ew"),
      seed = "water-ecology";
    const world = createSettingSession(s, seed).world;
    const plan = regionalLandforms(s, seed);
    const p = plan.point(0);
    const c = world.topography!(p.along, Math.round(p.across));
    expect(c.surface).toBe("water");
    expect(c.waterVisual?.ecology).toBe(ecology);
    expect(c.waterVisual!.flow[0]).toBeGreaterThan(0);
    expect(c.waterVisual!.flow[1]).toBeCloseTo(
      plan.river(p.along, Math.round(p.across)).waterFlow[1],
    );
    expect(
      world.canCross?.(
        { x: p.along, y: Math.round(p.across) },
        { x: p.along + 1, y: Math.round(p.across) },
      ),
    ).toBe(false);
  }
});
it("gives tropical rivers and coasts distinct water, and ecological banks distinct minerals", () => {
  const river = waterPalette("tropical-woodland", "river"),
    sea = waterPalette("tropical-woodland", "sea");
  expect(river.depths).not.toEqual(sea.depths);
  const palettes = [
    "desert",
    "tropical-woodland",
    "tundra",
    "temperate-woodland",
  ].map((e) => waterPalette(e as "desert", "sea"));
  expect(new Set(palettes.map((p) => p.depths.join())).size).toBe(4);
  expect(new Set(palettes.map((p) => p.stone.join())).size).toBe(4);
});

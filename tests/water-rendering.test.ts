import {
  motifKinds,
  motifPixels,
  motifState,
  waterMotif,
  waterCharm,
} from "../src/render/water-motifs";
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
}, 15000); // Three complete regional worlds; raster assertions above remain fast.

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

it("keeps animated artwork sparse and inside its water tile for every flow direction", () => {
  const e = rasterWaterTile(sample, -2, -2, 0, 0).effect;
  const failures: string[] = [];
  for (const kind of motifKinds)
    for (let frame = 0; frame < 8; frame++) {
      e.cell.waterVisual!.kind = kind === "crest" ? "sea" : "river";
      const pixels = motifPixels(kind, frame);
      const occupied = Array.from(pixels.keys()).filter((i) => pixels[i]);
      expect(occupied.length).toBeLessThan(34);
      const xs = occupied.map((i) => i % 16),
        ys = occupied.map((i) => Math.floor(i / 16));
      for (const flow of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
        [1, 1],
      ] as const) {
        e.cell.waterVisual!.flow = flow;
        for (let tick = 0; tick < 80; tick++) {
          const state = motifState(e, kind, tick);
          if (
            !Number.isFinite(state.alpha) ||
            state.alpha < 0 ||
            Math.min(...xs) + state.dx < 0 ||
            Math.max(...xs) + state.dx >= 16 ||
            Math.min(...ys) + state.dy < 0 ||
            Math.max(...ys) + state.dy >= 16
          )
            failures.push(`${kind}/${frame}/${flow}/${tick}`);
        }
      }
    }
  expect(failures).toEqual([]);
});
it("leaves most surface blocks quiet and limits vegetation to suitable freshwater", () => {
  let chosen = 0,
    active = 0;
  const e = rasterWaterTile(sample, -2, -2, 0, 0).effect;
  for (let by = -8; by < 8; by++)
    for (let bx = -8; bx < 8; bx++) {
      let count = 0;
      for (let y = 0; y < 2; y++)
        for (let x = 0; x < 2; x++) {
          e.gx = bx * 32 + x * 16;
          e.gy = by * 32 + y * 16;
          const kind = waterMotif(e);
          if (kind) {
            count++;
            chosen++;
            if (motifState(e, kind, 0).alpha > 0) active++;
          }
          expect(waterCharm(e)).toBeUndefined(); // salt water has no freshwater charms
        }
      expect(count).toBeLessThanOrEqual(1);
    }
  expect(chosen).toBeGreaterThan(100);
  expect(active).toBeLessThan(120); // fewer than 12% of 1024 cells at once
  e.cell.bridge = true;
  expect(waterMotif(e)).toBeUndefined();
  e.cell.bridge = false;
  e.cell.waterVisual!.kind = "river";
  for (const ecology of ["desert", "tundra", "boreal-woodland"] as const) {
    e.cell.waterVisual!.ecology = ecology;
    expect(waterCharm(e)).toBeUndefined();
  }
});

it("adds only occasional freshwater plants and leaves, and freezes them out in winter", () => {
  const e = rasterWaterTile(sample, -2, -2, 0, 0).effect;
  e.cell.waterVisual!.kind = "river";
  e.cell.waterVisual!.distance = -1;
  e.edges = [{ dx: 1, dy: 0, rocky: false }];
  const counts = { plant: 0, leaf: 0, ring: 0 };
  for (let x = -16; x < 16; x++)
    for (let y = -16; y < 16; y++) {
      e.gx = x * 16;
      e.gy = y * 16;
      const charm = waterCharm(e);
      if (charm && charm in counts) counts[charm as keyof typeof counts]++;
    }
  expect(counts.plant).toBeGreaterThan(0);
  expect(counts.leaf).toBeGreaterThan(0);
  expect(counts.ring).toBeGreaterThan(0);
  expect(counts.plant + counts.leaf + counts.ring).toBeLessThan(65);
  e.cell.waterVisual!.frozenMargin = true;
  expect(waterCharm(e)).toBeUndefined();
});

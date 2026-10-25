import { expect, it } from "vitest";
import { createSettlementWorld } from "../src/world/v3/generate";
import { packForSetting } from "../src/content/geography/pack";
import { settingFor } from "../src/content/geography/resolve";
import { places } from "../src/content/geography/places";
import type { WorldSetting } from "../src/content/geography/types";
import { crownRadius, retainsTree } from "../src/world/v3/vegetation-spacing";
import { treeGrouping } from "../src/world/v3/habitats";
import { canopyHidesPlayer } from "../src/render/canopy-visibility";
import { natureTreeSprites } from "../src/content/ecology/vegetation";
import nature from "../public/nature/atlas.json" with { type: "json" };
import { resolveSetting } from "../src/content/geography/resolve";
import type { SettlementWorld } from "../src/world/v3/generate";

it.runIf(!!process.env.FULL)("keeps wild scenery out of cultivated plots in placement revision 1", () => {
  const resolved = resolveSetting("medieval Normandy");
  if ("error" in resolved) throw Error(resolved.error);
  const counts: number[] = [];
  for (const placementRevision of [0, 1] as const) {
    const s: WorldSetting = { ...resolved.setting, placementRevision, geographyMode: "configured", terrainRevision: 2,
      vegetationRevision: 8, relief: 0, water: "none", environment: { ecology: "temperate-woodland", landform: "plain",
        population: "sparse", start: "resident", household: "mixed" } };
    const world = createSettlementWorld(packForSetting(s), "placement-composition") as SettlementWorld;
    const plan = world.planAt(world.spawn.x, world.spawn.y)!;
    let cropped = 0, scenery = 0;
    for (const [key, f] of plan.fields ?? []) {
      if (f.crop === "pasture") continue;
      const [x, y] = key.split(",").map(Number);
      cropped++;
      if (world.decoration(x, y)) scenery++;
      if (placementRevision) expect(world.protectedCell!(x, y)).toBe(true);
    }
    expect(cropped).toBeGreaterThan(100);
    counts.push(scenery);
  }
  expect(counts[0]).toBeGreaterThan(0);
  expect(counts[1]).toBe(0);
}, 60000);
const base: WorldSetting = {
  ...settingFor(places.find((p) => p.id === "konya")!),
  lon: 105,
  lat: 15,
  climate: "tropical",
  geographyMode: "configured",
  terrainRevision: 2,
  water: "none",
  environment: {
    ecology: "tropical-woodland",
    landform: "plain",
    population: "none",
    start: "wanderer",
    household: "mixed",
  },
};
it.runIf(!!process.env.FULL)("reduces crowding, draws every broadleaf age, and preserves spacing across chunk borders", () => {
  const before = createSettlementWorld(
    packForSetting({ ...base, vegetationRevision: 1 }),
    "composition-01",
  );
  const after = createSettlementWorld(
    packForSetting({ ...base, vegetationRevision: 2 }),
    "composition-01",
  );
  let original = 0;
  const treeSprites = new Set(natureTreeSprites);
  const trees: { x: number; y: number; sprite: string }[] = [];
  for (let y = -64; y < 64; y++)
    for (let x = -64; x < 64; x++) {
      const a = before.decoration(x, y),
        b = after.decoration(x, y);
      if (a?.solid && treeSprites.has(a.sprite)) original++;
      if (b?.solid && treeSprites.has(b.sprite)) trees.push(b);
    }
  expect(trees.length).toBeLessThan(original * 0.75);
  expect(trees.length).toBeGreaterThan(original * 0.15);
  const ages = new Set(trees.map((t) => t.sprite));
  for (const age of ["sapling", "young", "mature", "giant"])
    expect(ages.has(`nature-broadleaf-${age}`)).toBe(true);
  for (let i = 0; i < trees.length; i++)
    for (let j = i + 1; j < trees.length; j++) {
      const a = trees[i], b = trees[j];
      expect(Math.hypot(a.x - b.x, a.y - b.y) + 1e-9).toBeGreaterThanOrEqual(
        (crownRadius(a.sprite) + crownRadius(b.sprite)) * 0.45,
      );
    }
  for (const t of trees.slice(0, 20))
    expect(after.decoration(t.x, t.y)).toMatchObject(t);
}, 30000);
it("priority thinning is symmetric and uses larger crowns' growing space", () => {
  const a = { sprite: "nature-broadleaf-giant", radius: 4.5, priority: 0.9 };
  const b = { sprite: "nature-broadleaf-young", radius: 2.25, priority: 0.4 };
  const sample = (x: number, y: number) =>
    y !== 0 ? undefined : x === 0 ? a : x === 3 ? b : undefined;
  expect(retainsTree(0, 0, a, sample)).toBe(true);
  expect(retainsTree(3, 0, b, sample)).toBe(false);
});
it("shares groves between trees and understory without depending on query order", () => {
  const setting: WorldSetting = { ...base, relief: 0, vegetationRevision: 8 };
  const world = () => createSettlementWorld(packForSetting(setting), "scenery-composition");
  const forward = world(), reverse = world();
  const cells: { x: number; y: number }[] = [];
  const trees: { x: number; y: number; sprite: string }[] = [];
  const treeSprites = new Set(natureTreeSprites);
  const bands = [{ cells: 0, low: 0 }, { cells: 0, low: 0 }, { cells: 0, low: 0 }];
  for (let y = -32; y < 32; y++)
    for (let x = -32; x < 32; x++) {
      cells.push({ x, y });
      const grove = forward.topography!(x, y).habitat!.grove!;
      expect(grove).toBeGreaterThanOrEqual(0);
      expect(grove).toBeLessThanOrEqual(1);
      const d = forward.decoration(x, y), band = bands[grove < 0.25 ? 0 : grove < 0.65 ? 1 : 2];
      band.cells++;
      if (d && treeSprites.has(d.sprite)) {
        expect(grove).toBeGreaterThan(0.3);
        trees.push(d);
      } else if (d && !d.solid) band.low++;
    }
  expect(trees.length).toBeGreaterThan(20);
  for (const band of bands) expect(band.cells).toBeGreaterThan(100);
  expect(bands[1].low / bands[1].cells).toBeGreaterThan(bands[0].low / bands[0].cells * 2);
  expect(bands[1].low / bands[1].cells).toBeGreaterThan(bands[2].low / bands[2].cells * 2);
  for (let i = 0; i < trees.length; i++)
    for (let j = i + 1; j < trees.length; j++) {
      const a = trees[i], b = trees[j];
      expect(Math.hypot(a.x - b.x, a.y - b.y) + 1e-9).toBeGreaterThanOrEqual(
        (crownRadius(a.sprite) + crownRadius(b.sprite)) * 0.72,
      );
    }
  for (const { x, y } of cells.reverse())
    expect(reverse.decoration(x, y)).toEqual(forward.decoration(x, y));
  const pinned = createSettlementWorld(packForSetting({ ...setting, vegetationRevision: 7 }), "scenery-composition");
  expect(pinned.topography!(0, 0).habitat!.grove).toBeUndefined();
}, 30000);
it("revision 5 makes wet ground more favorable and exposed ground only sparsely favorable", () => {
  const open = {
    ecology: "grassland" as const,
    kind: "open" as const,
    wet: 0.48,
    cover: 0.45,
    exposed: 0.08,
    season: "summer",
  };
  const wet = { ...open, kind: "hollow" as const, wet: 0.78 };
  const bare = { ...open, exposed: 0.82, cover: 0.18 };
  expect(treeGrouping(wet, true)).toBeGreaterThan(treeGrouping(open, true));
  expect(treeGrouping(bare, true)).toBeLessThan(treeGrouping(open, true));
  expect(treeGrouping(bare, true)).toBeGreaterThan(0);
  expect(treeGrouping(open)).toBe(treeGrouping(open, false));
});
it("native broadleaf ages increase in resolution and only foreground crowns hide the player", () => {
  expect(nature.frames["nature-broadleaf-giant"].frame).toMatchObject({
    w: 144,
    h: 192,
  });
  expect(nature.frames["nature-broadleaf-sapling"].frame).toMatchObject({
    w: 48,
    h: 64,
  });
  const tree = { x: 100, y: 200, width: 112, height: 144, cut: 103 };
  expect(canopyHidesPlayer(tree, { x: 100, y: 140 })).toBe(true);
  expect(canopyHidesPlayer(tree, { x: 100, y: 220 })).toBe(false);
  expect(canopyHidesPlayer(tree, { x: 200, y: 140 })).toBe(false);
});

it("small shrub forms are native assets and dominate the dry size mix", async () => {
  const { understorySize } = await import("../src/content/ecology/vegetation");
  const { floraForm } = await import("../src/content/ecology/flora");
  const counts = new Map<string, number>();
  for (let i = 0; i < 100; i++) {
    const sprite = understorySize("nature-dry-thorn-scrub", i / 100);
    counts.set(sprite, (counts.get(sprite) ?? 0) + 1);
    expect(nature.frames).toHaveProperty(sprite);
    expect(floraForm(sprite)).toBe("scrub");
  }
  expect(counts.get("nature-dry-scrub-small")).toBe(30);
  expect(counts.get("nature-dry-scrub-small-b")).toBe(30);
  expect(counts.get("nature-dry-scrub-medium")).toBe(15);
  expect(counts.get("nature-dry-scrub-medium-b")).toBe(15);
  expect(counts.get("nature-dry-thorn-scrub")).toBe(5);
  expect(counts.get("nature-dry-thorn-scrub-b")).toBe(5);
  expect(nature.frames["nature-dry-scrub-small"].frame).toMatchObject({
    w: 24,
    h: 20,
  });
});

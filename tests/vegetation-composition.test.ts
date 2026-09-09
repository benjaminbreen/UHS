import { expect, it } from "vitest";
import { createSettlementWorld } from "../src/world/v3/generate";
import { packForSetting } from "../src/content/geography/pack";
import { settingFor } from "../src/content/geography/resolve";
import { places } from "../src/content/geography/places";
import type { WorldSetting } from "../src/content/geography/types";
import { crownRadius, retainsTree } from "../src/world/v3/vegetation-spacing";
import { canopyHidesPlayer } from "../src/render/canopy-visibility";
import nature from "../public/nature/atlas.json";
const base: WorldSetting = {
  ...settingFor(places.find((p) => p.id === "konya")!),
  lon: 105,
  lat: 15,
  climate: "tropical",
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
it("reduces crowding, draws every broadleaf age, and preserves spacing across chunk borders", () => {
  const before = createSettlementWorld(
    packForSetting({ ...base, vegetationRevision: 1 }),
    "composition-01",
  );
  const after = createSettlementWorld(
    packForSetting({ ...base, vegetationRevision: 2 }),
    "composition-01",
  );
  let original = 0;
  const trees: { x: number; y: number; sprite: string }[] = [];
  for (let y = -64; y < 64; y++)
    for (let x = -64; x < 64; x++) {
      const a = before.decoration(x, y),
        b = after.decoration(x, y);
      if (a?.solid && a.sprite !== "rock") original++;
      if (b?.solid && b.sprite !== "rock") trees.push(b);
    }
  console.info("Tropical tree counts", {
    before: original,
    after: trees.length,
  });
  expect(trees.length).toBeLessThan(original * 0.75);
  expect(trees.length).toBeGreaterThan(original * 0.15);
  const ages = new Set(trees.map((t) => t.sprite));
  for (const age of ["sapling", "young", "mature", "giant"])
    expect(ages.has(`nature-broadleaf-${age}`)).toBe(true);
  for (const a of trees)
    for (const b of trees) {
      if (a === b) continue;
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
it("revision 3 reduces trees and low vegetation across contrasting ecologies", () => {
  for (const ecology of [
    "temperate-woodland",
    "tropical-woodland",
    "boreal-woodland",
    "dry-scrub",
  ] as const) {
    const setting = {
      ...base,
      lat: 37,
      lon: -77,
      environment: { ...base.environment!, ecology },
    };
    const counts = [2, 3].map((revision) => {
      const world = createSettlementWorld(
        packForSetting({ ...setting, vegetationRevision: revision as 2 | 3 }),
        "virginia-density",
      );
      let trees = 0,
        low = 0;
      for (let y = -40; y < 40; y++)
        for (let x = -40; x < 40; x++) {
          const d = world.decoration(x, y);
          if (!d || d.sprite === "rock") continue;
          if (d.solid) trees++;
          else low++;
        }
      return { trees, low };
    });
    console.info(ecology, counts);
    expect(counts[1].trees).toBeLessThan(counts[0].trees);
    expect(counts[1].low).toBeLessThan(counts[0].low * 0.35);
    expect(counts[1].low).toBeGreaterThan(0);
  }
}, 60000);

it("small shrub forms are native assets and dominate the dry size mix", async () => {
  const { understorySize } = await import("../src/content/ecology/vegetation");
  const counts = new Map<string, number>();
  for (let i = 0; i < 100; i++) {
    const sprite = understorySize("nature-dry-thorn-scrub", i / 100);
    counts.set(sprite, (counts.get(sprite) ?? 0) + 1);
    expect(nature.frames).toHaveProperty(sprite);
  }
  expect(counts.get("nature-dry-scrub-small")).toBe(60);
  expect(counts.get("nature-dry-scrub-medium")).toBe(30);
  expect(nature.frames["nature-dry-scrub-small"].frame).toMatchObject({
    w: 24,
    h: 20,
  });
});
it("revision 4 opens up inland tropical woodland and diversifies its trees", () => {
  const setting = { ...base, lat: 21, lon: 96 };
  const counts = [3, 4].map((vegetationRevision) => {
    const w = createSettlementWorld(
      packForSetting({
        ...setting,
        vegetationRevision: vegetationRevision as 3 | 4,
      }),
      "burma-quiet",
    );
    let trees = 0,
      low = 0;
    const frames = new Set<string>();
    for (let y = -48; y < 48; y++)
      for (let x = -48; x < 48; x++) {
        const d = w.decoration(x, y);
        if (!d || d.sprite === "rock") continue;
        frames.add(d.sprite);
        if (d.solid) trees++;
        else low++;
      }
    return { trees, low, frames };
  });
  console.info(
    "Burmese woodland",
    counts.map((c) => ({ trees: c.trees, low: c.low, frames: [...c.frames] })),
  );
  expect(counts[1].trees).toBeLessThan(counts[0].trees * 0.75);
  expect(counts[1].low).toBeLessThan(counts[0].low * 0.75);
  expect(counts[1].frames.has("nature-teak")).toBe(true);
  expect(counts[1].frames.has("nature-bamboo-clump")).toBe(true);
}, 30000);

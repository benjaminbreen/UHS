import { expect, it } from "vitest";
import {
  vegetationTree,
  vegetationUnderstory,
} from "../src/content/ecology/vegetation";
import { settingFor } from "../src/content/geography/resolve";
import { places } from "../src/content/geography/places";
import { packForSetting } from "../src/content/geography/pack";
import { createSettlementWorld } from "../src/world/v3/generate";
import type { WorldSetting } from "../src/content/geography/types";
import type { Ecology } from "../src/content/ecology/profiles";
import type { Habitat } from "../src/world/v3/habitats";
import nature from "../public/nature/atlas.json";
import shadows from "../public/nature/shadows.json";
const base = settingFor(places.find((p) => p.id === "konya")!);
const setting = (ecology: Ecology, lon = 30, lat = 40): WorldSetting => ({
  ...base,
  lon,
  lat,
  terrainRevision: 2,
  vegetationRevision: 1,
  water: "river-ns",
  environment: {
    ecology,
    landform: "plain",
    population: "none",
    start: "wanderer",
    household: "mixed",
  },
});
const land = {
  water: 40,
  shoreWidth: 3,
  kind: "river" as const,
  moisture: 0.65,
  elevation: 14,
  snow: false,
};
const habitat = (ecology: Ecology): Habitat => ({
  ecology,
  kind: "woodland",
  wet: 0.45,
  cover: 0.65,
  exposed: 0,
  season: "summer",
});
it("keeps cold, dry, freshwater and regional flora distinct", () => {
  for (let i = 0; i < 100; i++) {
    const r = i / 100;
    expect(
      vegetationTree(setting("tundra"), habitat("tundra"), land, r),
    ).toBeUndefined();
    expect(
      vegetationTree(
        setting("boreal-woodland"),
        habitat("boreal-woodland"),
        land,
        r,
      ),
    ).toMatch(/spruce|pine|birch/);
    expect(
      vegetationTree(
        setting("tropical-woodland", 105, 15),
        habitat("tropical-woodland"),
        land,
        r,
      ),
    ).toMatch(/tropical|palm/);
  }
  expect(
    vegetationTree(
      setting("temperate-woodland"),
      habitat("temperate-woodland"),
      { ...land, water: 10 },
      0.2,
    ),
  ).toContain("willow");
  expect(
    vegetationTree(
      setting("temperate-woodland"),
      habitat("temperate-woodland"),
      { ...land, water: 10, kind: "sea" },
      0.2,
    ),
  ).not.toContain("willow");
  expect(
    vegetationUnderstory(
      setting("dry-scrub", -115, 40),
      habitat("dry-scrub"),
      land,
      0.2,
    ),
  ).toContain("sagebrush");
  expect(
    vegetationUnderstory(
      setting("desert", -3, 17),
      habitat("desert"),
      land,
      0.2,
    ),
  ).toContain("thorn-scrub");
  expect(
    vegetationUnderstory(
      setting("tropical-woodland", 105, 15),
      habitat("tropical-woodland"),
      land,
      0.2,
    ),
  ).toContain("ginger");
  expect(
    vegetationUnderstory(
      setting("tropical-woodland", -72, 18),
      habitat("tropical-woodland"),
      land,
      0.2,
    ),
  ).toContain("fern");
  expect(
    vegetationUnderstory(
      setting("boreal-woodland"),
      habitat("boreal-woodland"),
      { ...land, snow: true },
      0.2,
    ),
  ).toBeUndefined();
});
it("generates every new plant in suitable worlds without placing them in water or roads", () => {
  const seen = new Set<string>();
  for (const [eco, lon, lat] of [
    ["temperate-woodland", 127, 37],
    ["boreal-woodland", 25, 62],
    ["tropical-woodland", 105, 15],
    ["desert", -3, 17],
    ["dry-scrub", -115, 40],
    ["tundra", 25, 70],
  ] as const) {
    const world = createSettlementWorld(
      packForSetting(setting(eco, lon, lat)),
      "flora-01",
    );
    for (let y = -64; y < 64; y++)
      for (let x = -64; x < 64; x++) {
        const d = world.decoration(x, y);
        if (!d?.sprite.startsWith("nature-")) continue;
        seen.add(d.sprite);
        expect(["water", "bridge", "dirt", "field", "paving"]).not.toContain(
          world.terrain(x, y),
        );
        expect(d.solid).toBe(
          !d.sprite.includes("understory") && !d.sprite.includes("scrub"),
        );
        expect(nature.frames).toHaveProperty(d.sprite);
        expect(shadows.frames).toHaveProperty(`morning:${d.sprite}`);
      }
  }
  expect([...seen].sort()).toEqual(
    Object.keys(nature.frames)
      .filter(
        (id) =>
          ![
            "nature-bamboo-clump",
            "nature-teak",
            "nature-understory-sedge",
            "nature-understory-dry-bunchgrass",
          ].includes(id) &&
          !id.startsWith("nature-broadleaf-") &&
          !id.startsWith("nature-dry-scrub-") &&
          !id.startsWith("nature-understory-low-"),
      )
      .sort(),
  );
}, 30000);

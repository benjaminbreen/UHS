import { expect, it } from "vitest";
import {
  vegetationPattern,
  vegetationTree,
  vegetationUnderstory,
} from "../src/content/ecology/vegetation";
import { settingFor } from "../src/content/geography/resolve";
import { places } from "../src/content/geography/places";
import type { WorldSetting } from "../src/content/geography/types";
import type { Ecology } from "../src/content/ecology/profiles";
import type { Habitat } from "../src/world/v3/habitats";
const base = settingFor(places.find((p) => p.id === "konya")!);
const setting = (ecology: Ecology, lon = 30, lat = 40): WorldSetting => ({
  ...base,
  // Otherwise the atlas environment at Konya wins over the ecology under test.
  geographyMode: "configured",
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


it("resolves open vegetation globally while leaving old revisions unchanged", () => {
  const dry = { ...land, moisture: 0.4, elevation: 10, summit: 100 };
  const tropical = { ...setting("tropical-woodland", 25, -15), vegetationRevision: 6 as const };
  expect(vegetationPattern(tropical, dry)).toBe("savanna");
  expect(vegetationPattern(tropical, { ...dry, moisture: 0.8 })).toBeUndefined();
  const inland = { ...setting("grassland", 70, 45), vegetationRevision: 6 as const };
  expect(vegetationPattern(inland, dry)).toBe("steppe");
  expect(vegetationPattern({ ...inland, relief: 0.9 }, { ...dry, elevation: 85 })).toBe("alpine");
  expect(vegetationPattern({ ...inland, relief: 0.2 }, { ...dry, elevation: 85 })).toBe("steppe");
  expect(vegetationPattern({ ...tropical, vegetationRevision: 5 }, dry)).toBeUndefined();
});

it("keeps alpine ground treeless and uses low vegetation instead of forest understory", () => {
  const s = { ...setting("temperate-woodland"), vegetationRevision: 6 as const };
  const h: Habitat = { ecology: "temperate-woodland", vegetation: "alpine", kind: "open", wet: 0.1, cover: 0.2, exposed: 0.7, season: "summer" };
  expect(vegetationTree(s, h, land, 0.2)).toBeUndefined();
  expect(vegetationUnderstory(s, h, land, 0.2)).toBe("nature-understory-low-heath");
  expect(vegetationUnderstory(s, h, { ...land, snow: true }, 0.2)).toBeUndefined();
});

import { describe, it, expect } from "vitest";
import {
  crops,
  cropsFor,
  cropStage,
  farmSystem,
  farmSystems,
  genericFarming,
} from "../src/content/agriculture";
import type { Climate, CropId, FarmSystem } from "../src/content/agriculture";
import type { CultureId } from "../src/content/history/types";
import { cultures } from "../src/content/history/types";
import { gardenPlant } from "../src/content/agriculture/gardens";
const cultureIds = () => cultures.map(([id]) => id as CultureId);

const cropIds: CropId[] = [
  "wheat", "barley", "rye", "oats", "millet", "sorghum", "teff", "rice",
  "dry-rice", "maize", "beans", "squash", "potato", "quinoa", "yam", "cassava",
  "taro", "sugarcane", "olive", "vine", "date", "orchard", "flax", "cotton",
  "vegetables", "pasture", "fallow",
];

const shareSum = (s: FarmSystem) => s.crops.reduce((n, c) => n + c.share, 0);

describe("crops", () => {
  it("defines every crop id with a full calendar and hex hue", () => {
    for (const id of cropIds) {
      const crop = crops[id];
      expect(crop, id).toBeDefined();
      expect(crop.id).toBe(id);
      for (const season of ["spring", "summer", "autumn", "winter"] as const)
        expect(crop.calendar[season], `${id} ${season}`).toBeTruthy();
      expect(crop.hue).toMatch(/^#[0-9a-f]{6}$/i);
      expect(crop.climates.length).toBeGreaterThan(0);
      expect(crop.evidence.sources.length).toBeGreaterThan(0);
    }
  });
});

describe("farm systems", () => {
  it("reference known crops with shares summing near one", () => {
    for (const s of [...farmSystems, genericFarming]) {
      for (const c of s.crops) expect(crops[c.id], `${s.id} ${c.id}`).toBeDefined();
      const sum = shareSum(s);
      expect(sum, s.id).toBeGreaterThanOrEqual(0.9);
      expect(sum, s.id).toBeLessThanOrEqual(1.1);
    }
  });

  it("selects the expected system by culture, place and date", () => {
    const probes: [CultureId, number, number, number, Climate, string][] = [
      ["european", 0.1, 51.5, 1300, "temperate", "medieval-open-field-strips"],
      ["european", 0.1, 51.5, 1850, "temperate", "enclosed-hedged-fields"],
      ["european", 0.1, 51.5, 1990, "temperate", "modern-mechanised-plantation"],
      ["european", 23, 38, 100, "mediterranean", "mediterranean-terrace-and-wheat"],
      ["north-african-west-asian", 31, 30, -1500, "arid", "nile-flood-basins"],
      ["north-african-west-asian", 44.5, 32, -2000, "arid", "mesopotamian-canal-strips"],
      ["east-asian", 120, 30, 1400, "temperate", "east-asian-wet-rice-basins"],
      ["east-asian", 116, 40, 1400, "temperate", "north-china-millet-wheat-blocks"],
      ["south-asian", 80, 20, 1000, "monsoon", "south-asian-paddy-and-millet"],
      ["southeast-asian", 105, 15, 1500, "tropical", "southeast-asian-paddy-basins"],
      ["mesoamerican", -99, 19, 1400, "temperate", "mesoamerican-milpa-clearings"],
      ["andean", -72, -13, 1450, "tropical", "andean-terraces"],
      ["west-central-african", 7, 9, 1700, "tropical", "west-african-bush-fallow"],
      ["other-indigenous-american", -95, 41, 1900, "temperate", "north-american-section-grid"],
      ["other-indigenous-american", -95, 41, 2000, "temperate", "modern-mechanised-plantation"],
      ["inner-eurasian", 90, 47, 1200, "arid", "inner-eurasian-pastoral"],
    ];
    for (const [culture, lon, lat, year, climate, id] of probes)
      expect(farmSystem({ culture, lon, lat, year, climate }).id, `${culture} ${year}`).toBe(id);
  });

  it("falls back to the labelled generic system", () => {
    const s = farmSystem({
      culture: "australian-pacific",
      lon: 150,
      lat: -33,
      year: 1800,
      climate: "temperate",
    });
    expect(s).toBe(genericFarming);
    expect(s.evidence.status).toBe("fictional");
  });

  it("filters crops by climate and renormalises", () => {
    const nile = farmSystem({
      culture: "north-african-west-asian",
      lon: 31,
      lat: 30,
      year: -1500,
      climate: "arid",
    });
    const list = cropsFor(nile, "boreal");
    expect(list.map((c) => c.id)).toEqual(["barley", "flax", "vegetables", "pasture"]);
    expect(list.reduce((n, c) => n + c.share, 0)).toBeCloseTo(1);
    const all = cropsFor(genericFarming, "tundra");
    expect(all.map((c) => c.id)).toEqual(["fallow", "pasture"]);
  });
});

describe("cropStage", () => {
  it("shifts the calendar two seasons south of the equator", () => {
    expect(cropStage("maize", "summer", 40)).toBe("green");
    expect(cropStage("maize", "autumn", 40)).toBe("ripe");
    expect(cropStage("maize", "spring", -30)).toBe("ripe");
    expect(cropStage("maize", "winter", -30)).toBe("green");
    expect(cropStage("wheat", "winter", -35)).toBe("ripe");
  });
});

describe("kitchen gardens", () => {
  it("grow something of their own place and time in every culture", () => {
    const cultures = cultureIds();
    for (const culture of cultures)
      for (const year of [-2000, 500, 1400, 1900])
        expect(gardenPlant({ culture, year }, "s", 3), `${culture} ${year}`).toBeDefined();
    const beds = new Set([0, 1, 2, 3, 4, 5, 6, 7].map((y) => gardenPlant({ culture: "european", year: 1200 }, "s", y)?.name));
    expect(beds.has("Tomatoes")).toBe(false);
    expect(beds.size).toBeGreaterThan(2);
  });
});

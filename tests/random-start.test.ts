import { describe, expect, it } from "vitest";
import { random } from "../src/core/random";
import { berthFor } from "../src/content/geography/regions/ports";
import { watersidePlace } from "../src/content/geography/resolve";
import { places } from "../src/content/geography/places";
import { characterSex } from "../src/content/characters/generate";
import population from "../src/content/geography/population.generated.json" with { type: "json" };
import {
  randomPopulationWeightedYear,
  randomStartFromDraws,
} from "../src/content/geography/random-start";

describe("random starts", () => {
  it("can draw every atlas location, not only the curated examples", () => {
    for (const id of ["area-oahu-basin", "area-iceland", "city-philadelphia"]) {
      const index = places.findIndex((place) => place.id === id);
      expect(index, id).toBeGreaterThanOrEqual(0);
      const start = randomStartFromDraws(new Uint32Array([index, 0, 0]), "any");
      expect(start.setting.placeId).toBe(id);
    }
  });

  it("draws a civilian waterfront neighbourhood within a dated port catchment", () => {
    const draws=new Uint32Array([places.findIndex(p=>p.id==="city-detroit"),0,0xffffffff,0]);
    let seed=""; let i=0;
    do {seed="river-"+i++;} while(random(seed,"waterside-neighbourhood")>=.08 || random(seed,"underground-start")<.5);
    const {setting}=randomStartFromDraws(draws,"any",seed);
    expect(setting).toMatchObject({placeId:"detroit-terminal",water:"river-ew",settlementPattern:"waterfront"});
    expect(setting.role).not.toMatch(/dockworker|stevedore|longshoreman/i);
    expect(berthFor("ensenada",1996)).toBeUndefined();
    expect(berthFor("ensenada",1997)?.siteId).toBe("ensenada-terminal");
    expect(watersidePlace(places.find(p=>p.id==="city-mwanza")!,1650)).toMatchObject({water:"lake",settlement:"village"});
  });

  it("samples 13,000 BCE through the present in proportion to global population", () => {
    expect(randomPopulationWeightedYear(0)).toBe(-12999);
    expect(randomPopulationWeightedYear(0xffff_ffff)).toBe(2026);

    // At the median person-year, the world is already well into the Common Era.
    expect(randomPopulationWeightedYear(0x8000_0000)).toBeGreaterThan(1000);
  });

  it("puts a realistic start where the people were, not where the map is dense", () => {
    const share = (mode: "any" | "realistic") => {
      const counts: Record<string, number> = {};
      const byId = new Map(places.map((place) => [place.id, place]));
      for (let i = 0; i < 1500; i++) {
        const start = randomStartFromDraws(
          // A fixed year: this is about the place draw, not the year draw.
          new Uint32Array([(i * 2654435761) >>> 0, 0, 0x9000_0000]),
          mode,
        );
        const culture = byId.get(start.setting.placeId)?.culture ?? start.setting.culture;
        counts[culture] = (counts[culture] ?? 0) + 1;
      }
      return (key: string) => (counts[key] ?? 0) / 1500;
    };
    const even = share("any"),
      weighted = share("realistic");
    // The gazetteer holds more North American entries than South Asian ones,
    // which is a cartographic fact about the source rather than a demographic
    // one. Weighting by population turns that around.
    expect(even("other-indigenous-american")).toBeGreaterThan(
      even("south-asian"),
    );
    expect(weighted("south-asian")).toBeGreaterThan(
      weighted("other-indigenous-american") * 3,
    );
    expect(weighted("south-asian") + weighted("east-asian")).toBeGreaterThan(
      0.4,
    );
  });

  it("splits a country by where its people lived, and mostly outside towns before industry", () => {
    const byId = new Map(places.map((place) => [place.id, place]));
    let chinese = 0,
      farWest = 0,
      towns = 0,
      men = 0,
      over45 = 0;
    for (let i = 0; i < 600; i++) {
      const { setting } = randomStartFromDraws(
        // 838 CE.
        new Uint32Array([(i * 2654435761) >>> 0, 0, 0x6000_0000, (i * 2246822519) >>> 0]),
        "realistic",
        `split-${i}`,
      );
      const place = byId.get(setting.placeId)!;
      if (setting.settlement === "city" || setting.settlement === "port") towns++;
      if (characterSex(setting.character!.appearanceSeed!, "player") === "male") men++;
      if (setting.character!.age! >= 45) over45++;
      if (population.places[place.id as keyof typeof population.places] !== "CHN") continue;
      chinese++;
      if (place.lon < 100) farWest++;
    }
    // An even split put a third of China in Tibet and Xinjiang.
    expect(farWest / chinese).toBeLessThan(0.1);
    expect(towns / 600).toBeLessThan(0.15);
    // Work drawn before sex made 55% of starts men; an even age draw put almost
    // half over 45.
    expect(Math.abs(men / 600 - 0.5)).toBeLessThan(0.06);
    expect(over45 / 600).toBeLessThan(0.4);
  });

  it.runIf(!!process.env.FULL)("leaves no place unreachable, including the curated anchors", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 20000; i++)
      seen.add(
        randomStartFromDraws(
          new Uint32Array([(i * 2654435761) >>> 0, 0, (i * 40503) >>> 0]),
          "realistic",
        ).setting.placeId,
      );
    // Rome and Delhi are hand-authored anchors, absent from the generated
    // country table; they take the country of the nearest place that is in it.
    for (const id of ["rome", "delhi", "london"]) expect(seen).toContain(id);
  });
});

import { describe, expect, it } from "vitest";
import { places } from "../src/content/geography/places";
import { placeAtYear, populationAt } from "../src/content/geography/eras";
import { settingFor } from "../src/content/geography/resolve";
import { describedRegionAt } from "../src/content/geography/region-label";
import { urbanForm } from "../src/content/settlements/urban-form";
import {
  characterCommunity,
  resolveCharacterContext,
} from "../src/content/characters/resolve";

const byId = (id: string) => {
  const place = places.find((p) => p.id === id);
  if (!place) throw Error(`No such place: ${id}`);
  return place;
};

describe("dated gazetteer", () => {
  it("places the Po Valley in northern Italy", () => {
    const po = byId("area-po-valley");
    expect(po.lon).toBeGreaterThan(7);
    expect(po.lat).toBeGreaterThan(44);
    expect(describedRegionAt(po.lon, po.lat)?.label).not.toBe("Sahel");
  });
  it("reads a settler-era place at the date being played", () => {
    const knoxville = byId("city-knoxville");
    expect(knoxville.culture).toBe("other-indigenous-american");
    expect(placeAtYear(knoxville, 1600).culture).toBe(
      "other-indigenous-american",
    );
    expect(placeAtYear(knoxville, 1780).culture).toBe("european");
  });
  it("does not project a modern population back before the town existed", () => {
    const knoxville = byId("city-knoxville");
    expect(populationAt(knoxville, 1700)).toBeUndefined();
    expect(populationAt(knoxville, 1780)).toBeUndefined();
    expect(populationAt(knoxville, 1900)).toBeLessThan(knoxville.population!);
    expect(populationAt(knoxville, 2000)).toBe(knoxville.population);
    // A city with nothing left to size it is a village on the same ground.
    expect(placeAtYear(knoxville, 1780).settlement).toBe("village");
  });
  it("leaves an old-world city its own history", () => {
    const hangzhou = byId("city-hangzhou");
    expect(placeAtYear(hangzhou, 1200).culture).toBe("east-asian");
    expect(placeAtYear(hangzhou, 1200).settlement).toBe("port");
    expect(populationAt(hangzhou, 1200)).toBeGreaterThan(100000);
  });
});

describe("culture families by region and date", () => {
  it.each([
    ["city-mombasa", 1400, "east-southern-african", "swahili-stone-town"],
    ["city-kilwa", 1330, "east-southern-african", "swahili-stone-town"],
    ["city-great-zimbabwe", 1350, "east-southern-african", "southern-african-enclosures"],
    ["city-aksum", 350, "east-southern-african", undefined],
    ["city-aden", 1400, "north-african-west-asian", undefined],
    ["city-cape-town", 1500, "east-southern-african", undefined],
    ["city-cape-town", 1750, "european", undefined],
    ["city-buenos-aires", 1400, "other-indigenous-american", undefined],
    ["city-buenos-aires", 1750, "european", "laws-of-the-indies-grid"],
    ["city-salvador", 1700, "european", undefined],
    ["city-lima", 1700, "andean", "laws-of-the-indies-grid"],
    ["city-havana", 1600, "european", "laws-of-the-indies-grid"],
    ["city-port-au-prince", 1780, "european", undefined],
    ["city-port-au-prince", 1850, "west-central-african", undefined],
    ["city-honolulu", 1700, "australian-pacific", undefined],
    ["city-papeete", 1600, "australian-pacific", undefined],
    ["city-yakutsk", 1500, "inner-eurasian", undefined],
    ["city-yakutsk", 1750, "european", undefined],
    ["city-lhasa", 1400, "inner-eurasian", undefined],
    ["city-kabul", 1500, "inner-eurasian", undefined],
    ["city-tehran", 1800, "north-african-west-asian", undefined],
    ["city-seoul", 1500, "east-asian", "korean-ward-grid"],
    ["city-gyeongju", 750, "east-asian", "korean-ward-grid"],
    ["city-busan", 1700, "east-asian", "korean-ward-grid"],
    ["city-constantinople", 1000, "european", undefined],
    ["city-constantinople", 1500, "north-african-west-asian", undefined],
  ] as const)("%s in %i is %s", (id, year, culture, form) => {
    const s = settingFor(byId(id), year);
    expect(s.culture).toBe(culture);
    if (form) expect(urbanForm(s).id).toBe(form);
  });
  it.each([
    ["city-cahokia", 1100],
    ["city-chaco-canyon", 1080],
    ["city-caral", -2500],
    ["city-tiwanaku", 700],
    ["city-aksum", 350],
    ["city-lhasa", 1400],
    ["city-merv", 1100],
  ])("%s is a settled place in %i", (id, year) => {
    expect(settingFor(byId(id), year).settlement).not.toBe("camp");
  });
  it("lets an era that names a town outrank the box around it", () => {
    const brasilia = byId("city-brasilia");
    expect(placeAtYear(brasilia, 1800).culture).toBe("other-indigenous-american");
    expect(placeAtYear(byId("city-belo-horizonte"), 1750).culture).toBe("other-indigenous-american");
    expect(placeAtYear(byId("city-cuiaba"), 1750).culture).toBe("european");
  });
});

describe("community coverage", () => {
  /* The unresearched fallback is a dark generic palette applied to anyone no
   * profile answers for. Reaching it silently is what put an indigenous-
   * American complexion range on an Anglo settler town, so no gazetteer place
   * at a playable date may land on it. */
  it("never falls through to the unresearched profile", () => {
    const misses: string[] = [];
    for (const place of places)
      for (const year of [-2000, 1, 800, 1400, 1700, 1800, 1900, 2000]) {
        const s = settingFor(place, year);
        for (let i = 0; i < 8; i++) {
          const community = characterCommunity(s, "coverage", `a${i}`);
          const ctx = resolveCharacterContext(s, community);
          if (ctx.profile.id === "unresearched")
            misses.push(`${place.id} ${year} ${s.culture} ${community}`);
        }
      }
    expect([...new Set(misses)]).toEqual([]);
  });
});

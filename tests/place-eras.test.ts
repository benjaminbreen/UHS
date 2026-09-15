import { describe, expect, it } from "vitest";
import { places } from "../src/content/geography/places";
import { placeAtYear, populationAt } from "../src/content/geography/eras";
import { settingFor } from "../src/content/geography/resolve";
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

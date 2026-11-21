import { describe, expect, it } from "vitest";
import { random } from "../src/core/random";
import { berthFor } from "../src/content/geography/regions/ports";
import { watersidePlace } from "../src/content/geography/resolve";
import { places, placeById } from "../src/content/geography/places";
import { settingFor } from "../src/content/geography/resolve";
import { characterSex } from "../src/content/characters/generate";
import population from "../src/content/geography/population.generated.json" with { type: "json" };
import {
  randomPopulationWeightedYear,
  randomStartFromDraws,
  randomVarietyYear,
} from "../src/content/geography/random-start";

const indexById = new Map(places.map((p, i) => [p.id, i]));
function findVarietyDraw(id: string) {
  const target = indexById.get(id)!;
  let lo = 0,
    hi = 0xffff_ffff;
  // Pick a seed that never diverts to a waterfront/underground variant during search.
  let drySeed = "dry-0";
  for (let i = 0; random(drySeed, "waterside-neighbourhood") < 0.24 || random(drySeed, "underground-start") < 0.5; i++)
    drySeed = `dry-${i}`;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    const got = indexById.get(
      randomStartFromDraws(new Uint32Array([mid, 0, 0xffffffff, 0]), "any", drySeed).setting.placeId,
    )!;
    if (got === target) return mid >>> 0;
    if (got < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
}

describe("random starts", () => {
  it("maps every atlas location into the population table and can draw across the whole atlas", () => {
    const mapped = population.places as Record<string, string>;
    expect(places.filter((p) => !mapped[p.id])).toEqual([]);
    for (const id of ["area-oahu-basin", "area-iceland", "city-philadelphia", "cairo", "potosi", "ur"]) {
      expect(findVarietyDraw(id), id).toBeGreaterThanOrEqual(0);
    }
  });

  it("draws a civilian waterfront neighbourhood within a dated port catchment", () => {
    const draw = findVarietyDraw("city-detroit");
    expect(draw).toBeGreaterThanOrEqual(0);
    const draws = new Uint32Array([draw, 0, 0xffffffff, 0]);
    let seed=""; let i=0;
    do {seed="river-"+i++;} while(random(seed,"waterside-neighbourhood")>=.08 || random(seed,"underground-start")<.5);
    const {setting}=randomStartFromDraws(draws,"any",seed);
    expect(setting).toMatchObject({placeId:"detroit-terminal",water:"river-ew",settlementPattern:"waterfront"});
    expect(setting.role).not.toMatch(/dockworker|stevedore|longshoreman/i);
    expect(berthFor("ensenada",1996)).toBeUndefined();
    expect(berthFor("ensenada",1997)?.siteId).toBe("ensenada-terminal");
    expect(watersidePlace(places.find(p=>p.id==="city-mwanza")!,1650)).toMatchObject({water:"lake",settlement:"village"});
  });

  it("samples 13,000 BCE through the present in proportion to global population, and evenly by era in variety mode", () => {
    expect(randomPopulationWeightedYear(0)).toBe(-12999);
    expect(randomPopulationWeightedYear(0xffff_ffff)).toBe(2026);

    // At the median person-year, the world is already well into the Common Era.
    expect(randomPopulationWeightedYear(0x8000_0000)).toBeGreaterThan(1000);

    expect(randomVarietyYear(0)).toBe(-12999);
    expect(randomVarietyYear(0xffff_ffff)).toBe(2026);
    // Variety mode puts half its draws in the first six eras (through 1500 CE)
    // and only one twelfth in 1990–2026.
    expect(randomVarietyYear(0x7fff_ffff)).toBeLessThan(1500);
    expect(randomVarietyYear(0xe000_0000)).toBeLessThan(1990);
  });

  it("uses pre-colonial names for colonial and modern planned cities and drops exact coordinate duplicates", async () => {
    expect(settingFor(placeById.get("city-leon")!, -3000).location).toBe("Bajío plains");
    expect(settingFor(placeById.get("city-leon")!, 1700).location).toBe("León");
    expect(settingFor(placeById.get("city-mexico-city")!, -500).location).toBe("Valley of Mexico");
    expect(settingFor(placeById.get("city-mexico-city")!, 1450).location).toBe("Tenochtitlan");
    expect(settingFor(placeById.get("city-lima")!, 1200).location).toBe("Rímac valley");
    expect(settingFor(placeById.get("city-nairobi")!, 1200).location).toBe("Athi plains");
    expect(settingFor(placeById.get("city-islamabad")!, 1800).location).toBe("Potohar plateau");
    expect(settingFor(placeById.get("city-singapore")!, 1500).location).toBe("Temasek");
    expect(settingFor(placeById.get("city-cape-town")!, 1200).location).toBe("Table Bay");
    expect(settingFor(placeById.get("city-wellington")!, 1200).location).toBe("Te Whanganui-a-Tara");
    // Exact-coordinate area-* duplicates are merged into their city-* entry while keeping ID lookup working.
    expect(placeById.get("area-taipei-basin")?.id).toBe("city-taipei");
    const coords = new Set(places.map((p) => `${p.lon.toFixed(4)},${p.lat.toFixed(4)}`));
    expect(coords.size).toBe(places.length);
    // No two equal-priority community profiles may overlap in both space and time.
    const { communityProfiles } = await import("../src/content/characters/profiles/communities");
    for (let i = 0; i < communityProfiles.length; i++) {
      for (let j = i + 1; j < communityProfiles.length; j++) {
        const a = communityProfiles[i],
          b = communityProfiles[j];
        if ((a.priority ?? 0) !== (b.priority ?? 0)) continue;
        const ay = a.scope.years ?? [-Infinity, Infinity],
          by = b.scope.years ?? [-Infinity, Infinity];
        if (ay[1] < by[0] || by[1] < ay[0]) continue;
        const ab = a.scope.bounds,
          bb = b.scope.bounds;
        if (!ab || !bb || ab[2] < bb[0] || bb[2] < ab[0] || ab[3] < bb[1] || bb[3] < ab[1]) continue;
        const am = a.scope.communities,
          bm = b.scope.communities;
        if (Boolean(am) !== Boolean(bm) || (am && bm && !am.some((c) => bm.includes(c)))) continue;
        const ac = a.scope.cultures,
          bc = b.scope.cultures;
        if (ac && bc && !ac.some((c) => bc.includes(c))) continue;
        throw Error(`Overlapping equal-priority community profiles: ${a.id} and ${b.id}`);
      }
    }
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
    // Geographic variety mode balances cultures evenly across the twelve regions,
    // while realistic mode puts weight where the population actually lived.
    expect(even("mesoamerican")).toBeGreaterThan(0.05);
    expect(even("other-indigenous-american")).toBeLessThan(0.12);
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

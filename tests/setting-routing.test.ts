import { describe, expect, it } from "vitest";
import { resolveSetting, settingFor } from "../src/content/geography/resolve";
import {
  parseScenarioUrl,
  resolvePathSetting,
  scenarioUrl,
} from "../src/content/geography/url";
import { og, renderScenarioHtml } from "../server/og";
import { places } from "../src/content/geography/places";
import { arrivalBackdrop } from "../src/ui/arrival-data";
const resolve = (prompt: string, seed = "routing") => {
  const result = resolveSetting(prompt, seed);
  if ("error" in result) throw Error(result.error);
  return result;
};
describe("local-first setting interpretation", () => {
  it("routes clear requests locally and incomplete or unrecognized requests to World Weaver", () => {
    expect(resolve("renaissance Florence weaver").needsInterpretation).toBe(
      false,
    );
    expect(resolve("ancient shaman guy").needsInterpretation).toBe(true);
    expect(resolve("renaissance Florence astronaut").needsInterpretation).toBe(
      true,
    );
    expect(resolve("medieval central asian weaver").needsInterpretation).toBe(
      false,
    );
    expect(resolve("a sailor in Alexandria").needsInterpretation).toBe(true);
    expect(resolve("Elizabethan London").needsInterpretation).toBe(false);
  });
  it("samples a period and character reproducibly while preserving exact dates", () => {
    const first = resolve("renaissance Florence weaver");
    expect(first).toEqual(resolve("renaissance Florence weaver"));
    expect(first.setting.role).toBe("Weaver");
    expect(first.setting.characterName).not.toBe("Weaver");
    const years = Array.from(
      { length: 12 },
      (_, i) =>
        resolve("renaissance Florence weaver", `seed-${i}`).setting.year,
    );
    expect(new Set(years).size).toBeGreaterThan(1);
    expect(years.every((year) => year >= 1400 && year <= 1599)).toBe(true);
    expect(resolve("Florence weaver 1483").setting.year).toBe(1483);
    expect(resolve("Florence weaver 750").setting.year).toBe(750);
    expect(resolve("Florence weaver 100 BCE").setting.year).toBe(-99);
  });
  it("keeps a requested local trade instead of drawing an unrelated one", () => {
    const baker = resolve("A Roman baker in Ostia, 100 CE");
    expect(baker.needsInterpretation).toBe(false);
    expect(baker.setting.role.toLowerCase()).toContain("baker");
    const brewer = resolve("A Roman apprentice brewer in Ostia, 100 CE");
    expect(brewer.needsInterpretation).toBe(false);
    expect(brewer.setting.role).toBe("Apprentice Brewer");
  });
});


describe("arrival scenery for resolved settings", () => {
  it("shows the Central Asian frontier across places and dates, including Oskemen 1847", () => {
    for (const id of ["city-oskemen", "city-omsk", "city-nur-sultan"]) {
      const place = places.find((p) => p.id === id)!;
      expect(place, id).toBeDefined();
      for (const year of [1700, 1847, 1899]) {
        expect(arrivalBackdrop(settingFor(place, year)), `${id} ${year}`).toBe(
          "/opening/central-asian-frontier.webp",
        );
      }
      expect(arrivalBackdrop(settingFor(place, 1900))).toBe(
        "/opening/central-asia-1930.webp",
      );
    }
  });

  it("keeps highland and European settings out of South Asian and ancient West Asian fallbacks", () => {
    for (const [id, image] of [
      ["city-xigaze", "tibetan-highlands-later"],
      ["city-leh", "tibetan-highlands-later"],
      ["city-gondar", "east-africa-highlands-later"],
      ["city-moscow", "eastern-europe-timber-settlements"],
    ]) {
      const place = places.find((p) => p.id === id)!;
      for (const year of [1300, 1650, 1847]) {
        expect(arrivalBackdrop(settingFor(place, year)), `${id} ${year}`).toBe(
          `/opening/${image}.webp`,
        );
      }
    }
    expect(arrivalBackdrop(resolve("Seoul farmer 1800").setting)).toBe(
      "/opening/korea-medieval-early-modern.webp",
    );
  });
});

describe("custom URL routing and sharing", () => {
  it("resolves /:year/:place/:mode? legacy paths to playable settings", () => {
    const cases: [string, string, number][] = [
      ["/-395/Roman%20Campagna/exploration", "rome", -394],
      ["/1857/Punjab%20Plains/survival", "city-lahore", 1857],
      ["/1144/Ethiopian%20Highlands/exploration", "ethiopia", 1144],
      ["/1825/Mississippi%20Delta/exploration", "city-new-orleans", 1825],
      ["/623/Eastern%20Woodlands/exploration", "iroquoia", 623],
      ["/1348/Normandy", "normandy", 1348],
      ["/1857/punjab-plains/survival", "city-lahore", 1857],
    ];
    for (const [pathname, placeId, year] of cases) {
      const setting = resolvePathSetting(pathname, "path-test");
      expect(setting, pathname).toBeDefined();
      expect(setting!.placeId, pathname).toBe(placeId);
      expect(setting!.year, pathname).toBe(year);
    }
  });

  it("parses role, pace, seed, modifiers, ?start=, and autoStart", () => {
    const dyer = parseScenarioUrl(
      "/1350/Kyoto/dyer",
      "?pace=quick&seed=hist101&weather=snow&condition=blind&go=1",
      "fallback",
    );
    expect(dyer?.setting).toBeDefined();
    expect(dyer?.setting?.year).toBe(1350);
    expect(dyer?.setting?.role.toLowerCase()).toContain("dyer");
    expect(dyer?.setting?.weather).toBe("snow");
    expect(dyer?.setting?.season).toBe("winter");
    expect(dyer?.setting?.condition).toBe("blind");
    expect(dyer?.seed).toBe("hist101");
    expect(dyer?.pace).toBe("quick");
    expect(dyer?.autoStart).toBe(true);

    const fromQuery = parseScenarioUrl(
      "/",
      "?start=A+weaver+in+Oaxaca+1650&pace=quick&go=1",
      "qseed",
    );
    expect(fromQuery?.setting?.year).toBe(1650);
    expect(fromQuery?.setting?.role).toBe("Weaver");
    expect(fromQuery?.pace).toBe("quick");
    expect(fromQuery?.autoStart).toBe(true);
  });

  it("resolves coordinate URLs both in paths and query params", () => {
    const byPath = parseScenarioUrl(
      "/1835/@-1.29,-90.43/naturalist",
      "?seed=beagle",
      "fallback",
    );
    expect(byPath?.setting).toBeDefined();
    expect(byPath?.setting?.placeId).toBe("coord--1.290,-90.430");
    expect(byPath?.setting?.year).toBe(1835);
    expect(byPath?.setting?.lat).toBeCloseTo(-1.29, 2);
    expect(byPath?.setting?.lon).toBeCloseTo(-90.43, 2);
    expect(byPath?.setting?.role).toBe("Naturalist");

    const byQuery = parseScenarioUrl(
      "/",
      "?lat=35.01&lon=135.77&year=1650&role=farmer",
      "qcoord",
    );
    expect(byQuery?.setting?.year).toBe(1650);
    expect(byQuery?.setting?.lat).toBeCloseTo(35.01, 2);
    expect(byQuery?.setting?.lon).toBeCloseTo(135.77, 2);
  });

  it("round-trips serialized scenarioUrl links", () => {
    const rome = resolvePathSetting("/-395/Rome/baker", "rt")!;
    const rel = scenarioUrl(rome, { seed: "class-1", pace: "quick" });
    expect(rel).toBe("/-395/Rome/baker?seed=class-1&pace=quick");
    const [path, qs] = rel.split("?");
    const back = parseScenarioUrl(path, `?${qs}`, "other");
    expect(back?.setting?.placeId).toBe("rome");
    expect(back?.setting?.year).toBe(-394);
    expect(back?.setting?.role).toBe("Baker");
    expect(back?.seed).toBe("class-1");
    expect(back?.pace).toBe("quick");

    const galapagos = parseScenarioUrl("/1835/@-1.29,-90.43/naturalist", "", "rt")!
      .setting!;
    expect(scenarioUrl(galapagos)).toBe("/1835/@-1.29,-90.43/naturalist");
  });

  it("ignores root, unknown, and malformed paths", () => {
    for (const pathname of [
      "/",
      "/edumode",
      "/not-a-year/Rome/exploration",
      "/1857/Atlantis/exploration",
      "/1857/%E0%A4%A/exploration",
      "/1857/Rome/exploration/extra",
      "/1857/@999,999",
    ]) {
      expect(resolvePathSetting(pathname, "path-test"), pathname).toBeUndefined();
    }
  });

  it("injects Open Graph metadata for valid scenario URLs and leaves unknown paths untouched", async () => {
    const shell =
      '<!doctype html><html><head><meta name="description" content="Default"/><title>Universal History Simulator</title></head><body></body></html>';
    const html = renderScenarioHtml(
      shell,
      "/1350/Kyoto/dyer",
      "",
      "https://historysimulator.vercel.app",
    );
    expect(html).toContain("<title>Dyer in Kyoto");
    expect(html).toContain("1350 CE — Universal History Simulator</title>");
    expect(html).toContain('property="og:image" content="https://historysimulator.vercel.app/opening/');
    expect(html).toContain('name="twitter:card" content="summary_large_image"');

    expect(renderScenarioHtml(shell, "/1857/Atlantis")).toBe(shell);

    const res = await og(
      new Request(
        "https://historysimulator.vercel.app/api/og?_year=-395&_place=Roman%20Campagna&_role=exploration",
      ),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/html");
    const body = await res.text();
    expect(body).toContain("395 BCE — Universal History Simulator</title>");
    expect(body).not.toContain("Exploration in");
  });
});

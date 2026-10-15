import { describe, expect, it } from "vitest";
import { resolveSetting, settingFor } from "../src/content/geography/resolve";
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

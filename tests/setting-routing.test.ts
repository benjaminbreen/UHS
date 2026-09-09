import { describe, expect, it } from "vitest";
import { resolveSetting } from "../src/content/geography/resolve";
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
});

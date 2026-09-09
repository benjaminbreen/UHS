import { describe, expect, it } from "vitest";
import {
  actorAppearance,
  faceFromTraits,
  heightForAge,
  allowedHeights,
  generateAppearance,
  originalAppearance,
} from "../src/core/character";
import { characterAppearanceSchema } from "../src/runtime/schema";
import { portableProps } from "../src/render/characters/props";
import atlas from "../public/props/atlas.json";
import { propDefs } from "../src/content/props/catalog";
describe("character recipes", () => {
  it("has repeatable independent body and clothing variety", () => {
    const people = Array.from({ length: 192 }, (_, i) =>
      generateAppearance("study", i),
    );
    expect(people).toEqual(
      Array.from({ length: 192 }, (_, i) => generateAppearance("study", i)),
    );
    expect(new Set(people.map((a) => a.build)).size).toBe(4);
    expect(people.every((a) => a.height >= -1)).toBe(true);
    expect(new Set(people.map((a) => a.wearing.garment)).size).toBe(8);
    expect(new Set(people.map((a) => a.hair)).size).toBe(8);
    for (const a of people)
      expect(characterAppearanceSchema.safeParse(a).success).toBe(true);
  });
  it("uses explicit clothing and preserves the old tunic palette otherwise", () => {
    const legacy = { id: "npc", sprite: "human-1-3" };
    expect(actorAppearance(legacy).wearing.color).toBe("#738245");
    expect(actorAppearance({ ...legacy, appearance: originalAppearance })).toBe(
      originalAppearance,
    );
  });
  it("requires native hex colors and supported body sizes", () => {
    expect(
      characterAppearanceSchema.safeParse({ ...originalAppearance, height: -3 })
        .success,
    ).toBe(false);
    expect(
      characterAppearanceSchema.safeParse({
        ...originalAppearance,
        skin: "red",
      }).success,
    ).toBe(false);
  });
  it("provides exact native artwork for every portable object", () => {
    expect(portableProps.length).toBe(
      Object.values(propDefs).filter((d) => d.portable).length,
    );
    for (const p of portableProps)
      expect(atlas.frames).toHaveProperty(p.sprite);
  });
  it("defaults adults to original height and reserves extremes for rare cases", () => {
    const heights = Array.from({ length: 10000 }, (_, i) =>
      heightForAge("height-study", i, 30),
    );
    const fraction = (height: number) =>
      heights.filter((h) => h === height).length / heights.length;
    expect(fraction(0)).toBeGreaterThan(0.77);
    expect(fraction(0)).toBeLessThan(0.83);
    expect(fraction(1)).toBeLessThan(0.12);
    expect(fraction(2)).toBeLessThan(0.025);
    expect(fraction(-2)).toBe(0);
    expect(actorAppearance({ id: "player", sprite: "human-0-0" }).height).toBe(
      0,
    );
  });
  it("applies the under-six boundary and retains shorter adults", () => {
    for (let i = 0; i < 100; i++) {
      expect(heightForAge("ages", i, 5)).toBe(-2);
      expect(heightForAge("ages", i, 6)).toBe(-2);
      expect(heightForAge("ages", i, 12)).toBe(-2);
      expect(heightForAge("ages", i, 13)).not.toBe(-2);
      expect(generateAppearance("ages", i, 4).beard).toBe("none");
    }
    expect(allowedHeights(30)).toContain(-1);
    expect(allowedHeights(13)).not.toContain(-2);
    const appearance = { ...originalAppearance, height: -2 as const };
    expect(
      actorAppearance({ id: "child", sprite: "human-0-0", age: 5, appearance })
        .height,
    ).toBe(-2);
    expect(
      actorAppearance({ id: "adult", sprite: "human-0-0", age: 30, appearance })
        .height,
    ).toBe(0);
    for (const height of [-2, -1, 0, 1, 2])
      expect(
        characterAppearanceSchema.safeParse({ ...originalAppearance, height })
          .success,
      ).toBe(true);
  });
});

it("uses weighted rather than mandatory face traits, keeping the original option", () => {
  const jaws = (strength: number, sex: "male" | "female", age: number) =>
    Array.from(
      { length: 1000 },
      (_, i) => faceFromTraits("traits", i, age, { strength, sex }).jaw,
    );
  const strong = jaws(95, "male", 40),
    average = jaws(40, "male", 40),
    elder = jaws(30, "female", 75);
  expect(strong.filter((j) => j === "square").length).toBeGreaterThan(
    average.filter((j) => j === "square").length,
  );
  expect(new Set(strong).size).toBeGreaterThan(1);
  expect(average).toContain("original");
  expect(elder.filter((j) => j === "small").length).toBeGreaterThan(600);
});

it("defaults to narrower builds while preserving all previous widths", () => {
  const people = Array.from({ length: 2000 }, (_, i) =>
    generateAppearance("widths", i),
  );
  expect(originalAppearance.build).toBe(-1);
  expect(
    people.filter((a) => a.build === -1).length / people.length,
  ).toBeGreaterThan(0.7);
  for (const build of [-1, 0, 1, 2])
    expect(
      characterAppearanceSchema.safeParse({ ...originalAppearance, build })
        .success,
    ).toBe(true);
});

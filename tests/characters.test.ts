import { describe, expect, it } from "vitest";
import { composeWearing, wornFromWearing } from "../src/core/wearing";
import { wearableItems } from "../src/content/characters/wearables";
import {
  actorAppearance,
  faceFromTraits,
  generateFace,
  heightForAge,
  allowedHeights,
  generateAppearance,
  originalAppearance,
} from "../src/core/character";
import { characterAppearanceSchema } from "../src/runtime/schema";
import { portableProps } from "../src/render/characters/props";
import atlas from "../public/props/atlas.json";
import natureAtlas from "../public/nature/atlas.json";
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
  it("stores a deterministic, versioned portrait face recipe", () => {
    const people = Array.from({ length: 96 }, (_, index) =>
      generateAppearance("portrait-recipe", index, 30),
    );
    expect(people.every((person) => person.face?.revision === 1)).toBe(true);
    expect(new Set(people.map((person) => person.face?.eyeShape)).size).toBe(3);
    // Nine profiles are drawn, weighted toward the four common ones; ninety-six
    // faces reach all of them.
    expect(new Set(people.map((person) => person.face?.nose)).size).toBe(9);
    // Weighted toward average: an even third each made a third of every crowd
    // wide-set.
    const spacing = people.filter((p) => p.face?.eyeSpacing === "wide").length;
    expect(spacing).toBeLessThan(people.length / 4);
    expect(generateFace("portrait-recipe", 4, 30)).toEqual(
      generateFace("portrait-recipe", 4, 30),
    );
    expect(generateFace("portrait-recipe", 4, 70).detail).toMatch(
      /lines|weathered/,
    );
  });
  it("accepts old appearance recipes without a portrait face block", () => {
    expect(
      characterAppearanceSchema.safeParse(originalAppearance).success,
    ).toBe(true);
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
    // Wild stone is placed by the land, not a settlement, so the boulder
    // family is drawn from the nature atlas in the local stone colour (see
    // the note in the prop catalog). Everything else comes from the props
    // atlas; both are checked so no portable object goes unpictured.
    for (const p of portableProps) {
      const wild = propDefs[p.id as keyof typeof propDefs].family === "boulder";
      if (wild)
        expect(
          Object.keys(natureAtlas.frames).some((f) =>
            f.startsWith("nature-boulder-"),
          ),
        ).toBe(true);
      else expect(atlas.frames).toHaveProperty(p.sprite);
    }
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
it("draws a sex for every body and keeps beards off women", () => {
  for (let i = 0; i < 200; i++) {
    const drawn = generateAppearance("sexes", i, 30);
    expect(["male", "female"]).toContain(drawn.physique?.sex);
    const woman = generateAppearance("sexes", i, 30, { sex: "female" });
    expect(woman.physique?.sex).toBe("female");
    expect(woman.beard).toBe("none");
    const man = generateAppearance("sexes", i, 30, { sex: "male" });
    expect(man.physique?.sex).toBe("male");
  }
  expect(
    Array.from(
      { length: 200 },
      (_, i) => generateAppearance("sexes", i, 30, { sex: "male" }).beard,
    ).some((beard) => beard !== "none"),
  ).toBe(true);
});
it("derives the worn look from items and back", () => {
  const base = {
    ...originalAppearance.wearing,
    headwear: "cap" as const,
    necklace: true,
    cloak: true,
    belt: "sash" as const,
    garment: "robe" as const,
  };
  const worn = wornFromWearing(base);
  expect(worn).toEqual({
    body: "garment-robe",
    head: "headwear-cap",
    over: "cloak",
    belt: "belt-sash",
    neck: "necklace",
  });
  const composed = composeWearing(base, worn, (id) => wearableItems[id]);
  expect(composed).toMatchObject({
    garment: "robe",
    sleeves: "loose",
    headwear: "cap",
    necklace: true,
    cloak: true,
    belt: "sash",
    earrings: false,
    color: base.color,
  });
  const undressed = composeWearing(
    base,
    { body: worn.body },
    (id) => wearableItems[id],
  );
  expect(undressed.headwear).toBe("none");
  expect(undressed.necklace).toBe(false);
  expect(undressed.cloak).toBe(false);
});

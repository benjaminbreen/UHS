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
import atlas from "../public/props/atlas.json" with { type: "json" };
import natureAtlas from "../public/nature/atlas.json" with { type: "json" };
import { propDefs } from "../src/content/props/catalog";
import { drawHead } from "../src/render/characters/v2/head";
import { Pixels, ramp } from "../src/render/characters/v2/pixels";
import type { CharacterAppearance } from "../src/core/character";
import type { RestingExpression } from "../src/core/persona";
import type { CharacterPose } from "../src/render/characters/poses";
import { workPoseFor } from "../src/render/characters/poses";
import { defaultRenderer, workerDrawn } from "../src/render/characters/renderers";

it("selects physical work by the task instead of treating every station alike", () => {
  expect(workPoseFor("work", "Brewing")).toBe("work-stir");
  expect(workPoseFor("work", "Preparing food")).toBe("work-knead");
  expect(workPoseFor("work", "Working the grain")).toBe("work-pound");
  expect(workPoseFor("work", "Weaving")).toBe("work-weave");
  expect(workPoseFor("work", "Washing")).toBe("work-scrub");
  expect(workPoseFor("tend", "Weeding the rows")).toBe("work-tend");
  expect(workPoseFor("gather", "Gathering plants")).toBe("work-tend");
  expect(workPoseFor("gather", "Working stone")).toBeUndefined();
  expect(workPoseFor("work", "Raising a barrel")).toBe("work-pound");
  expect(workPoseFor("work", "At the workbench", "anvil")).toBe("work-pound");
  expect(workPoseFor("tend", "The agnihotra")).toBeUndefined();
  expect(workPoseFor("work", "Minding the stall", "barrel")).toBe("work-sort");
  expect(workPoseFor("work", "Working the grain", "quern")).toBe("work-quern");
  expect(workPoseFor("work", "Working the grain", "metate")).toBe("work-grind");
  expect(workPoseFor("work", "Washing clothes at the water", "shallow-water")).toBe("work-rinse");
  expect(workPoseFor("work", "Working near water", "shallow-water")).toBe("work-fish");
  expect(workPoseFor("haul-catch", "Hanging the catch", "drying-rack")).toBe("work-hang");
  expect(workPoseFor("work", "Working leather", "tanning-pits")).toBe("work-scrub");
  expect(workPoseFor("draw-water", "Drawing water", "well")).toBe("tug");
  expect(workPoseFor("work", "Standing watch", "barrel")).toBeUndefined();
});

function headPixels(a: CharacterAppearance, expression: RestingExpression, pose: CharacterPose = "idle", squeezed = false) {
  const pixels = new Map<string, string>();
  const ctx = {
    fillStyle: "",
    getTransform: () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }),
    fillRect(x: number, y: number, w: number, h: number) {
      for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++)
        pixels.set(`${i},${j}`, this.fillStyle);
    },
    clearRect(x: number, y: number, w: number, h: number) {
      for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++)
        pixels.delete(`${i},${j}`);
    },
  };
  const p = new Pixels(ctx as unknown as CanvasRenderingContext2D);
  p.modeling = false;
  if (squeezed) p.squeeze = { rows: [5, 14], cols: [5, 15] };
  drawHead(p, a, false, false, pose, 0, 0, false, expression);
  return pixels;
}

it("separates neutral mouths from every nose shadow in drawn and compressed heads", () => {
  for (const nose of ["straight", "broad", "snub"] as const) {
    const a: CharacterAppearance = { ...originalAppearance, hair: "bald", beard: "none", head: "original", jaw: "original",
      face: { ...generateFace("expression-test", 0), nose, mouth: "soft", detail: "clear" },
      wearing: { ...originalAppearance.wearing, headwear: "none", eyewear: "none" } };
    for (const squeezed of [false, true]) {
      const pixels = headPixels(a, "neutral", "idle", squeezed);
      const gap = squeezed ? 12 : 11, mouth = gap + 1;
      expect(pixels.get(`10,${gap}`)).toBe(ramp(a.skin, "skin").base);
      expect(pixels.get(`11,${gap}`)).toBe(ramp(a.skin, "skin").base);
      expect(pixels.get(`10,${mouth}`)).not.toBe(ramp(a.skin, "skin").base);
      expect(pixels.get(`10,${mouth}`)).toBe(pixels.get(`11,${mouth}`));
    }
  }
});

it("draws five distinct resting faces while hurt and startle override them", () => {
  const a: CharacterAppearance = { ...originalAppearance, hair: "bald", beard: "none", head: "original", jaw: "original" };
  const expressions: RestingExpression[] = ["neutral", "smile", "soft", "serious", "concerned"];
  expect(new Set(expressions.map((e) => JSON.stringify([...headPixels(a, e)]))).size).toBe(5);
  for (const pose of ["hurt", "startle"] as const)
    for (const expression of expressions)
      expect(headPixels(a, expression, pose)).toEqual(headPixels(a, "neutral", pose));
});

describe("character recipes", () => {
  // b81615cb made E the default while only C and D went to workers: 79 hitches a walk.
  it("draws the default renderer off the main thread", () => {
    expect(workerDrawn(defaultRenderer)).toBe(true);
  });
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

it("keeps authored cuts, sleeve shapes and mantle when composing worn equipment", () => {
  const base = { ...originalAppearance.wearing, garment: "open-robe" as const, sleeves: "loose" as const,
    front: "cross" as const, cut: "full" as const, cloak: false, mantle: true, headwear: "top-hat" as const, headColor: "#303238" };
  const worn = wornFromWearing(base);
  expect(worn.over).toBe("mantle");
  expect(composeWearing(base, worn, (id) => wearableItems[id])).toMatchObject({
    sleeves: "loose", front: "cross", cut: "full", mantle: true, headwear: "top-hat", headColor: "#303238",
  });
  const changed = composeWearing(base, { body: "garment-shirt" }, (id) => wearableItems[id]);
  expect(changed.cut).toBeUndefined();
  expect(changed.front).toBeUndefined();
  expect(changed.sleeves).toBe("long");
  expect(composeWearing(base, {}, (id) => wearableItems[id]).front).toBeUndefined();
});

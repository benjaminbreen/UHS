import { describe, expect, it } from "vitest";
import { findNearest, namedAnimal, parseFind } from "../src/runtime/find";
import type { Snapshot } from "../src/core/types";

const actor = (id: string, name: string, x: number, y: number, extra = {}) =>
  ({
    id,
    name,
    role: "Farmer",
    kind: "human",
    pos: { x, y, space: "outside" },
    home: { x, y, space: "outside" },
    work: { x, y, space: "outside" },
    sprite: "person",
    inventory: {},
    activity: "",
    fatigue: 0,
    hunger: 0,
    trust: 0,
    memories: [],
    direction: 0,
    ...extra,
  }) as Snapshot["actors"][number];

const group = (
  speciesId: string,
  x: number,
  y: number,
  extra: { owner?: string; space?: string } = {},
) => ({
  id: `g-${speciesId}-${x}`,
  speciesId,
  members: [{ x, y, direction: 1 as const }],
  pos: { x, y, space: extra.space ?? "outside" },
  home: { x, y, space: extra.space ?? "outside" },
  homeRadius: 4,
  state: "idle" as const,
  nextDecisionAt: 0,
  stride: 0,
  since: 0,
  owner: extra.owner,
});

const state = (over: Partial<Snapshot> = {}) =>
  ({
    player: actor("player", "You", 0, 0),
    actors: [],
    fauna: [],
    ...over,
  }) as unknown as Snapshot;

describe("parseFind", () => {
  it("takes the verbs a player would type and ignores everything else", () => {
    expect(parseFind("find the chickens")).toEqual(["chickens"]);
    expect(parseFind("go to the nearest goat")).toEqual(["goat"]);
    expect(parseFind("  Walk To Some Pigs ")).toEqual(["pigs"]);
    expect(parseFind("head for the blacksmith")).toEqual(["blacksmith"]);
    expect(parseFind("I look around the barn")).toBeUndefined();
    expect(parseFind("ask the herder about the flock")).toBeUndefined();
  });
  it("reads a bare hunt as wild game and a hunt of something as both", () => {
    expect(parseFind("hunt")).toEqual(["wild"]);
    expect(parseFind("hunt deer")).toEqual(["deer", "wild"]);
    expect(parseFind("find the deer")).toEqual(["deer"]);
  });
});

describe("findNearest", () => {
  it("finds cats and mice by the names a player uses", () => {
    const s = state({ fauna: [group("cat", 4, 0), group("mouse", 2, 0)] } as Partial<Snapshot>);
    expect(findNearest(s, parseFind("find cat")!)?.label).toBe("Cat");
    expect(findNearest(s, parseFind("find the kitten")!)?.label).toBe("Cat");
    expect(findNearest(s, parseFind("find mice")!)?.label).toBe("House mouse");
    expect(findNearest(state(), parseFind("find cat")!)).toBeUndefined();
    expect(namedAnimal(parseFind("find cats")!)).toBe("cat");
    expect(namedAnimal(parseFind("find the blacksmith")!)).toBeUndefined();
  });
  it("finds an animal by species, singular or plural", () => {
    const s = state({ fauna: [group("chicken", 3, 4), group("goat", 20, 0)] });
    expect(findNearest(s, ["chickens"])?.label).toBe("Chicken");
    expect(findNearest(s, ["chicken"])?.label).toBe("Chicken");
    expect(findNearest(s, ["goat"])?.point).toEqual({ x: 20, y: 0 });
    expect(findNearest(s, ["camel"])).toBeUndefined();
  });
  it("takes the closest of several of the same species", () => {
    const s = state({
      fauna: [group("sheep", 30, 0), group("sheep", 6, 0), group("sheep", 14, 0)],
    });
    expect(findNearest(s, ["sheep"])?.point).toEqual({ x: 6, y: 0 });
  });
  it("separates wild game from kept livestock", () => {
    const s = state({
      fauna: [
        group("sheep", 2, 0, { owner: "h1" }),
        group("red-deer", 25, 0),
      ],
    });
    expect(findNearest(s, ["wild"])?.label).toBe("Red deer");
    expect(findNearest(s, ["livestock"])?.label).toBe("Sheep");
    // "animal" matches either, so the nearest wins.
    expect(findNearest(s, ["animal"])?.label).toBe("Sheep");
  });
  it("finds people by name or role, and prefers an animal for an animal word", () => {
    const s = state({
      actors: [actor("h1", "Aelis", 4, 0), actor("h2", "Bern", 9, 0, { role: "Herder" })],
      fauna: [group("goat", 5, 0)],
    });
    expect(findNearest(s, ["aelis"])?.label).toBe("Aelis");
    expect(findNearest(s, ["herder"])?.label).toBe("Bern");
    expect(findNearest(s, ["people"])?.label).toBe("Aelis");
    expect(findNearest(s, ["goat"])?.label).toBe("Goat");
  });
  it("never reaches into another space", () => {
    const s = state({
      fauna: [group("chicken", 1, 1, { space: "house-1" })],
      actors: [actor("h1", "Aelis", 2, 2, { pos: { x: 2, y: 2, space: "house-1" } })],
    });
    expect(findNearest(s, ["chicken"])).toBeUndefined();
    expect(findNearest(s, ["aelis"])).toBeUndefined();
  });
});

import { expect, it } from "vitest";
import { createSession } from "../src/runtime/session";
import { pestOf, pestsFor } from "../src/content/agriculture/pests";
import { crops } from "../src/content/agriculture/crops";
import type { Engine } from "../src/core/engine";
import type { Actor } from "../src/core/types";

/** Open ground with a ripe wheat field from x 6 to 16, owned by a neighbour. */
function wheatField(seed: string) {
  const engine = createSession("roman", seed);
  engine.state.actors = [];
  engine.state.objects = [];
  engine.state.fauna = [];
  engine.world.blocked = () => false;
  engine.world.decoration = () => undefined;
  const field = { crop: "wheat", stage: "ripe", owner: "neighbour", parcel: 1, axis: "x", edges: 0, boundary: "none", wet: false, fence: 0 };
  engine.world.topography = ((x: number, y: number) =>
    x >= 6 && x <= 16 && Math.abs(y) <= 5 ? { field } : {}) as never;
  engine.world.fauna = undefined;
  engine.state.player.pos = { x: 0, y: 0, space: "outside" };
  // Mid-morning, when the rooks are about.
  engine.state.clock = Math.floor(engine.state.clock / 86400) * 86400 + 10 * 3600;
  return engine;
}
const raidOn = (engine: Engine, species: string) =>
  (engine as unknown as { startRaid: Function }).startRaid(pestOf(species), { x: 12, y: 0 }, engine.state.clock);
const eaten = (engine: Engine) =>
  Object.values(engine.state.tiles ?? {}).filter((t) => t.picked).length;
const raid = (engine: Engine) => engine.state.fauna?.find((g) => g.raid);

it("sends rooks to ripe grain in Roman Italy, and nothing to a fallow field", () => {
  const present = new Set(["rook"]);
  expect(pestsFor(crops.wheat, "ripe", 10, present).map((p) => p.species)).toEqual(["rook"]);
  expect(pestsFor(crops.fallow, "ripe", 10, present)).toEqual([]);
  expect(pestsFor(crops.wheat, "ripe", 23, present)).toEqual([]);
});

it("eats the crop until someone drives it off, and thanks go to whoever did", () => {
  const engine = wheatField("pests-player");
  raidOn(engine, "rook");
  expect(raid(engine)?.speciesId).toBe("rook");
  engine.advance(600);
  expect(eaten(engine)).toBeGreaterThan(0);
  const g = raid(engine)!;
  expect(g.raid!.left).toBeUndefined();

  engine.state.player.pos = { x: g.pos.x - 1, y: g.pos.y, space: "outside" };
  engine.advance(60);
  expect(raid(engine)?.raid?.left ?? "gone").not.toBeUndefined();
  expect(engine.state.today?.pests).toBe(1);
  expect(engine.state.events.some((e) => /You drive the rooks off/.test(e.text))).toBe(true);
});

it("has a farmer go after a raid on their own", () => {
  const engine = wheatField("pests-farmer");
  engine.state.player.pos = { x: -30, y: 0, space: "outside" };
  const farmer = {
    id: "neighbour",
    name: "Gaius",
    kind: "human",
    role: "Farmer",
    pos: { x: 4, y: 3, space: "outside" },
    home: { x: 4, y: 3, space: "outside" },
    work: { x: 4, y: 3, space: "outside" },
    direction: 1,
    activity: "Tending cultivation",
    hunger: 0,
    fatigue: 0,
    trust: 0,
    memories: [],
    inventory: {},
    age: 40,
    origin: { revision: 1, profile: "x", community: "x", livelihood: "farmer" },
  } as unknown as Actor;
  engine.state.actors.push(farmer);
  raidOn(engine, "rook");
  engine.advance(30);
  expect(farmer.activity).toBe("Chasing the rooks off the wheat");
  expect(farmer.pos.x, "went to the field").toBeGreaterThan(6);
  engine.advance(600);
  expect(raid(engine)?.raid?.left ?? "gone").not.toBeUndefined();
  expect(eaten(engine), "put up before it had its fill").toBeLessThan(30);
  expect(engine.state.today?.pests ?? 0).toBe(0);
});

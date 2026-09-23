import { expect, it } from "vitest";
import { resolveSetting } from "../src/content/geography/resolve";
import { createSettingSession } from "../src/runtime/session";
import {
  applySituation,
  situationSchema,
} from "../src/content/geography/situation";

function resolve(prompt: string) {
  const r = resolveSetting(prompt, "situation-check");
  if ("error" in r) throw Error(r.error);
  return r.setting;
}
it("keeps dimensions separate from dates and rejects invalid situations", () => {
  const s = resolve("tiny desert island 10x5 in 1944");
  expect(s.year).toBe(1944);
  expect(s.situation).toMatchObject({ width: 10, depth: 5, landform: "islet" });
  expect(resolveSetting("tiny desert island 999x5")).toHaveProperty("error");
  expect(() =>
    applySituation(s, situationSchema.parse({ landform: "open-ocean" })),
  ).toThrow(/support/);
  expect(resolve("Roman military camp").year).toBe(100);
  expect(resolve("Everest base camp").year).toBe(1953);
  expect(resolve("ww2 pilot downed, floating in atlantic").year).toBe(1944);
});
it("generates a small bounded island with a palm and no settlement", () => {
  const e = createSettingSession(resolve("tiny desert island"), "islet-test"),
    w = e.world;
  const land: { x: number; y: number }[] = [];
  for (let y = -10; y <= 10; y++)
    for (let x = -12; x <= 12; x++)
      if (w.terrain(x, y) !== "water") land.push({ x, y });
  expect(
    Math.max(...land.map((p) => p.x)) - Math.min(...land.map((p) => p.x)) + 1,
  ).toBe(10);
  expect(
    Math.max(...land.map((p) => p.y)) - Math.min(...land.map((p) => p.y)) + 1,
  ).toBe(5);
  expect(w.decoration(0, -1)?.sprite).toBe("nature-feather-palm");
  expect(w.terrain(e.state.player.pos.x, e.state.player.pos.y)).toBe("sand");
  expect(w.places).toHaveLength(0);
  expect(e.state.actors).toHaveLength(0);
});
it("supports direct and routed movement afloat without enabling deep-water walking", () => {
  const e = createSettingSession(
    resolve("ww2 pilot downed, floating in atlantic"),
    "raft-test",
  );
  expect(e.state.player.afloat).toBe("raft");
  expect(e.state.player.appearance?.wearing.garment).toBe("coat");
  expect(e.state.player.role).toBe("Pilot");
  expect(e.world.terrain(0, 0)).toBe("water");
  expect(e.world.places).toHaveLength(0);
  const from = { ...e.state.player.pos };
  const result = e.act({
    actionId: "raft-move-1",
    expectedRevision: e.state.revision,
    command: { type: "move", dx: 1, dy: 0 },
  });
  expect(e.state.player.pos.x, JSON.stringify(result)).toBe(from.x + 1);
  expect(
    e.playerCanCross(e.state.player.pos, { x: from.x + 2, y: from.y }),
  ).toBe(true);
  expect(
    e.findRoute(e.state.player.pos, { x: 8, y: 3 }).path.length,
  ).toBeGreaterThan(0);
  delete e.state.player.afloat;
  e.state.player.canSwim = false;
  expect(
    e.playerCanCross(e.state.player.pos, { x: from.x + 2, y: from.y }),
  ).toBe(false);
});
it("lets a swimmer out past wading depth until they tire and wash ashore", () => {
  const e = createSettingSession(resolve("tiny desert island"), "swim-test");
  const p = e.state.player;
  const step = (n: number) =>
    e.act({
      actionId: `swim-${n}`,
      expectedRevision: e.state.revision,
      command: { type: "move", dx: 1, dy: 0 },
    });
  p.canSwim = false;
  let n = 0;
  while (step(n++).status === "completed" && n < 40);
  const stopped = p.pos.x;
  expect(p.afloat).toBeUndefined();
  p.canSwim = true;
  for (let i = 0; i < 10; i++) step(n++);
  expect(p.pos.x).toBeGreaterThan(stopped);
  expect(p.afloat).toBe("swimming");
  p.swum = 449;
  step(n++);
  expect(p.afloat).toBeUndefined();
  expect(e.world.terrain(p.pos.x, p.pos.y)).not.toBe("water");
  expect(e.lastCollapse?.title).toBe("Washed ashore");
});
it.each([
  ["Roman military camp", "leather", 8, 16],
  ["Everest base camp", "canvas", 6, 8],
  ["Everest base camp 2020", "dome", 6, 8],
  ["pastoral camp", "felt", 6, 14],
  ["tribal gathering in the forest", "brush", 6, 8],
])(
  "builds %s with its own shelters and population",
  (prompt, style, count, people) => {
    const e = createSettingSession(resolve(String(prompt)), "camp-test");
    expect(e.world.places).toHaveLength(Number(count));
    expect(
      e.world.places.every((p) => p.sprite.startsWith(`camp-${style}-`)),
    ).toBe(true);
    expect(e.state.actors).toHaveLength(Number(people));
    const p = e.state.player.pos;
    expect(e.playerBlocked(p.x, p.y)).toBe(false);
    expect(
      e.world.places.every((p) => !e.playerBlocked(p.entrance.x, p.entrance.y)),
    ).toBe(true);
    expect(e.state.objects.some((o) => o.name === "Drinking water")).toBe(true);
  },
);

it("preserves model-supplied camp intent at a catalog location", async () => {
  const { worldWeaver } = await import("../server/world-weaver");
  const london = resolve("London 1953");
  const choice = {
    placeId: london.placeId, placeName: london.location, lon: london.lon, lat: london.lat,
    year: 1953, role: "Expedition member", characterName: "Alex", community: "Expedition",
    climate: london.climate, water: london.water, relief: london.relief, culture: london.culture,
    settlement: london.settlement, architecture: london.architecture,
    situation: { landform: "local", camp: "expedition", people: 6, support: "land", width: null, depth: null, palms: null },
  };
  const provider = (async () => new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(choice) } }] }))) as typeof fetch;
  const response = await worldWeaver(new Request("http://local/api/world-weaver", {
    method: "POST", body: JSON.stringify({prompt:"An expedition bivouac near London"}),
  }), {OPENAI_API_KEY:"test-only"}, provider);
  expect(response.status).toBe(200);
  const {setting}=await response.json();
  expect(setting).toMatchObject({placeId:london.placeId,settlement:"camp",architecture:"shelter",situation:{camp:"expedition",people:6}});
});

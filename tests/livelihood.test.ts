import { it, expect } from "vitest";
import { createSettingSession } from "../src/runtime/session";
import { settingFor } from "../src/content/geography/resolve";
import { places } from "../src/content/geography/places";
import { ecologies } from "../src/content/ecology/profiles";
import {
  harvestResource,
  refreshResource,
  householdActivity,
  grazeActivity,
} from "../src/core/livelihood";
import { items } from "../src/content/packs";
import type { WorldSetting } from "../src/content/geography/types";
const setting = (
  over: Partial<NonNullable<WorldSetting["environment"]>> = {},
): WorldSetting => ({
  ...settingFor(places.find((p) => p.id === "konya")!, -6499),
  terrainRevision: 2,
  // `settingFor` returns an Earth setting, whose named places are planted
  // whatever the environment says. This suite is about configured worlds, so
  // it has to ask for one; otherwise Konya arrives with its own households.
  geographyMode: "configured",
  water: "none",
  season: "summer",
  environment: {
    ecology: "temperate-woodland",
    landform: "plain",
    population: "sparse",
    start: "resident",
    household: "mixed",
    ...over,
  },
});
it("generates eight ecologies without requiring settlement or assigning a home", () => {
  for (const ecology of ecologies) {
    const e = createSettingSession(
      setting({ ecology, population: "none", start: "wanderer" }),
      "ecosystem-check",
    );
    expect(e.world.places).toHaveLength(0);
    expect(e.state.households).toHaveLength(0);
    expect(e.state.player.householdId).toBeUndefined();
    expect(e.blocked(e.state.player.pos.x, e.state.player.pos.y)).toBe(false);
    const habitats = new Set<string>();
    for (let y = -96; y <= 96; y += 16)
      for (let x = -96; x <= 96; x += 16)
        habitats.add(e.world.topography!(x, y).biome!);
    expect(habitats.has(ecology)).toBe(true);
  }
}, 180000);
it("creates reciprocal family links and shared residences, with plausible parent age differences", () => {
  const e = createSettingSession(
      setting({ household: "extended" }),
      "family-check",
    ),
    people = [e.state.player, ...e.state.actors];
  expect(e.state.households!.length).toBeGreaterThan(0);
  for (const h of e.state.households!) {
    expect(h.members.length).toBeGreaterThan(1);
    expect(e.world.place(h.residence!)).toBeDefined();
    expect(e.state.objects.some((o) => o.id === h.storeId)).toBe(true);
    for (const id of h.members) {
      const a = people.find((p) => p.id === id)!;
      expect(a.householdId).toBe(h.id);
      for (const rel of a.relations ?? []) {
        const other = people.find((p) => p.id === rel.other)!;
        expect(other).toBeDefined();
        if (rel.kind === "child")
          expect(a.age! - other.age!).toBeGreaterThanOrEqual(18);
        expect(other.relations?.some((r) => r.other === id)).toBe(true);
      }
    }
  }
});
it("harvesting conserves quantities and seasonal replenishment is bounded", () => {
  const e = createSettingSession(
    setting({ population: "none", start: "wanderer" }),
    "resource-check",
  );
  const o = e.state.objects.find((o) => o.resource?.item === "fruit")!;
  expect(o).toBeDefined();
  e.state.player.pos = { ...o.pos };
  const before = e.state.player.inventory.fruit ?? 0;
  expect(harvestResource(e.state.player, o, e.state.clock)).toBe(true);
  expect(e.state.player.inventory.fruit).toBe(before + 6);
  expect(harvestResource(e.state.player, o, e.state.clock)).toBe(false);
  refreshResource(o, e.state.clock + 1, "summer");
  expect(o.depleted).toBe(true);
  refreshResource(o, e.state.clock + 10 * 86400, "winter");
  expect(o.depleted).toBe(true);
  refreshResource(o, e.state.clock + 10 * 86400, "summer");
  expect(o.inventory.fruit).toBe(6);
});
it("household work gathers real food, deposits it and sleeps at its residence", () => {
  const e = createSettingSession(setting(), "work-check");
  const a = e.state.actors.find((a) => a.householdId && a.age! >= 18)!;
  const h = e.state.households!.find((h) => h.id === a.householdId)!;
  const store = e.state.objects.find((o) => o.id === h.storeId)!;
  const fruit = e.state.objects.find((o) => o.resource?.item === "fruit")!;
  store.inventory = {};
  a.inventory = {};
  a.knownResources = [fruit.id];
  a.pos = { ...fruit.pos };
  const work = () =>
    householdActivity(a, e.state, items, (p) => {
      a.pos = { ...p };
    });
  work();
  e.state.clock += 180;
  work();
  expect(a.inventory.fruit).toBe(6);
  work();
  work();
  expect(store.inventory.fruit).toBe(6);
  expect(a.inventory.fruit).toBe(0);
  e.state.clock = 19 * 3600;
  a.pos = { ...h.home };
  work();
  expect(a.pos.space).toBe(h.residence);
  expect(a.activity).toBe("Sleeping at home");
});

it("player contributions share the household store and preserve tools and valuables", () => {
  const e = createSettingSession(setting(), "contribute-check");
  const h = e.state.households!.find((h) => h.members.includes("player"))!;
  const store = e.state.objects.find((o) => o.id === h.storeId)!;
  e.state.actors = [];
  e.state.player.pos = { ...store.pos, x: store.pos.x + 1 };
  e.state.player.inventory = { fruit: 3, tool: 1, obsidian: 2 };
  const before = store.inventory.fruit ?? 0;
  expect(
    e.act({
      actionId: "contribute",
      expectedRevision: e.state.revision,
      command: { type: "interact", target: store.id, action: "store" },
    }).status,
  ).toBe("completed");
  expect(store.inventory.fruit).toBe(before + 3);
  expect(e.state.player.inventory.tool).toBe(1);
  expect(e.state.player.inventory.obsidian).toBe(2);
});
it("grazing consumes finite forage rather than manufacturing food", () => {
  const e = createSettingSession(
    setting({ ecology: "grassland", population: "none", start: "shepherd" }),
    "grazing-check",
  );
  const sheep = e.state.actors.find((a) => a.kind === "sheep")!;
  const patch = e.state.objects.find((o) => o.resource?.item === "fodder")!;
  sheep.pos = { ...patch.pos };
  sheep.hunger = 20;
  e.state.player.pos = { ...patch.pos, x: patch.pos.x + 8 };
  e.state.clock = 36000;
  const before = patch.inventory.fodder!;
  expect(grazeActivity(sheep, e.state, () => {})).toBe(true);
  expect(patch.inventory.fodder).toBe(before - 1);
  expect(sheep.hunger).toBe(15);
});
it("the same seed and environment reproduce terrain while landform and water controls change it", () => {
  const build = (landform: "plain" | "ridge", water: WorldSetting["water"]) =>
    createSettingSession(
      {
        ...setting({ population: "none", start: "wanderer", landform }),
        water,
      },
      "landform-check",
    );
  const sample = (e: ReturnType<typeof build>) => {
    const cells = [];
    for (let y = -80; y <= 80; y += 8)
      for (let x = -80; x <= 80; x += 8) {
        const c = e.world.topography!(x, y);
        cells.push([c.height, c.waterDepth, c.biome]);
      }
    return cells;
  };
  const plain = sample(build("plain", "none"));
  expect(sample(build("plain", "none"))).toEqual(plain);
  expect(sample(build("ridge", "none"))).not.toEqual(plain);
  expect(sample(build("plain", "coast-n"))).not.toEqual(plain);
});

it("advances a populated household scene through ordinary simulation commands", () => {
  const e = createSettingSession(
    {
      ...setting(),
      water: "river-ns",
      environment: { ...setting().environment!, landform: "rolling" },
    },
    "ecology-01",
  );
  const start = performance.now();
  const result = e.act({
    actionId: "daily-life",
    expectedRevision: 0,
    command: { type: "wait", seconds: 1800 },
  });
  expect(result.status).toBe("completed");
  expect(
    e.state.actors.some(
      (a) =>
        a.householdId &&
        /Gathering|supplies|household|home|field|water/i.test(a.activity),
    ),
  ).toBe(true);
  console.log(
    "Household 30-minute simulation ms",
    Math.round(performance.now() - start),
  );
});

import { householdStory } from "../src/world/v3/household-story";
import { it, expect } from "vitest";
import { createSettingSession } from "../src/runtime/session";
import { settingFor } from "../src/content/geography/resolve";
import { places } from "../src/content/geography/places";
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
it("builds households from a life, so they differ and their ages agree", () => {
  const sizes = new Set<number>();
  let widowed = 0,
    help = 0;
  for (let i = 0; i < 300; i++) {
    const age = 22 + (i % 45);
    const s = householdStory({
      seed: "story",
      id: `h${i}`,
      year: 1400,
      age,
      sex: i % 2 ? "female" : "male",
      means: (i % 10) / 10,
      shared: false,
      extended: false,
      small: false,
      craft: i % 3 === 0,
      player: false,
      modern: false,
      built: 1400 - (i % 90),
      fabric: "timber",
    });
    sizes.add(s.residents.length + s.infants);
    if (s.history.some((e) => e.kind === "died" && /wife|husband/.test(e.as!)))
      widowed++;
    if (s.residents.some((r) => r.role === "Servant" || r.role === "Apprentice"))
      help++;
    for (const r of s.residents) {
      if (r.fromHead === "child") expect(age - r.age).toBeGreaterThanOrEqual(15);
      if (r.fromHead === "parent") expect(r.age - age).toBeGreaterThanOrEqual(18);
    }
    for (const e of s.history) expect(e.year).toBeLessThanOrEqual(1400);
  }
  expect(sizes.size, "household sizes vary").toBeGreaterThan(4);
  expect(widowed).toBeGreaterThan(10);
  expect(help).toBeGreaterThan(10);
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
  const patch = e.state.objects.find((o) => o.resource?.item === "fodder")!;
  // The player's own flock is a fauna group, not an actor; kept livestock is.
  const sheep = {
    ...e.state.actors[0],
    id: "test-sheep",
    kind: "sheep" as const,
    pos: { ...patch.pos },
  };
  e.state.actors.push(sheep);
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

it("works a trade in stages at home, stocks the house, and minds neglect", () => {
  const konya = places.find((p) => p.id === "konya")!;
  const e = createSettingSession(
    { ...settingFor(konya, -6499), role: "Potter" },
    "probe",
  );
  const s = e.state;
  const home = s.households!.find((h) => h.members.includes("player"))!;
  const store = s.objects.find((o) => o.id === home.storeId)!;
  s.player.pos = { ...store.pos, x: store.pos.x + 1 };
  e.runEconomy();
  e.dailyGoals();
  const work = () =>
    e
      .inspect(store.id)!
      .affordances.find(
        (a) => a.command.type === "interact" && a.command.action === "work",
      )!;
  const before = s.economy!.stock[home.id]?.pots ?? 0;
  for (let i = 0; i < 3; i++)
    expect(
      e.act({
        actionId: `work-${i}`,
        expectedRevision: s.revision,
        command: work().command,
      }).status,
    ).toBe("completed");
  expect(work().enabled).toBe(false);
  expect(s.economy!.stock[home.id].pots).toBeGreaterThan(before);
  expect(s.goalFlags!.worked).toBe(true);
  s.clock += 22 * 3600 - (s.clock % 86400);
  e.sleep(8 * 3600);
  expect(s.evening!.work).toMatchObject({ done: 3, stages: 3 });
  expect(s.evening!.work!.made.pots).toBeGreaterThan(0);

  const buyer = s.households!.find((h) =>
    h.buys?.some((b) => b.from === home.id),
  )!;
  const head = s.actors.find((a) => a.id === buyer.members[0])!;
  const trust = head.trust;
  // Nobody else at home to work, and nothing on the shelf.
  home.members = ["player"];
  s.economy!.stock[home.id].pots = 0;
  s.economy!.hour -= (s.economy!.hour % 24) + 1;
  e.runEconomy();
  expect(head.trust).toBe(trust - 1);
}, 30000);

import { householdStory } from "../src/world/v3/household-story";
import { it, expect } from "vitest";
import { createSettingSession } from "../src/runtime/session";
import { resolveSetting, settingFor } from "../src/content/geography/resolve";
import { waterDepthAt } from "../src/core/water-field";
import type { Engine } from "../src/core/engine";
import { places } from "../src/content/geography/places";
import {
  harvestResource,
  refreshResource,
  householdActivity,
  depositSupplies,
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
/** The day's three steps, each where it is done (a place, or the trade's
 * prop), answering any card with its first choice. */
function workDay(e: Engine) {
  for (let step = 0; step < 3; step++) {
    const plan = e.workPlan()!;
    e.state.player.pos = { ...(plan.places[step] ? plan.door! : plan.station!.pos) };
    const command = e.workHere()?.command ?? { type: "interact" as const, target: plan.station!.id, action: "work" as const };
    expect(e.act({ actionId: `day-${e.state.revision}`, expectedRevision: e.state.revision, command }).status).toBe("completed");
    const card = e.cards.find((c) => c.choose)?.choose;
    const choice = card?.choices.find((c) => !c.unavailable)?.index;
    if (card && choice !== undefined)
      e.act({ actionId: `card-${e.state.revision}`, expectedRevision: e.state.revision, command: { type: "choose", card: card.card, choice } });
    e.cards.length = 0;
  }
}

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
  e.state.clock = 9 * 3600;
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
  const before = s.economy!.stock[home.id]?.pots ?? 0;
  workDay(e);
  expect(e.workPlan()!.done).toBe(3);
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

it("sends an indoor trade to a station inside the house", () => {
  const konya = places.find((p) => p.id === "konya")!;
  const e = createSettingSession({ ...settingFor(konya, -6499), role: "Potter" }, "probe");
  // The materials come from the door; the work itself is at the bench.
  e.state.economy = { hour: 0, stock: {}, short: {}, work: { day: Math.floor(e.state.clock / 86400), stage: 1 } };
  const station = e.workStation();
  expect(station).toMatchObject({ owner: "player" });
  expect((station as { pos: { space: string } }).pos.space).not.toBe("outside");
});

it("keeps personal accessories through household routines and supply deposits", () => {
  const a = { inventory: { "walking-cane": 1, fruit: 3 }, heldItem: "load:basket", pos: { x: 0, y: 0, space: "outside" } } as any;
  const s = { households: [], objects: [], clock: 9 * 3600 } as any;
  expect(householdActivity(a, s, items, () => {})).toBe(false);
  expect(a.heldItem).toBe("walking-cane");
  const store = { pos: a.pos, inventory: {} } as any;
  expect(depositSupplies(a, store)).toBe(3);
  expect(a.inventory["walking-cane"]).toBe(1);
  expect(store.inventory["walking-cane"]).toBeUndefined();
  a.inventory["walking-cane"] = 0;
  householdActivity(a, s, items, () => {});
  expect(a.heldItem).toBeUndefined();
});

it("sends a call-out trade to a neighbour's house for the job itself", () => {
  const london = places.find((p) => p.id === "london")!;
  const e = createSettingSession({ ...settingFor(london, 1986), role: "Painter and Decorator" }, "probe");
  const s = e.state;
  const home = s.households!.find((h) => h.members.includes("player"))!;
  expect(e.workPlan()!.steps[1].client).toBe(true);
  s.economy = { hour: Math.floor(s.clock / 3600), stock: {}, short: {}, work: { day: Math.floor(s.clock / 86400), stage: 1 } };
  const plan = e.workPlan()!;
  const client = s.households!.find((h) => h.residence && e.world.place(h.residence)?.entrance.x === plan.door!.x && e.world.place(h.residence)?.entrance.y === plan.door!.y)!;
  expect(client).toBeDefined();
  expect(client).not.toBe(home);
  expect(plan.where).toMatch(/'s house$/);

  s.economy.work!.stage = 2;
  s.player.pos = { ...e.workPlan()!.door! };
  const coins = s.player.inventory.coin ?? 0;
  expect(e.act({ actionId: "paid", expectedRevision: s.revision, command: e.workHere()!.command }).status).toBe("completed");
  const card = e.cards.find((c) => c.choose)?.choose;
  if (card) e.act({ actionId: "answer", expectedRevision: s.revision, command: { type: "choose", card: card.card, choice: card.choices.find((c) => !c.unavailable)!.index } });
  expect(s.player.inventory.coin).toBeGreaterThan(coins);
});

it("gives a craft household a turn in its own garden, once a day", () => {
  const normandy = places.find((p) => p.id === "normandy")!;
  const e = createSettingSession({ ...settingFor(normandy, 1100), role: "Stonemason" }, "probe");
  const s = e.state;
  expect(e.item("coin")!.name).toBe("Silver deniers");
  const side = e.sideJob()!;
  expect(side.done).toBe(false);
  s.player.pos = { ...side.pos, x: side.pos.x + 1 };
  const tend = e.inspect(side.id)!.affordances.find((a) => a.command.type === "interact" && a.command.action === "tend-plot")!;
  expect(e.act({ actionId: "garden", expectedRevision: s.revision, command: tend.command }).status).toBe("completed");
  expect(e.sideJob()!.done).toBe(true);
});

it.each([
  ["A baker in Lyon, 1742 CE", "A day at the oven", 3],
  ["A rice farmer in Hangzhou, 1600 CE", "Transplanting", 1],
  ["A herbalist in Kyoto, 1200 CE", "A day with the sick", 2],
  ["A farmer in Normandy, 1200 CE", "Ploughing and sowing", 2],
  ["A shepherd in Normandy, 1200 CE", "Birthing season", 2],
  ["A weaver in Florence, 1400 CE", "A day at the loom", 3],
  ["A porter in London, 1800 CE", undefined, 2],
])("walks %s through the day's places and cards", (prompt, title, cards) => {
  const resolved = resolveSetting(prompt, "probe");
  if ("error" in resolved) throw Error(resolved.error);
  const engine = createSettingSession(resolved.setting, "probe");
  const plan = engine.workPlan()!;
  expect(plan.title).toBe(title);
  expect(plan.places.filter(Boolean).length).toBeGreaterThanOrEqual(2);
  workDay(engine);
  expect(engine.workPlan()!.lines).toHaveLength(cards);
  expect(engine.workPlan()!.done).toBe(3);
  expect(Object.keys(engine.state.today?.made ?? {}).length).toBeGreaterThan(0);
});

it.each([
  ["konya", -6499], ["mesopotamia", -1999], ["rome", 100], ["kyoto", 1200], ["mongolia", 1250], ["timbuktu", 1400],
  ["mexico", 1450], ["delhi", 1500], ["arnhem-land", 1700], ["london", 1900], ["melbourne", 1950],
] as const)("finds a place or a prop for every step of every trade in %s, %i, in every season", (id, year) => {
  const e = createSettingSession(settingFor(places.find((p) => p.id === id)!, year), "coverage");
  const s = e.state, topo = e.world.topography;
  // A fisher on a map with no water anywhere falls back to their gear.
  let water = !topo;
  for (let y = -190; y <= 190 && !water; y += 4)
    for (let x = -190; x <= 190 && !water; x += 4) water = waterDepthAt(topo!, x + 0.5, y + 0.5) > 0.2;
  const gaps = new Set<string>();
  for (const trade of new Set(e.world.initialActors.flatMap((a) => (a.origin?.livelihood ? [a.origin.livelihood] : [])))) {
    s.player.origin!.livelihood = trade;
    for (let season = 0; season < 4; season++, s.clock += 28 * 86400)
      for (let stage = 0; stage < 3; stage++) {
        s.economy = { hour: 0, stock: {}, short: {}, ...s.economy, work: { day: Math.floor(s.clock / 86400), stage } };
        const plan = e.workPlan();
        const step = plan?.steps[stage];
        if (!plan || !step) continue;
        const found = step.at ? !!plan.places[stage] || (step.at === "shore" && !water) : !!plan.places[stage] || !!plan.station;
        if (!found) gaps.add(`${trade}: ${step.task} (${step.at ?? "prop"})`);
      }
  }
  expect([...gaps]).toEqual([]);
}, 120000);

it("fixes the day's places at its first command, whether or not anything looked first", () => {
  const resolved = resolveSetting("A herbalist in Kyoto, 1200 CE", "probe");
  if ("error" in resolved) throw Error(resolved.error);
  const watched = createSettingSession(resolved.setting, "probe"), replayed = createSettingSession(resolved.setting, "probe");
  // The panel asks at once; a headless replay never asks at all.
  watched.workPlan();
  for (let i = 0; i < 6; i++)
    for (const e of [watched, replayed])
      e.act({ actionId: `hour-${i}`, expectedRevision: e.state.revision, command: { type: "wait", seconds: 3600 } });
  expect(watched.state.workday).toBeDefined();
  expect(JSON.stringify(replayed.state.workday)).toBe(JSON.stringify(watched.state.workday));
  expect(replayed.workPlan()!.places).toEqual(watched.workPlan()!.places);
});

import { householdStory } from "../src/world/v3/household-story";
import { it, expect } from "vitest";
import { createSettingSession } from "../src/runtime/session";
import { resolveSetting, settingFor } from "../src/content/geography/resolve";
import { waterDepthAt } from "../src/core/water-field";
import type { Engine } from "../src/core/engine";
import { places } from "../src/content/geography/places";
import { livelihoodById } from "../src/content/characters/livelihoods";
import { processFor } from "../src/content/economy/processes";
import { propDefs } from "../src/content/props/catalog";
import { herdWords } from "../src/content/fauna/herding";
import { livelihoodOf } from "../src/world/v3/routines";
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
  let reciprocal = 0;
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
        if (rel.reciprocal) {
          expect(other.relations).toContainEqual(expect.objectContaining({ other: a.id, kind: rel.reciprocal }));
          reciprocal++;
        }
        if (rel.kind === "child")
          expect(a.age! - other.age!).toBeGreaterThanOrEqual(18);
        expect(other.relations?.some((r) => r.other === id)).toBe(true);
      }
    }
  }
  expect(reciprocal).toBeGreaterThan(0);
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

function expectTradePlaces(e: Engine) {
  const s = e.state, h = s.households!.find((h) => h.members.includes("player"))!;
  const house = e.world.place(h.residence!)!;
  expect(house.claim, "a house, not a venue").toBe("landscape");
  expect(["Townhouse", "Offices", "Bank", "Department store"]).not.toContain(house.name);
  const plan = e.workPlan()!;
  const process = processFor(livelihoodOf(e.world.pack, s.player)!)!;
  const bench = s.objects.find((o) => o.id === `${h.residence}-work`);
  if (process.bench) expect(process.bench, "the trade's bench").toContain(propDefs[bench?.prop ?? ""]?.family);
  const herd = (e.world as unknown as { planAt(x: number, y: number): { fauna?: { owner?: string; speciesId: string }[] } })
    .planAt(Math.round(s.player.home.x), Math.round(s.player.home.y))?.fauna?.find((g) => g.owner === "player");
  plan.steps.forEach((step, i) => {
    const place = plan.places[i];
    if (!process.steps[i].at) return expect(place ?? plan.station ?? bench, `${step.task}: a bench or prop`).toBeTruthy();
    expect(place, step.task).toBeTruthy();
    if (process.steps[i].at === "home") expect(place!.pos.space, `${step.task}: inside the house`).toBe(h.residence);
    if (process.steps[i].at === "sick") expect(place!.patient, `${step.task}: someone to see`).toBeTruthy();
    if (process.steps[i].at === "field") {
      expect(place!.label, `${step.task}: the household's own field`).toMatch(/^your (field|paddy)$/);
      if (/rice/i.test(s.player.origin?.roleLabel ?? "")) expect(place!.crop).toBe("rice");
    }
    if (process.steps[i].at === "pasture" || /\{(herd|mothers)\}/.test(process.steps[i].task)) {
      expect(herd, `${step.task}: the household's own animals`).toBeDefined();
      expect(step.task).toContain(herdWords(herd!.speciesId)[/\{mothers\}/.test(process.steps[i].task) ? "mothers" : "herd"]);
    }
  });
}

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
  expectTradePlaces(engine);
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

it.each([
  "A smith in Normandy, 1200 CE", "A scribe in Cairo, 1300 CE",
  "An ostler in Riyadh, 1080 CE", "A market trader in Timbuktu, 1400 CE", "A railway labourer in London, 1900 CE",
  "A rice farmer in Kyoto, 1200 CE",
])("builds what %s works with: the house, the bench, the animals, the patient", (prompt) => {
  const resolved = resolveSetting(prompt, "probe");
  if ("error" in resolved) throw Error(resolved.error);
  const e = createSettingSession(resolved.setting, "probe");
  expectTradePlaces(e);
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

it("tax collectors keep accounts at their workplace instead of following a freelance scribe route", () => {
  const process = processFor(livelihoodById("tax-collector")!)!;
  expect(process.title).toBe("A day collecting taxes");
  expect(process.steps.map((step) => step.at)).toEqual(["workplace", "workplace", "workplace"]);
  expect(process.paid).toBe("wage");
});


it("gives hunters a real hunting stage instead of gathering plants", () => {
  const hunt = processFor(livelihoodById("hunter")!)!;
  expect(hunt.steps.map((s) => s.scene)).toEqual(["craft", "hunt", "haul"]);
  expect(hunt.steps[1].hours).toBe(0);
  expect(hunt.steps.every((s) => !s.card)).toBe(true);
});

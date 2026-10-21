import { householdStory } from "../src/world/v3/household-story";
import { it, expect } from "vitest";
import { createSettingSession } from "../src/runtime/session";
import { resolveSetting, settingFor } from "../src/content/geography/resolve";
import { waterDepthAt } from "../src/core/water-field";
import type { Engine } from "../src/core/engine";
import { places } from "../src/content/geography/places";
import { livelihoodById } from "../src/content/characters/livelihoods";
import { institutionFor } from "../src/content/characters/workplace";
import { isVisitor } from "../src/world/v3/rail-travellers";
import { waterfrontFor } from "../src/content/settlements/waterfronts";
import { catchFate, catchOf, crewRole, fishingPractice, hullWeights, methodWeights, preserveOf } from "../src/content/economy/fishing";
import { gameOf, huntFate, huntWeapon, weaponHand, weaponWeights } from "../src/content/economy/hunting";
import { CARDS } from "../src/content/cards";
import { seasonAt } from "../src/core/livelihood";
import { fieldParcel } from "../src/core/work-places";
import { cropStage } from "../src/content/agriculture";
import { findPlace } from "../src/core/work-places";
import { route } from "../src/core/routing";
import { startAgent } from "../src/agents/agent";
import { RunRecord } from "../src/agents/record";
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
        const found = step.at ? !!plan.places[stage] || ((step.at === "shore" || step.at === "grounds") && !water) : !!plan.places[stage] || !!plan.station;
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
  expect(hunt.steps.map((s) => s.card)).toEqual([undefined, "hunt-2", "hunt-3"]);
});

it("arms hunters by date and contact, and reads the season and the hour", () => {
  const base = resolveSetting("Hunter in Lagos 1700", "hunting-weapons");
  if ("error" in base) throw Error(base.error);
  const s = base.setting;
  const top = (o: Partial<WorldSetting>) => Object.entries(weaponWeights({ ...s, ...o })).sort((a, b) => b[1]! - a[1]!)[0][0];
  expect(Object.keys(weaponWeights({ ...s, culture: "european", year: -30000 }))).toEqual(["spear"]);
  expect(top({ culture: "european", year: -14000 })).toBe("atlatl");
  expect(top({ culture: "european", year: -5000 })).toBe("bow");
  expect(top({ culture: "other-indigenous-american", year: 200 })).toBe("atlatl");
  expect(top({ culture: "other-indigenous-american", year: 1200 })).toBe("bow");
  expect(weaponWeights({ ...s, culture: "australian-pacific", year: 1800 }).bow).toBeUndefined();
  expect(weaponWeights({ ...s, culture: "european", year: 1300 }).crossbow).toBeGreaterThan(0);
  expect(weaponWeights({ ...s, culture: "european", year: 1400 }).firearm).toBeUndefined();
  const kyoto = resolveSetting("Hunter in Kyoto 1520", "hunting-guns");
  if ("error" in kyoto) throw Error(kyoto.error);
  expect(weaponWeights(kyoto.setting).firearm).toBeUndefined();
  expect(weaponWeights({ ...kyoto.setting, year: 1600 }).firearm).toBeGreaterThan(0);
  expect(weaponWeights(s).firearm).toBeGreaterThan(0);
  expect(top({ culture: "east-asian", year: 1900 })).toBe("firearm");
  expect(weaponHand[huntWeapon({ ...s, year: 1900 }, 0.5, "spear")]).toBe("spear");
  const t = { ...s, climate: "temperate" as const };
  expect(gameOf(t, "autumn", 6, 0.5).factor).toBeGreaterThan(gameOf(t, "summer", 6, 0.5).factor);
  expect(gameOf(t, "autumn", 6, 0.5).factor).toBeGreaterThan(gameOf(t, "autumn", 13, 0.5).factor);
  expect(gameOf(t, "summer", 13, 0.5)).toMatchObject({ lean: true, why: expect.stringMatching(/cover/) });
  expect(huntFate({ ...s, year: -8000 })).toEqual({ sold: false, buyer: "your kin" });
  expect(huntFate({ ...s, year: 1900 }).owed).toBeUndefined();
  const norman = resolveSetting("Hunter in medieval Normandy 1350", "hunting-fate");
  if ("error" in norman) throw Error(norman.error);
  expect(huntFate(norman.setting)).toMatchObject({ sold: true, buyer: "the butcher", owed: { to: "the lord" } });
  for (const slot of ["hunt-2", "hunt-3"]) expect(CARDS.filter((c) => c.slot === slot && c.hunting).length).toBeGreaterThanOrEqual(2);
});

it("hunts a day to its end with or without a kill, and brings the meat home to the store", () => {
  const e = createSettingSession({ ...setting(), year: 1350, role: "Hunter" }, "hunt-day");
  const s = e.state;
  const home = s.households!.find((h) => h.members.includes("player"))!;
  expect(home.makes).toEqual(["meat", "hide"]);
  e.runEconomy();
  e.dailyGoals();
  const plan = e.workPlan()!;
  expect(plan.steps.every((st) => !st.task.includes("{"))).toBe(true);
  const act = (command: Parameters<Engine["act"]>[0]["command"]) => {
    expect(e.act({ actionId: `hunt-${s.revision}`, expectedRevision: s.revision, command }).status).toBe("completed");
    const card = e.cards.find((c) => c.choose)?.choose;
    const choice = card?.choices.find((c) => !c.unavailable)?.index;
    if (card && choice !== undefined) e.act({ actionId: `card-${s.revision}`, expectedRevision: s.revision, command: { type: "choose", card: card.card, choice } });
  };
  s.player.pos = { ...plan.door! };
  act(e.workHere()!.command);
  s.player.pos = { ...e.workPlan()!.door! };
  expect(e.workHere()).toBeUndefined();
  s.clock += 4 * 3600;
  expect(e.workHere()?.label).toBe("Give up and head home");
  act(e.workHere()!.command);
  expect(s.events.some((ev) => /give up/i.test(ev.text))).toBe(true);
  const before = s.economy!.stock[home.id]?.meat ?? 0;
  s.player.inventory.meat = 8;
  s.player.inventory.hide = 1;
  s.player.pos = { ...e.workPlan()!.door! };
  act(e.workHere()!.command);
  expect(e.workPlan()!.done).toBe(3);
  expect(s.player.inventory.meat).toBeUndefined();
  expect(s.economy!.stock[home.id].meat).toBeGreaterThan(before);
  expect(s.economy!.stock[home.id].hide).toBeGreaterThanOrEqual(1);
  const autumn = Array.from({ length: 360 }, (_, d) => d * 24 + 7).filter((h) => seasonAt(e.world.pack.setting!.season, h * 3600) === "autumn");
  const summer = Array.from({ length: 360 }, (_, d) => d * 24 + 7).filter((h) => seasonAt(e.world.pack.setting!.season, h * 3600) === "summer");
  const mean = (hours: number[]) => hours.reduce((n, h) => n + e.gameYield(home, h), 0) / hours.length;
  expect(mean(autumn)).toBeGreaterThan(mean(summer));
}, 30000);

it.each(["Oaxaca 1650", "Kyoto 1700", "Manchester 1840", "Timbuktu 1550", "Rome 150"])(
  "grounds resident occupations in actual workplaces: %s", async query => {
    const a = await startAgent({ setting: query, seed: "local-work-review" }, new RunRecord({ mode: "run" }));
    try {
      const text = await a.call("look");
      expect(text).toContain("PLAYER");
      const e = a.engine;
      const schoolStaff = new Map<string, number>();
      let supported = 0;
      for (const person of [e.state.player, ...e.state.actors]) {
        if (person.kind !== "human" || person.role === "Child" || person.wayfarer || isVisitor(person.id)) continue;
        const site = e.world.activitySites?.(person.id);
        if (!site) continue; // Passers-by have their livelihood elsewhere.
        const kit = livelihoodById(person.origin?.specialty ?? person.origin?.livelihood ?? "");
        const kind = kit && institutionFor(kit);
        if (!kind) continue;
        expect(site.employment?.kind, `${query}: ${person.id} ${person.role}`).toBe(kind);
        expect(person.work, `${person.id} workplace`).toEqual({ ...site.work, space: "outside" });
        if (!["field", "pasture", "shore", "railway"].includes(kind))
          expect(e.world.places.some(p => p.id === site.employment!.id), site.employment!.label).toBe(true);
        if (kind === "school") schoolStaff.set(site.employment!.id, (schoolStaff.get(site.employment!.id) ?? 0) + 1);
        supported++;
      }
      expect(supported).toBeGreaterThan(0);
      for (const count of schoolStaff.values()) expect(count).toBeLessThanOrEqual(2);
      if (query === "Manchester 1840") {
        expect(e.world.places.some(p => p.landUse === "industrial")).toBe(true);
        expect(e.state.actors.some(p => e.world.activitySites?.(p.id)?.employment?.kind === "factory")).toBe(true);
      }
    } finally { a.runtime.dispose(); }
  }, 60000,
);

it.each([
  ["Miller in Rome 150",undefined,undefined,"mill",undefined],
  ["Miller in medieval Normandy 1350",undefined,undefined,"mill",undefined],
  ["London 1850",-5.23,50.23,"mine",undefined],
  ["Cusco 1650",-65.75,-19.58,"mine",undefined],
  ["Damascus 1250",undefined,undefined,"hospital",undefined],
  ["Tokyo 1800",undefined,undefined,"hospital",undefined],
  ["Rome 150",undefined,undefined,"fullery","Fuller"],
  ["Oaxaca 1650",undefined,undefined,"pottery","Potter"],
  ["Kyoto 1700",undefined,undefined,"pottery","Potter"],
  ["London 1650",undefined,undefined,"brickworks","Brickmaker"],
  ["London 1750",-1.8,53.2,"limeworks","Lime Burner"],
  ["London 1650",undefined,undefined,"dyehouse","Dyer"],
  ["London 1650",undefined,undefined,"tannery","Tanner"],
  ["London 1650",undefined,undefined,"fullery","Fuller"],
  ["London 1650",undefined,undefined,"boatyard","Boatwright"],
  ["London 1450",undefined,undefined,"boatyard","Boatwright"],
  ["Bergen 1500",undefined,undefined,"boatyard","Boatwright"],
  ["Bergen 1800",undefined,undefined,"boatyard","Boatwright"],
] as const)("builds reachable, staffed work compounds in %s (%s, %s), %s", async (query,lon,lat,kind,role) => {
  const resolved = resolveSetting(query,"local-work-review");
  if("error" in resolved) throw Error(resolved.error);
  const setting = lon === undefined ? {...resolved.setting,...(role ? {role,characterName:role} : {})} : {...resolved.setting,lon,lat:lat!,
    placeId:kind==="mine" && lon< -30 ? "review-potosi" : "review-redruth",
    location:kind==="limeworks" ? "Peak District" : lon< -30 ? "Potosí" : "Redruth",role:role ?? "Miner",characterName:role ?? "Miner"};
  const a = await startAgent({setting,seed:"local-work-review"},new RunRecord({mode:"run"}));
  try {
    const e=a.engine, workplace=e.world.activitySites?.("player")?.employment;
    const facilities=e.world.places.filter(p=>p.institution===kind && p.claim.startsWith("worksite-") && (!role || p.id===workplace?.id));
    expect(facilities.length).toBeGreaterThan(0);
    if(role) {
      expect(e.world.activitySites?.("player")?.employment?.kind).toBe(kind);
      expect(e.state.player.role).toBe(role);
    }
    for(const main of facilities) {
      if(kind==="boatyard") {
        const plan=(e.world as import("../src/world/v3/generate").SettlementWorld).planOf(main.id.split("-worksite-")[0])!;
        const launch=plan.launches![0],{origin,direction,water}=launch;
        const length=Math.abs(water.x-origin.x)+Math.abs(water.y-origin.y);
        for(let d=1;d<length;d++) {
          const from={x:origin.x+direction.x*(d-1),y:origin.y+direction.y*(d-1)};
          const to={x:origin.x+direction.x*d,y:origin.y+direction.y*d};
          expect(e.world.canCross?.(from,to),`launch step ${d}`).toBe(true);
          if(d>=launch.workingLength) expect(e.world.blocked(to.x,to.y,"outside"),`launch obstruction ${d}`).toBe(false);
        }
      }
      expect(e.world.places.some(p=>p.id===`${main.id}-store`)).toBe(true);
      expect(e.world.households?.some(h=>h.residence===main.id)).toBe(false);
      const staff=[e.state.player,...e.state.actors].filter(p=>e.world.activitySites?.(p.id)?.employment?.id===main.id);
      expect(staff.length).toBeGreaterThan(0);
      expect(staff.length).toBeLessThanOrEqual(main.workCapacity!);
      for(const worker of staff) {
        expect(worker.work).toEqual({...main.entrance,space:"outside"});
        const day=e.world.itinerary?.(worker.id);
        if(day) expect(day.segments.some(s=>s.placeId===main.id),worker.id).toBe(true);
      }
      const path=route(e.state.player.pos,main.entrance,(to,from)=>
        e.world.blocked(to.x,to.y,"outside") || !e.playerCanCross(from,to) ? Infinity : 1,
        {maxNodes:30000});
      expect(path.status,main.name).toBe("found");
      const room=e.interiorOf(main.id)!;
      expect(room).toBeDefined();
      if(kind==="hospital") expect(room.props.filter(p=>p.kind==="bed" || p.kind==="mat").length).toBeGreaterThanOrEqual(4);
    }
  } finally {a.runtime.dispose();}
},60000);


it("does not keep a requested processing profession when fresh water prevents its workplace", async () => {
  const a=await startAgent({setting:"Dyer in Kyoto 1700",seed:"local-work-review"},new RunRecord({mode:"run"}));
  try {
    expect(a.engine.world.places.some(p=>p.institution==="dyehouse")).toBe(false);
    expect(a.engine.state.player.role).not.toBe("Dyer");
    expect(a.engine.state.player.origin?.livelihood).not.toBe("dyer");
  } finally {a.runtime.dispose();}
},60000);

it.each(["Bergen 1500","Bergen 1700","London 1650","Tokyo 1800","Nile valley 2000 BCE"])("creates reachable fishing households in %s",async query=>{
  const a=await startAgent({setting:`Fisher in ${query}`,seed:"fishing-waterfront-review"},new RunRecord({mode:"run"}));
  try {
    const e=a.engine,home=e.world.places.find(p=>p.owner==="player" && p.claim==="waterfront-home");
    expect(home).toBeDefined();
    const plan=(e.world as import("../src/world/v3/generate").SettlementWorld).planOf(home!.id.split("-waterfront-")[0])!;
    expect(plan.waterfront!.members.length).toBeGreaterThanOrEqual(["Bergen 1500","Tokyo 1800"].includes(query) ? 1 : 2);
    expect(e.state.player.origin?.livelihood).toBe("fisher");
    const profile=waterfrontFor(e.world.pack.setting!)!;
    expect(plan.waterfront!.profile).toBe(profile.id);
    for(const member of plan.waterfront!.members) {
      expect(e.state.objects.find(o=>o.id===member.netsId)?.sprite).toBe(profile.nets);
      expect(e.state.objects.find(o=>o.id===member.catchId)?.sprite).toBe(profile.sorting);
      const household=e.world.households!.find(h=>h.members.includes(member.owner))!;
      expect(household.residence).toBe(member.homeId);
      expect(household.makes).toContain("fish");
      expect(household.storeId).toBe(member.catchId);
      const handling=member.handling!;
      expect(handling).toBeDefined();
      const neighbouringPlans=[...new Set(e.world.places.filter(p=>p.claim.startsWith("worksite-")).map(p=>p.id.split("-worksite-")[0]))]
        .filter(id=>id!==plan.site.id).map(id=>(e.world as import("../src/world/v3/generate").SettlementWorld).planOf(id)!);
      for(const other of neighbouringPlans)for(const launch of other?.launches??[]) {
        const a=handling.yard,b=launch.lane;
        expect(a.x<b.x+b.w && a.x+a.w>b.x && a.y<b.y+b.h && a.y+a.h>b.y,`${member.catchId} crosses ${other.site.id}'s launch`).toBe(false);
      }
      expect(e.state.objects.find(o=>o.id===handling.basketId)?.prop).toBe("basket");
      expect(Math.hypot(member.sorting.x-member.landing.x,member.sorting.y-member.landing.y)).toBeLessThan(22);
      const stations=plan.stations.get(member.owner)!;
      expect(stations.some(s=>s.placeId===member.gearId)).toBe(true);
      if(profile.practice) {
        expect(stations.some(s=>s.label===profile.practice!.prepare)).toBe(true);
        expect(stations.some(s=>s.label===profile.practice!.receive && s.activity===profile.practice!.landingActivity)).toBe(true);
        expect(stations.some(s=>s.label===profile.practice!.share)).toBe(true);
      }
      expect(stations.some(s=>s.activity==="haul" && s.carry?.startsWith("prop:basket@"))).toBe(true);
      if(member.owner!=="player") {
        const itinerary=e.world.itinerary?.(member.owner)!;
        const leg=itinerary.segments.find(s=>s.label===`Walking to the ${profile.practice?.catch.toLowerCase() ?? "catch-sorting table"}` && s.path?.length && s.carry?.startsWith("prop:basket@"));
        expect(leg).toBeDefined();
        const worker=e.state.actors.find(a=>a.id===member.owner)!;
        (e as any).followRoutine(worker,itinerary,(itinerary.start+(leg!.from+leg!.to)/2)*60);
        expect(worker.heldItem).toMatch(/^prop:basket@/);
        expect(worker.pos.space).toBe("outside");
      }
      const ask={state:e.state,world:e.world,household,day:1,client:()=>undefined,markets:true,inside:()=>undefined};
      expect(findPlace("shore",ask)?.pos).toEqual({...member.landing,space:"outside"});
      expect(findPlace("yard",ask)?.pos).toEqual({...member.sorting,space:"outside"});
      expect(e.world.activitySites?.(member.owner)?.employment?.id).toBe(member.boatId);
      expect(e.world.activitySites?.(member.owner)?.employment?.kind).toBe("fishery");
      const gear=e.world.places.find(p=>p.id===member.gearId)!;
      const residence=e.world.places.find(p=>p.id===member.homeId)!;
      for(const destination of [gear.entrance,member.landing,member.nets,member.sorting,handling.sale]) {
        expect(e.world.blocked(destination.x,destination.y,"outside"),JSON.stringify(destination)).toBe(false);
        expect(route(residence.entrance,destination,(to,from)=>e.world.blocked(to.x,to.y,"outside") || !e.playerCanCross(from,to) ? Infinity : 1,{maxNodes:30000}).status,JSON.stringify(destination)).toBe("found");
      }
      const room=e.interiorOf(gear.id)!;
      expect(room.props.some(p=>p.kind==="bed" || p.kind==="mat")).toBe(false);
      if(profile.gearInterior) {
        expect(room.params.wallPattern).toBe(profile.gearInterior.wall);
        expect(room.params.floorPattern).toBe(profile.gearInterior.floor);
        expect(room.params.door).toBe(profile.gearInterior.door);
      }
    }
    const member=plan.waterfront!.members.find(m=>m.owner==="player")!;
    expect(await a.call("goto",{...member.landing})).toMatch(/^ARRIVED/);
    expect(await a.call("goto",{target:member.catchId})).toMatch(/^ARRIVED/);
    expect(await a.call("inspect",{target:member.catchId})).toContain(`"${e.inspect(member.catchId)!.name}"`);
    if(profile.revision===6) {
      process.stdout.write(`${query}: ${plan.waterfront!.members.length} fishing households; ${profile.id}; agent reached and inspected ${profile.practice!.catch.toLowerCase()}\n`);
      return;
    }
    const resolved=resolveSetting(`Fisher in ${query}`,"fishing-waterfront-review");
    if("error" in resolved)throw Error(resolved.error);
    const previous=await startAgent({setting:{...resolved.setting,worksiteRevision:4},seed:"fishing-waterfront-review"},new RunRecord({mode:"run"}));
    try {
      const oldHome=previous.engine.world.places.find(p=>p.owner==="player" && p.claim==="waterfront-home")!;
      const oldPlan=(previous.engine.world as import("../src/world/v3/generate").SettlementWorld).planOf(oldHome.id.split("-waterfront-")[0])!;
      const old=oldPlan.waterfront!.members.find(m=>m.owner==="player")!;
      expect(old.handling).toBeUndefined();
      const walk=(engine:typeof e,from:typeof member.landing,to:typeof member.sorting)=>
        route(from,to,(q,p)=>engine.world.blocked(q.x,q.y,"outside") || !engine.playerCanCross(p,q) ? Infinity : 1,{maxNodes:30000});
      const before=walk(previous.engine,old.landing,old.sorting),after=walk(e,member.landing,member.sorting);
      expect(before.status).toBe("found");
      expect(after.status).toBe("found");
      expect(after.path.length).toBeLessThan(before.path.length);
      process.stdout.write(`${query}: catch-carrying route ${before.path.length} → ${after.path.length} paces\n`);
    } finally {previous.runtime.dispose();}
  } finally {a.runtime.dispose();}
},60000);

it("draws fishing practice from climate, date and tools rather than region",()=>{
  const base=resolveSetting("Fisher in Lagos 1700","fishing-practice");
  if("error" in base)throw Error(base.error);
  const s=base.setting;
  expect(hullWeights({...s,year:-60000})).toEqual({});
  expect(Object.keys(hullWeights({...s,year:-20000}))).not.toContain("plank");
  expect(hullWeights({...s,climate:"arid",year:-2000}).reed).toBeGreaterThan(0);
  expect(hullWeights({...s,climate:"tundra",year:1000}).hide).toBeGreaterThan(0);
  expect(methodWeights({...s,year:-20000},"river",false).seine).toBeUndefined();
  const methods=new Set(Array.from({length:40},(_,i)=>fishingPractice(s,"sea",`h${i}`).method));
  expect(methods.size).toBeGreaterThan(2);
  const dawn=catchOf(s,{water:"sea",method:"net",hull:"plank",crew:2},"spring",6,0.5);
  const noon=catchOf(s,{water:"sea",method:"net",hull:"plank",crew:2},"spring",13,0.5);
  expect(dawn.factor).toBeGreaterThan(noon.factor);
  expect(catchOf({...s,climate:"boreal"},{water:"lake",method:"line",crew:1},"winter",6,0.5).line).toMatch(/cold/);
});

it("takes the household boat out to fish, for NPCs and the player, where no region was written",async()=>{
  const a=await startAgent({setting:"Fisher in Lagos 1700",seed:"fishing-explore"},new RunRecord({mode:"run"}));
  try {
    const e=a.engine,w=e.world as import("../src/world/v3/generate").SettlementWorld;
    expect(waterfrontFor(e.world.pack.setting!)).toBeUndefined();
    const home=e.world.places.find(p=>p.owner==="player" && p.claim==="waterfront-home")!;
    const plan=w.planOf(home.id.split("-waterfront-")[0])!;
    expect(plan.waterfront!.profile).toBe("fishing-landing");
    const wet=(p:{x:number;y:number})=>waterDepthAt(e.world.topography!,p.x+.5,p.y+.5)>.2;
    for(const m of plan.waterfront!.members) {
      expect(m.practice?.hull).toBeDefined();
      expect(m.grounds!.length).toBeGreaterThan(0);
      expect(m.grounds!.every(wet)).toBe(true);
    }
    const sailing=plan.waterfront!.members.find(m=>m.owner!=="player" && e.world.itinerary?.(m.owner));
    if(sailing) {
      const it=e.world.itinerary!(sailing.owner)!,out=it.segments.find(g=>g.boat && g.activity==="fish" && !g.path)!;
      expect(wet(out.pos)).toBe(true);
      const worker=e.state.actors.find(x=>x.id===sailing.owner)!;
      (e as any).followRoutine(worker,it,(it.start+(out.from+out.to)/2)*60);
      expect(worker.afloat).toBe("boat");
      expect(e.state.objects.find(o=>o.id===sailing.boatId)?.away).toBe(true);
    }
    let today=e.workPlan()!;
    expect(today.steps.map(s=>s.at)).toEqual(["gear","grounds","yard"]);
    expect(today.steps.every(s=>!s.task.includes("{"))).toBe(true);
    await a.call("goto",{x:today.door!.x,y:today.door!.y});
    await a.call("act",{command:e.workHere()!.command});
    today=e.workPlan()!;
    expect(today.where).toBe("your boat");
    await a.call("goto",{x:today.door!.x,y:today.door!.y});
    const boat=e.state.objects.find(o=>o.owner==="player" && o.id.endsWith("-boat"))!;
    expect(await a.call("act",{command:{type:"interact",target:boat.id,action:"launch"}})).toMatch(/climb in/);
    expect(e.state.player.afloat).toBe("boat");
    today=e.workPlan()!;
    expect(today.where).toBe("the fishing grounds");
    await a.call("goto",{x:today.door!.x,y:today.door!.y});
    const card=(e as any).waitingCard();
    if(card)await a.call("act",{command:{type:"choose",card,choice:1}});
    expect(await a.call("act",{command:e.workHere()!.command})).toMatch(/catch/);
    expect(e.state.economy!.work!.catch).toBeGreaterThan(0);
    today=e.workPlan()!;
    expect(today.steps[2].task).toBe("Land the catch and set aside the landlord's share");
    await a.call("goto",{x:today.door!.x,y:today.door!.y});
    expect(e.state.player.afloat).toBeUndefined();
    expect(boat.away).toBeUndefined();
    const landing=(e as any).waitingCard();
    if(landing)await a.call("act",{command:{type:"choose",card:landing,choice:0}});
    const settled=await a.call("act",{command:e.workHere()!.command});
    expect(settled).toMatch(/A tenth of the catch goes to the landlord/);
    expect(settled).toMatch(/fish buyer pays you/i);
  } finally {a.runtime.dispose();}
},120000);

it("sends the catch to buyers, dues or kin, and keeps it by the climate, from capabilities and date",()=>{
  const base=resolveSetting("Fisher in Lagos 1700","fishing-fate");
  if("error" in base)throw Error(base.error);
  const s=base.setting;
  expect(catchFate(s)).toMatchObject({sold:true,buyer:"the fish buyer",owed:{to:"the landlord"}});
  expect(catchFate({...s,year:-8000})).toEqual({sold:false,buyer:"your kin"});
  expect(catchFate({...s,year:1900}).owed).toBeUndefined();
  expect(preserveOf({...s,year:1900},"sea","a")).toBe("fresh");
  const kept=(o:Partial<WorldSetting>,water:"sea"|"river")=>Array.from({length:40},(_,i)=>preserveOf({...s,...o},water,`town-${i}`));
  const nile=kept({climate:"arid",year:-2000},"river");
  expect(nile.filter(p=>p==="sun-dry").length).toBeGreaterThan(30);
  expect(kept({climate:"tundra",year:-8000},"sea").every(p=>["wind-dry","smoke","fresh"].includes(p))).toBe(true);
  const seine={water:"river" as const,method:"seine" as const,hull:"reed" as const,crew:4},fate=catchFate(s);
  expect(crewRole(seine,fate,0,40,true,0.1)).toBe("boat");
  expect(crewRole(seine,fate,2,9,false,0.9)).toBe("child");
  const rolls=Array.from({length:100},(_,i)=>i/100);
  const women=rolls.map(r=>crewRole(seine,fate,1,30,true,r)),men=rolls.map(r=>crewRole(seine,fate,1,30,false,r));
  expect(women.filter(r=>r==="gut" || r==="sell").length).toBeGreaterThan(70);
  expect(men.filter(r=>r==="haul").length).toBeGreaterThan(70);
  expect(crewRole(seine,{sold:false,buyer:"your kin"},1,30,true,0.1)).toBe("gut");
});

it("puts a fishing household's members to shore work and dries the catch on a rack",async()=>{
  const a=await startAgent({setting:"Fisher in Nile valley 2000 BCE",seed:"fishing-explore"},new RunRecord({mode:"run"}));
  try {
    const e=a.engine,w=e.world as import("../src/world/v3/generate").SettlementWorld;
    const home=e.world.places.find(p=>p.owner==="player" && p.claim==="waterfront-home")!;
    const plan=w.planOf(home.id.split("-waterfront-")[0])!;
    expect(plan.waterfront!.preserve).toBe("sun-dry");
    const racks=plan.waterfront!.members.flatMap(m=>m.process ? [e.state.objects.find(o=>o.id===m.process!.id)!] : []);
    expect(racks.length).toBeGreaterThan(0);
    expect(racks.every(o=>o.prop==="dryingRack" && o.sprite.startsWith("study-propb-drying-rack-"))).toBe(true);
    const labels=[...plan.stations.values()].flat().map(st=>st.label);
    for(const shore of ["Hauling the seine ropes from the bank","Gutting and sorting the catch","Carrying bait and baskets at the landing",
      "Keeping the birds off the drying fish","Splitting fish and laying them out to dry","Counting out the share owed to the landlord"])
      expect(labels,shore).toContain(shore);
    const usable=CARDS.filter(c=>c.fishing && (e as any).usableCard(c)).map(c=>c.id);
    expect(usable).toContain("fishing-short-share");
    expect(usable).toContain("fishing-rival-crew");
    expect(usable).not.toContain("fishing-hungry-kin");
    const fits=CARDS.filter(c=>c.slot==="gather-3" && (e as any).usableCard(c));
    expect(fits.some(c=>c.fishing)).toBe(true);
  } finally {a.runtime.dispose();}
},120000);

it("sends NPC hunters out to the far country and home with the kill",async()=>{
  const a=await startAgent({setting:"Hunter in Normandy 9000 BCE",seed:"hunt-probe"},new RunRecord({mode:"run"}));
  try {
    const e=a.engine;
    const hunters=e.state.actors.filter(x=>livelihoodOf(e.world.pack,x)?.activity==="Looking for game" && x.id!=="player");
    expect(hunters.length).toBeGreaterThan(0);
    const segs=hunters.flatMap(h=>e.world.itinerary?.(h.id)?.segments ?? []);
    expect(segs.some(s=>s.activity==="hunt" && !s.path)).toBe(true);
    expect(segs.some(s=>s.label==="Carrying the kill home" && s.carry==="meat")).toBe(true);
    expect(e.state.households!.some(h=>h.makes?.includes("hide") && !h.members.includes("player"))).toBe(true);
  } finally {a.runtime.dispose();}
},120000);

it("runs a northern fishing household short of its own catch in winter and not otherwise",async()=>{
  const a=await startAgent({setting:"Fisher in Bergen 1500",seed:"fishing-explore"},new RunRecord({mode:"run"}));
  try {
    const e=a.engine as any,s=e.state;
    const fishers=s.households.filter((h:any)=>h.makes?.includes("fish"));
    expect(fishers.length).toBeGreaterThan(0);
    const h=fishers[0];
    const yields=(season:string)=>Array.from({length:360},(_,d)=>Math.floor(s.clock/3600)+d*24+7)
      .filter(hour=>seasonAt(e.world.pack.setting.season,hour*3600)===season).map(hour=>e.catchYield(h,hour));
    const mean=(xs:number[])=>xs.reduce((n,x)=>n+x,0)/xs.length;
    expect(mean(yields("winter"))).toBeLessThan(mean(yields("spring"))*0.6);
    const short:Record<string,number>={},start=Math.floor(s.clock/3600);
    for(let d=1;d<=360;d++) {
      s.clock=(start+d*24)*3600;
      e.runEconomy();
      for(const f of fishers)if(s.economy.short[f.id]?.includes("fish")) {
        const season=seasonAt(e.world.pack.setting.season,s.clock);
        short[season]=(short[season]??0)+1;
      }
    }
    expect(short.winter).toBeGreaterThan(0);
    expect(Object.keys(short)).toEqual(["winter"]);
  } finally {a.runtime.dispose();}
},120000);

it("follows the household's own crop through the year: sowing, weeding, harvest, and fields to match",async()=>{
  const a=await startAgent({setting:"Farmer in Nile valley 1500 BCE",seed:"farm-explore"},new RunRecord({mode:"run"}));
  try {
    const e=a.engine as any,s=e.state,set=e.world.pack.setting;
    const mine=s.households.find((h:any)=>h.members.includes("player"));
    const parcel=fieldParcel(e.world,mine)!;
    const cell=(()=>{for(let y=parcel.rect.y;y<parcel.rect.y+parcel.rect.h;y++)for(let x=parcel.rect.x;x<parcel.rect.x+parcel.rect.w;x++)
      if(e.world.topography(x,y)?.field?.parcel===parcel.id)return {x,y};})()!;
    const titles:Record<string,string>={sown:"Ploughing and sowing",green:"Weeding and watching",ripe:"The harvest"};
    const start=Math.floor(s.clock/86400)*86400+12*3600;
    let reaped=false;
    for(let k=0;k<4;k++) {
      s.clock=start+k*28*86400;
      e.syncSeason();
      const stage=cropStage(parcel.crop,seasonAt(set.season,s.clock) as never,set.lat);
      expect(e.world.topography(cell.x,cell.y).field.stage).toBe(stage);
      expect(e.workPlan().title).toBe(titles[stage] ?? "The slack season");
      if(stage!=="ripe")continue;
      const grain=s.economy?.stock?.[mine.id]?.grain ?? 0;
      for(let step=0;step<3;step++) {
        const plan=e.workPlan();
        await a.call("goto",{x:plan.door.x,y:plan.door.y});
        const card=e.waitingCard();
        if(card)await a.call("act",{command:{type:"choose",card,choice:0}});
        const here=e.workHere();
        expect(here,plan.steps[step].task).toBeDefined();
        await a.call("act",{command:here.command});
        const after=e.waitingCard();
        if(after)await a.call("act",{command:{type:"choose",card:after,choice:0}});
      }
      expect(s.events.map((x:any)=>x.text ?? x).join(" ")).toMatch(/You bring in \d+ rows of barley/);
      expect(s.economy.stock[mine.id].grain).toBeGreaterThan(grain);
      expect(e.pickedNow(s.tiles[`${cell.x},${cell.y}`])).toBe(true);
      expect(e.harvestYield(mine,Math.floor(s.clock/3600))).toBeGreaterThan(0);
      s.clock+=28*86400;
      expect(e.pickedNow(s.tiles[`${cell.x},${cell.y}`]),"the field stands again next season").toBe(false);
      expect(e.harvestYield(mine,Math.floor(s.clock/3600))).toBe(0);
      reaped=true;
    }
    expect(reaped).toBe(true);
  } finally {a.runtime.dispose();}
},120000);

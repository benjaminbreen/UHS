import { smallSession } from "./fixtures";
import { items } from "../src/content/packs";
import { it, expect, vi } from "vitest";
import { collectClaim, dearness, grainDays, runEconomy } from "../src/core/economy";
import { AT_ODDS, householdConditions, houseTalk, regardBetween, seedHouseholds, settleRegard, worstGrievance } from "../src/core/household";
import { claimFor } from "../src/content/economy/claims";
import { endowmentFor, resourceName, tradeOf } from "../src/content/economy/endowments";
import { harvestResource, refreshResource, householdActivity, grazeActivity, depositSupplies } from "../src/core/livelihood";
import { carryKit, parseLoad, withLoads } from "../src/content/economy/carrying";
import type { Economy, Household, Snapshot, WorldObject } from "../src/core/types";
import { panelCity } from "../scripts/review/panel";
import { commonLivelihoods } from "../src/content/characters/livelihoods.generated";
import { processFor } from "../src/content/economy/processes";
import { pieceOf, recipeFor } from "../src/content/economy/recipes";
import type { SettlementPlan } from "../src/world/v3/types";
import { goodsOf } from "../src/content/economy/goods";
import { goodName, productFor, sellerOf } from "../src/content/economy/products";
import { resolveSetting, settingFor } from "../src/content/geography/resolve";
import { places } from "../src/content/geography/places";
import { createSettingSession, Runtime, WORK_STAGE_MS } from "../src/runtime/session";
import { sexOf } from "../src/core/brief";

const village = (): Household[] => {
  const h = (id: string, x: number, makes: string[], buys: [string, string][]) => ({
    id, members: [id + "1", id + "2"], home: { x, y: 0, space: "outside" as const },
    storeId: id, makes, buys: buys.map(([good, from]) => ({ good, from })),
  });
  const v = [
    h("farm", 0, ["grain"], [["bread", "baker"], ["drink", "brewer"]]),
    h("baker", 5, ["bread"], [["drink", "brewer"]]),
    h("brewer", 9, ["drink"], [["bread", "baker"]]),
  ];
  // Two farmers cannot keep both a baker and a brewer in grain.
  v[0].members.push("farm3");
  return v;
};
const everyone = (h: Household) => h.members.length;
const ledger = (): Economy => ({ hour: 0, stock: {}, short: {} });

it("keeps basket weaving and cordage away from cloth looms", () => {
  const kit = (id: string) => commonLivelihoods.find((l) => l.id === id)!;
  expect(processFor(kit("basket-maker"))?.stations).toEqual(["open-basket"]);
  expect(processFor(kit("rope-maker"))?.stations).toEqual([]);
});

it("classifies production without reading substrings of local role labels", () => {
  const kit = (id: string) => commonLivelihoods.find((l) => l.id === id)!;
  expect(goodsOf(kit("spinner"), 1)).toEqual(["cloth"]);
  expect(goodsOf(kit("swineherd"), 1)).toEqual(["meat", "hide"]);
  expect(goodsOf({ ...kit("religious-specialist"), label: "Forest sage and diviner" }, 1)).toEqual([]);
  expect(goodsOf({ ...kit("spinner"), label: "Wine seller" }, 1)).toEqual(["cloth"]);
  expect(goodsOf(kit("brewer"), 1)).toEqual(["drink"]);
  expect(goodsOf(kit("milkmaid"), 1)).toEqual(["milk"]);
  expect(goodsOf(kit("spinner"))).toContain("drink");
});

it("dates local drinks and distinguishes a wine seller from a grain brewer", () => {
  const local = (id: string, year: number) => settingFor(places.find((p) => p.id === id)!, year);
  const multan = local("city-multan", -620);
  expect(goodName("drink", productFor("drink", multan, "brewer"))).toContain("surā");
  expect(productFor("drink", { ...multan, year: -1999 }, "brewer")).toBe("fermented-drink");
  expect(productFor("drink", { ...multan, year: 1600 }, "brewer")).toBe("fermented-drink");
  expect(goodName("drink", productFor("drink", local("rome", 100), "innkeeper"))).toBe("wine");
  expect(productFor("drink", local("rome", 100), "brewer")).toBe("fermented-drink");
  expect(goodName("drink", productFor("drink", local("beijing", -1000), "brewer"))).toBe("grain wine");
  expect(goodName("drink", productFor("drink", local("london", 1500), "alewife"))).toBe("ale");
  expect(goodName("cloth", "vedic-sura")).toBe("cloth");
});

it("names regional products in Africa, the Americas, Southeast Asia and Oceania", () => {
  const at = (lon: number, lat: number, year: number) => ({ ...local("london", year), lon, lat, year });
  function local(id: string, year: number) { return settingFor(places.find((p) => p.id === id)!, year); }
  const named = (good: string, lon: number, lat: number, year: number, trade = "brewer") =>
    goodName(good, productFor(good, at(lon, lat, year), trade));
  expect(named("drink", 8.5, 12, 1700)).toBe("sorghum beer");
  expect(named("drink", 31.2, 30, -1500)).toBe("barley beer");
  expect(named("drink", 3.4, 6.5, 1700, "innkeeper")).toBe("palm wine");
  expect(named("oil", 8.5, 12, 1700)).toBe("shea butter");
  expect(named("salt", -3, 16.8, 1500)).toBe("rock salt");
  expect(named("drink", -72, -13.5, 1500)).toBe("chicha (maize beer)");
  expect(named("drink", -99.1, 19.4, 1500)).toBe("pulque");
  expect(named("drink", -59.6, 13.1, 1750, "innkeeper")).toBe("rum");
  expect(named("drink", 106.8, -6.2, 1700)).toBe("rice wine");
  expect(named("cloth", 110.4, -7.8, 1800)).toBe("batik cloth");
  expect(named("drink", 178.4, -18.1, 1800)).toBe("kava");
  expect(named("cloth", -149.6, -17.5, 1700)).toBe("tapa (bark cloth)");
});

it("does not consume alcohol in households that do not want it", () => {
  const v = village();
  v.forEach((h) => h.needs = ["bread"]);
  const e = ledger();
  runEconomy(v, e, 24 * 21, (h) => h.id === "brewer" ? 0 : everyone(h));
  expect(Object.values(e.short).flat()).not.toContain("drink");
  expect(e.stock.brewer.drink).toBe(30);
});

it("keeps generated Multan purchases and debts consistent with the actual suppliers", () => {
  const setting = settingFor(places.find((p) => p.id === "city-multan")!, -620);
  const e = createSettingSession({ ...setting, role: "Cook", character: { age: 48, hunger: 0, fatigue: 0 } }, "multan-credit");
  const households = e.state.households!;
  const actors = [e.state.player, ...e.world.initialActors];
  let purchases = 0, drinks = 0, credits = 0;
  for (const h of households) {
    for (const buy of h.buys ?? []) {
      purchases++;
      const supplier = households.find((s) => s.id === buy.from)!;
      const actor = sellerOf(buy, households, actors);
      expect(actor, `${h.id}: ${buy.good} from ${buy.from}`).toBeDefined();
      expect(actor!.id).toBe(supplier.producers![buy.good]);
      expect(buy.product).toBe(supplier.products![buy.good]);
      if (buy.good === "drink") {
        drinks++;
        expect(h.needs).toContain("drink");
        expect(actor!.origin?.livelihood).not.toBe("religious-specialist");
        expect(goodName(buy.good, buy.product)).toContain("surā");
      }
    }
    if (h.credit) {
      credits++;
      expect(h.buys).toContainEqual({ good: h.credit.good, from: h.credit.from,
        seller: h.credit.seller, product: h.credit.product });
      expect(h.owes).toBe(h.credit.from);
    }
  }
  expect(purchases).toBeGreaterThan(0);
  // Whether anyone here keeps a drink shop is the draw's; whoever does must find custom.
  if (households.some((h) => h.makes?.includes("drink"))) expect(drinks).toBeGreaterThan(0);
  expect(credits).toBeGreaterThan(0);
  expect(households.some((h) => !h.needs?.includes("drink"))).toBe(true);
});

it.runIf(!!process.env.FULL)("routes work and children's errands to their actual destinations", () => {
  const world = panelCity("london", 1400).engine.world;
  // Any worker at a station: which trades have one depends on who the draw makes a householder.
  const turn = world.initialActors
    .flatMap((a) => world.itinerary?.(a.id)?.segments ?? [])
    // Shore water is a place, not a station, and has no object id.
    .find((s) => s.target?.family && s.target.family !== "market-counter" && s.target.family !== "shallow-water");
  expect(turn?.target?.id).toBeTruthy();
  expect(Math.abs(turn!.pos.x - turn!.target!.x) + Math.abs(turn!.pos.y - turn!.target!.y)).toBe(1);
  expect(world.initialObjects.some((o) => o.id === turn!.target!.id)).toBe(true);
  const trader = world.initialActors.find((a) => a.origin?.livelihood === "trader" &&
    world.itinerary?.(a.id)?.segments.some((s) => s.target?.family === "market-counter"));
  expect(trader, "merchant at a counter").toBeTruthy();
  const shore = world.initialActors.flatMap((a) => world.itinerary?.(a.id)?.segments ?? [])
    .find((s) => s.target?.family === "shallow-water" && /washing clothes/.test(s.label.toLowerCase()));
  expect(shore, "laundry at the water").toBeTruthy();
  expect(world.terrain(shore!.pos.x, shore!.pos.y)).not.toBe("water");
  expect(world.terrain(shore!.target!.x, shore!.target!.y)).toBe("water");
  const child = world.initialActors.find((a) =>
    world.itinerary?.(a.id)?.segments.some((s) => s.label === "Sent for water"));
  const route = child && world.itinerary?.(child.id);
  expect(route, "child with a daily water errand").toBeTruthy();
  expect(route!.segments.filter((s) => s.label === "Sent for water")).toHaveLength(1);
  const well = route!.segments.find((s) => s.label === "Sent for water")?.target;
  expect(["well", "town-well", "framed-well", "pump"]).toContain(well?.family);
  expect(world.initialObjects.some((o) => o.id === well?.id)).toBe(true);
  expect(route!.segments.some((s) => s.label === "Walking to the open ground")).toBe(false);
  for (const leg of route!.segments.filter((s) => s.path?.length))
    expect(Math.abs(leg.path![0].x - leg.pos.x) + Math.abs(leg.path![0].y - leg.pos.y)).toBeLessThanOrEqual(1);
});

it.runIf(!!process.env.FULL)("keeps indoor workers at their actual workplace and social visits local", () => {
  const { engine, plan: generated } = panelCity("london", 2000);
  const plan = generated as SettlementPlan;
  const world = engine.world;
  const indoor = world.initialActors.map((a) => ({ actor: a, route: world.itinerary?.(a.id) }))
    .flatMap(({ actor, route }) => (route?.segments ?? [])
      .filter((s) => s.activity === "rest" && s.placeId && s.label !== "At home" && s.label !== "At school")
      .map((segment) => ({ actor, route: route!, segment })))[0];
  expect(indoor, "a worker assigned to a real building").toBeTruthy();
  const resident = engine.state.actors.find((a) => a.id === indoor.actor.id)!;
  (engine as any).followRoutine(resident, indoor.route,
    (indoor.route.start + (indoor.segment.from + indoor.segment.to) / 2) * 60);
  expect(resident.pos.space).toBe(indoor.segment.placeId);
  const misplaced = [...plan.stations].flatMap(([id, stations]) => stations
    .filter((s) => /rite|record|watch|sick/i.test(s.label) && s.activity === "rest")
    .filter((s) => plan.places.some((p) => p.entrance.x === s.pos.x && p.entrance.y === s.pos.y &&
      p.access === "household" && p.owner !== id)));
  expect(misplaced).toHaveLength(0);
  const social = [...plan.stations].flatMap(([id, stations]) => stations
    .filter((s) => s.label.startsWith("At ") && s.label !== "At school" &&
      plan.venues?.some((v) => s.toward === v.venue.label.replace(/^The /, "the ")))
    .map((s) => Math.hypot(s.pos.x - plan.work.get(id)!.home.x,
      s.pos.y - plan.work.get(id)!.home.y)));
  expect(social.length).toBeGreaterThan(0);
  expect(Math.max(...social)).toBeLessThanOrEqual(63);
});

it("keeps household stocks bounded and fed while every trade works", () => {
  const e = ledger();
  runEconomy(village(), e, 24 * 7, everyone);
  expect(e.short).toEqual({});
  // Three days' making, but a granary holds the year's harvest.
  for (const stock of Object.values(e.stock))
    for (const [good, n] of Object.entries(stock)) expect(n).toBeLessThanOrEqual(good === "grain" ? 2500 : 90);
});

it("runs bread and ale short downstream when the farm stops", () => {
  const e = ledger();
  runEconomy(village(), e, 24 * 21, (h) => (h.id === "farm" ? 0 : everyone(h)));
  expect(e.short.brewer).toEqual(["bread", "drink"]);
  expect(e.stock.baker.bread).toBe(0);
});

it("feeds a household grain from the farm when the baker stops", () => {
  const e = ledger();
  runEconomy(village(), e, 24 * 21, (h) => (h.id === "baker" ? 0 : everyone(h)));
  expect(e.short.brewer).toBeUndefined();
  expect(e.stock.baker.bread).toBe(0);
});

it("leaves a fishing household short when its catch fails, and fed when it does not", () => {
  const fishers = (): Household[] => [{ id: "fishers", members: ["f1", "f2", "f3", "f4", "f5"], home: { x: 0, y: 0, space: "outside" },
    storeId: "fishers", makes: ["fish"], needs: [] }];
  const good = ledger(), poor = ledger();
  runEconomy(fishers(), good, 24 * 14, () => 2, 0, () => 1);
  runEconomy(fishers(), poor, 24 * 14, () => 2, 0, () => 0.2);
  expect(good.short).toEqual({});
  expect(poor.short.fishers).toEqual(["fish"]);
});

it("catches up an absence exactly as if it had been watched", () => {
  const v = village(), watched = ledger(), away = ledger();
  for (let t = 1; t <= 72; t++) runEconomy(v, watched, t, everyone);
  runEconomy(v, away, 72, everyone);
  expect(away).toEqual(watched);
});

it("slows a patch's regrowth when it is taken from again and again", () => {
  const regrowth = (every: number) => {
    const a = { pos: { x: 0, y: 0, space: "outside" }, inventory: {} } as any;
    const o = { pos: a.pos, inventory: { fruit: 1 }, depleted: false,
      resource: { item: "fruit", capacity: 1, regrowSeconds: 86400, seasons: ["summer"], readyAt: 0 } } as any;
    let t = 0;
    for (let i = 0; i < 4; i++, t += every) {
      o.depleted = false; o.inventory.fruit = 1;
      harvestResource(a, o, t);
    }
    return o.resource.readyAt - (t - every);
  };
  expect(regrowth(86400)).toBeGreaterThan(regrowth(86400 * 60));
});

it("keeps a city fed from outside when its own bakers stop", () => {
  const village_ = ledger(), city = ledger();
  const stopped = (h: Household) => (h.id === "farm" ? 0 : everyone(h));
  runEconomy(village(), village_, 24 * 21, stopped);
  runEconomy(village(), city, 24 * 21, stopped, 0.7);
  expect(Object.keys(village_.short)).toHaveLength(3);
  expect(Object.keys(city.short).length).toBeLessThan(3);
});

it("sends people out with vessels and baskets and home with what they got", () => {
  const at = { x: 0, y: 0 };
  const kit = { vessel: "prop:jug@head", basket: "prop:basket@back", bundle: "prop:sack@hand", tool: "prop:hoe@hand" };
  const stations = withLoads(
    [
      { pos: at, activity: "draw-water", label: "Fetching water", minutes: 20 },
      { pos: at, activity: "play", label: "Playing", minutes: 20 },
      { pos: at, activity: "gather", label: "Gathering", minutes: 20 },
      { pos: at, activity: "visit", label: "Buying bread from Ada", minutes: 20 },
      { pos: at, activity: "rest", label: "At home", minutes: 20 },
      { pos: at, activity: "tend", label: "Weeding the rows", minutes: 20, carry: "tool" },
    ],
    kit,
    "bread",
  );
  expect(stations.map((s) => s.carry)).toEqual([
    "prop:jug@head",
    undefined,
    "prop:basket@back",
    "prop:basket@back",
    "bread",
    "prop:hoe@hand",
  ]);
  expect(parseLoad("prop:jug@head")).toEqual({ prop: "jug", variant: 0, style: "head" });
  expect(parseLoad("prop:hoe#1@hand")).toEqual({ prop: "hoe", variant: 1, style: "hand" });
  expect(parseLoad("bread")).toBeUndefined();
});

function railwaySession() {
  const engine = smallSession(settingFor(places.find((p) => p.id === "london")!, 1900), "city-review");
  engine.world.places[1].name = "Railway Station";
  engine.state.player.origin!.livelihood = "railway-labourer";
  return engine;
}

it("finishes a held work stage as one command while yielding between frames", async () => {
  const engine = railwaySession();
  const synchronous = railwaySession();
  for (const world of [engine, synchronous]) world.state.player.pos = { ...world.workPlan()!.door! };
  const command = synchronous.workHere()!.command;
  const runtime = new Runtime(engine, { cacheTerrain: false });
  runtime.hold(true);
  let now = 0, frames = 0;
  const clock = vi.spyOn(performance, "now").mockImplementation(() => now += 7);
  vi.stubGlobal("requestAnimationFrame", (frame: FrameRequestCallback) => {
    queueMicrotask(() => frame(performance.now()));
    return ++frames;
  });
  vi.stubGlobal("matchMedia", () => ({ matches: true }));
  try {
    const revision = engine.state.revision;
    expect(runtime.pressSwing()?.kind).toBe("work");
    runtime.workHold = performance.now() - WORK_STAGE_MS;
    runtime.tick();
    const complete = new Promise<void>((resolve) => {
      const unsubscribe = runtime.subscribe(() => {
        if (runtime.workInProgress) return;
        unsubscribe();
        resolve();
      });
    });
    expect(runtime.workInProgress).toBe(true);
    expect(engine.state.revision).toBe(revision);
    expect(runtime.command({ type: "wait", seconds: 60 })).toBeUndefined();
    runtime.releaseCharge();
    await complete;
    expect(frames).toBeGreaterThan(1);
    expect(engine.state.log.map((entry) => entry.command)).toEqual([command]);
    expect(runtime.workHold).toBeUndefined();
    synchronous.act({ actionId: "sync", expectedRevision: revision, command });
    expect(engine.hash()).toBe(synchronous.hash());
  } finally {
    vi.unstubAllGlobals();
    clock.mockRestore();
    runtime.dispose();
  }
});

it("takes a railway labourer from the station to the line and back, through a card at each", () => {
  const engine = railwaySession();
  let n = 0;
  const act = (command: Parameters<typeof engine.validate>[0]) =>
    engine.act({ actionId: `rail-${n++}`, expectedRevision: engine.state.revision, command });
  const plan = engine.workPlan()!;
  expect(plan.title).toBe("A day on the line");
  expect(plan.places.map((p) => p?.label)).toEqual(["the railway station", "the line", "the railway station"]);
  expect(plan.steps[0].task).toBe("Report to the ganger");
  const coin = engine.state.player.inventory.coin ?? 0;
  for (let step = 0; step < 3; step++) {
    engine.state.player.pos = { ...engine.workPlan()!.door! };
    const here = engine.workHere()!;
    expect(here.label).toBe(engine.workPlan()!.steps[step].task);
    expect(act(here.command).status).toBe("completed");
    expect(engine.workHere(), "no work while a card waits").toBeUndefined();
    // The ganger walks over with his card.
    for (let i = 0; i < 40 && !engine.cards.some((c) => c.choose); i++) act({ type: "wait", seconds: 60 });
    const card = engine.cards.find((c) => c.choose)!.choose!;
    const choice = card.choices.find((c) => !c.unavailable)!.index;
    expect(act({ type: "choose", card: card.card, choice }).status).toBe("completed");
    expect(act({ type: "choose", card: card.card, choice }).status, "answered once").toBe("rejected");
    engine.cards.length = 0;
  }
  expect(engine.workPlan()!.done).toBe(3);
  expect(engine.workPlan()!.lines).toHaveLength(3);
  expect((engine.state.player.inventory.coin ?? 0) - coin).toBeGreaterThan(0);
  const lines = engine.workPlan()!.lines;
  act({ type: "sleep", seconds: engine.untilMorning() });
  expect(Math.floor(engine.state.clock / 3600) % 24, "a labourer wakes at six").toBe(6);
  expect(engine.state.evening!.chain!.slice(0, 3), "the day's choices, then any turn of the plot").toEqual(lines);
});

it.runIf(!!process.env.FULL)("gives a labourer's children his surname", () => {
  const start = resolveSetting("A railway labourer in London, 1900 CE", "a");
  if ("error" in start) throw Error(start.error);
  const engine = createSettingSession(start.setting, "a");
  const s = engine.state;
  const surname = (id: string) => s.actors.find((a) => a.id === id)!.name.split(" ").at(-1);
  const byId = new Map(s.actors.map((a) => [a.id, a]));
  const pairs = s.actors.flatMap((a) => (a.relations ?? []).flatMap((r) => {
    const father = byId.get(r.other);
    return r.kind === "parent" && father && father.householdId === a.householdId && sexOf(father) === "male" ? [[a.id, father.id]] : [];
  }));
  expect(pairs.length).toBeGreaterThan(0);
  for (const [child, father] of pairs) expect(surname(child), byId.get(child)!.name).toBe(surname(father));
});

it("holds back routine family visits after three calls in a day", () => {
  const engine = smallSession(settingFor(places.find((p) => p.id === "london")!, 1900), "kin-calls");
  const s = engine.state;
  const [parent, child, partner] = s.actors;
  parent.age = 60;
  s.player.relations = [{ kind: "parent", other: parent.id }];
  s.clock = 16 * 3600 - 6;
  const said = { [`${child.id}:hungry`]: 6 * 3600, [`${child.id}:missed`]: 9 * 3600, [`${partner.id}:store`]: 12 * 3600 };
  s.kin = { since: 6 * 3600, said, talked: {}, last: 12 * 3600 };
  const wait = (seconds: number) => engine.act({ actionId: `kin-${s.revision}`, expectedRevision: s.revision, command: { type: "wait", seconds } });
  expect(wait(6).status).toBe("completed");
  expect(said[`${parent.id}:visit`]).toBeUndefined();
  delete said[`${partner.id}:store`];
  expect(wait(600).status).toBe("completed");
  expect(said[`${parent.id}:visit`]).toBe(16 * 3600 + 600);
});

it.runIf(!!process.env.FULL)("bakes at the oven its place and period had", () => {
  for (const [prompt, bench] of [["A baker in Isfahan, 1600 CE", "tannur"], ["A baker in Tenochtitlan, 1450 CE", "metate"]]) {
    const start = resolveSetting(prompt, "a");
    if ("error" in start) throw Error(start.error);
    const engine = createSettingSession(start.setting, "a");
    const h = engine.state.households!.find((h) => h.members.includes("player"))!;
    expect(engine.state.objects.find((o) => o.id === `${h.residence}-work`)?.prop, prompt).toBe(bench);
    expect(engine.workPlan()!.places[0]!.label).toBe(`your ${bench === "tannur" ? "clay tannur" : bench}`);
  }
});

it("draws an oven hazard during a baker's work and applies its injury on a failed check", () => {
  const start = resolveSetting("A baker in Lyon, 1742 CE", "a");
  if ("error" in start) throw Error(start.error);
  const engine = smallSession(start.setting, "a");
  const s = engine.state;
  s.record = [{ day: 0, clock: 0, card: "bake-hot-oven", choice: 1, line: "You waited for the oven to cool." }];
  const rng = engine.rng.bind(engine);
  vi.spyOn(engine, "rng").mockImplementation((purpose) => purpose === "card:hazard-oven-burn" ? 0.99 : rng(purpose));
  let serial = 0;
  const act = (command: Parameters<typeof engine.validate>[0]) =>
    engine.act({ actionId: `bake-${serial++}`, expectedRevision: s.revision, command });
  for (const [step, card, choice] of [[0, "bake-damp-flour", 0], [1, "hazard-oven-burn", 0]] as const) {
    s.player.pos = { ...engine.workPlan()!.places[step]!.pos };
    expect(act(engine.workHere()!.command).status).toBe("completed");
    expect(engine.cards.find((c) => c.choose?.card === card)).toBeDefined();
    expect(act({ type: "choose", card, choice }).status).toBe("completed");
  }
  expect(s.player.health).toBe(88);
  expect(s.player.injury).toMatchObject({ name: "a burned hand", open: true });
});

it("drops a day's card that lapsed before it came on screen", () => {
  const start = resolveSetting("A baker in Lyon, 1742 CE", "a");
  if ("error" in start) throw Error(start.error);
  const engine = smallSession(start.setting, "a");
  const s = engine.state;
  let serial = 0;
  const act = (command: Parameters<typeof engine.validate>[0]) =>
    engine.act({ actionId: `lapse-${serial++}`, expectedRevision: s.revision, command });
  s.player.pos = { ...engine.workPlan()!.places[0]!.pos };
  expect(act(engine.workHere()!.command).status).toBe("completed");
  const card = engine.cards.find((c) => c.choose?.card === "bake-damp-flour")!;
  expect(engine.canShowCard(card)).toBe(true);
  expect(act({ type: "sleep", seconds: 86400 }).status).toBe("completed");
  expect(engine.validate({ type: "choose", card: "bake-damp-flour", choice: 0 })).toBe("There is nothing to answer.");
  expect(engine.canShowCard(card)).toBe(false);
  expect(act({ type: "wait", seconds: 60 }).status).toBe("completed");
  expect(s.events.some((e) => e.text === "The day ended before you decided.")).toBe(true);
});

it("gives bread on credit to a hungry neighbour who walks over, owes it, and comes back about it", () => {
  const start = resolveSetting("A baker in Lyon, 1742 CE", "a");
  if ("error" in start) throw Error(start.error);
  const engine = smallSession(start.setting, "a");
  const s = engine.state;
  let serial = 0;
  const act = (command: Parameters<typeof engine.validate>[0]) =>
    engine.act({ actionId: `credit-${serial++}`, expectedRevision: s.revision, command });
  const mine = s.households!.find((h) => h.members.includes("player"))!;
  const hungry = s.households!.find((h) => h !== mine && h.residence && s.actors.some((a) => h.members.includes(a.id) && (a.age ?? 0) >= 16))!;
  for (const h of s.households!) h.fortune = h === hungry ? 0.1 : 0.9;
  // The town inspector's card is written for this place, so it would always win the selling step.
  const usable = (engine as any).usableCard.bind(engine);
  vi.spyOn(engine as any, "usableCard").mockImplementation((c: any) => c.id !== "bake-assize" && usable(c));
  for (const step of [0, 1, 2]) {
    s.player.pos = { ...engine.workPlan()!.places[step]!.pos };
    expect(act(engine.workHere()!.command).status).toBe("completed");
    for (const c of engine.cards.splice(0)) if (c.choose && c.choose.card !== "bake-credit") act({ type: "choose", card: c.choose.card, choice: 0 });
  }
  const who = s.actors.find((a) => a.id === s.economy!.work!.who)!;
  expect(hungry.members).toContain(who.id);
  for (let i = 0; i < 60 && !engine.cards.some((c) => c.choose?.card === "bake-credit"); i++) act({ type: "wait", seconds: 60 });
  expect(engine.cards.find((c) => c.choose?.card === "bake-credit")?.speaker).toBe(who.id);
  expect(Math.hypot(who.pos.x - s.player.pos.x, who.pos.y - s.player.pos.y)).toBeLessThanOrEqual(2.5);
  expect(act({ type: "choose", card: "bake-credit", choice: 0 }).status).toBe("completed");
  expect(hungry.credit).toMatchObject({ from: mine.id, amount: 2, debtor: who.id });
  expect(hungry.owes).toBe(mine.id);
  expect(who.word?.some((w) => w.act === "gave bread on credit to" && w.tone > 0)).toBe(true);
  expect(s.later).toMatchObject([{ card: "credit-due", who: who.id }]);

  engine.cards.length = 0;
  for (let i = 0; i < 9 * 24 && !engine.cards.some((c) => c.choose?.card === "credit-due"); i++) act({ type: "wait", seconds: 3600 });
  expect(engine.cards.find((c) => c.choose?.card === "credit-due")?.speaker).toBe(who.id);
  engine.cards.length = 0;
  for (let i = 0; i < 6 && !engine.cards.some((c) => c.choose?.card === "credit-due"); i++) act({ type: "wait", seconds: 1800 });
  expect(engine.cards.some((c) => c.choose?.card === "credit-due")).toBe(true);
  expect(act({ type: "choose", card: "credit-due", choice: 1 }).status).toBe("completed");
  expect(hungry.credit).toBeUndefined();
  expect(s.later).toEqual([]);
});

it("sends a house that began in the player's debt round about it, indoors too, and takes the payment", () => {
  const start = resolveSetting("A baker in Lyon, 1742 CE", "a");
  if ("error" in start) throw Error(start.error);
  const engine = smallSession(start.setting, "a");
  const s = engine.state;
  let serial = 0;
  const act = (command: Parameters<typeof engine.validate>[0]) =>
    engine.act({ actionId: `debt-${serial++}`, expectedRevision: s.revision, command });
  const mine = s.households!.find((h) => h.members.includes("player"))!;
  const debtor = s.households!.find((h) => h !== mine && s.actors.some((a) => h.members.includes(a.id) && (a.age ?? 0) >= 16))!;
  const who = s.actors.find((a) => debtor.members.includes(a.id) && (a.age ?? 0) >= 16)!;
  debtor.credit = { good: "bread", from: mine.id, seller: "player", debtor: who.id, amount: 5, reason: "hardship", repayment: "money" };
  debtor.owes = mine.id;
  debtor.fortune = 0.9;
  delete s.economy;
  act({ type: "wait", seconds: 3600 });
  expect(s.later).toMatchObject([{ card: "credit-due", who: who.id }]);
  s.player.pos = { ...engine.workPlan()!.places[0]!.pos };
  expect(s.player.pos.space).not.toBe("outside");
  const shown = () => engine.cards.some((c) => c.choose?.card === "credit-due");
  for (let i = 0; i < 8 * 24 && !s.later![0]!.asked; i++) act({ type: "wait", seconds: 3600 });
  for (let i = 0; i < 60 && !shown(); i++) act({ type: "wait", seconds: 60 });
  expect(engine.cards.find((c) => c.choose?.card === "credit-due")?.speaker).toBe(who.id);
  expect(who.pos.space).toBe(s.player.pos.space);
  const rng = engine.rng.bind(engine);
  vi.spyOn(engine, "rng").mockImplementation((purpose) => purpose === "card:credit-due" ? 0 : rng(purpose));
  const coin = s.player.inventory.coin ?? 0;
  expect(act({ type: "choose", card: "credit-due", choice: 0 }).status).toBe("completed");
  expect(s.player.inventory.coin).toBe(coin + 5);
  expect(debtor.credit).toBeUndefined();
  expect(debtor.owes).toBeUndefined();
});

it("varies a trade's day by place and period, naming only what was made there and then", () => {
  const kit = (id: string) => commonLivelihoods.find((l) => l.id === id)!;
  const PICKS = [0, 0.2, 0.4, 0.6, 0.8, 0.99];
  const days = (id: string, year: number, lon: number, lat: number) =>
    new Set(PICKS.map((pick) => processFor(kit(id), 1, "spring", { pick, year, lon, lat })?.title));
  expect(days("carver", -5000, 116, 40)).toContain("Grinding jade");
  expect(days("carver", 1350, 0, 51)).not.toContain("Grinding jade");
  expect(days("smith", -1500, 32, 26)).toContain("Casting {piece}");
  expect(days("smith", 1350, 0, 51)).not.toContain("Casting {piece}");
  expect(days("religious-specialist", 1350, 0, 51)).toEqual(new Set(["Services and visits"]));
  expect(days("religious-specialist", -3000, 0, 51)).toContain("Making an offering");
  const flints = PICKS.map((pick) => pieceOf(recipeFor(kit("flintknapper")), "spring", { pick: 0, year: -1300, lon: 32, lat: 26 }, pick));
  expect(flints).not.toContain("gunflints");

  const places = [[-5639, 116, 40], [-1300, 32, 26], [100, 12, 42], [1150, 120, 30], [1350, 0, 51], [1750, 0, 51]] as const;
  for (const k of commonLivelihoods)
    for (const [year, lon, lat] of places)
      for (const pick of PICKS) {
        const today = { pick, year, lon, lat };
        const p = processFor(k, 1, "spring", today);
        const words = [p?.title ?? "", ...(p?.steps ?? []).map((st) => st.task)].join(" ");
        if (words.includes("{piece}")) expect(pieceOf(recipeFor(k), "spring", today, 0), `${k.id} in ${year}`).toBeDefined();
      }
});

it("keeps a day's work that runs past midnight that day's, and lets yesterday's card lapse", () => {
  const engine = railwaySession();
  const s = engine.state;
  let n = 0;
  const act = (command: Parameters<typeof engine.validate>[0]) =>
    engine.act({ actionId: `night-${n++}`, expectedRevision: s.revision, command });
  const answer = () => {
    for (let i = 0; i < 30 && !engine.cards.some((c) => c.choose); i++) act({ type: "wait", seconds: 60 });
    const card = engine.cards.find((c) => c.choose)?.choose;
    engine.cards.length = 0;
    return card && act({ type: "choose", card: card.card, choice: card.choices.find((c) => !c.unavailable)!.index });
  };
  s.clock = Math.floor(s.clock / 86400) * 86400 + 20 * 3600;
  const coin = s.player.inventory.coin ?? 0;
  for (let step = 0; step < 3; step++) {
    s.player.pos = { ...engine.workPlan()!.door! };
    expect(engine.workHere()?.label, `step ${step + 1}`).toBe(engine.workPlan()!.steps[step].task);
    act(engine.workHere()!.command);
    answer();
  }
  expect((s.clock / 3600) % 24, "the line runs past midnight").toBeLessThan(6);
  expect(s.economy!.work!.done).toBe(true);
  expect((s.player.inventory.coin ?? 0) - coin, "the wage is paid").toBeGreaterThan(0);
  expect(s.record!.filter((r) => r.day === s.economy!.work!.day && !r.card.startsWith("plot:"))).toHaveLength(3);

  // A card left waiting, then two days gone: it lapses rather than block the work.
  s.clock = (Math.floor(s.clock / 86400) + 1) * 86400 + 9 * 3600;
  s.player.pos = { ...engine.workPlan()!.door! };
  act(engine.workHere()!.command);
  for (let i = 0; i < 30 && !engine.cards.some((c) => c.choose); i++) act({ type: "wait", seconds: 60 });
  const left = engine.cards.find((c) => c.choose)!.choose!;
  engine.cards.length = 0;
  s.clock += 2 * 86400;
  s.player.pos = { ...engine.workPlan()!.door! };
  expect(engine.workHere(), "today's work is open").toBeDefined();
  expect(act({ type: "choose", card: left.card, choice: left.choices[0].index }).status).toBe("rejected");
});

it("sends farmers to the field with the tool the place worked it with", () => {
  const tool = (id: string, year: number) =>
    carryKit({ year, setting: settingFor(places.find((p) => p.id === id)!, year) } as never).tool;
  expect(tool("umbria", 1400)).toBe("prop:hoe@hand");
  expect(tool("congo", 1400)).toBe("prop:hoe@hand");
  // No smelting yet: a wooden blade.
  expect(tool("umbria", -4000)).toBe("prop:hoe#1@hand");
  expect(tool("iroquoia", 1400)).toBe("prop:hoe#1@hand");
  expect(tool("cusco", 1400)).toBe("prop:digging-stick@hand");
  expect(tool("cusco", 1700)).toBe("prop:hoe@hand");
});

const fruitPatch = (): WorldObject => ({
  id: "fruit", name: "Fruit", kind: "crop", sprite: "berries",
  pos: { x: 10, y: 0, space: "outside" }, inventory: { fruit: 6 },
  resource: { item: "fruit", capacity: 6, readyAt: 0, regrowSeconds: 7 * 86400, seasons: ["summer"] },
});
it("harvesting conserves quantities and seasonal replenishment is bounded", () => {
  const e = smallSession(settingFor(places.find((p) => p.id === "konya")!, -6499));
  const o = fruitPatch();
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
  const e = smallSession(settingFor(places.find((p) => p.id === "konya")!, -6499));
  const a = e.state.actors[0];
  const h = e.state.households!.find((h) => h.id === a.householdId)!;
  const store = e.state.objects.find((o) => o.id === h.storeId)!;
  const fruit = fruitPatch();
  e.state.objects = [store, fruit];
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
  const e = smallSession(settingFor(places.find((p) => p.id === "konya")!, -6499));
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
  const e = smallSession(settingFor(places.find((p) => p.id === "konya")!, -6499));
  const patch: WorldObject = { ...fruitPatch(), inventory: { fodder: 4 }, resource: { ...fruitPatch().resource!, item: "fodder", capacity: 4 } };
  e.state.objects = [patch];
  const sheep = { ...e.state.actors[0], kind: "sheep" as const, pos: { ...patch.pos } };
  sheep.hunger = 20;
  e.state.player.pos = { ...patch.pos, x: patch.pos.x + 8 };
  e.state.clock = 36000;
  const before = patch.inventory.fodder!;
  expect(grazeActivity(sheep, e.state, () => {})).toBe(true);
  expect(patch.inventory.fodder).toBe(before - 1);
  expect(sheep.hunger).toBe(15);
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

it("gives a craft household a turn in its own garden, once a day", () => {
  const normandy = places.find((p) => p.id === "normandy")!;
  const e = smallSession({ ...settingFor(normandy, 1100), role: "Stonemason" });
  const home = e.state.households![0];
  home.makes = ["stone"];
  const topography = e.world.topography;
  e.world.topography = (x, y) => ({ height: 0, surface: "grass", ...topography?.(x, y),
    ...(x === home.home.x + 2 && y === home.home.y ? { field: { parcel: 0, crop: "wheat", stage: "ripe", garden: true, owner: "player", edges: 0, axis: "x", boundary: "none", wet: false, fence: 0 } } : {}) });
  const s = e.state;
  expect(e.item("coin")!.name).toBe("Silver deniers");
  const side = e.sideJob()!;
  expect(side.done).toBe(false);
  s.player.pos = { ...side.pos, x: side.pos.x + 1 };
  const tend = e.inspect(side.id)!.affordances.find((a) => a.command.type === "interact" && a.command.action === "tend-plot")!;
  expect(e.act({ actionId: "garden", expectedRevision: s.revision, command: tend.command }).status).toBe("completed");
  expect(e.sideJob()!.done).toBe(true);
});

it("social labels require sustained trust, recover gradually, and keep one best friend", async () => {
  const { updateRelationships, socialLabels } = await import("../src/core/bonds");
  const e = smallSession(settingFor(places.find((p) => p.id === "rome")!, 150), "social-labels");
  const s = e.state, [a, b] = s.actors;
  s.player.relations = [{ other: a.id, kind: "friend" }];
  s.relationships = {};
  s.bonds = [{ kind: "rival", with: b.id }];
  a.trust = 1;
  b.trust = 1;
  updateRelationships(s);
  expect(socialLabels(s).get(a.id)).toBe("FRIEND");
  expect(socialLabels(s).get(b.id)).toBe("RIVAL");
  a.trust = 8;
  updateRelationships(s);
  s.clock += 2 * 86400;
  updateRelationships(s);
  expect(socialLabels(s).get(a.id)).toBe("FRIEND");
  a.trust = 7;
  updateRelationships(s);
  a.trust = 8;
  updateRelationships(s);
  s.clock += 3 * 86400;
  updateRelationships(s);
  expect(socialLabels(s).get(a.id)).toBe("BEST FRIEND");
  a.trust = 5;
  updateRelationships(s);
  s.clock += 86400;
  updateRelationships(s);
  expect(socialLabels(s).get(a.id)).toBe("BEST FRIEND");
  b.trust = -6;
  updateRelationships(s);
  s.clock += 86399;
  updateRelationships(s);
  expect(socialLabels(s).get(b.id)).toBe("RIVAL");
  s.clock++;
  updateRelationships(s);
  expect(socialLabels(s).get(b.id)).toBe("ENEMY");
  b.trust = 0;
  updateRelationships(s);
  expect(socialLabels(s).get(b.id)).toBe("ENEMY");
  s.clock += 86400;
  updateRelationships(s);
  expect(socialLabels(s).get(b.id)).toBe("RIVAL");
  s.bonds = [];
  b.trust = 8;
  updateRelationships(s);
  s.clock += 3 * 86400;
  updateRelationships(s);
  expect([...socialLabels(s).values()].filter((x) => x === "BEST FRIEND")).toHaveLength(1);
  expect(socialLabels(s).get(b.id)).toBe("FRIEND");
  updateRelationships(s);
  s.clock += 3 * 86400;
  updateRelationships(s);
  expect([...socialLabels(s).values()].filter((x) => x === "BEST FRIEND")).toHaveLength(1);
  a.trust = 0;
  updateRelationships(s);
  s.clock += 86400;
  updateRelationships(s);
  expect(socialLabels(s).get(a.id)).toBeUndefined();
  expect(socialLabels(s).get(b.id)).toBe("BEST FRIEND");
});

it("procedural friendships include the player, are reciprocal, and exclude household members", async () => {
  const { befriend } = await import("../src/world/v3/population");
  const people = ["player", "neighbour", "housemate"].map((id) => ({
    a: { id, age: 30, householdId: id === "neighbour" ? "other" : "home", relations: [] as import("../src/core/types").SocialRelation[] },
    home: { x: 0, y: 0 },
  }));
  befriend(people, "friends");
  expect(people[0].a.relations).toEqual([{ other: "neighbour", kind: "friend" }]);
  expect(people[1].a.relations).toContainEqual({ other: "player", kind: "friend" });
  expect(people.every(({ a }) => a.relations.length <= 2)).toBe(true);
});


it("gives processing trades their own work at the workplace rather than household weaving", () => {
  for(const id of ["potter","brickmaker","lime-burner","dyer","fuller","tanner","boatwright"]) {
    const kit=commonLivelihoods.find(l=>l.id===id)!;
    const process=processFor(kit)!;
    expect(process.steps.every(s=>s.at==="workplace"),id).toBe(true);
    expect(process.steps.reduce((n,s)=>n+(s.hours ?? 0),0),id).toBe(8);
    expect(process.stations.some(s=>s.includes("loom")),id).toBe(false);
    expect(process.steps.some(s=>s.task.includes("Spin") || s.task.includes("Weave")),id).toBe(false);
  }
});

it("collects the year's share of the grain, holding back a year's bread and leaving the rest owing", () => {
  const at = (name: string, year: number) => claimFor(settingFor(places.find((p) => p.name === name)!, year));
  expect(at("Kyoto", 1750)).toMatchObject({ to: "the domain", share: 0.4 });
  expect(at("Hangzhou", 1200)).toMatchObject({ share: 0.5, landlord: true });
  expect(at("Cusco", 1500)).toMatchObject({ share: 0, labour: true });
  const farm = (id: string, members: number) => ({ id, members: Array.from({ length: members }, (_, i) => `${id}-${i}`), home: { x: 0, y: 0, space: "outside" }, storeId: `${id}-store`, makes: ["grain"] }) as Household;
  const [full, thin, lord] = [farm("full", 2), farm("thin", 5), { ...farm("lord", 1), makes: [] }];
  const economy: Economy = { hour: 0, stock: { full: { grain: 1200 }, thin: { grain: 700 }, lord: {} }, short: {} };
  const taken = collectClaim(economy, [full, thin, lord], 0.25, lord);
  expect(taken.full).toEqual({ taken: 300, owing: 0 });
  // Five eat 560 in a year, so 140 of the 700 can be spared against 175 due.
  expect(taken.thin).toEqual({ taken: 140, owing: 35 });
  expect(economy.stock.lord.grain).toBe(440);
  expect(economy.arrears).toEqual({ thin: 35 });
  expect(collectClaim(economy, [thin], 0.25).thin.owing).toBeCloseTo(35 + 0.25 * 560);
});

it("prices staples by the days of bread in the town's stores", () => {
  const h = (id: string, members: number) => ({ id, members: Array.from({ length: members }, (_, i) => `${id}-${i}`) }) as Household;
  const economy: Economy = { hour: 0, stock: { a: { grain: 500 }, b: { bread: 60 } }, short: {} };
  expect(grainDays(economy, [h("a", 4), h("b", 6)])).toBe(56);
  expect(dearness(56)).toBe(1);
  expect(dearness(14)).toBe(2);
  expect(dearness(400)).toBe(0.75);
  expect(dearness(0)).toBe(2.5);
});

it("reads what a place has from its ground, with documented specialties first", () => {
  const ground = { lon: 0, lat: 45, year: 1300, climate: "temperate", relief: 0.1, water: "none" } as const;
  // An alluvial plain: grain and clay but no stone, as in Mesopotamia.
  expect(tradeOf({ ...ground, lon: 45, lat: 32, year: -2000, climate: "arid", water: "river-ew", ecology: "desert" })).toEqual({ known: ["grain"], lacks: ["salt", "timber"] });
  expect(endowmentFor({ ...ground, water: "coast-s", climate: "mediterranean" })).toMatchObject({ fish: 2, salt: 2, oil: 2 });
  expect(endowmentFor({ ...ground, water: "coast-n", climate: "boreal" }).salt).toBe(1);
  const cornwall = { ...ground, lon: -5, lat: 50.3, relief: 0.3, water: "coast-s" } as const;
  expect(tradeOf(cornwall).known[0]).toBe("ore");
  expect(resourceName("ore", cornwall)).toBe("tin");
  expect(resourceName("grain", { ...ground, lon: 135.7, lat: 35, climate: "monsoon" })).toBe("rice");
  expect(goodsOf(commonLivelihoods.find((l) => l.id === "salt-worker"), 1)).toEqual(["salt"]);
});

it("draws port cloth from measured bolts and retains the unused part for households", () => {
  const household: Household = { id:"buyers", members:["buyer"], home:{x:0,y:0,space:"outside"}, storeId:"store", needs:["cloth"] };
  const economy: Economy = {hour:8,stock:{},short:{}};
  const counter = {"cloth-bolt":1};
  const tick = (hour:number)=>runEconomy([household],economy,hour,()=>0,0.8,undefined,[{id:"counter",prop:"clothCounter",inventory:counter}]);
  tick(9);
  expect(counter["cloth-bolt"]).toBe(0);
  expect(economy.stock.import.cloth).toBeCloseTo(1-0.02/24);
  tick(10);
  expect(economy.stock.import.cloth).toBeCloseTo(1-2*0.02/24);
  household.makes=["cloth"];
  economy.stock.buyers.cloth=0.01/24;
  tick(11);
  expect(economy.stock.import.cloth).toBeCloseTo(1-2.5*0.02/24,8);
  economy.stock.import.cloth=0;
  tick(12);
  expect(economy.short.buyers).toContain("cloth");
});

it("feeds the quay neighbourhood from landed sacks and replenishes the grocer on separate spice sailings", () => {
  const h: Household={id:"street",members:Array.from({length:24},(_,i)=>"resident"+i),home:{x:0,y:0,space:"outside"},storeId:"kitchen",needs:["bread"]};
  const economy: Economy={hour:8,stock:{},short:{}};
  const stock={grain:0,pepper:1}, bread={bread:0}, spice={pepper:0};
  const counters=[
    {id:"loft",prop:"grainHoist",inventory:stock,consignment:{item:"pepper",days:4,units:8}},
    {id:"oven",inventory:bread,shopSupply:{source:"loft",input:"grain",item:"bread",yield:8,limit:16}},
    {id:"grocer",inventory:spice,shopSupply:{source:"loft",input:"pepper",item:"pepper",yield:1,limit:6}},
  ];
  const tick=(hour:number)=>runEconomy([h],economy,hour,()=>0,1,undefined,counters);
  tick(9);
  expect(economy.short.street).toContain("bread");
  expect([spice.pepper,stock.pepper]).toEqual([1,0]);
  stock.grain++;spice.pepper--;
  tick(10);
  expect([stock.grain,bread.bread,spice.pepper]).toEqual([0,7,0]);
  expect(economy.short.street).toBeUndefined();
  tick(18);
  expect(bread.bread).toBe(0);
  expect(economy.short.street).toContain("bread");
  tick(4*24+7);
  expect(stock.pepper+spice.pepper).toBe(0);
  tick(4*24+8);
  expect([spice.pepper,stock.pepper]).toEqual([6,2]);
});

it("reserves actual warehouse lots, enforces dated quotes and charges the agreed lending fee", async()=>{
  const {blankBook,fillOrder,orderProblem,loanDue,marketCall,landedOrder}=await import("../src/core/exchange");
  type Order=import("../src/core/exchange").MarketOrder;
  const f={kind:"beurs" as const,marketId:"beurs",animals:[],book:blankBook(),seed:"beurs",clock:10*3600,stock:{grain:2,pepper:0},purse:{coin:0},desks:[true,true,true,true,true],carryRoom:1};
  const c=(action:Order["action"],desk:number,quantity=1):Order=>({type:"exchange",action,desk,quantity,call:Math.floor(f.clock/300)});
  const trade=(action:Order["action"],desk:number,quantity=1)=>{const order=c(action,desk,quantity);expect(orderProblem(f,order)).toBeUndefined();fillOrder(f,order);};
  expect(orderProblem(f,c("buy",0))).toMatch(/coin/);
  trade("borrow",4);
  expect(orderProblem(f,c("borrow",3))).toMatch(/current bill/);
  expect(orderProblem(f,c("buy",1))).toMatch(/few lots/);
  const {markets}=await import("../src/content/economy/exchanges");
  const quote=marketCall(f.seed,120,markets.beurs.listings[0]),old=c("buy",0);
  trade("buy",0,2);
  expect(f.stock.grain).toBe(0);
  expect(f.purse.coin).toBe(40-2*quote.ask);
  expect(orderProblem(f,c("redeem",0,2))).toMatch(/pack/);
  trade("sell",0);
  expect(f.book.realized).toBe(quote.bid-quote.ask);
  trade("redeem",0);
  expect(f.purse).toMatchObject({grain:1});
  expect(f.stock.grain).toBe(1);
  expect(orderProblem(f,c("sell",0))).toMatch(/hold/);
  f.clock+=300;
  expect(orderProblem(f,old)).toMatch(/new price/);
  trade("hire",0);trade("freight",0);
  f.book.warehouse="loft";
  const player={inventory:f.purse,exchanges:{beurs:f.book}};
  const store={id:"loft",inventory:f.stock}, balance=f.purse.coin;
  store.inventory.grain!++;
  landedOrder(player,store,true);
  expect(f.stock.grain).toBe(1);expect(f.book.holdings.grain?.quantity).toBe(1);expect(f.purse.coin).toBe(balance+1);
  landedOrder(player,store,true);
  expect(f.purse.coin).toBe(balance+1);expect(f.stock.grain).toBe(1);
  f.clock+=86400;
  expect(loanDue(f.book.loan!,f.clock)).toBe(52);
  expect(orderProblem(f,c("repay",4))).toMatch(/more coin/);
  f.purse.coin=52;trade("repay",4);
  expect(f.purse.coin).toBe(0);expect(f.book.loan).toBeUndefined();
});

it("trades the animals at the square, splits a drover’s flock and buys produce from the player",async()=>{
  const {blankBook,fillOrder,orderProblem,offeredLots,holdingAt}=await import("../src/core/exchange");
  const {markets}=await import("../src/content/economy/exchanges");
  type Order=import("../src/core/exchange").MarketOrder;
  const stand={x:2,y:2,space:"outside" as const};
  const animals:import("../src/core/fauna").FaunaGroup[]=[{id:"flock",speciesId:"sheep",owner:"player",
    members:[{...stand,direction:1},{x:3,y:3,direction:2}],pos:stand,home:stand,homeRadius:2,state:"idle",since:0,stride:0,nextDecisionAt:0}];
  const f={kind:"corn" as const,marketId:"square",stand,animals,clock:9*3600,book:blankBook(),seed:"lynn",carryRoom:8,
    stock:{grain:0},purse:{coin:30,grain:2},desks:[true,true,true]};
  const order=(action:Order["action"],desk=0,quantity=1):Order=>({type:"exchange",action,desk,quantity,call:108});
  const trade=(c:Order)=>{expect(orderProblem(f,c)).toBeUndefined();fillOrder(f,c);};
  const sheep=markets.corn.listings[1];
  expect(orderProblem(f,order("borrow",3))).toBeTruthy();
  expect(orderProblem(f,order("freight"))).toBeTruthy();
  trade(order("deliver",0,2));expect([f.purse.grain,f.stock.grain]).toEqual([0,2]);
  trade(order("tally"));expect(orderProblem(f,order("tally",1))).toMatch(/complete/);
  trade(order("sell",1));expect(animals[0].members).toHaveLength(1);
  expect(offeredLots(f,sheep)).toBe(1);
  animals[1].members.push({x:3,y:2,direction:1});
  trade(order("buy",1));expect(holdingAt(f,sheep)?.quantity).toBe(2);
  expect(offeredLots(f,sheep)).toBe(1);
  expect(orderProblem(f,order("redeem",1))).toMatch(/animals/);
  animals.find(g=>g.members[0]?.purchase!==undefined)!.members[0].x+=20;
  expect(holdingAt(f,sheep)?.quantity).toBe(1);
  expect(orderProblem(f,order("sell",1,2))).toMatch(/back/);
  trade(order("sell",1));
  expect(animals[0]).toMatchObject({id:"flock",market:"square",owner:"square"});
  expect(animals.every(g=>g.members.length)).toBe(true);
});

it("places spot rice, corn and maritime markets in their historical settings",async()=>{
  const {squareMarket}=await import("../src/content/economy/exchanges");
  const {sailingPort}=await import("../src/content/settlements/waterfronts");
  for(const [q,kind] of [["A corn factor in King's Lynn 1750","corn"],["A cattle dealer in York 1870","corn"],["Osaka 1740","dojima"],
    ["Osaka 1700",undefined],["Surat 1650","cloth"],["Rome 200",undefined]] as const){
    const r=resolveSetting(q,"market-day");if("error" in r)throw Error(r.error);
    expect(squareMarket(r.setting,r.setting.placeId),q).toBe(kind);
  }
  expect(sailingPort("city-riga",1700)).toEqual({hull:"fluyt",cargo:"cloth"});
  expect(sailingPort("city-surat",1650)).toEqual({hull:"dhow",cargo:"cloth"});
  expect(sailingPort("rotterdam",1950)).toBeUndefined();
});

it.runIf(!!process.env.FULL)("starts a corn factor at the inland market with grain they can sell",async()=>{
  const {prepareConnectedStart}=await import("../src/runtime/map-travel");
  const seed="market-day",r=resolveSetting("A corn factor in Stamford 1780",seed);
  if("error" in r)throw Error(r.error);
  const e=await prepareConnectedStart(r.setting,seed),p=e.state.player,f=e.exchangeFloor()!;
  expect([p.role,f.kind]).toEqual(["Corn factor","corn"]);
  expect(f.people.map(a=>a?.role)).toEqual(["Grain factor","Sheep dealer","Cattle dealer"]);
  expect(f.animals.filter(g=>g.market===f.place.id).map(g=>g.speciesId).sort()).toEqual(["cattle","cattle","sheep","sheep"]);
  const grain=p.inventory.grain!, stock=f.stock!.grain!,cash=p.inventory.coin!;
  const c={type:"exchange" as const,action:"deliver" as const,desk:0,quantity:1,call:Math.floor(e.state.clock/300)};
  expect(e.validate(c)).toBeUndefined();e.execute(c);
  expect([p.inventory.grain,f.stock!.grain]).toEqual([grain-1,stock+1]);
  expect(p.inventory.coin).toBeGreaterThan(cash);
});

it("turns a farm laid up into a household short of bread with someone to ask", () => {
  const v = village(), economy: Economy = { hour: 0, stock: {}, short: {} };
  const ailments = v[0].members.map((who) => ({ id: "fever", who, since: 0, days: 30 }));
  const s = { clock: 10 * 86400, households: v, economy, ailments } as never;
  const sick = householdConditions(s).get("farm")?.sick ?? [];
  expect(sick).toEqual(v[0].members);
  runEconomy(v, economy, 24 * 21, (h) => h.members.filter((m) => !sick.includes(m)).length);
  expect(householdConditions(s).get("brewer")?.short).toEqual({ good: "bread", seller: "baker1" });
});

it("sours a house on the seller who let it go short, unless the seller is ill, and on a debtor", () => {
  const run = (ailments: object[]) => {
    const v = village();
    v[1].credit = { good: "grain", from: "farm", debtor: "baker1", amount: 5, reason: "hardship", repayment: "money" };
    const actors = v.flatMap((h) => h.members.map((id) => ({ id, name: id, householdId: h.id, relations: id === "baker1" ? [{ other: "brewer1", kind: "friend" }] : [] })));
    const s = { clock: 5 * 86400, households: v, actors, ailments, player: { id: "player" }, manifest: { seed: "x" }, economy: { hour: 0, stock: {}, short: { brewer: ["bread"] } } } as never as Snapshot;
    for (let day = 0; day < 5; day++) settleRegard(s);
    return s;
  };
  const well = run([]);
  expect(regardBetween(well, "brewer", "baker")).toBeLessThanOrEqual(AT_ODDS);
  expect(householdConditions(well).get("brewer")?.shuns).toEqual(["baker"]);
  expect(well.actors.find((a) => a.id === "brewer1")?.word?.[0]).toMatchObject({ about: "baker1", conduct: true });
  expect(regardBetween(well, "farm", "baker")).toBeLessThan(-1);
  const ill = run([{ id: "fever", who: "baker1", since: 0, days: 30 }]);
  expect(regardBetween(ill, "brewer", "baker")).toBe(0);
  expect(regardBetween(ill, "baker", "brewer")).toBeGreaterThan(1);
  expect(worstGrievance(well)).toBeUndefined();
  for (let day = 0; day < 5; day++) settleRegard(well);
  expect(worstGrievance(well)).toMatchObject({ by: { id: "brewer" }, against: { id: "baker" }, wrong: "left them without bread", debt: false });
  expect(worstGrievance(well, "baker")).toBeUndefined();
  expect(houseTalk(well, well.households![2])).toBe("They have fallen out with baker1's household, who they say left them without bread.");
});

it("has kin with grain to spare send it to a house short of bread, and a poor house with none take it", () => {
  const town = (fortune: number, related: boolean) => {
    const v = village();
    v[2].fortune = fortune;
    const actors = v.flatMap((h) => h.members.map((id) => ({ id, name: id, householdId: h.id, relations: related && id === "brewer1" ? [{ other: "farm1", kind: "parent" }] : [] })));
    const s = { clock: 0, households: v, actors, player: { id: "player" }, manifest: { seed: "x" },
      economy: { hour: 0, stock: { farm: { grain: 500 } }, short: { brewer: ["bread"] } } } as never as Snapshot;
    for (let day = 0; day < 60; day++) { s.clock = day * 86400; settleRegard(s, undefined, 100); }
    return s;
  };
  const helped = town(0.1, true);
  expect(helped.economy!.stock.brewer.grain).toBeGreaterThan(100);
  expect(regardBetween(helped, "brewer", "farm")).toBeGreaterThan(3);
  expect(regardBetween(helped, "farm", "brewer")).toBe(0);
  const alone = town(0.1, false);
  expect(alone.economy!.stock.brewer?.grain).toBeGreaterThan(0);
  expect(regardBetween(alone, "farm", "brewer")).toBeLessThan(0);
  expect(alone.houseWrongs!["farm>brewer"]).toBe("took grain from their store");
  expect(alone.households![0].history?.some((e) => e.kind === "robbed")).toBe(true);
  expect(town(0.9, false).economy!.stock.brewer).toBeUndefined();
});

it("opens a world with debts already sour and a death this year still mourned", () => {
  const v = Array.from({ length: 40 }, (_, i) => ({ id: `h${i}`, members: [`a${i}`], home: { x: i, y: 0, space: "outside" as const }, storeId: `h${i}`,
    history: [{ year: 100, kind: "died" as const }],
    credit: { good: "grain", from: `h${(i + 1) % 40}`, debtor: `a${i}`, amount: 2, reason: i % 2 ? "hardship" as const : "household" as const, repayment: "money" as const } }));
  const s = { clock: 0, households: v, actors: [], player: { id: "player" }, manifest: { seed: "open" } } as never as Snapshot;
  seedHouseholds(s, 100);
  expect(v.every((h, i) => regardBetween(s, `h${(i + 1) % 40}`, h.id) <= (i % 2 ? -2 : 0))).toBe(true);
  expect(v.some((h, i) => !(i % 2) && regardBetween(s, `h${(i + 1) % 40}`, h.id) <= AT_ODDS)).toBe(false);
  expect(worstGrievance(s)?.debt).toBe(true);
  const mourning = [...householdConditions(s).values()].filter((c) => c.mourning === "one of the household").length;
  expect(mourning).toBeGreaterThan(2);
  expect(mourning).toBeLessThan(20);
});

it("has the keeper settle a quarrel between two households and tell the town", () => {
  const e = smallSession(settingFor(places.find((p) => p.id === "london")!, 1700), "case") as any, s = e.state;
  const [, by, against] = s.households as Household[];
  // The fixture has two other households; give the keeper one of their own.
  e.keeperId = by.members.pop();
  s.actors.find((a: any) => a.id === e.keeperId).householdId = "court";
  against.credit = { good: "grain", from: by.id, debtor: against.members[0], amount: 3, reason: "hardship", repayment: "produce" };
  s.economy ??= { hour: 0, stock: {}, short: {} };
  s.economy.stock[against.id] = { grain: 10 };
  s.houseRegard = { [`${by.id}>${against.id}`]: -5.5 };
  s.houseWrongs = { [`${by.id}>${against.id}`]: "would not pay what they owe" };
  e.hearCase();
  expect(against.credit).toBeUndefined();
  expect(s.economy.stock[against.id].grain).toBe(7);
  expect(regardBetween(s, by.id, against.id)).toBe(-1);
  expect(regardBetween(s, against.id, by.id)).toBe(-2);
  expect(s.actors.find((a: any) => a.id === by.members[0]).word[0]).toMatchObject({ about: against.members[0], conduct: true });
  expect(worstGrievance(s, s.player.householdId)).toBeUndefined();
});

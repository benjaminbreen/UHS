import { it, expect } from "vitest";
import { runEconomy } from "../src/core/economy";
import { harvestResource } from "../src/core/livelihood";
import { carryKit, parseLoad, withLoads } from "../src/content/economy/carrying";
import type { Economy, Household } from "../src/core/types";
import { panelCity } from "../scripts/review/panel";
import { commonLivelihoods } from "../src/content/characters/livelihoods.generated";
import { processFor } from "../src/content/economy/processes";
import type { SettlementPlan } from "../src/world/v3/types";
import { goodsOf } from "../src/content/economy/goods";
import { goodName, productFor, sellerOf } from "../src/content/economy/products";
import { resolveSetting, settingFor } from "../src/content/geography/resolve";
import { CARDS } from "../src/content/cards";
import { cardText } from "../src/core/cards";
import { places } from "../src/content/geography/places";
import { createSettingSession } from "../src/runtime/session";
import { kinOf, URGENT } from "../src/core/kin";
import { sexOf } from "../src/core/brief";
import { herdWords } from "../src/content/fauna/herding";

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
  expect(goodsOf(kit("swineherd"), 1)).toEqual(["meat"]);
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
  expect(drinks).toBeGreaterThan(0);
  expect(credits).toBeGreaterThan(0);
  expect(households.some((h) => !h.needs?.includes("drink"))).toBe(true);
});

it("routes work and children's errands to their actual destinations", () => {
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

it("keeps indoor workers at their actual workplace and social visits local", () => {
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
  for (const stock of Object.values(e.stock))
    for (const n of Object.values(stock)) expect(n).toBeLessThanOrEqual(90);
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

it("takes a railway labourer from the station to the line and back, through a card at each", () => {
  const { engine } = panelCity("london", 1900);
  engine.state.player.origin!.livelihood = "railway-labourer";
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
    const card = engine.cards.find((c) => c.choose)!.choose!;
    expect(engine.workHere(), "no work while a card waits").toBeUndefined();
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

it("gives a labourer's children his surname, and lets his family call only a few times a day", () => {
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
  expect(pairs.length).toBeGreaterThan(10);
  for (const [child, father] of pairs) expect(surname(child), byId.get(child)!.name).toBe(surname(father));
  expect(kinOf(s).length).toBeGreaterThan(0);
  for (let i = 0; i < 15 * 12; i++) {
    engine.act({ actionId: `kin-${i}`, expectedRevision: s.revision, command: { type: "wait", seconds: 300 } });
    engine.cards.length = 0;
  }
  const calls = Object.keys(s.kin?.said ?? {}).filter((key) => !URGENT.some((n) => key.endsWith(`:${n}`)));
  expect(calls.length).toBeLessThanOrEqual(3);
});

it("puts a baker in a bakehouse at three in the morning, with the oven inside", () => {
  const start = resolveSetting("A baker in Lyon, 1742 CE", "a");
  if ("error" in start) throw Error(start.error);
  const engine = createSettingSession(start.setting, "a");
  const s = engine.state, h = s.households!.find((h) => h.members.includes("player"))!;
  expect(Math.floor(s.clock / 3600) % 24).toBe(3);
  expect(engine.world.place(h.residence!)?.name).toBe("The bakehouse");
  const oven = engine.workPlan()!.places[0]!;
  expect(oven.pos.space, "the dough is set at the oven, indoors").toBe(h.residence);
  expect(s.objects.find((o) => o.id === `${h.residence}-work`)?.pos).toEqual(oven.pos);
  expect(engine.workPlan()!.places[2]!.pos.space, "the bread is sold at the door").toBe("outside");
  expect(s.objects.find((o) => o.id === `${h.residence}-frontage`)?.sprite, "a loaf hangs out front").toMatch(/wallsign-.*-3$/);
});

it("bakes at the oven its place and period had", () => {
  for (const [prompt, bench] of [["A baker in Isfahan, 1600 CE", "tannur"], ["A baker in Tenochtitlan, 1450 CE", "metate"]]) {
    const start = resolveSetting(prompt, "a");
    if ("error" in start) throw Error(start.error);
    const engine = createSettingSession(start.setting, "a");
    const h = engine.state.households!.find((h) => h.members.includes("player"))!;
    expect(engine.state.objects.find((o) => o.id === `${h.residence}-work`)?.prop, prompt).toBe(bench);
    expect(engine.workPlan()!.places[0]!.label).toBe(`your ${bench}`);
  }
});

it("gives every recipe step a card it can always draw, worded without gaps", () => {
  const slots = new Set<string>();
  for (const k of commonLivelihoods)
    for (const season of ["spring", "summer", "autumn", "winter"] as const)
      for (const step of processFor(k, 1, season)?.steps ?? []) if (step.card) slots.add(step.card);
  expect(processFor(commonLivelihoods.find((l) => l.id === "rice-farmer")!, 1, "autumn")?.title).toBe("The rice harvest");
  for (const slot of slots) expect(CARDS.some((c) => c.slot === slot && !c.scope && !c.when), slot).toBe(true);
  for (const c of CARDS) {
    if (!c.who) expect(JSON.stringify(c), `${c.id} names a person but says nobody`).not.toMatch(/\{name\}/i);
    for (const text of [c.text, ...c.choices.flatMap((x) => [x.label, x.note ?? "", x.line, x.otherwiseLine ?? ""])])
      expect(cardText(text, { boss: "foreman", name: "Ana", work: "weaving", good: "cloth", crop: "barley", ailment: "the fever", healer: "healer", ...herdWords("camel") }), c.id).not.toMatch(/[{}]/);
  }
});

it("keeps a day's work that runs past midnight that day's, and lets yesterday's card lapse", () => {
  const { engine } = panelCity("london", 1900);
  const s = engine.state;
  s.player.origin!.livelihood = "railway-labourer";
  let n = 0;
  const act = (command: Parameters<typeof engine.validate>[0]) =>
    engine.act({ actionId: `night-${n++}`, expectedRevision: s.revision, command });
  const answer = () => {
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

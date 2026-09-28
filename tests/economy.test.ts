import { it, expect } from "vitest";
import { runEconomy } from "../src/core/economy";
import { harvestResource } from "../src/core/livelihood";
import { parseLoad, withLoads } from "../src/content/economy/carrying";
import type { Economy, Household } from "../src/core/types";
import { panelCity } from "../scripts/review/panel";
import { commonLivelihoods } from "../src/content/characters/livelihoods.generated";
import { processFor } from "../src/content/economy/processes";
import type { SettlementPlan } from "../src/world/v3/types";

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

it("routes work and children's errands to their actual destinations", () => {
  const world = panelCity("london", 1400).engine.world;
  const miller = world.initialActors.find((a) => a.origin?.livelihood === "miller" &&
    world.itinerary?.(a.id)?.segments.some((s) => s.target?.family === "quern"));
  const turn = miller && world.itinerary?.(miller.id)?.segments.find((s) => s.target?.family === "quern");
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
  const kit = { vessel: "prop:jug@head", basket: "prop:basket@back", bundle: "prop:sack@hand" };
  const stations = withLoads(
    [
      { pos: at, activity: "draw-water", label: "Fetching water", minutes: 20 },
      { pos: at, activity: "play", label: "Playing", minutes: 20 },
      { pos: at, activity: "gather", label: "Gathering", minutes: 20 },
      { pos: at, activity: "visit", label: "Buying bread from Ada", minutes: 20 },
      { pos: at, activity: "rest", label: "At home", minutes: 20 },
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
  ]);
  expect(parseLoad("prop:jug@head")).toEqual({ prop: "jug", style: "head" });
  expect(parseLoad("bread")).toBeUndefined();
});

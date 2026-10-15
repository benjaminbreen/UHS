import { expect, it } from "vitest";
import { settingFor } from "../src/content/geography/resolve";
import { places } from "../src/content/geography/places";
import { herdingCustom } from "../src/content/fauna/herding";
import { herdersFor } from "../src/world/v3/herders";
import type { FaunaGroup } from "../src/core/fauna";
import type { Point, WorldModel } from "../src/core/types";
import { packForSetting } from "../src/content/geography/pack";
import { wayfarersAt } from "../src/content/wayfarers";
import { wayfarerDay, type Way } from "../src/world/v3/wayfarers";

const at = (id: string, year: number) =>
  settingFor(places.find((p) => p.id === id)!, year);
const world = { blocked: () => false } as unknown as WorldModel;
const herd = (id: string, speciesId: string): FaunaGroup => ({
  id,
  speciesId,
  members: [{ x: 0, y: 0, direction: 1 }],
  pos: { x: 0, y: 0, space: "outside" },
  home: { x: 0, y: 0, space: "outside" },
  homeRadius: 12,
  state: "graze",
  nextDecisionAt: 0,
  stride: 0,
  since: 0,
});

it("sends different people out with the animals in different places", () => {
  const andes = places.find((p) => p.lon > -76 && p.lon < -68 && p.lat < -10)!;
  expect(herdingCustom(settingFor(andes, 1400), "llama").women).toBeGreaterThan(
    herdingCustom(at("konya", -5000), "sheep").women,
  );
  // Large stock is less often a child's charge.
  const s = at("konya", -5000);
  expect(herdingCustom(s, "cattle").youth).toBeLessThan(
    herdingCustom(s, "sheep").youth,
  );
  expect(
    herdingCustom(at("city-florence", 1990), "sheep").party[0],
  ).toBeGreaterThan(0.8);
});

it("makes one to three herders, the same every time, beside their herd", () => {
  const setting = at("konya", -5000);
  const ages: number[] = [];
  let dogs = 0;
  for (let n = 0; n < 40; n++) {
    const g = herd(`fauna-sheep-${n}`, "sheep");
    const first = herdersFor(world, "seed", g, setting);
    expect(herdersFor(world, "seed", g, setting)).toEqual(first);
    expect(first.actors.length).toBeGreaterThanOrEqual(1);
    expect(first.actors.length).toBeLessThanOrEqual(3);
    for (const a of first.actors) {
      expect(a.tends).toEqual({ herd: g.id, seat: first.actors.indexOf(a) });
      expect(Math.hypot(a.pos.x, a.pos.y)).toBeLessThan(5);
      expect(a.role).toMatch(/herd/i);
    }
    ages.push(...first.party.map((who) => who.age));
    if (first.dog) {
      dogs++;
      expect(first.dog.speciesId).toBe("dog");
    }
  }
  expect(ages.some((age) => age > 0 && age < 17)).toBe(true);
  expect(ages.some((age) => age >= 17)).toBe(true);
  expect(dogs).toBeGreaterThan(5);
  expect(dogs).toBeLessThan(35);
});

it("puts the people of the place and period on the road", () => {
  const ids = (s: ReturnType<typeof at>) => wayfarersAt(s).map((w) => w.id);
  const london = ids(at("london", 1400)),
    cusco = ids(at("cusco", 1500));
  expect(london).toContain("chapman");
  expect(london).not.toContain("chaski");
  expect(cusco).toContain("chaski");
  expect(cusco).not.toContain("beggar");
  expect(ids(at("cusco", 1700))).toContain("potosi-mita");
  expect(ids(at("london", -20000)).every((id) => /band|stone/.test(id))).toBe(true);
});

it("brings passers-by in over one border and out over another", () => {
  const setting = {
    ...at("london", 1400),
    environment: { ...at("london", 1400).environment, population: "settled" },
  } as ReturnType<typeof at>;
  const pack = packForSetting(setting);
  const open = { ...world, settlements: [] } as unknown as WorldModel;
  const line = (side: number, axis: "x" | "y") =>
    Array.from({ length: 191 }, (_, i) => (axis === "x" ? { x: i * side, y: 0 } : { x: 0, y: i * side }));
  const ways = [
    ["N", "Hertford", "village", line(-1, "y")],
    ["S", "London", "city", line(1, "y")],
    ["W", "St Albans", "town", line(-1, "x")],
  ].map(([bearing, name, settlement, path]) => ({
    id: String(bearing), to: String(name), bearing, mode: "land", name, settlement,
    path, point: (path as Point[]).at(-1)!, shore: false, walkable: true,
  })) as Way[];
  const day = wayfarerDay(open, "seed", pack, ways, 3);
  expect(wayfarerDay(open, "seed", pack, ways, 3)).toEqual(day);
  expect(day.length).toBeGreaterThan(2);
  const borders = ways.map((w) => w.point);
  const onBorder = (p: Point) => borders.some((b) => b.x === p.x && b.y === p.y);
  for (const { actor, itinerary } of day) {
    const walks = itinerary.segments.filter((s) => s.path);
    const first = walks[0].pos,
      last = walks.at(-1)!.path!.at(-1)!;
    expect(onBorder(first), actor.role).toBe(true);
    expect(onBorder(last), actor.role).toBe(true);
    expect(itinerary.segments.at(-1)!.activity).toBe("rest");
    expect(actor.wayfarer!.until).toBeGreaterThan(itinerary.start * 60);
  }
});

it("drives a llama train along the party's road, a few tiles behind", () => {
  const base = at("cusco", 1500);
  const setting = { ...base, environment: { ...base.environment, population: "settled" } } as typeof base;
  const pack = packForSetting(setting);
  const open = { ...world, settlements: [] } as unknown as WorldModel;
  const line = (dx: number, dy: number) => Array.from({ length: 121 }, (_, i) => ({ x: i * dx, y: i * dy }));
  const ways = [
    ["E", line(1, 0)],
    ["W", line(-1, 0)],
  ].map(([id, path]) => ({
    id, to: id, bearing: id, mode: "land", path, point: (path as Point[]).at(-1)!, shore: false, walkable: true,
  })) as unknown as Way[];
  const trains = Array.from({ length: 30 }, (_, d) => wayfarerDay(open, "seed", pack, ways, d))
    .flat()
    .filter((p) => p.animals);
  expect(trains.length).toBeGreaterThan(0);
  for (const { actor, itinerary, animals } of trains) {
    expect(actor.role).toBe("Llama driver");
    expect(actor.wayfarer!.train).toEqual({ species: "llama", count: animals!.length });
    expect(animals!.length).toBeGreaterThanOrEqual(6);
    const road = (it: typeof itinerary) => it.segments.filter((s) => s.path).flatMap((s) => s.path!);
    for (const beast of animals!) {
      expect(beast.start).toBeGreaterThan(itinerary.start);
      expect(road(beast).at(-1)).toEqual(road(itinerary).at(-1));
      expect(beast.segments.at(-1)!.activity).toBe("rest");
    }
  }
});

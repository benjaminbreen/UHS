import { expect, it } from "vitest";
import { buildItinerary, dayPlan, itineraryAt } from "../src/core/itinerary";
import { memberRoutine } from "../src/world/v3/routines";
const path = (
  _from: { x: number; y: number },
  to: { x: number; y: number },
) => [to];
const it2 = buildItinerary(
  [
    {
      pos: { x: 1, y: 1 },
      activity: "draw-water",
      label: "The well",
      minutes: 8,
    },
    { pos: { x: 4, y: 1 }, activity: "tend", label: "The barley", minutes: 11 },
    { pos: { x: 0, y: 0 }, activity: "rest", label: "Home", minutes: 500 },
  ],
  360,
  path,
);
it("lists each errand once in order", () => {
  expect(it2).toBeTruthy();
  const plan = dayPlan(it2!, 8 * 3600);
  expect(plan.map((p) => p.label)).toEqual(["The well", "The barley"]);
  expect(plan.filter((p) => p.state === "now").length).toBeLessThanOrEqual(1);
  for (const p of plan) expect(p.minute).toBeGreaterThan(0);
});
it("advances the marker through the day", () => {
  const states = [6, 9, 12, 18, 23].map((h) =>
    dayPlan(it2!, h * 3600)
      .map((p) => p.state)
      .join(","),
  );
  expect(new Set(states).size).toBeGreaterThan(1);
});

it("puts the load in their hands on the way to it and not on the way back", () => {
  const carried = buildItinerary(
    [
      { pos: { x: 4, y: 1 }, activity: "tend", label: "The barley", minutes: 40, carry: "tool" },
      { pos: { x: 8, y: 1 }, activity: "haul", label: "The store", minutes: 10, carry: "grain" },
      { pos: { x: 0, y: 0 }, activity: "rest", label: "Home", minutes: 500 },
    ],
    360,
    (_from, to) => [to],
  )!;
  const hands = (h: number) => itineraryAt(carried, h * 3600).carry;
  const day = Array.from({ length: 24 }, (_, h) => hands(h));
  expect(day, "a tool goes out to the field").toContain("tool");
  expect(day, "and the crop comes off it").toContain("grain");
  expect(day, "hands are empty at some point").toContain(undefined);
});

it("walks a one-off errand once and keeps the day whole", () => {
  const base = [
    { pos: { x: 1, y: 1 }, activity: "draw-water" as const, label: "The well", minutes: 8 },
    { pos: { x: 4, y: 1 }, activity: "tend" as const, label: "The barley", minutes: 11 },
    { pos: { x: 0, y: 0 }, activity: "rest" as const, label: "Home", minutes: 500 },
  ];
  const day = buildItinerary(base, 360, path, 0, [
    { pos: { x: 9, y: 9 }, activity: "visit", label: "At the shrine", minutes: 60, part: "evening" },
  ])!;
  expect(day.period).toBeCloseTo(1440, 5);
  const visits = day.segments.filter((s) => !s.path && s.label === "At the shrine");
  expect(visits).toHaveLength(1);
  expect(visits[0].to - visits[0].from).toBe(60);
  expect(dayPlan(day, 8 * 3600).map((p) => p.label)).toContain("At the shrine");
});

it("gives children named play destinations and one daily water errand", () => {
  const home = { x: 0, y: 0 };
  const plan = {
    objects: [
      { kind: "well", name: "Irrigation well", pos: { x: 2, y: 0 } },
      { kind: "well", pos: { x: 80, y: 0 } },
      { kind: "well", pos: { x: 8, y: 0 } },
    ],
    plots: [],
    work: new Map([
      ["child", { home }],
      ["neighbour", { home: { x: 12, y: 0 } }],
    ]),
    gatherings: [{ x: 5, y: 5 }],
    solid: new Set<string>(),
    surface: new Map(),
  } as unknown as Parameters<typeof memberRoutine>[0];
  const stations = memberRoutine(plan, "seed", "child", home, 1400, true);
  expect(stations.filter((s) => s.activity === "play")).toHaveLength(3);
  expect(stations.filter((s) => s.activity === "play").every((s) => s.toward)).toBe(true);
  const water = stations.find((s) => s.label === "Sent for water")!;
  expect(Math.hypot(water.pos.x - 8, water.pos.y)).toBeLessThan(4);
  const day = buildItinerary(stations, 360, path)!;
  expect(day.segments.some((s) => s.label === "Walking to the open ground")).toBe(false);
  expect(day.segments.filter((s) => s.label === "Sent for water")).toHaveLength(1);
  expect(day.segments.filter((s) => s.activity === "play" && !s.path).length).toBeLessThan(24);
  expect(day.period).toBeCloseTo(1440, 5);
});

it("sends a child to an actual school once rather than a neighbour's house repeatedly", () => {
  const home = { x: 0, y: 0 };
  const plan = {
    objects: [], plots: [], places: [], work: new Map(), gatherings: [{ x: 5, y: 5 }], solid: new Set<string>(), surface: new Map(),
    venues: [{ venue: { kind: "school", label: "The school" }, pos: { x: 10, y: 0 } }],
  } as unknown as Parameters<typeof memberRoutine>[0];
  const stations = memberRoutine(plan, "seed", "child", home, 2000, true);
  const day = buildItinerary(stations, 360, path)!;
  expect(day.segments.filter((s) => s.label === "At school")).toHaveLength(1);
  expect(day.segments.find((s) => s.label === "At school")?.pos).toEqual({ x: 10, y: 0 });
  expect(day.segments.some((s) => s.label === "Walking to the school")).toBe(true);
  expect(day.segments.filter((s) => s.label === "Walking to the school").every((s) => s.activity === "visit")).toBe(true);
  expect(day.period).toBeCloseTo(1440, 5);
});

it("walks household errands once and keeps play spots out of mapped water", () => {
  const home = { x: 0, y: 0 };
  const surface = new Map<string, "water">();
  const plan = {
    objects: [{ kind: "well", pos: { x: 8, y: 0 } }], plots: [],
    work: new Map([["neighbour", { home: { x: 12, y: 0 } }]]),
    gatherings: [{ x: 5, y: 5 }], solid: new Set<string>(), surface,
  } as unknown as Parameters<typeof memberRoutine>[0];
  const first = memberRoutine(plan, "seed", "child", home, 1400, true)
    .find((s) => s.label === "Playing near home")!.pos;
  surface.set(`${first.x},${first.y}`, "water");
  const next = memberRoutine(plan, "seed", "child", home, 1400, true)
    .find((s) => s.label === "Playing near home")!.pos;
  expect(next).not.toEqual(first);
  const stations = memberRoutine(plan, "seed", "adult", home, 1400, false);
  const errand = stations.find((s) => s.part === "morning");
  expect(errand).toBeTruthy();
  const day = buildItinerary(stations, 360, path)!;
  expect(day.segments.filter((s) => s.label === errand!.label && !s.path)).toHaveLength(1);
  expect(day.period).toBeCloseTo(1440, 5);
});

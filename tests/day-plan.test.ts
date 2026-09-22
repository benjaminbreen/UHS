import { expect, it } from "vitest";
import { buildItinerary, dayPlan, itineraryAt } from "../src/core/itinerary";
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

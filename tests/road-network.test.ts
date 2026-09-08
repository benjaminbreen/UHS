import { expect, it } from "vitest";
import { planAccess, planRoad, type Sample } from "../src/world/v3/roads";
const dry: Sample = () => ({
  elevation: 0,
  moisture: 0.3,
  water: 50,
  kind: "river",
  snow: false,
});
const bounds = { x: -12, y: -12, w: 65, h: 65 };
const road = new Set(Array.from({ length: 41 }, (_, x) => `${x},0`));
it("connects access points with a short spur rather than a parallel trip to the center", () => {
  const r = planAccess(
    "field",
    { x: 32, y: 4 },
    dry,
    road,
    new Set(),
    new Set(),
    bounds,
  )!;
  expect(r).toBeDefined();
  expect(r.points[0]).toEqual({ x: 32, y: 4 });
  expect(r.points.length).toBeLessThanOrEqual(6);
  expect(road.has(`${r.points.at(-1)!.x},${r.points.at(-1)!.y}`)).toBe(true);
  expect(r.points.slice(0, -1).some((p) => road.has(`${p.x},${p.y}`))).toBe(
    false,
  );
});
it("reuses an existing corridor for nearby through routes", () => {
  const r = planRoad(
    "connection",
    { x: 0, y: 4 },
    { x: 40, y: 4 },
    dry,
    road,
    new Set(),
    new Set(),
    bounds,
    0,
    1,
    "review",
  )!;
  expect(r).toBeDefined();
  expect(
    r.points.filter((p) => road.has(`${p.x},${p.y}`)).length,
  ).toBeGreaterThan(25);
});
it("routes access around solid obstacles and does not cross unbridged water", () => {
  const solid = new Set(Array.from({ length: 5 }, (_, i) => `${30 + i},2`));
  const r = planAccess(
    "yard",
    { x: 32, y: 5 },
    dry,
    road,
    new Set(),
    solid,
    bounds,
  )!;
  expect(r).toBeDefined();
  expect(r.points.every((p) => !solid.has(`${p.x},${p.y}`))).toBe(true);
  const wet: Sample = (x, y) => ({ ...dry(x, y), water: y === 2 ? -3 : 50 });
  expect(
    planAccess(
      "blocked",
      { x: 32, y: 5 },
      wet,
      road,
      new Set(),
      new Set(),
      bounds,
    ),
  ).toBeUndefined();
  const bridge = new Set(["32,2"]);
  const crossing = planAccess(
    "crossing",
    { x: 32, y: 5 },
    wet,
    road,
    bridge,
    new Set(),
    bounds,
  )!;
  expect(crossing).toBeDefined();
  expect(crossing.points.filter((p) => p.y === 2)).toEqual([{ x: 32, y: 2 }]);
});

import { expect, it } from "vitest";
import { buildingModels } from "../src/content/graphics/models";
import {
  courtyardSun,
  type CourtyardLight,
} from "../src/render/courtyard-lighting";

it("publishes bounded, recessed courtyard surfaces without changing the exterior return", () => {
  let count = 0;
  for (const model of Object.values(buildingModels)) {
    const m = model as typeof model & {
      roofVoid?: number[];
      courtyardLight?: CourtyardLight;
      sideDepth?: number;
    };
    // The East Asian compound draws its court open, so it needs no recess.
    if (!m.roofVoid || model.frame.startsWith("eastasian-courtyard")) continue;
    count++;
    expect(m.sideDepth).toBe(12);
    expect(m.courtyardLight, model.frame).toBeDefined();
    const court = m.courtyardLight!;
    for (const polygon of [
      court.opening,
      court.floor,
      court.backWall,
      court.leftWall,
    ]) {
      expect(polygon).toHaveLength(4);
      const area = polygon.reduce((sum, [x, y], i) => {
        const next = polygon[(i + 1) % polygon.length];
        return sum + x * next[1] - y * next[0];
      }, 0);
      expect(Math.abs(area), model.frame).toBeGreaterThan(0);
      for (const [x, y] of polygon) {
        expect(x).toBeGreaterThanOrEqual(0);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThan(model.bounds[2]);
        expect(y).toBeLessThan(model.bounds[3]);
      }
    }
    expect(court.floor[3][1] - court.opening[3][1]).toBe(court.height);
    expect(court.floor[0][1]).toBeGreaterThan(court.floor[3][1]);
  }
  expect(count).toBeGreaterThan(30);
});

it("uses the same reversing sun direction as ground shadows, with no solar cast at night", () => {
  const model = buildingModels["roman-domus-roman-italian-medium-0"];
  const court = (model as unknown as { courtyardLight: CourtyardLight })
    .courtyardLight;
  const morning = courtyardSun(court, "morning");
  const noon = courtyardSun(court, "midday");
  const afternoon = courtyardSun(court, "afternoon");
  expect(morning.offset[0]).toBeLessThan(0);
  expect(afternoon.offset[0]).toBeGreaterThan(0);
  expect(Math.hypot(...noon.offset)).toBeLessThan(
    Math.hypot(...morning.offset),
  );
  expect(courtyardSun(court, "night")).toEqual({ offset: [0, 0], opacity: 0 });
});

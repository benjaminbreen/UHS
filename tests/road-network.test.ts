import { expect, it } from "vitest";
import { planAccess, planRoad, type Sample } from "../src/world/v3/roads";
import { createSettingSession } from "../src/runtime/session";
import { resolveSetting } from "../src/content/geography/resolve";
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
it("shifts a road away from a cliff lip instead of hugging the drop", () => {
  const cliff: Sample = (_x, y) => ({
    ...dry(0, y),
    elevation: y <= 0 ? 14 : 0,
  });
  const r = planRoad(
    "bench",
    { x: 0, y: 1 },
    { x: 30, y: 1 },
    cliff,
    new Set(),
    new Set(),
    new Set(),
    bounds,
    1,
    1,
  )!;
  expect(r).toBeDefined();
  const interior = r.points.filter((p) => p.x >= 4 && p.x <= 26);
  expect(interior.length).toBeGreaterThan(15);
  expect(interior.every((p) => p.y >= 2)).toBe(true);
});
it.runIf(!!process.env.FULL)("keeps motor-age blacktop roads free of paving-stone overlays and lengthwise cliffs", () => {
  const resolved = resolveSetting("A fisher in Bangkok, 2005");
  if (!("setting" in resolved)) throw new Error(resolved.error);
  const setting = {
    ...resolved.setting,
    settlement: "village" as const,
    settlementPattern: "roadside" as const,
    terraceRevision: 1 as const,
    roadRevision: 1 as const,
  };
  const { world, state } = createSettingSession(setting, "bangkok-road-fix");
  const topography = world.topography!;
  const cx = Math.round(state.player.pos.x);
  const cy = Math.round(state.player.pos.y);
  let blacktopCells = 0;
  let pavingOverBlacktop = 0;
  let cliffThroughRoad = 0;
  const isBlacktop = (x: number, y: number) =>
    !!topography(x, y).pathArt?.some((s) => s.paved && s.paved !== "gravel");
  for (let dy = -40; dy <= 40; dy++)
    for (let dx = -40; dx <= 40; dx++) {
      const x = cx + dx,
        y = cy + dy;
      const cell = topography(x, y);
      if (!isBlacktop(x, y) || cell.surface === "water" || cell.bridge) continue;
      blacktopCells++;
      if (cell.feature === "paving" && !cell.pavement) pavingOverBlacktop++;
      if (cell.ramp) continue;
      for (const [nx, ny] of [
        [x + 1, y],
        [x, y + 1],
      ]) {
        const next = topography(nx, ny);
        if (
          !isBlacktop(nx, ny) ||
          next.surface === "water" ||
          next.bridge ||
          next.ramp
        )
          continue;
        if (Math.abs(next.height - cell.height) > 1) cliffThroughRoad++;
      }
    }
  expect(blacktopCells).toBeGreaterThan(0);
  expect(pavingOverBlacktop).toBe(0);
  expect(cliffThroughRoad).toBe(0);
});

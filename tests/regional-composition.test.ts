import { it, expect } from "vitest";
import { settingFor } from "../src/content/geography/resolve";
import { places } from "../src/content/geography/places";
import { regionalLandforms } from "../src/world/v3/landforms";
import { createEnvironment } from "../src/world/v3/environment";
import { createSettingSession } from "../src/runtime/session";
import type { WorldSetting } from "../src/content/geography/types";
import type { SettlementWorld } from "../src/world/v3/generate";
const setting = (
  landform: NonNullable<WorldSetting["environment"]>["landform"] = "rolling",
  pattern: WorldSetting["settlementPattern"] = "clustered",
): WorldSetting => ({
  ...settingFor(places.find((p) => p.id === "konya")!, -6499),
  terrainRevision: 2,
  water: "river-ew",
  settlementPattern: pattern,
  environment: {
    ecology: "grassland",
    landform,
    population: pattern === "dense" ? "settled" : "sparse",
    start: "resident",
    household: "mixed",
  },
});
it("river reaches join across positive and negative boundaries regardless of cache order", () => {
  const s = setting(),
    a = regionalLandforms(s, "reach-check"),
    b = regionalLandforms(s, "reach-check");
  const nodes = [
    -65, -64, -63, -33, -32, -31, -1, 0, 1, 31, 32, 33, 63, 64, 65,
  ];
  const forward = nodes.map((n) => a.point(n));
  for (const n of [...nodes].reverse()) b.point(n);
  expect(nodes.map((n) => b.point(n))).toEqual(forward);
  for (let i = 0; i < 35; i++) a.point(i * 32);
  expect(a.reachCount()).toBeLessThanOrEqual(24);
  expect(nodes.map((n) => a.point(n))).toEqual(forward);
  for (let n = -65; n < 65; n++)
    expect(
      Math.abs(a.point(n + 1).across - a.point(n).across),
    ).toBeLessThanOrEqual(12);
});
it("the carved channel stays connected, descends along its course and has asymmetric margins", () => {
  const s = setting(),
    p = regionalLandforms(s, "water-check"),
    env = createEnvironment(s, "water-check");
  const widths = new Set<number>();
  let lastBed = Infinity;
  for (let n = -40; n < 40; n++) {
    const a = p.point(n),
      b = p.point(n + 1);
    for (let t = 0; t < 1; t += 0.125) {
      const along = a.along + t * (b.along - a.along),
        across = a.across + t * (b.across - a.across);
      const f = env.sample(Math.round(along), Math.round(across));
      expect(f.water).toBeLessThan(0);
      expect(f.elevation).toBe(0);
      const r = p.river(along, across);
      expect(r.bed).toBeLessThanOrEqual(lastBed);
      lastBed = r.bed;
    }
    widths.add(Math.round(p.river(a.along, a.across + 10).floodplain));
    widths.add(Math.round(p.river(a.along, a.across - 10).floodplain));
  }
  expect(widths.size).toBeGreaterThan(5);
});
for (const [seed, landform, pattern] of [
  ["ecology-01", "rolling", "clustered"],
  ["land-a124e201", "plain", "dense"],
  ["ridge-check", "ridge", "clustered"],
  ["basin-check", "basin", "clustered"],
] as const)
  it(`connects generated households on ${landform} terrain (${pattern})`, () => {
    const e = createSettingSession(setting(landform, pattern), seed),
      w = e.world as SettlementWorld;
    expect(e.state.households!.length).toBeGreaterThanOrEqual(
      pattern === "dense" ? 20 : 3,
    );
    for (const h of e.state.households!)
      expect(
        e.findRoute(e.state.player.pos, h.home).status,
        `${seed}: ${h.id}`,
      ).toBe("found");
    const p = w.planAt(e.state.player.pos.x, e.state.player.pos.y)!;
    expect(
      p.roads.some(
        (r) =>
          r.points.length > 20 &&
          new Set(r.points.map((p) => p.x)).size > 8 &&
          new Set(r.points.map((p) => p.y)).size > 8,
      ),
    ).toBe(true);
  });

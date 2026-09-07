import { it, expect } from "vitest";
import { createSettingSession } from "../src/runtime/session";
import { settingFor } from "../src/content/geography/resolve";
import { places } from "../src/content/geography/places";
const setting = {
  ...settingFor(places.find((p) => p.id === "konya")!, -6499),
  terrainRevision: 1 as const,
};
it("generates broad zones with limited slopes and reachable households", () => {
  const start = performance.now(),
    e = createSettingSession(setting, "anatolia-relief-1"),
    w = e.world;
  console.log("Anatolia generation ms", Math.round(performance.now() - start));
  let slopes = 0;
  const tiers = new Set(),
    depths = new Set(),
    biomes = new Set();
  for (let y = -45; y < 45; y++)
    for (let x = -45; x < 65; x++) {
      const c = w.topography!(x, y);
      tiers.add(c.height);
      biomes.add(c.biome);
      if (c.waterDepth) depths.add(c.waterDepth);
      if (c.ramp) slopes++;
    }
  console.log("slopes", slopes, "houses", w.places.length);
  expect([...tiers].sort()).toEqual([0, 1, 2]);
  expect(depths.size).toBe(2);
  expect(biomes.size).toBe(3);
  expect(slopes).toBeGreaterThan(0);
  expect(slopes).toBeLessThan(30);
  for (const p of w.places.filter((p) => Math.hypot(p.x, p.y) < 65))
    expect(e.findRoute(e.state.player.pos, p.entrance).status, p.id).toBe(
      "found",
    );
}, 30000);

it("accepts outdoor diagonal commands on flat relief terrain", () => {
  const e = createSettingSession(setting, "anatolia-relief-1");
  e.state.player.pos = { x: -10, y: -10, space: "outside" };
  for (const [dx, dy] of [
    [1, 1],
    [-1, -1],
    [-1, 1],
    [1, -1],
  ]) {
    const before = { ...e.state.player.pos };
    const result = e.act({
      actionId: `diagonal-${dx}-${dy}`,
      expectedRevision: e.state.revision,
      command: { type: "move", dx, dy },
    });
    expect(result.status).not.toBe("rejected");
    expect(e.state.player.pos).toEqual({
      ...before,
      x: before.x + dx,
      y: before.y + dy,
    });
  }
});

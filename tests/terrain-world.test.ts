import { it, expect } from "vitest";
import { createSettingSession, restoreSession } from "../src/runtime/session";
import { settingFor } from "../src/content/geography/resolve";
import { places } from "../src/content/geography/places";
import { stateHash } from "../src/core/random";
const setting = {
  ...settingFor(places.find((p) => p.id === "konya")!, -6499),
  terrainRevision: 1 as const,
};
it("terrain revision survives save and generates deterministic connected homes", () => {
  const e = createSettingSession(setting, "anatolia-relief-1"),
    w = e.world;
  expect(w.topography).toBeDefined();
  let slopes = 0,
    ledges = 0;
  const tiers = new Set(),
    water = new Set(),
    surfaces = new Set();
  for (let y = -50; y < 50; y += 2)
    for (let x = -60; x < 70; x += 2) {
      const c = w.topography!(x, y);
      for (const [dx, dy] of [
        [1, 0],
        [0, 1],
      ]) {
        const to = { x: x + dx, y: y + dy },
          next = w.topography!(to.x, to.y);
        if (
          c.height !== next.height &&
          c.surface !== "water" &&
          next.surface !== "water"
        ) {
          if (w.canCross!({ x, y }, to)) slopes++;
          else ledges++;
        }
      }
      tiers.add(c.height);
      surfaces.add(c.surface);
      if (c.waterDepth) water.add(c.waterDepth);
    }
  expect([...tiers].sort()).toEqual([0, 1, 2]);
  expect(water.size).toBe(2);
  expect(slopes).toBeGreaterThan(0);
  expect(ledges).toBeGreaterThan(0);
  expect(surfaces.size).toBeGreaterThanOrEqual(4);
  for (const p of w.places)
    expect(e.findRoute(e.state.player.pos, p.entrance).status, p.id).toBe(
      "found",
    );
  const snap = e.snapshot();
  const restored = restoreSession(snap);
  expect(stateHash(restored.snapshot())).toBe(stateHash(snap));
  restored.world.chunk(1, 0);
  expect(restored.world.chunk(-1, 0)).toEqual(w.chunk(-1, 0));
  expect(restored.world.topography!(-32, 0)).toEqual(w.topography!(-32, 0));
}, 60000);
it("existing v3 settings retain flat generation", () => {
  const { terrainRevision, ...old } = setting;
  expect(
    createSettingSession(old, "anatolia-relief-1").world.topography,
  ).toBeUndefined();
});

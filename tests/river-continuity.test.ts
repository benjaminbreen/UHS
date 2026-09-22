import { expect, it, vi } from "vitest";
import type { WorldSetting } from "../src/content/geography/types";
import type { RegionalContext } from "../src/world/regional/context";
vi.mock("../src/world/geography/atlas", () => ({
  toAtlas: () => ({ x: 0, y: 0 }),
  atlasSample: (x: number, y: number) => {
    const north = Math.hypot(x, Math.max(0, y));
    const east = Math.hypot(Math.min(0, x), y);
    return {
      coast: 1000,
      river: Math.min(north, east),
      riverFlow: north < east ? [0, 1] : [1, 0],
    };
  },
}));
import { createEnvironment } from "../src/world/v3/environment";
it("keeps a river connected where the nearest atlas segment changes direction", () => {
  const setting = {
    lon: 0,
    lat: 0,
    relief: 0.2,
    water: "none",
    geographyMode: "earth",
    hydrologyRevision: 2,
    environment: { ecology: "tropical-woodland", landform: "plain" },
  } as WorldSetting;
  const regional = {
    settingAt: () => setting,
    reliefAt: () => 0.2,
    featureAt: () => undefined,
    // Woodland, not swamp: the swamp colorway floods the channel on purpose,
    // and this test is about the river staying connected without it.
    habitatAt: () => setting.environment,
  } as unknown as RegionalContext;
  for (const seed of ["borneo", "river-turn", "swamp-review"]) {
    const land = createEnvironment(setting, seed, regional);
    const wet = new Set<string>();
    for (let y = -45; y <= 35; y++)
      for (let x = -35; x <= 45; x++)
        if (land.mainWater(x, y).water < 0) wet.add(`${x},${y}`);
    const pending = [[...wet][0]];
    wet.delete(pending[0]);
    while (pending.length) {
      const [x, y] = pending.pop()!.split(",").map(Number);
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const key = `${x + dx},${y + dy}`;
        if (wet.delete(key)) pending.push(key);
      }
    }
    expect(wet.size).toBe(0);
  }
});

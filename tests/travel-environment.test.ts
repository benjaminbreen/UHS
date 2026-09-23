import { describe, expect, it } from "vitest";
import {
  resolveMapEnvironment,
  settingForTravelStop,
} from "../src/world/travel/environment";
import { cellAt, describeCell } from "../src/world/travel/geography";
import { createRegionalContext } from "../src/world/regional/context";
import { createEnvironment } from "../src/world/v3/environment";
import type { TravelStop } from "../src/world/travel/types";
function prepare(lon: number, lat: number, year = 1300) {
  const environment = resolveMapEnvironment({ lon, lat }, year);
  const stop: TravelStop = {
    ...describeCell(cellAt({ lon, lat }), year),
    environment,
    name: "Environment check",
    settlement: "none",
    reason: "test",
    km: 0,
    pathIndex: 0,
    size: 640,
    note: "",
  };
  const setting = settingForTravelStop(stop, year),
    region = createRegionalContext(setting),
    terrain = createEnvironment(setting, "environment-check", region);
  return { environment, setting, region, terrain };
}
describe("shared travel environment", () => {
  it("keeps dry previews and regional terrain in the same desert envelope", () => {
    // The Qaidam basin, not the Qinghai steppe east of it: the Koppen map
    // has that as cold steppe, which is grassland, not desert.
    for (const [lon, lat] of [
      [94.5, 37.5],
      [60, 38],
      [130, -25],
      [15, 25],
    ]) {
      const { environment, setting, region, terrain } = prepare(lon, lat);
      expect(environment.climate).toBe("arid");
      expect(setting.environment?.ecology).toBe("desert");
      for (const [x, y] of [
        [0, 0],
        [100, 100],
      ]) {
        expect(region.settingAt(x, y).environment?.ecology).toBe("desert");
        expect(terrain.sample(x, y).moisture).toBeLessThan(0.4);
      }
    }
  });
  it("can surround a small island on all four sides without a one-sided coast recipe", () => {
    const { setting, terrain } = prepare(-2.13, 49.21);
    expect(setting.water).toBe("none");
    expect(setting.geographyMode).toBe("earth");
    expect(terrain.sample(0, 0).water).toBeGreaterThan(0);
    for (let t = -320; t <= 320; t += 40)
      for (const [x, y] of [
        [-320, t],
        [320, t],
        [t, -320],
        [t, 320],
      ])
        expect(terrain.sample(x, y).water).toBeLessThan(0);
  });
  it("keeps temperate land and large-island interiors as land", () => {
    for (const [lon, lat] of [
      [-0.1, 51.5],
      [-18.5, 65],
    ]) {
      const { environment, setting, terrain } = prepare(lon, lat);
      expect(environment.surface).toBe("land");
      expect(setting.climate).toBe(environment.climate);
      expect(terrain.sample(0, 0).water).toBeGreaterThan(0);
    }
  });
  it("resolves polar metadata without extending the playable latitude schema", () => {
    expect(resolveMapEnvironment({ lon: 0, lat: -89 }, 1300).climate).toBe(
      "tundra",
    );
    expect(prepare(-0.1, 51.5, -15000).environment.climate).toBe("tundra");
  });
});

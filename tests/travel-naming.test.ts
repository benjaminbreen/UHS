import { describe, expect, it } from "vitest";
import { physicalRegions } from "../src/content/geography/travel/generated";
import { resolveGeographicName } from "../src/world/travel/naming";

describe("global geographic names", () => {
  it("preserves source identities and covers every continent", () => {
    expect(new Set(physicalRegions.map((r) => r.id)).size).toBe(
      physicalRegions.length,
    );
    expect(physicalRegions.length).toBeGreaterThan(1300);
    for (const p of [
      { lon: 30, lat: 50 },
      { lon: 114, lat: 0 },
      { lon: 151, lat: -33 },
      { lon: -70, lat: -15 },
      { lon: 20, lat: 5 },
      { lon: -100, lat: 40 },
      { lon: 0, lat: -89 },
    ]) {
      const n = resolveGeographicName(p, false);
      expect(n.coverage).not.toBe("missing");
      expect(n.name.length).toBeLessThanOrEqual(34);
      expect(n.regionId).toBeTruthy();
    }
  });
  it("uses local polygon membership rather than the nearest famous feature", () => {
    const borneo = resolveGeographicName({ lon: 114, lat: 0 }, false);
    const sea = resolveGeographicName({ lon: 119, lat: 0 }, true);
    expect(borneo.name).toContain("Borneo");
    expect(sea.name).not.toContain("Borneo lowland");
    expect(
      resolveGeographicName({ lon: 20, lat: 49 }, false).name,
    ).not.toContain("Alps");
    expect(resolveGeographicName({ lon: 180, lat: 0 }, true)).toEqual(
      resolveGeographicName({ lon: -180, lat: 0 }, true),
    );
  });
});

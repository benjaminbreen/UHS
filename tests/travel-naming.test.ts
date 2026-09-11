import { describe, expect, it } from "vitest";
import { physicalRegions } from "../src/content/geography/travel/generated";
import { resolveGeographicName } from "../src/world/travel/naming";
import { auditNaming } from "../src/world/travel/naming-audit";
import { planTravel } from "../src/world/travel/routing";
import {
  travelLocations,
  travelPresets,
} from "../src/content/geography/travel";

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
  it("audits globally and makes remaining source gaps explicit", () => {
    const a = auditNaming();
    expect(a.samples.length).toBeGreaterThan(3000);
    expect(a.counts.specific + a.counts.broad + a.counts.missing).toBe(
      a.samples.length,
    );
    const land = a.samples.filter((s) => !s.water);
    expect(
      land.filter((s) => s.coverage === "missing").length / land.length,
    ).toBeLessThan(0.02);
    expect(a.samples.every((s) => s.name.length <= 34)).toBe(true);
    expect(a.samples.some((s) => s.regionId?.startsWith("resolve:"))).toBe(
      true,
    );
  });
  it("names unrelated global routes without asserting undated cities", () => {
    for (const [from, to] of [
      ["Kyiv", "Florence"],
      ["Borneo", "Sydney"],
      ["Lima", "Quito"],
      ["Lagos", "Nairobi"],
    ]) {
      const a = travelLocations.find((p) => p.name === from)!,
        b = travelLocations.find((p) => p.name === to)!;
      expect(a).toBeTruthy();
      expect(b).toBeTruthy();
      const r = planTravel({
        ...travelPresets.britain,
        from: a.id,
        to: b.id,
        via: [],
        mode: "mixed",
        spacing: 450,
      });
      expect(
        r.stops.every(
          (s) => s.name !== "Open countryside" && !s.name.endsWith(" area"),
        ),
      ).toBe(true);
      expect(new Set(r.stops.map((s) => s.name)).size).toBeGreaterThan(1);
      expect(
        r.stops.filter((s) => s.naming.coverage === "missing").length,
      ).toBeLessThan(3);
    }
  });
});

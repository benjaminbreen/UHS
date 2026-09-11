import { waterRegion } from "../src/content/geography/travel/oceans";
import { northAmericanLandscape } from "../src/content/geography/travel/north-american-landscapes";
import { describe, expect, it } from "vitest";
import {
  authoredTravel,
  locationName,
  settlementAt,
  travelById,
  travelLocations,
  travelPresets,
} from "../src/content/geography/travel";
import {
  cellPoint,
  describeCell,
  neighborsOf,
  snapCell,
} from "../src/world/travel/geography";
import {
  edgeOpen,
  findTravelPath,
  planTravel,
} from "../src/world/travel/routing";
describe("geographic travel foundation", () => {
  it("has unique stable catalog IDs and short authored names", () => {
    expect(new Set(travelLocations.map((p) => p.id)).size).toBe(
      travelLocations.length,
    );
    for (const p of authoredTravel)
      expect(p.name.length).toBeLessThanOrEqual(34);
  });
  it("keeps Oxford geography without asserting the town in prehistory", () => {
    const p = travelById.get("oxford")!;
    expect(settlementAt(p, 1300)).toBe("town");
    expect(settlementAt(p, -4999)).toBe("unresearched");
    expect(locationName(p, -4999)).toBe("Upper Thames valley");
    const medieval = planTravel(travelPresets.britain),
      early = planTravel({ ...travelPresets.britain, year: -4999 });
    expect(early.cells.map((c) => c.id)).toEqual(
      medieval.cells.map((c) => c.id),
    );
    expect(early.stops.map((c) => c.id)).toEqual(
      medieval.stops.map((c) => c.id),
    );
    expect(early.stops.some((s) => s.name === "Oxford")).toBe(false);
  });
  it("routes requested stops through reciprocal, traversable neighbors", () => {
    const r = planTravel(travelPresets.britain);
    expect(
      r.stops
        .filter((s) => s.reason === "Requested destination")
        .map((s) => s.locationId),
    ).toEqual(["london", "western-thames", "oxford", "edinburgh"]);
    for (let i = 1; i < r.cells.length; i++) {
      const a = r.cells[i - 1].id,
        b = r.cells[i].id;
      expect(neighborsOf(a)).toContain(b);
      expect(neighborsOf(b)).toContain(a);
      expect(edgeOpen(a, b, "land")).toBe(true);
    }
    const back = planTravel({
      ...travelPresets.britain,
      from: "edinburgh",
      to: "london",
      via: [...travelPresets.britain.via].reverse(),
    });
    expect(back.cells.map((c) => c.id)).toEqual(
      r.cells.map((c) => c.id).reverse(),
    );
  });
  it("changes compression without rerouting or losing waypoints", () => {
    const compact = planTravel({ ...travelPresets.battuta, spacing: 900 }),
      detailed = planTravel({ ...travelPresets.battuta, spacing: 180 });
    expect(detailed.stops.length).toBeGreaterThan(compact.stops.length);
    expect(detailed.cells.map((c) => c.id)).toEqual(
      compact.cells.map((c) => c.id),
    );
    for (const id of travelPresets.battuta.via)
      expect(compact.stops.some((s) => s.locationId === id)).toBe(true);
    expect(
      compact.stops.filter((s) => s.settlement === "none").length,
    ).toBeGreaterThan(5);
  });
  it("has polar addresses and does not invent a walkable Iceland–Britain connection", () => {
    const a = snapCell(travelById.get("area-iceland")!, "land"),
      b = snapCell(travelById.get("edinburgh")!, "land");
    expect(() => findTravelPath(a, b, "land")).toThrow(/No land/);
    const sea = planTravel(travelPresets.iceland);
    expect(sea.cells.every((c) => c.water)).toBe(true);
    const polar = snapCell({ lon: 0, lat: -89 }, "land");
    expect(cellPoint(polar).lat).toBeLessThan(-85);
    expect(describeCell(polar, -4999).name).toBe("Antarctic Plateau");
  });
  it("crosses oceans with reciprocal paths and retained boat transfers", () => {
    const query = {
      ...travelPresets.britain,
      from: "city-matamoros",
      to: "city-dalian",
      via: [],
      mode: "mixed" as const,
      spacing: 1200,
    };
    const route = planTravel(query);
    expect(route.km).toBeGreaterThan(10000);
    expect(route.cells[0].water).toBe(false);
    expect(route.cells.at(-1)!.water).toBe(false);
    expect(route.cells.some((c) => c.water)).toBe(true);
    for (let i = 1; i < route.cells.length; i++) {
      const a = route.cells[i - 1],
        b = route.cells[i];
      expect(neighborsOf(a.id)).toContain(b.id);
      expect(edgeOpen(a.id, b.id, "mixed")).toBe(true);
      if (a.water !== b.water) {
        expect(route.stops.some((s) => s.pathIndex === i - 1)).toBe(true);
        expect(route.stops.some((s) => s.pathIndex === i)).toBe(true);
        const coast = route.stops.find(
          (s) => s.pathIndex === (b.water ? i - 1 : i),
        );
        expect(coast?.transition).toBe(b.water ? "embark" : "disembark");
      }
    }
    const back = planTravel({ ...query, from: query.to, to: query.from });
    expect(back.cells.map((c) => c.id)).toEqual(
      route.cells.map((c) => c.id).reverse(),
    );
    expect(back.stops.filter((s) => s.transition).map((s) => s.id)).toEqual(
      route.stops
        .filter((s) => s.transition)
        .map((s) => s.id)
        .reverse(),
    );
  });
  it("keeps an inland journey on land and connects Iceland in mixed mode", () => {
    const inland = planTravel({
      ...travelPresets.britain,
      to: "oxford",
      via: [],
      mode: "mixed",
    });
    expect(inland.cells.every((c) => !c.water)).toBe(true);
    const island = planTravel({ ...travelPresets.iceland, mode: "mixed" });
    expect(island.stops.some((s) => s.transition === "embark")).toBe(true);
    expect(island.stops.some((s) => s.transition === "disembark")).toBe(true);
  });
  it("compresses the Atlantic separately while naming southern US landscapes", () => {
    const r = planTravel({
      ...travelPresets.britain,
      from: "london",
      to: "city-el-paso",
      spacing: 180,
      via: [],
      mode: "mixed",
    });
    expect(r.stops.length).toBeGreaterThanOrEqual(20);
    expect(r.stops.length).toBeLessThanOrEqual(35);
    expect(r.stops.filter((s) => s.water).length).toBeLessThanOrEqual(6);
    expect(
      new Set(r.stops.filter((s) => s.water).map((s) => s.name)).size,
    ).toBeGreaterThanOrEqual(3);
    const us = r.stops.filter((s) => !s.water && s.lon < -75 && !s.locationId);
    expect(us.every((s) => s.name !== "Open countryside")).toBe(true);
    expect(us.some((s) => s.name === "Chihuahuan Desert")).toBe(true);
    expect(us.some((s) => s.name === "Piney Woods")).toBe(true);
    expect(us.some((s) => s.name === "Ozark uplands")).toBe(false);
    expect(northAmericanLandscape({ lon: -93, lat: 37 })?.id).toBe("ozarks");
  });
  it("applies ocean spacing in all five basins independent of land spacing", () => {
    const cases = [
      ["atlantic", { lon: -50, lat: 35 }, { lon: -15, lat: 35 }],
      ["pacific", { lon: 160, lat: 20 }, { lon: -120, lat: 20 }],
      ["indian", { lon: 55, lat: -25 }, { lon: 105, lat: -25 }],
      ["arctic", { lon: -120, lat: 80 }, { lon: 120, lat: 80 }],
      ["southern", { lon: -20, lat: -63 }, { lon: 90, lat: -63 }],
    ] as const;
    for (const [basin, from, to] of cases) {
      expect(waterRegion(from).id).toContain(basin);
      const a = `test-${basin}-a`,
        b = `test-${basin}-b`;
      for (const [id, point] of [
        [a, from],
        [b, to],
      ] as const)
        travelById.set(id, {
          ...point,
          id,
          name: id,
          landscape: id,
          kind: "landscape",
          importance: 0,
        });
      try {
        const query = {
          ...travelPresets.britain,
          from: a,
          to: b,
          via: [],
          mode: "sea" as const,
        };
        const dense = planTravel({ ...query, spacing: 60 }),
          sparse = planTravel({ ...query, spacing: 1200 });
        expect(dense.stops.map((s) => s.id)).toEqual(
          sparse.stops.map((s) => s.id),
        );
        expect(dense.stops.length).toBeLessThan(15);
        expect(dense.cells.length).toBeGreaterThan(dense.stops.length * 3);
      } finally {
        travelById.delete(a);
        travelById.delete(b);
      }
    }
  });
  it("rejects invalid inputs rather than substituting a route", () => {
    expect(() =>
      planTravel({ ...travelPresets.britain, from: "missing" }),
    ).toThrow("Unknown location");
    expect(() => planTravel({ ...travelPresets.britain, year: NaN })).toThrow(
      "year",
    );
    expect(() => planTravel({ ...travelPresets.britain, spacing: 0 })).toThrow(
      "spacing",
    );
  });
});

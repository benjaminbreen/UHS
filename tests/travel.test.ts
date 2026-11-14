import { waterRegion } from "../src/content/geography/travel/oceans";
import { northAmericanLandscape } from "../src/content/geography/travel/north-american-landscapes";
import { describe, expect, it } from "vitest";
import {
  authoredTravel,
  locationName,
  settlementAt,
  travelLocations,
} from "../src/content/geography/travel";
import {
  cellPoint,
  describeCell,
  neighborsOf,
  snapCell,
} from "../src/world/travel/geography";
import { edgeOpen, findTravelPath } from "../src/world/travel/routing";
const place = (id: string) => travelLocations.find((p) => p.id === id)!;
describe("geographic travel foundation", () => {
  it("has unique stable catalog IDs and short authored names", () => {
    expect(new Set(travelLocations.map((p) => p.id)).size).toBe(
      travelLocations.length,
    );
    for (const p of authoredTravel)
      expect(p.name.length).toBeLessThanOrEqual(34);
  });
  it("keeps Oxford geography without asserting the town in prehistory", () => {
    const p = place("oxford");
    expect(settlementAt(p, 1300)).toBe("town");
    expect(settlementAt(p, -4999)).toBe("unresearched");
    expect(locationName(p, -4999)).toBe("Upper Thames valley");
  });
  it("routes through reciprocal, traversable neighbors", () => {
    const a = snapCell(place("london"), "land"),
      b = snapCell(place("edinburgh"), "land");
    const { path } = findTravelPath(a, b, "land");
    for (let i = 1; i < path.length; i++) {
      expect(neighborsOf(path[i - 1])).toContain(path[i]);
      expect(neighborsOf(path[i])).toContain(path[i - 1]);
      expect(edgeOpen(path[i - 1], path[i], "land")).toBe(true);
    }
    expect(findTravelPath(b, a, "land").path).toEqual([...path].reverse());
  });
  it("has polar addresses and does not invent a walkable Iceland–Britain connection", () => {
    const a = snapCell(place("area-iceland"), "land"),
      b = snapCell(place("edinburgh"), "land");
    expect(() => findTravelPath(a, b, "land")).toThrow(/No land/);
    const polar = snapCell({ lon: 0, lat: -89 }, "land");
    expect(cellPoint(polar).lat).toBeLessThan(-85);
    expect(describeCell(polar, -4999).name).toBe("Antarctic Plateau");
  });
  it("names all five ocean basins and North American landscapes", () => {
    for (const [basin, p] of [
      ["atlantic", { lon: -50, lat: 35 }],
      ["pacific", { lon: 160, lat: 20 }],
      ["indian", { lon: 55, lat: -25 }],
      ["arctic", { lon: -120, lat: 80 }],
      ["southern", { lon: -20, lat: -63 }],
    ] as const)
      expect(waterRegion(p).id).toContain(basin);
    expect(northAmericanLandscape({ lon: -93, lat: 37 })?.id).toBe("ozarks");
  });
});

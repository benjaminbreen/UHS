import { expect, it } from "vitest";
import { permanentExits } from "../src/world/travel/network";
import { boundarySample, type BoundarySeam } from "../src/world/travel/seams";
function point(seam: BoundarySeam, size: number, t: number) {
  const u = seam.start + (seam.end - seam.start) * t,
    a = -size / 2 + u * (size - 1);
  return seam.side === "N"
    ? [a, -size / 2]
    : seam.side === "S"
      ? [a, size / 2 - 1]
      : seam.side === "W"
        ? [-size / 2, a]
        : [size / 2 - 1, a];
}
it("shares shoreline, river and road profiles in both directions and across map sizes", () => {
  for (const id of [
    "place:city-san-diego",
    "place:london",
    "place:city-butembo",
  ]) {
    for (const exit of permanentExits(id, 1300).filter((e) => e.seam)) {
      const back = permanentExits(exit.to, 1300).find((e) => e.id === exit.id)!;
      expect(back.seam!.water).toEqual(exit.seam!.water);
      for (const t of [0.1, 0.3, 0.5, 0.7, 0.9, exit.seam!.roadAt]) {
        const a = point(exit.seam!, 304, t),
          b = point(back.seam!, 384, t);
        const one = boundarySample(304, [exit.seam!], a[0], a[1])!;
        const two = boundarySample(384, [back.seam!], b[0], b[1])!;
        expect(one.water).toBeCloseTo(two.water, 6);
        expect(one.height).toBeCloseTo(two.height, 6);
        expect(one.kind).toEqual(two.kind);
        // Only an overland crossing carries a road; a shore seam is open water.
        if (t === exit.seam!.roadAt && exit.seam!.road) {
          expect(one.road).toBe(true);
          expect(two.road).toBe(true);
        }
        if (!exit.seam!.road) {
          expect(one.kind).toBe("sea");
          expect(one.water).toBeLessThan(0);
        }
      }
      expect(boundarySample(304, [exit.seam!], 0, 0)).toBeUndefined();
    }
  }
});

it("ends a boat crossing in open water inside the map, not at a bare edge", async () => {
  const { mapForCoordinate, permanentMap, permanentExits } = await import(
    "../src/world/travel/network"
  );
  const { travelSetting } = await import("../src/runtime/map-travel");
  const { createSettlementWorld } = await import("../src/world/v3/generate");
  const { packForSetting } = await import("../src/content/geography/pack");
  const id = mapForCoordinate({ lon: -77.3, lat: 18.1 });
  const map = permanentMap(id, 2021),
    exits = permanentExits(id, 2021);
  const shores = exits.filter((e) => e.mode !== "land");
  expect(shores.length).toBeGreaterThan(0);
  for (const e of shores) expect(e.seam!.sea.every(Boolean)).toBe(true);
  const world = createSettlementWorld(
    packForSetting(travelSetting(map, exits, 2021)),
    "seam-shore",
  );
  // Each exit owns only a segment of its side, so sample that segment's centre.
  for (const e of shores) {
    const [x, y] = point(e.seam!, map.size, 0.5);
    expect(world.terrain(x, y), `${e.seam!.side} ${e.to}`).toBe("water");
  }
  expect(world.terrain(0, 0)).not.toBe("water");
}, 120000);

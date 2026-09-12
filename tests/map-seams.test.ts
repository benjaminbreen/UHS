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

const portrait = async (id: string, year: number) => {
  const { permanentMap, permanentExits } = await import(
    "../src/world/travel/network"
  );
  const { travelSetting } = await import("../src/runtime/map-travel");
  const { createSettlementWorld } = await import("../src/world/v3/generate");
  const { packForSetting } = await import("../src/content/geography/pack");
  const map = permanentMap(id, year),
    exits = permanentExits(id, year);
  const setting = travelSetting(map, exits, year);
  const world = createSettlementWorld(
    packForSetting(setting),
    "portrait:" + id,
  );
  const half = map.size / 2;
  const edgeLand = (dx: number, dy: number) => {
    let land = 0,
      total = 0;
    for (let t = -half; t < half; t += 8) {
      total++;
      const x = dx ? dx * (half - 1) : t,
        y = dy ? dy * (half - 1) : t;
      if (world.terrain(x, y) !== "water") land++;
    }
    return land / total;
  };
  return { map, exits, setting, world, edgeLand };
};

it("draws a small island as an island, with sea on every border", async () => {
  const { setting, exits, world, edgeLand } = await portrait(
    "place:city-san-juan",
    -1975,
  );
  expect(setting.water).toBe("island");
  expect(world.terrain(0, 0)).not.toBe("water");
  for (const [dx, dy] of [
    [0, -1],
    [0, 1],
    [1, 0],
    [-1, 0],
  ])
    expect(edgeLand(dx, dy), `${dx},${dy}`).toBe(0);
  // Its coast closes the map, so leaving it is a boat crossing.
  expect(exits.every((e) => e.seam!.walkable === 0)).toBe(true);
}, 120000);

it("draws open water as open water, and never as a land bridge", async () => {
  const { mapForCoordinate } = await import("../src/world/travel/network");
  const id = mapForCoordinate({ lon: 114.63, lat: 20.9 });
  const { setting, exits, world, edgeLand } = await portrait(id, -996);
  expect(setting.water).toBe("ocean");
  expect(world.terrain(0, 0)).toBe("water");
  // Neighbours are mainland China, Hainan and Luzon, hundreds of km apart.
  // None of them may lend this map a coastline.
  for (const [dx, dy] of [
    [0, -1],
    [0, 1],
    [1, 0],
    [-1, 0],
  ])
    expect(edgeLand(dx, dy), `${dx},${dy}`).toBe(0);
  expect(exits.every((e) => e.seam!.walkable === 0)).toBe(true);
}, 120000);

it("keeps a continental map walkable out of every land border", async () => {
  const { exits, edgeLand, setting } = await portrait("place:london", 1400);
  expect(setting.geographyMode).toBe("earth");
  expect(exits.filter((e) => e.seam!.walkable > 0).length).toBeGreaterThan(0);
  expect(edgeLand(0, -1)).toBeGreaterThan(0);
}, 120000);

it("pairs every walkable exit with a walkable arrival", async () => {
  const { permanentMap, permanentExits } = await import(
    "../src/world/travel/network"
  );
  const { travelSetting } = await import("../src/runtime/map-travel");
  const { createSettlementWorld } = await import("../src/world/v3/generate");
  const { packForSetting } = await import("../src/content/geography/pack");
  const year = 1400;
  const build = (id: string) => {
    const map = permanentMap(id, year),
      exits = permanentExits(id, year);
    return createSettlementWorld(
      packForSetting(travelSetting(map, exits, year)),
      "pair:" + id,
    );
  };
  const out = build("place:london").entrances!().filter((e) => e.walkable);
  expect(out.length).toBeGreaterThan(0);
  for (const e of out) {
    const back = build(e.to).entrances!().find((x) => x.id === e.id);
    expect(back?.walkable, `${e.seam?.side} -> ${e.to}`).toBe(true);
    expect(back!.path.length).toBeGreaterThan(1);
  }
}, 300000);

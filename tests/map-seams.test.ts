import { expect, it } from "vitest";
import { mapForCoordinate } from "../src/world/travel/network";
const london = mapForCoordinate({ lon: -0.12, lat: 51.5 });
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

it("draws open water as open water, and never as a land bridge", async () => {
  const { mapForCoordinate } = await import("../src/world/travel/network");
  const id = mapForCoordinate({ lon: 114.63, lat: 20.9 });
  const { setting, exits, world, edgeLand } = await portrait(id, -996);
  expect(setting.water).toBe("ocean");
  expect(world.terrain(0, 0)).toBe("water");
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
  const { exits, edgeLand, setting } = await portrait(london, 1400);
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
  const out = build(london).entrances!().filter((e) => e.walkable);
  expect(out.length).toBeGreaterThan(0);
  for (const e of out) {
    const back = build(e.to).entrances!().find((x) => x.id === e.id);
    expect(back?.walkable, `${e.seam?.side} -> ${e.to}`).toBe(true);
    expect(back!.path.length).toBeGreaterThan(1);
  }
}, 300000);

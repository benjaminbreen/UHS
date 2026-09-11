import { expect, it } from "vitest";
import {
  permanentMap,
  permanentExits,
  mapForCoordinate,
  connectionPath,
} from "../src/world/travel/network";
import { mapEntrances } from "../src/world/travel/entrances";
import type { WorldModel } from "../src/core/types";
it("keeps identities and reciprocal exits across dates and independent inspections", () => {
  const a = permanentMap("place:london", 1300),
    old = permanentMap("place:london", -5000);
  expect(a.size).toBe(512);
  expect(old.size).toBe(384);
  expect(a.networkId).toBe(old.networkId);
  const exits = permanentExits(a.networkId, 1300);
  expect(exits.length).toBeGreaterThan(0);
  for (const e of exits)
    expect(
      permanentExits(e.to, -5000).some(
        (back) => back.id === e.id && back.to === a.networkId,
      ),
    ).toBe(true);
  permanentExits(mapForCoordinate({ lon: 140, lat: -25 }), 2000);
  expect(permanentExits(a.networkId, 1300)).toEqual(exits);
  expect(permanentMap("place:oxford", 1300).size).toBe(384);
});
it("covers oceans, polar landscapes and arbitrary land without authored corridors", () => {
  for (const [lon, lat] of [
    [-30, 20],
    [160, -20],
    [75, 0],
    [0, -89],
    [-20, 65],
    [115, 0],
  ]) {
    const id = mapForCoordinate({ lon, lat });
    expect(permanentExits(id, 1300).length).toBeGreaterThan(0);
    expect(permanentMap(id, 1300).size).toBe(384);
  }
});
it("retains the same geographic path on a return connection", () => {
  const e = permanentExits("place:london", 1300).find(
    (e) => e.mode === "land",
  )!;
  const back = permanentExits(e.to, 1300).find((x) => x.id === e.id)!;
  expect(connectionPath(e)).toEqual(connectionPath(back).reverse());
});
it("places entrances on reachable boundaries and exposes blocked connections", () => {
  const world = {
    spawn: { x: 0, y: 0 },
    terrain: () => "grass",
    blocked: (x: number, _y: number) => x === 1,
    canCross: () => true,
  } as unknown as WorldModel;
  const exits = [{ id: "a~b", to: "b", bearing: "W", mode: "land" }];
  const [e] = mapEntrances(world, 16, exits);
  expect(e.point?.x).toBe(-8);
  expect(e.path[0]).toEqual({ x: 0, y: 0 });
  expect(e.path.at(-1)).toEqual(e.point);
  expect(e.path.every((p) => p.x < 1)).toBe(true);
  const boxed = {
    ...world,
    blocked: (x: number, y: number) => Math.abs(x) + Math.abs(y) > 0,
  };
  expect(mapEntrances(boxed, 16, exits)[0].point).toBeUndefined();
});

it("bounds the existing generator without changing the underlying Earth terrain", async () => {
  const { settingForTravelStop } = await import(
    "../src/world/travel/environment"
  );
  const { createSettlementWorld } = await import("../src/world/v3/generate");
  const { packForSetting } = await import("../src/content/geography/pack");
  const map = permanentMap("place:london", -5000);
  const setting = settingForTravelStop(map, -5000);
  setting.playableMap = { id: map.networkId, size: 384, exits: [] };
  setting.environment!.population = "none";
  setting.environment!.start = "wanderer";
  const world = createSettlementWorld(packForSetting(setting), "bounded-check");
  expect(world.blocked(192, 0, "outside")).toBe(true);
  expect(world.blocked(-193, 0, "outside")).toBe(true);
  expect(world.canCross?.({ x: 191, y: 0 }, { x: 192, y: 0 })).toBe(false);
  expect(Math.abs(world.spawn.x)).toBeLessThan(192);
  expect(Math.abs(world.spawn.y)).toBeLessThan(192);
  expect(world.settlements).toHaveLength(0);
  expect(world.decoration(5000, 5000)).toBeUndefined();
  expect(world.prepare().plans).toHaveLength(0);
}, 30000);

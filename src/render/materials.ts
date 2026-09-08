import { trimCache } from "../core/cache";
import { findPath } from "../core/pathfinding";
import type { Terrain, WorldModel } from "../core/types";

// Disposable, bounded cache. World identity owns its style; no entries enter saves.
const surfaceCaches = new WeakMap<WorldModel, Map<string, Terrain>>();

const pathCaches = new WeakMap<WorldModel, Set<string>>();
/** Derive footpaths from existing entrances, using the same static collision map. */
export function settlementPaths(world: WorldModel): ReadonlySet<string> {
  let paths = pathCaches.get(world);
  if (paths) return paths;
  paths = new Set<string>();
  for (const place of world.places) {
    const hub = world.initialObjects
      .filter((o) => o.kind === "well" && o.pos.space === "outside")
      .sort(
        (a, b) =>
          Math.hypot(a.pos.x - place.x, a.pos.y - place.y) -
          Math.hypot(b.pos.x - place.x, b.pos.y - place.y),
      )[0];
    const goal = hub?.pos ?? world.spawn;
    const blocked = (x: number, y: number) =>
      world.blocked(x, y, "outside") || world.terrain(x, y) === "field";
    const route = findPath(place.entrance, goal, blocked, 2500);
    if (
      route.length ||
      (place.entrance.x === goal.x && place.entrance.y === goal.y)
    ) {
      paths.add(`${place.entrance.x},${place.entrance.y}`);
      for (const p of route) paths.add(`${p.x},${p.y}`);
    }
  }
  pathCaches.set(world, paths);
  return paths;
}

/** Cosmetic material treatments. Never change footprints, reach, or walkability. */
export function surfaceAt(
  world: WorldModel,
  x: number,
  y: number,
  base?: Terrain,
): Terrain {
  if (world.pack.setting) return base ?? world.terrain(x, y);
  let cache = surfaceCaches.get(world);
  if (!cache) {
    cache = new Map();
    surfaceCaches.set(world, cache);
  }
  const key = `${x},${y}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const surface = resolveSurface(world, x, y, base);
  trimCache(cache, 32768);
  cache.set(key, surface);
  return surface;
}
function resolveSurface(
  world: WorldModel,
  x: number,
  y: number,
  base?: Terrain,
): Terrain {
  const terrain = base ?? world.terrain(x, y);
  if (terrain === "sand" && !hasQuay(world, x, y)) {
    const besideWater = [
      [0, -1],
      [1, 0],
      [0, 1],
      [-1, 0],
    ].some(([dx, dy]) => world.terrain(x + dx, y + dy) === "water");
    if (!besideWater) return world.pack.ground;
  }
  if (world.pack.landscape.settlementSurface === "paths") {
    if (settlementPaths(world).has(`${x},${y}`)) return "dirt";
    if (terrain === "dirt") {
      const parcel = world.places.find(
        (p) => x >= p.x - 1 && x <= p.x + p.w && y >= p.y && y <= p.y + p.h + 3,
      );
      if (parcel) {
        if (x >= parcel.x && x < parcel.x + parcel.w && y < parcel.y + parcel.h)
          return terrain;
        return world.pack.ground;
      }
      const edge = [
        [0, -1],
        [1, 0],
        [0, 1],
        [-1, 0],
      ].some(([dx, dy]) => world.terrain(x + dx, y + dy) === world.pack.ground);
      if (edge) return world.pack.ground;
    }
  }
  if (world.pack.landscape.settlementSurface !== "paved") return terrain;
  if (!["grass", "dirt", "sand"].includes(terrain)) return terrain;
  const town = districts(world).find(
    (b) => x >= b.left && x <= b.right && y >= b.top && y <= b.bottom,
  );
  const waterfront = hasQuay(world, x, y) && terrain === "sand";
  if (!town && !waterfront) return terrain;
  // Keep planted courtyards, actual trees and rocks in their original ground.
  if (
    world.initialObjects.some(
      (o) =>
        o.kind === "tree" &&
        o.pos.space === "outside" &&
        Math.hypot(o.pos.x - x, o.pos.y - y) < 2,
    )
  )
    return terrain;
  if (terrain === "grass" && world.decoration(x, y)?.solid) return terrain;
  return world.pack.landscape.paving;
}

type District = { left: number; right: number; top: number; bottom: number };
const districtCache = new WeakMap<WorldModel, District[]>();
/** Bounds follow actual parcels. No historical setting or settlement coordinate is baked in. */
export function districts(world: WorldModel): District[] {
  let cached = districtCache.get(world);
  if (cached) return cached;
  const reach = world.pack.landscape.pavingReach;
  cached = world.settlements.flatMap((s) => {
    const places = world.places.filter((p) =>
      world.settlements.every(
        (other) =>
          Math.hypot(p.x - s.x, p.y - s.y) <=
          Math.hypot(p.x - other.x, p.y - other.y),
      ),
    );
    return places.length
      ? [
          {
            left: Math.min(...places.map((p) => p.x)) - reach,
            right: Math.max(...places.map((p) => p.x + p.w)) + reach,
            top: Math.min(...places.map((p) => p.y)) - reach,
            bottom: Math.max(...places.map((p) => p.y + p.h)) + reach,
          },
        ]
      : [];
  });
  districtCache.set(world, cached);
  return cached;
}
export function hasQuay(world: WorldModel, x: number, y: number): boolean {
  return (
    world.pack.landscape.bank === "masonry" &&
    districts(world).some(
      (b) =>
        x >= b.left - world.pack.landscape.bankReach &&
        x <= b.right + world.pack.landscape.bankReach &&
        y >= b.top &&
        y <= b.bottom,
    )
  );
}

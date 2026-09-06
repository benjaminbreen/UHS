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
    const s = [...world.settlements].sort(
      (a, b) =>
        Math.hypot(a.x - place.x, a.y - place.y) -
        Math.hypot(b.x - place.x, b.y - place.y),
    )[0];
    const goal = {
      x: Math.max(s.x - 15, Math.min(s.x + 17, place.entrance.x)),
      y: s.y + 5,
    };
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
  let cache = surfaceCaches.get(world);
  if (!cache) {
    cache = new Map();
    surfaceCaches.set(world, cache);
  }
  const key = `${x},${y}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const surface = resolveSurface(world, x, y, base);
  if (cache.size >= 32768) cache.clear();
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
  if (world.pack.layout === "clusters") {
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
  if (world.pack.layout !== "streets") return terrain;
  if (!["grass", "dirt", "sand"].includes(terrain)) return terrain;
  const town = world.settlements.find(
    (s) => x >= s.x - 17 && x <= s.x + 17 && y >= s.y - 21 && y <= s.y + 28,
  );
  const waterfront =
    world.settlements.some(
      (s) => Math.abs(y - s.y) < 29 && Math.abs(x - s.x) < 35,
    ) && terrain === "sand";
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
  if (town && terrain === "grass" && y < town.y - 9 && x > town.x + 12)
    return terrain;
  return "paving";
}

export function hasQuay(world: WorldModel, x: number, y: number): boolean {
  return (
    world.pack.layout === "streets" &&
    world.settlements.some(
      (s) => Math.abs(y - s.y) < 29 && Math.abs(x - s.x) < 35,
    )
  );
}

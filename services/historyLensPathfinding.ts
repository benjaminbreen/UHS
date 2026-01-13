import type { MapData } from '../types';
import { isTerrainPassable } from '../constants/terrainPassability';

type Point = { x: number; y: number };

// Octile distance heuristic for 8-directional movement
const heuristic = (a: Point, b: Point) => {
  const dx = Math.abs(a.x - b.x);
  const dy = Math.abs(a.y - b.y);
  // Cost: 1 for cardinal, √2 for diagonal
  return Math.max(dx, dy) + (Math.SQRT2 - 1) * Math.min(dx, dy);
};

const isPassable = (mapData: MapData, x: number, y: number, playerMode?: string) => {
  const tile = mapData.tiles[y]?.[x];
  if (!tile || tile.isBlocking) return false;
  if (playerMode === 'ship') {
    return !tile.isLand || tile.hasBridge;
  }
  if (!tile.isLand && !tile.hasBridge) return false;
  return isTerrainPassable(tile.biome);
};

// Check if a tile is shallow enough to wade through (1 tile max)
const isWadeable = (mapData: MapData, x: number, y: number): boolean => {
  const tile = mapData.tiles[y]?.[x];
  if (!tile) return false;
  if (tile.isLand || tile.hasBridge) return false; // Not water, so not wadeable (use normal passability)

  // Only allow wading in shallow water types, not deep ocean
  const biome = String(tile.biome);
  const wadeableBiomes = ['SHALLOW_OCEAN', 'RIVER', 'RIVERBANK', 'WETLANDS', 'ESTUARY', 'SHOALS_TILE', 'BEACH'];
  return wadeableBiomes.includes(biome);
};

// Check if a tile is water (for tracking wading state)
const isWaterTile = (mapData: MapData, x: number, y: number): boolean => {
  const tile = mapData.tiles[y]?.[x];
  if (!tile) return false;
  return !tile.isLand && !tile.hasBridge;
};

// Check if a tile is a coastal tile (water adjacent to land) - good for disembarking
const isCoastalWaterTile = (mapData: MapData, x: number, y: number): boolean => {
  const tile = mapData.tiles[y]?.[x];
  if (!tile || tile.isLand) return false; // Must be water

  // Check if any adjacent tile is passable land
  const neighbors = [
    { x: x + 1, y },
    { x: x - 1, y },
    { x, y: y + 1 },
    { x, y: y - 1 }
  ];

  for (const n of neighbors) {
    const neighborTile = mapData.tiles[n.y]?.[n.x];
    if (neighborTile && neighborTile.isLand && isTerrainPassable(neighborTile.biome)) {
      return true;
    }
  }
  return false;
};

// Find coastal water tiles near a land destination, sorted by distance
// Returns multiple candidates so caller can check reachability
export const findCoastalTileCandidates = (
  mapData: MapData,
  goal: Point,
  searchRadius = 20,
  maxCandidates = 10
): Point[] => {
  const candidates: Array<{ point: Point; dist: number }> = [];

  for (let dy = -searchRadius; dy <= searchRadius; dy++) {
    for (let dx = -searchRadius; dx <= searchRadius; dx++) {
      const x = goal.x + dx;
      const y = goal.y + dy;
      if (isCoastalWaterTile(mapData, x, y)) {
        const dist = Math.hypot(dx, dy);
        candidates.push({ point: { x, y }, dist });
      }
    }
  }

  // Sort by distance and return top candidates
  return candidates
    .sort((a, b) => a.dist - b.dist)
    .slice(0, maxCandidates)
    .map(c => c.point);
};

// Legacy function for compatibility - returns the nearest coastal tile
export const findNearestCoastalTile = (
  mapData: MapData,
  goal: Point,
  searchRadius = 15
): Point | null => {
  const candidates = findCoastalTileCandidates(mapData, goal, searchRadius, 1);
  return candidates[0] || null;
};

// Find the adjacent land tile to a coastal water tile (where player will step when disembarking)
const findLandingSpot = (mapData: MapData, coastalTile: Point): Point | null => {
  const neighbors = [
    { x: coastalTile.x + 1, y: coastalTile.y },
    { x: coastalTile.x - 1, y: coastalTile.y },
    { x: coastalTile.x, y: coastalTile.y + 1 },
    { x: coastalTile.x, y: coastalTile.y - 1 }
  ];

  for (const n of neighbors) {
    const tile = mapData.tiles[n.y]?.[n.x];
    if (tile && tile.isLand && isTerrainPassable(tile.biome)) {
      return n;
    }
  }
  return null;
};

// Find a coastal tile that a ship can reach from its current position
// This is the key function for ship-to-land navigation
export const findReachableCoastalTile = (
  mapData: MapData,
  shipPos: Point,
  goal: Point,
  searchRadius = 25
): { coastalTile: Point; path: Point[] } | null => {
  console.log(`[ShipNav] Finding reachable coastal tile from (${shipPos.x},${shipPos.y}) to goal (${goal.x},${goal.y})`);

  // Get coastal tile candidates near the destination
  const candidates = findCoastalTileCandidates(mapData, goal, searchRadius, 15);
  console.log(`[ShipNav] Found ${candidates.length} coastal candidates near destination`);

  // Try each candidate to see if the ship can reach it AND we can walk to the goal from there
  for (const candidate of candidates) {
    // First check if there's a landing spot and a path to the goal from there
    const landingSpot = findLandingSpot(mapData, candidate);
    if (!landingSpot) continue;

    // Check if we can walk from the landing spot to the goal
    const landPath = findHistoryLensPath(mapData, landingSpot, goal, 'onFoot', 2000);
    if (!landPath) continue;

    // Now check if ship can reach this coastal tile
    const shipPath = findHistoryLensPath(
      mapData,
      shipPos,
      candidate,
      'ship',
      3000
    );
    if (shipPath) {
      console.log(`[ShipNav] Found route: ship to (${candidate.x},${candidate.y}), then walk ${landPath.length} tiles to goal`);
      return { coastalTile: candidate, path: shipPath };
    }
  }

  console.log(`[ShipNav] No coastal tile near destination works, searching from ship position...`);

  // If no coastal tile near destination works, try to find ANY reachable coastal tile
  // that provides a path to the goal on foot
  // Search in expanding rings from the ship's position
  for (let radius = 3; radius <= 25; radius += 3) {
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const x = shipPos.x + dx;
        const y = shipPos.y + dy;
        if (!isCoastalWaterTile(mapData, x, y)) continue;

        // Find where we'd step onto land
        const landingSpot = findLandingSpot(mapData, { x, y });
        if (!landingSpot) continue;

        // Check if we can walk from landing spot to goal
        const landPath = findHistoryLensPath(mapData, landingSpot, goal, 'onFoot', 2000);
        if (!landPath) continue;

        // Check if ship can reach this coastal tile
        const shipPath = findHistoryLensPath(mapData, shipPos, { x, y }, 'ship', 2000);
        if (shipPath) {
          console.log(`[ShipNav] Found fallback route: ship to (${x},${y}), land at (${landingSpot.x},${landingSpot.y}), walk ${landPath.length} tiles`);
          return { coastalTile: { x, y }, path: shipPath };
        }
      }
    }
  }

  console.log(`[ShipNav] No reachable coastal tile found that connects to goal`);
  return null;
};

// Check if a destination is on land
export const isDestinationOnLand = (mapData: MapData, goal: Point): boolean => {
  const tile = mapData.tiles[goal.y]?.[goal.x];
  return tile?.isLand ?? false;
};

// Find the nearest passable tile to a goal (for destinations like fortresses where the exact tile may be blocked)
const findNearestPassableToGoal = (
  mapData: MapData,
  goal: Point,
  playerMode?: string,
  searchRadius = 3
): Point | null => {
  // First check if goal itself is passable
  if (isPassable(mapData, goal.x, goal.y, playerMode)) {
    return goal;
  }

  // Search in expanding rings for a passable tile
  for (let radius = 1; radius <= searchRadius; radius++) {
    const candidates: Point[] = [];
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) continue; // Only check ring perimeter
        const x = goal.x + dx;
        const y = goal.y + dy;
        if (isPassable(mapData, x, y, playerMode)) {
          candidates.push({ x, y });
        }
      }
    }
    if (candidates.length > 0) {
      // Return the closest candidate to the original goal
      return candidates.reduce((best, c) => {
        const distBest = Math.hypot(best.x - goal.x, best.y - goal.y);
        const distC = Math.hypot(c.x - goal.x, c.y - goal.y);
        return distC < distBest ? c : best;
      });
    }
  }
  return null;
};

export const findHistoryLensPath = (
  mapData: MapData,
  start: Point,
  goal: Point,
  playerMode?: string,
  maxNodes = 2000
): Point[] | null => {
  if (start.x === goal.x && start.y === goal.y) return [];

  // Ships don't wade - use standard pathfinding
  const allowWading = playerMode !== 'ship';

  // If goal is blocked, find nearest passable tile to it
  const actualGoal = findNearestPassableToGoal(mapData, goal, playerMode);
  if (!actualGoal) return null;

  // If the adjusted goal is the same as start, we're already there
  if (start.x === actualGoal.x && start.y === actualGoal.y) return [];

  // Node structure includes wading state: key format is "x,y" or "x,y,w" if wading
  type PathNode = { x: number; y: number; g: number; f: number; wading: boolean };

  const open: PathNode[] = [];
  const gScore = new Map<string, number>();
  const cameFrom = new Map<string, string>();
  const closed = new Set<string>();

  const makeKey = (x: number, y: number, wading: boolean) =>
    wading ? `${x},${y},w` : `${x},${y}`;

  const parseKey = (key: string): { x: number; y: number; wading: boolean } => {
    const parts = key.split(',');
    return {
      x: parseInt(parts[0], 10),
      y: parseInt(parts[1], 10),
      wading: parts[2] === 'w'
    };
  };

  const startWading = isWaterTile(mapData, start.x, start.y);
  const startKey = makeKey(start.x, start.y, startWading);
  gScore.set(startKey, 0);
  open.push({ x: start.x, y: start.y, g: 0, f: heuristic(start, actualGoal), wading: startWading });

  let explored = 0;

  while (open.length > 0) {
    open.sort((a, b) => a.f - b.f);
    const current = open.shift()!;
    const currentKey = makeKey(current.x, current.y, current.wading);

    if (current.x === actualGoal.x && current.y === actualGoal.y) {
      // Reconstruct path - strip wading flags from keys
      const path: Point[] = [];
      let key = currentKey;
      const startKeyBase = `${start.x},${start.y}`;
      while (!key.startsWith(startKeyBase) || (key !== startKey && key.startsWith(startKeyBase))) {
        const { x, y } = parseKey(key);
        // Don't add start position to path
        if (x !== start.x || y !== start.y) {
          path.unshift({ x, y });
        }
        const parentKey = cameFrom.get(key);
        if (!parentKey) break;
        key = parentKey;
      }
      return path;
    }

    closed.add(currentKey);
    explored += 1;
    if (explored > maxNodes) return null;

    // 8-directional movement: cardinals + diagonals
    const neighbors: Array<{ x: number; y: number; diagonal: boolean }> = [
      { x: current.x + 1, y: current.y, diagonal: false },
      { x: current.x - 1, y: current.y, diagonal: false },
      { x: current.x, y: current.y + 1, diagonal: false },
      { x: current.x, y: current.y - 1, diagonal: false },
      { x: current.x + 1, y: current.y - 1, diagonal: true },  // NE
      { x: current.x - 1, y: current.y - 1, diagonal: true },  // NW
      { x: current.x + 1, y: current.y + 1, diagonal: true },  // SE
      { x: current.x - 1, y: current.y + 1, diagonal: true }   // SW
    ];

    for (const neighbor of neighbors) {
      const neighborIsWater = isWaterTile(mapData, neighbor.x, neighbor.y);
      const neighborIsPassableLand = isPassable(mapData, neighbor.x, neighbor.y, playerMode);
      const neighborIsWadeable = allowWading && isWadeable(mapData, neighbor.x, neighbor.y);

      // Determine if we can move to this neighbor
      let canMove = false;
      let nextWading = false;
      // Diagonal moves cost √2 ≈ 1.414, cardinal moves cost 1
      let moveCost = neighbor.diagonal ? 1.414 : 1;

      if (neighborIsPassableLand) {
        // Normal land movement - always allowed
        canMove = true;
        nextWading = false;
      } else if (neighborIsWadeable && !current.wading) {
        // Can wade INTO shallow water from land (but not from water to water)
        canMove = true;
        nextWading = true;
        moveCost = neighbor.diagonal ? 2.1 : 1.5; // Small penalty to prefer land routes
      }
      // If current.wading is true and neighbor is water, we can't go there (no consecutive wading)

      if (!canMove) continue;

      const neighborKey = makeKey(neighbor.x, neighbor.y, nextWading);
      if (closed.has(neighborKey)) continue;

      const tentativeG = (gScore.get(currentKey) ?? Infinity) + moveCost;
      if (tentativeG >= (gScore.get(neighborKey) ?? Infinity)) continue;

      cameFrom.set(neighborKey, currentKey);
      gScore.set(neighborKey, tentativeG);
      const f = tentativeG + heuristic(neighbor, actualGoal);
      const existing = open.find(node =>
        node.x === neighbor.x && node.y === neighbor.y && node.wading === nextWading
      );
      if (existing) {
        existing.g = tentativeG;
        existing.f = f;
      } else {
        open.push({ x: neighbor.x, y: neighbor.y, g: tentativeG, f, wading: nextWading });
      }
    }
  }

  return null;
};

// Find the best edge tile to navigate to for leaving the map
export const findEdgeTarget = (
  mapData: MapData,
  playerX: number,
  playerY: number,
  direction: 'north' | 'south' | 'east' | 'west',
  playerMode?: string
): { x: number; y: number } | null => {
  const width = mapData.tiles[0]?.length || mapData.width;
  const height = mapData.tiles.length || mapData.height;

  // Determine the edge row/column based on direction
  let candidates: Array<{ x: number; y: number; dist: number }> = [];

  if (direction === 'north') {
    // Find passable tiles on the northern edge (y = 0)
    for (let x = 0; x < width; x++) {
      if (isPassable(mapData, x, 0, playerMode)) {
        candidates.push({ x, y: 0, dist: Math.abs(x - playerX) });
      }
    }
  } else if (direction === 'south') {
    // Find passable tiles on the southern edge (y = height - 1)
    for (let x = 0; x < width; x++) {
      if (isPassable(mapData, x, height - 1, playerMode)) {
        candidates.push({ x, y: height - 1, dist: Math.abs(x - playerX) });
      }
    }
  } else if (direction === 'west') {
    // Find passable tiles on the western edge (x = 0)
    for (let y = 0; y < height; y++) {
      if (isPassable(mapData, 0, y, playerMode)) {
        candidates.push({ x: 0, y, dist: Math.abs(y - playerY) });
      }
    }
  } else if (direction === 'east') {
    // Find passable tiles on the eastern edge (x = width - 1)
    for (let y = 0; y < height; y++) {
      if (isPassable(mapData, width - 1, y, playerMode)) {
        candidates.push({ x: width - 1, y, dist: Math.abs(y - playerY) });
      }
    }
  }

  if (candidates.length === 0) return null;

  // Sort by distance from player's current position along the perpendicular axis
  candidates.sort((a, b) => a.dist - b.dist);

  // Return the closest passable edge tile
  return { x: candidates[0].x, y: candidates[0].y };
};

import type { MapData } from '../types';
import { isTerrainPassable } from '../constants/terrainPassability';

type Point = { x: number; y: number };

const heuristic = (a: Point, b: Point) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

const isPassable = (mapData: MapData, x: number, y: number, playerMode?: string) => {
  const tile = mapData.tiles[y]?.[x];
  if (!tile || tile.isBlocking) return false;
  if (playerMode === 'ship') {
    return !tile.isLand || tile.hasBridge;
  }
  if (!tile.isLand && !tile.hasBridge) return false;
  return isTerrainPassable(tile.biome);
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

  // If goal is blocked, find nearest passable tile to it
  const actualGoal = findNearestPassableToGoal(mapData, goal, playerMode);
  if (!actualGoal) return null;

  // If the adjusted goal is the same as start, we're already there
  if (start.x === actualGoal.x && start.y === actualGoal.y) return [];

  const open: Array<{ x: number; y: number; g: number; f: number; parent?: string }> = [];
  const gScore = new Map<string, number>();
  const cameFrom = new Map<string, string>();
  const closed = new Set<string>();

  const startKey = `${start.x},${start.y}`;
  gScore.set(startKey, 0);
  open.push({ x: start.x, y: start.y, g: 0, f: heuristic(start, actualGoal) });

  let explored = 0;

  while (open.length > 0) {
    open.sort((a, b) => a.f - b.f);
    const current = open.shift()!;
    const currentKey = `${current.x},${current.y}`;

    if (current.x === actualGoal.x && current.y === actualGoal.y) {
      const path: Point[] = [];
      let key = currentKey;
      while (key !== startKey) {
        const [x, y] = key.split(',').map(Number);
        path.unshift({ x, y });
        const parentKey = cameFrom.get(key);
        if (!parentKey) break;
        key = parentKey;
      }
      return path;
    }

    closed.add(currentKey);
    explored += 1;
    if (explored > maxNodes) return null;

    const neighbors: Point[] = [
      { x: current.x + 1, y: current.y },
      { x: current.x - 1, y: current.y },
      { x: current.x, y: current.y + 1 },
      { x: current.x, y: current.y - 1 }
    ];

    for (const neighbor of neighbors) {
      if (!isPassable(mapData, neighbor.x, neighbor.y, playerMode)) continue;
      const neighborKey = `${neighbor.x},${neighbor.y}`;
      if (closed.has(neighborKey)) continue;

      const tentativeG = (gScore.get(currentKey) ?? Infinity) + 1;
      if (tentativeG >= (gScore.get(neighborKey) ?? Infinity)) continue;

      cameFrom.set(neighborKey, currentKey);
      gScore.set(neighborKey, tentativeG);
      const f = tentativeG + heuristic(neighbor, actualGoal);
      const existing = open.find(node => node.x === neighbor.x && node.y === neighbor.y);
      if (existing) {
        existing.g = tentativeG;
        existing.f = f;
      } else {
        open.push({ x: neighbor.x, y: neighbor.y, g: tentativeG, f });
      }
    }
  }

  return null;
};

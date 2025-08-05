/**
 * generation/standardMap/features/RoadAndPathGenerator.ts - Generates paths and roads connecting points of interest.
 */
import { Tile, BiomeType, PathType, Point, MapData } from '../../../types';
import { MAP_WIDTH_TILES, MAP_HEIGHT_TILES, TILE_SIZE_PX } from '../../../constants/index';
import { ValueNoise } from '../../../utils/noise';

interface AStarNode {
  tile: Tile;
  gScore: number; // Cost from start to current node
  fScore: number; // Total cost (gScore + heuristic)
  parent: AStarNode | null;
}

const ROAD_STROKE_COLOR = "#855a40"; 
const PATH_STROKE_COLOR = "#a67b5b"; 
const ROAD_STROKE_WIDTH_BASE = TILE_SIZE_PX * 0.2;
const PATH_STROKE_WIDTH_BASE = TILE_SIZE_PX * 0.12;
const ROAD_OPACITY = 0.65;
const PATH_OPACITY = 0.55;

let pathIdCounter = 0; // For unique path IDs

function getMovementCost(
    fromTile: Tile,
    toTile: Tile,
    cameFromForPath: Map<Tile, Tile>, // Keep for potential future use, though path curviness is now visual
    pathType: PathType,
    tiles: Tile[][],
    noise: ValueNoise
): number {
  if (!toTile.isLand && toTile.biome !== BiomeType.BEACH && !(toTile.biome === BiomeType.SHOALS_TILE && toTile.isLand)) {
    if (pathType === PathType.PATH && (toTile.biome === BiomeType.RIVER) && fromTile.isLand) {
        let canCross = false;
        const dx = toTile.x - fromTile.x;
        const dy = toTile.y - fromTile.y;
        const oppositeX = toTile.x + dx;
        const oppositeY = toTile.y + dy;
        if (oppositeX >= 0 && oppositeX < MAP_WIDTH_TILES && oppositeY >= 0 && oppositeY < MAP_HEIGHT_TILES) {
            if (tiles[oppositeY][oppositeX].isLand) {
                canCross = true;
            }
        }
        if (canCross) return 15; // Higher cost for potential ford/bridge
    }
    return Infinity;
  }
  if (toTile.biome === BiomeType.ACTIVE_LAVA || toTile.biome === BiomeType.CLIFF) return Infinity;

  let cost = 1;
  const altDiff = Math.abs(fromTile.altitude - toTile.altitude);
  cost += altDiff * 20;

  switch (toTile.biome) {
    case BiomeType.GRASSLAND:
    case BiomeType.STEPPE:
    case BiomeType.DESERT:
    case BiomeType.BEACH:
    case BiomeType.SALT_FLATS:
    case BiomeType.TUNDRA:
    case BiomeType.VOLCANIC_SOIL:
      cost += (pathType === PathType.ROAD ? 1 : 1);
      break;
    case BiomeType.FARMLAND:
      cost += (pathType === PathType.ROAD ? 8 : 3);
      break;
    case BiomeType.SCRUB:
    case BiomeType.RIVERBANK:
      cost += (pathType === PathType.ROAD ? 3 : 2);
      break;
    case BiomeType.FOREST:
      cost += (pathType === PathType.ROAD ? 6 : 2);
      break;
    case BiomeType.DENSE_FOREST:
    case BiomeType.JUNGLE:
      cost += (pathType === PathType.ROAD ? 12 : 5);
      break;
    case BiomeType.HILLS:
      cost += (pathType === PathType.ROAD ? 8 : 3);
      break;
    case BiomeType.MOUNTAIN:
      cost += (pathType === PathType.ROAD ? 30 : 8);
      break;
    case BiomeType.VOLCANIC_ROCK:
      cost += (pathType === PathType.ROAD ? 25 : 10);
      break;
    case BiomeType.WETLANDS:
    case BiomeType.MANGROVE:
      cost += (pathType === PathType.ROAD ? 40 : 15);
      break;
    case BiomeType.SNOW:
    case BiomeType.HIGH_PEAK:
      cost += (pathType === PathType.ROAD ? 60 : 20);
      break;
    // Lower cost for moving through existing settlements
    case BiomeType.HAMLET: cost += (pathType === PathType.ROAD ? 2 : 0.5); break;
    case BiomeType.LOW_DENSITY_CITY: cost += (pathType === PathType.ROAD ? 1 : 0.5); break;
    case BiomeType.DENSE_CITY: cost += (pathType === PathType.ROAD ? 0.5 : 0.2); break;
    case BiomeType.RUINS: cost += (pathType === PathType.ROAD ? 10 : 1); break;
    default: cost += (pathType === PathType.ROAD ? 5 : 2);
  }

  // Consider existing paths when calculating cost for new paths.
  const existingPathObject = tiles[toTile.y][toTile.x];
  if (existingPathObject.pathObjectRef && existingPathObject.pathObjectRef.type === PathType.ROAD) {
    cost *= (pathType === PathType.ROAD ? 0.1 : 0.3);
  } else if (existingPathObject.pathObjectRef && existingPathObject.pathObjectRef.type === PathType.PATH) {
    cost *= (pathType === PathType.PATH ? 0.2 : 0.6);
  }
  
  // Encourage turns for paths to look more organic before visual smoothing
  if (pathType === PathType.PATH) {
    const parentOfFromTile = cameFromForPath.get(fromTile);
    if (parentOfFromTile) {
      const prevDx = fromTile.x - parentOfFromTile.x;
      const prevDy = fromTile.y - parentOfFromTile.y;
      const currentDx = toTile.x - fromTile.x;
      const currentDy = toTile.y - fromTile.y;

      if (prevDx === currentDx && prevDy === currentDy) { 
        cost += 1.5; 
      } else { 
        cost -= 0.5; 
      }
    }
    const easyTerrains = new Set([
        BiomeType.GRASSLAND, BiomeType.FOREST, BiomeType.SCRUB, BiomeType.STEPPE,
        BiomeType.RIVERBANK, BiomeType.BEACH, BiomeType.FARMLAND, BiomeType.TUNDRA,
        BiomeType.DESERT, BiomeType.VOLCANIC_SOIL
    ]);
    if (easyTerrains.has(toTile.biome)) {
        cost += (noise.random() - 0.5) * 1.0; 
    }
  }
  
  if (fromTile.x !== toTile.x && fromTile.y !== toTile.y) { 
    cost += (pathType === PathType.ROAD ? 0.3 : 0.1); 
  }

  return Math.max(0.1, cost);
}

function heuristic(a: Tile, b: Tile): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function reconstructPath(cameFrom: Map<Tile, Tile>, current: Tile): Tile[] {
  const totalPath = [current];
  let tempCurrent = current;
  while (cameFrom.has(tempCurrent)) {
    tempCurrent = cameFrom.get(tempCurrent)!;
    totalPath.unshift(tempCurrent);
  }
  return totalPath;
}

export function findPathAStar(
    startTile: Tile,
    endTile: Tile,
    tiles: Tile[][],
    pathType: PathType,
    noise: ValueNoise
): Tile[] | null {
  const openSet = new Set<Tile>();
  openSet.add(startTile);

  const cameFrom = new Map<Tile, Tile>();

  const gScore = new Map<Tile, number>();
  gScore.set(startTile, 0);

  const fScore = new Map<Tile, number>();
  fScore.set(startTile, heuristic(startTile, endTile));

  const MAX_ITERATIONS = MAP_WIDTH_TILES * MAP_HEIGHT_TILES * 2;
  let iterations = 0;

  while (openSet.size > 0) {
    iterations++;
    if (iterations > MAX_ITERATIONS) {
      // console.warn("A* pathfinding exceeded max iterations between", startTile, "and", endTile);
      return null;
    }

    let current: Tile | null = null;
    let lowestFScore = Infinity;
    for (const tile of openSet) {
      if ((fScore.get(tile) ?? Infinity) < lowestFScore) {
        lowestFScore = fScore.get(tile)!;
        current = tile;
      }
    }

    if (!current) return null;

    if (current.x === endTile.x && current.y === endTile.y) {
      return reconstructPath(cameFrom, current);
    }

    openSet.delete(current);

    const neighbors: Tile[] = [];
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = current.x + dx;
        const ny = current.y + dy;
        if (nx >= 0 && nx < MAP_WIDTH_TILES && ny >= 0 && ny < MAP_HEIGHT_TILES) {
          neighbors.push(tiles[ny][nx]);
        }
      }
    }

    for (const neighbor of neighbors) {
      const movementCost = getMovementCost(current, neighbor, cameFrom, pathType, tiles, noise);
      if (movementCost === Infinity) continue;

      const tentativeGScore = (gScore.get(current) ?? Infinity) + movementCost;

      if (tentativeGScore < (gScore.get(neighbor) ?? Infinity)) {
        cameFrom.set(neighbor, current);
        gScore.set(neighbor, tentativeGScore);
        fScore.set(neighbor, tentativeGScore + heuristic(neighbor, endTile));
        if (!openSet.has(neighbor)) {
          openSet.add(neighbor);
        }
      }
    }
  }
  return null;
}


function tilePathToPixelPoints(tilePath: Tile[]): Point[] {
  return tilePath.map(tile => ({
    x: tile.x * TILE_SIZE_PX + TILE_SIZE_PX / 2 + (Math.random() - 0.5) * TILE_SIZE_PX * 0.2, // Add slight jitter
    y: tile.y * TILE_SIZE_PX + TILE_SIZE_PX / 2 + (Math.random() - 0.5) * TILE_SIZE_PX * 0.2,
  }));
}

function generateSvgDFromPoints(pixelPoints: Point[]): string {
  if (pixelPoints.length < 2) return "";

  let d = `M ${pixelPoints[0].x.toFixed(2)} ${pixelPoints[0].y.toFixed(2)}`;

  if (pixelPoints.length === 2) {
    d += ` L ${pixelPoints[1].x.toFixed(2)} ${pixelPoints[1].y.toFixed(2)}`;
    return d;
  }

  // Create midpoints for quadratic Bezier curves
  // Path: M P0 L M01 Q P1 M12 Q P2 M23 ... L Pn
  const midpoints: Point[] = [];
  for (let i = 0; i < pixelPoints.length - 1; i++) {
    midpoints.push({
      x: (pixelPoints[i].x + pixelPoints[i+1].x) / 2,
      y: (pixelPoints[i].y + pixelPoints[i+1].y) / 2,
    });
  }

  d += ` L ${midpoints[0].x.toFixed(2)} ${midpoints[0].y.toFixed(2)}`;

  for (let i = 0; i < midpoints.length - 1; i++) {
    // Original point P_{i+1} is the control point.
    // Curve from midpoint M_{i,i+1} to M_{i+1,i+2}
    d += ` Q ${pixelPoints[i+1].x.toFixed(2)} ${pixelPoints[i+1].y.toFixed(2)}, ${midpoints[i+1].x.toFixed(2)} ${midpoints[i+1].y.toFixed(2)}`;
  }

  d += ` L ${pixelPoints[pixelPoints.length - 1].x.toFixed(2)} ${pixelPoints[pixelPoints.length - 1].y.toFixed(2)}`;
  return d;
}


export function generateRoadAndPathNetwork(mapData: MapData, noise: ValueNoise): void {
  console.log("Generating paths and roads...");
  const tiles = mapData.tiles;
  mapData.pathObjects = mapData.pathObjects || [];

  const urbanAreas: Tile[] = [];
  const hamlets: Tile[] = [];
  const farms: Tile[] = [];
  const ruins: Tile[] = [];
  const pointsOfInterest: Tile[] = [];

  for (let y = 0; y < MAP_HEIGHT_TILES; y++) {
    for (let x = 0; x < MAP_WIDTH_TILES; x++) {
      const tile = tiles[y][x];
      if (tile.biome === BiomeType.DENSE_CITY || tile.biome === BiomeType.LOW_DENSITY_CITY) {
        urbanAreas.push(tile);
      } else if (tile.biome === BiomeType.HAMLET) {
        hamlets.push(tile);
      } else if (tile.biome === BiomeType.FARMLAND) {
        farms.push(tile);
      } else if (tile.biome === BiomeType.RUINS || tile.biome === BiomeType.PALACE || tile.biome === BiomeType.HOLY_SITE) {
        pointsOfInterest.push(tile);
      }
      tile.pathObjectRef = undefined;
    }
  }

  // Connect major urban areas and major POIs with roads
  const majorNodes = [...urbanAreas, ...pointsOfInterest.filter(p => p.biome === BiomeType.PALACE)];
  if (majorNodes.length > 1) {
    const connectedPairs = new Set<string>();
    majorNodes.forEach(node1 => {
      const otherNodes = majorNodes
        .filter(node2 => node1 !== node2)
        .sort((a, b) => heuristic(node1, a) - heuristic(node1, b));
      const connectionsToMake = Math.min(otherNodes.length, majorNodes.length < 4 ? 2 : 1);
      
      for (let i = 0; i < connectionsToMake; i++) {
        const node2 = otherNodes[i];
        if (!node2) continue;
        const pairKey1 = `${node1.x},${node1.y}-${node2.x},${node2.y}`;
        const pairKey2 = `${node2.x},${node2.y}-${node1.x},${node1.y}`;
        if (connectedPairs.has(pairKey1) || connectedPairs.has(pairKey2)) continue;
        
        const aStarPath = findPathAStar(node1, node2, tiles, PathType.ROAD, noise);
        if (aStarPath && aStarPath.length >= 3) {
          const pixelPoints = tilePathToPixelPoints(aStarPath);
          const svgD = generateSvgDFromPoints(pixelPoints);
          if (svgD) {
            const pathObject = {
              id: `road-${pathIdCounter++}`,
              type: PathType.ROAD,
              svgD,
              strokeWidth: ROAD_STROKE_WIDTH_BASE + (noise.random() -0.5) * ROAD_STROKE_WIDTH_BASE * 0.1, // Slight width variation
              strokeColor: ROAD_STROKE_COLOR,
              opacity: ROAD_OPACITY,
            };
            mapData.pathObjects!.push(pathObject);
            aStarPath.forEach(t => tiles[t.y][t.x].pathObjectRef = pathObject);
            connectedPairs.add(pairKey1);
            connectedPairs.add(pairKey2);
          }
        }
      }
    });
  }

  // Connect hamlets and minor POIs to the nearest major node with paths
  const minorNodes = [...hamlets, ...pointsOfInterest.filter(p => p.biome !== BiomeType.PALACE)];
  minorNodes.forEach(minorNode => {
    let closestTarget: Tile | null = null;
    let bestDist = Infinity;

    majorNodes.forEach(majorNode => {
        const dist = heuristic(minorNode, majorNode);
        if (dist < bestDist) {
            bestDist = dist;
            closestTarget = majorNode;
        }
    });
    
    if (closestTarget) {
      const aStarPath = findPathAStar(minorNode, closestTarget, tiles, PathType.PATH, noise);
      if (aStarPath && aStarPath.length >= 3) {
        const pixelPoints = tilePathToPixelPoints(aStarPath);
        const svgD = generateSvgDFromPoints(pixelPoints);
        if (svgD) {
           mapData.pathObjects!.push({
            id: `path-${pathIdCounter++}`,
            type: PathType.PATH,
            svgD,
            strokeWidth: PATH_STROKE_WIDTH_BASE + (noise.random() - 0.5) * PATH_STROKE_WIDTH_BASE * 0.1,
            strokeColor: PATH_STROKE_COLOR,
            opacity: PATH_OPACITY,
          });
        }
      }
    }
  });

  // Connect some farms to nearest hamlet/urban area with paths
  farms.forEach(farm => {
    if (noise.random() < 0.55) return; 

    let closestTarget: Tile | null = null;
    let bestDist = Infinity;

    [...hamlets, ...urbanAreas].forEach(settlement => {
        const dist = heuristic(farm, settlement);
        if (dist < bestDist) {
            bestDist = dist;
            closestTarget = settlement;
        }
    });

    if (closestTarget) {
      const aStarPath = findPathAStar(farm, closestTarget, tiles, PathType.PATH, noise);
      if (aStarPath && aStarPath.length >= 3) {
        const pixelPoints = tilePathToPixelPoints(aStarPath);
        const svgD = generateSvgDFromPoints(pixelPoints);
         if (svgD) {
           mapData.pathObjects!.push({
            id: `path-${pathIdCounter++}`,
            type: PathType.PATH,
            svgD,
            strokeWidth: PATH_STROKE_WIDTH_BASE * 0.8, // Farm paths are thinner
            strokeColor: PATH_STROKE_COLOR,
            opacity: PATH_OPACITY * 0.8,
          });
        }
      }
    }
  });
  console.log("Path and road generation complete. PathObjects: ", mapData.pathObjects?.length || 0);
}
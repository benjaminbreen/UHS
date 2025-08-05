/**
 * generation/standardMap/features/StreamGenerator.ts - Generates small connecting rivers (streams).
 */
import { Tile, MapData, Point, BiomeType, PathType, ClimateType } from '../../../types/index';
import { MAP_WIDTH_TILES, MAP_HEIGHT_TILES, TILE_SIZE_PX, CLIMATE_WATER_COLORS } from '../../../constants/index';
import { ValueNoise } from '../../../utils/noise';

// Minimal A* structures needed for this file
interface AStarNode {
  tile: Tile;
  gScore: number;
  fScore: number;
  parent: AStarNode | null;
}

function heuristic(a: Tile, b: Tile): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
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

function getStreamMovementCost(fromTile: Tile, toTile: Tile): number {
    const isSink = [BiomeType.RIVER, BiomeType.MAJOR_RIVER, BiomeType.FRESHWATER_LAKE, BiomeType.ESTUARY].includes(toTile.biome);

    if (!toTile.isLand && !isSink) {
        return Infinity; // Don't flow into oceans directly, only rivers/lakes
    }

    if ([BiomeType.MOUNTAIN, BiomeType.HIGH_PEAK, BiomeType.SNOW, BiomeType.ACTIVE_LAVA, BiomeType.CLIFF].includes(toTile.biome)) {
        return Infinity;
    }
    if ([BiomeType.HAMLET, BiomeType.DENSE_CITY, BiomeType.LOW_DENSITY_CITY].includes(toTile.biome)) {
        return Infinity;
    }

    let cost = 1;
    const altitudeChange = toTile.altitude - fromTile.altitude;

    // Heavy penalty for going uphill
    if (altitudeChange > 0.005) { // Allow for tiny bumps
        cost += altitudeChange * 2000;
    } else {
        // Reward for going downhill
        cost += altitudeChange * 500; // altitudeChange is negative, so this subtracts from cost
    }

    // Biome penalties
    if (toTile.biome === BiomeType.HILLS) cost += 10;
    if (toTile.biome === BiomeType.FOREST || toTile.biome === BiomeType.DENSE_FOREST) cost += 5;
    if (toTile.biome === BiomeType.DESERT) cost += 20;

    return Math.max(0.1, cost);
}


function findPathForStream(startTile: Tile, endTile: Tile, tiles: Tile[][]): Tile[] | null {
  const openSet = new Set<Tile>([startTile]);
  const cameFrom = new Map<Tile, Tile>();
  const gScore = new Map<Tile, number>([[startTile, 0]]);
  const fScore = new Map<Tile, number>([[startTile, heuristic(startTile, endTile)]]);
  const maxIterations = (MAP_WIDTH_TILES + MAP_HEIGHT_TILES) * 10;
  let iterations = 0;

  while (openSet.size > 0 && iterations < maxIterations) {
    iterations++;
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

    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = current.x + dx;
        const ny = current.y + dy;

        if (nx >= 0 && nx < MAP_WIDTH_TILES && ny >= 0 && ny < MAP_HEIGHT_TILES) {
          const neighbor = tiles[ny][nx];
          const movementCost = getStreamMovementCost(current, neighbor);
          if (movementCost === Infinity) continue;

          const tentativeGScore = (gScore.get(current) ?? Infinity) + movementCost + heuristic(current, neighbor);

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
    }
  }

  return null;
}

function tilePathToPixelPoints(tilePath: Tile[], noise: ValueNoise): Point[] {
  return tilePath.map(tile => ({
    x: tile.x * TILE_SIZE_PX + TILE_SIZE_PX / 2 + (noise.random() - 0.5) * TILE_SIZE_PX * 0.4,
    y: tile.y * TILE_SIZE_PX + TILE_SIZE_PX / 2 + (noise.random() - 0.5) * TILE_SIZE_PX * 0.4,
  }));
}

function generateSvgDFromPoints(pixelPoints: Point[]): string {
    if (pixelPoints.length < 2) return "";
    let d = `M ${pixelPoints[0].x.toFixed(2)} ${pixelPoints[0].y.toFixed(2)}`;
    if (pixelPoints.length === 2) {
      d += ` L ${pixelPoints[1].x.toFixed(2)} ${pixelPoints[1].y.toFixed(2)}`;
      return d;
    }
    for (let i = 1; i < pixelPoints.length - 2; i++) {
        const xc = (pixelPoints[i].x + pixelPoints[i + 1].x) / 2;
        const yc = (pixelPoints[i].y + pixelPoints[i + 1].y) / 2;
        d += ` Q ${pixelPoints[i].x.toFixed(2)},${pixelPoints[i].y.toFixed(2)} ${xc.toFixed(2)},${yc.toFixed(2)}`;
    }
    d += ` Q ${pixelPoints[pixelPoints.length - 2].x.toFixed(2)},${pixelPoints[pixelPoints.length - 2].y.toFixed(2)} ${pixelPoints[pixelPoints.length - 1].x.toFixed(2)},${pixelPoints[pixelPoints.length - 1].y.toFixed(2)}`;
    return d;
}

let streamIdCounter = 0;

export function generateStreams(mapData: MapData, noise: ValueNoise) {
    if (!mapData.pathObjects) mapData.pathObjects = [];
    const { tiles, climate } = mapData;

    const streamSinks: Tile[] = [];
    const streamSources: Tile[] = [];

    for (let y = 0; y < MAP_HEIGHT_TILES; y++) {
        for (let x = 0; x < MAP_WIDTH_TILES; x++) {
            const tile = tiles[y][x];
            if ([BiomeType.RIVER, BiomeType.MAJOR_RIVER, BiomeType.FRESHWATER_LAKE, BiomeType.ESTUARY].includes(tile.biome)) {
                streamSinks.push(tile);
            }
            if (tile.isLand && (tile.biome === BiomeType.HILLS || tile.biome === BiomeType.WETLANDS)) {
                let isNearWater = false;
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        const checkX = x + dx; const checkY = y + dy;
                        if(checkX >= 0 && checkX < MAP_WIDTH_TILES && checkY >=0 && checkY < MAP_HEIGHT_TILES) {
                            if (!tiles[checkY][checkX].isLand) {
                                isNearWater = true;
                                break;
                            }
                        }
                    }
                    if (isNearWater) break;
                }
                if (!isNearWater) {
                    streamSources.push(tile);
                }
            }
        }
    }

    if (streamSinks.length === 0 || streamSources.length === 0) return;

    const numStreams = 4 + Math.floor(noise.random() * 6);

    for (let i = 0; i < numStreams; i++) {
        if (streamSources.length === 0) break;
        const sourceIndex = Math.floor(noise.random() * streamSources.length);
        const startTile = streamSources[sourceIndex];
        streamSources.splice(sourceIndex, 1); // Avoid reusing sources

        let endTile: Tile | null = null;
        let minDistance = Infinity;

        streamSinks.forEach(sink => {
            const dist = heuristic(startTile, sink);
            if (dist < minDistance) {
                minDistance = dist;
                endTile = sink;
            }
        });

        if (startTile && endTile) {
            const path = findPathForStream(startTile, endTile, tiles);
            if (path && path.length > 2) {
                // Check if the stream path ends in a water body and trim it
                const lastTile = path[path.length - 1];
                if ([BiomeType.RIVER, BiomeType.MAJOR_RIVER, BiomeType.FRESHWATER_LAKE, BiomeType.ESTUARY].includes(lastTile.biome)) {
                    path.pop();
                }

                // Ensure path is still valid after trimming
                if (path.length < 2) continue;

                const pixelPoints = tilePathToPixelPoints(path, noise);
                const svgD = generateSvgDFromPoints(pixelPoints);

                // Use the lighter 'SHALLOW' water color for streams
                const streamColor = CLIMATE_WATER_COLORS[climate]?.SHALLOW || '#38bdf8';

                if (svgD) {
                    mapData.pathObjects.push({
                        id: `stream-${streamIdCounter++}`,
                        type: PathType.PATH, 
                        svgD,
                        strokeWidth: TILE_SIZE_PX * (0.1 + noise.random() * 0.08),
                        strokeColor: streamColor,
                        opacity: 0.8,
                    });
                }
            }
        }
    }
}
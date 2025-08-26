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

// Add natural meandering to stream paths
function addNaturalMeandering(points: Point[], noise: ValueNoise): Point[] {
    return points.map((point, idx) => {
        // Add gentle sine-wave perturbations for natural curves
        const frequency = 0.15;
        const amplitude = TILE_SIZE_PX * 0.3;
        const offset = noise.random() * Math.PI * 2;
        
        // Different frequencies for x and y create more natural patterns
        const xWave = Math.sin(idx * frequency + offset) * amplitude * 0.7;
        const yWave = Math.cos(idx * frequency * 0.8 + offset) * amplitude * 0.5;
        
        return {
            x: point.x + xWave,
            y: point.y + yWave
        };
    });
}

// Calculate stream width based on position along path
function calculateStreamWidth(progress: number): number {
    // Exponential growth from source to mouth
    // Starts very thin (0.03) and grows to wider (0.12)
    const minWidth = TILE_SIZE_PX * 0.03;
    const maxWidth = TILE_SIZE_PX * 0.12;
    
    // Use exponential curve for more natural widening
    const widthProgress = Math.pow(progress, 1.5);
    return minWidth + (maxWidth - minWidth) * widthProgress;
}

// Generate a clean single-path stream with proper visuals
function generateCleanStream(path: Tile[], tiles: Tile[][], noise: ValueNoise): {
    mainPath: { svgD: string; strokeWidth: number; strokeColor: string; opacity: number; };
    shadowPath?: { svgD: string; strokeWidth: number; strokeColor: string; opacity: number; };
} | null {
    if (path.length < 2) return null;
    
    // Generate initial pixel points
    let pixelPoints = tilePathToPixelPoints(path, noise);
    
    // Add natural meandering
    pixelPoints = addNaturalMeandering(pixelPoints, noise);
    
    // Generate smooth SVG path
    const svgD = generateSvgDFromPoints(pixelPoints);
    if (!svgD) return null;
    
    // Calculate average width (weighted toward the end for river mouth)
    const averageProgress = 0.7; // Bias toward wider
    const streamWidth = calculateStreamWidth(averageProgress);
    
    // Ocean color that matches the rendered appearance
    // This is darker to match the actual ocean tiles after overlays
    const oceanColor = '#2b7bb5'; // Deep blue matching rendered ocean
    
    return {
        mainPath: {
            svgD,
            strokeWidth: streamWidth,
            strokeColor: oceanColor,
            opacity: 0.85
        },
        // Subtle shadow for depth (optional)
        shadowPath: {
            svgD,
            strokeWidth: streamWidth + TILE_SIZE_PX * 0.02,
            strokeColor: 'rgba(0, 0, 0, 0.2)',
            opacity: 0.4
        }
    };
}

let streamIdCounter = 0;

export function generateStreams(mapData: MapData, noise: ValueNoise) {
    if (!mapData.pathObjects) mapData.pathObjects = [];
    const { tiles, climate } = mapData;
    
    // Skip stream generation entirely for arid climates
    if (climate === ClimateType.ARID) {
        console.log("[Streams] Skipping stream generation for ARID climate");
        return;
    }

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
                // Don't trim the path - let it connect to water
                // Just ensure path is valid
                if (path.length < 2) continue;

                // Generate clean single-path stream
                const streamResult = generateCleanStream(path, tiles, noise);
                
                if (streamResult) {
                    // Add shadow first (renders underneath)
                    if (streamResult.shadowPath) {
                        mapData.pathObjects.push({
                            id: `stream-shadow-${streamIdCounter}`,
                            type: PathType.PATH,
                            svgD: streamResult.shadowPath.svgD,
                            strokeWidth: streamResult.shadowPath.strokeWidth,
                            strokeColor: streamResult.shadowPath.strokeColor,
                            opacity: streamResult.shadowPath.opacity,
                            isStream: true,
                            renderOrder: -1 // Render first
                        });
                    }
                    
                    // Add main stream path
                    mapData.pathObjects.push({
                        id: `stream-${streamIdCounter}`,
                        type: PathType.PATH,
                        svgD: streamResult.mainPath.svgD,
                        strokeWidth: streamResult.mainPath.strokeWidth,
                        strokeColor: streamResult.mainPath.strokeColor,
                        opacity: streamResult.mainPath.opacity,
                        isStream: true,
                        renderOrder: 0
                    });
                    
                    streamIdCounter++;
                }
            }
        }
    }
}
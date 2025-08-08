/**
 * generation/standardMap/features/RiverGenerator.ts - Generates rivers for Standard Maps
 */
import { Tile, BiomeType, Point, MapArchetype, ClimateType, NeighboringEdges } from '../../../types/index';
import { ValueNoise } from '../../../utils/noise';
import { 
    MAP_WIDTH_TILES, MAP_HEIGHT_TILES, ALTITUDE_LEVELS,
    CLIMATE_RIVER_SOURCE_MODIFIERS,
    RIVER_MAX_LENGTH, RIVER_MIN_ALTITUDE_SOURCE,
    RIVER_SINUOSITY_FACTOR, RIVER_OXBOW_CHANCE, RIVER_TRIBUTARY_CHANCE, 
    RIVER_MEANDER_FREQUENCY,
    RIVER_MIN_SOURCES_BASE, RIVER_MAX_SOURCES_BASE,
    FRESHWATER_LAKE_RADIUS_RATIO, BAY_WATER_RATIO
} from '../../../constants/index';


/**
 * Find river continuation points from neighboring edges
 * Rivers should continue from adjacent maps when they reach an edge
 */
export function findRiverContinuationPoints(neighboringEdges: NeighboringEdges | undefined): Point[] {
  const continuationPoints: Point[] = [];
  
  if (!neighboringEdges) return continuationPoints;
  
  // Check north edge for rivers coming from the north
  if (neighboringEdges.north) {
    neighboringEdges.north.forEach((tile, x) => {
      if (tile.biome === BiomeType.RIVER || tile.biome === BiomeType.MAJOR_RIVER) {
        continuationPoints.push({ x, y: 0 });
      }
    });
  }
  
  // Check south edge for rivers coming from the south
  if (neighboringEdges.south) {
    neighboringEdges.south.forEach((tile, x) => {
      if (tile.biome === BiomeType.RIVER || tile.biome === BiomeType.MAJOR_RIVER) {
        continuationPoints.push({ x, y: MAP_HEIGHT_TILES - 1 });
      }
    });
  }
  
  // Check east edge for rivers coming from the east
  if (neighboringEdges.east) {
    neighboringEdges.east.forEach((tile, y) => {
      if (tile.biome === BiomeType.RIVER || tile.biome === BiomeType.MAJOR_RIVER) {
        continuationPoints.push({ x: MAP_WIDTH_TILES - 1, y });
      }
    });
  }
  
  // Check west edge for rivers coming from the west
  if (neighboringEdges.west) {
    neighboringEdges.west.forEach((tile, y) => {
      if (tile.biome === BiomeType.RIVER || tile.biome === BiomeType.MAJOR_RIVER) {
        continuationPoints.push({ x: 0, y });
      }
    });
  }
  
  return continuationPoints;
}

export function findRiverSources(tiles: Tile[][], randomNoise: ValueNoise, archetype: MapArchetype, climate: ClimateType): Point[] {
  const potentialSources: Point[] = [];
  for (let y = 0; y < MAP_HEIGHT_TILES; y++) {
    for (let x = 0; x < MAP_WIDTH_TILES; x++) {
      if (archetype === MapArchetype.RIVER_PORT) {
        // For RIVER_PORT, sources will be handled by findEdgeRiverSource
        continue; 
      }
      if (archetype === MapArchetype.FRESHWATER_LAKE) { 
        const lakeRadius = Math.min(MAP_WIDTH_TILES, MAP_HEIGHT_TILES) * (0.20 + randomNoise.random() * 0.15); // Use a dynamic radius for check
        const distToCenter = Math.hypot(x - MAP_WIDTH_TILES/2, y - MAP_HEIGHT_TILES/2);
        // Ensure sources are not within the lake itself or too close to its likely core
        if (distToCenter < lakeRadius * 1.3 || (tiles[y][x].biome === BiomeType.FRESHWATER_LAKE)) continue; 
      }
       if (archetype === MapArchetype.BAY) {
        const bayCenterX = MAP_WIDTH_TILES / 2;
        const bayCenterY = MAP_HEIGHT_TILES / 2;
        const bayWaterCoreRadiusBase = Math.min(MAP_WIDTH_TILES, MAP_HEIGHT_TILES) * BAY_WATER_RATIO * 0.40; // Approx bay radius
        if (Math.hypot(x - bayCenterX, y - bayCenterY) < bayWaterCoreRadiusBase * 1.5) continue; // Avoid sources too close to bay center
      }


      if (tiles[y][x].isLand && 
          (tiles[y][x].biome === BiomeType.HILLS || tiles[y][x].biome === BiomeType.MOUNTAIN || tiles[y][x].biome === BiomeType.HIGH_PEAK || tiles[y][x].biome === BiomeType.SNOW) &&
          tiles[y][x].altitude >= RIVER_MIN_ALTITUDE_SOURCE && tiles[y][x].biome !== BiomeType.ESTUARY && tiles[y][x].biome !== BiomeType.FRESHWATER_LAKE && tiles[y][x].biome !== BiomeType.CLIFF) {
        potentialSources.push({ x, y });
      }
    }
  }
  potentialSources.sort((a, b) => { 
    const altDiff = tiles[b.y][b.x].altitude - tiles[a.y][a.x].altitude;
    if (altDiff !== 0) return altDiff;
    return randomNoise.random() - 0.5;
  });
  
  const sourceModifier = CLIMATE_RIVER_SOURCE_MODIFIERS[climate] || 1.0;
  let numSources = Math.floor((RIVER_MIN_SOURCES_BASE + Math.floor(randomNoise.random() * (RIVER_MAX_SOURCES_BASE - RIVER_MIN_SOURCES_BASE + 1))) * sourceModifier);
  
  if (archetype === MapArchetype.BAY) {
      numSources = 2 + Math.floor(randomNoise.random() * 3); // 2-4 rivers for Bay
  } else if (climate === ClimateType.ARID) {
      numSources = Math.floor(numSources * 0.3); 
  } else if (archetype === MapArchetype.ATOLL || archetype === MapArchetype.OPEN_OCEAN || archetype === MapArchetype.SHOALS || archetype === MapArchetype.STRAITS) {
      numSources = 0; 
  }


  return potentialSources.slice(0, Math.max(archetype === MapArchetype.RIVER_PORT || archetype === MapArchetype.FRESHWATER_LAKE ? 1: 0, numSources));
}

export function findEdgeRiverSource(tiles: Tile[][], randomNoise: ValueNoise, harborSide: number): Point | null {
    let startX = 0, startY = 0;
    const edgeMargin = 1; 

    let sourceEdge = -1; 
    if (harborSide === 0) sourceEdge = 0; 
    else if (harborSide === 1) sourceEdge = 1;
    else if (harborSide === 2) sourceEdge = 2; 
    else if (harborSide === 3) sourceEdge = 3; 
    
    if (sourceEdge === -1) sourceEdge = Math.floor(randomNoise.random() * 4);

    const maxAttempts = 10;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        switch (sourceEdge) {
            case 0: startX = MAP_WIDTH_TILES - 1 - edgeMargin; startY = Math.floor(randomNoise.random() * (MAP_HEIGHT_TILES - 2 * edgeMargin)) + edgeMargin; break; 
            case 1: startX = edgeMargin; startY = Math.floor(randomNoise.random() * (MAP_HEIGHT_TILES - 2 * edgeMargin)) + edgeMargin; break; 
            case 2: startY = MAP_HEIGHT_TILES - 1 - edgeMargin; startX = Math.floor(randomNoise.random() * (MAP_WIDTH_TILES - 2 * edgeMargin)) + edgeMargin; break; 
            case 3: startY = edgeMargin; startX = Math.floor(randomNoise.random() * (MAP_WIDTH_TILES - 2 * edgeMargin)) + edgeMargin; break; 
        }
        
        startX = Math.max(0, Math.min(MAP_WIDTH_TILES - 1, startX));
        startY = Math.max(0, Math.min(MAP_HEIGHT_TILES - 1, startY));

        const tile = tiles[startY][startX];
        if (!tile.isLand) {
            const directions = [{dx:0,dy:1},{dx:0,dy:-1},{dx:1,dy:0},{dx:-1,dy:0}];
            directions.sort(() => randomNoise.random() - 0.5);
            let foundLandStart = false;
            for(const dir of directions) {
                const nx = startX + dir.dx;
                const ny = startY + dir.dy;
                if (nx >=0 && nx < MAP_WIDTH_TILES && ny >=0 && ny < MAP_HEIGHT_TILES && tiles[ny][nx].isLand && tiles[ny][nx].biome !== BiomeType.MOUNTAIN && tiles[ny][nx].biome !== BiomeType.HIGH_PEAK && tiles[ny][nx].biome !== BiomeType.SNOW && tiles[ny][nx].biome !== BiomeType.ACTIVE_LAVA && tiles[ny][nx].biome !== BiomeType.ESTUARY && tiles[ny][nx].biome !== BiomeType.FRESHWATER_LAKE && tiles[ny][nx].biome !== BiomeType.CLIFF) {
                    startX = nx; startY = ny; foundLandStart = true; break;
                }
            }
            if(!foundLandStart) continue; 
        }
        
        if (tiles[startY][startX].biome === BiomeType.MOUNTAIN || tiles[startY][startX].biome === BiomeType.HIGH_PEAK || tiles[startY][startX].biome === BiomeType.SNOW || tiles[startY][startX].biome === BiomeType.ACTIVE_LAVA || tiles[startY][startX].biome === BiomeType.ESTUARY || tiles[startY][startX].biome === BiomeType.FRESHWATER_LAKE || tiles[startY][startX].biome === BiomeType.CLIFF) continue; 
        if (tiles[startY][startX].altitude < ALTITUDE_LEVELS.GRASSLAND_LOWER_MAX) {
            tiles[startY][startX].altitude = ALTITUDE_LEVELS.GRASSLAND_LOWER_MAX + 0.01 + randomNoise.random() * 0.02;
        }
        if (tiles[startY][startX].biome === BiomeType.BEACH) tiles[startY][startX].biome = BiomeType.GRASSLAND;
        return { x: startX, y: startY };
    }
    return null; 
}

export function getPrimaryDrainageTarget(tiles: Tile[][], archetype: MapArchetype, harborSide?: number, riverStart?: Point, oceanEdge?: number): Point | null {
  const lakeCenter = { x: Math.floor(MAP_WIDTH_TILES / 2), y: Math.floor(MAP_HEIGHT_TILES / 2) };
  const oceanBiomes = [BiomeType.DEEP_OCEAN, BiomeType.SHALLOW_OCEAN];
  
  if (archetype === MapArchetype.FRESHWATER_LAKE) {
    return lakeCenter;
  }

  if (archetype === MapArchetype.RIVER_PORT && riverStart) {
    const targetX = riverStart.x < MAP_WIDTH_TILES / 2 ? MAP_WIDTH_TILES - 1 : 0;
    let targetY = riverStart.y; 
    if (riverStart.y < MAP_HEIGHT_TILES * 0.25 || riverStart.y > MAP_HEIGHT_TILES * 0.75) {
        targetY = Math.floor(MAP_HEIGHT_TILES / 2);
    }
    return { x: targetX, y: targetY };
  }
  
  if (archetype === MapArchetype.DELTA && oceanEdge !== undefined) {
      const targets: Point[] = [];
      if (oceanEdge === 0) { // South edge is ocean
          for(let x=0; x < MAP_WIDTH_TILES; x++) if(!tiles[MAP_HEIGHT_TILES-1][x].isLand) targets.push({x, y: MAP_HEIGHT_TILES - 1});
      } else if (oceanEdge === 1) { // North edge is ocean
          for(let x=0; x < MAP_WIDTH_TILES; x++) if(!tiles[0][x].isLand) targets.push({x, y: 0});
      } else if (oceanEdge === 2) { // East edge is ocean
          for(let y=0; y < MAP_HEIGHT_TILES; y++) if(!tiles[y][MAP_WIDTH_TILES-1].isLand) targets.push({x: MAP_WIDTH_TILES-1, y});
      } else { // West edge is ocean
          for(let y=0; y < MAP_HEIGHT_TILES; y++) if(!tiles[y][0].isLand) targets.push({x: 0, y});
      }
      if (targets.length > 0) return targets[Math.floor(Math.random() * targets.length)];
  }

  let potentialTargets: Point[] = [];

  if (archetype === MapArchetype.BAY) {
    const bayCenterX = MAP_WIDTH_TILES/2;
    const bayCenterY = MAP_HEIGHT_TILES/2;
    const bayRadius = Math.min(MAP_WIDTH_TILES, MAP_HEIGHT_TILES) * BAY_WATER_RATIO * 0.6; 
    for(let y=0; y<MAP_HEIGHT_TILES; y++) {
        for(let x=0; x<MAP_WIDTH_TILES; x++) {
            if (!tiles[y][x].isLand && (oceanBiomes.includes(tiles[y][x].biome) || tiles[y][x].biome === BiomeType.ESTUARY)) {
                if (Math.hypot(x - bayCenterX, y - bayCenterY) < bayRadius * 1.8) { 
                    potentialTargets.push({x,y});
                }
            }
        }
    }
  } else { 
      const targetOppositeEdge = true; 

      if (harborSide !== undefined && targetOppositeEdge) {
          if (harborSide === 0) { 
              for (let y = 0; y < MAP_HEIGHT_TILES; y++) if (oceanBiomes.includes(tiles[y][0].biome)) potentialTargets.push({ x: 0, y });
          } else if (harborSide === 1) { 
              for (let y = 0; y < MAP_HEIGHT_TILES; y++) if (oceanBiomes.includes(tiles[y][MAP_WIDTH_TILES - 1].biome)) potentialTargets.push({ x: MAP_WIDTH_TILES - 1, y });
          } else if (harborSide === 2) { 
              for (let x = 0; x < MAP_WIDTH_TILES; x++) if (oceanBiomes.includes(tiles[0][x].biome)) potentialTargets.push({ x, y: 0 });
          } else { 
              for (let x = 0; x < MAP_WIDTH_TILES; x++) if (oceanBiomes.includes(tiles[MAP_HEIGHT_TILES - 1][x].biome)) potentialTargets.push({ x, y: MAP_HEIGHT_TILES - 1 });
          }
      }

      if (potentialTargets.length === 0) { 
          for (let y = 0; y < MAP_HEIGHT_TILES; y++) {
              if (oceanBiomes.includes(tiles[y][0].biome)) potentialTargets.push({ x: 0, y });
              if (oceanBiomes.includes(tiles[y][MAP_WIDTH_TILES - 1].biome)) potentialTargets.push({ x: MAP_WIDTH_TILES - 1, y });
          }
          for (let x = 0; x < MAP_WIDTH_TILES; x++) {
              if (oceanBiomes.includes(tiles[0][x].biome)) potentialTargets.push({ x, y: 0 });
              if (oceanBiomes.includes(tiles[MAP_HEIGHT_TILES - 1][x].biome)) potentialTargets.push({ x, y: MAP_HEIGHT_TILES - 1 });
          }
      }
  }
  
  if (potentialTargets.length === 0 && riverStart) { 
       for (let y = 0; y < MAP_HEIGHT_TILES; y++) {
          for (let x = 0; x < MAP_WIDTH_TILES; x++) {
              if (oceanBiomes.includes(tiles[y][x].biome) || tiles[y][x].biome === BiomeType.ESTUARY) {
                  potentialTargets.push({ x, y });
              }
          }
      }
  }

  if (potentialTargets.length === 0) return lakeCenter; 

  potentialTargets.sort((a, b) => {
      let scoreA = 0; let scoreB = 0;
      if(riverStart) {
          const distA = Math.hypot(a.x - riverStart.x, a.y - riverStart.y);
          const distB = Math.hypot(b.x - riverStart.x, b.y - riverStart.y);
          scoreA += distA; 
          scoreB += distB; 
          
          if (a.x === 0 || a.x === MAP_WIDTH_TILES - 1 || a.y === 0 || a.y === MAP_HEIGHT_TILES - 1) scoreA -= distA * 0.3;
          if (b.x === 0 || b.x === MAP_WIDTH_TILES - 1 || b.y === 0 || b.y === MAP_HEIGHT_TILES - 1) scoreB -= distB * 0.3;
      }
      
      if (oceanBiomes.includes(tiles[a.y][a.x].biome) && tiles[b.y][b.x].biome === BiomeType.ESTUARY) scoreA -= 50;
      if (tiles[a.y][a.x].biome === BiomeType.ESTUARY && oceanBiomes.includes(tiles[b.y][b.x].biome)) scoreB -= 50;
      
      return scoreA - scoreB;
  });

  return potentialTargets[0];
}


function calculateDirectionScore(
    tiles: Tile[][], current: Point, direction: Point, 
    drainageTarget: Point | null, prevDirection: Point | null, 
    pathLength: number, archetype: MapArchetype, isDesignatedWideRiver: boolean = false
): number {
    const nx = current.x + direction.x;
    const ny = current.y + direction.y;

    if (nx < 0 || nx >= MAP_WIDTH_TILES || ny < 0 || ny >= MAP_HEIGHT_TILES) return -Infinity; 

    const currentTile = tiles[current.y][current.x];
    const neighborTile = tiles[ny][nx];

    if (neighborTile.biome === BiomeType.ACTIVE_LAVA || neighborTile.biome === BiomeType.ESTUARY || neighborTile.biome === BiomeType.CLIFF) return -Infinity; 

    let score = 0;

    const altitudeDrop = currentTile.altitude - neighborTile.altitude;
    if (altitudeDrop > 0) {
        score += altitudeDrop * 2000; 
    } else {
        score += altitudeDrop * 3000; 
        if (altitudeDrop > -0.005 && pathLength > 5) score += 100; 
        else return -Infinity; 
    }
    
    if (drainageTarget) {
        const currentDistToTarget = Math.hypot(current.x - drainageTarget.x, current.y - drainageTarget.y);
        const newDistToTarget = Math.hypot(nx - drainageTarget.x, ny - drainageTarget.y);
        let targetFactor = isDesignatedWideRiver ? 120 : 60;
        if (archetype === MapArchetype.RIVER_PORT && isDesignatedWideRiver) targetFactor = 250; // Stronger pull for main channel
        score += (currentDistToTarget - newDistToTarget) * targetFactor; 
    }

    if (prevDirection) {
        if (direction.x === prevDirection.x && direction.y === prevDirection.y) {
            score += (isDesignatedWideRiver ? 60 : 35); 
        } else if (direction.x === -prevDirection.x && direction.y === -prevDirection.y) {
            score -= (isDesignatedWideRiver ? 180 : 120); 
        }
    }
    
    if (prevDirection && pathLength > 2) {
        const grandPrevTile = tiles[current.y - prevDirection.y]?.[current.x - prevDirection.x];
        if (grandPrevTile) {
            const dotProduct = direction.x * prevDirection.x + direction.y * prevDirection.y;
            if (dotProduct === 0) score -= (isDesignatedWideRiver ? 50 : 30); 
        }
    }

    const waterTerminationBiomes = [BiomeType.MAJOR_RIVER, BiomeType.SHALLOW_OCEAN, BiomeType.DEEP_OCEAN, BiomeType.OASIS, BiomeType.WETLANDS, BiomeType.HOT_SPRINGS, BiomeType.FRESHWATER_LAKE];
    
    if (waterTerminationBiomes.includes(neighborTile.biome) && !neighborTile.isLand) {
        score += 1000; 
    } else if (neighborTile.biome === BiomeType.SHOALS_TILE && !neighborTile.isLand) {
        score += 500; 
    } else if (neighborTile.biome === BiomeType.RIVER && neighborTile !== currentTile) { 
        score += 200;
    }
    
    if (neighborTile.biome === BiomeType.RIVER && score < 150) { 
        score -= 100;
    }

    score += Math.random() * 5; 

    return score;
}


function placeRiverTileWithWidth(
    tiles: Tile[][], x: number, y: number, width: number, 
    path: Point[], isPrimaryChannel: boolean, archetype: MapArchetype
): void {
  const baseAltitude = tiles[y][x].altitude; 
  const isRiverPortMain = (archetype === MapArchetype.RIVER_PORT && isPrimaryChannel);
  
  for (let dy = -Math.floor(width/2); dy <= Math.ceil(width/2)-1; dy++) {
    for (let dx = -Math.floor(width/2); dx <= Math.ceil(width/2)-1; dx++) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && nx < MAP_WIDTH_TILES && ny >= 0 && ny < MAP_HEIGHT_TILES) {
        if (Math.sqrt(dx * dx + dy * dy) <= width / 2) {
          const tileToChange = tiles[ny][nx];
          
          const uncarvableBlockers = [BiomeType.ACTIVE_LAVA, BiomeType.ESTUARY, BiomeType.CLIFF];
          if (uncarvableBlockers.includes(tileToChange.biome) || 
              (tileToChange.biome === BiomeType.FRESHWATER_LAKE && !isRiverPortMain) ) {
                continue;
          }

          let riverBiomeType = BiomeType.RIVER;
          if (isRiverPortMain || (isPrimaryChannel && path.length > 15)) {
              riverBiomeType = BiomeType.MAJOR_RIVER;
          }
          
          tileToChange.biome = riverBiomeType;
          tileToChange.isLand = false;
          
          let prevRiverTileAltitude = baseAltitude;
          if (path.length > 0) { 
            const prevPathPoint = path[path.length -1];
            prevRiverTileAltitude = tiles[prevPathPoint.y][prevPathPoint.x].altitude;
          } else { 
            prevRiverTileAltitude = tileToChange.altitude + 0.01; 
          }
          
          tileToChange.altitude = Math.max(ALTITUDE_LEVELS.SEA * 0.05, Math.min(prevRiverTileAltitude - 0.001, baseAltitude - 0.005));
        }
      }
    }
  }
}


function createOxbowLake(tiles: Tile[][], path: Point[], current: Point, randomNoise: ValueNoise): Point | null {
  if (path.length < 15) return null;
  for (let i = 0; i < path.length - 10; i++) {
    const oldPoint = path[i];
    const distance = Math.hypot(current.x - oldPoint.x, current.y - oldPoint.y);
    if (distance < 8 && distance > 3) { 
      const midX = Math.floor((current.x + oldPoint.x) / 2); 
      const midY = Math.floor((current.y + oldPoint.y) / 2);
      if (midX >= 0 && midX < MAP_WIDTH_TILES && midY >= 0 && midY < MAP_HEIGHT_TILES) {
        if (tiles[midY][midX].isLand && tiles[midY][midX].biome !== BiomeType.RIVER && tiles[midY][midX].biome !== BiomeType.ACTIVE_LAVA && tiles[midY][midX].biome !== BiomeType.ESTUARY && tiles[midY][midX].biome !== BiomeType.FRESHWATER_LAKE && tiles[midY][midX].biome !== BiomeType.CLIFF) {
            return { x: oldPoint.x, y: oldPoint.y }; 
        }
      }
    }
  }
  return null;
}

function createOxbowLakeFeature(tiles: Tile[][], oxbowPath: Point[], randomNoise: ValueNoise): void {
    oxbowPath.forEach(p => {
        const tile = tiles[p.y][p.x];
        if (tile.biome === BiomeType.RIVER) { 
            tile.biome = BiomeType.FRESHWATER_LAKE; 
            tile.isLand = false;
            tile.altitude = ALTITUDE_LEVELS.SEA * (0.5 + randomNoise.random() * 0.2); 
        }
    });
}


export function generateEnhancedRiverPath(
    tiles: Tile[][], 
    start: Point, 
    randomNoise: ValueNoise, 
    meanderNoise: ValueNoise, 
    widthNoise: ValueNoise, 
    archetype: MapArchetype, 
    harborSide?: number,
    isTributary: boolean = false,
    isDesignatedWideRiver: boolean = false,
    oceanEdge?: number
): boolean { 
    let current = { ...start };
    const path: Point[] = [];
    const drainageTarget = getPrimaryDrainageTarget(tiles, archetype, harborSide, start, oceanEdge);

    let prevDirection: Point | null = null;
    
    let baseRiverWidth = 1;
    if (isTributary) {
        baseRiverWidth = 1.0 + widthNoise.random() * 0.4; 
    } else if (isDesignatedWideRiver) {
        baseRiverWidth = 2.8 + widthNoise.random() * 0.8; 
    } else {
        baseRiverWidth = 1.5 + widthNoise.random() * 0.6; 
    }


    const waterTerminationBiomes = new Set([
        BiomeType.DEEP_OCEAN, BiomeType.SHALLOW_OCEAN, BiomeType.MAJOR_RIVER, 
        BiomeType.OASIS, BiomeType.WETLANDS, BiomeType.HOT_SPRINGS, BiomeType.ESTUARY,
        BiomeType.FRESHWATER_LAKE 
    ]);

    let successfullyTerminated = false;

    for (let i = 0; i < RIVER_MAX_LENGTH * (isDesignatedWideRiver ? 1.5 : 1); i++) {
        if (current.x < 0 || current.x >= MAP_WIDTH_TILES || current.y < 0 || current.y >= MAP_HEIGHT_TILES) break; 

        const currentTile = tiles[current.y][current.x];
        if (currentTile.biome === BiomeType.ACTIVE_LAVA || currentTile.biome === BiomeType.ESTUARY || currentTile.biome === BiomeType.CLIFF) break;

        const isAtMapEdge = (current.x === 0 || current.x === MAP_WIDTH_TILES - 1 || current.y === 0 || current.y >= MAP_HEIGHT_TILES - 1);
        const isWaterTileForTermination = (!currentTile.isLand && waterTerminationBiomes.has(currentTile.biome)) || (currentTile.biome === BiomeType.SHOALS_TILE && !currentTile.isLand);
        
        if (archetype === MapArchetype.RIVER_PORT && isDesignatedWideRiver) {
            if (isAtMapEdge && isWaterTileForTermination) {
                successfullyTerminated = true;
                break;
            }
        } else if (isWaterTileForTermination) {
             if (path.length > 0) { 
                const prevPathTile = tiles[path[path.length-1].y][path[path.length-1].x];
                if(prevPathTile.isLand) {
                    prevPathTile.isCoast = true;
                    if (currentTile.biome === BiomeType.FRESHWATER_LAKE) { 
                        tiles[path[path.length-1].y][path[path.length-1].x].isCoast = true;
                    }
                }

                if (archetype === MapArchetype.BAY && !isTributary) {
                    const deltaRadius = 2 + Math.floor(randomNoise.random()*2);
                    for (let dy = -deltaRadius; dy <= deltaRadius; dy++) {
                        for (let dx = -deltaRadius; dx <= deltaRadius; dx++) {
                            if (Math.hypot(dx,dy) > deltaRadius) continue;
                            const checkX = prevPathTile.x + dx;
                            const checkY = prevPathTile.y + dy;
                            if(checkX >= 0 && checkX < MAP_WIDTH_TILES && checkY >= 0 && checkY < MAP_HEIGHT_TILES) {
                                const deltaTile = tiles[checkY][checkX];
                                if (deltaTile.isLand && (deltaTile.biome === BiomeType.GRASSLAND || deltaTile.biome === BiomeType.BEACH || deltaTile.biome === BiomeType.SCRUB)) {
                                    if (randomNoise.random() < 0.4 / (Math.hypot(dx,dy)+1)) {
                                        deltaTile.biome = BiomeType.RIVERBANK; 
                                        deltaTile.altitude = Math.min(deltaTile.altitude, ALTITUDE_LEVELS.BEACH + 0.01);
                                    }
                                } else if (!deltaTile.isLand && (deltaTile.biome === BiomeType.SHALLOW_OCEAN || deltaTile.biome === BiomeType.ESTUARY)) {
                                    if (randomNoise.random() < 0.2 / (Math.hypot(dx,dy)+1)) {
                                         deltaTile.biome = BiomeType.SHOALS_TILE; 
                                         deltaTile.altitude = ALTITUDE_LEVELS.SEA * (0.6 + randomNoise.random()*0.2);
                                    }
                                }
                            }
                        }
                    }
                }
            }
            successfullyTerminated = true;
            break;
        }
        
        const nonOverwritableBiomes = new Set([BiomeType.HAMLET, BiomeType.LOW_DENSITY_CITY, BiomeType.DENSE_CITY, BiomeType.URBAN, BiomeType.RUINS, BiomeType.ACTIVE_LAVA, BiomeType.ESTUARY, BiomeType.CLIFF]);
        if (archetype === MapArchetype.RIVER_PORT && isDesignatedWideRiver) {
            if (nonOverwritableBiomes.has(currentTile.biome) && currentTile.biome !== BiomeType.MAJOR_RIVER && currentTile.biome !== BiomeType.FRESHWATER_LAKE) break;
        } else {
             if (currentTile.biome !== BiomeType.RIVER && nonOverwritableBiomes.has(currentTile.biome)) {
                 if (!(currentTile.biome === BiomeType.MAJOR_RIVER && (!isTributary || isDesignatedWideRiver))) { 
                     break;
                }
            }
        }
        
        path.push({ ...current });
        const currentRiverWidth = Math.max(1, Math.floor(baseRiverWidth * (0.8 + widthNoise.random() * 0.4)));
        placeRiverTileWithWidth(tiles, current.x, current.y, currentRiverWidth, path, isDesignatedWideRiver, archetype);

        if (archetype === MapArchetype.DELTA && isDesignatedWideRiver && !isTributary) {
            let isNearSea = false;
            if (oceanEdge !== undefined) {
                switch(oceanEdge){
                    case 0: if (current.y > MAP_HEIGHT_TILES * 0.7) isNearSea = true; break; // South ocean
                    case 1: if (current.y < MAP_HEIGHT_TILES * 0.3) isNearSea = true; break; // North ocean
                    case 2: if (current.x > MAP_WIDTH_TILES * 0.7) isNearSea = true; break; // East ocean
                    case 3: if (current.x < MAP_WIDTH_TILES * 0.3) isNearSea = true; break; // West ocean
                }
            }
            if(isNearSea && path.length > 5 && randomNoise.random() < 0.15) { // Chance to branch
                generateEnhancedRiverPath(tiles, {...current}, randomNoise, meanderNoise, widthNoise, archetype, harborSide, true, false, oceanEdge);
                generateEnhancedRiverPath(tiles, {...current}, randomNoise, meanderNoise, widthNoise, archetype, harborSide, true, false, oceanEdge);
            }
        }

        if (!isTributary && path.length > 20 && randomNoise.random() < RIVER_OXBOW_CHANCE * 0.8) {
            const oxbowReconnectPoint = createOxbowLake(tiles, path, current, randomNoise);
            if (oxbowReconnectPoint) {
                const cutOffStartIndex = path.findIndex(p => p.x === oxbowReconnectPoint.x && p.y === oxbowReconnectPoint.y);
                if (cutOffStartIndex !== -1 && cutOffStartIndex < path.length - 5) { 
                    const oxbowPathSegment = path.splice(cutOffStartIndex + 1); 
                    createOxbowLakeFeature(tiles, oxbowPathSegment, randomNoise);
                    current = { ...oxbowReconnectPoint }; 
                }
            }
        }
        
        const effectiveTributaryChance = archetype === MapArchetype.BAY && !isTributary ? RIVER_TRIBUTARY_CHANCE + 0.15 : RIVER_TRIBUTARY_CHANCE;
        if (!isTributary && !isDesignatedWideRiver && path.length > 10 && path.length < RIVER_MAX_LENGTH * 0.7 && randomNoise.random() < effectiveTributaryChance * 0.1) {
            generateEnhancedRiverPath(tiles, {...current}, randomNoise, meanderNoise, widthNoise, archetype, harborSide, true, false);
        }

        const directions: Point[] = [ {x: 0, y: -1}, {x: 1, y: 0}, {x: 0, y: 1}, {x: -1, y: 0}, {x: 1, y: -1}, {x: 1, y: 1}, {x: -1, y: 1}, {x: -1, y: -1} ];
        directions.sort(() => randomNoise.random() - 0.5); 

        let bestNextPoint: Point | null = null;
        let maxScore = -Infinity;

        for (const dir of directions) {
            const score = calculateDirectionScore(tiles, current, dir, drainageTarget, prevDirection, path.length, archetype, isDesignatedWideRiver);
            if (score > maxScore) {
                maxScore = score;
                bestNextPoint = { x: current.x + dir.x, y: current.y + dir.y };
                prevDirection = { ...dir }; 
            }
        }

        if (bestNextPoint) {
            if (path.length > 5 && prevDirection && randomNoise.random() < RIVER_SINUOSITY_FACTOR) {
                const meanderVal = meanderNoise.noise(current.x * RIVER_MEANDER_FREQUENCY, current.y * RIVER_MEANDER_FREQUENCY);
                if (meanderVal < 0.33 && prevDirection.x !== 0) { 
                    const potentialTurns = [{x:0, y:1}, {x:0,y:-1}];
                    potentialTurns.sort(() => randomNoise.random() - 0.5);
                    for(const turnDir of potentialTurns) {
                        const turnScore = calculateDirectionScore(tiles, current, turnDir, drainageTarget, prevDirection, path.length, archetype, isDesignatedWideRiver);
                        if (turnScore > maxScore * 0.7) { 
                            bestNextPoint = {x: current.x + turnDir.x, y: current.y + turnDir.y};
                            prevDirection = {...turnDir};
                            break;
                        }
                    }
                } else if (meanderVal > 0.66 && prevDirection.y !== 0) { 
                     const potentialTurns = [{x:1, y:0}, {x:-1,y:0}];
                    potentialTurns.sort(() => randomNoise.random() - 0.5);
                    for(const turnDir of potentialTurns) {
                        const turnScore = calculateDirectionScore(tiles, current, turnDir, drainageTarget, prevDirection, path.length, archetype, isDesignatedWideRiver);
                        if (turnScore > maxScore * 0.7) {
                            bestNextPoint = {x: current.x + turnDir.x, y: current.y + turnDir.y};
                            prevDirection = {...turnDir};
                            break;
                        }
                    }
                }
            }
             if (bestNextPoint) current = bestNextPoint; 
             else break; 
        } else {
            break; 
        }
    }
    if (path.length > 0 && !successfullyTerminated) { 
        const lastRiverPoint = path[path.length -1];
        const lrTile = tiles[lastRiverPoint.y][lastRiverPoint.x];
        if (lrTile && lrTile.biome !== BiomeType.DEEP_OCEAN && lrTile.biome !== BiomeType.SHALLOW_OCEAN && lrTile.biome !== BiomeType.ESTUARY && lrTile.biome !== BiomeType.FRESHWATER_LAKE) { 
            for(let dy=-1; dy<=1; dy++){
                for(let dx=-1; dx<=1; dx++){
                    if(dx===0 && dy===0) continue;
                    const nx = lastRiverPoint.x + dx;
                    const ny = lastRiverPoint.y + dy;
                    if(nx>=0 && nx<MAP_WIDTH_TILES && ny>=0 && ny<MAP_HEIGHT_TILES && !tiles[ny][nx].isLand && (tiles[ny][nx].biome === BiomeType.SHALLOW_OCEAN || tiles[ny][nx].biome === BiomeType.DEEP_OCEAN || tiles[ny][nx].biome === BiomeType.ESTUARY || tiles[ny][nx].biome === BiomeType.FRESHWATER_LAKE)) {
                         lrTile.isCoast = true;
                         successfullyTerminated = true; 
                         break;
                    }
                }
                if(lrTile.isCoast) break;
            }
        }
    }
    return successfullyTerminated;
}

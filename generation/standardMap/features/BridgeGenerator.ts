/**
 * generation/standardMap/features/BridgeGenerator.ts
 * Automatic bridge generation at road/path water crossings
 */

import {
  Tile,
  MapData,
  Point,
  BiomeType,
  PathType,
  PathObject,
  TerrainStructure,
  HistoricalEra,
} from '../../../types/index';
import {
  MAP_WIDTH_TILES,
  MAP_HEIGHT_TILES,
  TILE_SIZE_PX,
} from '../../../constants/index';

interface BridgeCandidate {
  start: Point;
  end: Point;
  waterTiles: Point[];
  pathType: PathType;
  priority: number;
  direction: 'horizontal' | 'vertical' | 'diagonal';
}

export interface Bridge {
  id: string;
  start: Point;
  end: Point;
  waterTiles: Point[];
  type: 'wooden' | 'stone' | 'iron' | 'modern';
  style: string; // Cultural variant
  width: number; // In tiles
  svgPath?: string; // For custom rendering
}

const isWaterTile = (tile: Tile): boolean => {
  return !tile.isLand ||
         tile.biome === BiomeType.RIVER ||
         tile.biome === BiomeType.MAJOR_RIVER ||
         tile.biome === BiomeType.FRESHWATER_LAKE ||
         tile.biome === BiomeType.ESTUARY;
};

const inBounds = (x: number, y: number): boolean => {
  return x >= 0 && y >= 0 && x < MAP_WIDTH_TILES && y < MAP_HEIGHT_TILES;
};

// Bridge density controls (Phase 2)
const MIN_BRIDGE_SPACING_TILES = 15; // Minimum distance between bridges
const MAX_BRIDGES_PER_MAP = 8; // Maximum total bridges on any map

/**
 * Score a potential bridge location based on quality metrics
 * Higher score = better bridge placement
 */
function scoreBridgeLocation(
  tiles: Tile[][],
  start: Point,
  end: Point,
  waterTiles: Point[],
  approachAngle?: number
): number {
  let score = 1000; // Start with base score

  // 1. Length scoring - prefer shorter bridges
  const length = Math.hypot(end.x - start.x, end.y - start.y);
  const lengthPenalty = length / TILE_SIZE_PX * 50; // Penalty per tile
  score -= lengthPenalty;

  // 2. Perpendicular water coverage - prefer bridges with water on sides
  const bridgeVector = {
    x: end.x - start.x,
    y: end.y - start.y
  };
  const bridgeLength = Math.hypot(bridgeVector.x, bridgeVector.y);
  const dirX = bridgeVector.x / bridgeLength;
  const dirY = bridgeVector.y / bridgeLength;
  const perpX = -dirY;
  const perpY = dirX;

  let perpendicularWaterCount = 0;
  const sampleCount = Math.min(5, waterTiles.length + 2);

  for (let i = 0; i < sampleCount; i++) {
    const t = i / (sampleCount - 1);
    const sampleX = start.x + bridgeVector.x * t;
    const sampleY = start.y + bridgeVector.y * t;

    for (const side of [-1, 1]) {
      const checkX = Math.floor((sampleX + perpX * TILE_SIZE_PX * 1.5 * side) / TILE_SIZE_PX);
      const checkY = Math.floor((sampleY + perpY * TILE_SIZE_PX * 1.5 * side) / TILE_SIZE_PX);

      if (inBounds(checkX, checkY) && isWaterTile(tiles[checkY][checkX])) {
        perpendicularWaterCount++;
        break;
      }
    }
  }

  const perpendicularRatio = perpendicularWaterCount / sampleCount;
  score += perpendicularRatio * 200; // Bonus for perpendicular water

  // 3. Altitude scoring - prefer lower altitude (easier construction)
  const startTileX = Math.floor(start.x / TILE_SIZE_PX);
  const startTileY = Math.floor(start.y / TILE_SIZE_PX);
  const endTileX = Math.floor(end.x / TILE_SIZE_PX);
  const endTileY = Math.floor(end.y / TILE_SIZE_PX);

  if (inBounds(startTileX, startTileY) && inBounds(endTileX, endTileY)) {
    const startTile = tiles[startTileY][startTileX];
    const endTile = tiles[endTileY][endTileX];
    const avgAltitude = (startTile.altitude + endTile.altitude) / 2;
    score -= avgAltitude * 100; // Prefer lower altitude
  }

  // 4. Approach angle alignment - prefer bridges aligned with path direction
  if (approachAngle !== undefined) {
    const bridgeAngle = Math.atan2(bridgeVector.y, bridgeVector.x);
    const angleDiff = Math.abs(bridgeAngle - approachAngle);
    const normalizedDiff = Math.min(angleDiff, Math.PI * 2 - angleDiff); // Handle wrap-around
    score -= normalizedDiff * 50; // Penalty for misalignment
  }

  // 5. Straightness - prefer straight crossings
  let pathLength = 0;
  for (let i = 0; i < waterTiles.length - 1; i++) {
    const t1 = waterTiles[i];
    const t2 = waterTiles[i + 1];
    pathLength += Math.hypot(
      (t2.x - t1.x) * TILE_SIZE_PX,
      (t2.y - t1.y) * TILE_SIZE_PX
    );
  }
  const straightness = length / (pathLength + 0.1); // Avoid division by zero
  score += straightness * 100; // Bonus for straightness

  return score;
}

/**
 * Find optimal bridge points for a given water span
 * Searches for the best land-to-land crossing instead of blindly following path
 */
function findOptimalBridgePoints(
  tiles: Tile[][],
  waterTiles: Point[],
  pathPoints: Point[],
  waterStartIndex: number,
  waterEndIndex: number
): { start: Point; end: Point; score: number } | null {
  if (waterTiles.length === 0) return null;

  // Get land tiles just before and after water
  const landBeforeIndex = waterStartIndex - 1;
  const landAfterIndex = waterEndIndex + 1;

  if (landBeforeIndex < 0 || landAfterIndex >= pathPoints.length) return null;

  // Search area: look at tiles around the path entry/exit points
  const searchRadius = 3; // tiles
  const candidates: Array<{ start: Point; end: Point; score: number }> = [];

  const approachX = pathPoints[landBeforeIndex].x;
  const approachY = pathPoints[landBeforeIndex].y;
  const exitX = pathPoints[landAfterIndex].x;
  const exitY = pathPoints[landAfterIndex].y;

  // Calculate approach angle from path
  const approachAngle = Math.atan2(
    pathPoints[waterStartIndex].y - pathPoints[landBeforeIndex].y,
    pathPoints[waterStartIndex].x - pathPoints[landBeforeIndex].x
  );

  // Try different start/end combinations within search radius
  for (let startDx = -searchRadius; startDx <= searchRadius; startDx++) {
    for (let startDy = -searchRadius; startDy <= searchRadius; startDy++) {
      const startX = Math.floor(approachX / TILE_SIZE_PX) + startDx;
      const startY = Math.floor(approachY / TILE_SIZE_PX) + startDy;

      if (!inBounds(startX, startY)) continue;

      const startTile = tiles[startY][startX];
      if (!startTile.isLand) continue; // Must start on land

      for (let endDx = -searchRadius; endDx <= searchRadius; endDx++) {
        for (let endDy = -searchRadius; endDy <= searchRadius; endDy++) {
          const endX = Math.floor(exitX / TILE_SIZE_PX) + endDx;
          const endY = Math.floor(exitY / TILE_SIZE_PX) + endDy;

          if (!inBounds(endX, endY)) continue;

          const endTile = tiles[endY][endX];
          if (!endTile.isLand) continue; // Must end on land

          // Calculate candidate bridge
          const startPx = { x: startX * TILE_SIZE_PX + TILE_SIZE_PX / 2, y: startY * TILE_SIZE_PX + TILE_SIZE_PX / 2 };
          const endPx = { x: endX * TILE_SIZE_PX + TILE_SIZE_PX / 2, y: endY * TILE_SIZE_PX + TILE_SIZE_PX / 2 };

          // Check distance - must span 1-4 tiles
          const distance = Math.hypot(endPx.x - startPx.x, endPx.y - startPx.y);
          const tileDistance = distance / TILE_SIZE_PX;
          if (tileDistance < 1 || tileDistance > 4.5) continue;

          // Find water tiles this bridge would cross
          const bridgeWaterTiles = findWaterTilesAlongLine(tiles, startPx, endPx);
          if (bridgeWaterTiles.length === 0 || bridgeWaterTiles.length > 4) continue;

          // Score this candidate
          const score = scoreBridgeLocation(tiles, startPx, endPx, bridgeWaterTiles, approachAngle);
          candidates.push({ start: startPx, end: endPx, score });
        }
      }
    }
  }

  // Return best candidate
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => b.score - a.score);
  return candidates[0];
}

/**
 * Find water tiles along a straight line between two points
 */
function findWaterTilesAlongLine(tiles: Tile[][], start: Point, end: Point): Point[] {
  const waterTiles: Point[] = [];
  const steps = Math.ceil(Math.hypot(end.x - start.x, end.y - start.y) / (TILE_SIZE_PX / 2));

  const seenTiles = new Set<string>();

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = start.x + (end.x - start.x) * t;
    const y = start.y + (end.y - start.y) * t;

    const tileX = Math.floor(x / TILE_SIZE_PX);
    const tileY = Math.floor(y / TILE_SIZE_PX);
    const key = `${tileX},${tileY}`;

    if (seenTiles.has(key)) continue;
    seenTiles.add(key);

    if (!inBounds(tileX, tileY)) continue;

    const tile = tiles[tileY][tileX];
    if (isWaterTile(tile)) {
      waterTiles.push({ x: tileX, y: tileY });
    }
  }

  return waterTiles;
}

/**
 * Validate bridge placement - comprehensive checks to reject bad bridges
 * Rejects bridges that:
 * - Don't have solid land endpoints
 * - Run parallel to coastlines
 * - Curve too much (not straight)
 * - Connect the same landmass (peninsula bridges)
 */
function validateBridgePlacement(
  tiles: Tile[][],
  candidate: BridgeCandidate
): boolean {
  // Check 1: Verify both endpoints are on SOLID LAND (not water, not edge biomes)
  const startTileX = Math.floor(candidate.start.x / TILE_SIZE_PX);
  const startTileY = Math.floor(candidate.start.y / TILE_SIZE_PX);
  const endTileX = Math.floor(candidate.end.x / TILE_SIZE_PX);
  const endTileY = Math.floor(candidate.end.y / TILE_SIZE_PX);

  if (!inBounds(startTileX, startTileY) || !inBounds(endTileX, endTileY)) {
    return false;
  }

  const startTile = tiles[startTileY][startTileX];
  const endTile = tiles[endTileY][endTileX];

  // Both endpoints must be solid land
  if (!startTile.isLand || !endTile.isLand) {
    return false;
  }

  // Reject if endpoints are problematic edge biomes
  const edgeBiomes = [BiomeType.RIVERBANK, BiomeType.BEACH, BiomeType.MANGROVE];
  if (edgeBiomes.includes(startTile.biome) || edgeBiomes.includes(endTile.biome)) {
    return false;
  }

  // Check 2: Straightness requirement - bridge path shouldn't curve too much
  const directDistance = Math.hypot(
    candidate.end.x - candidate.start.x,
    candidate.end.y - candidate.start.y
  );

  // Calculate actual path length by summing water tile distances
  let pathLength = 0;
  for (let i = 0; i < candidate.waterTiles.length - 1; i++) {
    const t1 = candidate.waterTiles[i];
    const t2 = candidate.waterTiles[i + 1];
    pathLength += Math.hypot(
      (t2.x - t1.x) * TILE_SIZE_PX,
      (t2.y - t1.y) * TILE_SIZE_PX
    );
  }

  // If path is more than 30% longer than direct line, it's too curved
  if (pathLength > directDistance * 1.3) {
    return false;
  }

  // Check 3: Perpendicular water along ENTIRE bridge span
  // Sample multiple points along the bridge to verify perpendicular water
  const bridgeVector = {
    x: candidate.end.x - candidate.start.x,
    y: candidate.end.y - candidate.start.y
  };
  const bridgeLength = Math.hypot(bridgeVector.x, bridgeVector.y);

  // Normalize bridge direction
  const dirX = bridgeVector.x / bridgeLength;
  const dirY = bridgeVector.y / bridgeLength;

  // Perpendicular direction (rotate 90 degrees)
  const perpX = -dirY;
  const perpY = dirX;

  // Sample 5 points along the bridge span
  const sampleCount = Math.min(5, candidate.waterTiles.length + 2);
  let perpendicularWaterSamples = 0;

  for (let i = 0; i < sampleCount; i++) {
    const t = i / (sampleCount - 1); // 0 to 1
    const sampleX = candidate.start.x + bridgeVector.x * t;
    const sampleY = candidate.start.y + bridgeVector.y * t;

    // Check perpendicular tiles (both sides)
    const checkDist = TILE_SIZE_PX * 1.5; // Check 1.5 tiles perpendicular

    for (const side of [-1, 1]) {
      const checkX = Math.floor((sampleX + perpX * checkDist * side) / TILE_SIZE_PX);
      const checkY = Math.floor((sampleY + perpY * checkDist * side) / TILE_SIZE_PX);

      if (inBounds(checkX, checkY)) {
        const checkTile = tiles[checkY][checkX];
        if (isWaterTile(checkTile)) {
          perpendicularWaterSamples++;
          break; // Found water on at least one side
        }
      }
    }
  }

  // Require at least 60% of samples to have perpendicular water
  const perpendicularRatio = perpendicularWaterSamples / sampleCount;
  if (perpendicularRatio < 0.6) {
    return false;
  }

  // Check 4: Two-landmass requirement (prevent peninsula bridges)
  // Use flood-fill to verify start and end are on DIFFERENT landmasses
  // (separated by water not counting the bridge's water tiles)

  // Create set of water tiles that are part of the bridge (to exclude from flood fill)
  const bridgeWaterSet = new Set<string>();
  for (const wt of candidate.waterTiles) {
    bridgeWaterSet.add(`${wt.x},${wt.y}`);
  }

  // Flood-fill from start tile through land only
  const visited = new Set<string>();
  const queue: Point[] = [{ x: startTileX, y: startTileY }];
  visited.add(`${startTileX},${startTileY}`);

  const maxFloodSize = 500; // Limit flood-fill for performance
  let iterations = 0;

  while (queue.length > 0 && iterations < maxFloodSize) {
    iterations++;
    const current = queue.shift()!;

    // Check if we reached the end tile (means same landmass - BAD)
    if (current.x === endTileX && current.y === endTileY) {
      return false; // Bridge connects same landmass
    }

    // Explore adjacent land tiles (4 cardinal directions)
    for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
      const nx = current.x + dx;
      const ny = current.y + dy;
      const key = `${nx},${ny}`;

      if (!inBounds(nx, ny) || visited.has(key)) continue;

      const neighbor = tiles[ny][nx];

      // Can traverse land, but NOT water (unless it's a bridge water tile we're ignoring)
      const isBridgeWater = bridgeWaterSet.has(key);

      if (neighbor.isLand || isBridgeWater) {
        visited.add(key);
        // Only continue flood-fill through actual land (not bridge water)
        if (neighbor.isLand) {
          queue.push({ x: nx, y: ny });
        }
      }
    }
  }

  // If we didn't reach the end tile, it means they're on different landmasses (GOOD)
  return true;
}

/**
 * Find all locations where roads/paths cross water
 */
function findWaterCrossings(
  tiles: Tile[][],
  paths: PathObject[]
): BridgeCandidate[] {
  const candidates: BridgeCandidate[] = [];
  
  // Check each path for water crossings
  paths.forEach((path, pathIndex) => {
    if (!path.svgD) return;
    
    // Parse SVG path to get points
    const points = parseSvgPathToPoints(path.svgD);
    
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      
      const tile1 = getTileAtPoint(tiles, p1);
      const tile2 = getTileAtPoint(tiles, p2);
      
      if (!tile1 || !tile2) continue;
      
      // Check if we're crossing from land to water or water to land
      const t1IsWater = isWaterTile(tile1);
      const t2IsWater = isWaterTile(tile2);
      
      if (t1IsWater !== t2IsWater) {
        // Found a crossing! Now trace the full water span
        const crossing = traceWaterCrossing(tiles, points, i);
        
        // Build bridges for 1-4 tile water crossings (short to medium spans)
        if (crossing && crossing.waterTiles.length >= 1 && crossing.waterTiles.length <= 4) {
          // Determine direction
          const dx = crossing.end.x - crossing.start.x;
          const dy = crossing.end.y - crossing.start.y;
          let direction: 'horizontal' | 'vertical' | 'diagonal' = 'diagonal';
          
          if (Math.abs(dx) > Math.abs(dy) * 2) direction = 'horizontal';
          else if (Math.abs(dy) > Math.abs(dx) * 2) direction = 'vertical';
          
          candidates.push({
            ...crossing,
            pathType: path.type,
            priority: calculatePriority(path.type, crossing.waterTiles.length),
            direction,
          });
        }
      }
    }
  });
  
  return candidates;
}

/**
 * Parse SVG path to array of points
 */
function parseSvgPathToPoints(svgPath: string): Point[] {
  const points: Point[] = [];
  const commands = svgPath.match(/[MLCQTmlcqt][^MLCQTmlcqt]*/g);
  
  if (!commands) return points;
  
  let currentX = 0;
  let currentY = 0;
  
  commands.forEach(cmd => {
    const type = cmd[0];
    const coords = cmd.slice(1).trim().split(/[\s,]+/).map(Number);
    
    if (type === 'M' || type === 'L') {
      currentX = coords[0];
      currentY = coords[1];
      points.push({ x: currentX, y: currentY });
    } else if (type === 'Q' || type === 'C') {
      // For curves, just take the end point
      currentX = coords[coords.length - 2];
      currentY = coords[coords.length - 1];
      points.push({ x: currentX, y: currentY });
    }
  });
  
  return points;
}

/**
 * Get tile at a pixel point
 */
function getTileAtPoint(tiles: Tile[][], point: Point): Tile | null {
  const tileX = Math.floor(point.x / TILE_SIZE_PX);
  const tileY = Math.floor(point.y / TILE_SIZE_PX);
  
  if (!inBounds(tileX, tileY)) return null;
  return tiles[tileY][tileX];
}

/**
 * Trace a water crossing to find start, end, and all water tiles
 * Phase 2: Now uses intelligent search to find optimal bridge placement
 */
function traceWaterCrossing(
  tiles: Tile[][],
  pathPoints: Point[],
  startIndex: number
): { start: Point; end: Point; waterTiles: Point[] } | null {
  const waterTiles: Point[] = [];
  let waterStartIndex: number | null = null;
  let waterEndIndex: number | null = null;
  let landBeforeWaterIndex: number | null = null;
  let landAfterWaterIndex: number | null = null;

  // Find where water starts (going backwards from startIndex)
  for (let i = startIndex; i >= 0; i--) {
    const tile = getTileAtPoint(tiles, pathPoints[i]);
    if (tile && isWaterTile(tile)) {
      waterStartIndex = i;
    } else if (waterStartIndex !== null) {
      // Found land before water - this is our bridge start point
      landBeforeWaterIndex = i;
      break;
    }
  }

  // Find where water ends (going forward from startIndex)
  let inWater = false;
  for (let i = startIndex; i < pathPoints.length; i++) {
    const tile = getTileAtPoint(tiles, pathPoints[i]);
    if (!tile) continue;

    const tileCoord = {
      x: Math.floor(pathPoints[i].x / TILE_SIZE_PX),
      y: Math.floor(pathPoints[i].y / TILE_SIZE_PX)
    };

    if (isWaterTile(tile)) {
      inWater = true;
      waterEndIndex = i;
      // Track water tiles
      if (!waterTiles.some(t => t.x === tileCoord.x && t.y === tileCoord.y)) {
        waterTiles.push(tileCoord);
      }
    } else if (inWater) {
      // Found land after water - this is our bridge end point
      landAfterWaterIndex = i;
      break;
    }
  }

  if (waterStartIndex === null || waterEndIndex === null || waterTiles.length === 0) {
    return null;
  }

  if (landBeforeWaterIndex === null || landAfterWaterIndex === null) {
    return null;
  }

  // PHASE 2: Try to find optimal bridge placement nearby
  const optimalBridge = findOptimalBridgePoints(
    tiles,
    waterTiles,
    pathPoints,
    waterStartIndex,
    waterEndIndex
  );

  if (optimalBridge) {
    // Use optimized bridge location
    // Recalculate water tiles for the optimal bridge line
    const optimizedWaterTiles = findWaterTilesAlongLine(tiles, optimalBridge.start, optimalBridge.end);

    return {
      start: optimalBridge.start,
      end: optimalBridge.end,
      waterTiles: optimizedWaterTiles
    };
  }

  // FALLBACK: Use original path-following behavior if optimization fails
  const startPoint = pathPoints[landBeforeWaterIndex];
  const endPoint = pathPoints[landAfterWaterIndex];

  return {
    start: {
      x: startPoint.x,
      y: startPoint.y
    },
    end: {
      x: endPoint.x,
      y: endPoint.y
    },
    waterTiles
  };
}

/**
 * Calculate priority for bridge placement
 */
function calculatePriority(pathType: PathType, length: number): number {
  let base = 100;
  
  // Path type priority
  switch (pathType) {
    case PathType.ROAD:
    case PathType.MODERN_ROAD:
      base = 200;
      break;
    case PathType.RAILROAD:
      base = 180;
      break;
    case PathType.PATH:
      base = 150;
      break;
    default:
      base = 100;
  }
  
  // Prefer shorter crossings
  base -= length * 10;
  
  return Math.max(0, base);
}

/**
 * Select which bridges to actually build
 * Phase 2: Enhanced with density controls to prevent bridge spam
 */
function selectBridges(tiles: Tile[][], candidates: BridgeCandidate[]): BridgeCandidate[] {
  // Sort by priority
  candidates.sort((a, b) => b.priority - a.priority);

  const selected: BridgeCandidate[] = [];
  const usedLocations = new Set<string>();
  const minSpacingPx = MIN_BRIDGE_SPACING_TILES * TILE_SIZE_PX;

  for (const candidate of candidates) {
    // PHASE 2: Enforce maximum bridge count per map
    if (selected.length >= MAX_BRIDGES_PER_MAP) {
      console.log(`[BridgeGen] Reached maximum bridge limit (${MAX_BRIDGES_PER_MAP})`);
      break;
    }

    // VALIDATE: Reject bridges running parallel to shoreline
    if (!validateBridgePlacement(tiles, candidate)) {
      continue;
    }

    // Check if location is already used (avoid duplicate bridges)
    const locKey = `${candidate.start.x},${candidate.start.y}-${candidate.end.x},${candidate.end.y}`;
    const reverseKey = `${candidate.end.x},${candidate.end.y}-${candidate.start.x},${candidate.start.y}`;

    if (usedLocations.has(locKey) || usedLocations.has(reverseKey)) {
      continue;
    }

    // PHASE 2: Enhanced spacing check - now uses MIN_BRIDGE_SPACING_TILES
    let tooClose = false;
    for (const existing of selected) {
      const dist = Math.hypot(
        candidate.start.x - existing.start.x,
        candidate.start.y - existing.start.y
      );
      if (dist < minSpacingPx) {
        tooClose = true;
        break;
      }
    }

    if (!tooClose) {
      selected.push(candidate);
      usedLocations.add(locKey);
    }
  }

  return selected;
}

/**
 * Determine bridge type based on era and culture
 */
function getBridgeType(
  era: HistoricalEra | string,
  culturalZone: string,
  pathType: PathType,
  length: number
): { type: 'wooden' | 'stone' | 'iron' | 'modern'; style: string } | null {
  // Era-based selection with historical accuracy
  const eraStr = typeof era === 'string' ? era : String(era);
  
  // PREHISTORIC (before 3000 BCE) - No bridges
  if (eraStr.includes('PREHISTORIC') || eraStr.includes('STONE_AGE')) {
    return null; // No bridges in prehistoric times
  }
  
  // ANCIENT (3000 BCE - 500 CE) - Simple log bridges
  if (eraStr.includes('ANCIENT') || eraStr.includes('BRONZE_AGE')) {
    // Very primitive - just logs across water
    return { type: 'wooden', style: 'log' };
  }
  
  // CLASSICAL (500 BCE - 500 CE) - Early engineering
  if (eraStr.includes('CLASSICAL') || eraStr.includes('IRON_AGE')) {
    if ((culturalZone === 'EUROPEAN' || culturalZone === 'MENA') && pathType === PathType.ROAD) {
      // Romans built stone arch bridges
      return { type: 'stone', style: 'roman' };
    }
    // Others used wooden beam bridges
    return { type: 'wooden', style: 'beam' };
  }
  
  // MEDIEVAL (500 - 1500) - Mix of wood and stone
  if (eraStr.includes('MEDIEVAL')) {
    if (pathType === PathType.ROAD && length > 3) {
      // Important crossings get stone bridges
      return { type: 'stone', style: culturalZone === 'EUROPEAN' ? 'arch' : 'beam' };
    }
    // Smaller crossings use wood, sometimes covered
    return { type: 'wooden', style: length > 2 ? 'covered' : 'plank' };
  }
  
  // EARLY MODERN (1500 - 1800) - Refined stone construction
  if (eraStr.includes('RENAISSANCE') || eraStr.includes('EARLY_MODERN')) {
    if (pathType === PathType.ROAD || pathType === PathType.PATH) {
      // Stone becomes standard for major routes
      return { type: 'stone', style: 'arch' };
    }
    // Wood with better engineering
    return { type: 'wooden', style: 'truss' };
  }
  
  // INDUSTRIAL (1800 - 1950) - Iron and early steel
  if (eraStr.includes('INDUSTRIAL')) {
    if (pathType === PathType.RAILROAD) {
      // Railroads need strong iron bridges
      return { type: 'iron', style: 'railroad' };
    }
    if (length > 4) {
      // Long spans use iron truss
      return { type: 'iron', style: 'truss' };
    }
    // Short spans might still use stone
    return { type: 'stone', style: 'beam' };
  }
  
  // MODERN (1950+) - Concrete and steel
  if (eraStr.includes('MODERN') || eraStr.includes('CONTEMPORARY')) {
    if (pathType === PathType.MODERN_ROAD) {
      // Modern roads get modern concrete
      return { type: 'modern', style: 'highway' };
    }
    // Standard modern bridge
    return { type: 'modern', style: 'concrete' };
  }
  
  // Default fallback for unrecognized eras - simple wooden
  return { type: 'wooden', style: 'plank' };
}

/**
 * Main bridge generation function
 */
export function generateBridges(
  tiles: Tile[][],
  paths: PathObject[],
  culturalZone: string,
  era: HistoricalEra | string
): Bridge[] {
  // Find all water crossings
  const candidates = findWaterCrossings(tiles, paths);

  // Select which ones to build (now includes perpendicular water validation)
  const selected = selectBridges(tiles, candidates);

  // Convert to bridge objects, filtering out null types (prehistoric era)
  const bridges: Bridge[] = [];

  for (let index = 0; index < selected.length; index++) {
    const candidate = selected[index];
    const bridgeType = getBridgeType(era, culturalZone, candidate.pathType, candidate.waterTiles.length);

    // Skip if no bridge should be built (e.g., prehistoric era)
    if (!bridgeType) {
      console.log('[Gen] Skipping bridge generation - not available in this era');
      continue;
    }

    const bridge = {
      id: `bridge-${index}`,
      start: candidate.start,
      end: candidate.end,
      waterTiles: candidate.waterTiles,
      type: bridgeType.type,
      style: bridgeType.style,
      width: candidate.pathType === PathType.MODERN_ROAD ? 1.4 :
             candidate.pathType === PathType.ROAD ? 1.2 : 1,
    };

    console.log(`[BridgeGen] Created bridge ${bridge.id}:`, {
      startPx: bridge.start,
      endPx: bridge.end,
      type: bridge.type,
      style: bridge.style,
      width: bridge.width,
      lengthPx: Math.hypot(bridge.end.x - bridge.start.x, bridge.end.y - bridge.start.y)
    });

    bridges.push(bridge);
  }

  console.log(`[BridgeGen] Total bridges generated: ${bridges.length}`);
  return bridges;
}

/**
 * Add bridges to map data
 */
export function addBridgesToMap(mapData: MapData, bridges: Bridge[]): MapData {
  // Convert bridges to terrain structures for rendering
  const bridgeStructures: TerrainStructure[] = bridges.map(bridge => ({
    id: bridge.id,
    name: `Bridge`,
    structureType: 'bridge',
    // Convert pixel coordinates to tile coordinates for the location field
    location: [
      Math.floor(bridge.start.x / TILE_SIZE_PX),
      Math.floor(bridge.start.y / TILE_SIZE_PX)
    ],
    economicRole: 'commerce' as const,
    npcAnchor: 'trader',
    state: 'active' as const,
    customData: bridge, // Store full bridge data with pixel coordinates
  }));

  // Mark water tiles with bridge information so they can be crossed
  const updatedMapData = {
    ...mapData,
    terrainStructures: [...(mapData.terrainStructures || []), ...bridgeStructures],
  };

  // Mark each water tile that has a bridge over it
  bridges.forEach(bridge => {
    bridge.waterTiles.forEach(waterTileCoord => {
      // waterTiles are stored as tile coordinates
      const tile = updatedMapData.tiles[waterTileCoord.y]?.[waterTileCoord.x];
      if (tile) {
        // Mark this tile as having a bridge so it can be crossed on foot
        tile.hasBridge = true;
        tile.bridgeId = bridge.id;
      }
    });
  });

  return updatedMapData;
}
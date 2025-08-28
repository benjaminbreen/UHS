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
        
        if (crossing && crossing.waterTiles.length > 0 && crossing.waterTiles.length <= 8) {
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
 */
function traceWaterCrossing(
  tiles: Tile[][],
  pathPoints: Point[],
  startIndex: number
): { start: Point; end: Point; waterTiles: Point[] } | null {
  const waterTiles: Point[] = [];
  let landStart: Point | null = null;
  let landEnd: Point | null = null;
  
  // Find the land tile before water
  for (let i = startIndex; i >= 0; i--) {
    const tile = getTileAtPoint(tiles, pathPoints[i]);
    if (tile && !isWaterTile(tile)) {
      landStart = {
        x: Math.floor(pathPoints[i].x / TILE_SIZE_PX),
        y: Math.floor(pathPoints[i].y / TILE_SIZE_PX)
      };
      break;
    }
  }
  
  // Trace through water tiles
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
      // Check if we already have this tile
      if (!waterTiles.some(t => t.x === tileCoord.x && t.y === tileCoord.y)) {
        waterTiles.push(tileCoord);
      }
    } else if (inWater) {
      // Found land after water
      landEnd = tileCoord;
      break;
    }
  }
  
  if (!landStart || !landEnd || waterTiles.length === 0) return null;
  
  return {
    start: landStart,
    end: landEnd,
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
    case PathType.HIGHWAY:
      base = 200;
      break;
    case PathType.MAJOR_PATH:
      base = 150;
      break;
    case PathType.RAILROAD:
      base = 180;
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
 */
function selectBridges(candidates: BridgeCandidate[]): BridgeCandidate[] {
  // Sort by priority
  candidates.sort((a, b) => b.priority - a.priority);
  
  const selected: BridgeCandidate[] = [];
  const usedLocations = new Set<string>();
  
  for (const candidate of candidates) {
    // Check if location is already used (avoid duplicate bridges)
    const locKey = `${candidate.start.x},${candidate.start.y}-${candidate.end.x},${candidate.end.y}`;
    const reverseKey = `${candidate.end.x},${candidate.end.y}-${candidate.start.x},${candidate.start.y}`;
    
    if (usedLocations.has(locKey) || usedLocations.has(reverseKey)) {
      continue;
    }
    
    // Check minimum distance from other bridges
    let tooClose = false;
    for (const existing of selected) {
      const dist = Math.hypot(
        candidate.start.x - existing.start.x,
        candidate.start.y - existing.start.y
      );
      if (dist < 5) {
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
): { type: 'wooden' | 'stone' | 'iron' | 'modern'; style: string } {
  // Default to wooden for short spans
  if (length <= 2 && pathType === PathType.TRAIL) {
    return { type: 'wooden', style: 'simple' };
  }
  
  // Era-based selection
  const eraStr = typeof era === 'string' ? era : era.toString();
  
  if (eraStr.includes('MODERN') || eraStr.includes('CONTEMPORARY')) {
    return { type: 'modern', style: 'concrete' };
  }
  
  if (eraStr.includes('INDUSTRIAL')) {
    return { type: 'iron', style: 'truss' };
  }
  
  if (eraStr.includes('MEDIEVAL') || eraStr.includes('RENAISSANCE')) {
    if (pathType === PathType.ROAD && length > 3) {
      return { type: 'stone', style: culturalZone === 'EUROPEAN' ? 'arch' : 'beam' };
    }
    return { type: 'wooden', style: 'covered' };
  }
  
  if (eraStr.includes('ANCIENT') || eraStr.includes('CLASSICAL')) {
    if (culturalZone === 'EUROPEAN' || culturalZone === 'MENA') {
      return { type: 'stone', style: 'roman' };
    }
    return { type: 'wooden', style: 'log' };
  }
  
  // Default fallback
  return { type: 'wooden', style: 'simple' };
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
  
  // Select which ones to build
  const selected = selectBridges(candidates);
  
  // Convert to bridge objects
  const bridges: Bridge[] = selected.map((candidate, index) => {
    const bridgeType = getBridgeType(era, culturalZone, candidate.pathType, candidate.waterTiles.length);
    
    return {
      id: `bridge-${index}`,
      start: candidate.start,
      end: candidate.end,
      waterTiles: candidate.waterTiles,
      type: bridgeType.type,
      style: bridgeType.style,
      width: candidate.pathType === PathType.ROAD || candidate.pathType === PathType.HIGHWAY ? 2 : 1,
    };
  });
  
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
    location: [bridge.start.x, bridge.start.y],
    economicRole: 'commerce' as const,
    npcAnchor: 'trader',
    state: 'active' as const,
    customData: bridge, // Store full bridge data
  }));
  
  // Add to map's terrain structures
  return {
    ...mapData,
    terrainStructures: [...(mapData.terrainStructures || []), ...bridgeStructures],
  };
}
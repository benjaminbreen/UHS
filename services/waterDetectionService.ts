/**
 * Water Detection Service
 * Detects proximity to freshwater sources including rivers, lakes, and streams
 */

import { MapData, Tile, BiomeType, PathObject } from '../types';

export interface WaterSource {
  type: 'tile' | 'stream';
  distance: number;
  coordinates: { x: number; y: number };
  biome?: BiomeType;
  streamId?: string;
}

/**
 * Check if a tile contains freshwater
 */
export function isFreshwaterTile(tile: Tile): boolean {
  return tile.biome === BiomeType.FRESHWATER_LAKE ||
         tile.biome === BiomeType.RIVER ||
         tile.biome === BiomeType.MAJOR_RIVER;
}

/**
 * Check if player is near any freshwater source (within 1 tile)
 */
export function isNearFreshwater(
  playerLocation: { x: number; y: number },
  mapData: MapData
): WaterSource | null {
  if (!mapData || !mapData.tiles || !playerLocation) return null;
  
  // Validate player location coordinates
  if (typeof playerLocation.x !== 'number' || typeof playerLocation.y !== 'number' ||
      isNaN(playerLocation.x) || isNaN(playerLocation.y)) {
    return null;
  }
  
  const searchRadius = 1;
  const mapWidth = mapData.tiles[0]?.length || 0;
  const mapHeight = mapData.tiles.length || 0;
  
  // Check tiles in a 3x3 grid around player (1 tile radius)
  for (let dx = -searchRadius; dx <= searchRadius; dx++) {
    for (let dy = -searchRadius; dy <= searchRadius; dy++) {
      const checkX = playerLocation.x + dx;
      const checkY = playerLocation.y + dy;
      
      // Bounds check
      if (checkX < 0 || checkX >= mapWidth || checkY < 0 || checkY >= mapHeight) {
        continue;
      }
      
      const tile = mapData.tiles[checkY][checkX];
      if (tile && isFreshwaterTile(tile)) {
        const distance = Math.sqrt(dx * dx + dy * dy);
        return {
          type: 'tile',
          distance,
          coordinates: { x: checkX, y: checkY },
          biome: tile.biome
        };
      }
    }
  }
  
  // Check for nearby streams
  const nearbyStream = findNearbyStream(playerLocation, mapData);
  if (nearbyStream) {
    return nearbyStream;
  }
  
  return null;
}

/**
 * Find nearby streams by parsing SVG path data
 */
function findNearbyStream(
  playerLocation: { x: number; y: number },
  mapData: MapData
): WaterSource | null {
  if (!mapData.pathObjects) return null;
  
  const tileSize = 32; // Assuming 32px tiles (adjust if different)
  const searchRadiusPixels = tileSize * 1.5; // 1.5 tiles in pixels
  
  // Convert player location to pixel coordinates (center of tile)
  const playerPixelX = playerLocation.x * tileSize + tileSize / 2;
  const playerPixelY = playerLocation.y * tileSize + tileSize / 2;
  
  for (const pathObj of mapData.pathObjects) {
    // Check if this is a stream/river path
    if (pathObj.type !== 'STREAM' && pathObj.type !== 'RIVER') {
      continue;
    }
    
    const pathPoints = parseSVGPath(pathObj.svgD);
    
    // Check if any point on the path is within search radius
    for (const point of pathPoints) {
      const distancePixels = Math.sqrt(
        Math.pow(point.x - playerPixelX, 2) + 
        Math.pow(point.y - playerPixelY, 2)
      );
      
      if (distancePixels <= searchRadiusPixels) {
        // Convert back to tile coordinates
        const tileDistance = distancePixels / tileSize;
        return {
          type: 'stream',
          distance: tileDistance,
          coordinates: {
            x: Math.floor(point.x / tileSize),
            y: Math.floor(point.y / tileSize)
          },
          streamId: pathObj.id
        };
      }
    }
  }
  
  return null;
}

/**
 * Parse SVG path 'd' attribute to extract coordinate points
 * Handles basic MoveTo (M) and LineTo (L) commands
 */
function parseSVGPath(svgD: string): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];
  
  // Remove extra whitespace and split by commands
  const cleanPath = svgD.replace(/\s+/g, ' ').trim();
  
  // Simple regex to extract coordinates from M and L commands
  const commandRegex = /([ML])\s*([\d.-]+)\s+([\d.-]+)/g;
  let match;
  
  while ((match = commandRegex.exec(cleanPath)) !== null) {
    const x = parseFloat(match[2]);
    const y = parseFloat(match[3]);
    
    if (!isNaN(x) && !isNaN(y)) {
      points.push({ x, y });
    }
  }
  
  // If we don't have points from M/L commands, try to extract any number pairs
  if (points.length === 0) {
    const numberRegex = /([\d.-]+)\s+([\d.-]+)/g;
    while ((match = numberRegex.exec(cleanPath)) !== null) {
      const x = parseFloat(match[1]);
      const y = parseFloat(match[2]);
      
      if (!isNaN(x) && !isNaN(y)) {
        points.push({ x, y });
      }
    }
  }
  
  return points;
}

/**
 * Get a descriptive message for the water source found
 */
export function getWaterSourceMessage(waterSource: WaterSource): string {
  const distance = waterSource.distance;
  const distanceDesc = distance < 0.5 ? 'right beside' : 
                      distance < 1.0 ? 'very close to' : 'near';
  
  if (waterSource.type === 'tile') {
    switch (waterSource.biome) {
      case BiomeType.FRESHWATER_LAKE:
        return `You are ${distanceDesc} a freshwater lake.`;
      case BiomeType.RIVER:
        return `You are ${distanceDesc} a river.`;
      case BiomeType.MAJOR_RIVER:
        return `You are ${distanceDesc} a major river.`;
      default:
        return `You are ${distanceDesc} fresh water.`;
    }
  } else {
    return `You are ${distanceDesc} a stream.`;
  }
}

/**
 * Determine how much water can be collected based on source type
 */
export function getWaterCollectionAmount(waterSource: WaterSource): number {
  // Base collection is 1 liter
  let baseAmount = 1;
  
  if (waterSource.type === 'tile') {
    switch (waterSource.biome) {
      case BiomeType.MAJOR_RIVER:
        baseAmount = 2; // Major rivers give more water
        break;
      case BiomeType.FRESHWATER_LAKE:
        baseAmount = 2; // Lakes give more water
        break;
      case BiomeType.RIVER:
        baseAmount = 1;
        break;
    }
  } else if (waterSource.type === 'stream') {
    baseAmount = 1; // Streams give standard amount
  }
  
  // Add small random variation (±0-1 extra)
  const randomExtra = Math.random() < 0.3 ? 1 : 0;
  return baseAmount + randomExtra;
}
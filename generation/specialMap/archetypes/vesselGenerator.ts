/**
 * Vessel Archetype Generator
 * Creates ship interiors with ocean landscape borders
 */

import { Tile, BiomeType } from '../../../types';
import { SpecialMapConfig, InteractionZone, ExitZone } from '../../../types/specialMapTypes';
import { ValueNoise } from '../../../utils/noise';

export function generateVessel(
  tiles: Tile[][],
  config: SpecialMapConfig,
  noise: ValueNoise,
  size: { width: number; height: number }
): {
  tiles: Tile[][];
  interactionZones: InteractionZone[];
  exitZones: ExitZone[];
} {
  const interactionZones: InteractionZone[] = [];
  const exitZones: ExitZone[] = [];
  
  // Fill everything with ocean first
  for (let y = 0; y < size.height; y++) {
    for (let x = 0; x < size.width; x++) {
      tiles[y][x].biome = BiomeType.OCEAN;
      tiles[y][x].isWater = true;
      tiles[y][x].isBlocking = true;
    }
  }
  
  // Create boat shape in center
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  
  // Define boat shape (smaller to ensure ocean border is visible)
  const boatWidth = Math.min(5, size.width - 3);
  const boatHeight = Math.min(3, size.height - 3);
  
  // Create boat hull outline (wood walls) - more boat-like shape
  for (let y = 0; y < size.height; y++) {
    for (let x = 0; x < size.width; x++) {
      // Calculate distance from center
      const dx = x - centerX;
      const dy = y - centerY;
      
      // Create a more boat-like shape (pointed at top, wider at bottom)
      const boatShapeModifier = dy < 0 ? 0.6 : 1.0; // Narrower at top (bow)
      const adjustedDx = dx / ((boatWidth / 2) * boatShapeModifier);
      const adjustedDy = dy / (boatHeight / 2);
      const distance = adjustedDx * adjustedDx + adjustedDy * adjustedDy;
      
      // Create boat shape
      if (distance <= 1.0) {
        // Check if we're on the edge (hull)
        const innerModifier = dy < 0 ? 0.5 : 0.7; // Thinner walls at bow
        const innerDx = adjustedDx * innerModifier;
        const innerDy = adjustedDy * 0.7;
        const innerDistance = innerDx * innerDx + innerDy * innerDy;
        
        if (innerDistance <= 1.0) {
          // Interior - wooden deck
          tiles[y][x].biome = BiomeType.FLOOR_WOOD;
          tiles[y][x].isWater = false;
          tiles[y][x].isBlocking = false;
        } else {
          // Hull - wooden walls
          tiles[y][x].biome = BiomeType.WALL;
          tiles[y][x].isWater = false;
          tiles[y][x].isBlocking = true;
          tiles[y][x].structureType = 'wood_hull';
        }
      }
    }
  }
  
  // Place simple furniture - just barrel and bed as requested
  const validFloorTiles = [];
  for (let y = 0; y < size.height; y++) {
    for (let x = 0; x < size.width; x++) {
      if (tiles[y][x].biome === BiomeType.FLOOR_WOOD) {
        validFloorTiles.push({ x, y });
      }
    }
  }
  
  if (validFloorTiles.length >= 2) {
    // Place barrel in one corner
    const barrelTile = validFloorTiles[0];
    tiles[barrelTile.y][barrelTile.x].biome = BiomeType.BARREL;
    tiles[barrelTile.y][barrelTile.x].isBlocking = true;
    
    // Place bed in opposite area
    const bedTile = validFloorTiles[Math.floor(validFloorTiles.length * 0.7)];
    tiles[bedTile.y][bedTile.x].biome = BiomeType.BED;
    tiles[bedTile.y][bedTile.x].isBlocking = true;
  }
  
  // Add stairs up (for going back to deck) - place in center if available
  if (validFloorTiles.length > 0) {
    const stairsTile = validFloorTiles[Math.floor(validFloorTiles.length / 2)];
    // Don't overwrite barrel or bed
    if (tiles[stairsTile.y][stairsTile.x].biome === BiomeType.FLOOR_WOOD) {
      tiles[stairsTile.y][stairsTile.x].biome = BiomeType.STAIRS_UP;
      tiles[stairsTile.y][stairsTile.x].isBlocking = false;
    }
  }
  
  // Exit back to main map via stairs
  const stairsLocation = validFloorTiles.find(tile => 
    tiles[tile.y][tile.x].biome === BiomeType.STAIRS_UP
  );
  
  if (stairsLocation) {
    exitZones.push({
      x: stairsLocation.x,
      y: stairsLocation.y,
      width: 1,
      height: 1,
      targetMap: 'parent',
      label: 'Go back up'
    });
  }
  
  return {
    tiles,
    interactionZones,
    exitZones
  };
}
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
  
  // For vessels with ocean landscape, we create water border
  const borderRows = config.hasLandscape && config.landscapeClimate === 'ocean' ? 
    (config.mapSize === 'xs' ? 2 : config.mapSize === 'small' ? 2 : 3) : 0;
  
  // Fill ocean tiles
  if (borderRows > 0) {
    for (let y = 0; y < size.height; y++) {
      for (let x = 0; x < size.width; x++) {
        // Top and bottom borders
        if (y < borderRows || y >= size.height - borderRows) {
          tiles[y][x].biome = BiomeType.OCEAN;
          tiles[y][x].isWater = true;
          tiles[y][x].isBlocking = true;
        }
        // Left and right borders (but leave center for ship)
        else if (x < borderRows || x >= size.width - borderRows) {
          tiles[y][x].biome = BiomeType.OCEAN;
          tiles[y][x].isWater = true;
          tiles[y][x].isBlocking = true;
        }
      }
    }
  }
  
  // Calculate ship bounds
  const shipLeft = borderRows;
  const shipRight = size.width - borderRows;
  const shipTop = borderRows;
  const shipBottom = size.height - borderRows;
  const shipWidth = shipRight - shipLeft;
  const shipHeight = shipBottom - shipTop;
  
  // Create ship hull (walls)
  for (let y = shipTop; y < shipBottom; y++) {
    for (let x = shipLeft; x < shipRight; x++) {
      // Ship edges are walls
      if (y === shipTop || y === shipBottom - 1 || 
          x === shipLeft || x === shipRight - 1) {
        tiles[y][x].biome = BiomeType.WALL;
        tiles[y][x].isBlocking = true;
        
        // Add material based on era
        if (config.wallMaterial === 'steel') {
          tiles[y][x].structureType = 'steel_hull';
        } else {
          tiles[y][x].structureType = 'wood_hull';
        }
      } else {
        // Deck floor
        tiles[y][x].biome = BiomeType.FLOOR_WOOD;
        tiles[y][x].isBlocking = false;
      }
    }
  }
  
  // For rectangular vessels, create narrow walkable space
  if (config.isRectangular && config.mapSize === 'xs') {
    // XS vessel (8x8 with ocean) creates 2x4 walkable deck
    // Already handled by the hull creation above
  }
  
  // Add ship features based on era and size
  const centerX = Math.floor((shipLeft + shipRight) / 2);
  const centerY = Math.floor((shipTop + shipBottom) / 2);
  
  // Mast for sailing ships
  if (config.era < 1800 && shipWidth > 2) {
    tiles[centerY][centerX].biome = BiomeType.COLUMN;
    tiles[centerY][centerX].isBlocking = true;
    tiles[centerY][centerX].structureType = 'mast';
  }
  
  // Captain's quarters entrance (if large enough)
  if (shipWidth >= 4 && shipHeight >= 4 && config.innerMapType) {
    const quarterX = centerX;
    const quarterY = shipTop + 1;
    
    tiles[quarterY][quarterX].biome = BiomeType.DOOR;
    tiles[quarterY][quarterX].structureType = 'cabin_door';
    
    interactionZones.push({
      x: quarterX,
      y: quarterY,
      width: 1,
      height: 1,
      type: 'portal',
      properties: {
        targetMap: config.innerMapType,
        name: config.innerMapName || "Captain's Quarters",
        requiresAccess: config.isPrivate
      }
    });
  }
  
  // Exit back to main map (gangplank)
  exitZones.push({
    x: shipLeft + 1,
    y: shipBottom - 1,
    width: 1,
    height: 1,
    targetMap: 'parent',
    label: 'Disembark'
  });
  
  // Cargo hold entrance for larger ships
  if (config.mapSize !== 'xs' && shipWidth >= 4) {
    const holdX = centerX + 1;
    const holdY = centerY;
    
    tiles[holdY][holdX].biome = BiomeType.STAIRS_DOWN;
    tiles[holdY][holdX].structureType = 'hold_entrance';
    
    interactionZones.push({
      x: holdX,
      y: holdY,
      width: 1,
      height: 1,
      type: 'storage',
      properties: {
        name: 'Cargo Hold',
        capacity: config.mapSize === 'small' ? 10 : 20
      }
    });
  }
  
  // Add some barrels/crates for atmosphere
  if (shipWidth > 3 && shipHeight > 3) {
    const barrelX = shipRight - 2;
    const barrelY = shipTop + 1;
    
    if (tiles[barrelY][barrelX].biome === BiomeType.FLOOR_WOOD) {
      tiles[barrelY][barrelX].biome = BiomeType.CABINET;
      tiles[barrelY][barrelX].structureType = 'barrel';
      tiles[barrelY][barrelX].isBlocking = true;
    }
  }
  
  return {
    tiles,
    interactionZones,
    exitZones
  };
}
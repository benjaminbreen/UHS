/**
 * Campground Archetype Generator
 * Creates temporary settlements with tents, fire, and surrounding terrain
 */

import { Tile, BiomeType, ClimateType } from '../../../types';
import { SpecialMapConfig, InteractionZone, ExitZone } from '../../../types/specialMapTypes';
import { ValueNoise } from '../../../utils/noise';
import { placeFirepit, applyMaterial } from '../multiTileSystem';
import { LANDSCAPE_BORDER_ROWS } from '../../../constants/specialMaps/specialMapAugmentation';

export function generateCampground(
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
  
  // Determine landscape border size
  const borderSize = config.hasLandscape ? 
    LANDSCAPE_BORDER_ROWS[config.mapSize || 'small'] : 0;
  
  // Calculate usable area
  const startX = borderSize;
  const startY = borderSize;
  const endX = size.width - borderSize;
  const endY = size.height - borderSize;
  const usableWidth = endX - startX;
  const usableHeight = endY - startY;
  
  // Fill landscape border if enabled
  if (config.hasLandscape && config.landscapeClimate) {
    fillLandscapeBorder(tiles, size, borderSize, config.landscapeClimate);
  }
  
  // Fill camp ground with appropriate terrain
  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x++) {
      // Base terrain - dirt or grass
      if (config.landscapeClimate === 'arid' || config.landscapeClimate === 'cold') {
        tiles[y][x].biome = BiomeType.DIRT;
      } else {
        tiles[y][x].biome = BiomeType.GRASSLAND;
      }
      tiles[y][x].isBlocking = false;
    }
  }
  
  // Place central firepit
  const centerX = Math.floor((startX + endX) / 2);
  const centerY = Math.floor((startY + endY) / 2);
  
  placeFirepit(tiles, centerX, centerY, config.wallMaterial || 'grey_stone');
  
  // Calculate tent positions in a circle/square around fire
  const tentPositions = config.isCircular ? 
    getCircularPositions(centerX, centerY, Math.min(usableWidth, usableHeight) / 3) :
    getRectangularPositions(centerX, centerY, usableWidth / 3, usableHeight / 3);
  
  // Place tents
  tentPositions.forEach((pos, index) => {
    if (pos.x >= startX && pos.x < endX - 1 && 
        pos.y >= startY && pos.y < endY - 1) {
      placeTent(tiles, pos.x, pos.y, index === 0);
      
      // First tent is the player's - add interaction
      if (index === 0 && config.innerMapType) {
        interactionZones.push({
          x: pos.x,
          y: pos.y,
          width: 2,
          height: 2,
          type: 'portal',
          properties: {
            targetMap: config.innerMapType,
            name: config.innerMapName || "Your Tent",
            requiresAccess: true // Only player can enter their tent
          }
        });
      }
    }
  });
  
  // Add some camp supplies
  if (usableWidth > 4 && usableHeight > 4) {
    // Supply crates near fire
    const crateX = centerX + 3;
    const crateY = centerY - 1;
    if (tiles[crateY][crateX].biome !== BiomeType.TENT) {
      tiles[crateY][crateX].biome = BiomeType.CABINET;
      tiles[crateY][crateX].structureType = 'supply_crate';
      tiles[crateY][crateX].isBlocking = true;
    }
    
    // Weapon rack for military camps
    if (config.specificYear && config.specificYear > 0) {
      const rackX = centerX - 3;
      const rackY = centerY + 1;
      if (tiles[rackY][rackX].biome !== BiomeType.TENT) {
        tiles[rackY][rackX].biome = BiomeType.WEAPON_RACK;
        tiles[rackY][rackX].isBlocking = true;
      }
    }
  }
  
  // Add foraging spots (items that spawn here but not on standard map)
  if (config.landscapeClimate === 'temperate' || config.landscapeClimate === 'tropical') {
    // Berry bushes
    for (let i = 0; i < 2; i++) {
      const bushX = startX + Math.floor(noise.random() * usableWidth);
      const bushY = startY + Math.floor(noise.random() * usableHeight);
      if (tiles[bushY][bushX].biome === BiomeType.GRASSLAND) {
        tiles[bushY][bushX].biome = BiomeType.BERRY_BUSH;
        tiles[bushY][bushX].structureType = 'forageable';
        
        interactionZones.push({
          x: bushX,
          y: bushY,
          width: 1,
          height: 1,
          type: 'resource',
          properties: {
            resourceType: 'berries',
            quantity: 3 + Math.floor(noise.random() * 3)
          }
        });
      }
    }
  }
  
  // Exit zones at corners
  exitZones.push({
    x: startX,
    y: startY,
    width: 2,
    height: 2,
    targetMap: 'parent',
    label: 'Leave Camp'
  });
  
  exitZones.push({
    x: endX - 2,
    y: endY - 2,
    width: 2,
    height: 2,
    targetMap: 'parent',
    label: 'Leave Camp'
  });
  
  return {
    tiles,
    interactionZones,
    exitZones
  };
}

/**
 * Place a tent (2x2 structure)
 */
function placeTent(tiles: Tile[][], x: number, y: number, isPlayerTent: boolean): void {
  // Tent takes 2x2 space
  for (let dy = 0; dy < 2; dy++) {
    for (let dx = 0; dx < 2; dx++) {
      if (y + dy < tiles.length && x + dx < tiles[0].length) {
        const tile = tiles[y + dy][x + dx];
        tile.biome = BiomeType.TENT;
        tile.isBlocking = true;
        
        // Different appearance for player tent
        if (isPlayerTent) {
          tile.structureType = 'tent_player';
        } else {
          tile.structureType = 'tent_npc';
        }
        
        // Mark which part of tent
        if (dx === 0 && dy === 0) tile.metadata = { tentPart: 'top_left' };
        else if (dx === 1 && dy === 0) tile.metadata = { tentPart: 'top_right' };
        else if (dx === 0 && dy === 1) tile.metadata = { tentPart: 'bottom_left' };
        else tile.metadata = { tentPart: 'bottom_right' };
      }
    }
  }
}

/**
 * Get positions in a circle
 */
function getCircularPositions(
  centerX: number, 
  centerY: number, 
  radius: number
): { x: number; y: number }[] {
  const positions = [];
  const tentCount = 4; // 4 tents for small camps
  
  for (let i = 0; i < tentCount; i++) {
    const angle = (i / tentCount) * Math.PI * 2;
    const x = Math.floor(centerX + Math.cos(angle) * radius);
    const y = Math.floor(centerY + Math.sin(angle) * radius);
    positions.push({ x, y });
  }
  
  return positions;
}

/**
 * Get positions in a rectangle
 */
function getRectangularPositions(
  centerX: number,
  centerY: number,
  halfWidth: number,
  halfHeight: number
): { x: number; y: number }[] {
  return [
    { x: centerX - halfWidth, y: centerY - halfHeight }, // Top left
    { x: centerX + halfWidth, y: centerY - halfHeight }, // Top right
    { x: centerX - halfWidth, y: centerY + halfHeight }, // Bottom left
    { x: centerX + halfWidth, y: centerY + halfHeight }, // Bottom right
  ];
}

/**
 * Fill landscape border with climate-appropriate terrain
 */
function fillLandscapeBorder(
  tiles: Tile[][],
  size: { width: number; height: number },
  borderSize: number,
  climate: string
): void {
  for (let y = 0; y < size.height; y++) {
    for (let x = 0; x < size.width; x++) {
      // Check if in border area
      if (x < borderSize || x >= size.width - borderSize ||
          y < borderSize || y >= size.height - borderSize) {
        
        const tile = tiles[y][x];
        
        switch (climate) {
          case 'arid':
            tile.biome = BiomeType.DESERT;
            tile.vegetation = Math.random() < 0.1 ? 'cactus' : undefined;
            break;
            
          case 'cold':
            tile.biome = BiomeType.SNOW;
            tile.vegetation = Math.random() < 0.05 ? 'bare_tree' : undefined;
            break;
            
          case 'temperate':
            tile.biome = BiomeType.FOREST;
            tile.vegetation = Math.random() < 0.3 ? 'tree' : 'grass';
            break;
            
          case 'tropical':
          case 'semitropical':
            tile.biome = BiomeType.JUNGLE;
            tile.vegetation = Math.random() < 0.4 ? 'palm' : 'fern';
            break;
            
          case 'ocean':
            tile.biome = BiomeType.OCEAN;
            tile.isWater = true;
            break;
            
          default:
            tile.biome = BiomeType.GRASSLAND;
            tile.vegetation = 'grass';
        }
        
        // Border tiles are not walkable (except paths)
        tile.isBlocking = true;
      }
    }
  }
}
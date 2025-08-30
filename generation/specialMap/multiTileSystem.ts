/**
 * Multi-Tile Architectural System
 * Handles creation of multi-tile objects like pillars, tables, and light sources
 */

import { Tile, BiomeType } from '../../types';
import { SpecialMapConfig } from '../../types/specialMapTypes';
import { MapSize, MaterialType, MULTI_TILE_CONFIGS } from '../../constants/specialMaps/specialMapAugmentation';

export interface MultiTileObject {
  type: 'pillar' | 'table' | 'light' | 'dais' | 'tomb' | 'firepit';
  x: number;
  y: number;
  material: MaterialType;
  era: string;
}

/**
 * Get pillar height based on era
 */
function getPillarHeight(era: number): number {
  if (era < -1000) return 2;  // Prehistoric
  if (era < 1500) return 3;   // Ancient to Medieval
  return 4;                    // Modern
}

/**
 * Get table width based on map size
 */
function getTableWidth(mapSize: MapSize): number {
  const widths = {
    xs: 3,
    small: 3,
    medium: 5,
    large: 7,
    xl: 9
  };
  return widths[mapSize] || 3;
}

/**
 * Place a multi-tile pillar
 */
export function placePillar(
  tiles: Tile[][],
  x: number,
  y: number,
  material: MaterialType,
  era: number
): void {
  const height = getPillarHeight(era);
  
  // Place from bottom to top
  for (let i = 0; i < height; i++) {
    const tileY = y - i;
    if (tileY < 0 || tileY >= tiles.length) continue;
    if (x < 0 || x >= tiles[0].length) continue;
    
    const tile = tiles[tileY][x];
    
    if (i === 0) {
      // Base - impassable
      tile.biome = BiomeType.COLUMN;
      tile.isBlocking = true;
      tile.structureType = `pillar_base_${material}`;
    } else if (i === height - 1) {
      // Top/capital
      tile.biome = BiomeType.COLUMN;
      tile.isBlocking = false; // Top doesn't block
      tile.structureType = `pillar_top_${material}`;
    } else {
      // Middle sections
      tile.biome = BiomeType.COLUMN;
      tile.isBlocking = false; // Middle doesn't block
      tile.structureType = `pillar_middle_${material}`;
    }
  }
}

/**
 * Place a multi-tile table
 */
export function placeTable(
  tiles: Tile[][],
  x: number,
  y: number,
  material: MaterialType,
  mapSize: MapSize,
  vertical: boolean = false
): void {
  const width = getTableWidth(mapSize);
  
  for (let i = 0; i < width; i++) {
    const tileX = vertical ? x : x + i;
    const tileY = vertical ? y + i : y;
    
    if (tileY < 0 || tileY >= tiles.length) continue;
    if (tileX < 0 || tileX >= tiles[0].length) continue;
    
    const tile = tiles[tileY][tileX];
    
    if (i === 0) {
      // Left/top end
      tile.biome = BiomeType.TABLE;
      tile.isBlocking = true;
      tile.structureType = `table_left_${material}`;
    } else if (i === width - 1) {
      // Right/bottom end
      tile.biome = BiomeType.TABLE;
      tile.isBlocking = true;
      tile.structureType = `table_right_${material}`;
    } else {
      // Middle sections (repeatable)
      tile.biome = BiomeType.TABLE;
      tile.isBlocking = true;
      tile.structureType = `table_middle_${material}`;
    }
  }
}

/**
 * Place a light source (fixture + glow)
 */
export function placeLightSource(
  tiles: Tile[][],
  x: number,
  y: number,
  era: number,
  wallMounted: boolean = false
): void {
  // Determine light type based on era
  let fixtureType: string;
  let lightType: string;
  
  if (era < -1000) {
    fixtureType = 'torch_holder';
    lightType = 'fire';
  } else if (era < 500) {
    fixtureType = 'bronze_stand';
    lightType = 'oil_flame';
  } else if (era < 1500) {
    fixtureType = wallMounted ? 'iron_sconce' : 'candelabra';
    lightType = 'torch';
  } else if (era < 1800) {
    fixtureType = 'candelabra';
    lightType = 'candles';
  } else if (era < 1950) {
    fixtureType = 'gas_lamp';
    lightType = 'gas_flame';
  } else {
    fixtureType = 'electric_fixture';
    lightType = 'bulb';
  }
  
  // Place fixture (bottom tile)
  if (y >= 0 && y < tiles.length && x >= 0 && x < tiles[0].length) {
    const fixtureTile = tiles[y][x];
    fixtureTile.biome = BiomeType.TORCH;
    fixtureTile.isBlocking = !wallMounted;
    fixtureTile.structureType = fixtureType;
  }
  
  // Place light glow (top tile) - only if not wall mounted
  if (!wallMounted && y - 1 >= 0) {
    const lightTile = tiles[y - 1][x];
    lightTile.biome = BiomeType.LIGHT_SOURCE;
    lightTile.isBlocking = false;
    lightTile.structureType = lightType;
    lightTile.isLightSource = true;
  }
}

/**
 * Place a dais/platform (raised area for throne, altar, etc.)
 */
export function placeDais(
  tiles: Tile[][],
  x: number,
  y: number,
  width: number,
  depth: number,
  material: MaterialType
): void {
  for (let dy = 0; dy < depth; dy++) {
    for (let dx = 0; dx < width; dx++) {
      const tileX = x + dx;
      const tileY = y + dy;
      
      if (tileY < 0 || tileY >= tiles.length) continue;
      if (tileX < 0 || tileX >= tiles[0].length) continue;
      
      const tile = tiles[tileY][tileX];
      
      // Determine which part of the dais this is
      let part = 'middle';
      if (dx === 0 && dy === 0) part = 'corner_tl';
      else if (dx === width - 1 && dy === 0) part = 'corner_tr';
      else if (dx === 0 && dy === depth - 1) part = 'corner_bl';
      else if (dx === width - 1 && dy === depth - 1) part = 'corner_br';
      else if (dy === 0) part = 'edge_top';
      else if (dy === depth - 1) part = 'edge_bottom';
      else if (dx === 0) part = 'edge_left';
      else if (dx === width - 1) part = 'edge_right';
      
      tile.biome = BiomeType.DAIS;
      tile.isBlocking = false; // Can walk on dais
      tile.structureType = `dais_${part}_${material}`;
      tile.elevation = 1; // Slightly raised
    }
  }
}

/**
 * Place a firepit (base + fire)
 */
export function placeFirepit(
  tiles: Tile[][],
  x: number,
  y: number,
  material: MaterialType
): void {
  // Place pit base (3x3 but only edges)
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const tileX = x + dx;
      const tileY = y + dy;
      
      if (tileY < 0 || tileY >= tiles.length) continue;
      if (tileX < 0 || tileX >= tiles[0].length) continue;
      
      const tile = tiles[tileY][tileX];
      
      if (dx === 0 && dy === 0) {
        // Center - fire
        tile.biome = BiomeType.FIREPIT;
        tile.isBlocking = true;
        tile.structureType = 'fire';
        tile.isLightSource = true;
      } else {
        // Edge stones
        tile.biome = BiomeType.FIREPIT;
        tile.isBlocking = true;
        tile.structureType = `firepit_edge_${material}`;
      }
    }
  }
}

/**
 * Generate pillars for a hall or room
 */
export function generatePillarRow(
  tiles: Tile[][],
  startX: number,
  startY: number,
  count: number,
  spacing: number,
  material: MaterialType,
  era: number,
  vertical: boolean = false
): void {
  for (let i = 0; i < count; i++) {
    const x = vertical ? startX : startX + (i * spacing);
    const y = vertical ? startY + (i * spacing) : startY;
    placePillar(tiles, x, y, material, era);
  }
}

/**
 * Apply material to existing tile
 */
export function applyMaterial(tile: Tile, material: MaterialType): void {
  // Store material in tile metadata
  if (!tile.metadata) {
    tile.metadata = {};
  }
  tile.metadata.material = material;
  
  // Update structure type to include material
  if (tile.structureType) {
    // If structure type doesn't already include material, add it
    if (!tile.structureType.includes('_')) {
      tile.structureType = `${tile.structureType}_${material}`;
    }
  }
  
  // Update biome for floors
  switch (tile.biome) {
    case BiomeType.FLOOR:
      switch (material) {
        case 'white_marble':
          tile.biome = BiomeType.FLOOR_MARBLE;
          break;
        case 'wood':
          tile.biome = BiomeType.FLOOR_WOOD;
          break;
        case 'grey_stone':
        case 'sandstone':
          tile.biome = BiomeType.FLOOR_STONE;
          break;
        case 'red_lacquer':
          tile.biome = BiomeType.FLOOR_WOOD; // Lacquered wood
          tile.metadata.lacquered = true;
          break;
      }
      break;
  }
}

/**
 * Add decorative pattern to floor tiles
 */
export function addFloorPattern(
  tiles: Tile[][],
  x: number,
  y: number,
  width: number,
  height: number,
  pattern: 'checkerboard' | 'border' | 'center_medallion',
  material1: MaterialType,
  material2: MaterialType
): void {
  for (let dy = 0; dy < height; dy++) {
    for (let dx = 0; dx < width; dx++) {
      const tileX = x + dx;
      const tileY = y + dy;
      
      if (tileY < 0 || tileY >= tiles.length) continue;
      if (tileX < 0 || tileX >= tiles[0].length) continue;
      
      const tile = tiles[tileY][tileX];
      
      switch (pattern) {
        case 'checkerboard':
          const isEven = (dx + dy) % 2 === 0;
          applyMaterial(tile, isEven ? material1 : material2);
          tile.biome = BiomeType.FLOOR_CHECKERED;
          break;
          
        case 'border':
          const isBorder = dx === 0 || dx === width - 1 || dy === 0 || dy === height - 1;
          applyMaterial(tile, isBorder ? material2 : material1);
          tile.biome = isBorder ? BiomeType.MOSAIC_BORDER : BiomeType.FLOOR;
          break;
          
        case 'center_medallion':
          const centerX = Math.floor(width / 2);
          const centerY = Math.floor(height / 2);
          const distFromCenter = Math.abs(dx - centerX) + Math.abs(dy - centerY);
          const isCenter = distFromCenter <= 2;
          applyMaterial(tile, isCenter ? material2 : material1);
          tile.biome = isCenter ? BiomeType.MOSAIC_CENTER : BiomeType.FLOOR;
          break;
      }
    }
  }
}
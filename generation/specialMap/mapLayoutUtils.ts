/**
 * Utility functions for special map layout generation
 * Extracted to avoid circular dependencies
 */

import { Tile, BiomeType } from '../../types';

/**
 * Place a rectangular wall with optional openings
 */
export function placeWallRectangle(
  tiles: Tile[][],
  x: number,
  y: number,
  width: number,
  height: number,
  openings?: Array<{ side: 'north' | 'south' | 'east' | 'west'; offset: number }>
) {
  // Top and bottom walls
  for (let i = 0; i < width; i++) {
    const skipTop = openings?.some(o => o.side === 'north' && o.offset === i);
    const skipBottom = openings?.some(o => o.side === 'south' && o.offset === i);
    
    if (!skipTop && tiles[y] && tiles[y][x + i]) {
      tiles[y][x + i].biome = BiomeType.WALL;
      tiles[y][x + i].isBlocking = true;
    }
    if (!skipBottom && tiles[y + height - 1] && tiles[y + height - 1][x + i]) {
      tiles[y + height - 1][x + i].biome = BiomeType.WALL;
      tiles[y + height - 1][x + i].isBlocking = true;
    }
  }
  
  // Left and right walls
  for (let i = 0; i < height; i++) {
    const skipLeft = openings?.some(o => o.side === 'west' && o.offset === i);
    const skipRight = openings?.some(o => o.side === 'east' && o.offset === i);
    
    if (!skipLeft && tiles[y + i] && tiles[y + i][x]) {
      tiles[y + i][x].biome = BiomeType.WALL;
      tiles[y + i][x].isBlocking = true;
    }
    if (!skipRight && tiles[y + i] && tiles[y + i][x + width - 1]) {
      tiles[y + i][x + width - 1].biome = BiomeType.WALL;
      tiles[y + i][x + width - 1].isBlocking = true;
    }
  }
}

/**
 * Fill a rectangular area with a specific biome
 */
export function fillArea(
  tiles: Tile[][],
  x: number,
  y: number,
  width: number,
  height: number,
  biome: BiomeType
) {
  for (let dy = 0; dy < height; dy++) {
    for (let dx = 0; dx < width; dx++) {
      if (tiles[y + dy] && tiles[y + dy][x + dx]) {
        tiles[y + dy][x + dx].biome = biome;
        tiles[y + dy][x + dx].isBlocking = false;
      }
    }
  }
}
/**
 * generation/specialMap/utils/tileHelpers.ts
 * Safe tile manipulation helpers for special map generation
 */

import { Tile, BiomeType } from '../../../types';

/**
 * Safely set a tile's biome with bounds checking
 */
export function setTileBiome(
  tiles: Tile[][], 
  x: number, 
  y: number, 
  biome: BiomeType
): boolean {
  if (y >= 0 && y < tiles.length && 
      x >= 0 && tiles[y] && x < tiles[y].length && 
      tiles[y][x]) {
    tiles[y][x].biome = biome;
    tiles[y][x].x = x;
    tiles[y][x].y = y;
    tiles[y][x].isLand = true;
    tiles[y][x].isExplored = true;
    return true;
  }
  return false;
}

/**
 * Safely get a tile with bounds checking
 */
export function getTile(
  tiles: Tile[][], 
  x: number, 
  y: number
): Tile | null {
  if (y >= 0 && y < tiles.length && 
      x >= 0 && tiles[y] && x < tiles[y].length && 
      tiles[y][x]) {
    return tiles[y][x];
  }
  return null;
}

/**
 * Draw a line of tiles with a specific biome
 */
export function drawLine(
  tiles: Tile[][], 
  x1: number, 
  y1: number, 
  x2: number, 
  y2: number, 
  biome: BiomeType
) {
  const dx = Math.abs(x2 - x1);
  const dy = Math.abs(y2 - y1);
  const sx = x1 < x2 ? 1 : -1;
  const sy = y1 < y2 ? 1 : -1;
  let err = dx - dy;

  let x = x1;
  let y = y1;

  while (true) {
    setTileBiome(tiles, x, y, biome);

    if (x === x2 && y === y2) break;

    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x += sx;
    }
    if (e2 < dx) {
      err += dx;
      y += sy;
    }
  }
}

/**
 * Draw a filled circle of tiles with a specific biome
 */
export function drawCircle(
  tiles: Tile[][], 
  centerX: number, 
  centerY: number, 
  radius: number, 
  biome: BiomeType,
  filled: boolean = true
) {
  for (let y = centerY - radius; y <= centerY + radius; y++) {
    for (let x = centerX - radius; x <= centerX + radius; x++) {
      const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
      if (filled ? (dist <= radius) : (Math.abs(dist - radius) < 1)) {
        setTileBiome(tiles, x, y, biome);
      }
    }
  }
}

/**
 * Draw a rectangle of tiles with a specific biome
 */
export function drawRectangle(
  tiles: Tile[][], 
  x: number, 
  y: number, 
  width: number, 
  height: number, 
  biome: BiomeType,
  filled: boolean = true
) {
  if (filled) {
    for (let dy = 0; dy < height; dy++) {
      for (let dx = 0; dx < width; dx++) {
        setTileBiome(tiles, x + dx, y + dy, biome);
      }
    }
  } else {
    // Top and bottom edges
    for (let dx = 0; dx < width; dx++) {
      setTileBiome(tiles, x + dx, y, biome);
      setTileBiome(tiles, x + dx, y + height - 1, biome);
    }
    // Left and right edges
    for (let dy = 1; dy < height - 1; dy++) {
      setTileBiome(tiles, x, y + dy, biome);
      setTileBiome(tiles, x + width - 1, y + dy, biome);
    }
  }
}
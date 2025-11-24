/**
 * Biome Transition Utilities
 *
 * Provides neighbor detection and transition strength calculation for beautiful
 * biome boundaries. Used during map generation to create gradual vegetation
 * density transitions instead of hard biome edges.
 */

import { BiomeType, Tile } from '../types';

/**
 * Water biomes that shouldn't blend with land
 */
const WATER_BIOMES = new Set([
  BiomeType.DEEP_OCEAN,
  BiomeType.SHALLOW_OCEAN,
  BiomeType.RIVER,
  BiomeType.MAJOR_RIVER,
  BiomeType.FRESHWATER_LAKE,
  BiomeType.WETLANDS,
  BiomeType.MANGROVE,
  BiomeType.ESTUARY,
]);

/**
 * Urban/artificial biomes that shouldn't blend with natural terrain
 */
const URBAN_BIOMES = new Set([
  BiomeType.HAMLET,
  BiomeType.LOW_DENSITY_CITY,
  BiomeType.DENSE_CITY,
  BiomeType.CITY_CENTER,
  BiomeType.MARKETPLACE,
  BiomeType.GOVERNMENT_DISTRICT,
  BiomeType.PALACE,
  BiomeType.HOLY_SITE,
  BiomeType.PLAZA,
  BiomeType.ROAD,
  BiomeType.HARBOR_DISTRICT,
  BiomeType.INDUSTRIAL_DISTRICT,
  BiomeType.FARMLAND,
  BiomeType.PARK,
]);

/**
 * Special biomes that shouldn't participate in transitions
 */
const NON_TRANSITIONABLE_BIOMES = new Set([
  BiomeType.RUINS,
  BiomeType.ACTIVE_LAVA,
  BiomeType.VOLCANIC_ROCK,
  BiomeType.HOT_SPRINGS,
  BiomeType.WALL,
  BiomeType.DOOR,
  BiomeType.FLOOR_STONE,
  BiomeType.FLOOR_WOOD,
]);

/**
 * Check if a biome is water-based
 */
function isWaterBiome(biome: BiomeType): boolean {
  return WATER_BIOMES.has(biome);
}

/**
 * Check if a biome is urban/artificial
 */
function isUrbanBiome(biome: BiomeType): boolean {
  return URBAN_BIOMES.has(biome);
}

/**
 * Check if a biome can participate in transitions
 */
function isTransitionableBiome(biome: BiomeType): boolean {
  return !NON_TRANSITIONABLE_BIOMES.has(biome);
}

/**
 * Check if two biomes should blend together
 *
 * Rules:
 * - Water and land don't blend
 * - Urban and natural don't blend
 * - Special biomes don't blend
 * - Natural biomes blend beautifully
 */
export function isTransitionablePair(biome1: BiomeType, biome2: BiomeType): boolean {
  // Same biome = no transition needed
  if (biome1 === biome2) return false;

  // Check if either is non-transitionable
  if (!isTransitionableBiome(biome1) || !isTransitionableBiome(biome2)) {
    return false;
  }

  // Don't blend water with land
  if (isWaterBiome(biome1) !== isWaterBiome(biome2)) {
    return false;
  }

  // Don't blend urban with natural
  if (isUrbanBiome(biome1) !== isUrbanBiome(biome2)) {
    return false;
  }

  // Natural biomes can blend
  return true;
}

/**
 * Check if a tile is at a biome boundary (has different neighbors)
 *
 * @param x - Tile x coordinate
 * @param y - Tile y coordinate
 * @param tiles - 2D array of all map tiles
 * @returns true if tile borders a different biome
 */
export function isTransitionTile(
  x: number,
  y: number,
  tiles: Tile[][]
): boolean {
  const currentBiome = tiles[y]?.[x]?.biome;
  if (!currentBiome) return false;

  // Check 8 neighbors (including diagonals)
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue; // Skip self

      const neighbor = tiles[y + dy]?.[x + dx];
      if (neighbor && neighbor.biome !== currentBiome) {
        if (isTransitionablePair(currentBiome, neighbor.biome)) {
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * Get transition strength for a tile (how close to biome edge)
 *
 * Returns a value from 0-1:
 * - 0.0 = deep in biome (all 8 neighbors are same biome)
 * - 0.5 = moderate edge (4/8 neighbors different)
 * - 1.0 = isolated tile (all 8 neighbors different)
 *
 * @param x - Tile x coordinate
 * @param y - Tile y coordinate
 * @param tiles - 2D array of all map tiles
 * @returns Transition strength (0-1)
 */
export function getTransitionStrength(
  x: number,
  y: number,
  tiles: Tile[][]
): number {
  const currentBiome = tiles[y]?.[x]?.biome;
  if (!currentBiome) return 0;

  let differentNeighbors = 0;
  let totalNeighbors = 0;

  // Check 8 neighbors (including diagonals)
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue; // Skip self

      const neighbor = tiles[y + dy]?.[x + dx];
      if (neighbor) {
        totalNeighbors++;
        if (neighbor.biome !== currentBiome && isTransitionablePair(currentBiome, neighbor.biome)) {
          differentNeighbors++;
        }
      }
    }
  }

  // Edge tiles (near map boundary) have fewer neighbors
  if (totalNeighbors === 0) return 0;

  // Return ratio of different neighbors
  return differentNeighbors / totalNeighbors;
}

/**
 * Get all unique neighboring biomes for a tile
 *
 * @param x - Tile x coordinate
 * @param y - Tile y coordinate
 * @param tiles - 2D array of all map tiles
 * @returns Array of neighboring biome types (excluding the tile's own biome)
 */
export function getNeighboringBiomes(
  x: number,
  y: number,
  tiles: Tile[][]
): BiomeType[] {
  const currentBiome = tiles[y]?.[x]?.biome;
  if (!currentBiome) return [];

  const neighborBiomes = new Set<BiomeType>();

  // Check 8 neighbors (including diagonals)
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue; // Skip self

      const neighbor = tiles[y + dy]?.[x + dx];
      if (neighbor && neighbor.biome !== currentBiome) {
        neighborBiomes.add(neighbor.biome);
      }
    }
  }

  return Array.from(neighborBiomes);
}

/**
 * Calculate vegetation density modifier based on transition strength
 *
 * This creates a smooth gradient of vegetation at biome boundaries:
 * - Deep in biome: 100% density (modifier = 1.0)
 * - Light edge: 80% density (modifier = 0.8)
 * - Heavy edge: 40% density (modifier = 0.4)
 *
 * @param transitionStrength - Value from 0-1 (from getTransitionStrength)
 * @param maxReduction - Maximum density reduction (0-1), default 0.6 (60% reduction)
 * @returns Density modifier (0-1) to multiply against base spawn rate
 */
export function getVegetationDensityModifier(
  transitionStrength: number,
  maxReduction: number = 0.6
): number {
  // Reduce vegetation density by up to maxReduction at full transition
  return 1 - (transitionStrength * maxReduction);
}

/**
 * Get transition distance (in tiles) from biome edge
 *
 * Used for multi-tile gradient transitions. Returns approximate distance
 * to nearest different biome.
 *
 * @param x - Tile x coordinate
 * @param y - Tile y coordinate
 * @param tiles - 2D array of all map tiles
 * @param maxDistance - Maximum distance to search (default 3 tiles)
 * @returns Distance to nearest different biome (0 = at edge, maxDistance = deep in biome)
 */
export function getDistanceToTransition(
  x: number,
  y: number,
  tiles: Tile[][],
  maxDistance: number = 3
): number {
  const currentBiome = tiles[y]?.[x]?.biome;
  if (!currentBiome) return maxDistance;

  // Check in expanding rings
  for (let distance = 1; distance <= maxDistance; distance++) {
    for (let dy = -distance; dy <= distance; dy++) {
      for (let dx = -distance; dx <= distance; dx++) {
        // Only check the outer ring
        if (Math.abs(dx) < distance && Math.abs(dy) < distance) continue;

        const neighbor = tiles[y + dy]?.[x + dx];
        if (neighbor && neighbor.biome !== currentBiome) {
          if (isTransitionablePair(currentBiome, neighbor.biome)) {
            return distance - 1; // Return 0-based distance
          }
        }
      }
    }
  }

  return maxDistance;
}

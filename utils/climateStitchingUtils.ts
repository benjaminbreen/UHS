/**
 * utils/climateStitchingUtils.ts - Climate-aware map stitching utilities
 * 
 * Provides functions to create smooth climate transitions between adjacent maps
 * with different climate zones (e.g., COLD → TEMPERATE → TROPICAL transitions).
 */

import { ClimateType, BiomeType, AdjacencyDirection } from '../types';
import { ADJACENCIES } from '../constants/gameData/adjacencies';
import { findMapAreaDefinition } from './geographyUtils';

/**
 * Climate transition influence distance (in tiles from edge)
 * Biomes within this distance will be modified based on neighboring climate
 */
export const CLIMATE_TRANSITION_DISTANCE = 12;

/**
 * Base strength of climate transition effect (0.0 to 1.0)
 * Higher values create more dramatic climate transitions
 */
export const CLIMATE_TRANSITION_STRENGTH = 0.8;

/**
 * Noise scale for organic climate boundaries
 * Lower values create smoother, larger organic patterns
 */
export const CLIMATE_NOISE_SCALE = 0.08;

/**
 * Get information about neighboring climates for a given map area
 */
export function getNeighboringClimateInfo(
  currentArea: string, 
  currentClimate: ClimateType
): Record<AdjacencyDirection, ClimateType | null> {
  const adjacencies = ADJACENCIES[currentArea];
  if (!adjacencies) {
    return { N: null, S: null, E: null, W: null };
  }

  const result: Record<AdjacencyDirection, ClimateType | null> = {
    N: null, S: null, E: null, W: null
  };

  // Get climate for each adjacent area
  (['N', 'S', 'E', 'W'] as AdjacencyDirection[]).forEach(direction => {
    const adjacentAreaKey = adjacencies[direction];
    if (adjacentAreaKey && !adjacentAreaKey.startsWith('LIMINAL_')) {
      const adjacentAreaInfo = findMapAreaDefinition(adjacentAreaKey);
      if (adjacentAreaInfo) {
        result[direction] = adjacentAreaInfo.areaDef.climate;
      }
    }
  });

  return result;
}

/**
 * Get climate transition biome for a given position and neighboring climate
 * 
 * @param originalBiome - The original biome at this position
 * @param currentClimate - Current map's climate  
 * @param neighborClimate - Adjacent map's climate
 * @param distanceFromEdge - Distance in tiles from the edge (0 = on edge)
 * @param x - X coordinate for noise sampling
 * @param y - Y coordinate for noise sampling
 * @param maxDistance - Maximum transition distance
 * @returns Modified biome or original if no transition needed
 */
export function getClimateTransitionBiome(
  originalBiome: BiomeType,
  currentClimate: ClimateType, 
  neighborClimate: ClimateType,
  distanceFromEdge: number,
  x: number,
  y: number,
  maxDistance: number = CLIMATE_TRANSITION_DISTANCE
): BiomeType {
  // No transition if same climate
  if (currentClimate === neighborClimate) {
    return originalBiome;
  }

  // Add noise to create organic boundaries
  const noiseValue = Math.sin(x * CLIMATE_NOISE_SCALE) * Math.cos(y * CLIMATE_NOISE_SCALE) * 
                     Math.sin((x + y) * CLIMATE_NOISE_SCALE * 0.5);
  
  // Vary the transition distance based on noise (±4 tiles)
  const noisyMaxDistance = maxDistance + (noiseValue * 4);
  
  // No transition if too far from edge (with noisy boundary)
  if (distanceFromEdge >= noisyMaxDistance) {
    return originalBiome;
  }

  // Calculate transition strength with noise variation (1.0 at edge, 0.0 at max distance)
  const baseTransitionStrength = Math.max(0, 1 - (distanceFromEdge / noisyMaxDistance));
  
  // Add noise to transition strength (±0.3 variation)
  const noisyStrength = baseTransitionStrength + (noiseValue * 0.3);
  const transitionStrength = Math.max(0, Math.min(1, noisyStrength)) * CLIMATE_TRANSITION_STRENGTH;
  
  // Only apply transitions to certain biomes (avoid changing water, urban, etc.)
  const transitionableBiomes = new Set([
    BiomeType.GRASSLAND, BiomeType.SCRUB, BiomeType.TUNDRA,
    BiomeType.DESERT, BiomeType.VOLCANIC_ROCK,
    BiomeType.FOREST, BiomeType.HILLS, BiomeType.STEPPE,
    BiomeType.DENSE_FOREST, BiomeType.JUNGLE, BiomeType.MOUNTAIN,
    BiomeType.SAVANNA, BiomeType.TAIGA, BiomeType.PRAIRIE, BiomeType.ALPINE_MEADOW,
    BiomeType.BADLANDS
  ]);
  
  if (!transitionableBiomes.has(originalBiome)) {
    return originalBiome;
  }

  // Apply climate transition based on the climate shift
  const transitionedBiome = applyClimateTransition(originalBiome, currentClimate, neighborClimate, transitionStrength);
  
  // Validate the result - if undefined, return original
  if (!transitionedBiome) {
    console.warn(`[Climate Stitching] Invalid biome transition from ${originalBiome} (${currentClimate} → ${neighborClimate}), using original`);
    return originalBiome;
  }
  
  return transitionedBiome;
}

/**
 * Apply climate-specific biome transitions
 */
function applyClimateTransition(
  originalBiome: BiomeType,
  fromClimate: ClimateType,
  toClimate: ClimateType, 
  strength: number
): BiomeType {
  // COLD → TEMPERATE transitions using new biomes
  if (fromClimate === ClimateType.COLD && toClimate === ClimateType.TEMPERATE) {
    if (strength > 0.6) {
      switch (originalBiome) {
        case BiomeType.TUNDRA: return BiomeType.STEPPE;
        case BiomeType.STEPPE: return BiomeType.PRAIRIE;
        case BiomeType.TAIGA: return BiomeType.FOREST;
        case BiomeType.SNOW: return BiomeType.ALPINE_MEADOW;
        default: return originalBiome;
      }
    } else if (strength > 0.3) {
      switch (originalBiome) {
        case BiomeType.TUNDRA: return BiomeType.STEPPE;
        case BiomeType.TAIGA: return BiomeType.FOREST;
        case BiomeType.ALPINE_MEADOW: return BiomeType.GRASSLAND;
        default: return originalBiome;
      }
    }
  }

  // TEMPERATE → COLD transitions using new biomes
  if (fromClimate === ClimateType.TEMPERATE && toClimate === ClimateType.COLD) {
    if (strength > 0.6) {
      switch (originalBiome) {
        case BiomeType.GRASSLAND: return BiomeType.STEPPE;
        case BiomeType.PRAIRIE: return BiomeType.STEPPE;
        case BiomeType.FOREST: return BiomeType.TAIGA;
        case BiomeType.DENSE_FOREST: return BiomeType.TAIGA;
        case BiomeType.SCRUB: return BiomeType.STEPPE;
        default: return originalBiome;
      }
    } else if (strength > 0.3) {
      switch (originalBiome) {
        case BiomeType.GRASSLAND: return BiomeType.PRAIRIE;
        case BiomeType.PRAIRIE: return BiomeType.STEPPE;
        case BiomeType.FOREST: return BiomeType.TAIGA;
        case BiomeType.DENSE_FOREST: return BiomeType.FOREST;
        case BiomeType.SCRUB: return BiomeType.SCRUB; // Keep scrub as scrub in moderate transitions
        default: return originalBiome;
      }
    } else if (strength > 0.1) {
      // Weak transitions - minimal change but still valid
      switch (originalBiome) {
        case BiomeType.GRASSLAND: return BiomeType.PRAIRIE;
        case BiomeType.SCRUB: return BiomeType.SCRUB; // Scrub stays scrub in weak transitions
        default: return originalBiome;
      }
    }
  }

  // TEMPERATE → TROPICAL transitions using SAVANNA
  if (fromClimate === ClimateType.TEMPERATE && toClimate === ClimateType.TROPICAL) {
    if (strength > 0.6) {
      switch (originalBiome) {
        case BiomeType.GRASSLAND: return BiomeType.SAVANNA;
        case BiomeType.PRAIRIE: return BiomeType.SAVANNA;
        case BiomeType.FOREST: return BiomeType.JUNGLE;
        case BiomeType.DENSE_FOREST: return BiomeType.JUNGLE;
        case BiomeType.SCRUB: return BiomeType.SAVANNA;
        default: return originalBiome;
      }
    } else if (strength > 0.3) {
      switch (originalBiome) {
        case BiomeType.GRASSLAND: return BiomeType.SAVANNA;
        case BiomeType.PRAIRIE: return BiomeType.SAVANNA;
        case BiomeType.FOREST: return BiomeType.DENSE_FOREST;
        default: return originalBiome;
      }
    }
  }

  // TROPICAL → TEMPERATE transitions using SAVANNA
  if (fromClimate === ClimateType.TROPICAL && toClimate === ClimateType.TEMPERATE) {
    if (strength > 0.6) {
      switch (originalBiome) {
        case BiomeType.JUNGLE: return BiomeType.FOREST;
        case BiomeType.SAVANNA: return BiomeType.PRAIRIE;
        case BiomeType.GRASSLAND: return BiomeType.PRAIRIE;
        default: return originalBiome;
      }
    } else if (strength > 0.3) {
      switch (originalBiome) {
        case BiomeType.JUNGLE: return BiomeType.DENSE_FOREST;
        case BiomeType.SAVANNA: return BiomeType.GRASSLAND;
        default: return originalBiome;
      }
    }
  }

  // TEMPERATE → ARID transitions using SAVANNA
  if (fromClimate === ClimateType.TEMPERATE && toClimate === ClimateType.ARID) {
    if (strength > 0.6) {
      switch (originalBiome) {
        case BiomeType.GRASSLAND: return BiomeType.SAVANNA;
        case BiomeType.PRAIRIE: return BiomeType.SAVANNA;
        case BiomeType.FOREST: return BiomeType.SCRUB;
        case BiomeType.DENSE_FOREST: return BiomeType.SCRUB;
        case BiomeType.SCRUB: return BiomeType.DESERT;
        default: return originalBiome;
      }
    } else if (strength > 0.3) {
      switch (originalBiome) {
        case BiomeType.GRASSLAND: return BiomeType.SAVANNA;
        case BiomeType.PRAIRIE: return BiomeType.SAVANNA;
        case BiomeType.FOREST: return BiomeType.SCRUB;
        case BiomeType.DENSE_FOREST: return BiomeType.SCRUB;
        default: return originalBiome;
      }
    }
  }

  // ARID → TEMPERATE transitions using SAVANNA
  if (fromClimate === ClimateType.ARID && toClimate === ClimateType.TEMPERATE) {
    if (strength > 0.6) {
      switch (originalBiome) {
        case BiomeType.DESERT: return BiomeType.SAVANNA;
        case BiomeType.SAVANNA: return BiomeType.PRAIRIE;
        case BiomeType.SCRUB: return BiomeType.GRASSLAND;
        default: return originalBiome;
      }
    } else if (strength > 0.3) {
      switch (originalBiome) {
        case BiomeType.DESERT: return BiomeType.SAVANNA;
        case BiomeType.SCRUB: return BiomeType.SAVANNA;
        default: return originalBiome;
      }
    }
  }

  return originalBiome;
}

/**
 * Check if a position is within the climate transition zone for a given direction
 */
export function isInClimateTransitionZone(
  x: number, 
  y: number, 
  mapWidth: number, 
  mapHeight: number,
  direction: AdjacencyDirection,
  transitionDistance: number = CLIMATE_TRANSITION_DISTANCE
): { inZone: boolean; distanceFromEdge: number } {
  let distanceFromEdge = Infinity;

  switch (direction) {
    case 'N':
      distanceFromEdge = y;
      break;
    case 'S':
      distanceFromEdge = mapHeight - 1 - y;
      break;
    case 'W':
      distanceFromEdge = x;
      break;
    case 'E':
      distanceFromEdge = mapWidth - 1 - x;
      break;
  }

  // Add noise to transition boundary for organic edges
  const noiseValue = Math.sin(x * CLIMATE_NOISE_SCALE) * Math.cos(y * CLIMATE_NOISE_SCALE);
  const noisyTransitionDistance = transitionDistance + (noiseValue * 4);

  return {
    inZone: distanceFromEdge < noisyTransitionDistance,
    distanceFromEdge
  };
}

/**
 * Apply climate transitions to all tiles in a map based on neighboring climates
 */
export function applyClimateTransitionsToMap(
  tiles: { biome: BiomeType; x: number; y: number }[],
  currentClimate: ClimateType,
  neighboringClimates: Record<AdjacencyDirection, ClimateType | null>,
  mapWidth: number,
  mapHeight: number
): void {
  tiles.forEach(tile => {
    let modifiedBiome = tile.biome;

    // Check each direction for climate transitions
    (['N', 'S', 'E', 'W'] as AdjacencyDirection[]).forEach(direction => {
      const neighborClimate = neighboringClimates[direction];
      if (!neighborClimate) return;

      const transitionInfo = isInClimateTransitionZone(
        tile.x, tile.y, mapWidth, mapHeight, direction
      );

      if (transitionInfo.inZone) {
        const transitionBiome = getClimateTransitionBiome(
          modifiedBiome,
          currentClimate,
          neighborClimate,
          transitionInfo.distanceFromEdge,
          tile.x,
          tile.y
        );
        
        // Use the most dramatic transition if multiple directions apply
        if (transitionBiome !== modifiedBiome) {
          modifiedBiome = transitionBiome;
        }
      }
    });

    tile.biome = modifiedBiome;
  });
}

/**
 * Debug information for climate transitions
 */
export function getClimateTransitionDebugInfo(
  currentArea: string,
  currentClimate: ClimateType
): string {
  const neighbors = getNeighboringClimateInfo(currentArea, currentClimate);
  const transitions = [];

  (['N', 'S', 'E', 'W'] as AdjacencyDirection[]).forEach(dir => {
    const neighborClimate = neighbors[dir];
    if (neighborClimate && neighborClimate !== currentClimate) {
      transitions.push(`${dir}: ${currentClimate} → ${neighborClimate}`);
    }
  });

  return transitions.length > 0 
    ? `Climate transitions: ${transitions.join(', ')}`
    : 'No climate transitions detected';
}
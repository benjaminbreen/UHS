/**
 * constants/gameData/factions.ts - Main entry point for all faction data.
 *
 * PERFORMANCE OPTIMIZATION (Phase 1):
 * This file now uses lazy loading to prevent loading 1MB+ of faction data on app startup.
 * Faction data is loaded on-demand when needed for a specific cultural zone.
 */
import { FactionDatabase, ClimateType, MapArchetype, CulturalZone } from '../../types';

// Re-export types and utilities
export * from './factions/types';

// Re-export the loader functions from the index
export { loadFactionData, loadAllFactionData } from './factions/index';

// Re-export only the generic fallback generator (small utility function)
export { generateGenericFactions } from './factions/genericFallbacks';

/**
 * TEMPORARY: Synchronous access to FACTION_DATA for backwards compatibility.
 *
 * This loads ALL faction data synchronously on first access using static imports.
 * Not ideal for bundle size, but necessary while map generators are synchronous.
 *
 * TODO Phase 2: Make map generators async and remove this.
 */
import { EUROPEAN_FACTIONS } from './factions/european';
import { MENA_FACTIONS } from './factions/mena';
import { EAST_ASIAN_FACTIONS } from './factions/eastAsian';
import { SOUTH_ASIAN_FACTIONS } from './factions/southAsian';
import { SUB_SAHARAN_AFRICAN_FACTIONS } from './factions/subSaharanAfrican';
import { NORTH_AMERICAN_PRE_COLUMBIAN_FACTIONS } from './factions/northAmericanPreColumbian';
import { NORTH_AMERICAN_COLONIAL_FACTIONS } from './factions/northAmericanColonial';
import { SOUTH_AMERICAN_FACTIONS } from './factions/southAmerican';
import { OCEANIA_FACTIONS } from './factions/oceania';
import { GENERIC_FALLBACK_FACTIONS } from './factions/genericFallbacks';

export const FACTION_DATA: FactionDatabase = {
  ...EUROPEAN_FACTIONS,
  ...MENA_FACTIONS,
  ...EAST_ASIAN_FACTIONS,
  ...SOUTH_ASIAN_FACTIONS,
  ...SUB_SAHARAN_AFRICAN_FACTIONS,
  ...NORTH_AMERICAN_PRE_COLUMBIAN_FACTIONS,
  ...NORTH_AMERICAN_COLONIAL_FACTIONS,
  ...SOUTH_AMERICAN_FACTIONS,
  ...OCEANIA_FACTIONS,
  ...GENERIC_FALLBACK_FACTIONS
};

/**
 * Get faction data for a region, with fallback to generic factions if no specific data exists.
 * This now loads faction data asynchronously for better performance.
 *
 * @param culturalZone - The cultural zone to load factions for
 * @param mapAreaName - The specific map area within the zone
 * @param climate - Climate type for generic faction generation if needed
 * @param archetype - Map archetype for generic faction generation if needed
 * @returns Promise resolving to faction data for the region
 */
export async function getFactionDataWithFallback(
  culturalZone: string | CulturalZone,
  mapAreaName: string,
  climate: ClimateType,
  archetype: MapArchetype
) {
  // Import generic faction generator directly (avoid circular dependency)
  const { generateGenericFactions } = await import('./factions/genericFallbacks');

  // Load faction data for this specific zone only (direct import, no cycle)
  const { loadFactionData } = await import('./factions/index');
  const zoneData = await loadFactionData(culturalZone as CulturalZone);

  // Check if we have specific faction data
  const existingData = zoneData[culturalZone as CulturalZone]?.[mapAreaName];
  if (existingData) {
    return existingData;
  }

  // Generate generic fallback faction data
  console.log(`Generating generic faction data for ${mapAreaName} in ${culturalZone}`);
  return generateGenericFactions(mapAreaName, climate, archetype, culturalZone);
}

/**
 * Check if a region has specific (non-generic) faction data.
 * This now loads faction data asynchronously for better performance.
 *
 * @param culturalZone - The cultural zone to check
 * @param mapAreaName - The specific map area within the zone
 * @returns Promise resolving to boolean indicating if specific data exists
 */
export async function hasSpecificFactionData(culturalZone: string | CulturalZone, mapAreaName: string): Promise<boolean> {
  // Direct import to avoid circular dependency
  const { loadFactionData } = await import('./factions/index');
  const zoneData = await loadFactionData(culturalZone as CulturalZone);
  return Boolean(zoneData[culturalZone as CulturalZone]?.[mapAreaName]);
}

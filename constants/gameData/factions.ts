/**
 * constants/gameData/factions.ts - Main entry point for all faction data.
 * This file imports data from modularized cultural zone files and exports them as a single object.
 */
import { FactionDatabase, ClimateType, MapArchetype } from '../../types';
import { EUROPEAN_FACTIONS } from './factions/european';
import { NORTH_AMERICAN_PRE_COLUMBIAN_FACTIONS } from './factions/northAmericanPreColumbian';
import { NORTH_AMERICAN_COLONIAL_FACTIONS } from './factions/northAmericanColonial';
import { SOUTH_AMERICAN_FACTIONS } from './factions/southAmerican';
import { MENA_FACTIONS } from './factions/mena';
import { SUB_SAHARAN_AFRICAN_FACTIONS } from './factions/subSaharanAfrican';
import { SOUTH_ASIAN_FACTIONS } from './factions/southAsian';
import { EAST_ASIAN_FACTIONS } from './factions/eastAsian';
import { OCEANIA_FACTIONS } from './factions/oceania';
import { GENERIC_FALLBACK_FACTIONS, generateGenericFactions } from './factions/genericFallbacks';

export * from './factions/types';
export * from './factions/genericFallbacks';

export const FACTION_DATA: FactionDatabase = {
  ...EUROPEAN_FACTIONS,
  ...NORTH_AMERICAN_PRE_COLUMBIAN_FACTIONS,
  ...NORTH_AMERICAN_COLONIAL_FACTIONS,
  ...SOUTH_AMERICAN_FACTIONS,
  ...MENA_FACTIONS,
  ...SUB_SAHARAN_AFRICAN_FACTIONS,
  ...SOUTH_ASIAN_FACTIONS,
  ...EAST_ASIAN_FACTIONS,
  ...OCEANIA_FACTIONS,
  ...GENERIC_FALLBACK_FACTIONS
};

/**
 * Get faction data for a region, with fallback to generic factions if no specific data exists
 */
export function getFactionDataWithFallback(
  culturalZone: string,
  mapAreaName: string,
  climate: ClimateType,
  archetype: MapArchetype
) {
  // Check if we have specific faction data
  const existingData = FACTION_DATA[culturalZone]?.[mapAreaName];
  if (existingData) {
    return existingData;
  }

  // Generate generic fallback faction data
  console.log(`Generating generic faction data for ${mapAreaName} in ${culturalZone}`);
  return generateGenericFactions(mapAreaName, climate, archetype, culturalZone);
}

/**
 * Check if a region has specific (non-generic) faction data
 */
export function hasSpecificFactionData(culturalZone: string, mapAreaName: string): boolean {
  return Boolean(FACTION_DATA[culturalZone]?.[mapAreaName]);
}

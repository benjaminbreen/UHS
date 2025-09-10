/**
 * generation/specialMap/culturalGeneratorRegistry.ts
 * Registry system for culture-specific special map generators
 * Allows modular addition of new cultural implementations without modifying core files
 */

import { Tile } from '../../types';
import { SpecialMapConfig, InteractionZone, RoomDefinition } from '../../types/specialMapTypes';
import { ValueNoise } from '../../utils/noise';

/**
 * Type definition for cultural generator functions
 */
export type CulturalGenerator = (
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  interactionZones: InteractionZone[],
  rooms: RoomDefinition[],
  noise: ValueNoise
) => void;

/**
 * Registry mapping archetypes to culture-specific generators
 * Structure: ARCHETYPE -> CULTURE -> Generator Function
 */
export const CULTURAL_GENERATORS: Record<string, Record<string, CulturalGenerator>> = {
  'SACRED_COMPLEX': {},
  'GOVERNMENT_FORUM': {},
  'TRIBAL_COUNCIL': {},
  'PALACE_COMPLEX': {},
  'ESTATES': {},
  'MARKET_BAZAAR': {},
  'UNIVERSITY': {},
  'THEATER': {},
  'ARENA': {}
};

/**
 * Register a cultural generator for a specific archetype and culture
 */
export function registerCulturalGenerator(
  archetype: string,
  culture: string,
  generator: CulturalGenerator
): void {
  if (!CULTURAL_GENERATORS[archetype]) {
    CULTURAL_GENERATORS[archetype] = {};
  }
  CULTURAL_GENERATORS[archetype][culture] = generator;
  console.log(`[Registry] Registered ${culture} generator for ${archetype}`);
}

/**
 * Get the appropriate cultural generator for an archetype/culture combination
 */
export function getCulturalGenerator(
  archetype: string,
  culture: string
): CulturalGenerator | null {
  const archetypeGenerators = CULTURAL_GENERATORS[archetype];
  if (!archetypeGenerators) {
    return null;
  }
  
  // Direct culture match
  if (archetypeGenerators[culture]) {
    return archetypeGenerators[culture];
  }
  
  // Try culture aliases
  const cultureAliases: Record<string, string[]> = {
    'NORTH_AMERICAN_PRE_COLUMBIAN': ['NATIVE_AMERICAN', 'INDIGENOUS_AMERICAN', 'NORTH_AMERICAN'],
    'OCEANIA': ['OCEANIC', 'PACIFIC_ISLANDER', 'POLYNESIAN', 'MELANESIAN', 'MICRONESIAN'],
    'SUB_SAHARAN_AFRICAN': ['AFRICAN', 'SUB_SAHARAN'],
    'MENA': ['MIDDLE_EASTERN', 'NORTH_AFRICAN', 'ARAB'],
    'SOUTH_AMERICAN': ['SOUTH_AMERICA', 'ANDEAN', 'AMAZONIAN', 'INCA', 'COLONIAL_SPANISH']
  };
  
  for (const [mainCulture, aliases] of Object.entries(cultureAliases)) {
    if (aliases.includes(culture) && archetypeGenerators[mainCulture]) {
      return archetypeGenerators[mainCulture];
    }
    if (culture === mainCulture) {
      for (const alias of aliases) {
        if (archetypeGenerators[alias]) {
          return archetypeGenerators[alias];
        }
      }
    }
  }
  
  return null;
}

/**
 * Check if a cultural generator exists
 */
export function hasCulturalGenerator(
  archetype: string,
  culture: string
): boolean {
  return getCulturalGenerator(archetype, culture) !== null;
}

/**
 * List all registered cultural generators (for debugging)
 */
export function listRegisteredGenerators(): void {
  console.log('[Registry] Registered Cultural Generators:');
  for (const [archetype, cultures] of Object.entries(CULTURAL_GENERATORS)) {
    const cultureList = Object.keys(cultures);
    if (cultureList.length > 0) {
      console.log(`  ${archetype}: ${cultureList.join(', ')}`);
    }
  }
}
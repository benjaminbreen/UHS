/**
 * constants/gameData/factions/index.ts
 * Lazy loading facade for faction data to prevent loading all 1MB+ of faction data on startup.
 *
 * Usage:
 *   const factions = await loadFactionData('EUROPEAN');
 *   // or
 *   const factions = await loadFactionData('MENA');
 */

import type { FactionFile } from './types';
import type { CulturalZone } from '../../../types';

export type { FactionFile };

/**
 * Dynamically loads faction data for a specific cultural zone.
 * This prevents loading all 1MB+ of faction data on app startup.
 *
 * @param zone - The cultural zone to load factions for
 * @returns Promise resolving to the faction data for that zone
 */
export async function loadFactionData(zone: CulturalZone | string): Promise<FactionFile> {
  const normalizedZone = typeof zone === 'string' ? zone.toUpperCase().replace(/-/g, '_') : zone;

  switch (normalizedZone) {
    case 'EUROPEAN':
      return (await import('./european')).EUROPEAN_FACTIONS;

    case 'MENA':
      return (await import('./mena')).MENA_FACTIONS;

    case 'EAST_ASIAN':
    case 'EASTASIAN':
      return (await import('./eastAsian')).EAST_ASIAN_FACTIONS;

    case 'SOUTH_ASIAN':
    case 'SOUTHASIAN':
      return (await import('./southAsian')).SOUTH_ASIAN_FACTIONS;

    case 'SUB_SAHARAN_AFRICAN':
    case 'SUBSAHARANAFRICAN':
    case 'AFRICAN':
      return (await import('./subSaharanAfrican')).SUB_SAHARAN_AFRICAN_FACTIONS;

    case 'NORTH_AMERICAN_PRE_COLUMBIAN':
    case 'NORTHAMERICANPRECOLUMBIAN':
    case 'PRE_COLUMBIAN':
    case 'PRECOLUMBIAN':
      return (await import('./northAmericanPreColumbian')).NORTH_AMERICAN_PRE_COLUMBIAN_FACTIONS;

    case 'NORTH_AMERICAN_COLONIAL':
    case 'NORTHAMERICANCOLONIAL':
    case 'COLONIAL':
      return (await import('./northAmericanColonial')).NORTH_AMERICAN_COLONIAL_FACTIONS;

    case 'SOUTH_AMERICAN':
    case 'SOUTHAMERICAN':
      return (await import('./southAmerican')).SOUTH_AMERICAN_FACTIONS;

    case 'OCEANIA':
      return (await import('./oceania')).OCEANIA_FACTIONS;

    default:
      console.warn(`[loadFactionData] Unknown cultural zone: ${normalizedZone}, using generic fallbacks`);
      return (await import('./genericFallbacks')).GENERIC_FALLBACK_FACTIONS;
  }
}

/**
 * Synchronously loads all faction data (for backwards compatibility or when needed).
 * WARNING: This loads 1MB+ of data and should only be used when absolutely necessary.
 *
 * @returns Promise resolving to all faction data across all zones
 */
export async function loadAllFactionData(): Promise<Record<string, FactionFile>> {
  const [
    european,
    mena,
    eastAsian,
    southAsian,
    subSaharanAfrican,
    northAmericanPreColumbian,
    northAmericanColonial,
    southAmerican,
    oceania,
    genericFallbacks
  ] = await Promise.all([
    import('./european'),
    import('./mena'),
    import('./eastAsian'),
    import('./southAsian'),
    import('./subSaharanAfrican'),
    import('./northAmericanPreColumbian'),
    import('./northAmericanColonial'),
    import('./southAmerican'),
    import('./oceania'),
    import('./genericFallbacks')
  ]);

  return {
    EUROPEAN: european.EUROPEAN_FACTIONS,
    MENA: mena.MENA_FACTIONS,
    EAST_ASIAN: eastAsian.EAST_ASIAN_FACTIONS,
    SOUTH_ASIAN: southAsian.SOUTH_ASIAN_FACTIONS,
    SUB_SAHARAN_AFRICAN: subSaharanAfrican.SUB_SAHARAN_AFRICAN_FACTIONS,
    NORTH_AMERICAN_PRE_COLUMBIAN: northAmericanPreColumbian.NORTH_AMERICAN_PRE_COLUMBIAN_FACTIONS,
    NORTH_AMERICAN_COLONIAL: northAmericanColonial.NORTH_AMERICAN_COLONIAL_FACTIONS,
    SOUTH_AMERICAN: southAmerican.SOUTH_AMERICAN_FACTIONS,
    OCEANIA: oceania.OCEANIA_FACTIONS,
    GENERIC_FALLBACK: genericFallbacks.GENERIC_FALLBACK_FACTIONS
  };
}

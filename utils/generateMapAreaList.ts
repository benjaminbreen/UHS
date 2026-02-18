/**
 * Utility to generate the exact list of map areas from geography data
 * This ensures the WorldWeaver LLM prompt always has the current, accurate list
 */

import { GEOGRAPHICAL_DATA } from '../constants/gameData/geography';

export function generateMapAreaListForPrompt(): string {
  const zones: string[] = [];

  for (const [zoneName, zoneData] of Object.entries(GEOGRAPHICAL_DATA)) {
    const regionGroups: string[] = [];

    for (const [regionName, regionData] of Object.entries(zoneData)) {
      const areaNames = Object.values(regionData).map(area => area.name);
      if (areaNames.length > 0) {
        // Format: region label is clearly NOT a valid name; valid names are indented below it
        regionGroups.push(`  [${regionName}] — valid areas:\n    ${areaNames.join(' | ')}`);
      }
    }

    if (regionGroups.length > 0) {
      zones.push(`${zoneName}:\n${regionGroups.join('\n')}`);
    }
  }

  return zones.join('\n\n');
}

export function getAllValidMapAreaNames(): string[] {
  const areas: string[] = [];
  
  for (const zoneData of Object.values(GEOGRAPHICAL_DATA)) {
    for (const regionData of Object.values(zoneData)) {
      for (const areaDef of Object.values(regionData)) {
        areas.push(areaDef.name);
      }
    }
  }
  
  return areas;
}

export function isValidMapAreaName(name: string): boolean {
  const validNames = getAllValidMapAreaNames();
  return validNames.includes(name);
}

/**
 * If the LLM returns a region name instead of an area name, find the first area in that region.
 * This handles cases like "Central California Coast" → "Monterey Bay".
 */
export function findAreaByRegionName(regionName: string): string | null {
  for (const zoneData of Object.values(GEOGRAPHICAL_DATA)) {
    for (const [rName, regionData] of Object.entries(zoneData)) {
      if (rName === regionName) {
        const areas = Object.values(regionData);
        if (areas.length > 0) {
          return areas[0].name;
        }
      }
    }
  }
  return null;
}
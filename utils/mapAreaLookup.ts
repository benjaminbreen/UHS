/**
 * Map Area Lookup Utility
 * Helps find the correct zone for a given map area name
 */

import { GEOGRAPHICAL_DATA } from '../constants/gameData/geography';

export function findZoneForMapArea(mapAreaName: string): { zone: string, region: string } | null {
  for (const [zoneName, zoneData] of Object.entries(GEOGRAPHICAL_DATA)) {
    for (const [regionName, regionData] of Object.entries(zoneData)) {
      for (const areaDef of Object.values(regionData)) {
        if (areaDef.name === mapAreaName) {
          return { zone: zoneName, region: regionName };
        }
      }
    }
  }

  return null;
}

export function getAllMapAreaNames(): string[] {
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
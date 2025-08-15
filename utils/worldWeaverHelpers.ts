/**
 * Helper functions for WorldWeaver zone/region name normalization
 */

import { GEOGRAPHICAL_DATA } from '../constants/gameData/geography';

/**
 * Normalize zone names from LLM response to match our geography data
 */
export function normalizeZoneName(zone: string): string | null {
  if (!zone) return null;
  
  const normalizedInput = zone.toLowerCase().replace(/[^a-z\s]/g, '').trim();
  
  // Direct mappings for common variations
  const zoneMappings: Record<string, string> = {
    'north america': 'North America',
    'northamerica': 'North America',
    'south america': 'South America',
    'southamerica': 'South America',
    'europe': 'Europe',
    'european': 'Europe',
    'mena': 'MENA',
    'middle east': 'MENA',
    'north africa': 'MENA',
    'sub saharan africa': 'Sub-Saharan Africa',
    'subsaharan africa': 'Sub-Saharan Africa',
    'africa': 'Sub-Saharan Africa',
    'south asia': 'South Asia',
    'southasia': 'South Asia',
    'india': 'South Asia',
    'east asia': 'East Asia',
    'eastasia': 'East Asia',
    'china': 'East Asia',
    'japan': 'East Asia',
    'oceania': 'Oceania',
    'australia': 'Oceania',
    'pacific': 'Oceania'
  };
  
  // Check if we have a direct mapping
  if (zoneMappings[normalizedInput]) {
    return zoneMappings[normalizedInput];
  }
  
  // Check against actual zone names
  const actualZones = Object.keys(GEOGRAPHICAL_DATA);
  for (const actualZone of actualZones) {
    if (actualZone.toLowerCase() === normalizedInput) {
      return actualZone;
    }
  }
  
  // Fuzzy match - check if input contains zone name or vice versa
  for (const actualZone of actualZones) {
    const normalizedActual = actualZone.toLowerCase();
    if (normalizedInput.includes(normalizedActual) || normalizedActual.includes(normalizedInput)) {
      return actualZone;
    }
  }
  
  return null;
}

/**
 * Normalize region names from LLM response to match our geography data
 */
export function normalizeRegionName(zone: string, region: string): string | null {
  if (!zone || !region) return null;
  
  const zoneData = GEOGRAPHICAL_DATA[zone];
  if (!zoneData) return null;
  
  const normalizedInput = region.toLowerCase().replace(/[^a-z\s]/g, '').trim();
  const actualRegions = Object.keys(zoneData);
  
  // Direct match
  for (const actualRegion of actualRegions) {
    if (actualRegion.toLowerCase() === normalizedInput) {
      return actualRegion;
    }
  }
  
  // Common variations
  const regionMappings: Record<string, string[]> = {
    'British Isles': ['british isles', 'britain', 'england', 'uk', 'united kingdom'],
    'Atlantic Seaboard': ['atlantic seaboard', 'eastern seaboard', 'east coast', 'atlantic coast'],
    'Great Lakes Region': ['great lakes', 'greatlakes', 'lakes region'],
    'Pacific Northwest': ['pacific northwest', 'northwest', 'pnw'],
    'Italian Peninsula': ['italy', 'italian peninsula', 'italia'],
    'Iberian Peninsula': ['iberia', 'iberian peninsula', 'spain', 'portugal'],
    'Balkan Peninsula': ['balkans', 'balkan peninsula', 'yugoslavia'],
    'Scandinavia': ['scandinavia', 'nordic', 'norway', 'sweden', 'denmark'],
    'Central Europe': ['central europe', 'germany', 'germania', 'holy roman empire'],
    'The Caribbean': ['caribbean', 'antilles', 'west indies']
  };
  
  // Check mappings
  for (const [actualRegion, variations] of Object.entries(regionMappings)) {
    if (actualRegions.includes(actualRegion) && variations.includes(normalizedInput)) {
      return actualRegion;
    }
  }
  
  // Fuzzy match
  for (const actualRegion of actualRegions) {
    const normalizedActual = actualRegion.toLowerCase();
    if (normalizedInput.includes(normalizedActual) || normalizedActual.includes(normalizedInput)) {
      return actualRegion;
    }
  }
  
  return null;
}
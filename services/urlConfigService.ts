/**
 * URL Configuration Service
 * Handles parsing and generating URLs for game configuration
 * URL format: /:dateRange?/:geography?/:gameMode?/:seed?/:profession?/:healthStatus?
 * Examples:
 * - /1348-1350/europe/survival/ABC12345
 * - /1492/americas/exploration
 * - /random/random/random
 * - /europe/1600/merchant/sick
 * - /mena/1700-1800/blacksmith
 */

import { HistoricalEra, CulturalZone, Region } from '../types';
import { GameModeId } from '../constants/gameData/gameModes';
import { findZoneForMapArea, findSimilarMapArea } from './zoneDetectionService';

export interface URLGameConfig {
  dateRange?: {
    startYear: number;
    endYear: number;
  };
  geography?: {
    culturalZone?: CulturalZone;
    region?: Region;
    mapArea?: string; // NEW: Specific map area name from URL
  };
  gameMode?: GameModeId;
  seed?: string;
  profession?: string;
  healthStatus?: 'sick' | 'healthy' | 'sickly' | 'unhealthy';
}

/**
 * Parse URL path into game configuration
 */
export function parseURLConfig(pathname: string): URLGameConfig {
  const config: URLGameConfig = {};

  // Remove leading slash and split by /
  const segments = pathname.replace(/^\//, '').split('/').filter(Boolean);

  console.log('[URLConfig] Parsing URL:', pathname);
  console.log('[URLConfig] Segments:', segments);

  if (segments.length === 0) {
    return config;
  }

  // Parse date range (first segment)
  if (segments[0]) {
    config.dateRange = parseDateRange(segments[0]);
  }

  // Parse geography (second segment) - but only if it's actually geography
  // If segment 2 is NOT geography, we'll treat it as profession/gamemode/etc
  let startIndex = 2; // Where to start parsing other segments
  if (segments[1]) {
    const geography = parseGeography(segments[1]);
    if (geography) {
      config.geography = geography;
      startIndex = 2; // Geography was found, start at segment 3
    } else {
      // Segment 2 is NOT geography, so treat it as profession/gamemode/etc
      startIndex = 1; // Start parsing from segment 2
      console.log('[URLConfig] Segment 2 is not geography, treating as profession/gamemode/health');
    }
  }

  // Parse remaining segments intelligently (game mode, seed, profession, health status)
  // These can appear in any order after the geography segment (or after date if no geography)
  for (let i = startIndex; i < segments.length; i++) {
    const segment = segments[i];

    // Try to parse as health status first (most specific)
    const healthStatus = parseHealthStatus(segment);
    if (healthStatus) {
      config.healthStatus = healthStatus;
      console.log('[URLConfig] Found health status:', healthStatus);
      continue;
    }

    // Try to parse as game mode
    const gameMode = parseGameMode(segment);
    if (gameMode) {
      config.gameMode = gameMode;
      console.log('[URLConfig] Found game mode:', gameMode);
      continue;
    }

    // Try to parse as seed (6-8 char alphanumeric with at least one number)
    // This prevents matching profession names like "merchant" or "potter"
    if (/^[A-Z0-9]{6,8}$/i.test(segment) && /\d/.test(segment)) {
      config.seed = segment.toUpperCase().slice(0, 8);
      console.log('[URLConfig] Found seed:', config.seed);
      continue;
    }

    // Otherwise, treat as profession
    if (!config.profession) {
      config.profession = segment.toLowerCase();
      console.log('[URLConfig] Found profession:', config.profession);
    }
  }

  console.log('[URLConfig] Final config:', config);
  return config;
}

/**
 * Parse date range from URL segment
 * Formats: 
 * - "1348" (single year)
 * - "1348-1350" (range)
 * - "medieval" (era name)
 * - "random" (random selection)
 */
function parseDateRange(segment: string): URLGameConfig['dateRange'] | undefined {
  if (!segment || segment === 'random') {
    return undefined;
  }
  
  // Check for era names
  const eraRanges: Record<string, [number, number]> = {
    'ancient': [-3000, 500],
    'medieval': [500, 1400],
    'renaissance': [1400, 1600],
    'earlymodern': [1600, 1800],
    'industrial': [1800, 1920],
    'modern': [1920, 2025],
    'future': [2025, 2100]
  };
  
  const lowerSegment = segment.toLowerCase();
  if (eraRanges[lowerSegment]) {
    const [start, end] = eraRanges[lowerSegment];
    return { startYear: start, endYear: end };
  }
  
  // Check for year range (e.g., "1348-1350")
  if (segment.includes('-')) {
    const [start, end] = segment.split('-').map(s => parseInt(s));
    if (!isNaN(start) && !isNaN(end)) {
      return { startYear: start, endYear: end };
    }
  }
  
  // Check for single year
  const year = parseInt(segment);
  if (!isNaN(year)) {
    return { startYear: year, endYear: year };
  }
  
  return undefined;
}

/**
 * Convert URL slug to readable map area name
 * Example: "north-china-plain" -> "North China Plain"
 */
function unslugify(slug: string): string {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Parse geography from URL segment
 * Formats:
 * - "europe" (cultural zone)
 * - "europe.iberia" (zone.region)
 * - "north-china-plain" (map area name)
 * - "random" (random selection)
 */
function parseGeography(segment: string): URLGameConfig['geography'] | undefined {
  if (!segment || segment === 'random') {
    return undefined;
  }

  const culturalZoneMap: Record<string, CulturalZone | 'RANDOM_AMERICAS' | 'RANDOM_ASIA' | 'RANDOM_WORLD'> = {
    'europe': 'EUROPEAN',
    'european': 'EUROPEAN',
    'mena': 'MENA',
    'middleeast': 'MENA',
    'middleeastnorthafrica': 'MENA',
    'eastasia': 'EAST_ASIAN',
    'eastasian': 'EAST_ASIAN',
    'asia': 'RANDOM_ASIA', // Special case: randomly choose East or South Asia
    'southasia': 'SOUTH_ASIAN',
    'southasian': 'SOUTH_ASIAN',
    'india': 'SOUTH_ASIAN',
    'africa': 'SUB_SAHARAN_AFRICAN',
    'subsaharan': 'SUB_SAHARAN_AFRICAN',
    'subsaharanafrica': 'SUB_SAHARAN_AFRICAN',
    'subsaharanafr': 'SUB_SAHARAN_AFRICAN',
    'northamerica': 'NORTH_AMERICAN_PRE_COLUMBIAN',
    'americas': 'RANDOM_AMERICAS', // Special case: randomly choose North or South America
    'southamerica': 'SOUTH_AMERICAN',
    'oceania': 'OCEANIA',
    'pacific': 'OCEANIA',
    'world': 'RANDOM_WORLD', // Special case: randomly choose any cultural zone
    'global': 'RANDOM_WORLD',
    'anywhere': 'RANDOM_WORLD'
  };

  const regionMap: Record<string, Region> = {
    // European regions
    'iberia': 'IBERIA',
    'france': 'FRANCE_AND_LOW_COUNTRIES',
    'britain': 'BRITAIN_AND_IRELAND',
    'italy': 'ITALIAN_PENINSULA',
    'germany': 'CENTRAL_EUROPE',
    'centraleurope': 'CENTRAL_EUROPE',
    'scandinavia': 'SCANDINAVIA_AND_BALTIC',
    'easteurope': 'EASTERN_EUROPE',
    'russia': 'RUSSIA_AND_CAUCASUS',
    'balkans': 'BALKANS',
    'greece': 'GREECE_AND_AEGEAN',

    // MENA regions
    'northafrica': 'NORTH_AFRICA',
    'egypt': 'EGYPT_AND_SUDAN',
    'levant': 'LEVANT',
    'arabia': 'ARABIAN_PENINSULA',
    'persia': 'PERSIA',
    'anatolia': 'ANATOLIA',

    // Add more regions as needed
  };

  // All cultural zones for RANDOM_WORLD
  const ALL_CULTURAL_ZONES: CulturalZone[] = [
    'EUROPEAN',
    'EAST_ASIAN',
    'SOUTH_ASIAN',
    'MENA',
    'SUB_SAHARAN_AFRICAN',
    'NORTH_AMERICAN_PRE_COLUMBIAN',
    'SOUTH_AMERICAN',
    'OCEANIA'
  ];

  // Check for multi-zone format (e.g., "oceania+asia" or "europe+mena")
  if (segment.includes('+')) {
    const zones = segment.toLowerCase().split('+');
    const validZones: CulturalZone[] = [];

    for (const zoneStr of zones) {
      const zone = culturalZoneMap[zoneStr.trim()];
      if (zone) {
        // Handle special random cases
        if (zone === 'RANDOM_AMERICAS') {
          validZones.push('NORTH_AMERICAN_PRE_COLUMBIAN', 'SOUTH_AMERICAN');
        } else if (zone === 'RANDOM_ASIA') {
          validZones.push('EAST_ASIAN', 'SOUTH_ASIAN');
        } else if (zone === 'RANDOM_WORLD') {
          validZones.push(...ALL_CULTURAL_ZONES);
        } else {
          validZones.push(zone as CulturalZone);
        }
      }
    }

    if (validZones.length > 0) {
      // Randomly select one of the valid zones
      const randomZone = validZones[Math.floor(Math.random() * validZones.length)];
      return { culturalZone: randomZone };
    }
  }

  // Check for zone.region format
  if (segment.includes('.')) {
    const [zoneStr, regionStr] = segment.toLowerCase().split('.');
    const zone = culturalZoneMap[zoneStr];
    const region = regionMap[regionStr];

    if (zone || region) {
      return { culturalZone: zone as CulturalZone, region };
    }
  }

  // Check for just cultural zone (backward compatibility)
  const lowerSegment = segment.toLowerCase();
  const zone = culturalZoneMap[lowerSegment];
  if (zone) {
    // Handle special case: 'americas' should randomly choose North or South America
    if (zone === 'RANDOM_AMERICAS') {
      const randomAmericasZone = Math.random() < 0.5
        ? 'NORTH_AMERICAN_PRE_COLUMBIAN' as CulturalZone
        : 'SOUTH_AMERICAN' as CulturalZone;
      return { culturalZone: randomAmericasZone };
    }
    // Handle special case: 'asia' should randomly choose East or South Asia
    if (zone === 'RANDOM_ASIA') {
      const randomAsiaZone = Math.random() < 0.5
        ? 'EAST_ASIAN' as CulturalZone
        : 'SOUTH_ASIAN' as CulturalZone;
      return { culturalZone: randomAsiaZone };
    }
    // Handle special case: 'world' should randomly choose any cultural zone
    if (zone === 'RANDOM_WORLD') {
      const randomWorldZone = ALL_CULTURAL_ZONES[Math.floor(Math.random() * ALL_CULTURAL_ZONES.length)];
      return { culturalZone: randomWorldZone };
    }
    return { culturalZone: zone as CulturalZone };
  }

  // Check for just region (backward compatibility)
  const region = regionMap[lowerSegment];
  if (region) {
    return { region };
  }

  // NEW: Check if it's a map area name (e.g., "north-china-plain")
  const mapAreaName = unslugify(segment);
  console.log('[URLConfig] Attempting to parse as map area:', mapAreaName);

  // First try exact match
  const zoneInfo = findZoneForMapArea(mapAreaName);
  if (zoneInfo) {
    console.log('[URLConfig] Found zone for map area:', zoneInfo);
    // Map zone name to CulturalZone enum
    const zoneMapping: Record<string, CulturalZone> = {
      'Europe': 'EUROPEAN',
      'East Asia': 'EAST_ASIAN',
      'Middle East and North Africa': 'MENA',
      'South Asia': 'SOUTH_ASIAN',
      'Sub-Saharan Africa': 'SUB_SAHARAN_AFRICAN',
      'North America (Pre-Columbian)': 'NORTH_AMERICAN_PRE_COLUMBIAN',
      'North America': 'NORTH_AMERICAN_COLONIAL',
      'South America': 'SOUTH_AMERICAN',
      'Oceania': 'OCEANIA'
    };

    const culturalZone = zoneMapping[zoneInfo.zone];
    if (culturalZone) {
      return {
        culturalZone,
        // Store the map area name for later use
        mapArea: mapAreaName
      } as any; // Extended type with mapArea
    }
  }

  // Try fuzzy matching as fallback
  const similarZoneInfo = findSimilarMapArea(mapAreaName);
  if (similarZoneInfo) {
    console.log('[URLConfig] Found similar map area:', similarZoneInfo);
    const zoneMapping: Record<string, CulturalZone> = {
      'Europe': 'EUROPEAN',
      'East Asia': 'EAST_ASIAN',
      'Middle East and North Africa': 'MENA',
      'South Asia': 'SOUTH_ASIAN',
      'Sub-Saharan Africa': 'SUB_SAHARAN_AFRICAN',
      'North America (Pre-Columbian)': 'NORTH_AMERICAN_PRE_COLUMBIAN',
      'North America': 'NORTH_AMERICAN_COLONIAL',
      'South America': 'SOUTH_AMERICAN',
      'Oceania': 'OCEANIA'
    };

    const culturalZone = zoneMapping[similarZoneInfo.zone];
    if (culturalZone) {
      return {
        culturalZone,
        mapArea: mapAreaName
      } as any;
    }
  }

  return undefined;
}

/**
 * Parse game mode from URL segment
 */
function parseGameMode(segment: string): GameModeId | undefined {
  if (!segment || segment === 'random') {
    return undefined;
  }

  const gameModeMap: Record<string, GameModeId> = {
    'survival': 'survival',
    'exploration': 'exploration',
    'commerce': 'commerce',
    'scholarship': 'scholarship',
    'leadership': 'leadership',
    'livelihood': 'livelihood',
    'diplomacy': 'diplomacy',
    'legal': 'legal',
    // Legacy aliases for backward compatibility
    'empire': 'leadership',
    'cultural': 'scholarship',
    'sandbox': 'exploration',
    'balanced': 'survival'
  };

  return gameModeMap[segment.toLowerCase()];
}

/**
 * Parse health status from URL segment
 */
function parseHealthStatus(segment: string): 'sick' | 'healthy' | 'sickly' | 'unhealthy' | undefined {
  if (!segment) {
    return undefined;
  }

  const healthStatusMap: Record<string, 'sick' | 'healthy' | 'sickly' | 'unhealthy'> = {
    'sick': 'sick',
    'sickly': 'sickly',
    'ill': 'sick',
    'diseased': 'sick',
    'healthy': 'healthy',
    'fit': 'healthy',
    'unhealthy': 'unhealthy',
    'weak': 'sickly'
  };

  return healthStatusMap[segment.toLowerCase()];
}

/**
 * Generate URL path from game configuration
 */
export function generateURLPath(config: URLGameConfig): string {
  const segments: string[] = [];
  
  // Add date range
  if (config.dateRange) {
    if (config.dateRange.startYear === config.dateRange.endYear) {
      segments.push(config.dateRange.startYear.toString());
    } else {
      segments.push(`${config.dateRange.startYear}-${config.dateRange.endYear}`);
    }
  } else {
    segments.push('random');
  }
  
  // Add geography
  if (config.geography) {
    if (config.geography.culturalZone && config.geography.region) {
      const zoneStr = config.geography.culturalZone.toLowerCase().replace('_', '');
      const regionStr = config.geography.region.toLowerCase().replace(/_/g, '');
      segments.push(`${zoneStr}.${regionStr}`);
    } else if (config.geography.culturalZone) {
      segments.push(config.geography.culturalZone.toLowerCase().replace('_', ''));
    } else if (config.geography.region) {
      segments.push(config.geography.region.toLowerCase().replace(/_/g, ''));
    }
  } else {
    segments.push('random');
  }
  
  // Add game mode
  if (config.gameMode) {
    segments.push(config.gameMode);
  } else {
    segments.push('random');
  }
  
  // Add seed
  if (config.seed) {
    segments.push(config.seed);
  }
  
  return '/' + segments.join('/');
}

/**
 * Validate URL configuration
 */
export function validateURLConfig(config: URLGameConfig): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Validate date range
  if (config.dateRange) {
    if (config.dateRange.startYear > config.dateRange.endYear) {
      errors.push('Start year must be before or equal to end year');
    }
    if (config.dateRange.startYear < -3000 || config.dateRange.endYear > 2100) {
      errors.push('Years must be between -3000 and 2100');
    }
  }
  
  // Validate seed format
  if (config.seed && !/^[A-Z0-9]{1,8}$/.test(config.seed)) {
    errors.push('Seed must be 1-8 characters (letters and numbers only)');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Get example URLs for documentation
 */
export function getExampleURLs(): string[] {
  return [
    '/1348/europe/survival',
    '/medieval/mena/exploration',
    '/1492-1550/americas/empire', // Randomly North or South America
    '/random/random/random/SEED1234',
    '/1800-1900/asia/cultural', // Randomly East or South Asia
    '/1600/oceania+asia/survival', // Randomly Oceania or Asia
    '/1600/europe+mena/exploration', // Randomly Europe or MENA
    '/1600-1800/world/survival', // Random year 1600-1800, anywhere in the world
    '/medieval/world/exploration', // Medieval era, anywhere in the world
    '/modern/africa/balanced',
    '/1600/eastasia/scholarship', // Specifically East Asia
    '/1600/southasia/commerce', // Specifically South Asia
    '/europe/1600/merchant/sick', // Merchant character with disease
    '/mena/1700-1800/blacksmith', // Blacksmith in MENA, random year 1700-1800
    '/1600/europe/survival/SEED123/potter/sickly', // Full specification with seed
    '/europe/1600/sick', // Sick character, random profession
    '/1800/southasia/weaver/healthy' // Healthy weaver in South Asia
  ];
}
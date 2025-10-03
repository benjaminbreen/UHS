/**
 * utils/urbanDensityUtils.ts - Era-based urban density calculation utilities
 */
import { CityDefinition, CITIES_DATA } from '../constants/gameData/cities';
import { HistoricalEra } from '../types';

export type UrbanDensityLevel = 'small' | 'moderate' | 'large' | 'massive';
export type UrbanDensityMultiplier = 1 | 2 | 3 | 5 | 8;

/**
 * Era-specific urban density mappings
 * Defines how urban density scales across historical periods
 */
export const ERA_URBAN_MULTIPLIERS: Record<HistoricalEra, Record<UrbanDensityLevel, UrbanDensityMultiplier>> = {
  [HistoricalEra.PREHISTORY]: {
    small: 1,
    moderate: 1,
    large: 2,
    massive: 2
  },
  [HistoricalEra.ANTIQUITY]: {
    small: 1,
    moderate: 2,
    large: 3,
    massive: 5
  },
  [HistoricalEra.MEDIEVAL]: {
    small: 1,
    moderate: 2,
    large: 3,
    massive: 5
  },
  [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
    small: 1,
    moderate: 2,
    large: 3,
    massive: 5
  },
  [HistoricalEra.MODERN_ERA]: {
    small: 1,
    moderate: 2,
    large: 5,
    massive: 8
  }
};

/**
 * Get the effective urban density for a city in a specific era
 * Takes into account era-specific overrides defined in the city data
 */
export function getCityUrbanDensity(city: CityDefinition, era: HistoricalEra): UrbanDensityLevel {
  // Check if city exists in this era
  if (city.declineYear && getEraStartYear(era) > city.declineYear) {
    return 'small'; // City doesn't exist, minimal ruins/settlement
  }
  
  if (city.foundingYear > getEraEndYear(era)) {
    return 'small'; // City hasn't been founded yet
  }

  // Check for era-specific density override
  const eraKey = era.toLowerCase().replace('_', '_');
  if (city.eraSpecificDensity && city.eraSpecificDensity[eraKey]) {
    return city.eraSpecificDensity[eraKey];
  }

  // Fall back to default density
  return city.urbanDensity || 'small';
}

/**
 * Calculate urban tile multiplier for map generation
 * Returns how many times the base urban tile count should be multiplied
 */
export function getUrbanTileMultiplier(
  mapAreaName: string, 
  era: HistoricalEra, 
  userOverride?: UrbanDensityLevel
): UrbanDensityMultiplier {
  // If user has specified an override, use that
  if (userOverride) {
    return ERA_URBAN_MULTIPLIERS[era][userOverride];
  }

  // Find the largest city in this map area for this era
  const cities = CITIES_DATA[mapAreaName] || [];
  if (cities.length === 0) {
    return 1; // No cities = minimal urban presence
  }

  // Find the most significant city active in this era
  let maxDensity: UrbanDensityLevel = 'small';
  let maxPopulation = 0;

  for (const city of cities) {
    const cityDensity = getCityUrbanDensity(city, era);
    const cityPop = city.populationPeak || 0;
    
    // Prefer cities with higher density, with population as tiebreaker
    if (getDensityPriority(cityDensity) > getDensityPriority(maxDensity) ||
        (cityDensity === maxDensity && cityPop > maxPopulation)) {
      maxDensity = cityDensity;
      maxPopulation = cityPop;
    }
  }

  return ERA_URBAN_MULTIPLIERS[era][maxDensity];
}

/**
 * Get cities that are active (founded but not yet declined) in a given era
 */
export function getActiveCities(mapAreaName: string, era: HistoricalEra): CityDefinition[] {
  const cities = CITIES_DATA[mapAreaName] || [];
  const eraStart = getEraStartYear(era);
  const eraEnd = getEraEndYear(era);
  
  return cities.filter(city => {
    const founded = city.foundingYear <= eraEnd;
    const stillActive = !city.declineYear || city.declineYear >= eraStart;
    return founded && stillActive;
  });
}

/**
 * Check if a map area should be considered "highly urban" for modern era
 * These areas are mostly covered in urban tiles
 */
export function isModernMegaUrbanArea(mapAreaName: string): boolean {
  const megaUrbanAreas = [
    'London', 'Hudson River Valley', 'Beijing Basin', 'Pearl River Delta',
    'Valley of Mexico', 'Tokyo Bay', 'Rhine–Meuse Delta', 'Paris Basin',
    'São Paulo Plateau', 'Rio de Janeiro Bay'
  ];
  
  return megaUrbanAreas.includes(mapAreaName);
}

// Helper functions
function getDensityPriority(density: UrbanDensityLevel): number {
  const priorities = { small: 1, moderate: 2, large: 3, massive: 4 };
  return priorities[density];
}

function getEraStartYear(era: HistoricalEra): number {
  const eraYears: Record<HistoricalEra, number> = {
    [HistoricalEra.PREHISTORY]: -3000,
    [HistoricalEra.ANTIQUITY]: -3000,
    [HistoricalEra.MEDIEVAL]: 500,
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: 1450,
    [HistoricalEra.MODERN_ERA]: 1800
  };
  return eraYears[era];
}

function getEraEndYear(era: HistoricalEra): number {
  const eraYears: Record<HistoricalEra, number> = {
    [HistoricalEra.PREHISTORY]: -3000,
    [HistoricalEra.ANTIQUITY]: 500,
    [HistoricalEra.MEDIEVAL]: 1450,
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: 1800,
    [HistoricalEra.MODERN_ERA]: 2100
  };
  return eraYears[era];
}

/**
 * Generate urban density description for UI
 */
export function getUrbanDensityDescription(
  mapAreaName: string, 
  era: HistoricalEra, 
  userOverride?: UrbanDensityLevel
): string {
  const multiplier = getUrbanTileMultiplier(mapAreaName, era, userOverride);
  const activeCities = getActiveCities(mapAreaName, era);
  const mainCity = activeCities.length > 0 ? activeCities[0].name : 'settlements';
  
  if (multiplier === 1) {
    return `Rural area with small ${mainCity}`;
  } else if (multiplier === 2) {
    return `Moderate urban density around ${mainCity}`;
  } else if (multiplier === 3) {
    return `Significant urban development centered on ${mainCity}`;
  } else if (multiplier === 5) {
    return `Major urban center dominated by ${mainCity}`;
  } else {
    return `Massive metropolitan area extending from ${mainCity}`;
  }
}
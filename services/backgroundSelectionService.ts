/**
 * services/backgroundSelectionService.ts - Shared background selection logic for combat and POV views
 */
import { ClimateType } from '../types/biomes/climate';
import { CulturalZone, Season } from '../types';
import { WeatherState } from './weatherService';

// Get weather suffix for background naming
export const getWeatherSuffix = (weatherState?: WeatherState): string | null => {
  if (!weatherState) return null;

  if (weatherState.precipitation === 'rain') return 'rain';
  if (weatherState.precipitation === 'snow') return 'snow';
  if (weatherState.precipitation === 'drizzle') return 'rain'; // Use rain variant
  if (weatherState.special === 'fog' || weatherState.special === 'mist') return 'fog';

  return null;
};

// Get time suffix for background naming
export const getTimeSuffix = (gameTime?: { hours: number; minutes: number }): string | null => {
  if (!gameTime) return null;

  const currentTime = gameTime.hours + gameTime.minutes / 60;

  // Night: 10pm-4am
  if (currentTime >= 22 || currentTime < 4) {
    return 'night';
  }

  // Crepuscular: dawn (4-8am) & dusk (6-9pm)
  if ((currentTime >= 4 && currentTime < 8) || (currentTime >= 18 && currentTime < 21)) {
    return 'crepuscular';
  }

  return null; // Day time uses base backgrounds
};

// Determine if we should apply night tinting (instead of looking for _night.png files)
export const isNightTime = (gameTime?: { hours: number; minutes: number }): boolean => {
  if (!gameTime) return false;
  const currentTime = gameTime.hours + gameTime.minutes / 60;
  // Night is 10pm-4am
  return currentTime >= 22 || currentTime < 4;
};

// Calculate night overlay intensity based on time (0 = no overlay, 1 = full night)
export const getNightOverlayIntensity = (gameTime?: { hours: number; minutes: number }): number => {
  if (!gameTime) return 0;

  const currentTime = gameTime.hours + gameTime.minutes / 60;

  // Full night: 10pm-4am (intensity = 1)
  if ((currentTime >= 22 && currentTime <= 24) || (currentTime >= 0 && currentTime < 4)) {
    return 1;
  }

  // Dawn transition: 4am-8am (gradually decrease from 1 to 0)
  if (currentTime >= 4 && currentTime < 8) {
    return 1 - ((currentTime - 4) / 4); // Linear fade from 1 to 0 over 4 hours
  }

  // Dusk transition: 6pm-10pm (gradually increase from 0 to 1)
  if (currentTime >= 18 && currentTime < 22) {
    return (currentTime - 18) / 4; // Linear fade from 0 to 1 over 4 hours
  }

  // Day time: no overlay
  return 0;
};

// Get CSS filter for nighttime tinting effect (adjusts based on intensity)
export const getNightFilter = (intensity: number = 1): string => {
  // Safari optimization: Use simpler filters for better performance
  if (typeof navigator !== 'undefined' && /^((?!chrome|android).)*safari/i.test(navigator.userAgent)) {
    // Safari: Use only brightness filter to avoid performance issues
    const brightness = 1 - (0.3 * intensity); // Slightly less aggressive for Safari
    return `brightness(${brightness})`;
  }

  // Other browsers: Full filter chain
  const brightness = 1 - (0.4 * intensity); // 1.0 at day, 0.6 at night
  const contrast = 1 + (0.1 * intensity);   // 1.0 at day, 1.1 at night
  const saturate = 1 - (0.1 * intensity);   // 1.0 at day, 0.9 at night

  return `brightness(${brightness}) contrast(${contrast}) saturate(${saturate})`;
};

// Get night overlay gradient for blend mode approach (adjusts opacity based on intensity)
export const getNightOverlayGradient = (intensity: number = 1): string => {
  // Scale opacity based on intensity
  const topOpacity = 0.6 * intensity;
  const midOpacity = 0.7 * intensity;
  const bottomOpacity = 0.75 * intensity;

  // Richer midnight blue gradient with deeper colors
  return `linear-gradient(180deg, rgba(10, 15, 45, ${topOpacity}) 0%, rgba(5, 10, 35, ${midOpacity}) 50%, rgba(0, 5, 25, ${bottomOpacity}) 100%)`;
};

// Get cultural zone suffix for background naming
export const getCultureSuffix = (culture?: CulturalZone): string | null => {
  if (!culture) return null;

  const cultureMapping: { [key: string]: string } = {
    'EUROPEAN': 'european',
    'EAST_ASIAN': 'east_asian',
    'MENA': 'mena',
    'NORTH_AMERICAN_PRE_COLUMBIAN': 'precolumbian',
    'NORTH_AMERICAN_COLONIAL': 'colonial',
    'OCEANIA': 'oceania',
    'SOUTH_ASIAN': 'south_asian',
    'SOUTH_AMERICAN': 'south_american',
    'SUB_SAHARAN_AFRICAN': 'african'
  };

  return cultureMapping[culture] || null;
};

// Get climate-specific suffix for background naming
export const getClimateSuffix = (
  climate?: ClimateType,
  season?: Season
): string | null => {
  if (!climate) return null;

  switch(climate) {
    case ClimateType.COLD:
      return 'snow'; // Always snowy appearance in cold climates

    case ClimateType.ARID:
      return 'arid'; // Dry, dusty appearance

    case ClimateType.TROPICAL:
      return 'tropical'; // Lush, humid appearance

    case ClimateType.MEDITERRANEAN:
      // Only arid-looking in summer/fall (dry season)
      if (season === 'SUMMER' || season === 'FALL') {
        return 'arid';
      }
      return null; // Spring/winter use standard backgrounds

    case ClimateType.TEMPERATE:
      // Snowy appearance in winter for temperate climates
      if (season === 'WINTER') {
        return 'snow';
      }
      return null; // Spring/summer/fall use standard backgrounds

    default:
      return null; // Semitropical uses standard
  }
};

// Cultural fallback chains - related cultures check each other before generic
export const CULTURAL_FALLBACK_CHAINS: { [key: string]: string[] } = {
  // Asian/Eastern sphere (historical trade & cultural connections)
  'east_asian': ['south_asian', 'oceania', 'mena'],
  'south_asian': ['east_asian', 'mena', 'oceania'],
  'oceania': ['south_asian', 'east_asian', 'mena'],
  'mena': ['south_asian', 'african', 'east_asian'],

  // Indigenous American sphere
  'precolumbian': ['south_american'],
  'south_american': ['precolumbian'],

  // Western/Colonial sphere
  'european': ['colonial'],
  'colonial': ['european'],

  // African (can fall back to MENA due to North African connections)
  'african': ['mena']
};

// Generate priority-ordered background paths
export const getBackgroundPaths = (
  biome: string,
  weatherState?: WeatherState,
  gameTime?: { hours: number; minutes: number },
  culture?: CulturalZone,
  climate?: ClimateType,
  season?: Season
): string[] => {

  // First, get the exact biome name (converted to lowercase with underscores)
  const biomeName = biome.toLowerCase().replace(/\s+/g, '_');
  const paths: string[] = [];

  const weatherSuffix = getWeatherSuffix(weatherState);
  const timeSuffix = getTimeSuffix(gameTime);
  const cultureSuffix = getCultureSuffix(culture);
  const climateSuffix = getClimateSuffix(climate, season);


  // Helper function to add paths for a specific culture
  const addCulturalPaths = (cultureName: string, includeClimate: boolean = true) => {
    // Climate variants with culture (HIGHEST PRIORITY when includeClimate is true)
    if (includeClimate && climateSuffix) {
      if (weatherSuffix && timeSuffix) {
        paths.push(`${biomeName}_${climateSuffix}_${weatherSuffix}_${timeSuffix}_${cultureName}.png`);
      }
      if (weatherSuffix) {
        paths.push(`${biomeName}_${climateSuffix}_${weatherSuffix}_${cultureName}.png`);
      }
      if (timeSuffix) {
        paths.push(`${biomeName}_${climateSuffix}_${timeSuffix}_${cultureName}.png`);
      }
      paths.push(`${biomeName}_${climateSuffix}_${cultureName}.png`);
    }

    // Standard variants without climate (existing behavior)
    if (weatherSuffix && timeSuffix) {
      paths.push(`${biomeName}_${weatherSuffix}_${timeSuffix}_${cultureName}.png`);
    }
    if (weatherSuffix) {
      paths.push(`${biomeName}_${weatherSuffix}_${cultureName}.png`);
    }
    if (timeSuffix) {
      paths.push(`${biomeName}_${timeSuffix}_${cultureName}.png`);
    }
    paths.push(`${biomeName}_${cultureName}.png`);
  };

  // PRIORITY 1: Check for the SPECIFIC culture variants first
  if (cultureSuffix) {
    addCulturalPaths(cultureSuffix);

    // Check related cultures in the same sphere
    const relatedCultures = CULTURAL_FALLBACK_CHAINS[cultureSuffix];
    if (relatedCultures) {
      for (const relatedCulture of relatedCultures) {
        addCulturalPaths(relatedCulture);
      }
    }
  }

  // PRIORITY 2: Check for non-cultural climate variants
  if (climateSuffix) {
    if (weatherSuffix && timeSuffix) {
      paths.push(`${biomeName}_${climateSuffix}_${weatherSuffix}_${timeSuffix}.png`);
    }
    if (weatherSuffix) {
      paths.push(`${biomeName}_${climateSuffix}_${weatherSuffix}.png`);
    }
    if (timeSuffix) {
      paths.push(`${biomeName}_${climateSuffix}_${timeSuffix}.png`);
    }
    paths.push(`${biomeName}_${climateSuffix}.png`);
  }

  // PRIORITY 3: Check for non-cultural weather/time variants (no climate)
  if (weatherSuffix && timeSuffix) {
    paths.push(`${biomeName}_${weatherSuffix}_${timeSuffix}.png`);
  }
  if (weatherSuffix) {
    paths.push(`${biomeName}_${weatherSuffix}.png`);
  }
  if (timeSuffix) {
    paths.push(`${biomeName}_${timeSuffix}.png`);
  }

  // PRIORITY 4: Check for the SPECIFIC biome base file (e.g., hot_springs.png)
  paths.push(`${biomeName}.png`);

  // PRIORITY 5: Universal fallbacks
  paths.push('grassland.png', 'hills.png', 'forest.png', 'desert.png');

  return paths;
};

// Load background image by checking paths in priority order
export const loadBackgroundImage = async (
  paths: string[],
  basePath: string = '/combat-backgrounds/'
): Promise<string | null> => {
  // Function to check if image actually exists by trying to load it
  const checkImageExists = (url: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
  
        resolve(true);
      };
      img.onerror = () => {

        resolve(false);
      };
      img.src = url;
    });
  };



  // Check images in priority order
  for (const filename of paths) {
    const fullPath = `${basePath}${filename}`;
    const exists = await checkImageExists(fullPath);
    if (exists) {

      return fullPath;
    }
  }

  // Try fallback to grassland if no background found
  return `${basePath}grassland.png`;
};
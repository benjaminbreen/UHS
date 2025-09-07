/**
 * Special Map Augmentation System
 * 
 * This file augments the existing governmentDistricts data with the new
 * parameter-driven special map generation system. Instead of replacing
 * the valuable historical data, we map old archetypes to new ones and
 * add the necessary parameters for the simplified system.
 */

import { CulturalZone, HistoricalEra } from '../../types';

// New simplified archetype enum
export enum SimplifiedArchetype {
  ESTATES = 'estates',
  GOVERNMENT = 'government',
  ARENA_THEATER = 'arena_theater',
  UNIVERSITY = 'university',
  MARKET = 'market',
  OPEN_FIELD = 'open_field',
  CAMPGROUND = 'campground',
  RESTAURANT = 'restaurant',
  VESSEL = 'vessel',
  PLAYER_HOME = 'player_home'
}

// Map old archetype names to new simplified ones
export const ARCHETYPE_MAPPING: Record<string, SimplifiedArchetype> = {
  // Old palace variants → Estates
  'PALACE_COMPLEX': SimplifiedArchetype.ESTATES,
  'ROYAL_PALACE': SimplifiedArchetype.ESTATES,
  'IMPERIAL_PALACE': SimplifiedArchetype.ESTATES,
  'SULTAN_PALACE': SimplifiedArchetype.ESTATES,
  'TRIBAL_COUNCIL': SimplifiedArchetype.ESTATES,  // Small estate with council chamber
  'CHIEF_HUT': SimplifiedArchetype.ESTATES,
  
  // Government variants stay as Government
  'GOVERNMENT_FORUM': SimplifiedArchetype.GOVERNMENT,
  'SENATE_HOUSE': SimplifiedArchetype.GOVERNMENT,
  'PARLIAMENT': SimplifiedArchetype.GOVERNMENT,
  'TOWN_HALL': SimplifiedArchetype.GOVERNMENT,
  
  // Markets and exhibitions merge
  'MARKET_BAZAAR': SimplifiedArchetype.MARKET,
  'MARKETPLACE': SimplifiedArchetype.MARKET,
  'MARKET_EXHIBITION': SimplifiedArchetype.MARKET, // Add the actual enum value!
  'EXHIBITION': SimplifiedArchetype.MARKET,
  'WORLDS_FAIR': SimplifiedArchetype.MARKET,
  'TRADE_POST': SimplifiedArchetype.MARKET,
  
  // Entertainment venues
  'ARENA': SimplifiedArchetype.ARENA_THEATER,
  'THEATER': SimplifiedArchetype.ARENA_THEATER,
  'AMPHITHEATER': SimplifiedArchetype.ARENA_THEATER,
  'COLOSSEUM': SimplifiedArchetype.ARENA_THEATER,
  
  // Learning centers
  'UNIVERSITY': SimplifiedArchetype.UNIVERSITY,
  'ACADEMY': SimplifiedArchetype.UNIVERSITY,
  'MONASTERY': SimplifiedArchetype.UNIVERSITY,
  'LIBRARY': SimplifiedArchetype.UNIVERSITY,
  
  // Open spaces
  'OPEN_FIELD': SimplifiedArchetype.OPEN_FIELD,
  'POLO_FIELD': SimplifiedArchetype.OPEN_FIELD,
  'RITUAL_GROUND': SimplifiedArchetype.OPEN_FIELD,
  'PARADE_GROUND': SimplifiedArchetype.OPEN_FIELD,
  
  // Military (now removed, goes to standard map)
  'MILITARY_FORTRESS': SimplifiedArchetype.OPEN_FIELD,  // Fallback
  'SACRED_COMPLEX': SimplifiedArchetype.OPEN_FIELD,     // Fallback
};

// Size determination based on era and importance
export type MapSize = 'xs' | 'small' | 'medium' | 'large' | 'xl' | 'xxl';

export const ERA_SIZE_DEFAULTS: Record<number, MapSize> = {
  [-10000]: 'xs',      // Prehistoric
  [-3000]: 'small',    // Ancient
  [500]: 'medium',     // Medieval
  [1500]: 'large',     // Early Modern
  [1800]: 'large',     // Industrial
  [1950]: 'xl',        // Modern
};

// Material selection based on culture and era
export type MaterialType = 'white_marble' | 'grey_stone' | 'red_lacquer' | 'sandstone' | 'wood' | 'steel';

export const CULTURE_MATERIALS: Record<CulturalZone | string, Record<string, MaterialType>> = {
  EUROPEAN: {
    prehistoric: 'wood',
    antiquity: 'white_marble',
    medieval: 'grey_stone',
    earlyModern: 'white_marble',
    industrial: 'grey_stone',
    modern: 'steel'
  },
  EAST_ASIAN: {
    prehistoric: 'wood',
    antiquity: 'wood',
    medieval: 'red_lacquer',
    earlyModern: 'red_lacquer',
    industrial: 'red_lacquer',
    modern: 'steel'
  },
  MENA: {
    prehistoric: 'sandstone',
    antiquity: 'sandstone',
    medieval: 'sandstone',
    earlyModern: 'white_marble',
    industrial: 'white_marble',
    modern: 'steel'
  },
  AFRICAN: {
    prehistoric: 'wood',
    antiquity: 'sandstone',
    medieval: 'sandstone',
    earlyModern: 'sandstone',
    industrial: 'sandstone',
    modern: 'steel'
  },
  AMERICAS: {
    prehistoric: 'wood',
    antiquity: 'sandstone',
    medieval: 'wood',
    earlyModern: 'wood',
    industrial: 'grey_stone',
    modern: 'steel'
  },
  OCEANIA: {
    prehistoric: 'wood',
    antiquity: 'wood',
    medieval: 'wood',
    earlyModern: 'wood',
    industrial: 'wood',
    modern: 'steel'
  }
};

// Climate for landscape borders
export type ClimateType = 'arid' | 'temperate' | 'cold' | 'semitropical' | 'tropical' | 'ocean';

// Landscape border sizes by map size
export const LANDSCAPE_BORDER_ROWS: Record<MapSize, number> = {
  xs: 1,      // 8x8 → 6x6 usable
  small: 2,   // 10x10 → 6x6 usable
  medium: 3,  // 16x16 → 10x10 usable
  large: 4,   // 20x20 → 12x12 usable
  xl: 5,      // 25x25 → 15x15 usable
  xxl: 6      // 32x32 → 20x20 usable
};

// Interior map types based on archetype
export const ARCHETYPE_INTERIORS: Record<SimplifiedArchetype, string[]> = {
  [SimplifiedArchetype.ESTATES]: ['throne_room', 'council_chamber', 'shrine', 'bedroom'],
  [SimplifiedArchetype.GOVERNMENT]: ['council_chamber', 'office', 'archives'],
  [SimplifiedArchetype.ARENA_THEATER]: ['backstage', 'green_room', 'locker_room'],
  [SimplifiedArchetype.UNIVERSITY]: ['library', 'archives', 'workshop', 'laboratory'],
  [SimplifiedArchetype.MARKET]: ['guild_hall', 'counting_house', 'storage'],
  [SimplifiedArchetype.OPEN_FIELD]: ['cave', 'shrine', 'tent'],
  [SimplifiedArchetype.CAMPGROUND]: ['tent', 'command_tent'],
  [SimplifiedArchetype.RESTAURANT]: ['private_room', 'kitchen', 'cellar'],
  [SimplifiedArchetype.VESSEL]: ['captain_quarters', 'hold', 'brig'],
  [SimplifiedArchetype.PLAYER_HOME]: ['bedroom', 'study', 'cellar']
};

/**
 * Function to augment existing government district data with new parameters
 */
export function augmentGovernmentDistrict(
  oldArchetype: string,
  culturalZone: CulturalZone | string,
  year: number,
  customName?: string
): {
  archetype: SimplifiedArchetype;
  size: MapSize;
  material: MaterialType;
  innerMapType?: string;
  customName?: string;
  isCircular?: boolean;
  isRectangular?: boolean;
  hasLandscape?: boolean;
  landscapeClimate?: ClimateType;
} {
  // Map old archetype to new
  const archetype = ARCHETYPE_MAPPING[oldArchetype] || SimplifiedArchetype.OPEN_FIELD;
  
  // Determine era category
  let eraCategory = 'prehistoric';
  if (year >= -3000) eraCategory = 'antiquity';
  if (year >= 500) eraCategory = 'medieval';
  if (year >= 1500) eraCategory = 'earlyModern';
  if (year >= 1800) eraCategory = 'industrial';
  if (year >= 1950) eraCategory = 'modern';
  
  // Get size based on era
  let size: MapSize = 'medium';
  for (const [threshold, mapSize] of Object.entries(ERA_SIZE_DEFAULTS)) {
    if (year >= parseInt(threshold)) {
      size = mapSize;
    }
  }
  
  // Adjust size for specific archetypes
  if (archetype === SimplifiedArchetype.GOVERNMENT && size === 'xs') {
    size = 'small'; // Governments need minimum space
  }
  if (archetype === SimplifiedArchetype.VESSEL && size !== 'xs' && size !== 'small') {
    size = 'small'; // Vessels are constrained
  }
  
  // Get material based on culture and era
  const cultureMaterials = CULTURE_MATERIALS[culturalZone] || CULTURE_MATERIALS.EUROPEAN;
  const material = cultureMaterials[eraCategory] || 'wood';
  
  // Determine interior map type
  const possibleInteriors = ARCHETYPE_INTERIORS[archetype];
  let innerMapType: string | undefined;
  
  if (possibleInteriors && possibleInteriors.length > 0) {
    // Select based on archetype and importance
    if (archetype === SimplifiedArchetype.ESTATES) {
      innerMapType = year < 0 ? 'shrine' : 'throne_room';
    } else if (archetype === SimplifiedArchetype.GOVERNMENT) {
      innerMapType = 'council_chamber';
    } else {
      innerMapType = possibleInteriors[0];
    }
  }
  
  // Special cases for shape and landscape
  const config: any = {
    archetype,
    size,
    material,
    innerMapType,
    customName
  };
  
  // Circular structures
  if (oldArchetype === 'TRIBAL_COUNCIL' || 
      (archetype === SimplifiedArchetype.ESTATES && year < -1000) ||
      archetype === SimplifiedArchetype.ARENA_THEATER) {
    config.isCircular = true;
  }
  
  // Rectangular structures (vessels)
  if (archetype === SimplifiedArchetype.VESSEL) {
    config.isRectangular = true;
    config.hasLandscape = true;
    config.landscapeClimate = 'ocean';
  }
  
  // Add landscape for palaces and open fields
  if (archetype === SimplifiedArchetype.ESTATES || 
      archetype === SimplifiedArchetype.OPEN_FIELD) {
    config.hasLandscape = true;
    // Determine climate based on zone (simplified)
    if (culturalZone === 'MENA' || culturalZone === 'AFRICAN') {
      config.landscapeClimate = 'arid';
    } else if (culturalZone === 'EAST_ASIAN' || culturalZone === 'AMERICAS') {
      config.landscapeClimate = 'temperate';
    } else if (culturalZone === 'EUROPEAN' && year < 1000) {
      config.landscapeClimate = 'cold';
    } else {
      config.landscapeClimate = 'temperate';
    }
  }
  
  return config;
}

/**
 * Helper to convert old special map configs to new system
 */
export function convertLegacyConfig(legacyConfig: any): any {
  const { archetype, culturalZone, historicalEra, name, ...rest } = legacyConfig;
  
  // Use the augmentation function
  const augmented = augmentGovernmentDistrict(
    archetype,
    culturalZone,
    historicalEra || 1500,
    name
  );
  
  return {
    ...augmented,
    ...rest, // Preserve any additional properties
    era: historicalEra
  };
}

// Layout patterns for different cultural zones
export const CULTURAL_LAYOUT_PATTERNS = {
  GOVERNMENT: {
    EUROPEAN: {
      shape: 'rectangular',
      description: 'Cross-shaped complex with marble pillars',
      centralFeature: 'throne',
      pillarMaterial: 'white_marble',
      hasCourtyard: false,
      seatingArrangement: 'semicircular' // Parliamentary style
    },
    MENA: {
      shape: 'circular',
      description: 'Circular complex with sandstone pillars evoking a dome',
      centralFeature: 'fountain',
      pillarMaterial: 'sandstone',
      hasCourtyard: true,
      seatingArrangement: 'circular'
    },
    EAST_ASIAN: {
      shape: 'rectangular',
      description: 'Symmetrical rectangular halls with red lacquer pillars',
      centralFeature: 'throne',
      pillarMaterial: 'red_lacquer',
      hasCourtyard: true,
      seatingArrangement: 'parallel' // Facing rows
    },
    NORTH_AMERICAN_PRE_COLUMBIAN: {
      shape: 'circular',
      description: 'Small rectangular wooden complex with wood pillars',
      centralFeature: 'firepit',
      pillarMaterial: 'wood',
      hasCourtyard: false,
      seatingArrangement: 'circular'
    },
    SOUTH_AMERICAN: {
      shape: 'rectangular',
      description: 'Stone terraced complex with sandstone pillars',
      centralFeature: 'altar',
      pillarMaterial: 'sandstone',
      hasCourtyard: true,
      seatingArrangement: 'tiered'
    },
    SUB_SAHARAN_AFRICAN: {
      shape: 'circular',
      description: 'Round council house with wooden pillars',
      centralFeature: 'firepit',
      pillarMaterial: 'wood',
      hasCourtyard: false,
      seatingArrangement: 'circular'
    },
    OCEANIA: {
      shape: 'oval',
      description: 'Open-air meeting house with carved wooden pillars',
      centralFeature: 'platform',
      pillarMaterial: 'wood',
      hasCourtyard: false,
      seatingArrangement: 'oval'
    }
  },
  ESTATES: {
    EUROPEAN: {
      shape: 'rectangular',
      description: 'Grand palace with symmetrical wings',
      centralFeature: 'throne',
      pillarMaterial: 'white_marble',
      hasGarden: true
    },
    MENA: {
      shape: 'rectangular',
      description: 'Palace with inner courtyards and fountains',
      centralFeature: 'fountain',
      pillarMaterial: 'sandstone',
      hasGarden: true
    },
    EAST_ASIAN: {
      shape: 'rectangular',
      description: 'Multi-building complex with pavilions',
      centralFeature: 'throne',
      pillarMaterial: 'red_lacquer',
      hasGarden: true
    },
    NORTH_AMERICAN_PRE_COLUMBIAN: {
      shape: 'circular',
      description: 'Chief\'s longhouse or earth lodge',
      centralFeature: 'firepit',
      pillarMaterial: 'wood',
      hasGarden: false
    },
    SOUTH_AMERICAN: {
      shape: 'rectangular',
      description: 'Stone palace with terraces',
      centralFeature: 'throne',
      pillarMaterial: 'sandstone',
      hasGarden: true
    },
    SUB_SAHARAN_AFRICAN: {
      shape: 'circular',
      description: 'Royal compound with multiple huts',
      centralFeature: 'throne',
      pillarMaterial: 'wood',
      hasGarden: false
    },
    OCEANIA: {
      shape: 'oval',
      description: 'Chief\'s house on raised platform',
      centralFeature: 'platform',
      pillarMaterial: 'wood',
      hasGarden: false
    }
  }
};

// Multi-tile object configurations
export const MULTI_TILE_CONFIGS = {
  pillar: {
    heights: {
      prehistoric: 2,
      medieval: 3,
      modern: 4
    },
    materials: ['grey_stone', 'white_marble', 'wood', 'red_lacquer', 'sandstone', 'steel']
  },
  table: {
    widths: {
      xs: 3,
      small: 3,
      medium: 5,
      large: 7,
      xl: 9
    },
    materials: ['wood', 'white_marble', 'red_lacquer']
  },
  lightSource: {
    types: {
      prehistoric: { fixture: 'torch_holder', light: 'fire' },
      antiquity: { fixture: 'bronze_stand', light: 'oil_flame' },
      medieval: { fixture: 'iron_sconce', light: 'torch' },
      earlyModern: { fixture: 'candelabra', light: 'candles' },
      industrial: { fixture: 'gas_lamp', light: 'gas_flame' },
      modern: { fixture: 'electric_fixture', light: 'bulb' }
    }
  }
};
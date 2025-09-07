import { CulturalZone, HistoricalEra } from '../types';

type ClimateType = 'cold' | 'temperate' | 'hot' | 'arid';
type SocialClass = 'common' | 'noble' | 'religious' | 'military' | 'merchant';

interface HeadgearPool {
  [key: string]: number; // headgear baseId -> weight
}

// Era-specific headgear pools
const ERA_HEADGEAR: Record<HistoricalEra, HeadgearPool> = {
  'PREHISTORY': {
    'LEATHER_CAP': 0.4,
    'CLOTH_HOOD': 0.3,
    'CLOTH_CAP': 0.3
  },
  'ANTIQUITY': {
    'CLOTH_CAP': 0.3,
    'LEATHER_CAP': 0.2,
    'STRAW_HAT': 0.2,
    'CLOTH_HOOD': 0.2,
    'COIF': 0.1
  },
  'MEDIEVAL': {
    'COIF': 0.25,
    'CLOTH_HOOD': 0.25,
    'CLOTH_CAP': 0.2,
    'WOOL_CAP': 0.15,
    'LEATHER_CAP': 0.15
  },
  'RENAISSANCE_EARLY_MODERN': {
    'FELT_BERET': 0.2,
    'VELVET_CAP': 0.2,
    'TRICORN_HAT': 0.15,
    'MERCHANT_CAP': 0.15,
    'SUN_HAT': 0.15,
    'SCHOLAR_CAP': 0.15
  },
  'INDUSTRIAL_ERA': {
    'BOWLER_HAT': 0.25,
    'FLAT_CAP': 0.25,
    'TOP_HAT': 0.15,
    'CLOTH_CAP': 0.2,
    'BOATER_HAT': 0.15
  },
  'MODERN_ERA': {
    'BASEBALL_CAP': 0.3,
    'KNIT_CAP': 0.25,
    'FEDORA': 0.15,
    'FLAT_CAP': 0.15,
    'CLOTH_CAP': 0.15
  },
  'FUTURE_ERA': {
    'BASEBALL_CAP': 0.35,
    'DESIGNER_CAP': 0.3,
    'FLAT_CAP': 0.2,
    'CLOTH_CAP': 0.15
  }
};

// Cultural-specific headgear preferences
const CULTURAL_HEADGEAR: Record<CulturalZone, HeadgearPool> = {
  'EUROPEAN': {
    'COIF': 0.2,
    'CLOTH_HOOD': 0.2,
    'CLOTH_CAP': 0.2,
    'FELT_BERET': 0.15,
    'WOOL_CAP': 0.15,
    'LEATHER_CAP': 0.1
  },
  'EAST_ASIAN': {
    'BAMBOO_HAT': 0.35,
    'ZHONGSHAN_CAP': 0.25,
    'CLOTH_CAP': 0.15,
    'SILK_CAP': 0.15,
    'STRAW_HAT': 0.1
  },
  'MENA': {
    'TURBAN': 0.3,
    'KEFFIYEH': 0.25,
    'FEZ': 0.2,
    'CLOTH_CAP': 0.15,
    'KUFI_CAP': 0.1
  },
  'SOUTH_ASIAN': {
    'TURBAN': 0.35,
    'GANDHI_CAP': 0.2,
    'CLOTH_CAP': 0.2,
    'TOPI': 0.15,
    'SILK_CAP': 0.1
  },
  'SUB_SAHARAN_AFRICAN': {
    'KUFI_CAP': 0.3,
    'CLOTH_CAP': 0.25,
    'COTTON_CAP': 0.2,
    'STRAW_HAT': 0.15,
    'LEATHER_CAP': 0.1
  },
  'NORTH_AMERICAN_PRE_COLUMBIAN': {
    'LEATHER_CAP': 0.3,
    'CLOTH_HOOD': 0.3,
    'CLOTH_CAP': 0.2,
    'WOOL_CAP': 0.2
  },
  'NORTH_AMERICAN_COLONIAL': {
    'TRICORN_HAT': 0.2,
    'NEWSBOY_CAP': 0.2,
    'CLOTH_CAP': 0.2,
    'LEATHER_CAP': 0.2,
    'COTTON_CAP': 0.2
  },
  'SOUTH_AMERICAN': {
    'CHULLO_HAT': 0.25,
    'BOWLER_HAT': 0.25,
    'CLOTH_CAP': 0.2,
    'STRAW_HAT': 0.15,
    'WOOL_CAP': 0.15
  },
  'OCEANIA': {
    'STRAW_HAT': 0.3,
    'CLOTH_CAP': 0.25,
    'BAMBOO_HAT': 0.25,
    'COTTON_CAP': 0.2
  }
};

// Climate-specific modifiers
const CLIMATE_MODIFIERS: Record<ClimateType, HeadgearPool> = {
  'cold': {
    'WOOL_CAP': 0.4,
    'KNIT_CAP': 0.3,
    'CLOTH_HOOD': 0.2,
    'LEATHER_CAP': 0.1
  },
  'temperate': {
    'CLOTH_CAP': 0.3,
    'WOOL_CAP': 0.3,
    'CLOTH_HOOD': 0.2,
    'FELT_BERET': 0.2
  },
  'hot': {
    'STRAW_HAT': 0.35,
    'SUN_HAT': 0.25,
    'CLOTH_CAP': 0.2,
    'COTTON_CAP': 0.2
  },
  'arid': {
    'TURBAN': 0.3,
    'KEFFIYEH': 0.3,
    'SUN_HAT': 0.2,
    'CLOTH_CAP': 0.2
  }
};

// Social class modifiers
const SOCIAL_CLASS_HEADGEAR: Record<SocialClass, HeadgearPool> = {
  'common': {
    'CLOTH_CAP': 0.3,
    'WORKER_CAP': 0.3,
    'CLOTH_HOOD': 0.2,
    'COTTON_CAP': 0.2
  },
  'noble': {
    'VELVET_CAP': 0.25,
    'NOBLE_CAP': 0.2,
    'SILK_CAP': 0.2,
    'DUCAL_HAT': 0.2,
    'FELT_BERET': 0.15
  },
  'religious': {
    'CLOTH_HOOD': 0.3,
    'COIF': 0.25,
    'WIMPLE': 0.2,
    'VEIL': 0.15,
    'SCHOLAR_CAP': 0.1
  },
  'military': {
    'LEATHER_CAP': 0.3,
    'BATTLE_HELMET': 0.25,
    'FLAT_CAP': 0.25,
    'CLOTH_CAP': 0.2
  },
  'merchant': {
    'MERCHANT_CAP': 0.25,
    'VELVET_CAP': 0.2,
    'FEZ': 0.2,
    'BOWLER_HAT': 0.2,
    'TURBAN': 0.15
  }
};

// Profession-based headgear preferences
const PROFESSION_HEADGEAR: Record<string, string[]> = {
  // Outdoor workers
  'farmer': ['SUN_HAT', 'CLOTH_CAP', 'WORKER_CAP'],
  'wanderer': ['CLOTH_HOOD', 'CLOTH_CAP', 'LEATHER_CAP'],
  'shepherd': ['WOOL_CAP', 'CLOTH_HOOD', 'CLOTH_CAP'],
  'fisher': ['KNIT_CAP', 'CLOTH_CAP', 'WOOL_CAP'],
  'hunter': ['LEATHER_CAP', 'CLOTH_HOOD', 'CLOTH_CAP'],
  'forester': ['CLOTH_HOOD', 'LEATHER_CAP', 'CLOTH_CAP'],
  
  // Craftspeople
  'blacksmith': ['LEATHER_CAP', 'CLOTH_CAP', null], // null means no hat sometimes
  'carpenter': ['CLOTH_CAP', 'WORKER_CAP', null],
  'weaver': ['COIF', 'CLOTH_CAP', 'CLOTH_HOOD'],
  'potter': ['CLOTH_CAP', 'COTTON_CAP', null],
  
  // Religious
  'priest': ['SCHOLAR_CAP', 'CLOTH_HOOD', 'COIF'],
  'monk': ['CLOTH_HOOD', 'COIF', null],
  'nun': ['WIMPLE', 'VEIL', 'COIF'],
  'pilgrim': ['SUN_HAT', 'CLOTH_HOOD', 'CLOTH_CAP'],
  
  // Military
  'soldier': ['BATTLE_HELMET', 'FLAT_CAP', 'LEATHER_CAP'],
  'guard': ['LEATHER_CAP', 'BATTLE_HELMET', 'CLOTH_CAP'],
  'knight': ['BATTLE_HELMET', 'COIF', 'LEATHER_CAP'],
  
  // Merchants/Urban
  'merchant': ['MERCHANT_CAP', 'VELVET_CAP', 'FEZ'],
  'banker': ['VELVET_CAP', 'BOWLER_HAT', 'TOP_HAT'],
  'scribe': ['CLOTH_CAP', 'SCHOLAR_CAP', null],
  
  // Default fallback
  'default': ['CLOTH_CAP', 'CLOTH_HOOD', 'COTTON_CAP']
};

function weightedRandom(weights: HeadgearPool): string | null {
  const entries = Object.entries(weights);
  const totalWeight = entries.reduce((sum, [_, weight]) => sum + weight, 0);
  
  // 20% chance of no headgear for some professions
  if (Math.random() < 0.2) {
    return null;
  }
  
  let random = Math.random() * totalWeight;
  
  for (const [item, weight] of entries) {
    random -= weight;
    if (random <= 0) return item;
  }
  
  return entries[0]?.[0] || null;
}

function getProfessionType(profession: string): SocialClass {
  const professionLower = profession.toLowerCase();
  
  if (['priest', 'monk', 'nun', 'friar', 'pilgrim', 'hermit', 'imam', 'rabbi', 'oracle', 'shaman'].some(p => professionLower.includes(p))) {
    return 'religious';
  }
  if (['guard', 'soldier', 'warrior', 'knight', 'legionary', 'centurion', 'janissary', 'ashigaru', 'sepoy'].some(p => professionLower.includes(p))) {
    return 'military';
  }
  if (['merchant', 'trader', 'banker', 'vendor', 'dealer'].some(p => professionLower.includes(p))) {
    return 'merchant';
  }
  if (['noble', 'lord', 'lady', 'king', 'queen', 'duke', 'prince', 'sultan', 'emperor'].some(p => professionLower.includes(p))) {
    return 'noble';
  }
  
  return 'common';
}

function getClimateFromCulture(culture: CulturalZone): ClimateType {
  const climateMap: Record<CulturalZone, ClimateType> = {
    'EUROPEAN': 'temperate',
    'EAST_ASIAN': 'temperate',
    'MENA': 'arid',
    'SOUTH_ASIAN': 'hot',
    'SUB_SAHARAN_AFRICAN': 'hot',
    'NORTH_AMERICAN_PRE_COLUMBIAN': 'temperate',
    'NORTH_AMERICAN_COLONIAL': 'temperate',
    'SOUTH_AMERICAN': 'temperate',
    'OCEANIA': 'hot'
  };
  
  return climateMap[culture] || 'temperate';
}

export function generateContextualHeadgear(
  profession: string,
  options: {
    era?: HistoricalEra;
    culture?: CulturalZone;
    socialClass?: SocialClass;
    climate?: ClimateType;
    privilege?: number;
  } = {}
): string | null {
  const era = options.era || 'MEDIEVAL';
  const culture = options.culture || 'EUROPEAN';
  const climate = options.climate || getClimateFromCulture(culture);
  const socialClass = options.socialClass || getProfessionType(profession);
  const privilege = options.privilege || 0.5;
  
  // Check for profession-specific headgear first
  const professionLower = profession.toLowerCase();
  const professionSpecific = Object.entries(PROFESSION_HEADGEAR).find(([key]) => 
    professionLower.includes(key)
  );
  
  if (professionSpecific) {
    const choices = professionSpecific[1];
    const choice = choices[Math.floor(Math.random() * choices.length)];
    if (choice !== null) return choice;
  }
  
  // Build weighted pool based on all factors
  let headgearPool: HeadgearPool = {};
  
  // Add era-appropriate headgear
  const eraHeadgear = ERA_HEADGEAR[era] || ERA_HEADGEAR['MEDIEVAL'];
  Object.entries(eraHeadgear).forEach(([item, weight]) => {
    headgearPool[item] = (headgearPool[item] || 0) + weight * 0.25;
  });
  
  // Add culturally appropriate headgear
  const culturalHeadgear = CULTURAL_HEADGEAR[culture] || CULTURAL_HEADGEAR['EUROPEAN'];
  Object.entries(culturalHeadgear).forEach(([item, weight]) => {
    headgearPool[item] = (headgearPool[item] || 0) + weight * 0.35;
  });
  
  // Add climate-appropriate headgear
  const climateHeadgear = CLIMATE_MODIFIERS[climate];
  Object.entries(climateHeadgear).forEach(([item, weight]) => {
    headgearPool[item] = (headgearPool[item] || 0) + weight * 0.2;
  });
  
  // Add social class appropriate headgear
  const socialHeadgear = SOCIAL_CLASS_HEADGEAR[socialClass];
  Object.entries(socialHeadgear).forEach(([item, weight]) => {
    headgearPool[item] = (headgearPool[item] || 0) + weight * 0.2;
  });
  
  // Apply privilege modifier for noble/fancy headgear
  if (privilege > 0.7) {
    if (headgearPool['VELVET_CAP']) headgearPool['VELVET_CAP'] *= 2;
    if (headgearPool['FEATHER_HAT']) headgearPool['FEATHER_HAT'] *= 2;
    if (headgearPool['SILK_TURBAN']) headgearPool['SILK_TURBAN'] *= 2;
  } else if (privilege < 0.3) {
    if (headgearPool['CLOTH_CAP']) headgearPool['CLOTH_CAP'] *= 2;
    if (headgearPool['STRAW_HAT']) headgearPool['STRAW_HAT'] *= 2;
  }
  
  // Select from weighted pool
  return weightedRandom(headgearPool);
}

// Export helper to check if an item is headgear
export function isHeadgear(itemId: string): boolean {
  const headgearItems = [
    'STRAW_HAT', 'BAMBOO_HAT', 'FELT_CAP', 'CLOTH_CAP', 'LEATHER_CAP',
    'COIF', 'HOOD', 'TURBAN', 'KEFFIYEH', 'FEZ', 'BERET', 'BOWLER_HAT',
    'TOP_HAT', 'WIDE_BRIM_HAT', 'TRICORN_HAT', 'WIMPLE', 'VEIL',
    'BATTLE_HELMET', 'WOLF_PELT', 'FUR_CAP', 'WOOL_HAT', 'MONK_COWL',
    'CHULLO_HAT', 'CONICAL_HAT', 'HEADBAND', 'HEADSCARF', 'KUFI',
    'HEADWRAP', 'BEADED_CAP', 'FEATHER_HEADDRESS', 'PAGRI', 'TOPI',
    'COONSKIN_CAP', 'BONNET', 'FEATHER_CROWN', 'WOVEN_HAT', 'FLOWER_CROWN',
    'SHELL_CAP', 'USHANKA', 'VELVET_CAP', 'FEATHER_HAT', 'JEWELED_CIRCLET',
    'SILK_TURBAN', 'MITRE', 'PRAYER_CAP', 'MILITARY_CAP', 'BIRETTA',
    'ZUCCHETTO', 'PILGRIM_HAT', 'ARMING_CAP', 'SKULL_CAP', 'KNIT_CAP',
    'OILSKIN_HAT', 'BASEBALL_CAP', 'BEANIE', 'FEDORA', 'TECH_VISOR',
    'SMART_CAP', 'FLAT_CAP', 'STRAW_BOATER', 'LAUREL_WREATH',
    'DEER_HIDE_CAP', 'WOVEN_GRASS_HAT', 'WOVEN_CAP', 'OFFICIAL_HAT',
    'PITH_HELMET'
  ];
  
  return headgearItems.includes(itemId);
}

// Generate fallback starting package for unknown professions
export function generateContextualStartingPackage(
  profession: string,
  options: {
    era?: HistoricalEra;
    culture?: CulturalZone;
    privilege?: number;
  } = {}
) {
  const headgear = generateContextualHeadgear(profession, options);
  
  return {
    equipment: {
      head: headgear,
      torso: 'SIMPLE_TUNIC', // This should also be contextual
      legs: 'WORKER_TROUSERS',
      feet: 'LEATHER_BOOTS',
      main_hand: '*CONTEXTUAL*'
    },
    inventory: ['BREAD', 'GOURD_FLASK'],
    companions: []
  };
}
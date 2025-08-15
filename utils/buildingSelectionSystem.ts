/**
 * Unified Building Selection System
 * Single source of truth for all building selection logic
 */

import { BiomeType, HistoricalEra } from '../types';

// Building component type placeholder (will be imported from components)
type BuildingComponent = React.ComponentType<any>;

// Import all building components
import {
  AboriginalHut3D,
  AdobeBuilding3D,
  AfricanRoundHut3D,
  AfricanStoneBuilding3D,
  AztecDwelling3D,
  BambooHouse3D,
  BarkLonghouse3D,
  EastAsianPagoda3D,
  EuropeanCottage3D,
  GeorgianRowhouse3D,
  GreekHouse3D,
  Igloo3D,
  IncaStoneHouse3D,
  IndustrialBuilding3D,
  IndustrialRowhouse3D,
  JapaneseHouse3D,
  Longhouse3D,
  MedievalBuilding3D,
  MediterraneanBuilding3D,
  MesopotamianBuilding3D,
  ModernCivic3D,
  ModernSkyscraper3D,
  NativeTeepee3D,
  OttomanTownhouse3D,
  PolynesianHouse3D,
  PrehistoricShelter3D,
  RomanInsula3D,
  RomanVilla3D,
  SouthAsianBuilding3D,
  SouthAsianTemple3D,
  StiltHouse3D,
  TropicalHut3D,
  VikingLonghouse3D,
  Yurt3D,
} from '../components/symbols/buildings';

// Building aliases to consolidate redundant types
export const BUILDING_ALIASES: Record<string, BuildingComponent> = {
  'TropicalStiltHouse': StiltHouse3D,     // Use StiltHouse for all tropical stilts
  'SoutheastAsianHouse': BambooHouse3D,   // Use BambooHouse for all SE Asian
  'NativeLonghouse': Longhouse3D,         // Use Longhouse3D everywhere
  'BarkLonghouse': Longhouse3D,           // Consolidate to one longhouse
  'MaoriPa': PolynesianHouse3D,          // Use Polynesian for all Pacific
};

// Era-based building matrix (ERA is primary, culture is secondary)
export const ERA_BUILDING_MATRIX: Record<HistoricalEra, Record<string, BuildingComponent[]>> = {
  [HistoricalEra.PREHISTORY]: {
    'EUROPEAN': [PrehistoricShelter3D],
    'MENA': [PrehistoricShelter3D],
    'EAST_ASIAN': [PrehistoricShelter3D],
    'SOUTH_ASIAN': [PrehistoricShelter3D],
    'SUB_SAHARAN_AFRICAN': [PrehistoricShelter3D, AfricanRoundHut3D],
    'NORTH_AMERICAN_PRE_COLUMBIAN': [PrehistoricShelter3D, NativeTeepee3D],
    'SOUTH_AMERICAN': [PrehistoricShelter3D, TropicalHut3D],
    'OCEANIA': [PrehistoricShelter3D, PolynesianHouse3D],
    'ARCTIC': [PrehistoricShelter3D, Igloo3D],
    'ABORIGINAL_AUSTRALIAN': [PrehistoricShelter3D, AboriginalHut3D],
  },
  
  [HistoricalEra.ANTIQUITY]: {
    'EUROPEAN': [EuropeanCottage3D, MedievalBuilding3D], // Early European
    'ROMAN': [RomanInsula3D, RomanVilla3D],
    'GREEK': [GreekHouse3D],
    'MENA': [OttomanTownhouse3D, MesopotamianBuilding3D],
    'EGYPTIAN': [AfricanStoneBuilding3D],
    'MESOPOTAMIAN': [MesopotamianBuilding3D],
    'EAST_ASIAN': [EastAsianPagoda3D],
    'SOUTH_ASIAN': [SouthAsianBuilding3D],
    'SUB_SAHARAN_AFRICAN': [AfricanRoundHut3D, AfricanStoneBuilding3D],
    'NORTH_AMERICAN_PRE_COLUMBIAN': [BarkLonghouse3D, AdobeBuilding3D],
    'MESOAMERICAN': [AztecDwelling3D],
    'ANDEAN': [IncaStoneHouse3D],
    'SOUTH_AMERICAN': [TropicalHut3D],
    'OCEANIA': [PolynesianHouse3D],
    'ARCTIC': [Igloo3D],
    'ABORIGINAL_AUSTRALIAN': [AboriginalHut3D],
  },
  
  [HistoricalEra.MEDIEVAL]: {
    'EUROPEAN': [MedievalBuilding3D, EuropeanCottage3D], // FIXED: Medieval buildings for medieval era
    'VIKING': [VikingLonghouse3D],
    'BYZANTINE': [MedievalBuilding3D, MediterraneanBuilding3D],
    'MENA': [OttomanTownhouse3D],
    'EAST_ASIAN': [EastAsianPagoda3D, JapaneseHouse3D],
    'SOUTH_ASIAN': [SouthAsianBuilding3D, SouthAsianTemple3D],
    'SUB_SAHARAN_AFRICAN': [AfricanRoundHut3D, AfricanStoneBuilding3D],
    'NORTH_AMERICAN_PRE_COLUMBIAN': [Longhouse3D, AdobeBuilding3D, NativeTeepee3D],
    'MESOAMERICAN': [AztecDwelling3D],
    'ANDEAN': [IncaStoneHouse3D],
    'SOUTH_AMERICAN': [TropicalHut3D, AdobeBuilding3D],
    'OCEANIA': [PolynesianHouse3D],
    'ARCTIC': [Igloo3D],
    'ABORIGINAL_AUSTRALIAN': [AboriginalHut3D],
    'SLAVIC': [MedievalBuilding3D],
    'MONGOLIAN': [Yurt3D],
  },
  
  [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
    'EUROPEAN': [GeorgianRowhouse3D, MedievalBuilding3D, EuropeanCottage3D],
    'MEDITERRANEAN': [MediterraneanBuilding3D],
    'MENA': [OttomanTownhouse3D, MediterraneanBuilding3D],
    'EAST_ASIAN': [EastAsianPagoda3D, JapaneseHouse3D],
    'SOUTH_ASIAN': [SouthAsianBuilding3D, OttomanTownhouse3D], // Mughal influence
    'SUB_SAHARAN_AFRICAN': [AfricanRoundHut3D, MediterraneanBuilding3D], // Some colonial
    'NORTH_AMERICAN_COLONIAL': [MediterraneanBuilding3D],
    'SOUTH_AMERICAN': [MediterraneanBuilding3D], // Spanish colonial
    'OCEANIA': [PolynesianHouse3D],
    'SOUTHEAST_ASIAN': [StiltHouse3D, BambooHouse3D],
  },
  
  [HistoricalEra.INDUSTRIAL_ERA]: {
    'EUROPEAN': [IndustrialBuilding3D, IndustrialRowhouse3D, GeorgianRowhouse3D],
    'MEDITERRANEAN': [MediterraneanBuilding3D, IndustrialBuilding3D],
    'MENA': [OttomanTownhouse3D, MediterraneanBuilding3D],
    'EAST_ASIAN': [EastAsianPagoda3D, JapaneseHouse3D],
    'SOUTH_ASIAN': [SouthAsianBuilding3D, IndustrialBuilding3D],
    'SUB_SAHARAN_AFRICAN': [MediterraneanBuilding3D, AfricanRoundHut3D], // Colonial era
    'NORTH_AMERICAN_COLONIAL': [IndustrialBuilding3D, IndustrialRowhouse3D],
    'SOUTH_AMERICAN': [MediterraneanBuilding3D, IndustrialBuilding3D],
    'OCEANIA': [EuropeanCottage3D, PolynesianHouse3D],
  },
  
  [HistoricalEra.MODERN_ERA]: {
    'EUROPEAN': [ModernCivic3D, ModernSkyscraper3D, IndustrialBuilding3D],
    'MEDITERRANEAN': [ModernCivic3D, MediterraneanBuilding3D],
    'MENA': [ModernCivic3D, OttomanTownhouse3D],
    'EAST_ASIAN': [ModernSkyscraper3D, JapaneseHouse3D],
    'SOUTH_ASIAN': [ModernCivic3D, SouthAsianBuilding3D],
    'SUB_SAHARAN_AFRICAN': [ModernCivic3D, MediterraneanBuilding3D],
    'NORTH_AMERICAN': [ModernSkyscraper3D, ModernCivic3D],
    'SOUTH_AMERICAN': [ModernCivic3D, MediterraneanBuilding3D],
    'OCEANIA': [ModernCivic3D, EuropeanCottage3D],
  },
  
  [HistoricalEra.FUTURE_ERA]: {
    'DEFAULT': [ModernSkyscraper3D, ModernCivic3D],
  },
};

// Density modernization factors
export const DENSITY_MODERNIZATION: Record<string, number> = {
  [BiomeType.HAMLET]: -0.8,           // Strongly favor older buildings
  [BiomeType.LOW_DENSITY_CITY]: -0.3, // Slightly favor older
  [BiomeType.DENSE_CITY]: 0.3,        // Slightly favor newer
  [BiomeType.CITY_CENTER]: 0.7,       // Strongly favor newer
};

// Cultural transition definitions
export interface CulturalTransition {
  region: string;
  startYear: number;
  endYear: number;
  fromCulture: string;
  toCulture: string;
  transitionType: 'rapid' | 'gradual' | 'stepped';
  urbanFirst: boolean; // Cities transition faster
}

export const CULTURAL_TRANSITIONS: CulturalTransition[] = [
  // Spanish conquest of Americas
  {
    region: 'mexico',
    startYear: 1519,
    endYear: 1540,
    fromCulture: 'MESOAMERICAN',
    toCulture: 'MEDITERRANEAN',
    transitionType: 'rapid',
    urbanFirst: true,
  },
  {
    region: 'peru',
    startYear: 1532,
    endYear: 1560,
    fromCulture: 'ANDEAN',
    toCulture: 'MEDITERRANEAN',
    transitionType: 'rapid',
    urbanFirst: true,
  },
  // Islamic conquests
  {
    region: 'egypt',
    startYear: 640,
    endYear: 670,
    fromCulture: 'EGYPTIAN',
    toCulture: 'MENA',
    transitionType: 'rapid',
    urbanFirst: true,
  },
  {
    region: 'persia',
    startYear: 650,
    endYear: 700,
    fromCulture: 'MESOPOTAMIAN',
    toCulture: 'MENA',
    transitionType: 'gradual',
    urbanFirst: true,
  },
  // Colonial Africa
  {
    region: 'africa',
    startYear: 1850,
    endYear: 1920,
    fromCulture: 'SUB_SAHARAN_AFRICAN',
    toCulture: 'EUROPEAN',
    transitionType: 'gradual',
    urbanFirst: true,
  },
  // British colonization
  {
    region: 'india',
    startYear: 1750,
    endYear: 1850,
    fromCulture: 'SOUTH_ASIAN',
    toCulture: 'EUROPEAN',
    transitionType: 'gradual',
    urbanFirst: true,
  },
  {
    region: 'australia',
    startYear: 1788,
    endYear: 1850,
    fromCulture: 'ABORIGINAL_AUSTRALIAN',
    toCulture: 'EUROPEAN',
    transitionType: 'rapid',
    urbanFirst: true,
  },
];

/**
 * Calculate transition progress based on year and transition type
 */
export function getTransitionProgress(
  year: number,
  transition: CulturalTransition,
  isUrban: boolean
): number {
  const elapsed = year - transition.startYear;
  const duration = transition.endYear - transition.startYear;
  
  // Urban areas transition faster
  const urbanMultiplier = isUrban && transition.urbanFirst ? 0.7 : 1.0;
  const effectiveDuration = duration * urbanMultiplier;
  
  let progress = Math.min(1, Math.max(0, elapsed / effectiveDuration));
  
  // Apply transition curve
  switch (transition.transitionType) {
    case 'rapid':
      // S-curve: slow start, rapid middle, slow end
      progress = progress < 0.5 
        ? 2 * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      // In cities, reach 95% by halfway point
      if (isUrban && progress > 0.5) {
        progress = 0.95 + (progress - 0.5) * 0.1;
      }
      break;
    case 'gradual':
      // Linear transition
      break;
    case 'stepped':
      // Discrete steps
      progress = Math.floor(progress * 4) / 4;
      break;
  }
  
  return progress;
}

/**
 * Main unified building selection function
 */
export function selectBuilding(params: {
  year: number;
  location: string;
  culture: string;
  density: BiomeType;
  era: HistoricalEra;
  seed: number;
  enableLogging?: boolean;
}): { component: BuildingComponent; name: string } {
  const { year, location, culture, density, era, seed, enableLogging } = params;
  
  // Phase 1: Diagnostic logging
  const log = (message: string) => {
    if (enableLogging) {
      console.log(`[BuildingSelection] ${message}`);
    }
  };
  
  log(`Input: ${location} ${year} - Era: ${era}, Culture: ${culture}, Density: ${density}`);
  
  // Check for active cultural transitions
  const activeTransition = CULTURAL_TRANSITIONS.find(t => 
    location.toLowerCase().includes(t.region) &&
    year >= t.startYear &&
    year <= t.endYear + 100 // Grace period
  );
  
  const isUrban = density === BiomeType.CITY_CENTER || density === BiomeType.DENSE_CITY;
  
  let effectiveCulture = culture;
  let transitionProgress = 0;
  
  if (activeTransition) {
    transitionProgress = getTransitionProgress(year, activeTransition, isUrban);
    // If transition is >50% complete, use new culture
    if (transitionProgress > 0.5) {
      effectiveCulture = activeTransition.toCulture;
      log(`Transition active: ${activeTransition.fromCulture} → ${activeTransition.toCulture} (${Math.round(transitionProgress * 100)}%)`);
    }
  }
  
  // Get buildings for era and culture
  const eraBuildings = ERA_BUILDING_MATRIX[era];
  if (!eraBuildings) {
    log(`WARNING: No buildings defined for era ${era}, using medieval`);
    return { 
      component: MedievalBuilding3D, 
      name: 'MedievalBuilding3D' 
    };
  }
  
  let culturalBuildings = eraBuildings[effectiveCulture];
  
  // Fallback chain for missing cultures
  if (!culturalBuildings) {
    // Try to find a similar culture
    const fallbacks: Record<string, string[]> = {
      'VIKING': ['EUROPEAN'],
      'BYZANTINE': ['MEDITERRANEAN', 'EUROPEAN'],
      'CLASSICAL_GREEK': ['GREEK', 'MEDITERRANEAN'],
      'ANCIENT_EGYPTIAN': ['EGYPTIAN', 'SUB_SAHARAN_AFRICAN'],
      'ANCIENT_MESOPOTAMIAN': ['MESOPOTAMIAN', 'MENA'],
      'ROMAN': ['MEDITERRANEAN', 'EUROPEAN'],
      'SLAVIC': ['EUROPEAN'],
      'MONGOLIAN': ['EAST_ASIAN'],
      'MESOAMERICAN': ['SOUTH_AMERICAN'],
      'ANDEAN': ['SOUTH_AMERICAN'],
      'SOUTHEAST_ASIAN': ['EAST_ASIAN'],
    };
    
    const fallbackCultures = fallbacks[effectiveCulture] || ['EUROPEAN'];
    for (const fallback of fallbackCultures) {
      culturalBuildings = eraBuildings[fallback];
      if (culturalBuildings) {
        log(`Using fallback culture: ${fallback} for ${effectiveCulture}`);
        break;
      }
    }
  }
  
  // Final fallback
  if (!culturalBuildings || culturalBuildings.length === 0) {
    log(`ERROR: No buildings found for ${effectiveCulture} in ${era}, using European cottage`);
    return { 
      component: EuropeanCottage3D, 
      name: 'EuropeanCottage3D' 
    };
  }
  
  // Apply density modernization
  const densityModifier = DENSITY_MODERNIZATION[density] || 0;
  let buildingIndex = 0;
  
  if (culturalBuildings.length > 1) {
    // Use density to select between old and new buildings
    const selection = (seed % 100) / 100 + densityModifier;
    if (selection > 0.5 && culturalBuildings.length > 1) {
      buildingIndex = culturalBuildings.length - 1; // Newer building
    }
  }
  
  const selectedBuilding = culturalBuildings[buildingIndex];
  const buildingName = selectedBuilding.name || 'UnknownBuilding';
  
  log(`Selected: ${buildingName} (index ${buildingIndex} of ${culturalBuildings.length})`);
  
  return { 
    component: selectedBuilding, 
    name: buildingName 
  };
}

/**
 * Get fortress type based on era and culture
 */
export function getFortressTypeByEra(era: string, culturalZone: string): string {
  // Era-based fortress selection
  const fortressMatrix: Record<string, Record<string, string>> = {
    'prehistoric': {
      'DEFAULT': 'Hillfort',
    },
    'ancient': {
      'EUROPEAN': 'Roman Castrum',
      'MENA': 'Roman Castrum',
      'EAST_ASIAN': 'Chinese Fort',
      'DEFAULT': 'Hillfort',
    },
    'medieval': {
      'EAST_ASIAN': 'Japanese Fortress',
      'DEFAULT': 'Medieval Castle',
    },
    'renaissance': {
      'NORTH_AMERICAN_COLONIAL': 'Colonial Presidio',
      'SOUTH_AMERICAN': 'Colonial Presidio',
      'DEFAULT': 'Star Fort',
    },
    'early_modern': {
      'NORTH_AMERICAN_COLONIAL': 'Colonial Presidio',
      'SOUTH_AMERICAN': 'Colonial Presidio',
      'EAST_ASIAN': 'Japanese Fortress',
      'DEFAULT': 'Star Fort',
    },
    'modern': {
      'DEFAULT': 'Modern Fort',
    },
    'contemporary': {
      'DEFAULT': 'Modern Fort',
    },
  };
  
  const eraFortresses = fortressMatrix[era] || fortressMatrix['medieval'];
  return eraFortresses[culturalZone] || eraFortresses['DEFAULT'] || 'Medieval Castle';
}
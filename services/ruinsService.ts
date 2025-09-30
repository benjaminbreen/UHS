/**
 * services/ruinsService.ts
 * Enhanced ruins generation using previous era structure names from faction data
 */

import { HistoricalEra, CulturalZone, TerrainStructure, ClimateType } from '../types';
import { ValueNoise } from '../utils/noise';
// Heavy data files - import directly to avoid loading on app startup
import { GEOGRAPHICAL_DATA } from '../constants/gameData/geography';
import { FACTION_DATA } from '../constants/index';

// Map historical eras to approximate year ranges for age calculation
const ERA_YEAR_RANGES: Record<HistoricalEra, [number, number]> = {
  [HistoricalEra.PREHISTORY]: [-5000, -1000],
  [HistoricalEra.ANTIQUITY]: [-1000, 500],
  [HistoricalEra.MEDIEVAL]: [500, 1450],
  [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [1450, 1800],
  [HistoricalEra.INDUSTRIAL_ERA]: [1800, 1920],
  [HistoricalEra.MODERN_ERA]: [1920, 2000],
  [HistoricalEra.FUTURE_ERA]: [2000, 2100],
};

// Map structure types to ruin prefixes
const RUIN_PREFIXES: Record<string, string[]> = {
  'fortress': ['Ruined', 'Abandoned', 'Crumbling', 'Ancient'],
  'palace': ['Ruined', 'Fallen', 'Lost', 'Forgotten'],
  'mill': ['Derelict', 'Ruined', 'Abandoned'],
  'factory': ['Abandoned', 'Derelict', 'Rusted'],
  'holy_site': ['Ruined', 'Desecrated', 'Ancient', 'Forgotten'],
  'quarry': ['Abandoned', 'Exhausted', 'Old'],
  'marketplace': ['Abandoned', 'Old', 'Ruined'],
  'government_district': ['Ruined', 'Fallen', 'Ancient'],
};

// Climate-specific material descriptors
const CLIMATE_MATERIALS: Record<ClimateType, string[]> = {
  [ClimateType.ARID]: ['sandstone', 'mudbrick', 'adobe', 'red stone'],
  [ClimateType.TEMPERATE]: ['stone', 'timber', 'brick', 'granite'],
  [ClimateType.COLD]: ['granite', 'basalt', 'timber', 'stone'],
  [ClimateType.TROPICAL]: ['laterite', 'bamboo', 'coral stone', 'volcanic rock'],
  [ClimateType.MEDITERRANEAN]: ['marble', 'limestone', 'terracotta', 'stone'],
};

// Cultural ruin style variations - historically and geographically accurate
const CULTURAL_RUIN_STYLES: Record<string, string[]> = {
  'EUROPEAN': ['tower', 'keep', 'monastery', 'castle', 'cathedral'],
  'MENA': ['minaret', 'fortress', 'caravanserai', 'madrasa', 'palace'],
  'SOUTH_ASIAN': ['stupa', 'temple', 'fort', 'stepwell', 'haveli'],
  'EAST_ASIAN': ['pagoda', 'temple', 'palace', 'gate', 'pavilion'],
  'SOUTHEAST_ASIAN': ['temple', 'stupa', 'palace', 'wat', 'candi'],
  'SUB_SAHARAN': ['enclosure', 'granary', 'palace', 'mosque', 'citadel'],
  'MESOAMERICAN': ['pyramid', 'temple', 'palace', 'ballcourt', 'observatory'],
  'SOUTH_AMERICAN': ['temple', 'fortress', 'terrace', 'palace', 'shrine'],
  'NORTH_AMERICAN': ['mound', 'longhouse', 'kiva', 'cliff dwelling', 'earthwork'],
  'OCEANIAN': ['marae', 'pa', 'heiau', 'village', 'stone platform'],
};

// Era and culture specific ruin types
const ERA_CULTURE_RUINS: Record<string, Record<HistoricalEra, string[]>> = {
  'NORTH_AMERICAN': {
    [HistoricalEra.PREHISTORY]: ['ancient earthwork', 'ceremonial mound', 'sacred spring', 'stone circle'],
    [HistoricalEra.ANTIQUITY]: ['burial mound', 'ceremonial center', 'cliff dwelling', 'kiva complex'],
    [HistoricalEra.MEDIEVAL]: ['pueblo', 'longhouse village', 'palisade fort', 'ceremonial plaza'],
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: ['mission', 'trading post', 'colonial fort', 'settlement'],
    [HistoricalEra.INDUSTRIAL_ERA]: ['ghost town', 'abandoned mine', 'old railroad', 'factory'],
    [HistoricalEra.MODERN_ERA]: ['abandoned mall', 'closed factory', 'defunct power plant', 'ghost town'],
    [HistoricalEra.FUTURE_ERA]: ['data center', 'solar farm', 'vertical farm', 'transit hub'],
  },
  'MESOAMERICAN': {
    [HistoricalEra.PREHISTORY]: ['ancient shrine', 'stone platform', 'ceremonial cave', 'sacred cenote'],
    [HistoricalEra.ANTIQUITY]: ['pyramid', 'ballcourt', 'observatory', 'ceremonial plaza'],
    [HistoricalEra.MEDIEVAL]: ['temple complex', 'palace', 'market plaza', 'aqueduct'],
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: ['colonial church', 'hacienda', 'mission', 'fortress'],
    [HistoricalEra.INDUSTRIAL_ERA]: ['plantation', 'railway station', 'mine', 'factory'],
    [HistoricalEra.MODERN_ERA]: ['resort', 'airport', 'mall', 'stadium'],
    [HistoricalEra.FUTURE_ERA]: ['arcology', 'maglev station', 'climate shelter', 'vertical farm'],
  },
  'OCEANIA': {
    [HistoricalEra.PREHISTORY]: ['sacred cave', 'stone circle', 'rock shelter', 'ceremonial ground'],
    [HistoricalEra.ANTIQUITY]: ['stone platform', 'burial site', 'fish trap', 'carved rock'],
    [HistoricalEra.MEDIEVAL]: ['meeting ground', 'canoe house', 'sacred tree site', 'stone arrangement'],
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: ['mission station', 'colonial outpost', 'trading post', 'whaling station'],
    [HistoricalEra.INDUSTRIAL_ERA]: ['mining settlement', 'telegraph station', 'sheep station', 'railway camp'],
    [HistoricalEra.MODERN_ERA]: ['abandoned homestead', 'old woolshed', 'ghost town', 'disused quarry'],
    [HistoricalEra.FUTURE_ERA]: ['solar farm', 'desalination plant', 'research station', 'weather dome'],
  },
  'OCEANIAN': {  // Alternative spelling support
    [HistoricalEra.PREHISTORY]: ['sacred cave', 'stone circle', 'rock shelter', 'ceremonial ground'],
    [HistoricalEra.ANTIQUITY]: ['stone platform', 'burial site', 'fish trap', 'carved rock'],
    [HistoricalEra.MEDIEVAL]: ['meeting ground', 'canoe house', 'sacred tree site', 'stone arrangement'],
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: ['mission station', 'colonial outpost', 'trading post', 'whaling station'],
    [HistoricalEra.INDUSTRIAL_ERA]: ['mining settlement', 'telegraph station', 'sheep station', 'railway camp'],
    [HistoricalEra.MODERN_ERA]: ['abandoned homestead', 'old woolshed', 'ghost town', 'disused quarry'],
    [HistoricalEra.FUTURE_ERA]: ['solar farm', 'desalination plant', 'research station', 'weather dome'],
  },
};

export interface EnhancedRuin {
  name: string;
  originalStructureType: string;
  originalEra: HistoricalEra;
  age: number;
  material: string;
  style: string;
  description: string;
}

/**
 * Map a localArea name to the appropriate region name in faction data
 */
function mapLocalAreaToFactionRegion(localArea: string, culturalZone: string): string | null {
  // Check all regions in the cultural zone for the localArea
  const zoneData = GEOGRAPHICAL_DATA[culturalZone];
  if (!zoneData) return null;
  
  for (const [regionName, areas] of Object.entries(zoneData)) {
    if (areas && typeof areas === 'object') {
      for (const [areaKey, areaDef] of Object.entries(areas)) {
        if (areaDef && typeof areaDef === 'object' && 'name' in areaDef) {
          if (areaDef.name === localArea) {
            return regionName;
          }
        }
      }
    }
  }
  
  return null;
}

/**
 * Get structure names from a previous era for ruins
 */
function getPreviousEraStructures(
  culturalZone: CulturalZone | string,
  region: string,
  currentEra: HistoricalEra,
  noise: ValueNoise
): { structureName: string; structureType: string; fromEra: HistoricalEra } | null {
  const factionData = FACTION_DATA[culturalZone as CulturalZone];
  if (!factionData) return null;

  // First try the direct region name
  let regionData = factionData[region];
  
  if (!regionData) {
    // Try to map from localArea to region name
    const mappedRegion = mapLocalAreaToFactionRegion(region, culturalZone as string);
    if (mappedRegion) {
      regionData = factionData[mappedRegion];
    }
    
    if (!regionData) {
      // Fallback to first available region
      const regions = Object.keys(factionData);
      if (regions.length > 0) {
        const fallbackRegion = regions[0];
        console.log(`[Ruins] Falling back to ${fallbackRegion} for ${culturalZone}/${region}`);
        return getPreviousEraStructures(culturalZone, fallbackRegion, currentEra, noise);
      }
      return null;
    }
  }

  // Get all eras before the current one
  const allEras = Object.values(HistoricalEra);
  const currentEraIndex = allEras.indexOf(currentEra);
  if (currentEraIndex <= 0) return null; // No previous eras

  // Randomly select from 1-3 eras back (weighted towards more recent)
  const erasBack = Math.min(
    currentEraIndex,
    1 + Math.floor(noise.random() * 3 * (1 - noise.random() * 0.5))
  );
  const targetEra = allEras[currentEraIndex - erasBack];

  const eraData = regionData[targetEra];
  if (!eraData || !eraData.structureNames) return null;

  // Get all available structure types and names
  const structureTypes = Object.keys(eraData.structureNames);
  if (structureTypes.length === 0) return null;

  const selectedType = structureTypes[Math.floor(noise.random() * structureTypes.length)];
  const structures = eraData.structureNames[selectedType as keyof typeof eraData.structureNames];
  if (!structures || structures.length === 0) return null;

  const selectedStructure = structures[Math.floor(noise.random() * structures.length)];

  return {
    structureName: selectedStructure,
    structureType: selectedType,
    fromEra: targetEra,
  };
}

/**
 * Calculate the age of a ruin based on era difference
 */
function calculateRuinAge(fromEra: HistoricalEra, currentYear: number, noise: ValueNoise): number {
  const [minYear, maxYear] = ERA_YEAR_RANGES[fromEra];
  const eraYear = minYear + noise.random() * (maxYear - minYear);
  const age = currentYear - eraYear;
  
  // Add some random weathering
  const weathering = noise.random() * 50 - 25; // +/- 25 years
  
  return Math.max(10, Math.floor(age + weathering));
}

/**
 * Generate an enhanced ruin with cultural and historical specificity
 */
export function generateEnhancedRuin(
  culturalZone: CulturalZone | string,
  region: string,
  currentEra: HistoricalEra,
  currentYear: number,
  climate: ClimateType,
  noise: ValueNoise
): EnhancedRuin {
  // Try to get a structure from a previous era
  const previousStructure = getPreviousEraStructures(culturalZone, region, currentEra, noise);
  
  let name: string;
  let originalStructureType: string;
  let originalEra: HistoricalEra;
  let age: number;

  if (previousStructure) {
    // Use the historical structure name
    const prefixes = RUIN_PREFIXES[previousStructure.structureType] || ['Ruined'];
    const prefix = prefixes[Math.floor(noise.random() * prefixes.length)];
    name = `${prefix} ${previousStructure.structureName}`;
    originalStructureType = previousStructure.structureType;
    originalEra = previousStructure.fromEra;
    age = calculateRuinAge(previousStructure.fromEra, currentYear, noise);
  } else {
    // Fallback to culturally and historically accurate ruins
    const culturalKey = typeof culturalZone === 'string' ? culturalZone : culturalZone.toString();
    const eraRuins = ERA_CULTURE_RUINS[culturalKey];
    
    // Select from previous era
    let targetEra = currentEra === HistoricalEra.MODERN_ERA ? HistoricalEra.INDUSTRIAL_ERA :
                    currentEra === HistoricalEra.INDUSTRIAL_ERA ? HistoricalEra.RENAISSANCE_EARLY_MODERN :
                    currentEra === HistoricalEra.RENAISSANCE_EARLY_MODERN ? HistoricalEra.MEDIEVAL :
                    currentEra === HistoricalEra.MEDIEVAL ? HistoricalEra.ANTIQUITY :
                    HistoricalEra.PREHISTORY;
    
    let ruinOptions: string[];
    if (eraRuins && eraRuins[targetEra]) {
      ruinOptions = eraRuins[targetEra];
    } else {
      // Use generic cultural styles as fallback
      const styles = CULTURAL_RUIN_STYLES[culturalKey] || CULTURAL_RUIN_STYLES['EUROPEAN'];
      ruinOptions = styles;
    }
    
    const selectedRuin = ruinOptions[Math.floor(noise.random() * ruinOptions.length)];
    
    // Generate appropriate prefix
    const isStructure = selectedRuin.includes('temple') || selectedRuin.includes('palace') || 
                       selectedRuin.includes('fort') || selectedRuin.includes('pyramid');
    const prefixes = isStructure ? ['Ruined', 'Abandoned', 'Ancient', 'Forgotten'] : ['Old', 'Abandoned'];
    const prefix = prefixes[Math.floor(noise.random() * prefixes.length)];
    
    // Format name properly
    const needsPrefix = !selectedRuin.includes('ancient') && !selectedRuin.includes('abandoned') && 
                       !selectedRuin.includes('old') && !selectedRuin.includes('ruined');
    name = needsPrefix ? `${prefix} ${selectedRuin}` : selectedRuin.charAt(0).toUpperCase() + selectedRuin.slice(1);
    
    originalStructureType = selectedRuin.includes('temple') || selectedRuin.includes('pyramid') ? 'holy_site' :
                           selectedRuin.includes('palace') ? 'palace' :
                           selectedRuin.includes('fort') || selectedRuin.includes('fortress') ? 'fortress' :
                           selectedRuin.includes('market') || selectedRuin.includes('plaza') ? 'marketplace' :
                           selectedRuin.includes('mine') || selectedRuin.includes('quarry') ? 'quarry' :
                           'fortress'; // default
    originalEra = targetEra;
    age = calculateRuinAge(targetEra, currentYear, noise);
  }

  // Select material based on climate with fallback
  const materials = CLIMATE_MATERIALS[climate] || CLIMATE_MATERIALS[ClimateType.TEMPERATE];
  const material = materials ? materials[Math.floor(noise.random() * materials.length)] : 'stone';

  // Select architectural style based on actual structure type and cultural zone
  const culturalKey = typeof culturalZone === 'string' ? culturalZone : culturalZone.toString();
  const styles = CULTURAL_RUIN_STYLES[culturalKey] || CULTURAL_RUIN_STYLES['EUROPEAN'];
  const style = previousStructure ? originalStructureType : styles[Math.floor(noise.random() * styles.length)];

  // Generate description
  const ageDesc = age < 100 ? 'recently abandoned' :
                  age < 300 ? 'centuries-old' :
                  age < 1000 ? 'ancient' :
                  age < 2000 ? 'millennia-old' :
                  'prehistoric';
  
  const weatheringDesc = age < 200 ? 'partially collapsed' :
                        age < 500 ? 'crumbling' :
                        age < 1000 ? 'heavily weathered' :
                        'barely recognizable';

  const description = `A ${ageDesc}, ${weatheringDesc} ${material} structure that was once ${name.toLowerCase()}. ` +
                      `Built approximately ${age} years ago during the ${originalEra.toLowerCase().replace(/_/g, ' ')} era.`;

  return {
    name,
    originalStructureType,
    originalEra,
    age,
    material,
    style,
    description,
  };
}

/**
 * Determine which ruin architectural style to use
 * This maps to the styles used by RuinsSymbolNew.tsx
 */
export function getRuinArchitecturalStyle(
  ruin: EnhancedRuin,
  culturalZone: string,
  era: HistoricalEra
): string {
  // First check for Oceanian-specific ruins
  if (culturalZone === 'OCEANIA' || culturalZone === 'OCEANIAN') {
    // Map Oceanian ruins to appropriate symbols
    const oceanianMapping: Record<string, string> = {
      'sacred cave': 'megalithic',
      'stone circle': 'megalithic',
      'rock shelter': 'ancestral_puebloan', // Native American style fits well
      'ceremonial ground': 'ancestral_puebloan',
      'stone platform': 'megalithic',
      'burial site': 'ancient_mound',
      'fish trap': 'megalithic',
      'carved rock': 'megalithic',
      'meeting ground': 'ancestral_puebloan',
      'canoe house': 'polynesian',
      'sacred tree site': 'megalithic',
      'stone arrangement': 'megalithic',
      'mission station': 'colonial',
      'colonial outpost': 'british_colonial',
      'trading post': 'colonial',
      'whaling station': 'industrial',
      'mining settlement': 'industrial',
      'telegraph station': 'industrial',
      'sheep station': 'industrial',
      'railway camp': 'industrial',
      'abandoned homestead': 'colonial',
      'old woolshed': 'industrial',
      'ghost town': 'industrial',
      'disused quarry': 'industrial',
    };
    
    // Check if the ruin name contains any of these keywords
    const lowerName = ruin.name.toLowerCase();
    for (const [key, style] of Object.entries(oceanianMapping)) {
      if (lowerName.includes(key)) {
        return style;
      }
    }
  }
  
  // Map our generated ruins to the architectural styles used by RuinsSymbolNew
  const styleMapping: Record<string, string> = {
    // European styles
    'tower': era === HistoricalEra.MEDIEVAL ? 'gothic' : 'romanesque',
    'keep': 'gothic',
    'monastery': 'romanesque',
    'castle': 'gothic',
    'cathedral': 'gothic',
    
    // MENA styles
    'minaret': 'islamic',
    'fortress': culturalZone === 'MENA' ? 'ottoman' : 'gothic',
    'caravanserai': 'islamic',
    'madrasa': 'islamic',
    'palace': culturalZone === 'MENA' ? 'ottoman' : 'baroque',
    
    // Asian styles
    'pagoda': era === HistoricalEra.ANTIQUITY ? 'han_dynasty' : 'tang_song',
    'temple': culturalZone === 'EAST_ASIAN' ? 'ancient_chinese' : 
              culturalZone === 'SOUTH_ASIAN' ? 'dravidian' : 'classical',
    'gate': 'ancient_chinese',
    'pavilion': 'tang_song',
    
    // South Asian
    'stupa': 'mauryan',
    'fort': culturalZone === 'SOUTH_ASIAN' ? 'mauryan' : 'gothic',
    'stepwell': 'dravidian',
    'haveli': 'dravidian',
    
    // Mesoamerican
    'pyramid': culturalZone === 'MESOAMERICAN' ? 'maya_classic' : 'ancient_egyptian',
    'ballcourt': 'maya_classic',
    'observatory': 'maya_classic',
    
    // South American
    'terrace': 'inca',
    'shrine': culturalZone === 'SOUTH_AMERICAN' ? 'chavin' : 'classical',
    
    // North American
    'mound': 'mississippian',
    'longhouse': 'ancestral_puebloan',
    'kiva': 'ancestral_puebloan',
    'cliff dwelling': 'ancestral_puebloan',
    'earthwork': 'ancient_mound',
    
    // African
    'enclosure': 'zimbabwe',
    'granary': culturalZone === 'SUB_SAHARAN' ? 'sudanic' : 'classical',
    'citadel': culturalZone === 'SUB_SAHARAN' ? 'swahili' : 'islamic',
    'mosque': culturalZone === 'SUB_SAHARAN' ? 'sudanic' : 'islamic',
    
    // Oceanian - expanded mapping
    'marae': 'polynesian',
    'pa': 'polynesian', 
    'heiau': 'polynesian',
    'village': 'ancestral_puebloan', // Use Native American style for village ruins
    'stone platform': 'megalithic',
    'ceremonial ground': 'ancestral_puebloan',
    'sacred cave': 'megalithic',
    'rock shelter': 'ancestral_puebloan',
    'meeting ground': 'ancestral_puebloan',
    
    // Industrial/Modern
    'factory': 'industrial',
    'mill': 'industrial',
    'warehouse': 'industrial',
  };
  
  // First try to map based on the original structure type
  if (ruin.originalStructureType) {
    const mapped = styleMapping[ruin.originalStructureType];
    if (mapped) return mapped;
  }
  
  // Then try to map based on the style field
  const mappedStyle = styleMapping[ruin.style];
  if (mappedStyle) return mappedStyle;
  
  // Check for specific keywords in the ruin name
  const lowerName = ruin.name.toLowerCase();
  for (const [key, style] of Object.entries(styleMapping)) {
    if (lowerName.includes(key)) {
      return style;
    }
  }
  
  // Fallback based on cultural zone
  const culturalFallbacks: Record<string, string> = {
    'OCEANIA': 'ancestral_puebloan', // Use Native American style as closest match
    'OCEANIAN': 'ancestral_puebloan',
    'NORTH_AMERICAN_PRE_COLUMBIAN': 'ancestral_puebloan',
    'NORTH_AMERICAN_COLONIAL': 'colonial',
    'SOUTH_AMERICAN': 'inca',
    'MESOAMERICAN': 'maya_classic',
    'MENA': 'islamic',
    'SUB_SAHARAN': 'sudanic',
    'SUB_SAHARAN_AFRICAN': 'sudanic',
    'SOUTH_ASIAN': 'dravidian',
    'EAST_ASIAN': 'ancient_chinese',
    'SOUTHEAST_ASIAN': 'ancient_chinese',
    'EUROPEAN': 'gothic',
  };
  
  return culturalFallbacks[culturalZone] || 'classical';
}
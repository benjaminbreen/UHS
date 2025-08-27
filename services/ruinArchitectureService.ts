/**
 * services/ruinArchitectureService.ts
 * Provides culture and era-specific ruin architecture details
 */

import { CulturalZone, HistoricalEra, ClimateType } from '../types';

export interface RuinArchitecture {
  style: string;
  materials: MaterialType[];
  primaryColor: string;
  secondaryColor: string;
  features: string[];
  preservationLevel: number; // 0-1, how intact
  weatheringType: WeatheringType;
}

export type MaterialType = 
  | 'stone' | 'marble' | 'limestone' | 'sandstone' | 'granite'
  | 'adobe' | 'mud_brick' | 'fired_brick'
  | 'wood' | 'bamboo' | 'thatch'
  | 'coral' | 'volcanic_rock'
  | 'concrete' | 'metal';

export type WeatheringType = 
  | 'overgrown' | 'sand_buried' | 'frost_cracked' 
  | 'water_eroded' | 'moss_covered' | 'salt_damaged';

export function getRuinArchitecture(
  culturalZone: CulturalZone,
  era: HistoricalEra,
  climate: ClimateType,
  ruinAge: number
): RuinArchitecture {
  
  // Calculate preservation based on age and climate
  let preservationLevel = 1.0 - (ruinAge / 2000);
  
  // Climate affects preservation
  if (climate === ClimateType.ARID) {
    preservationLevel += 0.2; // Desert preserves better
  } else if (climate === ClimateType.TROPICAL) {
    preservationLevel -= 0.2; // Jungle degrades faster
  } else if (climate === ClimateType.COLD) {
    preservationLevel += 0.1; // Cold preserves moderately
  }
  
  preservationLevel = Math.max(0.1, Math.min(0.9, preservationLevel));
  
  // Determine weathering type by climate
  let weatheringType: WeatheringType = 'moss_covered';
  if (climate === ClimateType.TROPICAL) weatheringType = 'overgrown';
  else if (climate === ClimateType.ARID) weatheringType = 'sand_buried';
  else if (climate === ClimateType.COLD) weatheringType = 'frost_cracked';
  else if (climate === ClimateType.COASTAL) weatheringType = 'salt_damaged';
  
  // Culture and era-specific architecture
  const architectureMap: Record<string, RuinArchitecture> = {
    // EUROPEAN
    'EUROPEAN_PREHISTORY': {
      style: 'megalithic',
      materials: ['stone', 'granite'],
      primaryColor: '#8B7D6B',
      secondaryColor: '#6B5D54',
      features: ['standing_stones', 'cairns', 'dolmens'],
      preservationLevel,
      weatheringType
    },
    'EUROPEAN_ANTIQUITY': {
      style: 'classical',
      materials: ['marble', 'limestone', 'fired_brick'],
      primaryColor: '#D4C5B9',
      secondaryColor: '#8B7355',
      features: ['columns', 'arches', 'mosaics', 'aqueducts'],
      preservationLevel,
      weatheringType
    },
    'EUROPEAN_MEDIEVAL': {
      style: 'gothic',
      materials: ['stone', 'limestone', 'wood'],
      primaryColor: '#9C9C9C',
      secondaryColor: '#6B6B6B',
      features: ['towers', 'battlements', 'arrow_slits', 'portcullis'],
      preservationLevel,
      weatheringType
    },
    'EUROPEAN_RENAISSANCE_EARLY_MODERN': {
      style: 'baroque',
      materials: ['stone', 'marble', 'fired_brick'],
      primaryColor: '#B8A99A',
      secondaryColor: '#8B7D6B',
      features: ['domes', 'balustrades', 'ornate_facades'],
      preservationLevel,
      weatheringType
    },
    'EUROPEAN_INDUSTRIAL_ERA': {
      style: 'industrial',
      materials: ['fired_brick', 'concrete', 'metal'],
      primaryColor: '#8B4513',
      secondaryColor: '#696969',
      features: ['smokestacks', 'iron_beams', 'large_windows'],
      preservationLevel,
      weatheringType
    },
    
    // MENA (Middle East & North Africa)
    'MENA_PREHISTORY': {
      style: 'ancient_near_east',
      materials: ['mud_brick', 'adobe'],
      primaryColor: '#C19A6B',
      secondaryColor: '#8B7355',
      features: ['tells', 'mud_walls'],
      preservationLevel,
      weatheringType
    },
    'MENA_ANTIQUITY': {
      style: 'ancient_egyptian',
      materials: ['sandstone', 'limestone', 'granite'],
      primaryColor: '#DEB887',
      secondaryColor: '#D2691E',
      features: ['pylons', 'obelisks', 'hieroglyphs', 'pyramids'],
      preservationLevel,
      weatheringType
    },
    'MENA_MEDIEVAL': {
      style: 'islamic',
      materials: ['sandstone', 'fired_brick', 'adobe'],
      primaryColor: '#F4A460',
      secondaryColor: '#CD853F',
      features: ['minarets', 'horseshoe_arches', 'courtyards', 'geometric_patterns'],
      preservationLevel,
      weatheringType
    },
    'MENA_RENAISSANCE_EARLY_MODERN': {
      style: 'ottoman',
      materials: ['stone', 'marble', 'fired_brick'],
      primaryColor: '#BC9A6A',
      secondaryColor: '#8B7355',
      features: ['domes', 'pointed_arches', 'tiles', 'fountains'],
      preservationLevel,
      weatheringType
    },
    
    // EAST ASIAN
    'EAST_ASIAN_PREHISTORY': {
      style: 'ancient_chinese',
      materials: ['wood', 'mud_brick', 'thatch'],
      primaryColor: '#8B7355',
      secondaryColor: '#6B5D54',
      features: ['pit_houses', 'earthen_walls'],
      preservationLevel,
      weatheringType
    },
    'EAST_ASIAN_ANTIQUITY': {
      style: 'han_dynasty',
      materials: ['wood', 'fired_brick', 'stone'],
      primaryColor: '#A0522D',
      secondaryColor: '#8B4513',
      features: ['pagoda_base', 'curved_roofs', 'dragon_motifs'],
      preservationLevel,
      weatheringType
    },
    'EAST_ASIAN_MEDIEVAL': {
      style: 'tang_song',
      materials: ['wood', 'stone', 'fired_brick'],
      primaryColor: '#B22222',
      secondaryColor: '#8B4513',
      features: ['pagodas', 'moon_gates', 'gardens', 'bridges'],
      preservationLevel,
      weatheringType
    },
    
    // SOUTH ASIAN
    'SOUTH_ASIAN_ANTIQUITY': {
      style: 'mauryan',
      materials: ['sandstone', 'limestone', 'fired_brick'],
      primaryColor: '#CD853F',
      secondaryColor: '#A0522D',
      features: ['stupas', 'pillars', 'carved_reliefs'],
      preservationLevel,
      weatheringType
    },
    'SOUTH_ASIAN_MEDIEVAL': {
      style: 'dravidian',
      materials: ['granite', 'sandstone'],
      primaryColor: '#8B7D6B',
      secondaryColor: '#6B5D54',
      features: ['gopurams', 'mandapas', 'intricate_carvings'],
      preservationLevel,
      weatheringType
    },
    
    // MESOAMERICAN
    'MESOAMERICAN_PREHISTORY': {
      style: 'olmec',
      materials: ['volcanic_rock', 'adobe'],
      primaryColor: '#696969',
      secondaryColor: '#2F4F4F',
      features: ['colossal_heads', 'platforms'],
      preservationLevel,
      weatheringType
    },
    'MESOAMERICAN_ANTIQUITY': {
      style: 'maya_classic',
      materials: ['limestone', 'stucco'],
      primaryColor: '#F5DEB3',
      secondaryColor: '#DEB887',
      features: ['step_pyramids', 'ball_courts', 'stelae', 'hieroglyphs'],
      preservationLevel,
      weatheringType
    },
    'MESOAMERICAN_MEDIEVAL': {
      style: 'aztec',
      materials: ['volcanic_rock', 'adobe', 'stucco'],
      primaryColor: '#8B4513',
      secondaryColor: '#A0522D',
      features: ['twin_temples', 'skull_racks', 'serpent_heads'],
      preservationLevel,
      weatheringType
    },
    
    // SOUTH AMERICAN
    'SOUTH_AMERICAN_PREHISTORY': {
      style: 'chavin',
      materials: ['stone', 'adobe'],
      primaryColor: '#8B7D6B',
      secondaryColor: '#6B5D54',
      features: ['sunken_plazas', 'carved_stones'],
      preservationLevel,
      weatheringType
    },
    'SOUTH_AMERICAN_ANTIQUITY': {
      style: 'moche',
      materials: ['adobe', 'mud_brick'],
      primaryColor: '#CD853F',
      secondaryColor: '#A0522D',
      features: ['huacas', 'platforms', 'murals'],
      preservationLevel,
      weatheringType
    },
    'SOUTH_AMERICAN_MEDIEVAL': {
      style: 'inca',
      materials: ['granite', 'limestone'],
      primaryColor: '#808080',
      secondaryColor: '#696969',
      features: ['polygonal_masonry', 'terraces', 'trapezoidal_doors'],
      preservationLevel,
      weatheringType
    },
    
    // SUB-SAHARAN AFRICAN
    'SUB_SAHARAN_AFRICAN_MEDIEVAL': {
      style: 'zimbabwe',
      materials: ['granite', 'stone'],
      primaryColor: '#8B7355',
      secondaryColor: '#6B5D54',
      features: ['circular_walls', 'conical_towers', 'chevron_patterns'],
      preservationLevel,
      weatheringType
    },
    'SUB_SAHARAN_AFRICAN_RENAISSANCE_EARLY_MODERN': {
      style: 'swahili',
      materials: ['coral', 'limestone', 'mangrove_wood'],
      primaryColor: '#F5DEB3',
      secondaryColor: '#DEB887',
      features: ['coral_walls', 'carved_doors', 'mosques'],
      preservationLevel,
      weatheringType
    },
    
    // NORTH AMERICAN
    'NORTH_AMERICAN_PREHISTORY': {
      style: 'ancestral_puebloan',
      materials: ['sandstone', 'adobe', 'wood'],
      primaryColor: '#CD853F',
      secondaryColor: '#A0522D',
      features: ['cliff_dwellings', 'kivas', 'petroglyphs'],
      preservationLevel,
      weatheringType
    },
    'NORTH_AMERICAN_ANTIQUITY': {
      style: 'mississippian',
      materials: ['earth', 'wood', 'thatch'],
      primaryColor: '#8B7355',
      secondaryColor: '#6B5D54',
      features: ['platform_mounds', 'palisades', 'plazas'],
      preservationLevel,
      weatheringType
    },
    
    // OCEANIAN
    'OCEANIAN_PREHISTORY': {
      style: 'polynesian',
      materials: ['volcanic_rock', 'coral', 'wood'],
      primaryColor: '#696969',
      secondaryColor: '#2F4F4F',
      features: ['moai', 'marae', 'stone_platforms'],
      preservationLevel,
      weatheringType
    }
  };
  
  const key = `${culturalZone}_${era}`;
  return architectureMap[key] || architectureMap['EUROPEAN_MEDIEVAL']; // Default fallback
}

export function getRuinDescription(architecture: RuinArchitecture, ruinName: string): string {
  const preservation = architecture.preservationLevel > 0.7 ? 'well-preserved' :
                       architecture.preservationLevel > 0.4 ? 'partially collapsed' :
                       'heavily ruined';
  
  const mainFeature = architecture.features[0]?.replace(/_/g, ' ') || 'walls';
  
  return `${preservation} ${architecture.style} ruins with ${mainFeature}`;
}
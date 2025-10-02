/**
 * constants/gameData/farmNaming.ts
 * Culture, era, and crop-specific farm naming conventions
 */

import { CulturalZone, HistoricalEra } from '../../types';

interface FarmNamingConfig {
  pattern: string; // Use {farmer} as placeholder for farmer's name
  suffixOnly?: boolean; // If true, just append suffix to farmer name
}

// Default farm type names by crop (used when specific naming exists)
export const CROP_SPECIFIC_FARM_TYPES: Record<string, string> = {
  grapes: 'Vineyard',
  olives: 'Olive Grove',
  cotton: 'Plantation',
  tobacco: 'Plantation',
  sugar: 'Estate',
  rice: 'Paddy'
};

// Era and culture-specific naming conventions
export const FARM_NAMING: Record<string, Record<string, FarmNamingConfig>> = {
  // European naming
  EUROPEAN: {
    PREHISTORY: { pattern: "{farmer}'s Land" },
    ANTIQUITY: { pattern: "{farmer}'s Villa" },
    MEDIEVAL: { pattern: "{farmer}'s Farm" },
    RENAISSANCE_EARLY_MODERN: { pattern: "{farmer}'s Estate" },
    INDUSTRIAL_ERA: { pattern: "{farmer} Farm" },
    MODERN_ERA: { pattern: "{farmer} Farm" },
    FUTURE_ERA: { pattern: "{farmer} Agricultural Complex" }
  },

  // East Asian naming (family name + field/farm)
  EAST_ASIAN: {
    PREHISTORY: { pattern: "{farmer} Fields" },
    ANTIQUITY: { pattern: "{farmer} Fields" },
    MEDIEVAL: { pattern: "{farmer} Farm" },
    RENAISSANCE_EARLY_MODERN: { pattern: "{farmer} Farm" },
    INDUSTRIAL_ERA: { pattern: "{farmer} Agricultural Cooperative" },
    MODERN_ERA: { pattern: "{farmer} Farm" },
    FUTURE_ERA: { pattern: "{farmer} Agritech Station" }
  },

  // Middle Eastern / North African naming
  MENA: {
    PREHISTORY: { pattern: "{farmer}'s Oasis" },
    ANTIQUITY: { pattern: "{farmer}'s Gardens" },
    MEDIEVAL: { pattern: "{farmer}'s Qanat" },
    RENAISSANCE_EARLY_MODERN: { pattern: "{farmer}'s Estate" },
    INDUSTRIAL_ERA: { pattern: "{farmer} Farm" },
    MODERN_ERA: { pattern: "{farmer} Farm" },
    FUTURE_ERA: { pattern: "{farmer} Desert Station" }
  },

  // North American Pre-Columbian naming
  NORTH_AMERICAN_PRE_COLUMBIAN: {
    PREHISTORY: { pattern: "{farmer}'s Gardens" },
    ANTIQUITY: { pattern: "{farmer}'s Fields" },
    MEDIEVAL: { pattern: "{farmer}'s Three Sisters Garden" },
    RENAISSANCE_EARLY_MODERN: { pattern: "{farmer}'s Fields" },
    INDUSTRIAL_ERA: { pattern: "{farmer} Farm" },
    MODERN_ERA: { pattern: "{farmer} Farm" },
    FUTURE_ERA: { pattern: "{farmer} Farm" }
  },

  // North American Colonial / Post-Colonial
  NORTH_AMERICAN_COLONIAL: {
    PREHISTORY: { pattern: "{farmer}'s Homestead" },
    ANTIQUITY: { pattern: "{farmer}'s Homestead" },
    MEDIEVAL: { pattern: "{farmer}'s Homestead" },
    RENAISSANCE_EARLY_MODERN: { pattern: "{farmer}'s Homestead" },
    INDUSTRIAL_ERA: { pattern: "{farmer} Ranch" },
    MODERN_ERA: { pattern: "{farmer} Farm" },
    FUTURE_ERA: { pattern: "{farmer} Agricultural Station" }
  },

  // Oceanian naming
  OCEANIA: {
    PREHISTORY: { pattern: "{farmer}'s Garden" },
    ANTIQUITY: { pattern: "{farmer}'s Taro Patch" },
    MEDIEVAL: { pattern: "{farmer}'s Plantation" },
    RENAISSANCE_EARLY_MODERN: { pattern: "{farmer}'s Station" },
    INDUSTRIAL_ERA: { pattern: "{farmer} Station" },
    MODERN_ERA: { pattern: "{farmer} Farm" },
    FUTURE_ERA: { pattern: "{farmer} Agricultural Hub" }
  },

  // South Asian naming
  SOUTH_ASIAN: {
    PREHISTORY: { pattern: "{farmer}'s Fields" },
    ANTIQUITY: { pattern: "{farmer}'s Gardens" },
    MEDIEVAL: { pattern: "{farmer}'s Farm" },
    RENAISSANCE_EARLY_MODERN: { pattern: "{farmer}'s Estate" },
    INDUSTRIAL_ERA: { pattern: "{farmer} Farm" },
    MODERN_ERA: { pattern: "{farmer} Farm" },
    FUTURE_ERA: { pattern: "{farmer} Agritech Center" }
  },

  // South American naming
  SOUTH_AMERICAN: {
    PREHISTORY: { pattern: "{farmer}'s Terraces" },
    ANTIQUITY: { pattern: "{farmer}'s Chacra" },
    MEDIEVAL: { pattern: "{farmer}'s Chacra" },
    RENAISSANCE_EARLY_MODERN: { pattern: "Hacienda {farmer}" },
    INDUSTRIAL_ERA: { pattern: "Hacienda {farmer}" },
    MODERN_ERA: { pattern: "Finca {farmer}" },
    FUTURE_ERA: { pattern: "{farmer} Agricultural Complex" }
  },

  // Sub-Saharan African naming
  SUB_SAHARAN_AFRICAN: {
    PREHISTORY: { pattern: "{farmer}'s Gardens" },
    ANTIQUITY: { pattern: "{farmer}'s Farm" },
    MEDIEVAL: { pattern: "{farmer}'s Shamba" },
    RENAISSANCE_EARLY_MODERN: { pattern: "{farmer}'s Farm" },
    INDUSTRIAL_ERA: { pattern: "{farmer} Farm" },
    MODERN_ERA: { pattern: "{farmer} Farm" },
    FUTURE_ERA: { pattern: "{farmer} Agricultural Station" }
  }
};

// Crop-specific overrides for certain cultures/eras
export const CROP_FARM_OVERRIDES: Record<string, Partial<Record<CulturalZone, string>>> = {
  grapes: {
    EUROPEAN: 'Vineyard',
    MENA: 'Vineyard',
    SOUTH_AMERICAN: 'Viñedo'
  },
  olives: {
    EUROPEAN: 'Olive Grove',
    MENA: 'Olive Grove'
  },
  cotton: {
    NORTH_AMERICAN_COLONIAL: 'Cotton Plantation',
    SOUTH_AMERICAN: 'Cotton Plantation',
    SUB_SAHARAN_AFRICAN: 'Cotton Farm'
  },
  tobacco: {
    NORTH_AMERICAN_COLONIAL: 'Tobacco Plantation',
    SOUTH_AMERICAN: 'Tobacco Plantation'
  },
  sugar: {
    NORTH_AMERICAN_COLONIAL: 'Sugar Plantation',
    SOUTH_AMERICAN: 'Sugar Estate',
    SUB_SAHARAN_AFRICAN: 'Sugar Estate'
  },
  rice: {
    EAST_ASIAN: 'Rice Paddy',
    SOUTH_ASIAN: 'Rice Farm'
  },
  tea: {
    EAST_ASIAN: 'Tea Plantation',
    SOUTH_ASIAN: 'Tea Estate'
  },
  coffee: {
    SOUTH_AMERICAN: 'Coffee Fazenda',
    SUB_SAHARAN_AFRICAN: 'Coffee Estate'
  }
};

/**
 * Generate a farm name based on farmer name, culture, era, and primary crop
 */
export function generateFarmName(
  farmerName: string,
  culturalZone: CulturalZone,
  era: HistoricalEra,
  primaryCrop?: string
): string {
  // Check for crop-specific override first
  if (primaryCrop && CROP_FARM_OVERRIDES[primaryCrop]?.[culturalZone]) {
    const cropType = CROP_FARM_OVERRIDES[primaryCrop][culturalZone];
    return `${farmerName}'s ${cropType}`;
  }

  // Get base naming pattern for culture/era
  const namingConfig = FARM_NAMING[culturalZone]?.[era] || FARM_NAMING.EUROPEAN.MEDIEVAL;
  return namingConfig.pattern.replace('{farmer}', farmerName);
}

/**
 * culturalItemMapping.ts
 *
 * Maps generic item categories to culturally-appropriate specific items.
 * Used by work offers and other systems to provide authentic historical context.
 *
 * Created: December 2024 (Phase 1.2 of quest system removal)
 */

import { CulturalZone } from '../../types/characterData';
import { HistoricalEra } from '../../types/enums';

/**
 * Cultural variants for common item categories
 * Maps generic categories (like "grain") to culture-specific items (like "rice" for EAST_ASIAN)
 */
export const CULTURAL_ITEM_VARIANTS: Record<string, Partial<Record<CulturalZone, string>>> = {
  // Staple Grains
  'grain': {
    EUROPEAN: 'wheat',
    EAST_ASIAN: 'rice',
    SOUTH_ASIAN: 'rice',
    MENA: 'barley',
    SUB_SAHARAN_AFRICAN: 'millet',
    NORTH_AMERICAN_PRE_COLUMBIAN: 'maize',
    NORTH_AMERICAN_COLONIAL: 'wheat',
    SOUTH_AMERICAN: 'maize',
    OCEANIA: 'taro'
  },

  // Cooking Oil
  'oil': {
    EUROPEAN: 'olive oil',
    EAST_ASIAN: 'sesame oil',
    SOUTH_ASIAN: 'ghee',
    MENA: 'olive oil',
    SUB_SAHARAN_AFRICAN: 'palm oil',
    NORTH_AMERICAN_PRE_COLUMBIAN: 'sunflower oil',
    NORTH_AMERICAN_COLONIAL: 'lard',
    SOUTH_AMERICAN: 'palm oil',
    OCEANIA: 'coconut oil'
  },

  // Alcoholic Beverage
  'alcohol': {
    EUROPEAN: 'wine',
    EAST_ASIAN: 'rice wine',
    SOUTH_ASIAN: 'toddy',
    MENA: 'date wine',
    SUB_SAHARAN_AFRICAN: 'palm wine',
    NORTH_AMERICAN_PRE_COLUMBIAN: 'pulque',
    NORTH_AMERICAN_COLONIAL: 'rum',
    SOUTH_AMERICAN: 'chicha',
    OCEANIA: 'kava'
  },

  // Textile
  'cloth': {
    EUROPEAN: 'wool cloth',
    EAST_ASIAN: 'silk',
    SOUTH_ASIAN: 'cotton',
    MENA: 'linen',
    SUB_SAHARAN_AFRICAN: 'cotton',
    NORTH_AMERICAN_PRE_COLUMBIAN: 'cotton',
    NORTH_AMERICAN_COLONIAL: 'wool cloth',
    SOUTH_AMERICAN: 'alpaca wool',
    OCEANIA: 'tapa cloth'
  },

  // Sweetener
  'sweetener': {
    EUROPEAN: 'honey',
    EAST_ASIAN: 'honey',
    SOUTH_ASIAN: 'jaggery',
    MENA: 'date syrup',
    SUB_SAHARAN_AFRICAN: 'honey',
    NORTH_AMERICAN_PRE_COLUMBIAN: 'agave nectar',
    NORTH_AMERICAN_COLONIAL: 'molasses',
    SOUTH_AMERICAN: 'honey',
    OCEANIA: 'coconut sugar'
  },

  // Spice
  'spice': {
    EUROPEAN: 'pepper',
    EAST_ASIAN: 'ginger',
    SOUTH_ASIAN: 'cardamom',
    MENA: 'cumin',
    SUB_SAHARAN_AFRICAN: 'grains of paradise',
    NORTH_AMERICAN_PRE_COLUMBIAN: 'chili pepper',
    NORTH_AMERICAN_COLONIAL: 'pepper',
    SOUTH_AMERICAN: 'chili pepper',
    OCEANIA: 'turmeric'
  },

  // Meat
  'meat': {
    EUROPEAN: 'pork',
    EAST_ASIAN: 'pork',
    SOUTH_ASIAN: 'mutton',
    MENA: 'lamb',
    SUB_SAHARAN_AFRICAN: 'goat',
    NORTH_AMERICAN_PRE_COLUMBIAN: 'venison',
    NORTH_AMERICAN_COLONIAL: 'beef',
    SOUTH_AMERICAN: 'llama meat',
    OCEANIA: 'fish'
  },

  // Preserved Fish
  'preserved_fish': {
    EUROPEAN: 'salted herring',
    EAST_ASIAN: 'dried fish',
    SOUTH_ASIAN: 'dried fish',
    MENA: 'salted fish',
    SUB_SAHARAN_AFRICAN: 'smoked fish',
    NORTH_AMERICAN_PRE_COLUMBIAN: 'dried salmon',
    NORTH_AMERICAN_COLONIAL: 'salted cod',
    SOUTH_AMERICAN: 'dried fish',
    OCEANIA: 'dried fish'
  },

  // Building Material
  'building_material': {
    EUROPEAN: 'timber',
    EAST_ASIAN: 'bamboo',
    SOUTH_ASIAN: 'teak wood',
    MENA: 'cedar wood',
    SUB_SAHARAN_AFRICAN: 'mud brick',
    NORTH_AMERICAN_PRE_COLUMBIAN: 'adobe',
    NORTH_AMERICAN_COLONIAL: 'timber',
    SOUTH_AMERICAN: 'stone blocks',
    OCEANIA: 'palm wood'
  },

  // Fuel
  'fuel': {
    EUROPEAN: 'firewood',
    EAST_ASIAN: 'charcoal',
    SOUTH_ASIAN: 'dung cakes',
    MENA: 'charcoal',
    SUB_SAHARAN_AFRICAN: 'charcoal',
    NORTH_AMERICAN_PRE_COLUMBIAN: 'dried wood',
    NORTH_AMERICAN_COLONIAL: 'firewood',
    SOUTH_AMERICAN: 'dried llama dung',
    OCEANIA: 'coconut husks'
  },

  // Rope/Cordage
  'rope': {
    EUROPEAN: 'hemp rope',
    EAST_ASIAN: 'hemp rope',
    SOUTH_ASIAN: 'jute rope',
    MENA: 'flax rope',
    SUB_SAHARAN_AFRICAN: 'sisal rope',
    NORTH_AMERICAN_PRE_COLUMBIAN: 'yucca fiber rope',
    NORTH_AMERICAN_COLONIAL: 'hemp rope',
    SOUTH_AMERICAN: 'agave fiber rope',
    OCEANIA: 'coconut fiber rope'
  },

  // Writing Material
  'writing_material': {
    EUROPEAN: 'parchment',
    EAST_ASIAN: 'paper',
    SOUTH_ASIAN: 'palm leaf',
    MENA: 'papyrus',
    SUB_SAHARAN_AFRICAN: 'papyrus',
    NORTH_AMERICAN_PRE_COLUMBIAN: 'bark paper',
    NORTH_AMERICAN_COLONIAL: 'paper',
    SOUTH_AMERICAN: 'bark paper',
    OCEANIA: 'bark cloth'
  },

  // Tool Handle Material
  'tool_handle': {
    EUROPEAN: 'ash wood',
    EAST_ASIAN: 'bamboo',
    SOUTH_ASIAN: 'teak wood',
    MENA: 'acacia wood',
    SUB_SAHARAN_AFRICAN: 'hardwood',
    NORTH_AMERICAN_PRE_COLUMBIAN: 'hickory wood',
    NORTH_AMERICAN_COLONIAL: 'oak wood',
    SOUTH_AMERICAN: 'hardwood',
    OCEANIA: 'ironwood'
  },

  // Dye
  'dye': {
    EUROPEAN: 'woad',
    EAST_ASIAN: 'indigo',
    SOUTH_ASIAN: 'indigo',
    MENA: 'saffron',
    SUB_SAHARAN_AFRICAN: 'ochre',
    NORTH_AMERICAN_PRE_COLUMBIAN: 'cochineal',
    NORTH_AMERICAN_COLONIAL: 'indigo',
    SOUTH_AMERICAN: 'cochineal',
    OCEANIA: 'turmeric'
  },

  // Medicine/Healing Herb
  'medicine': {
    EUROPEAN: 'willow bark',
    EAST_ASIAN: 'ginseng',
    SOUTH_ASIAN: 'turmeric',
    MENA: 'myrrh',
    SUB_SAHARAN_AFRICAN: 'aloe',
    NORTH_AMERICAN_PRE_COLUMBIAN: 'echinacea',
    NORTH_AMERICAN_COLONIAL: 'willow bark',
    SOUTH_AMERICAN: 'cinchona bark',
    OCEANIA: 'noni fruit'
  },

  // Incense
  'incense': {
    EUROPEAN: 'frankincense',
    EAST_ASIAN: 'sandalwood',
    SOUTH_ASIAN: 'sandalwood',
    MENA: 'frankincense',
    SUB_SAHARAN_AFRICAN: 'myrrh',
    NORTH_AMERICAN_PRE_COLUMBIAN: 'copal',
    NORTH_AMERICAN_COLONIAL: 'frankincense',
    SOUTH_AMERICAN: 'copal',
    OCEANIA: 'sandalwood'
  }
};

/**
 * Era-specific items that didn't exist in earlier periods
 * Maps item categories to the earliest era they're available
 */
export const ERA_GATED_ITEMS: Record<string, { era: HistoricalEra; alternatives: Partial<Record<HistoricalEra, string>> }> = {
  'gunpowder': {
    era: HistoricalEra.MEDIEVAL,
    alternatives: {
      [HistoricalEra.PREHISTORY]: 'fire-starting kit',
      [HistoricalEra.ANTIQUITY]: 'greek fire ingredients'
    }
  },
  'paper': {
    era: HistoricalEra.MEDIEVAL,
    alternatives: {
      [HistoricalEra.PREHISTORY]: 'bark strips',
      [HistoricalEra.ANTIQUITY]: 'papyrus'
    }
  },
  'printed_book': {
    era: HistoricalEra.RENAISSANCE_EARLY_MODERN,
    alternatives: {
      [HistoricalEra.PREHISTORY]: 'oral tradition',
      [HistoricalEra.ANTIQUITY]: 'scroll',
      [HistoricalEra.MEDIEVAL]: 'manuscript'
    }
  },
  'steel': {
    era: HistoricalEra.MEDIEVAL,
    alternatives: {
      [HistoricalEra.PREHISTORY]: 'stone',
      [HistoricalEra.ANTIQUITY]: 'iron'
    }
  },
  'glass': {
    era: HistoricalEra.ANTIQUITY,
    alternatives: {
      [HistoricalEra.PREHISTORY]: 'clay pottery'
    }
  }
};

/**
 * Historical context for certain culturally-significant items
 * Provides educational flavor text
 */
export const ITEM_HISTORICAL_CONTEXT: Record<string, string> = {
  'silk': 'Prized throughout Eurasia, silk was so valuable it gave its name to trade routes spanning continents.',
  'spices': 'The spice trade drove exploration and shaped empires, making fortunes for those who controlled the routes.',
  'tea': 'Originally medicinal in China, tea became a cultural cornerstone and major trade commodity.',
  'coffee': 'Originating in Ethiopia, coffee transformed from monastery stimulant to global cultural phenomenon.',
  'sugar': 'Once a luxury medicine, sugar became a driver of plantation economies and transatlantic trade.',
  'salt': 'Essential for food preservation, salt was so valuable that Roman soldiers were partly paid in it (salarium).',
  'indigo': 'This deep blue dye was a major cash crop, particularly valuable before synthetic dyes.',
  'cochineal': 'Tiny insects producing vibrant red dye, worth their weight in gold in pre-industrial Europe.',
  'porcelain': 'Chinese porcelain was so prized in Europe it was called "white gold" until manufacturing secrets were discovered.',
  'tobacco': 'Native American crop that became a major colonial cash crop and cultural force.',
  'cotton': 'Transformed from luxury fiber to mass commodity during the Industrial Revolution.',
  'opium': 'Medicinal pain reliever that became the center of devastating trade wars in 19th century Asia.'
};

/**
 * Get culturally-appropriate item name for a given generic category
 * @param genericItem - Generic item category (e.g., 'grain', 'cloth')
 * @param culturalZone - The cultural zone
 * @param era - Optional historical era for era-gating
 * @returns Culturally-specific item name, or the generic name if no mapping exists
 */
export function getCulturalItem(
  genericItem: string,
  culturalZone: CulturalZone,
  era?: HistoricalEra
): string {
  // Normalize the generic item name
  const normalized = genericItem.toLowerCase().replace(/\s+/g, '_');

  // Check if this item is era-gated
  if (era && ERA_GATED_ITEMS[normalized]) {
    const gating = ERA_GATED_ITEMS[normalized];
    const eraOrder = [
      HistoricalEra.PREHISTORY,
      HistoricalEra.ANTIQUITY,
      HistoricalEra.MEDIEVAL,
      HistoricalEra.RENAISSANCE_EARLY_MODERN,
      HistoricalEra.INDUSTRIAL_ERA,
      HistoricalEra.MODERN_ERA
    ];

    const currentEraIndex = eraOrder.indexOf(era);
    const requiredEraIndex = eraOrder.indexOf(gating.era);

    // If current era is before the required era, use alternative
    if (currentEraIndex < requiredEraIndex && gating.alternatives[era]) {
      return gating.alternatives[era]!;
    }
  }

  // Get cultural variant
  const variants = CULTURAL_ITEM_VARIANTS[normalized];
  if (variants && variants[culturalZone]) {
    return variants[culturalZone]!;
  }

  // Return original if no mapping exists
  return genericItem;
}

/**
 * Get historical context for an item if available
 * @param itemName - Item name (generic or specific)
 * @returns Historical context string, or undefined if none exists
 */
export function getItemHistoricalContext(itemName: string): string | undefined {
  const normalized = itemName.toLowerCase().replace(/\s+/g, '_');
  return ITEM_HISTORICAL_CONTEXT[normalized];
}

/**
 * Check if an item exists in a given era
 * @param itemName - Item name to check
 * @param era - Historical era
 * @returns True if the item exists in this era
 */
export function isItemAvailableInEra(itemName: string, era: HistoricalEra): boolean {
  const normalized = itemName.toLowerCase().replace(/\s+/g, '_');

  if (!ERA_GATED_ITEMS[normalized]) {
    return true; // Not era-gated, available in all eras
  }

  const gating = ERA_GATED_ITEMS[normalized];
  const eraOrder = [
    HistoricalEra.PREHISTORY,
    HistoricalEra.ANTIQUITY,
    HistoricalEra.MEDIEVAL,
    HistoricalEra.RENAISSANCE_EARLY_MODERN,
    HistoricalEra.INDUSTRIAL_ERA,
    HistoricalEra.MODERN_ERA
  ];

  const currentEraIndex = eraOrder.indexOf(era);
  const requiredEraIndex = eraOrder.indexOf(gating.era);

  return currentEraIndex >= requiredEraIndex;
}

/**
 * Get all available items in a category for a given culture and era
 * Useful for generating contextual work offers or trade goods
 * @param category - Item category (e.g., 'grain', 'cloth')
 * @param culturalZone - The cultural zone
 * @param era - Historical era
 * @returns Array of available item names
 */
export function getAvailableItemsInCategory(
  category: string,
  culturalZone: CulturalZone,
  era: HistoricalEra
): string[] {
  const items: string[] = [];

  // Get the culturally-appropriate main item
  const culturalItem = getCulturalItem(category, culturalZone, era);
  items.push(culturalItem);

  // Could add related items here in the future
  // For now, just return the single culturally-appropriate item

  return items;
}

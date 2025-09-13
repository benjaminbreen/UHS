/**
 * services/specialMapContainerService.ts
 * Generates culturally and historically appropriate contents for containers in special maps
 */

import { Item, HistoricalEra, CulturalZone } from '../types';
import { SpecialMapArchetype } from '../types/specialMapTypes';
import { OverlayObjectType } from '../types/core/tile';
import { createItemInstance } from '../utils/inventoryUtils';
import { lootService } from './lootService';

export interface ContainerContents {
  items: Item[];
  isCollectible: boolean;
  ownerNpc?: string; // Which NPC "owns" this container
  isValuable: boolean; // Triggers theft awareness if true
}

// Map archetypes to their typical valuable items
const ARCHETYPE_VALUABLE_ITEMS: Partial<Record<SpecialMapArchetype, string[]>> = {
  [SpecialMapArchetype.PALACE_COMPLEX]: ['GOLDEN_GOBLET', 'SILK_TAPESTRY', 'JEWELED_DAGGER', 'ROYAL_SEAL', 'GEMSTONE', 'PEARL_NECKLACE'],
  [SpecialMapArchetype.ESTATES]: ['SILVER_CANDLESTICK', 'GOLD_RING', 'SILK_BOLT', 'RARE_PERFUME', 'VELVET_CUSHION'],
  [SpecialMapArchetype.COURT_CHAMBER]: ['LEGAL_CODEX', 'OFFICIAL_STAMP', 'TREATY_DOCUMENT', 'COURT_LEDGER', 'TAX_RECORDS'],
  [SpecialMapArchetype.TRIBAL_COUNCIL]: ['FEATHER_HEADDRESS', 'OBSIDIAN_BLADE', 'CEREMONIAL_MASK', 'RITUAL_BELL'],
  [SpecialMapArchetype.GOVERNMENT_FORUM]: ['CENSUS_SCROLL', 'TAX_RECORDS', 'OFFICIAL_STAMP', 'COURT_SUMMONS'],
  [SpecialMapArchetype.TOWN_HALL]: ['MERCHANT_LEDGER', 'TRADE_PERMIT', 'TAX_RECORDS', 'CENSUS_SCROLL'],
  [SpecialMapArchetype.SACRED_COMPLEX]: ['SACRED_RELIC', 'PRAYER_SCROLL', 'HOLY_WATER', 'INCENSE_BURNER', 'OFFERING_PLATE'],
  [SpecialMapArchetype.MARKET_BAZAAR]: ['GOLD_COIN_POUCH', 'EXOTIC_SPICES', 'SILK_BOLT', 'RARE_PERFUME', 'MERCHANT_LEDGER'],
  [SpecialMapArchetype.MILITARY_FORTRESS]: ['IRON_SWORD', 'LEATHER_ARMOR', 'ARROWS', 'SHIELD'],
  [SpecialMapArchetype.UNIVERSITY]: ['ANCIENT_SCROLL', 'LEGAL_CODEX', 'QUILL_PEN', 'INK_POT', 'PARCHMENT'],
  [SpecialMapArchetype.UNIVERSITY_MONASTERY]: ['PRAYER_SCROLL', 'HOLY_WATER', 'QUILL_PEN', 'INK_POT', 'PARCHMENT'],
  [SpecialMapArchetype.THEATER]: ['CEREMONIAL_MASK', 'SILK_BOLT', 'VELVET_CUSHION', 'RARE_PERFUME'],
  [SpecialMapArchetype.ARENA]: ['LEATHER_ARMOR', 'IRON_SWORD', 'SHIELD', 'BANDAGES'],
  [SpecialMapArchetype.ARENA_THEATER]: ['CEREMONIAL_MASK', 'VELVET_CUSHION', 'SILK_BOLT'],
  [SpecialMapArchetype.RESTAURANT_INN]: ['ALE', 'BREAD', 'CHEESE', 'MEAT', 'COIN'],
  [SpecialMapArchetype.MARKET_EXHIBITION]: ['EXOTIC_SPICES', 'SILK_BOLT', 'RARE_PERFUME', 'MERCHANT_LEDGER'],
  [SpecialMapArchetype.OPEN_FIELD]: ['SEEDS', 'VEGETABLES', 'GRAIN'],
  [SpecialMapArchetype.CAMPGROUND]: ['ROPE', 'WOOD', 'MEAT', 'WATER'],
  [SpecialMapArchetype.VESSEL]: ['ROPE', 'FISH_MEAT', 'SALT', 'BARREL'],
  [SpecialMapArchetype.PLAYER_HOME]: ['BREAD', 'CANDLE', 'CLOTH', 'COIN'],
  [SpecialMapArchetype.ASSEMBLY_HALL]: ['COURT_LEDGER', 'OFFICIAL_STAMP', 'CENSUS_SCROLL'],
  [SpecialMapArchetype.ADMINISTRATIVE_COMPLEX]: ['TAX_RECORDS', 'OFFICIAL_STAMP', 'TRADE_PERMIT', 'CENSUS_SCROLL'],
  [SpecialMapArchetype.GOVERNMENT]: ['TAX_RECORDS', 'OFFICIAL_STAMP', 'COURT_LEDGER', 'CENSUS_SCROLL'],
  [SpecialMapArchetype.EXHIBITION]: ['JADE_FIGURINE', 'SILK_TAPESTRY', 'CALLIGRAPHY_SET', 'RARE_PERFUME'],
};

// Common items that might appear in any container
const COMMON_ITEMS: string[] = [
  'CANDLE', 'WAX_SEAL', 'QUILL_PEN', 'INK_POT', 'PARCHMENT', 'COIN', 
  'BREAD_CRUST', 'APPLE_CORE', 'DISCARDED_CLOTH', 'BUTTON', 'THREAD'
];

// Cultural specific valuable items
const CULTURAL_VALUABLES: Record<CulturalZone, string[]> = {
  'EUROPEAN': ['SILVER_CROSS', 'GOLD_RING', 'PEARL_NECKLACE', 'SILVER_CANDLESTICK'],
  'MENA': ['CALLIGRAPHY_SET', 'PAPYRUS_SCROLL', 'EXOTIC_SPICES', 'INCENSE_BURNER'],
  'EAST_ASIAN': ['JADE_FIGURINE', 'CALLIGRAPHY_SET', 'SILK_BOLT', 'TEA'],
  'SOUTH_ASIAN': ['IVORY_TUSK', 'EXOTIC_SPICES', 'SILK_BOLT', 'INCENSE_BURNER'],
  'SUB_SAHARAN_AFRICAN': ['IVORY_TUSK', 'GOLD_DUST', 'CEREMONIAL_MASK', 'DRUM'],
  'NORTH_AMERICAN_PRE_COLUMBIAN': ['FEATHER_HEADDRESS', 'OBSIDIAN_BLADE', 'TURQUOISE', 'BONE_NECKLACE'],
  'SOUTH_AMERICAN': ['OBSIDIAN_BLADE', 'FEATHER_HEADDRESS', 'COCOA_BEANS', 'GOLD_DUST'],
  'OCEANIA': ['SHELL_NECKLACE', 'WHALE_TOOTH_NECKLACE', 'TARO_ROOT', 'COCONUT'],
};

// Container type to typical contents mapping
const CONTAINER_TYPE_CONTENTS: Record<string, { valuable: string[], common: string[] }> = {
  'CHEST': {
    valuable: ['GOLDEN_GOBLET', 'JEWELED_DAGGER', 'SILK_TAPESTRY', 'GEMSTONE'],
    common: ['CLOTH', 'CANDLE', 'ROPE', 'BUTTON']
  },
  'BARREL': {
    valuable: ['EXOTIC_SPICES', 'RARE_PERFUME', 'WINE'],
    common: ['GRAIN', 'FLOUR', 'SALT', 'WATER']
  },
  'CRATE': {
    valuable: ['SILK_BOLT', 'TRADE_GOODS', 'TOOLS'],
    common: ['NAILS', 'ROPE', 'CLOTH', 'WOOD']
  },
  'URN': {
    valuable: ['INCENSE_BURNER', 'HOLY_WATER', 'SACRED_RELIC'],
    common: ['ASH', 'DRIED_FLOWERS', 'DUST']
  },
  'CABINET': {
    valuable: ['LEGAL_CODEX', 'OFFICIAL_STAMP', 'TREATY_DOCUMENT'],
    common: ['PAPER', 'INK_POT', 'QUILL_PEN', 'WAX_SEAL']
  },
  'BOOKSHELF': {
    valuable: ['ANCIENT_SCROLL', 'LEGAL_CODEX', 'PRAYER_SCROLL'],
    common: ['PAPER', 'PARCHMENT', 'QUILL_PEN']
  }
};

/**
 * Determines if an item is considered valuable (triggers theft awareness)
 */
function isItemValuable(item: Item): boolean {
  return item.value > 50 || item.rarity === 'Rare' || item.rarity === 'Ultra-rare';
}

/**
 * Generate container contents based on special map context
 */
export function generateSpecialMapContainerContents(
  archetype: SpecialMapArchetype,
  containerType: OverlayObjectType | string,
  culturalZone: CulturalZone,
  era: HistoricalEra,
  roomType?: string,
  roomPrivacy?: 'public' | 'private' | 'restricted'
): ContainerContents {
  const items: Item[] = [];
  let isCollectible = true;
  let ownerNpc: string | undefined;
  
  // Determine container type string
  const containerTypeStr = typeof containerType === 'string' ? 
    containerType : 
    OverlayObjectType[containerType];
  
  // Get base items for this archetype
  const archetypeItems = ARCHETYPE_VALUABLE_ITEMS[archetype] || [];
  const culturalItems = CULTURAL_VALUABLES[culturalZone] || [];
  const containerItems = CONTAINER_TYPE_CONTENTS[containerTypeStr] || { valuable: [], common: [] };
  
  // Determine number of items based on container type and room privacy
  let numItems = 1;
  let valueMultiplier = 1;
  
  if (roomPrivacy === 'restricted') {
    numItems = 2 + Math.floor(Math.random() * 3); // 2-4 items
    valueMultiplier = 2;
  } else if (roomPrivacy === 'private') {
    numItems = 1 + Math.floor(Math.random() * 3); // 1-3 items
    valueMultiplier = 1.5;
  } else {
    numItems = Math.floor(Math.random() * 2) + 1; // 1-2 items
    valueMultiplier = 1;
  }
  
  // Special cases for specific room types
  if (roomType === 'throne_room' || roomType === 'treasury') {
    numItems += 2;
    valueMultiplier *= 2;
  } else if (roomType === 'servants_quarters' || roomType === 'storage') {
    numItems = 1;
    valueMultiplier = 0.5;
  }
  
  // Generate items
  for (let i = 0; i < numItems; i++) {
    let itemId: string | null = null;
    
    // 40% chance of archetype-specific item
    if (Math.random() < 0.4 && archetypeItems.length > 0) {
      itemId = archetypeItems[Math.floor(Math.random() * archetypeItems.length)];
    }
    // 30% chance of cultural item
    else if (Math.random() < 0.3 && culturalItems.length > 0) {
      itemId = culturalItems[Math.floor(Math.random() * culturalItems.length)];
    }
    // 20% chance of container-specific valuable
    else if (Math.random() < 0.2 && containerItems.valuable.length > 0) {
      itemId = containerItems.valuable[Math.floor(Math.random() * containerItems.valuable.length)];
    }
    // Otherwise common item
    else {
      const commonPool = [...COMMON_ITEMS, ...containerItems.common];
      itemId = commonPool[Math.floor(Math.random() * commonPool.length)];
    }
    
    if (itemId) {
      const item = createItemInstance(itemId);
      if (item) {
        // Apply value multiplier
        if (valueMultiplier !== 1) {
          item.value = Math.floor(item.value * valueMultiplier);
        }
        items.push(item);
      }
    }
  }
  
  // If no items were generated, add at least one common item
  if (items.length === 0) {
    const fallbackItem = createItemInstance(COMMON_ITEMS[Math.floor(Math.random() * COMMON_ITEMS.length)]);
    if (fallbackItem) {
      items.push(fallbackItem);
    }
  }
  
  // Determine if container has an owner (for theft detection)
  if (roomPrivacy === 'private' || roomPrivacy === 'restricted') {
    // Private rooms have owners
    ownerNpc = 'room_owner'; // This would be replaced with actual NPC ID
  }
  
  // Check if any items are valuable
  const hasValuableItems = items.some(item => isItemValuable(item));
  
  return {
    items,
    isCollectible,
    ownerNpc,
    isValuable: hasValuableItems
  };
}

/**
 * Generate items scattered on floor tiles (not in containers)
 */
export function generateFloorItems(
  archetype: SpecialMapArchetype,
  culturalZone: CulturalZone,
  era: HistoricalEra,
  roomType?: string
): Item | null {
  // Only certain room types have floor items
  const floorItemRooms = ['marketplace', 'workshop', 'kitchen', 'storage', 'tavern', 'warehouse'];
  
  if (!roomType || !floorItemRooms.includes(roomType)) {
    // Low chance of random dropped item
    if (Math.random() > 0.95) {
      // 5% chance of dropped common item
      const droppedItems = ['COIN', 'BUTTON', 'THREAD', 'BENT_NAIL', 'APPLE_CORE'];
      const itemId = droppedItems[Math.floor(Math.random() * droppedItems.length)];
      return createItemInstance(itemId);
    }
    return null;
  }
  
  // Room-specific floor items
  const roomFloorItems: Record<string, string[]> = {
    'marketplace': ['COIN', 'APPLE_CORE', 'DISCARDED_CLOTH', 'BUTTON'],
    'workshop': ['BENT_NAIL', 'WOOD_SHAVINGS', 'IRON_FILINGS', 'BROKEN_TOOL'],
    'kitchen': ['BREAD_CRUST', 'APPLE_CORE', 'SPILLED_FLOUR', 'BROKEN_POTTERY'],
    'storage': ['DUST', 'COBWEB', 'RAT_DROPPINGS', 'TORN_SACK'],
    'tavern': ['SPILLED_ALE', 'BREAD_CRUST', 'COIN', 'BROKEN_MUG'],
    'warehouse': ['ROPE', 'NAILS', 'WOOD_PLANK', 'TORN_SACK']
  };
  
  const possibleItems = roomFloorItems[roomType] || ['COIN'];
  const itemId = possibleItems[Math.floor(Math.random() * possibleItems.length)];
  
  return createItemInstance(itemId);
}

/**
 * Check if collecting an item should trigger NPC awareness
 */
export function shouldTriggerTheftAwareness(
  item: Item,
  containerOwner?: string,
  roomPrivacy?: 'public' | 'private' | 'restricted'
): boolean {
  // Taking valuable items from private/restricted areas is always theft
  if (isItemValuable(item) && (roomPrivacy === 'private' || roomPrivacy === 'restricted')) {
    return true;
  }
  
  // Taking any item from an owned container is theft
  if (containerOwner) {
    return true;
  }
  
  // Taking very valuable items is always noticed
  if (item.value > 100 || item.rarity === 'Rare' || item.rarity === 'Ultra-rare') {
    return true;
  }
  
  return false;
}

/**
 * Generate contextual loot using the existing loot service
 */
export function generateSpecialMapLoot(
  archetype: SpecialMapArchetype,
  culturalZone: CulturalZone,
  era: HistoricalEra,
  difficulty: 'easy' | 'medium' | 'hard' | 'legendary' = 'medium'
): Item[] {
  // Map archetypes to loot contexts
  const archetypeToContext: Partial<Record<SpecialMapArchetype, 'ruins' | 'combat' | 'trade' | 'holy_site' | 'random'>> = {
    [SpecialMapArchetype.PALACE_COMPLEX]: 'trade',
    [SpecialMapArchetype.ESTATES]: 'trade',
    [SpecialMapArchetype.SACRED_COMPLEX]: 'holy_site',
    [SpecialMapArchetype.UNIVERSITY_MONASTERY]: 'holy_site',
    [SpecialMapArchetype.MILITARY_FORTRESS]: 'combat',
    [SpecialMapArchetype.MARKET_BAZAAR]: 'trade',
    [SpecialMapArchetype.MARKET_EXHIBITION]: 'trade',
    [SpecialMapArchetype.UNIVERSITY]: 'ruins',
    [SpecialMapArchetype.COURT_CHAMBER]: 'trade',
    [SpecialMapArchetype.TRIBAL_COUNCIL]: 'ruins',
    [SpecialMapArchetype.GOVERNMENT_FORUM]: 'trade',
    [SpecialMapArchetype.GOVERNMENT]: 'trade',
    [SpecialMapArchetype.RESTAURANT_INN]: 'random',
    [SpecialMapArchetype.OPEN_FIELD]: 'random',
    [SpecialMapArchetype.CAMPGROUND]: 'random',
    [SpecialMapArchetype.VESSEL]: 'trade',
    [SpecialMapArchetype.PLAYER_HOME]: 'random',
    [SpecialMapArchetype.THEATER]: 'trade',
    [SpecialMapArchetype.ARENA]: 'combat',
    [SpecialMapArchetype.ARENA_THEATER]: 'trade',
    [SpecialMapArchetype.TOWN_HALL]: 'trade',
    [SpecialMapArchetype.ASSEMBLY_HALL]: 'trade',
    [SpecialMapArchetype.ADMINISTRATIVE_COMPLEX]: 'trade',
    [SpecialMapArchetype.EXHIBITION]: 'trade',
  };
  
  const context = archetypeToContext[archetype] || 'random';
  const loot = lootService.generateTreasure(difficulty, context, culturalZone as any, era);
  
  return loot.items.map(({ item }) => item);
}
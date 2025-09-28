/**
 * Historical availability data for items based on era
 * This replaces hardcoded checks scattered throughout the codebase
 */
import { HistoricalEra, CulturalZone } from '../../types';

/**
 * Items available in each historical era
 * Used to ensure historical accuracy in item generation
 */
export const HISTORICAL_ITEM_AVAILABILITY: Record<HistoricalEra, Set<string>> = {
  'PREHISTORY': new Set([
    // Tools & Weapons
    'STICK', 'STONE_KNIFE', 'CLUB', 'ATLATL', 'FIRE_HARDENED_SPEAR',
    'THROWING_STICK', 'FLINT_STONE', 'BONE_KNIFE',
    // Armor & Clothing
    'HIDE_ARMOR', 'FUR_CLOAK', 'HIDE_TUNIC', 'PELT_CLOAK',
    // Accessories
    'BONE_NECKLACE', 'SHELL_NECKLACE', 'ROPE_NECKLACE',
    // Materials
    'HIDE', 'PELT', 'BONE', 'STONE_BLOCK', 'FLINT_STONE'
  ]),

  'ANTIQUITY': new Set([
    // Tools & Weapons
    'BRONZE_SWORD', 'GLADIUS', 'JAVELIN', 'PILUM', 'SLING', 'BRONZE_SPEAR',
    'WALKING_STAFF', 'SHEPHERDS_CROOK', 'CUDGEL',
    // Armor & Clothing
    'BRONZE_ARMOR', 'SCALE_ARMOR', 'TOGA', 'CHITON', 'STOLA', 'PEPLOS',
    'ROMAN_CLOAK', 'GREEK_CLOAK',
    // Accessories
    'BULLA', 'TORC_NECKLACE', 'SCARAB_PENDANT', 'ANKH_PENDANT', 'AMBER_PENDANT',
    'CORAL_BEADS', 'EVIL_EYE_AMULET',
    // Materials
    'BRONZE_INGOT', 'COPPER_INGOT', 'TIN_INGOT', 'CLAY_LUMP', 'PAPYRUS'
  ]),

  'MEDIEVAL': new Set([
    // Tools & Weapons
    'SWORD', 'MACE', 'HALBERD', 'CROSSBOW', 'LONGBOW', 'QUARTERSTAFF',
    'MORNING_STAR', 'WAR_HAMMER', 'BATTLE_AXE',
    // Armor & Clothing
    'MAIL_SHIRT', 'PADDED_ARMOR', 'STUDDED_LEATHER', 'KNIGHT_SURCOAT',
    'TUNIC', 'KIRTLE', 'SURCOAT', 'HOUPPELANDE', 'DOUBLET',
    // Accessories
    'WOODEN_CROSS', 'PRAYER_BEADS', 'SAINTS_MEDAL', 'PILGRIM_BADGE',
    'HAMSA_PENDANT', 'JADE_PENDANT',
    // Materials
    'IRON_INGOT', 'STEEL_INGOT', 'PARCHMENT', 'VELLUM', 'WOOL', 'LINEN'
  ]),

  'RENAISSANCE_EARLY_MODERN': new Set([
    // Tools & Weapons
    'RAPIER', 'WHEELLOCK_PISTOL', 'MUSKET', 'WALKING_CANE', 'SABRE',
    'ESTOC', 'PARTISAN',
    // Armor & Clothing
    'PLATE_ARMOR', 'HALF_PLATE', 'BUFF_COAT', 'OFFICER_CAPE',
    'BREECHES', 'FROCK_COAT', 'WAISTCOAT',
    // Accessories
    'SILVER_CROSS', 'RELIQUARY_PENDANT', 'POMANDER', 'PEARL_NECKLACE',
    'POCKET_WATCH_CHAIN',
    // Materials
    'GUNPOWDER', 'SILK', 'VELVET', 'DAMASK', 'SATIN', 'GLASS', 'PAPER'
  ]),

  'INDUSTRIAL_ERA': new Set([
    // Tools & Weapons
    'RIFLE', 'PISTOL', 'POLICE_BATON', 'NIGHTSTICK', 'FACTORY_TOOLS',
    // Armor & Clothing
    'LEATHER_VEST', 'WORKER_OVERALLS', 'SUIT', 'TOP_HAT', 'BOWLER_HAT',
    // Accessories
    'PHOTO_LOCKET', 'MOURNING_JEWELRY', 'MEDICAL_PENDANT', 'TIE_PIN',
    // Materials
    'COAL', 'STEEL_INGOT', 'RUBBER', 'COTTON', 'PROCESSED_LEATHER'
  ]),

  'MODERN_ERA': new Set([
    // Tools & Weapons
    'TASER', 'MULTITOOL', 'FLASHLIGHT', 'SMARTPHONE',
    // Armor & Clothing
    'KEVLAR_VEST', 'JEANS', 'T_SHIRT', 'SNEAKERS', 'BASEBALL_CAP',
    // Accessories
    'DOG_TAGS', 'MEDICAL_ALERT_PENDANT', 'WRISTWATCH', 'SUNGLASSES',
    // Materials
    'PLASTIC', 'ALUMINUM', 'TITANIUM', 'SYNTHETIC_FIBER', 'ELECTRONICS'
  ]),

  'FUTURE_ERA': new Set([
    // Tools & Weapons
    'PLASMA_CUTTER', 'NEURAL_INTERFACE', 'HOLOGRAPHIC_PROJECTOR',
    // Armor & Clothing
    'NANOFIBER_SUIT', 'SMART_FABRIC', 'ENERGY_SHIELD',
    // Accessories
    'AUGMENTED_REALITY_VISOR', 'QUANTUM_PENDANT', 'BIOMETRIC_SCANNER',
    // Materials
    'GRAPHENE', 'QUANTUM_CRYSTAL', 'METAMATERIAL', 'CARBON_NANOTUBE'
  ])
};

/**
 * Cultural-specific items (items that only appear in certain cultures)
 */
export const CULTURAL_EXCLUSIVE_ITEMS: Record<CulturalZone, Set<string>> = {
  'EUROPEAN': new Set(['TORC_NECKLACE', 'PILGRIM_BADGE', 'SAINTS_MEDAL', 'RELIQUARY_PENDANT']),
  'EAST_ASIAN': new Set(['KATANA', 'JADE_PENDANT', 'HANFU', 'QIPAO', 'KIMONO']),
  'MENA': new Set(['SCIMITAR', 'HAMSA_PENDANT', 'EVIL_EYE_AMULET', 'KAFTAN', 'TURBAN']),
  'NORTH_AMERICAN_PRE_COLUMBIAN': new Set(['ATLATL', 'DREAMCATCHER', 'WAMPUM', 'TEEPEE_HIDE']),
  'NORTH_AMERICAN_COLONIAL': new Set(['TRICORN_HAT', 'COLONIAL_MUSKET', 'LIBERTY_CAP']),
  'OCEANIA': new Set(['WHALE_TOOTH_NECKLACE', 'TAPA_CLOTH', 'BOOMERANG', 'DIDGERIDOO']),
  'SOUTH_ASIAN': new Set(['KUKRI', 'BINDI', 'SARI', 'DHOTI', 'NOSE_RING']),
  'SOUTH_AMERICAN': new Set(['MACUAHUITL', 'QUIPU', 'PONCHO', 'ALPACA_WOOL']),
  'SUB_SAHARAN_AFRICAN': new Set(['ASSEGAI', 'DASHIKI', 'KENTE_CLOTH', 'COWRIE_SHELLS'])
};

/**
 * Check if an item is available in a given era
 */
export function isItemAvailableInEra(itemId: string, era: HistoricalEra): boolean {
  return HISTORICAL_ITEM_AVAILABILITY[era]?.has(itemId) ?? false;
}

/**
 * Check if an item is culturally appropriate
 */
export function isItemCulturallyAppropriate(itemId: string, culture: CulturalZone): boolean {
  // Check if item is culture-exclusive
  for (const [cult, items] of Object.entries(CULTURAL_EXCLUSIVE_ITEMS)) {
    if (items.has(itemId) && cult !== culture) {
      return false; // Item is exclusive to another culture
    }
  }
  return true;
}

/**
 * Filter items by era and culture
 */
export function filterItemsByEraAndCulture(
  items: string[],
  era: HistoricalEra,
  culture?: CulturalZone
): string[] {
  return items.filter(itemId => {
    if (!isItemAvailableInEra(itemId, era)) return false;
    if (culture && !isItemCulturallyAppropriate(itemId, culture)) return false;
    return true;
  });
}

/**
 * Era-based technology substitutions
 * Maps unavailable items to era-appropriate alternatives
 */
export const ERA_SUBSTITUTIONS: Record<string, Record<HistoricalEra, string>> = {
  'SWORD': {
    'PREHISTORY': 'CLUB',
    'ANTIQUITY': 'BRONZE_SWORD',
    'MEDIEVAL': 'SWORD',
    'RENAISSANCE_EARLY_MODERN': 'RAPIER',
    'INDUSTRIAL_ERA': 'SABRE',
    'MODERN_ERA': 'CEREMONIAL_SWORD',
    'FUTURE_ERA': 'PLASMA_BLADE'
  },
  'ARMOR': {
    'PREHISTORY': 'HIDE_ARMOR',
    'ANTIQUITY': 'BRONZE_ARMOR',
    'MEDIEVAL': 'MAIL_SHIRT',
    'RENAISSANCE_EARLY_MODERN': 'PLATE_ARMOR',
    'INDUSTRIAL_ERA': 'LEATHER_VEST',
    'MODERN_ERA': 'KEVLAR_VEST',
    'FUTURE_ERA': 'ENERGY_SHIELD'
  },
  'RANGED_WEAPON': {
    'PREHISTORY': 'ATLATL',
    'ANTIQUITY': 'SLING',
    'MEDIEVAL': 'CROSSBOW',
    'RENAISSANCE_EARLY_MODERN': 'MUSKET',
    'INDUSTRIAL_ERA': 'RIFLE',
    'MODERN_ERA': 'ASSAULT_RIFLE',
    'FUTURE_ERA': 'PLASMA_RIFLE'
  }
};

/**
 * Get appropriate substitute for an item in a given era
 */
export function getEraAppropriateSubstitute(
  itemId: string,
  itemCategory: string,
  era: HistoricalEra
): string {
  // Check if item is already available in this era
  if (isItemAvailableInEra(itemId, era)) {
    return itemId;
  }

  // Check for specific substitution
  if (ERA_SUBSTITUTIONS[itemId]?.[era]) {
    return ERA_SUBSTITUTIONS[itemId][era];
  }

  // Check for category-based substitution
  if (ERA_SUBSTITUTIONS[itemCategory]?.[era]) {
    return ERA_SUBSTITUTIONS[itemCategory][era];
  }

  // Default to a basic item for the category
  const defaultItems: Record<string, string> = {
    'WEAPON': 'STICK',
    'ARMOR': 'CLOTH_TUNIC',
    'TOOL': 'STICK',
    'ACCESSORY': 'ROPE_NECKLACE'
  };

  return defaultItems[itemCategory] || itemId;
}
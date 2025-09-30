/**
 * Item classification data for simplified equipment slot assignment
 * Replaces the complex regex and repeated arrays in inventoryUtils
 */

/**
 * Direct mapping of item keywords to equipment slots
 * O(1) lookup instead of linear array searches
 */
export const EQUIPMENT_SLOT_KEYWORDS = new Map<string, string>([
  // Torso items
  ['hide', 'torso'], ['pelt', 'torso'], ['jerkin', 'torso'], ['robe', 'torso'],
  ['tunic', 'torso'], ['cloak', 'cloak'], ['plate', 'torso'], ['chain', 'torso'],
  ['wrap', 'torso'], ['shirt', 'torso'], ['dress', 'torso'], ['apron', 'torso'],
  ['doublet', 'torso'], ['kirtle', 'torso'], ['bodice', 'torso'], ['surcoat', 'cloak'],
  ['houppelande', 'torso'], ['stola', 'torso'], ['peplos', 'torso'], ['palla', 'cloak'],
  ['chiton', 'torso'], ['hanfu', 'torso'], ['agbada', 'torso'], ['dashiki', 'torso'],
  ['boubou', 'torso'], ['kaftan', 'torso'], ['sherwani', 'torso'], ['kurta', 'torso'],
  ['blouse', 'torso'], ['qipao', 'torso'], ['suit', 'torso'], ['jacket', 'torso'],
  ['vest', 'torso'], ['mantle', 'cloak'], ['shawl', 'cloak'], ['kimono', 'torso'],

  // Head items
  ['cap', 'head'], ['helmet', 'head'], ['hood', 'head'], ['turban', 'head'],
  ['hat', 'head'], ['wimple', 'head'], ['coif', 'head'], ['diadem', 'head'],
  ['crown', 'head'], ['headdress', 'head'], ['veil', 'head'], ['circlet', 'head'],

  // Feet items
  ['boots', 'feet'], ['shoes', 'feet'], ['sandals', 'feet'], ['clogs', 'feet'],
  ['slippers', 'feet'], ['moccasins', 'feet'],

  // Legs items
  ['hose', 'legs'], ['trousers', 'legs'], ['breeches', 'legs'], ['pants', 'legs'],
  ['skirt', 'legs'], ['leggings', 'legs'],

  // Belt items
  ['belt', 'belt'], ['cord', 'belt'], ['sash', 'belt'], ['girdle', 'belt'],

  // Necklace items
  ['necklace', 'necklace'], ['pendant', 'necklace'], ['chain', 'necklace'],
  ['amulet', 'necklace'], ['torc', 'necklace'], ['choker', 'necklace'],

  // Accessory items (hair, face, body ornaments)
  ['comb', 'accessory'], ['hairpin', 'accessory'], ['ornament', 'accessory'],
  ['brooch', 'accessory'], ['pin', 'accessory'], ['earring', 'accessory'],
  ['bindi', 'accessory'], ['tattoo', 'accessory'],

  // Ring items
  ['ring', 'ring1']
]);

/**
 * Material classification based on item keywords
 */
export const MATERIAL_KEYWORDS = new Map<string, string>([
  // Leather materials
  ['leather', 'Leather'], ['hide', 'Hide'], ['pelt', 'Fur'],

  // Fabric materials
  ['wool', 'Wool'], ['silk', 'Silk'], ['cotton', 'Cotton'], ['linen', 'Linen'],
  ['hemp', 'Hemp'], ['cloth', 'Cloth'],

  // Metal materials
  ['iron', 'Iron'], ['steel', 'Steel'], ['bronze', 'Bronze'], ['copper', 'Copper'],
  ['brass', 'Brass'], ['gold', 'Gold'], ['silver', 'Silver'],

  // Other materials
  ['bone', 'Bone'], ['stone', 'Stone'], ['wood', 'Wood'], ['bamboo', 'Bamboo']
]);

/**
 * Item category classification
 */
export const CATEGORY_KEYWORDS = new Map<string, string>([
  // Food items
  ['meat', 'Food'], ['mutton', 'Food'], ['beef', 'Food'], ['pork', 'Food'],
  ['venison', 'Food'], ['chicken', 'Food'], ['fish', 'Food'], ['bread', 'Food'],

  // Weapons
  ['sword', 'Weapon'], ['spear', 'Weapon'], ['club', 'Weapon'], ['knife', 'Weapon'],
  ['bow', 'Weapon'], ['arrow', 'Weapon'], ['dagger', 'Weapon'], ['mace', 'Weapon'],
  ['axe', 'Weapon'], ['halberd', 'Weapon'],

  // Tools
  ['axe', 'Tool'], ['hammer', 'Tool'], ['chisel', 'Tool'], ['saw', 'Tool'],
  ['drill', 'Tool'], ['shovel', 'Tool'], ['pickaxe', 'Tool'], ['hoe', 'Tool'],
  ['rake', 'Tool'],

  // Vessels
  ['kayak', 'Vessel'], ['canoe', 'Vessel'], ['boat', 'Vessel'], ['raft', 'Vessel'],
  ['vessel', 'Vessel'], ['sailboat', 'Vessel'], ['rowboat', 'Vessel'],

  // Materials (raw resources)
  ['log', 'Material'], ['stone', 'Material'], ['ore', 'Material'], ['ingot', 'Material'],
  ['bone', 'Material'], ['hide', 'Material'], ['pelt', 'Material'], ['wool', 'Material']
]);

/**
 * Emoji assignment based on item type
 */
export const ITEM_EMOJIS = new Map<string, string>([
  // Food
  ['meat', '🥩'], ['fish', '🐟'], ['bread', '🍞'],

  // Weapons
  ['sword', '⚔️'], ['spear', '🔱'], ['bow', '🏹'], ['knife', '🔪'], ['dagger', '🔪'],
  ['club', '🏏'], ['mace', '🔨'], ['axe', '🪓'],

  // Tools
  ['axe', '🪓'], ['hammer', '🔨'], ['shovel', '🪝'], ['pickaxe', '⛏️'],

  // Vessels
  ['kayak', '🛶'], ['sailboat', '⛵'], ['raft', '🪵'], ['rowboat', '🚣'], ['boat', '🚤'],

  // Clothing
  ['shirt', '👕'], ['dress', '👗'], ['robe', '🥻'], ['cloak', '🧥'],
  ['boots', '🥾'], ['shoes', '👞'], ['sandals', '👡'], ['hat', '👒'], ['helmet', '⛑️'],

  // Jewelry
  ['necklace', '📿'], ['ring', '💍'], ['crown', '👑'],

  // Materials
  ['log', '🪵'], ['stone', '🪨'], ['ore', '🪨'], ['bone', '🦴'], ['wool', '🧶']
]);

/**
 * Get equipment slot for an item based on its name
 */
export function getEquipmentSlot(itemName: string): string | undefined {
  const lowerName = itemName.toLowerCase();

  // Check each keyword to see if it's in the item name
  for (const [keyword, slot] of EQUIPMENT_SLOT_KEYWORDS) {
    if (lowerName.includes(keyword)) {
      return slot;
    }
  }

  return undefined;
}

/**
 * Get material for an item based on its name
 */
export function getMaterialFromName(itemName: string): string {
  const lowerName = itemName.toLowerCase();

  // Check for material keywords in the name
  for (const [keyword, material] of MATERIAL_KEYWORDS) {
    if (lowerName.includes(keyword)) {
      return material;
    }
  }

  return 'Unknown';
}

/**
 * Get category for an item based on its name
 */
export function getCategoryFromName(itemName: string): string {
  const lowerName = itemName.toLowerCase();

  // Check for category keywords
  for (const [keyword, category] of CATEGORY_KEYWORDS) {
    if (lowerName.includes(keyword)) {
      return category;
    }
  }

  // Default to Apparel if it matches clothing keywords
  if (getEquipmentSlot(itemName)) {
    return 'Apparel';
  }

  return 'Special';
}

/**
 * Get appropriate emoji for an item
 */
export function getEmojiFromName(itemName: string): string {
  const lowerName = itemName.toLowerCase();

  // Check for specific emoji keywords
  for (const [keyword, emoji] of ITEM_EMOJIS) {
    if (lowerName.includes(keyword)) {
      return emoji;
    }
  }

  // Default emoji based on category
  const category = getCategoryFromName(itemName);
  const defaultEmojis: Record<string, string> = {
    'Food': '🍖',
    'Weapon': '⚔️',
    'Tool': '🔧',
    'Apparel': '👕',
    'Material': '📦',
    'Vessel': '🚤',
    'Special': '❓'
  };

  return defaultEmojis[category] || '❓';
}
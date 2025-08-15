/**
 * constants/gameData/religiousEconomy.ts
 * Defines economic goods consumed and produced by holy sites based on religion and era
 */

import { HistoricalEra } from '../../types';

interface ReligiousGoods {
  consumes: string[];
  produces: string[];
  treasuryItems: string[]; // High-value items that accumulate in treasury
}

// Map religions to their economic activities
export const RELIGIOUS_ECONOMY: Record<string, ReligiousGoods> = {
  // Christian churches
  'christian': {
    consumes: ['grain', 'wine', 'candles', 'incense', 'parchment', 'cloth'],
    produces: ['blessed_water', 'education', 'healing_herbs', 'manuscripts'],
    treasuryItems: ['gold_cross', 'silver_chalice', 'illuminated_manuscript', 'reliquary', 'gold_coins']
  },
  'catholic': {
    consumes: ['bread', 'wine', 'candles', 'incense', 'oil', 'cloth'],
    produces: ['blessed_items', 'indulgences', 'education', 'manuscripts', 'healing'],
    treasuryItems: ['gold_cross', 'silver_chalice', 'papal_seal', 'relics', 'gold_coins', 'jeweled_monstrance']
  },
  'orthodox': {
    consumes: ['bread', 'wine', 'oil', 'incense', 'candles', 'cloth'],
    produces: ['icons', 'blessed_oil', 'education', 'healing'],
    treasuryItems: ['gold_icon', 'silver_censer', 'jeweled_cross', 'byzantine_coins', 'holy_relics']
  },
  'protestant': {
    consumes: ['bread', 'candles', 'paper', 'ink'],
    produces: ['bibles', 'education', 'sermons'],
    treasuryItems: ['silver_plate', 'printed_bible', 'coins', 'communion_cup']
  },

  // Islamic mosques
  'islam': {
    consumes: ['water', 'oil', 'dates', 'cloth', 'incense'],
    produces: ['education', 'calligraphy', 'legal_rulings', 'healing'],
    treasuryItems: ['quran_manuscript', 'prayer_rugs', 'gold_coins', 'silver_inkwell', 'astrolabe']
  },
  'sunni': {
    consumes: ['water', 'dates', 'oil', 'cloth', 'paper'],
    produces: ['education', 'legal_documents', 'calligraphy'],
    treasuryItems: ['illuminated_quran', 'gold_coins', 'carpets', 'brass_lamp']
  },
  'shia': {
    consumes: ['water', 'dates', 'oil', 'cloth', 'incense', 'rose_water'],
    produces: ['education', 'mourning_banners', 'healing', 'legal_rulings'],
    treasuryItems: ['turbah', 'gold_coins', 'prayer_stones', 'silver_alam']
  },
  'sufi': {
    consumes: ['bread', 'water', 'wool', 'incense'],
    produces: ['mystical_teachings', 'poetry', 'healing', 'meditation_guidance'],
    treasuryItems: ['prayer_beads', 'mystical_texts', 'dervish_cap', 'coins']
  },

  // Jewish synagogues
  'judaism': {
    consumes: ['bread', 'wine', 'oil', 'candles', 'parchment'],
    produces: ['education', 'torah_scrolls', 'legal_rulings', 'kosher_certification'],
    treasuryItems: ['torah_crown', 'silver_pointer', 'menorah', 'shofar', 'coins']
  },

  // Buddhist temples
  'buddhist': {
    consumes: ['rice', 'tea', 'incense', 'cloth', 'oil'],
    produces: ['meditation_training', 'manuscripts', 'healing', 'education'],
    treasuryItems: ['buddha_statue', 'prayer_wheels', 'singing_bowls', 'silk_banners', 'coins']
  },
  'theravada': {
    consumes: ['rice', 'water', 'cloth', 'incense'],
    produces: ['meditation_training', 'palm_leaf_manuscripts', 'education'],
    treasuryItems: ['buddha_statue', 'alms_bowl', 'bodhi_leaf', 'coins']
  },
  'mahayana': {
    consumes: ['rice', 'tea', 'incense', 'paper', 'cloth'],
    produces: ['sutras', 'meditation_training', 'education', 'art'],
    treasuryItems: ['jade_buddha', 'prayer_beads', 'incense_burner', 'silk_scrolls', 'coins']
  },
  'zen': {
    consumes: ['rice', 'tea', 'vegetables'],
    produces: ['meditation_training', 'calligraphy', 'garden_design'],
    treasuryItems: ['tea_set', 'calligraphy_scrolls', 'meditation_cushion', 'coins']
  },

  // Hindu temples
  'hindu': {
    consumes: ['milk', 'ghee', 'flowers', 'incense', 'fruit', 'cloth'],
    produces: ['prasadam', 'education', 'astrology', 'healing'],
    treasuryItems: ['gold_murti', 'silver_vessels', 'temple_jewelry', 'silk_cloth', 'coins']
  },

  // Shinto shrines
  'shinto': {
    consumes: ['rice', 'sake', 'salt', 'paper', 'cloth'],
    produces: ['omamori', 'purification', 'blessings', 'festivals'],
    treasuryItems: ['sacred_mirror', 'gohei', 'shrine_bells', 'sake_vessels', 'coins']
  },

  // Ancient polytheistic
  'greek_polytheism': {
    consumes: ['wine', 'olive_oil', 'animals', 'incense', 'grain'],
    produces: ['oracles', 'blessings', 'festivals', 'athletic_training'],
    treasuryItems: ['gold_wreaths', 'votive_statues', 'tripods', 'coins', 'amphorae']
  },
  'roman_polytheism': {
    consumes: ['wine', 'grain', 'animals', 'incense', 'oil'],
    produces: ['auguries', 'state_rituals', 'festivals', 'military_blessings'],
    treasuryItems: ['gold_eagles', 'silver_vessels', 'marble_statues', 'coins', 'ceremonial_weapons']
  },
  'egyptian_polytheism': {
    consumes: ['grain', 'beer', 'incense', 'papyrus', 'natron'],
    produces: ['mummification', 'hieroglyphic_texts', 'prophecies', 'healing'],
    treasuryItems: ['gold_scarabs', 'canopic_jars', 'papyrus_scrolls', 'amulets', 'gold']
  },
  'norse_paganism': {
    consumes: ['mead', 'meat', 'grain', 'wood'],
    produces: ['rune_readings', 'battle_blessings', 'sagas', 'healing'],
    treasuryItems: ['arm_rings', 'thor_hammers', 'drinking_horns', 'hack_silver', 'weapons']
  },

  // Mesoamerican
  'aztec': {
    consumes: ['maize', 'cacao', 'copal_incense', 'jade', 'obsidian'],
    produces: ['calendar_readings', 'agricultural_blessings', 'warfare_rituals'],
    treasuryItems: ['jade_masks', 'gold_ornaments', 'obsidian_blades', 'quetzal_feathers', 'cacao_beans']
  },
  'maya': {
    consumes: ['maize', 'cacao', 'copal', 'bloodletting_paper', 'jade'],
    produces: ['astronomical_calculations', 'calendar_keeping', 'prophecies'],
    treasuryItems: ['jade_artifacts', 'obsidian_mirrors', 'codices', 'cacao', 'precious_stones']
  },
  'inca': {
    consumes: ['maize', 'coca_leaves', 'llamas', 'cloth', 'chicha'],
    produces: ['quipu_records', 'agricultural_calendars', 'mummification'],
    treasuryItems: ['gold_llamas', 'silver_vessels', 'fine_textiles', 'coca_bags', 'gold']
  },

  // African religions
  'yoruba': {
    consumes: ['palm_oil', 'kola_nuts', 'cloth', 'animals', 'chalk'],
    produces: ['divination', 'healing', 'initiation_rites', 'festivals'],
    treasuryItems: ['brass_sculptures', 'beaded_crowns', 'ivory_ornaments', 'cowrie_shells']
  },
  'vodun': {
    consumes: ['rum', 'tobacco', 'animals', 'cloth', 'herbs'],
    produces: ['spirit_communication', 'healing', 'protection_charms'],
    treasuryItems: ['ritual_flags', 'veve_drawings', 'spirit_bottles', 'ceremonial_drums']
  },

  // Zoroastrian
  'zoroastrian': {
    consumes: ['sandalwood', 'frankincense', 'milk', 'fruits'],
    produces: ['fire_blessings', 'purification_rituals', 'astronomical_observations'],
    treasuryItems: ['silver_afrinagan', 'ceremonial_belts', 'fire_vessels', 'coins']
  },

  // Generic animist/shamanic
  'animist': {
    consumes: ['herbs', 'tobacco', 'feathers', 'bones', 'cloth'],
    produces: ['spirit_communication', 'healing', 'weather_predictions', 'hunting_blessings'],
    treasuryItems: ['spirit_masks', 'power_objects', 'ceremonial_tools', 'sacred_bundles']
  },
  'shamanic': {
    consumes: ['herbs', 'drums', 'feathers', 'crystals'],
    produces: ['healing', 'spirit_journeys', 'divination', 'soul_retrieval'],
    treasuryItems: ['shaman_drums', 'power_staffs', 'crystal_collections', 'medicine_bundles']
  },

  // Default fallback
  'default': {
    consumes: ['offerings', 'incense', 'cloth', 'food'],
    produces: ['blessings', 'rituals', 'festivals', 'community_services'],
    treasuryItems: ['ritual_objects', 'ceremonial_items', 'coins', 'precious_items']
  }
};

/**
 * Get economic goods for a holy site based on religion
 */
export function getReligiousEconomy(religion: string, era: HistoricalEra): ReligiousGoods {
  const religionLower = religion.toLowerCase();
  
  // Direct match
  if (RELIGIOUS_ECONOMY[religionLower]) {
    return RELIGIOUS_ECONOMY[religionLower];
  }
  
  // Partial matches
  for (const [key, goods] of Object.entries(RELIGIOUS_ECONOMY)) {
    if (religionLower.includes(key) || key.includes(religionLower)) {
      return goods;
    }
  }
  
  // Broad category matches
  if (religionLower.includes('christian') || religionLower.includes('church')) {
    return RELIGIOUS_ECONOMY['christian'];
  }
  if (religionLower.includes('islam') || religionLower.includes('muslim') || religionLower.includes('mosque')) {
    return RELIGIOUS_ECONOMY['islam'];
  }
  if (religionLower.includes('buddhis') || religionLower.includes('stupa')) {
    return RELIGIOUS_ECONOMY['buddhist'];
  }
  if (religionLower.includes('hindu') || religionLower.includes('temple')) {
    return RELIGIOUS_ECONOMY['hindu'];
  }
  if (religionLower.includes('synagogue') || religionLower.includes('jewish')) {
    return RELIGIOUS_ECONOMY['judaism'];
  }
  if (religionLower.includes('shaman') || religionLower.includes('spirit')) {
    return RELIGIOUS_ECONOMY['shamanic'];
  }
  if (religionLower.includes('pagan') || religionLower.includes('druid')) {
    return RELIGIOUS_ECONOMY['animist'];
  }
  
  return RELIGIOUS_ECONOMY['default'];
}

/**
 * Generate treasury based on wealth level
 */
export function generateHolySiteTreasury(
  religion: string,
  era: HistoricalEra,
  wealthLevel: number // 0-10 scale
): Record<string, number> {
  const goods = getReligiousEconomy(religion, era);
  const treasury: Record<string, number> = {};
  
  // Add currency based on wealth
  treasury['coins'] = Math.floor(wealthLevel * wealthLevel * 10); // Exponential scaling
  
  // Add treasury items based on wealth level
  const numItems = Math.min(goods.treasuryItems.length, Math.floor(wealthLevel / 2) + 1);
  for (let i = 0; i < numItems; i++) {
    const item = goods.treasuryItems[i];
    // Higher value items in smaller quantities
    treasury[item] = Math.max(1, Math.floor((11 - i * 2) * wealthLevel / 5));
  }
  
  return treasury;
}

/**
 * Calculate wealth level based on map characteristics
 */
export function calculateHolySiteWealth(
  urbanizationLevel: number, // 0-1 percentage of urban tiles
  era: HistoricalEra,
  culturalZone: string
): number {
  let wealth = 5; // Base wealth
  
  // Urbanization adds 0-3 points
  wealth += urbanizationLevel * 3;
  
  // Era modifiers
  const eraModifiers: Record<HistoricalEra, number> = {
    [HistoricalEra.PREHISTORIC]: -3,
    [HistoricalEra.ANTIQUITY]: -1,
    [HistoricalEra.MEDIEVAL]: 0,
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: 2,
    [HistoricalEra.INDUSTRIAL]: 1,
    [HistoricalEra.MODERN]: 0,
    [HistoricalEra.FUTURE]: -1,
  };
  wealth += eraModifiers[era] || 0;
  
  // Cultural zone modifiers (historically wealthy religious centers)
  if (culturalZone.includes('EUROPEAN') && era === HistoricalEra.MEDIEVAL) wealth += 1;
  if (culturalZone.includes('MENA') && era === HistoricalEra.MEDIEVAL) wealth += 1;
  if (culturalZone.includes('EAST_ASIAN') && era === HistoricalEra.RENAISSANCE_EARLY_MODERN) wealth += 1;
  
  // Clamp between 1 and 10
  return Math.max(1, Math.min(10, Math.round(wealth)));
}
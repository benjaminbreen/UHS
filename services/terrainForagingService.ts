/**
 * Terrain-specific foraging, digging, and chopping mechanics
 * Provides realistic resource gathering based on terrain type
 */

import { Tile, BiomeType, Item, PlayerCharacter, MapData } from '../types';
import { createItemInstance } from '../utils/inventoryUtils';
import { ITEM_DEFINITIONS } from '../constants/gameData/itemDefinitions';
import { 
  isNearFreshwater, 
  getWaterSourceMessage, 
  getWaterCollectionAmount 
} from './waterDetectionService';

export interface TerrainActionResult {
  success: boolean;
  item?: Item;
  items?: Item[];
  message: string;
  xpGained?: number;
  reputationChange?: number;
  stealingDetected?: boolean;
}

/**
 * Execute terrain-specific dig action
 */
export function executeTerrainDig(
  tile: Tile, 
  player: PlayerCharacter,
  isUrbanTile: boolean = false,
  mapData?: MapData,
  playerLocation?: { x: number; y: number }
): TerrainActionResult {
  
  // Check for freshwater collection when digging near water
  if (mapData && playerLocation) {
    const waterSource = isNearFreshwater(playerLocation, mapData);
    if (waterSource) {
      const waterItem = createItemInstance('FRESH_WATER');
      if (waterItem) {
        const amount = getWaterCollectionAmount(waterSource);
        waterItem.quantity = amount;
        
        const sourceMessage = getWaterSourceMessage(waterSource);
        const collectionMessage = amount > 1 
          ? `You dig a small collection pool and gather ${amount} liters of fresh water.`
          : `You dig a small collection pool and gather 1 liter of fresh water.`;
        
        return {
          success: true,
          item: waterItem,
          message: `${sourceMessage} ${collectionMessage}`,
          xpGained: 2 // Slightly more XP for digging
        };
      }
    }
  }
  
  // Salt flats - always get salt
  if (tile.biome === BiomeType.SALT_FLATS) {
    const saltItem = createItemInstance('SALT');
    if (saltItem) {
      saltItem.quantity = 2 + Math.floor(Math.random() * 3); // 2-4 salt
      return {
        success: true,
        item: saltItem,
        message: `You scrape up ${saltItem.quantity} handfuls of salt from the crystallized surface.`,
        xpGained: 1
      };
    }
  }

  // Beach/coast - shells, crabs, clams
  if (tile.biome === BiomeType.BEACH || tile.altitude === 0) {
    const beachItems = ['SEASHELL', 'CRAB', 'CLAM', 'DRIFTWOOD', 'SEA_GLASS'];
    const roll = Math.random();
    let itemId: string;
    
    if (roll < 0.3) itemId = 'SEASHELL';
    else if (roll < 0.5) itemId = 'CRAB';
    else if (roll < 0.65) itemId = 'CLAM';
    else if (roll < 0.85) itemId = 'DRIFTWOOD';
    else itemId = 'SEA_GLASS';
    
    const item = createItemInstance(itemId);
    if (item) {
      return {
        success: true,
        item,
        message: `You dig in the sand and find ${item.name.toLowerCase()}.`,
        xpGained: 1
      };
    }
  }

  // Desert - fossils, minerals, scorpions
  if (tile.biome === BiomeType.DESERT || tile.biome === BiomeType.SCRUB) {
    const roll = Math.random();
    let itemId: string;
    
    if (roll < 0.2) itemId = 'POTTERY_SHARD';
    else if (roll < 0.35) itemId = 'FOSSIL';
    else if (roll < 0.5) itemId = 'OBSIDIAN';
    else if (roll < 0.65) itemId = 'FLINT';
    else if (roll < 0.8) itemId = 'SMOOTH_STONE';
    else itemId = 'SCORPION'; // Dangerous find!
    
    const item = createItemInstance(itemId);
    if (item) {
      const dangerMessage = itemId === 'SCORPION' 
        ? 'A scorpion scurries out! You manage to catch it carefully.' 
        : `You unearth ${item.name.toLowerCase()} from the dry soil.`;
      
      return {
        success: true,
        item,
        message: dangerMessage,
        xpGained: itemId === 'SCORPION' ? 2 : 1
      };
    }
  }

  // Swamp/wetland - peat, leeches, bog iron
  if (tile.biome === BiomeType.SWAMP || tile.biome === BiomeType.WETLAND) {
    const roll = Math.random();
    let itemId: string;
    
    if (roll < 0.3) itemId = 'PEAT';
    else if (roll < 0.5) itemId = 'CLAY_LUMP';
    else if (roll < 0.65) itemId = 'BOG_IRON';
    else if (roll < 0.8) itemId = 'LEECH';
    else itemId = 'DAMP_LOG';
    
    const item = createItemInstance(itemId);
    if (item) {
      return {
        success: true,
        item,
        message: `You dig into the boggy ground and extract ${item.name.toLowerCase()}.`,
        xpGained: 1
      };
    }
  }

  // Tundra - permafrost items
  if (tile.biome === BiomeType.TUNDRA || tile.biome === BiomeType.TAIGA) {
    const roll = Math.random();
    let itemId: string;
    
    if (roll < 0.25) itemId = 'FROZEN_BERRIES';
    else if (roll < 0.45) itemId = 'MAMMOTH_TUSK_FRAGMENT';
    else if (roll < 0.65) itemId = 'AMBER';
    else if (roll < 0.85) itemId = 'SMOOTH_STONE';
    else itemId = 'ICE_CRYSTAL';
    
    const item = createItemInstance(itemId);
    if (item) {
      return {
        success: true,
        item,
        message: `You break through the frozen ground and find ${item.name.toLowerCase()}.`,
        xpGained: 2 // Harder to dig in frozen ground
      };
    }
  }

  // Urban tile - stealing mechanic
  if (isUrbanTile) {
    const roll = Math.random();
    
    // 60% chance to find something, but reputation penalty
    if (roll < 0.6) {
      const urbanItems = [
        'BREAD', 'CHEESE', 'APPLE', 'COIN', 'CLOTH', 'LEATHER', 
        'CANDLE', 'POTTERY', 'WOOL', 'ROPE', 'NAILS', 'PAPER'
      ];
      
      const itemId = urbanItems[Math.floor(Math.random() * urbanItems.length)];
      const item = createItemInstance(itemId);
      
      if (item) {
        // Small chance of finding multiple coins
        if (itemId === 'COIN' && Math.random() < 0.3) {
          item.quantity = 2 + Math.floor(Math.random() * 3);
        }
        
        return {
          success: true,
          item,
          message: `You discretely search around and pocket ${item.name.toLowerCase()}. You hope nobody saw that...`,
          xpGained: 0, // No XP for stealing
          reputationChange: -5, // Reputation penalty
          stealingDetected: Math.random() < 0.3 // 30% chance of being seen
        };
      }
    } else {
      return {
        success: false,
        message: "You search around but find nothing, and people are starting to stare suspiciously.",
        reputationChange: -2 // Small penalty for suspicious behavior
      };
    }
  }

  // Default digging result (already handled in skillService)
  return {
    success: false,
    message: "The default dig action will be handled by the skill service."
  };
}

/**
 * Execute terrain-specific forage action
 */
export function executeTerrainForage(
  tile: Tile,
  player: PlayerCharacter,
  isUrbanTile: boolean = false,
  mapData?: MapData,
  playerLocation?: { x: number; y: number }
): TerrainActionResult {
  
  // Check for freshwater collection first (highest priority)
  if (mapData && playerLocation) {
    const waterSource = isNearFreshwater(playerLocation, mapData);
    if (waterSource) {
      const waterItem = createItemInstance('FRESH_WATER');
      if (waterItem) {
        const amount = getWaterCollectionAmount(waterSource);
        waterItem.quantity = amount;
        
        const sourceMessage = getWaterSourceMessage(waterSource);
        const collectionMessage = amount > 1 
          ? `You collect ${amount} liters of fresh water.`
          : `You collect 1 liter of fresh water.`;
        
        return {
          success: true,
          item: waterItem,
          message: `${sourceMessage} ${collectionMessage}`,
          xpGained: 1
        };
      }
    }
  }
  
  // Salt flats - salt crystals and minerals
  if (tile.biome === BiomeType.SALT_FLATS) {
    const roll = Math.random();
    let itemId: string;
    
    if (roll < 0.6) itemId = 'SALT';
    else if (roll < 0.8) itemId = 'MINERAL_CRYSTALS';
    else itemId = 'LITHIUM_TRACE'; // Rare mineral
    
    const item = createItemInstance(itemId);
    if (item) {
      return {
        success: true,
        item,
        message: `You gather ${item.name.toLowerCase()} from the salt flat surface.`,
        xpGained: 1
      };
    }
  }

  // Reef - coral, pearls, sea urchins
  if (tile.biome === BiomeType.REEF) {
    const roll = Math.random();
    let itemId: string;
    
    if (roll < 0.3) itemId = 'CORAL_FRAGMENT';
    else if (roll < 0.5) itemId = 'SEA_URCHIN';
    else if (roll < 0.7) itemId = 'SEAWEED';
    else if (roll < 0.85) itemId = 'TROPICAL_FISH';
    else if (roll < 0.95) itemId = 'ABALONE_SHELL';
    else itemId = 'PEARL'; // Very rare
    
    const item = createItemInstance(itemId);
    if (item) {
      return {
        success: true,
        item,
        message: `You carefully harvest ${item.name.toLowerCase()} from the reef.`,
        xpGained: itemId === 'PEARL' ? 3 : 1
      };
    }
  }

  // Mangrove - unique swamp resources
  if (tile.biome === BiomeType.MANGROVE) {
    const roll = Math.random();
    let itemId: string;
    
    if (roll < 0.3) itemId = 'MANGROVE_BARK';
    else if (roll < 0.5) itemId = 'MUD_CRAB';
    else if (roll < 0.65) itemId = 'OYSTER';
    else if (roll < 0.8) itemId = 'MANGROVE_HONEY';
    else itemId = 'CROCODILE_SCALE';
    
    const item = createItemInstance(itemId);
    if (item) {
      return {
        success: true,
        item,
        message: `You forage ${item.name.toLowerCase()} from the mangrove swamp.`,
        xpGained: 1
      };
    }
  }

  // Volcanic - obsidian, sulfur, pumice
  if (tile.biome === BiomeType.VOLCANIC) {
    const roll = Math.random();
    let itemId: string;
    
    if (roll < 0.4) itemId = 'OBSIDIAN';
    else if (roll < 0.6) itemId = 'SULFUR';
    else if (roll < 0.8) itemId = 'PUMICE_STONE';
    else itemId = 'VOLCANIC_ASH';
    
    const item = createItemInstance(itemId);
    if (item) {
      return {
        success: true,
        item,
        message: `You carefully collect ${item.name.toLowerCase()} from the volcanic terrain.`,
        xpGained: 2 // Dangerous terrain
      };
    }
  }

  // Estuary - mixed fresh/saltwater resources
  if (tile.biome === BiomeType.ESTUARY) {
    const roll = Math.random();
    let itemId: string;
    
    if (roll < 0.25) itemId = 'RIVER_SHRIMP';
    else if (roll < 0.45) itemId = 'CATTAIL_ROOT';
    else if (roll < 0.65) itemId = 'DUCK_EGG';
    else if (roll < 0.8) itemId = 'RIVER_REED';
    else itemId = 'FRESHWATER_PEARL';
    
    const item = createItemInstance(itemId);
    if (item) {
      return {
        success: true,
        item,
        message: `You forage ${item.name.toLowerCase()} from the estuary.`,
        xpGained: 1
      };
    }
  }

  // Cliff - bird eggs, feathers, cliff plants
  if (tile.biome === BiomeType.CLIFF) {
    const roll = Math.random();
    let itemId: string;
    
    if (roll < 0.3) itemId = 'SEABIRD_EGG';
    else if (roll < 0.5) itemId = 'FEATHER';
    else if (roll < 0.7) itemId = 'CLIFF_FLOWER';
    else if (roll < 0.85) itemId = 'GUANO';
    else itemId = 'RARE_ORCHID';
    
    const item = createItemInstance(itemId);
    if (item) {
      return {
        success: true,
        item,
        message: `You carefully gather ${item.name.toLowerCase()} from the cliff face.`,
        xpGained: 2 // Dangerous to forage on cliffs
      };
    }
  }

  // Dense Forest - high biodiversity, better rare item chances
  if (tile.biome === BiomeType.DENSE_FOREST || tile.biome === BiomeType.FOREST) {
    const roll = Math.random();
    let itemId: string;
    
    // Better chances for rare items in dense forest
    if (roll < 0.15) itemId = 'MUSHROOM';
    else if (roll < 0.25) itemId = 'TRUFFLE'; // Rare mushroom
    else if (roll < 0.35) itemId = 'WILD_BERRIES';
    else if (roll < 0.45) itemId = 'MEDICINAL_HERBS';
    else if (roll < 0.55) itemId = 'BIRD_EGG';
    else if (roll < 0.65) itemId = 'HONEY';
    else if (roll < 0.72) itemId = 'RARE_FLOWER';
    else if (roll < 0.78) itemId = 'GINSENG_ROOT'; // Very valuable
    else if (roll < 0.85) itemId = 'TREE_SAP';
    else if (roll < 0.90) itemId = 'EDIBLE_FERN';
    else if (roll < 0.95) itemId = 'WILD_GARLIC';
    else itemId = 'RARE_ORCHID'; // Extremely rare
    
    const item = createItemInstance(itemId);
    if (item) {
      const rareItems = ['TRUFFLE', 'GINSENG_ROOT', 'RARE_ORCHID', 'HONEY'];
      const xp = rareItems.includes(itemId) ? 3 : 1;
      
      return {
        success: true,
        item,
        message: `You forage ${item.name.toLowerCase()} from the rich forest floor.`,
        xpGained: xp
      };
    }
  }

  // Jungle/Tropical Forest - exotic items, high biodiversity
  if (tile.biome === BiomeType.JUNGLE) {
    const roll = Math.random();
    let itemId: string;
    
    if (roll < 0.12) itemId = 'TROPICAL_FRUIT';
    else if (roll < 0.22) itemId = 'CACAO_POD'; // For chocolate
    else if (roll < 0.32) itemId = 'VANILLA_BEAN';
    else if (roll < 0.40) itemId = 'COCONUT';
    else if (roll < 0.48) itemId = 'MEDICINAL_BARK';
    else if (roll < 0.55) itemId = 'JUNGLE_NUTS';
    else if (roll < 0.62) itemId = 'EXOTIC_SPICE';
    else if (roll < 0.68) itemId = 'RUBBER_SAP';
    else if (roll < 0.74) itemId = 'POISON_DART_FROG'; // Dangerous!
    else if (roll < 0.80) itemId = 'PARROT_FEATHER';
    else if (roll < 0.85) itemId = 'MONKEY_FRUIT';
    else if (roll < 0.90) itemId = 'BAMBOO_SHOOTS';
    else if (roll < 0.95) itemId = 'RARE_BUTTERFLY';
    else itemId = 'GOLDEN_BEETLE'; // Extremely rare
    
    const item = createItemInstance(itemId);
    if (item) {
      const dangerousItems = ['POISON_DART_FROG'];
      const rareItems = ['GOLDEN_BEETLE', 'RARE_BUTTERFLY', 'EXOTIC_SPICE', 'VANILLA_BEAN'];
      const xp = rareItems.includes(itemId) ? 3 : dangerousItems.includes(itemId) ? 2 : 1;
      
      return {
        success: true,
        item,
        message: `You carefully gather ${item.name.toLowerCase()} from the jungle.`,
        xpGained: xp
      };
    }
  }

  // Urban foraging - scavenging for human-related items
  if (isUrbanTile) {
    const roll = Math.random();
    
    if (roll < 0.6) { // 60% success rate in cities
      let itemId: string;
      const urbanRoll = Math.random();
      
      // More varied urban items based on quality
      if (urbanRoll < 0.15) {
        // Food scraps
        const foodScraps = ['BREAD_CRUST', 'APPLE_CORE', 'CHEESE_RIND', 'BONE_WITH_MEAT', 'STALE_PASTRY'];
        itemId = foodScraps[Math.floor(Math.random() * foodScraps.length)];
      } else if (urbanRoll < 0.35) {
        // Cloth and materials
        const materials = ['DISCARDED_CLOTH', 'TORN_LEATHER', 'FRAYED_ROPE', 'THREAD', 'WOOL_SCRAPS'];
        itemId = materials[Math.floor(Math.random() * materials.length)];
      } else if (urbanRoll < 0.55) {
        // Broken items
        const broken = ['BROKEN_POTTERY', 'GLASS_SHARD', 'BENT_NAIL', 'RUSTY_KEY', 'CRACKED_BUTTON'];
        itemId = broken[Math.floor(Math.random() * broken.length)];
      } else if (urbanRoll < 0.75) {
        // Paper and writing
        const paper = ['TORN_PAPER', 'OLD_NEWSPAPER', 'FADED_MAP_FRAGMENT', 'USED_ENVELOPE'];
        itemId = paper[Math.floor(Math.random() * paper.length)];
      } else if (urbanRoll < 0.90) {
        // Small valuables
        const valuables = ['BUTTON', 'SMALL_COIN', 'BROKEN_JEWELRY', 'TOBACCO_POUCH'];
        itemId = valuables[Math.floor(Math.random() * valuables.length)];
      } else {
        // Rare urban finds
        const rare = ['LOST_RING', 'SILVER_SPOON', 'POCKET_WATCH', 'SILK_HANDKERCHIEF'];
        itemId = rare[Math.floor(Math.random() * rare.length)];
      }
      
      const item = createItemInstance(itemId);
      
      if (item) {
        const rareUrbanItems = ['LOST_RING', 'SILVER_SPOON', 'POCKET_WATCH', 'SILK_HANDKERCHIEF'];
        const isRare = rareUrbanItems.includes(itemId);
        
        return {
          success: true,
          item,
          message: isRare 
            ? `You find ${item.name.toLowerCase()} hidden in a corner!` 
            : `You scavenge ${item.name.toLowerCase()} from the street.`,
          xpGained: isRare ? 2 : 0,
          reputationChange: isRare ? -5 : -2, // Bigger penalty for taking valuable items
          stealingDetected: isRare ? Math.random() < 0.4 : Math.random() < 0.15 // Higher chance if valuable
        };
      }
    }
  }

  // Default - handled by main forage system
  return {
    success: false,
    message: "The default forage action will be handled by the skill service."
  };
}

/**
 * Execute terrain-specific chop action
 */
export function executeTerrainChop(
  tile: Tile,
  player: PlayerCharacter,
  isUrbanTile: boolean = false
): TerrainActionResult {
  
  // Mangrove - special mangrove wood
  if (tile.biome === BiomeType.MANGROVE && tile.vegetationId) {
    const item = createItemInstance('MANGROVE_WOOD');
    if (item) {
      return {
        success: true,
        item,
        message: "You chop down twisted mangrove wood, prized for boat building.",
        xpGained: 3
      };
    }
  }

  // Bamboo forest (if in jungle/tropical)
  if ((tile.biome === BiomeType.JUNGLE || tile.biome === BiomeType.SAVANNA) && 
      tile.vegetationId && Math.random() < 0.3) {
    const item = createItemInstance('BAMBOO');
    if (item) {
      item.quantity = 3 + Math.floor(Math.random() * 3);
      return {
        success: true,
        item,
        message: `You harvest ${item.quantity} bamboo stalks.`,
        xpGained: 2
      };
    }
  }

  // Urban chopping - vandalism!
  if (isUrbanTile) {
    return {
      success: false,
      message: "You can't just chop things in the city! People are calling the guards!",
      reputationChange: -10, // Major reputation penalty
      stealingDetected: true
    };
  }

  // Coral reef - illegal harvesting
  if (tile.biome === BiomeType.REEF) {
    const item = createItemInstance('CORAL_BRANCH');
    if (item) {
      return {
        success: true,
        item,
        message: "You break off a piece of coral. This damages the reef ecosystem...",
        xpGained: 0,
        reputationChange: -8 // Environmental damage
      };
    }
  }

  // Default - handled by main chop system for trees
  return {
    success: false,
    message: "The default chop action will be handled by the skill service."
  };
}

/**
 * Add new terrain-specific items to item definitions
 */
export const TERRAIN_SPECIFIC_ITEMS = {
  // Salt flat items
  MINERAL_CRYSTALS: {
    baseId: 'MINERAL_CRYSTALS',
    name: 'Mineral Crystals',
    description: 'Colorful crystalline formations from dried lake beds.',
    category: 'material',
    value: 15,
    weight: 0.5,
    rarity: 'uncommon'
  },
  LITHIUM_TRACE: {
    baseId: 'LITHIUM_TRACE',
    name: 'Lithium Salts',
    description: 'Valuable lithium-bearing salts with a distinctive blue tinge.',
    category: 'material',
    value: 50,
    weight: 0.3,
    rarity: 'rare'
  },
  
  // Beach/coastal items
  SEA_GLASS: {
    baseId: 'SEA_GLASS',
    name: 'Sea Glass',
    description: 'Smooth, frosted glass polished by waves.',
    category: 'material',
    value: 5,
    weight: 0.1,
    rarity: 'common'
  },
  SEASHELL: {
    baseId: 'SEASHELL',
    name: 'Seashell',
    description: 'A beautiful spiral shell from the shore.',
    category: 'material',
    value: 2,
    weight: 0.1,
    rarity: 'common'
  },
  
  // Desert items
  FOSSIL: {
    baseId: 'FOSSIL',
    name: 'Ancient Fossil',
    description: 'Preserved remains of prehistoric life.',
    category: 'material',
    value: 25,
    weight: 1,
    rarity: 'uncommon'
  },
  SCORPION: {
    baseId: 'SCORPION',
    name: 'Desert Scorpion',
    description: 'A venomous arachnid. Handle with care!',
    category: 'creature',
    value: 10,
    weight: 0.1,
    rarity: 'uncommon'
  },
  
  // Wetland items
  PEAT: {
    baseId: 'PEAT',
    name: 'Peat',
    description: 'Compressed plant matter, burns well when dried.',
    category: 'material',
    value: 3,
    weight: 0.5,
    rarity: 'common'
  },
  BOG_IRON: {
    baseId: 'BOG_IRON',
    name: 'Bog Iron',
    description: 'Iron deposits formed in swamps, can be smelted.',
    category: 'ore',
    value: 15,
    weight: 2,
    rarity: 'uncommon'
  },
  LEECH: {
    baseId: 'LEECH',
    name: 'Medicinal Leech',
    description: 'Used in traditional medicine for bloodletting.',
    category: 'medical',
    value: 8,
    weight: 0.05,
    rarity: 'common'
  },
  
  // Tundra items
  FROZEN_BERRIES: {
    baseId: 'FROZEN_BERRIES',
    name: 'Frozen Cloudberries',
    description: 'Berries preserved by permafrost, still edible.',
    category: 'food',
    value: 6,
    weight: 0.2,
    rarity: 'common'
  },
  MAMMOTH_TUSK_FRAGMENT: {
    baseId: 'MAMMOTH_TUSK_FRAGMENT',
    name: 'Mammoth Ivory Fragment',
    description: 'Ancient ivory from extinct mammoths.',
    category: 'material',
    value: 100,
    weight: 2,
    rarity: 'rare'
  },
  ICE_CRYSTAL: {
    baseId: 'ICE_CRYSTAL',
    name: 'Eternal Ice Crystal',
    description: 'Ice that never melts, radiates cold.',
    category: 'magical',
    value: 75,
    weight: 0.5,
    rarity: 'rare'
  },
  
  // Reef items
  CORAL_FRAGMENT: {
    baseId: 'CORAL_FRAGMENT',
    name: 'Coral Fragment',
    description: 'Colorful piece of coral, decorative.',
    category: 'material',
    value: 8,
    weight: 0.3,
    rarity: 'common'
  },
  SEA_URCHIN: {
    baseId: 'SEA_URCHIN',
    name: 'Sea Urchin',
    description: 'Spiny sea creature, a delicacy in some cultures.',
    category: 'food',
    value: 12,
    weight: 0.2,
    rarity: 'common'
  },
  TROPICAL_FISH: {
    baseId: 'TROPICAL_FISH',
    name: 'Tropical Fish',
    description: 'Brightly colored reef fish.',
    category: 'food',
    value: 10,
    weight: 0.3,
    rarity: 'common'
  },
  ABALONE_SHELL: {
    baseId: 'ABALONE_SHELL',
    name: 'Abalone Shell',
    description: 'Iridescent shell, highly prized.',
    category: 'material',
    value: 30,
    weight: 0.4,
    rarity: 'uncommon'
  },
  PEARL: {
    baseId: 'PEARL',
    name: 'Pearl',
    description: 'A lustrous gem from an oyster.',
    category: 'gem',
    value: 200,
    weight: 0.05,
    rarity: 'rare'
  },
  
  // Mangrove items
  MANGROVE_BARK: {
    baseId: 'MANGROVE_BARK',
    name: 'Mangrove Bark',
    description: 'Tannic bark used for leather tanning.',
    category: 'material',
    value: 5,
    weight: 0.3,
    rarity: 'common'
  },
  MUD_CRAB: {
    baseId: 'MUD_CRAB',
    name: 'Mud Crab',
    description: 'Large crab from mangrove swamps.',
    category: 'food',
    value: 8,
    weight: 0.5,
    rarity: 'common'
  },
  OYSTER: {
    baseId: 'OYSTER',
    name: 'Oyster',
    description: 'Shellfish that might contain a pearl.',
    category: 'food',
    value: 6,
    weight: 0.2,
    rarity: 'common'
  },
  MANGROVE_HONEY: {
    baseId: 'MANGROVE_HONEY',
    name: 'Mangrove Honey',
    description: 'Rare honey from mangrove flower nectar.',
    category: 'food',
    value: 25,
    weight: 0.3,
    rarity: 'uncommon'
  },
  CROCODILE_SCALE: {
    baseId: 'CROCODILE_SCALE',
    name: 'Crocodile Scale',
    description: 'Tough scale, useful for armor crafting.',
    category: 'material',
    value: 20,
    weight: 0.2,
    rarity: 'uncommon'
  },
  MANGROVE_WOOD: {
    baseId: 'MANGROVE_WOOD',
    name: 'Mangrove Wood',
    description: 'Dense, water-resistant wood perfect for boats.',
    category: 'material',
    value: 15,
    weight: 3,
    rarity: 'common'
  },
  
  // Volcanic items
  OBSIDIAN: {
    baseId: 'OBSIDIAN',
    name: 'Obsidian',
    description: 'Volcanic glass, extremely sharp when knapped.',
    category: 'material',
    value: 12,
    weight: 0.5,
    rarity: 'common'
  },
  SULFUR: {
    baseId: 'SULFUR',
    name: 'Sulfur',
    description: 'Yellow mineral used in alchemy and gunpowder.',
    category: 'material',
    value: 10,
    weight: 0.3,
    rarity: 'common'
  },
  PUMICE_STONE: {
    baseId: 'PUMICE_STONE',
    name: 'Pumice Stone',
    description: 'Light volcanic rock that floats on water.',
    category: 'material',
    value: 4,
    weight: 0.1,
    rarity: 'common'
  },
  VOLCANIC_ASH: {
    baseId: 'VOLCANIC_ASH',
    name: 'Volcanic Ash',
    description: 'Fine ash, excellent fertilizer.',
    category: 'material',
    value: 3,
    weight: 0.2,
    rarity: 'common'
  },
  
  // Other special items
  BAMBOO: {
    baseId: 'BAMBOO',
    name: 'Bamboo',
    description: 'Versatile plant material for construction.',
    category: 'material',
    value: 4,
    weight: 0.5,
    rarity: 'common'
  },
  CORAL_BRANCH: {
    baseId: 'CORAL_BRANCH',
    name: 'Living Coral',
    description: 'A branch of living coral. Taking this harms the reef.',
    category: 'material',
    value: 15,
    weight: 0.5,
    rarity: 'uncommon'
  }
};
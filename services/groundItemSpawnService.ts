/**
 * services/groundItemSpawnService.ts
 * Spawns random items on the ground for players to discover during exploration
 */

import { BiomeType, Item, MapData, TerrainStructureType } from '../types';
import { ITEM_DEFINITIONS } from '../constants/index';
import { createItemInstance } from '../utils/inventoryUtils';

interface SpawnTableEntry {
  itemId: string;
  weight: number; // Higher = more common
  minEra?: number; // Minimum year (e.g., 1800 for modern items)
  maxEra?: number; // Maximum year (e.g., 1500 for medieval items)
}

interface SpawnContext {
  biome: BiomeType;
  nearWater: boolean;
  nearUrban: boolean;
  nearRuins: boolean;
  isRoad: boolean;
  isBattlefield: boolean;
  weather?: 'rain' | 'snow' | 'clear';
  season?: 'spring' | 'summer' | 'fall' | 'winter';
}

// --- SPAWN TABLES BY CATEGORY ---

const JUNK_ITEMS: SpawnTableEntry[] = [
  { itemId: 'SMOOTH_STONE', weight: 50 },
  { itemId: 'DRY_LEAVES', weight: 40 },
  { itemId: 'STICK', weight: 45 },
  { itemId: 'POTTERY_SHARD', weight: 25 },
  { itemId: 'ROOT', weight: 30 },
  { itemId: 'EARTHWORM', weight: 20 },
  { itemId: 'BENT_NAIL', weight: 15, minEra: 1200 },
  { itemId: 'BUTTON', weight: 12, minEra: 1400 },
  { itemId: 'BONES', weight: 18 },
  { itemId: 'APPLE_CORE', weight: 10 },
  { itemId: 'BREAD_CRUST', weight: 8 },
  { itemId: 'BROKEN_POTTERY', weight: 20 },
];

const NATURAL_MATERIALS: SpawnTableEntry[] = [
  { itemId: 'FLINT_STONE', weight: 30 },
  { itemId: 'COAL', weight: 15 },
  { itemId: 'CLAY_LUMP', weight: 25 },
  { itemId: 'OCHRE_LUMP', weight: 12 },
  { itemId: 'DAMP_LOG', weight: 20 },
  { itemId: 'ROCK_SALT', weight: 10 },
];

const FOREST_ITEMS: SpawnTableEntry[] = [
  { itemId: 'ACORNS', weight: 40 },
  { itemId: 'PINE_CONE', weight: 35 },
  { itemId: 'MUSHROOM', weight: 20 },
  { itemId: 'WILD_BERRIES', weight: 25 },
  { itemId: 'BIRDS_NEST', weight: 15 },
  { itemId: 'STICK', weight: 50 },
  { itemId: 'DRY_LEAVES', weight: 45 },
  { itemId: 'ROOT', weight: 30 },
  { itemId: 'AMBER', weight: 3 },
  { itemId: 'DAMP_LOG', weight: 25 },
];

const WATER_ITEMS: SpawnTableEntry[] = [
  { itemId: 'SEASHELL', weight: 40 },
  { itemId: 'SMOOTH_STONE', weight: 35 },
  { itemId: 'DRIFTWOOD', weight: 30 },
  { itemId: 'CORAL_FRAGMENT', weight: 20 },
  { itemId: 'ABALONE_SHELL', weight: 15 },
  { itemId: 'CLAM', weight: 25 },
  { itemId: 'OYSTER', weight: 18 },
  { itemId: 'CLAY_LUMP', weight: 30 },
  { itemId: 'CATTAIL_ROOT', weight: 22 },
  { itemId: 'REEDS', weight: 28 },
  { itemId: 'PEARL', weight: 0.2 },
];

const DESERT_ITEMS: SpawnTableEntry[] = [
  { itemId: 'CACTUS_FRUIT', weight: 30 },
  { itemId: 'SAND', weight: 50 },
  { itemId: 'ROCK_SALT', weight: 20 },
  { itemId: 'TURQUOISE_BEAD', weight: 5 },
  { itemId: 'SMOOTH_STONE', weight: 25 },
  { itemId: 'FLINT_STONE', weight: 15 },
  { itemId: 'BONES', weight: 18 },
  { itemId: 'POTTERY_SHARD', weight: 12 },
];

const MOUNTAIN_ITEMS: SpawnTableEntry[] = [
  { itemId: 'FLINT_STONE', weight: 40 },
  { itemId: 'SMOOTH_STONE', weight: 35 },
  { itemId: 'CLIFF_FLOWER', weight: 15 },
  { itemId: 'EDELWEISS', weight: 8 },
  { itemId: 'OBSIDIAN_SHARD', weight: 12 },
  { itemId: 'IRON_ORE', weight: 20 },
  { itemId: 'COPPER_ORE', weight: 18 },
  { itemId: 'SILVER_ORE', weight: 2 },
  { itemId: 'GOLD_ORE', weight: 0.5 },
  { itemId: 'TIN_ORE', weight: 15 },
];

const URBAN_ITEMS: SpawnTableEntry[] = [
  { itemId: 'COIN', weight: 25 },
  { itemId: 'POTTERY_SHARD', weight: 35 },
  { itemId: 'BROKEN_POTTERY', weight: 30 },
  { itemId: 'BENT_NAIL', weight: 28, minEra: 1200 },
  { itemId: 'HORSESHOE', weight: 15, minEra: 800 },
  { itemId: 'BUTTON', weight: 18, minEra: 1400 },
  { itemId: 'BREAD_CRUST', weight: 22 },
  { itemId: 'APPLE_CORE', weight: 20 },
  { itemId: 'ROPE', weight: 12 },
  { itemId: 'CANDLE', weight: 10, minEra: 800 },
];

const ROAD_ITEMS: SpawnTableEntry[] = [
  { itemId: 'COIN', weight: 30 },
  { itemId: 'HORSESHOE', weight: 20, minEra: 800 },
  { itemId: 'WALKING_STAFF', weight: 8 },
  { itemId: 'WALKING_CANE', weight: 5, minEra: 1600 },
  { itemId: 'CLOTH_HOOD', weight: 10 },
  { itemId: 'LEATHER_CAP', weight: 8 },
  { itemId: 'SANDALS', weight: 12 },
  { itemId: 'SIMPLE_RING', weight: 4 },
  { itemId: 'ROPE_NECKLACE', weight: 6 },
  { itemId: 'SCROLL', weight: 3 },
  { itemId: 'LETTER', weight: 5, minEra: 1200 },
];

const BATTLEFIELD_ITEMS: SpawnTableEntry[] = [
  { itemId: 'ARROW', weight: 40 },
  { itemId: 'BROKEN_SWORD', weight: 15 },
  { itemId: 'SPEAR', weight: 20 },
  { itemId: 'BONES', weight: 35 },
  { itemId: 'BANDAGE', weight: 18 },
  { itemId: 'COIN', weight: 20 },
  { itemId: 'CLUB', weight: 15 },
  { itemId: 'CUDGEL', weight: 12 },
  { itemId: 'ROPE', weight: 10 },
  { itemId: 'LEATHER_BOOTS', weight: 8 },
];

const RUINS_ITEMS: SpawnTableEntry[] = [
  { itemId: 'POTTERY_SHARD', weight: 50 },
  { itemId: 'BROKEN_POTTERY', weight: 45 },
  { itemId: 'COIN', weight: 15 },
  { itemId: 'OBSIDIAN_BLADE', weight: 10, maxEra: 1500 },
  { itemId: 'JADE_BEAD', weight: 8 },
  { itemId: 'CLAY_LAMP', weight: 20 },
  { itemId: 'SCROLL', weight: 12 },
  { itemId: 'BOOK', weight: 8, minEra: 800 },
  { itemId: 'FLINT_STONE', weight: 15 },
  { itemId: 'AMBER', weight: 5 },
];

const TREASURE_ITEMS: SpawnTableEntry[] = [
  { itemId: 'GOLD_ORE', weight: 2 },
  { itemId: 'SILVER_ORE', weight: 5 },
  { itemId: 'AMBER', weight: 8 },
  { itemId: 'JADE_BEAD', weight: 4 },
  { itemId: 'TURQUOISE_BEAD', weight: 6 },
  { itemId: 'PEARL', weight: 1 },
  { itemId: 'CORAL_BRANCH', weight: 7 },
  { itemId: 'IVORY_TUSK', weight: 1.5 },
  { itemId: 'GOLD_BAR', weight: 0.5 },
  { itemId: 'OBSIDIAN_SHARD', weight: 10 },
];

// --- BIOME TO SPAWN TABLE MAPPING ---

function getSpawnTablesForBiome(biome: BiomeType): SpawnTableEntry[][] {
  const tables: SpawnTableEntry[][] = [];

  // Water biomes
  if ([BiomeType.DEEP_OCEAN, BiomeType.SHALLOW_OCEAN, BiomeType.BEACH,
       BiomeType.RIVER, BiomeType.RIVERBANK, BiomeType.FRESHWATER_LAKE,
       BiomeType.ESTUARY, BiomeType.REEF, BiomeType.MANGROVE].includes(biome)) {
    tables.push(WATER_ITEMS);
  }

  // Forest biomes
  if ([BiomeType.FOREST, BiomeType.DENSE_FOREST, BiomeType.JUNGLE, BiomeType.TAIGA].includes(biome)) {
    tables.push(FOREST_ITEMS);
    tables.push(NATURAL_MATERIALS);
  }

  // Desert biomes
  if ([BiomeType.DESERT, BiomeType.OASIS, BiomeType.BADLANDS].includes(biome)) {
    tables.push(DESERT_ITEMS);
  }

  // Mountain biomes
  if ([BiomeType.MOUNTAIN, BiomeType.HIGH_PEAK, BiomeType.HILLS, BiomeType.ALPINE_MEADOW].includes(biome)) {
    tables.push(MOUNTAIN_ITEMS);
    tables.push(NATURAL_MATERIALS);
  }

  // Urban biomes
  if ([BiomeType.HAMLET, BiomeType.LOW_DENSITY_CITY, BiomeType.DENSE_CITY,
       BiomeType.CITY_CENTER, BiomeType.MARKETPLACE, BiomeType.URBAN].includes(biome)) {
    tables.push(URBAN_ITEMS);
  }

  // Grassland biomes
  if ([BiomeType.GRASSLAND, BiomeType.PRAIRIE, BiomeType.STEPPE, BiomeType.SAVANNA].includes(biome)) {
    tables.push(NATURAL_MATERIALS);
    tables.push(JUNK_ITEMS);
  }

  // Ruins
  if (biome === BiomeType.RUINS) {
    tables.push(RUINS_ITEMS);
  }

  // Roads
  if (biome === BiomeType.ROAD) {
    tables.push(ROAD_ITEMS);
    tables.push(JUNK_ITEMS);
  }

  // Wetlands
  if ([BiomeType.WETLANDS, BiomeType.MANGROVE].includes(biome)) {
    tables.push(WATER_ITEMS);
    tables.push(NATURAL_MATERIALS);
  }

  // Always include junk as fallback
  if (tables.length === 0) {
    tables.push(JUNK_ITEMS);
  }

  return tables;
}

/**
 * Get spawn context for a specific tile
 */
function getSpawnContext(map: MapData, x: number, y: number): SpawnContext {
  const tile = map.tiles[y][x];
  let nearWater = false;
  let nearUrban = false;
  let nearRuins = false;

  // Check surrounding tiles
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      const checkY = y + dy;
      const checkX = x + dx;
      if (checkY >= 0 && checkY < map.height && checkX >= 0 && checkX < map.width) {
        const checkTile = map.tiles[checkY][checkX];

        if (!checkTile.isLand) nearWater = true;

        if ([BiomeType.HAMLET, BiomeType.LOW_DENSITY_CITY, BiomeType.DENSE_CITY,
             BiomeType.CITY_CENTER, BiomeType.MARKETPLACE].includes(checkTile.biome)) {
          nearUrban = true;
        }

        if (checkTile.biome === BiomeType.RUINS) {
          nearRuins = true;
        }
      }
    }
  }

  return {
    biome: tile.biome,
    nearWater,
    nearUrban,
    nearRuins,
    isRoad: tile.biome === BiomeType.ROAD,
    isBattlefield: false, // TODO: Add battlefield detection via map data
  };
}

/**
 * Weighted random selection from spawn table
 */
function selectItemFromTable(table: SpawnTableEntry[], year: number): string | null {
  // Filter by era
  const validItems = table.filter(entry => {
    if (entry.minEra && year < entry.minEra) return false;
    if (entry.maxEra && year > entry.maxEra) return false;
    return true;
  });

  if (validItems.length === 0) return null;

  // Calculate total weight
  const totalWeight = validItems.reduce((sum, entry) => sum + entry.weight, 0);

  // Random selection
  let random = Math.random() * totalWeight;
  for (const entry of validItems) {
    random -= entry.weight;
    if (random <= 0) {
      return entry.itemId;
    }
  }

  return validItems[validItems.length - 1].itemId;
}

/**
 * Determine if an item should spawn at this location
 */
function shouldSpawnItem(context: SpawnContext, baseChance: number): boolean {
  let chance = baseChance;

  // Multipliers based on context
  if (context.isRoad) chance *= 2.0;
  if (context.nearRuins) chance *= 1.5;
  if (context.isBattlefield) chance *= 3.0;
  if (context.nearUrban) chance *= 1.3;

  // Special biome multipliers
  if (context.biome === BiomeType.RUINS) chance *= 2.5;
  if (context.biome === BiomeType.BEACH) chance *= 1.8;
  if (context.biome === BiomeType.MARKETPLACE) chance *= 1.5;

  return Math.random() < chance;
}

/**
 * Spawn ground items across the map during generation
 */
export function spawnGroundItems(
  map: MapData,
  year: number,
  density: 'sparse' | 'normal' | 'abundant' = 'normal'
): Array<{ x: number; y: number; item: Item }> {
  const spawnedItems: Array<{ x: number; y: number; item: Item }> = [];

  // Base spawn chance per tile
  const baseChances = {
    sparse: 0.004,    // ~0.4% per tile
    normal: 0.008,    // ~0.8% per tile
    abundant: 0.015   // ~1.5% per tile
  };

  const baseChance = baseChances[density];

  // Iterate through map tiles
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      const tile = map.tiles[y][x];

      // Skip water tiles (except beaches)
      if (!tile.isLand && tile.biome !== BiomeType.BEACH) continue;

      // Skip impassable terrain
      if ([BiomeType.CLIFF, BiomeType.ACTIVE_LAVA, BiomeType.HIGH_PEAK].includes(tile.biome)) {
        continue;
      }

      const context = getSpawnContext(map, x, y);

      // Check if item should spawn here
      if (!shouldSpawnItem(context, baseChance)) continue;

      // Get appropriate spawn tables
      const tables = getSpawnTablesForBiome(context.biome);

      // Add context-specific tables
      if (context.nearRuins) tables.push(RUINS_ITEMS);
      if (context.isBattlefield) tables.push(BATTLEFIELD_ITEMS);
      if (context.isRoad) tables.push(ROAD_ITEMS);

      // Very rare chance for treasure
      if (Math.random() < 0.0002) {
        tables.push(TREASURE_ITEMS);
      }

      // Select random table
      if (tables.length === 0) continue;
      const selectedTable = tables[Math.floor(Math.random() * tables.length)];

      // Select item from table
      const itemId = selectItemFromTable(selectedTable, year);
      if (!itemId) continue;

      // Check if item exists in definitions
      const itemDef = ITEM_DEFINITIONS[itemId];
      if (!itemDef) {
        console.warn(`[GroundSpawn] Item ${itemId} not found in definitions`);
        continue;
      }

      // Create item instance
      const item = createItemInstance(itemId, 'poor'); // Ground items are usually poor quality

      spawnedItems.push({ x, y, item });
    }
  }

  console.log(`[GroundSpawn] Spawned ${spawnedItems.length} items across map (density: ${density})`);
  return spawnedItems;
}

/**
 * Spawn a single item at a specific location (for dynamic spawning)
 */
export function spawnSingleGroundItem(
  map: MapData,
  x: number,
  y: number,
  year: number
): Item | null {
  const context = getSpawnContext(map, x, y);
  const tables = getSpawnTablesForBiome(context.biome);

  if (tables.length === 0) return null;

  const selectedTable = tables[Math.floor(Math.random() * tables.length)];
  const itemId = selectItemFromTable(selectedTable, year);

  if (!itemId) return null;

  const itemDef = ITEM_DEFINITIONS[itemId];
  if (!itemDef) return null;

  return createItemInstance(itemId, 'poor');
}

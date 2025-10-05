/**
 * types/core/tile.ts - Core Tile type definitions for the Spice Trader Map Generator
 */

import { BiomeType } from '../biomes/base';
import { PathObject } from './map';
import { TerrainStructure } from '../structures';

/**
 * PathType enum to distinguish between roads and paths
 */
export enum PathType {
  ROAD = 'ROAD',
  PATH = 'PATH',
  FENCE = 'FENCE', // Added for Animal Paddocks
  MODERN_ROAD = 'MODERN_ROAD', // Asphalt roads for 20th century+
  RAILROAD = 'RAILROAD', // Railroad tracks for industrial era
}

/**
 * TileQualities - Procedurally generated attributes that affect gameplay
 * All values are normalized between 0.0 and 1.0 for consistency
 */
export interface TileQualities {
  /** 
   * Flammability (0.0 - 1.0)
   * How likely this tile is to catch fire and spread flames
   * Higher values = more fire risk, lower values = fire resistant
   */
  flammability: number;
  
  /** 
   * Biodiversity (0.0 - 1.0) 
   * Richness of plant and animal life in this tile
   * Higher values = more species, better hunting/foraging
   */
  biodiversity: number;
  
  /** 
   * Healthiness (0.0 - 1.0)
   * How conducive this tile is to human health and longevity
   * Higher values = healthier, lower values = disease risk
   */
  healthiness: number;
  
  /** 
   * Sacrality (0.0 - 1.0)
   * Religious and cultural significance of this location
   * Higher values = more sacred, potential for temples/shrines
   */
  sacrality: number;
  
  /** 
   * Safety (0.0 - 1.0)
   * Overall danger level combining natural and human threats
   * Higher values = safer, lower values = more dangerous
   */
  safety: number;
  geologicalStress?: number; // How much tectonic stress the tile is under
  thermalActivity?: number; // Proximity to geothermal/volcanic heat
}

/**
 * Overlay object that can be placed on top of a tile
 * This allows furniture and objects to render over floor tiles
 */
export interface OverlayObject {
  type: OverlayObjectType;    // Type of object (chair, table, etc.)
  rotation: number;            // Rotation in degrees (0, 90, 180, 270)
  variant?: string;            // Optional variant for cultural differences
  material?: string;           // Optional material override (wood, stone, etc.)
}

/**
 * Core Tile interface representing a single map cell
 * Now includes rich quality attributes for complex gameplay systems
 */
export interface Tile {
  x: number;
  y: number;
  altitude: number;
  biome: BiomeType;
  isLand: boolean;
  isCoast: boolean;
  qualities: TileQualities;
  vegetationId?: string; // ID of the vegetation entity on this tile
  pathObjectRef?: PathObject; // For pathfinding cost calculation
  // Optional properties for new features
  ruinType?: string; // For Ruins
  ruinVariant?: string; // Specific ruin symbol variant to use
  ruinMaterial?: string; // Material the ruin is made from (sandstone, granite, etc)
  ruinStyle?: string; // Architectural style (tower, temple, pagoda, etc)
  culturalZone?: string; // Cultural zone for culture-specific rendering
  palaceType?: string; // For Palaces
  holyPlaceType?: string; // For Holy Places
  holyPlaceReligion?: string; // Specific religion of this holy place
  paddockType?: string; // For Animal Paddocks
  isRoad?: boolean; // For pathfinding/NPC behavior
  structure?: TerrainStructure; // For any structure on the tile
  population?: number; // NEW: For settlements
  allegianceBreakdown?: { [faction: string]: number }; // NEW: Faction loyalty breakdown
  dominantReligions?: { name: string; percentage: number }[];
  cropType?: string; // NEW: For Farmland
  mineralDeposit?: { metalId: string; quantity: number }; // NEW: For mineral deposits
  cityName?: string; // NEW: Name of the city this tile belongs to
  cityDescription?: string; // NEW: Description of the city
  hasFishingHut?: boolean; // NEW: Marker for fishing hut placement
  
  // NEW: Overlay system for furniture and objects
  overlayObject?: OverlayObject; // Object that overlays this tile (chair, table, etc.)
  secondaryOverlay?: OverlayObject; // Secondary overlay for items on furniture (e.g., food on tables)
  isBlocking?: boolean; // Whether this tile blocks movement (can be from overlay or base biome)
  
  // Collectible item system for special maps
  collectibleItem?: {
    item: any; // Item type from inventory system
    collected: boolean;
    containerType?: OverlayObjectType; // If item is in a container (CHEST, BARREL, etc.)
    ownerNpc?: string; // ID of NPC who owns this item/container
    isValuable?: boolean; // Whether taking this triggers theft awareness
  };

  // Bridge system - allows crossing water tiles
  hasBridge?: boolean; // Whether this tile has a bridge over it
  bridgeId?: string; // ID of the bridge structure on this tile
}

/**
 * Enum for overlay object types
 * These objects render on top of floor tiles instead of replacing them
 */
export enum OverlayObjectType {
  // Furniture
  CHAIR = 'CHAIR',
  TABLE = 'TABLE',
  DESK = 'DESK',
  BOOKSHELF = 'BOOKSHELF',
  CHEST = 'CHEST',
  BED = 'BED',
  THRONE = 'THRONE',
  BENCH = 'BENCH',
  CABINET = 'CABINET',
  
  // Decorative
  BRAZIER = 'BRAZIER',
  TORCH = 'TORCH',
  LANTERN = 'LANTERN',
  FIRE_PIT = 'FIRE_PIT',
  COLUMN = 'COLUMN',
  STATUE = 'STATUE',
  FOUNTAIN = 'FOUNTAIN',
  PODIUM = 'PODIUM',
  ALTAR = 'ALTAR',
  
  // Functional
  DOOR = 'DOOR',
  WEAPON_RACK = 'WEAPON_RACK',
  ARMOR_STAND = 'ARMOR_STAND',
  MIRROR = 'MIRROR',
  BASIN = 'BASIN',
  KITCHEN_STOVE = 'KITCHEN_STOVE',
  KITCHEN_COUNTER = 'KITCHEN_COUNTER',
  KITCHEN_SINK = 'KITCHEN_SINK',
  
  // Storage
  BARREL = 'BARREL',
  FILING_CABINET = 'FILING_CABINET',
  CRATE = 'CRATE',
  SACK = 'SACK',
  COAT_RACK = 'COAT_RACK',
  
  // Seating
  CUSHION = 'CUSHION',
  STOOL = 'STOOL',
  MEDITATION_MAT = 'MEDITATION_MAT',
  
  // Decorative Extended
  BANNER = 'BANNER',
  TAPESTRY = 'TAPESTRY',
  RUG = 'RUG',
  VASE = 'VASE',
  PLANTER = 'PLANTER',

  INCENSE_BURNER = 'INCENSE_BURNER',
  PILLAR = 'PILLAR',
  
  // Functional Extended
  ANVIL = 'ANVIL',
  WORKBENCH = 'WORKBENCH',
  LOOM = 'LOOM',
  SPINNING_WHEEL = 'SPINNING_WHEEL',
  PRINTING_PRESS = 'PRINTING_PRESS',
  LECTERN = 'LECTERN',
  BELL = 'BELL',
  GONG = 'GONG',
  
  // Market/Trade
  STALL = 'STALL',
  DISPLAY_CASE = 'DISPLAY_CASE',
  COUNTER = 'COUNTER',
  SCALE = 'SCALE',
  
  // Religious/Sacred
  SHRINE = 'SHRINE',
  IDOL = 'IDOL',
  OFFERING_TABLE = 'OFFERING_TABLE',
  PRAYER_MAT = 'PRAYER_MAT',
  CANDELABRA = 'CANDELABRA',
  
  // Native American / Indigenous
  TOTEM_POLE = 'TOTEM_POLE',
  DRUM = 'DRUM',
  ROCK = 'ROCK',
  LADDER = 'LADDER',
  WELL = 'WELL',
  BUFFALO_SKULL = 'BUFFALO_SKULL',
  MEDICINE_BUNDLE = 'MEDICINE_BUNDLE',
  PEACE_PIPE = 'PEACE_PIPE',
  DREAM_CATCHER = 'DREAM_CATCHER',
  
  // Multi-tile 
  PILLAR_BASE = 'PILLAR_BASE',
  PILLAR_TOP = 'PILLAR_TOP',
  TABLE_LEFT = 'TABLE_LEFT',
  TABLE_CENTER = 'TABLE_CENTER',
  TABLE_RIGHT = 'TABLE_RIGHT',

  // Phase 1.3 Directional Furniture Variants
  BENCH_EAST_WEST = 'BENCH_EAST_WEST',
  BENCH_NORTH_SOUTH = 'BENCH_NORTH_SOUTH',
  DESK_FACING_NORTH = 'DESK_FACING_NORTH',
  DESK_FACING_SOUTH = 'DESK_FACING_SOUTH',
  DESK_FACING_EAST = 'DESK_FACING_EAST',
  DESK_FACING_WEST = 'DESK_FACING_WEST',
  BED_HORIZONTAL = 'BED_HORIZONTAL',
  BED_VERTICAL = 'BED_VERTICAL',
  BOOKSHELF_AGAINST_NORTH_WALL = 'BOOKSHELF_AGAINST_NORTH_WALL',
  BOOKSHELF_AGAINST_SOUTH_WALL = 'BOOKSHELF_AGAINST_SOUTH_WALL',
  BOOKSHELF_AGAINST_EAST_WALL = 'BOOKSHELF_AGAINST_EAST_WALL',
  BOOKSHELF_AGAINST_WEST_WALL = 'BOOKSHELF_AGAINST_WEST_WALL',

  // Phase 1.3 Cultural Decoration Symbols
  EUROPEAN_HERALDIC_SHIELD = 'EUROPEAN_HERALDIC_SHIELD',
  EAST_ASIAN_DECORATIVE_SCROLL = 'EAST_ASIAN_DECORATIVE_SCROLL',
  MENA_DECORATIVE_TILE_PANEL = 'MENA_DECORATIVE_TILE_PANEL',
  AFRICAN_DECORATIVE_MASK = 'AFRICAN_DECORATIVE_MASK',
  INDIGENOUS_DECORATIVE_DREAMCATCHER = 'INDIGENOUS_DECORATIVE_DREAMCATCHER',
  
  // Phase 2.1 Advanced Multi-Tile Furniture
  TABLE_CORNER = 'TABLE_CORNER',
  TABLE_ROUND_SMALL = 'TABLE_ROUND_SMALL',
  TABLE_ROUND_MEDIUM_CENTER = 'TABLE_ROUND_MEDIUM_CENTER',
  TABLE_ROUND_MEDIUM_TOP = 'TABLE_ROUND_MEDIUM_TOP',
  TABLE_ROUND_MEDIUM_BOTTOM = 'TABLE_ROUND_MEDIUM_BOTTOM',
  TABLE_ROUND_MEDIUM_LEFT = 'TABLE_ROUND_MEDIUM_LEFT',
  TABLE_ROUND_MEDIUM_RIGHT = 'TABLE_ROUND_MEDIUM_RIGHT',
  TABLE_ROUND_MEDIUM_TOP_LEFT = 'TABLE_ROUND_MEDIUM_TOP_LEFT',
  TABLE_ROUND_MEDIUM_TOP_RIGHT = 'TABLE_ROUND_MEDIUM_TOP_RIGHT',
  TABLE_ROUND_MEDIUM_BOTTOM_LEFT = 'TABLE_ROUND_MEDIUM_BOTTOM_LEFT',
  TABLE_ROUND_MEDIUM_BOTTOM_RIGHT = 'TABLE_ROUND_MEDIUM_BOTTOM_RIGHT',
  TABLE_ROUND_LARGE = 'TABLE_ROUND_LARGE',
  BANQUET_TABLE_TOP_LEFT = 'BANQUET_TABLE_TOP_LEFT',
  BANQUET_TABLE_TOP_CENTER = 'BANQUET_TABLE_TOP_CENTER',
  BANQUET_TABLE_TOP_RIGHT = 'BANQUET_TABLE_TOP_RIGHT',
  BANQUET_TABLE_BOTTOM_LEFT = 'BANQUET_TABLE_BOTTOM_LEFT',
  BANQUET_TABLE_BOTTOM_CENTER = 'BANQUET_TABLE_BOTTOM_CENTER',
  BANQUET_TABLE_BOTTOM_RIGHT = 'BANQUET_TABLE_BOTTOM_RIGHT',
  FOUR_POSTER_BED_TOP_LEFT = 'FOUR_POSTER_BED_TOP_LEFT',
  FOUR_POSTER_BED_TOP_RIGHT = 'FOUR_POSTER_BED_TOP_RIGHT',
  FOUR_POSTER_BED_MIDDLE_LEFT = 'FOUR_POSTER_BED_MIDDLE_LEFT',
  FOUR_POSTER_BED_MIDDLE_RIGHT = 'FOUR_POSTER_BED_MIDDLE_RIGHT',
  FOUR_POSTER_BED_BOTTOM_LEFT = 'FOUR_POSTER_BED_BOTTOM_LEFT',
  FOUR_POSTER_BED_BOTTOM_RIGHT = 'FOUR_POSTER_BED_BOTTOM_RIGHT',
  DAYBED_HEAD = 'DAYBED_HEAD',
  DAYBED_MIDDLE = 'DAYBED_MIDDLE',
  DAYBED_FOOT = 'DAYBED_FOOT',
  BOOTH_BACK = 'BOOTH_BACK',
  BOOTH_FRONT = 'BOOTH_FRONT',
  THEATER_SEAT_LEFT = 'THEATER_SEAT_LEFT',
  THEATER_SEAT_CENTER = 'THEATER_SEAT_CENTER',
  THEATER_SEAT_RIGHT = 'THEATER_SEAT_RIGHT',
  
  // Phase 2.2 Lighting Variants
  CHANDELIER = 'CHANDELIER',
  CHANDELIER_CRYSTAL = 'CHANDELIER_CRYSTAL',
  CHANDELIER_IRON = 'CHANDELIER_IRON',
  CHANDELIER_WOODEN = 'CHANDELIER_WOODEN',
  HANGING_LANTERN = 'HANGING_LANTERN',
  PAPER_LANTERN = 'PAPER_LANTERN',
  CANDLE = 'CANDLE',
  CANDELABRA_FLOOR = 'CANDELABRA_FLOOR',
  CANDELABRA_TABLE = 'CANDELABRA_TABLE',
  OIL_LAMP = 'OIL_LAMP',
  ELECTRIC_LAMP = 'ELECTRIC_LAMP',
  FLOOR_LAMP = 'FLOOR_LAMP',
  WALL_SCONCE = 'WALL_SCONCE',
  WALL_TORCH = 'WALL_TORCH',
  FIREPLACE = 'FIREPLACE',
  FIREPLACE_STONE = 'FIREPLACE_STONE',
  FIREPLACE_BRICK = 'FIREPLACE_BRICK',
  FIREPLACE_MARBLE = 'FIREPLACE_MARBLE',
  HEARTH = 'HEARTH',
  HEARTH_COOKING = 'HEARTH_COOKING',
  STOVE_WOOD = 'STOVE_WOOD',
  STOVE_COAL = 'STOVE_COAL',
  
  // Phase 2.3 Storage & Utility Furniture
  WINE_RACK = 'WINE_RACK',
  SPICE_CABINET = 'SPICE_CABINET',
  SPICE_RACK = 'SPICE_RACK',
  TOOL_CHEST = 'TOOL_CHEST',
  TOOL_CABINET = 'TOOL_CABINET',
  TOOL_RACK = 'TOOL_RACK',
  CHEST_ORNATE = 'CHEST_ORNATE',
  CHEST_REINFORCED = 'CHEST_REINFORCED',
  ARMOIRE = 'ARMOIRE',
  WARDROBE = 'WARDROBE',
  PANTRY_CABINET = 'PANTRY_CABINET',
  TANSU = 'TANSU',
  RICE_CHEST = 'RICE_CHEST',
  SCROLL_RACK = 'SCROLL_RACK',
  LACQUER_BOX = 'LACQUER_BOX',
  CEDAR_CHEST = 'CEDAR_CHEST',
  GRANARY_BASKET = 'GRANARY_BASKET',
  WOVEN_CHEST = 'WOVEN_CHEST',
  BASKET = 'BASKET',
  REFRIGERATOR = 'REFRIGERATOR',
  ICE_BOX = 'ICE_BOX',
  STOVE_ELECTRIC = 'STOVE_ELECTRIC',
  OVEN_ELECTRIC = 'OVEN_ELECTRIC',
  OVEN_BRICK = 'OVEN_BRICK',
  KITCHEN_SINK_MODERN = 'KITCHEN_SINK_MODERN',
  SINK_MODERN = 'SINK_MODERN',
  BATH_MODERN = 'BATH_MODERN',
  BATH_CLAWFOOT = 'BATH_CLAWFOOT',
  SHOWER = 'SHOWER',
  CHAMBER_POT = 'CHAMBER_POT',

  // Food & Drink Items (for table settings)
  PLATE_WITH_FOOD = 'PLATE_WITH_FOOD',
  BOWL_WITH_FOOD = 'BOWL_WITH_FOOD',
  GOBLET = 'GOBLET',
  MUG = 'MUG',
  WINE_BOTTLE = 'WINE_BOTTLE',
  SAKE_BOTTLE = 'SAKE_BOTTLE',
  TEA_POT = 'TEA_POT',
  BREAD_LOAF = 'BREAD_LOAF',
  CHEESE_WHEEL = 'CHEESE_WHEEL',
  FRUIT_BOWL = 'FRUIT_BOWL',
  ROASTED_MEAT = 'ROASTED_MEAT',
  FISH_PLATTER = 'FISH_PLATTER',
  RICE_BOWL = 'RICE_BOWL',
  CHOPSTICKS = 'CHOPSTICKS',
  CUTLERY = 'CUTLERY',
  CANDLE_STICK = 'CANDLE_STICK'
}

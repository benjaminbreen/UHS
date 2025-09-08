

/**
 * types/biomes/base.ts - Base BiomeType definition
 */

export enum BiomeType {
  DEEP_OCEAN = 'DEEP_OCEAN',
  SHALLOW_OCEAN = 'SHALLOW_OCEAN',
  BEACH = 'BEACH',
  GRASSLAND = 'GRASSLAND',
  FOREST = 'FOREST',
  DENSE_FOREST = 'DENSE_FOREST',
  HILLS = 'HILLS',
  MOUNTAIN = 'MOUNTAIN',
  HIGH_PEAK = 'HIGH_PEAK',
  SNOW = 'SNOW', 
  RIVER = 'RIVER',
  MAJOR_RIVER = 'MAJOR_RIVER', 
  RIVERBANK = 'RIVERBANK',
  HAMLET = 'HAMLET',
  LOW_DENSITY_CITY = 'LOW_DENSITY_CITY',
  DENSE_CITY = 'DENSE_CITY',
  URBAN = 'URBAN', // Legacy
  JUNGLE = 'JUNGLE',     
  DESERT = 'DESERT',     
  OASIS = 'OASIS',       
  WETLANDS = 'WETLANDS',
  REEF = 'REEF',         
  SCRUB = 'SCRUB',

  TUNDRA = 'TUNDRA',
  STEPPE = 'STEPPE',
  MANGROVE = 'MANGROVE',
  VOLCANIC_SOIL = 'VOLCANIC_SOIL',
  VOLCANIC_ROCK = 'VOLCANIC_ROCK',
  ACTIVE_LAVA = 'ACTIVE_LAVA',
  SHOALS_TILE = 'SHOALS_TILE', // Specific tile type for shoals areas
  SALT_FLATS = 'SALT_FLATS',
  HOT_SPRINGS = 'HOT_SPRINGS',
  RUINS = 'RUINS',
  ESTUARY = 'ESTUARY',
  FRESHWATER_LAKE = 'FRESHWATER_LAKE',
  CLIFF = 'CLIFF',
  PALACE = 'PALACE',
  HOLY_SITE = 'HOLY_SITE',
  FARMLAND = 'FARMLAND',
  MARKETPLACE = 'MARKETPLACE',
  GOVERNMENT_DISTRICT = 'GOVERNMENT_DISTRICT',
  CITY_CENTER = 'CITY_CENTER',
  PARK = 'PARK', // Modern urban parks and green spaces
  ROAD = 'ROAD', // Modern paved roads
  PLAZA = 'PLAZA', // Public squares and gathering spaces
  HARBOR_DISTRICT = 'HARBOR_DISTRICT', // Port areas with docks and warehouses
  INDUSTRIAL_DISTRICT = 'INDUSTRIAL_DISTRICT', // Factories and industrial zones
  
  // Ethereal realm biomes (only used in special zones)
  AIR = 'AIR', // Ethereal air - clouds, darkness, storms, or ice based on climate
  UNDERSEA = 'UNDERSEA', // Glowing underwater realm
  
  // Architectural biomes for special maps
  WALL = 'WALL',
  WALL_GATE = 'WALL_GATE',
  WALL_WINDOW = 'WALL_WINDOW',
  WALL_BACK = 'WALL_BACK',  // Back wall for 3/4 perspective
  WALL_BACK_WINDOW = 'WALL_BACK_WINDOW',  // Back wall with window
  WALL_BACK_DOOR = 'WALL_BACK_DOOR',  // Back wall with door
  DOOR = 'DOOR',
  DOOR_LOCKED = 'DOOR_LOCKED',
  ARCHWAY = 'ARCHWAY',
  ENTRANCE_PORTAL = 'ENTRANCE_PORTAL', // Glowing entrance to inner sanctum
  PATH = 'PATH', // Stone/brick path for navigation in special maps
  
  // Floors - Basic
  FLOOR_STONE = 'FLOOR_STONE',
  FLOOR_WOOD = 'FLOOR_WOOD',
  FLOOR_MARBLE = 'FLOOR_MARBLE',
  FLOOR_TILE = 'FLOOR_TILE',
  FLOOR_CARPET = 'FLOOR_CARPET',
  
  // Floors - Decorative
  FLOOR_MOSAIC = 'FLOOR_MOSAIC',
  FLOOR_MOSAIC_CENTER = 'FLOOR_MOSAIC_CENTER',
  FLOOR_MOSAIC_BORDER = 'FLOOR_MOSAIC_BORDER',
  FLOOR_PATTERN = 'FLOOR_PATTERN',
  FLOOR_CHECKERED = 'FLOOR_CHECKERED',
  
  // Furniture - Seating
  TABLE = 'TABLE',
  TABLE_LEFT = 'TABLE_LEFT',     // Multi-tile table left end
  TABLE_CENTER = 'TABLE_CENTER',  // Multi-tile table center (repeatable)
  TABLE_RIGHT = 'TABLE_RIGHT',    // Multi-tile table right end
  CHAIR = 'CHAIR',
  BENCH = 'BENCH',
  THRONE = 'THRONE',
  DESK = 'DESK',
  PODIUM = 'PODIUM',
  
  // Furniture - Storage
  BOOKSHELF = 'BOOKSHELF',
  CABINET = 'CABINET',
  CHEST = 'CHEST',
  SHELF = 'SHELF',
  COAT_RACK = 'COAT_RACK',
  
  // Bathroom
  TOILET = 'TOILET',
  BASIN = 'BASIN',
  BATH = 'BATH',
  MIRROR = 'MIRROR',
  
  // Kitchen
  KITCHEN_STOVE = 'KITCHEN_STOVE',
  KITCHEN_COUNTER = 'KITCHEN_COUNTER',
  KITCHEN_SINK = 'KITCHEN_SINK',
  PANTRY = 'PANTRY',
  
  // Features
  COLUMN = 'COLUMN',
  FOUNTAIN = 'FOUNTAIN',
  STATUE = 'STATUE',
  PAVILION = 'PAVILION',
  ALTAR = 'ALTAR',
  STAGE = 'STAGE',
  PLANTER = 'PLANTER',
  RUG = 'RUG',
  
  // Office/Administrative
  FILING_CABINET = 'FILING_CABINET',
  DOCUMENT_TABLE = 'DOCUMENT_TABLE',
  SCROLL_RACK = 'SCROLL_RACK',
  SEAL_STAND = 'SEAL_STAND',
  
  // Security
  GUARD_POST = 'GUARD_POST',
  WEAPON_RACK = 'WEAPON_RACK',
  ARMOR_STAND = 'ARMOR_STAND',
  
  // Functional
  WORKSHOP = 'WORKSHOP',
  CELL = 'CELL',
  TREASURY = 'TREASURY',
  STAIRS_UP = 'STAIRS_UP',
  STAIRS_DOWN = 'STAIRS_DOWN',
  
  // Additional Architectural Elements
  FIRE_PIT = 'FIRE_PIT',
  HEARTH = 'HEARTH',  // Indoor fireplace/hearth for great halls
  BRAZIER = 'BRAZIER',
  TORCH = 'TORCH',
  LANTERN = 'LANTERN',
  PILLAR = 'PILLAR',
  BED = 'BED',
  BARREL = 'BARREL',
  DIRT = 'DIRT',
  DIRT_PATH = 'DIRT_PATH',
  FLOOR_DIRT = 'FLOOR_DIRT',
  SHRINE = 'SHRINE',
  TREE = 'TREE',
  CARPET = 'CARPET',
  
  // Natural ground types for special maps
  GRASS_GROUND = 'GRASS_GROUND',
  DIRT_GROUND = 'DIRT_GROUND',
  STONE_GROUND = 'STONE_GROUND',
  WALL_LOW = 'WALL_LOW', // Low walls for tribal structures
}
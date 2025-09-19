/**
 * services/biomeFootstepService.ts - Maps biomes to appropriate footstep sounds
 */

import { BiomeType } from '../types/biomes/base';

export type FootstepMaterial = 'stone' | 'marble' | 'wood' | 'carpet' | 'tile' | 'tatami' | 'metal' | 'sand' | 'rustle' | 'bell';

/**
 * Maps biome types to appropriate footstep materials
 * Default: tatami (subtle, natural sound)
 * Stone: harder terrain (stone surfaces, ruins, etc.)
 * Sand: rough terrain (deserts, mountains, volcanic areas)
 */
export const BIOME_FOOTSTEP_MAPPING: Record<BiomeType, FootstepMaterial> = {
  // === Water/Ocean (no footsteps, but if walking on shore) ===
  DEEP_OCEAN: 'sand',
  SHALLOW_OCEAN: 'sand',
  SHOALS_TILE: 'sand',
  UNDERSEA: 'sand',

  // === Natural Soft Terrain (default tatami) ===
  GRASSLAND: 'tatami',

  // === Forest Terrain (rustle) ===
  FOREST: 'rustle',
  DENSE_FOREST: 'rustle',
  JUNGLE: 'rustle',
  WETLANDS: 'tatami',
  MANGROVE: 'tatami',
  FARMLAND: 'tatami',
  PARK: 'tatami',
  OASIS: 'tatami',
  ESTUARY: 'tatami',
  RIVERBANK: 'tatami',

  // === Rivers and Lakes (soft/muddy) ===
  RIVER: 'tatami',
  MAJOR_RIVER: 'tatami',
  FRESHWATER_LAKE: 'tatami',

  // === Medium Terrain (stone) ===
  HILLS: 'stone',
  SNOW: 'stone',
  BEACH: 'stone',
  CLIFF: 'stone',
  RUINS: 'marble',
  HOT_SPRINGS: 'stone',

  // === Natural Soft/Medium Terrain (tatami) ===
  STEPPE: 'tatami',
  SCRUB: 'tatami',
  TUNDRA: 'tatami',

  // === Hard/Rough Terrain (sand - roughest) ===
  MOUNTAIN: 'sand',
  HIGH_PEAK: 'sand',
  DESERT: 'sand',
  VOLCANIC_SOIL: 'sand',
  VOLCANIC_ROCK: 'sand',
  ACTIVE_LAVA: 'sand',
  SALT_FLATS: 'sand',
  REEF: 'sand',

  // === Urban/Civilized Areas ===
  HAMLET: 'tatami',          // Small settlements, mostly natural
  LOW_DENSITY_CITY: 'stone', // Some paved areas
  DENSE_CITY: 'stone',       // Paved streets
  URBAN: 'stone',            // Legacy urban
  CITY_CENTER: 'tile',       // More formal/paved
  MARKETPLACE: 'bell',       // Merchant bell sounds
  PLAZA: 'tile',             // Formal plaza stones
  HARBOR_DISTRICT: 'stone',  // Dock planks/stone
  INDUSTRIAL_DISTRICT: 'metal', // Metal grating/industrial surfaces
  ROAD: 'stone',             // Paved roads

  // === Formal/Religious Buildings ===
  PALACE: 'marble',          // Elegant marble floors
  HOLY_SITE: 'marble',       // Sacred stone/marble
  GOVERNMENT_DISTRICT: 'tile', // Formal government buildings

  // === Ethereal/Special ===
  AIR: 'tatami',             // Soft ethereal sound

  // === Special Map Architecture ===
  WALL: 'stone',
  WALL_GATE: 'stone',
  WALL_WINDOW: 'stone',
  WALL_BACK: 'stone',
  WALL_BACK_WINDOW: 'stone',
  WALL_BACK_DOOR: 'stone',
  DOOR: 'wood',
  DOOR_LOCKED: 'wood',
  ARCHWAY: 'stone',
  ENTRANCE_PORTAL: 'marble',
  PATH: 'stone',

  // === Special Map Floors ===
  FLOOR_STONE: 'stone',
  FLOOR_WOOD: 'wood',
  FLOOR_MARBLE: 'marble',
  FLOOR_TILE: 'tile',
  FLOOR_CARPET: 'carpet',
  FLOOR_MOSAIC: 'tile',
  FLOOR_MOSAIC_CENTER: 'tile',
  FLOOR_MOSAIC_BORDER: 'tile',
  FLOOR_PATTERN: 'tile',
  FLOOR_CHECKERED: 'tile',
  FLOOR_DIRT: 'tatami',

  // === Furniture (walkable surfaces) ===
  TABLE: 'wood',
  TABLE_LEFT: 'wood',
  TABLE_CENTER: 'wood',
  TABLE_RIGHT: 'wood',
  CHAIR: 'wood',
  BENCH: 'wood',
  THRONE: 'wood',
  DESK: 'wood',
  PODIUM: 'wood',
  BOOKSHELF: 'wood',
  CABINET: 'wood',
  CHEST: 'wood',
  SHELF: 'wood',
  COAT_RACK: 'wood',

  // === Bathroom ===
  TOILET: 'tile',
  BASIN: 'tile',
  BATH: 'tile',
  MIRROR: 'tile',

  // === Kitchen ===
  KITCHEN_STOVE: 'tile',
  KITCHEN_COUNTER: 'tile',
  KITCHEN_SINK: 'tile',
  PANTRY: 'wood',

  // === Features ===
  COLUMN: 'stone',
  FOUNTAIN: 'stone',
  STATUE: 'stone',
  PAVILION: 'wood',
  ALTAR: 'marble',
  STAGE: 'wood',
  PLANTER: 'tatami',
  RUG: 'carpet',

  // === Office/Administrative ===
  FILING_CABINET: 'metal',
  DOCUMENT_TABLE: 'wood',
  SCROLL_RACK: 'wood',
  SEAL_STAND: 'wood',

  // === Security ===
  GUARD_POST: 'stone',
  WEAPON_RACK: 'metal',
  ARMOR_STAND: 'metal',

  // === Functional ===
  WORKSHOP: 'stone',
  CELL: 'stone',
  TREASURY: 'tile',
  STAIRS_UP: 'stone',
  STAIRS_DOWN: 'stone',

  // === Additional Elements ===
  FIRE_PIT: 'stone',
  HEARTH: 'stone',
  BRAZIER: 'metal',
  TORCH: 'stone',
  LANTERN: 'metal',
  PILLAR: 'stone',
  BED: 'wood',
  BARREL: 'wood',
  DIRT: 'tatami',
  DIRT_PATH: 'tatami',
  SHRINE: 'stone',
  TREE: 'tatami',
  CARPET: 'carpet',

  // === Natural Ground Types ===
  GRASS_GROUND: 'tatami',
  DIRT_GROUND: 'tatami',
  STONE_GROUND: 'stone',
  WALL_LOW: 'stone',
};

/**
 * Get the appropriate footstep material for a given biome
 */
export function getFootstepMaterial(biome: BiomeType): FootstepMaterial {
  return BIOME_FOOTSTEP_MAPPING[biome] || 'tatami';
}

/**
 * Get footstep material description for UI/debugging
 */
export function getFootstepDescription(material: FootstepMaterial): string {
  switch (material) {
    case 'tatami': return 'Soft, natural footsteps';
    case 'stone': return 'Hard stone footsteps';
    case 'marble': return 'Elegant marble footsteps';
    case 'wood': return 'Wooden footsteps';
    case 'carpet': return 'Muffled carpet footsteps';
    case 'tile': return 'Tiled surface footsteps';
    case 'metal': return 'Metallic footsteps';
    case 'sand': return 'Rough, sandy footsteps';
    case 'rustle': return 'Forest rustling footsteps';
    case 'bell': return 'Subtle merchant bell footsteps';
    default: return 'Default footsteps';
  }
}
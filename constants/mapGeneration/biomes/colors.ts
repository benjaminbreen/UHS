

/**
 * constants/mapGeneration/biomes/colors.ts - Biome and climate-specific water color definitions
 */

import { BiomeType } from '../../../types';
import { ClimateType } from '../../../types';

// ===== BIOME COLOR DEFINITIONS =====
export const BIOME_COLORS: Record<BiomeType, string> = {
  [BiomeType.OCEAN]: '#2563eb',  // Blue ocean for special maps
  [BiomeType.DEEP_OCEAN]: '#1e3a8a', 
  [BiomeType.SHALLOW_OCEAN]: '#3b82f6', 
  [BiomeType.BEACH]: '#fde895', 
  [BiomeType.GRASSLAND]: '#64a641', // lime-500
  [BiomeType.FOREST]: '#386b1e', // green-600
  [BiomeType.DENSE_FOREST]: '#14532d', // green-900
  [BiomeType.HILLS]: '#57a14a', // greener hills
  [BiomeType.MOUNTAIN]: '#8f96a0',
  [BiomeType.HIGH_PEAK]: '#e5e7eb',
  [BiomeType.SNOW]: '#ffffff', 
  [BiomeType.RIVER]: '#60a5fa', 
  [BiomeType.MAJOR_RIVER]: '#2563eb', // Will be adjusted by climate water colors
  [BiomeType.RIVERBANK]: '#77a842', // lime-400
  [BiomeType.HAMLET]: '#D2B48C', // Tan for buildings
  [BiomeType.LOW_DENSITY_CITY]: '#A9A9A9', // DarkGray for buildings/roads
  [BiomeType.DENSE_CITY]: '#808080', // Gray for dense structures
  [BiomeType.URBAN]: '#ef4444', // Legacy
  [BiomeType.JUNGLE]: '#22a33e', // emerald-500
  [BiomeType.DESERT]: '#fde68a', 
  [BiomeType.OASIS]: '#bfc478',   
  [BiomeType.WETLANDS]: '#bdbd93', 
  [BiomeType.REEF]: '#20B2AA',     
  [BiomeType.SCRUB]: '#9ca550', // More olive
  // New Biome Colors
  [BiomeType.TUNDRA]: '#a0b0a0',
  [BiomeType.STEPPE]: '#c0b070',
  [BiomeType.MANGROVE]: '#2a604a',
  [BiomeType.VOLCANIC_SOIL]: '#5c4033', // Dark brown
  [BiomeType.VOLCANIC_ROCK]: '#4a4a4a', // Dark grey (base color, pattern will be added)
  [BiomeType.ACTIVE_LAVA]: '#ff4500',   // Bright orange-red
  [BiomeType.SHOALS_TILE]: '#6ca4c8',   // Light Sky Blue - will be adjusted in getTileRenderColor based on reef
  [BiomeType.SALT_FLATS]: '#f5f5f5',    // Off-white
  [BiomeType.HOT_SPRINGS]: '#778899',   // Bluish-Grayish base for ground (water will be different)
  [BiomeType.RUINS]: '#777777',        // Neutral Grey for stone ruins, symbol will vary
  [BiomeType.ESTUARY]: '#87CEFA', // Placeholder, will be blended dynamically
  [BiomeType.FRESHWATER_LAKE]: '#2e5a9a', // Slightly lighter deep blue for base
  [BiomeType.CLIFF]: '#A08C7D', // Stony grey-brown for cliffs
  [BiomeType.PALACE]: '#c0b0ff', // A light, royal purple/lavender
  [BiomeType.HOLY_SITE]: '#fffacd', // Lemon chiffon, a light gold/cream
  [BiomeType.FARMLAND]: '#c4a257',
  [BiomeType.MARKETPLACE]: '#c0b090',
  [BiomeType.GOVERNMENT_DISTRICT]: '#ba11f2',
  [BiomeType.CITY_CENTER]: '#d0c0a0',
  [BiomeType.PARK]: '#5a9a40', // Green park color for modern urban parks
  [BiomeType.ROAD]: '#505050', // Dark gray for paved roads
  [BiomeType.DIRT_PATH]: '#8b7355', // Brown dirt path color
  [BiomeType.PLAZA]: '#c8b88b', // Light stone/brick color for plazas
  [BiomeType.HARBOR_DISTRICT]: '#7090a0', // Blue-gray for harbor areas
  [BiomeType.INDUSTRIAL_DISTRICT]: '#8a7060', // Brown-gray for industrial zones
  // Additional biomes for completeness
  [BiomeType.ICE]: '#e5e7eb', // Light gray-white for ice
  [BiomeType.SAND_DUNES]: '#fbbf24', // Sandy yellow
  [BiomeType.SAVANNA]: '#ca8a04', // Golden brown savanna
  [BiomeType.MEADOW]: '#84cc16', // Bright green meadow
  [BiomeType.RAINFOREST]: '#15803d', // Deep jungle green
  [BiomeType.BAMBOO]: '#84cc16', // Bamboo green
  [BiomeType.SWAMP]: '#047857', // Dark swamp green
  [BiomeType.UNDERSEA]: '#172554', // Deep underwater blue
  [BiomeType.AIR]: '#dbeafe', // Light sky blue
  [BiomeType.PADDOCK]: '#bef264', // Light green for animal paddocks
  [BiomeType.SHOALS]: '#67e8f9', // Light cyan for shoals
  
  // Architectural biomes for special maps
  [BiomeType.WALL]: '#4a4a4a', // Dark stone gray
  [BiomeType.WALL_GATE]: '#6b4423', // Brown wood gate
  [BiomeType.WALL_BACK]: '#5a5a5a', // Back wall stone (slightly lighter for depth)
  [BiomeType.WALL_BACK_WINDOW]: '#5a5a5a', // Back wall with window
  [BiomeType.WALL_BACK_DOOR]: '#5a5a5a', // Back wall with door
  [BiomeType.FLOOR_STONE]: '#9a9a9a', // Light stone gray
  [BiomeType.FLOOR_WOOD]: '#8b6633', // Wood brown
  [BiomeType.FLOOR_MARBLE]: '#e8e8e8', // White marble
  [BiomeType.FLOOR_TILE]: '#c4a574', // Terracotta tile
  [BiomeType.FLOOR_DIRT]: '#8b7355', // Dirt floor - same as dirt path
  [BiomeType.FLOOR_CHECKERED]: '#d3d3d3', // Light gray checkered
  [BiomeType.FLOOR_PATTERN]: '#a8a694', // Patterned stone floor
  [BiomeType.FLOOR_MOSAIC]: '#b8860b', // Mosaic gold/brown
  [BiomeType.FLOOR_MOSAIC_CENTER]: '#daa520', // Brighter mosaic center
  [BiomeType.FLOOR_MOSAIC_BORDER]: '#8b7d6b', // Darker mosaic border
  [BiomeType.FLOOR_CARPET]: '#8b0000', // Red carpet floor
  [BiomeType.TABLE]: '#6b4423', // Dark wood
  [BiomeType.TABLE_LEFT]: '#6b4423', // Dark wood (left end)
  [BiomeType.TABLE_CENTER]: '#6b4423', // Dark wood (center)
  [BiomeType.TABLE_RIGHT]: '#6b4423', // Dark wood (right end)
  [BiomeType.CHAIR]: '#8b6633', // Medium wood
  [BiomeType.BED]: '#a0522d', // Reddish wood
  [BiomeType.COLUMN]: '#b0b0b0', // Light stone column
  [BiomeType.STATUE]: '#d3d3d3', // Light gray stone
  [BiomeType.FOUNTAIN]: '#87ceeb', // Light blue water
  [BiomeType.THRONE]: '#9a9a9a', // Should be overlay, not full tile - use floor color
  [BiomeType.ALTAR]: '#8b4513', // Dark religious wood
  [BiomeType.SHELF]: '#654321', // Dark shelf wood
  [BiomeType.DAIS]: '#9a8a7a', // Raised platform gray-brown
  [BiomeType.BENCH]: '#7a5c3a', // Bench wood brown
  [BiomeType.PILLAR]: '#8a8a8a', // Stone pillar gray
  [BiomeType.CABINET]: '#6b4423', // Cabinet dark wood
  [BiomeType.COUNTER]: '#7a5c3a', // Counter wood
  [BiomeType.STALL]: '#8b7355', // Market stall wood
  [BiomeType.DISPLAY]: '#705030', // Display case wood
  [BiomeType.GARDEN]: '#228b22', // Garden green
  [BiomeType.POND]: '#4682b4', // Pond blue
  [BiomeType.TREE_INDOOR]: '#2e8b57', // Indoor tree green
  [BiomeType.CARPET]: '#8b0000', // Red carpet
  [BiomeType.CURTAIN]: '#4b0082', // Purple curtain
  [BiomeType.WINDOW]: '#add8e6', // Light blue glass
  [BiomeType.DOOR]: '#654321', // Door brown
  [BiomeType.ARCHWAY]: '#9a9a9a', // Should be overlay - use floor color
  [BiomeType.STAIRS]: '#7a7a7a', // Gray stone stairs
  [BiomeType.LADDER]: '#8b6914', // Ladder wood
  [BiomeType.FIREPLACE]: '#ff4500', // Orange fire glow
  [BiomeType.TORCH]: '#9a9a9a', // Should be overlay, not full tile - use floor color
  [BiomeType.CHANDELIER]: '#ffd700', // Gold chandelier
  [BiomeType.BRAZIER]: '#9a9a9a', // Should be overlay, not full tile - use floor color
  [BiomeType.FIRE_PIT]: '#8b4513', // Dark brown (earth/stone ring)
  [BiomeType.HEARTH]: '#696969', // Dim gray (stone hearth)
  [BiomeType.CAGE]: '#696969', // Dim gray metal
  [BiomeType.CHEST]: '#654321', // Chest brown
  [BiomeType.BARREL]: '#8b4513', // Barrel brown
  [BiomeType.CRATE]: '#a0826d', // Crate tan
  [BiomeType.WEAPON_RACK]: '#4a4a4a', // Metal gray
  [BiomeType.ARMOR_STAND]: '#708090', // Slate gray
  [BiomeType.BANNER]: '#dc143c', // Crimson banner
  [BiomeType.FLAG]: '#ff0000', // Red flag
  [BiomeType.BELL]: '#ffd700', // Gold bell
  [BiomeType.GONG]: '#b8860b', // Dark golden rod
  [BiomeType.BOOKSHELF]: '#654321', // Dark wood
  [BiomeType.DESK]: '#8b6633', // Desk wood
  [BiomeType.PODIUM]: '#705030', // Podium wood
  [BiomeType.STAGE]: '#8b7355', // Stage wood
  [BiomeType.PAVILION]: '#c4b5a0', // Light pavilion canvas/stone
  [BiomeType.CELL]: '#3a3a3a', // Dark prison cell gray
  [BiomeType.SEATING]: '#696969', // Theater seating gray
  [BiomeType.SCREEN]: '#f5f5f5', // Light screen/paper
  [BiomeType.PARTITION]: '#deb887', // Burlywood partition
  [BiomeType.FENCE]: '#8b6914', // Fence brown
  [BiomeType.GATE]: '#654321', // Gate brown
  [BiomeType.BRIDGE_INDOOR]: '#8b7355', // Indoor bridge wood
  [BiomeType.BALCONY]: '#a0826d', // Balcony tan
  [BiomeType.COURTYARD]: '#c0c0c0', // Silver courtyard stone
  [BiomeType.ARCADE]: '#d3d3d3', // Light gray arcade
  [BiomeType.COLONNADE]: '#b0b0b0', // Column gray
  [BiomeType.PORTICO]: '#a9a9a9', // Dark gray portico
  [BiomeType.VAULT]: '#696969', // Dim gray vault
  [BiomeType.DOME]: '#dcdcdc', // Gainsboro dome
  [BiomeType.MINARET]: '#f5f5dc', // Beige minaret
  [BiomeType.SPIRE]: '#c0c0c0', // Silver spire
  [BiomeType.BATHHOUSE]: '#87ceeb', // Sky blue water
  [BiomeType.SAUNA]: '#8b6633', // Wood sauna
  [BiomeType.POOL]: '#4682b4', // Steel blue pool
  [BiomeType.WORKSHOP]: '#8b7355', // Workshop brown
  [BiomeType.FORGE]: '#ff4500', // Orange red forge
  [BiomeType.KITCHEN]: '#cd853f', // Peru kitchen
  [BiomeType.STORAGE]: '#a0826d', // Storage tan
  [BiomeType.CELLAR]: '#4a4a4a', // Dark cellar gray
  [BiomeType.ATTIC]: '#8b6914', // Attic wood
  [BiomeType.OBSERVATORY]: '#191970', // Midnight blue
  [BiomeType.LABORATORY]: '#f0f8ff', // Alice blue lab
  [BiomeType.LIBRARY]: '#8b4513', // Saddle brown books
  [BiomeType.SCRIPTORIUM]: '#deb887', // Burlywood scriptorium
  [BiomeType.SHRINE]: '#ffd700', // Gold shrine
  [BiomeType.CHAPEL]: '#f5f5dc', // Beige chapel
  [BiomeType.CRYPT]: '#2f4f4f', // Dark slate gray crypt
  [BiomeType.TOMB]: '#696969', // Dim gray tomb
  [BiomeType.TREASURY]: '#ffd700', // Gold treasury
  [BiomeType.MINT]: '#c0c0c0', // Silver mint
  [BiomeType.GRANARY]: '#daa520', // Goldenrod grain
  [BiomeType.WELL_INDOOR]: '#4682b4', // Steel blue water
  [BiomeType.CISTERN]: '#5f9ea0', // Cadet blue water
  [BiomeType.SEWER]: '#2f4f4f', // Dark slate gray sewer
  [BiomeType.AQUEDUCT]: '#4682b4', // Steel blue aqueduct
  [BiomeType.EXERCISE_YARD]: '#8fbc8f', // Dark sea green yard
  [BiomeType.PRACTICE_ROOM]: '#d2b48c', // Tan practice room
  [BiomeType.MEDITATION_ROOM]: '#f5f5dc', // Beige meditation
  [BiomeType.PRAYER_HALL]: '#fff8dc', // Cornsilk prayer hall
  [BiomeType.RITUAL_CHAMBER]: '#8b0000', // Dark red ritual
  [BiomeType.SUMMONING_CIRCLE]: '#4b0082', // Indigo summoning
  [BiomeType.ALCHEMY_LAB]: '#9370db', // Medium purple alchemy
  [BiomeType.ENCHANTING_TABLE]: '#9400d3', // Violet enchanting
};

// Helper to make a color slightly darker/richer
const shiftColor = (hex: string, lShift: number, sShift: number): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return hex;
  let r = parseInt(result[1], 16);
  let g = parseInt(result[2], 16);
  let b = parseInt(result[3], 16);

  // Simple RGB shift, could be HSL for more precise richness
  r = Math.min(255, Math.max(0, r * (1 + lShift) ));
  g = Math.min(255, Math.max(0, g * (1 + lShift) ));
  b = Math.min(255, Math.max(0, b * (1 + lShift) ));
  
  // A very crude saturation increase by reducing whiteness/grayness
  if (sShift > 0) {
    const avg = (r+g+b)/3;
    r = Math.min(255, Math.max(0, r + (r-avg)*sShift));
    g = Math.min(255, Math.max(0, g + (g-avg)*sShift));
    b = Math.min(255, Math.max(0, b + (b-avg)*sShift));
  }
  
  return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`;
}


// ===== CLIMATE-SPECIFIC WATER COLORS =====
// Major river is now slightly darker/richer than normal river.
// Added FRESHWATER_LAKE_DEEP and FRESHWATER_LAKE_SHALLOW for gradient
export const CLIMATE_WATER_COLORS: Record<ClimateType, {
  DEEP: string, SHALLOW: string, RIVER: string, MAJOR_RIVER: string, REEF_BASE: string, ESTUARY_TINT?: string,
  FRESHWATER_LAKE_DEEP: string, FRESHWATER_LAKE_SHALLOW: string
}> = {
  // Rivers now use ocean-like colors - slightly lighter than shallow ocean for visibility
  [ClimateType.TEMPERATE]:    { DEEP: '#0c4a6e', SHALLOW: '#38bdf8', RIVER: '#42c7ff', MAJOR_RIVER: '#35b0e8', REEF_BASE: '#20B2AA', ESTUARY_TINT: '#4080AA', FRESHWATER_LAKE_DEEP: '#2a6a9a', FRESHWATER_LAKE_SHALLOW: '#4a8ac2' },
  [ClimateType.SEMITROPICAL]: { DEEP: '#0b7c70', SHALLOW: '#2dd4bf', RIVER: '#37dec9', MAJOR_RIVER: '#2ac4af', REEF_BASE: '#00CED1', ESTUARY_TINT: '#30c0b0', FRESHWATER_LAKE_DEEP: '#25708a', FRESHWATER_LAKE_SHALLOW: '#4090a2' },
  [ClimateType.TROPICAL]:     { DEEP: '#0a8bc2', SHALLOW: '#30c0ff', RIVER: '#3acaff', MAJOR_RIVER: '#2db0ef', REEF_BASE: '#00FFFF', ESTUARY_TINT: '#40b8e0', FRESHWATER_LAKE_DEEP: '#207aa2', FRESHWATER_LAKE_SHALLOW: '#38a0c0' },
  [ClimateType.ARID]:         { DEEP: '#6ba0f0', SHALLOW: '#a0c8fa', RIVER: '#aad2ff', MAJOR_RIVER: '#96beea', REEF_BASE: '#48D1CC', ESTUARY_TINT: '#b0c0e0', FRESHWATER_LAKE_DEEP: '#5080b0', FRESHWATER_LAKE_SHALLOW: '#70a0d0' },
  [ClimateType.COLD]:         { DEEP: '#102a60', SHALLOW: '#406090', RIVER: '#4a6a9a', MAJOR_RIVER: '#365680', REEF_BASE: '#608090', ESTUARY_TINT: '#5070a0', FRESHWATER_LAKE_DEEP: '#183870', FRESHWATER_LAKE_SHALLOW: '#305888' },
  [ClimateType.MEDITERRANEAN]: { DEEP: '#0a5d8a', SHALLOW: '#2e9dd9', RIVER: '#38a7e3', MAJOR_RIVER: '#2b93c9', REEF_BASE: '#1E90FF', ESTUARY_TINT: '#4090cc', FRESHWATER_LAKE_DEEP: '#2a6a9f', FRESHWATER_LAKE_SHALLOW: '#4a8abf' },
};
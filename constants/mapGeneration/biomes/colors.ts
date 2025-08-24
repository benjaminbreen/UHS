

/**
 * constants/mapGeneration/biomes/colors.ts - Biome and climate-specific water color definitions
 */

import { BiomeType } from '../../../types';
import { ClimateType } from '../../../types';

// ===== BIOME COLOR DEFINITIONS =====
export const BIOME_COLORS: Record<BiomeType, string> = {
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
  [BiomeType.JUNGLE]: '#10b981', // emerald-500
  [BiomeType.DESERT]: '#fde68a', 
  [BiomeType.OASIS]: '#4ade80',   
  [BiomeType.WETLANDS]: '#d3c9a6', 
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
  [BiomeType.GOVERNMENT_DISTRICT]: '#a0b0c0',
  [BiomeType.CITY_CENTER]: '#d0c0a0',
  [BiomeType.PARK]: '#5a9a40', // Green park color for modern urban parks
  [BiomeType.ROAD]: '#505050', // Dark gray for paved roads
  [BiomeType.PLAZA]: '#c8b88b', // Light stone/brick color for plazas
  [BiomeType.HARBOR_DISTRICT]: '#7090a0', // Blue-gray for harbor areas
  [BiomeType.INDUSTRIAL_DISTRICT]: '#8a7060', // Brown-gray for industrial zones
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
  [ClimateType.TEMPERATE]:    { DEEP: '#0c4a6e', SHALLOW: '#38bdf8', RIVER: '#559cf0', MAJOR_RIVER: shiftColor('#559cf0', -0.15, 0.1), REEF_BASE: '#20B2AA', ESTUARY_TINT: '#4080AA', FRESHWATER_LAKE_DEEP: '#2a6a9a', FRESHWATER_LAKE_SHALLOW: '#4a8ac2' },
  [ClimateType.SEMITROPICAL]: { DEEP: '#0b7c70', SHALLOW: '#2dd4bf', RIVER: '#4cdbc8', MAJOR_RIVER: shiftColor('#4cdbc8', -0.15, 0.1), REEF_BASE: '#00CED1', ESTUARY_TINT: '#30c0b0', FRESHWATER_LAKE_DEEP: '#25708a', FRESHWATER_LAKE_SHALLOW: '#4090a2' },
  [ClimateType.TROPICAL]:     { DEEP: '#0a8bc2', SHALLOW: '#30c0ff', RIVER: '#6acbfc', MAJOR_RIVER: shiftColor('#6acbfc', -0.15, 0.1), REEF_BASE: '#00FFFF', ESTUARY_TINT: '#40b8e0', FRESHWATER_LAKE_DEEP: '#207aa2', FRESHWATER_LAKE_SHALLOW: '#38a0c0' },
  [ClimateType.ARID]:         { DEEP: '#6ba0f0', SHALLOW: '#a0c8fa', RIVER: '#c8d8fc', MAJOR_RIVER: shiftColor('#c8d8fc', -0.15, 0.05), REEF_BASE: '#48D1CC', ESTUARY_TINT: '#b0c0e0', FRESHWATER_LAKE_DEEP: '#5080b0', FRESHWATER_LAKE_SHALLOW: '#70a0d0' },
  [ClimateType.COLD]:         { DEEP: '#102a60', SHALLOW: '#406090', RIVER: '#7090c0', MAJOR_RIVER: shiftColor('#7090c0', -0.15, 0.05), REEF_BASE: '#608090', ESTUARY_TINT: '#5070a0', FRESHWATER_LAKE_DEEP: '#183870', FRESHWATER_LAKE_SHALLOW: '#305888' },
  [ClimateType.MEDITERRANEAN]: { DEEP: '#0a5d8a', SHALLOW: '#2e9dd9', RIVER: '#5ab0e6', MAJOR_RIVER: shiftColor('#5ab0e6', -0.15, 0.1), REEF_BASE: '#1E90FF', ESTUARY_TINT: '#4090cc', FRESHWATER_LAKE_DEEP: '#2a6a9f', FRESHWATER_LAKE_SHALLOW: '#4a8abf' },
};
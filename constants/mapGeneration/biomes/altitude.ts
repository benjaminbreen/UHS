/**
 * constants/mapGeneration/biomes/altitude.ts - Altitude and terrain configuration
 */

// ===== ALTITUDE AND TERRAIN CONFIGURATION =====
export const ALTITUDE_LEVELS = {
  SEA: 0.05,
  BEACH: 0.1,
  GRASSLAND_LOWER_MAX: 0.28, 
  GRASSLAND_UPPER_MAX: 0.38, 
  FOREST_LOWER_MAX: 0.42,    
  FOREST_UPPER_MAX: 0.58,    
  HILLS_START: 0.35,         
  HILLS_MAX: 0.70,           
  MOUNTAIN_MAX: 0.88,        
  SNOW_LINE: 0.80,
  // New thresholds for Tundra/Steppe (can overlap with others, climate dependent)
  TUNDRA_MAX_ALTITUDE: 0.55, // Tundra can exist up to lower hills
  STEPPE_MAX_ALTITUDE: 0.45, // Steppe generally lower than tundra
  VOLCANIC_SOIL_MAX_ALTITUDE: 0.6, // Fertile soil on slopes
  VOLCANIC_ROCK_MAX_ALTITUDE: 0.9, // Higher up, rocky
};

const createBands = (min: number, max: number, numTiers: number = 5): number[] => {
    if (numTiers <= 1 || min >= max) return [max]; 
    const range = max - min;
    const step = range / numTiers;
    const bands: number[] = [];
    for (let i = 1; i < numTiers; i++) {
        bands.push(min + i * step);
    }
    return bands;
};

export const GRASSLAND_ALTITUDE_BANDS = createBands(ALTITUDE_LEVELS.BEACH, ALTITUDE_LEVELS.GRASSLAND_UPPER_MAX, 8);
export const FOREST_ALTITUDE_BANDS = createBands(ALTITUDE_LEVELS.GRASSLAND_UPPER_MAX, ALTITUDE_LEVELS.FOREST_UPPER_MAX, 8);
export const DENSE_FOREST_ALTITUDE_BANDS = createBands(ALTITUDE_LEVELS.GRASSLAND_UPPER_MAX, ALTITUDE_LEVELS.FOREST_UPPER_MAX, 8);
export const JUNGLE_ALTITUDE_BANDS = createBands(ALTITUDE_LEVELS.BEACH, ALTITUDE_LEVELS.FOREST_UPPER_MAX, 8); 
export const DESERT_ALTITUDE_BANDS = createBands(ALTITUDE_LEVELS.BEACH, ALTITUDE_LEVELS.HILLS_START * 0.9, 6); 
export const SCRUB_ALTITUDE_BANDS = createBands(ALTITUDE_LEVELS.GRASSLAND_LOWER_MAX, ALTITUDE_LEVELS.HILLS_START * .95, 6);
export const HILLS_ALTITUDE_BANDS = createBands(ALTITUDE_LEVELS.HILLS_START, ALTITUDE_LEVELS.HILLS_MAX, 10);
export const MOUNTAIN_ALTITUDE_BANDS = createBands(ALTITUDE_LEVELS.HILLS_MAX, ALTITUDE_LEVELS.MOUNTAIN_MAX, 12);
export const RIVERBANK_ALTITUDE_BANDS = createBands(ALTITUDE_LEVELS.BEACH, ALTITUDE_LEVELS.GRASSLAND_UPPER_MAX, 5);
// New Bands
export const TUNDRA_ALTITUDE_BANDS = createBands(ALTITUDE_LEVELS.BEACH, ALTITUDE_LEVELS.TUNDRA_MAX_ALTITUDE, 6);
export const STEPPE_ALTITUDE_BANDS = createBands(ALTITUDE_LEVELS.BEACH, ALTITUDE_LEVELS.STEPPE_MAX_ALTITUDE, 6);
export const VOLCANIC_SOIL_ALTITUDE_BANDS = createBands(ALTITUDE_LEVELS.BEACH, ALTITUDE_LEVELS.VOLCANIC_SOIL_MAX_ALTITUDE, 8);
export const VOLCANIC_ROCK_ALTITUDE_BANDS = createBands(ALTITUDE_LEVELS.HILLS_START, ALTITUDE_LEVELS.VOLCANIC_ROCK_MAX_ALTITUDE, 8);


// Color adjustments for altitude tiers [L_multiplier, S_multiplier, L_fixed_offset]
export const ALTITUDE_TIER_COLOR_ADJUSTMENTS: Array<[number, number, number]> = [
  [1.0, 1.0, 0.05],   
  [1.0, 1.0, 0.02],
  [1.0, 1.0, 0.0],    
  [0.98, 0.98, -0.02],
  [0.95, 0.95, -0.05] 
];
export const DESERT_TIER_COLOR_ADJUSTMENTS: Array<[number, number, number]> = [
  [1.0, 1.0, 0.03],
  [1.0, 1.0, 0.0],   
  [0.98, 0.99, -0.01],
  [0.97, 0.98, -0.02] 
];
export const HILLS_TIER_COLOR_ADJUSTMENTS: Array<[number, number, number]> = [
  [1.0, 0.95, 0.03],
  [0.98, 0.90, 0.01],   
  [0.95, 0.85, 0.0],    
  [0.92, 0.70, -0.01],
  [0.90, 0.55, -0.02],
  [0.88, 0.45, -0.03] 
];
export const SCRUB_TIER_COLOR_ADJUSTMENTS: Array<[number, number, number]> = [
    [1.0, 1.0, 0.02], 
    [0.99, 0.98, 0.0],
    [0.98, 0.95, -0.01],
    [0.97, 0.93, -0.02]
];
export const DENSE_FOREST_TIER_COLOR_ADJUSTMENTS: Array<[number, number, number]> = [
    [1.0, 1.0, 0.02], 
    [0.98, 0.98, 0.01],
    [0.95, 0.95, 0.0],
    [0.92, 0.92, -0.01],
    [0.90, 0.90, -0.03] 
];
export const RIVERBANK_TIER_COLOR_ADJUSTMENTS: Array<[number, number, number]> = [
    [1.0, 1.0, 0.03], 
    [0.99, 1.02, 0.01],
    [0.98, 1.05, 0.0] 
];
// New Tier Color Adjustments
export const TUNDRA_TIER_COLOR_ADJUSTMENTS: Array<[number, number, number]> = [
    [1.0, 0.85, 0.02], 
    [0.98, 0.82, 0.0],
    [0.96, 0.80, -0.01],
    [0.94, 0.78, -0.02]
];
export const STEPPE_TIER_COLOR_ADJUSTMENTS: Array<[number, number, number]> = [
    [1.0, 0.90, 0.03], 
    [0.99, 0.88, 0.01],
    [0.98, 0.86, 0.0],
    [0.97, 0.85, -0.01] 
];
export const MOUNTAIN_TIER_COLOR_ADJUSTMENTS: Array<[number, number, number]> = [
    [1.05, 0.9, 0.03],
    [1.02, 0.95, 0.01],
    [1.0, 1.0, 0.0],
    [0.98, 1.02, -0.01],
    [0.95, 1.05, -0.03],
    [0.92, 1.08, -0.06],
    [0.90, 1.1, -0.09],
    [0.87, 1.15, -0.12]
];
export const VOLCANIC_SOIL_TIER_COLOR_ADJUSTMENTS: Array<[number, number, number]> = [
    [1.2, 0.9, 0.05],
    [1.1, 0.95, 0.02],
    [1.0, 1.0, 0.0],
    [0.9, 1.05, -0.03],
    [0.8, 1.1, -0.06]
];
export const VOLCANIC_ROCK_TIER_COLOR_ADJUSTMENTS: Array<[number, number, number]> = [
    [1.5, 0.6, 0.12],
    [1.3, 0.7, 0.08],
    [1.15, 0.85, 0.04],
    [1.0, 1.0, 0.0],
    [0.9, 1.1, -0.03]
];
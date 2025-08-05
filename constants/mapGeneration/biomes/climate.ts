/**
 * constants/mapGeneration/biomes/climate.ts - Climate-specific biome generation rules
 */
import { ClimateType } from '../../../types';
import { ALTITUDE_LEVELS } from './altitude'; // For WETLANDS_MAX_ALTITUDE

export const CLIMATE_RIVER_SOURCE_MODIFIERS: Record<ClimateType, number> = {
  [ClimateType.TEMPERATE]: 1.0,
  [ClimateType.SEMITROPICAL]: 0.8,
  [ClimateType.TROPICAL]: 1.4,
  [ClimateType.ARID]: 0.3,
  [ClimateType.COLD]: 0.5, // Fewer river sources in cold climates
};

// ===== BIOME-SPECIFIC GENERATION RULES (influenced by climate) =====
export const JUNGLE_HUMIDITY_THRESHOLD = 0.6; 
export const DESERT_ARIDITY_THRESHOLD = 0.3;  
export const OASIS_CHANCE_IN_DESERT = 0.05;
export const SCRUB_HUMIDITY_THRESHOLD_LOW = 0.25; 
export const SCRUB_HUMIDITY_THRESHOLD_HIGH = 0.5; 
export const WETLANDS_MAX_ALTITUDE = ALTITUDE_LEVELS.BEACH + 0.02; 
export const WETLANDS_MOISTURE_PROXIMITY_FACTOR = 0.7; 
export const REEF_CHANCE = 0.08;
export const REEF_MAX_DEPTH_FACTOR = 0.6;

// Dense forest generation parameters
export const DENSE_FOREST_HUMIDITY_THRESHOLD = 0.7;
export const DENSE_FOREST_ALTITUDE_PREFERENCE = 0.4;
export const DENSE_FOREST_CHANCE_IN_FOREST = 0.25;

// New climate-enhanced biome parameters
export const TUNDRA_TEMPERATURE_THRESHOLD = 0.1; // Noise value threshold for cold enough for tundra in TEMPERATE/COLD
export const STEPPE_HUMIDITY_LOW = 0.2;
export const STEPPE_HUMIDITY_HIGH = 0.6; // For continental grassland variant
export const MANGROVE_COASTAL_RANGE = 2; // Tiles from coast
export const MANGROVE_MIN_HUMIDITY = 0.5;

// Volcanic feature parameters
export const VOLCANIC_ACTIVE_THRESHOLD = 0.7; // Noise threshold for an "active" volcano
export const VOLCANIC_LAVA_RADIUS = 3;
export const VOLCANIC_ROCK_RADIUS = 6;
export const VOLCANIC_SOIL_RADIUS = 4; // Fertile soil around volcanoes

// Special terrain parameters
export const SALT_FLATS_HUMIDITY_THRESHOLD = 0.8; // High humidity in arid = salt flats (evaporation)
export const SALT_FLATS_ALTITUDE_VARIANCE_MAX = 0.01; // Needs very flat terrain
export const HOT_SPRINGS_VOLCANIC_PROXIMITY = 5;
export const HOT_SPRINGS_MOUNTAIN_PROXIMITY = 3;
export const SHOALS_TILE_MIN_ALTITUDE_FOR_LAND_PART = 0.02; // Min altitude for the "land" part of a shoal

// Historical/Cultural parameters
export const RUIN_BASE_CHANCE = 0.005;
export const RUIN_ANTI_CLUSTERING_RADIUS = 10;
export const FARMLAND_SETTLEMENT_RADIUS = 4;
export const FARMLAND_MAX_ALTITUDE = ALTITUDE_LEVELS.GRASSLAND_UPPER_MAX;
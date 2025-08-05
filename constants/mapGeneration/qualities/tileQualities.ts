/**
 * constants/mapGeneration/qualities/tileQualities.ts - Configuration for Tile Qualities System
 */

import { BiomeType, ClimateType } from '../../../types';

/**
 * FLAMMABILITY CALCULATION PARAMETERS
 * Determines fire risk based on biome type and proximity to water sources
 */
export const FLAMMABILITY_CONFIG = {
  BASE_VALUES: {
    [BiomeType.FOREST]: 0.8,
    [BiomeType.DENSE_FOREST]: 0.6,
    [BiomeType.JUNGLE]: 0.3,
    [BiomeType.GRASSLAND]: 0.7,
    [BiomeType.RIVERBANK]: 0.4,
    [BiomeType.SCRUB]: 0.9,
    [BiomeType.DESERT]: 0.6,
    [BiomeType.HILLS]: 0.5,
    [BiomeType.MOUNTAIN]: 0.2,
    [BiomeType.HIGH_PEAK]: 0.1,
    [BiomeType.SNOW]: 0.0,
    [BiomeType.BEACH]: 0.4,
    [BiomeType.WETLANDS]: 0.1,
    [BiomeType.OASIS]: 0.2,
    [BiomeType.HAMLET]: 0.7,
    [BiomeType.LOW_DENSITY_CITY]: 0.6,
    [BiomeType.DENSE_CITY]: 0.8,
    [BiomeType.URBAN]: 0.6,
    [BiomeType.RIVER]: 0.0,
    [BiomeType.MAJOR_RIVER]: 0.0,
    [BiomeType.SHALLOW_OCEAN]: 0.0,
    [BiomeType.DEEP_OCEAN]: 0.0,
    [BiomeType.REEF]: 0.0,
    [BiomeType.TUNDRA]: 0.2,
    [BiomeType.STEPPE]: 0.8,
    [BiomeType.MANGROVE]: 0.1,
    [BiomeType.VOLCANIC_SOIL]: 0.3,
    [BiomeType.VOLCANIC_ROCK]: 0.05,
    [BiomeType.ACTIVE_LAVA]: 1.0,
    [BiomeType.SHOALS_TILE]: 0.0,
    [BiomeType.SALT_FLATS]: 0.1,
    [BiomeType.HOT_SPRINGS]: 0.0,
    [BiomeType.RUINS]: 0.3,
    [BiomeType.ESTUARY]: 0.0, 
    [BiomeType.FRESHWATER_LAKE]: 0.0,
    [BiomeType.CLIFF]: 0.1,
    [BiomeType.PALACE]: 0.3,
    [BiomeType.HOLY_SITE]: 0.2,
    [BiomeType.FARMLAND]: 0.6,
    [BiomeType.MARKETPLACE]: 0.7,
    [BiomeType.GOVERNMENT_DISTRICT]: 0.4,
    [BiomeType.CITY_CENTER]: 0.5,
  } as Record<BiomeType, number>,
  
  WATER_INFLUENCE_RADIUS: 5,
  WATER_REDUCTION_MAX: 0.4,
  
  CLIMATE_MODIFIERS: {
    [ClimateType.ARID]: 1.3,
    [ClimateType.TEMPERATE]: 1.0,
    [ClimateType.SEMITROPICAL]: 0.8,
    [ClimateType.TROPICAL]: 0.6,
    [ClimateType.COLD]: 0.4,
  } as Record<ClimateType, number>,
};

/**
 * BIODIVERSITY CALCULATION PARAMETERS
 * Represents richness of plant and animal life
 */
export const BIODIVERSITY_CONFIG = {
  BASE_VALUES: {
    [BiomeType.JUNGLE]: 1.0,
    [BiomeType.WETLANDS]: 0.9,
    [BiomeType.DENSE_FOREST]: 0.85,
    [BiomeType.FOREST]: 0.8,
    [BiomeType.REEF]: 0.85,
    [BiomeType.RIVERBANK]: 0.75,
    [BiomeType.OASIS]: 0.7,
    [BiomeType.GRASSLAND]: 0.6,
    [BiomeType.SCRUB]: 0.5,
    [BiomeType.RIVER]: 0.7,
    [BiomeType.MAJOR_RIVER]: 0.6,
    [BiomeType.HILLS]: 0.5,
    [BiomeType.BEACH]: 0.4,
    [BiomeType.SHALLOW_OCEAN]: 0.6,
    [BiomeType.MOUNTAIN]: 0.3,
    [BiomeType.HIGH_PEAK]: 0.1,
    [BiomeType.SNOW]: 0.05,
    [BiomeType.DESERT]: 0.2,
    [BiomeType.HAMLET]: 0.4,
    [BiomeType.LOW_DENSITY_CITY]: 0.2,
    [BiomeType.DENSE_CITY]: 0.05,
    [BiomeType.URBAN]: 0.1,
    [BiomeType.DEEP_OCEAN]: 0.4,
    [BiomeType.TUNDRA]: 0.3,
    [BiomeType.STEPPE]: 0.55,
    [BiomeType.MANGROVE]: 0.9,
    [BiomeType.VOLCANIC_SOIL]: 0.6,
    [BiomeType.VOLCANIC_ROCK]: 0.05,
    [BiomeType.ACTIVE_LAVA]: 0.0,
    [BiomeType.SHOALS_TILE]: 0.5,
    [BiomeType.SALT_FLATS]: 0.02,
    [BiomeType.HOT_SPRINGS]: 0.1,
    [BiomeType.RUINS]: 0.4,
    [BiomeType.ESTUARY]: 0.95, 
    [BiomeType.FRESHWATER_LAKE]: 0.75,
    [BiomeType.CLIFF]: 0.05,
    [BiomeType.PALACE]: 0.1,
    [BiomeType.HOLY_SITE]: 0.4,
    [BiomeType.FARMLAND]: 0.7,
    [BiomeType.MARKETPLACE]: 0.1,
    [BiomeType.GOVERNMENT_DISTRICT]: 0.1,
    [BiomeType.CITY_CENTER]: 0.1,
  } as Record<BiomeType, number>,
  
  URBAN_INFLUENCE_RADIUS: 8,
  URBAN_DEGRADATION_MAX: 0.6,
  COAST_DEGRADATION: 0.2,
  
  CLIMATE_MODIFIERS: {
    [ClimateType.TROPICAL]: 1.3,
    [ClimateType.SEMITROPICAL]: 1.1,
    [ClimateType.TEMPERATE]: 1.0,
    [ClimateType.ARID]: 0.7,
    [ClimateType.COLD]: 0.6,
  } as Record<ClimateType, number>,
};

/**
 * HEALTHINESS CALCULATION PARAMETERS  
 * Disease risk, air quality, and general livability
 */
export const HEALTHINESS_CONFIG = {
  BASE_VALUES: {
    [BiomeType.MOUNTAIN]: 0.9,
    [BiomeType.HIGH_PEAK]: 0.95,
    [BiomeType.SNOW]: 0.85,
    [BiomeType.HILLS]: 0.8,
    [BiomeType.RIVERBANK]: 0.75,
    [BiomeType.GRASSLAND]: 0.7,
    [BiomeType.FOREST]: 0.65,
    [BiomeType.DENSE_FOREST]: 0.6,
    [BiomeType.SCRUB]: 0.6,
    [BiomeType.DESERT]: 0.55,
    [BiomeType.BEACH]: 0.6,
    [BiomeType.SHALLOW_OCEAN]: 0.7,
    [BiomeType.DEEP_OCEAN]: 0.75,
    [BiomeType.REEF]: 0.65,
    [BiomeType.HAMLET]: 0.6,
    [BiomeType.LOW_DENSITY_CITY]: 0.45,
    [BiomeType.DENSE_CITY]: 0.25,
    [BiomeType.URBAN]: 0.4,
    [BiomeType.OASIS]: 0.5,
    [BiomeType.RIVER]: 0.3, // Moving water can be risky depending on source
    [BiomeType.MAJOR_RIVER]: 0.25, // Larger rivers might carry more pollutants
    [BiomeType.WETLANDS]: 0.1,
    [BiomeType.JUNGLE]: 0.15,
    [BiomeType.TUNDRA]: 0.7,
    [BiomeType.STEPPE]: 0.65,
    [BiomeType.MANGROVE]: 0.2,
    [BiomeType.VOLCANIC_SOIL]: 0.7,
    [BiomeType.VOLCANIC_ROCK]: 0.6,
    [BiomeType.ACTIVE_LAVA]: 0.0,
    [BiomeType.SHOALS_TILE]: 0.65,
    [BiomeType.SALT_FLATS]: 0.4,
    [BiomeType.HOT_SPRINGS]: 0.8, // Mineral content can be good
    [BiomeType.RUINS]: 0.5,
    [BiomeType.ESTUARY]: 0.6, 
    [BiomeType.FRESHWATER_LAKE]: 0.8, // Generally cleaner than oceans
    [BiomeType.CLIFF]: 0.7,
    [BiomeType.PALACE]: 0.4,
    [BiomeType.HOLY_SITE]: 0.9,
    [BiomeType.FARMLAND]: 0.65,
    [BiomeType.MARKETPLACE]: 0.3,
    [BiomeType.GOVERNMENT_DISTRICT]: 0.5,
    [BiomeType.CITY_CENTER]: 0.35,
  } as Record<BiomeType, number>,
  
  ALTITUDE_BONUS_MAX: 0.3,
  ALTITUDE_BONUS_THRESHOLD: 0.3,
  STAGNANT_WATER_PENALTY: 0.4,
  FLOWING_WATER_BONUS: 0.1, // For rivers, but lakes are not flowing in same way
  
  CLIMATE_MODIFIERS: {
    [ClimateType.TEMPERATE]: 1.0,
    [ClimateType.SEMITROPICAL]: 0.8,
    [ClimateType.TROPICAL]: 0.6,
    [ClimateType.ARID]: 1.1, // Dry air can be healthy
    [ClimateType.COLD]: 0.9,
  } as Record<ClimateType, number>,
};

/**
 * SACRALITY CALCULATION PARAMETERS
 * Religious and cultural significance
 */
export const SACRALITY_CONFIG = {
  BASE_VALUES: {
    [BiomeType.HIGH_PEAK]: 0.9,
    [BiomeType.SNOW]: 0.8,
    [BiomeType.MOUNTAIN]: 0.7,
    [BiomeType.OASIS]: 0.8,
    [BiomeType.REEF]: 0.6,
    [BiomeType.WETLANDS]: 0.5,
    [BiomeType.JUNGLE]: 0.6,
    [BiomeType.DENSE_FOREST]: 0.65,
    [BiomeType.FOREST]: 0.5,
    [BiomeType.RIVERBANK]: 0.45,
    [BiomeType.RIVER]: 0.4,
    [BiomeType.MAJOR_RIVER]: 0.5,
    [BiomeType.DEEP_OCEAN]: 0.4,
    [BiomeType.HILLS]: 0.3,
    [BiomeType.GRASSLAND]: 0.2,
    [BiomeType.SCRUB]: 0.1,
    [BiomeType.BEACH]: 0.3,
    [BiomeType.SHALLOW_OCEAN]: 0.2,
    [BiomeType.DESERT]: 0.4,
    [BiomeType.HAMLET]: 0.3,
    [BiomeType.LOW_DENSITY_CITY]: 0.2,
    [BiomeType.DENSE_CITY]: 0.15,
    [BiomeType.URBAN]: 0.1,
    [BiomeType.TUNDRA]: 0.5,
    [BiomeType.STEPPE]: 0.3,
    [BiomeType.MANGROVE]: 0.4,
    [BiomeType.VOLCANIC_SOIL]: 0.3,
    [BiomeType.VOLCANIC_ROCK]: 0.6,
    [BiomeType.ACTIVE_LAVA]: 0.8,
    [BiomeType.SHOALS_TILE]: 0.2,
    [BiomeType.SALT_FLATS]: 0.5,
    [BiomeType.HOT_SPRINGS]: 0.7,
    [BiomeType.RUINS]: 0.9,
    [BiomeType.ESTUARY]: 0.5, 
    [BiomeType.FRESHWATER_LAKE]: 0.7, // Lakes often have significance
    [BiomeType.CLIFF]: 0.4,
    [BiomeType.PALACE]: 0.7,
    [BiomeType.HOLY_SITE]: 1.0,
    [BiomeType.FARMLAND]: 0.3,
    [BiomeType.MARKETPLACE]: 0.2,
    [BiomeType.GOVERNMENT_DISTRICT]: 0.6,
    [BiomeType.CITY_CENTER]: 0.5,
  } as Record<BiomeType, number>,
  
  PEAK_INFLUENCE_RADIUS: 12,
  PEAK_BONUS_MAX: 0.4,
  OASIS_BONUS: 0.3,
  REEF_BONUS: 0.2,
  ISLAND_CENTER_BONUS: 0.4,
  ISOLATION_BONUS_MAX: 0.3,
  ISOLATION_THRESHOLD: 10,
};

/**
 * SAFETY CALCULATION PARAMETERS
 * Overall danger assessment combining multiple risk factors
 */
export const SAFETY_CONFIG = {
  BASE_MODIFIERS: { // Positive is safer, negative is more dangerous
    [BiomeType.HAMLET]: 0.2,
    [BiomeType.LOW_DENSITY_CITY]: 0.1,
    [BiomeType.DENSE_CITY]: 0.0,
    [BiomeType.URBAN]: 0.1,
    [BiomeType.GRASSLAND]: 0.0,
    [BiomeType.RIVERBANK]: 0.05,
    [BiomeType.HILLS]: 0.1,
    [BiomeType.MOUNTAIN]: 0.2, // Hard to access, defensible
    [BiomeType.HIGH_PEAK]: 0.3, // Very inaccessible
    [BiomeType.SNOW]: 0.1, // Harsh but perhaps fewer predators
    [BiomeType.BEACH]: -0.1, // Exposed
    [BiomeType.RIVER]: -0.1, // Drowning, river creatures
    [BiomeType.MAJOR_RIVER]: -0.2, // More traffic/dangers
    [BiomeType.DEEP_OCEAN]: -0.3, // Storms, sea monsters
    [BiomeType.SHALLOW_OCEAN]: -0.1,
    [BiomeType.REEF]: -0.2, // Navigation hazard
    [BiomeType.JUNGLE]: -0.3, // Predators, difficult terrain
    [BiomeType.DENSE_FOREST]: -0.35, // Easy to get lost, predators
    [BiomeType.FOREST]: -0.1,
    [BiomeType.WETLANDS]: -0.4, // Disease, difficult terrain, hidden dangers
    [BiomeType.DESERT]: -0.2, // Harsh environment
    [BiomeType.OASIS]: -0.1, // Contested resource
    [BiomeType.SCRUB]: 0.0,
    [BiomeType.TUNDRA]: -0.1, // Harsh, potential predators
    [BiomeType.STEPPE]: -0.05, // Open, but potentially large herds/nomads
    [BiomeType.MANGROVE]: -0.25, // Difficult terrain, hidden creatures
    [BiomeType.VOLCANIC_SOIL]: 0.0,
    [BiomeType.VOLCANIC_ROCK]: -0.1, // Unstable
    [BiomeType.ACTIVE_LAVA]: -1.0, // Extremely dangerous
    [BiomeType.SHOALS_TILE]: -0.15, // Navigation hazard
    [BiomeType.SALT_FLATS]: -0.2, // Harsh, disorienting
    [BiomeType.HOT_SPRINGS]: -0.05, // Unstable ground, scalding water
    [BiomeType.RUINS]: -0.25, // Hidden dangers, unstable structures
    [BiomeType.ESTUARY]: -0.1, 
    [BiomeType.FRESHWATER_LAKE]: -0.05, // Large water body risks
    [BiomeType.CLIFF]: -0.2, 
    [BiomeType.PALACE]: 0.4,
    [BiomeType.HOLY_SITE]: 0.3,
    [BiomeType.FARMLAND]: 0.15,
    [BiomeType.MARKETPLACE]: 0.1,
    [BiomeType.GOVERNMENT_DISTRICT]: 0.3,
    [BiomeType.CITY_CENTER]: 0.2,
  } as Record<BiomeType, number>,
  
  WEIGHTS: {
    HEALTHINESS: 0.4,
    SACRALITY: 0.2, // Sacred places might be protected or cursed
    FLAMMABILITY: -0.3, // Fire is a danger
    BIODIVERSITY: -0.1, // More creatures can mean more danger
  },
  
  ALTITUDE_SAFETY_BONUS: 0.2, // Higher is often safer/more defensible
  URBAN_PROXIMITY_RADIUS: 6,
  URBAN_SAFETY_BONUS: 0.2, // Near cities is generally safer
  URBAN_SAFETY_PENALTY: 0.1, // But cities can have their own dangers
};

/**
 * GEOLOGICAL STRESS CALCULATION PARAMETERS
 * Represents tectonic activity, useful for finding hard metals.
 */
export const GEOLOGICAL_STRESS_CONFIG = {
  MOUNTAIN_BONUS: 0.4,
  CLIFF_BONUS: 0.5,
  HILLS_BONUS: 0.2,
  ALTITUDE_WEIGHT: 0.3,
};

/**
 * THERMAL ACTIVITY CALCULATION PARAMETERS
 * Represents heat from volcanic or geothermal sources.
 */
export const THERMAL_ACTIVITY_CONFIG = {
  VOLCANO_INFLUENCE_RADIUS: 8,
  VOLCANO_MAX_BONUS: 0.8,
  HOT_SPRINGS_BONUS: 0.5,
};

/**
 * constants/core.ts - Small, frequently-used constants that should be in the initial bundle
 * This file contains only lightweight constants that are needed immediately on app startup.
 * Heavy data files (cities, factions, beliefs, geography) are imported directly where needed.
 */

// Map Generation Constants - Small, frequently used
export * from './mapGeneration/dimensions';
export * from './mapGeneration/biomes/colors';

// Explicitly re-export from altitude.ts
export {
    ALTITUDE_LEVELS,
    GRASSLAND_ALTITUDE_BANDS,
    FOREST_ALTITUDE_BANDS,
    DENSE_FOREST_ALTITUDE_BANDS,
    JUNGLE_ALTITUDE_BANDS,
    DESERT_ALTITUDE_BANDS,
    SCRUB_ALTITUDE_BANDS,
    HILLS_ALTITUDE_BANDS,
    MOUNTAIN_ALTITUDE_BANDS,
    RIVERBANK_ALTITUDE_BANDS,
    TUNDRA_ALTITUDE_BANDS,
    STEPPE_ALTITUDE_BANDS,
    VOLCANIC_SOIL_ALTITUDE_BANDS,
    VOLCANIC_ROCK_ALTITUDE_BANDS,
    ALTITUDE_TIER_COLOR_ADJUSTMENTS,
    DESERT_TIER_COLOR_ADJUSTMENTS,
    HILLS_TIER_COLOR_ADJUSTMENTS,
    SCRUB_TIER_COLOR_ADJUSTMENTS,
    DENSE_FOREST_TIER_COLOR_ADJUSTMENTS,
    RIVERBANK_TIER_COLOR_ADJUSTMENTS,
    TUNDRA_TIER_COLOR_ADJUSTMENTS,
    STEPPE_TIER_COLOR_ADJUSTMENTS,
    VOLCANIC_SOIL_TIER_COLOR_ADJUSTMENTS,
    VOLCANIC_ROCK_TIER_COLOR_ADJUSTMENTS,
    MOUNTAIN_TIER_COLOR_ADJUSTMENTS
} from './mapGeneration/biomes/altitude';

export * from './mapGeneration/biomes/climate';
export * from './mapGeneration/generationParams';
export * from './mapGeneration/features/rivers';
export * from './mapGeneration/features/urban';
export * from './mapGeneration/features/harbors';

// Explicitly re-export constants from tileQualities.ts
export {
    FLAMMABILITY_CONFIG,
    BIODIVERSITY_CONFIG,
    HEALTHINESS_CONFIG,
    SACRALITY_CONFIG,
    SAFETY_CONFIG,
    GEOLOGICAL_STRESS_CONFIG,
    THERMAL_ACTIVITY_CONFIG
} from './mapGeneration/qualities/tileQualities';

// UI Strings - Small, frequently used
export * from './uiStrings';

// Item Lists for procedural generation - Medium size but frequently used
export * from './gameData/itemDefinitions';
export * from './gameData/lootTables';
export * from './gameData/containerLootTables';
export * from './gameData/structureLootTables';

// Animal and vegetation data - Medium size, frequently used
export * from './gameData/animals';
export * from './gameData/speciesData';
export * from './gameData/vegetationData';

// Skills - Small, frequently used
export * from './gameData/skills';

// Character data - Frequently used
export * from './characterData/index';

// Structure blueprints - Frequently used
export * from './structures';

// Metal definitions - Small
export * from './gameData/metals';

// Religions - Medium size but frequently used in character generation
export * from './characterData/religions';

// Factory types - Small
export * from './gameData/factoryTypes';

// Goals - Small
export * from './gameData/goals';

// Beliefs - Medium size but frequently used in character generation
export * from './gameData/beliefs';

// Societal profiles - Used in NPC generation
export * from './gameData/societalProfiles';

// CULTURE_ZONES - Small array, frequently used
export { CULTURE_ZONES } from './gameData/geography';

// History guide and primary sources - Load on demand via direct imports when needed
// adjacencies, cities, factions, geography (except CULTURE_ZONES), proceduralCityData
// These should be imported directly: import { CITIES } from '../constants/gameData/cities'
// Note: CULTURE_ZONES is exported above, but GEOGRAPHICAL_DATA should be imported directly

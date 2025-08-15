/**
 * constants/index.ts - Main entry point for all configuration constants
 */

// Map Generation Constants
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

// UI Strings
export * from './uiStrings';

// Ambiance Text Constants
export * from './ambiance';

// Item Lists for procedural generation
export * from './gameData/itemDefinitions'; 
export * from './gameData/lootTables'; 
export * from './gameData/containerLootTables'; 
export * from './gameData/structureLootTables';
export * from './gameData/animals';
export * from './gameData/speciesData'; 
export * from './gameData/skills';
export * from './gameData/geography';
export * from './gameData/vegetationData';
export * from './characterData/index'; // NEW: Export character data
export * from './structures'; // NEW: Export structure blueprints
export * from './gameData/metals'; // NEW: Export metal definitions
export * from './gameData/factions'; // NEW: Export faction data
export * from './gameData/cities'; // NEW: Export city data
export * from './gameData/proceduralCityData'; // NEW: Export procedural city data
export * from './characterData/religions'; // NEW: Explicitly export religions
export * from './gameData/adjacencies'; // NEW: Export adjacencies
export * from './gameData/historyguide'; // NEW: Export history guide data
export * from './gameData/primarysources'; // NEW: Export primary sources data
export * from './gameData/societalProfiles';
export * from './gameData/beliefs'; // NEW: Export beliefs data
export * from './gameData/factoryTypes'; // NEW: Export factory types
export * from './characterData/clothing'; // NEW: Export clothing data
export * from './gameData/goals'; // NEW: Export goal data

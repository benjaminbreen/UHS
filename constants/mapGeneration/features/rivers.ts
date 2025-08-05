/**
 * constants/mapGeneration/features/rivers.ts - River generation parameters
 */
import { ALTITUDE_LEVELS } from '../biomes/altitude';

// ===== IMPROVED RIVER GENERATION PARAMETERS =====
export const RIVER_MIN_SOURCES_BASE = 18;         // Increased from 12
export const RIVER_MAX_SOURCES_BASE = 28;        // Increased from 15
export const RIVER_MAX_LENGTH = 350;             // Increased from 220
export const RIVER_MIN_ALTITUDE_SOURCE = ALTITUDE_LEVELS.HILLS_MAX * 0.6; // Slightly lower

// River sinuosity and meandering parameters
export const RIVER_SINUOSITY_FACTOR = 0.8;      // How much rivers meander (0 = straight, 1 = very curvy)
export const RIVER_OXBOW_CHANCE = 0.28;         // Chance of creating oxbow lakes, increased from 0.15
export const RIVER_TRIBUTARY_CHANCE = 0.45;      // Chance of spawning tributaries, increased from 0.3
export const RIVER_WIDTH_VARIATION = 0.3;       // How much river width varies (less direct impact now, fine-tuned in code)
export const RIVER_MEANDER_FREQUENCY = 0.18;    // Frequency of meandering changes
export const RIVER_CONFLUENCE_ATTRACTION = 0.4; // How much rivers are attracted to join others

// Riverbank generation parameters
export const RIVERBANK_GENERATION_RADIUS = 3;   // How far riverbanks extend from rivers
export const RIVERBANK_FERTILITY_BONUS = 0.2;   // Biodiversity/health bonus for riverbanks
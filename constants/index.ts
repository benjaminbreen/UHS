/**
 * constants/index.ts - Main entry point for all configuration constants
 *
 * PERFORMANCE OPTIMIZATION (Phase 1):
 * This file now re-exports from core.ts which contains only small, frequently-used constants.
 * Heavy data files (cities, factions, beliefs, geography, adjacencies) should be imported
 * directly where needed to avoid loading them on app startup.
 *
 * Examples:
 *   import { CITIES } from '../constants/gameData/cities';
 *   import { GEOGRAPHICAL_DATA } from '../constants/gameData/geography';
 *   import { loadFactionData } from '../constants/gameData/factions';
 */

// Export all small, frequently-used constants from core.ts
export * from './core';

// TEMPORARY: Export FACTION_DATA with lazy loading for backwards compatibility
// This uses a Proxy to load faction data on first access (lazy, but still 1MB+)
// TODO Phase 2: Make map generators async and remove this
export { FACTION_DATA } from './gameData/factions';

// REMOVED HEAVY EXPORTS (now import directly where needed):
// ❌ export * from './gameData/cities';             // 174KB - Use: import { CITIES } from '../constants/gameData/cities'
// ❌ export * from './gameData/beliefs';            // 57KB  - Use: import { BELIEFS } from '../constants/gameData/beliefs'
// ❌ export * from './gameData/geography';          // 84KB  - Use: import { GEOGRAPHICAL_DATA } from '../constants/gameData/geography'
// ❌ export * from './gameData/adjacencies';        // 83KB  - Use: import { ADJACENCY_MAP } from '../constants/gameData/adjacencies'
// ❌ export * from './gameData/proceduralCityData'; // Use: import directly when needed
// ❌ export * from './gameData/societalProfiles';   // Use: import directly when needed
// ❌ export * from './gameData/historyguide';       // Use: import directly when needed
// ❌ export * from './gameData/primarysources';     // Use: import directly when needed

// NOTE: characterData/clothing is already lazy-loaded, keeping it that way

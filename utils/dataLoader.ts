/**
 * utils/dataLoader.ts - Lazy loading utilities for large data files
 * Implements code splitting for heavy constants to reduce initial bundle size
 */

// Cache for loaded data modules to avoid re-importing
const dataCache = new Map<string, any>();

/**
 * Lazy load clothing data only when needed
 */
export async function loadClothingData() {
  if (dataCache.has('clothing')) {
    return dataCache.get('clothing');
  }
  
  console.log('[DataLoader] Loading clothing data...');
  const module = await import('../constants/characterData/clothing');
  dataCache.set('clothing', module);
  return module;
}

/**
 * Lazy load profession data only when needed
 */
export async function loadProfessionData() {
  if (dataCache.has('professions')) {
    return dataCache.get('professions');
  }
  
  console.log('[DataLoader] Loading profession data...');
  const module = await import('../constants/characterData/professions');
  dataCache.set('professions', module);
  return module;
}

/**
 * Lazy load name data only when needed
 */
export async function loadNameData() {
  if (dataCache.has('names')) {
    return dataCache.get('names');
  }
  
  console.log('[DataLoader] Loading names data...');
  const module = await import('../constants/characterData/names');
  dataCache.set('names', module);
  return module;
}

/**
 * Lazy load religion data only when needed
 */
export async function loadReligionData() {
  if (dataCache.has('religions')) {
    return dataCache.get('religions');
  }
  
  console.log('[DataLoader] Loading religion data...');
  const module = await import('../constants/characterData/religions');
  dataCache.set('religions', module);
  return module;
}

/**
 * Lazy load faction data for a specific cultural zone
 */
export async function loadFactionData(culturalZone: string) {
  const cacheKey = `faction_${culturalZone}`;
  if (dataCache.has(cacheKey)) {
    return dataCache.get(cacheKey);
  }
  
  console.log(`[DataLoader] Loading faction data for ${culturalZone}...`);
  let module;
  
  try {
    switch (culturalZone.toLowerCase()) {
      case 'european':
      case 'europe':
        module = await import('../constants/gameData/factions/european');
        break;
      case 'eastasian':
      case 'east_asian':
        module = await import('../constants/gameData/factions/eastAsian');
        break;
      case 'southasian':
      case 'south_asian':
        module = await import('../constants/gameData/factions/southAsian');
        break;
      case 'mena':
      case 'middle_east_north_africa':
        module = await import('../constants/gameData/factions/mena');
        break;
      case 'southamerican':
      case 'south_american':
        module = await import('../constants/gameData/factions/southAmerican');
        break;
      case 'subsaharanafrican':
      case 'sub_saharan_african':
        module = await import('../constants/gameData/factions/subSaharanAfrican');
        break;
      case 'northamericanprecolumbian':
      case 'north_american_precolumbian':
        module = await import('../constants/gameData/factions/northAmericanPreColumbian');
        break;
      case 'northamericancolonial':
      case 'north_american_colonial':
        module = await import('../constants/gameData/factions/northAmericanColonial');
        break;
      case 'oceania':
        module = await import('../constants/gameData/factions/oceania');
        break;
      default:
        console.warn(`[DataLoader] Unknown cultural zone: ${culturalZone}, loading European data as fallback`);
        module = await import('../constants/gameData/factions/european');
    }
    
    dataCache.set(cacheKey, module);
    return module;
  } catch (error) {
    console.error(`[DataLoader] Failed to load faction data for ${culturalZone}:`, error);
    // Fallback to European data
    module = await import('../constants/gameData/factions/european');
    dataCache.set(cacheKey, module);
    return module;
  }
}

/**
 * Lazy load procedural city data only when needed
 */
export async function loadProceduralCityData() {
  if (dataCache.has('proceduralCity')) {
    return dataCache.get('proceduralCity');
  }
  
  console.log('[DataLoader] Loading procedural city data...');
  const module = await import('../constants/gameData/proceduralCityData');
  dataCache.set('proceduralCity', module);
  return module;
}

/**
 * Preload critical data that's needed immediately
 * Call this during app initialization for data that must be available sync
 */
export async function preloadCriticalData() {
  console.log('[DataLoader] Preloading critical data...');
  const startTime = performance.now();
  
  // Load only the most essential data synchronously
  await Promise.all([
    loadNameData(),
    loadProfessionData(),
    loadFactionData('european') // Load one default faction
  ]);
  
  const endTime = performance.now();
  console.log(`[DataLoader] Critical data preloaded in ${(endTime - startTime).toFixed(2)}ms`);
}

/**
 * Clear the data cache (useful for memory management)
 */
export function clearDataCache() {
  console.log('[DataLoader] Clearing data cache...');
  dataCache.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return {
    size: dataCache.size,
    keys: Array.from(dataCache.keys())
  };
}
/**
 * services/farmPersistenceService.ts
 * Handles saving and loading farm states to/from localStorage
 */

import { FarmState } from './farmService';

const STORAGE_KEY = 'uhs_farm_states';

interface PersistedFarmState extends FarmState {
  lastVisited: number; // timestamp
  tileX: number;
  tileY: number;
  mapSeed?: string; // Optional map identifier
}

interface FarmStateStorage {
  [key: string]: PersistedFarmState; // key format: "x_y" or "x_y_mapSeed"
}

/**
 * Generate a unique key for a farm based on its location
 */
function generateFarmKey(x: number, y: number, mapSeed?: string): string {
  if (mapSeed) {
    return `${x}_${y}_${mapSeed}`;
  }
  return `${x}_${y}`;
}

/**
 * Load all farm states from localStorage
 */
function loadAllFarmStates(): FarmStateStorage {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return {};
    return JSON.parse(stored);
  } catch (error) {
    console.error('[FarmPersistence] Error loading farm states:', error);
    return {};
  }
}

/**
 * Save all farm states to localStorage
 */
function saveAllFarmStates(states: FarmStateStorage): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(states));
  } catch (error) {
    console.error('[FarmPersistence] Error saving farm states:', error);
  }
}

/**
 * Save a farm state
 */
export function saveFarmState(
  farmState: FarmState,
  tileX: number,
  tileY: number,
  mapSeed?: string
): void {
  const allStates = loadAllFarmStates();
  const key = generateFarmKey(tileX, tileY, mapSeed);

  const persistedState: PersistedFarmState = {
    ...farmState,
    lastVisited: Date.now(),
    tileX,
    tileY,
    mapSeed,
  };

  allStates[key] = persistedState;
  saveAllFarmStates(allStates);

  console.log(`[FarmPersistence] Saved farm at (${tileX}, ${tileY})`, farmState);
}

/**
 * Load a farm state
 */
export function loadFarmState(
  tileX: number,
  tileY: number,
  mapSeed?: string
): FarmState | null {
  const allStates = loadAllFarmStates();
  const key = generateFarmKey(tileX, tileY, mapSeed);

  const persistedState = allStates[key];
  if (!persistedState) {
    console.log(`[FarmPersistence] No saved farm found at (${tileX}, ${tileY})`);
    return null;
  }

  console.log(`[FarmPersistence] Loaded farm at (${tileX}, ${tileY})`, persistedState);

  // Remove persistence-specific fields before returning
  const { lastVisited, tileX: _x, tileY: _y, mapSeed: _seed, ...farmState } = persistedState;
  return farmState as FarmState;
}

/**
 * Check if a farm exists at the given location
 */
export function farmExists(tileX: number, tileY: number, mapSeed?: string): boolean {
  const allStates = loadAllFarmStates();
  const key = generateFarmKey(tileX, tileY, mapSeed);
  return !!allStates[key];
}

/**
 * Delete a farm state
 */
export function deleteFarmState(tileX: number, tileY: number, mapSeed?: string): void {
  const allStates = loadAllFarmStates();
  const key = generateFarmKey(tileX, tileY, mapSeed);
  delete allStates[key];
  saveAllFarmStates(allStates);
  console.log(`[FarmPersistence] Deleted farm at (${tileX}, ${tileY})`);
}

/**
 * Get all saved farms
 */
export function getAllSavedFarms(): PersistedFarmState[] {
  const allStates = loadAllFarmStates();
  return Object.values(allStates);
}

/**
 * Clean up old farm states (optional - remove farms not visited in X days)
 */
export function cleanupOldFarms(daysOld: number = 30): number {
  const allStates = loadAllFarmStates();
  const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);

  let deletedCount = 0;
  Object.keys(allStates).forEach(key => {
    if (allStates[key].lastVisited < cutoffTime) {
      delete allStates[key];
      deletedCount++;
    }
  });

  if (deletedCount > 0) {
    saveAllFarmStates(allStates);
    console.log(`[FarmPersistence] Cleaned up ${deletedCount} old farms`);
  }

  return deletedCount;
}

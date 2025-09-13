/**
 * services/containerCacheService.ts
 * Caches container contents to prevent regeneration on each interaction
 */

import { Item } from '../types';
import { ContainerContents } from './specialMapContainerService';

// Cache structure: mapId -> tileKey -> contents
const containerCache = new Map<string, Map<string, ContainerContents>>();

/**
 * Generate a unique key for a tile position
 */
function getTileKey(x: number, y: number): string {
  return `${x},${y}`;
}

/**
 * Get cached container contents
 */
export function getCachedContents(
  mapId: string,
  x: number,
  y: number
): ContainerContents | null {
  const mapCache = containerCache.get(mapId);
  if (!mapCache) return null;

  const tileKey = getTileKey(x, y);
  return mapCache.get(tileKey) || null;
}

/**
 * Cache container contents
 */
export function cacheContents(
  mapId: string,
  x: number,
  y: number,
  contents: ContainerContents
): void {
  if (!containerCache.has(mapId)) {
    containerCache.set(mapId, new Map());
  }

  const mapCache = containerCache.get(mapId)!;
  const tileKey = getTileKey(x, y);
  mapCache.set(tileKey, contents);
}

/**
 * Update cached contents after taking items
 */
export function updateCachedContents(
  mapId: string,
  x: number,
  y: number,
  remainingItems: Item[]
): void {
  const cached = getCachedContents(mapId, x, y);
  if (cached) {
    cached.items = remainingItems;
    // If all items taken, mark as not valuable
    if (remainingItems.length === 0) {
      cached.isValuable = false;
    }
  }
}

/**
 * Clear cache for a specific map
 */
export function clearMapCache(mapId: string): void {
  containerCache.delete(mapId);
}

/**
 * Clear all cached contents
 */
export function clearAllCache(): void {
  containerCache.clear();
}

/**
 * Check if a container has been opened (exists in cache)
 */
export function hasBeenOpened(
  mapId: string,
  x: number,
  y: number
): boolean {
  const cached = getCachedContents(mapId, x, y);
  return cached !== null;
}

/**
 * Check if a container is empty
 */
export function isContainerEmpty(
  mapId: string,
  x: number,
  y: number
): boolean {
  const cached = getCachedContents(mapId, x, y);
  return cached ? cached.items.length === 0 : false;
}
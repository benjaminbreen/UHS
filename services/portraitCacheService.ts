/**
 * Portrait Caching Service
 * Caches rendered portrait SVGs to prevent expensive re-renders
 */

interface CachedPortrait {
  svg: string;
  timestamp: number;
  characterId: string;
  size: number;
  equippedItems?: string; // JSON string of equipped items for cache invalidation
}

class PortraitCacheService {
  private cache: Map<string, CachedPortrait> = new Map();
  private readonly MAX_CACHE_SIZE = 50;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Generate cache key from character and rendering options
   */
  private getCacheKey(
    characterId: string,
    size: number,
    useEquippedItems: boolean = false
  ): string {
    return `${characterId}-${size}-${useEquippedItems}`;
  }

  /**
   * Get cached portrait if valid
   */
  getCachedPortrait(
    characterId: string,
    size: number,
    useEquippedItems: boolean = false,
    currentEquippedItems?: any
  ): string | null {
    const key = this.getCacheKey(characterId, size, useEquippedItems);
    const cached = this.cache.get(key);

    if (!cached) return null;

    // Check if cache is expired
    if (Date.now() - cached.timestamp > this.CACHE_DURATION) {
      this.cache.delete(key);
      return null;
    }

    // Check if equipped items have changed (if relevant)
    if (useEquippedItems && currentEquippedItems) {
      const currentItemsStr = JSON.stringify(currentEquippedItems);
      if (cached.equippedItems !== currentItemsStr) {
        this.cache.delete(key);
        return null;
      }
    }

    return cached.svg;
  }

  /**
   * Store rendered portrait in cache
   */
  setCachedPortrait(
    characterId: string,
    size: number,
    svg: string,
    useEquippedItems: boolean = false,
    equippedItems?: any
  ): void {
    // Enforce cache size limit
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      // Remove oldest entry
      const oldestKey = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)[0][0];
      this.cache.delete(oldestKey);
    }

    const key = this.getCacheKey(characterId, size, useEquippedItems);
    this.cache.set(key, {
      svg,
      timestamp: Date.now(),
      characterId,
      size,
      equippedItems: equippedItems ? JSON.stringify(equippedItems) : undefined
    });
  }

  /**
   * Clear cache for specific character
   */
  clearCharacterCache(characterId: string): void {
    const keysToDelete: string[] = [];
    this.cache.forEach((value, key) => {
      if (value.characterId === characterId) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Clear entire cache
   */
  clearAllCache(): void {
    this.cache.clear();
  }
}

export const portraitCache = new PortraitCacheService();
/**
 * services/cityDescriptionCacheService.ts - Cache service for LLM-generated city descriptions
 * Prevents repeated API calls for the same urban tile during a playthrough
 */

interface CachedCityDescription {
    description: string;
    atmosphere: string;
    workspaces: string;
    timestamp: number;
}

class CityDescriptionCacheService {
    private cache: Map<string, CachedCityDescription> = new Map();

    /**
     * Generate a cache key from tile coordinates
     */
    private getCacheKey(tileX: number, tileY: number): string {
        return `${tileX},${tileY}`;
    }

    /**
     * Get a cached description if it exists
     */
    getCachedDescription(tileX: number, tileY: number): CachedCityDescription | null {
        const key = this.getCacheKey(tileX, tileY);
        const cached = this.cache.get(key);

        if (cached) {
            return cached;
        }

        return null;
    }

    /**
     * Store a description in the cache
     */
    setCachedDescription(
        tileX: number,
        tileY: number,
        description: string,
        atmosphere: string,
        workspaces: string
    ): void {
        const key = this.getCacheKey(tileX, tileY);

        this.cache.set(key, {
            description,
            atmosphere,
            workspaces,
            timestamp: Date.now()
        });
    }

    /**
     * Clear the cache (useful when starting a new game)
     */
    clearCache(): void {
        this.cache.clear();
        console.log('[CityDescriptionCache] Cache cleared - next city descriptions will be regenerated');
    }

    /**
     * Clear cache for a specific tile (useful for testing)
     */
    clearTileCache(tileX: number, tileY: number): void {
        const key = this.getCacheKey(tileX, tileY);
        const deleted = this.cache.delete(key);
        if (deleted) {
            console.log(`[CityDescriptionCache] Cleared cache for tile (${tileX}, ${tileY})`);
        }
    }

    /**
     * Get cache size for debugging
     */
    getCacheSize(): number {
        return this.cache.size;
    }
}

// Export singleton instance
export const cityDescriptionCacheService = new CityDescriptionCacheService();

// Expose for debugging in browser console
if (typeof window !== 'undefined') {
    (window as any).cityDescriptionCache = cityDescriptionCacheService;
}
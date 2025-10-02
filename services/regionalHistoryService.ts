/**
 * services/regionalHistoryService.ts - Lazy-loading service for granular regional history
 */

import { CulturalZone, HistoricalEra } from '../types';
import { RegionalHistoryData } from '../types/regionalHistory';
import { HISTORY_GUIDE_DATA } from '../constants/gameData/historyguide';

class RegionalHistoryService {
    private cache: Map<string, RegionalHistoryData[CulturalZone]> = new Map();
    private loadingPromises: Map<string, Promise<void>> = new Map();

    /**
     * Get historical description for a specific region, year, and cultural zone
     */
    async getHistoricalContext(
        culturalZone: CulturalZone,
        region: string,
        year: number,
        era: HistoricalEra
    ): Promise<string> {
        // Ensure data is loaded for this zone
        await this.ensureLoaded(culturalZone);

        // Calculate century (e.g., 1473 → 1400)
        const century = this.yearToCentury(year);

        // Try to find specific regional + century description
        const zoneData = this.cache.get(culturalZone);
        if (zoneData) {
            // Exact match: region + century
            const exactMatch = zoneData[region]?.[century];
            if (exactMatch) {
                return exactMatch;
            }

            // Fallback 1: Try adjacent centuries (±1)
            const adjacentCentury = this.findAdjacentCentury(zoneData[region], century);
            if (adjacentCentury) {
                return adjacentCentury;
            }

            // Fallback 2: Try other regions in same zone and century
            const sameZoneCentury = this.findSameZoneCentury(zoneData, century);
            if (sameZoneCentury) {
                return sameZoneCentury;
            }
        }

        // Fallback 3: Use era-level description from original system
        const eraDescription = HISTORY_GUIDE_DATA[culturalZone]?.[era];
        if (eraDescription) {
            return eraDescription;
        }

        // Final fallback
        return "No specific historical context is available for this time and place. The world is yours to discover.";
    }

    /**
     * Preload data for a cultural zone
     */
    async preloadZone(culturalZone: CulturalZone): Promise<void> {
        await this.ensureLoaded(culturalZone);
    }

    /**
     * Check if a zone has regional data available
     */
    hasRegionalData(culturalZone: CulturalZone): boolean {
        return culturalZone === 'EUROPEAN' ||
               culturalZone === 'MENA' ||
               culturalZone === 'EAST_ASIAN' ||
               culturalZone === 'NORTH_AMERICAN_PRE_COLUMBIAN' ||
               culturalZone === 'NORTH_AMERICAN_COLONIAL' ||
               culturalZone === 'SOUTH_ASIAN' ||
               culturalZone === 'SUB_SAHARAN_AFRICAN' ||
               culturalZone === 'SOUTH_AMERICAN' ||
               culturalZone === 'OCEANIA';
    }

    /**
     * Clear cache (useful for testing/memory management)
     */
    clearCache(): void {
        this.cache.clear();
        this.loadingPromises.clear();
    }

    // ========================================
    // Private Helper Methods
    // ========================================

    /**
     * Ensure data is loaded for a zone (with deduplication)
     */
    private async ensureLoaded(culturalZone: CulturalZone): Promise<void> {
        // Already cached
        if (this.cache.has(culturalZone)) {
            return;
        }

        // Already loading
        if (this.loadingPromises.has(culturalZone)) {
            await this.loadingPromises.get(culturalZone);
            return;
        }

        // Start loading
        const loadPromise = this.loadZoneData(culturalZone);
        this.loadingPromises.set(culturalZone, loadPromise);

        try {
            await loadPromise;
        } finally {
            this.loadingPromises.delete(culturalZone);
        }
    }

    /**
     * Load regional history data for a zone
     */
    private async loadZoneData(culturalZone: CulturalZone): Promise<void> {
        try {
            let data: RegionalHistoryData[CulturalZone];

            switch (culturalZone) {
                case 'EUROPEAN':
                    const europeModule = await import('../constants/gameData/regionalHistory/europe');
                    data = europeModule.EUROPE_REGIONAL_HISTORY;
                    break;
                case 'MENA':
                    const menaModule = await import('../constants/gameData/regionalHistory/mena');
                    data = menaModule.MENA_REGIONAL_HISTORY;
                    break;
                case 'EAST_ASIAN':
                    const eastAsiaModule = await import('../constants/gameData/regionalHistory/eastAsia');
                    data = eastAsiaModule.EAST_ASIA_REGIONAL_HISTORY;
                    break;
                case 'NORTH_AMERICAN_PRE_COLUMBIAN':
                    const naPreColumbianModule = await import('../constants/gameData/regionalHistory/northAmerica');
                    data = naPreColumbianModule.NORTH_AMERICA_REGIONAL_HISTORY;
                    break;
                case 'NORTH_AMERICAN_COLONIAL':
                    const naColonialModule = await import('../constants/gameData/regionalHistory/northAmerica');
                    data = naColonialModule.NORTH_AMERICA_COLONIAL_HISTORY;
                    break;
                case 'SOUTH_ASIAN':
                    const southAsiaModule = await import('../constants/gameData/regionalHistory/southAsia');
                    data = southAsiaModule.SOUTH_ASIA_REGIONAL_HISTORY;
                    break;
                case 'SUB_SAHARAN_AFRICAN':
                    const subSaharanAfricaModule = await import('../constants/gameData/regionalHistory/subSaharanAfrica');
                    data = subSaharanAfricaModule.SUB_SAHARAN_AFRICA_REGIONAL_HISTORY;
                    break;
                case 'SOUTH_AMERICAN':
                    const southAmericaModule = await import('../constants/gameData/regionalHistory/southAmerica');
                    data = southAmericaModule.SOUTH_AMERICA_REGIONAL_HISTORY;
                    break;
                case 'OCEANIA':
                    const oceaniaModule = await import('../constants/gameData/regionalHistory/oceania');
                    data = oceaniaModule.OCEANIA_REGIONAL_HISTORY;
                    break;
                default:
                    // No regional data available for this zone yet
                    return;
            }

            this.cache.set(culturalZone, data);
        } catch (error) {
            console.error(`Failed to load regional history for ${culturalZone}:`, error);
        }
    }

    /**
     * Convert year to century start (e.g., 1473 → 1400)
     */
    private yearToCentury(year: number): number {
        if (year < 0) {
            // BCE years: -500 → -600
            return Math.floor(year / 100) * 100;
        } else {
            // CE years: 1473 → 1400
            return Math.floor(year / 100) * 100;
        }
    }

    /**
     * Find closest adjacent century description in same region
     */
    private findAdjacentCentury(
        regionData: { [century: number]: string } | undefined,
        targetCentury: number
    ): string | null {
        if (!regionData) return null;

        const centuries = Object.keys(regionData).map(Number).sort((a, b) => a - b);

        if (centuries.length === 0) return null;

        // Find the closest century by absolute distance
        let closestCentury = centuries[0];
        let minDistance = Math.abs(targetCentury - closestCentury);

        for (const century of centuries) {
            const distance = Math.abs(targetCentury - century);
            if (distance < minDistance) {
                minDistance = distance;
                closestCentury = century;
            }
        }

        return regionData[closestCentury];
    }

    /**
     * Find any description in the same zone and century
     */
    private findSameZoneCentury(
        zoneData: { [region: string]: { [century: number]: string } },
        targetCentury: number
    ): string | null {
        for (const region of Object.keys(zoneData)) {
            const description = zoneData[region]?.[targetCentury];
            if (description) {
                return description;
            }
        }
        return null;
    }
}

export const regionalHistoryService = new RegionalHistoryService();

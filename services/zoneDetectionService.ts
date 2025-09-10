/**
 * Zone Detection Service
 * Provides robust detection of zones and regions from map area names
 * Critical for URL state restoration
 */

import { GEOGRAPHICAL_DATA } from '../constants/gameData/geography';

export interface ZoneInfo {
    zone: string;
    region: string;
}

/**
 * Find the zone and region for a given map area name
 * Searches through ALL zones in GEOGRAPHICAL_DATA
 */
export function findZoneForMapArea(mapArea: string): ZoneInfo | null {
    console.log('[ZoneDetection] Searching for map area:', mapArea);
    
    if (!mapArea) {
        console.error('[ZoneDetection] Map area is empty');
        return null;
    }
    
    // Search all zones
    for (const [zoneName, zoneData] of Object.entries(GEOGRAPHICAL_DATA)) {
        // Skip if not an object (safety check)
        if (typeof zoneData !== 'object' || !zoneData) continue;
        
        // Search all regions in this zone
        for (const [regionName, regionData] of Object.entries(zoneData)) {
            // Skip if not an object
            if (typeof regionData !== 'object' || !regionData) continue;
            
            // Search all areas in this region
            for (const area of Object.values(regionData)) {
                if (area && typeof area === 'object' && 'name' in area) {
                    if (area.name === mapArea) {
                        console.log(`[ZoneDetection] Found "${mapArea}" in zone "${zoneName}", region "${regionName}"`);
                        return { zone: zoneName, region: regionName };
                    }
                }
            }
        }
    }
    
    console.error(`[ZoneDetection] Could not find map area "${mapArea}" in any zone`);
    return null;
}

/**
 * Get all map areas in a specific zone
 */
export function getMapAreasInZone(zoneName: string): string[] {
    const areas: string[] = [];
    const zoneData = GEOGRAPHICAL_DATA[zoneName];
    
    if (!zoneData) {
        console.error(`[ZoneDetection] Zone "${zoneName}" not found`);
        return areas;
    }
    
    for (const regionData of Object.values(zoneData)) {
        if (typeof regionData !== 'object' || !regionData) continue;
        
        for (const area of Object.values(regionData)) {
            if (area && typeof area === 'object' && 'name' in area) {
                areas.push(area.name);
            }
        }
    }
    
    return areas;
}

/**
 * Validate if a zone name exists
 */
export function isValidZone(zoneName: string): boolean {
    return zoneName in GEOGRAPHICAL_DATA;
}

/**
 * Get the default zone to use as fallback
 */
export function getDefaultZone(): string {
    return 'Europe'; // Most stable/complete zone
}

/**
 * Find a similar map area name (fuzzy matching)
 * Useful for handling typos or slight variations
 */
export function findSimilarMapArea(searchArea: string): ZoneInfo | null {
    const searchLower = searchArea.toLowerCase().trim();
    
    for (const [zoneName, zoneData] of Object.entries(GEOGRAPHICAL_DATA)) {
        if (typeof zoneData !== 'object' || !zoneData) continue;
        
        for (const [regionName, regionData] of Object.entries(zoneData)) {
            if (typeof regionData !== 'object' || !regionData) continue;
            
            for (const area of Object.values(regionData)) {
                if (area && typeof area === 'object' && 'name' in area) {
                    const areaLower = area.name.toLowerCase();
                    
                    // Check for exact match (case-insensitive)
                    if (areaLower === searchLower) {
                        console.log(`[ZoneDetection] Found similar area (case-insensitive): "${area.name}"`);
                        return { zone: zoneName, region: regionName };
                    }
                    
                    // Check if one contains the other
                    if (areaLower.includes(searchLower) || searchLower.includes(areaLower)) {
                        console.log(`[ZoneDetection] Found similar area (partial match): "${area.name}"`);
                        return { zone: zoneName, region: regionName };
                    }
                }
            }
        }
    }
    
    return null;
}

/**
 * Get zone display name from internal name
 */
export function getZoneDisplayName(zoneName: string): string {
    const displayNames: Record<string, string> = {
        'Europe': 'Europe',
        'North America': 'North America',
        'South America': 'South America',
        'MENA': 'Middle East & North Africa',
        'Sub Saharan Africa': 'Sub-Saharan Africa',
        'South Asia': 'South Asia',
        'East Asia': 'East Asia',
        'Oceania': 'Oceania'
    };
    
    return displayNames[zoneName] || zoneName;
}

// Export singleton instance for convenience
export const zoneDetectionService = {
    findZoneForMapArea,
    getMapAreasInZone,
    isValidZone,
    getDefaultZone,
    findSimilarMapArea,
    getZoneDisplayName
};
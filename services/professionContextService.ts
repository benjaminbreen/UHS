/**
 * professionContextService.ts
 * Maps geographic regions and structure types to profession contexts
 * for historically accurate NPC profession selection
 */

import { TerrainStructureType, CulturalZone, HistoricalEra } from '../types';

export type ProfessionContext = 'FRONTIER' | 'URBAN' | 'NATIVE_AMERICAN' | 'RURAL' | 'MARITIME' | 'GENERAL';

/**
 * Direct mapping of geography.ts regions to profession contexts
 * Based on actual region names from constants/gameData/geography.ts
 */
const REGION_TO_CONTEXT_MAP: Record<string, ProfessionContext[]> = {
    // NORTH AMERICA - FRONTIER REGIONS
    "Great Plains": ['FRONTIER', 'RURAL'],
    "Southwest": ['FRONTIER', 'NATIVE_AMERICAN'],
    "Northern Rockies": ['FRONTIER', 'RURAL'],
    "Northern California": ['FRONTIER', 'RURAL'], // Gold Rush era
    "Southern California": ['FRONTIER', 'RURAL'], // Pre-1900s
    "Central California Coast": ['FRONTIER', 'RURAL'],
    "Pacific Coast": ['FRONTIER', 'MARITIME'],
    
    // NORTH AMERICA - NATIVE AMERICAN REGIONS
    "Arctic and Subarctic": ['NATIVE_AMERICAN'],
    "Ancestral Puebloan Lands": ['NATIVE_AMERICAN'],
    
    // NORTH AMERICA - URBAN/DEVELOPED
    "Northeast Woodlands": ['URBAN', 'RURAL'],
    "Atlantic Coast": ['URBAN', 'MARITIME'],
    "Mississippi Valley": ['RURAL', 'URBAN'], // Mixed, has cities like St. Louis
    "Southeast": ['RURAL', 'URBAN'],
    
    // NORTH AMERICA - OTHER
    "Mexico and Central Highlands": ['RURAL', 'URBAN'],
    "Central America": ['RURAL'],
    "The Caribbean": ['MARITIME', 'RURAL'],
    
    // EUROPE - Generally URBAN or RURAL, no FRONTIER
    "British Isles": ['URBAN', 'RURAL'],
    "France": ['URBAN', 'RURAL'],
    "Germanic Lands": ['URBAN', 'RURAL'],
    "Italy": ['URBAN', 'RURAL'],
    "Iberian Peninsula": ['URBAN', 'RURAL', 'MARITIME'],
    "Low Countries": ['URBAN', 'MARITIME'],
    "Scandinavia": ['RURAL', 'MARITIME'],
    "Eastern Europe": ['RURAL', 'URBAN'],
    "Central Europe": ['URBAN', 'RURAL'],
    "Balkans": ['RURAL'],
    "Greece and Aegean": ['URBAN', 'MARITIME'],
    "Ural and Arctic Europe": ['RURAL', 'FRONTIER'], // Remote enough to be frontier-like
    
    // ASIA
    "Siberia": ['FRONTIER', 'RURAL'],
    "Kazakh Steppes": ['FRONTIER', 'RURAL'],
    "Mongolia and Manchuria": ['FRONTIER', 'RURAL'],
    "Central Asian Oases": ['RURAL', 'URBAN'],
    "Xinjiang": ['FRONTIER', 'RURAL'],
    
    // OCEANIA
    "Australia – Outback and Center": ['FRONTIER', 'RURAL'],
    "Australia – West and Desert": ['FRONTIER'],
    "Australia – Southeast": ['URBAN', 'RURAL'],
    "Australia – North and Queensland": ['FRONTIER', 'RURAL'],
    
    // SOUTH AMERICA
    "Amazon Basin": ['FRONTIER', 'NATIVE_AMERICAN'],
    "Patagonia": ['FRONTIER', 'RURAL'],
    "Gran Chaco and Pampas": ['FRONTIER', 'RURAL'],
    
    // Default for unmapped regions
    // Most other regions default to RURAL/URBAN mix
};

/**
 * Get profession context based on actual game state
 * @param region - The region name from geography.ts
 * @param structureType - Type of structure NPC is in (if any)
 * @param citySize - Population of city (if in a city)
 * @param culturalZone - Cultural zone from CulturalZone enum
 * @param era - Historical era
 * @returns The most appropriate profession context
 */
export function getProfessionContext(
    region?: string,
    structureType?: TerrainStructureType,
    citySize?: number,
    culturalZone?: CulturalZone,
    era?: HistoricalEra
): ProfessionContext {
    
    // Special handling for Industrial Era where these contexts matter most
    if (era === HistoricalEra.INDUSTRIAL_ERA) {
        
        // Structure type overrides region-based context
        if (structureType === 'CITY') {
            // Large cities are always URBAN
            if (citySize && citySize > 50000) {
                return 'URBAN';
            }
            // Smaller cities might still be frontier towns
            if (region && REGION_TO_CONTEXT_MAP[region]?.includes('FRONTIER')) {
                // Small frontier city (like a mining town)
                if (citySize && citySize < 10000) {
                    return 'FRONTIER';
                }
            }
            return 'URBAN';
        }
        
        // Check for Native American context
        if (culturalZone === 'NORTH_AMERICAN_PRE_COLUMBIAN') {
            return 'NATIVE_AMERICAN';
        }
        
        // Region-based mapping
        if (region && REGION_TO_CONTEXT_MAP[region]) {
            const contexts = REGION_TO_CONTEXT_MAP[region];
            
            // Prioritize FRONTIER if available (more specific)
            if (contexts.includes('FRONTIER')) {
                return 'FRONTIER';
            }
            
            // Then NATIVE_AMERICAN
            if (contexts.includes('NATIVE_AMERICAN')) {
                return 'NATIVE_AMERICAN';
            }
            
            // Then URBAN
            if (contexts.includes('URBAN') && structureType !== 'FARM') {
                return 'URBAN';
            }
            
            // Default to RURAL for farming areas
            if (contexts.includes('RURAL')) {
                return 'RURAL';
            }
        }
    }
    
    // For other eras, we can still use context but it's less critical
    // Medieval era doesn't have FRONTIER or NATIVE_AMERICAN contexts
    if (era && [
        HistoricalEra.PREHISTORY,
        HistoricalEra.ANTIQUITY,
        HistoricalEra.MEDIEVAL,
        HistoricalEra.RENAISSANCE_EARLY_MODERN,
        HistoricalEra.RENAISSANCE_EARLY_MODERN
    ].includes(era)) {
        // These eras don't use FRONTIER/NATIVE_AMERICAN categories
        if (structureType === 'CITY' || (citySize && citySize > 10000)) {
            return 'URBAN';
        }
        return 'RURAL';
    }
    
    // Modern and Future eras might have different contexts
    if (era === HistoricalEra.MODERN_ERA || era === HistoricalEra.FUTURE_ERA) {
        if (structureType === 'CITY' || (citySize && citySize > 20000)) {
            return 'URBAN';
        }
        return 'GENERAL';
    }
    
    // Ultimate fallback
    return 'GENERAL';
}

/**
 * Check if a profession context is valid for the given era
 * @param context - The profession context
 * @param era - Historical era
 * @returns Whether this context makes sense for this era
 */
export function isContextValidForEra(context: ProfessionContext, era: HistoricalEra): boolean {
    // FRONTIER and NATIVE_AMERICAN are primarily Industrial Era concepts
    if (context === 'FRONTIER' || context === 'NATIVE_AMERICAN') {
        return era === HistoricalEra.INDUSTRIAL_ERA;
    }
    
    // URBAN and RURAL work for most eras
    if (context === 'URBAN' || context === 'RURAL') {
        return true;
    }
    
    // MARITIME works for any era with seafaring
    if (context === 'MARITIME') {
        return era !== HistoricalEra.PREHISTORY;
    }
    
    // GENERAL works for everything
    return true;
}

/**
 * Get a fallback context if the specific one doesn't have professions
 * @param preferredContext - The ideal context
 * @param era - Historical era
 * @returns A fallback context that should have professions
 */
export function getFallbackContext(preferredContext: ProfessionContext, era: HistoricalEra): ProfessionContext {
    // If the preferred context isn't valid for this era, fall back
    if (!isContextValidForEra(preferredContext, era)) {
        if (preferredContext === 'FRONTIER' || preferredContext === 'NATIVE_AMERICAN') {
            return 'RURAL';
        }
    }
    
    // For Industrial Era, we have specific fallback patterns
    if (era === HistoricalEra.INDUSTRIAL_ERA) {
        if (preferredContext === 'MARITIME') {
            return 'URBAN'; // Port cities
        }
    }
    
    // General fallback chain
    if (preferredContext === 'FRONTIER') return 'RURAL';
    if (preferredContext === 'NATIVE_AMERICAN') return 'RURAL';
    if (preferredContext === 'MARITIME') return 'URBAN';
    
    return 'GENERAL';
}
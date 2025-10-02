/**
 * types/regionalHistory.ts - Types for granular regional and temporal history descriptions
 */

import { CulturalZone, HistoricalEra } from './index';

/**
 * A single historical description entry for a specific region and century
 */
export interface RegionalHistoryEntry {
    region: string; // Geographic region name (e.g., "British Isles", "Levant", "Mesopotamia")
    century: number; // Century start year (e.g., 1200, 1300, 1400)
    description: string; // Historical context description
}

/**
 * Map structure: CulturalZone → Region → Century → Description
 */
export type RegionalHistoryData = {
    [zone in CulturalZone]?: {
        [region: string]: {
            [century: number]: string;
        };
    };
};

/**
 * Metadata for lazy loading
 */
export interface RegionalHistoryMetadata {
    zone: CulturalZone;
    availableRegions: string[];
    centuryCoverage: {
        start: number; // Earliest century with data
        end: number;   // Latest century with data
    };
}

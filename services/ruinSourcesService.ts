/**
 * services/ruinSourcesService.ts
 * Service for discovering historically appropriate primary sources in ruins
 */

import { MapData, CulturalZone } from '../types';

interface PrimarySource {
    id: string;
    title: string;
    author: string;
    year: number;
    culturalZone: string;
    era: string;
    text: string;
    discovered?: boolean;
}

/**
 * Maps game cultural zones to source metadata file prefixes
 */
const ZONE_TO_PREFIX: Record<string, string> = {
    'Europe': 'europe',
    'MENA': 'mena',
    'Asia': 'asia',
    'Africa': 'sub-saharan-africa',
    'North America': 'north-america',
    'South America': 'south-america',
    'Oceania': 'oceania'
};

/**
 * Maps era names to source file suffixes
 */
const ERA_TO_SUFFIX: Record<string, string> = {
    'Prehistoric': 'prehistory',
    'Ancient': 'antiquity',
    'Medieval': 'medieval',
    'Renaissance': 'renaissance-early-modern',
    'Early Modern': 'renaissance-early-modern',
    'Industrial': 'industrial',
    'Modern': 'modern',
    'Future': 'future'
};

class RuinSourcesService {
    private sourceCache: Map<string, PrimarySource[]> = new Map();
    
    /**
     * Get primary sources that could be found in a ruin
     * @param mapData Current map data with cultural zone and time period
     * @param ruinAge Age of the ruin in years
     * @returns Array of sources that predate the ruin
     */
    public async getSourcesForRuin(
        mapData: MapData, 
        ruinAge: string
    ): Promise<PrimarySource[]> {
        const currentYear = parseInt(mapData.timeSlice || '1500');
        
        // Calculate when the ruin was built
        const ageYears = this.parseAge(ruinAge);
        const ruinBuiltYear = currentYear - ageYears;
        
        // Get the cultural zone
        const zone = mapData.culturalZone || mapData.continent || 'Europe';
        const prefix = ZONE_TO_PREFIX[zone] || 'europe';
        
        // Load sources from appropriate files
        const sources = await this.loadSourcesForZone(prefix, ruinBuiltYear);
        
        // Filter to only sources that would realistically be in this ruin
        // (created before the ruin was abandoned, from same or connected regions)
        return sources.filter(source => {
            return source.year <= ruinBuiltYear;
        });
    }
    
    /**
     * Parse age string to years
     */
    private parseAge(ageStr: string | number): number {
        // Handle if already a number
        if (typeof ageStr === 'number') {
            return ageStr;
        }
        
        // Convert to string and parse
        const str = String(ageStr || 'Centuries old');
        const match = str.match(/(\d+)/);
        if (match) {
            return parseInt(match[1]);
        }
        
        // Default ages for descriptive strings
        if (str.includes('ancient') || str.includes('millennia')) return 2000;
        if (str.includes('centuries')) return 500;
        if (str.includes('decades')) return 50;
        return 200; // default
    }
    
    /**
     * Load sources from metadata files
     */
    private async loadSourcesForZone(
        zonePrefix: string, 
        maxYear: number
    ): Promise<PrimarySource[]> {
        const cacheKey = `${zonePrefix}-${maxYear}`;
        
        if (this.sourceCache.has(cacheKey)) {
            return this.sourceCache.get(cacheKey)!;
        }
        
        const sources: PrimarySource[] = [];
        
        // Determine which era files to load based on year
        const erasToLoad = this.getRelevantEras(maxYear);
        
        for (const era of erasToLoad) {
            const suffix = ERA_TO_SUFFIX[era] || era.toLowerCase();
            const filename = `${zonePrefix}-${suffix}.json`;
            
            try {
                const response = await fetch(`/sources/metadata/${filename}`);
                if (response.ok) {
                    const data = await response.json();
                    
                    // Convert metadata to our format
                    if (data.sources && Array.isArray(data.sources)) {
                        data.sources.forEach((source: any) => {
                            if (source.year && source.year <= maxYear) {
                                sources.push({
                                    id: source.id || `${zonePrefix}-${source.year}-${sources.length}`,
                                    title: source.title || 'Untitled Manuscript',
                                    author: source.author || 'Unknown',
                                    year: source.year,
                                    culturalZone: zonePrefix,
                                    era: era,
                                    text: source.excerpt || source.text || 'The text is too faded to read...'
                                });
                            }
                        });
                    }
                }
            } catch (error) {
                console.warn(`Could not load sources from ${filename}:`, error);
            }
        }
        
        this.sourceCache.set(cacheKey, sources);
        return sources;
    }
    
    /**
     * Determine which eras are relevant for a given year
     */
    private getRelevantEras(year: number): string[] {
        const eras: string[] = [];
        
        if (year < -3000) eras.push('Prehistoric');
        if (year >= -3000 && year <= 500) eras.push('Ancient');
        if (year >= 500 && year <= 1500) eras.push('Medieval');
        if (year >= 1400 && year <= 1700) eras.push('Renaissance');
        if (year >= 1700 && year <= 1900) eras.push('Industrial');
        if (year >= 1900 && year <= 2100) eras.push('Modern');
        if (year > 2100) eras.push('Future');
        
        return eras;
    }
    
    /**
     * Select a random subset of sources that might be found in a single exploration
     */
    public selectRandomFinds(
        sources: PrimarySource[], 
        count: number = 1
    ): PrimarySource[] {
        const shuffled = [...sources].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, Math.min(count, sources.length));
    }
}

export const ruinSourcesService = new RuinSourcesService();
export type { PrimarySource };
/**
 * services/ruinContextService.ts
 * Gathers historical context for ruins to provide to LLM for educational content generation
 */

import { MapData, CulturalZone, HistoricalEra } from '../types';
import { parseDateString } from '../utils/dateUtils';
import { mapLocationToCulture } from '../utils/mapUtils';

export interface RuinContext {
    year: number;
    culturalZone: CulturalZone;
    era: HistoricalEra;
    biomeType: string;
    ruinType: string; // generic type: 'temple', 'fortress', 'settlement', etc.
    specificRuinName: string; // culturally-specific name like "Templo Mayor" or "Temple of Kukulcan"
    ruinAge: string; // 'ancient', 'old', 'recent'
    ruinMaterial: string; // 'stone', 'wood', 'adobe', etc.
    depth: number; // current floor
    previousDiscoveries: string[]; // track what player already found
    mapLocation?: string; // specific geographic region if available
    climate?: string; // desert, temperate, tropical, etc.
    currentRoomType?: string; // 'treasury', 'altar', 'library', 'storage', 'guard', 'entrance'
    ruinDescription?: string; // full description of the ruin
}

/**
 * Extract comprehensive context from game state for historical accuracy
 */
export const gatherRuinContext = (
    mapData: MapData | undefined,
    ruinType: { name: string; age: string; material?: string; originalType?: string; description?: string },
    depth: number,
    previousDiscoveries: string[] = [],
    currentRoomType?: string
): RuinContext => {
    // Extract date information
    const dateInfo = parseDateString(mapData?.timeSlice || '1500');
    const year = dateInfo.year;
    const era = dateInfo.era as HistoricalEra;

    // Extract cultural zone
    const culturalZone = mapData
        ? mapLocationToCulture(mapData.continent || 'Europe', year) as CulturalZone
        : 'EUROPEAN' as CulturalZone;

    // Get biome information
    const biomeType = mapData?.biome || 'temperate';

    // Extract ruin information - prioritize specific name over generic type
    const specificRuinName = ruinType.name || 'Ancient Ruins';
    const genericRuinType = ruinType.originalType || 'ruins';
    const ruinAge = ruinType.age || 'ancient';
    const ruinMaterial = ruinType.material || 'stone';
    const ruinDescription = ruinType.description || '';

    // Get location-specific information
    const mapLocation = mapData?.mapName || mapData?.continent || 'unknown region';

    // Determine climate from biome
    const climate = determineClimateFromBiome(biomeType);

    return {
        year,
        culturalZone,
        era,
        biomeType,
        ruinType: genericRuinType,
        specificRuinName,
        ruinAge,
        ruinMaterial,
        depth,
        previousDiscoveries,
        mapLocation,
        climate,
        currentRoomType,
        ruinDescription
    };
};

/**
 * Maps biome types to climate descriptions
 */
const determineClimateFromBiome = (biome: string): string => {
    const biomeClimateMap: Record<string, string> = {
        'desert': 'arid desert',
        'oasis': 'desert oasis',
        'tundra': 'arctic tundra',
        'snow': 'arctic',
        'jungle': 'tropical rainforest',
        'dense_forest': 'temperate forest',
        'forest': 'temperate woodland',
        'grassland': 'temperate grassland',
        'steppe': 'semi-arid steppe',
        'wetlands': 'marshy wetlands',
        'mangrove': 'coastal mangrove',
        'hills': 'temperate highlands',
        'mountain': 'mountainous',
        'volcanic_soil': 'volcanic',
        'beach': 'coastal',
        'scrub': 'mediterranean scrubland'
    };

    return biomeClimateMap[biome.toLowerCase()] || 'temperate';
};

/**
 * Generate a descriptive context string for the LLM prompt
 */
export const formatContextForPrompt = (context: RuinContext): string => {
    const locationDetails = [];

    // Add year and era
    locationDetails.push(`Year: ${context.year} (${context.era})`);

    // Add geographic and cultural information
    locationDetails.push(`Location: ${context.mapLocation}, ${context.culturalZone} cultural zone`);

    // Add environmental details
    locationDetails.push(`Environment: ${context.climate} climate, ${context.biomeType} biome`);

    // Add ruin specifics
    const ruinDescription = `${context.ruinAge} ${context.ruinType} made of ${context.ruinMaterial}`;
    locationDetails.push(`Structure: ${ruinDescription}`);

    // Add depth information
    if (context.depth > 1) {
        locationDetails.push(`Depth: Floor ${context.depth} underground`);
    } else {
        locationDetails.push(`Depth: Ground level`);
    }

    // Add previous discoveries if any
    if (context.previousDiscoveries.length > 0) {
        locationDetails.push(`Previous discoveries in these ruins: ${context.previousDiscoveries.slice(-3).join(', ')}`);
    }

    return locationDetails.join('\n');
};

/**
 * Get historically appropriate discovery types based on context
 */
export const getDiscoveryTypes = (context: RuinContext): string[] => {
    const discoveries = [];

    // Time-appropriate writing systems
    if (context.era === 'PREHISTORY') {
        discoveries.push('cave paintings', 'petroglyphs', 'carved symbols');
    } else if (context.era === 'ANTIQUITY') {
        discoveries.push('inscriptions', 'scrolls', 'tablets', 'mosaics');
    } else {
        discoveries.push('manuscripts', 'books', 'documents', 'letters');
    }

    // Culture-specific artifacts
    const culturalArtifacts: Record<string, string[]> = {
        'EUROPEAN': ['pottery shards', 'coins', 'religious artifacts', 'weapons'],
        'EAST_ASIAN': ['porcelain', 'jade objects', 'calligraphy', 'bronze vessels'],
        'MENA': ['oil lamps', 'glass vessels', 'tiles', 'astronomical instruments'],
        'SOUTH_ASIAN': ['statues', 'bronze figurines', 'palm leaf manuscripts', 'stone carvings'],
        'SUB_SAHARAN_AFRICAN': ['masks', 'textiles', 'iron tools', 'beadwork'],
        'NORTH_AMERICAN_PRE_COLUMBIAN': ['pottery', 'woven baskets', 'stone tools', 'shells'],
        'SOUTH_AMERICAN': ['textiles', 'gold ornaments', 'quipu', 'ceramics'],
        'OCEANIA': ['tapa cloth', 'carved wood', 'shell ornaments', 'stone adzes']
    };

    const zoneArtifacts = culturalArtifacts[context.culturalZone] || culturalArtifacts['EUROPEAN'];
    discoveries.push(...zoneArtifacts);

    // Structure-specific discoveries
    if (context.ruinType.includes('temple') || context.ruinType.includes('shrine')) {
        discoveries.push('religious texts', 'ritual objects', 'votive offerings');
    } else if (context.ruinType.includes('fortress') || context.ruinType.includes('castle')) {
        discoveries.push('armor fragments', 'military orders', 'battle damage');
    } else if (context.ruinType.includes('settlement') || context.ruinType.includes('village')) {
        discoveries.push('household items', 'cooking vessels', 'personal belongings');
    }

    return discoveries;
};
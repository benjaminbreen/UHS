/**
 * generation/standardMap/features/HolyPlaceGenerator.ts - Generates holy places for Standard Maps
 */
import { Tile, BiomeType, MapData, SocietalProfile, TerrainStructure, FactionData, HistoricalEra } from '../../../types/index';
import { ValueNoise } from '../../../utils/noise';
import { MAP_WIDTH_TILES, MAP_HEIGHT_TILES, ALTITUDE_LEVELS, STRUCTURE_BLUEPRINTS, FACTION_DATA } from '../../../constants/index';
import { parseDateString } from '../../../utils/dateUtils';
import { mapLocationToCulture } from '../../../utils/mapUtils';
import { RELIGION_DATA } from '../../../constants/characterData/religions';
import { detectCitiesForArea } from '../../../utils/cityDetectionUtils';
import { holySiteEconomyService } from '../../../services/holySiteEconomyService';


const HOLY_PLACE_BASE_CHANCE = 0.004;
const HOLY_PLACE_ANTI_CLUSTERING_RADIUS = 20;
let holyPlaceIdCounter = 0;

const nonHolyPlaceBiomes = [
    BiomeType.DEEP_OCEAN, BiomeType.SHALLOW_OCEAN, BiomeType.RIVER, BiomeType.MAJOR_RIVER,
    BiomeType.HAMLET, BiomeType.LOW_DENSITY_CITY, BiomeType.DENSE_CITY, BiomeType.CITY_CENTER, BiomeType.URBAN,
    BiomeType.ACTIVE_LAVA, BiomeType.FARMLAND, BiomeType.RUINS, BiomeType.PALACE,
    BiomeType.ESTUARY, BiomeType.FRESHWATER_LAKE, BiomeType.CLIFF, BiomeType.MARKETPLACE,
];

export function generateHolyPlaces(mapData: MapData, featurePlacementNoise: ValueNoise, societalProfile: SocietalProfile): TerrainStructure[] {
    const { tiles } = mapData;
    
    // Skip holy place generation for SHOALS archetype
    if (mapData.archetype === 'SHOALS') {
        console.log(`[HolyPlace] Skipping holy place generation for SHOALS archetype`);
        return [];
    }
    
    const holyPlaceTypes = societalProfile.holyPlaceNames;
    if (!holyPlaceTypes || holyPlaceTypes.length === 0) {
        return [];
    }
    
    console.log(`[HolyPlace] Starting holy place generation for localArea="${mapData.localArea}", region="${mapData.region}"`);
    
    const dateInfo = parseDateString(mapData.timeSlice || '1650');
    const culturalZone = mapLocationToCulture(mapData.continent || 'Europe', dateInfo.year);
    const factionData: FactionData | undefined = FACTION_DATA[culturalZone]?.[mapData.region || '']?.[dateInfo.era];

    // Use centralized city detection
    const cityDetection = detectCitiesForArea(mapData.localArea, mapData.region, dateInfo.year, dateInfo.era, false);
    const hasCities = cityDetection.hasCities;

    const generatedHolyPlaces: TerrainStructure[] = [];
    let placesPlaced = 0;
    
    // Reduce holy places when no cities are defined
    let maxPlaces = 1 + Math.floor(featurePlacementNoise.random() * 2); // 1-2 per map
    if (!hasCities) {
        // Only 20% chance of a single holy site when no cities
        if (featurePlacementNoise.random() < 0.2) {
            maxPlaces = 1;
            console.log(`[HolyPlace] No cities found for areas: ${cityDetection.checkedAreas.join(', ')}, spawning 1 holy site`);
        } else {
            maxPlaces = 0;
            console.log(`[HolyPlace] No cities found for areas: ${cityDetection.checkedAreas.join(', ')}, skipping holy site generation`);
        }
    } else {
        console.log(`[HolyPlace] Cities detected (source: ${cityDetection.source}), proceeding with holy place generation`);
    }

    const candidates: { tile: Tile, score: number }[] = [];

    // Score potential locations based on sacrality and isolation
    for (let y = 0; y < MAP_HEIGHT_TILES; y++) {
        for (let x = 0; x < MAP_WIDTH_TILES; x++) {
            const tile = tiles[y][x];
            if (!tile.isLand || nonHolyPlaceBiomes.includes(tile.biome)) continue;

            let score = 1.0;
            if (tile.qualities.sacrality > 0.75) score += 8;
            else if (tile.qualities.sacrality > 0.6) score += 4;
            
            if (tile.biome === BiomeType.MOUNTAIN || tile.biome === BiomeType.HIGH_PEAK) score += 3;
            if (tile.biome === BiomeType.DENSE_FOREST || tile.biome === BiomeType.OASIS) score += 2;
            
            // Check for isolation from settlements
            let isIsolated = true;
            for (let dy = -12; dy <= 12; dy++) {
                for (let dx = -12; dx <= 12; dx++) {
                    const checkX = x + dx; const checkY = y + dy;
                    if (checkX >= 0 && checkX < MAP_WIDTH_TILES && checkY >= 0 && checkY < MAP_HEIGHT_TILES) {
                        const checkBiome = tiles[checkY][checkX].biome;
                        if ([BiomeType.DENSE_CITY, BiomeType.LOW_DENSITY_CITY, BiomeType.HAMLET, BiomeType.CITY_CENTER].includes(checkBiome)) {
                            isIsolated = false; break;
                        }
                    }
                }
                if(!isIsolated) break;
            }
            if (isIsolated) score += 5;
            
            if (score > 6) candidates.push({ tile, score });
        }
    }

    // Sort candidates and try to place
    candidates.sort((a,b) => b.score - a.score);
    
    for (const candidate of candidates) {
        if (placesPlaced >= maxPlaces) break;
        const { tile } = candidate;

        let tooClose = false;
        for (let dy = -HOLY_PLACE_ANTI_CLUSTERING_RADIUS; dy <= HOLY_PLACE_ANTI_CLUSTERING_RADIUS; dy++) {
            for (let dx = -HOLY_PLACE_ANTI_CLUSTERING_RADIUS; dx <= HOLY_PLACE_ANTI_CLUSTERING_RADIUS; dx++) {
                 const checkX = tile.x + dx; const checkY = tile.y + dy;
                 if (checkX >= 0 && checkX < MAP_WIDTH_TILES && checkY >= 0 && checkY < MAP_HEIGHT_TILES) {
                    if (tiles[checkY][checkX].biome === BiomeType.HOLY_SITE) {
                        tooClose = true; break;
                    }
                 }
            }
            if(tooClose) break;
        }

        if (!tooClose && featurePlacementNoise.random() < HOLY_PLACE_BASE_CHANCE * (candidate.score / 5)) {
            tile.biome = BiomeType.HOLY_SITE;
            const holyPlaceName = holyPlaceTypes[Math.floor(featurePlacementNoise.random() * holyPlaceTypes.length)];
            tile.holyPlaceType = holyPlaceName;
            
            // Assign religion based on region and era
            let selectedReligion: string | undefined;
            const regionReligions = RELIGION_DATA[culturalZone]?.[mapData.region || '']?.[dateInfo.era as HistoricalEra];
            if (regionReligions && regionReligions.length > 0) {
                // Weight-based selection
                const totalWeight = regionReligions.reduce((sum, r) => sum + r.weight, 0);
                let random = featurePlacementNoise.random() * totalWeight;
                selectedReligion = regionReligions[0].religion;
                
                for (const religionEntry of regionReligions) {
                    random -= religionEntry.weight;
                    if (random <= 0) {
                        selectedReligion = religionEntry.religion;
                        break;
                    }
                }
                
                tile.holyPlaceReligion = selectedReligion;
            }

            const blueprint = STRUCTURE_BLUEPRINTS['holy_site'];
            const holySiteStructure: TerrainStructure = {
                id: `holy-site-${holyPlaceIdCounter++}`,
                structureType: 'holy_site',
                name: holyPlaceName,
                location: [tile.x, tile.y],
                economicRole: blueprint.economicRole,
                npcAnchor: blueprint.npcAnchor,
                state: 'active',
                allegianceGroup: factionData?.dominantPower || 'Unaligned', // FIX: Assign allegiance
                inputGoods: societalProfile.holyPlaceConsumes || [],
                outputGoods: societalProfile.holyPlaceProduces || [],
                constructionYear: dateInfo.year - (100 + Math.floor(featurePlacementNoise.random() * 500)), // Older than palaces
                dimensions: {
                    height: 20 + Math.floor(featurePlacementNoise.random() * 30),
                    terraces: holyPlaceName === 'Ziggurat' ? 3 + Math.floor(featurePlacementNoise.random() * 4) : undefined,
                    width: holyPlaceName === 'Sacred Grove' ? 5 + Math.floor(featurePlacementNoise.random() * 10) : undefined,
                },
            };
            
            // Store religion, era, and cultural zone for proper symbol selection
            (holySiteStructure as any).religion = selectedReligion || tile.holyPlaceReligion;
            (holySiteStructure as any).era = dateInfo.era;
            (holySiteStructure as any).culturalZone = culturalZone;
            
            generatedHolyPlaces.push(holySiteStructure);
            tile.structure = holySiteStructure;

            placesPlaced++;
        }
    }
    return generatedHolyPlaces;
}
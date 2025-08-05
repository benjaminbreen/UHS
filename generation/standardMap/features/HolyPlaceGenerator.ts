/**
 * generation/standardMap/features/HolyPlaceGenerator.ts - Generates holy places for Standard Maps
 */
import { Tile, BiomeType, MapData, SocietalProfile, TerrainStructure, FactionData } from '../../../types/index';
import { ValueNoise } from '../../../utils/noise';
import { MAP_WIDTH_TILES, MAP_HEIGHT_TILES, ALTITUDE_LEVELS, STRUCTURE_BLUEPRINTS, FACTION_DATA } from '../../../constants/index';
import { parseDateString } from '../../../utils/dateUtils';
import { mapLocationToCulture } from '../../../utils/mapUtils';


const HOLY_PLACE_BASE_CHANCE = 0.004;
const HOLY_PLACE_ANTI_CLUSTERING_RADIUS = 20;
let holyPlaceIdCounter = 0;

const nonHolyPlaceBiomes = [
    BiomeType.DEEP_OCEAN, BiomeType.SHALLOW_OCEAN, BiomeType.RIVER, BiomeType.MAJOR_RIVER,
    BiomeType.HAMLET, BiomeType.LOW_DENSITY_CITY, BiomeType.DENSE_CITY, BiomeType.URBAN,
    BiomeType.ACTIVE_LAVA, BiomeType.FARMLAND, BiomeType.RUINS, BiomeType.PALACE,
    BiomeType.ESTUARY, BiomeType.FRESHWATER_LAKE, BiomeType.CLIFF,
];

export function generateHolyPlaces(mapData: MapData, featurePlacementNoise: ValueNoise, societalProfile: SocietalProfile): TerrainStructure[] {
    const { tiles } = mapData;
    const holyPlaceTypes = societalProfile.holyPlaceNames;
    if (!holyPlaceTypes || holyPlaceTypes.length === 0) {
        return [];
    }
    
    const dateInfo = parseDateString(mapData.timeSlice || '1650');
    const culturalZone = mapLocationToCulture(mapData.continent || 'Europe', dateInfo.year);
    const factionData: FactionData | undefined = FACTION_DATA[culturalZone]?.[mapData.region || '']?.[dateInfo.era];

    const generatedHolyPlaces: TerrainStructure[] = [];
    let placesPlaced = 0;
    const maxPlaces = 1 + Math.floor(featurePlacementNoise.random() * 2); // 1-2 per map

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
                        if ([BiomeType.DENSE_CITY, BiomeType.LOW_DENSITY_CITY, BiomeType.HAMLET].includes(checkBiome)) {
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
            
            generatedHolyPlaces.push(holySiteStructure);
            tile.structure = holySiteStructure;

            placesPlaced++;
        }
    }
    return generatedHolyPlaces;
}
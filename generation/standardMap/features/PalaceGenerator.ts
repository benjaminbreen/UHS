/**
 * generation/standardMap/features/PalaceGenerator.ts - Generates palaces for Standard Maps
 */
import { Tile, BiomeType, TerrainStructure, SocietalProfile, FactionData, MapData } from '../../../types/index';
import { ValueNoise } from '../../../utils/noise';
import { 
    MAP_WIDTH_TILES, MAP_HEIGHT_TILES, ALTITUDE_LEVELS, STRUCTURE_BLUEPRINTS, FACTION_DATA 
} from '../../../constants/index';
import { parseDateString } from '../../../utils/dateUtils';
import { mapLocationToCulture } from '../../../utils/mapUtils';

const PALACE_BASE_CHANCE = 0.005;
const PALACE_ANTI_CLUSTERING_RADIUS = 25;
let palaceIdCounter = 0;

const nonPalaceBiomes = [
    BiomeType.DEEP_OCEAN, BiomeType.SHALLOW_OCEAN, BiomeType.RIVER, BiomeType.MAJOR_RIVER,
    BiomeType.HAMLET, BiomeType.LOW_DENSITY_CITY, BiomeType.DENSE_CITY, BiomeType.URBAN,
    BiomeType.ACTIVE_LAVA, BiomeType.FARMLAND, BiomeType.RUINS, BiomeType.HOLY_SITE,
    BiomeType.ESTUARY, BiomeType.FRESHWATER_LAKE, BiomeType.CLIFF, BiomeType.WETLANDS,
    BiomeType.SNOW, BiomeType.HIGH_PEAK,
];

export function generatePalaces(tiles: Tile[][], featurePlacementNoise: ValueNoise, societalProfile: SocietalProfile, mapData: MapData): TerrainStructure[] {
    const generatedPalaces: TerrainStructure[] = [];
    const maxPalaces = 1;
    
    const dateInfo = parseDateString(mapData.timeSlice || '1650');
    const culturalZone = mapLocationToCulture(mapData.continent || 'Europe', dateInfo.year);
    const factionData: FactionData | undefined = FACTION_DATA[culturalZone]?.[mapData.region || '']?.[dateInfo.era];
    
    // FIX: Prioritize factionData for names, then fallback to societalProfile
    const palaceTypes = factionData?.structureNames?.palace?.length ? factionData.structureNames.palace : societalProfile.palaceNames;
    if (!palaceTypes || palaceTypes.length === 0) return [];

    const candidates: { tile: Tile, score: number }[] = [];
    
    // Score potential locations
    for (let y = 0; y < MAP_HEIGHT_TILES; y++) {
        for (let x = 0; x < MAP_WIDTH_TILES; x++) {
            const tile = tiles[y][x];
            if (!tile.isLand || nonPalaceBiomes.includes(tile.biome)) continue;

            let score = 1.0;
            if (tile.qualities.safety > 0.75) score += 5;
            if (tile.biome === BiomeType.HILLS) score += 3;
            if (tile.altitude > ALTITUDE_LEVELS.HILLS_START) score += 2;

            // Check proximity to a large city
            let nearCity = false;
            for (let dy = -10; dy <= 10; dy++) {
                for (let dx = -10; dx <= 10; dx++) {
                    const checkX = x + dx;
                    const checkY = y + dy;
                    if (checkX >= 0 && checkX < MAP_WIDTH_TILES && checkY >= 0 && checkY < MAP_HEIGHT_TILES) {
                        if ([BiomeType.DENSE_CITY, BiomeType.LOW_DENSITY_CITY].includes(tiles[checkY][checkX].biome)) {
                            score += 5;
                            nearCity = true;
                            break;
                        }
                    }
                }
                if(nearCity) break;
            }
            if(score > 6) candidates.push({ tile, score });
        }
    }

    // Sort candidates by score and try to place one
    candidates.sort((a,b) => b.score - a.score);

    for(const candidate of candidates) {
        if(generatedPalaces.length >= maxPalaces) break;

        const { tile } = candidate;
        
        let tooClose = false;
        for (let dy = -PALACE_ANTI_CLUSTERING_RADIUS; dy <= PALACE_ANTI_CLUSTERING_RADIUS; dy++) {
            for (let dx = -PALACE_ANTI_CLUSTERING_RADIUS; dx <= PALACE_ANTI_CLUSTERING_RADIUS; dx++) {
                 const checkX = tile.x + dx;
                 const checkY = tile.y + dy;
                 if (checkX >= 0 && checkX < MAP_WIDTH_TILES && checkY >= 0 && checkY < MAP_HEIGHT_TILES) {
                    if (tiles[checkY][checkX].biome === BiomeType.PALACE) {
                        tooClose = true; break;
                    }
                 }
            }
            if(tooClose) break;
        }

        if (!tooClose && featurePlacementNoise.random() < PALACE_BASE_CHANCE * (candidate.score / 4)) {
            tile.biome = BiomeType.PALACE;
            const palaceName = palaceTypes[Math.floor(featurePlacementNoise.random() * palaceTypes.length)];
            tile.palaceType = palaceName;

            const blueprint = STRUCTURE_BLUEPRINTS['palace'];
            const allegiance = factionData?.dominantPower || `The People of ${mapData.localArea}`;
            const palaceStructure: TerrainStructure = {
                id: `palace-${palaceIdCounter++}`,
                structureType: 'palace',
                name: palaceName,
                location: [tile.x, tile.y],
                economicRole: blueprint.economicRole,
                npcAnchor: blueprint.npcAnchor,
                state: 'active',
                allegianceGroup: allegiance,
                treasury: {}, // Initialize empty treasury
                constructionYear: dateInfo.year - (50 + Math.floor(featurePlacementNoise.random() * 300)),
                dimensions: {
                    height: 15 + Math.floor(featurePlacementNoise.random() * 20),
                    width: 20 + Math.floor(featurePlacementNoise.random() * 30),
                    depth: 20 + Math.floor(featurePlacementNoise.random() * 30),
                }
            };
            
            generatedPalaces.push(palaceStructure);
            tile.structure = palaceStructure;
        }
    }
    return generatedPalaces;
}
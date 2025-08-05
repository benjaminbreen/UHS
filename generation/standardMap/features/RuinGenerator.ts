/**
 * generation/standardMap/features/RuinGenerator.ts - Generates ruins for Standard Maps
 */
import { Tile, BiomeType, TerrainStructure, SocietalProfile } from '../../../types/index';
import { ValueNoise } from '../../../utils/noise';
import { 
    MAP_WIDTH_TILES, MAP_HEIGHT_TILES, ALTITUDE_LEVELS,
    RUIN_BASE_CHANCE, RUIN_ANTI_CLUSTERING_RADIUS, STRUCTURE_BLUEPRINTS
} from '../../../constants/index';

let ruinIdCounter = 0;

export function generateRuins(tiles: Tile[][], featurePlacementNoise: ValueNoise, societalProfile: SocietalProfile): TerrainStructure[] {
    const ruinTypes = societalProfile.ruinNames;
    if (!ruinTypes || ruinTypes.length === 0) {
        return []; // Don't generate ruins if none are defined for the culture/era
    }

    const generatedRuins: TerrainStructure[] = [];
    const nonRuinBiomes = [
        BiomeType.DEEP_OCEAN, BiomeType.SHALLOW_OCEAN, BiomeType.RIVER, BiomeType.MAJOR_RIVER,
        BiomeType.HAMLET, BiomeType.LOW_DENSITY_CITY, BiomeType.DENSE_CITY, BiomeType.URBAN,
        BiomeType.ACTIVE_LAVA, BiomeType.FARMLAND, BiomeType.ESTUARY, BiomeType.FRESHWATER_LAKE, BiomeType.CLIFF,
    ];

    let ruinsPlaced = 0;
    const maxRuins = 1 + Math.floor(featurePlacementNoise.random() * 2);

    for (let attempts = 0; attempts < MAP_WIDTH_TILES * MAP_HEIGHT_TILES * 0.1 && ruinsPlaced < maxRuins; attempts++) {
        const x = Math.floor(featurePlacementNoise.random() * MAP_WIDTH_TILES);
        const y = Math.floor(featurePlacementNoise.random() * MAP_HEIGHT_TILES);
        const tile = tiles[y][x];

        if (!tile.isLand || nonRuinBiomes.includes(tile.biome)) continue;
        if (tile.altitude > ALTITUDE_LEVELS.MOUNTAIN_MAX * 0.8 && tile.biome !== BiomeType.HIGH_PEAK) continue; 

        let tooCloseToOtherRuin = false;
        for (let dy = -RUIN_ANTI_CLUSTERING_RADIUS; dy <= RUIN_ANTI_CLUSTERING_RADIUS; dy++) {
            for (let dx = -RUIN_ANTI_CLUSTERING_RADIUS; dx <= RUIN_ANTI_CLUSTERING_RADIUS; dx++) {
                const checkX = x + dx; const checkY = y + dy;
                if (checkX >= 0 && checkX < MAP_WIDTH_TILES && checkY >= 0 && checkY < MAP_HEIGHT_TILES) {
                    if (tiles[checkY][checkX].biome === BiomeType.RUINS) {
                        tooCloseToOtherRuin = true;
                        break;
                    }
                }
            }
            if (tooCloseToOtherRuin) break;
        }
        if (tooCloseToOtherRuin) continue;

        if (featurePlacementNoise.random() < RUIN_BASE_CHANCE * 100) { 
            tile.biome = BiomeType.RUINS;
            const ruinName = ruinTypes[Math.floor(featurePlacementNoise.random() * ruinTypes.length)];
            tile.ruinType = ruinName;

            const blueprint = STRUCTURE_BLUEPRINTS['ruin'];
            const ruinStructure: TerrainStructure = {
                id: `ruin-${ruinIdCounter++}`,
                structureType: 'ruin',
                name: ruinName,
                location: [tile.x, tile.y],
                economicRole: blueprint.economicRole,
                npcAnchor: blueprint.npcAnchor,
                state: 'ruined',
                constructionYear: -500 - Math.floor(featurePlacementNoise.random() * 2000), // Ancient
                dimensions: {
                    height: 10 + Math.floor(featurePlacementNoise.random() * 15)
                }
            };

            generatedRuins.push(ruinStructure);
            tile.structure = ruinStructure;
            ruinsPlaced++;
        }
    }
    return generatedRuins;
}
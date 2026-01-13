/**
 * generation/standardMap/features/RuinGenerator.ts - Generates ruins for Standard Maps
 */
import { Tile, BiomeType, TerrainStructure, SocietalProfile, HistoricalEra, ClimateType } from '../../../types/index';
import { ValueNoise } from '../../../utils/noise';
import { 
    MAP_WIDTH_TILES, MAP_HEIGHT_TILES, ALTITUDE_LEVELS,
    RUIN_BASE_CHANCE, RUIN_ANTI_CLUSTERING_RADIUS, STRUCTURE_BLUEPRINTS
} from '../../../constants/index';
import { generateEnhancedRuin, getRuinArchitecturalStyle } from '../../../services/ruinsService';

let ruinIdCounter = 0;

export function generateRuins(tiles: Tile[][], featurePlacementNoise: ValueNoise, societalProfile: SocietalProfile, mapData?: any): TerrainStructure[] {
    const ruinTypes = societalProfile.ruinNames;
    if (!ruinTypes || ruinTypes.length === 0) {
        return []; // Don't generate ruins if none are defined for the culture/era
    }

    // Get historical context
    const mapAreaName = mapData?.localArea;
    const year = mapData?.timeSlice ? parseInt(mapData.timeSlice) : 1650;
    const culturalZone = mapData?.culturalZone || 'EUROPEAN';
    const era = mapData?.era || 'MEDIEVAL';
    
    // Calculate historically accurate ruin density
    let ruinDensity = 1.0; // Base density
    
    // Historical factors that increase ruins
    if (year > 1500) ruinDensity += 0.5; // More accumulated history
    if (year > 1000) ruinDensity += 0.3;
    if (year > 0) ruinDensity += 0.2;
    
    // Regional factors
    if (culturalZone === 'MENA' || culturalZone === 'EUROPEAN') {
        ruinDensity += 0.5; // Ancient civilizations
    }
    if (culturalZone === 'MESOAMERICAN' || culturalZone === 'SOUTH_AMERICAN') {
        ruinDensity += 0.4; // Pre-Columbian sites
    }
    
    // Check for declined cities (these become ruins)
    let declinedCities: any[] = [];
    if (mapAreaName && year) {
        try {
            const { CITIES_DATA } = require('../../../constants/gameData/cities');
            const areaCities = CITIES_DATA[mapAreaName] || [];
            
            // Find cities that have declined before current year
            declinedCities = areaCities.filter((city: any) => 
                city.declineYear && year > city.declineYear
            );
            
            if (declinedCities.length > 0) {
                ruinDensity += declinedCities.length * 0.3;
                console.log(`[Ruins] Found ${declinedCities.length} declined cities that will become ruins`);
            }
        } catch (error) {
            console.log(`[Ruins] Could not load city data for ${mapAreaName}`);
        }
    }

    const generatedRuins: TerrainStructure[] = [];
    const nonRuinBiomes = [
        BiomeType.DEEP_OCEAN, BiomeType.SHALLOW_OCEAN, BiomeType.RIVER, BiomeType.MAJOR_RIVER,
        BiomeType.HAMLET, BiomeType.LOW_DENSITY_CITY, BiomeType.DENSE_CITY, BiomeType.URBAN,
        BiomeType.ACTIVE_LAVA, BiomeType.FARMLAND, BiomeType.ESTUARY, BiomeType.FRESHWATER_LAKE, BiomeType.CLIFF,
    ];

    let ruinsPlaced = 0;
    // Historically accurate ruin count (0-5 based on density)
    let maxRuins = Math.floor(ruinDensity * (1 + featurePlacementNoise.random() * 2));
    maxRuins = Math.min(maxRuins, 5); // Cap at 5 ruins to leave room for other structures
    
    console.log(`[Ruins] Planning to generate up to ${maxRuins} ruins (density: ${ruinDensity.toFixed(1)})`)

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
            
            // Generate enhanced ruin using the new system
            const region = mapData?.region || mapData?.localArea || 'Generic';
            const climate = mapData?.climate || ClimateType.TEMPERATE;
            const currentEra = mapData?.era || HistoricalEra.MEDIEVAL;
            
            const enhancedRuin = generateEnhancedRuin(
                culturalZone,
                region,
                currentEra as HistoricalEra,
                year,
                climate,
                featurePlacementNoise
            );
            
            // Check if this location is near a declined city (override the generated name)
            let finalRuinName = enhancedRuin.name;
            let constructionYear = year - enhancedRuin.age;
            
            for (const city of declinedCities) {
                const dist = Math.abs(tile.x - x) + Math.abs(tile.y - y);
                if (dist < 5) {
                    finalRuinName = `Ruins of ${city.name}`;
                    constructionYear = city.foundingYear;
                    break;
                }
            }
            
            // Store enhanced ruin data on tile for rendering
            tile.ruinType = finalRuinName;
            tile.culturalZone = culturalZone;
            tile.ruinMaterial = enhancedRuin.material;
            tile.ruinStyle = enhancedRuin.style;
            
            // Get the architectural style that maps to the existing ruin symbols
            const architecturalStyle = getRuinArchitecturalStyle(enhancedRuin, culturalZone, currentEra as HistoricalEra);

            const blueprint = STRUCTURE_BLUEPRINTS['ruin'];
            const ruinStructure: TerrainStructure = {
                id: `ruin-${ruinIdCounter++}`,
                structureType: 'ruin',
                name: finalRuinName,
                location: [tile.x, tile.y],
                economicRole: blueprint.economicRole,
                npcAnchor: blueprint.npcAnchor,
                state: 'ruined',
                constructionYear: constructionYear,
                culturalZone: culturalZone,
                era: enhancedRuin.originalEra,
                dimensions: {
                    height: 10 + Math.floor(featurePlacementNoise.random() * 15)
                },
                customData: {
                    enhancedRuin,
                    description: enhancedRuin.description,
                    age: enhancedRuin.age,
                    material: enhancedRuin.material,
                    style: enhancedRuin.style,
                    architecturalStyle: architecturalStyle, // This is what RuinsSymbolNew expects
                    originalStructureType: enhancedRuin.originalStructureType
                }
            };

            generatedRuins.push(ruinStructure);
            tile.structure = ruinStructure;
            ruinsPlaced++;
        }
    }
    return generatedRuins;
}
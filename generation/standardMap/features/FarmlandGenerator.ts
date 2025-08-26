/**
 * generation/standardMap/features/FarmlandGenerator.ts - Generates farmland for Standard Maps
 */
import { Tile, BiomeType, CulturalZone, ClimateType, MapData, SocietalProfile } from '../../../types/index';
import { ValueNoise } from '../../../utils/noise';
import { 
    MAP_WIDTH_TILES, MAP_HEIGHT_TILES,
    FARMLAND_SETTLEMENT_RADIUS, FARMLAND_MAX_ALTITUDE, CROPS_DATA
} from '../../../constants/index';
import { mapLocationToCulture } from '../../../utils/mapUtils';
import { parseDateString } from '../../../utils/dateUtils';


export function generateFarmland(mapData: MapData, featurePlacementNoise: ValueNoise, continent?: string, timeSlice?: string, societalProfile?: SocietalProfile) {
    if (!societalProfile?.isAgricultural) {
        console.log("[Gen] Skipping farmland generation: society is not agricultural.");
        return; // Don't generate farms for non-agricultural societies
    }
    
    const { tiles, climate } = mapData;
    const dateInfo = parseDateString(timeSlice || '1650');
    const culturalZone = mapLocationToCulture(continent || 'Europe', dateInfo.year);

    const suitableCrops = CROPS_DATA.filter(crop => {
        const zoneMatch = crop.zones.includes(culturalZone);
        const climateMatch = crop.climates.includes(climate);
        const eraStartMatch = !crop.eraStart || dateInfo.year >= crop.eraStart;
        const eraEndMatch = !crop.eraEnd || dateInfo.year <= crop.eraEnd;
        return zoneMatch && climateMatch && eraStartMatch && eraEndMatch;
    });

    if (suitableCrops.length === 0) {
        console.warn(`No suitable crops found for zone ${culturalZone}, climate ${climate}, year ${dateInfo.year}. No farmland will be generated.`);
        return;
    }

    // SAFEGUARD: Limit farms to maximum 20 per map
    const MAX_FARMS = 20;
    let farmCount = 0;

    for (let y = 0; y < MAP_HEIGHT_TILES; y++) {
        for (let x = 0; x < MAP_WIDTH_TILES; x++) {
            // Stop if we've reached the maximum number of farms
            if (farmCount >= MAX_FARMS) {
                console.log(`[Gen] Reached maximum farm limit of ${MAX_FARMS}`);
                return;
            }
            const tile = tiles[y][x];
            if (!tile.isLand || tile.biome === BiomeType.ESTUARY || tile.biome === BiomeType.FRESHWATER_LAKE || tile.biome === BiomeType.CLIFF || !(tile.biome === BiomeType.GRASSLAND || tile.biome === BiomeType.RIVERBANK || tile.biome === BiomeType.STEPPE)) continue;
            if (tile.altitude > FARMLAND_MAX_ALTITUDE) continue;

            let nearSettlement = false;
            let settlementType: BiomeType | null = null;
            for (let dy = -FARMLAND_SETTLEMENT_RADIUS; dy <= FARMLAND_SETTLEMENT_RADIUS; dy++) {
                for (let dx = -FARMLAND_SETTLEMENT_RADIUS; dx <= FARMLAND_SETTLEMENT_RADIUS; dx++) {
                    const checkX = x + dx; const checkY = y + dy;
                    if (checkX >= 0 && checkX < MAP_WIDTH_TILES && checkY >= 0 && checkY < MAP_HEIGHT_TILES) {
                        const checkTileBiome = tiles[checkY][checkX].biome;
                        if ([BiomeType.HAMLET, BiomeType.LOW_DENSITY_CITY, BiomeType.DENSE_CITY].includes(checkTileBiome)) {
                            nearSettlement = true;
                            settlementType = checkTileBiome;
                            break;
                        }
                    }
                }
                if (nearSettlement) break;
            }

            if (nearSettlement) {
                // Check if this is near a modern city (indicated by ROAD tiles)
                let nearModernCity = false;
                const modernCityCheckRadius = 10;
                for (let dy = -modernCityCheckRadius; dy <= modernCityCheckRadius; dy++) {
                    for (let dx = -modernCityCheckRadius; dx <= modernCityCheckRadius; dx++) {
                        const checkX = x + dx;
                        const checkY = y + dy;
                        if (checkX >= 0 && checkX < MAP_WIDTH_TILES && checkY >= 0 && checkY < MAP_HEIGHT_TILES) {
                            if (tiles[checkY][checkX].biome === BiomeType.ROAD) {
                                nearModernCity = true;
                                break;
                            }
                        }
                    }
                    if (nearModernCity) break;
                }
                
                // Skip farmland generation near modern cities
                if (nearModernCity) {
                    continue;
                }
                
                let chance = 0.3;
                if (settlementType === BiomeType.HAMLET) chance = 0.6;
                if (settlementType === BiomeType.LOW_DENSITY_CITY) chance = 0.4;
                if (tile.biome === BiomeType.RIVERBANK) chance += 0.2;
                if (tile.biome === BiomeType.STEPPE) chance *= 0.7; 
                
                if (featurePlacementNoise.random() < chance) {
                    tile.biome = BiomeType.FARMLAND;
                    const chosenCrop = suitableCrops[Math.floor(featurePlacementNoise.random() * suitableCrops.length)];
                    tile.cropType = chosenCrop.name;
                    farmCount++; // Increment farm counter
                }
            }
        }
    }
}
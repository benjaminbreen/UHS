/**
 * generation/standardMap/features/EcologicalFeatureGenerator.ts - Generates ecological features like Wetlands, Oases, Reefs.
 */
import { Tile, BiomeType, ClimateType, MapArchetype } from '../../../types/index';
import { ValueNoise } from '../../../utils/noise';
import { 
    MAP_WIDTH_TILES, MAP_HEIGHT_TILES, ALTITUDE_LEVELS, NOISE_SCALE_HUMIDITY,
    WETLANDS_MAX_ALTITUDE, WETLANDS_MOISTURE_PROXIMITY_FACTOR, OASIS_CHANCE_IN_DESERT, 
    REEF_CHANCE, REEF_MAX_DEPTH_FACTOR
} from '../../../constants/index';

// Helper: Check if near any water body
export function isNearWaterBody(tiles: Tile[][], x: number, y: number, radius: number): boolean {
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (dx === 0 && dy === 0 && radius > 0) continue;
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && nx < MAP_WIDTH_TILES && ny >= 0 && ny < MAP_HEIGHT_TILES) {
        const targetBiome = tiles[ny][nx].biome;
        if (targetBiome === BiomeType.SHALLOW_OCEAN || targetBiome === BiomeType.DEEP_OCEAN || 
            targetBiome === BiomeType.MAJOR_RIVER || targetBiome === BiomeType.OASIS || 
            targetBiome === BiomeType.WETLANDS || targetBiome === BiomeType.REEF || 
            targetBiome === BiomeType.RIVER || targetBiome === BiomeType.HOT_SPRINGS ||
            targetBiome === BiomeType.ESTUARY || targetBiome === BiomeType.FRESHWATER_LAKE ||
            (targetBiome === BiomeType.SHOALS_TILE && !tiles[ny][nx].isLand) ) {
          return true;
        }
      }
    }
  }
  return false;
}

// Helper: Check if near a specific river type
export function isNearSpecificRiver(tiles: Tile[][], x: number, y: number, radius: number, riverType: BiomeType.RIVER | BiomeType.MAJOR_RIVER): boolean {
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (dx === 0 && dy === 0 && radius > 0) continue;
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && nx < MAP_WIDTH_TILES && ny >= 0 && ny < MAP_HEIGHT_TILES) {
        if (tiles[ny][nx].biome === riverType) {
          return true;
        }
      }
    }
  }
  return false;
}


export function generateWetlands(tiles: Tile[][], climate: ClimateType, humidityNoise: ValueNoise, featurePlacementNoise: ValueNoise, archetype: MapArchetype) {
    if (climate === ClimateType.ARID && featurePlacementNoise.random() > 0.2) return;
    for (let y = 0; y < MAP_HEIGHT_TILES; y++) {
        for (let x = 0; x < MAP_WIDTH_TILES; x++) {
            const tile = tiles[y][x];
            if (!tile.isLand || (![BiomeType.GRASSLAND, BiomeType.SCRUB, BiomeType.BEACH, BiomeType.RIVERBANK].includes(tile.biome)) || tile.altitude > WETLANDS_MAX_ALTITUDE || tile.biome === BiomeType.ESTUARY || tile.biome === BiomeType.CLIFF) continue;
            let waterSourceNeighborCount = 0; let isAtRiverMouth = false; 
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (dx === 0 && dy === 0) continue;
                    const nx = x + dx; const ny = y + dy;
                    if (nx >= 0 && nx < MAP_WIDTH_TILES && ny >= 0 && ny < MAP_HEIGHT_TILES) {
                        const neighbor = tiles[ny][nx];
                        if ([BiomeType.RIVER, BiomeType.MAJOR_RIVER, BiomeType.OASIS, BiomeType.SHALLOW_OCEAN, BiomeType.ESTUARY, BiomeType.FRESHWATER_LAKE].includes(neighbor.biome)) waterSourceNeighborCount++;
                        if ((tile.biome === BiomeType.RIVERBANK && [BiomeType.SHALLOW_OCEAN, BiomeType.ESTUARY, BiomeType.FRESHWATER_LAKE].includes(neighbor.biome)) || (tile.isCoast && [BiomeType.RIVER, BiomeType.MAJOR_RIVER].includes(neighbor.biome))) isAtRiverMouth = true;
                    }
                }
            }
            if (waterSourceNeighborCount > 0) {
                const humidityVal = humidityNoise.octaveNoise(x * NOISE_SCALE_HUMIDITY, y * NOISE_SCALE_HUMIDITY, 3, 0.5, 2.0);
                let chance = 0.20; 
                if (waterSourceNeighborCount >= 2) chance += 0.30; 
                if (isAtRiverMouth) chance += 0.40; 
                if (humidityVal > 0.55) chance += 0.15; 
                if (climate === ClimateType.TROPICAL || climate === ClimateType.SEMITROPICAL) chance += 0.20;
                if (climate === ClimateType.ARID) chance *= 0.3; 
                if (archetype === MapArchetype.DELTA) chance *= 2.5;

                if (featurePlacementNoise.random() < chance * WETLANDS_MOISTURE_PROXIMITY_FACTOR) {
                    tile.biome = BiomeType.WETLANDS;
                    tile.altitude = Math.min(tile.altitude, ALTITUDE_LEVELS.BEACH * 0.65 + featurePlacementNoise.random() * 0.005);
                }
            }
        }
    }
}

export function generateOases(tiles: Tile[][], climate: ClimateType, randomNoise: ValueNoise) {
    if (climate !== ClimateType.ARID && climate !== ClimateType.SEMITROPICAL) return;
    for (let y = 0; y < MAP_HEIGHT_TILES; y++) {
        for (let x = 0; x < MAP_WIDTH_TILES; x++) {
            const tile = tiles[y][x];
            // Oasis can only form in DESERT tiles, and DESERT is distinct from ESTUARY.
            if (tile.biome === BiomeType.DESERT && randomNoise.random() < OASIS_CHANCE_IN_DESERT) {
                let tooClose = false;
                for (let dy = -3; dy <= 3; dy++) {
                    for (let dx = -3; dx <= 3; dx++) {
                        if (dx === 0 && dy === 0) continue;
                        const nx = x + dx; const ny = y + dy;
                        if (nx >=0 && nx < MAP_WIDTH_TILES && ny >=0 && ny < MAP_HEIGHT_TILES) {
                            if ([BiomeType.OASIS, BiomeType.RIVER, BiomeType.SHALLOW_OCEAN, BiomeType.WETLANDS, BiomeType.MAJOR_RIVER, BiomeType.ESTUARY, BiomeType.FRESHWATER_LAKE].includes(tiles[ny][nx].biome)) { tooClose = true; break; }
                        }
                    } if (tooClose) break;
                }
                if (tooClose) continue;
                tile.biome = BiomeType.OASIS; tile.isLand = false; 
                tile.altitude = ALTITUDE_LEVELS.SEA * 0.7 + randomNoise.random() * 0.01; 
            }
        }
    }
}

export function generateReefs(tiles: Tile[][], climate: ClimateType, archetype: MapArchetype, featurePlacementNoise: ValueNoise) {
    if (climate !== ClimateType.TROPICAL && climate !== ClimateType.SEMITROPICAL && climate !== ClimateType.ARID) return;
    for (let y = 0; y < MAP_HEIGHT_TILES; y++) {
        for (let x = 0; x < MAP_WIDTH_TILES; x++) {
            const tile = tiles[y][x];
            // Reefs form in SHALLOW_OCEAN. SHALLOW_OCEAN is distinct from ESTUARY.
            if (tile.biome === BiomeType.SHALLOW_OCEAN) {
                if (tile.altitude < ALTITUDE_LEVELS.SEA * (1 - REEF_MAX_DEPTH_FACTOR) || tile.altitude > ALTITUDE_LEVELS.SEA * 1.5) continue; 
                let isNearBeach = false;
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                         const nx = x + dx; const ny = y + dy;
                         if (nx >=0 && nx < MAP_WIDTH_TILES && ny >=0 && ny < MAP_HEIGHT_TILES && tiles[ny][nx].biome === BiomeType.BEACH) { isNearBeach = true; break; }
                    } if (isNearBeach) break;
                }
                if (isNearBeach) continue; 
                let chance = REEF_CHANCE; 
                if (archetype === MapArchetype.ISLAND || archetype === MapArchetype.SHOALS || archetype === MapArchetype.ATOLL) chance *= 1.5;
                if (climate === ClimateType.ARID) chance *= 0.5; 
                if (featurePlacementNoise.random() < chance) {
                    tile.biome = BiomeType.REEF;
                    tile.altitude = ALTITUDE_LEVELS.SEA * (0.4 + featurePlacementNoise.random() * 0.2); 
                    const directions = [{dx:0, dy:1}, {dx:1, dy:0}, {dx:0, dy:-1}, {dx:-1, dy:0}];
                    for(const dir of directions) {
                        const nx = x + dir.dx; const ny = y + dir.dy;
                        // Neighbor must also be SHALLOW_OCEAN to become REEF.
                        if (nx >=0 && nx < MAP_WIDTH_TILES && ny >=0 && ny < MAP_HEIGHT_TILES && 
                            tiles[ny][nx].biome === BiomeType.SHALLOW_OCEAN && 
                            tiles[ny][nx].altitude > ALTITUDE_LEVELS.SEA * (1-REEF_MAX_DEPTH_FACTOR) && 
                            featurePlacementNoise.random() < 0.4) {
                            tiles[ny][nx].biome = BiomeType.REEF; tiles[ny][nx].altitude = tile.altitude;
                        }
                    }
                }
            }
        }
    }
}
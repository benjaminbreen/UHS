/**
 * generation/standardMap/qualities/tileQualityCalculator.ts - Tile Quality calculation logic for Standard Maps
 */
import { Tile, BiomeType, MapArchetype, ClimateType } from '../../../types'; 
import { ValueNoise } from '../../../utils/noise';
import { 
    MAP_WIDTH_TILES, MAP_HEIGHT_TILES,
    NOISE_SCALE_QUALITIES, NOISE_SCALE_MICRO_VARIATION,
    FLAMMABILITY_CONFIG, BIODIVERSITY_CONFIG, HEALTHINESS_CONFIG, SACRALITY_CONFIG, SAFETY_CONFIG,
    GEOLOGICAL_STRESS_CONFIG, THERMAL_ACTIVITY_CONFIG
} from '../../../constants/index'; 

function findNearestWaterDistance(tiles: Tile[][], x: number, y: number): number {
  const waterBiomes = new Set([ BiomeType.RIVER, BiomeType.MAJOR_RIVER, BiomeType.SHALLOW_OCEAN, BiomeType.DEEP_OCEAN, BiomeType.WETLANDS, BiomeType.OASIS, BiomeType.REEF ]);
  let minDistance = Infinity;
  const maxSearchRadius = FLAMMABILITY_CONFIG.WATER_INFLUENCE_RADIUS + 1;
  for (let dy = -maxSearchRadius; dy <= maxSearchRadius; dy++) {
    for (let dx = -maxSearchRadius; dx <= maxSearchRadius; dx++) {
      const checkX = x + dx; const checkY = y + dy;
      if (checkX >= 0 && checkX < MAP_WIDTH_TILES && checkY >= 0 && checkY < MAP_HEIGHT_TILES) {
        if (waterBiomes.has(tiles[checkY][checkX].biome)) {
          minDistance = Math.min(minDistance, Math.sqrt(dx * dx + dy * dy));
        }
      }
    }
  }
  return minDistance;
}

function findNearestBiomeDistance(tiles: Tile[][], x: number, y: number, targetBiome: BiomeType): number {
  let minDistance = Infinity;
  const maxSearchRadius = Math.max(MAP_WIDTH_TILES, MAP_HEIGHT_TILES);
  if (tiles[y][x].biome === targetBiome) return 0;
  for (let r = 1; r < maxSearchRadius; r++) {
    let foundInRadius = false;
    const pointsToCheck: Array<{dx: number, dy: number}> = [];
    for (let i = -r; i <= r; i++) {
        if (Math.abs(i) === r) { for (let j = -r; j <= r; j++) pointsToCheck.push({dx: j, dy: i}); } 
        else { pointsToCheck.push({dx: -r, dy: i}); pointsToCheck.push({dx: r, dy: i}); }
    }
    for (const p of pointsToCheck) {
        const checkX = x + p.dx; const checkY = y + p.dy;
        if (checkX >= 0 && checkX < MAP_WIDTH_TILES && checkY >= 0 && checkY < MAP_HEIGHT_TILES) {
            if (tiles[checkY][checkX].biome === targetBiome) {
                minDistance = Math.min(minDistance, Math.sqrt(p.dx * p.dx + p.dy * p.dy));
                foundInRadius = true; 
            }
        }
    }
    if (foundInRadius && minDistance <= r) return minDistance;
  }
  return minDistance;
}

function calculateNearbyBiodiversityBonus(tiles: Tile[][], x: number, y: number): number {
  const highBiodiversityBiomes = new Set([ BiomeType.JUNGLE, BiomeType.WETLANDS, BiomeType.FOREST, BiomeType.DENSE_FOREST, BiomeType.REEF, BiomeType.RIVERBANK, BiomeType.OASIS ]);
  let totalBonus = 0; const searchRadius = 4;
  for (let dy = -searchRadius; dy <= searchRadius; dy++) {
    for (let dx = -searchRadius; dx <= searchRadius; dx++) {
      if (dx === 0 && dy === 0) continue;
      const checkX = x + dx; const checkY = y + dy;
      if (checkX >= 0 && checkX < MAP_WIDTH_TILES && checkY >= 0 && checkY < MAP_HEIGHT_TILES) {
        if (highBiodiversityBiomes.has(tiles[checkY][checkX].biome)) {
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance <= searchRadius) {
            totalBonus += (1 - distance / searchRadius) * 0.1;
          }
        }
      }
    }
  }
  return Math.min(0.3, totalBonus);
}

function calculateFlammability(tiles: Tile[][], x: number, y: number, climate: ClimateType, qualitiesNoise: ValueNoise, microVariationNoise: ValueNoise ): number {
  const tile = tiles[y][x];
  let flammability = FLAMMABILITY_CONFIG.BASE_VALUES[tile.biome] ?? 0.5;
  flammability *= FLAMMABILITY_CONFIG.CLIMATE_MODIFIERS[climate] ?? 1.0;
  const nearestWaterDistance = findNearestWaterDistance(tiles, x, y);
  if (nearestWaterDistance <= FLAMMABILITY_CONFIG.WATER_INFLUENCE_RADIUS) {
    flammability = Math.max(0, flammability - (1 - (nearestWaterDistance / FLAMMABILITY_CONFIG.WATER_INFLUENCE_RADIUS)) * FLAMMABILITY_CONFIG.WATER_REDUCTION_MAX);
  }
  const noiseVariation = (qualitiesNoise.noise(x * NOISE_SCALE_QUALITIES, y * NOISE_SCALE_QUALITIES) - 0.5) * 0.2;
  const microVariation = (microVariationNoise.noise(x * NOISE_SCALE_MICRO_VARIATION, y * NOISE_SCALE_MICRO_VARIATION) - 0.5) * 0.1;
  flammability += noiseVariation + microVariation;
  return Math.max(0, Math.min(1, flammability));
}

function calculateBiodiversity(tiles: Tile[][], x: number, y: number, climate: ClimateType, qualitiesNoise: ValueNoise, microVariationNoise: ValueNoise ): number {
  const tile = tiles[y][x];
  let biodiversity = BIODIVERSITY_CONFIG.BASE_VALUES[tile.biome] ?? 0.5;
  biodiversity *= BIODIVERSITY_CONFIG.CLIMATE_MODIFIERS[climate] ?? 1.0;
  const urbanBiomesForBiodiversity: BiomeType[] = [BiomeType.URBAN, BiomeType.DENSE_CITY, BiomeType.LOW_DENSITY_CITY, BiomeType.HAMLET];
  let nearestUrbanDistanceForBiodiversity = Infinity;
  urbanBiomesForBiodiversity.forEach(urbanBiome => {
      nearestUrbanDistanceForBiodiversity = Math.min(nearestUrbanDistanceForBiodiversity, findNearestBiomeDistance(tiles, x, y, urbanBiome));
  });
  if (nearestUrbanDistanceForBiodiversity <= BIODIVERSITY_CONFIG.URBAN_INFLUENCE_RADIUS) {
    biodiversity = Math.max(0, biodiversity - (1 - (nearestUrbanDistanceForBiodiversity / BIODIVERSITY_CONFIG.URBAN_INFLUENCE_RADIUS)) * BIODIVERSITY_CONFIG.URBAN_DEGRADATION_MAX);
  }
  if (tile.isCoast) biodiversity = Math.max(0, biodiversity - BIODIVERSITY_CONFIG.COAST_DEGRADATION);
  biodiversity += calculateNearbyBiodiversityBonus(tiles, x, y);
  const noiseVariation = (qualitiesNoise.noise(x * NOISE_SCALE_QUALITIES, y * NOISE_SCALE_QUALITIES) - 0.5) * 0.15;
  const microVariation = (microVariationNoise.noise(x * NOISE_SCALE_MICRO_VARIATION, y * NOISE_SCALE_MICRO_VARIATION) - 0.5) * 0.1;
  biodiversity += noiseVariation + microVariation;
  return Math.max(0, Math.min(1, biodiversity));
}

function calculateHealthiness(tiles: Tile[][], x: number, y: number, climate: ClimateType, qualitiesNoise: ValueNoise, microVariationNoise: ValueNoise ): number {
  const tile = tiles[y][x];
  let healthiness = HEALTHINESS_CONFIG.BASE_VALUES[tile.biome] ?? 0.5;
  healthiness *= HEALTHINESS_CONFIG.CLIMATE_MODIFIERS[climate] ?? 1.0;
  if (tile.altitude > HEALTHINESS_CONFIG.ALTITUDE_BONUS_THRESHOLD) {
    healthiness += ((tile.altitude - HEALTHINESS_CONFIG.ALTITUDE_BONUS_THRESHOLD) / (1.0 - HEALTHINESS_CONFIG.ALTITUDE_BONUS_THRESHOLD)) * HEALTHINESS_CONFIG.ALTITUDE_BONUS_MAX;
  }
  if (tile.biome === BiomeType.WETLANDS || tile.biome === BiomeType.JUNGLE) healthiness -= HEALTHINESS_CONFIG.STAGNANT_WATER_PENALTY;
  if ([BiomeType.RIVER, BiomeType.MAJOR_RIVER, BiomeType.RIVERBANK].includes(tile.biome)) healthiness += HEALTHINESS_CONFIG.FLOWING_WATER_BONUS;
  const noiseVariation = (qualitiesNoise.noise(x * NOISE_SCALE_QUALITIES, y * NOISE_SCALE_QUALITIES) - 0.5) * 0.2;
  const microVariation = (microVariationNoise.noise(x * NOISE_SCALE_MICRO_VARIATION, y * NOISE_SCALE_MICRO_VARIATION) - 0.5) * 0.1;
  healthiness += noiseVariation + microVariation;
  return Math.max(0, Math.min(1, healthiness));
}

function calculateSacrality(tiles: Tile[][], x: number, y: number, archetype: MapArchetype, qualitiesNoise: ValueNoise, microVariationNoise: ValueNoise ): number {
  const tile = tiles[y][x];
  let sacrality = SACRALITY_CONFIG.BASE_VALUES[tile.biome] ?? 0.2;
  const nearestPeakDistance = findNearestBiomeDistance(tiles, x, y, BiomeType.HIGH_PEAK);
  if (nearestPeakDistance <= SACRALITY_CONFIG.PEAK_INFLUENCE_RADIUS) {
    sacrality += (1 - (nearestPeakDistance / SACRALITY_CONFIG.PEAK_INFLUENCE_RADIUS)) * SACRALITY_CONFIG.PEAK_BONUS_MAX;
  }
  if (tile.biome === BiomeType.OASIS) sacrality += SACRALITY_CONFIG.OASIS_BONUS;
  if (tile.biome === BiomeType.REEF) sacrality += SACRALITY_CONFIG.REEF_BONUS;
  if (archetype === MapArchetype.ISLAND) {
    const centerX = MAP_WIDTH_TILES / 2; const centerY = MAP_HEIGHT_TILES / 2;
    const distToCenter = Math.sqrt((x - centerX)**2 + (y - centerY)**2);
    const maxDist = Math.sqrt(centerX**2 + centerY**2);
    sacrality += (1 - (distToCenter / maxDist)) * SACRALITY_CONFIG.ISLAND_CENTER_BONUS;
  }
  const urbanBiomesForIsolation: BiomeType[] = [BiomeType.URBAN, BiomeType.DENSE_CITY, BiomeType.LOW_DENSITY_CITY, BiomeType.HAMLET];
  let nearestUrbanDistanceForIsolation = Infinity;
  urbanBiomesForIsolation.forEach(urbanBiome => {
      nearestUrbanDistanceForIsolation = Math.min(nearestUrbanDistanceForIsolation, findNearestBiomeDistance(tiles, x, y, urbanBiome));
  });
  if (nearestUrbanDistanceForIsolation > SACRALITY_CONFIG.ISOLATION_THRESHOLD) {
    sacrality += Math.min(1, (nearestUrbanDistanceForIsolation - SACRALITY_CONFIG.ISOLATION_THRESHOLD) / SACRALITY_CONFIG.ISOLATION_THRESHOLD) * SACRALITY_CONFIG.ISOLATION_BONUS_MAX;
  }
  const noiseVariation = (qualitiesNoise.noise(x * NOISE_SCALE_QUALITIES, y * NOISE_SCALE_QUALITIES) - 0.5) * 0.2;
  const microVariation = (microVariationNoise.noise(x * NOISE_SCALE_MICRO_VARIATION, y * NOISE_SCALE_MICRO_VARIATION) - 0.5) * 0.1;
  sacrality += noiseVariation + microVariation;
  return Math.max(0, Math.min(1, sacrality));
}

function calculateSafety(tiles: Tile[][], x: number, y: number, qualitiesNoise: ValueNoise, microVariationNoise: ValueNoise ): number {
  const tile = tiles[y][x];
  let safety = 0.5 + (SAFETY_CONFIG.BASE_MODIFIERS[tile.biome] ?? 0);
  const qualities = tile.qualities;
  safety += qualities.healthiness * SAFETY_CONFIG.WEIGHTS.HEALTHINESS;
  safety += qualities.sacrality * SAFETY_CONFIG.WEIGHTS.SACRALITY;
  safety += qualities.flammability * SAFETY_CONFIG.WEIGHTS.FLAMMABILITY;
  safety += qualities.biodiversity * SAFETY_CONFIG.WEIGHTS.BIODIVERSITY;
  safety += tile.altitude * SAFETY_CONFIG.ALTITUDE_SAFETY_BONUS;
  const urbanBiomesForSafety: BiomeType[] = [BiomeType.URBAN, BiomeType.DENSE_CITY, BiomeType.LOW_DENSITY_CITY];
  let nearestUrbanDistanceForSafety = Infinity;
   urbanBiomesForSafety.forEach(urbanBiome => {
      nearestUrbanDistanceForSafety = Math.min(nearestUrbanDistanceForSafety, findNearestBiomeDistance(tiles, x, y, urbanBiome));
  });
  if (nearestUrbanDistanceForSafety <= SAFETY_CONFIG.URBAN_PROXIMITY_RADIUS) {
    const proximityFactor = 1 - (nearestUrbanDistanceForSafety / SAFETY_CONFIG.URBAN_PROXIMITY_RADIUS);
    safety += proximityFactor * SAFETY_CONFIG.URBAN_SAFETY_BONUS;
    safety -= proximityFactor * SAFETY_CONFIG.URBAN_SAFETY_PENALTY;
  }
  const noiseVariation = (qualitiesNoise.noise(x * NOISE_SCALE_QUALITIES, y * NOISE_SCALE_QUALITIES) - 0.5) * 0.15;
  const microVariation = (microVariationNoise.noise(x * NOISE_SCALE_MICRO_VARIATION, y * NOISE_SCALE_MICRO_VARIATION) - 0.5) * 0.1;
  safety += noiseVariation + microVariation;
  return Math.max(0, Math.min(1, safety));
}

function calculateGeologicalStress(tile: Tile, qualitiesNoise: ValueNoise): number {
    let stress = 0;
    const biome = tile.biome;

    if (biome === BiomeType.MOUNTAIN || biome === BiomeType.HIGH_PEAK) {
        stress += GEOLOGICAL_STRESS_CONFIG.MOUNTAIN_BONUS;
    }
    if (biome === BiomeType.CLIFF) {
        stress += GEOLOGICAL_STRESS_CONFIG.CLIFF_BONUS;
    }
    if (biome === BiomeType.HILLS) {
        stress += GEOLOGICAL_STRESS_CONFIG.HILLS_BONUS;
    }

    stress += tile.altitude * GEOLOGICAL_STRESS_CONFIG.ALTITUDE_WEIGHT;
    stress += (qualitiesNoise.noise(tile.x * NOISE_SCALE_QUALITIES, tile.y * NOISE_SCALE_QUALITIES) - 0.5) * 0.3; // Noise factor
    return Math.max(0, Math.min(1, stress));
}

function calculateThermalActivity(tiles: Tile[][], x: number, y: number, qualitiesNoise: ValueNoise): number {
    const tile = tiles[y][x];
    let activity = 0;
    
    if (tile.biome === BiomeType.HOT_SPRINGS) {
        activity += THERMAL_ACTIVITY_CONFIG.HOT_SPRINGS_BONUS;
    }

    let nearestVolcanoDist = Infinity;
    for (let searchY = 0; searchY < MAP_HEIGHT_TILES; searchY++) {
        for (let searchX = 0; searchX < MAP_WIDTH_TILES; searchX++) {
            const checkTile = tiles[searchY][searchX];
            if (checkTile.biome === BiomeType.ACTIVE_LAVA || checkTile.biome === BiomeType.VOLCANIC_ROCK) {
                const dist = Math.hypot(x - searchX, y - searchY);
                if (dist < nearestVolcanoDist) {
                    nearestVolcanoDist = dist;
                }
            }
        }
    }
    
    if (nearestVolcanoDist <= THERMAL_ACTIVITY_CONFIG.VOLCANO_INFLUENCE_RADIUS) {
        activity += (1 - (nearestVolcanoDist / THERMAL_ACTIVITY_CONFIG.VOLCANO_INFLUENCE_RADIUS)) * THERMAL_ACTIVITY_CONFIG.VOLCANO_MAX_BONUS;
    }

    activity += (qualitiesNoise.noise(tile.x * NOISE_SCALE_QUALITIES * 1.5, tile.y * NOISE_SCALE_QUALITIES * 1.5) - 0.5) * 0.2;
    return Math.max(0, Math.min(1, activity));
}

export function calculateTileQualities(tiles: Tile[][], climate: ClimateType, archetype: MapArchetype, qualitiesNoise: ValueNoise, microVariationNoise: ValueNoise): void {
  console.log("Calculating tile qualities...");
  for (let y = 0; y < MAP_HEIGHT_TILES; y++) {
    for (let x = 0; x < MAP_WIDTH_TILES; x++) {
      const tile = tiles[y][x];
      tile.qualities.flammability = calculateFlammability(tiles, x, y, climate, qualitiesNoise, microVariationNoise);
      tile.qualities.biodiversity = calculateBiodiversity(tiles, x, y, climate, qualitiesNoise, microVariationNoise);
      tile.qualities.healthiness = calculateHealthiness(tiles, x, y, climate, qualitiesNoise, microVariationNoise);
      tile.qualities.sacrality = calculateSacrality(tiles, x, y, archetype, qualitiesNoise, microVariationNoise);
      tile.qualities.geologicalStress = calculateGeologicalStress(tile, qualitiesNoise);
      tile.qualities.thermalActivity = calculateThermalActivity(tiles, x, y, qualitiesNoise);
    }
  }
  for (let y = 0; y < MAP_HEIGHT_TILES; y++) {
    for (let x = 0; x < MAP_WIDTH_TILES; x++) {
      tiles[y][x].qualities.safety = calculateSafety(tiles, x, y, qualitiesNoise, microVariationNoise);
    }
  }
  console.log("Tile qualities calculation complete.");
}
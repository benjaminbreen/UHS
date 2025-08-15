/**
 * generation/standardMap/features/UrbanGenerator.ts - Generates urban areas for Standard Maps
 */
import { Tile, BiomeType, Point, MapArchetype } from '../../../types/index';
import { ValueNoise } from '../../../utils/noise';
import { 
    MAP_WIDTH_TILES, MAP_HEIGHT_TILES, ALTITUDE_LEVELS,
    URBAN_CLUSTER_COUNT_BASE, URBAN_CLUSTER_COUNT_MAX, URBAN_CLUSTER_RADIUS_MIN, URBAN_CLUSTER_RADIUS_MAX,
    HAMLET_SIZE_MIN, HAMLET_SIZE_MAX, LOW_DENSITY_CITY_SIZE_MIN, LOW_DENSITY_CITY_SIZE_MAX,
    DENSE_CITY_SIZE_MIN, DENSE_CITY_SIZE_MAX, PROTECTED_HARBOR_BONUS, RIVER_MOUTH_BONUS,
    DEEP_HARBOR_BONUS, COASTAL_ACCESS_BONUS, RIVER_ACCESS_BONUS, DENSITY_GRADIENT_FACTOR,
    MIN_INTER_CLUSTER_DISTANCE
} from '../../../constants/index';
import { isNearWaterBody, isNearSpecificRiver } from './EcologicalFeatureGenerator'; // Helper for strategic location
import { detectCitiesForArea, CityInfo } from '../../../utils/cityDetectionUtils';
import { parseDateString } from '../../../utils/dateUtils';

const nonBuildableSiteBiomesSet = new Set([
  BiomeType.HAMLET, BiomeType.LOW_DENSITY_CITY, BiomeType.DENSE_CITY, BiomeType.URBAN, 
  BiomeType.MOUNTAIN, BiomeType.HIGH_PEAK, BiomeType.SNOW,
  BiomeType.RIVER, BiomeType.MAJOR_RIVER, BiomeType.DESERT, BiomeType.WETLANDS,
  BiomeType.DEEP_OCEAN, BiomeType.SHALLOW_OCEAN, BiomeType.REEF, BiomeType.OASIS,
  BiomeType.ACTIVE_LAVA, BiomeType.VOLCANIC_ROCK, BiomeType.SALT_FLATS, BiomeType.HOT_SPRINGS,
  BiomeType.ESTUARY, BiomeType.FRESHWATER_LAKE, BiomeType.CLIFF,
  BiomeType.MARKETPLACE, BiomeType.GOVERNMENT_DISTRICT, BiomeType.CITY_CENTER, // Prevent overwriting new types
]);

function isRiverMouth(tiles: Tile[][], x: number, y: number): boolean {
    const tile = tiles[y][x];
    if (tile.biome !== BiomeType.RIVER && tile.biome !== BiomeType.MAJOR_RIVER) return false;
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = x + dx; const ny = y + dy;
            if (nx >= 0 && nx < MAP_WIDTH_TILES && ny >= 0 && ny < MAP_HEIGHT_TILES) {
                if ([BiomeType.SHALLOW_OCEAN, BiomeType.DEEP_OCEAN, BiomeType.ESTUARY, BiomeType.FRESHWATER_LAKE].includes(tiles[ny][nx].biome)) return true;
            }
        }
    }
    return false;
}

function isNearRiverMouth(tiles: Tile[][], x: number, y: number, radius: number): boolean {
    for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
            const checkX = x + dx; const checkY = y + dy;
            if (checkX >= 0 && checkX < MAP_WIDTH_TILES && checkY >= 0 && checkY < MAP_HEIGHT_TILES) {
                if (isRiverMouth(tiles, checkX, checkY)) return true;
            }
        }
    }
    return false;
}

function isNearSpecificBiome(tiles: Tile[][], x: number, y:number, radius: number, targetBiome: BiomeType): boolean {
    for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = x + dx; const ny = y + dy;
            if (nx >= 0 && nx < MAP_WIDTH_TILES && ny >=0 && ny < MAP_HEIGHT_TILES) {
                if (tiles[ny][nx].biome === targetBiome) return true;
            }
        }
    }
    return false;
}


function identifyStrategicUrbanLocations(tiles: Tile[][], archetype: MapArchetype, harborSide?: number ): Array<{point: Point, score: number, type: string}> {
  const locations: Array<{point: Point, score: number, type: string}> = [];
  for (let y = 0; y < MAP_HEIGHT_TILES; y++) {
    for (let x = 0; x < MAP_WIDTH_TILES; x++) {
      const tile = tiles[y][x];
      if (!tile.isLand || nonBuildableSiteBiomesSet.has(tile.biome)) continue;
      let score = 1.0; let locationType = 'inland';
      const coastalAccess = isNearWaterBody(tiles, x, y, 1);
      const riverAccess = isNearSpecificRiver(tiles, x, y, 1, BiomeType.RIVER) || isNearSpecificRiver(tiles, x, y, 1, BiomeType.MAJOR_RIVER);
      const riverMouth = isNearRiverMouth(tiles, x, y, 2);
      const protectedHarbor = isProtectedHarbor(tiles, x, y, archetype, harborSide);
      const deepWaterAccess = isNearDeepWater(tiles, x, y);

      if (archetype === MapArchetype.STRAITS && coastalAccess) score *= 2.5; // High value for strait coast
      
      if (protectedHarbor) { score *= PROTECTED_HARBOR_BONUS; locationType = 'protected_harbor'; }
      if (riverMouth) { score *= RIVER_MOUTH_BONUS; if (['inland', 'coastal', 'riverine'].includes(locationType)) locationType = 'river_mouth';}
      if (deepWaterAccess && coastalAccess) { score *= DEEP_HARBOR_BONUS; if (['inland', 'coastal'].includes(locationType)) locationType = 'deep_harbor'; }
      if (coastalAccess) { score *= COASTAL_ACCESS_BONUS; if (locationType === 'inland') locationType = 'coastal'; }
      if (riverAccess) { score *= RIVER_ACCESS_BONUS; if (locationType === 'inland') locationType = 'riverine'; }
      
      if (tile.biome === BiomeType.RIVERBANK) score *= 1.4;
      if (isNearSpecificBiome(tiles, x, y, 2, BiomeType.OASIS)) score *= 1.5; 
      if (tile.biome === BiomeType.BEACH) score *= 1.2;
      if (tile.biome === BiomeType.GRASSLAND) score *= 1.1;
      
      if (tile.altitude > ALTITUDE_LEVELS.BEACH + 0.01 && tile.altitude < ALTITUDE_LEVELS.HILLS_START * 0.8) score *= 1.2;
      else if (tile.altitude <= ALTITUDE_LEVELS.BEACH) score *= 0.8;
      
      if (score > 1.5) locations.push({ point: { x, y }, score, type: locationType });
    }
  }
  locations.sort((a, b) => b.score - a.score);
  return locations.slice(0, Math.max(20, locations.length / 5));
}

function selectUrbanClusterCenters(strategicLocations: Array<{point: Point, score: number, type: string}>, clusterCount: number, randomNoise: ValueNoise): Point[] {
  const centers: Point[] = [];
  if (strategicLocations.length === 0) return centers;
  if (strategicLocations.length > 0) centers.push(strategicLocations[0].point);
  
  let attempts = 0; const maxAttempts = strategicLocations.length * 2; 
  while (centers.length < clusterCount && attempts < maxAttempts && strategicLocations.length > centers.length) {
    const candidateLocation = strategicLocations[Math.floor(randomNoise.random() * strategicLocations.length)];
    attempts++;
    if (!candidateLocation || centers.find(c => c.x === candidateLocation.point.x && c.y === candidateLocation.point.y)) continue;
    let tooClose = false;
    for (const existingCenter of centers) {
      if (Math.hypot(candidateLocation.point.x - existingCenter.x, existingCenter.y - candidateLocation.point.y) < MIN_INTER_CLUSTER_DISTANCE * (0.8 + randomNoise.random() * 0.4)) {
        tooClose = true; break;
      }
    }
    if (!tooClose) centers.push(candidateLocation.point);
  }
  return centers;
}

function generateUrbanCluster(tiles: Tile[][], center: Point, clusterIndex: number, totalClusters: number, generateLargeCity: boolean | undefined, randomNoise: ValueNoise, economicActivityLevel?: number, activeCities?: any[]): void {
  const isMainCluster = clusterIndex === 0;
  
  // Get population data for this cluster's city
  const cityData = (isMainCluster && activeCities && activeCities.length > 0) ? activeCities[0] : 
                   (activeCities && clusterIndex < activeCities.length) ? activeCities[clusterIndex] : null;
  const cityPopulation = cityData?.populationPeak || 0;
  
  // Calculate population-based scale factor
  let populationScaleFactor = 1.0;
  let radiusMultiplier = 1.0;
  if (cityPopulation > 0) {
    // Scale based on population brackets
    if (cityPopulation < 10000) {
      populationScaleFactor = 0.3; // Tiny settlement
      radiusMultiplier = 0.7;
    } else if (cityPopulation < 50000) {
      populationScaleFactor = 0.6; // Small town
      radiusMultiplier = 0.8;
    } else if (cityPopulation < 100000) {
      populationScaleFactor = 1.0; // Medium town
      radiusMultiplier = 1.0;
    } else if (cityPopulation < 250000) {
      populationScaleFactor = 1.5; // Large town
      radiusMultiplier = 1.2;
    } else if (cityPopulation < 500000) {
      populationScaleFactor = 2.0; // Small city
      radiusMultiplier = 1.5;
    } else if (cityPopulation < 1000000) {
      populationScaleFactor = 3.0; // Medium city
      radiusMultiplier = 1.8;
    } else if (cityPopulation < 5000000) {
      populationScaleFactor = 4.0; // Large city
      radiusMultiplier = 2.2;
    } else if (cityPopulation < 10000000) {
      populationScaleFactor = 6.0; // Megacity
      radiusMultiplier = 3.0;
    } else if (cityPopulation < 20000000) {
      populationScaleFactor = 8.0; // Super megacity
      radiusMultiplier = 3.5;
    } else {
      populationScaleFactor = 10.0; // Hyper megacity (Beijing, Tokyo, etc.)
      radiusMultiplier = 4.0;
    }
    
    console.log(`[Urban] City "${cityData.name}" with population ${cityPopulation} -> scale factor ${populationScaleFactor}, radius multiplier ${radiusMultiplier}`);
  }
  
  // Scale cluster radius based on population
  const baseRadius = URBAN_CLUSTER_RADIUS_MIN + Math.floor(randomNoise.random() * (URBAN_CLUSTER_RADIUS_MAX - URBAN_CLUSTER_RADIUS_MIN + 1));
  const clusterRadius = Math.floor(baseRadius * radiusMultiplier);
  
  const cityScaleFactor = (isMainCluster && generateLargeCity) ? 1.5 : (isMainCluster ? 1.0 : 0.7);
  const activityMultiplier = economicActivityLevel !== undefined ? (economicActivityLevel / 2) : 1;
  
  // Apply population-based scaling to tile counts
  const finalScaleFactor = cityScaleFactor * activityMultiplier * populationScaleFactor;
  
  // Calculate tile counts with population-based scaling
  let denseCityTiles = Math.floor((DENSE_CITY_SIZE_MIN + randomNoise.random() * (DENSE_CITY_SIZE_MAX - DENSE_CITY_SIZE_MIN)) * finalScaleFactor * 0.8);
  let lowDensityTiles = Math.floor((LOW_DENSITY_CITY_SIZE_MIN + randomNoise.random() * (LOW_DENSITY_CITY_SIZE_MAX - LOW_DENSITY_CITY_SIZE_MIN)) * finalScaleFactor * 1.2);
  let hamletTiles = Math.floor((HAMLET_SIZE_MIN + randomNoise.random() * (HAMLET_SIZE_MAX - HAMLET_SIZE_MIN)) * finalScaleFactor * 1.5);

  // For megacities, ensure minimum thresholds
  if (cityPopulation > 20000000) {
    // Hyper megacity (Beijing, Tokyo, etc.)
    denseCityTiles = Math.max(denseCityTiles, 80);
    lowDensityTiles = Math.max(lowDensityTiles, 120);
    hamletTiles = Math.max(hamletTiles, 160);
  } else if (cityPopulation > 10000000) {
    // Super megacity
    denseCityTiles = Math.max(denseCityTiles, 60);
    lowDensityTiles = Math.max(lowDensityTiles, 90);
    hamletTiles = Math.max(hamletTiles, 120);
  } else if (cityPopulation > 5000000) {
    // Regular megacity
    denseCityTiles = Math.max(denseCityTiles, 40);
    lowDensityTiles = Math.max(lowDensityTiles, 60);
    hamletTiles = Math.max(hamletTiles, 80);
  } else if (cityPopulation > 1000000) {
    denseCityTiles = Math.max(denseCityTiles, 20);
    lowDensityTiles = Math.max(lowDensityTiles, 30);
    hamletTiles = Math.max(hamletTiles, 40);
  }
  
  // For tiny settlements, cap the maximum
  if (cityPopulation > 0 && cityPopulation < 50000) {
    denseCityTiles = Math.min(denseCityTiles, 5);
    lowDensityTiles = Math.min(lowDensityTiles, 8);
    hamletTiles = Math.min(hamletTiles, 12);
  }

  if (!isMainCluster && !cityPopulation) { 
      // Keep original limits for secondary clusters without specific population data
      denseCityTiles = Math.min(denseCityTiles, Math.floor(DENSE_CITY_SIZE_MAX * 0.3)); 
      lowDensityTiles = Math.min(lowDensityTiles, Math.floor(LOW_DENSITY_CITY_SIZE_MAX * 0.5));
  }
  
  console.log(`[Urban] Cluster ${clusterIndex}: dense=${denseCityTiles}, low=${lowDensityTiles}, hamlet=${hamletTiles}, radius=${clusterRadius}`);
  
  const tilesToPlace: Array<{biome: BiomeType, priority: number}> = [];
  for (let i = 0; i < denseCityTiles; i++) tilesToPlace.push({ biome: BiomeType.DENSE_CITY, priority: 3 });
  for (let i = 0; i < lowDensityTiles; i++) tilesToPlace.push({ biome: BiomeType.LOW_DENSITY_CITY, priority: 2 });
  for (let i = 0; i < hamletTiles; i++) tilesToPlace.push({ biome: BiomeType.HAMLET, priority: 1 });
  tilesToPlace.sort((a, b) => b.priority - a.priority);
  
  const availableTiles: Array<{point: Point, distance: number, score: number}> = [];
  for (let dy = -clusterRadius; dy <= clusterRadius; dy++) {
    for (let dx = -clusterRadius; dx <= clusterRadius; dx++) {
      const x = center.x + dx; const y = center.y + dy; const distance = Math.sqrt(dx * dx + dy * dy);
      if (x >= 0 && x < MAP_WIDTH_TILES && y >= 0 && y < MAP_HEIGHT_TILES && distance <= clusterRadius) {
        const tile = tiles[y][x];
        if (tile.isLand && !nonBuildableSiteBiomesSet.has(tile.biome)) {
          let tileScore = 100 - distance; 
          if (tile.biome === BiomeType.RIVERBANK) tileScore += 30;
          if (tile.biome === BiomeType.GRASSLAND) tileScore += 10;
          if (tile.isCoast) tileScore += 15;
          if (isNearSpecificRiver(tiles, x, y, 1, BiomeType.RIVER) || isNearSpecificRiver(tiles, x,y,1,BiomeType.MAJOR_RIVER)) tileScore += 20;
          if (tile.altitude > ALTITUDE_LEVELS.GRASSLAND_UPPER_MAX) tileScore -= 20;
          availableTiles.push({ point: { x, y }, distance, score: tileScore });
        }
      }
    }
  }
  availableTiles.sort((a, b) => b.score - a.score);
  
  const placedUrbanTiles: Tile[] = [];
  for (const urbanTile of tilesToPlace) {
    if (availableTiles.length === 0) break;
    let bestCandidateIndex = -1; let highestScoreForType = -Infinity;
    for(let i=0; i < availableTiles.length; i++) {
        const candidate = availableTiles[i]; let currentScore = candidate.score;
        if (urbanTile.biome === BiomeType.DENSE_CITY) currentScore -= candidate.distance * DENSITY_GRADIENT_FACTOR * 2;
        else if (urbanTile.biome === BiomeType.HAMLET) currentScore += candidate.distance * DENSITY_GRADIENT_FACTOR;
        else currentScore -= candidate.distance * DENSITY_GRADIENT_FACTOR * 0.5;
        if (currentScore > highestScoreForType) { highestScoreForType = currentScore; bestCandidateIndex = i; }
    }
    if (bestCandidateIndex !== -1) {
      const chosenTileInfo = availableTiles[bestCandidateIndex];
      const targetTile = tiles[chosenTileInfo.point.y][chosenTileInfo.point.x];
      targetTile.biome = urbanTile.biome;
      
      // Assign population based on biome type
      if (urbanTile.biome === BiomeType.DENSE_CITY) {
          targetTile.population = 200 + Math.floor(randomNoise.random() * 300);
      } else if (urbanTile.biome === BiomeType.LOW_DENSITY_CITY) {
          targetTile.population = 50 + Math.floor(randomNoise.random() * 150);
      } else if (urbanTile.biome === BiomeType.HAMLET) {
          targetTile.population = 10 + Math.floor(randomNoise.random() * 40);
      }

      placedUrbanTiles.push(targetTile);
      availableTiles.splice(bestCandidateIndex, 1); 
    }
  }
  
  // Convert some DENSE_CITY to special districts
  let placedGovDistricts = 0;
  let placedMarketplaces = 0;
  placedUrbanTiles.forEach(tile => {
    if (tile.biome === BiomeType.DENSE_CITY) {
        // Marketplace chance
        if (placedMarketplaces < 2 && isNearWaterBody(tiles, tile.x, tile.y, 3) && randomNoise.random() < 0.3) {
            tile.biome = BiomeType.MARKETPLACE;
            tile.population = 50 + Math.floor(randomNoise.random() * 100); // Markets have transient populations
            placedMarketplaces++;
        } 
        // Government District chance (only in main cluster, very rare)
        else if (isMainCluster && placedGovDistricts < 2 && randomNoise.random() < 0.15) {
            tile.biome = BiomeType.GOVERNMENT_DISTRICT;
            tile.population = 100 + Math.floor(randomNoise.random() * 150); // Admin centers have residents
            placedGovDistricts++;
        }
    }
  });

  // After placing all urban tiles for the cluster, check if we should place a city center.
  // ONLY place city centers if we have actual defined cities
  if (isMainCluster && activeCities && activeCities.length > 0 && placedUrbanTiles.some(t => t.biome === BiomeType.DENSE_CITY)) {
    if (randomNoise.random() < 0.9) { // High chance for a city center in the main cluster
        const denseCityTilesInCluster = placedUrbanTiles.filter(t => t.biome === BiomeType.DENSE_CITY);
        if (denseCityTilesInCluster.length > 0) {
            // Find the geometric center of the dense tiles to place the city center more logically
            let sumX = 0;
            let sumY = 0;
            denseCityTilesInCluster.forEach(t => {
                sumX += t.x;
                sumY += t.y;
            });
            const centerX = sumX / denseCityTilesInCluster.length;
            const centerY = sumY / denseCityTilesInCluster.length;

            let bestTile: Tile | null = denseCityTilesInCluster[0];
            let minDistanceSq = Infinity;
            denseCityTilesInCluster.forEach(t => {
                const distSq = (t.x - centerX) ** 2 + (t.y - centerY) ** 2;
                if (distSq < minDistanceSq) {
                    minDistanceSq = distSq;
                    bestTile = t;
                }
            });
            
            if (bestTile) {
                bestTile.biome = BiomeType.CITY_CENTER;
                bestTile.population = 250 + Math.floor(randomNoise.random() * 250);
                
                // Store city information on the tile
                if (activeCities && activeCities.length > 0 && clusterIndex === 0) {
                    // Use the first active city for the main cluster
                    const cityData = activeCities[0];
                    bestTile.cityName = cityData.name;
                    bestTile.cityDescription = cityData.description;
                    
                    // Also apply to all urban tiles in this cluster
                    placedUrbanTiles.forEach(tile => {
                        tile.cityName = cityData.name;
                        tile.cityDescription = cityData.description;
                    });
                }
                
                console.log(`[Gen] Placed CITY_CENTER at (${bestTile.x}, ${bestTile.y}) - ${bestTile.cityName || 'Unnamed'}`);
            }
        }
    }
  }
}

function isProtectedHarbor(tiles: Tile[][], x: number, y: number, archetype: MapArchetype, harborSide?: number): boolean {
  if (!isNearWaterBody(tiles, x, y, 2)) return false;
  let waterCount = 0; let landCount = 0; const checkRadius = 3;
  for (let dy = -checkRadius; dy <= checkRadius; dy++) {
    for (let dx = -checkRadius; dx <= checkRadius; dx++) {
      const checkX = x + dx; const checkY = y + dy;
      if (checkX >= 0 && checkX < MAP_WIDTH_TILES && checkY >= 0 && checkY < MAP_HEIGHT_TILES) {
        const tile = tiles[checkY][checkX];
        if (tile.isLand && tile.biome !== BiomeType.ESTUARY && tile.biome !== BiomeType.CLIFF && tile.biome !== BiomeType.FRESHWATER_LAKE) landCount++; // Estuary counts as water for protection
        else if ([BiomeType.SHALLOW_OCEAN, BiomeType.DEEP_OCEAN, BiomeType.MAJOR_RIVER, BiomeType.ESTUARY, BiomeType.FRESHWATER_LAKE].includes(tile.biome)) waterCount++;
      }
    }
  }
  if (landCount + waterCount === 0) return false;
  const waterRatio = waterCount / (landCount + waterCount);
  const landRatio = landCount / (landCount + waterCount);
  let openSides = 0;
  if(isNearWaterBody(tiles, x + checkRadius + 1, y, 1)) openSides++;
  if(isNearWaterBody(tiles, x - checkRadius - 1, y, 1)) openSides++;
  if(isNearWaterBody(tiles, x, y + checkRadius + 1, 1)) openSides++;
  if(isNearWaterBody(tiles, x, y - checkRadius - 1, 1)) openSides++;
  return waterRatio > 0.25 && waterRatio < 0.75 && landRatio > 0.25 && openSides <= 2;
}

function isNearDeepWater(tiles: Tile[][], x: number, y: number): boolean {
  const checkRadius = 3;
  for (let dy = -checkRadius; dy <= checkRadius; dy++) {
    for (let dx = -checkRadius; dx <= checkRadius; dx++) {
      const checkX = x + dx; const checkY = y + dy;
      if (checkX >= 0 && checkX < MAP_WIDTH_TILES && checkY >= 0 && checkY < MAP_HEIGHT_TILES) {
        if (tiles[checkY][checkX].biome === BiomeType.DEEP_OCEAN) return true;
      }
    }
  }
  return false;
}

export function generateUrbanAreas(tiles: Tile[][], randomNoise: ValueNoise, archetype: MapArchetype, harborSide?: number, generateLargeCity?: boolean, economicActivityLevel?: number, year?: number, regionName?: string, localAreaName?: string, timeSlice?: string, dominantPower?: string, culturalZone?: string) {
  console.log("[Urban] Phase 10: Urban area generation - START");
  console.log(`[Urban] Parameters: economicActivityLevel=${economicActivityLevel}, year=${year}, localArea="${localAreaName}", region="${regionName}"`);
  
  // Skip urban generation entirely for SHOALS archetype
  if (archetype === MapArchetype.SHOALS) {
    console.log("[Urban] Skipping urban generation for SHOALS archetype (no settlements on shoals)");
    return;
  }
  
  const strategicLocations = identifyStrategicUrbanLocations(tiles, archetype, harborSide);
  
  // Parse date info to get era
  const dateInfo = timeSlice ? parseDateString(timeSlice) : { year: year || 1650, era: null as any };
  
  // Use centralized city detection
  const cityDetection = detectCitiesForArea(localAreaName, regionName, year || dateInfo.year, dateInfo.era, true);
  
  const hasCities = cityDetection.hasCities;
  const activeCities = cityDetection.activeCities;
  const cityDensity = cityDetection.cityDensity;
  
  console.log(`[Urban] City detection result: hasCities=${hasCities}, source=${cityDetection.source}, cityCount=${activeCities.length}, density=${cityDensity}`);
  
  // Determine urban generation based on whether cities are defined
  let clusterCount = 0;
  
  if (hasCities) {
    // City-based generation - ALWAYS generate cities when they're defined
    const densityMap: Record<string, number> = {
      'small': 2,
      'moderate': 4,
      'large': 6,
      'massive': 8
    };
    clusterCount = densityMap[cityDensity || 'small'];
    
    // Ensure at least one cluster for any defined city
    clusterCount = Math.max(clusterCount, 1);
    
    // Add bonus for multiple cities
    if (activeCities.length > 1) {
      clusterCount += Math.min(activeCities.length - 1, 3);
    }
    
    if (generateLargeCity) clusterCount += 1;
    console.log(`[Urban] City-based generation: WILL generate ${clusterCount} clusters for ${activeCities.length} cities with ${cityDensity} density`);
  } else {
    // No cities defined - minimal or no urbanization
    const spawnChance = randomNoise.random();
    
    if (spawnChance < 0.4) {
      // 40% chance of no settlements at all
      clusterCount = 0;
      console.log(`[Urban] No cities defined - no settlements spawned`);
    } else if (spawnChance < 0.8) {
      // 40% chance of 1-2 hamlets
      clusterCount = 1 + Math.floor(randomNoise.random() * 2);
      console.log(`[Urban] No cities defined - spawning ${clusterCount} hamlet(s)`);
    } else {
      // 20% chance of 2-3 hamlets
      clusterCount = 2 + Math.floor(randomNoise.random() * 2);
      console.log(`[Urban] No cities defined - spawning ${clusterCount} hamlets`);
    }
    
    // Never exceed 3 clusters when no cities are defined
    clusterCount = Math.min(clusterCount, 3);
  }
  
  if (clusterCount > 0) {
    const clusterCenters = selectUrbanClusterCenters(strategicLocations, clusterCount, randomNoise);
    clusterCenters.forEach((center, index) => {
      // For areas without cities, only generate small hamlets
      const shouldGenerateLarge = hasCities ? generateLargeCity : false;
      generateUrbanCluster(tiles, center, index, clusterCenters.length, shouldGenerateLarge, randomNoise, economicActivityLevel, activeCities);
    });
    console.log(`Generated ${clusterCenters.length} urban clusters`);
  }
  
  // Generate fishing huts for water-based maps without cities
  if (!hasCities && hasWaterForFishing(archetype)) {
    generateFishingHuts(tiles, randomNoise);
  }
}

// Helper function to determine if archetype supports fishing
function hasWaterForFishing(archetype: MapArchetype): boolean {
  const waterArchetypes = [
    MapArchetype.ISLAND,
    MapArchetype.PENINSULA,
    MapArchetype.BAY,
    MapArchetype.ATOLL,
    MapArchetype.SHOALS,
    MapArchetype.STRAITS,
    MapArchetype.DELTA,
    MapArchetype.FRESHWATER_LAKE
  ];
  return waterArchetypes.includes(archetype);
}

// Generate 0-2 fishing huts on suitable coastal tiles
function generateFishingHuts(tiles: Tile[][], randomNoise: ValueNoise) {
  const hutCount = Math.floor(randomNoise.random() * 3); // 0-2 huts
  if (hutCount === 0) return;
  
  // Find suitable coastal locations
  const coastalTiles: Tile[] = [];
  for (let y = 0; y < MAP_HEIGHT_TILES; y++) {
    for (let x = 0; x < MAP_WIDTH_TILES; x++) {
      const tile = tiles[y][x];
      if (tile.isCoast && tile.biome === BiomeType.BEACH && !tile.cityName) {
        coastalTiles.push(tile);
      }
    }
  }
  
  if (coastalTiles.length === 0) return;
  
  // Place up to hutCount fishing huts
  const placedHuts: Tile[] = [];
  for (let i = 0; i < hutCount && coastalTiles.length > 0; i++) {
    const index = Math.floor(randomNoise.random() * coastalTiles.length);
    const tile = coastalTiles[index];
    
    // Check distance from other huts (minimum 10 tiles apart)
    let tooClose = false;
    for (const placedHut of placedHuts) {
      if (Math.hypot(tile.x - placedHut.x, tile.y - placedHut.y) < 10) {
        tooClose = true;
        break;
      }
    }
    
    if (!tooClose) {
      // Mark tile as having a fishing hut (structure generator will handle the actual placement)
      tile.hasFishingHut = true;
      placedHuts.push(tile);
      console.log(`[Urban] Placed fishing hut at (${tile.x}, ${tile.y})`);
    }
    
    // Remove from candidates
    coastalTiles.splice(index, 1);
  }
  
  if (placedHuts.length > 0) {
    console.log(`[Urban] Generated ${placedHuts.length} fishing huts for non-city coastal map`);
  }
}
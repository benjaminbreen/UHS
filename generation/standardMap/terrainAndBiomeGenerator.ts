/**
 * generation/standardMap/terrainAndBiomeGenerator.ts - Terrain and Biome generation logic for Standard Maps
 */
import { Tile, BiomeType, MapArchetype, ClimateType, Point, NeighboringEdges, EdgeTileInfo, AltitudeSetting } from '../../types/index';
import { ValueNoise } from '../../utils/noise';
import { getNeighboringClimateInfo, applyClimateTransitionsToMap } from '../../utils/climateStitchingUtils';
import {
    MAP_WIDTH_TILES, MAP_HEIGHT_TILES,
    ALTITUDE_LEVELS, NOISE_SCALE_ALTITUDE, NOISE_SCALE_BIOME_VARIATION,
    NOISE_SCALE_HUMIDITY, NOISE_SCALE_DESERTIFICATION, NOISE_SCALE_TEMPERATURE, NOISE_SCALE_THERMAL,
    JUNGLE_HUMIDITY_THRESHOLD, DESERT_ARIDITY_THRESHOLD,
    SCRUB_HUMIDITY_THRESHOLD_LOW, SCRUB_HUMIDITY_THRESHOLD_HIGH,
    DENSE_FOREST_HUMIDITY_THRESHOLD, DENSE_FOREST_ALTITUDE_PREFERENCE, DENSE_FOREST_CHANCE_IN_FOREST,
    RIVERBANK_GENERATION_RADIUS,
    TUNDRA_TEMPERATURE_THRESHOLD, STEPPE_HUMIDITY_LOW, STEPPE_HUMIDITY_HIGH, MANGROVE_COASTAL_RANGE, MANGROVE_MIN_HUMIDITY,
    VOLCANIC_ACTIVE_THRESHOLD, VOLCANIC_LAVA_RADIUS, VOLCANIC_ROCK_RADIUS, VOLCANIC_SOIL_RADIUS,
    SALT_FLATS_HUMIDITY_THRESHOLD, SALT_FLATS_ALTITUDE_VARIANCE_MAX,
    HOT_SPRINGS_VOLCANIC_PROXIMITY, HOT_SPRINGS_MOUNTAIN_PROXIMITY,
    SHOALS_TILE_MIN_ALTITUDE_FOR_LAND_PART, SHOALS_ARCHETYPE_SHOAL_TILE_DENSITY, FRESHWATER_LAKE_RADIUS_RATIO,
    BAY_WATER_RATIO
} from '../../constants/index'; // Path updated

const desertifiableBiomesSet = new Set([
    BiomeType.GRASSLAND, BiomeType.FOREST, BiomeType.HILLS, BiomeType.BEACH, BiomeType.SCRUB, BiomeType.RIVERBANK, BiomeType.STEPPE, BiomeType.TUNDRA
]);

const nonVolcanicRockBiomes = new Set([
    BiomeType.DEEP_OCEAN, BiomeType.SHALLOW_OCEAN, BiomeType.RIVER, BiomeType.MAJOR_RIVER, BiomeType.OASIS,
    BiomeType.WETLANDS, BiomeType.REEF, BiomeType.MANGROVE, BiomeType.ACTIVE_LAVA, BiomeType.SALT_FLATS,
    BiomeType.HAMLET, BiomeType.LOW_DENSITY_CITY, BiomeType.DENSE_CITY, BiomeType.URBAN, BiomeType.RUINS, BiomeType.FARMLAND, BiomeType.ESTUARY,
    BiomeType.FRESHWATER_LAKE, BiomeType.CLIFF,
]);


const nonEstuaryOverwritableWaterBiomes = new Set([
    BiomeType.REEF, BiomeType.OASIS, BiomeType.HOT_SPRINGS, BiomeType.ACTIVE_LAVA, BiomeType.ESTUARY,
    BiomeType.FRESHWATER_LAKE // Estuaries should form at edges of lakes, not overwrite them.
]);


export function generateAltitudeAndInitialBiomes(
  tiles: Tile[][],
  altitudeNoiseGen: ValueNoise,
  biomeVariationNoise: ValueNoise,
  archetype: MapArchetype,
  altitudeSetting: AltitudeSetting,
  determinedHarborSide?: number,
  neighboringEdges?: NeighboringEdges
): void {
  const EDGE_INFLUENCE_DISTANCE_ALT = 3;

  for (let y = 0; y < MAP_HEIGHT_TILES; y++) {
    for (let x = 0; x < MAP_WIDTH_TILES; x++) {
      const tile = tiles[y][x];
      if (tile.biome === BiomeType.FRESHWATER_LAKE) continue; // Skip if already set as lake by orchestrator

      if (tile.isLand) {
        let altNoiseVal = altitudeNoiseGen.octaveNoise(x * NOISE_SCALE_ALTITUDE, y * NOISE_SCALE_ALTITUDE, 5, 0.45, 2.1);
        
        if (altitudeSetting === 'high') {
            altNoiseVal = Math.pow(altNoiseVal, 0.8) * 1.1;
        } else if (altitudeSetting === 'low') {
            altNoiseVal = Math.pow(altNoiseVal, 1.3) * 0.85;
        }

        if (archetype === MapArchetype.ISLAND || archetype === MapArchetype.ATOLL) {
            const dX_island_alt = x / MAP_WIDTH_TILES - 0.5;
            const dY_island_alt = y / MAP_HEIGHT_TILES - 0.5;
            const distToCenter_alt = Math.sqrt(dX_island_alt * dX_island_alt + dY_island_alt * dY_island_alt);

            let altitudeBiasFactor = Math.pow(Math.max(0, 1 - distToCenter_alt * 1.8), 0.6);
            tile.altitude = altNoiseVal * Math.max(0.15, altitudeBiasFactor);
            if (archetype === MapArchetype.ATOLL) { // Atolls are very low-lying
                tile.altitude *= 0.3;
            } else {
                tile.altitude = Math.min(1.0, tile.altitude * (1 + (0.4 * Math.max(0, 1 - distToCenter_alt * 2.5))));
            }
        } else if (archetype === MapArchetype.PENINSULA && determinedHarborSide !== undefined) {
            let landExtent = 0;
            const peninsulaAxis = determinedHarborSide % 2;
            if (peninsulaAxis === 0) {
                landExtent = (determinedHarborSide === 0) ? (x / MAP_WIDTH_TILES) : ((MAP_WIDTH_TILES - x) / MAP_WIDTH_TILES);
            } else {
                landExtent = (determinedHarborSide === 2) ? (y / MAP_HEIGHT_TILES) : ((MAP_HEIGHT_TILES - y) / MAP_HEIGHT_TILES);
            }
            tile.altitude = altNoiseVal * (0.2 + landExtent * 0.8);

        } else if (archetype === MapArchetype.ALL_LAND && determinedHarborSide !== undefined) {
            const landConcentrationRatio = 0.40;
            let distFactor = 0;
             if (determinedHarborSide === 0) distFactor = Math.min(1, x / (MAP_WIDTH_TILES * landConcentrationRatio));
             else if (determinedHarborSide === 1) distFactor = Math.min(1, (MAP_WIDTH_TILES - x) / (MAP_WIDTH_TILES * landConcentrationRatio));
             else if (determinedHarborSide === 2) distFactor = Math.min(1, y / (MAP_HEIGHT_TILES * landConcentrationRatio));
             else distFactor = Math.min(1, (MAP_HEIGHT_TILES - y) / (MAP_HEIGHT_TILES * landConcentrationRatio));

            tile.altitude = altNoiseVal * (0.35 + distFactor * 0.65);
        } else if (archetype === MapArchetype.BAY || archetype === MapArchetype.FRESHWATER_LAKE) { // Include FRESHWATER_LAKE here for surrounding terrain altitude
            const dX_center = x / MAP_WIDTH_TILES - 0.5;
            const dY_center = y / MAP_HEIGHT_TILES - 0.5;
            const distToCenterRatio = Math.sqrt(dX_center * dX_center + dY_center * dY_center) * 2;
            const lakeOrBayEdgeRatio = archetype === MapArchetype.BAY ? BAY_WATER_RATIO * 0.5 : FRESHWATER_LAKE_RADIUS_RATIO + 0.05; // Use a base radius for lakes too
            if (distToCenterRatio > lakeOrBayEdgeRatio) {
                 tile.altitude = altNoiseVal * (0.2 + (distToCenterRatio - lakeOrBayEdgeRatio) * 0.5);
            } else {
                 tile.altitude = altNoiseVal * 0.1; // Low altitude near water body edge
            }
        } else if (archetype === MapArchetype.DELTA && determinedHarborSide !== undefined) {
            const oceanEdge = determinedHarborSide;
            let slopeFactor = 0;

            switch (oceanEdge) {
                case 0: // South is ocean
                    slopeFactor = (MAP_HEIGHT_TILES - y - 1) / MAP_HEIGHT_TILES;
                    break;
                case 1: // North is ocean
                    slopeFactor = y / MAP_HEIGHT_TILES;
                    break;
                case 2: // East is ocean
                    slopeFactor = (MAP_WIDTH_TILES - x - 1) / MAP_WIDTH_TILES;
                    break;
                case 3: // West is ocean
                    slopeFactor = x / MAP_WIDTH_TILES;
                    break;
            }

            // Altitude is very low, gently sloping from ~BEACH+0.1 down to BEACH level at the coast
            const baseDeltaAltitude = ALTITUDE_LEVELS.BEACH + 0.05;
            const slopeRange = 0.1;
            tile.altitude = baseDeltaAltitude + (slopeFactor * slopeRange) + (altNoiseVal - 0.5) * 0.02; // very flat with minor noise
            tile.altitude = Math.max(ALTITUDE_LEVELS.BEACH, tile.altitude);
        } else {
            tile.altitude = altNoiseVal;
        }

        // Altitude continuity blending
        let altitudeBias = 0;
        let biasCount = 0;
        if (neighboringEdges?.west && x < EDGE_INFLUENCE_DISTANCE_ALT && neighboringEdges.west[y]?.isLand === tile.isLand) {
            const influence = (EDGE_INFLUENCE_DISTANCE_ALT - x) / EDGE_INFLUENCE_DISTANCE_ALT;
            altitudeBias += (neighboringEdges.west[y].altitude - tile.altitude) * influence;
            biasCount++;
        }
        if (neighboringEdges?.east && (MAP_WIDTH_TILES - 1 - x) < EDGE_INFLUENCE_DISTANCE_ALT && neighboringEdges.east[y]?.isLand === tile.isLand) {
            const influence = (EDGE_INFLUENCE_DISTANCE_ALT - (MAP_WIDTH_TILES - 1 - x)) / EDGE_INFLUENCE_DISTANCE_ALT;
            altitudeBias += (neighboringEdges.east[y].altitude - tile.altitude) * influence;
            biasCount++;
        }
        if (neighboringEdges?.north && y < EDGE_INFLUENCE_DISTANCE_ALT && neighboringEdges.north[x]?.isLand === tile.isLand) {
            const influence = (EDGE_INFLUENCE_DISTANCE_ALT - y) / EDGE_INFLUENCE_DISTANCE_ALT;
            altitudeBias += (neighboringEdges.north[x].altitude - tile.altitude) * influence;
            biasCount++;
        }
        if (neighboringEdges?.south && (MAP_HEIGHT_TILES - 1 - y) < EDGE_INFLUENCE_DISTANCE_ALT && neighboringEdges.south[x]?.isLand === tile.isLand) {
            const influence = (EDGE_INFLUENCE_DISTANCE_ALT - (MAP_HEIGHT_TILES - 1 - y)) / EDGE_INFLUENCE_DISTANCE_ALT;
            altitudeBias += (neighboringEdges.south[x].altitude - tile.altitude) * influence;
            biasCount++;
        }
        if (biasCount > 0) {
            tile.altitude += (altitudeBias / biasCount) * 0.5; // Apply 50% of the averaged bias
        }

        // Override altitude for exact edges if land status matches
        if (x === 0 && neighboringEdges?.west && neighboringEdges.west[y]?.isLand === tile.isLand) tile.altitude = neighboringEdges.west[y].altitude;
        else if (x === MAP_WIDTH_TILES - 1 && neighboringEdges?.east && neighboringEdges.east[y]?.isLand === tile.isLand) tile.altitude = neighboringEdges.east[y].altitude;
        if (y === 0 && neighboringEdges?.north && neighboringEdges.north[x]?.isLand === tile.isLand) tile.altitude = neighboringEdges.north[x].altitude;
        else if (y === MAP_HEIGHT_TILES - 1 && neighboringEdges?.south && neighboringEdges.south[x]?.isLand === tile.isLand) tile.altitude = neighboringEdges.south[x].altitude;


        tile.altitude = Math.max(0, Math.min(1, tile.altitude));

        if (tile.altitude < ALTITUDE_LEVELS.BEACH) tile.biome = BiomeType.BEACH;
        else if (tile.altitude < ALTITUDE_LEVELS.GRASSLAND_UPPER_MAX) tile.biome = BiomeType.GRASSLAND;
        else if (tile.altitude < ALTITUDE_LEVELS.FOREST_UPPER_MAX) {
            if (tile.altitude >= ALTITUDE_LEVELS.HILLS_START && tile.altitude <= ALTITUDE_LEVELS.HILLS_MAX) tile.biome = BiomeType.HILLS; // Potential HILLS
            else tile.biome = BiomeType.FOREST; // Potential FOREST
        } else if (tile.altitude < ALTITUDE_LEVELS.HILLS_MAX) tile.biome = BiomeType.HILLS; // Potential HILLS
        else if (tile.altitude < ALTITUDE_LEVELS.MOUNTAIN_MAX) tile.biome = BiomeType.MOUNTAIN; // Potential MOUNTAIN
        else tile.biome = BiomeType.HIGH_PEAK; // Potential HIGH_PEAK

        if (archetype === MapArchetype.ISLAND || archetype === MapArchetype.ATOLL) {
            const dX_island_alt = x / MAP_WIDTH_TILES - 0.5;
            const dY_island_alt = y / MAP_HEIGHT_TILES - 0.5;
            const distToCenter_alt = Math.sqrt(dX_island_alt * dX_island_alt + dY_island_alt * dY_island_alt);
            const preserveBiomesMountain = new Set([BiomeType.SNOW, BiomeType.HIGH_PEAK, BiomeType.ESTUARY, BiomeType.FRESHWATER_LAKE, BiomeType.CLIFF, BiomeType.PALACE, BiomeType.HOLY_SITE]);
            const preserveBiomesHills = new Set([BiomeType.SNOW, BiomeType.HIGH_PEAK, BiomeType.MOUNTAIN, BiomeType.ESTUARY, BiomeType.FRESHWATER_LAKE, BiomeType.CLIFF, BiomeType.PALACE, BiomeType.HOLY_SITE]);

            if (distToCenter_alt < 0.12 && tile.altitude >= ALTITUDE_LEVELS.MOUNTAIN_MAX * (archetype === MapArchetype.ATOLL ? 0.15 : 0.75) ) { // Atolls very rarely have high peaks
                tile.biome = tile.altitude >= ALTITUDE_LEVELS.SNOW_LINE ? BiomeType.SNOW : (tile.altitude > ALTITUDE_LEVELS.MOUNTAIN_MAX * (archetype === MapArchetype.ATOLL ? 0.2 : 0.85) ? BiomeType.HIGH_PEAK : BiomeType.MOUNTAIN);
            } else if (distToCenter_alt < 0.20 && tile.altitude >= ALTITUDE_LEVELS.HILLS_MAX * (archetype === MapArchetype.ATOLL ? 0.2 : 0.75)) {
                if (!preserveBiomesMountain.has(tile.biome)) {
                     tile.biome = BiomeType.MOUNTAIN;
                }
            } else if (distToCenter_alt < 0.30 && tile.altitude >= ALTITUDE_LEVELS.HILLS_START) {
                 if (!preserveBiomesHills.has(tile.biome)) {
                    tile.biome = BiomeType.HILLS;
                }
            }
             if (archetype === MapArchetype.ATOLL && tile.isLand && tile.biome !== BiomeType.BEACH) { 
                if (tile.altitude > ALTITUDE_LEVELS.GRASSLAND_LOWER_MAX) tile.biome = BiomeType.SCRUB;
                else if (tile.altitude > ALTITUDE_LEVELS.BEACH) tile.biome = BiomeType.GRASSLAND; // very low grassland
                else tile.biome = BiomeType.BEACH;
            }
        }

        if (tile.biome === BiomeType.GRASSLAND && tile.altitude >= ALTITUDE_LEVELS.HILLS_START && tile.altitude <= ALTITUDE_LEVELS.HILLS_MAX) { // GRASSLAND to HILLS
            if (tile.altitude > ALTITUDE_LEVELS.FOREST_LOWER_MAX || biomeVariationNoise.random() > 0.6) tile.biome = BiomeType.HILLS;
        }
        if (tile.biome === BiomeType.FOREST && tile.altitude >= ALTITUDE_LEVELS.HILLS_START && tile.altitude > ALTITUDE_LEVELS.FOREST_UPPER_MAX * 0.85 && tile.altitude <= ALTITUDE_LEVELS.HILLS_MAX) { // FOREST to HILLS
            if (biomeVariationNoise.random() > 0.5) tile.biome = BiomeType.HILLS;
        }

        const preserveSnowHighPeak = new Set([BiomeType.HIGH_PEAK]); // CLIFF, ESTUARY, FRESHWATER_LAKE removed as they'd be overwritten
        if (tile.altitude >= ALTITUDE_LEVELS.SNOW_LINE) {
          if (!preserveSnowHighPeak.has(tile.biome)) tile.biome = BiomeType.SNOW; // Potential SNOW
        }
        else if (tile.altitude > ALTITUDE_LEVELS.MOUNTAIN_MAX) { // If not SNOW, and above MOUNTAIN_MAX
             tile.biome = BiomeType.HIGH_PEAK; // Potential HIGH_PEAK
        }
        else if (tile.altitude > ALTITUDE_LEVELS.HILLS_MAX) { // If not SNOW or HIGH_PEAK, and above HILLS_MAX
            tile.biome = BiomeType.MOUNTAIN;
        }


        const variationNoiseVal = biomeVariationNoise.noise(x * NOISE_SCALE_BIOME_VARIATION, y * NOISE_SCALE_BIOME_VARIATION);
        const currentBiomeBeforeVariation = tile.biome;
        if (currentBiomeBeforeVariation === BiomeType.GRASSLAND) {
          if (variationNoiseVal > 0.7 && tile.altitude < ALTITUDE_LEVELS.HILLS_START) tile.biome = BiomeType.FOREST;
          else if (variationNoiseVal > 0.5) tile.biome = BiomeType.SCRUB;
        } else if (currentBiomeBeforeVariation === BiomeType.FOREST) {
          if (variationNoiseVal < 0.3) tile.biome = BiomeType.GRASSLAND;
          else if (variationNoiseVal < 0.5) tile.biome = BiomeType.SCRUB;
        }
      }
    }
  }
}

export function applyClimateBiomeChanges(
    tiles: Tile[][], climate: ClimateType,
    humidityNoise: ValueNoise, desertificationNoise: ValueNoise,
    biomeVariationNoise: ValueNoise, featurePlacementNoise: ValueNoise
) {
  for (let y = 0; y < MAP_HEIGHT_TILES; y++) {
    for (let x = 0; x < MAP_WIDTH_TILES; x++) {
      const tile = tiles[y][x];
      if (!tile.isLand || tile.biome === BiomeType.ESTUARY || tile.biome === BiomeType.FRESHWATER_LAKE || tile.biome === BiomeType.CLIFF || [BiomeType.MARKETPLACE, BiomeType.GOVERNMENT_DISTRICT, BiomeType.PALACE, BiomeType.HOLY_SITE].includes(tile.biome)) continue;

      const humidityVal = humidityNoise.octaveNoise(x * NOISE_SCALE_HUMIDITY, y * NOISE_SCALE_HUMIDITY, 3, 0.5, 2.0);
      const desertChance = desertificationNoise.noise(x * NOISE_SCALE_DESERTIFICATION, y * NOISE_SCALE_DESERTIFICATION);
      const biomeVar = biomeVariationNoise.random();

      const biomeAtClimateCheckStart: BiomeType = tile.biome;

      if (climate === ClimateType.COLD) {
        if (tile.altitude >= ALTITUDE_LEVELS.SNOW_LINE * 0.7 && tile.biome !== BiomeType.HIGH_PEAK) tile.biome = BiomeType.SNOW;
      } else if (climate === ClimateType.TEMPERATE) {
        if (tile.altitude >= ALTITUDE_LEVELS.SNOW_LINE && tile.biome !== BiomeType.HIGH_PEAK) tile.biome = BiomeType.SNOW;
      } else {
        if (biomeAtClimateCheckStart === BiomeType.SNOW && tile.altitude < ALTITUDE_LEVELS.SNOW_LINE * 1.2) {
             tile.biome = tile.altitude > ALTITUDE_LEVELS.MOUNTAIN_MAX ? BiomeType.HIGH_PEAK : BiomeType.MOUNTAIN;
        }
      }


      const currentBiomeAfterSnowCheck: BiomeType = tile.biome;
      if (climate === ClimateType.TROPICAL || climate === ClimateType.SEMITROPICAL) {
        if ((currentBiomeAfterSnowCheck === BiomeType.FOREST || currentBiomeAfterSnowCheck === BiomeType.GRASSLAND || currentBiomeAfterSnowCheck === BiomeType.SCRUB || currentBiomeAfterSnowCheck === BiomeType.RIVERBANK) && tile.altitude < ALTITUDE_LEVELS.HILLS_MAX) {
          let jungleChance = 0;
          if (climate === ClimateType.TROPICAL) jungleChance = 0.6;
          if (climate === ClimateType.SEMITROPICAL) jungleChance = 0.3;

          if (humidityVal > JUNGLE_HUMIDITY_THRESHOLD && biomeVar < jungleChance) {
            tile.biome = BiomeType.JUNGLE;
          }
        }
      }

      const currentBiomeAfterJungleCheck: BiomeType = tile.biome;
      const nonDesertBiomes = new Set([BiomeType.SNOW, BiomeType.HIGH_PEAK, BiomeType.MOUNTAIN, BiomeType.JUNGLE, BiomeType.DENSE_FOREST, BiomeType.WETLANDS, BiomeType.OASIS, BiomeType.ACTIVE_LAVA, BiomeType.VOLCANIC_ROCK, BiomeType.ESTUARY, BiomeType.FRESHWATER_LAKE, BiomeType.CLIFF]);
      if (climate === ClimateType.ARID) {
        if (tile.biome === BiomeType.FOREST || tile.biome === BiomeType.DENSE_FOREST) {
            tile.biome = BiomeType.SCRUB;
        }
        if (!nonDesertBiomes.has(currentBiomeAfterJungleCheck)) {
            let desertificationFactor = 0.7;
            if (humidityVal < DESERT_ARIDITY_THRESHOLD && desertChance < desertificationFactor) {
              if (desertifiableBiomesSet.has(tile.biome)) {
                const originalBiomeBeforeDesert = tile.biome;
                tile.biome = BiomeType.DESERT;
                if(originalBiomeBeforeDesert !== BiomeType.HILLS && originalBiomeBeforeDesert !== BiomeType.RIVERBANK) {
                    tile.altitude = Math.min(tile.altitude, ALTITUDE_LEVELS.GRASSLAND_UPPER_MAX * 0.8);
                }
              }
            }
        }
      }

      const currentBiomeAfterDesertCheck: BiomeType = tile.biome;
      const nonScrubBiomes = new Set([BiomeType.DESERT, BiomeType.JUNGLE, BiomeType.WETLANDS, BiomeType.ACTIVE_LAVA, BiomeType.VOLCANIC_ROCK, BiomeType.SNOW, BiomeType.ESTUARY, BiomeType.FRESHWATER_LAKE, BiomeType.CLIFF]);
      if (!nonScrubBiomes.has(currentBiomeAfterDesertCheck) && tile.altitude < ALTITUDE_LEVELS.HILLS_START) {
          if (humidityVal >= SCRUB_HUMIDITY_THRESHOLD_LOW && humidityVal < SCRUB_HUMIDITY_THRESHOLD_HIGH) {
              if (currentBiomeAfterDesertCheck === BiomeType.GRASSLAND || currentBiomeAfterDesertCheck === BiomeType.RIVERBANK || (currentBiomeAfterDesertCheck === BiomeType.FOREST && biomeVar < 0.4) ) {
                  tile.biome = BiomeType.SCRUB;
              }
          } else if (humidityVal < SCRUB_HUMIDITY_THRESHOLD_LOW && (currentBiomeAfterDesertCheck === BiomeType.GRASSLAND || currentBiomeAfterDesertCheck === BiomeType.RIVERBANK) && climate !== ClimateType.ARID) {
              if (biomeVar < 0.6) tile.biome = BiomeType.SCRUB;
          }
      }

      if (climate === ClimateType.ARID && tile.biome === BiomeType.JUNGLE) tile.biome = BiomeType.SCRUB;
      if (climate === ClimateType.TROPICAL && (tile.biome === BiomeType.DESERT || tile.biome === BiomeType.SCRUB)) {
        tile.biome = BiomeType.GRASSLAND;
      }
      if (climate === ClimateType.COLD && tile.biome === BiomeType.DESERT) tile.biome = BiomeType.TUNDRA;
    }
  }
}

export function generateDenseForests(
  tiles: Tile[][],
  climate: ClimateType,
  humidityNoise: ValueNoise,
  biomeVariationNoise: ValueNoise,
  featurePlacementNoise: ValueNoise
): void {
  for (let y = 0; y < MAP_HEIGHT_TILES; y++) {
    for (let x = 0; x < MAP_WIDTH_TILES; x++) {
      const tile = tiles[y][x];
      if (tile.biome !== BiomeType.FOREST) continue; // Simplified: only consider FOREST tiles

      const humidityVal = humidityNoise.octaveNoise(x * NOISE_SCALE_HUMIDITY, y * NOISE_SCALE_HUMIDITY, 3, 0.5, 2.0);
      let densityChance = 0;

      if (humidityVal > DENSE_FOREST_HUMIDITY_THRESHOLD) densityChance += 0.3;
      if (tile.altitude > DENSE_FOREST_ALTITUDE_PREFERENCE * 0.8 && tile.altitude < DENSE_FOREST_ALTITUDE_PREFERENCE * 1.2) densityChance += 0.2;

      if (climate === ClimateType.TROPICAL) densityChance += 0.3;
      else if (climate === ClimateType.SEMITROPICAL) densityChance += 0.2;
      else if (climate === ClimateType.TEMPERATE) densityChance += 0.1;

      let nearbyDenseForests = 0;
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          if (dx === 0 && dy === 0) continue;
          const checkX = x + dx;
          const checkY = y + dy;
          if (checkX >= 0 && checkX < MAP_WIDTH_TILES && checkY >= 0 && checkY < MAP_HEIGHT_TILES) {
            if (tiles[checkY][checkX].biome === BiomeType.DENSE_FOREST) nearbyDenseForests++;
          }
        }
      }
      if (nearbyDenseForests > 0) densityChance += nearbyDenseForests * 0.1;

      if (featurePlacementNoise.random() < densityChance * DENSE_FOREST_CHANCE_IN_FOREST) {
        tile.biome = BiomeType.DENSE_FOREST;
      }
    }
  }
}

export function generateRiverbanks(tiles: Tile[][], featurePlacementNoise: ValueNoise): void {
  const riverTiles: Point[] = [];
  for (let y = 0; y < MAP_HEIGHT_TILES; y++) {
    for (let x = 0; x < MAP_WIDTH_TILES; x++) {
      if (tiles[y][x].biome === BiomeType.RIVER || tiles[y][x].biome === BiomeType.MAJOR_RIVER) {
        riverTiles.push({ x, y });
      }
    }
  }

  for (const riverTile of riverTiles) {
    for (let dy = -RIVERBANK_GENERATION_RADIUS; dy <= RIVERBANK_GENERATION_RADIUS; dy++) {
      for (let dx = -RIVERBANK_GENERATION_RADIUS; dx <= RIVERBANK_GENERATION_RADIUS; dx++) {
        if (dx === 0 && dy === 0) continue;
        const checkX = riverTile.x + dx;
        const checkY = riverTile.y + dy;

        if (checkX >= 0 && checkX < MAP_WIDTH_TILES && checkY >= 0 && checkY < MAP_HEIGHT_TILES) {
          const tile = tiles[checkY][checkX];
          const distance = Math.sqrt(dx * dx + dy * dy);

          const eligibleBiomes = [BiomeType.GRASSLAND, BiomeType.SCRUB, BiomeType.STEPPE, BiomeType.TUNDRA];
          if (tile.isLand && eligibleBiomes.includes(tile.biome) && distance <= RIVERBANK_GENERATION_RADIUS && tile.biome !== BiomeType.ESTUARY && tile.biome !== BiomeType.FRESHWATER_LAKE && tile.biome !== BiomeType.CLIFF) {
            const probability = 1 - (distance / RIVERBANK_GENERATION_RADIUS);
            if (featurePlacementNoise.random() < probability * 0.9) {
              tile.biome = BiomeType.RIVERBANK;
              if (tile.altitude > ALTITUDE_LEVELS.GRASSLAND_LOWER_MAX) {
                tile.altitude = Math.max(ALTITUDE_LEVELS.BEACH + 0.02, tile.altitude * 0.9);
              }
            }
          }
        }
      }
    }
  }
}

export function updateCoastlinesAndShallowOceans(
    tiles: Tile[][],
    featurePlacementNoise: ValueNoise,
    archetype: MapArchetype,
    neighboringEdges?: NeighboringEdges
) {
  for (let y = 0; y < MAP_HEIGHT_TILES; y++) {
    for (let x = 0; x < MAP_WIDTH_TILES; x++) {
      const tile = tiles[y][x];
      const isLakeContext = archetype === MapArchetype.FRESHWATER_LAKE;

      if (tile.isLand) {
        // Land tiles bordering ESTUARY, FRESHWATER_LAKE, or CLIFF are always coastal
        if (tile.biome === BiomeType.ESTUARY || tile.biome === BiomeType.FRESHWATER_LAKE || tile.biome === BiomeType.CLIFF) {
             tile.isCoast = true;
             continue;
        }
        let isCoastal = false;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = x + dx;
            const ny = y + dy;
            let neighborIsWater = false;
            if (nx >= 0 && nx < MAP_WIDTH_TILES && ny >= 0 && ny < MAP_HEIGHT_TILES) {
                if (!tiles[ny][nx].isLand) neighborIsWater = true;
            } else { // Check neighboring map segment edges
                if (nx < 0 && neighboringEdges?.west && neighboringEdges.west[ny]) neighborIsWater = !neighboringEdges.west[ny].isLand;
                else if (nx >= MAP_WIDTH_TILES && neighboringEdges?.east && neighboringEdges.east[ny]) neighborIsWater = !neighboringEdges.east[ny].isLand;
                else if (ny < 0 && neighboringEdges?.north && neighboringEdges.north[nx]) neighborIsWater = !neighboringEdges.north[nx].isLand;
                else if (ny >= MAP_HEIGHT_TILES && neighboringEdges?.south && neighboringEdges.south[nx]) neighborIsWater = !neighboringEdges.south[nx].isLand;
            }

            if (neighborIsWater) {
              // Further check for specific water biomes based on context
              let relevantWaterBiome = false;
              const neighborBiome = (nx >= 0 && nx < MAP_WIDTH_TILES && ny >= 0 && ny < MAP_HEIGHT_TILES) ? tiles[ny][nx].biome :
                                    (nx < 0 && neighboringEdges?.west && neighboringEdges.west[ny]) ? neighboringEdges.west[ny].biome :
                                    (nx >= MAP_WIDTH_TILES && neighboringEdges?.east && neighboringEdges.east[ny]) ? neighboringEdges.east[ny].biome :
                                    (ny < 0 && neighboringEdges?.north && neighboringEdges.north[nx]) ? neighboringEdges.north[nx].biome :
                                    (ny >= MAP_HEIGHT_TILES && neighboringEdges?.south && neighboringEdges.south[nx]) ? neighboringEdges.south[nx].biome :
                                    null;

              if (isLakeContext && neighborBiome && [BiomeType.FRESHWATER_LAKE, BiomeType.RIVER, BiomeType.MAJOR_RIVER, BiomeType.ESTUARY].includes(neighborBiome)) {
                relevantWaterBiome = true;
              } else if (!isLakeContext && neighborBiome && [BiomeType.DEEP_OCEAN, BiomeType.SHALLOW_OCEAN, BiomeType.REEF, BiomeType.SHOALS_TILE, BiomeType.ESTUARY].includes(neighborBiome)) {
                relevantWaterBiome = true;
              }
              if (relevantWaterBiome) {
                isCoastal = true; break;
              }
            }
          }
          if (isCoastal) break;
        }
        tile.isCoast = isCoastal;

        const nonBeachCoastBiomes = new Set([BiomeType.MOUNTAIN, BiomeType.HIGH_PEAK, BiomeType.SNOW, BiomeType.RIVER, BiomeType.MAJOR_RIVER, BiomeType.URBAN, BiomeType.DENSE_CITY, BiomeType.LOW_DENSITY_CITY, BiomeType.HAMLET, BiomeType.WETLANDS, BiomeType.DESERT, BiomeType.JUNGLE, BiomeType.DENSE_FOREST, BiomeType.RIVERBANK, BiomeType.VOLCANIC_ROCK, BiomeType.ACTIVE_LAVA, BiomeType.MANGROVE, BiomeType.RUINS, BiomeType.FARMLAND, BiomeType.ESTUARY, BiomeType.FRESHWATER_LAKE, BiomeType.CLIFF, BiomeType.MARKETPLACE, BiomeType.GOVERNMENT_DISTRICT, BiomeType.HOLY_SITE, BiomeType.PALACE]);
        if (isCoastal && !nonBeachCoastBiomes.has(tile.biome)) {
            tile.biome = BiomeType.BEACH;
            if (tile.altitude > ALTITUDE_LEVELS.BEACH + 0.02) {
                tile.altitude = ALTITUDE_LEVELS.BEACH + featurePlacementNoise.random() * 0.01;
            } else if (tile.altitude < ALTITUDE_LEVELS.SEA) {
                 tile.altitude = ALTITUDE_LEVELS.SEA + featurePlacementNoise.random() * 0.01;
            }
        }
      } else { // Tile is water
        if (tile.biome === BiomeType.FRESHWATER_LAKE) continue; // Lake biome is set, don't change to ocean

        let isNearLand = false;
        let distToLand = archetype === MapArchetype.ATOLL ? 3 : 2;
        for(let r=1; r<=distToLand; r++){
            for (let dy = -r; dy <= r; dy++) {
              for (let dx = -r; dx <= r; dx++) {
                 if(Math.abs(dx) !== r && Math.abs(dy) !== r && r > 1) continue;
                 if(dx === 0 && dy === 0 && r===1) continue;

                 const nx = x + dx;
                 const ny = y + dy;
                 let neighborIsLandSource: EdgeTileInfo | Tile | undefined = undefined;
                 if (nx >= 0 && nx < MAP_WIDTH_TILES && ny >= 0 && ny < MAP_HEIGHT_TILES) {
                    neighborIsLandSource = tiles[ny][nx];
                 } else {
                    if (nx < 0 && neighboringEdges?.west && neighboringEdges.west[ny]) neighborIsLandSource = neighboringEdges.west[ny];
                    else if (nx >= MAP_WIDTH_TILES && neighboringEdges?.east && neighboringEdges.east[ny]) neighborIsLandSource = neighboringEdges.east[ny];
                    else if (ny < 0 && neighboringEdges?.north && neighboringEdges.north[nx]) neighborIsLandSource = neighboringEdges.north[nx];
                    else if (ny >= MAP_HEIGHT_TILES && neighboringEdges?.south && neighboringEdges.south[nx]) neighborIsLandSource = neighboringEdges.south[nx];
                 }

                 if (neighborIsLandSource && neighborIsLandSource.isLand && neighborIsLandSource.biome !== BiomeType.ESTUARY && neighborIsLandSource.biome !== BiomeType.FRESHWATER_LAKE && neighborIsLandSource.biome !== BiomeType.CLIFF) {
                    isNearLand = true;
                    if (tile.biome !== BiomeType.ESTUARY) { // Don't change estuary altitude this way
                        tile.altitude = ALTITUDE_LEVELS.SEA * (0.5 + ((distToLand - r + 1) * 0.15));
                    }
                    break;
                 }
              }
              if (isNearLand) break;
            }
            if (isNearLand) break;
        }

        const nonOceanWaterBiomes = new Set([BiomeType.MAJOR_RIVER, BiomeType.RIVER, BiomeType.OASIS, BiomeType.WETLANDS, BiomeType.HOT_SPRINGS, BiomeType.ESTUARY, BiomeType.FRESHWATER_LAKE]);
        if (!nonOceanWaterBiomes.has(tiles[y][x].biome)) { // Only affect default ocean tiles
            if (isNearLand) {
                tiles[y][x].biome = BiomeType.SHALLOW_OCEAN;
            } else {
                tiles[y][x].biome = BiomeType.DEEP_OCEAN;
                tiles[y][x].altitude = 0;
            }
        }
      }
    }
  }
}

export function generateVolcanicComplex(tiles: Tile[][], temperatureNoise: ValueNoise, featurePlacementNoise: ValueNoise, archetype: MapArchetype, forceVolcanic: boolean) {
    const volcanicCenters: Point[] = [];
    if (archetype === MapArchetype.ISLAND || archetype === MapArchetype.ATOLL || featurePlacementNoise.random() < 0.1 || forceVolcanic) {
        for (let y = 0; y < MAP_HEIGHT_TILES; y++) {
            for (let x = 0; x < MAP_WIDTH_TILES; x++) {
                const canHostVolcano = archetype === MapArchetype.ATOLL ?
                    (tiles[y][x].biome === BiomeType.SHALLOW_OCEAN || tiles[y][x].biome === BiomeType.SHOALS_TILE || (tiles[y][x].isLand && tiles[y][x].biome !== BiomeType.BEACH && tiles[y][x].altitude < ALTITUDE_LEVELS.GRASSLAND_LOWER_MAX)) :
                    ((tiles[y][x].biome === BiomeType.HIGH_PEAK || tiles[y][x].biome === BiomeType.MOUNTAIN) && tiles[y][x].altitude > ALTITUDE_LEVELS.MOUNTAIN_MAX * 0.8);

                if (canHostVolcano && tiles[y][x].biome !== BiomeType.ESTUARY && tiles[y][x].biome !== BiomeType.FRESHWATER_LAKE && tiles[y][x].biome !== BiomeType.CLIFF) {
                    if (featurePlacementNoise.random() < (archetype === MapArchetype.ATOLL ? 0.05 : 0.3)) volcanicCenters.push({ x, y });
                }
            }
        }
    }

    if (forceVolcanic && volcanicCenters.length === 0) {
        let attempts = 0;
        while(attempts < 50 && volcanicCenters.length === 0) {
            const randX = Math.floor(featurePlacementNoise.random() * MAP_WIDTH_TILES);
            const randY = Math.floor(featurePlacementNoise.random() * MAP_HEIGHT_TILES);
            // Find any suitable high-altitude land tile on any map
            if (tiles[randY][randX].isLand && tiles[randY][randX].altitude > ALTITUDE_LEVELS.HILLS_MAX && tiles[randY][randX].biome !== BiomeType.SNOW) {
                 volcanicCenters.push({ x: randX, y: randY });
            }
            attempts++;
        }
    }
    
    if (volcanicCenters.length === 0 && (archetype === MapArchetype.ISLAND || archetype === MapArchetype.ATOLL)) {
        let attempts = 0;
        while(attempts < 10 && volcanicCenters.length === 0) {
            const randX = Math.floor(featurePlacementNoise.random() * MAP_WIDTH_TILES);
            const randY = Math.floor(featurePlacementNoise.random() * MAP_HEIGHT_TILES);
            const canHostVolcanoFallback = archetype === MapArchetype.ATOLL ?
                (tiles[randY][randX].biome === BiomeType.SHALLOW_OCEAN || tiles[randY][randX].biome === BiomeType.SHOALS_TILE) :
                (tiles[randY][randX].isLand && tiles[randY][randX].altitude > ALTITUDE_LEVELS.HILLS_MAX);

            if(canHostVolcanoFallback && tiles[randY][randX].biome !== BiomeType.ESTUARY && tiles[randY][randX].biome !== BiomeType.FRESHWATER_LAKE && tiles[randY][randX].biome !== BiomeType.CLIFF) {
                 volcanicCenters.push({ x: randX, y: randY });
            }
            attempts++;
        }
    }

    volcanicCenters.forEach(center => {
        const isActiveVolcano = temperatureNoise.noise(center.x * NOISE_SCALE_TEMPERATURE, center.y * NOISE_SCALE_TEMPERATURE) > VOLCANIC_ACTIVE_THRESHOLD && (featurePlacementNoise.random() < (archetype === MapArchetype.ATOLL ? 0.01 : 0.3) || forceVolcanic);

        if (isActiveVolcano && archetype !== MapArchetype.ATOLL) { 
            for (let dy = -VOLCANIC_LAVA_RADIUS; dy <= VOLCANIC_LAVA_RADIUS; dy++) {
                for (let dx = -VOLCANIC_LAVA_RADIUS; dx <= VOLCANIC_LAVA_RADIUS; dx++) {
                    const checkX = center.x + dx; const checkY = center.y + dy;
                    if (checkX >= 0 && checkX < MAP_WIDTH_TILES && checkY >= 0 && checkY < MAP_HEIGHT_TILES) {
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        if (dist <= VOLCANIC_LAVA_RADIUS * (0.5 + featurePlacementNoise.random() * 0.5)) {
                            const tile = tiles[checkY][checkX];
                            if (tile.isLand && tile.altitude >= tiles[center.y][center.x].altitude * 0.7 && tile.biome !== BiomeType.ESTUARY && tile.biome !== BiomeType.FRESHWATER_LAKE && tile.biome !== BiomeType.CLIFF) {
                                tile.biome = BiomeType.ACTIVE_LAVA;
                                tile.isLand = true;
                            }
                        }
                    }
                }
            }
        }

        const rockRadius = archetype === MapArchetype.ATOLL ? VOLCANIC_ROCK_RADIUS * 0.3 : VOLCANIC_ROCK_RADIUS; 
        for (let dy = -rockRadius; dy <= rockRadius; dy++) {
            for (let dx = -rockRadius; dx <= rockRadius; dx++) {
                const checkX = center.x + dx; const checkY = center.y + dy;
                if (checkX >= 0 && checkX < MAP_WIDTH_TILES && checkY >= 0 && checkY < MAP_HEIGHT_TILES) {
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist <= rockRadius) {
                        const tile = tiles[checkY][checkX];
                        const canBeVolcanicRock = archetype === MapArchetype.ATOLL ?
                            (tile.biome === BiomeType.SHALLOW_OCEAN || tile.biome === BiomeType.SHOALS_TILE || (tile.isLand && tile.altitude < ALTITUDE_LEVELS.GRASSLAND_LOWER_MAX)) :
                            (tile.isLand && tile.biome !== BiomeType.ACTIVE_LAVA && !nonVolcanicRockBiomes.has(tile.biome) && tile.altitude >= ALTITUDE_LEVELS.HILLS_START);

                        if (canBeVolcanicRock) {
                            if (featurePlacementNoise.random() < (1 - dist / rockRadius) * (archetype === MapArchetype.ATOLL ? 0.4 : 0.8)) {
                                tile.biome = BiomeType.VOLCANIC_ROCK;
                                if (archetype === MapArchetype.ATOLL && !tile.isLand) { 
                                    tile.isLand = featurePlacementNoise.random() < 0.3;
                                    tile.altitude = tile.isLand ? ALTITUDE_LEVELS.SEA + 0.01 : ALTITUDE_LEVELS.SEA * 0.5;
                                }
                            }
                        }
                    }
                }
            }
        }
        if (archetype !== MapArchetype.ATOLL) { 
            for (let dy = -VOLCANIC_SOIL_RADIUS; dy <= VOLCANIC_SOIL_RADIUS; dy++) {
                for (let dx = -VOLCANIC_SOIL_RADIUS; dx <= VOLCANIC_SOIL_RADIUS; dx++) {
                    const checkX = center.x + dx; const checkY = center.y + dy;
                     if (checkX >= 0 && checkX < MAP_WIDTH_TILES && checkY >= 0 && checkY < MAP_HEIGHT_TILES) {
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        if (dist <= VOLCANIC_SOIL_RADIUS && dist > VOLCANIC_LAVA_RADIUS * 0.3) {
                            const tile = tiles[checkY][checkX];
                             if (tile.isLand && [BiomeType.GRASSLAND, BiomeType.SCRUB, BiomeType.FOREST, BiomeType.HILLS].includes(tile.biome) && tile.biome !== BiomeType.ESTUARY && tile.biome !== BiomeType.FRESHWATER_LAKE && tile.biome !== BiomeType.CLIFF) {
                                 if (featurePlacementNoise.random() < (1 - dist / VOLCANIC_SOIL_RADIUS) * 0.7) {
                                    tile.biome = BiomeType.VOLCANIC_SOIL;
                                 }
                             }
                        }
                    }
                }
            }
        }
    });
}

export function generateClimateEnhancedBiomes(tiles: Tile[][], climate: ClimateType, temperatureNoise: ValueNoise, humidityNoise: ValueNoise, featurePlacementNoise: ValueNoise) {
    for (let y = 0; y < MAP_HEIGHT_TILES; y++) {
        for (let x = 0; x < MAP_WIDTH_TILES; x++) {
            const tile = tiles[y][x];
            if (!tile.isLand || [BiomeType.ACTIVE_LAVA, BiomeType.VOLCANIC_ROCK, BiomeType.OASIS, BiomeType.WETLANDS, BiomeType.MAJOR_RIVER, BiomeType.RIVER, BiomeType.SALT_FLATS, BiomeType.RUINS, BiomeType.FARMLAND, BiomeType.ESTUARY, BiomeType.FRESHWATER_LAKE, BiomeType.CLIFF, BiomeType.MARKETPLACE, BiomeType.GOVERNMENT_DISTRICT, BiomeType.PALACE, BiomeType.HOLY_SITE].includes(tile.biome)) continue;

            const tempVal = temperatureNoise.noise(x * NOISE_SCALE_TEMPERATURE, y * NOISE_SCALE_TEMPERATURE);
            const humidVal = humidityNoise.noise(x * NOISE_SCALE_HUMIDITY, y * NOISE_SCALE_HUMIDITY);

            if (climate === ClimateType.COLD || (climate === ClimateType.TEMPERATE && tempVal < TUNDRA_TEMPERATURE_THRESHOLD)) {
                if ([BiomeType.GRASSLAND, BiomeType.SCRUB, BiomeType.FOREST, BiomeType.HILLS, BiomeType.RIVERBANK].includes(tile.biome) && tile.biome !== BiomeType.SNOW) {
                    tile.biome = BiomeType.TUNDRA;
                }
            }

            if ([ClimateType.TEMPERATE, ClimateType.SEMITROPICAL, ClimateType.COLD].includes(climate)) {
                 if ([BiomeType.GRASSLAND, BiomeType.SCRUB].includes(tile.biome) && humidVal >= STEPPE_HUMIDITY_LOW && humidVal < STEPPE_HUMIDITY_HIGH && tile.altitude < ALTITUDE_LEVELS.STEPPE_MAX_ALTITUDE) {
                    if (featurePlacementNoise.random() < 0.4) tile.biome = BiomeType.STEPPE;
                }
            }

            if ((climate === ClimateType.TROPICAL || climate === ClimateType.SEMITROPICAL) && humidVal > MANGROVE_MIN_HUMIDITY) {
                if (tile.isCoast && (tile.biome === BiomeType.BEACH || tile.biome === BiomeType.WETLANDS || tile.biome === BiomeType.SHALLOW_OCEAN) && tile.altitude < ALTITUDE_LEVELS.BEACH + 0.01) {
                    let isSheltered = false;
                    let landNeighbors = 0;
                    for(let dy = -1; dy <= 1; dy++){
                        for(let dx = -1; dx <= 1; dx++){
                            if(dx === 0 && dy === 0) continue;
                            const nx = x + dx; const ny = y + dy;
                            if(nx >=0 && nx < MAP_WIDTH_TILES && ny >= 0 && ny < MAP_HEIGHT_TILES && tiles[ny][nx].isLand) landNeighbors++;
                        }
                    }
                    if(landNeighbors >= 2) isSheltered = true;

                    if (isSheltered && featurePlacementNoise.random() < 0.6) {
                        let canPlaceMangrove = true;
                        for(let dy = -MANGROVE_COASTAL_RANGE; dy <= MANGROVE_COASTAL_RANGE; dy++){
                            for(let dx = -MANGROVE_COASTAL_RANGE; dx <= MANGROVE_COASTAL_RANGE; dx++){
                                if(Math.sqrt(dx*dx + dy*dy) > MANGROVE_COASTAL_RANGE) continue;
                                const nx = x + dx; const ny = y + dy;
                                 if(nx >=0 && nx < MAP_WIDTH_TILES && ny >= 0 && ny < MAP_HEIGHT_TILES && tiles[ny][nx].biome === BiomeType.DEEP_OCEAN) {
                                    canPlaceMangrove = false; break;
                                 }
                            }
                            if(!canPlaceMangrove) break;
                        }
                        if(canPlaceMangrove) {
                            tile.biome = BiomeType.MANGROVE;
                            tile.isLand = true;
                        }
                    }
                }
            }
        }
    }
}

export function generateShoalFormations(tiles: Tile[][], featurePlacementNoise: ValueNoise, thermalNoise: ValueNoise) {
    const formationNoise = new ValueNoise(featurePlacementNoise.random() * 10000); // Separate noise for formation placement
    const numFormations = 2 + Math.floor(formationNoise.random() * 3); // 2-4 formations

    for (let i = 0; i < numFormations; i++) {
        const centerX = Math.floor(formationNoise.random() * MAP_WIDTH_TILES);
        const centerY = Math.floor(formationNoise.random() * MAP_HEIGHT_TILES);

        // Ensure the center is in water
        if (tiles[centerY][centerX].isLand && tiles[centerY][centerX].biome !== BiomeType.SHOALS_TILE) continue;

        const formationRadiusBase = 4 + Math.floor(formationNoise.random() * 5); // Base radius of the entire formation

        // Place volcanic rock core (1-10 tiles)
        const numVolcanic = 1 + Math.floor(thermalNoise.random() * 10);
        for (let v = 0; v < numVolcanic; v++) {
            const angle = thermalNoise.random() * Math.PI * 2;
            const dist = thermalNoise.random() * formationRadiusBase * 0.2; // Rocks near center
            const rockX = Math.floor(centerX + Math.cos(angle) * dist);
            const rockY = Math.floor(centerY + Math.sin(angle) * dist);

            if (rockX >= 0 && rockX < MAP_WIDTH_TILES && rockY >= 0 && rockY < MAP_HEIGHT_TILES) {
                const tile = tiles[rockY][rockX];
                if (tile.biome === BiomeType.SHALLOW_OCEAN || tile.biome === BiomeType.DEEP_OCEAN || tile.biome === BiomeType.SHOALS_TILE || tile.biome === BiomeType.FRESHWATER_LAKE ) {
                    tile.biome = BiomeType.VOLCANIC_ROCK;
                    tile.isLand = true; // Volcanic rock is land
                    tile.altitude = ALTITUDE_LEVELS.SEA + 0.02 + thermalNoise.random() * 0.02;
                }
            }
        }

        // Spread shoals around the core
        for (let r = 1; r <= formationRadiusBase * 0.7; r++) {
            for (let dy = -r; dy <=r; dy++) {
                for (let dx = -r; dx <=r; dx++) {
                    if (Math.abs(dx) !==r && Math.abs(dy) !==r) continue; // Only process ring
                    const checkX = centerX + dx;
                    const checkY = centerY + dy;
                    if (checkX >= 0 && checkX < MAP_WIDTH_TILES && checkY >= 0 && checkY < MAP_HEIGHT_TILES) {
                        const tile = tiles[checkY][checkX];
                        if ((tile.biome === BiomeType.SHALLOW_OCEAN || tile.biome === BiomeType.DEEP_OCEAN || tile.biome === BiomeType.FRESHWATER_LAKE) && formationNoise.random() < 0.6) {
                            tile.biome = BiomeType.SHOALS_TILE;
                            tile.isLand = false; // Shoals are always water, never walkable
                            tile.altitude = ALTITUDE_LEVELS.SEA * (0.8 + formationNoise.random() * 0.4) - 0.01;
                        }
                    }
                }
            }
        }
        // Surround with shallow ocean
         for (let r = Math.floor(formationRadiusBase * 0.5); r <= formationRadiusBase; r++) {
            for (let dy = -r; dy <=r; dy++) {
                for (let dx = -r; dx <=r; dx++) {
                    if (Math.abs(dx) !==r && Math.abs(dy) !==r) continue;
                    const checkX = centerX + dx;
                    const checkY = centerY + dy;
                     if (checkX >= 0 && checkX < MAP_WIDTH_TILES && checkY >= 0 && checkY < MAP_HEIGHT_TILES) {
                        const tile = tiles[checkY][checkX];
                        if ((tile.biome === BiomeType.DEEP_OCEAN || tile.biome === BiomeType.FRESHWATER_LAKE) && formationNoise.random() < 0.7) {
                            tile.biome = tile.biome === BiomeType.FRESHWATER_LAKE ? BiomeType.FRESHWATER_LAKE : BiomeType.SHALLOW_OCEAN; // Keep freshwater lake if it was that
                             tile.altitude = ALTITUDE_LEVELS.SEA * (0.5 + formationNoise.random() * 0.2);
                        }
                    }
                }
            }
        }
    }
}


export function generateSpecialTerrainTiles(
    tiles: Tile[][], climate: ClimateType,
    humidityNoise: ValueNoise, altitudeNoise: ValueNoise,
    thermalNoise: ValueNoise, featurePlacementNoise: ValueNoise,
    archetype: MapArchetype
) {
    if (archetype === MapArchetype.SHOALS) {
        generateShoalFormations(tiles, featurePlacementNoise, thermalNoise);
         // Add more biome diversity for SHOALS
        for (let y = 0; y < MAP_HEIGHT_TILES; y++) {
            for (let x = 0; x < MAP_WIDTH_TILES; x++) {
                const tile = tiles[y][x];

                // Add WETLANDS near coast on low land
                if (tile.isLand && tile.isCoast && tile.altitude < ALTITUDE_LEVELS.BEACH * 1.5) {
                    if (featurePlacementNoise.random() < 0.4) {
                        tile.biome = BiomeType.WETLANDS;
                    }
                }

                // Add MANGROVE if tropical and coastal wetland
                if ((climate === ClimateType.TROPICAL || climate === ClimateType.SEMITROPICAL) && tile.biome === BiomeType.WETLANDS && tile.isCoast) {
                     if (featurePlacementNoise.random() < 0.6) {
                        tile.biome = BiomeType.MANGROVE;
                    }
                }

                // Add SALT_FLATS if arid and very low land, surrounded by water
                if (climate === ClimateType.ARID && tile.isLand && tile.altitude < ALTITUDE_LEVELS.BEACH * 1.1) {
                    let waterNeighbors = 0;
                    for (let dy = -1; dy <= 1; dy++) {
                        for (let dx = -1; dx <= 1; dx++) {
                            const nx = x + dx; const ny = y + dy;
                             if(nx >=0 && nx < MAP_WIDTH_TILES && ny >=0 && ny < MAP_HEIGHT_TILES && !tiles[ny][nx].isLand) waterNeighbors++;
                        }
                    }
                    if(waterNeighbors >= 3 && featurePlacementNoise.random() < 0.2) {
                        tile.biome = BiomeType.SALT_FLATS;
                    }
                }
            }
        }
        return; // Shoals archetype handled by its own function
    }
    
    if (archetype === MapArchetype.SWAMP) {
        // Swamp archetype: all land with wetlands, riverbanks, and mangroves
        for (let y = 0; y < MAP_HEIGHT_TILES; y++) {
            for (let x = 0; x < MAP_WIDTH_TILES; x++) {
                const tile = tiles[y][x];
                const swampNoise = featurePlacementNoise.noise(x * 0.1, y * 0.1);
                
                // Keep all tiles as land and convert to swamp-appropriate biomes
                if (tile.isLand && ![BiomeType.MOUNTAIN, BiomeType.HIGH_PEAK, BiomeType.SNOW, BiomeType.VOLCANIC_ROCK, BiomeType.ACTIVE_LAVA].includes(tile.biome)) {
                    // Rivers are already placed in the river generation phase, don't convert land to water here
                    if (tile.biome === BiomeType.RIVER || tile.biome === BiomeType.MAJOR_RIVER) {
                        // Keep existing rivers
                        continue;
                    }
                    
                    if (swampNoise > 0.4) {
                        // Many areas become wetlands
                        tile.biome = BiomeType.WETLANDS;
                        tile.altitude = Math.max(ALTITUDE_LEVELS.SEA + 0.01, tile.altitude * 0.5);
                    } else if (swampNoise > 0.1) {
                        // Some areas become riverbanks
                        tile.biome = BiomeType.RIVERBANK;
                        tile.altitude = Math.max(ALTITUDE_LEVELS.SEA + 0.02, tile.altitude * 0.6);
                    } else if (swampNoise > -0.2) {
                        // Coastal areas in tropical climates become mangroves
                        if (tile.isCoast && (climate === ClimateType.TROPICAL || climate === ClimateType.SEMITROPICAL)) {
                            tile.biome = BiomeType.MANGROVE;
                        } else {
                            tile.biome = BiomeType.WETLANDS;
                        }
                        tile.altitude = Math.max(ALTITUDE_LEVELS.SEA + 0.01, tile.altitude * 0.5);
                    } else {
                        // Remaining areas are mixed wetlands and beaches
                        if (tile.isCoast) {
                            tile.biome = BiomeType.BEACH;
                        } else {
                            tile.biome = BiomeType.WETLANDS;
                        }
                        tile.altitude = Math.max(ALTITUDE_LEVELS.SEA + 0.015, tile.altitude * 0.7);
                    }
                }
                
                // Convert shallow ocean to more rivers and wetlands
                if (tile.biome === BiomeType.SHALLOW_OCEAN && featurePlacementNoise.random() < 0.4) {
                    if (featurePlacementNoise.random() < 0.6) {
                        tile.biome = BiomeType.RIVER;
                    } else {
                        tile.biome = BiomeType.WETLANDS;
                        tile.isLand = true;
                    }
                }
            }
        }
        return; // Swamp archetype handled by its own function
    }
    
    if (archetype === MapArchetype.DESERT) {
        // Desert archetype: mostly desert, scrub, or tundra depending on climate
        for (let y = 0; y < MAP_HEIGHT_TILES; y++) {
            for (let x = 0; x < MAP_WIDTH_TILES; x++) {
                const tile = tiles[y][x];
                if (!tile.isLand) continue;
                
                const desertNoise = featurePlacementNoise.noise(x * 0.08, y * 0.08);
                
                // Base biome depends on climate
                if (climate === ClimateType.COLD) {
                    // Cold desert = icy wasteland (snow/tundra)
                    if (desertNoise > 0.3) {
                        tile.biome = BiomeType.SNOW;
                        tile.altitude = Math.max(tile.altitude, ALTITUDE_LEVELS.FOOTHILL);
                    } else if (desertNoise > -0.2) {
                        tile.biome = BiomeType.TUNDRA;
                    } else {
                        tile.biome = BiomeType.STEPPE;
                    }
                } else if (climate === ClimateType.ARID) {
                    // Hot desert
                    if (desertNoise > 0.4) {
                        tile.biome = BiomeType.DESERT;
                    } else if (desertNoise > 0.0) {
                        tile.biome = BiomeType.SCRUB;
                    } else {
                        tile.biome = BiomeType.STEPPE;
                    }
                } else {
                    // Temperate/other climates - mixed scrub/steppe
                    if (desertNoise > 0.2) {
                        tile.biome = BiomeType.SCRUB;
                    } else {
                        tile.biome = BiomeType.STEPPE;
                    }
                }
            }
        }
        return; // Desert archetype handled
    }
    
    if (archetype === MapArchetype.OPEN_OCEAN) {
        // Small patches of shallow sea
        const numShallowPatches = 2 + Math.floor(featurePlacementNoise.random() * 4);
        for (let i = 0; i < numShallowPatches; i++) {
            const patchX = Math.floor(featurePlacementNoise.random() * MAP_WIDTH_TILES);
            const patchY = Math.floor(featurePlacementNoise.random() * MAP_HEIGHT_TILES);
            const patchRadius = 2 + Math.floor(featurePlacementNoise.random() * 3);
            for (let dy = -patchRadius; dy <= patchRadius; dy++) {
                for (let dx = -patchRadius; dx <= patchRadius; dx++) {
                    if (Math.hypot(dx, dy) <= patchRadius) {
                        const curX = patchX + dx;
                        const curY = patchY + dy;
                        if (curX >= 0 && curX < MAP_WIDTH_TILES && curY >= 0 && curY < MAP_HEIGHT_TILES) {
                            if (tiles[curY][curX].biome === BiomeType.DEEP_OCEAN && featurePlacementNoise.random() < 0.6) {
                                tiles[curY][curX].biome = BiomeType.SHALLOW_OCEAN;
                                tiles[curY][curX].altitude = ALTITUDE_LEVELS.SEA * (0.3 + featurePlacementNoise.random() * 0.4);
                            }
                        }
                    }
                }
            }
        }
        // Very rare volcanic/shoal features
        if (featurePlacementNoise.random() < 0.03) { // Low chance
            const featureX = Math.floor(featurePlacementNoise.random() * MAP_WIDTH_TILES);
            const featureY = Math.floor(featurePlacementNoise.random() * MAP_HEIGHT_TILES);
            if (tiles[featureY][featureX].biome === BiomeType.DEEP_OCEAN || tiles[featureY][featureX].biome === BiomeType.SHALLOW_OCEAN) {
                tiles[featureY][featureX].biome = BiomeType.VOLCANIC_ROCK;
                tiles[featureY][featureX].isLand = true;
                tiles[featureY][featureX].altitude = ALTITUDE_LEVELS.SEA + 0.01;
                // Tiny shoal patch around it
                for(let d=1; d<=2; d++){
                    for(let dy=-d; dy<=d; dy++) for(let dx=-d; dx<=d; dx++){
                        if(Math.abs(dx)!==d && Math.abs(dy)!==d) continue;
                        const sx = featureX+dx; const sy = featureY+dy;
                        if(sx>=0 && sx<MAP_WIDTH_TILES && sy>=0 && sy<MAP_HEIGHT_TILES && (tiles[sy][sx].biome === BiomeType.DEEP_OCEAN || tiles[sy][sx].biome === BiomeType.SHALLOW_OCEAN)){
                            tiles[sy][sx].biome = d === 1 ? BiomeType.SHOALS_TILE : BiomeType.SHALLOW_OCEAN;
                            tiles[sy][sx].altitude = ALTITUDE_LEVELS.SEA * (d === 1 ? 0.7 : 0.5);
                            tiles[sy][sx].isLand = false; // Shoals are always water, never walkable
                        }
                    }
                }
            }
        }
        return;
    }


    if (climate === ClimateType.ARID) {
        for (let y = 0; y < MAP_HEIGHT_TILES; y++) {
            for (let x = 0; x < MAP_WIDTH_TILES; x++) {
                const tile = tiles[y][x];
                const humidVal = humidityNoise.noise(x * NOISE_SCALE_HUMIDITY, y * NOISE_SCALE_HUMIDITY);
                if (tile.isLand && tile.biome === BiomeType.DESERT && humidVal > SALT_FLATS_HUMIDITY_THRESHOLD) {
                    let minAlt = tile.altitude, maxAlt = tile.altitude;
                    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
                        const nx = x + dx; const ny = y + dy;
                        if (nx >=0 && nx < MAP_WIDTH_TILES && ny >=0 && ny < MAP_HEIGHT_TILES) {
                            minAlt = Math.min(minAlt, tiles[ny][nx].altitude); maxAlt = Math.max(maxAlt, tiles[ny][nx].altitude);
                        }
                    }
                    if ((maxAlt - minAlt) < SALT_FLATS_ALTITUDE_VARIANCE_MAX && featurePlacementNoise.random() < 0.5) {
                        tile.biome = BiomeType.SALT_FLATS;
                    }
                }
            }
        }
    }

    const allowedHotSpringBiomes = [BiomeType.HILLS, BiomeType.MOUNTAIN, BiomeType.VOLCANIC_ROCK, BiomeType.GRASSLAND, BiomeType.FOREST, BiomeType.TUNDRA, BiomeType.CLIFF];
    for (let y = 0; y < MAP_HEIGHT_TILES; y++) {
        for (let x = 0; x < MAP_WIDTH_TILES; x++) {
            const tile = tiles[y][x];
            if (!tile.isLand || !allowedHotSpringBiomes.includes(tile.biome) ) continue;

            let nearVolcano = false; let nearMountain = false;
            for (let dy = -Math.max(HOT_SPRINGS_VOLCANIC_PROXIMITY, HOT_SPRINGS_MOUNTAIN_PROXIMITY); dy <= Math.max(HOT_SPRINGS_VOLCANIC_PROXIMITY, HOT_SPRINGS_MOUNTAIN_PROXIMITY); dy++) {
                 for (let dx = -Math.max(HOT_SPRINGS_VOLCANIC_PROXIMITY, HOT_SPRINGS_MOUNTAIN_PROXIMITY); dx <= Math.max(HOT_SPRINGS_VOLCANIC_PROXIMITY, HOT_SPRINGS_MOUNTAIN_PROXIMITY); dx++) {
                    const dist = Math.sqrt(dx*dx + dy*dy);
                    const nx = x+dx; const ny = y+dy;
                    if(nx >=0 && nx < MAP_WIDTH_TILES && ny >=0 && ny < MAP_HEIGHT_TILES) {
                        if (dist <= HOT_SPRINGS_VOLCANIC_PROXIMITY && (tiles[ny][nx].biome === BiomeType.ACTIVE_LAVA || tiles[ny][nx].biome === BiomeType.VOLCANIC_ROCK)) nearVolcano = true;
                        if (dist <= HOT_SPRINGS_MOUNTAIN_PROXIMITY && (tiles[ny][nx].biome === BiomeType.MOUNTAIN || tiles[ny][nx].biome === BiomeType.HIGH_PEAK)) nearMountain = true;
                    }
                }
            }
            const thermalVal = thermalNoise.noise(x * NOISE_SCALE_THERMAL, y * NOISE_SCALE_THERMAL);
            if ((nearVolcano || nearMountain) && thermalVal > 0.65 && featurePlacementNoise.random() < 0.05) {
                tile.biome = BiomeType.HOT_SPRINGS;
                tile.isLand = false;
                tile.altitude = Math.max(ALTITUDE_LEVELS.SEA, tile.altitude * 0.5);
            }
        }
    }

    for (let y = 0; y < MAP_HEIGHT_TILES; y++) {
        for (let x = 0; x < MAP_WIDTH_TILES; x++) {
            const tile = tiles[y][x];
            if (archetype === MapArchetype.FRESHWATER_LAKE && tile.biome !== BiomeType.FRESHWATER_LAKE) continue; // Only consider non-lake tiles for shoals IN a lake context.
            else if (archetype !== MapArchetype.FRESHWATER_LAKE && tile.biome === BiomeType.FRESHWATER_LAKE) continue; // Don't turn oceanic lakes into shoals.


            if (climate === ClimateType.TEMPERATE && featurePlacementNoise.random() < 0.7) continue;

            if (tile.biome === BiomeType.SHALLOW_OCEAN || tile.biome === BiomeType.BEACH || (archetype === MapArchetype.FRESHWATER_LAKE && tile.biome === BiomeType.FRESHWATER_LAKE)) {
                let neighborLand = 0; let neighborWater = 0;
                for(let dy=-1; dy<=1; dy++) for(let dx=-1; dx<=1; dx++){
                    if(dx===0 && dy===0) continue;
                    const nx=x+dx; const ny=y+dy;
                    if(nx >=0 && nx < MAP_WIDTH_TILES && ny >=0 && ny < MAP_HEIGHT_TILES){
                        if(tiles[ny][nx].isLand && tiles[ny][nx].biome !== BiomeType.SHOALS_TILE && tiles[ny][nx].biome !== BiomeType.ESTUARY && tiles[ny][nx].biome !== BiomeType.FRESHWATER_LAKE && tiles[ny][nx].biome !== BiomeType.CLIFF) neighborLand++;
                        if(!tiles[ny][nx].isLand || tiles[ny][nx].biome === BiomeType.SHOALS_TILE || tiles[ny][nx].biome === BiomeType.ESTUARY || tiles[ny][nx].biome === BiomeType.FRESHWATER_LAKE) neighborWater++;
                    }
                }
                if(neighborLand > 1 && neighborWater > 1 && featurePlacementNoise.random() < 0.2) {
                     tile.biome = BiomeType.SHOALS_TILE;
                }
            }
            if (tile.biome === BiomeType.SHOALS_TILE) {
                 tile.isLand = false; // Shoals are always water, never walkable
                 tile.altitude = ALTITUDE_LEVELS.SEA * (0.8 + featurePlacementNoise.random() * 0.4) - 0.01;
            }
        }
    }
}

export function generateEstuaries(tiles: Tile[][], archetype: MapArchetype, featurePlacementNoise: ValueNoise) {
    const riverMouths: Point[] = [];
    const oceanBiomes = new Set([BiomeType.SHALLOW_OCEAN, BiomeType.DEEP_OCEAN, BiomeType.REEF, BiomeType.FRESHWATER_LAKE]);
    const riverBiomes = new Set([BiomeType.RIVER, BiomeType.MAJOR_RIVER]);

    for (let y = 0; y < MAP_HEIGHT_TILES; y++) {
        for (let x = 0; x < MAP_WIDTH_TILES; x++) {
            const tile = tiles[y][x];
            if (riverBiomes.has(tile.biome)) {
                let isMouth = false;
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        if (dx === 0 && dy === 0) continue;
                        const nx = x + dx;
                        const ny = y + dy;
                        if (nx >= 0 && nx < MAP_WIDTH_TILES && ny >= 0 && ny < MAP_HEIGHT_TILES && oceanBiomes.has(tiles[ny][nx].biome)) {
                            isMouth = true;
                            break;
                        }
                    }
                    if (isMouth) break;
                }
                if(isMouth) riverMouths.push({ x, y });
            }
        }
    }

    riverMouths.forEach(mouth => {
        const radius = 2 + Math.floor(featurePlacementNoise.random() * 2);
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const checkX = mouth.x + dx;
                const checkY = mouth.y + dy;
                if (checkX >= 0 && checkX < MAP_WIDTH_TILES && checkY >= 0 && checkY < MAP_HEIGHT_TILES) {
                    const tile = tiles[checkY][checkX];
                    const dist = Math.hypot(dx, dy);
                    if (dist <= radius && featurePlacementNoise.random() < 0.7 - (dist / (radius*2))) {
                        if (riverBiomes.has(tile.biome) || tile.biome === BiomeType.RIVERBANK || tile.biome === BiomeType.SHALLOW_OCEAN || tile.biome === BiomeType.BEACH) {
                             if (!nonEstuaryOverwritableWaterBiomes.has(tile.biome)) {
                                tile.biome = BiomeType.ESTUARY;
                                tile.isLand = false;
                             }
                        }
                    }
                }
            }
        }
    });
}
/**
 * Apply climate-aware transitions to biomes near map edges based on neighboring climate zones
 * This creates smooth transitions between different climate regions (e.g., COLD → TEMPERATE)
 */
export function applyClimateTransitions(
    tiles: Tile[][],
    currentClimate: ClimateType,
    localAreaName?: string
): void {
    if (!localAreaName) {
        console.log("[Climate Stitching] No local area name provided, skipping climate transitions");
        return;
    }

    console.log(`[Climate Stitching] Applying climate transitions for ${localAreaName} (${currentClimate})`);
    
    // Get neighboring climate information
    const neighboringClimates = getNeighboringClimateInfo(localAreaName, currentClimate);
    
    // Check if any climate transitions are needed
    const hasClimateTransitions = Object.values(neighboringClimates).some(
        climate => climate && climate !== currentClimate
    );
    
    if (!hasClimateTransitions) {
        console.log("[Climate Stitching] No climate transitions detected");
        return;
    }

    console.log("[Climate Stitching] Neighboring climates:", neighboringClimates);

    // Convert tiles to simplified format for processing
    const tilesToProcess: { biome: BiomeType; x: number; y: number }[] = [];
    for (let y = 0; y < MAP_HEIGHT_TILES; y++) {
        for (let x = 0; x < MAP_WIDTH_TILES; x++) {
            const tile = tiles[y][x];
            if (tile.isLand) { // Only apply to land tiles
                tilesToProcess.push({
                    biome: tile.biome,
                    x: x,
                    y: y
                });
            }
        }
    }

    // Apply climate transitions
    applyClimateTransitionsToMap(
        tilesToProcess,
        currentClimate,
        neighboringClimates,
        MAP_WIDTH_TILES,
        MAP_HEIGHT_TILES
    );

    // Update the actual tiles with the modified biomes
    tilesToProcess.forEach(processedTile => {
        const originalTile = tiles[processedTile.y][processedTile.x];
        
        // Validate the biome before applying it
        if (!processedTile.biome) {
            console.warn(`[Climate Stitching] Undefined biome at tile (${processedTile.x}, ${processedTile.y}), keeping original: ${originalTile.biome}`);
            return;
        }
        
        if (originalTile.biome !== processedTile.biome) {
            console.log(`[Climate Stitching] Tile (${processedTile.x}, ${processedTile.y}): ${originalTile.biome} → ${processedTile.biome}`);
            originalTile.biome = processedTile.biome;
        }
    });

    console.log("[Climate Stitching] Climate transitions applied successfully");
}
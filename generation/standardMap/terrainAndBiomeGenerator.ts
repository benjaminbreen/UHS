/**
 * generation/standardMap/terrainAndBiomeGenerator.ts - Terrain and Biome generation logic for Standard Maps
 */
import { Tile, BiomeType, MapArchetype, ClimateType, Point, NeighboringEdges, EdgeTileInfo, AltitudeSetting } from '../../types/index';
import { ValueNoise } from '../../utils/noise';
import { getNeighboringClimateInfo, applyClimateTransitionsToMap } from '../../utils/climateStitchingUtils';
import { ADJACENCIES } from '../../constants/gameData/adjacencies';
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
  neighboringEdges?: NeighboringEdges,
  hasLakes?: boolean
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

        } else if (archetype === MapArchetype.ALL_LAND) {
            if (determinedHarborSide !== undefined) {
                const landConcentrationRatio = 0.40;
                let distFactor = 0;
                 if (determinedHarborSide === 0) distFactor = Math.min(1, x / (MAP_WIDTH_TILES * landConcentrationRatio));
                 else if (determinedHarborSide === 1) distFactor = Math.min(1, (MAP_WIDTH_TILES - x) / (MAP_WIDTH_TILES * landConcentrationRatio));
                 else if (determinedHarborSide === 2) distFactor = Math.min(1, y / (MAP_HEIGHT_TILES * landConcentrationRatio));
                 else distFactor = Math.min(1, (MAP_HEIGHT_TILES - y) / (MAP_HEIGHT_TILES * landConcentrationRatio));

                // Base altitude calculation
                tile.altitude = altNoiseVal * (0.35 + distFactor * 0.65);
            } else {
                // ALL_LAND without harbor side - just use noise value
                tile.altitude = altNoiseVal;
            }
            
            // Prevent lake-like depressions for ALL_LAND maps (default no lakes unless explicitly enabled)
            if (hasLakes !== true) {
                // Ensure minimum altitude to prevent water-like depressions and beach formation
                tile.altitude = Math.max(ALTITUDE_LEVELS.BEACH + 0.02, tile.altitude);
            }
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

        // Don't automatically assign BEACH just based on altitude - wait for coastal detection
        if (tile.altitude < ALTITUDE_LEVELS.BEACH) tile.biome = BiomeType.GRASSLAND; // Temporarily assign low-lying areas as grassland
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

/**
 * Helper function to detect climate type from neighboring edge biomes
 */
function inferClimateFromBiomes(edgeTiles: EdgeTileInfo[]): ClimateType | null {
  if (!edgeTiles || edgeTiles.length === 0) return null;

  // Count biome occurrences to infer climate
  let coldBiomes = 0;
  let desertCount = 0;
  let tropicalBiomes = 0;
  let temperateBiomes = 0;

  for (const tile of edgeTiles) {
    if (!tile.isLand) continue;
    switch (tile.biome) {
      case BiomeType.TUNDRA:
      case BiomeType.SNOW:
        coldBiomes++;
        break;
      case BiomeType.DESERT:
      case BiomeType.SALT_FLATS:
        desertCount++;
        break;
      case BiomeType.JUNGLE:
      case BiomeType.MANGROVE:
        tropicalBiomes++;
        break;
      case BiomeType.GRASSLAND:
      case BiomeType.FOREST:
      case BiomeType.DENSE_FOREST:
        temperateBiomes++;
        break;
      case BiomeType.SCRUB:
      case BiomeType.STEPPE:
        // These can appear in multiple climates, don't count strongly
        break;
    }
  }

  const landTiles = edgeTiles.filter(t => t.isLand).length;
  if (landTiles === 0) return null;

  // Infer climate based on dominant biomes (check most specific first)
  if (coldBiomes > landTiles * 0.3) return ClimateType.COLD;
  if (desertCount > landTiles * 0.3) return ClimateType.ARID;
  if (tropicalBiomes > landTiles * 0.2) return ClimateType.TROPICAL;
  if (temperateBiomes > landTiles * 0.3) return ClimateType.TEMPERATE;

  return null; // Can't confidently determine
}

/**
 * Calculate gradient influence for biome transitions
 */
function calculateBiomeGradientInfluence(
  x: number, y: number,
  mapWidth: number, mapHeight: number,
  neighboringEdges?: NeighboringEdges
): { climate: ClimateType | null, influence: number, direction: 'N' | 'S' | 'E' | 'W' | null } {
  if (!neighboringEdges) return { climate: null, influence: 0, direction: null };

  const GRADIENT_DISTANCE = 40; // Tiles affected by gradient - doubled for smoother transitions

  // Check each edge for different climate
  let closestEdgeDistance = Infinity;
  let dominantClimate: ClimateType | null = null;
  let dominantDirection: 'N' | 'S' | 'E' | 'W' | null = null;

  if (neighboringEdges.north && y < GRADIENT_DISTANCE) {
    const climate = inferClimateFromBiomes(neighboringEdges.north);
    if (climate) {
      const distance = y;
      if (distance < closestEdgeDistance) {
        closestEdgeDistance = distance;
        dominantClimate = climate;
        dominantDirection = 'N';
      }
    }
  }

  if (neighboringEdges.south && (mapHeight - 1 - y) < GRADIENT_DISTANCE) {
    const climate = inferClimateFromBiomes(neighboringEdges.south);
    if (climate) {
      const distance = mapHeight - 1 - y;
      if (distance < closestEdgeDistance) {
        closestEdgeDistance = distance;
        dominantClimate = climate;
        dominantDirection = 'S';
      }
    }
  }

  if (neighboringEdges.west && x < GRADIENT_DISTANCE) {
    const climate = inferClimateFromBiomes(neighboringEdges.west);
    if (climate) {
      const distance = x;
      if (distance < closestEdgeDistance) {
        closestEdgeDistance = distance;
        dominantClimate = climate;
        dominantDirection = 'W';
      }
    }
  }

  if (neighboringEdges.east && (mapWidth - 1 - x) < GRADIENT_DISTANCE) {
    const climate = inferClimateFromBiomes(neighboringEdges.east);
    if (climate) {
      const distance = mapWidth - 1 - x;
      if (distance < closestEdgeDistance) {
        closestEdgeDistance = distance;
        dominantClimate = climate;
        dominantDirection = 'E';
      }
    }
  }

  if (dominantClimate && closestEdgeDistance < GRADIENT_DISTANCE) {
    // Add noise to create organic boundaries
    const noiseOffset = Math.sin(x * 0.1) * Math.cos(y * 0.1) * 5; // ±5 tile variation
    const adjustedDistance = Math.max(0, closestEdgeDistance + noiseOffset);

    // Calculate influence (1.0 at edge, 0.0 at GRADIENT_DISTANCE) with noise
    const baseInfluence = 1.0 - (adjustedDistance / GRADIENT_DISTANCE);
    const influence = Math.max(0, Math.min(1, baseInfluence));
    return { climate: dominantClimate, influence, direction: dominantDirection };
  }

  return { climate: null, influence: 0, direction: null };
}

export function applyClimateBiomeChanges(
    tiles: Tile[][], climate: ClimateType,
    humidityNoise: ValueNoise, desertificationNoise: ValueNoise,
    biomeVariationNoise: ValueNoise, featurePlacementNoise: ValueNoise,
    neighboringEdges?: NeighboringEdges
) {
  for (let y = 0; y < MAP_HEIGHT_TILES; y++) {
    for (let x = 0; x < MAP_WIDTH_TILES; x++) {
      const tile = tiles[y][x];
      if (!tile.isLand || tile.biome === BiomeType.ESTUARY || tile.biome === BiomeType.FRESHWATER_LAKE || tile.biome === BiomeType.CLIFF || [BiomeType.MARKETPLACE, BiomeType.GOVERNMENT_DISTRICT, BiomeType.PALACE, BiomeType.HOLY_SITE].includes(tile.biome)) continue;

      const humidityVal = humidityNoise.octaveNoise(x * NOISE_SCALE_HUMIDITY, y * NOISE_SCALE_HUMIDITY, 3, 0.5, 2.0);
      const desertChance = desertificationNoise.noise(x * NOISE_SCALE_DESERTIFICATION, y * NOISE_SCALE_DESERTIFICATION);
      const biomeVar = biomeVariationNoise.random();

      // Store original biome for comparison
      const originalBiome = tile.biome;

      // Check for gradient influence from neighboring maps
      const gradientInfo = calculateBiomeGradientInfluence(x, y, MAP_WIDTH_TILES, MAP_HEIGHT_TILES, neighboringEdges);

      // Apply gradient transitions if we're near an edge with a different climate
      if (gradientInfo.climate && gradientInfo.climate !== climate && gradientInfo.influence > 0) {
        const neighborClimate = gradientInfo.climate;
        const influence = gradientInfo.influence;

        // Create biome gradient transitions based on climate difference
        if (climate === ClimateType.TEMPERATE && neighborClimate === ClimateType.COLD) {
          // TEMPERATE → COLD gradient with new transitional biomes
          if (tile.biome === BiomeType.GRASSLAND) {
            if (influence > 0.7) {
              tile.biome = BiomeType.STEPPE; // Use steppe as main transition
            } else if (influence > 0.4) {
              tile.biome = BiomeType.PRAIRIE; // Prairie as intermediate
            }
            // else remains grassland
          } else if (tile.biome === BiomeType.PRAIRIE) {
            if (influence > 0.5) {
              tile.biome = BiomeType.STEPPE;
            }
          } else if (tile.biome === BiomeType.FOREST || tile.biome === BiomeType.DENSE_FOREST) {
            if (influence > 0.7) {
              tile.biome = BiomeType.TAIGA; // Boreal forest transition
            } else if (influence > 0.4) {
              tile.biome = BiomeType.FOREST; // Reduce density first
            }
          } else if (tile.biome === BiomeType.HILLS && influence > 0.5) {
            tile.biome = BiomeType.MOUNTAIN; // Higher elevation in cold regions
          }
        } else if (climate === ClimateType.COLD && neighborClimate === ClimateType.TEMPERATE) {
          // COLD → TEMPERATE gradient with new transitional biomes
          if (tile.biome === BiomeType.TUNDRA) {
            if (influence > 0.7) {
              tile.biome = BiomeType.PRAIRIE;
            } else if (influence > 0.4) {
              tile.biome = BiomeType.STEPPE;
            }
          } else if (tile.biome === BiomeType.STEPPE) {
            if (influence > 0.5) {
              tile.biome = BiomeType.PRAIRIE;
            }
          } else if (tile.biome === BiomeType.TAIGA) {
            if (influence > 0.6) {
              tile.biome = BiomeType.FOREST;
            }
          } else if (tile.biome === BiomeType.SNOW && tile.altitude < ALTITUDE_LEVELS.SNOW_LINE) {
            if (influence > 0.6) {
              tile.biome = BiomeType.ALPINE_MEADOW;
            } else if (influence > 0.3) {
              tile.biome = BiomeType.STEPPE;
            }
          }
        } else if (climate === ClimateType.TEMPERATE && neighborClimate === ClimateType.TROPICAL) {
          // TEMPERATE → TROPICAL gradient with SAVANNA
          if (tile.biome === BiomeType.GRASSLAND) {
            if (influence > 0.6) {
              tile.biome = BiomeType.SAVANNA;
            }
          } else if (tile.biome === BiomeType.PRAIRIE) {
            if (influence > 0.5) {
              tile.biome = BiomeType.SAVANNA;
            }
          } else if ((tile.biome === BiomeType.FOREST || tile.biome === BiomeType.DENSE_FOREST) && influence > 0.6) {
            tile.biome = BiomeType.JUNGLE;
          }
        } else if (climate === ClimateType.TROPICAL && neighborClimate === ClimateType.TEMPERATE) {
          // TROPICAL → TEMPERATE gradient with SAVANNA
          if (tile.biome === BiomeType.JUNGLE) {
            if (influence > 0.7) {
              tile.biome = BiomeType.FOREST;
            } else if (influence > 0.4) {
              tile.biome = BiomeType.DENSE_FOREST;
            }
          } else if (tile.biome === BiomeType.SAVANNA) {
            if (influence > 0.6) {
              tile.biome = BiomeType.PRAIRIE;
            } else if (influence > 0.3) {
              tile.biome = BiomeType.GRASSLAND;
            }
          }
        } else if (climate === ClimateType.TEMPERATE && neighborClimate === ClimateType.ARID) {
          // TEMPERATE → ARID gradient with SAVANNA
          if (tile.biome === BiomeType.GRASSLAND) {
            if (influence > 0.7) {
              tile.biome = BiomeType.SAVANNA;
            } else if (influence > 0.4) {
              tile.biome = BiomeType.SCRUB;
            }
          } else if (tile.biome === BiomeType.PRAIRIE) {
            if (influence > 0.6) {
              tile.biome = BiomeType.SAVANNA;
            }
          } else if (tile.biome === BiomeType.FOREST || tile.biome === BiomeType.DENSE_FOREST) {
            if (influence > 0.5) {
              tile.biome = BiomeType.SCRUB;
            }
          }
        } else if (climate === ClimateType.ARID && neighborClimate === ClimateType.TEMPERATE) {
          // ARID → TEMPERATE gradient with SAVANNA
          if (tile.biome === BiomeType.DESERT) {
            if (influence > 0.7) {
              tile.biome = BiomeType.SAVANNA;
            } else if (influence > 0.4) {
              tile.biome = BiomeType.SCRUB;
            }
          } else if (tile.biome === BiomeType.SAVANNA) {
            if (influence > 0.6) {
              tile.biome = BiomeType.PRAIRIE;
            }
          }
        } else if (climate === ClimateType.COLD && neighborClimate === ClimateType.TROPICAL) {
          // COLD → TROPICAL (rare but via transition zones)
          if (tile.biome === BiomeType.TUNDRA) {
            if (influence > 0.8) {
              tile.biome = BiomeType.GRASSLAND;
            } else if (influence > 0.5) {
              tile.biome = BiomeType.SCRUB;
            } else if (influence > 0.3) {
              tile.biome = BiomeType.STEPPE;
            }
          } else if (tile.biome === BiomeType.SNOW && tile.altitude < ALTITUDE_LEVELS.SNOW_LINE) {
            if (influence > 0.7) {
              tile.biome = BiomeType.SCRUB;
            }
          }
        } else if (climate === ClimateType.TROPICAL && neighborClimate === ClimateType.COLD) {
          // TROPICAL → COLD (rare transition)
          if (tile.biome === BiomeType.JUNGLE) {
            if (influence > 0.8) {
              tile.biome = BiomeType.SCRUB;
            } else if (influence > 0.5) {
              tile.biome = BiomeType.GRASSLAND;
            } else if (influence > 0.3) {
              tile.biome = BiomeType.FOREST;
            }
          } else if (tile.biome === BiomeType.MANGROVE) {
            tile.biome = BiomeType.WETLANDS;
          }
        } else if (climate === ClimateType.COLD && neighborClimate === ClimateType.ARID) {
          // COLD → ARID transitions
          if (tile.biome === BiomeType.TUNDRA) {
            if (influence > 0.6) {
              tile.biome = BiomeType.STEPPE;
            } else if (influence > 0.3) {
              tile.biome = BiomeType.SCRUB;
            }
          } else if (tile.biome === BiomeType.SNOW && tile.altitude < ALTITUDE_LEVELS.SNOW_LINE) {
            tile.biome = BiomeType.STEPPE;
          }
        } else if (climate === ClimateType.ARID && neighborClimate === ClimateType.COLD) {
          // ARID → COLD transitions
          if (tile.biome === BiomeType.DESERT) {
            if (influence > 0.6) {
              tile.biome = BiomeType.STEPPE;
            } else if (influence > 0.3) {
              tile.biome = BiomeType.SCRUB;
            }
          }
        } else if (climate === ClimateType.TROPICAL && neighborClimate === ClimateType.ARID) {
          // TROPICAL → ARID transitions
          if (tile.biome === BiomeType.JUNGLE) {
            if (influence > 0.7) {
              tile.biome = BiomeType.SCRUB;
            } else if (influence > 0.4) {
              tile.biome = BiomeType.GRASSLAND;
            }
          } else if (tile.biome === BiomeType.MANGROVE && influence > 0.5) {
            tile.biome = BiomeType.SCRUB;
          }
        } else if (climate === ClimateType.ARID && neighborClimate === ClimateType.TROPICAL) {
          // ARID → TROPICAL transitions
          if (tile.biome === BiomeType.DESERT) {
            if (influence > 0.7) {
              tile.biome = BiomeType.SCRUB;
            } else if (influence > 0.4) {
              tile.biome = BiomeType.GRASSLAND;
            }
          } else if (tile.biome === BiomeType.SALT_FLATS && influence > 0.5) {
            tile.biome = BiomeType.SCRUB;
          }
        }

        // Log only significant transitions for debugging
        if (tile.biome !== originalBiome) {
          console.log(`[Biome Gradient] Applied transition at (${x},${y}): ${originalBiome} → ${tile.biome} (${climate} → ${neighborClimate}, influence: ${influence.toFixed(2)})`);
        }

        // Skip the rest of climate processing if we applied a gradient
        continue;
      }

      const biomeAtClimateCheckStart: BiomeType = tile.biome;

      if (climate === ClimateType.COLD) {
        // Convert forests to TAIGA in cold climates
        if (tile.biome === BiomeType.FOREST || tile.biome === BiomeType.DENSE_FOREST) {
          tile.biome = BiomeType.TAIGA;
        }
        // Convert grasslands to STEPPE in cold climates
        if (tile.biome === BiomeType.GRASSLAND && biomeVar < 0.6) {
          tile.biome = BiomeType.STEPPE;
        }
        // Add alpine meadows below snow line
        if (tile.altitude > 0.65 && tile.altitude < ALTITUDE_LEVELS.SNOW_LINE * 0.7 && (tile.biome === BiomeType.SCRUB || tile.biome === BiomeType.GRASSLAND)) {
          tile.biome = BiomeType.ALPINE_MEADOW;
        }
        if (tile.altitude >= ALTITUDE_LEVELS.SNOW_LINE * 0.7 && tile.biome !== BiomeType.HIGH_PEAK) tile.biome = BiomeType.SNOW;
      } else if (climate === ClimateType.TEMPERATE) {
        // Add PRAIRIE for continental grasslands
        if (tile.biome === BiomeType.GRASSLAND && tile.altitude < 0.4) {
          const prairieNoise = biomeVariationNoise.noise(x * 0.03, y * 0.03);
          if (prairieNoise > 0.3) {
            tile.biome = BiomeType.PRAIRIE;
          }
        }
        // Add alpine meadows at high altitudes
        if (tile.altitude > 0.7 && tile.altitude < ALTITUDE_LEVELS.SNOW_LINE && (tile.biome === BiomeType.GRASSLAND || tile.biome === BiomeType.SCRUB)) {
          tile.biome = BiomeType.ALPINE_MEADOW;
        }
        if (tile.altitude >= ALTITUDE_LEVELS.SNOW_LINE && tile.biome !== BiomeType.HIGH_PEAK) tile.biome = BiomeType.SNOW;
      } else if (climate === ClimateType.MEDITERRANEAN) {
        // Mediterranean has snow only on the highest peaks
        if (tile.altitude >= ALTITUDE_LEVELS.SNOW_LINE * 1.1 && tile.biome !== BiomeType.HIGH_PEAK) tile.biome = BiomeType.SNOW;
      } else {
        if (biomeAtClimateCheckStart === BiomeType.SNOW && tile.altitude < ALTITUDE_LEVELS.SNOW_LINE * 1.2) {
             tile.biome = tile.altitude > ALTITUDE_LEVELS.MOUNTAIN_MAX ? BiomeType.HIGH_PEAK : BiomeType.MOUNTAIN;
        }
      }


      const currentBiomeAfterSnowCheck: BiomeType = tile.biome;
      if (climate === ClimateType.TROPICAL || climate === ClimateType.SEMITROPICAL) {
        // Add SAVANNA for tropical grasslands
        if (currentBiomeAfterSnowCheck === BiomeType.GRASSLAND && tile.altitude < ALTITUDE_LEVELS.HILLS_MAX) {
          const savannaChance = climate === ClimateType.TROPICAL ? 0.6 : 0.4;
          if (humidityVal < JUNGLE_HUMIDITY_THRESHOLD && biomeVar < savannaChance) {
            tile.biome = BiomeType.SAVANNA;
          }
        }
        // Original jungle logic
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
      const nonDesertBiomes = new Set([BiomeType.SNOW, BiomeType.HIGH_PEAK, BiomeType.MOUNTAIN, BiomeType.JUNGLE, BiomeType.DENSE_FOREST, BiomeType.WETLANDS, BiomeType.OASIS, BiomeType.ACTIVE_LAVA, BiomeType.VOLCANIC_ROCK, BiomeType.ESTUARY, BiomeType.FRESHWATER_LAKE, BiomeType.CLIFF, BiomeType.SAVANNA]);
      if (climate === ClimateType.ARID) {
        // Convert grasslands to savanna in arid regions
        if (tile.biome === BiomeType.GRASSLAND && biomeVar < 0.5) {
            tile.biome = BiomeType.SAVANNA;
        }
        // Add badlands at moderate elevations for terrain variety
        if (tile.altitude > 0.3 && tile.altitude < 0.6 && (tile.biome === BiomeType.DESERT || tile.biome === BiomeType.SCRUB)) {
            if (biomeVar < 0.3) {
                tile.biome = BiomeType.BADLANDS;
            }
        }
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
      } else if (climate === ClimateType.MEDITERRANEAN) {
        // Mediterranean: more scrub, less dense forest
        if (tile.biome === BiomeType.DENSE_FOREST && biomeVar < 0.6) {
            tile.biome = BiomeType.FOREST; // Mediterranean forests are less dense
        }
        // Convert some grassland to scrub in Mediterranean climate (maquis/garrigue)
        if (tile.biome === BiomeType.GRASSLAND && humidityVal < 0.5 && biomeVar < 0.4) {
            tile.biome = BiomeType.SCRUB;
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
            // Check what type of water we're adjacent to
            let nearLake = false;
            let nearRiver = false;
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (dx === 0 && dy === 0) continue;
                    const nx = x + dx;
                    const ny = y + dy;
                    if (nx >= 0 && nx < MAP_WIDTH_TILES && ny >= 0 && ny < MAP_HEIGHT_TILES) {
                        const neighbor = tiles[ny][nx];
                        if (neighbor.biome === BiomeType.FRESHWATER_LAKE) nearLake = true;
                        if (neighbor.biome === BiomeType.RIVER || neighbor.biome === BiomeType.MAJOR_RIVER) nearRiver = true;
                    }
                }
            }
            
            if (nearLake || isLakeContext) {
                // Near freshwater lake - use wetlands or riverbank
                if (featurePlacementNoise.random() < 0.7) {
                    tile.biome = BiomeType.WETLANDS;
                } else {
                    tile.biome = BiomeType.RIVERBANK;
                }
                tile.altitude = Math.max(ALTITUDE_LEVELS.BEACH, Math.min(ALTITUDE_LEVELS.BEACH + 0.02, tile.altitude));
            } else if (nearRiver) {
                // Near river - use riverbank
                tile.biome = BiomeType.RIVERBANK;
                tile.altitude = Math.max(ALTITUDE_LEVELS.BEACH, Math.min(ALTITUDE_LEVELS.BEACH + 0.02, tile.altitude));
            } else if (tile.altitude > ALTITUDE_LEVELS.HILLS_START && featurePlacementNoise.random() < 0.3) {
                // 30% chance to make coastal hills/mountains into cliffs
                tile.biome = BiomeType.CLIFF;
                // Keep altitude high for cliffs
            } else {
                // Ocean coast - use beach
                tile.biome = BiomeType.BEACH;
                if (tile.altitude > ALTITUDE_LEVELS.BEACH + 0.02) {
                    tile.altitude = ALTITUDE_LEVELS.BEACH + featurePlacementNoise.random() * 0.01;
                } else if (tile.altitude < ALTITUDE_LEVELS.SEA) {
                     tile.altitude = ALTITUDE_LEVELS.SEA + featurePlacementNoise.random() * 0.01;
                }
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

        const rockRadius = Math.floor(archetype === MapArchetype.ATOLL ? VOLCANIC_ROCK_RADIUS * 0.3 : VOLCANIC_ROCK_RADIUS); 
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
                            if (featurePlacementNoise.random() < (1 - dist / rockRadius) * (archetype === MapArchetype.ATOLL ? 0.2 : 0.4)) {
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

export function generateClimateEnhancedBiomes(tiles: Tile[][], climate: ClimateType, archetype: MapArchetype, temperatureNoise: ValueNoise, humidityNoise: ValueNoise, featurePlacementNoise: ValueNoise) {
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

            // Enhanced mangrove generation in tropical/semitropical climates
            if (climate === ClimateType.TROPICAL) {
                // Much more aggressive mangrove generation for tropical climates
                // Also generate mangroves in wetlands and near rivers, not just coasts
                const nearWater = tile.isCoast || tile.biome === BiomeType.WETLANDS || 
                                  tile.biome === BiomeType.RIVERBANK || tile.biome === BiomeType.SHALLOW_OCEAN;
                
                if (nearWater && (tile.biome === BiomeType.BEACH || tile.biome === BiomeType.WETLANDS || 
                    tile.biome === BiomeType.SHALLOW_OCEAN || tile.biome === BiomeType.GRASSLAND || 
                    tile.biome === BiomeType.RIVERBANK || tile.biome === BiomeType.SCRUB) && 
                    tile.altitude < ALTITUDE_LEVELS.BEACH + 0.05 && humidVal > MANGROVE_MIN_HUMIDITY * 0.3) { // Even lower humidity threshold
                    
                    let landNeighbors = 0;
                    let waterNeighbors = 0;
                    for(let dy = -1; dy <= 1; dy++){
                        for(let dx = -1; dx <= 1; dx++){
                            if(dx === 0 && dy === 0) continue;
                            const nx = x + dx; const ny = y + dy;
                            if(nx >=0 && nx < MAP_WIDTH_TILES && ny >= 0 && ny < MAP_HEIGHT_TILES) {
                                if(tiles[ny][nx].isLand) landNeighbors++;
                                else waterNeighbors++;
                            }
                        }
                    }
                    
                    // Place mangroves when there's water nearby
                    // More lenient conditions for tropical zones
                    if ((waterNeighbors >= 1 || tile.biome === BiomeType.WETLANDS) && 
                        featurePlacementNoise.random() < 0.95) { // 95% chance in tropical
                        tile.biome = BiomeType.MANGROVE;
                        tile.isLand = true;
                    }
                }
            } else if (climate === ClimateType.SEMITROPICAL && humidVal > MANGROVE_MIN_HUMIDITY * 0.5) {
                // Enhanced mangrove generation for semitropical
                const nearWater = tile.isCoast || tile.biome === BiomeType.WETLANDS || 
                                  tile.biome === BiomeType.RIVERBANK;
                
                if (nearWater && (tile.biome === BiomeType.BEACH || tile.biome === BiomeType.WETLANDS || 
                    tile.biome === BiomeType.SHALLOW_OCEAN || tile.biome === BiomeType.GRASSLAND || 
                    tile.biome === BiomeType.RIVERBANK || tile.biome === BiomeType.SCRUB) && 
                    tile.altitude < ALTITUDE_LEVELS.BEACH + 0.04) { // Increased altitude threshold
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

                    // More lenient sheltered conditions for semitropical
                    if ((isSheltered || tile.biome === BiomeType.WETLANDS || waterNeighbors >= 2) && 
                        featurePlacementNoise.random() < 0.85) { // 85% chance in semitropical
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
    
    // Enhanced mangrove generation for water-heavy archetypes
    // Bay, Strait, and Peninsula maps should have more mangroves in tropical/semitropical climates
    if ((climate === ClimateType.TROPICAL || climate === ClimateType.SEMITROPICAL)) {
        
        // Count existing mangroves
        let mangroveCount = 0;
        for (let y = 0; y < MAP_HEIGHT_TILES; y++) {
            for (let x = 0; x < MAP_WIDTH_TILES; x++) {
                if (tiles[y][x].biome === BiomeType.MANGROVE) {
                    mangroveCount++;
                }
            }
        }
        
        // Determine minimum mangroves based on archetype
        let minMangroves = 0;
        let targetMangroves = 0;
        
        if ([MapArchetype.BAY, MapArchetype.STRAITS, MapArchetype.PENINSULA].includes(archetype)) {
            // These archetypes should have lots of mangroves
            minMangroves = climate === ClimateType.TROPICAL ? 8 : 4;
            targetMangroves = climate === ClimateType.TROPICAL ? 
                10 + Math.floor(featurePlacementNoise.random() * 15) : // 10-25 for tropical
                6 + Math.floor(featurePlacementNoise.random() * 10);   // 6-15 for semitropical
        } else if ([MapArchetype.ISLAND, MapArchetype.ATOLL, MapArchetype.DELTA, 
                    MapArchetype.FRESHWATER_LAKE, MapArchetype.RIVER_PORT].includes(archetype)) {
            // Moderate mangrove generation
            minMangroves = climate === ClimateType.TROPICAL ? 3 : 1;
            targetMangroves = climate === ClimateType.TROPICAL ? 
                5 + Math.floor(featurePlacementNoise.random() * 8) : // 5-12 for tropical
                3 + Math.floor(featurePlacementNoise.random() * 5);  // 3-7 for semitropical
        } else if (archetype === MapArchetype.ALL_LAND && humidityNoise) {
            // Even all-land maps can have mangroves in wetlands
            const avgHumidity = humidityNoise.octaveNoise(MAP_WIDTH_TILES/2, MAP_HEIGHT_TILES/2, 2, 0.5, 2.0);
            if (avgHumidity > 0.6) {
                minMangroves = 0;
                targetMangroves = climate === ClimateType.TROPICAL ? 
                    2 + Math.floor(featurePlacementNoise.random() * 4) : // 2-5 for tropical
                    1 + Math.floor(featurePlacementNoise.random() * 2);  // 1-2 for semitropical
            }
        }
        
        // Generate mangroves if we're below the minimum
        if (mangroveCount < minMangroves && targetMangroves > 0) {
            
            let placedMangroves = 0;
            let attempts = 0;
            
            while (placedMangroves < targetMangroves && attempts < 500) {
                attempts++;
                const x = Math.floor(featurePlacementNoise.random() * MAP_WIDTH_TILES);
                const y = Math.floor(featurePlacementNoise.random() * MAP_HEIGHT_TILES);
                const tile = tiles[y][x];
                
                // Look for suitable tiles - more lenient for bay/strait/peninsula
                const canConvert = (archetype === MapArchetype.BAY || archetype === MapArchetype.STRAITS || 
                                    archetype === MapArchetype.PENINSULA) ?
                    // Very lenient for water-heavy archetypes
                    (tile.isCoast || tile.biome === BiomeType.WETLANDS || tile.biome === BiomeType.RIVERBANK || 
                     tile.biome === BiomeType.SHALLOW_OCEAN) &&
                    (tile.biome === BiomeType.BEACH || tile.biome === BiomeType.WETLANDS || 
                     tile.biome === BiomeType.GRASSLAND || tile.biome === BiomeType.RIVERBANK || 
                     tile.biome === BiomeType.SCRUB || tile.biome === BiomeType.SHALLOW_OCEAN) &&
                    tile.altitude < ALTITUDE_LEVELS.BEACH + 0.06 :
                    // Standard conditions for other archetypes
                    tile.isCoast && (tile.biome === BiomeType.BEACH || tile.biome === BiomeType.WETLANDS || 
                                     tile.biome === BiomeType.GRASSLAND || tile.biome === BiomeType.RIVERBANK);
                
                if (canConvert) {
                    
                    // Check for water neighbor
                    let hasWater = false;
                    for (let dy = -1; dy <= 1; dy++) {
                        for (let dx = -1; dx <= 1; dx++) {
                            if (dx === 0 && dy === 0) continue;
                            const nx = x + dx;
                            const ny = y + dy;
                            if (nx >= 0 && nx < MAP_WIDTH_TILES && ny >= 0 && ny < MAP_HEIGHT_TILES) {
                                if (!tiles[ny][nx].isLand) {
                                    hasWater = true;
                                    break;
                                }
                            }
                        }
                        if (hasWater) break;
                    }
                    
                    if (hasWater) {
                        tile.biome = BiomeType.MANGROVE;
                        tile.isLand = true;
                        placedMangroves++;
                        console.log(`[Terrain] Fallback mangrove placed at (${x}, ${y})`);
                    }
                }
            }
            
            if (placedMangroves > 0) {
                console.log(`[Terrain] Fallback: Generated ${placedMangroves} mangroves for ${climate} ${archetype}`);
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
        // SHOALS should be 95% water with only small land outcrops
        // Land tiles should ONLY be wetlands, beach, cliff, or mangrove
        for (let y = 0; y < MAP_HEIGHT_TILES; y++) {
            for (let x = 0; x < MAP_WIDTH_TILES; x++) {
                const tile = tiles[y][x];

                if (tile.isLand) {
                    // Force all land to be very low altitude
                    tile.altitude = ALTITUDE_LEVELS.BEACH + featurePlacementNoise.random() * 0.01;
                    
                    // Determine biome based on random chance and climate
                    const biomeRoll = featurePlacementNoise.random();
                    
                    if (biomeRoll < 0.3) {
                        // 30% chance of cliff
                        tile.biome = BiomeType.CLIFF;
                        tile.altitude = ALTITUDE_LEVELS.BEACH + 0.02; // Slightly higher for cliffs
                    } else if (biomeRoll < 0.5) {
                        // 20% chance of beach
                        tile.biome = BiomeType.BEACH;
                    } else if (biomeRoll < 0.75 && (climate === ClimateType.TROPICAL || climate === ClimateType.SEMITROPICAL)) {
                        // 25% chance of mangrove in tropical climates
                        tile.biome = BiomeType.MANGROVE;
                    } else {
                        // Remaining becomes wetlands
                        tile.biome = BiomeType.WETLANDS;
                    }
                    
                    // Add salt flats in arid climates - more abundant
                    if (climate === ClimateType.ARID && featurePlacementNoise.random() < 0.25) {
                        tile.biome = BiomeType.SALT_FLATS;
                    }
                }
            }
        }
        return; // Shoals archetype handled completely here
    }
    
    if (archetype === MapArchetype.BARRIER_ISLAND) {
        // Barrier islands: mostly beach, wetlands, with some low hills
        for (let y = 0; y < MAP_HEIGHT_TILES; y++) {
            for (let x = 0; x < MAP_WIDTH_TILES; x++) {
                const tile = tiles[y][x];
                if (!tile.isLand) continue;
                
                const barrierNoise = featurePlacementNoise.noise(x * 0.15, y * 0.15);
                
                // Set low altitude for barrier islands
                tile.altitude = ALTITUDE_LEVELS.BEACH + barrierNoise * 0.02;
                
                // Determine biome based on climate and position
                if (tile.isCoast) {
                    // Coastal areas - beaches and wetlands
                    if (featurePlacementNoise.random() < 0.4) {
                        tile.biome = BiomeType.BEACH;
                    } else if (featurePlacementNoise.random() < 0.6) {
                        tile.biome = BiomeType.WETLANDS;
                        
                        // Convert to mangrove in tropical/semitropical
                        if (climate === ClimateType.TROPICAL || climate === ClimateType.SEMITROPICAL) {
                            if (featurePlacementNoise.random() < 0.7) {
                                tile.biome = BiomeType.MANGROVE;
                            }
                        }
                        // Convert to salt flats in arid - more abundant
                        else if (climate === ClimateType.ARID) {
                            if (featurePlacementNoise.random() < 0.7) {
                                tile.biome = BiomeType.SALT_FLATS;
                            }
                        }
                    }
                } else {
                    // Interior areas - low terrain
                    if (barrierNoise > 0.6 && featurePlacementNoise.random() < 0.3) {
                        // Occasional low hills
                        tile.biome = BiomeType.HILLS;
                        tile.altitude = ALTITUDE_LEVELS.HILLS_LOW + barrierNoise * 0.01;
                    } else if (barrierNoise < -0.2) {
                        // Some wetlands in interior
                        tile.biome = BiomeType.WETLANDS;
                    } else {
                        // Mostly grassland or scrub
                        if (climate === ClimateType.ARID || climate === ClimateType.SEMITROPICAL) {
                            tile.biome = BiomeType.SCRUB;
                        } else {
                            tile.biome = BiomeType.GRASSLAND;
                        }
                    }
                }
            }
        }
        return; // Barrier islands handled
    }
    
    // Bay archetype: enhanced wetlands and riverbank near water
    if (archetype === MapArchetype.BAY) {
        for (let y = 0; y < MAP_HEIGHT_TILES; y++) {
            for (let x = 0; x < MAP_WIDTH_TILES; x++) {
                const tile = tiles[y][x];
                
                // Check distance to water for bay-specific terrain
                if (tile.isLand && !tile.isCoast) {
                    let minDistToWater = 999;
                    
                    // Find nearest water tile
                    for (let dy = -5; dy <= 5; dy++) {
                        for (let dx = -5; dx <= 5; dx++) {
                            const ny = y + dy;
                            const nx = x + dx;
                            if (ny >= 0 && ny < MAP_HEIGHT_TILES && nx >= 0 && nx < MAP_WIDTH_TILES) {
                                if (!tiles[ny][nx].isLand) {
                                    const dist = Math.sqrt(dx * dx + dy * dy);
                                    minDistToWater = Math.min(minDistToWater, dist);
                                }
                            }
                        }
                    }
                    
                    // Convert near-water tiles to wetlands and riverbank
                    if (minDistToWater <= 3 && tile.altitude < ALTITUDE_LEVELS.HILLS_START) {
                        const wetlandNoise = featurePlacementNoise.noise(x * 0.15, y * 0.15);
                        
                        if (minDistToWater <= 1.5) {
                            // Very close to water - mostly riverbank
                            if (wetlandNoise > -0.3) {
                                tile.biome = BiomeType.RIVERBANK;
                                tile.altitude = Math.max(ALTITUDE_LEVELS.BEACH + 0.01, tile.altitude * 0.8);
                            } else if (wetlandNoise > -0.6) {
                                tile.biome = BiomeType.WETLANDS;
                                tile.altitude = Math.max(ALTITUDE_LEVELS.BEACH + 0.005, tile.altitude * 0.7);
                            }
                        } else if (minDistToWater <= 2.5) {
                            // Medium distance - mix of wetlands and riverbank
                            if (wetlandNoise > 0.2) {
                                tile.biome = BiomeType.WETLANDS;
                                tile.altitude = Math.max(ALTITUDE_LEVELS.BEACH + 0.01, tile.altitude * 0.85);
                            } else if (wetlandNoise > -0.2) {
                                tile.biome = BiomeType.RIVERBANK;
                                tile.altitude = Math.max(ALTITUDE_LEVELS.BEACH + 0.015, tile.altitude * 0.9);
                            }
                        } else if (minDistToWater <= 3) {
                            // Further out - occasional wetlands
                            if (wetlandNoise > 0.4) {
                                tile.biome = BiomeType.WETLANDS;
                            } else if (wetlandNoise > 0.2 && tile.biome === BiomeType.GRASSLAND) {
                                tile.biome = BiomeType.RIVERBANK;
                            }
                        }
                    }
                }
                
                // Reduce beach and scrub near water
                if (tile.isCoast) {
                    if (tile.biome === BiomeType.BEACH) {
                        // Convert most beaches to riverbank or wetlands
                        if (featurePlacementNoise.random() < 0.7) {
                            if (featurePlacementNoise.random() < 0.6) {
                                tile.biome = BiomeType.RIVERBANK;
                            } else {
                                tile.biome = BiomeType.WETLANDS;
                            }
                        }
                    } else if (tile.biome === BiomeType.SCRUB) {
                        // Convert scrub to grassland or riverbank near water
                        if (featurePlacementNoise.random() < 0.8) {
                            tile.biome = featurePlacementNoise.random() < 0.5 ? BiomeType.RIVERBANK : BiomeType.GRASSLAND;
                        }
                    }
                }
            }
        }
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
        if (featurePlacementNoise.random() < 0.01) { // Very low chance
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
                // Much more abundant salt flats generation in arid climates
                if (tile.isLand && (tile.biome === BiomeType.DESERT || tile.biome === BiomeType.SCRUB || tile.biome === BiomeType.GRASSLAND) 
                    && humidVal > SALT_FLATS_HUMIDITY_THRESHOLD * 0.4) { // Much lower threshold for arid
                    let minAlt = tile.altitude, maxAlt = tile.altitude;
                    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
                        const nx = x + dx; const ny = y + dy;
                        if (nx >=0 && nx < MAP_WIDTH_TILES && ny >=0 && ny < MAP_HEIGHT_TILES) {
                            minAlt = Math.min(minAlt, tiles[ny][nx].altitude); maxAlt = Math.max(maxAlt, tiles[ny][nx].altitude);
                        }
                    }
                    // Much more likely to form salt flats in flat areas in arid
                    if ((maxAlt - minAlt) < SALT_FLATS_ALTITUDE_VARIANCE_MAX * 2 && featurePlacementNoise.random() < 0.9) { // 90% chance in flat areas
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
            if ((nearVolcano || nearMountain) && thermalVal > 0.65 && featurePlacementNoise.random() < 0.02) { // Reduced from 0.05 to 0.02
                tile.biome = BiomeType.HOT_SPRINGS;
                tile.isLand = true; // Changed to land tile
                tile.altitude = Math.max(ALTITUDE_LEVELS.GRASSLAND_LOWER_MIN, tile.altitude * 0.8);
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
        // console.log("[Climate Stitching] No local area name provided, skipping climate transitions");
        return;
    }

    // console.log(`[Climate Stitching] Applying climate transitions for ${localAreaName} (${currentClimate}`);
    
    // Get neighboring climate information
    const neighboringClimates = getNeighboringClimateInfo(localAreaName, currentClimate);
    
    // Check if any climate transitions are needed
    const hasClimateTransitions = Object.values(neighboringClimates).some(
        climate => climate && climate !== currentClimate
    );
    
    if (!hasClimateTransitions) {
        // console.log("[Climate Stitching] No climate transitions detected");
        return;
    }

    // console.log("[Climate Stitching] Neighboring climates:", neighboringClimates);

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
            // console.log(`[Climate Stitching] Tile (${processedTile.x}, ${processedTile.y}): ${originalTile.biome} → ${processedTile.biome}`);
            originalTile.biome = processedTile.biome;
        }
    });

    // console.log("[Climate Stitching] Climate transitions applied successfully");
    
    // Ensure edge continuity for land/water transitions
    ensureEdgeContinuity(tiles, localAreaName);
}

/**
 * Ensures that land/water tiles at map edges match up with neighboring maps
 * to prevent discontinuities when crossing map boundaries
 */
function ensureEdgeContinuity(tiles: Tile[][], localAreaName: string): void {
    // console.log("[Edge Continuity] Ensuring land/water continuity at map borders");
    
    // Get saved edge data from neighboring maps if they exist
    const edgeData = getNeighboringEdgeData(localAreaName);
    
    // North edge - ensure it matches the south edge of the map to the north
    if (edgeData.north) {
        for (let x = 0; x < MAP_WIDTH_TILES; x++) {
            const neighborIsLand = edgeData.north[x];
            const currentTile = tiles[0][x];
            
            if (neighborIsLand !== currentTile.isLand) {
                console.log(`[Edge Continuity] Fixing north edge at x=${x}: neighbor is ${neighborIsLand ? 'land' : 'water'}, current is ${currentTile.isLand ? 'land' : 'water'}`);
                
                if (neighborIsLand) {
                    // Convert to land - use a basic land biome appropriate for the climate
                    currentTile.isLand = true;
                    currentTile.biome = BiomeType.GRASSLAND;
                    currentTile.altitude = 10; // Just above sea level
                } else {
                    // Convert to water
                    currentTile.isLand = false;
                    currentTile.biome = BiomeType.OCEAN;
                    currentTile.altitude = -10;
                }
            }
        }
    }
    
    // South edge - save for future maps and fix if needed
    if (edgeData.south) {
        for (let x = 0; x < MAP_WIDTH_TILES; x++) {
            const neighborIsLand = edgeData.south[x];
            const currentTile = tiles[MAP_HEIGHT_TILES - 1][x];
            
            if (neighborIsLand !== currentTile.isLand) {
                console.log(`[Edge Continuity] Fixing south edge at x=${x}`);
                
                if (neighborIsLand) {
                    currentTile.isLand = true;
                    currentTile.biome = BiomeType.GRASSLAND;
                    currentTile.altitude = 10;
                } else {
                    currentTile.isLand = false;
                    currentTile.biome = BiomeType.OCEAN;
                    currentTile.altitude = -10;
                }
            }
        }
    }
    
    // East edge
    if (edgeData.east) {
        for (let y = 0; y < MAP_HEIGHT_TILES; y++) {
            const neighborIsLand = edgeData.east[y];
            const currentTile = tiles[y][MAP_WIDTH_TILES - 1];
            
            if (neighborIsLand !== currentTile.isLand) {
                console.log(`[Edge Continuity] Fixing east edge at y=${y}`);
                
                if (neighborIsLand) {
                    currentTile.isLand = true;
                    currentTile.biome = BiomeType.GRASSLAND;
                    currentTile.altitude = 10;
                } else {
                    currentTile.isLand = false;
                    currentTile.biome = BiomeType.OCEAN;
                    currentTile.altitude = -10;
                }
            }
        }
    }
    
    // West edge
    if (edgeData.west) {
        for (let y = 0; y < MAP_HEIGHT_TILES; y++) {
            const neighborIsLand = edgeData.west[y];
            const currentTile = tiles[y][0];
            
            if (neighborIsLand !== currentTile.isLand) {
                console.log(`[Edge Continuity] Fixing west edge at y=${y}`);
                
                if (neighborIsLand) {
                    currentTile.isLand = true;
                    currentTile.biome = BiomeType.GRASSLAND;
                    currentTile.altitude = 10;
                } else {
                    currentTile.isLand = false;
                    currentTile.biome = BiomeType.OCEAN;
                    currentTile.altitude = -10;
                }
            }
        }
    }
    
    // Save current map's edges for future neighboring maps
    saveMapEdgeData(tiles, localAreaName);
    
    // console.log("[Edge Continuity] Edge continuity ensured");
}

/**
 * Gets edge data from neighboring maps that have already been generated
 */
function getNeighboringEdgeData(localAreaName: string): {
    north?: boolean[],
    south?: boolean[],
    east?: boolean[],
    west?: boolean[]
} {
    // This would ideally load from a cache or storage
    // For now, we'll use a simple in-memory approach
    const edgeCache = (globalThis as any).__mapEdgeCache || {};
    
    // Get neighboring area names based on geography
    const neighbors = getNeighboringAreaNames(localAreaName);
    
    return {
        north: edgeCache[neighbors.north]?.south,
        south: edgeCache[neighbors.south]?.north,
        east: edgeCache[neighbors.east]?.west,
        west: edgeCache[neighbors.west]?.east
    };
}

/**
 * Saves the current map's edge data for future neighboring maps
 */
function saveMapEdgeData(tiles: Tile[][], localAreaName: string): void {
    const edgeCache = (globalThis as any).__mapEdgeCache || {};
    
    const edgeData = {
        north: Array.from({ length: MAP_WIDTH_TILES }, (_, x) => tiles[0][x].isLand),
        south: Array.from({ length: MAP_WIDTH_TILES }, (_, x) => tiles[MAP_HEIGHT_TILES - 1][x].isLand),
        east: Array.from({ length: MAP_HEIGHT_TILES }, (_, y) => tiles[y][MAP_WIDTH_TILES - 1].isLand),
        west: Array.from({ length: MAP_HEIGHT_TILES }, (_, y) => tiles[y][0].isLand)
    };
    
    edgeCache[localAreaName] = edgeData;
    (globalThis as any).__mapEdgeCache = edgeCache;
}

/**
 * Gets the names of neighboring areas based on geography
 */
function getNeighboringAreaNames(localAreaName: string): {
    north?: string,
    south?: string,
    east?: string,
    west?: string
} {
    const adjacencies = ADJACENCIES[localAreaName];
    if (!adjacencies) {
        return {};
    }
    
    return {
        north: adjacencies.N && !adjacencies.N.startsWith('LIMINAL_') ? adjacencies.N : undefined,
        south: adjacencies.S && !adjacencies.S.startsWith('LIMINAL_') ? adjacencies.S : undefined,
        east: adjacencies.E && !adjacencies.E.startsWith('LIMINAL_') ? adjacencies.E : undefined,
        west: adjacencies.W && !adjacencies.W.startsWith('LIMINAL_') ? adjacencies.W : undefined
    };
}
/**
 * generation/standardMap/standardMapGenerator.ts - Main procedural map generation orchestrator for Standard Maps
 */
import { ValueNoise } from '../../utils/noise';
import { MapData, MapArchetype, ClimateType, Tile, BiomeType, Point, NeighboringEdges, EdgeDataSet, EdgeTileInfo, AltitudeSetting, CulturalZone, HistoricalEra, MapGenerationParams, SocietalProfile } from '../../types/index';
import { 
    MAP_WIDTH_TILES, MAP_HEIGHT_TILES, RIVER_PORT_WATER_CORRIDOR_RATIO, 
    LAND_THRESHOLD_BASE, NOISE_SCALE_LANDMASS, NOISE_SCALE_TEMPERATURE, 
    ATOLL_LAGOON_RADIUS_RATIO, ATOLL_REEF_RING_INNER_RADIUS_RATIO, ATOLL_REEF_RING_OUTER_RADIUS_RATIO,
    PENINSULA_LAND_RATIO, BAY_WATER_RATIO, BAY_OPENING_WIDTH_FACTOR, FRESHWATER_LAKE_RADIUS_RATIO,
    SHOALS_ARCHETYPE_LAND_PATCH_CHANCE, SHOALS_ARCHETYPE_SHOAL_TILE_DENSITY, OPEN_OCEAN_LAND_FALLOFF,
    NOISE_SCALE_THERMAL, ALTITUDE_LEVELS, FACTION_DATA, GEOGRAPHICAL_DATA, SOCIETAL_PROFILES
} from '../../constants/index';

import { 
  generateAltitudeAndInitialBiomes, 
  applyClimateBiomeChanges, 
  generateDenseForests, 
  generateRiverbanks, 
  updateCoastlinesAndShallowOceans,
  generateVolcanicComplex, 
  generateClimateEnhancedBiomes, 
  generateSpecialTerrainTiles,
  generateEstuaries,
  applyClimateTransitions
} from './terrainAndBiomeGenerator'; 

import { 
  generateEnhancedRiverPath,
  findRiverSources,
  findEdgeRiverSource,
  findRiverContinuationPoints,
  generateHarbor,
  generateWetlands,
  generateOases,
  generateReefs,
  generateUrbanAreas,
  generateFarmland,
  generateRuins,
  generateRoadAndPathNetwork,
  generatePalaces,
  generateHolyPlaces,
  generateAnimalPaddocks,
  generateAnimalsForMap,
  generateNpcsForStandardMap,
  generateVegetation,
  generateStreams,
  generateTerrainStructures,
  generateMineralDeposits,
} from './features';
import { generateBridges, addBridgesToMap } from './features/BridgeGenerator'; 

import { calculateTileQualities } from './qualities/tileQualityCalculator'; 
import { generateCityInfo } from '../../services/cityNameGenerator';
import { generateMarketplaceNames } from '../../services/marketplaceNameGenerator';
import { parseDateString } from '../../utils/dateUtils';
import { mapLocationToCulture } from '../../utils/mapUtils';


const EDGE_INFLUENCE_DISTANCE = 4; // How many tiles inward the blending influence extends
const EDGE_BIAS_STRENGTH = 0.4;   // How strongly a neighbor pulls the land threshold during blending


/**
 * Main procedural map generation function
 * Orchestrates the entire generation process from basic terrain to complex tile qualities
 */
export function proceduralGenerateMap(
  seed: number, 
  archetype: MapArchetype, 
  climate: ClimateType,
  generateHarborFlag: boolean,
  generateLargeCityFlag: boolean,
  altitudeSetting: AltitudeSetting,
  forceVolcanic: boolean,
  continent?: string,
  region?: string,
  localArea?: string,
  timeSlice?: string,
  generationParams?: MapGenerationParams, // NEW
  neighboringEdges?: NeighboringEdges,
  hasLakes?: boolean,
  riverDirection?: 'east-west' | 'north-south',
  bayOutlet?: 'north' | 'south' | 'east' | 'west',
  deltaOutlet?: 'north' | 'south' | 'east' | 'west'
): MapData {
  console.log(`[Gen] Starting map generation - Seed: ${seed}, Archetype: ${archetype}, Climate: ${climate}`);
  
  const landNoise = new ValueNoise(seed);
  const altitudeNoiseGen = new ValueNoise(seed + 1); 
  const biomeVariationNoise = new ValueNoise(seed + 2);
  const featurePlacementNoise = new ValueNoise(seed + 3);
  const humidityNoise = new ValueNoise(seed + 4); 
  const desertificationNoise = new ValueNoise(seed + 5); 
  const harborNoise = new ValueNoise(seed + 6);
  const qualitiesNoise = new ValueNoise(seed + 7);
  const microVariationNoise = new ValueNoise(seed + 8);
  const riverMeanderNoise = new ValueNoise(seed + 9);
  const riverWidthNoise = new ValueNoise(seed + 10);
  const temperatureNoise = new ValueNoise(seed + 11); 
  const thermalNoise = new ValueNoise(seed + 12);     
  const atollIrregularityNoise = new ValueNoise(seed + 13);
  const bayShapeNoise = new ValueNoise(seed + 14);
  const roadPathNoise = new ValueNoise(seed + 15); 
  const lakeShapeNoise = new ValueNoise(seed + 16); // For irregular lake shapes
  const lakeRandomnessNoise = new ValueNoise(seed + 17); // For other lake variations
  const animalNoise = new ValueNoise(seed + 18); // For animal spawning
  const npcNoise = new ValueNoise(seed + 19); // For NPC spawning
  const vegetationNoise = new ValueNoise(seed + 20); // For vegetation spawning

  const dateInfo = parseDateString(timeSlice || '1650');
  console.log(`[Gen] Date info: year=${dateInfo.year}, era=${dateInfo.era}, timeSlice="${timeSlice}"`);
  const culturalZone = mapLocationToCulture(continent || 'Europe', dateInfo.year);
  const regionName = region || Object.keys(GEOGRAPHICAL_DATA[culturalZone as CulturalZone] || {})[0] || 'DefaultRegion';
  const factionData = FACTION_DATA[culturalZone as CulturalZone]?.[regionName]?.[dateInfo.era as HistoricalEra];
  const dominantPower = factionData?.dominantPower || "Local Tribes";

  // NEW: Select Societal Profile
  let societalProfile = SOCIETAL_PROFILES[culturalZone]?.[dateInfo.era as HistoricalEra] || SOCIETAL_PROFILES.DEFAULT;
  // Apply user overrides
  if (generationParams?.isAgricultural !== undefined) {
    societalProfile = { ...societalProfile, isAgricultural: generationParams.isAgricultural };
  }
  if (generationParams?.isPastoral !== undefined) {
    societalProfile = { ...societalProfile, isPastoral: generationParams.isPastoral };
  }

  const tiles: Tile[][] = Array(MAP_HEIGHT_TILES).fill(null).map(() => Array(MAP_WIDTH_TILES).fill(null));

  let oceanEdgeForDelta: number | undefined = undefined;
  if (archetype === MapArchetype.DELTA) {
    if (deltaOutlet) {
      // Use deltaOutlet property if specified (0=south, 1=north, 2=east, 3=west)
      oceanEdgeForDelta = deltaOutlet === 'south' ? 0 : deltaOutlet === 'north' ? 1 : deltaOutlet === 'east' ? 2 : 3;
    } else {
      // Fall back to seed-based random selection
      oceanEdgeForDelta = seed % 4;
    }
  }
  let determinedHarborSide: number | undefined = undefined;
  if (archetype === MapArchetype.ALL_LAND || archetype === MapArchetype.PENINSULA || archetype === MapArchetype.BAY) {
    determinedHarborSide = Math.floor(featurePlacementNoise.random() * 4);
  }

  console.log("[Gen] Phase 1: Basic landmass generation - START");
  const mapShortSide = Math.min(MAP_WIDTH_TILES, MAP_HEIGHT_TILES);

  // Economic Activity Level check: If 0, generate a map with no people/structures
  if (generationParams?.economicActivityLevel === 0) {
      console.log("[Gen] Economic Activity Level is None. Generating an uninhabited world.");
      // Simplified generation for uninhabited world...
  }


  for (let y = 0; y < MAP_HEIGHT_TILES; y++) {
    for (let x = 0; x < MAP_WIDTH_TILES; x++) {
      // Add rotation to noise sampling to break up directional patterns
      const rotationAngle = (x * 0.13 + y * 0.17) * Math.PI;
      const cosAngle = Math.cos(rotationAngle);
      const sinAngle = Math.sin(rotationAngle);
      const rotatedX = x * cosAngle - y * sinAngle;
      const rotatedY = x * sinAngle + y * cosAngle;
      
      // Sample noise with rotated coordinates to prevent aligned island patterns
      let noiseVal = landNoise.octaveNoise(rotatedX * NOISE_SCALE_LANDMASS, rotatedY * NOISE_SCALE_LANDMASS, 4, 0.5, 2.0);
      
      // Add a second layer with different frequency to further break patterns
      const noiseVal2 = landNoise.octaveNoise(x * NOISE_SCALE_LANDMASS * 1.3, y * NOISE_SCALE_LANDMASS * 1.3, 2, 0.4, 2.2);
      noiseVal = noiseVal * 0.7 + noiseVal2 * 0.3;
      
      let falloff = 1.0;
      let landThreshold = LAND_THRESHOLD_BASE;
      const dX_center = x / MAP_WIDTH_TILES - 0.5;
      const dY_center = y / MAP_HEIGHT_TILES - 0.5;
      const distToCenterRatio = Math.sqrt(dX_center * dX_center + dY_center * dY_center) * 2;

      switch (archetype) {
        case MapArchetype.ISLAND:
          // Make islands larger like the example in the screenshot
          // Use a softer falloff and allow for more irregular shapes
          const islandNoiseScale = 0.05;
          // Apply same rotation to island shape noise for consistency
          const islandShapeNoise = landNoise.octaveNoise(
            rotatedX * islandNoiseScale, 
            rotatedY * islandNoiseScale, 
            3, 0.5, 2.0
          );
          // Make the island extend more toward edges with noise variation
          falloff = Math.max(0, 1 - distToCenterRatio * 0.6 + islandShapeNoise * 0.3);
          landThreshold = LAND_THRESHOLD_BASE - 0.25; // Lower threshold for more land
          break;
        case MapArchetype.ATOLL:
            const atollCenterX = MAP_WIDTH_TILES / 2;
            const atollCenterY = MAP_HEIGHT_TILES / 2;
            const distPxToAtollCenter = Math.hypot(x - atollCenterX, y - atollCenterY);

            const baseLagoonRadius = mapShortSide * ATOLL_LAGOON_RADIUS_RATIO * 1.3; 
            const baseRingInnerRadius = baseLagoonRadius + mapShortSide * 0.02; 
            const baseRingOuterRadius = baseRingInnerRadius + mapShortSide * (0.08 + atollIrregularityNoise.random() * 0.07); 

            const angle = Math.atan2(y - atollCenterY, x - atollCenterX);
            const irregularityFactor = 0.8 + atollIrregularityNoise.noise(Math.cos(angle) * 5, Math.sin(angle) * 5) * 0.4; 
            const irregularRingInner = baseRingInnerRadius * irregularityFactor;
            const irregularRingOuter = baseRingOuterRadius * irregularityFactor * (0.9 + atollIrregularityNoise.random() * 0.2); 

            const oceanBorderMinDistance = 4; 
            const isNearMapEdge = x < oceanBorderMinDistance || x >= MAP_WIDTH_TILES - oceanBorderMinDistance ||
                                  y < oceanBorderMinDistance || y >= MAP_HEIGHT_TILES - oceanBorderMinDistance;

            if (isNearMapEdge) {
                falloff = 0; landThreshold = 1.0; 
            } else if (distPxToAtollCenter < irregularRingInner * 0.9) { 
                falloff = 0.05; landThreshold = 0.95; 
            } else if (distPxToAtollCenter >= irregularRingInner && distPxToAtollCenter <= irregularRingOuter) { 
                falloff = 0.5 + atollIrregularityNoise.noise(x * 0.2, y * 0.2) * 0.5; 
                landThreshold = LAND_THRESHOLD_BASE - 0.30; 
            } else { 
                falloff = 0.05; landThreshold = 0.9;
            }
            break;
        case MapArchetype.PENINSULA:
            let landExtent = 0;
            const peninsulaAxis = determinedHarborSide !== undefined ? (determinedHarborSide % 2) : 0; 
            
            if (peninsulaAxis === 0) { 
                landExtent = (determinedHarborSide === 0 || determinedHarborSide === undefined) ? (x / MAP_WIDTH_TILES) : ((MAP_WIDTH_TILES - x) / MAP_WIDTH_TILES);
            } else { 
                landExtent = (determinedHarborSide === 2) ? (y / MAP_HEIGHT_TILES) : ((MAP_HEIGHT_TILES - y) / MAP_HEIGHT_TILES);
            }
            falloff = Math.pow(Math.max(0, 1 - landExtent / PENINSULA_LAND_RATIO), 0.5);
            falloff = 1 - falloff; 
            landThreshold = LAND_THRESHOLD_BASE - 0.1;
            break;
        case MapArchetype.BAY:
            const bayCenterX_bay = MAP_WIDTH_TILES / 2;
            const bayCenterY_bay = MAP_HEIGHT_TILES / 2;
            const bayWaterCoreRadiusBase = mapShortSide * BAY_WATER_RATIO * 0.45;
            
            const bayAngle = Math.atan2(y - bayCenterY_bay, x - bayCenterX_bay);
            const bayRadiusIrregularity = 0.7 + bayShapeNoise.noise(Math.cos(bayAngle) * 3, Math.sin(bayAngle) * 3) * 0.6;
            const bayWaterCoreRadius = bayWaterCoreRadiusBase * bayRadiusIrregularity;

            const bayDistPxToCenter = Math.hypot(x - bayCenterX_bay, y - bayCenterY_bay);
            const openingWidth = mapShortSide * BAY_OPENING_WIDTH_FACTOR * (1.0 + bayShapeNoise.random() * 0.5); 

            let inOpening = false;
            let openingEdge_bay: number;
            if (bayOutlet) {
                // Use bayOutlet property if specified
                openingEdge_bay = bayOutlet === 'west' ? 0 : bayOutlet === 'east' ? 1 : bayOutlet === 'north' ? 2 : 3;
            } else if (determinedHarborSide !== undefined) {
                openingEdge_bay = determinedHarborSide;
            } else {
                openingEdge_bay = Math.floor(bayShapeNoise.random() * 4);
            }

            if (openingEdge_bay === 0 && x < MAP_WIDTH_TILES * 0.15 && Math.abs(y - bayCenterY_bay) < openingWidth / 1.5) inOpening = true;
            else if (openingEdge_bay === 1 && x > MAP_WIDTH_TILES * 0.85 && Math.abs(y - bayCenterY_bay) < openingWidth / 1.5) inOpening = true;
            else if (openingEdge_bay === 2 && y < MAP_HEIGHT_TILES * 0.15 && Math.abs(x - bayCenterX_bay) < openingWidth / 1.5) inOpening = true;
            else if (openingEdge_bay === 3 && y > MAP_HEIGHT_TILES * 0.85 && Math.abs(x - bayCenterX_bay) < openingWidth / 1.5) inOpening = true;
            
            if (inOpening || bayDistPxToCenter < bayWaterCoreRadius) {
                falloff = 0; landThreshold = 1.0; 
                noiseVal = 0; 
            } else {
                const distFromBayEdge = bayDistPxToCenter - bayWaterCoreRadius;
                falloff = Math.min(1, 0.6 + distFromBayEdge / (mapShortSide * 0.3)); 
                landThreshold = LAND_THRESHOLD_BASE - 0.25;
            }
            break;
        case MapArchetype.FRESHWATER_LAKE:
            // Use ALL_LAND approach but guarantee water in center
            // First, determine if this should be water based on distance from center
            const lakeRadius = Math.min(MAP_WIDTH_TILES, MAP_HEIGHT_TILES) * 0.2; // 20% of map size
            const distToCenter = Math.hypot(x - MAP_WIDTH_TILES/2, y - MAP_HEIGHT_TILES/2);
            
            // Create irregular lake shape using noise with rotation
            const lakeNoiseScale = 0.04;
            const lakeShapeVariation = lakeShapeNoise.octaveNoise(
                rotatedX * lakeNoiseScale,
                rotatedY * lakeNoiseScale,
                3, 0.5, 2.0
            );
            
            // Calculate effective lake radius with noise variation
            const effectiveLakeRadius = lakeRadius * (1 + lakeShapeVariation * 0.4);
            
            if (distToCenter < effectiveLakeRadius) {
                // This is definitely lake water
                const depthFactor = Math.max(0, 1 - (distToCenter / effectiveLakeRadius));
                tiles[y][x] = {
                    x, y, altitude: ALTITUDE_LEVELS.SEA * (0.1 + depthFactor * 0.2), 
                    biome: BiomeType.FRESHWATER_LAKE, isLand: false, isCoast: false,
                    qualities: { flammability: 0, biodiversity: 0, healthiness: 0, sacrality: 0, safety: 0 },
                };
                continue;
            } else {
                // This is land - use ALL_LAND style generation
                landThreshold = LAND_THRESHOLD_BASE - 0.3; // Strongly favor land
                falloff = 1.0; // No edge falloff
            }
            break;
        case MapArchetype.DELTA: {
            const oceanEdge = oceanEdgeForDelta !== undefined ? oceanEdgeForDelta : 0;
            let falloffFactor = 1.0;
            const falloffStartRatio = 0.6; // Start becoming water in the last 40% of the map

            switch (oceanEdge) {
                case 0: // South is ocean
                    if (y > MAP_HEIGHT_TILES * falloffStartRatio) {
                        falloffFactor = 1 - ((y - MAP_HEIGHT_TILES * falloffStartRatio) / (MAP_HEIGHT_TILES * (1 - falloffStartRatio)));
                    }
                    break;
                case 1: // North is ocean
                    if (y < MAP_HEIGHT_TILES * (1 - falloffStartRatio)) {
                        falloffFactor = y / (MAP_HEIGHT_TILES * (1 - falloffStartRatio));
                    }
                    break;
                case 2: // East is ocean
                     if (x > MAP_WIDTH_TILES * falloffStartRatio) {
                        falloffFactor = 1 - ((x - MAP_WIDTH_TILES * falloffStartRatio) / (MAP_WIDTH_TILES * (1 - falloffStartRatio)));
                    }
                    break;
                case 3: // West is ocean
                    if (x < MAP_WIDTH_TILES * (1 - falloffStartRatio)) {
                        falloffFactor = x / (MAP_WIDTH_TILES * (1 - falloffStartRatio));
                    }
                    break;
            }
            
            // Make it very likely to be land, but fall off to water at the ocean edge
            landThreshold = LAND_THRESHOLD_BASE - 0.2; // High chance of land
            falloff = Math.pow(falloffFactor, 1.5); // Power makes the falloff sharper at the edge
            break;
        }
        case MapArchetype.SHOALS:
            // Creates mostly water (95%) with small scattered land outcrops (5%)
            // Land should only be wetlands, beach, cliff, or mangrove
            noiseVal = landNoise.octaveNoise(x * NOISE_SCALE_LANDMASS * 3.0, y * NOISE_SCALE_LANDMASS * 3.0, 5, 0.45, 2.1);
            // Much higher threshold to ensure only 5% land
            landThreshold = LAND_THRESHOLD_BASE + 0.45; // Only the highest noise values become land
            falloff = 1.0;
            break;
        case MapArchetype.OPEN_OCEAN:
            landThreshold = LAND_THRESHOLD_BASE + 0.45; 
            falloff = OPEN_OCEAN_LAND_FALLOFF * 0.1; 
            break;
        case MapArchetype.ALL_LAND:
            landThreshold = LAND_THRESHOLD_BASE - 0.3; // Strongly favor land
            falloff = 1.0; // Ensure it's always land, no falloff at edges
            break;
        case MapArchetype.BARRIER_ISLAND: {
            // Long thin coastal islands - 2-3 islands oriented north-south or east-west
            const isNorthSouth = (seed % 2 === 0);
            const numIslands = 2 + Math.floor(featurePlacementNoise.random() * 2); // 2-3 islands
            const islandWidth = (isNorthSouth ? MAP_WIDTH_TILES : MAP_HEIGHT_TILES) * 0.08; // Very thin
            const spacing = (isNorthSouth ? MAP_WIDTH_TILES : MAP_HEIGHT_TILES) / (numIslands + 1);
            
            // Default to water
            falloff = 0;
            landThreshold = 1.0;
            
            // Create the islands
            for (let i = 1; i <= numIslands; i++) {
                const islandCenter = spacing * i;
                const distFromCenter = isNorthSouth ? 
                    Math.abs(x - islandCenter) : 
                    Math.abs(y - islandCenter);
                
                if (distFromCenter < islandWidth / 2) {
                    // Create island with some variation
                    const lengthVar = microVariationNoise.noise(x * 0.1, y * 0.1) * 0.3;
                    const edgeDist = isNorthSouth ? 
                        Math.min(y, MAP_HEIGHT_TILES - 1 - y) / MAP_HEIGHT_TILES : 
                        Math.min(x, MAP_WIDTH_TILES - 1 - x) / MAP_WIDTH_TILES;
                    
                    // Taper islands at ends
                    if (edgeDist > 0.1 + lengthVar) {
                        falloff = 1.0;
                        landThreshold = LAND_THRESHOLD_BASE - 0.3;
                    }
                }
            }
            break;
        }
        case MapArchetype.STRAITS: {
            // Determine strait direction - north-south or east-west
            const straitAxis = (seed % 2 === 0) ? 'vertical' : 'horizontal';
            
            // Create two large landmasses on opposite sides with a navigable channel between
            if (straitAxis === 'vertical') {
                // Vertical strait - landmasses on left and right
                const straitCenterX = MAP_WIDTH_TILES * (0.45 + featurePlacementNoise.random() * 0.1);
                const straitWidth = MAP_WIDTH_TILES * (0.12 + featurePlacementNoise.random() * 0.08); // 12-20% width
                
                // Add some meandering to the strait using noise
                const meander = altitudeNoiseGen.noise(x * 0.05, y * 0.03) * 8;
                const adjustedCenterX = straitCenterX + meander;
                const distFromCenter = Math.abs(x - adjustedCenterX);
                
                // Create the main channel
                if (distFromCenter < straitWidth / 2) {
                    // Water channel with varying width
                    const widthVariation = 1 + altitudeNoiseGen.noise(x * 0.1, y * 0.05) * 0.3;
                    if (distFromCenter < (straitWidth * widthVariation) / 2) {
                        falloff = 0.1; // Deep water
                        landThreshold = 0.9;
                    }
                } else {
                    // Solid landmasses on either side
                    falloff = 1.0;
                    landThreshold = LAND_THRESHOLD_BASE - 0.4;
                }
                
                // Add small islands in the strait (10% chance per tile in strait)
                if (distFromCenter < straitWidth / 2 && featurePlacementNoise.random() < 0.02) {
                    falloff = 0.8;
                    landThreshold = 0.3;
                }
            } else {
                // Horizontal strait - landmasses on top and bottom
                const straitCenterY = MAP_HEIGHT_TILES * (0.45 + featurePlacementNoise.random() * 0.1);
                const straitWidth = MAP_HEIGHT_TILES * (0.12 + featurePlacementNoise.random() * 0.08);
                
                // Add meandering
                const meander = altitudeNoiseGen.noise(x * 0.03, y * 0.05) * 8;
                const adjustedCenterY = straitCenterY + meander;
                const distFromCenter = Math.abs(y - adjustedCenterY);
                
                // Create the main channel
                if (distFromCenter < straitWidth / 2) {
                    // Water channel with varying width
                    const widthVariation = 1 + altitudeNoiseGen.noise(x * 0.05, y * 0.1) * 0.3;
                    if (distFromCenter < (straitWidth * widthVariation) / 2) {
                        falloff = 0.1; // Deep water
                        landThreshold = 0.9;
                    }
                } else {
                    // Solid landmasses on either side
                    falloff = 1.0;
                    landThreshold = LAND_THRESHOLD_BASE - 0.4;
                }
                
                // Add small islands (2% chance)
                if (distFromCenter < straitWidth / 2 && featurePlacementNoise.random() < 0.02) {
                    falloff = 0.8;
                    landThreshold = 0.3;
                }
            }
            
            // Add a secondary narrower channel (30% chance)
            if (featurePlacementNoise.random() < 0.3) {
                const secondaryOffset = (straitAxis === 'vertical' ? MAP_WIDTH_TILES : MAP_HEIGHT_TILES) * 0.25;
                const secondaryCenter = (straitAxis === 'vertical' ? MAP_WIDTH_TILES : MAP_HEIGHT_TILES) / 2 + 
                                       (featurePlacementNoise.random() > 0.5 ? secondaryOffset : -secondaryOffset);
                const secondaryWidth = (straitAxis === 'vertical' ? MAP_WIDTH_TILES : MAP_HEIGHT_TILES) * 0.05;
                
                const distFromSecondary = straitAxis === 'vertical' ? 
                    Math.abs(x - secondaryCenter) : 
                    Math.abs(y - secondaryCenter);
                    
                if (distFromSecondary < secondaryWidth / 2) {
                    falloff = Math.min(falloff, 0.2);
                    landThreshold = Math.max(landThreshold, 0.8);
                }
            }
            break;
        }
        case MapArchetype.RIVER_PORT:
          // For river port, we want a clean continuous river channel
          // The river will be added later as MAJOR_RIVER tiles
          // For now, just ensure everything is land except the edges
          noiseVal = 1.0; 
          falloff = 1.0;
          landThreshold = -0.5; // Ensure everything is land initially
          break;
        case MapArchetype.SWAMP:
          // Swamps are all land with many rivers and small lakes
          falloff = 1.0; // No distance-based falloff
          landThreshold = -0.5; // Very low threshold ensures almost everything is land
          // Rivers and lakes will be added in a separate pass
          break;
        case MapArchetype.DESERT:
          // Desert archetype - all land, no water features except rare oases
          falloff = 1.0; // No distance-based falloff
          landThreshold = -1.0; // Everything is land
          break;
        default:
          // Fallback to a standard island-like generation
          falloff = Math.max(0, 1 - distToCenterRatio * 1.0);
          landThreshold = LAND_THRESHOLD_BASE - 0.15;
          break;
      }

      const effectiveNoise = noiseVal * falloff;
      let isLand = effectiveNoise > landThreshold; 

      let modifiedLandThreshold = landThreshold;
      let directlySetByNeighbor = false;

      if (x === 0 && neighboringEdges?.west && neighboringEdges.west[y]) {
          isLand = neighboringEdges.west[y].isLand;
          directlySetByNeighbor = true;
      } else if (x === MAP_WIDTH_TILES - 1 && neighboringEdges?.east && neighboringEdges.east[y]) {
          isLand = neighboringEdges.east[y].isLand;
          directlySetByNeighbor = true;
      }
      
      if (y === 0 && neighboringEdges?.north && neighboringEdges.north[x]) {
          isLand = neighboringEdges.north[x].isLand;
          directlySetByNeighbor = true;
      } else if (y === MAP_HEIGHT_TILES - 1 && neighboringEdges?.south && neighboringEdges.south[x]) {
          isLand = neighboringEdges.south[x].isLand;
          directlySetByNeighbor = true;
      }

      if (!directlySetByNeighbor) {
          let biasSum = 0;
          if (neighboringEdges?.west && x < EDGE_INFLUENCE_DISTANCE && neighboringEdges.west[y]) {
              const influence = (EDGE_INFLUENCE_DISTANCE - x) / EDGE_INFLUENCE_DISTANCE;
              biasSum += (neighboringEdges.west[y].isLand ? -EDGE_BIAS_STRENGTH : EDGE_BIAS_STRENGTH) * influence;
          }
          if (neighboringEdges?.east && (MAP_WIDTH_TILES - 1 - x) < EDGE_INFLUENCE_DISTANCE && neighboringEdges.east[y]) {
              const influence = (EDGE_INFLUENCE_DISTANCE - (MAP_WIDTH_TILES - 1 - x)) / EDGE_INFLUENCE_DISTANCE;
              biasSum += (neighboringEdges.east[y].isLand ? -EDGE_BIAS_STRENGTH : EDGE_BIAS_STRENGTH) * influence;
          }
          if (neighboringEdges?.north && y < EDGE_INFLUENCE_DISTANCE && neighboringEdges.north[x]) {
              const influence = (EDGE_INFLUENCE_DISTANCE - y) / EDGE_INFLUENCE_DISTANCE;
              biasSum += (neighboringEdges.north[x].isLand ? -EDGE_BIAS_STRENGTH : EDGE_BIAS_STRENGTH) * influence;
          }
          if (neighboringEdges?.south && (MAP_HEIGHT_TILES - 1 - y) < EDGE_INFLUENCE_DISTANCE && neighboringEdges.south[x]) {
              const influence = (EDGE_INFLUENCE_DISTANCE - (MAP_HEIGHT_TILES - 1 - y)) / EDGE_INFLUENCE_DISTANCE;
              biasSum += (neighboringEdges.south[x].isLand ? -EDGE_BIAS_STRENGTH : EDGE_BIAS_STRENGTH) * influence;
          }
          modifiedLandThreshold += biasSum;
          isLand = effectiveNoise > modifiedLandThreshold;
      }
      
      tiles[y][x] = {
        x, y,
        altitude: 0,
        biome: isLand ? BiomeType.GRASSLAND : BiomeType.DEEP_OCEAN,
        isLand: isLand,
        isCoast: false,
        qualities: { flammability: 0, biodiversity: 0, healthiness: 0, sacrality: 0, safety: 0 },
      };
    }
  }
  console.log("[Gen] Phase 1: Basic landmass generation - END");
  
  if (archetype === MapArchetype.BAY) {
    console.log("[Gen] Carving BAY opening channel - START");
    const bayOpeningEdge = determinedHarborSide !== undefined ? determinedHarborSide : Math.floor(bayShapeNoise.random() * 4);
    const bayOpeningWidthChannel = Math.max(4, Math.floor(mapShortSide * BAY_OPENING_WIDTH_FACTOR * 0.7)); 
    const bayCoreTargetX = MAP_WIDTH_TILES / 2;
    const bayCoreTargetY = MAP_HEIGHT_TILES / 2;
    const channelCarveDepth = Math.floor(mapShortSide * BAY_OPENING_WIDTH_FACTOR * 2.5); 

    const carveBiome = BiomeType.SHALLOW_OCEAN; 
    const carveAltitude = ALTITUDE_LEVELS.SEA * (0.1 + bayShapeNoise.random() * 0.1);

    if (bayOpeningEdge === 0) { 
        for (let chY = Math.floor(bayCoreTargetY - bayOpeningWidthChannel / 2); chY <= Math.floor(bayCoreTargetY + bayOpeningWidthChannel / 2); chY++) {
            for (let chX = 0; chX < channelCarveDepth && chX < MAP_WIDTH_TILES; chX++) {
                 if (chY >=0 && chY < MAP_HEIGHT_TILES && tiles[chY][chX]) {
                    tiles[chY][chX].isLand = false; tiles[chY][chX].biome = carveBiome; tiles[chY][chX].altitude = carveAltitude;
                 }
            }
        }
    } else if (bayOpeningEdge === 1) { 
         for (let chY = Math.floor(bayCoreTargetY - bayOpeningWidthChannel / 2); chY <= Math.floor(bayCoreTargetY + bayOpeningWidthChannel / 2); chY++) {
            for (let chX = MAP_WIDTH_TILES - 1; chX >= MAP_WIDTH_TILES - channelCarveDepth && chX >=0; chX--) {
                 if (chY >=0 && chY < MAP_HEIGHT_TILES && tiles[chY][chX]) {
                    tiles[chY][chX].isLand = false; tiles[chY][chX].biome = carveBiome; tiles[chY][chX].altitude = carveAltitude;
                 }
            }
        }
    } else if (bayOpeningEdge === 2) { 
        for (let chX = Math.floor(bayCoreTargetX - bayOpeningWidthChannel / 2); chX <= Math.floor(bayCoreTargetX + bayOpeningWidthChannel / 2); chX++) {
            for (let chY = 0; chY < channelCarveDepth && chY < MAP_HEIGHT_TILES; chY++) {
                if (chX >=0 && chX < MAP_WIDTH_TILES && tiles[chY][chX]) {
                    tiles[chY][chX].isLand = false; tiles[chY][chX].biome = carveBiome; tiles[chY][chX].altitude = carveAltitude;
                }
            }
        }
    } else { 
        for (let chX = Math.floor(bayCoreTargetX - bayOpeningWidthChannel / 2); chX <= Math.floor(bayCoreTargetX + bayOpeningWidthChannel / 2); chX++) {
            for (let chY = MAP_HEIGHT_TILES - 1; chY >= MAP_HEIGHT_TILES - channelCarveDepth && chY >=0; chY--) {
                 if (chX >=0 && chX < MAP_WIDTH_TILES && tiles[chY][chX]) {
                    tiles[chY][chX].isLand = false; tiles[chY][chX].biome = carveBiome; tiles[chY][chX].altitude = carveAltitude;
                 }
            }
        }
    }
    console.log("[Gen] Carving BAY opening channel - END");
  }


  // Clean up lake edges for FRESHWATER_LAKE archetype
  if (archetype === MapArchetype.FRESHWATER_LAKE) {
    console.log("[Gen] Phase 1.5: Lake edge cleanup - START");
    // Remove isolated water/land patches to create cleaner lake boundaries
    for (let pass = 0; pass < 2; pass++) {
      for (let y = 1; y < MAP_HEIGHT_TILES - 1; y++) {
        for (let x = 1; x < MAP_WIDTH_TILES - 1; x++) {
          const tile = tiles[y][x];
          
          // Count neighbors of same type
          let waterNeighbors = 0;
          let landNeighbors = 0;
          
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (dx === 0 && dy === 0) continue;
              const neighbor = tiles[y + dy][x + dx];
              if (neighbor.biome === BiomeType.FRESHWATER_LAKE || !neighbor.isLand) {
                waterNeighbors++;
              } else {
                landNeighbors++;
              }
            }
          }
          
          // Convert isolated patches
          if (tile.biome === BiomeType.FRESHWATER_LAKE && waterNeighbors <= 2) {
            // Isolated water - convert to land
            tile.isLand = true;
            tile.biome = BiomeType.GRASSLAND;
            tile.altitude = ALTITUDE_LEVELS.BEACH + 0.01;
          } else if (tile.isLand && tile.biome !== BiomeType.FRESHWATER_LAKE && landNeighbors <= 2 && waterNeighbors >= 6) {
            // Isolated land surrounded by water - convert to water
            tile.isLand = false;
            tile.biome = BiomeType.FRESHWATER_LAKE;
            tile.altitude = ALTITUDE_LEVELS.SEA * 0.2;
          }
        }
      }
    }
    console.log("[Gen] Phase 1.5: Lake edge cleanup - END");
  }

  console.log("[Gen] Phase 2: Altitude and biome assignment - START");
  generateAltitudeAndInitialBiomes(tiles, altitudeNoiseGen, biomeVariationNoise, archetype, altitudeSetting, archetype === MapArchetype.DELTA ? oceanEdgeForDelta : determinedHarborSide, neighboringEdges, hasLakes);
  console.log("[Gen] Phase 2: Altitude and biome assignment - END");
  
  console.log("[Gen] Phase 2.5: Volcanic Complex Generation - START");
  generateVolcanicComplex(tiles, temperatureNoise, featurePlacementNoise, archetype, forceVolcanic);
  console.log("[Gen] Phase 2.5: Volcanic Complex Generation - END");


  // Special handling for ethereal realms - use special biomes
  if (localArea === 'Heaven') {
    console.log("[Gen] Special Zone: Heaven - Creating ethereal cloudscape");
    // Heaven is all AIR tiles (will render as fluffy white clouds in temperate climate)
    for (let y = 0; y < MAP_HEIGHT_TILES; y++) {
      for (let x = 0; x < MAP_WIDTH_TILES; x++) {
        tiles[y][x].biome = BiomeType.AIR;
        tiles[y][x].isLand = true; // Make walkable
      }
    }
  } else if (localArea === 'Outer Space') {
    console.log("[Gen] Special Zone: Outer Space - Creating cosmic void");
    // Space is all AIR tiles (will render as darkness/stars in arid climate)
    for (let y = 0; y < MAP_HEIGHT_TILES; y++) {
      for (let x = 0; x < MAP_WIDTH_TILES; x++) {
        tiles[y][x].biome = BiomeType.AIR;
        tiles[y][x].isLand = true; // Make walkable
      }
    }
  } else if (localArea === 'Undersea Kingdom') {
    console.log("[Gen] Special Zone: Undersea Kingdom - Creating underwater realm");
    // Undersea is all UNDERSEA tiles
    for (let y = 0; y < MAP_HEIGHT_TILES; y++) {
      for (let x = 0; x < MAP_WIDTH_TILES; x++) {
        tiles[y][x].biome = BiomeType.UNDERSEA;
        tiles[y][x].isLand = true; // Make walkable
      }
    }
  } else if (localArea === 'Storm Realm') {
    console.log("[Gen] Special Zone: Storm Realm - Creating tempest dimension");
    // Storm realm mixes AIR and UNDERSEA for a chaotic effect
    for (let y = 0; y < MAP_HEIGHT_TILES; y++) {
      for (let x = 0; x < MAP_WIDTH_TILES; x++) {
        // Create swirling patterns of air and water
        const noise = featurePlacementNoise.octaveNoise(x * 0.1, y * 0.1, 2, 0.5, 2.0);
        tiles[y][x].biome = noise > 0 ? BiomeType.AIR : BiomeType.UNDERSEA;
        tiles[y][x].isLand = true; // Make walkable
      }
    }
  } else if (localArea === 'Frozen Wastes') {
    console.log("[Gen] Special Zone: Frozen Wastes - Creating ice crystal dimension");
    // Frozen Wastes is AIR in cold climate (ice crystals)
    for (let y = 0; y < MAP_HEIGHT_TILES; y++) {
      for (let x = 0; x < MAP_WIDTH_TILES; x++) {
        tiles[y][x].biome = BiomeType.AIR;
        tiles[y][x].isLand = true;
      }
    }
  } else if (localArea === 'Typhoon Realm') {
    console.log("[Gen] Special Zone: Typhoon Realm - Creating hurricane dimension");
    // Typhoon is AIR in tropical climate (hurricane storms)
    for (let y = 0; y < MAP_HEIGHT_TILES; y++) {
      for (let x = 0; x < MAP_WIDTH_TILES; x++) {
        tiles[y][x].biome = BiomeType.AIR;
        tiles[y][x].isLand = true;
      }
    }
  } else {
    // Normal generation for regular zones
    console.log("[Gen] Phase 3: Climate-specific biome modifications - START");
    applyClimateBiomeChanges(tiles, climate, humidityNoise, desertificationNoise, biomeVariationNoise, featurePlacementNoise);
    console.log("[Gen] Phase 3: Climate-specific biome modifications - END");
    
    console.log("[Gen] Phase 3.5: Climate-Enhanced Biome Generation - START");
    generateClimateEnhancedBiomes(tiles, climate, archetype, temperatureNoise, humidityNoise, featurePlacementNoise);
    console.log("[Gen] Phase 3.5: Climate-Enhanced Biome Generation - END");


    console.log("[Gen] Phase 4: Dense forest generation - START");
    generateDenseForests(tiles, climate, humidityNoise, biomeVariationNoise, featurePlacementNoise);
    console.log("[Gen] Phase 4: Dense forest generation - END");
  }

  console.log("[Gen] Phase 5: Coastline processing - START");
  updateCoastlinesAndShallowOceans(tiles, featurePlacementNoise, archetype, neighboringEdges);
  console.log("[Gen] Phase 5: Coastline processing - END");


  if (generateHarborFlag && ![MapArchetype.OPEN_OCEAN, MapArchetype.FRESHWATER_LAKE, MapArchetype.ATOLL, MapArchetype.SHOALS, MapArchetype.ALL_LAND].includes(archetype)) {
    console.log("[Gen] Phase 6a: Harbor generation - START");
    generateHarbor(tiles, archetype, determinedHarborSide, harborNoise, featurePlacementNoise);
    updateCoastlinesAndShallowOceans(tiles, featurePlacementNoise, archetype, neighboringEdges); 
    console.log("[Gen] Phase 6a: Harbor generation - END");
  }
  
  console.log("[Gen] Phase 7: Enhanced river generation - START");
  const oceanEdgeForDeltaRiver = (archetype === MapArchetype.DELTA) ? (seed % 4) : undefined;
  let mainRiverPortSource: Point | null = null;

  if (archetype === MapArchetype.RIVER_PORT) {
    // Create a clean continuous river channel with more organic edges
    // Determine orientation based on riverDirection property, harbor side, or random
    let orientation: 'horizontal' | 'vertical';
    if (riverDirection) {
      orientation = riverDirection === 'east-west' ? 'horizontal' : 'vertical';
    } else if (determinedHarborSide !== undefined) {
      orientation = (determinedHarborSide % 2 === 0) ? 'horizontal' : 'vertical';
    } else {
      orientation = featurePlacementNoise.random() > 0.5 ? 'horizontal' : 'vertical';
    }
    
    const riverWidth = 3 + Math.floor(featurePlacementNoise.random() * 4); // 3-6 tiles wide
    const riverHalfWidth = Math.floor(riverWidth / 2);
    
    if (orientation === 'horizontal') {
      // East-West river
      const riverCenterY = MAP_HEIGHT_TILES / 2;
      
      // Track river edge variations for organic shape
      const northEdgeOffsets: number[] = [];
      const southEdgeOffsets: number[] = [];
      
      // Generate smooth edge variations
      let northWiggle = 0;
      let southWiggle = 0;
      for (let x = 0; x < MAP_WIDTH_TILES; x++) {
        // North edge variation
        northWiggle += (riverMeanderNoise.random() - 0.5) * 0.8;
        northWiggle = Math.max(-1.5, Math.min(1.5, northWiggle));
        northEdgeOffsets[x] = Math.round(northWiggle);
        
        // South edge variation (independent of north)
        southWiggle += (riverMeanderNoise.random() - 0.5) * 0.8;
        southWiggle = Math.max(-1.5, Math.min(1.5, southWiggle));
        southEdgeOffsets[x] = Math.round(southWiggle);
      }
      
      // Apply river with organic edges
      for (let x = 0; x < MAP_WIDTH_TILES; x++) {
        const northOffset = northEdgeOffsets[x];
        const southOffset = southEdgeOffsets[x];
        
        // Calculate actual river bounds at this x position
        const minY = riverCenterY - riverHalfWidth + northOffset;
        const maxY = riverCenterY + riverHalfWidth + southOffset;
        
        for (let y = minY; y <= maxY; y++) {
          if (y >= 0 && y < MAP_HEIGHT_TILES) {
            tiles[y][x].biome = BiomeType.MAJOR_RIVER;
            tiles[y][x].isLand = false;
            tiles[y][x].altitude = -0.1;
          }
        }
      }
      
      // Add slight center channel meander for more natural look
      let centerMeander = 0;
      for (let x = 0; x < MAP_WIDTH_TILES; x++) {
        centerMeander += (riverMeanderNoise.random() - 0.5) * 0.3;
        centerMeander = Math.max(-1, Math.min(1, centerMeander));
        const offsetY = Math.round(centerMeander);
        
        // Add a deeper channel in the center
        const y = riverCenterY + offsetY;
        if (y >= 0 && y < MAP_HEIGHT_TILES) {
          tiles[y][x].altitude = -0.2; // Slightly deeper center
        }
      }
    } else {
      // North-South river
      const riverCenterX = MAP_WIDTH_TILES / 2;
      
      // Track river edge variations for organic shape
      const westEdgeOffsets: number[] = [];
      const eastEdgeOffsets: number[] = [];
      
      // Generate smooth edge variations
      let westWiggle = 0;
      let eastWiggle = 0;
      for (let y = 0; y < MAP_HEIGHT_TILES; y++) {
        // West edge variation
        westWiggle += (riverMeanderNoise.random() - 0.5) * 0.8;
        westWiggle = Math.max(-1.5, Math.min(1.5, westWiggle));
        westEdgeOffsets[y] = Math.round(westWiggle);
        
        // East edge variation (independent of west)
        eastWiggle += (riverMeanderNoise.random() - 0.5) * 0.8;
        eastWiggle = Math.max(-1.5, Math.min(1.5, eastWiggle));
        eastEdgeOffsets[y] = Math.round(eastWiggle);
      }
      
      // Apply river with organic edges
      for (let y = 0; y < MAP_HEIGHT_TILES; y++) {
        const westOffset = westEdgeOffsets[y];
        const eastOffset = eastEdgeOffsets[y];
        
        // Calculate actual river bounds at this y position
        const minX = riverCenterX - riverHalfWidth + westOffset;
        const maxX = riverCenterX + riverHalfWidth + eastOffset;
        
        for (let x = minX; x <= maxX; x++) {
          if (x >= 0 && x < MAP_WIDTH_TILES) {
            tiles[y][x].biome = BiomeType.MAJOR_RIVER;
            tiles[y][x].isLand = false;
            tiles[y][x].altitude = -0.1;
          }
        }
      }
      
      // Add slight center channel meander for more natural look
      let centerMeander = 0;
      for (let y = 0; y < MAP_HEIGHT_TILES; y++) {
        centerMeander += (riverMeanderNoise.random() - 0.5) * 0.3;
        centerMeander = Math.max(-1, Math.min(1, centerMeander));
        const offsetX = Math.round(centerMeander);
        
        // Add a deeper channel in the center
        const x = riverCenterX + offsetX;
        if (x >= 0 && x < MAP_WIDTH_TILES) {
          tiles[y][x].altitude = -0.2; // Slightly deeper center
        }
      }
    }
  } 
  
  // Special handling for deltas - generate fan-shaped river system
  if (archetype === MapArchetype.DELTA) {
    console.log("[Gen] Generating delta fan-shaped river system");
    
    // Determine which edge is the ocean based on oceanEdgeForDelta
    const deltaOceanEdge = oceanEdgeForDelta !== undefined ? oceanEdgeForDelta : 0;
    
    // Generate 5-7 major rivers in a fan pattern for a proper delta
    const numMajorRivers = 5 + Math.floor(featurePlacementNoise.random() * 3);
    
    // Determine the apex point (where rivers start) - opposite side from ocean
    let apexX = MAP_WIDTH_TILES / 2;
    let apexY = MAP_HEIGHT_TILES / 2;
    
    if (deltaOceanEdge === 0) { // South ocean - start from north
      apexY = Math.floor(MAP_HEIGHT_TILES * 0.1);
    } else if (deltaOceanEdge === 1) { // North ocean - start from south
      apexY = Math.floor(MAP_HEIGHT_TILES * 0.9);
    } else if (deltaOceanEdge === 2) { // East ocean - start from west
      apexX = Math.floor(MAP_WIDTH_TILES * 0.1);
    } else { // West ocean - start from east
      apexX = Math.floor(MAP_WIDTH_TILES * 0.9);
    }
    
    // Generate main rivers in fan pattern
    for (let i = 0; i < numMajorRivers; i++) {
      // Spread out the starting points slightly
      const spreadFactor = 0.2;
      let startX = apexX;
      let startY = apexY;
      
      if (deltaOceanEdge === 0 || deltaOceanEdge === 1) {
        // For north-south deltas, spread horizontally
        startX = apexX + (i - numMajorRivers/2) * (MAP_WIDTH_TILES * spreadFactor / numMajorRivers);
      } else {
        // For east-west deltas, spread vertically
        startY = apexY + (i - numMajorRivers/2) * (MAP_HEIGHT_TILES * spreadFactor / numMajorRivers);
      }
      
      startX = Math.max(1, Math.min(MAP_WIDTH_TILES - 2, Math.floor(startX)));
      startY = Math.max(1, Math.min(MAP_HEIGHT_TILES - 2, Math.floor(startY)));
      
      const riverStart = { x: startX, y: startY };
      
      // Ensure starting point is on land
      if (!tiles[startY][startX].isLand) {
        // Find nearest land tile
        for (let radius = 1; radius < 5; radius++) {
          let foundLand = false;
          for (let dy = -radius; dy <= radius && !foundLand; dy++) {
            for (let dx = -radius; dx <= radius && !foundLand; dx++) {
              const nx = startX + dx;
              const ny = startY + dy;
              if (nx >= 0 && nx < MAP_WIDTH_TILES && ny >= 0 && ny < MAP_HEIGHT_TILES && tiles[ny][nx].isLand) {
                riverStart.x = nx;
                riverStart.y = ny;
                foundLand = true;
              }
            }
          }
          if (foundLand) break;
        }
      }
      
      // Set appropriate altitude for river source - ensure proper gradient for delta
      // Higher altitude at apex to ensure flow to ocean
      tiles[riverStart.y][riverStart.x].altitude = ALTITUDE_LEVELS.GRASSLAND_LOWER_MAX + 0.05 + featurePlacementNoise.random() * 0.05;
      
      // Create altitude gradient towards ocean to ensure river flow
      const gradientRadius = 3;
      for (let dy = -gradientRadius; dy <= gradientRadius; dy++) {
        for (let dx = -gradientRadius; dx <= gradientRadius; dx++) {
          const gx = riverStart.x + dx;
          const gy = riverStart.y + dy;
          if (gx >= 0 && gx < MAP_WIDTH_TILES && gy >= 0 && gy < MAP_HEIGHT_TILES) {
            const dist = Math.hypot(dx, dy);
            if (dist <= gradientRadius && tiles[gy][gx].isLand) {
              // Set altitude to ensure downward flow
              tiles[gy][gx].altitude = Math.max(
                tiles[gy][gx].altitude, 
                ALTITUDE_LEVELS.GRASSLAND_LOWER_MAX + 0.03 - (dist * 0.005)
              );
            }
          }
        }
      }
      
      // Generate the river with extra width for delta
      generateEnhancedRiverPath(tiles, riverStart, featurePlacementNoise, riverMeanderNoise, riverWidthNoise, 
                               archetype, deltaOceanEdge, false, true, deltaOceanEdge, hasLakes);
    }
    
    // Generate 2-3 additional smaller rivers
    const numSmallRivers = 2 + Math.floor(featurePlacementNoise.random() * 2);
    for (let i = 0; i < numSmallRivers; i++) {
      const edge = (deltaOceanEdge + 2) % 4; // Start from opposite edge
      const riverSource = findEdgeRiverSource(tiles, featurePlacementNoise, edge);
      if (riverSource) {
        generateEnhancedRiverPath(tiles, riverSource, featurePlacementNoise, riverMeanderNoise, riverWidthNoise, 
                                 archetype, deltaOceanEdge, false, false, deltaOceanEdge, hasLakes);
      }
    }
  }
  
  // Special handling for swamps - generate many rivers
  else if (archetype === MapArchetype.SWAMP) {
    console.log("[Gen] Generating swamp rivers and water features");
    
    // Generate 4-6 major rivers crossing the map
    const numMajorRivers = 4 + Math.floor(featurePlacementNoise.random() * 3);
    for (let i = 0; i < numMajorRivers; i++) {
      const edge = i % 4; // Distribute rivers from different edges
      const riverSource = findEdgeRiverSource(tiles, featurePlacementNoise, edge);
      if (riverSource) {
        generateEnhancedRiverPath(tiles, riverSource, featurePlacementNoise, riverMeanderNoise, riverWidthNoise, archetype, undefined, false, true, undefined, hasLakes);
      }
    }
    
    // Add scattered small lakes and ponds
    const numLakes = 8 + Math.floor(featurePlacementNoise.random() * 5);
    for (let i = 0; i < numLakes; i++) {
      const lakeX = Math.floor(featurePlacementNoise.random() * (MAP_WIDTH_TILES - 10)) + 5;
      const lakeY = Math.floor(featurePlacementNoise.random() * (MAP_HEIGHT_TILES - 10)) + 5;
      const lakeSize = 1 + Math.floor(featurePlacementNoise.random() * 3);
      
      for (let dy = -lakeSize; dy <= lakeSize; dy++) {
        for (let dx = -lakeSize; dx <= lakeSize; dx++) {
          const x = lakeX + dx;
          const y = lakeY + dy;
          if (x >= 0 && x < MAP_WIDTH_TILES && y >= 0 && y < MAP_HEIGHT_TILES) {
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist <= lakeSize && featurePlacementNoise.random() > 0.3) {
              tiles[y][x].isLand = false;
              tiles[y][x].biome = BiomeType.RIVER;
            }
          }
        }
      }
    }
  }
  
  let highAltitudeRiverSources = findRiverSources(tiles, featurePlacementNoise, archetype, climate);
  if (archetype === MapArchetype.FRESHWATER_LAKE) {
      highAltitudeRiverSources = highAltitudeRiverSources.filter(p => tiles[p.y][p.x].biome !== BiomeType.FRESHWATER_LAKE);
  }

  // Add river continuation points from neighboring edges
  const riverContinuationPoints = findRiverContinuationPoints(neighboringEdges);
  console.log(`[Gen] Found ${riverContinuationPoints.length} river continuation points from neighboring edges`);

  let allRiverSources = [...highAltitudeRiverSources, ...riverContinuationPoints];
  let riversToLakeCount = 0;
  
  if (archetype === MapArchetype.DELTA && oceanEdgeForDeltaRiver !== undefined) {
    const riverSourceEdgeOptions = [0,1,2,3].filter(e => e !== oceanEdgeForDeltaRiver);
    const riverSourceEdge = riverSourceEdgeOptions[seed % riverSourceEdgeOptions.length];
    const deltaSource = findEdgeRiverSource(tiles, featurePlacementNoise, riverSourceEdge);
    if(deltaSource) {
        allRiverSources.unshift(deltaSource);
    }
  }

  if (archetype === MapArchetype.ALL_LAND && determinedHarborSide !== undefined) {
    const edgeRiverStartPoint = findEdgeRiverSource(tiles, featurePlacementNoise, determinedHarborSide);
    if (edgeRiverStartPoint) {
        const isTooCloseToExisting = highAltitudeRiverSources.some(
            existingSrc => Math.hypot(existingSrc.x - edgeRiverStartPoint.x, existingSrc.y - edgeRiverStartPoint.y) < 8
        );
        if (!isTooCloseToExisting && !(mainRiverPortSource && mainRiverPortSource.x === edgeRiverStartPoint.x && mainRiverPortSource.y === mainRiverPortSource.y)) {
            allRiverSources.push(edgeRiverStartPoint);
        }
    }
  }
  
  allRiverSources.sort(() => featurePlacementNoise.random() - 0.5); 
  
  let primaryWideRiverDesignated = (archetype === MapArchetype.RIVER_PORT && mainRiverPortSource !== null) || archetype === MapArchetype.DELTA;

  allRiverSources.forEach(source => {
      // Skip all river generation for RIVER_PORT - we've already created the main channel
      if (archetype === MapArchetype.RIVER_PORT) {
          return; 
      }

      let isThisRiverDesignatedWide = false;
      if (!primaryWideRiverDesignated) {
          const isEdgeSource = allRiverSources.length > highAltitudeRiverSources.length && !highAltitudeRiverSources.find(s => s.x === source.x && s.y === source.y);
          const isFirstHighAltSource = (highAltitudeRiverSources.length > 0 && highAltitudeRiverSources[0].x === source.x && highAltitudeRiverSources[0].y === source.y && archetype !== MapArchetype.FRESHWATER_LAKE);

          if (isEdgeSource || isFirstHighAltSource) {
              isThisRiverDesignatedWide = true;
              primaryWideRiverDesignated = true;
          }
      } else if(archetype === MapArchetype.DELTA && allRiverSources.indexOf(source) === 0){
        isThisRiverDesignatedWide = true;
      }
      
      const terminatedInWater = generateEnhancedRiverPath(
        tiles, source, featurePlacementNoise, riverMeanderNoise, riverWidthNoise, archetype, determinedHarborSide, false, isThisRiverDesignatedWide, oceanEdgeForDeltaRiver, hasLakes
      );

      if (archetype === MapArchetype.FRESHWATER_LAKE && terminatedInWater) {
         riversToLakeCount++;
      }
  });
  
  const MIN_LAKE_INFLOWS = 1 + Math.floor(lakeRandomnessNoise.random() * 2); 
  if (archetype === MapArchetype.FRESHWATER_LAKE && riversToLakeCount < MIN_LAKE_INFLOWS) {
      const edgeSidesToTry = [0,1,2,3].sort(() => lakeRandomnessNoise.random() - 0.5); 
      for (let i = 0; i < edgeSidesToTry.length && riversToLakeCount < MIN_LAKE_INFLOWS; i++) {
          const edgeSource = findEdgeRiverSource(tiles, featurePlacementNoise, edgeSidesToTry[i]);
          if (edgeSource && tiles[edgeSource.y][edgeSource.x].biome !== BiomeType.FRESHWATER_LAKE) {
              const terminatedInLake = generateEnhancedRiverPath(
                  tiles, edgeSource, featurePlacementNoise, riverMeanderNoise, riverWidthNoise, archetype, undefined, false, false, undefined, hasLakes
              );
              if(terminatedInLake) riversToLakeCount++; 
          }
      }
  }
  
  updateCoastlinesAndShallowOceans(tiles, featurePlacementNoise, archetype, neighboringEdges); 
  console.log("[Gen] Phase 7: Enhanced river generation - END");

  console.log("[Gen] Phase 8: Riverbank generation - START");
  generateRiverbanks(tiles, featurePlacementNoise);
  console.log("[Gen] Phase 8: Riverbank generation - END");
  
  console.log("[Gen] Phase 8.5: Estuary Generation - START");
  generateEstuaries(tiles, archetype, featurePlacementNoise);
  updateCoastlinesAndShallowOceans(tiles, featurePlacementNoise, archetype, neighboringEdges); 
  console.log("[Gen] Phase 8.5: Estuary Generation - END");


  console.log("[Gen] Phase 9: Special biome features (Wetlands, Oases, Reefs) - START");
  generateWetlands(tiles, climate, humidityNoise, featurePlacementNoise, archetype);
  generateOases(tiles, climate, featurePlacementNoise);
  generateReefs(tiles, climate, archetype, featurePlacementNoise);
  console.log("[Gen] Phase 9: Special biome features - END");
  
  console.log("[Gen] Phase 9.5: Special Terrain Tiles (Salt Flats, Hot Springs, Shoals) - START");
  generateSpecialTerrainTiles(tiles, climate, humidityNoise, altitudeNoiseGen, thermalNoise, featurePlacementNoise, archetype);
  console.log("[Gen] Phase 9.5: Special Terrain Tiles - END");
  
  console.log("[Gen] Phase 9.75: Climate-Aware Map Stitching - START");
  applyClimateTransitions(tiles, climate, localArea);
  console.log("[Gen] Phase 9.75: Climate-Aware Map Stitching - END");

  let mapDataObject: MapData = { 
    width: MAP_WIDTH_TILES, 
    height: MAP_HEIGHT_TILES, 
    tiles, 
    seed, 
    archetype, 
    climate, 
    edgeDataSet: { north: null, east: null, south: null, west: null },
    harborSide: determinedHarborSide,
    continent, 
    region: regionName,
    timeSlice,
    localArea,
    mapAreaName: localArea, // Add mapAreaName for special rendering detection
    culturalZone, // Add culturalZone for ruin generation
    era: dateInfo.era, // Add era for ruin generation
    pathObjects: [],
    terrainStructures: [],
    majorCity: localArea ? generateCityInfo(localArea, timeSlice || "1650", dominantPower, seed, culturalZone) : undefined,
  };

  console.log("[Gen] Phase 9.6: Stream Generation - START");
  generateStreams(mapDataObject, featurePlacementNoise, archetype, oceanEdgeForDelta);
  console.log("[Gen] Phase 9.6: Stream Generation - END");

  console.log("[Gen] Phase 10: Urban area generation - START");
  console.log(`[Gen] Urban generation check: economicActivityLevel=${generationParams?.economicActivityLevel}, localArea="${localArea}", region="${region}"`);
  
  // Skip urban areas in ethereal realms
  const etherealRealms = ['Outer Space', 'Heaven', 'Undersea Kingdom', 'Storm Realm', 'Frozen Wastes', 'Typhoon Realm'];
  if (etherealRealms.includes(localArea)) {
      console.log("[Gen] Skipping urban generation for special zone:", localArea);
  } else if (generationParams?.economicActivityLevel === 0) {
      console.log("[Gen] Skipping urban generation due to economicActivityLevel = 0");
  } else {
      console.log(`[Gen] Proceeding with urban generation (economicActivityLevel=${generationParams?.economicActivityLevel || 'default'})`);
      // Pass both region (for historical cities) and localArea (for procedural cities)
      generateUrbanAreas(tiles, featurePlacementNoise, archetype, determinedHarborSide, generateLargeCityFlag, generationParams?.economicActivityLevel, dateInfo.year, region, localArea, timeSlice, dominantPower, culturalZone);
  }
  console.log("[Gen] Phase 10: Urban area generation - END");
  
  // NEW: Generate marketplace names after urban areas are placed
  mapDataObject.marketplaces = generateMarketplaceNames(mapDataObject);

  console.log("[Gen] Phase 10.5: Farmland and Ruins Generation - START");
  // Skip structures in ethereal realms
  if (!etherealRealms.includes(localArea)) {
    generateFarmland(mapDataObject, featurePlacementNoise, continent, timeSlice, societalProfile);
    const ruins = generateRuins(tiles, featurePlacementNoise, societalProfile, mapDataObject);
    if (ruins.length > 0) mapDataObject.terrainStructures!.push(...ruins);
  }
  console.log("[Gen] Phase 10.5: Farmland and Ruins Generation - END");
  
  console.log("[Gen] Phase 11: Tile qualities calculation - START");
  calculateTileQualities(tiles, climate, archetype, qualitiesNoise, microVariationNoise);
  console.log("[Gen] Phase 11: Tile qualities calculation - END");
  
  console.log("[Gen] Phase 11.1: Mineral deposit generation - START");
  generateMineralDeposits(mapDataObject, qualitiesNoise);
  const mineralDeposits = tiles.flat().filter(t => t.mineralDeposit);
  if(mineralDeposits.length > 0) {
      console.log(`[Gen] Mineral Deposits Spawned: ${mineralDeposits.length} total`);
      const byType: Record<string, number> = {};
      mineralDeposits.forEach(t => {
          byType[t.mineralDeposit!.metalId] = (byType[t.mineralDeposit!.metalId] || 0) + 1;
      });
      Object.entries(byType).forEach(([type, count]) => {
          console.log(`  - ${type}: ${count} deposits`);
      });
  }
  console.log("[Gen] Phase 11.1: Mineral deposit generation - END");


  console.log("[Gen] Phase 11.5: POI Generation (Post-Qualities) - START");
  // Skip POIs in ethereal realms
  if (!etherealRealms.includes(localArea)) {
    const palaces = generatePalaces(tiles, featurePlacementNoise, societalProfile, mapDataObject);
    const holyPlaces = generateHolyPlaces(mapDataObject, featurePlacementNoise, societalProfile);
    if (palaces.length > 0) mapDataObject.terrainStructures!.push(...palaces);
    if (holyPlaces.length > 0) mapDataObject.terrainStructures!.push(...holyPlaces);
  }
  console.log("[Gen] Phase 11.5: POI Generation (Post-Qualities) - END");
  
  console.log("[Gen] Phase 11.5b: Terrain Structure Generation - START");
  // Skip structures in ethereal realms
  if (!etherealRealms.includes(localArea)) {
    // Only skip structure generation if economicActivityLevel is explicitly 0
    if (generationParams?.economicActivityLevel !== 0 || generationParams?.economicActivityLevel === undefined) {
      // Check if the map has cities by scanning for city biomes
      let hasCities = false;
      for (const row of tiles) {
        for (const tile of row) {
          if (tile.biome === BiomeType.CITY_CENTER || 
              tile.biome === BiomeType.DENSE_CITY || 
              tile.biome === BiomeType.LOW_DENSITY_CITY) {
            hasCities = true;
            break;
          }
        }
        if (hasCities) break;
      }
      console.log(`[Gen] Map has cities: ${hasCities}`);
      generateTerrainStructures(mapDataObject, featurePlacementNoise, region, societalProfile, hasCities, seed);
    }
  } else {
    console.log("[Gen] Skipping all structures for special zone:", localArea);
  }
  console.log("[Gen] Phase 11.5b: Terrain Structure Generation - END");

  console.log("[Gen] Phase 11.6: Animal Paddock Generation - START");
  // DISABLED: Old paddock generation that created fence paths
  // Now using new PaddockSymbol component for better visual representation
  // Skip animal paddocks in ethereal realms
  if (!etherealRealms.includes(localArea)) {
    // COMMENTED OUT: generateAnimalPaddocks(mapDataObject, featurePlacementNoise, societalProfile);
    // The new system still uses paddockType on tiles but renders fences differently
    generateAnimalPaddocks(mapDataObject, featurePlacementNoise, societalProfile);
  } else {
    console.log("[Gen] Skipping animal paddocks for special zone:", localArea);
  }
  console.log("[Gen] Phase 11.6: Animal Paddock Generation - END");

  console.log("[Gen] Phase 11.7: Vegetation Generation - START");
  // Skip vegetation in ethereal realms
  if (!etherealRealms.includes(localArea)) {
    mapDataObject.vegetation = generateVegetation(mapDataObject, vegetationNoise);
  } else {
    mapDataObject.vegetation = [];
    console.log("[Gen] Skipping vegetation for special zone:", localArea);
  }
  console.log("[Gen] Phase 11.7: Vegetation Generation - END");
  
  console.log("[Gen] Phase 11.8: Animal & NPC Spawning - START");
  // Only skip animal/NPC generation if economicActivityLevel is explicitly 0
  if (generationParams?.economicActivityLevel !== 0 || generationParams?.economicActivityLevel === undefined) {
    // Skip animals in Heaven but keep NPCs
    if (localArea === 'Heaven') {
      mapDataObject.animals = [];
      mapDataObject.npcs = generateNpcsForStandardMap(mapDataObject, climate, timeSlice || '1650', continent || 'Europe', npcNoise, region, localArea);
      console.log("[Gen] Heaven: Skipping animals, keeping NPCs");
    } else if (localArea === 'Outer Space' || localArea === 'Undersea Kingdom') {
      // Skip both in other special zones
      mapDataObject.animals = [];
      mapDataObject.npcs = [];
      console.log("[Gen] Special zone: Skipping both animals and NPCs");
    } else {
      mapDataObject.animals = generateAnimalsForMap(mapDataObject, animalNoise);
      mapDataObject.npcs = generateNpcsForStandardMap(mapDataObject, climate, timeSlice || '1650', continent || 'Europe', npcNoise, region, localArea);
    }
  }
  console.log("[Gen] Phase 11.8: Animal & NPC Spawning - END");

  console.log("[Gen] Phase 11.9: Road and Path Network Generation - START");
  // Only skip road generation if economicActivityLevel is explicitly 0
  if (generationParams?.economicActivityLevel !== 0 || generationParams?.economicActivityLevel === undefined) {
    generateRoadAndPathNetwork(mapDataObject, roadPathNoise, dateInfo.era as HistoricalEra); 
  }
  console.log("[Gen] Phase 11.9: Road and Path Network Generation - END");
  
  // Generate bridges at water crossings
  console.log("[Gen] Phase 11.10: Bridge Generation - START");
  if (mapDataObject.pathObjects && mapDataObject.pathObjects.length > 0) {
    const bridges = generateBridges(
      mapDataObject.tiles,
      mapDataObject.pathObjects,
      culturalZone,
      dateInfo.era as HistoricalEra
    );
    
    if (bridges.length > 0) {
      mapDataObject = addBridgesToMap(mapDataObject, bridges);
      console.log(`[Gen] Generated ${bridges.length} bridges at water crossings`);
    }
  }
  console.log("[Gen] Phase 11.10: Bridge Generation - END");

  // Desert water restrictions: small lakes and oases only
  if (climate === ClimateType.ARID) {
      // Remove any rivers that might have been generated
      tiles.flat().forEach(tile => {
          if (tile.biome === BiomeType.RIVER || tile.biome === BiomeType.MAJOR_RIVER) {
              // Convert rivers back to land
              tile.isLand = true;
              tile.biome = BiomeType.DESERT;
              tile.altitude = Math.max(ALTITUDE_LEVELS.BEACH, tile.altitude);
          }
      });
      
      // Add 1-3 small water bodies (lakes)
      const numWaterBodies = 1 + Math.floor(featurePlacementNoise.random() * 3); // 1-3 lakes
      console.log(`[Gen] Creating ${numWaterBodies} small water bodies for arid map`);
      
      for (let lakeIdx = 0; lakeIdx < numWaterBodies; lakeIdx++) {
          for (let attempts = 0; attempts < 50; attempts++) {
              const x = Math.floor(10 + featurePlacementNoise.random() * (MAP_WIDTH_TILES - 20));
              const y = Math.floor(10 + featurePlacementNoise.random() * (MAP_HEIGHT_TILES - 20));
              const tile = tiles[y][x];
              
              if (tile.isLand && tile.altitude < 0.3) {
                  // Create a small lake (1-3 tiles)
                  const lakeSize = 1 + Math.floor(featurePlacementNoise.random() * 3); // 1-3 tiles
                  tile.biome = BiomeType.FRESHWATER_LAKE;
                  tile.isLand = false;
                  tile.altitude = ALTITUDE_LEVELS.SEA * 0.5;
                  
                  if (lakeSize > 1) {
                      // Add adjacent tiles for larger lakes
                      const directions = [[0,1], [1,0], [0,-1], [-1,0]];
                      let tilesAdded = 1;
                      for (const [dx, dy] of directions) {
                          if (tilesAdded >= lakeSize) break;
                          const nx = x + dx;
                          const ny = y + dy;
                          if (nx >= 0 && nx < MAP_WIDTH_TILES && ny >= 0 && ny < MAP_HEIGHT_TILES) {
                              const neighbor = tiles[ny][nx];
                              if (neighbor.isLand && neighbor.altitude < 0.3) {
                                  neighbor.biome = BiomeType.FRESHWATER_LAKE;
                                  neighbor.isLand = false;
                                  neighbor.altitude = ALTITUDE_LEVELS.SEA * 0.5;
                                  tilesAdded++;
                              }
                          }
                      }
                  }
                  break;
              }
          }
      }
      
      // Add 1-5 oases near water
      const numOases = 1 + Math.floor(featurePlacementNoise.random() * 5); // 1-5 oases
      console.log(`[Gen] Creating ${numOases} oases near water for arid map`);
      
      const waterTiles = tiles.flat().filter(t => !t.isLand);
      for (let oasisIdx = 0; oasisIdx < numOases && waterTiles.length > 0; oasisIdx++) {
          const waterTile = waterTiles[Math.floor(featurePlacementNoise.random() * waterTiles.length)];
          
          // Find a nearby land tile for oasis
          for (let radius = 1; radius <= 3; radius++) {
              let placed = false;
              for (let dy = -radius; dy <= radius && !placed; dy++) {
                  for (let dx = -radius; dx <= radius && !placed; dx++) {
                      if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) continue; // Only check border
                      const nx = waterTile.x + dx;
                      const ny = waterTile.y + dy;
                      if (nx >= 0 && nx < MAP_WIDTH_TILES && ny >= 0 && ny < MAP_HEIGHT_TILES) {
                          const neighbor = tiles[ny][nx];
                          if (neighbor.isLand && neighbor.biome === BiomeType.DESERT) {
                              neighbor.biome = BiomeType.OASIS;
                              placed = true;
                          }
                      }
                  }
              }
              if (placed) break;
          }
      }
  }

  const edgeDataSet: EdgeDataSet = { north: null, east: null, south: null, west: null };
  if (tiles.length > 0 && tiles[0].length > 0) {
      edgeDataSet.north = tiles[0].map(t => ({ isLand: t.isLand, biome: t.biome, altitude: t.altitude }));
      edgeDataSet.south = tiles[MAP_HEIGHT_TILES - 1].map(t => ({ isLand: t.isLand, biome: t.biome, altitude: t.altitude }));
      edgeDataSet.east = tiles.map(row => { const t = row[MAP_WIDTH_TILES - 1]; return { isLand: t.isLand, biome: t.biome, altitude: t.altitude }; });
      edgeDataSet.west = tiles.map(row => { const t = row[0]; return { isLand: t.isLand, biome: t.biome, altitude: t.altitude }; });
  }
  mapDataObject.edgeDataSet = edgeDataSet;


  console.log("[Gen] Map generation complete!");
  return mapDataObject;
}
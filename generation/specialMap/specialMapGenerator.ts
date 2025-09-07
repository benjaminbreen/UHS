/**
 * generation/specialMap/specialMapGenerator.ts
 * Main generator for special maps (interior and focused outdoor spaces)
 */

import { 
  MapData, 
  Tile, 
  BiomeType, 
  ClimateType,
  CulturalZone,
  HistoricalEra 
} from '../../types';
import { 
  SpecialMapArchetype, 
  SpecialMapConfig, 
  SpecialMapData,
  InteractionZone,
  ExitZone,
  RoomDefinition
} from '../../types/specialMapTypes';
import { ValueNoise } from '../../utils/noise';
// Archetype generators - ONE per archetype type
import { generateEstates } from './archetypes/estatesGeneratorFixed';
import { generateGovernmentForumFixed } from './archetypes/governmentForumFixed';
import { generateMarketBazaar } from './archetypes/marketGenerator';
import { generateSacredComplex } from './archetypes/sacredGenerator';
import generateUniversityAcademy from './archetypes/universityGeneratorV2';
import { generateTheater } from './archetypes/theaterGenerator';
import { generateArena } from './archetypes/arenaGenerator';
import { generateExhibition } from './archetypes/exhibitionGenerator';
import { generateOpenField } from './archetypes/openFieldGenerator';
import { generateVessel } from './archetypes/vesselGenerator';
import { generateCampground } from './archetypes/campgroundGenerator';
import { generateRestaurantInn } from './archetypes/restaurantInnGenerator';
import { generateSpecialMapNpcs } from './specialMapNpcGenerator';
import { getEraAppropriateName } from '../../utils/governmentDistrictFallback';
import { 
  SimplifiedArchetype,
  ARCHETYPE_MAPPING,
  augmentGovernmentDistrict,
  LANDSCAPE_BORDER_ROWS,
  MapSize,
  ClimateType as LandscapeClimate
} from '../../constants/specialMaps/specialMapAugmentation';

// Map size configurations - NEW SIMPLIFIED SIZES
const MAP_SIZES = {
  xs: { width: 8, height: 8 },      // Tiny buildings, vessels
  small: { width: 10, height: 10 },  // Small spaces
  medium: { width: 16, height: 16 }, // Standard buildings
  large: { width: 20, height: 20 },  // Major complexes
  xl: { width: 25, height: 25 },     // Massive sites
  xxl: { width: 32, height: 32 }     // Modern government complexes
};

/**
 * Main entry point for generating special maps
 */
/**
 * Determine appropriate map size based on archetype and era
 */
function determineMapSize(archetype: SpecialMapArchetype, era: HistoricalEra, specificYear?: number): MapSize {
  // Era-based defaults
  const eraDefaults: Record<HistoricalEra, MapSize> = {
    [HistoricalEra.PREHISTORY]: 'xs',
    [HistoricalEra.ANTIQUITY]: 'small',
    [HistoricalEra.MEDIEVAL]: 'medium',
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: 'large',
    [HistoricalEra.INDUSTRIAL_ERA]: 'large',
    [HistoricalEra.MODERN_ERA]: 'xl',
    [HistoricalEra.FUTURE_ERA]: 'xl'
  };
  
  // Archetype-specific overrides
  const archetypeOverrides: Partial<Record<SpecialMapArchetype, { min: MapSize, max: MapSize }>> = {
    // Government forums need more space, especially modern ones
    [SpecialMapArchetype.GOVERNMENT_FORUM]: { 
      min: 'large', 
      max: era === HistoricalEra.MODERN_ERA || era === HistoricalEra.INDUSTRIAL_ERA ? 'xxl' : 'xl' 
    },
    // Estates scale dramatically with era
    [SpecialMapArchetype.ESTATES]: { min: 'xs', max: 'xl' },
    [SpecialMapArchetype.PALACE_COMPLEX]: { min: 'xs', max: 'xl' },
    // Vessels are constrained
    [SpecialMapArchetype.VESSEL]: { min: 'xs', max: 'small' },
    // Campgrounds are temporary
    [SpecialMapArchetype.CAMPGROUND]: { min: 'xs', max: 'medium' },
    // Restaurants/inns are modest
    [SpecialMapArchetype.RESTAURANT_INN]: { min: 'small', max: 'medium' },
    // Open fields can be any size
    [SpecialMapArchetype.OPEN_FIELD]: { min: 'xs', max: 'xl' },
    // Markets scale with city size
    [SpecialMapArchetype.MARKET_BAZAAR]: { min: 'small', max: 'xl' },
    [SpecialMapArchetype.EXHIBITION]: { min: 'medium', max: 'xl' },
    // Universities grow over time
    [SpecialMapArchetype.UNIVERSITY]: { min: 'small', max: 'large' },
    // Entertainment venues
    [SpecialMapArchetype.THEATER]: { min: 'small', max: 'large' },
    [SpecialMapArchetype.ARENA]: { min: 'medium', max: 'large' },
    // Military/sacred stay medium to large
    [SpecialMapArchetype.MILITARY_FORTRESS]: { min: 'medium', max: 'large' },
    [SpecialMapArchetype.SACRED_COMPLEX]: { min: 'small', max: 'large' }
  };
  
  let baseSize = eraDefaults[era] || 'medium';
  
  // Apply archetype constraints
  const constraints = archetypeOverrides[archetype];
  if (constraints) {
    const sizeOrder: MapSize[] = ['xs', 'small', 'medium', 'large', 'xl'];
    const baseIndex = sizeOrder.indexOf(baseSize);
    const minIndex = sizeOrder.indexOf(constraints.min);
    const maxIndex = sizeOrder.indexOf(constraints.max);
    
    // Clamp to allowed range
    if (baseIndex < minIndex) {
      baseSize = constraints.min;
    } else if (baseIndex > maxIndex) {
      baseSize = constraints.max;
    }
  }
  
  // Special case: prehistoric always tiny except open fields
  if (era === HistoricalEra.PREHISTORY && archetype !== SpecialMapArchetype.OPEN_FIELD) {
    return 'xs';
  }
  
  return baseSize;
}

export function generateSpecialMap(
  seed: number,
  config: SpecialMapConfig,
  parentMapData: {
    mapAreaName: string;
    structureId: string;
    structureType: string;
    returnCoordinates: [number, number];
    climate?: ClimateType;
  }
): SpecialMapData {
  console.log(`[SpecialMapGen] ======= SPECIAL MAP GENERATION START =======`);
  console.log(`[SpecialMapGen] Generating ${config.archetype} for ${config.culturalZone} in ${config.era}`);
  console.log(`[SpecialMapGen] Full config:`, config);
  console.log(`[SpecialMapGen] Parent map data:`, parentMapData);
  
  // Ensure we have a valid climate
  const climate = config.climate || parentMapData.climate || ClimateType.TEMPERATE;
  console.log(`[SpecialMapGen] Using climate: ${climate}`);
  
  // Determine map size based on era and archetype if not specified
  if (!config.mapSize) {
    config.mapSize = determineMapSize(config.archetype, config.era, config.specificYear);
    console.log(`[SpecialMapGen] Determined mapSize: ${config.mapSize} for era ${config.era} and archetype ${config.archetype}`);
  }
  
  const size = MAP_SIZES[config.mapSize];
  const noise = new ValueNoise(seed);
  
  // Initialize tile array with proper x,y coordinates
  let tiles: Tile[][] = Array(size.height).fill(null).map((_, y) => 
    Array(size.width).fill(null).map((_, x) => {
      const tile = createBaseTile();
      tile.x = x;
      tile.y = y;
      return tile;
    })
  );
  
  // Generate based on archetype
  let interactionZones: InteractionZone[] = [];
  let exitZones: ExitZone[] = [];
  let rooms: RoomDefinition[] = [];
  let multiTileObjects: any[] = [];
  let generatedData: { tiles: Tile[][], interactionZones: InteractionZone[], exitZones: ExitZone[], rooms?: RoomDefinition[] };
  
  // Ensure landscape settings are properly configured
  if (config.hasLandscape === undefined) {
    config.hasLandscape = true; // Default to having landscape for estates
  }
  
  if (config.hasLandscape && !config.landscapeClimate) {
    // Map ClimateType to landscape climate string
    const climateMap: Record<ClimateType, string> = {
      [ClimateType.ARCTIC]: 'cold',
      [ClimateType.SUBARCTIC]: 'cold', 
      [ClimateType.TEMPERATE]: 'temperate',
      [ClimateType.MEDITERRANEAN]: 'mediterranean',
      [ClimateType.ARID]: 'arid',
      [ClimateType.SEMIARID]: 'arid',
      [ClimateType.TROPICAL]: 'tropical',
      [ClimateType.OCEANIC]: 'ocean'
    };
    config.landscapeClimate = climateMap[climate] || 'temperate';
  }
  
  switch (config.archetype) {
    case SpecialMapArchetype.PALACE_COMPLEX:
      // Legacy palace complex - redirect to estates
      config.archetype = SpecialMapArchetype.ESTATES;
      generatedData = generateEstates(tiles, config, noise, size);
      tiles = generatedData.tiles;
      interactionZones = generatedData.interactionZones;
      exitZones = generatedData.exitZones;
      rooms = generatedData.rooms || [];
      break;
      
    case SpecialMapArchetype.MARKET_BAZAAR:
    case SpecialMapArchetype.MARKET_EXHIBITION:  // New simplified archetype
      generatedData = generateMarketBazaar(tiles, config, noise, size);
      tiles = generatedData.tiles;
      interactionZones = generatedData.interactionZones;
      exitZones = generatedData.exitZones;
      rooms = generatedData.rooms || [];
      multiTileObjects = (generatedData as any).multiTileObjects || [];
      break;
      
    case SpecialMapArchetype.GOVERNMENT_FORUM:
    case SpecialMapArchetype.GOVERNMENT:  // New simplified archetype
      // Use fixed government forum with proper organization
      generatedData = generateGovernmentForumFixed(tiles, config, noise, size);
      tiles = generatedData.tiles;
      interactionZones = generatedData.interactionZones;
      exitZones = generatedData.exitZones;
      rooms = generatedData.rooms || [];
      multiTileObjects = (generatedData as any).multiTileObjects || [];
      break;
      
    case SpecialMapArchetype.SACRED_COMPLEX:
      generatedData = generateSacredComplex(tiles, config, noise, size);
      tiles = generatedData.tiles;
      interactionZones = generatedData.interactionZones;
      exitZones = generatedData.exitZones;
      break;
      
    case SpecialMapArchetype.MILITARY_FORTRESS:
      // Military fortresses should be on standard map, fallback to estates
      generatedData = generateEstates(tiles, config, noise, size);
      tiles = generatedData.tiles;
      interactionZones = generatedData.interactionZones;
      exitZones = generatedData.exitZones;
      rooms = generatedData.rooms || [];
      break;
      
    case SpecialMapArchetype.UNIVERSITY:
    case SpecialMapArchetype.UNIVERSITY_MONASTERY:  // New simplified archetype
      // Use new V2 generator with overlay system
      generatedData = generateUniversityAcademy(tiles, config, noise, size);
      tiles = generatedData.tiles;
      interactionZones = generatedData.interactionZones;
      exitZones = generatedData.exitZones;
      rooms = generatedData.rooms || [];
      break;
      
    case SpecialMapArchetype.THEATER:
    case SpecialMapArchetype.ARENA_THEATER:  // New simplified archetype - defaults to theater
      generatedData = generateTheater(tiles, config, noise, size);
      tiles = generatedData.tiles;
      interactionZones = generatedData.interactionZones;
      exitZones = generatedData.exitZones;
      break;
      
    case SpecialMapArchetype.ARENA:
      generatedData = generateArena(tiles, config, noise, size);
      tiles = generatedData.tiles;
      interactionZones = generatedData.interactionZones;
      exitZones = generatedData.exitZones;
      break;
      
    case SpecialMapArchetype.EXHIBITION:
      generatedData = generateExhibition(tiles, config, noise, size);
      tiles = generatedData.tiles;
      interactionZones = generatedData.interactionZones;
      exitZones = generatedData.exitZones;
      break;
      
    case SpecialMapArchetype.OPEN_FIELD:
      generatedData = generateOpenField(tiles, config, noise, size);
      tiles = generatedData.tiles;
      interactionZones = generatedData.interactionZones;
      exitZones = generatedData.exitZones;
      break;
      
    case SpecialMapArchetype.VESSEL:
      generatedData = generateVessel(tiles, config, noise, size);
      tiles = generatedData.tiles;
      interactionZones = generatedData.interactionZones;
      exitZones = generatedData.exitZones;
      break;
      
    case SpecialMapArchetype.CAMPGROUND:
      generatedData = generateCampground(tiles, config, noise, size);
      tiles = generatedData.tiles;
      interactionZones = generatedData.interactionZones;
      exitZones = generatedData.exitZones;
      break;
      
    case SpecialMapArchetype.RESTAURANT_INN:
      generatedData = generateRestaurantInn(tiles, config, noise, size);
      tiles = generatedData.tiles;
      interactionZones = generatedData.interactionZones;
      exitZones = generatedData.exitZones;
      rooms = generatedData.rooms || [];
      break;
      
    // New simplified archetypes
    case SpecialMapArchetype.ESTATES:
      generatedData = generateEstates(tiles, config, noise, size);
      tiles = generatedData.tiles;
      interactionZones = generatedData.interactionZones;
      exitZones = generatedData.exitZones;
      rooms = generatedData.rooms || [];
      break;
      
    default:
      console.warn(`[SpecialMapGen] Archetype ${config.archetype} not yet implemented`);
      generateDefaultLayout(tiles, size);
  }
  
  // Generate NPCs for the special map with room awareness
  const npcs = generateSpecialMapNpcs(
    config,
    size,
    noise,
    tiles,
    rooms
  );
  
  // Create special map data
  const specialMapData: SpecialMapData = {
    // Base MapData fields
    width: size.width,
    height: size.height,
    tiles,
    seed,
    archetype: null as any, // Special maps don't use standard archetypes
    climate: climate,
    edgeDataSet: { north: null, south: null, east: null, west: null },
    
    // Special map specific fields
    mapType: 'special',
    specialArchetype: config.archetype,
    specialConfig: config,
    
    parentLocation: {
      mapAreaName: parentMapData.mapAreaName,
      structureId: parentMapData.structureId,
      structureType: parentMapData.structureType,
      returnCoordinates: parentMapData.returnCoordinates
    },
    
    biomeInterpretations: createBiomeInterpretations(config),
    interactionZones,
    exitZones,
    rooms,
    multiTileObjects,
    displayName: getSpecialMapDisplayName(config),
    
    historicalMetadata: createHistoricalMetadata(config),
    
    // Populate with generated NPCs
    terrainStructures: [],
    npcs,
    animals: [],
    vegetation: []
  };
  
  return specialMapData;
}

/**
 * Create a basic tile with floor
 */
function createBaseTile(): Tile {
  return {
    x: 0,
    y: 0,
    isLand: true,
    biome: BiomeType.FLOOR_STONE,
    altitude: 0,
    isExplored: true,  // Special maps start explored
    temperature: 20,
    humidity: 50,
    hasRiver: false,
    hasRoad: false,
    hasTownCenter: false,
    wallDirection: null,
    structureId: null,
    materialSubtype: null,
    qualities: {
      defensibility: 0,
      fertility: 0,
      accessibility: 1,
      visibility: 1,
      resources: 0
    }
  };
}

/**
 * Generate a default layout when archetype not implemented
 */
function generateDefaultLayout(tiles: Tile[][], size: { width: number, height: number }) {
  // Create perimeter walls
  for (let y = 0; y < size.height; y++) {
    for (let x = 0; x < size.width; x++) {
      if (x === 0 || x === size.width - 1 || y === 0 || y === size.height - 1) {
        tiles[y][x].biome = BiomeType.WALL;
      } else {
        tiles[y][x].biome = BiomeType.FLOOR_STONE;
      }
      tiles[y][x].x = x;
      tiles[y][x].y = y;
    }
  }
  
  // Add gates
  tiles[size.height - 1][Math.floor(size.width / 2)].biome = BiomeType.WALL_GATE;
  tiles[0][Math.floor(size.width / 2)].biome = BiomeType.WALL_GATE;
}

/**
 * Get display name for special map based on archetype and culture
 */
function getSpecialMapDisplayName(config: SpecialMapConfig): string {
  const { archetype, culturalZone, era, structureName } = config;
  
  // Special case: Vessel maps should always be "Your Ship"
  if (archetype === SpecialMapArchetype.VESSEL) {
    return "Your Ship";
  }
  
  // First priority: Use the structureName from the config if provided
  // This comes from governmentDistricts.ts and is already historically accurate
  if (structureName) {
    return structureName;
  }
  
  // Second priority: Use era-appropriate fallback names
  return getEraAppropriateName(archetype, culturalZone as CulturalZone, era);
}

/**
 * Create biome interpretations based on cultural zone and era
 */
function createBiomeInterpretations(config: SpecialMapConfig): Map<BiomeType, string> {
  const interpretations = new Map<BiomeType, string>();
  
  // Wall interpretations
  if (config.culturalZone === 'EAST_ASIAN' && config.region === 'japan') {
    interpretations.set(BiomeType.WALL, 'Paper screens (shoji)');
    interpretations.set(BiomeType.FLOOR_WOOD, 'Tatami mats');
  } else if (config.culturalZone === 'MENA') {
    interpretations.set(BiomeType.WALL, 'Mud brick walls');
    interpretations.set(BiomeType.FLOOR_TILE, 'Geometric tile patterns');
  } else if (config.culturalZone === 'EUROPEAN') {
    if (config.era === HistoricalEra.MEDIEVAL) {
      interpretations.set(BiomeType.WALL, 'Stone walls with tapestries');
      interpretations.set(BiomeType.FLOOR_STONE, 'Flagstone floors');
    } else if (config.era === HistoricalEra.RENAISSANCE_EARLY_MODERN) {
      interpretations.set(BiomeType.WALL, 'Decorated plaster walls');
      interpretations.set(BiomeType.FLOOR_MARBLE, 'Marble floors');
    }
  }
  
  return interpretations;
}

/**
 * Create historical metadata for the special map
 */
function createHistoricalMetadata(config: SpecialMapConfig) {
  const metadata = {
    architecturalStyle: '',
    constructionPeriod: [0, 0] as [number, number],
    primaryMaterials: [] as string[],
    culturalInfluences: [config.culturalZone]
  };
  
  // Set architectural style based on zone and era
  if (config.culturalZone === 'EUROPEAN') {
    if (config.era === HistoricalEra.ANTIQUITY) {
      metadata.architecturalStyle = 'Classical';
      metadata.primaryMaterials = ['marble', 'limestone'];
    } else if (config.era === HistoricalEra.MEDIEVAL) {
      metadata.architecturalStyle = 'Romanesque/Gothic';
      metadata.primaryMaterials = ['stone', 'wood', 'iron'];
    } else if (config.era === HistoricalEra.RENAISSANCE_EARLY_MODERN) {
      metadata.architecturalStyle = 'Baroque';
      metadata.primaryMaterials = ['marble', 'plaster', 'gold leaf'];
    } else if (config.era === HistoricalEra.INDUSTRIAL_ERA) {
      metadata.architecturalStyle = 'Neoclassical';
      metadata.primaryMaterials = ['stone', 'iron', 'glass'];
    } else if (config.era === HistoricalEra.MODERN_ERA) {
      metadata.architecturalStyle = 'Modern';
      metadata.primaryMaterials = ['concrete', 'steel', 'glass'];
    }
  } else if (config.culturalZone === 'EAST_ASIAN') {
    if (config.era === HistoricalEra.MEDIEVAL) {
      metadata.architecturalStyle = 'Tang/Song Dynasty';
      metadata.primaryMaterials = ['wood', 'ceramic tile', 'paper'];
    } else if (config.era === HistoricalEra.RENAISSANCE_EARLY_MODERN) {
      metadata.architecturalStyle = 'Ming/Qing Dynasty';
      metadata.primaryMaterials = ['wood', 'ceramic', 'lacquer'];
    }
    if (config.region === 'japan') {
      metadata.architecturalStyle = 'Japanese ' + (config.era === HistoricalEra.MEDIEVAL ? 'Heian' : 'Edo');
      metadata.primaryMaterials = ['wood', 'paper', 'tatami'];
    }
  } else if (config.culturalZone === 'MENA') {
    if (config.era === HistoricalEra.MEDIEVAL) {
      metadata.architecturalStyle = 'Islamic';
      metadata.primaryMaterials = ['mud brick', 'tile', 'plaster'];
    } else if (config.era === HistoricalEra.RENAISSANCE_EARLY_MODERN) {
      metadata.architecturalStyle = 'Ottoman';
      metadata.primaryMaterials = ['stone', 'marble', 'ceramic'];
    }
  }
  
  // Set construction period based on era
  const eraPeriods: Record<HistoricalEra, [number, number]> = {
    [HistoricalEra.PREHISTORY]: [-3000, -500],
    [HistoricalEra.ANTIQUITY]: [-500, 500],
    [HistoricalEra.MEDIEVAL]: [500, 1500],
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [1500, 1800],
    [HistoricalEra.INDUSTRIAL_ERA]: [1800, 1950],
    [HistoricalEra.MODERN_ERA]: [1950, 2024],
    [HistoricalEra.FUTURE_ERA]: [2024, 2100]
  };
  
  metadata.constructionPeriod = config.specificYear 
    ? [config.specificYear, config.specificYear + 50]
    : eraPeriods[config.era];
  
  return metadata;
}

/**
 * Utility function to place a rectangular wall
 */
export function placeWallRectangle(
  tiles: Tile[][],
  x: number,
  y: number,
  width: number,
  height: number,
  gatePositions?: { side: 'north' | 'south' | 'east' | 'west', offset: number }[]
) {
  // Place walls
  for (let dy = 0; dy < height; dy++) {
    for (let dx = 0; dx < width; dx++) {
      if (dx === 0 || dx === width - 1 || dy === 0 || dy === height - 1) {
        const tileY = y + dy;
        const tileX = x + dx;
        if (tileY >= 0 && tileY < tiles.length && tileX >= 0 && tileX < tiles[0].length && tiles[tileY][tileX]) {
          tiles[tileY][tileX].biome = BiomeType.WALL;
          tiles[tileY][tileX].x = tileX;
          tiles[tileY][tileX].y = tileY;
        }
      }
    }
  }
  
  // Place gates
  if (gatePositions) {
    gatePositions.forEach(gate => {
      let gateX = x, gateY = y;
      
      switch (gate.side) {
        case 'north':
          gateX = x + gate.offset;
          gateY = y;
          break;
        case 'south':
          gateX = x + gate.offset;
          gateY = y + height - 1;
          break;
        case 'east':
          gateX = x + width - 1;
          gateY = y + gate.offset;
          break;
        case 'west':
          gateX = x;
          gateY = y + gate.offset;
          break;
      }
      
      if (gateY >= 0 && gateY < tiles.length && gateX >= 0 && gateX < tiles[0].length && tiles[gateY][gateX]) {
        tiles[gateY][gateX].biome = BiomeType.WALL_GATE;
        tiles[gateY][gateX].x = gateX;
        tiles[gateY][gateX].y = gateY;
      }
    });
  }
}

/**
 * Fill an area with a specific biome
 */
export function fillArea(
  tiles: Tile[][],
  x: number,
  y: number,
  width: number,
  height: number,
  biome: BiomeType
) {
  for (let dy = 0; dy < height; dy++) {
    for (let dx = 0; dx < width; dx++) {
      const tileY = y + dy;
      const tileX = x + dx;
      if (tileY >= 0 && tileY < tiles.length && tileX >= 0 && tileX < tiles[0].length && tiles[tileY][tileX]) {
        tiles[tileY][tileX].biome = biome;
        tiles[tileY][tileX].x = tileX;
        tiles[tileY][tileX].y = tileY;
      }
    }
  }
}
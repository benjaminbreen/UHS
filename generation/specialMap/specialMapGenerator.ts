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
import { generatePalaceComplex } from './archetypes/palaceGenerator';
import { generateEnhancedPalaceComplex } from './archetypes/palaceGeneratorEnhanced';
import { generateMarketBazaar } from './archetypes/marketGenerator';
import { generateGovernmentForum } from './archetypes/governmentGenerator';
import { generateSacredComplex } from './archetypes/sacredGenerator';
import { generateMilitaryFortress } from './archetypes/fortressGenerator';
import { generateUniversityAcademy } from './archetypes/universityGenerator';
import { generateTheater } from './archetypes/theaterGenerator';
import { generateArena } from './archetypes/arenaGenerator';
import { generateExhibition } from './archetypes/exhibitionGenerator';
import { generateOpenField } from './archetypes/openFieldGenerator';
import { generateSpecialMapNpcs } from './specialMapNpcGenerator';

// Map size configurations
const MAP_SIZES = {
  small: { width: 40, height: 30 },
  medium: { width: 50, height: 35 },
  large: { width: 60, height: 40 },
  huge: { width: 80, height: 60 }
};

/**
 * Main entry point for generating special maps
 */
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
  console.log(`[SpecialMapGen] Generating ${config.archetype} for ${config.culturalZone} in ${config.era}`);
  
  // Ensure we have a valid climate
  const climate = config.climate || parentMapData.climate || ClimateType.TEMPERATE;
  console.log(`[SpecialMapGen] Using climate: ${climate}`);
  
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
  let generatedData: { tiles: Tile[][], interactionZones: InteractionZone[], exitZones: ExitZone[], rooms?: RoomDefinition[] };
  
  switch (config.archetype) {
    case SpecialMapArchetype.PALACE_COMPLEX:
      // Use enhanced palace generator for more beautiful, realistic palaces
      generatedData = generateEnhancedPalaceComplex(tiles, config, noise, size);
      tiles = generatedData.tiles;
      interactionZones = generatedData.interactionZones;
      exitZones = generatedData.exitZones;
      rooms = generatedData.rooms || [];
      break;
      
    case SpecialMapArchetype.MARKET_BAZAAR:
      generatedData = generateMarketBazaar(tiles, config, noise, size);
      tiles = generatedData.tiles;
      interactionZones = generatedData.interactionZones;
      exitZones = generatedData.exitZones;
      break;
      
    case SpecialMapArchetype.GOVERNMENT_FORUM:
      generatedData = generateGovernmentForum(tiles, config, noise, size);
      tiles = generatedData.tiles;
      interactionZones = generatedData.interactionZones;
      exitZones = generatedData.exitZones;
      break;
      
    case SpecialMapArchetype.SACRED_COMPLEX:
      generatedData = generateSacredComplex(tiles, config, noise, size);
      tiles = generatedData.tiles;
      interactionZones = generatedData.interactionZones;
      exitZones = generatedData.exitZones;
      break;
      
    case SpecialMapArchetype.MILITARY_FORTRESS:
      generatedData = generateMilitaryFortress(tiles, config, noise, size);
      tiles = generatedData.tiles;
      interactionZones = generatedData.interactionZones;
      exitZones = generatedData.exitZones;
      break;
      
    case SpecialMapArchetype.UNIVERSITY:
      generatedData = generateUniversityAcademy(tiles, config, noise, size);
      tiles = generatedData.tiles;
      interactionZones = generatedData.interactionZones;
      exitZones = generatedData.exitZones;
      break;
      
    case SpecialMapArchetype.THEATER:
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
      
    default:
      console.warn(`[SpecialMapGen] Archetype ${config.archetype} not yet implemented`);
      generateDefaultLayout(tiles, size);
  }
  
  // Generate NPCs for the special map
  const npcs = generateSpecialMapNpcs(
    config,
    size,
    noise,
    tiles
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
  const { archetype, culturalZone, era } = config;
  
  switch (archetype) {
    case SpecialMapArchetype.PALACE_COMPLEX:
      if (culturalZone === 'EAST_ASIAN') return 'Imperial Palace';
      if (culturalZone === 'MENA') return 'Sultan\'s Palace';
      if (culturalZone === 'EUROPEAN' && era === HistoricalEra.MEDIEVAL) return 'Royal Castle';
      if (culturalZone === 'EUROPEAN') return 'Royal Palace';
      return 'Palace Complex';
      
    case SpecialMapArchetype.MARKET_BAZAAR:
      if (culturalZone === 'MENA') return 'Grand Bazaar';
      if (culturalZone === 'EAST_ASIAN') return 'Market District';
      if (era === HistoricalEra.MEDIEVAL) return 'Medieval Market';
      return 'Marketplace';
      
    case SpecialMapArchetype.GOVERNMENT_FORUM:
      if (culturalZone === 'EUROPEAN' && era === HistoricalEra.ANTIQUITY) return 'Roman Forum';
      if (culturalZone === 'EAST_ASIAN') return 'Administrative Complex';
      return 'Government Building';
      
    case SpecialMapArchetype.SACRED_COMPLEX:
      if (culturalZone === 'MENA') return 'Grand Mosque';
      if (culturalZone === 'EUROPEAN' && era === HistoricalEra.MEDIEVAL) return 'Cathedral';
      if (culturalZone === 'EAST_ASIAN') return 'Temple Complex';
      return 'Sacred Site';
      
    default:
      return 'Special Location';
  }
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
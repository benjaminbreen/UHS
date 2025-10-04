/**
 * types/specialMapTypes.ts - Type definitions for Special Maps
 * Special Maps are interior or focused outdoor spaces that use the tile system
 */

import { MapData, BiomeType, CulturalZone, HistoricalEra, ClimateType } from './index';

/**
 * Types of special map archetypes
 */
// Re-export SpecialMapArchetype from enums.ts (zero-dependency file)
export { SpecialMapArchetype } from './enums';

/**
 * New architectural biome types for special maps
 */
export enum ArchitecturalBiome {
  // Structural
  WALL = 'WALL',
  WALL_GATE = 'WALL_GATE',
  WALL_WINDOW = 'WALL_WINDOW',
  DOOR = 'DOOR',
  DOOR_LOCKED = 'DOOR_LOCKED',
  ARCHWAY = 'ARCHWAY',
  
  // Floors - Basic
  FLOOR_STONE = 'FLOOR_STONE',
  FLOOR_WOOD = 'FLOOR_WOOD',
  FLOOR_MARBLE = 'FLOOR_MARBLE',
  FLOOR_TILE = 'FLOOR_TILE',
  FLOOR_CARPET = 'FLOOR_CARPET',
  
  // Floors - Decorative
  FLOOR_MOSAIC = 'FLOOR_MOSAIC',
  FLOOR_MOSAIC_CENTER = 'FLOOR_MOSAIC_CENTER',
  FLOOR_MOSAIC_BORDER = 'FLOOR_MOSAIC_BORDER',
  FLOOR_PATTERN = 'FLOOR_PATTERN',
  FLOOR_CHECKERED = 'FLOOR_CHECKERED',
  
  // Furniture - Seating
  TABLE = 'TABLE',
  CHAIR = 'CHAIR',
  BENCH = 'BENCH',
  THRONE = 'THRONE',
  DESK = 'DESK',
  PODIUM = 'PODIUM',
  
  // Furniture - Storage
  BOOKSHELF = 'BOOKSHELF',
  CABINET = 'CABINET',
  CHEST = 'CHEST',
  SHELF = 'SHELF',
  COAT_RACK = 'COAT_RACK',
  
  // Additional Architectural
  DAIS = 'DAIS',
  FIREPIT = 'FIREPIT',
  LIGHT_SOURCE = 'LIGHT_SOURCE',
  TENT = 'TENT',
  BERRY_BUSH = 'BERRY_BUSH',
  TORCH = 'TORCH',
  
  // Bathroom
  TOILET = 'TOILET',
  BASIN = 'BASIN',
  BATH = 'BATH',
  MIRROR = 'MIRROR',
  
  // Kitchen
  KITCHEN_STOVE = 'KITCHEN_STOVE',
  KITCHEN_COUNTER = 'KITCHEN_COUNTER',
  KITCHEN_SINK = 'KITCHEN_SINK',
  PANTRY = 'PANTRY',
  
  // Features
  COLUMN = 'COLUMN',
  FOUNTAIN = 'FOUNTAIN',
  STATUE = 'STATUE',
  PAVILION = 'PAVILION',
  ALTAR = 'ALTAR',
  STAGE = 'STAGE',
  PLANTER = 'PLANTER',
  RUG = 'RUG',
  
  // Office/Administrative
  FILING_CABINET = 'FILING_CABINET',
  DOCUMENT_TABLE = 'DOCUMENT_TABLE',
  SCROLL_RACK = 'SCROLL_RACK',
  SEAL_STAND = 'SEAL_STAND',
  
  // Security
  GUARD_POST = 'GUARD_POST',
  WEAPON_RACK = 'WEAPON_RACK',
  ARMOR_STAND = 'ARMOR_STAND',
  
  // Functional
  WORKSHOP = 'WORKSHOP',
  CELL = 'CELL',
  TREASURY = 'TREASURY',
  STAIRS_UP = 'STAIRS_UP',
  STAIRS_DOWN = 'STAIRS_DOWN'
}

/**
 * Map size configurations for special maps
 */
export interface SpecialMapSize {
  xs: { width: 8, height: 8 };        // Small buildings, vessels, prehistoric
  small: { width: 10, height: 10 };   // Temporary spaces
  medium: { width: 16, height: 16 };  // Standard buildings  
  large: { width: 20, height: 20 };   // Major complexes
  xl: { width: 25, height: 25 };      // Massive sites
}

/**
 * Configuration for special map generation
 */
export interface SpecialMapConfig {
  archetype: SpecialMapArchetype;
  mapSize: 'xs' | 'small' | 'medium' | 'large' | 'xl';
  culturalZone: CulturalZone;
  era: HistoricalEra;
  region?: string; // Specific region within cultural zone
  specificYear?: number; // For more precise historical accuracy
  climate?: ClimateType; // Climate from parent map
  structureId?: string; // ID of the structure on the main map
  structureName?: string; // Name of the structure (e.g., "Babylonian Royal Palace")
  
  // Authority context from government modal
  authorityContext?: {
    leader: {
      name: string;
      title: string;
      age: number;
      gender: 'Male' | 'Female';
      stats: any;
      appearance: any;
      portraitSeed: number;
      wealthLevel: string;
      culturalZone: string;
      personality?: any;
      socialContext?: any;
    };
    faction: {
      name: string;
      description: string;
      contextSentence?: string;
      color: string;
    };
    governmentType: string;
    districtType: string;
  };

  // New simplified system parameters
  isCircular?: boolean;        // Round structures (huts, amphitheaters)
  isRectangular?: boolean;     // Constrained rectangular (vessels)
  hasLandscape?: boolean;      // Add climate-appropriate border
  landscapeClimate?: 'arid' | 'temperate' | 'cold' | 'semitropical' | 'tropical' | 'ocean';
  floorMaterial?: 'white_marble' | 'grey_stone' | 'red_lacquer' | 'sandstone' | 'wood' | 'steel' | 'earth';
  wallMaterial?: 'white_marble' | 'grey_stone' | 'red_lacquer' | 'sandstone' | 'wood' | 'steel' | 'hide';
  furnitureMaterial?: 'white_marble' | 'grey_stone' | 'red_lacquer' | 'sandstone' | 'wood' | 'steel';
  innerMapType?: string;       // Type of interior map portal
  innerMapName?: string;       // Custom name for interior
  isPrivate?: boolean;         // Requires elite access
  density?: 'sparse' | 'normal' | 'dense';

  // Government type specification (from governmentDistricts.ts)
  districtType?: string;       // 'sacred_council', 'parliament', 'military_council', 'forum', 'palace', etc.
  
  // Legacy archetype-specific configurations (will be deprecated)
  concentricCourts?: number;
  hasGardens?: boolean;
  waterFeature?: 'ponds' | 'fountains' | 'canals' | 'none';
  restrictedAreas?: string[];
  colorScheme?: string;
  
  // Market
  layout?: 'organic-maze' | 'grid' | 'radial' | 'linear';
  coveredPercentage?: number;
  specializedZones?: string[];
  stallDensity?: 'low' | 'medium' | 'high' | 'extreme';
  
  // Government
  assemblyType?: 'amphitheater' | 'opposing-benches' | 'hemicycle' | 'great-hall';
  committeeRooms?: number;
  hasPublicGallery?: boolean;
  publicCapacity?: number;
  
  // Fortress
  fortType?: 'castle' | 'star' | 'bunker' | 'citadel';
  wallLayers?: number;
  underground?: boolean;
  defensiveFeatures?: string[];
  
  // Sacred
  religion?: string;
  sacredGeometry?: 'cross' | 'circular' | 'mandala' | 'cardinal';
  hasPilgrimageRoute?: boolean;
  hasMonasticQuarters?: boolean;
  
  // Custom features for any archetype
  customFeatures?: string[];
}

/**
 * Room definition for special maps
 */
export interface RoomDefinition {
  id: string;
  name: string;
  bounds: { x: number, y: number, width: number, height: number };
  description?: string;
  roomType: string; // Flexible room type for various architectures
  
  // Access control fields
  accessLevel?: 'public' | 'semi-public' | 'private' | 'restricted';
  allowedSocialClasses?: string[];
  professionFilter?: {
    whitelist?: string[];  // Specific professions allowed
    blacklist?: string[];  // Specific professions banned
    category?: ProfessionCategory[]; // Categories like 'nobility', 'clergy', 'military'
  };
  genderRestriction?: 'male' | 'female' | 'any';
  npcDensity?: 'empty' | 'sparse' | 'normal' | 'crowded';
  timeRestriction?: 'day' | 'night' | 'dawn' | 'dusk' | 'any';
}

// Re-export ProfessionCategory from enums.ts (zero-dependency file)
export { ProfessionCategory } from './enums';

/**
 * Extended MapData for special maps
 */
export interface SpecialMapData extends MapData {
  mapType: 'special';
  specialArchetype: SpecialMapArchetype;
  specialConfig: SpecialMapConfig;
  
  // Link back to parent map
  parentLocation: {
    mapAreaName: string;
    structureId: string;
    structureType: string;
    returnCoordinates: [number, number];
  };
  
  // Map all biomes (including new architectural ones) to their special map interpretations
  biomeInterpretations: Map<BiomeType | ArchitecturalBiome, string>;
  
  // Special interaction zones
  interactionZones: InteractionZone[];
  
  // Room definitions for tracking player location
  rooms: RoomDefinition[];
  
  // Multi-tile objects like tall pillars
  multiTileObjects?: any[];
  
  // Custom display name for this specific special map instance
  displayName?: string;
  
  // Historical metadata
  historicalMetadata: {
    architecturalStyle: string;
    constructionPeriod: [number, number];
    primaryMaterials: string[];
    culturalInfluences: CulturalZone[];
    historicalName?: string;
    notableEvents?: string[];
  };
  
  // Exit points
  exitZones: ExitZone[];
}

/**
 * Zone where special interactions can occur
 */
export interface InteractionZone {
  id: string;
  bounds: { x: number, y: number, width: number, height: number };
  type: string; // Flexible interaction type for various architectures
  interactions: string[];
  requiredStatus?: string[]; // e.g., 'noble', 'citizen', 'merchant'
}

/**
 * Exit point from special map
 */
export interface ExitZone {
  id: string;
  location: [number, number];
  label: string;
  destination: string; // Flexible destination type for interior maps
  adjacentMapId?: string;
}

/**
 * Government district can have multiple special maps
 */
export interface GovernmentDistrictConfig {
  mapAreaName: string;
  era: HistoricalEra;
  availableArchetypes: SpecialMapArchetype[];
  historicalExamples: {
    archetype: SpecialMapArchetype;
    name: string;
    description: string;
    yearRange: [number, number];
  }[];
}

/**
 * Links map areas to their special map configurations
 */
export interface SpecialMapRegistry {
  [mapAreaName: string]: {
    [era: string]: GovernmentDistrictConfig;
  };
}
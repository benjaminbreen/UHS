/**
 * types/specialMapTypes.ts - Type definitions for Special Maps
 * Special Maps are interior or focused outdoor spaces that use the tile system
 */

import { MapData, BiomeType, CulturalZone, HistoricalEra, ClimateType } from './index';

/**
 * Types of special map archetypes
 */
export enum SpecialMapArchetype {
  PALACE_COMPLEX = 'PALACE_COMPLEX',
  MARKET_BAZAAR = 'MARKET_BAZAAR',
  GOVERNMENT_FORUM = 'GOVERNMENT_FORUM',
  MILITARY_FORTRESS = 'MILITARY_FORTRESS',
  SACRED_COMPLEX = 'SACRED_COMPLEX',
  UNIVERSITY = 'UNIVERSITY',
  THEATER = 'THEATER',
  ARENA = 'ARENA',
  EXHIBITION = 'EXHIBITION',
  OPEN_FIELD = 'OPEN_FIELD'
}

/**
 * New architectural biome types for special maps
 */
export enum ArchitecturalBiome {
  // Structural
  WALL = 'WALL',
  WALL_GATE = 'WALL_GATE',
  FLOOR_STONE = 'FLOOR_STONE',
  FLOOR_WOOD = 'FLOOR_WOOD',
  FLOOR_MARBLE = 'FLOOR_MARBLE',
  FLOOR_TILE = 'FLOOR_TILE',
  
  // Furniture
  TABLE = 'TABLE',
  CHAIR = 'CHAIR',
  BED = 'BED',
  THRONE = 'THRONE',
  
  // Features
  COLUMN = 'COLUMN',
  FOUNTAIN = 'FOUNTAIN',
  STATUE = 'STATUE',
  PAVILION = 'PAVILION',
  ALTAR = 'ALTAR',
  STAGE = 'STAGE',
  
  // Functional
  BOOKSHELF = 'BOOKSHELF',
  WORKSHOP = 'WORKSHOP',
  KITCHEN = 'KITCHEN',
  CELL = 'CELL',
  TREASURY = 'TREASURY',
  BATH = 'BATH'
}

/**
 * Map size configurations for special maps
 */
export interface SpecialMapSize {
  small: { width: 40, height: 30 };   // Intimate spaces
  medium: { width: 50, height: 35 };  // Default
  large: { width: 60, height: 40 };   // Complex spaces
  huge: { width: 80, height: 60 };    // Vast areas
}

/**
 * Configuration for special map generation
 */
export interface SpecialMapConfig {
  archetype: SpecialMapArchetype;
  mapSize: 'small' | 'medium' | 'large' | 'huge';
  culturalZone: CulturalZone;
  era: HistoricalEra;
  region?: string; // Specific region within cultural zone
  specificYear?: number; // For more precise historical accuracy
  climate?: ClimateType; // Climate from parent map
  
  // Archetype-specific configurations
  // Palace
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
  roomType: 'throne_room' | 'courtyard' | 'hall' | 'chamber' | 'garden' | 
            'corridor' | 'marketplace' | 'assembly' | 'sanctuary' | 'armory' | 
            'library' | 'treasury' | 'entrance' | 'gallery' | 'workshop';
}

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
  type: 'throne' | 'altar' | 'stage' | 'auction' | 'council' | 'market';
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
  destination: 'parent_map' | 'adjacent_special_map';
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
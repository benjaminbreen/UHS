/**
 * types/core/map.ts - Core Map type definitions for the Spice Trader Map Generator
 */
import { Tile, PathType } from './tile'; // Added PathType import
import { ClimateType } from '../biomes/climate';
import { BiomeType } from '../biomes/base';
import { AnimalEntity } from '../animalTypes';
import { NpcEntity } from '../npcTypes';
import { VegetationEntity } from '../vegetationTypes';
import { TerrainStructure } from '../structures';
import { Season } from '../ui';
import { TimeOfDay } from '../ambiance';
import { WeatherState } from '../../services/weatherService';
import { Item } from '../index';

// Re-export MapArchetype from enums.ts (zero-dependency file)
export { MapArchetype } from '../enums';

/**
 * Information for a single tile on the edge of a map segment.
 */
export interface EdgeTileInfo {
  isLand: boolean;
  biome: BiomeType;
  altitude: number;
  hasRailroad?: boolean; // True if railroad crosses this edge tile
  railroadDirection?: 'N' | 'S' | 'E' | 'W' | 'NE' | 'NW' | 'SE' | 'SW'; // Direction railroad is heading
}

/**
 * Stores the edge data for all four sides of a map segment.
 */
export interface EdgeDataSet {
  north: EdgeTileInfo[] | null; // Tiles along the northern edge (y=0)
  east: EdgeTileInfo[] | null;  // Tiles along the eastern edge (x=WIDTH-1)
  south: EdgeTileInfo[] | null; // Tiles along the southern edge (y=HEIGHT-1)
  west: EdgeTileInfo[] | null;  // Tiles along the western edge (x=0)
}

/**
 * Represents the relevant edge data from neighboring map segments.
 */
export interface NeighboringEdges {
  north?: EdgeTileInfo[]; // Data from the southern edge of the northern neighbor
  east?: EdgeTileInfo[];  // Data from the western edge of the eastern neighbor
  south?: EdgeTileInfo[]; // Data from the northern edge of the southern neighbor
  west?: EdgeTileInfo[];  // Data from the eastern edge of the western neighbor
}

/**
 * PathObject interface for storing SVG path data and rendering properties.
 */
export interface PathObject {
  id: string;       // Unique ID for the path (e.g., "road-0", "path-1")
  type: PathType;   // ROAD or PATH
  svgD: string;     // The 'd' attribute string for an SVG <path> element
  strokeWidth: number;
  strokeColor: string;
  opacity: number;
  strokeDasharray?: string; // Optional property for dashed lines (e.g., for fences)
}

/**
 * Represents the main city of a map area, if one exists.
 */
export interface CityInfo {
  name: string;
  population: number;
  allegiance: string;
  description: string;
  isHistorical: boolean;
  languages: string[];
  founded: string;
  history: string;
  // Additional fields from cities.ts data
  foundingYear?: number;
  populationPeak?: number;
  urbanDensity?: 'small' | 'moderate' | 'large' | 'massive';
  economicFocus?: string[];
  declineYear?: number;
}

/**
 * Represents a procedurally named marketplace.
 */
export interface MarketplaceInfo {
    name: string;
    x: number;
    y: number;
}

/**
 * Complete map data structure containing all generated information
 */
export interface MapData {
  width: number;
  height: number;
  tiles: Tile[][];
  seed: number;
  archetype: MapArchetype;
  climate: ClimateType;
  edgeDataSet: EdgeDataSet; 
  harborSide?: number;
  continent?: string; 
  region?: string;
  timeSlice?: string; 
  season?: Season;
  localArea?: string;
  mapAreaName?: string; // Used for special rendering detection
  culturalZone?: string; // Cultural zone for historical accuracy
  era?: string; // Historical era
  pathObjects?: PathObject[];
  terrainStructures?: TerrainStructure[];
  majorCity?: CityInfo;
  animals?: AnimalEntity[];
  npcs?: NpcEntity[];
  vegetation?: VegetationEntity[];
  marketplaces?: MarketplaceInfo[]; // NEW
  railroadJunctions?: Array<{x: number; y: number}>; // Railroad signal light positions
  trains?: Array<{
    id: string;
    path: Array<{x: number; y: number}>; // Route coordinates
    currentProgress: number; // 0-1 along path
    speed: number; // Tiles per second
    direction: 1 | -1; // Forward or backward
  }>;

  // Time and weather properties for NPC context
  timeOfDay?: TimeOfDay;
  dayOfYear?: number; // 1-365
  currentWeather?: WeatherState; // Actual weather state from weather service

  // Terrain modifications made by player actions
  terrainModifications?: {
    dugTiles?: Array<{x: number; y: number; timestamp: number}>;
    droppedItems?: Array<{x: number; y: number; item: Item; timestamp: number}>;
  };
}
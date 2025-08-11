/**
 * types/core/tile.ts - Core Tile type definitions for the Spice Trader Map Generator
 */

import { BiomeType } from '../biomes/base';
import { PathObject } from './map';
import { TerrainStructure } from '../structures';

/**
 * PathType enum to distinguish between roads and paths
 */
export enum PathType {
  ROAD = 'ROAD',
  PATH = 'PATH',
  FENCE = 'FENCE', // Added for Animal Paddocks
}

/**
 * TileQualities - Procedurally generated attributes that affect gameplay
 * All values are normalized between 0.0 and 1.0 for consistency
 */
export interface TileQualities {
  /** 
   * Flammability (0.0 - 1.0)
   * How likely this tile is to catch fire and spread flames
   * Higher values = more fire risk, lower values = fire resistant
   */
  flammability: number;
  
  /** 
   * Biodiversity (0.0 - 1.0) 
   * Richness of plant and animal life in this tile
   * Higher values = more species, better hunting/foraging
   */
  biodiversity: number;
  
  /** 
   * Healthiness (0.0 - 1.0)
   * How conducive this tile is to human health and longevity
   * Higher values = healthier, lower values = disease risk
   */
  healthiness: number;
  
  /** 
   * Sacrality (0.0 - 1.0)
   * Religious and cultural significance of this location
   * Higher values = more sacred, potential for temples/shrines
   */
  sacrality: number;
  
  /** 
   * Safety (0.0 - 1.0)
   * Overall danger level combining natural and human threats
   * Higher values = safer, lower values = more dangerous
   */
  safety: number;
  geologicalStress?: number; // How much tectonic stress the tile is under
  thermalActivity?: number; // Proximity to geothermal/volcanic heat
}

/**
 * Core Tile interface representing a single map cell
 * Now includes rich quality attributes for complex gameplay systems
 */
export interface Tile {
  x: number;
  y: number;
  altitude: number;
  biome: BiomeType;
  isLand: boolean;
  isCoast: boolean;
  qualities: TileQualities;
  vegetationId?: string; // ID of the vegetation entity on this tile
  pathObjectRef?: PathObject; // For pathfinding cost calculation
  // Optional properties for new features
  ruinType?: string; // For Ruins
  palaceType?: string; // For Palaces
  holyPlaceType?: string; // For Holy Places
  holyPlaceReligion?: string; // Specific religion of this holy place
  paddockType?: string; // For Animal Paddocks
  isRoad?: boolean; // For pathfinding/NPC behavior
  structure?: TerrainStructure; // For any structure on the tile
  population?: number; // NEW: For settlements
  allegianceBreakdown?: { [faction: string]: number }; // NEW: Faction loyalty breakdown
  dominantReligions?: { name: string; percentage: number }[];
  cropType?: string; // NEW: For Farmland
  mineralDeposit?: { metalId: string; quantity: number }; // NEW: For mineral deposits
  cityName?: string; // NEW: Name of the city this tile belongs to
  cityDescription?: string; // NEW: Description of the city
  hasFishingHut?: boolean; // NEW: Marker for fishing hut placement
}

/**
 * types/geography.ts - Geographical and cultural zone definitions.
 */
import { ClimateType, MapArchetype } from './index';

export type AdjacencyDirection = 'N' | 'S' | 'E' | 'W';

/**
 * Defines a long-distance, transitional journey between two specific map areas.
 */
export interface LiminalSequence {
    destination: string; // The name of the destination MapAreaDefinition
    sequence: MapArchetype[]; // The sequence of map archetypes to traverse
    originArea?: string; // OPTIONAL: The origin area (for generating reverse sequences)
}

/**
 * Defines the neighbors of a specific map area. A neighbor can be another
 * map area's name or a key for a LiminalSequence.
 */
export interface AdjacencyData {
    N?: string;
    S?: string;
    E?: string;
    W?: string;
}

export interface MapAreaDefinition {
    name: string;
    climate: ClimateType;
    archetype: MapArchetype;
    altitude?: 'standard' | 'high' | 'low'; // Optional altitude modifier
    riverDirection?: 'east-west' | 'north-south'; // Optional river flow direction for RIVER_PORT maps
    bayOutlet?: 'north' | 'south' | 'east' | 'west'; // Optional bay outlet direction for BAY maps
    deltaOutlet?: 'north' | 'south' | 'east' | 'west'; // Optional ocean edge for DELTA maps
    islandOrientation?: 'east-west' | 'north-south'; // Optional orientation for BARRIER_ISLAND maps
    hasLakes?: boolean; // Optional toggle for lake generation (especially for ALL_LAND maps)
    economicActivityLevel?: number; // Optional: 0 (none/desolate), 1 (low), 2 (medium/default), 3 (high), 4 (very high)
    isVolcanic?: boolean; // Optional flag to force volcanic activity (lava tiles) in this region
}

export interface RegionDefinition {
    [mapAreaName: string]: MapAreaDefinition;
}

export interface ZoneDefinition {
    [regionName: string]: RegionDefinition;
}
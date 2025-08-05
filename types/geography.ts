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
}

export interface RegionDefinition {
    [mapAreaName: string]: MapAreaDefinition;
}

export interface ZoneDefinition {
    [regionName: string]: RegionDefinition;
}
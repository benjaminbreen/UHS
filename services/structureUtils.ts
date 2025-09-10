/**
 * Structure Utilities
 * Centralized utilities for handling terrain structures with inconsistent field formats
 */

import { TerrainStructure } from '../types';

/**
 * Get location from a structure, handling different field name conventions
 * Structures may have location as {x, y}, location array [x, y], or separate x/y fields
 */
export function getStructureLocation(structure: any): { x: number; y: number } | null {
  // Check for location object with x/y properties
  if (structure.location) {
    if (typeof structure.location === 'object' && 'x' in structure.location && 'y' in structure.location) {
      return { x: structure.location.x, y: structure.location.y };
    }
    // Check for location array [x, y]
    if (Array.isArray(structure.location) && structure.location.length >= 2) {
      return { x: structure.location[0], y: structure.location[1] };
    }
  }
  
  // Check for separate x/y fields
  if (typeof structure.x === 'number' && typeof structure.y === 'number') {
    return { x: structure.x, y: structure.y };
  }
  
  // Check for position field (some structures use this)
  if (structure.position) {
    if (typeof structure.position === 'object' && 'x' in structure.position && 'y' in structure.position) {
      return { x: structure.position.x, y: structure.position.y };
    }
    if (Array.isArray(structure.position) && structure.position.length >= 2) {
      return { x: structure.position[0], y: structure.position[1] };
    }
  }
  
  // Check for coords field (legacy format)
  if (structure.coords) {
    if (typeof structure.coords === 'object' && 'x' in structure.coords && 'y' in structure.coords) {
      return { x: structure.coords.x, y: structure.coords.y };
    }
    if (Array.isArray(structure.coords) && structure.coords.length >= 2) {
      return { x: structure.coords[0], y: structure.coords[1] };
    }
  }
  
  return null;
}

/**
 * Get structure type, handling different field name conventions
 */
export function getStructureType(structure: any): string {
  // Check multiple possible field names
  return structure.type || 
         structure.structureType || 
         structure.structure_type ||
         structure.buildingType ||
         structure.building_type ||
         'unknown';
}

/**
 * Check if a structure is of a certain type, handling variations
 */
export function isStructureType(structure: any, types: string | string[]): boolean {
  const typeArray = Array.isArray(types) ? types : [types];
  const structType = getStructureType(structure).toLowerCase();
  const structName = (structure.name || '').toLowerCase();
  
  return typeArray.some(type => {
    const lowerType = type.toLowerCase();
    return structType === lowerType || 
           structType.includes(lowerType) ||
           structName.includes(lowerType);
  });
}

/**
 * Calculate distance between two points
 */
export function calculateDistance(point1: { x: number; y: number }, point2: { x: number; y: number }): number {
  return Math.sqrt(
    Math.pow(point2.x - point1.x, 2) + 
    Math.pow(point2.y - point1.y, 2)
  );
}

/**
 * Find structures within a certain radius of a point
 */
export function findStructuresInRadius(
  structures: any[], 
  center: { x: number; y: number }, 
  radius: number
): any[] {
  return structures.filter(structure => {
    const loc = getStructureLocation(structure);
    if (!loc) return false;
    return calculateDistance(center, loc) <= radius;
  });
}

/**
 * Find the nearest structure of a certain type
 */
export function findNearestStructure(
  structures: any[],
  center: { x: number; y: number },
  types?: string | string[]
): any | null {
  let validStructures = structures;
  
  if (types) {
    validStructures = structures.filter(s => isStructureType(s, types));
  }
  
  // Filter out structures without valid locations
  validStructures = validStructures.filter(s => getStructureLocation(s) !== null);
  
  if (validStructures.length === 0) return null;
  
  // Sort by distance and return the nearest
  return validStructures.sort((a, b) => {
    const locA = getStructureLocation(a)!;
    const locB = getStructureLocation(b)!;
    const distA = calculateDistance(center, locA);
    const distB = calculateDistance(center, locB);
    return distA - distB;
  })[0];
}

/**
 * Group structures by type
 */
export function groupStructuresByType(structures: any[]): Record<string, any[]> {
  const grouped: Record<string, any[]> = {};
  
  structures.forEach(structure => {
    const type = getStructureType(structure);
    if (!grouped[type]) {
      grouped[type] = [];
    }
    grouped[type].push(structure);
  });
  
  return grouped;
}

/**
 * Validate and clean structure data
 */
export function validateStructure(structure: any): boolean {
  // Must have a valid location
  const location = getStructureLocation(structure);
  if (!location) return false;
  
  // Must have a type
  const type = getStructureType(structure);
  if (type === 'unknown') return false;
  
  // Location must be within reasonable bounds
  if (location.x < 0 || location.y < 0 || location.x > 10000 || location.y > 10000) {
    return false;
  }
  
  return true;
}

/**
 * Create a standardized structure object
 */
export function standardizeStructure(structure: any): TerrainStructure | null {
  const location = getStructureLocation(structure);
  if (!location) return null;
  
  const type = getStructureType(structure);
  
  return {
    id: structure.id || `structure_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: type as any,
    location: [location.x, location.y],
    structureType: type as any,
    name: structure.name || type.replace(/_/g, ' '),
    // Preserve any additional properties
    ...structure
  };
}
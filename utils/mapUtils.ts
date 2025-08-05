/**
 * utils/mapUtils.ts - Utility functions for map operations
 */
import { CulturalZone } from '../constants/index';

const LARGE_PRIME_1 = 73856093;
const LARGE_PRIME_2 = 19349663;
const LARGE_PRIME_3 = 83492791;

/**
 * Derives a deterministic seed for a map cell based on an initial game seed and world coordinates.
 * This ensures that navigating to the same world cell always results in the same map being generated.
 * @param initialGameSeed The seed of the very first map generated in the game session.
 * @param worldX The x-coordinate of the map cell in the world grid.
 * @param worldY The y-coordinate of the map cell in the world grid.
 * @returns A deterministic number seed for the specified map cell.
 */
export function deriveMapSeed(initialGameSeed: number, worldX: number, worldY: number): number {
  let hash = initialGameSeed;
  hash = (hash * LARGE_PRIME_1) ^ (worldX * LARGE_PRIME_2);
  hash = (hash * LARGE_PRIME_2) ^ (worldY * LARGE_PRIME_3);
  hash = hash & 0x7FFFFFFF; // Ensure positive integer, good for seeds
  return hash;
}

/**
 * Converts a string location from the UI into a strongly-typed CulturalZone enum, now aware of the year.
 * @param location The location string (e.g., "East Asia", "Europe").
 * @param year The current year of the simulation.
 * @returns The corresponding CulturalZone enum value.
 */
export function mapLocationToCulture(location: string, year: number): CulturalZone {
    const lowerLocation = location.toLowerCase();
    
    if (lowerLocation.includes('north america')) {
        if (year > 1600) return 'NORTH_AMERICAN_COLONIAL';
        return 'NORTH_AMERICAN_PRE_COLUMBIAN';
    }
    
    if (lowerLocation.includes('europe')) return 'EUROPEAN';
    if (lowerLocation.includes('south america')) return 'SOUTH_AMERICAN';
    if (lowerLocation.includes('mena') || lowerLocation.includes('middle east')) return 'MENA';
    if (lowerLocation.includes('sub saharan africa') || lowerLocation.includes('africa')) return 'SUB_SAHARAN_AFRICAN';
    if (lowerLocation.includes('south asia')) return 'SOUTH_ASIAN';
    if (lowerLocation.includes('east asia')) return 'EAST_ASIAN';
    if (lowerLocation.includes('oceania')) return 'OCEANIA';
    
    // Default fallback
    return 'EUROPEAN';
}
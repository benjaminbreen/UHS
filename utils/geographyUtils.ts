import { AdjacencyDirection, MapAreaDefinition, MapArchetype, Point } from '../types';
import { MAP_WIDTH_TILES, MAP_HEIGHT_TILES } from '../constants/index';
// Heavy data files - import directly to avoid loading on app startup
import { ADJACENCIES, LIMINAL_SEQUENCES } from '../constants/gameData/adjacencies';
import { GEOGRAPHICAL_DATA } from '../constants/gameData/geography';

export interface NextMapResultAdjacent {
    type: 'adjacent';
    areaDef: MapAreaDefinition;
    region: string;
    zone: string;
}

export interface NextMapResultLiminal {
    type: 'liminal';
    sequence: MapArchetype[];
    destination: string;
    key: string;
}

export interface NextMapResultRandom {
    type: 'random';
}

export type NextMapResult = NextMapResultAdjacent | NextMapResultLiminal | NextMapResultRandom;

export function findMapAreaDefinition(areaName: string): { areaDef: MapAreaDefinition, region: string, zone: string } | null {
    for (const zone in GEOGRAPHICAL_DATA) {
        for (const region in GEOGRAPHICAL_DATA[zone]) {
            if (GEOGRAPHICAL_DATA[zone][region][areaName]) {
                return {
                    areaDef: GEOGRAPHICAL_DATA[zone][region][areaName],
                    region,
                    zone
                };
            }
        }
    }
    return null;
}

export function getNextMapArea(
    currentAreaName: string,
    direction: AdjacencyDirection
): NextMapResult {
    const adjacencies = ADJACENCIES[currentAreaName];
    if (!adjacencies) {
        console.warn(`[Geography] No adjacency data found for "${currentAreaName}". Defaulting to random.`);
        return { type: 'random' };
    }
    
    const nextAreaKey = adjacencies[direction];
    if (!nextAreaKey) {
        // This is a valid edge of the defined world, can be random or a hard border.
        // For now, random exploration is more fun.
        return { type: 'random' };
    }

    // Check if it's a liminal sequence
    if (LIMINAL_SEQUENCES[nextAreaKey]) {
        const liminal = LIMINAL_SEQUENCES[nextAreaKey];
        return {
            type: 'liminal',
            sequence: liminal.sequence,
            destination: liminal.destination,
            key: nextAreaKey
        };
    }
    
    // Check if it's a direct adjacency by looking it up in the geographical data
    const nextMapInfo = findMapAreaDefinition(nextAreaKey);
    if (nextMapInfo) {
        return {
            type: 'adjacent',
            areaDef: nextMapInfo.areaDef,
            region: nextMapInfo.region,
            zone: nextMapInfo.zone
        };
    }

    console.warn(`[Geography] Adjacency key "${nextAreaKey}" not found in LIMINAL_SEQUENCES or GEOGRAPHICAL_DATA. Defaulting to random.`);
    return { type: 'random' };
}

/**
 * Determines the cardinal direction of a point on the map.
 * @param point - The {x, y} coordinates of the point.
 * @returns A string like "Northern", "South-Western", "Central", etc.
 */
export function getMapAreaCardinalDirection(point: Point): string {
    const thirdW = MAP_WIDTH_TILES / 3;
    const thirdH = MAP_HEIGHT_TILES / 3;

    const isWest = point.x < thirdW;
    const isEast = point.x > 2 * thirdW;
    const isNorth = point.y < thirdH;
    const isSouth = point.y > 2 * thirdH;

    if (isNorth) {
        if (isWest) return "North-Western";
        if (isEast) return "North-Eastern";
        return "Northern";
    }
    if (isSouth) {
        if (isWest) return "South-Western";
        if (isEast) return "South-Eastern";
        return "Southern";
    }
    if (isWest) return "Western";
    if (isEast) return "Eastern";

    return "Central";
}

/**
 * Generates a human-readable relative direction phrase between two points.
 * @param fromPoint - The starting point {x, y}.
 * @param toPoint - The destination point {x, y}.
 * @returns A string phrase like "to the northwest".
 */
export function getRelativeDirection(fromPoint: Point, toPoint: Point): string {
    const dx = toPoint.x - fromPoint.x;
    const dy = toPoint.y - fromPoint.y;

    if (Math.abs(dx) < 2 && Math.abs(dy) < 2) return "right here";

    const angle = Math.atan2(dy, dx) * 180 / Math.PI;

    if (angle >= -22.5 && angle < 22.5) return "to the east";
    if (angle >= 22.5 && angle < 67.5) return "to the southeast";
    if (angle >= 67.5 && angle < 112.5) return "to the south";
    if (angle >= 112.5 && angle < 157.5) return "to the southwest";
    if (angle >= 157.5 || angle < -157.5) return "to the west";
    if (angle >= -157.5 && angle < -112.5) return "to the northwest";
    if (angle >= -112.5 && angle < -67.5) return "to the north";
    if (angle >= -67.5 && angle < -22.5) return "to the northeast";
    
    return "nearby";
}
/**
 * Shared NPC Position Calculator
 *
 * Unified utility for calculating valid NPC positions in both:
 * - Interior maps (BeautifulInteriorGenerator) using ArchitecturalSpace
 * - Special maps (SpecialMapGenerator) using RoomDefinition
 *
 * This eliminates code duplication and ensures consistent positioning logic.
 */

import { BiomeType } from '../../types';

// Unified space interface that works with both systems
export interface SpaceBounds {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface PositionPreference {
    type: 'center' | 'entrance' | 'altar' | 'throne' | 'restricted_area' | 'near_furniture' | 'random';
    offset?: { x: number; y: number }; // Optional offset from preferred position
}

export interface Tile {
    biome: BiomeType;
    x?: number;
    y?: number;
}

/**
 * Validate and sanitize coordinates to prevent NaN/Infinity issues
 */
export function validateCoordinates(x: number, y: number, context: string): { x: number; y: number } {
    const sanitizedX = Math.floor(x);
    const sanitizedY = Math.floor(y);

    if (isNaN(sanitizedX) || isNaN(sanitizedY)) {
        throw new Error(`[NpcPositionCalculator] Invalid coordinates in ${context}: x=${x}, y=${y} resulted in NaN`);
    }

    if (!isFinite(sanitizedX) || !isFinite(sanitizedY)) {
        throw new Error(`[NpcPositionCalculator] Infinite coordinates in ${context}: x=${x}, y=${y}`);
    }

    if (sanitizedX < 0 || sanitizedY < 0) {
        console.warn(`[NpcPositionCalculator] Negative coordinates in ${context}: x=${sanitizedX}, y=${sanitizedY}, clamping to 0`);
        return { x: Math.max(0, sanitizedX), y: Math.max(0, sanitizedY) };
    }

    return { x: sanitizedX, y: sanitizedY };
}

/**
 * Extract bounds from either ArchitecturalSpace or RoomDefinition format
 */
export function extractBounds(space: any): SpaceBounds {
    // Format 1: Direct bounds property (ArchitecturalSpace)
    if (space.bounds && typeof space.bounds === 'object') {
        return {
            x: space.bounds.x,
            y: space.bounds.y,
            width: space.bounds.width,
            height: space.bounds.height
        };
    }

    // Format 2: minX/maxX format (some RoomDefinitions)
    if (space.bounds && 'minX' in space.bounds) {
        return {
            x: space.bounds.minX,
            y: space.bounds.minY,
            width: space.bounds.maxX - space.bounds.minX,
            height: space.bounds.maxY - space.bounds.minY
        };
    }

    // Format 3: Direct x, y, width, height (legacy RoomDefinition)
    if ('x' in space && 'y' in space && 'width' in space && 'height' in space) {
        return {
            x: space.x,
            y: space.y,
            width: space.width,
            height: space.height
        };
    }

    throw new Error('[NpcPositionCalculator] Unable to extract bounds from space object');
}

/**
 * Check if a biome type is walkable for NPC placement
 */
export function isWalkableBiome(biome: BiomeType): boolean {
    const walkableBiomes = [
        BiomeType.FLOOR_STONE,
        BiomeType.FLOOR_WOOD,
        BiomeType.FLOOR_MARBLE,
        BiomeType.FLOOR_TILE,
        BiomeType.FLOOR_CARPET,
        BiomeType.FLOOR_MOSAIC,
        BiomeType.FLOOR_MOSAIC_CENTER,
        BiomeType.FLOOR_MOSAIC_BORDER,
        BiomeType.FLOOR_PATTERN,
        BiomeType.FLOOR_CHECKERED,
        BiomeType.GRASS_GROUND,
        BiomeType.DIRT_GROUND,
        BiomeType.STONE_GROUND,
        BiomeType.FLOOR_DIRT,
        BiomeType.DIRT,
        BiomeType.DIRT_PATH,
        BiomeType.PLAZA,
        BiomeType.PARK,
        BiomeType.GRASSLAND,
        BiomeType.PATH
    ];

    return walkableBiomes.includes(biome);
}

/**
 * Check if a biome blocks NPC placement (furniture, walls, etc.)
 */
export function isBlockingBiome(biome: BiomeType): boolean {
    const blockingBiomes = [
        BiomeType.WALL,
        BiomeType.WALL_GATE,
        BiomeType.WALL_WINDOW,
        BiomeType.WALL_BACK,
        BiomeType.WALL_BACK_WINDOW,
        BiomeType.WALL_BACK_DOOR,
        BiomeType.DEEP_OCEAN,
        BiomeType.SHALLOW_OCEAN,
        BiomeType.FRESHWATER_LAKE,
        BiomeType.RIVER,
        BiomeType.MAJOR_RIVER,
        BiomeType.PILLAR,
        BiomeType.COLUMN,
        BiomeType.STATUE,
        BiomeType.FOUNTAIN,
        BiomeType.ALTAR,
        BiomeType.SHRINE,
        BiomeType.TABLE,
        BiomeType.TABLE_LEFT,
        BiomeType.TABLE_CENTER,
        BiomeType.TABLE_RIGHT,
        BiomeType.DESK,
        BiomeType.BED,
        BiomeType.THRONE,
        BiomeType.BOOKSHELF,
        BiomeType.CABINET,
        BiomeType.CHEST,
        BiomeType.BARREL,
        BiomeType.ANVIL,
        BiomeType.OVEN_BRICK,
        BiomeType.SPINNING_WHEEL,
        BiomeType.LOOM,
        BiomeType.WORKBENCH
    ];

    return blockingBiomes.includes(biome);
}

/**
 * Calculate preferred position within a space based on type
 */
export function calculatePreferredPosition(
    bounds: SpaceBounds,
    preference: PositionPreference
): { x: number; y: number } {
    let baseX: number;
    let baseY: number;

    switch (preference.type) {
        case 'center':
            baseX = bounds.x + Math.floor(bounds.width / 2);
            baseY = bounds.y + Math.floor(bounds.height / 2);
            break;

        case 'entrance':
            // Near bottom center (typical entrance location)
            baseX = bounds.x + Math.floor(bounds.width / 2);
            baseY = bounds.y + bounds.height - 2;
            break;

        case 'altar':
        case 'throne':
            // Near top center (typical altar/throne location)
            baseX = bounds.x + Math.floor(bounds.width / 2);
            baseY = bounds.y + 2;
            break;

        case 'restricted_area':
            // Top third of the space (usually restricted areas)
            baseX = bounds.x + Math.floor(bounds.width / 2);
            baseY = bounds.y + Math.floor(bounds.height / 3);
            break;

        case 'near_furniture':
            // Offset from center to avoid blocking furniture
            baseX = bounds.x + Math.floor(bounds.width / 2) + 1;
            baseY = bounds.y + Math.floor(bounds.height / 2) + 1;
            break;

        case 'random':
        default:
            // Random position within bounds (with margins)
            const marginX = Math.max(1, Math.floor(bounds.width * 0.1));
            const marginY = Math.max(1, Math.floor(bounds.height * 0.1));
            baseX = bounds.x + marginX + Math.floor(Math.random() * (bounds.width - 2 * marginX));
            baseY = bounds.y + marginY + Math.floor(Math.random() * (bounds.height - 2 * marginY));
            break;
    }

    // Apply offset if provided
    if (preference.offset) {
        baseX += preference.offset.x;
        baseY += preference.offset.y;
    }

    return { x: baseX, y: baseY };
}

/**
 * Find a valid walkable position within a space, checking tiles if provided
 */
export function findValidPosition(
    space: any,
    tiles: Tile[][] | null,
    preference: PositionPreference,
    maxAttempts: number = 20
): { x: number; y: number } {
    const bounds = extractBounds(space);
    const preferredPos = calculatePreferredPosition(bounds, preference);

    // If no tiles provided (interior maps use SVG, not tile-based), return preferred position
    if (!tiles) {
        return validateCoordinates(preferredPos.x, preferredPos.y, `space ${space.id || 'unknown'}`);
    }

    // Try preferred position first
    if (isPositionValid(preferredPos, bounds, tiles)) {
        return validateCoordinates(preferredPos.x, preferredPos.y, `preferred position`);
    }

    // Spiral search outward from preferred position
    for (let radius = 1; radius <= maxAttempts; radius++) {
        for (let dx = -radius; dx <= radius; dx++) {
            for (let dy = -radius; dy <= radius; dy++) {
                // Only check perimeter of current radius
                if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) continue;

                const testPos = {
                    x: preferredPos.x + dx,
                    y: preferredPos.y + dy
                };

                if (isPositionValid(testPos, bounds, tiles)) {
                    return validateCoordinates(testPos.x, testPos.y, `spiral search (radius ${radius})`);
                }
            }
        }
    }

    // Fallback: return center of space
    console.warn(`[NpcPositionCalculator] Could not find valid position after ${maxAttempts} attempts, using space center`);
    const centerX = bounds.x + Math.floor(bounds.width / 2);
    const centerY = bounds.y + Math.floor(bounds.height / 2);
    return validateCoordinates(centerX, centerY, 'fallback center');
}

/**
 * Check if a position is valid (within bounds and walkable)
 */
function isPositionValid(
    pos: { x: number; y: number },
    bounds: SpaceBounds,
    tiles: Tile[][]
): boolean {
    // Check if within space bounds
    if (pos.x < bounds.x || pos.x >= bounds.x + bounds.width ||
        pos.y < bounds.y || pos.y >= bounds.y + bounds.height) {
        return false;
    }

    // Check if within map bounds
    if (pos.y < 0 || pos.y >= tiles.length || pos.x < 0 || pos.x >= (tiles[0]?.length || 0)) {
        return false;
    }

    const tile = tiles[pos.y]?.[pos.x];
    if (!tile) return false;

    // Check if tile is walkable
    return isWalkableBiome(tile.biome) && !isBlockingBiome(tile.biome);
}

/**
 * Find multiple valid positions within a space with minimum distance between them
 */
export function findMultipleValidPositions(
    space: any,
    tiles: Tile[][] | null,
    count: number,
    minDistance: number = 2,
    maxAttempts: number = 50
): { x: number; y: number }[] {
    const positions: { x: number; y: number }[] = [];
    const bounds = extractBounds(space);

    for (let i = 0; i < maxAttempts && positions.length < count; i++) {
        // Use random placement for multiple NPCs to spread them out
        const candidatePos = findValidPosition(space, tiles, { type: 'random' }, 10);

        // Check if far enough from existing positions
        const tooClose = positions.some(pos =>
            Math.abs(pos.x - candidatePos.x) < minDistance &&
            Math.abs(pos.y - candidatePos.y) < minDistance
        );

        if (!tooClose) {
            positions.push(candidatePos);
        }
    }

    if (positions.length < count) {
        console.warn(`[NpcPositionCalculator] Only found ${positions.length}/${count} valid positions`);
    }

    return positions;
}

/**
 * Calculate position for a guard near a restricted area entrance
 */
export function calculateGuardPosition(
    guardedSpace: any,
    tiles: Tile[][] | null,
    guardIndex: number = 0
): { x: number; y: number } {
    const bounds = extractBounds(guardedSpace);

    // Position guards at the bottom edge of restricted spaces (entrance)
    const guardX = bounds.x + Math.floor(bounds.width / 2) + (guardIndex % 2 === 0 ? -2 : 2);
    const guardY = bounds.y + bounds.height - 1;

    // If tiles provided, validate position
    if (tiles) {
        return findValidPosition(
            guardedSpace,
            tiles,
            { type: 'entrance', offset: { x: guardIndex % 2 === 0 ? -2 : 2, y: 0 } }
        );
    }

    return validateCoordinates(guardX, guardY, `guard-${guardIndex} at restricted area`);
}

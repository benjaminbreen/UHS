import { DungeonPlayer, DungeonTile, Entity } from './types';

export interface MovementContext {
    dungeon: DungeonTile[][];
    entities: Entity[];
    dimensions: { width: number; height: number };
}

export type MovementEvent =
    | { type: 'BLOCKED_WALL'; x: number; y: number; tile: DungeonTile }
    | { type: 'BLOCKED_WEAK_WALL'; x: number; y: number; tile: DungeonTile }
    | { type: 'BLOCKED_BOULDER'; x: number; y: number; tile: DungeonTile; dx: number; dy: number }
    | { type: 'ENTITY_ENCOUNTER'; entity: Entity; x: number; y: number }
    | { type: 'STEP'; x: number; y: number; tile: DungeonTile };

export interface MovementResult {
    player: DungeonPlayer;
    events: MovementEvent[];
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export function evaluatePlayerMove(
    player: DungeonPlayer,
    dx: number,
    dy: number,
    context: MovementContext
): MovementResult {
    const { dungeon, entities, dimensions } = context;
    const targetX = clamp(player.x + dx, 0, dimensions.width - 1);
    const targetY = clamp(player.y + dy, 0, dimensions.height - 1);

    const tileRow = dungeon[targetY];
    const targetTile = tileRow ? tileRow[targetX] : undefined;

    if (!targetTile) {
        return { player, events: [] };
    }

    if (targetTile.type === 'wall') {
        return {
            player,
            events: [
                {
                    type: 'BLOCKED_WALL',
                    x: targetX,
                    y: targetY,
                    tile: targetTile
                }
            ]
        };
    }

    if (targetTile.type === 'weak_wall') {
        return {
            player,
            events: [
                {
                    type: 'BLOCKED_WEAK_WALL',
                    x: targetX,
                    y: targetY,
                    tile: targetTile
                }
            ]
        };
    }

    if (targetTile.type === 'boulder') {
        return {
            player,
            events: [
                {
                    type: 'BLOCKED_BOULDER',
                    x: targetX,
                    y: targetY,
                    tile: targetTile,
                    dx,
                    dy
                }
            ]
        };
    }

    const entity = entities.find(entry => entry.x === targetX && entry.y === targetY && entry.hp > 0);
    if (entity) {
        return {
            player,
            events: [
                {
                    type: 'ENTITY_ENCOUNTER',
                    entity,
                    x: targetX,
                    y: targetY
                }
            ]
        };
    }

    const updatedPlayer: DungeonPlayer = { ...player, x: targetX, y: targetY };
    return {
        player: updatedPlayer,
        events: [
            {
                type: 'STEP',
                x: targetX,
                y: targetY,
                tile: targetTile
            }
        ]
    };
}

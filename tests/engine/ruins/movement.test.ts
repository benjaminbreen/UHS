import { describe, it, expect } from 'vitest';
import { evaluatePlayerMove } from '../../../engine/ruins/movement';
import type { DungeonPlayer, DungeonTile, Entity } from '../../../engine/ruins/types';

const createTile = (type: DungeonTile['type']): DungeonTile => ({
    type,
    visible: true,
    explored: false
});

const basePlayer: DungeonPlayer = {
    x: 1,
    y: 1,
    hp: 10,
    maxHp: 10,
    gold: 0,
    level: 1,
    inventory: [],
    manuscripts: []
};

describe('evaluatePlayerMove', () => {
    it('prevents movement into walls', () => {
        const dungeon: DungeonTile[][] = [
            [createTile('wall'), createTile('wall'), createTile('wall')],
            [createTile('wall'), createTile('floor'), createTile('wall')],
            [createTile('wall'), createTile('wall'), createTile('wall')]
        ];

        const result = evaluatePlayerMove(basePlayer, 0, -1, {
            dungeon,
            entities: [],
            dimensions: { width: 3, height: 3 }
        });

        expect(result.player).toEqual(basePlayer);
        expect(result.events[0].type).toBe('BLOCKED_WALL');
    });

    it('issues entity encounter event when occupied', () => {
        const dungeon: DungeonTile[][] = [
            [createTile('floor'), createTile('floor'), createTile('floor')],
            [createTile('floor'), createTile('floor'), createTile('floor')],
            [createTile('floor'), createTile('floor'), createTile('floor')]
        ];

        const entity: Entity = {
            id: 'npc-1',
            x: 2,
            y: 1,
            type: 'npc',
            subtype: 'tomb_raider',
            name: 'Rival Explorer',
            hp: 5,
            maxHp: 5,
            hostile: true,
            description: 'A rival explorer watching you closely.',
            symbol: 'R',
            color: 'text-red-500'
        };

        const result = evaluatePlayerMove(basePlayer, 1, 0, {
            dungeon,
            entities: [entity],
            dimensions: { width: 3, height: 3 }
        });

        expect(result.player).toEqual(basePlayer);
        expect(result.events[0]).toMatchObject({
            type: 'ENTITY_ENCOUNTER',
            entity
        });
    });

    it('moves onto floor tiles and emits step event', () => {
        const dungeon: DungeonTile[][] = [
            [createTile('floor'), createTile('floor'), createTile('floor')],
            [createTile('floor'), createTile('floor'), createTile('floor')],
            [createTile('floor'), createTile('floor'), createTile('floor')]
        ];

        const result = evaluatePlayerMove(basePlayer, 1, 0, {
            dungeon,
            entities: [],
            dimensions: { width: 3, height: 3 }
        });

        expect(result.player.x).toBe(2);
        expect(result.player.y).toBe(1);
        expect(result.events[0]).toMatchObject({
            type: 'STEP',
            x: 2,
            y: 1
        });
    });
});

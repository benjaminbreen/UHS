/**
 * constants/gameData/structureLootTables.ts - Loot tables for foraging near structures.
 */
import { Rarity } from '../../types';

export const STRUCTURE_LOOT_TABLES: Record<string, Partial<Record<Rarity, string[]>>> = {
    mill: {
        Common: ['WHEAT', 'STICK'],
        Rare: ['SMOOTH_STONE'],
    },
    fishing_hut: {
        Common: ['FISH_MEAT', 'VINE'],
        Rare: ['ROPE'],
    },
    fortress: {
        Common: ['STICK', 'SMOOTH_STONE'],
        Rare: ['IRON_ORE', 'ROPE'],
        'Ultra-rare': [],
    },
    lumber_camp: {
        Common: ['STICK', 'TREE_BARK'],
        Rare: ['PINE_CONE', 'VINE'],
    },
    mining_colony: {
        Common: ['SMOOTH_STONE', 'STICK'],
        Rare: ['IRON_ORE'],
    },
};
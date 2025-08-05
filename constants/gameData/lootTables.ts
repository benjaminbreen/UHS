/**
 * constants/gameData/lootTables.ts - Data for procedural loot generation for the Forage skill.
 */
import { BiomeType } from '../../types';

export type Rarity = 'common' | 'rare' | 'ultra_rare';

export const LOOT_TABLES: Partial<Record<BiomeType, Partial<Record<Rarity, string[]>>>> = {
    [BiomeType.FOREST]: {
        common: ['STICK', 'MUSHROOM', 'DRY_LEAVES', 'SMOOTH_STONE'],
        rare: ['WILD_BERRIES', 'VINE', 'BIRDS_NEST', 'PINE_CONE'],
        ultra_rare: ['GLOWING_MOSS', 'OWL_FEATHER']
    },
    [BiomeType.DENSE_FOREST]: {
        common: ['STICK', 'DRY_LEAVES'],
        rare: ['MUSHROOM', 'VINE'],
        ultra_rare: ['GLOWING_MOSS']
    },
    [BiomeType.GRASSLAND]: {
        common: ['SMOOTH_STONE', 'DRY_LEAVES'],
        rare: ['WILD_BERRIES', 'BIRDS_NEST'],
        ultra_rare: []
    },
    [BiomeType.RIVERBANK]: {
        common: ['SMOOTH_STONE', 'STICK'],
        rare: ['WILD_BERRIES', 'VINE'],
        ultra_rare: []
    },
    [BiomeType.BEACH]: {
        common: ['SMOOTH_STONE', 'STICK'],
        rare: [],
        ultra_rare: []
    },
    [BiomeType.DESERT]: {
        common: ['DRY_LEAVES', 'STICK'],
        rare: [],
        ultra_rare: []
    },
    [BiomeType.RUINS]: {
        common: ['SMOOTH_STONE', 'STICK'],
        rare: ['COPPER_COINS', 'SCROLL'],
        ultra_rare: []
    }
};
/**
 * constants/gameData/metals.ts - Defines metals and their geological rules.
 */
import { MetalDefinition } from '../../types';

export const METALS: Record<string, MetalDefinition> = {
    IRON: { 
        name: 'Iron', 
        oreItemId: 'IRON_ORE', 
        geologicalRules: { biomes: ['MOUNTAIN', 'HILLS'], minStress: 0.6 },
        visual: { type: 'streaks', color: 'rgba(168, 70, 50, 0.7)' }
    },
    COPPER: { 
        name: 'Copper', 
        oreItemId: 'COPPER_ORE', 
        geologicalRules: { biomes: ['MOUNTAIN', 'HILLS'], minThermal: 0.5, minStress: 0.4 },
        visual: { type: 'patches', color: 'rgba(0, 150, 120, 0.6)' } 
    },
    GOLD: { 
        name: 'Gold', 
        oreItemId: 'GOLD_ORE', 
        geologicalRules: { biomes: ['MOUNTAIN', 'RIVER'], minThermal: 0.7, minStress: 0.8 },
        visual: { type: 'sparkles', color: 'rgba(255, 215, 0, 0.8)' }
    },
    TIN: { 
        name: 'Tin', 
        oreItemId: 'TIN_ORE', 
        geologicalRules: { biomes: ['HILLS', 'RIVER'], minStress: 0.3 },
        visual: { type: 'patches', color: 'rgba(180, 190, 200, 0.6)' }
    },
    SILVER: {
        name: 'Silver',
        oreItemId: 'SILVER_ORE',
        geologicalRules: { biomes: ['MOUNTAIN'], minThermal: 0.6, minStress: 0.7 },
        visual: { type: 'sparkles', color: 'rgba(210, 210, 220, 0.7)' }
    },
    LEAD: {
        name: 'Lead',
        oreItemId: 'LEAD_ORE',
        geologicalRules: { biomes: ['HILLS'], minStress: 0.5 },
        visual: { type: 'patches', color: 'rgba(80, 80, 90, 0.6)' }
    },
    COAL: {
        name: 'Coal',
        oreItemId: 'COAL',
        geologicalRules: { biomes: ['HILLS', 'WETLANDS'], minStress: 0.2 },
        visual: { type: 'streaks', color: 'rgba(30, 30, 30, 0.7)' }
    },
    SALT: {
        name: 'Salt',
        oreItemId: 'ROCK_SALT',
        geologicalRules: { biomes: ['SALT_FLATS', 'HILLS', 'DESERT'] },
        visual: { type: 'patches', color: 'rgba(255, 255, 255, 0.5)' }
    },
    CLAY: {
        name: 'Clay',
        oreItemId: 'CLAY_LUMP',
        geologicalRules: { biomes: ['RIVERBANK', 'WETLANDS', 'GRASSLAND'] },
        visual: { type: 'patches', color: 'rgba(180, 140, 100, 0.6)' }
    },
    OCHRE: {
        name: 'Ochre',
        oreItemId: 'OCHRE_LUMP',
        geologicalRules: { biomes: ['DESERT', 'HILLS', 'SCRUB'] },
        visual: { type: 'streaks', color: 'rgba(220, 50, 50, 0.6)'}
    },
    FLINT: {
        name: 'Flint',
        oreItemId: 'FLINT_STONE',
        geologicalRules: { biomes: ['HILLS', 'BEACH', 'RIVERBANK'] },
        visual: { type: 'patches', color: 'rgba(50, 50, 60, 0.7)'}
    },
    STONE: {
        name: 'Stone',
        oreItemId: 'STONE_BLOCK',
        geologicalRules: { biomes: ['MOUNTAIN', 'HILLS', 'CLIFF'] },
        visual: { type: 'patches', color: 'rgba(150, 150, 150, 0.5)'}
    },
    // Modern/Future minerals
    LITHIUM: {
        name: 'Lithium',
        oreItemId: 'LITHIUM_ORE',
        geologicalRules: { biomes: ['SALT_FLATS', 'DESERT'], minThermal: 0.6 },
        visual: { type: 'sparkles', color: 'rgba(200, 150, 255, 0.7)'}
    },
    RARE_EARTH: {
        name: 'Rare Earth Elements',
        oreItemId: 'RARE_EARTH_ORE',
        geologicalRules: { biomes: ['MOUNTAIN'], minStress: 0.8, minThermal: 0.7 },
        visual: { type: 'sparkles', color: 'rgba(150, 255, 200, 0.8)'}
    },
    URANIUM: {
        name: 'Uranium',
        oreItemId: 'URANIUM_ORE',
        geologicalRules: { biomes: ['MOUNTAIN', 'HILLS'], minStress: 0.9 },
        visual: { type: 'patches', color: 'rgba(50, 255, 50, 0.6)'}
    },
    GEMS: {
        name: 'Gemstones',
        oreItemId: 'RAW_GEMS',
        geologicalRules: { biomes: ['MOUNTAIN'], minStress: 0.85, minThermal: 0.8 },
        visual: { type: 'sparkles', color: 'rgba(255, 100, 255, 0.9)'}
    }
};
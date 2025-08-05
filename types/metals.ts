/**
 * types/metals.ts - Type definitions for procedural metal generation.
 */
import { BiomeType } from './biomes/base';

export interface MetalDefinition {
    name: string;
    oreItemId: string; // e.g., 'IRON_ORE'
    geologicalRules: {
        biomes: (keyof typeof BiomeType)[];
        minStress?: number;
        minThermal?: number;
    };
    visual: {
        type: 'streaks' | 'sparkles' | 'patches';
        color: string;
    };
}
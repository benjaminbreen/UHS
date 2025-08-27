/**
 * constants/terrainPassability.ts - Configuration for impassable terrain types
 */
import { BiomeType } from '../types';

export interface TerrainPassabilityConfig {
  impassable: boolean;
  message: string;
  damagePerAttempt?: number;  // Health damage when trying to enter
  damageType?: 'heat' | 'cold' | 'physical' | 'drowning';
}

export const TERRAIN_PASSABILITY: Partial<Record<BiomeType, TerrainPassabilityConfig>> = {
  [BiomeType.ACTIVE_LAVA]: {
    impassable: true,
    message: "too hot to approach - you'd get severely burnt",
    damagePerAttempt: 10,
    damageType: 'heat'
  },
  [BiomeType.HIGH_PEAK]: {
    impassable: true,
    message: "too steep to climb, and too icy",
    damagePerAttempt: 2,
    damageType: 'physical'
  },
  // Cliff can be impassable in certain contexts
  [BiomeType.CLIFF]: {
    impassable: true,
    message: "too sheer to climb",
    damagePerAttempt: 5,
    damageType: 'physical'
  }
};

// Helper function to check if terrain is passable
export function isTerrainPassable(biome: BiomeType): boolean {
  const config = TERRAIN_PASSABILITY[biome];
  return !config || !config.impassable;
}

// Helper function to get terrain block message
export function getTerrainBlockMessage(biome: BiomeType): string | null {
  const config = TERRAIN_PASSABILITY[biome];
  if (!config || !config.impassable) return null;
  
  // Format the biome name nicely
  const terrainName = biome.replace(/_/g, ' ').toLowerCase();
  return `Tried to enter ${terrainName}, but it was ${config.message}!`;
}

// Helper function to get terrain damage
export function getTerrainDamage(biome: BiomeType): { damage: number; type: string } | null {
  const config = TERRAIN_PASSABILITY[biome];
  if (!config || !config.damagePerAttempt) return null;
  
  return {
    damage: config.damagePerAttempt,
    type: config.damageType || 'physical'
  };
}
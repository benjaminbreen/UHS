/**
 * services/liminalEncounterService.ts
 * Handles random encounter generation for liminal travel sequences
 */

import { MapArchetype } from '../types';
import {
  type LiminalEncounter,
  DESERT_ENCOUNTERS,
  OCEAN_ENCOUNTERS,
  ALL_LAND_ENCOUNTERS,
  RIVER_ENCOUNTERS,
  SWAMP_ENCOUNTERS,
  SHOALS_ENCOUNTERS,
  STRAITS_ENCOUNTERS,
  ISLAND_ENCOUNTERS
} from '../constants/gameData/liminalEncounters';

// Re-export LiminalEncounter type for convenience
export type { LiminalEncounter } from '../constants/gameData/liminalEncounters';

/**
 * Encounter pools mapped to each archetype
 */
const ENCOUNTER_POOLS: Partial<Record<MapArchetype, LiminalEncounter[]>> = {
  [MapArchetype.DESERT]: DESERT_ENCOUNTERS,
  [MapArchetype.OPEN_OCEAN]: OCEAN_ENCOUNTERS,
  [MapArchetype.ALL_LAND]: ALL_LAND_ENCOUNTERS,
  [MapArchetype.RIVER_PORT]: RIVER_ENCOUNTERS,
  [MapArchetype.SWAMP]: SWAMP_ENCOUNTERS,
  [MapArchetype.SHOALS]: SHOALS_ENCOUNTERS,
  [MapArchetype.STRAITS]: STRAITS_ENCOUNTERS,
  [MapArchetype.ISLAND]: ISLAND_ENCOUNTERS,
  [MapArchetype.BARRIER_ISLAND]: ISLAND_ENCOUNTERS, // Use island encounters
  [MapArchetype.ATOLL]: ISLAND_ENCOUNTERS, // Use island encounters
  [MapArchetype.PENINSULA]: ALL_LAND_ENCOUNTERS, // Use land encounters
  [MapArchetype.BAY]: SHOALS_ENCOUNTERS, // Use coastal encounters
  [MapArchetype.DELTA]: RIVER_ENCOUNTERS, // Use river encounters
  [MapArchetype.FRESHWATER_LAKE]: RIVER_ENCOUNTERS, // Use river encounters
};

/**
 * Rarity weights for encounter selection
 */
const RARITY_WEIGHTS = {
  common: 0.70,    // 70% chance
  uncommon: 0.25,  // 25% chance
  rare: 0.05       // 5% chance
};

/**
 * Roll for a random encounter based on current archetype
 * Uses weighted rarity selection
 */
export function rollForLiminalEncounter(archetype: MapArchetype): LiminalEncounter | null {
  const pool = ENCOUNTER_POOLS[archetype];

  // No encounters defined for this archetype
  if (!pool || pool.length === 0) {
    console.log(`[Liminal Encounter] No encounters defined for archetype: ${archetype}`);
    return null;
  }

  // Roll for rarity tier
  const rarityRoll = Math.random();
  let targetRarity: 'common' | 'uncommon' | 'rare';

  if (rarityRoll < RARITY_WEIGHTS.common) {
    targetRarity = 'common';
  } else if (rarityRoll < RARITY_WEIGHTS.common + RARITY_WEIGHTS.uncommon) {
    targetRarity = 'uncommon';
  } else {
    targetRarity = 'rare';
  }

  // Filter encounters by rarity
  const filtered = pool.filter(encounter => encounter.rarity === targetRarity);

  // Fallback if no encounters of this rarity exist
  if (filtered.length === 0) {
    console.log(`[Liminal Encounter] No ${targetRarity} encounters for ${archetype}, using any available`);
    const anyEncounter = pool[Math.floor(Math.random() * pool.length)];
    return anyEncounter;
  }

  // Select random encounter from filtered list
  const selectedEncounter = filtered[Math.floor(Math.random() * filtered.length)];

  console.log(`[Liminal Encounter] Rolled ${targetRarity} encounter: ${selectedEncounter.title}`);
  return selectedEncounter;
}

/**
 * Get the base encounter chance per segment
 * Can be modified based on difficulty settings in the future
 */
export function getEncounterChance(): number {
  return 0.15; // 15% base chance per segment
}

/**
 * Check if an encounter should trigger based on chance
 */
export function shouldTriggerEncounter(): boolean {
  return Math.random() < getEncounterChance();
}

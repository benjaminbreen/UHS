/**
 * utils/npcLocationUtils.ts - Utilities for NPC home and work location calculations
 */

import { NpcEntity, TerrainStructure } from '../types';
import { getRelativeDirection } from './geographyUtils';

export interface LocationInfo {
  workLocation: string;
  homeLocation: string;
  homeLocationText: string; // For dialogue context
}

/**
 * Calculate NPC's work and home location info for display and dialogue
 * Reused by both NpcModal and dialogue services for consistency
 */
export function calculateNpcLocationInfo(
  npc: NpcEntity,
  terrainStructures: TerrainStructure[],
  isPlayer: boolean = false
): LocationInfo {
  let work = 'Unemployed';
  let home = 'No permanent residence';
  let homeText = '';

  if (!isPlayer) {
    // Work location
    const workplace = terrainStructures.find(s => s.id === npc.workplaceId);
    if (workplace) work = workplace.name;

    // Home location with direction
    if (npc.homeLocation) {
      const direction = getRelativeDirection({ x: npc.x, y: npc.y }, npc.homeLocation as any);
      home = `Lives in a settlement ${direction}`;
      homeText = `Lives in a settlement ${direction}`;
    }
  }

  return {
    workLocation: work,
    homeLocation: home,
    homeLocationText: homeText
  };
}

/**
 * Convert home location text to dialogue-friendly format
 * "Lives in a settlement to the northeast" -> "to the northeast"
 */
export function getHomeLocationForDialogue(homeLocationText: string): string {
  if (!homeLocationText) return '';

  // Extract just the directional part
  const match = homeLocationText.match(/Lives in a settlement (.+)/);
  return match ? match[1] : '';
}
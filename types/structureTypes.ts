/**
 * types/structureTypes.ts - Types for player-deployed structures
 */
import { Item } from './itemTypes';

export type StructureType = 'tent' | 'stone_house';

export interface DeployedStructure {
  id: string;
  structureItem: Item; // The item that was used to create the structure
  type: StructureType;
  x: number;
  y: number;
  deployedAt: number; // Timestamp
  condition: number; // 0-100, structures degrade over time
  isOwned: boolean; // Whether the player owns this structure
}

/**
 * types/vesselTypes.ts - Types for deployed vessels on the map
 */
import { Item } from './itemTypes';

export interface DeployedVessel {
  id: string;
  vesselItem: Item; // The original vessel item
  x: number; // grid x position on map
  y: number; // grid y position on map
  deployedAt: number; // timestamp when deployed
  condition: number; // 0-100, affects seaworthiness
  isAvailable: boolean; // true if player can embark, false if occupied by NPCs etc.
}
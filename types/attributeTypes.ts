/**
 * types/attributeTypes.ts - Character attribute badge system
 */

import { IconType } from 'react-icons';
import { PlayerCharacter } from './playerCharacter';
import { NpcEntity } from './npcTypes';

export type AttributeRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface AttributeBadge {
  id: string;
  name: string;
  icon: string; // We'll store icon name as string and resolve it in component
  rarity: AttributeRarity;
  description: string;
  category: 'physical' | 'mental' | 'social' | 'spiritual' | 'skill' | 'cultural' | 'era';
  
  // Optional fields
  condition?: (character: PlayerCharacter | NpcEntity) => boolean;
  effect?: string; // Game effect description
  dialogueHint?: string; // How it affects NPC dialogue
  
  // Culture/era restrictions
  requiredEra?: string[]; // e.g., ['medieval', 'renaissance']
  requiredCulture?: string[]; // e.g., ['european', 'islamic', 'chinese']
  requiredGeography?: string[]; // From geography.ts zones
  yearRange?: [number, number]; // e.g., [1000, 1500]
  
  // Exclusivity
  excludes?: string[]; // Cannot have these other attributes
  requires?: string[]; // Must have these other attributes
}

export interface CharacterAttributes {
  badges: AttributeBadge[];
  maxBadges: number; // Usually 0-3
}

// Rarity colors
export const RARITY_COLORS: Record<AttributeRarity, string> = {
  common: '#6B7280', // Gray
  uncommon: '#10B981', // Green
  rare: '#3B82F6', // Blue
  epic: '#8B5CF6', // Purple
  legendary: '#F59E0B', // Gold
};

// Rarity chances (out of 1000)
export const RARITY_WEIGHTS: Record<AttributeRarity, number> = {
  common: 400, // 40%
  uncommon: 250, // 25%
  rare: 100, // 10%
  epic: 30, // 3%
  legendary: 10, // 1%
};
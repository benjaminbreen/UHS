/**
 * types/knowledge.ts - Defines types for the Beliefs and Technology systems.
 */
import { HistoricalEra, CulturalZone } from './index';

// --- Beliefs & Ideology System ---

export interface Ideology {
  id: string; // e.g., 'OTTOMAN_SUNNI_ISLAM_16C', 'ENGLISH_PROTESTANTISM_17C'
  name: string;
  description: string; // General tenets
  eras: HistoricalEra[];
  culturalZones: CulturalZone[];
  religions: string[]; // Associated religions
  associatedBeliefs: { // Weighted chances for specific beliefs
    [beliefId: string]: number; // e.g., { 'DIVINE_RIGHT_OF_KINGS': 0.8, 'GHOSTS_ARE_REAL': 0.6 }
  }
}

export interface PersonalBelief {
  id: string; // e.g., 'GHOSTS_ARE_REAL'
  text: string; // The belief itself, e.g., "Believes that the spirits of the dead linger in this world."
  tags: string[]; // 'supernatural', 'political', 'ethical', 'traditional', 'progressive', 'epistemology', 'religious', 'animism'
  icon: string; // Emoji or symbol
}


// --- Technology System (Placeholder from roadmap) ---

export interface Technology {
  id: string; // e.g., 'IRON_WORKING', 'THREE_FIELD_SYSTEM'
  name: string;
  description: string;
  era: HistoricalEra; // The era it becomes common
  century?: number; // The century it appears for more granularity
  prerequisites?: string[]; // Array of tech IDs needed to unlock this
  unlocks: {
    craftingRecipes?: string[]; // Array of item baseIds
    structures?: string[]; // Array of new structure types
    mapEffects?: string[]; // e.g., 'IMPROVED_FARM_YIELD'
  };
}

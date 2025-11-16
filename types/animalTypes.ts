/**
 * types/animalTypes.ts - Type definitions related to wildlife.
 */
import { BiomeType, ClimateType, Point, StatusEffect, CulturalZone } from './index';
import { CharacterHealth } from './diseaseTypes';

export interface AnimalSpecies {
    name: string;
    linnaeanName: string;
    emoji?: string; // Optional: some species might use a unique emoji
}

export interface AnimalData {
  name: string;
  emoji: string;
  imagePath?: string; // Optional path to custom PNG image in /public/animals/
  type: 'Prey' | 'Predator' | 'Domestic' | 'Ambient' | 'Mythical';
  social: 'solitary' | 'herd' | 'pack'; // NEW: Behavior grouping
  sizeMultiplier?: number; // Visual size multiplier (1.0 = default, 0.3 = tiny, 2.0 = huge)
  attack: number;
  defense: number;
  maxHealth: number;
  speed: number;
  strength: number;
  agility: number;
  perception: number;
  level: number;
  drops: { name: string; chance: number; }[];
  spawnBiomes: BiomeType[];
  spawnConditions: {
    minBiodiversity?: number;
    maxBiodiversity?: number;
    maxSafety?: number;
    minSafety?: number;
    minSacrality?: number;
    minAltitude?: number;
    climate?: ClimateType[];
    zones?: CulturalZone[];
    regions?: string[];
    nearSettlement?: boolean;
    remote?: boolean;
    nocturnal?: boolean; // Only spawns at night
    season?: ('spring' | 'summer' | 'fall' | 'winter' | 'wet' | 'dry')[]; // Seasonal spawning
  };
  habitat?: 'forest' | 'grassland' | 'mountain' | 'aquatic' | 'desert' | 'tundra' | 'wetland';
  behaviorProfile?: 'deer' | 'wolf' | 'bear' | 'rabbit';
  specialAttack?: {
    type: StatusEffect['type'];
    chance: number;
    potency?: number; // e.g., damage per turn
    duration: number;
  };
  description?: string; // Description of the animal
}

export type AnimalAiState = 'idle' | 'wandering' | 'fleeing' | 'chasing' | 'stalking' | 'attacking' | 'coordinating' | 'tracking' | 'returning' | 'patrolling' | 'foraging' | 'grazing' | 'investigating';

export interface AnimalEntity {
  id: string;
  baseId: string; // e.g., 'WOLF', 'DEER'
  speciesName: string;
  linnaeanName: string;
  emoji: string;
  imagePath?: string; // Optional path to custom PNG image in /public/animals/
  x: number; // grid x
  y: number; // grid y
  
  // Instance-specific stats
  age: number;
  isDomestic: boolean;
  health: number;
  maxHealth: number;
  diseaseHealth?: CharacterHealth; // Disease tracking
  stats: {
    level: number;
    attack: number;
    defense: number;
    speed: number;
    strength: number;
    agility: number;
    perception: number;
    luck: number; // Added for crits
  };

  // AI State
  type: AnimalData['type'];
  aiState: AnimalAiState;
  target: Point | string | null; // Point for wandering, string for entity ID to chase/flee
  statusEffects: StatusEffect[];
}
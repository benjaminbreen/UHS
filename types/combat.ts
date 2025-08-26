/**
 * types/combat.ts - Type definitions for the combat system.
 */
import { AnimalEntity } from './animalTypes';
import { NpcEntity } from './npcTypes';


export type StatusEffectType = 'poison' | 'burn' | 'stunned' | 'calm' | 'bleeding' | 'defense_down' | 'on_fire' | 'observed' | 'defending' | 'feeling_cold' | 'feeling_hot' | 'feeling_wet';

export interface StatusEffect {
  type: StatusEffectType;
  duration: number; // in turns
  potency?: number; // e.g., damage per turn for poison/burn
  source?: string; // e.g., "Cobra Bite", "Torch"
}

export type EncounterableEntity = (AnimalEntity | NpcEntity) & { statusEffects: StatusEffect[] };

export type CombatTalkOutcome = 'attack' | 'flee' | 'neutral';

export interface CombatTalkResponse {
    dialogue: string;
    outcome: CombatTalkOutcome;
}
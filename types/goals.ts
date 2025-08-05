/**
 * types/goals.ts - Defines types for the procedural NPC goal system.
 */
import { WealthLevel } from './characterData';
import { CharacterPersonality, CharacterSocialContext, CharacterStats } from './playerCharacter';

export type GoalArchetype = 'ACQUIRE' | 'PROTECT' | 'CREATE' | 'DISCOVER' | 'ASCEND' | 'AVENGE';
export type GoalTargetType = 'ITEM' | 'LOCATION' | 'NPC' | 'FACTION' | 'CONCEPT' | 'RESOURCE' | 'STRUCTURE';

export interface GoalConstraint {
    professions?: string[];
    classes?: string[];
    wealthLevels?: WealthLevel[];
    beliefs?: string[]; // PersonalBelief IDs
    personality?: {
        minOpenness?: number; maxOpenness?: number;
        minConscientiousness?: number; maxConscientiousness?: number;
        minExtraversion?: number; maxExtraversion?: number;
        minAgreeableness?: number; maxAgreeableness?: number;
        minNeuroticism?: number; maxNeuroticism?: number;
    };
    stats?: {
        minStrength?: number; maxStrength?: number;
        minDexterity?: number; maxDexterity?: number;
        minStamina?: number; maxStamina?: number;
        minConstitution?: number; maxConstitution?: number;
        minIntelligence?: number; maxIntelligence?: number;
        minWisdom?: number; maxWisdom?: number;
        minCharisma?: number; maxCharisma?: number;
        minPerception?: number; maxPerception?: number;
        minCraftiness?: number; maxCraftiness?: number;
        minPersuasion?: number; maxPersuasion?: number;
        minLuck?: number; maxLuck?: number;
    };
    socialContext?: {
        minPrivilege?: number; maxPrivilege?: number;
        minWanderlust?: number; maxWanderlust?: number;
        minReligiosity?: number; maxReligiosity?: number;
        minAmbition?: number; maxAmbition?: number;
    };
    hasFamily?: boolean;
}

export interface GoalTarget {
  id: string;
  targetType: GoalTargetType;
  archetypes: GoalArchetype[];
  descriptionTemplate: string;
  constraints: GoalConstraint;
}
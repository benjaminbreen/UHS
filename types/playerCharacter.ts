/**
 * types/playerCharacter.ts - Defines the core data structure for the player character and shared character traits.
 */
import { Item } from './itemTypes';
import { Gender, WealthLevel, CulturalZone, Appearance } from './characterData';
import { HistoricalEra } from './ambiance';
import { StatusEffect } from './combat';
import { FamilyMember, LifeEvent } from './npcTypes';
import { InteriorViewState, Point } from './index';
import { CharacterHealth } from './diseaseTypes';
import { AttributeBadge } from './attributeTypes';

export type EquipmentSlot = 'head' | 'torso' | 'legs' | 'feet' | 
                          'main_hand' | 'off_hand' | 
                          'cloak' | 'belt' | 'necklace' | 'ring1' | 'accessory';

export interface CharacterAbilities {
    canHeal?: boolean; // Can diagnose and treat diseases
    canCraft?: boolean; // Can craft items
    canTame?: boolean; // Can tame animals
    canNavigate?: boolean; // Enhanced navigation abilities
    canTrade?: boolean; // Better trading prices
    canTeach?: boolean; // Can teach skills to others
    canPray?: boolean; // Religious abilities
    canFight?: boolean; // Combat bonuses
    canForage?: boolean; // Better foraging results
    canSmith?: boolean; // Metalworking abilities
}

export interface MedicalSkills {
    diagnosisAccuracy: number; // 0-100, affects correct disease identification
    treatmentEffectiveness: number; // 0-100, affects healing success rate
    herbalistKnowledge: number; // 0-100, knowledge of medicinal plants
    surgicalSkill: number; // 0-100, for advanced procedures
    patientTrust: number; // 0-100, affects patient cooperation
}

export interface CharacterStats {
    // Core Attributes
    strength: number;
    dexterity: number;
    stamina: number;
    constitution: number;
    
    // Mental Attributes
    intelligence: number;
    wisdom: number;
    charisma: number;
    perception: number;
    craftiness: number;
    persuasion: number;

    // Special Attributes
    luck: number;

    // For combat modal compatibility - may not belong here but useful for now
    level: number;  
    attack: number;
    defense: number;
    physicalResist: number;
    dodgeBonus: number;
}

export interface CharacterPersonality {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
}

export interface CharacterSocialContext {
    privilege: number;
    wanderlust: number;
    religiosity: number;
    ambition: number;
    entrepreneurial: number;
}


export interface PartyMember { id: string; name: string; role: string; health: number; maxHealth: number; }
export interface GameEvent { id: string; timestamp: number; description: string; type: 'quest' | 'discovery' | 'skill_gain' | 'system'; }

export interface PlayerCharacter {
    id: string;
    name: string;
    age: number;
    gender: Gender;
    profession: string;
    backstory: string;

    stats: CharacterStats;
    personality: CharacterPersonality;
    socialContext: CharacterSocialContext;

    experience: number;
    maxExperience: number;
    health: number; // Current health
    maxHealth: number;
    fatigue: number;
    maxFatigue: number;
    level: number;
    currency: number;
    religion: string;

    inventory: Item[];
    equippedItems: Partial<Record<EquipmentSlot, Item>>;
    isNaked?: boolean; // Computed: true if no torso item equipped
    
    party: PartyMember[];
    eventLog: GameEvent[];
    statusEffects: StatusEffect[];
    attributes?: AttributeBadge[]; // Character's special attributes/badges

    profileImage: string;
    isLlmEnhanced?: boolean;

    // Properties added for consistency with NpcEntity
    class?: string;
    wealthLevel: WealthLevel;
    era: HistoricalEra;
    culturalZone: CulturalZone;
    portraitSeed?: number;

    appearance: Appearance;
    birthplace: string;
    birthYear?: string; // Year the character was born

    // Additional properties for compatibility
    occupation?: string; // Alternative name for profession
    historicalEra?: HistoricalEra; // Alias for era
    year?: number; // Current game year
    hometown?: string; // Alternative name for birthplace
    reputation?: number; // Alternative name for mapReputation

    ideology: string; // ID of the character's primary Ideology
    beliefs: { beliefId: string; conviction: number }[]; // NEW: Beliefs system

    // Memory & Reputation
    family: FamilyMember[];
    lifeEvents: LifeEvent[];
    mapReputation: number;
    
    // Disease System
    diseaseHealth?: CharacterHealth;

    // New properties for interior view state
    interiorViewState?: InteriorViewState | null;
    interiorMapPlayerPos?: Point | null;
    
    // Abilities and Skills
    abilities?: CharacterAbilities;
    medicalSkills?: MedicalSkills;

    // Physical Feat System - Elevated States
    elevatedState?: 'in_tree' | 'on_roof' | 'on_wall';
    elevationDescription?: string;

    // Play Time Tracking
    totalPlayTimeMinutes?: number; // Total play time across all sessions (minutes)
    sessionStartTime?: number; // Timestamp when current session started
}
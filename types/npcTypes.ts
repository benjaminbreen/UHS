/**
 * types/npcTypes.ts - Type definitions for the procedural NPC generation system.
 */
import { Point } from './core/geometry';
import { CharacterStats, CharacterPersonality, CharacterSocialContext, StatusEffect, Item, EquipmentSlot } from './index';
import { HistoricalEra } from './ambiance';
import { CulturalZone, Gender, WealthLevel, Appearance } from './characterData'; // Use centralized types
import { Allegiance } from './structures';
import { GoalArchetype, GoalTargetType } from './goals';
import { CharacterHealth } from './diseaseTypes';
import { AttributeBadge } from './attributeTypes';

export type NpcStats = CharacterStats;
export type NpcPersonality = CharacterPersonality;
export type NpcSocialContext = CharacterSocialContext;

/**
 * Defines the movement pattern for an NPC on a detail map.
 */
export interface MovementPattern {
    type: 'stationary' | 'patrol' | 'wander';
    path?: Point[]; // For patrol routes
    currentTargetIndex?: number;
    home?: Point;
    work?: Point;
}

export type NpcActivity = 'idle' | 'wandering' | 'working' | 'patrolling' | 'traveling' | 'commuting_to_work' | 'commuting_home';

export interface LifeEvent {
    year: number;
    event: string;
}

export interface PersonalGoal {
  archetype: GoalArchetype;
  targetType: GoalTargetType;
  targetId: string; // e.g., 'IRON_ORE', 'npc_456', 'HONOR'
  description: string; // e.g., "Acquire a vein of high-quality iron ore."
}

export interface FamilyMember {
    name: string;
    relation: 'father' | 'mother' | 'spouse' | 'son' | 'daughter' | 'sibling';
    age?: number;
    profession?: string;
}

/**
 * New interface for NPC memory to track reputation and relationships.
 */
export interface NpcMemory {
  opinionOfPlayer: number; // A scale from -100 (hated) to 100 (revered)
  knownFactsAboutPlayer: Set<string>; // e.g., 'PLAYER_KILLED_MERCHANT_JONAS', 'PLAYER_GAVE_GOLD'
  relationships: Map<string, { opinion: number; type: 'family' | 'friend' | 'rival' }>; // NPC_ID -> Relationship
  conversationSummaries: string[];
}


/**
 * The core data structure for a procedurally generated Non-Player Character.
 * Contains both high-level stats and detailed visual information for rendering.
 */
export interface NpcEntity {
    id: string;
    name: string; // Initially 'Stranger', 'Villager', etc. Populated by LLM on first interaction.
    x: number; // grid x on map
    y: number; // grid y on map
    
    // Core Generated Profile
    health: CharacterHealth;
    maxHealth: number;
    stats: NpcStats;
    personality: NpcPersonality;
    socialContext: NpcSocialContext;
    class: string; // e.g., 'ARTISAN', 'COMMONER'
    role: string; // e.g., 'Blacksmith', 'Farmer'
    
    // Visual "Baseline Truth"
    emoji: string; // The base emoji for the role
    age: number;
    gender: Gender;
    wealthLevel: WealthLevel;
    portraitSeed?: number; // Added for portrait consistency

    appearance: Appearance;
    
    // Descriptions (procedurally generated first, then potentially enhanced)
    descriptions: {
        short: string;
        long: string;
    };
    backstory: string;

    // AI & Movement State
    activity: NpcActivity;
    movement: MovementPattern;
    targetX: number;
    targetY: number;
    direction: 'up' | 'down' | 'left' | 'right';
    walkFrame: number;
    onRoad: boolean;
    aiState: 'idle' | 'wandering' | 'hostile_fleeing' | 'attacking_chasing';

    // Context
    era: HistoricalEra;
    culturalZone: CulturalZone;
    religion: string;
    allegianceGroup?: Allegiance;
    statusEffects: StatusEffect[];
    equippedItems?: Partial<Record<EquipmentSlot, Item>>;
    inventory: Item[];
    currency: number;
    birthplace: string;
    workplaceId?: string;
    workplaceName?: string;

    // Procedural Life Story
    family: FamilyMember[];
    lifeEvents: LifeEvent[];
    personalGoal: PersonalGoal;
    ideology: string; // ID of the character's primary Ideology
    beliefs: { beliefId: string; conviction: number }[]; // NEW: Beliefs system
    homeLocation?: Point;
    attributes?: AttributeBadge[]; // Character's special attributes/badges

    // Memory & Reputation
    memory: NpcMemory;
    
    // Interior-specific behavior
    isHostile?: boolean;
    patrolRoute?: Point[];
    currentPatrolIndex?: number;
    guardedRoom?: string; // Room ID being guarded
    requiredReligionToPass?: string;
    requiredClassToPass?: string[];
    confrontationDialogue?: string[];
    hasConfrontedPlayer?: boolean;
    
    // Factory worker attributes
    fatigue?: number; // 0-1, how tired the worker is
    morale?: number; // 0-1, worker happiness/motivation
    workplace?: string; // ID of workplace structure
    profession?: string; // Specific job title
    shift?: 'morning' | 'afternoon' | 'night'; // Current work shift
    currentActivity?: string; // Detailed current activity
    reputation?: number; // Social standing
    location?: Point; // Current location
    
    // Enhanced NPC behavior system
    isInsideBuilding?: boolean; // Whether NPC is currently inside a building
    buildingId?: string; // ID of building they're inside
    travelDestination?: Point; // Where they're traveling to
    isLeavingMap?: boolean; // About to exit map edge
    mapEntryDirection?: 'north' | 'south' | 'east' | 'west'; // Where they entered from
    shipId?: string; // ID of ship if on water
    
    // Animals and companions
    tamedAnimals?: Array<{
        type: string;
        name?: string;
        position: Point; // Relative to NPC
    }>;
    
    // Enhanced relationship tracking
    playerRelationship?: {
        attitude: number; // -100 to 100
        memories: Array<{
            action: string;
            impact: number;
            timestamp: number;
        }>;
        willConfront: boolean;
        willAttack: boolean;
    };
}

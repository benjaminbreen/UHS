/**
 * types/skillTypes.ts - Type definitions for the player skills system.
 */
import { AmbianceContext, AnyTile, AnyEntity, ViewMode, AnimalEntity, Rarity, Item, PlayerCharacter, TerrainStructure, StatusEffect, EncounterableEntity, MapData, NpcEntity, GameDate } from './index';

export type SkillID = 'OBSERVE' | 'FORAGE' | 'DIG' | 'CHOP' | 'BURN' | 'THRUST' | 'SING' | 'POWER_STRIKE' | 'BANDAGE_WOUNDS' | 'INTIMIDATING_SHOUT' | 'PARRY' | 'GRAPPLE' | 'FEINT';

export interface SkillDefinition {
    id: SkillID;
    name: string;
    description: string;
    type: 'llm' | 'procedural';
    icon: string;
    fatigueCost?: number;
    target?: 'self' | 'opponent';
}

export interface PlayerContext {
    viewMode: ViewMode;
    currentTile: AnyTile;
    currentEntity?: AnyEntity | null;
    ambianceContext: AmbianceContext;
    animals?: AnimalEntity[];
    playerCharacter?: PlayerCharacter | null;
    playerX?: number | null;
    playerY?: number | null;
    terrainStructures?: TerrainStructure[];
    combatant?: EncounterableEntity | null;
    mapData?: MapData | null;
    npcs?: NpcEntity[];
    gameDate?: GameDate;
    gameTime?: { hours: number; minutes: number };
    season?: string;
    currentVessel?: Item | null;
    // Interior context information
    interiorContext?: {
        buildingType: string;
        buildingName: string;
        currentSpace?: string;
        religion?: string;
        culturalZone?: string;
        layoutName?: string;
    };
}

export interface ObserveSkillResult {
    type: 'observe';
    description: string;
    xpGained?: number;
    context?: {
        biome?: string;
        culturalZone?: string;
        weather?: any;
        timeOfDay?: string;
        gameTime?: { hours: number; minutes: number };
        playerX?: number;
        playerY?: number;
    };
}

export interface ForageSkillResult {
    type: 'forage';
    success: boolean;
    item?: {
        name: string;
        description?: string;
        rarity: Rarity;
    };
    message: string;
    entityToRemoveId?: string;
    xpGained?: number;
    context?: {
        biome?: string;
    };
}

export interface DigSkillResult {
    type: 'dig';
    success: boolean;
    message: string;
    item?: Item; // The ore item instance
    xpGained?: number;
    tileCoords?: { x: number, y: number }; // The tile that was mined
    amountExtracted?: number; // How much was removed from the deposit
    injury?: any; // Injury from failed skill attempt
    context?: {
        biome?: string;
    };
}

export interface ChopSkillResult {
    type: 'chop';
    success: boolean;
    message: string;
    item?: Item;
    xpGained?: number;
    entityToRemoveId?: string;
    injury?: any; // Injury from failed skill attempt
    context?: {
        biome?: string;
    };
}

export interface CombatSkillResult {
    type: 'combat';
    success: boolean;
    message: string;
    damageDealt?: number;
    statusEffectApplied?: StatusEffect;
    xpGained?: number;
}

export interface SingSkillResult {
    type: 'sing';
    success: boolean;
    song: string;
    message: string;
    performanceScore: number;
    reputationChange: number;
    xpGained?: number;
}

export interface StudySkillResult {
    type: 'study';
    action: string; // 'observe', 'compare', 'muse', 'anatomize'
    actionEmoji: string;
    description: string;
    items: {
        name: string;
        emoji?: string;
    }[];
    xpGained?: number;
    context?: {
        biome?: string;
        culturalZone?: string;
        location?: string;
        date?: string;
    };
}

export type SkillResult = ObserveSkillResult | ForageSkillResult | DigSkillResult | CombatSkillResult | ChopSkillResult | SingSkillResult | StudySkillResult | null;

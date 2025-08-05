/**
 * types/skillTypes.ts - Type definitions for the player skills system.
 */
import { AmbianceContext, AnyTile, AnyEntity, ViewMode, AnimalEntity, Rarity, Item, PlayerCharacter, TerrainStructure, StatusEffect, EncounterableEntity, MapData, NpcEntity, GameDate } from './index';

export type SkillID = 'OBSERVE' | 'FORAGE' | 'DIG' | 'CHOP' | 'BURN' | 'SING' | 'POWER_STRIKE' | 'FIRST_AID' | 'INTIMIDATING_SHOUT';

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
}

export interface ObserveSkillResult {
    type: 'observe';
    description: string;
    xpGained?: number;
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
}

export interface DigSkillResult {
    type: 'dig';
    success: boolean;
    message: string;
    item?: Item; // The ore item instance
    xpGained?: number;
    tileCoords?: { x: number, y: number }; // The tile that was mined
    amountExtracted?: number; // How much was removed from the deposit
}

export interface ChopSkillResult {
    type: 'chop';
    success: boolean;
    message: string;
    item?: Item;
    xpGained?: number;
    entityToRemoveId?: string;
}

export interface CombatSkillResult {
    type: 'combat';
    success: boolean;
    message: string;
    damageDealt?: number;
    statusEffectApplied?: StatusEffect;
    xpGained?: number;
}

export type SkillResult = ObserveSkillResult | ForageSkillResult | DigSkillResult | CombatSkillResult | ChopSkillResult | null;

/**
 * types/itemTypes.ts - Type definitions for items in the game.
 */
import { EquipmentSlot, StatusEffectType, CulturalZone } from './index';

export type Rarity = 'Junk' | 'Common' | 'Uncommon' | 'Rare' | 'Ultra-rare' | 'Unique';
export type ItemCategory = 'Tool' | 'Weapon' | 'Material' | 'Apparel' | 'Food' | 'Special' | 'Document' | 'Consumable';

export interface ItemDefinition {
    baseId: string;
    name: string;
    description: string;
    emoji: string;
    rarity: Rarity;
    value: number;
    weight: number;
    wearable: boolean;
    stackable: boolean;
    category: ItemCategory;
    // New fields
    attack: number;
    defense?: number;
    sustenance: number; // For HP restoration
    fatigueEffect?: number; // For fatigue restoration
    xpEffect?: number; // For XP gain
    wieldable: boolean;
    throwable: boolean;
    craftingValue: number;
    equipmentSlot?: EquipmentSlot;
    material?: string;
    damage?: number; // For combat items like bombs
    statusEffect?: {
        type: StatusEffectType;
        chance: number;
        duration: number;
        potency?: number;
    };
    eraAvailability?: { startYear: number; endYear: number; };
    culturalAvailability?: CulturalZone[];
}

// Represents a specific instance of an item in the game world or inventory
export interface Item extends ItemDefinition {
    id: string; // Unique instance ID, e.g., 'item-12345'
    quantity: number;
}

// NEW: For Gemini-powered crafting
export interface CraftingResult {
    success: boolean;
    outcome: {
        newItems: ItemDefinition[] | null;
        consumedItemIds: string[];
        message: string;
    };
}
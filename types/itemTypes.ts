/**
 * types/itemTypes.ts - Type definitions for items in the game.
 */
import { EquipmentSlot, StatusEffectType, CulturalZone } from './index';

export type Rarity = 'Junk' | 'Common' | 'Uncommon' | 'Rare' | 'Ultra-rare' | 'Unique';
export type ItemCategory = 'Tool' | 'Weapon' | 'Material' | 'Apparel' | 'Food' | 'Special' | 'Document' | 'Consumable' | 'Vessel' | 'Ammunition' | 'Container' | 'Currency' | 'Armor';

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

// Quality levels for minerals and crafted items
export type ItemQuality = 'poor' | 'standard' | 'good' | 'excellent';

// Represents a specific instance of an item in the game world or inventory
export interface Item extends ItemDefinition {
    id: string; // Unique instance ID, e.g., 'item-12345'
    quantity: number;
    quality?: ItemQuality; // Quality level for minerals, metals, and crafted items
    color?: string; // Color of the item (e.g., "Navy", "Crimson", etc.) for clothing
    condition?: number; // Condition from 0-100 (100 = pristine, 0 = broken)
    culturalStyle?: string; // Cultural variation (e.g., "Celtic", "Roman", "Japanese")
    crafterName?: string; // Name of the crafter for unique items
    age?: number; // Age of the item in years
    enchantments?: string[]; // Magical or special properties (if applicable)
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
/**
 * types/vegetationTypes.ts - Defines types for procedurally placed vegetation.
 */

// A generic classification of the vegetation type.
export type VegetationBaseType = 'deciduous_tree' | 'coniferous_tree' | 'palm_tree' | 'cactus' | 'generic_bush';

// Represents a specific species of vegetation.
export interface VegetationSpecies {
    name: string;
    linnaeanName: string;
    emoji?: string;
    drops?: { name: string; chance: number }[]; // What can be foraged
}

// Represents rarity tiers for vegetation species
export interface VegetationRarityTiers {
    common: VegetationSpecies[];
    rare: VegetationSpecies[];
    superRare: VegetationSpecies[];
    ultraRare: VegetationSpecies[];
}

// Represents a single instance of vegetation on the map.
export interface VegetationEntity {
    id: string;
    baseType: VegetationBaseType; // The general category
    speciesName: string; // The specific common name, e.g., "Kapok Tree"
    linnaeanName: string; // The scientific name, e.g., "Ceiba pentandra"
    symbol: string; // Key for the SVG symbol component, e.g., 'deciduous', 'palm', 'pine', 'cactus', 'bush'
    x: number; // TILE grid x
    y: number; // TILE grid y
    rarity?: 'common' | 'rare' | 'superRare' | 'ultraRare'; // Optional rarity classification for trading systems
}

// Trading value interface for valuable vegetation species
export interface VegetationTradingData {
    baseValue: number; // Base trading value in coins
    demandMultiplier: number; // Regional demand multiplier
    rarityBonus: number; // Bonus value based on rarity
    culturalSignificance?: string; // Cultural importance in specific regions
}

// Enhanced species interface for data definitions
export interface EnhancedVegetationSpecies extends VegetationSpecies {
  tradeValue?: 'none' | 'low' | 'medium' | 'high' | 'legendary'; // Economic importance
  uses?: string[]; // What the plant is used for (medicine, dye, food, etc.)
  biomePreference?: string[]; // Specific biomes where this is more likely
  drops?: { name: string; chance: number; }[]; // What can be foraged
}
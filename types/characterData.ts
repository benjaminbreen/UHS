/**
 * types/characterData.ts - Centralized types for character data.
 */

export type CulturalZone = 'EUROPEAN' | 'EAST_ASIAN' | 'MENA' | 'NORTH_AMERICAN_PRE_COLUMBIAN' | 'NORTH_AMERICAN_COLONIAL' | 'OCEANIA' | 'SOUTH_ASIAN' | 'SOUTH_AMERICAN' | 'SUB_SAHARAN_AFRICAN';
export type WealthLevel = 'poor' | 'modest' | 'comfortable' | 'wealthy' | 'noble';
export type Gender = 'Male' | 'Female' | 'Non-binary';
export type Religion = string;

export interface ClothingPiece {
    name: string;
    material: string;
    adjectives?: string[];
}

export interface ClothingPalette {
    primary: string;
    secondary: string;
    accent: string;
}

export interface ClothingSet {
    garments: ClothingPiece[];
    headgear: ClothingPiece[];
    footwear: ClothingPiece[];
    belts: ClothingPiece[];
    accessories: ClothingPiece[];
    palette: {
        primary: string[];
        secondary: string[];
        accent: string[];
    };
}

// The new single source of truth structure, combining all visual data.
export interface Appearance {
    // Base physical features - core identity
    skinColor: string;
    hairColor: string;
    eyeColor: string;
    hairstyle: string;
    build: 'slight' | 'average' | 'stocky' | 'heavy' | 'athletic' | 'tall' | 'short' | 'imposing';
    
    // Facial characteristics from portrait
    faceShape: 'oval' | 'round' | 'square' | 'long' | 'heart' | 'diamond';
    eyeShape: 'almond' | 'round' | 'narrow' | 'wide' | 'hooded';
    noseShape: 'straight' | 'aquiline' | 'broad' | 'button' | 'roman';
    cheekbones: 'high' | 'average' | 'low';
    jawline: 'sharp' | 'soft' | 'square' | 'round' | 'oval';

    // Hair and facial hair from portrait
    hairTexture: 'straight' | 'wavy' | 'curly' | 'coily' | 'kinky';
    hairLength: 'bald' | 'very_short' | 'short' | 'medium' | 'long' | 'very_long';
    facialHair: boolean;
    facialHairStyle?: 'full_beard' | 'goatee' | 'mustache' | 'stubble' | 'van_dyke' | 'soul_patch' | 'mutton_chops';
    facialHairThickness?: 'sparse' | 'medium' | 'thick';

    // Skin details from portrait
    skinTone: 'very_pale' | 'pale' | 'fair' | 'light' | 'medium' | 'olive' | 'tan' | 'dark' | 'very_dark';
    skinTexture: 'smooth' | 'rough' | 'weathered' | 'scarred' | 'freckled';

    // Eye details from portrait
    eyebrowShape: 'straight' | 'arched' | 'rounded' | 'angular';
    eyebrowThickness: 'thin' | 'medium' | 'thick' | 'bushy';
    eyelashes: 'short' | 'medium' | 'long';

    // Lip details from portrait
    lipShape: 'thin' | 'medium' | 'full' | 'bow' | 'wide';
    lipColor?: string;
    
    // From generateBodyMetrics
    height: number;
    weight: number;
    affect: string;

    // From the NEW generateClothing
    garment: ClothingPiece;
    headgear: ClothingPiece;
    footwear: ClothingPiece;
    belt: ClothingPiece;
    accessory: ClothingPiece;
    palette: ClothingPalette;

    // Optional detailed fields from portrait
    hasGlasses?: boolean;
    glassesStyle?: 'round' | 'square' | 'oval' | 'half_rim';
    jewelry?: {
        type: 'necklace' | 'earrings' | 'bracelet' | 'ring' | 'circlet' | 'brooch' | 'chain' | 'anklet';
        material: 'gold' | 'silver' | 'bronze' | 'gems' | 'pearl' | 'bone' | 'wood';
        style: 'simple' | 'ornate' | 'delicate' | 'chunky';
        gems?: string[];
    }[];
    markings?: {
        type: 'scar' | 'tattoo' | 'paint' | 'beauty_mark' | 'freckles' | 'mole' | 'birthmark';
        location: string;
        color: string;
        size: 'small' | 'medium' | 'large';
        pattern?: string;
    }[];
}
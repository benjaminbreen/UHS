/**
 * Route difficulty system for challenging geographical passages
 * Affects travel time, danger level, and supply consumption
 */

import { MapArchetype } from '../../types';

export enum RouteDifficulty {
    EASY = 'easy',           // Normal travel speed
    MODERATE = 'moderate',   // 1.5x travel time
    HARD = 'hard',          // 2x travel time, risk of mishaps
    EXTREME = 'extreme',    // 3x travel time, high risk
    DEADLY = 'deadly'       // 4x travel time, very high risk
}

export interface DifficultRoute {
    from: string;
    to: string;
    difficulty: RouteDifficulty;
    hazards: string[];
    requiredSupplies?: string[];
    seasonalModifier?: Record<string, number>; // Season -> difficulty multiplier
}

// Difficult overland routes
export const DIFFICULT_ROUTES: DifficultRoute[] = [
    // === DEADLY PASSAGES ===
    {
        from: 'Panama Isthmus',
        to: 'Darien Swamp',
        difficulty: RouteDifficulty.DEADLY,
        hazards: ['Disease', 'Dense jungle', 'Dangerous wildlife', 'Flash floods'],
        requiredSupplies: ['Medicine', 'Machete', 'Guide'],
        seasonalModifier: { 'RAINY': 1.5, 'DRY': 0.8 }
    },
    {
        from: 'Darien Swamp',
        to: 'Quito Plateau',
        difficulty: RouteDifficulty.EXTREME,
        hazards: ['Swamps', 'Disease', 'No roads', 'Hostile terrain'],
        requiredSupplies: ['Medicine', 'Local guide']
    },
    
    // === SAHARA CROSSINGS ===
    {
        from: 'Atlas Mountains',
        to: 'Central Sahara',
        difficulty: RouteDifficulty.EXTREME,
        hazards: ['Extreme heat', 'No water', 'Sandstorms', 'Getting lost'],
        requiredSupplies: ['Water (abundant)', 'Camel', 'Guide'],
        seasonalModifier: { 'SUMMER': 1.5, 'WINTER': 0.7 }
    },
    {
        from: 'Central Sahara',
        to: 'Hoggar Mountains',
        difficulty: RouteDifficulty.HARD,
        hazards: ['Desert', 'Rocky terrain', 'No water'],
        requiredSupplies: ['Water', 'Desert gear']
    },
    {
        from: 'Hoggar Mountains',
        to: 'Timbuktu Basin',
        difficulty: RouteDifficulty.HARD,
        hazards: ['Desert descent', 'Bandits', 'Heat'],
        requiredSupplies: ['Water', 'Armed escort']
    },
    {
        from: 'Tibesti Mountains',
        to: 'Lake Chad',
        difficulty: RouteDifficulty.MODERATE,
        hazards: ['Desert', 'Rocky passes'],
        requiredSupplies: ['Water']
    },
    
    // === HIMALAYAN PASSAGES ===
    {
        from: 'Kashmir Valley',
        to: 'Tibetan Plateau',
        difficulty: RouteDifficulty.EXTREME,
        hazards: ['High altitude', 'Snow', 'Avalanches', 'Narrow passes'],
        requiredSupplies: ['Warm clothing', 'Oxygen', 'Mountain guide'],
        seasonalModifier: { 'WINTER': 2.0, 'SUMMER': 0.6 }
    },
    {
        from: 'Nepal Valley',
        to: 'Lhasa Basin',
        difficulty: RouteDifficulty.EXTREME,
        hazards: ['Extreme altitude', 'Freezing', 'Avalanches'],
        requiredSupplies: ['Mountain gear', 'Yaks', 'Sherpa guide']
    },
    
    // === ARCTIC ROUTES ===
    {
        from: 'Arctic Siberia',
        to: 'Central Siberia',
        difficulty: RouteDifficulty.HARD,
        hazards: ['Extreme cold', 'Blizzards', 'Polar night'],
        requiredSupplies: ['Arctic gear', 'Sled dogs'],
        seasonalModifier: { 'WINTER': 1.8, 'SUMMER': 0.5 }
    },
    {
        from: 'Bering Strait',
        to: 'Arctic Siberia',
        difficulty: RouteDifficulty.EXTREME,
        hazards: ['Sea ice', 'Extreme cold', 'Storms'],
        requiredSupplies: ['Ice breaker ship', 'Arctic survival gear'],
        seasonalModifier: { 'WINTER': 0.7, 'SUMMER': 1.0 } // Easier when frozen
    },
    
    // === JUNGLE ROUTES ===
    {
        from: 'Amazon Headwaters',
        to: 'Manaus Region',
        difficulty: RouteDifficulty.MODERATE,
        hazards: ['Dense jungle', 'River rapids', 'Disease'],
        requiredSupplies: ['Boat', 'Medicine', 'Machete']
    },
    {
        from: 'Congo Basin Interior',
        to: 'Equatorial Rainforest',
        difficulty: RouteDifficulty.HARD,
        hazards: ['No roads', 'Dense forest', 'Disease', 'Wildlife'],
        requiredSupplies: ['Medicine', 'Guide', 'Machete']
    },
    
    // === DESERT CROSSINGS ===
    {
        from: 'Empty Quarter',
        to: 'Nejd Highlands',
        difficulty: RouteDifficulty.EXTREME,
        hazards: ['Extreme heat', 'No water', 'Vast emptiness'],
        requiredSupplies: ['Water (abundant)', 'Camel caravan']
    },
    {
        from: 'Gobi Desert',
        to: 'Beijing Basin',
        difficulty: RouteDifficulty.MODERATE,
        hazards: ['Desert', 'Temperature extremes'],
        requiredSupplies: ['Water', 'Desert gear']
    },
    {
        from: 'Alice Springs Basin',
        to: 'Sydney Basin',
        difficulty: RouteDifficulty.HARD,
        hazards: ['Desert', 'No water', 'Extreme heat'],
        requiredSupplies: ['Water', 'Vehicle or camel']
    },
    
    // === MOUNTAIN PASSES ===
    {
        from: 'Hindu Kush',
        to: 'Ferghana Valley',
        difficulty: RouteDifficulty.HARD,
        hazards: ['High altitude', 'Narrow passes', 'Snow'],
        requiredSupplies: ['Mountain gear', 'Pack animals']
    },
    {
        from: 'Pamir Mountains',
        to: 'Tarim Basin',
        difficulty: RouteDifficulty.EXTREME,
        hazards: ['Extreme altitude', 'No oxygen', 'Freezing'],
        requiredSupplies: ['Oxygen', 'Yaks', 'Mountain guide']
    },
    {
        from: 'Andes Altiplano',
        to: 'Atacama Desert',
        difficulty: RouteDifficulty.HARD,
        hazards: ['High altitude', 'Desert', 'No water'],
        requiredSupplies: ['Water', 'Altitude medicine']
    }
];

// Enhanced liminal sequences for difficult water crossings
export interface EnhancedLiminalSequence {
    destination: string;
    sequence: MapArchetype[];
    difficulty: RouteDifficulty;
    hazards: string[];
    historicalNotes?: string;
}

export const ENHANCED_LIMINAL_SEQUENCES: Record<string, EnhancedLiminalSequence> = {
    // Drake Passage - most dangerous water crossing
    "LIMINAL_DRAKE_PASSAGE": {
        destination: "Magellanic Steppe",
        sequence: [
            MapArchetype.SHOALS,
            MapArchetype.OPEN_OCEAN,
            MapArchetype.OPEN_OCEAN,
            MapArchetype.OPEN_OCEAN,
            MapArchetype.OPEN_OCEAN,
            MapArchetype.OPEN_OCEAN
        ],
        difficulty: RouteDifficulty.DEADLY,
        hazards: ['Giant waves', 'Icebergs', 'Storms', 'Cold'],
        historicalNotes: 'The Drake Passage claimed countless ships before modern navigation'
    },
    
    // North Atlantic in winter
    "LIMINAL_NORTH_ATLANTIC_WINTER": {
        destination: "London",
        sequence: [
            MapArchetype.OPEN_OCEAN,
            MapArchetype.OPEN_OCEAN,
            MapArchetype.OPEN_OCEAN,
            MapArchetype.OPEN_OCEAN,
            MapArchetype.SHOALS
        ],
        difficulty: RouteDifficulty.HARD,
        hazards: ['Storms', 'Icebergs', 'Fog'],
        historicalNotes: 'The Titanic disaster occurred on this route'
    },
    
    // Monsoon season Indian Ocean
    "LIMINAL_INDIAN_MONSOON": {
        destination: "Bengal Delta",
        sequence: [
            MapArchetype.OPEN_OCEAN,
            MapArchetype.OPEN_OCEAN,
            MapArchetype.OPEN_OCEAN
        ],
        difficulty: RouteDifficulty.EXTREME,
        hazards: ['Cyclones', 'Monsoon storms', 'Pirates'],
        historicalNotes: 'Seasonal monsoons dictated all Indian Ocean trade'
    },
    
    // Pacific typhoon belt
    "LIMINAL_PACIFIC_TYPHOON": {
        destination: "Manila Bay",
        sequence: [
            MapArchetype.OPEN_OCEAN,
            MapArchetype.OPEN_OCEAN,
            MapArchetype.OPEN_OCEAN,
            MapArchetype.OPEN_OCEAN
        ],
        difficulty: RouteDifficulty.HARD,
        hazards: ['Typhoons', 'Giant waves'],
        historicalNotes: 'The Manila galleon trade risked this dangerous route'
    }
};

// Function to calculate actual travel time based on difficulty
export function calculateTravelTime(
    baseDays: number,
    difficulty: RouteDifficulty,
    season?: string,
    hasRequiredSupplies?: boolean
): number {
    let multiplier = 1;
    
    switch (difficulty) {
        case RouteDifficulty.EASY:
            multiplier = 1;
            break;
        case RouteDifficulty.MODERATE:
            multiplier = 1.5;
            break;
        case RouteDifficulty.HARD:
            multiplier = 2;
            break;
        case RouteDifficulty.EXTREME:
            multiplier = 3;
            break;
        case RouteDifficulty.DEADLY:
            multiplier = 4;
            break;
    }
    
    // Apply supply penalty
    if (!hasRequiredSupplies && difficulty !== RouteDifficulty.EASY) {
        multiplier *= 1.5; // 50% slower without proper supplies
    }
    
    return Math.ceil(baseDays * multiplier);
}

// Function to calculate mishap chance
export function calculateMishapChance(
    difficulty: RouteDifficulty,
    hasRequiredSupplies: boolean,
    playerSkill: number // 0-100
): number {
    let baseChance = 0;
    
    switch (difficulty) {
        case RouteDifficulty.EASY:
            baseChance = 0.05;
            break;
        case RouteDifficulty.MODERATE:
            baseChance = 0.15;
            break;
        case RouteDifficulty.HARD:
            baseChance = 0.30;
            break;
        case RouteDifficulty.EXTREME:
            baseChance = 0.50;
            break;
        case RouteDifficulty.DEADLY:
            baseChance = 0.70;
            break;
    }
    
    // Modify by supplies
    if (!hasRequiredSupplies) {
        baseChance *= 1.5;
    }
    
    // Modify by skill (0-100)
    const skillModifier = 1 - (playerSkill / 200); // At 100 skill, reduces chance by 50%
    
    return Math.min(0.95, baseChance * skillModifier); // Cap at 95%
}
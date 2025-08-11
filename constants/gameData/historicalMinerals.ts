/**
 * constants/gameData/historicalMinerals.ts - Historical and cultural mineral availability
 */
import { HistoricalEra } from '../../types';

export interface HistoricalMineralData {
    metalId: string;
    minEra: HistoricalEra;
    culturalRestrictions?: string[]; // Only these regions can mine it in early eras
    abundance: number; // 0.1 = rare, 0.5 = common, 1.0 = abundant
}

// Define which minerals are available in which eras and regions
export const HISTORICAL_MINERALS: Record<string, HistoricalMineralData[]> = {
    // Australia - progressive mining history
    "Sydney Basin": [
        { metalId: 'OCHRE', minEra: HistoricalEra.ANTIQUITY, abundance: 0.8 },
        { metalId: 'CLAY', minEra: HistoricalEra.ANTIQUITY, abundance: 0.6 },
        { metalId: 'COAL', minEra: HistoricalEra.INDUSTRIAL_ERA, abundance: 1.0 },
        { metalId: 'IRON', minEra: HistoricalEra.INDUSTRIAL_ERA, abundance: 0.5 }
    ],
    "Goldfields Region": [
        { metalId: 'OCHRE', minEra: HistoricalEra.ANTIQUITY, abundance: 0.7 },
        { metalId: 'GOLD', minEra: HistoricalEra.INDUSTRIAL_ERA, abundance: 0.9 },
        { metalId: 'COPPER', minEra: HistoricalEra.MODERN_ERA, abundance: 0.4 }
    ],
    "Pilbara": [
        { metalId: 'OCHRE', minEra: HistoricalEra.ANTIQUITY, abundance: 0.9 },
        { metalId: 'IRON', minEra: HistoricalEra.MODERN_ERA, abundance: 1.0 },
        { metalId: 'GOLD', minEra: HistoricalEra.MODERN_ERA, abundance: 0.3 }
    ],
    
    // Europe - classical mining
    "British Isles": [
        { metalId: 'TIN', minEra: HistoricalEra.ANTIQUITY, abundance: 0.8 },
        { metalId: 'COPPER', minEra: HistoricalEra.ANTIQUITY, abundance: 0.6 },
        { metalId: 'COAL', minEra: HistoricalEra.MEDIEVAL, abundance: 0.9 },
        { metalId: 'IRON', minEra: HistoricalEra.ANTIQUITY, abundance: 0.7 }
    ],
    "Germanic Lands": [
        { metalId: 'IRON', minEra: HistoricalEra.ANTIQUITY, abundance: 0.8 },
        { metalId: 'SILVER', minEra: HistoricalEra.MEDIEVAL, abundance: 0.6 },
        { metalId: 'COPPER', minEra: HistoricalEra.ANTIQUITY, abundance: 0.5 },
        { metalId: 'COAL', minEra: HistoricalEra.RENAISSANCE_EARLY_MODERN, abundance: 0.8 }
    ],
    "Iberian Peninsula": [
        { metalId: 'SILVER', minEra: HistoricalEra.ANTIQUITY, abundance: 0.8 },
        { metalId: 'COPPER', minEra: HistoricalEra.ANTIQUITY, abundance: 0.7 },
        { metalId: 'IRON', minEra: HistoricalEra.ANTIQUITY, abundance: 0.6 },
        { metalId: 'GOLD', minEra: HistoricalEra.ANTIQUITY, abundance: 0.3 }
    ],
    
    // Americas
    "Valley of Mexico": [
        { metalId: 'SILVER', minEra: HistoricalEra.ANTIQUITY, abundance: 0.7 },
        { metalId: 'GOLD', minEra: HistoricalEra.ANTIQUITY, abundance: 0.5 },
        { metalId: 'COPPER', minEra: HistoricalEra.ANTIQUITY, abundance: 0.4 }
    ],
    "Altiplano": [
        { metalId: 'SILVER', minEra: HistoricalEra.ANTIQUITY, abundance: 1.0 },
        { metalId: 'TIN', minEra: HistoricalEra.ANTIQUITY, abundance: 0.6 },
        { metalId: 'GOLD', minEra: HistoricalEra.ANTIQUITY, abundance: 0.4 }
    ],
    "Front Range": [
        { metalId: 'GOLD', minEra: HistoricalEra.INDUSTRIAL_ERA, abundance: 0.8 },
        { metalId: 'SILVER', minEra: HistoricalEra.INDUSTRIAL_ERA, abundance: 0.7 },
        { metalId: 'COPPER', minEra: HistoricalEra.INDUSTRIAL_ERA, abundance: 0.5 }
    ],
    
    // Africa
    "Zimbabwe Plateau": [
        { metalId: 'GOLD', minEra: HistoricalEra.MEDIEVAL, abundance: 0.9 },
        { metalId: 'IRON', minEra: HistoricalEra.ANTIQUITY, abundance: 0.7 },
        { metalId: 'COPPER', minEra: HistoricalEra.ANTIQUITY, abundance: 0.5 }
    ],
    "Nubian Desert": [
        { metalId: 'GOLD', minEra: HistoricalEra.ANTIQUITY, abundance: 0.8 },
        { metalId: 'COPPER', minEra: HistoricalEra.ANTIQUITY, abundance: 0.4 }
    ],
    "Swahili Coast": [
        { metalId: 'IRON', minEra: HistoricalEra.MEDIEVAL, abundance: 0.6 },
        { metalId: 'GOLD', minEra: HistoricalEra.MEDIEVAL, abundance: 0.3 }
    ],
    
    // Asia
    "Yellow River Valley": [
        { metalId: 'COPPER', minEra: HistoricalEra.ANTIQUITY, abundance: 0.7 },
        { metalId: 'TIN', minEra: HistoricalEra.ANTIQUITY, abundance: 0.6 },
        { metalId: 'IRON', minEra: HistoricalEra.ANTIQUITY, abundance: 0.8 },
        { metalId: 'COAL', minEra: HistoricalEra.MEDIEVAL, abundance: 0.9 }
    ],
    "Japanese Islands": [
        { metalId: 'COPPER', minEra: HistoricalEra.ANTIQUITY, abundance: 0.6 },
        { metalId: 'SILVER', minEra: HistoricalEra.MEDIEVAL, abundance: 0.8 },
        { metalId: 'GOLD', minEra: HistoricalEra.MEDIEVAL, abundance: 0.4 }
    ],
    
    // Middle East
    "Hejaz Mountains": [
        { metalId: 'GOLD', minEra: HistoricalEra.ANTIQUITY, abundance: 0.6 },
        { metalId: 'SILVER', minEra: HistoricalEra.ANTIQUITY, abundance: 0.5 },
        { metalId: 'COPPER', minEra: HistoricalEra.ANTIQUITY, abundance: 0.7 }
    ],
    "Anatolia": [
        { metalId: 'SILVER', minEra: HistoricalEra.ANTIQUITY, abundance: 0.7 },
        { metalId: 'COPPER', minEra: HistoricalEra.ANTIQUITY, abundance: 0.8 },
        { metalId: 'IRON', minEra: HistoricalEra.ANTIQUITY, abundance: 0.9 },
        { metalId: 'TIN', minEra: HistoricalEra.ANTIQUITY, abundance: 0.4 }
    ],
    
    // Universal minerals (found almost everywhere in small quantities)
    "DEFAULT": [
        { metalId: 'STONE', minEra: HistoricalEra.ANTIQUITY, abundance: 0.9 },
        { metalId: 'CLAY', minEra: HistoricalEra.ANTIQUITY, abundance: 0.5 },
        { metalId: 'FLINT', minEra: HistoricalEra.ANTIQUITY, abundance: 0.3 },
        { metalId: 'SALT', minEra: HistoricalEra.ANTIQUITY, abundance: 0.2 }
    ]
};

// Get available minerals for a region in a specific era
export function getAvailableMinerals(region: string, era: HistoricalEra): HistoricalMineralData[] {
    const regionalMinerals = HISTORICAL_MINERALS[region] || [];
    const defaultMinerals = HISTORICAL_MINERALS["DEFAULT"] || [];
    
    // Combine regional and default minerals
    const allMinerals = [...regionalMinerals, ...defaultMinerals];
    
    // Filter by era
    return allMinerals.filter(mineral => {
        const eraValue = Object.values(HistoricalEra).indexOf(era);
        const minEraValue = Object.values(HistoricalEra).indexOf(mineral.minEra);
        return eraValue >= minEraValue;
    });
}

// Add rare earth minerals for future era
export const FUTURE_MINERALS: HistoricalMineralData[] = [
    { metalId: 'LITHIUM', minEra: HistoricalEra.FUTURE_ERA, abundance: 0.3 },
    { metalId: 'RARE_EARTH', minEra: HistoricalEra.FUTURE_ERA, abundance: 0.2 },
    { metalId: 'URANIUM', minEra: HistoricalEra.MODERN_ERA, abundance: 0.1 }
];
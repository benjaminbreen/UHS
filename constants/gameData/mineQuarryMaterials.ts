/**
 * constants/gameData/mineQuarryMaterials.ts - Era-specific materials for mines and quarries
 */
import { HistoricalEra } from '../../types';

export interface MineMaterial {
  id: string;
  name: string;
  era: HistoricalEra[];
  rarity: number; // 0-1, lower is rarer
}

export interface QuarryMaterial {
  id: string;
  name: string;
  era: HistoricalEra[];
  rarity: number; // 0-1, lower is rarer
}

export const MINE_MATERIALS: MineMaterial[] = [
  // Prehistoric
  { id: 'flint', name: 'Flint', era: [HistoricalEra.PREHISTORY], rarity: 0.8 },
  { id: 'ochre', name: 'Red Ochre', era: [HistoricalEra.PREHISTORY], rarity: 0.6 },
  
  // Antiquity
  { id: 'copper', name: 'Copper', era: [HistoricalEra.ANTIQUITY, HistoricalEra.MEDIEVAL], rarity: 0.7 },
  { id: 'tin', name: 'Tin', era: [HistoricalEra.ANTIQUITY, HistoricalEra.MEDIEVAL], rarity: 0.4 },
  { id: 'lead', name: 'Lead', era: [HistoricalEra.ANTIQUITY, HistoricalEra.MEDIEVAL], rarity: 0.5 },
  { id: 'silver', name: 'Silver', era: [HistoricalEra.ANTIQUITY, HistoricalEra.MEDIEVAL, HistoricalEra.RENAISSANCE_EARLY_MODERN], rarity: 0.3 },
  { id: 'gold', name: 'Gold', era: [HistoricalEra.ANTIQUITY, HistoricalEra.MEDIEVAL, HistoricalEra.RENAISSANCE_EARLY_MODERN], rarity: 0.1 },
  
  // Medieval
  { id: 'iron', name: 'Iron', era: [HistoricalEra.MEDIEVAL, HistoricalEra.RENAISSANCE_EARLY_MODERN, HistoricalEra.INDUSTRIAL_ERA], rarity: 0.8 },
  
  // Renaissance/Early Modern
  { id: 'mercury', name: 'Mercury', era: [HistoricalEra.RENAISSANCE_EARLY_MODERN], rarity: 0.2 },
  { id: 'saltpeter', name: 'Saltpeter', era: [HistoricalEra.RENAISSANCE_EARLY_MODERN, HistoricalEra.INDUSTRIAL_ERA], rarity: 0.5 },
  
  // Industrial
  { id: 'coal', name: 'Coal', era: [HistoricalEra.INDUSTRIAL_ERA, HistoricalEra.MODERN_ERA], rarity: 0.9 },
  { id: 'zinc', name: 'Zinc', era: [HistoricalEra.INDUSTRIAL_ERA, HistoricalEra.MODERN_ERA], rarity: 0.6 },
  { id: 'nickel', name: 'Nickel', era: [HistoricalEra.INDUSTRIAL_ERA, HistoricalEra.MODERN_ERA], rarity: 0.5 },
  
  // Modern (1900-2000) - Coal still dominates, plus copper for electricity
  { id: 'coal_modern', name: 'Coal', era: [HistoricalEra.MODERN_ERA], rarity: 0.8 }, // Still most common
  { id: 'copper_modern', name: 'Copper', era: [HistoricalEra.MODERN_ERA], rarity: 0.7 }, // For electrical wiring
  { id: 'bauxite', name: 'Bauxite (Aluminum)', era: [HistoricalEra.MODERN_ERA, HistoricalEra.FUTURE_ERA], rarity: 0.5 },
  { id: 'uranium', name: 'Uranium', era: [HistoricalEra.MODERN_ERA, HistoricalEra.FUTURE_ERA], rarity: 0.05 }, // Very rare, post-1945
  { id: 'lithium', name: 'Lithium', era: [HistoricalEra.MODERN_ERA, HistoricalEra.FUTURE_ERA], rarity: 0.1 }, // Late 20th century
  { id: 'rare_earth', name: 'Rare Earth Elements', era: [HistoricalEra.MODERN_ERA, HistoricalEra.FUTURE_ERA], rarity: 0.1 },
  
  // Future
  { id: 'helium3', name: 'Helium-3', era: [HistoricalEra.FUTURE_ERA], rarity: 0.05 },
  { id: 'graphene', name: 'Graphene Deposits', era: [HistoricalEra.FUTURE_ERA], rarity: 0.15 },
  
  // Regional/Special materials (available across multiple eras)
  { id: 'salt', name: 'Salt', era: [HistoricalEra.PREHISTORY, HistoricalEra.ANTIQUITY, HistoricalEra.MEDIEVAL, HistoricalEra.RENAISSANCE_EARLY_MODERN, HistoricalEra.INDUSTRIAL_ERA, HistoricalEra.MODERN_ERA], rarity: 0.6 },
  { id: 'jade', name: 'Jade', era: [HistoricalEra.ANTIQUITY, HistoricalEra.MEDIEVAL, HistoricalEra.RENAISSANCE_EARLY_MODERN], rarity: 0.15 }, // Primarily Asia
  { id: 'diamonds', name: 'Diamonds', era: [HistoricalEra.MEDIEVAL, HistoricalEra.RENAISSANCE_EARLY_MODERN, HistoricalEra.INDUSTRIAL_ERA, HistoricalEra.MODERN_ERA], rarity: 0.03 }, // Very rare
  { id: 'opals', name: 'Opals', era: [HistoricalEra.INDUSTRIAL_ERA, HistoricalEra.MODERN_ERA], rarity: 0.08 }, // Primarily Australia
  { id: 'emeralds', name: 'Emeralds', era: [HistoricalEra.ANTIQUITY, HistoricalEra.MEDIEVAL, HistoricalEra.RENAISSANCE_EARLY_MODERN, HistoricalEra.INDUSTRIAL_ERA, HistoricalEra.MODERN_ERA], rarity: 0.05 }, // South America
  { id: 'rubies', name: 'Rubies', era: [HistoricalEra.ANTIQUITY, HistoricalEra.MEDIEVAL, HistoricalEra.RENAISSANCE_EARLY_MODERN, HistoricalEra.INDUSTRIAL_ERA, HistoricalEra.MODERN_ERA], rarity: 0.05 }, // Asia
  { id: 'sapphires', name: 'Sapphires', era: [HistoricalEra.ANTIQUITY, HistoricalEra.MEDIEVAL, HistoricalEra.RENAISSANCE_EARLY_MODERN, HistoricalEra.INDUSTRIAL_ERA, HistoricalEra.MODERN_ERA], rarity: 0.05 }, // Asia/Africa
];

export const QUARRY_MATERIALS: QuarryMaterial[] = [
  // Prehistoric
  { id: 'obsidian', name: 'Obsidian', era: [HistoricalEra.PREHISTORY], rarity: 0.3 },
  { id: 'flint_nodules', name: 'Flint Nodules', era: [HistoricalEra.PREHISTORY], rarity: 0.7 },
  { id: 'red_ochre', name: 'Red Ochre', era: [HistoricalEra.PREHISTORY], rarity: 0.5 },
  
  // Antiquity
  { id: 'marble', name: 'Marble', era: [HistoricalEra.ANTIQUITY, HistoricalEra.MEDIEVAL, HistoricalEra.RENAISSANCE_EARLY_MODERN], rarity: 0.4 },
  { id: 'limestone', name: 'Limestone', era: [HistoricalEra.ANTIQUITY, HistoricalEra.MEDIEVAL, HistoricalEra.RENAISSANCE_EARLY_MODERN], rarity: 0.8 },
  { id: 'lapis_lazuli', name: 'Lapis Lazuli', era: [HistoricalEra.ANTIQUITY], rarity: 0.1 },
  { id: 'porphyry', name: 'Porphyry', era: [HistoricalEra.ANTIQUITY], rarity: 0.2 },
  
  // Medieval
  { id: 'sandstone', name: 'Sandstone', era: [HistoricalEra.MEDIEVAL, HistoricalEra.RENAISSANCE_EARLY_MODERN], rarity: 0.7 },
  { id: 'granite', name: 'Granite', era: [HistoricalEra.MEDIEVAL, HistoricalEra.RENAISSANCE_EARLY_MODERN, HistoricalEra.INDUSTRIAL_ERA], rarity: 0.6 },
  { id: 'slate', name: 'Slate', era: [HistoricalEra.MEDIEVAL, HistoricalEra.RENAISSANCE_EARLY_MODERN], rarity: 0.5 },
  
  // Renaissance/Early Modern
  { id: 'alabaster', name: 'Alabaster', era: [HistoricalEra.RENAISSANCE_EARLY_MODERN], rarity: 0.3 },
  { id: 'travertine', name: 'Travertine', era: [HistoricalEra.RENAISSANCE_EARLY_MODERN], rarity: 0.4 },
  
  // Industrial
  { id: 'clay', name: 'Clay (for bricks)', era: [HistoricalEra.INDUSTRIAL_ERA, HistoricalEra.MODERN_ERA], rarity: 0.9 },
  { id: 'gravel', name: 'Gravel', era: [HistoricalEra.INDUSTRIAL_ERA, HistoricalEra.MODERN_ERA], rarity: 0.9 },
  { id: 'basalt', name: 'Basalt', era: [HistoricalEra.INDUSTRIAL_ERA, HistoricalEra.MODERN_ERA], rarity: 0.5 },
  
  // Modern
  { id: 'aggregate', name: 'Construction Aggregate', era: [HistoricalEra.MODERN_ERA, HistoricalEra.FUTURE_ERA], rarity: 0.95 },
  { id: 'silica_sand', name: 'Silica Sand', era: [HistoricalEra.MODERN_ERA, HistoricalEra.FUTURE_ERA], rarity: 0.7 },
  { id: 'dimension_stone', name: 'Dimension Stone', era: [HistoricalEra.MODERN_ERA], rarity: 0.5 },
  
  // Future
  { id: 'nano_crystals', name: 'Nano-Crystal Formations', era: [HistoricalEra.FUTURE_ERA], rarity: 0.1 },
  { id: 'metamaterial_ore', name: 'Metamaterial Ore', era: [HistoricalEra.FUTURE_ERA], rarity: 0.05 },
];

// Get materials available in a specific era
export function getMaterialsForEra(era: HistoricalEra, type: 'mine' | 'quarry'): (MineMaterial | QuarryMaterial)[] {
  const materials = type === 'mine' ? MINE_MATERIALS : QUARRY_MATERIALS;
  return materials.filter(m => m.era.includes(era));
}

// Get a random material for the era (weighted by rarity)
export function getRandomMaterial(era: HistoricalEra, type: 'mine' | 'quarry'): MineMaterial | QuarryMaterial | null {
  const available = getMaterialsForEra(era, type);
  if (available.length === 0) return null;
  
  // Weight by rarity
  const totalWeight = available.reduce((sum, m) => sum + m.rarity, 0);
  let random = Math.random() * totalWeight;
  
  for (const material of available) {
    random -= material.rarity;
    if (random <= 0) return material;
  }
  
  return available[available.length - 1];
}

// Era-based generation frequencies (0-1, higher = more common)
export const MINE_FREQUENCY_BY_ERA: Record<HistoricalEra, number> = {
  [HistoricalEra.PREHISTORY]: 0.05,
  [HistoricalEra.ANTIQUITY]: 0.1,
  [HistoricalEra.MEDIEVAL]: 0.15,
  [HistoricalEra.RENAISSANCE_EARLY_MODERN]: 0.3, // Rising frequency
  [HistoricalEra.INDUSTRIAL_ERA]: 0.6, // High frequency
  [HistoricalEra.MODERN_ERA]: 0.8, // Most common
  [HistoricalEra.FUTURE_ERA]: 0.4, // Declining
};

export const QUARRY_FREQUENCY_BY_ERA: Record<HistoricalEra, number> = {
  [HistoricalEra.PREHISTORY]: 0.7, // Most common
  [HistoricalEra.ANTIQUITY]: 0.8, // Very common
  [HistoricalEra.MEDIEVAL]: 0.6, // Common
  [HistoricalEra.RENAISSANCE_EARLY_MODERN]: 0.4,
  [HistoricalEra.INDUSTRIAL_ERA]: 0.3,
  [HistoricalEra.MODERN_ERA]: 0.2,
  [HistoricalEra.FUTURE_ERA]: 0.1, // Rare
};
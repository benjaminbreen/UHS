/**
 * constants/characterData/accessories.ts
 * Cultural accessory definitions for character generation
 */

import { CulturalZone } from './culturalZones';
import { HistoricalEra } from '../../types/ambiance';

export interface AccessoryDefinition {
  baseId: string;
  culturalZones: CulturalZone[];
  eras?: HistoricalEra[];
  wealthLevels: ('poor' | 'modest' | 'comfortable' | 'wealthy' | 'noble')[];
  gender?: 'male' | 'female' | 'any';
  professions?: string[];
  weight: number; // Selection weight/probability
}

// Accessory definitions by category
export const CULTURAL_ACCESSORIES: AccessoryDefinition[] = [
  // === EARRINGS ===
  {
    baseId: 'SHELL_EARRINGS',
    culturalZones: ['OCEANIA', 'SUB_SAHARAN_AFRICAN', 'NORTH_AMERICAN_PRE_COLUMBIAN', 'SOUTH_AMERICAN'],
    wealthLevels: ['poor', 'modest'],
    gender: 'any',
    weight: 3
  },
  {
    baseId: 'BONE_EARRINGS',
    culturalZones: ['NORTH_AMERICAN_PRE_COLUMBIAN', 'SUB_SAHARAN_AFRICAN', 'OCEANIA'],
    wealthLevels: ['poor', 'modest'],
    gender: 'any',
    weight: 3
  },
  {
    baseId: 'GOLD_EARRINGS',
    culturalZones: ['EUROPEAN', 'MENA', 'SOUTH_ASIAN', 'EAST_ASIAN', 'SOUTH_AMERICAN'],
    wealthLevels: ['comfortable', 'wealthy', 'noble'],
    gender: 'any',
    weight: 4
  },
  {
    baseId: 'PEARL_EARRINGS',
    culturalZones: ['EUROPEAN', 'EAST_ASIAN', 'MENA'],
    eras: ['medieval', 'renaissance', 'victorian'],
    wealthLevels: ['wealthy', 'noble'],
    gender: 'female',
    weight: 3
  },
  {
    baseId: 'JHUMKAS',
    culturalZones: ['SOUTH_ASIAN'],
    wealthLevels: ['modest', 'comfortable', 'wealthy', 'noble'],
    gender: 'female',
    weight: 5
  },
  {
    baseId: 'PHOENIX_EARRINGS',
    culturalZones: ['EAST_ASIAN'],
    wealthLevels: ['noble'],
    gender: 'female',
    professions: ['Noble', 'Courtier', 'Scholar'],
    weight: 2
  },
  {
    baseId: 'HOOP_EARRINGS',
    culturalZones: ['EUROPEAN', 'MENA', 'SUB_SAHARAN_AFRICAN', 'SOUTH_AMERICAN'],
    wealthLevels: ['modest', 'comfortable'],
    gender: 'any',
    weight: 4
  },
  {
    baseId: 'TURQUOISE_STUDS',
    culturalZones: ['NORTH_AMERICAN_PRE_COLUMBIAN', 'NORTH_AMERICAN_COLONIAL'],
    wealthLevels: ['comfortable', 'wealthy'],
    gender: 'any',
    weight: 3
  },
  
  // === NOSE ORNAMENTS ===
  {
    baseId: 'NOSE_RING',
    culturalZones: ['SOUTH_ASIAN', 'MENA', 'SUB_SAHARAN_AFRICAN'],
    wealthLevels: ['poor', 'modest', 'comfortable'],
    gender: 'female',
    weight: 4
  },
  {
    baseId: 'NOSE_PIN',
    culturalZones: ['SOUTH_ASIAN'],
    wealthLevels: ['modest', 'comfortable', 'wealthy'],
    gender: 'female',
    weight: 4
  },
  {
    baseId: 'NOSE_STUD',
    culturalZones: ['SOUTH_ASIAN'],
    wealthLevels: ['wealthy', 'noble'],
    gender: 'female',
    weight: 3
  },
  {
    baseId: 'SEPTUM_RING',
    culturalZones: ['OCEANIA', 'SOUTH_AMERICAN', 'SUB_SAHARAN_AFRICAN'],
    wealthLevels: ['poor', 'modest', 'comfortable'],
    gender: 'any',
    professions: ['Warrior', 'Hunter', 'Shaman'],
    weight: 3
  },
  
  // === FOREHEAD ORNAMENTS ===
  {
    baseId: 'BINDI',
    culturalZones: ['SOUTH_ASIAN'],
    wealthLevels: ['poor', 'modest', 'comfortable', 'wealthy', 'noble'],
    gender: 'female',
    weight: 5
  },
  {
    baseId: 'TILAK',
    culturalZones: ['SOUTH_ASIAN'],
    wealthLevels: ['poor', 'modest', 'comfortable', 'wealthy', 'noble'],
    gender: 'male',
    professions: ['Priest', 'Scholar', 'Merchant'],
    weight: 4
  },
  {
    baseId: 'MAANG_TIKKA',
    culturalZones: ['SOUTH_ASIAN'],
    wealthLevels: ['comfortable', 'wealthy', 'noble'],
    gender: 'female',
    weight: 3
  },
  
  // === HAIR ORNAMENTS ===
  {
    baseId: 'PEARL_HAIRPIN',
    culturalZones: ['EUROPEAN', 'EAST_ASIAN'],
    eras: ['medieval', 'renaissance', 'victorian'],
    wealthLevels: ['wealthy', 'noble'],
    gender: 'female',
    weight: 3
  },
  {
    baseId: 'JADE_HAIRPIN',
    culturalZones: ['EAST_ASIAN'],
    wealthLevels: ['comfortable', 'wealthy', 'noble'],
    gender: 'female',
    weight: 4
  },
  {
    baseId: 'FEATHER_ORNAMENT',
    culturalZones: ['NORTH_AMERICAN_PRE_COLUMBIAN', 'SOUTH_AMERICAN', 'OCEANIA'],
    wealthLevels: ['poor', 'modest', 'comfortable'],
    gender: 'any',
    professions: ['Warrior', 'Hunter', 'Shaman', 'Chief'],
    weight: 4
  },
  
  // === CULTURAL SPECIFIC ===
  {
    baseId: 'COWRIE_SHELLS',
    culturalZones: ['SUB_SAHARAN_AFRICAN'],
    wealthLevels: ['modest', 'comfortable'],
    gender: 'any',
    weight: 4
  },
  {
    baseId: 'OBSIDIAN_PLUGS',
    culturalZones: ['SOUTH_AMERICAN', 'NORTH_AMERICAN_PRE_COLUMBIAN'],
    wealthLevels: ['comfortable', 'wealthy', 'noble'],
    gender: 'any',
    professions: ['Priest', 'Noble', 'Warrior'],
    weight: 3
  },
  {
    baseId: 'EAR_PLUGS',
    culturalZones: ['SUB_SAHARAN_AFRICAN', 'OCEANIA', 'SOUTH_AMERICAN'],
    wealthLevels: ['poor', 'modest'],
    gender: 'any',
    weight: 3
  },
  {
    baseId: 'BERBER_FIBULA',
    culturalZones: ['MENA'],
    wealthLevels: ['modest', 'comfortable', 'wealthy'],
    gender: 'female',
    weight: 4
  },
  {
    baseId: 'KOHL_POT',
    culturalZones: ['MENA', 'SOUTH_ASIAN'],
    wealthLevels: ['poor', 'modest', 'comfortable', 'wealthy', 'noble'],
    gender: 'any',
    weight: 5
  },
  {
    baseId: 'FACE_PAINT_KIT',
    culturalZones: ['NORTH_AMERICAN_PRE_COLUMBIAN', 'SUB_SAHARAN_AFRICAN', 'OCEANIA', 'SOUTH_AMERICAN'],
    wealthLevels: ['poor', 'modest', 'comfortable'],
    gender: 'any',
    professions: ['Warrior', 'Shaman', 'Hunter'],
    weight: 3
  }
];

// Helper function to get appropriate accessories for a character
export function getAccessoriesForCharacter(
  culturalZone: CulturalZone,
  era: HistoricalEra | undefined,
  wealthLevel: string,
  gender: 'male' | 'female',
  profession?: string
): AccessoryDefinition[] {
  return CULTURAL_ACCESSORIES.filter(acc => {
    // Check cultural zone
    if (!acc.culturalZones.includes(culturalZone)) return false;
    
    // Check era if specified
    if (acc.eras && era && !acc.eras.includes(era)) return false;
    
    // Check wealth level
    if (!acc.wealthLevels.includes(wealthLevel as any)) return false;
    
    // Check gender
    if (acc.gender && acc.gender !== 'any' && acc.gender !== gender) return false;
    
    // Check profession if specified
    if (acc.professions && profession) {
      const profLower = profession.toLowerCase();
      const hasMatch = acc.professions.some(p => profLower.includes(p.toLowerCase()));
      if (!hasMatch) return false;
    }
    
    return true;
  });
}

// Select a random accessory based on weights
export function selectRandomAccessory(
  accessories: AccessoryDefinition[],
  seed: number = Math.random()
): string | null {
  if (accessories.length === 0) return null;
  
  const totalWeight = accessories.reduce((sum, acc) => sum + acc.weight, 0);
  let random = seed * totalWeight;
  
  for (const acc of accessories) {
    random -= acc.weight;
    if (random <= 0) {
      return acc.baseId;
    }
  }
  
  return accessories[accessories.length - 1].baseId;
}
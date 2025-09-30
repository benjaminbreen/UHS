/**
 * services/culturalAccessoryService.ts
 * Advanced cultural accessory generation with procedural naming and quality variations
 */

import { Item, CulturalZone, HistoricalEra } from '../types';
import { CULTURAL_ACCESSORIES, getAccessoriesForCharacter, selectRandomAccessory } from '../constants/characterData/accessories';
import { ITEM_DEFINITIONS, getItemDefinition } from '../constants/gameData/itemDefinitions';
import { createItemInstance } from '../utils/inventoryUtils';

// Quality tiers affect value and appearance
export type AccessoryQuality = 'crude' | 'simple' | 'fine' | 'masterwork' | 'legendary';

// Special accessory types that have unique mechanics
export type SpecialAccessoryType = 'tattoo' | 'scarification' | 'face_paint' | 'henna' | 'permanent_piercing';

interface AccessoryGenerationOptions {
  culture: CulturalZone;
  era?: HistoricalEra;
  wealth: 'poor' | 'modest' | 'comfortable' | 'wealthy' | 'noble';
  gender: 'male' | 'female';
  profession?: string;
  quality?: AccessoryQuality;
  forceType?: string; // Force a specific accessory type
}

// Cultural naming patterns for accessories
const CULTURAL_PREFIXES: Record<CulturalZone, Record<string, string[]>> = {
  EUROPEAN: {
    earrings: ['Victorian', 'Gothic', 'Celtic', 'Saxon', 'Norman', 'Frankish'],
    brooch: ['Heraldic', 'Royal', 'Guild', 'Pilgrim', 'Knights'],
    hairpin: ['Courtly', 'Noble', 'Maiden\'s', 'Lady\'s']
  },
  EAST_ASIAN: {
    earrings: ['Imperial', 'Ming', 'Song', 'Tang', 'Jade', 'Phoenix', 'Dragon'],
    hairpin: ['Lotus', 'Bamboo', 'Cherry Blossom', 'Crane', 'Cloud'],
    ornament: ['Celestial', 'Heavenly', 'Auspicious', 'Harmonious']
  },
  MENA: {
    earrings: ['Ottoman', 'Berber', 'Moorish', 'Bedouin', 'Mamluk'],
    nose_ring: ['Desert', 'Oasis', 'Tribal', 'Nomadic'],
    kohl: ['Egyptian', 'Persian', 'Arabian', 'Mesopotamian']
  },
  SOUTH_ASIAN: {
    earrings: ['Mughal', 'Rajput', 'Tamil', 'Bengali', 'Maratha'],
    nose_ring: ['Bridal', 'Temple', 'Harvest', 'Festival'],
    bindi: ['Sacred', 'Ceremonial', 'Wedding', 'Divine']
  },
  SUB_SAHARAN_AFRICAN: {
    earrings: ['Ancestral', 'Tribal', 'Ceremonial', 'Warrior', 'Elder'],
    ornament: ['Spirit', 'Lion', 'Leopard', 'Eagle', 'River'],
    shells: ['Coastal', 'Trade', 'Ritual', 'Chief\'s']
  },
  OCEANIA: {
    earrings: ['Island', 'Ocean', 'Coral', 'Pearl', 'Shell'],
    ornament: ['Tiki', 'Mana', 'Tribal', 'Voyager', 'Chief\'s'],
    tattoo: ['Sacred', 'Warrior', 'Navigator', 'Family']
  },
  NORTH_AMERICAN_PRE_COLUMBIAN: {
    earrings: ['Spirit', 'Eagle', 'Bear', 'Wolf', 'Thunder'],
    feather: ['War', 'Peace', 'Hunt', 'Vision', 'Medicine'],
    turquoise: ['Sky', 'Earth', 'Rain', 'Sun']
  },
  NORTH_AMERICAN_COLONIAL: {
    earrings: ['Frontier', 'Settler', 'Pioneer', 'Trading Post'],
    brooch: ['Pilgrim', 'Colonial', 'Quaker', 'Puritan']
  },
  SOUTH_AMERICAN: {
    earrings: ['Inca', 'Maya', 'Aztec', 'Olmec', 'Toltec'],
    plugs: ['Ritual', 'Noble', 'Priest', 'Warrior'],
    feather: ['Quetzal', 'Condor', 'Jaguar', 'Serpent']
  }
};

// Material suffixes by quality
const QUALITY_MATERIALS: Record<AccessoryQuality, string[]> = {
  crude: ['Rough', 'Worn', 'Tarnished', 'Chipped', 'Weathered'],
  simple: ['Plain', 'Common', 'Basic', 'Modest', 'Humble'],
  fine: ['Polished', 'Refined', 'Elegant', 'Crafted', 'Ornate'],
  masterwork: ['Exquisite', 'Magnificent', 'Perfect', 'Flawless', 'Pristine'],
  legendary: ['Ancient', 'Mythical', 'Sacred', 'Divine', 'Legendary']
};

// Quality multipliers for value
const QUALITY_VALUE_MULTIPLIERS: Record<AccessoryQuality, number> = {
  crude: 0.5,
  simple: 1.0,
  fine: 2.0,
  masterwork: 5.0,
  legendary: 10.0
};

// Generate quality based on wealth and luck
function determineQuality(wealth: string, luck: number = Math.random()): AccessoryQuality {
  const wealthBonus = wealth === 'noble' ? 0.4 : 
                      wealth === 'wealthy' ? 0.3 :
                      wealth === 'comfortable' ? 0.15 :
                      wealth === 'modest' ? 0.05 : 0;
  
  const roll = luck + wealthBonus;
  
  if (roll > 0.98) return 'legendary';
  if (roll > 0.90) return 'masterwork';
  if (roll > 0.70) return 'fine';
  if (roll > 0.30) return 'simple';
  return 'crude';
}

// Generate a procedural name for an accessory
function generateProceduralName(
  baseItem: any,
  culture: CulturalZone,
  quality: AccessoryQuality,
  era?: HistoricalEra
): string {
  const baseName = baseItem.name;
  const type = baseName.toLowerCase();
  
  // Get cultural prefix if available
  let prefix = '';
  const culturalPrefixes = CULTURAL_PREFIXES[culture];
  if (culturalPrefixes) {
    // Find matching category
    for (const [category, prefixes] of Object.entries(culturalPrefixes)) {
      if (type.includes(category)) {
        prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        break;
      }
    }
  }
  
  // Get quality descriptor
  const qualityDesc = QUALITY_MATERIALS[quality][Math.floor(Math.random() * QUALITY_MATERIALS[quality].length)];
  
  // Build the name - simplified for accessories
  let finalName = baseName;
  
  // For accessories, we want simpler naming without quality descriptors
  // Just use cultural prefix if available
  if (prefix && quality !== 'simple' && quality !== 'crude') {
    finalName = `${prefix} ${baseName}`;
  }
  
  // Add era suffix for legendary items
  if (quality === 'legendary' && era) {
    const eraName = era.charAt(0).toUpperCase() + era.slice(1);
    finalName += ` of the ${eraName} Era`;
  }
  
  return finalName;
}

// Generate flavor text based on culture and quality
function generateFlavorText(
  item: any,
  culture: CulturalZone,
  quality: AccessoryQuality,
  profession?: string
): string {
  const baseDesc = item.description || '';
  
  const qualityDescriptions: Record<AccessoryQuality, string[]> = {
    crude: [
      'Shows signs of heavy wear.',
      'Roughly made but functional.',
      'Bears the marks of hard use.'
    ],
    simple: [
      'A common example of its type.',
      'Simple but well-maintained.',
      'Unremarkable but serviceable.'
    ],
    fine: [
      'Expertly crafted with attention to detail.',
      'Shows the skill of a master artisan.',
      'A fine example of traditional craftsmanship.'
    ],
    masterwork: [
      'A masterpiece of the jeweler\'s art.',
      'Breathtaking in its beauty and precision.',
      'Worthy of royalty.'
    ],
    legendary: [
      'Said to have been blessed by ancient powers.',
      'Passed down through countless generations.',
      'Imbued with deep cultural significance.'
    ]
  };
  
  const qualityDesc = qualityDescriptions[quality][Math.floor(Math.random() * qualityDescriptions[quality].length)];
  
  // Add profession-specific text
  let professionText = '';
  if (profession) {
    if (profession.toLowerCase().includes('merchant')) {
      professionText = ' Often worn by successful traders.';
    } else if (profession.toLowerCase().includes('priest') || profession.toLowerCase().includes('shaman')) {
      professionText = ' Carries religious significance.';
    } else if (profession.toLowerCase().includes('warrior')) {
      professionText = ' A mark of martial prowess.';
    } else if (profession.toLowerCase().includes('noble')) {
      professionText = ' A symbol of high social standing.';
    }
  }
  
  return `${baseDesc} ${qualityDesc}${professionText}`;
}

// Check if an accessory is a special type (tattoo, face paint, etc.)
function isSpecialAccessory(itemName: string): SpecialAccessoryType | null {
  const name = itemName.toLowerCase();
  
  if (name.includes('tattoo') || name.includes('ta moko')) return 'tattoo';
  if (name.includes('scarification') || name.includes('scar')) return 'scarification';
  if (name.includes('face paint') || name.includes('war paint')) return 'face_paint';
  if (name.includes('henna') || name.includes('mehndi')) return 'henna';
  if (name.includes('septum') || name.includes('ear plug')) return 'permanent_piercing';
  
  return null;
}

// Main function to generate a cultural accessory
export function generateCulturalAccessory(options: AccessoryGenerationOptions): Item | null {
  const { culture, era, wealth, gender, profession, quality: forcedQuality, forceType } = options;
  
  // Get valid accessories for this character
  const validAccessories = getAccessoriesForCharacter(
    culture,
    era,
    wealth,
    gender,
    profession
  );
  
  if (validAccessories.length === 0) return null;
  
  // Select accessory (force type if specified)
  let selectedId: string | null;
  if (forceType) {
    const forced = validAccessories.find(a => a.baseId === forceType);
    selectedId = forced ? forced.baseId : selectRandomAccessory(validAccessories);
  } else {
    selectedId = selectRandomAccessory(validAccessories);
  }
  
  if (!selectedId) return null;
  
  // Get base item definition
  const baseItem = getItemDefinition(selectedId);
  if (!baseItem) return null;
  
  // Create item instance
  const item = createItemInstance(selectedId);
  if (!item) return null;
  
  // Determine quality
  const quality = forcedQuality || determineQuality(wealth);
  
  // Generate procedural name
  item.name = generateProceduralName(baseItem, culture, quality, era);
  
  // Adjust value based on quality
  item.value = Math.round(item.value * QUALITY_VALUE_MULTIPLIERS[quality]);
  
  // Generate flavor text
  item.description = generateFlavorText(baseItem, culture, quality, profession);
  
  // Add special properties for special accessories
  const specialType = isSpecialAccessory(item.name);
  if (specialType) {
    // Add metadata for special handling
    (item as any).specialType = specialType;
    (item as any).isPermanent = specialType === 'tattoo' || specialType === 'scarification' || specialType === 'permanent_piercing';
    (item as any).duration = specialType === 'face_paint' ? 24 : specialType === 'henna' ? 72 : undefined; // Hours
    
    // Modify description
    if ((item as any).isPermanent) {
      item.description += ' This marking is permanent and cannot be easily removed.';
    } else if ((item as any).duration) {
      item.description += ` This decoration will fade after ${(item as any).duration} hours.`;
    }
  }
  
  // Add quality tier to item
  (item as any).quality = quality;
  
  // Add cultural origin
  (item as any).culturalOrigin = culture;
  (item as any).historicalEra = era;
  
  return item;
}

// Generate multiple accessories for a wealthy/noble character
export function generateAccessorySet(
  options: AccessoryGenerationOptions,
  count: number = 2
): Item[] {
  const accessories: Item[] = [];
  const usedTypes = new Set<string>();
  
  for (let i = 0; i < count; i++) {
    const accessory = generateCulturalAccessory(options);
    if (accessory && !usedTypes.has(accessory.baseId)) {
      accessories.push(accessory);
      usedTypes.add(accessory.baseId);
    }
  }
  
  return accessories;
}

// Check if an accessory can be equipped with existing equipment
export function canEquipAccessory(
  accessory: Item,
  existingAccessories: Item[]
): { canEquip: boolean; reason?: string } {
  const specialType = isSpecialAccessory(accessory.name);
  
  // Check for conflicts
  for (const existing of existingAccessories) {
    const existingType = isSpecialAccessory(existing.name);
    
    // Can't have multiple tattoos/scarifications on same area
    if (specialType === 'tattoo' && existingType === 'tattoo') {
      return { canEquip: false, reason: 'Already has tattoos in this area' };
    }
    
    // Can't wear earrings with ear plugs
    if ((accessory.name.includes('earring') && existing.name.includes('plug')) ||
        (accessory.name.includes('plug') && existing.name.includes('earring'))) {
      return { canEquip: false, reason: 'Incompatible ear jewelry' };
    }
    
    // Can't have multiple nose piercings
    if (accessory.name.toLowerCase().includes('nose') && existing.name.toLowerCase().includes('nose')) {
      return { canEquip: false, reason: 'Already wearing nose jewelry' };
    }
  }
  
  return { canEquip: true };
}

// Remove temporary accessories that have expired
export function updateTemporaryAccessories(
  accessories: Item[],
  hoursElapsed: number
): Item[] {
  return accessories.filter(accessory => {
    const duration = (accessory as any).duration;
    if (duration) {
      (accessory as any).duration = duration - hoursElapsed;
      if ((accessory as any).duration <= 0) {
        // Accessory has faded/worn off
        return false;
      }
    }
    return true;
  });
}

// Get display information for special accessories
export function getAccessoryDisplayInfo(accessory: Item): {
  symbol?: string;
  color?: string;
  position?: 'forehead' | 'nose' | 'ear' | 'face' | 'neck';
} {
  const name = accessory.name.toLowerCase();
  
  if (name.includes('bindi') || name.includes('tilak') || name.includes('tikka')) {
    return { symbol: '●', color: '#FF0000', position: 'forehead' };
  }
  if (name.includes('nose')) {
    return { symbol: '○', color: '#C0C0C0', position: 'nose' };
  }
  if (name.includes('earring') || name.includes('ear')) {
    return { symbol: '◉', color: '#FFD700', position: 'ear' };
  }
  if (name.includes('face paint')) {
    return { symbol: '═', color: '#8B4513', position: 'face' };
  }
  if (name.includes('tattoo')) {
    return { symbol: '▓', color: '#2F4F4F', position: 'face' };
  }
  
  return {};
}
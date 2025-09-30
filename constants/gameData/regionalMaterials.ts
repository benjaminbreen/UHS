/**
 * Regional material variations for items
 * Provides culturally and geographically appropriate material substitutions
 */
import { CulturalZone, HistoricalEra } from '../../types';

/**
 * Regional material variations for common items
 * Each item can have different materials based on culture and era
 */
export interface RegionalMaterial {
  material: string;
  name: string;
  valueMultiplier: number;
  qualityBonus?: number;  // Bonus to quality for this material
}

export const REGIONAL_MATERIAL_VARIATIONS: Record<string, Record<CulturalZone, RegionalMaterial>> = {
  // Swords have regional steel variations
  'SWORD': {
    'EAST_ASIAN': {
      material: 'Tamahagane Steel',
      name: 'Katana',
      valueMultiplier: 2.5,
      qualityBonus: 0.2
    },
    'EUROPEAN': {
      material: 'Pattern-welded Steel',
      name: 'Longsword',
      valueMultiplier: 1.5,
      qualityBonus: 0.1
    },
    'MENA': {
      material: 'Damascus Steel',
      name: 'Scimitar',
      valueMultiplier: 2.0,
      qualityBonus: 0.15
    },
    'SOUTH_ASIAN': {
      material: 'Wootz Steel',
      name: 'Talwar',
      valueMultiplier: 1.8,
      qualityBonus: 0.1
    },
    'SUB_SAHARAN_AFRICAN': {
      material: 'Bloom Iron',
      name: 'Takouba',
      valueMultiplier: 1.2
    },
    'NORTH_AMERICAN_PRE_COLUMBIAN': {
      material: 'Obsidian',
      name: 'Macuahuitl',
      valueMultiplier: 0.8
    },
    'SOUTH_AMERICAN': {
      material: 'Bronze',
      name: 'Tumi',
      valueMultiplier: 0.7
    },
    'OCEANIA': {
      material: 'Shark Tooth',
      name: 'Leiomano',
      valueMultiplier: 0.6
    },
    'NORTH_AMERICAN_COLONIAL': {
      material: 'Spring Steel',
      name: 'Cavalry Sabre',
      valueMultiplier: 1.3
    }
  },

  // Armor has regional variations
  'ARMOR': {
    'EAST_ASIAN': {
      material: 'Lacquered Leather',
      name: 'Lamellar Armor',
      valueMultiplier: 1.8,
      qualityBonus: 0.1
    },
    'EUROPEAN': {
      material: 'Wrought Iron',
      name: 'Chainmail',
      valueMultiplier: 1.5
    },
    'MENA': {
      material: 'Scale Metal',
      name: 'Scale Armor',
      valueMultiplier: 1.4
    },
    'SOUTH_ASIAN': {
      material: 'Quilted Cotton',
      name: 'Chilta Hazar Nakh',
      valueMultiplier: 1.2
    },
    'SUB_SAHARAN_AFRICAN': {
      material: 'Rhinoceros Hide',
      name: 'Hide Armor',
      valueMultiplier: 1.1
    },
    'NORTH_AMERICAN_PRE_COLUMBIAN': {
      material: 'Hardened Leather',
      name: 'Buffalo Hide Armor',
      valueMultiplier: 0.9
    },
    'SOUTH_AMERICAN': {
      material: 'Cotton Padding',
      name: 'Escaupil',
      valueMultiplier: 0.7
    },
    'OCEANIA': {
      material: 'Coconut Fiber',
      name: 'Kiribati Armor',
      valueMultiplier: 0.6
    },
    'NORTH_AMERICAN_COLONIAL': {
      material: 'Buff Leather',
      name: 'Buff Coat',
      valueMultiplier: 1.3
    }
  },

  // Jewelry materials vary by region
  'NECKLACE': {
    'EAST_ASIAN': {
      material: 'Jade',
      name: 'Jade Pendant',
      valueMultiplier: 3.0,
      qualityBonus: 0.2
    },
    'EUROPEAN': {
      material: 'Amber',
      name: 'Amber Pendant',
      valueMultiplier: 2.0
    },
    'MENA': {
      material: 'Lapis Lazuli',
      name: 'Lapis Amulet',
      valueMultiplier: 2.5
    },
    'SOUTH_ASIAN': {
      material: 'Ruby',
      name: 'Ruby Pendant',
      valueMultiplier: 4.0,
      qualityBonus: 0.3
    },
    'SUB_SAHARAN_AFRICAN': {
      material: 'Ivory',
      name: 'Ivory Pendant',
      valueMultiplier: 2.2
    },
    'NORTH_AMERICAN_PRE_COLUMBIAN': {
      material: 'Turquoise',
      name: 'Turquoise Amulet',
      valueMultiplier: 1.8
    },
    'SOUTH_AMERICAN': {
      material: 'Emerald',
      name: 'Emerald Pendant',
      valueMultiplier: 3.5,
      qualityBonus: 0.25
    },
    'OCEANIA': {
      material: 'Pearl',
      name: 'Pearl Necklace',
      valueMultiplier: 2.8
    },
    'NORTH_AMERICAN_COLONIAL': {
      material: 'Silver',
      name: 'Silver Locket',
      valueMultiplier: 1.5
    }
  },

  // Textiles vary by region
  'TUNIC': {
    'EAST_ASIAN': {
      material: 'Silk',
      name: 'Silk Robe',
      valueMultiplier: 2.5,
      qualityBonus: 0.15
    },
    'EUROPEAN': {
      material: 'Wool',
      name: 'Wool Tunic',
      valueMultiplier: 1.0
    },
    'MENA': {
      material: 'Cotton',
      name: 'Cotton Thobe',
      valueMultiplier: 1.2
    },
    'SOUTH_ASIAN': {
      material: 'Muslin',
      name: 'Muslin Kurta',
      valueMultiplier: 1.8,
      qualityBonus: 0.1
    },
    'SUB_SAHARAN_AFRICAN': {
      material: 'Kente Cloth',
      name: 'Kente Dashiki',
      valueMultiplier: 2.0,
      qualityBonus: 0.1
    },
    'NORTH_AMERICAN_PRE_COLUMBIAN': {
      material: 'Deerskin',
      name: 'Buckskin Shirt',
      valueMultiplier: 1.3
    },
    'SOUTH_AMERICAN': {
      material: 'Alpaca Wool',
      name: 'Alpaca Poncho',
      valueMultiplier: 1.6
    },
    'OCEANIA': {
      material: 'Tapa Cloth',
      name: 'Tapa Wrap',
      valueMultiplier: 1.4
    },
    'NORTH_AMERICAN_COLONIAL': {
      material: 'Linen',
      name: 'Linen Shirt',
      valueMultiplier: 1.1
    }
  }
};

/**
 * Get regional material variation for an item
 */
export function getRegionalMaterial(
  baseItemId: string,
  culture: CulturalZone
): RegionalMaterial | null {
  const variations = REGIONAL_MATERIAL_VARIATIONS[baseItemId];
  if (!variations) return null;

  return variations[culture] || null;
}

/**
 * Apply regional material to an item
 */
export function applyRegionalMaterial(
  item: any,  // Using any to avoid circular dependency
  culture: CulturalZone
): any {
  const regional = getRegionalMaterial(item.baseId, culture);
  if (!regional) return item;

  return {
    ...item,
    name: regional.name,
    material: regional.material,
    value: Math.round(item.value * regional.valueMultiplier),
    quality: regional.qualityBonus ?
      improveQuality(item.quality, regional.qualityBonus) :
      item.quality,
    culturalVariant: culture
  };
}

/**
 * Improve item quality based on bonus
 */
function improveQuality(currentQuality: string = 'standard', bonus: number): string {
  const qualities = ['poor', 'standard', 'good', 'excellent'];
  const currentIndex = qualities.indexOf(currentQuality);

  // Bonus is a probability to upgrade
  if (Math.random() < bonus) {
    const newIndex = Math.min(currentIndex + 1, qualities.length - 1);
    return qualities[newIndex];
  }

  return currentQuality;
}

/**
 * Era-specific material availability
 * Some materials only become available in certain eras
 */
export const ERA_MATERIAL_AVAILABILITY: Record<HistoricalEra, Set<string>> = {
  'PREHISTORY': new Set([
    'Stone', 'Bone', 'Hide', 'Wood', 'Flint', 'Obsidian', 'Shell'
  ]),
  'ANTIQUITY': new Set([
    'Bronze', 'Copper', 'Tin', 'Lead', 'Iron', 'Leather', 'Wool', 'Linen',
    'Jade', 'Amber', 'Ivory', 'Pearl'
  ]),
  'MEDIEVAL': new Set([
    'Steel', 'Wrought Iron', 'Pattern-welded Steel', 'Damascus Steel',
    'Silk', 'Cotton', 'Wool', 'Leather', 'Mail', 'Scale Metal'
  ]),
  'RENAISSANCE_EARLY_MODERN': new Set([
    'Spring Steel', 'Brass', 'Glass', 'Velvet', 'Damask', 'Satin',
    'Gunpowder', 'Paper', 'Porcelain'
  ]),
  'INDUSTRIAL_ERA': new Set([
    'Cast Iron', 'Tool Steel', 'Rubber', 'Cotton', 'Synthetic Dyes',
    'Coal', 'Processed Leather', 'Machine-woven Cloth'
  ]),
  'MODERN_ERA': new Set([
    'Stainless Steel', 'Aluminum', 'Plastic', 'Nylon', 'Polyester',
    'Kevlar', 'Titanium', 'Synthetic Fiber'
  ]),
  'FUTURE_ERA': new Set([
    'Graphene', 'Carbon Nanotube', 'Metamaterial', 'Smart Fabric',
    'Quantum Crystal', 'Nanofiber', 'Plasma', 'Energy Shield'
  ])
};

/**
 * Check if a material is available in an era
 */
export function isMaterialAvailableInEra(
  material: string,
  era: HistoricalEra
): boolean {
  // Check all previous eras too (cumulative availability)
  const eras: HistoricalEra[] = [
    'PREHISTORY', 'ANTIQUITY', 'MEDIEVAL',
    'RENAISSANCE_EARLY_MODERN', 'INDUSTRIAL_ERA',
    'MODERN_ERA', 'FUTURE_ERA'
  ];

  const eraIndex = eras.indexOf(era);
  for (let i = 0; i <= eraIndex; i++) {
    if (ERA_MATERIAL_AVAILABILITY[eras[i]]?.has(material)) {
      return true;
    }
  }

  return false;
}
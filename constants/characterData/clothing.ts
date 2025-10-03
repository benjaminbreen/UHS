/**
 * constants/characterData/clothing.ts - Enhanced procedural, context-aware clothing generation.
 * Comprehensive historical eras and cultural zones with intelligent fallback systems.
 */
import { HistoricalEra, CulturalZone, WealthLevel, Gender } from '../../types';

interface ClothingPiece {
    name: string;
    material: string;
    adjectives?: string[];
}

interface ClothingPalette {
    primary: string[];
    secondary: string[];
    accent: string[];
}

interface ClothingSet {
    garments: ClothingPiece[];
    headgear: ClothingPiece[];
    footwear: ClothingPiece[];
    belts: ClothingPiece[];
    accessories: ClothingPiece[];
    palette: ClothingPalette;
}

// Simplified wealth levels - combining similar tiers
type SimplifiedWealthLevel = 'poor' | 'common' | 'wealthy';
type GenderClothingMap = Partial<Record<Gender, ClothingSet>>;
type WealthClothingMap = Partial<Record<SimplifiedWealthLevel, GenderClothingMap>>;
type EraClothingMap = Partial<Record<HistoricalEra, WealthClothingMap>>;
export type ClothingData = Partial<Record<CulturalZone, EraClothingMap>>;

// NEW: Fallback logic constants
const WEALTH_PROGRESSION: Record<SimplifiedWealthLevel, SimplifiedWealthLevel[]> = {
    poor: ['common', 'wealthy'],
    common: ['poor', 'wealthy'],
    wealthy: ['common', 'poor']
};

const ERA_PROGRESSION: Partial<Record<HistoricalEra, HistoricalEra[]>> = {
    [HistoricalEra.PREHISTORY]: [HistoricalEra.ANTIQUITY],
    [HistoricalEra.ANTIQUITY]: [HistoricalEra.MEDIEVAL, HistoricalEra.PREHISTORY],
    [HistoricalEra.MEDIEVAL]: [HistoricalEra.RENAISSANCE_EARLY_MODERN, HistoricalEra.ANTIQUITY],
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [HistoricalEra.MEDIEVAL, HistoricalEra.INDUSTRIAL_ERA],
    [HistoricalEra.INDUSTRIAL_ERA]: [HistoricalEra.RENAISSANCE_EARLY_MODERN, HistoricalEra.MODERN_ERA],
    [HistoricalEra.MODERN_ERA]: [HistoricalEra.INDUSTRIAL_ERA],
};

const CULTURAL_SIMILARITY: Partial<Record<CulturalZone, CulturalZone[]>> = {
    'EUROPEAN': ['NORTH_AMERICAN_COLONIAL'],
    'NORTH_AMERICAN_COLONIAL': ['EUROPEAN'],
    'NORTH_AMERICAN_PRE_COLUMBIAN': ['SOUTH_AMERICAN'],
    'SOUTH_AMERICAN': ['NORTH_AMERICAN_PRE_COLUMBIAN'],
    'EAST_ASIAN': ['SOUTH_ASIAN'],
    'SOUTH_ASIAN': ['MENA', 'EAST_ASIAN'],
    'MENA': ['SOUTH_ASIAN', 'EUROPEAN'],
    'SUB_SAHARAN_AFRICAN': ['OCEANIA'],
    'OCEANIA': ['SUB_SAHARAN_AFRICAN'],
};


// ERA-SPECIFIC COLOR PALETTES
const PREHISTORIC_COLORS: ClothingPalette = {
    primary: ['#8B4513', '#654321', '#A0522D', '#DEB887', '#6B4226', '#8B7355'], // Earth tones, hide colors
    secondary: ['#F5DEB3', '#D2B48C', '#BC8F8F', '#DDBF94', '#C8B99C'], // Natural fiber colors
    accent: ['#228B22', '#8B0000', '#DAA520', '#CD853F', '#9ACD32'] // Plant dyes
};

const ANCIENT_COLORS: ClothingPalette = {
    primary: ['#FFFFFF', '#F5F5DC', '#8B0000', '#4B0082', '#000080', '#2F4F4F'], 
    secondary: ['#F5DEB3', '#D2691E', '#8B4513', '#CD853F', '#A0522D'], 
    accent: ['#FFD700', '#C0C0C0', '#228B22', '#DC143C', '#4169E1']
};

const MEDIEVAL_COLORS: ClothingPalette = {
    primary: ['#251df5', '#4b5563', '#3c362a', '#6d2828', '#2d3748', '#744210'], 
    secondary: ['#fde68a', '#e5e7eb', '#6b7280', '#d1d5db', '#f3f4f6'], 
    accent: ['#1e40af', '#15803d', '#b45309', '#7c2d12', '#581c87']
};

const RENAISSANCE_COLORS: ClothingPalette = {
    primary: ['#8B0000', '#000080', '#800080', '#000000', '#2F4F4F', '#8B008B'],
    secondary: ['#FFFFFF', '#FFD700', '#C0C0C0', '#F5DEB3', '#DDA0DD'],
    accent: ['#228B22', '#FF6347', '#4169E1', '#DA70D6', '#20B2AA']
};

const INDUSTRIAL_COLORS: ClothingPalette = {
    primary: ['#000000', '#2F4F4F', '#696969', '#8B4513', '#36454F', '#1C1C1C'],
    secondary: ['#FFFFFF', '#F5F5DC', '#D3D3D3', '#DCDCDC', '#E5E5E5'],
    accent: ['#B22222', '#000080', '#228B22', '#8B0000', '#4682B4']
};

const MODERN_COLORS: ClothingPalette = {
    primary: ['#000000', '#FFFFFF', '#696969', '#000080', '#2F4F4F', '#708090'],
    secondary: ['#8B4513', '#4682B4', '#CD853F', '#A0522D', '#D2B48C'],
    accent: ['#DC143C', '#DAA520', '#32CD32', '#FF4500', '#1E90FF']
};

// CULTURAL ZONE SPECIFIC PALETTES
const EAST_ASIAN_COLORS: ClothingPalette = {
    primary: ['#8B0000', '#FFD700', '#000000', '#FFFFFF', '#4169E1', '#228B22'],
    secondary: ['#C0C0C0', '#DA70D6', '#20B2AA', '#FF6347', '#DDA0DD'],
    accent: ['#FF1493', '#00CED1', '#98FB98', '#F0E68C', '#DEB887']
};

const MENA_COLORS: ClothingPalette = {
    primary: ['#251df5', '#F5DEB3', '#DEB887', '#8B4513', '#2F4F4F', '#D2691E'],
    secondary: ['#000080', '#8B0000', '#228B22', '#DAA520', '#CD853F'],
    accent: ['#FFD700', '#C0C0C0', '#4169E1', '#DC143C', '#20B2AA']
};

const TROPICAL_COLORS: ClothingPalette = {
    primary: ['#F5DEB3', '#8B4513', '#FFFFFF', '#228B22', '#D2691E', '#DEB887'],
    secondary: ['#FFD700', '#8B0000', '#000080', '#FF6347', '#DA70D6'],
    accent: ['#20B2AA', '#98FB98', '#F0E68C', '#FFB6C1', '#87CEEB']
};

const NORTHERN_COLORS: ClothingPalette = {
    primary: ['#2F4F4F', '#696969', '#8B4513', '#000000', '#36454F', '#4682B4'],
    secondary: ['#F5F5DC', '#D3D3D3', '#DEB887', '#CD853F', '#A0522D'],
    accent: ['#B22222', '#228B22', '#000080', '#8B0000', '#4169E1']
};

const MEDIEVAL_MENA_COLORS: ClothingPalette = {
    primary: ['#251df5', '#000080', '#800080', '#000000', '#2F4F4F', '#8B008B'],
    secondary: ['#FFFFFF', '#FFD700', '#C0C0C0', '#F5DEB3', '#DDA0DD'],
    accent: ['#228B22', '#FF6347', '#4169E1', '#DA70D6', '#20B2AA']
};

const INDUSTRIAL_MENA_COLORS: ClothingPalette = {
    primary: ['#000000', '#2F4F4F', '#696969', '#8B4513', '#36454F', '#1C1C1C'],
    secondary: ['#FFFFFF', '#F5F5DC', '#D3D3D3', '#DCDCDC', '#E5E5E5'],
    accent: ['#B22222', '#000080', '#228B22', '#8B0000', '#4682B4']
};

// COMPREHENSIVE CLOTHING DATABASE
export const CLOTHING_DATA: ClothingData = {
    EUROPEAN: {
        [HistoricalEra.PREHISTORY]: {
            poor: {
                Male: {
                    garments: [
                        { name: 'Hide Wrap', material: 'Deer Hide', adjectives: ['Rough', 'Patched'] },
                        { name: 'Skin Cloak', material: 'Bear Fur', adjectives: ['Heavy', 'Warm'] },
                        { name: 'Leather Tunic', material: 'Wild Boar Hide', adjectives: ['Crude'] }
                    ],
                    headgear: [
                        { name: 'Fur Cap', material: 'Rabbit Fur' },
                        { name: 'Hide Hood', material: 'Wolf Skin' },
                        { name: 'None', material: 'None' }
                    ],
                    footwear: [
                        { name: 'Hide Boots', material: 'Mammoth Leather', adjectives: ['Fur-lined'] },
                        { name: 'Foot Wraps', material: 'Reindeer Hide' },
                        { name: 'Barefoot', material: 'None' }
                    ],
                    belts: [
                        { name: 'Sinew Belt', material: 'Animal Sinew' },
                        { name: 'Hide Strip', material: 'Raw Hide' }
                    ],
                    accessories: [
                        { name: 'Bone Necklace', material: 'Carved Bone' },
                        { name: 'Stone Pendant', material: 'Shaped Flint' },
                        { name: 'Tooth Ornament', material: 'Cave Bear Tooth' }
                    ],
                    palette: PREHISTORIC_COLORS
                },
                Female: {
                    garments: [
                        { name: 'Hide Dress', material: 'Deer Skin', adjectives: ['Simple', 'Practical'] },
                        { name: 'Fur Wrap', material: 'Seal Fur', adjectives: ['Warm'] },
                        { name: 'Skin Robe', material: 'Elk Hide' }
                    ],
                    headgear: [
                        { name: 'Fur Hood', material: 'Fox Fur' },
                        { name: 'Bone Ornament', material: 'Carved Antler' },
                        { name: 'None', material: 'None' }
                    ],
                    footwear: [
                        { name: 'Soft Boots', material: 'Rabbit Fur', adjectives: ['Lined'] },
                        { name: 'Hide Slippers', material: 'Seal Skin' }
                    ],
                    belts: [
                        { name: 'Braided Belt', material: 'Plant Fiber' },
                        { name: 'Hide Cord', material: 'Twisted Sinew' }
                    ],
                    accessories: [
                        { name: 'Shell Necklace', material: 'River Shells' },
                        { name: 'Amber Beads', material: 'Amber' },
                        { name: 'Feather Ornament', material: 'Eagle Feathers' }
                    ],
                    palette: PREHISTORIC_COLORS
                }
            },
            common: {
                Male: {
                    garments: [
                        { name: 'Fur Tunic', material: 'Wolf Pelt', adjectives: ['Well-made'] },
                        { name: 'Hide Vest', material: 'Auroch Hide', adjectives: ['Thick'] }
                    ],
                    headgear: [
                        { name: 'Antler Crown', material: 'Stag Antlers', adjectives: ['Ceremonial'] },
                        { name: 'Feathered Cap', material: 'Bird Feathers' }
                    ],
                    footwear: [
                        { name: 'Fur Boots', material: 'Cave Bear Fur', adjectives: ['Warm'] }
                    ],
                    belts: [
                        { name: 'Decorated Belt', material: 'Carved Bone', adjectives: ['Ornate'] }
                    ],
                    accessories: [
                        { name: 'Ivory Pendant', material: 'Mammoth Tusk' },
                        { name: 'Stone Axe', material: 'Flint and Wood', adjectives: ['Ceremonial'] }
                    ],
                    palette: PREHISTORIC_COLORS
                },
                Female: {
                    garments: [
                        { name: 'Decorated Robe', material: 'Painted Hide', adjectives: ['Ceremonial'] }
                    ],
                    headgear: [
                        { name: 'Flower Crown', material: 'Woven Flowers', adjectives: ['Seasonal'] }
                    ],
                    footwear: [
                        { name: 'Decorated Boots', material: 'Dyed Leather', adjectives: ['Painted'] }
                    ],
                    belts: [
                        { name: 'Beaded Belt', material: 'Stone Beads' }
                    ],
                    accessories: [
                        { name: 'Ivory Bracelet', material: 'Carved Ivory' },
                        { name: 'Painted Ornament', material: 'Ochre on Bone' }
                    ],
                    palette: PREHISTORIC_COLORS
                }
            }
        },
        [HistoricalEra.ANTIQUITY]: {
            poor: {
                Male: {
                    garments: [
                        { name: 'Rough Tunic', material: 'Coarse Wool', adjectives: ['Patched', 'Worn'] },
                        { name: 'Loincloth', material: 'Hemp' },
                        { name: 'Slave Tunic', material: 'Undyed Linen', adjectives: ['Simple'] }
                    ],
                    headgear: [
                        { name: 'Felt Cap', material: 'Rough Felt' },
                        { name: 'None', material: 'None' }
                    ],
                    footwear: [
                        { name: 'Leather Sandals', material: 'Cracked Leather', adjectives: ['Worn'] },
                        { name: 'Rope Sandals', material: 'Twisted Hemp' },
                        { name: 'Barefoot', material: 'None' }
                    ],
                    belts: [
                        { name: 'Rope Belt', material: 'Hemp Rope' },
                        { name: 'Leather Cord', material: 'Raw Leather' }
                    ],
                    accessories: [
                        { name: 'Clay Amulet', material: 'Fired Clay' },
                        { name: 'Iron Ring', material: 'Iron' }
                    ],
                    palette: ANCIENT_COLORS
                },
                Female: {
                    garments: [
                        { name: 'Simple Stola', material: 'Rough Wool', adjectives: ['Plain', 'Undyed'] },
                        { name: 'Work Dress', material: 'Hemp', adjectives: ['Practical'] },
                        { name: 'Slave Tunic', material: 'Coarse Linen' }
                    ],
                    headgear: [
                        { name: 'Linen Veil', material: 'Rough Linen' },
                        { name: 'None', material: 'None' }
                    ],
                    footwear: [
                        { name: 'Simple Sandals', material: 'Leather' },
                        { name: 'Barefoot', material: 'None' }
                    ],
                    belts: [
                        { name: 'Hemp Girdle', material: 'Woven Hemp' }
                    ],
                    accessories: [
                        { name: 'Bronze Pin', material: 'Bronze' },
                        { name: 'Clay Beads', material: 'Painted Clay' }
                    ],
                    palette: ANCIENT_COLORS
                }
            },
            common: {
                Male: {
                    garments: [
                        { name: 'Citizen Toga', material: 'Good Wool', adjectives: ['Clean', 'White'] },
                        { name: 'Tunic', material: 'Fine Linen' },
                        { name: 'Chiton', material: 'Quality Wool' }
                    ],
                    headgear: [
                        { name: 'Laurel Wreath', material: 'Bronze Leaves', adjectives: ['Civic'] },
                        { name: 'Petasos', material: 'Felt', adjectives: ['Travel'] }
                    ],
                    footwear: [
                        { name: 'Calcei', material: 'Good Leather', adjectives: ['Laced'] },
                        { name: 'Military Sandals', material: 'Studded Leather' }
                    ],
                    belts: [
                        { name: 'Leather Belt', material: 'Tooled Leather' },
                        { name: 'Military Belt', material: 'Decorated Leather', adjectives: ['Studded'] }
                    ],
                    accessories: [
                        { name: 'Bronze Ring', material: 'Bronze', adjectives: ['Signet'] },
                        { name: 'Cloak Pin', material: 'Silver' }
                    ],
                    palette: ANCIENT_COLORS
                },
                Female: {
                    garments: [
                        { name: 'Elegant Stola', material: 'Fine Wool', adjectives: ['Draped'] },
                        { name: 'Peplos', material: 'Quality Linen' },
                        { name: 'Palla', material: 'Soft Wool', adjectives: ['Colored'] }
                    ],
                    headgear: [
                        { name: 'Silver Diadem', material: 'Silver' },
                        { name: 'Silk Veil', material: 'Imported Silk' }
                    ],
                    footwear: [
                        { name: 'Leather Soleae', material: 'Soft Leather' },
                        { name: 'Decorated Sandals', material: 'Dyed Leather' }
                    ],
                    belts: [
                        { name: 'Silk Girdle', material: 'Silk Cord' },
                        { name: 'Gold Chain', material: 'Thin Gold', adjectives: ['Delicate'] }
                    ],
                    accessories: [
                        { name: 'Pearl Earrings', material: 'Cultured Pearls' },
                        { name: 'Gold Bracelet', material: 'Twisted Gold' }
                    ],
                    palette: ANCIENT_COLORS
                }
            },
            wealthy: {
                Male: {
                    garments: [
                        { name: 'Senatorial Toga', material: 'Purple-striped Wool', adjectives: ['Imperial'] },
                        { name: 'Silk Tunic', material: 'Chinese Silk', adjectives: ['Luxurious'] },
                        { name: 'Emperor Robe', material: 'Tyrian Purple', adjectives: ['Divine'] }
                    ],
                    headgear: [
                        { name: 'Golden Laurel', material: 'Solid Gold', adjectives: ['Imperial'] },
                        { name: 'Jeweled Diadem', material: 'Gold and Gems' }
                    ],
                    footwear: [
                        { name: 'Patrician Boots', material: 'Purple Leather', adjectives: ['Gilded'] },
                        { name: 'Jeweled Sandals', material: 'Gold and Leather' }
                    ],
                    belts: [
                        { name: 'Golden Belt', material: 'Solid Gold', adjectives: ['Jeweled'] }
                    ],
                    accessories: [
                        { name: 'Signet Ring', material: 'Gold and Ruby', adjectives: ['Imperial'] },
                        { name: 'Ceremonial Sword', material: 'Gold and Steel', adjectives: ['Jeweled'] }
                    ],
                    palette: ANCIENT_COLORS
                },
                Female: {
                    garments: [
                        { name: 'Imperial Stola', material: 'Gold-thread Silk', adjectives: ['Divine'] },
                        { name: 'Empress Robe', material: 'Purple Silk', adjectives: ['Jeweled'] }
                    ],
                    headgear: [
                        { name: 'Imperial Crown', material: 'Gold and Pearls', adjectives: ['Divine'] }
                    ],
                    footwear: [
                        { name: 'Golden Slippers', material: 'Gold and Silk', adjectives: ['Jeweled'] }
                    ],
                    belts: [
                        { name: 'Pearl Girdle', material: 'Pearls and Gold' }
                    ],
                    accessories: [
                        { name: 'Emerald Necklace', material: 'Emeralds and Gold' },
                        { name: 'Diamond Tiara', material: 'Diamonds and Platinum' }
                    ],
                    palette: ANCIENT_COLORS
                }
            }
        },
        [HistoricalEra.MEDIEVAL]: {
            poor: {
                Male: {
                    garments: [
                        { name: 'Serf Tunic', material: 'Rough Wool', adjectives: ['Patched', 'Brown'] },
                        { name: 'Peasant Shirt', material: 'Hemp', adjectives: ['Coarse'] },
                        { name: 'Work Hose', material: 'Wool', adjectives: ['Darned'] }
                    ],
                    headgear: [
                        { name: 'Coif', material: 'Linen', adjectives: ['Simple'] },
                        { name: 'Harvest Cap', material: 'Rye Straw', adjectives: ['Wide-brimmed'] },
                        { name: 'None', material: 'None' }
                    ],
                    footwear: [
                        { name: 'Wooden Clogs', material: 'Oak Wood' },
                        { name: 'Leather Shoes', material: 'Cracked Leather', adjectives: ['Patched'] },
                        { name: 'Foot Wraps', material: 'Linen', adjectives: ['Muddy'] }
                    ],
                    belts: [
                        { name: 'Rope Belt', material: 'Hemp Rope' },
                        { name: 'Leather Strap', material: 'Old Leather', adjectives: ['Worn'] }
                    ],
                    accessories: [
                        { name: 'Wooden Cross', material: 'Carved Wood' },
                        { name: 'Leather Pouch', material: 'Rough Leather' },
                        { name: 'Prayer Beads', material: 'Wood' },
                        { name: 'Rope Necklace', material: 'Hemp' },
                        { name: 'Bone Necklace', material: 'Bone' },
                        { name: 'Shell Necklace', material: 'Shell' }
                    ],
                    palette: MEDIEVAL_COLORS
                },
                Female: {
                    garments: [
                        { name: 'Peasant Kirtle', material: 'Wool', adjectives: ['Simple', 'Practical'] },
                        { name: 'Work Dress', material: 'Hemp', adjectives: ['Sturdy'] },
                        { name: 'Underdress', material: 'Linen', adjectives: ['Plain'] }
                    ],
                    headgear: [
                        { name: 'Linen Wimple', material: 'Rough Linen' },
                        { name: 'Kerchief', material: 'Hemp', adjectives: ['Faded'] },
                        { name: 'None', material: 'None' }
                    ],
                    footwear: [
                        { name: 'Wooden Shoes', material: 'Carved Wood' },
                        { name: 'Cloth Shoes', material: 'Wool', adjectives: ['Worn'] }
                    ],
                    belts: [
                        { name: 'Cord Belt', material: 'Braided Hemp' }
                    ],
                    accessories: [
                        { name: 'Wooden Beads', material: 'Carved Wood', adjectives: ['Prayer'] },
                        { name: 'Iron Pin', material: 'Rough Iron' }
                    ],
                    palette: MEDIEVAL_COLORS
                }
            },
            common: {
                Male: {
                    garments: [
                        { name: 'Merchant Doublet', material: 'Good Wool', adjectives: ['Dyed'] },
                        { name: 'Craftsman Tunic', material: 'Fine Linen' },
                        { name: 'Guild Surcoat', material: 'Wool', adjectives: ['Marked'] }
                    ],
                    headgear: [
                        { name: 'Felt Hat', material: 'Quality Felt' },
                        { name: 'Chaperon', material: 'Wool', adjectives: ['Stylish'] }
                    ],
                    footwear: [
                        { name: 'Leather Boots', material: 'Good Leather' },
                        { name: 'Pointed Shoes', material: 'Soft Leather', adjectives: ['Fashionable'] }
                    ],
                    belts: [
                        { name: 'Tooled Belt', material: 'Decorated Leather' },
                        { name: 'Guild Belt', material: 'Leather', adjectives: ['Marked'] }
                    ],
                    accessories: [
                        { name: 'Silver Brooch', material: 'Silver', adjectives: ['Guild'] },
                        { name: 'Brass Ring', material: 'Brass' }
                    ],
                    palette: MEDIEVAL_COLORS
                },
                Female: {
                    garments: [
                        { name: 'Merchant Gown', material: 'Fine Wool', adjectives: ['Colored'] },
                        { name: 'Cotehardie', material: 'Good Linen', adjectives: ['Fitted'] },
                        { name: 'Guild Dress', material: 'Quality Wool' }
                    ],
                    headgear: [
                        { name: 'Barbette', material: 'Linen', adjectives: ['White'] },
                        { name: 'Circlet', material: 'Silver', adjectives: ['Simple'] }
                    ],
                    footwear: [
                        { name: 'Soft Shoes', material: 'Leather', adjectives: ['Comfortable'] },
                        { name: 'Pattens', material: 'Wood and Leather', adjectives: ['Protective'] }
                    ],
                    belts: [
                        { name: 'Silk Girdle', material: 'Silk Cord' },
                        { name: 'Chain Belt', material: 'Silver Links' }
                    ],
                    accessories: [
                        { name: 'Silver Pin', material: 'Silver', adjectives: ['Decorated'] },
                        { name: 'Ivory Comb', material: 'Carved Ivory' },
                        { name: 'Silver Cross', material: 'Silver' },
                        { name: 'Coral Beads', material: 'Red Coral' },
                        { name: 'Pearl Necklace', material: 'River Pearls' },
                        { name: 'Gold Chain', material: 'Gold' },
                        { name: 'Amber Necklace', material: 'Amber' }
                    ],
                    palette: MEDIEVAL_COLORS
                }
            },
            wealthy: {
                Male: {
                    garments: [
                        { name: 'Noble Houppelande', material: 'Velvet', adjectives: ['Fur-lined'] },
                        { name: 'Court Doublet', material: 'Silk Brocade', adjectives: ['Jeweled'] },
                        { name: 'Royal Robe', material: 'Cloth of Gold', adjectives: ['Ermine-trimmed'] }
                    ],
                    headgear: [
                        { name: 'Ducal Coronet', material: 'Gold and Gems' },
                        { name: 'Velvet Cap', material: 'Rich Velvet', adjectives: ['Plumed'] },
                        { name: 'Mitre', material: 'White Silk and Gold', adjectives: ['Episcopal'] }
                    ],
                    footwear: [
                        { name: 'Noble Boots', material: 'Fine Leather', adjectives: ['Gilded'] },
                        { name: 'Court Shoes', material: 'Silk and Gold', adjectives: ['Pointed'] }
                    ],
                    belts: [
                        { name: 'Golden Belt', material: 'Gold and Gems', adjectives: ['Jeweled'] }
                    ],
                    accessories: [
                        { name: 'Ducal Ring', material: 'Gold and Ruby' },
                        { name: 'Ceremonial Sword', material: 'Steel and Gold', adjectives: ['Jeweled'] }
                    ],
                    palette: MEDIEVAL_COLORS
                },
                Female: {
                    garments: [
                        { name: 'Court Gown', material: 'Silk Velvet', adjectives: ['Jeweled'] },
                        { name: 'Noble Houppelande', material: 'Cloth of Gold' },
                        { name: 'Royal Robe', material: 'Ermine and Silk' }
                    ],
                    headgear: [
                        { name: 'Ducal Crown', material: 'Gold and Pearls' },
                        { name: 'Hennin', material: 'Silk and Gems', adjectives: ['Tall'] }
                    ],
                    footwear: [
                        { name: 'Silk Slippers', material: 'Embroidered Silk' },
                        { name: 'Noble Shoes', material: 'Velvet and Gold' }
                    ],
                    belts: [
                        { name: 'Jeweled Girdle', material: 'Gold and Gems' }
                    ],
                    accessories: [
                        { name: 'Diamond Necklace', material: 'Diamonds and Gold' },
                        { name: 'Ducal Ring', material: 'Gold and Sapphire' }
                    ],
                    palette: MEDIEVAL_COLORS
                }
            }
        },
        [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
            poor: {
                Male: {
                    garments: [
                        { name: 'Worker Jerkin', material: 'Rough Wool', adjectives: ['Patched'] },
                        { name: 'Peasant Shirt', material: 'Coarse Linen' },
                        { name: 'Simple Hose', material: 'Wool', adjectives: ['Darned'] }
                    ],
                    headgear: [
                        { name: 'Biggins', material: 'Rough Wool', adjectives: ['Close-fitting'] },
                        { name: 'Rush Hat', material: 'Woven Rushes', adjectives: ['Pointed'] }
                    ],
                    footwear: [
                        { name: 'Wooden Shoes', material: 'Oak' },
                        { name: 'Leather Shoes', material: 'Cracked Leather' }
                    ],
                    belts: [
                        { name: 'Rope Belt', material: 'Hemp' },
                        { name: 'Leather Strap', material: 'Old Leather' }
                    ],
                    accessories: [
                        { name: 'Wooden Cross', material: 'Carved Wood' },
                        { name: 'Leather Purse', material: 'Rough Leather' }
                    ],
                    palette: RENAISSANCE_COLORS
                },
                Female: {
                    garments: [
                        { name: 'Work Bodice', material: 'Rough Wool' },
                        { name: 'Peasant Skirt', material: 'Coarse Linen' },
                        { name: 'Simple Chemise', material: 'Hemp' }
                    ],
                    headgear: [
                        { name: 'Linen Coif', material: 'Rough Linen' },
                        { name: 'Kerchief', material: 'Cotton' }
                    ],
                    footwear: [
                        { name: 'Wooden Clogs', material: 'Carved Wood' },
                        { name: 'Cloth Shoes', material: 'Rough Cloth' }
                    ],
                    belts: [
                        { name: 'Cord Belt', material: 'Braided Hemp' }
                    ],
                    accessories: [
                        { name: 'Iron Pin', material: 'Simple Iron' },
                        { name: 'Wooden Beads', material: 'Carved Wood' }
                    ],
                    palette: RENAISSANCE_COLORS
                }
            },
            common: {
                Male: {
                    garments: [
                        { name: 'Merchant Doublet', material: 'Good Wool', adjectives: ['Slashed'] },
                        { name: 'Bourgeois Jerkin', material: 'Fine Linen' },
                        { name: 'Guild Coat', material: 'Quality Wool', adjectives: ['Buttoned'] }
                    ],
                    headgear: [
                        { name: 'Felt Beret', material: 'Quality Felt' },
                        { name: 'Merchant Cap', material: 'Velvet', adjectives: ['Feathered'] }
                    ],
                    footwear: [
                        { name: 'Leather Boots', material: 'Good Leather' },
                        { name: 'Court Shoes', material: 'Fine Leather', adjectives: ['Buckled'] }
                    ],
                    belts: [
                        { name: 'Tooled Belt', material: 'Decorated Leather' },
                        { name: 'Chain Belt', material: 'Silver Links' }
                    ],
                    accessories: [
                        { name: 'Silver Chain', material: 'Silver' },
                        { name: 'Guild Ring', material: 'Silver and Enamel' }
                    ],
                    palette: RENAISSANCE_COLORS
                },
                Female: {
                    garments: [
                        { name: 'Merchant Gown', material: 'Fine Wool', adjectives: ['Slashed'] },
                        { name: 'Bourgeois Dress', material: 'Silk', adjectives: ['Fitted'] },
                        { name: 'Court Farthingale', material: 'Brocade', adjectives: ['Structured'] }
                    ],
                    headgear: [
                        { name: 'French Hood', material: 'Velvet and Silk' },
                        { name: 'Merchant Coif', material: 'Fine Linen', adjectives: ['Embroidered'] }
                    ],
                    footwear: [
                        { name: 'Silk Slippers', material: 'Embroidered Silk' },
                        { name: 'Court Shoes', material: 'Fine Leather' }
                    ],
                    belts: [
                        { name: 'Silk Girdle', material: 'Silk and Silver' },
                        { name: 'Chain Belt', material: 'Silver and Gems' }
                    ],
                    accessories: [
                        { name: 'Gold Pendant', material: 'Gold and Enamel' },
                        { name: 'Pearl Earrings', material: 'Cultured Pearls' }
                    ],
                    palette: RENAISSANCE_COLORS
                }
            },
            wealthy: {
                Male: {
                    garments: [
                        { name: 'Court Doublet', material: 'Cloth of Gold', adjectives: ['Jeweled'] },
                        { name: 'Noble Cloak', material: 'Ermine and Velvet' },
                        { name: 'Royal Robe', material: 'Tyrian Purple', adjectives: ['Divine'] }
                    ],
                    headgear: [
                        { name: 'Ducal Hat', material: 'Velvet and Ostrich', adjectives: ['Plumed'] },
                        { name: 'Royal Crown', material: 'Gold and Gems' }
                    ],
                    footwear: [
                        { name: 'Court Boots', material: 'Spanish Leather', adjectives: ['Gilded'] },
                        { name: 'Noble Slippers', material: 'Silk and Gold' }
                    ],
                    belts: [
                        { name: 'Golden Chain', material: 'Solid Gold', adjectives: ['Jeweled'] }
                    ],
                    accessories: [
                        { name: 'Jeweled Dagger', material: 'Gold and Rubies' },
                        { name: 'Ducal Ring', material: 'Gold and Diamond' }
                    ],
                    palette: RENAISSANCE_COLORS
                },
                Female: {
                    garments: [
                        { name: 'Court Gown', material: 'Cloth of Gold', adjectives: ['Jeweled'] },
                        { name: 'Royal Robe', material: 'Ermine and Silk' },
                        { name: 'Noble Farthingale', material: 'Gold Brocade' }
                    ],
                    headgear: [
                        { name: 'Ducal Crown', material: 'Gold and Pearls' },
                        { name: 'Jeweled Hood', material: 'Velvet and Gems' }
                    ],
                    footwear: [
                        { name: 'Golden Slippers', material: 'Gold and Silk', adjectives: ['Jeweled'] },
                        { name: 'Court Shoes', material: 'Velvet and Pearls' }
                    ],
                    belts: [
                        { name: 'Jeweled Girdle', material: 'Gold and Gems' }
                    ],
                    accessories: [
                        { name: 'Diamond Necklace', material: 'Diamonds and Gold' },
                        { name: 'Ruby Earrings', material: 'Rubies and Gold' }
                    ],
                    palette: RENAISSANCE_COLORS
                }
            }
        },
        [HistoricalEra.INDUSTRIAL_ERA]: {
            poor: {
                Male: {
                    garments: [
                        { name: 'Factory Shirt', material: 'Rough Cotton', adjectives: ['Stained'] },
                        { name: 'Worker Trousers', material: 'Coarse Wool', adjectives: ['Patched'] },
                        { name: 'Mill Smock', material: 'Canvas', adjectives: ['Heavy'] }
                    ],
                    headgear: [
                        { name: 'Flat Cap', material: 'Tweed', adjectives: ['Eight-panel'] },
                        { name: 'Cheese-cutter', material: 'Cotton Duck', adjectives: ['Worn'] },
                        { name: 'Phrygian Cap', material: 'Red Wool', adjectives: ['Revolutionary'] }
                    ],
                    footwear: [
                        { name: 'Work Boots', material: 'Thick Leather', adjectives: ['Hobnailed'] },
                        { name: 'Wooden Clogs', material: 'Oak Wood' }
                    ],
                    belts: [
                        { name: 'Rope Belt', material: 'Hemp Rope' },
                        { name: 'Leather Strap', material: 'Old Leather' }
                    ],
                    accessories: [
                        { name: 'Tin Watch', material: 'Tin and Brass', adjectives: ['Pocket'] },
                        { name: 'Clay Pipe', material: 'Fired Clay' }
                    ],
                    palette: INDUSTRIAL_COLORS
                },
                Female: {
                    garments: [
                        { name: 'Factory Dress', material: 'Rough Cotton', adjectives: ['Plain'] },
                        { name: 'Work Apron', material: 'Canvas', adjectives: ['Stained'] },
                        { name: 'Mill Dress', material: 'Coarse Wool' }
                    ],
                    headgear: [
                        { name: 'Work Bonnet', material: 'Cotton', adjectives: ['Simple'] },
                        { name: 'Kerchief', material: 'Linen', adjectives: ['Faded'] }
                    ],
                    footwear: [
                        { name: 'Work Boots', material: 'Thick Leather' },
                        { name: 'Cloth Shoes', material: 'Canvas' }
                    ],
                    belts: [
                        { name: 'Cloth Sash', material: 'Cotton' }
                    ],
                    accessories: [
                        { name: 'Iron Brooch', material: 'Cast Iron' },
                        { name: 'Wool Shawl', material: 'Rough Wool' }
                    ],
                    palette: INDUSTRIAL_COLORS
                }
            },
            common: {
                Male: {
                    garments: [
                        { name: 'Frock Coat', material: 'Good Wool', adjectives: ['Tailored'] },
                        { name: 'Waistcoat', material: 'Silk', adjectives: ['Buttoned'] },
                        { name: 'Morning Coat', material: 'Fine Wool' }
                    ],
                    headgear: [
                        { name: 'Top Hat', material: 'Silk and Felt', adjectives: ['Formal'] },
                        { name: 'Bowler Hat', material: 'Quality Felt' }
                    ],
                    footwear: [
                        { name: 'Oxford Shoes', material: 'Polished Leather' },
                        { name: 'Dress Boots', material: 'Fine Leather', adjectives: ['Buttoned'] }
                    ],
                    belts: [
                        { name: 'Leather Belt', material: 'Quality Leather' },
                        { name: 'Watch Chain', material: 'Silver', adjectives: ['Pocket'] }
                    ],
                    accessories: [
                        { name: 'Gold Watch', material: 'Gold and Steel', adjectives: ['Pocket'] },
                        { name: 'Silver Cufflinks', material: 'Silver' }
                    ],
                    palette: INDUSTRIAL_COLORS
                },
                Female: {
                    garments: [
                        { name: 'Day Dress', material: 'Fine Cotton', adjectives: ['Bustled'] },
                        { name: 'Afternoon Gown', material: 'Silk Taffeta' },
                        { name: 'Walking Dress', material: 'Quality Wool' }
                    ],
                    headgear: [
                        { name: 'Silk Bonnet', material: 'Silk and Ribbon' },
                        { name: 'Feathered Hat', material: 'Felt and Ostrich' }
                    ],
                    footwear: [
                        { name: 'Button Boots', material: 'Kid Leather', adjectives: ['High'] },
                        { name: 'Silk Slippers', material: 'Embroidered Silk' }
                    ],
                    belts: [
                        { name: 'Silk Sash', material: 'Silk Ribbon' },
                        { name: 'Beaded Belt', material: 'Jet Beads' }
                    ],
                    accessories: [
                        { name: 'Cameo Brooch', material: 'Ivory and Gold' },
                        { name: 'Pearl Necklace', material: 'Cultured Pearls' }
                    ],
                    palette: INDUSTRIAL_COLORS
                }
            },
            wealthy: {
                Male: {
                    garments: [
                        { name: 'Evening Tailcoat', material: 'Finest Wool', adjectives: ['White-tie'] },
                        { name: 'Court Dress', material: 'Silk and Gold' },
                        { name: 'Opera Cloak', material: 'Velvet and Ermine' }
                    ],
                    headgear: [
                        { name: 'Silk Top Hat', material: 'Finest Silk' },
                        { name: 'Opera Hat', material: 'Collapsible Silk' }
                    ],
                    footwear: [
                        { name: 'Patent Shoes', material: 'Patent Leather', adjectives: ['Formal'] },
                        { name: 'Evening Pumps', material: 'Silk and Leather' }
                    ],
                    belts: [
                        { name: 'Gold Chain', material: 'Solid Gold', adjectives: ['Watch'] }
                    ],
                    accessories: [
                        { name: 'Diamond Cufflinks', material: 'Diamonds and Platinum' },
                        { name: 'Gold Watch', material: 'Gold and Gems', adjectives: ['Jeweled'] }
                    ],
                    palette: INDUSTRIAL_COLORS
                },
                Female: {
                    garments: [
                        { name: 'Ball Gown', material: 'Silk and Lace', adjectives: ['Worth'] },
                        { name: 'Court Dress', material: 'Satin and Gems' },
                        { name: 'Opera Gown', material: 'Velvet and Pearls' }
                    ],
                    headgear: [
                        { name: 'Diamond Tiara', material: 'Diamonds and Platinum' },
                        { name: 'Feathered Headdress', material: 'Ostrich and Gems' }
                    ],
                    footwear: [
                        { name: 'Satin Slippers', material: 'Silk Satin', adjectives: ['Jeweled'] },
                        { name: 'Evening Boots', material: 'Kid and Silk' }
                    ],
                    belts: [
                        { name: 'Jeweled Belt', material: 'Gold and Gems' }
                    ],
                    accessories: [
                        { name: 'Diamond Parure', material: 'Diamonds and Gold', adjectives: ['Complete'] },
                        { name: 'Emerald Necklace', material: 'Emeralds and Platinum' }
                    ],
                    palette: INDUSTRIAL_COLORS
                }
            }
        },
        [HistoricalEra.MODERN_ERA]: {
            poor: {
                Male: {
                    garments: [
                        { name: 'Work Shirt', material: 'Rough Cotton', adjectives: ['Worn'] },
                        { name: 'Denim Overalls', material: 'Heavy Denim' },
                        { name: 'Union Suit', material: 'Wool', adjectives: ['Patched'] }
                    ],
                    headgear: [
                        { name: 'Newsboy Cap', material: 'Wool Tweed' },
                        { name: 'Flat Cap', material: 'Cotton', adjectives: ['Worn'] },
                        { name: 'Ushanka', material: 'Rabbit Fur', adjectives: ['Winter'] }
                    ],
                    footwear: [
                        { name: 'Work Boots', material: 'Thick Leather', adjectives: ['Steel-toed'] },
                        { name: 'Canvas Shoes', material: 'Canvas and Rubber' }
                    ],
                    belts: [
                        { name: 'Work Belt', material: 'Thick Leather' },
                        { name: 'Rope Belt', material: 'Hemp' }
                    ],
                    accessories: [
                        { name: 'Pocket Watch', material: 'Brass', adjectives: ['Railroad'] },
                        { name: 'Bandana', material: 'Cotton' }
                    ],
                    palette: MODERN_COLORS
                },
                Female: {
                    garments: [
                        { name: 'House Dress', material: 'Cotton Print', adjectives: ['Simple'] },
                        { name: 'Work Dress', material: 'Sturdy Cotton' },
                        { name: 'Factory Dress', material: 'Practical Wool' }
                    ],
                    headgear: [
                        { name: 'Work Bonnet', material: 'Cotton', adjectives: ['Simple'] },
                        { name: 'Kerchief', material: 'Linen', adjectives: ['Faded'] }
                    ],
                    footwear: [
                        { name: 'Work Boots', material: 'Thick Leather' },
                        { name: 'Cloth Shoes', material: 'Canvas' }
                    ],
                    belts: [
                        { name: 'Cloth Sash', material: 'Cotton' }
                    ],
                    accessories: [
                        { name: 'Simple Brooch', material: 'Base Metal' },
                        { name: 'Wedding Ring', material: 'Silver' }
                    ],
                    palette: MODERN_COLORS
                }
            },
            common: {
                Male: {
                    garments: [
                        { name: 'Business Suit', material: 'Wool Serge' },
                        { name: 'Cardigan', material: 'Wool', adjectives: ['Knitted'] },
                        { name: 'Sports Jacket', material: 'Tweed' }
                    ],
                    headgear: [
                        { name: 'Fedora', material: 'Felt', adjectives: ['Stylish'] },
                        { name: 'Homburg', material: 'Quality Felt' }
                    ],
                    footwear: [
                        { name: 'Dress Shoes', material: 'Polished Leather' },
                        { name: 'Oxford Shoes', material: 'Quality Leather' }
                    ],
                    belts: [
                        { name: 'Leather Belt', material: 'Quality Leather' }
                    ],
                    accessories: [
                        { name: 'Wristwatch', material: 'Steel and Glass' },
                        { name: 'Tie Clip', material: 'Silver' }
                    ],
                    palette: MODERN_COLORS
                },
                Female: {
                    garments: [
                        { name: 'Day Dress', material: 'Rayon', adjectives: ['Fashionable'] },
                        { name: 'Suit', material: 'Wool Gabardine' },
                        { name: 'Cocktail Dress', material: 'Silk Crepe' }
                    ],
                    headgear: [
                        { name: 'Cloche Hat', material: 'Felt', adjectives: ['Stylish'] },
                        { name: 'Pillbox Hat', material: 'Velvet' }
                    ],
                    footwear: [
                        { name: 'T-bar Shoes', material: 'Leather', adjectives: ['Heeled'] },
                        { name: 'Court Shoes', material: 'Patent Leather' }
                    ],
                    belts: [
                        { name: 'Leather Belt', material: 'Fine Leather' }
                    ],
                    accessories: [
                        { name: 'Pearl Necklace', material: 'Cultured Pearls' },
                        { name: 'Cocktail Ring', material: 'Gold and Gems' }
                    ],
                    palette: MODERN_COLORS
                }
            },
            wealthy: {
                Male: {
                    garments: [
                        { name: 'Savile Row Suit', material: 'Finest Wool', adjectives: ['Bespoke'] },
                        { name: 'Evening Wear', material: 'Silk and Wool' },
                        { name: 'Smoking Jacket', material: 'Velvet', adjectives: ['Quilted'] }
                    ],
                    headgear: [
                        { name: 'Silk Hat', material: 'Finest Silk' },
                        { name: 'Homburg', material: 'Beaver Felt' }
                    ],
                    footwear: [
                        { name: 'Handmade Shoes', material: 'Italian Leather' },
                        { name: 'Patent Pumps', material: 'Patent Leather' }
                    ],
                    belts: [
                        { name: 'Alligator Belt', material: 'Alligator Leather' }
                    ],
                    accessories: [
                        { name: 'Gold Watch', material: 'Gold and Platinum', adjectives: ['Swiss'] },
                        { name: 'Diamond Cufflinks', material: 'Diamonds and Platinum' }
                    ],
                    palette: MODERN_COLORS
                },
                Female: {
                    garments: [
                        { name: 'Couture Gown', material: 'Silk and Lace', adjectives: ['Parisian'] },
                        { name: 'Cocktail Dress', material: 'Beaded Silk' },
                        { name: 'Fur Coat', material: 'Mink and Sable' }
                    ],
                    headgear: [
                        { name: 'Diamond Tiara', material: 'Diamonds and Platinum' },
                        { name: 'Feathered Headdress', material: 'Ostrich and Gems' }
                    ],
                    footwear: [
                        { name: 'Satin Slippers', material: 'Silk Satin', adjectives: ['Jeweled'] },
                        { name: 'Evening Boots', material: 'Kid and Silk' }
                    ],
                    belts: [
                        { name: 'Jeweled Belt', material: 'Gold and Gems' }
                    ],
                    accessories: [
                        { name: 'Diamond Parure', material: 'Diamonds and Gold', adjectives: ['Complete'] },
                        { name: 'Emerald Necklace', material: 'Emeralds and Platinum' }
                    ],
                    palette: MODERN_COLORS
                }
            }
        }
    },

    // EAST ASIAN CULTURAL ZONE
    EAST_ASIAN: {
        [HistoricalEra.PREHISTORY]: {
            poor: {
                Male: {
                    garments: [
                        { name: 'Hemp Robe', material: 'Rough Hemp', adjectives: ['Simple'] },
                        { name: 'Hide Wrap', material: 'Animal Hide' },
                        { name: 'Grass Cloak', material: 'Woven Grass', adjectives: ['Rain'] }
                    ],
                    headgear: [
                        { name: 'Douli', material: 'Bamboo Strips', adjectives: ['Conical'] },
                        { name: 'None', material: 'None' }
                    ],
                    footwear: [
                        { name: 'Straw Sandals', material: 'Woven Straw' },
                        { name: 'Barefoot', material: 'None' }
                    ],
                    belts: [
                        { name: 'Plant Cord', material: 'Twisted Fiber' }
                    ],
                    accessories: [
                        { name: 'Jade Pendant', material: 'River Jade', adjectives: ['Rough'] },
                        { name: 'Bone Ornament', material: 'Carved Bone' }
                    ],
                    palette: PREHISTORIC_COLORS
                },
                Female: {
                    garments: [
                        { name: 'Hemp Dress', material: 'Coarse Hemp' },
                        { name: 'Hide Cloak', material: 'Animal Fur', adjectives: ['Warm'] }
                    ],
                    headgear: [
                        { name: 'Fiber Hood', material: 'Plant Fiber' },
                        { name: 'None', material: 'None' }
                    ],
                    footwear: [
                        { name: 'Woven Slippers', material: 'Plant Fiber' }
                    ],
                    belts: [
                        { name: 'Braided Cord', material: 'Hemp', adjectives: ['Braided'] }
                    ],
                    accessories: [
                        { name: 'Shell Necklace', material: 'River Shells' },
                        { name: 'Wooden Comb', material: 'Carved Wood' }
                    ],
                    palette: PREHISTORIC_COLORS
                }
            }
        },
        [HistoricalEra.ANTIQUITY]: {
            poor: {
                Male: {
                    garments: [
                        { name: 'Hemp Robe', material: 'Rough Hemp', adjectives: ['Undyed'] },
                        { name: 'Simple Hanfu', material: 'Coarse Silk' },
                        { name: 'Peasant Tunic', material: 'Ramie', adjectives: ['Plain'] }
                    ],
                    headgear: [
                        { name: 'Futou', material: 'Hemp Cloth', adjectives: ['Wrapped'] },
                        { name: 'Li', material: 'Rice Straw', adjectives: ['Wide-brimmed'] },
                        { name: 'None', material: 'None' }
                    ],
                    footwear: [
                        { name: 'Straw Shoes', material: 'Woven Straw' },
                        { name: 'Hemp Sandals', material: 'Hemp Cloth' }
                    ],
                    belts: [
                        { name: 'Cord Sash', material: 'Hemp Cord' }
                    ],
                    accessories: [
                        { name: 'Wooden Pendant', material: 'Carved Wood' },
                        { name: 'Clay Beads', material: 'Fired Clay' }
                    ],
                    palette: EAST_ASIAN_COLORS
                },
                Female: {
                    garments: [
                        { name: 'Simple Hanfu', material: 'Hemp', adjectives: ['Plain'] },
                        { name: 'Peasant Robe', material: 'Rough Silk' }
                    ],
                    headgear: [
                        { name: 'Simple Hairpin', material: 'Wood' },
                        { name: 'None', material: 'None' }
                    ],
                    footwear: [
                        { name: 'Hemp Shoes', material: 'Hemp Cloth' }
                    ],
                    belts: [
                        { name: 'Silk Cord', material: 'Rough Silk' }
                    ],
                    accessories: [
                        { name: 'Jade Hairpin', material: 'Simple Jade' },
                        { name: 'Wooden Comb', material: 'Bamboo' }
                    ],
                    palette: EAST_ASIAN_COLORS
                }
            },
            common: {
                Male: {
                    garments: [
                        { name: 'Scholar Hanfu', material: 'Fine Silk' },
                        { name: 'Merchant Robe', material: 'Quality Cotton' },
                        { name: 'Court Dress', material: 'Brocade', adjectives: ['Patterned'] }
                    ],
                    headgear: [
                        { name: 'Scholar Cap', material: 'Silk', adjectives: ['Black'] },
                        { name: 'Official Hat', material: 'Felt and Silk' }
                    ],
                    footwear: [
                        { name: 'Silk Shoes', material: 'Embroidered Silk' },
                        { name: 'Leather Boots', material: 'Good Leather' }
                    ],
                    belts: [
                        { name: 'Silk Sash', material: 'Woven Silk' },
                        { name: 'Jade Belt', material: 'Jade and Silk' }
                    ],
                    accessories: [
                        { name: 'Scholar Pendant', material: 'Jade', adjectives: ['Carved'] },
                        { name: 'Bronze Mirror', material: 'Polished Bronze' }
                    ],
                    palette: EAST_ASIAN_COLORS
                },
                Female: {
                    garments: [
                        { name: 'Elegant Hanfu', material: 'Fine Silk', adjectives: ['Flowing'] },
                        { name: 'Court Dress', material: 'Silk Brocade' }
                    ],
                    headgear: [
                        { name: 'Phoenix Crown', material: 'Gold and Jade', adjectives: ['Delicate'] },
                        { name: 'Silk Hairpiece', material: 'Embroidered Silk' }
                    ],
                    footwear: [
                        { name: 'Embroidered Shoes', material: 'Silk', adjectives: ['Pointed'] },
                        { name: 'Lotus Shoes', material: 'Silk and Gold', adjectives: ['Tiny'] }
                    ],
                    belts: [
                        { name: 'Brocade Sash', material: 'Gold Brocade' }
                    ],
                    accessories: [
                        { name: 'Pearl Hairpin', material: 'Pearls and Gold' },
                        { name: 'Jade Bracelet', material: 'Carved Jade' }
                    ],
                    palette: EAST_ASIAN_COLORS
                }
            },
            wealthy: {
                Male: {
                    garments: [
                        { name: 'Imperial Robe', material: 'Dragon Silk', adjectives: ['Golden'] },
                        { name: 'Court Dress', material: 'Five-claw Dragon', adjectives: ['Imperial'] }
                    ],
                    headgear: [
                        { name: 'Dragon Crown', material: 'Gold and Jade', adjectives: ['Imperial'] }
                    ],
                    footwear: [
                        { name: 'Dragon Boots', material: 'Silk and Gold', adjectives: ['Jeweled'] }
                    ],
                    belts: [
                        { name: 'Imperial Belt', material: 'Gold and Jade', adjectives: ['Dragon'] }
                    ],
                    accessories: [
                        { name: 'Imperial Seal', material: 'White Jade', adjectives: ['Sacred'] },
                        { name: 'Dragon Ring', material: 'Gold and Ruby' }
                    ],
                    palette: EAST_ASIAN_COLORS
                },
                Female: {
                    garments: [
                        { name: 'Phoenix Robe', material: 'Phoenix Silk', adjectives: ['Imperial'] },
                        { name: 'Empress Dress', material: 'Silk and Pearls' }
                    ],
                    headgear: [
                        { name: 'Phoenix Crown', material: 'Gold and Pearls', adjectives: ['Imperial'] }
                    ],
                    footwear: [
                        { name: 'Golden Slippers', material: 'Gold and Silk' }
                    ],
                    belts: [
                        { name: 'Pearl Sash', material: 'Pearls and Gold' }
                    ],
                    accessories: [
                        { name: 'Imperial Hairpin', material: 'Gold and Jade' },
                        { name: 'Empress Ring', material: 'Gold and Emerald' }
                    ],
                    palette: EAST_ASIAN_COLORS
                }
            }
        },
        [HistoricalEra.MEDIEVAL]: {
            poor: {
                Male: {
                    garments: [
                        { name: 'Hemp Robe', material: 'Rough Hemp' },
                        { name: 'Cotton Jacket', material: 'Coarse Cotton' },
                        { name: 'Peasant Tunic', material: 'Ramie' }
                    ],
                    headgear: [
                        { name: 'Sugegasa', material: 'Sedge Grass', adjectives: ['Conical'] },
                        { name: 'Zukin', material: 'Rough Cotton', adjectives: ['Tied'] }
                    ],
                    footwear: [
                        { name: 'Straw Sandals', material: 'Woven Straw' },
                        { name: 'Hemp Shoes', material: 'Hemp Cloth' }
                    ],
                    belts: [
                        { name: 'Hemp Cord', material: 'Braided Hemp' }
                    ],
                    accessories: [
                        { name: 'Prayer Beads', material: 'Wood', adjectives: ['Buddhist'] },
                        { name: 'Iron Charm', material: 'Rough Iron' }
                    ],
                    palette: EAST_ASIAN_COLORS
                },
                Female: {
                    garments: [
                        { name: 'Cotton Dress', material: 'Plain Cotton' },
                        { name: 'Hemp Jacket', material: 'Rough Hemp' },
                        { name: 'Work Robe', material: 'Ramie' }
                    ],
                    headgear: [
                        { name: 'Cotton Scarf', material: 'Plain Cotton' },
                        { name: 'None', material: 'None' }
                    ],
                    footwear: [
                        { name: 'Cloth Slippers', material: 'Cotton', adjectives: ['Soft'] },
                        { name: 'Straw Shoes', material: 'Woven Straw' }
                    ],
                    belts: [
                        { name: 'Cotton Sash', material: 'Woven Cotton' }
                    ],
                    accessories: [
                        { name: 'Wooden Comb', material: 'Bamboo' },
                        { name: 'Clay Hairpin', material: 'Fired Clay' }
                    ],
                    palette: EAST_ASIAN_COLORS
                }
            },
            common: {
                Male: {
                    garments: [
                        { name: 'Silk Changshan', material: 'Quality Silk' },
                        { name: 'Brocade Jacket', material: 'Silk Brocade' },
                        { name: 'Scholar Robe', material: 'Fine Cotton', adjectives: ['Academic'] }
                    ],
                    headgear: [
                        { name: 'Scholar Hat', material: 'Black Silk' },
                        { name: 'Official Cap', material: 'Silk and Felt' }
                    ],
                    footwear: [
                        { name: 'Leather Boots', material: 'Quality Leather' },
                        { name: 'Silk Shoes', material: 'Embroidered Silk' }
                    ],
                    belts: [
                        { name: 'Silk Sash', material: 'Woven Silk' },
                        { name: 'Jade Belt', material: 'Jade Plaques' }
                    ],
                    accessories: [
                        { name: 'Ring', material: 'Stone' },
                        { name: 'Scholar Fan', material: 'Bamboo' }
                    ],
                    palette: EAST_ASIAN_COLORS
                },
                Female: {
                    garments: [
                        { name: 'Silk Hanfu', material: 'Fine Silk', adjectives: ['Flowing'] },
                        { name: 'Brocade Robe', material: 'Silk Brocade' },
                        { name: 'Court Dress', material: 'Embroidered Silk' }
                    ],
                    headgear: [
                        { name: 'Silk Hairpiece', material: 'Embroidered Silk' },
                        { name: 'Pearl Ornament', material: 'Pearls and Silk' }
                    ],
                    footwear: [
                        { name: 'Embroidered Slippers', material: 'Silk', adjectives: ['Delicate'] },
                        { name: 'Lotus Shoes', material: 'Silk and Brocade' }
                    ],
                    belts: [
                        { name: 'Embroidered Sash', material: 'Silk', adjectives: ['Colorful'] }
                    ],
                    accessories: [
                        { name: 'Jade Bracelet', material: 'Carved Jade' },
                        { name: 'Pearl Hairpin', material: 'Pearls and Gold' }
                    ],
                    palette: EAST_ASIAN_COLORS
                }
            },
            wealthy: {
                Male: {
                    garments: [
                        { name: 'Imperial Robe', material: 'Dragon Silk', adjectives: ['Five-claw'] },
                        { name: 'Noble Changshan', material: 'Gold Brocade' },
                        { name: 'Court Dress', material: 'Silk and Gold Thread' }
                    ],
                    headgear: [
                        { name: 'Dragon Crown', material: 'Gold and Jade' },
                        { name: 'Noble Hat', material: 'Silk and Gems' }
                    ],
                    footwear: [
                        { name: 'Dragon Boots', material: 'Silk' },
                        { name: 'Embroidered Shoes', material: 'Silk' }
                    ],
                    belts: [
                        { name: 'Dragon Belt', material: 'Jade', adjectives: ['Imperial'] }
                    ],
                    accessories: [
                        { name: 'Imperial Seal', material: 'White Jade', adjectives: ['Carved'] },
                        { name: 'Dragon Ring', material: 'Gold and Ruby' }
                    ],
                    palette: EAST_ASIAN_COLORS
                },
                Female: {
                    garments: [
                        { name: 'Phoenix Robe', material: 'Phoenix Silk', adjectives: ['Imperial'] },
                        { name: 'Hanfu', material: 'Brocade' },
                        { name: 'Gown', material: 'Silk' }
                    ],
                    headgear: [
                        { name: 'Phoenix Crown', material: 'Gold and Pearls', adjectives: ['Elaborate'] },
                        { name: 'Imperial Headdress', material: 'Gold and Jade' }
                    ],
                    footwear: [
                        { name: 'Phoenix Slippers', material: 'ilk' },
                        { name: 'Embroidered Shoes', material: 'Silk' }
                    ],
                    belts: [
                        { name: 'Sash', material: 'Silk' }
                    ],
                    accessories: [
                        { name: 'Imperial Hairpin', material: 'Gold' },
                        { name: 'Phoenix Earrings', material: 'Pearl' }
                    ],
                    palette: EAST_ASIAN_COLORS
                }
            }
        },
        [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
            poor: {
                Male: {
                    garments: [
                        { name: 'Cotton Robe', material: 'Plain Cotton' },
                        { name: 'Hemp Jacket', material: 'Rough Hemp' },
                        { name: 'Peasant Tunic', material: 'Coarse Linen' }
                    ],
                    headgear: [
                        { name: 'Bamboo Hat', material: 'Woven Bamboo' },
                        { name: 'Cotton Cap', material: 'Plain Cotton' }
                    ],
                    footwear: [
                        { name: 'Straw Sandals', material: 'Rice Straw' },
                        { name: 'Cloth Shoes', material: 'Cotton Canvas' }
                    ],
                    belts: [
                        { name: 'Hemp Cord', material: 'Twisted Hemp' }
                    ],
                    accessories: [
                        { name: 'Wooden Pendant', material: 'Carved Wood' },
                        { name: 'Iron Ring', material: 'Simple Iron' }
                    ],
                    palette: EAST_ASIAN_COLORS
                },
                Female: {
                    garments: [
                        { name: 'Cotton Dress', material: 'Plain Cotton' },
                        { name: 'Work Jacket', material: 'Hemp' },
                        { name: 'Simple Robe', material: 'Ramie' }
                    ],
                    headgear: [
                        { name: 'Cotton Scarf', material: 'Woven Cotton' },
                        { name: 'None', material: 'None' }
                    ],
                    footwear: [
                        { name: 'Cloth Slippers', material: 'Cotton' },
                        { name: 'Straw Shoes', material: 'Woven Straw' }
                    ],
                    belts: [
                        { name: 'Cotton Sash', material: 'Woven Cotton' }
                    ],
                    accessories: [
                        { name: 'Wooden Comb', material: 'Bamboo' },
                        { name: 'Clay Ornament', material: 'Fired Clay' }
                    ],
                    palette: EAST_ASIAN_COLORS
                }
            },
            common: {
                Male: {
                    garments: [
                        { name: 'Silk Robe', material: 'Quality Silk' },
                        { name: 'Merchant Jacket', material: 'Cotton Brocade' },
                        { name: 'Scholar Gown', material: 'Fine Linen' }
                    ],
                    headgear: [
                        { name: 'Silk Cap', material: 'Embroidered Silk' },
                        { name: 'Scholar Hat', material: 'Black Felt' }
                    ],
                    footwear: [
                        { name: 'Leather Shoes', material: 'Quality Leather' },
                        { name: 'Silk Boots', material: 'Embroidered Silk' }
                    ],
                    belts: [
                        { name: 'Silk Sash', material: 'Woven Silk' },
                        { name: 'Leather Belt', material: 'Tooled Leather' }
                    ],
                    accessories: [
                        { name: 'Jade Pendant', material: 'Carved Jade' },
                        { name: 'Silver Ring', material: 'Engraved Silver' }
                    ],
                    palette: EAST_ASIAN_COLORS
                },
                Female: {
                    garments: [
                        { name: 'Silk Dress', material: 'Fine Silk' },
                        { name: 'Brocade Robe', material: 'Silk Brocade' },
                        { name: 'Court Gown', material: 'Embroidered Cotton' }
                    ],
                    headgear: [
                        { name: 'Silk Headpiece', material: 'Embroidered Silk' },
                        { name: 'Pearl Ornament', material: 'Pearls and Silk' }
                    ],
                    footwear: [
                        { name: 'Embroidered Shoes', material: 'Silk' },
                        { name: 'Satin Slippers', material: 'Silk Satin' }
                    ],
                    belts: [
                        { name: 'Brocade Sash', material: 'Silk Brocade' }
                    ],
                    accessories: [
                        { name: 'Jade Bracelet', material: 'Carved Jade' },
                        { name: 'Gold Hairpin', material: 'Gold and Silk' }
                    ],
                    palette: EAST_ASIAN_COLORS
                }
            },
            wealthy: {
                Male: {
                    garments: [
                        { name: 'Imperial Robe', material: 'Dragon Silk', adjectives: ['Golden'] },
                        { name: 'Noble Jacket', material: 'Gold Brocade' },
                        { name: 'Court Dress', material: 'Silk and Gold' }
                    ],
                    headgear: [
                        { name: 'Golden Crown', material: 'Gold and Jade' },
                        { name: 'Noble Cap', material: 'Silk and Gems' }
                    ],
                    footwear: [
                        { name: 'Golden Boots', material: 'Silk and Gold' },
                        { name: 'Jeweled Shoes', material: 'Silk and Pearls' }
                    ],
                    belts: [
                        { name: 'Golden Belt', material: 'Gold and Jade' }
                    ],
                    accessories: [
                        { name: 'Imperial Ring', material: 'Gold and Ruby' },
                        { name: 'Jade Seal', material: 'White Jade' }
                    ],
                    palette: EAST_ASIAN_COLORS
                },
                Female: {
                    garments: [
                        { name: 'Phoenix Gown', material: 'Phoenix Silk' },
                        { name: 'Imperial Robe', material: 'Gold Brocade' },
                        { name: 'Court Dress', material: 'Silk and Pearls' }
                    ],
                    headgear: [
                        { name: 'Phoenix Crown', material: 'Gold and Pearls' },
                        { name: 'Imperial Headdress', material: 'Gold and Jade' }
                    ],
                    footwear: [
                        { name: 'Golden Slippers', material: 'Gold and Silk' },
                        { name: 'Phoenix Shoes', material: 'Silk and Gems' }
                    ],
                    belts: [
                        { name: 'Pearl Girdle', material: 'Pearls and Gold' }
                    ],
                    accessories: [
                        { name: 'Imperial Hairpin', material: 'Gold and Jade' },
                        { name: 'Diamond Earrings', material: 'Diamonds and Gold' }
                    ],
                    palette: EAST_ASIAN_COLORS
                }
            }
        },
        [HistoricalEra.MODERN_ERA]: {
            poor: {
                Male: {
                    garments: [
                        { name: 'Cotton Tunic', material: 'Plain Cotton' },
                        { name: 'Work Jacket', material: 'Canvas' },
                        { name: 'Peasant Robe', material: 'Rough Cotton' }
                    ],
                    headgear: [
                        { name: 'Mao Cap', material: 'Faded Cotton', adjectives: ['Five-pointed'] },
                        { name: 'Bamboo Dou Li', material: 'Split Bamboo', adjectives: ['Peaked'] }
                    ],
                    footwear: [
                        { name: 'Canvas Shoes', material: 'Cotton Canvas' },
                        { name: 'Cloth Boots', material: 'Heavy Cotton' }
                    ],
                    belts: [
                        { name: 'Rope Belt', material: 'Hemp Rope' }
                    ],
                    accessories: [
                        { name: 'Wooden Pendant', material: 'Carved Wood' },
                        { name: 'None', material: 'None' }
                    ],
                    palette: EAST_ASIAN_COLORS
                },
                Female: {
                    garments: [
                        { name: 'Cotton Dress', material: 'Plain Cotton' },
                        { name: 'Work Blouse', material: 'Rough Cotton' },
                        { name: 'Simple Robe', material: 'Faded Cotton' }
                    ],
                    headgear: [
                        { name: 'Cotton Scarf', material: 'Plain Cotton' },
                        { name: 'None', material: 'None' }
                    ],
                    footwear: [
                        { name: 'Cloth Slippers', material: 'Cotton' },
                        { name: 'Canvas Shoes', material: 'Cotton Canvas' }
                    ],
                    belts: [
                        { name: 'Cotton Sash', material: 'Woven Cotton' }
                    ],
                    accessories: [
                        { name: 'Simple Ring', material: 'Base Metal' },
                        { name: 'None', material: 'None' }
                    ],
                    palette: EAST_ASIAN_COLORS
                }
            },
            common: {
                Male: {
                    garments: [
                        { name: 'Western Suit', material: 'Wool' },
                        { name: 'Changshan', material: 'Quality Cotton' },
                        { name: 'Zhongshan Suit', material: 'Cotton Twill' }
                    ],
                    headgear: [
                        { name: 'Fedora', material: 'Felt' },
                        { name: 'Zhongshan Cap', material: 'Cotton' }
                    ],
                    footwear: [
                        { name: 'Leather Shoes', material: 'Black Leather' },
                        { name: 'Cotton Shoes', material: 'Quilted Cotton' }
                    ],
                    belts: [
                        { name: 'Leather Belt', material: 'Quality Leather' }
                    ],
                    accessories: [
                        { name: 'Pocket Watch', material: 'Silver' },
                        { name: 'Fountain Pen', material: 'Gold and Steel' }
                    ],
                    palette: EAST_ASIAN_COLORS
                },
                Female: {
                    garments: [
                        { name: 'Qipao', material: 'Silk', adjectives: ['Fitted'] },
                        { name: 'Western Dress', material: 'Cotton' },
                        { name: 'Jacket', material: 'Silk Brocade' }
                    ],
                    headgear: [
                        { name: 'Silk Scarf', material: 'Fine Silk' },
                        { name: 'Cloche Hat', material: 'Felt' }
                    ],
                    footwear: [
                        { name: 'High Heels', material: 'Leather' },
                        { name: 'Silk Slippers', material: 'Embroidered Silk' }
                    ],
                    belts: [
                        { name: 'Silk Sash', material: 'Embroidered Silk' }
                    ],
                    accessories: [
                        { name: 'Pearl Necklace', material: 'Cultured Pearls' },
                        { name: 'Jade Bracelet', material: 'Carved Jade' }
                    ],
                    palette: EAST_ASIAN_COLORS
                }
            },
            wealthy: {
                Male: {
                    garments: [
                        { name: 'Tailored Suit', material: 'Fine Wool', adjectives: ['Western'] },
                        { name: 'Silk Changshan', material: 'Pure Silk' },
                        { name: 'Court Robe', material: 'Silk Brocade' }
                    ],
                    headgear: [
                        { name: 'Silk Hat', material: 'Finest Silk' },
                        { name: 'Brocade Cap', material: 'Gold Brocade' }
                    ],
                    footwear: [
                        { name: 'Patent Shoes', material: 'Patent Leather' },
                        { name: 'Silk Boots', material: 'Embroidered Silk' }
                    ],
                    belts: [
                        { name: 'Gold Chain', material: 'Solid Gold' }
                    ],
                    accessories: [
                        { name: 'Gold Watch', material: 'Gold and Gems' },
                        { name: 'Jade Ring', material: 'Imperial Jade' }
                    ],
                    palette: EAST_ASIAN_COLORS
                },
                Female: {
                    garments: [
                        { name: 'Silk Qipao', material: 'Pure Silk', adjectives: ['Jeweled'] },
                        { name: 'Western Gown', material: 'Silk and Lace' },
                        { name: 'Brocade Jacket', material: 'Gold Brocade' }
                    ],
                    headgear: [
                        { name: 'Diamond Tiara', material: 'Diamonds and Platinum' },
                        { name: 'Silk Headdress', material: 'Embroidered Silk' }
                    ],
                    footwear: [
                        { name: 'Golden Slippers', material: 'Gold and Silk' },
                        { name: 'Phoenix Shoes', material: 'Silk and Gems' }
                    ],
                    belts: [
                        { name: 'Pearl Girdle', material: 'Pearls and Gold' }
                    ],
                    accessories: [
                        { name: 'Imperial Hairpin', material: 'Gold and Jade' },
                        { name: 'Diamond Earrings', material: 'Diamonds and Gold' }
                    ],
                    palette: EAST_ASIAN_COLORS
                }
            }
        }
    },

    // MIDDLE EASTERN AND NORTH AFRICAN
    MENA: {
        [HistoricalEra.PREHISTORY]: {
            poor: {
                Male: {
                    garments: [
                        { name: 'Hide Wrap', material: 'Goat Hide', adjectives: ['Simple'] },
                        { name: 'Linen Loincloth', material: 'Rough Linen' },
                        { name: 'Desert Cloak', material: 'Camel Hair', adjectives: ['Protective'] }
                    ],
                    headgear: [
                        { name: 'Head Wrap', material: 'Linen', adjectives: ['Sun-protection'] },
                        { name: 'None', material: 'None' }
                    ],
                    footwear: [
                        { name: 'Palm Sandals', material: 'Palm Fiber' },
                        { name: 'Barefoot', material: 'None' }
                    ],
                    belts: [
                        { name: 'Hemp Cord', material: 'Twisted Hemp' }
                    ],
                    accessories: [
                        { name: 'Stone Amulet', material: 'Carved Stone' },
                        { name: 'Shell Pendant', material: 'Desert Shell' }
                    ],
                    palette: MENA_COLORS
                },
                Female: {
                    garments: [
                        { name: 'Linen Dress', material: 'Rough Linen', adjectives: ['Simple'] },
                        { name: 'Hide Wrap', material: 'Sheep Hide' }
                    ],
                    headgear: [
                        { name: 'Linen Veil', material: 'Rough Linen' },
                        { name: 'None', material: 'None' }
                    ],
                    footwear: [
                        { name: 'Woven Sandals', material: 'Reed Fiber' }
                    ],
                    belts: [
                        { name: 'Fiber Cord', material: 'Plant Fiber' }
                    ],
                    accessories: [
                        { name: 'Clay Beads', material: 'Fired Clay' },
                        { name: 'Copper Ring', material: 'Native Copper' }
                    ],
                    palette: MENA_COLORS
                }
            }
        },
        [HistoricalEra.ANTIQUITY]: {
            poor: {
                Male: {
                    garments: [
                        { name: 'Linen Tunic', material: 'Coarse Linen', adjectives: ['Undyed'] },
                        { name: 'Desert Robe', material: 'Rough Wool' },
                        { name: 'Loincloth', material: 'Hemp' }
                    ],
                    headgear: [
                        { name: 'Head Cloth', material: 'Linen', adjectives: ['Simple'] },
                        { name: 'None', material: 'None' }
                    ],
                    footwear: [
                        { name: 'Reed Sandals', material: 'Woven Reed' },
                        { name: 'Leather Sandals', material: 'Raw Leather' }
                    ],
                    belts: [
                        { name: 'Hemp Belt', material: 'Braided Hemp' }
                    ],
                    accessories: [
                        { name: 'Copper Amulet', material: 'Beaten Copper' },
                        { name: 'Clay Seal', material: 'Inscribed Clay' }
                    ],
                    palette: MENA_COLORS
                },
                Female: {
                    garments: [
                        { name: 'Linen Dress', material: 'Plain Linen' },
                        { name: 'Cotton Robe', material: 'Rough Cotton' }
                    ],
                    headgear: [
                        { name: 'Linen Veil', material: 'White Linen' },
                        { name: 'None', material: 'None' }
                    ],
                    footwear: [
                        { name: 'Simple Sandals', material: 'Leather' }
                    ],
                    belts: [
                        { name: 'Cord Belt', material: 'Linen Cord' }
                    ],
                    accessories: [
                        { name: 'Bronze Bracelet', material: 'Simple Bronze' },
                        { name: 'Shell Necklace', material: 'Sea Shells' }
                    ],
                    palette: MENA_COLORS
                }
            },
            common: {
                Male: {
                    garments: [
                        { name: 'Linen Robe', material: 'Fine Linen', adjectives: ['White'] },
                        { name: 'Wool Cloak', material: 'Good Wool' },
                        { name: 'Persian Coat', material: 'Silk', adjectives: ['Imported'] }
                    ],
                    headgear: [
                        { name: 'Turban', material: 'Silk and Linen' },
                        { name: 'Persian Cap', material: 'Felt', adjectives: ['Conical'] }
                    ],
                    footwear: [
                        { name: 'Leather Sandals', material: 'Quality Leather' },
                        { name: 'Persian Shoes', material: 'Soft Leather', adjectives: ['Pointed'] }
                    ],
                    belts: [
                        { name: 'Leather Belt', material: 'Tooled Leather' },
                        { name: 'Silk Sash', material: 'Woven Silk' }
                    ],
                    accessories: [
                        { name: 'Silver Ring', material: 'Engraved Silver' },
                        { name: 'Curved Dagger', material: 'Steel and Silver' }
                    ],
                    palette: MENA_COLORS
                },
                Female: {
                    garments: [
                        { name: 'Silk Robe', material: 'Fine Silk' },
                        { name: 'Cotton Dress', material: 'Quality Cotton' },
                        { name: 'Persian Gown', material: 'Embroidered Silk' }
                    ],
                    headgear: [
                        { name: 'Silk Veil', material: 'Embroidered Silk' },
                        { name: 'Jeweled Headband', material: 'Silver and Gems' }
                    ],
                    footwear: [
                        { name: 'Silk Slippers', material: 'Embroidered Silk' },
                        { name: 'Beaded Sandals', material: 'Leather and Beads' }
                    ],
                    belts: [
                        { name: 'Chain Belt', material: 'Silver Links' },
                        { name: 'Embroidered Sash', material: 'Silk' }
                    ],
                    accessories: [
                        { name: 'Gold Earrings', material: 'Gold and Pearls' },
                        { name: 'Silver Bracelet', material: 'Engraved Silver' }
                    ],
                    palette: MENA_COLORS
                }
            },
            wealthy: {
                Male: {
                    garments: [
                        { name: 'Royal Robe', material: 'Purple Silk', adjectives: ['Imperial'] },
                        { name: 'Persian Kaftan', material: 'Gold Brocade' },
                        { name: 'Pharaoh Dress', material: 'Linen and Gold' }
                    ],
                    headgear: [
                        { name: 'Golden Crown', material: 'Gold and Gems' },
                        { name: 'Royal Turban', material: 'Silk and Jewels' }
                    ],
                    footwear: [
                        { name: 'Golden Sandals', material: 'Gold and Leather' },
                        { name: 'Jeweled Slippers', material: 'Silk and Gems' }
                    ],
                    belts: [
                        { name: 'Golden Belt', material: 'Solid Gold', adjectives: ['Jeweled'] }
                    ],
                    accessories: [
                        { name: 'Royal Seal', material: 'Gold and Ruby' },
                        { name: 'Ceremonial Sword', material: 'Gold and Steel', adjectives: ['Jeweled'] }
                    ],
                    palette: MENA_COLORS
                },
                Female: {
                    garments: [
                        { name: 'Queen Robe', material: 'Gold Silk', adjectives: ['Jeweled'] },
                        { name: 'Persian Gown', material: 'Silk and Pearls' }
                    ],
                    headgear: [
                        { name: 'Royal Crown', material: 'Gold and Diamonds' },
                        { name: 'Jeweled Veil', material: 'Silk and Gems' }
                    ],
                    footwear: [
                        { name: 'Golden Slippers', material: 'Gold and Silk' }
                    ],
                    belts: [
                        { name: 'Jeweled Girdle', material: 'Gold and Gems' }
                    ],
                    accessories: [
                        { name: 'Diamond Necklace', material: 'Diamonds and Gold' },
                        { name: 'Royal Earrings', material: 'Rubies and Gold' }
                    ],
                    palette: MENA_COLORS
                }
            }
        },
        [HistoricalEra.MEDIEVAL]: {
            poor: {
                Male: {
                    garments: [{ name: 'Thobe', material: 'Cotton' }, { name: 'Robe', material: 'Wool' }],
                    headgear: [
                        { name: 'Keffiyeh', material: 'Cotton' }, 
                        { name: 'Turban', material: 'Linen' },
                        { name: 'Taqiyah', material: 'Cotton', adjectives: ['White'] }
                    ],
                    footwear: [{ name: 'Sandals', material: 'Leather' }],
                    belts: [{ name: 'Belt', material: 'Leather' }],
                    accessories: [{ name: 'Prayer Beads', material: 'Wood' }],
                    palette: MEDIEVAL_MENA_COLORS
                },
                Female: {
                    garments: [{ name: 'Abaya', material: 'Cotton' }, { name: 'Robe', material: 'Linen' }],
                    headgear: [
                        { name: 'Hijab', material: 'Cotton' },
                        { name: 'Niqab', material: 'Black Cotton' },
                        { name: 'None', material: 'None' }
                    ],
                    footwear: [{ name: 'Slippers', material: 'Leather' }],
                    belts: [{ name: 'Sash', material: 'Cotton' }],
                    accessories: [{ name: 'Bracelet', material: 'Silver' }],
                    palette: MEDIEVAL_MENA_COLORS
                }
            },
            wealthy: {
                Male: {
                    garments: [{ name: 'Kaftan', material: 'Silk Brocade', adjectives: ['Ornate'] }, { name: 'Robe', material: 'Cashmere' }],
                    headgear: [{ name: 'Turban', material: 'Silk and Gold', adjectives: ['Jeweled'] }],
                    footwear: [{ name: 'Slippers', material: 'Silk and Gold', adjectives: ['Jeweled'] }],
                    belts: [{ name: 'Belt', material: 'Gold and Gems' }],
                    accessories: [{ name: 'Dagger', material: 'Damascus Steel and Gold', adjectives: ['Ceremonial'] }],
                    palette: MEDIEVAL_MENA_COLORS
                },
                Female: {
                    garments: [{ name: 'Caftan', material: 'Silk and Gold', adjectives: ['Court'] }, { name: 'Veil', material: 'Silk and Pearls' }],
                    headgear: [{ name: 'Diadem', material: 'Gold and Gems' }],
                    footwear: [{ name: 'Slippers', material: 'Silk and Pearls' }],
                    belts: [{ name: 'Girdle', material: 'Pearls and Gold' }],
                    accessories: [{ name: 'Necklace', material: 'Gold and Emeralds' }],
                    palette: MEDIEVAL_MENA_COLORS
                }
            }
        },
        [HistoricalEra.INDUSTRIAL_ERA]: {
            common: {
                Male: {
                    garments: [{ name: 'Thobe', material: 'Fine Cotton' }, { name: 'Jacket', material: 'Wool', adjectives: ['Western-style'] }],
                    headgear: [
                        { name: 'Fez', material: 'Felt' }, 
                        { name: 'Keffiyeh', material: 'Cotton' },
                        { name: 'Taqiyah', material: 'White Cotton' }
                    ],
                    footwear: [{ name: 'Boots', material: 'Leather' }],
                    belts: [{ name: 'Belt', material: 'Leather' }],
                    accessories: [{ name: 'Watch', material: 'Gold', adjectives: ['Pocket'] }],
                    palette: INDUSTRIAL_MENA_COLORS
                },
                Female: {
                    garments: [{ name: 'Dress', material: 'Silk', adjectives: ['Ottoman-style'] }, { name: 'Jacket', material: 'Velvet' }],
                    headgear: [{ name: 'Veil', material: 'Silk' }],
                    footwear: [{ name: 'Slippers', material: 'Leather' }],
                    belts: [{ name: 'Sash', material: 'Silk' }],
                    accessories: [{ name: 'Earrings', material: 'Gold and Pearl' }],
                    palette: INDUSTRIAL_MENA_COLORS
                }
            }
        }
    
    },

   // OCEANIA CULTURAL ZONE
OCEANIA: {
    [HistoricalEra.PREHISTORY]: {
        poor: {
            Male: {
                garments: [
                    { name: 'Bark Cloth Wrap', material: 'Tapa Bark', adjectives: ['Simple'] },
                    { name: 'Grass Skirt', material: 'Woven Grass' },
                    { name: 'Fiber Loincloth', material: 'Plant Fiber' }
                ],
                headgear: [
                    { name: 'Feather Band', material: 'Bird Feathers' },
                    { name: 'None', material: 'None' }
                ],
                footwear: [
                    { name: 'Barefoot', material: 'None' }
                ],
                belts: [
                    { name: 'Vine Belt', material: 'Twisted Vine' }
                ],
                accessories: [
                    { name: 'Shell Necklace', material: 'Cowrie Shells' },
                    { name: 'Bone Pendant', material: 'Carved Bone' }
                ],
                palette: TROPICAL_COLORS
            },
            Female: {
                garments: [
                    { name: 'Tapa Wrap', material: 'Bark Cloth', adjectives: ['Dyed'] },
                    { name: 'Grass Skirt', material: 'Woven Grass' }
                ],
                headgear: [
                    { name: 'Flower Crown', material: 'Fresh Flowers' },
                    { name: 'None', material: 'None' }
                ],
                footwear: [
                    { name: 'Barefoot', material: 'None' }
                ],
                belts: [
                    { name: 'Fiber Cord', material: 'Braided Fiber' }
                ],
                accessories: [
                    { name: 'Shell Earrings', material: 'Small Shells' },
                    { name: 'Seed Bracelet', material: 'Plant Seeds' }
                ],
                palette: TROPICAL_COLORS
            }
        },
        common: {
            Male: {
                garments: [
                    { name: 'Decorated Tapa', material: 'Painted Bark Cloth' },
                    { name: 'Feather Cloak', material: 'Bird Feathers', adjectives: ['Ceremonial'] }
                ],
                headgear: [
                    { name: 'Feather Headdress', material: 'Tropical Bird Feathers' }
                ],
                footwear: [
                    { name: 'Barefoot', material: 'None' }
                ],
                belts: [
                    { name: 'Woven Belt', material: 'Dyed Fiber' }
                ],
                accessories: [
                    { name: 'Carved Pendant', material: 'Whale Bone' },
                    { name: 'Shell Armband', material: 'Polished Shells' }
                ],
                palette: TROPICAL_COLORS
            },
            Female: {
                garments: [
                    { name: 'Fine Tapa Dress', material: 'Decorated Bark Cloth' },
                    { name: 'Feather Cape', material: 'Soft Feathers' }
                ],
                headgear: [
                    { name: 'Shell Ornament', material: 'Mother of Pearl' }
                ],
                footwear: [
                    { name: 'Barefoot', material: 'None' }
                ],
                belts: [
                    { name: 'Beaded Belt', material: 'Shell Beads' }
                ],
                accessories: [
                    { name: 'Pearl Necklace', material: 'River Pearls' },
                    { name: 'Bone Comb', material: 'Carved Bone' }
                ],
                palette: TROPICAL_COLORS
            }
        },
        wealthy: {
            Male: {
                garments: [
                    { name: 'Chiefly Cloak', material: 'Red Feathers', adjectives: ['Sacred'] },
                    { name: 'Royal Tapa', material: 'Finest Bark Cloth', adjectives: ['Painted'] }
                ],
                headgear: [
                    { name: 'Chiefly Crown', material: 'Rare Feathers and Shells' }
                ],
                footwear: [
                    { name: 'Barefoot', material: 'None' }
                ],
                belts: [
                    { name: 'Sacred Belt', material: 'Whale Bone and Feathers' }
                ],
                accessories: [
                    { name: 'Jade Pendant', material: 'Greenstone', adjectives: ['Sacred'] },
                    { name: 'Chief Staff', material: 'Carved Wood and Shell' }
                ],
                palette: TROPICAL_COLORS
            },
            Female: {
                garments: [
                    { name: 'Royal Tapa Gown', material: 'Finest Painted Bark' },
                    { name: 'Feather Mantle', material: 'Sacred Bird Feathers' }
                ],
                headgear: [
                    { name: 'Pearl Crown', material: 'Pearls and Feathers' }
                ],
                footwear: [
                    { name: 'Barefoot', material: 'None' }
                ],
                belts: [
                    { name: 'Pearl Girdle', material: 'Woven Pearls' }
                ],
                accessories: [
                    { name: 'Jade Earrings', material: 'Carved Greenstone' },
                    { name: 'Whale Tooth Necklace', material: 'Carved Ivory' }
                ],
                palette: TROPICAL_COLORS
            }
        }
    },
    [HistoricalEra.ANTIQUITY]: {
        poor: {
            Male: {
                garments: [
                    { name: 'Tapa Wrap', material: 'Common Bark Cloth' },
                    { name: 'Fiber Skirt', material: 'Woven Plant Fiber' }
                ],
                headgear: [
                    { name: 'Leaf Band', material: 'Woven Leaves' },
                    { name: 'None', material: 'None' }
                ],
                footwear: [
                    { name: 'Barefoot', material: 'None' }
                ],
                belts: [
                    { name: 'Rope Belt', material: 'Coconut Fiber' }
                ],
                accessories: [
                    { name: 'Wood Pendant', material: 'Carved Wood' },
                    { name: 'Shell Ring', material: 'Common Shell' }
                ],
                palette: TROPICAL_COLORS
            },
            Female: {
                garments: [
                    { name: 'Simple Tapa', material: 'Plain Bark Cloth' },
                    { name: 'Fiber Dress', material: 'Woven Fiber' }
                ],
                headgear: [
                    { name: 'Flower Garland', material: 'Fresh Flowers' },
                    { name: 'None', material: 'None' }
                ],
                footwear: [
                    { name: 'Barefoot', material: 'None' }
                ],
                belts: [
                    { name: 'Braided Belt', material: 'Plant Fiber' }
                ],
                accessories: [
                    { name: 'Seed Necklace', material: 'Dried Seeds' },
                    { name: 'Shell Bracelet', material: 'Small Shells' }
                ],
                palette: TROPICAL_COLORS
            }
        },
        common: {
            Male: {
                garments: [
                    { name: 'Patterned Tapa', material: 'Dyed Bark Cloth' },
                    { name: 'Woven Sarong', material: 'Plant Fiber', adjectives: ['Colored'] }
                ],
                headgear: [
                    { name: 'Feather Band', material: 'Local Bird Feathers' }
                ],
                footwear: [
                    { name: 'Barefoot', material: 'None' }
                ],
                belts: [
                    { name: 'Decorated Belt', material: 'Dyed Fiber and Shells' }
                ],
                accessories: [
                    { name: 'Bone Carving', material: 'Fish Bone', adjectives: ['Intricate'] },
                    { name: 'Tooth Pendant', material: 'Shark Tooth' }
                ],
                palette: TROPICAL_COLORS
            },
            Female: {
                garments: [
                    { name: 'Decorated Dress', material: 'Painted Tapa' },
                    { name: 'Woven Top', material: 'Fine Fiber' }
                ],
                headgear: [
                    { name: 'Shell Headdress', material: 'Arranged Shells' }
                ],
                footwear: [
                    { name: 'Barefoot', material: 'None' }
                ],
                belts: [
                    { name: 'Shell Belt', material: 'Strung Shells' }
                ],
                accessories: [
                    { name: 'Mother of Pearl', material: 'Polished Shell' },
                    { name: 'Feather Earrings', material: 'Small Feathers' }
                ],
                palette: TROPICAL_COLORS
            }
        },
        wealthy: {
            Male: {
                garments: [
                    { name: 'Chiefly Robe', material: 'Finest Tapa', adjectives: ['Ceremonial'] },
                    { name: 'Feather Cape', material: 'Rare Bird Feathers' }
                ],
                headgear: [
                    { name: 'War Helmet', material: 'Carved Wood and Feathers' }
                ],
                footwear: [
                    { name: 'Barefoot', material: 'None' }
                ],
                belts: [
                    { name: 'Warrior Belt', material: 'Shark Skin and Bone' }
                ],
                accessories: [
                    { name: 'Greenstone Club', material: 'Polished Jade', adjectives: ['Ceremonial'] },
                    { name: 'Chief Necklace', material: 'Whale Tooth and Gold' }
                ],
                palette: TROPICAL_COLORS
            },
            Female: {
                garments: [
                    { name: 'Royal Dress', material: 'Finest Painted Tapa' },
                    { name: 'Feather Cloak', material: 'Yellow Feathers', adjectives: ['Sacred'] }
                ],
                headgear: [
                    { name: 'Noble Crown', material: 'Shells and Feathers' }
                ],
                footwear: [
                    { name: 'Barefoot', material: 'None' }
                ],
                belts: [
                    { name: 'Pearl Belt', material: 'Black Pearls' }
                ],
                accessories: [
                    { name: 'Jade Pendant', material: 'Carved Greenstone' },
                    { name: 'Gold Earrings', material: 'Traded Gold' }
                ],
                palette: TROPICAL_COLORS
            }
        }
    },
    [HistoricalEra.MEDIEVAL]: {
        poor: {
            Male: {
                garments: [
                    { name: 'Common Tapa', material: 'Bark Cloth' },
                    { name: 'Work Wrap', material: 'Rough Fiber' }
                ],
                headgear: [
                    { name: 'Sun Hat', material: 'Woven Palm' },
                    { name: 'None', material: 'None' }
                ],
                footwear: [
                    { name: 'Barefoot', material: 'None' }
                ],
                belts: [
                    { name: 'Cord Belt', material: 'Twisted Fiber' }
                ],
                accessories: [
                    { name: 'Fishing Hook', material: 'Bone', adjectives: ['Worn'] },
                    { name: 'Shell Charm', material: 'Common Shell' }
                ],
                palette: TROPICAL_COLORS
            },
            Female: {
                garments: [
                    { name: 'Work Dress', material: 'Plain Tapa' },
                    { name: 'Fiber Skirt', material: 'Grass and Fiber' }
                ],
                headgear: [
                    { name: 'Woven Band', material: 'Palm Fronds' },
                    { name: 'None', material: 'None' }
                ],
                footwear: [
                    { name: 'Barefoot', material: 'None' }
                ],
                belts: [
                    { name: 'Simple Cord', material: 'Plant Fiber' }
                ],
                accessories: [
                    { name: 'Clay Beads', material: 'Fired Clay' },
                    { name: 'Wooden Ring', material: 'Carved Wood' }
                ],
                palette: TROPICAL_COLORS
            }
        },
        common: {
            Male: {
                garments: [
                    { name: 'Warrior Tapa', material: 'Reinforced Bark Cloth' },
                    { name: 'Ceremonial Wrap', material: 'Decorated Tapa' }
                ],
                headgear: [
                    { name: 'Battle Helmet', material: 'Hardwood and Fiber' }
                ],
                footwear: [
                    { name: 'Barefoot', material: 'None' }
                ],
                belts: [
                    { name: 'War Belt', material: 'Woven Fiber and Bone' }
                ],
                accessories: [
                    { name: 'War Club', material: 'Carved Hardwood' },
                    { name: 'Ancestor Pendant', material: 'Carved Bone' }
                ],
                palette: TROPICAL_COLORS
            },
            Female: {
                garments: [
                    { name: 'Festival Dress', material: 'Fine Tapa', adjectives: ['Painted'] },
                    { name: 'Dance Skirt', material: 'Fiber and Shells' }
                ],
                headgear: [
                    { name: 'Flower Crown', material: 'Fresh Flowers and Shells' }
                ],
                footwear: [
                    { name: 'Barefoot', material: 'None' }
                ],
                belts: [
                    { name: 'Dance Belt', material: 'Shells and Seeds' }
                ],
                accessories: [
                    { name: 'Ankle Shells', material: 'Small Shells', adjectives: ['Musical'] },
                    { name: 'Feather Fan', material: 'Woven Feathers' }
                ],
                palette: TROPICAL_COLORS
            }
        },
        wealthy: {
            Male: {
                garments: [
                    { name: 'Royal Mantle', material: 'Feathers and Tapa', adjectives: ['Sacred'] },
                    { name: 'Chief Robe', material: 'Painted Bark and Gold' }
                ],
                headgear: [
                    { name: 'Crown of Power', material: 'Feathers and Jade' }
                ],
                footwear: [
                    { name: 'Barefoot', material: 'None' }
                ],
                belts: [
                    { name: 'Royal Belt', material: 'Whale Bone and Pearl' }
                ],
                accessories: [
                    { name: 'Sacred Staff', material: 'Carved Wood and Shell' },
                    { name: 'Royal Pendant', material: 'Greenstone and Gold' }
                ],
                palette: TROPICAL_COLORS
            },
            Female: {
                garments: [
                    { name: 'Queen Dress', material: 'Finest Tapa and Feathers' },
                    { name: 'Noble Cape', material: 'Yellow Feathers', adjectives: ['Divine'] }
                ],
                headgear: [
                    { name: 'Royal Headdress', material: 'Pearls and Rare Feathers' }
                ],
                footwear: [
                    { name: 'Barefoot', material: 'None' }
                ],
                belts: [
                    { name: 'Pearl Girdle', material: 'Black and White Pearls' }
                ],
                accessories: [
                    { name: 'Royal Necklace', material: 'Jade and Gold' },
                    { name: 'Sacred Earrings', material: 'Whale Ivory' }
                ],
                palette: TROPICAL_COLORS
            }
        }
    },
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
        poor: {
            Male: {
                garments: [
                    { name: 'Cotton Shirt', material: 'Rough Cotton', adjectives: ['Trade'] },
                    { name: 'Tapa Wrap', material: 'Local Bark Cloth' }
                ],
                headgear: [
                    { name: 'Lauhala Hat', material: 'Pandanus Leaves', adjectives: ['Plaited'] },
                    { name: 'None', material: 'None' }
                ],
                footwear: [
                    { name: 'Barefoot', material: 'None' }
                ],
                belts: [
                    { name: 'Rope Belt', material: 'Ship Rope' }
                ],
                accessories: [
                    { name: 'Iron Nail', material: 'Trade Iron', adjectives: ['Pendant'] },
                    { name: 'Glass Bead', material: 'Trade Glass' }
                ],
                palette: TROPICAL_COLORS
            },
            Female: {
                garments: [
                    { name: 'Cotton Dress', material: 'Trade Cotton' },
                    { name: 'Traditional Wrap', material: 'Bark Cloth' }
                ],
                headgear: [
                    { name: 'Cotton Scarf', material: 'Plain Cotton' },
                    { name: 'None', material: 'None' }
                ],
                footwear: [
                    { name: 'Barefoot', material: 'None' }
                ],
                belts: [
                    { name: 'Woven Belt', material: 'Mixed Fibers' }
                ],
                accessories: [
                    { name: 'Trade Beads', material: 'Venetian Glass' },
                    { name: 'Copper Ring', material: 'Trade Copper' }
                ],
                palette: TROPICAL_COLORS
            }
        },
        common: {
            Male: {
                garments: [
                    { name: 'Hybrid Shirt', material: 'Cotton and Tapa' },
                    { name: 'Sailor Pants', material: 'Canvas', adjectives: ['Adapted'] }
                ],
                headgear: [
                    { name: 'Felt Hat', material: 'Trade Felt' }
                ],
                footwear: [
                    { name: 'Barefoot', material: 'None' },
                    { name: 'Sandals', material: 'Woven Fiber' }
                ],
                belts: [
                    { name: 'Leather Belt', material: 'Trade Leather' }
                ],
                accessories: [
                    { name: 'Silver Cross', material: 'Trade Silver' },
                    { name: 'Traditional Carving', material: 'Local Wood' }
                ],
                palette: TROPICAL_COLORS
            },
            Female: {
                garments: [
                    { name: 'Mission Dress', material: 'Cotton Print' },
                    { name: 'Hybrid Gown', material: 'Silk and Tapa' }
                ],
                headgear: [
                    { name: 'Lace Veil', material: 'Trade Lace' },
                    { name: 'Flower Crown', material: 'Fresh Flowers' }
                ],
                footwear: [
                    { name: 'Barefoot', material: 'None' }
                ],
                belts: [
                    { name: 'Ribbon Belt', material: 'Silk Ribbon' }
                ],
                accessories: [
                    { name: 'Pearl Cross', material: 'Local Pearl and Silver' },
                    { name: 'Coral Beads', material: 'Red Coral' }
                ],
                palette: TROPICAL_COLORS
            }
        },
        wealthy: {
            Male: {
                garments: [
                    { name: 'European Coat', material: 'Fine Wool', adjectives: ['Imported'] },
                    { name: 'Chief Cloak', material: 'Feathers over Silk' }
                ],
                headgear: [
                    { name: 'Tricorn Hat', material: 'Felt and Feathers' }
                ],
                footwear: [
                    { name: 'Leather Shoes', material: 'European Leather' },
                    { name: 'Barefoot', material: 'None', adjectives: ['Ceremonial'] }
                ],
                belts: [
                    { name: 'Silver Belt', material: 'Imported Silver' }
                ],
                accessories: [
                    { name: 'Gold Watch', material: 'European Gold' },
                    { name: 'Jade Scepter', material: 'Local Jade and Gold' }
                ],
                palette: TROPICAL_COLORS
            },
            Female: {
                garments: [
                    { name: 'Silk Gown', material: 'Chinese Silk', adjectives: ['Adapted'] },
                    { name: 'Royal Tapa', material: 'Finest Bark Cloth over Silk' }
                ],
                headgear: [
                    { name: 'Pearl Tiara', material: 'Local Pearls and Gold' }
                ],
                footwear: [
                    { name: 'Silk Slippers', material: 'Imported Silk' },
                    { name: 'Barefoot', material: 'None', adjectives: ['Traditional'] }
                ],
                belts: [
                    { name: 'Gold Chain', material: 'Spanish Gold' }
                ],
                accessories: [
                    { name: 'Diamond Ring', material: 'European Diamond' },
                    { name: 'Jade Necklace', material: 'Greenstone and Gold' }
                ],
                palette: TROPICAL_COLORS
            }
        }
    },
    [HistoricalEra.INDUSTRIAL_ERA]: {
        poor: {
            Male: {
                garments: [
                    { name: 'Plantation Shirt', material: 'Cheap Cotton' },
                    { name: 'Work Shorts', material: 'Canvas' }
                ],
                headgear: [
                    { name: 'Straw Hat', material: 'Local Straw' },
                    { name: 'None', material: 'None' }
                ],
                footwear: [
                    { name: 'Barefoot', material: 'None' }
                ],
                belts: [
                    { name: 'Rope Belt', material: 'Sisal' }
                ],
                accessories: [
                    { name: 'Shell Charm', material: 'Local Shell' },
                    { name: 'None', material: 'None' }
                ],
                palette: TROPICAL_COLORS
            },
            Female: {
                garments: [
                    { name: 'Calico Dress', material: 'Printed Cotton' },
                    { name: 'Work Blouse', material: 'Plain Cotton' }
                ],
                headgear: [
                    { name: 'Head Wrap', material: 'Cotton Cloth' },
                    { name: 'None', material: 'None' }
                ],
                footwear: [
                    { name: 'Barefoot', material: 'None' }
                ],
                belts: [
                    { name: 'Cloth Belt', material: 'Cotton Strip' }
                ],
                accessories: [
                    { name: 'Wooden Cross', material: 'Carved Wood' },
                    { name: 'Seed Bracelet', material: 'Local Seeds' }
                ],
                palette: TROPICAL_COLORS
            }
        },
        common: {
            Male: {
                garments: [
                    { name: 'White Suit', material: 'Light Cotton', adjectives: ['Colonial'] },
                    { name: 'Aloha Shirt', material: 'Printed Cotton' }
                ],
                headgear: [
                    { name: 'Panama Hat', material: 'Woven Straw' },
                    { name: 'Pith Helmet', material: 'Cork and Cloth' }
                ],
                footwear: [
                    { name: 'Canvas Shoes', material: 'White Canvas' },
                    { name: 'Leather Sandals', material: 'Brown Leather' }
                ],
                belts: [
                    { name: 'Canvas Belt', material: 'Webbing' }
                ],
                accessories: [
                    { name: 'Pocket Watch', material: 'Silver' },
                    { name: 'Carved Walking Stick', material: 'Local Wood' }
                ],
                palette: TROPICAL_COLORS
            },
            Female: {
                garments: [
                    { name: 'Tea Dress', material: 'Light Cotton', adjectives: ['Floral'] },
                    { name: 'Holoku Gown', material: 'Cotton and Lace' }
                ],
                headgear: [
                    { name: 'Sun Hat', material: 'Straw and Ribbon' },
                    { name: 'Flower Lei', material: 'Fresh Flowers' }
                ],
                footwear: [
                    { name: 'Canvas Shoes', material: 'White Canvas' },
                    { name: 'Barefoot', material: 'None' }
                ],
                belts: [
                    { name: 'Ribbon Sash', material: 'Silk Ribbon' }
                ],
                accessories: [
                    { name: 'Pearl Necklace', material: 'Local Pearls' },
                    { name: 'Coral Brooch', material: 'Pink Coral' }
                ],
                palette: TROPICAL_COLORS
            }
        },
        wealthy: {
            Male: {
                garments: [
                    { name: 'Linen Suit', material: 'Fine Linen', adjectives: ['Tailored'] },
                    { name: 'Silk Shirt', material: 'Imported Silk' }
                ],
                headgear: [
                    { name: 'Boater Hat', material: 'Fine Straw' }
                ],
                footwear: [
                    { name: 'Oxford Shoes', material: 'White Leather' }
                ],
                belts: [
                    { name: 'Silk Belt', material: 'Woven Silk' }
                ],
                accessories: [
                    { name: 'Gold Watch', material: 'Gold and Glass' },
                    { name: 'Pearl Cufflinks', material: 'Black Pearl and Gold' }
                ],
                palette: TROPICAL_COLORS
            },
            Female: {
                garments: [
                    { name: 'Silk Gown', material: 'Imported Silk', adjectives: ['Beaded'] },
                    { name: 'Lace Dress', material: 'French Lace' }
                ],
                headgear: [
                    { name: 'Feathered Hat', material: 'Silk and Ostrich' }
                ],
                footwear: [
                    { name: 'Silk Shoes', material: 'White Silk' }
                ],
                belts: [
                    { name: 'Beaded Belt', material: 'Pearls and Silk' }
                ],
                accessories: [
                    { name: 'Diamond Necklace', material: 'Diamonds and Platinum' },
                    { name: 'Pearl Bracelet', material: 'South Sea Pearls' }
                ],
                palette: TROPICAL_COLORS
            }
        }
    },
    [HistoricalEra.MODERN_ERA]: {
        poor: {
            Male: {
                garments: [
                    { name: 'T-shirt', material: 'Cotton', adjectives: ['Faded'] },
                    { name: 'Board Shorts', material: 'Polyester' }
                ],
                headgear: [
                    { name: 'Baseball Cap', material: 'Cotton', adjectives: ['Worn'] },
                    { name: 'None', material: 'None' }
                ],
                footwear: [
                    { name: 'Flip Flops', material: 'Rubber' },
                    { name: 'Barefoot', material: 'None' }
                ],
                belts: [
                    { name: 'None', material: 'None' }
                ],
                accessories: [
                    { name: 'Shell Necklace', material: 'Local Shells' },
                    { name: 'None', material: 'None' }
                ],
                palette: MODERN_COLORS
            },
            Female: {
                garments: [
                    { name: 'Sundress', material: 'Cotton', adjectives: ['Simple'] },
                    { name: 'Tank Top', material: 'Cotton' }
                ],
                headgear: [
                    { name: 'Sun Visor', material: 'Woven Coconut Fronds', adjectives: ['Wide'] },
                    { name: 'None', material: 'None' }
                ],
                footwear: [
                    { name: 'Sandals', material: 'Rubber' },
                    { name: 'Barefoot', material: 'None' }
                ],
                belts: [
                    { name: 'None', material: 'None' }
                ],
                accessories: [
                    { name: 'Plastic Bracelet', material: 'Colored Plastic' },
                    { name: 'None', material: 'None' }
                ],
                palette: MODERN_COLORS
            }
        },
        common: {
            Male: {
                garments: [
                    { name: 'Aloha Shirt', material: 'Rayon', adjectives: ['Printed'] },
                    { name: 'Khaki Shorts', material: 'Cotton Twill' }
                ],
                headgear: [
                    { name: 'Panama Hat', material: 'Fine Straw' },
                    { name: 'Sunglasses', material: 'Plastic and Glass' }
                ],
                footwear: [
                    { name: 'Boat Shoes', material: 'Canvas and Rubber' },
                    { name: 'Leather Sandals', material: 'Leather' }
                ],
                belts: [
                    { name: 'Canvas Belt', material: 'Woven Canvas' }
                ],
                accessories: [
                    { name: 'Dive Watch', material: 'Steel and Rubber' },
                    { name: 'Wooden Bracelet', material: 'Local Wood' }
                ],
                palette: MODERN_COLORS
            },
            Female: {
                garments: [
                    { name: 'Resort Dress', material: 'Silk Blend', adjectives: ['Floral'] },
                    { name: 'Linen Blouse', material: 'Linen' }
                ],
                headgear: [
                    { name: 'Wide Brim Hat', material: 'Straw and Silk' },
                    { name: 'Designer Sunglasses', material: 'Acetate' }
                ],
                footwear: [
                    { name: 'Wedge Sandals', material: 'Cork and Leather' },
                    { name: 'Designer Flats', material: 'Leather' }
                ],
                belts: [
                    { name: 'Woven Belt', material: 'Leather and Fabric' }
                ],
                accessories: [
                    { name: 'Pearl Earrings', material: 'Cultured Pearls' },
                    { name: 'Beach Bag', material: 'Woven Straw' }
                ],
                palette: MODERN_COLORS
            }
        },
        wealthy: {
            Male: {
                garments: [
                    { name: 'Designer Shirt', material: 'Italian Linen' },
                    { name: 'Tailored Shorts', material: 'Fine Cotton' }
                ],
                headgear: [
                    { name: 'Designer Cap', material: 'Luxury Cotton' }
                ],
                footwear: [
                    { name: 'Designer Loafers', material: 'Italian Leather' }
                ],
                belts: [
                    { name: 'Designer Belt', material: 'Exotic Leather' }
                ],
                accessories: [
                    { name: 'Luxury Watch', material: 'Gold and Diamonds' },
                    { name: 'Platinum Ring', material: 'Platinum' }
                ],
                palette: MODERN_COLORS
            },
            Female: {
                garments: [
                    { name: 'Designer Dress', material: 'Silk Chiffon' },
                    { name: 'Resort Wear', material: 'Designer Fabric' }
                ],
                headgear: [
                    { name: 'Designer Hat', material: 'Fine Materials' }
                ],
                footwear: [
                    { name: 'Designer Heels', material: 'Exotic Leather' }
                ],
                belts: [
                    { name: 'Designer Belt', material: 'Luxury Leather' }
                ],
                accessories: [
                    { name: 'Diamond Jewelry', material: 'Diamonds and Platinum' },
                    { name: 'Designer Bag', material: 'Exotic Leather' }
                ],
                palette: MODERN_COLORS
            }
        }
    }
},

// SOUTH AMERICAN CULTURAL ZONE
SOUTH_AMERICAN: {
   [HistoricalEra.PREHISTORY]: {
       poor: {
           Male: {
               garments: [
                   { name: 'Hide Loincloth', material: 'Deer Hide' },
                   { name: 'Fur Cape', material: 'Llama Fur', adjectives: ['Warm'] },
                   { name: 'Bark Cloth Wrap', material: 'Tree Bark' }
               ],
               headgear: [
                   { name: 'Feather Band', material: 'Parrot Feathers' },
                   { name: 'None', material: 'None' }
               ],
               footwear: [
                   { name: 'Hide Moccasins', material: 'Soft Leather' },
                   { name: 'Barefoot', material: 'None' }
               ],
               belts: [
                   { name: 'Vine Belt', material: 'Twisted Vines' }
               ],
               accessories: [
                   { name: 'Bone Necklace', material: 'Animal Bones' },
                   { name: 'Stone Pendant', material: 'River Stone' }
               ],
               palette: TROPICAL_COLORS
           },
           Female: {
               garments: [
                   { name: 'Hide Skirt', material: 'Soft Leather' },
                   { name: 'Woven Top', material: 'Plant Fibers' }
               ],
               headgear: [
                   { name: 'Seed Headband', material: 'Woven Seeds' },
                   { name: 'None', material: 'None' }
               ],
               footwear: [
                   { name: 'Fiber Sandals', material: 'Woven Grass' },
                   { name: 'Barefoot', material: 'None' }
               ],
               belts: [
                   { name: 'Beaded Belt', material: 'Seeds and Fiber' }
               ],
               accessories: [
                   { name: 'Shell Earrings', material: 'River Shells' },
                   { name: 'Feather Bracelet', material: 'Small Feathers' }
               ],
               palette: TROPICAL_COLORS
           }
       },
       common: {
           Male: {
               garments: [
                   { name: 'Woven Tunic', material: 'Llama Wool' },
                   { name: 'Feather Cloak', material: 'Condor Feathers', adjectives: ['Ceremonial'] }
               ],
               headgear: [
                   { name: 'Feather Crown', material: 'Macaw Feathers' }
               ],
               footwear: [
                   { name: 'Leather Sandals', material: 'Tanned Hide' }
               ],
               belts: [
                   { name: 'Woven Belt', material: 'Colored Wool' }
               ],
               accessories: [
                   { name: 'Jade Pendant', material: 'Carved Jade' },
                   { name: 'Gold Earspools', material: 'Hammered Gold' }
               ],
               palette: TROPICAL_COLORS
           },
           Female: {
               garments: [
                   { name: 'Woven Dress', material: 'Fine Alpaca Wool' },
                   { name: 'Embroidered Shawl', material: 'Dyed Wool' }
               ],
               headgear: [
                   { name: 'Silver Headband', material: 'Beaten Silver' }
               ],
               footwear: [
                   { name: 'Woven Shoes', material: 'Plant Fiber' }
               ],
               belts: [
                   { name: 'Beaded Sash', material: 'Shells and Wool' }
               ],
               accessories: [
                   { name: 'Turquoise Necklace', material: 'Turquoise Beads' },
                   { name: 'Silver Bracelet', material: 'Hammered Silver' }
               ],
               palette: TROPICAL_COLORS
           }
       },
       wealthy: {
           Male: {
               garments: [
                   { name: 'Chieftain Robe', material: 'Vicuña Wool', adjectives: ['Rare'] },
                   { name: 'Jaguar Pelt', material: 'Jaguar Fur', adjectives: ['Sacred'] }
               ],
               headgear: [
                   { name: 'Gold Crown', material: 'Beaten Gold and Feathers' }
               ],
               footwear: [
                   { name: 'Decorated Sandals', material: 'Gold and Leather' }
               ],
               belts: [
                   { name: 'Gold Belt', material: 'Gold Plates' }
               ],
               accessories: [
                   { name: 'Emerald Pendant', material: 'Raw Emerald and Gold' },
                   { name: 'Ceremonial Staff', material: 'Carved Wood and Gold' }
               ],
               palette: TROPICAL_COLORS
           },
           Female: {
               garments: [
                   { name: 'Royal Dress', material: 'Finest Vicuña', adjectives: ['Embroidered'] },
                   { name: 'Feather Mantle', material: 'Quetzal Feathers' }
               ],
               headgear: [
                   { name: 'Gold Diadem', material: 'Gold and Emeralds' }
               ],
               footwear: [
                   { name: 'Gold Sandals', material: 'Leather and Gold' }
               ],
               belts: [
                   { name: 'Jeweled Belt', material: 'Gold and Gems' }
               ],
               accessories: [
                   { name: 'Emerald Earrings', material: 'Emerald and Gold' },
                   { name: 'Gold Arm Bands', material: 'Solid Gold' }
               ],
               palette: TROPICAL_COLORS
           }
       }
   },
   [HistoricalEra.ANTIQUITY]: {
       poor: {
           Male: {
               garments: [
                   { name: 'Cotton Tunic', material: 'Rough Cotton' },
                   { name: 'Wool Poncho', material: 'Coarse Llama Wool' }
               ],
               headgear: [
                   { name: 'Wool Cap', material: 'Knitted Wool' },
                   { name: 'None', material: 'None' }
               ],
               footwear: [
                   { name: 'Rope Sandals', material: 'Braided Grass' },
                   { name: 'Barefoot', material: 'None' }
               ],
               belts: [
                   { name: 'Rope Belt', material: 'Twisted Fiber' }
               ],
               accessories: [
                   { name: 'Clay Amulet', material: 'Fired Clay' },
                   { name: 'Wooden Flute', material: 'Carved Wood' }
               ],
               palette: TROPICAL_COLORS
           },
           Female: {
               garments: [
                   { name: 'Simple Dress', material: 'Cotton' },
                   { name: 'Wool Shawl', material: 'Plain Wool' }
               ],
               headgear: [
                   { name: 'Cloth Band', material: 'Woven Cotton' },
                   { name: 'None', material: 'None' }
               ],
               footwear: [
                   { name: 'Fiber Sandals', material: 'Woven Plant' },
                   { name: 'Barefoot', material: 'None' }
               ],
               belts: [
                   { name: 'Woven Belt', material: 'Plain Wool' }
               ],
               accessories: [
                   { name: 'Clay Beads', material: 'Painted Clay' },
                   { name: 'Bone Pin', material: 'Carved Bone' }
               ],
               palette: TROPICAL_COLORS
           }
       },
       common: {
           Male: {
               garments: [
                   { name: 'Inca Tunic', material: 'Fine Cotton', adjectives: ['Geometric'] },
                   { name: 'Alpaca Cloak', material: 'Alpaca Wool' }
               ],
               headgear: [
                   { name: 'Knitted Cap', material: 'Colored Wool', adjectives: ['Ear-flapped'] }
               ],
               footwear: [
                   { name: 'Leather Sandals', material: 'Llama Leather' }
               ],
               belts: [
                   { name: 'Woven Sash', material: 'Patterned Wool' }
               ],
               accessories: [
                   { name: 'Coca Pouch', material: 'Woven Wool' },
                   { name: 'Bronze Knife', material: 'Bronze and Wood' }
               ],
               palette: TROPICAL_COLORS
           },
           Female: {
               garments: [
                   { name: 'Wrapped Dress', material: 'Fine Wool', adjectives: ['Pinned'] },
                   { name: 'Decorated Shawl', material: 'Alpaca Wool' }
               ],
               headgear: [
                   { name: 'Cloth Headdress', material: 'Embroidered Cotton' }
               ],
               footwear: [
                   { name: 'Woven Slippers', material: 'Soft Wool' }
               ],
               belts: [
                   { name: 'Patterned Belt', material: 'Woven Designs' }
               ],
               accessories: [
                   { name: 'Silver Tupu', material: 'Silver Pin' },
                   { name: 'Shell Necklace', material: 'Spondylus Shells' }
               ],
               palette: TROPICAL_COLORS
           }
       },
       wealthy: {
           Male: {
               garments: [
                   { name: 'Royal Tunic', material: 'Cumbi Cloth', adjectives: ['Finest'] },
                   { name: 'Feathered Cape', material: 'Rare Feathers' }
               ],
               headgear: [
                   { name: 'Noble Crown', material: 'Gold and Feathers' }
               ],
               footwear: [
                   { name: 'Decorated Boots', material: 'Fine Leather and Gold' }
               ],
               belts: [
                   { name: 'Gold Belt', material: 'Gold Links' }
               ],
               accessories: [
                   { name: 'Gold Earspools', material: 'Heavy Gold' },
                   { name: 'Ceremonial Axe', material: 'Gold and Stone' }
               ],
               palette: TROPICAL_COLORS
           },
           Female: {
               garments: [
                   { name: 'Royal Dress', material: 'Finest Vicuña' },
                   { name: 'Feather Cloak', material: 'Hummingbird Feathers' }
               ],
               headgear: [
                   { name: 'Gold Crown', material: 'Gold and Pearls' }
               ],
               footwear: [
                   { name: 'Gold Slippers', material: 'Silk and Gold' }
               ],
               belts: [
                   { name: 'Jeweled Belt', material: 'Gold and Emeralds' }
               ],
               accessories: [
                   { name: 'Emerald Jewelry', material: 'Emeralds and Gold' },
                   { name: 'Gold Tupus', material: 'Ornate Gold Pins' }
               ],
               palette: TROPICAL_COLORS
           }
       }
   },
   [HistoricalEra.MEDIEVAL]: {
       poor: {
           Male: {
               garments: [
                   { name: 'Peasant Tunic', material: 'Rough Cotton' },
                   { name: 'Wool Poncho', material: 'Undyed Wool' }
               ],
               headgear: [
                   { name: 'Knit Cap', material: 'Llama Wool' },
                   { name: 'None', material: 'None' }
               ],
               footwear: [
                   { name: 'Sandals', material: 'Woven Grass' },
                   { name: 'Barefoot', material: 'None' }
               ],
               belts: [
                   { name: 'Cord Belt', material: 'Braided Fiber' }
               ],
               accessories: [
                   { name: 'Quipu', material: 'Knotted Strings', adjectives: ['Simple'] },
                   { name: 'Clay Whistle', material: 'Fired Clay' }
               ],
               palette: TROPICAL_COLORS
           },
           Female: {
               garments: [
                   { name: 'Plain Dress', material: 'Cotton' },
                   { name: 'Work Shawl', material: 'Rough Wool' }
               ],
               headgear: [
                   { name: 'Head Cloth', material: 'Plain Cotton' },
                   { name: 'None', material: 'None' }
               ],
               footwear: [
                   { name: 'Simple Sandals', material: 'Plant Fiber' },
                   { name: 'Barefoot', material: 'None' }
               ],
               belts: [
                   { name: 'Simple Belt', material: 'Woven Grass' }
               ],
               accessories: [
                   { name: 'Seed Jewelry', material: 'Local Seeds' },
                   { name: 'Spindle', material: 'Wood and Clay' }
               ],
               palette: TROPICAL_COLORS
           }
       },
       common: {
           Male: {
               garments: [
                   { name: 'Patterned Tunic', material: 'Dyed Cotton' },
                   { name: 'Decorated Poncho', material: 'Colored Wool' }
               ],
               headgear: [
                   { name: 'Chullo Hat', material: 'Knitted Wool', adjectives: ['Ear-flapped'] }
               ],
               footwear: [
                   { name: 'Leather Shoes', material: 'Llama Leather' }
               ],
               belts: [
                   { name: 'Patterned Belt', material: 'Woven Designs' }
               ],
               accessories: [
                   { name: 'Coca Bag', material: 'Woven Wool' },
                   { name: 'Bronze Knife', material: 'Bronze and Wood' }
               ],
               palette: TROPICAL_COLORS
           },
           Female: {
               garments: [
                   { name: 'Embroidered Dress', material: 'Fine Cotton' },
                   { name: 'Alpaca Shawl', material: 'Soft Alpaca' }
               ],
               headgear: [
                   { name: 'Decorated Hat', material: 'Felt and Embroidery' }
               ],
               footwear: [
                   { name: 'Woven Shoes', material: 'Colored Wool' }
               ],
               belts: [
                   { name: 'Embroidered Belt', material: 'Wool and Cotton' }
               ],
               accessories: [
                   { name: 'Silver Pins', material: 'Cast Silver' },
                   { name: 'Bead Necklace', material: 'Stone and Shell' }
               ],
               palette: TROPICAL_COLORS
           }
       },
       wealthy: {
           Male: {
               garments: [
                   { name: 'Noble Tunic', material: 'Fine Cumbi Cloth' },
                   { name: 'Feathered Cape', material: 'Rare Feathers' }
               ],
               headgear: [
                   { name: 'Noble Crown', material: 'Gold and Feathers' }
               ],
               footwear: [
                   { name: 'Decorated Boots', material: 'Fine Leather and Gold' }
               ],
               belts: [
                   { name: 'Gold Belt', material: 'Gold Links' }
               ],
               accessories: [
                   { name: 'Gold Earspools', material: 'Heavy Gold' },
                   { name: 'Ceremonial Axe', material: 'Gold and Stone' }
               ],
               palette: TROPICAL_COLORS
           },
           Female: {
               garments: [
                   { name: 'Royal Dress', material: 'Finest Vicuña' },
                   { name: 'Feather Cloak', material: 'Hummingbird Feathers' }
               ],
               headgear: [
                   { name: 'Gold Crown', material: 'Gold and Pearls' }
               ],
               footwear: [
                   { name: 'Gold Slippers', material: 'Silk and Gold' }
               ],
               belts: [
                   { name: 'Jeweled Belt', material: 'Gold and Emeralds' }
               ],
               accessories: [
                   { name: 'Emerald Jewelry', material: 'Emeralds and Gold' },
                   { name: 'Gold Tupus', material: 'Ornate Gold Pins' }
               ],
               palette: TROPICAL_COLORS
           }
       }
   },
   [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
       poor: {
           Male: {
               garments: [
                   { name: 'Cotton Shirt', material: 'Plain Cotton' },
                   { name: 'Wool Pants', material: 'Coarse Wool' }
               ],
               headgear: [
                   { name: 'Felt Hat', material: 'Local Felt' },
                   { name: 'None', material: 'None' }
               ],
               footwear: [
                   { name: 'Leather Sandals', material: 'Raw Leather' },
                   { name: 'Barefoot', material: 'None' }
               ],
               belts: [
                   { name: 'Leather Strip', material: 'Raw Hide' }
               ],
               accessories: [
                   { name: 'Wooden Cross', material: 'Carved Wood' },
                   { name: 'Clay Pipe', material: 'Local Clay' }
               ],
               palette: TROPICAL_COLORS
           },
           Female: {
               garments: [
                   { name: 'Simple Blouse', material: 'Cotton' },
                   { name: 'Wool Skirt', material: 'Undyed Wool' }
               ],
               headgear: [
                   { name: 'Head Scarf', material: 'Cotton' },
                   { name: 'None', material: 'None' }
               ],
               footwear: [
                   { name: 'Simple Shoes', material: 'Canvas' },
                   { name: 'Barefoot', material: 'None' }
               ],
               belts: [
                   { name: 'Cloth Belt', material: 'Woven Cotton' }
               ],
               accessories: [
                   { name: 'Glass Beads', material: 'Trade Glass' },
                   { name: 'Wooden Rosary', material: 'Carved Wood' }
               ],
               palette: TROPICAL_COLORS
           }
       },
       common: {
           Male: {
               garments: [
                   { name: 'Spanish Jacket', material: 'Wool', adjectives: ['Colonial'] },
                   { name: 'Cotton Breeches', material: 'Dyed Cotton' }
               ],
               headgear: [
                   { name: 'Wide Brim Hat', material: 'Felt' }
               ],
               footwear: [
                   { name: 'Leather Boots', material: 'Spanish Leather' }
               ],
               belts: [
                   { name: 'Leather Belt', material: 'Tooled Leather' }
               ],
               accessories: [
                   { name: 'Silver Cross', material: 'Colonial Silver' },
                   { name: 'Tobacco Pouch', material: 'Leather' }
               ],
               palette: TROPICAL_COLORS
           },
           Female: {
               garments: [
                   { name: 'Colonial Dress', material: 'Cotton and Lace' },
                   { name: 'Embroidered Shawl', material: 'Fine Wool' }
               ],
               headgear: [
                   { name: 'Mantilla', material: 'Black Lace' }
               ],
               footwear: [
                   { name: 'Leather Shoes', material: 'Soft Leather' }
               ],
               belts: [
                   { name: 'Silk Sash', material: 'Imported Silk' }
               ],
               accessories: [
                   { name: 'Pearl Rosary', material: 'Pearls and Silver' },
                   { name: 'Fan', material: 'Painted Wood and Silk' }
               ],
               palette: TROPICAL_COLORS
           }
       },
       wealthy: {
           Male: {
               garments: [
                   { name: 'Velvet Doublet', material: 'Imported Velvet' },
                   { name: 'Silk Hose', material: 'Fine Silk' }
               ],
               headgear: [
                   { name: 'Plumed Hat', material: 'Velvet and Ostrich' }
               ],
               footwear: [
                   { name: 'Buckled Shoes', material: 'Fine Leather and Silver' }
               ],
               belts: [
                   { name: 'Silver Belt', material: 'Engraved Silver' }
               ],
               accessories: [
                   { name: 'Gold Chain', material: 'Spanish Gold' },
                   { name: 'Jeweled Dagger', material: 'Steel and Gems' }
               ],
               palette: TROPICAL_COLORS
           },
           Female: {
               garments: [
                   { name: 'Brocade Gown', material: 'Gold Brocade' },
                   { name: 'Velvet Cape', material: 'Rich Velvet' }
               ],
               headgear: [
                   { name: 'Jeweled Comb', material: 'Gold and Pearls' }
               ],
               footwear: [
                   { name: 'Silk Slippers', material: 'Embroidered Silk' }
               ],
               belts: [
                   { name: 'Golden Chain', material: 'Gold Links' }
               ],
               accessories: [
                   { name: 'Emerald Cross', material: 'Colombian Emeralds' },
                   { name: 'Pearl Earrings', material: 'South Sea Pearls' }
               ],
               palette: TROPICAL_COLORS
           }
       }
   },
   [HistoricalEra.INDUSTRIAL_ERA]: {
       poor: {
           Male: {
               garments: [
                   { name: 'Work Shirt', material: 'Rough Cotton' },
                   { name: 'Canvas Pants', material: 'Heavy Canvas' }
               ],
               headgear: [
                   { name: 'Panama Hat', material: 'Toquilla Palm', adjectives: ['Wide-brimmed'] },
                   { name: 'None', material: 'None' }
               ],
               footwear: [
                   { name: 'Sandals', material: 'Tire Rubber' },
                   { name: 'Barefoot', material: 'None' }
               ],
               belts: [
                   { name: 'Rope Belt', material: 'Hemp Rope' }
               ],
               accessories: [
                   { name: 'None', material: 'None' }
               ],
               palette: INDUSTRIAL_COLORS
           },
           Female: {
               garments: [
                   { name: 'Cotton Dress', material: 'Cheap Cotton' },
                   { name: 'Work Apron', material: 'Canvas' }
               ],
               headgear: [
                   { name: 'Head Wrap', material: 'Cotton' },
                   { name: 'None', material: 'None' }
               ],
               footwear: [
                   { name: 'Cloth Shoes', material: 'Canvas' },
                   { name: 'Barefoot', material: 'None' }
               ],
               belts: [
                   { name: 'Cloth Belt', material: 'Cotton Strip' }
               ],
               accessories: [
                   { name: 'Wooden Cross', material: 'Carved Wood' },
                   { name: 'None', material: 'None' }
               ],
               palette: INDUSTRIAL_COLORS
           }
       },
       common: {
           Male: {
               garments: [
                   { name: 'Linen Suit', material: 'Light Linen' },
                   { name: 'Cotton Guayabera', material: 'White Cotton' }
               ],
               headgear: [
                   { name: 'Panama Hat', material: 'Toquilla Straw' }
               ],
               footwear: [
                   { name: 'Leather Shoes', material: 'Brown Leather' }
               ],
               belts: [
                   { name: 'Leather Belt', material: 'Tooled Leather' }
               ],
               accessories: [
                   { name: 'Pocket Watch', material: 'Silver' },
                   { name: 'Sunglasses', material: 'Metal and Glass' }
               ],
               palette: INDUSTRIAL_COLORS
           },
           Female: {
               garments: [
                   { name: 'Day Dress', material: 'Printed Cotton' },
                   { name: 'Lace Blouse', material: 'Cotton Lace' }
               ],
               headgear: [
                   { name: 'Decorated Hat', material: 'Straw and Ribbon' }
               ],
               footwear: [
                   { name: 'T-strap Shoes', material: 'Leather' }
               ],
               belts: [
                   { name: 'Ribbon Belt', material: 'Silk Ribbon' }
               ],
               accessories: [
                   { name: 'Cameo Brooch', material: 'Carved Shell' },
                   { name: 'Lace Fan', material: 'Ivory and Lace' }
               ],
               palette: INDUSTRIAL_COLORS
           }
       },
       wealthy: {
           Male: {
               garments: [
                   { name: 'Silk Suit', material: 'Imported Silk' },
                   { name: 'Dinner Jacket', material: 'Fine Wool' }
               ],
               headgear: [
                   { name: 'Top Hat', material: 'Silk' }
               ],
               footwear: [
                   { name: 'Patent Shoes', material: 'Patent Leather' }
               ],
               belts: [
                   { name: 'Silk Belt', material: 'Woven Silk' }
               ],
               accessories: [
                   { name: 'Gold Watch', material: 'Gold and Diamonds' },
                   { name: 'Diamond Stickpin', material: 'Gold and Diamonds' }
               ],
               palette: INDUSTRIAL_COLORS
           },
           Female: {
               garments: [
                   { name: 'Paris Gown', material: 'Silk and Beads' },
                   { name: 'Fur Stole', material: 'Chinchilla' }
               ],
               headgear: [
                   { name: 'Jeweled Tiara', material: 'Diamonds and Gold' }
               ],
               footwear: [
                   { name: 'Silk Pumps', material: 'Beaded Silk' }
               ],
               belts: [
                   { name: 'Jeweled Belt', material: 'Gold and Gems' }
               ],
               accessories: [
                   { name: 'Diamond Necklace', material: 'Diamonds and Platinum' },
                   { name: 'Emerald Ring', material: 'Colombian Emerald' }
               ],
               palette: INDUSTRIAL_COLORS
           }
       }
   },
   [HistoricalEra.MODERN_ERA]: {
       poor: {
           Male: {
               garments: [
                   { name: 'T-shirt', material: 'Cotton', adjectives: ['Worn'] },
                   { name: 'Jeans', material: 'Denim', adjectives: ['Faded'] }
               ],
               headgear: [
                   { name: 'Baseball Cap', material: 'Cotton' },
                   { name: 'None', material: 'None' }
               ],
               footwear: [
                   { name: 'Canvas Sneakers', material: 'Canvas and Rubber' },
                   { name: 'Sandals', material: 'Rubber' }
               ],
               belts: [
                   { name: 'Fabric Belt', material: 'Woven Fabric' }
               ],
               accessories: [
                   { name: 'Plastic Watch', material: 'Plastic' },
                   { name: 'None', material: 'None' }
               ],
               palette: MODERN_COLORS
           },
           Female: {
               garments: [
                   { name: 'Blouse', material: 'Polyester' },
                   { name: 'Skirt', material: 'Cotton Blend' }
               ],
               headgear: [
                   { name: 'None', material: 'None' }
               ],
               footwear: [
                   { name: 'Plastic Sandals', material: 'PVC' },
                   { name: 'Canvas Shoes', material: 'Canvas' }
               ],
               belts: [
                   { name: 'None', material: 'None' }
               ],
               accessories: [
                   { name: 'Costume Jewelry', material: 'Plastic and Metal' },
                   { name: 'None', material: 'None' }
               ],
               palette: MODERN_COLORS
           }
       },
       common: {
           Male: {
               garments: [
                   { name: 'Polo Shirt', material: 'Cotton Pique' },
                   { name: 'Chinos', material: 'Cotton Twill' }
               ],
               headgear: [
                   { name: 'Fedora', material: 'Felt' },
                   { name: 'None', material: 'None' }
               ],
               footwear: [
                   { name: 'Leather Loafers', material: 'Leather' },
                   { name: 'Sneakers', material: 'Leather and Rubber' }
               ],
               belts: [
                   { name: 'Leather Belt', material: 'Genuine Leather' }
               ],
               accessories: [
                   { name: 'Steel Watch', material: 'Stainless Steel' },
                   { name: 'Sunglasses', material: 'Plastic and Glass' }
               ],
               palette: MODERN_COLORS
           },
           Female: {
               garments: [
                   { name: 'Dress', material: 'Silk Blend' },
                   { name: 'Blazer', material: 'Wool Blend' }
               ],
               headgear: [
                   { name: 'Sun Hat', material: 'Straw' },
                   { name: 'None', material: 'None' }
               ],
               footwear: [
                   { name: 'Heels', material: 'Leather' },
                   { name: 'Ballet Flats', material: 'Soft Leather' }
               ],
               belts: [
                   { name: 'Chain Belt', material: 'Metal' }
               ],
               accessories: [
                   { name: 'Pearl Necklace', material: 'Cultured Pearls' },
                   { name: 'Leather Handbag', material: 'Leather' }
               ],
               palette: MODERN_COLORS
           }
       },
       wealthy: {
           Male: {
               garments: [
                   { name: 'Designer Suit', material: 'Italian Wool' },
                   { name: 'Silk Shirt', material: 'Pure Silk' }
               ],
               headgear: [
                   { name: 'Designer Cap', material: 'Cashmere' }
               ],
               footwear: [
                   { name: 'Designer Shoes', material: 'Italian Leather' }
               ],
               belts: [
                   { name: 'Designer Belt', material: 'Exotic Leather' }
               ],
               accessories: [
                   { name: 'Luxury Watch', material: 'Gold and Diamonds' },
                   { name: 'Platinum Ring', material: 'Platinum' }
               ],
               palette: MODERN_COLORS
           },
           Female: {
               garments: [
                   { name: 'Couture Dress', material: 'Silk and Crystals' },
                   { name: 'Designer Coat', material: 'Cashmere' }
               ],
               headgear: [
                   { name: 'Designer Hat', material: 'Fine Materials' }
               ],
               footwear: [
                   { name: 'Designer Heels', material: 'Exotic Leather' }
               ],
               belts: [
                   { name: 'Designer Belt', material: 'Luxury Leather' }
               ],
               accessories: [
                   { name: 'Diamond Jewelry', material: 'Diamonds and Platinum' },
                   { name: 'Designer Bag', material: 'Exotic Leather' }
               ],
               palette: MODERN_COLORS
           }
       }
   }
},

// SOUTH ASIAN CULTURAL ZONE
SOUTH_ASIAN: {
   [HistoricalEra.PREHISTORY]: {
       poor: {
           Male: {
               garments: [
                   { name: 'Cotton Dhoti', material: 'Rough Cotton' },
                   { name: 'Bark Cloth', material: 'Tree Bark' },
                   { name: 'Hide Wrap', material: 'Deer Hide' }
               ],
               headgear: [
                   { name: 'Turban', material: 'Rough Cotton' },
                   { name: 'None', material: 'None' }
               ],
               footwear: [
                   { name: 'Barefoot', material: 'None' }
               ],
               belts: [
                   { name: 'Rope Belt', material: 'Jute Rope' }
               ],
               accessories: [
                   { name: 'Clay Beads', material: 'Terracotta' },
                   { name: 'Stone Amulet', material: 'River Stone' }
               ],
               palette: TROPICAL_COLORS
           },
           Female: {
               garments: [
                   { name: 'Simple Sari', material: 'Coarse Cotton' },
                   { name: 'Wrapped Cloth', material: 'Plant Fiber' }
               ],
               headgear: [
                   { name: 'Head Cloth', material: 'Cotton' },
                   { name: 'None', material: 'None' }
               ],
               footwear: [
                   { name: 'Barefoot', material: 'None' }
               ],
               belts: [
                   { name: 'Waist Cord', material: 'Twisted Fiber' }
               ],
               accessories: [
                   { name: 'Shell Bangles', material: 'River Shells' },
                   { name: 'Nose Ring', material: 'Copper Wire' }
               ],
               palette: TROPICAL_COLORS
           }
       },
       common: {
           Male: {
               garments: [
                   { name: 'Fine Dhoti', material: 'Woven Cotton' },
                   { name: 'Upper Cloth', material: 'Cotton', adjectives: ['Draped'] }
               ],
               headgear: [
                   { name: 'Decorated Turban', material: 'Dyed Cotton' }
               ],
               footwear: [
                   { name: 'Leather Sandals', material: 'Buffalo Leather' }
               ],
               belts: [
                   { name: 'Woven Belt', material: 'Colored Thread' }
               ],
               accessories: [
                   { name: 'Bronze Armlet', material: 'Cast Bronze' },
                   { name: 'Sacred Thread', material: 'Cotton', adjectives: ['Ceremonial'] }
               ],
               palette: TROPICAL_COLORS
           },
           Female: {
               garments: [
                   { name: 'Decorated Sari', material: 'Fine Cotton', adjectives: ['Border'] },
                   { name: 'Blouse Piece', material: 'Cotton' }
               ],
               headgear: [
                   { name: 'Flower Garland', material: 'Fresh Jasmine' }
               ],
               footwear: [
                   { name: 'Toe Rings', material: 'Silver' }
               ],
               belts: [
                   { name: 'Silver Chain', material: 'Silver Links' }
               ],
               accessories: [
                   { name: 'Glass Bangles', material: 'Colored Glass' },
                   { name: 'Bindi', material: 'Vermillion' }
               ],
               palette: TROPICAL_COLORS
           }
       },
       wealthy: {
           Male: {
               garments: [
                   { name: 'Silk Dhoti', material: 'Pure Silk', adjectives: ['Gold-bordered'] },
                   { name: 'Jeweled Angavastram', material: 'Silk and Gold' }
               ],
               headgear: [
                   { name: 'Royal Turban', material: 'Silk and Jewels' }
               ],
               footwear: [
                   { name: 'Embroidered Mojaris', material: 'Silk and Gold' }
               ],
               belts: [
                   { name: 'Gold Belt', material: 'Gold Chain' }
               ],
               accessories: [
                   { name: 'Ruby Ring', material: 'Gold and Ruby' },
                   { name: 'Pearl Necklace', material: 'Pearls and Gold' }
               ],
               palette: TROPICAL_COLORS
           },
           Female: {
               garments: [
                   { name: 'Royal Sari', material: 'Gold-woven Silk' },
                   { name: 'Jeweled Choli', material: 'Silk and Gems' }
               ],
               headgear: [
                   { name: 'Gold Crown', material: 'Gold and Gems' }
               ],
               footwear: [
                   { name: 'Gold Anklets', material: 'Solid Gold' }
               ],
               belts: [
                   { name: 'Jeweled Girdle', material: 'Gold and Gems' }
               ],
               accessories: [
                   { name: 'Diamond Nose Ring', material: 'Gold and Diamond' },
                   { name: 'Emerald Set', material: 'Emeralds and Gold' }
               ],
               palette: TROPICAL_COLORS
           }
       }
   },
   [HistoricalEra.ANTIQUITY]: {
       poor: {
           Male: {
               garments: [
                   { name: 'Cotton Lungi', material: 'Plain Cotton' },
                   { name: 'Simple Vest', material: 'Rough Cotton' }
               ],
               headgear: [
                   { name: 'Cotton Cap', material: 'White Cotton' },
                   { name: 'None', material: 'None' }
               ],
               footwear: [
                   { name: 'Barefoot', material: 'None' }
               ],
               belts: [
                   { name: 'Thread Belt', material: 'Cotton Thread' }
               ],
               accessories: [
                   { name: 'Rudraksha Beads', material: 'Sacred Seeds' },
                   { name: 'Iron Ring', material: 'Simple Iron' }
               ],
               palette: EAST_ASIAN_COLORS
           },
           Female: {
               garments: [
                   { name: 'Cotton Sari', material: 'Undyed Cotton' },
                   { name: 'Simple Choli', material: 'Cotton' }
               ],
               headgear: [
                   { name: 'Cotton Veil', material: 'Plain Cotton' },
                   { name: 'None', material: 'None' }
               ],
               footwear: [
                   { name: 'Barefoot', material: 'None' }
               ],
               belts: [
                   { name: 'String Belt', material: 'Twisted Cotton' }
               ],
               accessories: [
                   { name: 'Clay Bangles', material: 'Baked Clay' },
                   { name: 'Wooden Beads', material: 'Sandalwood' }
               ],
               palette: EAST_ASIAN_COLORS
           }
       },
       common: {
           Male: {
               garments: [
                   { name: 'Dhoti Kurta', material: 'Fine Cotton' },
                   { name: 'Angavastram', material: 'Silk Border Cotton' }
               ],
               headgear: [
                   { name: 'Pagri', material: 'Starched Cotton' }
               ],
               footwear: [
                   { name: 'Leather Chappals', material: 'Leather' }
               ],
               belts: [
                   { name: 'Silk Cord', material: 'Twisted Silk' }
               ],
               accessories: [
                   { name: 'Silver Kada', material: 'Silver Bracelet' },
                   { name: 'Tilak', material: 'Sandalwood Paste' }
               ],
               palette: EAST_ASIAN_COLORS
           },
           Female: {
               garments: [
                   { name: 'Silk Sari', material: 'Pure Silk' },
                   { name: 'Embroidered Choli', material: 'Cotton and Gold Thread' }
               ],
               headgear: [
                   { name: 'Maang Tikka', material: 'Silver and Gems' }
               ],
               footwear: [
                   { name: 'Toe Rings', material: 'Silver' }
               ],
               belts: [
                   { name: 'Kamarband', material: 'Silver Belt' }
               ],
               accessories: [
                   { name: 'Gold Bangles', material: 'Solid Gold' },
                   { name: 'Pearl Mala', material: 'Fresh Pearls' }
               ],
               palette: EAST_ASIAN_COLORS
           }
       },
       wealthy: {
           Male: {
               garments: [
                   { name: 'Royal Sherwani', material: 'Brocade and Pearls' },
                   { name: 'Silk Dhoti', material: 'Finest Silk' }
               ],
               headgear: [
                   { name: 'Jeweled Turban', material: 'Silk and Precious Gems' }
               ],
               footwear: [
                   { name: 'Zardozi Mojaris', material: 'Velvet and Gold' }
               ],
               belts: [
                   { name: 'Gem-studded Belt', material: 'Gold and Rubies' }
               ],
               accessories: [
                   { name: 'Navratna Ring', material: 'Nine Gems and Gold' },
                   { name: 'Pearl Strings', material: 'Multiple Pearl Strands' }
               ],
               palette: EAST_ASIAN_COLORS
           },
           Female: {
               garments: [
                   { name: 'Banarasi Sari', material: 'Gold and Silver Brocade' },
                   { name: 'Kundan Choli', material: 'Silk with Gem Work' }
               ],
               headgear: [
                   { name: 'Rakhdi', material: 'Diamonds and Gold' }
               ],
               footwear: [
                   { name: 'Gem Payal', material: 'Gold and Gems' }
               ],
               belts: [
                   { name: 'Vaddanam', material: 'Heavy Gold Belt' }
               ],
               accessories: [
                   { name: 'Kundan Set', material: 'Uncut Diamonds' },
                   { name: 'Vanki', material: 'Gold Arm Ornament' }
               ],
               palette: EAST_ASIAN_COLORS
           }
       }
   },
   [HistoricalEra.MEDIEVAL]: {
       poor: {
           Male: {
               garments: [
                   { name: 'Cotton Kurta', material: 'Coarse Cotton' },
                   { name: 'Pajama', material: 'Plain Cotton' }
               ],
               headgear: [
                   { name: 'Topi', material: 'Cotton Khadi', adjectives: ['Simple'] },
                   { name: 'None', material: 'None' }
               ],
               footwear: [
                   { name: 'Barefoot', material: 'None' }
               ],
               belts: [
                   { name: 'Rope', material: 'Jute Rope' }
               ],
               accessories: [
                   { name: 'Taweez', material: 'Copper Amulet' },
                   { name: 'None', material: 'None' }
               ],
               palette: MEDIEVAL_COLORS
           },
           Female: {
               garments: [
                   { name: 'Ghagra', material: 'Rough Cotton' },
                   { name: 'Odhani', material: 'Plain Cotton' }
               ],
               headgear: [
                   { name: 'Head Cloth', material: 'Cotton' },
                   { name: 'None', material: 'None' }
               ],
               footwear: [
                   { name: 'Barefoot', material: 'None' }
               ],
               belts: [
                   { name: 'Cloth Belt', material: 'Cotton Strip' }
               ],
               accessories: [
                   { name: 'Glass Bangles', material: 'Colored Glass' },
                   { name: 'Nose Pin', material: 'Silver' }
               ],
               palette: MEDIEVAL_COLORS
           }
       },
       common: {
           Male: {
               garments: [
                   { name: 'Achkan', material: 'Fine Cotton' },
                   { name: 'Churidar', material: 'Cotton with Silk' }
               ],
               headgear: [
                   { name: 'Turban', material: 'Muslin' }
               ],
               footwear: [
                   { name: 'Jutti', material: 'Embroidered Leather' }
               ],
               belts: [
                   { name: 'Patka', material: 'Silk Sash' }
               ],
               accessories: [
                   { name: 'Khanjar', material: 'Steel and Silver', adjectives: ['Ceremonial'] },
                   { name: 'Arm Bands', material: 'Silver' }
               ],
               palette: MEDIEVAL_COLORS
           },
           Female: {
               garments: [
                   { name: 'Anarkali', material: 'Silk and Cotton' },
                   { name: 'Dupatta', material: 'Chiffon with Border' }
               ],
               headgear: [
                   { name: 'Passa', material: 'Gold and Pearls' }
               ],
               footwear: [
                   { name: 'Khussa', material: 'Velvet and Beads' }
               ],
               belts: [
                   { name: 'Kamarbandh', material: 'Silver Chain' }
               ],
               accessories: [
                   { name: 'Jhumkas', material: 'Gold Earrings' },
                   { name: 'Haath Phool', material: 'Gold Hand Jewelry' }
               ],
               palette: MEDIEVAL_COLORS
           }
       },
       wealthy: {
           Male: {
               garments: [
                   { name: 'Royal Jama', material: 'Velvet and Gold' },
                   { name: 'Brocade Pajama', material: 'Silk Brocade' }
               ],
               headgear: [
                   { name: 'Kalgi Turban', material: 'Silk with Jeweled Plume' }
               ],
               footwear: [
                   { name: 'Zardozi Shoes', material: 'Velvet with Gold Work' }
               ],
               belts: [
                   { name: 'Jeweled Cummerbund', material: 'Silk and Gems' }
               ],
               accessories: [
                   { name: 'Sarpech', material: 'Diamonds and Emeralds' },
                   { name: 'Pearl Necklaces', material: 'Layers of Pearls' }
               ],
               palette: MEDIEVAL_COLORS
           },
           Female: {
               garments: [
                   { name: 'Mughal Lehenga', material: 'Brocade and Jewels' },
                   { name: 'Peshwaz', material: 'Finest Muslin and Gold' }
               ],
               headgear: [
                   { name: 'Sheesh Patti', material: 'Gold and Diamonds' }
               ],
               footwear: [
                   { name: 'Gem-studded Mojaris', material: 'Silk and Jewels' }
               ],
               belts: [
                   { name: 'Tagdi', material: 'Gold and Precious Stones' }
               ],
               accessories: [
                   { name: 'Polki Set', material: 'Uncut Diamonds' },
                   { name: 'Bazuband', material: 'Gold Arm Ornament' }
               ],
               palette: MEDIEVAL_COLORS
           }
       }
   },
   [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
       poor: {
           Male: {
               garments: [
                   { name: 'Simple Kurta', material: 'Cotton' },
                   { name: 'Dhoti', material: 'White Cotton' }
               ],
               headgear: [
                   { name: 'Gandhi Cap', material: 'White Cotton' },
                   { name: 'None', material: 'None' }
               ],
               footwear: [
                   { name: 'Barefoot', material: 'None' }
               ],
               belts: [
                   { name: 'Cotton Cord', material: 'White Cotton' }
               ],
               accessories: [
                   { name: 'Sacred Thread', material: 'Cotton' },
                   { name: 'None', material: 'None' }
               ],
               palette: RENAISSANCE_COLORS
           },
           Female: {
               garments: [
                   { name: 'Cotton Sari', material: 'Plain Cotton' },
                   { name: 'Simple Blouse', material: 'Cotton' }
               ],
               headgear: [
                   { name: 'Ghoonghat', material: 'Cotton Veil' },
                   { name: 'None', material: 'None' }
               ],
               footwear: [
                   { name: 'Barefoot', material: 'None' }
               ],
               belts: [
                   { name: 'None', material: 'None' }
               ],
               accessories: [
                   { name: 'Glass Bangles', material: 'Colored Glass' },
                   { name: 'Bindi', material: 'Kumkum' }
               ],
               palette: RENAISSANCE_COLORS
           }
       },
       common: {
           Male: {
               garments: [
                   { name: 'Bandhgala', material: 'Fine Cotton' },
                   { name: 'Formal Dhoti', material: 'Silk-bordered Cotton' }
               ],
               headgear: [
                   { name: 'Mysore Peta', material: 'Silk and Gold' }
               ],
               footwear: [
                   { name: 'Kolhapuri', material: 'Leather Sandals' }
               ],
               belts: [
                   { name: 'Silk Belt', material: 'Woven Silk' }
               ],
               accessories: [
                   { name: 'Gold Chain', material: 'Gold' },
                   { name: 'Ruby Ring', material: 'Gold and Ruby' }
               ],
               palette: RENAISSANCE_COLORS
           },
           Female: {
               garments: [
                   { name: 'Kanjeevaram Sari', material: 'Silk with Gold Border' },
                   { name: 'Brocade Blouse', material: 'Silk Brocade' }
               ],
               headgear: [
                   { name: 'Jadai Nagam', material: 'Gold Hair Ornament' }
               ],
               footwear: [
                   { name: 'Toe Rings', material: 'Silver' }
               ],
               belts: [
                   { name: 'Oddiyanam', material: 'Silver Belt' }
               ],
               accessories: [
                   { name: 'Temple Jewelry', material: 'Gold and Rubies' },
                   { name: 'Metti', material: 'Silver Toe Rings' }
               ],
               palette: RENAISSANCE_COLORS
           }
       },
       wealthy: {
           Male: {
               garments: [
                   { name: 'Princely Sherwani', material: 'Brocade and Pearls' },
                   { name: 'Silk Churidar', material: 'Pure Silk' }
               ],
               headgear: [
                   { name: 'Rajasthani Safa', material: 'Silk with Kalgi' }
               ],
               footwear: [
                   { name: 'Nizam Shoes', material: 'Velvet and Gold' }
               ],
               belts: [
                   { name: 'Jeweled Belt', material: 'Gold and Gems' }
               ],
               accessories: [
                   { name: 'Emerald Necklace', material: 'Emeralds and Gold' },
                   { name: 'Diamond Buttons', material: 'Diamonds' }
               ],
               palette: RENAISSANCE_COLORS
           },
           Female: {
               garments: [
                   { name: 'Royal Paithani', material: 'Gold and Silk' },
                   { name: 'Zardozi Choli', material: 'Velvet with Gold Work' }
               ],
               headgear: [
                   { name: 'Rakhdi', material: 'Diamonds and Gold' }
               ],
               footwear: [
                   { name: 'Pearl Payal', material: 'Pearls and Gold' }
               ],
               belts: [
                   { name: 'Cummerbund', material: 'Gold and Precious Stones' }
               ],
               accessories: [
                   { name: 'Navratna Haar', material: 'Nine Gems Necklace' },
                   { name: 'Vanki', material: 'Diamond Armlet' }
               ],
               palette: RENAISSANCE_COLORS
           }
       }
   },
   [HistoricalEra.INDUSTRIAL_ERA]: {
       poor: {
           Male: {
               garments: [
                   { name: 'Mill Shirt', material: 'Cheap Cotton' },
                   { name: 'Cotton Lungi', material: 'Checkered Cotton' }
               ],
               headgear: [
                   { name: 'Cotton Turban', material: 'White Cotton' },
                   { name: 'None', material: 'None' }
               ],
               footwear: [
                   { name: 'Barefoot', material: 'None' }
               ],
               belts: [
                   { name: 'Rope', material: 'Jute' }
               ],
               accessories: [
                   { name: 'None', material: 'None' }
               ],
               palette: INDUSTRIAL_COLORS
           },
           Female: {
               garments: [
                   { name: 'Factory Sari', material: 'Mill Cotton' },
                   { name: 'Cotton Blouse', material: 'Plain Cotton' }
               ],
               headgear: [
                   { name: 'Head Cloth', material: 'Cotton' },
                   { name: 'None', material: 'None' }
               ],
               footwear: [
                   { name: 'Barefoot', material: 'None' }
               ],
               belts: [
                   { name: 'None', material: 'None' }
               ],
               accessories: [
                   { name: 'Glass Bangles', material: 'Cheap Glass' },
                   { name: 'None', material: 'None' }
               ],
               palette: INDUSTRIAL_COLORS
           }
       },
       common: {
           Male: {
               garments: [
                   { name: 'Western Suit', material: 'Wool Blend' },
                   { name: 'Nehru Jacket', material: 'Cotton' }
               ],
               headgear: [
                   { name: 'Topi', material: 'Embroidered Cotton' }
               ],
               footwear: [
                   { name: 'Oxford Shoes', material: 'Leather' }
               ],
               belts: [
                   { name: 'Leather Belt', material: 'Brown Leather' }
               ],
               accessories: [
                   { name: 'Pocket Watch', material: 'Silver' },
                   { name: 'Fountain Pen', material: 'Steel and Gold' }
               ],
               palette: INDUSTRIAL_COLORS
           },
           Female: {
               garments: [
                   { name: 'Printed Sari', material: 'Cotton with Print' },
                   { name: 'Puff Sleeve Blouse', material: 'Cotton' }
               ],
               headgear: [
                   { name: 'Hair Flowers', material: 'Fresh Jasmine' }
               ],
               footwear: [
                   { name: 'Leather Chappals', material: 'Leather' }
               ],
               belts: [
                   { name: 'Chain Belt', material: 'Silver' }
               ],
               accessories: [
                   { name: 'Gold Bangles', material: 'Gold' },
                   { name: 'Nose Stud', material: 'Diamond' }
               ],
               palette: INDUSTRIAL_COLORS
           }
       },
       wealthy: {
           Male: {
               garments: [
                   { name: 'Three-piece Suit', material: 'English Wool' },
                   { name: 'Silk Kurta', material: 'Pure Silk' }
               ],
               headgear: [
                   { name: 'Maharaja Turban', material: 'Silk and Jewels' }
               ],
               footwear: [
                   { name: 'Patent Shoes', material: 'Patent Leather' }
               ],
               belts: [
                   { name: 'Gold Chain', material: 'Solid Gold' }
               ],
               accessories: [
                   { name: 'Diamond Ring', material: 'Solitaire Diamond' },
                   { name: 'Gold Watch', material: 'Swiss Gold Watch' }
               ],
               palette: INDUSTRIAL_COLORS
           },
           Female: {
               garments: [
                   { name: 'French Chiffon Sari', material: 'Imported Chiffon' },
                   { name: 'Victorian Blouse', material: 'Lace and Silk' }
               ],
               headgear: [
                   { name: 'Diamond Tikka', material: 'Diamonds and Platinum' }
               ],
               footwear: [
                   { name: 'Heeled Sandals', material: 'Italian Leather' }
               ],
               belts: [
                   { name: 'Pearl Belt', material: 'Pearls and Gold' }
               ],
               accessories: [
                   { name: 'Choker Set', material: 'Diamonds and Emeralds' },
                   { name: 'Pearl Strings', material: 'South Sea Pearls' }
               ],
               palette: INDUSTRIAL_COLORS
           }
       }
   },
   [HistoricalEra.MODERN_ERA]: {
       poor: {
           Male: {
               garments: [
                   { name: 'T-shirt', material: 'Cotton', adjectives: ['Faded'] },
                   { name: 'Lungi', material: 'Cotton Check' }
               ],
               headgear: [
                   { name: 'None', material: 'None' }
               ],
               footwear: [
                   { name: 'Rubber Chappals', material: 'Rubber' },
                   { name: 'Barefoot', material: 'None' }
               ],
               belts: [
                   { name: 'None', material: 'None' }
               ],
               accessories: [
                   { name: 'Digital Watch', material: 'Plastic' },
                   { name: 'None', material: 'None' }
               ],
               palette: MODERN_COLORS
           },
           Female: {
               garments: [
                   { name: 'Salwar Kameez', material: 'Synthetic' },
                   { name: 'Cotton Sari', material: 'Printed Cotton' }
               ],
               headgear: [
                   { name: 'Dupatta', material: 'Polyester' },
                   { name: 'None', material: 'None' }
               ],
               footwear: [
                   { name: 'Plastic Sandals', material: 'PVC' },
                   { name: 'Barefoot', material: 'None' }
               ],
               belts: [
                   { name: 'None', material: 'None' }
               ],
               accessories: [
                   { name: 'Plastic Bangles', material: 'Colored Plastic' },
                   { name: 'Imitation Jewelry', material: 'Metal Alloy' }
               ],
               palette: MODERN_COLORS
           }
       },
       common: {
           Male: {
               garments: [
                   { name: 'Formal Shirt', material: 'Cotton Blend' },
                   { name: 'Trousers', material: 'Polyester Blend' }
               ],
               headgear: [
                   { name: 'None', material: 'None' }
               ],
               footwear: [
                   { name: 'Leather Shoes', material: 'Genuine Leather' },
                   { name: 'Sports Shoes', material: 'Synthetic' }
               ],
               belts: [
                   { name: 'Leather Belt', material: 'Genuine Leather' }
               ],
               accessories: [
                   { name: 'Steel Watch', material: 'Stainless Steel' },
                   { name: 'Smartphone', material: 'Electronics' }
               ],
               palette: MODERN_COLORS
           },
           Female: {
               garments: [
                   { name: 'Kurti', material: 'Cotton Silk' },
                   { name: 'Churidar', material: 'Stretchable Fabric' }
               ],
               headgear: [
                   { name: 'None', material: 'None' }
               ],
               footwear: [
                   { name: 'Wedges', material: 'Synthetic Leather' },
                   { name: 'Kolhapuris', material: 'Leather' }
               ],
               belts: [
                   { name: 'None', material: 'None' }
               ],
               accessories: [
                   { name: 'Gold Earrings', material: '22k Gold' },
                   { name: 'Mangalsutra', material: 'Gold and Black Beads' }
               ],
               palette: MODERN_COLORS
           }
       },
       wealthy: {
           Male: {
               garments: [
                   { name: 'Designer Sherwani', material: 'Raw Silk' },
                   { name: 'Business Suit', material: 'Italian Wool' }
               ],
               headgear: [
                   { name: 'None', material: 'None' }
               ],
               footwear: [
                   { name: 'Designer Shoes', material: 'Italian Leather' }
               ],
               belts: [
                   { name: 'Designer Belt', material: 'Exotic Leather' }
               ],
               accessories: [
                   { name: 'Luxury Watch', material: 'Swiss Gold Watch' },
                   { name: 'Diamond Cufflinks', material: 'White Gold and Diamonds' }
               ],
               palette: MODERN_COLORS
           },
           Female: {
               garments: [
                   { name: 'Designer Lehenga', material: 'Silk and Swarovski' },
                   { name: 'Cocktail Sari', material: 'Georgette and Sequins' }
               ],
               headgear: [
                   { name: 'None', material: 'None' }
               ],
               footwear: [
                   { name: 'Designer Heels', material: 'Jimmy Choo' }
               ],
               belts: [
                   { name: 'None', material: 'None' }
               ],
               accessories: [
                   { name: 'Diamond Set', material: 'Solitaires and Platinum' },
                   { name: 'Designer Bag', material: 'Leather and Crystals' }
               ],
               palette: MODERN_COLORS
           }
       }
   }
},

// SUB-SAHARAN AFRICAN CULTURAL ZONE
SUB_SAHARAN_AFRICAN: {
   [HistoricalEra.PREHISTORY]: {
       poor: {
           Male: {
               garments: [
                   { name: 'Hide Loincloth', material: 'Antelope Hide' },
                   { name: 'Bark Cloth', material: 'Beaten Bark' },
                   { name: 'Grass Skirt', material: 'Woven Grass' }
               ],
               headgear: [
                   { name: 'None', material: 'None' }
               ],
               footwear: [
                   { name: 'Barefoot', material: 'None' }
               ],
               belts: [
                   { name: 'Hide Strip', material: 'Leather Thong' }
               ],
               accessories: [
                   { name: 'Bone Necklace', material: 'Animal Bones' },
                   { name: 'Shell Pendant', material: 'Cowrie Shell' }
               ],
               palette: TROPICAL_COLORS
           },
           Female: {
               garments: [
                   { name: 'Hide Skirt', material: 'Soft Leather' },
                   { name: 'Bark Wrap', material: 'Fig Bark' }
               ],
               headgear: [
                   { name: 'Seed Headband', material: 'Strung Seeds' },
                   { name: 'None', material: 'None' }
               ],
               footwear: [
                   { name: 'Barefoot', material: 'None' }
               ],
               belts: [
                   { name: 'Beaded String', material: 'Seeds and Fiber' }
               ],
               accessories: [
                   { name: 'Clay Beads', material: 'Fired Clay' },
                   { name: 'Ostrich Shell', material: 'Shell Disc' }
               ],
               palette: TROPICAL_COLORS
           }
       },
       common: {
           Male: {
               garments: [
                   { name: 'Leopard Skin', material: 'Leopard Hide', adjectives: ['Status'] },
                   { name: 'Woven Cloth', material: 'Plant Fibers' }
               ],
               headgear: [
                   { name: 'Feather Crown', material: 'Ostrich Feathers' }
               ],
               footwear: [
                   { name: 'Hide Sandals', material: 'Buffalo Hide' }
               ],
               belts: [
                   { name: 'Beaded Belt', material: 'Beads and Leather' }
               ],
               accessories: [
                   { name: 'Ivory Bracelet', material: 'Elephant Ivory' },
                   { name: 'Copper Ring', material: 'Beaten Copper' }
               ],
               palette: TROPICAL_COLORS
           },
           Female: {
               garments: [
                   { name: 'Decorated Wrap', material: 'Dyed Bark Cloth' },
                   { name: 'Beaded Apron', material: 'Leather and Beads' }
               ],
               headgear: [
                   { name: 'Beaded Headdress', material: 'Intricate Beadwork' }
               ],
               footwear: [
                   { name: 'Barefoot', material: 'None' }
               ],
               belts: [
                   { name: 'Cowrie Belt', material: 'Cowrie Shells' }
               ],
               accessories: [
                   { name: 'Brass Anklets', material: 'Cast Brass' },
                   { name: 'Neck Rings', material: 'Copper Coils' }
               ],
               palette: TROPICAL_COLORS
           }
       },
       wealthy: {
           Male: {
               garments: [
                   { name: 'Lion Mane Cape', material: 'Lion Mane', adjectives: ['Royal'] },
                   { name: 'Fine Cloth', material: 'Woven Cotton' }
               ],
               headgear: [
                   { name: 'Gold Crown', material: 'Beaten Gold' }
               ],
               footwear: [
                   { name: 'Decorated Sandals', material: 'Leather and Gold' }
               ],
               belts: [
                   { name: 'Gold Belt', material: 'Gold Discs' }
               ],
               accessories: [
                   { name: 'Gold Armlet', material: 'Solid Gold' },
                   { name: 'Royal Staff', material: 'Ebony and Gold' }
               ],
               palette: TROPICAL_COLORS
           },
           Female: {
               garments: [
                   { name: 'Royal Wrapper', material: 'Finest Cloth', adjectives: ['Embroidered'] },
                   { name: 'Beaded Dress', material: 'Cloth and Beads' }
               ],
               headgear: [
                   { name: 'Queen Crown', material: 'Gold and Beads' }
               ],
               footwear: [
                   { name: 'Beaded Sandals', material: 'Leather and Beads' }
               ],
               belts: [
                   { name: 'Royal Girdle', material: 'Gold and Cowries' }
               ],
               accessories: [
                   { name: 'Gold Jewelry', material: 'Cast Gold' },
                   { name: 'Ivory Ornaments', material: 'Carved Ivory' }
               ],
               palette: TROPICAL_COLORS
           }
       }
   },
   [HistoricalEra.ANTIQUITY]: {
       poor: {
           Male: {
               garments: [
                   { name: 'Cotton Wrap', material: 'Rough Cotton' },
                   { name: 'Hide Cloak', material: 'Goat Skin' }
               ],
               headgear: [
                   { name: 'Fiber Cap', material: 'Woven Grass' },
                   { name: 'None', material: 'None' }
               ],
               footwear: [
                   { name: 'Barefoot', material: 'None' }
               ],
               belts: [
                   { name: 'Rope Belt', material: 'Twisted Fiber' }
               ],
               accessories: [
                   { name: 'Clay Amulet', material: 'Terracotta' },
                   { name: 'Wood Beads', material: 'Carved Wood' }
               ],
               palette: TROPICAL_COLORS
           },
           Female: {
               garments: [
                   { name: 'Wrapper', material: 'Plain Cotton' },
                   { name: 'Breast Band', material: 'Cotton Strip' }
               ],
               headgear: [
                   { name: 'Head Wrap', material: 'Cotton' },
                   { name: 'None', material: 'None' }
               ],
               footwear: [
                   { name: 'Barefoot', material: 'None' }
               ],
               belts: [
                   { name: 'Waist Beads', material: 'Clay Beads' }
               ],
               accessories: [
                   { name: 'Anklets', material: 'Iron' },
                   { name: 'Ear Plugs', material: 'Wood' }
               ],
               palette: TROPICAL_COLORS
           }
       },
       common: {
           Male: {
               garments: [
                   { name: 'Kente Cloth', material: 'Woven Cotton', adjectives: ['Patterned'] },
                   { name: 'Dashiki', material: 'Embroidered Cotton' }
               ],
               headgear: [
                   { name: 'Kufi Cap', material: 'Embroidered Cotton' }
               ],
               footwear: [
                   { name: 'Leather Sandals', material: 'Cow Leather' }
               ],
               belts: [
                   { name: 'Woven Belt', material: 'Patterned Cloth' }
               ],
               accessories: [
                   { name: 'Bronze Bracelet', material: 'Cast Bronze' },
                   { name: 'Ivory Ring', material: 'Carved Ivory' }
               ],
               palette: TROPICAL_COLORS
           },
           Female: {
               garments: [
                   { name: 'Boubou', material: 'Dyed Cotton' },
                   { name: 'Wrapper Set', material: 'Printed Cotton' }
               ],
               headgear: [
                   { name: 'Gele', material: 'Starched Cotton' }
               ],
               footwear: [
                   { name: 'Beaded Slippers', material: 'Leather and Beads' }
               ],
               belts: [
                   { name: 'Beaded Girdle', material: 'Multicolor Beads' }
               ],
               accessories: [
                   { name: 'Coral Beads', material: 'Red Coral' },
                   { name: 'Gold Earrings', material: 'Twisted Gold' }
               ],
               palette: TROPICAL_COLORS
           }
       },
       wealthy: {
           Male: {
               garments: [
                   { name: 'Royal Agbada', material: 'Silk and Gold Thread' },
                   { name: 'Velvet Robe', material: 'Imported Velvet' }
               ],
               headgear: [
                   { name: 'Crown', material: 'Gold and Coral' }
               ],
               footwear: [
                   { name: 'Embroidered Shoes', material: 'Velvet and Gold' }
               ],
               belts: [
                   { name: 'Gold Chain', material: 'Heavy Gold' }
               ],
               accessories: [
                   { name: 'Royal Scepter', material: 'Gold and Ivory' },
                   { name: 'Gold Rings', material: 'Pure Gold' }
               ],
               palette: TROPICAL_COLORS
           },
           Female: {
               garments: [
                   { name: 'Royal Wrapper', material: 'Silk with Gold' },
                   { name: 'Velvet Blouse', material: 'Embroidered Velvet' }
               ],
               headgear: [
                   { name: 'Queen Crown', material: 'Gold and Coral Beads' }
               ],
               footwear: [
                   { name: 'Gold Sandals', material: 'Leather and Gold' }
               ],
               belts: [
                   { name: 'Coral Belt', material: 'Large Coral Beads' }
               ],
               accessories: [
                   { name: 'Gold Necklaces', material: 'Layered Gold' },
                   { name: 'Ivory Bangles', material: 'Carved Elephant Ivory' }
               ],
               palette: TROPICAL_COLORS
           }
       }
   },
   [HistoricalEra.MEDIEVAL]: {
       poor: {
           Male: {
               garments: [
                   { name: 'Simple Tunic', material: 'Rough Cotton' },
                   { name: 'Cloth Wrap', material: 'Undyed Cotton' }
               ],
               headgear: [
                   { name: 'Cotton Cap', material: 'Plain Cotton' },
                   { name: 'None', material: 'None' }
               ],
               footwear: [
                   { name: 'Barefoot', material: 'None' }
               ],
               belts: [
                   { name: 'Rope', material: 'Plant Fiber' }
               ],
               accessories: [
                   { name: 'Wooden Charm', material: 'Carved Wood' },
                   { name: 'None', material: 'None' }
               ],
               palette: MEDIEVAL_COLORS
           },
           Female: {
               garments: [
                   { name: 'Wrap Dress', material: 'Plain Cotton' },
                   { name: 'Head Tie', material: 'Cotton' }
               ],
               headgear: [
                   { name: 'Simple Wrap', material: 'Cotton' },
                   { name: 'None', material: 'None' }
               ],
               footwear: [
                   { name: 'Barefoot', material: 'None' }
               ],
               belts: [
                   { name: 'String Belt', material: 'Twisted Thread' }
               ],
               accessories: [
                   { name: 'Clay Jewelry', material: 'Baked Clay' },
                   { name: 'None', material: 'None' }
               ],
               palette: MEDIEVAL_COLORS
           }
       },
       common: {
           Male: {
               garments: [
                   { name: 'Embroidered Robe', material: 'Cotton with Designs' },
                   { name: 'Printed Wrapper', material: 'Dyed Cotton' }
               ],
               headgear: [
                   { name: 'Fez', material: 'Felt' }
               ],
               footwear: [
                   { name: 'Leather Slippers', material: 'Soft Leather' }
               ],
               belts: [
                   { name: 'Leather Belt', material: 'Decorated Leather' }
               ],
               accessories: [
                   { name: 'Silver Amulet', material: 'Engraved Silver' },
                   { name: 'Brass Ring', material: 'Cast Brass' }
               ],
               palette: MEDIEVAL_COLORS
           },
           Female: {
               garments: [
                   { name: 'Kaba', material: 'Printed Cotton' },
                   { name: 'Slit', material: 'Woven Cotton' }
               ],
               headgear: [
                   { name: 'Duku', material: 'Tied Fabric' }
               ],
               footwear: [
                   { name: 'Sandals', material: 'Woven Palm' }
               ],
               belts: [
                   { name: 'Beaded Belt', material: 'Glass Beads' }
               ],
               accessories: [
                   { name: 'Brass Jewelry', material: 'Cast Brass' },
                   { name: 'Amber Beads', material: 'Amber' }
               ],
               palette: MEDIEVAL_COLORS
           }
       },
       wealthy: {
           Male: {
               garments: [
                   { name: 'Grand Boubou', material: 'Silk Brocade' },
                   { name: 'Embroidered Caftan', material: 'Gold Thread Work' }
               ],
               headgear: [
                   { name: 'Turban', material: 'Fine Silk' }
               ],
               footwear: [
                   { name: 'Babouche', material: 'Embroidered Leather' }
               ],
               belts: [
                   { name: 'Silver Belt', material: 'Engraved Silver' }
               ],
               accessories: [
                   { name: 'Gold Chain', material: 'Solid Gold' },
                   { name: 'Jeweled Dagger', material: 'Steel and Gems' }
               ],
               palette: MEDIEVAL_COLORS
           },
           Female: {
               garments: [
                   { name: 'Royal Kaftan', material: 'Velvet and Gold' },
                   { name: 'Aso Oke', material: 'Hand-woven Silk' }
               ],
               headgear: [
                   { name: 'Gold Gele', material: 'Gold-threaded Fabric' }
               ],
               footwear: [
                   { name: 'Beaded Shoes', material: 'Velvet and Beads' }
               ],
               belts: [
                   { name: 'Gold Belt', material: 'Gold Links' }
               ],
               accessories: [
                   { name: 'Gold Jewelry', material: 'Heavy Gold' },
                   { name: 'Coral Crown', material: 'Coral and Gold' }
               ],
               palette: MEDIEVAL_COLORS
           }
       }
   },
   [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
       poor: {
           Male: {
               garments: [
                   { name: 'Trade Cloth Shirt', material: 'Cheap Cotton' },
                   { name: 'Simple Wrapper', material: 'Plain Cloth' }
               ],
               headgear: [
                   { name: 'Knit Cap', material: 'Cotton' },
                   { name: 'None', material: 'None' }
               ],
               footwear: [
                   { name: 'Barefoot', material: 'None' }
               ],
               belts: [
                   { name: 'Cloth Strip', material: 'Cotton' }
               ],
               accessories: [
                   { name: 'Trade Beads', material: 'Glass' },
                   { name: 'None', material: 'None' }
               ],
               palette: RENAISSANCE_COLORS
           },
           Female: {
               garments: [
                   { name: 'Printed Wrapper', material: 'Dutch Wax Print' },
                   { name: 'Simple Blouse', material: 'Cotton' }
               ],
               headgear: [
                   { name: 'Head Wrap', material: 'Printed Cotton' },
                   { name: 'None', material: 'None' }
               ],
               footwear: [
                   { name: 'Barefoot', material: 'None' }
               ],
               belts: [
                   { name: 'Tied Cloth', material: 'Cotton Strip' }
               ],
               accessories: [
                   { name: 'Glass Beads', material: 'Venetian Glass' },
                   { name: 'Brass Ring', material: 'Simple Brass' }
               ],
               palette: RENAISSANCE_COLORS
           }
       },
       common: {
           Male: {
               garments: [
                   { name: 'European Jacket', material: 'Wool Blend' },
                   { name: 'Traditional Cloth', material: 'Quality Cotton' }
               ],
               headgear: [
                   { name: 'Fez', material: 'Red Felt' }
               ],
               footwear: [
                   { name: 'Leather Shoes', material: 'European Style' }
               ],
               belts: [
                   { name: 'Leather Belt', material: 'Imported Leather' }
               ],
               accessories: [
                   { name: 'Pocket Watch', material: 'Brass' },
                   { name: 'Walking Stick', material: 'Carved Wood' }
               ],
               palette: RENAISSANCE_COLORS
           },
           Female: {
               garments: [
                   { name: 'Victorian Dress', material: 'Cotton and Lace' },
                   { name: 'Kente Shawl', material: 'Traditional Weave' }
               ],
               headgear: [
                   { name: 'Elaborate Gele', material: 'Starched Cotton' }
               ],
               footwear: [
                   { name: 'Low Heels', material: 'Leather' }
               ],
               belts: [
                   { name: 'Beaded Belt', material: 'Intricate Beadwork' }
               ],
               accessories: [
                   { name: 'Gold Jewelry', material: 'Local Gold' },
                   { name: 'Cameo Brooch', material: 'Imported' }
               ],
               palette: RENAISSANCE_COLORS
           }
       },
       wealthy: {
           Male: {
               garments: [
                   { name: 'Three-piece Suit', material: 'English Wool' },
                   { name: 'Royal Kente', material: 'Silk Kente' }
               ],
               headgear: [
                   { name: 'Top Hat', material: 'Silk' }
               ],
               footwear: [
                   { name: 'Oxford Shoes', material: 'Fine Leather' }
               ],
               belts: [
                   { name: 'Gold Chain', material: 'Watch Chain' }
               ],
               accessories: [
                   { name: 'Gold Watch', material: 'Swiss Gold' },
                   { name: 'Diamond Pin', material: 'Diamonds' }
               ],
               palette: RENAISSANCE_COLORS
           },
           Female: {
               garments: [
                   { name: 'Ball Gown', material: 'Silk and Tulle' },
                   { name: 'Royal Wrapper', material: 'Gold-threaded Cloth' }
               ],
               headgear: [
                   { name: 'Jeweled Headpiece', material: 'Gold and Gems' }
               ],
               footwear: [
                   { name: 'Satin Shoes', material: 'Imported Satin' }
               ],
               belts: [
                   { name: 'Jeweled Belt', material: 'Gold and Diamonds' }
               ],
               accessories: [
                   { name: 'Diamond Set', material: 'Diamonds and Gold' },
                   { name: 'Pearl Necklace', material: 'Multiple Strands' }
               ],
               palette: RENAISSANCE_COLORS
           }
       }
   },
   [HistoricalEra.INDUSTRIAL_ERA]: {
       poor: {
           Male: {
               garments: [
                   { name: 'Work Shirt', material: 'Rough Cotton' },
                   { name: 'Khaki Shorts', material: 'Canvas' }
               ],
               headgear: [
                   { name: 'Kofia', material: 'Cotton Twill', adjectives: ['Worn'] },
                   { name: 'None', material: 'None' }
               ],
               footwear: [
                   { name: 'Barefoot', material: 'None' },
                   { name: 'Tire Sandals', material: 'Recycled Rubber' }
               ],
               belts: [
                   { name: 'Rope Belt', material: 'Sisal' }
               ],
               accessories: [
                   { name: 'None', material: 'None' }
               ],
               palette: INDUSTRIAL_COLORS
           },
           Female: {
               garments: [
                   { name: 'Print Dress', material: 'Cotton Print' },
                   { name: 'Wrapper', material: 'Wax Print' }
               ],
               headgear: [
                   { name: 'Head Scarf', material: 'Cotton' },
                   { name: 'None', material: 'None' }
               ],
               footwear: [
                   { name: 'Barefoot', material: 'None' }
               ],
               belts: [
                   { name: 'Cloth Belt', material: 'Cotton Strip' }
               ],
               accessories: [
                   { name: 'Wooden Cross', material: 'Carved Wood' },
                   { name: 'None', material: 'None' }
               ],
               palette: INDUSTRIAL_COLORS
           }
       },
       common: {
           Male: {
               garments: [
                   { name: 'Safari Suit', material: 'Cotton Drill' },
                   { name: 'Dashiki', material: 'Embroidered Cotton' }
               ],
               headgear: [
                   { name: 'Pith Helmet', material: 'Cork and Canvas' }
               ],
               footwear: [
                   { name: 'Leather Boots', material: 'Brown Leather' }
               ],
               belts: [
                   { name: 'Canvas Belt', material: 'Webbing' }
               ],
               accessories: [
                   { name: 'Wristwatch', material: 'Steel' },
                   { name: 'Sunglasses', material: 'Metal and Glass' }
               ],
               palette: INDUSTRIAL_COLORS
           },
           Female: {
               garments: [
                   { name: 'A-line Dress', material: 'Cotton Blend' },
                   { name: 'Kaba and Slit', material: 'Quality Wax Print' }
               ],
               headgear: [
                   { name: 'Pillbox Hat', material: 'Felt' }
               ],
               footwear: [
                   { name: 'Low Heels', material: 'Patent Leather' }
               ],
               belts: [
                   { name: 'Chain Belt', material: 'Metal Links' }
               ],
               accessories: [
                   { name: 'Pearl Earrings', material: 'Cultured Pearls' },
                   { name: 'Handbag', material: 'Leather' }
               ],
               palette: INDUSTRIAL_COLORS
           }
       },
       wealthy: {
           Male: {
               garments: [
                   { name: 'Tailored Suit', material: 'English Worsted' },
                   { name: 'Agbada', material: 'Swiss Lace' }
               ],
               headgear: [
                   { name: 'Homburg Hat', material: 'Fine Felt' }
               ],
               footwear: [
                   { name: 'Oxfords', material: 'Italian Leather' }
               ],
               belts: [
                   { name: 'Crocodile Belt', material: 'Genuine Crocodile' }
               ],
               accessories: [
                   { name: 'Gold Watch', material: 'Swiss Gold Watch' },
                   { name: 'Diamond Ring', material: 'Platinum and Diamonds' }
               ],
               palette: INDUSTRIAL_COLORS
           },
           Female: {
               garments: [
                   { name: 'Haute Couture', material: 'Silk and Beading' },
                   { name: 'Aso Ebi', material: 'Hand-beaded Lace' }
               ],
               headgear: [
                   { name: 'Fascinator', material: 'Feathers and Jewels' }
               ],
               footwear: [
                   { name: 'Designer Heels', material: 'Snakeskin' }
               ],
               belts: [
                   { name: 'Gold Chain Belt', material: 'Solid Gold' }
               ],
               accessories: [
                   { name: 'Diamond Set', material: 'Diamonds and Gold' },
                   { name: 'Designer Bag', material: 'Crocodile Leather' }
               ],
               palette: INDUSTRIAL_COLORS
           }
       }
   },
   [HistoricalEra.MODERN_ERA]: {
       poor: {
           Male: {
               garments: [
                   { name: 'T-shirt', material: 'Cotton', adjectives: ['Second-hand'] },
                   { name: 'Jeans', material: 'Denim', adjectives: ['Worn'] }
               ],
               headgear: [
                   { name: 'Baseball Cap', material: 'Cotton' },
                   { name: 'None', material: 'None' }
               ],
               footwear: [
                   { name: 'Plastic Sandals', material: 'PVC' },
                   { name: 'Canvas Shoes', material: 'Canvas', adjectives: ['Torn'] }
               ],
               belts: [
                   { name: 'None', material: 'None' }
               ],
               accessories: [
                   { name: 'Plastic Watch', material: 'Digital Plastic' },
                   { name: 'None', material: 'None' }
               ],
               palette: MODERN_COLORS
           },
           Female: {
               garments: [
                   { name: 'Blouse', material: 'Polyester' },
                   { name: 'Ankara Skirt', material: 'Wax Print Cotton' }
               ],
               headgear: [
                   { name: 'Headwrap', material: 'Ankara Fabric' },
                   { name: 'None', material: 'None' }
               ],
               footwear: [
                   { name: 'Flip Flops', material: 'Rubber' },
                   { name: 'Flat Shoes', material: 'Synthetic' }
               ],
               belts: [
                   { name: 'None', material: 'None' }
               ],
               accessories: [
                   { name: 'Costume Jewelry', material: 'Plastic and Metal' },
                   { name: 'Mobile Phone', material: 'Basic Phone' }
               ],
               palette: MODERN_COLORS
           }
       },
       common: {
           Male: {
               garments: [
                   { name: 'Polo Shirt', material: 'Cotton Pique' },
                   { name: 'Chinos', material: 'Cotton' }
               ],
               headgear: [
                   { name: 'Snapback', material: 'Cotton and Mesh' },
                   { name: 'None', material: 'None' }
               ],
               footwear: [
                   { name: 'Sneakers', material: 'Synthetic Leather' },
                   { name: 'Loafers', material: 'Leather' }
               ],
               belts: [
                   { name: 'Leather Belt', material: 'Genuine Leather' }
               ],
               accessories: [
                   { name: 'Smartphone', material: 'Electronics' },
                   { name: 'Steel Watch', material: 'Stainless Steel' }
               ],
               palette: MODERN_COLORS
           },
           Female: {
               garments: [
                   { name: 'Shift Dress', material: 'Crepe' },
                   { name: 'Ankara Blazer', material: 'Wax Print and Lining' }
               ],
               headgear: [
                   { name: 'Gele', material: 'Aso Oke' },
                   { name: 'None', material: 'None' }
               ],
               footwear: [
                   { name: 'Pumps', material: 'Patent Leather' },
                   { name: 'Wedges', material: 'Cork and Fabric' }
               ],
               belts: [
                   { name: 'Statement Belt', material: 'Wide Leather' }
               ],
               accessories: [
                   { name: 'Gold Set', material: '18k Gold' },
                   { name: 'Designer Handbag', material: 'Leather' }
               ],
               palette: MODERN_COLORS
           }
       },
       wealthy: {
           Male: {
               garments: [
                   { name: 'Designer Suit', material: 'Italian Wool' },
                   { name: 'Senator Wear', material: 'Premium Lace' }
               ],
               headgear: [
                   { name: 'Designer Cap', material: 'Luxury Brand' },
                   { name: 'None', material: 'None' }
               ],
               footwear: [
                   { name: 'Designer Shoes', material: 'Italian Leather' }
               ],
               belts: [
                   { name: 'Designer Belt', material: 'Exotic Leather' }
               ],
               accessories: [
                   { name: 'Luxury Watch', material: 'Rolex Gold' },
                   { name: 'Diamond Cufflinks', material: 'White Gold and Diamonds' }
               ],
               palette: MODERN_COLORS
           },
           Female: {
               garments: [
                   { name: 'Couture Gown', material: 'Haute Couture Fabric' },
                   { name: 'Aso Ebi', material: 'Hand-beaded Lace' }
               ],
               headgear: [
                   { name: 'Auto Gele', material: 'Pre-tied Luxury Fabric' },
                   { name: 'None', material: 'None' }
               ],
               footwear: [
                   { name: 'Red Bottoms', material: 'Designer Heels' }
               ],
               belts: [
                   { name: 'None', material: 'None' }
               ],
               accessories: [
                   { name: 'Diamond Set', material: 'VVS Diamonds' },
                   { name: 'Birkin Bag', material: 'Hermès Leather' }
               ],
               palette: MODERN_COLORS
           }
       }
   }
},
    NORTH_AMERICAN_PRE_COLUMBIAN: {
        [HistoricalEra.PREHISTORY]: {
            poor: {
                Male: {
                    garments: [
                        { name: 'Hide Leggings', material: 'Deer Hide' },
                        { name: 'Breechcloth', material: 'Soft Leather' }
                    ],
                    headgear: [
                        { name: 'Feather Band', material: 'Eagle Feathers' },
                        { name: 'None', material: 'None' }
                    ],
                    footwear: [
                        { name: 'Moccasins', material: 'Soft Hide' }
                    ],
                    belts: [
                        { name: 'Woven Sash', material: 'Plant Fibers' }
                    ],
                    accessories: [
                        { name: 'Bone Necklace', material: 'Animal Bone' }
                    ],
                    palette: PREHISTORIC_COLORS
                },
                Female: {
                    garments: [
                        { name: 'Hide Dress', material: 'Soft Deer Hide' },
                        { name: 'Leather Skirt', material: 'Tanned Hide' }
                    ],
                    headgear: [
                        { name: 'Beaded Band', material: 'Shell Beads' },
                        { name: 'None', material: 'None' }
                    ],
                    footwear: [
                        { name: 'Moccasins', material: 'Soft Hide' }
                    ],
                    belts: [
                        { name: 'Woven Belt', material: 'Plant Fibers' }
                    ],
                    accessories: [
                        { name: 'Shell Earrings', material: 'River Shells' }
                    ],
                    palette: PREHISTORIC_COLORS
                }
            },
            common: {
                Male: {
                    garments: [
                        { name: 'Buckskin Shirt', material: 'Buckskin' },
                        { name: 'Hide Leggings', material: 'Elk Hide' }
                    ],
                    headgear: [
                        { name: 'Feather Headdress', material: 'Hawk Feathers' },
                        { name: 'Fur Headband', material: 'Beaver Fur' }
                    ],
                    footwear: [
                        { name: 'Decorated Moccasins', material: 'Painted Hide' }
                    ],
                    belts: [
                        { name: 'Beaded Belt', material: 'Hide with Quillwork' }
                    ],
                    accessories: [
                        { name: 'Bear Claw Necklace', material: 'Bear Claws' }
                    ],
                    palette: PREHISTORIC_COLORS
                },
                Female: {
                    garments: [
                        { name: 'Decorated Dress', material: 'Painted Buckskin' },
                        { name: 'Fringed Tunic', material: 'Elk Hide' }
                    ],
                    headgear: [
                        { name: 'Beaded Headband', material: 'Turquoise Beads' },
                        { name: 'None', material: 'None' }
                    ],
                    footwear: [
                        { name: 'Beaded Moccasins', material: 'Decorated Hide' }
                    ],
                    belts: [
                        { name: 'Quillwork Belt', material: 'Porcupine Quills' }
                    ],
                    accessories: [
                        { name: 'Turquoise Earrings', material: 'Turquoise Stone' }
                    ],
                    palette: PREHISTORIC_COLORS
                }
            },
            wealthy: {
                Male: {
                    garments: [
                        { name: 'Chief Robe', material: 'Buffalo Hide', adjectives: ['Painted'] },
                        { name: 'War Shirt', material: 'Sacred Buckskin', adjectives: ['Decorated'] }
                    ],
                    headgear: [
                        { name: 'War Bonnet', material: 'Eagle Feathers' },
                        { name: 'Sacred Headdress', material: 'Golden Eagle Plumes' }
                    ],
                    footwear: [
                        { name: 'Ceremonial Moccasins', material: 'White Buckskin' }
                    ],
                    belts: [
                        { name: 'Wampum Belt', material: 'Shell Beads' }
                    ],
                    accessories: [
                        { name: 'Medicine Bundle', material: 'Sacred Items' },
                        { name: 'Eagle Bone Whistle', material: 'Eagle Bone' }
                    ],
                    palette: PREHISTORIC_COLORS
                },
                Female: {
                    garments: [
                        { name: 'Ceremonial Dress', material: 'White Buckskin', adjectives: ['Beaded'] },
                        { name: 'Elk Tooth Dress', material: 'Decorated Hide' }
                    ],
                    headgear: [
                        { name: 'Shell Crown', material: 'Abalone Shell' },
                        { name: 'Sacred Feathers', material: 'Swan Feathers' }
                    ],
                    footwear: [
                        { name: 'White Moccasins', material: 'Ermine Trim' }
                    ],
                    belts: [
                        { name: 'Silver Concho Belt', material: 'Silver and Leather' }
                    ],
                    accessories: [
                        { name: 'Turquoise Necklace', material: 'Turquoise and Silver' }
                    ],
                    palette: PREHISTORIC_COLORS
                }
            }
        },
        [HistoricalEra.ANTIQUITY]: {
            poor: {
                Male: {
                    garments: [
                        { name: 'Hide Leggings', material: 'Deer Hide' },
                        { name: 'Breechcloth', material: 'Woven Cloth' }
                    ],
                    headgear: [
                        { name: 'Simple Headband', material: 'Leather Strip' },
                        { name: 'None', material: 'None' }
                    ],
                    footwear: [
                        { name: 'Plain Moccasins', material: 'Hide' }
                    ],
                    belts: [
                        { name: 'Rope Belt', material: 'Hemp Rope' }
                    ],
                    accessories: [
                        { name: 'Clay Beads', material: 'Fired Clay' }
                    ],
                    palette: ANCIENT_COLORS
                },
                Female: {
                    garments: [
                        { name: 'Simple Dress', material: 'Woven Fibers' },
                        { name: 'Hide Skirt', material: 'Deer Hide' }
                    ],
                    headgear: [
                        { name: 'None', material: 'None' }
                    ],
                    footwear: [
                        { name: 'Soft Moccasins', material: 'Hide' }
                    ],
                    belts: [
                        { name: 'Fiber Belt', material: 'Woven Grass' }
                    ],
                    accessories: [
                        { name: 'Seed Necklace', material: 'Plant Seeds' }
                    ],
                    palette: ANCIENT_COLORS
                }
            },
            common: {
                Male: {
                    garments: [
                        { name: 'Cotton Shirt', material: 'Woven Cotton' },
                        { name: 'Leather Leggings', material: 'Tanned Hide' }
                    ],
                    headgear: [
                        { name: 'Feather Band', material: 'Turkey Feathers' },
                        { name: 'Fur Cap', material: 'Rabbit Fur' }
                    ],
                    footwear: [
                        { name: 'Decorated Moccasins', material: 'Painted Hide' }
                    ],
                    belts: [
                        { name: 'Woven Belt', material: 'Dyed Fibers' }
                    ],
                    accessories: [
                        { name: 'Copper Ornaments', material: 'Hammered Copper' }
                    ],
                    palette: ANCIENT_COLORS
                },
                Female: {
                    garments: [
                        { name: 'Woven Dress', material: 'Cotton Cloth' },
                        { name: 'Decorated Tunic', material: 'Painted Fabric' }
                    ],
                    headgear: [
                        { name: 'Bead Headband', material: 'Trade Beads' },
                        { name: 'None', material: 'None' }
                    ],
                    footwear: [
                        { name: 'Beaded Moccasins', material: 'Decorated Hide' }
                    ],
                    belts: [
                        { name: 'Sash Belt', material: 'Woven Wool' }
                    ],
                    accessories: [
                        { name: 'Shell Earrings', material: 'Polished Shell' }
                    ],
                    palette: ANCIENT_COLORS
                }
            },
            wealthy: {
                Male: {
                    garments: [
                        { name: 'Feathered Cloak', material: 'Parrot Feathers' },
                        { name: 'Painted Robe', material: 'Buffalo Hide' }
                    ],
                    headgear: [
                        { name: 'Feather Crown', material: 'Macaw Feathers' },
                        { name: 'Jade Headband', material: 'Carved Jade' }
                    ],
                    footwear: [
                        { name: 'Ornate Moccasins', material: 'Dyed Leather' }
                    ],
                    belts: [
                        { name: 'Gold Belt', material: 'Gold Plates' }
                    ],
                    accessories: [
                        { name: 'Obsidian Jewelry', material: 'Volcanic Glass' }
                    ],
                    palette: ANCIENT_COLORS
                },
                Female: {
                    garments: [
                        { name: 'Feathered Dress', material: 'Quetzal Feathers' },
                        { name: 'Ceremonial Robe', material: 'Painted Cotton' }
                    ],
                    headgear: [
                        { name: 'Jade Crown', material: 'Carved Jade' },
                        { name: 'Feather Headdress', material: 'Tropical Bird Plumes' }
                    ],
                    footwear: [
                        { name: 'Gold Sandals', material: 'Gold and Leather' }
                    ],
                    belts: [
                        { name: 'Jade Belt', material: 'Jade Links' }
                    ],
                    accessories: [
                        { name: 'Gold Earrings', material: 'Hammered Gold' }
                    ],
                    palette: ANCIENT_COLORS
                }
            }
        },
        [HistoricalEra.MEDIEVAL]: {
            poor: {
                Male: {
                    garments: [
                        { name: 'Hide Shirt', material: 'Buckskin' },
                        { name: 'Leather Leggings', material: 'Deer Hide' }
                    ],
                    headgear: [
                        { name: 'None', material: 'None' }
                    ],
                    footwear: [
                        { name: 'Simple Moccasins', material: 'Raw Hide' }
                    ],
                    belts: [
                        { name: 'Leather Thong', material: 'Rawhide' }
                    ],
                    accessories: [
                        { name: 'Bone Beads', material: 'Animal Bone' }
                    ],
                    palette: MEDIEVAL_COLORS
                },
                Female: {
                    garments: [
                        { name: 'Hide Dress', material: 'Soft Leather' }
                    ],
                    headgear: [
                        { name: 'None', material: 'None' }
                    ],
                    footwear: [
                        { name: 'Soft Moccasins', material: 'Deer Hide' }
                    ],
                    belts: [
                        { name: 'Braided Belt', material: 'Leather Strips' }
                    ],
                    accessories: [
                        { name: 'Shell Beads', material: 'River Shells' }
                    ],
                    palette: MEDIEVAL_COLORS
                }
            },
            common: {
                Male: {
                    garments: [
                        { name: 'Buckskin Tunic', material: 'Tanned Buckskin' },
                        { name: 'Fringed Leggings', material: 'Elk Hide' }
                    ],
                    headgear: [
                        { name: 'Feather Band', material: 'Eagle Feathers' },
                        { name: 'Fur Hat', material: 'Beaver Fur' }
                    ],
                    footwear: [
                        { name: 'Decorated Moccasins', material: 'Beaded Hide' }
                    ],
                    belts: [
                        { name: 'Beaded Belt', material: 'Leather with Beadwork' }
                    ],
                    accessories: [
                        { name: 'Claw Necklace', material: 'Bear Claws' }
                    ],
                    palette: MEDIEVAL_COLORS
                },
                Female: {
                    garments: [
                        { name: 'Decorated Dress', material: 'Painted Buckskin' },
                        { name: 'Fringed Shawl', material: 'Woven Wool' }
                    ],
                    headgear: [
                        { name: 'Beaded Band', material: 'Glass Beads' },
                        { name: 'None', material: 'None' }
                    ],
                    footwear: [
                        { name: 'Beaded Moccasins', material: 'Decorated Hide' }
                    ],
                    belts: [
                        { name: 'Woven Sash', material: 'Colored Fibers' }
                    ],
                    accessories: [
                        { name: 'Turquoise Earrings', material: 'Turquoise' }
                    ],
                    palette: MEDIEVAL_COLORS
                }
            },
            wealthy: {
                Male: {
                    garments: [
                        { name: 'Buffalo Robe', material: 'Painted Buffalo Hide' },
                        { name: 'War Shirt', material: 'Sacred Buckskin' }
                    ],
                    headgear: [
                        { name: 'War Bonnet', material: 'Eagle Feathers' },
                        { name: 'Horned Headdress', material: 'Buffalo Horns' }
                    ],
                    footwear: [
                        { name: 'Ceremonial Moccasins', material: 'White Buckskin' }
                    ],
                    belts: [
                        { name: 'Wampum Belt', material: 'Shell Beads' }
                    ],
                    accessories: [
                        { name: 'Peace Pipe', material: 'Sacred Redstone' }
                    ],
                    palette: MEDIEVAL_COLORS
                },
                Female: {
                    garments: [
                        { name: 'Elk Tooth Dress', material: 'Decorated Buckskin' },
                        { name: 'Ceremonial Robe', material: 'Painted Hide' }
                    ],
                    headgear: [
                        { name: 'Feather Crown', material: 'Swan Feathers' },
                        { name: 'Shell Headdress', material: 'Abalone Shell' }
                    ],
                    footwear: [
                        { name: 'White Moccasins', material: 'Ermine Fur' }
                    ],
                    belts: [
                        { name: 'Silver Belt', material: 'Silver Conchos' }
                    ],
                    accessories: [
                        { name: 'Turquoise Necklace', material: 'Turquoise and Silver' }
                    ],
                    palette: MEDIEVAL_COLORS
                }
            }
        }
    }
};

/**
 * Intelligent clothing data retrieval with comprehensive fallback system
 */
export const getClothingData = (
    culturalZone: CulturalZone,
    era: HistoricalEra,
    wealthLevel: WealthLevel,
    gender: Gender
): ClothingSet => {
    // Convert wealth level to simplified version
    const simplifiedWealth: SimplifiedWealthLevel = 
        wealthLevel === 'poor' || wealthLevel === 'modest' ? 'poor' :
        wealthLevel === 'comfortable' ? 'common' :
        'wealthy';
    
    // Special handling for North American Colonial zones - use European clothing for modern era
    let effectiveCulturalZone = culturalZone;
    if (culturalZone === 'NORTH_AMERICAN_COLONIAL' && 
        (era === HistoricalEra.INDUSTRIAL_ERA || era === HistoricalEra.MODERN_ERA)) {
        effectiveCulturalZone = 'EUROPEAN' as CulturalZone;
    }

    // Try direct lookup first
    const directData = CLOTHING_DATA[effectiveCulturalZone]?.[era]?.[simplifiedWealth]?.[gender];
    if (directData) return directData;

    // Fallback strategy 1: Try different wealth levels in same era/culture
    for (const altWealth of WEALTH_PROGRESSION[simplifiedWealth]) {
        const wealthFallback = CLOTHING_DATA[effectiveCulturalZone]?.[era]?.[altWealth]?.[gender];
        if (wealthFallback) return adaptClothingForWealth(wealthFallback, simplifiedWealth);
    }

    // Fallback strategy 2: Try similar eras in same culture
    if (ERA_PROGRESSION[era]) {
        for (const altEra of ERA_PROGRESSION[era]) {
            const eraFallback = CLOTHING_DATA[effectiveCulturalZone]?.[altEra]?.[simplifiedWealth]?.[gender];
            if (eraFallback) return adaptClothingForEra(eraFallback, era);
        }
    }

    // Fallback strategy 3: Try similar cultures in same era
    const fallbackCulture = culturalZone === 'NORTH_AMERICAN_COLONIAL' ? culturalZone : effectiveCulturalZone;
    if (CULTURAL_SIMILARITY[fallbackCulture]) {
        for (const altCulture of CULTURAL_SIMILARITY[fallbackCulture]!) {
            const cultureFallback = CLOTHING_DATA[altCulture]?.[era]?.[simplifiedWealth]?.[gender];
            if (cultureFallback) return adaptClothingForCulture(cultureFallback, culturalZone, era);
        }
    }

    // Fallback strategy 4: Try similar cultures in different eras
    if (CULTURAL_SIMILARITY[fallbackCulture] && ERA_PROGRESSION[era]) {
        for (const altCulture of CULTURAL_SIMILARITY[fallbackCulture]!) {
            for (const altEra of ERA_PROGRESSION[era]) {
                const crossCulturalFallback = CLOTHING_DATA[altCulture]?.[altEra]?.[simplifiedWealth]?.[gender];
                if (crossCulturalFallback) return adaptClothingForCulture(crossCulturalFallback, culturalZone, era);
            }
        }
    }

    // Fallback strategy 5: Try opposite gender in same context
    const oppositeGender = gender === 'Male' ? 'Female' : 'Male';
    const genderFallback = CLOTHING_DATA[effectiveCulturalZone]?.[era]?.[simplifiedWealth]?.[oppositeGender];
    if (genderFallback) return adaptClothingForGender(genderFallback, gender);

    // Fallback strategy 6: Try the most populated era for the culture
    const culturalEras = Object.keys(CLOTHING_DATA[effectiveCulturalZone] || {}) as HistoricalEra[];
    if (culturalEras.length > 0) {
        const bestEra = culturalEras[0];
        const bestEraFallback = CLOTHING_DATA[effectiveCulturalZone]?.[bestEra]?.[simplifiedWealth]?.[gender];
        if (bestEraFallback) return adaptClothingForEra(bestEraFallback, era);
    }

    // Final fallback: Generate basic clothing (which now returns None for headgear)
    return generateBasicClothing(culturalZone, era, simplifiedWealth, gender);
};

/**
 * Helper functions for material adaptation
 */
/**
 * Material quality tiers for systematic upgrades/downgrades
 */
const MATERIAL_QUALITY_TIERS = {
    // Textile materials (poor → standard → good → excellent)
    textiles: {
        poor: ['Hemp', 'Rough Wool', 'Burlap', 'Rough Linen'],
        standard: ['Cotton', 'Wool', 'Linen'],
        good: ['Fine Wool', 'Fine Linen', 'Smooth Cotton'],
        excellent: ['Silk', 'Velvet', 'Fine Silk', 'Embroidered Silk']
    },
    // Metal materials
    metals: {
        poor: ['Bone', 'Copper'],
        standard: ['Bronze', 'Iron'],
        good: ['Steel', 'Brass'],
        excellent: ['Silver', 'Gold']
    },
    // Leather materials
    leather: {
        poor: ['Raw Hide', 'Rough Leather'],
        standard: ['Leather', 'Treated Hide'],
        good: ['Fine Leather', 'Soft Leather'],
        excellent: ['Silk-lined Leather', 'Embossed Leather']
    }
};

function getMaterialCategory(material: string): string {
    const materialLower = material.toLowerCase();

    // Check each category for material match
    for (const [category, tiers] of Object.entries(MATERIAL_QUALITY_TIERS)) {
        for (const tierMaterials of Object.values(tiers)) {
            if (tierMaterials.some(m => materialLower.includes(m.toLowerCase()))) {
                return category;
            }
        }
    }

    // Default categorization based on keywords
    if (materialLower.includes('silk') || materialLower.includes('cotton') ||
        materialLower.includes('wool') || materialLower.includes('linen')) {
        return 'textiles';
    }
    if (materialLower.includes('gold') || materialLower.includes('silver') ||
        materialLower.includes('bronze') || materialLower.includes('iron')) {
        return 'metals';
    }
    if (materialLower.includes('leather') || materialLower.includes('hide')) {
        return 'leather';
    }

    return 'textiles'; // Default fallback
}

function getMaterialQualityTier(material: string): string {
    const category = getMaterialCategory(material);
    const tiers = MATERIAL_QUALITY_TIERS[category];

    const materialLower = material.toLowerCase();
    for (const [tier, materials] of Object.entries(tiers)) {
        if (materials.some(m => materialLower.includes(m.toLowerCase()))) {
            return tier;
        }
    }

    return 'standard'; // Default tier
}

function adjustMaterialQuality(material: string, targetQuality: 'poor' | 'standard' | 'good' | 'excellent'): string {
    const category = getMaterialCategory(material);
    const tiers = MATERIAL_QUALITY_TIERS[category];
    const targetMaterials = tiers[targetQuality];

    if (targetMaterials && targetMaterials.length > 0) {
        // Pick a random material from the target quality tier
        return targetMaterials[Math.floor(Math.random() * targetMaterials.length)];
    }

    return material; // Fallback to original material
}

function downgradeMaterial(material: string): string {
    const currentTier = getMaterialQualityTier(material);
    const tierOrder = ['poor', 'standard', 'good', 'excellent'];
    const currentIndex = tierOrder.indexOf(currentTier);

    if (currentIndex > 0) {
        const lowerTier = tierOrder[currentIndex - 1] as 'poor' | 'standard' | 'good' | 'excellent';
        return adjustMaterialQuality(material, lowerTier);
    }

    return material; // Already at lowest tier
}

function upgradeMaterial(material: string): string {
    const currentTier = getMaterialQualityTier(material);
    const tierOrder = ['poor', 'standard', 'good', 'excellent'];
    const currentIndex = tierOrder.indexOf(currentTier);

    if (currentIndex < tierOrder.length - 1) {
        const higherTier = tierOrder[currentIndex + 1] as 'poor' | 'standard' | 'good' | 'excellent';
        return adjustMaterialQuality(material, higherTier);
    }

    return material; // Already at highest tier
}

function getEraBasePalette(era: HistoricalEra): ClothingPalette {
    switch (era) {
        case HistoricalEra.PREHISTORY: return PREHISTORIC_COLORS;
        case HistoricalEra.ANTIQUITY: return ANCIENT_COLORS;
        case HistoricalEra.MEDIEVAL: return MEDIEVAL_COLORS;
        case HistoricalEra.RENAISSANCE_EARLY_MODERN: return RENAISSANCE_COLORS;
        case HistoricalEra.INDUSTRIAL_ERA: return INDUSTRIAL_COLORS;
        case HistoricalEra.MODERN_ERA: return MODERN_COLORS;
        default: return MEDIEVAL_COLORS;
    }
}

function getCulturalPalette(culturalZone: CulturalZone, era: HistoricalEra): ClothingPalette {
    switch (culturalZone) {
        case 'EAST_ASIAN': return EAST_ASIAN_COLORS;
        case 'MENA': return MENA_COLORS;
        case 'OCEANIA':
        case 'SUB_SAHARAN_AFRICAN':
        case 'SOUTH_AMERICAN': return TROPICAL_COLORS;
        default: return getEraBasePalette(era);
    }
}

/**
 * Adapt clothing for different wealth levels
 */
function adaptClothingForWealth(baseClothing: ClothingSet, targetWealth: SimplifiedWealthLevel): ClothingSet {
    const adapted = { ...baseClothing };
    
    if (targetWealth === 'poor') {
        // Downgrade materials and remove luxury items
        adapted.garments = adapted.garments.map(item => ({
            ...item,
            material: downgradeMaterial(item.material),
            adjectives: [...(item.adjectives || []), 'Worn', 'Patched']
        }));
        adapted.accessories = adapted.accessories.filter(item => 
            !item.material.includes('Gold') && !item.material.includes('Diamond')
        );
    } else if (targetWealth === 'wealthy') {
        // Upgrade materials and add luxury touches
        adapted.garments = adapted.garments.map(item => ({
            ...item,
            material: upgradeMaterial(item.material),
            adjectives: [...(item.adjectives || []), 'Fine', 'Ornate']
        }));
    }
    
    return adapted;
}

/**
 * Adapt clothing for different eras
 */
function adaptClothingForEra(baseClothing: ClothingSet, targetEra: HistoricalEra): ClothingSet {
    const adapted = { ...baseClothing };
    
    // Adjust color palette based on era
    switch (targetEra) {
        case HistoricalEra.PREHISTORY:
            adapted.palette = PREHISTORIC_COLORS;
            break;
        case HistoricalEra.ANTIQUITY:
            adapted.palette = ANCIENT_COLORS;
            break;
        case HistoricalEra.MEDIEVAL:
            adapted.palette = MEDIEVAL_COLORS;
            break;
        case HistoricalEra.RENAISSANCE_EARLY_MODERN:
            adapted.palette = RENAISSANCE_COLORS;
            break;
        case HistoricalEra.INDUSTRIAL_ERA:
            adapted.palette = INDUSTRIAL_COLORS;
            break;
        case HistoricalEra.MODERN_ERA:
            adapted.palette = MODERN_COLORS;
            break;
    }
    
    return adapted;
}

/**
 * Adapt clothing for different cultures
 */
function adaptClothingForCulture(
    baseClothing: ClothingSet, 
    targetCulture: CulturalZone, 
    era: HistoricalEra
): ClothingSet {
    const adapted = { ...baseClothing };
    
    // Adjust based on target culture
    switch (targetCulture) {
        case 'EAST_ASIAN':
            adapted.palette = EAST_ASIAN_COLORS;
            break;
        case 'MENA':
            adapted.palette = MENA_COLORS;
            // Prefer hijabs/turbans over generic headgear for MENA
            if (adapted.headgear && adapted.headgear.length > 0) {
                const hasAppropriate = adapted.headgear.some(h => 
                    h.name.toLowerCase().includes('hijab') || 
                    h.name.toLowerCase().includes('turban') ||
                    h.name.toLowerCase().includes('keffiyeh') ||
                    h.name.toLowerCase().includes('fez') ||
                    h.name === 'None'
                );
                if (!hasAppropriate) {
                    adapted.headgear = [{ name: 'None', material: 'None' }];
                }
            }
            break;
        case 'OCEANIA':
        case 'SUB_SAHARAN_AFRICAN':
        case 'SOUTH_AMERICAN':
            adapted.palette = TROPICAL_COLORS;
            // Tropical cultures often don't wear headgear
            if (adapted.headgear && adapted.headgear.length > 0) {
                const hasAppropriate = adapted.headgear.some(h => 
                    h.name === 'None' || 
                    h.name.toLowerCase().includes('feather') ||
                    h.name.toLowerCase().includes('flower')
                );
                if (!hasAppropriate) {
                    adapted.headgear = [{ name: 'None', material: 'None' }];
                }
            }
            break;
        default:
            adapted.palette = getEraBasePalette(era);
    }
    
    return adapted;
}

/**
 * Adapt clothing for different genders
 */
function adaptClothingForGender(baseClothing: ClothingSet, targetGender: Gender): ClothingSet {
    const adapted = { ...baseClothing };
    
    if (targetGender === 'Male') {
        // Adapt female clothing for male
        adapted.garments = adapted.garments.map(item => ({
            ...item,
            name: item.name.replace(/Dress|Gown|Skirt/, 'Tunic').replace(/Bodice/, 'Vest'),
            adjectives: (item.adjectives || []).filter(adj => adj !== 'Fitted')
        }));
    } else {
        // Adapt male clothing for female
        adapted.garments = adapted.garments.map(item => ({
            ...item,
            name: item.name.replace(/Tunic/, 'Dress').replace(/Vest/, 'Bodice'),
            adjectives: [...(item.adjectives || []), 'Fitted']
        }));
    }
    
    return adapted;
}

/**
 * Comprehensive adaptation for complete context change
 */
function adaptClothingForContext(
    baseClothing: ClothingSet,
    targetCulture: CulturalZone,
    targetEra: HistoricalEra,
    targetWealth: SimplifiedWealthLevel
): ClothingSet {
    let adapted = adaptClothingForCulture(baseClothing, targetCulture, targetEra);
    adapted = adaptClothingForEra(adapted, targetEra);
    adapted = adaptClothingForWealth(adapted, targetWealth);
    return adapted;
}

/**
 * Generate basic clothing when all fallbacks fail
 */
function generateBasicClothing(
    culturalZone: CulturalZone,
    era: HistoricalEra,
    wealthLevel: SimplifiedWealthLevel,
    gender: Gender
): ClothingSet {
    const isEarlyEra = era === HistoricalEra.PREHISTORY || era === HistoricalEra.ANTIQUITY;
    const isTropicalCulture = ['OCEANIA', 'SUB_SAHARAN_AFRICAN', 'SOUTH_AMERICAN'].includes(culturalZone);
    
    const basicMaterial = wealthLevel === 'poor' ? 
        (isEarlyEra ? 'Hide' : 'Rough Wool') :
        wealthLevel === 'common' ? 'Linen' : 'Fine Silk';
    
    const basicGarment = gender === 'Male' ? 
        (isEarlyEra ? 'Tunic' : 'Robe') :
        (isEarlyEra ? 'Dress' : 'Gown');
    
    return {
        garments: [{ name: basicGarment, material: basicMaterial }],
        headgear: [{ name: 'None', material: 'None' }], // Changed to always return None as fallback
        footwear: [{ name: isTropicalCulture ? 'Barefoot' : 'Simple Shoes', material: isTropicalCulture ? 'None' : 'Leather' }],
        belts: [{ name: 'Cord Belt', material: isEarlyEra ? 'Plant Fiber' : 'Leather' }],
        accessories: [{ name: 'Simple Ornament', material: wealthLevel === 'wealthy' ? 'Silver' : 'Wood' }],
        palette: getCulturalPalette(culturalZone, era)
    };
}

// Clothing variation mappings to reduce repetition
const CLOTHING_VARIATIONS: Record<string, { variants: string[], materials: Record<SimplifiedWealthLevel, string[]> }> = {
    'Worker Trousers': {
        variants: ['Work Pants', 'Labor Breeches', 'Factory Pants', 'Mill Trousers', 'Dock Pants', 'Workshop Bottoms', 'Industrial Trousers'],
        materials: {
            poor: ['Coarse Wool', 'Worn Cotton', 'Patched Canvas', 'Rough Denim'],
            common: ['Heavy Cotton', 'Rough Wool', 'Durable Canvas', 'Thick Denim'],
            wealthy: ['Fine Wool', 'Sturdy Cotton', 'Quality Canvas']
        }
    },
    'Factory Shirt': {
        variants: ['Work Shirt', 'Mill Top', 'Labor Tunic', 'Factory Smock', 'Workshop Shirt', 'Industrial Blouse'],
        materials: {
            poor: ['Rough Cotton', 'Worn Linen', 'Patched Wool'],
            common: ['Plain Cotton', 'Simple Linen', 'Basic Wool'],
            wealthy: ['Fine Cotton', 'Quality Linen', 'Good Wool']
        }
    },
    'Bark Wrap': {
        variants: ['Tapa Cloth', 'Grass Skirt', 'Hide Wrap', 'Leaf Covering', 'Fiber Wrap', 'Plant Weave'],
        materials: {
            poor: ['Fig Bark', 'Woven Grass', 'Raw Hide', 'Dried Leaves'],
            common: ['Beaten Bark', 'Soft Grass', 'Treated Hide', 'Woven Fibers'],
            wealthy: ['Fine Tapa', 'Silk Grass', 'Soft Leather']
        }
    },
    'Hide Skirt': {
        variants: ['Leather Skirt', 'Fur Wrap', 'Animal Hide', 'Pelt Covering', 'Skin Garment'],
        materials: {
            poor: ['Raw Hide', 'Rough Leather', 'Untreated Pelt'],
            common: ['Soft Leather', 'Treated Hide', 'Cured Pelt'],
            wealthy: ['Fine Leather', 'Supple Hide', 'Premium Fur']
        }
    },
    'Simple Tunic': {
        variants: ['Basic Shirt', 'Plain Top', 'Common Tunic', 'Work Blouse', 'Daily Wear', 'Field Shirt', 'Village Garment', 'Peasant Top', 'Labor Shirt', 'Folk Tunic', 'Roughspun Shirt', 'Homespun Top'],
        materials: {
            poor: ['Rough Wool', 'Coarse Linen', 'Hemp Cloth', 'Homespun Fabric', 'Raw Cotton'],
            common: ['Plain Wool', 'Simple Cotton', 'Basic Linen', 'Standard Cloth', 'Common Weave'],
            wealthy: ['Fine Wool', 'Good Cotton', 'Quality Linen', 'Smooth Fabric']
        }
    },
    'Tunic': {
        variants: ['Shirt', 'Blouse', 'Top', 'Jerkin', 'Vest', 'Doublet', 'Smock', 'Chemise', 'Garment', 'Upper Wear', 'Body Covering'],
        materials: {
            poor: ['Rough Cloth', 'Coarse Wool', 'Hemp', 'Burlap', 'Sackcloth'],
            common: ['Plain Cloth', 'Wool', 'Cotton', 'Linen', 'Mixed Fabric'],
            wealthy: ['Fine Cloth', 'Quality Wool', 'Silk Blend', 'Premium Linen']
        }
    },
    'Wool Tunic': {
        variants: ['Woolen Shirt', 'Fleece Top', 'Warm Tunic', 'Winter Shirt', 'Thick Blouse', 'Heavy Top', 'Cold Weather Wear'],
        materials: {
            poor: ['Rough Wool', 'Scratchy Fleece', 'Coarse Yarn'],
            common: ['Plain Wool', 'Standard Fleece', 'Common Yarn'],
            wealthy: ['Fine Wool', 'Soft Fleece', 'Quality Yarn', 'Merino']
        }
    }
};

/**
 * Get random clothing piece from a category with variations
 */
export const getRandomClothingPiece = (pieces: ClothingPiece[], wealthLevel?: SimplifiedWealthLevel): ClothingPiece => {
    if (pieces.length === 0) return { name: 'None', material: 'None' };

    const selected = pieces[Math.floor(Math.random() * pieces.length)];
    const wealth = wealthLevel || 'common';

    // Check if this piece has variations (70% chance to vary)
    const variation = CLOTHING_VARIATIONS[selected.name];
    if (variation && Math.random() < 0.7) {
        const variantName = variation.variants[Math.floor(Math.random() * variation.variants.length)];
        const variantMaterial = variation.materials[wealth][
            Math.floor(Math.random() * variation.materials[wealth].length)
        ];

        return {
            ...selected,
            name: variantName,
            material: variantMaterial
        };
    }

    return selected;
};

/**
 * Get random color from palette
 */
export const getRandomColor = (palette: ClothingPalette, category: 'primary' | 'secondary' | 'accent' = 'primary'): string => {
    const colors = palette[category];
    return colors[Math.floor(Math.random() * colors.length)];
};

/**
 * Generate complete random outfit
 */
export const generateRandomOutfit = (
    culturalZone: CulturalZone,
    era: HistoricalEra,
    wealthLevel: WealthLevel,
    gender: Gender
): {
    garment: ClothingPiece;
    headgear: ClothingPiece;
    footwear: ClothingPiece;
    belt: ClothingPiece;
    accessory: ClothingPiece;
    colors: { primary: string; secondary: string; accent: string };
} => {
    const clothingSet = getClothingData(culturalZone, era, wealthLevel, gender);
    const simplifiedWealth: SimplifiedWealthLevel =
        wealthLevel === 'poor' || wealthLevel === 'modest' ? 'poor' :
        wealthLevel === 'comfortable' ? 'common' : 'wealthy';

    return {
        garment: getRandomClothingPiece(clothingSet.garments, simplifiedWealth),
        headgear: getRandomClothingPiece(clothingSet.headgear, simplifiedWealth),
        footwear: getRandomClothingPiece(clothingSet.footwear, simplifiedWealth),
        belt: getRandomClothingPiece(clothingSet.belts, simplifiedWealth),
        accessory: getRandomClothingPiece(clothingSet.accessories, simplifiedWealth),
        colors: {
            primary: getRandomColor(clothingSet.palette, 'primary'),
            secondary: getRandomColor(clothingSet.palette, 'secondary'),
            accent: getRandomColor(clothingSet.palette, 'accent')
        }
    };
};

/**
 * Check if clothing combination is culturally appropriate
 */
export const isClothingAppropriate = (
    culturalZone: CulturalZone,
    era: HistoricalEra,
    wealthLevel: WealthLevel,
    garmentName: string
): boolean => {
    const clothingSet = getClothingData(culturalZone, era, wealthLevel, 'Male');
    const allClothingNames = [
        ...clothingSet.garments.map(g => g.name),
        ...clothingSet.headgear.map(h => h.name),
        ...clothingSet.footwear.map(f => f.name),
        ...clothingSet.belts.map(b => b.name),
        ...clothingSet.accessories.map(a => a.name)
    ];
    
    return allClothingNames.includes(garmentName);
};

/**
 * Get cultural clothing description
 */
export const getCulturalClothingDescription = (
    culturalZone: CulturalZone,
    era: HistoricalEra,
    wealthLevel: WealthLevel
): string => {
    const clothingSet = getClothingData(culturalZone, era, wealthLevel, 'Male');
    const materials = [...new Set([
        ...clothingSet.garments.map(g => g.material),
        ...clothingSet.accessories.map(a => a.material)
    ].filter(m => m !== 'None'))];
    
    const primaryMaterials = materials.slice(0, 3).join(', ');
    
    return `Typical ${era} ${culturalZone.toLowerCase().replace(/_/g, ' ')} clothing for the ${wealthLevel} class, ` +
           `featuring ${primaryMaterials} and traditional styling appropriate to the period and culture.`;
}
import { Item, ItemDefinition, ItemCategory, ItemQuality } from '../types';
import { CulturalZone, HistoricalEra } from '../types';
import { ITEM_DEFINITIONS, getItemDefinition } from '../constants/gameData/itemDefinitions';
import { v4 as uuidv4 } from 'uuid';

type ProfessionType = 'military' | 'religious' | 'herder' | 'noble' | 'civilian' | 'criminal' | 'official';

interface WeaponPool {
  [key: string]: number; // weapon baseId -> weight
}

interface MaterialColorRange {
  primary: string[];
  secondary?: string[];
}

const STICK_REPLACEMENTS: Record<string, string[]> = {
  'PREHISTORY': ['STICK', 'STICK', 'STICK'], // Will add proper weapons in Phase 3
  'ANTIQUITY': ['STICK', 'STICK', 'SWORD'],
  'MEDIEVAL': ['STICK', 'STICK', 'SWORD'],
  'RENAISSANCE_EARLY_MODERN': ['STICK', 'SWORD', 'SWORD'],
  'INDUSTRIAL_ERA': ['POLICE_BATON', 'RIFLE', 'PISTOL'],
  'MODERN_ERA': ['POLICE_BATON', 'TASER', 'NIGHTSTICK'],
  'FUTURE_ERA': ['TACTICAL_BATON', 'MULTITOOL', 'STUN_DEVICE']
};

const WALKING_IMPLEMENTS: Record<string, WeaponPool> = {
  'PREHISTORY': {
    'ATLATL': 0.3,
    'FIRE_HARDENED_SPEAR': 0.4,
    'STICK': 0.3
  },
  'ANTIQUITY': {
    'WALKING_STAFF': 0.5,
    'JAVELIN': 0.3,
    'STICK': 0.2
  },
  'MEDIEVAL': {
    'QUARTERSTAFF': 0.6,
    'WALKING_STAFF': 0.4
  },
  'RENAISSANCE_EARLY_MODERN': {
    'WALKING_CANE': 0.4,
    'RAPIER': 0.3,
    'WALKING_STAFF': 0.3
  },
  'INDUSTRIAL_ERA': {
    'WALKING_CANE': 0.6,
    'WALKING_STAFF': 0.4
  },
  'MODERN_ERA': {
    'WALKING_CANE': 0.7,
    'UMBRELLA': 0.3
  },
  'FUTURE_ERA': {
    'WALKING_CANE': 1.0
  }
};

const HERDER_TOOLS: Record<string, WeaponPool> = {
  'PREHISTORY': {
    'THROWING_STICK': 0.4,
    'CLUB': 0.3,
    'STICK': 0.3
  },
  'ANTIQUITY': {
    'SHEPHERDS_CROOK': 0.4,
    'HERDING_STAFF': 0.3,
    'SLING': 0.2,
    'ROPE': 0.1
  },
  'MEDIEVAL': {
    'SHEPHERDS_CROOK': 0.5,
    'HERDING_STAFF': 0.3,
    'SLING': 0.2
  },
  'RENAISSANCE_EARLY_MODERN': {
    'SHEPHERDS_CROOK': 0.6,
    'HERDING_STAFF': 0.4
  },
  'INDUSTRIAL_ERA': {
    'SHEPHERDS_CROOK': 0.6,
    'ROPE': 0.4
  },
  'MODERN_ERA': {
    'HERDING_STAFF': 0.5,
    'ROPE': 0.5
  },
  'FUTURE_ERA': {
    'HERDING_STAFF': 1.0
  }
};

const GUARD_WEAPONS: Record<string, WeaponPool> = {
  'PREHISTORY': {
    'CLUB': 0.6,
    'STONE_KNIFE': 0.4
  },
  'ANTIQUITY': {
    'GLADIUS': 0.3,
    'JAVELIN': 0.3,
    'SWORD': 0.2,
    'CUDGEL': 0.2
  },
  'MEDIEVAL': {
    'HALBERD': 0.3,
    'MACE': 0.3,
    'SWORD': 0.2,
    'CUDGEL': 0.2
  },
  'RENAISSANCE_EARLY_MODERN': {
    'RAPIER': 0.4,
    'WHEELLOCK_PISTOL': 0.2,
    'SWORD': 0.2,
    'BATON': 0.2
  },
  'INDUSTRIAL_ERA': {
    'POLICE_BATON': 0.5,
    'NIGHTSTICK': 0.3,
    'BATON': 0.2
  },
  'MODERN_ERA': {
    'POLICE_BATON': 0.6,
    'NIGHTSTICK': 0.4
  },
  'FUTURE_ERA': {
    'BATON': 1.0
  }
};

const MATERIAL_COLOR_RANGES: Record<string, MaterialColorRange> = {
  'iron': {
    primary: ['#434b4d', '#5a5a5a', '#2c2c2c', '#3d3d3d', '#4a4a4a'],
    secondary: ['#6b6b6b', '#383838']
  },
  'steel': {
    primary: ['#71797e', '#8a9597', '#5c6466', '#b3b3b3'],
    secondary: ['#c0c0c0', '#4a5254']
  },
  'bronze': {
    primary: ['#cd7f32', '#b08d57', '#8b6914', '#d4a574', '#9c6926'],
    secondary: ['#e5a857', '#7a5621']
  },
  'copper': {
    primary: ['#b87333', '#d2691e', '#cc6633', '#e87451', '#cb6d51'],
    secondary: ['#ff8c69', '#a0522d']
  },
  'brass': {
    primary: ['#b5a642', '#c9b037', '#d4af37', '#e1c16e', '#aa9949'],
    secondary: ['#ffd700', '#9a8034']
  },
  'gold': {
    primary: ['#ffd700', '#ffdf00', '#ffc200', '#ffb300', '#f0e68c'],
    secondary: ['#daa520', '#b8860b']
  },
  'silver': {
    primary: ['#c0c0c0', '#d3d3d3', '#e5e5e5', '#b8b8b8', '#aaa9ad'],
    secondary: ['#f5f5f5', '#909090']
  },
  'wood': {
    primary: ['#8b4513', '#966f33', '#c19a6b', '#a0522d', '#704214'],
    secondary: ['#deb887', '#5c4033']
  },
  'oak': {
    primary: ['#806517', '#b8860b', '#8b7355', '#a0826d', '#9f7648']
  },
  'pine': {
    primary: ['#8b7355', '#a68a64', '#c4a575', '#d2b48c', '#7a6449']
  },
  'leather': {
    primary: ['#704214', '#8b4513', '#3c2414', '#6f4e37', '#a0522d'],
    secondary: ['#964b00', '#5c3317']
  },
  'hide': {
    primary: ['#704214', '#5c3d2e', '#6f4518', '#8b5a2b', '#4a3728']
  },
  'cloth': {
    primary: ['#e5e5e5', '#f0f0f0', '#d3d3d3', '#c8c8c8', '#f5f5dc']
  },
  'cotton': {
    primary: ['#f0f0f0', '#faf0e6', '#fffef0', '#f5f5f5', '#e8e8e8']
  },
  'wool': {
    primary: ['#d3d3d3', '#c0c0c0', '#b8b8b8', '#e5e5e5', '#a8a8a8']
  },
  'silk': {
    primary: ['#f5f5dc', '#faebd7', '#fff8dc', '#f0e68c', '#fdf5e6']
  },
  'linen': {
    primary: ['#faf0e6', '#f5deb3', '#ffe4c4', '#f5f5dc', '#e6d6c3']
  },
  'stone': {
    primary: ['#918e85', '#808080', '#696969', '#a9a9a9', '#778899']
  },
  'flint': {
    primary: ['#2f4f4f', '#36454f', '#414a4c', '#4a4a4a', '#353839']
  },
  'bone': {
    primary: ['#fffef0', '#f8f8ff', '#faf0e6', '#ede7d9', '#e3dac9']
  },
  'obsidian': {
    primary: ['#1a1a1a', '#0d0d0d', '#262626', '#333333', '#1f1f1f']
  }
};

const CLOTHING_COLOR_PALETTES: Record<CulturalZone, Record<string, string[]>> = {
  'EUROPEAN': {
    common: ['Brown', 'Gray', 'Beige', 'Tan', 'Black', 'Blue', 'Green', 'Red', 'White', 'Russet', 'Reddish', 'Dun'],
    noble: ['Navy', 'Crimson', 'Purple', 'Forest Green', 'Gold'],
    religious: ['Black', 'White', 'Brown', 'Gray']
  },
  'EAST_ASIAN': {
    common: ['Black', 'Gray', 'Brown', 'Indigo', 'Hemp', 'Blue', 'White', 'Red', 'Yellow', 'Green'],
    noble: ['Jade', 'Crimson', 'Gold', 'Purple', 'Silk White'],
    religious: ['Saffron', 'Orange', 'Brown', 'Gray']
  },
  'SOUTH_ASIAN': {
    common: ['White', 'Brown', 'Indigo', 'Ochre', 'Hemp', 'Red', 'Yellow', 'Blue', 'Green', 'Orange'],
    noble: ['Saffron', 'Crimson', 'Gold', 'Purple', 'Emerald'],
    religious: ['Saffron', 'White', 'Orange', 'Red']
  },
  'MENA': {
    common: ['White', 'Brown', 'Black', 'Tan', 'Gray', 'Blue', 'Red', 'Green', 'Yellow', 'Indigo'],
    noble: ['Purple', 'Gold', 'Crimson', 'Emerald', 'Azure'],
    religious: ['White', 'Green', 'Black']
  },
  'SUB_SAHARAN_AFRICAN': {
    common: ['Brown', 'Red Earth', 'Ochre', 'Black', 'White', 'Blue', 'Yellow', 'Green', 'Orange', 'Red'],
    noble: ['Gold', 'Crimson', 'Purple', 'Leopard Print', 'Ivory'],
    religious: ['White', 'Red', 'Black', 'Yellow']
  },
  'LATIN_AMERICAN': {
    common: ['Brown', 'White', 'Red', 'Blue', 'Yellow', 'Green', 'Orange', 'Black', 'Tan', 'Purple'],
    noble: ['Gold', 'Jade', 'Turquoise', 'Crimson', 'Purple'],
    religious: ['White', 'Gold', 'Red', 'Black']
  },
  'OCEANIAN': {
    common: ['Brown', 'Tan', 'Black', 'White', 'Red', 'Blue', 'Yellow', 'Green', 'Orange'],
    noble: ['Red', 'Yellow', 'Black', 'White', 'Blue'],
    religious: ['Red', 'White', 'Black']
  },
  'NORTH_AMERICAN': {
    common: ['Brown', 'Tan', 'Black', 'Gray', 'White', 'Red', 'Blue', 'Green', 'Yellow', 'Orange'],
    noble: ['Turquoise', 'Red', 'Black', 'White', 'Yellow'],
    religious: ['White', 'Red', 'Black', 'Yellow']
  }
};

const QUALITY_MODIFIERS = {
  poor: { attackMod: -1, defenseMod: -1, valueMult: 0.5, durability: 50 },
  standard: { attackMod: 0, defenseMod: 0, valueMult: 1.0, durability: 100 },
  good: { attackMod: 1, defenseMod: 1, valueMult: 1.5, durability: 150 },
  excellent: { attackMod: 2, defenseMod: 2, valueMult: 3.0, durability: 200 }
};

const QUALITY_ADJECTIVES = {
  poor: ['Crude', 'Shoddy', 'Worn', 'Damaged', 'Inferior', 'Rough', 'Broken'],
  standard: ['Simple', 'Common', 'Ordinary', 'Standard', 'Plain', 'Basic', 'Regular'],
  good: ['Fine', 'Well-made', 'Sturdy', 'Quality', 'Superior', 'Solid', 'Refined'],
  excellent: ['Masterwork', 'Exceptional', 'Exquisite', 'Legendary', 'Pristine', 'Perfect', 'Flawless']
};

// Categories that should never have materials assigned
const MATERIAL_EXCLUDED_CATEGORIES = ['Food', 'Consumable', 'Document', 'Special'];

// Specific items that shouldn't get material variations
const MATERIAL_EXCLUDED_ITEMS = [
  'SALT', 'ROCK_SALT', 'SEA_SALT', 'WHETSTONE', 'INCENSE', 'CANDLES',
  'SPICE_POUCH', 'HERBS', 'MEDICINAL_HERBS', 'HERB_BUNDLE',
  // Natural projectiles (just stones, can't be metal)
  'SLING_STONE'
];

// Regional meat variants for different cultures and eras
const REGIONAL_MEAT_VARIANTS: Record<CulturalZone, Record<HistoricalEra, string[]>> = {
  'SUB_SAHARAN_AFRICAN': {
    'PREHISTORY': ['Wild Game', 'Bush Meat', 'Antelope Haunch'],
    'ANTIQUITY': ['Goat Meat', 'Zebu Beef', 'Guinea Fowl'],
    'MEDIEVAL': ['Goat Shank', 'Beef Strips', 'Bushmeat'],
    'RENAISSANCE_EARLY_MODERN': ['Dried Biltong', 'Goat Meat', 'Ostrich Meat'],
    'INDUSTRIAL_ERA': ['Biltong Strips', 'Goat Shank', 'Dried Antelope', 'Beef Chunks'],
    'MODERN_ERA': ['Beef Pieces', 'Chicken Parts', 'Dried Biltong', 'Goat Meat'],
    'FUTURE_ERA': ['Lab-grown Meat', 'Protein Chunks', 'Cultured Beef']
  },
  'EUROPEAN': {
    'PREHISTORY': ['Wild Boar', 'Venison', 'Aurochs Meat'],
    'ANTIQUITY': ['Pork', 'Mutton', 'Wild Game'],
    'MEDIEVAL': ['Salt Pork', 'Mutton Leg', 'Venison Haunch', 'Beef Joint'],
    'RENAISSANCE_EARLY_MODERN': ['Ham Hock', 'Beef Roast', 'Mutton Chop', 'Bacon'],
    'INDUSTRIAL_ERA': ['Beef Cuts', 'Pork Chops', 'Lamb Shank', 'Sausage'],
    'MODERN_ERA': ['Steak', 'Ground Beef', 'Chicken Breast', 'Pork Loin'],
    'FUTURE_ERA': ['Synthetic Meat', 'Protein Substitute', 'Cultured Steak']
  },
  'EAST_ASIAN': {
    'PREHISTORY': ['Wild Fowl', 'Fish', 'Wild Boar'],
    'ANTIQUITY': ['Duck', 'Pork Belly', 'River Fish'],
    'MEDIEVAL': ['Pork Strips', 'Duck Meat', 'Dried Fish', 'Chicken'],
    'RENAISSANCE_EARLY_MODERN': ['Char Siu', 'Peking Duck', 'Beef Slices', 'Fish Fillet'],
    'INDUSTRIAL_ERA': ['Pork Belly', 'Beef Strips', 'Chicken Parts', 'Duck'],
    'MODERN_ERA': ['Wagyu Beef', 'Pork Cutlet', 'Chicken Thigh', 'Fish Fillet'],
    'FUTURE_ERA': ['Synthetic Fish', 'Lab Wagyu', 'Protein Cubes']
  },
  'MENA': {
    'PREHISTORY': ['Wild Game', 'Gazelle', 'Wild Birds'],
    'ANTIQUITY': ['Lamb', 'Goat', 'Camel'],
    'MEDIEVAL': ['Lamb Kebab', 'Goat Meat', 'Camel Hump', 'Chicken'],
    'RENAISSANCE_EARLY_MODERN': ['Mutton', 'Lamb Shank', 'Beef Kofta', 'Pigeon'],
    'INDUSTRIAL_ERA': ['Lamb Chops', 'Beef Chunks', 'Chicken Shawarma', 'Goat'],
    'MODERN_ERA': ['Halal Beef', 'Lamb Meat', 'Chicken Parts', 'Merguez'],
    'FUTURE_ERA': ['Halal Synthetic', 'Lab Lamb', 'Cultured Protein']
  },
  'SOUTH_ASIAN': {
    'PREHISTORY': ['Wild Deer', 'Jungle Fowl', 'Wild Boar'],
    'ANTIQUITY': ['Water Buffalo', 'Goat', 'Chicken'],
    'MEDIEVAL': ['Mutton Curry Cut', 'Goat Meat', 'Chicken', 'Fish'],
    'RENAISSANCE_EARLY_MODERN': ['Mutton', 'Buffalo Meat', 'Chicken Tandoori', 'Fish Curry Cut'],
    'INDUSTRIAL_ERA': ['Mutton Pieces', 'Chicken Parts', 'Fish', 'Goat Curry Cut'],
    'MODERN_ERA': ['Halal Mutton', 'Chicken Tikka', 'Fish Fillet', 'Prawns'],
    'FUTURE_ERA': ['Plant Protein', 'Lab Mutton', 'Synthetic Chicken']
  },
  'NORTH_AMERICAN_PRE_COLUMBIAN': {
    'PREHISTORY': ['Mammoth Meat', 'Bison', 'Wild Turkey'],
    'ANTIQUITY': ['Venison', 'Turkey', 'Duck', 'Fish'],
    'MEDIEVAL': ['Buffalo Meat', 'Venison', 'Wild Turkey', 'Rabbit'],
    'RENAISSANCE_EARLY_MODERN': ['Bison Hump', 'Elk Meat', 'Turkey', 'Salmon'],
    'INDUSTRIAL_ERA': ['Buffalo Steak', 'Venison', 'Turkey', 'Fish'],
    'MODERN_ERA': ['Bison Burger', 'Venison Steak', 'Turkey', 'Salmon'],
    'FUTURE_ERA': ['Lab Bison', 'Synthetic Game', 'Cultured Protein']
  },
  'NORTH_AMERICAN_COLONIAL': {
    'PREHISTORY': ['Wild Game', 'Fish', 'Fowl'],
    'ANTIQUITY': ['Venison', 'Wild Boar', 'Turkey'],
    'MEDIEVAL': ['Salt Pork', 'Beef', 'Turkey', 'Fish'],
    'RENAISSANCE_EARLY_MODERN': ['Ham', 'Beef Jerky', 'Turkey', 'Salt Cod'],
    'INDUSTRIAL_ERA': ['Beef Steak', 'Pork Chops', 'Chicken', 'Bacon'],
    'MODERN_ERA': ['Ground Beef', 'Chicken Breast', 'Pork Ribs', 'Turkey'],
    'FUTURE_ERA': ['Beyond Meat', 'Lab Beef', 'Synthetic Protein']
  },
  'SOUTH_AMERICAN': {
    'PREHISTORY': ['Wild Game', 'Fish', 'Birds'],
    'ANTIQUITY': ['Llama', 'Guinea Pig', 'Fish'],
    'MEDIEVAL': ['Alpaca Meat', 'Cuy', 'Dried Fish', 'Wild Fowl'],
    'RENAISSANCE_EARLY_MODERN': ['Charqui', 'Guinea Pig', 'Beef', 'Fish'],
    'INDUSTRIAL_ERA': ['Beef Asado', 'Pork', 'Chicken', 'Fish'],
    'MODERN_ERA': ['Picanha', 'Churrasco', 'Chicken', 'Fish Fillet'],
    'FUTURE_ERA': ['Lab Beef', 'Synthetic Protein', 'Cultured Meat']
  },
  'OCEANIA': {
    'PREHISTORY': ['Megafauna', 'Fish', 'Shellfish'],
    'ANTIQUITY': ['Wild Boar', 'Fish', 'Sea Birds'],
    'MEDIEVAL': ['Pig', 'Fish', 'Turtle', 'Flying Fox'],
    'RENAISSANCE_EARLY_MODERN': ['Kalua Pig', 'Fish', 'Mutton Bird', 'Dugong'],
    'INDUSTRIAL_ERA': ['Mutton', 'Beef', 'Pork', 'Fish'],
    'MODERN_ERA': ['Lamb Chops', 'Beef Steak', 'Barramundi', 'Kangaroo'],
    'FUTURE_ERA': ['Lab Lamb', 'Synthetic Seafood', 'Cultured Protein']
  }
};

// Jewelry-specific quality words (for rings, necklaces, earrings, etc.)
const JEWELRY_QUALITY_WORDS: Record<ItemQuality, string[]> = {
  'poor': ['Tarnished', 'Scratched', 'Worn', 'Dull'],
  'standard': ['Simple', 'Plain'],
  'good': ['Fine', 'Polished', 'Ornate', 'Elegant'],
  'excellent': ['Exquisite', 'Jeweled', 'Masterwork', 'Brilliant']
};

// Context-appropriate quality descriptors by item category
const CATEGORY_QUALITY_WORDS: Record<ItemCategory, Record<ItemQuality, string[]>> = {
  'Material': {
    'poor': ['Impure', 'Raw', 'Low-grade'],
    'standard': ['Common', 'Regular', 'Basic'],
    'good': ['Pure', 'High-grade', 'Select'],
    'excellent': ['Pristine', 'Premium']
  },
  'Food': {
    'poor': ['Tough', 'Stale', 'Spoiled', 'Rancid', 'Old'],
    'standard': ['Common', 'Plain', 'Regular'],
    'good': ['Fresh', 'Choice', 'Select'],
    'excellent': ['Prime', 'Premium', 'Gourmet']
  },
  'Weapon': {
    'poor': ['Rusty', 'Bent'],
    'standard': ['Common', 'Standard'],
    'good': ['Fine', 'Sharp', 'Balanced', 'Quality', 'Well-made'],
    'excellent': ['Masterwork', 'Legendary', 'Exquisite', 'Perfect', 'Superior']
  },
  'Apparel': {
    'poor': ['Torn', 'Patched', 'Threadbare', 'Faded'],
    'standard': ['Plain', 'Common'],
    'good': ['Elegant', 'Stylish', 'Tailored'],
    'excellent': ['Luxurious', 'Royal', 'Regal']
  },
  'Tool': {
    'poor': ['Bent', 'Rusty', 'Chipped'],
    'standard': ['Common', 'Standard'],
    'good': ['Reliable', 'Robust', 'Dependable'],
    'excellent': ['Professional', 'Precision', 'Specialized']
  },
  'Document': {
    'poor': ['Torn', 'Faded', 'Stained', 'Weathered'],
    'standard': ['Plain', 'Common'],
    'good': ['Clear', 'Well-preserved', 'Legible'],
    'excellent': ['Illuminated', 'Mint', 'Ancient']
  },
  'Container': {
    'poor': ['Cracked', 'Leaky', 'Patched'],
    'standard': ['Plain', 'Common'],
    'good': ['Reliable', 'Secure', 'Reinforced'],
    'excellent': ['Lockable', 'Insulated', 'Waterproof']
  },
  'Special': {
    'poor': ['Strange', 'Unusual', 'Odd', 'Mysterious'],
    'standard': ['Normal', 'Common'],
    'good': ['Remarkable', 'Notable', 'Impressive'],
    'excellent': ['Mythical', 'Divine', 'Sacred']
  },
  'Consumable': {
    'poor': ['Weak', 'Diluted', 'Expired', 'Stale'],
    'standard': ['Common', 'Regular'],
    'good': ['Potent', 'Pure', 'Fresh', 'Strong'],
    'excellent': ['Premium', 'Concentrated', 'Maximum']
  },
  'Armor': {
    'poor': ['Dented', 'Rusty', 'Cracked'],
    'standard': ['Common', 'Standard'],
    'good': ['Reinforced', 'Tested', 'Battle-proven'],
    'excellent': ['Masterwork', 'Legendary', 'Perfect', 'Superior', 'Invincible']
  },
  'Ammunition': {
    'poor': ['Jagged', 'Uneven', 'Rough', 'Irregular', 'Chipped'],
    'standard': ['Smooth', 'Round', 'Common', 'Regular'],
    'good': ['Well-rounded', 'Perfectly Smooth', 'River-worn', 'Select'],
    'excellent': ['Perfectly Spherical', 'Flawless', 'Ideal', 'Perfect']
  },
  'Vessel': {
    'poor': ['Cracked', 'Leaky', 'Patched'],
    'standard': ['Plain', 'Common'],
    'good': ['Reliable', 'Watertight', 'Sealed'],
    'excellent': ['Reinforced', 'Insulated', 'Durable']
  },
  'Currency': {
    'poor': ['Clipped', 'Debased', 'Counterfeit'],
    'standard': ['Authentic', 'Common'],
    'good': ['Pure', 'Mint', 'Certified', 'Genuine'],
    'excellent': ['Pristine', 'Perfect', 'Uncirculated', 'Flawless', 'Rare']
  }
};

// Material quality variations
const MATERIAL_VARIATIONS: Record<string, Record<ItemQuality, string[]>> = {
  'iron': {
    poor: ['Pig Iron', 'Impure Iron', 'Rusty Iron', 'Low-grade Iron'],
    standard: ['Iron', 'Wrought Iron', 'Cast Iron'],
    good: ['Pure Iron', 'Refined Iron', 'Quality Iron'],
    excellent: ['Superior Iron', 'Masterwork Iron', 'Perfect Iron']
  },
  'steel': {
    poor: ['Crude Steel', 'Soft Steel', 'Inferior Steel'],
    standard: ['Steel', 'Carbon Steel', 'Mild Steel'],
    good: ['High-grade Steel', 'Tempered Steel', 'Quality Steel'],
    excellent: ['Damascus Steel', 'Folded Steel', 'Master-forged Steel']
  },
  'wood': {
    poor: ['Green Wood', 'Knotty Wood', 'Warped Wood'],
    standard: ['Seasoned Wood', 'Oak', 'Hardwood'],
    good: ['Ancient Oak', 'Heartwood', 'Selected Wood'],
    excellent: ['Thousand-year Oak', 'Sacred Wood', 'Perfect Grain']
  },
  'leather': {
    poor: ['Raw Hide', 'Stiff Leather', 'Cracked Leather'],
    standard: ['Tanned Leather', 'Worked Leather', 'Cured Hide'],
    good: ['Supple Leather', 'Fine Leather', 'Premium Hide'],
    excellent: ['Master-worked Leather', 'Perfect Hide', 'Legendary Leather']
  }
};

// Cultural style variations by material and era
const CULTURAL_STYLES: Record<CulturalZone, Record<string, string[]>> = {
  'EUROPEAN': {
    'metal': ['Norman', 'Gothic', 'Celtic', 'Viking', 'Saxon', 'Frankish'],
    'cloth': ['Flemish', 'Venetian', 'French', 'English', 'German', 'Italian'],
    'leather': ['Germanic', 'Celtic', 'Norse', 'Romance', 'Alpine', 'Iberian']
  },
  'EAST_ASIAN': {
    'metal': ['Tang', 'Song', 'Ming', 'Mongol', 'Japanese', 'Korean'],
    'cloth': ['Silk Road', 'Imperial', 'Zen', 'Confucian', 'Taoist', 'Buddhist'],
    'leather': ['Mongol', 'Manchurian', 'Tibetan', 'Steppe', 'Mountain', 'Coastal']
  },
  'MENA': {
    'metal': ['Damascus', 'Mamluk', 'Ottoman', 'Persian', 'Arabian', 'Moorish'],
    'cloth': ['Abbasid', 'Fatimid', 'Andalusian', 'Persian', 'Turkish', 'Bedouin'],
    'leather': ['Berber', 'Arabian', 'Persian', 'Turkic', 'Mesopotamian', 'Egyptian']
  },
  'SOUTH_ASIAN': {
    'metal': ['Mughal', 'Rajput', 'Tamil', 'Bengali', 'Punjabi', 'Gujarati'],
    'cloth': ['Kashmiri', 'Bengali', 'South Indian', 'Rajasthani', 'Punjabi', 'Gujarati'],
    'leather': ['Rajput', 'Mughal', 'Bengali', 'Deccan', 'Himalayan', 'Coastal']
  },
  'SUB_SAHARAN_AFRICAN': {
    'metal': ['Swahili', 'Ethiopian', 'Malian', 'Songhai', 'Akan', 'Yoruba'],
    'cloth': ['Kente', 'Hausa', 'Ethiopian', 'Swahili', 'Malian', 'Berber'],
    'leather': ['Maasai', 'Fulani', 'Ethiopian', 'Sudanese', 'Bantu', 'Saharan']
  },
  'LATIN_AMERICAN': {
    'metal': ['Aztec', 'Inca', 'Maya', 'Zapotec', 'Muisca', 'Tiwanaku'],
    'cloth': ['Andean', 'Mesoamerican', 'Amazonian', 'Patagonian', 'Caribbean', 'Mexican'],
    'leather': ['Inca', 'Aztec', 'Patagonian', 'Amazonian', 'Plains', 'Desert']
  },
  'NORTH_AMERICAN_PRE_COLUMBIAN': {
    'metal': ['Pueblo', 'Mississippian', 'Woodland', 'Arctic', 'Northwest Coast', 'Great Basin'],
    'cloth': ['Plains', 'Woodland', 'Southwest', 'Northwest', 'Arctic', 'California'],
    'leather': ['Plains', 'Eastern Woodland', 'Southwest', 'Northwest Coast', 'Arctic', 'Great Basin']
  },
  'OCEANIA': {
    'metal': ['Polynesian', 'Melanesian', 'Micronesian', 'Maori', 'Aboriginal', 'Papuan'],
    'cloth': ['Polynesian', 'Melanesian', 'Micronesian', 'Tapa', 'Barkcloth', 'Featherwork'],
    'leather': ['Polynesian', 'Aboriginal', 'Papuan', 'Island', 'Coastal', 'Mountain']
  },
  'NORTH_AMERICAN_COLONIAL': {
    'metal': ['Colonial', 'Frontier', 'Federal', 'Victorian', 'Industrial', 'Western'],
    'cloth': ['Colonial', 'Federal', 'Victorian', 'Frontier', 'Southern', 'New England'],
    'leather': ['Colonial', 'Frontier', 'Western', 'Southern', 'Mountain', 'Prairie']
  }
};

// Condition-based naming
const CONDITION_DESCRIPTORS = {
  pristine: ['Pristine', 'Mint', 'Perfect', 'Flawless', 'New'],
  excellent: ['Excellent', 'Nearly Perfect', 'Outstanding'],
  good: ['Good', 'Solid', 'Reliable', 'Dependable'],
  fair: ['Fair', 'Used', 'Serviceable', 'Functional'],
  poor: ['Poor', 'Worn', 'Weathered', 'Aged'],
  broken: ['Broken', 'Damaged', 'Cracked', 'Fractured']
};

// (Era materials definition moved to Phase 6 section below)

function weightedRandom(weights: WeaponPool): string {
  const entries = Object.entries(weights);
  const totalWeight = entries.reduce((sum, [_, weight]) => sum + weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const [item, weight] of entries) {
    random -= weight;
    if (random <= 0) return item;
  }
  
  return entries[0][0]; // Fallback
}

function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getProfessionType(profession: string): ProfessionType {
  const professionLower = profession.toLowerCase();
  
  if (['guard', 'soldier', 'warrior', 'knight', 'legionary', 'auxiliary', 'centurion', 'janissary', 'ashigaru', 'sepoy', 'mercenary'].some(p => professionLower.includes(p))) {
    return 'military';
  }
  if (['priest', 'monk', 'nun', 'friar', 'pilgrim', 'hermit', 'imam', 'rabbi', 'oracle', 'shaman'].some(p => professionLower.includes(p))) {
    return 'religious';
  }
  if (['shepherd', 'herder', 'rancher', 'cowherd', 'goatherd'].some(p => professionLower.includes(p))) {
    return 'herder';
  }
  if (['noble', 'lord', 'lady', 'king', 'queen', 'duke', 'prince', 'chief', 'sultan'].some(p => professionLower.includes(p))) {
    return 'noble';
  }
  if (['thief', 'bandit', 'pirate', 'smuggler'].some(p => professionLower.includes(p))) {
    return 'criminal';
  }
  if (['magistrate', 'governor', 'official', 'minister', 'mayor'].some(p => professionLower.includes(p))) {
    return 'official';
  }
  
  return 'civilian';
}

export function generateContextualWeapon(
  profession: string, 
  options: {
    era?: HistoricalEra;
    culture?: CulturalZone;
    socialClass?: 'common' | 'noble' | 'religious';
    privilege?: number;
  } = {}
): Item | null {
  const era = options.era || 'MEDIEVAL';
  const culture = options.culture || 'EUROPEAN';
  const privilege = options.privilege || 0.5;
  const profType = getProfessionType(profession);
  
  // Get culturally appropriate weapons first
  const culturalWeapons = getCulturallyAppropriateWeapons(culture, era);
  
  // Select appropriate weapon pool based on profession type
  let weaponPool: WeaponPool;
  
  switch (profType) {
    case 'military':
      weaponPool = GUARD_WEAPONS[era];
      break;
    case 'herder':
      weaponPool = HERDER_TOOLS[era];
      break;
    case 'religious':
    case 'civilian':
      weaponPool = WALKING_IMPLEMENTS[era];
      break;
    case 'noble':
    case 'official':
      // Higher privilege = better weapons based on era and culture
      if (privilege > 0.7) {
        const nobleWeapons = culturalWeapons.length > 0 ? culturalWeapons : Object.keys(GUARD_WEAPONS[era]);
        weaponPool = {};
        nobleWeapons.forEach(weapon => {
          if (isItemEraAppropriate(weapon, era)) {
            weaponPool[weapon] = 0.4; // Equal weight for noble weapons
          }
        });
        // Add some civilian options
        Object.keys(WALKING_IMPLEMENTS[era]).forEach(weapon => {
          if (isItemEraAppropriate(weapon, era)) {
            weaponPool[weapon] = 0.2;
          }
        });
      } else {
        weaponPool = WALKING_IMPLEMENTS[era];
      }
      break;
    case 'criminal':
      // Criminals use concealable or easily obtained weapons
      const criminalWeapons = getEraAppropriateItems(era, 'Weapon')
        .filter(item => item.name.toLowerCase().includes('knife') || 
                       item.name.toLowerCase().includes('club') ||
                       item.name.toLowerCase().includes('cudgel'))
        .map(item => item.baseId);
      
      weaponPool = {};
      criminalWeapons.forEach(weapon => {
        weaponPool[weapon] = 0.3;
      });
      
      // Add basic implements as fallback
      if (Object.keys(weaponPool).length === 0) {
        weaponPool = WALKING_IMPLEMENTS[era];
      }
      break;
    default:
      weaponPool = WALKING_IMPLEMENTS[era];
  }
  
  // Filter weapon pool to only era-appropriate items
  const filteredPool: WeaponPool = {};
  Object.keys(weaponPool).forEach(weaponId => {
    if (isItemEraAppropriate(weaponId, era)) {
      filteredPool[weaponId] = weaponPool[weaponId];
    }
  });
  
  // If no appropriate weapons found, use fallback
  if (Object.keys(filteredPool).length === 0) {
    const fallbackWeapons = getEraAppropriateItems(era, 'Weapon');
    if (fallbackWeapons.length > 0) {
      const fallbackId = fallbackWeapons[Math.floor(Math.random() * fallbackWeapons.length)].baseId;
      return generateProceduralItem(fallbackId, { culture, era, socialClass: options.socialClass });
    }
    return null;
  }
  
  // Select weapon using weighted random
  const selectedWeapon = weightedRandom(filteredPool);
  
  // Generate the weapon with full procedural variation
  return generateProceduralItem(selectedWeapon, { 
    culture, 
    era, 
    socialClass: options.socialClass,
    privilegeModifier: privilege > 0.7 ? 0.2 : 0
  });
}

// Era/Culture Gating System - Phase 6
// Materials separated by category to avoid nonsense like "ceramic tunic"
const ERA_MATERIALS_BY_CATEGORY: Record<HistoricalEra, { clothing: string[], weapons: string[], tools: string[], jewelry: string[], all: string[] }> = {
  'PREHISTORY': {
    clothing: ['Hide', 'Fur', 'Plant Fiber', 'Woven Grass'],
    weapons: ['Stone', 'Wood', 'Bone', 'Antler', 'Flint'],
    tools: ['Stone', 'Wood', 'Bone', 'Clay', 'Antler'],
    jewelry: ['Bone', 'Shell', 'Stone', 'Amber', 'Wood'],
    all: ['Stone', 'Wood', 'Bone', 'Hide', 'Antler', 'Flint', 'Clay']
  },
  'ANTIQUITY': {
    clothing: ['Linen', 'Wool', 'Leather', 'Cotton', 'Silk'],
    weapons: ['Bronze', 'Copper', 'Iron', 'Wood', 'Leather'],
    tools: ['Bronze', 'Copper', 'Iron', 'Wood', 'Stone', 'Ceramic'],
    jewelry: ['Gold', 'Silver', 'Bronze', 'Copper', 'Ivory', 'Pearl', 'Jade'],
    all: ['Bronze', 'Copper', 'Iron', 'Wood', 'Stone', 'Leather', 'Silver', 'Gold', 'Ceramic', 'Linen', 'Wool']
  },
  'MEDIEVAL': {
    clothing: ['Wool', 'Linen', 'Leather', 'Silk', 'Cotton', 'Velvet'],
    weapons: ['Iron', 'Steel', 'Wood', 'Leather'],
    tools: ['Iron', 'Steel', 'Wood', 'Silver', 'Gold'],
    jewelry: ['Gold', 'Silver', 'Iron', 'Brass', 'Pearl', 'Ruby', 'Emerald'],
    all: ['Iron', 'Steel', 'Wood', 'Leather', 'Silver', 'Gold', 'Cloth', 'Wool']
  },
  'RENAISSANCE_EARLY_MODERN': {
    clothing: ['Silk', 'Cotton', 'Wool', 'Linen', 'Velvet', 'Satin', 'Leather'],
    weapons: ['Steel', 'Iron', 'Wood', 'Gunpowder'],
    tools: ['Steel', 'Iron', 'Wood', 'Glass', 'Silver', 'Gold'],
    jewelry: ['Gold', 'Silver', 'Platinum', 'Diamond', 'Sapphire', 'Ruby', 'Pearl'],
    all: ['Steel', 'Iron', 'Wood', 'Gunpowder', 'Glass', 'Silk', 'Cotton', 'Silver', 'Gold']
  },
  'INDUSTRIAL_ERA': {
    clothing: ['Cotton', 'Wool', 'Leather', 'Denim', 'Canvas'],
    weapons: ['Steel', 'Iron', 'Brass'],
    tools: ['Steel', 'Iron', 'Brass'],
    jewelry: ['Gold', 'Silver', 'Platinum', 'Steel', 'Diamond', 'Ruby'],
    all: ['Steel', 'Iron', 'Coal', 'Brass', 'Cotton', 'Wool', 'Glass', ]
  },
  'MODERN_ERA': {
    clothing: ['Cotton', 'Polyester', 'Nylon', 'Leather', 'Denim'],
    weapons: ['Steel', 'Aluminum', 'Composite'],
    tools: ['Aluminum', 'Steel', ],
    jewelry: ['Gold', 'Silver', 'Platinum', 'Titanium', 'Diamond', 'Synthetic Ruby'],
    all: ['Aluminum', 'Plastic', 'Steel', 'Glass',]
  },
  'FUTURE_ERA': {
    clothing: ['Merino Wool', 'Recycled Polyester', 'Organic Cotton', 'Hemp', 'Bamboo Fiber'],
    weapons: ['Carbon Fiber', 'Advanced Polymers', 'Titanium Alloy', 'Kevlar'],
    tools: ['Carbon Fiber', 'Silicon', 'Graphene', 'Advanced Ceramics'],
    jewelry: ['Titanium', 'Tungsten', 'Carbon Fiber', 'Lab Diamond', 'Moissanite'],
    all: ['Polyester', 'Hemp', 'Bamboo Fiber']
  }
};

// Backwards compatibility
const ERA_MATERIALS: Record<HistoricalEra, string[]> = Object.fromEntries(
  Object.entries(ERA_MATERIALS_BY_CATEGORY).map(([era, mats]) => [era, mats.all])
) as Record<HistoricalEra, string[]>;

const FORBIDDEN_ITEMS_BY_ERA: Record<HistoricalEra, string[]> = {
  'PREHISTORY': ['SWORD', 'GLADIUS', 'CROSSBOW', 'RAPIER', 'WHEELLOCK_PISTOL', 'SCIMITAR', 'KATANA', 'FLINTLOCK_MUSKET'],
  'ANTIQUITY': ['CROSSBOW', 'RAPIER', 'WHEELLOCK_PISTOL', 'FLINTLOCK_MUSKET', 'KATANA'],
  'MEDIEVAL': ['WHEELLOCK_PISTOL', 'FLINTLOCK_MUSKET', 'ATLATL'],
  'RENAISSANCE_EARLY_MODERN': ['ATLATL'],
  'INDUSTRIAL_ERA': ['ATLATL'],
  'MODERN_ERA': ['ATLATL', 'SLING'],
  'FUTURE_ERA': ['ATLATL', 'SLING']
};

const CULTURAL_WEAPON_PREFERENCES: Record<CulturalZone, string[]> = {
  'EUROPEAN': ['SWORD', 'MACE', 'CROSSBOW', 'RAPIER', 'HALBERD'],
  'EAST_ASIAN': ['KATANA', 'NAGINATA', 'DAO_SWORD', 'COMPOSITE_BOW', 'KAMA'],
  'MENA': ['SCIMITAR', 'COMPOSITE_BOW', 'MACE', 'SPEAR', 'SWORD'],
  'SUB_SAHARAN_AFRICAN': ['ASSEGAI_SPEAR', 'KNOBKERRY', 'COMPOSITE_BOW', 'SWORD', 'MACE'],
  'NORTH_AMERICAN_PRE_COLUMBIAN': ['ATLATL', 'MACUAHUITL', 'COMPOSITE_BOW', 'CLUB', 'SPEAR'],
  'NORTH_AMERICAN_COLONIAL': ['SWORD', 'MUSKET', 'RIFLE', 'AXE', 'KNIFE'],
  'SOUTH_AMERICAN': ['ATLATL', 'MACUAHUITL', 'COMPOSITE_BOW', 'CLUB', 'SPEAR'],
  'SOUTH_ASIAN': ['SCIMITAR', 'COMPOSITE_BOW', 'MACE', 'SPEAR', 'SWORD'],
  'OCEANIA': ['CLUB', 'SPEAR', 'SLING', 'STONE_AXE', 'COMPOSITE_BOW']
};

export function getEraAppropriateItems(era: HistoricalEra, category?: ItemCategory): ItemDefinition[] {
  const forbiddenItems = FORBIDDEN_ITEMS_BY_ERA[era] || [];
  const availableMaterials = ERA_MATERIALS[era] || [];
  
  return Object.values(ITEM_DEFINITIONS)
    .filter(item => {
      // Filter by category if specified
      if (category && item.category !== category) return false;
      
      // Check if item is forbidden in this era
      if (forbiddenItems.includes(item.baseId)) return false;
      
      // Check if item's material is available in this era
      if (item.material && !availableMaterials.includes(item.material)) {
        return false;
      }
      
      // Check era availability if specified in item definition
      if (item.eraAvailability) {
        const currentYear = getEraStartYear(era);
        return currentYear >= item.eraAvailability.startYear && 
               currentYear <= item.eraAvailability.endYear;
      }
      
      return true;
    });
}

export function getCulturallyAppropriateWeapons(culture: CulturalZone, era: HistoricalEra): string[] {
  const preferredWeapons = CULTURAL_WEAPON_PREFERENCES[culture] || [];
  const eraItems = getEraAppropriateItems(era, 'Weapon');
  
  return eraItems
    .filter(item => preferredWeapons.includes(item.baseId))
    .map(item => item.baseId);
}

export function isItemEraAppropriate(itemId: string, era: HistoricalEra): boolean {
  const forbiddenItems = FORBIDDEN_ITEMS_BY_ERA[era] || [];
  return !forbiddenItems.includes(itemId);
}

export function substituteEraAppropriateMaterial(item: ItemDefinition, era: HistoricalEra): ItemDefinition {
  const availableMaterials = ERA_MATERIALS[era];
  
  if (!item.material || availableMaterials.includes(item.material)) {
    return item;
  }
  
  // Find appropriate substitute materials
  const materialSubstitutions: Record<string, Record<HistoricalEra, string>> = {
    'Steel': {
      'PREHISTORY': 'Stone',
      'ANTIQUITY': 'Bronze',
      'MEDIEVAL': 'Iron',
      'RENAISSANCE_EARLY_MODERN': 'Steel',
      'INDUSTRIAL': 'Steel',
      'MODERN': 'Steel'
    },
    'Iron': {
      'PREHISTORY': 'Stone',
      'ANTIQUITY': 'Bronze',
      'MEDIEVAL': 'Iron',
      'RENAISSANCE_EARLY_MODERN': 'Iron',
      'INDUSTRIAL': 'Iron',
      'MODERN': 'Iron'
    },
    'Gunpowder': {
      'PREHISTORY': 'Stone',
      'ANTIQUITY': 'Clay',
      'MEDIEVAL': 'Clay',
      'RENAISSANCE_EARLY_MODERN': 'Gunpowder',
      'INDUSTRIAL': 'Gunpowder',
      'MODERN': 'Gunpowder'
    }
  };
  
  const substitution = materialSubstitutions[item.material]?.[era];
  if (substitution) {
    return {
      ...item,
      material: substitution,
      name: item.name.replace(item.material, substitution)
    };
  }
  
  // If no specific substitution, use first available material
  return {
    ...item,
    material: availableMaterials[0],
    name: item.name.replace(item.material || '', availableMaterials[0])
  };
}

function getEraStartYear(era: HistoricalEra): number {
  const eraYears: Record<HistoricalEra, number> = {
    'PREHISTORY': -10000,
    'ANTIQUITY': -3000,
    'MEDIEVAL': 500,
    'RENAISSANCE_EARLY_MODERN': 1400,
    'INDUSTRIAL_ERA': 1750,
    'MODERN_ERA': 1950,
    'FUTURE_ERA': 2020
  };
  
  return eraYears[era] || 0;
}

export function getCulturalVariations(baseItem: ItemDefinition, culture: CulturalZone): ItemDefinition {
  // Placeholder for Phase 4 - will add cultural naming variations
  return baseItem;
}

export function applyMaterialVariation(item: ItemDefinition, availableMaterials: string[]): ItemDefinition {
  if (!availableMaterials.length) return item;
  
  const material = randomChoice(availableMaterials);
  return {
    ...item,
    material,
    name: item.name // Will enhance naming in Phase 4
  };
}

/**
 * Categories that should NEVER receive colors (natural items)
 */
const NO_COLOR_CATEGORIES = new Set<ItemCategory>([
  'Food',
  'Material',  // Raw materials like logs, stones
  'Consumable', // Potions, medicines
  'Document'    // Books, scrolls
]);

export function assignProceduralColors(item: Item, culture: CulturalZone, socialClass: 'common' | 'noble' | 'religious' = 'common'): Item {
  // NEVER assign colors to natural categories
  if (NO_COLOR_CATEGORIES.has(item.category)) {
    return item;
  }

  // For clothing/apparel - use cultural palettes
  if (item.category === 'Apparel' || item.category === 'Armor') {
    const palette = CLOTHING_COLOR_PALETTES[culture]?.[socialClass] || CLOTHING_COLOR_PALETTES['EUROPEAN']['common'];
    const color = randomChoice(palette);
    return {
      ...item,
      color // Just store the color, don't modify the name
    };
  }

  // For weapons - only color handles/grips, not the metal parts
  if (item.category === 'Weapon') {
    // Only add color if it has a wooden or leather handle component
    const nameLower = item.name.toLowerCase();
    if (nameLower.includes('staff') || nameLower.includes('club') ||
        nameLower.includes('bow') || nameLower.includes('spear')) {
      const handleColors = ['#8B4513', '#654321', '#3E2723']; // Brown wood colors
      return {
        ...item,
        color: randomChoice(handleColors)
      };
    }
    return item; // No color for pure metal weapons like swords
  }

  // For tools - similar to weapons, only color wooden handles
  if (item.category === 'Tool') {
    const nameLower = item.name.toLowerCase();
    if (nameLower.includes('axe') || nameLower.includes('hammer') ||
        nameLower.includes('shovel') || nameLower.includes('hoe')) {
      const handleColors = ['#8B4513', '#654321', '#3E2723'];
      return {
        ...item,
        color: randomChoice(handleColors)
      };
    }
    return item;
  }

  // For jewelry/accessories - use appropriate metallic colors
  if (item.equipmentSlot === 'necklace' || item.equipmentSlot === 'ring1' ||
      item.equipmentSlot === 'ring2' || item.equipmentSlot === 'accessory') {
    const metalColors = socialClass === 'noble' ?
      ['#FFD700', '#C0C0C0', '#B87333'] : // Gold, Silver, Copper for nobles
      ['#B87333', '#8B7355', '#A0522D']; // Copper, Bronze, Sienna for common
    return {
      ...item,
      color: randomChoice(metalColors)
    };
  }

  // For vessels - natural wood/clay colors
  if (item.category === 'Vessel') {
    const vesselColors = ['#8B4513', '#A0522D', '#CD853F', '#DEB887']; // Wood and clay colors
    return {
      ...item,
      color: randomChoice(vesselColors)
    };
  }

  // For items with materials, use material-appropriate colors
  if (item.material) {
    const materialLower = item.material.toLowerCase();

    // Skip coloring for metal materials (they have natural colors)
    if (materialLower.includes('iron') || materialLower.includes('steel') ||
        materialLower.includes('bronze') || materialLower.includes('gold') ||
        materialLower.includes('silver')) {
      return item;
    }

    // Try to get material-specific colors
    const colorRange = MATERIAL_COLOR_RANGES[materialLower];
    if (colorRange) {
      const colors = colorRange.primary;
      const selectedColor = randomChoice(colors);
      return {
        ...item,
        color: selectedColor
      };
    }
  }

  // Default: no color for unrecognized items
  return item;
}

export function generateItemQuality(privilegeModifier: number = 0): ItemQuality {
  const roll = Math.random() + privilegeModifier;
  if (roll < 0.15) return 'poor';
  if (roll < 0.70) return 'standard';
  if (roll < 0.95) return 'good';
  return 'excellent';
}

export function generateCondition(quality: ItemQuality, age: number = 0): number {
  const baseCondition = {
    'poor': 30 + Math.random() * 40, // 30-70
    'standard': 60 + Math.random() * 30, // 60-90
    'good': 75 + Math.random() * 20, // 75-95
    'excellent': 90 + Math.random() * 10 // 90-100
  }[quality];
  
  // Age reduces condition
  const ageReduction = Math.min(age * 2, 50); // Max 50 point reduction
  return Math.max(0, Math.floor(baseCondition - ageReduction));
}

export function generateAge(era: HistoricalEra): number {
  // Items can be 0-100 years old depending on era
  const maxAge = {
    'PREHISTORY': 20,
    'ANTIQUITY': 50,
    'MEDIEVAL': 100,
    'RENAISSANCE_EARLY_MODERN': 150,
    'INDUSTRIAL_ERA': 100,
    'MODERN_ERA': 50,
    'FUTURE_ERA': 10
  }[era] || 50;
  
  return Math.floor(Math.random() * maxAge);
}

export function getCulturalStyle(culture: CulturalZone, material: string): string {
  const materialCategory = getMaterialCategory(material);
  const styles = CULTURAL_STYLES[culture]?.[materialCategory] || ['Traditional', 'Local', 'Regional'];
  return randomChoice(styles);
}

function getMaterialCategory(material: string): string {
  const metalMaterials = ['iron', 'steel', 'bronze', 'copper', 'brass', 'gold', 'silver'];
  const clothMaterials = ['cotton', 'wool', 'silk', 'linen', 'hemp', 'cloth'];
  const leatherMaterials = ['leather', 'hide', 'fur', 'pelt'];

  const materialLower = material.toLowerCase();
  if (metalMaterials.includes(materialLower)) return 'metal';
  if (clothMaterials.includes(materialLower)) return 'cloth';
  if (leatherMaterials.includes(materialLower)) return 'leather';
  return 'metal'; // Default
}

function isValidMaterialForItem(material: string, itemName: string, equipmentSlot?: string): boolean {
  const materialLower = material.toLowerCase();
  const itemLower = itemName.toLowerCase();

  // Jewelry/metal items should not have textile materials
  if ((itemLower.includes('torc') || itemLower.includes('ring') ||
       equipmentSlot === 'necklace') &&
      ['wool', 'cotton', 'linen', 'silk', 'hemp'].includes(materialLower)) {
    return false;
  }

  return true;
}

export function getEraAppropriateMaterial(baseMaterial: string, era: HistoricalEra, itemCategory?: ItemCategory, equipmentSlot?: string): string {
  const eraMaterials = ERA_MATERIALS_BY_CATEGORY[era];

  // Determine which material list to use based on item category and equipment slot
  let availableMaterials: string[];

  // Check if this is jewelry (rings, necklaces, earrings, bracelets, etc.)
  const isJewelry = equipmentSlot && ['ring1', 'ring2', 'necklace', 'earring', 'bracelet'].includes(equipmentSlot);

  if (isJewelry) {
    // Jewelry should use jewelry materials (gold, silver, etc.), NOT clothing materials
    availableMaterials = eraMaterials.jewelry;
  } else if (itemCategory === 'Apparel') {
    availableMaterials = eraMaterials.clothing;
  } else if (itemCategory === 'Weapon') {
    availableMaterials = eraMaterials.weapons;
  } else if (itemCategory === 'Tool' || itemCategory === 'Material') {
    availableMaterials = eraMaterials.tools;
  } else {
    availableMaterials = eraMaterials.all;
  }

  // If base material is available in era and category, use it
  if (availableMaterials.some(m => m.toLowerCase() === baseMaterial.toLowerCase())) {
    return baseMaterial;
  }

  // Otherwise find appropriate substitute from the category-specific list
  const materialCategory = getMaterialCategory(baseMaterial);
  const substitutes = availableMaterials.filter(m => getMaterialCategory(m) === materialCategory);

  if (substitutes.length > 0) {
    return randomChoice(substitutes);
  }

  // If no substitutes in same category, just pick from available materials for that item type
  return availableMaterials.length > 0 ? randomChoice(availableMaterials) : baseMaterial;
}

export function generateMaterialVariation(material: string, quality: ItemQuality): string {
  const materialLower = material.toLowerCase();
  const variations = MATERIAL_VARIATIONS[materialLower];
  
  if (variations && variations[quality]) {
    return randomChoice(variations[quality]);
  }
  
  // Fallback to quality adjective + material
  const adjective = randomChoice(QUALITY_ADJECTIVES[quality]);
  return `${adjective} ${material}`;
}

// Item name variations to reduce repetition
const ITEM_NAME_VARIATIONS: Record<string, string[]> = {
  'Walking Staff': ['Traveling Staff', 'Pilgrim Rod', 'Wanderer Stick', 'Journey Staff', 'Trail Pole', 'Hiking Staff',],
  'Stick': ['Branch', 'Rod', 'Pole', 'Staff', 'Club', 'Cudgel', 'Switch'],
  'Quarterstaff': ['Long Stick'],
  'Herding Staff': ['Shepherd Rod', 'Cattle Stick',],
  'Walking Cane': ['Walking Stick', 'Support Stick',],
  'Worker\'s Trousers': ['Work Pants', 'Breeches', 'Hose', 'Trousers'],
  'Cotton Shirt': ['Cotton Blouse', 'Cotton Top', 'Light Shirt', 'Summer Top', 'Plain Shirt', 'Daily Shirt'],
  'Shirt': ['Blouse', 'Top', 'Garment', 'Upper Wear', 'Tunic', 'Jersey'],
  'Simple Tunic': ['Simple Tunic', 'Plain Top', 'Tunic', 'Work Blouse', 'Folk Shirt'],
  'Tunic': ['Shirt', 'Blouse', 'Tunic'],
  'Wool Tunic': ['Woolen Shirt', 'Heavy Tunic']
};

// Helper function to get regional meat name
function getRegionalMeatName(culture: CulturalZone, era: HistoricalEra): string {
  const meatVariants = REGIONAL_MEAT_VARIANTS[culture]?.[era];
  if (meatVariants && meatVariants.length > 0) {
    return randomChoice(meatVariants);
  }
  // Fallback to generic meat
  return 'Meat';
}

// Helper function to get item name variation
function getItemNameVariation(baseName: string): string {
  const variations = ITEM_NAME_VARIATIONS[baseName];
  if (variations && Math.random() < 0.6) { // 60% chance to vary
    return randomChoice(variations);
  }
  return baseName;
}

/**
 * Normalize a word for duplicate checking (removes common suffixes/prefixes)
 */
function normalizeWord(word: string): string {
  const lower = word.toLowerCase();
  // Remove common material suffixes
  return lower.replace(/en$|ern$|ine$|ish$/, '');
}

/**
 * Check if a word appears in text (with fuzzy matching)
 */
function wordAppearsIn(word: string, text: string): boolean {
  const normalizedWord = normalizeWord(word);
  const normalizedText = normalizeWord(text);

  // Exact match
  if (normalizedText.includes(normalizedWord)) return true;

  // Check if it's a substring (min 3 chars)
  if (word.length >= 3 && text.toLowerCase().includes(word.toLowerCase())) return true;

  return false;
}

/**
 * Clean duplicate words from an array of name parts
 */
function deduplicateNameParts(parts: string[]): string[] {
  const seen = new Set<string>();
  const normalized = new Set<string>();
  const result: string[] = [];

  for (const part of parts) {
    const normalizedPart = normalizeWord(part);

    // Skip if we've seen this exact word
    if (seen.has(part.toLowerCase())) continue;

    // Skip if we've seen a similar word (normalized form)
    if (normalized.has(normalizedPart) && normalizedPart.length > 3) continue;

    seen.add(part.toLowerCase());
    normalized.add(normalizedPart);
    result.push(part);
  }

  return result;
}

export function generateProceduralName(
  baseItem: ItemDefinition,
  options: {
    quality?: ItemQuality;
    condition?: number;
    culturalStyle?: string;
    material?: string;
    age?: number;
    color?: string;
    culture?: CulturalZone;
    era?: HistoricalEra;
  }
): string {
  // Safety check: ensure baseItem has required properties
  if (!baseItem || !baseItem.name || typeof baseItem.name !== 'string') {
    console.warn('generateProceduralName called with invalid baseItem:', baseItem);
    return 'Unknown Item';
  }

  // For meat items, use regional variants
  if (baseItem.baseId === 'MEAT' && options.culture && options.era) {
    const meatName = getRegionalMeatName(options.culture, options.era);
    if (options.quality && options.quality !== 'standard') {
      const foodQualityWords = CATEGORY_QUALITY_WORDS['Food']?.[options.quality] || QUALITY_ADJECTIVES[options.quality];
      const qualityWord = randomChoice(foodQualityWords);
      return `${qualityWord} ${meatName}`;
    }
    return meatName;
  }

  // Build name parts array
  const parts: string[] = [];
  const baseNameLower = baseItem.name.toLowerCase();

  // Track words already in base name to avoid duplication
  const baseNameWords = baseNameLower.split(/\s+/);

  // 1. Quality adjective (if not standard)
  if (options.quality && options.quality !== 'standard') {
    // Check if base name already has a descriptive adjective (like "Smooth Stone", "Fine Silk", etc.)
    const baseNameHasAdjective = baseNameWords.length > 1 &&
      baseNameWords.some(word => {
        // Check if any word is a common adjective
        const commonAdjectives = ['smooth', 'fine', 'rough', 'sharp', 'soft', 'hard', 'thick', 'thin',
                                   'heavy', 'light', 'pure', 'crude', 'raw', 'refined', 'polished',
                                   'simple', 'plain', 'basic', 'common', 'standard'];
        return commonAdjectives.includes(word.toLowerCase());
      });

    // Skip adding quality word if base name already has descriptive adjective
    if (!baseNameHasAdjective) {
      // Check if this is jewelry (rings, necklaces, earrings, etc.)
      const isJewelry = baseItem.equipmentSlot && ['ring1', 'ring2', 'necklace', 'earring', 'bracelet'].includes(baseItem.equipmentSlot);

      let qualityWord: string;
      if (isJewelry) {
        // Use jewelry-specific quality words
        qualityWord = randomChoice(JEWELRY_QUALITY_WORDS[options.quality]);
      } else {
        // Use category-specific or default quality words
        const categoryQualityWords = CATEGORY_QUALITY_WORDS[baseItem.category]?.[options.quality];
        qualityWord = categoryQualityWords
          ? randomChoice(categoryQualityWords)
          : randomChoice(QUALITY_ADJECTIVES[options.quality]);
      }

      // Only add if quality word isn't in base name
      if (!wordAppearsIn(qualityWord, baseItem.name)) {
        parts.push(qualityWord);
      }
    }
  }

  // 2. Color (if provided and not default)
  if (options.color && options.color !== '#8b7355') {
    const colorName = getColorName(options.color);
    if (colorName && !wordAppearsIn(colorName, baseItem.name)) {
      // Also check it's not already in parts
      if (!parts.some(p => wordAppearsIn(colorName, p))) {
        parts.push(colorName);
      }
    }
  }

  // 3. Material (if different from base and not redundant)
  if (options.material && options.material !== baseItem.material) {
    // Skip era names
    const eraNames = ['PREHISTORY', 'ANTIQUITY', 'MEDIEVAL', 'RENAISSANCE_EARLY_MODERN',
                      'INDUSTRIAL_ERA', 'MODERN_ERA', 'FUTURE_ERA'];

    if (!eraNames.includes(options.material)) {
      let shouldAddMaterial = true;

      // Check if base item's material is already in the name
      // (e.g., "Leather Waterskin" - don't add "Copper" if "Leather" is already there)
      if (baseItem.material) {
        const baseMaterialWords = baseItem.material.split(/\s+/);
        for (const baseMaterialWord of baseMaterialWords) {
          if (baseMaterialWord.length >= 3 && wordAppearsIn(baseMaterialWord, baseItem.name)) {
            // Base material is in the name, don't add a different material
            shouldAddMaterial = false;
            break;
          }
        }
      }

      // FAILSAFE: Remove duplicate material types (e.g., "silk white leather" → "white leather")
      // Common material types that shouldn't appear together
      const materialTypes = ['silk', 'leather', 'wool', 'linen', 'cotton', 'velvet', 'satin',
                             'felt', 'fur', 'hide', 'iron', 'steel', 'bronze', 'copper', 'gold',
                             'silver', 'brass', 'wood', 'stone', 'clay', 'glass'];
      const materialWords = options.material.toLowerCase().split(/\s+/);
      const foundMaterials = materialWords.filter(word => materialTypes.includes(word));

      // If multiple material types found, keep only the last one (most specific)
      let cleanedMaterial = options.material;
      if (foundMaterials.length > 1) {
        // Remove all but the last material type
        const materialsToRemove = foundMaterials.slice(0, -1);
        let materialWordsList = options.material.split(/\s+/);
        materialWordsList = materialWordsList.filter(word =>
          !materialsToRemove.includes(word.toLowerCase())
        );
        cleanedMaterial = materialWordsList.join(' ');
      }

      // Check if material itself contains quality words (to avoid "Exceptional Premium Stone")
      // Strip out quality words from material if present
      const qualityWords = ['exceptional', 'premium', 'masterwork', 'exquisite', 'legendary',
                            'pristine', 'perfect', 'flawless', 'superior', 'fine', 'quality',
                            'select', 'choice', 'prime', 'gourmet'];
      const materialWordsFiltered = cleanedMaterial.split(/\s+/);

      // If material contains a quality word, remove it to avoid duplication
      const filteredMaterialWords = materialWordsFiltered.filter(word =>
        !qualityWords.includes(word.toLowerCase())
      );

      if (filteredMaterialWords.length < materialWordsFiltered.length) {
        cleanedMaterial = filteredMaterialWords.join(' ');
        // If we stripped out all words, don't add the material
        if (cleanedMaterial.trim() === '') {
          shouldAddMaterial = false;
        }
      }

      // Check each word of the cleaned material
      if (shouldAddMaterial && cleanedMaterial) {
        const cleanedMaterialWords = cleanedMaterial.split(/\s+/);
        for (const materialWord of cleanedMaterialWords) {
          // Skip if any significant word (3+ chars) is already in base name
          if (materialWord.length >= 3 && wordAppearsIn(materialWord, baseItem.name)) {
            shouldAddMaterial = false;
            break;
          }
          // Skip if already in parts (including color)
          if (parts.some(p => wordAppearsIn(materialWord, p))) {
            shouldAddMaterial = false;
            break;
          }
        }
      }

      if (shouldAddMaterial && cleanedMaterial) {
        parts.push(cleanedMaterial);
      }
    }
  }

  // 4. Get base item name (with possible variation)
  let finalName = baseItem.name;

  // Apply variations to common repetitive items
  const needsVariation = ['Walking Staff', 'Stick', 'Worker\'s Trousers', 'Simple Tunic',
                         'Tunic', 'Cotton Shirt', 'Wool Tunic', 'Shirt'].includes(baseItem.name);

  if (needsVariation) {
    finalName = getItemNameVariation(baseItem.name);
  }

  // 5. Final deduplication check
  // Remove any words from parts that appear in finalName
  const cleanedParts = parts.filter(part => {
    const partWords = part.split(/\s+/);
    return !partWords.every(word => wordAppearsIn(word, finalName));
  });

  // Add final name
  cleanedParts.push(finalName);

  // One more pass to remove any lingering duplicates
  const allWords = cleanedParts.join(' ').split(/\s+/);
  const dedupedWords = deduplicateNameParts(allWords);

  // SAFETY NET: Final check for repeated words in the output
  // This catches any duplicates that slipped through earlier checks
  const finalOutput = dedupedWords.join(' ');
  const words = finalOutput.split(/\s+/);
  const uniqueWords: string[] = [];
  const seen = new Set<string>();

  for (const word of words) {
    const wordLower = word.toLowerCase();
    if (!seen.has(wordLower)) {
      uniqueWords.push(word);
      seen.add(wordLower);
    }
  }

  return uniqueWords.join(' ');
}

// Helper to convert hex colors to names
function getColorName(color: string): string | null {
  const colorMap: Record<string, string> = {
    '#001f3f': 'Navy',
    '#4169e1': 'Blue',
    '#dc143c': 'Crimson',
    '#228b22': 'Green',
    '#ffd700': 'Gold',
    '#800080': 'Purple',
    '#1a1a1a': 'Black',
    '#f8f8f8': 'White',
    '#808080': 'Gray',
    '#c0c0c0': 'Silver',
    '#cd7f32': 'Bronze',
    '#b87333': 'Copper',
    '#8b4513': 'Brown',
    '#d2b48c': 'Tan',
    '#ff8c00': 'Orange',
    '#ffc0cb': 'Pink'
  };
  
  // Check if it's already a color name
  if (!color.startsWith('#')) {
    return color.charAt(0).toUpperCase() + color.slice(1);
  }
  
  // Look up hex color
  return colorMap[color.toLowerCase()] || null;
}

function getConditionCategory(condition: number): keyof typeof CONDITION_DESCRIPTORS {
  if (condition >= 95) return 'pristine';
  if (condition >= 85) return 'excellent';
  if (condition >= 70) return 'good';
  if (condition >= 50) return 'fair';
  if (condition >= 25) return 'poor';
  return 'broken';
}

export function applyQualityModifiers(item: Item, quality: ItemQuality): Item {
  const mods = QUALITY_MODIFIERS[quality];
  
  return {
    ...item,
    quality,
    // DON'T modify the name here - it's already handled in generateProceduralName
    attack: (item.attack || 0) + mods.attackMod,
    defense: (item.defense || 0) + mods.defenseMod,
    value: Math.floor(item.value * mods.valueMult),
    condition: mods.durability
  };
}

// Cache for deterministic base properties (NOT complete items)
// This caches only the parts that don't change: materials, cultural styles, etc.
interface CachedBaseProperties {
  baseItem: ItemDefinition;
  eraAppropriateMaterial?: string;
  culturalStyle?: string;
  shouldHaveMaterial: boolean;
}

const PROCEDURAL_CACHE = new Map<string, CachedBaseProperties>();
const CACHE_MAX_SIZE = 1000; // Limit cache size to prevent memory issues

function createCacheKey(
  baseItemId: string,
  options: {
    culture?: CulturalZone;
    era?: HistoricalEra;
    quality?: ItemQuality;
    forceColor?: string;
    socialClass?: 'common' | 'noble' | 'religious';
    privilegeModifier?: number;
  }
): string {
  // Create deterministic cache key from options
  const parts = [
    baseItemId,
    options.culture || 'NONE',
    options.era || 'NONE',
    options.quality || 'NONE',
    options.forceColor || 'NONE',
    options.socialClass || 'NONE',
    (options.privilegeModifier || 0).toString()
  ];
  return parts.join('|');
}

/**
 * Create cache key for deterministic base properties only
 * Excludes random variations like quality, age, condition
 */
function createDeterministicCacheKey(
  baseItemId: string,
  options: {
    culture?: CulturalZone;
    era?: string;
    socialClass?: 'common' | 'noble' | 'religious';
  }
): string {
  // Only include properties that affect base material/style selection
  const parts = [
    baseItemId,
    options.culture || 'NONE',
    options.era || 'MEDIEVAL',
    options.socialClass || 'NONE'
  ];
  return parts.join('|');
}

function clearCacheIfNeeded(): void {
  if (PROCEDURAL_CACHE.size > CACHE_MAX_SIZE) {
    // Clear oldest 50% of entries (simple LRU approximation)
    const entries = Array.from(PROCEDURAL_CACHE.entries());
    const toKeep = entries.slice(Math.floor(entries.length / 2));
    PROCEDURAL_CACHE.clear();
    toKeep.forEach(([key, value]) => PROCEDURAL_CACHE.set(key, value));
  }
}

/**
 * Generate only deterministic base properties that can be cached
 * This includes: era-appropriate materials, cultural styles, base stats
 * Excludes: quality, condition, age (which should vary per instance)
 */
function generateBaseProperties(
  baseItem: ItemDefinition,
  options: {
    culture?: CulturalZone;
    era?: string;
    socialClass?: 'common' | 'noble' | 'religious';
  }
): CachedBaseProperties {
  const era = options.era || 'MEDIEVAL';

  // CRITICAL FIX: Create a deep clone to ensure we don't modify the original
  // This prevents cache corruption where modified items get stored
  const baseItemClone: ItemDefinition = JSON.parse(JSON.stringify(baseItem));

  // Determine if item should have materials
  const shouldHaveMaterial = !MATERIAL_EXCLUDED_CATEGORIES.includes(baseItemClone.category) &&
                            !MATERIAL_EXCLUDED_ITEMS.includes(baseItemClone.baseId || '') &&
                            (baseItemClone.material || baseItemClone.category === 'Weapon' ||
                             baseItemClone.category === 'Apparel' || baseItemClone.category === 'Armor');

  let eraAppropriateMaterial: string | undefined;
  let culturalStyle: string | undefined;

  if (shouldHaveMaterial && baseItemClone.material) {
    // Get era-appropriate material (deterministic based on era/category/slot)
    const baseMaterial = baseItemClone.material;
    eraAppropriateMaterial = getEraAppropriateMaterial(
      baseMaterial,
      era as HistoricalEra,
      baseItemClone.category,
      baseItemClone.equipmentSlot
    );

    // Validate the substituted material
    if (!isValidMaterialForItem(eraAppropriateMaterial, baseItemClone.name, baseItemClone.equipmentSlot)) {
      eraAppropriateMaterial = baseMaterial;
    }

    // Get cultural style (deterministic based on culture/material)
    if (options.culture) {
      culturalStyle = getCulturalStyle(options.culture, eraAppropriateMaterial);
    }
  }

  // Return cached base properties with the cloned item
  return {
    baseItem: baseItemClone,
    eraAppropriateMaterial: eraAppropriateMaterial || baseItemClone.material || undefined,
    culturalStyle,
    shouldHaveMaterial
  };
}

export function generateProceduralItem(
  baseItemId: string,
  options: {
    culture?: CulturalZone;
    era?: HistoricalEra;
    quality?: ItemQuality;
    forceColor?: string;
    socialClass?: 'common' | 'noble' | 'religious';
    privilegeModifier?: number;
  } = {}
): Item | null {
  const baseItem = getItemDefinition(baseItemId);
  if (!baseItem) {
    console.warn(`generateProceduralItem: Could not find item definition for "${baseItemId}"`);
    return null;
  }

  // Additional safety check for valid item structure
  if (!baseItem.name || !baseItem.category) {
    console.warn(`generateProceduralItem: Invalid item definition for "${baseItemId}"`, baseItem);
    return null;
  }

  // Separate deterministic base properties from random variations
  // Cache key should only include deterministic inputs that affect base properties
  const deterministicOptions = {
    culture: options.culture,
    era: options.era || 'MEDIEVAL',
    socialClass: options.socialClass,
    // Note: We DON'T include quality, age, or condition in cache key
    // because these should vary per item instance
  };

  const cacheKey = createDeterministicCacheKey(baseItemId, deterministicOptions);
  let baseProperties = PROCEDURAL_CACHE.get(cacheKey);

  if (!baseProperties) {
    // Generate only the deterministic base properties that can be cached
    baseProperties = generateBaseProperties(baseItem, deterministicOptions);
    PROCEDURAL_CACHE.set(cacheKey, baseProperties);
    clearCacheIfNeeded();
  }

  // Now apply random variations that should NOT be cached
  const privilege = options.privilegeModifier || (options.socialClass === 'noble' ? 0.3 : 0);
  const quality = options.quality || generateItemQuality(privilege);
  const era = options.era || 'MEDIEVAL';
  const age = generateAge(era);
  const condition = generateCondition(quality, age);

  // FAILSAFE: Clean duplicate materials from material string
  const cleanMaterialString = (material: string | undefined): string => {
    // Handle undefined/null materials
    if (!material) return '';

    const materialTypes = ['silk', 'leather', 'wool', 'linen', 'cotton', 'velvet', 'satin',
                           'felt', 'fur', 'hide', 'iron', 'steel', 'bronze', 'copper', 'gold',
                           'silver', 'brass', 'wood', 'stone', 'clay', 'glass'];
    const materialWords = material.toLowerCase().split(/\s+/);
    const foundMaterials = materialWords.filter(word => materialTypes.includes(word));

    // If multiple material types found, keep only the last one (most specific)
    if (foundMaterials.length > 1) {
      const materialsToRemove = foundMaterials.slice(0, -1);
      let originalWords = material.split(/\s+/);
      originalWords = originalWords.filter(word =>
        !materialsToRemove.includes(word.toLowerCase())
      );
      return originalWords.join(' ');
    }
    return material;
  };

  // Create item instance combining cached base properties with random variations
  let item: Item = {
    ...baseProperties.baseItem,
    id: `item-${uuidv4()}`,
    quantity: 1,
    quality,  // Random per instance
    condition,  // Random per instance
    culturalStyle: baseProperties.culturalStyle,  // From cache
    age,  // Random per instance
    material: cleanMaterialString(baseProperties.eraAppropriateMaterial)  // From cache, cleaned
  };
  
  // Apply colors FIRST so we can use them in the name
  if (options.forceColor) {
    item.color = options.forceColor;
  } else if (options.culture) {
    item = assignProceduralColors(item, options.culture, options.socialClass);
  }
  
  // Generate procedural name with color, culture, and era
  item.name = generateProceduralName(baseProperties.baseItem, {
    quality,
    material: baseProperties.shouldHaveMaterial ? baseProperties.eraAppropriateMaterial : undefined,
    color: item.color,
    culture: options.culture,
    era: era
  });
  
  // Apply quality modifiers to stats (but not name)
  if (quality) {
    item = applyQualityModifiers(item, quality);
  }
  
  // Apply condition effects (condition affects value and performance)
  if (condition < 100) {
    const conditionMultiplier = condition / 100;
    item.value = Math.floor(item.value * conditionMultiplier);
    if (condition < 50) {
      // Very poor condition reduces attack/defense
      item.attack = Math.max(1, Math.floor(item.attack * conditionMultiplier));
      if (item.defense) {
        item.defense = Math.max(0, Math.floor(item.defense * conditionMultiplier));
      }
    }
  }

  return item;
}

export function getMaterialColorHex(material: string): string {
  const materialLower = material.toLowerCase();
  const colorRange = MATERIAL_COLOR_RANGES[materialLower];
  if (colorRange) {
    return randomChoice(colorRange.primary);
  }
  return '#8b7355'; // Default brownish
}

export function getDiverseStartingWeapon(profession: string, era: HistoricalEra, culture: CulturalZone): string {
  // This is the main function to replace STICK in starting packages
  const contextualWeapon = generateContextualWeapon(profession, {
    era,
    culture,
    socialClass: 'common'
  });
  
  // Extract baseId from the generated item, or use fallback
  let weaponId = 'STICK';
  if (contextualWeapon) {
    weaponId = contextualWeapon.baseId;
  }
  
  // Until Phase 3 adds new weapons, we'll return existing ones
  if (weaponId === 'STICK') {
    // Try to return something more appropriate when possible
    const profType = getProfessionType(profession);
    if (profType === 'military' && getItemDefinition('SWORD')) {
      return 'SWORD';
    }
    if (profType === 'herder' && getItemDefinition('ROPE')) {
      return 'ROPE';
    }
  }
  
  return weaponId;
}

export function generateVariedLoot(
  baseItemIds: string[], 
  options: {
    culture: CulturalZone;
    era: HistoricalEra;
    privilege: number;
    quantity?: number;
  }
): Item[] {
  const loot: Item[] = [];
  const quantity = options.quantity || baseItemIds.length;
  
  for (let i = 0; i < quantity; i++) {
    const baseId = randomChoice(baseItemIds);
    const item = generateProceduralItem(baseId, {
      culture: options.culture,
      era: options.era,
      privilegeModifier: options.privilege,
      socialClass: options.privilege > 0.7 ? 'noble' : 'common'
    });
    
    if (item) {
      loot.push(item);
    }
  }
  
  return loot;
}

export function generateCrafterSignature(): string {
  const firstNames = [
    'Aldric', 'Bjorn', 'Cedric', 'Duncan', 'Edwin', 'Finn', 'Gareth', 'Harald',
    'Kael', 'Magnus', 'Ragnar', 'Sven', 'Thorvald', 'Willem', 'Aldwin', 'Brynn'
  ];
  
  const crafterTitles = [
    'Smith', 'Wright', 'Maker', 'Forger', 'Crafter', 'Master', 'Artisan'
  ];
  
  return `${randomChoice(firstNames)} the ${randomChoice(crafterTitles)}`;
}

export function addCrafterSignature(item: Item): Item {
  if (item.quality === 'excellent' && Math.random() < 0.3) {
    const crafterName = generateCrafterSignature();
    return {
      ...item,
      crafterName: crafterName,
      name: `${item.name} (by ${crafterName})`
    };
  }
  return item;
}

export function applyColorsToAllItems(
  items: Item[], 
  culture: CulturalZone, 
  privilege: number = 0.5
): Item[] {
  const socialClass = privilege > 0.7 ? 'noble' : privilege > 0.3 ? 'common' : 'common';
  
  return items.map(item => {
    // Skip if item already has a color
    if (item.color) return item;
    
    // Apply procedural colors
    return assignProceduralColors(item, culture, socialClass);
  });
}

/**
 * UNIFIED item generation function - replaces both createColoredItemInstance and createItemInstance
 * Provides consistent item generation with optional cultural and historical context
 */
export function generateItem(
  baseItemId: string,
  options: {
    culture?: CulturalZone;
    era?: HistoricalEra;
    privilege?: number;
    forceColor?: string;
    quality?: ItemQuality;
  } = {}
): Item | null {
  const baseItem = getItemDefinition(baseItemId);
  if (!baseItem) return null;

  // Determine social class from privilege
  const privilege = options.privilege ?? 0.5;
  const socialClass = privilege > 0.7 ? 'noble' : privilege > 0.3 ? 'common' : 'common';

  // Generate the item with full procedural variation
  return generateProceduralItem(baseItemId, {
    culture: options.culture,
    era: options.era,
    quality: options.quality,
    forceColor: options.forceColor,
    socialClass,
    privilegeModifier: privilege > 0.7 ? 0.2 : 0
  });
}

// Backward compatibility aliases - will be removed in future version
export function createColoredItemInstance(
  baseItemId: string,
  culture: CulturalZone,
  privilege: number = 0.5,
  era?: HistoricalEra
): Item | null {
  return generateItem(baseItemId, { culture, era, privilege });
}

export function ensureItemHasColor(item: Item, culture: CulturalZone, privilege: number = 0.5): Item {
  // Skip if item already has a color
  if (item.color) return item;

  // Use the improved color assignment logic
  const socialClass = privilege > 0.7 ? 'noble' : privilege > 0.3 ? 'common' : 'common';
  return assignProceduralColors(item, culture, socialClass);
}
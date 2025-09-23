import { Item, ItemDefinition, ItemCategory, ItemQuality } from '../types';
import { CulturalZone, HistoricalEra } from '../types';
import { ITEM_DEFINITIONS } from '../constants/gameData/itemDefinitions';
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
  'SPICE_POUCH', 'HERBS', 'MEDICINAL_HERBS', 'HERB_BUNDLE'
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

// Context-appropriate quality descriptors by item category
const CATEGORY_QUALITY_WORDS: Record<ItemCategory, Record<ItemQuality, string[]>> = {
  'Material': {
    'poor': ['Impure', 'Crude', 'Raw', 'Low-grade', 'Inferior'],
    'standard': ['Common', 'Regular', 'Basic', 'Standard', 'Plain'],
    'good': ['Pure', 'Refined', 'Quality', 'High-grade', 'Select'],
    'excellent': ['Pristine', 'Perfect', 'Superior', 'Premium', 'Flawless']
  },
  'Food': {
    'poor': ['Tough', 'Stale', 'Spoiled', 'Rancid', 'Old'],
    'standard': ['Common', 'Plain', 'Regular', 'Simple', 'Basic'],
    'good': ['Fresh', 'Choice', 'Select', 'Quality', 'Fine'],
    'excellent': ['Prime', 'Premium', 'Gourmet', 'Exceptional', 'Perfect']
  },
  'Weapon': {
    'poor': ['Crude', 'Rusty', 'Bent', 'Damaged', 'Worn'],
    'standard': ['Common', 'Standard', 'Basic', 'Simple', 'Regular'],
    'good': ['Fine', 'Sharp', 'Balanced', 'Quality', 'Well-made'],
    'excellent': ['Masterwork', 'Legendary', 'Exquisite', 'Perfect', 'Superior']
  },
  'Apparel': {
    'poor': ['Torn', 'Patched', 'Threadbare', 'Worn', 'Faded'],
    'standard': ['Common', 'Plain', 'Simple', 'Basic', 'Regular'],
    'good': ['Fine', 'Well-made', 'Quality', 'Elegant', 'Stylish'],
    'excellent': ['Exquisite', 'Luxurious', 'Masterwork', 'Royal', 'Perfect']
  },
  'Tool': {
    'poor': ['Crude', 'Worn', 'Bent', 'Rusty', 'Damaged'],
    'standard': ['Common', 'Standard', 'Basic', 'Simple', 'Regular'],
    'good': ['Fine', 'Sturdy', 'Well-made', 'Quality', 'Reliable'],
    'excellent': ['Masterwork', 'Professional', 'Perfect', 'Superior', 'Precision']
  },
  'Document': {
    'poor': ['Torn', 'Faded', 'Stained', 'Damaged', 'Weathered'],
    'standard': ['Common', 'Plain', 'Simple', 'Basic', 'Regular'],
    'good': ['Fine', 'Clear', 'Well-preserved', 'Quality', 'Legible'],
    'excellent': ['Pristine', 'Illuminated', 'Perfect', 'Masterwork', 'Mint']
  },
  'Container': {
    'poor': ['Cracked', 'Leaky', 'Worn', 'Damaged', 'Patched'],
    'standard': ['Common', 'Plain', 'Simple', 'Basic', 'Regular'],
    'good': ['Sturdy', 'Well-made', 'Quality', 'Solid', 'Reliable'],
    'excellent': ['Masterwork', 'Perfect', 'Superior', 'Exquisite', 'Flawless']
  },
  'Special': {
    'poor': ['Strange', 'Unusual', 'Odd', 'Mysterious', 'Worn'],
    'standard': ['Common', 'Regular', 'Normal', 'Basic', 'Plain'],
    'good': ['Remarkable', 'Notable', 'Impressive', 'Fine', 'Quality'],
    'excellent': ['Legendary', 'Mythical', 'Divine', 'Sacred', 'Perfect']
  },
  'Consumable': {
    'poor': ['Weak', 'Diluted', 'Expired', 'Stale', 'Inferior'],
    'standard': ['Common', 'Regular', 'Basic', 'Standard', 'Plain'],
    'good': ['Potent', 'Pure', 'Quality', 'Fresh', 'Strong'],
    'excellent': ['Perfect', 'Premium', 'Superior', 'Exceptional', 'Pristine']
  },
  'Armor': {
    'poor': ['Dented', 'Rusty', 'Cracked', 'Worn', 'Damaged'],
    'standard': ['Common', 'Standard', 'Basic', 'Simple', 'Regular'],
    'good': ['Fine', 'Sturdy', 'Well-made', 'Quality', 'Solid'],
    'excellent': ['Masterwork', 'Legendary', 'Perfect', 'Superior', 'Invincible']
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
const ERA_MATERIALS_BY_CATEGORY: Record<HistoricalEra, { clothing: string[], weapons: string[], tools: string[], all: string[] }> = {
  'PREHISTORY': {
    clothing: ['Hide', 'Fur', 'Plant Fiber', 'Woven Grass'],
    weapons: ['Stone', 'Wood', 'Bone', 'Antler', 'Flint'],
    tools: ['Stone', 'Wood', 'Bone', 'Clay', 'Antler'],
    all: ['Stone', 'Wood', 'Bone', 'Hide', 'Antler', 'Flint', 'Clay']
  },
  'ANTIQUITY': {
    clothing: ['Linen', 'Wool', 'Leather', 'Cotton', 'Silk'],
    weapons: ['Bronze', 'Copper', 'Iron', 'Wood', 'Leather'],
    tools: ['Bronze', 'Copper', 'Iron', 'Wood', 'Stone', 'Ceramic'],
    all: ['Bronze', 'Copper', 'Iron', 'Wood', 'Stone', 'Leather', 'Silver', 'Gold', 'Ceramic', 'Linen', 'Wool']
  },
  'MEDIEVAL': {
    clothing: ['Wool', 'Linen', 'Leather', 'Silk', 'Cotton', 'Velvet'],
    weapons: ['Iron', 'Steel', 'Wood', 'Leather'],
    tools: ['Iron', 'Steel', 'Wood', 'Silver', 'Gold'],
    all: ['Iron', 'Steel', 'Wood', 'Leather', 'Silver', 'Gold', 'Cloth', 'Wool']
  },
  'RENAISSANCE_EARLY_MODERN': {
    clothing: ['Silk', 'Cotton', 'Wool', 'Linen', 'Velvet', 'Satin', 'Leather'],
    weapons: ['Steel', 'Iron', 'Wood', 'Gunpowder'],
    tools: ['Steel', 'Iron', 'Wood', 'Glass', 'Silver', 'Gold'],
    all: ['Steel', 'Iron', 'Wood', 'Gunpowder', 'Glass', 'Silk', 'Cotton', 'Silver', 'Gold']
  },
  'INDUSTRIAL_ERA': {
    clothing: ['Cotton', 'Wool', 'Leather', 'Denim', 'Canvas'],
    weapons: ['Steel', 'Iron', 'Brass'],
    tools: ['Steel', 'Iron', 'Brass'],
    all: ['Steel', 'Iron', 'Coal', 'Brass', 'Cotton', 'Wool', 'Glass', ]
  },
  'MODERN_ERA': {
    clothing: ['Cotton', 'Polyester', 'Nylon', 'Leather', 'Denim'],
    weapons: ['Steel', 'Aluminum', 'Composite'],
    tools: ['Aluminum', 'Plastic', 'Steel', 'Electronics'],
    all: ['Aluminum', 'Plastic', 'Synthetic', 'Steel', 'Glass', 'Electronics']
  },
  'FUTURE_ERA': {
    clothing: ['Merino Wool', 'Recycled Polyester', 'Organic Cotton', 'Hemp', 'Bamboo Fiber', 'Technical Fabrics'],
    weapons: ['Carbon Fiber', 'Advanced Polymers', 'Titanium Alloy', 'Kevlar'],
    tools: ['Carbon Fiber', 'Silicon', 'Graphene', 'Advanced Ceramics'],
    all: ['Carbon Fiber', 'Silicon', 'Graphene', 'Advanced Ceramics', 'Recycled Polyester', 'Hemp', 'Bamboo Fiber']
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

export function assignProceduralColors(item: Item, culture: CulturalZone, socialClass: 'common' | 'noble' | 'religious' = 'common'): Item {
  // For clothing/apparel
  if (item.category === 'Apparel') {
    const palette = CLOTHING_COLOR_PALETTES[culture]?.[socialClass] || CLOTHING_COLOR_PALETTES['EUROPEAN']['common'];
    const color = randomChoice(palette);
    return {
      ...item,
      color // Just store the color, don't modify the name
    };
  }

  // For items with materials, assign material-based colors
  if (item.material) {
    const materialLower = item.material.toLowerCase();
    const colorRange = MATERIAL_COLOR_RANGES[materialLower];
    if (colorRange) {
      const colors = colorRange.primary;
      const selectedColor = randomChoice(colors);
      return {
        ...item,
        color: selectedColor // Store hex color directly
      };
    }
  }

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

export function getEraAppropriateMaterial(baseMaterial: string, era: HistoricalEra, itemCategory?: ItemCategory): string {
  const eraMaterials = ERA_MATERIALS_BY_CATEGORY[era];
  
  // Determine which material list to use based on item category
  let availableMaterials: string[];
  if (itemCategory === 'Apparel') {
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
  'Walking Staff': ['Traveling Staff', 'Pilgrim Rod', 'Wanderer Stick', 'Journey Staff', 'Trail Pole', 'Hiking Staff', 'Support Cane', 'Path Staff', 'Road Stick'],
  'Stick': ['Branch', 'Rod', 'Pole', 'Staff', 'Club', 'Baton', 'Cudgel', 'Switch'],
  'Quarterstaff': ['Battle Staff', 'Fighting Stick', 'War Staff', 'Combat Pole', 'Defense Rod'],
  'Herding Staff': ['Shepherd Rod', 'Cattle Stick', 'Livestock Pole', 'Animal Staff', 'Flock Stick'],
  'Walking Cane': ['Gentleman Cane', 'Support Stick', 'Mobility Aid', 'Elder Staff', 'Town Cane'],
  'Worker\'s Trousers': ['Work Pants', 'Labor Breeches', 'Factory Pants', 'Mill Trousers', 'Dock Pants', 'Field Bottoms'],
  'Cotton Shirt': ['Cotton Blouse', 'Cotton Top', 'Light Shirt', 'Summer Top', 'Plain Shirt', 'Daily Shirt'],
  'Shirt': ['Blouse', 'Top', 'Garment', 'Upper Wear', 'Tunic', 'Jersey'],
  'Simple Tunic': ['Basic Shirt', 'Plain Top', 'Common Garment', 'Work Blouse', 'Daily Wear', 'Folk Shirt'],
  'Tunic': ['Shirt', 'Blouse', 'Top', 'Jerkin', 'Vest', 'Garment'],
  'Wool Tunic': ['Woolen Shirt', 'Winter Top', 'Warm Garment', 'Fleece Shirt', 'Heavy Tunic']
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
  // For meat items, use regional variants
  if (baseItem.baseId === 'MEAT' && options.culture && options.era) {
    const meatName = getRegionalMeatName(options.culture, options.era);
    if (options.quality && options.quality !== 'standard') {
      // Use food-specific quality words for meat
      const foodQualityWords = CATEGORY_QUALITY_WORDS['Food']?.[options.quality] || QUALITY_ADJECTIVES[options.quality];
      const qualityWord = randomChoice(foodQualityWords);
      return `${qualityWord} ${meatName}`;
    }
    return meatName;
  }

  // Simple, clean naming: [Quality] [Color] [Material] [Item Name]
  const parts: string[] = [];

  // Use category-specific quality descriptors
  if (options.quality && options.quality !== 'standard') {
    const categoryQualityWords = CATEGORY_QUALITY_WORDS[baseItem.category]?.[options.quality];
    const qualityWord = categoryQualityWords
      ? randomChoice(categoryQualityWords)
      : randomChoice(QUALITY_ADJECTIVES[options.quality]);
    parts.push(qualityWord);
  }

  // Add color if provided
  if (options.color && options.color !== '#8b7355') { // Skip default color
    // Convert hex to name if needed
    const colorName = getColorName(options.color);
    if (colorName) {
      parts.push(colorName);
    }
  }

  // Add material (just the clean material name, not variations)
  // Skip adding material if it's an era name
  const eraNames = ['PREHISTORY', 'ANTIQUITY', 'MEDIEVAL', 'RENAISSANCE_EARLY_MODERN',
                    'INDUSTRIAL_ERA', 'MODERN_ERA', 'FUTURE_ERA'];
  if (options.material && options.material !== baseItem.material &&
      !eraNames.includes(options.material)) {
    parts.push(options.material);
  }

  // Base item name with variations (always last)
  // Apply variations to common repetitive items
  let finalName = baseItem.name;

  // Check for items that need variation
  const needsVariation = ['Walking Staff', 'Stick', 'Worker\'s Trousers', 'Simple Tunic',
                         'Tunic', 'Cotton Shirt', 'Wool Tunic', 'Shirt'].includes(baseItem.name);

  if (needsVariation) {
    finalName = getItemNameVariation(baseItem.name);
  }

  parts.push(finalName);

  return parts.join(' ');
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
  const baseItem = ITEM_DEFINITIONS[baseItemId];
  if (!baseItem) return null;
  
  // Generate procedural properties
  const privilege = options.privilegeModifier || (options.socialClass === 'noble' ? 0.3 : 0);
  const quality = options.quality || generateItemQuality(privilege);
  const era = options.era || 'MEDIEVAL';
  const age = generateAge(era);
  const condition = generateCondition(quality, age);

  // Only apply materials to items that should have them
  // Skip Food, consumables, and items without base materials
  let eraAppropriateMaterial: string | undefined;
  let culturalStyle: string | undefined;

  const shouldHaveMaterial = !MATERIAL_EXCLUDED_CATEGORIES.includes(baseItem.category) &&
                            !MATERIAL_EXCLUDED_ITEMS.includes(baseItemId) &&
                            (baseItem.material || baseItem.category === 'Weapon' ||
                             baseItem.category === 'Apparel' || baseItem.category === 'Armor');

  if (shouldHaveMaterial && baseItem.material) {
    // Get era-appropriate material
    const baseMaterial = baseItem.material;
    eraAppropriateMaterial = getEraAppropriateMaterial(baseMaterial, era, baseItem.category);

    // Validate the substituted material makes sense for this item
    if (!isValidMaterialForItem(eraAppropriateMaterial, baseItem.name, baseItem.equipmentSlot)) {
      eraAppropriateMaterial = baseMaterial; // Keep original material if substitution is invalid
    }

    // Get cultural style
    culturalStyle = options.culture ? getCulturalStyle(options.culture, eraAppropriateMaterial) : undefined;
  }
  
  // Create item instance with all procedural properties
  let item: Item = {
    ...baseItem,
    id: `item-${uuidv4()}`,
    quantity: 1,
    quality,
    condition,
    culturalStyle,
    age,
    material: eraAppropriateMaterial || baseItem.material
  };
  
  // Apply colors FIRST so we can use them in the name
  if (options.forceColor) {
    item.color = options.forceColor;
  } else if (options.culture) {
    item = assignProceduralColors(item, options.culture, options.socialClass);
  }
  
  // Generate procedural name with color, culture, and era
  item.name = generateProceduralName(baseItem, {
    quality,
    material: eraAppropriateMaterial, // Will be undefined for food/consumables
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
    if (profType === 'military' && ITEM_DEFINITIONS['SWORD']) {
      return 'SWORD';
    }
    if (profType === 'herder' && ITEM_DEFINITIONS['ROPE']) {
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
    return {
      ...item,
      crafterName: generateCrafterSignature(),
      name: `${item.name} (by ${generateCrafterSignature()})`
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

export function createColoredItemInstance(
  baseItemId: string,
  culture: CulturalZone,
  privilege: number = 0.5,
  era?: HistoricalEra
): Item | null {
  const baseItem = ITEM_DEFINITIONS[baseItemId];
  if (!baseItem) return null;
  
  // Generate the item with full procedural variation
  return generateProceduralItem(baseItemId, {
    culture,
    era,
    socialClass: privilege > 0.7 ? 'noble' : privilege > 0.3 ? 'common' : 'common',
    privilegeModifier: privilege > 0.7 ? 0.2 : 0 // Better quality for high privilege
  });
}

export function ensureItemHasColor(item: Item, culture: CulturalZone, privilege: number = 0.5): Item {
  // Skip if item already has a color
  if (item.color) return item;
  
  // Apply color based on material first
  if (item.material) {
    const materialColor = getMaterialColorHex(item.material);
    if (materialColor !== '#8b7355') { // Not default color
      return {
        ...item,
        color: materialColor
      };
    }
  }
  
  // Apply cultural color if it's apparel
  const socialClass = privilege > 0.7 ? 'noble' : 'common';
  return assignProceduralColors(item, culture, socialClass);
}
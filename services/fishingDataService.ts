/**
 * fishingDataService.ts - Procedural fish generation based on culture, era, and location
 * Provides historically accurate fish species with cultural variations
 */

import { CulturalZone } from '../types/characterData';
import { HistoricalEra } from '../types/ambiance';
import { BiomeType, ClimateType } from '../types';

export type FishSizeCategory = 'tiny' | 'small' | 'medium' | 'large' | 'huge';

export interface FishSpecies {
  id: string;
  name: string;
  culturalNames: Partial<Record<CulturalZone, string>>;
  minDepth: number; // meters
  maxDepth: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  size: { min: number; max: number }; // kg
  value: number; // base economic value
  speed: number; // 0-1, affects catching difficulty
  schooling: boolean;
  preferredSeasons: string[];
  historicalAvailability: HistoricalEra[];
  waterType: 'freshwater' | 'saltwater' | 'both';
  description: string;
  color: string; // primary color for rendering
  secondaryColor?: string; // secondary color for gradients
  bellyColor?: string; // belly color (usually lighter)
  pattern?: 'none' | 'striped' | 'spotted' | 'bars' | 'scales' | 'lateral_line' | 'rainbow' | 'patches' | 'mottled';
  patternColor?: string; // color of the pattern
  climates?: ClimateType[]; // preferred climate zones
  baseValue?: number; // economic value
}

// Helper constant for fish available in all eras
const ALL_ERAS = [
  HistoricalEra.PREHISTORY,
  HistoricalEra.ANTIQUITY,
  HistoricalEra.MEDIEVAL,
  HistoricalEra.RENAISSANCE_EARLY_MODERN,
  HistoricalEra.INDUSTRIAL_ERA,
  HistoricalEra.MODERN_ERA
];

// Comprehensive fish database with historical and cultural accuracy
const FISH_DATABASE: FishSpecies[] = [
  // === EUROPEAN WATERS ===
  {
    id: 'atlantic_cod',
    name: 'Atlantic Cod',
    culturalNames: {
      EUROPEAN: 'Cod',
      NORTH_AMERICAN_COLONIAL: 'Codfish',
    },
    minDepth: 50,
    maxDepth: 200,
    rarity: 'common',
    size: { min: 2, max: 25 },
    value: 15,
    speed: 0.3,
    schooling: true,
    preferredSeasons: ['winter', 'spring'],
    historicalAvailability: [HistoricalEra.MEDIEVAL, HistoricalEra.RENAISSANCE_EARLY_MODERN, HistoricalEra.INDUSTRIAL_ERA, HistoricalEra.MODERN_ERA],
    waterType: 'saltwater',
    description: 'A vital commercial fish that shaped Atlantic trade',
    color: '#8B7355',
    pattern: 'spotted'
  },
  {
    id: 'herring',
    name: 'Herring',
    culturalNames: {
      EUROPEAN: 'Herring',
      NORTH_AMERICAN_COLONIAL: 'Sea Herring',
    },
    minDepth: 0,
    maxDepth: 50,
    rarity: 'common',
    size: { min: 0.1, max: 0.5 },
    value: 5,
    speed: 0.5,
    schooling: true,
    preferredSeasons: ['summer', 'fall'],
    historicalAvailability: Object.values(HistoricalEra),
    waterType: 'saltwater',
    description: 'Small silver fish that travels in massive schools',
    color: '#C0C0C0'
  },
  {
    id: 'atlantic_salmon',
    name: 'Atlantic Salmon',
    culturalNames: {
      EUROPEAN: 'Salmon',
      NORTH_AMERICAN_COLONIAL: 'King Salmon',
    },
    minDepth: 0,
    maxDepth: 100,
    rarity: 'uncommon',
    size: { min: 3, max: 15 },
    value: 30,
    speed: 0.7,
    schooling: false,
    preferredSeasons: ['spring', 'fall'],
    historicalAvailability: Object.values(HistoricalEra),
    waterType: 'both',
    description: 'Prized fish that migrates between river and sea',
    color: '#FA8072'
  },
  
  // === EAST ASIAN WATERS ===
  {
    id: 'koi',
    name: 'Koi',
    culturalNames: {
      EAST_ASIAN: '錦鯉',
      EUROPEAN: 'Ornamental Carp',
    },
    minDepth: 0,
    maxDepth: 10,
    rarity: 'rare',
    size: { min: 2, max: 8 },
    value: 50,
    speed: 0.3,
    schooling: false,
    preferredSeasons: ['spring', 'summer'],
    historicalAvailability: [HistoricalEra.MEDIEVAL, HistoricalEra.RENAISSANCE_EARLY_MODERN, HistoricalEra.INDUSTRIAL_ERA, HistoricalEra.MODERN_ERA],
    waterType: 'freshwater',
    description: 'Ornamental carp bred for beauty and fortune',
    color: '#FF6347',
    pattern: 'patches'
  },
  {
    id: 'yellowfin_tuna',
    name: 'Yellowfin Tuna',
    culturalNames: {
      EAST_ASIAN: 'マグロ',
      OCEANIA: 'Ahi',
    },
    minDepth: 50,
    maxDepth: 250,
    rarity: 'uncommon',
    size: { min: 15, max: 80 },
    value: 45,
    speed: 0.9,
    schooling: true,
    preferredSeasons: ['summer'],
    historicalAvailability: Object.values(HistoricalEra),
    waterType: 'saltwater',
    description: 'Fast-swimming predator of warm seas',
    color: '#4169E1'
  },
  {
    id: 'japanese_eel',
    name: 'Japanese Eel',
    culturalNames: {
      EAST_ASIAN: 'うなぎ',
      EUROPEAN: 'Eel',
    },
    minDepth: 0,
    maxDepth: 30,
    rarity: 'uncommon',
    size: { min: 0.5, max: 2 },
    value: 35,
    speed: 0.6,
    schooling: false,
    preferredSeasons: ['summer', 'fall'],
    historicalAvailability: Object.values(HistoricalEra),
    waterType: 'both',
    description: 'Mysterious fish with complex life cycle',
    color: '#2F4F4F'
  },
  
  // === TROPICAL WATERS ===
  {
    id: 'parrotfish',
    name: 'Parrotfish',
    culturalNames: {
      OCEANIA: 'Uhu',
      SOUTH_AMERICAN: 'Pez Loro',
    },
    minDepth: 5,
    maxDepth: 30,
    rarity: 'common',
    size: { min: 1, max: 5 },
    value: 20,
    speed: 0.4,
    schooling: true,
    preferredSeasons: ['summer'],
    historicalAvailability: Object.values(HistoricalEra),
    waterType: 'saltwater',
    description: 'Colorful reef fish that eats coral',
    color: '#00CED1',
    pattern: 'rainbow'
  },
  {
    id: 'barracuda',
    name: 'Barracuda',
    culturalNames: {
      OCEANIA: 'Ono',
      MENA: 'Karkoor',
    },
    minDepth: 10,
    maxDepth: 100,
    rarity: 'uncommon',
    size: { min: 5, max: 30 },
    value: 25,
    speed: 0.8,
    schooling: false,
    preferredSeasons: ['summer', 'fall'],
    historicalAvailability: Object.values(HistoricalEra),
    waterType: 'saltwater',
    description: 'Swift predator with razor teeth',
    color: '#708090'
  },
  
  // === ARCTIC WATERS ===
  {
    id: 'arctic_char',
    name: 'Arctic Char',
    culturalNames: {
      NORTH_AMERICAN_PRE_COLUMBIAN: 'Iqaluk',
    },
    minDepth: 20,
    maxDepth: 150,
    rarity: 'common',
    size: { min: 2, max: 10 },
    value: 25,
    speed: 0.5,
    schooling: false,
    preferredSeasons: ['summer'],
    historicalAvailability: Object.values(HistoricalEra),
    waterType: 'both',
    description: 'Cold-water salmonid of the far north',
    color: '#B22222'
  },
  {
    id: 'greenland_halibut',
    name: 'Greenland Halibut',
    culturalNames: {
      EUROPEAN: 'Turbot',
    },
    minDepth: 100,
    maxDepth: 500,
    rarity: 'rare',
    size: { min: 10, max: 45 },
    value: 40,
    speed: 0.3,
    schooling: false,
    preferredSeasons: ['winter', 'spring'],
    historicalAvailability: [HistoricalEra.MEDIEVAL, HistoricalEra.RENAISSANCE_EARLY_MODERN, HistoricalEra.INDUSTRIAL_ERA, HistoricalEra.MODERN_ERA],
    waterType: 'saltwater',
    description: 'Large flatfish of deep cold waters',
    color: '#8B7D6B'
  },
  
  // === FRESHWATER UNIVERSAL ===
  {
    id: 'rainbow_trout',
    name: 'Rainbow Trout',
    culturalNames: {
      NORTH_AMERICAN_PRE_COLUMBIAN: 'Spotted Fish',
    },
    minDepth: 0,
    maxDepth: 20,
    rarity: 'common',
    size: { min: 0.5, max: 5 },
    value: 15,
    speed: 0.6,
    schooling: false,
    preferredSeasons: ['spring', 'fall'],
    historicalAvailability: Object.values(HistoricalEra),
    waterType: 'freshwater',
    description: 'Popular sport fish of clear streams',
    color: '#FF69B4',
    pattern: 'rainbow'
  },
  {
    id: 'catfish',
    name: 'Catfish',
    culturalNames: {
      SOUTH_ASIAN: 'Singhara',
      MENA: 'Qarmout',
      SUB_SAHARAN_AFRICAN: 'Barbel',
    },
    minDepth: 5,
    maxDepth: 30,
    rarity: 'common',
    size: { min: 1, max: 20 },
    value: 10,
    speed: 0.3,
    schooling: false,
    preferredSeasons: ['summer'],
    historicalAvailability: Object.values(HistoricalEra),
    waterType: 'freshwater',
    description: 'Bottom-dwelling fish with whiskers',
    color: '#696969'
  },
  {
    id: 'pike',
    name: 'Pike',
    culturalNames: {
      EUROPEAN: 'Pike',
      NORTH_AMERICAN_COLONIAL: 'Northern Pike',
    },
    minDepth: 0,
    maxDepth: 30,
    rarity: 'uncommon',
    size: { min: 2, max: 15 },
    value: 20,
    speed: 0.7,
    schooling: false,
    preferredSeasons: ['spring', 'fall'],
    historicalAvailability: Object.values(HistoricalEra),
    waterType: 'freshwater',
    description: 'Aggressive predator of northern waters',
    color: '#556B2F',
    pattern: 'striped'
  },
  
  // === SOUTH AMERICAN WATERS ===
  {
    id: 'piranha',
    name: 'Red-bellied Piranha',
    culturalNames: {
      SOUTH_AMERICAN: 'Piraña',
    },
    minDepth: 5,
    maxDepth: 20,
    rarity: 'common',
    size: { min: 0.3, max: 1.5 },
    value: 12,
    speed: 0.7,
    schooling: true,
    preferredSeasons: ['summer'],
    historicalAvailability: Object.values(HistoricalEra),
    waterType: 'freshwater',
    description: 'Notorious predator of Amazonian waters',
    color: '#DC143C',
    pattern: 'spotted'
  },
  {
    id: 'arapaima',
    name: 'Arapaima',
    culturalNames: {
      SOUTH_AMERICAN: 'Pirarucu',
    },
    minDepth: 10,
    maxDepth: 40,
    rarity: 'legendary',
    size: { min: 50, max: 200 },
    value: 150,
    speed: 0.5,
    schooling: false,
    preferredSeasons: ['summer'],
    historicalAvailability: Object.values(HistoricalEra),
    waterType: 'freshwater',
    description: 'Giant air-breathing fish of the Amazon',
    color: '#8B4513',
    pattern: 'striped'
  },
  {
    id: 'electric_eel',
    name: 'Electric Eel',
    culturalNames: {
      SOUTH_AMERICAN: 'Poraquê',
    },
    minDepth: 5,
    maxDepth: 25,
    rarity: 'rare',
    size: { min: 5, max: 20 },
    value: 60,
    speed: 0.4,
    schooling: false,
    preferredSeasons: ['summer'],
    historicalAvailability: Object.values(HistoricalEra),
    waterType: 'freshwater',
    description: 'Shocking predator that generates electricity',
    color: '#2F4F4F'
  },
  
  // === AFRICAN WATERS ===
  {
    id: 'nile_perch',
    name: 'Nile Perch',
    culturalNames: {
      SUB_SAHARAN_AFRICAN: 'Mbuta',
      MENA: 'Samak el-Nil',
    },
    minDepth: 10,
    maxDepth: 60,
    rarity: 'uncommon',
    size: { min: 10, max: 100 },
    value: 35,
    speed: 0.6,
    schooling: false,
    preferredSeasons: ['summer'],
    historicalAvailability: Object.values(HistoricalEra),
    waterType: 'freshwater',
    description: 'Massive predator of African lakes',
    color: '#808000'
  },
  {
    id: 'tilapia',
    name: 'Tilapia',
    culturalNames: {
      SUB_SAHARAN_AFRICAN: 'Ngege',
      MENA: 'Bulti',
    },
    minDepth: 0,
    maxDepth: 20,
    rarity: 'common',
    size: { min: 0.5, max: 4 },
    value: 8,
    speed: 0.4,
    schooling: true,
    preferredSeasons: ['summer'],
    historicalAvailability: Object.values(HistoricalEra),
    waterType: 'freshwater',
    description: 'Hardy fish cultivated since ancient times',
    color: '#696969'
  },
  
  // === ARCTIC/SUBARCTIC ADDITIONS ===
  {
    id: 'greenland_shark',
    name: 'Greenland Shark',
    culturalNames: {
      NORTH_AMERICAN_PRE_COLUMBIAN: 'Eqalussuaq',
    },
    minDepth: 200,
    maxDepth: 600,
    rarity: 'legendary',
    size: { min: 200, max: 500 },
    value: 200,
    speed: 0.2,
    schooling: false,
    preferredSeasons: ['winter'],
    historicalAvailability: Object.values(HistoricalEra),
    waterType: 'saltwater',
    description: 'Ancient giant of the Arctic depths',
    color: '#2F4F4F'
  },
  {
    id: 'arctic_grayling',
    name: 'Arctic Grayling',
    culturalNames: {
      NORTH_AMERICAN_PRE_COLUMBIAN: 'Sailfin',
    },
    minDepth: 0,
    maxDepth: 15,
    rarity: 'uncommon',
    size: { min: 0.3, max: 2 },
    value: 22,
    speed: 0.6,
    schooling: false,
    preferredSeasons: ['summer'],
    historicalAvailability: Object.values(HistoricalEra),
    waterType: 'freshwater',
    description: 'Beautiful fish with sail-like dorsal fin',
    color: '#9370DB',
    pattern: 'rainbow'
  },
  
  // === AUSTRALIAN/OCEANIC WATERS ===
  {
    id: 'barramundi',
    name: 'Barramundi',
    culturalNames: {
      OCEANIA: 'Barra',
    },
    minDepth: 5,
    maxDepth: 40,
    rarity: 'uncommon',
    size: { min: 5, max: 30 },
    value: 28,
    speed: 0.6,
    schooling: false,
    preferredSeasons: ['summer'],
    historicalAvailability: Object.values(HistoricalEra),
    waterType: 'both',
    description: 'Prized sportfish of Australian waters',
    color: '#C0C0C0'
  },
  {
    id: 'murray_cod',
    name: 'Murray Cod',
    culturalNames: {
      OCEANIA: 'Goodoo',
    },
    minDepth: 10,
    maxDepth: 30,
    rarity: 'rare',
    size: { min: 10, max: 60 },
    value: 45,
    speed: 0.4,
    schooling: false,
    preferredSeasons: ['spring', 'summer'],
    historicalAvailability: Object.values(HistoricalEra),
    waterType: 'freshwater',
    description: 'Australia\'s largest freshwater fish',
    color: '#556B2F',
    pattern: 'spotted'
  },
  
  // === SOUTH ASIAN WATERS ===
  {
    id: 'mahseer',
    name: 'Golden Mahseer',
    culturalNames: {
      SOUTH_ASIAN: 'महसीर',
    },
    minDepth: 5,
    maxDepth: 30,
    rarity: 'rare',
    size: { min: 5, max: 40 },
    value: 50,
    speed: 0.7,
    schooling: false,
    preferredSeasons: ['spring', 'summer'],
    historicalAvailability: Object.values(HistoricalEra),
    waterType: 'freshwater',
    description: 'King of Indian rivers',
    color: '#FFD700'
  },
  {
    id: 'rohu',
    name: 'Rohu',
    culturalNames: {
      SOUTH_ASIAN: 'रोहू',
    },
    minDepth: 0,
    maxDepth: 20,
    rarity: 'common',
    size: { min: 1, max: 10 },
    value: 10,
    speed: 0.4,
    schooling: true,
    preferredSeasons: ['summer'],
    historicalAvailability: Object.values(HistoricalEra),
    waterType: 'freshwater',
    description: 'Sacred carp of the Ganges',
    color: '#B87333'
  },
  
  // === LEGENDARY/RARE ===
  {
    id: 'giant_sturgeon',
    name: 'Giant Sturgeon',
    culturalNames: {
      EUROPEAN: 'Beluga',
      EAST_ASIAN: '鲟鱼',
    },
    minDepth: 50,
    maxDepth: 200,
    rarity: 'legendary',
    size: { min: 50, max: 200 },
    value: 100,
    speed: 0.4,
    schooling: false,
    preferredSeasons: ['spring'],
    historicalAvailability: [HistoricalEra.ANTIQUITY, HistoricalEra.MEDIEVAL, HistoricalEra.RENAISSANCE_EARLY_MODERN],
    waterType: 'both',
    description: 'Ancient giant, source of caviar',
    color: '#2F4F4F'
  },
  {
    id: 'coelacanth',
    name: 'Coelacanth',
    culturalNames: {},
    minDepth: 150,
    maxDepth: 400,
    rarity: 'legendary',
    size: { min: 20, max: 80 },
    value: 500,
    speed: 0.2,
    schooling: false,
    preferredSeasons: ['summer'],
    historicalAvailability: [HistoricalEra.MODERN_ERA], // Only "discovered" in modern era
    waterType: 'saltwater',
    description: 'Living fossil from prehistoric times',
    color: '#191970'
  },
  
  // TROPICAL SPECIES
  {
    id: 'parrotfish',
    name: 'Parrotfish',
    culturalNames: {
      OCEANIA: 'Uhu',
      MENA: 'سمك الببغاء',
      SOUTH_ASIAN: 'तोता मछली',
      SOUTHEAST_ASIAN: 'Ikan Kakaktua'
    },
    minDepth: 5,
    maxDepth: 30,
    rarity: 'common',
    size: { min: 3, max: 15 },
    value: 25,
    speed: 0.6,
    schooling: true,
    preferredSeasons: ['summer', 'spring'],
    historicalAvailability: ALL_ERAS,
    waterType: 'saltwater',
    description: 'Colorful reef fish that creates sand',
    color: '#00CED1',
    secondaryColor: '#FF69B4',
    bellyColor: '#E0FFFF',
    pattern: 'spotted' as const,
    patternColor: '#FFD700',
    climates: [ClimateType.TROPICAL, ClimateType.SEMITROPICAL]
  },
  {
    id: 'barracuda',
    name: 'Barracuda',
    culturalNames: {
      MENA: 'باراكودا',
      AFRICAN: 'Cuda',
      LATIN_AMERICAN: 'Picúa'
    },
    minDepth: 0,
    maxDepth: 100,
    rarity: 'uncommon',
    size: { min: 10, max: 60 },
    value: 40,
    speed: 1.2,
    schooling: false,
    preferredSeasons: ['summer'],
    historicalAvailability: ALL_ERAS,
    waterType: 'saltwater',
    description: 'Swift predator with razor teeth',
    color: '#C0C0C0',
    secondaryColor: '#708090',
    bellyColor: '#F5F5F5',
    pattern: 'none' as const,
    climates: [ClimateType.TROPICAL, ClimateType.SEMITROPICAL]
  },
  {
    id: 'grouper',
    name: 'Grouper',
    culturalNames: {
      EAST_ASIAN: '石斑鱼',
      SOUTHEAST_ASIAN: 'Kerapu',
      MENA: 'هامور'
    },
    minDepth: 10,
    maxDepth: 80,
    rarity: 'uncommon',
    size: { min: 8, max: 100 },
    value: 60,
    speed: 0.3,
    schooling: false,
    preferredSeasons: ['summer', 'fall'],
    historicalAvailability: ALL_ERAS,
    waterType: 'saltwater',
    description: 'Large reef predator',
    color: '#8B4513',
    secondaryColor: '#A0522D',
    bellyColor: '#DEB887',
    pattern: 'mottled' as const,
    patternColor: '#654321',
    climates: [ClimateType.TROPICAL, ClimateType.SEMITROPICAL]
  },
  
  // COLD WATER SPECIES
  {
    id: 'arctic_char',
    name: 'Arctic Char',
    culturalNames: {
      EUROPEAN: 'Røye',
      NORTH_AMERICAN: 'Char',
      EAST_ASIAN: '北極イワナ'
    },
    minDepth: 5,
    maxDepth: 70,
    rarity: 'common',
    size: { min: 5, max: 20 },
    value: 35,
    speed: 0.7,
    schooling: true,
    preferredSeasons: ['winter', 'spring'],
    historicalAvailability: ALL_ERAS,
    waterType: 'both',
    description: 'Cold-adapted salmonid',
    color: '#4682B4',
    secondaryColor: '#FF6347',
    bellyColor: '#FFA07A',
    pattern: 'spotted' as const,
    patternColor: '#FF1493',
    climates: [ClimateType.COLD]
  },
  {
    id: 'halibut',
    name: 'Halibut',
    culturalNames: {
      EUROPEAN: 'Kveite',
      EAST_ASIAN: '大比目魚',
      NORTH_AMERICAN: 'Halibut'
    },
    minDepth: 20,
    maxDepth: 200,
    rarity: 'rare',
    size: { min: 20, max: 200 },
    value: 80,
    speed: 0.4,
    schooling: false,
    preferredSeasons: ['spring', 'summer'],
    historicalAvailability: ALL_ERAS,
    waterType: 'saltwater',
    description: 'Giant flatfish of cold waters',
    color: '#8B7355',
    secondaryColor: '#8B6914',
    bellyColor: '#FFFAF0',
    pattern: 'none' as const,
    climates: [ClimateType.COLD]
  },
  
  // TEMPERATE SPECIES
  {
    id: 'pike',
    name: 'Pike',
    culturalNames: {
      EUROPEAN: 'Hecht',
      SLAVIC: 'Щука',
      NORTH_AMERICAN: 'Northern Pike'
    },
    minDepth: 2,
    maxDepth: 30,
    rarity: 'common',
    size: { min: 8, max: 40 },
    value: 30,
    speed: 0.9,
    schooling: false,
    preferredSeasons: ['spring', 'fall'],
    historicalAvailability: ALL_ERAS,
    waterType: 'freshwater',
    description: 'Ambush predator of northern waters',
    color: '#556B2F',
    secondaryColor: '#6B8E23',
    bellyColor: '#F0E68C',
    pattern: 'striped' as const,
    patternColor: '#2F4F2F',
    climates: [ClimateType.TEMPERATE, ClimateType.COLD]
  },
  {
    id: 'walleye',
    name: 'Walleye',
    culturalNames: {
      NORTH_AMERICAN: 'Walleye',
      EUROPEAN: 'Zander'
    },
    minDepth: 3,
    maxDepth: 40,
    rarity: 'uncommon',
    size: { min: 5, max: 25 },
    value: 35,
    speed: 0.6,
    schooling: true,
    preferredSeasons: ['spring', 'fall'],
    historicalAvailability: ALL_ERAS,
    waterType: 'freshwater',
    description: 'Prized game fish with excellent vision',
    color: '#8B7D6B',
    secondaryColor: '#CDAA7D',
    bellyColor: '#FFF8DC',
    pattern: 'mottled' as const,
    patternColor: '#5F4E37',
    climates: [ClimateType.TEMPERATE]
  },
  
  // MEDITERRANEAN SPECIES
  {
    id: 'sea_bream',
    name: 'Sea Bream',
    culturalNames: {
      EUROPEAN: 'Dorade',
      MENA: 'دنيس',
      MEDITERRANEAN: 'Orata'
    },
    minDepth: 5,
    maxDepth: 50,
    rarity: 'common',
    size: { min: 4, max: 15 },
    value: 25,
    speed: 0.5,
    schooling: true,
    preferredSeasons: ['spring', 'summer'],
    historicalAvailability: ALL_ERAS,
    waterType: 'saltwater',
    description: 'Prized Mediterranean table fish',
    color: '#C0C0C0',
    secondaryColor: '#FFD700',
    bellyColor: '#FFFAFA',
    pattern: 'striped' as const,
    patternColor: '#696969',
    climates: [ClimateType.MEDITERRANEAN, ClimateType.TEMPERATE]
  },
  {
    id: 'red_mullet',
    name: 'Red Mullet',
    culturalNames: {
      EUROPEAN: 'Rouget',
      MEDITERRANEAN: 'Triglia',
      MENA: 'سلطان إبراهيم'
    },
    minDepth: 10,
    maxDepth: 100,
    rarity: 'uncommon',
    size: { min: 3, max: 12 },
    value: 40,
    speed: 0.6,
    schooling: true,
    preferredSeasons: ['summer', 'fall'],
    historicalAvailability: ALL_ERAS,
    waterType: 'saltwater',
    description: 'Ancient Roman delicacy',
    color: '#DC143C',
    secondaryColor: '#FF69B4',
    bellyColor: '#FFE4E1',
    pattern: 'none' as const,
    climates: [ClimateType.MEDITERRANEAN]
  },
  
  // ARID WATER SPECIES
  {
    id: 'tilapia',
    name: 'Tilapia',
    culturalNames: {
      AFRICAN: 'Ngege',
      MENA: 'بلطي',
      SOUTH_ASIAN: 'तिलापिया'
    },
    minDepth: 1,
    maxDepth: 20,
    rarity: 'common',
    size: { min: 3, max: 15 },
    value: 15,
    speed: 0.5,
    schooling: true,
    preferredSeasons: ['spring', 'summer', 'fall'],
    historicalAvailability: ALL_ERAS,
    waterType: 'freshwater',
    description: 'Hardy fish of warm waters',
    color: '#696969',
    secondaryColor: '#808080',
    bellyColor: '#D3D3D3',
    pattern: 'striped' as const,
    patternColor: '#2F4F4F',
    climates: [ClimateType.ARID, ClimateType.TROPICAL]
  },
  {
    id: 'desert_pupfish',
    name: 'Desert Pupfish',
    culturalNames: {
      NORTH_AMERICAN: 'Pupfish',
      MENA: 'سمك الصحراء'
    },
    minDepth: 0.5,
    maxDepth: 5,
    rarity: 'rare',
    size: { min: 1, max: 3 },
    value: 20,
    speed: 0.8,
    schooling: true,
    preferredSeasons: ['spring', 'summer'],
    historicalAvailability: ALL_ERAS,
    waterType: 'freshwater',
    description: 'Tiny survivor of desert pools',
    color: '#4169E1',
    secondaryColor: '#87CEEB',
    bellyColor: '#F0F8FF',
    pattern: 'striped' as const,
    patternColor: '#000080',
    climates: [ClimateType.ARID]
  }
];

// Climate-specific fish pools for fallback selection
const CLIMATE_FISH_POOLS: Record<ClimateType, { saltwater: string[]; freshwater: string[] }> = {
  [ClimateType.TROPICAL]: {
    saltwater: ['parrotfish', 'barracuda', 'grouper', 'yellowfin_tuna', 'mahi_mahi'],
    freshwater: ['tilapia', 'carp', 'catfish']
  },
  [ClimateType.SEMITROPICAL]: {
    saltwater: ['parrotfish', 'barracuda', 'grouper', 'sea_bass', 'mackerel'],
    freshwater: ['bass', 'catfish', 'tilapia']
  },
  [ClimateType.COLD]: {
    saltwater: ['arctic_char', 'halibut', 'cod', 'herring', 'salmon'],
    freshwater: ['arctic_char', 'pike', 'salmon', 'trout']
  },
  [ClimateType.TEMPERATE]: {
    saltwater: ['sea_bream', 'mackerel', 'cod', 'sea_bass', 'flounder'],
    freshwater: ['pike', 'walleye', 'bass', 'perch', 'trout', 'carp']
  },
  [ClimateType.MEDITERRANEAN]: {
    saltwater: ['sea_bream', 'red_mullet', 'anchovy', 'sardine', 'tuna'],
    freshwater: ['carp', 'trout', 'catfish']
  },
  [ClimateType.ARID]: {
    saltwater: ['red_mullet', 'sea_bass'], // Coastal desert areas
    freshwater: ['tilapia', 'desert_pupfish', 'catfish', 'carp']
  }
};

export class FishingDataService {
  private rng: () => number;

  constructor(seed?: number) {
    // Simple seeded random
    let s = seed || Date.now();
    this.rng = () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return (s & 0xffffffff) / 0x100000000;
    };
  }

  /**
   * Get default fish for a specific climate when no matches found
   */
  private getDefaultFishForClimate(climate: ClimateType, isFreshwater: boolean): FishSpecies[] {
    const pool = CLIMATE_FISH_POOLS[climate];
    const fishIds = isFreshwater ? pool.freshwater : pool.saltwater;
    
    return fishIds
      .map(id => FISH_DATABASE.find(f => f.id === id))
      .filter((f): f is FishSpecies => f !== undefined);
  }

  /**
   * Get available fish species for a specific context
   */
  getAvailableFish(params: {
    culturalZone: CulturalZone;
    historicalEra: HistoricalEra;
    climate: ClimateType;
    biome: BiomeType;
    depth: number;
    season: string;
    isCoastal: boolean;
    isFreshwater: boolean;
  }): FishSpecies[] {
    const { culturalZone, historicalEra, climate, depth, season, isFreshwater } = params;

    let available = FISH_DATABASE.filter(fish => {
      // Check historical availability
      if (!fish.historicalAvailability.includes(historicalEra)) {
        return false;
      }

      // Check water type
      if (isFreshwater && fish.waterType === 'saltwater') return false;
      if (!isFreshwater && fish.waterType === 'freshwater') return false;

      // Check depth range
      if (depth < fish.minDepth || depth > fish.maxDepth) return false;

      // Check season (if fish has preference)
      if (fish.preferredSeasons.length > 0 && !fish.preferredSeasons.includes(season.toLowerCase())) {
        // Still possible but less likely
        if (this.rng() > 0.3) return false;
      }

      // NEW: Check climate compatibility using the climates array
      if (fish.climates && fish.climates.length > 0) {
        // If fish has specific climate requirements, check them
        if (!fish.climates.includes(climate)) {
          return false;
        }
      } else {
        // Fallback for older fish entries without climates array
        // Cultural/climate filtering for better regional accuracy
        if (climate === ClimateType.COLD && fish.id.includes('tropical')) return false;
        if (climate === ClimateType.TROPICAL && fish.id.includes('arctic')) return false;
      }

      return true;
    });

    // If no matches found, return climate-appropriate defaults
    if (available.length === 0) {
      console.log(`No fish found for climate ${climate}, using defaults`);
      available = this.getDefaultFishForClimate(climate, isFreshwater);
    }

    return available;
  }

  /**
   * Generate a specific fish catch with size variation
   */
  generateCatch(species: FishSpecies): {
    species: FishSpecies;
    weight: number;
    length: number;
    quality: 'poor' | 'normal' | 'excellent';
    value: number;
  } {
    const sizeRange = species.size.max - species.size.min;
    const weight = species.size.min + this.rng() * sizeRange;
    
    // Length estimation (rough correlation with weight)
    const length = Math.sqrt(weight) * 15 + this.rng() * 10;
    
    // Quality based on random chance
    const qualityRoll = this.rng();
    const quality = qualityRoll > 0.9 ? 'excellent' : qualityRoll < 0.2 ? 'poor' : 'normal';
    
    // Value modification based on quality
    const qualityMultiplier = quality === 'excellent' ? 1.5 : quality === 'poor' ? 0.7 : 1;
    const value = Math.round(species.value * qualityMultiplier * (weight / species.size.min));

    return {
      species,
      weight: Math.round(weight * 10) / 10,
      length: Math.round(length),
      quality,
      value
    };
  }

  /**
   * Get fish spawn probability based on rarity
   */
  getSpawnChance(rarity: string): number {
    switch (rarity) {
      case 'common': return 0.6;
      case 'uncommon': return 0.25;
      case 'rare': return 0.1;
      case 'legendary': return 0.02;
      default: return 0.5;
    }
  }

  /**
   * Get culturally appropriate name for a fish
   */
  getCulturalName(fish: FishSpecies, zone: CulturalZone): string {
    return fish.culturalNames?.[zone] || fish.name;
  }

  /**
   * Categorize fish by weight
   */
  getSizeCategory(weight: number): FishSizeCategory {
    if (weight < 1) return 'tiny';
    if (weight < 3) return 'small';
    if (weight < 7) return 'medium';
    if (weight < 15) return 'large';
    return 'huge';
  }

  /**
   * Calculate fish value based on size, rarity, and quality
   */
  calculateFishValue(species: FishSpecies, weight: number, quality?: 'poor' | 'normal' | 'excellent'): number {
    const sizeCategory = this.getSizeCategory(weight);
    
    // Base value from species
    let value = species.value;
    
    // Size multipliers
    const sizeMultipliers = {
      'tiny': 0.5,
      'small': 0.8,
      'medium': 1.0,
      'large': 1.5,
      'huge': 2.5
    };
    
    value *= sizeMultipliers[sizeCategory];
    
    // Rarity bonus
    if (species.rarity === 'uncommon') value *= 1.5;
    if (species.rarity === 'rare') value *= 2.5;
    if (species.rarity === 'legendary') value *= 5.0;
    
    // Quality modifier
    if (quality === 'poor') value *= 0.7;
    if (quality === 'excellent') value *= 1.5;
    
    return Math.round(value);
  }

  /**
   * Get descriptive size text
   */
  getSizeDescription(category: FishSizeCategory): string {
    const descriptions = {
      'tiny': 'Tiny catch!',
      'small': 'Small fish',
      'medium': 'Nice size!',
      'large': 'Big catch!',
      'huge': 'MONSTER FISH!'
    };
    return descriptions[category];
  }

  /**
   * Categorize fish size based on species and weight (alias for getSizeCategory)
   */
  categorizeFishSize(species: FishSpecies, weight: number): FishSizeCategory {
    return this.getSizeCategory(weight);
  }

  /**
   * Get size multiplier for fish value calculations
   */
  getSizeMultiplier(sizeCategory: FishSizeCategory): number {
    const sizeMultipliers = {
      'tiny': 0.5,
      'small': 0.8,
      'medium': 1.0,
      'large': 1.5,
      'huge': 2.5
    };
    return sizeMultipliers[sizeCategory];
  }
}

export const fishingDataService = new FishingDataService();
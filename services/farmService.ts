/**
 * services/farmService.ts - Unified farm management service
 * Handles farm data persistence, family associations, and farm-to-market logistics
 */

import { Tile, MapData, NpcEntity, Season, CulturalZone, HistoricalEra } from '../types';
import { generateNpcName, generateBaseProfile } from '../generation/common/npcUtils';
import { ValueNoise } from '../utils/noise';
import { mapLocationToCulture } from '../utils/mapUtils';
import { parseDateString } from '../utils/dateUtils';
// Heavy data files - import directly to avoid loading on app startup
import { GEOGRAPHICAL_DATA } from '../constants/gameData/geography';

export interface FarmSkill {
  name: string;
  level: 'novice' | 'skilled' | 'expert';
  description: string;
}

export interface FarmTrait {
  name: string;
  type: 'positive' | 'negative' | 'neutral';
  description: string;
  effect?: string; // Game mechanics effect
}

export interface FarmFamilyMember {
  id: string;
  name: string;
  age: number;
  role: 'Farmer' | 'Laborer' | 'Child' | 'Elder';
  gender: 'Male' | 'Female';
  health: number;
  maxHealth: number;
  fatigue: number;
  maxFatigue: number;
  skills: FarmSkill[];
  traits: FarmTrait[];
  currentTask?: 'planting' | 'watering' | 'harvesting' | 'feeding' | 'repairs' | 'resting' | 'ill';
  assignedField?: number;
  appearance?: any; // For procedural portrait generation
  diseaseHealth?: {
    currentDiseases: Array<{ disease: { name: string; severity: string } }>;
  };
}

export interface FarmFamily {
  familyName: string;
  headOfHousehold: string;
  members: FarmFamilyMember[];
  farmerId?: string; // NPC entity ID if farmer exists on map
}

export interface FieldState {
  id: number;
  crop: string | null;
  growthStage: 'fallow' | 'planted' | 'sprouting' | 'growing' | 'mature' | 'harvested';
  moisture: 'dry' | 'moist' | 'wet' | 'flooded';
  health: number; // 0-100
  daysToHarvest: number;
  lastWatered: number; // game day
  lastWorked: number; // game day
  pests: boolean;
  weeds: boolean;
}

export interface FarmResidencyStatus {
  playerStatus: 'visitor' | 'guest' | 'worker' | 'resident';
  daysWorked: number;
  tasksCompleted: number;
  trustLevel: number; // 0-100
  currentContract?: {
    type: 'daily' | 'weekly' | 'seasonal';
    daysRemaining: number;
    payment: {
      coins?: number;
      crops?: string[];
      meals?: boolean;
      lodging?: boolean
    };
    requiredTasks: string[];
    tasksToday?: string[];
  };
  lastRestDate?: number; // game day when last rested
  negotiationRounds?: number; // tracks negotiation attempts
}

export interface FarmState {
  tileKey: string; // `${x},${y}` for unique identification
  family: FarmFamily;
  fields: FieldState[];
  livestock: Array<{
    type: string;
    count: number;
    health: number;
    productivity: number;
  }>;
  buildings: string[];
  tools: string[];
  workers: number;
  reputation: number;
  lastMarketDay: number; // game day when farmer last went to market
  marketSchedule: number; // day of week (0-6) when farmer goes to market
  economicStatus: 'humble' | 'prosperous' | 'wealthy';
  prosperityLevel: 'subsistence' | 'small' | 'moderate' | 'thriving'; // More granular prosperity
  residencyStatus?: FarmResidencyStatus; // Player's relationship with this farm
  historicalContext: {
    era: HistoricalEra;
    culturalZone: CulturalZone;
    year: number;
  };
}

// Global farm state storage (in production, this would be in a database)
const farmStates = new Map<string, FarmState>();

/**
 * Get or create farm state for a tile
 */
export function getFarmState(
  tile: Tile,
  mapData: MapData,
  npcs: NpcEntity[]
): FarmState {
  const tileKey = `${tile.x},${tile.y}`;
  
  // Return existing state if available
  if (farmStates.has(tileKey)) {
    return farmStates.get(tileKey)!;
  }
  
  // Create new farm state
  const dateInfo = parseDateString(mapData.timeSlice || '1650');
  const culturalZone = mapLocationToCulture(mapData.continent || 'Europe', dateInfo.year);
  const regionName = mapData.region || Object.keys(GEOGRAPHICAL_DATA[culturalZone as CulturalZone] || {})[0] || 'DefaultRegion';
  const noise = new ValueNoise(tile.x * 13 + tile.y * 31);
  
  // Determine era from year
  const era = dateInfo.era as HistoricalEra || 'MEDIEVAL';
  
  // Generate family with region for proper names
  const family = generateFarmFamily(tile, culturalZone, regionName, noise, dateInfo.year, era);
  
  // Check if there's an NPC farmer on this tile
  const farmer = npcs.find(npc => 
    Math.floor(npc.x) === tile.x && 
    Math.floor(npc.y) === tile.y &&
    (npc.role?.toLowerCase().includes('farmer') || npc.role?.toLowerCase().includes('peasant'))
  );
  
  if (farmer) {
    family.farmerId = farmer.id;
    // Update farmer name to match family if needed
    const lastName = family.familyName.replace(' Family', '');
    if (!farmer.name.includes(lastName)) {
      farmer.name = `${farmer.name.split(' ')[0]} ${lastName}`;
    }
  }

  // Determine economic status and prosperity level FIRST
  const economicRoll = noise.random();
  const economicStatus = economicRoll > 0.8 ? 'wealthy' : economicRoll > 0.4 ? 'prosperous' : 'humble';

  // Determine more granular prosperity level
  let prosperityLevel: 'subsistence' | 'small' | 'moderate' | 'thriving' = 'small'; // Default fallback
  if (economicRoll > 0.85) {
    prosperityLevel = 'thriving';  // 8 fields
  } else if (economicRoll > 0.6) {
    prosperityLevel = 'moderate';   // 6 fields
  } else if (economicRoll > 0.3) {
    prosperityLevel = 'small';      // 4 fields
  } else {
    prosperityLevel = 'subsistence'; // 2 fields
  }

  // Initialize fields based on prosperity level
  const fieldCounts = {
    'subsistence': 2,
    'small': 4,
    'moderate': 6,
    'thriving': 8
  };

  const numFields = fieldCounts[prosperityLevel];
  const fields: FieldState[] = [];

  // Use the crop type from the tile if available, otherwise fall back to random generation
  const primaryCrop = tile.cropType || getRandomCrop(culturalZone, era);

  // Determine how many fields should be planted (about 50-66% planted)
  const plantedRatio = 0.5 + noise.random() * 0.16;
  const numPlanted = Math.floor(numFields * plantedRatio);

  for (let i = 0; i < numFields; i++) {
    const shouldPlant = i < numPlanted && noise.random() > 0.3;
    // Most fields grow the primary crop, but occasionally mix in other crops for variety
    const cropToPlant = shouldPlant ?
      (noise.random() < 0.8 ? primaryCrop : getRandomCrop(culturalZone, era)) :
      null;

    fields.push({
      id: i,
      crop: cropToPlant,
      growthStage: shouldPlant ? getRandomGrowthStage(noise) : 'fallow',
      moisture: ['dry', 'moist', 'wet'][Math.floor(noise.random() * 3)] as 'dry' | 'moist' | 'wet',
      health: 60 + Math.floor(noise.random() * 40),
      daysToHarvest: shouldPlant ? Math.floor(noise.random() * 30) : 0,
      lastWatered: 0,
      lastWorked: 0,
      pests: noise.random() < 0.15,
      weeds: noise.random() < 0.25
    });
  }

  // Create farm state
  const farmState: FarmState = {
    tileKey,
    family,
    fields,
    livestock: economicStatus === 'humble' 
      ? [{ type: 'chickens', count: 3 + Math.floor(noise.random() * 5), health: 75, productivity: 60 }]
      : economicStatus === 'prosperous'
      ? [
          { type: 'chickens', count: 8 + Math.floor(noise.random() * 8), health: 85, productivity: 75 },
          { type: 'cattle', count: 2 + Math.floor(noise.random() * 3), health: 80, productivity: 70 }
        ]
      : [
          { type: 'chickens', count: 15 + Math.floor(noise.random() * 10), health: 90, productivity: 85 },
          { type: 'cattle', count: 4 + Math.floor(noise.random() * 4), health: 85, productivity: 80 },
          { type: 'horses', count: 1 + Math.floor(noise.random() * 2), health: 90, productivity: 90 }
        ],
    buildings: economicStatus === 'humble'
      ? ['cottage', 'shed']
      : economicStatus === 'prosperous'
      ? ['farmhouse', 'barn', 'well']
      : ['manor house', 'large barn', 'granary', 'stable', 'well'],
    tools: economicStatus === 'humble'
      ? ['hoe', 'sickle']
      : economicStatus === 'prosperous'
      ? ['plow', 'scythe', 'rake', 'hoe']
      : ['plow', 'scythe', 'rake', 'hoe', 'seed drill', 'harrow'],
    workers: economicStatus === 'humble' ? 1 : economicStatus === 'prosperous' ? 2 + Math.floor(noise.random() * 2) : 3 + Math.floor(noise.random() * 3),
    reputation: 50 + Math.floor(noise.random() * 20),
    lastMarketDay: 0,
    marketSchedule: Math.floor(noise.random() * 7), // Random day of week
    economicStatus,
    prosperityLevel,
    historicalContext: {
      era: dateInfo.era as HistoricalEra,
      culturalZone,
      year: dateInfo.year
    }
  };
  
  // Store and return
  farmStates.set(tileKey, farmState);
  return farmState;
}

// Farm skills pool
const FARM_SKILLS: { name: string; description: string }[] = [
  { name: 'Crop Rotation', description: 'Knowledge of optimal planting cycles' },
  { name: 'Animal Husbandry', description: 'Skilled at caring for livestock' },
  { name: 'Weather Reading', description: 'Can predict weather patterns' },
  { name: 'Dowsing', description: 'Ability to find water sources' },
  { name: 'Seed Selection', description: 'Chooses the best seeds for planting' },
  { name: 'Tool Maintenance', description: 'Keeps equipment in good repair' },
  { name: 'Herbalism', description: 'Knowledge of medicinal plants' },
  { name: 'Beekeeping', description: 'Manages hives efficiently' },
  { name: 'Soil Enrichment', description: 'Improves soil quality naturally' },
  { name: 'Pest Control', description: 'Natural methods to deter pests' }
];

// Farm traits pool
const FARM_TRAITS: FarmTrait[] = [
  // Positive
  { name: 'Hard Worker', type: 'positive', description: 'Works 20% faster', effect: 'speed_bonus' },
  { name: 'Green Thumb', type: 'positive', description: 'Crops grow 15% better', effect: 'growth_bonus' },
  { name: 'Early Riser', type: 'positive', description: 'Starts work before dawn', effect: 'extra_hours' },
  { name: 'Strong Back', type: 'positive', description: 'Can work longer without tiring', effect: 'fatigue_resist' },
  { name: 'Cheerful', type: 'positive', description: 'Boosts family morale', effect: 'morale_bonus' },
  // Negative
  { name: 'Sickly', type: 'negative', description: 'Prone to illness', effect: 'disease_prone' },
  { name: 'Lazy', type: 'negative', description: 'Works 25% slower', effect: 'speed_penalty' },
  { name: 'Clumsy', type: 'negative', description: 'Sometimes damages crops', effect: 'accident_prone' },
  { name: 'Weak Constitution', type: 'negative', description: 'Tires quickly', effect: 'low_stamina' },
  // Neutral
  { name: 'Superstitious', type: 'neutral', description: 'Follows old farming traditions', effect: 'traditional' },
  { name: 'Quiet', type: 'neutral', description: 'Keeps to themselves', effect: 'introverted' },
  { name: 'Talkative', type: 'neutral', description: 'Loves to chat while working', effect: 'social' }
];

/**
 * Generate appearance for procedural portrait with culturally appropriate clothing
 */
function generateAppearance(gender: 'Male' | 'Female', age: number, noise: ValueNoise, culturalZone: CulturalZone, year: number, era: HistoricalEra): any {
  // Use the same system as SettlementInfoModal - generateBaseProfile
  const baseProfile = generateBaseProfile(noise, { era, culturalZone, region: '' });
  
  // Override gender and adjust for age if needed
  const appearance = { ...baseProfile.appearance };
  
  // Return the appearance from baseProfile, which includes proper cultural clothing and colors
  return appearance;
}

// OLD VERSION - keeping for reference
function OLD_generateAppearance(gender: 'Male' | 'Female', age: number, noise: ValueNoise, culturalZone: CulturalZone, year: number): any {
  const skinColors = ['#FDBCB4', '#F4C2A1', '#E5B887', '#D2A679', '#C68642', '#8D5524', '#6B4423', '#4A3C28'];
  const hairColors = ['#090806', '#2C1B18', '#4A312C', '#68462D', '#8D4A32', '#B55239', '#E6BE8A', '#EEDC9D'];
  const eyeColors = ['#654321', '#5D4E37', '#7B6D54', '#4B7C4D', '#6CA0DC', '#B19CD9'];
  
  // Culturally appropriate clothing
  const clothingByZone: Record<CulturalZone, { garments: string[], headgear: string[], materials: string[] }> = {
    'EUROPEAN': {
      garments: ['tunic', 'doublet', 'kirtle', 'cotte', 'surcoat'],
      headgear: ['coif', 'hood', 'straw hat', 'cap'],
      materials: ['wool', 'linen', 'hemp']
    },
    'EAST_ASIAN': {
      garments: ['hanfu', 'changshan', 'ruqun', 'zhiduo', 'aoqun'],
      headgear: ['guan', 'jin', 'bamboo hat', 'headscarf'],
      materials: ['silk', 'cotton', 'hemp']
    },
    'MENA': {
      garments: ['thobe', 'kaftan', 'jalabiya', 'abaya', 'dishdasha'],
      headgear: ['keffiyeh', 'turban', 'hijab', 'taqiyah'],
      materials: ['cotton', 'linen', 'wool']
    },
    'SOUTH_ASIAN': {
      garments: ['kurta', 'dhoti', 'sari', 'lehenga', 'churidar'],
      headgear: ['pagri', 'dupatta', 'turban', 'topi'],
      materials: ['cotton', 'silk', 'khadi']
    },
    'SUB_SAHARAN_AFRICAN': {
      garments: ['dashiki', 'boubou', 'kanga', 'wrapper', 'agbada'],
      headgear: ['kufi', 'gele', 'dhuku', 'headwrap'],
      materials: ['cotton', 'kente', 'mud cloth']
    },
    'NORTH_AMERICAN_PRE_COLUMBIAN': {
      garments: ['breechcloth', 'leggings', 'dress', 'shirt', 'robe'],
      headgear: ['headband', 'feather crown', 'fur hat', 'none'],
      materials: ['buckskin', 'hide', 'fur']
    },
    'SOUTH_AMERICAN': {
      garments: ['poncho', 'unku', 'anacu', 'lliclla', 'chumpi'],
      headgear: ['chullo', 'montera', 'headband', 'none'],
      materials: ['alpaca wool', 'cotton', 'vicuña']
    },
    'OCEANIAN': {
      garments: ['tapa cloth wrap', 'lavalava', 'grass skirt', 'sarong'],
      headgear: ['flower crown', 'feather headdress', 'none', 'headband'],
      materials: ['tapa', 'grass', 'bark cloth']
    },
    'NORTH_AMERICAN_COLONIAL': {
      garments: ['shirt', 'breeches', 'petticoat', 'stays', 'waistcoat'],
      headgear: ['tricorn hat', 'bonnet', 'cap', 'straw hat'],
      materials: ['linen', 'wool', 'cotton']
    },
    'ARCTIC': {
      garments: ['parka', 'anorak', 'kamleika', 'amauti'],
      headgear: ['fur hood', 'knit cap', 'none'],
      materials: ['sealskin', 'caribou hide', 'fur']
    },
    'CARIBBEAN': {
      garments: ['shirt', 'skirt', 'dress', 'breeches', 'wrapper'],
      headgear: ['headwrap', 'straw hat', 'none'],
      materials: ['cotton', 'linen', 'calico']
    },
    'CENTRAL_ASIAN': {
      garments: ['chapan', 'deel', 'kalat', 'shalwar'],
      headgear: ['tubeteika', 'kalpak', 'turban'],
      materials: ['silk', 'wool', 'felt']
    },
    'SOUTHEAST_ASIAN': {
      garments: ['sarong', 'kebaya', 'sampot', 'sinh', 'longyi'],
      headgear: ['tengkolok', 'songkok', 'none'],
      materials: ['batik', 'silk', 'cotton']
    },
    'AUSTRALIAN_ABORIGINAL': {
      garments: ['possum skin cloak', 'grass skirt', 'none'],
      headgear: ['headband', 'none'],
      materials: ['possum skin', 'grass', 'bark']
    }
  };
  
  const clothing = clothingByZone[culturalZone] || clothingByZone['EUROPEAN'];
  const garment = clothing.garments[Math.floor(noise.random() * clothing.garments.length)];
  const material = clothing.materials[Math.floor(noise.random() * clothing.materials.length)];
  const headgear = clothing.headgear[Math.floor(noise.random() * clothing.headgear.length)];
  
  // Generate colors based on economic status (farmers are usually modest)
  const primaryColors = ['#8B7355', '#A0826D', '#7B6858', '#6B5D54', '#8B7969'];
  const secondaryColors = ['#D2B48C', '#C19A6B', '#B8986B', '#A68A5B'];
  const accentColors = ['#CD853F', '#D2691E', '#B8860B', '#DAA520'];
  
  return {
    skinColor: skinColors[Math.floor(noise.random() * skinColors.length)],
    hairColor: age > 50 ? '#C0C0C0' : hairColors[Math.floor(noise.random() * hairColors.length)],
    eyeColor: eyeColors[Math.floor(noise.random() * eyeColors.length)],
    hairstyle: gender === 'Male' ? 'short' : (noise.random() > 0.5 ? 'long' : 'medium'),
    build: ['slight', 'average', 'stocky', 'athletic'][Math.floor(noise.random() * 4)],
    faceShape: ['oval', 'round', 'square', 'heart'][Math.floor(noise.random() * 4)],
    facialHair: gender === 'Male' && age > 16 && noise.random() > 0.3,
    facialHairStyle: 'full_beard',
    garment: { name: garment, material: material },
    headgear: { name: headgear, material: headgear === 'none' ? 'none' : material },
    palette: {
      primary: primaryColors[Math.floor(noise.random() * primaryColors.length)],
      secondary: secondaryColors[Math.floor(noise.random() * secondaryColors.length)],
      accent: accentColors[Math.floor(noise.random() * accentColors.length)]
    }
  };
}

/**
 * Generate a culturally appropriate farm family
 */
function generateFarmFamily(
  tile: Tile,
  culturalZone: CulturalZone,
  region: string,
  noise: ValueNoise,
  year: number,
  era: HistoricalEra
): FarmFamily {
  // Generate family head name with proper region
  const headName = generateNpcName('Male', culturalZone, region, year, noise);
  
  // For family name, just use the head's name as-is
  // This matches how SettlementInfoPanel displays "Prominent Families"
  const familyName = headName;
  
  // Generate family members
  const members: FarmFamilyMember[] = [];
  
  // Head of household
  const headAge = 35 + Math.floor(noise.random() * 20);
  members.push({
    id: `farmer_${tile.x}_${tile.y}_0`,
    name: headName,
    age: headAge,
    role: 'Farmer',
    gender: 'Male',
    health: 80 + Math.floor(noise.random() * 20),
    maxHealth: 100,
    fatigue: 20 + Math.floor(noise.random() * 30),
    maxFatigue: 100,
    skills: [
      { 
        name: FARM_SKILLS[Math.floor(noise.random() * FARM_SKILLS.length)].name,
        level: 'expert',
        description: FARM_SKILLS[Math.floor(noise.random() * FARM_SKILLS.length)].description
      }
    ],
    traits: [
      FARM_TRAITS[Math.floor(noise.random() * 5)], // Positive trait likely
      noise.random() > 0.7 ? FARM_TRAITS[5 + Math.floor(noise.random() * 4)] : FARM_TRAITS[9 + Math.floor(noise.random() * 3)]
    ].filter(Boolean),
    appearance: generateAppearance('Male', headAge, noise, culturalZone, year, era)
  });
  
  // Spouse
  const spouseName = generateNpcName('Female', culturalZone, region, year, noise);
  const spouseAge = 30 + Math.floor(noise.random() * 20);
  members.push({
    id: `farmer_${tile.x}_${tile.y}_1`,
    name: spouseName,
    age: spouseAge,
    role: 'Farmer',
    gender: 'Female',
    health: 75 + Math.floor(noise.random() * 25),
    maxHealth: 100,
    fatigue: 25 + Math.floor(noise.random() * 30),
    maxFatigue: 100,
    skills: [
      { 
        name: FARM_SKILLS[Math.floor(noise.random() * FARM_SKILLS.length)].name,
        level: noise.random() > 0.5 ? 'expert' : 'skilled',
        description: FARM_SKILLS[Math.floor(noise.random() * FARM_SKILLS.length)].description
      }
    ],
    traits: [
      FARM_TRAITS[Math.floor(noise.random() * 5)],
      noise.random() > 0.8 ? FARM_TRAITS[5 + Math.floor(noise.random() * 4)] : null
    ].filter(Boolean),
    appearance: generateAppearance('Female', spouseAge, noise, culturalZone, year, era)
  });
  
  // Children/laborers
  const numChildren = 2 + Math.floor(noise.random() * 4);
  for (let i = 0; i < numChildren; i++) {
    const age = 8 + Math.floor(noise.random() * 20);
    const gender = noise.random() > 0.5 ? 'Male' : 'Female';
    const childName = generateNpcName(gender, culturalZone, region, year, noise);
    
    members.push({
      id: `farmer_${tile.x}_${tile.y}_${i + 2}`,
      name: childName,
      age,
      role: age < 16 ? 'Child' : age > 60 ? 'Elder' : 'Laborer',
      gender,
      health: age < 16 ? 90 + Math.floor(noise.random() * 10) : 70 + Math.floor(noise.random() * 30),
      maxHealth: 100,
      fatigue: age < 16 ? 10 + Math.floor(noise.random() * 20) : 20 + Math.floor(noise.random() * 40),
      maxFatigue: 100,
      skills: age >= 14 ? [{
        name: FARM_SKILLS[Math.floor(noise.random() * FARM_SKILLS.length)].name,
        level: age < 20 ? 'novice' : 'skilled',
        description: FARM_SKILLS[Math.floor(noise.random() * FARM_SKILLS.length)].description
      }] : [],
      traits: [
        age < 16 && noise.random() > 0.7 ? { name: 'Energetic', type: 'positive' as const, description: 'Full of youthful energy' } :
        age > 50 ? { name: 'Experienced', type: 'positive' as const, description: 'Years of farming wisdom' } :
        FARM_TRAITS[Math.floor(noise.random() * FARM_TRAITS.length)]
      ].filter(Boolean),
      appearance: generateAppearance(gender, age, noise, culturalZone, year, era)
    });
  }
  
  return {
    familyName,
    headOfHousehold: headName,
    members
  };
}

/**
 * Update farm state
 */
export function updateFarmState(tileKey: string, updates: Partial<FarmState>): void {
  const existing = farmStates.get(tileKey);
  if (existing) {
    farmStates.set(tileKey, { ...existing, ...updates });
  }
}

/**
 * Check if farmer should go to market today
 */
export function shouldFarmerGoToMarket(farmState: FarmState, currentGameDay: number): boolean {
  const dayOfWeek = currentGameDay % 7;
  const daysSinceMarket = currentGameDay - farmState.lastMarketDay;
  
  // Go to market on scheduled day, but not more than once per week
  return dayOfWeek === farmState.marketSchedule && daysSinceMarket >= 7;
}

/**
 * Get historically accurate crops for the given context
 */
export function getValidCrops(
  culturalZone: CulturalZone,
  year: number,
  season: Season
): string[] {
  const crops: string[] = [];
  
  // Base crops by cultural zone
  const baseCrops: Record<CulturalZone, string[]> = {
    'EUROPEAN': ['wheat', 'barley', 'rye', 'oats', 'turnips', 'cabbage', 'peas'],
    'EAST_ASIAN': ['rice', 'millet', 'soybeans', 'tea', 'bok choy', 'radishes'],
    'MENA': ['wheat', 'barley', 'dates', 'lentils', 'chickpeas', 'melons'],
    'SOUTH_AMERICAN': ['maize', 'potatoes', 'quinoa', 'beans', 'squash'],
    'SUB_SAHARAN_AFRICAN': ['sorghum', 'millet', 'yams', 'cassava', 'groundnuts'],
    'NORTH_AMERICAN_PRE_COLUMBIAN': ['maize', 'beans', 'squash', 'sunflowers'],
    'SOUTH_ASIAN': ['rice', 'wheat', 'lentils', 'chickpeas', 'cotton', 'jute'],
    'OCEANIA': ['taro', 'yams', 'breadfruit', 'coconut', 'sweet potato'],
    'ARCTIC': [], // No traditional farming
    'CARIBBEAN': ['cassava', 'sweet potato', 'maize', 'beans'],
    'CENTRAL_ASIAN': ['wheat', 'barley', 'millet'],
    'AUSTRALIAN_ABORIGINAL': [], // No traditional farming
    'SOUTHEAST_ASIAN': ['rice', 'coconut', 'spices', 'rubber'],
    'NORTH_AMERICAN_COLONIAL': ['wheat', 'maize', 'tobacco', 'cotton'],
    'GENERIC_FALLBACK': ['wheat', 'barley', 'vegetables']
  };
  
  crops.push(...(baseCrops[culturalZone] || baseCrops['GENERIC_FALLBACK']));
  
  // Add New World crops after 1492 for Old World
  if (year > 1492 && ['EUROPEAN', 'MENA', 'EAST_ASIAN', 'SUB_SAHARAN_AFRICAN'].includes(culturalZone)) {
    crops.push('potatoes', 'tomatoes', 'maize', 'tobacco');
  }
  
  // Add Old World crops after 1492 for New World
  if (year > 1492 && ['SOUTH_AMERICAN', 'NORTH_AMERICAN_PRE_COLUMBIAN', 'CARIBBEAN'].includes(culturalZone)) {
    crops.push('wheat', 'rice', 'sugarcane', 'coffee');
  }
  
  // Filter by season
  const seasonalCrops: Record<Season, string[]> = {
    'spring': ['wheat', 'barley', 'peas', 'rice', 'potatoes'],
    'summer': ['maize', 'beans', 'melons', 'tomatoes', 'cotton'],
    'fall': ['squash', 'turnips', 'cabbage', 'sweet potato'],
    'winter': ['winter wheat', 'rye'] // Limited winter crops
  };
  
  if (season === 'winter') {
    return crops.filter(crop => seasonalCrops.winter.includes(crop) || crop.includes('winter'));
  }
  
  return crops;
}

/**
 * Update residency status for a farm
 */
export function updateResidencyStatus(
  tileKey: string,
  status: Partial<FarmResidencyStatus>
): void {
  const farm = farmStates.get(tileKey);
  if (farm) {
    farm.residencyStatus = {
      ...farm.residencyStatus,
      ...status
    } as FarmResidencyStatus;
    farmStates.set(tileKey, farm);
  }
}

/**
 * Get residency status for a farm
 */
export function getResidencyStatus(tileKey: string): FarmResidencyStatus | undefined {
  const farm = farmStates.get(tileKey);
  return farm?.residencyStatus;
}

/**
 * Accept a work contract at a farm
 */
export function acceptWorkContract(
  tileKey: string,
  tasks: string[],
  payment: { meals?: boolean; lodging?: boolean; coins?: number }
): void {
  const farm = farmStates.get(tileKey);
  if (farm) {
    const currentStatus = farm.residencyStatus || {
      playerStatus: 'visitor',
      daysWorked: 0,
      tasksCompleted: 0,
      trustLevel: 50
    };

    // Upgrade to worker status after accepting contract
    const newStatus: FarmResidencyStatus = {
      ...currentStatus,
      playerStatus: currentStatus.playerStatus === 'resident' ? 'resident' : 'worker',
      currentContract: {
        type: 'daily',
        daysRemaining: 1,
        payment,
        requiredTasks: tasks,
        tasksToday: tasks
      },
      negotiationRounds: 0 // Reset negotiation rounds
    };

    farm.residencyStatus = newStatus;
    farmStates.set(tileKey, farm);
  }
}

/**
 * Clear all farm states (for testing or reset)
 */
export function clearAllFarmStates(): void {
  farmStates.clear();
}

// Clear farm states on module load to ensure new prosperityLevel property is available
farmStates.clear();

/**
 * Get a random crop appropriate for the cultural zone and era
 */
function getRandomCrop(culturalZone: CulturalZone, era: HistoricalEra): string {
  const crops: Record<CulturalZone, string[]> = {
    'EUROPEAN': ['wheat', 'barley', 'rye', 'oats', 'turnips'],
    'EAST_ASIAN': ['rice', 'millet', 'soybeans', 'wheat'],
    'MENA': ['wheat', 'barley', 'dates', 'lentils'],
    'SUB_SAHARAN_AFRICAN': ['sorghum', 'millet', 'yams', 'cassava'],
    'SOUTH_ASIAN': ['rice', 'wheat', 'lentils', 'chickpeas'],
    'NORTH_AMERICAN_PRE_COLUMBIAN': ['maize', 'beans', 'squash'],
    'NORTH_AMERICAN_COLONIAL': ['wheat', 'corn', 'tobacco', 'cotton'],
    'SOUTH_AMERICAN': ['maize', 'potatoes', 'quinoa', 'beans'],
    'OCEANIA': ['taro', 'yams', 'breadfruit', 'coconut']
  };

  const availableCrops = crops[culturalZone] || crops['EUROPEAN'];
  return availableCrops[Math.floor(Math.random() * availableCrops.length)];
}

/**
 * Get a random growth stage for initial field state
 */
function getRandomGrowthStage(noise: ValueNoise): 'planted' | 'sprouting' | 'growing' | 'mature' {
  const roll = noise.random();
  if (roll > 0.75) return 'mature';
  if (roll > 0.5) return 'growing';
  if (roll > 0.25) return 'sprouting';
  return 'planted';
}

/**
 * Get all farm states (for persistence)
 */
export function getAllFarmStates(): Map<string, FarmState> {
  return farmStates;
}

/**
 * Load farm states from storage
 */
export function loadFarmStates(states: Map<string, FarmState>): void {
  farmStates.clear();
  states.forEach((state, key) => {
    farmStates.set(key, state);
  });
}
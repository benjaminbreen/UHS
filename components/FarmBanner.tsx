/**
 * components/FarmBanner.tsx — Atmospheric pixel-art farm banner (v4)
 * - Crisp pixel look with tasteful gradients + dithers (no lollipops, no flicker)
 * - Static crop geometry via seeded RNG; gentle wind sway only (optional)
 * - Proper clearing around farmstead & lane (crops never draw through buildings)
 * - Crop-type seasonal renderers: Vineyard, Olive Grove, Apple Orchard, Wheat/Barley/Rye,
 *   Sugar Cane/Corn, Cotton, Rice Paddy (flooded/vegetative/harvest/fallow)
 * - Culture/Era-specific farmsteads with appropriate silhouettes/details
 * - Biome dressing from ClimateType; parallax hills/treeline; fog band; vignette
 * - Stable weather particles (snow/rain/leaves/dust); optional fireflies at summer dusk
 * - Long aspect (1280×220) to fit modal banners; pixelated rendering
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { HistoricalEra, CulturalZone, ClimateType, Season, TimeOfDay, BiomeType } from '../types';
import { generateFarmBannerCaption } from '../services/farmBannerCaptionService';

export type Condition = 'humble' | 'prosperous';
export type CropType = string;

interface FarmAnimal {
  type: string;
  count: number;
}

interface FarmHouseholdMember {
  id: string;
  name: string;
  age: number;
  role: 'Farmer' | 'Laborer' | 'Child' | 'Elder';
  gender: 'Male' | 'Female';
  currentTask?: 'planting' | 'watering' | 'harvesting' | 'feeding' | 'repairs' | 'resting' | 'ill';
}

interface FarmBannerProps {
  era: HistoricalEra;
  culturalZone: CulturalZone;
  condition: Condition;
  cropType: CropType;
  climate: ClimateType;
  season: Season;
  seed?: number;
  width?: number;
  height?: number;
  timeOfDay?: TimeOfDay;
  farmName?: string;
  farmerName?: string;
  currentBiome?: BiomeType;  // The biome where the farm is located
  surroundingBiomes?: BiomeType[];  // Biomes in the surrounding area
  livestock?: FarmAnimal[];  // Actual farm animals to render
  householdMembers?: FarmHouseholdMember[];  // Actual household members to render
  onCharacterClick?: (memberId: string) => void;  // Callback when character is clicked
}

/* -------------------------------------------------------------------------- */
/* Utilities                                                                  */
/* -------------------------------------------------------------------------- */

class RNG {
  private s: number;
  constructor(seed: number) { this.s = (seed || 1) >>> 0; }
  next() { // xorshift32
    let x = this.s; x ^= x << 13; x ^= x >>> 17; x ^= x << 5; this.s = x >>> 0;
    return (this.s & 0xffffffff) / 0x100000000;
  }
  int(min: number, max: number) { return Math.floor(min + this.next() * (max - min + 1)); }
  range(min: number, max: number) { return min + this.next() * (max - min); }
}

const clamp = (v: number, a = 0, b = 255) => Math.max(a, Math.min(b, v));
const hexToRgb = (hex: string) => {
  if (!hex || typeof hex !== 'string') return { r: 128, g: 128, b: 128 }; // Default gray if invalid
  const n = hex.replace('#', '');
  return { r: parseInt(n.slice(0, 2), 16), g: parseInt(n.slice(2, 4), 16), b: parseInt(n.slice(4, 6), 16) };
};
const rgbToHex = (r: number, g: number, b: number) =>
  `#${clamp(r).toString(16).padStart(2, '0')}${clamp(g).toString(16).padStart(2, '0')}${clamp(b).toString(16).padStart(2, '0')}`;
const shade = (hex: string, pct: number) => {
  if (!hex || typeof hex !== 'string') return '#808080'; // Default gray if invalid
  const { r, g, b } = hexToRgb(hex);
  const f = (v: number) => (pct >= 0 ? v + (255 - v) * pct / 100 : v + v * pct / 100);
  return rgbToHex(Math.round(f(r)), Math.round(f(g)), Math.round(f(b)));
};

const mix = (a: string, b: string, t: number) => {
  const A = hexToRgb(a), B = hexToRgb(b);
  return rgbToHex(A.r + (B.r - A.r) * t, A.g + (B.g - A.g) * t, A.b + (B.b - A.b) * t);
};

/* -------------------------------------------------------------------------- */
/* Color Palette System                                                       */
/* -------------------------------------------------------------------------- */

// Material colors - building components and natural materials
const MATERIAL_COLORS = {
  // Wood variants
  wood_dark: '#5b3a24',
  wood_medium: '#7b4f2a',
  wood_light: '#8b7356',
  wood_beam: '#654321',
  wood_weathered: '#6f4426',
  wood_oak: '#6f4b2e',
  wood_pine: '#7a5a2a',

  // Stone and masonry
  stone_gray: '#8a8a8a',
  stone_dark: '#696969',
  stone_foundation: '#5b5b5b',
  adobe: '#ead9c5',
  adobe_shadow: '#c8b4a0',
  adobe_detail: '#d6c4b0',
  brick_red: '#8b4513',

  // Metals
  metal_iron: '#a1a1aa',
  metal_steel: '#b7bcc4',
  metal_shine: '#e5e7eb',
  metal_bronze: '#cd7f32',
  metal_dark: '#8a909b',

  // Roofing
  thatch_light: '#d7b46b',
  thatch_dark: '#c4a05c',
  thatch_straw: '#caa56a',
  tiles_red: '#bf3a3a',
  tiles_dark: '#a83232',
  tiles_ridge: '#7a2020',

  // Fabric and textiles
  fabric_blue: '#87CEEB',
  fabric_blue_dark: '#6495ED',
  fabric_navy: '#4682B4',
  fabric_pink: '#FFB6C1',
  fabric_white: '#F5F5F5',
  fabric_cream: '#f4e6d9',

  // Earth tones
  dirt_dark: '#2c1b12',
  dirt_medium: '#3d2618',
  dirt_light: '#8B7355',
  mud: '#5a3f2a',
  sand: '#d4a574',
  clay: '#b78c44',

  // Animal materials
  bone: '#e8dcc8',
} as const;

// Plant and crop colors
const PLANT_COLORS = {
  // Greens - foliage and crops
  green_spring: '#90EE90',
  green_light: '#98FB98',
  green_medium: '#3CB371',
  green_deep: '#228B22',
  green_forest: '#2F682F',
  green_olive: '#556B2F',
  green_sage: '#8FBC8F',
  green_lime: '#9ACD32',

  // Grain crops
  wheat_gold: '#DAA520',
  wheat_ripe: '#F5DEB3',
  barley_tan: '#D2691E',
  barley_light: '#DEB887',
  rye_brown: '#8B7355',
  rye_dark: '#A0826D',
  oat_cream: '#F5E6D3',
  oat_tan: '#E5D4B1',
  grain_golden: '#d1b24a',
  grain_harvest: '#FFD700',

  // Fruits and flowers
  apple_red: '#DC143C',
  apple_dark: '#B22222',
  grape_purple: '#4B0082',
  grape_light: '#6B0AA3',
  orange: '#FF8C00',
  blossom_pink: '#FFB6C1',
  blossom_white: '#FFC0CB',
  blossom_pale: '#FFF0F5',
  flower_yellow: '#F0E68C',

  // Cotton
  cotton_white: '#FFFFFF',
  cotton_cream: '#FFFAF0',
  cotton_boll: '#8B4513',

  // Autumn foliage
  autumn_orange: '#FF8C00',
  autumn_gold: '#FFD700',
  autumn_red: '#DC143C',
  autumn_brown: '#8B4513',
  autumn_rust: '#CD853F',
  leaf_fall: '#D2691E',

  // Tree colors
  tree_trunk: '#5d3b24',
  tree_bark: '#6e4c2a',
  pine_green: '#2f4a2f',
  pine_snow: '#4a5d4a',
} as const;

// Animal colors
const ANIMAL_COLORS = {
  chicken_white: '#FFFFFF',
  chicken_light: '#F5F5F5',
  chicken_beak: '#FF4500',
  cat_gray: '#4A4A4A',
  cat_eye: '#FFD700',
  dog_brown: '#8B4513',
  dog_ear: '#654321',
  dog_nose: '#2F2F2F',
  cow_brown: '#6B4423',
  cow_white: '#E8E0D5',
  goat_tan: '#C9A66B',
  goat_white: '#F5F1E8',
  sheep_white: '#F0ECE3',
  sheep_gray: '#B0A89F',
  horse_brown: '#5D3A1A',
  horse_black: '#2B2624',
  pig_pink: '#E5B8B0',
  shadow_light: '#000000', // Used with opacity
} as const;

// Character and clothing colors
const CHARACTER_COLORS = {
  skin_light: '#f1c7a5',
  skin_medium: '#d4a574',
  skin_tan: '#c89968',
  clothing_farmer: '#7b4f2a',
  clothing_worker: '#6f5a3f',
  clothing_peasant: '#8b7356',
  clothing_dark: '#3b3b3b',
  hat_straw: '#5a3b1f',
  hat_felt: '#2c1b12',
} as const;

// Water and weather
const WATER_WEATHER_COLORS = {
  water_blue: '#66b6ff',
  water_light: '#7ac0ff',
  water_deep: '#6aa8df',
  water_frozen: '#bfd6f0',
  water_shimmer: '#6fbfff',
  rain_drop: '#6B9BD1',
  snow_white: '#ffffff',
  fog_mist: '#ffffff',
  dust_tan: '#d4a574',
  firefly_glow: '#ffe890',
  pollen_yellow: '#FFFFE0',
} as const;

// Sky gradients are kept separate as they're already well-organized in TIME_PAL

/* -------------------------------------------------------------------------- */
/* Palettes                                                                   */
/* -------------------------------------------------------------------------- */

const TIME_PAL = {
  Dawn:  { skyTop: '#f59e7e', skyMid: '#ffc992', skyBot: '#fff2cc', sun: '#ffd46b', star: '#cfe4ff', vignette: '#0008' },
  Day:   { skyTop: '#7ecbff', skyMid: '#aee0ff', skyBot: '#d8f3ff', sun: '#ffe27a', star: '#cfe4ff', vignette: '#0006' },
  Midday:{ skyTop: '#63b8ff', skyMid: '#9bd6ff', skyBot: '#cfeeff', sun: '#ffe27a', star: '#cfe4ff', vignette: '#0006' },
  Dusk:  { skyTop: '#3a3a68', skyMid: '#e07a5f', skyBot: '#f2cc8f', sun: '#ffb161', star: '#d8e8ff', vignette: '#000a' },
  Night: { skyTop: '#0b1628', skyMid: '#0e2139', skyBot: '#0b1628', sun: '#f6f7ff', star: '#d8e8ff', vignette: '#000c' }
} as const;

// Climate-aware seasonal palettes
const getSeasonPalette = (season: Season, climate: ClimateType) => {
  // Tropical and semitropical climates have minimal seasonal variation
  if (climate === ClimateType.TROPICAL || climate === ClimateType.SEMITROPICAL) {
    return {
      ground: '#8e6237', path: '#6e4f33', grass: '#3b8a2f', 
      water: '#66b6ff', tree: '#2f682f', bloom: '#ffd6a6',
      // Tropical has consistent lush greens year-round
      variation: 0.95 // High consistency
    };
  }
  
  // Arid climates have dry, dusty colors year-round
  if (climate === ClimateType.ARID) {
    const base = {
      spring: { ground: '#b89968', path: '#9c7d54', grass: '#7a6a3f', water: '#8fc4e0', tree: '#6b5d3a', bloom: '#ffdb9b' },
      summer: { ground: '#c4a574', path: '#a88960', grass: '#8a7645', water: '#8fc4e0', tree: '#7a6a40', bloom: '#ffe0a6' },
      fall:   { ground: '#b09560', path: '#947950', grass: '#7a6638', water: '#8fc4e0', tree: '#6b5d36', bloom: '#ffd49b' },
      winter: { ground: '#a88b58', path: '#8c6f48', grass: '#706035', water: '#8fc4e0', tree: '#635532', bloom: '#f5e0c0' }
    };
    return { ...base[season], variation: 0.7 };
  }
  
  // Mediterranean - mild winters without snow
  if (climate === ClimateType.MEDITERRANEAN) {
    const base = {
      spring: { ground: '#7b5e3e', path: '#6a5035', grass: '#367b2f', water: '#7ac0ff', tree: '#2a5a2e', bloom: '#ffd6e0' },
      summer: { ground: '#9e7647', path: '#8a6238', grass: '#4a7a35', water: '#66b6ff', tree: '#3a6835', bloom: '#ffd6a6' },
      fall:   { ground: '#8a6640', path: '#765436', grass: '#4a7232', water: '#6aa8df', tree: '#3a6032', bloom: '#ffb36b' },
      winter: { ground: '#7a5e3e', path: '#6a5035', grass: '#5a7a4a', water: '#7ac0ff', tree: '#4a6040', bloom: '#e0f0ff' } // No snow
    };
    return { ...base[season], variation: 0.8 };
  }
  
  // Cold climates have more extreme seasonal changes
  if (climate === ClimateType.COLD) {
    const base = {
      spring: { ground: '#6b5e3e', path: '#5a4530', grass: '#2a6b25', water: '#7ac0ff', tree: '#1a4a20', bloom: '#ffd6e0' },
      summer: { ground: '#7e5237', path: '#6e4033', grass: '#2b7a25', water: '#66b6ff', tree: '#1f5825', bloom: '#ffd6a6' },
      fall:   { ground: '#6f4b2e', path: '#5a3f2a', grass: '#3a5a20', water: '#6aa8df', tree: '#2f4920', bloom: '#ffb36b' },
      winter: { ground: '#e0e4ef', path: '#d0d4e0', grass: '#808a80', water: '#cfe6ff', tree: '#6b7370', bloom: '#ffffff' } // Heavy snow
    };
    return { ...base[season], variation: 0.5 };
  }
  
  // Default temperate climate
  const base = {
    spring: { ground: '#7b5e3e', path: '#6a5035', grass: '#367b2f', water: '#7ac0ff', tree: '#2a5a2e', bloom: '#ffd6e0' },
    summer: { ground: '#8e6237', path: '#6e4f33', grass: '#3b8a2f', water: '#66b6ff', tree: '#2f682f', bloom: '#ffd6a6' },
    fall:   { ground: '#6f4b2e', path: '#5a3f2a', grass: '#3a6a29', water: '#6aa8df', tree: '#2f592a', bloom: '#ffb36b' },
    winter: { ground: '#9ea4af', path: '#8d92a0', grass: '#4b6a4b', water: '#bfd6f0', tree: '#3b5340', bloom: '#cfe3ff' }
  };
  return { ...base[season], variation: 0.6 };
};

/* -------------------------------------------------------------------------- */
/* Variant & Growth                                                           */
/* -------------------------------------------------------------------------- */

const variantFrom = (era: HistoricalEra, zone: CulturalZone) => {
  const z = String(zone || 'European').toLowerCase();
  if (/east|asia/.test(z)) return 'east_asian';
  if (/mena|arab|persian|levant|mediterranean/.test(z)) return 'mena';
  if (/nordic|scand|viking/.test(z)) return 'nordic';
  if (/steppe|siber|arctic/.test(z)) return 'steppe';
  if (/american|north/.test(z)) return era < (HistoricalEra.MODERN_ERA || 1950) ? 'frontier' : 'modern';
  return era < (HistoricalEra.INDUSTRIAL_ERA || 1800) ? 'medieval_euro' : (era < (HistoricalEra.MODERN_ERA || 1950) ? 'industrial_euro' : 'modern');
};

type GrowthStage = 'seedling' | 'vegetative' | 'fruiting' | 'harvest' | 'fallow' | 'flooded' | 'blossom' | 'ripening' | 'plowing' | 'dormant';
const growthFor = (cropType: CropType, season: Season, climate: ClimateType): GrowthStage => {
  // Guard against invalid inputs
  if (!cropType || typeof cropType !== 'string') return 'plowing';
  if (!climate || typeof climate !== 'string') return 'vegetative'; // Default growth stage if climate undefined
  if (!season || typeof season !== 'string') return 'vegetative';

  const c = cropType.toLowerCase();

  // Tropical and semitropical climates have year-round growing seasons
  if (climate === ClimateType.TROPICAL || climate === ClimateType.SEMITROPICAL) {
    if (c.includes('rice')) return 'flooded'; // Always flooded in tropical
    if (['coconut', 'banana', 'palm', 'coffee', 'cacao'].some(k => c.includes(k))) return 'fruiting'; // Always producing
    if (['sugar', 'cane'].some(k => c.includes(k))) return 'vegetative'; // Always green
    if (['cotton', 'tobacco'].some(k => c.includes(k))) return 'vegetative';
    // Most crops are always productive in tropical climates
    return 'vegetative';
  }
  
  // Arid climates have limited growing seasons
  if (climate === ClimateType.ARID) {
    if (c.includes('date') || c.includes('palm')) return season === 'winter' ? 'vegetative' : 'fruiting';
    if (c.includes('olive')) return season === 'spring' ? 'vegetative' : season === 'fall' ? 'fruiting' : 'harvest';
    // Most crops struggle in summer heat
    if (season === 'summer') return 'fallow';
    if (season === 'winter') return 'vegetative';
    if (season === 'spring') return 'seedling';
    return 'harvest';
  }
  
  // Mediterranean climates - mild winters allow some growth
  if (climate === ClimateType.MEDITERRANEAN) {
    if (c.includes('olive') || c.includes('grape') || c.includes('citrus')) {
      if (season === 'winter') return 'vegetative'; // Can grow in mild winter
      if (season === 'spring') return 'blossom';
      if (season === 'summer') return 'fruiting';
      return 'harvest';
    }
  }
  
  // Enhanced seasonal logic with more realistic growth cycles
  if (c.includes('rice')) {
    if (season === 'spring') return 'flooded';
    if (season === 'summer') return 'vegetative';
    if (season === 'fall') return 'harvest';
    return climate === ClimateType.COLD ? 'dormant' : 'plowing';
  }

  // Winter wheat varieties (plant in fall, harvest in summer)
  if (c.includes('winter wheat') || (c.includes('wheat') && climate === ClimateType.COLD)) {
    if (season === 'fall') return 'seedling';
    if (season === 'winter') return 'dormant'; // Overwinters
    if (season === 'spring') return 'vegetative';
    return 'harvest'; // Summer harvest
  }

  // Spring grains
  if (['wheat', 'barley', 'rye', 'oat'].some(k => c.includes(k))) {
    if (season === 'spring') return 'seedling';
    if (season === 'summer') return 'ripening';
    if (season === 'fall') return 'harvest';
    return 'plowing';
  }

  if (['vineyard', 'grape'].some(k => c.includes(k))) {
    if (season === 'spring') return 'blossom';
    if (season === 'summer') return 'vegetative';
    if (season === 'fall') return 'fruiting';
    return 'dormant'; // Vines visible but dormant
  }

  if (['olive'].some(k => c.includes(k))) {
    if (season === 'spring') return 'blossom';
    if (season === 'summer') return 'vegetative';
    if (season === 'fall') return 'harvest';
    return 'dormant'; // Evergreen but dormant
  }

  if (['apple', 'orchard', 'pear', 'cherry', 'peach'].some(k => c.includes(k))) {
    if (season === 'spring') return 'blossom';
    if (season === 'summer') return 'fruiting';
    if (season === 'fall') return c.includes('apple') ? 'harvest' : 'dormant';
    return 'dormant';
  }

  if (['cotton'].some(k => c.includes(k))) {
    if (season === 'spring') return 'seedling';
    if (season === 'summer') return 'blossom';
    if (season === 'fall') return 'fruiting';
    return 'fallow';
  }

  if (['corn', 'maize'].some(k => c.includes(k))) {
    if (season === 'spring') return 'plowing';
    if (season === 'summer') return 'vegetative';
    if (season === 'fall') return 'harvest';
    return 'fallow';
  }

  if (['sugar', 'cane'].some(k => c.includes(k))) {
    // Sugar cane has a long growing season
    if (climate === ClimateType.TROPICAL) return 'vegetative';
    if (season === 'spring') return 'seedling';
    if (season === 'summer') return 'vegetative';
    if (season === 'fall') return 'harvest';
    return 'dormant';
  }

  // Root vegetables
  if (['potato', 'carrot', 'turnip', 'beet'].some(k => c.includes(k))) {
    if (season === 'spring') return 'plowing';
    if (season === 'summer') return 'vegetative';
    if (season === 'fall') return 'harvest';
    return 'fallow';
  }

  return season === 'winter' ? 'dormant' : season === 'spring' ? 'seedling' : 'vegetative';
};

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

type BehaviorType = 'walking_rows' | 'tending_tree' | 'resting' | 'carrying' | 'inspecting';
type MovementPath = 'horizontal' | 'vertical' | 'circular' | 'none';

interface FarmCharacter {
  id: string;
  x: number;  // Static base position (no longer changes)
  y: number;  // Static base position (no longer changes)
  type: 'farmer' | 'worker' | 'animal';
  direction: 1 | -1;
  speed: number;
  idleAnimation?: 'none' | 'stretching' | 'tool_use' | 'wiping_brow';
  idlePhase?: number;
  gender?: 'Male' | 'Female';
  age?: number;
  role?: 'Farmer' | 'Laborer' | 'Child' | 'Elder';
  // Child-specific play behavior
  playMode?: 'running' | 'playing' | 'chasing' | 'none';
  playTarget?: { x: number; y: number; radius: number };
  playPhase?: number;

  // NEW: CSS-based animation behavior
  behavior?: BehaviorType;
  animationDuration?: number;  // seconds (8-20s for variety)
  animationDelay?: number;     // seconds (stagger starts)
  movementPath?: MovementPath;
  movementDistance?: number;   // pixels to move
  pauseInterval?: number;      // seconds between pauses (0 = no pauses)
  pauseDuration?: number;      // seconds of pause
}
interface Particle { id: string; x: number; y: number; vx: number; vy: number; kind: 'snow' | 'rain' | 'leaf' | 'dust' | 'firefly' | 'splash'; life?: number; }

const FarmBanner: React.FC<FarmBannerProps> = ({
  era,
  culturalZone,
  condition,
  cropType,
  climate,
  season,
  seed = 12345,
  width = 1280,
  height = 200,
  timeOfDay = 'Midday',
  farmName,
  farmerName,
  currentBiome = BiomeType.GRASSLAND,
  surroundingBiomes = [],
  livestock,
  householdMembers,
  onCharacterClick
}) => {
  /* Hover tooltip state */
  const [hoveredCharacter, setHoveredCharacter] = useState<string | null>(null);
  /* Derived settings */
  const rng = useMemo(() => new RNG(seed), [seed]);
  const T = TIME_PAL[(timeOfDay as keyof typeof TIME_PAL) in TIME_PAL ? timeOfDay as keyof typeof TIME_PAL : 'Midday'];
  const S = getSeasonPalette(season, climate);
  const variant = useMemo(() => variantFrom(era, culturalZone), [era, culturalZone]);
  const stage = useMemo(() => growthFor(cropType, season, climate), [cropType, season, climate]);

  /* Season-Climate Matrix - Single source of truth for all seasonal logic */
  const seasonalState = useMemo(() => {
    // Season flags
    const isSpring = season === 'spring';
    const isSummer = season === 'summer';
    const isAutumn = season === 'fall';
    const isWinter = season === 'winter';

    // Climate flags
    const isTropical = climate === ClimateType.TROPICAL || climate === ClimateType.SEMITROPICAL;
    const isArid = climate === ClimateType.ARID;
    const isMediterranean = climate === ClimateType.MEDITERRANEAN;
    const isCold = climate === ClimateType.COLD;
    const isTemperate = climate === ClimateType.TEMPERATE;

    // Combined climate-season states
    const isColdWinter = isWinter && isCold;
    const isMildWinter = isWinter && (isMediterranean || isTemperate);
    const isTropicalWet = isTropical && isSummer;
    const isHotSummer = isSummer && (isArid || isMediterranean);

    // Weather conditions
    const shouldSnow = isColdWinter;
    const shouldRain = (isWinter && isMediterranean) ||
                      (isSpring && !isArid && !isTropical) ||
                      (isTropicalWet && rng.next() < 0.3);
    const shouldHaveDust = isArid && (isSummer || isAutumn);
    const shouldHaveFireflies = isSummer && timeOfDay === 'Dusk' && !isArid && !isCold;
    const shouldShowPuddles = shouldRain && !isArid;

    // Visual effects
    const shouldHideLaundry = timeOfDay === 'Night' || shouldRain;
    const shouldShowMist = timeOfDay === 'Dawn' || timeOfDay === 'Night';
    const shouldShowHeatShimmer = timeOfDay === 'Midday' && !isCold;

    // Seasonal particles
    const shouldShowPollen = isSpring;
    const shouldShowFallingLeaves = isAutumn;

    return {
      // Season flags
      isSpring,
      isSummer,
      isAutumn,
      isWinter,

      // Climate flags
      isTropical,
      isArid,
      isMediterranean,
      isCold,
      isTemperate,

      // Combined states
      isColdWinter,
      isMildWinter,
      isTropicalWet,
      isHotSummer,

      // Weather
      shouldSnow,
      shouldRain,
      shouldHaveDust,
      shouldHaveFireflies,
      shouldShowPuddles,

      // Visual effects
      shouldHideLaundry,
      shouldShowMist,
      shouldShowHeatShimmer,
      shouldShowPollen,
      shouldShowFallingLeaves,
    };
  }, [season, climate, timeOfDay, rng]);

  const HORIZON_Y = Math.round(height * 0.46);
  const GROUND_Y  = Math.round(height * 0.62);

  /* Animation clock (for parallax/wind/weather only) */
  const [tick, setTick] = useState(0);
  const rafRef = useRef<number | null>(null);
  useEffect(() => {
    let last = 0;
    const loop = (t: number) => { if (!last) last = t; if (t - last > 50) { setTick(v => (v + 1) % 1_000_000); last = t; } rafRef.current = requestAnimationFrame(loop); };
    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  /* Separate slower clock for stars and gentle animations */
  const slowTick = Math.floor(tick / 4);

  /* Sun vector for shadows (soft, pixelated) */
  const sunAngle = useMemo(() => {
    switch (timeOfDay) {
      case 'Dawn': return Math.PI * 0.12;
      case 'Dusk': return Math.PI * 0.88;
      case 'Night': return Math.PI * 0.7;
      case 'Day': return Math.PI * 0.35;
      default: return Math.PI * 0.3; // Midday
    }
  }, [timeOfDay]);
  const shadowOffset = { x: Math.cos(sunAngle) * 3, y: Math.sin(sunAngle) * 2 };

  /* ----------------------- Characters (ground-clamped) --------------------- */
  // Helper: Determine how many workers should be in fields based on time/season
  const getFieldWorkerCount = (time: string, season: Season): number => {
    // Night: 0 workers
    if (time === 'Night') return 0;
    // Dawn/Dusk: 1 worker
    if (time === 'Dawn' || time === 'Dusk') return 1;
    // Winter: 1 worker max
    if (season === 'winter') return 1;
    // All other times: 2 workers max
    return 2;
  };

  // Helper: Select context-aware behavior for a character
  const selectBehavior = (params: {
    cropType: string;
    timeOfDay: string;
    season: Season;
    role: string;
    rng: RNG;
  }): {
    behavior: BehaviorType;
    animationDuration: number;
    animationDelay: number;
    movementPath: MovementPath;
    movementDistance: number;
    pauseInterval: number;
    pauseDuration: number;
  } => {
    const { cropType, timeOfDay, season, role, rng } = params;

    // Base speed multipliers
    let speedMult = 1.0;
    if (timeOfDay === 'Dawn' || timeOfDay === 'Dusk') speedMult = 0.7;
    if (season === 'winter') speedMult *= 0.6;
    if (role === 'Elder') speedMult *= 0.7;

    // Determine behavior by crop type
    let behavior: BehaviorType;
    let movementPath: MovementPath;
    let movementDistance: number;
    let pauseInterval: number;

    const cropLower = cropType.toLowerCase();
    const isOrchard = ['apple', 'orange', 'olive', 'cherry', 'plum', 'peach', 'pear'].some(c => cropLower.includes(c));
    const isVineyard = cropLower.includes('grape') || cropLower.includes('vine');
    const isRowCrop = ['wheat', 'rice', 'corn', 'barley', 'oat', 'rye', 'millet', 'sorghum'].some(c => cropLower.includes(c));
    const isGarden = ['vegetable', 'carrot', 'turnip', 'cabbage', 'lettuce', 'onion'].some(c => cropLower.includes(c));

    if (isOrchard) {
      behavior = 'tending_tree';
      movementPath = 'circular';
      movementDistance = 15 + rng.range(5, 10);
      pauseInterval = 3 + rng.range(0, 3); // Pause every 3-6 seconds
    } else if (isVineyard) {
      behavior = 'inspecting';
      movementPath = 'horizontal';
      movementDistance = 40 + rng.range(10, 20);
      pauseInterval = 5 + rng.range(0, 4); // Longer pauses for inspection
    } else if (isRowCrop) {
      behavior = 'walking_rows';
      movementPath = 'horizontal';
      movementDistance = 50 + rng.range(10, 30);
      pauseInterval = 4 + rng.range(0, 2);
    } else if (isGarden) {
      behavior = 'tending_tree';
      movementPath = 'circular';
      movementDistance = 12 + rng.range(3, 8);
      pauseInterval = 2 + rng.range(0, 2);
    } else {
      // Default fallback
      behavior = 'walking_rows';
      movementPath = 'horizontal';
      movementDistance = 35 + rng.range(10, 20);
      pauseInterval = 3 + rng.range(0, 3);
    }

    // Harvest season: add carrying behavior for some workers
    if (season === 'fall' && rng.next() > 0.6) {
      behavior = 'carrying';
      pauseInterval = pauseInterval * 1.5; // Carrying = slower with longer pauses
    }

    // Winter: mostly resting
    if (season === 'winter' && rng.next() > 0.5) {
      behavior = 'resting';
      movementPath = 'none';
      movementDistance = 0;
      pauseInterval = 0; // Continuous resting animation
    }

    return {
      behavior,
      animationDuration: (8 + rng.range(0, 12)) / speedMult,
      animationDelay: rng.range(0, 8),
      movementPath,
      movementDistance: movementDistance * speedMult,
      pauseInterval,
      pauseDuration: 1.5 + rng.range(0, 2),
    };
  };

  // Calculate base character positions using useMemo (no setState!)
  const baseCharacters = useMemo(() => {
    const rr = new RNG(seed + 33);
    const ground = GROUND_Y + 10;
    const idleAnimations: ('none' | 'stretching' | 'tool_use' | 'wiping_brow')[] = ['none', 'stretching', 'tool_use', 'wiping_brow'];
    const randomIdle = () => idleAnimations[Math.floor(rr.next() * idleAnimations.length)];

    const arr: FarmCharacter[] = [];

    // Determine how many workers should be in the fields
    const maxFieldWorkers = getFieldWorkerCount(timeOfDay, season);

    // If householdMembers data is provided, intelligently select who should be working
    if (householdMembers && householdMembers.length > 0) {
      // Prioritize adults for field work - ONLY show adults, no children
      const adults = householdMembers.filter(m => m.role === 'Farmer' || m.role === 'Laborer');

      // Select workers based on max count (max 2)
      const peopleToShow = adults.slice(0, maxFieldWorkers);

      peopleToShow.forEach((member, index) => {
        // Determine character type based on role
        const charType: 'farmer' | 'worker' =
          member.role === 'Farmer' || member.role === 'Elder' ? 'farmer' : 'worker';

        // Position characters across the scene with better spacing
        const baseX = width * 0.25 + (index * 120);
        const xOffset = rr.range(-30, 30);

        // Children use same behavior system as adults, just at different scale
        const isChild = member.role === 'Child';

        // Get context-aware behavior data for ALL household members (adults and children)
        const behaviorData = selectBehavior({
          cropType,
          timeOfDay,
          season,
          role: member.role,
          rng: rr,
        });

        arr.push({
          id: member.id,
          x: baseX + xOffset,  // STATIC position
          y: ground,            // STATIC position
          type: charType,
          direction: rr.next() > 0.5 ? 1 : -1,
          speed: member.role === 'Child' ? 0.4 : member.role === 'Elder' ? 0.15 : 0.2,
          idleAnimation: isChild ? 'none' : randomIdle(),
          idlePhase: rr.range(0, Math.PI * 2),
          gender: member.gender,
          age: member.age,
          role: member.role,
          // Apply behavior data to ALL characters (no playMode)
          ...behaviorData,
        });
      });
    } else {
      // Fallback to old hardcoded system if no household data
      const farmerBehavior = selectBehavior({
        cropType,
        timeOfDay,
        season,
        role: 'Farmer',
        rng: rr,
      });

      arr.push({
        id: 'farmer',
        x: width * 0.28,
        y: ground,
        type: 'farmer',
        direction: 1,
        speed: 0.22,
        idleAnimation: randomIdle(),
        idlePhase: rr.range(0, Math.PI * 2),
        ...farmerBehavior,
      });

      if (condition === 'prosperous') {
        const worker1Behavior = selectBehavior({
          cropType,
          timeOfDay,
          season,
          role: 'Laborer',
          rng: rr,
        });

        arr.push({
          id: 'worker-0',
          x: rr.range(190, width - 240),
          y: ground,
          type: 'worker',
          direction: rr.next() > 0.5 ? 1 : -1,
          speed: 0.2,
          idleAnimation: randomIdle(),
          idlePhase: rr.range(0, Math.PI * 2),
          ...worker1Behavior,
        });

        const worker2Behavior = selectBehavior({
          cropType,
          timeOfDay,
          season,
          role: 'Laborer',
          rng: rr,
        });

        arr.push({
          id: 'worker-1',
          x: rr.range(220, width - 260),
          y: ground,
          type: 'worker',
          direction: rr.next() > 0.5 ? 1 : -1,
          speed: 0.22,
          idleAnimation: randomIdle(),
          idlePhase: rr.range(0, Math.PI * 2),
          ...worker2Behavior,
        });
      }
    }

    // a grazing animal near the lane (always add one for visual interest)
    arr.push({ id: 'animal-0', x: rr.range(140, width - 200), y: ground + 12, type: 'animal', direction: rr.next() > 0.5 ? 1 : -1, speed: 0.1 });
    return arr;
  }, [seed, width, GROUND_Y, condition, householdMembers, timeOfDay, season]);

  // Render characters directly without state - let CSS handle animation
  // No need for animatedCharacters state that changes every tick

  /* ----------------------------- Stable Weather --------------------------- */
  const particlesRef = useRef<Particle[]>([]);
  // Use seasonalState for all weather conditions
  const wantSnow   = seasonalState.shouldSnow;
  const wantRain   = seasonalState.shouldRain;
  const wantDust   = seasonalState.shouldHaveDust;
  const wantFirefly= seasonalState.shouldHaveFireflies;

  useEffect(() => {
    const rr = new RNG(seed + 99); const ps: Particle[] = [];
    if (wantSnow) {
      const n = Math.max(60, Math.floor(width / 18));
      for (let i = 0; i < n; i++) ps.push({ id: `s${i}`, x: rr.range(0, width), y: rr.range(0, height), vx: rr.range(-0.15, 0.15), vy: rr.range(0.25, 0.6), kind: 'snow' });
    }
    if (wantRain) {
      const n = Math.max(110, Math.floor(width / 10));
      for (let i = 0; i < n; i++) ps.push({ id: `r${i}`, x: rr.range(0, width), y: rr.range(0, height), vx: -0.9, vy: 3.3 + rr.range(0, 1.3), kind: 'rain' });
    }
    if (wantDust) {
      const n = 24;
      for (let i = 0; i < n; i++) ps.push({ id: `d${i}`, x: rr.range(0, width), y: rr.range(GROUND_Y - 6, GROUND_Y + 40), vx: rr.range(0.2, 0.6), vy: rr.range(-0.05, 0.05), kind: 'dust' });
    }
    if (wantFirefly) {
      for (let i = 0; i < 26; i++) ps.push({ id: `f${i}`, x: rr.range(60, width - 60), y: rr.range(GROUND_Y - 8, height - 10), vx: rr.range(-0.15, 0.15), vy: rr.range(-0.05, 0.05), kind: 'firefly' });
    }
    particlesRef.current = ps;
  }, [seed, width, height, wantSnow, wantRain, wantDust, wantFirefly, GROUND_Y]);

  useEffect(() => {
    const ps = particlesRef.current;
    const newSplashes: Particle[] = [];

    for (let i = 0; i < ps.length; i++) {
      const p = ps[i];

      // Update splash particles - fade out over time
      if (p.kind === 'splash') {
        if (p.life !== undefined) {
          p.life -= 1;
          if (p.life <= 0) {
            ps.splice(i, 1);
            i--;
            continue;
          }
        }
      }

      p.x += p.vx; p.y += p.vy;

      if (p.kind === 'snow' || p.kind === 'rain') {
        // Check if rain/snow hit the ground
        if (p.y > GROUND_Y + 10) {
          // Create splash effect for rain
          if (p.kind === 'rain' && rng.next() > 0.7) {
            newSplashes.push({
              id: `splash-${tick}-${i}`,
              x: p.x,
              y: GROUND_Y + 10,
              vx: rng.range(-0.5, 0.5),
              vy: rng.range(-1, -0.3),
              kind: 'splash',
              life: 8
            });
          }
          // Reset particle to top
          p.x = (p.x + width) % width;
          p.y = rng.range(0, 20);
        }
        if (p.x < -40 || p.x > width + 40) {
          p.x = (p.x + width) % width;
          p.y = rng.range(0, 20);
        }
      } else if (p.kind === 'dust') {
        if (p.x > width + 10) { p.x = -10; p.y = rng.range(GROUND_Y - 6, GROUND_Y + 40); }
      } else if (p.kind === 'firefly') {
        if (p.x < 0) p.x = width - 1; if (p.x > width) p.x = 1;
        if (p.y < GROUND_Y - 10) p.vy = Math.abs(p.vy);
        if (p.y > height - 10) p.vy = -Math.abs(p.vy);
      }
    }

    // Add new splash particles
    if (newSplashes.length > 0) {
      particlesRef.current.push(...newSplashes);
    }
  }, [tick, width, height, GROUND_Y, rng]);

  /* ------------------------------- Backdrops ------------------------------ */

  // Analyze surrounding biomes to determine background type
  const backgroundType = useMemo(() => {
    const biomeCount: Partial<Record<BiomeType, number>> = {};
    surroundingBiomes.forEach(b => {
      biomeCount[b] = (biomeCount[b] || 0) + 1;
    });
    
    // Determine dominant surrounding environment
    if ((biomeCount[BiomeType.FOREST] || 0) + (biomeCount[BiomeType.DENSE_FOREST] || 0) + (biomeCount[BiomeType.JUNGLE] || 0) >= 3) {
      return 'forest';
    }
    if ((biomeCount[BiomeType.MOUNTAIN] || 0) + (biomeCount[BiomeType.HIGH_PEAK] || 0) + (biomeCount[BiomeType.CLIFF] || 0) >= 2) {
      return 'mountains';
    }
    if ((biomeCount[BiomeType.HILLS] || 0) >= 3) {
      return 'hills';
    }
    if ((biomeCount[BiomeType.SNOW] || 0) + (biomeCount[BiomeType.TUNDRA] || 0) >= 2) {
      return 'snow';
    }
    if ((biomeCount[BiomeType.DESERT] || 0) + (biomeCount[BiomeType.SALT_FLATS] || 0) >= 2) {
      return 'desert';
    }
    if ((biomeCount[BiomeType.FARMLAND] || 0) >= 3) {
      return 'farmland';
    }
    if ((biomeCount[BiomeType.STEPPE] || 0) >= 2) {
      return 'steppe';
    }
    if ((biomeCount[BiomeType.WETLANDS] || 0) + (biomeCount[BiomeType.MANGROVE] || 0) >= 2) {
      return 'wetlands';
    }
    // Default to hills if mixed terrain
    return 'hills';
  }, [surroundingBiomes]);

  const clouds = useMemo(() => {
    const rr = new RNG(seed + 9);
    return Array.from({ length: 4 }, () => ({ x: rr.range(-80, width - 80), y: rr.range(10, 24), w: rr.int(36, 60) }));
  }, [seed, width]);

  // Generate background features based on surrounding terrain
  const backgroundFeatures = useMemo(() => {
    const rr = new RNG(seed + 5);
    
    if (backgroundType === 'forest') {
      // Dense treeline for forest backgrounds
      const count = Math.floor(width / 18);
      return Array.from({ length: count }, (_, i) => ({
        type: 'tree',
        x: 8 + i * 18 + rr.int(-4, 4),
        h: rr.int(14, 24),
        w: rr.int(8, 12),
        lean: rr.int(-2, 2),
        variant: rr.int(0, 2)
      }));
    }
    
    if (backgroundType === 'mountains') {
      // Mountain peaks with varied heights
      return Array.from({ length: 5 }, (_, i) => ({
        type: 'mountain',
        x: width * (0.1 + i * 0.2) + rr.range(-30, 30),
        h: rr.int(60, 90),
        w: rr.int(120, 180),
        jaggedness: rr.range(0.3, 0.7)
      }));
    }
    
    if (backgroundType === 'desert') {
      // Sand dunes
      return Array.from({ length: 6 }, (_, i) => ({
        type: 'dune',
        x: width * (i * 0.18) + rr.range(-20, 20),
        h: rr.int(20, 35),
        w: rr.int(80, 120)
      }));
    }
    
    if (backgroundType === 'snow') {
      // Snow-covered pines
      const count = Math.floor(width / 35);
      return Array.from({ length: count }, (_, i) => ({
        type: 'pine',
        x: 15 + i * 35 + rr.int(-5, 5),
        h: rr.int(16, 26),
        w: rr.int(10, 14)
      }));
    }
    
    if (backgroundType === 'farmland') {
      // Other farm buildings and silos in distance
      return Array.from({ length: 3 }, (_, i) => ({
        type: 'farm_building',
        x: width * (0.25 + i * 0.3) + rr.range(-40, 40),
        h: rr.int(18, 24),
        w: rr.int(30, 45)
      }));
    }
    
    if (backgroundType === 'steppe') {
      // Sparse, windswept trees
      const count = Math.floor(width / 60);
      return Array.from({ length: count }, (_, i) => ({
        type: 'sparse_tree',
        x: 30 + i * 60 + rr.int(-10, 10),
        h: rr.int(8, 14),
        w: rr.int(5, 8),
        lean: rr.int(-3, 3)
      }));
    }
    
    // Default hills with noise
    return Array.from({ length: 4 }, (_, i) => ({
      type: 'hill',
      x: width * (0.15 + i * 0.25) + rr.range(-40, 40),
      h: rr.int(30, 55),
      w: rr.int(140, 200),
      curve: rr.range(0.4, 0.8)
    }));
  }, [seed, width, backgroundType]);

  /* ------------------------------ Clearing zones -------------------------- */

  type Rect = { x: number; y: number; w: number; h: number };
  const farmsteadRect = useMemo<Rect>(() => {
    const cx = Math.round(width * 0.18);
    const by = GROUND_Y - 18;
    return { x: cx - 78, y: by - 28, w: 160, h: 76 };
  }, [width, GROUND_Y]);

  const millRect = useMemo<Rect>(() => {
    const cx = Math.round(width * 0.48);
    const by = GROUND_Y - 26;
    return { x: cx - 24, y: by - 34, w: 48, h: 70 };
  }, [width, GROUND_Y]);

  const pathRect = useMemo<Rect>(() => ({ x: farmsteadRect.x + farmsteadRect.w, y: GROUND_Y - 6, w: width, h: 14 }), [farmsteadRect, width, GROUND_Y]);

  const inNoPlantZone = (x: number, y: number) => {
    const inside = (r: Rect) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
    return inside(farmsteadRect) || inside(millRect) || inside(pathRect);
  };

  /* ---------------------------- Crop geometry ----------------------------- */

  type Plant = { x: number; y: number; s?: number };

  const furrowRows = useMemo(() => {
    const rr = new RNG(seed + 203);
    const rows: Plant[][] = [];
    const rowCount = 6;
    const baseY = GROUND_Y - 8;
    for (let r = 0; r < rowCount; r++) {
      const y = baseY + r * 10;
      const density = Math.round(18 + r * 4);
      const row: Plant[] = [];
      for (let i = 0; i < density; i++) {
        const x = Math.round(((i + 0.5) / density) * (width - 120)) + 60 + Math.round(rr.range(-2, 2));
        if (!inNoPlantZone(x, y)) row.push({ x, y });
      }
      rows.push(row);
    }
    return rows;
  }, [seed, width, GROUND_Y]); // stable; no inNoPlantZone in deps to avoid identity churn

  const orchardGrid = useMemo(() => {
    const rr = new RNG(seed + 401);
    const cols = Math.floor((width - 200) / 68);
    const rows = 3;
    const startX = 90, spacingX = 68;
    const startY = GROUND_Y - 8, spacingY = 18;
    const nodes: Plant[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = startX + c * spacingX + rr.int(-2, 2);
        const y = startY + r * spacingY + rr.int(-1, 1);
        if (!inNoPlantZone(x, y)) nodes.push({ x, y, s: rr.int(0, 2) });
      }
    }
    return nodes;
  }, [seed, width, GROUND_Y]);

  const trellisPosts = useMemo(() => {
    const rr = new RNG(seed + 501);
    const rows = 4;
    const left = 100, right = width - 80;
    const startY = GROUND_Y - 6;
    const spacing = 12;
    const posts: Plant[] = [];
    for (let r = 0; r < rows; r++) {
      const y = startY + r * spacing;
      for (let x = left; x < right; x += rr.int(56, 62)) {
        if (!inNoPlantZone(x, y)) posts.push({ x, y });
      }
    }
    return { posts, left, right, rows, startY, spacing };
  }, [seed, width, GROUND_Y]);

  const paddyCells = useMemo(() => {
    const rr = new RNG(seed + 701);
    const cols = Math.floor((width - 160) / 90);
    const rows = 2;
    const startX = 80, spacingX = 90;
    const startY = GROUND_Y - 6, spacingY = 24;
    const cells: Rect[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = startX + c * spacingX + rr.int(-2, 2);
        const y = startY + r * spacingY + rr.int(-1, 1);
        const rect = { x, y, w: 78, h: 18 };
        if (!inNoPlantZone(x + rect.w / 2, y + rect.h / 2)) cells.push(rect);
      }
    }
    return cells;
  }, [seed, width, GROUND_Y]);

  /* ------------------------------ SVG Defs -------------------------------- */

  const Defs = (
    <defs>
      <linearGradient id={`sky-${seed}`} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor={T.skyTop} />
        <stop offset="58%" stopColor={T.skyMid} />
        <stop offset="100%" stopColor={T.skyBot} />
      </linearGradient>

      {/* Subtle vignette - stronger for arid (dust), lighter for tropical (humid) */}
      <radialGradient id={`vig-${seed}`} cx="50%" cy="50%" r="65%">
        <stop offset="70%" stopColor="#0000" />
        <stop offset="100%" stopColor={climate === ClimateType.ARID ? mix(T.vignette, '#d4a574', 0.2) : 
                                       climate === ClimateType.TROPICAL ? mix(T.vignette, '#000', -0.3) :
                                       T.vignette} />
      </radialGradient>

      {/* Dither patterns (dark/light) for pixel texture */}
      <pattern id={`dither-dark-${seed}`} patternUnits="userSpaceOnUse" width="2" height="2">
        <rect width="1" height="1" x="0" y="0" fill="#000" opacity="0.06" />
      </pattern>
      <pattern id={`dither-light-${seed}`} patternUnits="userSpaceOnUse" width="2" height="2">
        <rect width="1" height="1" x="1" y="1" fill="#fff" opacity="0.06" />
      </pattern>

      <filter id={`blur-${seed}`} x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="1.3" />
      </filter>
    </defs>
  );

  /* ------------------------------ Sky & Biome ------------------------------ */

  const Sky = (
    <g>
      <rect x={0} y={0} width={width} height={HORIZON_Y} fill={`url(#sky-${seed})`} />
      {timeOfDay === 'Night' ? (
        <g>
          {Array.from({ length: 25 }).map((_, i) => {
            // Fixed star positions using seed-based RNG for consistency
            const starRng = new RNG(seed + i * 17);
            const baseX = starRng.int(20, width - 20);
            const baseY = starRng.int(8, HORIZON_Y - 12);

            // Varied twinkling behaviors - some stars twinkle more fitfully
            const twinkleSpeed = 0.015 + (i % 4) * 0.005;
            const twinklePhase = i * 0.8 + (i % 3) * Math.PI * 0.5;
            const twinkleIntensity = i % 5 === 0 ? 0.3 : 0.15; // Some twinkle more
            const twinkle = Math.sin(slowTick * twinkleSpeed + twinklePhase) * twinkleIntensity + 0.85;

            // Subtle color variations
            const starColor = i % 9 === 0 ? '#fff8e7' : // subtle amber
                            i % 11 === 0 ? '#e8f0ff' : // subtle blue-white
                            i % 13 === 0 ? '#ffebe8' : // subtle red-white
                            '#ffffff'; // pure white

            // Varying star sizes for depth
            const size = i % 6 === 0 ? 2 : 1;

            return (
              <rect key={i} x={baseX} y={baseY} width={size} height={size}
                fill={starColor}
                opacity={twinkle} />
            );
          })}
          <rect x={width - 36} y={12} width={8} height={8} fill={T.sun} />
        </g>
      ) : (
        <g filter={`url(#blur-${seed})`}>
          <rect x={width - 42} y={14} width={12} height={12} fill={T.sun} />
        </g>
      )}
      {/* Parallax clouds */}
      {timeOfDay !== 'Night' &&
        clouds.map((c, i) => {
          const cx = ((c.x + tick * (0.35 + i * 0.05)) % (width + 160)) - 80;
          return (
            <g key={i} opacity={0.96}>
              <rect x={cx} y={c.y} width={c.w} height={14} rx={3} fill="#ffffff" />
              <rect x={cx + 10} y={c.y - 3} width={Math.floor(c.w * 0.7)} height={12} rx={3} fill="#ffffff" />
              <rect x={cx + 20} y={c.y + 2} width={Math.floor(c.w * 0.6)} height={10} rx={3} fill="#ffffff" />
            </g>
          );
        })}
    </g>
  );

  const BiomeDressing = (
    <g>
      {/* Render background features based on surrounding terrain */}
      {backgroundFeatures.map((feature, i) => {
        if (feature.type === 'hill') {
          // Randomized hill shapes with noise
          const hillColor = climate === ClimateType.ARID ? shade(S.ground, -15 - (i % 2) * 10) :
                           climate === ClimateType.TROPICAL ? shade(S.tree, -18 - (i % 2) * 8) :
                           shade(S.ground, -20 - (i % 2) * 12);
          const points = [];
          const steps = 20;
          for (let j = 0; j <= steps; j++) {
            const t = j / steps;
            const x = feature.x - feature.w/2 + t * feature.w;
            const heightMod = Math.sin(t * Math.PI) * feature.curve + (Math.sin(t * Math.PI * 3 + i) * 0.15);
            const y = HORIZON_Y - feature.h * Math.max(0, heightMod);
            points.push(`${x},${y}`);
          }
          points.push(`${feature.x + feature.w/2},${HORIZON_Y}`);
          points.push(`${feature.x - feature.w/2},${HORIZON_Y}`);
          return (
            <polygon key={`hill-${i}`} points={points.join(' ')} 
              fill={hillColor} opacity={0.35 - i * 0.05} />
          );
        }
        
        if (feature.type === 'mountain') {
          // Jagged mountain peaks
          const mtColor = seasonalState.isWinter || seasonalState.isCold ? '#e0e4ef' : '#6b5d5d';
          const points = [];
          const peaks = 5 + Math.floor(feature.jaggedness * 5);
          const peakRng = new RNG(seed + i * 100); // Stable randomness per mountain
          for (let j = 0; j <= peaks; j++) {
            const t = j / peaks;
            const x = feature.x - feature.w/2 + t * feature.w;
            const peakHeight = feature.h * (0.6 + peakRng.next() * 0.4 * feature.jaggedness);
            const y = HORIZON_Y - (j % 2 === 0 ? peakHeight : peakHeight * 0.7);
            points.push(`${x},${y}`);
          }
          points.push(`${feature.x + feature.w/2},${HORIZON_Y}`);
          points.push(`${feature.x - feature.w/2},${HORIZON_Y}`);
          return (
            <polygon key={`mountain-${i}`} points={points.join(' ')} 
              fill={mtColor} opacity={0.4} />
          );
        }
        
        if (feature.type === 'tree') {
          // Dense forest background with wind sway
          const trunk = climate === ClimateType.TROPICAL ? shade(S.tree, -8) : shade(S.tree, -12);
          const foliage = climate === ClimateType.TROPICAL ? shade(S.tree, 10) : S.tree;

          // Wind sway effect - coordinated wave motion
          const windSway = Math.sin((slowTick * 0.08) + (feature.x * 0.02)) * (wantRain ? 3 : wantSnow ? 1.5 : 1);
          const topLean = windSway * 1.5; // Top sways more

          return (
            <g key={`tree-${i}`} opacity={0.85}>
              {/* Trunk stays stable */}
              <rect x={feature.x} y={HORIZON_Y - feature.h} width={3} height={feature.h} fill={trunk} />
              {/* Foliage sways with wind */}
              <ellipse cx={feature.x + 1.5 + topLean} cy={HORIZON_Y - feature.h} rx={feature.w/2} ry={feature.h/3} fill={foliage} />
              {feature.variant === 1 && (
                <ellipse cx={feature.x + 1.5 + topLean * 0.7} cy={HORIZON_Y - feature.h + 5} rx={feature.w/2 - 1} ry={feature.h/4} fill={shade(foliage, -8)} />
              )}
            </g>
          );
        }
        
        if (feature.type === 'pine') {
          // Snow-covered pines
          const pineColor = seasonalState.isWinter ? '#4a5d4a' : '#2f4a2f';
          const snowColor = '#ffffff';
          return (
            <g key={`pine-${i}`} opacity={0.9}>
              <polygon points={`${feature.x},${HORIZON_Y - feature.h} ${feature.x - feature.w/2},${HORIZON_Y} ${feature.x + feature.w/2},${HORIZON_Y}`}
                fill={pineColor} />
              {seasonalState.isWinter && (
                <polygon points={`${feature.x},${HORIZON_Y - feature.h} ${feature.x - feature.w/3},${HORIZON_Y - feature.h/2} ${feature.x + feature.w/3},${HORIZON_Y - feature.h/2}`}
                  fill={snowColor} opacity={0.8} />
              )}
            </g>
          );
        }
        
        if (feature.type === 'dune') {
          // Sand dunes
          const duneColor = shade('#d4a574', -10 + (i % 2) * 15);
          const curve = `Q ${feature.x},${HORIZON_Y - feature.h} ${feature.x + feature.w/2},${HORIZON_Y}`;
          return (
            <path key={`dune-${i}`} 
              d={`M ${feature.x - feature.w/2} ${HORIZON_Y} ${curve} L ${feature.x - feature.w/2} ${HORIZON_Y}`}
              fill={duneColor} opacity={0.4} />
          );
        }
        
        if (feature.type === 'farm_building') {
          // Distant farm structures
          return (
            <g key={`farm-${i}`} opacity={0.3}>
              <rect x={feature.x} y={HORIZON_Y - feature.h} width={feature.w} height={feature.h} fill={shade(S.ground, -25)} />
              <polygon points={`${feature.x - 4},${HORIZON_Y - feature.h} ${feature.x + feature.w/2},${HORIZON_Y - feature.h - 8} ${feature.x + feature.w + 4},${HORIZON_Y - feature.h}`} 
                fill={shade('#8b4513', -15)} />
              {/* Silo */}
              {i === 1 && (
                <rect x={feature.x + feature.w + 5} y={HORIZON_Y - feature.h - 10} width={6} height={feature.h + 10} fill="#8a909b" />
              )}
            </g>
          );
        }
        
        if (feature.type === 'sparse_tree') {
          // Windswept steppe trees
          const trunk = shade(S.path, -8);
          return (
            <g key={`sparse-${i}`} opacity={0.7} transform={`translate(${feature.x}, 0) skewX(${feature.lean * 2})`}>
              <rect x={0} y={HORIZON_Y - feature.h} width={2} height={feature.h} fill={trunk} />
              <ellipse cx={1} cy={HORIZON_Y - feature.h} rx={feature.w/2} ry={3} fill={shade(S.grass, -20)} />
            </g>
          );
        }
        
        return null;
      })}
      
      {/* Enhanced atmospheric layers with distance-based fog */}
      <defs>
        <linearGradient id={`distFog-${seed}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={T.skyBot} stopOpacity="0" />
          <stop offset="60%" stopColor={mix(T.skyBot, '#ffffff', 0.3)} stopOpacity="0.4" />
          <stop offset="100%" stopColor={mix(T.skyBot, '#ffffff', 0.5)} stopOpacity="0.6" />
        </linearGradient>
      </defs>

      {/* Multiple fog layers for depth */}
      <rect x={0} y={HORIZON_Y - 20} width={width} height={25}
        fill={`url(#distFog-${seed})`}
        opacity={timeOfDay === 'Dawn' || timeOfDay === 'Dusk' ? 0.7 : 0.4} />

      {/* Ground-level mist */}
      {(timeOfDay === 'Dawn' || timeOfDay === 'Night') && (
        <g>
          <rect x={0} y={HORIZON_Y} width={width} height={15}
            fill="#ffffff"
            opacity={0.2 + Math.sin(slowTick * 0.02) * 0.05} />
          {/* Drifting fog wisps */}
          {[0, 1, 2].map(i => (
            <ellipse key={i}
              cx={(i * 350 + slowTick * 1.5) % (width + 200) - 100}
              cy={HORIZON_Y + 5}
              rx={120 + Math.sin(slowTick * 0.03 + i) * 20}
              ry={8}
              fill="#ffffff"
              opacity={0.1} />
          ))}
        </g>
      )}

      {/* Heat shimmer for midday */}
      {timeOfDay === 'Midday' && climate !== ClimateType.COLD && (
        <g opacity={0.15}>
          {[0, 1, 2].map(i => (
            <rect key={i} x={0} y={HORIZON_Y - 10 + i * 3 + Math.sin(tick * 0.08 + i) * 2}
              width={width} height={2} fill={T.skyBot}
              opacity={0.4 - i * 0.1} />
          ))}
        </g>
      )}
    </g>
  );

  const Ground = (
    <g>
      {/* Ground with subtle vertical gradient + dither */}
      <rect x={0} y={HORIZON_Y} width={width} height={height - HORIZON_Y} fill={S.ground} />
      <rect x={0} y={HORIZON_Y} width={width} height={height - HORIZON_Y} fill={`url(#dither-dark-${seed})`} />

      {/* Wind-blown grass tufts */}
      <g opacity={0.4}>
        {Array.from({ length: 30 }).map((_, i) => {
          const grassRng = new RNG(seed + 777 + i);
          const gx = grassRng.range(20, width - 20);
          const gy = GROUND_Y + grassRng.range(0, 40);
          const windLean = Math.sin((slowTick * 0.1) + (gx * 0.03)) * (wantRain ? 2 : 1);

          return (
            <g key={`grass-${i}`}>
              {/* Grass blade leaning with wind */}
              <line
                x1={gx}
                y1={gy}
                x2={gx + windLean}
                y2={gy - grassRng.range(2, 4)}
                stroke={shade(S.grass, -15)}
                strokeWidth={0.5}
              />
            </g>
          );
        })}
      </g>

      {/* Lane to right */}
      <rect x={pathRect.x - 8} y={GROUND_Y + 4} width={width - (pathRect.x - 8)} height={6} fill={S.path} opacity={0.6} />
      <g opacity={0.45}>
        {Array.from({ length: Math.floor((width - (pathRect.x - 8)) / 36) }).map((_, i) => (
          <rect key={i} x={pathRect.x - 2 + i * 36} y={GROUND_Y + 3} width={22} height={2} fill={shade(S.path, -10)} />
        ))}
      </g>
      {/* Furrow shading bands (wide, under crop rows) */}
      {Array.from({ length: 6 }).map((_, r) => (
        <rect key={r} x={40} y={GROUND_Y - 5 + r * 10} width={width - 80} height={2} fill={shade(S.path, -10)} opacity={0.25} />
      ))}
    </g>
  );

  /* ----------------------------- Garden Plots ----------------------------- */

  const gardenPlots = useMemo(() => {
    const cx = Math.round(width * 0.18);
    const by = GROUND_Y - 4;
    return {
      x: cx - 90,
      y: by,
      width: 30,
      height: 20
    };
  }, [width, GROUND_Y]);

  const GardenPlot = (
    <g transform={`translate(${gardenPlots.x}, ${gardenPlots.y})`}>
      {/* Garden bed border */}
      <rect x={0} y={0} width={30} height={20} fill={shade(S.ground, -10)} />
      <rect x={1} y={1} width={28} height={18} fill={S.ground} />

      {/* Vegetable rows */}
      {/* Cabbages */}
      {[0, 1, 2].map(i => (
        <g key={`cabbage-${i}`}>
          <circle cx={5 + i * 8} cy={6} r={2} fill={PLANT_COLORS.green_spring} />
          <circle cx={5 + i * 8} cy={6} r={1} fill={PLANT_COLORS.green_medium} />
        </g>
      ))}

      {/* Tomatoes on stakes */}
      {[0, 1].map(i => (
        <g key={`tomato-${i}`}>
          <rect x={7 + i * 10} y={10} width={1} height={6} fill={MATERIAL_COLORS.wood_beam} />
          <circle cx={7 + i * 10} cy={12} r={1} fill="#FF6347" />
          <circle cx={8 + i * 10} cy={14} r={1} fill={ANIMAL_COLORS.chicken_beak} />
        </g>
      ))}

      {/* Herbs */}
      {[0, 1, 2, 3].map(i => (
        <rect key={`herb-${i}`} x={20 + i * 2} y={8 + (i % 2) * 4} width={1} height={2} fill={PLANT_COLORS.green_deep} />
      ))}

      {/* Scarecrow */}
      <g transform={`translate(15, -8)`}>
        <rect x={0} y={0} width={1} height={8} fill={MATERIAL_COLORS.wood_beam} />
        <rect x={-2} y={2} width={5} height={1} fill={MATERIAL_COLORS.wood_beam} />
        <rect x={-1} y={0} width={3} height={2} fill={PLANT_COLORS.barley_tan} />
        <rect x={0} y={-1} width={1} height={1} fill={MATERIAL_COLORS.dirt_light} />
      </g>
    </g>
  );

  /* ---------------------------- Laundry Line ------------------------------- */

  const LaundryLine = useMemo(() => {
    // Hide laundry at night or during rain (based on season/climate)
    if (seasonalState.shouldHideLaundry) return null;

    const cx = Math.round(width * 0.18);
    const lineY = GROUND_Y - 35;
    const sway = Math.sin(slowTick * 0.03) * 2;

    return (
      <g>
        {/* Line */}
        <rect x={cx + 70} y={lineY} width={60} height={1} fill={MATERIAL_COLORS.dirt_light} />

        {/* Clothes */}
        <g transform={`translate(${cx + 80}, ${lineY})`}>
          {/* Shirt */}
          <rect x={0 + sway * 0.5} y={1} width={8} height={10} fill={MATERIAL_COLORS.fabric_blue} />
          <rect x={2 + sway * 0.5} y={1} width={4} height={2} fill={MATERIAL_COLORS.fabric_blue_dark} />
        </g>

        <g transform={`translate(${cx + 95}, ${lineY})`}>
          {/* Pants */}
          <rect x={0 + sway * 0.7} y={1} width={3} height={12} fill={MATERIAL_COLORS.fabric_navy} />
          <rect x={3 + sway * 0.7} y={1} width={3} height={12} fill={MATERIAL_COLORS.fabric_navy} />
        </g>

        <g transform={`translate(${cx + 110}, ${lineY})`}>
          {/* Dress */}
          <rect x={0 + sway} y={1} width={6} height={8} fill={MATERIAL_COLORS.fabric_pink} />
          <polygon points={`${0 + sway},${9} ${3 + sway},${13} ${6 + sway},${9}`} fill={MATERIAL_COLORS.fabric_pink} />
        </g>
      </g>
    );
  }, [width, GROUND_Y, seasonalState, slowTick]);

  /* ------------------------------ Farmstead ------------------------------- */

  const Farmstead = (() => {
    const cx = Math.round(width * 0.18);
    const by = GROUND_Y - 18;

    // Enhanced shadow system with contact shadows and ambient occlusion
    const shadow = (x: number, y: number, w: number, h: number, intensity = 0.12) => (
      <g>
        <rect x={x + shadowOffset.x} y={y + shadowOffset.y} width={w} height={h} fill="#000" opacity={intensity} />
        {/* Contact shadow at base */}
        <rect x={x - 2} y={y + h - 1} width={w + 4} height={2} fill="#000" opacity={intensity * 1.5} />
      </g>
    );

    // Highlight helper for architectural depth
    const highlight = (x: number, y: number, w: number, h: number) => (
      <rect x={x} y={y} width={w} height={h} fill="#fff" opacity={0.1} />
    );

    // Chimney smoke renderer - animated, season/time-aware
    const renderSmoke = (chimneyX: number, chimneyY: number) => {
      // More smoke in cold weather, at dawn/dusk/night
      const { isWinter, isCold } = seasonalState;
      const isColdTime = timeOfDay === 'Dawn' || timeOfDay === 'Dusk' || timeOfDay === 'Night';
      const shouldHaveSmoke = isWinter || isCold || isColdTime;

      if (!shouldHaveSmoke) return null;

      // More smoke puffs in winter
      const puffCount = isWinter ? 5 : 3;
      const baseOpacity = isWinter ? 0.4 : 0.25;

      return (
        <g opacity={0.9}>
          {Array.from({ length: puffCount }).map((_, i) => {
            const rise = i * 8;
            const drift = Math.sin((slowTick * 0.05) + i) * (4 + i * 2);
            const size = 3 + i * 1.5;
            const opacity = baseOpacity * (1 - i * 0.15);
            const wobble = Math.sin((slowTick * 0.08) + i * 0.5) * 1.5;

            return (
              <ellipse
                key={i}
                cx={chimneyX + drift + wobble}
                cy={chimneyY - rise}
                rx={size}
                ry={size * 0.8}
                fill="#e8e8e8"
                opacity={opacity}
              />
            );
          })}
        </g>
      );
    };

    // Window glow for night time - warm candlelight
    const renderWindowGlow = (x: number, y: number, w: number, h: number) => {
      const isNight = timeOfDay === 'Night' || timeOfDay === 'Dusk';
      if (!isNight) return null;

      const flicker = 0.85 + Math.sin(slowTick * 0.15) * 0.1 + Math.sin(slowTick * 0.23) * 0.05;

      return (
        <g>
          {/* Warm glow from inside */}
          <rect x={x + 2} y={y + 2} width={w - 4} height={h - 4} fill="#ffb347" opacity={0.6 * flicker} />
          {/* Brighter center */}
          <rect x={x + w/3} y={y + h/3} width={w/3} height={h/3} fill="#ffd700" opacity={0.4 * flicker} />
          {/* Glow spill outside */}
          <rect x={x - 1} y={y - 1} width={w + 2} height={h + 2} fill="#ffb347" opacity={0.15 * flicker} />
        </g>
      );
    };

    // Door details - handle, knocker, weathering
    const renderDoorDetails = (doorX: number, doorY: number, doorW: number, doorH: number, style: 'medieval' | 'modern' | 'asian' | 'mena') => {
      switch (style) {
        case 'medieval':
          return (
            <g>
              {/* Iron hinges */}
              <rect x={doorX + 2} y={doorY + 4} width={4} height={1} fill="#3d3d3d" />
              <rect x={doorX + 2} y={doorY + doorH - 6} width={4} height={1} fill="#3d3d3d" />
              {/* Door handle */}
              <circle cx={doorX + doorW - 4} cy={doorY + doorH/2} r={1.5} fill="#b8860b" />
              {/* Wood grain */}
              <rect x={doorX + doorW/3} y={doorY + 2} width={1} height={doorH - 4} fill="#1a0f08" opacity={0.3} />
              <rect x={doorX + 2*doorW/3} y={doorY + 2} width={1} height={doorH - 4} fill="#1a0f08" opacity={0.3} />
            </g>
          );
        case 'modern':
          return (
            <g>
              {/* Modern door knob */}
              <circle cx={doorX + doorW - 3} cy={doorY + doorH/2} r={2} fill="#c0c0c0" />
              <circle cx={doorX + doorW - 3} cy={doorY + doorH/2} r={1} fill="#888" />
              {/* Door panels */}
              <rect x={doorX + 3} y={doorY + 3} width={doorW - 6} height={doorH/2 - 4} fill="#000" opacity={0.1} />
              <rect x={doorX + 3} y={doorY + doorH/2 + 1} width={doorW - 6} height={doorH/2 - 4} fill="#000" opacity={0.1} />
            </g>
          );
        default:
          return null;
      }
    };

    // Seasonal decorations
    const renderSeasonalDecor = (x: number, y: number, variant: string) => {
      const { isAutumn, isWinter, isSpring } = seasonalState;

      if (isAutumn && (variant === 'medieval_euro' || variant === 'frontier')) {
        // Harvest wreath on door
        return (
          <g>
            <circle cx={x} cy={y} r={4} fill={PLANT_COLORS.autumn_rust} opacity={0.8} />
            <circle cx={x} cy={y} r={3} fill={PLANT_COLORS.wheat_gold} opacity={0.6} />
            <rect x={x - 1} y={y + 4} width={2} height={3} fill="#8B4513" /> {/* Ribbon */}
          </g>
        );
      }

      if (isWinter && variant === 'nordic') {
        // Icicles on roof edge
        return (
          <g>
            <polygon points={`${x},${y} ${x - 1},${y + 4} ${x + 1},${y + 4}`} fill="#d4f1f9" opacity={0.8} />
            <polygon points={`${x + 6},${y} ${x + 5},${y + 5} ${x + 7},${y + 5}`} fill="#d4f1f9" opacity={0.8} />
            <polygon points={`${x + 12},${y} ${x + 11},${y + 3} ${x + 13},${y + 3}`} fill="#d4f1f9" opacity={0.8} />
          </g>
        );
      }

      if (isSpring && variant === 'east_asian') {
        // Cherry blossom branch
        return (
          <g>
            {[0, 6, 12].map((offset, i) => (
              <circle key={i} cx={x + offset} cy={y - i} r={1.5} fill="#FFB7C5" opacity={0.8} />
            ))}
          </g>
        );
      }

      return null;
    };

    switch (variant) {
      case 'medieval_euro':
        return (
          <g>
            {shadow(cx - 50, by, 100, 40)}
            {/* Main structure with timber frame */}
            <rect x={cx - 50} y={by} width={100} height={40} fill={MATERIAL_COLORS.wood_weathered} />
            {highlight(cx - 50, by, 100, 2)} {/* Top edge highlight */}

            {/* Thatched roof with layered texture */}
            <polygon points={`${cx - 58},${by} ${cx},${by - 26} ${cx + 58},${by}`} fill={MATERIAL_COLORS.thatch_light} />
            <polygon points={`${cx - 54},${by - 2} ${cx},${by - 22} ${cx + 54},${by - 2}`} fill={MATERIAL_COLORS.thatch_dark} opacity={0.6} />
            {/* Roof ridge beam */}
            <rect x={cx - 2} y={by - 26} width={4} height={2} fill={MATERIAL_COLORS.wood_dark} />
            {/* Roof thatch texture lines */}
            <rect x={cx - 48} y={by - 18} width={96} height={1} fill={MATERIAL_COLORS.thatch_dark} opacity={0.3} />
            <rect x={cx - 44} y={by - 14} width={88} height={1} fill={MATERIAL_COLORS.thatch_dark} opacity={0.3} />
            <rect x={cx - 40} y={by - 10} width={80} height={1} fill={MATERIAL_COLORS.thatch_dark} opacity={0.3} />

            {/* Timber frame details */}
            <rect x={cx - 50} y={by + 12} width={100} height={2} fill={MATERIAL_COLORS.wood_dark} />
            <rect x={cx - 1} y={by} width={2} height={40} fill={MATERIAL_COLORS.wood_dark} />
            <rect x={cx - 25} y={by} width={2} height={40} fill={MATERIAL_COLORS.wood_dark} />
            <rect x={cx + 23} y={by} width={2} height={40} fill={MATERIAL_COLORS.wood_dark} />
            {/* Diagonal timber braces */}
            <line x1={cx - 25} y1={by + 14} x2={cx - 13} y2={by + 24} stroke={MATERIAL_COLORS.wood_dark} strokeWidth="1.5" />
            <line x1={cx + 23} y1={by + 14} x2={cx + 13} y2={by + 24} stroke={MATERIAL_COLORS.wood_dark} strokeWidth="1.5" />

            {/* Door with depth and details */}
            <rect x={cx - 10} y={by + 18} width={20} height={20} fill={MATERIAL_COLORS.dirt_dark} />
            <rect x={cx - 8} y={by + 20} width={16} height={16} fill={MATERIAL_COLORS.dirt_medium} /> {/* Inner door */}
            <rect x={cx - 1} y={by + 28} width={2} height={8} fill="#1a0f08" /> {/* Door crack */}
            {renderDoorDetails(cx - 8, by + 20, 16, 16, 'medieval')}
            {/* Harvest wreath in autumn */}
            {renderSeasonalDecor(cx, by + 25, 'medieval_euro')}

            {/* Windows with shutters and glass effect */}
            <rect x={cx - 34} y={by + 8} width={12} height={8} fill="#4a5c6b" />
            <rect x={cx - 32} y={by + 10} width={8} height={4} fill="#6ea7d6" opacity={0.8} />
            {renderWindowGlow(cx - 32, by + 10, 8, 4)}
            <rect x={cx - 34} y={by + 8} width={2} height={8} fill={MATERIAL_COLORS.wood_dark} /> {/* Shutter */}
            {/* Window panes */}
            <rect x={cx - 32} y={by + 10} width={8} height={1} fill="#4a5c6b" opacity={0.5} />
            <rect x={cx - 28} y={by + 10} width={1} height={4} fill="#4a5c6b" opacity={0.5} />

            <rect x={cx + 22} y={by + 8} width={12} height={8} fill="#4a5c6b" />
            <rect x={cx + 24} y={by + 10} width={8} height={4} fill="#6ea7d6" opacity={0.8} />
            {renderWindowGlow(cx + 24, by + 10, 8, 4)}
            <rect x={cx + 32} y={by + 8} width={2} height={8} fill={MATERIAL_COLORS.wood_dark} /> {/* Shutter */}
            {/* Window panes */}
            <rect x={cx + 24} y={by + 10} width={8} height={1} fill="#4a5c6b" opacity={0.5} />
            <rect x={cx + 28} y={by + 10} width={1} height={4} fill="#4a5c6b" opacity={0.5} />

            {/* Detailed hayricks with texture */}
            <rect x={cx + 78} y={by + 16} width={10} height={8} fill={MATERIAL_COLORS.thatch_straw} />
            <rect x={cx + 78} y={by + 14} width={10} height={2} fill="#d4b57a" /> {/* Top layer */}
            <rect x={cx + 92} y={by + 18} width={10} height={8} fill={MATERIAL_COLORS.thatch_straw} />
            <rect x={cx + 92} y={by + 16} width={10} height={2} fill="#d4b57a" /> {/* Top layer */}

            {/* Chimney with detailed brickwork */}
            <rect x={cx + 35} y={by - 20} width={6} height={12} fill="#7a5e4a" />
            <rect x={cx + 35} y={by - 22} width={6} height={2} fill={MATERIAL_COLORS.wood_dark} />
            {/* Brick texture */}
            <rect x={cx + 35} y={by - 18} width={6} height={1} fill="#5d3a2a" opacity={0.4} />
            <rect x={cx + 35} y={by - 14} width={6} height={1} fill="#5d3a2a" opacity={0.4} />
            <rect x={cx + 35} y={by - 10} width={6} height={1} fill="#5d3a2a" opacity={0.4} />
            {/* Chimney smoke */}
            {renderSmoke(cx + 38, by - 22)}
          </g>
        );
      case 'industrial_euro':
      case 'frontier':
        return (
          <g>
            {shadow(cx - 56, by + 2, 112, 34)}
            {/* Main house with planks */}
            <rect x={cx - 56} y={by + 2} width={112} height={34} fill={MATERIAL_COLORS.wood_light} />
            <rect x={cx - 56} y={by} width={112} height={2} fill="#6e5f4a" />
            {/* Wood plank lines */}
            {Array.from({ length: 8 }).map((_, i) => (
              <rect key={i} x={cx - 56} y={by + 2 + i * 4} width={112} height={1} fill="#5d4a35" opacity={0.2} />
            ))}

            {/* Door with modern details */}
            <rect x={cx - 10} y={by + 16} width={20} height={20} fill={MATERIAL_COLORS.dirt_dark} />
            <rect x={cx - 8} y={by + 18} width={16} height={16} fill={MATERIAL_COLORS.dirt_medium} />
            {renderDoorDetails(cx - 8, by + 18, 16, 16, 'modern')}

            {/* Windows with glass reflection */}
            <rect x={cx - 40} y={by + 10} width={10} height={8} fill="#3a4a5a" />
            <rect x={cx - 38} y={by + 12} width={6} height={4} fill="#7ea7d6" opacity={0.7} />
            {renderWindowGlow(cx - 38, by + 12, 6, 4)}

            <rect x={cx + 30} y={by + 10} width={10} height={8} fill="#3a4a5a" />
            <rect x={cx + 32} y={by + 12} width={6} height={4} fill="#7ea7d6" opacity={0.7} />
            {renderWindowGlow(cx + 32, by + 12, 6, 4)}

            {/* Silo with metal bands */}
            <rect x={cx + 80} y={by - 12} width={18} height={48} fill={MATERIAL_COLORS.metal_steel} />
            <rect x={cx + 80} y={by - 14} width={18} height={2} fill={MATERIAL_COLORS.metal_dark} />
            {/* Metal bands */}
            <rect x={cx + 79} y={by} width={20} height={1.5} fill={MATERIAL_COLORS.metal_dark} opacity={0.6} />
            <rect x={cx + 79} y={by + 12} width={20} height={1.5} fill={MATERIAL_COLORS.metal_dark} opacity={0.6} />
            <rect x={cx + 79} y={by + 24} width={20} height={1.5} fill={MATERIAL_COLORS.metal_dark} opacity={0.6} />

            {/* Porch awning with support posts */}
            <rect x={cx - 24} y={by + 12} width={48} height={4} fill="#705940" />
            <rect x={cx - 22} y={by + 16} width={2} height={20} fill="#5d4a35" />
            <rect x={cx + 20} y={by + 16} width={2} height={20} fill="#5d4a35" />

            {/* Chimney */}
            <rect x={cx - 30} y={by - 8} width={6} height={10} fill="#7a5e4a" />
            {renderSmoke(cx - 27, by - 8)}
          </g>
        );
      case 'mena':
        return (
          <g>
            {shadow(cx - 46, by + 8, 92, 26)}
            {/* Adobe/mud brick structure with texture */}
            <rect x={cx - 46} y={by + 8} width={92} height={26} fill={MATERIAL_COLORS.adobe} />
            <rect x={cx - 46} y={by + 6} width={92} height={2} fill={MATERIAL_COLORS.adobe_shadow} />
            {highlight(cx - 46, by + 8, 92, 2)} {/* Top edge highlight */}

            {/* Texture details on walls */}
            <rect x={cx - 30} y={by + 14} width={4} height={4} fill={MATERIAL_COLORS.adobe_detail} opacity={0.5} />
            <rect x={cx + 10} y={by + 20} width={4} height={4} fill={MATERIAL_COLORS.adobe_detail} opacity={0.5} />
            <rect x={cx + 28} y={by + 16} width={4} height={4} fill={MATERIAL_COLORS.adobe_detail} opacity={0.5} />

            {/* Arched doorway */}
            <rect x={cx - 12} y={by + 12} width={24} height={18} fill="#a0826d" />
            <path d={`M ${cx - 12} ${by + 12} Q ${cx} ${by + 8} ${cx + 12} ${by + 12}`} fill="#a0826d" />
            <rect x={cx - 10} y={by + 14} width={20} height={16} fill={MATERIAL_COLORS.dirt_medium} /> {/* Inner doorway */}
            <rect x={cx - 12} y={by + 12} width={24} height={2} fill="#8b6a55" />

            {/* Decorative window with mashrabiya pattern */}
            <rect x={cx - 36} y={by + 12} width={8} height={6} fill="#8b6a55" />
            {renderWindowGlow(cx - 36, by + 12, 8, 6)}
            <rect x={cx - 35} y={by + 13} width={2} height={4} fill="#d6c4b0" opacity={0.6} />
            <rect x={cx - 32} y={by + 13} width={2} height={4} fill="#d6c4b0" opacity={0.6} />
            <rect x={cx - 29} y={by + 13} width={2} height={4} fill="#d6c4b0" opacity={0.6} />

            <rect x={cx + 28} y={by + 12} width={8} height={6} fill="#8b6a55" />
            {renderWindowGlow(cx + 28, by + 12, 8, 6)}
            <rect x={cx + 29} y={by + 13} width={2} height={4} fill="#d6c4b0" opacity={0.6} />
            <rect x={cx + 32} y={by + 13} width={2} height={4} fill="#d6c4b0" opacity={0.6} />
            <rect x={cx + 35} y={by + 13} width={2} height={4} fill="#d6c4b0" opacity={0.6} />

            {/* Water cistern with ripples */}
            <ellipse cx={cx + 86} cy={by + 28} rx={12} ry={6} fill={S.water} />
            <ellipse cx={cx + 86} cy={by + 28} rx={8} ry={4} fill={S.water} opacity={0.6} />
            <rect x={cx + 74} y={by + 24} width={24} height={2} fill="#8b6a55" /> {/* Cistern edge */}

            {/* Date palm with fronds (if not cold) */}
            {climate !== ClimateType.COLD && (
              <g>
                <rect x={cx + 60} y={by - 4} width={3} height={20} fill="#7a5a2a" />
                {/* Palm fronds */}
                <path d={`M ${cx + 61} ${by - 6} Q ${cx + 54} ${by - 10} ${cx + 50} ${by - 4}`} fill={shade(S.grass, 10)} />
                <path d={`M ${cx + 62} ${by - 6} Q ${cx + 68} ${by - 10} ${cx + 72} ${by - 4}`} fill={shade(S.grass, 10)} />
                <path d={`M ${cx + 61} ${by - 8} Q ${cx + 58} ${by - 12} ${cx + 54} ${by - 6}`} fill={shade(S.grass, 15)} />
                <path d={`M ${cx + 62} ${by - 8} Q ${cx + 65} ${by - 12} ${cx + 68} ${by - 6}`} fill={shade(S.grass, 15)} />
              </g>
            )}

            {/* Small architectural details */}
            <rect x={cx - 46} y={by + 6} width={4} height={2} fill="#8b6a55" /> {/* Beam end */}
            <rect x={cx + 42} y={by + 6} width={4} height={2} fill="#8b6a55" /> {/* Beam end */}
          </g>
        );
      case 'east_asian':
        return (
          <g>
            {shadow(cx - 44, by + 6, 88, 28)}
            {/* Traditional wooden structure */}
            <rect x={cx - 44} y={by + 6} width={88} height={28} fill="#7b4f2a" />
            {highlight(cx - 44, by + 6, 88, 2)} {/* Top edge highlight */}

            {/* Curved tile roof with layers */}
            <path d={`M ${cx - 52} ${by + 6} Q ${cx} ${by - 12} ${cx + 52} ${by + 6}`} fill="#bf3a3a" />
            <path d={`M ${cx - 48} ${by + 4} Q ${cx} ${by - 10} ${cx + 48} ${by + 4}`} fill="#a83232" opacity={0.6} />
            {/* Roof ridge decoration */}
            <rect x={cx - 2} y={by - 12} width={4} height={2} fill="#7a2020" />
            <circle cx={cx - 4} cy={by - 11} r={2} fill="#7a2020" />
            <circle cx={cx + 4} cy={by - 11} r={2} fill="#7a2020" />

            {/* Wooden posts and beams */}
            <rect x={cx - 44} y={by + 6} width={2} height={28} fill="#5b3a1c" />
            <rect x={cx + 42} y={by + 6} width={2} height={28} fill="#5b3a1c" />
            <rect x={cx - 16} y={by + 6} width={2} height={28} fill="#5b3a1c" />
            <rect x={cx + 14} y={by + 6} width={2} height={28} fill="#5b3a1c" />

            {/* Sliding door with grid pattern */}
            <rect x={cx - 8} y={by + 16} width={16} height={16} fill="#2c1b12" />
            <rect x={cx - 6} y={by + 18} width={12} height={12} fill="#f4e6d9" opacity={0.8} />
            {/* Door grid */}
            <rect x={cx - 6} y={by + 22} width={12} height={1} fill="#2c1b12" />
            <rect x={cx - 6} y={by + 26} width={12} height={1} fill="#2c1b12" />
            <rect x={cx - 2} y={by + 18} width={1} height={12} fill="#2c1b12" />
            <rect x={cx + 2} y={by + 18} width={1} height={12} fill="#2c1b12" />

            {/* Paper windows with night glow */}
            <rect x={cx - 36} y={by + 12} width={10} height={8} fill="#3d2618" />
            <rect x={cx - 34} y={by + 14} width={6} height={4} fill="#f4e6d9" opacity={0.7} />
            {renderWindowGlow(cx - 34, by + 14, 6, 4)}
            <rect x={cx - 31} y={by + 12} width={1} height={8} fill="#2c1b12" />

            <rect x={cx + 26} y={by + 12} width={10} height={8} fill="#3d2618" />
            <rect x={cx + 28} y={by + 14} width={6} height={4} fill="#f4e6d9" opacity={0.7} />
            {renderWindowGlow(cx + 28, by + 14, 6, 4)}
            <rect x={cx + 31} y={by + 12} width={1} height={8} fill="#2c1b12" />

            {/* Spring cherry blossoms */}
            {renderSeasonalDecor(cx - 40, by + 4, 'east_asian')}

            {/* Detailed drying racks with items */}
            <rect x={cx + 66} y={by + 14} width={24} height={2} fill="#6a3e1c" />
            <rect x={cx + 66} y={by + 18} width={24} height={2} fill="#6a3e1c" />
            <rect x={cx + 66} y={by + 14} width={2} height={8} fill="#5b3a1c" /> {/* Support */}
            <rect x={cx + 88} y={by + 14} width={2} height={8} fill="#5b3a1c" /> {/* Support */}
            {/* Drying items */}
            <rect x={cx + 70} y={by + 12} width={3} height={4} fill="#d4b57a" opacity={0.8} />
            <rect x={cx + 76} y={by + 12} width={3} height={4} fill="#c4a05c" opacity={0.8} />
            <rect x={cx + 82} y={by + 12} width={3} height={4} fill="#d4b57a" opacity={0.8} />

            {/* Foundation stones */}
            <rect x={cx - 44} y={by + 32} width={12} height={2} fill="#8a8a8a" />
            <rect x={cx - 6} y={by + 32} width={12} height={2} fill="#8a8a8a" />
            <rect x={cx + 32} y={by + 32} width={12} height={2} fill="#8a8a8a" />
          </g>
        );
      case 'nordic':
      case 'steppe':
        return (
          <g>
            {shadow(cx - 52, by + 4, 104, 30)}
            {/* Log cabin walls */}
            <rect x={cx - 52} y={by + 4} width={104} height={30} fill="#6f4426" />
            {/* Log texture - horizontal lines */}
            {Array.from({ length: 7 }).map((_, i) => (
              <rect key={i} x={cx - 52} y={by + 4 + i * 4} width={104} height={1.5} fill="#5a371c" opacity={0.5} />
            ))}
            {/* Steep roof */}
            <polygon points={`${cx - 58},${by + 4} ${cx},${by - 10} ${cx + 58},${by + 4}`} fill="#5a371c" />
            {/* Winter icicles */}
            {renderSeasonalDecor(cx - 50, by + 4, 'nordic')}

            {/* Small window */}
            <rect x={cx - 30} y={by + 12} width={8} height={6} fill="#3a2618" />
            <rect x={cx - 28} y={by + 14} width={4} height={2} fill="#6ea7d6" opacity={0.6} />
            {renderWindowGlow(cx - 28, by + 14, 4, 2)}

            {/* Door */}
            <rect x={cx - 8} y={by + 16} width={16} height={16} fill="#4a2f1a" />
            <rect x={cx - 6} y={by + 18} width={12} height={12} fill="#5d3b24" />
            {/* Door cross-bracing */}
            <line x1={cx - 6} y1={by + 18} x2={cx + 6} y2={by + 30} stroke="#4a2f1a" strokeWidth="1.5" />
            <line x1={cx + 6} y1={by + 18} x2={cx - 6} y2={by + 30} stroke="#4a2f1a" strokeWidth="1.5" />

            {/* Drying rails with items */}
            <rect x={cx + 74} y={by + 10} width={18} height={2} fill="#7b4f2a" />
            <rect x={cx + 74} y={by + 14} width={18} height={2} fill="#7b4f2a" />
            <rect x={cx + 76} y={by + 8} width={3} height={4} fill="#c4a05c" opacity={0.7} />
            <rect x={cx + 82} y={by + 8} width={3} height={4} fill="#b89060" opacity={0.7} />

            {/* Chimney */}
            <rect x={cx + 20} y={by - 6} width={6} height={10} fill="#6a4a2a" />
            {renderSmoke(cx + 23, by - 6)}
          </g>
        );
      default: // modern
        return (
          <g>
            {shadow(cx - 64, by + 4, 128, 26)}
            <rect x={cx - 64} y={by + 4} width={128} height={26} fill="#b7bcc4" />
            <rect x={cx - 64} y={by + 2} width={128} height={2} fill="#8a909b" />
            <rect x={cx - 10} y={by + 14} width={20} height={16} fill="#2c1b12" />
          </g>
        );
    }
  })();

  /* --------------------------- Footpath Patterns -------------------------- */

  const FootpathPatterns = (
    <g opacity={0.5}>
      {/* Main path from farmhouse to fields */}
      <rect x={farmsteadRect.x + farmsteadRect.w} y={GROUND_Y - 2}
        width={200} height={4} fill={shade(S.ground, -15)} />

      {/* Worn area near farmhouse door */}
      <ellipse cx={farmsteadRect.x + 50} cy={GROUND_Y - 1}
        rx={15} ry={3} fill={shade(S.ground, -20)} />

      {/* Path to well/mill */}
      <rect x={farmsteadRect.x + farmsteadRect.w} y={GROUND_Y - 1}
        width={Math.round(width * 0.48) - (farmsteadRect.x + farmsteadRect.w)}
        height={2} fill={shade(S.ground, -12)} />

      {/* Scattered wear patches */}
      {[0, 1, 2].map(i => (
        <ellipse key={i}
          cx={farmsteadRect.x + farmsteadRect.w + 50 + i * 60}
          cy={GROUND_Y - 1}
          rx={8 - i} ry={2}
          fill={shade(S.ground, -10)} />
      ))}
    </g>
  );

  const MillOrWell = (
    <g transform={`translate(${Math.round(width * 0.48)}, ${GROUND_Y - 26})`}>
      {(climate === ClimateType.TEMPERATE || climate === ClimateType.COLD) ? (
        <g>
          <rect x={-4 + shadowOffset.x} y={shadowOffset.y} width={8} height={40} fill="#000" opacity={0.12} />
          <rect x={-4} y={0} width={8} height={40} fill="#8b7356" />
          <g transform={`rotate(${(tick * 2) % 360} 0 0)`}>
            <rect x={-1} y={-24} width={2} height={48} fill="#654321" />
            <rect x={-24} y={-1} width={48} height={2} fill="#654321" />
          </g>
        </g>
      ) : (
        <g>
          {/* Well base with shadow */}
          <ellipse cx={0 + shadowOffset.x} cy={32 + shadowOffset.y} rx={14} ry={7} fill="#000" opacity={0.12} />
          <ellipse cx={0} cy={32} rx={14} ry={7} fill="#696969" />

          {/* Water inside well with ripples */}
          <ellipse cx={0} cy={30} rx={11} ry={5} fill={S.water} />
          <ellipse cx={0} cy={30} rx={7 + Math.sin(slowTick * 0.1) * 2} ry={3 + Math.sin(slowTick * 0.1)}
            fill={S.water} opacity={0.5} />

          {/* Support posts */}
          <rect x={-2} y={0} width={4} height={32} fill="#8b4513" />
          <rect x={-10} y={-4} width={20} height={6} fill="#654321" />

          {/* Animated bucket */}
          <g transform={`translate(0, ${10 + Math.sin(slowTick * 0.05) * 5})`}>
            <rect x={-3} y={0} width={6} height={5} fill="#7b4f2a" />
            <rect x={-4} y={0} width={1} height={-10} fill="#8B7355" /> {/* Rope */}
            <rect x={3} y={0} width={1} height={-10} fill="#8B7355" /> {/* Rope */}
          </g>

          {/* Water trough */}
          <rect x={16} y={28} width={12} height={6} fill="#7b4f2a" />
          <rect x={17} y={29} width={10} height={4} fill={S.water} opacity={0.8} />

          {/* Puddle under well */}
          <ellipse cx={0} cy={34} rx={6} ry={2} fill={S.water} opacity={0.3} />
        </g>
      )}
    </g>
  );

  /* --------------------------- Crop Renderers ----------------------------- */

  // Unified crop configuration system
  type CropType = 'field' | 'tall_row' | 'orchard' | 'trellis' | 'cotton' | 'rice';

  interface CropConfig {
    type: CropType;
    primaryColor: string;
    accentColor: string;
    stemColor?: string;
    trunkColor?: string;
    hasCornEars?: boolean;
    hasSugarSegments?: boolean;
    fruitColor?: string;
    blossomColor?: string;
    bollColor?: string;
  }

  const CROP_CONFIGS: Record<string, CropConfig> = {
    // Grains - field type
    wheat: { type: 'field', primaryColor: PLANT_COLORS.wheat_gold, accentColor: PLANT_COLORS.wheat_ripe },
    barley: { type: 'field', primaryColor: PLANT_COLORS.barley_tan, accentColor: PLANT_COLORS.barley_light },
    rye: { type: 'field', primaryColor: PLANT_COLORS.rye_brown, accentColor: PLANT_COLORS.rye_dark },
    oat: { type: 'field', primaryColor: PLANT_COLORS.oat_cream, accentColor: PLANT_COLORS.oat_tan },
    sorghum: { type: 'field', primaryColor: PLANT_COLORS.autumn_brown, accentColor: '#A0522D' },
    millet: { type: 'field', primaryColor: PLANT_COLORS.grain_harvest, accentColor: '#FFC125' },

    // Vegetables - field type
    potato: { type: 'field', primaryColor: MATERIAL_COLORS.dirt_light, accentColor: '#CDB79E' },
    carrot: { type: 'field', primaryColor: PLANT_COLORS.green_deep, accentColor: PLANT_COLORS.orange },
    cabbage: { type: 'field', primaryColor: PLANT_COLORS.green_medium, accentColor: PLANT_COLORS.green_spring },
    flax: { type: 'field', primaryColor: '#87CEEB', accentColor: '#B0E0E6' },

    // Tall row crops
    corn: { type: 'tall_row', primaryColor: PLANT_COLORS.green_olive, accentColor: PLANT_COLORS.green_sage, hasCornEars: true },
    maize: { type: 'tall_row', primaryColor: PLANT_COLORS.green_olive, accentColor: PLANT_COLORS.green_sage, hasCornEars: true },
    sugar: { type: 'tall_row', primaryColor: '#7FBF7F', accentColor: '#5F9F5F', hasSugarSegments: true },
    cane: { type: 'tall_row', primaryColor: '#7FBF7F', accentColor: '#5F9F5F', hasSugarSegments: true },
    bean: { type: 'tall_row', primaryColor: PLANT_COLORS.green_olive, accentColor: PLANT_COLORS.green_olive },
    pea: { type: 'tall_row', primaryColor: PLANT_COLORS.green_sage, accentColor: PLANT_COLORS.green_light },
    tobacco: { type: 'tall_row', primaryColor: MATERIAL_COLORS.dirt_light, accentColor: '#705848' },
    hemp: { type: 'tall_row', primaryColor: PLANT_COLORS.green_olive, accentColor: PLANT_COLORS.green_sage },

    // Orchards
    apple: { type: 'orchard', primaryColor: shade(S.tree, 0), accentColor: shade(S.tree, -10), trunkColor: '#5d3b24', fruitColor: PLANT_COLORS.apple_red, blossomColor: '#FFB6C1' },
    orchard: { type: 'orchard', primaryColor: shade(S.tree, 0), accentColor: shade(S.tree, -10), trunkColor: '#5d3b24', fruitColor: PLANT_COLORS.apple_red, blossomColor: '#FFB6C1' },
    olive: { type: 'orchard', primaryColor: S.tree, accentColor: shade(S.tree, -10), trunkColor: '#6f4b2e', fruitColor: '#556B2F', blossomColor: null },

    // Trellis
    vineyard: { type: 'trellis', primaryColor: '#228B22', accentColor: '#4B0082', stemColor: '#8B7355', blossomColor: '#F0E68C' },
    grape: { type: 'trellis', primaryColor: '#228B22', accentColor: '#4B0082', stemColor: '#8B7355', blossomColor: '#F0E68C' },

    // Cotton
    cotton: { type: 'cotton', primaryColor: S.grass, accentColor: '#FFFFFF', bollColor: '#FFFAF0', blossomColor: '#FFB6C1' },

    // Rice
    rice: { type: 'rice', primaryColor: shade(S.grass, 6), accentColor: '#d1b24a' },
    paddy: { type: 'rice', primaryColor: shade(S.grass, 6), accentColor: '#d1b24a' },
  };

  const getCropConfig = (cropName: string): CropConfig => {
    const c = cropName.toLowerCase();
    for (const [key, config] of Object.entries(CROP_CONFIGS)) {
      if (c.includes(key)) return config;
    }
    // Default field crop
    return { type: 'field', primaryColor: shade(S.grass, 8), accentColor: shade(S.grass, -12) };
  };

  const renderGenericField = (primary: string, accent: string) => {
    // Enhanced with season-aware rendering - use seasonalState
    const { isWinter, isSpring, isSummer, isAutumn } = seasonalState;

    // Season-specific color adjustments
    const seasonalPrimary = isWinter ? shade(primary, -30) :
                           isSpring ? shade(primary, 20) :
                           isSummer ? primary :
                           shade(primary, -10); // Autumn darker

    const seasonalAccent = isWinter ? shade(accent, -25) :
                          isSpring ? shade(accent, 30) :
                          isSummer ? accent :
                          shade(accent, 10); // Autumn richer

    return (
      <g>
        {/* Enhanced furrow lines - visible row patterns */}
        {furrowRows.map((row, ri) => {
          if (row.length === 0) return null;
          const rowY = row[0].y;
          const furrowDarkness = stage === 'plowing' ? -25 : stage === 'seedling' ? -18 : -12;

          return (
            <g key={`furrow-${ri}`}>
              {/* Dark furrow line */}
              <rect
                x={60}
                y={rowY + 1}
                width={width - 120}
                height={1.5}
                fill={shade(S.ground, furrowDarkness)}
                opacity={0.6}
              />
              {/* Highlight on furrow ridge */}
              {stage !== 'plowing' && (
                <rect
                  x={60}
                  y={rowY - 1}
                  width={width - 120}
                  height={0.5}
                  fill={shade(S.ground, 8)}
                  opacity={0.3}
                />
              )}
            </g>
          );
        })}

        {furrowRows.map((row, ri) => (
          <g key={ri}>
            {row.map((p, pi) => {
              // Enhanced wind coordination - wave effect across the field
              const windPhase = (p.x * 0.03 + slowTick * 0.5 + ri * 0.3);
              const wind = (stage === 'vegetative' || stage === 'harvest' || stage === 'ripening') ?
                          Math.sin(windPhase) * (isAutumn ? 1.2 : 0.7) : 0;

              // More varied height variation using multiple factors
              const baseVariation = 0.75 + (((pi * 7 + ri * 13) % 10) / 15);
              const microVariation = 0.95 + Math.sin(pi * 2.3 + ri * 1.7) * 0.1;
              const variation = baseVariation * microVariation;

              // Season-adjusted heights with more variety
              const h = stage === 'plowing' ? 0 :
                       stage === 'seedling' ? (isSpring ? 2 : 3) * variation :
                       stage === 'vegetative' ? (isSummer ? 8 : 6) * variation :
                       stage === 'ripening' ? 9 * variation :
                       stage === 'harvest' ? 10 * variation :
                       stage === 'dormant' ? 3 * variation :
                       stage === 'fallow' ? 1 : 2 * variation;

              // Enhanced harvest state visual progression
              let colorVariation = seasonalPrimary;

              if (stage === 'ripening') {
                // Gradual transition from green to gold during ripening
                const ripenProgress = (pi % 5) / 5; // 0 to 0.8 based on position
                const greenTint = shade(seasonalPrimary, -10);
                const goldTint = shade(seasonalAccent, -15);
                colorVariation = ripenProgress > 0.6 ? goldTint :
                                ripenProgress > 0.3 ? shade(greenTint, 15) : greenTint;
              } else if (stage === 'harvest') {
                // Full golden fields with some variation
                if (isAutumn) {
                  colorVariation = pi % 2 === 0 ? '#D2691E' : pi % 3 === 0 ? '#DAA520' : seasonalAccent;
                } else {
                  colorVariation = pi % 3 === 0 ? shade(seasonalAccent, 10) : seasonalAccent;
                }
              } else {
                // Normal growth stages - subtle color variation
                colorVariation = pi % 3 === 0 ? shade(seasonalPrimary, -5) :
                                pi % 5 === 0 ? shade(seasonalPrimary, 5) : seasonalPrimary;
              }

              return (
                <g key={pi} transform={`translate(${Math.round(p.x)}, ${Math.round(p.y)})`}>
                  {/* Plowing marks */}
                  {stage === 'plowing' && (
                    <rect x={-3} y={-1} width={6} height={1} fill={shade(S.ground, -15)} />
                  )}

                  {/* Main stalk */}
                  {h > 0 && (
                    <rect x={-1 + wind} y={-h} width={2} height={h} fill={colorVariation} />
                  )}

                  {/* Spring green shoots */}
                  {stage === 'seedling' && isSpring && (
                    <>
                      <rect x={0} y={-h - 1} width={1} height={1} fill="#90EE90" />
                      <rect x={-1} y={-h} width={1} height={1} fill="#98FB98" />
                    </>
                  )}

                  {/* Summer lush growth */}
                  {stage === 'vegetative' && isSummer && pi % 2 === 0 && (
                    <>
                      <rect x={-3 + wind} y={-h/2} width={2} height={3} fill={shade(seasonalPrimary, -8)} />
                      <rect x={1 + wind} y={-h/2 - 1} width={2} height={3} fill={shade(seasonalPrimary, -8)} />
                    </>
                  )}

                  {/* Ripening grain heads - progressive development */}
                  {stage === 'ripening' && (
                    <>
                      {/* Grain head size varies by position - simulating progressive ripening */}
                      {pi % 3 === 0 ? (
                        // Early ripening - smaller heads
                        <>
                          <rect x={-1 + wind} y={-h - 1} width={2} height={1} fill={shade(seasonalAccent, -20)} />
                          <rect x={-1 + wind} y={-h - 2} width={2} height={1} fill={shade(seasonalAccent, -15)} opacity={0.8} />
                        </>
                      ) : pi % 3 === 1 ? (
                        // Mid ripening - medium heads
                        <>
                          <rect x={-2 + wind} y={-h - 1} width={4} height={2} fill={shade(seasonalAccent, -10)} />
                          <rect x={-1 + wind} y={-h - 2} width={2} height={1} fill={shade(seasonalAccent, -5)} />
                        </>
                      ) : (
                        // Late ripening - full heads (almost harvest ready)
                        <>
                          <rect x={-2 + wind} y={-h - 2} width={4} height={3} fill={seasonalAccent} />
                          <rect x={-1 + wind} y={-h - 3} width={2} height={1} fill={shade(seasonalAccent, 15)} />
                        </>
                      )}
                    </>
                  )}

                  {/* Full harvest heads */}
                  {stage === 'harvest' && (
                    <>
                      <rect x={-2 + wind} y={-h - 2} width={4} height={3} fill={seasonalAccent} />
                      <rect x={-3 + wind} y={-h - 1} width={6} height={1} fill={shade(seasonalAccent, 15)} />
                      {/* Drooping effect for heavy grain */}
                      <rect x={-1 + wind + 1} y={-h - 3} width={2} height={1} fill={shade(seasonalAccent, 20)} />
                    </>
                  )}

                  {/* Winter stubble */}
                  {stage === 'dormant' && (
                    <rect x={-1} y={-h} width={2} height={h} fill={shade('#8B7355', -20)} />
                  )}

                  {/* Fallow ground */}
                  {stage === 'fallow' && (
                    <>
                      <rect x={-1} y={-2} width={2} height={2} fill={shade(S.ground, -8)} />
                      {pi % 4 === 0 && <rect x={0} y={-1} width={1} height={1} fill={shade(S.ground, -15)} />}
                    </>
                  )}
                </g>
              );
            })}
          </g>
        ))}
      </g>
    );
  };

  const renderVineyard = () => {
    const { posts, left, right, rows, startY, spacing } = trellisPosts;
    const { isSpring, isSummer, isAutumn, isWinter } = seasonalState;

    return (
      <g>
        {/* Trellis wires */}
        {Array.from({ length: rows }).map((_, r) => {
          const y = startY + r * spacing;
          return <rect key={r} x={left} y={y - 6} width={right - left} height={1} fill="#4a3a2a" />;
        })}

        {/* Posts and vines */}
        {posts.map((p, i) => {
          // Seasonal vine colors
          const vineColor = isWinter ? '#8B7355' : // Brown dormant vines
                          isSpring ? '#90EE90' : // Light green new growth
                          isSummer ? '#228B22' : // Deep green
                          '#8B4513'; // Autumn brown/red

          return (
            <g key={i}>
              {/* Support post */}
              <rect x={p.x} y={p.y - 12} width={2} height={12} fill="#6e4c2a" />
              {/* Cross beam */}
              <rect x={p.x - 10} y={p.y - 8} width={22} height={1} fill="#5b3e24" />

              {/* Winter dormant vines - just woody structure */}
              {isWinter && stage === 'dormant' && (
                <>
                  <rect x={p.x - 8} y={p.y - 10} width={1} height={8} fill={vineColor} />
                  <rect x={p.x - 4} y={p.y - 11} width={1} height={9} fill={vineColor} />
                  <rect x={p.x + 2} y={p.y - 10} width={1} height={8} fill={vineColor} />
                  <rect x={p.x + 6} y={p.y - 11} width={1} height={9} fill={vineColor} />
                </>
              )}

              {/* Spring blossoms and new growth */}
              {isSpring && stage === 'blossom' && (
                <>
                  {/* Young vine growth */}
                  <rect x={p.x - 10} y={p.y - 12} width={22} height={4} fill={vineColor} opacity={0.8} />
                  {/* Small flower clusters */}
                  <rect x={p.x - 7} y={p.y - 10} width={1} height={1} fill="#F0E68C" />
                  <rect x={p.x - 2} y={p.y - 11} width={1} height={1} fill="#F0E68C" />
                  <rect x={p.x + 4} y={p.y - 10} width={1} height={1} fill="#F0E68C" />
                </>
              )}

              {/* Summer full foliage */}
              {isSummer && stage === 'vegetative' && (
                <>
                  <rect x={p.x - 11} y={p.y - 13} width={24} height={7} fill={vineColor} />
                  <rect x={p.x - 9} y={p.y - 9} width={20} height={3} fill={shade(vineColor, -10)} />
                  {/* Small green grapes forming */}
                  <rect x={p.x - 5} y={p.y - 7} width={1} height={2} fill="#9ACD32" />
                  <rect x={p.x + 3} y={p.y - 7} width={1} height={2} fill="#9ACD32" />
                </>
              )}

              {/* Autumn harvest grapes */}
              {isAutumn && stage === 'fruiting' && (
                <>
                  {/* Changing foliage */}
                  <rect x={p.x - 10} y={p.y - 12} width={22} height={6} fill={i % 2 === 0 ? '#8B4513' : '#CD853F'} />
                  {/* Grape clusters */}
                  <rect x={p.x - 6} y={p.y - 7} width={2} height={3} fill="#4B0082" />
                  <rect x={p.x - 5} y={p.y - 6} width={2} height={2} fill="#6B0AA3" />
                  <rect x={p.x + 3} y={p.y - 7} width={2} height={3} fill="#4B0082" />
                  <rect x={p.x + 4} y={p.y - 5} width={2} height={2} fill="#6B0AA3" />
                  {/* Some fallen leaves */}
                  {i % 3 === 0 && <rect x={p.x - 3} y={p.y - 1} width={1} height={1} fill="#D2691E" opacity={0.6} />}
                </>
              )}
            </g>
          );
        })}
      </g>
    );
  };

  // Unified orchard renderer - handles apples, olives, and other tree crops
  const renderOrchard = (config: CropConfig) => {
    const { isSpring, isSummer, isAutumn, isWinter } = seasonalState;
    const isOlive = cropType.toLowerCase().includes('olive');

    // Olives are evergreen, simplified rendering
    if (isOlive) {
      return (
        <g>
          {orchardGrid.map((n, i) => {
            const trunk = config.trunkColor || '#6f4b2e';
            const leafy = stage === 'fallow' ? shade(config.primaryColor, -24) : config.primaryColor;
            return (
              <g key={i}>
                <rect x={n.x} y={n.y - 8} width={2} height={8} fill={trunk} />
                <rect x={n.x - 6} y={n.y - 12} width={6} height={4} fill={shade(leafy, -10)} />
                <rect x={n.x - 1} y={n.y - 13} width={8} height={5} fill={leafy} />
                <rect x={n.x - 4} y={n.y - 9} width={10} height={4} fill={shade(leafy, -14)} />
              </g>
            );
          })}
        </g>
      );
    }

    // Deciduous fruit trees (apples, pears, etc.)
    return (
      <g>
        {orchardGrid.map((n, i) => {
          const trunk = config.trunkColor || '#5d3b24';
          // Seasonal leaf colors
          const leafColor = isWinter ? null : // No leaves in winter
                          isSpring ? '#90EE90' : // Light green new growth
                          isSummer ? config.primaryColor : // Full green
                          isAutumn ? (i % 3 === 0 ? '#FF8C00' : i % 2 === 0 ? '#FFD700' : '#DC143C') : // Fall colors
                          config.primaryColor;

          return (
            <g key={i}>
              {/* Trunk - always visible */}
              <rect x={n.x} y={n.y - 10} width={3} height={10} fill={trunk} />
              {/* Branches in winter */}
              {isWinter && stage === 'dormant' && (
                <>
                  <rect x={n.x - 4} y={n.y - 12} width={2} height={1} fill={shade(trunk, -10)} />
                  <rect x={n.x + 3} y={n.y - 11} width={2} height={1} fill={shade(trunk, -10)} />
                  <rect x={n.x - 2} y={n.y - 14} width={1} height={2} fill={shade(trunk, -10)} />
                </>
              )}

              {/* Spring blossoms */}
              {stage === 'blossom' && isSpring && config.blossomColor && (
                <>
                  {/* Blossom clusters */}
                  <rect x={n.x - 5} y={n.y - 14} width={2} height={2} fill={config.blossomColor} />
                  <rect x={n.x - 1} y={n.y - 15} width={3} height={2} fill={shade(config.blossomColor, 5)} />
                  <rect x={n.x + 3} y={n.y - 13} width={2} height={2} fill={config.blossomColor} />
                  <rect x={n.x - 3} y={n.y - 11} width={2} height={2} fill={shade(config.blossomColor, 5)} />
                  <rect x={n.x + 2} y={n.y - 10} width={2} height={2} fill={config.blossomColor} />
                  {/* Some early leaves */}
                  <rect x={n.x - 4} y={n.y - 12} width={3} height={2} fill="#98FB98" />
                  <rect x={n.x + 1} y={n.y - 11} width={3} height={2} fill="#98FB98" />
                </>
              )}

              {/* Summer/Fall foliage */}
              {leafColor && stage !== 'blossom' && stage !== 'dormant' && (
                <>
                  <rect x={n.x - 6} y={n.y - 15} width={14} height={6} fill={leafColor} />
                  <rect x={n.x - 7} y={n.y - 12} width={16} height={5} fill={config.accentColor} />
                  <rect x={n.x - 5} y={n.y - 9} width={12} height={3} fill={shade(config.accentColor, -5)} />
                </>
              )}

              {/* Fruits */}
              {stage === 'fruiting' && isSummer && config.fruitColor && (
                <>
                  {/* Green developing fruits */}
                  <rect x={n.x - 3} y={n.y - 10} width={2} height={2} fill="#90EE90" />
                  <rect x={n.x + 2} y={n.y - 9} width={2} height={2} fill="#90EE90" />
                </>
              )}
              {stage === 'harvest' && isAutumn && config.fruitColor && (
                <>
                  {/* Ripe fruits */}
                  <rect x={n.x - 3} y={n.y - 10} width={2} height={2} fill={config.fruitColor} />
                  <rect x={n.x + 2} y={n.y - 9} width={2} height={2} fill={shade(config.fruitColor, -10)} />
                  <rect x={n.x} y={n.y - 11} width={2} height={2} fill={config.fruitColor} />
                  <rect x={n.x - 5} y={n.y - 8} width={2} height={2} fill={shade(config.fruitColor, -10)} />
                </>
              )}

              {/* Fallen leaves in autumn */}
              {isAutumn && (
                <>
                  <rect x={n.x - 4 + (i % 3)} y={n.y - 1} width={1} height={1} fill="#D2691E" opacity={0.7} />
                  <rect x={n.x + 2 + (i % 2)} y={n.y - 1} width={1} height={1} fill="#FF8C00" opacity={0.6} />
                </>
              )}
            </g>
          );
        })}
      </g>
    );
  };

  const renderTallRowCrops = (stem = '#90EE90', tip = '#3CB371', cropName = 'corn', hasCornEars = false, hasSugarSegments = false) => {
    const isCorn = hasCornEars || cropName.toLowerCase().includes('corn') || cropName.toLowerCase().includes('maize');
    const isSugarCane = hasSugarSegments || cropName.toLowerCase().includes('sugar') || cropName.toLowerCase().includes('cane');

    return (
      <g>
        {furrowRows.map((row, ri) => (
          <g key={ri}>
            {row.map((p, pi) => {
              const sway = stage === 'vegetative' ? Math.sin((p.x + slowTick) * 0.02) * 0.6 : 0;
              const variation = 0.85 + (((pi * 11 + ri * 7) % 10) / 30);
              const h = (stage === 'seedling' ? 4 : stage === 'vegetative' ? 10 : stage === 'harvest' ? 12 : 2) * variation;

              return (
                <g key={pi} transform={`translate(${Math.round(p.x)}, ${Math.round(p.y)})`}>
                  {/* Thicker stalk for corn/sugar cane */}
                  <rect x={-1 + sway} y={-h} width={isSugarCane ? 3 : 2} height={h} fill={stem} />

                  {/* Corn specific - ears and tassels */}
                  {isCorn && stage === 'harvest' && (
                    <>
                      {/* Corn ear */}
                      <rect x={2 + sway} y={-h/2} width={3} height={4} fill="#FFD700" />
                      <rect x={2 + sway} y={-h/2 - 1} width={3} height={1} fill="#8FBC8F" />
                      {/* Tassel at top */}
                      <rect x={-2 + sway} y={-h - 2} width={4} height={2} fill="#D2691E" />
                    </>
                  )}

                  {/* Sugar cane segments */}
                  {isSugarCane && stage !== 'seedling' && (
                    <>
                      {Array.from({length: Math.floor(h/3)}).map((_, s) => (
                        <rect key={s} x={-1 + sway} y={-s*3 - 3} width={3} height={1} fill={shade(stem, -10)} />
                      ))}
                    </>
                  )}

                  {/* Leaves */}
                  {stage !== 'seedling' && !isSugarCane && (
                    <>
                      <rect x={-4 + sway} y={-h/2} width={3} height={2} fill={tip} />
                      <rect x={2 + sway} y={-h/2 - 2} width={3} height={2} fill={tip} />
                      {stage === 'vegetative' && (
                        <>
                          <rect x={-3 + sway} y={-h*0.7} width={2} height={2} fill={shade(tip, -5)} />
                          <rect x={2 + sway} y={-h*0.3} width={2} height={2} fill={shade(tip, -5)} />
                        </>
                      )}
                    </>
                  )}
                </g>
              );
            })}
          </g>
        ))}
      </g>
    );
  };

  const renderCottonField = () => {
    const { isSpring, isSummer, isAutumn, isWinter } = seasonalState;

    return (
      <g>
        {orchardGrid.map((n, i) => {
          const variation = 0.9 + (((i * 7) % 10) / 50);
          const h = stage === 'seedling' ? 3 : stage === 'vegetative' ? 5 : stage === 'blossom' ? 6 : 4;

          return (
            <g key={i}>
              {/* Cotton plant stem */}
              <rect x={n.x} y={n.y - h * variation} width={2} height={h * variation}
                    fill={isWinter ? '#8B7355' : S.grass} />

              {/* Spring seedlings */}
              {stage === 'seedling' && isSpring && (
                <>
                  <rect x={n.x - 1} y={n.y - 4} width={3} height={1} fill="#90EE90" />
                  <rect x={n.x} y={n.y - 5} width={1} height={1} fill="#98FB98" />
                </>
              )}

              {/* Summer growth and flowers */}
              {stage === 'blossom' && isSummer && (
                <>
                  {/* Leaves */}
                  <rect x={n.x - 2} y={n.y - 5} width={2} height={2} fill={shade(S.grass, 10)} />
                  <rect x={n.x + 1} y={n.y - 6} width={2} height={2} fill={shade(S.grass, 10)} />
                  {/* Cotton flowers - white/pink */}
                  <rect x={n.x - 1} y={n.y - 7} width={2} height={2} fill="#FFB6C1" />
                  <rect x={n.x + 1} y={n.y - 5} width={2} height={2} fill="#FFF0F5" />
                </>
              )}

              {/* Autumn cotton bolls */}
              {stage === 'fruiting' && isAutumn && (
                <>
                  {/* Open cotton bolls */}
                  <rect x={n.x - 3} y={n.y - 5} width={3} height={3} fill="#FFFAF0" />
                  <rect x={n.x - 2} y={n.y - 4} width={2} height={2} fill="#FFFFFF" />
                  <rect x={n.x + 1} y={n.y - 7} width={3} height={3} fill="#FFFAF0" />
                  <rect x={n.x + 2} y={n.y - 6} width={2} height={2} fill="#FFFFFF" />
                  {/* Brown boll casings */}
                  <rect x={n.x - 3} y={n.y - 3} width={1} height={1} fill="#8B4513" />
                  <rect x={n.x + 1} y={n.y - 5} width={1} height={1} fill="#8B4513" />
                </>
              )}

              {/* Winter dead stalks */}
              {isWinter && stage === 'dormant' && (
                <>
                  <rect x={n.x} y={n.y - 3} width={2} height={3} fill="#8B7355" />
                  {/* Remnant bolls */}
                  {i % 3 === 0 && <rect x={n.x + 1} y={n.y - 4} width={1} height={1} fill="#D2B48C" />}
                </>
              )}
            </g>
          );
        })}
      </g>
    );
  };

  const renderRicePaddies = () => (
    <g>
      {paddyCells.map((cell, i) => {
        const water = stage === 'flooded' || (season !== 'winter' && climate !== ClimateType.COLD);
        const waterColor = mix(S.water, '#6fbfff', 0.25);
        const shimmer = 0.25 + (1 + Math.sin((slowTick + i * 20) * 0.04)) * 0.06;
        return (
          <g key={i}>
            {/* levees */}
            <rect x={cell.x - 2} y={cell.y - 2} width={cell.w + 4} height={cell.h + 4} fill={shade(S.ground, -8)} />
            {/* water / soil */}
            <rect x={cell.x} y={cell.y} width={cell.w} height={cell.h} fill={water ? waterColor : shade(S.ground, -6)} opacity={water ? 0.88 : 1} />
            {water && <rect x={cell.x} y={cell.y + Math.floor(cell.h / 2)} width={cell.w} height={1} fill={shade(waterColor, -10)} opacity={0.35} />}
            {/* seedlings / stems */}
            {stage !== 'fallow' && (
              <g opacity={0.95}>
                {Array.from({ length: Math.floor(cell.w / 6) }).map((_, k) => {
                  const px = cell.x + 4 + k * 6 + ((k % 2) ? 1 : 0);
                  if (px < farmsteadRect.x + farmsteadRect.w && px > farmsteadRect.x && cell.y < farmsteadRect.y + farmsteadRect.h) return null;
                  const h = stage === 'flooded' ? 4 : stage === 'vegetative' ? 8 : 9;
                  const sway = stage === 'vegetative' ? Math.sin((px + tick) * 0.02) * 0.4 : 0;
                  const color = stage === 'harvest' ? '#d1b24a' : shade(S.grass, 6);
                  return <rect key={k} x={px + sway} y={cell.y + cell.h - h - 2} width={1} height={h} fill={color} />;
                })}
              </g>
            )}
            {/* harvest stacks in fall */}
            {stage === 'harvest' && (
              <g>
                <rect x={cell.x + cell.w - 10} y={cell.y + cell.h - 8} width={8} height={6} fill="#caa56a" />
                <rect x={cell.x + cell.w - 9} y={cell.y + cell.h - 9} width={6} height={2} fill="#b78c44" />
              </g>
            )}
            {/* subtle water shimmer */}
            {water && <rect x={cell.x} y={cell.y + 2} width={cell.w} height={1} fill={shade(waterColor, 8)} opacity={shimmer} />}
          </g>
        );
      })}
    </g>
  );

  // Unified crop renderer - routes to appropriate renderer based on config
  const renderCrop = () => {
    const config = getCropConfig(cropType);

    switch (config.type) {
      case 'field':
        return renderGenericField(config.primaryColor, config.accentColor);

      case 'tall_row':
        return renderTallRowCrops(config.primaryColor, config.accentColor, cropType, config.hasCornEars, config.hasSugarSegments);

      case 'orchard':
        return renderOrchard(config);

      case 'trellis':
        return renderVineyard();

      case 'cotton':
        return renderCottonField();

      case 'rice':
        return renderRicePaddies();

      default:
        return renderGenericField(config.primaryColor, config.accentColor);
    }
  };

  // Legacy function for backwards compatibility
  const renderCropSwitch = renderCrop;

  /* ---------------------------- Farm Animals ------------------------------ */

  const animals = useMemo(() => {
    const rng = new RNG(seed + 555);
    const animalList = [];

    // Use actual livestock data if provided, otherwise use defaults
    const livestockData = livestock || [
      { type: 'chicken', count: 3 },
      { type: 'cat', count: 1 },
      { type: 'dog', count: 1 }
    ];

    livestockData.forEach((animal) => {
      const animalType = animal.type.toLowerCase();

      // Map common animal names to renderable types
      const renderType = animalType.includes('chicken') || animalType.includes('hen') || animalType.includes('rooster') ? 'chicken' :
                         animalType.includes('cow') || animalType.includes('cattle') || animalType.includes('ox') ? 'cow' :
                         animalType.includes('pig') || animalType.includes('hog') ? 'pig' :
                         animalType.includes('sheep') ? 'sheep' :
                         animalType.includes('goat') ? 'goat' :
                         animalType.includes('horse') ? 'horse' :
                         animalType.includes('cat') ? 'cat' :
                         animalType.includes('dog') ? 'dog' : 'chicken'; // fallback

      const count = Math.min(animal.count, 8); // Max 8 of each type to avoid clutter

      // Chickens cluster in groups
      const isChicken = renderType === 'chicken';
      const clusterRadius = isChicken ? 20 : 0;

      // Some animals get babies
      const hasBabies = (renderType === 'cow' || renderType === 'goat' || renderType === 'sheep') && count > 1;

      for (let i = 0; i < count; i++) {
        const isBaby = hasBabies && i < Math.floor(count * 0.3); // 30% are babies

        // Chickens cluster tightly, others spread out
        const xOffset = isChicken ? rng.int(-clusterRadius, clusterRadius) : rng.int(-10, 30);
        const yOffset = isChicken ? rng.int(-5, 5) : 0;
        const spacing = isChicken ? i * 8 : i * 15;

        animalList.push({
          id: `${renderType}-${animalList.length}`, // Unique ID using array length
          type: renderType,
          x: farmsteadRect.x + farmsteadRect.w + 10 + spacing + xOffset,
          y: GROUND_Y - (renderType === 'cow' ? 8 : renderType === 'horse' ? 10 : 2) + yOffset,
          phase: rng.range(0, Math.PI * 2),
          behavior: rng.next() > 0.5 ? 'idle' : 'active',
          isBaby: isBaby,
          motherIndex: isBaby && i > 0 ? i - 1 : undefined
        });
      }
    });

    return animalList;
  }, [seed, farmsteadRect, GROUND_Y, livestock]);

  const drawAnimal = (animal: any) => {
    const scale = animal.isBaby ? 0.7 : 1.0;

    // Simple chicken - minimal SNES style
    if (animal.type === 'chicken') {
      const pecking = Math.sin(slowTick * 0.1 + animal.phase) > 0.6;
      return (
        <g key={animal.id} transform={`translate(${animal.x}, ${animal.y}) scale(${scale})`}>
          <ellipse cx={0} cy={1} rx={2} ry={1} fill="#000" opacity={0.2} />
          <ellipse cx={0} cy={pecking ? 0 : -1} rx={2} ry={2} fill="#FFF" />
          <circle cx={1} cy={pecking ? -1 : -2} r={1} fill="#FFF" />
          <rect x={2} y={pecking ? -1 : -2} width={1} height={1} fill="#F44" />
        </g>
      );
    }

    // Simple cow
    if (animal.type === 'cow') {
      return (
        <g key={animal.id} transform={`translate(${animal.x}, ${animal.y}) scale(${scale})`}>
          <ellipse cx={0} cy={2} rx={4} ry={1.5} fill="#000" opacity={0.15} />
          <ellipse cx={0} cy={-1} rx={4} ry={3} fill="#8B4513" />
          <ellipse cx={-3} cy={-1} rx={2} ry={1.5} fill="#8B4513" />
          <rect x={-4} y={-2} width={1} height={2} fill="#DDD" />
          <ellipse cx={-1} cy={-2} rx={1} ry={0.8} fill="#654321" />
        </g>
      );
    }

    // Simple horse
    if (animal.type === 'horse') {
      return (
        <g key={animal.id} transform={`translate(${animal.x}, ${animal.y}) scale(${scale})`}>
          <ellipse cx={0} cy={2} rx={5} ry={1.5} fill="#000" opacity={0.15} />
          <ellipse cx={0} cy={0} rx={5} ry={4} fill="#654321" />
          <ellipse cx={-4} cy={-3} rx={2} ry={2} fill="#654321" />
          <rect x={-5} y={-2} width={2} height={3} fill="#654321" />
        </g>
      );
    }

    // Simple sheep
    if (animal.type === 'sheep') {
      return (
        <g key={animal.id} transform={`translate(${animal.x}, ${animal.y}) scale(${scale})`}>
          <ellipse cx={0} cy={2} rx={3} ry={1} fill="#000" opacity={0.15} />
          <ellipse cx={0} cy={0} rx={3} ry={2.5} fill="#EEE" />
          <ellipse cx={-2} cy={-1} rx={1.5} ry={1.5} fill="#888" />
        </g>
      );
    }

    // Simple goat
    if (animal.type === 'goat') {
      return (
        <g key={animal.id} transform={`translate(${animal.x}, ${animal.y}) scale(${scale})`}>
          <ellipse cx={0} cy={2} rx={3} ry={1} fill="#000" opacity={0.15} />
          <ellipse cx={0} cy={0} rx={3} ry={2} fill="#A0826D" />
          <ellipse cx={-2.5} cy={-1} rx={1.3} ry={1.3} fill="#A0826D" />
          {!animal.isBaby && <rect x={-3.5} y={-2} width={0.5} height={1.5} fill="#CCC" />}
        </g>
      );
    }

    // Simple pig
    if (animal.type === 'pig') {
      return (
        <g key={animal.id} transform={`translate(${animal.x}, ${animal.y}) scale(${scale})`}>
          <ellipse cx={0} cy={1.5} rx={3} ry={1} fill="#000" opacity={0.15} />
          <ellipse cx={0} cy={0} rx={3} ry={2} fill="#FFB6C1" />
          <ellipse cx={-2.5} cy={0} rx={1.5} ry={1.2} fill="#FFB6C1" />
          <circle cx={-3.5} cy={0} r={0.7} fill="#FFA0B0" />
        </g>
      );
    }

    // Default for cat/dog or unknown
    return (
      <g key={animal.id} transform={`translate(${animal.x}, ${animal.y}) scale(${scale})`}>
        <ellipse cx={0} cy={1} rx={2.5} ry={1.5} fill="#888" />
      </g>
    );
  };


  /* -------------------------- Characters (pixel) -------------------------- */

  const drawCharacter = (c: FarmCharacter) => {
    // Calculate simple horizontal oscillation based on behavior
    let animatedX = c.x;
    let animatedY = c.y;

    // Animate ALL characters with behavior data
    if (c.behavior) {
      const time = tick * 0.02; // Slow down animation
      const phase = c.animationDelay || 0;
      const distance = c.movementDistance || 30;
      const duration = c.animationDuration || 10;
      const speed = 1 / duration; // Inverse duration for speed

      switch (c.behavior) {
        case 'walking_rows':
        case 'inspecting':
        case 'carrying':
          // Simple horizontal movement
          animatedX = c.x + Math.sin(time * speed + phase) * distance;
          break;

        case 'tending_tree':
          // Circular movement
          const angle = time * speed + phase;
          const radius = distance * 0.7;
          animatedX = c.x + Math.cos(angle) * radius;
          animatedY = c.y + Math.sin(angle) * radius * 0.5; // Elliptical
          break;

        case 'resting':
          // Gentle bob
          animatedY = c.y + Math.sin(time * 2 + phase) * 1;
          break;
      }
    }

    const direction = c.direction;
    const isFemale = c.gender === 'Female';
    const body = c.type === 'farmer' ? CHARACTER_COLORS.clothing_farmer :
                 (c.type === 'worker' ? CHARACTER_COLORS.clothing_worker : CHARACTER_COLORS.clothing_peasant);
    const head = CHARACTER_COLORS.skin_light;

    // Age-based scaling and positioning
    let characterScale = 1.0;
    let yOffset = 0; // Vertical offset to keep feet on ground

    if (c.role === 'Child') {
      characterScale = 0.7; // Children are smaller
      yOffset = 2; // Lift up slightly to keep feet at ground level
    } else if (c.role === 'Elder') {
      characterScale = 0.9; // Elderly slightly smaller/hunched
      yOffset = 1;
    }

    // Weather-based clothing and behavior
    const isRaining = seasonalState.shouldRain;
    const isSnowing = seasonalState.shouldSnow;
    const isHotSummer = season === 'summer' && (climate === ClimateType.TROPICAL || climate === ClimateType.ARID);

    // Weather gear flags
    const wearCloak = isRaining || isSnowing;
    const wearHood = isRaining;
    const bundledUp = isSnowing;

    // Animate leg position based on movement - subtle walk cycle
    const walkCycle = Math.abs(Math.sin(c.x * 0.08)) > 0.5 ? 0 : 1;
    const isMoving = Math.abs(c.speed) > 0.01;
    const legOffset = isMoving ? walkCycle : 0;

    // Idle animation calculations
    const idlePhase = c.idlePhase || 0;
    const idleWave = Math.sin((slowTick * 0.05) + idlePhase);
    // Hot weather makes wiping brow more frequent
    const idleThreshold = (isHotSummer && c.idleAnimation === 'wiping_brow') ? 0.5 : 0.7;
    const isIdleActive = idleWave > idleThreshold;

    // Tool/equipment based on character type
    const hasTool = c.type === 'farmer' || c.type === 'worker';
    const toolType = c.type === 'farmer' ? 'hoe' : 'rake';

    // Arm positions for different idle animations
    let leftArmY = -5;
    let leftArmX = -3;
    let rightArmY = -5;
    let rightArmX = 3;
    let toolVisible = false;
    let toolX = 0;
    let toolY = 0;
    let headOffsetY = 0;

    // Elderly characters have a slight hunch
    if (c.role === 'Elder') {
      headOffsetY = 0.5;
    }

    if (!isMoving && c.idleAnimation && isIdleActive) {
      if (c.idleAnimation === 'stretching') {
        // Arms raised above head
        leftArmY = -10;
        leftArmX = -2;
        rightArmY = -10;
        rightArmX = 2;
        headOffsetY = -0.5;
      } else if (c.idleAnimation === 'tool_use' && hasTool) {
        // Holding tool diagonally
        toolVisible = true;
        rightArmY = -4;
        rightArmX = 4;
        toolX = 5;
        toolY = -3;
      } else if (c.idleAnimation === 'wiping_brow') {
        // Hand to forehead
        rightArmY = -8;
        rightArmX = 0;
      }
    } else if (hasTool && !isMoving) {
      // Default: tool resting on ground
      toolVisible = true;
      rightArmY = -3;
      rightArmX = 3;
      toolX = 4;
      toolY = 0;
    }

    // Find the household member data for this character
    const memberData = householdMembers?.find(m => m.id === c.id);
    const characterName = memberData?.name || 'Farm Worker';
    const isHovered = hoveredCharacter === c.id;

    return (
      <g
        key={c.id}
        transform={`translate(${Math.round(animatedX)}, ${Math.round(animatedY - yOffset)})`}
      >
        {/* Interactive character group with hover/click */}
        <g
          onMouseEnter={() => setHoveredCharacter(c.id)}
          onMouseLeave={() => setHoveredCharacter(null)}
          onClick={() => memberData && onCharacterClick?.(c.id)}
          style={{ cursor: memberData ? 'pointer' : 'default' }}
        >
          {/* Invisible hit area for mouse events */}
          <rect
            x={-10}
            y={-20}
            width={20}
            height={25}
            fill="transparent"
            style={{ pointerEvents: 'all' }}
          />

          {/* Shadow directly at feet as ellipse - scale with character */}
          <ellipse cx={0} cy={yOffset} rx={3 * characterScale} ry={1} fill={ANIMAL_COLORS.shadow_light} opacity={0.22} style={{ pointerEvents: 'none' }} />

        {/* Character sprite group with age-based scaling */}
        <g transform={`scale(${characterScale})`} style={{ pointerEvents: 'none' }}>

        {isFemale ? (
          /* Female character sprite - more realistic proportions */
          <>
            {/* Legs (hidden under dress but show feet) */}
            <rect x={-2} y={-1} width={1} height={2} fill={CHARACTER_COLORS.clothing_dark} />
            <rect x={1} y={-1} width={1} height={2} fill={CHARACTER_COLORS.clothing_dark} />

            {/* Dress/skirt - A-line shape with waist definition */}
            <path
              d={`M -2 -6 L -3 -1 L 3 -1 L 2 -6 Z`}
              fill={body}
            />
            {/* Bodice/upper body - slightly narrower shoulders */}
            <rect x={-1.5} y={-8} width={3.5} height={3} fill={shade(body, -0.1)} />

            {/* Arms - slightly thinner for women */}
            <rect x={leftArmX} y={leftArmY} width={0.8} height={3} fill={CHARACTER_COLORS.skin_light} />
            <rect x={rightArmX} y={rightArmY} width={0.8} height={3} fill={CHARACTER_COLORS.skin_light} />

            {/* Head - slightly rounder */}
            <ellipse cx={0.5} cy={-8 + headOffsetY} rx={1.8} ry={2} fill={head} />

            {/* Eyes - more visible */}
            <rect x={-0.5} y={-8.5 + headOffsetY} width={0.5} height={0.5} fill={CHARACTER_COLORS.clothing_dark} />
            <rect x={1} y={-8.5 + headOffsetY} width={0.5} height={0.5} fill={CHARACTER_COLORS.clothing_dark} />

            {/* Hair - longer and more styled */}
            {c.role === 'Child' ? (
              /* Children have simpler hairstyles */
              <>
                <rect x={-2} y={-9 + headOffsetY} width={5} height={1} fill={shade(CHARACTER_COLORS.clothing_dark, 0.2)} />
                <rect x={-2} y={-8 + headOffsetY} width={1} height={1.5} fill={shade(CHARACTER_COLORS.clothing_dark, 0.2)} />
                <rect x={2} y={-8 + headOffsetY} width={1} height={1.5} fill={shade(CHARACTER_COLORS.clothing_dark, 0.2)} />
              </>
            ) : c.role === 'Elder' ? (
              /* Elders have graying hair in bun */
              <>
                <rect x={-2} y={-9 + headOffsetY} width={5} height={1} fill={'#909090'} />
                <ellipse cx={1} cy={-9.5 + headOffsetY} rx={1.5} ry={1} fill={'#909090'} />
              </>
            ) : (
              /* Adult women have longer flowing hair */
              <>
                <rect x={-2} y={-9 + headOffsetY} width={5} height={1} fill={CHARACTER_COLORS.clothing_dark} />
                <rect x={-2} y={-8 + headOffsetY} width={1} height={2.5} fill={CHARACTER_COLORS.clothing_dark} />
                <rect x={2.5} y={-8 + headOffsetY} width={1} height={2.5} fill={CHARACTER_COLORS.clothing_dark} />
              </>
            )}

            {/* Headscarf/bonnet for farmer women */}
            {c.type === 'farmer' && c.role !== 'Child' && (
              <>
                <rect x={-2} y={-10 + headOffsetY} width={5.5} height={1.5} fill={shade(body, 0.2)} />
                <path d={`M -2 -9 L -2.5 -7 L -1.5 -7 Z`} fill={shade(body, 0.15)} />
                <path d={`M 2.5 -9 L 2 -7 L 3 -7 Z`} fill={shade(body, 0.15)} />
              </>
            )}
          </>
        ) : (
          /* Male character sprite - broader shoulders, stronger features */
          <>
            {/* Animated legs with walk cycle */}
            <rect x={-2} y={-2 - legOffset} width={1.5} height={3} fill={CHARACTER_COLORS.clothing_dark} />
            <rect x={0.5}  y={-2 - (legOffset === 0 ? 1 : 0)} width={1.5} height={3} fill={CHARACTER_COLORS.clothing_dark} />

            {/* Body - broader for men */}
            <rect x={-2.5} y={-6} width={5.5} height={5} fill={body} />

            {/* Arms - slightly thicker */}
            <rect x={leftArmX} y={leftArmY} width={1.2} height={3} fill={CHARACTER_COLORS.skin_light} />
            <rect x={rightArmX} y={rightArmY} width={1.2} height={3} fill={CHARACTER_COLORS.skin_light} />

            {/* Head - more square/angular */}
            <rect x={-1.5} y={-8.5 + headOffsetY} width={3.5} height={2.5} fill={head} />

            {/* Eyes */}
            <rect x={-0.5} y={-8 + headOffsetY} width={0.5} height={0.5} fill={CHARACTER_COLORS.clothing_dark} />
            <rect x={1} y={-8 + headOffsetY} width={0.5} height={0.5} fill={CHARACTER_COLORS.clothing_dark} />

            {/* Hair/facial features based on age */}
            {c.role === 'Child' ? (
              /* Children have messy short hair */
              <rect x={-1.5} y={-9 + headOffsetY} width={3.5} height={1} fill={shade(CHARACTER_COLORS.clothing_dark, 0.2)} />
            ) : c.role === 'Elder' ? (
              /* Elders have graying receding hair and beard */
              <>
                <rect x={-1} y={-9 + headOffsetY} width={2.5} height={0.8} fill={'#909090'} />
                <rect x={-1} y={-7 + headOffsetY} width={2.5} height={1} fill={'#d0d0d0'} />
              </>
            ) : (
              /* Adult men have fuller hair */
              <rect x={-1.5} y={-9 + headOffsetY} width={3.5} height={1} fill={CHARACTER_COLORS.clothing_dark} />
            )}

            {/* Hat for farmer (not children) */}
            {c.type === 'farmer' && c.role !== 'Child' && (
              <>
                <rect x={-2} y={-10 + headOffsetY} width={4.5} height={1} fill={CHARACTER_COLORS.hat_straw} />
                <rect x={-2.5} y={-9.5 + headOffsetY} width={5.5} height={0.5} fill={shade(CHARACTER_COLORS.hat_straw, -0.2)} />
              </>
            )}
          </>
        )}

        {/* Weather Gear - Rendered after character body */}
        {wearCloak && (
          <g>
            {/* Cloak draped over shoulders */}
            <path
              d={`M -3 -7 L -4 -2 L -3 -1 L -2 -3 L -2 -7 Z`}
              fill={shade(body, -0.3)}
              opacity={0.7}
            />
            <path
              d={`M 3 -7 L 4 -2 L 3 -1 L 2 -3 L 2 -7 Z`}
              fill={shade(body, -0.3)}
              opacity={0.7}
            />
          </g>
        )}

        {wearHood && !bundledUp && (
          <g>
            {/* Hood covering head */}
            <path
              d={`M -2 -10 L -3 -8 L -1 -8 L -2 -10 Z`}
              fill={shade(body, -0.2)}
            />
            <path
              d={`M 2 -10 L 3 -8 L 1 -8 L 2 -10 Z`}
              fill={shade(body, -0.2)}
            />
            <rect x={-2} y={-10 + headOffsetY} width={5} height={2} fill={shade(body, -0.2)} />
          </g>
        )}

        {bundledUp && (
          <g>
            {/* Thick winter cloak and scarf */}
            <rect x={-3} y={-7} width={7} height={6} fill={shade(body, -0.4)} opacity={0.8} />
            {/* Scarf around neck */}
            <rect x={-2} y={-7} width={5} height={2} fill={shade(body, 0.3)} />
          </g>
        )}

        {/* Breath puff in cold weather */}
        {isSnowing && isMoving && Math.sin(slowTick * 0.3 + (c.idlePhase || 0)) > 0.5 && (
          <ellipse
            cx={c.direction * 2}
            cy={-8 + headOffsetY}
            rx={2}
            ry={1}
            fill="#ffffff"
            opacity={0.4}
          />
        )}

        {/* Tool/Equipment */}
        {toolVisible && (
          <g>
            {toolType === 'hoe' && (
              <>
                {/* Hoe handle */}
                <line x1={toolX} y1={toolY} x2={toolX} y2={toolY - 8} stroke={MATERIAL_COLORS.wood_medium} strokeWidth="1" />
                {/* Hoe blade */}
                <rect x={toolX - 2} y={toolY - 9} width={4} height={1} fill={MATERIAL_COLORS.metal_iron} />
              </>
            )}
            {toolType === 'rake' && (
              <>
                {/* Rake handle */}
                <line x1={toolX} y1={toolY} x2={toolX} y2={toolY - 8} stroke={MATERIAL_COLORS.wood_medium} strokeWidth="1" />
                {/* Rake tines */}
                <line x1={toolX - 2} y1={toolY - 8} x2={toolX + 2} y2={toolY - 8} stroke={MATERIAL_COLORS.metal_iron} strokeWidth="1" />
                <line x1={toolX - 2} y1={toolY - 8} x2={toolX - 2} y2={toolY - 9} stroke={MATERIAL_COLORS.metal_iron} strokeWidth="0.5" />
                <line x1={toolX} y1={toolY - 8} x2={toolX} y2={toolY - 9} stroke={MATERIAL_COLORS.metal_iron} strokeWidth="0.5" />
                <line x1={toolX + 2} y1={toolY - 8} x2={toolX + 2} y2={toolY - 9} stroke={MATERIAL_COLORS.metal_iron} strokeWidth="0.5" />
              </>
            )}
          </g>
        )}
        </g> {/* End of scaled character sprite group */}
        </g> {/* End of interactive group */}

        {/* Hover Tooltip */}
        {isHovered && (
          <g>
            {/* Tooltip background */}
            <rect
              x={-25}
              y={-35}
              width={50}
              height={16}
              fill="#2c2c2c"
              opacity={0.92}
              rx={3}
            />
            {/* Tooltip text */}
            <text
              x={0}
              y={-24}
              fill="#fff"
              fontSize={10}
              fontWeight="500"
              textAnchor="middle"
              style={{ pointerEvents: 'none' }}
            >
              {characterName}
            </text>
          </g>
        )}
      </g>
    );
  };

  /* ---------------------------- Flying Birds ------------------------------ */

  const FlyingBirds = useMemo(() => {
    if (timeOfDay !== 'Dawn' && timeOfDay !== 'Dusk') return null;

    const birds = [];
    for (let i = 0; i < 5; i++) {
      const x = (tick * (1 + i * 0.3) + i * 100) % (width + 100) - 50;
      const y = 20 + Math.sin(tick * 0.05 + i) * 10 + i * 8;
      birds.push({ x, y, size: 2 + (i % 2) });
    }

    return (
      <g opacity={0.7}>
        {birds.map((bird, i) => (
          <g key={i} transform={`translate(${bird.x}, ${bird.y})`}>
            {/* Simple V-shape bird */}
            <path d={`M -${bird.size} 0 L 0 ${Math.sin(tick * 0.2 + i) * 2} L ${bird.size} 0`}
              stroke="#2F4F4F" strokeWidth="1" fill="none" />
          </g>
        ))}
      </g>
    );
  }, [timeOfDay, tick, width]);

  /* -------------------------- Seasonal Particles --------------------------- */

  const SeasonalParticles = useMemo(() => {
    const particles = [];
    const rng = new RNG(seed + Math.floor(slowTick / 50)); // Use slowTick for gentler movement

    if (seasonalState.shouldShowPollen) {
      // Floating pollen particles
      for (let i = 0; i < 12; i++) {
        const baseX = (i * 80 + seed * 3) % width;
        const driftX = Math.sin(slowTick * 0.02 + i) * 15;
        const driftY = Math.sin(slowTick * 0.03 + i * 0.7) * 8;
        particles.push({
          x: baseX + driftX,
          y: HORIZON_Y + 20 + (i % 3) * 15 + driftY,
          size: 1.5,
          color: WATER_WEATHER_COLORS.pollen_yellow,
          opacity: 0.4 + Math.sin(slowTick * 0.08 + i) * 0.15
        });
      }
    } else if (seasonalState.shouldShowFallingLeaves) {
      // Gently falling leaves
      for (let i = 0; i < 6; i++) {
        const leafX = ((i * 120 + slowTick * 0.8) % (width + 40)) - 20;
        const leafY = HORIZON_Y + 10 + (slowTick * 0.6 + i * 20) % 80;
        const colors = [PLANT_COLORS.autumn_rust, PLANT_COLORS.leaf_fall, PLANT_COLORS.autumn_brown, '#A0522D', '#DEB887'];
        const sway = Math.sin(slowTick * 0.04 + i) * 12;
        particles.push({
          x: leafX + sway,
          y: leafY,
          size: 3 + (i % 2),
          color: colors[i % colors.length],
          opacity: 0.8,
          rotation: (slowTick * 1.5 + i * 60) % 360
        });
      }
    }

    return (
      <g opacity={0.7}>
        {particles.map((p, i) => (
          seasonalState.shouldShowPollen ? (
            <circle key={i} cx={p.x} cy={p.y} r={p.size} fill={p.color} opacity={p.opacity} />
          ) : (
            <g key={i} transform={`translate(${p.x}, ${p.y}) rotate(${p.rotation})`}>
              <path d={`M -${p.size/2} 0 Q 0 -${p.size} ${p.size/2} 0 Q 0 ${p.size/2} -${p.size/2} 0`}
                fill={p.color} opacity={p.opacity} />
            </g>
          )
        ))}
      </g>
    );
  }, [seasonalState, slowTick, seed, width, HORIZON_Y]);

  /* ------------------------------ Weather layer --------------------------- */

  // Rain puddles for Mediterranean winters and wet seasons
  const showPuddles = seasonalState.shouldShowPuddles;

  const Weather = (
    <g>
      {/* Fog/Mist layers for dawn, dusk, and wet conditions */}
      {(timeOfDay === 'Dawn' || timeOfDay === 'Dusk' || seasonalState.shouldShowMist) && (
        <g>
          {/* Multi-layer fog effect - bottom to top */}
          <rect
            x={0}
            y={GROUND_Y + 15}
            width={width}
            height={40}
            fill="#e8f0f5"
            opacity={0.15 + Math.sin(slowTick * 0.03) * 0.05}
          />
          <rect
            x={0}
            y={GROUND_Y - 10}
            width={width}
            height={30}
            fill="#d8e4ec"
            opacity={0.12 + Math.sin(slowTick * 0.04 + 1) * 0.04}
          />
          <rect
            x={0}
            y={HORIZON_Y + 20}
            width={width}
            height={50}
            fill="#c8d8e4"
            opacity={0.08 + Math.sin(slowTick * 0.05 + 2) * 0.03}
          />

          {/* Mist wisps - floating horizontal bands */}
          {Array.from({ length: 4 }).map((_, i) => {
            const wispY = GROUND_Y - 15 + i * 20;
            const wispDrift = Math.sin((slowTick * 0.06) + i * 1.5) * 15;
            return (
              <ellipse
                key={`mist-${i}`}
                cx={width / 2 + wispDrift}
                cy={wispY}
                rx={width * 0.4}
                ry={8}
                fill="#e0ecf4"
                opacity={0.1 + Math.sin(slowTick * 0.04 + i) * 0.05}
              />
            );
          })}
        </g>
      )}

      {/* Snow accumulation on roofs and ground */}
      {wantSnow && (
        <g>
          {/* Snow on farmstead roof */}
          <g opacity={0.9}>
            {/* Medieval/Nordic style roof snow */}
            {(variant === 'medieval_euro' || variant === 'nordic' || variant === 'steppe') && (
              <>
                {/* Snow layer on roof peak */}
                <polygon
                  points={`${farmsteadRect.x + 8},${farmsteadRect.y} ${farmsteadRect.x + farmsteadRect.w / 2},${farmsteadRect.y - 25} ${farmsteadRect.x + farmsteadRect.w - 8},${farmsteadRect.y}`}
                  fill={WATER_WEATHER_COLORS.snow_white}
                  opacity={0.85}
                />
                {/* Icicles on roof edge */}
                {Array.from({ length: 8 }).map((_, i) => {
                  const icicleX = farmsteadRect.x + 15 + i * 12;
                  const icicleLength = 3 + (i % 3);
                  return (
                    <polygon
                      key={`icicle-${i}`}
                      points={`${icicleX},${farmsteadRect.y} ${icicleX - 1},${farmsteadRect.y + icicleLength} ${icicleX + 1},${farmsteadRect.y + icicleLength}`}
                      fill="#d4f1f9"
                      opacity={0.8}
                    />
                  );
                })}
              </>
            )}
          </g>

          {/* Snow drifts on ground */}
          <g opacity={0.7}>
            {Array.from({ length: 6 }).map((_, i) => {
              const driftX = rng.range(80, width - 120);
              const driftY = GROUND_Y + rng.range(12, 25);
              const driftW = rng.range(25, 45);
              return (
                <ellipse
                  key={`drift-${i}`}
                  cx={driftX}
                  cy={driftY}
                  rx={driftW}
                  ry={rng.range(2, 4)}
                  fill={WATER_WEATHER_COLORS.snow_white}
                  opacity={0.75}
                />
              );
            })}
          </g>

          {/* Snow layer on ground */}
          <rect
            x={0}
            y={GROUND_Y + 10}
            width={width}
            height={3}
            fill={WATER_WEATHER_COLORS.snow_white}
            opacity={0.3}
          />
        </g>
      )}

      {/* Rain puddles on ground */}
      {showPuddles && (
        <g opacity={0.4}>
          {Array.from({ length: 5 }).map((_, i) => {
            const px = rng.range(100, width - 100);
            const py = GROUND_Y + rng.range(10, 30);
            const pw = rng.range(20, 40);
            const ph = rng.range(3, 6);
            return (
              <ellipse key={`puddle-${i}`} cx={px} cy={py} rx={pw} ry={ph}
                fill={S.water} opacity={0.5 + Math.sin(slowTick * 0.02) * 0.1} />
            );
          })}
        </g>
      )}
      
      {particlesRef.current.map(p => {
        switch (p.kind) {
          case 'rain':   return <line key={p.id} x1={p.x} y1={p.y - 6} x2={p.x - 3} y2={p.y} stroke={WATER_WEATHER_COLORS.rain_drop} strokeWidth={1} opacity={0.6} />;
          case 'snow':   return <rect key={p.id} x={p.x} y={p.y} width={1} height={1} fill={WATER_WEATHER_COLORS.snow_white} opacity={0.85} />;
          case 'dust':   return <rect key={p.id} x={p.x} y={p.y} width={2} height={1} fill={shade(S.ground, 10)} opacity={0.35} />;
          case 'splash': {
            // Animated splash effect - small expanding circle that fades
            const splashSize = (8 - (p.life || 0)) * 0.4;
            const splashOpacity = (p.life || 0) / 8 * 0.4;
            return (
              <g key={p.id}>
                <circle cx={p.x} cy={p.y} r={splashSize} fill="none" stroke={WATER_WEATHER_COLORS.rain_drop} strokeWidth={0.5} opacity={splashOpacity} />
                <circle cx={p.x} cy={p.y} r={splashSize * 0.5} fill={WATER_WEATHER_COLORS.rain_drop} opacity={splashOpacity * 0.5} />
              </g>
            );
          }
          case 'firefly':{
            const pulse = (Math.sin((slowTick + Number(p.id.slice(1)) * 8) * 0.06) + 1) * 0.3 + 0.2;
            return <rect key={p.id} x={p.x} y={p.y} width={1} height={1} fill={WATER_WEATHER_COLORS.firefly_glow} opacity={pulse} />;
          }
        }
      })}
    </g>
  );

  /* -------------------------------- Render -------------------------------- */

  // Generate dynamic caption describing current activity
  const captionData = useMemo(() => {
    const maxFieldWorkers = getFieldWorkerCount(timeOfDay, season);
    return generateFarmBannerCaption({
      householdMembers,
      visibleCharacters: baseCharacters.filter(c => c.type !== 'animal'),
      timeOfDay,
      season,
      cropType,
      maxFieldWorkers,
      weather: {
        isRaining: seasonalState.shouldRain,
        isSnowing: seasonalState.shouldSnow,
        isDrought: seasonalState.shouldHaveDust,
      },
    });
  }, [householdMembers, baseCharacters, timeOfDay, season, cropType, seasonalState]);

  // Render caption with clickable character names
  const renderCaption = () => {
    if (captionData.characterNames.length === 0) {
      return <span>{captionData.text}</span>;
    }

    // Split text and insert clickable name spans
    let remainingText = captionData.text;
    const parts: React.ReactNode[] = [];
    let keyIndex = 0;

    captionData.characterNames.forEach((char, idx) => {
      const nameIndex = remainingText.indexOf(char.name);
      if (nameIndex !== -1) {
        // Add text before name
        if (nameIndex > 0) {
          parts.push(
            <span key={`text-${keyIndex++}`}>
              {remainingText.substring(0, nameIndex)}
            </span>
          );
        }

        // Add clickable name
        parts.push(
          <button
            key={`name-${keyIndex++}`}
            onClick={() => onCharacterClick?.(char.id)}
            className="text-amber-400 hover:underline transition-all cursor-pointer"
          >
            {char.name}
          </button>
        );

        // Update remaining text
        remainingText = remainingText.substring(nameIndex + char.name.length);
      }
    });

    // Add any remaining text
    if (remainingText.length > 0) {
      parts.push(<span key={`text-${keyIndex++}`}>{remainingText}</span>);
    }

    return <>{parts}</>;
  };

  // Calculate zoomed viewBox for center-focused zoom
  const zoomLevel = 1.5;
  const zoomedWidth = width / zoomLevel;
  const zoomedHeight = height / zoomLevel;
  const zoomOffsetX = (width - zoomedWidth) / 2;
  const zoomOffsetY = (height - zoomedHeight) / 1.5; // Shift down to show more land, less sky

  return (
    <div className="relative">
      {/* Banner SVG */}
      <svg width={width} height={height} viewBox={`${zoomOffsetX} ${zoomOffsetY} ${zoomedWidth} ${zoomedHeight}`} style={{ imageRendering: 'pixelated' }}>
      {Defs}
      {Sky}
      {BiomeDressing}
      {Ground}

      {/* Footpath patterns */}
      {FootpathPatterns}

      {/* Garden plot */}
      {GardenPlot}

      {/* Farm animals - render BEFORE farmstead so they appear behind it */}
      {animals.map(drawAnimal)}

      {/* Farmstead & accessory (defines a real clearing) */}
      {Farmstead}
      {MillOrWell}

      {/* Laundry line */}
      {LaundryLine}

      {/* Crops (static geometry; no flicker) */}
      {renderCropSwitch()}

      {/* People (ground-clamped) */}
      {baseCharacters.map(drawCharacter)}

      {/* Optional banner label near lane (subtle, non-intrusive) */}
      {farmName && (
        <g opacity={0.5}>
          <rect x={pathRect.x + 8} y={GROUND_Y - 16} width={farmName.length * 6 + 8} height={10} fill="#000" opacity={0.18} />
        </g>
      )}

      {/* Flying birds at dawn/dusk */}
      {FlyingBirds}

      {/* Seasonal particles */}
      {SeasonalParticles}

      {/* Weather overlay */}
      {Weather}

      {/* Cinematic vignette */}
      <rect x={0} y={0} width={width} height={height} fill={`url(#vig-${seed})`} />
    </svg>

      {/* Caption overlay on banner */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900/90 via-slate-900/70 to-transparent px-4 py-3">
        <p className="text-sm text-slate-200 italic leading-relaxed drop-shadow-lg text-right pointer-events-auto">
          {renderCaption()}
        </p>
      </div>
    </div>
  );
};

export default FarmBanner;

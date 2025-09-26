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

export type Condition = 'humble' | 'prosperous';
export type CropType = string;

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
  const n = hex.replace('#', '');
  return { r: parseInt(n.slice(0, 2), 16), g: parseInt(n.slice(2, 4), 16), b: parseInt(n.slice(4, 6), 16) };
};
const rgbToHex = (r: number, g: number, b: number) =>
  `#${clamp(r).toString(16).padStart(2, '0')}${clamp(g).toString(16).padStart(2, '0')}${clamp(b).toString(16).padStart(2, '0')}`;
const shade = (hex: string, pct: number) => {
  const { r, g, b } = hexToRgb(hex);
  const f = (v: number) => (pct >= 0 ? v + (255 - v) * pct / 100 : v + v * pct / 100);
  return rgbToHex(Math.round(f(r)), Math.round(f(g)), Math.round(f(b)));
};

const mix = (a: string, b: string, t: number) => {
  const A = hexToRgb(a), B = hexToRgb(b);
  return rgbToHex(A.r + (B.r - A.r) * t, A.g + (B.g - A.g) * t, A.b + (B.b - A.b) * t);
};

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

interface FarmCharacter { id: string; x: number; y: number; type: 'farmer' | 'worker' | 'animal'; direction: 1 | -1; speed: number; }
interface Particle { id: string; x: number; y: number; vx: number; vy: number; kind: 'snow' | 'rain' | 'leaf' | 'dust' | 'firefly'; }

const FarmBanner: React.FC<FarmBannerProps> = ({
  era,
  culturalZone,
  condition,
  cropType,
  climate,
  season,
  seed = 12345,
  width = 1280,
  height = 220,
  timeOfDay = 'Midday',
  farmName,
  farmerName,
  currentBiome = BiomeType.GRASSLAND,
  surroundingBiomes = []
}) => {
  /* Derived settings */
  const rng = useMemo(() => new RNG(seed), [seed]);
  const T = TIME_PAL[(timeOfDay as keyof typeof TIME_PAL) in TIME_PAL ? timeOfDay as keyof typeof TIME_PAL : 'Midday'];
  const S = getSeasonPalette(season, climate);
  const variant = useMemo(() => variantFrom(era, culturalZone), [era, culturalZone]);
  const stage = useMemo(() => growthFor(cropType, season, climate), [cropType, season, climate]);

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
  const [characters, setCharacters] = useState<FarmCharacter[]>([]);
  useEffect(() => {
    const rr = new RNG(seed + 33);
    const ground = GROUND_Y + 10;
    const arr: FarmCharacter[] = [{ id: 'farmer', x: width * 0.28, y: ground, type: 'farmer', direction: 1, speed: 0.22 }];
    if (condition === 'prosperous') {
      arr.push({ id: 'worker-0', x: rr.range(190, width - 240), y: ground, type: 'worker', direction: rr.next() > 0.5 ? 1 : -1, speed: 0.2 });
      arr.push({ id: 'worker-1', x: rr.range(220, width - 260), y: ground, type: 'worker', direction: rr.next() > 0.5 ? 1 : -1, speed: 0.22 });
    }
    // a grazing animal near the lane
    arr.push({ id: 'animal-0', x: rr.range(140, width - 200), y: ground + 12, type: 'animal', direction: rr.next() > 0.5 ? 1 : -1, speed: 0.1 });
    setCharacters(arr);
  }, [seed, width, GROUND_Y, condition]);

  useEffect(() => {
    setCharacters(prev => prev.map(c => {
      let x = c.x + c.speed * c.direction;
      let d = c.direction;
      if (x <= 40 || x >= width - 40) { d *= -1; x = c.x + c.speed * d; }
      return { ...c, x, direction: d }; // keep y static
    }));
  }, [tick, width]);

  /* ----------------------------- Stable Weather --------------------------- */
  const particlesRef = useRef<Particle[]>([]);
  // Snow only in cold climates and cold-temperate winters
  const wantSnow   = season === 'winter' && climate === ClimateType.COLD;
  // Mediterranean winters get rain instead of snow, tropical/semitropical have minimal weather variation
  const wantRain   = (season === 'winter' && climate === ClimateType.MEDITERRANEAN) ||
                     (season === 'spring' && climate !== ClimateType.ARID && climate !== ClimateType.TROPICAL && climate !== ClimateType.SEMITROPICAL) ||
                     (season === 'summer' && climate === ClimateType.TROPICAL && rng.next() < 0.3); // Tropical occasional rain
  const wantDust   = climate === ClimateType.ARID && (season === 'summer' || season === 'fall');
  const wantFirefly= (season === 'summer' && timeOfDay === 'Dusk' && climate !== ClimateType.ARID && climate !== ClimateType.COLD);

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
    for (let i = 0; i < ps.length; i++) {
      const p = ps[i]; p.x += p.vx; p.y += p.vy;
      if (p.kind === 'snow' || p.kind === 'rain') {
        if (p.y > height || p.x < -40 || p.x > width + 40) { p.x = (p.x + width) % width; p.y = rng.range(0, 20); }
      } else if (p.kind === 'dust') {
        if (p.x > width + 10) { p.x = -10; p.y = rng.range(GROUND_Y - 6, GROUND_Y + 40); }
      } else if (p.kind === 'firefly') {
        if (p.x < 0) p.x = width - 1; if (p.x > width) p.x = 1;
        if (p.y < GROUND_Y - 10) p.vy = Math.abs(p.vy);
        if (p.y > height - 10) p.vy = -Math.abs(p.vy);
      }
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
          const mtColor = season === 'winter' || climate === ClimateType.COLD ? '#e0e4ef' : '#6b5d5d';
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
          // Dense forest background
          const trunk = climate === ClimateType.TROPICAL ? shade(S.tree, -8) : shade(S.tree, -12);
          const foliage = climate === ClimateType.TROPICAL ? shade(S.tree, 10) : S.tree;
          return (
            <g key={`tree-${i}`} opacity={0.85}>
              <rect x={feature.x} y={HORIZON_Y - feature.h} width={3} height={feature.h} fill={trunk} />
              <ellipse cx={feature.x + 1.5} cy={HORIZON_Y - feature.h} rx={feature.w/2} ry={feature.h/3} fill={foliage} />
              {feature.variant === 1 && (
                <ellipse cx={feature.x + 1.5} cy={HORIZON_Y - feature.h + 5} rx={feature.w/2 - 1} ry={feature.h/4} fill={shade(foliage, -8)} />
              )}
            </g>
          );
        }
        
        if (feature.type === 'pine') {
          // Snow-covered pines
          const pineColor = season === 'winter' ? '#4a5d4a' : '#2f4a2f';
          const snowColor = '#ffffff';
          return (
            <g key={`pine-${i}`} opacity={0.9}>
              <polygon points={`${feature.x},${HORIZON_Y - feature.h} ${feature.x - feature.w/2},${HORIZON_Y} ${feature.x + feature.w/2},${HORIZON_Y}`} 
                fill={pineColor} />
              {season === 'winter' && (
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
          <circle cx={5 + i * 8} cy={6} r={2} fill="#90EE90" />
          <circle cx={5 + i * 8} cy={6} r={1} fill="#3CB371" />
        </g>
      ))}

      {/* Tomatoes on stakes */}
      {[0, 1].map(i => (
        <g key={`tomato-${i}`}>
          <rect x={7 + i * 10} y={10} width={1} height={6} fill="#8B4513" />
          <circle cx={7 + i * 10} cy={12} r={1} fill="#FF6347" />
          <circle cx={8 + i * 10} cy={14} r={1} fill="#FF4500" />
        </g>
      ))}

      {/* Herbs */}
      {[0, 1, 2, 3].map(i => (
        <rect key={`herb-${i}`} x={20 + i * 2} y={8 + (i % 2) * 4} width={1} height={2} fill="#228B22" />
      ))}

      {/* Scarecrow */}
      <g transform={`translate(15, -8)`}>
        <rect x={0} y={0} width={1} height={8} fill="#8B4513" />
        <rect x={-2} y={2} width={5} height={1} fill="#8B4513" />
        <rect x={-1} y={0} width={3} height={2} fill="#D2691E" />
        <rect x={0} y={-1} width={1} height={1} fill="#8B7355" />
      </g>
    </g>
  );

  /* ---------------------------- Laundry Line ------------------------------- */

  const LaundryLine = useMemo(() => {
    // Hide laundry at night or during rain (based on season/climate)
    const isRainy = (season === 'winter' && climate === ClimateType.MEDITERRANEAN) ||
                    (season === 'summer' && climate === ClimateType.TROPICAL);
    if (timeOfDay === 'Night' || isRainy) return null;

    const cx = Math.round(width * 0.18);
    const lineY = GROUND_Y - 35;
    const sway = Math.sin(slowTick * 0.03) * 2;

    return (
      <g>
        {/* Line */}
        <rect x={cx + 70} y={lineY} width={60} height={1} fill="#8B7355" />

        {/* Clothes */}
        <g transform={`translate(${cx + 80}, ${lineY})`}>
          {/* Shirt */}
          <rect x={0 + sway * 0.5} y={1} width={8} height={10} fill="#87CEEB" />
          <rect x={2 + sway * 0.5} y={1} width={4} height={2} fill="#6495ED" />
        </g>

        <g transform={`translate(${cx + 95}, ${lineY})`}>
          {/* Pants */}
          <rect x={0 + sway * 0.7} y={1} width={3} height={12} fill="#4682B4" />
          <rect x={3 + sway * 0.7} y={1} width={3} height={12} fill="#4682B4" />
        </g>

        <g transform={`translate(${cx + 110}, ${lineY})`}>
          {/* Dress */}
          <rect x={0 + sway} y={1} width={6} height={8} fill="#FFB6C1" />
          <polygon points={`${0 + sway},${9} ${3 + sway},${13} ${6 + sway},${9}`} fill="#FFB6C1" />
        </g>
      </g>
    );
  }, [width, GROUND_Y, timeOfDay, season, climate, slowTick]);

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

    switch (variant) {
      case 'medieval_euro':
        return (
          <g>
            {shadow(cx - 50, by, 100, 40)}
            {/* Main structure with timber frame */}
            <rect x={cx - 50} y={by} width={100} height={40} fill="#8b5e3b" />
            {highlight(cx - 50, by, 100, 2)} {/* Top edge highlight */}

            {/* Thatched roof with layered texture */}
            <polygon points={`${cx - 58},${by} ${cx},${by - 26} ${cx + 58},${by}`} fill="#d7b46b" />
            <polygon points={`${cx - 54},${by - 2} ${cx},${by - 22} ${cx + 54},${by - 2}`} fill="#c4a05c" opacity={0.6} />
            {/* Roof ridge beam */}
            <rect x={cx - 2} y={by - 26} width={4} height={2} fill="#5b3a24" />

            {/* Timber frame details */}
            <rect x={cx - 50} y={by + 12} width={100} height={2} fill="#5b3a24" />
            <rect x={cx - 1} y={by} width={2} height={40} fill="#5b3a24" />
            <rect x={cx - 25} y={by} width={2} height={40} fill="#5b3a24" />
            <rect x={cx + 23} y={by} width={2} height={40} fill="#5b3a24" />

            {/* Door with depth */}
            <rect x={cx - 10} y={by + 18} width={20} height={20} fill="#2c1b12" />
            <rect x={cx - 8} y={by + 20} width={16} height={16} fill="#3d2618" /> {/* Inner door */}
            <rect x={cx - 1} y={by + 28} width={2} height={8} fill="#1a0f08" /> {/* Door crack */}

            {/* Windows with shutters and glass effect */}
            <rect x={cx - 34} y={by + 8} width={12} height={8} fill="#4a5c6b" />
            <rect x={cx - 32} y={by + 10} width={8} height={4} fill="#6ea7d6" opacity={0.8} />
            <rect x={cx - 34} y={by + 8} width={2} height={8} fill="#5b3a24" /> {/* Shutter */}

            <rect x={cx + 22} y={by + 8} width={12} height={8} fill="#4a5c6b" />
            <rect x={cx + 24} y={by + 10} width={8} height={4} fill="#6ea7d6" opacity={0.8} />
            <rect x={cx + 32} y={by + 8} width={2} height={8} fill="#5b3a24" /> {/* Shutter */}

            {/* Detailed hayricks with texture */}
            <rect x={cx + 78} y={by + 16} width={10} height={8} fill="#caa56a" />
            <rect x={cx + 78} y={by + 14} width={10} height={2} fill="#d4b57a" /> {/* Top layer */}
            <rect x={cx + 92} y={by + 18} width={10} height={8} fill="#caa56a" />
            <rect x={cx + 92} y={by + 16} width={10} height={2} fill="#d4b57a" /> {/* Top layer */}

            {/* Small details: chimney */}
            <rect x={cx + 35} y={by - 20} width={6} height={12} fill="#7a5e4a" />
            <rect x={cx + 35} y={by - 22} width={6} height={2} fill="#5b3a24" />
          </g>
        );
      case 'industrial_euro':
      case 'frontier':
        return (
          <g>
            {shadow(cx - 56, by + 2, 112, 34)}
            <rect x={cx - 56} y={by + 2} width={112} height={34} fill="#8b7356" />
            <rect x={cx - 56} y={by} width={112} height={2} fill="#6e5f4a" />
            <rect x={cx - 10} y={by + 16} width={20} height={20} fill="#2c1b12" />
            {/* silo */}
            <rect x={cx + 80} y={by - 12} width={18} height={48} fill="#b7bcc4" />
            <rect x={cx + 80} y={by - 14} width={18} height={2} fill="#8a909b" />
            {/* porch awning */}
            <rect x={cx - 24} y={by + 12} width={48} height={4} fill="#705940" />
          </g>
        );
      case 'mena':
        return (
          <g>
            {shadow(cx - 46, by + 8, 92, 26)}
            {/* Adobe/mud brick structure with texture */}
            <rect x={cx - 46} y={by + 8} width={92} height={26} fill="#ead9c5" />
            <rect x={cx - 46} y={by + 6} width={92} height={2} fill="#c8b4a0" />
            {highlight(cx - 46, by + 8, 92, 2)} {/* Top edge highlight */}

            {/* Texture details on walls */}
            <rect x={cx - 30} y={by + 14} width={4} height={4} fill="#d6c4b0" opacity={0.5} />
            <rect x={cx + 10} y={by + 20} width={4} height={4} fill="#d6c4b0" opacity={0.5} />
            <rect x={cx + 28} y={by + 16} width={4} height={4} fill="#d6c4b0" opacity={0.5} />

            {/* Arched doorway */}
            <rect x={cx - 12} y={by + 12} width={24} height={18} fill="#a0826d" />
            <path d={`M ${cx - 12} ${by + 12} Q ${cx} ${by + 8} ${cx + 12} ${by + 12}`} fill="#a0826d" />
            <rect x={cx - 10} y={by + 14} width={20} height={16} fill="#3d2618" /> {/* Inner doorway */}
            <rect x={cx - 12} y={by + 12} width={24} height={2} fill="#8b6a55" />

            {/* Decorative window with mashrabiya pattern */}
            <rect x={cx - 36} y={by + 12} width={8} height={6} fill="#8b6a55" />
            <rect x={cx - 35} y={by + 13} width={2} height={4} fill="#d6c4b0" opacity={0.6} />
            <rect x={cx - 32} y={by + 13} width={2} height={4} fill="#d6c4b0" opacity={0.6} />
            <rect x={cx - 29} y={by + 13} width={2} height={4} fill="#d6c4b0" opacity={0.6} />

            <rect x={cx + 28} y={by + 12} width={8} height={6} fill="#8b6a55" />
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

            {/* Paper windows */}
            <rect x={cx - 36} y={by + 12} width={10} height={8} fill="#3d2618" />
            <rect x={cx - 34} y={by + 14} width={6} height={4} fill="#f4e6d9" opacity={0.7} />
            <rect x={cx - 31} y={by + 12} width={1} height={8} fill="#2c1b12" />

            <rect x={cx + 26} y={by + 12} width={10} height={8} fill="#3d2618" />
            <rect x={cx + 28} y={by + 14} width={6} height={4} fill="#f4e6d9" opacity={0.7} />
            <rect x={cx + 31} y={by + 12} width={1} height={8} fill="#2c1b12" />

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
            <rect x={cx - 52} y={by + 4} width={104} height={30} fill="#6f4426" />
            <polygon points={`${cx - 58},${by + 4} ${cx},${by - 10} ${cx + 58},${by + 4}`} fill="#5a371c" />
            {/* drying rails */}
            <rect x={cx + 74} y={by + 10} width={18} height={2} fill="#7b4f2a" />
            <rect x={cx + 74} y={by + 14} width={18} height={2} fill="#7b4f2a" />
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

  const renderGenericField = (primary: string, accent: string) => {
    // Enhanced with season-aware rendering
    const isWinter = season === 'winter';
    const isSpring = season === 'spring';
    const isSummer = season === 'summer';
    const isAutumn = season === 'fall';

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
        {furrowRows.map((row, ri) => (
          <g key={ri}>
            {row.map((p, pi) => {
              const wind = (stage === 'vegetative' || stage === 'harvest' || stage === 'ripening') ?
                          Math.sin((p.x + slowTick) * 0.02) * (isAutumn ? 0.8 : 0.5) : 0;
              const variation = 0.8 + (((pi * 7 + ri * 13) % 10) / 20);

              // Season-adjusted heights
              const h = stage === 'plowing' ? 0 :
                       stage === 'seedling' ? (isSpring ? 2 : 3) * variation :
                       stage === 'vegetative' ? (isSummer ? 8 : 6) * variation :
                       stage === 'ripening' ? 9 * variation :
                       stage === 'harvest' ? 10 * variation :
                       stage === 'dormant' ? 3 * variation :
                       stage === 'fallow' ? 1 : 2 * variation;

              // Seasonal color variation
              const colorVariation = isAutumn && stage === 'harvest' ?
                                   (pi % 2 === 0 ? '#D2691E' : pi % 3 === 0 ? '#DAA520' : seasonalPrimary) :
                                   (pi % 3 === 0 ? shade(seasonalPrimary, -5) :
                                    pi % 5 === 0 ? shade(seasonalPrimary, 5) : seasonalPrimary);

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

                  {/* Ripening grain heads */}
                  {stage === 'ripening' && (
                    <>
                      <rect x={-2 + wind} y={-h - 1} width={4} height={2} fill={shade(seasonalAccent, -10)} />
                      <rect x={-1 + wind} y={-h - 2} width={2} height={1} fill={seasonalAccent} />
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
    const isSpring = season === 'spring';
    const isSummer = season === 'summer';
    const isAutumn = season === 'fall';
    const isWinter = season === 'winter';

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

  const renderOliveGrove = () => (
    <g>
      {orchardGrid.map((n, i) => {
        const trunk = '#6f4b2e';
        const leafy = stage === 'fallow' ? shade(S.tree, -24) : S.tree;
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

  const renderAppleOrchard = () => {
    const isSpring = season === 'spring';
    const isSummer = season === 'summer';
    const isAutumn = season === 'fall';
    const isWinter = season === 'winter';

    return (
      <g>
        {orchardGrid.map((n, i) => {
          const trunk = '#5d3b24';
          // Seasonal leaf colors
          const leafColor = isWinter ? null : // No leaves in winter
                          isSpring ? '#90EE90' : // Light green new growth
                          isSummer ? shade(S.tree, 0) : // Full green
                          isAutumn ? (i % 3 === 0 ? '#FF8C00' : i % 2 === 0 ? '#FFD700' : '#DC143C') : // Fall colors
                          shade(S.tree, 0);

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
              {stage === 'blossom' && isSpring && (
                <>
                  {/* Blossom clusters */}
                  <rect x={n.x - 5} y={n.y - 14} width={2} height={2} fill="#FFB6C1" />
                  <rect x={n.x - 1} y={n.y - 15} width={3} height={2} fill="#FFC0CB" />
                  <rect x={n.x + 3} y={n.y - 13} width={2} height={2} fill="#FFB6C1" />
                  <rect x={n.x - 3} y={n.y - 11} width={2} height={2} fill="#FFC0CB" />
                  <rect x={n.x + 2} y={n.y - 10} width={2} height={2} fill="#FFB6C1" />
                  {/* Some early leaves */}
                  <rect x={n.x - 4} y={n.y - 12} width={3} height={2} fill="#98FB98" />
                  <rect x={n.x + 1} y={n.y - 11} width={3} height={2} fill="#98FB98" />
                </>
              )}

              {/* Summer/Fall foliage */}
              {leafColor && stage !== 'blossom' && stage !== 'dormant' && (
                <>
                  <rect x={n.x - 6} y={n.y - 15} width={14} height={6} fill={leafColor} />
                  <rect x={n.x - 7} y={n.y - 12} width={16} height={5} fill={shade(leafColor, -10)} />
                  <rect x={n.x - 5} y={n.y - 9} width={12} height={3} fill={shade(leafColor, -15)} />
                </>
              )}

              {/* Fruits */}
              {stage === 'fruiting' && isSummer && (
                <>
                  {/* Green developing apples */}
                  <rect x={n.x - 3} y={n.y - 10} width={2} height={2} fill="#90EE90" />
                  <rect x={n.x + 2} y={n.y - 9} width={2} height={2} fill="#90EE90" />
                </>
              )}
              {stage === 'harvest' && isAutumn && (
                <>
                  {/* Ripe red apples */}
                  <rect x={n.x - 3} y={n.y - 10} width={2} height={2} fill="#DC143C" />
                  <rect x={n.x + 2} y={n.y - 9} width={2} height={2} fill="#B22222" />
                  <rect x={n.x} y={n.y - 11} width={2} height={2} fill="#DC143C" />
                  <rect x={n.x - 5} y={n.y - 8} width={2} height={2} fill="#B22222" />
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

  const renderTallRowCrops = (stem = '#90EE90', tip = '#3CB371', cropName = 'corn') => {
    const isCorn = cropName.toLowerCase().includes('corn') || cropName.toLowerCase().includes('maize');
    const isSugarCane = cropName.toLowerCase().includes('sugar') || cropName.toLowerCase().includes('cane');

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
    const isSpring = season === 'spring';
    const isSummer = season === 'summer';
    const isAutumn = season === 'fall';
    const isWinter = season === 'winter';

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

  const renderCropSwitch = () => {
    const c = cropType.toLowerCase();

    // Enhanced crop-specific rendering with distinct visuals
    if (c.includes('vineyard') || c.includes('grape')) return renderVineyard();
    if (c.includes('olive')) return renderOliveGrove();
    if (c.includes('apple') || c.includes('orchard')) return renderAppleOrchard();
    if (c.includes('cotton')) return renderCottonField();
    if (c.includes('rice') || c.includes('paddy')) return renderRicePaddies();

    // Tall crops with specific colors and features
    if (c.includes('sugar') || c.includes('cane')) return renderTallRowCrops('#7FBF7F', '#5F9F5F', c);
    if (c.includes('corn') || c.includes('maize')) return renderTallRowCrops('#6B8E23', '#8FBC8F', c);

    // Grains with distinct golden/tan colors
    if (c.includes('wheat')) return renderGenericField('#DAA520', '#F5DEB3'); // Golden wheat
    if (c.includes('barley')) return renderGenericField('#D2691E', '#DEB887'); // Tan barley
    if (c.includes('rye')) return renderGenericField('#8B7355', '#A0826D'); // Darker rye
    if (c.includes('oat')) return renderGenericField('#F5E6D3', '#E5D4B1'); // Light oats
    if (c.includes('sorghum')) return renderGenericField('#8B4513', '#A0522D'); // Reddish
    if (c.includes('millet')) return renderGenericField('#FFD700', '#FFC125'); // Yellow

    // Vegetables and other crops
    if (c.includes('potato')) return renderGenericField('#8B7D6B', '#CDB79E');
    if (c.includes('carrot')) return renderGenericField('#228B22', '#FF8C00');
    if (c.includes('cabbage')) return renderGenericField('#3CB371', '#90EE90');
    if (c.includes('bean')) return renderTallRowCrops('#556B2F', '#6B8E23', c);
    if (c.includes('pea')) return renderTallRowCrops('#8FBC8F', '#98FB98', c);
    if (c.includes('tobacco')) return renderTallRowCrops('#8B7D6B', '#705848', c);
    if (c.includes('hemp')) return renderTallRowCrops('#556B2F', '#8FBC8F', c);
    if (c.includes('flax')) return renderGenericField('#87CEEB', '#B0E0E6');

    // Default green field
    return renderGenericField(shade(S.grass, 8), shade(S.grass, -12));
  };

  /* ---------------------------- Farm Animals ------------------------------ */

  const animals = useMemo(() => {
    const rng = new RNG(seed + 555);
    const animalList = [];

    // Chickens in the yard area (not on roof!)
    for (let i = 0; i < 3; i++) {
      animalList.push({
        type: 'chicken',
        x: farmsteadRect.x + farmsteadRect.w + 10 + rng.int(-5, 20), // Move to yard side
        y: GROUND_Y - 2,
        phase: rng.range(0, Math.PI * 2)
      });
    }

    // Cat on porch area (not floating)
    animalList.push({
      type: 'cat',
      x: farmsteadRect.x + 40,
      y: GROUND_Y - 2, // Put on ground level
      phase: 0
    });

    // Dog near door
    animalList.push({
      type: 'dog',
      x: farmsteadRect.x + 60,
      y: GROUND_Y - 3,
      phase: 0
    });

    return animalList;
  }, [seed, farmsteadRect, GROUND_Y]);

  const drawAnimal = (animal: any) => {
    const wobble = Math.sin(slowTick * 0.05 + animal.phase);

    if (animal.type === 'chicken') {
      const peckCycle = Math.sin(slowTick * 0.08 + animal.phase);
      const pecking = peckCycle > 0.6;
      const bobbing = Math.sin(slowTick * 0.12 + animal.phase) * 0.5;
      return (
        <g key={`${animal.type}-${animal.x}`} transform={`translate(${animal.x}, ${animal.y + bobbing})`}>
          <ellipse cx={0} cy={1} rx={2} ry={1} fill="#000" opacity={0.2} />
          {/* Body */}
          <ellipse cx={0} cy={pecking ? 0 : -1} rx={2} ry={2} fill="#FFFFFF" />
          {/* Head */}
          <circle cx={1} cy={pecking ? -1 : -2} r={1} fill="#FFFFFF" />
          {/* Beak */}
          <rect x={2} y={pecking ? -1 : -2} width={1} height={1} fill="#FF4500" />
          {/* Wing detail */}
          <ellipse cx={0} cy={pecking ? 0 : -1} rx={1} ry={1} fill="#F5F5F5" />
          {/* Pecking at ground food */}
          {pecking && <rect x={0} y={1} width={1} height={1} fill="#DAA520" />}
        </g>
      );
    }

    if (animal.type === 'cat') {
      const sleeping = timeOfDay === 'Day' || timeOfDay === 'Midday';
      return (
        <g key={`${animal.type}-${animal.x}`} transform={`translate(${animal.x}, ${animal.y})`}>
          <ellipse cx={0} cy={2} rx={3} ry={1} fill="#000" opacity={0.15} />
          <rect x={-2} y={0} width={4} height={2} fill="#4A4A4A" />
          {sleeping ? (
            <rect x={-3} y={0} width={1} height={1} fill="#4A4A4A" /> // Curled tail
          ) : (
            <>
              <rect x={2} y={-1} width={2} height={1} fill="#4A4A4A" /> // Tail up
              <rect x={-2} y={-1} width={2} height={1} fill="#FFD700" opacity={0.5} /> // Eyes
            </>
          )}
        </g>
      );
    }

    if (animal.type === 'dog') {
      const tailWag = Math.sin(slowTick * 0.25) * 1.2;
      const breathing = Math.sin(slowTick * 0.15) * 0.2;
      return (
        <g key={`${animal.type}-${animal.x}`} transform={`translate(${animal.x}, ${animal.y})`}>
          <ellipse cx={0} cy={2} rx={4} ry={1.5} fill="#000" opacity={0.15} />
          {/* Body */}
          <ellipse cx={0} cy={-1 + breathing} rx={3} ry={2} fill="#8B4513" />
          {/* Head */}
          <ellipse cx={-2} cy={-1} rx={1.5} ry={1.5} fill="#8B4513" />
          {/* Ears */}
          <ellipse cx={-3} cy={-2} rx={0.5} ry={1} fill="#654321" />
          <ellipse cx={-1} cy={-2} rx={0.5} ry={1} fill="#654321" />
          {/* Nose */}
          <rect x={-4} y={-1} width={1} height={1} fill="#2F2F2F" />
          {/* Wagging tail with arc motion */}
          <path d={`M 2 0 Q ${3 + tailWag} ${-1 + Math.abs(tailWag)} ${2 + tailWag} ${-2}`}
            stroke="#654321" strokeWidth="2" fill="none" />
          {/* Eyes (alert) */}
          <circle cx={-2.5} cy={-1.5} r={0.3} fill="#2F2F2F" />
          <circle cx={-1.5} cy={-1.5} r={0.3} fill="#2F2F2F" />
        </g>
      );
    }
  };

  /* -------------------------- Characters (pixel) -------------------------- */

  const drawCharacter = (c: FarmCharacter) => {
    const body = c.type === 'farmer' ? '#7b4f2a' : (c.type === 'worker' ? '#6f5a3f' : '#8b7356');
    const head = '#f1c7a5';
    // Animate leg position based on movement - subtle walk cycle
    const walkCycle = Math.abs(Math.sin(c.x * 0.08)) > 0.5 ? 0 : 1;
    const isMoving = Math.abs(c.speed) > 0.01;
    const legOffset = isMoving ? walkCycle : 0;

    return (
      <g key={c.id} transform={`translate(${Math.round(c.x)}, ${Math.round(c.y)})`}>
        {/* Shadow directly at feet as ellipse */}
        <ellipse cx={0} cy={0} rx={3} ry={1} fill="#000" opacity={0.22} />
        {/* Animated legs with walk cycle */}
        <rect x={-2} y={-2 - legOffset} width={1} height={3} fill="#3b3b3b" />
        <rect x={1}  y={-2 - (legOffset === 0 ? 1 : 0)} width={1} height={3} fill="#3b3b3b" />
        {/* Body */}
        <rect x={-2} y={-6} width={5} height={5} fill={body} />
        {/* Head */}
        <rect x={-1} y={-8} width={3} height={2} fill={head} />
        {/* Hat for farmer */}
        {c.type === 'farmer' && <rect x={-1} y={-9} width={3} height={1} fill="#5a3b1f" />}
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

    if (season === 'spring') {
      // Floating pollen particles
      for (let i = 0; i < 12; i++) {
        const baseX = (i * 80 + seed * 3) % width;
        const driftX = Math.sin(slowTick * 0.02 + i) * 15;
        const driftY = Math.sin(slowTick * 0.03 + i * 0.7) * 8;
        particles.push({
          x: baseX + driftX,
          y: HORIZON_Y + 20 + (i % 3) * 15 + driftY,
          size: 1.5,
          color: '#FFFFE0',
          opacity: 0.4 + Math.sin(slowTick * 0.08 + i) * 0.15
        });
      }
    } else if (season === 'fall') {
      // Gently falling leaves
      for (let i = 0; i < 6; i++) {
        const leafX = ((i * 120 + slowTick * 0.8) % (width + 40)) - 20;
        const leafY = HORIZON_Y + 10 + (slowTick * 0.6 + i * 20) % 80;
        const colors = ['#CD853F', '#D2691E', '#8B4513', '#A0522D', '#DEB887'];
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
          season === 'spring' ? (
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
  }, [season, slowTick, seed, width, HORIZON_Y]);

  /* ------------------------------ Weather layer --------------------------- */

  // Rain puddles for Mediterranean winters and wet seasons
  const showPuddles = (season === 'winter' && climate === ClimateType.MEDITERRANEAN) ||
                      (wantRain && climate !== ClimateType.ARID);

  const Weather = (
    <g>
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
          case 'rain':   return <line key={p.id} x1={p.x} y1={p.y - 6} x2={p.x - 3} y2={p.y} stroke="#6B9BD1" strokeWidth={1} opacity={0.6} />;
          case 'snow':   return <rect key={p.id} x={p.x} y={p.y} width={1} height={1} fill="#fff" opacity={0.85} />;
          case 'dust':   return <rect key={p.id} x={p.x} y={p.y} width={2} height={1} fill={shade(S.ground, 10)} opacity={0.35} />;
          case 'firefly':{
            const pulse = (Math.sin((slowTick + Number(p.id.slice(1)) * 8) * 0.06) + 1) * 0.3 + 0.2;
            return <rect key={p.id} x={p.x} y={p.y} width={1} height={1} fill="#ffe890" opacity={pulse} />;
          }
        }
      })}
    </g>
  );

  /* -------------------------------- Render -------------------------------- */

  // Calculate zoomed viewBox for center-focused zoom
  const zoomLevel = 1.5;
  const zoomedWidth = width / zoomLevel;
  const zoomedHeight = height / zoomLevel;
  const zoomOffsetX = (width - zoomedWidth) / 2;
  const zoomOffsetY = (height - zoomedHeight) / 3;

  return (
    <svg width={width} height={height} viewBox={`${zoomOffsetX} ${zoomOffsetY} ${zoomedWidth} ${zoomedHeight}`} style={{ imageRendering: 'pixelated' }}>
      {Defs}
      {Sky}
      {BiomeDressing}
      {Ground}

      {/* Footpath patterns */}
      {FootpathPatterns}

      {/* Garden plot */}
      {GardenPlot}

      {/* Farmstead & accessory (defines a real clearing) */}
      {Farmstead}
      {MillOrWell}

      {/* Laundry line */}
      {LaundryLine}

      {/* Crops (static geometry; no flicker) */}
      {renderCropSwitch()}

      {/* Farm animals */}
      {animals.map(drawAnimal)}

      {/* People (ground-clamped) */}
      {characters.map(drawCharacter)}

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
  );
};

export default FarmBanner;

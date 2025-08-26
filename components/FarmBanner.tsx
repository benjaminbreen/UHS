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

type GrowthStage = 'seedling' | 'vegetative' | 'fruiting' | 'harvest' | 'fallow' | 'flooded' | 'blossom';
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
  
  // Default seasonal logic for temperate/cold climates
  if (c.includes('rice')) {
    if (season === 'spring') return 'flooded';
    if (season === 'summer') return 'vegetative';
    if (season === 'fall') return 'harvest';
    return climate === ClimateType.COLD ? 'fallow' : 'flooded';
  }
  if (['vineyard', 'grape'].some(k => c.includes(k))) {
    if (season === 'spring') return 'seedling';
    if (season === 'summer') return 'vegetative';
    if (season === 'fall') return 'fruiting';
    return 'fallow';
  }
  if (['olive'].some(k => c.includes(k))) {
    if (season === 'spring') return 'vegetative';
    if (season === 'summer') return 'fruiting';
    if (season === 'fall') return 'harvest';
    return 'fallow';
  }
  if (['apple', 'orchard', 'pear', 'citrus'].some(k => c.includes(k))) {
    if (season === 'spring') return 'blossom';
    if (season === 'summer') return 'vegetative';
    if (season === 'fall') return 'fruiting';
    return 'fallow';
  }
  if (['cotton'].some(k => c.includes(k))) {
    if (season === 'spring') return 'seedling';
    if (season === 'summer') return 'vegetative';
    if (season === 'fall') return 'fruiting';
    return 'fallow';
  }
  if (['sugar', 'cane', 'corn', 'maize'].some(k => c.includes(k))) {
    if (season === 'spring') return 'seedling';
    if (season === 'summer') return 'vegetative';
    if (season === 'fall') return 'harvest';
    return 'fallow';
  }
  if (['wheat', 'barley', 'rye'].some(k => c.includes(k))) {
    if (season === 'spring') return 'seedling';
    if (season === 'summer') return 'vegetative';
    if (season === 'fall') return 'harvest';
    return 'fallow';
  }
  return season === 'winter' ? 'fallow' : 'vegetative';
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
    const loop = (t: number) => { if (!last) last = t; if (t - last > 14) { setTick(v => (v + 1) % 1_000_000); last = t; } rafRef.current = requestAnimationFrame(loop); };
    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

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
          {Array.from({ length: 70 }).map((_, i) => (
            <rect key={i} x={rng.int(8, width - 48)} y={rng.int(6, HORIZON_Y - 8)} width={1} height={1} fill={i % 7 === 0 ? '#fff' : T.star} />
          ))}
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
      
      {/* Fog band - varies by climate and background */}
      <rect x={0} y={HORIZON_Y + 1} width={width} height={10} 
        fill={backgroundType === 'desert' ? '#d4a574' : 
              backgroundType === 'snow' ? '#e0e4ef' :
              climate === ClimateType.TROPICAL ? '#9fd89f' : '#fff'} 
        opacity={backgroundType === 'forest' ? 0.15 :
                backgroundType === 'mountains' ? 0.1 :
                climate === ClimateType.TROPICAL ? 0.12 : 0.08} />
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

  /* ------------------------------ Farmstead ------------------------------- */

  const Farmstead = (() => {
    const cx = Math.round(width * 0.18);
    const by = GROUND_Y - 18;

    // common drop shadow
    const shadow = (x: number, y: number, w: number, h: number) => (
      <rect x={x + shadowOffset.x} y={y + shadowOffset.y} width={w} height={h} fill="#000" opacity={0.12} />
    );

    switch (variant) {
      case 'medieval_euro':
        return (
          <g>
            {shadow(cx - 50, by, 100, 40)}
            <rect x={cx - 50} y={by} width={100} height={40} fill="#8b5e3b" />
            <polygon points={`${cx - 58},${by} ${cx},${by - 26} ${cx + 58},${by}`} fill="#d7b46b" />
            <rect x={cx - 50} y={by + 12} width={100} height={1} fill="#5b3a24" />
            <rect x={cx - 1}  y={by} width={2} height={40} fill="#5b3a24" />
            <rect x={cx - 10} y={by + 18} width={20} height={20} fill="#2c1b12" />
            <rect x={cx - 34} y={by + 8} width={12} height={8} fill="#6ea7d6" opacity={0.7} />
            <rect x={cx + 22} y={by + 8} width={12} height={8} fill="#6ea7d6" opacity={0.7} />
            {/* hayricks */}
            <rect x={cx + 78} y={by + 16} width={10} height={8} fill="#caa56a" />
            <rect x={cx + 92} y={by + 18} width={10} height={8} fill="#caa56a" />
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
            <rect x={cx - 46} y={by + 8} width={92} height={26} fill="#ead9c5" />
            <rect x={cx - 46} y={by + 6} width={92} height={2} fill="#c8b4a0" />
            <rect x={cx - 12} y={by + 12} width={24} height={18} fill="#a0826d" />
            <rect x={cx - 12} y={by + 12} width={24} height={2} fill="#8b6a55" />
            {/* cistern */}
            <ellipse cx={cx + 86} cy={by + 28} rx={12} ry={6} fill={S.water} />
            {/* palm shade (if not cold) */}
            {climate !== ClimateType.COLD && (
              <g>
                <rect x={cx + 60} y={by - 4} width={2} height={18} fill="#7a5a2a" />
                <rect x={cx + 54} y={by - 6} width={14} height={4} fill={shade(S.grass, 10)} />
              </g>
            )}
          </g>
        );
      case 'east_asian':
        return (
          <g>
            {shadow(cx - 44, by + 6, 88, 28)}
            <rect x={cx - 44} y={by + 6} width={88} height={28} fill="#7b4f2a" />
            <path d={`M ${cx - 52} ${by + 6} Q ${cx} ${by - 12} ${cx + 52} ${by + 6}`} fill="#bf3a3a" />
            <rect x={cx - 8} y={by + 16} width={16} height={16} fill="#2c1b12" />
            {/* drying racks */}
            <rect x={cx + 66} y={by + 14} width={24} height={2} fill="#6a3e1c" />
            <rect x={cx + 66} y={by + 18} width={24} height={2} fill="#6a3e1c" />
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
          <ellipse cx={0 + shadowOffset.x} cy={32 + shadowOffset.y} rx={14} ry={7} fill="#000" opacity={0.12} />
          <ellipse cx={0} cy={32} rx={14} ry={7} fill="#696969" />
          <rect x={-2} y={0} width={4} height={32} fill="#8b4513" />
          <rect x={-10} y={-4} width={20} height={6} fill="#654321" />
        </g>
      )}
    </g>
  );

  /* --------------------------- Crop Renderers ----------------------------- */

  const renderGenericField = (primary: string, accent: string) => (
    <g>
      {furrowRows.map((row, ri) => (
        <g key={ri}>
          {row.map((p, pi) => {
            const wind = (stage === 'vegetative' || stage === 'harvest') ? Math.sin((p.x + tick) * 0.02) * 0.5 : 0;
            const h = stage === 'seedling' ? 4 : stage === 'vegetative' ? 8 : stage === 'harvest' ? 9 : 2;
            const color = stage === 'harvest' ? primary : shade(primary, -12);
            const head  = stage === 'harvest';
            return (
              <g key={pi} transform={`translate(${Math.round(p.x)}, ${Math.round(p.y)})`}>
                <rect x={-1 + wind} y={-h} width={2} height={h} fill={color} />
                {head && <rect x={-1 + wind} y={-h} width={2} height={1} fill={accent} />}
                {stage === 'fallow' && <rect x={-1} y={-2} width={2} height={2} fill={shade(S.ground, -8)} />}
              </g>
            );
          })}
        </g>
      ))}
    </g>
  );

  const renderVineyard = () => {
    const { posts, left, right, rows, startY, spacing } = trellisPosts;
    return (
      <g>
        {/* wires */}
        {Array.from({ length: rows }).map((_, r) => {
          const y = startY + r * spacing;
          return <rect key={r} x={left} y={y - 6} width={right - left} height={1} fill="#4a3a2a" />;
        })}
        {/* posts, beams, foliage */}
        {posts.map((p, i) => {
          const foliage = stage === 'fallow' ? shade(S.tree, -25) : shade(S.grass, 8);
          return (
            <g key={i}>
              <rect x={p.x} y={p.y - 12} width={2} height={12} fill="#6e4c2a" />
              <rect x={p.x - 10} y={p.y - 8} width={22} height={4} fill="#5b3e24" />
              {stage !== 'fallow' && <rect x={p.x - 10} y={p.y - 12} width={22} height={6} fill={foliage} />}
              {stage === 'fruiting' && (
                <>
                  <rect x={p.x - 6} y={p.y - 6} width={2} height={2} fill="#7e3a8a" />
                  <rect x={p.x + 3} y={p.y - 6} width={2} height={2} fill="#7e3a8a" />
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

  const renderAppleOrchard = () => (
    <g>
      {orchardGrid.map((n, i) => {
        const trunk = '#5d3b24';
        const leaf  = stage === 'fallow' ? shade(S.tree, -25) : shade(S.tree, 0);
        return (
          <g key={i}>
            <rect x={n.x} y={n.y - 9} width={2} height={9} fill={trunk} />
            {stage !== 'fallow' && (
              <>
                <rect x={n.x - 5} y={n.y - 14} width={12} height={5} fill={leaf} />
                <rect x={n.x - 6} y={n.y - 11} width={14} height={5} fill={shade(leaf, -8)} />
              </>
            )}
            {stage === 'blossom' && <rect x={n.x - 1} y={n.y - 12} width={2} height={2} fill={S.bloom} />}
            {stage === 'fruiting' && (
              <>
                <rect x={n.x - 2} y={n.y - 10} width={2} height={2} fill="#d33" />
                <rect x={n.x + 3} y={n.y - 9} width={2} height={2} fill="#d33" />
              </>
            )}
          </g>
        );
      })}
    </g>
  );

  const renderTallRowCrops = (stem = '#90EE90', tip = '#3CB371') => (
    <g>
      {furrowRows.map((row, ri) => (
        <g key={ri}>
          {row.map((p, pi) => {
            const sway = stage === 'vegetative' ? Math.sin((p.x + tick) * 0.02) * 0.6 : 0;
            const h = stage === 'seedling' ? 5 : stage === 'vegetative' ? 9 : stage === 'harvest' ? 10 : 2;
            return (
              <g key={pi} transform={`translate(${Math.round(p.x)}, ${Math.round(p.y)})`}>
                <rect x={-1 + sway} y={-h} width={2} height={h} fill={stem} />
                {stage !== 'seedling' && (
                  <>
                    <rect x={-3 + sway} y={-6} width={3} height={2} fill={tip} />
                    <rect x={1 + sway} y={-6} width={3} height={2} fill={tip} />
                  </>
                )}
                {stage === 'harvest' && <rect x={-1 + sway} y={-h} width={2} height={1} fill={shade(tip, -20)} />}
              </g>
            );
          })}
        </g>
      ))}
    </g>
  );

  const renderCottonField = () => (
    <g>
      {orchardGrid.map((n, i) => (
        <g key={i}>
          <rect x={n.x} y={n.y - 4} width={2} height={4} fill={S.grass} />
          {stage !== 'fallow' && (
            <>
              <rect x={n.x - 2} y={n.y - 6} width={2} height={2} fill="#FFFAFA" />
              <rect x={n.x + 1} y={n.y - 6} width={2} height={2} fill="#F0F8FF" />
            </>
          )}
        </g>
      ))}
    </g>
  );

  const renderRicePaddies = () => (
    <g>
      {paddyCells.map((cell, i) => {
        const water = stage === 'flooded' || (season !== 'winter' && climate !== ClimateType.COLD);
        const waterColor = mix(S.water, '#6fbfff', 0.25);
        const shimmer = 0.25 + (1 + Math.sin((tick + i * 20) * 0.04)) * 0.06;
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
    const c = cropType;
    switch (c) {
      case 'Vineyard': return renderVineyard();
      case 'Olive Grove': return renderOliveGrove();
      case 'Wheat':
      case 'Barley':
      case 'Rye': return renderGenericField('#DAA520', '#B8860B');
      case 'Sugar Cane':
      case 'Corn': return renderTallRowCrops('#90EE90', '#3CB371');
      case 'Cotton': return renderCottonField();
      default:
        if (/apple/i.test(c) || /orchard/i.test(c)) return renderAppleOrchard();
        if (/rice/i.test(c)) return renderRicePaddies();
        // fallback green field tuned to climate
        return renderGenericField(shade(S.grass, 8), shade(S.grass, -12));
    }
  };

  /* -------------------------- Characters (pixel) -------------------------- */

  const drawCharacter = (c: FarmCharacter) => {
    const body = c.type === 'farmer' ? '#7b4f2a' : (c.type === 'worker' ? '#6f5a3f' : '#8b7356');
    const head = '#f1c7a5';
    return (
      <g key={c.id} transform={`translate(${Math.round(c.x)}, ${Math.round(c.y)})`}>
        <rect x={-2 + shadowOffset.x} y={1 + shadowOffset.y} width={5} height={1} fill="#000" opacity={0.18} />
        <rect x={-2} y={-1} width={1} height={2} fill="#3b3b3b" />
        <rect x={1}  y={-1} width={1} height={2} fill="#3b3b3b" />
        <rect x={-2} y={-6} width={5} height={5} fill={body} />
        <rect x={-1} y={-8} width={3} height={2} fill={head} />
      </g>
    );
  };

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
                fill={S.water} opacity={0.5 + Math.sin(tick * 0.02) * 0.1} />
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
            const pulse = (Math.sin((tick + Number(p.id.slice(1)) * 8) * 0.06) + 1) * 0.3 + 0.2;
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

      {/* Farmstead & accessory (defines a real clearing) */}
      {Farmstead}
      {MillOrWell}

      {/* Crops (static geometry; no flicker) */}
      {renderCropSwitch()}

      {/* People (ground-clamped) */}
      {characters.map(drawCharacter)}

      {/* Optional banner label near lane (subtle, non-intrusive) */}
      {farmName && (
        <g opacity={0.5}>
          <rect x={pathRect.x + 8} y={GROUND_Y - 16} width={farmName.length * 6 + 8} height={10} fill="#000" opacity={0.18} />
        </g>
      )}

      {/* Weather overlay */}
      {Weather}

      {/* Cinematic vignette */}
      <rect x={0} y={0} width={width} height={height} fill={`url(#vig-${seed})`} />
    </svg>
  );
};

export default FarmBanner;

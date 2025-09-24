/**
 * components/CityBanner.tsx
 * Culture+Era-aware, weather/time integrated pixel-art city banner
 * - Static RNG via useMemo (stable per seed + key props)
 * - Accurate archetypes per CulturalZone × HistoricalEra
 * - Time-of-day + weather affect sky, lights, and FX
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  HistoricalEra,
  CulturalZone,
  ClimateType,
  Season,
  MapData,
  TimeOfDay,
} from '../types';
import { WeatherState } from '../services/weatherService';

/* ---------------------------------- RNG ---------------------------------- */

class SeededRandom {
  private seed: number;
  constructor(seed: number) {
    this.seed = seed || 1;
  }
  next() {
    // LCG (good enough for visuals)
    this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
    return (this.seed >>> 0) / 4294967296;
  }
  range(min: number, max: number) {
    return min + this.next() * (max - min);
  }
  int(min: number, max: number) {
    return Math.floor(this.range(min, max + 1));
  }
  pick<T>(arr: readonly T[]): T {
    return arr[this.int(0, arr.length - 1)];
  }
}

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const blend = (hex1: string, hex2: string, t: number) => {
  const parse = (h: string) => {
    const s = h.replace('#', '');
    const n = s.length === 3 ? parseInt(s.split('').map(c => c + c).join(''), 16) : parseInt(s, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  };
  const a = parse(hex1), b = parse(hex2);
  const r = Math.round(lerp(a.r, b.r, t));
  const g = Math.round(lerp(a.g, b.g, t));
  const c = Math.round(lerp(a.b, b.b, t));
  return `rgb(${r}, ${g}, ${c})`;
};

/* ------------------------------ Sky palettes ------------------------------ */
/** top → mid → bottom (warm near horizon) */
const SKY = {
  DAWN: ['#0a0e27', '#4B5C8A', '#FFB6C1'],
  DAY: ['#1a3a7a', '#4A90E2', '#E6F3FF'],
  DUSK: ['#16213e', '#2E3A5F', '#FF8C69'],
  NIGHT: ['#000814', '#001d3d', '#003566'],
} as const;

function timeKey(t: TimeOfDay | undefined) {
  switch (t) {
    case 'Night': return 'NIGHT';
    case 'Dusk':  return 'DUSK';
    case 'Dawn':  return 'DAWN';
    default:      return 'DAY';
  }
}

/* ----------------------------- Ground palettes ---------------------------- */

const CLIMATE_PALETTE: Record<ClimateType, { ground: string; veg: string; accent: string; dry?: string }> = {
  [ClimateType.COLD]: { ground: '#8BA3B1', veg: '#456B7A', accent: '#5D8193' },
  [ClimateType.TEMPERATE]: { ground: '#86EFAC', veg: '#22C55E', accent: '#166534', dry: '#b0c79f' },
  [ClimateType.MEDITERRANEAN]: { ground: '#b7c08f', veg: '#5a8f5f', accent: '#8a6e3d', dry: '#d6c79c' },
  [ClimateType.ARID]: { ground: '#D8C199', veg: '#A98C66', accent: '#C08A4B', dry: '#E2CFAC' },
  [ClimateType.SEMITROPICAL]: { ground: '#7ED6A4', veg: '#2FAE66', accent: '#0E7A4B', dry: '#a9e3be' },
  [ClimateType.TROPICAL]: { ground: '#6EE7B7', veg: '#059669', accent: '#047857', dry: '#98f0cf' },
};

/* -------------------------- Culture style accents ------------------------- */

const CULTURE_ACCENT: Record<CulturalZone, { roof: string; trim: string; banner: string }> = {
  EUROPEAN: { roof: '#8B0000', trim: '#6b4a2f', banner: '#B91C1C' },
  EAST_ASIAN: { roof: '#8B0000', trim: '#FFD700', banner: '#E11D48' },
  SOUTH_ASIAN: { roof: '#C2410C', trim: '#FFD700', banner: '#D97706' },
  MENA: { roof: '#C4A484', trim: '#4169E1', banner: '#1D4ED8' },
  SUB_SAHARAN_AFRICAN: { roof: '#8B5A2B', trim: '#F59E0B', banner: '#EA580C' },
  NORTH_AMERICAN_PRE_COLUMBIAN: { roof: '#8B5A2B', trim: '#A9753A', banner: '#2563EB' },
  NORTH_AMERICAN_COLONIAL: { roof: '#6B7280', trim: '#9CA3AF', banner: '#2563EB' },
  SOUTH_AMERICAN: { roof: '#8B4513', trim: '#32CD32', banner: '#10B981' },
  OCEANIA: { roof: '#8B4513', trim: '#20B2AA', banner: '#06B6D4' },
};

/* ----------------------- Era buckets & archetype map ---------------------- */

type EraBucket = 'ancient' | 'medieval' | 'early_modern' | 'industrial' | 'modern';
const eraBucket = (era: HistoricalEra): EraBucket => {
  switch (era) {
    case HistoricalEra.INDUSTRIAL_ERA: return 'industrial';
    case HistoricalEra.MODERN_ERA: return 'modern';
    case HistoricalEra.RENAISSANCE_EARLY_MODERN: return 'early_modern';
    case HistoricalEra.MEDIEVAL: return 'medieval';
    case HistoricalEra.ANTIQUITY:
    case HistoricalEra.PREHISTORY:
    default: return 'ancient';
  }
};

type Archetype =
  | 'mud_hut'              // round/rectangular mud with thatch
  | 'adobe_compound'       // flat-roof adobe clusters
  | 'thatch_longhouse'     // timber/thatch long house
  | 'pueblo_terrace'       // terraced adobe/pueblo
  | 'timber_house'         // half-timber
  | 'stone_gable'          // stone with gable roof
  | 'tile_rowhouse'        // tiled roof rowhouses
  | 'dome_sanctum'         // domed shrine/masjid style
  | 'pagoda_roof'          // east asian curved roof
  | 'stilt_house'          // stilted coastal/tropical
  | 'warehouse'            // early-modern/industrial store
  | 'factory_stack'        // industrial smokestack
  | 'row_tenement'         // brick tenement
  | 'apartment_block'      // modern mid-rise
  | 'office_tower';        // modern high-rise

const RULES: Record<EraBucket, Partial<Record<CulturalZone, readonly Archetype[]>>> = {
  ancient: {
    SUB_SAHARAN_AFRICAN: ['mud_hut', 'adobe_compound', 'thatch_longhouse'],
    MENA: ['adobe_compound', 'dome_sanctum', 'stone_gable'],
    EAST_ASIAN: ['pagoda_roof', 'timber_house'],
    SOUTH_ASIAN: ['dome_sanctum', 'tile_rowhouse', 'adobe_compound'],
    EUROPEAN: ['stone_gable', 'timber_house'],
    NORTH_AMERICAN_PRE_COLUMBIAN: ['thatch_longhouse', 'pueblo_terrace', 'stilt_house'],
    SOUTH_AMERICAN: ['adobe_compound', 'stilt_house', 'pueblo_terrace'],
    OCEANIA: ['stilt_house', 'thatch_longhouse'],
    NORTH_AMERICAN_COLONIAL: ['timber_house', 'stone_gable'], // rare case (if misaligned time slice)
  },
  medieval: {
    SUB_SAHARAN_AFRICAN: ['mud_hut', 'adobe_compound', 'thatch_longhouse'],
    MENA: ['adobe_compound', 'dome_sanctum', 'tile_rowhouse'],
    EAST_ASIAN: ['pagoda_roof', 'timber_house', 'tile_rowhouse'],
    SOUTH_ASIAN: ['dome_sanctum', 'tile_rowhouse'],
    EUROPEAN: ['stone_gable', 'timber_house', 'tile_rowhouse'],
    NORTH_AMERICAN_PRE_COLUMBIAN: ['thatch_longhouse', 'pueblo_terrace', 'stilt_house'],
    SOUTH_AMERICAN: ['adobe_compound', 'stilt_house', 'pueblo_terrace'],
    OCEANIA: ['stilt_house', 'thatch_longhouse'],
    NORTH_AMERICAN_COLONIAL: ['timber_house', 'stone_gable'], // again, safeguard
  },
  early_modern: {
    SUB_SAHARAN_AFRICAN: ['mud_hut', 'adobe_compound'],
    MENA: ['tile_rowhouse', 'dome_sanctum', 'warehouse'],
    EAST_ASIAN: ['tile_rowhouse', 'pagoda_roof', 'warehouse'],
    SOUTH_ASIAN: ['tile_rowhouse', 'dome_sanctum'],
    EUROPEAN: ['stone_gable', 'tile_rowhouse', 'warehouse'],
    NORTH_AMERICAN_PRE_COLUMBIAN: ['pueblo_terrace', 'thatch_longhouse'],
    NORTH_AMERICAN_COLONIAL: ['timber_house', 'tile_rowhouse', 'warehouse'],
    SOUTH_AMERICAN: ['adobe_compound', 'tile_rowhouse'],
    OCEANIA: ['stilt_house', 'timber_house'],
  },
  industrial: {
    SUB_SAHARAN_AFRICAN: ['adobe_compound', 'tile_rowhouse'],
    MENA: ['tile_rowhouse', 'warehouse', 'factory_stack'],
    EAST_ASIAN: ['tile_rowhouse', 'warehouse', 'factory_stack'],
    SOUTH_ASIAN: ['tile_rowhouse', 'warehouse', 'factory_stack'],
    EUROPEAN: ['tile_rowhouse', 'row_tenement', 'factory_stack'],
    NORTH_AMERICAN_PRE_COLUMBIAN: ['pueblo_terrace'], // conservative
    NORTH_AMERICAN_COLONIAL: ['row_tenement', 'warehouse', 'factory_stack'],
    SOUTH_AMERICAN: ['tile_rowhouse', 'warehouse'],
    OCEANIA: ['tile_rowhouse', 'warehouse'],
  },
  modern: {
    SUB_SAHARAN_AFRICAN: ['tile_rowhouse', 'apartment_block'],
    MENA: ['apartment_block', 'row_tenement'],
    EAST_ASIAN: ['apartment_block', 'office_tower'],
    SOUTH_ASIAN: ['apartment_block', 'row_tenement'],
    EUROPEAN: ['apartment_block', 'office_tower'],
    NORTH_AMERICAN_PRE_COLUMBIAN: ['pueblo_terrace'], // avoid towers
    NORTH_AMERICAN_COLONIAL: ['apartment_block', 'office_tower'],
    SOUTH_AMERICAN: ['apartment_block', 'row_tenement'],
    OCEANIA: ['apartment_block'],
  },
};

/* --------------------------------- Props ---------------------------------- */

export type Condition = 'humble' | 'prosperous';
export type ElevationLevel = 'low' | 'normal' | 'high';
export type CitySize = 'smaller_city' | 'big_city';

interface CityBannerProps {
  era: HistoricalEra;
  culturalZone: CulturalZone;
  condition: Condition;
  climate: ClimateType;
  season: Season;
  nextToWater?: boolean;
  harbor?: boolean;
  elevationLevel?: ElevationLevel;
  size?: CitySize;
  timeOfDay?: TimeOfDay;
  aiGeneratedImageUrl?: string; // Optional AI-generated city image
  seed: number;
  width?: number;
  height?: number;
  mapData?: MapData;
  weather?: WeatherState | null;
  npcs?: any[]; // NPC entities from settlement
  selectedNpcId?: string; // Currently selected/highlighted NPC
  onNpcClick?: (npcId: string) => void; // Callback when NPC clicked in banner
}

/* -------------------------------- Component -------------------------------- */

const CityBanner: React.FC<CityBannerProps> = ({
  era,
  culturalZone,
  condition,
  climate,
  season,
  nextToWater,
  harbor,
  elevationLevel = 'normal',
  size = 'smaller_city',
  timeOfDay = 'Midday' as TimeOfDay,
  aiGeneratedImageUrl,
  seed,
  width = 900,
  height = 220,
  mapData,
  weather,
  npcs = [],
  selectedNpcId,
  onNpcClick,
}) => {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setFrame(f => f + 1), 60);
    return () => clearInterval(id);
  }, []);

  /* ---------------------------- Derived palettes --------------------------- */

  const sky = useMemo(() => {
    const k = timeKey(timeOfDay);
    let [top, mid, bottom] = SKY[k as keyof typeof SKY];
    const cc = clamp(weather?.cloudCover ?? 0, 0, 1);
    // Slight overcast tint
    if (cc > 0.05) {
      const gray = '#6e7f94';
      top = blend(top, gray, cc * 0.35);
      mid = blend(mid, gray, cc * 0.25);
      bottom = blend(bottom, gray, cc * 0.18);
    }
    if (weather?.precipitation && weather.precipitation !== 'none') {
      top = blend(top, '#1f2937', 0.2);
      mid = blend(mid, '#1f2937', 0.12);
    }
    return { top, mid, bottom, isNight: k === 'NIGHT' };
  }, [timeOfDay, weather]);

  const ground = useMemo(() => {
    const base = CLIMATE_PALETTE[climate] || CLIMATE_PALETTE[ClimateType.TEMPERATE];
    let g = base.ground, v = base.veg;
    if (season === 'fall') {
      v = blend(v, '#b45309', 0.35);
      g = blend(g, '#d6b37e', 0.15);
    }
    if (season === 'winter') {
      g = blend(g, '#dfe7ef', 0.5);
      v = blend(v, '#9fb4be', 0.4);
    }
    if (climate === ClimateType.ARID || weather?.special === 'heatwave') g = base.dry || g;
    return { ground: g, veg: v, accent: base.accent };
  }, [climate, season, weather]);

  const culture = CULTURE_ACCENT[culturalZone];

  const nightiness = useMemo(() => {
    switch (timeOfDay) {
      case 'Night': return 1;
      case 'Dusk': return 0.75;
      case 'Dawn': return 0.45;
      default: return 0.12;
    }
  }, [timeOfDay]);

  const lightIntensity = clamp(
    nightiness *
      (weather?.precipitation && weather.precipitation !== 'none' ? 0.85 : 1) *
      (weather?.special === 'fog' || weather?.special === 'mist' ? 0.85 : 1),
    0, 1
  );

  /* --------------------------- Stable layout (RNG) ------------------------- */

  const layout = useMemo(() => {
    const rng = new SeededRandom(seed);
    const baseY = height * 0.65;

    // Stars
    const skyKey = timeKey(timeOfDay);
    const nightFactor = skyKey === 'NIGHT' ? 1 : skyKey === 'DUSK' ? 0.35 : skyKey === 'DAWN' ? 0.2 : 0;
    const cc = clamp(weather?.cloudCover ?? 0, 0, 1);
    const starOpacity = clamp(nightFactor * (1 - cc) * 0.9, 0, 1);
    const starCount = Math.floor(lerp(6, 22, starOpacity));
    const stars = Array.from({ length: starCount }, () => ({
      x: rng.range(10, width - 10),
      y: rng.range(8, height * 0.42),
      r: rng.range(0.8, 1.7),
      phase: rng.range(0, Math.PI * 2),
    }));

    // Clouds
    const cloudCount = Math.max(1, Math.round(lerp(1, 6, cc)) + (skyKey === 'DAY' ? 1 : 0));
    const clouds = Array.from({ length: cloudCount }, () => ({
      x0: rng.range(-120, width - 40),
      y: 18 + rng.range(-6, 12),
      scale: lerp(0.7, 1.22, rng.range(0, 1)),
      speed: lerp(0.08, 0.35, rng.range(0, 1)),
    }));

    // Mountains
    const mountainSeeds = [rng.int(0, 9999), rng.int(0, 9999), rng.int(0, 9999)];

    // Buildings
    const density = (size === 'big_city' ? 1 : 0.7) * (condition === 'prosperous' ? 1.1 : 0.9);
    const total = Math.round((size === 'big_city' ? 11 : 7) * density);
    const foreground = Math.floor(total / 2);

    const bucket = eraBucket(era);
    const allowed = (RULES[bucket][culturalZone] ?? ['tile_rowhouse']) as readonly Archetype[];

    // Historically accurate building dimensions
    const getHistoricalDimensions = (type: Archetype, isBackground: boolean) => {
      const scale = isBackground ? 0.8 : 1;

      // Most traditional buildings were single-story or low
      switch (type) {
        case 'mud_hut':
          return {
            w: (20 + rng.range(0, 10)) * scale,
            h: (18 + rng.range(0, 8)) * scale
          };
        case 'adobe_compound':
          return {
            w: (24 + rng.range(0, 12)) * scale,
            h: (16 + rng.range(0, 6)) * scale
          };
        case 'thatch_longhouse':
          return {
            w: (32 + rng.range(0, 16)) * scale,
            h: (20 + rng.range(0, 8)) * scale
          };
        case 'pueblo_terrace':
          return {
            w: (28 + rng.range(0, 14)) * scale,
            h: (22 + rng.range(0, 10)) * scale
          };
        case 'stilt_house':
          return {
            w: (22 + rng.range(0, 8)) * scale,
            h: (24 + rng.range(0, 8)) * scale
          };
        case 'dome_sanctum':
          return {
            w: (26 + rng.range(0, 10)) * scale,
            h: (20 + rng.range(0, 8)) * scale
          };
        case 'pagoda_roof':
          return {
            w: (24 + rng.range(0, 12)) * scale,
            h: (26 + rng.range(0, 12)) * scale
          };
        case 'timber_house':
        case 'stone_gable':
          return {
            w: (26 + rng.range(0, 14)) * scale,
            h: (28 + rng.range(0, 12)) * scale
          };
        case 'tile_rowhouse':
          return {
            w: (24 + rng.range(0, 12)) * scale,
            h: (32 + rng.range(0, 16)) * scale
          };
        case 'warehouse':
          return {
            w: (36 + rng.range(0, 18)) * scale,
            h: (28 + rng.range(0, 12)) * scale
          };
        case 'factory_stack':
          return {
            w: (32 + rng.range(0, 16)) * scale,
            h: (38 + rng.range(0, 20)) * scale
          };
        case 'row_tenement':
          return {
            w: (28 + rng.range(0, 14)) * scale,
            h: (42 + rng.range(0, 18)) * scale
          };
        case 'apartment_block':
          return {
            w: (32 + rng.range(0, 16)) * scale,
            h: (48 + rng.range(0, 24)) * scale
          };
        case 'office_tower':
          return {
            w: (28 + rng.range(0, 12)) * scale,
            h: (60 + rng.range(0, 30)) * scale
          };
        default:
          return {
            w: (26 + rng.range(0, 18)) * scale,
            h: (30 + rng.range(0, 26)) * scale
          };
      }
    };

    const bg = Array.from({ length: total }, (_, i) => {
      const x = (width / (total + 1)) * (i + 1) + rng.range(-15, 15);
      const type = rng.pick(allowed);
      const { w: bw, h: bh } = getHistoricalDimensions(type, true);
      return { x, bw, bh, y: baseY, type };
    });

    const fg = Array.from({ length: foreground }, (_, i) => {
      const x = (width / (foreground + 1)) * (i + 1);
      const type = rng.pick(allowed);
      const { w: bw, h: bh } = getHistoricalDimensions(type, false);
      const hasChimney = (bucket === 'industrial' || bucket === 'modern') && ['row_tenement', 'apartment_block', 'tile_rowhouse', 'warehouse'].includes(type) && rng.next() > 0.5;
      return { x, bw, bh, y: baseY, type, hasChimney };
    });

    // NPCs or generic people
    const maxNpcs = 6;
    const npcCount = Math.min(maxNpcs, npcs.length);
    const genericCount = Math.max(0, Math.floor(lerp(3, 8, density)) - npcCount);

    // Use actual NPCs first (up to 6)
    const npcPeople = npcs.slice(0, maxNpcs).map((npc, i) => ({
      id: npc.id || `npc-${i}`,
      name: npc.name || 'Unnamed',
      profession: npc.profession || 'Resident',
      culturalBackground: npc.culturalBackground,
      baseX: ((width / (maxNpcs + 1)) * (i + 1)) % width,
      dir: rng.next() > 0.5 ? 1 : -1,
      phase: rng.range(0, 1000),
      tint: rng.range(0, 1),
      isNpc: true,
    }));

    // Add generic people to fill scene
    const genericPeople = Array.from({ length: genericCount }, (_, i) => ({
      id: `generic-${i}`,
      baseX: ((width / (genericCount + 1)) * (i + 1)) % width,
      dir: rng.next() > 0.5 ? 1 : -1,
      phase: rng.range(0, 1000),
      tint: rng.range(0, 1),
      isNpc: false,
    }));

    const people = [...npcPeople, ...genericPeople];

    // Lamps
    const lampCount = Math.floor(lerp(4, 8, density));
    const lamps = Array.from({ length: lampCount }, (_, i) => ({
      x: (width / (lampCount + 1)) * (i + 1) + rng.range(-8, 8),
      y: baseY + 6,
    }));

    // Boat (if harbor/water)
    const boat = { x: width * 0.25 + 40 + rng.range(-4, 4), wobble: rng.range(0, Math.PI * 2) };

    return { baseY, stars, clouds, mountainSeeds, bg, fg, people, lamps, boat };
  }, [seed, width, height, timeOfDay, weather?.cloudCover, era, culturalZone, size, condition, npcs]);

  /* -------------------------------- Renderers ------------------------------ */

  const makeId = (s: string) => `${s}-${seed}`;

  const renderSky = () => (
    <g>
      <defs>
        <linearGradient id={makeId('sky')} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={sky.top} />
          <stop offset="60%" stopColor={sky.mid} />
          <stop offset="100%" stopColor={sky.bottom} />
        </linearGradient>
        <radialGradient id={makeId('horizon')} cx="50%" cy="100%" r="65%">
          <stop offset="0%" stopColor={blend(sky.bottom, '#ffd9a8', 0.25)} stopOpacity="0.6" />
          <stop offset="60%" stopOpacity="0" />
        </radialGradient>
        <filter id={makeId('star-blur')}><feGaussianBlur stdDeviation="0.35" /></filter>
      </defs>

      <rect x="0" y="0" width={width} height={height * 0.65} fill={`url(#${makeId('sky')})`} />
      {/* sun/moon */}
      {sky.isNight ? (
        <g>
          <circle cx={width - 75} cy={26} r={12} fill="#eef2ff" />
          <circle cx={width - 72} cy={23} r="2" fill={sky.top} opacity="0.5" />
        </g>
      ) : (
        <circle cx={width - 75} cy={26} r={15} fill="#fde047" />
      )}

      {/* stars (twinkle; positions are static) */}
      {layout.stars.map((s, i) => (
        <circle
          key={i}
          cx={s.x}
          cy={s.y}
          r={s.r}
          fill="#fff"
          opacity={clamp(0.25 + 0.75 * (0.5 + 0.5 * Math.sin(s.phase + frame * 0.05)), 0, 1)}
          filter={`url(#${makeId('star-blur')})`}
        />
      ))}

      {/* clouds */}
      {layout.clouds.map((c, i) => {
        const x = ((c.x0 + frame * c.speed + width + 240) % (width + 240)) - 120;
        const o = lerp(0.25, 0.75, clamp(1 - (weather?.precipitation ? 0.5 : 0) - (weather?.special === 'fog' ? 0.4 : 0), 0, 1));
        return (
          <g key={i} transform={`translate(${x},${c.y}) scale(${c.scale})`} opacity={o}>
            <rect x={0} y={0} width="28" height="12" rx="4" fill="#eef2f7" />
            <rect x={10} y={-3} width="34" height="12" rx="5" fill="#eef2f7" />
            <rect x={8} y={6} width="22" height="8" rx="4" fill="#eef2f7" />
          </g>
        );
      })}

      {/* horizon glow */}
      <rect x="0" y="0" width={width} height={height * 0.65} fill={`url(#${makeId('horizon')})`} opacity={timeOfDay === 'Midday' || timeOfDay === 'Morning' || timeOfDay === 'Afternoon' ? 0.15 : 0.55} />
    </g>
  );

  const renderMountains = () => {
    const baseY = layout.baseY;
    const elev = elevationLevel === 'high' ? 1.2 : elevationLevel === 'low' ? 0.7 : 1;
    const layers = [
      { color: blend(sky.top, '#4a5568', 0.25), o: 0.25, h: 44 * elev, seed: layout.mountainSeeds[0] },
      { color: blend(sky.top, '#2d3748', 0.35), o: 0.35, h: 36 * elev, seed: layout.mountainSeeds[1] },
      { color: blend(sky.top, '#1f2937', 0.45), o: 0.5,  h: 28 * elev, seed: layout.mountainSeeds[2] },
    ];
    return (
      <g>
        {layers.map((L, li) => {
          const step = 40;
          const rng = new SeededRandom(L.seed);
          const pts: string[] = [];
          for (let x = -20; x <= width + 20; x += step) {
            const y = baseY - L.h + Math.sin((x + li * 13) * 0.04) * 6 + rng.range(-3, 3);
            pts.push(`${x},${y}`);
          }
          const poly = `${-20},${baseY} ${pts.join(' ')} ${width + 20},${baseY}`;
          return <polygon key={li} points={poly} fill={L.color} opacity={L.o} />;
        })}
      </g>
    );
  };

  /* ----------------------------- Buildings ----------------------------- */

  // A tiny rim/glint toward the horizon to sell the pixel-art lighting
  const rim = (x: number, y: number, w: number, h: number, color: string, a = 0.55) => (
    <>
      <rect x={x - w / 2} y={y - 2} width={w} height="2" fill={color} opacity={a} style={{ mixBlendMode: 'screen' as any }} />
      <rect x={x - w / 2} y={y - h} width="1" height={h} fill={color} opacity={a * 0.4} style={{ mixBlendMode: 'screen' as any }} />
      <rect x={x + w / 2 - 1} y={y - h} width="1" height={h} fill={color} opacity={a * 0.25} style={{ mixBlendMode: 'screen' as any }} />
    </>
  );

  const warmRim = blend(sky.bottom, '#ffd9a8', 0.45);
  const roofSnow = season === 'winter' ? clamp(0.6 - (weather?.precipitation === 'rain' ? 0.3 : 0), 0, 0.6) : 0;

  const draw = (type: Archetype, x: number, y: number, w: number, h: number, isBG = false) => {
    const wallBase = isBG ? blend(culture.trim, '#2e2a24', 0.06) : blend(culture.trim, '#2e2a24', 0.02);
    const stroke = '#4b3b2a';
    const base = (
      <>
        <rect x={x - w / 2} y={y - h} width={w} height={h} fill={wallBase} stroke={stroke} strokeWidth="1" />
        {rim(x, y, w, h, warmRim, 0.5)}
      </>
    );
    switch (type) {
      case 'mud_hut':
        return (
          <g>
            {/* More authentic circular mud hut */}
            <ellipse cx={x} cy={y - h / 2} rx={w / 2} ry={h / 2} fill={blend('#b8860b', '#8b4513', 0.3)} />
            <ellipse cx={x} cy={y - h} rx={w / 2 + 2} ry={h / 4} fill={blend('#8b5a2b', culture.roof, 0.4)} />
            {roofSnow > 0 && <ellipse cx={x} cy={y - h - 1} rx={w / 2 + 2} ry={h / 4.2} fill="#fff" opacity={roofSnow} />}
            {/* Small entrance opening instead of door */}
            <ellipse cx={x} cy={y - 8} rx={2} ry={4} fill="#2c1810" />
          </g>
        );
      case 'adobe_compound':
        return (
          <g>
            {/* Flat-roofed compound buildings */}
            {base}
            <rect x={x - w / 2} y={y - h - 2} width={w} height="2" fill={blend('#d2b48c', culture.roof, 0.6)} />
            {roofSnow > 0 && <rect x={x - w / 2} y={y - h - 3} width={w} height="2" fill="#fff" opacity={roofSnow} />}
            {/* Multiple smaller entrances */}
            <rect x={x - 6} y={y - 10} width="4" height="10" fill="#3b2a1a" />
            <rect x={x + 2} y={y - 8} width="4" height="8" fill="#3b2a1a" />
            {/* Courtyard walls */}
            <rect x={x - w / 2 - 3} y={y - 6} width="2" height="6" fill={wallBase} />
            <rect x={x + w / 2 + 1} y={y - 6} width="2" height="6" fill={wallBase} />
          </g>
        );
      case 'thatch_longhouse':
        return (
          <g>
            {/* Extended longhouse with better proportions */}
            {base}
            <polygon points={`${x - w / 2 - 4},${y - h} ${x},${y - h - 8} ${x + w / 2 + 4},${y - h}`} fill={blend('#8b5a2b', culture.roof, 0.2)} />
            {roofSnow > 0 && <polygon points={`${x - w / 2 - 4},${y - h} ${x},${y - h - 8} ${x + w / 2 + 4},${y - h}`} fill="#fff" opacity={roofSnow} />}
            {/* Multiple entrances for longhouse */}
            <rect x={x - 8} y={y - 10} width="4" height="10" fill="#3b2a1a" />
            <rect x={x + 4} y={y - 10} width="4" height="10" fill="#3b2a1a" />
            {/* Smoke holes */}
            <rect x={x - 4} y={y - h - 4} width="2" height="2" fill="#2c1810" />
            <rect x={x + 4} y={y - h - 4} width="2" height="2" fill="#2c1810" />
          </g>
        );
      case 'pueblo_terrace':
        return (
          <g>
            {base}
            {/* stepped terraces */}
            <rect x={x - w / 2} y={y - h - 2} width={w * 0.6} height="2" fill={culture.roof} />
            <rect x={x - w / 2 + 3} y={y - h + 6} width={w * 0.5} height="2" fill={culture.roof} opacity="0.8" />
            {roofSnow > 0 && <rect x={x - w / 2} y={y - h - 3} width={w * 0.6} height="2" fill="#fff" opacity={roofSnow} />}
          </g>
        );
      case 'timber_house':
        return (
          <g>
            {base}
            <polygon points={`${x - w / 2 - 2},${y - h} ${x},${y - h / 3} ${x + w / 2 + 2},${y - h}`} fill={culture.roof} />
            {roofSnow > 0 && <polygon points={`${x - w / 2 - 2},${y - h} ${x},${y - h / 3} ${x + w / 2 + 2},${y - h}`} fill="#fff" opacity={roofSnow} />}
            <rect x={x - 4} y={y - 12} width="8" height="12" fill="#2c1810" />
          </g>
        );
      case 'stone_gable':
        return (
          <g>
            {base}
            <polygon points={`${x - w / 2 - 2},${y - h} ${x},${y - h / 2} ${x + w / 2 + 2},${y - h}`} fill={culture.roof} />
            {roofSnow > 0 && <polygon points={`${x - w / 2 - 2},${y - h} ${x},${y - h / 2} ${x + w / 2 + 2},${y - h}`} fill="#fff" opacity={roofSnow} />}
            <rect x={x - 4} y={y - 12} width="8" height="12" fill="#2c1810" />
          </g>
        );
      case 'tile_rowhouse':
        return (
          <g>
            {base}
            <rect x={x - w / 2} y={y - h - 2} width={w} height="2" fill={culture.roof} />
            {roofSnow > 0 && <rect x={x - w / 2} y={y - h - 3} width={w} height="2" fill="#fff" opacity={roofSnow} />}
          </g>
        );
      case 'dome_sanctum':
        return (
          <g>
            {base}
            <ellipse cx={x} cy={y - h} rx={w / 3} ry={h / 5} fill={culture.roof} />
            {roofSnow > 0 && <ellipse cx={x} cy={y - h - 1} rx={w / 3.2} ry={h / 6} fill="#fff" opacity={roofSnow} />}
          </g>
        );
      case 'pagoda_roof':
        return (
          <g>
            {base}
            <path d={`M ${x - w / 2 - 4} ${y - h} Q ${x} ${y - h - 12} ${x + w / 2 + 4} ${y - h}`} fill={culture.roof} />
            <rect x={x - w / 2 - 4} y={y - h - 2} width={w + 8} height="2" fill={culture.trim} />
            {roofSnow > 0 && <rect x={x - w / 2 - 3} y={y - h - 2} width={w + 6} height="2" fill="#fff" opacity={roofSnow} />}
          </g>
        );
      case 'stilt_house':
        return (
          <g>
            {base}
            <rect x={x - w / 2} y={y} width="2" height="6" fill="#5a4322" />
            <rect x={x + w / 2 - 2} y={y} width="2" height="6" fill="#5a4322" />
            <polygon points={`${x - w / 2},${y - h} ${x},${y - h - 8} ${x + w / 2},${y - h}`} fill={culture.roof} />
          </g>
        );
      case 'warehouse':
        return (
          <g>
            {base}
            <rect x={x - w / 2} y={y - h - 2} width={w} height="2" fill={blend(culture.roof, '#6b7280', 0.3)} />
            <rect x={x - 6} y={y - 14} width="12" height="14" fill="#374151" />
          </g>
        );
      case 'factory_stack':
        return (
          <g>
            {base}
            <rect x={x + w / 3} y={y - h - 15} width="4" height="16" fill="#4b5563" />
          </g>
        );
      case 'row_tenement':
        return (
          <g>
            {base}
            <rect x={x - w / 2} y={y - h - 2} width={w} height="2" fill={blend('#6b7280', culture.roof, 0.3)} />
          </g>
        );
      case 'apartment_block':
        return (
          <g>
            {base}
            <rect x={x - w / 2} y={y - h - 2} width={w} height="2" fill={blend('#6b7280', culture.roof, 0.4)} />
          </g>
        );
      case 'office_tower':
        return (
          <g>
            {base}
            <rect x={x - w / 2} y={y - h - 4} width={w} height="4" fill={blend('#6b7280', culture.roof, 0.6)} />
          </g>
        );
    }
  };

  // Historically accurate window rendering
  const windows = (x: number, y: number, w: number, h: number, rows = 2, buildingType?: Archetype, variant?: number) => {
    if (lightIntensity <= 0.05) return null;

    // Many traditional buildings shouldn't have glass windows at all
    const shouldHaveWindows = (() => {
      // No windows for these traditional types
      if (['mud_hut', 'adobe_compound', 'thatch_longhouse', 'pueblo_terrace', 'stilt_house'].includes(buildingType || '')) {
        return false;
      }
      // Limited windows for early eras
      if (era === HistoricalEra.PREHISTORY || era === HistoricalEra.ANTIQUITY) {
        return ['dome_sanctum', 'stone_gable'].includes(buildingType || '');
      }
      // More windows from medieval onward
      return era >= HistoricalEra.MEDIEVAL;
    })();

    if (!shouldHaveWindows) return null;

    const warm = '#ffd27a';
    const cool = '#a8d5ff';

    // Window variety based on era and building type
    const windowStyle = (() => {
      if (era === HistoricalEra.MODERN_ERA) return 'grid';
      if (era === HistoricalEra.INDUSTRIAL_ERA) return 'tall';
      if (buildingType === 'pagoda_roof') return 'lattice';
      if (buildingType === 'dome_sanctum') return 'arched';
      if (era === HistoricalEra.MEDIEVAL) return 'narrow';
      return 'regular';
    })();

    // Fewer windows for earlier eras
    const maxRows = era <= HistoricalEra.MEDIEVAL ? 1 : rows;
    const perRow = (() => {
      if (windowStyle === 'grid') return 3;
      if (era <= HistoricalEra.MEDIEVAL) return 1; // Single window for medieval
      return 2;
    })();

    const cells: JSX.Element[] = [];

    for (let r = 0; r < maxRows; r++) {
      for (let c = 0; c < perRow; c++) {
        const wx = x - w / 2 + 6 + c * (w - 12 - 6) / Math.max(1, perRow - 1);
        const wy = y - h + 9 + r * 10;

        // Vary lighting pattern based on time and building
        const isNight = timeOfDay === 'Night' || timeOfDay === 'Dusk';
        // Much less lighting in premodern eras
        const litChance = era <= HistoricalEra.MEDIEVAL ?
          (isNight ? 0.3 : 0.1) :  // Candles/oil lamps were expensive
          (isNight ? 0.7 : 0.3);
        const lit = ((r + c + (variant || 0)) * 7) % 10 < litChance * 10;
        const windowColor = era === HistoricalEra.MODERN_ERA && c % 2 === 0 ? cool : warm;
        const fill = lit ? windowColor : '#1c1c1c';

        // Different window shapes based on style
        if (windowStyle === 'arched') {
          cells.push(
            <g key={`${r}-${c}`}>
              <ellipse cx={wx + 3} cy={wy + 4} rx={3} ry={5} fill={fill} />
              {lit && (
                <ellipse
                  cx={wx + 3} cy={wy + 4} rx={4} ry={6}
                  fill={windowColor} opacity={0.45 * lightIntensity}
                  style={{ mixBlendMode: 'screen' as any }}
                />
              )}
            </g>
          );
        } else if (windowStyle === 'narrow') {
          cells.push(
            <g key={`${r}-${c}`}>
              <rect x={wx} y={wy} width="4" height="10" fill={fill} />
              {lit && (
                <rect
                  x={wx - 1} y={wy - 1} width="6" height="12"
                  fill={windowColor} opacity={0.45 * lightIntensity}
                  style={{ mixBlendMode: 'screen' as any }}
                />
              )}
            </g>
          );
        } else if (windowStyle === 'lattice') {
          cells.push(
            <g key={`${r}-${c}`}>
              <rect x={wx} y={wy} width="6" height="8" fill={fill} />
              <rect x={wx + 2} y={wy} width="2" height="8" fill="#2c1810" opacity={0.5} />
              <rect x={wx} y={wy + 3} width="6" height="2" fill="#2c1810" opacity={0.5} />
              {lit && (
                <rect
                  x={wx - 1} y={wy - 1} width="8" height="10"
                  fill={windowColor} opacity={0.35 * lightIntensity}
                  style={{ mixBlendMode: 'screen' as any }}
                />
              )}
            </g>
          );
        } else {
          cells.push(
            <g key={`${r}-${c}`}>
              <rect x={wx} y={wy} width="6" height="8" fill={fill} />
              {lit && (
                <rect
                  x={wx - 1} y={wy - 1} width="8" height="10"
                  fill={windowColor} opacity={0.45 * lightIntensity}
                  style={{ mixBlendMode: 'screen' as any }}
                />
              )}
            </g>
          );
        }
      }
    }
    return <>{cells}</>;
  };

  const renderDistricts = () => (
    <g>
      {/* Far background buildings - smaller, faded */}
      {layout.bg.map((b, i) => (
        <g key={`bg-${i}`} opacity={0.55}>
          {draw(b.type, b.x, b.y, b.bw * 0.8, b.bh * 0.8, true)}
          {windows(b.x, b.y, b.bw * 0.8, b.bh * 0.8, 1, b.type, i)}
        </g>
      ))}

      {/* Midground buildings - normal opacity */}
      {layout.fg.map((b, i) => (
        <g key={`fg-${i}`}>
          {draw(b.type, b.x, b.y, b.bw, b.bh, false)}
          {windows(b.x, b.y, b.bw, b.bh, 2, b.type, i)}
          {/* door */}
          <rect x={b.x - 4} y={b.y - 12} width="8" height="12" fill="#2c1810" />
          {/* Enhanced animated chimney smoke */}
          {b.hasChimney && (
            <g opacity={timeOfDay === 'Night' || timeOfDay === 'Dawn' ? 0.65 : 0.45}>
              {Array.from({ length: 8 }, (_, k) => {
                // More complex smoke animation
                const age = ((frame * 0.5 + k * 8) % 40) / 40; // age of smoke puff (0-1)
                const windStrength = (weather?.windSpeed ?? 10) / 20;
                const dir = ((weather?.windDirection ?? 270) - 90) * (Math.PI / 180);

                // Smoke rises and drifts with wind
                const baseX = b.x + b.bw / 3 + 2;
                const baseY = b.y - b.bh - 10;
                const dx = Math.cos(dir) * age * 25 * windStrength + Math.sin(age * Math.PI * 2) * 3;
                const dy = -age * 20 + Math.sin(age * Math.PI * 3 + k) * 2;

                // Smoke expands and fades as it rises
                const radius = 2 + age * 4;
                const opacity = Math.max(0, (1 - age) * 0.4);

                // Color shifts from darker to lighter as smoke rises
                const smokeColor = blend('#6b7280', '#e5e7eb', age * 0.6);

                return (
                  <circle
                    key={k}
                    cx={baseX + dx}
                    cy={baseY + dy}
                    r={radius}
                    fill={smokeColor}
                    opacity={opacity}
                  />
                );
              })}
            </g>
          )}
        </g>
      ))}
    </g>
  );

  const renderGround = () => {
    const y = layout.baseY;
    return (
      <g>
        <rect x="0" y={y} width={width} height={height - y} fill={ground.ground} />
        {Array.from({ length: Math.floor(width / 8) }, (_, i) => (
          <rect key={i} x={i * 8} y={y - 3 + ((i * 7) % 3) - 1} width="2" height="4" fill={ground.veg} opacity="0.7" />
        ))}
        <rect x="0" y={y + 8} width={width} height="6" fill="#6b7280" opacity="0.7" />
        {Array.from({ length: Math.floor(width / 10) }, (_, i) => (
          <rect key={`c-${i}`} x={i * 10 + 1} y={y + 9} width="8" height="4" fill="#9ca3af" opacity="0.85" />
        ))}
        {nextToWater && (
          <g>
            <rect x="0" y={height * 0.84} width={width} height={height * 0.16} fill="#3b82f6" />
            {Array.from({ length: Math.floor(width / 28) }, (_, i) => (
              <rect
                key={i}
                x={i * 28 + ((frame / 6 + i * 7) % 8)}
                y={height * 0.84 - 2 + (Math.sin((frame + i * 13) * 0.05) * 1)}
                width="14"
                height="2"
                fill="#93c5fd"
                opacity="0.8"
              />
            ))}
            {harbor && (
              <g transform={`translate(${layout.boat.x + Math.sin(frame * 0.03 + layout.boat.wobble) * 6}, ${height * 0.835 + Math.sin(frame * 0.04 + layout.boat.wobble) * 1.5})`}>
                <rect x={-8} y={0} width="16" height="4" fill="#2c1810" />
                <rect x={0} y={-10} width="2" height="10" fill="#2c1810" />
                <path d={`M 2 -8 Q ${2 + (weather?.windSpeed ?? 10) * 0.3} -10, ${2 + (weather?.windSpeed ?? 10) * 0.25} -6 L 2 -6 Z`} fill={culture.banner} />
              </g>
            )}
          </g>
        )}
      </g>
    );
  };

  const renderLamps = () => {
    if (lightIntensity <= 0.1) return null;
    const lampGlow = '#ffcc66';
    const torchGlow = '#ff8844';

    // Determine lighting type based on era
    const lightingType = (() => {
      if (era === HistoricalEra.PREHISTORY) return 'bonfire';
      if (era === HistoricalEra.ANTIQUITY || era === HistoricalEra.MEDIEVAL) return 'torch';
      if (era === HistoricalEra.RENAISSANCE_EARLY_MODERN) return 'lantern';
      if (era === HistoricalEra.INDUSTRIAL_ERA) return 'gaslamp';
      return 'electric'; // Modern era
    })();

    return (
      <g>
        {layout.lamps.map((L, i) => {
          if (lightingType === 'bonfire') {
            // Bonfires for prehistoric
            return (
              <g key={i}>
                {/* Stone ring */}
                <ellipse cx={L.x} cy={L.y} rx={8} ry={3} fill="#5a5a5a" />
                {/* Fire */}
                {Array.from({ length: 3 }, (_, k) => {
                  const flicker = Math.sin(frame * 0.2 + k) * 2;
                  return (
                    <g key={k}>
                      <ellipse
                        cx={L.x + flicker}
                        cy={L.y - 4 - k * 3}
                        rx={4 - k}
                        ry={6 - k * 2}
                        fill={k === 0 ? '#ff6b2b' : torchGlow}
                        opacity={0.8 - k * 0.2}
                      />
                    </g>
                  );
                })}
                <circle cx={L.x} cy={L.y - 4} r={15} fill={torchGlow} opacity={0.4 * lightIntensity} style={{ mixBlendMode: 'screen' as any }} />
              </g>
            );
          } else if (lightingType === 'torch') {
            // Torches for antiquity/medieval
            return (
              <g key={i}>
                {/* Torch pole */}
                <rect x={L.x - 1} y={L.y - 16} width="2" height="16" fill="#6b4423" />
                {/* Torch bracket */}
                <rect x={L.x - 2} y={L.y - 18} width="4" height="2" fill="#4a3725" />
                {/* Flame with animation */}
                {Array.from({ length: 3 }, (_, k) => {
                  const flicker = Math.sin(frame * 0.15 + i + k) * 1.5;
                  return (
                    <ellipse
                      key={k}
                      cx={L.x + flicker}
                      cy={L.y - 20 - k * 2}
                      rx={2 - k * 0.5}
                      ry={3 - k}
                      fill={k === 0 ? '#ff6b2b' : torchGlow}
                      opacity={0.9 - k * 0.2}
                    />
                  );
                })}
                <circle cx={L.x} cy={L.y - 20} r={12} fill={torchGlow} opacity={0.5 * lightIntensity} style={{ mixBlendMode: 'screen' as any }} />
              </g>
            );
          } else if (lightingType === 'lantern') {
            // Oil lanterns for renaissance/early modern
            return (
              <g key={i}>
                {/* Lantern pole */}
                <rect x={L.x - 1} y={L.y - 14} width="2" height="14" fill="#4a4a4a" />
                {/* Lantern box */}
                <rect x={L.x - 3} y={L.y - 20} width="6" height="8" fill="#2c1810" strokeWidth="0.5" stroke="#1a1a1a" />
                {/* Glass panes */}
                <rect x={L.x - 2} y={L.y - 19} width="4" height="6" fill={lampGlow} opacity={0.7} />
                {/* Flame inside */}
                <ellipse cx={L.x} cy={L.y - 16} rx="1" ry="2" fill="#ff6b2b" />
                <circle cx={L.x} cy={L.y - 16} r={10} fill={lampGlow} opacity={0.45 * lightIntensity} style={{ mixBlendMode: 'screen' as any }} />
              </g>
            );
          } else if (lightingType === 'gaslamp') {
            // Gas lamps for industrial era
            return (
              <g key={i}>
                {/* Ornate pole */}
                <rect x={L.x - 1} y={L.y - 16} width="2" height="16" fill="#2c3e50" />
                {/* Decorative base */}
                <rect x={L.x - 2} y={L.y - 2} width="4" height="2" fill="#1a2332" />
                {/* Glass globe */}
                <circle cx={L.x} cy={L.y - 18} r="4" fill="#1a1a1a" opacity={0.3} />
                <circle cx={L.x} cy={L.y - 18} r="3" fill={lampGlow} opacity={0.8} />
                {/* Gas flame */}
                <ellipse cx={L.x} cy={L.y - 18} rx="1" ry="2" fill="#4a9fff" />
                <circle cx={L.x} cy={L.y - 18} r={10} fill={lampGlow} opacity={0.55 * lightIntensity} style={{ mixBlendMode: 'screen' as any }} />
              </g>
            );
          } else {
            // Modern electric street lamps
            return (
              <g key={i}>
                <rect x={L.x - 1} y={L.y - 18} width="2" height="18" fill="#374151" />
                <circle cx={L.x} cy={L.y - 18} r="3" fill={lampGlow} />
                <circle cx={L.x} cy={L.y - 18} r={10} fill={lampGlow} opacity={0.65 * lightIntensity} style={{ mixBlendMode: 'screen' as any }} />
                <rect x={L.x - 12} y={L.y - 6} width={24} height="3" fill={lampGlow} opacity={0.25 * lightIntensity} style={{ mixBlendMode: 'screen' as any }} />
              </g>
            );
          }
        })}
      </g>
    );
  };

  const renderPeople = () => {
    const rowY = height * 0.70;

    // Time-based activity patterns
    const activityLevel = (() => {
      if (timeOfDay === 'Night') return 0.1;  // Very few people at night
      if (timeOfDay === 'Dawn') return 0.3;   // Some early risers
      if (timeOfDay === 'Dusk') return 0.7;   // Evening activity
      return 1.0; // Full daytime activity
    })();

    // Cultural clothing colors
    const clothingPalette = (() => {
      switch(culturalZone) {
        case 'EAST_ASIAN': return ['#1e293b', '#dc2626', '#0891b2', '#7c3aed'];
        case 'SOUTH_ASIAN': return ['#ea580c', '#eab308', '#a21caf', '#0d9488'];
        case 'MENA': return ['#0c4a6e', '#f5f5f4', '#737373', '#1e293b'];
        case 'SUB_SAHARAN_AFRICAN': return ['#dc2626', '#f59e0b', '#16a34a', '#9333ea'];
        case 'EUROPEAN': return ['#1e293b', '#525252', '#991b1b', '#1e3a8a'];
        case 'SOUTH_AMERICAN': return ['#dc2626', '#059669', '#fbbf24', '#7c3aed'];
        case 'OCEANIA': return ['#06b6d4', '#10b981', '#f59e0b', '#8b5cf6'];
        default: return [culture.trim, blend(culture.trim, '#000', 0.2)];
      }
    })();

    // Profession-based clothing colors
    const getProfessionColor = (profession?: string) => {
      if (!profession) return null;
      const prof = profession.toLowerCase();
      if (prof.includes('merchant') || prof.includes('trader')) return '#7c3aed';
      if (prof.includes('scholar') || prof.includes('scribe')) return '#0891b2';
      if (prof.includes('priest') || prof.includes('holy')) return '#f5f5f4';
      if (prof.includes('artisan') || prof.includes('craft')) return '#ea580c';
      if (prof.includes('guard') || prof.includes('soldier')) return '#dc2626';
      if (prof.includes('farmer') || prof.includes('peasant')) return '#6b4423';
      return null;
    };

    const speed = timeOfDay === 'Night' ? 0.2 : (timeOfDay === 'Dawn' || timeOfDay === 'Dusk' ? 0.3 : 0.4);
    const peopleCount = Math.floor(layout.people.length * activityLevel);

    return (
      <g>
        {layout.people.slice(0, peopleCount).map((p, i) => {
          const x = (p.baseX + (frame + p.phase) * speed * p.dir + width * 2) % width;
          const walk = Math.floor((frame + i) / 8) % 2;

          // Check if this is an NPC
          const isNpc = p.isNpc;
          const isSelected = isNpc && p.id === selectedNpcId;

          // Pick clothing color based on NPC profession or cultural default
          const clothingColor = isNpc ?
            (getProfessionColor(p.profession) || clothingPalette[i % clothingPalette.length]) :
            clothingPalette[i % clothingPalette.length];

          // Vary skin tones slightly
          const skinTone = blend('#ffdbac', '#d4a574', (i * 17) % 100 / 200);

          return (
            <g key={p.id || i}
               transform={`translate(${x}, ${rowY})`}
               onClick={isNpc ? () => onNpcClick?.(p.id) : undefined}
               style={isNpc ? { cursor: 'pointer' } : undefined}>

              {/* Highlight effect for selected NPC */}
              {isSelected && (
                <>
                  <circle cx="0" cy="-6" r="12" fill="#00ff88" opacity={0.3} style={{ mixBlendMode: 'screen' as any }} />
                  <circle cx="0" cy="-6" r="8" fill="#00ff88" opacity={0.5} style={{ mixBlendMode: 'screen' as any }} />
                  {/* Name label above NPC */}
                  <rect x={-20} y={-22} width={40} height={10} rx={2} fill="#000" opacity={0.7} />
                  <text x={0} y={-14} fill="#fff" fontSize={6} textAnchor="middle" style={{ fontFamily: 'monospace' }}>
                    {p.name}
                  </text>
                </>
              )}

              {/* Tooltip for NPC on hover (profession) */}
              {isNpc && !isSelected && (
                <title>{p.name} - {p.profession}</title>
              )}

              {/* Body with cultural clothing */}
              <rect x="-2" y="-8" width="4" height="6" fill={clothingColor} />

              {/* Add cultural details for some people */}
              {culturalZone === 'MENA' && i % 3 === 0 && (
                // Headscarf/turban
                <rect x="-2" y="-11" width="4" height="2" fill={clothingColor} />
              )}
              {culturalZone === 'EAST_ASIAN' && i % 4 === 0 && era < HistoricalEra.MODERN_ERA && (
                // Conical hat
                <polygon points="-3,-11 0,-13 3,-11" fill="#8b7355" />
              )}

              {/* Head */}
              <rect x="-1.5" y="-10" width="3" height="2" fill={skinTone} />

              {/* Animated walking legs */}
              <rect x={-1.5 + walk * p.dir} y="-2" width="1" height="4" fill="#4b3b2a" />
              <rect x={0.5 - walk * p.dir} y="-2" width="1" height="4" fill="#4b3b2a" />

              {/* Era-appropriate personal lighting at night */}
              {lightIntensity > 0.5 && i % 4 === 0 && (
                <g>
                  {(era === HistoricalEra.PREHISTORY || era === HistoricalEra.ANTIQUITY || era === HistoricalEra.MEDIEVAL) ? (
                    // Torch for early eras
                    <>
                      <rect x="3" y="-6" width="1" height="4" fill="#6b4423" />
                      <ellipse cx="4" cy="-7" rx="1" ry="2" fill="#ff6b2b" />
                      <circle cx="4" cy="-7" r="5" fill="#ff8844" opacity={0.4 * lightIntensity} style={{ mixBlendMode: 'screen' as any }} />
                    </>
                  ) : (
                    // Lantern for later eras
                    <>
                      <rect x="3" y="-6" width="1" height="4" fill="#2c1810" />
                      <rect x="3.5" y="-8" width="1" height="2" fill="#2c1810" />
                      <circle cx="4" cy="-7" r="1.5" fill="#ffcc66" />
                      <circle cx="4" cy="-7" r="4" fill="#ffcc66" opacity={0.4 * lightIntensity} style={{ mixBlendMode: 'screen' as any }} />
                    </>
                  )}
                </g>
              )}
            </g>
          );
        })}
      </g>
    );
  };

  const renderWeatherFX = () => {
    const precip = weather?.precipitation ?? 'none';
    const intensity = clamp(weather?.intensity ?? 0, 0, 1);
    const drops = Math.floor(lerp(10, 120, intensity));
    const wind = weather?.windSpeed ?? 12;
    const dirRad = (((weather?.windDirection ?? 270) - 90) * Math.PI) / 180;
    const dx = Math.cos(dirRad) * 8;
    const dy = Math.sin(dirRad) * 6;

    return (
      <g>
        {(precip === 'rain' || precip === 'drizzle') && (
          <g opacity={lerp(0.25, 0.75, intensity)}>
            {Array.from({ length: drops }, (_, i) => (
              <rect
                key={i}
                x={(i * 17 + (frame * (2 + wind * 0.04))) % width}
                y={(i * 29 + frame * 4) % (height * 0.65)}
                width="1"
                height={precip === 'drizzle' ? 6 : 10}
                fill="#9fb4be"
                transform={`translate(${dx * 0.4}, ${dy * 0.4})`}
              />
            ))}
          </g>
        )}
        {(precip === 'snow' || precip === 'sleet') && (
          <g opacity={lerp(0.35, 0.9, intensity)}>
            {Array.from({ length: Math.floor(drops * 0.7) }, (_, i) => (
              <circle
                key={i}
                cx={(i * 23 + (frame * (1 + wind * 0.03))) % width}
                cy={(i * 19 + frame * 2) % (height * 0.65)}
                r={precip === 'sleet' ? 1 : 1.5}
                fill="#ffffff"
                opacity="0.9"
              />
            ))}
          </g>
        )}
        {(weather?.special === 'fog' || weather?.special === 'mist') && (
          <g opacity={weather.special === 'fog' ? 0.6 : 0.4}>
            <defs>
              <linearGradient id={makeId('fog')} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgba(220,230,240,0.0)" />
                <stop offset="100%" stopColor="rgba(220,230,240,0.9)" />
              </linearGradient>
            </defs>
            <rect x="0" y={height * 0.5} width={width} height={height * 0.5} fill={`url(#${makeId('fog')})`} />
          </g>
        )}
      </g>
    );
  };

  /* ------------------------------- Specials ------------------------------- */
  const renderHistoricalFeatures = () => {
    const info = mapData?.majorCity;
    if (!info?.isHistorical) return null;
    const yWater = height * 0.84;

    // Venice canals (lightweight flourish)
    if (/venice/i.test(info.name || '')) {
      return (
        <g opacity="0.7">
          <rect x={width * 0.3} y={yWater - 8} width="60" height="8" fill="#4682B4" />
          <rect x={width * 0.6} y={yWater - 8} width="60" height="8" fill="#4682B4" />
          <rect x={width * 0.32} y={yWater - 9} width="20" height="4" fill="#2C1810" />
          <rect x={width * 0.36} y={yWater - 11} width="2" height="8" fill="#4A4A4A" />
        </g>
      );
    }
    return null;
  };

  /* --------------------------- Foreground Layer ---------------------------- */

  const renderForeground = () => {
    // Market stalls during day, especially morning
    const showMarket = (timeOfDay === 'Morning' || timeOfDay === 'Midday') &&
                      (era >= HistoricalEra.MEDIEVAL || culturalZone === 'MENA' || culturalZone === 'SOUTH_ASIAN');

    // Street vendors and carts based on era
    const hasVendors = era >= HistoricalEra.ANTIQUITY && era <= HistoricalEra.RENAISSANCE_EARLY_MODERN;

    return (
      <g opacity={0.95}>
        {/* Market stalls with awnings */}
        {showMarket && layout.lamps.slice(0, 3).map((pos, i) => {
          // Cultural awning colors
          const awningColor = (() => {
            switch(culturalZone) {
              case 'EAST_ASIAN': return ['#dc2626', '#eab308', '#0891b2'][i % 3];
              case 'SOUTH_ASIAN': return ['#ea580c', '#a21caf', '#059669'][i % 3];
              case 'MENA': return ['#0891b2', '#f5f5f4', '#dc2626'][i % 3];
              case 'SUB_SAHARAN_AFRICAN': return ['#f59e0b', '#dc2626', '#16a34a'][i % 3];
              default: return culture.banner;
            }
          })();

          return (
            <g key={`stall-${i}`} transform={`translate(${pos.x + i * 80}, ${height * 0.75})`}>
              {/* Stall frame */}
              <rect x="-15" y="-20" width="30" height="20" fill="#8b7355" />
              <rect x="-15" y="-22" width="30" height="2" fill="#6b5a4a" />

              {/* Striped awning */}
              <polygon points="-18,-22 0,-30 18,-22" fill={awningColor} />
              <polygon points="-18,-22 0,-28 18,-22" fill={awningColor} opacity={0.7} />

              {/* Goods on display */}
              <rect x="-12" y="-18" width="5" height="4" fill="#d4a574" />
              <rect x="-5" y="-18" width="5" height="4" fill="#dc2626" />
              <rect x="2" y="-18" width="5" height="4" fill="#059669" />
              <rect x="8" y="-18" width="5" height="4" fill="#eab308" />
            </g>
          );
        })}

        {/* Street vendor carts for medieval/renaissance */}
        {hasVendors && timeOfDay !== 'Night' && (
          <g transform={`translate(${100 + Math.sin(frame * 0.01) * 10}, ${height * 0.72})`}>
            <rect x="-8" y="-6" width="16" height="6" fill="#8b7355" />
            <circle cx="-6" cy="0" r="2" fill="#4b3b2a" />
            <circle cx="6" cy="0" r="2" fill="#4b3b2a" />
            <rect x="-6" y="-8" width="12" height="2" fill="#d4a574" />
          </g>
        )}

        {/* Trees for prosperous cities */}
        {condition === 'prosperous' && layout.lamps.map((pos, i) => {
          if (i % 3 !== 0) return null;
          return (
            <g key={`tree-${i}`} transform={`translate(${pos.x - 30}, ${height * 0.68})`}>
              <rect x="-2" y="-8" width="4" height="8" fill="#6b4423" />
              <circle cx="0" cy="-12" r="6" fill="#059669" opacity={0.9} />
              <circle cx="-3" cy="-10" r="4" fill="#16a34a" opacity={0.8} />
              <circle cx="3" cy="-10" r="4" fill="#16a34a" opacity={0.8} />
            </g>
          );
        })}

        {/* Birds for dawn/dusk */}
        {(timeOfDay === 'Dawn' || timeOfDay === 'Dusk') && (
          <g>
            {Array.from({ length: 5 }, (_, i) => {
              const birdX = (i * 100 + frame * 0.8) % (width + 100) - 50;
              const birdY = 20 + Math.sin(frame * 0.05 + i) * 10;
              const wingFlap = Math.sin(frame * 0.3 + i) * 2;
              return (
                <g key={`bird-${i}`} transform={`translate(${birdX}, ${birdY})`}>
                  <ellipse cx="0" cy="0" rx="2" ry="1" fill="#1e293b" />
                  <path d={`M -3,${wingFlap} Q -2,0 0,0 Q 2,0 3,${wingFlap}`} fill="#1e293b" />
                </g>
              );
            })}
          </g>
        )}
      </g>
    );
  };

  /* --------------------------------- Render ---------------------------------- */

  // If we have an AI-generated image, use it instead of procedural banner
  if (aiGeneratedImageUrl) {
    return (
      <div
        className="relative w-full rounded-t-lg overflow-hidden"
        style={{
          height: `${height}px`,
          background: 'linear-gradient(to bottom, #1a3a7a, #4A90E2)'
        }}
      >
        <img
          src={aiGeneratedImageUrl}
          alt="City view"
          className="w-full h-full object-cover"
          style={{
            objectPosition: 'center 30%', // Focus on upper part of image (buildings/sky)
            filter: sky.isNight ? 'brightness(0.7)' : undefined
          }}
        />
        {/* Optional overlay for weather effects */}
        {weather?.precipitation !== 'none' && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: weather.precipitation === 'rain'
                ? 'linear-gradient(to bottom, rgba(100, 120, 140, 0.3), transparent)'
                : weather.precipitation === 'snow'
                ? 'linear-gradient(to bottom, rgba(240, 248, 255, 0.4), transparent)'
                : 'none'
            }}
          />
        )}
      </div>
    );
  }

  // Fallback to procedural SVG banner
  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${width} ${height}`}
      style={{ imageRendering: 'pixelated', isolation: 'isolate' }}
      className="rounded-t-lg"
      aria-label="CityBanner"
    >
      {renderSky()}
      {renderMountains()}
      {renderDistricts()}
      {renderGround()}
      {renderLamps()}
      {renderPeople()}
      {renderForeground()}
      {renderWeatherFX()}
      {renderHistoricalFeatures()}
      {/* gentle vignette at night (subtle, non-bleaching) */}
      {sky.isNight && <rect x="0" y="0" width={width} height={height} fill="#000814" opacity={0.06 + (weather?.cloudCover ?? 0) * 0.06} />}
    </svg>
  );
};

export default React.memo(CityBanner);

/**
 * components/GovernmentDistrictBanner.tsx
 * Expanded, zoomed-out, historically flavored pixel-art banner (transparent sky).
 * - Human sprites constrained to walkable surfaces (forecourt + parapet).
 * - Camera pulled back: more horizon & foreground.
 * - Archetype × Culture × Era × Climate → silhouette + palette.
 * - Weather/time-of-day touches (flags, puddles/snow, shadows).
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Tile,
  MapData,
  CulturalZone,
  HistoricalEra,
  ClimateType,
  Season,
  TimeOfDay,
} from '../types';
import { SpecialMapArchetype } from '../types/specialMapTypes';
import type { WeatherState } from '../services/weatherService';

/* -----------------------------------------------------------
   Props
----------------------------------------------------------- */

export interface GovernmentDistrictBannerProps {
  // Core identity
  districtName: string;
  districtType: string;                // "Administrative Center", "Ceremonial Ground", etc.
  archetype: SpecialMapArchetype;      // GOVERNMENT_FORUM, OPEN_FIELD, PALACE_COMPLEX, ...

  // Cultural / temporal context
  culturalZone: CulturalZone;          // EUROPEAN, EAST_ASIAN, OCEANIA, ...
  era: HistoricalEra;                  // ANTIQUITY ... FUTURE_ERA

  // Environmental context
  climate: ClimateType;                // TEMPERATE, ARID, TROPICAL, COLD, ...
  season: Season;                      // 'spring' | 'summer' | 'fall' | 'winter'
  timeOfDay: TimeOfDay;                // Dawn, Morning, Midday, Afternoon, Dusk, Night
  weather?: WeatherState | null;

  // Map context
  tile: Tile;
  mapData: MapData;

  // Visual customization
  width?: number;
  height?: number;
  seed?: number;
  animate?: boolean;
  pixelScale?: number;                 // device px per logical px (higher = chunkier pixels)
}

/* -----------------------------------------------------------
   Utilities
----------------------------------------------------------- */

class SeededRandom {
  private seed: number;
  constructor(seed: number) {
    this.seed = seed % 2147483647;
    if (this.seed <= 0) this.seed += 2147483646;
  }
  next(): number {
    return (this.seed = (this.seed * 16807) % 2147483647) / 2147483647;
  }
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }
  int(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }
}

const clamp = (v: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
const hashString = (s: string): number => {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
};

/* -----------------------------------------------------------
   Style derivation (silhouette + palette)
----------------------------------------------------------- */

type BuildingStyle =
  | 'roman_forum'
  | 'medieval_court'
  | 'renaissance_palazzo'
  | 'victorian_parliament'
  | 'modern_parliament'
  | 'pagoda_hall'
  | 'islamic_complex'
  | 'indian_darbar'
  | 'sahelian_citadel'
  | 'meso_civic'
  | 'oceanic_meeting'
  | 'open_field'
  | 'generic_civic';

type RenderConfig = {
  style: BuildingStyle;
  roof: string;
  wall: string;
  trim: string;
  shadow: string;
  dark: string;
  accent: string;
  snowRoof?: boolean;
  openAir?: boolean;
};

function deriveRenderConfig(
  archetype: SpecialMapArchetype,
  culturalZone: CulturalZone,
  era: HistoricalEra,
  climate: ClimateType,
  season: Season
): RenderConfig {
  // Defaults
  let style: BuildingStyle = 'generic_civic';

  // Archetype × Culture × Era mapping (condensed, historically flavored)
  if (archetype === SpecialMapArchetype.GOVERNMENT_FORUM) {
    if (culturalZone === 'EUROPEAN') {
      if (era === HistoricalEra.ANTIQUITY) style = 'roman_forum';
      else if (era === HistoricalEra.MEDIEVAL) style = 'medieval_court';
      else if (era === HistoricalEra.RENAISSANCE_EARLY_MODERN) style = 'renaissance_palazzo';
      else if (era === HistoricalEra.INDUSTRIAL_ERA) style = 'victorian_parliament';
      else style = 'modern_parliament';
    } else if (culturalZone === 'EAST_ASIAN') {
      style = era <= HistoricalEra.MEDIEVAL ? 'pagoda_hall' : 'modern_parliament';
    } else if (culturalZone === 'MENA') {
      style = 'islamic_complex';
    } else if (culturalZone === 'SOUTH_ASIAN') {
      style = 'indian_darbar';
    } else if (culturalZone === 'SUB_SAHARAN_AFRICAN') {
      style = 'sahelian_citadel';
    } else if (culturalZone === 'OCEANIA') {
      style = 'oceanic_meeting';
    } else if (culturalZone === 'INDIGENOUS_AMERICAN') {
      style = 'meso_civic';
    }
  } else if (archetype === SpecialMapArchetype.OPEN_FIELD) {
    if (culturalZone === 'OCEANIA') style = 'oceanic_meeting';
    else style = 'open_field';
  } else if (archetype === SpecialMapArchetype.PALACE_COMPLEX) {
    // Map to local courtly styles
    if (culturalZone === 'EAST_ASIAN') style = 'pagoda_hall';
    else if (culturalZone === 'SOUTH_ASIAN') style = 'indian_darbar';
    else if (culturalZone === 'MENA') style = 'islamic_complex';
    else if (culturalZone === 'EUROPEAN' && era <= HistoricalEra.RENAISSANCE_EARLY_MODERN)
      style = 'renaissance_palazzo';
    else style = 'generic_civic';
  }

  // Palettes (pixel-art friendly 6–7 colors)
  const palettes: Record<BuildingStyle, Partial<RenderConfig>> = {
    roman_forum: {
      roof: '#8B3E2F',
      wall: '#B9B1A2',
      trim: '#D6CEC0',
      shadow: '#8C8578',
      dark: '#4B4740',
      accent: '#C99A66',
    },
    medieval_court: {
      roof: '#3C3A43',
      wall: '#6C6A73',
      trim: '#90909A',
      shadow: '#4A4950',
      dark: '#2C2B31',
      accent: '#A77D4F',
    },
    renaissance_palazzo: {
      roof: '#7E5A48',
      wall: '#D5C9B2',
      trim: '#E9DFC8',
      shadow: '#A59173',
      dark: '#4E4036',
      accent: '#B99652',
    },
    victorian_parliament: {
      roof: '#4E5A60',
      wall: '#A8B2B8',
      trim: '#D7E0E6',
      shadow: '#7B858C',
      dark: '#364047',
      accent: '#C8914A',
    },
    modern_parliament: {
      roof: '#4B5B62',
      wall: '#9FB5C3',
      trim: '#CFE0EA',
      shadow: '#6E8691',
      dark: '#2E3C42',
      accent: '#88B9E3',
    },
    pagoda_hall: {
      roof: '#7A2F1E',
      wall: '#C9B59D',
      trim: '#E7D7C0',
      shadow: '#987F63',
      dark: '#402619',
      accent: '#2B6B44',
    },
    islamic_complex: {
      roof: '#6B8E23',
      wall: '#C4BCA4',
      trim: '#DED6BE',
      shadow: '#93886D',
      dark: '#3F3A2E',
      accent: '#2E6654',
    },
    indian_darbar: {
      roof: '#7A4A2F',
      wall: '#D6C1A3',
      trim: '#EEE0C8',
      shadow: '#A78968',
      dark: '#4A3223',
      accent: '#A0522D',
    },
    sahelian_citadel: {
      roof: '#6E4E2C',
      wall: '#C7A77E',
      trim: '#DEC7A0',
      shadow: '#9F7F54',
      dark: '#3D2B17',
      accent: '#7D5E36',
    },
    meso_civic: {
      roof: '#6E5A3C',
      wall: '#B9A37B',
      trim: '#D8C8A1',
      shadow: '#8E7853',
      dark: '#463A25',
      accent: '#3E7F6A',
    },
    oceanic_meeting: {
      roof: '#6B4F3B',
      wall: '#C2AA8E',
      trim: '#E5D5BF',
      shadow: '#9A7D61',
      dark: '#3F2E22',
      accent: '#2C8C68',
      openAir: true,
    },
    open_field: {
      roof: '#6B4F3B',
      wall: '#C2AA8E',
      trim: '#E5D5BF',
      shadow: '#9A7D61',
      dark: '#3F2E22',
      accent: '#5B7A45',
      openAir: true,
    },
    generic_civic: {
      roof: '#6A5A4A',
      wall: '#BBB3A1',
      trim: '#D7CEBD',
      shadow: '#8A8273',
      dark: '#3C362E',
      accent: '#A67C52',
    },
  };

  const base = palettes[style] as RenderConfig;
  // Climate adjustments
  const cold = climate === ClimateType.COLD || (climate === ClimateType.TEMPERATE && season === 'winter');
  const snowRoof = cold;
  if (style === 'pagoda_hall' && cold) base.roof = '#4a4a4a'; // slate in cold regions
  if (style === 'modern_parliament' && climate === ClimateType.ARID) base.accent = '#C4A36A';

  return {
    ...base,
    style,
    snowRoof,
  };
}

function flagColor(cz: CulturalZone) {
  switch (cz) {
    case 'EUROPEAN': return '#C0392B';
    case 'MENA': return '#1E8449';
    case 'EAST_ASIAN': return '#F1C40F';
    case 'SOUTH_ASIAN': return '#D35400';
    case 'SUB_SAHARAN_AFRICAN': return '#8E44AD';
    case 'OCEANIA': return '#2980B9';
    case 'INDIGENOUS_AMERICAN': return '#16A085';
    default: return '#C39BD3';
  }
}

/* -----------------------------------------------------------
   Component
----------------------------------------------------------- */

const GovernmentDistrictBanner: React.FC<GovernmentDistrictBannerProps> = ({
  districtName,
  districtType,
  archetype,
  culturalZone,
  era,
  climate,
  season,
  timeOfDay,
  weather,
  tile,
  mapData,
  width = 1400,
  height = 410,
  seed,
  animate = true,
  pixelScale = 4,
}) => {
  // Logical grid (for crisp pixel-art); we render on this, browser scales up.
  const LWIDTH  = Math.max(360, Math.round(width  / pixelScale));
  const LHEIGHT = Math.max(120, Math.round(height / pixelScale));

  // Camera pulled back: raise horizon slightly to reveal more sky, keep more foreground too.
  const GROUND_Y   = Math.floor(LHEIGHT * 0.60); // was ~0.64; higher = more sky, but we also shrink building
  const PLAZA_BOT  = LHEIGHT;

  // Seed
  const seedVal =
    seed ??
    (((tile?.x ?? 0) * 73856093) ^
      ((tile?.y ?? 0) * 19349663) ^
      ((mapData?.region?.length ?? 0) * 83492791) ^
      (era ?? 0) ^
      hashString(String(culturalZone)) ^
      hashString(String(archetype)) ^
      hashString(String(climate)) ^
      hashString(String(season)) ^
      hashString(String(timeOfDay)));
  const rng = useMemo(() => new SeededRandom(seedVal), [seedVal]);

  // Style & palette
  const cfg = useMemo(
    () => deriveRenderConfig(archetype, culturalZone, era, climate, season),
    [archetype, culturalZone, era, climate, season]
  );

  // Weather/time-of-day factors
  const wind = clamp(((weather?.windSpeed ?? 8) - 2) / 28);
  const isSnowy =
    (weather?.precipitation === 'snow') ||
    (!!weather?.fx?.flakeSize && weather.fx.flakeSize > 0.35) ||
    cfg.snowRoof;
  const isWet =
    (weather?.precipitation && weather.precipitation !== 'none') ||
    (weather?.fx?.surfaceWetnessNow ?? 0) > 0.35;

  // Time-of-day: soft shadow direction/length
  const tod = timeOfDay;
  const shadowLen =
    tod === 'Dawn' || tod === 'Dusk' ? 3 :
    tod === 'Night' ? 2 :
    1; // short at midday
  const shadowTone = '#2b2621';

  // Animation clock
  const [t, setT] = useState(0);
  const rafRef = useRef<number | null>(null);
  useEffect(() => {
    if (!animate) return;
    let mounted = true;
    let last = performance.now();
    const loop = () => {
      const now = performance.now();
      if (now - last > 80) { // ~12fps sprite updates
        last = now;
        if (mounted) setT((v) => v + 1);
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      mounted = false;
    };
  }, [animate]);

  /* ---------------------------------------------------------
     Distant landscape (more zoom-out feeling)
  --------------------------------------------------------- */

  const landscape = useMemo(() => {
    const elems: JSX.Element[] = [];
    const horizonY = Math.floor(GROUND_Y - Math.max(12, LHEIGHT * 0.22));

    // Layer 1: far hills / cityline silhouettes
    const band = (color: string, alpha: number, height: number, jitter = 8, period = 36) => {
      let x = -20;
      while (x < LWIDTH + 40) {
        const w = period + rng.int(-6, 8);
        const h = height + rng.int(-3, 4);
        elems.push(
          <polygon
            key={`hill-${color}-${x}`}
            points={`${x},${horizonY} ${x + w / 2},${horizonY - h} ${x + w},${horizonY}`}
            fill={color}
            opacity={alpha}
          />
        );
        x += w - jitter;
      }
    };

    // cool/warm tone by time
    const cool = tod === 'Dawn' ? '#2f3a46' :
                 tod === 'Dusk' ? '#3a3340' :
                 tod === 'Night' ? '#232830' : '#2e333a';

    band(cool, 0.40, 12, 10, 38);
    band('#252a30', 0.30, 8, 8, 30);

    // Tall civic skyline hints (towers, domes) centered loosely
    for (let i = 0; i < 6; i++) {
      const cx = Math.floor(LWIDTH * 0.25) + i * Math.floor(LWIDTH * 0.1) + rng.int(-6, 6);
      const ch = rng.int(6, 12);
      elems.push(<rect key={`spire-${i}`} x={cx} y={horizonY - ch} width={2} height={ch} fill="#2a2e33" opacity={0.45} />);
      if (i % 2 === 0) {
        elems.push(<circle key={`dome-${i}`} cx={cx + 8} cy={horizonY - 4} r={3} fill="#2a2e33" opacity={0.45} />);
      }
    }

    // Trees along the horizon
    for (let i = 0; i < 10; i++) {
      const tx = rng.int(8, LWIDTH - 8);
      const ty = horizonY - rng.int(2, 5);
      elems.push(
        <g key={`tree-${i}`} opacity={0.6}>
          <rect x={tx} y={ty} width={1} height={3} fill="#3b2e1f" />
          <rect x={tx - 2} y={ty - 3} width={5} height={3} fill="#2f4a2f" />
        </g>
      );
    }
    return elems;
  }, [GROUND_Y, LHEIGHT, LWIDTH, rng, tod]);

  /* ---------------------------------------------------------
     Plaza tiling, puddles/snow
  --------------------------------------------------------- */

  const TILE = 6;
  const gridLines = useMemo(() => {
    const lines: JSX.Element[] = [];
    for (let x = 0; x <= LWIDTH; x += TILE) {
      lines.push(
        <line
          key={`v-${x}`}
          x1={x}
          y1={GROUND_Y}
          x2={x}
          y2={PLAZA_BOT}
          stroke="#5b5044"
          strokeWidth={0.5}
          opacity={0.55}
          shapeRendering="crispEdges"
        />
      );
    }
    for (let y = GROUND_Y; y <= PLAZA_BOT; y += TILE) {
      lines.push(
        <line
          key={`h-${y}`}
          x1={0}
          y1={y}
          x2={LWIDTH}
          y2={y}
          stroke="#5b5044"
          strokeWidth={0.5}
          opacity={0.55}
          shapeRendering="crispEdges"
        />
      );
    }
    return lines;
  }, [GROUND_Y, PLAZA_BOT, LWIDTH]);

  const puddles = useMemo(() => {
    if (!isWet) return null;
    const e: JSX.Element[] = [];
    const count = 8;
    for (let i = 0; i < count; i++) {
      const px = rng.int(12, LWIDTH - 18);
      const py = rng.int(GROUND_Y + 4, PLAZA_BOT - 6);
      e.push(
        <rect
          key={`p-${i}`}
          x={px}
          y={py}
          width={rng.int(6, 14)}
          height={rng.int(2, 3)}
          fill="#7aa0b5"
          opacity={0.22}
        />
      );
    }
    return <g>{e}</g>;
  }, [isWet, GROUND_Y, PLAZA_BOT, LWIDTH, rng]);

  /* ---------------------------------------------------------
     Building footprint
  --------------------------------------------------------- */

  // Zoomed-out effect = smaller building width fraction
  const BUILDING_W_FRAC = 0.38; // was ~0.46
  const buildingHeight = (h: number) => {
    const base = Math.floor(h * 0.34);
    switch (cfg.style) {
      case 'medieval_court': return base + 10;
      case 'roman_forum': return base - 2;
      case 'renaissance_palazzo': return base + 6;
      case 'pagoda_hall': return base + 8;
      case 'islamic_complex': return base + 4;
      case 'modern_parliament': return base - 6;
      default: return base;
    }
  };

  function renderMainBuilding(cx: number) {
    const bw = Math.floor(LWIDTH * BUILDING_W_FRAC);
    const bh = buildingHeight(LHEIGHT);
    const left = cx - Math.floor(bw / 2);
    const top = GROUND_Y - bh;

    const annexW = Math.floor(bw * 0.30);
    const annexH = Math.floor(bh * 0.68);

    const snowCap = (x: number, y: number, w: number) =>
      isSnowy ? <rect x={x} y={y - 1} width={w} height={1} fill="#FFFFFF" /> : null;

    const windowsGrid = (x: number, y: number, w: number, h: number, cols: number, rows: number, color: string) => {
      if (w <= 4 || h <= 4) return null;
      const pad = 3;
      const cellW = Math.max(2, Math.floor((w - pad * 2) / cols));
      const cellH = Math.max(2, Math.floor((h - pad * 2) / rows));
      const rects: JSX.Element[] = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          rects.push(
            <rect
              key={`win-${x}-${y}-${r}-${c}`}
              x={x + pad + c * cellW + 1}
              y={y + pad + r * cellH + 1}
              width={Math.max(1, cellW - 2)}
              height={Math.max(1, cellH - 2)}
              fill={color}
              opacity={cfg.style === 'modern_parliament' ? 0.85 : 1}
            />
          );
        }
      }
      return rects;
    };

    // Common parapet/balcony Y for guard patrol (exported for NPC surfaces)
    const parapetY = top + Math.floor(bh * 0.45);

    // MAIN BODY
    const main = (
      <g>
        {/* Body */}
        <rect x={left} y={top} width={bw} height={bh} fill={cfg.wall} />
        {/* Lower body shadow tint */}
        <rect x={left} y={top + Math.floor(bh * 0.6)} width={bw} height={Math.ceil(bh * 0.4)} fill={cfg.shadow} opacity={0.35} />
        {/* Roof band */}
        <rect x={left} y={top - 3} width={bw} height={3} fill={cfg.roof} />
        {snowCap(left, top - 3, bw)}

        {/* Entrance & steps */}
        <rect x={cx - 6} y={GROUND_Y - 14} width={12} height={14} fill={cfg.dark} />
        <rect x={cx - 8}  y={GROUND_Y - 3}  width={16} height={1} fill={cfg.trim} />
        <rect x={cx - 10} y={GROUND_Y - 2}  width={20} height={1} fill={cfg.trim} />
        <rect x={cx - 12} y={GROUND_Y - 1}  width={24} height={1} fill={cfg.trim} />

        {/* Style-specific façade details */}
        {(() => {
          switch (cfg.style) {
            case 'roman_forum': {
              const pedH = 10;
              return (
                <>
                  <polygon points={`${left},${top} ${cx},${top - pedH} ${left + bw},${top}`} fill={cfg.roof} />
                  {snowCap(left, top, bw)}
                  {Array.from({ length: 6 }).map((_, i) => {
                    const colX = left + 8 + i * Math.floor((bw - 16) / 5.5);
                    return <rect key={`col-${i}`} x={colX} y={top + 12} width={3} height={bh - 18} fill={cfg.trim} />;
                  })}
                  {windowsGrid(left + 10, top + 30, bw - 20, bh - 60, 6, 2, '#2E3136')}
                </>
              );
            }
            case 'medieval_court': {
              const spireX = cx + Math.floor(bw * 0.26);
              return (
                <>
                  {/* Arches row */}
                  {Array.from({ length: 5 }).map((_, i) => {
                    const aW = 12, aH = 16;
                    const ax = left + 12 + i * Math.floor((bw - 24) / 5);
                    const ay = GROUND_Y - aH - 6;
                    return (
                      <g key={`arch-${i}`}>
                        <rect x={ax + 5} y={ay + 4} width={2} height={aH - 4} fill={cfg.dark} />
                        <polygon points={`${ax},${ay + 6} ${ax + aW / 2},${ay} ${ax + aW},${ay + 6}`} fill={cfg.dark} />
                      </g>
                    );
                  })}
                  {/* Spire */}
                  <polygon points={`${spireX},${top - 18} ${spireX - 4},${top} ${spireX + 4},${top}`} fill={cfg.roof} />
                  {snowCap(spireX - 4, top, 8)}
                  {windowsGrid(left + 14, top + 22, bw - 28, bh - 70, 5, 2, '#22242A')}
                </>
              );
            }
            case 'renaissance_palazzo': {
              const pedH = 8;
              return (
                <>
                  <polygon points={`${cx - 24},${top} ${cx},${top - pedH} ${cx + 24},${top}`} fill={cfg.roof} />
                  {snowCap(cx - 24, top, 48)}
                  <rect x={left} y={top - 6} width={bw} height={3} fill={cfg.trim} />
                  {Array.from({ length: Math.floor(bw / 8) }).map((_, i) => (
                    <rect key={`bal-${i}`} x={left + i * 8 + 2} y={top - 9} width={2} height={3} fill={cfg.dark} />
                  ))}
                  {Array.from({ length: 6 }).map((_, i) => (
                    <rect key={`pil-${i}`} x={left + 10 + i * Math.floor((bw - 20) / 5.5)} y={top + 10} width={2} height={bh - 24} fill={cfg.trim} />
                  ))}
                  {windowsGrid(left + 10, top + 28, bw - 20, bh - 60, 6, 2, '#2A2C30')}
                </>
              );
            }
            case 'victorian_parliament': {
              const gX = cx;
              return (
                <>
                  <polygon points={`${gX - 18},${top} ${gX},${top - 10} ${gX + 18},${top}`} fill={cfg.roof} />
                  {snowCap(gX - 18, top, 36)}
                  <circle cx={gX} cy={top + 2} r={3} fill={cfg.trim} />
                  <rect x={gX - 1} y={top - 1} width={1} height={3} fill={cfg.dark} />
                  <rect x={gX} y={top + 1} width={2} height={1} fill={cfg.dark} />
                  {windowsGrid(left + 12, top + 24, bw - 24, bh - 56, 7, 2, '#24282C')}
                </>
              );
            }
            case 'modern_parliament': {
              return (
                <>
                  <rect x={left - 2} y={top - 2} width={bw + 4} height={2} fill={cfg.roof} />
                  {snowCap(left - 2, top - 2, bw + 4)}
                  {windowsGrid(left + 6, top + 10, bw - 12, bh - 20, 10, 4, cfg.accent)}
                </>
              );
            }
            case 'pagoda_hall': {
              const tiers = 3;
              const tierH = Math.floor((bh - 8) / tiers);
              const tier = (i: number) => {
                const ty = top + i * tierH + 6;
                const tw = bw - i * 16;
                const tx = cx - Math.floor(tw / 2);
                return (
                  <g key={`tier-${i}`}>
                    <rect x={tx} y={ty} width={tw} height={tierH - 4} fill={cfg.wall} />
                    <rect x={tx - 3} y={ty - 2} width={tw + 6} height={2} fill={cfg.roof} />
                    <rect x={tx - 4} y={ty - 3} width={2} height={2} fill={cfg.roof} />
                    <rect x={tx + tw + 2} y={ty - 3} width={2} height={2} fill={cfg.roof} />
                    {snowCap(tx - 3, ty - 2, tw + 6)}
                  </g>
                );
              };
              return (
                <>
                  {Array.from({ length: tiers }).map((_, i) => tier(i))}
                  {windowsGrid(left + 12, top + 16, bw - 24, bh - 48, 6, 3, '#2A2C30')}
                </>
              );
            }
            case 'islamic_complex': {
              const domeR = 12;
              return (
                <>
                  <circle cx={cx} cy={top + 6} r={domeR} fill={cfg.roof} />
                  {snowCap(cx - domeR, top + 6, domeR * 2)}
                  <rect x={cx - 16} y={GROUND_Y - 24} width={32} height={24} fill={cfg.trim} />
                  <polygon points={`${cx - 16},${GROUND_Y - 12} ${cx},${GROUND_Y - 28} ${cx + 16},${GROUND_Y - 12}`} fill={cfg.trim} />
                  <rect x={cx - 10} y={GROUND_Y - 16} width={20} height={16} fill={cfg.dark} />
                  {windowsGrid(left + 10, top + 24, bw - 20, bh - 58, 6, 2, '#222529')}
                </>
              );
            }
            case 'indian_darbar': {
              const chX = cx - Math.floor(bw * 0.28);
              const ch2X = cx + Math.floor(bw * 0.28);
              const ch = (x: number) => (
                <>
                  <rect x={x - 6} y={top + 4} width={12} height={10} fill={cfg.wall} />
                  <polygon points={`${x - 8},${top + 4} ${x},${top - 2} ${x + 8},${top + 4}`} fill={cfg.roof} />
                  {snowCap(x - 8, top + 4, 16)}
                </>
              );
              return (
                <>
                  {ch(chX)}
                  {ch(ch2X)}
                  <rect x={cx - 12} y={GROUND_Y - 18} width={24} height={18} fill={cfg.trim} />
                  <polygon points={`${cx - 12},${GROUND_Y - 6} ${cx},${GROUND_Y - 22} ${cx + 12},${GROUND_Y - 6}`} fill={cfg.trim} />
                  <rect x={cx - 8} y={GROUND_Y - 14} width={16} height={14} fill={cfg.dark} />
                  {windowsGrid(left + 12, top + 24, bw - 24, bh - 56, 6, 2, '#26282C')}
                </>
              );
            }
            case 'sahelian_citadel': {
              const butt = 7;
              return (
                <>
                  {Array.from({ length: butt }).map((_, i) => {
                    const bx = left + 6 + i * Math.floor((bw - 12) / (butt - 1));
                    return (
                      <polygon key={`butt-${i}`} points={`${bx},${top + 10} ${bx - 2},${GROUND_Y} ${bx + 2},${GROUND_Y}`} fill={cfg.roof} />
                    );
                  })}
                  {windowsGrid(left + 14, top + 28, bw - 28, bh - 60, 5, 2, '#2B2D31')}
                </>
              );
            }
            case 'meso_civic': {
              const frY = top + 12;
              return (
                <>
                  <rect x={left} y={frY} width={bw} height={3} fill={cfg.accent} />
                  {snowCap(left, frY, bw)}
                  <rect x={left} y={top + 6} width={3} height={bh - 6} fill={cfg.shadow} />
                  <rect x={left + bw - 3} y={top + 6} width={3} height={bh - 6} fill={cfg.shadow} />
                  {windowsGrid(left + 14, top + 26, bw - 28, bh - 58, 6, 2, '#24272B')}
                </>
              );
            }
            case 'oceanic_meeting':
            case 'open_field': {
              // Open-air council ground / carved posts & ring
              const ringR = Math.floor(bw * 0.28);
              return (
                <>
                  {/* Stone circle / posts */}
                  {Array.from({ length: 10 }).map((_, i) => {
                    const angle = (i / 10) * Math.PI * 2;
                    const px = cx + Math.floor(Math.cos(angle) * ringR);
                    const py = GROUND_Y - 2 + Math.floor(Math.sin(angle) * (ringR * 0.35));
                    return <rect key={`post-${i}`} x={px - 1} y={py - 6} width={2} height={6} fill={cfg.dark} />;
                  })}
                  {/* Low meeting house at back */}
                  <rect x={left + Math.floor(bw * 0.15)} y={GROUND_Y - 18} width={Math.floor(bw * 0.7)} height={14} fill={cfg.wall} />
                  <rect x={left + Math.floor(bw * 0.14)} y={GROUND_Y - 20} width={Math.floor(bw * 0.72)} height={2} fill={cfg.roof} />
                </>
              );
            }
            default:
              return windowsGrid(left + 10, top + 16, bw - 20, bh - 40, 6, 3, '#2A2C30');
          }
        })()}
        {/* Parapet / balcony rail (shared for guard patrol when present) */}
        <rect x={left} y={parapetY} width={bw} height={2} fill={cfg.trim} />
        {Array.from({ length: Math.floor(bw / 8) }).map((_, i) => (
          <rect key={`merl-${i}`} x={left + i * 8 + 2} y={parapetY - 3} width={2} height={3} fill={cfg.dark} />
        ))}

        {/* Flag (wind) */}
        {(() => {
          const flagX = cx + Math.floor(bw * 0.28);
          const flagTop = top - 10;
          const bend = Math.floor(Math.sin((t + 13) / (8 - Math.floor(wind * 4))) * (2 + Math.floor(6 * wind)));
          const c = flagColor(culturalZone);
          return (
            <g>
              <rect x={flagX} y={flagTop} width={1} height={16} fill={cfg.dark} />
              <rect x={flagX + 1} y={flagTop + 1} width={8} height={3} fill={c} />
              <rect x={flagX + 1 + Math.max(0, bend)} y={flagTop + 4} width={8} height={3} fill={c} />
              <rect x={flagX + 1 + Math.max(0, bend - 1)} y={flagTop + 7} width={8} height={3} fill={c} />
            </g>
          );
        })()}
      </g>
    );

    // Side annexes (lighter, smaller)
    const annex = (side: 'left' | 'right') => {
      const w = annexW, h = annexH;
      const x = side === 'left' ? left - Math.floor(w * 0.1) : left + bw - Math.floor(w * 0.9);
      const y = GROUND_Y - h;
      return (
        <g key={side}>
          <rect x={x} y={y} width={w} height={h} fill={cfg.wall} />
          <rect x={x} y={y - 2} width={w} height={2} fill={cfg.roof} />
          {snowCap(x, y - 2, w)}
          {windowsGrid(x + 6, y + 12, w - 12, h - 24, 3, 2, '#2C2E33')}
        </g>
      );
    };

    return { group: <g>{annex('left')}{annex('right')}{main}</g>, parapetY };
  }

  /* ---------------------------------------------------------
     Forecourt dressing
  --------------------------------------------------------- */

  const planters = useMemo(() => {
    const items: JSX.Element[] = [];
    for (let i = 0; i < 5; i++) {
      const x = Math.floor(LWIDTH * 0.16) + i * Math.floor((LWIDTH * 0.68) / 4);
      const y = GROUND_Y + 4;
      items.push(
        <g key={`pl-${i}`}>
          <rect x={x} y={y} width={6} height={3} fill="#5a4a3a" />
          <rect x={x + 2} y={y - 2} width={2} height={2} fill="#2e5b2e" />
          {/* tiny shadow */}
          <rect x={x} y={y + shadowLen} width={6} height={1} fill={shadowTone} opacity={0.25} />
        </g>
      );
    }
    return items;
  }, [LWIDTH, GROUND_Y, shadowLen]);

  /* ---------------------------------------------------------
     NPCs (ground + parapet surfaces only)
     Baselines:
       - ground: FOOT_G = GROUND_Y - 3
       - parapet: FOOT_P = parapetY - 3
  --------------------------------------------------------- */

  // We’ll create two path domains: ground forecourt & parapet.
  // Everyone’s y is snapped to FOOT_G or FOOT_P; no floating sprites.
  const [npcs] = useState(() => {
    const list: Array<{
      surface: 'ground' | 'parapet';
      x: number;
      dir: 1 | -1;
      speed: number;
      kind: 'guard' | 'clerk' | 'petitioner';
    }> = [];

    // Queue of petitioners near the central door (ground)
    const doorX = Math.floor(LWIDTH / 2);
    const queueCount = 3 + rng.int(0, 2);
    for (let i = 0; i < queueCount; i++) {
      list.push({
        surface: 'ground',
        x: doorX - 10 - i * 8,
        dir: 1,
        speed: 0.15 + rng.range(0, 0.10),
        kind: 'petitioner',
      });
    }

    // Clerk traversing the forecourt (ground)
    list.push({
      surface: 'ground',
      x: Math.floor(LWIDTH * 0.22),
      dir: 1,
      speed: 0.28,
      kind: 'clerk',
    });

    // Guard patrol (parapet) — single sprite; will use parapet surface we compute after building render
    list.push({
      surface: 'parapet',
      x: doorX - Math.floor(LWIDTH * 0.14),
      dir: 1,
      speed: 0.25,
      kind: 'guard',
    });

    return list;
  });

  // Sprite drawing
  function sprite(x: number, baselineY: number, dir: 1 | -1, kind: string, idx: number) {
    const phase = Math.floor((t + idx * 3) / 6) % 2;
    const leg = phase ? 1 : -1;
    const body = '#2A2A2A';
    const head = '#E8C39E';
    const gear = kind === 'guard' ? '#6B7280' : '#8C6852';

    return (
      <g key={`npc-${idx}`} transform={`translate(${Math.floor(x)}, ${Math.floor(baselineY)})`}>
        {/* simple drop shadow */}
        <rect x={-2} y={3 + shadowLen - 1} width={4} height={1} fill={shadowTone} opacity={0.18} />
        {/* head */}
        <rect x={-1} y={-7} width={2} height={2} fill={head} />
        {kind === 'guard' ? <rect x={-2} y={-8} width={4} height={1} fill={gear} /> : null}
        {/* body */}
        <rect x={-2} y={-5} width={4} height={5} fill={body} />
        {/* arms */}
        <rect x={-3} y={-4} width={1} height={2} fill={head} />
        <rect x={2}  y={-4} width={1} height={2} fill={head} />
        {/* legs */}
        <rect x={-1 + leg * dir} y={0} width={1} height={3} fill="#1F1F1F" />
        <rect x={ 1 - leg * dir} y={0} width={1} height={3} fill="#1F1F1F" />
        {/* prop */}
        {kind === 'clerk' ? <rect x={-4} y={-5} width={2} height={2} fill="#C9A66B" /> : null}
      </g>
    );
  }

  // Render all in one go so we can pass the parapet baseline from building
  const building = renderMainBuilding(Math.floor(LWIDTH / 2));
  const FOOT_G = GROUND_Y - 3;
  const FOOT_P = building.parapetY - 3;

  // Animate NPC movement; clamp to their lane extents and keep Y to FOOTS
  const animatedNPCs = useMemo(() => {
    return npcs.map((n, i) => {
      const spanLeft  = Math.floor(LWIDTH * 0.16);
      const spanRight = Math.floor(LWIDTH * 0.84);
      if (n.surface === 'ground') {
        // walk back and forth across forecourt
        const span = spanRight - spanLeft;
        const p = ((t * n.speed) % (span * 2));
        const dir = p <= span ? 1 : -1;
        const x   = p <= span ? spanLeft + p : spanLeft + (span * 2 - p);
        return { ...n, x, dir, y: FOOT_G };
      } else {
        // parapet patrol (shorter span)
        const center = Math.floor(LWIDTH / 2);
        const left = center - Math.floor(LWIDTH * 0.12);
        const right = center + Math.floor(LWIDTH * 0.12);
        const span = right - left;
        const p = ((t * n.speed) % (span * 2));
        const dir = p <= span ? 1 : -1;
        const x   = p <= span ? left + p : left + (span * 2 - p);
        return { ...n, x, dir, y: FOOT_P };
      }
    });
  }, [npcs, t, LWIDTH, FOOT_G, FOOT_P]);

  /* ---------------------------------------------------------
     Render
  --------------------------------------------------------- */

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${LWIDTH} ${LHEIGHT}`}
      style={{ imageRendering: 'pixelated', background: 'transparent' }}
      className="absolute inset-0 w-full h-full"
      shapeRendering="crispEdges"
    >
      {/* Transparent sky — let your global sky layer show through */}

      {/* Distant landscape & horizon */}
      <g>{landscape}</g>

      {/* Plaza / ground */}
      <g>
        {/* plaza base */}
        <rect x={0} y={GROUND_Y} width={LWIDTH} height={PLAZA_BOT - GROUND_Y} fill="#8b7969" />
        {/* checker depth */}
        {Array.from({ length: Math.ceil((PLAZA_BOT - GROUND_Y) / TILE) }).map((_, ry) =>
          Array.from({ length: Math.ceil(LWIDTH / TILE) }).map((__, rx) => {
            const on = (rx + ry) % 2 === 0;
            return (
              <rect
                key={`ck-${rx}-${ry}`}
                x={rx * TILE}
                y={GROUND_Y + ry * TILE}
                width={TILE}
                height={TILE}
                fill={on ? '#8a7664' : '#7a6858'}
                opacity={0.14}
              />
            );
          })
        )}
        {/* joints */}
        <g>{gridLines}</g>
        {/* puddles/snow drifts */}
        {puddles}
        {isSnowy && Array.from({ length: 6 }).map((_, i) => (
          <rect key={`sd-${i}`} x={i * Math.floor(LWIDTH / 6) + rng.int(-6, 6)} y={GROUND_Y + 4} width={rng.int(8, 16)} height={2} fill="#FFFFFF" opacity={0.75} />
        ))}
      </g>

      {/* Building */}
      {building.group}

      {/* Forecourt decor */}
      <g>
        {planters}
        {/* Forum fountain/statue if forum-like archetype */}
        {archetype === SpecialMapArchetype.GOVERNMENT_FORUM && (
          <g>
            <rect x={Math.floor(LWIDTH / 2) - 7} y={GROUND_Y + 2} width={14} height={2} fill="#6f8ea1" opacity={0.7} />
            <rect x={Math.floor(LWIDTH / 2) - 2} y={GROUND_Y - 4} width={4} height={6} fill="#bfc7cf" />
            {/* fountain shadow */}
            <rect x={Math.floor(LWIDTH / 2) - 8} y={GROUND_Y + 2 + shadowLen} width={16} height={1} fill={shadowTone} opacity={0.25} />
          </g>
        )}
      </g>

      {/* NPCs (all baselines snapped to FOOT_G or FOOT_P) */}
      <g>
        {animatedNPCs.map((n, i) => sprite(n.x, n.y!, n.dir, n.kind, i))}
      </g>
    </svg>
  );
};

export default React.memo(GovernmentDistrictBanner);

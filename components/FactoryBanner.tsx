/**
 * components/FactoryBanner.tsx
 * V2: Transparent-sky composition with TimeAwareBackground + cultural/era customization
 * - Sky is NOT drawn in SVG; TimeAwareBackground owns time/weather/climate
 * - Static RNG via useMemo for stable layouts (no re-generation per frame)
 * - Culture/era-aware factory types that only exist from Renaissance-Early Modern onward
 * - Animated elements are separate from static elements
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import TimeAwareBackground from './TimeAwareBackground';
import WeatherEffects from './WeatherEffects';
import { ClimateType, Season, TimeOfDay } from '../types';
import type { WeatherState } from '../services/weatherService';

interface FactoryBannerProps {
  width?: number;
  height?: number;
  climate?: ClimateType;
  season: Season;
  timeOfDay: TimeOfDay;
  era?: string;
  culturalZone?: string;
  industryName?: string;
  isRuined?: boolean;
  seed?: number;
  weather?: WeatherState | null;
  enableFxLayer?: boolean;
}

/* ----------------------- Seeded RNG ----------------------- */

class SeededRandom {
  private seed: number;
  constructor(seed: number) { this.seed = seed; }
  next() { this.seed = (this.seed * 9301 + 49297) % 233280; return this.seed / 233280; }
  range(min: number, max: number) { return min + this.next() * (max - min); }
  int(min: number, max: number) { return Math.floor(this.range(min, max + 1)); }
  pick<T>(a: T[]) { return a[Math.floor(this.range(0, a.length))]; }
}

const hashSeed = (s: string) => {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h % 233279) + 1;
};

/* ----------------------- Constants ----------------------- */

const GROUND_Y = 125; // Match FishingHutBanner
export const WATER_OFFSET = 15;

// Utility functions
const ipx = (n: number) => Math.round(n);

type TOD = 'dawn'|'day'|'dusk'|'night';
const toTOD = (t: TimeOfDay): TOD => {
  if (t === 'Dawn') return 'dawn';
  if (t === 'Dusk') return 'dusk';
  if (t === 'Night') return 'night';
  return 'day';
};

function toSeasonString(season?: Season | string | null): 'spring'|'summer'|'fall'|'winter'|null {
  if (!season) return null;
  const s = String(season).toLowerCase();
  if (s.startsWith('spr')) return 'spring';
  if (s.startsWith('sum')) return 'summer';
  if (s.startsWith('aut') || s.startsWith('fal')) return 'fall';
  if (s.startsWith('win')) return 'winter';
  return null;
}

function toClimateString(climate?: ClimateType | string | null): 'temperate'|'tropical'|'arid'|'arctic'|'mediterranean'|'continental'|null {
  if (!climate) return null;
  const c = String(climate).toUpperCase();
  if (c.includes('TEMPERATE')) return 'temperate';
  if (c.includes('TROP')) return 'tropical';
  if (c.includes('SEMI')) return 'tropical';
  if (c.includes('ARID') || c.includes('DESERT')) return 'arid';
  if (c.includes('MEDITERRANEAN')) return 'mediterranean';
  if (c.includes('COLD') || c.includes('ARCTIC') || c.includes('POLAR')) return 'arctic';
  return 'continental';
}

function todToClock(tod: TOD) {
  if (tod === 'dawn') return { h: 6, m: 30 };
  if (tod === 'dusk') return { h: 19, m: 30 };
  if (tod === 'night') return { h: 23, m: 0 };
  return { h: 13, m: 0 };
}

const getGroundPalette = (climate?: ClimateType, season?: Season) => {
  const c = String(climate || 'TEMPERATE').toUpperCase();
  const s = String(season || '').toLowerCase();

  if (s === 'winter') {
    if (c.includes('COLD')) return { ground: '#F0F8FF', vegetation: '#E0E8EF', accent: '#C0D0E0', soil: '#D8E0E8' };
    if (c.includes('TEMPERATE')) return { ground: '#E8F0F8', vegetation: '#D0E0F0', accent: '#B0C0D0', soil: '#C8D8E8' };
    if (c.includes('MEDITERRANEAN')) return { ground: '#86EFAC', vegetation: '#22C55E', accent: '#16A34A', soil: '#7A8060' };
  }

  if (c.includes('COLD')) return { ground: '#F0F8FF', vegetation: '#E0E8EF', accent: '#C0D0E0', soil: '#D8E0E8' };
  if (c.includes('ARID')) return { ground: '#D2B48C', vegetation: '#CD853F', accent: '#A0826D', soil: '#8B7355' };
  if (c.includes('MEDITERRANEAN')) return { ground: '#B4C5A0', vegetation: '#8B9070', accent: '#7A8060', soil: '#6B5D4F' };
  if (c.includes('TROPICAL')) return { ground: '#4A7C59', vegetation: '#059669', accent: '#047857', soil: '#2D5436' };
  if (c.includes('SEMITROPICAL')) return { ground: '#6EE7B7', vegetation: '#32CD32', accent: '#228B22', soil: '#4A7C59' };

  return { ground: '#86EFAC', vegetation: '#22C55E', accent: '#16A34A', soil: '#7A8060' };
};

/* ----------------------- Factory Types & Details ----------------------- */

interface FactorySpec {
  type: string;
  chimneys: number;
  chimneyHeight: number;
  buildingWidth: number;
  buildingHeight: number;
  roofStyle: 'peaked' | 'sawtooth' | 'flat' | 'curved' | 'mansard' | 'shed';
  smokeColor: string;
  smokeDensity: number;
  hasWaterTower?: boolean;
  hasRailSpur?: boolean;
  hasLoadingDock?: boolean;
  hasCrane?: boolean;
  hasConveyor?: boolean;
  primaryColor: string;
  secondaryColor: string;
  products: string[];
  workers: { count: number; clothing: string; tools: string[] };
  specialFeatures?: string[];
}

const FACTORY_SPECS: Record<string, FactorySpec> = {
  'steel': {
    type: 'steel',
    chimneys: 3,
    chimneyHeight: 50,
    buildingWidth: 200,
    buildingHeight: 45,
    roofStyle: 'peaked',
    smokeColor: '#3A3A3A',
    smokeDensity: 0.8,
    hasWaterTower: true,
    hasRailSpur: true,
    hasLoadingDock: true,
    hasCrane: true,
    primaryColor: '#4A4A4A',
    secondaryColor: '#8B4513',
    products: ['I-beams', 'rails', 'plates'],
    workers: { count: 8, clothing: '#4A4A4A', tools: ['tongs', 'ladle', 'hammer'] },
    specialFeatures: ['blast_furnace', 'slag_heap', 'cooling_tower']
  },
  'textile': {
    type: 'textile',
    chimneys: 2,
    chimneyHeight: 35,
    buildingWidth: 180,
    buildingHeight: 35,
    roofStyle: 'sawtooth',
    smokeColor: '#606060',
    smokeDensity: 0.5,
    hasWaterTower: true,
    hasRailSpur: false,
    hasLoadingDock: true,
    primaryColor: '#8B7355',
    secondaryColor: '#D2B48C',
    products: ['cloth bolts', 'yarn spools', 'finished garments'],
    workers: { count: 12, clothing: '#708090', tools: ['spindle', 'shuttle', 'scissors'] },
    specialFeatures: ['water_wheel', 'dye_vats', 'cotton_bales']
  },
  'chemical': {
    type: 'chemical',
    chimneys: 4,
    chimneyHeight: 40,
    buildingWidth: 160,
    buildingHeight: 30,
    roofStyle: 'flat',
    smokeColor: '#5A5A3A',
    smokeDensity: 0.6,
    hasWaterTower: true,
    hasRailSpur: true,
    primaryColor: '#556B2F',
    secondaryColor: '#4A5A3A',
    products: ['barrels', 'canisters', 'bottles'],
    workers: { count: 6, clothing: '#FFD700', tools: ['flask', 'gauge', 'valve'] },
    specialFeatures: ['storage_tanks', 'pipe_maze', 'cooling_pond']
  },
  'automobile': {
    type: 'automobile',
    chimneys: 1,
    chimneyHeight: 30,
    buildingWidth: 220,
    buildingHeight: 40,
    roofStyle: 'flat',
    smokeColor: '#606060',
    smokeDensity: 0.4,
    hasRailSpur: true,
    hasLoadingDock: true,
    hasConveyor: true,
    primaryColor: '#4169E1',
    secondaryColor: '#C0C0C0',
    products: ['car bodies', 'engines', 'tires'],
    workers: { count: 10, clothing: '#4169E1', tools: ['wrench', 'welder', 'drill'] },
    specialFeatures: ['assembly_line', 'test_track', 'parts_yard']
  },
  'shipyard': {
    type: 'shipyard',
    chimneys: 2,
    chimneyHeight: 35,
    buildingWidth: 250,
    buildingHeight: 50,
    roofStyle: 'curved',
    smokeColor: '#505050',
    smokeDensity: 0.5,
    hasCrane: true,
    hasRailSpur: true,
    primaryColor: '#708090',
    secondaryColor: '#4682B4',
    products: ['hull sections', 'propellers', 'masts'],
    workers: { count: 15, clothing: '#2F4F4F', tools: ['riveter', 'torch', 'sledge'] },
    specialFeatures: ['dry_dock', 'slipway', 'gantry_crane']
  },
  'brewery': {
    type: 'brewery',
    chimneys: 1,
    chimneyHeight: 30,
    buildingWidth: 140,
    buildingHeight: 35,
    roofStyle: 'mansard',
    smokeColor: '#8B7355',
    smokeDensity: 0.3,
    hasWaterTower: true,
    hasLoadingDock: true,
    primaryColor: '#8B4513',
    secondaryColor: '#D2691E',
    products: ['barrels', 'bottles', 'crates'],
    workers: { count: 5, clothing: '#8B4513', tools: ['paddle', 'thermometer', 'tap'] },
    specialFeatures: ['copper_kettles', 'grain_silos', 'barrel_yard']
  },
  'glassworks': {
    type: 'glassworks',
    chimneys: 2,
    chimneyHeight: 45,
    buildingWidth: 150,
    buildingHeight: 35,
    roofStyle: 'peaked',
    smokeColor: '#696969',
    smokeDensity: 0.6,
    primaryColor: '#87CEEB',
    secondaryColor: '#4682B4',
    products: ['windows', 'bottles', 'lamps'],
    workers: { count: 7, clothing: '#8B7355', tools: ['pipe', 'shears', 'paddle'] },
    specialFeatures: ['glory_holes', 'annealing_ovens', 'cullet_pile']
  },
  'pottery': {
    type: 'pottery',
    chimneys: 2,
    chimneyHeight: 25,
    buildingWidth: 120,
    buildingHeight: 28,
    roofStyle: 'peaked',
    smokeColor: '#8B7355',
    smokeDensity: 0.4,
    primaryColor: '#D2691E',
    secondaryColor: '#A0522D',
    products: ['vases', 'tiles', 'bricks'],
    workers: { count: 6, clothing: '#D2B48C', tools: ['wheel', 'kiln', 'glaze'] },
    specialFeatures: ['bottle_kilns', 'clay_yard', 'glazing_shed']
  }
};

// Cultural factory specializations by era and region
const getCulturalFactoryTypes = (culturalZone?: string, year?: number): string[] => {
  const zone = (culturalZone || 'european').toLowerCase();
  const y = year || 1500;

  // Factories only exist from Renaissance-Early Modern onward
  if (y < 1500) return [];

  if (zone.includes('east') || zone.includes('asia')) {
    if (y < 1600) return ['pottery', 'textile', 'brewery'];
    if (y < 1800) return ['pottery', 'textile', 'glassworks', 'shipyard'];
    if (y < 1900) return ['steel', 'textile', 'shipyard', 'pottery'];
    return ['steel', 'automobile', 'chemical', 'shipyard'];
  }

  if (zone.includes('mena') || zone.includes('middle')) {
    if (y < 1600) return ['pottery', 'glassworks', 'textile'];
    if (y < 1800) return ['textile', 'glassworks', 'pottery'];
    if (y < 1900) return ['textile', 'chemical', 'glassworks'];
    return ['chemical', 'steel', 'textile'];
  }

  if (zone.includes('african')) {
    if (y < 1700) return ['pottery', 'brewery'];
    if (y < 1900) return ['textile', 'pottery', 'brewery'];
    return ['textile', 'chemical', 'brewery'];
  }

  if (zone.includes('american')) {
    if (y < 1600) return ['pottery'];
    if (y < 1800) return ['brewery', 'shipyard', 'glassworks'];
    if (y < 1900) return ['steel', 'textile', 'brewery', 'shipyard'];
    return ['automobile', 'steel', 'chemical', 'shipyard'];
  }

  // European default
  if (y < 1600) return ['brewery', 'glassworks', 'textile'];
  if (y < 1800) return ['textile', 'steel', 'glassworks', 'brewery'];
  if (y < 1900) return ['steel', 'textile', 'chemical', 'shipyard'];
  return ['automobile', 'steel', 'chemical', 'shipyard'];
};

const getFactorySpec = (industryName?: string, culturalZone?: string, era?: string): FactorySpec => {
  const year = parseInt(era || '1500', 10);

  // No factories before Renaissance-Early Modern
  if (year < 1500) {
    return {
      type: 'workshop',
      chimneys: 0,
      chimneyHeight: 0,
      buildingWidth: 80,
      buildingHeight: 25,
      roofStyle: 'peaked',
      smokeColor: '#8B7355',
      smokeDensity: 0.1,
      primaryColor: '#8B4513',
      secondaryColor: '#D2691E',
      products: ['tools', 'pottery'],
      workers: { count: 3, clothing: '#8B7355', tools: ['hammer', 'chisel'] }
    };
  }

  const culturalTypes = getCulturalFactoryTypes(culturalZone, year);
  const name = (industryName || 'general').toLowerCase();

  // Try to match industry name to spec
  if (name.includes('steel') || name.includes('iron')) return FACTORY_SPECS.steel;
  if (name.includes('textile') || name.includes('cotton') || name.includes('wool')) return FACTORY_SPECS.textile;
  if (name.includes('chemical') || name.includes('refin')) return FACTORY_SPECS.chemical;
  if (name.includes('auto') || name.includes('car')) return FACTORY_SPECS.automobile;
  if (name.includes('ship')) return FACTORY_SPECS.shipyard;
  if (name.includes('brew') || name.includes('beer')) return FACTORY_SPECS.brewery;
  if (name.includes('glass')) return FACTORY_SPECS.glassworks;
  if (name.includes('pottery') || name.includes('ceramic')) return FACTORY_SPECS.pottery;

  // Default to culturally appropriate type
  const defaultType = culturalTypes[0] || 'textile';
  return FACTORY_SPECS[defaultType] || FACTORY_SPECS.textile;
};

/* ----------------------- Component ----------------------- */

const FactoryBanner: React.FC<FactoryBannerProps> = ({
  width = 600,
  height = 250,
  climate = ClimateType.TEMPERATE,
  season,
  timeOfDay,
  era = '1850',
  culturalZone = 'european',
  industryName = 'Steel Production',
  isRuined = false,
  seed = 12345,
  weather,
  enableFxLayer = true,
}) => {
  // Derived
  const tod = toTOD(timeOfDay);
  const { h: clockH, m: clockM } = todToClock(tod);
  const seasonStr = toSeasonString(season);
  const climateStr = toClimateString(climate);

  const year = parseInt(era, 10) || 1850;
  const isModern = year >= 1920;
  const isIndustrial = year >= 1800 && year < 1920;
  const isPreIndustrial = year < 1500;
  const isNight = tod === 'night';

  // Layout bands
  const FACTORY_GROUND_Y = Math.min(GROUND_Y, Math.max(80, ipx(height * 0.5)));

  // RNG domains (stable)
  const baseSeed = seed + hashSeed([width, height, String(climate), String(season), era, culturalZone, industryName].join('|'));
  const rng = useMemo(() => new SeededRandom(baseSeed), [baseSeed]);
  const staticRng = useMemo(() => new SeededRandom(seed + 9999), [seed]);

  // Animation frame (for moving elements only)
  const [frame, setFrame] = useState(0);

  // reduced motion
  const [reduced, setReduced] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  // rAF ticker
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const step = reduced ? 0.5 : 1;
      if (!document.hidden && now - last > (reduced ? 80 : 16)) {
        setFrame((f) => f + step);
        last = now;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduced]);

  const spec = useMemo(() => getFactorySpec(industryName, culturalZone, era), [industryName, culturalZone, era]);
  const palette = useMemo(() => getGroundPalette(climate, season), [climate, season]);

  // Static layout (stable per seed + props)
  const layout = useMemo(() => {
    const centerX = width / 2;
    const factoryX = centerX - spec.buildingWidth / 2;
    const factoryY = FACTORY_GROUND_Y - spec.buildingHeight;

    // Workers (positions stable, but animation will move them)
    const workers = Array.from({ length: spec.workers.count }, (_, i) => ({
      id: i,
      baseX: staticRng.range(50, width - 50),
      baseY: FACTORY_GROUND_Y,
      direction: staticRng.pick([-1, 1] as const),
      tool: staticRng.pick(spec.workers.tools),
      cargo: staticRng.pick(spec.products),
      phase: staticRng.range(0, 1000),
    }));

    // Conveyor belt items (if applicable)
    const conveyorItems = spec.hasConveyor ? Array.from({ length: 5 }, (_, i) => ({
      id: i,
      baseX: i * 40,
      type: staticRng.pick(spec.products),
      phase: staticRng.range(0, 100),
    })) : [];

    // Background industrial buildings
    const bgBuildings = Array.from({ length: 8 }, (_, i) => ({
      x: i * (width / 7) + staticRng.range(-20, 20),
      width: staticRng.range(25, 45),
      height: staticRng.range(20, 40),
      hasChimney: staticRng.next() > 0.5,
    }));

    // Smoke chimney positions (stable)
    const chimneys = Array.from({ length: spec.chimneys }, (_, i) => ({
      x: factoryX + 20 + i * (spec.buildingWidth / (spec.chimneys + 1)),
      y: factoryY - spec.chimneyHeight,
      phase: staticRng.range(0, Math.PI * 2),
    }));

    return {
      centerX,
      factoryX,
      factoryY,
      workers,
      conveyorItems,
      bgBuildings,
      chimneys,
    };
  }, [width, height, spec, staticRng, FACTORY_GROUND_Y]);

  // Optional FX: show only in the sky band to avoid double-layering in ocean/ground
  const fxWeather = useMemo<WeatherState | undefined>(() => {
    if (!weather) return undefined;
    // Keep precipitation & lightning etc., but clip to sky area via container
    return { ...weather };
  }, [weather]);

  /* ----------------------- Render Functions ----------------------- */

  const renderBackground = () => {
    return (
      <g>
        {/* Industrial skyline background buildings */}
        <g opacity="0.3">
          {layout.bgBuildings.map((building, i) => (
            <g key={i}>
              <rect
                x={building.x}
                y={FACTORY_GROUND_Y - building.height}
                width={building.width}
                height={building.height}
                fill="#4A4A4A"
              />
              {/* Background chimney */}
              {building.hasChimney && (
                <rect
                  x={building.x + building.width / 2 - 2}
                  y={FACTORY_GROUND_Y - building.height - 10}
                  width="4"
                  height="10"
                  fill="#3A3A3A"
                />
              )}
            </g>
          ))}
        </g>
      </g>
    );
  };

  const renderGround = () => (
    <g>
      <defs>
        <linearGradient id="groundGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={palette.ground} />
          <stop offset="60%" stopColor={palette.ground} opacity="0.95" />
          <stop offset="100%" stopColor={palette.soil} opacity="0.9" />
        </linearGradient>
      </defs>

      <rect x="0" y={FACTORY_GROUND_Y} width={width} height={height - FACTORY_GROUND_Y} fill="url(#groundGrad)" />

      {/* Industrial debris (static positions) */}
      {Array.from({ length: Math.floor(width / 15) }, (_, i) => (
        <rect
          key={i}
          x={i * 15 + staticRng.range(-5, 5)}
          y={FACTORY_GROUND_Y + staticRng.range(0, 5)}
          width={staticRng.range(2, 5)}
          height={staticRng.range(1, 3)}
          fill="#5A5A5A"
          opacity="0.3"
        />
      ))}

      {/* Rail tracks if present */}
      {spec.hasRailSpur && (
        <>
          <rect x="0" y={FACTORY_GROUND_Y + 25} width={width} height="2" fill="#4A4A4A" />
          <rect x="0" y={FACTORY_GROUND_Y + 29} width={width} height="2" fill="#4A4A4A" />
          {Array.from({ length: Math.floor(width / 20) }, (_, i) => (
            <rect key={i} x={i * 20} y={FACTORY_GROUND_Y + 24} width="3" height="8" fill="#654321" />
          ))}
        </>
      )}
    </g>
  );

  const renderFactory = () => {
    const { factoryX, factoryY } = layout;

    return (
      <g>
        {/* Special features behind main building */}
        {spec.specialFeatures?.includes('blast_furnace') && (
          <g>
            <polygon
              points={`${factoryX - 40},${FACTORY_GROUND_Y} ${factoryX - 25},${factoryY - 20} ${factoryX - 10},${FACTORY_GROUND_Y}`}
              fill="#8B4513"
              stroke="#654321"
              strokeWidth="1"
            />
            {!isRuined && (
              <rect
                x={factoryX - 30}
                y={factoryY}
                width="10"
                height="5"
                fill="#FF6347"
                opacity={0.8 + Math.sin(frame * 0.1) * 0.2}
              />
            )}
          </g>
        )}

        {spec.specialFeatures?.includes('water_wheel') && (
          <g transform={`translate(${factoryX - 30}, ${FACTORY_GROUND_Y - 15})`}>
            <circle cx="0" cy="0" r="15" fill="#8B4513" stroke="#654321" strokeWidth="1" />
            <g transform={`rotate(${isRuined ? 0 : (frame * (reduced ? 1 : 2)) % 360})`}>
              {Array.from({ length: 8 }, (_, i) => (
                <rect
                  key={i}
                  x="-2"
                  y="-15"
                  width="4"
                  height="30"
                  fill="#654321"
                  transform={`rotate(${i * 45})`}
                />
              ))}
            </g>
          </g>
        )}

        {/* Main building */}
        <rect
          x={factoryX}
          y={factoryY}
          width={spec.buildingWidth}
          height={spec.buildingHeight}
          fill={isRuined ? '#555' : spec.primaryColor}
          stroke={isRuined ? '#444' : spec.secondaryColor}
          strokeWidth="2"
        />

        {/* Roof */}
        {spec.roofStyle === 'sawtooth' && (
          <g>
            {Array.from({ length: 6 }, (_, i) => (
              <polygon
                key={i}
                points={`${factoryX + i * spec.buildingWidth/6},${factoryY} ${factoryX + i * spec.buildingWidth/6 + spec.buildingWidth/8},${factoryY - 12} ${factoryX + (i + 1) * spec.buildingWidth/6},${factoryY}`}
                fill={isRuined ? '#444' : '#6B4423'}
              />
            ))}
          </g>
        )}
        {spec.roofStyle === 'peaked' && (
          <polygon
            points={`${factoryX - 5},${factoryY} ${layout.centerX},${factoryY - 20} ${factoryX + spec.buildingWidth + 5},${factoryY}`}
            fill={isRuined ? '#444' : '#6B4423'}
          />
        )}
        {spec.roofStyle === 'flat' && (
          <rect x={factoryX} y={factoryY - 3} width={spec.buildingWidth} height="3" fill="#3A3A3A" />
        )}

        {/* Windows */}
        {Array.from({ length: Math.floor(spec.buildingWidth / 25) }, (_, i) => {
          const wx = factoryX + 10 + i * 25;
          const wy = factoryY + 10;
          const lit = isNight && !isRuined && staticRng.next() > 0.2;
          return (
            <g key={i}>
              <rect
                x={wx}
                y={wy}
                width="15"
                height="18"
                fill={isRuined ? '#1A1A1A' : (lit ? '#FFD700' : '#87CEEB')}
                opacity={isRuined ? 1 : (lit ? 0.9 : 0.6)}
              />
              {/* Window panes */}
              <line x1={wx + 7.5} y1={wy} x2={wx + 7.5} y2={wy + 18} stroke="#2A2A2A" strokeWidth="0.5" />
              <line x1={wx} y1={wy + 9} x2={wx + 15} y2={wy + 9} stroke="#2A2A2A" strokeWidth="0.5" />
            </g>
          );
        })}

        {/* Chimneys (static positions) */}
        {layout.chimneys.map((chimney, i) => (
          <g key={i}>
            <rect
              x={chimney.x}
              y={chimney.y}
              width="8"
              height={spec.chimneyHeight}
              fill="#4A4A4A"
              stroke="#2A2A2A"
              strokeWidth="1"
            />
            <rect x={chimney.x - 1} y={chimney.y - 2} width="10" height="4" fill="#2A2A2A" />
          </g>
        ))}

        {/* Main door */}
        <rect
          x={layout.centerX - 10}
          y={FACTORY_GROUND_Y - 15}
          width="20"
          height="15"
          fill={isRuined ? '#1A1A1A' : '#2F1B0C'}
          stroke="#1A1A1A"
          strokeWidth="1"
        />

        {/* Loading dock */}
        {spec.hasLoadingDock && (
          <g>
            <rect x={factoryX + spec.buildingWidth - 40} y={FACTORY_GROUND_Y - 8} width="40" height="8" fill="#8B7355" />
            {spec.products.slice(0, 3).map((product, i) => (
              <rect
                key={i}
                x={factoryX + spec.buildingWidth - 35 + i * 12}
                y={FACTORY_GROUND_Y - 12}
                width="8"
                height="6"
                fill="#D2B48C"
              />
            ))}
          </g>
        )}

        {/* Water tower */}
        {spec.hasWaterTower && (
          <g>
            <rect x={factoryX + spec.buildingWidth + 20} y={FACTORY_GROUND_Y - 40} width="4" height="40" fill="#606060" />
            <rect x={factoryX + spec.buildingWidth + 40} y={FACTORY_GROUND_Y - 40} width="4" height="40" fill="#606060" />
            <ellipse
              cx={factoryX + spec.buildingWidth + 32}
              cy={FACTORY_GROUND_Y - 45}
              rx="18"
              ry="10"
              fill="#87CEEB"
              stroke="#606060"
              strokeWidth="2"
            />
            <polygon
              points={`${factoryX + spec.buildingWidth + 14},${FACTORY_GROUND_Y - 45} ${factoryX + spec.buildingWidth + 32},${FACTORY_GROUND_Y - 60} ${factoryX + spec.buildingWidth + 50},${FACTORY_GROUND_Y - 45}`}
              fill="#8B4513"
            />
          </g>
        )}

        {/* Crane */}
        {spec.hasCrane && (
          <g>
            <rect x={layout.centerX + 80} y={FACTORY_GROUND_Y - 60} width="3" height="60" fill="#4A4A4A" />
            <line
              x1={layout.centerX + 81.5}
              y1={FACTORY_GROUND_Y - 60}
              x2={layout.centerX + 60 + Math.sin(frame * 0.02) * 10}
              y2={FACTORY_GROUND_Y - 40}
              stroke="#3A3A3A"
              strokeWidth="2"
            />
            <rect
              x={layout.centerX + 58 + Math.sin(frame * 0.02) * 10}
              y={FACTORY_GROUND_Y - 40}
              width="8"
              height="10"
              fill={spec.primaryColor}
            />
          </g>
        )}

        {/* Conveyor belt */}
        {spec.hasConveyor && (
          <g>
            <rect x={factoryX} y={FACTORY_GROUND_Y - 5} width="200" height="2" fill="#2A2A2A" />
            <rect x={factoryX} y={FACTORY_GROUND_Y - 3} width="200" height="1" fill="#4A4A4A" />
            {layout.conveyorItems.map((item) => (
              <rect
                key={item.id}
                x={factoryX + ((item.baseX + frame * 0.5) % 200)}
                y={FACTORY_GROUND_Y - 8}
                width="6"
                height="4"
                fill="#8B4513"
              />
            ))}
          </g>
        )}

        {/* Storage tanks for chemical */}
        {spec.specialFeatures?.includes('storage_tanks') && (
          <>
            <ellipse cx={factoryX - 50} cy={FACTORY_GROUND_Y - 15} rx="15" ry="20" fill="#4A5A3A" stroke="#3A4A2A" strokeWidth="1" />
            <ellipse cx={factoryX - 50} cy={FACTORY_GROUND_Y - 35} rx="15" ry="3" fill="#5A6A4A" />
            <ellipse cx={factoryX + spec.buildingWidth + 50} cy={FACTORY_GROUND_Y - 15} rx="15" ry="20" fill="#4A5A3A" stroke="#3A4A2A" strokeWidth="1" />
            <ellipse cx={factoryX + spec.buildingWidth + 50} cy={FACTORY_GROUND_Y - 35} rx="15" ry="3" fill="#5A6A4A" />
          </>
        )}

        {/* Company sign for modern era */}
        {isModern && (
          <rect x={layout.centerX - 30} y={factoryY - 30} width="60" height="12" fill={spec.secondaryColor} stroke="#2A2A2A" strokeWidth="1">
            <title>{industryName}</title>
          </rect>
        )}
      </g>
    );
  };

  // Add simplified animated render functions
  const renderSmoke = () => {
    if (isRuined) return null;

    return (
      <g>
        {layout.chimneys.map((chimney, i) => (
          <g key={i}>
            {/* Animated smoke puffs */}
            {Array.from({ length: 6 }, (_, j) => {
              const age = ((frame * 0.5 + i * 10 + j * 15) % 100) / 100;
              const x = chimney.x + 4 + Math.sin(age * Math.PI + chimney.phase) * (age * 20);
              const y = chimney.y - (age * 40);
              const size = 2 + age * 4;
              const opacity = (1 - age) * spec.smokeDensity * 0.6;

              return (
                <circle
                  key={j}
                  cx={x}
                  cy={y}
                  r={size}
                  fill={spec.smokeColor}
                  opacity={opacity}
                />
              );
            })}
          </g>
        ))}
      </g>
    );
  };

  const renderWorkers = () => (
    <g>
      {layout.workers.map((worker) => {
        const walkCycle = Math.floor((frame + worker.phase) / 8) % 2;
        const x = worker.baseX + Math.sin(frame * 0.01 + worker.phase) * 30;
        const legOffset = walkCycle * worker.direction * 2;

        return (
          <g key={worker.id} transform={`translate(${x}, ${worker.baseY})`}>
            {/* Shadow */}
            <ellipse cx="0" cy="2" rx="3" ry="1" fill="#000" opacity="0.2" />

            {/* Legs */}
            <rect x={-1.5 + legOffset * 0.5} y="-2" width="1.5" height="4" fill="#2C2C2C" />
            <rect x={0.5 - legOffset * 0.5} y="-2" width="1.5" height="4" fill="#2C2C2C" />

            {/* Body */}
            <rect x="-2.5" y="-8" width="5" height="6" fill={spec.workers.clothing} />

            {/* Arms */}
            <rect x="-3.5" y="-7" width="1.5" height="4" fill="#FFDBAC" />
            <rect x="2" y="-7" width="1.5" height="4" fill="#FFDBAC" />

            {/* Head */}
            <rect x="-1.5" y="-10" width="3" height="2.5" fill="#FFDBAC" />

            {/* Hard hat / cap */}
            {isModern ? (
              <path d="M-2.5,-11 L2.5,-11 L2,-12 L-2,-12 Z" fill="#FFD700" />
            ) : (
              <rect x="-2" y="-11.5" width="4" height="1.5" fill="#4A4A4A" />
            )}
          </g>
        );
      })}
    </g>
  );

  const renderSpecialEffects = () => {
    // Industry-specific special effects
    if (spec.type === 'steel' && !isRuined) {
      // Sparks from steel production
      return (
        <g>
          {Array.from({ length: 5 }, (_, i) => (
            <circle
              key={i}
              cx={layout.centerX - 30 + Math.sin(frame * 0.3 + i) * 20}
              cy={FACTORY_GROUND_Y - 20 - Math.abs(Math.sin(frame * 0.3 + i) * 15)}
              r="1"
              fill="#FFD700"
              opacity={0.8 - Math.abs(Math.sin(frame * 0.3 + i)) * 0.5}
            />
          ))}
        </g>
      );
    }

    if (spec.type === 'glassworks' && !isRuined) {
      // Glow from furnaces
      return (
        <ellipse
          cx={layout.centerX}
          cy={FACTORY_GROUND_Y - 10}
          rx="30"
          ry="15"
          fill="#FF6347"
          opacity={0.3 + Math.sin(frame * 0.1) * 0.1}
        />
      );
    }

    return null;
  };

  /* ───────────────────────── Render (sky is handled below the SVG) ───────────────────────── */
  return (
    <div className="relative" style={{ width, height, overflow: 'hidden', isolation: 'isolate' }} aria-label="Factory banner">
      {/* Time & weather aware sky (overcast, season, climate handled here) */}
      <TimeAwareBackground
        gameTimeHours={clockH}
        gameTimeMinutes={clockM}
        weather={weather ?? undefined}
        season={seasonStr}
        climate={climateStr}
      />

      {/* Optional FX layer: clipped to sky band only */}
      {enableFxLayer && fxWeather && (
        <div
          className="absolute left-0 right-0 top-0 pointer-events-none"
          style={{ height: FACTORY_GROUND_Y, zIndex: 1, overflow: 'hidden' }}
        >
          <WeatherEffects weather={fxWeather} width={width} height={FACTORY_GROUND_Y} />
        </div>
      )}

      {/* Main scene (transparent sky) */}
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ imageRendering: 'pixelated', display: 'block', position: 'relative', zIndex: 2 }}
      >
        {renderBackground()}
        {renderGround()}
        {renderFactory()}
        {renderWorkers()}
        {renderSmoke()}
        {renderSpecialEffects()}

        {/* Ruin overlay */}
        {isRuined && (
          <g>
            <rect x="0" y="0" width={width} height={height} fill="#8B7355" opacity="0.2" />
            {/* Broken windows */}
            {Array.from({ length: 5 }, (_, i) => (
              <polygon
                key={i}
                points={`${layout.centerX - 60 + i * 25},${FACTORY_GROUND_Y - 30} ${layout.centerX - 55 + i * 25},${FACTORY_GROUND_Y - 25} ${layout.centerX - 50 + i * 25},${FACTORY_GROUND_Y - 28}`}
                fill="#1A1A1A"
                opacity="0.8"
              />
            ))}
          </g>
        )}
      </svg>
    </div>
  );
};

export default React.memo(FactoryBanner);
/**
 * components/horizons/TemperateHorizon.tsx
 * Temperate climate horizon with rounded hills and deciduous forest.
 * - Greens/blues instead of snow
 * - Deciduous trees (rounded crowns)
 * - Bottom bands feather into the bottom panel color
 *
 * Additions (only these):
 * - Rain: pixel rim-lights/reflections on puddles + tiny splash animations
 * - Night extras (1-in-3 chance):
 *    • Urban: chimney + rising smoke on one house (seeded/stable)
 *    • Non-urban: tiny distant campfire + smoke (seeded/stable)
 * - Snow: at least one chimney always smoking; house roofs get snow caps
 */

import React, { useMemo } from 'react';
import { TimeOfDay } from '../../types';
import { WeatherState } from '../../services/weatherService';

interface TemperateHorizonProps {
  timeOfDay: TimeOfDay;
  width: number;
  height: number;
  hasWater?: boolean;
  hasCentralWater?: boolean;
  isUrban?: boolean;
  /** UI panel color under the horizon (e.g., slate-800) */
  bottomPanelColor?: string;
  weather?: WeatherState;
  season?: 'spring' | 'summer' | 'autumn' | 'winter';
  sky?: {
    top: string;
    mid: string;
    bottom: string;
    hazeDark: string;
    hazeLight: string;
    water: string;
    fog: string;
    mountainFar: string;
    mountainMid: string;
    mountainNear: string;
  };
}

const TemperateHorizon: React.FC<TemperateHorizonProps> = ({
  timeOfDay,
  width,
  height,
  hasWater = false,
  hasCentralWater = false,
  isUrban = false,
  bottomPanelColor = '#1f2937', // slate-800-ish
  weather,
  season = 'summer',
  sky,
}) => {
  // Helper to blend two hex colors
  const blendHex = (color1: string, color2: string, ratio: number): string => {
    const parseHex = (hex: string) => {
      const clean = hex.replace('#', '');
      const r = parseInt(clean.slice(0, 2), 16);
      const g = parseInt(clean.slice(2, 4), 16);
      const b = parseInt(clean.slice(4, 6), 16);
      return { r, g, b };
    };

    const c1 = parseHex(color1);
    const c2 = parseHex(color2);
    const r = Math.round(c1.r * (1 - ratio) + c2.r * ratio);
    const g = Math.round(c1.g * (1 - ratio) + c2.g * ratio);
    const b = Math.round(c1.b * (1 - ratio) + c2.b * ratio);

    return `#${r.toString(16).padStart(2, '0')}${g
      .toString(16)
      .padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };

  // Seeded random for stable positioning
  const seededRandom = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  // Get the actual sky color from props or CSS variables set by TimeAwareBackground
  const getSkyColors = () => {
    if (sky) {
      return { skyTop: sky.top, skyMid: sky.mid, skyBottom: sky.bottom };
    }
    const rootStyles = getComputedStyle(document.documentElement);
    const skyTop = rootStyles.getPropertyValue('--sky-top').trim() || '#87CEEB';
    const skyMid = rootStyles.getPropertyValue('--sky-mid').trim() || '#E6F3FF';
    const skyBottom = rootStyles.getPropertyValue('--sky-bottom').trim() || '#FFF4E6';
    return { skyTop, skyMid, skyBottom };
  };

  // Temperate palette by time of day (greens/blues; no snow)
  const getColors = () => {
    const { skyTop, skyMid, skyBottom } = getSkyColors();

    // Base temperate colors - adjust for seasons
    const getSeasonalColors = () => {
      if (season === 'spring') {
        return {
          farHill: '#8DA5C0',
          midHill: '#6687A8',
          nearHill: '#3A5A7C',
          meadow: '#2A5A42',
          meadowAccent: '#3A6A52',
          trunk: '#3A2A1F',
          leafDark: '#2A7A48',
          leafLight: '#4A9A68',
          leafAutumn: '#2A7A48', // Not used in spring
          hazeLight: '#C7D6EC',
          hazeDark: '#A6B8D6',
          water: '#4678A8',
          waterHi: '#A8D8FF',
        };
      } else if (season === 'autumn') {
        return {
          farHill: '#8D95B0',
          midHill: '#6677A8',
          nearHill: '#3A5A7C',
          meadow: '#4A3A2C',
          meadowAccent: '#5A4A3C',
          trunk: '#3A2A1F',
          leafDark: '#8A4A2A',
          leafLight: '#CA6A3A',
          leafAutumn: '#DA8A4A',
          hazeLight: '#D7C6DC',
          hazeDark: '#B6A8C6',
          water: '#4678A8',
          waterHi: '#A8D8FF',
        };
      } else if (season === 'winter') {
        return {
          farHill: '#9DA5C0',
          midHill: '#7687A8',
          nearHill: '#4A5A7C',
          meadow: '#3A4A4C',
          meadowAccent: '#4A5A5C',
          trunk: '#2A2A2F',
          leafDark: '#4A5A4C',
          leafLight: '#5A6A5C',
          leafAutumn: '#4A5A4C', // Bare branches color
          hazeLight: '#D7D6EC',
          hazeDark: '#B6B8D6',
          water: '#3668A8',
          waterHi: '#98C8FF',
        };
      }
      // Summer (default)
      return {
        farHill: '#8DA5C0',
        midHill: '#6687A8',
        nearHill: '#3A5A7C',
        meadow: '#254A3C',
        meadowAccent: '#2F5A48',
        trunk: '#3A2A1F',
        leafDark: '#1F5A38',
        leafLight: '#2F7A50',
        leafAutumn: '#1F5A38', // Not used in summer
        hazeLight: '#C7D6EC',
        hazeDark: '#A6B8D6',
        water: '#4678A8',
        waterHi: '#A8D8FF',
      };
    };

    const temperateBase = getSeasonalColors();

    // Time of day flags
    const isNight = timeOfDay === 'Night';
    const isDawn = timeOfDay === 'Dawn';
    const isDusk = timeOfDay === 'Dusk';
    const isTwilight = isDawn || isDusk;
    const isMorning = isDawn || timeOfDay === 'Morning';
    const isEvening = isDusk || timeOfDay === 'Evening';

    // Variable sky influence based on time of day - VERY STRONG at night for proper bluish tones
    const skyInfluence = isNight ? 0.65 : isDusk ? 0.5 : isDawn ? 0.45 : 0.2;
    const hazeInfluence = isNight ? 0.85 : isTwilight ? 0.4 : 0.15;

    // Helper to tint with appropriate sky color
    const tintHill = (baseColor: string, distance: 'far' | 'mid' | 'near') => {
      const skyColor =
        distance === 'far' ? skyTop : distance === 'mid' ? skyMid : skyBottom;
      const influence =
        distance === 'far'
          ? skyInfluence * 1.2
          : distance === 'mid'
          ? skyInfluence
          : skyInfluence * 0.8;
      return blendHex(baseColor, skyColor, influence);
    };

    const tintGround = (baseColor: string) => {
      // At night, use darker sky color for ground to avoid white appearance
      const skyForGround = isNight ? skyTop : skyBottom;
      // Reduce tinting influence at night to preserve green/dark colors
      const groundInfluence = isNight ? skyInfluence * 0.5 : skyInfluence;
      return blendHex(baseColor, skyForGround, groundInfluence);
    };
    const tintVegetation = (baseColor: string) => {
      // At night, blend with darker sky color and reduce influence to keep vegetation dark
      const skyForVegetation = isNight ? skyTop : skyBottom;
      const vegInfluence = isNight ? skyInfluence * 0.4 : skyInfluence * 0.85;
      return blendHex(baseColor, skyForVegetation, vegInfluence);
    };
    const tintHaze = (baseColor: string) => blendHex(baseColor, skyMid, hazeInfluence);

    // Color temperature shifts for time of day
    const warmShift = isMorning ? '#FFE4B5' : isEvening ? '#FFB6C1' : '#FFFFFF';
    const coolShift = isMorning ? '#FFE0F0' : isEvening ? '#E6B8FF' : '#FFFFFF';
    const temperatureInfluence = isTwilight ? 0.08 : 0;

    return {
      sky1: skyTop,
      sky2: skyMid,
      sky3: skyBottom,
      farHill: blendHex(tintHill(temperateBase.farHill, 'far'), coolShift, temperatureInfluence),
      midHill: blendHex(tintHill(temperateBase.midHill, 'mid'), isMorning ? warmShift : coolShift, temperatureInfluence * 0.7),
      nearHill: blendHex(tintHill(temperateBase.nearHill, 'near'), warmShift, temperatureInfluence * 0.5),
      meadow: tintGround(temperateBase.meadow),
      meadowAccent: tintGround(temperateBase.meadowAccent),
      trunk: tintVegetation(temperateBase.trunk),
      leafDark: tintVegetation(temperateBase.leafDark),
      leafLight: tintVegetation(temperateBase.leafLight),
      leafFar: blendHex(temperateBase.leafDark, skyTop, 0.6), // Atmospheric perspective for distant trees
      leafAutumn: tintVegetation(temperateBase.leafAutumn),
      hazeLight: tintHaze(temperateBase.hazeLight),
      hazeDark: tintHaze(temperateBase.hazeDark),
      water: blendHex(tintGround(temperateBase.water), skyBottom, 0.25), // Better sky reflection
      waterHi: blendHex(temperateBase.waterHi, skyMid, hazeInfluence),
      mistColor: blendHex('#FFFFFF', skyMid, 0.3),
    };
  };

  const colors = getColors();

  // --- helpers ---
  const p = (v: number) => Math.round(v);

  // Night / precipitation flags for the new micro-effects
  const isNight = timeOfDay === 'Night';
  const isDawn = timeOfDay === 'Dawn';
  const isDusk = timeOfDay === 'Dusk';
  const isTwilight = isDawn || isDusk;
  const isRaining = !!(weather && weather.precipitation === 'rain' && weather.intensity > 0);
  const isSnowing = !!(weather && weather.precipitation === 'snow' && weather.intensity > 0);

  // Generate stable bird positions
  const birds = useMemo(() => {
    const birdCount = isTwilight ? 3 : 2;
    return Array.from({ length: birdCount }, (_, i) => ({
      x: p(width * (0.2 + seededRandom(width + i * 137) * 0.6)),
      y: p(height * (0.15 + seededRandom(height + i * 239) * 0.25)),
      size: 2 + (i % 2),
    }));
  }, [width, height, isTwilight]);

  // Generate firefly positions for dusk/night with movement
  const fireflies = useMemo(() => {
    if (!isDusk && !isNight) return [];
    const count = isDusk ? 8 : 12;
    return Array.from({ length: count }, (_, i) => ({
      x: p(width * (0.1 + seededRandom(width + i * 271) * 0.8)),
      y: p(height * (0.65 + seededRandom(height + i * 317) * 0.15)),
      delay: seededRandom(i * 137) * 3,
      duration: 2 + seededRandom(i * 239) * 2,
      driftX: seededRandom(i * 419) * 20 - 10, // Drift -10 to +10 pixels
      driftY: seededRandom(i * 521) * 15 - 7.5, // Drift -7.5 to +7.5 pixels
      driftDuration: 3 + seededRandom(i * 623) * 4, // 3-7 seconds
    }));
  }, [width, height, isDusk, isNight]);

  // Generate butterfly/dragonfly positions for daytime with seasonal variations
  const insects = useMemo(() => {
    if (isNight || season === 'winter') return [];

    // Seasonal variations
    let count = 3;
    let types = [];

    if (season === 'spring') {
      count = hasWater ? 7 : 5; // More insects in spring
      types = ['butterfly', 'butterfly', 'bee', 'butterfly', 'bee'];
    } else if (season === 'summer') {
      count = hasWater ? 6 : 4;
      types = hasWater ? ['dragonfly', 'dragonfly', 'butterfly', 'dragonfly'] : ['butterfly', 'butterfly', 'bee'];
    } else if (season === 'autumn') {
      count = 2; // Fewer insects in autumn
      types = ['butterfly', 'butterfly'];
    }

    return Array.from({ length: count }, (_, i) => ({
      startX: seededRandom(width + i * 397) > 0.5 ? -20 : width + 20, // Start offscreen
      y: p(height * (0.7 + seededRandom(height + i * 463) * 0.12)),
      type: types[i % types.length] || 'butterfly',
      speed: 15 + seededRandom(i * 271) * 25, // Seconds to cross screen
      delay: seededRandom(i * 191) * 10, // Stagger their appearance
      direction: seededRandom(width + i * 397) > 0.5 ? 1 : -1, // Left or right
    }));
  }, [width, height, isNight, season, hasWater]);

  // Generate morning dew positions
  const dewDrops = useMemo(() => {
    if (!isDawn) return [];
    const count = 15;
    return Array.from({ length: count }, (_, i) => ({
      x: p(width * seededRandom(width + i * 571)),
      y: p(height * (0.78 + seededRandom(height + i * 613) * 0.04)),
      size: seededRandom(i * 719) > 0.7 ? 2 : 1,
    }));
  }, [width, height, isDawn]);

  // Generate pollen/seeds for spring/summer
  const pollenSeeds = useMemo(() => {
    if (isNight || (season !== 'spring' && season !== 'summer')) return [];
    const count = season === 'spring' ? 8 : 4;
    return Array.from({ length: count }, (_, i) => ({
      startX: seededRandom(width + i * 727) * width,
      y: p(height * (0.3 + seededRandom(height + i * 829) * 0.4)),
      speed: 20 + seededRandom(i * 931) * 30, // 20-50s to cross
      delay: seededRandom(i * 1033) * 15,
      size: seededRandom(i * 1135) > 0.6 ? 2 : 1,
    }));
  }, [width, height, isNight, season]);

  // Migrating birds for autumn
  const migratingBirds = useMemo(() => {
    if (season !== 'autumn' || isNight) return [];
    return [{
      x: p(width * 0.6),
      y: p(height * 0.2),
      formation: Array.from({ length: 7 }, (_, i) => ({
        offsetX: i === 0 ? 0 : (i % 2 === 0 ? -10 * Math.ceil(i/2) : 10 * Math.ceil(i/2)),
        offsetY: i === 0 ? 0 : 5 * Math.ceil(i/2),
      })),
    }];
  }, [width, height, season, isNight]);

  // Distant village smoke
  const villageSmokes = useMemo(() => {
    if (isUrban) return [];
    const count = 2 + (seededRandom(width * height) > 0.5 ? 1 : 0);
    return Array.from({ length: count }, (_, i) => ({
      x: p(width * (0.2 + seededRandom(width + i * 1237) * 0.6)),
      y: p(height * (0.45 + seededRandom(height + i * 1339) * 0.1)),
    }));
  }, [width, height, isUrban]);

  // Seeded but stable "1-in-3" random using only width/height (stable across rerenders/ticks)
  const baseRand = Math.abs(Math.sin(width * 0.1337 + height * 0.4242));
  const oneInThree = baseRand < 0.3334;

  // Precompute urban houses so we can add chimneys/smoke and (in snow) roof caps.
  type House = { i: number; x: number; y: number; w: number; h: number };
  const houses: House[] = isUrban
    ? (Array.from({ length: 8 }).map((_, i) => {
        const xRatio = (i + 1) / 9;
        if (hasWater) {
          if (xRatio < 0.22) return null;
          if (xRatio > 0.78) return null;
        }
        const houseX = p(width * xRatio + Math.sin(i * 37.3) * 15);
        const houseW = p(12 + ((i % 3) * 4));
        const houseH = p(15 + ((i % 2) * 5));
        const houseY = p(height * (0.72 + Math.sin(i * 2.1) * 0.02));
        return { i, x: houseX, y: houseY, w: houseW, h: houseH };
      }).filter(Boolean) as House[])
    : [];

  // Decide which house(s) smoke: at night 1-in-3 chance; during snow always at least one.
  const smokeIndices = new Set<number>();
  if (houses.length) {
    if (isNight && oneInThree) {
      const pick = houses[Math.floor(baseRand * houses.length)]!.i;
      smokeIndices.add(pick);
    }
    if (isSnowing && smokeIndices.size === 0) {
      smokeIndices.add(houses[0]!.i); // guarantee smoke on at least one house when snowing
    }
  }

  // Memoize static mountain/hill paths
  const mountainPaths = useMemo(() => ({
    farHills: `
      M 0 ${p(height * 0.58)}
      C ${p(width * 0.10)} ${p(height * 0.40)}, ${p(width * 0.22)} ${p(height * 0.46)}, ${p(width * 0.34)} ${p(height * 0.42)}
      S ${p(width * 0.62)} ${p(height * 0.36)}, ${p(width * 0.78)} ${p(height * 0.44)}
      S ${p(width * 0.96)} ${p(height * 0.50)}, ${width} ${p(height * 0.52)}
      L ${width} ${height} L 0 ${height} Z
    `,
    midHills: `
      M 0 ${p(height * 0.66)}
      C ${p(width * 0.12)} ${p(height * 0.54)}, ${p(width * 0.28)} ${p(height * 0.60)}, ${p(width * 0.42)} ${p(height * 0.57)}
      S ${p(width * 0.70)} ${p(height * 0.52)}, ${p(width * 0.88)} ${p(height * 0.60)}
      L ${width} ${height} L 0 ${height} Z
    `,
    nearHills: `
      M 0 ${p(height * 0.74)}
      C ${p(width * 0.14)} ${p(height * 0.68)}, ${p(width * 0.32)} ${p(height * 0.70)}, ${p(width * 0.48)} ${p(height * 0.69)}
      S ${p(width * 0.78)} ${p(height * 0.66)}, ${width} ${p(height * 0.72)}
      L ${width} ${height} L 0 ${height} Z
    `,
    treelineStrip: `
      M 0 ${p(height * 0.78)}
      L ${p(width * 0.12)} ${p(height * 0.772)}
      L ${p(width * 0.26)} ${p(height * 0.784)}
      L ${p(width * 0.40)} ${p(height * 0.770)}
      L ${p(width * 0.56)} ${p(height * 0.785)}
      L ${p(width * 0.72)} ${p(height * 0.775)}
      L ${p(width * 0.88)} ${p(height * 0.790)}
      L ${width} ${p(height * 0.782)}
      L ${width} ${height} L 0 ${height} Z
    `
  }), [width, height]);

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid slice"
      style={{ position: 'absolute', bottom: 0, left: 0, pointerEvents: 'none' }}
      shapeRendering="crispEdges"
    >
      <defs>
        {/* Inline CSS keyframes (kept here so no Tailwind config changes needed) */}
        <style>{`
          @keyframes ripple {
            0%   { transform: scale(0.85); opacity: 0.6; }
            80%  { transform: scale(1.6); opacity: 0.05; }
            100% { transform: scale(1.6); opacity: 0.0; }
          }
          @keyframes plop {
            0%   { transform: translateY(0px) scaleY(0.8); opacity: 0.0; }
            30%  { transform: translateY(-4px) scaleY(1.0); opacity: 0.9; }
            100% { transform: translateY(0px) scaleY(0.8); opacity: 0.0; }
          }
          @keyframes smokeRise {
            0%   { transform: translateY(0px) translateX(0px); opacity: 0.6; }
            100% { transform: translateY(-14px) translateX(2px); opacity: 0.0; }
          }
          @keyframes flicker {
            0%, 100% { opacity: 0.85; }
            40%      { opacity: 1.00; }
            70%      { opacity: 0.70; }
          }
          .ripple {
            transform-origin: center;
            transform-box: fill-box;
            animation: ripple 1.6s ease-out infinite;
          }
          .plop {
            transform-origin: bottom center;
            transform-box: fill-box;
            animation: plop 1.05s ease-in infinite;
          }
          .smoke {
            transform-origin: center;
            transform-box: fill-box;
            animation: smokeRise 2.8s linear infinite;
          }
          .flicker {
            animation: flicker 0.9s steps(2) infinite;
          }
          @keyframes glow {
            0%, 100% { opacity: 0.2; }
            50% { opacity: 0.9; }
          }
          .firefly {
            animation: glow var(--duration, 3s) ease-in-out var(--delay, 0s) infinite;
          }
          @keyframes flutter {
            0% { transform: translate(0, 0); }
            25% { transform: translate(3px, -2px); }
            50% { transform: translate(-2px, -4px); }
            75% { transform: translate(2px, -1px); }
            100% { transform: translate(0, 0); }
          }
          @keyframes flyAcross {
            0% { transform: translateX(0) translateY(0); }
            25% { transform: translateX(var(--distance, 100px)) translateY(-3px); }
            50% { transform: translateX(calc(var(--distance, 100px) * 2)) translateY(2px); }
            75% { transform: translateX(calc(var(--distance, 100px) * 3)) translateY(-2px); }
            100% { transform: translateX(calc(var(--distance, 100px) * 4)) translateY(0); }
          }
          .insect-fly {
            animation: flyAcross var(--speed, 30s) linear var(--delay, 0s) infinite;
          }
          @keyframes fireflyDrift {
            0%, 100% { transform: translate(0, 0); }
            33% { transform: translate(var(--driftX, 5px), var(--driftY, -3px)); }
            66% { transform: translate(calc(var(--driftX, 5px) * -0.5), calc(var(--driftY, -3px) * -0.5)); }
          }
          .firefly-drift {
            animation: fireflyDrift var(--driftDur, 4s) ease-in-out infinite;
          }
          @keyframes pollenFloat {
            0% { transform: translateX(0) translateY(0); }
            100% { transform: translateX(var(--distance, 100px)) translateY(10px); }
          }
          .pollen-float {
            animation: pollenFloat var(--speed, 40s) linear var(--delay, 0s) infinite;
          }
          @keyframes waterShimmer {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 0.6; }
          }
          .water-shimmer {
            animation: waterShimmer 3s ease-in-out infinite;
          }
          @keyframes sparkle {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 0.9; }
          }
          .dew {
            animation: sparkle 2s ease-in-out infinite;
          }
          @keyframes vFormation {
            0% { transform: translateX(0); }
            100% { transform: translateX(calc(var(--width, 100px) * -1.5)); }
          }
          .v-formation {
            animation: vFormation 20s linear infinite;
          }
        `}</style>

        {/* Top fade gradient for smooth transition into TimeAwareBackground */}
        <linearGradient id="temperateTopFade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="white" stopOpacity="0" />
          <stop offset="15%" stopColor="white" stopOpacity="0.02" />
          <stop offset="30%" stopColor="white" stopOpacity="0.08" />
          <stop offset="45%" stopColor="white" stopOpacity="0.18" />
          <stop offset="60%" stopColor="white" stopOpacity="0.35" />
          <stop offset="75%" stopColor="white" stopOpacity="0.60" />
          <stop offset="88%" stopColor="white" stopOpacity="0.85" />
          <stop offset="100%" stopColor="white" stopOpacity="0.98" />
        </linearGradient>
        <mask id="temperateTopMask">
          <rect x="0" y="0" width={width} height={height} fill="url(#temperateTopFade)" />
        </mask>

        {/* Haze bands */}
        <linearGradient id="hazeLight" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={colors.hazeLight} stopOpacity="0.45" />
          <stop offset="100%" stopColor={colors.hazeLight} stopOpacity="0" />
        </linearGradient>
        <linearGradient id="hazeDark" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={colors.hazeDark} stopOpacity="0.5" />
          <stop offset="100%" stopColor={colors.hazeDark} stopOpacity="0" />
        </linearGradient>

        {/* Bottom feather into panel color */}
        <linearGradient id="panelFeather" x1="0" y1={height * 0.82} x2="0" y2={height}>
          <stop offset="0%" stopColor={colors.meadow} />
          <stop offset="50%" stopColor={colors.meadowAccent} />
          <stop offset="100%" stopColor={bottomPanelColor} />
        </linearGradient>

        {/* Subtle blur for distance */}
        <filter id="softMist">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
        </filter>

        {/* Horizon edge softening gradient */}
        <linearGradient id="horizonSoftEdge" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopOpacity="0" />
          <stop offset="50%" stopOpacity="0.5" />
          <stop offset="100%" stopOpacity="1" />
        </linearGradient>

        {/* Ground texture pattern */}
        <pattern id="groundTexture" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="0.5" fill="#000000" opacity="0.03" />
          <circle cx="3" cy="3" r="0.5" fill="#000000" opacity="0.03" />
        </pattern>
      </defs>

      {/* Masked group allows top to fade into background sky */}
      <g mask="url(#temperateTopMask)">

      {/* FAR rolling hills - much more transparent at night to avoid dark bands */}
      <g filter="url(#softMist)" opacity={isNight ? 0.25 : 0.8}>
        <path
          d={mountainPaths.farHills}
          fill={colors.farHill}
        />
        {/* Soft horizon edge */}
        <rect x="0" y={p(height * 0.36)} width={width} height="3" fill={colors.farHill} opacity="0.3" mask="url(#horizonSoftEdge)" />

        {/* Distant village smoke plumes */}
        {villageSmokes.map((smoke, i) => (
          <g key={`village-smoke-${i}`} opacity="0.3">
            <path
              d={`M ${smoke.x} ${smoke.y} c 0 -3, 1 -5, 0 -8 c -1 -3, 1 -5, 0 -8`}
              stroke={colors.hazeDark}
              strokeWidth="1"
              fill="none"
              opacity="0.5"
            />
          </g>
        ))}
      </g>

      {/* Birds in sky (subtle V shapes) */}
      {birds.map((bird, i) => (
        <g key={i} opacity={isNight ? 0.3 : 0.6}>
          <path
            d={`M ${bird.x - bird.size} ${bird.y} L ${bird.x} ${bird.y - bird.size} L ${bird.x + bird.size} ${bird.y}`}
            stroke={isNight ? '#4A5568' : '#374151'}
            strokeWidth="1"
            fill="none"
            strokeLinecap="round"
          />
        </g>
      ))}

      {/* Haze between far/mid - also reduced at night */}
      <rect x="0" y={p(height * 0.48)} width={width} height={p(height * 0.08)} fill="url(#hazeDark)" opacity={isNight ? 0.3 : 1} />

      {/* Mist pockets in valleys (morning/evening or rain) */}
      {(isTwilight || isRaining) && (
        <g opacity={isRaining ? 0.4 : 0.3}>
          <ellipse cx={p(width * 0.3)} cy={p(height * 0.52)} rx={p(width * 0.12)} ry={p(height * 0.03)} fill={colors.mistColor} filter="url(#softMist)" />
          <ellipse cx={p(width * 0.7)} cy={p(height * 0.54)} rx={p(width * 0.15)} ry={p(height * 0.025)} fill={colors.mistColor} filter="url(#softMist)" />
        </g>
      )}

      {/* MID hills - slightly reduced at night */}
      <g opacity={isNight ? 0.7 : 0.95}>
        <path
          d={mountainPaths.midHills}
          fill={colors.midHill}
        />
      </g>

      {/* Haze between mid/near */}
      <rect x="0" y={p(height * 0.60)} width={width} height={p(height * 0.07)} fill="url(#hazeLight)" />

      {/* NEAR hills */}
      <path
        d={mountainPaths.nearHills}
        fill={colors.nearHill}
      />

      {/* Deciduous forest band along the near ridge */}
      <g opacity="0.98">
        {/* Treeline strip */}
        <path
          d={mountainPaths.treelineStrip}
          fill={colors.meadowAccent}
        />

        {/* Individual trees with variety and seasonal changes */}
        {[...Array(18)].map((_, i) => {
          const x = (i + 1) / 19;
          const cx = p(width * x + Math.sin(i * 77.7) * 7);
          const baseY = p(height * (0.775 + Math.sin(i * 0.9) * 0.01));
          const h = height * (0.16 + (i % 3 === 0 ? 0.08 : i % 2 ? 0.04 : 0));
          const crownY = baseY - h * 0.6;
          const crownW = h * 0.55;

          // Tree variety: evergreen, deciduous, or bare
          const treeType = seededRandom(i * 823) > 0.7 ? 'evergreen' : (season === 'winter' && seededRandom(i * 929) > 0.5 ? 'bare' : 'deciduous');

          // Apply atmospheric perspective - farther trees are lighter
          const distanceFactor = x;
          const leafColor = distanceFactor < 0.4 ? colors.leafFar :
                          (season === 'autumn' && treeType === 'deciduous' ? colors.leafAutumn : colors.leafDark);
          const leafAccent = distanceFactor < 0.4 ? blendHex(colors.leafLight, colors.sky2, 0.3) : colors.leafLight;

          // Trees droop in rain
          const rainDroop = isRaining ? 0.92 : 1; // Scale Y to make trees appear drooped

          return (
            <g key={i} shapeRendering="crispEdges" opacity={distanceFactor < 0.3 ? 0.7 : 1}
               style={{
                 transform: isRaining ? `scaleY(${rainDroop})` : undefined,
                 transformOrigin: 'bottom'
               }}>
              {/* trunk */}
              <rect x={cx - h * 0.03} y={baseY - h * 0.26} width={h * 0.06} height={h * 0.28} fill={colors.trunk} />

              {treeType === 'evergreen' ? (
                // Evergreen tree (triangular shape)
                <>
                  <path
                    d={`M ${cx} ${crownY - h * 0.15} L ${cx - crownW * 0.7} ${crownY + h * 0.15} L ${cx + crownW * 0.7} ${crownY + h * 0.15} Z`}
                    fill={colors.leafDark}
                  />
                  <path
                    d={`M ${cx} ${crownY - h * 0.08} L ${cx - crownW * 0.5} ${crownY + h * 0.08} L ${cx + crownW * 0.5} ${crownY + h * 0.08} Z`}
                    fill={leafColor}
                  />
                </>
              ) : treeType === 'bare' ? (
                // Bare winter branches
                <>
                  <rect x={cx - crownW * 0.4} y={crownY} width={2} height={h * 0.15} fill={colors.trunk} opacity="0.6" />
                  <rect x={cx + crownW * 0.4} y={crownY} width={2} height={h * 0.15} fill={colors.trunk} opacity="0.6" />
                  <rect x={cx - crownW * 0.6} y={crownY + h * 0.05} width={crownW * 1.2} height={1} fill={colors.trunk} opacity="0.5" />
                </>
              ) : (
                // Deciduous tree (original rounded crown)
                <>
                  <rect x={cx - crownW * 0.6} y={crownY - h * 0.06} width={crownW * 1.2} height={h * 0.12} fill={leafColor} />
                  <rect x={cx - crownW * 0.5} y={crownY + h * 0.02} width={crownW} height={h * 0.12} fill={leafAccent} />
                  <rect x={cx - crownW * 0.35} y={crownY + h * 0.12} width={crownW * 0.7} height={h * 0.10} fill={leafColor} />
                  {/* Add autumn leaves falling */}
                  {season === 'autumn' && seededRandom(i * 1013) > 0.6 && (
                    <rect x={cx - crownW * 0.2 + seededRandom(i * 1117) * crownW * 0.4} y={baseY - h * 0.1} width={2} height={2} fill={colors.leafAutumn} opacity="0.7" />
                  )}
                </>
              )}
            </g>
          );
        })}
      </g>

      {/* Meadow strip that feathers into the bottom panel color */}
      <rect x="0" y={p(height * 0.82)} width={width} height={p(height * 0.18)} fill="url(#panelFeather)" />

      {/* Ground texture details */}
      <rect x="0" y={p(height * 0.82)} width={width} height={p(height * 0.18)} fill="url(#groundTexture)" />

      {/* Subtle path lines */}
      <path d={`M 0 ${p(height * 0.85)} Q ${p(width * 0.3)} ${p(height * 0.84)}, ${p(width * 0.6)} ${p(height * 0.85)}`} stroke={colors.meadowAccent} strokeWidth="1" opacity="0.2" />
      <path d={`M ${p(width * 0.4)} ${p(height * 0.88)} Q ${p(width * 0.7)} ${p(height * 0.87)}, ${width} ${p(height * 0.88)}`} stroke={colors.meadowAccent} strokeWidth="1" opacity="0.15" />

      {/* Morning dew sparkles */}
      {dewDrops.map((dew, i) => (
        <rect
          key={`dew-${i}`}
          x={dew.x}
          y={dew.y}
          width={dew.size}
          height={dew.size}
          fill="#FFFFFF"
          className="dew"
          style={{ animationDelay: `${i * 0.13}s` }}
        />
      ))}

      {/* Butterflies, dragonflies, and bees */}
      {insects.map((insect, i) => (
        <g key={`insect-${i}`}
           className="insect-fly"
           style={{
             '--delay': `${insect.delay}s`,
             '--speed': `${insect.speed}s`,
             '--distance': insect.direction === 1 ? `${width + 40}px` : `-${width + 40}px`,
             transform: `translateX(${insect.startX}px) translateY(${insect.y}px)`
           } as React.CSSProperties}>
          {insect.type === 'butterfly' ? (
            // Butterfly shape
            <g className="flutter" style={{ '--delay': '0s' } as React.CSSProperties}>
              <rect x={-3} y={0} width={2} height={1} fill={season === 'spring' ? '#FF6B9D' : '#FF8C42'} />
              <rect x={1} y={0} width={2} height={1} fill={season === 'spring' ? '#FF6B9D' : '#FF8C42'} />
              <rect x={-1} y={-1} width={2} height={2} fill="#2D3436" />
            </g>
          ) : insect.type === 'bee' ? (
            // Bee shape
            <g>
              <rect x={-2} y={0} width={4} height={3} fill="#FFD93D" />
              <rect x={-1} y={1} width={2} height={1} fill="#2D3436" />
              <rect x={-3} y={0} width={1} height={1} fill="#6C757D" opacity="0.5" />
              <rect x={2} y={0} width={1} height={1} fill="#6C757D" opacity="0.5" />
            </g>
          ) : (
            // Dragonfly shape
            <g>
              <rect x={-4} y={0} width={8} height={1} fill="#00CEC9" opacity="0.7" />
              <rect x={-1} y={-1} width={2} height={3} fill="#2D3436" />
            </g>
          )}
        </g>
      ))}

      {/* Pollen and dandelion seeds */}
      {pollenSeeds.map((pollen, i) => (
        <circle
          key={`pollen-${i}`}
          cx={pollen.startX}
          cy={pollen.y}
          r={pollen.size}
          fill={season === 'spring' ? '#FFF8DC' : '#FFFACD'}
          opacity="0.6"
          className="pollen-float"
          style={{
            '--delay': `${pollen.delay}s`,
            '--speed': `${pollen.speed}s`,
            '--distance': `${width}px`
          } as React.CSSProperties}
        />
      ))}

      {/* Migrating birds in autumn */}
      {migratingBirds.map((flock, i) => (
        <g key={`flock-${i}`} className="v-formation" style={{ '--width': `${width}px` } as React.CSSProperties}>
          {flock.formation.map((bird, j) => (
            <path
              key={j}
              d={`M ${flock.x + bird.offsetX - 2} ${flock.y + bird.offsetY} L ${flock.x + bird.offsetX} ${flock.y + bird.offsetY - 2} L ${flock.x + bird.offsetX + 2} ${flock.y + bird.offsetY}`}
              stroke="#2D3436"
              strokeWidth="1"
              fill="none"
              opacity={0.7}
            />
          ))}
        </g>
      ))}

      {/* Fireflies with drift movement */}
      {fireflies.map((firefly, i) => (
        <g key={`firefly-${i}`}
           className="firefly-drift"
           style={{
             '--driftX': `${firefly.driftX}px`,
             '--driftY': `${firefly.driftY}px`,
             '--driftDur': `${firefly.driftDuration}s`
           } as React.CSSProperties}>
          <circle
            cx={firefly.x}
            cy={firefly.y}
            r="1.5"
            fill="#FFFA65"
            className="firefly"
            style={{ '--delay': `${firefly.delay}s`, '--duration': `${firefly.duration}s` } as React.CSSProperties}
          />
        </g>
      ))}

      {/* Water on sides for island/bay/peninsula maps */}
      {hasWater && (
        <>
          {/* Left water */}
          <g>
            <path
              d={`
                M 0 ${p(height * 0.62)}
                C ${p(width * 0.10)} ${p(height * 0.60)}, ${p(width * 0.16)} ${p(height * 0.66)}, ${p(width * 0.20)} ${p(height * 0.70)}
                L ${p(width * 0.20)} ${height}
                L 0 ${height} Z
              `}
              fill={colors.water}
              opacity="0.95"
            />
            <path
              d={`
                M 0 ${p(height * 0.68)}
                C ${p(width * 0.08)} ${p(height * 0.66)}, ${p(width * 0.14)} ${p(height * 0.70)}, ${p(width * 0.18)} ${p(height * 0.73)}
                L ${p(width * 0.18)} ${height}
                L 0 ${height} Z
              `}
              fill={colors.water}
              opacity="0.7"
            />
            <path
              d={`M 0 ${p(height * 0.72)} Q ${p(width * 0.09)} ${p(height * 0.71)}, ${p(width * 0.17)} ${p(height * 0.72)}`}
              stroke={colors.waterHi}
              strokeWidth="1.5"
              opacity="0.5"
              fill="none"
              className="water-shimmer"
            />
            <path
              d={`M ${p(width * 0.03)} ${p(height * 0.76)} Q ${p(width * 0.10)} ${p(height * 0.75)}, ${p(width * 0.16)} ${p(height * 0.76)}`}
              stroke={colors.waterHi}
              strokeWidth="1"
              opacity="0.3"
              fill="none"
            />
            {/* Additional water reflection hints with shimmer */}
            <rect x="0" y={p(height * 0.70)} width={p(width * 0.15)} height="1" fill={colors.sky3} className="water-shimmer" />
            <rect x={p(width * 0.05)} y={p(height * 0.74)} width={p(width * 0.08)} height="0.5" fill={colors.sky2} className="water-shimmer" style={{ animationDelay: '0.5s' }}/>
          </g>

          {/* Right water */}
          <g>
            <path
              d={`
                M ${width} ${p(height * 0.70)}
                C ${p(width * 0.90)} ${p(height * 0.68)}, ${p(width * 0.84)} ${p(height * 0.72)}, ${p(width * 0.78)} ${p(height * 0.75)}
                L ${p(width * 0.78)} ${height}
                L ${width} ${height} Z
              `}
              fill={colors.water}
              opacity="0.95"
            />
            <path
              d={`
                M ${width} ${p(height * 0.74)}
                C ${p(width * 0.92)} ${p(height * 0.73)}, ${p(width * 0.86)} ${p(height * 0.76)}, ${p(width * 0.80)} ${p(height * 0.78)}
                L ${p(width * 0.80)} ${height}
                L ${width} ${height} Z
              `}
              fill={colors.water}
              opacity="0.7"
            />
            <path
              d={`M ${width} ${p(height * 0.76)} Q ${p(width * 0.91)} ${p(height * 0.75)}, ${p(width * 0.83)} ${p(height * 0.76)}`}
              stroke={colors.waterHi}
              strokeWidth="1.5"
              opacity="0.5"
              fill="none"
              className="water-shimmer"
            />
            <path
              d={`M ${p(width * 0.97)} ${p(height * 0.80)} Q ${p(width * 0.90)} ${p(height * 0.79)}, ${p(width * 0.84)} ${p(height * 0.80)}`}
              stroke={colors.waterHi}
              strokeWidth="1"
              opacity="0.3"
              fill="none"
            />
            {/* Additional water reflection hints with shimmer */}
            <rect x={p(width * 0.85)} y={p(height * 0.72)} width={p(width * 0.15)} height="1" fill={colors.sky3} className="water-shimmer" style={{ animationDelay: '1s' }}/>
            <rect x={p(width * 0.87)} y={p(height * 0.76)} width={p(width * 0.08)} height="0.5" fill={colors.sky2} className="water-shimmer" style={{ animationDelay: '1.5s' }}/>
          </g>
        </>
      )}

      {/* Central water for delta/lake maps */}
      {hasCentralWater && (
        <g opacity="0.9">
          <path
            d={`
              M ${p(width * 0.30)} ${p(height * 0.68)}
              C ${p(width * 0.35)} ${p(height * 0.66)}, ${p(width * 0.45)} ${p(height * 0.67)}, ${p(width * 0.50)} ${p(height * 0.68)}
              S ${p(width * 0.65)} ${p(height * 0.67)}, ${p(width * 0.70)} ${p(height * 0.68)}
              L ${p(width * 0.70)} ${p(height * 0.78)}
              C ${p(width * 0.65)} ${p(height * 0.77)}, ${p(width * 0.55)} ${p(height * 0.78)}, ${p(width * 0.50)} ${p(height * 0.78)}
              S ${p(width * 0.35)} ${p(height * 0.77)}, ${p(width * 0.30)} ${p(height * 0.78)}
              Z
            `}
            fill={colors.water}
          />
          <path
            d={`M ${p(width * 0.35)} ${p(height * 0.72)} Q ${p(width * 0.50)} ${p(height * 0.71)}, ${p(width * 0.65)} ${p(height * 0.72)}`}
            stroke={colors.waterHi}
            strokeWidth="1.5"
            opacity="0.4"
            fill="none"
          />
          <path
            d={`M ${p(width * 0.40)} ${p(height * 0.75)} Q ${p(width * 0.50)} ${p(height * 0.74)}, ${p(width * 0.60)} ${p(height * 0.75)}`}
            stroke={colors.waterHi}
            strokeWidth="1"
            opacity="0.3"
            fill="none"
          />
        </g>
      )}

      {/* Urban houses (unchanged layout, augmented with optional chimneys/snow caps) */}
      {isUrban && (
        <g opacity="0.9">
          {houses.map(({ i, x: houseX, y: houseY, w: houseW, h: houseH }) => {
            const roofPeakX = houseX;
            const roofPeakY = houseY - houseH - 6;
            const leftRoofX = houseX - houseW / 2 - 2;
            const rightRoofX = houseX + houseW / 2 + 2;

            // Decide if this house has smoke
            const thisHasSmoke = smokeIndices.has(i);

            return (
              <g key={`house-${i}`}>
                {/* House body */}
                <rect
                  x={houseX - houseW / 2}
                  y={houseY - houseH}
                  width={houseW}
                  height={houseH}
                  fill={colors.nearHill}
                  opacity="0.8"
                />
                {/* Roof */}
                <path
                  d={`M ${leftRoofX} ${houseY - houseH} L ${roofPeakX} ${roofPeakY} L ${rightRoofX} ${houseY - houseH} Z`}
                  fill={colors.meadowAccent}
                  opacity="0.9"
                />
                {/* Snow cap on roof during snowfall */}
                {isSnowing && (
                  <path
                    d={`M ${leftRoofX + 1} ${houseY - houseH}
                       L ${roofPeakX} ${roofPeakY + 1}
                       L ${rightRoofX - 1} ${houseY - houseH}
                       L ${rightRoofX - 3} ${houseY - houseH - 1}
                       L ${roofPeakX} ${roofPeakY - 1}
                       L ${leftRoofX + 3} ${houseY - houseH - 1} Z`}
                    fill="#F9FAFB"
                    opacity={0.95}
                  />
                )}
                {/* Tiny chimney (right side) */}
                <rect
                  x={houseX + houseW * 0.22}
                  y={houseY - houseH - 4}
                  width={2}
                  height={4}
                  fill={colors.nearHill}
                  opacity="0.9"
                />
                {/* Chimney smoke with weather-based variety */}
                {thisHasSmoke && (
                  <g className="smoke" style={{ animationDelay: `${(i % 3) * 0.25}s` }}>
                    <path
                      d={weather?.windSpeed && weather.windSpeed > 15 ?
                        // Windblown smoke
                        `M ${houseX + houseW * 0.23 + 1} ${houseY - houseH - 4}
                          c 2 -1, 4 -2, 6 -4
                          c 2 -1, 3 -2, 4 -4` :
                        isSnowing ?
                        // Thick winter smoke
                        `M ${houseX + houseW * 0.23 + 1} ${houseY - houseH - 4}
                          c 1 -2, 1 -3, 0 -5
                          c 0 -2, -1 -3, -1 -5` :
                        // Normal smoke
                        `M ${houseX + houseW * 0.23 + 1} ${houseY - houseH - 4}
                          c 1 -2, 2 -2, 2 -4
                          c 1 -2, 0 -3, -1 -5`}
                      stroke={`rgba(220,225,235,${isSnowing ? 0.9 : isNight ? 0.8 : 0.5})`}
                      strokeWidth={isSnowing ? "1.5" : "1"}
                      fill="none"
                      strokeLinecap="round"
                    />
                    {/* Add occasional sparks for campfires */}
                    {!isUrban && isNight && seededRandom(i * 1213) > 0.7 && (
                      <rect
                        x={houseX + houseW * 0.23}
                        y={houseY - houseH - 6}
                        width="1"
                        height="1"
                        fill="#FFA500"
                        opacity="0.8"
                        className="flicker"
                      />
                    )}
                  </g>
                )}
                {/* Window lights (if night/dusk) */}
                {(timeOfDay === 'Night' || timeOfDay === 'Dusk') && i % 2 === 0 && (
                  <rect
                    x={houseX - houseW / 4}
                    y={houseY - houseH + 3}
                    width={3}
                    height={3}
                    fill="#FFD700"
                    opacity="0.8"
                  />
                )}
              </g>
            );
          })}
        </g>
      )}

      {/* Meadow strip that feathers into the bottom panel color */}
      <rect x="0" y={p(height * 0.82)} width={width} height={p(height * 0.18)} fill="url(#panelFeather)" />

      {/* Weather effects overlay — RAIN (adds rim lights + splashes/ripples) */}
      {isRaining && (
        <g opacity={0.3 + (weather!.intensity * 0.4)}>
          {/* Puddles */}
          {[...Array(8)].map((_, i) => {
            const x = (i + 1) / 9;
            const pudX = p(width * x + Math.sin(i * 13.7) * 20);
            const pudY = p(height * (0.85 + Math.sin(i * 7.3) * 0.05));
            const rx = p(15 + weather!.intensity * 10 + ((i % 3) * 5));
            const ry = p(3 + weather!.intensity * 2);
            const delay = `${(i % 4) * 0.25}s`;

            return (
              <g key={`pud-${i}`}>
                {/* Base puddle */}
                <ellipse cx={pudX} cy={pudY} rx={rx} ry={ry} fill={colors.water} opacity={0.5 + weather!.intensity * 0.3} />
                {/* Rim light (top crescent) */}
                <path
                  d={`M ${pudX - rx * 0.7} ${pudY - ry * 0.6}
                      Q ${pudX} ${pudY - ry * 0.9}, ${pudX + rx * 0.7} ${pudY - ry * 0.6}`}
                  stroke={colors.waterHi}
                  strokeWidth="1"
                  strokeLinecap="round"
                  opacity={0.65}
                  fill="none"
                />
                {/* Pixel glints */}
                <rect x={pudX - rx * 0.2} y={pudY - ry * 0.9} width="1" height="1" fill={colors.waterHi} opacity="0.9" />
                <rect x={pudX + rx * 0.15} y={pudY - ry * 0.8} width="1" height="1" fill={colors.waterHi} opacity="0.8" />

                {/* Ripples (CSS animated scale/opacity) */}
                <g className="ripple" style={{ animationDelay: delay }}>
                  <ellipse cx={pudX} cy={pudY - ry * 0.2} rx={rx * 0.55} ry={ry * 0.6} fill="none" stroke={colors.waterHi} strokeWidth="1" opacity="0.45" />
                </g>

                {/* Plop/splash (every 3rd puddle) */}
                {i % 3 === 0 && (
                  <g className="plop" style={{ animationDelay: delay }}>
                    <rect x={pudX - 0.5} y={pudY - ry - 2} width="1" height="2" fill={colors.waterHi} />
                    <rect x={pudX + 2} y={pudY - ry - 1} width="1" height="1" fill={colors.waterHi} />
                    <rect x={pudX - 3} y={pudY - ry - 1} width="1" height="1" fill={colors.waterHi} />
                  </g>
                )}
              </g>
            );
          })}

          {/* Wet sheen on ground */}
          <rect
            x="0"
            y={p(height * 0.80)}
            width={width}
            height={p(height * 0.20)}
            fill={colors.water}
            opacity={0.1 + weather!.intensity * 0.15}
          />
        </g>
      )}

      {/* Heatwave effects (unchanged) */}
      {weather && (weather.condition === 'hot' || weather.condition === 'humid') && (
        <g opacity="0.4">
          <defs>
            <filter id="heatShimmer">
              <feTurbulence baseFrequency="0.02 0.01" numOctaves="2" result="turbulence" seed={5} />
              <feDisplacementMap in="SourceGraphic" in2="turbulence" scale="2" xChannelSelector="R" yChannelSelector="G" />
            </filter>
          </defs>
          <rect
            x="0"
            y={p(height * 0.65)}
            width={width}
            height={p(height * 0.15)}
            fill="url(#temperateSky)"
            filter="url(#heatShimmer)"
            opacity="0.2"
          />
          <rect x="0" y={p(height * 0.80)} width={width} height={p(height * 0.20)} fill="#8B7355" opacity={weather.condition === 'hot' ? 0.3 : 0.15} />
          {weather.condition === 'humid' && (
            <>
              <rect x="0" y={p(height * 0.70)} width={width} height={p(height * 0.10)} fill="#E0E0E0" opacity="0.25" />
              <rect x="0" y={p(height * 0.75)} width={width} height={p(height * 0.08)} fill="#F0F0F0" opacity="0.20" />
            </>
          )}
        </g>
      )}

      {/* Snow overlay (unchanged hills/trees) */}
      {isSnowing && (
        <g opacity={0.7 + weather!.intensity * 0.3}>
          <path
            d={`
              M 0 ${p(height * 0.82)}
              C ${p(width * 0.15)} ${p(height * (0.81 - weather!.intensity * 0.02))}, 
                ${p(width * 0.35)} ${p(height * (0.83 - weather!.intensity * 0.01))}, 
                ${p(width * 0.5)} ${p(height * 0.82)}
              S ${p(width * 0.85)} ${p(height * (0.81 - weather!.intensity * 0.02))}, 
                ${width} ${p(height * 0.82)}
              L ${width} ${height} L 0 ${height} Z
            `}
            fill="#E5E7EB"
            opacity={0.6 + weather!.intensity * 0.4}
          />
          <path
            d={`
              M 0 ${p(height * 0.74)}
              C ${p(width * 0.14)} ${p(height * (0.68 - weather!.intensity * 0.02))}, 
                ${p(width * 0.32)} ${p(height * 0.70)}, 
                ${p(width * 0.48)} ${p(height * (0.69 - weather!.intensity * 0.01))}
              S ${p(width * 0.78)} ${p(height * 0.66)}, ${width} ${p(height * 0.72)}
              L ${width} ${p(height * 0.76)} 
              C ${p(width * 0.8)} ${p(height * 0.75)}, 
                ${p(width * 0.5)} ${p(height * 0.74)}, 
                ${p(width * 0.2)} ${p(height * 0.76)}
              L 0 ${p(height * 0.77)} Z
            `}
            fill="#F3F4F6"
            opacity={0.3 + weather!.intensity * 0.2}
          />
          {[...Array(18)].map((_, i) => {
            const x = (i + 1) / 19;
            const cx = p(width * x + Math.sin(i * 77.7) * 7);
            const baseY = p(height * (0.775 + Math.sin(i * 0.9) * 0.01));
            const h = height * (0.12 + (i % 3 === 0 ? 0.06 : (i % 2 ? 0.03 : 0)));
            const crownY = baseY - h * 0.6;
            const crownW = h * 0.55;
            return (
              <ellipse
                key={`snow-${i}`}
                cx={cx}
                cy={crownY - h * 0.08}
                rx={crownW * 0.6}
                ry={h * 0.04}
                fill="#F9FAFB"
                opacity={0.7 + weather!.intensity * 0.3}
              />
            );
          })}
        </g>
      )}

      {/* Night-only distant campfire on non-urban maps (1-in-3 chance) */}
      {isNight && !isUrban && oneInThree && (
        <g>
          {/* tiny ember core */}
          <rect
            x={p(width * 0.62)}
            y={p(height * 0.78)}
            width="1"
            height="1"
            fill="#FF6B00"
            className="flicker"
          />
          {/* faint glow */}
          <rect
            x={p(width * 0.62) - 1}
            y={p(height * 0.78) - 1}
            width="3"
            height="1"
            fill="#FFD27A"
            opacity="0.5"
            className="flicker"
            style={{ animationDelay: '0.2s' }}
          />
          {/* tiny smoke with sparks */}
          <g className="smoke">
            <path
              d={weather?.windSpeed && weather.windSpeed > 15 ?
                `M ${p(width * 0.62) + 0.5} ${p(height * 0.78)}
                  c 1.5 -1, 3 -2, 4 -3.5` :
                `M ${p(width * 0.62) + 0.5} ${p(height * 0.78)}
                  c 0.5 -1.5, 1.2 -2.5, 0.2 -4`}
              stroke="rgba(220,225,235,0.7)"
              strokeWidth="1"
              fill="none"
              strokeLinecap="round"
            />
            {/* Campfire sparks */}
            <rect
              x={p(width * 0.62) - 1}
              y={p(height * 0.78) - 3}
              width="1"
              height="1"
              fill="#FFD700"
              opacity="0.9"
              className="flicker"
              style={{ animationDelay: '0.5s' }}
            />
            <rect
              x={p(width * 0.62) + 1}
              y={p(height * 0.78) - 2}
              width="1"
              height="1"
              fill="#FFA500"
              opacity="0.7"
              className="flicker"
              style={{ animationDelay: '0.8s' }}
            />
          </g>
        </g>
      )}

      </g> {/* End of masked group */}
    </svg>
  );
};

export default React.memo(TemperateHorizon);

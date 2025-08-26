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

import React from 'react';
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

  // Get the actual sky color from props or CSS variables
  const getSkyColors = () => {
    if (sky) {
      return { skyTop: sky.top, skyMid: sky.mid, skyBottom: sky.bottom };
    }
    const rootStyles = getComputedStyle(document.documentElement);
    const skyTop = rootStyles.getPropertyValue('--sky-top').trim() || '#87CEEB';
    const skyMid = rootStyles.getPropertyValue('--sky-mid').trim() || '#E6F3FF';
    const skyBottom =
      rootStyles.getPropertyValue('--sky-bottom').trim() || '#FFF4E6';
    return { skyTop, skyMid, skyBottom };
  };

  // Temperate palette by time of day (greens/blues; no snow)
  const getColors = () => {
    const { skyTop, skyMid, skyBottom } = getSkyColors();

    // Base temperate colors - greens, browns, blues (darker for better night contrast)
    const temperateBase = {
      farHill: '#8DA5C0',
      midHill: '#6687A8',
      nearHill: '#3A5A7C',
      meadow: '#254A3C',
      meadowAccent: '#2F5A48',
      trunk: '#3A2A1F',
      leafDark: '#1F5A38',
      leafLight: '#2F7A50',
      hazeLight: '#C7D6EC',
      hazeDark: '#A6B8D6',
      water: '#4678A8',
      waterHi: '#A8D8FF',
    };

    // Time of day flags
    const isNight = timeOfDay === 'Night';
    const isDawn = timeOfDay === 'Dawn';
    const isDusk = timeOfDay === 'Dusk';
    const isTwilight = isDawn || isDusk;

    // Variable sky influence based on time of day - VERY STRONG at night for proper bluish tones
    const skyInfluence = isNight ? 0.95 : isDusk ? 0.5 : isDawn ? 0.45 : 0.2;
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

    const tintGround = (baseColor: string) => blendHex(baseColor, skyBottom, skyInfluence);
    const tintVegetation = (baseColor: string) =>
      blendHex(baseColor, skyBottom, skyInfluence * 0.85);
    const tintHaze = (baseColor: string) => blendHex(baseColor, skyMid, hazeInfluence);

    return {
      sky1: 'rgba(0, 0, 0, 0.0)',
      sky2: `${skyMid}33`,
      sky3: `${skyBottom}99`,
      farHill: tintHill(temperateBase.farHill, 'far'),
      midHill: tintHill(temperateBase.midHill, 'mid'),
      nearHill: tintHill(temperateBase.nearHill, 'near'),
      meadow: tintGround(temperateBase.meadow),
      meadowAccent: tintGround(temperateBase.meadowAccent),
      trunk: tintVegetation(temperateBase.trunk),
      leafDark: tintVegetation(temperateBase.leafDark),
      leafLight: tintVegetation(temperateBase.leafLight),
      hazeLight: tintHaze(temperateBase.hazeLight),
      hazeDark: tintHaze(temperateBase.hazeDark),
      water: tintGround(temperateBase.water),
      waterHi: blendHex(temperateBase.waterHi, skyMid, hazeInfluence),
    };
  };

  const colors = getColors();

  // --- helpers ---
  const p = (v: number) => Math.round(v);

  // Night / precipitation flags for the new micro-effects
  const isNight = timeOfDay === 'Night';
  const isRaining = !!(weather && weather.precipitation === 'rain' && weather.intensity > 0);
  const isSnowing = !!(weather && weather.precipitation === 'snow' && weather.intensity > 0);

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
        `}</style>

        {/* Sky that fades to hills then feathers into panel color */}
        <linearGradient id="temperateSky" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={colors.sky1} stopOpacity={0} />
          <stop offset="35%" stopColor={colors.sky2} stopOpacity={0.35} />
          <stop offset="68%" stopColor={colors.sky3} stopOpacity={0.85} />
          <stop offset="100%" stopColor={colors.nearHill} stopOpacity={1} />
        </linearGradient>

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
      </defs>

      {/* Background sky */}
      <rect x="0" y="0" width={width} height={height} fill="url(#temperateSky)" />

      {/* FAR rolling hills */}
      <g filter="url(#softMist)" opacity="0.8">
        <path
          d={`
            M 0 ${p(height * 0.58)}
            C ${p(width * 0.10)} ${p(height * 0.40)}, ${p(width * 0.22)} ${p(height * 0.46)}, ${p(width * 0.34)} ${p(height * 0.42)}
            S ${p(width * 0.62)} ${p(height * 0.36)}, ${p(width * 0.78)} ${p(height * 0.44)}
            S ${p(width * 0.96)} ${p(height * 0.50)}, ${width} ${p(height * 0.52)}
            L ${width} ${height} L 0 ${height} Z
          `}
          fill={colors.farHill}
        />
      </g>

      {/* Haze between far/mid */}
      <rect x="0" y={p(height * 0.48)} width={width} height={p(height * 0.08)} fill="url(#hazeDark)" />

      {/* MID hills */}
      <g opacity="0.95">
        <path
          d={`
            M 0 ${p(height * 0.66)}
            C ${p(width * 0.12)} ${p(height * 0.54)}, ${p(width * 0.28)} ${p(height * 0.60)}, ${p(width * 0.42)} ${p(height * 0.57)}
            S ${p(width * 0.70)} ${p(height * 0.52)}, ${p(width * 0.88)} ${p(height * 0.60)}
            L ${width} ${height} L 0 ${height} Z
          `}
          fill={colors.midHill}
        />
      </g>

      {/* Haze between mid/near */}
      <rect x="0" y={p(height * 0.60)} width={width} height={p(height * 0.07)} fill="url(#hazeLight)" />

      {/* NEAR hills */}
      <path
        d={`
          M 0 ${p(height * 0.74)}
          C ${p(width * 0.14)} ${p(height * 0.68)}, ${p(width * 0.32)} ${p(height * 0.70)}, ${p(width * 0.48)} ${p(height * 0.69)}
          S ${p(width * 0.78)} ${p(height * 0.66)}, ${width} ${p(height * 0.72)}
          L ${width} ${height} L 0 ${height} Z
        `}
        fill={colors.nearHill}
      />

      {/* Deciduous forest band along the near ridge */}
      <g opacity="0.98">
        {/* Treeline strip */}
        <path
          d={`
            M 0 ${p(height * 0.78)}
            L ${p(width * 0.12)} ${p(height * 0.772)}
            L ${p(width * 0.26)} ${p(height * 0.784)}
            L ${p(width * 0.40)} ${p(height * 0.770)}
            L ${p(width * 0.56)} ${p(height * 0.785)}
            L ${p(width * 0.72)} ${p(height * 0.775)}
            L ${p(width * 0.88)} ${p(height * 0.790)}
            L ${width} ${p(height * 0.782)}
            L ${width} ${height} L 0 ${height} Z
          `}
          fill={colors.meadowAccent}
        />

        {/* Individual deciduous trees (rounded pixel clumps) */}
        {[...Array(18)].map((_, i) => {
          const x = (i + 1) / 19;
          const cx = p(width * x + Math.sin(i * 77.7) * 7);
          const baseY = p(height * (0.775 + Math.sin(i * 0.9) * 0.01));
          const h = height * (0.12 + (i % 3 === 0 ? 0.06 : i % 2 ? 0.03 : 0));
          const crownY = baseY - h * 0.6;
          const crownW = h * 0.55;

          return (
            <g key={i} shapeRendering="crispEdges">
              {/* trunk */}
              <rect x={cx - h * 0.03} y={baseY - h * 0.26} width={h * 0.06} height={h * 0.28} fill={colors.trunk} />
              {/* crown (stacked rectangles to read as pixel art blobs) */}
              <rect x={cx - crownW * 0.6} y={crownY - h * 0.06} width={crownW * 1.2} height={h * 0.12} fill={colors.leafDark} />
              <rect x={cx - crownW * 0.5} y={crownY + h * 0.02} width={crownW} height={h * 0.12} fill={colors.leafLight} />
              <rect x={cx - crownW * 0.35} y={crownY + h * 0.12} width={crownW * 0.7} height={h * 0.10} fill={colors.leafDark} />
            </g>
          );
        })}
      </g>

      {/* Meadow strip that feathers into the bottom panel color */}
      <rect x="0" y={p(height * 0.82)} width={width} height={p(height * 0.18)} fill="url(#panelFeather)" />

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
            />
            <path
              d={`M ${p(width * 0.03)} ${p(height * 0.76)} Q ${p(width * 0.10)} ${p(height * 0.75)}, ${p(width * 0.16)} ${p(height * 0.76)}`}
              stroke={colors.waterHi}
              strokeWidth="1"
              opacity="0.3"
              fill="none"
            />
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
            />
            <path
              d={`M ${p(width * 0.97)} ${p(height * 0.80)} Q ${p(width * 0.90)} ${p(height * 0.79)}, ${p(width * 0.84)} ${p(height * 0.80)}`}
              stroke={colors.waterHi}
              strokeWidth="1"
              opacity="0.3"
              fill="none"
            />
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
                {/* Chimney smoke (night 1/3, or always during snow) */}
                {thisHasSmoke && (
                  <g className="smoke" style={{ animationDelay: `${(i % 3) * 0.25}s` }}>
                    <path
                      d={`M ${houseX + houseW * 0.23 + 1} ${houseY - houseH - 4}
                          c 1 -2, 2 -2, 2 -4
                          c 1 -2, 0 -3, -1 -5`}
                      stroke={`rgba(220,225,235,${isNight ? 0.8 : 0.5})`}
                      strokeWidth="1"
                      fill="none"
                      strokeLinecap="round"
                    />
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
          {/* tiny smoke */}
          <g className="smoke">
            <path
              d={`M ${p(width * 0.62) + 0.5} ${p(height * 0.78)}
                  c 0.5 -1.5, 1.2 -2.5, 0.2 -4`}
              stroke="rgba(220,225,235,0.7)"
              strokeWidth="1"
              fill="none"
              strokeLinecap="round"
            />
          </g>
        </g>
      )}
    </svg>
  );
};

export default React.memo(TemperateHorizon);

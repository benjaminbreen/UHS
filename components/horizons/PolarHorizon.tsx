/**
 * components/horizons/PolarHorizon.tsx
 * Polar climate horizon with massive glaciers, ice formations, and no vegetation
 * Epic frozen wasteland with dramatic ice structures and aurora
 */

import React from 'react';
import { TimeOfDay } from '../../types';
import { WeatherState } from '../../services/weatherService';

interface PolarHorizonProps {
  timeOfDay: TimeOfDay;
  width: number;
  height: number;
  hasWater?: boolean;
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

const PolarHorizon: React.FC<PolarHorizonProps> = ({
  timeOfDay,
  width,
  height,
  hasWater = false,
  weather,
  sky
}) => {
  // Helper function for rounding SVG path coordinates
  const p = (n: number) => Math.round(n * 100) / 100;

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

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };

  // Get the actual sky color from props or CSS variables
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

  // Polar color palette - pure ice and snow
  const getColors = () => {
    const { skyTop, skyMid, skyBottom } = getSkyColors();

    // Base polar colors - pure whites, ice blues, and deep cold grays
    const polarBase = {
      glacierMassive: '#F8FCFF',      // Massive glacier faces
      glacierHighlight: '#FFFFFF',     // Glacier highlights
      iceShelf: '#E8F4FD',           // Ice shelf formations
      iceDeep: '#C8E3F0',            // Deep ice crevasses
      snowPure: '#FFFAFA',           // Pure snow
      snowBlue: '#F0F8FF',           // Blue-tinted snow
      glacialBlue: '#B0D4E8',        // Glacial ice blue
      crevasse: '#7B9FC7',           // Deep crevasses
      ground: '#D8E5F0',             // Snow-covered ground
      groundShadow: '#BDD1E0',       // Ground shadows
      seaIce: '#E0F0FF',             // Sea ice
      water: '#4A6B8A',              // Dark polar water
      iceberg: '#F0F8FF',            // Icebergs
      icebergShadow: '#D0E0F0',      // Iceberg shadows
      aurora: [] as string[]
    };

    // Time of day flags
    const isNight = timeOfDay === 'Night';
    const isDawn = timeOfDay === 'Dawn';
    const isDusk = timeOfDay === 'Dusk';
    const isTwilight = isDawn || isDusk;

    // Enhanced sky influence for polar conditions - more dramatic than cold
    const skyInfluence = isNight ? 0.95 : isDusk ? 0.60 : isDawn ? 0.55 : 0.25;
    const iceInfluence = isNight ? 0.75 : isTwilight ? 0.40 : 0.15;

    // Helper to tint with appropriate sky color
    const tintGlacier = (baseColor: string, distance: 'far' | 'mid' | 'near') => {
      const skyColor = distance === 'far' ? skyTop : distance === 'mid' ? skyMid : skyBottom;
      const influence = distance === 'far' ? skyInfluence * 1.3 : distance === 'mid' ? skyInfluence : skyInfluence * 0.9;
      return blendHex(baseColor, skyColor, influence);
    };

    const tintIce = (baseColor: string) => blendHex(baseColor, skyBottom, iceInfluence);
    const tintGround = (baseColor: string) => blendHex(baseColor, skyBottom, skyInfluence);

    // Aurora colors - more intense for polar regions
    const auroraColors = isNight ? ['#00FF7F', '#FF69B4', '#00BFFF', '#9932CC'] :
                        isDusk ? ['#FF00FF', '#00FFFF', '#FFD700', '#FF4500'] :
                        isDawn ? ['#00FF00', '#FF1493', '#00CED1', '#FFA500'] : [];

    return {
      sky1: 'rgba(0, 0, 0, 0.0)',
      sky2: `${skyMid}44`,
      sky3: `${skyBottom}BB`,
      glacierMassive: tintIce(polarBase.glacierMassive),
      glacierHighlight: tintIce(polarBase.glacierHighlight),
      iceShelf: tintGlacier(polarBase.iceShelf, 'mid'),
      iceDeep: tintGlacier(polarBase.iceDeep, 'mid'),
      snowPure: tintIce(polarBase.snowPure),
      snowBlue: tintIce(polarBase.snowBlue),
      glacialBlue: tintGlacier(polarBase.glacialBlue, 'near'),
      crevasse: tintGlacier(polarBase.crevasse, 'near'),
      ground: tintGround(polarBase.ground),
      groundShadow: tintGround(polarBase.groundShadow),
      seaIce: tintIce(polarBase.seaIce),
      water: tintGround(polarBase.water),
      iceberg: tintIce(polarBase.iceberg),
      icebergShadow: tintIce(polarBase.icebergShadow),
      aurora: auroraColors
    };
  };

  const colors = getColors();

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid slice"
      style={{ position: 'absolute', bottom: 0, left: 0 }}
    >
      <defs>
        <linearGradient id="polarSky" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={colors.sky1} stopOpacity="0" />
          <stop offset="25%" stopColor={colors.sky2} stopOpacity="0.2" />
          <stop offset="55%" stopColor={colors.sky3} stopOpacity="0.7" />
          <stop offset="100%" stopColor={colors.ground} stopOpacity="1" />
        </linearGradient>

        <linearGradient id="glacierGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={colors.glacierHighlight} stopOpacity="1" />
          <stop offset="40%" stopColor={colors.glacierMassive} stopOpacity="0.9" />
          <stop offset="100%" stopColor={colors.iceDeep} stopOpacity="1" />
        </linearGradient>

        <filter id="iceGlow">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1" />
          <feComponentTransfer>
            <feFuncA type="discrete" tableValues="0 .3 .6 .8 1" />
          </feComponentTransfer>
        </filter>

        <filter id="polarMist">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
        </filter>

        {/* Enhanced Aurora gradient for polar regions */}
        {(timeOfDay === 'Night' || timeOfDay === 'Dusk' || timeOfDay === 'Dawn') && colors.aurora.length > 0 && (
          <linearGradient id="auroraGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            {colors.aurora.map((color, i) => (
              <stop key={i} offset={`${(i / (colors.aurora.length - 1)) * 100}%`} stopColor={color} stopOpacity="0.4" />
            ))}
          </linearGradient>
        )}

        {/* Crevasse shadow pattern */}
        <pattern id="crevassePattern" x="0" y="0" width="20" height="10" patternUnits="userSpaceOnUse">
          <rect width="20" height="10" fill={colors.iceShelf} />
          <path d="M 2 5 L 18 5" stroke={colors.crevasse} strokeWidth="0.5" opacity="0.3" />
          <path d="M 6 2 L 6 8" stroke={colors.crevasse} strokeWidth="0.3" opacity="0.2" />
          <path d="M 14 1 L 14 9" stroke={colors.crevasse} strokeWidth="0.3" opacity="0.2" />
        </pattern>
      </defs>

      {/* Sky background */}
      <rect x="0" y="0" width={width} height={height} fill="url(#polarSky)" />

      {/* Aurora Borealis - more prominent in polar regions */}
      {(timeOfDay === 'Night' || timeOfDay === 'Dusk' || timeOfDay === 'Dawn') && (
        <g opacity={timeOfDay === 'Night' ? "0.7" : "0.4"}>
          <path
            d={`
              M 0 ${height * 0.05}
              Q ${width * 0.2} ${height * 0.02}, ${width * 0.4} ${height * 0.06}
              T ${width * 0.8} ${height * 0.04}
              L ${width} ${height * 0.08}
              L ${width} ${height * 0.30}
              Q ${width * 0.7} ${height * 0.25}, ${width * 0.3} ${height * 0.28}
              T 0 ${height * 0.25} Z
            `}
            fill="url(#auroraGradient)"
          />
          <path
            d={`
              M 0 ${height * 0.15}
              Q ${width * 0.3} ${height * 0.12}, ${width * 0.6} ${height * 0.18}
              T ${width} ${height * 0.16}
              L ${width} ${height * 0.35}
              Q ${width * 0.6} ${height * 0.32}, ${width * 0.2} ${height * 0.38}
              T 0 ${height * 0.35} Z
            `}
            fill="url(#auroraGradient)"
            opacity="0.6"
          />
        </g>
      )}

      {/* Far massive glacier wall */}
      <g opacity="0.85">
        <path
          d={`
            M 0 ${height * 0.45}
            Q ${width * 0.15} ${height * 0.35}, ${width * 0.3} ${height * 0.40}
            T ${width * 0.6} ${height * 0.38}
            Q ${width * 0.8} ${height * 0.42}, ${width} ${height * 0.45}
            L ${width} ${height}
            L 0 ${height} Z
          `}
          fill="url(#glacierGradient)"
        />
        {/* Glacier crevasses */}
        <path d={`M 0 ${height * 0.45} Q ${width * 0.3} ${height * 0.38}, ${width * 0.6} ${height * 0.40} T ${width} ${height * 0.45}`}
              stroke={colors.crevasse} strokeWidth="2" opacity="0.4" fill="none" />
        <path d={`M ${width * 0.2} ${height * 0.50} L ${width * 0.25} ${height * 0.70}`}
              stroke={colors.crevasse} strokeWidth="1.5" opacity="0.6" />
        <path d={`M ${width * 0.7} ${height * 0.48} L ${width * 0.68} ${height * 0.65}`}
              stroke={colors.crevasse} strokeWidth="1.5" opacity="0.6" />
      </g>

      {/* Mid-distance ice formations */}
      <g opacity="0.92">
        <path
          d={`
            M 0 ${height * 0.58}
            Q ${width * 0.2} ${height * 0.52}, ${width * 0.45} ${height * 0.55}
            T ${width} ${height * 0.60}
            L ${width} ${height}
            L 0 ${height} Z
          `}
          fill={colors.iceShelf}
        />
        {/* Ice shelf details */}
        <rect x={0} y={height * 0.58} width={width} height={height * 0.08}
              fill="url(#crevassePattern)" opacity="0.3" />
      </g>

      {/* Near ice formations and seracs */}
      <g>
        <path
          d={`
            M 0 ${height * 0.70}
            Q ${width * 0.25} ${height * 0.68}, ${width * 0.5} ${height * 0.72}
            T ${width} ${height * 0.70}
            L ${width} ${height}
            L 0 ${height} Z
          `}
          fill={colors.glacialBlue}
        />

        {/* Ice seracs (towering ice formations) */}
        {[0.15, 0.35, 0.55, 0.75, 0.85].map((x, i) => {
          const seracHeight = height * (0.15 + Math.sin(i * 2.1) * 0.08);
          const seracX = width * x;
          const seracY = height * 0.70;
          const seracWidth = width * (0.03 + Math.sin(i * 1.7) * 0.02);

          return (
            <g key={`serac-${i}`}>
              <path
                d={`
                  M ${seracX - seracWidth} ${seracY}
                  L ${seracX - seracWidth * 0.5} ${seracY - seracHeight}
                  L ${seracX + seracWidth * 0.5} ${seracY - seracHeight}
                  L ${seracX + seracWidth} ${seracY}
                  Z
                `}
                fill={colors.snowPure}
                opacity="0.9"
              />
              {/* Serac shadow */}
              <path
                d={`
                  M ${seracX + seracWidth * 0.3} ${seracY}
                  L ${seracX + seracWidth * 0.7} ${seracY - seracHeight * 0.8}
                  L ${seracX + seracWidth} ${seracY}
                  Z
                `}
                fill={colors.crevasse}
                opacity="0.3"
              />
            </g>
          );
        })}
      </g>

      {/* Icebergs in water (if hasWater) */}
      {hasWater && (
        <g>
          {/* Water surface */}
          <rect x="0" y={height * 0.75} width={width} height={height * 0.25} fill={colors.water} opacity="0.8" />
          <rect x="0" y={height * 0.75} width={width} height={height * 0.05} fill={colors.seaIce} opacity="0.6" />

          {/* Floating icebergs */}
          {[0.2, 0.6, 0.9].map((x, i) => {
            const icebergX = width * x;
            const icebergY = height * 0.78;
            const icebergSize = width * (0.04 + i * 0.02);

            return (
              <g key={`iceberg-${i}`}>
                <path
                  d={`
                    M ${icebergX - icebergSize} ${icebergY + icebergSize * 0.5}
                    L ${icebergX} ${icebergY - icebergSize * 0.3}
                    L ${icebergX + icebergSize} ${icebergY + icebergSize * 0.5}
                    L ${icebergX + icebergSize * 0.7} ${height}
                    L ${icebergX - icebergSize * 0.7} ${height}
                    Z
                  `}
                  fill={colors.iceberg}
                  opacity="0.9"
                />
                {/* Iceberg underwater portion (barely visible) */}
                <ellipse cx={icebergX} cy={height * 0.85} rx={icebergSize * 1.2} ry={icebergSize * 0.8}
                         fill={colors.icebergShadow} opacity="0.2" />
              </g>
            );
          })}
        </g>
      )}

      {/* Foreground snow drifts */}
      <g>
        <path
          d={`
            M 0 ${height * 0.85}
            Q ${width * 0.3} ${height * 0.82}, ${width * 0.7} ${height * 0.84}
            T ${width} ${height * 0.85}
            L ${width} ${height}
            L 0 ${height} Z
          `}
          fill={colors.ground}
        />

        {/* Snow texture details */}
        {[0.1, 0.3, 0.5, 0.7, 0.9].map((x, i) => (
          <ellipse
            key={`snow-drift-${i}`}
            cx={width * x}
            cy={height * (0.86 + Math.sin(i * 2.3) * 0.02)}
            rx={width * (0.05 + Math.sin(i * 1.8) * 0.03)}
            ry={height * 0.01}
            fill={colors.snowBlue}
            opacity="0.4"
          />
        ))}
      </g>

      {/* Blowing snow effect */}
      {weather?.windSpeed && weather.windSpeed > 10 && (
        <g opacity="0.6" filter="url(#polarMist)">
          {Array.from({ length: 12 }).map((_, i) => {
            const x = (width / 12) * i + Math.sin(i * 3.7) * 20;
            const y = height * (0.3 + Math.sin(i * 2.1) * 0.4);

            return (
              <circle
                key={`blowing-snow-${i}`}
                cx={x}
                cy={y}
                r={1 + Math.sin(i * 1.9) * 0.5}
                fill={colors.snowPure}
                opacity="0.7"
              />
            );
          })}
        </g>
      )}

      {/* Ice crystal sparkles for clear weather */}
      {(!weather?.precipitation || weather.precipitation === 'none') && (
        <g opacity="0.8" filter="url(#iceGlow)">
          {Array.from({ length: 8 }).map((_, i) => {
            const x = width * (0.1 + (i / 8) * 0.8);
            const y = height * (0.2 + Math.sin(i * 2.7) * 0.3);

            return (
              <g key={`sparkle-${i}`}>
                <circle cx={x} cy={y} r="0.5" fill={colors.glacierHighlight} opacity="0.9" />
                <path d={`M ${x-2} ${y} L ${x+2} ${y} M ${x} ${y-2} L ${x} ${y+2}`}
                      stroke={colors.glacierHighlight} strokeWidth="0.3" opacity="0.7" />
              </g>
            );
          })}
        </g>
      )}
    </svg>
  );
};

export default React.memo(PolarHorizon);
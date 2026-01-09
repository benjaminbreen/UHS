/**
 * components/horizons/ColdHorizon.tsx
 * Cold/Arctic climate horizon with snow-covered peaks, evergreen forests, and ice
 */

import React, { useMemo } from 'react';
import { TimeOfDay } from '../../types';
import { WeatherState } from '../../services/weatherService';

interface ColdHorizonProps {
  timeOfDay: TimeOfDay;
  width: number;
  height: number;
  hasWater?: boolean;
  isUrban?: boolean;
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

const ColdHorizon: React.FC<ColdHorizonProps> = ({
  timeOfDay,
  width,
  height,
  hasWater = false,
  isUrban = false,
  weather,
  sky
}) => {
  // Helper function for rounding SVG path coordinates
  const p = (n: number) => Math.round(n * 100) / 100;

  // Seeded random for stable positioning
  const seededRandom = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };
  
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
  // Arctic/cold color palette
  const getColors = () => {
    const { skyTop, skyMid, skyBottom } = getSkyColors();
    
    // Base cold colors - whites, blues, grays
    const coldBase = {
      peaks: '#F8F8FF',
      peaksAccent: '#F0F8FF',
      snowField: '#F0FFFF',
      snowAccent: '#E6E6FA',
      glacier: '#B0C4DE',
      glacierAccent: '#C6D7E9',
      near: '#778899',
      nearAccent: '#8B9DC3',
      ground: '#4B5C6B',
      pine: '#2F4F4F',
      pineSnow: '#F5F5F5',
      ice: '#E0F2FF',
      water: '#4682B4',
      aurora: [] as string[]
    };

    // Time of day flags
    const isNight = timeOfDay === 'Night';
    const isDawn = timeOfDay === 'Dawn';
    const isDusk = timeOfDay === 'Dusk';
    const isTwilight = isDawn || isDusk;

    // Variable sky influence based on time of day - STRONG at night
    const skyInfluence = isNight ? 0.85 : isDusk ? 0.45 : isDawn ? 0.40 : 0.15;
    const snowInfluence = isNight ? 0.60 : isTwilight ? 0.25 : 0.10; // Snow gets bluish too at night

    // Helper to tint with appropriate sky color
    const tintMountain = (baseColor: string, distance: 'far' | 'mid' | 'near') => {
      const skyColor = distance === 'far' ? skyTop : distance === 'mid' ? skyMid : skyBottom;
      const influence = distance === 'far' ? skyInfluence * 1.2 : distance === 'mid' ? skyInfluence : skyInfluence * 0.8;
      return blendHex(baseColor, skyColor, influence);
    };

    const tintSnow = (baseColor: string) => blendHex(baseColor, skyBottom, snowInfluence);
    const tintGround = (baseColor: string) => blendHex(baseColor, skyBottom, skyInfluence);
    const tintVegetation = (baseColor: string) => blendHex(baseColor, skyBottom, skyInfluence * 0.85);

    // Aurora colors for night/twilight
    const auroraColors = isNight ? ['#00FF7F', '#FF69B4', '#00BFFF'] :
                        isDusk ? ['#FF00FF', '#00FFFF', '#FFD700'] :
                        isDawn ? ['#00FF00', '#FF1493', '#00CED1'] : [];

    return {
      sky1: 'rgba(0, 0, 0, 0.0)',
      sky2: `${skyMid}33`,
      sky3: `${skyBottom}99`,
      peaks: tintSnow(coldBase.peaks),
      peaksAccent: tintSnow(coldBase.peaksAccent),
      snowField: tintSnow(coldBase.snowField),
      snowAccent: tintSnow(coldBase.snowAccent),
      glacier: tintMountain(coldBase.glacier, 'mid'),
      glacierAccent: tintMountain(coldBase.glacierAccent, 'mid'),
      near: tintMountain(coldBase.near, 'near'),
      nearAccent: tintMountain(coldBase.nearAccent, 'near'),
      ground: tintGround(coldBase.ground),
      pine: tintVegetation(coldBase.pine),
      pineSnow: tintSnow(coldBase.pineSnow),
      ice: tintSnow(coldBase.ice),
      water: tintGround(coldBase.water),
      aurora: auroraColors
    };
  };

  const colors = getColors();

  // Time flags
  const isNight = timeOfDay === 'Night';
  const isDawn = timeOfDay === 'Dawn';
  const isDusk = timeOfDay === 'Dusk';
  const isTwilight = isDawn || isDusk;

  // Generate stable bird positions (arctic terns, ravens)
  const birds = useMemo(() => {
    if (isNight) return []; // Birds roost at night
    const birdCount = isTwilight ? 4 : 2;
    return Array.from({ length: birdCount }, (_, i) => ({
      x: p(width * (0.15 + seededRandom(width + i * 137) * 0.7)),
      y: p(height * (0.25 + seededRandom(height + i * 239) * 0.2)),
      size: 2 + (i % 2),
      type: seededRandom(i * 317) > 0.6 ? 'raven' : 'tern', // Ravens are larger, slower
      speed: 18 + seededRandom(i * 419) * 12,
      delay: seededRandom(i * 521) * 8,
    }));
  }, [width, height, isNight, isTwilight]);

  // Generate ice glint positions for frozen water
  const iceGlints = useMemo(() => {
    if (!hasWater) return [];
    const glintCount = isNight ? 3 : 6;
    return Array.from({ length: glintCount }, (_, i) => ({
      x: p(width * (0.1 + seededRandom(width + i * 623) * 0.8)),
      y: p(height * (0.84 + seededRandom(height + i * 727) * 0.04)),
      size: 1 + (seededRandom(i * 829) > 0.7 ? 1 : 0),
      delay: seededRandom(i * 931) * 4,
      duration: 2 + seededRandom(i * 1033) * 2,
    }));
  }, [width, height, hasWater, isNight]);

  // Generate distant smoke positions for settlements
  const settlementSmokes = useMemo(() => {
    if (!isUrban) return [];
    const smokeCount = 2 + (seededRandom(width * height) > 0.5 ? 1 : 0);
    return Array.from({ length: smokeCount }, (_, i) => ({
      x: p(width * (0.25 + seededRandom(width + i * 1137) * 0.5)),
      y: p(height * (0.72 + seededRandom(height + i * 1239) * 0.04)),
    }));
  }, [width, height, isUrban]);

  const PEAK_HEIGHT_SCALE = 0.6;          // 60% of original height
const PEAK_BASE_Y = height * 0.6;       // base of the mountain path ("M 0 height*0.6")

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid slice"
      style={{ position: 'absolute', bottom: 0, left: 0 }}
    >
      <defs>
        {/* CSS Animations */}
        <style>{`
          @keyframes iceGlint {
            0%, 100% { opacity: 0.2; }
            50% { opacity: 0.9; }
          }
          @keyframes birdFly {
            0% { transform: translateX(0); }
            100% { transform: translateX(var(--fly-distance, 100px)); }
          }
          @keyframes smokeRise {
            0% { transform: translateY(0px) translateX(0px); opacity: 0.5; }
            100% { transform: translateY(-18px) translateX(3px); opacity: 0; }
          }
          .ice-glint {
            animation: iceGlint var(--duration, 3s) ease-in-out var(--delay, 0s) infinite;
          }
          .bird-fly {
            animation: birdFly var(--speed, 20s) linear var(--delay, 0s) infinite;
          }
          .arctic-smoke {
            animation: smokeRise 3.5s linear infinite;
          }
          @keyframes auroraPulse {
            0%, 100% { opacity: 0.4; transform: translateX(0) scaleY(1); }
            25% { opacity: 0.6; transform: translateX(-8px) scaleY(1.05); }
            50% { opacity: 0.5; transform: translateX(5px) scaleY(0.95); }
            75% { opacity: 0.7; transform: translateX(-3px) scaleY(1.02); }
          }
          @keyframes auroraWave {
            0%, 100% { transform: translateY(0) scaleX(1); opacity: 0.35; }
            33% { transform: translateY(-4px) scaleX(1.02); opacity: 0.5; }
            66% { transform: translateY(2px) scaleX(0.98); opacity: 0.4; }
          }
          @keyframes auroraShimmer {
            0%, 100% { stroke-opacity: 0.3; stroke-dashoffset: 0; }
            50% { stroke-opacity: 0.6; stroke-dashoffset: 20; }
          }
          .aurora-main {
            animation: auroraPulse 12s ease-in-out infinite;
            transform-origin: center;
          }
          .aurora-band {
            animation: auroraWave 8s ease-in-out infinite;
            transform-origin: center;
          }
          .aurora-streak {
            stroke-dasharray: 30 15;
            animation: auroraShimmer 6s ease-in-out infinite;
          }
        `}</style>

        <linearGradient id="arcticSky" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={colors.sky1} stopOpacity="0" />
          <stop offset="35%" stopColor={colors.sky2} stopOpacity="0.3" />
          <stop offset="65%" stopColor={colors.sky3} stopOpacity="0.8" />
          <stop offset="100%" stopColor={colors.ground} stopOpacity="1" />
        </linearGradient>

        <linearGradient id="snowGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={colors.near} stopOpacity="0.9" />
          <stop offset="100%" stopColor={colors.ground} stopOpacity="1" />
        </linearGradient>

        <filter id="snowGlow">
          <feGaussianBlur in="SourceGraphic" stdDeviation="0.5" />
          <feComponentTransfer>
            <feFuncA type="discrete" tableValues="0 .5 .5 .5 .5 .5 .5 .5 .5 .5 1" />
          </feComponentTransfer>
        </filter>

        <filter id="coldMist">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
        </filter>

        {/* Aurora gradient for night */}
        {timeOfDay === 'Night' && colors.aurora.length > 0 && (
          <linearGradient id="auroraGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            {colors.aurora.map((color, i) => (
              <stop key={i} offset={`${(i / (colors.aurora.length - 1)) * 100}%`} stopColor={color} stopOpacity="0.3" />
            ))}
          </linearGradient>
        )}
      </defs>

      {/* Sky background */}
      <rect x="0" y="0" width={width} height={height} fill="url(#arcticSky)" />

      {/* Aurora Borealis for night - animated */}
      {timeOfDay === 'Night' && (
        <g opacity="0.5">
          {/* Main aurora band */}
          <path
            className="aurora-main"
            d={`
              M 0 ${height * 0.1}
              Q ${width * 0.25} ${height * 0.05}, ${width * 0.5} ${height * 0.08}
              T ${width} ${height * 0.1}
              L ${width} ${height * 0.25}
              Q ${width * 0.75} ${height * 0.2}, ${width * 0.5} ${height * 0.22}
              T 0 ${height * 0.25}
              Z
            `}
            fill="url(#auroraGradient)"
            filter="url(#snowGlow)"
          />
          {/* Secondary wave band */}
          <path
            className="aurora-band"
            d={`
              M 0 ${height * 0.15}
              Q ${width * 0.3} ${height * 0.12}, ${width * 0.6} ${height * 0.15}
              T ${width} ${height * 0.18}
            `}
            stroke={colors.aurora[1]}
            strokeWidth="2"
            fill="none"
            opacity="0.4"
          />
          {/* Additional shimmer streaks */}
          <path
            className="aurora-streak"
            d={`
              M ${width * 0.1} ${height * 0.12}
              Q ${width * 0.35} ${height * 0.08}, ${width * 0.55} ${height * 0.11}
            `}
            stroke={colors.aurora[0]}
            strokeWidth="1.5"
            fill="none"
            opacity="0.35"
          />
          <path
            className="aurora-streak"
            style={{ animationDelay: '2s' }}
            d={`
              M ${width * 0.4} ${height * 0.18}
              Q ${width * 0.65} ${height * 0.14}, ${width * 0.85} ${height * 0.17}
            `}
            stroke={colors.aurora[2]}
            strokeWidth="1.5"
            fill="none"
            opacity="0.3"
          />
        </g>
      )}

      {/* Layer 1: Distant snow-capped mountains */}
      {/* Layer 1: Distant snow-capped mountains */}
<g
  filter="url(#coldMist)"
  opacity="0.7"
  transform={`translate(0, ${PEAK_BASE_Y}) scale(1, ${PEAK_HEIGHT_SCALE}) translate(0, ${-PEAK_BASE_Y})`}
>
  <path
          d={`
            M 0 ${height * 0.6}
            L ${width * 0.1} ${height * 0.25}
            L ${width * 0.15} ${height * 0.3}
            L ${width * 0.2} ${height * 0.2}
            L ${width * 0.25} ${height * 0.28}
            L ${width * 0.35} ${height * 0.15}
            L ${width * 0.4} ${height * 0.22}
            L ${width * 0.5} ${height * 0.18}
            L ${width * 0.55} ${height * 0.25}
            L ${width * 0.65} ${height * 0.2}
            L ${width * 0.7} ${height * 0.3}
            L ${width * 0.8} ${height * 0.22}
            L ${width * 0.85} ${height * 0.28}
            L ${width * 0.95} ${height * 0.35}
            L ${width} ${height * 0.4}
            L ${width} ${height}
            L 0 ${height}
            Z
          `}
          fill={colors.peaks}
        />
        
        {/* Snow caps and glaciers */}
        <path
          d={`
            M ${width * 0.1} ${height * 0.25}
            L ${width * 0.08} ${height * 0.3}
            L ${width * 0.12} ${height * 0.3}
            Z
            M ${width * 0.2} ${height * 0.2}
            L ${width * 0.18} ${height * 0.26}
            L ${width * 0.22} ${height * 0.26}
            Z
            M ${width * 0.35} ${height * 0.15}
            L ${width * 0.33} ${height * 0.22}
            L ${width * 0.37} ${height * 0.22}
            Z
            M ${width * 0.5} ${height * 0.18}
            L ${width * 0.48} ${height * 0.24}
            L ${width * 0.52} ${height * 0.24}
            Z
            M ${width * 0.65} ${height * 0.2}
            L ${width * 0.63} ${height * 0.26}
            L ${width * 0.67} ${height * 0.26}
            Z
          `}
          fill={colors.peaksAccent}
          opacity="0.9"
        />
      </g>

      {/* Layer 2: Glaciers and ice fields */}
      <g opacity="0.85">
        <path
          d={`
            M 0 ${height * 0.7}
            C ${width * 0.1} ${height * 0.65}, ${width * 0.2} ${height * 0.68}, ${width * 0.3} ${height * 0.66}
            S ${width * 0.5} ${height * 0.64}, ${width * 0.6} ${height * 0.67}
            C ${width * 0.7} ${height * 0.65}, ${width * 0.85} ${height * 0.68}, ${width} ${height * 0.7}
            L ${width} ${height}
            L 0 ${height}
            Z
          `}
          fill={colors.glacier}
        />
        
        {/* Ice cracks and crevasses */}
        <path
          d={`
            M ${width * 0.2} ${height * 0.68}
            L ${width * 0.22} ${height * 0.72}
            M ${width * 0.5} ${height * 0.65}
            L ${width * 0.52} ${height * 0.7}
            M ${width * 0.7} ${height * 0.66}
            L ${width * 0.72} ${height * 0.71}
          `}
          stroke={colors.glacierAccent}
          strokeWidth="1"
          opacity="0.5"
        />
        
        {/* Icebergs if water */}
        {hasWater && (
          <>
            <polygon points={`${width * 0.3},${height * 0.7} ${width * 0.32},${height * 0.62} ${width * 0.35},${height * 0.64} ${width * 0.34},${height * 0.7}`} 
                     fill={colors.ice} opacity="0.8" />
            <polygon points={`${width * 0.6},${height * 0.68} ${width * 0.62},${height * 0.6} ${width * 0.65},${height * 0.62} ${width * 0.64},${height * 0.68}`} 
                     fill={colors.ice} opacity="0.7" />
          </>
        )}
      </g>

      {/* Layer 3: Near ground with evergreen forest */}
      <g opacity="0.95">
        <path
          d={`
            M 0 ${height * 0.78}
            L ${width * 0.15} ${height * 0.76}
            L ${width * 0.3} ${height * 0.77}
            L ${width * 0.45} ${height * 0.75}
            L ${width * 0.6} ${height * 0.77}
            L ${width * 0.75} ${height * 0.76}
            L ${width * 0.9} ${height * 0.78}
            L ${width} ${height * 0.77}
            L ${width} ${height}
            L 0 ${height}
            Z
          `}
          fill="url(#snowGradient)"
        />

        {/* Evergreen forest - pine and spruce trees */}
        {[0.05, 0.1, 0.15, 0.22, 0.28, 0.34, 0.4, 0.46, 0.52, 0.58, 0.64, 0.7, 0.76, 0.82, 0.88, 0.94].map((x, i) => {
          const treeHeight = height * (0.18 + Math.sin(i * 1.5) * 0.08);
          const treeX = width * x;
          const treeY = height * 0.78;
          const treeType = i % 3; // Vary tree types
          
          return (
            <g key={`tree-${i}`}>
              {treeType === 0 ? (
                // Tall spruce
                <>
                  <path
                    d={`
                      M ${treeX} ${treeY - treeHeight}
                      L ${treeX - treeHeight * 0.12} ${treeY - treeHeight * 0.7}
                      L ${treeX + treeHeight * 0.12} ${treeY - treeHeight * 0.7}
                      Z
                      M ${treeX} ${treeY - treeHeight * 0.8}
                      L ${treeX - treeHeight * 0.15} ${treeY - treeHeight * 0.4}
                      L ${treeX + treeHeight * 0.15} ${treeY - treeHeight * 0.4}
                      Z
                      M ${treeX} ${treeY - treeHeight * 0.5}
                      L ${treeX - treeHeight * 0.18} ${treeY}
                      L ${treeX + treeHeight * 0.18} ${treeY}
                      Z
                    `}
                    fill={colors.pine}
                  />
                  {/* Snow on branches */}
                  <path
                    d={`
                      M ${treeX} ${treeY - treeHeight}
                      L ${treeX - treeHeight * 0.06} ${treeY - treeHeight * 0.85}
                      L ${treeX + treeHeight * 0.06} ${treeY - treeHeight * 0.85}
                      Z
                    `}
                    fill={colors.pineSnow}
                    opacity="0.8"
                  />
                </>
              ) : treeType === 1 ? (
                // Wide pine
                <>
                  <path
                    d={`
                      M ${treeX} ${treeY - treeHeight}
                      L ${treeX - treeHeight * 0.2} ${treeY}
                      L ${treeX + treeHeight * 0.2} ${treeY}
                      Z
                    `}
                    fill={colors.pine}
                  />
                  {/* Snow accumulation */}
                  <ellipse cx={treeX} cy={treeY - treeHeight * 0.6} rx={treeHeight * 0.12} ry={treeHeight * 0.03} 
                           fill={colors.pineSnow} opacity="0.7" />
                </>
              ) : (
                // Small fir
                <>
                  <path
                    d={`
                      M ${treeX} ${treeY - treeHeight * 0.8}
                      L ${treeX - treeHeight * 0.1} ${treeY - treeHeight * 0.4}
                      L ${treeX + treeHeight * 0.1} ${treeY - treeHeight * 0.4}
                      Z
                      M ${treeX} ${treeY - treeHeight * 0.5}
                      L ${treeX - treeHeight * 0.12} ${treeY}
                      L ${treeX + treeHeight * 0.12} ${treeY}
                      Z
                    `}
                    fill={colors.pine}
                  />
                </>
              )}
            </g>
          );
        })}

        {/* Snow drifts and ground texture */}
        {[0.1, 0.3, 0.5, 0.7, 0.9].map((x, i) => (
          <ellipse
            key={`drift-${i}`}
            cx={width * x}
            cy={height * 0.82}
            rx={width * 0.08}
            ry={height * 0.02}
            fill={colors.snowAccent}
            opacity="0.4"
          />
        ))}

        {/* Ground layer */}
        <rect x="0" y={height * 0.85} width={width} height={height * 0.15} fill={colors.ground} />
        
        {/* Snow texture on ground */}
        {[...Array(15)].map((_, i) => (
          <ellipse
            key={`snow-${i}`}
            cx={width * (i / 14)}
            cy={height * 0.88}
            rx={width * 0.06}
            ry={height * 0.01}
            fill={colors.snowField}
            opacity="0.2"
          />
        ))}
      </g>

      {/* Frozen water if applicable */}
      {hasWater && (
        <g opacity="0.8">
          <rect x="0" y={height * 0.83} width={width} height={height * 0.17} fill={colors.water} opacity="0.3" />
          {/* Ice cracks */}
          <path
            d={`
              M 0 ${height * 0.85}
              L ${width * 0.3} ${height * 0.86}
              M ${width * 0.5} ${height * 0.84}
              L ${width * 0.8} ${height * 0.85}
              M ${width * 0.2} ${height * 0.87}
              L ${width * 0.6} ${height * 0.86}
            `}
            stroke={colors.ice}
            strokeWidth="1"
            opacity="0.5"
          />
        </g>
      )}

      {/* Weather effects overlay */}
      {weather && weather.precipitation === 'snow' && weather.intensity > 0 && (
        <g opacity={0.8 + weather.intensity * 0.2}>
          {/* Fresh snow accumulation */}
          <path
            d={`
              M 0 ${p(height * 0.80)}
              C ${p(width * 0.2)} ${p(height * (0.78 - weather.intensity * 0.03))}, 
                ${p(width * 0.4)} ${p(height * (0.81 - weather.intensity * 0.02))}, 
                ${p(width * 0.6)} ${p(height * 0.79)}
              S ${p(width * 0.85)} ${p(height * (0.78 - weather.intensity * 0.03))}, 
                ${width} ${p(height * 0.80)}
              L ${width} ${height} L 0 ${height} Z
            `}
            fill="#FFFFFF"
            opacity={0.7 + weather.intensity * 0.3}
          />
          
          {/* Extra snow on evergreens */}
          {[...Array(12)].map((_, i) => {
            const x = (i + 1) / 13;
            const treeX = p(width * x + (Math.sin(i * 13.7) * 10));
            const treeY = p(height * (0.72 + Math.sin(i * 1.7) * 0.02));
            
            return (
              <ellipse
                key={`tree-snow-${i}`}
                cx={treeX}
                cy={treeY - 15}
                rx={8 + weather.intensity * 3}
                ry={3 + weather.intensity}
                fill="#FFFFFF"
                opacity={0.8 + weather.intensity * 0.2}
              />
            );
          })}
        </g>
      )}

      {weather && weather.precipitation === 'rain' && weather.intensity > 0 && (
        <g opacity={0.3 + weather.intensity * 0.3}>
          {/* Rain melting snow - creates darker patches */}
          {[...Array(6)].map((_, i) => {
            const x = (i + 1) / 7;
            const pudX = p(width * x + Math.sin(i * 19.3) * 25);
            const pudY = p(height * (0.85 + Math.sin(i * 7.1) * 0.03));
            const pudW = p(18 + weather.intensity * 12);
            const pudH = p(4 + weather.intensity * 2);
            
            return (
              <ellipse
                key={`melt-${i}`}
                cx={pudX}
                cy={pudY}
                rx={pudW}
                ry={pudH}
                fill="#6B7280"
                opacity={0.3 + weather.intensity * 0.3}
              />
            );
          })}
          
          {/* Wet ice sheen */}
          <rect
            x="0"
            y={p(height * 0.82)}
            width={width}
            height={p(height * 0.18)}
            fill="#94A3B8"
            opacity={0.1 + weather.intensity * 0.15}
          />
        </g>
      )}

      {/* Birds in sky (arctic terns, ravens) */}
      {birds.map((bird, i) => (
        <g
          key={`bird-${i}`}
          className="bird-fly"
          style={{
            '--speed': `${bird.speed}s`,
            '--delay': `${bird.delay}s`,
            '--fly-distance': `${width + 40}px`,
          } as React.CSSProperties}
          opacity={0.5}
        >
          {bird.type === 'raven' ? (
            // Raven - larger, more angular
            <path
              d={`M ${bird.x - bird.size * 1.5} ${bird.y}
                  L ${bird.x} ${bird.y - bird.size * 1.2}
                  L ${bird.x + bird.size * 1.5} ${bird.y}
                  M ${bird.x - bird.size * 0.8} ${bird.y + 1}
                  L ${bird.x + bird.size * 0.8} ${bird.y + 1}`}
              stroke="#1F2937"
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
            />
          ) : (
            // Arctic tern - sleek V shape
            <path
              d={`M ${bird.x - bird.size} ${bird.y}
                  L ${bird.x} ${bird.y - bird.size}
                  L ${bird.x + bird.size} ${bird.y}`}
              stroke="#4B5563"
              strokeWidth="1"
              fill="none"
              strokeLinecap="round"
            />
          )}
        </g>
      ))}

      {/* Ice glints on frozen water */}
      {iceGlints.map((glint, i) => (
        <rect
          key={`glint-${i}`}
          x={glint.x}
          y={glint.y}
          width={glint.size}
          height={glint.size}
          fill={isNight ? '#A5B4FC' : '#FFFFFF'}
          className="ice-glint"
          style={{
            '--delay': `${glint.delay}s`,
            '--duration': `${glint.duration}s`,
          } as React.CSSProperties}
        />
      ))}

      {/* Settlement smoke plumes */}
      {settlementSmokes.map((smoke, i) => (
        <g key={`smoke-${i}`} opacity={0.4}>
          {/* Chimney/building hint */}
          <rect
            x={smoke.x - 3}
            y={smoke.y}
            width="6"
            height="8"
            fill={colors.ground}
            opacity="0.6"
          />
          <rect
            x={smoke.x - 1}
            y={smoke.y - 3}
            width="2"
            height="4"
            fill={colors.near}
            opacity="0.7"
          />
          {/* Smoke */}
          <g className="arctic-smoke" style={{ animationDelay: `${i * 0.8}s` }}>
            <path
              d={`M ${smoke.x} ${smoke.y - 3}
                  c 0 -3, 1 -5, 0 -8
                  c -1 -3, 1 -5, 0 -8`}
              stroke={isNight ? 'rgba(200,210,230,0.6)' : 'rgba(180,190,210,0.5)'}
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
            />
          </g>
        </g>
      ))}
    </svg>
  );
};

export default React.memo(ColdHorizon);
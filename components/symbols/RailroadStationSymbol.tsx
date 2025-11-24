/**
 * RailroadStationSymbol.tsx - Railroad station symbol with era and cultural variants
 * Enhanced with proper depth, shadows, and architectural detail like government buildings
 */
import React from 'react';
import { HistoricalEra } from '../../types/enums';

interface RailroadStationSymbolProps {
  x: number;
  y: number;
  size: number;
  era: HistoricalEra;
  culturalStyle: string;
  seed?: number;
}

const RailroadStationSymbol: React.FC<RailroadStationSymbolProps> = ({
  x,
  y,
  size,
  era,
  culturalStyle,
  seed = 0
}) => {
  const uniqueId = `station-${x}-${y}-${seed}`;

  // Color schemes based on era and culture
  const getColors = () => {
    // Era-based materials
    if (era === HistoricalEra.INDUSTRIAL_ERA) {
      return {
        building: '#6B4423', // Dark brown brick
        roof: '#8B4513', // Saddle brown
        trim: '#D2691E', // Chocolate
        platform: '#8B7D6B', // Warm gray
        accent: '#FFD700', // Gold trim
        window: '#87CEEB', // Sky blue glass
        shadow: 'rgba(60, 40, 20, 0.4)'
      };
    } else if (era === HistoricalEra.MODERN_ERA || era === HistoricalEra.FUTURE_ERA) {
      return {
        building: '#4A5568', // Modern gray
        roof: '#2D3748', // Dark gray
        trim: '#E2E8F0', // Light gray
        platform: '#CBD5E0', // Light blue-gray
        accent: '#3B82F6', // Blue accent
        window: '#60A5FA', // Modern blue glass
        shadow: 'rgba(40, 40, 50, 0.3)'
      };
    }

    // Default industrial
    return {
      building: '#8B6914', // Dark goldenrod
      roof: '#654321', // Dark brown
      trim: '#DAA520', // Goldenrod
      platform: '#A0937F', // Tan
      accent: '#CD853F', // Peru
      window: '#87CEEB',
      shadow: 'rgba(60, 40, 20, 0.4)'
    };
  };

  const colors = getColors();

  // Different architectural styles
  const getArchitecturalStyle = () => {
    // Cultural variations
    if (culturalStyle === 'east_asian' || culturalStyle === 'EAST_ASIAN') {
      return 'pagoda'; // Japanese/Chinese style stations
    } else if (culturalStyle === 'mena' || culturalStyle === 'MENA') {
      return 'islamic'; // Arabesque arches
    } else if (culturalStyle === 'south_asian' || culturalStyle === 'SOUTH_ASIAN') {
      return 'indo'; // Indo-Saracenic
    }

    return 'european'; // Western classical
  };

  const style = getArchitecturalStyle();

  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Definitions */}
      <defs>
        <linearGradient id={`buildingGrad-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={colors.building} />
          <stop offset="50%" stopColor={colors.building} stopOpacity="0.95" />
          <stop offset="100%" stopColor={colors.trim} stopOpacity="0.9" />
        </linearGradient>
        <linearGradient id={`roofGrad-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={colors.roof} stopOpacity="0.9" />
          <stop offset="100%" stopColor={colors.roof} />
        </linearGradient>
        <filter id={`shadow-${uniqueId}`}>
          <feGaussianBlur in="SourceAlpha" stdDeviation="1.5"/>
          <feOffset dx="1.5" dy="2" result="offsetblur"/>
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.4"/>
          </feComponentTransfer>
          <feMerge>
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Ground shadow */}
      <ellipse
        cx={size * 0.5}
        cy={size * 0.88}
        rx={size * 0.42}
        ry={size * 0.08}
        fill={colors.shadow}
        opacity="0.6"
      />

      {/* Platform base */}
      <rect
        x={size * 0.05}
        y={size * 0.72}
        width={size * 0.9}
        height={size * 0.12}
        fill={colors.platform}
        stroke="#333"
        strokeWidth="0.5"
        rx="1"
      />
      <rect
        x={size * 0.05}
        y={size * 0.72}
        width={size * 0.9}
        height={size * 0.02}
        fill="rgba(0,0,0,0.15)"
      />

      {/* Main building based on style */}
      {style === 'european' && (
        <>
          {/* Main hall with gradient and shadow */}
          <rect
            x={size * 0.12}
            y={size * 0.38}
            width={size * 0.76}
            height={size * 0.34}
            fill={`url(#buildingGrad-${uniqueId})`}
            stroke="#2a2a2a"
            strokeWidth="0.8"
            filter={`url(#shadow-${uniqueId})`}
            rx="1"
          />

          {/* Roof with depth */}
          <polygon
            points={`${size * 0.08},${size * 0.38} ${size * 0.5},${size * 0.18} ${size * 0.92},${size * 0.38}`}
            fill={`url(#roofGrad-${uniqueId})`}
            stroke="#2a2a2a"
            strokeWidth="0.8"
          />
          {/* Roof ridge highlight */}
          <line
            x1={size * 0.5} y1={size * 0.18}
            x2={size * 0.5} y2={size * 0.38}
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="1"
          />

          {/* Clock tower */}
          <rect
            x={size * 0.43}
            y={size * 0.08}
            width={size * 0.14}
            height={size * 0.3}
            fill={`url(#buildingGrad-${uniqueId})`}
            stroke="#2a2a2a"
            strokeWidth="0.7"
            rx="0.5"
          />

          {/* Clock face with detail */}
          <circle
            cx={size * 0.5}
            cy={size * 0.18}
            r={size * 0.055}
            fill="white"
            stroke="#2a2a2a"
            strokeWidth="0.5"
          />
          <circle
            cx={size * 0.5}
            cy={size * 0.18}
            r={size * 0.048}
            fill={colors.accent}
            stroke="#2a2a2a"
            strokeWidth="0.3"
          />
          {/* Clock hands */}
          <line
            x1={size * 0.5} y1={size * 0.18}
            x2={size * 0.5} y2={size * 0.16}
            stroke="#2a2a2a"
            strokeWidth="0.6"
            strokeLinecap="round"
          />
          <line
            x1={size * 0.5} y1={size * 0.18}
            x2={size * 0.515} y2={size * 0.19}
            stroke="#2a2a2a"
            strokeWidth="0.4"
            strokeLinecap="round"
          />

          {/* Windows with depth */}
          {[0.22, 0.36, 0.54, 0.68].map((xPos, i) => (
            <g key={`window-${i}`}>
              <rect
                x={size * xPos}
                y={size * 0.46}
                width={size * 0.08}
                height={size * 0.14}
                fill="rgba(0,0,0,0.3)"
                rx="0.5"
              />
              <rect
                x={size * xPos}
                y={size * 0.46}
                width={size * 0.08}
                height={size * 0.14}
                fill={colors.window}
                opacity="0.8"
                rx="0.5"
              />
              <line
                x1={size * (xPos + 0.04)} y1={size * 0.46}
                x2={size * (xPos + 0.04)} y2={size * 0.60}
                stroke="rgba(0,0,0,0.3)"
                strokeWidth="0.3"
              />
            </g>
          ))}

          {/* Entrance with arch */}
          <rect
            x={size * 0.40}
            y={size * 0.58}
            width={size * 0.20}
            height={size * 0.14}
            fill="rgba(0,0,0,0.5)"
            rx="1"
          />
          <path
            d={`M ${size * 0.40} ${size * 0.58} Q ${size * 0.5} ${size * 0.54} ${size * 0.60} ${size * 0.58}`}
            fill={colors.trim}
            stroke="#2a2a2a"
            strokeWidth="0.4"
          />

          {/* Decorative trim */}
          <rect
            x={size * 0.12}
            y={size * 0.38}
            width={size * 0.76}
            height={size * 0.02}
            fill={colors.accent}
            opacity="0.7"
          />
        </>
      )}

      {style === 'pagoda' && (
        <>
          {/* Main building with gradient */}
          <rect
            x={size * 0.12}
            y={size * 0.42}
            width={size * 0.76}
            height={size * 0.30}
            fill={`url(#buildingGrad-${uniqueId})`}
            stroke="#2a2a2a"
            strokeWidth="0.8"
            filter={`url(#shadow-${uniqueId})`}
          />

          {/* Pagoda-style tiered roof */}
          <path
            d={`M ${size * 0.02} ${size * 0.42} L ${size * 0.5} ${size * 0.18} L ${size * 0.98} ${size * 0.42} L ${size * 0.92} ${size * 0.37} L ${size * 0.5} ${size * 0.15} L ${size * 0.08} ${size * 0.37} Z`}
            fill="#8B0000"
            stroke="#2a2a2a"
            strokeWidth="0.7"
          />

          {/* Lower roof tier */}
          <path
            d={`M ${size * 0.08} ${size * 0.47} L ${size * 0.5} ${size * 0.28} L ${size * 0.92} ${size * 0.47} Z`}
            fill="#A52A2A"
            stroke="#2a2a2a"
            strokeWidth="0.6"
          />

          {/* Decorative finial */}
          <circle cx={size * 0.5} cy={size * 0.15} r={size * 0.03} fill={colors.accent} stroke="#2a2a2a" strokeWidth="0.4" />
          <rect x={size * 0.49} y={size * 0.10} width={size * 0.02} height={size * 0.05} fill={colors.accent} />

          {/* Sliding doors with detail */}
          <rect x={size * 0.32} y={size * 0.54} width={size * 0.14} height={size * 0.18} fill="#F5DEB3" stroke="#2a2a2a" strokeWidth="0.5" rx="0.5" />
          <rect x={size * 0.54} y={size * 0.54} width={size * 0.14} height={size * 0.18} fill="#F5DEB3" stroke="#2a2a2a" strokeWidth="0.5" rx="0.5" />
          {/* Door lattice */}
          <line x1={size * 0.32} y1={size * 0.63} x2={size * 0.46} y2={size * 0.63} stroke="#8B7355" strokeWidth="0.3" />
          <line x1={size * 0.54} y1={size * 0.63} x2={size * 0.68} y2={size * 0.63} stroke="#8B7355" strokeWidth="0.3" />
        </>
      )}

      {style === 'islamic' && (
        <>
          {/* Main hall with gradient */}
          <rect
            x={size * 0.12}
            y={size * 0.38}
            width={size * 0.76}
            height={size * 0.34}
            fill={`url(#buildingGrad-${uniqueId})`}
            stroke="#2a2a2a"
            strokeWidth="0.8"
            filter={`url(#shadow-${uniqueId})`}
            rx="1"
          />

          {/* Dome with highlight */}
          <ellipse
            cx={size * 0.5}
            cy={size * 0.26}
            rx={size * 0.26}
            ry={size * 0.2}
            fill="#4169E1"
            stroke="#2a2a2a"
            strokeWidth="0.8"
          />
          <ellipse
            cx={size * 0.48}
            cy={size * 0.24}
            rx={size * 0.12}
            ry={size * 0.10}
            fill="rgba(255,255,255,0.3)"
          />

          {/* Crescent finial */}
          <path
            d={`M ${size * 0.48} ${size * 0.08} Q ${size * 0.52} ${size * 0.05} ${size * 0.52} ${size * 0.12}`}
            fill="none"
            stroke={colors.accent}
            strokeWidth="1.8"
            strokeLinecap="round"
          />

          {/* Arched windows with detail */}
          {[0.25, 0.45, 0.65].map((xPos, i) => (
            <g key={`arch-${i}`}>
              <path
                d={`M ${size * xPos} ${size * 0.58} Q ${size * (xPos + 0.05)} ${size * 0.46} ${size * (xPos + 0.10)} ${size * 0.58}`}
                fill={colors.window}
                opacity="0.8"
                stroke="#2a2a2a"
                strokeWidth="0.4"
              />
            </g>
          ))}

          {/* Decorative geometric tiles */}
          <rect x={size * 0.16} y={size * 0.40} width={size * 0.68} height={size * 0.04} fill={colors.accent} opacity="0.8" />
          <rect x={size * 0.16} y={size * 0.66} width={size * 0.68} height={size * 0.04} fill={colors.accent} opacity="0.8" />
        </>
      )}

      {/* Railroad tracks extending from station (subtle) */}
      <g opacity="0.5">
        <line x1={size * 0.30} y1={size * 0.72} x2={size * 0.30} y2={size * 0.95} stroke="#5a5a5a" strokeWidth="1" />
        <line x1={size * 0.70} y1={size * 0.72} x2={size * 0.70} y2={size * 0.95} stroke="#5a5a5a" strokeWidth="1" />
        {/* Ties */}
        <line x1={size * 0.26} y1={size * 0.78} x2={size * 0.74} y2={size * 0.78} stroke="#3d2817" strokeWidth="0.8" />
        <line x1={size * 0.26} y1={size * 0.86} x2={size * 0.74} y2={size * 0.86} stroke="#3d2817" strokeWidth="0.8" />
      </g>

      {/* Station sign (modern era) */}
      {(era === HistoricalEra.MODERN_ERA || era === HistoricalEra.FUTURE_ERA) && (
        <g>
          <rect
            x={size * 0.30}
            y={size * 0.24}
            width={size * 0.40}
            height={size * 0.08}
            fill={colors.accent}
            rx="2"
            stroke="#2a2a2a"
            strokeWidth="0.4"
          />
          <text
            x={size * 0.5}
            y={size * 0.29}
            textAnchor="middle"
            fill="white"
            fontSize={size * 0.10}
            fontWeight="bold"
            fontFamily="sans-serif"
          >
            RAIL
          </text>
        </g>
      )}
    </g>
  );
};

export default React.memo(RailroadStationSymbol);

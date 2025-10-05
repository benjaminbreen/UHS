/**
 * RailroadStationSymbol.tsx - Railroad station symbol with era and cultural variants
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
  // Color schemes based on era and culture
  const getColors = () => {
    // Era-based materials
    if (era === HistoricalEra.INDUSTRIAL_ERA) {
      return {
        building: '#6B4423', // Dark brown brick
        roof: '#8B4513', // Saddle brown
        trim: '#D2691E', // Chocolate
        platform: '#8B7D6B', // Warm gray
        accent: '#FFD700' // Gold trim
      };
    } else if (era === HistoricalEra.MODERN_ERA || era === HistoricalEra.FUTURE_ERA) {
      return {
        building: '#4A5568', // Modern gray
        roof: '#2D3748', // Dark gray
        trim: '#E2E8F0', // Light gray
        platform: '#CBD5E0', // Light blue-gray
        accent: '#3B82F6' // Blue accent
      };
    }

    // Default industrial
    return {
      building: '#8B6914', // Dark goldenrod
      roof: '#654321', // Dark brown
      trim: '#DAA520', // Goldenrod
      platform: '#A0937F', // Tan
      accent: '#CD853F' // Peru
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
      {/* Shadow */}
      <ellipse
        cx={size / 2}
        cy={size * 0.9}
        rx={size * 0.4}
        ry={size * 0.1}
        fill="rgba(0, 0, 0, 0.3)"
      />

      {/* Platform */}
      <rect
        x={size * 0.1}
        y={size * 0.7}
        width={size * 0.8}
        height={size * 0.15}
        fill={colors.platform}
        stroke="#333"
        strokeWidth="0.5"
      />

      {/* Main building based on style */}
      {style === 'european' && (
        <>
          {/* Main hall */}
          <rect
            x={size * 0.15}
            y={size * 0.35}
            width={size * 0.7}
            height={size * 0.35}
            fill={colors.building}
            stroke="#333"
            strokeWidth="0.8"
          />

          {/* Roof */}
          <polygon
            points={`${size * 0.1},${size * 0.35} ${size * 0.5},${size * 0.15} ${size * 0.9},${size * 0.35}`}
            fill={colors.roof}
            stroke="#333"
            strokeWidth="0.8"
          />

          {/* Clock tower */}
          <rect
            x={size * 0.43}
            y={size * 0.05}
            width={size * 0.14}
            height={size * 0.3}
            fill={colors.building}
            stroke="#333"
            strokeWidth="0.6"
          />

          {/* Clock face */}
          <circle
            cx={size * 0.5}
            cy={size * 0.15}
            r={size * 0.05}
            fill={colors.accent}
            stroke="#333"
            strokeWidth="0.4"
          />

          {/* Windows */}
          <rect x={size * 0.22} y={size * 0.45} width={size * 0.08} height={size * 0.12} fill="#87CEEB" opacity="0.7" />
          <rect x={size * 0.36} y={size * 0.45} width={size * 0.08} height={size * 0.12} fill="#87CEEB" opacity="0.7" />
          <rect x={size * 0.54} y={size * 0.45} width={size * 0.08} height={size * 0.12} fill="#87CEEB" opacity="0.7" />
          <rect x={size * 0.68} y={size * 0.45} width={size * 0.08} height={size * 0.12} fill="#87CEEB" opacity="0.7" />

          {/* Entrance */}
          <rect
            x={size * 0.42}
            y={size * 0.55}
            width={size * 0.16}
            height={size * 0.15}
            fill="#4A4A4A"
          />
        </>
      )}

      {style === 'pagoda' && (
        <>
          {/* Main building */}
          <rect
            x={size * 0.15}
            y={size * 0.4}
            width={size * 0.7}
            height={size * 0.3}
            fill={colors.building}
            stroke="#333"
            strokeWidth="0.8"
          />

          {/* Pagoda-style tiered roof */}
          <path
            d={`M ${size * 0.05} ${size * 0.4} L ${size * 0.5} ${size * 0.2} L ${size * 0.95} ${size * 0.4} L ${size * 0.9} ${size * 0.35} L ${size * 0.5} ${size * 0.15} L ${size * 0.1} ${size * 0.35} Z`}
            fill="#8B0000"
            stroke="#333"
            strokeWidth="0.6"
          />

          {/* Lower roof tier */}
          <path
            d={`M ${size * 0.1} ${size * 0.45} L ${size * 0.5} ${size * 0.3} L ${size * 0.9} ${size * 0.45} Z`}
            fill="#A52A2A"
            stroke="#333"
            strokeWidth="0.5"
          />

          {/* Decorative elements */}
          <circle cx={size * 0.5} cy={size * 0.15} r={size * 0.03} fill={colors.accent} />

          {/* Sliding doors */}
          <rect x={size * 0.35} y={size * 0.52} width={size * 0.12} height={size * 0.18} fill="#F5DEB3" stroke="#333" strokeWidth="0.4" />
          <rect x={size * 0.53} y={size * 0.52} width={size * 0.12} height={size * 0.18} fill="#F5DEB3" stroke="#333" strokeWidth="0.4" />
        </>
      )}

      {style === 'islamic' && (
        <>
          {/* Main hall */}
          <rect
            x={size * 0.15}
            y={size * 0.35}
            width={size * 0.7}
            height={size * 0.35}
            fill={colors.building}
            stroke="#333"
            strokeWidth="0.8"
          />

          {/* Dome */}
          <ellipse
            cx={size * 0.5}
            cy={size * 0.25}
            rx={size * 0.25}
            ry={size * 0.2}
            fill="#4169E1"
            stroke="#333"
            strokeWidth="0.8"
          />

          {/* Crescent finial */}
          <path
            d={`M ${size * 0.48} ${size * 0.08} Q ${size * 0.52} ${size * 0.05} ${size * 0.52} ${size * 0.12}`}
            fill="none"
            stroke={colors.accent}
            strokeWidth="1.5"
          />

          {/* Arched windows */}
          <path d={`M ${size * 0.25} ${size * 0.55} Q ${size * 0.3} ${size * 0.45} ${size * 0.35} ${size * 0.55}`} fill="#87CEEB" opacity="0.7" />
          <path d={`M ${size * 0.45} ${size * 0.55} Q ${size * 0.5} ${size * 0.45} ${size * 0.55} ${size * 0.55}`} fill="#87CEEB" opacity="0.7" />
          <path d={`M ${size * 0.65} ${size * 0.55} Q ${size * 0.7} ${size * 0.45} ${size * 0.75} ${size * 0.55}`} fill="#87CEEB" opacity="0.7" />

          {/* Decorative tiles */}
          <rect x={size * 0.2} y={size * 0.38} width={size * 0.6} height={size * 0.04} fill={colors.accent} opacity="0.8" />
        </>
      )}

      {/* Railroad tracks extending from station */}
      <g opacity="0.6">
        <line x1={size * 0.3} y1={size * 0.75} x2={size * 0.3} y2={size} stroke="#5a5a5a" strokeWidth="1.2" />
        <line x1={size * 0.7} y1={size * 0.75} x2={size * 0.7} y2={size} stroke="#5a5a5a" strokeWidth="1.2" />
        {/* Ties */}
        <line x1={size * 0.25} y1={size * 0.8} x2={size * 0.75} y2={size * 0.8} stroke="#3d2817" strokeWidth="1" />
        <line x1={size * 0.25} y1={size * 0.9} x2={size * 0.75} y2={size * 0.9} stroke="#3d2817" strokeWidth="1" />
      </g>

      {/* Station sign (modern era) */}
      {(era === HistoricalEra.MODERN_ERA || era === HistoricalEra.FUTURE_ERA) && (
        <g>
          <rect
            x={size * 0.35}
            y={size * 0.25}
            width={size * 0.3}
            height={size * 0.06}
            fill="#3B82F6"
            rx="1"
          />
          <text
            x={size * 0.5}
            y={size * 0.29}
            textAnchor="middle"
            fill="white"
            fontSize={size * 0.08}
            fontWeight="bold"
          >
            🚂
          </text>
        </g>
      )}
    </g>
  );
};

export default RailroadStationSymbol;

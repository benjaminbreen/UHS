/**
 * WellSymbol - Culture and era-aware water source symbols for world map
 * Renders wells, stepwells, cisterns, fountains, and other water features
 * with appropriate cultural styling and subtle animations
 */

import React, { useMemo } from 'react';
import { ValueNoise } from '../../../utils/noise';

export type WellFeatureType =
  | 'well'              // Generic stone well with bucket
  | 'village_well'      // Simple communal well
  | 'cistern'           // Underground water storage
  | 'fountain'          // Decorative fountain
  // MENA
  | 'sabil'             // Public drinking fountain (Ottoman/Islamic)
  | 'qanat_outlet'      // Underground aqueduct access point
  // South Asian
  | 'stepwell'          // Vav/baoli - elaborate stepped wells
  | 'pushkarini'        // Temple tank
  | 'kund'              // Stepped pond
  // East Asian
  | 'dragon_well'       // Ornate well with dragon motifs
  | 'tsukubai'          // Japanese stone water basin
  // Americas
  | 'cenote'            // Natural sinkhole (Maya)
  | 'spring_house'      // Protected natural spring
  // Ancient
  | 'nymphaeum'         // Roman fountain shrine
  | 'public_fountain';  // Roman-style public water source

interface WellSymbolProps {
  x: number;
  y: number;
  size: number;
  seed: number;
  culturalZone?: string;
  era?: number;
  nightIntensity?: number;
  featureType?: WellFeatureType;
}

// Cultural material palettes
const CULTURAL_PALETTES: Record<string, {
  stone: string;
  stoneLight: string;
  stoneDark: string;
  water: string;
  waterHighlight: string;
  accent: string;
  wood: string;
  metal: string;
}> = {
  EUROPEAN: {
    stone: '#8B8878',
    stoneLight: '#A9A69B',
    stoneDark: '#5C5A50',
    water: '#4A90D9',
    waterHighlight: '#7CB3F0',
    accent: '#2D5016',
    wood: '#8B4513',
    metal: '#4A4A4A'
  },
  MENA: {
    stone: '#D4C4A8',
    stoneLight: '#E8DCC8',
    stoneDark: '#B8A888',
    water: '#3D8BC9',
    waterHighlight: '#6AB0E8',
    accent: '#1E6B8C',
    wood: '#6B4423',
    metal: '#B8860B'
  },
  SOUTH_ASIAN: {
    stone: '#C9B896',
    stoneLight: '#DDD0B8',
    stoneDark: '#A89870',
    water: '#2E8B8B',
    waterHighlight: '#5FAFAF',
    accent: '#8B0000',
    wood: '#5C3317',
    metal: '#CD853F'
  },
  EAST_ASIAN: {
    stone: '#9C9C9C',
    stoneLight: '#B8B8B8',
    stoneDark: '#707070',
    water: '#4682B4',
    waterHighlight: '#87CEEB',
    accent: '#8B0000',
    wood: '#3D2314',
    metal: '#2F4F4F'
  },
  SUB_SAHARAN_AFRICAN: {
    stone: '#CD853F',
    stoneLight: '#DEB887',
    stoneDark: '#A0522D',
    water: '#4169E1',
    waterHighlight: '#6495ED',
    accent: '#8B4513',
    wood: '#5C4033',
    metal: '#B87333'
  },
  NORTH_AMERICAN_PRE_COLUMBIAN: {
    stone: '#C4A484',
    stoneLight: '#D4B896',
    stoneDark: '#A68B6A',
    water: '#4A90D9',
    waterHighlight: '#7CB3F0',
    accent: '#CD5C5C',
    wood: '#654321',
    metal: '#B87333'
  },
  SOUTH_AMERICAN: {
    stone: '#BDB76B',
    stoneLight: '#D4D496',
    stoneDark: '#9A9A58',
    water: '#20B2AA',
    waterHighlight: '#66CDAA',
    accent: '#DAA520',
    wood: '#5C4033',
    metal: '#FFD700'
  },
  OCEANIA: {
    stone: '#A0826D',
    stoneLight: '#C4A68D',
    stoneDark: '#7A5C4A',
    water: '#00CED1',
    waterHighlight: '#40E0D0',
    accent: '#228B22',
    wood: '#4A3728',
    metal: '#B87333'
  }
};

// Determine well type based on culture and era
function getWellType(culturalZone: string, era: number, seed: number): WellFeatureType {
  const noise = new ValueNoise(seed);
  const variation = noise.noise(seed * 0.1, 0);

  // Ancient era (before 500 CE)
  if (era < 500) {
    if (culturalZone === 'EUROPEAN' || culturalZone === 'MENA') {
      return variation > 0.6 ? 'nymphaeum' : variation > 0.3 ? 'public_fountain' : 'cistern';
    }
    if (culturalZone === 'SOUTH_ASIAN') {
      return variation > 0.5 ? 'stepwell' : 'pushkarini';
    }
    if (culturalZone === 'SOUTH_AMERICAN' || culturalZone === 'NORTH_AMERICAN_PRE_COLUMBIAN') {
      return variation > 0.4 ? 'cenote' : 'spring_house';
    }
    return 'village_well';
  }

  // Medieval era (500-1500)
  if (era < 1500) {
    if (culturalZone === 'MENA') {
      return variation > 0.6 ? 'sabil' : variation > 0.3 ? 'qanat_outlet' : 'cistern';
    }
    if (culturalZone === 'SOUTH_ASIAN') {
      return variation > 0.5 ? 'stepwell' : variation > 0.2 ? 'kund' : 'pushkarini';
    }
    if (culturalZone === 'EAST_ASIAN') {
      return variation > 0.5 ? 'dragon_well' : 'well';
    }
    return variation > 0.4 ? 'village_well' : 'well';
  }

  // Early Modern (1500-1800)
  if (era < 1800) {
    if (culturalZone === 'MENA') {
      return variation > 0.5 ? 'sabil' : 'fountain';
    }
    if (culturalZone === 'SOUTH_ASIAN') {
      return variation > 0.4 ? 'stepwell' : 'well';
    }
    if (culturalZone === 'EAST_ASIAN') {
      return variation > 0.6 ? 'tsukubai' : 'dragon_well';
    }
    if (culturalZone === 'EUROPEAN') {
      return variation > 0.5 ? 'fountain' : 'well';
    }
    return 'well';
  }

  // Modern era
  return variation > 0.6 ? 'fountain' : 'well';
}

const WellSymbol: React.FC<WellSymbolProps> = ({
  x,
  y,
  size,
  seed,
  culturalZone = 'EUROPEAN',
  era = 1400,
  nightIntensity = 0,
  featureType
}) => {
  const palette = CULTURAL_PALETTES[culturalZone] || CULTURAL_PALETTES.EUROPEAN;
  const wellType = featureType || getWellType(culturalZone, era, seed);

  const noise = useMemo(() => new ValueNoise(seed), [seed]);

  // Render simple stone well with bucket
  const renderWell = () => {
    const bucketOffset = Math.sin(Date.now() * 0.001 + seed) * 1; // Gentle sway
    return (
      <g>
        {/* Well base - circular stone structure */}
        <ellipse
          cx={x + size * 0.5}
          cy={y + size * 0.65}
          rx={size * 0.35}
          ry={size * 0.15}
          fill={palette.stoneDark}
        />
        <ellipse
          cx={x + size * 0.5}
          cy={y + size * 0.55}
          rx={size * 0.35}
          ry={size * 0.15}
          fill={palette.stone}
        />
        {/* Stone texture */}
        {[...Array(6)].map((_, i) => (
          <ellipse
            key={i}
            cx={x + size * (0.25 + (i % 3) * 0.25)}
            cy={y + size * (0.52 + Math.floor(i / 3) * 0.08)}
            rx={size * 0.08}
            ry={size * 0.03}
            fill={palette.stoneDark}
            opacity={0.3}
          />
        ))}
        {/* Water inside */}
        <ellipse
          cx={x + size * 0.5}
          cy={y + size * 0.55}
          rx={size * 0.25}
          ry={size * 0.1}
          fill={palette.water}
          opacity={0.8}
        >
          <animate
            attributeName="opacity"
            values="0.7;0.9;0.7"
            dur="3s"
            repeatCount="indefinite"
          />
        </ellipse>
        {/* Roof structure */}
        <rect
          x={x + size * 0.2}
          y={y + size * 0.2}
          width={size * 0.05}
          height={size * 0.35}
          fill={palette.wood}
        />
        <rect
          x={x + size * 0.75}
          y={y + size * 0.2}
          width={size * 0.05}
          height={size * 0.35}
          fill={palette.wood}
        />
        {/* Crossbeam */}
        <rect
          x={x + size * 0.18}
          y={y + size * 0.18}
          width={size * 0.64}
          height={size * 0.06}
          fill={palette.wood}
        />
        {/* Bucket */}
        <g transform={`translate(${bucketOffset}, 0)`}>
          <line
            x1={x + size * 0.5}
            y1={y + size * 0.21}
            x2={x + size * 0.5}
            y2={y + size * 0.38}
            stroke={palette.metal}
            strokeWidth={size * 0.02}
          />
          <rect
            x={x + size * 0.42}
            y={y + size * 0.36}
            width={size * 0.16}
            height={size * 0.12}
            fill={palette.wood}
            rx={size * 0.02}
          />
        </g>
      </g>
    );
  };

  // Render stepwell (South Asian vav/baoli)
  const renderStepwell = () => {
    return (
      <g>
        {/* Stepped structure descending */}
        {[...Array(4)].map((_, i) => (
          <g key={i}>
            <rect
              x={x + size * (0.15 + i * 0.08)}
              y={y + size * (0.3 + i * 0.12)}
              width={size * (0.7 - i * 0.16)}
              height={size * 0.15}
              fill={palette.stone}
              stroke={palette.stoneDark}
              strokeWidth={size * 0.01}
            />
          </g>
        ))}
        {/* Water pool at bottom */}
        <rect
          x={x + size * 0.35}
          y={y + size * 0.7}
          width={size * 0.3}
          height={size * 0.15}
          fill={palette.water}
          rx={size * 0.02}
        >
          <animate
            attributeName="opacity"
            values="0.8;1;0.8"
            dur="2s"
            repeatCount="indefinite"
          />
        </rect>
        {/* Decorative pillars */}
        <rect
          x={x + size * 0.15}
          y={y + size * 0.15}
          width={size * 0.06}
          height={size * 0.5}
          fill={palette.stoneLight}
        />
        <rect
          x={x + size * 0.79}
          y={y + size * 0.15}
          width={size * 0.06}
          height={size * 0.5}
          fill={palette.stoneLight}
        />
        {/* Arched canopy hint */}
        <path
          d={`M${x + size * 0.15} ${y + size * 0.15}
              Q${x + size * 0.5} ${y + size * 0.05}
              ${x + size * 0.85} ${y + size * 0.15}`}
          fill="none"
          stroke={palette.accent}
          strokeWidth={size * 0.03}
        />
      </g>
    );
  };

  // Render sabil (Ottoman public fountain)
  const renderSabil = () => {
    return (
      <g>
        {/* Main structure - ornate facade */}
        <rect
          x={x + size * 0.2}
          y={y + size * 0.25}
          width={size * 0.6}
          height={size * 0.55}
          fill={palette.stone}
          rx={size * 0.03}
        />
        {/* Decorative arch */}
        <path
          d={`M${x + size * 0.25} ${y + size * 0.65}
              Q${x + size * 0.5} ${y + size * 0.35}
              ${x + size * 0.75} ${y + size * 0.65}`}
          fill={palette.stoneDark}
        />
        {/* Water spout niche */}
        <ellipse
          cx={x + size * 0.5}
          cy={y + size * 0.55}
          rx={size * 0.12}
          ry={size * 0.08}
          fill={palette.accent}
        />
        {/* Water stream */}
        <path
          d={`M${x + size * 0.5} ${y + size * 0.6}
              Q${x + size * 0.52} ${y + size * 0.7}
              ${x + size * 0.5} ${y + size * 0.75}`}
          fill="none"
          stroke={palette.water}
          strokeWidth={size * 0.03}
          opacity={0.8}
        >
          <animate
            attributeName="stroke-width"
            values={`${size * 0.03};${size * 0.04};${size * 0.03}`}
            dur="1s"
            repeatCount="indefinite"
          />
        </path>
        {/* Collecting basin */}
        <ellipse
          cx={x + size * 0.5}
          cy={y + size * 0.8}
          rx={size * 0.25}
          ry={size * 0.08}
          fill={palette.water}
          opacity={0.7}
        />
        {/* Dome top */}
        <ellipse
          cx={x + size * 0.5}
          cy={y + size * 0.25}
          rx={size * 0.2}
          ry={size * 0.1}
          fill={palette.accent}
        />
      </g>
    );
  };

  // Render dragon well (East Asian)
  const renderDragonWell = () => {
    return (
      <g>
        {/* Octagonal well rim */}
        <polygon
          points={`
            ${x + size * 0.5},${y + size * 0.35}
            ${x + size * 0.7},${y + size * 0.42}
            ${x + size * 0.75},${y + size * 0.58}
            ${x + size * 0.7},${y + size * 0.72}
            ${x + size * 0.5},${y + size * 0.78}
            ${x + size * 0.3},${y + size * 0.72}
            ${x + size * 0.25},${y + size * 0.58}
            ${x + size * 0.3},${y + size * 0.42}
          `}
          fill={palette.stone}
          stroke={palette.stoneDark}
          strokeWidth={size * 0.02}
        />
        {/* Water surface */}
        <ellipse
          cx={x + size * 0.5}
          cy={y + size * 0.58}
          rx={size * 0.2}
          ry={size * 0.12}
          fill={palette.water}
        >
          <animate
            attributeName="opacity"
            values="0.7;0.9;0.7"
            dur="2.5s"
            repeatCount="indefinite"
          />
        </ellipse>
        {/* Dragon motif on edge */}
        <path
          d={`M${x + size * 0.3} ${y + size * 0.35}
              C${x + size * 0.35} ${y + size * 0.25}
              ${x + size * 0.45} ${y + size * 0.2}
              ${x + size * 0.5} ${y + size * 0.22}
              C${x + size * 0.55} ${y + size * 0.2}
              ${x + size * 0.65} ${y + size * 0.25}
              ${x + size * 0.7} ${y + size * 0.35}`}
          fill="none"
          stroke={palette.accent}
          strokeWidth={size * 0.03}
        />
        {/* Dragon head hint */}
        <circle
          cx={x + size * 0.5}
          cy={y + size * 0.2}
          r={size * 0.05}
          fill={palette.accent}
        />
      </g>
    );
  };

  // Render tsukubai (Japanese stone basin)
  const renderTsukubai = () => {
    return (
      <g>
        {/* Stone basin - rough natural shape */}
        <ellipse
          cx={x + size * 0.5}
          cy={y + size * 0.6}
          rx={size * 0.28}
          ry={size * 0.18}
          fill={palette.stoneDark}
        />
        <ellipse
          cx={x + size * 0.5}
          cy={y + size * 0.55}
          rx={size * 0.25}
          ry={size * 0.15}
          fill={palette.stone}
        />
        {/* Water in basin */}
        <ellipse
          cx={x + size * 0.5}
          cy={y + size * 0.55}
          rx={size * 0.18}
          ry={size * 0.1}
          fill={palette.water}
          opacity={0.8}
        >
          <animate
            attributeName="opacity"
            values="0.7;0.9;0.7"
            dur="4s"
            repeatCount="indefinite"
          />
        </ellipse>
        {/* Bamboo water pipe (kakei) */}
        <rect
          x={x + size * 0.65}
          y={y + size * 0.3}
          width={size * 0.08}
          height={size * 0.25}
          fill="#5C4033"
          transform={`rotate(-20 ${x + size * 0.69} ${y + size * 0.3})`}
        />
        {/* Water drip */}
        <circle
          cx={x + size * 0.6}
          cy={y + size * 0.5}
          r={size * 0.02}
          fill={palette.waterHighlight}
        >
          <animate
            attributeName="cy"
            values={`${y + size * 0.45};${y + size * 0.55};${y + size * 0.45}`}
            dur="1.5s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="1;0.5;1"
            dur="1.5s"
            repeatCount="indefinite"
          />
        </circle>
        {/* Surrounding stones */}
        {[0, 1, 2].map(i => (
          <circle
            key={i}
            cx={x + size * (0.25 + i * 0.25)}
            cy={y + size * 0.75}
            r={size * (0.05 + noise.noise(i, seed) * 0.02)}
            fill={palette.stoneDark}
          />
        ))}
      </g>
    );
  };

  // Render cenote (Maya sacred sinkhole)
  const renderCenote = () => {
    return (
      <g>
        {/* Rocky rim */}
        <ellipse
          cx={x + size * 0.5}
          cy={y + size * 0.5}
          rx={size * 0.4}
          ry={size * 0.3}
          fill={palette.stoneDark}
        />
        {/* Inner dark opening */}
        <ellipse
          cx={x + size * 0.5}
          cy={y + size * 0.5}
          rx={size * 0.32}
          ry={size * 0.22}
          fill="#1a2f1a"
        />
        {/* Deep water */}
        <ellipse
          cx={x + size * 0.5}
          cy={y + size * 0.52}
          rx={size * 0.28}
          ry={size * 0.18}
          fill={palette.water}
          opacity={0.9}
        >
          <animate
            attributeName="opacity"
            values="0.8;0.95;0.8"
            dur="3s"
            repeatCount="indefinite"
          />
        </ellipse>
        {/* Vegetation around edge */}
        {[...Array(5)].map((_, i) => (
          <path
            key={i}
            d={`M${x + size * (0.2 + i * 0.15)} ${y + size * 0.35}
                Q${x + size * (0.22 + i * 0.15)} ${y + size * 0.25}
                ${x + size * (0.25 + i * 0.15)} ${y + size * 0.28}`}
            fill="none"
            stroke="#228B22"
            strokeWidth={size * 0.02}
          />
        ))}
      </g>
    );
  };

  // Render nymphaeum (Roman fountain shrine)
  const renderNymphaeum = () => {
    return (
      <g>
        {/* Semicircular backdrop */}
        <path
          d={`M${x + size * 0.15} ${y + size * 0.7}
              L${x + size * 0.15} ${y + size * 0.3}
              Q${x + size * 0.5} ${y + size * 0.1}
              ${x + size * 0.85} ${y + size * 0.3}
              L${x + size * 0.85} ${y + size * 0.7}
              Z`}
          fill={palette.stone}
          stroke={palette.stoneDark}
          strokeWidth={size * 0.02}
        />
        {/* Niches */}
        {[0, 1, 2].map(i => (
          <ellipse
            key={i}
            cx={x + size * (0.3 + i * 0.2)}
            cy={y + size * 0.4}
            rx={size * 0.06}
            ry={size * 0.1}
            fill={palette.stoneDark}
          />
        ))}
        {/* Central water feature */}
        <rect
          x={x + size * 0.35}
          y={y + size * 0.55}
          width={size * 0.3}
          height={size * 0.2}
          fill={palette.water}
          rx={size * 0.02}
        >
          <animate
            attributeName="opacity"
            values="0.7;0.9;0.7"
            dur="2s"
            repeatCount="indefinite"
          />
        </rect>
        {/* Column hints */}
        <rect x={x + size * 0.18} y={y + size * 0.3} width={size * 0.04} height={size * 0.4} fill={palette.stoneLight} />
        <rect x={x + size * 0.78} y={y + size * 0.3} width={size * 0.04} height={size * 0.4} fill={palette.stoneLight} />
      </g>
    );
  };

  // Render decorative fountain
  const renderFountain = () => {
    return (
      <g>
        {/* Base pool */}
        <ellipse
          cx={x + size * 0.5}
          cy={y + size * 0.7}
          rx={size * 0.38}
          ry={size * 0.15}
          fill={palette.stoneDark}
        />
        <ellipse
          cx={x + size * 0.5}
          cy={y + size * 0.65}
          rx={size * 0.35}
          ry={size * 0.13}
          fill={palette.water}
          opacity={0.8}
        >
          <animate
            attributeName="opacity"
            values="0.7;0.9;0.7"
            dur="2s"
            repeatCount="indefinite"
          />
        </ellipse>
        {/* Central pedestal */}
        <rect
          x={x + size * 0.42}
          y={y + size * 0.35}
          width={size * 0.16}
          height={size * 0.3}
          fill={palette.stone}
        />
        {/* Upper basin */}
        <ellipse
          cx={x + size * 0.5}
          cy={y + size * 0.35}
          rx={size * 0.18}
          ry={size * 0.06}
          fill={palette.stoneLight}
        />
        {/* Water jet */}
        <line
          x1={x + size * 0.5}
          y1={y + size * 0.35}
          x2={x + size * 0.5}
          y2={y + size * 0.15}
          stroke={palette.waterHighlight}
          strokeWidth={size * 0.03}
          opacity={0.7}
        >
          <animate
            attributeName="y2"
            values={`${y + size * 0.15};${y + size * 0.12};${y + size * 0.15}`}
            dur="1s"
            repeatCount="indefinite"
          />
        </line>
        {/* Water droplets */}
        {[0, 1, 2].map(i => (
          <circle
            key={i}
            cx={x + size * (0.4 + i * 0.1)}
            cy={y + size * 0.25}
            r={size * 0.015}
            fill={palette.waterHighlight}
            opacity={0.6}
          >
            <animate
              attributeName="cy"
              values={`${y + size * 0.2};${y + size * 0.45};${y + size * 0.2}`}
              dur={`${1.2 + i * 0.3}s`}
              repeatCount="indefinite"
            />
          </circle>
        ))}
      </g>
    );
  };

  // Render village well (simple)
  const renderVillageWell = () => {
    return (
      <g>
        {/* Simple stone rim */}
        <ellipse
          cx={x + size * 0.5}
          cy={y + size * 0.6}
          rx={size * 0.3}
          ry={size * 0.12}
          fill={palette.stoneDark}
        />
        <ellipse
          cx={x + size * 0.5}
          cy={y + size * 0.55}
          rx={size * 0.28}
          ry={size * 0.1}
          fill={palette.stone}
        />
        {/* Dark water inside */}
        <ellipse
          cx={x + size * 0.5}
          cy={y + size * 0.55}
          rx={size * 0.2}
          ry={size * 0.07}
          fill={palette.water}
          opacity={0.6}
        >
          <animate
            attributeName="opacity"
            values="0.5;0.7;0.5"
            dur="3s"
            repeatCount="indefinite"
          />
        </ellipse>
        {/* Simple wooden winch post */}
        <rect
          x={x + size * 0.45}
          y={y + size * 0.25}
          width={size * 0.04}
          height={size * 0.3}
          fill={palette.wood}
        />
        <rect
          x={x + size * 0.38}
          y={y + size * 0.23}
          width={size * 0.18}
          height={size * 0.05}
          fill={palette.wood}
        />
      </g>
    );
  };

  // Apply night mode darkening
  const nightFilter = nightIntensity > 0.3 ? (
    <filter id={`well-night-${seed}`}>
      <feColorMatrix
        type="matrix"
        values={`
          ${1 - nightIntensity * 0.3} 0 0 0 0
          0 ${1 - nightIntensity * 0.3} 0 0 0
          0 0 ${1 - nightIntensity * 0.2} 0 ${nightIntensity * 0.1}
          0 0 0 1 0
        `}
      />
    </filter>
  ) : null;

  // Select renderer based on well type
  const renderContent = () => {
    switch (wellType) {
      case 'stepwell':
      case 'kund':
      case 'pushkarini':
        return renderStepwell();
      case 'sabil':
      case 'qanat_outlet':
        return renderSabil();
      case 'dragon_well':
        return renderDragonWell();
      case 'tsukubai':
        return renderTsukubai();
      case 'cenote':
      case 'spring_house':
        return renderCenote();
      case 'nymphaeum':
      case 'public_fountain':
        return renderNymphaeum();
      case 'fountain':
        return renderFountain();
      case 'village_well':
        return renderVillageWell();
      case 'cistern':
      case 'well':
      default:
        return renderWell();
    }
  };

  return (
    <g filter={nightFilter ? `url(#well-night-${seed})` : undefined}>
      {nightFilter && <defs>{nightFilter}</defs>}
      {renderContent()}
    </g>
  );
};

export default WellSymbol;

/**
 * FountainSymbol.tsx - Culture and era-specific water features
 * Includes: fountains, stepwells, nymphaea, sabils, tsukubai, cenotes, and more
 * Beautiful renderings optimized for map-scale visibility
 */
import React, { useMemo } from 'react';
import { ValueNoise } from '../../../../utils/noise';

// Water feature types keyed to cultural names
export type WaterFeatureType =
  // European
  | 'fountain' | 'nymphaeum' | 'well' | 'grotto'
  // Islamic/MENA
  | 'sabil' | 'ablution_fountain' | 'qanat' | 'hawd'
  // South Asian
  | 'stepwell' | 'baoli' | 'vav' | 'kund' | 'pushkarini'
  // East Asian
  | 'tsukubai' | 'dragon_fountain' | 'lotus_pool'
  // African
  | 'community_well' | 'sacred_spring'
  // Americas
  | 'cenote' | 'ritual_pool' | 'spring_house'
  // Oceania
  | 'natural_pool';

interface FountainSymbolProps {
  x: number;
  y: number;
  size: number;
  culturalZone?: string;
  era?: number;
  featureType?: WaterFeatureType;
  facing?: 'north' | 'south' | 'east' | 'west';
  opacity?: number;
  seed?: number;
  nightIntensity?: number;
}

// Cultural material palettes
const CULTURAL_MATERIALS: Record<string, {
  stone: string;
  stoneLight: string;
  stoneDark: string;
  water: string;
  waterLight: string;
  waterDark: string;
  accent: string;
  tile?: string;
  metal?: string;
}> = {
  EUROPEAN: {
    stone: '#8B8680', stoneLight: '#A8A098', stoneDark: '#6B6660',
    water: '#4682B4', waterLight: '#6898C8', waterDark: '#3672A4',
    accent: '#DAA520', metal: '#C0C0C0'
  },
  MENA: {
    stone: '#E8DCC6', stoneLight: '#F0E8D8', stoneDark: '#D0C4A8',
    water: '#4A9ECA', waterLight: '#6AB8E8', waterDark: '#3A8EBA',
    accent: '#1E90AA', tile: '#0088A8'
  },
  SOUTH_ASIAN: {
    stone: '#C4956A', stoneLight: '#D4A57A', stoneDark: '#A47550',
    water: '#5AA8D0', waterLight: '#7AC8F0', waterDark: '#4A98C0',
    accent: '#FF6B35', tile: '#CD853F'
  },
  EAST_ASIAN: {
    stone: '#5A5A5A', stoneLight: '#7A7A7A', stoneDark: '#3A3A3A',
    water: '#4A90C8', waterLight: '#6AA8D8', waterDark: '#3A80B8',
    accent: '#8B0000', metal: '#8B7355'
  },
  SUB_SAHARAN_AFRICAN: {
    stone: '#8B6F47', stoneLight: '#9B7F57', stoneDark: '#6B4F27',
    water: '#4A85B8', waterLight: '#6AA5D8', waterDark: '#3A75A8',
    accent: '#D4AF37', tile: '#A0522D'
  },
  SOUTH_AMERICAN: {
    stone: '#8B7D6B', stoneLight: '#9B8D7B', stoneDark: '#6B5D4B',
    water: '#4A8AC0', waterLight: '#6AAAE0', waterDark: '#3A7AB0',
    accent: '#00CD66', metal: '#FFD700'
  },
  NORTH_AMERICAN_PRE_COLUMBIAN: {
    stone: '#A08070', stoneLight: '#B09080', stoneDark: '#806050',
    water: '#4090B0', waterLight: '#60B0D0', waterDark: '#3080A0',
    accent: '#00CED1', tile: '#8B4513'
  },
  OCEANIA: {
    stone: '#696969', stoneLight: '#898989', stoneDark: '#494949',
    water: '#4095D0', waterLight: '#60B5F0', waterDark: '#3085C0',
    accent: '#FF8C00', tile: '#2F4F4F'
  }
};

// Determine default water feature type based on culture and era
const getDefaultFeatureType = (zone: string, era: number): WaterFeatureType => {
  const eraNum = era || 1500;

  switch (zone) {
    case 'MENA':
    case 'NORTH_AFRICAN':
      if (eraNum < 600) return 'qanat';
      return Math.random() > 0.5 ? 'sabil' : 'ablution_fountain';

    case 'SOUTH_ASIAN':
      return Math.random() > 0.3 ? 'stepwell' : 'pushkarini';

    case 'EAST_ASIAN':
      return Math.random() > 0.5 ? 'tsukubai' : 'dragon_fountain';

    case 'SUB_SAHARAN_AFRICAN':
      return Math.random() > 0.5 ? 'community_well' : 'sacred_spring';

    case 'SOUTH_AMERICAN':
    case 'NORTH_AMERICAN_PRE_COLUMBIAN':
      return Math.random() > 0.5 ? 'cenote' : 'ritual_pool';

    case 'OCEANIA':
      return 'natural_pool';

    default: // EUROPEAN
      if (eraNum < 200) return 'nymphaeum';
      if (eraNum < 1400) return 'well';
      return 'fountain';
  }
};

const FountainSymbol: React.FC<FountainSymbolProps> = ({
  x, y, size,
  culturalZone = 'EUROPEAN',
  era = 1500,
  featureType,
  facing = 'south',
  opacity = 1.0,
  seed = 12345,
  nightIntensity = 0
}) => {
  const zone = culturalZone?.toUpperCase() || 'EUROPEAN';
  const materials = CULTURAL_MATERIALS[zone] || CULTURAL_MATERIALS.EUROPEAN;

  // Stable random
  const rand = useMemo(() => {
    const noise = new ValueNoise(seed);
    let calls = 0;
    return () => {
      calls++;
      return new ValueNoise(seed + calls * 17).random();
    };
  }, [seed]);

  // Determine feature type
  const type = featureType || getDefaultFeatureType(zone, era);

  // Night color adjustment
  const nightAdjust = (color: string, factor: number = 0.4) => {
    if (nightIntensity <= 0) return color;
    // Simple darkening - in production would use proper color manipulation
    return color;
  };

  const cx = size / 2;
  const cy = size * 0.55;
  const gradientId = `fountain-grad-${seed}`;
  const waterId = `water-${seed}`;

  // Render water with animated ripples
  const renderWater = (rx: number, ry: number, waterCx: number = cx, waterCy: number = cy) => (
    <g>
      <ellipse cx={waterCx} cy={waterCy} rx={rx} ry={ry}
               fill={materials.water} opacity={0.9} />
      <ellipse cx={waterCx} cy={waterCy} rx={rx * 0.85} ry={ry * 0.85}
               fill={materials.waterLight} opacity={0.5} />
      {/* Animated ripple */}
      <ellipse cx={waterCx} cy={waterCy} rx={rx * 0.3} ry={ry * 0.3}
               fill="none" stroke={materials.waterLight} strokeWidth={0.5} opacity={0.4}>
        <animate attributeName="rx" from={rx * 0.3} to={rx * 0.9} dur="2.5s" repeatCount="indefinite" />
        <animate attributeName="ry" from={ry * 0.3} to={ry * 0.9} dur="2.5s" repeatCount="indefinite" />
        <animate attributeName="opacity" from="0.5" to="0" dur="2.5s" repeatCount="indefinite" />
      </ellipse>
    </g>
  );

  // ===== EUROPEAN FOUNTAIN =====
  const renderClassicFountain = () => (
    <g>
      {/* Shadow */}
      <ellipse cx={cx} cy={size * 0.85} rx={size * 0.4} ry={size * 0.12} fill="rgba(0,0,0,0.2)" />

      {/* Outer basin */}
      <ellipse cx={cx} cy={cy + size * 0.2} rx={size * 0.42} ry={size * 0.18}
               fill={materials.stoneDark} stroke={materials.stone} strokeWidth={1.5} />
      <ellipse cx={cx} cy={cy + size * 0.18} rx={size * 0.38} ry={size * 0.16}
               fill={materials.stone} />
      {renderWater(size * 0.34, size * 0.14, cx, cy + size * 0.18)}

      {/* Central pedestal */}
      <rect x={cx - size * 0.06} y={cy - size * 0.02} width={size * 0.12} height={size * 0.2}
            fill={`url(#${gradientId})`} stroke={materials.stoneDark} strokeWidth={0.5} />

      {/* Upper basin */}
      <ellipse cx={cx} cy={cy - size * 0.02} rx={size * 0.2} ry={size * 0.08}
               fill={materials.stone} stroke={materials.stoneLight} strokeWidth={0.8} />
      {renderWater(size * 0.16, size * 0.06, cx, cy - size * 0.04)}

      {/* Finial */}
      <ellipse cx={cx} cy={cy - size * 0.2} rx={size * 0.04} ry={size * 0.06}
               fill={materials.stoneLight} stroke={materials.stone} strokeWidth={0.5} />

      {/* Water jet */}
      <line x1={cx} y1={cy - size * 0.2} x2={cx} y2={cy - size * 0.32}
            stroke={materials.waterLight} strokeWidth={1.5} opacity={0.7}>
        <animate attributeName="y2" values={`${cy - size * 0.28};${cy - size * 0.35};${cy - size * 0.28}`} dur="1s" repeatCount="indefinite" />
      </line>

      {/* Falling droplets */}
      {[0, 0.25, 0.5, 0.75].map((delay, i) => (
        <circle key={i} cx={cx + (i - 1.5) * size * 0.04} cy={cy - size * 0.3} r={size * 0.012}
                fill={materials.waterLight} opacity={0.6}>
          <animate attributeName="cy" from={cy - size * 0.32} to={cy - size * 0.04} dur="0.8s" begin={`${delay}s`} repeatCount="indefinite" />
          <animate attributeName="cx" from={cx + (i - 1.5) * size * 0.02} to={cx + (i - 1.5) * size * 0.1} dur="0.8s" begin={`${delay}s`} repeatCount="indefinite" />
          <animate attributeName="opacity" from="0.7" to="0" dur="0.8s" begin={`${delay}s`} repeatCount="indefinite" />
        </circle>
      ))}
    </g>
  );

  // ===== ROMAN NYMPHAEUM =====
  const renderNymphaeum = () => (
    <g>
      <ellipse cx={cx} cy={size * 0.88} rx={size * 0.45} ry={size * 0.1} fill="rgba(0,0,0,0.2)" />

      {/* Semi-circular apse */}
      <path d={`M ${cx - size * 0.4} ${cy + size * 0.25}
                A ${size * 0.4} ${size * 0.35} 0 0 1 ${cx + size * 0.4} ${cy + size * 0.25}
                L ${cx + size * 0.4} ${cy + size * 0.3}
                L ${cx - size * 0.4} ${cy + size * 0.3} Z`}
            fill={materials.stone} stroke={materials.stoneDark} strokeWidth={1} />

      {/* Niches with statues */}
      {[-0.22, 0, 0.22].map((offset, i) => (
        <g key={i}>
          <ellipse cx={cx + size * offset} cy={cy + size * 0.08} rx={size * 0.08} ry={size * 0.15}
                   fill={materials.stoneDark} opacity={0.6} />
          <ellipse cx={cx + size * offset} cy={cy + size * 0.12} rx={size * 0.04} ry={size * 0.08}
                   fill={materials.stoneLight} opacity={0.8} />
        </g>
      ))}

      {/* Basin */}
      <ellipse cx={cx} cy={cy + size * 0.28} rx={size * 0.35} ry={size * 0.12}
               fill={materials.stoneDark} stroke={materials.stone} strokeWidth={1.5} />
      {renderWater(size * 0.3, size * 0.1, cx, cy + size * 0.26)}

      {/* Columns */}
      {[-0.35, 0.35].map((offset, i) => (
        <rect key={i} x={cx + size * offset - size * 0.03} y={cy - size * 0.15}
              width={size * 0.06} height={size * 0.4}
              fill={`url(#${gradientId})`} stroke={materials.stoneDark} strokeWidth={0.5} />
      ))}

      {/* Pediment */}
      <polygon points={`${cx - size * 0.42},${cy - size * 0.15} ${cx},${cy - size * 0.32} ${cx + size * 0.42},${cy - size * 0.15}`}
               fill={materials.stone} stroke={materials.stoneDark} strokeWidth={1} />
    </g>
  );

  // ===== ISLAMIC SABIL (PUBLIC FOUNTAIN) =====
  const renderSabil = () => (
    <g>
      <ellipse cx={cx} cy={size * 0.88} rx={size * 0.4} ry={size * 0.1} fill="rgba(0,0,0,0.2)" />

      {/* Arched facade */}
      <rect x={cx - size * 0.35} y={cy - size * 0.1} width={size * 0.7} height={size * 0.4}
            fill={materials.stone} stroke={materials.stoneDark} strokeWidth={1} />

      {/* Pointed arch opening */}
      <path d={`M ${cx - size * 0.2} ${cy + size * 0.3}
                L ${cx - size * 0.2} ${cy + size * 0.05}
                Q ${cx - size * 0.2} ${cy - size * 0.08} ${cx} ${cy - size * 0.15}
                Q ${cx + size * 0.2} ${cy - size * 0.08} ${cx + size * 0.2} ${cy + size * 0.05}
                L ${cx + size * 0.2} ${cy + size * 0.3} Z`}
            fill={materials.stoneDark} opacity={0.7} />

      {/* Geometric tile pattern */}
      <rect x={cx - size * 0.15} y={cy + size * 0.1} width={size * 0.3} height={size * 0.15}
            fill={materials.tile || materials.accent} opacity={0.6} />
      <line x1={cx - size * 0.15} y1={cy + size * 0.175} x2={cx + size * 0.15} y2={cy + size * 0.175}
            stroke={materials.stoneLight} strokeWidth={0.5} />
      <line x1={cx} y1={cy + size * 0.1} x2={cx} y2={cy + size * 0.25}
            stroke={materials.stoneLight} strokeWidth={0.5} />

      {/* Basin/trough */}
      <rect x={cx - size * 0.25} y={cy + size * 0.28} width={size * 0.5} height={size * 0.08}
            fill={materials.stoneDark} stroke={materials.stone} strokeWidth={0.8} />
      {renderWater(size * 0.22, size * 0.03, cx, cy + size * 0.31)}

      {/* Dome top */}
      <ellipse cx={cx} cy={cy - size * 0.1} rx={size * 0.2} ry={size * 0.08}
               fill={materials.stoneLight} stroke={materials.stone} strokeWidth={0.8} />
      <circle cx={cx} cy={cy - size * 0.18} r={size * 0.025}
              fill={materials.accent} />

      {/* Water spout */}
      <circle cx={cx} cy={cy + size * 0.15} r={size * 0.03}
              fill={materials.metal || materials.accent} stroke={materials.stoneDark} strokeWidth={0.5} />
      <line x1={cx} y1={cy + size * 0.18} x2={cx} y2={cy + size * 0.28}
            stroke={materials.waterLight} strokeWidth={1} opacity={0.7}>
        <animate attributeName="opacity" values="0.8;0.4;0.8" dur="1.5s" repeatCount="indefinite" />
      </line>
    </g>
  );

  // ===== SOUTH ASIAN STEPWELL (BAOLI/VAV) =====
  const renderStepwell = () => {
    const steps = 5;
    return (
      <g>
        <ellipse cx={cx} cy={size * 0.9} rx={size * 0.45} ry={size * 0.08} fill="rgba(0,0,0,0.25)" />

        {/* Descending steps - creates 3D depth effect */}
        {Array.from({ length: steps }).map((_, i) => {
          const stepWidth = size * (0.8 - i * 0.1);
          const stepY = cy - size * 0.15 + i * size * 0.12;
          const stepDepth = size * 0.08;
          return (
            <g key={i}>
              {/* Step top surface */}
              <rect x={cx - stepWidth / 2} y={stepY} width={stepWidth} height={stepDepth}
                    fill={i % 2 === 0 ? materials.stone : materials.stoneLight}
                    stroke={materials.stoneDark} strokeWidth={0.5} />
              {/* Step front face (3D effect) */}
              <rect x={cx - stepWidth / 2} y={stepY + stepDepth - 1} width={stepWidth} height={size * 0.03}
                    fill={materials.stoneDark} opacity={0.6} />
            </g>
          );
        })}

        {/* Water at bottom */}
        <rect x={cx - size * 0.15} y={cy + size * 0.32} width={size * 0.3} height={size * 0.1}
              fill={materials.water} opacity={0.9} />
        <rect x={cx - size * 0.12} y={cy + size * 0.34} width={size * 0.24} height={size * 0.06}
              fill={materials.waterLight} opacity={0.5} />

        {/* Pavilion/chattri on one side */}
        <rect x={cx + size * 0.2} y={cy - size * 0.25} width={size * 0.12} height={size * 0.35}
              fill={`url(#${gradientId})`} stroke={materials.stoneDark} strokeWidth={0.5} />
        {/* Dome top */}
        <ellipse cx={cx + size * 0.26} cy={cy - size * 0.25} rx={size * 0.08} ry={size * 0.05}
                 fill={materials.stoneLight} stroke={materials.stone} strokeWidth={0.5} />
        <circle cx={cx + size * 0.26} cy={cy - size * 0.3} r={size * 0.015}
                fill={materials.accent} />

        {/* Decorative arches */}
        {[-0.15, 0.15].map((offset, i) => (
          <path key={i} d={`M ${cx + size * offset - size * 0.04} ${cy - size * 0.1}
                           Q ${cx + size * offset} ${cy - size * 0.18} ${cx + size * offset + size * 0.04} ${cy - size * 0.1}`}
                fill="none" stroke={materials.accent} strokeWidth={0.8} opacity={0.7} />
        ))}
      </g>
    );
  };

  // ===== JAPANESE TSUKUBAI (STONE BASIN) =====
  const renderTsukubai = () => (
    <g>
      <ellipse cx={cx} cy={size * 0.85} rx={size * 0.35} ry={size * 0.1} fill="rgba(0,0,0,0.15)" />

      {/* Gravel/sand base */}
      <ellipse cx={cx} cy={cy + size * 0.2} rx={size * 0.4} ry={size * 0.15}
               fill="#A09080" opacity={0.4} />

      {/* Stone basin (chozubachi) */}
      <ellipse cx={cx} cy={cy + size * 0.05} rx={size * 0.22} ry={size * 0.12}
               fill={materials.stoneDark} stroke={materials.stone} strokeWidth={1.5} />
      <ellipse cx={cx} cy={cy + size * 0.03} rx={size * 0.18} ry={size * 0.1}
               fill={materials.stone} />
      {renderWater(size * 0.15, size * 0.08, cx, cy + size * 0.02)}

      {/* Bamboo ladle holder (kakei) */}
      <line x1={cx - size * 0.25} y1={cy - size * 0.15} x2={cx - size * 0.05} y2={cy}
            stroke="#8B7355" strokeWidth={2} strokeLinecap="round" />
      {/* Bamboo spout */}
      <line x1={cx - size * 0.28} y1={cy - size * 0.12} x2={cx - size * 0.15} y2={cy - size * 0.02}
            stroke="#6B5344" strokeWidth={3} strokeLinecap="round" />

      {/* Water drip from spout */}
      <circle cx={cx - size * 0.12} cy={cy} r={size * 0.015}
              fill={materials.waterLight} opacity={0.7}>
        <animate attributeName="cy" from={cy - size * 0.02} to={cy + size * 0.08} dur="1.2s" repeatCount="indefinite" />
        <animate attributeName="opacity" from="0.8" to="0" dur="1.2s" repeatCount="indefinite" />
      </circle>

      {/* Surrounding stones */}
      {[
        { x: 0.25, y: 0.15, r: 0.08 },
        { x: -0.28, y: 0.18, r: 0.06 },
        { x: 0.15, y: 0.25, r: 0.05 },
        { x: -0.2, y: 0.08, r: 0.04 }
      ].map((stone, i) => (
        <ellipse key={i} cx={cx + size * stone.x} cy={cy + size * stone.y}
                 rx={size * stone.r} ry={size * stone.r * 0.7}
                 fill={materials.stoneDark} opacity={0.8} />
      ))}

      {/* Moss accent */}
      <ellipse cx={cx + size * 0.2} cy={cy + size * 0.12} rx={size * 0.04} ry={size * 0.02}
               fill="#4A6741" opacity={0.6} />
    </g>
  );

  // ===== EAST ASIAN DRAGON FOUNTAIN =====
  const renderDragonFountain = () => (
    <g>
      <ellipse cx={cx} cy={size * 0.88} rx={size * 0.4} ry={size * 0.1} fill="rgba(0,0,0,0.2)" />

      {/* Octagonal basin */}
      <polygon points={`
        ${cx - size * 0.3},${cy + size * 0.15}
        ${cx - size * 0.35},${cy + size * 0.25}
        ${cx - size * 0.25},${cy + size * 0.32}
        ${cx + size * 0.25},${cy + size * 0.32}
        ${cx + size * 0.35},${cy + size * 0.25}
        ${cx + size * 0.3},${cy + size * 0.15}
        ${cx + size * 0.15},${cy + size * 0.1}
        ${cx - size * 0.15},${cy + size * 0.1}
      `} fill={materials.stone} stroke={materials.stoneDark} strokeWidth={1} />
      {renderWater(size * 0.28, size * 0.1, cx, cy + size * 0.22)}

      {/* Dragon head spout */}
      <ellipse cx={cx} cy={cy - size * 0.05} rx={size * 0.1} ry={size * 0.08}
               fill={materials.accent} stroke={materials.stoneDark} strokeWidth={1} />
      {/* Eyes */}
      <circle cx={cx - size * 0.04} cy={cy - size * 0.08} r={size * 0.015} fill="#FFD700" />
      <circle cx={cx + size * 0.04} cy={cy - size * 0.08} r={size * 0.015} fill="#FFD700" />
      {/* Snout/mouth */}
      <ellipse cx={cx} cy={cy + size * 0.02} rx={size * 0.05} ry={size * 0.03}
               fill={materials.stoneDark} />

      {/* Water stream from mouth */}
      <path d={`M ${cx} ${cy + size * 0.04} Q ${cx} ${cy + size * 0.12} ${cx} ${cy + size * 0.18}`}
            stroke={materials.waterLight} strokeWidth={2} fill="none" opacity={0.7}>
        <animate attributeName="opacity" values="0.8;0.5;0.8" dur="1s" repeatCount="indefinite" />
      </path>

      {/* Decorative cloud motifs */}
      {[-0.25, 0.25].map((offset, i) => (
        <path key={i} d={`M ${cx + size * offset} ${cy}
                         q ${size * 0.03} ${-size * 0.02} ${size * 0.05} 0
                         q ${size * 0.03} ${size * 0.02} ${size * 0.05} 0`}
              fill="none" stroke={materials.stoneLight} strokeWidth={0.8} opacity={0.6} />
      ))}
    </g>
  );

  // ===== CENOTE (MESOAMERICAN SACRED POOL) =====
  const renderCenote = () => (
    <g>
      {/* Natural rock opening */}
      <ellipse cx={cx} cy={cy + size * 0.1} rx={size * 0.42} ry={size * 0.25}
               fill={materials.stoneDark} />
      <ellipse cx={cx} cy={cy + size * 0.08} rx={size * 0.38} ry={size * 0.22}
               fill={materials.stone} />

      {/* Deep water pool */}
      <ellipse cx={cx} cy={cy + size * 0.1} rx={size * 0.32} ry={size * 0.18}
               fill={materials.waterDark} />
      <ellipse cx={cx} cy={cy + size * 0.08} rx={size * 0.28} ry={size * 0.15}
               fill={materials.water} />
      <ellipse cx={cx - size * 0.08} cy={cy + size * 0.05} rx={size * 0.1} ry={size * 0.06}
               fill={materials.waterLight} opacity={0.4} />

      {/* Hanging vines/roots */}
      {[-0.3, -0.15, 0.2, 0.35].map((offset, i) => (
        <path key={i} d={`M ${cx + size * offset} ${cy - size * 0.15}
                         Q ${cx + size * offset + size * 0.02} ${cy - size * 0.05}
                           ${cx + size * offset - size * 0.01} ${cy + size * 0.05}`}
              stroke="#2D5A27" strokeWidth={1} fill="none" opacity={0.7} />
      ))}

      {/* Rocky edges */}
      {[
        { x: -0.4, y: 0.05, rx: 0.08, ry: 0.05 },
        { x: 0.38, y: 0.02, rx: 0.07, ry: 0.04 },
        { x: -0.35, y: 0.2, rx: 0.06, ry: 0.04 },
        { x: 0.32, y: 0.22, rx: 0.08, ry: 0.05 }
      ].map((rock, i) => (
        <ellipse key={i} cx={cx + size * rock.x} cy={cy + size * rock.y}
                 rx={size * rock.rx} ry={size * rock.ry}
                 fill={materials.stoneDark} />
      ))}

      {/* Stone platform/altar at edge */}
      <rect x={cx + size * 0.15} y={cy - size * 0.2} width={size * 0.2} height={size * 0.12}
            fill={materials.stone} stroke={materials.stoneDark} strokeWidth={0.8} />
    </g>
  );

  // ===== AFRICAN COMMUNITY WELL =====
  const renderCommunityWell = () => (
    <g>
      <ellipse cx={cx} cy={size * 0.88} rx={size * 0.35} ry={size * 0.1} fill="rgba(0,0,0,0.2)" />

      {/* Circular stone wall */}
      <ellipse cx={cx} cy={cy + size * 0.15} rx={size * 0.3} ry={size * 0.15}
               fill={materials.stoneDark} stroke={materials.stone} strokeWidth={1.5} />
      <ellipse cx={cx} cy={cy + size * 0.12} rx={size * 0.26} ry={size * 0.13}
               fill={materials.stone} />

      {/* Well opening with water */}
      <ellipse cx={cx} cy={cy + size * 0.12} rx={size * 0.2} ry={size * 0.1}
               fill={materials.waterDark} />
      <ellipse cx={cx} cy={cy + size * 0.1} rx={size * 0.15} ry={size * 0.07}
               fill={materials.water} opacity={0.8} />

      {/* Wooden frame/pulley structure */}
      <line x1={cx - size * 0.15} y1={cy + size * 0.1} x2={cx - size * 0.15} y2={cy - size * 0.25}
            stroke="#5D4037" strokeWidth={2} />
      <line x1={cx + size * 0.15} y1={cy + size * 0.1} x2={cx + size * 0.15} y2={cy - size * 0.25}
            stroke="#5D4037" strokeWidth={2} />
      {/* Crossbar */}
      <line x1={cx - size * 0.18} y1={cy - size * 0.25} x2={cx + size * 0.18} y2={cy - size * 0.25}
            stroke="#5D4037" strokeWidth={2.5} />

      {/* Rope and bucket */}
      <line x1={cx} y1={cy - size * 0.25} x2={cx} y2={cy}
            stroke="#8B7355" strokeWidth={1} strokeDasharray="2,2" />
      <rect x={cx - size * 0.04} y={cy - size * 0.02} width={size * 0.08} height={size * 0.08}
            fill="#6B4423" stroke="#5D4037" strokeWidth={0.5} />

      {/* Decorative carved pattern on wall */}
      <ellipse cx={cx} cy={cy + size * 0.18} rx={size * 0.28} ry={size * 0.02}
               fill="none" stroke={materials.accent} strokeWidth={0.8} strokeDasharray="3,2" />
    </g>
  );

  // ===== NATURAL POOL (OCEANIA) =====
  const renderNaturalPool = () => (
    <g>
      {/* Organic pool shape */}
      <path d={`M ${cx - size * 0.35} ${cy + size * 0.1}
                Q ${cx - size * 0.4} ${cy - size * 0.05} ${cx - size * 0.2} ${cy - size * 0.15}
                Q ${cx} ${cy - size * 0.2} ${cx + size * 0.25} ${cy - size * 0.12}
                Q ${cx + size * 0.4} ${cy} ${cx + size * 0.35} ${cy + size * 0.15}
                Q ${cx + size * 0.25} ${cy + size * 0.3} ${cx} ${cy + size * 0.28}
                Q ${cx - size * 0.3} ${cy + size * 0.25} ${cx - size * 0.35} ${cy + size * 0.1} Z`}
            fill={materials.water} opacity={0.9} />

      {/* Lighter center */}
      <ellipse cx={cx} cy={cy + size * 0.05} rx={size * 0.2} ry={size * 0.12}
               fill={materials.waterLight} opacity={0.5} />

      {/* Surrounding rocks */}
      {[
        { x: -0.38, y: 0.05, rx: 0.1, ry: 0.06 },
        { x: 0.35, y: -0.02, rx: 0.08, ry: 0.05 },
        { x: -0.25, y: -0.18, rx: 0.07, ry: 0.04 },
        { x: 0.28, y: 0.22, rx: 0.09, ry: 0.05 },
        { x: -0.15, y: 0.28, rx: 0.06, ry: 0.04 }
      ].map((rock, i) => (
        <ellipse key={i} cx={cx + size * rock.x} cy={cy + size * rock.y}
                 rx={size * rock.rx} ry={size * rock.ry}
                 fill={materials.stoneDark} />
      ))}

      {/* Tropical vegetation */}
      {[
        { x: -0.4, y: -0.1 },
        { x: 0.38, y: 0.15 },
        { x: 0.2, y: -0.2 }
      ].map((plant, i) => (
        <g key={i}>
          <ellipse cx={cx + size * plant.x} cy={cy + size * plant.y}
                   rx={size * 0.06} ry={size * 0.03} fill="#2D5A27" opacity={0.7} />
          <ellipse cx={cx + size * plant.x + size * 0.02} cy={cy + size * plant.y - size * 0.02}
                   rx={size * 0.04} ry={size * 0.02} fill="#3D7A37" opacity={0.6} />
        </g>
      ))}

      {/* Gentle ripples */}
      <ellipse cx={cx - size * 0.1} cy={cy} rx={size * 0.08} ry={size * 0.04}
               fill="none" stroke={materials.waterLight} strokeWidth={0.5} opacity={0.3}>
        <animate attributeName="rx" from={size * 0.05} to={size * 0.15} dur="3s" repeatCount="indefinite" />
        <animate attributeName="opacity" from="0.4" to="0" dur="3s" repeatCount="indefinite" />
      </ellipse>
    </g>
  );

  // ===== SIMPLE WELL =====
  const renderWell = () => (
    <g>
      <ellipse cx={cx} cy={size * 0.85} rx={size * 0.3} ry={size * 0.1} fill="rgba(0,0,0,0.2)" />

      {/* Stone circular wall */}
      <ellipse cx={cx} cy={cy + size * 0.1} rx={size * 0.25} ry={size * 0.12}
               fill={materials.stoneDark} stroke={materials.stone} strokeWidth={1.5} />
      <ellipse cx={cx} cy={cy + size * 0.08} rx={size * 0.22} ry={size * 0.1}
               fill={materials.stone} />

      {/* Dark opening */}
      <ellipse cx={cx} cy={cy + size * 0.08} rx={size * 0.18} ry={size * 0.08}
               fill={materials.waterDark} opacity={0.8} />

      {/* Wooden roof structure */}
      <line x1={cx - size * 0.12} y1={cy + size * 0.05} x2={cx - size * 0.12} y2={cy - size * 0.2}
            stroke="#5D4037" strokeWidth={2} />
      <line x1={cx + size * 0.12} y1={cy + size * 0.05} x2={cx + size * 0.12} y2={cy - size * 0.2}
            stroke="#5D4037" strokeWidth={2} />

      {/* Roof */}
      <polygon points={`${cx - size * 0.2},${cy - size * 0.2} ${cx},${cy - size * 0.32} ${cx + size * 0.2},${cy - size * 0.2}`}
               fill="#8B4513" stroke="#5D4037" strokeWidth={1} />

      {/* Pulley/winch */}
      <circle cx={cx} cy={cy - size * 0.18} r={size * 0.04}
              fill="#5D4037" stroke="#3D2017" strokeWidth={0.5} />
      <line x1={cx} y1={cy - size * 0.14} x2={cx} y2={cy + size * 0.05}
            stroke="#8B7355" strokeWidth={0.8} />
    </g>
  );

  // Select renderer based on type
  const renderFeature = () => {
    switch (type) {
      case 'nymphaeum': return renderNymphaeum();
      case 'sabil':
      case 'ablution_fountain': return renderSabil();
      case 'stepwell':
      case 'baoli':
      case 'vav':
      case 'kund': return renderStepwell();
      case 'tsukubai': return renderTsukubai();
      case 'dragon_fountain':
      case 'lotus_pool': return renderDragonFountain();
      case 'cenote':
      case 'ritual_pool': return renderCenote();
      case 'community_well':
      case 'sacred_spring': return renderCommunityWell();
      case 'natural_pool': return renderNaturalPool();
      case 'well': return renderWell();
      case 'fountain':
      default: return renderClassicFountain();
    }
  };

  return (
    <svg x={x} y={y} width={size} height={size}
         viewBox={`0 0 ${size} ${size}`}
         style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={materials.stoneLight} />
          <stop offset="50%" stopColor={materials.stone} />
          <stop offset="100%" stopColor={materials.stoneDark} />
        </linearGradient>
      </defs>
      <g opacity={opacity}>
        {renderFeature()}
      </g>
    </svg>
  );
};

export default FountainSymbol;

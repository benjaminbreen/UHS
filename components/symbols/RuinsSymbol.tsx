/**
 * components/symbols/RuinsSymbol.tsx - Beautiful era and culture-aware ruin rendering
 * Optimized for map-scale visibility with atmospheric effects
 */
import React, { useMemo } from 'react';
import { Tile, ClimateType, HistoricalEra } from '../../types';
import { ValueNoise } from '../../utils/noise';
import { shadeColorHSL } from '../../utils/colorUtils';
import { parseDateString } from '../../utils/dateUtils';

interface RuinsSymbolProps {
  x: number;
  y: number;
  size: number;
  seed: number;
  tile: Tile;
  climate?: ClimateType;
  nightIntensity?: number;
  date?: string;
  zone?: string;
}

// Cultural palettes - warm harmonious colors that read well at distance
const CULTURAL_PALETTES: Record<string, {
  primary: string;
  secondary: string;
  accent: string;
  shadow: string;
  vegetation: string;
}> = {
  EUROPEAN: {
    primary: '#8B8378', secondary: '#A09080', accent: '#6B6358',
    shadow: '#4A453D', vegetation: '#5D7A4A'
  },
  MENA: {
    primary: '#D4A574', secondary: '#C4956A', accent: '#B8860B',
    shadow: '#8B6914', vegetation: '#7A8B5A'
  },
  EAST_ASIAN: {
    primary: '#9C8B7A', secondary: '#B8A090', accent: '#8B4513',
    shadow: '#5C4033', vegetation: '#4A6B3A'
  },
  SOUTH_ASIAN: {
    primary: '#CD853F', secondary: '#DEB887', accent: '#B8860B',
    shadow: '#8B6914', vegetation: '#5A7A4A'
  },
  SUB_SAHARAN_AFRICAN: {
    primary: '#BC9A6A', secondary: '#A0826D', accent: '#8B6F47',
    shadow: '#5D4E37', vegetation: '#4A5A3A'
  },
  SOUTH_AMERICAN: {
    primary: '#A0826D', secondary: '#8B7355', accent: '#6B4423',
    shadow: '#4A3728', vegetation: '#3A5A3A'
  },
  NORTH_AMERICAN_PRE_COLUMBIAN: {
    primary: '#C4A484', secondary: '#B8956A', accent: '#8B6914',
    shadow: '#5D4E37', vegetation: '#5A6A4A'
  },
  OCEANIA: {
    primary: '#A09080', secondary: '#8B8070', accent: '#6B5F4F',
    shadow: '#4A453D', vegetation: '#4A6A4A'
  },
};

// Climate-specific vegetation colors
const CLIMATE_VEGETATION: Record<ClimateType, { color: string; density: number }> = {
  [ClimateType.TROPICAL]: { color: '#2D5A27', density: 0.9 },
  [ClimateType.SEMITROPICAL]: { color: '#3D6A37', density: 0.7 },
  [ClimateType.TEMPERATE]: { color: '#5D7A4A', density: 0.5 },
  [ClimateType.MEDITERRANEAN]: { color: '#6D7A5A', density: 0.4 },
  [ClimateType.ARID]: { color: '#8A7A5A', density: 0.15 },
  [ClimateType.COLD]: { color: '#5A6A5A', density: 0.3 },
  [ClimateType.POLAR]: { color: '#7A8A8A', density: 0.1 },
};

const RuinsSymbol: React.FC<RuinsSymbolProps> = ({
  x, y, size, seed, tile,
  climate = ClimateType.TEMPERATE,
  nightIntensity = 0,
  date = '1500 CE',
  zone = 'EUROPEAN'
}) => {
  // Stable random generator
  const rand = useMemo(() => {
    const noise = new ValueNoise(seed + tile.x * 11 + tile.y * 37);
    let calls = 0;
    return () => {
      calls++;
      return new ValueNoise(seed + tile.x * 11 + tile.y * 37 + calls * 17).random();
    };
  }, [seed, tile.x, tile.y]);

  // Parse era from date
  const { era } = parseDateString(date);

  // Get cultural palette
  const culturalZone = tile.culturalZone || zone || 'EUROPEAN';
  const palette = CULTURAL_PALETTES[culturalZone] || CULTURAL_PALETTES.EUROPEAN;
  const vegConfig = CLIMATE_VEGETATION[climate] || CLIMATE_VEGETATION[ClimateType.TEMPERATE];

  // Apply night darkening
  const applyNight = (color: string) =>
    nightIntensity > 0 ? shadeColorHSL(color, -nightIntensity * 0.4, 1, -nightIntensity * 0.2) : color;

  // Determine ruin style based on era and culture
  const ruinStyle = useMemo(() => {
    const style = tile.ruinStyle || tile.ruinType;

    // Map to unified styles
    if (style === 'temple' || style === 'Classical') return 'classical';
    if (style === 'fortress' || style === 'keep' || style === 'Castle' || style === 'Fort') return 'fortress';
    if (style === 'tower' || style === 'minaret' || style === 'Watchtower') return 'tower';
    if (style === 'pagoda' || style === 'Temple' || style === 'Shrine') return 'sacred';
    if (style === 'pyramid') return 'pyramid';
    if (style === 'Village') return 'village';
    if (style === 'Burial Mound') return 'mound';

    // Era-based default
    if (era === HistoricalEra.PREHISTORY) return 'mound';
    if (era === HistoricalEra.ANTIQUITY) return 'classical';
    if (era === HistoricalEra.MEDIEVAL) return 'fortress';
    if (era === HistoricalEra.INDUSTRIAL_ERA || era === HistoricalEra.MODERN_ERA) return 'industrial';

    return rand() > 0.5 ? 'fortress' : 'tower';
  }, [tile.ruinStyle, tile.ruinType, era, rand]);

  // Material override from tile
  const material = tile.ruinMaterial;
  const materialColors: Record<string, { base: string; shadow: string }> = {
    'sandstone': { base: '#D4A574', shadow: '#A67C52' },
    'red stone': { base: '#A0522D', shadow: '#704214' },
    'mudbrick': { base: '#BC9A6A', shadow: '#8B7355' },
    'adobe': { base: '#C19A6B', shadow: '#8B6914' },
    'stone': { base: '#9A9A8A', shadow: '#6A6A5A' },
    'granite': { base: '#7C7B78', shadow: '#555555' },
    'marble': { base: '#E8E0D8', shadow: '#B0A8A0' },
    'limestone': { base: '#E3DAC9', shadow: '#C0B09A' },
    'brick': { base: '#8B4513', shadow: '#5D2E0A' },
  };

  const colors = material && materialColors[material]
    ? materialColors[material]
    : { base: palette.primary, shadow: palette.shadow };

  const baseColor = applyNight(colors.base);
  const shadowColor = applyNight(colors.shadow);
  const accentColor = applyNight(palette.accent);
  const vegColor = applyNight(vegConfig.color);

  // Unique ID for gradients
  const gradientId = `ruin-grad-${tile.x}-${tile.y}`;
  const glowId = `ruin-glow-${tile.x}-${tile.y}`;

  // Render vegetation overgrowth
  const renderVegetation = () => {
    if (vegConfig.density < 0.1) return null;

    const elements: JSX.Element[] = [];
    const vegCount = Math.floor(3 + rand() * 4 * vegConfig.density);

    for (let i = 0; i < vegCount; i++) {
      const vx = x + size * (0.1 + rand() * 0.8);
      const vy = y + size * (0.4 + rand() * 0.4);
      const vSize = size * (0.08 + rand() * 0.12);

      if (climate === ClimateType.TROPICAL || climate === ClimateType.SEMITROPICAL) {
        // Jungle vines/foliage - curved organic shapes
        elements.push(
          <path
            key={`vine-${i}`}
            d={`M ${vx} ${vy} Q ${vx + vSize * (rand() - 0.5)} ${vy - vSize} ${vx + vSize * 0.5} ${vy - vSize * 1.5}`}
            stroke={vegColor}
            strokeWidth={size * 0.02}
            fill="none"
            opacity={0.7 + rand() * 0.3}
          />
        );
      } else if (climate === ClimateType.ARID) {
        // Desert scrub - small dots
        elements.push(
          <circle
            key={`scrub-${i}`}
            cx={vx}
            cy={vy}
            r={vSize * 0.3}
            fill={vegColor}
            opacity={0.4 + rand() * 0.3}
          />
        );
      } else {
        // Temperate moss/grass patches
        elements.push(
          <ellipse
            key={`moss-${i}`}
            cx={vx}
            cy={vy}
            rx={vSize * 0.6}
            ry={vSize * 0.3}
            fill={vegColor}
            opacity={0.5 + rand() * 0.3}
          />
        );
      }
    }

    return elements;
  };

  // Render rubble at base
  const renderRubble = () => {
    const elements: JSX.Element[] = [];
    const rubbleCount = 2 + Math.floor(rand() * 3);

    for (let i = 0; i < rubbleCount; i++) {
      const rx = x + size * (0.15 + rand() * 0.7);
      const ry = y + size * (0.7 + rand() * 0.15);
      const rSize = size * (0.06 + rand() * 0.08);
      const rotation = rand() * 45;

      elements.push(
        <rect
          key={`rubble-${i}`}
          x={rx}
          y={ry}
          width={rSize}
          height={rSize * 0.7}
          fill={shadeColorHSL(baseColor, 0.85)}
          transform={`rotate(${rotation} ${rx + rSize/2} ${ry + rSize*0.35})`}
          opacity={0.8}
        />
      );
    }

    return elements;
  };

  // Main structure rendering based on style
  const renderStructure = () => {
    const cx = x + size * 0.5;
    const baseY = y + size * 0.85;

    switch (ruinStyle) {
      case 'classical': {
        // Greek/Roman columns with pediment
        const colCount = 2 + Math.floor(rand() * 2);
        const colSpacing = size * 0.6 / (colCount + 1);
        const startX = x + size * 0.2;

        return (
          <g>
            {/* Base platform */}
            <rect
              x={x + size * 0.15}
              y={baseY - size * 0.05}
              width={size * 0.7}
              height={size * 0.08}
              fill={baseColor}
              stroke={shadowColor}
              strokeWidth={0.5}
            />

            {/* Columns */}
            {Array.from({ length: colCount }).map((_, i) => {
              const colX = startX + colSpacing * (i + 1);
              const isBroken = rand() > 0.4;
              const colHeight = isBroken
                ? size * (0.2 + rand() * 0.25)
                : size * (0.45 + rand() * 0.1);

              return (
                <g key={`col-${i}`}>
                  {/* Column shadow */}
                  <rect
                    x={colX + size * 0.01}
                    y={baseY - colHeight}
                    width={size * 0.08}
                    height={colHeight}
                    fill={shadowColor}
                    opacity={0.4}
                  />
                  {/* Column body */}
                  <rect
                    x={colX}
                    y={baseY - colHeight - size * 0.05}
                    width={size * 0.07}
                    height={colHeight}
                    fill={`url(#${gradientId})`}
                    stroke={shadowColor}
                    strokeWidth={0.3}
                  />
                  {/* Capital if not broken */}
                  {!isBroken && (
                    <rect
                      x={colX - size * 0.015}
                      y={baseY - colHeight - size * 0.08}
                      width={size * 0.1}
                      height={size * 0.04}
                      fill={baseColor}
                      stroke={shadowColor}
                      strokeWidth={0.3}
                    />
                  )}
                </g>
              );
            })}

            {/* Broken pediment fragment */}
            {rand() > 0.5 && (
              <polygon
                points={`${cx - size * 0.15},${baseY - size * 0.55} ${cx + size * 0.1},${baseY - size * 0.55} ${cx - size * 0.02},${baseY - size * 0.7}`}
                fill={baseColor}
                stroke={shadowColor}
                strokeWidth={0.3}
                opacity={0.9}
              />
            )}
          </g>
        );
      }

      case 'fortress': {
        // Medieval castle ruins with crenellations
        const wallHeight = size * (0.35 + rand() * 0.15);
        const hasTower = rand() > 0.3;
        const towerSide = rand() > 0.5 ? 'left' : 'right';

        return (
          <g>
            {/* Main wall with 3D effect */}
            <rect
              x={x + size * 0.12}
              y={baseY - wallHeight}
              width={size * 0.76}
              height={wallHeight}
              fill={`url(#${gradientId})`}
              stroke={shadowColor}
              strokeWidth={0.5}
            />

            {/* Wall depth side */}
            <polygon
              points={`
                ${x + size * 0.88},${baseY - wallHeight}
                ${x + size * 0.92},${baseY - wallHeight - size * 0.03}
                ${x + size * 0.92},${baseY - size * 0.03}
                ${x + size * 0.88},${baseY}
              `}
              fill={shadowColor}
              opacity={0.6}
            />

            {/* Broken crenellations */}
            {Array.from({ length: 3 }).map((_, i) => {
              if (rand() > 0.6) return null;
              const crenX = x + size * (0.2 + i * 0.25);
              const crenHeight = size * (0.08 + rand() * 0.06);
              return (
                <rect
                  key={`cren-${i}`}
                  x={crenX}
                  y={baseY - wallHeight - crenHeight}
                  width={size * 0.1}
                  height={crenHeight}
                  fill={baseColor}
                  stroke={shadowColor}
                  strokeWidth={0.3}
                />
              );
            })}

            {/* Tower */}
            {hasTower && (
              <g>
                <rect
                  x={towerSide === 'left' ? x + size * 0.08 : x + size * 0.62}
                  y={baseY - wallHeight - size * 0.25}
                  width={size * 0.28}
                  height={wallHeight + size * 0.25}
                  fill={`url(#${gradientId})`}
                  stroke={shadowColor}
                  strokeWidth={0.5}
                />
                {/* Tower shadow */}
                <rect
                  x={towerSide === 'left' ? x + size * 0.36 : x + size * 0.58}
                  y={baseY - wallHeight - size * 0.2}
                  width={size * 0.04}
                  height={wallHeight + size * 0.2}
                  fill={shadowColor}
                  opacity={0.3}
                />
              </g>
            )}

            {/* Archway/gate */}
            <path
              d={`M ${cx - size * 0.08} ${baseY}
                  L ${cx - size * 0.08} ${baseY - size * 0.15}
                  A ${size * 0.08} ${size * 0.08} 0 0 1 ${cx + size * 0.08} ${baseY - size * 0.15}
                  L ${cx + size * 0.08} ${baseY}`}
              fill={shadowColor}
              opacity={0.7}
            />
          </g>
        );
      }

      case 'tower': {
        // Standalone watchtower/minaret ruins
        const towerHeight = size * (0.55 + rand() * 0.2);
        const towerWidth = size * 0.25;
        const isMinaret = culturalZone === 'MENA' || culturalZone === 'SOUTH_ASIAN';

        return (
          <g>
            {/* Tower base */}
            <rect
              x={cx - towerWidth * 0.6}
              y={baseY - size * 0.08}
              width={towerWidth * 1.2}
              height={size * 0.1}
              fill={baseColor}
              stroke={shadowColor}
              strokeWidth={0.4}
            />

            {/* Tower body - tapered for minarets */}
            {isMinaret ? (
              <polygon
                points={`
                  ${cx - towerWidth * 0.5},${baseY - size * 0.08}
                  ${cx + towerWidth * 0.5},${baseY - size * 0.08}
                  ${cx + towerWidth * 0.35},${baseY - towerHeight}
                  ${cx - towerWidth * 0.35},${baseY - towerHeight}
                `}
                fill={`url(#${gradientId})`}
                stroke={shadowColor}
                strokeWidth={0.5}
              />
            ) : (
              <rect
                x={cx - towerWidth * 0.5}
                y={baseY - towerHeight}
                width={towerWidth}
                height={towerHeight - size * 0.08}
                fill={`url(#${gradientId})`}
                stroke={shadowColor}
                strokeWidth={0.5}
              />
            )}

            {/* Broken top detail */}
            <path
              d={`M ${cx - towerWidth * 0.35} ${baseY - towerHeight}
                  L ${cx - towerWidth * 0.2} ${baseY - towerHeight - size * 0.08}
                  L ${cx + towerWidth * 0.1} ${baseY - towerHeight - size * 0.04}
                  L ${cx + towerWidth * 0.35} ${baseY - towerHeight}`}
              fill={baseColor}
              stroke={shadowColor}
              strokeWidth={0.3}
            />

            {/* Window opening */}
            <ellipse
              cx={cx}
              cy={baseY - towerHeight * 0.6}
              rx={size * 0.04}
              ry={size * 0.06}
              fill={shadowColor}
              opacity={0.8}
            />
          </g>
        );
      }

      case 'sacred': {
        // Temple/pagoda/shrine ruins
        const isPagoda = culturalZone === 'EAST_ASIAN';
        const isStupa = culturalZone === 'SOUTH_ASIAN';

        if (isPagoda) {
          // East Asian pagoda ruins
          const tiers = 2 + Math.floor(rand() * 2);
          const tierHeight = size * 0.15;

          return (
            <g>
              {Array.from({ length: tiers }).map((_, i) => {
                const tierY = baseY - tierHeight * (i + 1);
                const tierWidth = size * (0.5 - i * 0.1);
                return (
                  <g key={`tier-${i}`}>
                    {/* Roof overhang */}
                    <polygon
                      points={`
                        ${cx - tierWidth * 0.6},${tierY}
                        ${cx + tierWidth * 0.6},${tierY}
                        ${cx + tierWidth * 0.5},${tierY - size * 0.03}
                        ${cx - tierWidth * 0.5},${tierY - size * 0.03}
                      `}
                      fill={accentColor}
                      stroke={shadowColor}
                      strokeWidth={0.3}
                    />
                    {/* Tier body */}
                    <rect
                      x={cx - tierWidth * 0.4}
                      y={tierY - tierHeight + size * 0.03}
                      width={tierWidth * 0.8}
                      height={tierHeight - size * 0.06}
                      fill={baseColor}
                      stroke={shadowColor}
                      strokeWidth={0.3}
                    />
                  </g>
                );
              })}
            </g>
          );
        } else if (isStupa) {
          // South Asian stupa/dome ruins
          return (
            <g>
              <rect
                x={x + size * 0.2}
                y={baseY - size * 0.1}
                width={size * 0.6}
                height={size * 0.12}
                fill={baseColor}
                stroke={shadowColor}
                strokeWidth={0.4}
              />
              <ellipse
                cx={cx}
                cy={baseY - size * 0.25}
                rx={size * 0.25}
                ry={size * 0.18}
                fill={`url(#${gradientId})`}
                stroke={shadowColor}
                strokeWidth={0.5}
              />
              {/* Broken spire */}
              <polygon
                points={`${cx - size * 0.05},${baseY - size * 0.4} ${cx + size * 0.05},${baseY - size * 0.4} ${cx},${baseY - size * 0.55}`}
                fill={accentColor}
                stroke={shadowColor}
                strokeWidth={0.3}
              />
            </g>
          );
        } else {
          // Generic temple ruins
          return (
            <g>
              <rect
                x={x + size * 0.15}
                y={baseY - size * 0.08}
                width={size * 0.7}
                height={size * 0.1}
                fill={baseColor}
                stroke={shadowColor}
                strokeWidth={0.4}
              />
              <rect
                x={x + size * 0.25}
                y={baseY - size * 0.35}
                width={size * 0.5}
                height={size * 0.28}
                fill={`url(#${gradientId})`}
                stroke={shadowColor}
                strokeWidth={0.4}
              />
              <polygon
                points={`${x + size * 0.2},${baseY - size * 0.35} ${cx},${baseY - size * 0.5} ${x + size * 0.8},${baseY - size * 0.35}`}
                fill={baseColor}
                stroke={shadowColor}
                strokeWidth={0.4}
              />
            </g>
          );
        }
      }

      case 'pyramid': {
        // Stepped pyramid or mound
        const steps = 3 + Math.floor(rand() * 2);

        return (
          <g>
            {Array.from({ length: steps }).map((_, i) => {
              const stepWidth = size * (0.7 - i * 0.12);
              const stepHeight = size * 0.1;
              const stepY = baseY - stepHeight * (i + 1);
              return (
                <rect
                  key={`step-${i}`}
                  x={cx - stepWidth / 2}
                  y={stepY}
                  width={stepWidth}
                  height={stepHeight + 1}
                  fill={i % 2 === 0 ? baseColor : shadeColorHSL(baseColor, 0.92)}
                  stroke={shadowColor}
                  strokeWidth={0.4}
                />
              );
            })}
          </g>
        );
      }

      case 'industrial': {
        // Industrial era ruins - smokestacks, factory walls
        return (
          <g>
            {/* Factory wall section */}
            <rect
              x={x + size * 0.1}
              y={baseY - size * 0.3}
              width={size * 0.5}
              height={size * 0.32}
              fill={shadeColorHSL(baseColor, 0.85)}
              stroke={shadowColor}
              strokeWidth={0.5}
            />
            {/* Broken windows */}
            {Array.from({ length: 2 }).map((_, i) => (
              <rect
                key={`win-${i}`}
                x={x + size * (0.18 + i * 0.2)}
                y={baseY - size * 0.22}
                width={size * 0.1}
                height={size * 0.12}
                fill={shadowColor}
                opacity={0.6}
              />
            ))}
            {/* Smokestack */}
            <rect
              x={x + size * 0.65}
              y={baseY - size * 0.55}
              width={size * 0.15}
              height={size * 0.57}
              fill={`url(#${gradientId})`}
              stroke={shadowColor}
              strokeWidth={0.5}
            />
            {/* Broken top */}
            <path
              d={`M ${x + size * 0.65} ${baseY - size * 0.55}
                  L ${x + size * 0.68} ${baseY - size * 0.62}
                  L ${x + size * 0.77} ${baseY - size * 0.58}
                  L ${x + size * 0.8} ${baseY - size * 0.55}`}
              fill={shadeColorHSL(baseColor, 0.9)}
              stroke={shadowColor}
              strokeWidth={0.3}
            />
          </g>
        );
      }

      case 'village': {
        // Abandoned village ruins
        const houseCount = 2 + Math.floor(rand() * 2);
        return (
          <g>
            {Array.from({ length: houseCount }).map((_, i) => {
              const hx = x + size * (0.15 + i * 0.35 + rand() * 0.1);
              const hy = baseY - size * (0.15 + rand() * 0.1);
              const hw = size * (0.2 + rand() * 0.08);
              const hh = size * (0.12 + rand() * 0.05);
              return (
                <g key={`house-${i}`}>
                  <rect
                    x={hx}
                    y={hy - hh}
                    width={hw}
                    height={hh}
                    fill={shadeColorHSL(baseColor, 0.9)}
                    stroke={shadowColor}
                    strokeWidth={0.3}
                  />
                  {/* Collapsed roof fragment */}
                  {rand() > 0.4 && (
                    <polygon
                      points={`${hx},${hy - hh} ${hx + hw * 0.5},${hy - hh - size * 0.08} ${hx + hw * 0.7},${hy - hh}`}
                      fill={accentColor}
                      opacity={0.8}
                    />
                  )}
                </g>
              );
            })}
          </g>
        );
      }

      case 'mound':
      default: {
        // Burial mound / prehistoric ruins
        const moundWidth = size * (0.5 + rand() * 0.15);
        const moundHeight = size * (0.2 + rand() * 0.1);

        return (
          <g>
            {/* Mound shape */}
            <ellipse
              cx={cx}
              cy={baseY - moundHeight * 0.3}
              rx={moundWidth * 0.5}
              ry={moundHeight}
              fill={vegConfig.color}
              opacity={0.7}
            />
            {/* Stone entrance */}
            <rect
              x={cx - size * 0.06}
              y={baseY - moundHeight * 0.5}
              width={size * 0.12}
              height={size * 0.15}
              fill={shadowColor}
              opacity={0.8}
            />
            {/* Standing stones */}
            {rand() > 0.5 && (
              <>
                <rect
                  x={cx - moundWidth * 0.4}
                  y={baseY - size * 0.25}
                  width={size * 0.05}
                  height={size * 0.15}
                  fill={baseColor}
                  stroke={shadowColor}
                  strokeWidth={0.3}
                  transform={`rotate(${-5 + rand() * 10} ${cx - moundWidth * 0.4} ${baseY})`}
                />
                <rect
                  x={cx + moundWidth * 0.35}
                  y={baseY - size * 0.2}
                  width={size * 0.05}
                  height={size * 0.12}
                  fill={baseColor}
                  stroke={shadowColor}
                  strokeWidth={0.3}
                  transform={`rotate(${-5 + rand() * 10} ${cx + moundWidth * 0.35} ${baseY})`}
                />
              </>
            )}
          </g>
        );
      }
    }
  };

  return (
    <g>
      {/* Definitions */}
      <defs>
        {/* Stone gradient for 3D effect */}
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={shadeColorHSL(baseColor, 1.15)} />
          <stop offset="50%" stopColor={baseColor} />
          <stop offset="100%" stopColor={shadowColor} />
        </linearGradient>

        {/* Subtle glow for atmosphere */}
        <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Ground shadow */}
      <ellipse
        cx={x + size * 0.5}
        cy={y + size * 0.88}
        rx={size * 0.4}
        ry={size * 0.12}
        fill="rgba(0,0,0,0.25)"
      />

      {/* Main structure */}
      {renderStructure()}

      {/* Rubble */}
      {renderRubble()}

      {/* Vegetation overgrowth */}
      {renderVegetation()}

      {/* Atmospheric dust/age overlay */}
      <rect
        x={x}
        y={y}
        width={size}
        height={size}
        fill={climate === ClimateType.ARID ? '#D4A574' : '#8B8378'}
        opacity={0.05}
      />

      {/* Night glow effect - moonlit stones */}
      {nightIntensity > 0.3 && (
        <ellipse
          cx={x + size * 0.5}
          cy={y + size * 0.5}
          rx={size * 0.35}
          ry={size * 0.25}
          fill="#4A6A8A"
          opacity={nightIntensity * 0.08}
          filter={`url(#${glowId})`}
        />
      )}
    </g>
  );
};

export default React.memo(RuinsSymbol);

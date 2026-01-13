/**
 * WaystationSymbol.tsx - Culture and era-specific lodging/waystation symbols
 * Includes: taverns, caravanserais, ryokans, dharamshalas, tambos, and more
 * Beautiful renderings with subtle animations optimized for map-scale visibility
 */
import React, { useMemo } from 'react';
import { ValueNoise } from '../../../utils/noise';

// Waystation types keyed to cultural names
export type WaystationFeatureType =
  // European
  | 'tavern' | 'posting_inn' | 'railway_hotel' | 'hospice'
  // Islamic/MENA
  | 'caravanserai' | 'funduq' | 'khan' | 'ribat'
  // South Asian
  | 'dharamshala' | 'serai' | 'choultry' | 'dak_bungalow'
  // East Asian
  | 'ryokan' | 'kezhan' | 'hanok' | 'shukubo'
  // African
  | 'trading_post' | 'rest_shelter'
  // Americas
  | 'tambo' | 'posada' | 'roadhouse'
  // Oceania
  | 'guest_house' | 'longhouse_inn';

interface WaystationSymbolProps {
  x: number;
  y: number;
  size: number;
  culturalZone?: string;
  era?: number;
  featureType?: WaystationFeatureType;
  opacity?: number;
  seed?: number;
  nightIntensity?: number;
}

// Cultural material palettes
const CULTURAL_MATERIALS: Record<string, {
  wall: string;
  wallLight: string;
  wallDark: string;
  roof: string;
  roofDark: string;
  wood: string;
  woodDark: string;
  accent: string;
  window: string;
}> = {
  EUROPEAN: {
    wall: '#E8DCC8', wallLight: '#F5EED8', wallDark: '#C8BCA8',
    roof: '#8B4513', roofDark: '#5D2E0A',
    wood: '#8B7355', woodDark: '#5D4037',
    accent: '#DAA520', window: '#87CEEB'
  },
  MENA: {
    wall: '#F0E4D0', wallLight: '#FFF8E8', wallDark: '#D0C4A8',
    roof: '#D2B48C', roofDark: '#A08060',
    wood: '#8B6914', woodDark: '#5D4037',
    accent: '#1E90AA', window: '#4A9ECA'
  },
  SOUTH_ASIAN: {
    wall: '#DEB887', wallLight: '#F5DEB3', wallDark: '#C4956A',
    roof: '#CD853F', roofDark: '#8B5A2B',
    wood: '#8B4513', woodDark: '#5D2E0A',
    accent: '#FF6B35', window: '#87CEEB'
  },
  EAST_ASIAN: {
    wall: '#F5F5DC', wallLight: '#FFFFF0', wallDark: '#D2D2B8',
    roof: '#2F4F4F', roofDark: '#1A2F2F',
    wood: '#8B4513', woodDark: '#5D2E0A',
    accent: '#8B0000', window: '#F0E68C'
  },
  SUB_SAHARAN_AFRICAN: {
    wall: '#D2B48C', wallLight: '#DEB887', wallDark: '#A08060',
    roof: '#8B6F47', roofDark: '#5D4037',
    wood: '#6B4423', woodDark: '#3D2817',
    accent: '#D4AF37', window: '#87CEEB'
  },
  SOUTH_AMERICAN: {
    wall: '#C4A484', wallLight: '#D4B494', wallDark: '#A48464',
    roof: '#8B6914', roofDark: '#5D4037',
    wood: '#8B4513', woodDark: '#5D2E0A',
    accent: '#00CD66', window: '#87CEEB'
  },
  NORTH_AMERICAN_PRE_COLUMBIAN: {
    wall: '#A08070', wallLight: '#B09080', wallDark: '#806050',
    roof: '#8B6F47', roofDark: '#5D4E37',
    wood: '#6B4423', woodDark: '#4A3020',
    accent: '#00CED1', window: '#4682B4'
  },
  OCEANIA: {
    wall: '#D2B48C', wallLight: '#E0C8A0', wallDark: '#B09878',
    roof: '#6B5344', roofDark: '#4A3728',
    wood: '#8B6914', woodDark: '#5D4037',
    accent: '#FF8C00', window: '#87CEEB'
  }
};

// Determine default waystation type based on culture and era
const getDefaultFeatureType = (zone: string, era: number): WaystationFeatureType => {
  const eraNum = era || 1500;

  switch (zone) {
    case 'MENA':
    case 'NORTH_AFRICAN':
      return eraNum < 1800 ? 'caravanserai' : 'funduq';

    case 'SOUTH_ASIAN':
      if (eraNum >= 1800) return 'dak_bungalow';
      return Math.random() > 0.5 ? 'dharamshala' : 'serai';

    case 'EAST_ASIAN':
      if (zone.includes('JAPAN') || Math.random() > 0.6) return 'ryokan';
      return 'kezhan';

    case 'SUB_SAHARAN_AFRICAN':
      return 'trading_post';

    case 'SOUTH_AMERICAN':
      if (eraNum < 1532) return 'tambo';
      return 'posada';

    case 'NORTH_AMERICAN_PRE_COLUMBIAN':
      return eraNum < 1600 ? 'longhouse_inn' : 'roadhouse';

    case 'OCEANIA':
      return 'guest_house';

    default: // EUROPEAN
      if (eraNum >= 1850) return 'railway_hotel';
      if (eraNum >= 1600) return 'posting_inn';
      return 'tavern';
  }
};

const WaystationSymbol: React.FC<WaystationSymbolProps> = ({
  x, y, size,
  culturalZone = 'EUROPEAN',
  era = 1500,
  featureType,
  opacity = 1.0,
  seed = 12345,
  nightIntensity = 0
}) => {
  const zone = culturalZone?.toUpperCase() || 'EUROPEAN';
  const materials = CULTURAL_MATERIALS[zone] || CULTURAL_MATERIALS.EUROPEAN;

  // Stable random
  const rand = useMemo(() => {
    let calls = 0;
    return () => {
      calls++;
      return new ValueNoise(seed + calls * 17).random();
    };
  }, [seed]);

  // Determine feature type
  const type = featureType || getDefaultFeatureType(zone, era);

  const cx = size / 2;
  const cy = size * 0.55;
  const baseY = y + size * 0.85;
  const gradientId = `waystation-grad-${seed}`;
  const smokeId = `smoke-${seed}`;
  const glowId = `glow-${seed}`;

  // Night-adjusted window color (warm glow at night)
  const windowColor = nightIntensity > 0.3 ? '#FFD700' : materials.window;
  const windowGlow = nightIntensity > 0.3;

  // ===== EUROPEAN TAVERN =====
  const renderTavern = () => (
    <g>
      {/* Ground shadow */}
      <ellipse cx={x + cx} cy={baseY + size * 0.02} rx={size * 0.4} ry={size * 0.1} fill="rgba(0,0,0,0.2)" />

      {/* Main building */}
      <rect x={x + size * 0.15} y={baseY - size * 0.45} width={size * 0.55} height={size * 0.47}
            fill={materials.wall} stroke={materials.wallDark} strokeWidth={1} />

      {/* Timber framing */}
      <line x1={x + size * 0.15} y1={baseY - size * 0.25} x2={x + size * 0.7} y2={baseY - size * 0.25}
            stroke={materials.wood} strokeWidth={2} />
      <line x1={x + size * 0.35} y1={baseY - size * 0.45} x2={x + size * 0.35} y2={baseY}
            stroke={materials.wood} strokeWidth={2} />
      <line x1={x + size * 0.5} y1={baseY - size * 0.45} x2={x + size * 0.5} y2={baseY}
            stroke={materials.wood} strokeWidth={2} />

      {/* Roof */}
      <polygon points={`${x + size * 0.1},${baseY - size * 0.45} ${x + size * 0.425},${baseY - size * 0.7} ${x + size * 0.75},${baseY - size * 0.45}`}
               fill={materials.roof} stroke={materials.roofDark} strokeWidth={1} />

      {/* Chimney with smoke */}
      <rect x={x + size * 0.55} y={baseY - size * 0.72} width={size * 0.08} height={size * 0.2}
            fill={materials.wallDark} stroke={materials.wall} strokeWidth={0.5} />
      {/* Animated smoke */}
      <g opacity={0.4}>
        <circle cx={x + size * 0.59} cy={baseY - size * 0.75} r={size * 0.025} fill="#888">
          <animate attributeName="cy" from={baseY - size * 0.75} to={baseY - size * 0.95} dur="3s" repeatCount="indefinite" />
          <animate attributeName="opacity" from="0.4" to="0" dur="3s" repeatCount="indefinite" />
          <animate attributeName="r" from={size * 0.025} to={size * 0.05} dur="3s" repeatCount="indefinite" />
        </circle>
        <circle cx={x + size * 0.59} cy={baseY - size * 0.78} r={size * 0.02} fill="#999">
          <animate attributeName="cy" from={baseY - size * 0.78} to={baseY - size * 0.98} dur="3.5s" begin="0.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" from="0.3" to="0" dur="3.5s" begin="0.5s" repeatCount="indefinite" />
        </circle>
      </g>

      {/* Door */}
      <rect x={x + size * 0.38} y={baseY - size * 0.22} width={size * 0.1} height={size * 0.22}
            fill={materials.woodDark} stroke={materials.wood} strokeWidth={0.5} />

      {/* Windows with glow */}
      {[0.2, 0.55].map((offset, i) => (
        <g key={i}>
          <rect x={x + size * offset} y={baseY - size * 0.4} width={size * 0.1} height={size * 0.1}
                fill={windowColor} stroke={materials.wood} strokeWidth={0.8} />
          {windowGlow && (
            <rect x={x + size * offset} y={baseY - size * 0.4} width={size * 0.1} height={size * 0.1}
                  fill="#FFD700" opacity={0.3} filter={`url(#${glowId})`} />
          )}
        </g>
      ))}

      {/* Hanging sign */}
      <line x1={x + size * 0.72} y1={baseY - size * 0.35} x2={x + size * 0.85} y2={baseY - size * 0.35}
            stroke={materials.wood} strokeWidth={1.5} />
      <rect x={x + size * 0.75} y={baseY - size * 0.35} width={size * 0.12} height={size * 0.1}
            fill={materials.accent} stroke={materials.woodDark} strokeWidth={0.5}>
        <animate attributeName="transform" values="rotate(0 ${x + size * 0.81} ${baseY - size * 0.35});rotate(3 ${x + size * 0.81} ${baseY - size * 0.35});rotate(-3 ${x + size * 0.81} ${baseY - size * 0.35});rotate(0 ${x + size * 0.81} ${baseY - size * 0.35})"
                 dur="4s" repeatCount="indefinite" />
      </rect>

      {/* Lantern at door */}
      {nightIntensity > 0.2 && (
        <circle cx={x + size * 0.35} cy={baseY - size * 0.25} r={size * 0.03}
                fill="#FFD700" opacity={0.8}>
          <animate attributeName="opacity" values="0.6;0.9;0.6" dur="2s" repeatCount="indefinite" />
        </circle>
      )}
    </g>
  );

  // ===== CARAVANSERAI =====
  const renderCaravanserai = () => (
    <g>
      <ellipse cx={x + cx} cy={baseY + size * 0.02} rx={size * 0.45} ry={size * 0.1} fill="rgba(0,0,0,0.2)" />

      {/* Outer walls */}
      <rect x={x + size * 0.08} y={baseY - size * 0.5} width={size * 0.84} height={size * 0.52}
            fill={materials.wall} stroke={materials.wallDark} strokeWidth={1.5} />

      {/* Corner towers */}
      {[0.08, 0.82].map((xOff, i) => (
        <g key={i}>
          <rect x={x + size * xOff - size * 0.02} y={baseY - size * 0.58} width={size * 0.12} height={size * 0.6}
                fill={materials.wall} stroke={materials.wallDark} strokeWidth={1} />
          {/* Dome on tower */}
          <ellipse cx={x + size * xOff + size * 0.04} cy={baseY - size * 0.58} rx={size * 0.06} ry={size * 0.04}
                   fill={materials.roof} stroke={materials.roofDark} strokeWidth={0.5} />
        </g>
      ))}

      {/* Main gate arch */}
      <path d={`M ${x + size * 0.35} ${baseY}
                L ${x + size * 0.35} ${baseY - size * 0.35}
                Q ${x + size * 0.35} ${baseY - size * 0.45} ${x + size * 0.5} ${baseY - size * 0.5}
                Q ${x + size * 0.65} ${baseY - size * 0.45} ${x + size * 0.65} ${baseY - size * 0.35}
                L ${x + size * 0.65} ${baseY} Z`}
            fill={materials.wallDark} opacity={0.7} />

      {/* Inner courtyard glimpse */}
      <rect x={x + size * 0.4} y={baseY - size * 0.3} width={size * 0.2} height={size * 0.15}
            fill="#C4956A" opacity={0.5} />

      {/* Decorative crenellations */}
      {Array.from({ length: 5 }).map((_, i) => (
        <rect key={i} x={x + size * (0.2 + i * 0.14)} y={baseY - size * 0.54}
              width={size * 0.06} height={size * 0.06}
              fill={materials.wall} stroke={materials.wallDark} strokeWidth={0.5} />
      ))}

      {/* Arched gallery windows */}
      {[0.18, 0.72].map((xOff, i) => (
        <path key={i} d={`M ${x + size * xOff} ${baseY - size * 0.2}
                         L ${x + size * xOff} ${baseY - size * 0.35}
                         A ${size * 0.04} ${size * 0.04} 0 0 1 ${x + size * (xOff + 0.08)} ${baseY - size * 0.35}
                         L ${x + size * (xOff + 0.08)} ${baseY - size * 0.2} Z`}
              fill={windowGlow ? '#FFD700' : materials.wallDark} opacity={windowGlow ? 0.6 : 0.5} />
      ))}

      {/* Torch at entrance */}
      {nightIntensity > 0.2 && (
        <g>
          <circle cx={x + size * 0.5} cy={baseY - size * 0.52} r={size * 0.025}
                  fill="#FF6B35" opacity={0.9}>
            <animate attributeName="opacity" values="0.7;1;0.7" dur="1.5s" repeatCount="indefinite" />
          </circle>
          <circle cx={x + size * 0.5} cy={baseY - size * 0.52} r={size * 0.05}
                  fill="#FFD700" opacity={0.2} filter={`url(#${glowId})`} />
        </g>
      )}
    </g>
  );

  // ===== JAPANESE RYOKAN =====
  const renderRyokan = () => (
    <g>
      <ellipse cx={x + cx} cy={baseY + size * 0.02} rx={size * 0.4} ry={size * 0.1} fill="rgba(0,0,0,0.15)" />

      {/* Main building */}
      <rect x={x + size * 0.15} y={baseY - size * 0.4} width={size * 0.6} height={size * 0.42}
            fill={materials.wall} stroke={materials.wood} strokeWidth={1} />

      {/* Curved roof (irimoya style) */}
      <path d={`M ${x + size * 0.08} ${baseY - size * 0.4}
                Q ${x + size * 0.1} ${baseY - size * 0.55} ${x + size * 0.45} ${baseY - size * 0.65}
                Q ${x + size * 0.8} ${baseY - size * 0.55} ${x + size * 0.82} ${baseY - size * 0.4}
                L ${x + size * 0.75} ${baseY - size * 0.4}
                Q ${x + size * 0.45} ${baseY - size * 0.52} ${x + size * 0.15} ${baseY - size * 0.4} Z`}
            fill={materials.roof} stroke={materials.roofDark} strokeWidth={1} />

      {/* Roof ridge ornament */}
      <ellipse cx={x + size * 0.45} cy={baseY - size * 0.65} rx={size * 0.03} ry={size * 0.02}
               fill={materials.accent} />

      {/* Shoji screens (sliding doors) */}
      <rect x={x + size * 0.2} y={baseY - size * 0.35} width={size * 0.2} height={size * 0.32}
            fill={windowGlow ? '#FFF8DC' : '#F5F5DC'} stroke={materials.wood} strokeWidth={0.8}
            opacity={windowGlow ? 0.9 : 0.8} />
      {/* Grid pattern */}
      <line x1={x + size * 0.3} y1={baseY - size * 0.35} x2={x + size * 0.3} y2={baseY - size * 0.03}
            stroke={materials.wood} strokeWidth={0.5} />
      <line x1={x + size * 0.2} y1={baseY - size * 0.19} x2={x + size * 0.4} y2={baseY - size * 0.19}
            stroke={materials.wood} strokeWidth={0.5} />

      {/* Engawa (veranda) */}
      <rect x={x + size * 0.15} y={baseY - size * 0.03} width={size * 0.6} height={size * 0.05}
            fill={materials.wood} stroke={materials.woodDark} strokeWidth={0.5} />

      {/* Paper lantern (chochin) */}
      <ellipse cx={x + size * 0.55} cy={baseY - size * 0.28} rx={size * 0.04} ry={size * 0.06}
               fill={nightIntensity > 0.2 ? '#FFE4B5' : '#FFF8DC'} stroke={materials.accent} strokeWidth={0.5} />
      {nightIntensity > 0.2 && (
        <ellipse cx={x + size * 0.55} cy={baseY - size * 0.28} rx={size * 0.06} ry={size * 0.08}
                 fill="#FFD700" opacity={0.3}>
          <animate attributeName="opacity" values="0.2;0.4;0.2" dur="2s" repeatCount="indefinite" />
        </ellipse>
      )}

      {/* Noren (entrance curtain) */}
      <rect x={x + size * 0.52} y={baseY - size * 0.35} width={size * 0.15} height={size * 0.18}
            fill={materials.accent} opacity={0.8} />
      <line x1={x + size * 0.595} y1={baseY - size * 0.35} x2={x + size * 0.595} y2={baseY - size * 0.17}
            stroke={materials.wall} strokeWidth={0.8} />

      {/* Stone path */}
      {[0, 0.08, 0.16].map((off, i) => (
        <ellipse key={i} cx={x + size * (0.45 + off * (i % 2 === 0 ? 1 : -0.5))} cy={baseY + size * (0.02 + i * 0.03)}
                 rx={size * 0.04} ry={size * 0.02} fill="#808080" opacity={0.6} />
      ))}
    </g>
  );

  // ===== SOUTH ASIAN DHARAMSHALA =====
  const renderDharamshala = () => (
    <g>
      <ellipse cx={x + cx} cy={baseY + size * 0.02} rx={size * 0.42} ry={size * 0.1} fill="rgba(0,0,0,0.2)" />

      {/* Main building with verandah */}
      <rect x={x + size * 0.12} y={baseY - size * 0.42} width={size * 0.66} height={size * 0.44}
            fill={materials.wall} stroke={materials.wallDark} strokeWidth={1} />

      {/* Verandah columns */}
      {[0.18, 0.35, 0.52, 0.69].map((xOff, i) => (
        <rect key={i} x={x + size * xOff} y={baseY - size * 0.35} width={size * 0.04} height={size * 0.37}
              fill={materials.wallLight} stroke={materials.wallDark} strokeWidth={0.5} />
      ))}

      {/* Verandah roof */}
      <rect x={x + size * 0.1} y={baseY - size * 0.38} width={size * 0.7} height={size * 0.05}
            fill={materials.wood} stroke={materials.woodDark} strokeWidth={0.5} />

      {/* Main roof with chajja (eave) */}
      <polygon points={`${x + size * 0.08},${baseY - size * 0.42} ${x + size * 0.45},${baseY - size * 0.6} ${x + size * 0.82},${baseY - size * 0.42}`}
               fill={materials.roof} stroke={materials.roofDark} strokeWidth={1} />

      {/* Decorative arches along verandah */}
      {[0.22, 0.39, 0.56].map((xOff, i) => (
        <path key={i} d={`M ${x + size * xOff} ${baseY - size * 0.08}
                         Q ${x + size * (xOff + 0.065)} ${baseY - size * 0.18} ${x + size * (xOff + 0.13)} ${baseY - size * 0.08}`}
              fill="none" stroke={materials.accent} strokeWidth={1} />
      ))}

      {/* Central doorway with pointed arch */}
      <path d={`M ${x + size * 0.38} ${baseY - size * 0.02}
                L ${x + size * 0.38} ${baseY - size * 0.25}
                Q ${x + size * 0.45} ${baseY - size * 0.32} ${x + size * 0.52} ${baseY - size * 0.25}
                L ${x + size * 0.52} ${baseY - size * 0.02} Z`}
            fill={materials.woodDark} />

      {/* Jali (lattice) windows */}
      {[0.2, 0.62].map((xOff, i) => (
        <g key={i}>
          <rect x={x + size * xOff} y={baseY - size * 0.32} width={size * 0.1} height={size * 0.12}
                fill={windowGlow ? '#FFD700' : materials.wallDark} opacity={windowGlow ? 0.5 : 0.6} />
          {/* Simple jali pattern */}
          <line x1={x + size * (xOff + 0.05)} y1={baseY - size * 0.32} x2={x + size * (xOff + 0.05)} y2={baseY - size * 0.2}
                stroke={materials.wall} strokeWidth={0.5} />
        </g>
      ))}

      {/* Oil lamp (diya) at entrance */}
      {nightIntensity > 0.2 && (
        <circle cx={x + size * 0.45} cy={baseY - size * 0.05} r={size * 0.02}
                fill="#FF6B35" opacity={0.8}>
          <animate attributeName="opacity" values="0.6;0.9;0.6" dur="1.8s" repeatCount="indefinite" />
        </circle>
      )}
    </g>
  );

  // ===== INCA TAMBO =====
  const renderTambo = () => (
    <g>
      <ellipse cx={x + cx} cy={baseY + size * 0.02} rx={size * 0.38} ry={size * 0.1} fill="rgba(0,0,0,0.2)" />

      {/* Stone walls (fitted masonry) */}
      <rect x={x + size * 0.18} y={baseY - size * 0.4} width={size * 0.54} height={size * 0.42}
            fill={materials.wall} stroke={materials.wallDark} strokeWidth={1.5} />

      {/* Stone texture lines */}
      {[0.1, 0.2, 0.3].map((yOff, i) => (
        <line key={i} x1={x + size * 0.18} y1={baseY - size * yOff} x2={x + size * 0.72} y2={baseY - size * yOff}
              stroke={materials.wallDark} strokeWidth={0.5} opacity={0.5} />
      ))}

      {/* Trapezoidal doorway (classic Inca) */}
      <polygon points={`
        ${x + size * 0.38},${baseY - size * 0.02}
        ${x + size * 0.4},${baseY - size * 0.28}
        ${x + size * 0.52},${baseY - size * 0.28}
        ${x + size * 0.54},${baseY - size * 0.02}
      `} fill={materials.woodDark} />

      {/* Thatched roof */}
      <polygon points={`${x + size * 0.12},${baseY - size * 0.4} ${x + size * 0.45},${baseY - size * 0.65} ${x + size * 0.78},${baseY - size * 0.4}`}
               fill={materials.roof} stroke={materials.roofDark} strokeWidth={1} />

      {/* Thatch texture */}
      {Array.from({ length: 4 }).map((_, i) => (
        <line key={i} x1={x + size * (0.25 + i * 0.12)} y1={baseY - size * 0.4}
              x2={x + size * 0.45} y2={baseY - size * 0.6}
              stroke={materials.roofDark} strokeWidth={0.5} opacity={0.4} />
      ))}

      {/* Niches in wall (typical Inca feature) */}
      {[0.24, 0.58].map((xOff, i) => (
        <rect key={i} x={x + size * xOff} y={baseY - size * 0.32} width={size * 0.08} height={size * 0.1}
              fill={materials.wallDark} opacity={0.5} />
      ))}

      {/* Stone lintel above door */}
      <rect x={x + size * 0.36} y={baseY - size * 0.3} width={size * 0.2} height={size * 0.04}
            fill={materials.wallLight} stroke={materials.wallDark} strokeWidth={0.5} />
    </g>
  );

  // ===== AFRICAN TRADING POST =====
  const renderTradingPost = () => (
    <g>
      <ellipse cx={x + cx} cy={baseY + size * 0.02} rx={size * 0.4} ry={size * 0.1} fill="rgba(0,0,0,0.15)" />

      {/* Main round hut */}
      <ellipse cx={x + size * 0.35} cy={baseY - size * 0.15} rx={size * 0.2} ry={size * 0.12}
               fill={materials.wall} stroke={materials.wallDark} strokeWidth={1} />

      {/* Conical thatched roof */}
      <polygon points={`${x + size * 0.12},${baseY - size * 0.15} ${x + size * 0.35},${baseY - size * 0.55} ${x + size * 0.58},${baseY - size * 0.15}`}
               fill={materials.roof} stroke={materials.roofDark} strokeWidth={1} />

      {/* Rectangular storage/trading shed */}
      <rect x={x + size * 0.5} y={baseY - size * 0.35} width={size * 0.35} height={size * 0.37}
            fill={materials.wall} stroke={materials.wallDark} strokeWidth={1} />

      {/* Lean-to roof */}
      <polygon points={`${x + size * 0.48},${baseY - size * 0.35} ${x + size * 0.48},${baseY - size * 0.45} ${x + size * 0.88},${baseY - size * 0.35}`}
               fill={materials.roof} stroke={materials.roofDark} strokeWidth={1} />

      {/* Doorways */}
      <ellipse cx={x + size * 0.35} cy={baseY - size * 0.08} rx={size * 0.05} ry={size * 0.08}
               fill={materials.woodDark} />
      <rect x={x + size * 0.58} y={baseY - size * 0.25} width={size * 0.1} height={size * 0.27}
            fill={materials.woodDark} />

      {/* Shade pavilion/awning */}
      <line x1={x + size * 0.5} y1={baseY - size * 0.2} x2={x + size * 0.75} y2={baseY - size * 0.2}
            stroke={materials.wood} strokeWidth={2} />
      <line x1={x + size * 0.5} y1={baseY - size * 0.2} x2={x + size * 0.5} y2={baseY - size * 0.02}
            stroke={materials.wood} strokeWidth={2} />
      <line x1={x + size * 0.75} y1={baseY - size * 0.2} x2={x + size * 0.75} y2={baseY - size * 0.02}
            stroke={materials.wood} strokeWidth={2} />

      {/* Decorative pattern on main hut */}
      <path d={`M ${x + size * 0.22} ${baseY - size * 0.18}
                L ${x + size * 0.28} ${baseY - size * 0.22}
                L ${x + size * 0.34} ${baseY - size * 0.18}
                L ${x + size * 0.4} ${baseY - size * 0.22}
                L ${x + size * 0.46} ${baseY - size * 0.18}`}
            fill="none" stroke={materials.accent} strokeWidth={1} />

      {/* Fire pit with glow */}
      <ellipse cx={x + size * 0.62} cy={baseY - size * 0.02} rx={size * 0.05} ry={size * 0.025}
               fill="#8B4513" />
      {nightIntensity > 0.1 && (
        <circle cx={x + size * 0.62} cy={baseY - size * 0.05} r={size * 0.03}
                fill="#FF6B35" opacity={0.7}>
          <animate attributeName="opacity" values="0.5;0.8;0.5" dur="1.5s" repeatCount="indefinite" />
        </circle>
      )}
    </g>
  );

  // ===== OCEANIA GUEST HOUSE =====
  const renderGuestHouse = () => (
    <g>
      <ellipse cx={x + cx} cy={baseY + size * 0.02} rx={size * 0.38} ry={size * 0.1} fill="rgba(0,0,0,0.15)" />

      {/* Raised platform (posts) */}
      {[0.22, 0.42, 0.62].map((xOff, i) => (
        <rect key={i} x={x + size * xOff} y={baseY - size * 0.15} width={size * 0.04} height={size * 0.17}
              fill={materials.wood} stroke={materials.woodDark} strokeWidth={0.5} />
      ))}

      {/* Platform floor */}
      <rect x={x + size * 0.18} y={baseY - size * 0.18} width={size * 0.52} height={size * 0.05}
            fill={materials.wood} stroke={materials.woodDark} strokeWidth={0.8} />

      {/* Main structure (woven walls) */}
      <rect x={x + size * 0.2} y={baseY - size * 0.45} width={size * 0.48} height={size * 0.28}
            fill={materials.wall} stroke={materials.wallDark} strokeWidth={1} />

      {/* Woven pattern texture */}
      {Array.from({ length: 3 }).map((_, i) => (
        <line key={i} x1={x + size * 0.2} y1={baseY - size * (0.25 + i * 0.08)}
              x2={x + size * 0.68} y2={baseY - size * (0.25 + i * 0.08)}
              stroke={materials.wallDark} strokeWidth={0.5} opacity={0.4} />
      ))}

      {/* Large thatched roof with overhangs */}
      <polygon points={`
        ${x + size * 0.1},${baseY - size * 0.45}
        ${x + size * 0.44},${baseY - size * 0.72}
        ${x + size * 0.78},${baseY - size * 0.45}
      `} fill={materials.roof} stroke={materials.roofDark} strokeWidth={1} />

      {/* Roof edge details */}
      <line x1={x + size * 0.1} y1={baseY - size * 0.45} x2={x + size * 0.1} y2={baseY - size * 0.4}
            stroke={materials.roofDark} strokeWidth={1} />
      <line x1={x + size * 0.78} y1={baseY - size * 0.45} x2={x + size * 0.78} y2={baseY - size * 0.4}
            stroke={materials.roofDark} strokeWidth={1} />

      {/* Entrance opening */}
      <rect x={x + size * 0.38} y={baseY - size * 0.4} width={size * 0.12} height={size * 0.22}
            fill={materials.woodDark} opacity={0.7} />

      {/* Decorative carvings at entrance */}
      <rect x={x + size * 0.36} y={baseY - size * 0.42} width={size * 0.16} height={size * 0.03}
            fill={materials.accent} />

      {/* Torch/flame */}
      {nightIntensity > 0.2 && (
        <g>
          <rect x={x + size * 0.72} y={baseY - size * 0.35} width={size * 0.02} height={size * 0.15}
                fill={materials.wood} />
          <circle cx={x + size * 0.73} cy={baseY - size * 0.38} r={size * 0.025}
                  fill="#FF6B35" opacity={0.8}>
            <animate attributeName="opacity" values="0.6;0.9;0.6" dur="1.2s" repeatCount="indefinite" />
          </circle>
        </g>
      )}
    </g>
  );

  // ===== POSTING INN (European Renaissance) =====
  const renderPostingInn = () => (
    <g>
      <ellipse cx={x + cx} cy={baseY + size * 0.02} rx={size * 0.45} ry={size * 0.1} fill="rgba(0,0,0,0.2)" />

      {/* Main building - larger than tavern */}
      <rect x={x + size * 0.1} y={baseY - size * 0.55} width={size * 0.6} height={size * 0.57}
            fill={materials.wall} stroke={materials.wallDark} strokeWidth={1} />

      {/* Second floor overhang */}
      <rect x={x + size * 0.08} y={baseY - size * 0.55} width={size * 0.64} height={size * 0.03}
            fill={materials.wood} />

      {/* Steep roof */}
      <polygon points={`${x + size * 0.05},${baseY - size * 0.55} ${x + size * 0.4},${baseY - size * 0.8} ${x + size * 0.75},${baseY - size * 0.55}`}
               fill={materials.roof} stroke={materials.roofDark} strokeWidth={1} />

      {/* Dormer window */}
      <rect x={x + size * 0.35} y={baseY - size * 0.68} width={size * 0.1} height={size * 0.1}
            fill={materials.wall} stroke={materials.wallDark} strokeWidth={0.5} />
      <polygon points={`${x + size * 0.33},${baseY - size * 0.68} ${x + size * 0.4},${baseY - size * 0.75} ${x + size * 0.47},${baseY - size * 0.68}`}
               fill={materials.roof} />

      {/* Multiple windows */}
      {[0.15, 0.35, 0.55].map((xOff, row) => (
        [0.25, 0.45].map((yOff, col) => (
          <rect key={`${row}-${col}`} x={x + size * xOff} y={baseY - size * yOff}
                width={size * 0.08} height={size * 0.1}
                fill={windowGlow ? '#FFD700' : materials.window}
                stroke={materials.wood} strokeWidth={0.5}
                opacity={windowGlow ? 0.8 : 1} />
        ))
      ))}

      {/* Carriage entrance arch */}
      <path d={`M ${x + size * 0.7} ${baseY}
                L ${x + size * 0.7} ${baseY - size * 0.3}
                A ${size * 0.1} ${size * 0.1} 0 0 1 ${x + size * 0.9} ${baseY - size * 0.3}
                L ${x + size * 0.9} ${baseY}`}
            fill={materials.wallDark} opacity={0.7} />

      {/* Stable wing */}
      <rect x={x + size * 0.7} y={baseY - size * 0.35} width={size * 0.22} height={size * 0.37}
            fill={materials.wallLight} stroke={materials.wallDark} strokeWidth={0.8} />

      {/* Coach lamp */}
      {nightIntensity > 0.2 && (
        <circle cx={x + size * 0.68} cy={baseY - size * 0.35} r={size * 0.025}
                fill="#FFD700" opacity={0.8}>
          <animate attributeName="opacity" values="0.6;0.9;0.6" dur="2s" repeatCount="indefinite" />
        </circle>
      )}

      {/* Chimney with smoke */}
      <rect x={x + size * 0.55} y={baseY - size * 0.78} width={size * 0.08} height={size * 0.15}
            fill={materials.wallDark} />
      <circle cx={x + size * 0.59} cy={baseY - size * 0.8} r={size * 0.02} fill="#888" opacity={0.3}>
        <animate attributeName="cy" from={baseY - size * 0.8} to={baseY - size * 0.95} dur="3s" repeatCount="indefinite" />
        <animate attributeName="opacity" from="0.3" to="0" dur="3s" repeatCount="indefinite" />
      </circle>
    </g>
  );

  // ===== CHINESE KEZHAN =====
  const renderKezhan = () => (
    <g>
      <ellipse cx={x + cx} cy={baseY + size * 0.02} rx={size * 0.42} ry={size * 0.1} fill="rgba(0,0,0,0.15)" />

      {/* Courtyard walls */}
      <rect x={x + size * 0.1} y={baseY - size * 0.1} width={size * 0.7} height={size * 0.12}
            fill={materials.wallDark} stroke={materials.wall} strokeWidth={0.8} />

      {/* Main building */}
      <rect x={x + size * 0.15} y={baseY - size * 0.45} width={size * 0.6} height={size * 0.38}
            fill={materials.wall} stroke={materials.wallDark} strokeWidth={1} />

      {/* Curved roof with upturned eaves */}
      <path d={`M ${x + size * 0.08} ${baseY - size * 0.45}
                Q ${x + size * 0.15} ${baseY - size * 0.55} ${x + size * 0.45} ${baseY - size * 0.65}
                Q ${x + size * 0.75} ${baseY - size * 0.55} ${x + size * 0.82} ${baseY - size * 0.45}
                L ${x + size * 0.75} ${baseY - size * 0.45}
                Q ${x + size * 0.45} ${baseY - size * 0.55} ${x + size * 0.15} ${baseY - size * 0.45} Z`}
            fill={materials.roof} stroke={materials.roofDark} strokeWidth={1} />

      {/* Roof ridge with ornaments */}
      <line x1={x + size * 0.25} y1={baseY - size * 0.58} x2={x + size * 0.65} y2={baseY - size * 0.58}
            stroke={materials.roofDark} strokeWidth={1.5} />
      <circle cx={x + size * 0.45} cy={baseY - size * 0.62} r={size * 0.025} fill={materials.accent} />

      {/* Central doorway */}
      <rect x={x + size * 0.38} y={baseY - size * 0.35} width={size * 0.14} height={size * 0.28}
            fill={materials.woodDark} />
      {/* Door frame */}
      <rect x={x + size * 0.36} y={baseY - size * 0.38} width={size * 0.18} height={size * 0.04}
            fill={materials.accent} />

      {/* Lattice windows */}
      {[0.2, 0.58].map((xOff, i) => (
        <g key={i}>
          <rect x={x + size * xOff} y={baseY - size * 0.38} width={size * 0.12} height={size * 0.15}
                fill={windowGlow ? '#FFE4B5' : materials.wall} stroke={materials.wood} strokeWidth={0.8} />
          {/* Lattice pattern */}
          <line x1={x + size * (xOff + 0.06)} y1={baseY - size * 0.38} x2={x + size * (xOff + 0.06)} y2={baseY - size * 0.23}
                stroke={materials.wood} strokeWidth={0.5} />
          <line x1={x + size * xOff} y1={baseY - size * 0.305} x2={x + size * (xOff + 0.12)} y2={baseY - size * 0.305}
                stroke={materials.wood} strokeWidth={0.5} />
        </g>
      ))}

      {/* Red lanterns */}
      {[0.25, 0.65].map((xOff, i) => (
        <g key={i}>
          <ellipse cx={x + size * xOff} cy={baseY - size * 0.48} rx={size * 0.03} ry={size * 0.045}
                   fill={materials.accent} stroke="#8B0000" strokeWidth={0.5} />
          {nightIntensity > 0.2 && (
            <ellipse cx={x + size * xOff} cy={baseY - size * 0.48} rx={size * 0.05} ry={size * 0.06}
                     fill="#FF6B35" opacity={0.3}>
              <animate attributeName="opacity" values="0.2;0.4;0.2" dur="2s" repeatCount="indefinite" />
            </ellipse>
          )}
        </g>
      ))}

      {/* Courtyard entrance gate */}
      <rect x={x + size * 0.4} y={baseY - size * 0.1} width={size * 0.1} height={size * 0.12}
            fill={materials.woodDark} />
    </g>
  );

  // Select renderer based on type
  const renderFeature = () => {
    switch (type) {
      case 'caravanserai':
      case 'khan':
      case 'funduq':
      case 'ribat':
        return renderCaravanserai();
      case 'ryokan':
      case 'shukubo':
        return renderRyokan();
      case 'kezhan':
      case 'hanok':
        return renderKezhan();
      case 'dharamshala':
      case 'serai':
      case 'choultry':
      case 'dak_bungalow':
        return renderDharamshala();
      case 'tambo':
        return renderTambo();
      case 'trading_post':
      case 'rest_shelter':
        return renderTradingPost();
      case 'guest_house':
      case 'longhouse_inn':
        return renderGuestHouse();
      case 'posting_inn':
      case 'railway_hotel':
        return renderPostingInn();
      case 'tavern':
      case 'hospice':
      case 'posada':
      case 'roadhouse':
      default:
        return renderTavern();
    }
  };

  return (
    <svg x={x} y={y} width={size} height={size}
         viewBox={`0 0 ${size} ${size}`}
         style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={materials.wallLight} />
          <stop offset="50%" stopColor={materials.wall} />
          <stop offset="100%" stopColor={materials.wallDark} />
        </linearGradient>
        <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g opacity={opacity}>
        {renderFeature()}
      </g>
    </svg>
  );
};

export default WaystationSymbol;

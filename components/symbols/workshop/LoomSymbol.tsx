/**
 * LoomSymbol.tsx - Weaving loom for textile production
 * Stardew Valley inspired dollhouse view
 */
import React from 'react';

interface LoomSymbolProps {
  x: number;
  y: number;
  size: number;
  culturalZone?: string;
  era?: number;
  hasCloth?: boolean;
  opacity?: number;
}

const LoomSymbol: React.FC<LoomSymbolProps> = ({
  x,
  y,
  size,
  culturalZone = 'EUROPEAN',
  era = 1500,
  hasCloth = true,
  opacity = 1.0
}) => {
  // Get materials/colors based on culture
  const getMaterials = () => {
    // Base materials
    const base = {
      frame: '#654321',
      frameLight: '#8B5A3C',
      frameDark: '#4A3020',
      thread: '#F5DEB3',
      cloth: '#DEB887',
      shuttle: '#8B4513',
      metal: '#4A4A4A'
    };

    // Cultural fabric colors
    switch (culturalZone?.toUpperCase()) {
      case 'EAST_ASIAN':
        return {
          ...base,
          frame: '#5C4033',
          frameLight: '#704214',
          cloth: '#FFE4E1', // Silk color
          pattern: '#DC143C' // Red pattern
        };
      case 'SOUTH_ASIAN':
        return {
          ...base,
          cloth: '#FF6347', // Sari colors
          pattern: '#FFD700' // Gold pattern
        };
      case 'MENA':
        return {
          ...base,
          cloth: '#4169E1', // Blue cloth
          pattern: '#FFD700' // Gold pattern
        };
      case 'SUB_SAHARAN_AFRICAN':
        return {
          ...base,
          cloth: '#8B4513', // Kente colors
          pattern: '#FFD700',
          pattern2: '#228B22' // Green accent
        };
      case 'SOUTH_AMERICAN':
        return {
          ...base,
          cloth: '#DC143C', // Bright textile
          pattern: '#FFD700',
          pattern2: '#4169E1' // Blue accent
        };
      default:
        return {
          ...base,
          cloth: '#8B7D6B', // European wool
          pattern: '#696969'
        };
    }
  };

  const materials = getMaterials();

  // Loom style based on culture and era
  const getLoomStyle = () => {
    if (era < 0) {
      return 'primitive'; // Simple frame loom
    } else if (culturalZone === 'EAST_ASIAN') {
      return 'asian'; // Asian style loom
    } else if (culturalZone === 'SUB_SAHARAN_AFRICAN') {
      return 'african'; // African strip loom
    } else if (era > 1700) {
      return 'industrial'; // More complex loom
    }
    return 'traditional';
  };

  const style = getLoomStyle();

  const renderLoom = () => {
    return (
      <g>
        {/* Frame - vertical posts */}
        <rect
          x={size * 0.15}
          y={size * 0.2}
          width={size * 0.05}
          height={size * 0.65}
          fill={materials.frame}
        />
        <rect
          x={size * 0.8}
          y={size * 0.2}
          width={size * 0.05}
          height={size * 0.65}
          fill={materials.frame}
        />

        {/* Frame - horizontal beams */}
        <rect
          x={size * 0.15}
          y={size * 0.2}
          width={size * 0.7}
          height={size * 0.04}
          fill={materials.frameLight}
        />
        <rect
          x={size * 0.15}
          y={size * 0.8}
          width={size * 0.7}
          height={size * 0.04}
          fill={materials.frameLight}
        />

        {/* Warp beam (top roller) */}
        <rect
          x={size * 0.2}
          y={size * 0.25}
          width={size * 0.6}
          height={size * 0.06}
          fill={materials.frameDark}
          rx={size * 0.03}
        />

        {/* Cloth beam (bottom roller) */}
        <rect
          x={size * 0.2}
          y={size * 0.72}
          width={size * 0.6}
          height={size * 0.06}
          fill={materials.frameDark}
          rx={size * 0.03}
        />

        {/* Warp threads (vertical) */}
        {[...Array(12)].map((_, i) => (
          <line
            key={`warp-${i}`}
            x1={size * (0.25 + i * 0.04)}
            y1={size * 0.31}
            x2={size * (0.25 + i * 0.04)}
            y2={size * 0.72}
            stroke={materials.thread}
            strokeWidth={0.5}
            opacity={0.7}
          />
        ))}

        {/* Cloth being woven (if present) */}
        {hasCloth && (
          <>
            {/* Main cloth */}
            <rect
              x={size * 0.25}
              y={size * 0.45}
              width={size * 0.5}
              height={size * 0.27}
              fill={materials.cloth}
            />

            {/* Pattern based on culture */}
            {culturalZone === 'SUB_SAHARAN_AFRICAN' && (
              // Kente-style stripes
              <>
                {[0.47, 0.52, 0.57, 0.62, 0.67].map((yPos, i) => (
                  <rect
                    key={`stripe-${i}`}
                    x={size * 0.25}
                    y={size * yPos}
                    width={size * 0.5}
                    height={size * 0.02}
                    fill={i % 2 === 0 ? materials.pattern : materials.pattern2}
                  />
                ))}
              </>
            )}

            {culturalZone === 'MENA' && (
              // Geometric pattern
              <>
                {[0.3, 0.4, 0.5, 0.6, 0.7].map((xPos, i) => (
                  <rect
                    key={`pattern-${i}`}
                    x={size * xPos}
                    y={size * 0.5}
                    width={size * 0.02}
                    height={size * 0.17}
                    fill={materials.pattern}
                    opacity={0.5}
                  />
                ))}
              </>
            )}

            {culturalZone === 'EAST_ASIAN' && (
              // Delicate pattern
              <g opacity={0.3}>
                <circle cx={size * 0.5} cy={size * 0.58} r={size * 0.05} fill="none" stroke={materials.pattern} strokeWidth={0.5} />
                <circle cx={size * 0.35} cy={size * 0.55} r={size * 0.03} fill="none" stroke={materials.pattern} strokeWidth={0.5} />
                <circle cx={size * 0.65} cy={size * 0.55} r={size * 0.03} fill="none" stroke={materials.pattern} strokeWidth={0.5} />
              </g>
            )}
          </>
        )}

        {/* Heddles (thread separators) */}
        <rect
          x={size * 0.2}
          y={size * 0.4}
          width={size * 0.6}
          height={size * 0.02}
          fill={materials.metal}
        />
        <rect
          x={size * 0.2}
          y={size * 0.42}
          width={size * 0.6}
          height={size * 0.02}
          fill={materials.metal}
        />

        {/* Reed/beater bar */}
        <rect
          x={size * 0.2}
          y={size * 0.38}
          width={size * 0.6}
          height={size * 0.015}
          fill={materials.frameDark}
        />

        {/* Shuttle */}
        <g transform={`translate(${size * 0.4}, ${size * 0.45})`}>
          <ellipse cx={0} cy={0} rx={size * 0.08} ry={size * 0.02} fill={materials.shuttle} />
          <rect x={-size * 0.06} y={-size * 0.01} width={size * 0.12} height={size * 0.02} fill={materials.thread} opacity={0.7} />
        </g>

        {/* Treadles (foot pedals) */}
        <rect
          x={size * 0.35}
          y={size * 0.85}
          width={size * 0.1}
          height={size * 0.02}
          fill={materials.frame}
        />
        <rect
          x={size * 0.55}
          y={size * 0.85}
          width={size * 0.1}
          height={size * 0.02}
          fill={materials.frame}
        />

        {/* Connecting cords to treadles */}
        <line
          x1={size * 0.4}
          y1={size * 0.85}
          x2={size * 0.4}
          y2={size * 0.4}
          stroke={materials.thread}
          strokeWidth={0.5}
        />
        <line
          x1={size * 0.6}
          y1={size * 0.85}
          x2={size * 0.6}
          y2={size * 0.42}
          stroke={materials.thread}
          strokeWidth={0.5}
        />

        {/* Bench */}
        <rect
          x={size * 0.3}
          y={size * 0.75}
          width={size * 0.4}
          height={size * 0.03}
          fill={materials.frame}
        />

        {/* Industrial additions */}
        {style === 'industrial' && era > 1700 && (
          <>
            {/* Flying shuttle mechanism */}
            <rect
              x={size * 0.18}
              y={size * 0.45}
              width={size * 0.02}
              height={size * 0.1}
              fill={materials.metal}
            />
            <rect
              x={size * 0.8}
              y={size * 0.45}
              width={size * 0.02}
              height={size * 0.1}
              fill={materials.metal}
            />
          </>
        )}

        {/* Shadow */}
        <ellipse
          cx={size * 0.5}
          cy={size * 0.9}
          rx={size * 0.4}
          ry={size * 0.08}
          fill="black"
          opacity={0.35}
        />

        {/* Highlights */}
        <rect
          x={size * 0.15}
          y={size * 0.2}
          width={size * 0.03}
          height={size * 0.4}
          fill="white"
          opacity={0.1}
        />
        <rect
          x={size * 0.2}
          y={size * 0.25}
          width={size * 0.58}
          height={size * 0.02}
          fill="white"
          opacity={0.15}
        />
      </g>
    );
  };

  return (
    <svg
      x={x}
      y={y}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ overflow: 'visible' }}
    >
      <g opacity={opacity}>
        {renderLoom()}
      </g>
    </svg>
  );
};

export default LoomSymbol;
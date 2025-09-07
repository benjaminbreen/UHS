/**
 * PillarOverlay.tsx - Rich Stardew Valley/FF6 style architectural pillar
 * Detailed stone/marble textures with proper depth and cultural variations
 */
import React from 'react';
import { getPixelColors, PIXEL_SHADOWS, MATERIAL_COLORS } from '../PixelArtStyleGuide';

interface PillarOverlayProps {
  x: number;
  y: number;
  size: number;
  culturalZone?: string;
  rotation?: number;
  isTop?: boolean; // For multi-tile pillars
}

const PillarOverlay: React.FC<PillarOverlayProps> = ({ 
  x, 
  y, 
  size,
  culturalZone = 'EUROPEAN',
  rotation = 0,
  isTop = false
}) => {
  const getPillarStyle = () => {
    switch (culturalZone) {
      case 'EUROPEAN':
        return {
          colors: MATERIAL_COLORS.stone.marble,
          accent: '#FFD700', // Gold capitals
          texture: 'marble',
          hasFluting: true,
          capitalStyle: 'corinthian'
        };
      case 'EAST_ASIAN':
        return {
          colors: getPixelColors('#8B4513'), // Lacquered wood
          accent: '#DC143C', // Red accents
          texture: 'wood',
          hasFluting: false,
          capitalStyle: 'bracket'
        };
      case 'MENA':
        return {
          colors: MATERIAL_COLORS.stone.sandstone,
          accent: '#4169E1', // Blue tile accents
          texture: 'sandstone',
          hasFluting: false,
          capitalStyle: 'geometric'
        };
      case 'SOUTH_ASIAN':
        return {
          colors: getPixelColors('#CD853F'), // Red sandstone
          accent: '#FFD700', // Gold details
          texture: 'carved',
          hasFluting: false,
          capitalStyle: 'lotus'
        };
      case 'MESOAMERICAN':
        return {
          colors: MATERIAL_COLORS.stone.limestone,
          accent: '#228B22', // Jade green
          texture: 'stepped',
          hasFluting: false,
          capitalStyle: 'stepped'
        };
      default:
        return {
          colors: MATERIAL_COLORS.stone.granite,
          accent: '#808080',
          texture: 'plain',
          hasFluting: false,
          capitalStyle: 'simple'
        };
    }
  };
  
  const style = getPillarStyle();
  
  // Render stone texture pattern
  const renderTexture = () => {
    if (style.texture === 'marble') {
      return (
        <g opacity={0.3}>
          {/* Marble veins */}
          <path d={`M ${size * 0.38} ${size * 0.3} Q ${size * 0.45} ${size * 0.4} ${size * 0.42} ${size * 0.5}`} 
                stroke={style.colors.light} strokeWidth={0.5} fill="none" />
          <path d={`M ${size * 0.6} ${size * 0.35} Q ${size * 0.55} ${size * 0.45} ${size * 0.58} ${size * 0.55}`} 
                stroke={style.colors.light} strokeWidth={0.5} fill="none" />
        </g>
      );
    } else if (style.texture === 'sandstone') {
      return (
        <g opacity={0.2}>
          {/* Sandstone grains */}
          {[0.4, 0.45, 0.5, 0.55, 0.6].map((y, i) => (
            <rect key={i} x={size * 0.37} y={size * y} width={size * 0.26} height={1} fill={style.colors.dark} />
          ))}
        </g>
      );
    } else if (style.texture === 'wood') {
      return (
        <g opacity={0.4}>
          {/* Wood grain */}
          <rect x={size * 0.37} y={size * 0.2} width={size * 0.02} height={size * 0.6} fill={style.colors.dark} />
          <rect x={size * 0.42} y={size * 0.2} width={size * 0.01} height={size * 0.6} fill={style.colors.dark} />
          <rect x={size * 0.47} y={size * 0.2} width={size * 0.02} height={size * 0.6} fill={style.colors.dark} />
          <rect x={size * 0.52} y={size * 0.2} width={size * 0.01} height={size * 0.6} fill={style.colors.dark} />
          <rect x={size * 0.57} y={size * 0.2} width={size * 0.02} height={size * 0.6} fill={style.colors.dark} />
        </g>
      );
    }
    return null;
  };
  
  // Render capital decoration
  const renderCapital = () => {
    switch (style.capitalStyle) {
      case 'corinthian':
        return (
          <g>
            {/* Acanthus leaves pattern */}
            <path d={`M ${size * 0.32} ${size * 0.18} Q ${size * 0.35} ${size * 0.15} ${size * 0.38} ${size * 0.18}`} 
                  fill={style.accent} opacity={0.7} />
            <path d={`M ${size * 0.62} ${size * 0.18} Q ${size * 0.65} ${size * 0.15} ${size * 0.68} ${size * 0.18}`} 
                  fill={style.accent} opacity={0.7} />
            <circle cx={size * 0.5} cy={size * 0.16} r={size * 0.02} fill={style.accent} />
          </g>
        );
      case 'bracket':
        return (
          <g>
            {/* Chinese bracket system */}
            <rect x={size * 0.3} y={size * 0.16} width={size * 0.4} height={size * 0.02} fill={style.accent} />
            <rect x={size * 0.32} y={size * 0.14} width={size * 0.36} height={size * 0.02} fill={style.accent} />
          </g>
        );
      case 'geometric':
        return (
          <g>
            {/* Islamic geometric pattern */}
            <rect x={size * 0.35} y={size * 0.16} width={size * 0.3} height={size * 0.02} fill={style.accent} />
            {[0, 1, 2, 3].map(i => (
              <rect key={i} x={size * (0.38 + i * 0.06)} y={size * 0.14} 
                    width={size * 0.03} height={size * 0.02} fill={style.accent} />
            ))}
          </g>
        );
      case 'lotus':
        return (
          <g>
            {/* Lotus petal capital */}
            <ellipse cx={size * 0.5} cy={size * 0.16} rx={size * 0.18} ry={size * 0.03} fill={style.accent} opacity={0.7} />
            <circle cx={size * 0.5} cy={size * 0.14} r={size * 0.03} fill={style.accent} />
          </g>
        );
      default:
        return (
          <rect x={size * 0.32} y={size * 0.16} width={size * 0.36} height={size * 0.03} fill={style.colors.dark} />
        );
    }
  };
  
  return (
    <g transform={`translate(${x}, ${y}) rotate(${rotation} ${size/2} ${size/2})`}>
      {/* Enhanced shadow with gradient */}
      <defs>
        <radialGradient id={`pillar-shadow-${x}-${y}`}>
          <stop offset="0%" stopColor="#000000" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.15" />
        </radialGradient>
      </defs>
      
      <ellipse 
        cx={size * 0.54} 
        cy={size * 0.88} 
        rx={size * 0.22} 
        ry={size * 0.08} 
        fill={`url(#pillar-shadow-${x}-${y})`}
      />
      
      {isTop ? (
        <g filter={PIXEL_SHADOWS.hard}>
          {/* Capital platform */}
          <rect 
            x={size * 0.28} 
            y={size * 0.12} 
            width={size * 0.44} 
            height={size * 0.06} 
            fill={style.colors.base}
          />
          <rect 
            x={size * 0.28} 
            y={size * 0.12} 
            width={size * 0.44} 
            height={size * 0.02} 
            fill={style.colors.light}
            opacity={0.6}
          />
          
          {/* Capital decoration */}
          {renderCapital()}
          
          {/* Top shaft */}
          <rect 
            x={size * 0.32} 
            y={size * 0.18} 
            width={size * 0.36} 
            height={size * 0.7} 
            fill={style.colors.base}
          />
          
          {/* 3D depth - left highlight */}
          <rect 
            x={size * 0.32} 
            y={size * 0.18} 
            width={size * 0.06} 
            height={size * 0.7} 
            fill={style.colors.light}
            opacity={0.5}
          />
          
          {/* 3D depth - right shadow */}
          <rect 
            x={size * 0.62} 
            y={size * 0.18} 
            width={size * 0.06} 
            height={size * 0.7} 
            fill={style.colors.shadow}
            opacity={0.6}
          />
          
          {/* Top surface ellipse */}
          <ellipse 
            cx={size * 0.5} 
            cy={size * 0.18} 
            rx={size * 0.18} 
            ry={size * 0.05} 
            fill={style.colors.light}
          />
          <ellipse 
            cx={size * 0.5} 
            cy={size * 0.18} 
            rx={size * 0.15} 
            ry={size * 0.04} 
            fill={style.colors.base}
            opacity={0.8}
          />
          
          {/* Texture overlay */}
          {renderTexture()}
        </g>
      ) : (
        <g filter={PIXEL_SHADOWS.hard}>
          {/* Base platform */}
          <rect 
            x={size * 0.28} 
            y={size * 0.82} 
            width={size * 0.44} 
            height={size * 0.08} 
            fill={style.colors.shadow}
          />
          <rect 
            x={size * 0.28} 
            y={size * 0.82} 
            width={size * 0.44} 
            height={size * 0.03} 
            fill={style.colors.dark}
          />
          
          {/* Main shaft */}
          <rect 
            x={size * 0.32} 
            y={size * 0.1} 
            width={size * 0.36} 
            height={size * 0.72} 
            fill={style.colors.base}
          />
          
          {/* Fluting for classical columns */}
          {style.hasFluting && (
            <g opacity={0.3}>
              {[0.35, 0.41, 0.47, 0.53, 0.59, 0.65].map((x, i) => (
                <rect key={i} x={size * x} y={size * 0.1} width={size * 0.02} height={size * 0.72} fill={style.colors.shadow} />
              ))}
            </g>
          )}
          
          {/* 3D depth - left highlight */}
          <rect 
            x={size * 0.32} 
            y={size * 0.1} 
            width={size * 0.06} 
            height={size * 0.72} 
            fill={style.colors.light}
            opacity={0.5}
          />
          
          {/* 3D depth - right shadow */}
          <rect 
            x={size * 0.62} 
            y={size * 0.1} 
            width={size * 0.06} 
            height={size * 0.72} 
            fill={style.colors.shadow}
            opacity={0.6}
          />
          
          {/* Center highlight for cylindrical effect */}
          <rect 
            x={size * 0.46} 
            y={size * 0.1} 
            width={size * 0.08} 
            height={size * 0.72} 
            fill={style.colors.highlight}
            opacity={0.2}
          />
          
          {/* Bottom surface ellipse */}
          <ellipse 
            cx={size * 0.5} 
            cy={size * 0.82} 
            rx={size * 0.18} 
            ry={size * 0.05} 
            fill={style.colors.dark}
          />
          
          {/* Texture overlay */}
          {renderTexture()}
          
          {/* Carved details for certain cultures */}
          {style.texture === 'carved' && (
            <g opacity={0.5}>
              <circle cx={size * 0.5} cy={size * 0.3} r={size * 0.08} fill="none" stroke={style.accent} strokeWidth={1} />
              <circle cx={size * 0.5} cy={size * 0.5} r={size * 0.08} fill="none" stroke={style.accent} strokeWidth={1} />
              <circle cx={size * 0.5} cy={size * 0.7} r={size * 0.08} fill="none" stroke={style.accent} strokeWidth={1} />
            </g>
          )}
        </g>
      )}
    </g>
  );
};

export default PillarOverlay;
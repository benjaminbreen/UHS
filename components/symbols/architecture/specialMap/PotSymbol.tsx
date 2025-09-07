/**
 * PotSymbol.tsx - Beautiful Stardew Valley/FF6 style cooking pot or cauldron
 * Rich metallic textures, steam effects, cultural variations
 */
import React from 'react';
import { getPixelColors, PIXEL_SHADOWS, MATERIAL_COLORS } from '../../PixelArtStyleGuide';

interface PotSymbolProps {
  x: number;
  y: number;
  size: number;
  culturalZone?: string;
  variant?: 'cooking' | 'empty' | 'boiling' | 'ornamental';
}

export const PotSymbol: React.FC<PotSymbolProps> = ({ 
  x = 0, 
  y = 0, 
  size = 32,
  culturalZone = 'EUROPEAN',
  variant = 'cooking'
}) => {
  const getPotStyle = () => {
    switch (culturalZone) {
      case 'EAST_ASIAN':
        return {
          metal: getPixelColors('#2F4F4F'), // Cast iron wok style
          accent: getPixelColors('#8B4513'), // Wood handles
          liquid: '#8B7355', // Broth color
          steam: '#F5F5F5',
          shape: 'wok',
          hasLid: false,
          decoration: 'dragon'
        };
      case 'MENA':
        return {
          metal: MATERIAL_COLORS.metal.copper,
          accent: MATERIAL_COLORS.metal.brass,
          liquid: '#FF6347', // Tomato-based stew
          steam: '#FFFAFA',
          shape: 'tagine',
          hasLid: true,
          decoration: 'geometric'
        };
      case 'EUROPEAN':
        return {
          metal: MATERIAL_COLORS.metal.iron,
          accent: getPixelColors('#654321'), // Wood
          liquid: '#8B4513', // Brown stew
          steam: '#F0F8FF',
          shape: 'cauldron',
          hasLid: false,
          decoration: 'none'
        };
      case 'SOUTH_ASIAN':
        return {
          metal: MATERIAL_COLORS.metal.brass,
          accent: getPixelColors('#DC143C'), // Red handles
          liquid: '#FF8C00', // Curry color
          steam: '#FFFFF0',
          shape: 'karahi',
          hasLid: false,
          decoration: 'lotus'
        };
      case 'MESOAMERICAN':
        return {
          metal: getPixelColors('#8B4513'), // Clay
          accent: getPixelColors('#DC143C'), // Red patterns
          liquid: '#228B22', // Green sauce
          steam: '#F5FFFA',
          shape: 'clay',
          hasLid: false,
          decoration: 'aztec'
        };
      default:
        return {
          metal: MATERIAL_COLORS.metal.steel,
          accent: MATERIAL_COLORS.metal.iron,
          liquid: '#4682B4',
          steam: '#FFFFFF',
          shape: 'pot',
          hasLid: false,
          decoration: 'none'
        };
    }
  };
  
  const style = getPotStyle();
  
  const renderCauldron = () => (
    <g filter={PIXEL_SHADOWS.hard}>
      {/* Enhanced shadow */}
      <ellipse cx={size * 0.52} cy={size * 0.85} rx={size * 0.28} ry={size * 0.1} fill="#000000" opacity={0.3} />
      
      {/* Cauldron legs */}
      <rect x={size * 0.35} y={size * 0.7} width={size * 0.03} height={size * 0.15} fill={style.metal.dark} />
      <rect x={size * 0.62} y={size * 0.7} width={size * 0.03} height={size * 0.15} fill={style.metal.dark} />
      <rect x={size * 0.48} y={size * 0.7} width={size * 0.04} height={size * 0.12} fill={style.metal.shadow} />
      
      {/* Main pot body */}
      <ellipse cx={size * 0.5} cy={size * 0.65} rx={size * 0.25} ry={size * 0.28} fill={style.metal.base} />
      <ellipse cx={size * 0.5} cy={size * 0.65} rx={size * 0.23} ry={size * 0.26} fill={style.metal.dark} />
      
      {/* Metallic gradient overlay */}
      <defs>
        <radialGradient id={`pot-metal-${x}-${y}`}>
          <stop offset="0%" stopColor={style.metal.light} stopOpacity="0.6" />
          <stop offset="50%" stopColor={style.metal.base} stopOpacity="0.3" />
          <stop offset="100%" stopColor={style.metal.shadow} stopOpacity="0.5" />
        </radialGradient>
      </defs>
      
      <ellipse cx={size * 0.5} cy={size * 0.65} rx={size * 0.23} ry={size * 0.26} fill={`url(#pot-metal-${x}-${y})`} />
      
      {/* Rim */}
      <ellipse cx={size * 0.5} cy={size * 0.45} rx={size * 0.24} ry={size * 0.08} fill={style.metal.dark} />
      <ellipse cx={size * 0.5} cy={size * 0.44} rx={size * 0.22} ry={size * 0.07} fill={style.metal.base} />
      <ellipse cx={size * 0.5} cy={size * 0.43} rx={size * 0.2} ry={size * 0.06} fill={style.metal.light} />
      
      {/* Handles */}
      <ellipse cx={size * 0.25} cy={size * 0.5} rx={size * 0.04} ry={size * 0.06} fill="none" stroke={style.metal.dark} strokeWidth={3} />
      <ellipse cx={size * 0.75} cy={size * 0.5} rx={size * 0.04} ry={size * 0.06} fill="none" stroke={style.metal.dark} strokeWidth={3} />
      
      {/* Contents if cooking */}
      {(variant === 'cooking' || variant === 'boiling') && (
        <>
          <ellipse cx={size * 0.5} cy={size * 0.45} rx={size * 0.18} ry={size * 0.05} fill={style.liquid} />
          <ellipse cx={size * 0.5} cy={size * 0.44} rx={size * 0.16} ry={size * 0.04} fill={style.liquid} opacity={0.8} />
          
          {/* Bubbles for boiling */}
          {variant === 'boiling' && (
            <>
              <circle cx={size * 0.45} cy={size * 0.44} r={size * 0.015} fill={style.steam} opacity={0.6} />
              <circle cx={size * 0.55} cy={size * 0.43} r={size * 0.01} fill={style.steam} opacity={0.6} />
              <circle cx={size * 0.48} cy={size * 0.45} r={size * 0.012} fill={style.steam} opacity={0.6} />
            </>
          )}
        </>
      )}
      
      {/* Steam effect */}
      {(variant === 'cooking' || variant === 'boiling') && (
        <g opacity={0.4}>
          <ellipse cx={size * 0.48} cy={size * 0.35} rx={size * 0.03} ry={size * 0.05} fill={style.steam} />
          <ellipse cx={size * 0.52} cy={size * 0.32} rx={size * 0.025} ry={size * 0.04} fill={style.steam} />
          <ellipse cx={size * 0.5} cy={size * 0.28} rx={size * 0.04} ry={size * 0.06} fill={style.steam} />
        </g>
      )}
      
      {/* Decorative band */}
      {style.decoration !== 'none' && (
        <rect x={size * 0.3} y={size * 0.58} width={size * 0.4} height={size * 0.03} fill={style.accent.base} opacity={0.6} />
      )}
      
      {/* Highlight for 3D effect */}
      <ellipse cx={size * 0.42} cy={size * 0.55} rx={size * 0.06} ry={size * 0.1} fill={style.metal.highlight} opacity={0.3} />
    </g>
  );
  
  const renderWok = () => (
    <g filter={PIXEL_SHADOWS.medium}>
      {/* Shadow */}
      <ellipse cx={size * 0.52} cy={size * 0.8} rx={size * 0.32} ry={size * 0.1} fill="#000000" opacity={0.25} />
      
      {/* Wok body - wider and shallower */}
      <path d={`M ${size * 0.2} ${size * 0.5} Q ${size * 0.15} ${size * 0.65} ${size * 0.3} ${size * 0.75} Q ${size * 0.5} ${size * 0.8} ${size * 0.7} ${size * 0.75} Q ${size * 0.85} ${size * 0.65} ${size * 0.8} ${size * 0.5}`}
            fill={style.metal.base} />
      
      {/* Inner surface */}
      <ellipse cx={size * 0.5} cy={size * 0.5} rx={size * 0.3} ry={size * 0.08} fill={style.metal.dark} />
      <ellipse cx={size * 0.5} cy={size * 0.49} rx={size * 0.28} ry={size * 0.07} fill={style.metal.shadow} />
      
      {/* Wooden handles */}
      <rect x={size * 0.12} y={size * 0.48} width={size * 0.12} height={size * 0.04} fill={style.accent.base} />
      <rect x={size * 0.76} y={size * 0.48} width={size * 0.12} height={size * 0.04} fill={style.accent.base} />
      
      {/* Contents */}
      {variant === 'cooking' && (
        <>
          <ellipse cx={size * 0.5} cy={size * 0.5} rx={size * 0.25} ry={size * 0.06} fill={style.liquid} opacity={0.8} />
          {/* Stir fry ingredients */}
          <circle cx={size * 0.45} cy={size * 0.49} r={size * 0.02} fill="#228B22" />
          <circle cx={size * 0.55} cy={size * 0.5} r={size * 0.025} fill="#FF6347" />
          <rect x={size * 0.48} y={size * 0.51} width={size * 0.04} height={size * 0.01} fill="#8B4513" />
        </>
      )}
      
      {/* Seasoning/patina */}
      <ellipse cx={size * 0.5} cy={size * 0.5} rx={size * 0.25} ry={size * 0.06} fill="#000000" opacity={0.1} />
    </g>
  );
  
  const renderClayPot = () => (
    <g filter={PIXEL_SHADOWS.soft}>
      {/* Shadow */}
      <ellipse cx={size * 0.52} cy={size * 0.82} rx={size * 0.25} ry={size * 0.08} fill="#000000" opacity={0.3} />
      
      {/* Clay pot body */}
      <ellipse cx={size * 0.5} cy={size * 0.65} rx={size * 0.22} ry={size * 0.25} fill={style.metal.base} />
      
      {/* Decorative patterns */}
      <rect x={size * 0.3} y={size * 0.5} width={size * 0.4} height={size * 0.02} fill={style.accent.base} />
      <rect x={size * 0.3} y={size * 0.6} width={size * 0.4} height={size * 0.02} fill={style.accent.dark} />
      <rect x={size * 0.3} y={size * 0.7} width={size * 0.4} height={size * 0.02} fill={style.accent.base} />
      
      {/* Geometric Aztec pattern */}
      {[0, 1, 2, 3].map(i => (
        <g key={i}>
          <rect x={size * (0.35 + i * 0.08)} y={size * 0.54} width={size * 0.03} height={size * 0.04} fill={style.accent.light} />
          <rect x={size * (0.36 + i * 0.08)} y={size * 0.55} width={size * 0.01} height={size * 0.02} fill={style.accent.dark} />
        </g>
      ))}
      
      {/* Rim */}
      <ellipse cx={size * 0.5} cy={size * 0.45} rx={size * 0.2} ry={size * 0.06} fill={style.metal.dark} />
      <ellipse cx={size * 0.5} cy={size * 0.44} rx={size * 0.18} ry={size * 0.05} fill={style.metal.base} />
      
      {/* Contents */}
      {variant === 'cooking' && (
        <ellipse cx={size * 0.5} cy={size * 0.45} rx={size * 0.16} ry={size * 0.04} fill={style.liquid} opacity={0.9} />
      )}
      
      {/* Clay texture */}
      <circle cx={size * 0.4} cy={size * 0.65} r={size * 0.01} fill={style.metal.shadow} opacity={0.3} />
      <circle cx={size * 0.6} cy={size * 0.58} r={size * 0.008} fill={style.metal.shadow} opacity={0.3} />
      <circle cx={size * 0.55} cy={size * 0.72} r={size * 0.01} fill={style.metal.shadow} opacity={0.3} />
    </g>
  );
  
  const renderTagine = () => (
    <g filter={PIXEL_SHADOWS.medium}>
      {/* Shadow */}
      <ellipse cx={size * 0.52} cy={size * 0.85} rx={size * 0.28} ry={size * 0.1} fill="#000000" opacity={0.3} />
      
      {/* Base dish */}
      <ellipse cx={size * 0.5} cy={size * 0.75} rx={size * 0.28} ry={size * 0.12} fill={style.metal.base} />
      <ellipse cx={size * 0.5} cy={size * 0.73} rx={size * 0.26} ry={size * 0.1} fill={style.metal.dark} />
      
      {/* Conical lid */}
      <path d={`M ${size * 0.25} ${size * 0.7} L ${size * 0.5} ${size * 0.25} L ${size * 0.75} ${size * 0.7} Z`}
            fill={style.metal.base} />
      <path d={`M ${size * 0.25} ${size * 0.7} L ${size * 0.5} ${size * 0.25} L ${size * 0.5} ${size * 0.7} Z`}
            fill={style.metal.light} opacity={0.5} />
      
      {/* Lid knob */}
      <circle cx={size * 0.5} cy={size * 0.25} r={size * 0.03} fill={style.accent.base} />
      <circle cx={size * 0.5} cy={size * 0.24} r={size * 0.02} fill={style.accent.light} />
      
      {/* Decorative bands on lid */}
      <rect x={size * 0.35} y={size * 0.5} width={size * 0.3} height={size * 0.02} fill={style.accent.base} opacity={0.7} />
      <rect x={size * 0.32} y={size * 0.6} width={size * 0.36} height={size * 0.02} fill={style.accent.dark} opacity={0.7} />
      
      {/* Steam vents */}
      {variant === 'cooking' && (
        <g opacity={0.3}>
          <circle cx={size * 0.45} cy={size * 0.35} r={size * 0.01} fill={style.steam} />
          <circle cx={size * 0.55} cy={size * 0.35} r={size * 0.01} fill={style.steam} />
        </g>
      )}
    </g>
  );
  
  return (
    <svg x={x} y={y} width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {style.shape === 'cauldron' && renderCauldron()}
      {style.shape === 'wok' && renderWok()}
      {style.shape === 'clay' && renderClayPot()}
      {style.shape === 'tagine' && renderTagine()}
      {(style.shape === 'pot' || style.shape === 'karahi') && renderCauldron()}
    </svg>
  );
};
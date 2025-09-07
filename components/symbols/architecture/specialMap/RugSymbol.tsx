/**
 * RugSymbol.tsx - Exquisite Stardew Valley/FF6 style carpet or rug
 * Rich patterns, cultural weaves, beautiful textures and fringes
 */
import React from 'react';
import { getPixelColors, PIXEL_SHADOWS, MATERIAL_COLORS } from '../../PixelArtStyleGuide';

interface RugSymbolProps {
  x: number;
  y: number;
  size: number;
  culturalZone?: string;
  variant?: 'persian' | 'simple' | 'prayer' | 'animal';
}

export const RugSymbol: React.FC<RugSymbolProps> = ({ 
  x = 0, 
  y = 0, 
  size = 32,
  culturalZone = 'EUROPEAN',
  variant = 'simple'
}) => {
  const getRugStyle = () => {
    switch (culturalZone) {
      case 'MENA':
        return {
          background: getPixelColors('#8B0000'), // Deep red
          primary: '#FFD700', // Gold
          secondary: '#4169E1', // Blue
          accent: '#228B22', // Green
          border: '#B8860B', // Dark gold
          pattern: 'persian'
        };
      case 'EAST_ASIAN':
        return {
          background: getPixelColors('#4B0082'), // Indigo
          primary: '#DC143C', // Crimson
          secondary: '#FFD700', // Gold
          accent: '#FFFFFF', // White
          border: '#8B0000', // Dark red
          pattern: 'dragon'
        };
      case 'EUROPEAN':
        return {
          background: getPixelColors('#2F4F4F'), // Dark green
          primary: '#8B0000', // Dark red
          secondary: '#DAA520', // Goldenrod
          accent: '#F5F5DC', // Beige
          border: '#654321', // Dark brown
          pattern: 'floral'
        };
      case 'SOUTH_ASIAN':
        return {
          background: getPixelColors('#DC143C'), // Crimson
          primary: '#FFD700', // Gold
          secondary: '#FF69B4', // Hot pink
          accent: '#00CED1', // Dark turquoise
          border: '#8B4513', // Saddle brown
          pattern: 'mandala'
        };
      case 'SUB_SAHARAN_AFRICAN':
        return {
          background: getPixelColors('#8B4513'), // Saddle brown
          primary: '#DAA520', // Goldenrod
          secondary: '#DC143C', // Crimson
          accent: '#F4A460', // Sandy brown
          border: '#2F1B0C', // Very dark brown
          pattern: 'tribal'
        };
      default:
        return {
          background: getPixelColors('#A0522D'),
          primary: '#654321',
          secondary: '#D2691E',
          accent: '#DEB887',
          border: '#8B4513',
          pattern: 'geometric'
        };
    }
  };
  
  const style = getRugStyle();
  
  const renderPersianRug = () => (
    <g filter={PIXEL_SHADOWS.soft}>
      {/* Shadow */}
      <rect x={size * 0.17} y={size * 0.27} width={size * 0.66} height={size * 0.48} fill="#000000" opacity={0.2} />
      
      {/* Main rug body */}
      <rect x={size * 0.15} y={size * 0.25} width={size * 0.7} height={size * 0.5} fill={style.background.base} />
      
      {/* Ornate border */}
      <rect x={size * 0.15} y={size * 0.25} width={size * 0.7} height={size * 0.05} fill={style.border} />
      <rect x={size * 0.15} y={size * 0.7} width={size * 0.7} height={size * 0.05} fill={style.border} />
      <rect x={size * 0.15} y={size * 0.25} width={size * 0.05} height={size * 0.5} fill={style.border} />
      <rect x={size * 0.8} y={size * 0.25} width={size * 0.05} height={size * 0.5} fill={style.border} />
      
      {/* Inner decorative border */}
      <rect x={size * 0.2} y={size * 0.3} width={size * 0.6} height={size * 0.02} fill={style.primary} />
      <rect x={size * 0.2} y={size * 0.68} width={size * 0.6} height={size * 0.02} fill={style.primary} />
      <rect x={size * 0.2} y={size * 0.3} width={size * 0.02} height={size * 0.4} fill={style.primary} />
      <rect x={size * 0.78} y={size * 0.3} width={size * 0.02} height={size * 0.4} fill={style.primary} />
      
      {/* Central medallion */}
      <ellipse cx={size * 0.5} cy={size * 0.5} rx={size * 0.15} ry={size * 0.1} fill={style.secondary} />
      <ellipse cx={size * 0.5} cy={size * 0.5} rx={size * 0.12} ry={size * 0.08} fill={style.primary} />
      <ellipse cx={size * 0.5} cy={size * 0.5} rx={size * 0.09} ry={size * 0.06} fill={style.accent} />
      <ellipse cx={size * 0.5} cy={size * 0.5} rx={size * 0.06} ry={size * 0.04} fill={style.secondary} />
      
      {/* Corner rosettes */}
      <circle cx={size * 0.25} cy={size * 0.35} r={size * 0.03} fill={style.accent} />
      <circle cx={size * 0.75} cy={size * 0.35} r={size * 0.03} fill={style.accent} />
      <circle cx={size * 0.25} cy={size * 0.65} r={size * 0.03} fill={style.accent} />
      <circle cx={size * 0.75} cy={size * 0.65} r={size * 0.03} fill={style.accent} />
      
      {/* Intricate pattern details */}
      {[0.3, 0.4, 0.6, 0.7].map(x => (
        <g key={x}>
          <rect x={size * x} y={size * 0.45} width={size * 0.02} height={size * 0.1} fill={style.secondary} opacity={0.6} />
          <circle cx={size * (x + 0.01)} cy={size * 0.5} r={size * 0.015} fill={style.primary} />
        </g>
      ))}
      
      {/* Fringes */}
      <g opacity={0.7}>
        {[0.18, 0.22, 0.26, 0.3, 0.34, 0.38, 0.42, 0.46, 0.5, 0.54, 0.58, 0.62, 0.66, 0.7, 0.74, 0.78, 0.82].map(x => (
          <g key={x}>
            <rect x={size * x} y={size * 0.2} width={size * 0.005} height={size * 0.05} fill={style.accent} />
            <rect x={size * x} y={size * 0.75} width={size * 0.005} height={size * 0.05} fill={style.accent} />
          </g>
        ))}
      </g>
    </g>
  );
  
  const renderPrayerRug = () => (
    <g filter={PIXEL_SHADOWS.medium}>
      {/* Shadow */}
      <rect x={size * 0.22} y={size * 0.27} width={size * 0.56} height={size * 0.48} fill="#000000" opacity={0.25} />
      
      {/* Main rug body */}
      <rect x={size * 0.2} y={size * 0.25} width={size * 0.6} height={size * 0.5} fill={style.background.base} />
      
      {/* Prayer niche (mihrab) */}
      <path d={`M ${size * 0.25} ${size * 0.65} L ${size * 0.25} ${size * 0.4} Q ${size * 0.25} ${size * 0.3} ${size * 0.5} ${size * 0.3} Q ${size * 0.75} ${size * 0.3} ${size * 0.75} ${size * 0.4} L ${size * 0.75} ${size * 0.65} Z`}
            fill={style.primary} />
      
      {/* Inner arch */}
      <path d={`M ${size * 0.3} ${size * 0.6} L ${size * 0.3} ${size * 0.42} Q ${size * 0.3} ${size * 0.35} ${size * 0.5} ${size * 0.35} Q ${size * 0.7} ${size * 0.35} ${size * 0.7} ${size * 0.42} L ${size * 0.7} ${size * 0.6} Z`}
            fill={style.background.light} />
      
      {/* Lamp hanging in mihrab */}
      <rect x={size * 0.49} y={size * 0.4} width={size * 0.02} height={size * 0.08} fill={style.accent} />
      <ellipse cx={size * 0.5} cy={size * 0.5} rx={size * 0.04} ry={size * 0.06} fill={style.secondary} />
      <ellipse cx={size * 0.5} cy={size * 0.49} rx={size * 0.03} ry={size * 0.04} fill={style.primary} />
      
      {/* Geometric border pattern */}
      <rect x={size * 0.2} y={size * 0.25} width={size * 0.6} height={size * 0.03} fill={style.border} />
      <rect x={size * 0.2} y={size * 0.72} width={size * 0.6} height={size * 0.03} fill={style.border} />
      
      {/* Side patterns */}
      <rect x={size * 0.22} y={size * 0.35} width={size * 0.03} height={size * 0.3} fill={style.secondary} />
      <rect x={size * 0.75} y={size * 0.35} width={size * 0.03} height={size * 0.3} fill={style.secondary} />
      
      {/* Islamic calligraphy representation */}
      <text x={size * 0.5} y={size * 0.32} fontSize={size * 0.04} fill={style.accent} textAnchor="middle">الله</text>
      
      {/* Prayer compass */}
      <circle cx={size * 0.5} cy={size * 0.68} r={size * 0.02} fill={style.accent} />
      <path d={`M ${size * 0.5} ${size * 0.66} L ${size * 0.495} ${size * 0.685} L ${size * 0.505} ${size * 0.685} Z`} fill={style.background.dark} />
    </g>
  );
  
  const renderAnimalSkinRug = () => (
    <g filter={PIXEL_SHADOWS.hard}>
      {/* Shadow with irregular shape */}
      <path d={`M ${size * 0.22} ${size * 0.35} Q ${size * 0.18} ${size * 0.4} ${size * 0.2} ${size * 0.5} Q ${size * 0.15} ${size * 0.6} ${size * 0.25} ${size * 0.7} Q ${size * 0.4} ${size * 0.78} ${size * 0.6} ${size * 0.75} Q ${size * 0.75} ${size * 0.72} ${size * 0.8} ${size * 0.65} Q ${size * 0.82} ${size * 0.5} ${size * 0.78} ${size * 0.4} Q ${size * 0.7} ${size * 0.32} ${size * 0.5} ${size * 0.28} Q ${size * 0.35} ${size * 0.3} ${size * 0.22} ${size * 0.35} Z`}
            fill="#000000" opacity={0.3} />
      
      {/* Main hide shape */}
      <path d={`M ${size * 0.2} ${size * 0.32} Q ${size * 0.16} ${size * 0.37} ${size * 0.18} ${size * 0.47} Q ${size * 0.13} ${size * 0.57} ${size * 0.23} ${size * 0.67} Q ${size * 0.38} ${size * 0.75} ${size * 0.58} ${size * 0.72} Q ${size * 0.73} ${size * 0.69} ${size * 0.78} ${size * 0.62} Q ${size * 0.8} ${size * 0.47} ${size * 0.76} ${size * 0.37} Q ${size * 0.68} ${size * 0.29} ${size * 0.48} ${size * 0.25} Q ${size * 0.33} ${size * 0.27} ${size * 0.2} ${size * 0.32} Z`}
            fill={style.background.base} />
      
      {/* Natural hide patterns and spots */}
      <ellipse cx={size * 0.35} cy={size * 0.4} rx={size * 0.03} ry={size * 0.025} fill={style.background.dark} opacity={0.4} />
      <ellipse cx={size * 0.55} cy={size * 0.45} rx={size * 0.025} ry={size * 0.02} fill={style.background.dark} opacity={0.4} />
      <ellipse cx={size * 0.45} cy={size * 0.6} rx={size * 0.04} ry={size * 0.03} fill={style.background.dark} opacity={0.4} />
      <ellipse cx={size * 0.65} cy={size * 0.55} rx={size * 0.02} ry={size * 0.015} fill={style.background.dark} opacity={0.4} />
      <ellipse cx={size * 0.3} cy={size * 0.55} rx={size * 0.015} ry={size * 0.012} fill={style.background.dark} opacity={0.4} />
      
      {/* Head area (if bear skin) */}
      <ellipse cx={size * 0.5} cy={size * 0.28} rx={size * 0.08} ry={size * 0.06} fill={style.background.light} />
      <circle cx={size * 0.47} cy={size * 0.26} r={size * 0.01} fill="#000000" />
      <circle cx={size * 0.53} cy={size * 0.26} r={size * 0.01} fill="#000000" />
      <circle cx={size * 0.5} cy={size * 0.29} r={size * 0.008} fill="#000000" />
      
      {/* Paws */}
      <ellipse cx={size * 0.18} cy={size * 0.5} rx={size * 0.03} ry={size * 0.04} fill={style.background.shadow} />
      <ellipse cx={size * 0.82} cy={size * 0.55} rx={size * 0.03} ry={size * 0.04} fill={style.background.shadow} />
      <ellipse cx={size * 0.3} cy={size * 0.72} rx={size * 0.025} ry={size * 0.03} fill={style.background.shadow} />
      <ellipse cx={size * 0.7} cy={size * 0.7} rx={size * 0.025} ry={size * 0.03} fill={style.background.shadow} />
      
      {/* Claw marks */}
      {[0.17, 0.19].map(x => (
        <rect key={x} x={size * x} y={size * 0.48} width={size * 0.003} height={size * 0.015} fill="#2F1B0C" />
      ))}
      
      {/* Fur texture */}
      <path d={`M ${size * 0.25} ${size * 0.4} Q ${size * 0.27} ${size * 0.38} ${size * 0.29} ${size * 0.4}`}
            fill="none" stroke={style.background.dark} strokeWidth={0.5} opacity={0.3} />
      <path d={`M ${size * 0.6} ${size * 0.5} Q ${size * 0.62} ${size * 0.48} ${size * 0.64} ${size * 0.5}`}
            fill="none" stroke={style.background.dark} strokeWidth={0.5} opacity={0.3} />
    </g>
  );
  
  const renderSimpleRug = () => (
    <g filter={PIXEL_SHADOWS.soft}>
      {/* Shadow */}
      <rect x={size * 0.22} y={size * 0.32} width={size * 0.56} height={size * 0.38} fill="#000000" opacity={0.2} />
      
      {/* Main rug body */}
      <rect x={size * 0.2} y={size * 0.3} width={size * 0.6} height={size * 0.4} fill={style.background.base} />
      
      {/* Simple border */}
      <rect x={size * 0.2} y={size * 0.3} width={size * 0.6} height={size * 0.02} fill={style.border} />
      <rect x={size * 0.2} y={size * 0.68} width={size * 0.6} height={size * 0.02} fill={style.border} />
      <rect x={size * 0.2} y={size * 0.3} width={size * 0.02} height={size * 0.4} fill={style.border} />
      <rect x={size * 0.78} y={size * 0.3} width={size * 0.02} height={size * 0.4} fill={style.border} />
      
      {/* Simple geometric pattern */}
      <rect x={size * 0.35} y={size * 0.4} width={size * 0.3} height={size * 0.2} fill={style.primary} opacity={0.6} />
      <rect x={size * 0.4} y={size * 0.45} width={size * 0.2} height={size * 0.1} fill={style.secondary} opacity={0.5} />
      <rect x={size * 0.45} y={size * 0.48} width={size * 0.1} height={size * 0.04} fill={style.accent} opacity={0.7} />
      
      {/* Corner decorations */}
      <circle cx={size * 0.25} cy={size * 0.35} r={size * 0.015} fill={style.accent} />
      <circle cx={size * 0.75} cy={size * 0.35} r={size * 0.015} fill={style.accent} />
      <circle cx={size * 0.25} cy={size * 0.65} r={size * 0.015} fill={style.accent} />
      <circle cx={size * 0.75} cy={size * 0.65} r={size * 0.015} fill={style.accent} />
      
      {/* Simple fringe */}
      <g opacity={0.5}>
        {[0.22, 0.26, 0.3, 0.34, 0.38, 0.42, 0.46, 0.5, 0.54, 0.58, 0.62, 0.66, 0.7, 0.74, 0.78].map(x => (
          <g key={x}>
            <rect x={size * x} y={size * 0.25} width={size * 0.003} height={size * 0.05} fill={style.accent} />
            <rect x={size * x} y={size * 0.7} width={size * 0.003} height={size * 0.05} fill={style.accent} />
          </g>
        ))}
      </g>
    </g>
  );
  
  return (
    <svg x={x} y={y} width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {(variant === 'persian' || style.pattern === 'persian') && renderPersianRug()}
      {variant === 'prayer' && renderPrayerRug()}
      {variant === 'animal' && renderAnimalSkinRug()}
      {variant === 'simple' && renderSimpleRug()}
    </svg>
  );
};
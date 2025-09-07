/**
 * CrateSymbol.tsx - Detailed Stardew Valley/FF6 style wooden crate or barrel
 * Rich wood textures, metal bands, cultural storage variations
 */
import React from 'react';
import { getPixelColors, PIXEL_SHADOWS, MATERIAL_COLORS } from '../../PixelArtStyleGuide';

interface CrateSymbolProps {
  x: number;
  y: number;
  size: number;
  culturalZone?: string;
  variant?: 'crate' | 'barrel' | 'chest' | 'sack';
}

export const CrateSymbol: React.FC<CrateSymbolProps> = ({ 
  x = 0, 
  y = 0, 
  size = 32,
  culturalZone = 'EUROPEAN',
  variant = 'crate'
}) => {
  const getCrateStyle = () => {
    switch (culturalZone) {
      case 'EAST_ASIAN':
        return {
          wood: getPixelColors('#8B4513'), // Bamboo/dark wood
          metal: MATERIAL_COLORS.metal.iron,
          accent: '#DC143C', // Red lacquer
          rope: '#D2691E',
          pattern: 'bamboo'
        };
      case 'MENA':
        return {
          wood: getPixelColors('#DEB887'), // Light desert wood
          metal: MATERIAL_COLORS.metal.brass,
          accent: '#4169E1', // Blue accents
          rope: '#F4A460',
          pattern: 'geometric'
        };
      case 'EUROPEAN':
        return {
          wood: getPixelColors('#654321'), // Oak
          metal: MATERIAL_COLORS.metal.iron,
          accent: '#2F4F4F', // Dark green
          rope: '#8B7355',
          pattern: 'planks'
        };
      case 'SUB_SAHARAN_AFRICAN':
        return {
          wood: getPixelColors('#8B4513'), // Acacia
          metal: MATERIAL_COLORS.metal.copper,
          accent: '#DAA520', // Gold patterns
          rope: '#DEB887',
          pattern: 'woven'
        };
      default:
        return {
          wood: getPixelColors('#A0522D'),
          metal: MATERIAL_COLORS.metal.steel,
          accent: '#696969',
          rope: '#D2B48C',
          pattern: 'simple'
        };
    }
  };
  
  const style = getCrateStyle();
  
  const renderCrate = () => (
    <g filter={PIXEL_SHADOWS.hard}>
      {/* Shadow with perspective */}
      <path d={`M ${size * 0.3} ${size * 0.85} L ${size * 0.72} ${size * 0.85} L ${size * 0.77} ${size * 0.9} L ${size * 0.35} ${size * 0.9} Z`}
            fill="#000000" opacity={0.3} />
      
      {/* Front face */}
      <rect x={size * 0.25} y={size * 0.4} width={size * 0.45} height={size * 0.45} fill={style.wood.base} />
      
      {/* Wood planks */}
      <rect x={size * 0.25} y={size * 0.4} width={size * 0.45} height={size * 0.01} fill={style.wood.dark} />
      <rect x={size * 0.25} y={size * 0.52} width={size * 0.45} height={size * 0.01} fill={style.wood.dark} />
      <rect x={size * 0.25} y={size * 0.64} width={size * 0.45} height={size * 0.01} fill={style.wood.dark} />
      <rect x={size * 0.25} y={size * 0.76} width={size * 0.45} height={size * 0.01} fill={style.wood.dark} />
      
      {/* Vertical planks */}
      <rect x={size * 0.37} y={size * 0.4} width={size * 0.01} height={size * 0.45} fill={style.wood.shadow} />
      <rect x={size * 0.49} y={size * 0.4} width={size * 0.01} height={size * 0.45} fill={style.wood.shadow} />
      <rect x={size * 0.61} y={size * 0.4} width={size * 0.01} height={size * 0.45} fill={style.wood.shadow} />
      
      {/* Top face (3D perspective) */}
      <path d={`M ${size * 0.25} ${size * 0.4} L ${size * 0.35} ${size * 0.3} L ${size * 0.8} ${size * 0.3} L ${size * 0.7} ${size * 0.4} Z`}
            fill={style.wood.light} />
      
      {/* Right side face */}
      <path d={`M ${size * 0.7} ${size * 0.4} L ${size * 0.8} ${size * 0.3} L ${size * 0.8} ${size * 0.75} L ${size * 0.7} ${size * 0.85} Z`}
            fill={style.wood.shadow} />
      
      {/* Metal reinforcements */}
      <rect x={size * 0.25} y={size * 0.42} width={size * 0.45} height={size * 0.03} fill={style.metal.base} opacity={0.8} />
      <rect x={size * 0.25} y={size * 0.80} width={size * 0.45} height={size * 0.03} fill={style.metal.base} opacity={0.8} />
      
      {/* Corner brackets */}
      <rect x={size * 0.25} y={size * 0.4} width={size * 0.04} height={size * 0.08} fill={style.metal.dark} />
      <rect x={size * 0.66} y={size * 0.4} width={size * 0.04} height={size * 0.08} fill={style.metal.dark} />
      <rect x={size * 0.25} y={size * 0.77} width={size * 0.04} height={size * 0.08} fill={style.metal.dark} />
      <rect x={size * 0.66} y={size * 0.77} width={size * 0.04} height={size * 0.08} fill={style.metal.dark} />
      
      {/* Nails */}
      <circle cx={size * 0.27} cy={size * 0.44} r={size * 0.008} fill={style.metal.light} />
      <circle cx={size * 0.68} cy={size * 0.44} r={size * 0.008} fill={style.metal.light} />
      <circle cx={size * 0.27} cy={size * 0.81} r={size * 0.008} fill={style.metal.light} />
      <circle cx={size * 0.68} cy={size * 0.81} r={size * 0.008} fill={style.metal.light} />
      
      {/* Label or marking */}
      <rect x={size * 0.4} y={size * 0.55} width={size * 0.15} height={size * 0.08} fill="#F5F5DC" opacity={0.7} />
      <text x={size * 0.475} y={size * 0.6} fontSize={size * 0.04} fill="#000000" textAnchor="middle">GOODS</text>
      
      {/* Wood grain texture */}
      <rect x={size * 0.3} y={size * 0.45} width={size * 0.35} height={size * 0.005} fill={style.wood.dark} opacity={0.3} />
      <rect x={size * 0.28} y={size * 0.58} width={size * 0.38} height={size * 0.005} fill={style.wood.dark} opacity={0.3} />
      <rect x={size * 0.32} y={size * 0.71} width={size * 0.32} height={size * 0.005} fill={style.wood.dark} opacity={0.3} />
    </g>
  );
  
  const renderBarrel = () => (
    <g filter={PIXEL_SHADOWS.medium}>
      {/* Shadow */}
      <ellipse cx={size * 0.52} cy={size * 0.85} rx={size * 0.22} ry={size * 0.08} fill="#000000" opacity={0.3} />
      
      {/* Barrel body */}
      <ellipse cx={size * 0.5} cy={size * 0.65} rx={size * 0.2} ry={size * 0.25} fill={style.wood.base} />
      
      {/* Wood staves (vertical planks) */}
      {[0.35, 0.41, 0.47, 0.53, 0.59, 0.65].map(x => (
        <rect key={x} x={size * x} y={size * 0.4} width={size * 0.02} height={size * 0.5} fill={style.wood.dark} opacity={0.3} />
      ))}
      
      {/* Metal hoops */}
      <ellipse cx={size * 0.5} cy={size * 0.45} rx={size * 0.21} ry={size * 0.06} fill={style.metal.dark} />
      <ellipse cx={size * 0.5} cy={size * 0.44} rx={size * 0.2} ry={size * 0.05} fill={style.metal.base} />
      
      <ellipse cx={size * 0.5} cy={size * 0.65} rx={size * 0.22} ry={size * 0.07} fill={style.metal.dark} />
      <ellipse cx={size * 0.5} cy={size * 0.64} rx={size * 0.21} ry={size * 0.06} fill={style.metal.base} />
      
      <ellipse cx={size * 0.5} cy={size * 0.85} rx={size * 0.2} ry={size * 0.06} fill={style.metal.dark} />
      <ellipse cx={size * 0.5} cy={size * 0.84} rx={size * 0.19} ry={size * 0.05} fill={style.metal.base} />
      
      {/* Top lid */}
      <ellipse cx={size * 0.5} cy={size * 0.4} rx={size * 0.18} ry={size * 0.05} fill={style.wood.dark} />
      <ellipse cx={size * 0.5} cy={size * 0.39} rx={size * 0.16} ry={size * 0.04} fill={style.wood.light} />
      
      {/* Tap/spigot */}
      <rect x={size * 0.48} y={size * 0.75} width={size * 0.08} height={size * 0.02} fill={style.metal.brass.base} />
      <circle cx={size * 0.56} cy={size * 0.76} r={size * 0.02} fill={style.metal.brass.dark} />
      
      {/* Barrel marking */}
      <circle cx={size * 0.5} cy={size * 0.55} r={size * 0.08} fill="none" stroke={style.accent} strokeWidth={1} opacity={0.5} />
      <text x={size * 0.5} y={size * 0.57} fontSize={size * 0.05} fill={style.accent} textAnchor="middle">ALE</text>
      
      {/* Wood highlights */}
      <ellipse cx={size * 0.42} cy={size * 0.6} rx={size * 0.04} ry={size * 0.12} fill={style.wood.light} opacity={0.3} />
    </g>
  );
  
  const renderChest = () => (
    <g filter={PIXEL_SHADOWS.hard}>
      {/* Shadow */}
      <rect x={size * 0.22} y={size * 0.82} width={size * 0.56} height={size * 0.08} fill="#000000" opacity={0.35} />
      
      {/* Chest base */}
      <rect x={size * 0.2} y={size * 0.55} width={size * 0.6} height={size * 0.3} fill={style.wood.base} />
      
      {/* Front decorative panel */}
      <rect x={size * 0.25} y={size * 0.6} width={size * 0.5} height={size * 0.2} fill={style.wood.dark} />
      <rect x={size * 0.27} y={size * 0.62} width={size * 0.46} height={size * 0.16} fill={style.wood.base} />
      
      {/* Chest lid (closed) */}
      <path d={`M ${size * 0.2} ${size * 0.55} Q ${size * 0.2} ${size * 0.45} ${size * 0.3} ${size * 0.4} L ${size * 0.7} ${size * 0.4} Q ${size * 0.8} ${size * 0.45} ${size * 0.8} ${size * 0.55} Z`}
            fill={style.wood.light} />
      
      {/* Metal reinforcements */}
      <rect x={size * 0.2} y={size * 0.53} width={size * 0.6} height={size * 0.03} fill={style.metal.base} />
      <rect x={size * 0.2} y={size * 0.82} width={size * 0.6} height={size * 0.03} fill={style.metal.base} />
      
      {/* Ornate lock */}
      <rect x={size * 0.45} y={size * 0.65} width={size * 0.1} height={size * 0.08} fill={style.metal.brass.base} />
      <circle cx={size * 0.5} cy={size * 0.69} r={size * 0.025} fill={style.metal.brass.dark} />
      <rect x={size * 0.49} y={size * 0.69} width={size * 0.02} height={size * 0.03} fill="#000000" />
      
      {/* Corner metal brackets */}
      <path d={`M ${size * 0.2} ${size * 0.45} L ${size * 0.25} ${size * 0.45} L ${size * 0.25} ${size * 0.5}`}
            fill="none" stroke={style.metal.dark} strokeWidth={2} />
      <path d={`M ${size * 0.75} ${size * 0.45} L ${size * 0.8} ${size * 0.45} L ${size * 0.8} ${size * 0.5}`}
            fill="none" stroke={style.metal.dark} strokeWidth={2} />
      
      {/* Decorative studs */}
      <circle cx={size * 0.25} cy={size * 0.48} r={size * 0.01} fill={style.metal.light} />
      <circle cx={size * 0.75} cy={size * 0.48} r={size * 0.01} fill={style.metal.light} />
      <circle cx={size * 0.25} cy={size * 0.8} r={size * 0.01} fill={style.metal.light} />
      <circle cx={size * 0.75} cy={size * 0.8} r={size * 0.01} fill={style.metal.light} />
      
      {/* Cultural pattern */}
      {style.pattern === 'geometric' && (
        <rect x={size * 0.35} y={size * 0.66} width={size * 0.3} height={size * 0.02} fill={style.accent} opacity={0.6} />
      )}
    </g>
  );
  
  const renderSack = () => (
    <g filter={PIXEL_SHADOWS.soft}>
      {/* Shadow */}
      <ellipse cx={size * 0.52} cy={size * 0.85} rx={size * 0.2} ry={size * 0.08} fill="#000000" opacity={0.25} />
      
      {/* Sack body */}
      <path d={`M ${size * 0.35} ${size * 0.45} Q ${size * 0.32} ${size * 0.5} ${size * 0.32} ${size * 0.7} Q ${size * 0.32} ${size * 0.82} ${size * 0.4} ${size * 0.85} L ${size * 0.6} ${size * 0.85} Q ${size * 0.68} ${size * 0.82} ${size * 0.68} ${size * 0.7} Q ${size * 0.68} ${size * 0.5} ${size * 0.65} ${size * 0.45} Z`}
            fill={style.rope} />
      
      {/* Texture and folds */}
      <path d={`M ${size * 0.35} ${size * 0.55} Q ${size * 0.4} ${size * 0.53} ${size * 0.45} ${size * 0.55}`}
            fill="none" stroke={style.wood.dark} strokeWidth={1} opacity={0.3} />
      <path d={`M ${size * 0.55} ${size * 0.6} Q ${size * 0.6} ${size * 0.58} ${size * 0.65} ${size * 0.6}`}
            fill="none" stroke={style.wood.dark} strokeWidth={1} opacity={0.3} />
      <path d={`M ${size * 0.38} ${size * 0.7} Q ${size * 0.45} ${size * 0.68} ${size * 0.52} ${size * 0.7}`}
            fill="none" stroke={style.wood.dark} strokeWidth={1} opacity={0.3} />
      
      {/* Tied top */}
      <ellipse cx={size * 0.5} cy={size * 0.45} rx={size * 0.15} ry={size * 0.04} fill={style.rope} />
      <rect x={size * 0.48} y={size * 0.35} width={size * 0.04} height={size * 0.1} fill={style.accent} />
      <circle cx={size * 0.5} cy={size * 0.38} r={size * 0.06} fill="none" stroke={style.accent} strokeWidth={2} />
      
      {/* Contents bulging */}
      <ellipse cx={size * 0.45} cy={size * 0.65} rx={size * 0.08} ry={size * 0.1} fill={style.rope} opacity={0.3} />
      <ellipse cx={size * 0.55} cy={size * 0.72} rx={size * 0.06} ry={size * 0.08} fill={style.rope} opacity={0.3} />
      
      {/* Label tag */}
      <rect x={size * 0.42} y={size * 0.6} width={size * 0.12} height={size * 0.08} fill="#F5F5DC" transform="rotate(-5 48 64)" />
      <text x={size * 0.48} y={size * 0.65} fontSize={size * 0.03} fill="#000000" textAnchor="middle">GRAIN</text>
    </g>
  );
  
  return (
    <svg x={x} y={y} width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {variant === 'crate' && renderCrate()}
      {variant === 'barrel' && renderBarrel()}
      {variant === 'chest' && renderChest()}
      {variant === 'sack' && renderSack()}
    </svg>
  );
};
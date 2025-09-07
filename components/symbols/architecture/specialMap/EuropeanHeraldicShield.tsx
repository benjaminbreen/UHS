/**
 * EuropeanHeraldicShield.tsx - Cultural decoration symbol for European zones
 * Beautiful Stardew Valley/FF6 pixel art style heraldic shield wall decoration
 * Features medieval coat of arms with proper heraldic colors and symbols
 */
import React from 'react';
import { getPixelColors, PIXEL_SHADOWS, MATERIAL_COLORS } from '../../PixelArtStyleGuide';

interface EuropeanHeraldicShieldProps {
  x: number;
  y: number;
  size: number;
  variant?: 'royal' | 'noble' | 'knight' | 'guild';
}

export const EuropeanHeraldicShield: React.FC<EuropeanHeraldicShieldProps> = ({ 
  x = 0,
  y = 0,
  size = 32,
  variant = 'noble'
}) => {
  const getShieldStyle = () => {
    switch (variant) {
      case 'royal':
        return {
          field: '#4169E1', // Royal blue
          metal: '#FFD700', // Gold
          secondary: '#8B0000', // Crimson
          rim: MATERIAL_COLORS.metal.gold
        };
      case 'noble':
        return {
          field: '#8B0000', // Crimson
          metal: '#C0C0C0', // Silver
          secondary: '#000080', // Navy
          rim: MATERIAL_COLORS.metal.silver
        };
      case 'knight':
        return {
          field: '#000080', // Navy
          metal: '#FFD700', // Gold
          secondary: '#FFFFFF', // White
          rim: MATERIAL_COLORS.metal.iron
        };
      case 'guild':
        return {
          field: '#006400', // Green
          metal: '#8B4513', // Brown
          secondary: '#FFD700', // Gold
          rim: MATERIAL_COLORS.metal.brass
        };
      default:
        return {
          field: '#8B0000',
          metal: '#C0C0C0',
          secondary: '#000080',
          rim: MATERIAL_COLORS.metal.silver
        };
    }
  };
  
  const style = getShieldStyle();
  
  return (
    <svg x={x} y={y} width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <g filter={PIXEL_SHADOWS.medium}>
        {/* Wall mounting shadow */}
        <ellipse cx={size * 0.52} cy={size * 0.85} rx={size * 0.25} ry={size * 0.08} fill="#000000" opacity={0.3} />
        
        {/* Shield base shape - classic heater shield */}
        <path d={`M ${size * 0.35} ${size * 0.15} 
                  Q ${size * 0.2} ${size * 0.15} ${size * 0.2} ${size * 0.3}
                  L ${size * 0.2} ${size * 0.6}
                  Q ${size * 0.2} ${size * 0.75} ${size * 0.5} ${size * 0.8}
                  Q ${size * 0.8} ${size * 0.75} ${size * 0.8} ${size * 0.6}
                  L ${size * 0.8} ${size * 0.3}
                  Q ${size * 0.8} ${size * 0.15} ${size * 0.65} ${size * 0.15}
                  Z`}
              fill={style.field} />
        
        {/* Shield rim/border with metallic appearance */}
        <path d={`M ${size * 0.35} ${size * 0.15} 
                  Q ${size * 0.2} ${size * 0.15} ${size * 0.2} ${size * 0.3}
                  L ${size * 0.2} ${size * 0.6}
                  Q ${size * 0.2} ${size * 0.75} ${size * 0.5} ${size * 0.8}
                  Q ${size * 0.8} ${size * 0.75} ${size * 0.8} ${size * 0.6}
                  L ${size * 0.8} ${size * 0.3}
                  Q ${size * 0.8} ${size * 0.15} ${size * 0.65} ${size * 0.15}
                  Z`}
              fill="none" stroke={style.rim.base} strokeWidth={size * 0.02} />
        
        {/* Inner shield highlights */}
        <path d={`M ${size * 0.37} ${size * 0.17} 
                  Q ${size * 0.25} ${size * 0.17} ${size * 0.25} ${size * 0.32}
                  L ${size * 0.25} ${size * 0.5}`}
              fill="none" stroke={style.rim.light} strokeWidth={size * 0.01} opacity={0.6} />
        
        {/* Heraldic design based on variant */}
        {variant === 'royal' && (
          <g>
            {/* Three fleur-de-lis */}
            <g fill={style.metal}>
              <path d={`M ${size * 0.35} ${size * 0.25} Q ${size * 0.32} ${size * 0.22} ${size * 0.35} ${size * 0.2} Q ${size * 0.38} ${size * 0.22} ${size * 0.35} ${size * 0.25}
                        M ${size * 0.32} ${size * 0.28} Q ${size * 0.35} ${size * 0.25} ${size * 0.38} ${size * 0.28}
                        M ${size * 0.35} ${size * 0.25} L ${size * 0.35} ${size * 0.32}`} strokeWidth={size * 0.015} stroke={style.metal} />
              
              <path d={`M ${size * 0.5} ${size * 0.35} Q ${size * 0.47} ${size * 0.32} ${size * 0.5} ${size * 0.3} Q ${size * 0.53} ${size * 0.32} ${size * 0.5} ${size * 0.35}
                        M ${size * 0.47} ${size * 0.38} Q ${size * 0.5} ${size * 0.35} ${size * 0.53} ${size * 0.38}
                        M ${size * 0.5} ${size * 0.35} L ${size * 0.5} ${size * 0.42}`} strokeWidth={size * 0.015} stroke={style.metal} />
              
              <path d={`M ${size * 0.65} ${size * 0.25} Q ${size * 0.62} ${size * 0.22} ${size * 0.65} ${size * 0.2} Q ${size * 0.68} ${size * 0.22} ${size * 0.65} ${size * 0.25}
                        M ${size * 0.62} ${size * 0.28} Q ${size * 0.65} ${size * 0.25} ${size * 0.68} ${size * 0.28}
                        M ${size * 0.65} ${size * 0.25} L ${size * 0.65} ${size * 0.32}`} strokeWidth={size * 0.015} stroke={style.metal} />
            </g>
            
            {/* Crown at top */}
            <rect x={size * 0.45} y={size * 0.5} width={size * 0.1} height={size * 0.03} fill={style.metal} />
            <polygon points={`${size * 0.47},${size * 0.5} ${size * 0.5},${size * 0.47} ${size * 0.53},${size * 0.5}`} fill={style.metal} />
          </g>
        )}
        
        {variant === 'noble' && (
          <g>
            {/* Diagonal bend sinister */}
            <rect x={size * 0.25} y={size * 0.2} width={size * 0.5} height={size * 0.08} 
                  fill={style.metal} transform={`rotate(45 ${size * 0.5} ${size * 0.5})`} />
            
            {/* Three chevrons */}
            <path d={`M ${size * 0.3} ${size * 0.45} L ${size * 0.5} ${size * 0.35} L ${size * 0.7} ${size * 0.45}`}
                  fill="none" stroke={style.secondary} strokeWidth={size * 0.02} />
            <path d={`M ${size * 0.32} ${size * 0.55} L ${size * 0.5} ${size * 0.45} L ${size * 0.68} ${size * 0.55}`}
                  fill="none" stroke={style.secondary} strokeWidth={size * 0.02} />
            <path d={`M ${size * 0.34} ${size * 0.65} L ${size * 0.5} ${size * 0.55} L ${size * 0.66} ${size * 0.65}`}
                  fill="none" stroke={style.secondary} strokeWidth={size * 0.02} />
          </g>
        )}
        
        {variant === 'knight' && (
          <g>
            {/* Cross pattée */}
            <rect x={size * 0.47} y={size * 0.25} width={size * 0.06} height={size * 0.3} fill={style.metal} />
            <rect x={size * 0.35} y={size * 0.37} width={size * 0.3} height={size * 0.06} fill={style.metal} />
            
            {/* Cross arms with flared ends */}
            <polygon points={`${size * 0.47},${size * 0.25} ${size * 0.45},${size * 0.22} ${size * 0.55},${size * 0.22} ${size * 0.53},${size * 0.25}`} fill={style.metal} />
            <polygon points={`${size * 0.47},${size * 0.55} ${size * 0.45},${size * 0.58} ${size * 0.55},${size * 0.58} ${size * 0.53},${size * 0.55}`} fill={style.metal} />
            <polygon points={`${size * 0.35},${size * 0.37} ${size * 0.32},${size * 0.35} ${size * 0.32},${size * 0.45} ${size * 0.35},${size * 0.43}`} fill={style.metal} />
            <polygon points={`${size * 0.65},${size * 0.37} ${size * 0.68},${size * 0.35} ${size * 0.68},${size * 0.45} ${size * 0.65},${size * 0.43}`} fill={style.metal} />
          </g>
        )}
        
        {variant === 'guild' && (
          <g>
            {/* Guild tools - hammer and anvil */}
            <rect x={size * 0.35} y={size * 0.3} width={size * 0.3} height={size * 0.06} fill={style.metal} />
            <rect x={size * 0.45} y={size * 0.25} width={size * 0.1} height={size * 0.15} fill={style.secondary} />
            
            {/* Hammer */}
            <rect x={size * 0.25} y={size * 0.5} width={size * 0.04} height={size * 0.15} fill={style.metal} />
            <rect x={size * 0.22} y={size * 0.47} width={size * 0.1} height={size * 0.06} fill={style.secondary} />
            
            {/* Guild star */}
            <polygon points={`${size * 0.65},${size * 0.45} ${size * 0.67},${size * 0.5} ${size * 0.72},${size * 0.5} ${size * 0.68},${size * 0.53} 
                            ${size * 0.7},${size * 0.58} ${size * 0.65},${size * 0.55} ${size * 0.6},${size * 0.58} ${size * 0.62},${size * 0.53}
                            ${size * 0.58},${size * 0.5} ${size * 0.63},${size * 0.5}`} 
                    fill={style.metal} />
          </g>
        )}
        
        {/* Shield mounting hardware */}
        <circle cx={size * 0.5} cy={size * 0.18} r={size * 0.02} fill={style.rim.dark} />
        <circle cx={size * 0.5} cy={size * 0.18} r={size * 0.015} fill={style.rim.base} />
        
        {/* Dimensional shading */}
        <path d={`M ${size * 0.22} ${size * 0.25} L ${size * 0.22} ${size * 0.6} Q ${size * 0.22} ${size * 0.72} ${size * 0.35} ${size * 0.75}`}
              fill="none" stroke="#000000" strokeWidth={size * 0.005} opacity={0.3} />
        
        {/* Metallic shine on rim */}
        <path d={`M ${size * 0.35} ${size * 0.17} Q ${size * 0.25} ${size * 0.17} ${size * 0.25} ${size * 0.3} L ${size * 0.25} ${size * 0.35}`}
              fill="none" stroke={style.rim.light} strokeWidth={size * 0.008} opacity={0.8} />
      </g>
    </svg>
  );
};
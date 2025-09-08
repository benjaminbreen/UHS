/**
 * BellOverlay.tsx - Magnificent Stardew Valley/FF6 style bell with cultural variations
 * Rich detail, impressive size extending above tile, beautiful metallic finishes
 */

import React from 'react';
import { getPixelColors, PIXEL_SHADOWS, MATERIAL_COLORS } from '../PixelArtStyleGuide';

interface BellOverlayProps {
  x: number;
  y: number;
  size: number;
  culturalZone?: string;
  era?: number;
}

export const BellOverlay: React.FC<BellOverlayProps> = ({ 
  x, 
  y, 
  size,
  culturalZone = 'EUROPEAN',
  era = 1500
}) => {
  const getBellStyle = () => {
    switch (culturalZone) {
      case 'EUROPEAN':
        // Gothic cathedral bell - ornate bronze with Latin inscriptions
        return {
          metal: MATERIAL_COLORS.metal.bronze,
          accent: MATERIAL_COLORS.metal.gold,
          mount: getPixelColors('#4A3C2A'), // Dark oak wood
          style: 'cathedral',
          inscription: 'VOX DEI',
          hasRelief: true,
          size: 'massive'
        };
      
      case 'EAST_ASIAN':
        // Buddhist temple bell (Bonshō) - green patina bronze
        return {
          metal: getPixelColors('#2F4F4F'), // Dark slate with patina
          accent: getPixelColors('#3CB371'), // Verdigris patina
          mount: getPixelColors('#8B4513'), // Lacquered wood
          style: 'bonsho',
          inscription: '南無阿弥陀仏',
          hasRelief: true,
          size: 'huge'
        };
      
      case 'MENA':
        // Islamic brass bell with geometric patterns
        return {
          metal: MATERIAL_COLORS.metal.brass,
          accent: getPixelColors('#4169E1'), // Lapis lazuli inlay
          mount: MATERIAL_COLORS.metal.iron,
          style: 'geometric',
          inscription: 'الله',
          hasRelief: false,
          size: 'large'
        };
      
      case 'SOUTH_ASIAN':
        // Hindu temple bell (Ghanta) with decorative crown
        return {
          metal: MATERIAL_COLORS.metal.brass,
          accent: getPixelColors('#DC143C'), // Ruby red
          mount: MATERIAL_COLORS.metal.gold, // Gold mount
          style: 'ghanta',
          inscription: 'ॐ',
          hasRelief: true,
          size: 'medium'
        };
      
      case 'MESOAMERICAN':
        // Aztec ceremonial bell with jade accents
        return {
          metal: MATERIAL_COLORS.metal.copper,
          accent: getPixelColors('#00CED1'), // Turquoise
          mount: getPixelColors('#8B4513'), // Wood
          style: 'ceremonial',
          inscription: '',
          hasRelief: true,
          size: 'large'
        };
      
      default:
        return {
          metal: MATERIAL_COLORS.metal.iron,
          accent: MATERIAL_COLORS.metal.steel,
          mount: getPixelColors('#654321'),
          style: 'simple',
          inscription: '',
          hasRelief: false,
          size: 'medium'
        };
    }
  };
  
  const style = getBellStyle();
  // Bell extends 30% above tile for impressive height
  const bellHeight = style.size === 'massive' ? 1.4 : style.size === 'huge' ? 1.35 : style.size === 'large' ? 1.25 : 1.15;
  const bellTop = -size * (bellHeight - 1); // Negative to extend above tile
  
  return (
    <svg x={x} y={y + bellTop} width={size} height={size * bellHeight} viewBox={`0 0 ${size} ${size * bellHeight}`}>
      <g filter={PIXEL_SHADOWS.hard}>
        {/* Enhanced shadow with gradient */}
        <defs>
          <radialGradient id={`bell-shadow-${x}-${y}`}>
            <stop offset="0%" stopColor="#000000" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.15" />
          </radialGradient>
        </defs>
        
        <ellipse 
          cx={size * 0.54} 
          cy={size * (bellHeight - 0.1)} 
          rx={size * 0.35} 
          ry={size * 0.12} 
          fill={`url(#bell-shadow-${x}-${y})`}
        />
        
        {/* Ornate mounting structure */}
        {style.style === 'cathedral' && (
          <g>
            {/* Gothic arch mount */}
            <path d={`M ${size * 0.3} ${size * 0.15} L ${size * 0.35} ${size * 0.05} L ${size * 0.65} ${size * 0.05} L ${size * 0.7} ${size * 0.15}`}
                  fill={style.mount.dark} strokeWidth={2} stroke={style.mount.shadow} />
            <rect x={size * 0.35} y={size * 0.05} width={size * 0.3} height={size * 0.1} fill={style.mount.base} />
            {/* Decorative cross on top */}
            <rect x={size * 0.49} y={0} width={size * 0.02} height={size * 0.08} fill={style.accent.base} />
            <rect x={size * 0.47} y={size * 0.02} width={size * 0.06} height={size * 0.02} fill={style.accent.base} />
          </g>
        )}
        
        {style.style === 'bonsho' && (
          <g>
            {/* Japanese temple bell mount with dragon hook */}
            <ellipse cx={size * 0.5} cy={size * 0.12} rx={size * 0.25} ry={size * 0.05} fill={style.mount.dark} />
            <ellipse cx={size * 0.5} cy={size * 0.1} rx={size * 0.22} ry={size * 0.04} fill={style.mount.base} />
            {/* Dragon head hook */}
            <path d={`M ${size * 0.45} ${size * 0.08} Q ${size * 0.4} ${size * 0.05} ${size * 0.42} ${size * 0.02}`}
                  fill="none" stroke={style.accent.base} strokeWidth={2} />
            <path d={`M ${size * 0.55} ${size * 0.08} Q ${size * 0.6} ${size * 0.05} ${size * 0.58} ${size * 0.02}`}
                  fill="none" stroke={style.accent.base} strokeWidth={2} />
          </g>
        )}
        
        {/* Chain or rope */}
        <rect x={size * 0.48} y={size * 0.12} width={size * 0.04} height={size * 0.15} fill={style.mount.shadow} />
        <rect x={size * 0.49} y={size * 0.12} width={size * 0.02} height={size * 0.15} fill={style.mount.base} />
        
        {/* Main bell body with proper curves */}
        <path
          d={`
            M ${size * 0.5} ${size * 0.25}
            C ${size * 0.25} ${size * 0.25}, ${size * 0.15} ${size * 0.45}, ${size * 0.18} ${size * 0.85}
            Q ${size * 0.2} ${size * 0.95} ${size * 0.25} ${size * 0.98}
            L ${size * 0.75} ${size * 0.98}
            Q ${size * 0.8} ${size * 0.95} ${size * 0.82} ${size * 0.85}
            C ${size * 0.85} ${size * 0.45}, ${size * 0.75} ${size * 0.25}, ${size * 0.5} ${size * 0.25}
            Z
          `}
          fill={style.metal.base}
        />
        
        {/* Metallic gradient overlay */}
        <defs>
          <linearGradient id={`bell-metal-${x}-${y}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={style.metal.highlight} stopOpacity="0.6" />
            <stop offset="50%" stopColor={style.metal.light} stopOpacity="0.3" />
            <stop offset="100%" stopColor={style.metal.shadow} stopOpacity="0.5" />
          </linearGradient>
        </defs>
        
        <path
          d={`
            M ${size * 0.5} ${size * 0.25}
            C ${size * 0.25} ${size * 0.25}, ${size * 0.15} ${size * 0.45}, ${size * 0.18} ${size * 0.85}
            Q ${size * 0.2} ${size * 0.95} ${size * 0.25} ${size * 0.98}
            L ${size * 0.75} ${size * 0.98}
            Q ${size * 0.8} ${size * 0.95} ${size * 0.82} ${size * 0.85}
            C ${size * 0.85} ${size * 0.45}, ${size * 0.75} ${size * 0.25}, ${size * 0.5} ${size * 0.25}
            Z
          `}
          fill={`url(#bell-metal-${x}-${y})`}
        />
        
        {/* Top crown detail */}
        <ellipse cx={size * 0.5} cy={size * 0.25} rx={size * 0.2} ry={size * 0.05} fill={style.metal.dark} />
        <ellipse cx={size * 0.5} cy={size * 0.24} rx={size * 0.18} ry={size * 0.04} fill={style.metal.base} />
        <ellipse cx={size * 0.5} cy={size * 0.23} rx={size * 0.15} ry={size * 0.03} fill={style.metal.light} opacity={0.8} />
        
        {/* Relief patterns based on culture */}
        {style.hasRelief && style.style === 'cathedral' && (
          <g opacity={0.7}>
            {/* Gothic arches relief */}
            <path d={`M ${size * 0.3} ${size * 0.5} Q ${size * 0.35} ${size * 0.45} ${size * 0.4} ${size * 0.5}`}
                  fill="none" stroke={style.accent.base} strokeWidth={1} />
            <path d={`M ${size * 0.6} ${size * 0.5} Q ${size * 0.65} ${size * 0.45} ${size * 0.7} ${size * 0.5}`}
                  fill="none" stroke={style.accent.base} strokeWidth={1} />
            {/* Latin inscription band */}
            <rect x={size * 0.25} y={size * 0.6} width={size * 0.5} height={size * 0.04} fill={style.accent.dark} opacity={0.4} />
            <text x={size * 0.5} y={size * 0.625} fontSize={size * 0.03} fill={style.accent.light} textAnchor="middle">{style.inscription}</text>
          </g>
        )}
        
        {style.hasRelief && style.style === 'bonsho' && (
          <g opacity={0.6}>
            {/* Buddhist lotus petals */}
            {[0, 1, 2, 3, 4, 5].map(i => (
              <ellipse key={i} 
                cx={size * 0.5} 
                cy={size * 0.7} 
                rx={size * 0.03} 
                ry={size * 0.08}
                transform={`rotate(${i * 60} ${size * 0.5} ${size * 0.7})`}
                fill="none" 
                stroke={style.accent.base} 
                strokeWidth={0.5} />
            ))}
            {/* Japanese inscription */}
            <text x={size * 0.5} y={size * 0.5} fontSize={size * 0.04} fill={style.accent.base} textAnchor="middle">{style.inscription}</text>
          </g>
        )}
        
        {style.style === 'geometric' && (
          <g opacity={0.8}>
            {/* Islamic geometric pattern */}
            <rect x={size * 0.25} y={size * 0.45} width={size * 0.5} height={size * 0.03} fill={style.accent.base} />
            <rect x={size * 0.25} y={size * 0.55} width={size * 0.5} height={size * 0.03} fill={style.accent.base} />
            {[0, 1, 2, 3, 4].map(i => (
              <rect key={i} x={size * (0.3 + i * 0.08)} y={size * 0.49} width={size * 0.03} height={size * 0.05} fill={style.accent.light} />
            ))}
            <text x={size * 0.5} y={size * 0.7} fontSize={size * 0.05} fill={style.accent.base} textAnchor="middle">{style.inscription}</text>
          </g>
        )}
        
        {style.style === 'ghanta' && (
          <g>
            {/* Hindu decorative crown on top */}
            <circle cx={size * 0.5} cy={size * 0.2} r={size * 0.05} fill={style.accent.base} />
            {/* Om symbol */}
            <text x={size * 0.5} y={size * 0.5} fontSize={size * 0.06} fill={style.accent.base} textAnchor="middle">{style.inscription}</text>
            {/* Decorative bands */}
            <rect x={size * 0.22} y={size * 0.4} width={size * 0.56} height={size * 0.02} fill={style.accent.light} opacity={0.6} />
            <rect x={size * 0.22} y={size * 0.6} width={size * 0.56} height={size * 0.02} fill={style.accent.light} opacity={0.6} />
          </g>
        )}
        
        {/* Bottom rim with proper perspective */}
        <ellipse cx={size * 0.5} cy={size * 0.98} rx={size * 0.32} ry={size * 0.08} fill={style.metal.shadow} />
        <ellipse cx={size * 0.5} cy={size * 0.97} rx={size * 0.3} ry={size * 0.07} fill={style.metal.dark} />
        
        {/* Large impressive clapper */}
        <rect x={size * 0.49} y={size * 0.4} width={size * 0.02} height={size * 0.6} fill={style.metal.shadow} />
        <circle cx={size * 0.5} cy={size * 1.02} r={size * 0.06} fill={style.metal.dark} />
        <circle cx={size * 0.5} cy={size * 1.01} r={size * 0.05} fill={style.metal.shadow} />
        
        {/* Highlight for 3D effect */}
        <ellipse cx={size * 0.35} cy={size * 0.4} rx={size * 0.08} ry={size * 0.2} fill={style.metal.highlight} opacity={0.3} />
        
        {/* Sound waves animation placeholder */}
        {style.size === 'massive' && (
          <g opacity={0.2}>
            <circle cx={size * 0.5} cy={size * 0.9} r={size * 0.4} fill="none" stroke={style.accent.base} strokeWidth={0.5} />
            <circle cx={size * 0.5} cy={size * 0.9} r={size * 0.5} fill="none" stroke={style.accent.base} strokeWidth={0.3} />
          </g>
        )}
      </g>
    </svg>
  );
};
/**
 * TableSymbol.tsx
 * Beautiful pixel art table with proper 3/4 perspective and shadows
 * Fills entire tile with depth and dimension
 */

import React from 'react';
import { CulturalZone, HistoricalEra } from '../../../../types';

interface TableSymbolProps {
  x?: number;
  y?: number;
  size?: number;
  culturalZone: CulturalZone | string;
  era: HistoricalEra | number;
  variant?: 'dining' | 'work' | 'ceremonial' | 'market';
  orientation?: 'horizontal' | 'vertical';
  seed?: number;
}

export const TableSymbol: React.FC<TableSymbolProps> = ({ 
  x = 0,
  y = 0,
  size = 32,
  culturalZone, 
  era, 
  variant = 'dining',
  orientation = 'horizontal',
  seed = 0
}) => {
  // Scale for clean pixel art rendering
  const scale = size / 32;
  
  const getTableStyle = () => {
    switch (culturalZone) {
      case 'EUROPEAN':
        if (era === 'MEDIEVAL' || era === 1200) {
          return {
            // Rich wood tones with proper shading
            topColor: '#8B6F47',       // Medium brown wood
            lightColor: '#A0826D',     // Light wood highlight
            edgeColor: '#6B4F3F',      // Dark wood edge
            shadowColor: '#4A3A2A',    // Deep shadow
            legColor: '#5A4433',       // Leg color
            hasCloth: false
          };
        } else if (era === 'RENAISSANCE_EARLY_MODERN' || era === 1500) {
          return {
            topColor: '#7A5C3A',       // Polished walnut
            lightColor: '#9A7C5A',     // Light walnut
            edgeColor: '#5A3C2A',      // Dark walnut edge
            shadowColor: '#3A2C1A',    // Deep shadow
            legColor: '#4A3322',       // Dark legs
            hasCloth: variant === 'dining',
            clothColor: '#8B2C3C',     // Rich burgundy
            clothLight: '#AB4C5C'      // Cloth highlight
          };
        } else {
          return {
            topColor: '#9A8266',       // Modern light wood
            lightColor: '#BAA286',     // Very light wood
            edgeColor: '#7A6246',      // Medium edge
            shadowColor: '#5A4226',    // Shadow
            legColor: '#4A4A4A',       // Metal legs
            hasCloth: false
          };
        }
        
      case 'EAST_ASIAN':
        return {
          topColor: '#A02020',        // Red lacquer
          lightColor: '#C04040',      // Light lacquer
          edgeColor: '#701010',       // Dark red edge
          shadowColor: '#400808',     // Deep red shadow
          legColor: '#601818',        // Red-black legs
          hasCloth: false,
          isLow: true                  // Low table
        };
        
      case 'MENA':
        return {
          topColor: '#C8A858',        // Brass/gold
          lightColor: '#E8C878',      // Light brass
          edgeColor: '#A88838',       // Dark brass
          shadowColor: '#886818',     // Deep brass shadow
          legColor: '#7A5A0A',        // Very dark brass
          hasCloth: variant === 'ceremonial',
          clothColor: '#5A2A7A',      // Royal purple
          clothLight: '#7A4A9A',      // Light purple
          hasPattern: true
        };
        
      case 'SOUTH_ASIAN':
        return {
          topColor: '#9A6633',        // Carved teak
          lightColor: '#BA8653',      // Light teak
          edgeColor: '#7A4613',       // Dark teak
          shadowColor: '#5A2603',     // Deep shadow
          legColor: '#6A3613',        // Dark legs
          hasCloth: false,
          isLow: true,
          hasCarving: true
        };
        
      default:
        return {
          topColor: '#8A6C4A',
          lightColor: '#AA8C6A',
          edgeColor: '#6A4C2A',
          shadowColor: '#4A2C0A',
          legColor: '#5A3C1A',
          hasCloth: false
        };
    }
  };

  const style = getTableStyle();
  
  // Beautiful pixel art table with proper perspective and shadows
  const renderTable = () => {
    return (
      <g transform={`scale(${scale})`}>
        {/* Cast shadow on ground (45° down-right) */}
        <rect 
          x={18} y={20} 
          width={12} height={8} 
          fill="#000000" 
          opacity={0.2}
          rx={0.5}
        />
        
        {/* Table legs - back legs (visible parts) */}
        {!style.isLow && (
          <>
            {/* Back left leg */}
            <rect x={4} y={8} width={3} height={12} fill={style.legColor} />
            <rect x={4} y={8} width={1} height={12} fill={style.shadowColor} />
            
            {/* Back right leg */}
            <rect x={25} y={8} width={3} height={12} fill={style.legColor} />
            <rect x={27} y={8} width={1} height={12} fill={style.shadowColor} />
          </>
        )}
        
        {/* Table top surface - main area */}
        <rect x={2} y={6} width={28} height={12} fill={style.topColor} />
        
        {/* Table top highlight (light hitting surface) */}
        <rect x={3} y={7} width={26} height={2} fill={style.lightColor} />
        
        {/* Wood grain detail (subtle) */}
        <rect x={5} y={10} width={22} height={1} fill={style.edgeColor} opacity={0.3} />
        <rect x={4} y={13} width={24} height={1} fill={style.edgeColor} opacity={0.2} />
        
        {/* Table front edge (3D thickness) */}
        <rect x={2} y={18} width={28} height={3} fill={style.edgeColor} />
        <rect x={2} y={20} width={28} height={1} fill={style.shadowColor} />
        
        {/* Table side edge (right side perspective) */}
        <polygon 
          points="30,6 32,8 32,20 30,18" 
          fill={style.edgeColor}
        />
        <polygon 
          points="30,18 32,20 32,21 30,21" 
          fill={style.shadowColor}
        />
        
        {/* Front legs (visible in front) */}
        {!style.isLow && (
          <>
            {/* Front left leg */}
            <rect x={4} y={18} width={3} height={8} fill={style.legColor} />
            <rect x={6} y={18} width={1} height={8} fill={style.lightColor} opacity={0.5} />
            <rect x={4} y={18} width={1} height={8} fill={style.shadowColor} />
            
            {/* Front right leg */}
            <rect x={25} y={18} width={3} height={8} fill={style.legColor} />
            <rect x={27} y={18} width={1} height={8} fill={style.lightColor} opacity={0.5} />
            <rect x={25} y={18} width={1} height={8} fill={style.shadowColor} />
          </>
        )}
        
        {/* Tablecloth overlay if applicable */}
        {style.hasCloth && (
          <g>
            <rect x={3} y={8} width={26} height={9} fill={style.clothColor} opacity={0.9} />
            <rect x={3} y={8} width={26} height={2} fill={style.clothLight} opacity={0.7} />
            {/* Cloth draping over edge */}
            <rect x={2} y={17} width={28} height={3} fill={style.clothColor} opacity={0.7} />
            <rect x={2} y={19} width={28} height={1} fill={style.clothColor} opacity={0.5} />
            {/* Fold shadows */}
            <rect x={10} y={12} width={1} height={5} fill={style.shadowColor} opacity={0.2} />
            <rect x={20} y={12} width={1} height={5} fill={style.shadowColor} opacity={0.2} />
          </g>
        )}
        
        {/* Decorative patterns for MENA tables */}
        {style.hasPattern && (
          <g>
            <rect x={8} y={10} width={2} height={2} fill="#FFD700" opacity={0.5} />
            <rect x={14} y={10} width={2} height={2} fill="#FFD700" opacity={0.5} />
            <rect x={20} y={10} width={2} height={2} fill="#FFD700" opacity={0.5} />
            <rect x={11} y={13} width={2} height={2} fill="#FFD700" opacity={0.4} />
            <rect x={17} y={13} width={2} height={2} fill="#FFD700" opacity={0.4} />
          </g>
        )}
        
        {/* Carved details for South Asian tables */}
        {style.hasCarving && (
          <g>
            <rect x={5} y={9} width={22} height={1} fill={style.shadowColor} opacity={0.3} />
            <rect x={6} y={11} width={20} height={1} fill={style.shadowColor} opacity={0.2} />
            <rect x={5} y={14} width={22} height={1} fill={style.shadowColor} opacity={0.3} />
            {/* Carved leg details */}
            <rect x={5} y={20} width={1} height={4} fill={style.shadowColor} opacity={0.4} />
            <rect x={26} y={20} width={1} height={4} fill={style.shadowColor} opacity={0.4} />
          </g>
        )}
        
        {/* Items on table based on variant */}
        {variant === 'work' && !style.hasCloth && (
          <g>
            {/* Stack of books/scrolls */}
            <rect x={7} y={10} width={4} height={3} fill="#D2B48C" />
            <rect x={7} y={12} width={4} height={1} fill="#B8956A" />
            {/* Ink pot */}
            <rect x={20} y={11} width={2} height={2} fill="#2A2A2A" />
            <rect x={20} y={10} width={2} height={1} fill="#3A3A3A" />
            {/* Quill */}
            <rect x={22} y={8} width={1} height={4} fill="#F5F5DC" />
          </g>
        )}
        
        {variant === 'market' && !style.hasCloth && (
          <g>
            {/* Various market goods */}
            <rect x={6} y={10} width={3} height={3} fill="#CD5C5C" />
            <rect x={11} y={11} width={3} height={2} fill="#FFD700" />
            <rect x={17} y={10} width={3} height={3} fill="#90EE90" />
            <rect x={23} y={11} width={3} height={2} fill="#DDA0DD" />
          </g>
        )}
        
        {variant === 'dining' && !style.hasCloth && (
          <g>
            {/* Plates */}
            <ellipse cx={10} cy={12} rx={2} ry={1} fill="#F5F5F5" />
            <ellipse cx={22} cy={12} rx={2} ry={1} fill="#F5F5F5" />
            {/* Food */}
            <rect x={9} y={11} width={2} height={1} fill="#8B4513" />
            <rect x={21} y={11} width={2} height={1} fill="#D2691E" />
            {/* Goblets */}
            <rect x={15} y={11} width={1} height={2} fill="#C0C0C0" />
            <rect x={16} y={11} width={1} height={2} fill="#C0C0C0" />
          </g>
        )}
        
        {variant === 'ceremonial' && (
          <g>
            {/* Ceremonial chalice/artifact in center */}
            <rect x={14} y={10} width={4} height={1} fill="#FFD700" />
            <rect x={15} y={11} width={2} height={3} fill="#FFD700" />
            <rect x={13} y={14} width={6} height={1} fill="#FFD700" />
            {/* Glow effect */}
            <rect x={14} y={9} width={4} height={1} fill="#FFED4E" opacity={0.5} />
          </g>
        )}
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
      {renderTable()}
    </svg>
  );
};
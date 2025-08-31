/**
 * ChairSymbol.tsx - Culturally-specific chair with 3D perspective
 * Stardew Valley inspired dollhouse view
 */
import React from 'react';

interface ChairSymbolProps {
  x: number;
  y: number;
  size: number;
  culturalZone?: string;
  era?: number;
  facing?: 'north' | 'south' | 'east' | 'west';
  type?: 'simple' | 'ornate' | 'throne' | 'stool' | 'bench';
  opacity?: number;
}

const ChairSymbol: React.FC<ChairSymbolProps> = ({ 
  x, 
  y, 
  size, 
  culturalZone = 'EUROPEAN',
  era = 1500,
  facing = 'south',
  type,
  opacity = 1.0 
}) => {
  // Determine chair style based on culture and era
  const getChairStyle = () => {
    if (type) return type;
    
    if (era < -1000) return 'stool'; // Ancient times
    if (era < 500) return 'simple';
    if (era < 1500) return culturalZone === 'EUROPEAN' ? 'ornate' : 'simple';
    return 'ornate';
  };

  const chairStyle = getChairStyle();

  // Get materials/colors based on culture
  const getMaterials = () => {
    switch (culturalZone?.toUpperCase()) {
      case 'EAST_ASIAN':
        return {
          wood: '#4a2c1c',
          woodLight: '#6b3e2a',
          cushion: '#8b0000',
          accent: '#d4af37'
        };
      case 'MENA':
        return {
          wood: '#5c3a24',
          woodLight: '#7a4e32',
          cushion: '#4b0082',
          accent: '#ffd700'
        };
      case 'AFRICAN':
        return {
          wood: '#3e2818',
          woodLight: '#5a3c24',
          cushion: '#b8860b',
          accent: '#cd7f32'
        };
      case 'AMERICAS':
        return {
          wood: '#654321',
          woodLight: '#8b5a3c',
          cushion: '#dc143c',
          accent: '#f4a460'
        };
      case 'OCEANIA':
        return {
          wood: '#4a3020',
          woodLight: '#644028',
          cushion: '#ff6347',
          accent: '#daa520'
        };
      default: // EUROPEAN
        return {
          wood: '#3e2e1c',
          woodLight: '#5c452b',
          cushion: '#800020',
          accent: '#d4af37'
        };
    }
  };

  const materials = getMaterials();

  const renderChair = () => {
    // Rotate based on facing direction
    const rotation = {
      north: 180,
      south: 0,
      east: 270,
      west: 90
    }[facing];

    switch (chairStyle) {
      case 'stool':
        return (
          <g transform={`rotate(${rotation} ${size/2} ${size/2})`}>
            {/* Simple round stool */}
            <ellipse cx={size/2} cy={size*0.6} rx={size*0.35} ry={size*0.25} fill={materials.wood} />
            <ellipse cx={size/2} cy={size*0.58} rx={size*0.35} ry={size*0.25} fill={materials.woodLight} />
            
            {/* Legs */}
            <rect x={size*0.25} y={size*0.6} width={3} height={size*0.3} fill={materials.wood} />
            <rect x={size*0.72} y={size*0.6} width={3} height={size*0.3} fill={materials.wood} />
            
            {/* Shadow */}
            <ellipse cx={size/2} cy={size*0.92} rx={size*0.3} ry={size*0.1} fill="black" opacity={0.3} />
          </g>
        );
      
      case 'simple':
        return (
          <g transform={`rotate(${rotation} ${size/2} ${size/2})`}>
            {/* Back */}
            <rect x={size*0.2} y={size*0.1} width={size*0.6} height={size*0.4} fill={materials.wood} />
            
            {/* Back slats */}
            <rect x={size*0.35} y={size*0.15} width={2} height={size*0.3} fill={materials.woodLight} />
            <rect x={size*0.48} y={size*0.15} width={2} height={size*0.3} fill={materials.woodLight} />
            <rect x={size*0.61} y={size*0.15} width={2} height={size*0.3} fill={materials.woodLight} />
            
            {/* Seat */}
            <rect x={size*0.2} y={size*0.5} width={size*0.6} height={size*0.15} fill={materials.wood} />
            <rect x={size*0.2} y={size*0.5} width={size*0.6} height={size*0.12} fill={materials.woodLight} />
            
            {/* Front legs */}
            <rect x={size*0.25} y={size*0.62} width={3} height={size*0.3} fill={materials.wood} />
            <rect x={size*0.72} y={size*0.62} width={3} height={size*0.3} fill={materials.wood} />
            
            {/* Back legs */}
            <rect x={size*0.25} y={size*0.1} width={3} height={size*0.52} fill={materials.wood} />
            <rect x={size*0.72} y={size*0.1} width={3} height={size*0.52} fill={materials.wood} />
            
            {/* Shadow */}
            <ellipse cx={size/2} cy={size*0.92} rx={size*0.35} ry={size*0.12} fill="black" opacity={0.3} />
          </g>
        );
      
      case 'ornate':
        return (
          <g transform={`rotate(${rotation} ${size/2} ${size/2})`}>
            {/* Ornate back with curves */}
            <path 
              d={`M ${size*0.15} ${size*0.35} 
                  Q ${size*0.15} ${size*0.05}, ${size*0.5} ${size*0.05}
                  Q ${size*0.85} ${size*0.05}, ${size*0.85} ${size*0.35}
                  L ${size*0.85} ${size*0.5}
                  L ${size*0.15} ${size*0.5} Z`}
              fill={materials.wood}
            />
            
            {/* Back decoration */}
            {culturalZone === 'EAST_ASIAN' ? (
              // Asian lattice pattern
              <g>
                <rect x={size*0.3} y={size*0.15} width={1} height={size*0.3} fill={materials.accent} opacity={0.5} />
                <rect x={size*0.5} y={size*0.15} width={1} height={size*0.3} fill={materials.accent} opacity={0.5} />
                <rect x={size*0.7} y={size*0.15} width={1} height={size*0.3} fill={materials.accent} opacity={0.5} />
                <rect x={size*0.25} y={size*0.25} width={size*0.5} height={1} fill={materials.accent} opacity={0.5} />
              </g>
            ) : culturalZone === 'MENA' ? (
              // Islamic star pattern
              <polygon 
                points={`${size/2},${size*0.15} ${size*0.6},${size*0.25} ${size*0.6},${size*0.35} ${size/2},${size*0.45} ${size*0.4},${size*0.35} ${size*0.4},${size*0.25}`}
                fill={materials.accent} 
                opacity={0.4}
              />
            ) : (
              // European carved pattern
              <circle cx={size/2} cy={size*0.3} r={size*0.08} fill="none" stroke={materials.accent} strokeWidth={1} opacity={0.4} />
            )}
            
            {/* Cushioned seat */}
            <ellipse cx={size/2} cy={size*0.57} rx={size*0.32} ry={size*0.15} fill={materials.cushion} />
            <ellipse cx={size/2} cy={size*0.55} rx={size*0.32} ry={size*0.15} fill={materials.cushion} opacity={0.8} />
            
            {/* Seat frame */}
            <rect x={size*0.18} y={size*0.62} width={size*0.64} height={3} fill={materials.wood} />
            
            {/* Ornate legs with carved details */}
            <rect x={size*0.22} y={size*0.65} width={4} height={size*0.27} fill={materials.wood} />
            <rect x={size*0.74} y={size*0.65} width={4} height={size*0.27} fill={materials.wood} />
            <rect x={size*0.22} y={size*0.1} width={4} height={size*0.55} fill={materials.wood} />
            <rect x={size*0.74} y={size*0.1} width={4} height={size*0.55} fill={materials.wood} />
            
            {/* Leg decorations */}
            <circle cx={size*0.24} cy={size*0.88} r={2} fill={materials.accent} opacity={0.5} />
            <circle cx={size*0.76} cy={size*0.88} r={2} fill={materials.accent} opacity={0.5} />
            
            {/* Arms (for armchair style) */}
            {era > 1000 && (
              <g>
                <rect x={size*0.15} y={size*0.45} width={size*0.1} height={size*0.15} fill={materials.wood} />
                <rect x={size*0.75} y={size*0.45} width={size*0.1} height={size*0.15} fill={materials.wood} />
              </g>
            )}
            
            {/* Shadow with gradient */}
            <ellipse cx={size/2} cy={size*0.93} rx={size*0.38} ry={size*0.13} fill="black" opacity={0.35} />
            
            {/* Highlights */}
            <rect x={size*0.22} y={size*0.1} width={2} height={size*0.35} fill="white" opacity={0.1} />
            <ellipse cx={size/2} cy={size*0.55} rx={size*0.25} ry={size*0.1} fill="white" opacity={0.15} />
          </g>
        );
      
      default:
        return renderChair(); // Fallback to simple chair
    }
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
        {renderChair()}
      </g>
    </svg>
  );
};

export default ChairSymbol;